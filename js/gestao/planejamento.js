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
        {intencao:'paz', alvo:'arredores', alvoTorcida:null, bombas:0,
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
      intencao:p.intencao, alvo:p.alvo, bombas:p.bombas, bondes:p.bondes,
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
    {id:'arredores', nome:'Arredores do estádio', risco:3, prestigio:4,
     nota:'cordão da PM em peso, mas é onde o rival inteiro está'},
    {id:'terminal',  nome:'Terminal rodoviário',  risco:4, prestigio:3,
     nota:'fechado: pega o bonde na descida, a PM chega rápido'},
    {id:'avenida',   nome:'Avenida de acesso',    risco:2, prestigio:3,
     nota:'larga, favorece a linha e a fuga'},
    {id:'praca',     nome:'Praça de encontro',    risco:2, prestigio:2,
     nota:'aberta, a briga espalha e pouca gente se pega'},
    {id:'bar',       nome:'Bar do rival',         risco:2, prestigio:5,
     nota:'poucos lá dentro, mas é humilhação que fica'}
  ];

  /* o ponto ganha um bairro de verdade da praça, sempre o mesmo */
  function pontosDeAtaque(E){
    const bairros = M().bairrosDe(E.torcida.mapa);
    return PONTOS.map((p, i)=>Object.assign({}, p, {
      bairro: bairros.length ? bairros[(i*7) % bairros.length].nome : ''
    }));
  }
  const ponto = id => PONTOS.find(p=>p.id===id) || PONTOS[0];

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

  /* quanta gente sai de casa: em jogo fora, o tamanho da caravana */
  function efetivoDaSaida(E){
    const aptos = TO.membros.aptosParaOEstadio(E).length;
    if(!TO.financeiro.precisaCaravana(E)) return aptos;
    const est = estimativaCaravana(E);
    return est ? est.vao : aptos;
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
    return M().torcidasDe(j.advId).map(o=>{
      const v = (E.relacoes||{})[o.id];
      return {id:o.id, torcida:o, relacao: v===undefined ? 0 : v,
              aliada: v !== undefined && v >= 20,
              tensao: TO.tensao ? TO.tensao.nivel(E, o.id) : 0};
    }).sort((a,b)=>a.relacao-b.relacao);
  }

  /* todas aliadas? então bater nelas é traição, e o jogo diz isso */
  function soAliados(E){
    const a = alvosDoJogo(E);
    return a.length > 0 && a.every(x=>x.aliada);
  }
  function intencoes(E){
    const trair = soAliados(E);
    return [
      {id:'paz', rot:'Ir em paz', nota:'entrar pelo portão, bandeira e bateria'},
      trair
        ? {id:'trair',  rot:'Trair aliado',
           nota:'todas as torcidas do adversário são nossas aliadas; bater nelas '+
                'derruba a relação de vez'}
        : {id:'atacar', rot:'Atacar', nota:'procurar a torcida rival antes da bola rolar'}
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
            if(v === undefined || v < 20) continue;      // só aliado de fato
            /* quanto mais próxima a relação, mais gente eles mandam */
            const vem = Math.max(4, Math.round((o.membros||20) * 0.18 * (1 + v/150)));
            fora.push({id:o.id, torcida:o, clube:vis, adversario:casa,
                       relacao:v, dia:j.d || etapa.dia || 6, comp:comp.nome,
                       estimativa:vem});
          }
        }
      }
    }
    return fora;
  }

  /* GDD §11.1: acolher bem é o jeito mais barato de subir relação */
  const RECEPCAO = [
    {id:'nada',      rot:'Não receber',        porCabeca:0,  relacao:-5,
     nota:'cada um se vira; o aliado registra e cobra depois'},
    {id:'hospedar',  rot:'Hospedar na sede',   porCabeca:25, relacao:2,
     nota:'colchão no salão e café de manhã'},
    {id:'escolta',   rot:'Hospedar e escoltar', porCabeca:50, relacao:5,
     nota:'bonde junto com o deles até o portão'},
    {id:'churrasco', rot:'Churrasco e escolta', porCabeca:75, relacao:12,
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
    const porRodovia = new Map();
    for(const c of M().todasCidades)
      for(const r of (c.rodovias||[])){
        if(!porRodovia.has(r)) porRodovia.set(r, []);
        porRodovia.get(r).push(c.id);
      }
    const liga = (a,b,rod)=>{
      if(!_grafo.has(a)) _grafo.set(a, new Map());
      _grafo.get(a).set(b, rod);
    };
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

  /* caminho mínimo com peso: 1 por salto, mais o que a praça cobra
     de risco quando `evitarRival` está ligado */
  function caminho(E, origem, destino, evitarRival){
    if(origem === destino) return {cidades:[origem], rodovias:[], saltos:0, risco:0};
    const g = grafo();
    const dist = new Map([[origem, 0]]);
    const anterior = new Map();
    const fila = [origem];
    /* Dijkstra simples: 30 nós não pedem heap */
    const visto = new Set();
    while(fila.length){
      fila.sort((a,b)=>(dist.get(a)||1e9)-(dist.get(b)||1e9));
      const n = fila.shift();
      if(visto.has(n)) continue;
      visto.add(n);
      if(n === destino) break;
      for(const [viz, rod] of (g.get(n) || new Map())){
        const extra = evitarRival ? hostilidade(E, viz)/25 : 0;
        const d = (dist.get(n)||0) + 1 + extra;
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

  function rotas(E){
    const j = E.proximoJogo;
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
    return fora;
  }

  const rotaEscolhida = E =>{
    const p = plano(E), lista = rotas(E);
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
    return {aptos:aptos.length, interessados, vao, vontade, rota:r, porCabeca,
            bruto, rateio: Math.round(bruto*RATEIO),
            custo: Math.round(bruto*(1-RATEIO)), minimo:MINIMO};
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
      if(TO.financeiro.precisaCaravana(E) && E.postura !== 'viajar' && E.postura !== 'ficar')
        põe('postura', 'Decidir se a torcida viaja',
            `jogo em ${j.cidadeAdv}`, 'gestao', 'urgente');
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

    const presos = E.membros.filter(m=>m.preso).length;
    if(presos) põe('presos', `${presos} ${presos===1?'membro preso':'membros presos'}`,
      'fiança pela ficha ou negociação na delegacia', 'torcida', 'urgente');

    const promoveis = E.membros.filter(m=>TO.membros.podePromover(E,m).ok).length;
    if(promoveis) põe('promocao', `${promoveis} prontos pra promoção`,
      'subir de cargo custa dinheiro e rende atributo', 'torcida');

    const fila = E.membros.filter(m=>m.naFila && TO.membros.disponivel(m)).length;
    if(!fila) põe('treino', 'Fila de treino vazia',
      'sem ninguém escalado, treinar não faz nada', 'torcida');

    if(E.dinheiro < 0) põe('caixa', 'Caixa no vermelho',
      'se durar, membro começa a sair', 'financeiro', 'urgente');

    return fora;
  }

  /* =======================================================
     FECHAR O PLANO
     ======================================================= */
  function confirmar(E){
    const p = plano(E);
    p.decidido = true;
    /* a recepção do aliado é paga na hora: comida e colchão não fiam */
    let gasto = 0;
    for(const a of aliadosNaCidade(E, E.data.semana)){
      const nivel = nivelDe(E, a.id);
      if(!nivel || nivel === 'nada' || (p.pago||{})[a.id]) continue;
      const custo = custoRecepcao(nivel, a.estimativa);
      if(custo > E.dinheiro) continue;
      TO.estado.lancar(E, `Recepção da ${a.torcida.nome}`, -custo);
      E.relacoes[a.id] = U.limitar((E.relacoes[a.id]||0) + recepcaoDe(nivel).relacao,
                                   -100, 100);
      /* acolher bem também acalma o clima (GDD §11.1) */
      TO.tensao.somar(E, a.id, -recepcaoDe(nivel).relacao/2, 'recepção de aliado');
      p.pago = p.pago || {}; p.pago[a.id] = true;
      gasto += custo;
    }
    /* as investidas nos outros jogos da cidade gastam ação da semana */
    let usadas = 0;
    E.investidas = E.investidas || [];
    for(const [chave, alvo] of Object.entries(p.investidas || {})){
      if(!alvo || (p.pago||{})['inv-'+chave]) continue;
      if(TO.acoes.restantes(E) <= 0) break;
      E.acoes.usadas = (E.acoes.usadas||0) + 1;
      p.pago = p.pago || {}; p.pago['inv-'+chave] = true;
      E.investidas.push({semana:E.data.semana, alvo, chave});
      usadas++;
    }
    return {ok:true, gasto, investidas:usadas};
  }

  return {plano, tipoDoJogo, salvarPadrao, temPadrao, esquecerPadrao,
          alvosDoJogo, soAliados, intencoes, outrosJogosNaCidade,
          recepcaoPadrao, definirRecepcaoPadrao, nivelDe,
          PONTOS, pontosDeAtaque, ponto, divisao, efetivoDaSaida,
          destinos, opcoesDeDestino,
          aliadosNaCidade, RECEPCAO, recepcaoDe, custoRecepcao,
          grafo, caminho, rotas, rotaEscolhida, estimativaCaravana, hostilidade,
          pendencias, confirmar, CUSTO_BASE, CUSTO_SALTO, CUSTO_AR};
})();
