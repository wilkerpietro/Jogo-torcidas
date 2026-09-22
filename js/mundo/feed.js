/* =========================================================
   FEED — o esqueleto do jogo, e nada além dele
   ---------------------------------------------------------
   Reescrito do zero. Este feed carrega SOMENTE as mensagens
   do fluxo-base definido pelo dono do jogo:

   · o OLHEIRO, que nunca falha, nas três situações — (1)
     mandantes contra rival, (2) outro jogo com rival na
     cidade, (3) visitantes contra clube de torcida rival —
     sempre com estimativa de efetivo e as opções de ataque;
   · a convocação de IR PRA GUERRA no dia do ataque marcado;
   · o ataque-surpresa SOFRIDO (bar/loja em dia comum,
     concentração em casa, pista a caminho do jogo, estrada
     na caravana);
   · o RESULTADO de todo confronto, com feridos de cada lado
     e quem saiu vencedor;
   · o PLACAR do nosso jogo na noite dele;
   · o RESUMO dos jogos do dia, nossa cidade primeiro, com o
     caminho pra Ver Competições;
   · a briga da ESCOLTA: aliado hospedado/escoltado atacado
     na nossa cidade.

   NENHUMA outra notícia entra aqui sem passar pelo crivo do
   dono. Toda notícia colateral futura é aditiva e jamais
   atrasa, substitui ou se sobrepõe a estas.

   O RITMO: cada mensagem dropada segura a próxima por 1,5s
   (quem cronometra é a casca em main.js — aqui mora a fila).
   Decisão sem resposta trava o relógio do jogo.
   ========================================================= */
window.TO = window.TO || {};

TO.feed = (function(){
  const U = TO.util;
  const M  = () => TO.mundo;
  const PL = () => TO.planejamento;

  const INTERVALO_DROP = 1500;      // ms entre uma mensagem e a próxima
  /* o corte da provocação do rival, na régua de 0 a 100 do dono:
     abaixo disso a briga foi pequena demais pra render recado */
  const PROVOCA_REGUA = 3.5;

  /* -------------------------------------------------------
     A CAIXA DE MENSAGENS
     `E.feed` é o histórico (a mais nova primeiro); `E.feedFila`
     é o que já nasceu e ainda não caiu na tela.
     ------------------------------------------------------- */
  function caixas(E){
    if(!Array.isArray(E.feed)) E.feed = [];
    if(!Array.isArray(E.feedFila)) E.feedFila = [];
    if(!Array.isArray(E.mensagens)) E.mensagens = [];
    E.feedSeq = E.feedSeq || 1;
    return E;
  }

  /* =======================================================
     MENSAGENS ENTRE TORCIDAS (pedido do dono, 08/09/2026)
     O recado de outra torcida não é notícia do feed: mora numa
     caixa própria (Notícias → Mensagens), com remetente, data e
     texto. Provocação, convite de aniversário, agradecimento pela
     presença na festa, agradecimento por receber na nossa cidade e
     o "estamos juntos" de quem recebe a gente na cidade dela. A
     casca (main.js) pendura em `aoChegarMensagem` o aviso ao lado
     do ícone e o número vermelho.
     ======================================================= */
  const ganchos = {aoChegarMensagem:null, aoSairTreta:null};
  function mensagemDe(E, torcidaId, texto, tipo, extra){
    caixas(E);
    const o = M().torcida(torcidaId);
    if(!o || !texto) return null;
    extra = extra || {};
    /* chave: a mesma mensagem não sai duas vezes (pedido da semana, trégua do ano) */
    if(extra.chave && E.mensagens.some(x=>x.chave === extra.chave)) return null;
    /* a mesma torcida não repete o mesmo recado no mesmo dia (duas
       brigas com ela no mesmo dia davam a mesma provocação em dobro) */
    const abs = E.data.absoluto||0;
    if(E.mensagens.some(x=>x.de===torcidaId && x.texto===texto && (x.quando||{}).abs===abs))
      return null;
    const m = {id: E.feedSeq++, de:torcidaId, nome:o.nome, texto, tipo:tipo||'recado',
               chave: extra.chave || null, dados: extra.dados || null, resposta:null,
               quando:{ano:E.data.ano, semana:E.data.semana, dia:E.data.dia,
                       abs:E.data.absoluto||0}, lida:false};
    E.mensagens.unshift(m);
    if(E.mensagens.length > 200) E.mensagens.length = 200;
    try{ if(ganchos.aoChegarMensagem) ganchos.aoChegarMensagem(E, m); }catch(_){}
    return m;
  }
  const mensagensNaoLidas = E => (caixas(E), E.mensagens.filter(m=>!m.lida).length);
  function lerMensagens(E){ caixas(E); for(const m of E.mensagens) m.lida = true; }

  /* =======================================================
     O LOTE DE BRIGAS DO DIA DE JOGO (pedido do dono, 08/09/2026)
     Três brigas num itinerário eram três notícias. Com o lote
     aberto (a linha do dia abre e fecha), `registrarConfronto`
     faz TUDO o que fazia — anota a briga, tira as baixas deles
     de circulação, alimenta o almanaque, manda a provocação — e
     só guarda a notícia. No fim do dia sai UMA: a página é da
     maior briga, as outras vão numa lista dentro dela, e a linha
     de consequência SOMA os efeitos de todas, indicador por
     indicador. Os efeitos em si já foram aplicados em cada
     fechamento de cena; aqui é só o registro.
     ======================================================= */
  function abrirLote(E){
    caixas(E);
    if(E.loteBrigas && E.loteBrigas.aberto) fecharLote(E);
    E.loteBrigas = {aberto:true, brigas:[]};
  }
  const somarEfeitos = lista =>{
    const soma = new Map();
    for(const ef of lista) for(const x of (ef||[])){
      const k = `${x.ind}|${x.dono||''}`;
      const cur = soma.get(k) || {ind:x.ind, dono:x.dono, delta:0};
      cur.delta = Math.round((cur.delta + (x.delta||0))*100)/100;
      soma.set(k, cur);
    }
    return [...soma.values()].filter(x=>x.delta);
  };
  function fecharLote(E){
    caixas(E);
    const L = E.loteBrigas;
    if(!L || !L.aberto) return null;
    E.loteBrigas = null;
    const brigas = L.brigas || [];
    if(!brigas.length) return null;
    if(brigas.length === 1) return propor(E, brigas[0]);
    /* a maior briga manda na página; as outras vão dentro dela */
    const tam = m => ((m.dados.a||{}).n||0) + ((m.dados.b||{}).n||0);
    const ord = brigas.slice().sort((x,y)=>tam(y)-tam(x));
    const principal = ord[0], outras = ord.slice(1);
    const ganhas = brigas.filter(m=>m.dados.ganhamos).length;
    const efeitos = somarEfeitos(brigas.map(m=>m.efeitos));
    const fA = brigas.reduce((s,m)=>s+((m.dados.a||{}).caidos||0),0);
    const fB = brigas.reduce((s,m)=>s+((m.dados.b||{}).caidos||0),0);
    const pA = brigas.reduce((s,m)=>s+((m.dados.a||{}).presos||0),0);
    const rivais = [...new Set(brigas.map(m=>m.dados.b && m.dados.b.nome).filter(Boolean))];
    return propor(E, Object.assign({}, principal, {
      tipo: ganhas*2 >= brigas.length ? 'boa' : 'ruim',
      texto: `Dia de jogo com ${brigas.length} brigas`+
             (rivais.length ? ` (${rivais.join(', ')})` : '')+
             `: ${fA} ${fA===1?'ferido nosso':'feridos nossos'}, ${fB} do lado deles`+
             (pA ? `, ${pA} ${pA===1?'preso nosso':'presos nossos'}` : '')+
             `. Levamos a melhor em ${ganhas} de ${brigas.length}.`,
      efeitos,
      consequencia: linhaDeConsequencia(efeitos),
      dados: Object.assign({}, principal.dados, {
        outrasNossas: outras.map(m=>Object.assign({}, m.dados, {efeitos:m.efeitos})),
        totalNoite:{brigas:brigas.length, ganhas, feridosNossos:fA, feridosDeles:fB, presosNossos:pA}
      })
    }));
  }

  const MES_NOME = ['janeiro','fevereiro','março','abril','maio','junho','julho',
                    'agosto','setembro','outubro','novembro','dezembro'];
  /* a cidade onde a briga de hoje aconteceu: na viagem, a deles */
  function cidadeDeHoje(E){
    const j = E.proximoJogo;
    if(j && !j.casa && j.cidadeAdv && Math.abs(E.data.dia - (j.dia||6)) <= 1)
      return j.cidadeAdv;
    return TO.financeiro.nomeCidade ? TO.financeiro.nomeCidade(E.torcida.mapa) : E.torcida.mapa;
  }

  /* RESPOSTA A UMA MENSAGEM COM BOTÕES (pedido de recepção, trégua) */
  function responderMensagemDe(E, idMsg, escolha){
    caixas(E);
    const m = E.mensagens.find(x=>x.id === idMsg);
    if(!m || m.resposta) return {ok:false};
    const d = m.dados || {};
    if(m.tipo === 'pedido'){
      PL().definirRecepcao(E, m.de, escolha);
      const r = PL().recepcaoDe(escolha);
      m.resposta = escolha;
      m.consequencia = `${r.rot}: ${r.porCabeca ? U.dinheiro(r.porCabeca * (d.n||0)) + ' no dia do jogo · ' : ''}`+
                       `${r.relacao>0?'+':''}${r.relacao} de relação`;
      return {ok:true};
    }
    if(m.tipo === 'tregua'){
      E.relacoes = E.relacoes || {};
      if(escolha === 'aceitar'){
        E.treguas = E.treguas || {};
        E.treguas[m.de] = E.data.ano;
        E.relacoes[m.de] = U.limitar(TO.relacoes.nivel(E, m.de) + 15, -100, 100);
        /* trégua apaga a dívida dos dois lados */
        if(E.dividas) delete E.dividas[m.de];
        if(TO.relacoes.quitarDividaIA) TO.relacoes.quitarDividaIA(E, m.de, E.torcida.id);
        m.consequencia = 'Trégua até o fim do ano: ninguém procura ninguém. Relação +15.';
      } else {
        E.relacoes[m.de] = U.limitar(TO.relacoes.nivel(E, m.de) - 5, -100, 100);
        m.consequencia = 'Recusada. Relação −5 — e eles sabem.';
      }
      m.resposta = escolha;
      return {ok:true};
    }
    return {ok:false};
  }

  const horaDe = (E, chave) => {
    const h = TO.mapa.hash(`${E.data.absoluto}|${chave}`);
    return `${String(8 + h % 15).padStart(2,'0')}:${String(h % 60).padStart(2,'0')}`;
  };

  /* põe uma mensagem na fila. `msg`: {kind, peso:'info'|'decisao',
     texto, tipo, voz, botoes, links, efeitos, dados} */
  /* =======================================================
     O BOTÃO DE SIMULAR (pedido do dono, 23/08/2026)

     "Um botão de simular em todas as ações de confronto." Em vez de
     escrever o gêmeo à mão em cada mensagem — e esquecer de um —, ele
     nasce aqui, na porta por onde TODA mensagem entra: achou botão que
     abre cena de briga, entra o par dele. Mensagem nova de confronto
     já ganha o Simular sem ninguém lembrar.

     Ficam de fora as que NÃO SÃO a briga, e sim o plano dela:
     `tela-caravana` é a viagem inteira e `tela-ataque` é a emboscada
     marcada pro dia do jogo. Nas duas o confronto nasce lá na frente, e
     um Simular apertado aqui ficaria de pé esperando — na melhor das
     hipóteses simulando a briga errada. Quem pergunta nessas é a
     própria cena, na hora em que ela vai abrir.
     ======================================================= */
  const ACOES_DE_BRIGA = new Set([
    'cena-guerra', 'cena-defesa', 'cena-escolta', 'cena-treta',
    'atacar-bar-rival', 'atacar-casa-rival'
  ]);

  function comSimular(botoes){
    if(!botoes || !botoes.length) return botoes;
    const fora = [];
    for(const b of botoes){
      fora.push(b);
      if(!ACOES_DE_BRIGA.has(b.acao) || b.simular) continue;
      fora.push(Object.assign({}, b, {
        id: b.id + '-sim', rot: 'Simular', simular: true,
        /* a dica diz o que muda e o que não muda */
        dica: 'Roda o duelo sem abrir a cena. As consequências são as mesmas.'
      }));
    }
    return fora;
  }

  function propor(E, msg){
    caixas(E);
    if(msg && msg.botoes) msg = Object.assign({}, msg,
                                              {botoes: comSimular(msg.botoes)});
    const m = Object.assign({
      id: E.feedSeq++,
      quando: {ano:E.data.ano, semana:E.data.semana, dia:E.data.dia,
               abs:E.data.absoluto||0},
      hora: horaDe(E, msg.kind || 'msg'),
      peso: 'info', tipo:'', botoes:null, links:null,
      respondido:null
    }, msg);
    /* nunca a mesma chave duas vezes */
    if(m.chave && (E.feed.some(x=>x.chave===m.chave) ||
                   E.feedFila.some(x=>x.chave===m.chave))) return null;
    E.feedFila.push(m);
    return m;
  }

  /* a casca chama num timer: move UMA mensagem da fila pro feed */
  function dropar(E){
    caixas(E);
    if(travado(E)) return null;
    /* O PROTESTO NA PORTA DO CT SÓ SAI DA FILA SE AINDA VALE (correção
       do dono, 21/09/2026): "meu time ganhou o jogo e mesmo assim
       gerou a mensagem". Ele nasce num dia comum, com 3 derrotas em 5,
       e fica na fila atrás de outra decisão; quando enfim aparece, o
       time já pode ter ganhado — e aparecia em cima da vitória, com a
       sequência velha. Agora, ao sair da fila: se a sequência já não
       é ruim, a mensagem morre; em dia de jogo nosso ela espera (vai
       pro fim da fila — a bola ainda vai rolar); e o texto é reescrito
       com a sequência de hoje. */
    let m = null;
    for(let k = E.feedFila.length; k > 0 && !m; k--){
      const c = E.feedFila.shift();
      if(!c) break;
      if(c.kind === 'protesto-ct'){
        if(TO.relacaoClube && !TO.relacaoClube.sequenciaRuim(E)) continue;
        if(!diaComumFeed(E, E.data.dia)){ E.feedFila.push(c); continue; }
        Object.assign(c, textoDoProtesto(E));
      }
      m = c;
    }
    if(!m) return null;
    E.feed.unshift(m);
    /* A NOTÍCIA DE TRETA NÃO PASSA PELO FEED (pedido do dono, 08/09/2026):
       ela continua na história (é dela que o Futebol e Porrada e o
       arquivo lêem), mas quem a mostra é Notícias → Tretas. Nasce
       não lida, pro número vermelho e pro balão no ícone. */
    if(m.kind === 'confronto'){
      m.lida = false;
      try{ if(ganchos.aoSairTreta) ganchos.aoSairTreta(E, m); }catch(_){}
    }
    return m;
  }
  const pendentes = E => (caixas(E), E.feedFila.length);
  /* as tretas nossas que ainda não foram abertas em Notícias */
  const tretas = E => (caixas(E), E.feed.filter(m => m.kind === 'confronto'));
  const tretasNaoLidas = E => tretas(E).filter(m => m.lida === false).length;
  function lerTretas(E){ for(const m of tretas(E)) if(m.lida === false) m.lida = true; }

  /* decisão dropada e sem resposta = tempo parado */
  function travado(E){
    caixas(E);
    return E.feed.some(m => m.peso === 'decisao' && !m.respondido);
  }
  const decisaoAberta = E =>
    (caixas(E), E.feed.find(m => m.peso === 'decisao' && !m.respondido) || null);

  /* A RESPOSTA POR ALIADA na lista mensal de aniversários (dono,
     08/09/2026). O efeito é exatamente o dos botões antigos
     (`aniv-ir` / `aniv-nao`, mantidos pra save antigo): ir lança
     −R$ 2.000 no caixa e soma REL.irAniversario na relação; não ir
     tira REL.furarAniversario e −2 de prestígio (−0,4 na régua
     interna). A mensagem fecha quando a última aliada tiver resposta. */
  function responderAniversario(E, idMsg, torcidaId, ir){
    caixas(E);
    const m = E.feed.find(x=>x.id === idMsg);
    if(!m || m.kind !== 'aniversarios' || m.respondido) return {ok:false};
    const lista = ((m.dados||{}).lista||[]);
    const r = responderFesta(E, lista, torcidaId, ir);
    if(!r) return {ok:false};
    m.consequencia = r.consequencia;
    if(r.todas) m.respondido = {botao:'lista', rot:r.rot};
    return {ok:true, fechou: !!m.respondido};
  }
  /* O EFEITO DE UMA RESPOSTA, por aliada — o mesmo pro cartão antigo
     e pra pauta da reunião (dono, 22/09/2026). Devolve a linha de
     consequência da lista inteira e se todas já têm resposta. */
  function responderFesta(E, lista, torcidaId, ir){
    const item = lista.find(x=>x.torcida === torcidaId);
    if(!item || item.resposta) return null;
    E.relacoes = E.relacoes || {};
    const REL = TO.relacoes.REL;
    if(ir){
      TO.estado.lancar(E, `Presença na festa da ${item.nome}`, -2000);
      /* o ganho encolhe a cada festa da mesma torcida no ano (17/09/2026) */
      item.ganho = TO.relacoes.ganhoRepetido(E, E.torcida.id, torcidaId,
                                            'festa', REL.irAniversario);
      E.relacoes[torcidaId] = Math.max(-100, Math.min(100,
        TO.relacoes.nivel(E, torcidaId) + item.ganho));
      TO.relacoes.marcarAjuda(E, torcidaId);
      item.resposta = 'ir';
      mensagemDe(E, torcidaId, `Valeu pela presença, irmão. A festa ficou completa `+
        `com o bonde de vocês. Casa aberta sempre.`, 'agradecimento');
    } else {
      E.relacoes[torcidaId] = Math.max(-100, Math.min(100,
        TO.relacoes.nivel(E, torcidaId) - REL.furarAniversario));
      TO.estado.mexerIndicador(E, 'prestigio', -0.4,
        `Furamos o aniversário da ${item.nome}`);
      item.resposta = 'nao';
    }
    const foi = lista.filter(x=>x.resposta==='ir').length;
    const furou = lista.filter(x=>x.resposta==='nao').length;
    const cada = n => n === 1 ? 'com ela' : 'com cada uma';
    const ganhos = lista.filter(x=>x.resposta==='ir')
      .map(x=>x.ganho != null ? x.ganho : REL.irAniversario);
    const somaG = ganhos.reduce((a,b)=>a+b, 0);
    const consequencia =
      (foi ? `${foi} ${foi===1?'festa':'festas'}: ${U.dinheiro(-2000*foi)} · `+
             (foi === 1 ? `+${somaG} de relação com ela. `
                        : `+${somaG} de relação no total (${ganhos.join(', ')}). `) : '') +
      (furou ? `${furou} ${furou===1?'furada':'furadas'}: −${REL.furarAniversario} `+
               `de relação ${cada(furou)} · Prestígio −${2*furou}.` : '');
    return {consequencia, todas: lista.every(x=>x.resposta),
            rot:`${foi} ${foi===1?'festa':'festas'}, ${furou} ${furou===1?'furada':'furadas'}`};
  }
  /* a resposta por aliada DENTRO DA PAUTA da reunião: a pauta fecha
     (decidida) quando a última aliada tiver resposta */
  function responderFestaDaPauta(E, idItem, torcidaId, ir){
    const it = caixaReuniao(E).pauta.find(x=>x.id === idItem);
    if(!it || it.decidido || !it.festas) return {ok:false};
    const r = responderFesta(E, it.festas, torcidaId, ir);
    if(!r) return {ok:false};
    it.consequencia = r.consequencia;
    if(r.todas) it.decidido = {botao:'lista', rot:r.rot};
    return {ok:true, fechou: !!it.decidido};
  }

  /* -------------------------------------------------------
     A LINHA DE CONSEQUÊNCIA — sai dos efeitos aplicados,
     nunca do texto.
     ------------------------------------------------------- */
  const NOME_IND = {relacao:'Relação', moral:'Moral', prestigio:'Prestígio',
                    dinheiro:'Caixa', efetivo:'Efetivo', bombas:'Bombas'};
  function linhaDeConsequencia(efeitos){
    if(!efeitos || !efeitos.length) return '';
    return efeitos.map(e=>{
      const nome = NOME_IND[e.ind] || e.ind;
      /* PRESTÍGIO FALA A RÉGUA DO DONO (correção de 18/08/2026): o
         indicador vive em 0-20, mas toda tela fala 0-100 — a linha
         mostrava o +0,6 interno onde o jogador esperava +3 */
      const v = e.ind === 'dinheiro'   ? U.dinheiro(Math.abs(e.delta))
              : e.ind === 'prestigio'  ? Math.abs(Math.round(e.delta*5*10)/10)
              : Math.abs(Math.round(e.delta*10)/10);
      const sobe = e.delta > 0;
      const dono = e.dono ? ` ${e.dono}` : '';
      return `${nome}${dono} ${sobe?'+':'−'}${v}`;
    }).join(' · ');
  }

  /* =======================================================
     OS PRODUTORES DO DIA
     `eventosDoDia` roda uma vez por dia, depois de o estado
     simular os jogos do dia. A ordem aqui é a ordem em que as
     mensagens caem.
     ======================================================= */
  /* A PROPOSTA DE TRÉGUA (mensagens entre torcidas, 08/09/2026): rival
     com quem já houve 3 brigas no ano, relação de −55 pra baixo, manda
     "muito sangue esse ano" — uma vez por ano, por rival. Aceitar ou
     recusar é na tela de Mensagens. */
  function treguasDoDia(E){
    const bc = E.brigasCom || {};
    for(const [id, c] of Object.entries(bc)){
      if(c.ano !== E.data.ano || c.n < 3) continue;
      if(TO.relacoes.emTregua && TO.relacoes.emTregua(E, id)) continue;
      if(TO.relacoes.nivel(E, id) > TO.relacoes.QUENTE) continue;
      const o = M().torcida(id);
      if(!o) continue;
      mensagemDe(E, id, `Muito sangue esse ano. ${c.n} vezes a gente se pegou, e dos dois `+
        `lados tem gente no hospital. Trégua até o fim da temporada?`, 'tregua',
        {chave:`tregua|${E.data.ano}|${id}`, dados:{ano:E.data.ano}});
    }
  }

  /* CADA PASSO DO DIA CORRE SOZINHO (correção do dono, 11/09/2026)
     O dia era uma fila de chamadas cruas: bastava UMA estourar — um
     save antigo sem um campo novo, por exemplo — pra todas as
     seguintes não acontecerem, `avancarDia` sair pela metade e o
     relógio da tela nunca ser reagendado. O jogo ficava parado sem
     nada pra responder, que é exatamente o que não pode acontecer.
     Agora o passo que quebra quebra sozinho: o erro vai pro console
     com o nome do passo, e o dia segue. */
  function passo(nome, fn){
    try{ fn(); }
    catch(err){
      if(window.console) console.error(`[dia] o passo "${nome}" falhou:`, err);
    }
  }

  function eventosDoDia(E, ctx){
    ctx = ctx || {};
    passo('tréguas',        ()=>treguasDoDia(E));
    passo('status',         ()=>statusDeHoje(E));
    passo('eixos',          ()=>eixosDoDia(E));
    /* a mesa das OUTRAS: elas se aproximam, pacificam e se afastam
       entre si sem passar pelo nosso feed (dono, 11/09/2026) */
    passo('diplomacia delas', ()=>{ if(TO.eixos) TO.eixos.diplomaciaDelas(E); });
    passo('reunião',        ()=>reuniaoDeHoje(E));
    passo('semana',         ()=>semanaDeHoje(E));
    passo('olheiro',        ()=>olheiroDoDia(E));
    passo('dia de jogo',    ()=>guerraDeHoje(E));
    passo('trimestre',      ()=>eventoDoTrimestreHoje(E));
    passo('LNT',            ()=>lntDeHoje(E));
    passo('ataque sofrido', ()=>ataqueSofridoHoje(E));
    passo('escolta',        ()=>escoltaDeHoje(E));
    passo('assunto do clube',()=>assuntoClubeDeHoje(E));
    passo('bote do dia',    ()=>boteDeHoje(E));
    passo('patrimônio da cidade', ()=>obraDeHoje(E));
    passo('veredicto da campanha', ()=>veredictoDeHoje(E));
    passo('aniversários',   ()=>aniversariosDeHoje(E));
    /* a recepção do aliado vira dinheiro no dia do jogo dele (dono,
       28/08/2026) */
    passo('recepções',      ()=>{ if(PL().cobrarRecepcoes) PL().cobrarRecepcoes(E); });
    passo('filial',         ()=>filialDeHoje(E));
    passo('olheiro da filial', ()=>filialSugestaoDeHoje(E));
    passo('caravana da filial', ()=>caravanaDasFiliais(E));
    passo('bote na caravana',   ()=>boteNaCaravanaRival(E));
    passo('hospedagem da filial', ()=>hospedagemDaFilialSemana(E));
    passo('mundo',          ()=>mundoDeHoje(E, ctx));
    passo('placar',         ()=>placarDoDia(E, ctx.jogos || []));
    passo('almanaque',      ()=>almanaqueDoDia(E));
    passo('dica',           ()=>dicaDeHoje(E));
  }

  /* =======================================================
     A VIDA DA FILIAL (aprovado pelo dono, 25/08/2026)
     Bem menos frequente que a cidade-sede, e tudo no feed
     normal: a filial apanha e se vira sozinha, o olheiro de
     lá sugere descida de vez em quando, e aliado que joga na
     cidade dela é hospedado pelo núcleo.
     ======================================================= */
  /* a filial atacada se defende SOZINHA — sem bonde de socorro, por
     ordem do dono: o núcleo local resolve por simulação e o resultado
     cai no feed como qualquer briga */
  function filialDeHoje(E){
    if(!TO.patrimonio || !TO.diaJogo || !TO.diaJogo.simular) return;
    for(const f of (((E.patrimonio||{}).filiais)||[])){
      if(U.rng() >= 0.005 * TO.relacoes.FREIO_BRIGA) continue;   // 0,3% ao dia (dono, 08/09/2026)
      const nucleo = TO.membros.aptosDaFilial(E, f.cidade);
      if(nucleo.length < 4) continue;
      const hostis = M().torcidasEm(f.cidade)
        .filter(o=>o.id !== E.torcida.id && !o.incompleta &&
                   !(M().saoIrmas && M().saoIrmas(E.torcida.id, o.id)) &&
                   TO.relacoes.nivel(E, o.id) <= -15)
        .sort((a,b)=>TO.relacoes.nivel(E,a.id) - TO.relacoes.nivel(E,b.id));
      const rival = hostis[0];
      if(!rival) continue;
      const deles = Math.max(6, Math.round(nucleo.length * U.entre(0.8, 1.4)));
      const res = TO.diaJogo.simular.rodar({config:{
        escalacao: nucleo, efetivoRival: deles,
        bondes:[{nossa:true, lado:'mandante', n:nucleo.length}]}});
      /* todo ocorrido mexe no prestígio (ordem do dono, 27/08/2026) */
      if(!res.prestigio) res.prestigio = res.ganhamos ? 1 : -1;
      TO.membros.aplicarResultadoDaNoite(E, res);
      TO.acoes.fecharCena(E, {acao:'defender', alvo:{
        torcidaId:rival.id, nome:rival.nome, tipo:'subsede', cena:'bar',
        bairro:TO.financeiro.nomeCidade(f.cidade),
        nossos:nucleo.length, efetivo:deles}}, res);
    }
  }

  /* a sugestão esporádica do olheiro da filial — texto e dose do dono
     (26/08/2026): mais ou menos a cada 12 semanas por filial */
  function filialSugestaoDeHoje(E){
    const fs = ((E.patrimonio||{}).filiais)||[];
    if(!fs.length) return;
    const sa = TO.relacoes.semanaAbs(E);
    const H = TO.mapa.hash;
    for(const f of fs){
      if((sa + H('fsug|'+f.cidade)) % 12 !== 0) continue;
      if((H(`fsug|${f.cidade}|${sa}`) % 7) + 1 !== E.data.dia) continue;
      const nucleo = TO.membros.aptosDaFilial(E, f.cidade);
      if(nucleo.length < 6) continue;
      const alvo = M().torcidasEm(f.cidade)
        .filter(o=>o.id !== E.torcida.id && !o.incompleta &&
                   !(M().saoIrmas && M().saoIrmas(E.torcida.id, o.id)) &&
                   TO.relacoes.nivel(E, o.id) <= -15)
        .sort((a,b)=>TO.relacoes.nivel(E,a.id) - TO.relacoes.nivel(E,b.id))[0];
      if(!alvo) continue;
      const cid = TO.financeiro.nomeCidade(f.cidade);
      propor(E, {
        kind:'filial-ataque', peso:'decisao', voz:'olheiro', tipo:'ruim',
        chave:`fsug|${f.cidade}|${sa}`,
        texto:`Chefe, o pessoal da nossa Sub-Sede ${cid} mapeou o bar da `+
              `${alvo.nome}. São ${nucleo.length} dos nossos na cidade. `+
              `Manda descer?`,
        dados:{cidade:f.cidade, rival:alvo.id},
        botoes:[{id:'desce',  rot:'Atacar', acao:'filial-ataque'},
                {id:'quieto', rot:'Não atacar', acao:'nada'}]});
    }
  }

  /* A CARAVANA SILENCIOSA DA SUBSEDE (ordem do dono, 31/08/2026): no
     dia do NOSSO jogo — em casa e fora — o núcleo de cada filial tenta
     se deslocar pra praça da partida. Sem mensagem e sem parada de
     itinerário: só a transação do custo (rota mais curta, padrão da
     caravana normal, frota abatendo) e, de vez em quando, a estrada
     cobra — uma emboscada resolvida por simulação que cai no feed como
     briga normal, com ferido e preso no pessoal que viajou. Sem caixa
     pro frete, ninguém embarca. */
  function caravanaDasFiliais(E){
    const j = E.proximoJogo;
    if(!j || E.data.dia !== (j.dia || 6)) return;
    if(!PL().caravanaDaFilial || !TO.diaJogo || !TO.diaJogo.simular) return;
    const destino = j.casa ? E.torcida.mapa : (j.mapaAdv || E.torcida.mapa);
    for(const f of (((E.patrimonio||{}).filiais)||[])){
      const c = PL().caravanaDaFilial(E, f, destino);
      if(!c.n) continue;
      const custo = PL().custoCaravanaFilial(c.n, c.saltos,
        TO.financeiro.onibusDe(E));
      if(custo > E.dinheiro) continue;         // sem caixa, ninguém embarca
      if(custo > 0) TO.estado.lancar(E,
        `Caravana da subsede ${TO.financeiro.nomeCidade(f.cidade)} `+
        `(${c.n} cabeças)`, -custo);
      /* a estrada tem dono de vez em quando */
      if(U.rng() >= 0.05 * TO.relacoes.FREIO_BRIGA) continue;   // 3% (dono, 08/09/2026)
      const rival = M().torcidasEm(destino)
        .filter(o=>o.id !== E.torcida.id && !o.incompleta &&
                   !(M().saoIrmas && M().saoIrmas(E.torcida.id, o.id)) &&
                   TO.relacoes.nivel(E, o.id) <= -15)
        .sort((a,b)=>TO.relacoes.nivel(E,a.id) - TO.relacoes.nivel(E,b.id))[0];
      if(!rival) continue;
      const deles = Math.max(4, Math.round(c.n * U.entre(0.8, 1.4)));
      const res = TO.diaJogo.simular.rodar({config:{
        escalacao: c.membros, efetivoRival: deles,
        bondes:[{nossa:true, lado:'mandante', n:c.n}]}});
      if(!res.prestigio) res.prestigio = res.ganhamos ? 1 : -1;
      TO.membros.aplicarResultadoDaNoite(E, res);
      TO.acoes.fecharCena(E, {acao:'defender', alvo:{
        torcidaId:rival.id, nome:rival.nome, tipo:'caravana',
        cena:'emb-onibus', bairro:'',
        nossos:c.n, efetivo:deles}}, res);
    }
  }

  /* O BOTE NA CARAVANA RIVAL (ordem do dono, 31/08/2026): quando o
     clube de uma torcida hostil joga na cidade de uma subsede NOSSA,
     a caravana deles está na pista ou na praça — e o olheiro de lá
     propõe a descida. O efetivo rival da cena é o que VIAJOU
     (caravanaDe), não a torcida inteira. */
  function boteNaCaravanaRival(E){
    const fs = ((E.patrimonio||{}).filiais)||[];
    if(!fs.length || !E.temporada) return;
    const H = TO.mapa.hash;
    for(const f of fs){
      const nucleo = TO.membros.aptosDaFilial(E, f.cidade);
      if(nucleo.length < 6) continue;
      for(const comp of E.temporada.competicoes)
        for(const etapa of [...comp.rodadas, ...comp.mata]){
          for(const jg of etapa.jogos){
            /* a semana é a do jogo, não a da rodada: jogo adiado tem
               `j.s` (correção do dono, 21/09/2026) */
            if((jg.s || etapa.semana) !== E.data.semana) continue;
            if(!jg.f) continue;
            if((jg.d || etapa.dia || 6) !== E.data.dia) continue;
            const casa = M().time(jg.c), vis = M().time(jg.f);
            if(!casa || !vis || casa.mapa !== f.cidade) continue;
            /* A INVESTIDA MARCADA NA SEGUNDA (cartão da semana, dono,
               10/09/2026): o bote só existe se a aba da subsede marcou
               Investir naquele jogo — no alvo e no ponto escolhidos. O
               "Manda dar o bote?" sem plano saiu do feed por ordem do
               dono, no mesmo dia. O alvo pode ser a caravana rival que
               viajou ou a torcida local do mandante (dono, 10/09/2026):
               a local pisa na rua com o mesmo 60% que a pauta estima. */
            const inv = PL().investidaDe(E,
              chaveDoJogoDaFilial(f.cidade, E.data.semana, casa.id, vis.id));
            if(!inv || !inv.alvo) continue;
            for(const o of [...M().torcidasDe(casa.id), ...M().torcidasDe(vis.id)]){
              if(o.id === E.torcida.id || o.incompleta) continue;
              if(M().saoIrmas && M().saoIrmas(E.torcida.id, o.id)) continue;
              if(inv.alvo !== o.id) continue;
              const local = o.mapa === f.cidade;
              const t = (E.mundoTorcidas||{})[o.id];
              const n = local
                ? Math.round(((t && t.membros) || o.membros || 20) * 0.6)
                : PL().caravanaDe(o, (E.relacoes||{})[o.id], E);
              if(n < 5) continue;                    // caravana pequena não viaja
              const cena = inv && inv.alvo
                ? (inv.como === 'ida' && inv.olheiro === 'praca' ? 'praca' : 'rua')
                : (H(`bote|${f.cidade}|${o.id}|${E.data.absoluto}`) % 2
                    ? 'praca' : 'rua');
              const cid = TO.financeiro.nomeCidade(f.cidade);
              propor(E, {
                kind:'filial-caravana', peso:'decisao', voz:'olheiro',
                tipo:'ruim',
                chave:`bote|${f.cidade}|${o.id}|${E.data.ano}|${E.data.semana}`,
                /* texto AGUARDANDO O CRIVO do dono (31/08/2026) */
                texto: local
                  ? `Chefe, como combinado na segunda: a ${o.nome} vai estar `+
                    `${cena === 'praca' ? 'na praça' : 'na pista'} em ${cid} pro `+
                    `jogo de hoje — uns ${n}. O pessoal da nossa Sub-Sede `+
                    `tá com ${nucleo.length}, pronto pro bote.`
                  : inv && inv.alvo
                  ? `Chefe, como combinado na segunda: a caravana da ${o.nome} `+
                    `desceu em ${cid} pro jogo de hoje — uns ${n} ${cena === 'praca'
                      ? 'na praça' : 'na pista'}. O pessoal da nossa Sub-Sede `+
                    `tá com ${nucleo.length}, pronto pro bote.`
                  : `Chefe, a caravana da ${o.nome} desceu em ${cid} pro `+
                    `jogo de hoje — uns ${n} ${cena === 'praca'
                      ? 'na praça' : 'na pista'}. O pessoal da nossa `+
                    `Sub-Sede tá com ${nucleo.length}. Manda dar o bote?`,
                dados:{cidade:f.cidade, rival:o.id, n, cena},
                botoes:[{id:'bote', rot:'Atacar', acao:'filial-caravana'},
                        {id:'quieto', rot:'Não atacar', acao:'nada'}]});
            }
          }
        }
    }
  }

  /* aliado jogando na cidade da filial é hospedado pelo núcleo:
     +2 de relação, calado — o registro fica na Diplomacia */
  function hospedagemDaFilialSemana(E){
    if(E.data.dia !== 2) return;
    const fs = ((E.patrimonio||{}).filiais)||[];
    if(!fs.length || !E.temporada) return;
    const cidades = new Set(fs.map(f=>f.cidade));
    const piso = PL().RELACAO_ALIADO || 20;
    for(const comp of (E.temporada.competicoes||[])){
      for(const etapa of [...(comp.rodadas||[]), ...(comp.mata||[])]){
        for(const j of (etapa.jogos||[])){
          /* a semana é a do jogo, não a da rodada (dono, 21/09/2026) */
          if((j.s || etapa.semana) !== E.data.semana) continue;
          if(!j.f) continue;
          const casa = M().time(j.c);
          if(!casa || !cidades.has(casa.mapa)) continue;
          for(const o of M().torcidasDe(j.f)){
            if(o.mapa === casa.mapa) continue;          // mora lá, não é visita
            const v = (E.relacoes||{})[o.id];
            if(v === undefined || v < piso) continue;
            E.relacoes[o.id] = U.limitar(v + 2, -100, 100);
            if(TO.relacoes.marcarAjuda) TO.relacoes.marcarAjuda(E, o.id);
          }
        }
      }
    }
  }

  /* -------------------------------------------------------
     7. AS DICAS DA DIRETORIA (pedido do dono, 19/08/2026)
        Duas por mês — semana ímpar, dia 2 —, cada uma
        explicando uma regra do jogo. São 40, na ordem em que
        um jogador novo precisa delas, e recomeçam do zero
        quando acabam. Números sempre na régua das telas.
     ------------------------------------------------------- */
  const DICAS = [
    'O prestígio vive numa régua de 0 a 100 e é o nome da torcida na rua: entra no ranking com peso dobrado e sobe com briga vencida, título e ação no bairro.',
    'A relação com cada torcida vai de −100 a +100: abaixo de −70 é Maior Rival, abaixo de −15 é Rival, até 20 é Neutro, até 70 é Aliado e de 70 pra cima é Irmandade.',
    'Seus membros treinam sozinhos todo dia: a fila é sorteada com prioridade pra quem ainda não bateu o teto do cargo. As vagas de treino vêm da sede — 2, 4, 8, 12 ou 20 por dia, conforme o nível.',
    'Cada professor de MMA custa R$ 2.000 por mês: um faz o treino render +30% de força e defesa, dois +60% e três +100%. Contrata e dispensa no Financeiro → Patrimônio.',
    'Cada cargo tem teto de ficha: novato vai até 8, componente até 12, linha de frente até 18 e diretoria até 20. Promoção pede XP e força — e cargo maior paga mensalidade maior.',
    'A mensalidade entra toda semana: R$ 20 por novato, R$ 50 por componente e R$ 100 por linha de frente e diretoria. Torcida grande é caixa forte.',
    'O ranking de torcidas soma disponíveis + prestígio×2, multiplica pela média de força e defesa dos membros e ainda pela situação financeira. Feridos e presos saem da conta.',
    'A situação financeira multiplica o ranking: Endividado corta pra 0,6×, e a escada sobe até Rico, que paga 1,6×. Caixa saudável é ranking alto.',
    'A festa na sede custa R$ 700 e rende R$ 4,80 a 6,40 por presente. Com uns 150 disponíveis ela sempre dá lucro; abaixo disso é vaquinha.',
    'Bar e loja rendem toda semana e pagam manutenção. Dá pra ampliar cada um por nível — e a fábrica corta o custo de insumo da loja e multiplica a receita dela.',
    'A subsede é presença no bairro: rende toda semana e aumenta o alcance da torcida. Compra e ampliação moram no Financeiro → Patrimônio.',
    'O ônibus custa R$ 100 mil e muda a estrada: a viagem sai de graça e o rateio dos embarcados vira RECEITA. Em troca, R$ 1.500 de manutenção por mês — e vez ou outra um conserto de R$ 15 mil.',
    'Na caravana de estrada quem embarca paga rateio. Sem ônibus, o rateio abate o custo da viagem; de avião a viagem é sempre paga.',
    'Reforçar o elenco do clube custa por ponto de força: de R$ 20 mil no time fraco a R$ 320 mil no gigante, teto 100. Time forte ganha mais, e vitória enche o recrutamento.',
    'Assalto tem tabela: do mercadinho (10% de chance de cadeia, 45 dias) ao banco (50% e 180 dias). O sorteio é um só pro bonde inteiro — ou todos voltam com a partilha, ou todos caem.',
    'Bombas custam R$ 600 o lote de 5 no Patrimônio. O estoque inteiro vai junto pra TODA briga — só a treta marcada é limpa, sem pedra nem bomba.',
    'Na cena, o rival responde com até metade das suas bombas — mas nunca joga mais do que tem no paiol dele. Bomba jogada sai do estoque dos dois lados.',
    'Treta marcada tem palco pelo tamanho: 5x5 no beco, 7x7 no galpão, 10x10 no campo de terra. Vencer paga +3/+4/+5 de prestígio; perder custa −1; recusar custa −1 de prestígio.',
    'Ataque a bar tem teto: no máximo 60 atacantes contra 40 defensores. E o bonde só sai pra UM ataque manual por semana.',
    'Ferido volta em 5 a 15 dias; preso fica de 15 a 90. Enquanto estão fora, não treinam, não brigam e não contam no ranking.',
    'Quando um aliado hospedado apanha na sua cidade e você entra na briga, o prestígio da noite é DELE — pra você ficam +10 de relação na hora e a gratidão.',
    'A recepção de aliado vai de R$ 25 a R$ 75 por cabeça: hospedar dá +2 de relação, escoltar +5, churrasco com escolta +12. Não receber cobra −5.',
    'Aniversário de aliado: ir custa R$ 2.000 e rende +3 de relação; furar tira −3 de relação e −2 de prestígio. Só aliado e irmã de clube convidam.',
    'No aniversário da torcida e do clube, a festa grande custa mais e rende mais; a simples é segura; não fazer nada derruba a moral. Os números estão na própria decisão.',
    'Pra ir à guerra, marque o ataque na semana: o olheiro diz em quantos bondes o rival sai e por onde. Emboscar na ida pega o bonde deles quebrado em pedaços.',
    'O olheiro erra: a confiança da leitura cai quando o rival está cauteloso e quando ele se divide em muitos bondes. Rival num bonde só é tudo ou nada.',
    'Na estrada, rota curta pode cruzar praça de rival — e a caravana vira alvo de emboscada no posto ou na pista. Rota longa e avião custam mais e arriscam menos.',
    'O prestígio de uma briga vai até ±10 por noite, contado pelos caídos e presos de cada lado. Fazer o rival correr sem briga rende de 1 a 6.',
    'Vencer em menor número vale mais: o prestígio da vitória é multiplicado pela razão dos efetivos, de 0,5× (esmagando) a 2× (de zebra).',
    'Nas brigas do mundo o favorito é efetivo × ficha média — e vence 70% das vezes. A zebra acontece, e quem ganha por baixo leva mais prestígio e moral.',
    'Caixa no vermelho derruba a moral toda semana, pra você e pra qualquer torcida do mundo. Moral baixa esvazia a saída e piora a briga.',
    'O recrutamento do expediente joga o dado do regime do clube: fase normal rende pouco, janela de título ou acesso enche a praça, rebaixamento seca tudo.',
    'A praça tem um bolo fixo de torcedores do seu clube: as organizadas irmãs dividem esse bolo. Cidade pequena não sustenta torcida gigante.',
    'A sede dita tudo: teto de membros, vagas de treino por dia e o que dá pra construir. Ampliar sede é o investimento que destrava os outros.',
    'As outras torcidas jogam o mesmo jogo: têm caixa, expediente, compram bar, loja, ônibus, professor de MMA e bombas — e investem no elenco do clube delas.',
    'Na cena de briga: WASD move o líder, 1 a 4 trocam a formação, Q pedra, E bomba, R recua, ENTER entra pelo portão — e a rodinha do mouse dá zoom.',
    'Formação é ferramenta: BONDE anda junto, MURALHA segura linha, QUADRADO protege o meio, ESPALHAR foge de bomba e cerca. Trocar na hora certa vira briga.',
    'A PM esquenta com briga e arma na rua: o alerta enche, a pressão empurra, e grade rompida chama a tropa de choque. Recuar a tempo é sair inteiro — e decisão no feed segura o relógio até você responder.',
    'Na partida ao vivo, o cartão do clima do estádio vai de tranquilo a esquentando e tenso: rival de relação muito ruim na arquibancada esquenta rápido, e aliado presente segura o jogo inteiro em tranquilo. Se ficar TENSO, a arquibancada se pega e a cena abre.',
    'Na briga de arquibancada cada torcida senta no setor do seu escalão — 1º escalão é a maior torcida do clube, 2º a seguinte, e isso vira quando uma passa a outra. Vencer paga de +1 a +3 de prestígio (mais se você estava em menor número); perder tira de −1 a −3.'
  ];
  function dicaDeHoje(E){
    const sa = TO.relacoes.semanaAbs(E);
    /* SÓ NO PRIMEIRO MÊS (pedido do dono, 08/09/2026): a dica a cada
       duas semanas virava ruído depois que o jogador já sabe jogar.
       Saem as das semanas 1 e 3 e mais nenhuma; o "Como funciona" do
       menu do Jogo continua com todas. */
    if(sa > 4) return;
    if(sa % 2 !== 1 || E.data.dia !== 2) return;
    const i = (E.dicaSeq || 0) % DICAS.length;
    const m = propor(E, {kind:'dica', peso:'info', voz:'diretor',
      chave:`dica|${E.data.ano}|${E.data.semana}`,
      texto: DICAS[i]});
    if(m) E.dicaSeq = (E.dicaSeq || 0) + 1;
  }

  /* -------------------------------------------------------
     3e. ANIVERSÁRIOS (textos do dono, 18/08/2026)
         A fonte só guarda o ANO de fundação; o dia e o mês
         nascem do hash do id — a mesma torcida faz aniversário
         na mesma data em toda partida.
         · 10 dias antes do aniversário de OUTRA torcida, ela
           convida: ir custa R$ 2.000 e rende +3 de relação;
           não ir custa −3.
         · 10 dias antes do NOSSO e do aniversário do CLUBE, um
           diretor pergunta o tamanho da festa; o custo e a
           moral saem na decisão, a receita sai no dia.
     ------------------------------------------------------- */
  /* A DATA DE VERDADE MANDA (correção do dono, 19/08/2026): a fonte
     das torcidas guarda fundacaoDia/fundacaoMes — a TUF faz 17/02, e o
     hash sorteava outra data por cima. O sorteio fica só de reserva,
     pra quem não tem a data na fonte (3 torcidas e quase todo clube). */
  const fonteDe = (id, o) => o || M().torcida(id) || null;
  const dataDoAniversario = (id, anoCivil, o) => {
    const f = fonteDe(id, o);
    if(f && f.fundacaoDia && f.fundacaoMes)
      return new Date(anoCivil, f.fundacaoMes - 1, f.fundacaoDia);
    return new Date(anoCivil, 0, 1 + TO.mapa.hash(`${id}|aniv`) % 364);
  };
  const fmtDia = d =>
    `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
  const mesmoDia = (a, b) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth();

  /* a tabela do dono: custo, potencial de receita e moral */
  const FESTA_ANIV = {
    torcida: {grande:{custo:20000, min:20000, max:40000, moral:2},
              simples:{custo:5000,  min:4000,  max:8000,  moral:1},
              nada:{moral:-2}},
    clube:   {grande:{custo:10000, min:10000, max:20000, moral:2},
              simples:{custo:3000,  min:2000,  max:5000,  moral:1},
              nada:{moral:-2}}
  };

  function aniversariosDeHoje(E){
    const hoje = TO.estado.dataDaSemana(E.data.ano, E.data.semana, E.data.dia);

    /* OS CONVITES DAS ALIADAS FORAM PRA REUNIÃO (pedido do dono,
       22/09/2026): a lista do mês nasce como pauta no dia 5
       (`pautaFestas`), com o Ir / Não ir de cada aliada dentro do
       balão. O cartão solto de antes (`aniversarios`) só existe em
       save antigo, e continua respondendo por `responderAniversario`. */

    /* a nossa festa e a do clube */
    const meus = [];
    if(E.torcida.fundacao)
      meus.push({tipo:'torcida', id:E.torcida.id, fundacao:E.torcida.fundacao,
                 fonte:E.torcida});
    const time = M().time(E.torcida.clubeId);
    if(time && time.fundacao)
      meus.push({tipo:'clube', id:'clube|'+E.torcida.clubeId,
                 fundacao:time.fundacao, nome:time.nome, fonte:time});
    for(const q of meus){
      const F = FESTA_ANIV[q.tipo];
      /* a pergunta "que festa vamos fazer?" foi pra reunião do dia 5
         (pautaAniversarios, pedido do dono, 22/09/2026); aqui fica só
         o dia da festa */
      /* o dia da festa: a receita sai do potencial */
      const anivHoje = dataDoAniversario(q.id, hoje.getFullYear(), q.fonte);
      if(mesmoDia(anivHoje, hoje)){
        const chave = `festa-${q.tipo}|${hoje.getFullYear()}`;
        const marcada = (E.festasAniversario||{})[chave];
        if(marcada && F[marcada] && F[marcada].custo){
          delete E.festasAniversario[chave];
          const v = U.inteiro(F[marcada].min, F[marcada].max);
          TO.estado.lancar(E, q.tipo === 'torcida'
            ? 'Festa de aniversário da torcida — receita'
            : 'Festa de aniversário do clube — receita', v);
          propor(E, {
            kind:'aniversario', peso:'info', tipo:'boa', voz:'diretor',
            chave:`festa-fim|${q.tipo}|${hoje.getFullYear()}`,
            texto: q.tipo === 'torcida'
              ? `A festa dos nossos anos rendeu ${U.dinheiro(v)}.`
              : `A festa do aniversário do ${q.nome} rendeu ${U.dinheiro(v)}.`
          });
        }
      }
    }
  }

  /* -------------------------------------------------------
     3d. O ALMANAQUE (pedido do dono, 21/08/2026)
         Duas portas, o mesmo jornal:
         · a VIRADA — sobe e desce, torcida do ano, rei da
           pista, a janela e o balanço de patrimônio — sai da
           colheita que o fecho da temporada deixou guardada;
         · o CAMPEÃO — uma edição por competição que o NOSSO
           clube jogou, na hora em que o campeão é decidido.
     ------------------------------------------------------- */
  function almanaqueDoDia(E){
    if(!TO.almanaque) return;

    /* 1. as páginas da virada, guardadas pelo fecho da temporada */
    const fila = E.almanaquePendente || [];
    if(fila.length){
      /* A RETROSPECTIVA (pedido do dono, 09/09/2026): as páginas da
         virada não caem mais em Mensagens — viram uma tela própria,
         aberta em 01/01, uma página por assunto. O main.js abre. */
      E.retrospectiva = {ano: fila[0].ano || (E.data.ano - 1),
                         paginas: fila, vista:false};
      E.almanaquePendente = null;
    }

    /* 2. A VÉSPERA: sete dias antes de a bola rolar, uma vez por
       competição em que o NOSSO clube está. O calendário do jogo é
       semana × dia, então "daqui a sete dias" é a MESMA posição da
       semana que vem. */
    const hoje = (E.data.semana - 1) * 7 + E.data.dia;
    E.aberturasVistas = E.aberturasVistas || {};
    for(const comp of ((E.temporada||{}).competicoes || [])){
      /* a Copa do Brasil não tem rodada nenhuma: a estreia dela é a
         primeira fase do mata-mata */
      const e0 = TO.competicoes.estreiaDe(comp);
      if(!e0) continue;
      const estreia = (e0.semana - 1) * 7 + e0.dia;
      if(estreia - hoje !== 7) continue;
      const chave = `${E.temporada.ano}|${comp.nome}`;
      if(E.aberturasVistas[chave]) continue;
      E.aberturasVistas[chave] = true;
      const pg = TO.almanaque.abertura(E, comp);
      if(pg) proporAlmanaque(E, pg, `almanaque|abertura|${chave}`);
    }

    /* 3. o campeão de cada competição nossa, uma vez só */
    const meu = E.torcida.clubeId;
    E.campeoesVistos = E.campeoesVistos || {};
    for(const comp of ((E.temporada||{}).competicoes || [])){
      if(!comp.campeao) continue;
      const chave = `${E.temporada.ano}|${comp.nome}`;
      if(E.campeoesVistos[chave]) continue;
      const pg = TO.almanaque.campeao(E, comp);
      /* competição que o nosso clube não jogou não vira notícia — mas
         fica marcada, senão a gente reavalia ela todo dia */
      E.campeoesVistos[chave] = true;
      if(pg) proporAlmanaque(E, pg, `almanaque|campeao|${chave}`);
    }
  }

  function proporAlmanaque(E, pg, chave){
    propor(E, {
      kind:'almanaque', peso:'info', voz:'jornal', tipo: pg.tom || '',
      chave,
      /* o texto corrido continua valendo: é ele que aparece na busca,
         no arquivo de Notícias e em qualquer save que não saiba
         desenhar a página */
      texto:`${pg.chapeu}: ${pg.manchete}. ${pg.olho}`,
      dados:{pagina:pg}
    });
  }

  /* AS BRIGAS DA SEMANA SAÍRAM DO FEED (decisão do dono, 21/08/2026).
     O resumo de segunda-feira deixou de existir: quem conta briga
     agora é o Futebol e Porrada, que sai a cada briga NOSSA e leva
     dentro dele as outras do mesmo dia. As brigas do mundo continuam
     sendo registradas em `E.brigasIA` do mesmo jeito e continuam
     inteiras em Notícias → Brigas — o que acabou foi a mensagem. */

  /* -------------------------------------------------------
     3c. A SUGESTÃO DE ASSALTO (decisão do dono, 17/08/2026):
         de tempos em tempos um diretor chega com alvo mapeado.
         NOVE POR ANO (dono, 12/09/2026) — eram 13, uma semana em
         cada 4 —, em dia comum, e só se há diretor de pé e gente
         disponível pro menor dos alvos.
     ------------------------------------------------------- */
  const ASSALTOS_ANO = 9, SEMANAS_DO_ANO = 52;
  /* `assaltoDeHoje` saiu (22/09/2026): a lista de alvos virou pauta da
     reunião do dia 5 (`pautaAssalto`). O cartão antigo de save velho
     continua respondendo por `tela-assalto`. */

  /* =========================================================
     A RELAÇÃO COM O CLUBE, UMA VEZ POR MÊS (pedido do dono,
     18/09/2026)

     Doze vezes por ano — a mesma régua do assalto, só que com
     12 em vez de 9 — um assunto do clube bate à porta.

     A ENTREVISTA É DE DOIS EM DOIS MESES (pedido do dono,
     21/09/2026). Ela era a porta padrão: com o time bem, saía
     todo mês, doze por ano. Agora cada assunto é de um dos
     dois, alternando:

       mês par  → ENTREVISTA, sempre. Seis por ano.
       mês ímpar → PROTESTO NA PORTA DO CT, e só se o time vem
                   de sequência ruim (3 derrotas ou mais nos
                   últimos 5 jogos). Sem isso o mês passa calado
                   — protesto sem time mal não tem o que cobrar.

     Saiu o sorteio de meio a meio que decidia entre os dois:
     ele existia porque os dois dividiam o mesmo mês, e agora
     cada um tem o seu. Com ele no lugar, o protesto comia
     metade das entrevistas justamente na temporada ruim, e
     "de dois em dois meses" viraria "de quatro em quatro".
     ========================================================= */
  const ASSUNTOS_CLUBE_ANO = 12;
  function assuntoClubeDeHoje(E){
    if(!TO.relacaoClube || !E.torcida.clubeId) return;
    const sa = TO.relacoes.semanaAbs(E);
    const H = TO.mapa.hash;
    const n = sa + H(`clube|${E.torcida.id}`) % SEMANAS_DO_ANO;
    const deg = k => Math.floor(k * ASSUNTOS_CLUBE_ANO / SEMANAS_DO_ANO);
    const mes = deg(n);
    if(mes === deg(n - 1)) return;
    let dia = 1 + H(`clube|d|${sa}|${E.torcida.id}`) % 7;
    for(let k=0; k<7 && !diaComumFeed(E, dia); k++) dia = (dia % 7) + 1;
    if(dia !== E.data.dia) return;
    /* `mes` só cresce — não é módulo do ano —, então a alternância
       atravessa a virada sem repetir nem pular */
    if(mes % 2 === 0){ entrevistaDeHoje(E, sa); return; }
    if(TO.relacaoClube.sequenciaRuim(E)) protestoNoCT(E, sa);
  }

  /* -------------------------------------------------------
     O PROTESTO NA PORTA DO CT (pedido do dono, 18/09/2026)
     Só sai quando o time vem mal — 3 derrotas ou mais nos
     últimos 5 jogos —, com a sequência real na manchete. Duas
     saídas, cada uma com o preço dela: cobrar da diretoria
     custa 8 pontos de relação com o clube mas rende prestígio
     de rua; segurar a torcida poupa a relação e ainda soma um
     pouco, à custa de moral — quem queria ir e ficou quieto
     não gosta.
     ------------------------------------------------------- */
  /* o texto do protesto lê a sequência DE AGORA: a mensagem pode
     esperar dias na fila atrás de outra decisão, e o placar anda */
  function textoDoProtesto(E){
    const der = TO.relacaoClube.derrotasRecentes(E);
    const seq = (E.sequenciaClube || []).slice(0, 5).join('');
    const time = M().time(E.torcida.clubeId);
    return {
      texto:`Chefe, o time tá jogando mal — ${der} derrota`+
            `${der===1?'':'s'} nos últimos 5 jogos (${seq}) — e um `+
            `grupo já fala em ir pra porta do CT cobrar satisfação `+
            `${time?'do '+time.nome:'do clube'}. Encabeçamos o protesto?`,
      dados:{sequencia:seq, derrotas:der}};
  }
  function protestoNoCT(E, sa){
    const t = textoDoProtesto(E);
    propor(E, {
      kind:'protesto-ct', peso:'decisao', voz:'diretor',
      chave:`protesto-ct|${E.data.ano}|${sa}`,
      texto: t.texto,
      dados: t.dados,
      botoes:[
        {id:'protestar', rot:'Encabeçar o protesto',
         dica:'−8 de relação com o clube · +2 de prestígio',
         acao:'protesto-ct'},
        {id:'segurar', rot:'Segurar a torcida, não é hora',
         dica:'+2 de relação com o clube · −3 de moral: eles queriam ir',
         acao:'protesto-ct'}
      ]
    });
  }

  /* -------------------------------------------------------
     A ENTREVISTA (pedido do dono, 18/09/2026)
     Um jornalista de um jornal fictício da cidade liga atrás
     de posição. Cada pergunta tem a resposta própria, e a
     mensagem só fecha quando todas estiverem respondidas — a
     mesma régua da lista de aniversários.

     AS PERGUNTAS RODAM (pedido do dono, 19/09/2026): eram
     sempre as mesmas quatro, todo mês, e o dono avisou que
     isso enche o saco. Agora há um BANCO de perguntas — uma
     parte sobre o clube, outra sobre a rua — e cada entrevista
     sorteia duas de cada, sem repetir o que saiu no mês
     passado, quando dá. Hoje são 8 de clube por 5 de rua: 28
     duplas por 10, 280 entrevistas diferentes. Saíram do banco,
     a pedido do dono, "como anda a sede" e "quantos membros
     vocês têm" — pergunta sem consequência nenhuma pro jogo.

     O TETO DO ELOGIO (régua do autor, 19/09/2026): o dono
     mediu +9 de relação por mês só de elogiar diretoria e
     elenco em fase boa e pediu nerf. Duas travas, não uma:
     os números caíram (elogio vale 1, 2 ou 3, não 4 e 5) e
     ELOGIO NÃO PASSA DE 70. Daí pra cima — justo a faixa dos
     benefícios grandes, 76–100 — só presença no estádio
     sobe, que é a régua que o dono escreveu pro motor. Falar
     bonito no jornal leva a relação até "boa"; a faixa
     "ótima" se ganha na arquibancada. As perdas seguem
     inteiras: criticar continua custando o que custava.
     ------------------------------------------------------- */
  const JORNAIS_CLUBE = ['Diário da Bola', 'Jornal da Arquibancada',
                         'Rádio Torcida FM'];
  const TETO_ELOGIO = 70;

  /* O QUE A VIRADA DE ANO FEZ COM O ELENCO (pedido do dono,
     19/09/2026). `E.elencoVirada` é gravado em `estado.js` no fecho da
     temporada; aqui ele só vale enquanto for notícia — o primeiro
     terço do ano novo, que é quando a arquibancada ainda está julgando
     a lista. Menos de 2 pontos de força não vira pauta: é ruído da
     evolução, não "o elenco piorou". */
  const JANELA_VIRADA = 18;      // semanas de vida útil da pauta
  function viradaDoElenco(E){
    const v = E.elencoVirada;
    if(!v) return null;
    if(E.data.ano !== v.ano + 1 || E.data.semana > JANELA_VIRADA) return null;
    const delta = v.para - v.de;
    if(Math.abs(delta) < 2) return null;
    return {de:v.de, para:v.para, delta};
  }

  /* A OUTRA ORGANIZADA DO MESMO CLUBE (pedido do dono, 19/09/2026):
     a maior das outras, que é a que tem voz pra disputar quem
     representa a massa. Clube de uma torcida só não gera a pergunta. */
  function coirmaDaEntrevista(E){
    const outras = M().torcidasDe(E.torcida.clubeId)
      .filter(o => o.id !== E.torcida.id && !o.incompleta);
    if(!outras.length) return null;
    const tam = o => o.membros || 0;
    const maior = outras.reduce((a,b) => tam(b) > tam(a) ? b : a);
    return {id:maior.id, nome:maior.nome};
  }

  /* O TOMBO DO CLUBE DELES (pedido do dono, 19/09/2026 — sugestão B1):
     o último jogo JÁ JOGADO do clube da torcida rival, se tiver sido
     derrota por 2 ou mais. Lê das rodadas da nossa própria agenda de
     competições, que é onde os placares do país estão gravados. */
  function tomboDoRival(E, outra){
    if(!outra || !outra.rival) return null;
    const o = M().torcida(outra.id);
    const clube = o && o.clubeId;
    if(!clube) return null;
    let achado = null;
    for(const comp of ((E.temporada || {}).competicoes || [])){
      for(const r of (comp.rodadas || [])){
        for(const j of (r.jogos || [])){
          if(j.gc == null || j.gf == null) continue;
          if(j.c !== clube && j.f !== clube) continue;
          const seq = (j.s || r.semana || 0);   // jogo adiado tem semana própria
          if(achado && seq <= achado.semana) continue;
          const levou = j.c === clube ? j.gf - j.gc : j.gc - j.gf;
          achado = {semana:seq, levou,
                    placar: j.c === clube ? `${j.gc} a ${j.gf}` : `${j.gf} a ${j.gc}`};
        }
      }
    }
    if(!achado || achado.levou < 2) return null;
    const t = M().time(clube);
    return {nome:outra.nome, id:outra.id,
            clube:(t && t.nome) || 'o time deles', placar:achado.placar};
  }

  /* O RANKING DO JOGO (pedido do dono, 19/09/2026 — sugestão B6 ajustada):
     a posição de verdade, do ranking nacional que a tela já mostra —
     não um número inventado pra pergunta. */
  function nossoRanking(E){
    const lista = (TO.relacoes.rankingDoPais
      ? TO.relacoes.rankingDoPais(E) : TO.relacoes.ranking(E)) || [];
    if(!lista.length) return null;
    const eu = lista.find(x => x.nossa) ||
               lista.find(x => x.id === E.torcida.id);
    if(!eu) return null;
    const primeiro = lista[0];
    return {pos:eu.pos, total:lista.length,
            liderNome:primeiro.nome, liderId:primeiro.id,
            lider: primeiro.id === E.torcida.id};
  }

  function alvoDaEntrevista(E){
    const outras = M().jogaveis().filter(o=>o.id !== E.torcida.id && !o.incompleta);
    if(!outras.length) return null;
    let pior = null, melhor = null;
    for(const o of outras){
      const r = TO.relacoes.nivel(E, o.id);
      if(!pior || r < pior.r) pior = {o, r};
      if(!melhor || r > melhor.r) melhor = {o, r};
    }
    const rival = pior && pior.r <= -15;
    const alvo = rival ? pior : (melhor && melhor.r >= 20 ? melhor : pior);
    return alvo && {id:alvo.o.id, nome:alvo.o.nome, rival: !!rival};
  }

  /* o efeito de um elogio, e a nota que o botão mostra ANTES do
     clique — as duas leem o mesmo teto, então a nota nunca promete
     o que o clique não entrega */
  const elogio = (n, moralSeMal) => ({clube:n, elogio:true, moralSeMal:moralSeMal||0});
  /* A PERGUNTA EM QUE A RUA JÁ É CONTRA (régua do dono, 19/09/2026):
     mando de campo e preço de ingresso não têm dois lados na
     arquibancada — a torcida É contra, e pronto. Ficar do lado do
     clube nessas duas rende relação e CUSTA MORAL SEMPRE, com o time
     bem ou mal. `moral` é a perda fixa; `moralSeMal` continua sendo a
     perda que só existe quando o time vem mal, e as duas não se
     somam na mesma opção — seria cobrar duas vezes pelo mesmo voto. */
  const votarComOClube = (n, moral) => ({clube:n, elogio:true, moral:moral});
  function notaElogio(c, n, moralSeMal, moralFixa){
    const real = Math.min(n, c.espaco);
    const perda = moralFixa || ((c.timeMal && moralSeMal) ? moralSeMal : 0);
    const m = perda ? ` · −${Math.round(perda*5)} de moral` : '';
    return (real > 0
      ? `+${real} relação com o clube · elogio só sobe até ${TETO_ELOGIO}`
      : `sem efeito: a relação já passou de ${TETO_ELOGIO}, e daí pra cima `+
        'só presença no estádio sobe') + m;
  }

  /* =======================================================
     O BANCO DE PERGUNTAS
     `grupo` separa o que mexe na relação com o clube do que é
     assunto de rua; `quando` tira da roda a pergunta que não
     faz sentido no mês (não há rival, não houve confusão).
     Cada opção carrega o próprio efeito em `ef` — quem aplica
     é um laço só, e pergunta nova é dado, não código.
     ======================================================= */
  const PERGUNTAS_ENTREVISTA = [
    /* ---------------- sobre o clube ---------------- */
    {id:'diretoria', grupo:'clube', monta: c => ({
      texto:`O que a torcida acha do trabalho da diretoria do ${c.nomeClube}?`,
      opcoes:[
        {id:'elogiar', rot:'Elogiar a gestão', nota:notaElogio(c, 2, 0.6),
         resumo:'elogiou a gestão', ef:elogio(2, 0.6)},
        {id:'cobrar', rot:'Cobrar mais investimento', nota:'−5 relação · +1 prestígio',
         resumo:'cobrou a diretoria', ef:{clube:-5, prestigio:0.2}},
        {id:'saida', rot:'Pedir a saída da diretoria', nota:'−20 relação · +3 prestígio',
         resumo:'pediu a saída da diretoria', ef:{clube:-20, prestigio:0.6}}
      ]})},

    {id:'temporada', grupo:'clube', monta: c => ({
      texto: c.pos
        ? `E da temporada? Hoje o ${c.nomeClube} está em ${c.pos}º na tabela.`
        : `E da temporada do ${c.nomeClube} até aqui?`,
      opcoes:[
        {id:'elogiar', rot:'Elogiar a campanha', nota:notaElogio(c, 1, 0.4),
         resumo:'elogiou a campanha', ef:elogio(1, 0.4)},
        {id:'criticar', rot:'Criticar duramente', nota:'−6 relação · +1 prestígio',
         resumo:'criticou a campanha', ef:{clube:-6, prestigio:0.2}},
        {id:'neutro', rot:'Ficar em cima do muro', nota:'sem efeito',
         resumo:'ficou em cima do muro', ef:{}}
      ]})},

    {id:'tecnico', grupo:'clube', monta: c => ({
      texto: c.timeMal
        ? `Tem gente pedindo a cabeça do técnico do ${c.nomeClube}. A organizada embarca?`
        : `E o trabalho do técnico do ${c.nomeClube}?`,
      opcoes:[
        {id:'bancar', rot:'Bancar o técnico', nota:notaElogio(c, 2, 0.4),
         resumo:'bancou o técnico', ef:elogio(2, 0.4)},
        {id:'demissao', rot:'Pedir a demissão', nota:'−4 relação · +1 prestígio',
         resumo:'pediu a demissão do técnico', ef:{clube:-4, prestigio:0.2}},
        {id:'muro', rot:'Quem decide é a diretoria', nota:'sem efeito',
         resumo:'passou a bola pra diretoria', ef:{}}
      ]})},

    {id:'ingresso', grupo:'clube', monta: c => ({
      texto:`O ${c.nomeClube} subiu o preço do ingresso e a arquibancada `+
            'inteira está reclamando. A organizada banca o clube?',
      opcoes:[
        {id:'engolir', rot:'Bancar: o clube precisa arrecadar',
         nota:notaElogio(c, 2, 0, 0.6),
         resumo:'bancou o aumento do ingresso contra a própria arquibancada',
         ef:votarComOClube(2, 0.6)},
        {id:'reclamar', rot:'Dizer que é caro pra quem vai sempre',
         nota:'−5 relação · +1 prestígio',
         resumo:'reclamou do preço do ingresso', ef:{clube:-5, prestigio:0.2}},
        {id:'muro', rot:'Não entrar nessa', nota:'sem efeito',
         resumo:'não entrou na discussão do ingresso', ef:{}}
      ]})},

    {id:'elenco', grupo:'clube', monta: c => ({
      texto:`Tem jogador do ${c.nomeClube} que a arquibancada não quer mais. `+
            'Vocês cobram nome a nome?',
      opcoes:[
        {id:'defender', rot:'Defender o elenco inteiro', nota:notaElogio(c, 1, 0.4),
         resumo:'defendeu o elenco', ef:elogio(1, 0.4)},
        {id:'cobrar', rot:'Cobrar nome a nome', nota:'−3 relação · +1 prestígio',
         resumo:'cobrou o elenco nome a nome', ef:{clube:-3, prestigio:0.2}},
        {id:'muro', rot:'Cobrança é dentro do vestiário', nota:'sem efeito',
         resumo:'disse que cobrança é dentro do vestiário', ef:{}}
      ]})},

    {id:'mando', grupo:'clube', monta: c => ({
      texto:`O ${c.nomeClube} quer vender mando de campo e jogar longe da `+
            'cidade. Não tem um na arquibancada que seja a favor. E a '+
            'organizada, fecha com o clube?',
      opcoes:[
        {id:'apoiar', rot:'Fechar com o clube: ele precisa do dinheiro',
         nota:notaElogio(c, 2, 0, 0.6),
         resumo:'apoiou a venda do mando contra a vontade da arquibancada',
         ef:votarComOClube(2, 0.6)},
        /* 0,4 e não 0,3 (varredura de 21/09/2026): prestígio é interno de
           0 a 20 e a tela mostra ×5, então a grade da tabela inteira é
           0,2 → +1 · 0,4 → +2 · 0,6 → +3. Este 0,3 era o único fora
           dela: a dica prometia +2 e o clique entregava +1,5. */
        {id:'condenar', rot:'Condenar: jogo é aqui', nota:'−5 relação · +2 prestígio',
         resumo:'condenou a venda do mando', ef:{clube:-5, prestigio:0.4}},
        {id:'muro', rot:'A torcida vai de qualquer jeito', nota:'sem efeito',
         resumo:'disse que a torcida vai de qualquer jeito', ef:{}}
      ]})},

    {id:'socio', grupo:'clube', monta: c => ({
      texto:`E o programa de sócio do ${c.nomeClube}, como está pra quem é da organizada?`,
      opcoes:[
        {id:'apoiar', rot:'Dizer que vale a pena', nota:notaElogio(c, 2, 0.4),
         resumo:'defendeu o programa de sócio', ef:elogio(2, 0.4)},
        {id:'criticar', rot:'A mensalidade não cabe no bolso',
         nota:'−4 relação · +1 prestígio',
         resumo:'criticou a mensalidade do sócio', ef:{clube:-4, prestigio:0.2}},
        {id:'muro', rot:'Sem opinião formada', nota:'sem efeito',
         resumo:'não opinou sobre o sócio', ef:{}}
      ]})},

    {id:'confusao', grupo:'clube', quando: c => c.brigaRecente, monta: c => ({
      texto:'Depois da confusão do último jogo a imprensa está em cima. '+
            'A torcida se explica?',
      opcoes:[
        {id:'assumir', rot:'Assumir e prometer paz no estádio',
         nota:notaElogio(c, 3, 0) + ' · −1 prestígio',
         resumo:'assumiu a confusão e prometeu paz', ef:{clube:3, elogio:true, prestigio:-0.2}},
        {id:'provocacao', rot:'Foi provocação, a gente se defendeu',
         nota:'−3 relação · +2 prestígio',
         resumo:'disse que foi provocação', ef:{clube:-3, prestigio:0.4}},
        {id:'silencio', rot:'Não comentar', nota:'sem efeito',
         resumo:'não comentou a confusão', ef:{}}
      ]})},

    /* O ELENCO DA TEMPORADA NOVA (pedido do dono, 19/09/2026): duas
       perguntas irmãs, uma pra cada direção da virada. A de baixo é a
       única do banco em que ficar com o clube custa moral SEM o time
       ter jogado nada ainda — a rua quer reforço em janeiro, não em
       maio. A de cima é o contrário: quando a lista melhorou, elogiar
       a diretoria é de graça, porque a arquibancada também gostou. */
    {id:'elenco-piorou', grupo:'clube',
     quando: c => c.virada && c.virada.delta < 0, monta: c => ({
      texto:`Saiu a lista pra temporada e a impressão é que o elenco do `+
            `${c.nomeClube} piorou — ${c.virada.de} pra ${c.virada.para} de `+
            'força. A torcida cobra reforço?',
      opcoes:[
        {id:'cobrar', rot:'Cobrar reforço na porta da diretoria',
         nota:'−4 relação · +1 prestígio',
         resumo:'cobrou reforço pra temporada', ef:{clube:-4, prestigio:0.2}},
        {id:'bancar', rot:'Dizer que o que veio dá conta',
         nota:notaElogio(c, 2, 0, 0.4),
         resumo:'bancou o elenco que a diretoria montou',
         ef:votarComOClube(2, 0.4)},
        {id:'esperar', rot:'Esperar a bola rolar', nota:'sem efeito',
         resumo:'preferiu esperar a bola rolar', ef:{}}
      ]})},

    {id:'elenco-melhorou', grupo:'clube',
     quando: c => c.virada && c.virada.delta > 0, monta: c => ({
      texto:`O ${c.nomeClube} se reforçou pra temporada — no papel o elenco `+
            `está melhor, ${c.virada.de} pra ${c.virada.para} de força. `+
            'A torcida dá o crédito à diretoria?',
      opcoes:[
        {id:'creditar', rot:'Dar o crédito à diretoria',
         nota:notaElogio(c, 2, 0),
         resumo:'deu o crédito da montagem à diretoria', ef:elogio(2, 0)},
        {id:'conter', rot:'Conter a euforia: no papel ganha todo mundo',
         nota:'sem efeito',
         resumo:'conteve a euforia com a montagem', ef:{}},
        {id:'cobrar', rot:'Dizer que agora é título ou nada',
         nota:'−2 relação · +1 prestígio',
         resumo:'disse que agora é título ou nada', ef:{clube:-2, prestigio:0.2}}
      ]})},

    /* ---------------- sobre a rua ---------------- */
    {id:'coirma', grupo:'rua', quando: c => !!c.coirma, monta: c => ({
      alvo:c.coirma.id,
      texto:`A ${c.coirma.nome} anda dizendo por aí que quem representa a `+
            `massa do ${c.nomeClube} são eles. Vocês respondem?`,
      opcoes:[
        {id:'peitar', rot:'Peitar: quem representa a massa somos nós',
         nota:`+2 prestígio · piora a relação com a ${c.coirma.nome}`,
         resumo:`peitou a ${c.coirma.nome} pela massa do clube`,
         ef:{outra:-1, prestigio:0.4}},
        {id:'caber', rot:'Dizer que cabe todo mundo na arquibancada',
         nota:`melhora a relação com a ${c.coirma.nome}`,
         resumo:`disse que cabe todo mundo ao lado da ${c.coirma.nome}`,
         ef:{outra:1}},
        {id:'ignorar', rot:'Não dar palco', nota:'sem efeito',
         resumo:'não deu palco à briga por quem representa a massa', ef:{}}
      ]})},

    {id:'rival', grupo:'rua', quando: c => !!c.outra, monta: c => ({
      alvo:c.outra.id,
      texto:`E como está a relação de vocês com a ${c.outra.nome}?`,
      opcoes:[
        {id:'paz', rot:`Dizer que está em paz com a ${c.outra.nome}`,
         nota:'melhora um pouco a relação com ela',
         resumo:`disse que está em paz com a ${c.outra.nome}`, ef:{outra:1}},
        {id:'guerra', rot:'Dizer que é rixa de verdade',
         nota:'piora um pouco a relação com ela · +1 prestígio',
         resumo:`disse que a rixa com a ${c.outra.nome} é de verdade`,
         ef:{outra:-1, prestigio:0.2}}
      ]})},

    /* B1: o clube deles tomou. Peitar rende MORAL — a rua adora ver a
       diretoria provocando — e custa relação com eles. A saída amena
       não faz nada, que é a régua do dono pra toda provocação. */
    {id:'tombo', grupo:'rua', quando: c => !!c.tombo, monta: c => ({
      alvo:c.tombo.id,
      texto:`O ${c.tombo.clube} tomou de ${c.tombo.placar} no fim de semana. `+
            `Recado pra ${c.tombo.nome}?`,
      opcoes:[
        {id:'esfregar', rot:'Esfregar na cara deles, e sem dó',
         nota:`+3 de moral · piora muito a relação com a ${c.tombo.nome}`,
         resumo:`esfregou o tombo na cara da ${c.tombo.nome}`,
         ef:{outra:-2, moralGanho:0.6}},
        {id:'humor', rot:'Provocar na base do deboche',
         nota:`+2 de moral · piora a relação com a ${c.tombo.nome}`,
         resumo:`debochou do tombo da ${c.tombo.nome}`,
         ef:{outra:-1, moralGanho:0.4}},
        {id:'nada', rot:'Futebol é assim, não comentar', nota:'sem efeito',
         resumo:'não comentou o tombo deles', ef:{}}
      ]})},

    /* B6: a posição no ranking do jogo, lida do ranking de verdade */
    {id:'ranking', grupo:'rua', quando: c => !!c.ranking, monta: c => ({
      alvo: c.ranking.lider ? null : c.ranking.liderId,
      texto: c.ranking.lider
        ? `Vocês estão em 1º no ranking das organizadas do país. `+
          'Dá pra dizer que são a maior do Brasil?'
        : `Saiu o ranking das organizadas: vocês em ${c.ranking.pos}º de `+
          `${c.ranking.total}, com a ${c.ranking.liderNome} na frente. Satisfeitos?`,
      opcoes:[
        {id:'cravar', rot: c.ranking.lider
           ? 'Cravar: somos a maior do Brasil'
           : 'Cravar que o ranking está errado, os maiores somos nós',
         nota:'+3 de moral · piora a relação com quem está na frente',
         resumo:'cravou que a maior do país é a gente',
         ef:{outra:-1, moralGanho:0.6}},
        {id:'raca', rot:'Dizer que número não mede raça', nota:'sem efeito',
         resumo:'disse que número não mede raça', ef:{}},
        {id:'reconhecer', rot: c.ranking.lider
           ? 'Dizer que posição a gente devolve em campo'
           : `Reconhecer a ${c.ranking.liderNome} na frente`,
         nota: c.ranking.lider ? 'sem efeito'
             : `melhora a relação com a ${c.ranking.liderNome}`,
         resumo:'reconheceu quem está na frente',
         ef: c.ranking.lider ? {} : {outra:1}}
      ]})},

    /* O BAR QUEBRADO VIROU PAUTA DE JORNAL (pedido do dono,
       19/09/2026): era um cartão por ocorrência, e o mundo quebra bar
       o tempo todo — virava "sem parar". Aqui ele concorre com as
       outras perguntas da rua e sai no máximo uma vez por mês. O
       texto muda conforme o bar seja nosso ou dos outros. */
    {id:'bar-quebrado', grupo:'rua', quando: c => !!c.barQuebrado,
     monta: c => {
      const b = c.barQuebrado;
      const nomeDe = id => (M().torcida(id) || {}).nome || 'eles';
      const atk = b.atacante ? nomeDe(b.atacante) : null;
      if(b.dono === c.E.torcida.id) return {
        alvo:b.atacante || null,
        texto:`Quebraram o bar de vocês${atk ? ' — obra da '+atk : ''}. `+
              'O jornal quer a versão da organizada.',
        opcoes:[
          {id:'resposta', rot:'Avisar que vai ter resposta, e logo',
           nota:'+3 de moral' + (atk ? ` · piora muito a relação com a ${atk}` : ''),
           resumo:'prometeu resposta pelo bar quebrado',
           ef:atk ? {outra:-2, moralGanho:0.6} : {moralGanho:0.6}},
          {id:'levantar', rot:'Dizer que o bar já está de pé de novo',
           nota:'sem efeito', resumo:'disse que o bar já está de pé', ef:{}},
          {id:'calar', rot:'Não falar de bar com jornalista',
           nota:'sem efeito', resumo:'não falou do bar quebrado', ef:{}}
        ]};
      const dono = nomeDe(b.dono);
      /* QUANDO O BONDE FOI NOSSO o jornalista não pergunta o que a
         gente "acha" — ele cobra confirmação. Perguntar a opinião da
         torcida sobre a própria descida saía falso. */
      if(b.atacante === c.E.torcida.id) return {
        alvo:b.dono,
        texto:`Quebraram o bar da ${dono} e a cidade toda aponta pra cá. `+
              'O jornal quer confirmação.',
        opcoes:[
          {id:'assumir', rot:'Assumir: fomos nós, e com orgulho',
           nota:`+3 de moral · piora muito a relação com a ${dono}`,
           resumo:`assumiu a descida no bar da ${dono}`,
           ef:{outra:-2, moralGanho:0.6}},
          {id:'negar', rot:'Negar que tenha sido a gente', nota:'sem efeito',
           resumo:'negou a descida no bar', ef:{}},
          {id:'calar', rot:'Não falar de bar com jornalista', nota:'sem efeito',
           resumo:'não falou do bar com a imprensa', ef:{}}
        ]};
      const inimiga = TO.relacoes.nivel(c.E, b.dono) <= -LIMIAR_INTERESSE;
      return {
        alvo:b.dono,
        texto:`Quebraram o bar da ${dono}${atk ? ', obra da '+atk : ''}. `+
              'O que a organizada acha disso?',
        opcoes:[
          {id:'onda', rot: inimiga
             ? 'Tirar onda: bem feito, e que venha mais'
             : `Dizer que a ${dono} não soube defender o que era dela`,
           nota:`+2 de moral · piora muito a relação com a ${dono}`,
           resumo:`tirou onda do bar quebrado da ${dono}`,
           ef:{outra:-2, moralGanho:0.4}},
          {id:'respeito', rot:'Dizer que bar de torcida não se mexe',
           nota:`melhora a relação com a ${dono}`,
           resumo:'disse que bar de torcida não se mexe', ef:{outra:1}},
          {id:'calar', rot:'Não comentar bar dos outros', nota:'sem efeito',
           resumo:'não comentou o bar dos outros', ef:{}}
        ]};
     }},

    {id:'boato', grupo:'rua', monta: () => ({
      texto:'Rolou um boato de que vocês pediram a um aliado pra se '+
            'afastar ou se aproximar de outra torcida. É verdade?',
      opcoes:[
        {id:'confirmar', rot:'Confirmar', nota:'+1 prestígio · transparência',
         resumo:'confirmou o boato', ef:{prestigio:0.2}},
        {id:'negar', rot:'Negar, é balela', nota:'sem efeito',
         resumo:'negou o boato', ef:{}}
      ]})},

    {id:'fama', grupo:'rua', monta: () => ({
      texto:'O jornal quer falar da fama de violenta que a organizada carrega. '+
            'Como a gente responde?',
      opcoes:[
        {id:'negar', rot:'Negar: a gente é festa', nota:'sem efeito',
         resumo:'negou a fama de violenta', ef:{}},
        {id:'defesa', rot:'A gente só se defende', nota:'+1 prestígio',
         resumo:'disse que a torcida só se defende', ef:{prestigio:0.2}},
        {id:'assumir', rot:'Assumir: somos o que somos',
         nota:'+2 prestígio · −3 relação com o clube',
         resumo:'assumiu a fama de violenta', ef:{prestigio:0.4, clube:-3}}
      ]})},

    {id:'faixa', grupo:'rua', monta: c => ({
      texto:`Vão levar faixa de cobrança pro próximo jogo do ${c.nomeClube}?`,
      opcoes:[
        {id:'sim', rot:'Vamos, e bem grande', nota:'+2 prestígio · −3 relação com o clube',
         resumo:'prometeu faixa de cobrança', ef:{prestigio:0.4, clube:-3}},
        {id:'nao', rot:'Não, o momento é de apoiar', nota:notaElogio(c, 1, 0.6),
         resumo:'descartou a faixa de cobrança', ef:elogio(1, 0.6)},
        {id:'talvez', rot:'Depende do que acontecer em campo', nota:'sem efeito',
         resumo:'deixou a faixa em aberto', ef:{}}
      ]})},

    {id:'arquibancada', grupo:'rua', monta: c => ({
      texto:`O que a arquibancada prepara pro próximo jogo do ${c.nomeClube}?`,
      opcoes:[
        {id:'mosaico', rot:'Prometer mosaico e festa', nota:notaElogio(c, 1, 0),
         resumo:'prometeu festa na arquibancada', ef:elogio(1, 0)},
        {id:'surpresa', rot:'Dizer que é surpresa', nota:'+1 prestígio',
         resumo:'disse que é surpresa', ef:{prestigio:0.2}},
        {id:'nada', rot:'Sem resultado não tem festa', nota:'−2 relação · +1 prestígio',
         resumo:'disse que sem resultado não tem festa', ef:{clube:-2, prestigio:0.2}}
      ]})}
  ];

  /* UMA de cada grupo — duas perguntas por entrevista (pedido do dono,
     22/09/2026; eram duas de cada, quatro no total) —, sem repetir o
     mês passado quando o banco permite. A ordem sai de um hash da
     chave da entrevista: o mesmo mês sorteia sempre igual (repintar o
     feed não troca a pergunta), e meses diferentes sorteiam diferente. */
  function escolherPerguntas(c, sa){
    const anteriores = c.E.entrevistaUltimas || [];
    const doGrupo = (grupo, n)=>{
      const todas = PERGUNTAS_ENTREVISTA
        .filter(q => q.grupo === grupo && (!q.quando || q.quando(c)));
      const frescas = todas.filter(q => !anteriores.includes(q.id));
      const base = frescas.length >= n ? frescas : todas;
      return base
        .map(q => ({q, k: TO.mapa.hash(
          `entrevista|${c.E.torcida.id}|${c.E.data.ano}|${sa}|${q.id}`)}))
        .sort((a,b) => a.k - b.k)
        .slice(0, n).map(x => x.q);
    };
    return doGrupo('clube', 1).concat(doGrupo('rua', 1));
  }

  function entrevistaDeHoje(E, sa){
    const time = M().time(E.torcida.clubeId);
    const nomeClube = time ? time.nome : 'o clube';
    const comp = ((E.temporada || {}).competicoes || [])
      .find(c => !c.copa && (c.clubes||[]).includes(E.torcida.clubeId));
    const pos = comp ? TO.competicoes.posicaoNaTabela(E, comp.id, E.torcida.clubeId) : 0;
    /* O TIME INDO MAL (pedido do dono, 19/09/2026): ou vem de sequência
       ruim, ou está no quarto de baixo da tabela. É o que faz a
       arquibancada querer sangue — e o que torna elogio público um
       tapa na cara de quem queria protesto. */
    const totalClubes = comp ? (comp.clubes || []).length : 0;
    const timeMal = TO.relacaoClube.sequenciaRuim(E) ||
      !!(pos && totalClubes && pos > totalClubes * 0.75);
    /* confusão recente: o próprio livro da relação com o clube já
       registra toda briga de dia de jogo. O `t` é o que vale; o
       /^Briga/ fica só pra save gravado antes de 21/09/2026, que não
       tem o campo. */
    const brigaRecente = (E.relacaoClubeHistorico || []).slice(0, 6)
      .some(h => h.t ? h.t === 'briga' : /^Briga/.test(h.motivo || ''));
    const jornal = JORNAIS_CLUBE[H_(`clube-jornal|${E.torcida.id}`, JORNAIS_CLUBE.length)];
    const ctx = {E, nomeClube, pos, totalClubes, timeMal, brigaRecente,
      outra: alvoDaEntrevista(E),
      coirma: coirmaDaEntrevista(E),
      ranking: nossoRanking(E),
      barQuebrado: barQuebradoRecente(E),
      virada: viradaDoElenco(E),
      espaco: Math.max(0, TETO_ELOGIO - TO.relacaoClube.nivel(E))};
    ctx.tombo = tomboDoRival(E, ctx.outra);
    const perguntas = escolherPerguntas(ctx, sa)
      .map(q => Object.assign({id:q.id, resposta:null}, q.monta(ctx)));
    if(!perguntas.length) return;
    const quantas = ['', 'Uma pergunta rápida', 'Duas perguntas rápidas',
      'Três perguntas rápidas', 'Quatro perguntas rápidas'][perguntas.length]
      || `${perguntas.length} perguntas rápidas`;
    const m = propor(E, {
      kind:'entrevista', peso:'decisao', voz:'jornal',
      chave:`entrevista-clube|${E.data.ano}|${sa}`,
      texto:`O ${jornal} ligou atrás de uma entrevista sobre a torcida `+
            `e o ${nomeClube}. ${quantas} — o que a gente responde?` +
            (timeMal ? ' O time vem mal, e a rua quer cobrança: passar a mão '+
             'na cabeça da diretoria agora custa moral.' : ''),
      dados:{jornal, perguntas, timeMal, moralPerdida:0, tetoBateu:false}
    });
    /* só marca como "saiu este mês" o que de fato virou mensagem — a
       proposta recusada por repetição não pode queimar as perguntas */
    if(m) E.entrevistaUltimas = perguntas.map(p => p.id);
  }
  /* uma escolha estável por chave, sem sortear de novo a cada leitura */
  function H_(chave, n){ return TO.mapa.hash(chave) % n; }

  /* a resposta de cada pergunta da entrevista, uma de cada vez — a
     mensagem só fecha quando todas tiverem resposta (mesma régua
     de `responderAniversario`). O efeito vem da própria opção: é um
     laço só, e pergunta nova não pede código novo aqui. */
  function responderEntrevista(E, idMsg, idPergunta, idOpcao){
    caixas(E);
    const m = E.feed.find(x=>x.id === idMsg);
    if(!m || m.kind !== 'entrevista' || m.respondido) return {ok:false};
    const perguntas = (m.dados||{}).perguntas || [];
    const p = perguntas.find(x=>x.id === idPergunta);
    if(!p || p.resposta) return {ok:false};
    const opc = (p.opcoes||[]).find(x=>x.id === idOpcao);
    if(!opc) return {ok:false};
    p.resposta = idOpcao;
    const RC = TO.relacaoClube, ef = opc.ef || {};
    const rot = opc.resumo || opc.rot;
    const timeMal = !!(m.dados||{}).timeMal;
    if(ef.clube){
      let n = ef.clube;
      /* O TETO DO ELOGIO: palavra bonita leva a relação até 70 e para
         ali. A faixa de cima, a dos benefícios grandes, se ganha no
         estádio. A nota do botão foi escrita com esta mesma conta. */
      if(n > 0 && ef.elogio) n = Math.min(n, Math.max(0, TETO_ELOGIO - RC.nivel(E)));
      if(n) RC.mexer(E, n, `Entrevista: ${rot}`);
      else m.dados.tetoBateu = true;
    }
    if(ef.prestigio)
      TO.estado.mexerIndicador(E, 'prestigio', ef.prestigio, `Entrevista: ${rot}`);
    /* PEITAR SOBE A MORAL (régua do dono, 19/09/2026): a rua gosta de
       ver a diretoria provocando. É o outro lado da mesma moeda de
       `moral`, que desce quando a gente passa a mão na cabeça do clube. */
    if(ef.moralGanho)
      TO.estado.mexerIndicador(E, 'moral', ef.moralGanho, `Entrevista: ${rot}`);
    /* PASSAR A MÃO NA CABEÇA DO CLUBE CUSTA MORAL
       (pedido do dono, 19/09/2026): os membros querem cobrança, e ver
       o presidente da torcida defendendo o clube no jornal é ficar do
       lado errado do balcão. `moralSeMal` só pesa quando o time vem
       mal; `moral` pesa sempre, e é das perguntas em que a rua já é
       contra de saída — mando de campo e preço de ingresso. */
    const perdaMoral = ef.moral || ((ef.moralSeMal && timeMal) ? ef.moralSeMal : 0);
    if(perdaMoral){
      TO.estado.mexerIndicador(E, 'moral', -perdaMoral,
        `Entrevista: ${rot}` + (ef.moral ? '' : ' com o time indo mal'));
      m.dados.moralPerdida = (m.dados.moralPerdida || 0) + perdaMoral * 5;
    }
    if(ef.outra && p.alvo){
      E.relacoes = E.relacoes || {};
      const v = TO.relacoes.nivel(E, p.alvo);
      E.relacoes[p.alvo] = U.limitar(
        v + ef.outra * TO.relacoes.REL.aproximar, -100, 100);
    }
    if(perguntas.every(x=>x.resposta)){
      m.respondido = {botao:'entrevista', rot:'Entrevista dada'};
      const perdida = Math.round((m.dados.moralPerdida || 0) * 10) / 10;
      const frases = perguntas.map(x=>{
        const o = (x.opcoes||[]).find(y=>y.id === x.resposta);
        return (o && o.resumo) || x.resposta;
      });
      m.consequencia = frases.join('; ') + '.' +
        (m.dados.tetoBateu
          ? ` O elogio não mexeu na relação com o clube: acima de ${TETO_ELOGIO} `+
            'só presença no estádio sobe.' : '') +
        (perdida ? ` A rua não gostou de ver o clube defendido: `+
                   `−${perdida} de moral.` : '');
    }
    return {ok:true, fechou: perguntas.every(x=>x.resposta)};
  }


  /* =======================================================
     O NOTICIÁRIO DE PATRIMÔNIO DA CIDADE
     (pedido do dono, 19/09/2026)

     As IAs SEMPRE compraram bar, loja e subsede — está em
     `ROTULO_COMPRA`, com extrato e tudo — e SEMPRE tiveram o
     bar quebrado quando alguém descia nelas. Nada disso
     aparecia em lugar nenhum: o mundo se mexia em silêncio.
     Agora cada obra e cada bar quebrado que interessa à gente
     vira cartão no feed, com duas saídas, na régua do dono:

       AGRESSIVA — provocar, marcar território, exercer a
       liderança na cidade. Piora a relação com eles e SOBE a
       moral: a rua gosta de ver a diretoria peitando.
       AMENA — deixar quieto. Não faz nada, e não custa nada.

     Quem grava é quem faz a obra (`registrarObra`, chamado de
     relacoes.js, patrimonio.js e acoes.js); quem publica é o
     `eventosDoDia`, um por dia, do mais novo pro mais velho.
     A fila é curta de propósito: obra velha não é notícia.
     ======================================================= */
  const OBRAS_NA_FILA = 12;
  /* O BAR QUEBRADO SAIU DO CARTÃO DIÁRIO (pedido do dono, 19/09/2026):
     o mundo quebra bar o tempo todo, e um cartão por vez virava
     "sem parar". Vira pauta do jornalista — uma das perguntas da
     entrevista do mês —, que é onde comentário de rua cabe sem
     interromper o dia. A fila é curta: bar quebrado há dois meses
     não é mais assunto de ninguém.

     A JANELA SEGUIU A ENTREVISTA (21/09/2026). Eram 8 semanas, com a
     entrevista saindo todo mês — sobrava folga. Agora ela sai de dois
     em dois meses, que são ~8,7 semanas: um bar quebrado logo depois
     de uma entrevista vencia ANTES da próxima e nunca virava pergunta.
     12 semanas cobrem o novo intervalo com margem, e continuam
     jogando fora o que é velho demais pra alguém comentar. */
  const BARES_NA_FILA = 6;
  const BAR_FRESCO = 12;         // semanas em que ainda é pergunta
  /* o que interessa: o que acontece na NOSSA cidade, e o que
     acontece com quem a gente ama ou odeia, esteja onde estiver */
  const LIMIAR_INTERESSE = 25;

  /* o que o jornal escreve de cada obra. Quem não está aqui não vira
     notícia: ônibus, bomba e advogado não são porta que abre na rua. */
  const VERBO_OBRA = {
    bar:'abriu um bar novo na cidade',
    loja:'abriu uma loja nova na cidade',
    subsede:'inaugurou uma subsede nova na cidade',
    sede:'ampliou a sede',
    'ampliar:bar':'ampliou o bar',
    'ampliar:loja':'ampliou a loja',
    'ampliar:subsede':'ampliou a subsede',
    fabrica:'montou uma fábrica de material próprio',
    /* a cidade vem logo atrás, então "fora da praça" sobrava:
       "abriu uma subsede fora da praça no Rio de Janeiro" */
    filial:'abriu uma subsede'
  };
  /* A VOZ É UMA SÓ, E É A TERCEIRA PESSOA (correção do dono,
     21/09/2026). Havia aqui uma tabela de verbos em primeira pessoa
     — "abrimos um bar novo na praça" — pra obra nossa. O dono cortou:
     o jornal fala de todo mundo pelo nome, inclusive da gente. Uma
     tabela de verbos, e o `VERBO_OBRA` acima serve a nós também. */
  /* O BAIRRO SÓ ONDE ELE QUER DIZER ALGO. Fábrica e sede não abrem
     porta nova na rua, e a filial é em OUTRA cidade — "subsede fora
     da praça em Salvador, no bairro Meireles" dizia dois lugares
     diferentes pro mesmo endereço. */
  const COM_BAIRRO = {bar:1, loja:1, subsede:1,
                      'ampliar:bar':1, 'ampliar:loja':1, 'ampliar:subsede':1};

  /* o mundo avisa daqui: `tipo` é 'obra' ou 'bar-quebrado'. Guarda só
     o que vale notícia pra nós — sem isso a fila encheria de obra de
     torcida que a gente nunca ouviu falar, em cidade que nunca
     visitou. */
  function registrarObra(E, ev){
    if(!E || !ev || !ev.tipo) return null;
    const reg = Object.assign({ano:E.data.ano, semana:E.data.semana}, ev);
    /* OBRA SÓ DA PRAÇA, JÁ NA PORTA DE ENTRADA (19/09/2026): obra de
       torcida de fora não vira linha nenhuma, e deixá-la entrar só
       gastava vaga na fila — 12 lugares — e podia empurrar pra fora
       uma obra daqui antes de ela ser publicada. O bar quebrado
       continua entrando de qualquer lugar: quem lê aquilo é a
       entrevista, e lá a aliada de outro estado ainda interessa. */
    if(ev.tipo === 'obra' && ev.torcida !== E.torcida.id &&
       !naPraca(E, ev.torcida)) return null;
    /* duas filas, dois consumidores: obra vira cartão do dia, bar
       quebrado espera o jornalista ligar */
    if(ev.tipo === 'bar-quebrado'){
      E.baresQuebrados = E.baresQuebrados || [];
      E.baresQuebrados.unshift(reg);
      if(E.baresQuebrados.length > BARES_NA_FILA) E.baresQuebrados.pop();
      return ev;
    }
    E.obrasDaCidade = E.obrasDaCidade || [];
    E.obrasDaCidade.unshift(reg);
    if(E.obrasDaCidade.length > OBRAS_NA_FILA) E.obrasDaCidade.pop();
    return ev;
  }

  /* o bar quebrado mais recente que ainda é notícia, pra entrevista */
  function barQuebradoRecente(E){
    for(const b of (E.baresQuebrados || [])){
      const semanas = (E.data.ano - b.ano) * SEMANAS_DO_ANO +
                      (E.data.semana - b.semana);
      if(semanas >= 0 && semanas <= BAR_FRESCO) return b;
    }
    return null;
  }

  /* o filtro mora aqui e não em quem chama: quem faz a obra não tem
     de saber o que é notícia pra nós */
  /* A PRAÇA É `mapa`, NÃO `cidade` (correção do dono, 19/09/2026): a
     praça do jogador é o mapa em que ele joga, e é assim que o resto
     do jogo mede vizinhança (`torcidasEm`, main.js:908). Comparar o
     campo `cidade` deixava passar torcida de fora, e a notícia saía
     dizendo "aqui na cidade" de obra que aconteceu longe. */
  const naPraca = (E, idTorcida) => {
    const o = M().torcida(idTorcida), nossa = M().torcida(E.torcida.id);
    return !!(o && nossa && o.mapa === nossa.mapa);
  };
  function obraInteressa(E, idTorcida){
    if(!idTorcida || idTorcida === E.torcida.id) return true;
    const o = M().torcida(idTorcida);
    if(!o || o.incompleta) return false;
    if(naPraca(E, idTorcida)) return true;
    return Math.abs(TO.relacoes.nivel(E, idTorcida)) >= LIMIAR_INTERESSE;
  }

  /* A LINHA DO JORNAL SOBRE UMA OBRA DA FILA (régua do dono,
     19/09/2026: "obra nossa, aliada ou qualquer outra torcida da praça
     sai só notícia").

     Não sobrou decisão nenhuma aqui, e é o certo: obra é fato
     consumado. A nossa já foi paga e construída na tela de
     patrimônio; a dos outros a gente nem opinou. Perguntar depois
     "inaugura como?" era inventar uma escolha em cima de coisa já
     feita. O Futebol e Porrada noticia, e ponto — inclusive a nossa,
     que é o jornal da praça falando da praça. */
  /* QUEM TEM O QUÊ NA PRAÇA. A conta é daqui e não do jornal: o
     jornal escreve, não sabe onde o jogo guarda patrimônio — e são
     dois lugares diferentes, `E.patrimonio` pro jogador e
     `E.mundoTorcidas` pras outras, com `subsedes` número de um lado
     e lista do outro. */
  function pontosDe(E, id){
    const n = x => Array.isArray(x) ? x.length : (x ? Math.round(x) : 0);
    let p;
    if(id === E.torcida.id){
      p = TO.financeiro.patrimonio(E);
    }else{
      p = (E.mundoTorcidas || {})[id];
      if(!p) return {bares:0, lojas:0, subsedes:0, total:0};
    }
    const bares = n(p.bares), lojas = n(p.lojas), subsedes = n(p.subsedes);
    /* a sede conta como ponto: é a porta principal */
    return {bares, lojas, subsedes, total: 1 + bares + lojas + subsedes};
  }

  /* quem tem mais pontos na praça, tirando a gente */
  function maiorDaPraca(E){
    const nossa = M().torcida(E.torcida.id);
    if(!nossa) return null;
    let melhor = null;
    for(const o of M().torcidasEm(nossa.mapa)){
      if(o.id === E.torcida.id || o.incompleta) continue;
      const p = pontosDe(E, o.id);
      if(!melhor || p.total > melhor.pontos.total)
        melhor = {id:o.id, nome:o.nome, pontos:p};
    }
    return melhor;
  }

  function cartaoDaObra(E, ev){
    const nome = (M().torcida(ev.torcida) || {}).nome || 'eles';
    const v = VERBO_OBRA[ev.item];
    if(!v) return null;               // item sem notícia (ônibus, bomba…)
    /* a cidade só aparece quando é a da obra: subsede de fora */
    const cidadeNome = ev.cidade && TO.financeiro.nomeCidade
      ? TO.financeiro.nomeCidade(ev.cidade) : '';
    /* "em Rio de Janeiro" era o que saía: cidade tem gênero como o
       resto, e a metade desta lista é região ("no Interior de SP") */
    const cidadeEm = cidadeNome ? TO.genero.em('cidade', cidadeNome) : '';
    const ondeFoi = cidadeEm ? ` ${cidadeEm}` : '';
    const nossa = ev.torcida === E.torcida.id;
    const texto = `A ${nome} ${v}${ev.item === 'filial' ? ondeFoi : ''}.`;
    return {
      chave:`obra|noticia|${ev.ano}|${ev.semana}|${ev.torcida}|${ev.item}`,
      texto,
      /* O JORNAL PRECISA DOS FATOS, NÃO DA FRASE (dono, 21/09/2026):
         a obra saía como uma linha de texto no feed e agora tem
         página no Futebol e Porrada, com o quadro da praça do lado.
         `texto` fica: é o que o ticker lê e o que aparece em save
         antigo, que não tem `dados`. */
      dados:{
        torcida:ev.torcida, nome, nossa,
        nomeNossa:(M().torcida(E.torcida.id) || {}).nome || 'nós',
        item:ev.item, cidade:ev.cidade || null, cidadeNome, cidadeEm,
        bairro: COM_BAIRRO[ev.item] ? (ev.bairro || null) : null,
        naPraca: nossa || naPraca(E, ev.torcida),
        /* obra nossa compara com quem tem mais rua na praça hoje —
           é a régua que interessa a quem lê: a gente passou quem? */
        rival: nossa ? maiorDaPraca(E) : null,
        frase: `A ${nome} ${v}${ev.item === 'filial' ? ondeFoi : ''}`,
        eles: pontosDe(E, ev.torcida),
        nos:  pontosDe(E, E.torcida.id)
      }
    };
  }

  function obraDeHoje(E){
    const fila = E.obrasDaCidade || [];
    /* drena até achar uma que renda cartão: obra de torcida de fora
       entra na fila (o bar quebrado dela ainda interessa) mas não
       vira notícia daqui, e não pode travar a fila atrás dela */
    while(fila.length){
      const ev = fila.shift();
      const c = cartaoDaObra(E, ev);
      if(!c) continue;
      propor(E, {kind:'obra', peso:'info', voz:'porrada',
                 chave:c.chave, texto:c.texto, dados:c.dados});
      return;
    }
  }

  /* PEITAR SOBE A MORAL E DERRUBA A RELAÇÃO (régua do dono,
     19/09/2026). A opção amena não faz nada de propósito: é o preço
     de não fazer nada, que é zero — quem quiser moral, paga com
     relação. */
  function responderObra(E, m, idBotao){
    const d = m.dados || {};
    const ef = idBotao === 'bravo' ? d.bravo : d.ameno;
    if(!ef){ m.consequencia = 'Deixamos passar.'; return; }
    if(idBotao !== 'bravo'){
      m.consequencia = 'Deixamos quieto. Nada mudou.';
      return;
    }
    const partes = [];
    if(ef.moral){
      TO.estado.mexerIndicador(E, 'moral', ef.moral, 'Peitou a cidade');
      partes.push(`+${Math.round(ef.moral*5)} de moral`);
    }
    if(ef.clube && TO.relacaoClube){
      const r = TO.relacaoClube.mexer(E, ef.clube, 'Inauguração com a cidade toda');
      if(r) partes.push(`+${r} de relação com o clube`);
    }
    const mexer = (id, quanto)=>{
      if(!id || !quanto) return;
      E.relacoes = E.relacoes || {};
      E.relacoes[id] = U.limitar(
        TO.relacoes.nivel(E, id) + quanto, -100, 100);
    };
    if(ef.relacao && d.alvo){
      mexer(d.alvo, ef.relacao);
      const nm = (M().torcida(d.alvo) || {}).nome || 'eles';
      partes.push(`${ef.relacao > 0 ? '+' : ''}${ef.relacao} com a ${nm}`);
    }
    if(ef.tambem && ef.relacaoTambem){
      mexer(ef.tambem, ef.relacaoTambem);
      const nm = (M().torcida(ef.tambem) || {}).nome || 'eles';
      partes.push(`${ef.relacaoTambem} com a ${nm}`);
    }
    /* "OS RIVAIS" SÃO OS DA NOSSA CIDADE (correção, 19/09/2026): a
       primeira versão pegava todo rival do país e uma inauguração de
       subsede piorava a relação com 59 torcidas de uma vez. Desfile
       na rua é recado pra quem mora na rua — o resto do Brasil nem
       fica sabendo. */
    if(ef.rivais){
      let n = 0;
      for(const o of M().jogaveis()){
        if(o.id === E.torcida.id || o.incompleta) continue;
        if(!naPraca(E, o.id)) continue;
        if(TO.relacoes.nivel(E, o.id) > -LIMIAR_INTERESSE) continue;
        mexer(o.id, ef.rivais); n++;
      }
      if(n) partes.push(`${ef.rivais} com ${n} ${n===1?'rival':'rivais'}`);
    }
    m.consequencia = 'Fomos pra cima: ' + partes.join(' · ') + '.';
  }


  /* =======================================================
     O VEREDICTO DA COMPETIÇÃO (régua do dono, 19/09/2026)

     Assim que a participação do clube numa competição acaba
     — não no fim do ano, no DIA em que acaba —, a torcida
     julga a campanha contra o que se esperava dela.

     O ESPERADO é a força do elenco: `TO.competicoes.porForca`
     ordena os participantes do mais forte pro mais fraco, e a
     posição do clube nessa fila é a posição que a rua esperava.
     3º elenco mais forte esperava 3º lugar.

     DEU RUIM quando:
       · terminou 8 posições ou mais abaixo do esperado;
       · foi REBAIXADO (automático, sem olhar o esperado);
       · caiu na copa pra um time 8 ou mais de força ABAIXO.
     DEU BOM quando:
       · terminou 8 posições ou mais acima do esperado;
       · foi CAMPEÃO ou PROMOVIDO (automático).

     O cartão ruim é um protesto na porta do CT, e as duas
     saídas doem: ir custa relação com o clube e SOBE a moral;
     não ir só derruba a moral — a relação você preserva, e é
     esse o prêmio de segurar a rua. O cartão bom é uma festa
     que custa dinheiro e devolve caixa e moral.
     ======================================================= */
  const QUEDA_QUE_DOI  = 8;     // posições abaixo do esperado
  const SUBIDA_QUE_ANIMA = 8;   // e acima
  const FORCA_ZEBRA    = 8;     // força a menos do time que nos eliminou
  const FESTA_CUSTO    = 10000;
  const FESTA_MIN      = 9000;
  const FESTA_MAX      = 16000;
  const FESTA_MORAL    = 1.0;   // +5 na régua que a tela mostra

  const temPlacar = j => j && j.gc !== undefined && j.gc !== null;

  /* "do Mineiro" mas "da Copa do Nordeste", e "nas Quartas" mas "na
     Final". Era cópia da régua do jornal, e as cópias já tinham
     divergido entre si; agora as duas consultam dados/genero.js. */
  const dComp   = n => TO.genero.d('competicao', n, 'da competição');
  const naFaseF = f => {
    const b = String(f || '').toLowerCase();
    if(!b) return 'fora';
    if(b === 'grupos') return 'na fase de grupos';
    return TO.genero.em('fase', b);
  };

  /* o torneio de verdade por trás da competição-sombra da agenda: a
     chave da Conmebol mora em `E.conmebol`, e o `campeao` da sombra
     é o vencedor do NOSSO confronto, não o do torneio */
  function torneioReal(E, comp){
    if(comp.id === 'libertadores-de-fora') return (E.conmebol||{}).libertadores;
    if(comp.id === 'sulamericana-de-fora') return (E.conmebol||{}).sulamericana;
    return null;
  }

  /* a participação do clube acabou? e terminando como? Devolve null
     enquanto ainda há o que jogar. */
  function desfechoDaCompeticao(E, comp){
    const meu = E.torcida.clubeId;
    const C = TO.competicoes;
    const real = torneioReal(E, comp);

    /* --- o que a rua esperava: a fila de força ---
       O ESPERADO SE MEDE NO MESMO UNIVERSO DA POSIÇÃO (correção,
       19/09/2026): num estadual de grupos, a posição final é dentro do
       grupo e a fila de força era da competição inteira — 4º de 5 no
       grupo contra "3º elenco de 20" não é comparação, é ruído. */
    const grupoNosso = (comp.grupos && comp.grupos.length > 1)
      ? comp.grupos.find(g => g.includes(meu)) : null;
    let fila = C.porForca(E, comp) || [];
    if(grupoNosso) fila = fila.filter(x => grupoNosso.includes(x.id));
    const iEsperado = fila.findIndex(x => x.id === meu);
    if(iEsperado < 0) return null;            // o clube nem joga isto
    const esperado = iEsperado + 1;

    /* O VEREDICTO ESPERA A BOLA ROLAR (correção do dono, 21/09/2026).
       O dia é simulado na virada, ANTES de o relógio chegar na hora do
       jogo — a chave já sabia quem caiu às 8 da manhã e a rua ia pra
       porta do CT com a partida ainda marcada pra 21h30 no plano. Com
       jogo NOSSO nesta competição hoje, ainda não há desfecho a julgar:
       amanhã a chave é a mesma e o julgamento sai. */
    if(C.jogosDaSemana(E, meu, E.data.semana)
        .some(j => j.dia === E.data.dia && j.compId === comp.id)) return null;

    /* --- mata-mata: caímos? ---
       A CHAVE DE VERDADE MANDA (conserto de 21/09/2026). A competição
       na agenda do jogador é uma SOMBRA: pra Libertadores ela guarda
       só os confrontos que a gente jogou — 8 clubes, não 32. Contando
       a colocação ali, perder a FINAL dava "5º de 8" em vez de vice,
       o `posicao > 2` que protege a decisão não pegava, e a torcida
       ia pra porta do CT por ter sido vice da Libertadores. Quando
       existe torneio real (`E.conmebol`), é dele que saem a chave e a
       lista de clubes; a sombra fica só pras competições que são elas
       mesmas (Copa do Brasil, estaduais). */
    const chave = (real && real.mata && real.mata.length) ? real.mata : (comp.mata || []);
    const universo = (real && (real.clubes || []).length)
      ? (real.clubes || []) : null;
    for(let i = chave.length - 1; i >= 0; i--){
      const m = chave[i];
      const j = (m.jogos || []).find(x => x.c === meu || x.f === meu);
      if(!j || !j.venceu) continue;
      if(j.venceu === meu) break;             // essa a gente passou
      const algoz = j.venceu === j.c ? j.c : j.f;
      /* A COLOCAÇÃO SAI DO TAMANHO DA RODADA, e de mais nada.
         (terceira versão, 21/09/2026 — as duas anteriores estão
         registradas porque as duas erraram.)

         1ª: contei quem já tinha caído e somei um. Ficou ao
             contrário — perder a final virava "107º".
         2ª: `total − caídos`. Certo na Copa do Brasil, errado na
             Libertadores: lá a fase de grupos elimina SEM deixar
             linha de mata com `venceu`, então os caídos vinham
             subestimados e o vice saía em 18º.

         A conta que não depende de histórico nenhum: numa rodada de
         mata-mata com N confrontos, N×2 clubes ainda estão vivos.
         Final → 1 confronto → 2 vivos → somos o 2º. Semi → 4. Quartas
         → 8. Vale igual na chave cheia e na sombra, com ida e volta ou
         jogo único, e não precisa saber o nome da fase. */
      const confrontos = (m.jogos || []).filter(x => x.c && x.f).length;
      /* na fila de força entram todos os inscritos do torneio, e a
         colocação tem de ser lida contra esse mesmo total */
      const filaToda = universo
        ? universo.map(id => ({id, forca:C.forcaDe(E, id)}))
                  .sort((a,b) => b.forca - a.forca)
        : (grupoNosso ? (C.porForca(E, comp) || []) : fila);
      const iMeu = filaToda.findIndex(x => x.id === meu);
      const esperadoNaCopa = iMeu >= 0 ? iMeu + 1 : esperado;
      return {tipo:'mata', esperado:esperadoNaCopa, total:filaToda.length,
              posicao:Math.max(2, confrontos * 2),
              algoz, fase:(m.fase || '').replace(/ · (ida|volta)$/, ''),
              forcaAlgoz:C.forcaDe(E, algoz), forcaNossa:C.forcaDe(E, meu)};
    }

    /* --- campeão --- */
    const campeao = real ? real.campeao : comp.campeao;
    if(campeao === meu)
      return {tipo:'titulo', esperado, total:fila.length, campeao:true};

    /* --- liga de pontos corridos: a última rodada foi jogada? --- */
    if(!comp.copa && (comp.rodadas || []).length){
      const faltou = comp.rodadas.some(r =>
        (r.jogos || []).some(x => (x.c === meu || x.f === meu) && !temPlacar(x)));
      if(faltou) return null;
      const pos = C.posicaoNaTabela(E, comp.id, meu);
      if(!pos) return null;
      const t = C.emJogo(comp) || {sobem:0, caem:0};
      const nTab = (comp.grupos && comp.grupos.length > 1)
        ? (comp.grupos.find(g => g.includes(meu)) || comp.clubes).length
        : (comp.clubes || []).length;
      return {tipo:'liga', esperado, total:fila.length, posicao:pos, nTab,
              rebaixado: !!(t.caem && pos > nTab - t.caem),
              promovido: !!(t.sobem && pos <= t.sobem)};
    }
    return null;
  }

  /* o julgamento em si: 'ruim', 'bom' ou nada */
  function julgarCampanha(d){
    if(!d) return null;
    if(d.tipo === 'titulo') return {lado:'bom', motivo:'título'};
    if(d.tipo === 'liga'){
      if(d.rebaixado) return {lado:'ruim', motivo:'rebaixamento'};
      if(d.promovido) return {lado:'bom', motivo:'acesso'};
      if(d.posicao - d.esperado >= QUEDA_QUE_DOI)
        return {lado:'ruim', motivo:`${d.posicao}º com elenco de ${d.esperado}º`};
      if(d.esperado - d.posicao >= SUBIDA_QUE_ANIMA)
        return {lado:'bom', motivo:`${d.posicao}º com elenco de ${d.esperado}º`};
      return null;
    }
    if(d.tipo === 'mata'){
      /* A ZEBRA TEM DE SER PRECOCE (palavra do dono): cair pra time
         muito mais fraco é fracasso, mas PERDER A FINAL não é cair
         cedo — é chegar lá. Vice não vai pra porta do CT, mesmo que o
         campeão fosse mais fraco no papel. Da semifinal pra trás,
         vale. */
      if(d.posicao > 2 && d.forcaNossa - d.forcaAlgoz >= FORCA_ZEBRA)
        return {lado:'ruim', motivo:'zebra'};
      if(d.posicao - d.esperado >= QUEDA_QUE_DOI)
        return {lado:'ruim', motivo:`${d.posicao}º com elenco de ${d.esperado}º`};
      if(d.esperado - d.posicao >= SUBIDA_QUE_ANIMA)
        return {lado:'bom', motivo:`${d.posicao}º com elenco de ${d.esperado}º`};
      return null;
    }
    return null;
  }

  /* o cartão ruim: protesto na porta do CT, e nenhuma saída é de graça */
  function cartaoDeFracasso(E, comp, d, jd){
    const nm = id => (M().time(id) || {}).nome || 'eles';
    const clube = nm(E.torcida.clubeId);
    let texto;
    if(jd.motivo === 'rebaixamento')
      texto = `Acabou: o ${clube} está rebaixado. A rua está em pedaços.`;
    else if(jd.motivo === 'zebra')
      texto = `Caímos ${naFaseF(d.fase)} ${dComp(comp.nome)} pro ${nm(d.algoz)}, `+
              `que tem ${d.forcaNossa - d.forcaAlgoz} de força a menos que a `+
              'gente. A torcida está possessa.';
    else if(d.tipo === 'mata')
      texto = `Caímos ${naFaseF(d.fase)} ${dComp(comp.nome)} pro ${nm(d.algoz)}. `+
              `Com o ${d.esperado}º elenco da competição, cair aí é pouco, `+
              'e a rua sabe.';
    else
      texto = `Fim ${dComp(comp.nome)}: ${d.posicao}º lugar, com o ${d.esperado}º `+
              `elenco da competição. Era pra ser muito melhor, e a rua sabe.`;
    propor(E, {
      kind:'veredicto', peso:'decisao', voz:'na rua',
      chave:`veredicto|ruim|${E.data.ano}|${comp.id}`,
      texto: texto + ' Vamos pra porta do CT?',
      dados:{lado:'ruim'},
      botoes:[
        {id:'protestar', rot:'Encabeçar o protesto no CT',
         dica:'+5 de moral · −15 de relação com o clube', acao:'veredicto'},
        {id:'recusar', rot:'Não é hora, a gente segura',
         dica:'−5 de moral · a relação com o clube fica de pé',
         acao:'veredicto'}
      ]
    });
  }

  /* o cartão bom: a festa */
  function cartaoDeFesta(E, comp, d, jd){
    const clube = (M().time(E.torcida.clubeId) || {}).nome || 'o time';
    const o = jd.motivo === 'título'
      ? `CAMPEÃO. O ${clube} levantou a taça ${dComp(comp.nome)}.`
      : jd.motivo === 'acesso'
      ? `ACESSO. O ${clube} subiu de divisão.`
      : d.tipo === 'mata'
      ? `Caímos ${naFaseF(d.fase)} ${dComp(comp.nome)}, mas com o `+
        `${d.esperado}º elenco da competição chegar até aí foi muito mais `+
        'do que a rua esperava.'
      : `Fim ${dComp(comp.nome)}: ${d.posicao}º lugar com o ${d.esperado}º elenco `+
        'da competição — muito acima do que a rua esperava.';
    propor(E, {
      kind:'veredicto', peso:'decisao', voz:'na rua',
      chave:`veredicto|bom|${E.data.ano}|${comp.id}`,
      texto:`${o} A rua quer festa na sede. A gente banca?`,
      dados:{lado:'bom'},
      botoes:[
        {id:'festa', rot:`Fazer a festa (${U.dinheiro(FESTA_CUSTO)})`,
         dica:`+5 de moral · volta de ${U.dinheiro(FESTA_MIN)} a `+
              `${U.dinheiro(FESTA_MAX)} em bar, camisa e rifa`,
         acao:'veredicto'},
        {id:'sem-festa', rot:'Comemorar sem gastar', dica:'sem efeito',
         acao:'veredicto'}
      ]
    });
  }

  /* uma vez por competição por ano, no dia em que acaba */
  function veredictoDeHoje(E){
    if(!E.temporada) return;
    E.veredictosVistos = E.veredictosVistos || {};
    for(const comp of (E.temporada.competicoes || [])){
      const ch = `${E.data.ano}|${comp.id}`;
      if(E.veredictosVistos[ch]) continue;
      const d = desfechoDaCompeticao(E, comp);
      if(!d) continue;
      E.veredictosVistos[ch] = true;      // acabou é acabou, julgue ou não
      const jd = julgarCampanha(d);
      if(!jd) continue;
      if(jd.lado === 'ruim') cartaoDeFracasso(E, comp, d, jd);
      else cartaoDeFesta(E, comp, d, jd);
    }
  }

  function responderVeredicto(E, m, idBotao){
    const RC = TO.relacaoClube;
    if(idBotao === 'protestar'){
      const r = RC.mexer(E, -15, 'Protesto no CT depois da campanha fracassada');
      TO.estado.mexerIndicador(E, 'moral', 1.0, 'Encabeçou o protesto no CT');
      m.consequencia = `Fomos pra porta do CT e a rua foi junto. `+
        `+5 de moral · ${r} de relação com o clube.`;
      return;
    }
    if(idBotao === 'recusar'){
      /* SEGURAR SÓ CUSTA MORAL (régua do dono): a relação com o clube
         não sobe — ela apenas não cai, e é esse o prêmio. */
      TO.estado.mexerIndicador(E, 'moral', -1.0, 'Segurou a torcida depois do fracasso');
      m.consequencia = 'Seguramos a rua. −5 de moral, e a relação com o '+
        'clube ficou de pé.';
      return;
    }
    if(idBotao === 'festa'){
      if(E.dinheiro < FESTA_CUSTO){
        m.consequencia = 'Não deu: faltou caixa pra bancar a festa.';
        return;
      }
      TO.estado.lancar(E, 'Festa da campanha', -FESTA_CUSTO);
      const volta = Math.round(FESTA_MIN + U.rng() * (FESTA_MAX - FESTA_MIN));
      TO.estado.lancar(E, 'Festa da campanha: bar, camisa e rifa', volta);
      TO.estado.mexerIndicador(E, 'moral', FESTA_MORAL, 'Festa da campanha');
      const saldo = volta - FESTA_CUSTO;
      m.consequencia = `Festa na sede. Custou ${U.dinheiro(FESTA_CUSTO)} e `+
        `voltou ${U.dinheiro(volta)} — saldo de ${saldo >= 0 ? '+' : ''}`+
        `${U.dinheiro(saldo)} · +5 de moral.`;
      return;
    }
    m.consequencia = 'Comemoramos do nosso jeito, sem gastar.';
  }

  /* -------------------------------------------------------
     3f. O BAR DO RIVAL DÁ SOPA (texto do dono, 18/08/2026):
         em torno de 8 vezes no ano (eram 15 até 24/08/2026,
         quando o dono mandou cortar pela metade a dose de bar
         e de treta marcada), um diretor aponta o bar
         de um rival DA CIDADE e pergunta se o bonde desce.
         Atacar abre a mesma cena do ataque manual — com o
         mesmo limite de um bonde por semana.
     ------------------------------------------------------- */
  /* O BOTE NASCE NA REUNIÃO (pedido do dono, 22/09/2026). A sugestão
     semanal solta — o cartão do bar e o da casa de piscina caindo num
     dia comum ao acaso — deixou de existir: os botes do mês são
     PROPOSTOS na reunião da diretoria (`pautaBote`), com o dia e o
     alvo, e o aceito fica marcado no calendário (`E.botes`); no dia,
     o cartão de hoje abre a mesma cena de sempre (`boteDeHoje`). O
     que ficou aqui são os dois escolhedores de alvo, que a pauta usa. */
  function alvoDoBar(E, sem){
    const H = TO.mapa.hash;
    const alvos = (TO.acoes.alvosDeAtaque(E) || []).filter(a =>
      a.tipo === 'bar' && TO.relacoes.nivel(E, a.torcidaId) <= -15);
    if(!alvos.length) return null;
    const alvo = alvos[H(`barrival|a|${sem}`) % alvos.length];
    return {alvo: alvo.id, torcida: alvo.torcidaId, nome: alvo.deQuem,
            bairro: alvo.bairro || ''};
  }
  /* a resenha na casa de piscina (texto do dono, 21/09/2026): uma zona
     da rival da praça, com a faixa ou a bandeira estendida — sem peça
     não há resenha pra invadir */
  function alvoDaCasa(E, sem){
    const H = TO.mapa.hash;
    const rival = TO.relacoes.rivalDaPraca(E, `casarival|${sem}`);
    if(!rival) return null;
    const t = TO.patrimonio.faixasIA(E, rival.id);
    if(!t || (t.faixas <= 0 && t.bandeiras <= 0)) return null;
    const peca = t.faixas > 0 ? 'faixa' : 'bandeira';
    const zonas = M().ZONAS || ['Norte','Sul','Leste','Oeste'];
    const zona = zonas[H(`casarival|z|${sem}`) % zonas.length];
    const doLado = (M().bairrosPorZona(rival.mapa || E.torcida.mapa) || {})[zona] || [];
    const bairro = doLado.length ? doLado[H(`casarival|b|${sem}`) % doLado.length].nome : '';
    return {rival: rival.id, torcida: rival.id, nome: rival.nome, zona, bairro, peca};
  }

  /* dia sem jogo do clube e sem caravana — mesma régua dos eventos do
     trimestre, reimplementada aqui porque a de lá é privada */
  function diaComumFeed(E, dia){
    const meu = M().time(E.torcida.clubeId);
    if(meu && TO.competicoes.jogosDaSemana(E, meu.id, E.data.semana)
                .some(j=>j.dia === dia)) return false;
    return !TO.financeiro.diasDeCaravana(E).includes(dia);
  }

  /* -------------------------------------------------------
     0. A ABERTURA DA PARTIDA (textos aprovados pelo dono)
        Duas decisões, uma vez só, antes de o tempo correr:
        a ideologia e o Expediente da Sede.
     ------------------------------------------------------- */
  function abertura(E){
    /* o tutorial vem antes de tudo (crivo do dono, 02/09/2026) */
    propor(E, {
      kind:'tutorial', peso:'decisao', voz:'diretor',
      chave:'abertura|tutorial',
      texto:'Bem vindo ao jogo, chefe. Se quiser, a gente te mostra o '+
            'jogo — menu por menu, e no fim uma briga simulada pra você '+
            'sentir como funciona a pista. Leva uns dois minutos.',
      botoes:[{id:'abrir', rot:'Mostra o jogo', acao:'tutorial'},
              {id:'pular', rot:'Já sei jogar — pular', acao:'tutorial'}]
    });
    propor(E, {
      kind:'abertura', peso:'decisao', voz:'diretor',
      chave:'abertura|ideologia',
      texto:'Chefe, antes de tudo: define a nossa ideologia — o que a '+
            'gente faz com o adversário em dia de jogo e o que faz com os '+
            'outros jogos da praça. É ela que o botão "Seguir padrão" '+
            'executa quando você não quiser decidir jogo a jogo.',
      botoes:[{id:'ideologia', rot:'Definir ideologia', acao:'tela-ideologia'}]
    });
    propor(E, {
      kind:'abertura', peso:'decisao', voz:'diretor',
      chave:'abertura|expediente',
      texto:'E define o Expediente da Sede: três turnos por dia — manhã, '+
            'tarde e noite —, cada um com uma ação que a rapaziada toca '+
            'sozinha. Dia de jogo e dia de estrada ficam de fora.',
      botoes:[{id:'expediente', rot:'Abrir o Expediente', acao:'painel-expediente'}]
    });
  }

  /* -------------------------------------------------------
     1. O OLHEIRO — dois dias antes de cada jogo relevante
        da semana (no mínimo no dia 1, se o jogo é cedo).
        JAMAIS falha: toda partida das três situações gera
        exatamente um relatório com estimativas e opções.
     ------------------------------------------------------- */
  const ehHostil = (E, id) => {
    if(M().saoIrmas(E.torcida.id, id)) return false;
    const base = M().relacaoBase(E.torcida.id, id);
    if(base === 'Rival' || base === 'Maior Rival') return true;
    return TO.relacoes.nivel(E, id) <= -15;
  };

  const diaDoOlheiro = diaJogo => Math.max(1, diaJogo - 2);
  /* "pela Copa do Nordeste", "pelo Paulistão". Esta era a quinta
     cópia da regra e a mais curta de todas — só `/^Copa/i`, então
     "Libertadores" e "Série B" saíam no masculino. */
  const pelaComp = n => n ? ', ' + TO.genero.por('competicao', n) : '';
  const NOME_DIA = [null,'segunda','terça','quarta','quinta','sexta',
                    'sábado','domingo'];

  /* UM RELATÓRIO POR DIA (decisão do dono): todos os jogos relevantes
     que reportam hoje entram na MESMA mensagem, cada um com suas
     estimativas. O jogo fora entra no mesmo relatório quando cai no
     mesmo dia — o botão da caravana vem junto. */
  /* =======================================================
     O OLHEIRO SÓ SUGERE (pedido do dono, 08/09/2026)
     O relatório semanal com tabela e três botões saiu do feed. O
     planejamento virou coisa que o jogador faz quando quer, em
     Notícias → Mensagens ("Planejar ataque"). No feed fica só a
     SUGESTÃO do olheiro, e ela só aparece com OPORTUNIDADE do
     calendário: rival na nossa cidade (jogo dela aqui), ou a gente
     na cidade dela (nosso jogo fora). A DÍVIDA passa na frente:
     apanhou dela em outra praça, o olheiro cobra a vingança na
     primeira oportunidade. A caravana continua no feed, sempre.
     Nada aqui inventa jogo: tudo sai do calendário da temporada.
     ======================================================= */
  /* quanto das oportunidades vira sugestão do olheiro (dono, 08/09/2026).
     Segunda volta do dono no mesmo dia: maior rival cai pela metade
     (0,7 → 0,35), EXCETO o maior rival de sede do mesmo nível que a
     nossa, que continua em 0,7; rival comum cai mais 30% (0,4 → 0,28). */
  const FREIO_OLHEIRO = {rival:0.28, maior:0.35, maiorParelho:0.7};

  function olheiroDoDia(E){
    const hoje = E.data.dia;
    const meu = E.torcida.clubeId;
    const cidadeNossa = TO.financeiro.nomeCidade
      ? TO.financeiro.nomeCidade(E.torcida.mapa) : E.torcida.mapa;
    const dividas = E.dividas || {};
    /* a régua de "quem vale a sugestão": dívida > maior rival > relação */
    const nota = id => (dividas[id] ? 1000 : 0)
      + (TO.relacoes.ehMaiorRival && TO.relacoes.ehMaiorRival(E, E.torcida.id, id) ? 100 : 0)
      - TO.relacoes.nivel(E, id);
    const emTregua = id => TO.relacoes.emTregua && TO.relacoes.emTregua(E, id);
    /* vale sugestão: dívida, rivalidade declarada (rival ou maior rival)
       ou relação de −45 pra baixo — hostil de −15 não faz o olheiro
       parar o dia */
    const valeSugestao = id => !emTregua(id) && (!!dividas[id] ||
      ['Rival','Maior Rival'].includes(M().relacaoBase(E.torcida.id, id)) ||
      TO.relacoes.nivel(E, id) <= -45);
    /* O FREIO DO OLHEIRO (pedido do dono, 08/09/2026): ele sugere menos.
       Contra rival comum (ou hostil de −45) só 40% das oportunidades
       viram sugestão (−60%); contra maior rival, 70% (−30%). A dívida
       passa sempre: vingança não é sugestão, é cobrança. O sorteio é
       por hash da chave da mensagem, então o mesmo dia dá sempre a
       mesma resposta e a oportunidade perdida não volta no dia seguinte. */
    const freio = (id, chave) => {
      if(dividas[id]) return true;
      const maior = TO.relacoes.ehMaiorRival && TO.relacoes.ehMaiorRival(E, E.torcida.id, id);
      /* o maior rival "parelho" é o de sede do mesmo nível que a nossa */
      const t = (E.mundoTorcidas||{})[id];
      const parelho = maior && t && Number(t.sede) === Number(E.torcida.sedeNivel);
      const teto = parelho ? FREIO_OLHEIRO.maiorParelho
                 : maior ? FREIO_OLHEIRO.maior : FREIO_OLHEIRO.rival;
      return (TO.mapa.hash(`freio-olheiro|${chave}`) % 1000) / 1000 < teto;
    };

    /* AS SUGESTÕES DE ATAQUE SAÍRAM (ordem do dono, 10/09/2026): com o
       planejamento de volta no cartão de segunda, o olheiro não para
       mais o dia pra sugerir ataque em jogo da praça nem cobrar dívida
       na viagem — quem decide é o cartão. Ficam o relatório de quem
       está na pista do jogo fora e o pedido de casa da aliada. */
    const SUGESTOES_DO_OLHEIRO = false;
    /* situações 1 e 2: os jogos da NOSSA praça que reportam hoje */
    for(const j of SUGESTOES_DO_OLHEIRO ? TO.praca.jogosDaPraca(E) : []){
      if(diaDoOlheiro(j.dia) !== hoje) continue;
      const nosso = j.casa.id === meu || j.vis.id === meu;
      const hostis = estimativasDaRua(E, j.dia, j)
        .filter(x=>x.hostil && valeSugestao(x.id))
        .sort((a,b)=>nota(b.id)-nota(a.id));
      if(!hostis.length) continue;
      const alvo = hostis[0];
      const chave = `olheiro|${E.data.ano}|${E.data.semana}|${j.dia}|${j.casa.id}|${j.vis.id}`;
      if(!freio(alvo.id, chave)) continue;
      const chaveJogo = nosso ? null : chaveDoJogoDaPraca(E, j);
      const grupos = [{dia:j.dia, chaveJogo, casa:j.casa.id, vis:j.vis.id}];
      const dv = dividas[alvo.id];
      /* de fora entrando na cidade, ou da nossa praça na pista do jogo
         dela (textos do dono, 08/09/2026) */
      const oAlvo = M().torcida(alvo.id) || {};
      const daCidade = oAlvo.mapa === E.torcida.mapa;
      const clubeDela = oAlvo.clube || (M().time(oAlvo.clubeId) || {}).nome || '';
      const texto = dv
        ? `Chefe, a gente ainda não engoliu o que esses caras da ${alvo.nome} `+
          `fizeram com a gente em ${dv.cidade}. Eles vão jogar em ${cidadeNossa} `+
          `${NOME_DIA[j.dia]}. É uma oportunidade de vingar o que eles fizeram `+
          `com a gente em ${dv.mes}.`
        : daCidade
        ? `Chefe, vai ter jogo do ${clubeDela} ${NOME_DIA[j.dia]} e a ${alvo.nome} `+
          `vai estar na pista. Acho interessante a gente bolar um ataque pra cima deles.`
        : `Chefe, a ${alvo.nome} vai jogar aqui em ${cidadeNossa} `+
          `${NOME_DIA[j.dia]}. Acho interessante a gente bolar um ataque pra `+
          `cima deles, esses vermes na nossa cidade não tem vez.`;
      propor(E, {
        kind:'olheiro', peso:'decisao', voz:'olheiro', chave,
        texto, dados:{grupos, alvo:alvo.id, divida:!!dv},
        botoes:[
          {id:'atacar', rot: dv ? 'Vingar' : 'Bolar o ataque', acao:'tela-ataque',
           args:{ctx:{grupos}}},
          {id:'paz', rot:'Deixar quieto', acao:'paz-grupo', args:{grupos}}
        ]
      });
    }

    /* situação 3: nosso jogo fora que reporta hoje — a caravana sempre.
       A SUGESTÃO DE VIAGEM SAIU (pedido do dono, 08/09/2026): "como
       vamos viajar pra X, bora pegar os vermes da Y na casa deles" era
       redundante com o planejamento da caravana, que já oferece o
       ataque. Só a DÍVIDA continua falando: apanhou dela na praça
       dela, o olheiro cobra a vingança quando o calendário leva a gente
       de volta lá. */
    const jf = E.proximoJogo;
    const fora = (jf && !jf.casa && jf.mapaAdv && jf.mapaAdv !== E.torcida.mapa &&
                  diaDoOlheiro(jf.dia||6) === hoje) ? jf : null;
    if(fora){
      /* O RELATÓRIO DA PISTA DE LÁ SAIU (ordem do dono, 11/09/2026):
         com a caravana e o alvo fechados no cartão de segunda, dizer
         de novo quem estará na pista virou repetição. */
      const hostis = PL().alvosDaViagem(E, {advId:fora.advId})
        .filter(a=>!a.aliada && ehHostil(E, a.id) && !!dividas[a.id] && !emTregua(a.id))
        .sort((a,b)=>nota(b.id)-nota(a.id));
      const chaveFora = hostis.length ? `olheiro|${E.data.ano}|${E.data.semana}|fora|${hostis[0].id}` : '';
      if(SUGESTOES_DO_OLHEIRO && hostis.length){
        const alvo = hostis[0], dv = dividas[alvo.id];
        const texto =
            `Chefe, a gente ainda não engoliu o que esses caras da ${alvo.nome} `+
            `fizeram com a gente em ${dv.cidade}. A gente vai jogar em `+
            `${fora.cidadeAdv} ${NOME_DIA[fora.dia||6]}. É uma oportunidade de `+
            `vingar o que eles fizeram com a gente em ${dv.mes}.`;
        propor(E, {
          kind:'olheiro', peso:'decisao', voz:'olheiro',
          chave: chaveFora,
          texto, dados:{fora:true, alvo:alvo.id, divida:!!dv},
          botoes:[
            {id:'atacar', rot:'Vingar', acao:'tela-ataque',
             args:{ctx:{fora:true, advId:fora.advId}}},
            {id:'paz', rot:'Deixar quieto', acao:'paz-grupo', args:{grupos:[]}}
          ]
        });
      }
    }

    /* O PEDIDO DA ALIADA (mensagens entre torcidas, 08/09/2026): quem
       vem pra nossa cidade esta semana pede casa — a resposta, com os
       quatro níveis de recepção, é na tela de Mensagens. O bloco de
       recepção saiu da mensagem do olheiro. */
    for(const a of PL().aliadosNaCidade(E, E.data.semana)){
      if(diaDoOlheiro(a.dia) !== hoje) continue;
      mensagemDe(E, a.id, `Fala irmão, vamos a ${cidadeNossa} ${NOME_DIA[a.dia]} `+
        `pro jogo do ${a.clube.nome}, uns ${a.estimativa} de bonde. Tem como receber `+
        `a gente? Qualquer coisa já ajuda.`, 'pedido',
        {chave:`pedido|${E.data.ano}|${E.data.semana}|${a.id}`,
         dados:{n:a.estimativa, dia:a.dia, clube:a.clube.nome}});
    }
  }

  /* =======================================================
     A PAUTA DA SEMANA (pedido do dono, 09/09/2026)
     A tabela que o olheiro mandava todo dia de jogo — cada jogo da
     praça nos próximos dias, com as torcidas que pisam na rua e a
     estimativa de cada uma — volta, mas em Notícias → Mensagens, e
     cobrindo a semana inteira de uma vez: é de lá que o jogador pode
     bolar ataque contra qualquer torcida que passe pela cidade, e não
     só contra a que o olheiro sugeriu. Vem também o nosso jogo fora
     (a caravana e a praça deles) e os aliados que chegam.
     ======================================================= */
  function pautaDosJogos(E){
    const meu = E.torcida.clubeId;
    const corDe = id => {
      const o = M().torcida(id);
      return (o && M().coresDaTorcida(o).cor) || '#888';
    };
    const linhas = [];
    for(const j of TO.praca.jogosDaPraca(E)){
      if(j.dia < E.data.dia) continue;                 // já passou
      const nosso = j.casa.id === meu || j.vis.id === meu;
      const ests = estimativasDaRua(E, j.dia, j);
      const chaveJogo = nosso ? null : chaveDoJogoDaPraca(E, j);
      linhas.push({
        tipo: nosso ? 'nosso' : 'praca',
        grupo:{dia:j.dia, chaveJogo, casa:j.casa.id, vis:j.vis.id},
        comp: j.comp, diaN: j.dia, dia: NOME_DIA[j.dia],
        clubes: [{id:j.casa.id, nome:j.casa.nome, cor:(j.casa.cores||[])[0]||'#888'},
                 {id:j.vis.id, nome:j.vis.nome, cor:(j.vis.cores||[])[0]||'#888'}],
        torcidas: ests.map(x=>({id:x.id, nome:x.nome, cor:corDe(x.id), faixa:x.faixa, hostil:x.hostil})),
        temAlvo: ests.some(x=>x.hostil)
      });
    }
    const jf = E.proximoJogo;
    const fora = (jf && !jf.casa && jf.mapaAdv && jf.mapaAdv !== E.torcida.mapa) ? jf : null;
    if(fora){
      const alvos = PL().alvosDaViagem(E, {advId:fora.advId, crua:true});
      linhas.push({
        tipo:'fora', advId: fora.advId, cidade: fora.cidadeAdv,
        comp: fora.competicao || 'fora de casa', diaN: fora.dia||6, dia: NOME_DIA[fora.dia||6],
        clubes: [{id:fora.mandante.id, nome:fora.mandante.nome, cor:(fora.mandante.cores||[])[0]||'#888'},
                 {id:fora.visitante.id, nome:fora.visitante.nome, cor:(fora.visitante.cores||[])[0]||'#888'}],
        torcidas: alvos.map(a=>({id:a.id, nome:a.nome, cor:corDe(a.id), faixa:a.faixa, hostil:!a.aliada})),
        temAlvo: alvos.some(a=>!a.aliada)
      });
    }
    linhas.sort((a,b)=>a.diaN - b.diaN);
    const jogosDaSemana = linhas.filter(l=>l.tipo!=='fora');
    const aliados = PL().aliadosNaCidade(E, E.data.semana)
      .filter(a=>jogosDaSemana.some(l=>l.grupo.vis === a.clube.id && l.grupo.dia === a.dia))
      .map(a=>({id:a.id, nome:a.torcida.nome, n:a.estimativa, dia:a.dia, clube:a.clube.nome}));
    return {linhas, aliados};
  }

  /* =======================================================
     A PAUTA DE UMA CIDADE (planejamento por subsede, dono, 10/09/2026)
     A mesma leitura de `pautaDosJogos`, pra QUALQUER praça em que a
     torcida tenha pé: a sede e cada subsede. Na nossa praça a rua sai
     de `naRuaEm`, que já sabe quem pisa nela; numa praça de subsede
     não há modelo de rua, então a estimativa é a das torcidas do
     mandante (efetivo de casa) mais a caravana de cada visitante,
     pela mesma régua `caravanaDe` que o mundo usa.
     ======================================================= */
  function pautaDaCidade(E, cidadeId, semana, ano){
    const meu = E.torcida.clubeId;
    const emCasa = cidadeId === E.torcida.mapa;
    /* a pauta é DA SEMANA DO CARTÃO: o cartão de uma segunda passada
       continua no feed e mostra a semana dele, já toda passada, sem
       controle nenhum — o de hoje é o único vivo */
    if(semana == null) semana = E.data.semana;
    if(ano == null) ano = E.data.ano;
    const vigente = ano === E.data.ano && semana === E.data.semana;
    const passada = ano < E.data.ano || (ano === E.data.ano && semana < E.data.semana);
    const passou = dia => passada || (vigente && dia < E.data.dia);
    const corDe = id => {
      const o = M().torcida(id);
      return (o && M().coresDaTorcida(o).cor) || '#888';
    };
    const ruaDe = (j) => {
      if(emCasa) return estimativasDaRua(E, j.dia, j);
      const fora = [];
      for(const o of M().torcidasDe(j.casa.id)){
        if(o.id === E.torcida.id || o.incompleta || o.mapa !== cidadeId) continue;
        const t = (E.mundoTorcidas||{})[o.id];
        const n = t ? Math.round((t.membros||20) * 0.6) : (o.membros||20);
        fora.push({id:o.id, nome:o.nome, n, faixa:PL().faixaDeEfetivo(E, n, o.id), hostil:ehHostil(E, o.id)});
      }
      for(const o of M().torcidasDe(j.vis.id)){
        if(o.id === E.torcida.id || o.incompleta || o.mapa === cidadeId) continue;
        const n = PL().caravanaDe(o, (E.relacoes||{})[o.id], E);
        if(n < 5) continue;
        fora.push({id:o.id, nome:o.nome, n, faixa:PL().faixaDeEfetivo(E, n, o.id), hostil:ehHostil(E, o.id), deFora:true});
      }
      return fora;
    };
    const linhas = [];
    for(const j of TO.praca.jogosDaPraca(E, semana, cidadeId)){
      const nosso = emCasa && (j.casa.id === meu || j.vis.id === meu);
      const ests = ruaDe(j);
      /* na subsede a chave é da praça de lá: é ela que o bote do dia do
         jogo lê (`boteNaCaravanaRival`) pra achar a investida marcada */
      const chaveJogo = nosso ? null
        : emCasa ? chaveDoJogoDaPraca(E, j)
        : chaveDoJogoDaFilial(cidadeId, semana, j.casa.id, j.vis.id);
      linhas.push({
        tipo: nosso ? 'nosso' : 'praca',
        grupo:{dia:j.dia, chaveJogo, casa:j.casa.id, vis:j.vis.id},
        comp:j.comp, diaN:j.dia, dia:NOME_DIA[j.dia], hora:j.hora || '',
        estadio: j.casa.estadio || '', passou: passou(j.dia),
        clubes:[{id:j.casa.id, nome:j.casa.nome, cor:(j.casa.cores||[])[0]||'#888'},
                {id:j.vis.id, nome:j.vis.nome, cor:(j.vis.cores||[])[0]||'#888'}],
        torcidas: ests.map(x=>({id:x.id, nome:x.nome, cor:corDe(x.id), faixa:x.faixa, hostil:x.hostil, deFora:!!x.deFora})),
        temAlvo: ests.some(x=>x.hostil)
      });
    }
    /* TODO JOGO NOSSO FORA ENTRA NA ABA DA SEDE (correção do dono,
       21/09/2026): é de lá que a caravana sai. Antes só o `proximoJogo`
       entrava — numa semana com a copa no meio e o campeonato no fim, o
       jogo fora do meio da semana (a Sul-Americana em Bogotá) sumia do
       cartão. Agora a lista vem da agenda do clube, jogo a jogo, com a
       semana e o dia já arbitrados (`j.s`, `j.d`). O da viagem planejada
       (`proximoJogo`) ganha o plano; o outro entra como linha sem
       controle. */
    const clube = M().time(meu);
    if(emCasa && clube && ano === E.data.ano){
      for(const g of TO.competicoes.jogosDaSemana(E, meu, semana)){
        if(g.casa) continue;
        const adv = M().time(g.adversario);
        if(!adv || adv.mapa === E.torcida.mapa) continue;   // esse está na pauta da praça
        const cAdv = M().cidade(adv.mapa);
        const alvos = vigente ? PL().alvosDaViagem(E, {advId:adv.id, crua:true}) : [];
        linhas.push({
          tipo:'fora', advId:adv.id, cidade: cAdv ? cAdv.nome : (adv.cidade || ''), mapaAdv:adv.mapa,
          comp:g.comp || 'fora de casa', diaN:g.dia||6, dia:NOME_DIA[g.dia||6],
          hora:g.hora || '', estadio:adv.estadio || '', passou:passou(g.dia||6),
          clubes:[{id:adv.id, nome:adv.nome, cor:(adv.cores||[])[0]||'#888'},
                  {id:clube.id, nome:clube.nome, cor:(clube.cores||[])[0]||'#888'}],
          torcidas: alvos.map(a=>({id:a.id, nome:a.nome, cor:corDe(a.id), faixa:a.faixa, hostil:!a.aliada})),
          temAlvo: alvos.some(a=>!a.aliada)
        });
      }
    }
    linhas.sort((a,b)=>a.diaN - b.diaN);
    const aliados = !emCasa || !vigente ? [] : PL().aliadosNaCidade(E, semana)
      .filter(a=>linhas.some(l=>l.tipo!=='fora' && l.grupo.vis === a.clube.id && l.grupo.dia === a.dia))
      .map(a=>({id:a.id, nome:a.torcida.nome, n:a.estimativa, dia:a.dia, clube:a.clube.nome}));
    return {cidade:cidadeId, emCasa, vigente, passada, linhas, aliados};
  }

  /* =======================================================
     MUDANÇA DE STATUS PEDE O AVAL DO DONO (pedido do dono, 11/09/2026)
     A relação é um número, e o status (rival, neutro, aliada) é o corte
     dele. Quando o número cruza o corte pra NEUTRO — rival que esfriou,
     aliada que sumiu — a torcida manda um cartão de decisão no feed:
     concorda com o novo status ou não? Recusando, o número volta pra
     beira do status antigo e ela só volta a perguntar depois de 12
     semanas. Subir de status (neutro → aliada, neutro → rival) não
     pergunta: é o jogo andando. `E.statusRel.visto` é o status que o
     dono reconheceu por último; nasce do valor corrente no save antigo.
     ======================================================= */
  const RECUSA_STATUS = 12;                       // semanas
  const grupoDoStatus = st =>
    (st === 'Maior Rival' || st === 'Rival') ? 'rival'
    : st === 'Neutro' ? 'neutro' : 'aliado';
  const BEIRA = {rival:-16, aliado:20};           // onde o recusado fica
  /* SÓ PERGUNTA QUEM TEM LAÇO (correção do dono, 15/09/2026)
     A conversa de encerrar treta ou encerrar aliança só faz sentido com
     quem a gente conhece: torcida da nossa praça, torcida de cidade
     onde a gente tem filial, torcida que já veio pra cima ou já andou
     junto, quem está declarado na nossa ficha desde o começo e quem
     divide eixo com a gente. Com essas, a pergunta chega. O resto do
     mundo — barra de outro país que a gente nunca viu — muda de status
     CALADO: a mudança vale, mas não vira cartão no feed. */
  function temLacoConosco(E, id){
    const t = M().torcida(id); if(!t) return false;
    if(M().relacaoBase(E.torcida.id, id) !== 'Neutro') return true;
    if(t.mapa && t.mapa === E.torcida.mapa) return true;
    if(TO.patrimonio && TO.patrimonio.temFilialEm && t.mapa &&
       TO.patrimonio.temFilialEm(E, t.mapa)) return true;
    if(E.brigasCom && E.brigasCom[id]) return true;
    if(TO.eixos && TO.eixos.de(E, E.torcida.id)
        .some(x => (x.membros || []).includes(id))) return true;
    return false;
  }
  /* UMA POR SEMANA (correção do dono, 15/09/2026): mesmo entre as que
     têm laço, duas mudanças no mesmo dia viram duas perguntas iguais
     coladas. Sai uma por semana; quem ficou na fila espera a vez, e se
     o status voltar sozinho no meio-tempo a pergunta nem chega a
     existir. A da nossa praça passa na frente — é com ela que a gente
     se pega de verdade. */
  function statusDeHoje(E){
    const S = E.statusRel = E.statusRel || {};
    S.visto = S.visto || {}; S.recusa = S.recusa || {};
    const R = TO.relacoes, sa = R.semanaAbs(E);
    const pendente = id => [...E.feed, ...E.feedFila]
      .some(m => m.kind === 'status' && !m.respondido && m.dados && m.dados.de === id);
    const fila = [];
    for(const o of M().jogaveis()){
      if(o.id === E.torcida.id || o.incompleta) continue;
      const agora = grupoDoStatus(M().statusDoValor(R.nivel(E, o.id)));
      const antes = S.visto[o.id];
      if(antes === undefined){ S.visto[o.id] = agora; continue; }
      if(agora === antes) continue;
      const cai = agora === 'neutro' && (antes === 'rival' || antes === 'aliado');
      if(!cai){ S.visto[o.id] = agora; continue; }
      /* sem laço: a mudança vale, mas em silêncio */
      if(!temLacoConosco(E, o.id)){ S.visto[o.id] = agora; continue; }
      if(pendente(o.id)) continue;
      /* recusou há pouco: segura na beira do status antigo, sem perguntar */
      if(S.recusa[o.id] && sa - S.recusa[o.id] < RECUSA_STATUS){
        E.relacoes[o.id] = BEIRA[antes]; continue;
      }
      fila.push({o, antes});
    }
    if(!fila.length) return;
    if(S.ultima !== undefined && sa - S.ultima < 1) return;   // uma por semana
    fila.sort((x, y) => (y.o.mapa === E.torcida.mapa ? 1 : 0) -
                        (x.o.mapa === E.torcida.mapa ? 1 : 0));
    S.ultima = sa;
    {
      const o = fila[0].o, antes = fila[0].antes;
      const nos = E.torcida.nome;
      propor(E, {
        kind:'status', peso:'decisao', voz:'torcida',
        chave:`status|${o.id}|${antes}|${sa}`,
        texto: antes === 'rival'
          ? `Fala, ${nos}. Faz tempo que a gente não se pega na rua, e da nossa `+
            `parte a treta esfriou. Dá pra tratar como neutro daqui pra frente. Fechado?`
          : `Fala, ${nos}. Faz um tempão que ninguém ajuda ninguém, e a rua já `+
            `nota. Melhor cada um pro seu lado, sem mágoa. Encerra a aliança?`,
        dados:{de:o.id, nome:o.nome, antes},
        botoes: antes === 'rival'
          ? [{id:'sim', rot:'Fechado, neutro', acao:'status-sim',
              nota:'a treta acaba: ninguém procura ninguém'},
             {id:'nao', rot:'Rival continua rival', acao:'status-nao',
              nota:'a relação volta pra −16 e eles perguntam de novo em 12 semanas'}]
          : [{id:'sim', rot:'Encerrar a aliança', acao:'status-sim',
              nota:'vira neutra: sem ajuda, sem convite'},
             {id:'nao', rot:'A aliança fica', acao:'status-nao',
              nota:'a relação segura em +20 — mas precisa de ajuda pra se manter'}]
      });
    }
  }

  /* =======================================================
     A ALIADA APRESENTA UMA ALIADA DELA (pedido do dono, 11/09/2026)
     Umas duas vezes por ano, uma aliada nossa oferece aproximar a gente
     de uma torcida que é aliada dela, neutra com a gente e que não é
     maior rival de nenhuma aliada nossa — de preferência numa praça
     onde a gente não tem ninguém. Aceitando, a torcida vira aliada
     (relação sobe a pelo menos +20) e a intermediária ganha +3; recusando,
     a intermediária perde 3. Dose por hash: a cada 26 semanas, num dia
     da semana sorteado, como a sugestão da filial.
     ======================================================= */
  function pautaAproximacao(E, forcar){
    const R = TO.relacoes, H = TO.mapa.hash, sa = R.semanaAbs(E);
    /* DUAS VEZES POR ANO (dono, 11/09/2026): a pauta nasce na mesa, não
       no dia. O divisor era 6 para DOZE reuniões; com a mesa bimestral
       (12/09/2026) são SEIS por ano, e 1 em 3 devolve as duas. */
    if(!forcar && (H(`aprox|${E.data.ano}|${mesDe(E)}`) % 3) !== 0) return null;
    const todas = M().jogaveis().filter(o=>o.id !== E.torcida.id && !o.incompleta);
    const st = id => grupoDoStatus(M().statusDoValor(R.nivel(E, id)));
    const aliadas = todas.filter(o=>st(o.id) === 'aliado');
    if(!aliadas.length) return null;
    const pracas = new Set(aliadas.map(a=>a.mapa));
    const cands = [];
    for(const a of aliadas) for(const c of todas){
      if(c.id === a.id || st(c.id) !== 'neutro') continue;
      if(M().saoIrmas && M().saoIrmas(E.torcida.id, c.id)) continue;
      if(grupoDoStatus(M().statusDoValor(R.relacaoDelas(E, a.id, c.id))) !== 'aliado') continue;
      if(aliadas.some(x=>R.ehMaiorRival(E, x.id, c.id))) continue;
      cands.push({a, c, semAliada: !pracas.has(c.mapa)});
    }
    if(!cands.length) return null;
    const nota = x => H(`interm|${sa}|${x.a.id}|${x.c.id}`) % 1000;
    cands.sort((x,y)=>(y.semAliada?1:0) - (x.semAliada?1:0) || nota(x) - nota(y));
    /* A LEALDADE VEM ANTES (correção do dono, 12/09/2026): ninguém se
       aproxima de quem é maior rival de uma aliada — dos dois lados */
    /* e o CÍRCULO EM COMUM (dono, 12/09/2026): a gente só se aproxima
       de quem já anda com mais da metade da nossa turma */
    const cacheA = new Map();
    const passa = cands.slice(0, 8).find(x=>!TO.eixos || (
      TO.eixos.circuloEmComum(E, E.torcida.id, x.c.id, cacheA).ok &&
      !TO.eixos.trancaDeAliado(E, E.torcida.id, x.c.id)));
    if(!passa) return null;
    const {a, c, semAliada} = passa;
    const cid = TO.financeiro.nomeCidade ? TO.financeiro.nomeCidade(c.mapa) : c.mapa;
    return {tipo:'aproximacao', chave:`interm|${a.id}|${c.id}|${E.data.ano}`,
      rot:'Aproximação', voz:a.nome, de:a.id, nome:a.nome, alvo:c.id, alvoNome:c.nome,
      texto:`Fala irmão. A gente é de boa com a ${c.nome} (${cid})`+
            (semAliada ? `, e vocês não têm ninguém lá` : '')+
            `. Se quiser, a gente senta os dois pra aproximar. Topa?`,
      botoes:[{id:'sim', rot:'Aproximar', acao:'interm-sim',
               nota:`a ${c.nome} vira aliada (+25 no mínimo) · +3 com a ${a.nome}`},
              {id:'nao', rot:'Deixar como está', acao:'interm-nao',
               nota:`−3 com a ${a.nome}`}]};
  }

  /* =======================================================
     A ALIADA PEDE PAZ POR UM RIVAL NOSSO (pedido do dono, 11/09/2026)
     O outro lado da intermediação: umas TRÊS vezes por ano, uma aliada
     nossa senta pra pedir que a gente baixe a treta com um RIVAL nosso
     que é aliado dela — ela está no meio de duas turmas que se pegam e
     quer o corredor livre. Quem decide é o dono: aceitando, a treta
     zera (a relação sobe pro neutro) e a intermediária ganha +3;
     recusando, ela perde 3 e o rival segue rival.

     Maior rival não entra nessa conversa: é ódio de nascença, da fonte,
     e nem a aliada mais próxima senta essa mesa. A dose é por hash — a
     cada 17 semanas, num dia sorteado da semana —, o mesmo relógio da
     sugestão da filial, e o par não se repete no mesmo ano.
     ======================================================= */
  function pautaPaz(E, forcar){
    const R = TO.relacoes, H = TO.mapa.hash, sa = R.semanaAbs(E);
    /* TRÊS VEZES POR ANO (dono, 11/09/2026); com a mesa bimestral são
       seis reuniões, então 1 em 2 (era 1 em 4, para doze) */
    if(!forcar && (H(`paz|${E.data.ano}|${mesDe(E)}`) % 2) !== 0) return null;
    const todas = M().jogaveis().filter(o=>o.id !== E.torcida.id && !o.incompleta);
    const st = id => grupoDoStatus(M().statusDoValor(R.nivel(E, id)));
    const aliadas = todas.filter(o=>st(o.id) === 'aliado');
    if(!aliadas.length) return null;
    const cands = [];
    for(const a of aliadas) for(const c of todas){
      if(c.id === a.id || st(c.id) !== 'rival') continue;
      if(R.ehMaiorRival(E, E.torcida.id, c.id)) continue;
      if(grupoDoStatus(M().statusDoValor(R.relacaoDelas(E, a.id, c.id))) !== 'aliado') continue;
      cands.push({a, c, quente: R.nivel(E, c.id)});
    }
    if(!cands.length) return null;
    const nota = x => H(`paz|${sa}|${x.a.id}|${x.c.id}`) % 1000;
    cands.sort((x,y)=>(y.quente - x.quente) || nota(x) - nota(y));
    /* A LEALDADE VEM ANTES (correção do dono, 12/09/2026): não se
       encerra treta com quem é maior rival de uma aliada nossa — nem
       com quem tem uma aliada que nos tem como maior rival */
    const passa = cands.slice(0, 8).find(x=>!TO.eixos ||
      !TO.eixos.trancaDeAliado(E, E.torcida.id, x.c.id));
    if(!passa) return null;
    const {a, c} = passa;
    const cid = TO.financeiro.nomeCidade ? TO.financeiro.nomeCidade(c.mapa) : c.mapa;
    return {tipo:'paz', chave:`paz|${a.id}|${c.id}|${E.data.ano}`,
      rot:'Fim de treta', voz:a.nome, de:a.id, nome:a.nome, alvo:c.id, alvoNome:c.nome,
      valor: Math.round(R.nivel(E, c.id)),
      texto:`Fala irmão. A ${c.nome} (${cid}) anda junto com a gente, e vocês dois `+
            `se pegando põe a gente no meio — a gente não quer escolher lado. `+
            `Se vocês toparem, a gente senta os dois e encerra essa treta: `+
            `ninguém vira aliado de ninguém, mas ninguém procura ninguém também. Topa?`,
      botoes:[{id:'sim', rot:'Encerrar a treta', acao:'paz-sim',
               nota:`a ${c.nome} vira neutra · +3 com a ${a.nome}`},
              {id:'nao', rot:'Rival continua rival', acao:'paz-nao',
               nota:`−3 com a ${a.nome} · nada muda com a ${c.nome}`}]};
  }

  /* =======================================================
     A ALIADA PEDE QUE A GENTE LARGUE OUTRA ALIADA
     (pedido do dono, 12/09/2026)

     O terceiro lado da mesa, e o espelho do que as IAs já faziam entre
     si: `eixos.mesaDela` tem a jogada AFASTAR — a parceira que anda com
     um maior rival do eixo é cobrada a largar. Faltava o mesmo chegando
     em NÓS. Umas duas vezes por ano uma aliada senta e diz que não dá
     pra andar com ela e com a outra ao mesmo tempo, porque as duas se
     pegam de verdade.

     Quem pede tem que ser aliada nossa; a cobrada também tem que ser
     ALIADA NOSSA — largar quem já é neutro não custa nada —, e as duas
     precisam ser RIVAIS entre si. Irmã não se larga (`saoIrmas`), que
     é a mesma trava da jogada das IAs.

     Aceitar zera a relação com a cobrada (neutro, nunca rival: a gente
     para de andar junto, não vira inimigo) e rende +3 com quem pediu.
     Recusar custa 3 com quem pediu e não mexe com a outra — a mesma
     régua da aproximação e do fim de treta.
     ======================================================= */
  function pautaAfastar(E, forcar){
    const R = TO.relacoes, H = TO.mapa.hash, sa = R.semanaAbs(E);
    /* DUAS VEZES POR ANO, em seis reuniões */
    if(!forcar && (H(`afasta|${E.data.ano}|${mesDe(E)}`) % 3) !== 0) return null;
    const todas = M().jogaveis().filter(o=>o.id !== E.torcida.id && !o.incompleta);
    const st = id => grupoDoStatus(M().statusDoValor(R.nivel(E, id)));
    const aliadas = todas.filter(o=>st(o.id) === 'aliado');
    if(aliadas.length < 2) return null;
    const cands = [];
    for(const a of aliadas) for(const c of aliadas){
      if(c.id === a.id) continue;
      if(M().saoIrmas && M().saoIrmas(E.torcida.id, c.id)) continue;
      const entre = R.relacaoDelas(E, a.id, c.id);
      if(grupoDoStatus(M().statusDoValor(entre)) !== 'rival') continue;
      cands.push({a, c, entre, maior: R.ehMaiorRival(E, a.id, c.id)});
    }
    if(!cands.length) return null;
    const nota = x => H(`afasta|${sa}|${x.a.id}|${x.c.id}`) % 1000;
    /* o maior rival dela vem primeiro: é a cobrança que mais dói */
    cands.sort((x,y)=>(y.maior?1:0) - (x.maior?1:0) || (x.entre - y.entre) || nota(x) - nota(y));
    const {a, c, maior} = cands[0];
    const cid = TO.financeiro.nomeCidade ? TO.financeiro.nomeCidade(c.mapa) : c.mapa;
    return {tipo:'afastar', chave:`afasta|${a.id}|${c.id}|${E.data.ano}`,
      rot:'Cobrança de aliada', voz:a.nome, de:a.id, nome:a.nome,
      alvo:c.id, alvoNome:c.nome,
      texto:`Fala irmão. Vocês andam com a ${c.nome} (${cid}), e a gente `+
            (maior ? `se pega com eles desde sempre` : `não se bica com eles`)+
            `. Não dá pra ficar de bem com os dois lados: ou é a gente, ou é eles. `+
            `Larga a ${c.nome}?`,
      botoes:[{id:'sim', rot:`Largar a ${c.nome}`, acao:'afastar-sim',
               nota:`a ${c.nome} vira neutra · +3 com a ${a.nome}`},
              {id:'nao', rot:'Continuar com as duas', acao:'afastar-nao',
               nota:`−3 com a ${a.nome}`}]};
  }

  /* =======================================================
     OS EIXOS DE ALIANÇA NO FEED (pedido do dono, 11/09/2026)
     O modelo (eixos.js) decide quem entra e quem funda; aqui vira
     cartão: o convite ao dono é decisão com a voz do eixo, e o resto
     é notícia da rua — quem entrou onde, e o eixo que nasceu.
     ======================================================= */
  function eixosDoDia(E, forcar){
    const X = TO.eixos; if(!X) return [];
    const evs = X.eventosDoDia(E, forcar);
    const nome = id => (M().torcida(id)||{}).nome || id;
    for(const ev of evs){
      const x = X.eixo(E, ev.eixo); if(!x) continue;
      if(ev.tipo === 'saida'){
        /* rival não convive no eixo (dono, 17/09/2026): só vira cartão
           quando é conosco — a gente saindo, ou alguém do nosso eixo */
        const nos = E.torcida.id;
        if(ev.torcida !== nos && !x.membros.includes(nos)) continue;
        propor(E, {
          kind:'eixo-saida', peso:'info', tipo:'ruim', voz:'eixo',
          chave:`eixo-saida|${x.id}|${ev.torcida}|${E.data.ano}|${E.data.semana}`,
          dados:{de:x.id, nome:x.nome},
          texto: ev.torcida === nos
            ? `A gente saiu do ${x.nome}: virou rival da ${nome(ev.outra)}, e o eixo ficou `+
              `com quem é mais próximo dele. Quem fica leva −20 com a gente.`
            : `A ${nome(ev.torcida)} saiu do ${x.nome}: virou rival da ${nome(ev.outra)}, `+
              `e o eixo ficou com quem é mais próximo. Sair custou −20 com cada um de nós.`
        });
        continue;
      }
      if(ev.tipo === 'convite'){
        const rivais = X.maioresRivaisDoEixo(E, x).filter(r=>TO.relacoes.nivel(E, r) > -15);
        const outros = x.membros.filter(m=>m !== ev.porta);
        pautar(E, {
          tipo:'eixo-convite', rot:'Convite de eixo', voz:nome(ev.porta),
          chave:`eixo-convite|${x.id}|${E.data.ano}|${E.data.semana}`,
          texto:`Fala irmão, aqui é a ${nome(ev.porta)}. O pessoal do ${x.nome} sentou e o `+
                `nome de vocês saiu na mesa: ${outros.length ? outros.map(nome).join(', ')+' e a gente' : 'a gente'} `+
                `queremos vocês dentro. Entrando, vocês são aliados de todos nós`+
                (rivais.length ? ` — e rivais de quem é maior rival da gente: ${rivais.map(nome).join(', ')}` : '')+`. Fecha?`,
          de:x.id, nomeEixo:x.nome, porta:ev.porta, rivais,
          botoes:[{id:'sim', rot:`Entrar no ${x.nome}`, acao:'eixo-sim',
                   nota:`aliada de ${x.membros.length} torcidas`+(rivais.length ? ` · rival de ${rivais.length}` : '')},
                  {id:'nao', rot:'Ficar de fora', acao:'eixo-nao',
                   nota:`−3 com a ${nome(ev.porta)} · eles voltam a chamar em meio ano`}]
        });
      } else if(ev.tipo === 'proposta'){
        /* NO NOSSO EIXO O DONO DÁ O AVAL (dono, 11/09/2026): o eixo põe
           o nome na mesa e a gente concorda ou veta — na reunião do mês. */
        const o = M().torcida(ev.torcida) || {};
        const cid = TO.financeiro.nomeCidade ? TO.financeiro.nomeCidade(o.mapa) : o.mapa;
        pautar(E, {
          tipo:'eixo-proposta', rot:'Nome na mesa', voz:nome(ev.porta),
          chave:`eixo-proposta|${x.id}|${ev.torcida}|${E.data.ano}|${E.data.semana}`,
          texto:`Fala irmão, aqui é a ${nome(ev.porta)}. O ${x.nome} sentou pra falar `+
                `da ${o.nome || ''}, de ${cid}. O pessoal quer eles dentro do eixo — `+
                `com vocês também, claro. Tá fechado pra vocês?`,
          de:x.id, nomeEixo:x.nome, torcida:ev.torcida, porta:ev.porta,
          botoes:[{id:'sim', rot:'Aceitar no eixo', acao:'eixo-aceita',
                   nota:`a ${o.nome || ''} vira aliada de todo o eixo`},
                  {id:'nao', rot:'Vetar', acao:'eixo-veta',
                   nota:`o nome sai da mesa por meio ano`}]
        });
      }
      /* ENTRADA E FUNDAÇÃO ALHEIAS NÃO VÃO PRO FEED (ordem do dono,
         11/09/2026): o feed só trata do NOSSO eixo, e desde a reunião
         mensal nem isso — o que é nosso vira pauta da mesa do dia 5.
         O mundo inteiro aparece na lista de novidades da aba Eixos. */
    }
    return evs;
  }

  /* =======================================================
     A REUNIÃO MENSAL DE DIPLOMACIA (pedido do dono, 11/09/2026)
     Toda diplomacia que pedia decisão estava espalhada pelo feed, um
     cartão por assunto, no dia em que o assunto nascia. O dono pediu
     mesa: TODO DIA 5 a diretoria senta e decide tudo de uma vez —
     as aproximações que as aliadas oferecem, o fim de treta que elas
     intermedeiam, os convites e os nomes que os eixos põem na mesa, e
     a nossa própria jogada (fundar um eixo ou pedir entrada num).

     O que nasce fora do dia 5 — um convite de eixo, por exemplo — fica
     GUARDADO em `E.reuniao.pauta` até a reunião. Nada disso volta a
     virar cartão solto: o feed tem um cartão por bimestre, e ele abre a
     tela da reunião.
     ======================================================= */
  const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho',
                 'agosto','setembro','outubro','novembro','dezembro'];
  const dataDeHoje = E => TO.estado.dataDaSemana(E.data.ano, E.data.semana, E.data.dia);
  const mesDe = E => dataDeHoje(E).getMonth() + 1;

  function caixaReuniao(E){
    if(!E.reuniao) E.reuniao = {pauta:[], seq:1, ultima:null};
    E.reuniao.pauta = E.reuniao.pauta || [];
    E.reuniao.seq = E.reuniao.seq || 1;
    return E.reuniao;
  }
  /* QUEM TRAZ A PAUTA (pedido do dono, 22/09/2026): cada assunto da
     mesa é a fala de UM diretor — é em cima dele que o balão abre na
     cena da roda. A escolha é pelo número do assunto, rodando pela
     diretoria de pé; o presidente não pauta, ele decide. */
  function diretorDaPauta(E, n){
    const dir = (E.membros||[]).filter(m=>m.cargo==='diretoria' && !m.presidente && !m.preso);
    const lista = dir.length ? dir : (E.membros||[]).filter(m=>!m.presidente);
    if(!lista.length) return null;
    return lista[n % lista.length].id;
  }
  /* guarda um assunto pra próxima mesa; a mesma chave não entra duas vezes */
  function pautar(E, item){
    const Rn = caixaReuniao(E);
    if(item.chave && Rn.pauta.some(x=>x.chave === item.chave)) return null;
    const it = Object.assign({id:Rn.seq++, decidido:null, consequencia:''}, item);
    if(it.quem == null) it.quem = diretorDaPauta(E, it.id);
    Rn.pauta.push(it);
    return it;
  }
  const pautaAberta = E => caixaReuniao(E).pauta.filter(x=>!x.decidido);

  /* A MESA PRA CENA DA RODA: o presidente, os diretores nas cadeiras e
     cada pauta com o diretor que a traz. É o que a cena desenha
     (docs/PLANO-REUNIAO-DIRETORIA.md) e o que a tela provisória lê. */
  function mesaDaReuniao(E){
    const Mb = TO.membros;
    const pres = Mb.presidente ? Mb.presidente(E) : null;
    const ficha = m => m ? {id:m.id, nome:Mb.nomeDe(m), cargo:Mb.cargoNome ? Mb.cargoNome(m) : m.cargo,
                            preso:!!m.preso, ferido:!!m.ferido} : null;
    const diretores = (E.membros||[]).filter(m=>m.cargo==='diretoria' && !m.presidente).map(ficha);
    const porId = new Map((E.membros||[]).map(m=>[m.id, m]));
    const pautas = caixaReuniao(E).pauta.map(it=>Object.assign({}, it, {diretor: ficha(porId.get(it.quem))}));
    return {presidente: ficha(pres), diretores, pautas};
  }

  /* O CARTÃO DA REUNIÃO: DIA 5, TODO MÊS (pedido do dono, 22/09/2026).
     Foi mensal, virou bimestral (12/09) e volta a ser mensal: agora é a
     REUNIÃO DA DIRETORIA, e não só de diplomacia — é nela que os botes
     do mês são propostos, com dia e alvo. O que nasce entre uma e outra
     continua guardado em `E.reuniao.pauta` e espera a próxima; nada
     vira cartão solto. */
  function reuniaoDeHoje(E){
    const Rn = caixaReuniao(E);
    const d = dataDeHoje(E);
    if(d.getDate() !== 5) return null;
    const marca = `${E.data.ano}|${mesDe(E)}`;
    if(Rn.ultima === marca) return null;
    Rn.ultima = marca;
    /* CONVITE SEM RESPOSTA É FESTA FURADA (22/09/2026): a lista de
       festas de uma mesa vai até a véspera da mesa seguinte, então o
       que ficou sem resposta na pauta antiga já passou — e furar
       afasta e queima, como sempre. A pauta fecha e sai na ata. */
    for(const it of Rn.pauta){
      /* aniversário sem resposta até a mesa seguinte: passou em branco */
      if(!it.decidido && it.tipo === 'aniversario' && it.dados){
        const F = FESTA_ANIV[it.dados.tipo] || FESTA_ANIV.torcida;
        it.consequencia = aplicarFestaAniv(E, it.dados, 'nada');
        it.decidido = {botao:'nada', rot:'Não fazer nada'};
        void F; continue;
      }
      /* alvos de assalto sem resposta: a lista envelheceu, sai calada */
      if(!it.decidido && it.tipo === 'assalto'){ it.decidido = {botao:'nada', rot:'Deixar quieto'}; it.consequencia = 'Ficou quieto.'; continue; }
      if(it.decidido || !it.festas || it.chave === `festas|${E.data.ano}|${mesDe(E)}`) continue;
      let r = null;
      for(const a of it.festas) if(!a.resposta) r = responderFesta(E, it.festas, a.torcida, false) || r;
      if(r){ it.consequencia = r.consequencia; if(r.todas) it.decidido = {botao:'lista', rot:r.rot}; }
    }
    /* o que as aliadas trazem nasce na própria mesa */
    const a = pautaAproximacao(E); if(a) pautar(E, a);
    const p = pautaPaz(E);         if(p) pautar(E, p);
    const f = pautaAfastar(E);     if(f) pautar(E, f);
    /* os botes do mês: o bar e a casa de piscina, cada um no seu dado */
    for(const tipo of ['bar','casa']){ const b = pautaBote(E, tipo); if(b) pautar(E, b); }
    /* os convites de festa das aliadas até a próxima reunião */
    { const fe = pautaFestas(E); if(fe) pautar(E, fe); }
    /* a nossa festa de aniversário e a do clube, e os alvos de assalto */
    for(const pa of pautaAniversarios(E)) pautar(E, pa);
    { const as = pautaAssalto(E); if(as) pautar(E, as); }
    const abertos = pautaAberta(E);
    const X = TO.eixos;
    const mesa = X && X.cabemosEmMais(E) && !X.esperaDaMesa(E);
    /* mesa vazia e sem jogada nossa possível: não se chama reunião */
    if(!abertos.length && !mesa) return null;
    const quantos = abertos.length;
    return propor(E, {
      kind:'reuniao', peso:'decisao', voz:'diretor',
      chave:`reuniao|${marca}`,
      texto:`Reunião da diretoria — ${MESES[d.getMonth()]}. `+
        (quantos ? `${quantos} assunto${quantos>1?'s':''} na mesa`
                 : 'Nada na mesa este mês')+
        (mesa ? ', e a nossa jogada nos eixos em aberto.' : '.'),
      dados:{ano:E.data.ano, mes:mesDe(E), assuntos:quantos},
      botoes:[{id:'abrir', rot:'Sentar com a diretoria', acao:'abrir-reuniao'}]
    });
  }

  /* =======================================================
     OS CONVITES DE FESTA NA REUNIÃO (pedido do dono, 22/09/2026)
     Era um cartão solto no começo de cada mês (08/09); agora é
     pauta da reunião do dia 5, com as aliadas — Aliado ou Irmandade
     (relação ≥ 20) e as irmãs de clube — cujo aniversário cai da
     reunião até o dia 4 do mês seguinte, ou seja, até a próxima
     mesa. Cada aliada tem o seu Ir / Não ir dentro do balão
     (`responderFestaDaPauta`); ir custa R$ 2.000 e aproxima, furar
     afasta e queima na rua; a pauta fecha quando todas tiverem
     resposta. A mensagem de cada aliada sai no mesmo dia.
     ======================================================= */
  function pautaFestas(E){
    const hoje = dataDeHoje(E);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 4, 23, 59);
    const lista = [];
    for(const o of M().jogaveis()){
      if(o.id === E.torcida.id || o.incompleta || !o.fundacao) continue;
      const irma = M().saoIrmas && M().saoIrmas(E.torcida.id, o.id);
      if(!irma && TO.relacoes.nivel(E, o.id) < 20) continue;
      /* o aniversário neste ano civil ou no próximo (a mesa de
         dezembro cobre até 4 de janeiro) */
      let aniv = dataDoAniversario(o.id, hoje.getFullYear());
      if(aniv < hoje) aniv = dataDoAniversario(o.id, hoje.getFullYear() + 1);
      if(aniv < hoje || aniv > fim) continue;
      const idade = aniv.getFullYear() - o.fundacao;
      if(idade <= 0) continue;
      lista.push({torcida:o.id, nome:o.nome, data:fmtDia(aniv), dia:aniv.getDate(),
                  mes:aniv.getMonth()+1, idade, resposta:null});
    }
    if(!lista.length) return null;
    lista.sort((a,b)=>(a.mes*40 + a.dia) - (b.mes*40 + b.dia));
    for(const a of lista)
      mensagemDe(E, a.torcida, `Fala irmão, dia ${a.data} comemoramos ${a.idade} `+
        `anos de história. A presença de vocês seria uma honra pra gente.`, 'convite');
    return {
      chave:`festas|${E.data.ano}|${mesDe(E)}`, rot:'Convites de festa', voz:'Diretoria',
      tipo:'festas', festas:lista, botoes:[],
      texto:`Os convites chegaram: ${lista.length} ${lista.length===1?'aliada faz':'aliadas fazem'} `+
            `aniversário até a próxima reunião. Ir custa R$ 2.000 por festa e aproxima; `+
            `furar afasta e queima na rua. Em quais a gente aparece?`
    };
  }

  /* =======================================================
     OS BOTES DO MÊS (pedido do dono, 22/09/2026)
     Um diretor propõe, na reunião, o bote no bar rival e/ou na
     resenha da casa de piscina — QUANDO (um dia do mês sem jogo
     do clube e sem caravana) e CONTRA QUEM. Cada tipo tem o seu
     dado: 35% ao mês, ≈ 8 botes por ano, a dose de sempre. O
     aceito entra em `E.botes` e no calendário; no dia, o cartão
     de hoje abre a cena pela porta de sempre.
     ======================================================= */
  const CHANCE_BOTE = 35;
  const todoDia = dia => (dia >= 6 ? 'todo ' : 'toda ') + NOME_DIA[dia];
  const dataCurtaDe = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;

  /* dia livre: sem jogo do clube e fora da véspera e do dia seguinte de
     um jogo em outra cidade — vale pra qualquer semana do ano, não só a
     corrente (que é o que `diaComumFeed` lê) */
  function diaLivre(E, semana, dia){
    const meu = M().time(E.torcida.clubeId);
    if(!meu || !E.temporada) return true;
    const abs = (semana-1)*7 + (dia-1);
    for(const j of TO.competicoes.agendaDoClube(E, meu.id)){
      if(j.semana === semana && j.dia === dia) return false;
      if(TO.financeiro.diasDaViagem(E, j).includes(abs)) return false;
    }
    return true;
  }
  const absDe = (semana, dia) => (semana-1)*7 + (dia-1);
  /* dois dias de folga entre um bote e outro */
  const boteColado = (E, semana, dia, extra) =>
    (E.botes||[]).some(b=>!b.feito && b.ano===E.data.ano && Math.abs(absDe(b.semana, b.dia) - absDe(semana, dia)) <= 2) ||
    (extra||[]).some(b=>Math.abs(absDe(b.semana, b.dia) - absDe(semana, dia)) <= 2);

  function diaDoBote(E, tipo, sem){
    const hoje = dataDeHoje(E);
    const ultimo = new Date(hoje.getFullYear(), hoje.getMonth()+1, 0).getDate();
    const outros = caixaReuniao(E).pauta.filter(x=>x.bote && !x.decidido).map(x=>x.bote);
    const cands = [];
    for(let dm = hoje.getDate()+2; dm <= ultimo; dm++){
      const d = new Date(hoje.getFullYear(), hoje.getMonth(), dm);
      const sd = TO.estado.semanaDiaDe(d);
      if(!sd || sd.ano !== E.data.ano || sd.semana > 52) continue;
      if(!diaLivre(E, sd.semana, sd.dia)) continue;
      if(boteColado(E, sd.semana, sd.dia, outros)) continue;
      cands.push({ano:sd.ano, semana:sd.semana, dia:sd.dia,
                  dataTxt: dataCurtaDe(d), nomeDia: NOME_DIA[sd.dia]});
    }
    if(!cands.length) return null;
    return cands[TO.mapa.hash(`bote|dia|${tipo}|${sem}|${E.torcida.id}`) % cands.length];
  }

  function pautaBote(E, tipo){
    const sem = `${E.data.ano}|${mesDe(E)}`;
    if(TO.mapa.hash(`bote|${tipo}|${sem}|${E.torcida.id}`) % 100 >= CHANCE_BOTE) return null;
    const alvo = tipo === 'bar' ? alvoDoBar(E, sem) : alvoDaCasa(E, sem);
    if(!alvo) return null;
    const quando = diaDoBote(E, tipo, sem);
    if(!quando) return null;
    const bote = Object.assign({tipo}, alvo, quando);
    const q = `${quando.nomeDia}, dia ${quando.dataTxt}`;
    /* textos do dono (26/08 e 21/09/2026), com o dia e o alvo na fala */
    const texto = tipo === 'bar'
      ? `Chefe, chegou a informação que o bar da ${alvo.nome} fica cheio deles `+
        `${todoDia(quando.dia)}. A gente quer dar o bote neles ${q} e roubar o caixa do bar.`
      : `Chefe, vimos nas redes sociais que a Zona ${alvo.zona} da ${alvo.nome} faz `+
        `resenha numa casa com piscina e a ${alvo.peca} deles fica estendida lá. `+
        `A gente quer dar o bote neles ${q} e tomar a ${alvo.peca}.`;
    return {
      chave:`bote|${tipo}|${sem}`, rot: tipo === 'bar' ? 'Bote no bar' : 'Bote na casa de piscina',
      voz:'Diretoria', tipo:'bote', bote, texto,
      botoes:[
        {id:'marcar', rot: tipo === 'bar' ? 'Marcar o bote no bar' : 'Marcar o bote', acao:'bote-marcar',
         nota: tipo === 'bar'
           ? 'Prestígio até ±10 · ganhando, R$ 60 por defensor + 22% do caixa · Relação −26 (perdendo, −18)'
           : `Prestígio até ±10 · tomando a ${alvo.peca}, prestígio a mais · Relação −26 (perdendo, −18)`},
        {id:'nada', rot:'Deixar quieto', acao:'bote-nao', nota:'Prestígio −1 · Moral −1'}
      ]
    };
  }

  /* o próximo dia livre depois do marcado: a agenda pode ter posto um
     jogo em cima (o árbitro adia jogo) */
  function proximoDiaLivre(E, b){
    for(let k=1;k<=10;k++){
      const abs = absDe(b.semana, b.dia) + k;
      const semana = Math.floor(abs/7)+1, dia = (abs%7)+1;
      if(semana > 52) return null;
      if(!diaLivre(E, semana, dia)) continue;
      const d = TO.estado.dataDaSemana(b.ano, semana, dia);
      return {semana, dia, dataTxt: dataCurtaDe(d), nomeDia: NOME_DIA[dia]};
    }
    return null;
  }

  /* O DIA DO BOTE: o cartão de hoje, com a mesma ação dos cartões de
     sempre — `atacar-bar-rival` e `atacar-casa-rival` abrem a cena. Um
     botão só: o bote foi decidido na reunião, hoje ele acontece. */
  function boteDeHoje(E){
    const lista = E.botes || [];
    if(!lista.length) return;
    const hojeAbs = absDe(E.data.semana, E.data.dia);
    E.botes = lista.filter(b => !(b.feito && (b.ano < E.data.ano ||
      (b.ano === E.data.ano && hojeAbs - absDe(b.semana, b.dia) > 60))));
    for(const b of E.botes){
      if(b.feito || b.ano !== E.data.ano || b.semana !== E.data.semana || b.dia !== E.data.dia) continue;
      if(!diaComumFeed(E, E.data.dia)){
        const prox = proximoDiaLivre(E, b);
        if(prox){ Object.assign(b, prox); continue; }
      }
      b.feito = true;
      if(b.tipo === 'bar'){
        propor(E, {
          kind:'barrival', peso:'decisao', voz:'diretor',
          chave:`bote|dia|${b.ano}|${b.semana}|${b.dia}|bar`,
          texto:`Hoje é o dia, chefe: o bar da ${b.nome} tá cheio deles. `+
                `O bonde desce e leva o caixa.`,
          dados:{alvo:b.alvo, nome:b.nome},
          botoes:[{id:'atacar', rot:'Descer no bar', acao:'atacar-bar-rival',
                   nota:'Prestígio até ±10 · ganhando, R$ 60 por defensor + 22% '+
                        'do caixa · Relação −26 (perdendo, −18)'}]
        });
      } else {
        propor(E, {
          kind:'casarival', peso:'decisao', voz:'diretor',
          chave:`bote|dia|${b.ano}|${b.semana}|${b.dia}|casa`,
          texto:`Hoje é o dia, chefe: a Zona ${b.zona} da ${b.nome} tá na resenha da `+
                `casa com piscina, com a ${b.peca} estendida. Bora dar o bote e tomar a ${b.peca}.`,
          dados:{rival:b.rival, nome:b.nome, zona:b.zona, bairro:b.bairro, peca:b.peca},
          botoes:[{id:'atacar', rot:'Dar o bote', acao:'atacar-casa-rival',
                   nota:`Prestígio até ±10 · tomando a ${b.peca}, prestígio a mais · `+
                        'Relação −26 (perdendo, −18)'}]
        });
      }
    }
  }

  /* a decisão de UM item da pauta, com o mesmo efeito que o cartão solto
     tinha antes: quem aplica é o `responder` de sempre, por `acao` */
  function decidirPauta(E, idItem, idBotao){
    const Rn = caixaReuniao(E);
    const it = Rn.pauta.find(x=>x.id === idItem);
    if(!it || it.decidido) return {ok:false};
    const b = (it.botoes||[]).find(x=>x.id === idBotao);
    if(!b) return {ok:false};
    const r = aplicarPauta(E, it, b);
    it.decidido = {botao:idBotao, rot:b.rot};
    return Object.assign({ok:true, item:it}, r || {});
  }
  /* os efeitos, um por ação — os mesmos números dos cartões antigos */
  function aplicarPauta(E, it, b){
    const nome = id => (M().torcida(id)||{}).nome || id;
    switch(b.acao){
      case 'interm-sim': {
        const S = E.statusRel = E.statusRel || {visto:{}, recusa:{}};
        S.visto = S.visto || {}; S.recusa = S.recusa || {};
        const v = TO.relacoes.nivel(E, it.alvo);
        E.relacoes[it.alvo] = U.limitar(Math.max(v + 15, 25), -100, 100);
        E.relacoes[it.de]   = U.limitar(TO.relacoes.nivel(E, it.de) + 3, -100, 100);
        S.visto[it.alvo] = 'aliado';
        it.consequencia = `A ${it.nome} sentou os dois: a ${it.alvoNome} agora é aliada `+
          `(${Math.round(E.relacoes[it.alvo])}) · +3 com a ${it.nome}.`;
        return {};
      }
      case 'interm-nao':
        E.relacoes[it.de] = U.limitar(TO.relacoes.nivel(E, it.de) - 3, -100, 100);
        it.consequencia = `Ficou como está. A ${it.nome} não gostou: −3.`;
        return {};
      case 'paz-sim': {
        const S = E.statusRel = E.statusRel || {visto:{}, recusa:{}};
        S.visto = S.visto || {}; S.recusa = S.recusa || {};
        E.relacoes[it.alvo] = 0;
        E.relacoes[it.de]   = U.limitar(TO.relacoes.nivel(E, it.de) + 3, -100, 100);
        S.visto[it.alvo] = 'neutro';
        it.consequencia = `A ${it.nome} sentou os dois: a treta com a ${it.alvoNome} `+
          `acabou — neutro daqui pra frente · +3 com a ${it.nome}.`;
        return {};
      }
      case 'paz-nao':
        E.relacoes[it.de] = U.limitar(TO.relacoes.nivel(E, it.de) - 3, -100, 100);
        it.consequencia = `A treta com a ${it.alvoNome} fica de pé. A ${it.nome} não gostou: −3.`;
        return {};
      case 'afastar-sim': {
        const S = E.statusRel = E.statusRel || {visto:{}, recusa:{}};
        S.visto = S.visto || {}; S.recusa = S.recusa || {};
        /* neutro, nunca rival: a gente para de andar junto, não vira inimigo */
        E.relacoes[it.alvo] = 0;
        E.relacoes[it.de]   = U.limitar(TO.relacoes.nivel(E, it.de) + 3, -100, 100);
        S.visto[it.alvo] = 'neutro';
        it.consequencia = `A gente largou a ${it.alvoNome} — neutro daqui pra frente · `+
          `+3 com a ${it.nome}.`;
        return {};
      }
      case 'afastar-nao':
        E.relacoes[it.de] = U.limitar(TO.relacoes.nivel(E, it.de) - 3, -100, 100);
        it.consequencia = `A gente fica com as duas. A ${it.nome} não gostou: −3.`;
        return {};
      case 'eixo-sim': {
        const r = TO.eixos.entrar(E, it.de, E.torcida.id);
        it.consequencia = !r ? 'Não rolou.'
          : `Dentro do ${it.nomeEixo}. `+
            (r.novasAliadas.length ? `Novas aliadas: ${r.novasAliadas.map(nome).join(', ')}. ` : 'Já éramos aliados de todos. ')+
            (r.novosRivais.length ? `Novos rivais: ${r.novosRivais.map(nome).join(', ')}.` : '');
        return {};
      }
      case 'eixo-nao':
        TO.eixos.recusar(E, it.de, it.porta);
        it.consequencia = `A gente ficou de fora do ${it.nomeEixo}.`;
        return {};
      case 'eixo-aceita': {
        const r = TO.eixos.entrar(E, it.de, it.torcida);
        it.consequencia = !r ? 'Não rolou.'
          : `A ${nome(it.torcida)} está dentro do ${it.nomeEixo}. `+
            (r.novasAliadas.includes(E.torcida.id) || TO.relacoes.nivel(E, it.torcida) >= 20
              ? 'Aliada nossa agora.' : '');
        return {};
      }
      case 'eixo-veta':
        TO.eixos.vetar(E, it.de, it.torcida);
        it.consequencia = `A gente vetou a ${nome(it.torcida)} no ${it.nomeEixo}.`;
        return {};
      /* o bote do mês (dono, 22/09/2026): marcado, entra no calendário */
      case 'bote-marcar': {
        const b = it.bote; if(!b) return {};
        E.botes = E.botes || [];
        if(!E.botes.some(x=>x.ano===b.ano && x.semana===b.semana && x.dia===b.dia && x.tipo===b.tipo))
          E.botes.push(Object.assign({}, b, {feito:false,
            marcadoEm:{ano:E.data.ano, semana:E.data.semana, dia:E.data.dia}}));
        it.consequencia = `Marcado pra ${b.nomeDia}, ${b.dataTxt}: `+
          (b.tipo==='bar' ? `o bar da ${b.nome}.` : `a resenha da Zona ${b.zona} da ${b.nome}.`)+
          ' Está no calendário.';
        return {};
      }
      case 'aniv-festa':
        it.consequencia = aplicarFestaAniv(E, it.dados || {}, b.id);
        return {};
      case 'assalto-nao':
        it.consequencia = 'Ficou quieto.';
        return {};
      case 'bote-nao':
        TO.estado.mexerIndicador(E, 'prestigio', -0.2, 'Deixamos o bote quieto');
        TO.estado.mexerIndicador(E, 'moral', -1, 'Deixamos o bote quieto');
        it.consequencia = 'Deixamos quieto. Prestígio −1 · Moral −1.';
        return {};
    }
    return {};
  }
  /* A FESTA DE ANIVERSÁRIO, o efeito de cada escolha — o mesmo pro
     cartão antigo (save velho) e pra pauta da reunião */
  function aplicarFestaAniv(E, d, idBotao){
    const F = FESTA_ANIV[d.tipo] || FESTA_ANIV.torcida;
    const f = F[idBotao];
    if(!f) return '';
    const quem = d.tipo === 'torcida' ? 'da torcida' : 'do clube';
    if(idBotao === 'nada'){
      TO.estado.mexerIndicador(E, 'moral', f.moral, `Aniversário ${quem} passou em branco`);
      return 'Ninguém fez nada. −2 de moral.';
    }
    TO.estado.lancar(E, `Festa de aniversário ${quem}`, -f.custo);
    TO.estado.mexerIndicador(E, 'moral', f.moral, `Festa de aniversário ${quem}`);
    (E.festasAniversario = E.festasAniversario || {})[`festa-${d.tipo}|${d.anoCivil}`] = idBotao;
    return `Festa ${idBotao === 'grande' ? 'grande' : 'simples'} marcada: `+
           `${U.dinheiro(-f.custo)} agora, a receita sai no dia.`;
  }
  /* AS PAUTAS DO ANIVERSÁRIO NOSSO E DO CLUBE (pedido do dono,
     22/09/2026): a pergunta "que festa vamos fazer?" — antes um cartão
     dez dias antes — entra na reunião do dia 5 quando o aniversário
     cai da mesa até a véspera da próxima (dia 4 do mês seguinte). */
  function pautaAniversarios(E){
    const hoje = dataDeHoje(E);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 4, 23, 59);
    const meus = [];
    if(E.torcida.fundacao)
      meus.push({tipo:'torcida', id:E.torcida.id, fundacao:E.torcida.fundacao, fonte:E.torcida});
    const time = M().time(E.torcida.clubeId);
    if(time && time.fundacao)
      meus.push({tipo:'clube', id:'clube|'+E.torcida.clubeId, fundacao:time.fundacao, nome:time.nome, fonte:time});
    const fora = [];
    for(const q of meus){
      let aniv = dataDoAniversario(q.id, hoje.getFullYear(), q.fonte);
      if(aniv < hoje) aniv = dataDoAniversario(q.id, hoje.getFullYear() + 1, q.fonte);
      if(aniv < hoje || aniv > fim) continue;
      const anoCivil = aniv.getFullYear(), idade = anoCivil - q.fundacao;
      if(idade <= 0) continue;
      const F = FESTA_ANIV[q.tipo];
      fora.push({
        chave:`aniv-${q.tipo}|${anoCivil}`, tipo:'aniversario', voz:'Diretoria',
        rot: q.tipo === 'torcida' ? 'Aniversário da torcida' : `Aniversário do ${q.nome}`,
        texto: q.tipo === 'torcida'
          ? `Dia ${fmtDia(aniv)} a torcida completa ${idade} anos. Que festa vamos fazer?`
          : `Dia ${fmtDia(aniv)} o ${q.nome} completa ${idade} anos. Que festa vamos fazer?`,
        dados:{tipo:q.tipo, anoCivil},
        botoes:[
          {id:'grande',  rot:'Festa grande', acao:'aniv-festa',
           nota:`R$ ${U.numero(F.grande.custo)} · potencial de ${U.dinheiro(F.grande.min)} a `+
                `${U.dinheiro(F.grande.max)} · +${F.grande.moral} de moral`},
          {id:'simples', rot:'Festa simples', acao:'aniv-festa',
           nota:`R$ ${U.numero(F.simples.custo)} · potencial de ${U.dinheiro(F.simples.min)} a `+
                `${U.dinheiro(F.simples.max)} · +${F.simples.moral} de moral`},
          {id:'nada',    rot:'Não fazer nada', acao:'aniv-festa', nota:`${F.nada.moral} de moral`}
        ]
      });
    }
    return fora;
  }
  /* O ASSALTO NA REUNIÃO (pedido do dono, 22/09/2026): a lista de
     alvos deixa de ser cartão solto numa semana sorteada e vira pauta
     da mesa — nove meses em doze, pela mesma dose de sempre (9 por
     ano), decididos pelo hash do mês. "Ver os alvos" abre a tela do
     assalto por cima da cena e o resultado fecha a pauta. */
  const ASSALTOS_MESES = 9;
  function pautaAssalto(E){
    const H = TO.mapa.hash;
    if(H(`assalto|${E.data.ano}|${mesDe(E)}|${E.torcida.id}`) % 12 >= ASSALTOS_MESES) return null;
    const dir = E.membros.find(m=>m.cargo === 'diretoria' && !m.presidente && TO.membros.disponivel(m));
    if(!dir) return null;
    if(E.membros.filter(TO.membros.disponivel).length < 2) return null;
    return {
      chave:`assalto|${E.data.ano}|${mesDe(E)}`, tipo:'assalto', voz:'Diretoria', quem:dir.id,
      rot:'Alvos de assalto',
      texto:`Chefe, mapeei uns alvos pra um assalto — do mercadinho ao banco, cada um com seu risco. Bora ver?`,
      botoes:[
        {id:'ver',  rot:'Ver os alvos',  acao:'assalto-ver'},
        {id:'nada', rot:'Deixar quieto', acao:'assalto-nao', nota:'sem efeito'}
      ]
    };
  }
  /* o assalto feito pela tela fecha a pauta com o resultado dele */
  function fecharPautaAssalto(E, idItem, r){
    const it = caixaReuniao(E).pauta.find(x=>x.id === idItem);
    if(!it || it.decidido) return {ok:false};
    it.decidido = {botao:'ver', rot: r.caiu ? 'Deu ruim' : 'Assalto feito'};
    it.consequencia = r.caiu ? `${r.n} presos por ${r.pena} dias — e o dinheiro ficou lá.`
                             : `${U.dinheiro(r.valor)} na conta.`;
    return {ok:true};
  }

  /* a mesa levanta: o que não foi decidido fica pra próxima */
  function fecharReuniao(E){
    const Rn = caixaReuniao(E);
    const feitos = Rn.pauta.filter(x=>x.decidido);
    Rn.pauta = Rn.pauta.filter(x=>!x.decidido);
    return {decididos: feitos.length, sobrou: Rn.pauta.length};
  }

  /* O CARTÃO DE SEGUNDA (pedido do dono, 10/09/2026): o planejamento
     da semana mora no feed, uma tela por semana, sempre na segunda. O
     cartão é DECISÃO quando há jogo nosso — o relógio espera o plano
     fechar, como esperava a caravana —, e informação na semana de
     folga. O conteúdo é montado pelo cartão, que lê a pauta de cada
     cidade na hora; aqui só se registra a semana. */
  function semanaDeHoje(E){
    if(E.data.dia !== 1) return;
    if(!E.temporada) return;
    const temJogo = !!E.proximoJogo;
    const cidades = [E.torcida.mapa].concat(
      ((E.patrimonio||{}).filiais||[]).map(f=>f.cidade));
    /* SEM JOGO NENHUM NA PRAÇA, NÃO HÁ CARTÃO (ordem do dono,
       11/09/2026): a semana de folga em que também não rola nada na
       sede nem nas subsedes não tem o que planejar — o cartão só
       dizia "nenhum jogo nesta praça na semana". */
    const temPauta = temJogo ||
      cidades.some(c => TO.praca.jogosDaPraca(E, E.data.semana, c).length);
    if(!temPauta) return;
    propor(E, {
      kind:'semana', voz:'diretor', peso: temJogo ? 'decisao' : 'info',
      chave:`semana|${E.data.ano}|${E.data.semana}`,
      texto: temJogo ? '' : 'Semana de folga do time.',
      dados:{cidades, semana:E.data.semana, ano:E.data.ano},
      botoes: temJogo
        ? [{id:'fechar', rot:'Fechar o planejamento', acao:'fechar-semana'}]
        : null
    });
  }

  /* a lista de estimativas DAQUELE JOGO: as torcidas dos dois clubes
     que pisam na rua naquele dia */
  function estimativasDaRua(E, dia, jogo){
    const doJogo = jogo
      ? new Set([...M().torcidasDe(jogo.casa.id), ...M().torcidasDe(jogo.vis.id)]
                  .map(o=>o.id))
      : null;
    return TO.praca.naRuaEm(E, dia)
      .filter(b => !b.nossa)
      .filter(b => !doJogo || doJogo.has(b.id))
      .map(b => ({id:b.id, nome:b.nome, n:b.n,
                  faixa: PL().faixaDeEfetivo(E, b.n, b.id),
                  hostil: ehHostil(E, b.id)}));
  }

  const chaveDoJogoDaFilial = (cidade, semana, casa, vis) =>
    `sub|${cidade}|${semana}|${casa}|${vis}`;
  function chaveDoJogoDaPraca(E, j){
    const o = PL().outrosJogosNaCidade(E, E.data.semana)
      .find(x => x.casa.id === j.casa.id && x.vis.id === j.vis.id);
    return o ? o.chave : `${j.casa.id}|${j.vis.id}|${E.data.semana}`;
  }

  /* SITUAÇÃO 3 — nosso jogo fora: não há mais cartão nenhum. O
     `olheiroFora` dizia quem estava na pista de lá e o tamanho da
     caravana; o cartão de segunda já decide os dois, e o dono mandou
     tirar (11/09/2026). Quem quiser ver a pista de lá abre o cartão da
     semana, que lista as torcidas de cada jogo. */

  /* -------------------------------------------------------
     1b. A CAMPANA DO OLHEIRO (Inteligência — pedido do dono,
         24/08/2026). Com a diária paga no expediente, o
         olheiro tem 50% de chance de prever cada emboscada e
         ataque que vem (100% na campana dupla). O sorteio é
         por hash: a mesma fita nunca é re-sorteada, e a chave
         segura a mensagem de sair duas vezes. Os textos-base
         são do dono, palavra por palavra, com nome e praça
         entrando no lugar dos exemplos.
     ------------------------------------------------------- */
  function nivelDaCampana(E){
    const c = E.campana;
    if(!c) return 0;
    const abs = (E.data && E.data.absoluto) || 0;
    /* a diária cobre a viagem: o expediente não roda em dia de
       caravana nem de jogo, então o último pagamento vale 7 dias */
    if(abs - (c.pagoAbs || 0) > 7) return 0;
    return c.nivel || 0;
  }
  function avisoDoOlheiro(E, av){
    /* filial na praça é olheiro fixo (dono, 25/08/2026): com `forcar`
       o aviso sai SEMPRE, pago ou não o expediente de Inteligência */
    const nivel = av.forcar ? 2 : nivelDaCampana(E);
    if(!nivel) return;
    const chave = 'campana|' + av.chave;
    if(nivel < 2 && TO.mapa.hash(chave) % 2) return;   // 50% na simples
    const LUGAR = {concentracao:'na concentração',
                   pista:'na pista a caminho do estádio'};
    const texto = av.alvo === 'emboscada'
      ? (av.chegada
         ? `Fala presida, me passaram a fita de que os caras da ${av.nome} `+
           `vai atacar a gente assim que chegarmos em ${av.cidade}. `+
           `Vale ficar de olho.`
         : `Chefe, descobri que a ${av.nome} vai atacar a gente quando `+
           `passarmos por ${av.cidade}. Bora se preparar pra esse ataque deles.`)
      : av.alvo === 'bar'
      ? `Fala presida, me passaram a fita de que os caras da ${av.nome} `+
        `vai atacar o nosso bar hoje. Vale ficar de olho.`
      : av.alvo === 'casa'
      ? `Fala presida, me passaram a fita de que os caras da ${av.nome} `+
        `vai dar o bote na resenha da Zona ${av.zona || 'Sul'} hoje, na casa `+
        `de piscina. Vale ficar de olho.`
      : `Fala presida, me passaram a fita de que os caras da ${av.nome} `+
        `vai atacar a gente ${LUGAR[av.alvo] || 'na rua'} no dia do jogo. `+
        `Vale ficar de olho.`;
    const cobranca = av.cobranca
      ? ' É cobrança: eles não engoliram a surra que levaram da gente.' : '';
    propor(E, {kind:'campana', peso:'info', tipo:'ruim', voz:'olheiro',
               chave, texto: texto + cobranca});
  }

  /* -------------------------------------------------------
     2. O DIA DA GUERRA — o ataque que o jogador marcou
     ------------------------------------------------------- */
  function guerraDeHoje(E){
    const p = PL().plano(E);
    const hoje = E.data.dia;
    const f = PL().efetivoDoAtaque(E);
    const bombas = p.bombas || 0;
    const nota = `${f.vao} dos nossos · ${bombas} ${bombas===1?'bomba':'bombas'}`;

    /* a) nosso jogo (em casa ou fora) com ataque marcado */
    const j = E.proximoJogo;
    /* O DIA DO NOSSO JOGO É DO ITINERÁRIO (régua do dono, 20/08/2026).
       A investida que o planejamento marcou não vira mais um cartão
       solto no feed: ela aparece como PARADA da linha do dia, no ponto
       combinado (concentração, pista ou arredores), e abre a mesma
       cena de lá. As investidas nos OUTROS jogos da praça continuam
       aqui embaixo, que essas não são do nosso dia. */
    if(false && j && p.intencao === 'atacar' && p.alvoTorcida &&
       (j.dia||6) === hoje && !p.guerraJogada){
      const o = M().torcida(p.alvoTorcida);
      const onde = PL().ONDE_ATAQUE.find(x=>x.id === PL().ondeDoPlano(p)) || {};
      const chave = `guerra|${E.data.ano}|${E.data.semana}|${p.alvoTorcida}`;
      propor(E, {
        kind:'guerra', peso:'decisao', chave, voz:'diretor', tipo:'ruim',
        texto: j.casa
          ? `Hoje é o dia. A ${o?o.nome:''} vai estar `+
            `${(onde.rot||'nos arredores').toLowerCase()} e a gente vai pra cima.`
          : `Hoje é o dia. A ${o?o.nome:''} vai estar na cidade deles, `+
            `em ${j.cidadeAdv}, e a gente vai pra cima.`,
        dados:{tipo: j.casa ? 'casa' : 'fora', nota},
        botoes:[{id:'guerra', rot:'Ir pra Guerra', acao:'cena-guerra',
                 args:{tipo: j.casa ? 'casa' : 'fora'},
                 nota: nota + ' · a briga vale até ±10 de prestígio'}]
      });
    }

    /* b) ataque marcado num jogo alheio da praça */
    for(const og of PL().outrosJogosNaCidade(E, E.data.semana)){
      if((og.dia||6) !== hoje) continue;
      const inv = PL().investidaDe(E, og.chave);
      if(!inv || !inv.alvo || inv.jogada) continue;
      const o = M().torcida(inv.alvo);
      const chave = `guerra|${E.data.ano}|${E.data.semana}|praca|${og.chave}`;
      propor(E, {
        kind:'guerra', peso:'decisao', chave, voz:'diretor', tipo:'ruim',
        texto:`Hoje é o dia. A ${o?o.nome:''} vai estar na praça pro `+
              `${og.casa.nome} × ${og.vis.nome}, e a gente vai pra cima.`,
        dados:{tipo:'praca', chaveJogo:og.chave, dia:og.dia, nota},
        botoes:[{id:'guerra', rot:'Ir pra Guerra', acao:'cena-guerra',
                 args:{tipo:'praca', chaveJogo:og.chave, dia:og.dia},
                 nota: nota + ' · a briga vale até ±10 de prestígio'}]
      });
    }
  }

  /* -------------------------------------------------------
     3. O ATAQUE SOFRIDO — bar/loja em dia comum, concentração
        em dia de jogo em casa, pista a caminho do estádio,
        estrada na caravana.
     ------------------------------------------------------- */
  const SOFRIDO = {
    bar:          {texto:o=>`Invadiram nosso bar! A ${o} tá na porta quebrando tudo.`,
                   brigar:'Descer pra briga', fugir:'Deixar quebrarem'},
    concentracao: {texto:o=>`A ${o} caiu em cima da nossa concentração antes do jogo!`,
                   brigar:'Pra cima deles', fugir:'Recuar pra sede'},
    pista:        {texto:o=>`A ${o} fechou a gente na pista, a caminho do estádio!`,
                   brigar:'Pra cima deles', fugir:'Furar e seguir pro jogo'},
    emboscada:    {texto:o=>`Pegaram a caravana na estrada. A ${o} fechou a pista.`,
                   brigar:'Descer pra treta', fugir:'Mandar seguir viagem'},
    casa:         {texto:(o,a)=>`A ${o} tá invadindo a resenha da Zona ${(a&&a.zona)||'Sul'} `+
                                `na casa de piscina! Querem levar a nossa faixa.`,
                   brigar:'Segurar a casa', fugir:'Largar a resenha'}
  };

  function ataqueSofridoHoje(E){
    const a = TO.relacoes.ataqueDeHoje(E);
    if(!a || a.avisado) return;
    /* concentração, pista e estrada acontecem DENTRO do itinerário do
       dia de jogo (régua do dono, 20/08/2026) — o feed não pergunta
       duas vezes. O ataque ao BAR continua aqui: é de dia comum. */
    if(a.alvo === 'concentracao' || a.alvo === 'pista' ||
       a.alvo === 'emboscada') return;
    a.avisado = true;
    const cfg = SOFRIDO[a.alvo] || SOFRIDO.bar;
    const chave = `sofrido|${E.data.ano}|${E.data.semana}|${a.torcida}|${a.alvo}`;
    propor(E, {
      kind:'sofrido', peso:'decisao', chave, voz:'diretor', tipo:'ruim',
      texto: cfg.texto(a.nome, a),
      dados:{torcida:a.torcida, alvo:a.alvo, cena:a.cena},
      botoes:[
        {id:'brigar', rot:cfg.brigar, acao:'cena-defesa',
         nota:'Segurando, Moral +1,5 · Prestígio +3,5; perdendo, '+
              'Moral −3 · Prestígio −3,5'},
        {id:'fugir',  rot:cfg.fugir,  acao:'fugir-defesa',
         nota:'ninguém desce: Moral −3 · Prestígio −3,5 · Relação −6'+
              (a.alvo === 'bar' ? ' · levam R$ 60 por invasor + 10% do caixa' : '')}
      ]
    });
  }

  /* -------------------------------------------------------
     3b. O CALENDÁRIO DO TRIMESTRE — a treta marcada em rua e
         o ataque ao bar, nas doses do dono: a cada 13 semanas,
         2 a 4 tretas e 1 a 2 ataques, sempre em dia comum.
         Texto da treta aprovado pelo dono.
     ------------------------------------------------------- */
  function eventoDoTrimestreHoje(E){
    const ev = TO.relacoes.eventoDeHoje(E);
    if(!ev) return;
    /* a treta sorteia entre TODAS as hostis da praça, nanica incluída
       (decisão do dono, 17/08/2026) — os efetivos são idênticos, então
       tamanho não desequilibra; o bar continua vindo da maior rival */
    const rival = TO.relacoes.rivalDaPraca(E,
      ev.tipo === 'treta' ? ev.chave : null);
    if(!rival) return;

    if(ev.tipo === 'bar' || ev.tipo === 'casa'){
      /* o ataque ao bar entra pelo caminho de sempre: marca o ataque e
         a convocação de defesa monta a mensagem. A CASA DE PISCINA
         (dono, 21/09/2026) entra pela mesma porta: é a resenha de uma
         zona nossa que eles invadem, atrás da nossa faixa — e sem
         faixa nem bandeira estendida não há resenha pra invadir. */
      const casa = ev.tipo === 'casa';
      if(casa){
        const PAT = TO.patrimonio;
        if(!PAT.faixasDe(E).nossas.length && !PAT.bandeirasDe(E).nossas.length) return;
      }
      const zonas = M().ZONAS || ['Norte','Sul','Leste','Oeste'];
      const zona = casa ? zonas[TO.mapa.hash(ev.chave + '|z') % zonas.length] : null;
      if(E.ataqueMarcado && !E.ataqueMarcado.resolvido &&
         E.ataqueMarcado.semana === E.data.semana) return;
      /* ataque de nanica não existe (decisão do dono, 17/08/2026): se
         nem a maior rival da praça tem metade do nosso efetivo, o bar
         fica em paz neste trimestre — melhor sem cena do que uma cena
         que acaba com eles correndo na largada */
      /* de pé, sem ferido nem preso, dos dois lados (dono, 27/08/2026) */
      const vivoR = TO.relacoes.disponiveisIA(E, rival.id);
      if(vivoR < TO.membros.aptosParaOEstadio(E).length * 0.5) return;
      E.ataqueMarcado = {torcida:rival.id, nome:rival.nome,
                         alvo: casa ? 'casa' : 'bar',
                         cena: casa ? 'casa-piscina' : 'bar', zona,
                         ano:E.data.ano, semana:E.data.semana,
                         dia:E.data.dia};
      avisoDoOlheiro(E, {chave:`${ev.tipo}|${E.data.ano}|${E.data.semana}|${rival.id}`,
                         alvo: casa ? 'casa' : 'bar', nome:rival.nome, zona});
      return;
    }

    /* a TRETA MARCADA: bairro sorteado, efetivos idênticos */
    const bairros = M().bairrosDe(E.torcida.mapa);
    if(!bairros.length) return;
    const H = TO.mapa.hash;
    const b = bairros[H(ev.chave + '|b') % bairros.length];
    const tam = [5, 7, 10][H(ev.chave + '|n') % 3];
    /* TRETA MARCADA É TRETA APOSTADA (régua do dono, 22/08/2026): de mil
       a seis mil de cada lado, sempre de mil em mil. Quem ganha leva a
       dos dois; quem recusa paga 20% da nossa só pra não descer.
       SEM CAIXA, SEM MENSAGEM: torcida que não cobre a aposta não é
       chamada pra treta — a mensagem nem chega, em vez de chegar como
       uma escolha que não existe. */
    const aposta = (1 + H(ev.chave + '|$') % 6) * 1000;
    if(E.dinheiro < aposta) return;
    const multa = Math.round(aposta * 0.2);
    propor(E, {
      kind:'treta', peso:'decisao', chave:ev.chave, voz:'diretor', tipo:'ruim',
      /* o valor entra na própria frase da diretoria (pedido do dono,
         22/08/2026): a aposta é a notícia, não uma letra miúda de
         botão. O resto do texto é o aprovado, palavra por palavra. */
      /* "EM" E NÃO "NO": bairro tem gênero e o jogo tem 897 deles,
         entre "o Ipiranga" e "a Tijuca". Era "no ${b.nome}" fixo, e
         saía "no Vila Maria". A tabela de dados/genero.js resolveria,
         mas classificar 897 nomes no olho é trocar um chute por
         outro; "em" cai certo em todos, e não custa tabela. */
      texto:`Zona ${b.zona} marcou uma treta em ${b.nome} contra a `+
            `${rival.nome}, ${U.dinheiro(aposta)} de cada lado, `+
            `bora pro problema?`,
      dados:{rival:rival.id, bairro:b.nome, zona:b.zona,
             classe:b.classe, tam, aposta},
      botoes:[
        {id:'bora',  rot:'Bora pro problema', acao:'cena-treta',
         nota:`Vencendo leva ${U.dinheiro(aposta*2)} · `+
              `Prestígio +${tam >= 10 ? 5 : tam >= 7 ? 4 : 3} vencendo, `+
              `−1 perdendo · Relação −2`},
        {id:'ficar', rot:'Ficar de fora', acao:'ignorar-treta',
         nota:`Prestígio −1 · ${U.dinheiro(multa)} de multa (20% da aposta)`}
      ]
    });
    /* o recado do rival, na caixa de mensagens (dono, 08/09/2026) */
    mensagemDe(E, rival.id, `Hoje à noite, em ${b.nome}, ${tam} contra ${tam}. `+
      `${U.dinheiro(aposta)} na roda. Aparece.`, 'treta', {chave:`treta-msg|${ev.chave}`});
  }

  /* -------------------------------------------------------
     3c. A LNT — LIGA NACIONAL DAS TRETAS (pedido do dono,
         22/08/2026)

     A liga nasce nos primeiros dias de 2027 e roda duas edições
     por ano, uma por semestre, POR CIMA do calendário: ela não
     tira a treta marcada nem o dia de jogo, ela ocupa o dia
     vazio. Aqui mora só a porta — quem monta a chave, resolve
     os duelos das outras 137 e guarda a tabela é o TO.lnt.
     ------------------------------------------------------- */
  function lntDeHoje(E){
    const L = TO.lnt;
    if(!L) return;

    /* A FUNDAÇÃO: quarta-feira da primeira semana de 2027 */
    if(!L.existe(E)){
      if(E.data.ano < L.ANO_FUNDACAO) return;
      if(E.data.semana !== 1 || E.data.dia !== 3) return;
      const nasceu = L.fundar(E);
      if(nasceu) anunciarLNT(E, nasceu);
      /* a chave do semestre sai no mesmo dia da fundação: liga fundada
         que só joga daqui a seis meses é papel, não competição */
      const primeira = L.podeAbrir(E) && L.montarEdicao(E);
      if(primeira) abrirEdicaoLNT(E, primeira);
      return;
    }

    /* a edição do semestre é montada na virada dele */
    if(L.podeAbrir(E)){
      const nova = L.montarEdicao(E);
      if(nova) abrirEdicaoLNT(E, nova);
    }

    contarFechamentoLNT(E);
    const passo = L.rodar(E);
    if(passo && passo.meu) chamarParaLNT(E, passo.meu);
    contarFechamentoLNT(E);
  }

  /* a cena da LNT terminou e pode ter fechado a edição: main chama */
  function lntDepoisDaCena(E){ contarFechamentoLNT(E); }

  const DIV_ART = {1:'1ª', 2:'2ª', 3:'3ª', 4:'4ª'};

  /* --- 1 · a fundação --- */
  function anunciarLNT(E, nasceu){
    const minha = (nasceu.divisoes || []).find(d=>
      (E.lnt.composicao[d.n-1]||[]).includes(E.torcida.id));
    propor(E, {
      kind:'lnt-fundacao', peso:'info', voz:'jornal', tipo:'bom',
      chave:`lnt-fundacao|${E.data.ano}`,
      texto:'A LNT foi fundada: 138 torcidas em quatro divisões, '+
            'duas edições por ano, dez contra dez.',
      dados:{ano:nasceu.ano, divisoes:nasceu.divisoes,
             minha: minha ? minha.n : null,
             fora: (E.lnt.fora||[]).length},
      links:[{rot:'Ver a LNT', args:{pagina:'competicoes', nivel:'nacional',
                                pais:'Brasil', comp:'lnt'}}]
    });
  }

  /* --- 2 · a edição abre --- */
  function abrirEdicaoLNT(E, ed){
    const div = ed.divs.find(d=>d.clubes.includes(E.torcida.id));
    if(!div) return;
    const gi = div.grupos.findIndex(g=>g.includes(E.torcida.id));
    const grupo = div.grupos[gi] || [];
    const nomes = grupo.filter(id=>id !== E.torcida.id)
      .map(id=>(M().torcida(id)||{}).nome || id);
    propor(E, {
      kind:'lnt-abertura', peso:'info', voz:'diretor', tipo:'neutro',
      chave:`lnt-abre|${ed.ano}|${ed.semestre}`,
      texto:`Saiu a chave da LNT: estamos na ${div.nome}, no grupo `+
            `${LETRA[gi] || (gi+1)}, contra ${emLista(nomes)}. `+
            `Dez de cada lado, cinco rodadas e depois é mata-mata.`,
      dados:{div:div.n, grupo:gi, ano:ed.ano, semestre:ed.semestre},
      links:[{rot:'Ver a tabela', args:{pagina:'competicoes', nivel:'nacional',
                                pais:'Brasil', comp:'lnt'}}]
    });
  }
  const LETRA = ['A','B','C','D','E','F','G','H','I'];
  /* "a, b, c e d" — a vírgula até a penúltima, "e" antes da última */
  const emLista = l => l.length < 2 ? (l[0] || '')
    : l.slice(0, -1).join(', ') + ' e ' + l[l.length-1];

  /* --- 3 · a nossa vez --- */
  function chamarParaLNT(E, meu){
    const rival = M().torcida(meu.j.a === E.torcida.id ? meu.j.b : meu.j.a)
                  || {nome:'Rival'};
    /* O GRUPO É O SINAL, NÃO A PALAVRA "rodada" (21/09/2026). A LNT
       só põe `grupo` no jogo de fase de chave; no mata-mata ele nem
       existe. Perguntar isso ao rótulo — /rodada/ em `meu.fase` —
       era ler o texto da tela pra descobrir o que o dado já dizia. */
    const temGrupo = meu.grupo !== undefined && meu.grupo !== null;
    const grupo = temGrupo ? ` do grupo ${LETRA[meu.grupo] || (meu.grupo+1)}` : '';
    const fase = `${meu.fase}${grupo} da ${meu.div.nome}`;
    propor(E, {
      /* KIND PRÓPRIO: treta de LNT não é a treta marcada do
         trimestre — não tem aposta, não sai do calendário da praça e
         quem filtra uma não pode pegar a outra */
      kind:'lnt-treta', peso:'decisao', voz:'diretor', tipo:'neutro',
      chave:`lnt|${E.lnt.edicao.ano}|${E.lnt.edicao.semestre}|`+
            `${E.lnt.edicao.rodadaFeita}`,
      texto:`A LNT marcou a nossa: ${fase} contra a ${rival.nome}, `+
            `dez de cada lado. Quem não bota os dez no campo perde `+
            `por W.O.`,
      dados:{rival:rival.id, bairro:'', tam:10, aposta:0,
             lnt:{div:meu.div.n, nomeDiv:meu.div.nome, fase:meu.fase}},
      botoes:[
        {id:'bora', rot:'Escalar a linha de frente', acao:'cena-treta',
         nota:'Quem ganha segue na LNT · Prestígio +5 vencendo, −1 '+
              'perdendo · Relação −2'},
        {id:'ficar', rot:'Não botar bonde', acao:'lnt-wo',
         nota:'A vaga é deles · Prestígio −2'}
      ]
    });
  }

  /* --- 4 · a edição fecha --- */
  function contarFechamentoLNT(E){
    const L = TO.lnt, h = (E.lnt && E.lnt.historico) || [];
    if(!L || !h.length) return;
    E.lntContadas = E.lntContadas || 0;
    while(E.lntContadas < h.length){
      const reg = h[E.lntContadas++];
      const meu = reg.nosso;
      const nomeT = id => (M().torcida(id)||{}).nome || id;
      const camp = (reg.campeoes || []).map(c=>({
        div:c.div, campeao:nomeT(c.campeao), vice:nomeT(c.vice),
        sobem: emLista((c.sobem||[]).map(nomeT)),
        caem:  emLista((c.caem||[]).map(nomeT))}));
      propor(E, {
        kind:'lnt-fim', peso:'info', voz:'jornal',
        /* `fase` já é valor fechado — 'Campeão', 'Vice', 'Fase de
           chaves', 'Oitavas'… — então compara igual, não por pedaço.
           Com /chaves/ bastava renomear a fase pra toda eliminação na
           chave virar notícia neutra, sem erro nenhum aparecer. */
        tipo: !meu ? 'neutro'
            : meu.fase === 'Campeão' ? 'bom'
            : meu.fase === 'Fase de chaves' ? 'ruim' : 'neutro',
        chave:`lnt-fim|${reg.ano}|${reg.semestre}`,
        texto:`Acabou a LNT: ${camp[0].campeao} é o campeão da 1ª `+
              `Divisão.` + (meu ? ` Nós paramos na ${meu.fase.toLowerCase()}`+
              ` da ${DIV_ART[meu.div]} Divisão.` : ''),
        dados:{ano:reg.ano, semestre:reg.semestre, n:reg.n,
               campeoes:camp, nosso:meu},
        links:[{rot:'Ver a LNT', args:{pagina:'competicoes', nivel:'nacional',
                                pais:'Brasil', comp:'lnt'}}]
      });
    }
  }

  /* -------------------------------------------------------
     3d. O MUNDO DE FORA (pedido do dono, 23/08/2026)

     Três notícias e nada mais: o nosso clube na Libertadores ou na
     Sul-Americana, o campeão de cada uma delas, e o resumo dos nove
     países quando o ano fecha. As ligas de fora não viram mensagem
     rodada a rodada — isso seria uma enxurrada de trinta linhas por
     semana sobre gente que o jogador não conhece. Quem quiser a
     classificação abre Competições → América do Sul.
     ------------------------------------------------------- */
  function mundoDeHoje(E, ctx){
    if(!TO.conmebol || !E.conmebol) return;
    campeoesDaConmebol(E);
    fechamentoDoMundo(E);
  }

  const CM_NOME = {libertadores:'Copa Libertadores',
                   sulamericana:'Copa Sul-Americana'};

  /* --- 1 · o nosso clube jogou lá fora ---
     SAIU (pedido do dono, 17/09/2026). O cartão "Fortaleza 3 × 1
     Orense, nas oitavas da Sul-Americana. Passamos de fase." nascia no
     mesmo dia da volta, ANTES de o jogador entrar em campo, e o placar
     era o AGREGADO das duas pernas — não batia com a partida que ele ia
     ver em seguida. Todo jogo nosso na Conmebol já está na agenda e sai
     pelo cartão de partida, com o desfecho depois da cena; o título e
     o vice continuam saindo pelo cartão de campeão logo abaixo. */
  /* --- 2 · o campeão da América --- */
  function campeoesDaConmebol(E){
    for(const chave of ['libertadores','sulamericana']){
      const c = E.conmebol[chave];
      if(!c || !c.campeao) continue;
      const nosso = c.campeao === E.torcida.clubeId;
      propor(E, {
        kind:'conmebol-fim', peso:'info', voz:'jornal',
        tipo: nosso ? 'bom' : 'neutro',
        chave:`cm-fim|${chave}|${E.data.ano}`,
        texto: nosso
          ? `${(M().time(c.campeao)||{}).nome} é campeão da `+
            `${CM_NOME[chave]}. O título é nosso também.`
          : `${(M().time(c.campeao)||{}).nome} levantou a `+
            `${CM_NOME[chave]}, com ${(M().time(c.vice)||{}).nome} no vice.`,
        dados:{torneio:CM_NOME[chave], campeao:c.campeao, vice:c.vice},
        links:[{rot:'Ver a chave', args:{pagina:'competicoes',
                nivel:'internacional', comp:chave}}]
      });
    }
  }

  /* --- 3 · o resumo dos nove países, uma vez por ano --- */
  function fechamentoDoMundo(E){
    const h = (E.ligasHistorico || [])[0];
    if(!h) return;
    const nomeT = id => (M().time(id)||{}).nome || '—';
    const linhas = [];
    for(const pais of Object.keys(h.paises)){
      const primeira = h.paises[pais][0];
      if(primeira && primeira.campeao)
        linhas.push(`${pais}: ${nomeT(primeira.campeao)}`);
    }
    if(!linhas.length) return;
    propor(E, {
      kind:'mundo-fim', peso:'info', voz:'jornal', tipo:'neutro',
      chave:`mundo-fim|${h.ano}`,
      texto:`Fecharam as ligas da América do Sul: ${emLista(linhas)}.`,
      dados:{ano:h.ano, linhas},
      links:[{rot:'Ver as ligas', args:{pagina:'competicoes',
              nivel:'nacional', pais:'Argentina'}}]
    });
  }

  /* a emboscada da rota, agendada quando a caravana pega a estrada:
     estado chama isto no primeiro dia de viagem */
  function emboscadaDaViagem(E){
    /* A ESTRADA É DO ITINERÁRIO (régua do dono, 20/08/2026): cada
       praça por onde a caravana passa tem a sua chance, na ida e na
       volta (planejamento.emboscadaNaPraca), e a linha do dia abre a
       cena na parada daquela praça. Uma emboscada só pra viagem
       inteira, marcada aqui na véspera, virou duas contas do mesmo
       fato — esta some, e a função fica porque o calendário chama. */
    if(TO.itinerario) return;
    if(E.ataqueMarcado && !E.ataqueMarcado.resolvido &&
       E.ataqueMarcado.semana === E.data.semana) return;
    const emb = PL().emboscadaDaRota(E);
    if(!emb) return;
    E.ataqueMarcado = {torcida:emb.torcida, nome:emb.nome, alvo:'emboscada',
                       /* a emboscada da estrada abre num dos dois
                          cenários do dono (19/08/2026): o pátio do
                          posto ou a pista fechada com o ônibus */
                       cena: TO.mapa.hash(`embcena|${E.data.absoluto}`) % 2
                             ? 'emb-posto' : 'emb-onibus',
                       cidade:emb.cidade,
                       ano:E.data.ano, semana:E.data.semana, dia:E.data.dia};
  }

  /* -------------------------------------------------------
     4. A BRIGA DA ESCOLTA — aliado que hospedamos/escoltamos
        é atacado na nossa cidade; nossos membros estão juntos
        e o jogador controla os dois efetivos na cena.
     ------------------------------------------------------- */
  function escoltaDeHoje(E){
    for(const a of PL().aliadosNaCidade(E, E.data.semana)){
      if(a.dia !== E.data.dia) continue;
      const nivel = PL().nivelDe(E, a.id);
      if(nivel !== 'escolta' && nivel !== 'churrasco') continue;
      /* quem cai em cima do aliado: a torcida da praça com pior relação
         com ELE — determinístico por dia */
      const rivaisDoAliado = M().torcidasEm(E.torcida.mapa)
        .filter(o=>o.id !== E.torcida.id && !o.incompleta &&
                   !M().saoIrmas(a.id, o.id))
        .map(o=>({o, rel: M().valorInicial(M().relacaoBase(a.id, o.id))}))
        .filter(x=>x.rel <= -15)
        .sort((x,y)=>x.rel - y.rel);
      if(!rivaisDoAliado.length) continue;
      const chave = `escolta|${E.data.ano}|${E.data.semana}|${a.id}`;
      const h = TO.mapa.hash(chave);
      if(h % 100 >= 35) continue;                 // nem toda visita dá briga
      const rival = rivaisDoAliado[h % rivaisDoAliado.length].o;
      const escolta = TO.praca.escoltaDe(E, E.torcida, a.torcida);
      propor(E, {
        kind:'escolta', peso:'decisao', chave, voz:'diretor', tipo:'ruim',
        texto:`A ${rival.nome} caiu em cima da ${a.torcida.nome} aqui na `+
              `nossa cidade — e nossos ${escolta} da escolta estão junto `+
              `com eles. Vamos entrar nessa?`,
        dados:{aliado:a.id, rival:rival.id, escolta,
               aliados: a.estimativa},
        botoes:[
          {id:'entrar', rot:'Entrar na briga', acao:'cena-escolta',
           nota:'Relação +10 com o aliado · o prestígio da noite '+
                '(até ±10) vai pra ele'},
          {id:'fora',   rot:'Ficar de fora',   acao:'abandonar-escolta',
           nota:`−${TO.relacoes.REL.largarAliado} de relação com o aliado`}
        ]
      });
      break;
    }
  }

  /* -------------------------------------------------------
     5 e 6. O PLACAR DO NOSSO JOGO e O RESUMO DO DIA
     ------------------------------------------------------- */
  function placarDoDia(E, jogos){
    if(!jogos || !jogos.length) return;
    const meu = E.torcida.clubeId;
    const nome = id => (M().time(id)||{}).nome || id;
    const mapaDe = id => (M().time(id)||{}).mapa;

    /* A PARTIDA AO VIVO (decisão do dono, 17/08/2026): antes do placar
       sair, o nosso jogo chega como decisão com o botão INICIAR
       PARTIDA. O resultado já existe — foi simulado no fechamento do
       dia —, mas fica escondido: os gols saem conforme a barra de
       minutos avança, com a maior parte caindo dos 30 aos 45 e dos
       75 aos 90. Como decisão, ela segura o relógio: o placar e o
       resumo da rodada só dropam depois do apito final, então nada
       vaza o resultado. */
    /* A DISPUTA VAI DENTRO DA PARTIDA (régua do dono, 21/08/2026):
       se o mata-mata do dia foi pros pênaltis, a série viaja na própria
       mensagem e sai depois do apito. Sem tela separada.
       A SÉRIE É DO JOGO DELA, E DE MAIS NENHUM (correção do dono,
       22/08/2026): a disputa chega aqui numa vaga solta do estado, e
       antes bastava ser um jogo nosso pra ela grudar. Se a vaga
       sobrasse — dois jogos nossos no mesmo dia, um deles de pontos
       corridos — os pênaltis apareciam numa partida de rodada, que não
       decide nada. Agora ela só entra no jogo dos MESMOS DOIS CLUBES
       que a disputaram, e a vaga é esvaziada de qualquer jeito: ou a
       série sai no jogo dela, ou não sai. */
    const meus = jogos.filter(j => j.c === meu || j.f === meu);
    const pendente = E.penaltisPendente;
    const daSerie = pendente && meus.find(j =>
      (pendente.a === j.c && pendente.b === j.f) ||
      (pendente.a === j.f && pendente.b === j.c));
    var penDoDia = daSerie ? pendente : null;
    E.penaltisPendente = null;
    /* o jogo que foi pros pênaltis é o do dia; sem ele, o primeiro */
    const nosso = daSerie || meus[0];
    if(nosso){
      const minutoDeGol = () => {
        const r = U.rng();
        return r < 0.35 ? U.inteiro(30, 45)
             : r < 0.70 ? U.inteiro(75, 90)
             : r < 0.85 ? U.inteiro(1, 29)
             :            U.inteiro(46, 74);
      };
      const gols = [];
      for(let i=0;i<(nosso.gc||0);i++) gols.push({min:minutoDeGol(), lado:'c'});
      for(let i=0;i<(nosso.gf||0);i++) gols.push({min:minutoDeGol(), lado:'f'});
      gols.sort((a,b)=>a.min - b.min);
      /* a posição dos dois na tabela e o palco (pedido do dono,
         17/08/2026) — em fase de mata-mata não há posição, e a frase
         volta ao formato antigo */
      /* A POSIÇÃO É A DE ANTES DA BOLA ROLAR (correção do dono,
         22/08/2026): a mensagem é escrita depois de o dia já ter sido
         simulado, e a tabela lida sem cuidado já trazia o resultado de
         hoje — quem decorava a classificação sabia o placar antes do
         apito. A rodada de hoje não conta pra esta frase. */
      const hoje = {semana:E.data.semana, dia:E.data.dia};
      const p1 = TO.competicoes.posicaoNaTabela(E, nosso.comp, nosso.c, hoje);
      const p2 = TO.competicoes.posicaoNaTabela(E, nosso.comp, nosso.f, hoje);
      const estadio = (M().time(nosso.c)||{}).estadio || '';
      const artEst = TO.genero.artigo('em', 'estadio', estadio);
      /* A ETAPA NA FRASE (reformulação do dono, 18/08/2026): grupos
         falam "pela 3ª rodada da Copa do Nordeste"; mata-mata fala a
         fase — "pela semifinal (ida)", "pelas quartas", "pela final". */
      const deComp = TO.genero.d('competicao', nosso.compNome, '');
      let etapa = '';
      if(nosso.fase){
        let rot = String(nosso.fase)
          .replace(' · ida', ' (ida)').replace(' · volta', ' (volta)');
        const contada = /clubes$/i.test(rot);
        if(contada) rot = `fase de ${rot}`;
        /* o gênero sai do nome da fase sem o "(ida)"/"(volta)"; a
           "fase de 16 clubes" é montada aqui e não está na tabela */
        const plural = !contada &&
          TO.genero.de('fase', rot.replace(/ \(.*$/, '')) === 'fp';
        etapa = `, pel${plural ? 'as' : 'a'} `+
                `${rot.charAt(0).toLowerCase()}${rot.slice(1)}`;
      } else if(nosso.rodada){
        etapa = `, pela ${nosso.rodada}ª rodada`;
      }
      const abertura = etapa && deComp ? `${etapa} ${deComp}`
                     : pelaComp(nosso.compNome);
      /* QUEM PÕE GENTE NO ESTÁDIO (pedido do dono, 18/08/2026): uma
         linha com o efetivo de cada torcida dos dois clubes. Jogo na
         nossa praça usa a MESMA conta da rua (naRuaEm — escolta e
         caravana inclusas); jogo fora refaz com as mesmas réguas:
         todo o efetivo de pé pra torcida da casa, caravana pra quem
         viaja (a régua do jogador nos dois casos — ordem do dono,
         31/08/2026), e a nossa saída é a que o planejamento diz. */
      const idsCasa = new Set((M().torcidasDe(nosso.c)||[]).map(o=>o.id));
      const casaMapa = (M().time(nosso.c)||{}).mapa;
      let presentes = [];
      if(casaMapa === E.torcida.mapa && TO.praca && TO.praca.naRuaEm){
        presentes = TO.praca.naRuaEm(E, E.data.dia)
          .filter(b => b.partida && b.partida.casa.id === nosso.c &&
                       b.partida.vis.id === nosso.f)
          .map(b => ({id:b.id, nome:b.nome, n:b.n, casa: idsCasa.has(b.id)}));
      }
      if(!presentes.length){
        for(const lado of ['c','f'])
          for(const o of (M().torcidasDe(nosso[lado])||[])){
            let n;
            if(o.id === E.torcida.id) n = TO.planejamento.efetivoDaSaida(E, {mapa: casaMapa});
            /* ferido e preso da IA ficam em casa (dono, 27/08/2026) */
            else if(o.mapa === casaMapa)
              n = TO.relacoes.disponiveisIA(E, o.id);
            else {
              n = TO.planejamento.caravanaDe(o, (E.relacoes||{})[o.id], E);
              if(n < 5) continue;   // caravana pequena demais não viaja
            }
            if(n > 0) presentes.push({id:o.id, nome:o.nome, n, casa: lado==='c'});
          }
      }
      /* A LISTA VIROU TABELA (pedido do dono, 26/08/2026): as torcidas
         presentes saem do texto corrido e vão pra uma linha única de
         colunas, cada uma com a cor primária na borda esquerda —
         quem desenha é o cartão da mensagem, lendo `dados.presenca` */
      /* A RELAÇÃO COM O CLUBE LÊ A PRESENÇA (pedido do dono,
         18/09/2026): quem foi é quem já está em `presentes` —
         mesma conta que monta a linha da torcida no cartão. Em casa
         só a faixa de cima soma, e é o dia em que a torcida vende
         ingresso pros próprios membros, pela fatia que a relação
         atual dá direito (10/30/60%, R$ 10 cada). Fora, é a
         caravana que decide o degrau. */
      if(TO.relacaoClube){
        const nossaLinha = presentes.find(x => x.id === E.torcida.id);
        const totalMembros = E.membros.length || 1;
        const pct = nossaLinha ? nossaLinha.n / totalMembros : 0;
        TO.relacaoClube.pontosPorPresenca(E, pct, nosso.c === meu);
        if(nosso.c === meu){
          const ing = TO.relacaoClube.ingressosDoJogo(E);
          if(ing.valor){
            TO.estado.lancar(E, `Venda de ingressos aos sócios `+
              `(${ing.n} · R$ ${TO.relacaoClube.PRECO_INGRESSO} cada)`, ing.valor);
          }
        }
      }
      propor(E, {
        kind:'partida', peso:'decisao', voz:'jornal',
        chave:`partida|${E.data.ano}|${E.data.semana}|${E.data.dia}|${meu}`,
        texto:`Hoje tem ${nome(nosso.c)} × ${nome(nosso.f)}`+
              `${abertura}. `+
              (p1 && p2 ? `O ${nome(nosso.c)} está em ${p1}º na tabela `+
                          `e o ${nome(nosso.f)} em ${p2}º. ` : '')+
              `A bola vai rolar${estadio ? ` ${artEst} ${estadio}` : ''}.`,
        dados:{casa:nome(nosso.c), fora:nome(nosso.f),
               gc:nosso.gc, gf:nosso.gf, comp:nosso.compNome || '', gols,
               /* o clima do estádio lê quem está lá (dono, 19/08/2026) */
               somosCasa: nosso.c === meu,
               presenca: presentes,
               /* a disputa de pênaltis, na orientação DESTE jogo */
               pen: penDoDia ? (penDoDia.a === nosso.c
                     ? penDoDia.pen
                     : {c:penDoDia.pen.f, f:penDoDia.pen.c,
                        cobrancas:(penDoDia.pen.cobrancas||[]).map(x=>
                          ({...x, lado: x.lado === 'c' ? 'f' : 'c'}))}) : null},
        botoes:[{id:'iniciar', rot:'Iniciar partida', acao:'iniciar-partida'}]
      });
    }
    /* A LINHA "RESULTADO" SAIU (decisão do dono, 22/08/2026): ela dizia
       "Bragantino 1 × 1 Corinthians, pelo Paulistão." logo acima de um
       jornal cuja MANCHETE é esse mesmo placar. Nasceu quando não havia
       jornal nenhum; com a Gazeta na frente, virou eco. O placar do
       nosso jogo continua saindo — na primeira página, que é o lugar
       dele. */

    /* o resumo agrupado, nossa cidade primeiro, com Ver Competições */
    const daCidade = jogos.filter(j => mapaDe(j.c) === E.torcida.mapa && j !== nosso);
    const deFora   = jogos.filter(j => mapaDe(j.c) !== E.torcida.mapa && j !== nosso);
    const linha = j => `${nome(j.c)} ${j.gc} × ${j.gf} ${nome(j.f)}`;
    const ordenados = [...daCidade, ...deFora];
    if(!ordenados.length) return;
    /* O JORNAL SÓ SAI EM DIA DE JOGO NOSSO (decisão do dono,
       21/08/2026): a manchete é o jogo do clube da torcida, então
       rodada em que ele não entrou em campo não vira edição. */
    if(!nosso) return;
    const MOSTRA = 8;
    const resto = ordenados.length - MOSTRA;
    /* A RODADA VIRA PRIMEIRA PÁGINA (régua do dono, 20/08/2026): a
       mensagem passa a carregar os jogos do dia em forma curta, e quem
       arma o jornal é `TO.gazeta`. O `texto` continua aqui — é ele que
       aparece em save antigo, na busca e em qualquer lugar que só saiba
       ler texto corrido. */
    /* O PLACAR DA SÉRIE VIAJA NA MENSAGEM (correção do dono,
       22/08/2026): `pen` era um SIM/NÃO, e o jornal não tinha como
       dizer "5 a 4 na marca da cal" nem quem passou — por isso a
       notícia saía falando só do empate. Vão os dois números; o
       roteiro cobrança a cobrança fica no jogo, que é onde ele serve. */
    const curto = j => ({c:j.c, f:j.f, gc:j.gc, gf:j.gf,
                         comp:j.compNome || '', rod:j.rodada || 0,
                         fase:j.fase || '',
                         pen: j.pen ? {c:j.pen.c, f:j.pen.f} : null,
                         venceu:j.venceu || ''});
    propor(E, {
      kind:'rodada', peso:'info', voz:'jornal',
      chave:`rodada|${E.data.ano}|${E.data.semana}|${E.data.dia}`,
      texto:`Os jogos de ${NOME_DIA[E.data.dia]}: `+
            `${ordenados.slice(0, MOSTRA).map(linha).join(', ')}`+
            `${resto > 0 ? ` e mais ${resto} ${resto===1?'jogo':'jogos'}` : ''}.`,
      dados:{ diaRot: NOME_DIA[E.data.dia],
              nosso: nosso ? curto(nosso) : null,
              jogos: [...(nosso?[nosso]:[]), ...ordenados].map(curto) },
      links:[{rot:'Ver Competições', acao:'painel', args:{pagina:'competicoes'}}]
    });
  }

  /* -------------------------------------------------------
     7. O RESULTADO DE TODO CONFRONTO
        A porta única: todo fecho de cena passa por aqui.
     ------------------------------------------------------- */
  /* o que a NOSSA vingança frustrada custa a mais, na régua interna de
     0–20 (−5 de moral e −5 de prestígio na régua de 0 a 100) */
  const VINGANCA_NOSSA = {moral:1.0, prestigio:1.0};
  function registrarConfronto(E, d){
    if(!d) return;
    /* toda briga zera o relógio da paz — é ele que deprecia prestígio
       e moral depois de 20 dias parados (decisão do dono) */
    E.ultimaBriga = E.data.absoluto || 0;
    /* o placar de brigas do ano dos dois lados (pedido do dono,
       20/08/2026): é o saldo que aparece no ranking */
    if(TO.relacoes.anotarBriga){
      TO.relacoes.anotarBriga(E, E.torcida.id, !!d.ganhamos);
      const outro = (d.b || {}).torcidaId;
      if(outro && outro !== E.torcida.id)
        TO.relacoes.anotarBriga(E, outro, !d.ganhamos);
    }
    const cena = (d.local && d.local.cena) || '';
    const onde = cena ? nomeDaCena(cena) : 'na rua';
    const bairro = cabeBairro(cena, d.local && d.local.bairro)
                 ? `, no bairro ${d.local.bairro}` : '';
    const a = d.a || {}, b = d.b || {};
    /* as baixas DELES saem de circulação de verdade (conferência do
       dono, 18/08/2026): todo fechamento de briga nossa passa por
       aqui, então é aqui que o ferido e o preso do rival entram nos
       lotes que o ranking e as brigas do mundo já descontam */
    if(b.torcidaId && b.torcidaId !== E.torcida.id && TO.relacoes.baixasIA)
      TO.relacoes.baixasIA(E, b.torcidaId, b.caidos || 0, b.presos || 0);
    /* EMPATE NÃO TEM VENCEDOR (revisão do dono, 22/08/2026): a linha
       lia só `ganhamos`, então briga que saiu igual — as duas fichas
       com o mesmo tanto de ferido — era anunciada como vitória DELES.
       A conta é a mesma que o Futebol e Porrada usa pra decidir a
       manchete, e agora as duas dizem a mesma coisa. */
    const empatou = !d.ganhamos && (a.caidos||0) === (b.caidos||0) &&
                    ((a.caidos||0) || (b.caidos||0) || (a.n||0));
    /* A DÍVIDA (pedido do dono, 08/09/2026): apanhou deles, fica anotado
       onde e quando; o olheiro cobra a vingança na próxima oportunidade
       do calendário. Ganhar deles quita. E o contador de brigas do ano
       com cada uma é o que faz o rival propor trégua. */
    if(d.torcidaId && d.torcidaId !== E.torcida.id){
      E.dividas = E.dividas || {};
      /* e a dívida DELA com a gente: apanhou, anota; nos bateu, quita.
         QUEM TENTA SE VINGAR E SE DÁ MAL DEIXA QUIETO (regra do dono,
         08/09/2026): se ela veio cobrar (ataque marcado com `cobranca`)
         e perdeu, a dívida some em vez de renascer, e a derrota custa
         mais — moral e prestígio a mais na ficha dela. */
      const R = TO.relacoes;
      if(R.anotarDividaIA){
        const devia = !!R.dividaIA(E, d.torcidaId, E.torcida.id);
        if(d.ganhamos && devia){
          R.quitarDividaIA(E, d.torcidaId, E.torcida.id);
          if(d.cobranca && R.mover){
            R.mover(E, d.torcidaId, 'moral', -R.VINGANCA_FRUSTRADA.moral);
            R.mover(E, d.torcidaId, 'prestigio', -R.VINGANCA_FRUSTRADA.prestigio);
            d.vingancaFrustrada = 'deles';
          }
        }
        else if(d.ganhamos) R.anotarDividaIA(E, d.torcidaId, E.torcida.id);
        else if(!empatou) R.quitarDividaIA(E, d.torcidaId, E.torcida.id);
      }
      /* a NOSSA vingança frustrada: fomos cobrar (atacamos com dívida
         aberta) e apanhamos — deixa quieto, e paga a mais */
      if(!d.ganhamos && !empatou && E.dividas[d.torcidaId] && d.atacamos){
        delete E.dividas[d.torcidaId];
        const dm = TO.estado.mexerIndicador(E, 'moral', -VINGANCA_NOSSA.moral, 'Vingança frustrada');
        const dp = TO.estado.mexerIndicador(E, 'prestigio', -VINGANCA_NOSSA.prestigio, 'Vingança frustrada');
        d.efeitos = d.efeitos || [];
        if(dm) d.efeitos.push({ind:'moral', delta:Math.round(dm*10)/10, dono:'nossa (vingança frustrada)'});
        if(dp) d.efeitos.push({ind:'prestigio', delta:Math.round(dp*10)/10, dono:'nosso (vingança frustrada)'});
        d.vingancaFrustrada = 'nossa';
      }
      if(d.ganhamos) delete E.dividas[d.torcidaId];
      else if(!empatou && d.vingancaFrustrada !== 'nossa'){
        const dt = TO.estado.dataDaSemana(E.data.ano, E.data.semana, E.data.dia);
        E.dividas[d.torcidaId] = {ano:E.data.ano, semana:E.data.semana,
          mes: MES_NOME[dt.getMonth()], cidade: cidadeDeHoje(E), onde};
      }
      E.brigasCom = E.brigasCom || {};
      const bc = E.brigasCom[d.torcidaId];
      E.brigasCom[d.torcidaId] = (bc && bc.ano === E.data.ano) ? {ano:E.data.ano, n:bc.n+1}
                                                                : {ano:E.data.ano, n:1};
    }
    const vencedor = empatou ? '' : d.ganhamos ? (a.nome || E.torcida.nome)
                                               : (b.nome || '');
    const presosTxt = (a.presos || 0) > 0 ? ` ${a.presos} dos nossos presos.` : '';
    /* ninguém desceu pra segurar: não houve briga, houve prejuízo */
    const semResistencia = !d.ganhamos && !(a.caidos||0) && !(b.caidos||0)
                        && !(a.n||0);
    /* a nossa briga entra na conta da treta do ano pela mesma porta que
       o mundo usa: `brigasIA` não guarda as nossas, então é aqui */
    if(TO.almanaque && TO.almanaque.anotarTreta)
      TO.almanaque.anotarTreta(E, {
        semana:E.data.semana, dia:E.data.dia,
        /* A CIDADE É A CIDADE, NÃO A FRASE DESCASCADA (conserto de
           21/09/2026). Aqui se arrancava a preposição do texto da cena
           — `onde.replace(/^n[ao]s? /,'')` — e o resultado ia pro campo
           `cidade`. Briga na arquibancada gravava cidade "arquibancada";
           no bar, "bar"; na estrada, "estrada". O ticker escrevia "se
           pegaram em bar" e `linkCidadePorNome` tentava achar uma
           cidade chamada "arquibancada" no mapa.
           `cidadeDeHoje` já existia e já faz a conta certa: cidade do
           adversário em jogo fora, a nossa praça no resto — e é o mesmo
           campo que o lado das IAs grava (relacoes.js:2253), que sempre
           foi nome de cidade de verdade. O lugar da briga continua
           inteiro em `local`, pra quem quiser a frase. */
        cidade: cidadeDeHoje(E),
        local: onde + bairro,
        ganhouA: !!d.ganhamos,
        a:{id:E.torcida.id, nome:a.nome || E.torcida.nome, n:a.n || 0,
           feridos:a.caidos || 0, presos:a.presos || 0},
        b:{id:d.torcidaId, nome:b.nome || 'Rival', n:b.n || 0,
           feridos:b.caidos || 0, presos:b.presos || 0}
      });
    const noLote = !!(E.loteBrigas && E.loteBrigas.aberto);
    (noLote ? (m=>E.loteBrigas.brigas.push(m)) : (m=>propor(E, m)))({
      kind:'confronto', peso:'info', tipo: d.ganhamos ? 'boa' : 'ruim',
      voz:'diretor',
      texto: semResistencia
        ? `A ${b.nome} quebrou tudo ${onde}${bairro} e foi embora sem `+
          `encontrar resistência.`
        : `${a.nome || E.torcida.nome} e ${b.nome} se pegaram ${onde}${bairro}: `+
          `${a.caidos||0} ${(a.caidos||0)===1?'ferido nosso':'feridos nossos'}, `+
          `${b.caidos||0} do lado deles.${presosTxt} `+
          `${vencedor ? `A ${vencedor} levou a melhor.` : 'Ninguém levou a melhor.'}`,
      efeitos: d.efeitos || [],
      consequencia: linhaDeConsequencia(d.efeitos || []),
      /* O JORNAL DA BRIGA LÊ DAQUI (pedido do dono, 21/08/2026): a
         mensagem guarda o lugar e o dia junto das baixas, pra Futebol
         e Porrada montar a página sem adivinhar nada. */
      /* O NÚMERO DA EDIÇÃO É CARIMBADO NA HORA: jornal velho não muda
         de número. Se fosse contado no desenho, a briga de janeiro
         apareceria com o número de dezembro. */
      dados:{torcidaId:d.torcidaId, ganhamos:!!d.ganhamos,
             edicao: (E.brigasNossasTotal = (E.brigasNossasTotal || 0) + 1),
             cena, bairro:(d.local && d.local.bairro) || '',
             semResistencia,
             /* duelo de LNT não é treta de esquina: o jornal precisa
                saber a fase e a divisão pra dizer o que estava em jogo */
             lnt: d.lnt || null,
             /* quando descemos pelo aliado escoltado, o jornal precisa
                do nome dele: a manchete é de apoio, não de treta nossa */
             aliado: d.aliado || null,
             a:{nome:a.nome || E.torcida.nome, id:E.torcida.id,
                n:a.n, caidos:a.caidos, presos:a.presos},
             b:{nome:b.nome, id:b.torcidaId,
                n:b.n, caidos:b.caidos, presos:b.presos}}
    });

    /* A PROVOCAÇÃO DO RIVAL (pedido do dono, 18/08/2026): briga
       concluída, o outro lado manda recado — deboche quando ELES
       venceram, promessa de volta quando apanharam. Cai logo depois
       da mensagem do confronto, sem decisão, só veneno.

       SÓ EM BRIGA QUE VALEU PRESTÍGIO (régua do dono, 21/08/2026):
       ninguém manda recado por causa de treta marcada de 5 contra 5.
       A conta é o maior movimento de prestígio da noite — nosso ou
       deles, pra cima ou pra baixo — na régua de 0 a 100 do dono, e
       o corte é 3,5. Isso deixa de fora a treta marcada (1 ponto) e a
       briga de arquibancada miúda (1 a 3), e deixa passar a guerra de
       bar e a cena grande, que chegam a 10. */
    const swingRegua = Math.max(0, ...(d.efeitos || [])
      .filter(x => x.ind === 'prestigio')
      .map(x => Math.abs(x.delta || 0) * 5));
    if(d.torcidaId && b.nome && swingRegua >= PROVOCA_REGUA){
      /* textos aprovados pelo dono (18/08/2026) */
      const DEBOCHE = [
        'Anota a placa aí, teu terror tem nome!',
        'Correram igual galinha, cadê vocês? Ninguém sabe ninguém viu.',
        'Contamos os que correram: faltou dedo pra contar. Fica em '+
          'casa da próxima.'
      ];
      const VOLTA = [
        'Aproveita, porque isso não fica assim. Nosso bonde volta pesado.',
        'Fica tranquilo que a cobrança vem cara!',
        'Riram hoje, choram depois. O revide é pesado.'
      ];
      const lista = d.ganhamos ? VOLTA : DEBOCHE;
      const fala = lista[TO.mapa.hash(
        `provoca|${E.data.absoluto}|${d.torcidaId}`) % lista.length];
      /* AS PROVOCAÇÕES SAÍRAM DO FEED (pedido do dono, 08/09/2026): vão
         pra caixa de mensagens entre torcidas */
      if(!(TO.relacoes.emTregua && TO.relacoes.emTregua(E, d.torcidaId)))
        mensagemDe(E, d.torcidaId, fala, 'provocacao');
    }
  }

  const NOMES_CENA = {
    arredores:'nos arredores do estádio', praca:'na praça',
    rua:'numa rua de periferia', 'rua-media':'numa rua de classe média',
    'rua-nobre':'numa rua de classe alta', bar:'no bar', comercio:'no comércio',
    ct:'no CT', sede:'na sede', loja:'na loja', subsede:'na subsede',
    /* as cenas que faltavam: sem elas toda briga de arquibancada, de
       treta marcada e de emboscada caía no 'na rua' e ainda ganhava um
       ", no bairro arquibancada" atrás (correção do dono, 21/08/2026).
       Os nomes saem da própria cena, que já traz a linha do local */
    'estadio-10':'na arquibancada', 'estadio-20':'na arquibancada',
    'estadio-40':'na arquibancada',
    'treta-beco':'no beco', 'treta-galpao':'no pátio do galpão',
    'treta-campo':'no campo de terra',
    'emb-posto':'no posto', 'emb-onibus':'na estrada',
    'casa-piscina':'na casa de piscina'
  };
  const nomeDaCena = c => NOMES_CENA[c] || 'na rua';
  /* ONDE NÃO EXISTE BAIRRO: arquibancada e estrada não são endereço de
     bairro nenhum, então a briga que acontece nelas fecha a frase no
     nome do lugar. Nas outras o bairro entra como complemento */
  const CENA_SEM_BAIRRO = ['estadio-10','estadio-20','estadio-40','emb-onibus'];
  const cabeBairro = (cena, bairro) =>
    !!bairro && CENA_SEM_BAIRRO.indexOf(cena) < 0 &&
    NOMES_CENA[cena] !== `na ${bairro}` && NOMES_CENA[cena] !== `no ${bairro}`;

  /* =======================================================
     AS RESPOSTAS
     `responder` executa o que dá pra executar aqui (estado) e
     devolve uma diretiva de tela pra casca abrir.
     ======================================================= */
  function responder(E, idMsg, idBotao){
    caixas(E);
    const m = E.feed.find(x=>x.id === idMsg);
    if(!m || !m.botoes) return {ok:false};
    const b = m.botoes.find(x=>x.id === idBotao);
    if(!b || m.respondido) return {ok:false};

    const marcar = rot => { m.respondido = {botao:idBotao, rot:rot || b.rot}; };

    switch(b.acao){
      /* A REUNIÃO ABRE TELA E NÃO SE RESPONDE AQUI (dono, 11/09/2026):
         quem responde é o Encerrar a reunião, por `confirmarDecisao`.
         Fechar a tela sem encerrar deixa a mesa de pé. */
      case 'abrir-reuniao':
        return {ok:true, abrir:{tela:'tela-reuniao', msg:m, cancelavel:true, botao:idBotao}};
      /* --- as que resolvem aqui --- */
      case 'nada':
        marcar();
        return {ok:true};
      /* SÓ PRA SAVE ANTIGO (19/09/2026): obra virou notícia sem botão
         no mesmo dia em que nasceu como decisão, mas um save feito
         no meio do caminho pode ter um cartão de obra ainda aberto —
         e cartão de decisão sem resposta trava o relógio. O caso e o
         `responderObra` ficam de pé só pra esses; código novo não
         gera mais cartão de obra com botão. */
      case 'obra': {
        marcar();
        responderObra(E, m, idBotao);
        return {ok:true};
      }
      /* o veredicto da campanha (dono, 19/09/2026) */
      case 'veredicto': {
        marcar();
        responderVeredicto(E, m, idBotao);
        return {ok:true};
      }
      /* O PROTESTO NA PORTA DO CT (pedido do dono, 18/09/2026): duas
         saídas, sem tela própria — cobrar da diretoria custa relação
         com o clube e rende prestígio de rua; segurar a torcida poupa
         a relação (e ainda soma um pouco pela cabeça fria) à custa de
         moral, porque quem queria ir e ficou quieto reclama. */
      case 'protesto-ct': {
        marcar();
        const RC = TO.relacaoClube;
        if(idBotao === 'protestar'){
          const r = RC.mexer(E, -8, 'Protesto na porta do CT');
          TO.estado.mexerIndicador(E, 'prestigio', 0.4, 'Protesto na porta do CT');
          m.consequencia = `Fomos pra porta do CT cobrar satisfação. `+
            `${r} de relação com o clube · +2 de prestígio.`;
        } else {
          /* IR PELA GESTÃO E NÃO PELOS MEMBROS CUSTA (pedido do dono,
             19/09/2026): eles queriam ir pra porta do CT, e quem
             segurou foi a diretoria da torcida. −3 de moral, não −1. */
          const r = RC.mexer(E, 2, 'Segurou a torcida, não foi ao CT');
          TO.estado.mexerIndicador(E, 'moral', -0.6,
            'Segurou a torcida a favor da diretoria do clube');
          m.consequencia = `Seguramos a torcida — não é hora de desgaste com `+
            `a diretoria. +${r} de relação com o clube · −3 de moral: o pessoal `+
            `queria ir e ficou com a impressão de que a gente joga pro outro lado.`;
        }
        return {ok:true};
      }
      case 'tutorial': {
        marcar();
        if(idBotao === 'pular'){
          E.tutorial = {feito:true, pulou:true};
          m.consequencia = 'Fechado, chefe. Qualquer coisa, o "Como '+
            'funciona" fica no menu do Jogo.';
          return {ok:true};
        }
        return {ok:true, abrir:{tela:'tutorial'}};
      }
      case 'tela-assalto':
        /* a lista de alvos também dá pra fechar sem assaltar */
        return {ok:true, abrir:{tela:'tela-assalto', msg:m,
                                cancelavel:true, botao:idBotao}};
      case 'iniciar-partida':
        /* O DIA COMEÇA, A BOLA NÃO (correção do dono, 20/08/2026): este
           botão abre o ITINERÁRIO — concentração, pista, arredores. A
           partida só começa quando a linha chegar na parada do jogo, e
           quem acende `iniciada` é ela. Ligar o cronômetro aqui fazia o
           relógio do jogo correr durante a concentração inteira, e a
           gente chegava no estádio com o jogo no segundo tempo.
           NÃO marca respondido: o relógio do feed segue preso até o
           apito final, que chega por encerrarPartida(). */
        m.dados = m.dados || {};
        m.dados.dia = true;
        return {ok:true};
      case 'paz':
        PL().definirIntencao(E, 'paz');
        marcar();
        return {ok:true};
      case 'paz-praca':
        PL().definirInvestida(E, b.args.chaveJogo, null);
        marcar();
        return {ok:true};
      case 'paz-grupo':
        /* paz em tudo que o relatório do dia cobria */
        PL().definirIntencao(E, 'paz');
        for(const g of (b.args.grupos||[]))
          if(g.chaveJogo) PL().definirInvestida(E, g.chaveJogo, null);
        marcar();
        return {ok:true};
      case 'padrao-grupo': {
        const pol = PL().politicas(E);
        const feito = PL().aplicarPolitica(E);
        const nomes = [];
        if(feito.alvo) nomes.push(feito.alvo);
        for(const g of (b.args.grupos||[])){
          if(!g.chaveJogo) continue;
          const og = PL().outrosJogosNaCidade(E, E.data.semana)
            .find(x=>x.chave === g.chaveJogo);
          if(!og) continue;
          const alvos = PL().alvosDaPolitica(E, og.visitantes, pol.outros);
          if(alvos.length){
            PL().definirInvestida(E, og.chave,
              {alvo:alvos[0].id, como:'arredores', olheiro:null});
            nomes.push(alvos[0].torcida.nome);
          }
        }
        marcar(nomes.length ? `Seguir padrão — atacar ${nomes.join(', ')}`
                            : 'Seguir padrão — ir em paz');
        return {ok:true};
      }
      case 'seguir-padrao': {
        const feito = PL().aplicarPolitica(E);
        marcar(feito.alvo ? `Seguir padrão — atacar ${feito.alvo}`
                          : 'Seguir padrão — ir em paz');
        return {ok:true};
      }
      case 'seguir-padrao-praca': {
        const pol = PL().politicas(E);
        const og = PL().outrosJogosNaCidade(E, E.data.semana)
          .find(x=>x.chave === b.args.chaveJogo);
        if(og){
          const alvos = PL().alvosDaPolitica(E, og.visitantes, pol.outros);
          const alvo = alvos.length ? alvos[0] : null;
          if(alvo) PL().definirInvestida(E, og.chave,
            {alvo:alvo.id, como:'arredores', olheiro:null});
          marcar(alvo ? `Seguir padrão — cair em cima da ${alvo.torcida.nome}`
                      : 'Seguir padrão — deixar passar');
        }else marcar('Seguir padrão — deixar passar');
        return {ok:true};
      }
      case 'fugir-defesa': {
        marcar();
        naoDesceu(E, E.ataqueMarcado);
        return {ok:true};
      }
      case 'abandonar-escolta': {
        /* deixar o aliado apanhando sozinho cobra a relação */
        const d = m.dados || {};
        if(d.aliado){
          E.relacoes[d.aliado] = U.limitar(
            (E.relacoes[d.aliado]||0) - TO.relacoes.REL.largarAliado, -100, 100);
          mensagemDe(E, d.aliado, `Nosso pessoal apanhou na cidade de vocês e ninguém `+
            `desceu. A gente veio de longe confiando. Anotado.`, 'cobranca');
        }
        marcar();
        return {ok:true};
      }

      /* o bar do rival da cidade (texto do dono, 18/08/2026): abre a
         mesma cena do ataque manual, com o mesmo limite semanal */
      case 'atacar-bar-rival': {
        const r = TO.acoes.executar(E, 'atacar', {alvo:(m.dados||{}).alvo});
        if(!(r && r.ok)){
          marcar('Atacar o bar — não rolou');
          m.consequencia = r && r.msg ? `Não rolou: ${r.msg}` : 'Não rolou.';
          return {ok:true};
        }
        marcar();
        return {ok:true, abrir:{tela:'cena-acao', args:{cena:r.cena},
                                simular: !!b.simular}};
      }

      /* O BOTE NA RESENHA (texto do dono, 21/09/2026): a nossa zona
         (até 20) desce na casa de piscina onde a zona deles (até 20)
         está de resenha com a faixa estendida. Abre a cena direto,
         como a descida da filial, e fecha por `fecharAtaque` — sem
         saque, que casa de praia não tem caixa; o prêmio é a faixa. */
      case 'atacar-casa-rival': {
        const d = m.dados || {};
        const rival = M().torcida(d.rival);
        if(!rival){
          marcar('Dar o bote — não rolou');
          m.consequencia = 'Não rolou: a torcida sumiu do mapa.';
          return {ok:true};
        }
        /* DAR O BOTE SEMPRE ABRE A CENA (ordem do dono, 21/09/2026): a
           resenha é uma oportunidade que a diretoria trouxe, não o
           ataque manual da semana — o limite de um bonde por semana do
           `atacar` não vale aqui, e este bote também não gasta a vez
           dele. Antes, com bar ou casa já atacados na semana, o botão
           respondia "não rolou" e o dono não entendeu a mensagem. */
        const zona = TO.acoes.bondeDaZona(E, d.zona);
        if(zona.length < 4){
          marcar('Dar o bote — não rolou');
          m.consequencia = 'Não rolou: a zona não tem gente de pé.';
          return {ok:true};
        }
        const deles = TO.acoes.efetivoDaZona(E, rival);
        marcar();
        return {ok:true, abrir:{tela:'cena-acao', args:{cena:{
          cena:'casa-piscina', acao:'atacar',
          escalacao: zona, efetivoRival: deles,
          alvo:{torcidaId:rival.id, nome:rival.nome, deQuem:rival.nome,
                tipo:'casa', cena:'casa-piscina', zona:d.zona,
                bairro:d.bairro || '',
                nossos:zona.length, efetivo:deles}}},
          simular: !!b.simular}};
      }
      case 'ignorar-casa-rival': {
        marcar();
        TO.estado.mexerIndicador(E, 'prestigio', -0.2,
          'Deixamos a resenha do rival quieta');
        TO.estado.mexerIndicador(E, 'moral', -1,
          'Deixamos a resenha do rival quieta');
        m.consequencia = 'Deixamos quieto. Prestígio −1 · Moral −1.';
        return {ok:true};
      }

      /* a descida do núcleo da SUB-SEDE (dono, 26/08/2026; cena jogável
         por ordem do dono, 31/08/2026): o olheiro de lá sugeriu, o
         chefe mandou — o "Atacar" ABRE A CENA do ataque a bar com a
         escalação do núcleo da sub-sede, e o fechamento segue pela
         porta de sempre (fecharAtaque), valendo prestígio como
         qualquer ataque a bar. */
      case 'filial-ataque': {
        const d = m.dados || {};
        const rival = M().torcida(d.rival);
        const nucleo = TO.membros.aptosDaFilial(E, d.cidade);
        if(!rival || nucleo.length < 4){
          marcar('Atacar — não rolou');
          m.consequencia = 'Não rolou: o núcleo de lá não tem gente de pé.';
          return {ok:true};
        }
        const ef = TO.acoes.efetivoDePe(E, rival) || 30;
        const defensores = Math.min(40, Math.max(4, Math.round(ef * 0.35)));
        marcar();
        return {ok:true, abrir:{tela:'cena-acao', args:{cena:{
          cena:'bar', acao:'atacar',
          escalacao: nucleo, efetivoRival: defensores,
          alvo:{torcidaId:rival.id, nome:rival.nome, deQuem:rival.nome,
                tipo:'bar', cena:'bar',
                bairro:TO.financeiro.nomeCidade(d.cidade),
                nossos:nucleo.length, efetivo:defensores}}}}};
      }

      /* O BOTE NA CARAVANA RIVAL (ordem do dono, 31/08/2026): a cena
         abre na pista ou na praça, o nosso lado é o núcleo da
         sub-sede e o rival é a caravana QUE VIAJOU — o número da
         mensagem, não a torcida inteira. */
      case 'filial-caravana': {
        const d = m.dados || {};
        const rival = M().torcida(d.rival);
        const nucleo = TO.membros.aptosDaFilial(E, d.cidade);
        if(!rival || nucleo.length < 4){
          marcar('Atacar — não rolou');
          m.consequencia = 'Não rolou: o núcleo de lá não tem gente de pé.';
          return {ok:true};
        }
        const viajaram = Math.max(4, d.n || 10);
        marcar();
        return {ok:true, abrir:{tela:'cena-acao', args:{cena:{
          cena: d.cena === 'praca' ? 'praca' : 'rua', acao:'atacar',
          escalacao: nucleo, efetivoRival: viajaram,
          alvo:{torcidaId:rival.id, nome:rival.nome, deQuem:rival.nome,
                tipo:'caravana', cena: d.cena === 'praca' ? 'praca' : 'rua',
                bairro:TO.financeiro.nomeCidade(d.cidade),
                nossos:nucleo.length, efetivo:viajaram}}}}};
      }

      /* recusas com preço (dono, 19/08/2026) */
      case 'ignorar-treta': {
        marcar();
        TO.estado.mexerIndicador(E, 'prestigio', -0.2,
          'Ficamos de fora da treta marcada');
        /* RECUSAR TEM PREÇO EM DINHEIRO (régua do dono, 22/08/2026):
           20% da aposta fica na mão de quem marcou. Combinar e não
           descer sai mais barato que perder, mas não sai de graça. */
        const ap = (m.dados && m.dados.aposta) || 0;
        const multa = Math.round(ap * 0.2);
        if(multa > 0) TO.estado.lancar(E, 'Multa por recusar a treta', -multa);
        m.consequencia = 'Ficamos de fora. Prestígio −1' +
          (multa > 0 ? ` · ${U.dinheiro(multa)} de multa.` : '.');
        return {ok:true};
      }
      /* W.O. NA LNT (régua do dono, 22/08/2026): não botar bonde é
         entregar a vaga. Sem briga, sem ferido, sem prêmio — e o
         prestígio cai o dobro do que cai numa treta recusada, que
         faltar em competição pesa mais que furar um combinado. */
      case 'lnt-wo': {
        marcar();
        TO.estado.mexerIndicador(E, 'prestigio', -0.4,
          'W.O. na LNT');
        const reg = TO.lnt && TO.lnt.registrarNosso(E,
          {ganhamos:false, nossos:0, deles:0, wo:true});
        m.consequencia = 'Não botamos bonde: perdemos por W.O. '+
                         'Prestígio −2.';
        contarFechamentoLNT(E);
        return {ok:true};
      }
      case 'ignorar-bar-rival': {
        marcar();
        TO.estado.mexerIndicador(E, 'prestigio', -0.2,
          'Deixamos o bar do rival quieto');
        TO.estado.mexerIndicador(E, 'moral', -1,
          'Deixamos o bar do rival quieto');
        m.consequencia = 'Deixamos quieto. Prestígio −1 · Moral −1.';
        return {ok:true};
      }

      /* --- aniversários (textos do dono, 18/08/2026) --- */
      case 'aniv-ir': {
        marcar();
        const id = (m.dados||{}).torcida;
        mensagemDe(E, id, `Valeu pela presença, irmão. A festa ficou completa `+
          `com o bonde de vocês. Casa aberta sempre.`, 'agradecimento');
        TO.estado.lancar(E, `Presença na festa da ${(m.dados||{}).nome}`, -2000);
        E.relacoes = E.relacoes || {};
        const ganhoF = TO.relacoes.ganhoRepetido(E, E.torcida.id, id, 'festa',
                                                 TO.relacoes.REL.irAniversario);
        E.relacoes[id] = Math.max(-100, Math.min(100,
          TO.relacoes.nivel(E, id) + ganhoF));
        /* aparecer na festa é gesto: zera o relógio da indiferença */
        TO.relacoes.marcarAjuda(E, id);
        m.consequencia = `Fomos. +${ganhoF} de relação `+
                         `com a ${(m.dados||{}).nome}.`;
        return {ok:true};
      }
      case 'aniv-nao': {
        marcar();
        const id = (m.dados||{}).torcida;
        E.relacoes = E.relacoes || {};
        E.relacoes[id] = Math.max(-100, Math.min(100,
          TO.relacoes.nivel(E, id) - TO.relacoes.REL.furarAniversario));
        /* furar aniversário de aliado queima na rua (régua do dono,
           18/08/2026): −2 de prestígio na régua de 0-100 */
        TO.estado.mexerIndicador(E, 'prestigio', -0.4,
          `Furamos o aniversário da ${(m.dados||{}).nome}`);
        m.consequencia = `Ficamos em casa. −${TO.relacoes.REL.furarAniversario} `+
                         `de relação com a ${(m.dados||{}).nome} · `+
                         `Prestígio nosso −2.`;
        return {ok:true};
      }
      case 'aniv-festa': {
        marcar();
        m.consequencia = aplicarFestaAniv(E, m.dados || {}, idBotao);
        return {ok:true};
      }
      /* --- as telas que DÃO PRA CANCELAR (correção do dono,
         21/08/2026): abrir não é responder. Estas não marcam nada
         aqui — quem marca é o Confirmar delas. Fechar volta pro feed
         com a decisão ainda de pé e o relógio parado, que é o que o
         `travado(E)` faz enquanto a mensagem não tem resposta.
         Antes elas marcavam na abertura, e fechar a tela valia como
         ter decidido: o turno era consumido sem nada ter acontecido. */
      case 'status-sim': {
        const S = E.statusRel = E.statusRel || {visto:{}, recusa:{}};
        S.visto[b.args && b.args.de || m.dados.de] = 'neutro';
        marcar();
        m.consequencia = m.dados.antes === 'rival'
          ? `A treta com a ${m.dados.nome} esfriou de vez: neutras.`
          : `A aliança com a ${m.dados.nome} acabou: neutras.`;
        return {ok:true};
      }
      case 'status-nao': {
        const S = E.statusRel = E.statusRel || {visto:{}, recusa:{}};
        const id = m.dados.de, antes = m.dados.antes;
        E.relacoes[id] = BEIRA[antes];
        S.visto[id] = antes;
        S.recusa[id] = TO.relacoes.semanaAbs(E);
        marcar();
        m.consequencia = antes === 'rival'
          ? `A ${m.dados.nome} segue rival (−16). Se nada mudar, eles perguntam de novo em ${RECUSA_STATUS} semanas.`
          : `A aliança com a ${m.dados.nome} fica (+20). Sem ajuda, ela esfria de novo.`;
        return {ok:true};
      }
      case 'interm-sim': {
        const d = m.dados || {};
        const S = E.statusRel = E.statusRel || {visto:{}, recusa:{}};
        const v = TO.relacoes.nivel(E, d.alvo);
        /* +25 no mínimo: a +20 cravado, dois meses secos já devolviam a
           pergunta de "encerra a aliança?" */
        E.relacoes[d.alvo] = U.limitar(Math.max(v + 15, 25), -100, 100);
        E.relacoes[d.de]   = U.limitar(TO.relacoes.nivel(E, d.de) + 3, -100, 100);
        S.visto[d.alvo] = 'aliado';
        marcar();
        m.consequencia = `A ${d.nome} sentou os dois: a ${d.alvoNome} agora é aliada `+
          `(${Math.round(E.relacoes[d.alvo])}) · +3 com a ${d.nome}.`;
        return {ok:true};
      }
      case 'interm-nao': {
        const d = m.dados || {};
        E.relacoes[d.de] = U.limitar(TO.relacoes.nivel(E, d.de) - 3, -100, 100);
        marcar();
        m.consequencia = `Ficou como está. A ${d.nome} não gostou: −3.`;
        return {ok:true};
      }
      case 'paz-sim': {
        const d = m.dados || {};
        const S = E.statusRel = E.statusRel || {visto:{}, recusa:{}};
        S.visto = S.visto || {}; S.recusa = S.recusa || {};
        /* a treta ZERA: o rival vai pro meio do neutro. Zerando o número
           o status já é "Neutro", e `visto` anda junto pra mudança não
           voltar como pergunta de status no dia seguinte. */
        E.relacoes[d.alvo] = 0;
        E.relacoes[d.de]   = U.limitar(TO.relacoes.nivel(E, d.de) + 3, -100, 100);
        S.visto[d.alvo] = 'neutro';
        marcar();
        m.consequencia = `A ${d.nome} sentou os dois: a treta com a ${d.alvoNome} `+
          `acabou — neutro daqui pra frente · +3 com a ${d.nome}.`;
        return {ok:true};
      }
      case 'paz-nao': {
        const d = m.dados || {};
        E.relacoes[d.de] = U.limitar(TO.relacoes.nivel(E, d.de) - 3, -100, 100);
        marcar();
        m.consequencia = `A treta com a ${d.alvoNome} fica de pé. `+
          `A ${d.nome} não gostou: −3.`;
        return {ok:true};
      }
      case 'eixo-sim': {
        const d = m.dados || {};
        const r = TO.eixos.entrar(E, d.de, E.torcida.id);
        marcar();
        const nome = id => (M().torcida(id)||{}).nome || id;
        m.consequencia = !r ? 'Não rolou.'
          : `Dentro do ${d.nome}. `+
            (r.novasAliadas.length ? `Novas aliadas: ${r.novasAliadas.map(nome).join(', ')}. ` : 'Já éramos aliados de todos. ')+
            (r.novosRivais.length ? `Novos rivais: ${r.novosRivais.map(nome).join(', ')}.` : '');
        return {ok:true};
      }
      case 'eixo-aceita': {
        const d = m.dados || {};
        const r = TO.eixos.entrar(E, d.de, d.torcida);
        marcar();
        const nome = id => (M().torcida(id)||{}).nome || id;
        m.consequencia = !r ? 'Não rolou.'
          : `A ${nome(d.torcida)} está dentro do ${d.nome}. `+
            (r.novasAliadas.includes(E.torcida.id) || TO.relacoes.nivel(E, d.torcida) >= 20
              ? 'Aliada nossa agora.' : '');
        return {ok:true};
      }
      case 'eixo-veta': {
        const d = m.dados || {};
        TO.eixos.vetar(E, d.de, d.torcida);
        marcar();
        const nome = id => (M().torcida(id)||{}).nome || id;
        m.consequencia = `A gente vetou a ${nome(d.torcida)} no ${d.nome}.`;
        return {ok:true};
      }
      case 'eixo-nao': {
        const d = m.dados || {};
        TO.eixos.recusar(E, d.de, d.porta);
        marcar();
        m.consequencia = `Ficamos de fora do ${d.nome}. −3 com a ${(M().torcida(d.porta)||{}).nome || ''}.`;
        return {ok:true};
      }
      case 'fechar-semana': {
        /* o plano já foi escrito pelos controles do cartão; fechar é
           o `confirmar` de sempre — gasta ação, paga recepção e
           investida, e a estrada continua compromisso da semana.
           NUMA SEMANA COM DOIS JOGOS NOSSOS (correção do dono,
           22/09/2026), o botão fecha os DOIS planos — cada um do seu
           jogo, achado pela agenda do clube, não só o do `proximoJogo`. */
        const meu = M().time(E.torcida.clubeId);
        const jogos = (E.temporada && meu)
          ? TO.competicoes.jogosDaSemana(E, meu.id, E.data.semana)
              .map(a => TO.estado.fichaDoJogo(E, a))
          : (E.proximoJogo ? [E.proximoJogo] : []);
        let gasto = 0, investidas = 0;
        for(const jg of jogos){
          const r = PL().confirmar(E, jg);
          if(r){ gasto += r.gasto || 0; investidas += r.investidas || 0; }
        }
        marcar();
        const j = E.proximoJogo, p = PL().plano(E, j);
        const est = j && !j.casa ? PL().estimativaCaravana(E, j) : null;
        const alvo = p.intencao !== 'paz' && p.alvoTorcida ? M().torcida(p.alvoTorcida) : null;
        const outro = jogos.find(jg => j && jg.chave !== j.chave);
        m.consequencia = (est ? `Caravana: ${est.vao} para ${j.cidadeAdv || 'fora'}. ` : '')+
          (alvo ? `Plano: em cima da ${alvo.nome}.` : 'Plano: ir em paz.')+
          (outro ? ` O outro jogo da semana também está fechado.` : '')+
          (gasto ? ` ${U.dinheiro(gasto)} pagos agora.` : '');
        return {ok:true};
      }
      case 'tela-ataque':
      case 'tela-caravana':
        return {ok:true, abrir:{tela:b.acao, args:b.args || {}, msg:m,
                                simular: !!b.simular,
                                cancelavel:true, botao:idBotao}};

      /* --- as que JÁ SÃO a ação: a cena aconteceu no clique, e as
         duas de abertura não têm o que cancelar (não existe outro
         botão nelas) --- */
      case 'tela-ideologia':
      case 'painel-expediente':
      case 'cena-guerra':
      case 'cena-defesa':
      case 'cena-escolta':
      case 'cena-treta':
        marcar();
        return {ok:true, abrir:{tela:b.acao, args:b.args || {}, msg:m,
                                simular: !!b.simular}};
      case 'painel':
        /* link informativo não consome nada */
        m.respondido = null;
        return {ok:true, abrir:{tela:'painel', args:b.args || {}}};
    }
    return {ok:false};
  }

  /* A RESPOSTA QUE VEM DA TELA (correção do dono, 21/08/2026): as
     telas canceláveis são abertas sem responder a mensagem, e chamam
     isto no Confirmar delas. Sem isso a decisão ficaria de pé pra
     sempre e o relógio nunca voltaria a andar. */
  function marcarResposta(E, idMsg, idBotao, rot){
    const m = (E.feed || []).find(x => x.id === idMsg);
    if(!m || m.respondido) return false;
    const b = (m.botoes || []).find(x => x.id === idBotao);
    m.respondido = {botao:idBotao, rot: rot || (b && b.rot) || 'feito'};
    return true;
  }

  /* NÃO DESCER É ENTREGAR: a defesa se resolve como derrota sem cena.
     Mora aqui, e não dentro do botão, porque o itinerário do dia de
     jogo oferece a mesma escolha nas paradas dele — e a conta tem de
     ser a mesma, saindo pela mesma porta. */
  function naoDesceu(E, a){
    if(!a || a.resolvido) return null;
    a.resolvido = true;
    const alvo = alvoDaDefesa(E, a);
    alvo.nossos = 0;                  // ninguém desceu: não houve briga
    return TO.acoes.fecharCena(E, {acao:'defender', alvo},
                               {ganhamos:false, membros:[],
                                caidosMandante:0, caidosVisitante:0});
  }

  /* o alvo que `fecharDefesa` espera, montado do ataque marcado */
  function alvoDaDefesa(E, a){
    const o = M().torcida(a.torcida) || {nome:a.nome};
    const est = TO.planejamento.estimativaCaravana(E);
    /* ataque vindo de FILIAL (dono, 25/08/2026): o nome já vem
       decorado ("Jovem Fla Sub-Sede Fortaleza") e o efetivo é o do
       núcleo local, não o da torcida inteira */
    return {cobranca: !!a.cobranca, torcidaId:a.torcida, nome:a.nome || o.nome,
            tipo: a.alvo === 'emboscada' ? 'emboscada'
                : a.alvo === 'bar' ? 'bar' : a.alvo,
            cena: a.cena,
            bairro: '',
            efetivo: a.efetivo || TO.acoes.efetivoDePe(E, o) || 30,
            nossos: a.alvo === 'emboscada' && est ? est.vao
                   : TO.membros.aptosParaOEstadio(E).length,
            rateio: a.alvo === 'emboscada' && est ? est.rateio : 0};
  }

  /* o apito final da partida ao vivo: fecha a decisão e libera o
     relógio — quem chama é o cartão, quando a barra chega aos 90' */
  function encerrarPartida(E, idMsg){
    caixas(E);
    const m = E.feed.find(x=>x.id === idMsg);
    if(!m || m.kind !== 'partida' || m.respondido) return {ok:false};
    const d = m.dados || {};
    m.respondido = {botao:'fim', rot:'Fim de jogo'};
    /* O FIM DA NOSSA PARTIDA CONTA A VAGA (crivo do dono, 22/08/2026):
       empatou no mata-mata, a linha dizia só o placar do tempo normal e
       o jogador ficava sem saber quem passou. E "pelo Copa do Brasil"
       virou "pela": o artigo agora sai do mesmo `pelaComp` do resto. */
    const pen = d.pen;
    const quemPassa = pen ? (pen.c > pen.f ? d.casa : d.fora) : '';
    m.consequencia = `Final: ${d.casa} ${d.gc} × ${d.gf} ${d.fora}`+
                     (d.comp ? `${pelaComp(d.comp)}.` : '.')+
                     (pen ? ` Nos pênaltis, ${Math.max(pen.c,pen.f)} a `+
                            `${Math.min(pen.c,pen.f)}: quem passa é o `+
                            `${quemPassa}.` : '');
    return {ok:true};
  }

  return {INTERVALO_DROP,
          propor, dropar, pendentes, travado, decisaoAberta,
          abertura, eventosDoDia, emboscadaDaViagem,
          lntDeHoje, lntDepoisDaCena, mundoDeHoje,
          registrarConfronto, responder, marcarResposta, responderAniversario, responderFestaDaPauta, pautaFestas, pautaAniversarios, pautaAssalto, fecharPautaAssalto,
          mensagemDe, mensagensNaoLidas, lerMensagens, ganchos, responderMensagemDe,
          tretas, tretasNaoLidas, lerTretas, FREIO_OLHEIRO,
          abrirLote, fecharLote,
          avisoDoOlheiro, nivelDaCampana,
          alvoDaDefesa, encerrarPartida, pautaDosJogos, pautaDaCidade, semanaDeHoje,
          statusDeHoje, eixosDoDia, reuniaoDeHoje,
          caixaReuniao, pautar, pautaAberta, decidirPauta, fecharReuniao,
          mesaDaReuniao, pautaBote, boteDeHoje, diaLivre, alvoDoBar, alvoDaCasa,
          pautaAproximacao, pautaPaz, pautaAfastar,
          linhaDeConsequencia, nomeDaCena, NOME_DIA,
          SOFRIDO, naoDesceu, responderEntrevista, assuntoClubeDeHoje,
          entrevistaDeHoje, protestoNoCT,
          registrarObra, obraInteressa, obraDeHoje, barQuebradoRecente,
          veredictoDeHoje, desfechoDaCompeticao, julgarCampanha};
})();
