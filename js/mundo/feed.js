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
    'atacar-bar-rival'
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
    const m = E.feedFila.shift();
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
    const item = ((m.dados||{}).lista||[]).find(x=>x.torcida === torcidaId);
    if(!item || item.resposta) return {ok:false};
    E.relacoes = E.relacoes || {};
    const REL = TO.relacoes.REL;
    if(ir){
      TO.estado.lancar(E, `Presença na festa da ${item.nome}`, -2000);
      E.relacoes[torcidaId] = Math.max(-100, Math.min(100,
        TO.relacoes.nivel(E, torcidaId) + REL.irAniversario));
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
    const lista = m.dados.lista;
    const foi = lista.filter(x=>x.resposta==='ir').length;
    const furou = lista.filter(x=>x.resposta==='nao').length;
    const cada = n => n === 1 ? 'com ela' : 'com cada uma';
    m.consequencia =
      (foi ? `${foi} ${foi===1?'festa':'festas'}: ${U.dinheiro(-2000*foi)} · `+
             `+${REL.irAniversario} de relação ${cada(foi)}. ` : '') +
      (furou ? `${furou} ${furou===1?'furada':'furadas'}: −${REL.furarAniversario} `+
               `de relação ${cada(furou)} · Prestígio −${2*furou}.` : '');
    if(lista.every(x=>x.resposta)){
      m.respondido = {botao:'lista',
        rot:`${foi} ${foi===1?'festa':'festas'}, ${furou} ${furou===1?'furada':'furadas'}`};
    }
    return {ok:true, fechou: !!m.respondido};
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
    passo('assalto',        ()=>assaltoDeHoje(E));
    passo('bar rival',      ()=>barRivalDeHoje(E));
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
          if(etapa.semana !== E.data.semana) continue;
          for(const jg of etapa.jogos){
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
        if(etapa.semana !== E.data.semana) continue;
        for(const j of (etapa.jogos||[])){
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
    const em10 = new Date(hoje.getTime());
    em10.setDate(em10.getDate() + 10);

    /* o convite das outras — SÓ DE ALIADA (correção do dono,
       18/08/2026): a Garra do CRB chamando a TUF pra festa não faz
       sentido. Convida quem a Diplomacia rotula Aliado ou Irmandade
       (relação viva ≥ 20) e as irmãs de clube.

       UMA MENSAGEM POR MÊS (pedido do dono, 08/09/2026): um convite
       por aliada, dez dias antes de cada festa, era spam — com trinta
       aliadas o feed parava trinta vezes. Agora sai UMA lista no
       começo de cada mês com as aliadas que fazem aniversário nele, e
       cada uma tem o seu Ir / Não ir dentro do cartão
       (`responderAniversario`). O efeito de cada resposta é o mesmo de
       antes: ir custa R$ 2.000 e aproxima; não ir afasta e queima
       prestígio. A mensagem só é dada por respondida quando todas
       tiverem resposta — até lá o relógio fica parado, como em toda
       decisão. */
    {
      const ano = hoje.getFullYear(), mes = hoje.getMonth();
      const chave = `aniv-mes|${ano}|${mes+1}`;
      const lista = [];
      for(const o of M().jogaveis()){
        if(o.id === E.torcida.id || o.incompleta || !o.fundacao) continue;
        const irma = M().saoIrmas && M().saoIrmas(E.torcida.id, o.id);
        if(!irma && TO.relacoes.nivel(E, o.id) < 20) continue;
        const aniv = dataDoAniversario(o.id, ano);
        if(aniv.getMonth() !== mes) continue;
        /* festa que já passou quando a lista sai (partida começada no
           meio do mês) não entra: não se decide o que já aconteceu */
        if(aniv.getDate() < hoje.getDate()) continue;
        const idade = ano - o.fundacao;
        if(idade <= 0) continue;
        lista.push({torcida:o.id, nome:o.nome, data:fmtDia(aniv),
                    dia:aniv.getDate(), idade, resposta:null});
      }
      if(lista.length){
        lista.sort((a,b)=>a.dia-b.dia);
        const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho',
                       'agosto','setembro','outubro','novembro','dezembro'];
        const m = propor(E, {
          kind:'aniversarios', peso:'decisao', voz:'rua', chave,
          texto:`Os convites de ${MESES[mes]} chegaram: ${lista.length} `+
                `${lista.length===1?'aliada faz':'aliadas fazem'} aniversário `+
                `este mês. Ir custa R$ 2.000 por festa e aproxima; furar afasta `+
                `e queima na rua. Em quais a gente aparece?`,
          dados:{ano, mes:mes+1, lista}
        });
        /* o convite de antes, sem botão, vira mensagem de cada aliada —
           só quando a lista do mês de fato nasce (pedido do dono,
           08/09/2026) */
        if(m) for(const a of lista)
          mensagemDe(E, a.torcida, `Fala irmão, dia ${a.data} comemoramos ${a.idade} `+
            `anos de história. A presença de vocês seria uma honra pra gente.`, 'convite');
      }
    }

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
      const aniv = dataDoAniversario(q.id, em10.getFullYear(), q.fonte);
      if(mesmoDia(aniv, em10)){
        const idade = em10.getFullYear() - q.fundacao;
        if(idade > 0) propor(E, {
          kind:'aniversario', peso:'decisao', voz:'diretor',
          chave:`aniv-${q.tipo}|${em10.getFullYear()}`,
          texto: q.tipo === 'torcida'
            ? `Dia ${fmtDia(aniv)} a torcida completa ${idade} anos. `+
              `Que festa vamos fazer?`
            : `Dia ${fmtDia(aniv)} o ${q.nome} completa ${idade} anos. `+
              `Que festa vamos fazer?`,
          dados:{tipo:q.tipo, anoCivil:em10.getFullYear()},
          botoes:[
            {id:'grande',  rot:'Festa grande', acao:'aniv-festa',
             nota:`R$ ${U.numero(F.grande.custo)} · potencial de `+
                  `${U.dinheiro(F.grande.min)} a ${U.dinheiro(F.grande.max)}`+
                  ` · +${F.grande.moral} de moral`},
            {id:'simples', rot:'Festa simples', acao:'aniv-festa',
             nota:`R$ ${U.numero(F.simples.custo)} · potencial de `+
                  `${U.dinheiro(F.simples.min)} a ${U.dinheiro(F.simples.max)}`+
                  ` · +${F.simples.moral} de moral`},
            {id:'nada',    rot:'Não fazer nada', acao:'aniv-festa',
             nota:`${F.nada.moral} de moral`}
          ]
        });
      }
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
  function assaltoDeHoje(E){
    const sa = TO.relacoes.semanaAbs(E);
    const H = TO.mapa.hash;
    /* NOVE EM CADA 52, sem sorteio: o contador `n × 9 / 52` vira de
       degrau exatamente nove vezes por ano, e as semanas saem
       espalhadas em vez de agrupadas. O deslocamento por torcida é o
       que faz dois saves caírem em semanas diferentes. */
    const n = sa + H(`assalto|${E.torcida.id}`) % SEMANAS_DO_ANO;
    const deg = k => Math.floor(k * ASSALTOS_ANO / SEMANAS_DO_ANO);
    if(deg(n) === deg(n - 1)) return;
    let dia = 1 + H(`assalto|${sa}|${E.torcida.id}`) % 7;
    for(let k=0; k<7 && !diaComumFeed(E, dia); k++) dia = (dia % 7) + 1;
    if(dia !== E.data.dia) return;
    const dir = E.membros.find(m=>m.cargo === 'diretoria' &&
                                  TO.membros.disponivel(m));
    if(!dir) return;
    if(E.membros.filter(TO.membros.disponivel).length < 2) return;
    propor(E, {
      kind:'assalto', peso:'decisao', voz:'diretor',
      chave:`assalto|${E.data.ano}|${sa}`,
      texto:`Chefe, o ${dir.apelido} mapeou uns alvos pra um assalto — `+
            `do mercadinho ao banco, cada um com seu risco. Bora ver?`,
      botoes:[
        {id:'ver',  rot:'Ver os alvos',  acao:'tela-assalto'},
        {id:'nada', rot:'Deixar quieto', acao:'nada'}
      ]
    });
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
  function barRivalDeHoje(E){
    const sa = TO.relacoes.semanaAbs(E);
    const H = TO.mapa.hash;
    /* ~15% das semanas têm a sugestão: 0,15 × 52 ≈ 8 por ano */
    if(H(`barrival|${sa}|${E.torcida.id}`) % 100 >= 15) return;
    let dia = 1 + H(`barrival|d|${sa}|${E.torcida.id}`) % 7;
    for(let k=0; k<7 && !diaComumFeed(E, dia); k++) dia = (dia % 7) + 1;
    if(dia !== E.data.dia) return;
    const alvos = (TO.acoes.alvosDeAtaque(E) || []).filter(a =>
      a.tipo === 'bar' && TO.relacoes.nivel(E, a.torcidaId) <= -15);
    if(!alvos.length) return;
    const alvo = alvos[H(`barrival|a|${sa}`) % alvos.length];
    propor(E, {
      kind:'barrival', peso:'decisao', voz:'diretor',
      chave:`barrival|${E.data.ano}|${sa}`,
      /* texto do dono (26/08/2026) */
      texto:`Chefe, chegou a informação que o bar da ${alvo.deQuem} tá `+
            `cheio deles lá, a gente quer dar o bote neles e roubar o `+
            `caixa do bar.`,
      dados:{alvo: alvo.id, nome: alvo.deQuem},
      botoes:[
        {id:'atacar', rot:'Atacar o bar', acao:'atacar-bar-rival',
         nota:'Prestígio até ±10 · ganhando, R$ 60 por defensor + 22% '+
              'do caixa · Relação −26 (perdendo, −18)'},
        {id:'nada', rot:'Deixar quieto', acao:'ignorar-bar-rival',
         nota:'Prestígio −1 · Moral −1'}
      ]
    });
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
  /* "pela Copa do Nordeste", "pelo Paulistão" */
  const pelaComp = n => n ? (/^Copa/i.test(n) ? `, pela ${n}` : `, pelo ${n}`) : '';
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
    /* o nosso jogo fora entra na aba da sede: é de lá que a caravana sai */
    const jf = E.proximoJogo;
    if(vigente && emCasa && jf && !jf.casa && jf.mapaAdv && jf.mapaAdv !== E.torcida.mapa){
      const alvos = PL().alvosDaViagem(E, {advId:jf.advId, crua:true});
      linhas.push({
        tipo:'fora', advId:jf.advId, cidade:jf.cidadeAdv, mapaAdv:jf.mapaAdv,
        comp:jf.competicao || 'fora de casa', diaN:jf.dia||6, dia:NOME_DIA[jf.dia||6],
        hora:jf.hora || '', estadio:jf.estadio || '', passou:passou(jf.dia||6),
        clubes:[{id:jf.mandante.id, nome:jf.mandante.nome, cor:(jf.mandante.cores||[])[0]||'#888'},
                {id:jf.visitante.id, nome:jf.visitante.nome, cor:(jf.visitante.cores||[])[0]||'#888'}],
        torcidas: alvos.map(a=>({id:a.id, nome:a.nome, cor:corDe(a.id), faixa:a.faixa, hostil:!a.aliada})),
        temAlvo: alvos.some(a=>!a.aliada)
      });
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
  /* guarda um assunto pra próxima mesa; a mesma chave não entra duas vezes */
  function pautar(E, item){
    const Rn = caixaReuniao(E);
    if(item.chave && Rn.pauta.some(x=>x.chave === item.chave)) return null;
    const it = Object.assign({id:Rn.seq++, decidido:null, consequencia:''}, item);
    Rn.pauta.push(it);
    return it;
  }
  const pautaAberta = E => caixaReuniao(E).pauta.filter(x=>!x.decidido);

  /* O CARTÃO DA REUNIÃO: dia 5, DE DOIS EM DOIS MESES (dono, 12/09/2026).
     Era todo mês; o dono pediu bimestral. Fica nos meses ÍMPARES —
     janeiro, março, maio, julho, setembro e novembro —, que é o mês em
     que o jogo começa: seis mesas por ano em vez de doze. O que nasce
     entre uma e outra continua guardado em `E.reuniao.pauta` e espera
     a próxima; nada vira cartão solto. */
  const MES_DA_MESA = m => (m % 2) === 1;
  function reuniaoDeHoje(E){
    const Rn = caixaReuniao(E);
    const d = dataDeHoje(E);
    if(d.getDate() !== 5 || !MES_DA_MESA(mesDe(E))) return null;
    const marca = `${E.data.ano}|${mesDe(E)}`;
    if(Rn.ultima === marca) return null;
    Rn.ultima = marca;
    /* o que as aliadas trazem nasce na própria mesa */
    const a = pautaAproximacao(E); if(a) pautar(E, a);
    const p = pautaPaz(E);         if(p) pautar(E, p);
    const f = pautaAfastar(E);     if(f) pautar(E, f);
    const abertos = pautaAberta(E);
    const X = TO.eixos;
    const mesa = X && X.cabemosEmMais(E) && !X.esperaDaMesa(E);
    /* mesa vazia e sem jogada nossa possível: não se chama reunião */
    if(!abertos.length && !mesa) return null;
    const quantos = abertos.length;
    return propor(E, {
      kind:'reuniao', peso:'decisao', voz:'diretor',
      chave:`reuniao|${marca}`,
      texto:`Reunião de diplomacia — ${MESES[d.getMonth()]}. `+
        (quantos ? `${quantos} assunto${quantos>1?'s':''} na mesa`
                 : 'Nada trazido de fora no bimestre')+
        (mesa ? ', e a nossa jogada nos eixos em aberto.' : '.'),
      dados:{ano:E.data.ano, mes:mesDe(E), assuntos:quantos},
      botoes:[{id:'abrir', rot:'Sentar com a diretoria', acao:'abrir-reuniao'}]
    });
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
    }
    return {};
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
                   brigar:'Descer pra treta', fugir:'Mandar seguir viagem'}
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
      texto: cfg.texto(a.nome),
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

    if(ev.tipo === 'bar'){
      /* o ataque ao bar entra pelo caminho de sempre: marca o ataque e
         a convocação de defesa monta a mensagem */
      if(E.ataqueMarcado && !E.ataqueMarcado.resolvido &&
         E.ataqueMarcado.semana === E.data.semana) return;
      /* ataque de nanica não existe (decisão do dono, 17/08/2026): se
         nem a maior rival da praça tem metade do nosso efetivo, o bar
         fica em paz neste trimestre — melhor sem cena do que uma cena
         que acaba com eles correndo na largada */
      /* de pé, sem ferido nem preso, dos dois lados (dono, 27/08/2026) */
      const vivoR = TO.relacoes.disponiveisIA(E, rival.id);
      if(vivoR < TO.membros.aptosParaOEstadio(E).length * 0.5) return;
      E.ataqueMarcado = {torcida:rival.id, nome:rival.nome, alvo:'bar',
                         cena:'bar', ano:E.data.ano, semana:E.data.semana,
                         dia:E.data.dia};
      avisoDoOlheiro(E, {chave:`bar|${E.data.ano}|${E.data.semana}|${rival.id}`,
                         alvo:'bar', nome:rival.nome});
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
      texto:`Zona ${b.zona} marcou uma treta no ${b.nome} contra a `+
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
    mensagemDe(E, rival.id, `Hoje à noite, no ${b.nome}, ${tam} contra ${tam}. `+
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
    const grupo = meu.grupo !== undefined && meu.grupo !== null
                ? ` do grupo ${LETRA[meu.grupo] || (meu.grupo+1)}` : '';
    const fase = /rodada/.test(meu.fase)
               ? `${meu.fase}${grupo} da ${meu.div.nome}`
               : `${meu.fase} da ${meu.div.nome}`;
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
        tipo: meu && /Campeão/.test(meu.fase) ? 'bom'
            : meu && /chaves/.test(meu.fase) ? 'ruim' : 'neutro',
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
      const artEst = /^(Arena|Vila|Fonte|Ilha)/i.test(estadio) ? 'na' : 'no';
      /* A ETAPA NA FRASE (reformulação do dono, 18/08/2026): grupos
         falam "pela 3ª rodada da Copa do Nordeste"; mata-mata fala a
         fase — "pela semifinal (ida)", "pelas quartas", "pela final". */
      const deComp = nosso.compNome
        ? (/^Copa/i.test(nosso.compNome) ? `da ${nosso.compNome}`
                                         : `do ${nosso.compNome}`) : '';
      let etapa = '';
      if(nosso.fase){
        let rot = String(nosso.fase)
          .replace(' · ida', ' (ida)').replace(' · volta', ' (volta)');
        if(/clubes$/i.test(rot)) rot = `fase de ${rot}`;
        const plural = /^(Oitavas|Quartas)/i.test(rot);
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
        cidade: onde.replace(/^n[ao]s? /, '').replace(/^num[a]? /, ''),
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
    'emb-posto':'no posto', 'emb-onibus':'na estrada'
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
        E.relacoes[id] = Math.max(-100, Math.min(100,
          TO.relacoes.nivel(E, id) + TO.relacoes.REL.irAniversario));
        /* aparecer na festa é gesto: zera o relógio da indiferença */
        TO.relacoes.marcarAjuda(E, id);
        m.consequencia = `Fomos. +${TO.relacoes.REL.irAniversario} de relação `+
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
        const d = m.dados || {};
        const F = FESTA_ANIV[d.tipo] || FESTA_ANIV.torcida;
        const f = F[idBotao];
        if(!f) return {ok:true};
        const quem = d.tipo === 'torcida' ? 'da torcida' : 'do clube';
        if(idBotao === 'nada'){
          TO.estado.mexerIndicador(E, 'moral', f.moral,
            `Aniversário ${quem} passou em branco`);
          m.consequencia = 'Ninguém fez nada. −2 de moral.';
        } else {
          TO.estado.lancar(E, `Festa de aniversário ${quem}`, -f.custo);
          TO.estado.mexerIndicador(E, 'moral', f.moral,
            `Festa de aniversário ${quem}`);
          (E.festasAniversario = E.festasAniversario || {})
            [`festa-${d.tipo}|${d.anoCivil}`] = idBotao;
          m.consequencia = `Festa ${idBotao === 'grande' ? 'grande' : 'simples'} `+
            `marcada: ${U.dinheiro(-f.custo)} agora, a receita sai no dia.`;
        }
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
           investida, e a estrada continua compromisso da semana */
        const r = PL().confirmar(E);
        marcar();
        const p = PL().plano(E), j = E.proximoJogo;
        const est = j && !j.casa ? PL().estimativaCaravana(E) : null;
        const alvo = p.intencao !== 'paz' && p.alvoTorcida ? M().torcida(p.alvoTorcida) : null;
        m.consequencia = (est ? `Caravana: ${est.vao} para ${j.cidadeAdv || 'fora'}. ` : '')+
          (alvo ? `Plano: em cima da ${alvo.nome}.` : 'Plano: ir em paz.')+
          (r && r.gasto ? ` ${U.dinheiro(r.gasto)} pagos agora.` : '');
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
          registrarConfronto, responder, marcarResposta, responderAniversario,
          mensagemDe, mensagensNaoLidas, lerMensagens, ganchos, responderMensagemDe,
          tretas, tretasNaoLidas, lerTretas, FREIO_OLHEIRO,
          abrirLote, fecharLote,
          avisoDoOlheiro, nivelDaCampana,
          alvoDaDefesa, encerrarPartida, pautaDosJogos, pautaDaCidade, semanaDeHoje,
          statusDeHoje, eixosDoDia, reuniaoDeHoje,
          caixaReuniao, pautar, pautaAberta, decidirPauta, fecharReuniao,
          pautaAproximacao, pautaPaz, pautaAfastar,
          linhaDeConsequencia, nomeDaCena, NOME_DIA,
          SOFRIDO, naoDesceu};
})();
