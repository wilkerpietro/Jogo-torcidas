/* =========================================================
   COMPETIÇÕES — temporada, tabelas e calendário (GDD §18)
   ---------------------------------------------------------
   O ano tem duas fases, nessa ordem (GDD §18.1): primeiro os
   regionais e estaduais, depois o Brasileirão das séries A a
   D. Uma rodada por semana, o que faz o calendário do jogo e
   o do futebol serem a mesma coisa.

   Nada aqui vem de arquivo novo: os 108 clubes de times.js já
   trazem `divisao` e `regional`, e é dali que saem as onze
   competições regionais e as quatro nacionais.
   ========================================================= */
window.TO = window.TO || {};

TO.competicoes = (function(){
  const U = TO.util;
  const M = () => TO.mundo;

  const SEMANAS_ANO      = 52;
  const INICIO_REGIONAL  = 1;    // janeiro
  const INICIO_NACIONAL  = 14;   // abril, como no GDD §18.1
  const FINAL_REGIONAL   = INICIO_NACIONAL - 1;   // toda final na mesma semana

  const PONTOS = {v:3, e:1, d:0};

  /* =======================================================
     SORTEIO DE TABELA
     Método do círculo: com número ímpar entra um fantasma e
     quem cair contra ele folga na rodada.
     ======================================================= */
  function roundRobin(clubes, voltas){
    const t = [...clubes];
    if(t.length % 2) t.push(null);
    const n = t.length, meia = n/2;
    const rodadas = [];
    for(let r=0; r<n-1; r++){
      const jogos = [];
      for(let i=0;i<meia;i++){
        const a = t[i], b = t[n-1-i];
        if(!a || !b) continue;
        /* alterna o mando por rodada. Medido: com esta regra a pior
           sequência em casa é 2 e o total de mandos fica 8–10 em 19;
           alternar por posição estoura pra 18 seguidos. */
        jogos.push(r%2 ? {c:b, f:a} : {c:a, f:b});
      }
      rodadas.push(jogos);
      t.splice(1, 0, t.pop());     // gira, fixando o primeiro
    }
    if(voltas > 1){
      const ida = rodadas.map(j=>j.map(g=>({...g})));
      for(const jogos of ida)
        rodadas.push(jogos.map(g=>({c:g.f, f:g.c})));
    }
    return rodadas;
  }

  /* divide em grupos servindo em zigue-zague, pra não juntar
     os melhores todos no mesmo lado da chave */
  function dividirGrupos(clubes, quantos){
    const ordem = [...clubes].sort((a,b)=>forca(b)-forca(a));
    const g = Array.from({length:quantos}, ()=>[]);
    ordem.forEach((c,i)=>{
      const volta = Math.floor(i/quantos) % 2;
      const k = volta ? quantos-1-(i%quantos) : i%quantos;
      g[k].push(c);
    });
    return g;
  }

  /* =======================================================
     FORÇA DOS CLUBES — teto 100, valores da fonte
     A planilha dá o ponto de partida e ele entra como está:
     os 108 clubes nascem entre 4 e 50, que é a força que o
     autor definiu pra cada um. O que mudou foi só o TETO —
     de 50 pra 100 —, então sobra metade da régua pra crescer,
     seja em campo, seja com dinheiro de torcida. O resto do
     decênio é consequência do que aconteceu no gramado: quem
     termina no G4 sobe de nível, quem briga contra o
     rebaixamento perde. A evolução vive no save (E.forcas),
     nunca em times.js — dado importado não se reescreve.
     ======================================================= */
  const FORCA_MIN = 1, FORCA_MAX = 100;

  let _forcas = null;                     // ponteiro pro save da vez
  let _investido = null;
  const usarSave = E => {
    _forcas    = (E && E.forcas) || null;
    _investido = (E && E.investimento) || null;
  };
  /* GDD §9.5: "força do elenco (base + investimento da torcida)". As duas
     parcelas vivem separadas de propósito: a base é o que o clube conquistou
     em campo e é ela que a evolução de fim de ano recentra por competição;
     o investimento é dinheiro de torcida e não pode entrar nessa média,
     senão comprar elenco derrubaria o dos outros na mesma divisão. */
  const invDe = (E, id) => ((E && E.investimento) || {})[id] || 0;
  const daFonte = id => (M().time(id)||{}).qualidade || 10;
  const crua = id => (_forcas && _forcas[id] != null) ? _forcas[id] : daFonte(id);
  const forca = id => U.limitar(
    crua(id) + ((_investido && _investido[id]) || 0), FORCA_MIN, FORCA_MAX);
  const forcaBase = (E, id) =>
    (E.forcas && E.forcas[id] != null) ? E.forcas[id] : daFonte(id);
  const forcaDe = (E, id) =>
    U.limitar(forcaBase(E, id) + invDe(E, id), FORCA_MIN, FORCA_MAX);

  /* =======================================================
     REFORÇAR O ELENCO (GDD V3 §19)
     Um ponto de força custa o preço da faixa em que o clube
     está — de R$ 50 mil no time pequeno a R$ 800 mil no
     gigante. É o maior ralo de dinheiro do jogo, e é de
     propósito: com bar, loja e subsede montados, é pra onde
     sobra. Fecha o laço da torcida com o gramado — elenco
     melhor ganha mais, ganhar sobe a satisfação, satisfação
     enche o recrutamento.
     ======================================================= */
  const TABELA_INVESTIMENTO = [
    {ate: 10, custo:  50000}, {ate: 20, custo:  80000},
    {ate: 30, custo: 140000}, {ate: 40, custo: 200000},
    {ate: 50, custo: 250000}, {ate: 60, custo: 300000},
    {ate: 70, custo: 350000}, {ate: 80, custo: 400000},
    {ate: 90, custo: 500000}, {ate:100, custo: 800000}
  ];
  function custoDoPonto(E, id){
    const f = forcaDe(E, id);
    return (TABELA_INVESTIMENTO.find(x=>f <= x.ate)
            || TABELA_INVESTIMENTO[TABELA_INVESTIMENTO.length-1]).custo;
  }

  function investir(E, id, pontos){
    pontos = Math.max(1, Math.round(pontos||1));
    E.investimento = E.investimento || {};
    let gasto = 0, feitos = 0;
    /* ponto a ponto, porque o segundo pode cair na faixa de cima e custar
       mais caro que o primeiro */
    for(let i=0;i<pontos;i++){
      if(forcaDe(E, id) >= FORCA_MAX) break;
      const c = custoDoPonto(E, id);
      if(E.dinheiro < gasto + c) break;
      E.investimento[id] = (E.investimento[id] || 0) + 1;
      gasto += c; feitos++;
      usarSave(E);
    }
    if(!feitos) return {ok:false, pontos:0, gasto:0,
      msg: forcaDe(E, id) >= FORCA_MAX
        ? 'O elenco já está no teto.' : 'Não dá: falta caixa.'};
    const time = (M().time(id)||{}).nome || id;
    TO.estado.lancar(E, `Reforço no elenco do ${time}`, -gasto);
    TO.estado.anotar(E, `A torcida reforçou o elenco do ${time}: `+
      `+${feitos} de força.`, 'boa');
    return {ok:true, pontos:feitos, gasto, msg:`${time}: +${feitos} de força`};
  }


  /* GDD §18: a escala é 1 a 100. O passo por temporada é pequeno de
     propósito — time grande não vira pequeno num ano, mas dez anos de
     Série C cobram o preço. Portado do protótipo antigo. */
  function evoluirForca(E){
    const S = E.temporada;
    if(!S) return [];
    E.forcas = E.forcas || {};

    /* 1. cada competição dá um delta bruto por posição */
    const bruto = {}, porComp = {};
    for(const comp of S.competicoes){
      const div = ESCADA.indexOf(comp.nome) + 1;   // 0 = não é Brasileirão
      const linhas = comp.grupos && comp.grupos.length > 1
        ? comp.grupos.flatMap((g,i)=>tabela(comp, i))
        : tabela(comp);
      linhas.forEach((l, i)=>{
        const pos = i + 1;
        let d;
        if(div === 1)      d = pos<=4 ? 5+U.inteiro(-5,5) : pos<=16 ? 2+U.inteiro(-5,5) : U.inteiro(-6,3);
        else if(div === 2) d = pos<=4 ? 3+U.inteiro(-2,5) : U.inteiro(-4,2);
        else if(div === 3) d = pos<=4 ? 2+U.inteiro(-1,4) : pos<=10 ? U.inteiro(-1,2)
                                      : pos<=16 ? U.inteiro(-2,2) : U.inteiro(-2,1);
        else if(div === 4) d = pos<=4 ? 2+U.inteiro(-1,2) : pos<=12 ? U.inteiro(-1,2) : U.inteiro(-1,1);
        /* o regional vale menos: é um torneio de dez jogos */
        else               d = (pos<=2 ? U.inteiro(0,2) : U.inteiro(-1,1)) * 0.5;
        bruto[l.id] = (bruto[l.id] || 0) + d;
        /* o clube pertence à competição de maior peso em que jogou:
           o nacional manda, o regional é tempero */
        if(div || !porComp[l.id]){
          (porComp[comp.nome] = porComp[comp.nome] || []).push(l.id);
        }
      });
    }

    const ids = Object.keys(bruto);
    if(!ids.length) return [];

    /* 2. cada divisão é soma zero DENTRO DE SI. Tirar só a média geral não
       basta: a tabela do protótipo é muito mais generosa na Série A (16 dos
       20 com média positiva) que na D (teto de +2), e em vinte anos isso
       vira uma aristocracia congelada — medido, 9 clubes da A no teto e 30
       da D no piso. Centrando por competição, quem sobe de nível sobe às
       custas de quem desceu na MESMA divisão, e o resto do movimento entre
       divisões fica por conta do acesso e do rebaixamento, que é onde ele
       deve estar. */
    for(const grupo of Object.values(porComp)){
      if(!grupo.length) continue;
      const m = grupo.reduce((s,id)=>s+bruto[id], 0) / grupo.length;
      for(const id of grupo) bruto[id] -= m;
    }

    /* 3. gravidade da divisão: todo ano o clube anda um pouco na direção do
       nível típico de onde está jogando. Gigante rebaixado perde elenco,
       clube pequeno que sobe recebe dinheiro. É isso que impede alguém de
       estacionar encostado no teto ou no piso. */
    const soma = {}, conta = {};
    for(const id of ids){
      const d = divisaoDe(E, M().time(id) || {});
      soma[d] = (soma[d]||0) + forcaBase(E, id);
      conta[d] = (conta[d]||0) + 1;
    }
    const GRAVIDADE = 0.12;

    /* 4. delta e força vivem na mesma escala de 1 a 100 */
    const mov = [];
    for(const id of ids){
      const antes = forcaBase(E, id);
      const d = divisaoDe(E, M().time(id) || {});
      const nivel = conta[d] ? soma[d]/conta[d] : antes;
      const puxao = (nivel - antes) * GRAVIDADE;
      const dep = U.limitar(Math.round(antes + bruto[id]/2 + puxao), FORCA_MIN, FORCA_MAX);
      if(dep !== antes){ E.forcas[id] = dep; mov.push({id, de:antes, para:dep}); }
    }
    usarSave(E);
    return mov;
  }

  /* =======================================================
     RESULTADO
     Poisson com o gol esperado saindo da força dos dois
     e do fator casa. Nada de sortear vencedor direto: placar
     de verdade dá empate, goleada e zebra na medida certa.
     ======================================================= */
  function poisson(lambda){
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= U.rng(); } while(p > L);
    return k-1;
  }

  /* GDD §9.5: o placar sai da forca dos dois elencos, do mando e de um
     bonus chamado Fator Torcida — o que a arquibancada faz no dia. O
     bonus vem de fora em pontos de força, positivo pro mandante.
     O divisor é 55 porque é a distância que separa o clube mais fraco
     do mais forte da fonte — subir o teto pra 100 não muda isso. */
  function simular(casa, fora, bonusCasa){
    const dif = (forca(casa) - forca(fora) + (bonusCasa||0)) / 55;
    const lc = U.limitar(1.30 + 0.30 + dif*1.5, 0.25, 5);
    const lf = U.limitar(1.30 - 0.20 - dif*1.5, 0.20, 5);
    return [poisson(lc), poisson(lf)];
  }

  /* mata-mata empatado vai a pênaltis; quem é melhor leva
     vantagem, mas longe de garantia (GDD §18.3) */
  function penaltis(a, b){
    const p = forca(a) / (forca(a) + forca(b) || 1);
    return U.rng() < (0.5 + (p-0.5)*0.5) ? a : b;
  }

  /* =======================================================
     MONTAGEM DA TEMPORADA
     ======================================================= */
  /* =======================================================
     FORMATO DOS ESTADUAIS E REGIONAIS
     Um por competição, como o autor definiu. Quem não está na
     tabela cai na regra por tamanho, logo abaixo.
     ======================================================= */
  const FORMATO = {
    /* 6 clubes: todos contra todos ida e volta, top 4 → semi e final */
    'Catarinense': {grupos:1, passam:4, voltas:2},
    'Mineiro':     {grupos:1, passam:4, voltas:2},
    'Paranaense':  {grupos:1, passam:4, voltas:2},
    /* 10 clubes: turno único, top 4 → semi e final */
    'Paulistão':          {grupos:1, passam:4, voltas:1},
    'Paulistão A2':       {grupos:1, passam:4, voltas:1},
    'Cariocão':           {grupos:1, passam:4, voltas:1},
    'Copa Centro-Oeste':  {grupos:1, passam:4, voltas:1},
    /* 8 clubes: turno único, top 4 → semi e final */
    'Gauchão':     {grupos:1, passam:4, voltas:1},
    'Copa Norte':  {grupos:1, passam:4, voltas:1},
    /* dois grupos, turno único, top 4 de cada → quartas, semi, final */
    'Copa do Nordeste':   {grupos:2, passam:4, voltas:1, rebaixaPorGrupo:1},
    'Nordestão Série B':  {grupos:2, passam:4, voltas:1, sobemFinalistas:true}
  };

  /* GDD §18.3, pra competição que a tabela acima não cobrir */
  function formatoRegional(nome, n){
    if(FORMATO[nome]) return FORMATO[nome];
    if(n >= 16) return {grupos:2, passam:4, voltas:1};
    if(n >= 12) return {grupos:2, passam:2, voltas:1};
    if(n >= 7)  return {grupos:1, passam:4, voltas:1};
    return {grupos:1, passam:4, voltas:2};
  }

  /* quantas semanas o formato ocupa: grupos mais as chaves, descontando
     as rodadas de meio de semana, que não gastam semana própria */
  function semanasQuePrecisa(cfg, clubes, tipo){
    const g = cfg.grupos || 1;
    const maior = Math.ceil(clubes/g);
    const rodadas = (maior % 2 ? maior : maior-1) * (cfg.voltas || 1);
    const passam  = Math.max(2, (cfg.passam||2) * g);
    const meio = Math.min(MEIO_POR_TIPO[tipo || 'regional'] || 0, Math.max(0, rodadas-2));
    return rodadas - meio + Math.ceil(Math.log2(passam));
  }

  /* GDD §18.2: sobe e desce entre as séries no fim do ano.
     Série D tem 48 clubes e a C tem 20, então o fluxo entre elas não
     pode ser 4 por 4 — sobem 4 e caem 4, e a D absorve a diferença. */
  const ESCADA = ['Brasileirão Série A','Brasileirão Série B',
                  'Brasileirão Série C','Brasileirão Série D'];
  const TROCA = 4;

  /* Dia 1 é segunda, 6 é sábado, 7 é domingo. */
  const DIA_FDS  = 6;
  const DIA_MEIO = 3;

  /* Grade horária de cada competição: os jogos de uma rodada se
     espalham pelos horários na ordem em que a tabela os sorteou, do
     jeito que a TV divide o fim de semana. A Copa do Brasil fica no
     meio de semana pra caber junto com os pontos corridos. */
  const GRADE = {
    'Brasileirão Série A': [
      {d:6, h:'16:00'}, {d:6, h:'18:30'}, {d:6, h:'21:00'},
      {d:7, h:'11:00'}, {d:7, h:'16:00'}, {d:7, h:'18:30'}, {d:7, h:'20:30'}
    ],
    'Brasileirão Série B': [
      {d:6, h:'17:00'}, {d:6, h:'20:30'},
      {d:7, h:'16:00'}, {d:7, h:'18:00'}, {d:7, h:'20:00'}
    ],
    'Brasileirão Série C': [
      {d:6, h:'16:30'}, {d:6, h:'19:30'}, {d:7, h:'15:00'}, {d:7, h:'17:00'}
    ],
    'Brasileirão Série D': [
      {d:6, h:'15:00'}, {d:6, h:'17:00'},
      {d:7, h:'10:00'}, {d:7, h:'15:00'}, {d:7, h:'16:00'}
    ],
    regional: [
      {d:6, h:'16:00'}, {d:6, h:'18:30'},
      {d:7, h:'11:00'}, {d:7, h:'16:00'}, {d:7, h:'18:30'}
    ],
    copa:  [{d:3, h:'19:00'}, {d:3, h:'21:30'}],
    meio:  [{d:3, h:'19:00'}, {d:3, h:'19:30'}, {d:3, h:'21:30'}],
    final: [{d:7, h:'16:00'}]
  };
  const gradeDe = (nome, tipo) => GRADE[nome] || GRADE[tipo] || GRADE.regional;

  /* Rodadas do meio de semana. Elas dividem a semana com a rodada
     seguinte — quarta e depois fim de semana — e é o que faz a
     temporada fechar no fim de novembro em vez de virar o ano. */
  const MEIO_POR_TIPO = {regional:2, nacional:3};
  function rodadasDoMeio(total, quantas){
    const s = new Set();
    for(let i=1;i<=quantas;i++){
      let r = Math.round(total*i/(quantas+1));
      while(s.has(r)) r++;
      if(r > 0 && r < total) s.add(r);
    }
    return s;
  }

  function criarCompeticao(id, nome, tipo, clubes, cfg, semanaInicio, finalEm){
    const grupos = cfg.grupos > 1 ? dividirGrupos(clubes, cfg.grupos) : [clubes];
    const porGrupo = grupos.map(g=>roundRobin(g, cfg.voltas));
    const maior = Math.max(...porGrupo.map(r=>r.length));

    const grade = gradeDe(nome, tipo);
    const meias = rodadasDoMeio(maior, MEIO_POR_TIPO[tipo] || 0);
    const rodadas = [];
    let semana = semanaInicio;
    for(let r=0; r<maior; r++){
      const jogos = [];
      porGrupo.forEach((rr, ig)=>{
        for(const j of (rr[r]||[])) jogos.push({...j, g:ig});
      });
      const g = meias.has(r) ? GRADE.meio : grade;
      jogos.forEach((j, k)=>{ const s = g[k % g.length]; j.d = s.d; j.h = s.h; });
      rodadas.push({semana, dia:g[0].d, meio:meias.has(r), fase:'grupos', jogos});
      /* rodada de quarta divide a semana com a próxima */
      if(!meias.has(r)) semana++;
    }
    return {
      id, nome, tipo,
      clubes, grupos: grupos.map(g=>[...g]),
      passam: cfg.passam, voltas: cfg.voltas, grade,
      semanaInicio, finalEm: finalEm || null, dia: grade[0].d,
      rodadas, mata:[], campeao:null, vice:null,
      /* série com pontos corridos não tem mata-mata: campeão é o líder */
      pontosCorridos: !!cfg.pontosCorridos
    };
  }

  /* A divisão e o estadual de um clube mudam com sobe-e-desce. times.js
     é fonte estática, então a mudança vive no save. */
  const divisaoDe  = (E, t) => (E.divisoes  || {})[t.id] || t.divisao;
  const regionalDe = (E, t) => (E.regionais || {})[t.id] || t.regional;

  function montarTemporada(E){
    U.usarSemente((E.semente || 1) + (E.data.ano||2026));
    const T = M().todosTimes;
    const comps = [];

    /* ---- fase 1: regionais e estaduais (GDD §18.3 e §18.4) ---- */
    const porRegional = {};
    for(const t of T){
      const r = regionalDe(E, t);
      (porRegional[r] = porRegional[r] || []).push(t.id);
    }
    const janela = FINAL_REGIONAL - INICIO_REGIONAL + 1;
    for(const nome of Object.keys(porRegional).sort()){
      const clubes = porRegional[nome];
      let cfg = formatoRegional(nome, clubes.length);
      /* se o clube mudou de estadual e o formato não cabe mais na
         janela de janeiro a março, o returno é o primeiro a cair */
      if(semanasQuePrecisa(cfg, clubes.length, 'regional') > janela && (cfg.voltas||1) > 1)
        cfg = Object.assign({}, cfg, {voltas:1});

      /* Toda final cai na mesma semana, a véspera do Brasileirão, e a
         fase de grupos termina na semana anterior à primeira partida do
         mata-mata. Quem tem chave mais longa começa antes; ninguém fica
         com buraco no meio da competição. */
      const chaves = Math.ceil(Math.log2(Math.max(2, (cfg.passam||2)*(cfg.grupos||1))));
      const primeiraChave = FINAL_REGIONAL - (chaves - 1);
      const rodadas = semanasQuePrecisa(cfg, clubes.length, 'regional') - chaves;
      const inicio = Math.max(INICIO_REGIONAL, primeiraChave - rodadas);

      comps.push(criarCompeticao(U.identificador(nome), nome, 'regional',
        clubes, cfg, inicio, FINAL_REGIONAL));
    }

    /* ---- fase 2: Brasileirão (GDD §18.2) ---- */
    const porDivisao = {};
    for(const t of T){
      const d = divisaoDe(E, t);
      (porDivisao[d] = porDivisao[d] || []).push(t.id);
    }
    for(const nome of Object.keys(porDivisao).sort()){
      const clubes = porDivisao[nome];
      /* até 20 clubes é turno e returno; a D, com 48, vai em quatro
         grupos regionalizados com playoff, como manda o GDD */
      const cfg = clubes.length <= 20
        ? {grupos:1, passam:0, voltas:2, pontosCorridos:true}
        : {grupos:4, passam:4, voltas:2};
      comps.push(criarCompeticao(U.identificador(nome), nome, 'nacional',
        clubes, cfg, INICIO_NACIONAL));
    }

    /* ---- mando de campo: rival direto e sequência em casa ---- */
    ajustarMandos(comps);

    /* ---- a Copa do Brasil corre por dentro, no meio de semana ---- */
    comps.push(criarCopa(E));

    return {
      ano: E.data.ano,
      competicoes: comps,
      /* histórico de campeões, pra tela de conquistas mais tarde */
      titulos: (E.temporada && E.temporada.titulos) || []
    };
  }

  /* =======================================================
     MANDO DE CAMPO
     Duas regras que a tabela sorteada não respeita sozinha:
     rival direto não joga em casa no mesmo fim de semana, e
     ninguém faz quatro jogos seguidos em casa na mesma
     competição.
     ======================================================= */

  /* O rival direto de um clube é UM só. O grafo de torcidas dá até cinco
     "maiores rivais" por clube, e com cinco arestas a regra "rival em
     casa, eu fora" vira impossível: numa rodada do Cariocão cinco dos
     dez cariocas mandam, e eles são rivais entre si. Então o rival
     direto é escolhido em pares exclusivos — o clássico de cada um —,
     priorizando mesma cidade e torcida grande. Fortaleza fica com o
     Ceará, Grêmio com o Inter, Athletico com o Coritiba. */
  let _rivais = null;
  function rivaisDiretos(){
    if(_rivais) return _rivais;
    const clubeDa = new Map(M().todasTorcidas.map(o=>[o.id, o.clubeId]));
    const membros = new Map();
    for(const o of M().todasTorcidas)
      membros.set(o.clubeId, Math.max(membros.get(o.clubeId)||0, o.membros||0));

    const cand = new Map();          // "a|b" -> peso
    for(const o of M().todasTorcidas){
      const a = o.clubeId;
      if(!M().time(a)) continue;
      for(const r of (o.maioresRivais||[])){
        const b = clubeDa.get(r);
        if(!b || b===a || !M().time(b)) continue;
        const k = [a,b].sort().join('|');
        const mesmaCidade = M().time(a).mapa === M().time(b).mapa;
        const peso = (mesmaCidade?1000:0)
                   + (membros.get(a)||0) + (membros.get(b)||0)
                   + (cand.get(k) ? 1 : 0);      // citado dos dois lados
        cand.set(k, Math.max(cand.get(k)||0, peso));
      }
    }
    /* casamento guloso: o clássico mais forte primeiro, e cada clube
       entra em um par só */
    _rivais = new Map();
    const tomado = new Set();
    for(const [k] of [...cand].sort((x,y)=>y[1]-x[1])){
      const [a,b] = k.split('|');
      if(tomado.has(a) || tomado.has(b)) continue;
      tomado.add(a); tomado.add(b);
      _rivais.set(a, new Set([b]));
      _rivais.set(b, new Set([a]));
    }
    return _rivais;
  }

  /* nem quatro jogos seguidos em casa nem quatro fora, por competição */
  const MAX_SEGUIDOS = 3;

  function ajustarMandos(comps){
    const riv = rivaisDiretos();

    /* A janela é o fim de semana ou o meio de semana: dois rivais podem
       mandar na mesma semana desde que em janelas diferentes. */
    const janelaDe = (semana, dia) => `${semana}${dia>=6?'F':'M'}`;
    const porJanela = new Map();     // chave -> jogos
    const daJanela  = new Map();     // jogo -> chave
    const irmao     = new Map();     // jogo -> jogo de volta
    const doComp    = new Map();     // jogo -> competição
    const agenda    = new Map();     // competição -> clube -> jogos em ordem

    for(const comp of comps){
      const porClube = new Map();
      agenda.set(comp, porClube);
      for(const r of comp.rodadas){
        for(const j of r.jogos){
          const k = janelaDe(r.semana, j.d || r.dia || DIA_FDS);
          if(!porJanela.has(k)) porJanela.set(k, []);
          porJanela.get(k).push(j);
          daJanela.set(j, k);
          doComp.set(j, comp);
          j._o = r.semana*10 + (j.d || DIA_FDS);      // ordem no calendário
          for(const cl of [j.c, j.f]){
            if(!porClube.has(cl)) porClube.set(cl, []);
            porClube.get(cl).push(j);
          }
        }
      }
      for(const l of porClube.values()) l.sort((a,b)=>a._o-b._o);
      if(comp.voltas > 1){
        const porPar = new Map();
        for(const r of comp.rodadas) for(const j of r.jogos){
          const chave = [j.c, j.f].sort().join('|');
          if(porPar.has(chave)){
            const outro = porPar.get(chave);
            irmao.set(j, outro); irmao.set(outro, j);
          }else porPar.set(chave, j);
        }
      }
    }

    /* Rival junto só conta como problema quando os dois mandam no MESMO
       DIA. Dividir o fim de semana — um sábado, outro domingo — é a
       saída quando o mando não pode ser trocado. */
    const conflitosNa = chave =>{
      const porDia = new Map();
      for(const j of (porJanela.get(chave)||[])){
        const d = j.d || DIA_FDS;
        if(!porDia.has(d)) porDia.set(d, new Set());
        porDia.get(d).add(j.c);
      }
      let n = 0;
      for(const casa of porDia.values())
        for(const a of casa)
          for(const r of (riv.get(a)||[])) if(casa.has(r) && a < r) n++;
      return n;
    };

    /* quantos jogos passam do teto de seguidos, dos dois lados: nem
       quatro em casa nem quatro fora */
    function excesso(comp, clube){
      const l = (agenda.get(comp)||new Map()).get(clube) || [];
      let casa = 0, fora = 0, exc = 0;
      for(const j of l){
        if(j.c === clube){ casa++; fora = 0; if(casa > MAX_SEGUIDOS) exc++; }
        else            { fora++; casa = 0; if(fora > MAX_SEGUIDOS) exc++; }
      }
      return exc;
    }

    /* trocar o mando; em turno e returno o jogo de volta vai junto */
    function inverter(j){
      const par = irmao.get(j);
      if(par){ const t=par.c; par.c=par.f; par.f=t; }
      const t = j.c; j.c = j.f; j.f = t;
    }

    /* Custo só do que a troca mexe: as janelas dos dois jogos e a
       sequência dos dois clubes. Rival vale dez porque é a regra dura;
       sequência longa é incômodo, não erro. */
    function custoLocal(j){
      const comp = doComp.get(j), par = irmao.get(j);
      const alvos = new Set([daJanela.get(j)]);
      if(par) alvos.add(daJanela.get(par));
      let c = 0;
      for(const k of alvos) c += conflitosNa(k) * 10;
      c += excesso(comp, j.c) + excesso(comp, j.f);
      return c;
    }
    function ganho(j){
      const antes = custoLocal(j);
      inverter(j);
      const depois = custoLocal(j);
      inverter(j);
      return antes - depois;
    }

    /* descida em ladeira sobre os jogos que estão em alguma violação */
    function candidatos(){
      const fora = new Set();
      for(const [chave, jogos] of porJanela)
        if(conflitosNa(chave)) for(const j of jogos) fora.add(j);
      for(const [comp, porClube] of agenda)
        for(const [clube, l] of porClube){
          if(!excesso(comp, clube)) continue;
          for(const j of l) fora.add(j);
        }
      return fora;
    }

    /* custo global, pra saber se o rumo é bom */
    const todos = [...doComp.keys()];
    function custoTotal(){
      let c = 0;
      for(const k of porJanela.keys()) c += conflitosNa(k)*10;
      for(const [comp, porClube] of agenda)
        for(const clube of porClube.keys()) c += excesso(comp, clube);
      return c;
    }
    const guardar = ()=> todos.map(j=>j.c);
    const repor = foto => todos.forEach((j,i)=>{
      if(j.c !== foto[i]){ const t=j.c; j.c=j.f; j.f=t; }
    });

    /* Último recurso, como o autor pediu: se os dois rivais têm de
       mandar no mesmo fim de semana, um joga sábado e o outro domingo. */
    const DIAS_ALTERNATIVOS = {F:[6,7], M:[3,2,4]};
    function separarPorDia(){
      for(const [chave, jogos] of porJanela){
        const dias = DIAS_ALTERNATIVOS[chave.slice(-1)] || [6,7];
        for(let tentativa=0; tentativa<8; tentativa++){
          const porDia = new Map();
          for(const j of jogos){
            const d = j.d || DIA_FDS;
            if(!porDia.has(d)) porDia.set(d, new Map());
            porDia.get(d).set(j.c, j);
          }
          let alvo = null;
          for(const casa of porDia.values()){
            for(const [clube, j] of casa)
              for(const r of (riv.get(clube)||[]))
                if(casa.has(r) && clube < r){ alvo = casa.get(r); break; }
            if(alvo) break;
          }
          if(!alvo) break;
          const comp  = doComp.get(alvo);
          const grade = comp.grade || GRADE.regional;
          const outro = dias.find(d=>d !== alvo.d);
          if(outro === undefined) break;
          const vaga = grade.find(x=>x.d === outro);
          alvo.d = outro;
          alvo.h = vaga ? vaga.h : (alvo.h || '19:30');
        }
      }
    }
    separarPorDia();

    /* Ladeira abaixo com passos de platô: prender no primeiro vale
       deixava 45 conflitos de pé, porque trocar o mando de um jogo
       arrasta o jogo de volta junto e o ganho imediato dá zero. Aceitar
       o movimento neutro destrava a cadeia; a melhor configuração vista
       fica guardada. */
    let melhorFoto = guardar(), melhorCusto = custoTotal();
    for(let passo=0; passo<1200; passo++){
      const cands = [...candidatos()];
      if(!cands.length) break;
      let alvo = null, melhor = 0;
      const neutros = [];
      for(const j of cands){
        const g = ganho(j);
        if(g > melhor){ melhor = g; alvo = j; }
        else if(g === 0) neutros.push(j);
      }
      if(alvo) inverter(alvo);
      else if(neutros.length) inverter(neutros[Math.floor(U.rng()*neutros.length)]);
      else break;
      const c = custoTotal();
      if(c < melhorCusto){ melhorCusto = c; melhorFoto = guardar(); }
    }
    repor(melhorFoto);


    /* Com os rivais separados, sobra espaço pra encurtar as sequências
       de mando. Mesma descida com passo de platô. */
    melhorFoto = guardar(); melhorCusto = custoTotal();
    for(let passo=0; passo<900; passo++){
      const cands = [...candidatos()];
      if(!cands.length) break;
      let alvo = null, melhor = 0;
      const neutros = [];
      for(const j of cands){
        const g = ganho(j);
        if(g > melhor){ melhor = g; alvo = j; }
        else if(g === 0) neutros.push(j);
      }
      if(alvo) inverter(alvo);
      else if(neutros.length) inverter(neutros[Math.floor(U.rng()*neutros.length)]);
      else break;
      const c = custoTotal();
      if(c < melhorCusto){ melhorCusto = c; melhorFoto = guardar(); }
    }
    repor(melhorFoto);
    separarPorDia();

    let conf = 0;
    for(const k of porJanela.keys()) conf += conflitosNa(k);
    for(const comp of comps) for(const r of comp.rodadas)
      for(const j of r.jogos) delete j._o;
    return {conflitosRestantes: conf};
  }

  /* pior sequência de jogos seguidos do mesmo lado, pra conferência */
  function piorSequencia(comps){
    let pior = 0;
    for(const comp of comps){
      const porClube = new Map();
      for(const r of comp.rodadas)
        for(const j of r.jogos)
          for(const [clube, casa] of [[j.c,true],[j.f,false]]){
            if(!porClube.has(clube)) porClube.set(clube, []);
            porClube.get(clube).push({s:r.semana*10+(j.d||6), casa});
          }
      for(const [, l] of porClube){
        l.sort((a,b)=>a.s-b.s);
        let c = 0, f = 0;
        for(const g of l){
          if(g.casa){ c++; f=0; } else { f++; c=0; }
          pior = Math.max(pior, c, f);
        }
      }
    }
    return pior;
  }
  const piorSequenciaEmCasa = piorSequencia;

  /* =======================================================
     COPA DO BRASIL
     Chave direta, sem grupos. Entra todo mundo menos a Série
     A, que só aparece na segunda fase. Jogo único até as
     oitavas; da oitava à semi, ida e volta; final em campo
     neutro.
     ======================================================= */
  /* Uma fase a cada três semanas, na quarta-feira; ida e volta em
     semanas seguidas. A final é o último jogo do ano e sai do meio de
     semana: fecha a temporada depois da última rodada do Brasileirão. */
  const COPA_FASES = [
    {fase:'Primeira fase', semanas:[22]},
    {fase:'Segunda fase',  semanas:[26], entram:'Brasileirão Série A'},
    {fase:'Terceira fase', semanas:[30]},
    {fase:'Oitavas',       semanas:[34,35]},
    {fase:'Quartas',       semanas:[39,40]},
    {fase:'Semifinal',     semanas:[44,45]},
    {fase:'Final',         semanas:[SEMANAS_ANO], neutro:true, grade:GRADE.final}
  ];
  const COPA_NOME = 'Copa do Brasil';

  const forcaDivisao = (E, id)=>{
    const t = M().time(id);
    const i = ESCADA.indexOf(divisaoDe(E, t||{}));
    return i < 0 ? ESCADA.length : i;      // 0 = Série A, maior = pior
  };

  /* Quem manda no jogo único: o clube da divisão mais alta, como o
     autor definiu pra primeira fase (B e C recebem a D). Empate de
     divisão, decide a força. */
  function mandante(E, a, b){
    const fa = forcaDivisao(E,a), fb = forcaDivisao(E,b);
    if(fa !== fb) return fa < fb ? [a,b] : [b,a];
    return forca(a) >= forca(b) ? [a,b] : [b,a];
  }

  function criarCopa(E){
    const T = M().todosTimes;
    const daSerieA = T.filter(t=>divisaoDe(E,t)===ESCADA[0]).map(t=>t.id);
    const resto    = T.filter(t=>divisaoDe(E,t)!==ESCADA[0]).map(t=>t.id);

    /* Primeira fase: B e C mandam em casa, e pra isso cada um deles pega
       um clube da D. O que sobrar da D se enfrenta entre si. */
    const bc = resto.filter(id=>forcaDivisao(E,id) <= 2);
    const d  = U.embaralhar(resto.filter(id=>forcaDivisao(E,id) > 2));
    const jogos = [];
    for(const casa of U.embaralhar(bc)){
      const fora = d.length ? d.shift() : null;
      if(fora) jogos.push({c:casa, f:fora});
      else jogos.push({c:casa, f:null});
    }
    while(d.length >= 2){
      const [a,b] = mandante(E, d.shift(), d.shift());
      jogos.push({c:a, f:b});
    }

    const grade = GRADE.copa;
    jogos.forEach((j,k)=>{ const s = grade[k % grade.length]; j.d = s.d; j.h = s.h; });
    return {
      id:'copa-do-brasil', nome:COPA_NOME, tipo:'copa', copa:true,
      clubes:[...resto, ...daSerieA],
      grupos:[], passam:0, voltas:1, pontosCorridos:false, grade,
      semanaInicio: COPA_FASES[0].semanas[0], finalEm: null,
      dia: DIA_MEIO,
      rodadas:[],
      mata:[{fase:COPA_FASES[0].fase, semana:COPA_FASES[0].semanas[0],
             dia:DIA_MEIO, jogos, indice:0, perna:'unica'}],
      esperando: daSerieA,          // entram na segunda fase
      faseAtual:0, campeao:null, vice:null
    };
  }

  /* soma dos dois jogos; empatou, pênaltis */
  function decidirAgregado(comp, volta){
    const ida = comp.mata.find(m=>m.indice===volta.indice && m.perna==='ida');
    for(const v of volta.jogos){
      const i = (ida ? ida.jogos : []).find(x=>x.par===v.par);
      if(!i) { v.venceu = v.gc>v.gf ? v.c : v.f; continue; }
      const golsC = i.gc + v.gf;   // o mandante da ida é o visitante da volta
      const golsF = i.gf + v.gc;
      v.agregado = `${golsC} × ${golsF}`;
      v.venceu = golsC>golsF ? i.c : golsF>golsC ? i.f : penaltis(i.c, i.f);
      v.penaltis = golsC===golsF;
    }
    return volta.jogos.map(j=>j.venceu);
  }

  /* Estádio da final: o maior do país que não seja casa de nenhum dos
     dois. Filtra por nome de estádio, não por clube — dois clubes podem
     dividir o mesmo campo, e aí ele não é neutro pra nenhum deles. */
  function campoNeutro(a, b){
    const deles = new Set([a,b].map(id=>(M().time(id)||{}).estadio).filter(Boolean));
    const fora = M().todosTimes
      .filter(t=>t.estadio && !deles.has(t.estadio))
      .sort((x,y)=>(y.capacidade||0)-(x.capacidade||0))[0];
    return fora ? fora.estadio : 'campo neutro';
  }

  function avancarCopa(E, comp, semana){
    if(comp.campeao) return;
    const ult = comp.mata[comp.mata.length-1];
    if(!ult || ult.jogos.some(j=>j.f && !temJogo(j))) return;

    /* decide quem passou */
    let vivos;
    if(ult.perna === 'volta') vivos = decidirAgregado(comp, ult);
    else {
      for(const j of ult.jogos){
        if(!j.f){ j.venceu = j.c; continue; }          // sem adversário, passa direto
        j.venceu = j.gc>j.gf ? j.c : j.gf>j.gc ? j.f : penaltis(j.c, j.f);
        j.penaltis = j.gc===j.gf;
      }
      vivos = ult.jogos.map(j=>j.venceu);
    }
    if(ult.perna === 'ida') return;                    // espera a volta

    const passo = COPA_FASES[comp.faseAtual];
    if(passo.fase === 'Final'){
      comp.campeao = vivos[0];
      const f = ult.jogos[0];
      comp.vice = f.venceu===f.c ? f.f : f.c;
      return;
    }

    comp.faseAtual++;
    const prox = COPA_FASES[comp.faseAtual];
    if(!prox) return;

    /* os vinte da Série A entram na fase que a tabela mandar */
    let chave = [...vivos];
    if(prox.entram && comp.esperando && comp.esperando.length){
      chave = chave.concat(comp.esperando);
      comp.esperando = [];
    }
    if(chave.length < 2){ comp.campeao = chave[0] || null; return; }

    /* sorteio: embaralha e emparelha, definindo o mando na hora */
    const sorteio = U.embaralhar(chave);
    const pares = [];
    for(let i=0;i+1<sorteio.length;i+=2){
      const [casa, fora] = mandante(E, sorteio[i], sorteio[i+1]);
      pares.push([casa, fora]);
    }

    const grade = prox.grade || comp.grade || GRADE.copa;
    const horario = js => js.forEach((j,k)=>{
      const s = grade[k % grade.length]; j.d = s.d; j.h = s.h;
    });
    const dia = grade[0].d;
    const idaEVolta = prox.semanas.length > 1;
    if(idaEVolta){
      /* quem tem melhor campanha decide em casa, então joga a volta
         como mandante (GDD §18.5) */
      const ida   = pares.map(([a,b],k)=>({c:b, f:a, par:k}));
      const volta = pares.map(([a,b],k)=>({c:a, f:b, par:k}));
      horario(ida); horario(volta);
      comp.mata.push({fase:`${prox.fase} · ida`, semana:prox.semanas[0], dia,
        indice:comp.faseAtual, perna:'ida', jogos:ida});
      comp.mata.push({fase:`${prox.fase} · volta`, semana:prox.semanas[1], dia,
        indice:comp.faseAtual, perna:'volta', jogos:volta});
    }else{
      const jogos = pares.map(([a,b],k)=>({c:a, f:b, par:k}));
      if(prox.neutro && jogos[0]) jogos[0].neutro = campoNeutro(jogos[0].c, jogos[0].f);
      horario(jogos);
      comp.mata.push({fase:prox.fase, semana:prox.semanas[0], dia,
        indice:comp.faseAtual, perna:'unica', jogos});
    }
  }

  /* =======================================================
     TABELA
     ======================================================= */
  function linhaVazia(id){
    return {id, j:0, v:0, e:0, d:0, gp:0, gc:0, sg:0, p:0};
  }

  function tabela(comp, grupo){
    const alvo = grupo===undefined ? null : grupo;
    const linhas = {};
    const lista = alvo===null ? comp.clubes : comp.grupos[alvo];
    for(const id of lista) linhas[id] = linhaVazia(id);

    for(const r of comp.rodadas){
      for(const j of r.jogos){
        if(j.gc===undefined || j.gc===null) continue;
        if(alvo!==null && j.g!==alvo) continue;
        const a = linhas[j.c], b = linhas[j.f];
        if(!a || !b) continue;
        a.j++; b.j++;
        a.gp+=j.gc; a.gc+=j.gf; b.gp+=j.gf; b.gc+=j.gc;
        if(j.gc>j.gf){ a.v++; b.d++; a.p+=PONTOS.v; }
        else if(j.gc<j.gf){ b.v++; a.d++; b.p+=PONTOS.v; }
        else { a.e++; b.e++; a.p+=PONTOS.e; b.p+=PONTOS.e; }
      }
    }
    const fora = Object.values(linhas);
    for(const l of fora) l.sg = l.gp - l.gc;
    const nome = id => (M().time(id)||{}).nome || id;
    fora.sort((a,b)=>{
      const d = (b.p-a.p) || (b.v-a.v) || (b.sg-a.sg) || (b.gp-a.gp);
      if(d) return d;
      return nome(a.id) < nome(b.id) ? -1 : 1;   /* último critério: ordem alfabética */
    });
    return fora;
  }

  /* =======================================================
     A SEMANA
     ======================================================= */
  const bonusTorcida = (E, casa, fora) =>
    (TO.torcedores ? TO.torcedores.bonusDoJogo(E, casa, fora) : 0);

  function jogarSemana(E, semana){
    const S = E.temporada;
    if(!S) return [];
    const feitos = [];
    for(const comp of S.competicoes){
      for(const r of comp.rodadas){
        if(r.semana !== semana) continue;
        for(const j of r.jogos){
          if(j.gc !== undefined && j.gc !== null) continue;
          const [a,b] = simular(j.c, j.f, bonusTorcida(E, j.c, j.f));
          j.gc = a; j.gf = b;
          feitos.push({comp:comp.id, ...j});
        }
      }
      for(const m of comp.mata){
        if(m.semana !== semana) continue;
        for(const j of m.jogos){
          if(!j.f) continue;                       // passou sem jogar
          if(j.gc !== undefined && j.gc !== null) continue;
          const [a,b] = simular(j.c, j.f, bonusTorcida(E, j.c, j.f));
          j.gc = a; j.gf = b;
          /* em ida e volta quem decide é o agregado, não a partida */
          if(m.perna !== 'ida' && m.perna !== 'volta'){
            j.venceu = a>b ? j.c : b>a ? j.f : penaltis(j.c, j.f);
            j.penaltis = a===b;
          }
          feitos.push({comp:comp.id, ...j});
        }
      }
      if(comp.copa) avancarCopa(E, comp, semana);
      else avancarFase(comp, semana);
    }
    return feitos;
  }

  /* fecha grupos e gera a chave; depois vai encurtando até a final */
  function avancarFase(comp, semana){
    if(comp.campeao) return;

    const gruposAcabaram = comp.rodadas.every(r=>
      r.jogos.every(j=>j.gc!==undefined && j.gc!==null));
    if(!gruposAcabaram) return;

    if(comp.pontosCorridos){
      /* pontos corridos não tem final: o líder é o campeão */
      const t = tabela(comp, 0);
      comp.campeao = t[0] && t[0].id;
      comp.vice    = t[1] && t[1].id;
      return;
    }

    /* alguma chave ainda rodando? */
    const ultima = comp.mata[comp.mata.length-1];
    if(ultima && ultima.jogos.some(j=>j.gc===undefined || j.gc===null)) return;

    let vivos;
    if(!ultima){
      vivos = [];
      comp.grupos.forEach((g, ig)=>{
        const t = tabela(comp, ig);
        vivos.push(...t.slice(0, comp.passam).map(l=>l.id));
      });
    }else{
      vivos = ultima.jogos.map(j=>j.venceu);
      if(vivos.length === 1){
        comp.campeao = vivos[0];
        const f = ultima.jogos[0];
        comp.vice = f.venceu===f.c ? f.f : f.c;
        return;
      }
    }
    if(vivos.length < 2) { comp.campeao = vivos[0] || null; return; }

    const NOMES = {2:'Final', 4:'Semifinal', 8:'Quartas', 16:'Oitavas', 32:'Primeira fase'};
    const jogos = [];
    /* melhor contra pior, o clássico chaveamento de copa */
    const ordem = [...vivos].sort((a,b)=>forca(b)-forca(a));
    for(let i=0;i<ordem.length/2;i++)
      jogos.push({c:ordem[i], f:ordem[ordem.length-1-i]});

    /* Com data de final marcada, a chave é contada de trás pra frente:
       a final na semana combinada, a semifinal na anterior e por aí.
       Sem data marcada (o playoff da Série D), emenda na semana seguinte. */
    const faltam = Math.ceil(Math.log2(vivos.length));   // rodadas até a final
    const quando = comp.finalEm
      ? Math.max(semana+1, comp.finalEm - (faltam-1))
      : semana+1;
    const grade = comp.grade || gradeDe(comp.nome, comp.tipo);
    jogos.forEach((j,k)=>{ const s = grade[k % grade.length]; j.d = s.d; j.h = s.h; });
    comp.mata.push({fase: NOMES[vivos.length] || `${vivos.length} clubes`,
                    semana: quando, dia: grade[0].d, jogos});
  }

  /* =======================================================
     CONSULTA
     ======================================================= */
  const temJogo = j => j && j.gc!==undefined && j.gc!==null;

  /* todos os compromissos de um clube no ano, em ordem de semana */
  function agendaDoClube(E, clubeId){
    const S = E.temporada;
    if(!S) return [];
    const fora = [];
    for(const comp of S.competicoes){
      const junta = (r, fase, mata)=>{
        for(const j of r.jogos){
          if(j.c!==clubeId && j.f!==clubeId) continue;
          if(!j.f) continue;                     /* passou sem adversário */
          const casa = j.c===clubeId;
          fora.push({semana:r.semana, dia:j.d || r.dia || comp.dia || DIA_FDS,
                     hora:j.h || '16:00',
                     comp:comp.nome, compId:comp.id,
                     tipo:comp.tipo, fase, mata:!!mata,
                     casa: j.neutro ? false : casa, neutro: j.neutro||null,
                     adversario: casa ? j.f : j.c,
                     gp: temJogo(j) ? (casa?j.gc:j.gf) : null,
                     gc: temJogo(j) ? (casa?j.gf:j.gc) : null,
                     jogado: temJogo(j), penaltis: !!j.penaltis,
                     agregado: j.agregado || null, venceu: j.venceu});
        }
      };
      comp.rodadas.forEach((r, i)=> junta(r,
        comp.grupos.length > 1 ? `Grupos · ${i+1}ª rodada` : `${i+1}ª rodada`, false));
      for(const m of comp.mata) junta(m, m.fase, true);
    }
    return fora.sort((a,b)=>a.semana-b.semana || a.dia-b.dia);
  }

  const jogosDaSemana = (E, clubeId, semana) =>
    agendaDoClube(E, clubeId).filter(j=>j.semana===semana);

  /* O jogo da semana pra torcida. Numa semana com rodada de pontos
     corridos e jogo de copa, o que vale é o mata-mata: é dele que o
     bairro fala a semana inteira. */
  function jogoDaSemana(E, clubeId, semana){
    const lista = jogosDaSemana(E, clubeId, semana);
    if(!lista.length) return null;
    const peso = j => (j.mata ? 2 : 0) + (j.dia===DIA_FDS ? 1 : 0);
    return lista.slice().sort((a,b)=>peso(b)-peso(a))[0];
  }

  /* competições rolando nesta semana, pra tela de calendário */
  function faseDaSemana(semana){
    return semana < INICIO_NACIONAL ? 'Regionais e estaduais' : 'Brasileirão';
  }

  /* =======================================================
     SOBE E DESCE (GDD §18.2 e as regras dos estaduais)
     Roda na virada do ano, antes de montar a temporada nova.
     ======================================================= */

  /* os melhores: em pontos corridos, o topo da tabela; em copa, quem
     chegou mais longe — campeão, vice e depois os semifinalistas */
  function melhores(comp, n){
    if(comp.pontosCorridos) return tabela(comp, 0).slice(0, n).map(l=>l.id);
    const fora = [];
    if(comp.campeao) fora.push(comp.campeao);
    if(comp.vice)    fora.push(comp.vice);
    for(let i=comp.mata.length-2; i>=0 && fora.length<n; i--){
      for(const j of comp.mata[i].jogos){
        const perdeu = j.venceu===j.c ? j.f : j.c;
        if(perdeu && !fora.includes(perdeu)) fora.push(perdeu);
      }
    }
    return fora.slice(0, n);
  }

  /* os piores: em grupo único, a lanterna; com grupos, o último de cada */
  function piores(comp, n){
    if(comp.grupos.length <= 1) return tabela(comp, 0).slice(-n).map(l=>l.id);
    const porGrupo = Math.max(1, Math.round(n/comp.grupos.length));
    const fora = [];
    comp.grupos.forEach((g, ig)=>
      fora.push(...tabela(comp, ig).slice(-porGrupo).map(l=>l.id)));
    return fora;
  }

  /* estaduais com acesso entre si */
  const ESCADA_REGIONAL = [
    {cima:'Paulistão',        baixo:'Paulistão A2',      troca:1},
    {cima:'Copa do Nordeste', baixo:'Nordestão Série B', troca:2}
  ];

  function aplicarSobeDesce(E){
    const S = E.temporada;
    if(!S) return [];
    const por = {};
    for(const c of S.competicoes) por[c.nome] = c;
    E.divisoes  = E.divisoes  || {};
    E.regionais = E.regionais || {};
    const mov = [];

    const mover = (mapa, ids, de, para)=>{
      for(const id of ids){
        if(!id) continue;
        mapa[id] = para;
        mov.push({ano:S.ano, id, de, para});
      }
    };

    /* Brasileirão: quatro sobem e quatro caem entre séries vizinhas.
       Da D ninguém cai — a Série E do GDD §18.2 não existe nos dados. */
    for(let i=0;i<ESCADA.length-1;i++){
      const cima = por[ESCADA[i]], baixo = por[ESCADA[i+1]];
      if(!cima || !baixo) continue;
      mover(E.divisoes, piores(cima, TROCA),   ESCADA[i],   ESCADA[i+1]);
      mover(E.divisoes, melhores(baixo, TROCA), ESCADA[i+1], ESCADA[i]);
    }

    for(const {cima, baixo, troca} of ESCADA_REGIONAL){
      const a = por[cima], b = por[baixo];
      if(!a || !b) continue;
      mover(E.regionais, piores(a, troca),   cima,  baixo);
      mover(E.regionais, melhores(b, troca), baixo, cima);
    }

    E.sobeDesce = (mov.concat(E.sobeDesce || [])).slice(0, 400);
    return mov;
  }

  /* a competição `para` está acima de `de`? serve pro texto do aviso */
  function subiu(de, para){
    const ordem = ESCADA.concat(ESCADA_REGIONAL.flatMap(x=>[x.cima, x.baixo]));
    const a = ordem.indexOf(de), b = ordem.indexOf(para);
    return a >= 0 && b >= 0 && b < a;
  }

  /* =======================================================
     RODADAS PRA TELA
     A rodada e o mata-mata viram uma lista só, na ordem em
     que acontecem, que é como o jogador pensa: "rodada 4 de
     38", não "grupos" e "chave" em lugares diferentes.
     ======================================================= */
  function etapas(comp){
    const dia = comp.dia || DIA_FDS;
    const fora = comp.rodadas.map((r,i)=>({
      rot:`Rodada ${i+1}`, semana:r.semana, dia, jogos:r.jogos, mata:false}));
    for(const m of comp.mata)
      fora.push({rot:m.fase, semana:m.semana, dia:m.dia||dia,
                 jogos:m.jogos, mata:true});
    return fora;
  }

  /* o dia de cada partida vive na própria partida (a rodada se espalha
     entre sábado e domingo), com a rodada como reserva */
  const diaDoJogo = (j, etapa) => (j && j.d) || (etapa && etapa.dia) || DIA_FDS;

  /* a primeira etapa que ainda não terminou; se acabou tudo, a última */
  function etapaAtual(comp){
    const es = etapas(comp);
    const i = es.findIndex(e=>e.jogos.some(j=>!temJogo(j)));
    return i < 0 ? es.length-1 : i;
  }

  /* O clube joga no dia 6 da semana — sábado no calendário do jogo, que
     é o dia que o GDD §3.1 reserva pro jogo. A hora varia por confronto
     só pra tabela não ficar com 38 linhas iguais. */
  const horaDoJogo = j => (j && j.h) || '16:00';

  return {montarTemporada, jogarSemana, tabela, agendaDoClube, jogoDaSemana,
          forcaDe, forcaBase, evoluirForca, usarSave,
          custoDoPonto, investir, invDe, TABELA_INVESTIMENTO,
          FORCA_MIN, FORCA_MAX,
          faseDaSemana, roundRobin, simular, etapas, etapaAtual, horaDoJogo,
          jogosDaSemana, COPA_FASES, COPA_NOME, DIA_FDS, DIA_MEIO,
          aplicarSobeDesce, subiu, divisaoDe, regionalDe, melhores, piores,
          rivaisDiretos, ajustarMandos, piorSequencia, piorSequenciaEmCasa, diaDoJogo,
          SEMANAS_ANO, INICIO_REGIONAL, INICIO_NACIONAL};
})();
