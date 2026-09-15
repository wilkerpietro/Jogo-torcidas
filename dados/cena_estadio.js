/* =========================================================
   O ESTÁDIO E O BAIRRO — a planta
   ---------------------------------------------------------
   Estádio de bairro, bacia retangular de quinas redondas,
   arquibancada única de concreto sem cobertura, corredor
   EMBAIXO dela com comércio, oito vomitórios furando a
   arquibancada, três portões — um atrás de cada gol e um na
   lateral sul — e oito quarteirões em volta, com o estádio no
   meio. A torcida nasce nas pontas do bairro, caminha até o
   estádio e a briga acontece onde ela acontecer: na rua, no
   portão, no corredor, na escada ou na arquibancada.

   O PROBLEMA, de novo: `combate.js` é um tabuleiro plano —
   uma célula, um lugar, sem altura — e o corredor fica
   debaixo da arquibancada. A saída continua sendo DOBRAR O
   TABULEIRO: duas faixas distantes dele caem no mesmo ponto do
   mundo em alturas diferentes. É `mundo(x, y) → {x, y, z}`.

   O QUE MUDOU NA DOBRA: quem paga a conta agora é o GRAMADO.
   Na versão anterior o corredor empurrava tudo que estava do
   lado de fora pra longe do centro, em curva — e uma rua reta
   atravessando isso entortava. Agora o retângulo âncora do
   tabuleiro é 86 menor por lado que o gramado do mundo;
   ninguém pisa no gramado, então não custa nada. Resultado:
   FORA DO ESTÁDIO, TABULEIRO = MUNDO. Rua reta é rua reta.

   A dobra, faixa por faixa. `d` é a distância ao retângulo
   âncora no TABULEIRO; `r` é a distância ao gramado no MUNDO.

     faixa          d            r              altura
     pista          0 → 24       r = d          0         bloqueia
     ARQUIBANCADA   24 → 168     r = d          6 → 84    ANDA (18 degraus)
     parapeito      168 → 182    r = d          84 → 110  bloqueia
     CORREDOR       182 → 310    r = d − 86     0         ANDA ← sob a arquibancada
     fachada        310 → 326    r = d − 86     0 → 84    bloqueia, com 3 portões
     calçada        326 → 358    r = d − 86     0         ANDA
     bairro         358 →        mundo = tabuleiro         ANDA, menos prédio e carro

   Nos lados retos "r = d − 86" É a identidade (o âncora está
   86 pra dentro). Só nas quatro quinas redondas os dois mapas
   divergem, e a lasca onde divergem — de até 36 unidades, na
   diagonal — fica BLOQUEADA, atrás de um gradil de esquina.
   Ninguém pisa, ninguém vê, e é isso que mantém "uma célula,
   um lugar" verdadeiro.

   O VOMITÓRIO continua sendo uma tira radial do tabuleiro que
   atravessa da arquibancada até o corredor. A regra que não
   se burla: o pé da escada, no mundo, tem de cair DEPOIS da
   última fila (192 > 168) — senão sobra arquibancada que se vê
   e não se pisa.

   TRÊS LEITORES desta planta: a máscara (gerada na carga, é o
   que `combate.js` enxerga), a pintura do chão e a geometria
   3D. Um número, três lugares — prédio inclusive.
   ========================================================= */
TO.dados = TO.dados || {};

TO.dados.plantaEstadio = (function(){
  const CEL = 8;

  /* =======================================================
     AS MEDIDAS
     ======================================================= */
  const AX = 320, AY = 208;            // meio gramado, no MUNDO (640 × 416)
  const DOBRA = 86;                    // o que o gramado engole
  const AXb = AX - DOBRA, AYb = AY - DOBRA;   // 234 × 122 — o âncora do TABULEIRO

  /* as bordas das faixas, no tabuleiro (distância ao âncora) */
  const D = { pista:24, arq:168, parapeito:182, corred:310, fachada:326, calcada:358 };
  /* onde cada faixa cai no mundo (distância ao gramado) */
  const R = {
    corred0: D.parapeito - DOBRA, corred1: D.corred - DOBRA,     // 96 → 224
    fachada0: D.corred - DOBRA,   fachada1: D.fachada - DOBRA,   // 224 → 240
    calcada0: D.fachada - DOBRA,  calcada1: D.calcada - DOBRA    // 240 → 272
  };

  /* o bairro: grade 3 × 3, estádio no meio, rua em volta de tudo */
  const RUA = 72, CALC = 32, PONTA = 560, NS = 400;
  const QEST = { larg: 2*(AX + R.calcada1), alt: 2*(AY + R.calcada1) };   // 1184 × 960
  const W = RUA + PONTA + RUA + QEST.larg + RUA + PONTA + RUA;            // 2592
  const H = RUA + NS + RUA + QEST.alt + RUA + NS + RUA;                    // 2048
  const CX = W/2, CY = H/2;

  const ALT = {
    degrau: 8, subida: 4.6, base: 6, laje: 8,
    alambrado: 30, torre: 310
  };
  const NDEG = (D.arq - D.pista) / ALT.degrau;              // 18
  const TOPO_ARQ = ALT.base + ALT.subida*(NDEG-1);          // 84,2
  ALT.parapeito = TOPO_ARQ + 26;                            // a mureta atrás da última fila
  ALT.fachada = TOPO_ARQ;                                   // o topo da arcada
  const ARCADA = { mureta: 24, pilar: 18, passo: 84 };
  const METRO = 34 / 1.75;                                  // o boneco tem 34 pra 1,75 m

  function alturaDegrau(r){
    const i = Math.max(0, Math.min(NDEG-1, Math.floor((r - D.pista)/ALT.degrau)));
    return ALT.base + ALT.subida*i;
  }
  /* o fundo da laje: sob a arquibancada acompanha o degrau; da
     última fila até a fachada é teto plano */
  const tetoDe = r => (r < D.arq ? alturaDegrau(r) : TOPO_ARQ) - ALT.laje;

  /* =======================================================
     O PONTO DO RETÂNGULO E A NORMAL — dois retângulos
     `ancora` é do tabuleiro (âncora pequeno); `ancoraMundo` é
     do mundo (gramado). `sx, sy` dizem de que lado o ponto
     está, e é com eles que o âncora pequeno vira o grande.
     ======================================================= */
  const presa = (v, a, b) => v < a ? a : v > b ? b : v;
  function ancorar(x, y, ax, ay){
    const cx = presa(x, CX-ax, CX+ax), cy = presa(y, CY-ay, CY+ay);
    const dx = x - cx, dy = y - cy;
    const d = Math.hypot(dx, dy);
    const sx = x > CX+ax ? 1 : x < CX-ax ? -1 : 0;
    const sy = y > CY+ay ? 1 : y < CY-ay ? -1 : 0;
    return d > 0.0001 ? {cx, cy, d, nx: dx/d, ny: dy/d, sx, sy}
                      : {cx, cy, d: 0, nx: 0, ny: 0, sx, sy};
  }
  const ancora      = (x, y) => ancorar(x, y, AXb, AYb);
  const ancoraMundo = (X, Z) => ancorar(X, Z, AX, AY);
  const dist      = (x, y) => ancora(x, y).d;
  const distMundo = (X, Z) => ancoraMundo(X, Z).d;

  /* o perfil do MUNDO: a volta em torno do gramado, amostrada */
  const PERFIL = (function(){
    const p = [];
    const PASSO = 14, ARCO = 26;
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
    reta(CX-AX, CY-AY, CX+AX, CY-AY,  0,-1);
    quina(CX+AX, CY-AY, -Math.PI/2);
    reta(CX+AX, CY-AY, CX+AX, CY+AY,  1, 0);
    quina(CX+AX, CY+AY, 0);
    reta(CX+AX, CY+AY, CX-AX, CY+AY,  0, 1);
    quina(CX-AX, CY+AY, Math.PI/2);
    reta(CX-AX, CY+AY, CX-AX, CY-AY, -1, 0);
    quina(CX-AX, CY-AY, Math.PI);
    return p;
  })();
  const N = PERFIL.length;
  const anel = r => PERFIL.map(q => [q.x + q.nx*r, q.y + q.ny*r]);

  /* =======================================================
     OS LADOS RETOS — onde moram vomitório, portão e loja.
     `s` (a posição ao longo do lado) é a MESMA no tabuleiro e
     no mundo: o âncora pequeno e o gramado têm o mesmo centro.
     ======================================================= */
  const LADOS = { n:{eixo:'x', sinal:-1}, s:{eixo:'x', sinal:1},
                  o:{eixo:'y', sinal:-1}, l:{eixo:'y', sinal:1} };
  function pontoEm(lado, s, dist, ax, ay){
    const L = LADOS[lado];
    if(L.eixo === 'x') return [s, (L.sinal<0 ? CY-ay-dist : CY+ay+dist)];
    return [(L.sinal<0 ? CX-ax-dist : CX+ax+dist), s];
  }
  const ponto      = (lado, s, d) => pontoEm(lado, s, d, AXb, AYb);   // tabuleiro
  const pontoMundo = (lado, s, r) => pontoEm(lado, s, r, AX, AY);     // mundo
  function ondeEm(x, y, ax, ay){
    if(x >= CX-ax && x <= CX+ax){
      if(y < CY-ay) return {lado:'n', s:x, d:(CY-ay)-y};
      if(y > CY+ay) return {lado:'s', s:x, d:y-(CY+ay)};
    }
    if(y >= CY-ay && y <= CY+ay){
      if(x < CX-ax) return {lado:'o', s:y, d:(CX-ax)-x};
      if(x > CX+ax) return {lado:'l', s:y, d:x-(CX+ax)};
    }
    return null;      // quina
  }
  const ondeNoReto      = (x, y) => ondeEm(x, y, AXb, AYb);
  const ondeNoRetoMundo = (X, Z) => ondeEm(X, Z, AX, AY);

  /* =======================================================
     OS VOMITÓRIOS — oito, como na foto aérea
     A boca fica no 11º degrau (r = 112, altura 56,6) e a escada
     desce PRA FORA, sob a arquibancada, até o chão do corredor
     em r = 192: 80 de tiro pra 57 de queda, 35 graus, doze
     degraus. Sobe-se de frente pro gramado, como no estádio de
     verdade. A régua da prancha de vomitório: guarda-corpo de
     concreto a 0,90 m, corrimão a 1,10 m, faixa amarela no
     nariz, corrimão central partindo a escada ao meio.
     ======================================================= */
  const VOM = {
    dTop: 112, dFoot: 278,     // no tabuleiro
    larg: 44, corrim: 6,       // largura útil e a mureta de cada lado
    degraus: 12,
    capuz: 152,                // daqui pra fora a laje volta por cima (raio do mundo; borda de degrau)
    guarda: 0.90 * METRO, mao: 1.10 * METRO, faixa: 0.05 * METRO * 1.6
  };
  VOM.rTop  = VOM.dTop;                      // 112
  VOM.rFoot = VOM.dFoot - DOBRA;             // 192 — DEPOIS da última fila
  VOM.yTop  = alturaDegrau(VOM.rTop);        // 56,6

  const VOMITORIOS = [
    { lado:'n', c: CX-192 }, { lado:'n', c: CX+192 },
    { lado:'s', c: CX-192 }, { lado:'s', c: CX+192 },
    { lado:'o', c: CY-90  }, { lado:'o', c: CY+90  },
    { lado:'l', c: CY-90  }, { lado:'l', c: CY+90  }
  ].map((v, i) => Object.assign(v, {
    id: 'vom' + i,
    s0: v.c - VOM.larg/2, s1: v.c + VOM.larg/2,
    e0: v.c - VOM.larg/2 - VOM.corrim, e1: v.c + VOM.larg/2 + VOM.corrim
  }));

  function noVomitorio(x, y){
    const q = ondeNoReto(x, y);
    if(!q || q.d < VOM.dTop || q.d > VOM.dFoot) return null;
    for(const v of VOMITORIOS){
      if(v.lado !== q.lado) continue;
      if(q.s < v.e0 || q.s > v.e1) continue;
      const dentro = q.s >= v.s0 && q.s <= v.s1;
      return { v, s:q.s, d:q.d, corrim: !dentro };
    }
    return null;
  }
  /* a rampa: onde no mundo cai a distância `d` de tabuleiro.
     Degrau é degrau: a altura desce em degrau, não em rampa. */
  function rampa(d){
    const t = (d - VOM.dTop) / (VOM.dFoot - VOM.dTop);
    const r = VOM.rTop + (VOM.rFoot - VOM.rTop)*t;
    const k = Math.ceil(t*VOM.degraus) / VOM.degraus;
    return { r, y: VOM.yTop*(1 - k) };
  }
  /* a altura do piso da escada no raio r do mundo */
  function pisoEscada(r){
    const t = (r - VOM.rTop) / (VOM.rFoot - VOM.rTop);
    const k = Math.ceil(Math.max(0, Math.min(1, t))*VOM.degraus) / VOM.degraus;
    return VOM.yTop*(1 - k);
  }

  /* =======================================================
     OS PORTÕES — três vãos na fachada
     ======================================================= */
  const PORTOES = [
    { id:'portao_oeste', lado:'o', c:CY, larg:80, rot:'PORTÃO OESTE', time:'mandante'  },
    { id:'portao_leste', lado:'l', c:CY, larg:80, rot:'PORTÃO LESTE', time:'visitante' },
    { id:'portao_sul',   lado:'s', c:CX, larg:80, rot:'PORTÃO SUL',   time:'neutro'    }
  ].map(p => {
    const d = (D.corred + D.fachada)/2;
    const [x, y] = ponto(p.lado, p.c, d);
    const [xm, zm] = pontoMundo(p.lado, p.c, d - DOBRA);
    const L = LADOS[p.lado];
    return Object.assign(p, { x:Math.round(x), y:Math.round(y), xm, zm,
      dir: L.eixo==='x' ? [0, L.sinal] : [L.sinal, 0] });
  });
  function portaoEm(q){
    if(!q) return null;
    for(const p of PORTOES)
      if(p.lado === q.lado && Math.abs(q.s - p.c) <= p.larg/2) return p;
    return null;
  }
  const noPortao      = (x, y) => !!portaoEm(ondeNoReto(x, y));         // tabuleiro
  const noPortaoMundo = (X, Z) => !!portaoEm(ondeNoRetoMundo(X, Z));    // mundo

  /* =======================================================
     O COMÉRCIO DO CORREDOR — encostado na parede de dentro,
     que é onde a arquibancada baixa é maciça. Está na MÁSCARA,
     não só no desenho: o corpo esbarra no balcão.
     ======================================================= */
  const LOJA = {
    pipoca:   { fundo:14, larg:26, rot:'PIPOCA' },
    lanche:   { fundo:18, larg:56, rot:'LANCHE' },
    bar:      { fundo:18, larg:64, rot:'CERVEJA' },
    banheiro: { fundo:22, larg:70, rot:'BANHEIRO' },
    loja:     { fundo:18, larg:60, rot:'LOJA DA TORCIDA' },
    cachorro: { fundo:14, larg:30, rot:'CACHORRO-QUENTE' }
  };
  const LOJAS = [
    { lado:'n', c: CX-118, tipo:'lanche'   }, { lado:'n', c: CX, tipo:'pipoca'   },
    { lado:'n', c: CX+118, tipo:'bar'      },
    { lado:'s', c: CX-118, tipo:'banheiro' }, { lado:'s', c: CX, tipo:'cachorro' },
    { lado:'s', c: CX+118, tipo:'loja'     },
    { lado:'o', c: CY,     tipo:'pipoca'   }, { lado:'l', c: CY, tipo:'cachorro' }
  ].map(o => {
    const L = LOJA[o.tipo];
    return Object.assign({}, o, L, { d0: D.parapeito, d1: D.parapeito + L.fundo,
      r0: R.corred0, r1: R.corred0 + L.fundo,
      s0: o.c - L.larg/2, s1: o.c + L.larg/2 });
  });
  function naLoja(x, y){
    const q = ondeNoReto(x, y);
    if(!q) return null;
    for(const o of LOJAS)
      if(o.lado === q.lado && q.s >= o.s0 && q.s <= o.s1 &&
         q.d >= o.d0 && q.d <= o.d1) return o;
    return null;
  }

  /* =======================================================
     O BAIRRO
     Oito quarteirões em volta do estádio. Cada um tem calçada
     de 24 em volta e, dentro, LOTES de frente contínua — casa,
     sobrado, prédio, um muro de vez em quando — como um
     quarteirão de bairro de estádio. O miolo é quintal, murado.
     Tudo que está aqui bloqueia na máscara e sai no 3D.
     ======================================================= */
  const QEST_X0 = CX - QEST.larg/2, QEST_X1 = CX + QEST.larg/2;
  const QEST_Y0 = CY - QEST.alt/2,  QEST_Y1 = CY + QEST.alt/2;
  const QUADRAS = [
    { id:'NO', x0: RUA,              x1: RUA+PONTA,      y0: RUA,              y1: RUA+NS },
    { id:'N',  x0: QEST_X0,          x1: QEST_X1,        y0: RUA,              y1: RUA+NS },
    { id:'NE', x0: QEST_X1+RUA,      x1: QEST_X1+RUA+PONTA, y0: RUA,           y1: RUA+NS },
    { id:'O',  x0: RUA,              x1: RUA+PONTA,      y0: QEST_Y0,          y1: QEST_Y1 },
    { id:'L',  x0: QEST_X1+RUA,      x1: QEST_X1+RUA+PONTA, y0: QEST_Y0,       y1: QEST_Y1 },
    { id:'SO', x0: RUA,              x1: RUA+PONTA,      y0: QEST_Y1+RUA,      y1: QEST_Y1+RUA+NS },
    { id:'S',  x0: QEST_X0,          x1: QEST_X1,        y0: QEST_Y1+RUA,      y1: QEST_Y1+RUA+NS },
    { id:'SE', x0: QEST_X1+RUA,      x1: QEST_X1+RUA+PONTA, y0: QEST_Y1+RUA,   y1: QEST_Y1+RUA+NS }
  ].map(q => Object.assign(q, { ix0: q.x0+CALC, ix1: q.x1-CALC, iy0: q.y0+CALC, iy1: q.y1-CALC }));

  /* sorteio com semente: a planta tem de sair IGUAL toda vez,
     porque a máscara e o desenho nascem dela separados */
  function semente(a){
    return function(){
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const rng = semente(20260915);
  const entre = (a, b) => a + rng()*(b - a);
  const escolher = l => l[Math.floor(rng()*l.length)];
  const par8 = v => Math.round(v/8)*8;

  const TIPOS = {
    casa:    { alt:[34, 48],  cor:['#e8dcc0','#d9c9a3','#e2b9a6','#cfd8c9','#e6e2d6','#d8c8b0'] },
    sobrado: { alt:[58, 76],  cor:['#e3d3b2','#c9b48a','#d4a48f','#b7c4c2','#ded9cd'] },
    predio:  { alt:[96, 150], cor:['#cfcac0','#b9b4aa','#d5d0c4','#a9b0b6'] },
    muro:    { alt:[12, 14],  cor:['#b8b09e'] },
    galpao:  { alt:[40, 52],  cor:['#9fa4a6','#8f948f'] }
  };
  const SEDES = {
    /* a sede de cada torcida: é onde a torcida nasce */
    mandante:  { quadra:'O', frente:'n', s:300, larg:88, cor:'#b02a22', rot:'SEDE' },
    visitante: { quadra:'L', frente:'s', s:QEST_X1+RUA+270, larg:88, cor:'#22439a', rot:'SEDE' }
  };

  const LOTES = [];
  function lotear(q){
    const prof = par8(entre(64, 88));
    /* frentes norte e sul, de ponta a ponta; oeste e leste, entre elas */
    const frentes = [
      { f:'n', x0:q.ix0, x1:q.ix1, y0:q.iy0, y1:q.iy0+prof },
      { f:'s', x0:q.ix0, x1:q.ix1, y0:q.iy1-prof, y1:q.iy1 },
      { f:'o', x0:q.ix0, x1:q.ix0+prof, y0:q.iy0+prof, y1:q.iy1-prof },
      { f:'l', x0:q.ix1-prof, x1:q.ix1, y0:q.iy0+prof, y1:q.iy1-prof }
    ];
    for(const fr of frentes){
      const horizontal = fr.f === 'n' || fr.f === 's';
      const a0 = horizontal ? fr.x0 : fr.y0, a1 = horizontal ? fr.x1 : fr.y1;
      let a = a0;
      while(a < a1 - 24){
        let larg = par8(entre(64, 128));
        if(a + larg > a1 - 40) larg = a1 - a;
        const sede = Object.values(SEDES).find(s => s.quadra === q.id && s.frente === fr.f &&
                       s.s >= a && s.s < a + larg);
        let tipo = escolher(['casa','casa','casa','sobrado','sobrado','predio','muro','galpao']);
        if(q.id === 'N' || q.id === 'S') tipo = escolher(['casa','sobrado','sobrado','predio','galpao','muro']);
        const T = TIPOS[tipo];
        const lote = {
          quadra: q.id, frente: fr.f, tipo,
          x0: horizontal ? a : fr.x0, x1: horizontal ? a + larg : fr.x1,
          y0: horizontal ? fr.y0 : a, y1: horizontal ? fr.y1 : a + larg,
          alt: par8(entre(T.alt[0], T.alt[1]))/8*8 || T.alt[0],
          cor: escolher(T.cor)
        };
        if(sede){
          lote.tipo = 'sede'; lote.alt = 62; lote.cor = sede.cor; lote.rot = sede.rot;
          lote.lado = Object.keys(SEDES).find(k => SEDES[k] === sede);
        }
        /* prédio não fica colado em prédio: quebra a monotonia do quarteirão */
        LOTES.push(lote);
        a += larg;
      }
    }
    /* o miolo: quintais murados, baixos */
    LOTES.push({ quadra:q.id, frente:'miolo', tipo:'quintal',
      x0:q.ix0+prof, x1:q.ix1-prof, y0:q.iy0+prof, y1:q.iy1-prof, alt: 10, cor:'#a8a08c' });
  }
  QUADRAS.forEach(lotear);

  /* carros na guia, como na foto: nas ruas norte e sul do estádio,
     do lado do estádio. Bloqueiam — são o que a torcida contorna. */
  const CARROS = [];
  const CORES_CARRO = ['#d9d9d9','#2b2b2b','#8a8f96','#b8242a','#2a4f9a','#e6e6e6','#6b7280'];
  (function estacionar(){
    const passo = 46;
    for(const [y0, y1] of [[QEST_Y0-RUA+8, QEST_Y0-RUA+24], [QEST_Y1+RUA-24, QEST_Y1+RUA-8]]){
      for(let x = QEST_X0 + 40; x < QEST_X1 - 60; x += passo){
        if(rng() < 0.22) continue;                         // vaga vazia
        if(Math.abs(x + 17 - CX) < 90 && y0 > CY) continue;  // a frente do portão sul
        CARROS.push({ x0:x, x1:x+34, y0, y1, cor: escolher(CORES_CARRO) });
      }
    }
    /* uns poucos na rua de fora, nas pontas */
    for(const x of [RUA+60, RUA+160, RUA+260, W-RUA-100, W-RUA-200, W-RUA-300]){
      CARROS.push({ x0:x, x1:x+34, y0:RUA-24, y1:RUA-8, cor: escolher(CORES_CARRO) });
      CARROS.push({ x0:x, x1:x+34, y0:H-RUA+8, y1:H-RUA+24, cor: escolher(CORES_CARRO) });
    }
  })();

  /* árvores nas calçadas: só desenho, não bloqueiam (tronco fino) */
  const ARVORES = [];
  for(const q of QUADRAS){
    for(let x = q.x0 + 40; x < q.x1 - 30; x += par8(entre(88, 150))){
      if(rng() < 0.5) ARVORES.push({ x, y: q.y0 + 12, r: entre(14, 22) });
      if(rng() < 0.5) ARVORES.push({ x, y: q.y1 - 12, r: entre(14, 22) });
    }
    for(let y = q.y0 + 60; y < q.y1 - 40; y += par8(entre(100, 170))){
      if(rng() < 0.5) ARVORES.push({ x: q.x0 + 12, y, r: entre(14, 22) });
      if(rng() < 0.5) ARVORES.push({ x: q.x1 - 12, y, r: entre(14, 22) });
    }
  }

  /* as torres de refletor, nos quatro cantos do quarteirão do
     estádio — fora da calçada redonda, dentro do quadrado */
  const TORRES = [[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx, sy]) => ({
    x: CX + sx*(QEST.larg/2 - 44), z: CY + sy*(QEST.alt/2 - 44), alt: ALT.torre }));

  const dentroRet = (x, y, o) => x >= o.x0 && x < o.x1 && y >= o.y0 && y < o.y1;
  function noLote(x, y){
    for(const l of LOTES) if(dentroRet(x, y, l)) return l;
    return null;
  }
  function noCarro(x, y){
    for(const c of CARROS) if(dentroRet(x, y, c)) return c;
    return null;
  }
  const noQuadradoDoEstadio = (x, y) =>
    x >= QEST_X0 && x < QEST_X1 && y >= QEST_Y0 && y < QEST_Y1;

  /* =======================================================
     A DOBRA: tabuleiro → mundo
     ======================================================= */
  function faixaDe(d){
    if(d < D.pista)     return 'pista';
    if(d < D.arq)       return 'arquibancada';
    if(d < D.parapeito) return 'parapeito';
    if(d < D.corred)    return 'corredor';
    if(d < D.fachada)   return 'fachada';
    if(d < D.calcada)   return 'calcada';
    return 'rua';
  }
  function dobra(d){
    if(d < D.arq)       return { r: d, y: d < D.pista ? 0 : alturaDegrau(d) };
    if(d < D.parapeito) return { r: d, y: ALT.parapeito };
    return { r: d - DOBRA, y: 0 };            // corredor, fachada, calçada
  }

  const saida = { x:0, y:0, z:0 };
  function mundo(x, y, alvo){
    const o = alvo || saida;
    const a = ancora(x, y);
    if(a.d >= D.calcada){ o.x = x; o.z = y; o.y = 0; return o; }   // o bairro: identidade
    const v = noVomitorio(x, y);
    const m = v ? rampa(v.d) : dobra(a.d);
    o.x = a.cx + DOBRA*a.sx + a.nx*m.r;
    o.z = a.cy + DOBRA*a.sy + a.ny*m.r;
    o.y = m.y;
    return o;
  }
  /* em que andar está um ponto do tabuleiro — pra quem quer contar gente */
  function onde(x, y){
    if(noVomitorio(x, y)) return 'vomitorio';
    const f = faixaDe(dist(x, y));
    return f === 'calcada' ? 'rua' : f;
  }

  /* =======================================================
     O QUE SE PISA
     ======================================================= */
  function anda(x, y){
    const a = ancora(x, y);
    if(a.d >= D.calcada){
      /* a lasca da quina, e o canto das torres: dentro do quadrado do
         estádio e fora da calçada redonda, nada se pisa */
      if(noQuadradoDoEstadio(x, y)) return false;
      if(x < 4 || y < 4 || x > W-4 || y > H-4) return false;
      return !noLote(x, y) && !noCarro(x, y);
    }
    const v = noVomitorio(x, y);
    if(v) return !v.corrim;
    const f = faixaDe(a.d);
    if(f === 'pista' || f === 'parapeito') return false;
    if(f === 'fachada') return noPortao(x, y);
    if(f === 'corredor') return !naLoja(x, y);
    return true;                                  // arquibancada e calçada
  }

  /* o vomitório em coordenada de MUNDO: se (X, Z) cai na tira de
     algum, devolve o raio e se está no buraco (céu aberto) ou no
     túnel (laje por cima). É o que a câmera precisa saber. */
  function vomitorioMundo(X, Z){
    const q = ondeNoRetoMundo(X, Z);
    if(!q || q.d < VOM.rTop || q.d > VOM.rFoot) return null;
    for(const v of VOMITORIOS)
      if(v.lado === q.lado && q.s >= v.e0 && q.s <= v.e1)
        return { v, r: q.d, buraco: q.d < VOM.capuz, piso: pisoEscada(q.d) };
    return null;
  }

  /* =======================================================
     O QUE É SÓLIDO, NO MUNDO — pra câmera saber onde não entra
     ======================================================= */
  function solido(X, Y, Z){
    if(Y < 0) return true;
    const r = distMundo(X, Z);
    /* na tira do vomitório: abaixo do degrau é maciço; no buraco, acima
       dele é céu; no túnel, entre o degrau e o teto é vão, e a laje de
       cima continua sendo laje */
    const vm = vomitorioMundo(X, Z);
    if(vm){
      if(Y < vm.piso) return true;                 // dentro do degrau da escada
      if(vm.buraco) return false;                  // céu aberto
      if(Y <= tetoDe(r)) return false;             // o vão do túnel
      /* acima do teto do túnel é o que está por cima dele: o degrau da
         arquibancada, o parapeito ou a laje de trás */
      if(r < D.arq) return Y < alturaDegrau(r);
      if(r < D.parapeito) return Y < ALT.parapeito;
      return Y < TOPO_ARQ;
    }
    if(r >= R.calcada1){
      const l = noLote(X, Z);
      if(l && Y < l.alt) return true;
      /* a copa das árvores também é sólida pra câmera: sem isso ela
         atravessa o pinheiro da calçada e a tela fica verde */
      for(const a of ARVORES)
        if(Y > 10 && Y < 13 + a.r*2.3 && Math.hypot(X - a.x, Z - a.y) < a.r) return true;
      return false;
    }
    if(r < D.pista) return false;
    if(r < D.arq){
      const topo = alturaDegrau(r);
      if(r < R.corred0) return Y < topo;                   // maciça
      return Y > topo - ALT.laje && Y < topo;              // laje, com o corredor embaixo
    }
    if(r < D.parapeito) return Y > tetoDe(r) && Y < ALT.parapeito;
    if(r < R.fachada0)  return Y > tetoDe(r) && Y < TOPO_ARQ;
    if(r < R.calcada0)  return Y < ARCADA.mureta || (Y > TOPO_ARQ - 16 && Y < TOPO_ARQ);
    return false;
  }
  /* o teto do corredor naquele ponto (Infinity onde não há teto) */
  function teto(X, Z){
    const r = distMundo(X, Z);
    if(r < R.corred0 || r > R.fachada1) return Infinity;
    const vm = vomitorioMundo(X, Z);
    if(vm && vm.buraco) return Infinity;            // o buraco é céu aberto
    return tetoDe(r);
  }
  /* O CHÃO SOB UM PONTO: a superfície andável (ou pisável pela câmera)
     logo abaixo de (X, Y, Z), levando em conta o andar em que Y está
     — no corredor é o piso, em cima da laje é a arquibancada, no
     buraco é a escada, no bairro é o telhado. A câmera usa isto pra
     NÃO parar no chão: chão levanta a câmera; só parede e teto param. */
  function piso(X, Y, Z){
    const r = distMundo(X, Z);
    if(r >= R.calcada1){ const l = noLote(X, Z); return l ? l.alt : 0; }
    const vm = vomitorioMundo(X, Z);
    if(vm){
      if(vm.buraco || Y < tetoDe(r)) return vm.piso;
      return r < D.arq ? alturaDegrau(r) : r < D.parapeito ? ALT.parapeito : TOPO_ARQ;
    }
    if(r < D.pista) return 0;
    if(r < R.corred0) return alturaDegrau(r);
    if(r < D.arq) return Y < tetoDe(r) ? 0 : alturaDegrau(r);
    if(r < D.parapeito) return Y < tetoDe(r) ? 0 : ALT.parapeito;
    if(r < R.fachada1) return Y < tetoDe(r) ? 0 : TOPO_ARQ;
    return 0;
  }
  /* a superfície de cima naquele ponto do mundo */
  function superficie(X, Z){
    const r = distMundo(X, Z);
    const vm = vomitorioMundo(X, Z);
    if(vm && vm.buraco) return vm.piso;             // no buraco, o chão é a escada
    if(r >= D.pista && r < D.arq) return alturaDegrau(r);
    if(r >= D.arq && r < R.fachada1) return TOPO_ARQ;
    return 0;
  }

  /* =======================================================
     A MÁSCARA — o formato de `arredores.codificarMascara`
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

  return { W, H, CEL, CX, CY, AX, AY, AXb, AYb, DOBRA, D, R, ALT, N, NDEG, TOPO_ARQ, tetoDe,
           METRO, ARCADA, RUA, CALC, PONTA, NS, QEST, QEST_X0, QEST_X1, QEST_Y0, QEST_Y1,
           PERFIL, anel, ancora, ancoraMundo, dist, distMundo, alturaDegrau,
           LADOS, ponto, pontoMundo, ondeNoReto, ondeNoRetoMundo,
           VOM, VOMITORIOS, noVomitorio, vomitorioMundo, rampa, pisoEscada,
           PORTOES, noPortao, noPortaoMundo, LOJA, LOJAS, naLoja,
           QUADRAS, LOTES, CARROS, ARVORES, TORRES, SEDES, noLote, noCarro,
           faixaDe, dobra, mundo, onde, anda, solido, piso, teto, superficie, mascara };
})();

/* =========================================================
   A CENA
   ========================================================= */
TO.dados.cenaEstadio = (function(){
  const P = TO.dados.plantaEstadio;
  const { W, H, CEL, CX, CY } = P;

  /* A TORCIDA NASCE NAS PONTAS DO BAIRRO, na porta da sede, e
     caminha. O primeiro escalão mandante é o seu.

     O SETOR VISITANTE JÁ ESTÁ DENTRO, de guarda na arquibancada
     leste, e é de propósito: o combate só tem um estado "fica
     parado esperando" — o de guarda, que dorme até o rival chegar
     a `gatilho.perto`. Sem isso, todo mundo caminha até o destino
     e some antes de você entrar, e o estádio fica vazio. Com o
     setor deles lá dentro, a briga tem onde acontecer: corredor,
     escada e arquibancada. A retaguarda deles chega andando pelo
     quarteirão nordeste. */
  const S = P.SEDES;
  const [xSet, ySet] = P.ponto('l', CY + 26, 118);
  const spawns = [
    { id:'mandante1', rot:'1º ESCALÃO', lado:'mandante', x:S.mandante.s, y:P.QEST_Y0+12,
      jogador:true, entrada:'setor_mandante' },
    { id:'mandante2', rot:'2º ESCALÃO', lado:'mandante', x:P.RUA+P.PONTA-12, y:P.QEST_Y1+P.RUA+200,
      entrada:'setor_mandante' },
    { id:'visitante1', rot:'SETOR VISITANTE', lado:'visitante', x:Math.round(xSet), y:Math.round(ySet),
      guarda:true, entrada:'saida_leste' },
    { id:'visitante2', rot:'RETAGUARDA', lado:'visitante', x:P.QEST_X1+P.RUA+300, y:P.RUA+P.NS-12,
      entrada:'setor_visitante' }
  ];

  /* O DESTINO É O SETOR, não o portão. É isso que faz o caminho
     atravessar o estádio inteiro — portão, corredor, vomitório,
     arquibancada — e é isso que faz a briga poder acontecer em
     qualquer ponto dele. Quem chega no setor "entrou", como quem
     entra no portão nos arredores: some. O setor visitante, que já
     está dentro, tem como destino a SAÍDA pelo portão leste: é por
     onde ele vai embora quando a briga acaba. */
  const setor = (lado, id, rot) => {
    const [x, y] = P.ponto(lado, CY, 100);
    return { id, rot, lado: lado === 'o' ? 'mandante' : 'visitante',
             x:Math.round(x), y:Math.round(y), raio:44, dir: lado === 'o' ? [1,0] : [-1,0] };
  };
  const [xSai, ySai] = P.ponto('l', CY, 348);
  const entradas = [
    setor('o', 'setor_mandante',  'SETOR MANDANTE'),
    setor('l', 'setor_visitante', 'SETOR VISITANTE'),
    { id:'saida_leste', rot:'SAÍDA LESTE', lado:'visitante', x:Math.round(xSai), y:Math.round(ySai),
      raio:40, dir:[1,0], saida:true }
  ];

  /* A PM: nos três portões, no corredor, nas divisas de setor e na
     rua do sul, que é onde os dois lados se cruzam se alguém for caçar */
  const calc = (lado, s) => { const [x, y] = P.ponto(lado, s, 342); return { x:Math.round(x), y:Math.round(y) }; };
  const corr = (lado, s) => { const [x, y] = P.ponto(lado, s, 246); return { x:Math.round(x), y:Math.round(y) }; };
  const arq  = (lado, s) => { const [x, y] = P.ponto(lado, s, 100); return { x:Math.round(x), y:Math.round(y) }; };
  const pmPostos = [
    calc('o', CY), calc('l', CY), calc('s', CX),
    corr('n', CX-60), corr('s', CX+60),
    arq('n', CX), arq('s', CX),
    { x: CX, y: P.QEST_Y1 + P.RUA/2 }
  ];

  /* grade que quebra e vira arma (GDD §12): cordão da PM na boca
     de cada portão, divisa de setor no meio das arquibancadas
     norte e sul */
  /* O CORDÃO NÃO FECHA O PORTÃO: cobre 48 dos 80 e deixa um funil
     de 32 num lado — é por ali que a torcida entra em fila, e é a
     PM tentando evitar sem selar. Selado, o campo de fluxo não tem
     rota e todo mundo para na grade batendo nela. */
  const cordao = (lado, s, id) => {
    const a = P.ponto(lado, s-40, 344), b = P.ponto(lado, s+8, 344);
    return { id, rot:'CORDÃO DA PM', de:{x:a[0], y:a[1]}, ate:{x:b[0], y:b[1]}, modulos:2, espessura:9 };
  };
  const divisa = (lado, s, id) => {
    const a = P.ponto(lado, s, 34), b = P.ponto(lado, s, 160);
    /* oito módulos e não três: a grade é uma caixa por módulo, na
       altura do centro dele, e a arquibancada sobe 4,6 a cada 8 —
       módulo comprido vira degrau de bloco amarelo flutuando */
    return { id, rot:'DIVISA DE SETOR', de:{x:a[0], y:a[1]}, ate:{x:b[0], y:b[1]}, modulos:8, espessura:9 };
  };
  /* SEM CORDÃO NO PORTÃO DA CASA. Na primeira simulação o líder
     encostou no cordão do próprio portão, o alerta subiu e a PM o
     prendeu antes de ele entrar no estádio. A PM escolta quem vem de
     fora: cordão no portão visitante e no neutro; no oeste, fila e
     posto. */
  const grades = [
    cordao('l', CY, 'cordao_leste'), cordao('s', CX, 'cordao_sul'),
    divisa('n', CX, 'divisa_norte'), divisa('s', CX, 'divisa_sul')
  ];
  /* a fila de cada portão: uma guia na calçada, do lado do vão,
     que não quebra — é por onde a torcida se enfileira */
  const fila = (lado, s, id) => {
    const a = P.ponto(lado, s-40, 330), b = P.ponto(lado, s-40, 356);
    const c = P.ponto(lado, s+40, 330), d = P.ponto(lado, s+40, 356);
    return [{ id:id+'_a', pontos:[[a[0],a[1]],[b[0],b[1]]], espessura:9 },
            { id:id+'_b', pontos:[[c[0],c[1]],[d[0],d[1]]], espessura:9 }];
  };
  const filas = [].concat(fila('o', CY, 'fila_o'), fila('l', CY, 'fila_l'), fila('s', CX, 'fila_s'));

  return {
    /* `id:'arredores'` DE PROPÓSITO. `combate.js` só liga a vida do
       lado de fora — ficar na sede até a hora, bonde hostil sair
       atrás do rival, fugir é entrar — quando a cena se chama
       assim (`fugaPelaEntrada`). A página acha esta cena pelo
       registro `TO.dados.cenas.estadio`, não pelo id; o id é só o
       que o combate lê pra decidir como a noite começa. */
    id:'arredores', nome:'Estádio e bairro',
    largura:W, altura:H, celula:CEL, imagem:null,
    poligonos:{
      caminhavel:[{rot:'chão', pontos:[[0,0],[W,0],[W,H],[0,H]]}],
      bloqueio:[]
    },
    mascara: P.mascara(),
    local:'No estádio',
    tropaChoque:true,
    saida:{ perto:'Entrar no setor', longe:'Setor (leve o líder)',
            feito:'sua torcida chegou no setor com a arquibancada na mão',
            dica:'Leve o líder até o setor da sua torcida: portão, corredor, vomitório.' },
    enfeites:[], varais:[],
    spawns, entradas, pmPostos, grades, filas,
    /* o setor deles dorme até o seu bonde chegar a 300 */
    gatilho:{ lado:'mandante', perto:300, rot:'DE OLHO',
              espera:'o setor deles ainda não se mexeu',
              aviso:'o setor deles viu o bonde chegar' },
    planta: P
  };
})();

/* Entra no mapa de cenas sem que `cenas.js` precise saber que
   este arquivo existe — basta ser carregado depois dele. */
TO.dados.cenas = TO.dados.cenas || {};
TO.dados.cenas.estadio = TO.dados.cenaEstadio;
