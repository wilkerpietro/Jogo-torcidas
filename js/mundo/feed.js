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

  /* -------------------------------------------------------
     A CAIXA DE MENSAGENS
     `E.feed` é o histórico (a mais nova primeiro); `E.feedFila`
     é o que já nasceu e ainda não caiu na tela.
     ------------------------------------------------------- */
  function caixas(E){
    if(!Array.isArray(E.feed)) E.feed = [];
    if(!Array.isArray(E.feedFila)) E.feedFila = [];
    E.feedSeq = E.feedSeq || 1;
    return E;
  }

  const horaDe = (E, chave) => {
    const h = TO.mapa.hash(`${E.data.absoluto}|${chave}`);
    return `${String(8 + h % 15).padStart(2,'0')}:${String(h % 60).padStart(2,'0')}`;
  };

  /* põe uma mensagem na fila. `msg`: {kind, peso:'info'|'decisao',
     texto, tipo, voz, botoes, links, efeitos, dados} */
  function propor(E, msg){
    caixas(E);
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
    return m;
  }
  const pendentes = E => (caixas(E), E.feedFila.length);

  /* decisão dropada e sem resposta = tempo parado */
  function travado(E){
    caixas(E);
    return E.feed.some(m => m.peso === 'decisao' && !m.respondido);
  }
  const decisaoAberta = E =>
    (caixas(E), E.feed.find(m => m.peso === 'decisao' && !m.respondido) || null);

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
      const v = e.ind === 'dinheiro' ? U.dinheiro(Math.abs(e.delta))
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
  function eventosDoDia(E, ctx){
    ctx = ctx || {};
    olheiroDoDia(E);
    guerraDeHoje(E);
    ataqueSofridoHoje(E);
    escoltaDeHoje(E);
    placarDoDia(E, ctx.jogos || []);
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
  const NOME_DIA = [null,'segunda','terça','quarta','quinta','sexta',
                    'sábado','domingo'];

  function olheiroDoDia(E){
    const hoje = E.data.dia;
    const meu = E.torcida.clubeId;

    /* situações 1 e 2: os jogos da NOSSA praça nesta semana */
    for(const j of TO.praca.jogosDaPraca(E)){
      if(diaDoOlheiro(j.dia) !== hoje) continue;
      const nosso = j.casa.id === meu || j.vis.id === meu;
      if(nosso && j.casa.id === meu) olheiroCasa(E, j);
      else if(!nosso) olheiroPraca(E, j);
      /* nosso jogo como visitante DENTRO da nossa cidade (clássico):
         trata como jogo em casa — a rua é a mesma */
      else olheiroCasa(E, j);
    }

    /* situação 3: nosso jogo fora, em outra cidade */
    const j = E.proximoJogo;
    if(j && !j.casa && j.mapaAdv && j.mapaAdv !== E.torcida.mapa &&
       diaDoOlheiro(j.dia||6) === hoje)
      olheiroFora(E, j);
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

  const listaDeEstimativas = ests =>
    ests.map(e=>`${e.nome} com ${e.faixa}`).join(', ');

  /* situação 1 — nós mandantes (ou clássico na nossa praça), há rival */
  function olheiroCasa(E, j){
    const ests = estimativasDaRua(E, j.dia, j);
    const rivais = ests.filter(e=>e.hostil);
    if(!rivais.length) return;                    // sem rival, sem olheiro
    const nossos = TO.membros.aptosParaOEstadio(E).length;
    const chave = `olheiro|${E.data.ano}|${E.data.semana}|casa|${j.casa.id}|${j.vis.id}`;
    propor(E, {
      kind:'olheiro', peso:'decisao', chave, voz:'olheiro',
      texto:`Chefe, ${NOME_DIA[j.dia]} tem ${j.casa.nome} × ${j.vis.nome} `+
            `pelo ${j.comp}. Na rua: ${listaDeEstimativas(ests)}. `+
            `Nós saímos com até ${nossos}. Vamos pra cima de alguém?`,
      dados:{situacao:'casa', dia:j.dia, rivais: rivais.map(r=>r.id)},
      botoes:[
        {id:'atacar',  rot:'Atacar',        acao:'tela-ataque',
         args:{ctx:{dia:j.dia}}},
        {id:'paz',     rot:'Ir em paz',     acao:'paz'},
        {id:'padrao',  rot:'Seguir padrão', acao:'seguir-padrao'}
      ]
    });
  }

  /* situação 2 — jogo de outros clubes na nossa cidade, com rival na rua */
  function olheiroPraca(E, j){
    const ests = estimativasDaRua(E, j.dia, j);
    const rivais = ests.filter(e=>e.hostil);
    if(!rivais.length) return;
    const chave = `olheiro|${E.data.ano}|${E.data.semana}|praca|${j.casa.id}|${j.vis.id}`;
    const chaveJogo = chaveDoJogoDaPraca(E, j);
    propor(E, {
      kind:'olheiro', peso:'decisao', chave, voz:'olheiro',
      texto:`Chefe, ${NOME_DIA[j.dia]} tem ${j.casa.nome} × ${j.vis.nome} `+
            `aqui na cidade. Na rua: ${listaDeEstimativas(ests)}. `+
            `Quer cair em cima de alguém?`,
      dados:{situacao:'praca', dia:j.dia, chaveJogo, rivais: rivais.map(r=>r.id)},
      botoes:[
        {id:'atacar', rot:'Atacar',        acao:'tela-ataque',
         args:{ctx:{dia:j.dia, chaveJogo}}},
        {id:'paz',    rot:'Ir em paz',     acao:'paz-praca', args:{chaveJogo}},
        {id:'padrao', rot:'Seguir padrão', acao:'seguir-padrao-praca',
         args:{chaveJogo, dia:j.dia}}
      ]
    });
  }

  function chaveDoJogoDaPraca(E, j){
    const o = PL().outrosJogosNaCidade(E, E.data.semana)
      .find(x => x.casa.id === j.casa.id && x.vis.id === j.vis.id);
    return o ? o.chave : `${j.casa.id}|${j.vis.id}|${E.data.semana}`;
  }

  /* situação 3 — nosso jogo fora: caravana sempre; olheiro aponta as
     torcidas de lá (se houver rival, as opções de ataque moram na tela
     da caravana) */
  function olheiroFora(E, j){
    const alvos = PL().alvosDaViagem(E, {advId:j.advId, crua:true});
    const chave = `olheiro|${E.data.ano}|${E.data.semana}|fora|${j.advId}`;
    const lista = alvos.length
      ? ` Torcidas de lá na rua: ${alvos.map(a=>`${a.nome} com ${a.faixa}`).join(', ')}.`
      : '';
    propor(E, {
      kind:'olheiro', peso:'decisao', chave, voz:'olheiro',
      texto:`Chefe, ${NOME_DIA[j.dia||6]} o ${E.torcida.clube} joga fora: `+
            `${j.mandante.nome} × ${j.visitante.nome}, em ${j.cidadeAdv}.${lista} `+
            `Monta a caravana e diz se vamos em paz ou pra cima.`,
      dados:{situacao:'fora', dia:j.dia||6},
      botoes:[
        {id:'caravana', rot:'Montar a caravana', acao:'tela-caravana'},
        {id:'padrao',   rot:'Seguir padrão',     acao:'seguir-padrao'}
      ]
    });
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
    if(j && p.intencao === 'atacar' && p.alvoTorcida &&
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
                 args:{tipo: j.casa ? 'casa' : 'fora'}, nota}]
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
                 args:{tipo:'praca', chaveJogo:og.chave, dia:og.dia}, nota}]
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
    a.avisado = true;
    const cfg = SOFRIDO[a.alvo] || SOFRIDO.bar;
    const chave = `sofrido|${E.data.ano}|${E.data.semana}|${a.torcida}|${a.alvo}`;
    propor(E, {
      kind:'sofrido', peso:'decisao', chave, voz:'diretor', tipo:'ruim',
      texto: cfg.texto(a.nome),
      dados:{torcida:a.torcida, alvo:a.alvo, cena:a.cena},
      botoes:[
        {id:'brigar', rot:cfg.brigar, acao:'cena-defesa'},
        {id:'fugir',  rot:cfg.fugir,  acao:'fugir-defesa'}
      ]
    });
  }

  /* a emboscada da rota, agendada quando a caravana pega a estrada:
     estado chama isto no primeiro dia de viagem */
  function emboscadaDaViagem(E){
    if(E.ataqueMarcado && !E.ataqueMarcado.resolvido &&
       E.ataqueMarcado.semana === E.data.semana) return;
    const emb = PL().emboscadaDaRota(E);
    if(!emb) return;
    E.ataqueMarcado = {torcida:emb.torcida, nome:emb.nome, alvo:'emboscada',
                       cena:'rua', cidade:emb.cidade,
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
          {id:'entrar', rot:'Entrar na briga', acao:'cena-escolta'},
          {id:'fora',   rot:'Ficar de fora',   acao:'abandonar-escolta'}
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

    /* a mensagem individual do NOSSO jogo */
    const nosso = jogos.find(j => j.c === meu || j.f === meu);
    if(nosso){
      const somosCasa = nosso.c === meu;
      const gp = somosCasa ? nosso.gc : nosso.gf;
      const gc = somosCasa ? nosso.gf : nosso.gc;
      const tipo = gp > gc ? 'boa' : gp < gc ? 'ruim' : '';
      propor(E, {
        kind:'placar', peso:'info', tipo, voz:'jornal',
        chave:`placar|${E.data.ano}|${E.data.semana}|${E.data.dia}|${meu}`,
        texto:`${nome(nosso.c)} ${nosso.gc} × ${nosso.gf} ${nome(nosso.f)}`+
              `${nosso.compNome ? `, pelo ${nosso.compNome}` : ''}.`
      });
    }

    /* o resumo agrupado, nossa cidade primeiro, com Ver Competições */
    const daCidade = jogos.filter(j => mapaDe(j.c) === E.torcida.mapa && j !== nosso);
    const deFora   = jogos.filter(j => mapaDe(j.c) !== E.torcida.mapa && j !== nosso);
    const linha = j => `${nome(j.c)} ${j.gc} × ${j.gf} ${nome(j.f)}`;
    const ordenados = [...daCidade, ...deFora];
    if(!ordenados.length) return;
    const MOSTRA = 8;
    const resto = ordenados.length - MOSTRA;
    propor(E, {
      kind:'rodada', peso:'info', voz:'jornal',
      chave:`rodada|${E.data.ano}|${E.data.semana}|${E.data.dia}`,
      texto:`Os jogos de ${NOME_DIA[E.data.dia]}: `+
            `${ordenados.slice(0, MOSTRA).map(linha).join(', ')}`+
            `${resto > 0 ? ` e mais ${resto} ${resto===1?'jogo':'jogos'}` : ''}.`,
      links:[{rot:'Ver Competições', acao:'painel', args:{pagina:'competicoes'}}]
    });
  }

  /* -------------------------------------------------------
     7. O RESULTADO DE TODO CONFRONTO
        A porta única: todo fecho de cena passa por aqui.
     ------------------------------------------------------- */
  function registrarConfronto(E, d){
    if(!d) return;
    const onde = d.local && d.local.cena ? nomeDaCena(d.local.cena) : 'na rua';
    const bairro = d.local && d.local.bairro ? `, no bairro ${d.local.bairro}` : '';
    const a = d.a || {}, b = d.b || {};
    const vencedor = d.ganhamos ? (a.nome || E.torcida.nome) : (b.nome || '');
    const presosTxt = (a.presos || 0) > 0 ? ` ${a.presos} dos nossos presos.` : '';
    /* ninguém desceu pra segurar: não houve briga, houve prejuízo */
    const semResistencia = !d.ganhamos && !(a.caidos||0) && !(b.caidos||0)
                        && !(a.n||0);
    propor(E, {
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
      dados:{torcidaId:d.torcidaId, ganhamos:!!d.ganhamos,
             a:{nome:a.nome, n:a.n, caidos:a.caidos, presos:a.presos},
             b:{nome:b.nome, n:b.n, caidos:b.caidos, presos:b.presos}}
    });
  }

  const NOMES_CENA = {
    arredores:'nos arredores do estádio', praca:'na praça',
    rua:'numa rua de periferia', 'rua-media':'numa rua de classe média',
    'rua-nobre':'numa rua de classe alta', bar:'no bar', comercio:'no comércio',
    ct:'no CT', sede:'na sede', loja:'na loja', subsede:'na subsede'
  };
  const nomeDaCena = c => NOMES_CENA[c] || 'na rua';

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
      /* --- as que resolvem aqui --- */
      case 'paz':
        PL().definirIntencao(E, 'paz');
        marcar();
        return {ok:true};
      case 'paz-praca':
        PL().definirInvestida(E, b.args.chaveJogo, null);
        marcar();
        return {ok:true};
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
        /* não descer é entregar: a defesa se resolve como derrota sem cena */
        const a = E.ataqueMarcado;
        marcar();
        if(a && !a.resolvido){
          a.resolvido = true;
          const alvo = alvoDaDefesa(E, a);
          alvo.nossos = 0;              // ninguém desceu: não houve briga
          TO.acoes.fecharCena(E, {acao:'defender', alvo},
                              {ganhamos:false, membros:[],
                               caidosMandante:0, caidosVisitante:0});
        }
        return {ok:true};
      }
      case 'abandonar-escolta': {
        /* deixar o aliado apanhando sozinho cobra a relação */
        const d = m.dados || {};
        if(d.aliado){
          E.relacoes[d.aliado] = U.limitar((E.relacoes[d.aliado]||0) - 15, -100, 100);
        }
        marcar();
        return {ok:true};
      }

      /* --- as que a casca abre em tela --- */
      case 'tela-ataque':
      case 'tela-caravana':
      case 'cena-guerra':
      case 'cena-defesa':
      case 'cena-escolta':
        marcar();
        return {ok:true, abrir:{tela:b.acao, args:b.args || {}, msg:m}};
      case 'painel':
        /* link informativo não consome nada */
        m.respondido = null;
        return {ok:true, abrir:{tela:'painel', args:b.args || {}}};
    }
    return {ok:false};
  }

  /* o alvo que `fecharDefesa` espera, montado do ataque marcado */
  function alvoDaDefesa(E, a){
    const o = M().torcida(a.torcida) || {nome:a.nome};
    const est = TO.planejamento.estimativaCaravana(E);
    return {torcidaId:a.torcida, nome:o.nome || a.nome,
            tipo: a.alvo === 'emboscada' ? 'emboscada'
                : a.alvo === 'bar' ? 'bar' : a.alvo,
            cena: a.cena,
            bairro: '',
            efetivo: TO.acoes.efetivoDe(E, o) || 30,
            nossos: a.alvo === 'emboscada' && est ? est.vao
                   : TO.membros.aptosParaOEstadio(E).length,
            rateio: a.alvo === 'emboscada' && est ? est.rateio : 0};
  }

  return {INTERVALO_DROP,
          propor, dropar, pendentes, travado, decisaoAberta,
          eventosDoDia, emboscadaDaViagem,
          registrarConfronto, responder, alvoDaDefesa,
          linhaDeConsequencia, nomeDaCena, NOME_DIA};
})();
