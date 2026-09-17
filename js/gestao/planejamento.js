/* =========================================================
   PLANEJAMENTO — as decisões da semana antes da bola rolar
   ---------------------------------------------------------
   É aqui que a semana deixa de ser uma lista de ações e vira
   um plano: ir em paz ou atacar, onde atacar, com quanta
   bomba, num bonde só ou dividido por zona, como receber o
   aliado que joga na nossa cidade e por qual estrada a
   caravana viaja.

   Tudo o que a tela oferece sai de dado que já existe — o
   calendário, o grafo de relações e as rodovias das trinta
   praças. Nada é inventado na hora.
   ========================================================= */
window.TO = window.TO || {};

TO.planejamento = (function(){
  const U = TO.util;
  const M = () => TO.mundo;

  /* =======================================================
     O PLANO DA SEMANA
     Zera sozinho quando o jogo muda: plano é da partida, não
     da temporada.
     ======================================================= */
  function plano(E){
    const chave = E.proximoJogo ? E.proximoJogo.chave
                                : `folga-${E.data.ano}-${E.data.semana}`;
    if(!E.plano || E.plano.chave !== chave){
      /* o plano nasce do padrão salvo pra esse tipo de jogo, se houver:
         quem não quer decidir toda semana decide uma vez */
      const padrao = (E.padroes||{})[tipoDoJogo(E)];
      E.plano = Object.assign(
        {intencao:'paz', como:'arredores', olheiro:null,
         alvo:'arredores', alvoTorcida:null, bombas:0,
         bondes:1, destinos:{}, investidas:{}, caravana:null, rota:null},
        padrao ? JSON.parse(JSON.stringify(padrao)) : {},
        {chave, recepcao:{}, pago:{}, investidas:{}, decidido: !!padrao});
      if(padrao && padrao.fracao != null){
        const est = estimativaCaravana(E);
        if(est) E.plano.caravana = Math.round(est.interessados * padrao.fracao);
      }
    }
    return E.plano;
  }

  /* dois padrões dão conta do ano: jogo em casa e viagem */
  const tipoDoJogo = E => TO.financeiro.precisaCaravana(E) ? 'fora' : 'casa';

  function salvarPadrao(E){
    const p = plano(E), est = estimativaCaravana(E);
    E.padroes = E.padroes || {};
    E.padroes[tipoDoJogo(E)] = {
      intencao:p.intencao, como:p.como, olheiro:p.olheiro, alvo:p.alvo,
      bombas:p.bombas, bondes:p.bondes,
      destinos:Object.assign({}, p.destinos), rota:p.rota,
      /* a caravana é guardada como fração do interesse, não como número */
      fracao: est ? U.limitar(est.vao / Math.max(1, est.interessados), 0, 1) : null
    };
    return tipoDoJogo(E);
  }
  const temPadrao = E => !!(E.padroes||{})[tipoDoJogo(E)];
  function esquecerPadrao(E){ if(E.padroes) delete E.padroes[tipoDoJogo(E)]; }

  /* =======================================================
     ONDE ATACAR (GDD §14 e §15)
     Cada ponto tem personalidade: o terminal é fechado e a PM
     chega rápido, a praça é aberta e a briga espalha.
     ======================================================= */
  const PONTOS = [
    /* o destino: só faz sentido quando se decide esperar o rival chegar */
    {id:'arredores', nome:'Arredores do estádio', curto:'ARREDORES',
     risco:3, prestigio:4, ida:false, x:0.80, y:0.34, acima:false,
     nota:'cordão da PM em peso, mas é onde o rival inteiro está'},
    /* os da ida: o bonde deles ainda está na rua, quebrado em pedaços */
    {id:'bar',       nome:'Bar do rival',         curto:'BAR DELES',
     risco:2, prestigio:5, ida:true, via:'sul', x:0.21, y:0.46, acima:false,
     nota:'poucos lá dentro, mas é humilhação que fica'},
    {id:'praca',     nome:'Praça de encontro',    curto:'PRAÇA',
     risco:2, prestigio:2, ida:true, via:'norte', x:0.37, y:0.15, acima:true,
     nota:'aberta, a briga espalha e pouca gente se pega'},
    {id:'terminal',  nome:'Terminal rodoviário',  curto:'TERMINAL',
     risco:4, prestigio:3, ida:true, via:'sul', x:0.34, y:0.76, acima:false,
     nota:'fechado: pega o bonde na descida, a PM chega rápido'},
    {id:'avenida',   nome:'Avenida de acesso',    curto:'AVENIDA',
     risco:2, prestigio:3, ida:true, via:'norte', x:0.57, y:0.38, acima:true,
     nota:'larga, favorece a linha e a fuga'},
    {id:'viaduto',   nome:'Viaduto da via expressa', curto:'VIADUTO',
     risco:3, prestigio:4, ida:true, via:'sul', x:0.66, y:0.74, acima:false,
     nota:'gargalo: o bonde tem de passar por baixo, sem saída pelos lados'}
  ];

  /* GDD §14: esperar no destino ou cortar o caminho */
  const COMO = [
    {id:'arredores', rot:'Só nos arredores do estádio',
     nota:'espera o bonde deles chegar inteiro; PM em peso, briga grande'},
    {id:'ida',       rot:'Na ida ao estádio',
     nota:'corta o caminho antes do cordão; precisa do olheiro no ponto certo'}
  ];

  /* o ponto ganha um bairro de verdade da praça, sempre o mesmo */
  function pontosDeAtaque(E){
    const bairros = M().bairrosDe(E.torcida.mapa);
    return PONTOS.map((p, i)=>Object.assign({}, p, {
      bairro: bairros.length ? bairros[(i*7) % bairros.length].nome : ''
    }));
  }
  const pontosDeIda = E => pontosDeAtaque(E).filter(p=>p.ida);
  const ponto = id => PONTOS.find(p=>p.id===id) || PONTOS[0];

  /* =======================================================
     O OLHEIRO
     Antes de emboscar é preciso saber por onde eles vêm. O
     olheiro dá a leitura da semana: em quantos bondes a torcida
     rival deve se dividir e qual o tamanho de cada um. A leitura
     é a mesma o dia inteiro — olheiro não muda de ideia porque
     a tela redesenhou.
     ======================================================= */
  function baralhoFixo(txt){
    let h = 2166136261;
    for(let i=0;i<txt.length;i++){ h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
    return U.semear(h >>> 0);
  }

  function relatorioDoOlheiro(E, idTorcida){
    const o = M().torcida(idTorcida);
    if(!o) return null;
    /* de pé, sem ferido nem preso (ordem do dono, 27/08/2026) */
    const vivos = TO.relacoes && TO.relacoes.disponiveisIA
      ? TO.relacoes.disponiveisIA(E, idTorcida)
      : (((TO.relacoes && TO.relacoes.mundo(E)[idTorcida]) || {}).membros
         || o.membros || 20);
    /* A RÉGUA DO JOGADOR AQUI TAMBÉM (ordem do dono, 31/08/2026): o
       olheiro lê a presença de verdade — se a torcida joga na praça
       DELA (nosso jogo fora, ou rival da nossa cidade), desce todo o
       efetivo de pé; se ela vem de fora pro nosso jogo em casa, o que
       chega é a caravana. Os 62% avulsos morreram. */
    const j = E.proximoJogo;
    const vemDeFora = j && j.casa && o.mapa !== E.torcida.mapa;
    const efetivo = Math.max(6, vemDeFora ? caravanaDe(o, 0, E) : vivos);
    const r = baralhoFixo(`${idTorcida}|${E.data.ano}|${E.data.semana}`);

    /* torcida grande se divide mais; torcida pequena anda junto */
    let bondes = efetivo > 140 ? 3 : efetivo > 70 ? 2 : 1;
    const d = r();
    if(d > 0.80) bondes++;
    else if(d < 0.18 && bondes > 1) bondes--;
    bondes = U.limitar(bondes, 1, 4);

    /* os bondes não são iguais: o primeiro leva a bateria e o grosso */
    const pesos = [];
    for(let i=0;i<bondes;i++) pesos.push(1 + r()*0.6 + (i===0 ? 0.9 : 0));
    const soma = pesos.reduce((s,x)=>s+x, 0);
    const tamanhos = pesos.map(p=>Math.max(4, Math.round(efetivo*p/soma)));

    /* quanto o olheiro enxerga: relação muito ruim deixa o rival
       cauteloso e a leitura mais incerta */
    const rel = TO.relacoes.nivel(E, idTorcida);
    const magoa = Math.max(0, -rel - 45);
    const confianca = Math.round(U.limitar(88 - magoa*0.35 - (bondes-1)*9, 35, 95));

    const pts = pontosDeIda(E);
    /* cada bonde tem um caminho preferido; o olheiro chuta qual */
    const rotas = tamanhos.map((n, i)=>({
      n, ponto: pts[Math.floor(r()*pts.length)] || pts[0]
    }));
    return {torcida:o, efetivo, bondes, tamanhos, confianca, rotas,
            texto: bondes===1
              ? `Saem num bonde só, ${tamanhos[0]} na conta do olheiro.`
              : `Devem se quebrar em ${bondes} bondes: ${tamanhos.join(', ')}.`};
  }

  /* Chance de o olheiro estar no lugar certo: com o rival num bonde só,
     é acertar ou perder tudo; dividido, pega-se um pedaço. */
  function leituraDoPonto(E, rel, idPonto){
    if(!rel) return null;
    const pegos = rel.rotas.filter(r=>r.ponto && r.ponto.id === idPonto);
    const gente = pegos.reduce((s,r)=>s+r.n, 0);
    const chance = Math.round(U.limitar(
      (gente ? 62 : 14) + (rel.confianca-70)*0.4, 8, 92));
    return {gente, chance, bondes:pegos.length,
            texto: gente
              ? `O olheiro põe ${gente} deles passando aqui`
              : 'O olheiro não vê bonde nenhum por aqui'};
  }

  /* GDD §16.7: dividir por zona rende mais frentes de ataque, cada uma
     mais fraca. Um bonde só bate mais forte num lugar só. */
  function divisao(E, bondes){
    const gente = efetivoDaSaida(E);
    const zonas = M().ZONAS.slice(0, bondes);
    return {
      bondes, zonas,
      porBonde: Math.floor(gente / Math.max(1, bondes)),
      ataques: bondes,
      /* linha quebra mais fácil quando o bonde é pequeno */
      solidez: U.limitar(1 - (bondes-1)*0.18, 0.4, 1)
    };
  }

  /* quanta gente sai de casa: em jogo fora, o tamanho da caravana.
     Jogo na cidade de uma SUB-SEDE nossa (dono, 26/08/2026): todos os
     membros daquele núcleo vão pro jogo, fora os demais que fazem
     caravana normalmente — o núcleo já mora lá. */
  /* O JOGO DO DIA MANDA, NÃO O DA SEMANA (correção do dono, 06/09/2026).
     `E.proximoJogo` é um por semana — o mata-mata ou o de fim de semana
     —, e numa semana com jogo em casa na quarta e jogo fora no domingo
     o estádio de quarta lia o tamanho da CARAVANA de domingo: a TUF
     punha 8 na arquibancada com 100 aptos. Quem chama passa a partida
     do dia (`{mapa}` da praça onde ela é, ou `{casa}`); jogo na nossa
     praça leva todo mundo apto, e a caravana só vale pra viagem. Sem
     partida, segue lendo o jogo da semana, como antes. */
  function efetivoDaSaida(E, partida){
    const aptos = TO.membros.aptosParaOEstadio(E).length;
    const j = E.proximoJogo;
    const emCasa = partida
      ? (partida.mapa ? partida.mapa === E.torcida.mapa : !!partida.casa)
      : !TO.financeiro.precisaCaravana(E);
    if(emCasa) return aptos;
    const mapaAdv = (partida && partida.mapa) || (j && j.mapaAdv);
    const nucleo = (mapaAdv && TO.patrimonio.temFilialEm &&
                    TO.patrimonio.temFilialEm(E, mapaAdv))
      ? TO.membros.aptosDaFilial(E, mapaAdv).length : 0;
    const est = estimativaCaravana(E);
    /* A ESCOLTA DO ALIADO DA PRAÇA DELES (pedido do dono, 08/09/2026):
       se a ajuda pedida no planejamento veio com escolta, o bonde deles
       anda junto do nosso na praça do jogo — entra no efetivo da saída
       como a filial entra: gente do nosso lado na rua e no estádio. */
    const aj = ajudaDe(E);
    const escolta = (aj && aj.mapa === mapaAdv && aj.escolta) ? aj.escolta : 0;
    return (est ? est.vao : aptos) + nucleo + escolta;
  }

  /* =======================================================
     PEDIR AJUDA A ALIADO NO JOGO FORA (pedido do dono, 08/09/2026)
     O espelho da recepção: na praça do jogo fora, uma aliada
     (relação ≥ 20 ou irmã de clube) pode nos receber. O pedido
     sai da tela da caravana e a resposta vem na hora, com o
     tipo de ajuda — a MESMA tabela que a gente usa pra receber
     aliado: só hospedagem, hospedagem e escolta, escolta e
     churrasco, ou não recebe. Quem decide é a relação, com um
     pouco de sorte fixa por semana. Cada nível custa a ela o
     que custaria a nós (25/50/75 por cabeça da nossa caravana),
     pago do caixa dela até onde ele alcança — o caixa das IAs é
     curto e, se ele mandasse no nível, escolta e churrasco nunca
     sairiam; quem manda é a relação.
     O que muda pra gente:
       · relação: receber soma a tabela da recepção (+7, +12,
         +20); não receber tira −7 — é o que ELA cobra de nós
         no caso inverso;
       · moral: dormir na sede deles dá +1; churrasco dá +2;
       · escolta: 10 membros dela (régua do dono, 08/09/2026)
         andam com o nosso bonde a partir da CHEGADA na cidade —
         concentração, pista, arredores e estádio — e ficam quando
         a caravana pega a estrada de volta (efetivoDaSaida e a
         linha do dia).
     Um pedido por jogo; a resposta fica no plano da semana.
     ======================================================= */
  const ajudaDe = E => (E.plano && E.plano.ajuda) || null;

  /* as aliadas da praça do jogo fora, e a resposta que cada uma daria */
  function aliadasNaPracaDeles(E, jogo){
    const j = jogo || E.proximoJogo;
    if(!j || j.casa || !j.mapaAdv) return [];
    const fora = [];
    for(const o of M().torcidasEm(j.mapaAdv)){
      if(o.id === E.torcida.id || o.incompleta) continue;
      const irma = M().saoIrmas && M().saoIrmas(E.torcida.id, o.id);
      const rel = TO.relacoes.nivel(E, o.id);
      if(!irma && rel < RELACAO_ALIADO) continue;
      fora.push({id:o.id, torcida:o, nome:o.nome, relacao:rel, irma});
    }
    return fora.sort((a,b)=>b.relacao-a.relacao);
  }

  /* a resposta: nível pela relação com uma sorte fixa da semana; o
     caixa dela pode descer o nível */
  function respostaDaAjuda(E, aliadoId, jogo){
    const j = jogo || E.proximoJogo;
    const rel = TO.relacoes.nivel(E, aliadoId);
    const h = TO.mapa.hash(`ajuda|${E.data.ano}|${E.data.semana}|${aliadoId}`);
    const nota = rel + (h % 21) - 10;
    let nivel = nota >= 60 ? 'churrasco' : nota >= 42 ? 'escolta'
              : nota >= 26 ? 'hospedar' : 'nada';
    const est = estimativaCaravana(E, j);
    const cabecas = est ? est.vao : 0;
    return {nivel, custo: custoRecepcao(nivel, cabecas), cabecas, nota};
  }

  function pedirAjuda(E, aliadoId){
    const p = plano(E);
    if(p.ajuda) return p.ajuda;                       // um pedido por jogo
    const j = E.proximoJogo;
    const o = M().torcida(aliadoId);
    if(!j || j.casa || !o) return null;
    const r = respostaDaAjuda(E, aliadoId, j);
    const rec = recepcaoDe(r.nivel);
    E.relacoes = E.relacoes || {};
    /* o ganho encolhe a cada repetição no ano (régua do dono, 17/09/2026) */
    const ganho = rec.relacao > 0
      ? TO.relacoes.ganhoRepetido(E, E.torcida.id, aliadoId, 'caravana', rec.relacao)
      : rec.relacao;
    E.relacoes[aliadoId] = U.limitar(TO.relacoes.nivel(E, aliadoId)
                                     + ganho, -100, 100);
    let moral = 0;
    if(r.nivel !== 'nada'){
      TO.relacoes.marcarAjuda(E, aliadoId);
      moral = r.nivel === 'churrasco' ? 0.4 : r.nivel === 'hospedar' || r.nivel === 'escolta' ? 0.2 : 0;
      if(moral) TO.estado.mexerIndicador(E, 'moral', moral,
        `Recebidos pela ${o.nome} em ${j.cidadeAdv || 'fora'}`);
      /* O GASTO ENTRA NAS FINANÇAS DELA (conferência do dono, 08/09/2026):
         a mesma porta do resto da economia das IAs — `lancarIA` escreve
         no extrato que o perfil da torcida mostra; o caixa paga até
         onde alcança */
      const t = (E.mundoTorcidas||{})[aliadoId];
      if(t && r.custo){
        const pago = Math.min(r.custo, Math.max(0, t.caixa || 0));
        t.caixa = Math.max(0, (t.caixa||0) - r.custo);
        if(pago && TO.relacoes.lancarIA)
          TO.relacoes.lancarIA(E, aliadoId,
            `Recepção da ${E.torcida.nome} (${r.cabecas} cabeças · ${rec.rot.toLowerCase()})`, -pago);
      }
    }
    const escolta = (r.nivel === 'escolta' || r.nivel === 'churrasco')
      ? Math.min(10, Math.max(0, TO.relacoes.disponiveisIA(E, aliadoId))) : 0;
    p.ajuda = {aliado:aliadoId, nome:o.nome, nivel:r.nivel, escolta,
               relacao:ganho, moral: Math.round(moral*5),
               mapa:j.mapaAdv, chave:j.chave};
    /* a resposta chega como mensagem dela (mensagens entre torcidas) */
    if(TO.feed && TO.feed.mensagemDe){
      const TXT = {
        hospedar: `Estamos juntos. A sede fica aberta pra caravana de vocês — colchão, banho e café. Chega cedo.`,
        escolta:  `Estamos juntos. Dormem na sede e o nosso bonde anda com vocês até o portão. Aqui ninguém encosta.`,
        churrasco:`Estamos juntos. Churrasco na sede quando chegarem, e a gente sobe pro estádio de bonde junto. Cidade de vocês.`,
        nada:     `Irmão, dessa vez não vai dar. Semana pesada por aqui. Fica pra próxima.`
      };
      TO.feed.mensagemDe(E, aliadoId, TXT[r.nivel] || TXT.nada,
                         r.nivel === 'nada' ? 'recusa' : 'juntos');
    }
    return p.ajuda;
  }

  /* =======================================================
     CONTRA QUEM
     "Atacar" sozinho é genérico demais: o clube adversário pode
     ter torcida aliada e torcida rival ao mesmo tempo. A
     Gaviões é aliada da Fúria Jovem do Botafogo e rival da
     Torcida Jovem — o alvo tem nome.
     ======================================================= */
  function alvosDoJogo(E){
    const j = E.proximoJogo;
    if(!j || !j.advId) return [];
    /* TORCIDA-IRMÃ NÃO É ALVO (§8.28). Ela não aparece nem como opção:
       marcar ataque contra a organizada irmã do nosso próprio clube não
       é decisão difícil, é decisão impossível. */
    return M().torcidasDe(j.advId).filter(o=>!M().saoIrmas(E.torcida.id, o.id))
      .map(o=>{
      const v = (E.relacoes||{})[o.id];
      return {id:o.id, torcida:o,
              relacao: v===undefined ? M().valorInicial(
                M().relacaoBase(E.torcida.id, o.id)) : v,
              aliada: v !== undefined && v >= 20};
    }).sort((a,b)=>a.relacao-b.relacao);
  }

  /* TODAS ALIADAS? então bater nelas é traição, e o jogo diz isso.
     A pergunta é sobre a rua DAQUELE evento, e não sobre o clube
     adversário do nosso jogo: num jogo da praça o adversário nem é
     nosso. `alvosNaRua` já tira aliada e irmã da lista, então quem
     responde "são todas aliadas" é a lista CRUA da rua. */
  function soAliados(E, ctx){
    const rua = ruaCrua(E, ctx);
    return rua.length > 0 && rua.every(x=>x.aliada);
  }

  /* a rua daquele evento SEM o filtro de aliada — é ela que sabe dizer
     se sobrou alguém pra atacar ou se são todas da casa. É a MESMA
     consulta de `alvosNaRua`, só que sem o corte final: duplicar a
     montagem fazia as duas listas divergirem em forma, e a tela que
     recebesse uma delas desenhava campo faltando. */
  function ruaCrua(E, ctx){
    return alvosNaRua(E, Object.assign({}, ctx || {}, {crua:true}));
  }

  /* A LISTA QUE A TELA DE ATACAR MOSTRA. Não é `alvosNaRua`: quando
     TODAS as da rua são aliadas o botão oferecido é "Trair aliado", e
     o alvo da traição é justamente quem `alvosNaRua` tira da lista.
     Medido em uma temporada: 3 perguntas caíam nisso — o botão saía,
     o clique não abria tela nenhuma e a pergunta era cancelada.

     Botão só existe quando a resposta dele existe (§8.30, R2), e a
     resposta dos dois botões é esta função. */
  function alvosDoAtaque(E, ctx){
    const lista = alvosNaRua(E, ctx);
    if(lista.length) return lista;
    return soAliados(E, ctx) ? ruaCrua(E, ctx) : [];
  }
  /* trair aliado saiu do jogo (decisão do autor): quando todas as
     torcidas da rua são aliadas, a única intenção possível é a paz */
  function intencoes(E){
    return [
      {id:'paz', rot:'Ir em paz', nota:'entrar pelo portão, bandeira e bateria'},
      {id:'atacar', rot:'Atacar', nota:'procurar a torcida rival antes da bola rolar'}
    ];
  }

  /* =======================================================
     OS OUTROS JOGOS DA CIDADE
     Time de fora jogando aqui é torcida de fora andando pela
     nossa praça. Dá pra deixar passar ou cair em cima.
     ======================================================= */
  function outrosJogosNaCidade(E, semana){
    if(!E.temporada) return [];
    const nossa = E.torcida.mapa, meu = E.torcida.clubeId;
    const fora = [];
    for(const comp of E.temporada.competicoes){
      for(const etapa of [...comp.rodadas, ...comp.mata]){
        if(etapa.semana !== semana) continue;
        for(const j of etapa.jogos){
          if(!j.f) continue;
          if(j.c === meu || j.f === meu) continue;
          const casa = M().time(j.c), vis = M().time(j.f);
          if(!casa || !vis || casa.mapa !== nossa) continue;
          const visitantes = M().torcidasDe(vis.id).map(o=>{
            const v = (E.relacoes||{})[o.id];
            return {id:o.id, torcida:o, relacao: v===undefined ? 0 : v,
                    aliada: v !== undefined && v >= 20};
          });
          if(!visitantes.length) continue;
          fora.push({chave:`${comp.id}|${etapa.semana}|${j.c}|${j.f}`,
                     casa, vis, comp:comp.nome, dia:j.d || etapa.dia || 6,
                     visitantes});
        }
      }
    }
    return fora;
  }

  /* Pra onde cada bonde vai: direto pro estádio ou parar num ponto pra
     brigar. É o que transforma "dividir por zona" em decisão de fato —
     dois atacam, um entra com a bateria. */
  function destinos(E){
    const p = plano(E), d = divisao(E, p.bondes);
    const pts = pontosDeAtaque(E);
    return d.zonas.map((zona, i)=>{
      const esc = p.destinos[i] ||
        (i===0 && p.intencao==='atacar' ? p.alvo : 'estadio');
      return {i, zona, gente:d.porBonde, destino:esc,
              ponto: esc==='estadio' ? null : pts.find(x=>x.id===esc)};
    });
  }
  const opcoesDeDestino = E =>
    [{id:'estadio', nome:'Direto pro estádio', nota:'entra pelo portão, sem parar'}]
      .concat(pontosDeAtaque(E).map(x=>({id:x.id,
        nome:`Atacar — ${x.nome}`, nota:`${x.bairro} · risco ${x.risco}/5`})));

  /* =======================================================
     ALIADOS NA NOSSA CIDADE
     Sai do calendário: jogo desta semana na nossa praça em que
     o visitante tem torcida aliada nossa.
     ======================================================= */
  /* QUANTA GENTE A CARAVANA TRAZ — uma conta só.
     Havia duas e elas não batiam: esta, que a Gestão mostra ao jogador
     antes do jogo, e `efetivoDe × 0,25` dentro de ruas.js, que era a que
     desenhava o bonde no mapa. A escolta somava sobre um número e o mapa
     mostrava outro. Fica esta, que é a que o jogador viu quando decidiu
     como receber. Quanto mais próxima a relação, mais gente eles mandam;
     sem relação registrada vale o piso, porque a caravana existe mesmo
     quando não somos nada deles. */
  const RELACAO_ALIADO = 20;
  function caravanaDe(torcida, relacao, E){
    /* A MESMA RÉGUA DO JOGADOR (ordem do dono, 31/08/2026): a caravana
       da IA sai da MESMA conta da nossa — vontade = 0,72 − 0,09 por
       trecho + 0,4 × moral − 0,15 × risco — com a viagem média de 2
       trechos que a estrada delas já assume no custo, e risco zero
       porque elas não traçam rota. Caíram os 18%, o "cresce com a
       relação" e o "ônibus enche 30%": a nossa caravana não tem nada
       disso — ônibus só barateia. `relacao` ficou na assinatura por
       compatibilidade, mas não manda mais em nada. A base segue
       `disponiveisIA` (de pé, sem ferido nem preso). */
    const vivos = E && TO.relacoes && TO.relacoes.disponiveisIA
      ? TO.relacoes.disponiveisIA(E, torcida.id) : (torcida.membros||20);
    if(vivos <= 0) return 0;
    const t = E && E.mundoTorcidas && E.mundoTorcidas[torcida.id];
    const moral = (t && t.moral != null ? t.moral : 12) / 20;
    const vontade = U.limitar(0.72 - 2*0.09 + moral*0.4, 0.08, 0.95);
    /* O REDUTOR DO VISITANTE (calibragem do dono, 31/08/2026): a
       caravana da IA sai da régua do jogador com uns 40% a menos —
       na régua cheia a estrada lotava demais pro gosto do dono. */
    return Math.min(vivos, Math.max(MINIMO,
      Math.round(vivos * vontade * 0.6)));
  }

  /* A ESTRADA COBRA DAS IAs TAMBÉM (assimetria fechada pelo dono,
     27/08/2026): mesma régua do jogador — por cabeça, a torcida paga
     40% (o rateio dos embarcados cobre os outros 60%) e a frota abate
     30% por ônibus até zerar com três. Sem rota traçada pra elas, a
     viagem média vale 2 trechos. */
  function custoCaravanaIA(n, frota){
    const porCabeca = CABECA_BASE + CABECA_TRECHO * 2;
    const desconto = TO.financeiro.DESCONTO_ONIBUS[
      Math.min(3, frota || 0)] || 0;
    return Math.round(porCabeca * n * (1 - RATEIO) * (1 - desconto));
  }

  /* =======================================================
     A CARAVANA SILENCIOSA DA SUBSEDE (ordem do dono, 31/08/2026)
     Em todo jogo nosso — em casa e fora — o núcleo da filial
     tenta se deslocar pra praça da partida. Nada de feed, nada
     de itinerário: a rota é SEMPRE a mais curta, e o custo segue
     o padrão da caravana normal — por cabeça e por trecho, 40%
     pra torcida, frota abatendo 30% por ônibus. Vale pra nossa
     torcida e pras IAs.
     ======================================================= */
  function saltosEntre(E, origem, destino){
    if(!origem || !destino || origem === destino) return 0;
    const c = caminho(E, origem, destino, false);
    return c ? c.saltos : 4;      // sem estrada ligando: vale viagem longa
  }
  function custoCaravanaFilial(n, saltos, frota){
    if(!n) return 0;
    const porCabeca = CABECA_BASE + CABECA_TRECHO * Math.max(1, saltos || 0);
    const desconto = TO.financeiro.DESCONTO_ONIBUS[
      Math.min(3, frota || 0)] || 0;
    return Math.round(porCabeca * n * (1 - RATEIO) * (1 - desconto));
  }
  /* quem embarca do núcleo: a mesma vontade da caravana da sede,
     com os trechos REAIS da rota mais curta */
  function caravanaDaFilial(E, f, destino){
    if(!f || f.cidade === destino) return {n:0, membros:[], saltos:0};
    const aptos = TO.membros.aptosDaFilial(E, f.cidade);
    if(aptos.length < 2) return {n:0, membros:[], saltos:0};
    const saltos = saltosEntre(E, f.cidade, destino);
    const moral = E.indicadores.moral/20;
    const vontade = U.limitar(0.72 - saltos*0.09 + moral*0.4, 0.08, 0.95);
    const n = Math.min(aptos.length,
                       Math.max(2, Math.round(aptos.length * vontade)));
    const membros = aptos.slice()
      .sort((a,b)=>(b.forca+b.defesa)-(a.forca+a.defesa)).slice(0, n);
    return {n, membros, saltos};
  }

  function aliadosNaCidade(E, semana){
    if(!E.temporada) return [];
    const nossa = E.torcida.mapa;
    const fora = [];
    for(const comp of E.temporada.competicoes){
      for(const etapa of [...comp.rodadas, ...comp.mata]){
        if(etapa.semana !== semana) continue;
        for(const j of etapa.jogos){
          if(!j.f) continue;
          const casa = M().time(j.c), vis = M().time(j.f);
          if(!casa || !vis || casa.mapa !== nossa || vis.mapa === nossa) continue;
          for(const o of M().torcidasDe(vis.id)){
            const v = (E.relacoes||{})[o.id];
            if(v === undefined || v < RELACAO_ALIADO) continue;   // só aliado de fato
            fora.push({id:o.id, torcida:o, clube:vis, adversario:casa,
                       relacao:v, dia:j.d || etapa.dia || 6, comp:comp.nome,
                       estimativa:caravanaDe(o, v, E)});
          }
        }
      }
    }
    return fora;
  }

  /* GDD §11.1: acolher bem é o jeito mais barato de subir relação */
  /* os números saem da tabela da relação (TO.relacoes.REL) */
  const RECEPCAO = [
    {id:'nada',      rot:'Não receber',        porCabeca:0,
     get relacao(){ return -TO.relacoes.REL.naoReceber; },
     nota:'cada um se vira; o aliado registra e cobra depois'},
    {id:'hospedar',  rot:'Hospedar na sede',   porCabeca:25,
     get relacao(){ return TO.relacoes.REL.hospedar; },
     nota:'colchão no salão e café de manhã'},
    {id:'escolta',   rot:'Hospedar e escoltar', porCabeca:50,
     get relacao(){ return TO.relacoes.REL.hospedarEscolta; },
     nota:'bonde junto com o deles até o portão'},
    {id:'churrasco', rot:'Churrasco e escolta', porCabeca:75,
     get relacao(){ return TO.relacoes.REL.churrasco; },
     nota:'recepção de irmandade: carne, bebida e caminhada junto'}
  ];
  const recepcaoDe = id => RECEPCAO.find(r=>r.id===id) || RECEPCAO[0];

  /* nível padrão de recepção: quem não quer decidir toda semana escolhe
     uma vez e o aliado é recebido assim sempre */
  const recepcaoPadrao = E => E.padraoRecepcao || null;
  function definirRecepcaoPadrao(E, id){
    if(id) E.padraoRecepcao = id; else delete E.padraoRecepcao;
    return E.padraoRecepcao || null;
  }
  /* o que vale pra este aliado agora: escolha da semana ou o padrão */
  const nivelDe = (E, idAliado) =>
    (plano(E).recepcao[idAliado]) || recepcaoPadrao(E) || 'nada';
  const custoRecepcao = (nivel, gente) => recepcaoDe(nivel).porCabeca * gente;

  /* a escolha do bloco de recepção da mensagem do olheiro (dono,
     28/08/2026): fica anotada no plano e só vira dinheiro no dia do
     jogo do aliado */
  function definirRecepcao(E, idAliado, nivel){
    plano(E).recepcao[idAliado] = nivel;
    return nivel;
  }

  /* A COBRANÇA DO DIA (correção do dono, 28/08/2026): a recepção era
     paga só quando o jogador CONFIRMAVA a tela de planejamento — quem
     decidia pelo padrão ou pela mensagem nunca via a despesa cair. A
     conta agora vira no DIA DO JOGO do aliado: paga o combinado, move
     a relação da tabela (não receber cobra a dela também) e carimba
     como pago. Sem caixa pro combinado, vira 'nada' — e a mensagem de
     consequência é o extrato. */
  function cobrarRecepcoes(E){
    const p = plano(E);
    for(const a of aliadosNaCidade(E, E.data.semana)){
      if(a.dia !== E.data.dia) continue;
      if((p.pago||{})[a.id]) continue;
      let nivel = nivelDe(E, a.id);
      let custo = custoRecepcao(nivel, a.estimativa);
      if(custo > E.dinheiro){ nivel = 'nada'; custo = 0; }
      if(custo > 0)
        TO.estado.lancar(E, `Recepção da ${a.torcida.nome} `+
                            `(${a.estimativa} cabeças)`, -custo);
      const relRec = recepcaoDe(nivel).relacao;
      E.relacoes[a.id] = U.limitar((E.relacoes[a.id]||0)
        + (relRec > 0
            ? TO.relacoes.ganhoRepetido(E, E.torcida.id, a.id, 'caravana', relRec)
            : relRec), -100, 100);
      if(nivel !== 'nada') TO.relacoes.marcarAjuda(E, a.id);
      p.pago = p.pago || {}; p.pago[a.id] = true;
      /* o aliado agradece — ou anota (mensagens entre torcidas, 08/09/2026) */
      if(TO.feed && TO.feed.mensagemDe){
        const TXT = {
          hospedar: 'Obrigado pela casa, irmão. Colchão no salão e café de manhã: ninguém recebe assim. Vocês têm crédito com a gente.',
          escolta:  'Andar até o portão com o bonde de vocês do lado foi outra coisa. Fica registrado: o que precisar, é só chamar.',
          churrasco:'Que recepção. Carne, bebida e o bonde junto — isso é irmandade. Quando vierem, a casa é de vocês.',
          nada:     'Passamos pela cidade de vocês e ninguém apareceu. Anotado.'
        };
        TO.feed.mensagemDe(E, a.id, TXT[nivel] || TXT.nada,
                           nivel === 'nada' ? 'cobranca' : 'agradecimento');
      }
    }
  }

  /* =======================================================
     ESTRADA (rodovias das 30 praças)
     Duas praças ligadas pela mesma rodovia são vizinhas. O
     resto é caminho mínimo. Belém e Manaus ficam fora da malha
     — de lá só se chega de avião, e é isso que a conta diz.
     ======================================================= */
  let _grafo = null;
  function grafo(){
    if(_grafo) return _grafo;
    _grafo = new Map();
    const liga = (a,b,rod)=>{
      if(!_grafo.has(a)) _grafo.set(a, new Map());
      if(!_grafo.get(a).has(b)) _grafo.get(a).set(b, rod);
    };
    /* A MALHA DO DONO (24/08/2026, dados/malha.js): o grafo nasce da
       planta fechada no Mapa das Praças — 94 praças, 45 rodovias,
       travessias de fronteira incluídas. Vizinho é a PRÓXIMA praça do
       corredor, não qualquer uma da mesma rodovia: é isso que faz cada
       parada da rota ser uma praça de verdade, com emboscada possível.
       De quebra, o continente inteiro ficou alcançável por terra. */
    if(TO.dados.malha){
      for(const r of TO.dados.malha)
        for(const seg of r.seg)
          for(let k=0;k<seg.length-1;k++){
            liga(seg[k], seg[k+1], r.nome);
            liga(seg[k+1], seg[k], r.nome);
          }
      return _grafo;
    }
    /* sem a planta (save de teste antigo): a régua velha, por rodovia */
    const porRodovia = new Map();
    for(const c of M().todasCidades)
      for(const r of (c.rodovias||[])){
        if(!porRodovia.has(r)) porRodovia.set(r, []);
        porRodovia.get(r).push(c.id);
      }
    for(const [rod, lista] of porRodovia)
      for(const a of lista) for(const b of lista) if(a!==b) liga(a,b,rod);
    return _grafo;
  }

  /* praça hostil: tem torcida com quem estamos em guerra */
  function hostilidade(E, idCidade){
    let pior = 0;
    for(const o of M().torcidasEm(idCidade)){
      const v = (E.relacoes||{})[o.id];
      if(v !== undefined && v < 0) pior = Math.max(pior, -v);
    }
    return pior;      // 0 a 100
  }

  /* O TRECHO PESA O QUE MEDE (regra do dono, 24/08/2026): a rota
     curta é a de menor QUILOMETRAGEM, fiel ao "traçar rota" do Mapa
     das Praças. Pesar 1 por salto empatava Fortaleza→Rio entre o
     sertão e o cerrado (6 trechos dos dois jeitos) e o desempate era
     ordem de inserção — a linha do Vasco saía por Brasília. O km vem
     das posições da malha (haversine sobre malhaXY); praça sem
     coordenada cai no peso antigo de 400 km por salto. */
  function kmEntre(a, b){
    const XY = TO.dados.malhaXY || {};
    const pa = XY[a], pb = XY[b];
    if(!pa || !pb) return 400;
    const la1 = 13 - pa[1]/20, lo1 = pa[0]/20 - 82;
    const la2 = 13 - pb[1]/20, lo2 = pb[0]/20 - 82;
    const r = Math.PI/180, R = 6371;
    const h = Math.sin((la2-la1)*r/2)**2 +
      Math.cos(la1*r)*Math.cos(la2*r)*Math.sin((lo2-lo1)*r/2)**2;
    return 2*R*Math.asin(Math.sqrt(h));
  }

  function caminho(E, origem, destino, evitarRival){
    if(origem === destino) return {cidades:[origem], rodovias:[], saltos:0, risco:0};
    const g = grafo();
    const dist = new Map([[origem, 0]]);
    const anterior = new Map();
    const fila = [origem];
    /* Dijkstra simples: 94 nós não pedem heap */
    const visto = new Set();
    while(fila.length){
      fila.sort((a,b)=>(dist.get(a)||1e9)-(dist.get(b)||1e9));
      const n = fila.shift();
      if(visto.has(n)) continue;
      visto.add(n);
      if(n === destino) break;
      for(const [viz, rod] of (g.get(n) || new Map())){
        /* a régua do desvio acompanha a do peso: antes o risco valia
           até 4 saltos; agora vale até o km de uns 4 trechos médios */
        const extra = evitarRival ? hostilidade(E, viz)*16 : 0;
        const d = (dist.get(n)||0) + kmEntre(n, viz) + extra;
        if(d < (dist.get(viz) ?? 1e9)){
          dist.set(viz, d); anterior.set(viz, [n, rod]);
          if(!visto.has(viz)) fila.push(viz);
        }
      }
    }
    if(!anterior.has(destino) && origem !== destino) return null;
    const cidades = [destino], rodovias = [];
    let n = destino;
    while(anterior.has(n)){
      const [p, rod] = anterior.get(n);
      rodovias.unshift(rod); cidades.unshift(p); n = p;
    }
    const risco = cidades.slice(1,-1).reduce((s,c)=>s+hostilidade(E,c), 0);
    return {cidades, rodovias:[...new Set(rodovias)], saltos:cidades.length-1, risco};
  }

  const CUSTO_BASE = 1200, CUSTO_SALTO = 900, CUSTO_AR = 5200;

  /* A ROTA É DO JOGO QUE SE PEDE (correção do dono, 23/08/2026).

     Isto lia `E.proximoJogo` e mais nada, e `proximoJogo` é o jogo da
     SEMANA — o que pesa mais. Numa semana com dois jogos nossos, a
     linha do dia de UM deles vinha com a estrada do OUTRO: com a TUF
     jogando em Campinas, a volta saía por Porto Alegre, que era o
     destino do jogo seguinte. O itinerário já sabia perguntar qual é o
     jogo de hoje; era a rota que continuava respondendo pelo da semana.

     Agora o jogo entra por parâmetro. Sem parâmetro, `proximoJogo`
     continua sendo o padrão, que é o que a tela de planejamento usa. */
  function rotas(E, jogo){
    const j = jogo || E.proximoJogo;
    if(!j || j.casa || !j.mapaAdv || j.mapaAdv === E.torcida.mapa) return [];
    const origem = E.torcida.mapa, destino = j.mapaAdv;

    const curta  = caminho(E, origem, destino, false);
    const segura = caminho(E, origem, destino, true);
    if(!curta) return [{
      id:'ar', nome:'De avião', rodovias:[], cidades:[origem, destino], saltos:1,
      custo:CUSTO_AR, risco:0,
      nota:'não há estrada ligando as duas praças; só voando'
    }];

    const monta = (r, id, nome, nota)=>({
      id, nome, cidades:r.cidades, rodovias:r.rodovias, saltos:r.saltos,
      custo: CUSTO_BASE + CUSTO_SALTO*r.saltos + (id==='segura' ? 600 : 0),
      risco: r.risco, nota
    });
    const fora = [monta(curta, 'curta', 'Rota mais curta',
      `${curta.saltos} ${curta.saltos===1?'trecho':'trechos'} por ` +
      `${curta.rodovias.join(' e ') || 'estrada vicinal'}`)];
    const igual = segura && segura.cidades.join() === curta.cidades.join();
    if(segura && !igual)
      fora.push(monta(segura, 'segura', 'Rota que desvia dos rivais',
        `${segura.saltos} trechos por ${segura.rodovias.join(' e ')}, ` +
        'fugindo do território de quem nos odeia'));
    /* VIAGEM DE OUTRO CONTINENTE DE DISTÂNCIA (malha do dono,
       24/08/2026): com as travessias, Santiago fica a 15 trechos de
       estrada — dá pra ir, e cada praça é uma emboscada possível. Mas
       caravana longa assim merece a alternativa: a partir de 5 trechos
       o avião entra como opção, com o custo de sempre. */
    if(curta.saltos >= 5)
      fora.push({id:'ar', nome:'De avião', rodovias:[],
        cidades:[origem, destino], saltos:1, custo:CUSTO_AR, risco:0,
        nota:`${curta.saltos} trechos de estrada é caravana de dias — `+
             'voando não tem emboscada, mas custa caro'});
    return fora;
  }

  const rotaEscolhida = (E, jogo) =>{
    const p = plano(E), lista = rotas(E, jogo);
    if(!lista.length) return null;
    return lista.find(r=>r.id === p.rota) || lista[0];
  };

  /* GDD §6.1: quanto mais alta a moral, mais gente topa a estrada */
  const CABECA_BASE = 18, CABECA_TRECHO = 12, CABECA_AR = 95, MINIMO = 5;
  /* quem viaja paga a maior parte da própria passagem; a organizada
     banca o resto — ônibus fretado, pedágio e o que sobra */
  const RATEIO = 0.6;

  /* Passagem, pedágio e comida de estrada: cobra por cabeça e por
     trecho. Setenta pessoas e dois trechos dão os R$ 3.000 do GDD §7.3,
     e levar menos gente pra economizar vira decisão legítima. */
  function estimativaCaravana(E){
    const r = rotaEscolhida(E);
    if(!r) return null;
    const aptos = TO.membros.aptosParaOEstadio(E);
    const moral = E.indicadores.moral/20;
    const vontade = U.limitar(0.72 - r.saltos*0.09 + moral*0.4
                              - (r.risco/100)*0.15, 0.08, 0.95);
    const interessados = Math.max(MINIMO, Math.round(aptos.length * vontade));
    const escolhido = (E.plano||{}).caravana;
    const vao = U.limitar(escolhido == null ? interessados : escolhido,
                          MINIMO, interessados);
    const porCabeca = r.id === 'ar' ? CABECA_AR
                    : CABECA_BASE + CABECA_TRECHO * r.saltos;
    const bruto = porCabeca*vao;
    /* A FROTA ABATE A ESTRADA (régua do dono, 20/08/2026): um ônibus
       tira 30% do que a torcida paga, dois tiram 60%, três deixam a
       caravana sem custo nenhum — e aí o rateio de quem embarca vira
       receita, como já era com o ônibus único. Quem embarca sempre
       paga o rateio; o que a frota abate é a parte da TORCIDA. Avião
       continua pago do jeito de sempre: ônibus não voa. */
    const rateio = Math.round(bruto*RATEIO);
    const daTorcida = bruto*(1-RATEIO);
    const frota = r.id === 'ar' ? 0 : TO.financeiro.onibusDe(E);
    const desconto = r.id === 'ar' ? 0 : TO.financeiro.descontoCaravana(E);
    return {aptos:aptos.length, interessados, vao, vontade, rota:r, porCabeca,
            bruto, rateio, minimo:MINIMO,
            custo: Math.round(daTorcida*(1-desconto)),
            cheio: Math.round(daTorcida),
            onibus: frota, desconto};
  }

  /* =======================================================
     A SEQUÊNCIA DE DECISÕES
     A tela não mostra tudo de uma vez: cada escolha abre a
     próxima. Ir em paz encerra em dois passos; atacar abre o
     alvo, o modo, o mapa do olheiro e as bombas.
     ======================================================= */
  function definirIntencao(E, id){
    const p = plano(E);
    p.intencao = id;
    if(id === 'paz'){ p.alvoTorcida = null; p.olheiro = null; p.bombas = 0; }
    p.alvo = alvoDe(p);
    p.decidido = false;
    return p;
  }
  function definirComo(E, id){
    const p = plano(E);
    p.como = id;
    if(id !== 'ida') p.olheiro = null;
    p.alvo = alvoDe(p);
    p.decidido = false;
    return p;
  }
  function definirOlheiro(E, id){
    const p = plano(E);
    p.olheiro = id; p.como = 'ida'; p.alvo = alvoDe(p);
    p.decidido = false;
    return p;
  }
  /* o alvo real é consequência: arredores ou o ponto do olheiro */
  const alvoDe = p => p.intencao === 'paz' ? null
                    : p.como === 'ida' ? (p.olheiro || null) : 'arredores';

  /* os passos que a tela desenha, na ordem, e se já foram resolvidos */
  function passos(E){
    const p = plano(E), j = E.proximoJogo, fora = [];
    const põe = (id, rot, feito, resumo) => fora.push({id, rot, feito, resumo});
    if(!j) return fora;

    const briga = p.intencao !== 'paz';
    põe('intencao', 'Intenção do dia de jogo', true,
        p.intencao === 'paz' ? 'Ir em paz'
        : p.intencao === 'trair' ? 'Trair aliado' : 'Atacar');

    if(briga){
      const alvo = M().torcida(p.alvoTorcida);
      põe('alvo', 'Contra quem', !!p.alvoTorcida,
          alvo ? alvo.nome : 'ninguém escolhido');
      if(p.alvoTorcida){
        põe('como', 'Como atacar', !!p.como,
            (COMO.find(c=>c.id===p.como)||{}).rot || '—');
        if(p.como === 'ida')
          põe('olheiro', 'Olheiro no mapa', !!p.olheiro,
              p.olheiro ? ponto(p.olheiro).nome : 'sem posição definida');
        põe('bombas', 'Bombas', true,
            p.bombas ? `${p.bombas} do estoque` : 'só na pedra');
      }
    }
    const al = aliadosNaCidade(E, E.data.semana);
    if(al.length){
      const decididos = al.filter(a=>plano(E).recepcao[a.id] || recepcaoPadrao(E)).length;
      põe('aliados', 'Aliados na cidade', decididos === al.length,
          `${al.length} ${al.length===1?'torcida':'torcidas'} · ${decididos} resolvidas`);
    }
    const ou = outrosJogosNaCidade(E, E.data.semana);
    if(ou.length){
      const n = Object.values(p.investidas||{}).filter(Boolean).length;
      põe('outros', 'Outros jogos na cidade', true,
          n ? `${n} ${n===1?'investida':'investidas'}` : `${ou.length} sem investida`);
    }
    return fora;
  }
  /* dá pra fechar? o que falta é o que trava o botão */
  function falta(E){
    return passos(E).filter(x=>!x.feito).map(x=>x.rot);
  }

  /* ---------- investidas nos outros jogos da praça ---------- */
  /* o valor é objeto: alvo, como (arredores ou ida) e o ponto do olheiro */
  function investidaDe(E, chave){
    const v = (plano(E).investidas || {})[chave];
    if(!v) return null;
    /* save antigo guardava só o id da torcida */
    return typeof v === 'string' ? {alvo:v, como:'arredores', olheiro:null} : v;
  }
  function definirInvestida(E, chave, campos){
    const p = plano(E);
    if(campos === null){ delete p.investidas[chave]; p.decidido = false; return null; }
    const atual = investidaDe(E, chave) || {alvo:null, como:'arredores', olheiro:null};
    const novo = Object.assign(atual, campos);
    if(novo.como !== 'ida') novo.olheiro = null;
    p.investidas[chave] = novo;
    p.decidido = false;
    return novo;
  }

  /* =======================================================
     COMPROMISSOS — a ponte com o Financeiro
     Toda decisão da Gestão que mexe no caixa aparece aqui, com
     o valor e se já foi paga. O Financeiro lê esta lista pra
     mostrar o que a semana ainda deve; o fechamento NÃO relança
     nada daqui — quem cobra é cobrarCaravana e confirmar(), e
     cobrar duas vezes seria roubo do próprio jogador.
     ======================================================= */
  function compromissos(E){
    const p = plano(E), fora = [];
    const põe = (id, rot, v, pago, nota, tipo) =>
      fora.push({id, rot, v:Math.round(v||0), pago:!!pago, nota:nota||'',
                 tipo:tipo||'dinheiro'});

    /* 1. a estrada */
    if(TO.financeiro.temCaravana(E) && E.proximoJogo){
      const j = E.proximoJogo, est = estimativaCaravana(E);
      const pago = !!((E.caravanasPagas||{})[j.chave]);
      põe('caravana', `Caravana para ${j.cidadeAdv || 'fora'}`,
          est ? est.custo : TO.financeiro.CARAVANA, pago,
          est ? (est.custo <= 0 && est.onibus
                  ? `${est.vao} pessoas na frota da torcida — o rateio de `+
                    `${U.dinheiro(est.rateio)} entra como receita`
                  : est.onibus
                  ? `${est.vao} pessoas por ${est.rota.nome} · `+
                    `${est.onibus} ${est.onibus===1?'ônibus abate':'ônibus abatem'} `+
                    `${Math.round(est.desconto*100)}% de `+
                    `${U.dinheiro(est.cheio)}`
                  : `${est.vao} pessoas por ${est.rota.nome} · `+
                    `${U.dinheiro(est.rateio)} sai do rateio dos que vão`)
              : 'rota ainda não escolhida — vale o valor cheio do GDD');
    }

    /* 2. os aliados que jogam na nossa praça */
    for(const a of aliadosNaCidade(E, E.data.semana)){
      const nivel = nivelDe(E, a.id), r = recepcaoDe(nivel);
      const rel = (r.relacao>0?'+':'') + r.relacao;
      põe('rec-'+a.id, `Recepção da ${a.torcida.nome}`,
          custoRecepcao(nivel, a.estimativa), (p.pago||{})[a.id],
          `${r.rot} · ~${a.estimativa} aliados · relação ${rel}`,
          nivel==='nada' ? 'aviso' : 'dinheiro');
    }

    /* 3. as investidas nos outros jogos da cidade: custam ação, não caixa */
    for(const chave of Object.keys(p.investidas || {})){
      const inv = investidaDe(E, chave);
      if(!inv || !inv.alvo) continue;
      const t = M().torcida(inv.alvo);
      põe('inv-'+chave, `Investida contra ${t ? t.nome : inv.alvo}`, 0,
          (p.pago||{})['inv-'+chave],
          `${inv.como==='ida' ? 'na ida ao estádio, em '+ponto(inv.olheiro).nome
                              : 'nos arredores do estádio'} · custa 1 ação`, 'acao');
    }

    const soma = f => fora.filter(f).reduce((s,x)=>s+x.v, 0);
    return {itens:fora,
            total:   soma(()=>true),
            pago:    soma(x=>x.pago),
            pendente:soma(x=>!x.pago)};
  }

  /* =======================================================
     PENDÊNCIAS — o que a tela de Início cobra do jogador
     ======================================================= */
  function pendencias(E){
    const fora = [];
    const põe = (id, texto, detalhe, pagina, tipo) =>
      fora.push({id, texto, detalhe, pagina, tipo:tipo||''});

    const sobra = TO.acoes.restantes(E);
    if(sobra) põe('acoes', `${sobra} ${sobra===1?'ação disponível':'ações disponíveis'}`,
      'a semana fecha e o que não for usado se perde', 'inicio');

    const j = E.proximoJogo;
    if(j){
      const p = plano(E);
      if(TO.financeiro.temCaravana(E) && !p.rota)
        põe('rota', 'Escolher a estrada da caravana',
            `${j.cidadeAdv}, ${E.data.dia<=(j.dia||6)?'ainda dá tempo':'em cima da hora'}`,
            'gestao', 'urgente');
      if(!p.decidido)
        põe('plano', 'Fechar o plano do dia de jogo',
            `${p.intencao==='atacar' ? 'ataque em '+ponto(p.alvo).nome : 'ir em paz'} · `+
            `${p.bondes===1?'bonde único':p.bondes+' bondes'}`, 'gestao');
    }

    for(const a of aliadosNaCidade(E, E.data.semana)){
      if(plano(E).recepcao[a.id]) continue;
      põe('aliado-'+a.id, `${a.torcida.nome} chega na cidade`,
          `~${a.estimativa} aliados, jogo do ${a.clube.nome} aqui`, 'gestao', 'aliado');
    }

    /* O QUE ACONTECEU SEM O JOGADOR MANDAR.
       Esbarrão na rua e assalto tiram gente de circulação numa terça
       qualquer. O ticker avisa na hora, mas ticker passa — e abrir a
       lista da torcida e achar três feridos sem explicação é o tipo de
       coisa que faz o jogador achar que o jogo quebrou. Aqui a baixa
       fica visível por três dias, com o motivo escrito. */
    const hoje = (E.data.ano*40 + E.data.semana)*7 + E.data.dia;
    for(const b of (E.baixasDeRua || []))
      if(hoje - b.quando <= 3)
        põe('baixa-'+b.quando+'-'+b.nome, `${b.nome} fora de combate`,
            b.txt, 'torcida', b.tipo === 'boa' ? '' : 'urgente');

    const presos = E.membros.filter(m=>m.preso).length;
    if(presos) põe('presos', `${presos} ${presos===1?'membro preso':'membros presos'}`,
      'a fiança sai pela ficha do membro', 'torcida', 'urgente');

    const promoveis = E.membros.filter(m=>TO.membros.podePromover(E,m).ok).length;
    if(promoveis) põe('promocao', `${promoveis} prontos pra promoção`,
      'subir de cargo custa dinheiro e rende atributo', 'torcida');

    /* o aviso de fila de treino vazia saiu: a diretoria sorteia e
       treina sozinha todo dia (decisão do dono, 17/08/2026) */
    if(E.dinheiro < 0) põe('caixa', 'Caixa no vermelho',
      'se durar, membro começa a sair', 'financeiro', 'urgente');

    return fora;
  }

  /* =======================================================
     O ATAQUE EM TRÊS PERGUNTAS

     "Atacar alguém" jogava o jogador na Gestão inteira, com todos os
     cartões, pra ele achar sozinho os três campos que a pergunta pedia.
     É o mesmo problema que a caravana teve (§8.23) e a solução é a
     mesma: uma tela com as três perguntas e mais nada.

     NENHUMA REGRA NOVA MORA AQUI. Alvo, local e bomba já são campos do
     plano; o que faltava era a porta que os põe juntos na hora em que a
     pergunta é feita. O que este bloco acrescenta é a LISTA — quem vai
     estar na rua naquele dia — e a tradução dos três lugares pros
     campos que `resolverIda` já lê.
     ======================================================= */
  const ONDE_ATAQUE = [
    {id:'praca', rot:'Na concentração', como:'ida', olheiro:'praca',
     nota:'a praça onde eles se juntam antes de subir pro estádio'},
    {id:'pista', rot:'Na pista', como:'ida', olheiro:'avenida',
     nota:'a avenida de acesso, com o bonde deles em movimento'},
    {id:'arredores', rot:'Nos arredores', como:'arredores', olheiro:null,
     nota:'a beira do estádio, com o cordão da PM em peso'}
  ];
  const ondeDoPlano = p => p.como === 'ida'
    ? (ONDE_ATAQUE.find(o=>o.olheiro === p.olheiro) || ONDE_ATAQUE[0]).id
    : 'arredores';

  /* O EFETIVO É ESTIMATIVA, como o do olheiro: a faixa é larga de
     propósito e é a mesma o dia inteiro, porque quem espia não muda de
     ideia porque a tela redesenhou. */
  function faixaDeEfetivo(E, n, chave){
    const r = baralhoFixo(`${chave}|${E.data.ano}|${E.data.semana}`);
    const erro = 0.25 + r()*0.25;
    return `${Math.max(5, Math.round(n*(1-erro)/5)*5)} a `+
           `${Math.round(n*(1+erro)/5)*5}`;
  }

  /* OS ALVOS DA VIAGEM: as torcidas do clube MANDANTE, que é quem vai
     estar na rua na cidade deles. Aliada não entra — bater em aliado é
     traição, e traição tem caminho próprio — nem torcida-irmã (§8.28).
     Mesma forma de `alvosNaRua`, pra a tela desenhar as duas igual. */
  function alvosDaViagem(E, ctx){
    const j = E.proximoJogo;
    /* o adversário vem do contexto quando a pergunta é de outra semana */
    const advId = (ctx && ctx.advId) || (j && !j.casa ? j.advId : null);
    if(!advId) return [];
    return M().torcidasDe(advId)
      .filter(o=>!o.incompleta && !M().saoIrmas(E.torcida.id, o.id))
      .map(o=>{
        const rel = (E.relacoes||{})[o.id];
        /* de pé, sem ferido nem preso (ordem do dono, 27/08/2026);
           em casa deles vai TODO o efetivo de pé, a régua do jogador
           (ordem do dono, 31/08/2026) */
        const vivos = TO.relacoes && TO.relacoes.disponiveisIA
          ? TO.relacoes.disponiveisIA(E, o.id) : (o.membros || 20);
        const n = Math.max(4, vivos);
        return {id:o.id, torcida:o, nome:o.nome, n,
                faixa: faixaDeEfetivo(E, n, o.id),
                relacao: rel === undefined ? M().valorInicial(
                  M().relacaoBase(E.torcida.id, o.id)) : rel,
                aliada: rel !== undefined && rel >= RELACAO_ALIADO};
      })
      /* `crua` é pra quem precisa saber se são TODAS aliadas — quem
         responde isso é a lista sem o filtro */
      .filter(a=>(ctx && ctx.crua) || !a.aliada)
      .filter(a => !(TO.relacoes.emTregua && TO.relacoes.emTregua(E, a.id)))
      .sort((a,b)=> a.relacao - b.relacao);
  }

  /* =======================================================
     QUEM ESTARÁ NA RUA — E DE QUAL EVENTO ESTAMOS FALANDO

     Isto lia `E.proximoJogo` e mais nada, e por isso devolvia lista
     vazia em três situações inteiras (§8.30):

     · SEMANA EM QUE O NOSSO CLUBE NÃO JOGA. `if(!j) return []` — mas a
       praça joga, a pergunta sai, e a lista é vazia por construção.
     · PERGUNTA SOBRE OUTRO DIA. Usava `j.dia`, o dia do NOSSO jogo, pra
       responder sobre o jogo da praça de quarta. Dia errado, lista
       errada ou vazia.
     · JOGO FORA. `naRuaEm` monta o dia com `jogosDaPraca`, que filtra
       pela NOSSA praça — o nosso jogo fora não está lá. E mesmo quando
       algum outro jogo daqui cai no mesmo dia, a lista é de gente desta
       cidade enquanto a gente está viajando.

     Agora a pergunta diz de que evento está falando, e a consulta
     responde sobre ELE. Sem contexto, vale o de hoje — que é o que os
     chamadores antigos esperam. */
  function alvosNaRua(E, ctx){
    if(!TO.praca) return [];
    ctx = ctx || {};
    /* viagem é rua DELES, e a lista pronta já existe */
    if(ctx.fora === true) return alvosDaViagem(E, ctx);
    const j = E.proximoJogo;
    const dia = ctx.dia != null ? ctx.dia : (j ? (j.dia || 6) : null);
    if(dia == null) return [];
    return TO.praca.naRuaEm(E, dia, ctx.semana)
      .filter(b => !b.nossa && !b.doJogador && !M().saoIrmas(E.torcida.id, b.id))
      .map(b=>{
        const rel = (E.relacoes||{})[b.id];
        return {id:b.id, torcida:b.torcida, nome:b.nome, n:b.n,
                faixa: faixaDeEfetivo(E, b.n, b.id),
                relacao: rel === undefined ? M().valorInicial(
                  M().relacaoBase(E.torcida.id, b.id)) : rel,
                aliada: rel !== undefined && rel >= RELACAO_ALIADO,
                deFora: !!b.deFora};
      })
      /* ALIADA NÃO É ALVO: bater em aliado é trair, e trair tem caminho
         próprio (`intencoes` oferece "Trair aliado" quando TODAS são
         aliadas). Torcida-irmã já saiu no filtro de cima. `crua` é a
         porta de quem PRECISA das aliadas — quem pergunta se são todas
         da casa, e a tela da traição. */
      .filter(a => ctx.crua || !a.aliada)
      /* trégua aceita: fora da lista até o fim do ano */
      .filter(a => !(TO.relacoes.emTregua && TO.relacoes.emTregua(E, a.id)))
      .sort((a,b)=> a.relacao - b.relacao);
  }

  /* QUANTOS VÃO ATACAR. O teto é quem sai de casa naquele dia e o piso
     é o mesmo da caravana — bonde de três não é bonde. Sem escolha, vai
     todo mundo, que é como era antes de existir o seletor. */
  function efetivoDoAtaque(E){
    const teto = Math.max(MINIMO, efetivoDaSaida(E));
    const p = plano(E);
    return {teto, piso: Math.min(MINIMO, teto),
            vao: U.limitar(p.efetivoAtaque != null ? p.efetivoAtaque : teto,
                           Math.min(MINIMO, teto), teto)};
  }

  /* a escolha do assistente chega ao plano da semana por aqui, e por
     `definirIntencao`, que é o único lugar que sabe da trela */
  function definirAtaque(E, esc){
    definirIntencao(E, 'atacar');
    const p = plano(E);
    if(esc.alvo) p.alvoTorcida = esc.alvo;
    const onde = ONDE_ATAQUE.find(o=>o.id === esc.onde) || ONDE_ATAQUE[2];
    p.como = onde.como;
    p.olheiro = onde.olheiro;
    p.alvo = alvoDe(p);
    if(esc.bombas != null)
      p.bombas = U.limitar(esc.bombas, 0, (E.estoque||{}).bombas || 0);
    if(esc.efetivo != null){
      const f = efetivoDoAtaque(E);
      p.efetivoAtaque = U.limitar(esc.efetivo, f.piso, f.teto);
    }
    p.decidido = false;
    return p;
  }

  /* =======================================================
     FECHAR O PLANO
     ======================================================= */
  function confirmar(E){
    const p = plano(E);
    p.decidido = true;
    /* A RECEPÇÃO NÃO É MAIS PAGA AQUI (correção do dono, 28/08/2026):
       a escolha fica no plano e `cobrarRecepcoes` vira a conta no DIA
       do jogo do aliado — pagar na confirmação deixava sem despesa
       quem decidia pelo padrão ou pela mensagem. */
    let gasto = 0;
    /* as investidas nos outros jogos da cidade gastam ação da semana */
    let usadas = 0;
    E.investidas = E.investidas || [];
    for(const chave of Object.keys(p.investidas || {})){
      const inv = investidaDe(E, chave);
      if(!inv || !inv.alvo || (p.pago||{})['inv-'+chave]) continue;
      /* a investida da subsede é do núcleo de lá: não gasta ação da
         semana nem entra na lista da praça — o bote do dia do jogo lê
         o plano direto (cartão da semana, dono, 10/09/2026) */
      if(inv.filial) continue;
      if(TO.acoes.restantes(E) <= 0) break;
      E.acoes.usadas = (E.acoes.usadas||0) + 1;
      p.pago = p.pago || {}; p.pago['inv-'+chave] = true;
      E.investidas.push({semana:E.data.semana, alvo:inv.alvo, chave,
                         como:inv.como, olheiro:inv.olheiro});
      usadas++;
    }
    return {ok:true, gasto, investidas:usadas};
  }

  /* =======================================================
     A IDEOLOGIA — quem, não quanto

     Ela se chamava "política" quando nasceu, e o nome mudou na virada do
     feed: é "Seguir ideologia" que o jogador aperta numa decisão de dia
     de jogo. As funções guardaram o nome antigo de propósito —
     `politicas`, `definirPolitica`, `POLITICA_ATAQUE` são chamadas de
     quatro arquivos e do save (`E.politicas`), e renomear identificador
     por causa de rótulo é a troca que quebra save alheio sem melhorar
     nada. O que o jogador lê diz ideologia; o que o código chama
     continua sendo o mesmo objeto.

     `E.padroes` guarda um RETRATO do plano: bombas, bondes, fração da
     caravana, formação. Ele não sabe dizer "atacar quem estiver quente",
     porque quem está quente muda toda semana. Política é a outra
     metade: ela decide QUEM — intenção, alvo, recepção do aliado,
     investida nos outros jogos —, e é reavaliada toda semana contra os
     adversários e as tensões daquela semana.

     Os dois convivem, e quando discordam GANHA A POLÍTICA: ela é a mais
     recente e a mais explícita, e é ela que roda depois do retrato ter
     montado o plano. Save que já tem `E.padroes` continua funcionando —
     a política nasce em 'nunca', que é não mexer em nada.

     O 30 QUE NÃO É O 45. O resto do jogo usa 45 como corte de
     hostilidade: é de 45 pra cima que a rival vem pra cima da gente
     sozinha (`ataquesContraNos`) e que a rua trata o par como hostil. A
     política precisa de um corte MAIS BAIXO porque ela é intenção, não
     reação: 30 é "já tem clima ruim o bastante pra valer a pena", e
     ainda deixa a faixa 30–45 como a zona em que a gente ataca antes de
     apanhar. Dois números próximos com significados diferentes é
     confusão garantida, então este tem nome. */
  /* sem tensão no jogo, o corte da ideologia é a RELAÇÃO: −55 é onde a
     rivalidade já passou do declarado e virou guerra aberta */
  const RELACAO_QUENTE = -55;

  const POLITICA_ATAQUE = [
    {id:'nunca',   rot:'Nunca atacar',
     nota:'toda semana começa em paz; ataque só quando você marcar à mão — '+
          'sem briga não há ferido, preso nem prestígio em jogo'},
    {id:'rivais',  rot:'Sempre atacar rivais',
     nota:'a diretoria marca ataque sozinha sempre que houver torcida rival '+
          'no jogo — prestígio e baixas saem de cada briga'},
    {id:'quentes', rot:`Atacar rivais com relação abaixo de ${RELACAO_QUENTE}`,
     nota:`só marca ataque quando a relação está abaixo de ${RELACAO_QUENTE} — `+
          'os ódios de verdade; o resto do calendário fica em paz'},
    {id:'todos',   rot:'Sempre atacar todos',
     nota:'marca ataque contra qualquer torcida metida no jogo — máximo de '+
          'briga, de prestígio em disputa e de gente no hospital'}
  ];

  function politicas(E){
    E.politicas = E.politicas || {};
    if(E.politicas.jogo   === undefined) E.politicas.jogo   = 'nunca';
    if(E.politicas.outros === undefined) E.politicas.outros = 'nunca';
    return E.politicas;
  }
  function definirPolitica(E, qual, id){
    politicas(E)[qual] = id;
    return E.politicas[qual];
  }

  /* RIVAL É A RIVALIDADE DECLARADA DO GRAFO, não a tensão da semana.
     Se fosse tensão, "rivais" e "rivais com tensão acima de 30" seriam a
     mesma opção com nomes diferentes. */
  function ehRival(E, o){
    const base = M().relacaoBase(E.torcida.id, o.id || o);
    return base === 'Rival' || base === 'Maior Rival';
  }

  /* quem a política manda atacar, de uma lista de candidatos com
     `{id, torcida, relacao, aliada, tensao}` */
  function alvosDaPolitica(E, lista, id){
    if(id === 'nunca') return [];
    const livres = lista.filter(a=>!a.aliada);
    if(id === 'todos') return livres;
    const rivais = livres.filter(a=>ehRival(E, a.torcida));
    if(id === 'rivais') return rivais;
    if(id === 'quentes')
      return rivais.filter(a=>(a.relacao != null ? a.relacao
                              : TO.relacoes.nivel(E, a.id)) < RELACAO_QUENTE);
    return [];
  }

  /* QUAL DELES, quando sobra mais de um. O critério, escrito: primeiro a
     rivalidade declarada, porque é a briga que a torcida entende como
     dela; depois a tensão, porque é onde o clima já está pior e o ataque
     custa menos relação nova; e o efetivo desempata, porque bater no
     maior é o que rende prestígio. Ordem fixa, então a mesma semana
     decide igual toda vez. */
  /* o prestígio DELAS entra aqui: bater em torcida respeitada rende
     mais que bater em torcida que ninguém conhece, e é isso que faz o
     número existir do lado da IA em vez de ser float decorativo */
  const prestigioDe = (E, id) =>
    ((TO.relacoes && TO.relacoes.indicadoresDe(E, id)) || {}).prestigio || 0;

  function melhorAlvo(E, alvos){
    return alvos.slice().sort((a,b)=>
      (ehRival(E,b.torcida)?1:0) - (ehRival(E,a.torcida)?1:0) ||
      (a.relacao||0) - (b.relacao||0) ||
      prestigioDe(E, b.id) - prestigioDe(E, a.id) ||
      ((b.torcida||{}).membros||0) - ((a.torcida||{}).membros||0) ||
      (a.id < b.id ? -1 : 1))[0] || null;
  }

  /* A POLÍTICA FECHA O PLANO INTEIRO, ou não serve.
     Dizer "atacar" não fecha nada: `passos` ainda cobra contra quem,
     como, olheiro e bombas. Por isso o "como" padrão é `arredores` — o
     único que não pede olheiro. Bombas e formação são número e vêm do
     retrato; a política não mexe neles. */
  function aplicarPolitica(E){
    const pol = politicas(E), p = plano(E);
    const feito = {intencao:null, alvo:null, investidas:[], recepcao:recepcaoPadrao(E)};
    if(!E.proximoJogo) return feito;

    const cand = alvosDaPolitica(E, alvosDoJogo(E), pol.jogo);
    const alvo = melhorAlvo(E, cand);
    if(alvo){
      definirIntencao(E, 'atacar');
      p.alvoTorcida = alvo.id;
      definirComo(E, 'arredores');
      feito.intencao = p.intencao;
      feito.alvo = alvo.torcida.nome;
    } else if(pol.jogo !== 'nunca' || !p.alvoTorcida){
      /* política sem alvo é ir em paz, e isso apaga os passos de alvo,
         como, olheiro e bomba da fila */
      definirIntencao(E, 'paz');
      feito.intencao = 'paz';
    }

    for(const o of outrosJogosNaCidade(E, E.data.semana)){
      const esc = melhorAlvo(E, alvosDaPolitica(E, o.visitantes, pol.outros));
      if(esc){
        definirInvestida(E, o.chave, {alvo:esc.id, como:'arredores', olheiro:null});
        feito.investidas.push(esc.torcida.nome);
      }
    }
    return feito;
  }

  /* =======================================================
     A EMBOSCADA DA ROTA
     Qualquer rival cuja praça a rota atravessa pode fechar a
     pista (decisão do autor): saiu de Fortaleza pra João
     Pessoa passando pelo RN, a torcida rival de Natal pode
     estar esperando. Determinístico por semana: a mesma
     viagem reaberta dá a mesma estrada.
     ======================================================= */
  /* QUEM PODE FECHAR A PISTA NUMA PRAÇA
     A régua é a mesma da emboscada da rota: torcida daquela cidade,
     não-irmã, relação hostil, e grande o bastante pra encarar a
     caravana. Fica separado porque o itinerário pergunta praça por
     praça (régua do dono, 20/08/2026) e a emboscada antiga perguntava
     pela viagem inteira. */
  function hostisNaPraca(E, cidadeId, crew){
    const fora = [];
    for(const o of M().torcidasEm(cidadeId)){
      if(o.incompleta || o.id === E.torcida.id) continue;
      if(M().saoIrmas(E.torcida.id, o.id)) continue;
      const rel = TO.relacoes.nivel(E, o.id);
      if(rel > -15) continue;
      if(TO.relacoes.emTregua && TO.relacoes.emTregua(E, o.id)) continue;
      /* de pé, sem ferido nem preso (ordem do dono, 27/08/2026) */
      const viva = TO.relacoes.disponiveisIA(E, o.id);
      if(viva < crew * 0.7) continue;
      fora.push({id:o.id, torcida:o, relacao:rel});
    }
    return fora.sort((a,b)=>a.relacao-b.relacao || (a.id<b.id?-1:1));
  }

  /* A EMBOSCADA DAQUELA PRAÇA, na ida ou na volta.
     Determinístico por semana, cidade e perna: reabrir o dia dá a
     mesma estrada. Na VOLTA a chance é METADE da ida (régua do dono):
     a estrada de madrugada é mais calma, mas não é segura. */
  function emboscadaNaPraca(E, cidadeId, ida){
    const H = TO.mapa.hash;
    const est = estimativaCaravana(E);
    const crew = (est && est.vao) || 20;
    const lista = hostisNaPraca(E, cidadeId, crew);
    if(!lista.length) return null;
    const chave = `emb|${E.data.ano}|${E.data.semana}|${cidadeId}|${ida?'ida':'volta'}`;
    /* o maior rival da praça fecha a pista primeiro (dono, 08/09/2026):
       havendo um, três em quatro vezes é ele; senão, qualquer hostil */
    const maiores = lista.filter(x=>TO.relacoes.ehMaiorRival(E, E.torcida.id, x.id));
    const balde = (maiores.length && H(chave+'|mr') % 4) ? maiores : lista;
    const alvo = balde[H(chave+'|quem') % balde.length];
    /* e 40% a menos de chance em toda emboscada (FREIO_BRIGA) */
    let chance = U.limitar(8 + Math.max(0, -alvo.relacao - 15)*0.35, 0, 45)
                 * TO.relacoes.FREIO_BRIGA;
    if(!ida) chance = chance/2;
    /* praça com SUB-SEDE nossa é parada meio segura (dono, 26/08/2026):
       o núcleo local conhece as ruas e a chance cai pela metade */
    if(TO.patrimonio.temFilialEm && TO.patrimonio.temFilialEm(E, cidadeId))
      chance = chance/2;
    if((H(chave+'|dado') % 100) >= chance) return null;
    const cid = M().cidade(cidadeId);
    return {torcida:alvo.id, nome:alvo.torcida.nome,
            cidade: cid ? cid.nome : '', relacao:alvo.relacao,
            /* os dois cenários do dono pra estrada */
            cena: H(chave+'|cena') % 2 ? 'emb-posto' : 'emb-onibus'};
  }

  function emboscadaDaRota(E){
    const r = rotaEscolhida(E);
    if(!r || r.id === 'ar') return null;
    const H = TO.mapa.hash;
    const chave = `emb|${E.data.ano}|${E.data.semana}`;
    /* as praças do meio do caminho E a de destino: todo mundo que vê o
       ônibus passar */
    const cidades = r.cidades.slice(1);
    const candidatos = [];
    /* na estrada o nosso efetivo é quem embarcou: rival menor que a
       própria caravana não fecha pista (decisão do dono, 17/08/2026 —
       ataque sofrido de efetivo muito menor que o nosso não existe) */
    const est = estimativaCaravana(E);
    const crew = (est && est.vao) || 20;
    for(const c of cidades)
      for(const o of M().torcidasEm(c)){
        if(o.incompleta || o.id === E.torcida.id) continue;
        if(M().saoIrmas(E.torcida.id, o.id)) continue;
        const rel = TO.relacoes.nivel(E, o.id);
        if(rel > -15) continue;
        /* de pé, sem ferido nem preso (ordem do dono, 27/08/2026) */
        const viva = TO.relacoes.disponiveisIA(E, o.id);
        if(viva < crew * 0.7) continue;
        candidatos.push({id:o.id, torcida:o, cidade:c, relacao:rel});
      }
    if(!candidatos.length) return null;
    candidatos.sort((a,b)=>a.relacao-b.relacao || (a.id<b.id?-1:1));
    const alvo = candidatos[H(chave+'|quem') % candidatos.length];
    /* quanto pior a relação, maior a chance de fecharem a pista */
    let chance = U.limitar(8 + Math.max(0, -alvo.relacao - 15)*0.35, 0, 45)
                 * TO.relacoes.FREIO_BRIGA;
    /* trecho passando por praça com SUB-SEDE nossa: metade da chance
       (dono, 26/08/2026) — o núcleo local segura a barra da estrada */
    if(TO.patrimonio.temFilialEm && TO.patrimonio.temFilialEm(E, alvo.cidade))
      chance = chance/2;
    if((H(chave+'|dado') % 100) >= chance) return null;
    const cid = M().cidade(alvo.cidade);
    return {torcida:alvo.id, nome:alvo.torcida.nome,
            cidade: cid ? cid.nome : '', relacao:alvo.relacao};
  }

  return {plano, tipoDoJogo, salvarPadrao, temPadrao, esquecerPadrao,
          RELACAO_QUENTE, POLITICA_ATAQUE, politicas, definirPolitica,
          ehRival, alvosDaPolitica, aplicarPolitica,
          alvosDoJogo, soAliados, ruaCrua, intencoes, outrosJogosNaCidade,
          recepcaoPadrao, definirRecepcaoPadrao, nivelDe,
          definirRecepcao, cobrarRecepcoes,
          COMO, definirIntencao, definirComo, definirOlheiro, alvoDe,
          ONDE_ATAQUE, ondeDoPlano, alvosNaRua, alvosDaViagem, alvosDoAtaque,
          definirAtaque,
          efetivoDoAtaque, MINIMO_BONDE:MINIMO,
          faixaDeEfetivo,
          passos, falta, investidaDe, definirInvestida,
          relatorioDoOlheiro, leituraDoPonto, pontosDeIda,
          PONTOS, pontosDeAtaque, ponto, divisao, efetivoDaSaida,
          aliadosNaCidade, caravanaDe, custoCaravanaIA, RELACAO_ALIADO,
          aliadasNaPracaDeles, respostaDaAjuda, pedirAjuda, ajudaDe,
          saltosEntre, custoCaravanaFilial, caravanaDaFilial,
          RECEPCAO, recepcaoDe, custoRecepcao,
          emboscadaDaRota, emboscadaNaPraca, hostisNaPraca,
          grafo, caminho, rotas, rotaEscolhida, estimativaCaravana, hostilidade,
          compromissos, pendencias, confirmar, CUSTO_BASE, CUSTO_SALTO, CUSTO_AR};
})();
