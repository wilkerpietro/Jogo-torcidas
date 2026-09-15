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

  /* A CIDADE VEM DE UM MAPA DESENHADO — 1500 × 1100 px: o estádio no
     norte-centro, a costa a leste, o mato a oeste, dois campos de
     várzea no sul. Um pixel do mapa é PX unidades do mundo, a escala
     que deixa o estádio do mapa do tamanho do quarteirão do estádio.
     O TABULEIRO (o que se anda) é um recorte do mapa; o que se DESENHA
     vai além dele, até o mar e o mato de fora. */
  const PX = 5.4;
  const MAPA  = { x0: 170, y0: 90,  x1: 1170, y1: 1100 };   // o recorte andável, em px do mapa
  const VISTA = { x0: -60, y0: -60, x1: 1560, y1: 1160 };   // o que se desenha, em px do mapa
  const ceil8 = v => Math.ceil(v/8)*8;
  const W = ceil8((MAPA.x1 - MAPA.x0)*PX), H = ceil8((MAPA.y1 - MAPA.y0)*PX);   // 5400 × 5456
  const pxX = x => (x - MAPA.x0)*PX, pxY = y => (y - MAPA.y0)*PX;
  const pxm = (x, y) => [pxX(x), pxY(y)];                                        // px do mapa → mundo
  const QEST = { larg: 2*(AX + R.calcada1), alt: 2*(AY + R.calcada1) };          // 1184 × 960
  const [CX, CY] = pxm(765, 305);                                                // o estádio, onde o mapa o põe
  const VW = (VISTA.x1 - VISTA.x0)*PX, VH = (VISTA.y1 - VISTA.y0)*PX;
  const [VX0, VY0] = pxm(VISTA.x0, VISTA.y0);
  const RUA = 70, CALC = 32;

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
     A CIDADE — a planta tirada do mapa

     A grade de ruas é lida do mapa como colunas (norte-sul) e linhas
     (leste-oeste), cada uma com a sua largura; as quatro que encostam
     no estádio vêm do quarteirão dele, pra bater exatamente. Entre
     ruas há células: dentro do contorno da cidade a célula é um
     QUARTEIRÃO (calçada de 32 em volta, lotes de frente contínua,
     quintal no miolo); fora, é mato, praia ou mar. As AVENIDAS
     diagonais do mapa cortam os quarteirões de verdade — bandas
     andáveis — e ganham casas rotacionadas na frente. Os dois CAMPOS
     de várzea do sul são células grandes abertas, com cerca e
     arquibancadinha. Tudo bloqueia na máscara e sai no 3D, da mesma
     lista.
     ======================================================= */
  const QEST_X0 = CX - QEST.larg/2, QEST_X1 = CX + QEST.larg/2;
  const QEST_Y0 = CY - QEST.alt/2,  QEST_Y1 = CY + QEST.alt/2;

  /* ---- a costa: x do mar em função de y, em px do mapa ---- */
  const COSTA = [[1130,-60],[1090,130],[1060,240],[1010,400],[950,530],[880,660],
                 [825,780],[770,900],[720,1010],[680,1160]];
  function xCosta(ypx){
    if(ypx <= COSTA[0][1]) return COSTA[0][0];
    for(let k=1;k<COSTA.length;k++){
      const [x0,y0] = COSTA[k-1], [x1,y1] = COSTA[k];
      if(ypx <= y1) return x0 + (x1-x0)*(ypx-y0)/(y1-y0);
    }
    return COSTA[COSTA.length-1][0];
  }
  const PRAIA = 45, ORLA = 14;          // em px: a faixa de areia e a avenida beira-mar
  /* ---- o contorno da cidade, em px: fora dele é mato ---- */
  const CONTORNO = [[330,250],[400,160],[560,110],[620,100],[700,95],[850,100],[1000,110],
                    [1300,115],[1300,1200],[300,1200],[250,1000],[230,850],[240,700],
                    [260,560],[290,420]];
  function dentroPoligono(px, py, pol){
    let dentro = false;
    for(let a=0, b=pol.length-1; a<pol.length; b=a++){
      const [xa,ya] = pol[a], [xb,yb] = pol[b];
      if((ya > py) !== (yb > py) && px < (xb-xa)*(py-ya)/(yb-ya)+xa) dentro = !dentro;
    }
    return dentro;
  }
  /* a zona de um ponto do MUNDO: mar, praia, orla, cidade ou mato */
  function zona(x, y){
    const px = x/PX + MAPA.x0, py = y/PX + MAPA.y0;
    const xc = xCosta(py);
    if(px > xc) return 'mar';
    if(px > xc - PRAIA) return 'praia';
    if(px > xc - PRAIA - ORLA) return 'orla';
    return dentroPoligono(px, py, CONTORNO) ? 'cidade' : 'mato';
  }

  /* ---- as ruas da grade ---- */
  const coluna = (px, lpx) => ({ c: pxX(px), l: lpx*PX });
  const linha  = (px, lpx) => ({ c: pxY(px), l: lpx*PX });
  const COLUNAS = [ coluna(245,12), coluna(315,12), coluna(385,12), coluna(455,14), coluna(525,12),
                    coluna(595,12), { c: QEST_X0 - RUA/2, l: RUA }, coluna(765,14),
                    { c: QEST_X1 + RUA/2, l: RUA }, coluna(945,12), coluna(1015,12),
                    coluna(1085,12), coluna(1150,12) ];
  const LINHAS  = [ linha(130,14), linha(172,12), { c: QEST_Y0 - RUA/2, l: RUA }, linha(300,12),
                    { c: QEST_Y1 + RUA/2, l: RUA }, linha(465,12), linha(535,12), linha(605,14),
                    linha(675,12), linha(745,12), linha(815,12), linha(885,12), linha(955,14),
                    linha(1025,12), linha(1092,12) ];
  const noQuadradoDoEstadio = (x, y) =>
    x >= QEST_X0 && x < QEST_X1 && y >= QEST_Y0 && y < QEST_Y1;

  /* ---- os campos de várzea: células abertas com cerca ---- */
  const campo = (x0, y0, x1, y1, ladoArq) => {
    const [X0, Y0] = pxm(x0, y0), [X1, Y1] = pxm(x1, y1);
    return { x0:X0, y0:Y0, x1:X1, y1:Y1, cx:(X0+X1)/2, cy:(Y0+Y1)/2, ladoArq };
  };
  const CAMPOS = [ campo(414, 705, 522, 797, 'o'), campo(658, 728, 770, 808, 'l') ];   // o 1º afastado da avenida
  const CERCA = 6, PORTEIRA = 24, ARQ_VARZEA = { fundo: 40, alt: 22 };
  function noCampo(x, y){
    for(const c of CAMPOS) if(x >= c.x0 && x < c.x1 && y >= c.y0 && y < c.y1) return c;
    return null;
  }
  /* dentro do campo: a cerca e a arquibancadinha bloqueiam, o resto anda */
  function andaNoCampo(c, x, y){
    const dx0 = x - c.x0, dx1 = c.x1 - x, dy0 = y - c.y0, dy1 = c.y1 - y;
    const naCerca = Math.min(dx0, dx1, dy0, dy1) < CERCA;
    if(naCerca){
      /* porteiras no meio dos lados norte e sul */
      const meio = Math.abs(x - c.cx) < PORTEIRA/2;
      return meio && (dy0 < CERCA || dy1 < CERCA);
    }
    if(c.ladoArq === 'o' && dx0 < CERCA + ARQ_VARZEA.fundo && Math.abs(y - c.cy) < (c.y1-c.y0)*0.3) return false;
    if(c.ladoArq === 'l' && dx1 < CERCA + ARQ_VARZEA.fundo && Math.abs(y - c.cy) < (c.y1-c.y0)*0.3) return false;
    return true;
  }

  /* ---- as avenidas diagonais: segmento + largura, no mundo ---- */
  const avenida = (ax, ay, bx, by, lpx, id) => {
    const [x0, y0] = pxm(ax, ay), [x1, y1] = pxm(bx, by);
    const L = Math.hypot(x1-x0, y1-y0);
    return { id, x0, y0, x1, y1, l: lpx*PX, ux:(x1-x0)/L, uy:(y1-y0)/L, L,
             ang: Math.atan2(y1-y0, x1-x0) };
  };
  const AVENIDAS = [
    avenida(185, 1095, 600, 405, 16, 'sudoeste'),   // a grande, do canto sudoeste até o estádio
    avenida(330, 255, 612, 108, 14, 'noroeste'),
    avenida(170, 555, 330, 540, 12, 'oeste'),
    avenida(170, 200, 330, 250, 12, 'noroeste2')
  ];
  /* distância de (x,y) ao eixo da avenida, e onde ao longo dela */
  function distAvenida(av, x, y){
    const dx = x - av.x0, dy = y - av.y0;
    const t = Math.max(0, Math.min(av.L, dx*av.ux + dy*av.uy));
    return { t, d: Math.hypot(dx - av.ux*t, dy - av.uy*t) };
  }
  function naAvenida(x, y, folga){
    for(const av of AVENIDAS){
      const q = distAvenida(av, x, y);
      if(q.d <= av.l/2 + (folga === undefined ? CALC : folga)) return { av, ...q };
    }
    return null;
  }

  /* ---- as ruas da grade num ponto (fora do estádio e dos campos) ---- */
  function naRua(x, y){
    for(const c of COLUNAS) if(Math.abs(x - c.c) <= c.l/2) return true;
    for(const l of LINHAS)  if(Math.abs(y - l.c) <= l.l/2) return true;
    return false;
  }

  /* ---- as células entre as ruas, e quais são quarteirão ---- */
  const bordasX = [0]; for(const c of COLUNAS){ bordasX.push(c.c - c.l/2, c.c + c.l/2); } bordasX.push(W);
  const bordasY = [0]; for(const l of LINHAS){ bordasY.push(l.c - l.l/2, l.c + l.l/2); } bordasY.push(H);
  const CELULAS = [];
  const grade = [];    // grade[i][j] → célula
  for(let i=0;i<bordasX.length;i+=2){
    grade[i/2] = [];
    for(let j=0;j<bordasY.length;j+=2){
      const x0 = bordasX[i], x1 = bordasX[i+1], y0 = bordasY[j], y1 = bordasY[j+1];
      const cel = { i:i/2, j:j/2, x0, x1, y0, y1, cx:(x0+x1)/2, cy:(y0+y1)/2, tipo:'aberto',
                    ix0:x0+CALC, ix1:x1-CALC, iy0:y0+CALC, iy1:y1-CALC, lotes:[] };
      if(x1 - x0 < 4 || y1 - y0 < 4) cel.tipo = 'nada';
      else if(noQuadradoDoEstadio(cel.cx, cel.cy)) cel.tipo = 'estadio';
      else if(noCampo(cel.cx, cel.cy)) cel.tipo = 'campo';
      else if(zona(cel.cx, cel.cy) === 'cidade' && cel.ix1 - cel.ix0 > 48 && cel.iy1 - cel.iy0 > 48) cel.tipo = 'quadra';
      grade[i/2][j/2] = cel;
      CELULAS.push(cel);
    }
  }
  /* a célula de um ponto: busca binária nas bordas */
  function indiceEm(bordas, v){
    let a = 0, b = bordas.length - 1;
    while(a < b){ const m = (a+b) >> 1; if(bordas[m+1] <= v) a = m+1; else b = m; }
    return a;
  }
  function celulaEm(x, y){
    if(x < 0 || y < 0 || x >= W || y >= H) return null;
    const i = indiceEm(bordasX, x), j = indiceEm(bordasY, y);
    if(i % 2 || j % 2) return null;              // caiu numa rua
    return grade[i/2][j/2];
  }
  const QUADRAS = CELULAS.filter(c => c.tipo === 'quadra');

  /* ---- sorteio com semente: a planta sai IGUAL toda vez ---- */
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
    casa:    { alt:[30, 44],  cor:['#e8dcc0','#d9c9a3','#e2b9a6','#cfd8c9','#e6e2d6','#d8c8b0','#e9d3b3'] },
    sobrado: { alt:[54, 70],  cor:['#e3d3b2','#c9b48a','#d4a48f','#b7c4c2','#ded9cd'] },
    predio:  { alt:[92, 150], cor:['#cfcac0','#b9b4aa','#d5d0c4','#a9b0b6','#e0dcd2'] },
    muro:    { alt:[12, 14],  cor:['#b8b09e'] },
    galpao:  { alt:[40, 56],  cor:['#9fa4a6','#8f948f','#a8a39a'] }
  };
  /* a sede de cada torcida: um ponto do mapa dentro do quarteirão, e a
     frente em que ela fica. É onde a torcida nasce. */
  const SEDES = {
    mandante:  { ponto: pxm(280, 1058), frente:'n', cor:'#b02a22', rot:'SEDE' },
    visitante: { ponto: pxm(980, 255), frente:'l', cor:'#22439a', rot:'SEDE' }   // de frente pra orla
  };
  const sedeDe = {};

  /* o lote intersecta uma avenida (com folga)? testa os cantos e o centro */
  function cantosDoLote(l){
    if(!l.ang) return [[l.x0,l.y0],[l.x1,l.y0],[l.x1,l.y1],[l.x0,l.y1],[(l.x0+l.x1)/2,(l.y0+l.y1)/2]];
    const c = Math.cos(l.ang), s = Math.sin(l.ang), hw = l.w/2, hh = l.h/2;
    const r = (u, v) => [l.cx + u*c - v*s, l.cy + u*s + v*c];
    return [r(-hw,-hh), r(hw,-hh), r(hw,hh), r(-hw,hh), [l.cx, l.cy]];
  }
  const tocaAvenida = (l, folga) => cantosDoLote(l).some(([x, y]) => naAvenida(x, y, folga));
  const dentroRet = (x, y, o) => x >= o.x0 && x < o.x1 && y >= o.y0 && y < o.y1;
  function dentroLote(x, y, l){
    if(!l.ang) return dentroRet(x, y, l);
    const c = Math.cos(-l.ang), s = Math.sin(-l.ang);
    const dx = x - l.cx, dy = y - l.cy;
    const u = dx*c - dy*s, v = dx*s + dy*c;
    return Math.abs(u) <= l.w/2 && Math.abs(v) <= l.h/2;
  }

  const LOTES = [];
  function tipoDoLote(q){
    const px = q.cx/PX + MAPA.x0, py = q.cy/PX + MAPA.y0;
    /* perto do estádio e na orla norte há prédio e galpão, como no mapa;
       o resto é casa de telha, que é o que o mapa mostra em toda parte */
    if(py < 230 && px > 820) return escolher(['galpao','galpao','predio','sobrado','casa']);
    if(Math.abs(px - 765) < 260 && Math.abs(py - 305) < 220) return escolher(['casa','sobrado','sobrado','predio','galpao','muro']);
    if(px > 900) return escolher(['casa','casa','sobrado','predio','muro']);
    return escolher(['casa','casa','casa','casa','sobrado','sobrado','muro','galpao']);
  }
  function lotear(q){
    const largI = q.ix1 - q.ix0, altI = q.iy1 - q.iy0;
    let prof = par8(entre(60, 84));
    /* quarteirão raso: uma fileira só, ocupando o fundo todo */
    const raso = altI < 2*prof + 24 || largI < 2*prof + 24;
    if(raso) prof = Math.min(altI, largI);
    const frentes = raso
      ? (largI >= altI
          ? [{ f:'n', x0:q.ix0, x1:q.ix1, y0:q.iy0, y1:q.iy1 }]
          : [{ f:'o', x0:q.ix0, x1:q.ix1, y0:q.iy0, y1:q.iy1 }])
      : [{ f:'n', x0:q.ix0, x1:q.ix1, y0:q.iy0, y1:q.iy0+prof },
         { f:'s', x0:q.ix0, x1:q.ix1, y0:q.iy1-prof, y1:q.iy1 },
         { f:'o', x0:q.ix0, x1:q.ix0+prof, y0:q.iy0+prof, y1:q.iy1-prof },
         { f:'l', x0:q.ix1-prof, x1:q.ix1, y0:q.iy0+prof, y1:q.iy1-prof }];
    for(const fr of frentes){
      const horizontal = fr.f === 'n' || fr.f === 's';
      const a0 = horizontal ? fr.x0 : fr.y0, a1 = horizontal ? fr.x1 : fr.y1;
      if(a1 - a0 < 40) continue;
      let a = a0;
      while(a < a1 - 24){
        let larg = par8(entre(56, 120));
        if(a + larg > a1 - 36) larg = a1 - a;
        const tipo = tipoDoLote(q);
        const T = TIPOS[tipo];
        const lote = {
          quadra:q, frente: fr.f, tipo,
          x0: horizontal ? a : fr.x0, x1: horizontal ? a + larg : fr.x1,
          y0: horizontal ? fr.y0 : a, y1: horizontal ? fr.y1 : a + larg,
          alt: par8(entre(T.alt[0], T.alt[1])) || T.alt[0],
          cor: escolher(T.cor)
        };
        a += larg;
        /* a frente da avenida é das casas rotacionadas: aqui não entra;
           e lote nenhum entra no campo de várzea */
        if(tocaAvenida(lote, CALC + 96)) continue;
        if(cantosDoLote(lote).some(([x, y]) => noCampo(x, y))) continue;
        for(const [k, sd] of Object.entries(SEDES)){
          if(sedeDe[k]) continue;
          if(dentroRet(sd.ponto[0], sd.ponto[1], q) && fr.f === sd.frente &&
             sd.ponto[0] >= lote.x0 - 40 && sd.ponto[0] <= lote.x1 + 40 && (fr.f === 'n' || fr.f === 's') ||
             dentroRet(sd.ponto[0], sd.ponto[1], q) && fr.f === sd.frente &&
             sd.ponto[1] >= lote.y0 - 40 && sd.ponto[1] <= lote.y1 + 40 && (fr.f === 'o' || fr.f === 'l')){
            lote.tipo = 'sede'; lote.alt = 62; lote.cor = sd.cor; lote.rot = sd.rot; lote.lado = k;
            sedeDe[k] = lote;
          }
        }
        LOTES.push(lote); q.lotes.push(lote);
      }
    }
    if(!raso) q.quintal = { x0:q.ix0+prof, x1:q.ix1-prof, y0:q.iy0+prof, y1:q.iy1-prof, alt:10, cor:'#a8a08c' };
  }
  QUADRAS.forEach(lotear);
  for(const q of QUADRAS){
    const pts = [];
    for(let k=0;k<=8;k++){ const t = k/8; pts.push([q.x0 + (q.x1-q.x0)*t, q.y0], [q.x0 + (q.x1-q.x0)*t, q.y1], [q.x0, q.y0 + (q.y1-q.y0)*t], [q.x1, q.y0 + (q.y1-q.y0)*t]); }
    pts.push([q.cx, q.cy]);
    q.cortada = pts.some(([x, y]) => naAvenida(x, y));
  }

  /* as casas rotacionadas na frente das avenidas: caminha ao longo do
     eixo, um lote de cada lado, e só aceita se os quatro cantos caem no
     miolo de um mesmo quarteirão e não pisam em lote que já existe */
  for(const av of AVENIDAS){
    for(const lado of [-1, 1]){
      let t = 30;
      while(t < av.L - 30){
        const w = par8(entre(56, 112)), h = par8(entre(56, 80));
        const off = av.l/2 + CALC + h/2 + 2;
        const cx = av.x0 + av.ux*(t + w/2) - av.uy*off*lado;
        const cy = av.y0 + av.uy*(t + w/2) + av.ux*off*lado;
        const q = celulaEm(cx, cy);
        const tipo = q && q.tipo === 'quadra' ? tipoDoLote(q) : null;
        if(tipo){
          const T = TIPOS[tipo];
          const lote = { quadra:q, frente:'av', tipo, cx, cy, w, h, ang: av.ang,
                         alt: par8(entre(T.alt[0], T.alt[1])) || T.alt[0], cor: escolher(T.cor) };
          const cantos = cantosDoLote(lote);
          const cabe = cantos.every(([x, y]) => x >= q.ix0 && x < q.ix1 && y >= q.iy0 && y < q.iy1) &&
                       !cantos.some(([x, y]) => q.lotes.some(o => !o.ang && dentroRet(x, y, o)));
          if(cabe){ LOTES.push(lote); q.lotes.push(lote); }
        }
        t += w + 4;
      }
    }
  }

  /* ---- as moitas do mato: só onde é mato, num balde espacial ---- */
  const MOITAS = [];
  const BALDE = 256, baldes = new Map();
  const chave = (x, y) => ((x/BALDE)|0) + ',' + ((y/BALDE)|0);
  for(let n=0;n<2600;n++){
    const x = VX0 + rng()*VW, y = VY0 + rng()*VH;
    if(zona(x, y) !== 'mato') continue;
    if(x >= 0 && y >= 0 && x < W && y < H && (naRua(x, y) || naAvenida(x, y))) continue;
    const m = { x, y, r: entre(16, 40) };
    MOITAS.push(m);
    if(x >= -BALDE && y >= -BALDE){
      const k = chave(x, y);
      if(!baldes.has(k)) baldes.set(k, []);
      baldes.get(k).push(m);
    }
  }
  function naMoita(x, y){
    const bx = (x/BALDE)|0, by = (y/BALDE)|0;
    for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++){
      const l = baldes.get((bx+i) + ',' + (by+j));
      if(!l) continue;
      for(const m of l) if(Math.hypot(x - m.x, y - m.y) < m.r) return m;
    }
    return null;
  }
  /* trilhas de terra no mato, só desenho */
  const TRILHAS = [
    [[-40,300],[60,330],[140,420],[190,520],[230,610]].map(p => pxm(p[0], p[1])),
    [[-40,760],[40,720],[120,700],[200,690],[240,700]].map(p => pxm(p[0], p[1])),
    [[-40,900],[60,880],[150,930],[230,980],[250,1000]].map(p => pxm(p[0], p[1])),
    [[150,-40],[190,60],[260,120],[330,250]].map(p => pxm(p[0], p[1]))
  ];

  /* ---- carros na guia: nas ruas em volta do estádio e na orla ---- */
  const CARROS = [];
  const CORES_CARRO = ['#d9d9d9','#2b2b2b','#8a8f96','#b8242a','#2a4f9a','#e6e6e6','#6b7280'];
  (function estacionar(){
    const passo = 46;
    for(const [y0, y1] of [[QEST_Y0-RUA+8, QEST_Y0-RUA+24], [QEST_Y1+RUA-24, QEST_Y1+RUA-8]]){
      for(let x = QEST_X0 + 40; x < QEST_X1 - 60; x += passo){
        if(rng() < 0.22) continue;
        if(Math.abs(x + 17 - CX) < 90 && y0 > CY) continue;
        CARROS.push({ x0:x, x1:x+34, y0, y1, cor: escolher(CORES_CARRO) });
      }
    }
    for(const [x0, x1] of [[QEST_X0-RUA+8, QEST_X0-RUA+24], [QEST_X1+RUA-24, QEST_X1+RUA-8]]){
      for(let y = QEST_Y0 + 40; y < QEST_Y1 - 60; y += passo){
        if(rng() < 0.3) continue;
        if(Math.abs(y + 17 - CY) < 90) continue;
        CARROS.push({ x0, x1, y0:y, y1:y+34, cor: escolher(CORES_CARRO) });
      }
    }
  })();
  function noCarro(x, y){
    for(const c of CARROS) if(dentroRet(x, y, c)) return c;
    return null;
  }

  /* ---- árvores nas calçadas, postes nas ruas do estádio e na avenida ---- */
  const ARVORES = [];
  for(const q of QUADRAS){
    for(let x = q.x0 + 40; x < q.x1 - 30; x += par8(entre(120, 220))){
      if(rng() < 0.45) ARVORES.push({ x, y: q.y0 + 12, r: entre(14, 22) });
      if(rng() < 0.45) ARVORES.push({ x, y: q.y1 - 12, r: entre(14, 22) });
    }
  }
  for(const a of ARVORES){ const q = celulaEm(a.x, a.y); if(q){ (q.arvores = q.arvores || []).push(a); } }
  const POSTES = [];
  for(const q of QUADRAS){
    const passo = 200;
    if(q.y1 <= QEST_Y0 - RUA && q.y1 >= QEST_Y0 - RUA - 4)
      for(let x = q.x0 + 70; x < q.x1 - 40; x += passo) POSTES.push({ x, y: q.y1 - 8, dx:0, dz:1 });
    if(q.y0 >= QEST_Y1 + RUA && q.y0 <= QEST_Y1 + RUA + 4)
      for(let x = q.x0 + 70; x < q.x1 - 40; x += passo) POSTES.push({ x, y: q.y0 + 8, dx:0, dz:-1 });
    if(q.x1 <= QEST_X0 - RUA && q.x1 >= QEST_X0 - RUA - 4)
      for(let y = q.y0 + 90; y < q.y1 - 40; y += passo) POSTES.push({ x: q.x1 - 8, y, dx:1, dz:0 });
    if(q.x0 >= QEST_X1 + RUA && q.x0 <= QEST_X1 + RUA + 4)
      for(let y = q.y0 + 90; y < q.y1 - 40; y += passo) POSTES.push({ x: q.x0 + 8, y, dx:-1, dz:0 });
  }
  {
    const av = AVENIDAS[0];
    for(let t = 60; t < av.L - 40; t += 220){
      const off = av.l/2 + 10;
      POSTES.push({ x: av.x0 + av.ux*t - av.uy*off, y: av.y0 + av.uy*t + av.ux*off, dx: av.uy, dz: -av.ux });
    }
  }

  /* as torres de refletor, nos quatro cantos do quarteirão do estádio */
  const TORRES = [[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx, sy]) => ({
    x: CX + sx*(QEST.larg/2 - 44), z: CY + sy*(QEST.alt/2 - 44), alt: ALT.torre }));

  function noLote(x, y){
    const q = celulaEm(x, y);
    if(!q || q.tipo !== 'quadra') return null;
    for(const l of q.lotes) if(dentroLote(x, y, l)) return l;
    if(q.quintal && dentroRet(x, y, q.quintal) && !naAvenida(x, y)) return q.quintal;
    return null;
  }

  const CIDADE = { PX, MAPA, VISTA, VW, VH, VX0, VY0, pxm, pxX, pxY, RUA, CALC,
                   COLUNAS, LINHAS, CELULAS, QUADRAS, grade, celulaEm, zona, xCosta, PRAIA, ORLA,
                   CONTORNO, AVENIDAS, distAvenida, naAvenida, naRua, CAMPOS, CERCA, PORTEIRA,
                   ARQ_VARZEA, noCampo, andaNoCampo, LOTES, cantosDoLote, MOITAS, naMoita, TRILHAS,
                   CARROS, ARVORES, POSTES, SEDES, sedeDe };

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
  /* O QUE SE PISA FORA DO ESTÁDIO. A ordem importa: o mar ganha de
     tudo; depois o campo (cerca e arquibancadinha bloqueiam); a avenida
     e a rua são andáveis onde não é mar; o quarteirão bloqueia no
     miolo e anda na calçada; o mato anda menos a moita; a praia anda. */
  function andaNaCidade(x, y){
    const z = zona(x, y);
    if(z === 'mar') return false;
    const c = noCampo(x, y);
    if(c) return andaNoCampo(c, x, y);
    if(noCarro(x, y)) return false;
    if(naAvenida(x, y)) return true;
    if(naRua(x, y)) return true;
    const q = celulaEm(x, y);
    if(q && q.tipo === 'quadra'){
      const miolo = x >= q.ix0 && x < q.ix1 && y >= q.iy0 && y < q.iy1;
      return !miolo;
    }
    if(z === 'mato') return !naMoita(x, y);
    return true;                                  // praia, orla, terreno aberto
  }
  function anda(x, y){
    const a = ancora(x, y);
    if(a.d >= D.calcada){
      /* a lasca da quina, e o canto das torres: dentro do quadrado do
         estádio e fora da calçada redonda, nada se pisa */
      if(noQuadradoDoEstadio(x, y)) return false;
      if(x < 4 || y < 4 || x > W-4 || y > H-4) return false;
      return andaNaCidade(x, y);
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
    if(!q || q.d < R.corred0 || q.d > VOM.rFoot) return null;
    for(const v of VOMITORIOS){
      if(v.lado !== q.lado || q.s < v.e0 || q.s > v.e1) continue;
      /* entre a parede de dentro e a boca é a CABECEIRA: concreto
         maciço do chão até a arquibancada, sem vão nenhum */
      if(q.d < VOM.rTop) return { v, r: q.d, cabeceira: true, buraco: false, piso: alturaDegrau(q.d) };
      return { v, r: q.d, buraco: q.d < VOM.capuz, piso: pisoEscada(q.d) };
    }
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
      if(vm.cabeceira) return Y < vm.piso;         // maciço até a arquibancada
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
      const m = naMoita(X, Z);
      if(m && Y < m.r*0.9) return true;
      /* a copa das árvores também é sólida pra câmera: sem isso ela
         atravessa o pinheiro da calçada e a tela fica verde */
      const q = celulaEm(X, Z);
      if(q && q.arvores) for(const a of q.arvores)
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
    if(vm && (vm.buraco || vm.cabeceira)) return Infinity;   // céu aberto, ou maciço
    return tetoDe(r);
  }
  /* O CHÃO SOB UM PONTO: a superfície andável (ou pisável pela câmera)
     logo abaixo de (X, Y, Z), levando em conta o andar em que Y está
     — no corredor é o piso, em cima da laje é a arquibancada, no
     buraco é a escada, no bairro é o telhado. A câmera usa isto pra
     NÃO parar no chão: chão levanta a câmera; só parede e teto param. */
  function piso(X, Y, Z){
    const r = distMundo(X, Z);
    if(r >= R.calcada1) return 0;                   // prédio é parede (solido), não chão
    const vm = vomitorioMundo(X, Z);
    if(vm){
      if(vm.cabeceira || vm.buraco || Y < tetoDe(r)) return vm.piso;
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
    if(vm && vm.cabeceira) return vm.piso;          // na cabeceira, a arquibancada
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
           METRO, ARCADA, RUA, CALC, QEST, QEST_X0, QEST_X1, QEST_Y0, QEST_Y1, CIDADE,
           PERFIL, anel, ancora, ancoraMundo, dist, distMundo, alturaDegrau,
           LADOS, ponto, pontoMundo, ondeNoReto, ondeNoRetoMundo,
           VOM, VOMITORIOS, noVomitorio, vomitorioMundo, rampa, pisoEscada,
           PORTOES, noPortao, noPortaoMundo, LOJA, LOJAS, naLoja,
           QUADRAS, LOTES, CARROS, ARVORES, TORRES, SEDES, noLote, noCarro, andaNaCidade,
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
  const CID = P.CIDADE;
  /* a calçada na frente de um lote: o meio da frente, dezesseis pra fora */
  function frenteDa(lote, folga){
    const f = folga || 16;
    if(lote.frente === 'n') return { x: Math.round((lote.x0+lote.x1)/2), y: Math.round(lote.y0 - f) };
    if(lote.frente === 's') return { x: Math.round((lote.x0+lote.x1)/2), y: Math.round(lote.y1 + f) };
    if(lote.frente === 'o') return { x: Math.round(lote.x0 - f), y: Math.round((lote.y0+lote.y1)/2) };
    return { x: Math.round(lote.x1 + f), y: Math.round((lote.y0+lote.y1)/2) };
  }
  const sedeM = CID.sedeDe.mandante, sedeV = CID.sedeDe.visitante;
  const pM = sedeM ? frenteDa(sedeM) : { x: Math.round(CID.pxX(280)), y: Math.round(CID.pxY(1030)) };
  const pV = sedeV ? frenteDa(sedeV) : { x: Math.round(CID.pxX(1050)), y: Math.round(CID.pxY(178)) };
  const [xM2, yM2] = CID.pxm(350, 946);
  const [xSet, ySet] = P.ponto('l', CY + 26, 118);
  const spawns = [
    { id:'mandante1', rot:'1º ESCALÃO', lado:'mandante', x:pM.x, y:pM.y,
      jogador:true, entrada:'setor_mandante' },
    { id:'mandante2', rot:'2º ESCALÃO', lado:'mandante', x:Math.round(xM2), y:Math.round(yM2),
      entrada:'setor_mandante' },
    { id:'visitante1', rot:'SETOR VISITANTE', lado:'visitante', x:Math.round(xSet), y:Math.round(ySet),
      guarda:true, entrada:'saida_sul' },
    { id:'visitante2', rot:'RETAGUARDA', lado:'visitante', x:pV.x, y:pV.y,
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
  /* A SAÍDA DELES É PELO PORTÃO SUL, no funil do cordão, e não pelo
     leste, que fica a treze segundos do setor: acordado e em paz, o
     bonde caminha pro destino, e pelo sul ele atravessa o corredor por
     trinta e cinco segundos — é onde ele cruza com quem está entrando. */
  const [xSai, ySai] = P.ponto('s', CX + 22, 352);
  const entradas = [
    setor('o', 'setor_mandante',  'SETOR MANDANTE'),
    setor('l', 'setor_visitante', 'SETOR VISITANTE'),
    { id:'saida_sul', rot:'SAÍDA SUL', lado:'visitante', x:Math.round(xSai), y:Math.round(ySai),
      raio:36, dir:[0,1], saida:true }
  ];

  /* A PM: nos três portões, no corredor, nas divisas de setor e na
     rua do sul, que é onde os dois lados se cruzam se alguém for caçar */
  const calc = (lado, s) => { const [x, y] = P.ponto(lado, s + 24, 354); return { x:Math.round(x), y:Math.round(y) }; };
  const corr = (lado, s) => { const [x, y] = P.ponto(lado, s, 246); return { x:Math.round(x), y:Math.round(y) }; };
  const arq  = (lado, s) => { const [x, y] = P.ponto(lado, s + 30, 100); return { x:Math.round(x), y:Math.round(y) }; };
  const [xAv, yAv] = CID.pxm(560, 470), [xOrla, yOrla] = CID.pxm(988, 300);
  const pmPostos = [
    calc('o', CY), calc('l', CY), calc('s', CX),
    corr('n', CX-60), corr('s', CX+60),
    arq('n', CX), arq('s', CX),
    { x: CX, y: P.QEST_Y1 + P.RUA/2 },
    { x: Math.round(xAv), y: Math.round(yAv) },       // onde a avenida do sudoeste chega
    { x: Math.round(xOrla), y: Math.round(yOrla) }    // a orla, do lado visitante
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
    /* o setor deles dorme até o seu bonde chegar a 200 — no TABULEIRO,
       onde o corredor norte é vizinho da arquibancada leste (a dobra);
       com 300 ele acordava com o bonde ainda do outro lado da laje */
    gatilho:{ lado:'mandante', perto:200, rot:'DE OLHO',
              espera:'o setor deles ainda não se mexeu',
              aviso:'o setor deles viu o bonde chegar' },
    planta: P
  };
})();

/* Entra no mapa de cenas sem que `cenas.js` precise saber que
   este arquivo existe — basta ser carregado depois dele. */
TO.dados.cenas = TO.dados.cenas || {};
TO.dados.cenas.estadio = TO.dados.cenaEstadio;
