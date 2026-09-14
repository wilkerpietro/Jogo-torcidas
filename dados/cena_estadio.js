/* =========================================================
   O ESTÁDIO — uma planta só, lida por três leitores
   ---------------------------------------------------------
   Inspirado no Presidente Vargas (Fortaleza): estádio de
   bairro, baixo, de bacia retangular com as quinas
   arredondadas, pista avermelhada em volta do gramado,
   arquibancada azul, cobertura só de um lado e o muro com os
   portões dando na rua.

   A PERGUNTA QUE ESTA CENA FAZ, e que nenhuma outra fazia: a
   briga tem DOIS ANDARES. Arquibancada em cima, corredor
   embaixo, escada ligando. E `combate.js` é um tabuleiro
   plano de 1536 × 1024 — não tem andar, não tem altura, não
   tem escada. Mexer nele pra ter dois níveis é refazer a
   colisão, a malha, os campos de fluxo e a PM.

   A SAÍDA: o tabuleiro continua plano, e o que é plano no
   tabuleiro é DOBRADO no desenho. A arquibancada não fica
   "em cima" do corredor: fica ao lado dele na planta, e sobe
   no 3D. Quem anda do corredor pra arquibancada anda pra
   frente no tabuleiro e sobe no desenho. A escada é um
   retângulo andável como qualquer outro — o que faz dela
   escada é a função `piso`, e só ela.

   É a mesma regra que já valia: o que bloqueia a passagem é
   exatamente o que aparece na tela. Aqui ela ganha um irmão:
   a altura que o desenho mostra é exatamente a altura que a
   planta declara. Não existe degrau que só o olho vê.

   OS TRÊS LEITORES desta planta:
     · a máscara de caminhabilidade, gerada aqui mesmo, que é
       o que `combate.js` e `arredores.js` enxergam;
     · `estadio_pintura.js`, que pinta a cena de cima —
       e essa pintura é também a TEXTURA do 3D, projetada de
       cima, como o telhado dos arredores já era;
     · `estadio3d.js`, que levanta a bacia, o muro, a escada
       e a cobertura.
   Um número só, três lugares. Mudar `D.arq` aqui move a
   arquibancada nos três.

   A RÉGUA. O jogo inteiro é um tabuleiro, não um levantamento
   (ver docs/PLANO_CENA_3D.md §5): o disco tem raio 7 e uma
   pessoa tem 34 de altura. Então o gramado aqui é 496 × 320 e
   não 105 × 68 m — ele é grande o bastante pra ler como campo
   e pequeno o bastante pra sobrar arquibancada onde brigar. É
   a escolha (a) daquele documento, assumida: boneco de mesa
   vivo. O dia que a régua mudar, muda aqui, num lugar só.
   ========================================================= */
TO.dados = TO.dados || {};

TO.dados.plantaEstadio = (function(){
  const W = 1536, H = 1024, CEL = 8;
  const CX = W/2, CY = H/2;

  /* O RETÂNGULO DO GRAMADO é o molde de tudo: cada faixa do
     estádio é o conjunto dos pontos a uma certa distância DELE.
     Distância a um retângulo dá quina arredondada de graça — que
     é exatamente a forma da bacia na foto, e sai sem desenhar
     uma curva sequer. */
  const AX = 248, AY = 160;

  /* as faixas, medidas do gramado pra fora */
  const D = {
    pista:  26,    //   0 →  26  gramado e pista: não se pisa
    arq:   154,    //  26 → 154  arquibancada: 16 degraus de 8
    murof: 172,    // 154 → 172  muro de fundo, com vão na escada
    corr:  276,    // 172 → 276  o corredor
    muroe: 296     // 276 → 296  muro externo, com vão no portão
  };                //     296 →  a rua em volta

  const ALT = {
    degrau:  8,    // profundidade de um degrau (= a célula da malha)
    subida:  4,    // altura de um degrau
    base:    6,    // altura do primeiro degrau, sobre a pista
    topo:    6 + 15*4,   // 66 — o degrau de cima
    muroF:   82,   // o muro de fundo passa do topo da arquibancada
    muroE:   58,
    alambrado: 32, // a grade entre a pista e a arquibancada
    cobertura: 132 // a laje da coberta, sobre o lado oeste
  };
  const NDEG = (D.arq - D.pista) / ALT.degrau;    // 16

  /* =======================================================
     A DISTÂNCIA AO GRAMADO
     Zero dentro do retângulo; fora, a distância à borda. Nas
     quinas isso vira arco de raio d — a bacia arredondada.
     ======================================================= */
  function dist(x, y){
    const dx = Math.max(Math.abs(x-CX)-AX, 0);
    const dy = Math.max(Math.abs(y-CY)-AY, 0);
    return Math.hypot(dx, dy);
  }

  /* =======================================================
     O PERFIL, e por que ele existe
     Todo anel do estádio — degrau, muro, pista, laje — é a
     MESMA volta em torno do gramado, empurrada pra fora por
     uma distância diferente. Então a volta se amostra uma vez
     só, com o ponto e a normal de saída de cada amostra, e
     `anel(d)` é `ponto + normal·d`.

     Duas consequências boas: os anéis têm todos o mesmo número
     de amostras, na mesma ordem, então o degrau de cima casa
     com o de baixo vértice a vértice (é o que deixa a bacia
     sair numa malha só); e a pintura 2D e a geometria 3D
     desenham a MESMA curva, porque chamam a mesma função.
     ======================================================= */
  const PERFIL = (function(){
    const p = [];
    const PASSO = 16;   // amostragem dos lados retos
    const ARCO  = 24;   // amostras por quina
    const push = (x,y,nx,ny) => p.push({x, y, nx, ny});
    const reta = (x0,y0,x1,y1,nx,ny) => {
      const n = Math.max(1, Math.round(Math.hypot(x1-x0, y1-y0)/PASSO));
      for(let i=0;i<n;i++) push(x0+(x1-x0)*i/n, y0+(y1-y0)*i/n, nx, ny);
    };
    const quina = (cx,cy,a0) => {
      for(let i=0;i<ARCO;i++){
        const a = a0 + (Math.PI/2)*(i/ARCO);
        push(cx, cy, Math.cos(a), Math.sin(a));
      }
    };
    /* no sentido do relógio na tela (x pra direita, y pra baixo) */
    reta(CX-AX, CY-AY, CX+AX, CY-AY,  0,-1);            // norte
    quina(CX+AX, CY-AY, -Math.PI/2);                     // nordeste
    reta(CX+AX, CY-AY, CX+AX, CY+AY,  1, 0);            // leste
    quina(CX+AX, CY+AY, 0);                              // sudeste
    reta(CX+AX, CY+AY, CX-AX, CY+AY,  0, 1);            // sul
    quina(CX-AX, CY+AY, Math.PI/2);                      // sudoeste
    reta(CX-AX, CY+AY, CX-AX, CY-AY, -1, 0);            // oeste
    quina(CX-AX, CY-AY, Math.PI);                        // noroeste
    return p;
  })();
  const N = PERFIL.length;
  const anel = d => PERFIL.map(q => [q.x + q.nx*d, q.y + q.ny*d]);

  /* =======================================================
     OS QUATRO LADOS, em coordenada local

     Escada e portão moram nos lados retos, e é mais fácil
     descrevê-los em (s, t) — s ao longo do lado, t pra fora a
     partir da face externa do muro de fundo — do que em quatro
     casos de x e y espalhados pelo arquivo.
     ======================================================= */
  const LADOS = {
    n: { eixo:'x', base: CY-AY-D.murof, sinal:-1 },   // t cresce pra cima da tela
    s: { eixo:'x', base: CY+AY+D.murof, sinal: 1 },
    o: { eixo:'y', base: CX-AX-D.murof, sinal:-1 },
    l: { eixo:'y', base: CX+AX+D.murof, sinal: 1 }
  };
  /* (s,t) → (x,y) */
  function mundo(lado, s, t){
    const L = LADOS[lado];
    const u = L.base + L.sinal*t;
    return L.eixo === 'x' ? [s, u] : [u, s];
  }
  /* (x,y) → (s,t) */
  function local(lado, x, y){
    const L = LADOS[lado];
    return L.eixo === 'x' ? [x, (y - L.base)*L.sinal] : [y, (x - L.base)*L.sinal];
  }
  /* a normal de saída do lado, no mundo */
  const NORMAL = { n:[0,-1], s:[0,1], o:[-1,0], l:[1,0] };

  /* =======================================================
     A ESCADA

     Lance reto encostado no muro de fundo, subindo ao longo do
     corredor, e um patamar no alto que atravessa o muro e cai
     no degrau de cima da arquibancada. É o vomitório de
     qualquer estádio, e a razão de ele ser ASSIM e não radial
     é aritmética: o topo está a 66 de altura e o corredor tem
     104 de profundidade. Uma escada radial teria que vencer 66
     em menos de 104 e sairia a 40 graus — rampa de muro. De
     lado, o lance tem 144 de tiro pra 66 de subida: 25 graus,
     que é escada de gente.

     O CORRIMÃO NÃO É ENFEITE, e é o que faz a cena. Ele fecha
     o lado comprido do lance e a ponta de cima, então só se
     entra pelo pé da escada. Uma escada com três entradas é um
     corredor; com uma, é um funil — e o funil é onde a briga
     de arquibancada acontece de verdade. Ele está na MÁSCARA,
     não só no desenho: quem vê corrimão não passa por ele.
     ======================================================= */
  const ESC = {
    fundo:   36,    // largura útil do lance (profundidade no corredor)
    corrim:  12,    // espessura do corrimão
    patamar: 40,    // o descanso do alto, que é também o vão do muro
    lance:  144,    // o tiro que sobe
    degraus: 18
  };
  const ESC_COMP = ESC.lance + ESC.patamar;   // 184

  /* `sobe:+1` → o patamar fica na ponta `b`; `−1` → na ponta `a` */
  const ESCADAS = [
    { lado:'n', a: 548, b: 548+ESC_COMP, sobe:-1 },
    { lado:'n', a: 804, b: 804+ESC_COMP, sobe:+1 },
    { lado:'s', a: 548, b: 548+ESC_COMP, sobe:-1 },
    { lado:'s', a: 804, b: 804+ESC_COMP, sobe:+1 },
    { lado:'o', a: 400, b: 400+ESC_COMP, sobe:+1 },
    { lado:'l', a: 440, b: 440+ESC_COMP, sobe:-1 }
  ].map(e => Object.assign(e, {
    /* onde fica o patamar (e portanto o vão no muro) */
    pa: e.sobe > 0 ? e.b - ESC.patamar : e.a,
    pb: e.sobe > 0 ? e.b               : e.a + ESC.patamar,
    /* o pé, por onde se entra */
    pe: e.sobe > 0 ? e.a : e.b
  }));

  /* altura do lance na coordenada s */
  function alturaEscada(e, s){
    const u = e.sobe > 0 ? (s - e.a) / ESC.lance : (e.b - s) / ESC.lance;
    if(u >= 1) return ALT.topo;
    if(u <= 0) return 0;
    /* degrau é degrau: a altura é em degrau, não em rampa. O pé
       sobe um degrau inteiro de uma vez, como sobe na vida. */
    return Math.min(ALT.topo, ALT.topo * Math.ceil(u*ESC.degraus) / ESC.degraus);
  }

  /* onde (x,y) cai em relação a uma escada */
  function ondeNaEscada(e, x, y){
    const [s, t] = local(e.lado, x, y);
    if(s < e.a - ESC.corrim || s > e.b + ESC.corrim) return null;
    if(t < -(D.murof - D.arq) || t > ESC.fundo + ESC.corrim) return null;
    /* o vão que atravessa o muro, no alto */
    if(t < 0) return (s >= e.pa && s <= e.pb) ? {s, t, vao:true} : null;
    /* o corrimão: o lado comprido e a ponta de cima */
    const naPonta = e.sobe > 0 ? (s > e.b) : (s < e.a);
    if(t > ESC.fundo || naPonta) return {s, t, corrim:true};
    if(s < e.a || s > e.b) return null;
    return {s, t, lance:true};
  }

  /* =======================================================
     OS PORTÕES — os vãos do muro externo
     ======================================================= */
  const PORTOES = [
    { id:'portao_oeste', lado:'o', c:CY, larg:88, rot:'PORTÃO 1', time:'mandante'  },
    { id:'portao_leste', lado:'l', c:CY, larg:88, rot:'PORTÃO 4', time:'visitante' },
    { id:'portao_norte', lado:'n', c:CX, larg:88, rot:'PORTÃO 2', time:'neutro'    },
    { id:'portao_sul',   lado:'s', c:CX, larg:88, rot:'PORTÃO 3', time:'neutro'    }
  ].map(p => {
    /* o marcador fica no meio do vão, e a direção é a normal do lado */
    const [x, y] = mundo(p.lado, p.c, (D.corr + D.muroe)/2 - D.murof);
    return Object.assign(p, { x: Math.round(x), y: Math.round(y), dir: NORMAL[p.lado] });
  });
  function noPortao(x, y){
    for(const p of PORTOES){
      const [s, t] = local(p.lado, x, y);
      if(Math.abs(s - p.c) <= p.larg/2 && t > 0) return true;
    }
    return false;
  }

  /* =======================================================
     O QUE SE PISA
     ======================================================= */
  function anda(x, y){
    for(const e of ESCADAS){
      const q = ondeNaEscada(e, x, y);
      if(!q) continue;
      if(q.corrim) return false;
      return true;
    }
    const d = dist(x, y);
    if(d < D.pista)  return false;   // gramado e pista
    if(d < D.arq)    return true;    // arquibancada
    if(d < D.murof)  return false;   // muro de fundo
    if(d < D.corr)   return true;    // corredor
    if(d < D.muroe)  return noPortao(x, y);
    return true;                      // a rua
  }

  /* =======================================================
     A ALTURA DO PISO — a função que faz o estádio ter andar
     ======================================================= */
  function piso(x, y){
    for(const e of ESCADAS){
      const q = ondeNaEscada(e, x, y);
      if(!q) continue;
      if(q.vao) return ALT.topo;
      return alturaEscada(e, q.s);
    }
    const d = dist(x, y);
    if(d < D.pista) return 0;
    if(d < D.arq){
      const i = Math.min(NDEG-1, Math.floor((d - D.pista) / ALT.degrau));
      return ALT.base + ALT.subida*i;
    }
    if(d < D.murof) return ALT.topo;   // a beirada do muro, por continuidade
    return 0;                           // corredor e rua
  }

  /* a altura do que ATRAPALHA, que é outra coisa: a câmera de
     ombro anda por aqui pra não entrar em muro */
  function obstaculo(x, y){
    for(const e of ESCADAS){
      const q = ondeNaEscada(e, x, y);
      if(q && q.corrim) return alturaEscada(e, q.s) + 20;
      if(q) return piso(x, y);
    }
    const d = dist(x, y);
    if(d < D.pista) return d > D.pista - 10 ? ALT.alambrado : 0;
    if(d < D.arq)   return piso(x, y);
    if(d < D.murof) return ALT.muroF;
    if(d < D.corr)  return 0;
    if(d < D.muroe) return noPortao(x, y) ? 0 : ALT.muroE;
    return 0;
  }

  /* =======================================================
     A MÁSCARA
     O mesmo formato que `arredores.codificarMascara` cospe:
     corridas alternadas a partir do 0, linha a linha. Gerada
     aqui, na carga, em vez de colada num arquivo — porque
     colada ela envelhece na primeira vez que alguém mudar um
     número lá em cima, e aí a planta e a colisão passam a
     discordar sem ninguém perceber.
     ======================================================= */
  function mascara(){
    const COLS = Math.ceil(W/CEL), ROWS = Math.ceil(H/CEL);
    const linhas = [];
    for(let r=0;r<ROWS;r++){
      const y = (r+0.5)*CEL;
      const runs = []; let atual = 0, cont = 0;
      for(let c=0;c<COLS;c++){
        const v = anda((c+0.5)*CEL, y) ? 1 : 0;
        if(v === atual) cont++;
        else { runs.push(cont); atual = v; cont = 1; }
      }
      runs.push(cont);
      linhas.push(runs.join(','));
    }
    return linhas.join(';');
  }

  return { W, H, CEL, CX, CY, AX, AY, D, ALT, NDEG, N,
           dist, anel, PERFIL, LADOS, NORMAL, mundo, local,
           ESC, ESCADAS, alturaEscada, ondeNaEscada,
           PORTOES, noPortao, anda, piso, obstaculo, mascara };
})();

/* =========================================================
   A CENA
   ========================================================= */
TO.dados.cenaEstadio = (function(){
  const P = TO.dados.plantaEstadio;
  const { W, H, CEL, CX, CY, AX, AY, D } = P;

  /* o marcador de cada bonde. Dois de casa e dois deles: os de
     casa chegam pelo corredor oeste e sobem; eles já estão no
     setor de cima, no lado leste, que é o setor visitante. */
  /* ONDE CADA BONDE NASCE, e por que foi mudado depois de olhar.
     A primeira versão punha o nosso primeiro escalão no corredor, a
     270 — e o corredor tem 104 de fundo. Trinta pessoas em formação
     não cabem em 104: metade era empurrada pro vão do portão e nascia
     na RUA, de costas pro estádio. Agora cada lado nasce na
     arquibancada, que é larga, e o segundo escalão é que fica no
     corredor. Isso também põe a briga onde ela foi pedida: os dois
     setores de frente um pro outro, com o corredor e a escada como o
     caminho de quem flanqueia ou de quem corre. */
  const spawns = [
    { id:'mandante1', rot:'1º ESCALÃO', lado:'mandante', x:430, y:560,
      jogador:true, entrada:'portao_oeste' },
    { id:'mandante2', rot:'2º ESCALÃO', lado:'mandante', x:300, y:700,
      entrada:'portao_oeste' },
    { id:'visitante1', rot:'SETOR VISITANTE', lado:'visitante', x:1106, y:400,
      guarda:true, entrada:'portao_leste' },
    { id:'visitante2', rot:'RETAGUARDA', lado:'visitante', x:1240, y:700,
      guarda:true, entrada:'portao_leste' }
  ];

  const entradas = P.PORTOES.map(p => ({
    id:p.id, rot:p.rot, lado:p.time, x:p.x, y:p.y, raio:46, dir:p.dir
  }));

  /* a PM fica no corredor, um posto por lado, longe do pé das
     escadas — é de lá que ela sobe quando o alerta estoura */
  const pmPostos = [
    { x:768, y:90 }, { x:768, y:934 }, { x:262, y:512 }, { x:1274, y:512 }
  ];

  /* Grade que quebra e vira arma (GDD §12). Duas no corredor,
     onde a PM monta o cordão, e duas na arquibancada, deitadas
     ao longo de um degrau — ao longo, e não atravessando, porque
     atravessando a grade teria que subir 16 degraus e ela é um
     bloco só. */
  const grades = [
    { id:'cordao_norte', rot:'CORDÃO DA PM',
      de:{x:600,y:90},  ate:{x:740,y:90},  modulos:3, espessura:9 },
    { id:'cordao_sul',   rot:'CORDÃO DA PM',
      de:{x:840,y:934}, ate:{x:980,y:934}, modulos:3, espessura:9 },
    { id:'divisa_norte', rot:'DIVISA DE SETOR',
      de:{x:610,y:282}, ate:{x:750,y:282}, modulos:3, espessura:9 },
    { id:'divisa_sul',   rot:'DIVISA DE SETOR',
      de:{x:800,y:742}, ate:{x:940,y:742}, modulos:3, espessura:9 }
  ];

  return {
    id:'estadio', nome:'Estádio', pintura:'estadio',
    largura:W, altura:H, celula:CEL, imagem:null,
    /* A MÁSCARA MANDA, e os polígonos são só o que o editor F2
       precisa ter pra abrir a cena sem engasgar. A planta é
       curva; polígono não descreve curva sem cem vértices. */
    poligonos:{
      caminhavel:[{rot:'chão', pontos:[[0,0],[W,0],[W,H],[0,H]]}],
      bloqueio:[]
    },
    mascara: P.mascara(),
    local:'No estádio',
    /* Aqui dentro a tropa de choque já está de prontidão: é jogo,
       não é esbarrão de rua. */
    tropaChoque:true,
    saida:{ perto:'Sair pelo portão', longe:'Portão (leve o líder)',
            feito:'sua torcida saiu do estádio com a arquibancada na mão',
            dica:'Leve o líder até o portão da sua torcida.' },
    enfeites:[], varais:[],
    spawns, entradas, pmPostos, grades,
    /* O setor deles não se mexe até alguém chegar perto: eles
       estão no lugar deles, vendo o jogo. Quem sobe a escada é
       que começa a noite. */
    gatilho:{ lado:'mandante', perto:300, rot:'DE OLHO',
              espera:'o setor deles ainda não se mexeu',
              aviso:'o setor deles viu o bonde subir' },
    /* a planta viaja junto com a cena: é dela que o desenhista
       3D tira o degrau, a escada e o muro */
    planta: P
  };
})();

/* Entra no mapa de cenas sem que `cenas.js` precise saber que
   este arquivo existe — basta ser carregado depois dele. É o
   mesmo contrato de `cenas_foto.js` e `cenas_editadas.js`: quem
   chega depois acrescenta. */
TO.dados.cenas = TO.dados.cenas || {};
TO.dados.cenas.estadio = TO.dados.cenaEstadio;
