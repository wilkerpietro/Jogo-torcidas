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
  /* A RUA E A CALÇADA, NA ESCALA DO BONECO. Ele tem 39 unidades e mede
     1,75 m, então a unidade é 4,5 cm. Com RUA 70 a pista tinha 3,1 m e
     a calçada 1,4 — o boneco era grande demais pra rua. Agora a pista
     do estádio tem 5,8 m e a calçada 2,2. */
  const RUA = 128, CALC = 48;

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
  /* ONDE A CIDADE ACABA NA COSTA: a guia oeste da avenida beira-mar.
     Daí pra leste é asfalto da orla, areia e mar — quarteirão nenhum
     pisa lá. Como `xCosta` é linear por trecho e o recuo é horizontal
     e constante, a linha do limite é a própria COSTA empurrada. */
  const xLimiteCosta = y => pxX(xCosta(y/PX + MAPA.y0) - PRAIA - ORLA);
  const LIMITE_COSTA = COSTA.map(([px, py]) => pxm(px - PRAIA - ORLA, py));
  const areaPol = pol => {
    let a = 0;
    for(let i=0;i<pol.length;i++){ const p = pol[i], q = pol[(i+1)%pol.length]; a += p[0]*q[1] - q[0]*p[1]; }
    return Math.abs(a)/2;
  };
  /* ponto dentro de um polígono CONVEXO: todos os lados do mesmo lado */
  function dentroPol(x, y, pol){
    if(!pol || pol.length < 3) return false;      // polígono vazio não contém nada
    let mais = false, menos = false;
    for(let i=0;i<pol.length;i++){
      const a = pol[i], b = pol[(i+1)%pol.length];
      const d = (b[0]-a[0])*(y-a[1]) - (b[1]-a[1])*(x-a[0]);
      if(d > 0) mais = true; else if(d < 0) menos = true;
      if(mais && menos) return false;
    }
    return true;
  }
  /* recorta um polígono convexo pelo meio-plano n·p <= d */
  function cortarPor(pol, nx, ny, d){
    const out = [];
    for(let i=0;i<pol.length;i++){
      const a = pol[i], b = pol[(i+1)%pol.length];
      const da = nx*a[0] + ny*a[1] - d, db = nx*b[0] + ny*b[1] - d;
      if(da <= 0) out.push(a);
      if((da < 0) !== (db < 0)){
        const t = da/(da - db);
        out.push([a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t]);
      }
    }
    return out;
  }
  /* o retângulo cortado pela linha da costa, trecho por trecho */
  function recorteCosta(ret){
    let pol = [[ret.x0, ret.y0], [ret.x1, ret.y0], [ret.x1, ret.y1], [ret.x0, ret.y1]];
    for(let k=1;k<LIMITE_COSTA.length;k++){
      const [ax, ay] = LIMITE_COSTA[k-1], [bx, by] = LIMITE_COSTA[k];
      if(Math.max(ay, by) < ret.y0 || Math.min(ay, by) > ret.y1) continue;
      const nx = by - ay, ny = -(bx - ax);        // normal apontando pro mar
      pol = cortarPor(pol, nx, ny, nx*ax + ny*ay);
      if(pol.length < 3) return [];
    }
    return pol;
  }
  /* ---- o contorno da cidade, em px: fora dele é mato ---- */
  const CONTORNO = [[300,250],[400,160],[560,110],[620,100],[700,95],[850,100],[1000,110],
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
  /* A GRADE É LARGA DE PROPÓSITO. Antes eram treze colunas e quinze
     linhas a cada 70 px: quarteirão de 11 m, que cabia três casas e
     não lia como quarteirão. Agora o passo é 150 px — quarteirão de
     27 m, umas seis casas por face — e a rua tem 22 px (5,3 m de
     pista) em vez de 12. As quatro que encostam no estádio continuam
     vindo do quarteirão dele, pra bater exatamente. */
  const COLUNAS = [ coluna(194,22), coluna(344,22), coluna(494,22),
                    { c: QEST_X0 - RUA/2, l: RUA }, { c: QEST_X1 + RUA/2, l: RUA },
                    coluna(1036,22), coluna(1186,22) ];
  /* AS LINHAS SÃO MAIS JUNTAS QUE AS COLUNAS, de propósito: quarteirão
     bom é comprido e raso, com as casas de uma face encostando o fundo
     nas da outra. Com 150 px nos dois eixos sobrava um descampado no
     miolo; com 86 px aqui o fundo de uma fileira encosta no da outra. */
  const LINHAS  = [ linha(118,22), { c: QEST_Y0 - RUA/2, l: RUA }, { c: QEST_Y1 + RUA/2, l: RUA },
                    linha(491,22), linha(577,22), linha(663,22), linha(749,22),
                    linha(835,22), linha(921,22), linha(1007,22), linha(1093,22) ];
  const noQuadradoDoEstadio = (x, y) =>
    x >= QEST_X0 && x < QEST_X1 && y >= QEST_Y0 && y < QEST_Y1;

  /* ---- os campos de várzea: células abertas com cerca ---- */
  const campo = (x0, y0, x1, y1) => {
    const [X0, Y0] = pxm(x0, y0), [X1, Y1] = pxm(x1, y1);
    return { x0:X0, y0:Y0, x1:X1, y1:Y1, cx:(X0+X1)/2, cy:(Y0+Y1)/2 };
  };
  /* Os dois campos de várzea. O retângulo aqui é só a INTENÇÃO: diz
   quais células o campo toma. Passada a classificação, ele encolhe
   pra caixa dessas células, recuado da calçada — é o que o faz caber
   no quarteirão em vez de atravessar a rua e a areia. */
  /* os dois campos ficam onde a avenida não passa: a diagonal cruza
     quase todo quarteirão grande, e cerca em cima de asfalto não vai */
  const CAMPOS = [ campo(510, 220, 630, 390), campo(360, 1020, 480, 1090) ];
  const CERCA = 6, PORTEIRA = 24;
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
    return true;
  }

  /* ---- as avenidas: LINHAS DE VÁRIOS PONTOS, com largura, no mundo.
     Uma avenida do mapa não é um segmento: ela dobra (a do sudoeste
     dobra perto do canto), nasce numa rua da grade e morre em outra —
     ou sai da cidade e vira estrada pelo mato até a borda do que se
     desenha. Aqui os pontos vão até essa borda; fora do tabuleiro eles
     não fazem célula, só pintura. ---- */
  const avenida = (pontos, lpx, id) => {
    const P = pontos.map(([x, y]) => pxm(x, y));
    const segs = [];
    let L = 0;
    for(let k=1;k<P.length;k++){
      const [x0, y0] = P[k-1], [x1, y1] = P[k];
      const len = Math.hypot(x1-x0, y1-y0);
      segs.push({ x0, y0, x1, y1, L: len, t0: L, ux:(x1-x0)/len, uy:(y1-y0)/len, ang: Math.atan2(y1-y0, x1-x0) });
      L += len;
    }
    const l = lpx*PX, m = l/2 + CALC + 4;
    const cx = P.map(p => p[0]), cy = P.map(p => p[1]);
    return { id, pontos: P, segs, l, L,
             /* caixa em volta, pra `naAvenida` descartar de longe: com a
                beira-mar são 21 trechos, e a máscara pergunta 460 mil vezes */
             bx0: Math.min(...cx) - m, bx1: Math.max(...cx) + m,
             by0: Math.min(...cy) - m, by1: Math.max(...cy) + m };
  };
  /* as colunas/linhas em px onde as avenidas desaguam */
  const AVENIDAS = [
    /* a grande do sudoeste: entra pelo canto, dobra e vai até a rua sul
       do estádio */
    avenida([[120, 1160], [212, 1010], [603, 400.4]], 16, 'sudoeste'),
    /* a do noroeste: nasce na coluna 315 e sai da cidade pelo norte */
    avenida([[321, 263], [612, 108], [700, 58], [740, -60]], 14, 'noroeste'),
    /* as saídas pro oeste: nascem na coluna 315 e viram estrada */
    avenida([[315, 541], [170, 555], [40, 575], [-60, 600]], 12, 'oeste'),
    avenida([[321, 245], [170, 200], [60, 170], [-60, 150]], 12, 'noroeste2'),
    /* a saída pro norte, em cima do estádio */
    avenida([[765, 135], [765, -60]], 14, 'norte'),
    /* A BEIRA-MAR: corre rente à areia, acompanhando a costa. Ser
       avenida é o que dá a ela calçada no lado de terra e casas
       rotacionadas de frente pro mar — a faixa entre o último
       quarteirão reto e a praia é diagonal, e casa reta não entra lá. */
    avenida(COSTA.map(([x, y]) => [x - PRAIA - ORLA/2, y]), ORLA, 'beiramar')
  ];
  /* distância de (x,y) ao eixo da avenida — o segmento mais perto, e
     onde ao longo dele */
  function distAvenida(av, x, y){
    let melhor = null;
    for(const sg of av.segs){
      const dx = x - sg.x0, dy = y - sg.y0;
      const t = Math.max(0, Math.min(sg.L, dx*sg.ux + dy*sg.uy));
      const d = Math.hypot(dx - sg.ux*t, dy - sg.uy*t);
      if(!melhor || d < melhor.d) melhor = { d, t: sg.t0 + t, seg: sg };
    }
    return melhor;
  }
  function naAvenida(x, y, folga){
    for(const av of AVENIDAS){
      if(x < av.bx0 || x > av.bx1 || y < av.by0 || y > av.by1) continue;
      const q = distAvenida(av, x, y);
      if(q.d <= av.l/2 + (folga === undefined ? CALC : folga)) return { av, ...q };
    }
    return null;
  }
  /* a mesma faixa, mas SEM a ponta redonda nas duas extremidades: é o
     que vale pra decidir quem é "casa da avenida". A avenida acaba
     numa rua da grade, e o quarteirão do outro lado dessa rua não é
     dela — se a ponta contasse, ele ficava pelado. */
  function naFaixaDaAvenida(x, y, folga){
    for(const av of AVENIDAS){
      if(x < av.bx0 || x > av.bx1 || y < av.by0 || y > av.by1) continue;
      const n = av.segs.length;
      for(let k=0;k<n;k++){
        const sg = av.segs[k];
        const dx = x - sg.x0, dy = y - sg.y0;
        let t = dx*sg.ux + dy*sg.uy;
        if(t < 0 && k === 0) continue;
        if(t > sg.L && k === n-1) continue;
        t = Math.max(0, Math.min(sg.L, t));
        if(Math.hypot(dx - sg.ux*t, dy - sg.uy*t) <= av.l/2 + folga) return true;
      }
    }
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
      /* O MIOLO PARA NA COSTA. É retângulo e a costa é diagonal, então
         recua até o ponto mais a oeste da linha no trecho da célula (o
         canto sul): assim o miolo inteiro fica em terra. E quem decide
         se a célula é quarteirão é o MIOLO QUE SOBRA, não o centro da
         célula — na faixa da orla o centro já cai na areia, e a terra
         que sobrava virava mato entre o último quarteirão e a praia. */
      /* o MIOLO em polígono, recortado pela costa: é ele que vale pra
         máscara, pra casa rotacionada e pro chão. O retângulo
         `ix0..ix1` é o maior que cabe nele com folga (recuado até o
         ponto mais a oeste da costa no trecho), e é o que os lotes
         axiais usam, que são retos. */
      /* célula mais fina que duas calçadas tem miolo às avessas: não é
         miolo nenhum, e `areaPol` do avesso daria área de verdade */
      cel.polMiolo = cel.ix1 - cel.ix0 > 48 && cel.iy1 - cel.iy0 > 48
        ? recorteCosta({ x0: cel.ix0, x1: cel.ix1, y0: cel.iy0, y1: cel.iy1 }) : [];
      /* nunca do avesso: na orla o recuo pode passar do ix0 */
      cel.ix1 = Math.max(cel.ix0, Math.min(cel.ix1, xLimiteCosta(cel.iy0), xLimiteCosta(cel.iy1)));
      if(x1 - x0 < 4 || y1 - y0 < 4) cel.tipo = 'nada';
      else if(noQuadradoDoEstadio(cel.cx, cel.cy)) cel.tipo = 'estadio';
      else if(noCampo(cel.cx, cel.cy) || CAMPOS.some(f => x0 < f.x1 && x1 > f.x0 && y0 < f.y1 && y1 > f.y0 &&
              Math.min(x1, f.x1) - Math.max(x0, f.x0) > (x1-x0)*0.5 && Math.min(y1, f.y1) - Math.max(y0, f.y0) > (y1-y0)*0.5)) cel.tipo = 'campo';
      else if(cel.polMiolo.length >= 3 && areaPol(cel.polMiolo) > 48*48 &&
              zona(cel.polMiolo.reduce((a, p) => a + p[0], 0)/cel.polMiolo.length,
                   cel.polMiolo.reduce((a, p) => a + p[1], 0)/cel.polMiolo.length) === 'cidade') cel.tipo = 'quadra';
      cel.urbana = cel.tipo !== 'nada' && (cel.tipo !== 'aberto' || zona(cel.cx, cel.cy) === 'cidade');
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
  /* O POLÍGONO MENOS AS BANDAS DAS AVENIDAS.
     Corta meio-plano a meio-plano: o que sobra continua convexo, então
     dá pra ir cortando banda por banda. Uma banda que atravessa o
     polígono o parte em dois, e os dois voltam na lista. Quem usa: o
     chão do quarteirão no 3D e as pracinhas das cunhas. */
  function pedacosSemAvenida(ret, folga){
    const base = Array.isArray(ret) ? ret : recorteCosta(ret);
    if(base.length < 3) return [];
    let pecas = [base];
    for(const av of AVENIDAS){
      const meia = av.l/2 + (folga || 0);
      for(const sg of av.segs){
        const nx = -sg.uy, ny = sg.ux, c = nx*sg.x0 + ny*sg.y0;
        const ds = base.map(([x, y]) => nx*x + ny*y - c);
        if(Math.min(...ds) > meia || Math.max(...ds) < -meia) continue;
        const ts = base.map(([x, y]) => (x - sg.x0)*sg.ux + (y - sg.y0)*sg.uy);
        if(Math.max(...ts) < -meia || Math.min(...ts) > sg.L + meia) continue;
        const novas = [];
        for(const p of pecas){
          const esq = cortarPor(p, nx, ny, c - meia);
          const dir = cortarPor(p, -nx, -ny, -(c + meia));
          if(esq.length >= 3) novas.push(esq);
          if(dir.length >= 3) novas.push(dir);
        }
        pecas = novas;
      }
    }
    return pecas;
  }

  /* ---- as ruas da grade num ponto: SÓ ENTRE CÉLULAS URBANAS. A faixa
     de rua existe onde alguma célula encostada nela é quarteirão,
     campo, estádio ou terreno da cidade; entre duas células de mato
     não há asfalto — a rua acaba no último quarteirão, e a saída da
     cidade é a avenida. ---- */
  /* há rua nessa faixa? Há se alguma célula encostada é urbana — e não
     há entre duas células de CAMPO, que são as duas metades do mesmo
     campo: rua nenhuma corta um campo de várzea ao meio. */
  const ruaEntre = cels => cels.some(c => c.urbana) && !(cels.length > 1 && cels.every(c => c.tipo === 'campo'));
  function naRua(x, y){
    if(x < 0 || y < 0 || x >= W || y >= H) return false;
    const i = indiceEm(bordasX, x), j = indiceEm(bordasY, y);
    const emColuna = i % 2 === 1, emLinha = j % 2 === 1;
    if(!emColuna && !emLinha) return false;
    const is = emColuna ? [(i-1)/2, (i+1)/2] : [i/2];
    const js = emLinha ? [(j-1)/2, (j+1)/2] : [j/2];
    const cels = [];
    for(const a of is) for(const b of js){ const c = grade[a] && grade[a][b]; if(c) cels.push(c); }
    return cels.length ? ruaEntre(cels) : false;
  }
  /* ---- o campo encolhe pra dentro do quarteirão ----
     A caixa das células que ele tomou, menos a calçada. Assim a cerca
     nunca cai na rua, e o gramado nunca passa da guia. */
  for(const f of CAMPOS){
    const suas = CELULAS.filter(c => c.tipo === 'campo' && c.x0 < f.x1 && c.x1 > f.x0 && c.y0 < f.y1 && c.y1 > f.y0);
    if(!suas.length) continue;
    /* o miolo das células, que já vem recuado da calçada E da costa */
    f.x0 = Math.min(...suas.map(c => c.ix0));
    f.x1 = Math.max(...suas.map(c => c.ix1));
    f.y0 = Math.min(...suas.map(c => c.iy0));
    f.y1 = Math.max(...suas.map(c => c.iy1));
    f.cx = (f.x0 + f.x1)/2; f.cy = (f.y0 + f.y1)/2;
  }

  /* o chão do quarteirão, esse, segue a diagonal da costa */
  for(const cel of CELULAS) cel.pol = cel.tipo === 'nada' ? [] : recorteCosta(cel);
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

  /* A ESCALA É A DO BONECO: ele tem 39 unidades e mede 1,75 m, então
     uma unidade é 4,5 cm. Com as alturas antigas a casa tinha 1,6 m e a
     porta 0,90 — o boneco não passava por ela. Aqui está em metros de
     verdade: pé-direito de 3, sobrado de 6, muro de 1,9. */
  const TIPOS = {
    casa:    { alt:[66, 80],   cor:['#e8dcc0','#d9c9a3','#e2b9a6','#cfd8c9','#e6e2d6','#d8c8b0','#e9d3b3'] },
    sobrado: { alt:[112, 136], cor:['#e3d3b2','#c9b48a','#d4a48f','#b7c4c2','#ded9cd'] },
    predio:  { alt:[160, 240], cor:['#cfcac0','#b9b4aa','#d5d0c4','#a9b0b6','#e0dcd2'] },
    muro:    { alt:[38, 48],   cor:['#b0a794','#a59a86','#bdb3a0','#9d9585'] },
    galpao:  { alt:[96, 128],  cor:['#9fa4a6','#8f948f','#a8a39a'] }
  };
  /* =========================================================
     AS DUAS TORCIDAS DA CENA
     ---------------------------------------------------------
     A cena não é mais "mandante contra visitante": são DUAS TORCIDAS
     do `dados/torcidas.js`, com nome, sigla, efetivo e as cores delas.
     Quem escolhe é a planta, com a semente da planta, e a página lê a
     mesma escolha pra montar os bondes do combate — a camisa do boneco
     e a pintura da sede saem da MESMA linha do arquivo, então não há
     como uma desencontrar da outra.

     `dados/torcidas.js` pode não estar carregado (as outras páginas não
     o carregam): aí valem duas de reserva, que é o que a cena tinha.
     ========================================================= */
  /* as três cores: primária, secundária e terciária. A paleta mente —
     cinquenta das 140 repetem a primária em `cores[1]` —, então cada
     uma só vale se for DIFERENTE das anteriores. */
  function coresDaTorcida(t){
    const lista = [...((t && t.cores) || []), t && t.detalhe]
      .filter(Boolean).map(c => String(c).toUpperCase());
    const cor  = lista[0] || null;
    const cor2 = lista.slice(1).find(c => c !== cor) || null;
    const cor3 = lista.slice(1).find(c => c !== cor && c !== cor2) || null;
    return { cor, cor2, cor3 };
  }
  /* duas cores que, na tela, são a mesma cor */
  function pertoDaCor(a, b){
    if(!a || !b) return false;
    const n = h => { const v = parseInt(String(h).slice(1), 16); return [v>>16&255, v>>8&255, v&255]; };
    const [r1,g1,b1] = n(a), [r2,g2,b2] = n(b);
    return Math.abs(r1-r2) + Math.abs(g1-g2) + Math.abs(b1-b2) < 230;
  }
  function escolherTorcidas(){
    const reserva = {
      mandante:  { id:'casa', nome:'MANDANTE',  rot:'MANDANTE',  nomeCompleto:'MANDANTE',
                   clubeSigla:'CASA', clubeCor:'#b02a22', clubeCor2:'#e8e2d0', efetivo:180,
                   cor:'#b02a22', cor2:'#e8e2d0', cor3:'#1a1a1a' },
      visitante: { id:'fora', nome:'VISITANTE', rot:'VISITANTE', nomeCompleto:'VISITANTE',
                   clubeSigla:'FORA', clubeCor:'#22439a', clubeCor2:'#e8e2d0', efetivo:150,
                   cor:'#22439a', cor2:'#e8e2d0', cor3:'#e0b040' }
    };
    const T = (typeof TO !== 'undefined' && TO.dados && TO.dados.torcidas) || null;
    if(!T || !T.length) return reserva;
    const porId = new Map(T.map(t => [t.id, t]));
    const TIMES = (typeof TO !== 'undefined' && TO.dados && TO.dados.times) || [];
    const ficha = (t, lado) => {
      const cl = TIMES.find(o => o.id === t.clubeId) || null;
      const cc = (cl && cl.cores || []).map(c => String(c).toUpperCase());
      return Object.assign({ id:t.id, lado,
        nome: t.siglaTorcida || t.nome, rot: (t.siglaTorcida || t.nome).toUpperCase(),
        /* o nome por extenso vai na placa da sede; a sigla continua
           sendo a chave curta da barra de estado */
        nomeCompleto: (t.nome || t.siglaTorcida || '').toUpperCase(),
        clube: t.clube, clubeId: t.clubeId || (cl && cl.id) || null,
        clubeSigla: (cl && cl.sigla) || t.sigla || '',
        clubeCor: cc[0] || null, clubeCor2: cc.find(c => c !== cc[0]) || '#e8e2d0',
        efetivo: Math.max(40, Math.round(t.membros || 120)) }, coresDaTorcida(t));
    };
    /* A DE CASA é uma das grandes, com duas cores de verdade e rival no
       elenco; entre elas vêm primeiro as de TRÊS cores, porque a sede
       pinta a frente na primária e os detalhes na segunda e na terceira
       — com uma tricolor dá pra ver as três. */
    const serve = t => { const c = coresDaTorcida(t); return c.cor && c.cor2; };
    const casa = T.filter(t => serve(t) && (t.membros || 0) >= 150 && (t.rivais || []).some(r => porId.has(r)));
    if(!casa.length) return reserva;
    const tri = casa.filter(t => coresDaTorcida(t).cor3);
    const m = (tri.length ? tri : casa)[Math.floor(rng()*(tri.length ? tri : casa).length)];
    const cm = coresDaTorcida(m);
    /* O RIVAL tem de dar pra distinguir de longe: primária LONGE da
       nossa, senão as duas camisas viram uma só no meio da briga. */
    const cand = (m.rivais || []).map(r => porId.get(r)).filter(Boolean)
      .filter(t => serve(t) && (t.membros || 0) >= 100 && !pertoDaCor(coresDaTorcida(t).cor, cm.cor));
    if(!cand.length) return reserva;
    const triV = cand.filter(t => coresDaTorcida(t).cor3);
    const pool = triV.length ? triV : cand;
    const v = pool[Math.floor(rng()*pool.length)];
    return { mandante: ficha(m, 'mandante'), visitante: ficha(v, 'visitante') };
  }
  const TORCIDAS = escolherTorcidas();

  /* a sede de cada torcida: um ponto do mapa, a frente em que ela fica
     e a torcida que mora nela. É onde a torcida nasce. */
  const SEDES = {
    mandante:  { ponto: pxm(280, 1058), frente:'n', torcida: TORCIDAS.mandante,
                 cor: TORCIDAS.mandante.cor, rot: TORCIDAS.mandante.rot },
    visitante: { ponto: pxm(980, 255),  frente:'n', torcida: TORCIDAS.visitante,
                 cor: TORCIDAS.visitante.cor, rot: TORCIDAS.visitante.rot }
  };
  const sedeDe = {};

  /* o lote intersecta uma avenida (com folga)? testa os cantos e o centro */
  function cantosDoLote(l){
    if(!l.ang) return [[l.x0,l.y0],[l.x1,l.y0],[l.x1,l.y1],[l.x0,l.y1],[(l.x0+l.x1)/2,(l.y0+l.y1)/2]];
    const c = Math.cos(l.ang), s = Math.sin(l.ang), hw = l.w/2, hh = l.h/2;
    const r = (u, v) => [l.cx + u*c - v*s, l.cy + u*s + v*c];
    return [r(-hw,-hh), r(hw,-hh), r(hw,hh), r(-hw,hh), [l.cx, l.cy]];
  }
  /* DISTÂNCIA EXATA entre um retângulo (girado ou não) e o eixo de uma
     avenida. Testar só os cantos e o centro não basta: a avenida é
     diagonal e tem ponta redonda, então ela morde o MEIO de uma aresta
     do lote sem tocar canto nenhum. Para dois convexos o mínimo está
     sempre num vértice de um contra uma aresta do outro — aqui, canto
     do retângulo contra o segmento, e ponta do segmento contra o
     retângulo —, e zero se eles se cruzam. */
  function distSegRet(ax, ay, bx, by, hw, hh){
    /* NaN ENTRA E VIRA ZERO se passar daqui: no recorte abaixo toda
       comparação com NaN é falsa, os quatro meios-planos "passam" e a
       função responde "distância zero", que é "está em cima da
       avenida". Foi isso que reprovou a praça em quarteirão nenhum. */
    if(!Number.isFinite(ax) || !Number.isFinite(ay) || !Number.isFinite(bx) ||
       !Number.isFinite(by) || !Number.isFinite(hw) || !Number.isFinite(hh)) return Infinity;
    if((Math.abs(ax) <= hw && Math.abs(ay) <= hh) ||
       (Math.abs(bx) <= hw && Math.abs(by) <= hh)) return 0;
    const dx = bx - ax, dy = by - ay;
    let t0 = 0, t1 = 1, cruza = true;
    const fatia = (p, q) => {                 // recorte de Liang-Barsky: p*t <= q
      if(p === 0) return q >= 0;
      const r = q / p;
      if(p < 0){ if(r > t1) return false; if(r > t0) t0 = r; }
      else     { if(r < t0) return false; if(r < t1) t1 = r; }
      return true;
    };
    for(const [p, q] of [[-dx, ax + hw], [dx, hw - ax], [-dy, ay + hh], [dy, hh - ay]])
      if(!fatia(p, q)){ cruza = false; break; }
    if(cruza) return 0;
    const L2 = dx*dx + dy*dy;
    const aoSeg = (x, y) => {
      const t = L2 ? Math.max(0, Math.min(1, ((x-ax)*dx + (y-ay)*dy) / L2)) : 0;
      return Math.hypot(x - ax - dx*t, y - ay - dy*t);
    };
    const aoRet = (x, y) => Math.hypot(Math.max(Math.abs(x) - hw, 0), Math.max(Math.abs(y) - hh, 0));
    let m = Math.min(aoRet(ax, ay), aoRet(bx, by));
    for(const [x, y] of [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]]) m = Math.min(m, aoSeg(x, y));
    return m;
  }
  /* o corpo do lote (ou de uma peça, que também é retângulo) encosta no
     asfalto de alguma avenida? Aqui entra a PONTA da avenida também:
     ela é asfalto de verdade, e `naFaixaDaAvenida`, que a ignora, só
     serve pra dizer quem é "casa da avenida". */
  function tocaAvenida(l, folga){
    const g = folga === undefined ? CALC : folga;
    /* girado de verdade é o LOTE da avenida, que tem centro e medidas.
       Peça de equipamento pode trazer um `ang` que só o desenho usa
       (o banco da praça), e o corpo dela continua sendo o retângulo. */
    const girado = !!l.ang && Number.isFinite(l.w) && Number.isFinite(l.h) &&
                   Number.isFinite(l.cx) && Number.isFinite(l.cy);
    const cx = girado ? l.cx : (l.x0 + l.x1)/2, cy = girado ? l.cy : (l.y0 + l.y1)/2;
    const hw = girado ? l.w/2 : (l.x1 - l.x0)/2, hh = girado ? l.h/2 : (l.y1 - l.y0)/2;
    const C = girado ? Math.cos(l.ang) : 1, S = girado ? Math.sin(l.ang) : 0;
    const R = Math.hypot(hw, hh);
    for(const av of AVENIDAS){
      if(cx + R < av.bx0 || cx - R > av.bx1 || cy + R < av.by0 || cy - R > av.by1) continue;
      const lim = av.l/2 + g;
      for(const sg of av.segs){
        const ux = sg.x0 - cx, uy = sg.y0 - cy, vx = sg.x1 - cx, vy = sg.y1 - cy;
        if(distSegRet(ux*C + uy*S, -ux*S + uy*C, vx*C + vy*S, -vx*S + vy*C, hw, hh) <= lim) return true;
      }
    }
    return false;
  }
  const dentroRet = (x, y, o) => x >= o.x0 && x < o.x1 && y >= o.y0 && y < o.y1;
  function dentroLote(x, y, l){
    if(!l.ang) return dentroRet(x, y, l);
    const c = Math.cos(-l.ang), s = Math.sin(-l.ang);
    const dx = x - l.cx, dy = y - l.cy;
    const u = dx*c - dy*s, v = dx*s + dy*c;
    return Math.abs(u) <= l.w/2 && Math.abs(v) <= l.h/2;
  }
  /* cantos, centro e meio das arestas: o bastante pra ver se dois
     lotes (um deles rotacionado) se pisam */
  function pontosDoLote(l){
    const pts = cantosDoLote(l);
    if(!l.ang) return pts.concat([[(l.x0+l.x1)/2, l.y0], [l.x1, (l.y0+l.y1)/2], [(l.x0+l.x1)/2, l.y1], [l.x0, (l.y0+l.y1)/2]]);
    const c = Math.cos(l.ang), s = Math.sin(l.ang), hw = l.w/2, hh = l.h/2;
    const r = (u, v) => [l.cx + u*c - v*s, l.cy + u*s + v*c];
    return pts.concat([r(0,-hh), r(hw,0), r(0,hh), r(-hw,0)]);
  }
  const cruzaLotes = (a, b) => pontosDoLote(a).some(([x, y]) => dentroLote(x, y, b)) ||
                               pontosDoLote(b).some(([x, y]) => dentroLote(x, y, a));

  const LOTES = [];
  const PROF_AV = 124;         // o fundo das casas da avenida
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
    /* na orla o recuo da costa pode zerar o miolo: sem miolo não há
       lote, e lote de largura zero vira casa do avesso */
    if(largI < 40 || altI < 40) return;
    let prof = par8(entre(88, 112));          // 4,0 a 5,0 m de fundo
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
        let larg = par8(entre(72, 144));       // 3,2 a 6,5 m de frente
        if(a + larg > a1 - 36) larg = a1 - a;
        const tipo = tipoDoLote(q);
        const T = TIPOS[tipo];
        let lote = {
          quadra:q, frente: fr.f, tipo,
          x0: horizontal ? a : fr.x0, x1: horizontal ? a + larg : fr.x1,
          y0: horizontal ? fr.y0 : a, y1: horizontal ? fr.y1 : a + larg,
          alt: par8(entre(T.alt[0], T.alt[1])) || T.alt[0],
          cor: escolher(T.cor)
        };
        a += larg;
        /* as casas da avenida já estão no lugar: o lote axial sai se
           pisa numa delas ou encosta na calçada da avenida — antes de
           sair, tenta mais raso, encolhendo pro lado da frente; e lote
           nenhum entra no campo de várzea */
        const esbarra = l => tocaAvenida(l, CALC + 4) || q.lotes.some(o => o.ang && cruzaLotes(l, o));
        if(esbarra(lote)){
          const encolhe = (l, p) => {
            const m = { ...l };
            if(fr.f === 'n') m.y1 = m.y0 + p; else if(fr.f === 's') m.y0 = m.y1 - p;
            else if(fr.f === 'o') m.x1 = m.x0 + p; else m.x0 = m.x1 - p;
            return m;
          };
          let achou = null;
          for(const p of [48, 32, 20]) if(p < prof && !esbarra(encolhe(lote, p))){ achou = encolhe(lote, p); break; }
          if(!achou) continue;
          lote = achou;
          /* fundo de muro é muro: casa de 20 de fundo não existe, e o
             que fecha a frente do terreno vago é o muro mesmo */
          if(fr.f === 'n' || fr.f === 's' ? lote.y1 - lote.y0 <= 22 : lote.x1 - lote.x0 <= 22){
            lote.tipo = 'muro';
            lote.alt = par8(entre(TIPOS.muro.alt[0], TIPOS.muro.alt[1])) || TIPOS.muro.alt[0];
            lote.cor = escolher(TIPOS.muro.cor);
          }
        }
        if(cantosDoLote(lote).some(([x, y]) => noCampo(x, y))) continue;
        if(q.equip && cruzaRet(lote, q.equip.area)) continue;    // a fatia do equipamento
        LOTES.push(lote); q.lotes.push(lote);
      }
    }
    if(!raso){
      q.quintal = { x0:q.ix0+prof, x1:q.ix1-prof, y0:q.iy0+prof, y1:q.iy1-prof, alt:8, cor:'#96apagado' };
      q.quintal.cor = '#9a8f78';
      /* O QUINTAL PARA NA FATIA DO EQUIPAMENTO. Ele é do quarteirão
         inteiro e a fatia fica na ponta oeste dele: sem recuar, a laje
         bege de fundo de quintal entrava pela sede e aparecia no
         corredor do portão, por cima do piso dela. */
      if(q.equip) q.quintal.x0 = Math.max(q.quintal.x0, q.equip.area.x1);
      if(q.quintal.x1 - q.quintal.x0 < 24 || q.quintal.y1 - q.quintal.y0 < 24) q.quintal = null;
      /* O MIOLO É FUNDO DE QUINTAL. Com o quarteirão grande ele virou
         um descampado: entram puxadinho, garagem e laje. Nada disso
         muda a máscara — o miolo já é maciço —, é só pra ler como
         quintal em vez de pátio vazio. */
      q.fundos = [];
      if(!q.quintal) return;
      const qw = q.quintal.x1 - q.quintal.x0, qh = q.quintal.y1 - q.quintal.y0;
      const n = Math.round(qw*qh/24000);
      for(let i=0;i<n;i++){
        const w = par8(entre(44, 96)), h = par8(entre(38, 76));
        if(qw - w - 16 < 0 || qh - h - 16 < 0) continue;
        if(q.equip) continue;
        const fx = q.quintal.x0 + 8 + rng()*(qw - w - 16), fy = q.quintal.y0 + 8 + rng()*(qh - h - 16);
        /* o quintal também é cortado pela avenida: puxadinho nenhum
           em cima do asfalto (o beiral sai 2 além do corpo) */
        if(tocaAvenida({ x0: fx-2, y0: fy-2, x1: fx+w+2, y1: fy+h+2 }, CALC)) continue;
        q.fundos.push({ x0: fx, y0: fy, x1: fx + w, y1: fy + h, alt: par8(entre(32, 60)),
                        cor: escolher(['#b4ab97','#a79d88','#c0b6a0','#9aa0a2','#bdb3a0']) });
      }
    }
  }
  /* =========================================================
     OS EQUIPAMENTOS DO BAIRRO
     ---------------------------------------------------------
     Quatro quarteirões não são de casa: praça, hospital, delegacia e
     shopping. Cada um monta as próprias PEÇAS a partir do miolo da
     célula, e a peça diz se bloqueia. A máscara lê as que bloqueiam e
     o 3D desenha todas — é a mesma lista, então não há como uma
     desencontrar da outra. Tudo em retângulo reto, que é o que a
     máscara sabe perguntar rápido.
     ========================================================= */
  const COMERCIO = [
    'BAR DO ZÉ', 'BOTECO DA ESQUINA', 'BAR E MERCEARIA', 'PONTO DO CHOPE',
    'BAR DO NEGUINHO', 'BOTEQUIM DA VILA', 'LANCHONETE TRÊS IRMÃOS',
    'MERCADINHO SÃO JOÃO', 'PADARIA PÃO QUENTE', 'AÇOUGUE BOI GORDO',
    'SALÃO DA DONA MARIA', 'BARBEARIA DO TIÃO', 'BORRACHARIA 24H',
    'OFICINA DO GORDO', 'LOTÉRICA SORTE GRANDE', 'FARMÁCIA POPULAR',
    'MATERIAIS DE CONSTRUÇÃO', 'SORVETERIA GELADÃO', 'PASTEL DA FEIRA',
    'LAN HOUSE CYBER', 'DEPÓSITO DE BEBIDAS', 'CASA DE CARNES',
    'ELETRÔNICA DO ZÉ', 'CHAVEIRO 24 HORAS', 'BAZAR PREÇO BOM',
    'AUTO PEÇAS IRMÃOS', 'MÓVEIS POPULARES', 'GÁS E ÁGUA',
    'SALGADOS DA VÓ', 'ESPETINHO DO MINEIRO', 'MERCEARIA DOIS IRMÃOS',
    'COSTURA E CONSERTOS', 'VIDRAÇARIA CENTRAL', 'PEIXARIA MARÉ ALTA'
  ];
  const PIXACAO = [
    'O BAIRRO É NOSSO', 'RESPEITA A VILA', 'SÓ OS FORTES', 'AQUI É RESENHA',
    'VENDE-SE', 'ALUGA-SE', 'PINTA-SE CASAS', 'PRECISA-SE DE AJUDANTE',
    'É PROIBIDO JOGAR LIXO', 'NÃO ESTACIONE', 'ENTRADA DE VEÍCULOS',
    'TE AMO MARIA', 'SAUDADES ETERNAS', 'A VILA NÃO SE RENDE',
    'DEUS É FIEL', 'A TORCIDA MANDA', 'AQUI É TORCIDA', 'GERAL DO BAIRRO',
    'NINGUÉM SEGURA', 'DOMINGO TEM JOGO', 'PROIBIDO COLAR CARTAZ',
    'CUIDADO COM O CÃO', 'TEM ÁGUA', 'LAVA-SE ROUPA', 'CONSERTA-SE GELADEIRA'
  ];
  const EQUIPAMENTOS = [
    { tipo: 'hospital',  ponto: pxm(765, 448) },   // logo ao sul do estádio
    { tipo: 'delegacia', ponto: pxm(419, 448) },   // a oeste, no caminho da torcida
    { tipo: 'shopping',  ponto: pxm(568, 792) },   // no nordeste, de frente pra orla
    { tipo: 'posto',     ponto: pxm(765, 620) },   // na via larga, ao sul
    { tipo: 'escola',    ponto: pxm(568, 706) },   // no meio do residencial
    { tipo: 'galeria',   ponto: pxm(765, 706) },   // o beco de lojas, ao lado da escola
    { tipo: 'praca',     ponto: pxm(568, 878) }    // o centro do bairro do sul
  ];
  const CORES_CARRO_PM = ['#f0f0ee','#1a3f86'];
  /* a mesma paleta dos carros da rua — ela é declarada mais abaixo,
     junto do estacionamento da beira do estádio */
  const CORES_CARRO_EQ = ['#d9d9d9','#2b2b2b','#8a8f96','#b8242a','#2a4f9a','#e6e6e6','#6b7280'];

  /* QUANTO DO QUARTEIRÃO CADA UM TOMA. O resto é casa: quarteirão de
     posto tem casa, o da escola também — é assim na cidade, e um
     equipamento sozinho num quarteirão inteiro lê como maquete. */
  const FATIA = { praca: 0.78, galeria: 0.66, shopping: 0.74, hospital: 0.66,
                  escola: 0.68, delegacia: 0.58, posto: 0.48 };
  function areaDoEquipamento(tipo, q){
    const L = q.ix1 - q.ix0;
    const w = Math.min(L, Math.max(260, L * (FATIA[tipo] || 0.6)));
    /* encostada na face oeste: sobra a leste pras casas */
    return { x0: q.ix0, x1: q.ix0 + w, y0: q.iy0, y1: q.iy1 };
  }
  const cruzaRet = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

  function equipamento(tipo, q, area){
    const X0 = area.x0, X1 = area.x1, Y0 = area.y0, Y1 = area.y1;
    const L = X1 - X0, A = Y1 - Y0, cx = (X0 + X1)/2, cy = (Y0 + Y1)/2;
    const pecas = [];
    /* bloqueia por padrão; passe `false` pra peça de enfeite */
    const p = (k, o, bloqueia) => pecas.push(Object.assign({ k, bloqueia: bloqueia !== false }, o));
    /* `piso` é chão pintado: não bloqueia, não tem altura, e sai igual
       no 3D e na textura do mapa — a mesma lista serve aos dois */
    const piso = (x0, y0, x1, y1, cor) => p('piso', { x0, y0, x1, y1, cor }, false);
    let chao = '#9d9a90';
    const ret = (x, y, w, h) => ({ x0: x - w/2, x1: x + w/2, y0: y - h/2, y1: y + h/2 });
    const fila = (n, a, b, f) => { for(let i=0;i<n;i++) f(a + (b - a)*(n === 1 ? 0.5 : i/(n-1)), i); };

    if(tipo === 'praca'){
      /* O CORETO NO MEIO, a fonte de um lado, o busto do outro, quatro
         canteiros nas quinas e banco e árvore em volta. O chão é todo
         andável fora disso: praça é onde a torcida se junta. */
      chao = '#b5afa0';
      /* quatro gramados com os caminhos em cruz entre eles */
      const gx = L*0.30, gy = A*0.28, vao = 24;
      for(const sx of [-1, 1]) for(const sy of [-1, 1])
        piso(cx + sx*vao + (sx < 0 ? -gx : 0), cy + sy*vao + (sy < 0 ? -gy : 0), 
             cx + sx*vao + (sx < 0 ? 0 : gx), cy + sy*vao + (sy < 0 ? 0 : gy), '#4e7f40');
      const r = Math.max(22, Math.min(34, Math.min(L, A)*0.16));
      p('coreto', Object.assign({ x: cx, y: cy, r, alt: 62 }, ret(cx, cy, r*2, r*2)));
      const dx = Math.min(L*0.31, L/2 - 40);
      p('fonte', Object.assign({ x: cx - dx, y: cy, r: Math.min(30, A*0.16) },
                               ret(cx - dx, cy, Math.min(60, A*0.32), Math.min(60, A*0.32))));
      p('monumento', Object.assign({ alt: 52 }, ret(cx + dx, cy, 26, 26)));
      const cw = Math.min(72, L*0.16), ch = Math.min(46, A*0.22);
      for(const sx of [-1, 1]) for(const sy of [-1, 1])
        p('canteiro', Object.assign({ alt: 15 }, ret(cx + sx*(r + 18 + cw/2), cy + sy*(A*0.30), cw, ch)));
      /* banco de praça não tranca ninguém: é enfeite */
      for(let i=0;i<8;i++){
        const a = i/8*Math.PI*2, d = r + 34;
        p('banco', Object.assign({ ang: a }, ret(cx + Math.cos(a)*d, cy + Math.sin(a)*d, 22, 10)), false);
      }
      fila(5, X0 + 26, X1 - 26, x => { p('arvore', { x, y: Y0 + 20, r: 15 }, false); p('arvore', { x, y: Y1 - 20, r: 15 }, false); });
      for(const sx of [-1, 1]) for(const sy of [-1, 1])
        p('poste', { x: cx + sx*(L*0.36), y: cy + sy*(A*0.30), dx: -sx, dz: 0 }, false);
      p('letreiro', { x: cx, y: Y1 - 14, ox: 0, oz: 1, texto: 'PRAÇA DA MATRIZ', placa: true, larg: 98, altura: 20, base: 44, pernas: true }, false);
    }

    if(tipo === 'hospital'){
      /* Bloco principal ao norte, ala a oeste, marquise do pronto-socorro
         com ambulância embaixo, muro na frente com portão, e a cruz. */
      const fundo = Math.min(A*0.42, 175), ala = Math.min(L*0.30, 130);
      const bw = Math.min(L, 520), bx0 = cx - bw/2, bx1 = cx + bw/2;
      chao = '#a4a49c';
      piso(cx - 46, Y1 - 40, cx + 46, Y1, '#8e8b82');            // a entrada de veículos
      p('bloco', { x0: bx0, x1: bx1, y0: Y0, y1: Y0 + fundo, alt: 232, cor: '#dfdcd2',
                   teto: '#9aa0a2', janelas: 'grade' });
      p('bloco', { x0: bx0, x1: bx0 + ala, y0: Y0 + fundo, y1: Y0 + fundo + Math.min(A*0.26, 150), alt: 124,
                   cor: '#d5d2c7', teto: '#9aa0a2', janelas: 'faixa' });
      /* o pronto-socorro: marquise sobre pilares, rente ao bloco */
      const mx0 = bx0 + ala + 14, mx1 = Math.min(bx1 - 20, mx0 + 150), my0 = Y0 + fundo, my1 = my0 + 54;
      p('marquise', { x0: mx0, x1: mx1, y0: my0, y1: my1, y: 56, alt: 8, cor: '#c9463c' }, false);
      for(const x of [mx0 + 5, mx1 - 5]) for(const y of [my1 - 5])
        p('pilar', { x, y, r: 3.5, alt: 56, cor: '#b8b4a8' });
      p('carro', { x0: mx0 + 24, x1: mx0 + 24 + 38, y0: my0 + 8, y1: my0 + 8 + 42, cor: '#f2f2ee', modo: 'ambulancia' });
      /* estacionamento a leste, e o muro da frente com portão */
      fila(5, Y0 + fundo + 20, Y1 - 80, y => p('carro', { x0: bx1 - 40, x1: bx1 - 4, y0: y, y1: y + 34, cor: escolher(CORES_CARRO_EQ) }));
      const px0 = cx - 46, px1 = cx + 46;                 // o vão do portão
      p('muro', { x0: bx0, x1: px0, y0: Y1 - 8, y1: Y1, alt: 44, cor: '#c6c2b6' });
      p('muro', { x0: px1, x1: bx1, y0: Y1 - 8, y1: Y1, alt: 44, cor: '#c6c2b6' });
      p('arvore', { x: X0 + 22, y: Y1 - 26, r: 16 }, false);
      p('arvore', { x: X1 - 22, y: Y1 - 26, r: 16 }, false);
      p('cruz', { x: cx - 120, y: Y0 + fundo, base: 150, ox: 0, oz: 1, tam: 44 }, false);
      /* acima do telhado da ala oeste, senão ela come metade do letreiro */
      p('letreiro', { x: cx + 40, y: Y0 + fundo, ox: 0, oz: 1, texto: 'HOSPITAL MUNICIPAL', placa: true, larg: 148, altura: 26, base: 152 }, false);
      p('letreiro', { x: mx0 + 59, y: my1, ox: 0, oz: 1, texto: 'PRONTO-SOCORRO', placa: true, larg: 96, altura: 20, base: 62 }, false);
    }

    if(tipo === 'delegacia'){
      /* Prédio de dois andares com pórtico de colunas, mastro com
         bandeira, guarita e as viaturas estacionadas na frente. */
      chao = '#a4a49c';
      const fundo = Math.min(A*0.52, 126), larg = Math.min(L*0.62, 300);
      const bx0 = cx - larg/2, bx1 = cx + larg/2;
      p('bloco', { x0: bx0, x1: bx1, y0: Y0, y1: Y0 + fundo, alt: 124, cor: '#e3e0d4',
                   teto: '#8f9499', janelas: 'grade' });
      /* o pórtico: laje sobre quatro colunas */
      const py1 = Y0 + fundo + 34;
      p('marquise', { x0: cx - 66, x1: cx + 66, y0: Y0 + fundo, y1: py1, y: 74, alt: 9, cor: '#cfcbbe' }, false);
      fila(4, cx - 60, cx + 60, x => p('pilar', { x, y: py1 - 6, r: 4.5, alt: 74, cor: '#eceadf' }));
      p('mastro', { x: bx0 - 26, y: Y0 + fundo + 18, alt: 140 });
      p('guarita', { x0: X1 - 46, x1: X1 - 18, y0: Y1 - 46, y1: Y1 - 18, alt: 58, cor: '#dcd8cc' });
      /* o pátio das viaturas: em quarteirão estreito ele encolhe, e em
         quarteirão fundo ganha uma segunda fileira */
      const vaga = Math.min(74, (L - 40)/4), meia = vaga*1.5;
      const fileiras = Y1 - (Y0 + fundo) > 210 ? [Y1 - 60, Y1 - 150] : [Y1 - 60];
      for(const fy of fileiras){
        fila(4, cx - meia, cx + meia, x => piso(x - 1, fy - 4, x + 1, fy + 46, '#e8e5da'));
        fila(3, cx - vaga, cx + vaga, (x, i) => p('carro', { x0: x - 18, x1: x + 18, y0: fy, y1: fy + 42,
                                                            cor: CORES_CARRO_PM[i % 2], modo: 'policia' }));
      }
      if(bx0 - 46 > X0 + 20) p('muro', { x0: X0, x1: bx0 - 46, y0: Y1 - 8, y1: Y1, alt: 44, cor: '#c6c2b6' });
      p('arvore', { x: X0 + 24, y: Y0 + 26, r: 16 }, false);
      p('arvore', { x: X1 - 24, y: Y0 + 26, r: 16 }, false);
      /* o letreiro da frente vai acima do pórtico, e o do distrito na
         empena oeste — na frente ele ficaria atrás da laje das colunas */
      p('letreiro', { x: cx, y: Y0 + fundo, ox: 0, oz: 1, texto: 'DELEGACIA DE POLÍCIA', placa: true,
                      larg: Math.min(150, larg - 24), altura: 24, base: 88 }, false);
      p('letreiro', { x: bx0, y: Y0 + fundo*0.45, ox: -1, oz: 0, texto: '3º DISTRITO', placa: true,
                      larg: Math.min(76, fundo*0.6), altura: 18, base: 54 }, false);
    }

    if(tipo === 'escola'){
      /* Bloco em L de dois andares, quadra coberta de grade, mastro,
         muro com portão e o pátio no meio. */
      chao = '#a8a196';
      const fundo = Math.min(A*0.30, 150), ala = Math.min(L*0.30, 110);
      p('bloco', { x0: X0, x1: X0 + Math.min(L, 560), y0: Y0, y1: Y0 + fundo, alt: 124, cor: '#e6e0cc',
                   teto: '#9aa0a2', janelas: 'grade' });
      p('bloco', { x0: X0, x1: X0 + ala, y0: Y0 + fundo, y1: Y1 - 120, alt: 118,
                   cor: '#e0dac6', teto: '#9aa0a2', janelas: 'grade' });
      /* a passarela coberta que liga o bloco à quadra */
      p('marquise', { x0: X0 + ala, x1: X0 + ala + 20, y0: Y0 + fundo, y1: Y1 - 130, y: 62, alt: 6, cor: '#cfcbbe' }, false);
      fila(4, Y0 + fundo + 16, Y1 - 150, y => p('pilar', { x: X0 + ala + 16, y, r: 3, alt: 62, cor: '#d8d3c4' }));
      /* A QUADRA POLIESPORTIVA: piso pintado, alambrado e duas tabelas */
      const qx0 = X0 + ala + 34, qx1 = Math.min(X1 - 18, qx0 + 380), qy1 = Y1 - 22, qy0 = qy1 - Math.min(A*0.34, 220);
      piso(qx0, qy0, qx1, qy1, '#8a5a46');
      piso(qx0 + 8, qy0 + 8, qx1 - 8, qy0 + 11, '#e8e5da');
      piso(qx0 + 8, qy1 - 11, qx1 - 8, qy1 - 8, '#e8e5da');
      piso(qx0 + 8, (qy0+qy1)/2 - 1.5, qx1 - 8, (qy0+qy1)/2 + 1.5, '#e8e5da');
      for(const [ax, ay] of [[qx0, qy0], [qx1, qy0], [qx0, qy1], [qx1, qy1]])
        p('pilar', { x: ax, y: ay, r: 2.4, alt: 86, cor: '#6e6a5e' });
      for(const sy of [qy0 + 14, qy1 - 14])
        p('tabela', { x: (qx0+qx1)/2, y: sy, alt: 70 });
      p('mastro', { x: X0 + ala + 40, y: Y0 + fundo + 26, alt: 132 });
      p('muro', { x0: X0, x1: cx - 44, y0: Y1 - 8, y1: Y1, alt: 44, cor: '#ccc6b4' });
      p('muro', { x0: cx + 44, x1: X1, y0: Y1 - 8, y1: Y1, alt: 44, cor: '#ccc6b4' });
      p('arvore', { x: X1 - 26, y: Y0 + fundo + 40, r: 18 }, false);
      p('arvore', { x: X0 + 26, y: Y1 - 40, r: 18 }, false);
      p('letreiro', { x: cx, y: Y0 + fundo, ox: 0, oz: 1, texto: 'ESCOLA MUNICIPAL', placa: true,
                      larg: Math.min(160, L - 30), altura: 26, base: 86 }, false);
    }

    if(tipo === 'posto'){
      /* Cobertura sobre duas ilhas de bomba, loja de conveniência,
         totem de preço na guia e o pátio de cimento. As medidas são
         ABSOLUTAS e centradas: o quarteirão cresceu, o posto não. */
      chao = '#8e8b82';
      const kw = Math.min(L - 60, 230), kh = Math.min(A*0.42, 170);
      const kx0 = cx - kw/2, kx1 = cx + kw/2, ky1 = Y1 - Math.min(A*0.18, 70), ky0 = ky1 - kh;
      const lw = Math.min(L - 80, 170), lh = Math.min(A*0.26, 100);
      p('bloco', { x0: cx - lw/2, x1: cx + lw/2, y0: ky0 - 26 - lh, y1: ky0 - 26, alt: 74,
                   cor: '#eae6d8', teto: '#c9463c', janelas: 'vidro' });
      p('marquise', { x0: kx0, x1: kx1, y0: ky0, y1: ky1, y: 108, alt: 10, cor: '#e8e4d6' }, false);
      p('marquise', { x0: kx0, x1: kx1, y0: ky0, y1: ky0 + 5, y: 96, alt: 12, cor: '#c9463c' }, false);
      for(const ax of [kx0 + 14, kx1 - 14]) for(const ay of [ky0 + 14, ky1 - 14])
        p('pilar', { x: ax, y: ay, r: 5, alt: 108, cor: '#e8e4d6' });
      for(const ay of [(ky0*2 + ky1)/3, (ky0 + ky1*2)/3]){
        p('piso', { x0: kx0 + 26, x1: kx1 - 26, y0: ay - 13, y1: ay + 13, cor: '#b9b3a4' }, false);
        for(const ax of [(kx0*2 + kx1)/3, (kx0 + kx1*2)/3])
          p('bomba', Object.assign({ alt: 52 }, ret(ax, ay, 16, 22)));
      }
      p('totem', { x0: X1 - 46, x1: X1 - 20, y0: Y1 - 52, y1: Y1 - 26, alt: 150, cor: '#1f6a3a' });
      p('carro', { x0: kx0 + 34, x1: kx0 + 70, y0: ky0 + 34, y1: ky0 + 68, cor: escolher(CORES_CARRO_EQ) });
      fila(3, X0 + 30, cx - lw/2 - 30, x => p('arvore', { x, y: Y0 + 34, r: 18 }, false));
      p('letreiro', { x: cx, y: ky0 - 26, ox: 0, oz: 1, texto: 'POSTO BEIRA-ESTRADA', placa: true,
                      larg: Math.min(130, lw - 16), altura: 22, base: 48 }, false);
    }

    if(tipo === 'galeria'){
      /* O BECO: duas fileiras de lojinhas de frente uma pra outra, com
         um corredor no meio que atravessa o quarteirão de ponta a
         ponta. O corredor não bloqueia — é passagem, e é gargalo. */
      chao = '#b0aa9c';
      const vao = Math.min(A*0.26, 62), fundo = (A - vao)/2 - 2;
      const a0 = cy - vao/2, a1 = cy + vao/2;
      piso(X0, a0, X1, a1, '#c0b9a8');
      const n = Math.max(4, Math.round(L/46));
      const larg = L/n;
      for(let i=0;i<n;i++){
        const ux0 = X0 + i*larg + 1.5, ux1 = X0 + (i+1)*larg - 1.5;
        for(const lado of [-1, 1]){
          const fy0 = lado < 0 ? Y0 : a1 + 2, fy1 = lado < 0 ? a0 - 2 : Y1;
          const alt = par8(entre(76, 104));
          p('bloco', { x0: ux0, x1: ux1, y0: fy0, y1: fy1, alt, cor: escolher(TIPOS.casa.cor), teto: '#8f8a80' });
          /* a frente da lojinha, virada pro corredor */
          const face = lado < 0 ? fy1 : fy0, dir = lado < 0 ? 1 : -1;
          p('marquise', { x0: ux0 + 4, x1: ux1 - 4, y0: face - 0.8*dir, y1: face + 0.4*dir,
                          y: 12, alt: 34, cor: '#2f3a44' }, false);
          p('marquise', { x0: (ux0+ux1)/2 - 9, x1: (ux0+ux1)/2 + 9, y0: face - 0.9*dir, y1: face + 0.4*dir,
                          y: 0, alt: 46, cor: '#4a3a2c' }, false);
          p('marquise', { x0: ux0, x1: ux1, y0: Math.min(face, face + 15*dir), y1: Math.max(face, face + 15*dir),
                          y: 54, alt: 5, cor: i%2 ? '#c05a3a' : '#2f6a4a' }, false);
          if(i % 2 === 0)
            p('letreiro', { x: (ux0+ux1)/2, y: face, ox: 0, oz: dir, texto: escolher(COMERCIO), placa: true,
                            larg: larg - 12, altura: 15, base: 62 }, false);
        }
      }
      for(const sx of [X0 + 6, X1 - 6])
        p('letreiro', { x: sx, y: cy, ox: sx < cx ? -1 : 1, oz: 0, texto: 'GALERIA CENTRAL', placa: true,
                        larg: vao - 10, altura: 18, base: 110 }, false);
      fila(3, X0 + larg, X1 - larg, x => p('poste', { x, y: cy, dx: 0, dz: 1 }, false));
    }

    if(tipo === 'shopping'){
      /* Caixa grande com volume de entrada mais alto, marquise de vidro,
         estacionamento com fileiras de carro e o totem na esquina. */
      chao = '#4a4a46';
      const larg = Math.min(L*0.60, 320), fundo = Math.min(A*0.72, 190);
      piso(X0, Y0, X0 + Math.min(L*0.60, 320) + 22, Y1, '#a4a49c');    // o passeio do shopping
      const bx0 = X0, bx1 = X0 + larg;
      p('bloco', { x0: bx0, x1: bx1, y0: Y0, y1: Y0 + fundo, alt: 150, cor: '#d8d4c8', teto: '#8e9398' });
      p('bloco', { x0: cx - larg*0.18, x1: cx - larg*0.18 + larg*0.30, y0: Y0 + fundo - 30, y1: Y0 + fundo + 26,
                   alt: 196, cor: '#cfd5d8', janelas: 'vidro' });
      p('marquise', { x0: bx0 + larg*0.14, x1: bx1 - larg*0.10, y0: Y0 + fundo, y1: Y0 + fundo + 30, y: 66, alt: 7, cor: '#9fb0b8' }, false);
      /* clarabóias e máquinas no teto */
      fila(4, bx0 + 40, bx1 - 40, x => p('claraboia', { x0: x - 26, x1: x + 26, y0: Y0 + 30, y1: Y0 + fundo - 40, y: 150, alt: 7, cor: '#b8cdd6' }, false));
      fila(3, bx0 + 60, bx1 - 60, x => p('maquina', { x0: x - 16, x1: x + 16, y0: Y0 + 14, y1: Y0 + 40, y: 150, alt: 20, cor: '#9a9a94' }, false));
      /* o estacionamento: três fileiras */
      const ex0 = bx1 + 26;
      fila(3, ex0, X1 - 42, x => fila(5, Y0 + 16, Y1 - 52, y =>
        { if(rng() < 0.22) return; p('carro', { x0: x, x1: x + 36, y0: y, y1: y + 34, cor: escolher(CORES_CARRO_EQ) }); }));
      fila(3, ex0, X1 - 42, x => fila(6, Y0 + 12, Y1 - 44, y => piso(x - 2, y - 1, x + 38, y + 1, '#e8e5da')));
      fila(4, Y0 + 40, Y1 - 40, y => p('poste', { x: ex0 - 12, y, dx: 1, dz: 0 }, false));
      p('totem', { x0: X1 - 30, x1: X1 - 10, y0: Y1 - 34, y1: Y1 - 14, alt: 190, cor: '#3a4a66' });
      p('letreiro', { x: cx - larg*0.03, y: Y0 + fundo + 26, ox: 0, oz: 1, texto: 'SHOPPING BEIRA-MAR', placa: true, larg: 150, altura: 30, base: 112 }, false);
      p('arvore', { x: X1 - 22, y: Y0 + 22, r: 16 }, false);
    }
    return { tipo, chao, pecas, area };
  }

  /* =========================================================
     A SEDE DA TORCIDA
     ---------------------------------------------------------
     Não é mais uma casa pintada de vermelho: é um pedaço de
     quarteirão com PLANTA, como a foto que o dono mandou — muro na
     rua com o portão e o nome, ala da frente, SALÃO no meio e a ala
     do fundo. Sem telhado sobre os cômodos, de propósito: de cima se
     lê a planta (que é o que a foto mostra) e de dentro as paredes
     leem como cômodos. A frente é a COR PRIMÁRIA da torcida, a faixa
     e o piso do salão são a SECUNDÁRIA, e o portão, o rodapé e a
     quadra pintada são a TERCEIRA quando ela existe.

     Tudo é declarado em EIXO LOCAL — `u` ao longo da frente, `v` pra
     dentro, `v = 0` na calçada — e `eixos()` gira pro mundo: a mesma
     planta serve pras quatro frentes.
     ========================================================= */
  function eixos(a, frente){
    const X0 = a.x0, X1 = a.x1, Y0 = a.y0, Y1 = a.y1;
    if(frente === 'n') return { L:X1-X0, A:Y1-Y0, ox:0, oz:-1,
      ret:(u0,u1,v0,v1)=>({ x0:X0+u0, x1:X0+u1, y0:Y0+v0, y1:Y0+v1 }),
      pt:(u,v)=>[X0+u, Y0+v] };
    if(frente === 's') return { L:X1-X0, A:Y1-Y0, ox:0, oz:1,
      ret:(u0,u1,v0,v1)=>({ x0:X0+u0, x1:X0+u1, y0:Y1-v1, y1:Y1-v0 }),
      pt:(u,v)=>[X0+u, Y1-v] };
    if(frente === 'o') return { L:Y1-Y0, A:X1-X0, ox:-1, oz:0,
      ret:(u0,u1,v0,v1)=>({ x0:X0+v0, x1:X0+v1, y0:Y0+u0, y1:Y0+u1 }),
      pt:(u,v)=>[X0+v, Y0+u] };
    return { L:Y1-Y0, A:X1-X0, ox:1, oz:0,
      ret:(u0,u1,v0,v1)=>({ x0:X1-v1, x1:X1-v0, y0:Y0+u0, y1:Y0+u1 }),
      pt:(u,v)=>[X1-v, Y0+u] };
  }
  /* a fatia que a sede toma do quarteirão, na frente pedida. Ela pega
     o quarteirão de ponta a ponta na profundidade e uma faixa larga no
     comprimento — o resto do quarteirão continua sendo casa. */
  function areaDaSede(q, frente){
    const Lx = q.ix1 - q.ix0, Ly = q.iy1 - q.iy0;
    if(frente === 'n' || frente === 's'){
      const w = Math.min(Lx, Math.max(420, Lx*0.72));
      if(w < 340 || Ly < 190) return null;
      return { x0: q.ix0, x1: q.ix0 + w, y0: q.iy0, y1: q.iy1 };
    }
    const w = Math.min(Lx, Math.max(300, Lx*0.5));
    if(w < 280 || Ly < 340) return null;
    return frente === 'o' ? { x0: q.ix0, x1: q.ix0 + w, y0: q.iy0, y1: q.iy1 }
                          : { x0: q.ix1 - w, x1: q.ix1, y0: q.iy0, y1: q.iy1 };
  }
  /* preto ou branco por cima de uma cor: o que dá pra ler */
  function corLegivel(hex){
    const n = parseInt(String(hex || '#888888').slice(1), 16);
    const l = (n>>16&255)*0.299 + (n>>8&255)*0.587 + (n&255)*0.114;
    return l > 150 ? '#1a1a1a' : '#f6f3ea';
  }
  /* A COR QUE SE LÊ SOBRE A COR DA TORCIDA — a MESMA de `mapa.js`, que
     é quem desenha o escudo da torcida no mapa do jogo. A sigla é a
     primeira cor DELA que se separa do fundo por luminância; se
     nenhuma servir, cai no preto ou branco. Inventar uma cor que não é
     dela seria pior. */
  function corQueLeSobre(fundo, cores){
    const luz = h => { const n = parseInt(String(h || '#888888').slice(1), 16);
                       return (0.2126*(n>>16&255) + 0.7152*(n>>8&255) + 0.0722*(n&255)) / 255; };
    const lf = luz(fundo);
    for(const c of cores) if(c && Math.abs(luz(c) - lf) >= 0.22) return c;
    return lf > 0.55 ? '#151515' : '#f2f2f2';
  }
  /* O ESCUDO DE VERDADE, o mesmo arquivo que o jogo usa.
     `dados/escudos.js` é o manifesto do que existe em `img/escudos/`
     (`clube-<id>.png` e `torcida-<id>.png`, 139 de cada); sem o id lá
     dentro não há arquivo, e a cena fica com o escudo gerado. E no
     jogo de arquivo único as imagens moram num dicionário que o
     empacotador embute — `window.__EMBUTIDOS` —, então o caminho passa
     por ele antes, que é o mesmo `IMG()` do `main.js`. */
  function caminhoDoEscudo(tipo, id){
    const m = ((typeof TO !== 'undefined' && TO.dados && TO.dados.escudos) || {})
              [tipo === 'c' ? 'clubes' : 'torcidas'];
    if(!m || !id || !m[id]) return null;
    const caminho = 'img/escudos/' + (tipo === 'c' ? 'clube' : 'torcida') + '-' + id + '.png';
    return (typeof window !== 'undefined' && window.__EMBUTIDOS && window.__EMBUTIDOS[caminho])
           || caminho;
  }
  function sedeDaTorcida(lado, q, area, frente){
    const T = SEDES[lado].torcida;
    const E = eixos(area, frente), L = E.L, A = E.A;
    const cor1 = T.cor || '#b02a22';
    const cor2 = T.cor2 || '#e8e2d0';
    const cor3 = T.cor3 || cor2;
    const CLARO = '#d9d3c4';                 // o reboco dos cômodos, por dentro
    const pecas = [];
    const p = (k, o, bloqueia) => pecas.push(Object.assign({ k, bloqueia: bloqueia !== false }, o));
    const par  = (u0,u1,v0,v1, alt, cor) => p('muro', Object.assign(E.ret(u0,u1,v0,v1), { alt, cor }));
    const piso = (u0,u1,v0,v1, cor, base) => p('piso', Object.assign(E.ret(u0,u1,v0,v1), { cor, base: base || 1.72 }), false);
    const faixa = (u0,u1,v0,v1, y, alt, cor) => p('marquise', Object.assign(E.ret(u0,u1,v0,v1), { y, alt, cor }), false);

    const PAR = 9;        // parede interna: 40 cm
    /* A SEDE TEM ALTURA DE CASA, não de galpão de fábrica: a fachada
       bate com o sobrado do lado e o telhado fica por baixo da linha
       do bairro. Era 86/74/66 e lia como um armazém no meio da rua. */
    const MURO = 72;      // a fachada da rua, que é platibanda: 3,2 m
    const ALT_EXT = 62;   // as paredes de fora, que seguram o telhado
    const ALT = 54;       // parede de cômodo: 2,4 m — abaixo do telhado
    const VAO = 40;       // porta: 1,8 m, e o corpo passa (a máscara pede 24)
    const PORTAO = 56;    // o portão da rua: 2,5 m, cabe bonde em fila
    /* parede com vãos: `em` é um vão ou uma lista deles, e o que sobra
       entre eles sai como pedaço de parede. Um cômodo cujo vão caia em
       cima da divisória fica MURADO — foi o que deixou 332 células sem
       chegada na primeira montagem. */
    const comVaos = (ini, fim, em, larg) => {
      const w = larg || VAO;
      const vaos = (em === undefined ? [] : [].concat(em)).map(c => [c - w/2, c + w/2])
        .sort((p, q) => p[0] - q[0]);
      const pedacos = [];
      let a = ini;
      for(const [v0, v1] of vaos){ if(v0 - a > 3) pedacos.push([a, v0]); a = Math.max(a, v1); }
      if(fim - a > 3) pedacos.push([a, fim]);
      return pedacos;
    };
    const paredeU = (u0,u1,v0,v1, alt, cor, em, larg) => {
      for(const [a, b] of comVaos(u0, u1, em, larg)) par(a, b, v0, v1, alt, cor);
    };
    const paredeV = (u0,u1,v0,v1, alt, cor, em, larg) => {
      for(const [a, b] of comVaos(v0, v1, em, larg)) par(u0, u1, a, b, alt, cor);
    };

    const MF = 13;                                   // espessura da fachada
    const DF = Math.min(96, Math.max(58, A*0.30));   // ala da frente
    const DB = Math.min(104, Math.max(60, A*0.32));  // ala do fundo
    const eixo = L/2;                                // o portão no meio
    const g0 = eixo - PORTAO/2, g1 = eixo + PORTAO/2;
    const vF = MF + DF, vB = A - DB;                 // fim da ala da frente, início da do fundo

    /* ---- o chão: cimento no pátio, e o salão pintado ---- */
    piso(0, L, 0, A, '#a8a396', 1.70);
    piso(PAR, L - PAR, vF, vB, '#b7b2a4', 1.74);
    /* a faixa da torcida no piso do salão: duas listras finas, que
       larga demais o piso vira bandeira e come o pátio */
    const mS = (vF + vB)/2;
    piso(PAR + 26, L - PAR - 26, mS - 15, mS - 5, cor2, 1.78);
    piso(PAR + 26, L - PAR - 26, mS + 5, mS + 15, cor3, 1.78);

    /* ---- A FACHADA: a cor primária dá pra rua ----
       Nada sai do miolo do quarteirão: a parede recua 2,5 e o rodapé,
       a faixa e os batentes ocupam esse recuo em vez de avançar pra
       calçada, que é a regra que vale pra casa e vale pra sede. */
    const F0 = 2.5;
    paredeU(0, L, F0, MF, MURO, cor1, eixo, PORTAO);
    for(const [a, b] of [[0, g0], [g1, L]]){
      if(b - a < 8) continue;
      faixa(a, b, 0, MF + 1, 4, 10, cor3);            // rodapé
      faixa(a, b, 0, MF + 1, MURO - 18, 11, cor2);    // a faixa alta da torcida
    }
    /* a verga sobre o portão */
    faixa(g0 - 3, g1 + 3, F0, MF + 1, 58, MURO - 58, cor1);
    faixa(g0 - 3, g1 + 3, 0, MF + 1.4, 53, 5, cor3);

    /* ---- O QUE FICA NA FACHADA, e de que lado ----
       "Direita" é a de QUEM OLHA DA RUA, não a do eixo local. O
       observador fica na frente da parede olhando pra ela, então o
       lado direito dele é `+u` numa frente e `−u` na outra: ao sul e a
       oeste a placa vai no trecho de u alto, ao norte e a leste no de
       u baixo. Com o eixo cru ela saía sempre do lado errado em duas
       das quatro frentes. */
    const direitaEhUAlto = (frente === 's' || frente === 'o');
    const trechoDir = direitaEhUAlto ? [g1, L] : [0, g0];
    const trechoEsq = direitaEhUAlto ? [0, g0] : [g1, L];
    const meio = t => (t[0] + t[1]) / 2, vaoDe = t => t[1] - t[0];

    /* A PLACA COM O NOME POR EXTENSO, no fundo da cor secundária. A
       sigla continua na barra de estado; na fachada quem manda é o
       nome da torcida. A proporção segue a do atlas (256 × 64), senão
       o texto sai esticado. */
    const larguraPlaca = Math.min(vaoDe(trechoDir) - 22, 116);
    if(larguraPlaca > 40){
      const [lx, ly] = E.pt(meio(trechoDir), 1);
      p('letreiro', { x: lx, y: ly, ox: E.ox, oz: E.oz, texto: T.nomeCompleto || T.rot,
                      larg: larguraPlaca, altura: larguraPlaca/4.2, base: 19,
                      fundo: cor2, tinta: corLegivel(cor2) }, false);
    }
    /* OS ESCUDOS, do outro lado do portão: o da torcida e o do clube.
       O ponto de fixação é v = 2,8 e não v = 1: o escudo SAI da parede
       pra fora, e o `limite` do quarteirão (que corta beiral, janela e
       placa na guia da calçada) cortava as três chapas a zero — eles
       simplesmente não apareciam. Preso em 2,8, a camada mais de fora
       para em 0,2, que ainda é miolo de quarteirão. */
    const VESC = 2.8;
    /* OS ESCUDOS SÃO OS DO JOGO, não um desenho inventado aqui.
       O da TORCIDA é o pino do mapa (`mapa.js`): bola na cor principal
       dela com a `siglaTorcida` no meio, na cor que lê sobre aquele
       fundo. O do CLUBE é o `.escudo` da interface (`main.js`): as duas
       cores do clube divididas em 135°, com a sigla dele por cima. E
       quando o PNG do escudo estiver em `img/escudos/…`, é ele que
       aparece — o gerado só vale enquanto o arquivo não existe. */
    const escudoDaTorcida = (x, y, ox, oz, k) =>
      p('escudo', { x, y, ox, oz, larg: 36*k, alt: 36*k, base: 16,
                    forma: 'bola', texto: T.rot, cor: cor1, cor2,
                    corTexto: corQueLeSobre(cor1, [cor2, cor3]),
                    img: caminhoDoEscudo('t', T.id) }, false);
    const vaoEsq = vaoDe(trechoEsq);
    if(vaoEsq > 90){
      const c0 = meio(trechoEsq) - vaoEsq*0.19, c1 = meio(trechoEsq) + vaoEsq*0.19;
      const [ax, ay] = E.pt(direitaEhUAlto ? c0 : c1, VESC);
      const [bx, by] = E.pt(direitaEhUAlto ? c1 : c0, VESC);
      escudoDaTorcida(ax, ay, E.ox, E.oz, 1);
      p('escudo', { x: bx, y: by, ox: E.ox, oz: E.oz, larg: 30, alt: 30, base: 19,
                    forma: 'diagonal', texto: T.clubeSigla || T.rot,
                    cor: T.clubeCor || cor1, cor2: T.clubeCor2 || cor2,
                    corTexto: '#ffffff',
                    img: caminhoDoEscudo('c', T.clubeId) }, false);
    }
    /* e um em cada PAREDE LATERAL, que também é parede externa: a
       direção de `+u` no mundo sai de dois pontos do próprio eixo, e
       as laterais olham pra `−u` e pra `+u`. */
    const [p0x, p0y] = E.pt(0, 0), [p1x, p1y] = E.pt(1, 0);
    const ux = p1x - p0x, uy = p1y - p0y, vm = (vF + vB)/2;
    for(const [uu, sx, sy] of [[VESC, -ux, -uy], [L - VESC, ux, uy]]){
      const [sxx, syy] = E.pt(uu, vm);
      escudoDaTorcida(sxx, syy, sx, sy, 0.8);
    }
    /* os batentes do portão, na terceira cor */
    for(const u of [g0, g1]) par(u - 4, u + 4, 0, MF + 1, MURO, cor3);

    /* ---- ALA DA FRENTE: secretaria, bar, banheiro ----
       O corredor do portão atravessa ela e desemboca no salão. */
    par(0, PAR, 0, A, ALT_EXT, cor1);           // parede lateral oeste
    par(L - PAR, L, 0, A, ALT_EXT, cor1);       // parede lateral leste
    par(g0 - PAR, g0, MF, vF, ALT, CLARO);      // as paredes do corredor
    par(g1, g1 + PAR, MF, vF, ALT, CLARO);
    for(const [a, b] of [[PAR, g0 - PAR], [g1 + PAR, L - PAR]]){
      if(b - a < 70) continue;
      const parte = b - a > 150;                       // dá dois cômodos
      /* a porta de cada cômodo pro salão — nunca em cima da divisória */
      paredeU(a, b, vF - PAR, vF, ALT, CLARO,
              parte ? [a + (b-a)*0.25, a + (b-a)*0.75] : (a + b)/2);
      if(parte) par((a + b)/2 - PAR/2, (a + b)/2 + PAR/2, MF, vF - PAR, ALT, CLARO);
    }

    /* ---- ALA DO FUNDO: alojamento, diretoria e o depósito ---- */
    par(PAR, L - PAR, A - PAR, A, ALT_EXT, cor1);   // a parede dos fundos
    const n = L > 400 ? 3 : 2, passo = (L - 2*PAR)/n;
    for(let i = 0; i < n; i++){
      const a = PAR + i*passo, b = a + passo;
      paredeU(a, b, vB, vB + PAR, ALT, CLARO, (a + b)/2);        // a porta pro salão
      if(i) par(a - PAR/2, a + PAR/2, vB, A - PAR, ALT, CLARO);  // a divisória
    }

    /* ---- o que vive no salão ----
       Poste e árvore saíram: a sede é COBERTA, e luminária de rua e pé
       de árvore dentro de galpão não existem. Ficam os bancos e o
       mastro, que sobe pela frente e passa do telhado, como o de
       sede de verdade. */
    const [mx, my] = E.pt(L - 54, MF + 26);
    p('mastro', { x: mx, y: my, alt: 128, cor: cor1, cor2 }, false);
    for(const u of [PAR + 46, L - PAR - 46]){
      const r = E.ret(u - 26, u + 26, vF + 16, vF + 26);
      p('banco', r, false);
    }
    /* O TELHADO fica FORA da lista de peças: ele sai numa malha só
       dele, que a cena esconde quando o jogador entra — é o corte que
       deixa a planta à vista de dentro e o galpão fechado de fora. */
    return { tipo: 'sede', lado, torcida: T, frente, chao: '#a8a396', pecas, area,
             teto: { base: ALT_EXT, queda: 15, cor: '#7c8285' } };
  }

  /* AS SEDES ESCOLHEM PRIMEIRO. Elas são o que a cena precisa pra
     existir — sem sede não há spawn —, então elas pegam o quarteirão
     que quiserem e os outros equipamentos ficam com o que sobrar.
     Procura, em volta do ponto do mapa, o quarteirão e a frente que
     dêem a maior fatia com a frente dando pra RUA: num quarteirão
     recortado pela costa uma das faces dá pro próprio miolo, e a
     torcida nasceria dentro do quarteirão. */
  for(const [lado, sd] of Object.entries(SEDES)){
    let melhor = null;
    for(const q of QUADRAS){
      if(q.equip) continue;
      const d = Math.hypot(q.cx - sd.ponto[0], q.cy - sd.ponto[1]);
      if(d > 1500) continue;
      for(const frente of [sd.frente, 'n', 's', 'o', 'l']){
        const area = areaDaSede(q, frente);
        if(!area) continue;
        /* a frente dá pra rua? o ponto logo à frente dela não pode
           cair no miolo do próprio quarteirão */
        const fx = frente === 'o' ? area.x0 - 40 : frente === 'l' ? area.x1 + 40 : (area.x0+area.x1)/2;
        const fy = frente === 'n' ? area.y0 - 40 : frente === 's' ? area.y1 + 40 : (area.y0+area.y1)/2;
        if(dentroPol(fx, fy, q.polMiolo)) continue;
        if(tocaAvenida(area, 4)) continue;          // sede em cima do asfalto, não
        const eq = sedeDaTorcida(lado, q, area, frente);
        /* a nota: perto do ponto pedido, e grande */
        const nota = d - (area.x1 - area.x0) * (area.y1 - area.y0) / 900;
        if(!melhor || nota < melhor.nota) melhor = { q, eq, nota, frente, area };
        break;                                     // uma frente por quarteirão basta
      }
    }
    if(!melhor) continue;
    melhor.q.equip = melhor.eq;
    melhor.q.solidos = melhor.eq.pecas.filter(o => o.bloqueia);
    /* o que o spawn precisa saber: o retângulo e a frente. `frenteDa`
       lê isso e caminha pra fora até achar chão onde o corpo cabe. */
    sedeDe[lado] = { x0: melhor.area.x0, x1: melhor.area.x1, y0: melhor.area.y0, y1: melhor.area.y1,
                     frente: melhor.frente, quadra: melhor.q, torcida: melhor.eq.torcida };
  }

  /* os equipamentos antes dos lotes: o quarteirão deles não é loteado */
  for(const e of EQUIPAMENTOS){
    const q = celulaEm(e.ponto[0], e.ponto[1]);
    if(!q || q.tipo !== 'quadra' || q.equip) continue;
    const eq = equipamento(e.tipo, q, areaDoEquipamento(e.tipo, q));
    /* as peças são retas e a avenida é diagonal: se alguma cair no
       asfalto, o equipamento não serve pra esse quarteirão */
    /* peça NENHUMA, nem as de enfeite: o piso pintado do estacionamento
       também não pode cair no asfalto */
    const pisaNaAvenida = eq.pecas.some(o => o.x0 !== undefined && tocaAvenida(o, 0));
    if(pisaNaAvenida) continue;
    q.equip = eq;
    q.solidos = eq.pecas.filter(o => o.bloqueia);
  }

  /* AS CASAS DA AVENIDA: caminha ao longo de cada trecho, um lote de
     cada lado, com a frente encostada na calçada da avenida. Aceita se
     os quatro cantos do BEIRAL caem no miolo de um mesmo quarteirão e
     não pisam em outra casa — telhado por cima da calçada é o que se
     quer evitar. A avenida é diagonal e o quarteirão é reto, então a
     sobra entre a calçada e o miolo é uma cunha: perto da ponta dela
     não cabe casa, e o que fecha a frente ali é MURO, que é raso e não
     tem beiral. Vêm ANTES dos lotes axiais, que desviam delas. */
  const LARGURAS = [0, 120, 96, 76, 56, 40, 28];  // a 1ª é sorteada em cada passo
  const FUNDOS = [PROF_AV, 100, 80, 62, 46];
  const FUNDO_MURO = 14;                         // muro de lote: fino, não um caixote
  for(const av of AVENIDAS){
    for(const sg of av.segs){
      for(const lado of [-1, 1]){
        let t = 6;
        while(t < sg.L - 24){
          LARGURAS[0] = par8(entre(84, 148));
          const tentar = (w, h, muro) => {
            const off = av.l/2 + CALC + h/2 + 2;
            const cx = sg.x0 + sg.ux*(t + w/2) - sg.uy*off*lado;
            const cy = sg.y0 + sg.uy*(t + w/2) + sg.ux*off*lado;
            const q = celulaEm(cx, cy);
            if(!q || q.tipo !== 'quadra') return false;
            if(q.equip && cruzaRet({ x0: cx - w/2, x1: cx + w/2, y0: cy - h/2, y1: cy + h/2 }, q.equip.area)) return false;
            const tipo = muro ? 'muro' : tipoDoLote(q);
            const T = TIPOS[tipo];
            /* `vf` é pra que lado, no eixo local do lote, fica a frente:
               a casa foi posta a `off` no sentido +v vezes `lado`, então
               a avenida está no sentido contrário */
            const lote = { quadra:q, frente:'av', tipo, cx, cy, w, h, ang: sg.ang, vf: -lado,
                           alt: par8(entre(T.alt[0], T.alt[1])) || T.alt[0], cor: escolher(T.cor) };
            const cantos = cantosDoLote(lote);
            /* o muro não tem beiral; a casa tem, e ele também precisa caber */
            const beiral = muro ? cantos : cantosDoLote({ ...lote, w: w + 2, h: h + 2 });
            if(!beiral.every(([x, y]) => dentroPol(x, y, q.polMiolo))) return false;
            if(cantos.some(([x, y]) => q.lotes.some(o => dentroLote(x, y, o)))) return false;
            if(cantos.some(([x, y]) => noCampo(x, y))) return false;
            LOTES.push(lote); q.lotes.push(lote);
            return true;
          };
          let posto = 0;
          /* casa primeiro, em qualquer largura; só depois o muro de fecho */
          for(const w of LARGURAS){
            if(t + w > sg.L - 4) continue;
            if(FUNDOS.some(h => tentar(w, h, false))){ posto = w; break; }
          }
          if(!posto) for(const w of LARGURAS){
            if(t + w > sg.L - 4) continue;
            if(tentar(w, FUNDO_MURO, true)){ posto = w; break; }
          }
          t += posto ? posto + 2 : 8;
        }
      }
    }
  }

  QUADRAS.forEach(lotear);

  /* quem a avenida corta: amostra a borda e o centro do quarteirão */
  for(const q of QUADRAS){
    const pts = [];
    for(let k=0;k<=8;k++){ const t = k/8; pts.push([q.x0 + (q.x1-q.x0)*t, q.y0], [q.x0 + (q.x1-q.x0)*t, q.y1], [q.x0, q.y0 + (q.y1-q.y0)*t], [q.x1, q.y0 + (q.y1-q.y0)*t]); }
    pts.push([q.cx, q.cy]);
    q.cortada = pts.some(([x, y]) => naFaixaDaAvenida(x, y, CALC));
  }

  /* ---- AS PRACINHAS DAS CUNHAS ----
     Onde a avenida corta o quarteirão na diagonal sobra um triângulo
     pequeno demais pra casa: ele ficava como terreno vago. Vira
     pracinha, que é o que a cidade de verdade faz com essa sobra.
     A sobra não é um polígono fechado que dê pra deduzir — é o que
     resta do miolo depois de tirar lote, quintal e o corredor da
     avenida. Então acha-se por varredura de 8 em 8, junta-se o que
     está grudado, e cada mancha grande o bastante vira pracinha.
     Nada aqui bloqueia: o pedaço continua andável, e é bom que
     continue — é atalho, e é lugar de briga. */
  const GRAO = 8;
  for(const q of QUADRAS){
    if(q.equip || !q.cortada) continue;
    const livre = (x, y) => dentroPol(x, y, q.polMiolo) && !naAvenida(x, y, CALC) &&
                            !(q.quintal && dentroRet(x, y, q.quintal)) &&
                            !q.lotes.some(l => dentroLote(x, y, l));
    const nx = Math.floor((q.ix1 - q.ix0)/GRAO), ny = Math.floor((q.iy1 - q.iy0)/GRAO);
    if(nx < 3 || ny < 3) continue;
    const em = (i, j) => [q.ix0 + (i + 0.5)*GRAO, q.iy0 + (j + 0.5)*GRAO];
    const g = [];
    for(let i=0;i<nx;i++){ g[i] = []; for(let j=0;j<ny;j++) g[i][j] = livre(...em(i, j)) ? 0 : -1; }
    const achadas = [];
    for(let i0=0;i0<nx;i0++) for(let j0=0;j0<ny;j0++){
      if(g[i0][j0] !== 0) continue;
      const pilha = [[i0, j0]], cels = []; g[i0][j0] = 1;
      while(pilha.length){
        const [a, b] = pilha.pop(); cels.push([a, b]);
        for(const [da, db] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const u = a + da, v = b + db;
          if(u >= 0 && v >= 0 && u < nx && v < ny && g[u][v] === 0){ g[u][v] = 1; pilha.push([u, v]); }
        }
      }
      const area = cels.length*GRAO*GRAO;
      if(area < 3600 || area > 52000) continue;
      const dentro = new Set(cels.map(([a, b]) => a + ',' + b));
      /* o centro mais folgado: o maior quadrado que cabe na mancha */
      let melhor = null;
      for(const [a, b] of cels){
        let r = 0;
        while(r < 8){
          let cabe = true;
          for(let u = a - r - 1; u <= a + r + 1 && cabe; u++)
            for(let v = b - r - 1; v <= b + r + 1 && cabe; v++)
              if(!dentro.has(u + ',' + v)) cabe = false;
          if(!cabe) break;
          r++;
        }
        if(!melhor || r > melhor.r) melhor = { a, b, r };
      }
      if(!melhor || melhor.r < 2) continue;
      const [cx, cy] = em(melhor.a, melhor.b), raio = melhor.r*GRAO;
      /* as tiras: uma linha de cada vez, pra pintar e pra laje */
      const tiras = [];
      for(let j=0;j<ny;j++){
        let i = 0;
        while(i < nx){
          if(!dentro.has(i + ',' + j)){ i++; continue; }
          let k = i;
          while(k + 1 < nx && dentro.has((k+1) + ',' + j)) k++;
          tiras.push({ x0: q.ix0 + i*GRAO, x1: q.ix0 + (k+1)*GRAO,
                       y0: q.iy0 + j*GRAO, y1: q.iy0 + (j+1)*GRAO });
          i = k + 1;
        }
      }
      const pecas = [];
      const pe = (k, o) => pecas.push(Object.assign({ k, bloqueia: false }, o));
      const g2 = Math.min(raio*0.66, 30);
      pe('piso', { x0: cx - g2, x1: cx + g2, y0: cy - g2, y1: cy + g2, cor: '#4e7f40', base: 1.7 });
      pe('arvore', { x: cx, y: cy, r: Math.min(14, raio*0.42) });
      if(raio >= 30){
        for(const sx of [-1, 1]) pe('banco', { x0: cx + sx*raio*0.62 - 10, x1: cx + sx*raio*0.62 + 10,
                                               y0: cy - 5, y1: cy + 5 });
        pe('poste', { x: cx, y: cy + raio*0.66, dx: 0, dz: -1 });
      }
      achadas.push({ tiras, cx, cy, raio, pecas });
    }
    if(achadas.length) q.pracinhas = achadas;
  }

  /* ---- A DECORAÇÃO: letreiro no comércio, pixação no muro ----
     O que a planta guarda é só o texto; quem desenha monta o atlas a
     partir dos textos que apareceram. Letreiro é comércio de rua, e
     pixação é o que cobre muro e casa baixa por aqui: recado de
     aluguel, de obra, de amor e de torcida. */
  for(const l of LOTES){
    if(l.tipo === 'sede') continue;                 // a sede já tem a faixa dela
    if(l.tipo === 'muro'){ if(rng() < 0.55) l.pixacao = escolher(PIXACAO); continue; }
    const r = rng();
    if(r < 0.30) l.placa = escolher(COMERCIO);
    else if(r < 0.54) l.pixacao = escolher(PIXACAO);
  }

  /* ---- o que é asfalto, e quem encosta nele ----
     A moita tem raio e o poste tem base: testar só o centro deixa
     meia moita na rua. Aqui o teste é o quadrado da peça. */
  const noAsfalto = (x, y) => !!naAvenida(x, y, 0) || naRua(x, y);
  function tocaAsfalto(x, y, r){
    for(const a of [-1, 0, 1]) for(const b of [-1, 0, 1])
      if(noAsfalto(x + a*r, y + b*r)) return true;
    return false;
  }

  /* a fatia de um equipamento, com folga: nem moita nem copa de árvore
     entram nela. A sede é MURADA, e copa de árvore de calçada passava
     por cima do muro e aparecia como arbusto dentro do salão. */
  function naFatiaDeEquipamento(x, y, folga){
    const f = folga || 0;
    for(const q of QUADRAS){
      if(!q.equip) continue;
      const a = q.equip.area;
      if(x + f > a.x0 && x - f < a.x1 && y + f > a.y0 && y - f < a.y1) return true;
    }
    return false;
  }

  /* ---- as moitas do mato: só onde é mato, num balde espacial ---- */
  const MOITAS = [];
  const BALDE = 256, baldes = new Map();
  const chave = (x, y) => ((x/BALDE)|0) + ',' + ((y/BALDE)|0);
  for(let n=0;n<2600;n++){
    const x = VX0 + rng()*VW, y = VY0 + rng()*VH;
    const r = entre(16, 40);
    if(zona(x, y) !== 'mato') continue;
    if(naAvenida(x, y, CALC + 10)) continue;
    if(tocaAsfalto(x, y, r*0.9)) continue;
    if(naFatiaDeEquipamento(x, y, r)) continue;
    const m = { x, y, r };
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
    [[100,-40],[130,80],[120,160],[60,230]].map(p => pxm(p[0], p[1]))
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
  /* carro nenhum estacionado na areia */
  for(let i = CARROS.length - 1; i >= 0; i--)
    if(CARROS[i].x1 > xLimiteCosta((CARROS[i].y0 + CARROS[i].y1)/2)) CARROS.splice(i, 1);
  function noCarro(x, y){
    for(const c of CARROS) if(dentroRet(x, y, c)) return c;
    return null;
  }

  /* ---- árvores nas calçadas ----
     A COPA INTEIRA TEM DE CABER NA CALÇADA. A calçada tem CALC (32) de
     largura, então o tronco vai no eixo dela (16 da guia) e a copa é
     menor que isso: com r até 13 sobra folga dos dois lados, e nenhuma
     copa passa por cima do asfalto. Árvore nos quatro lados do
     quarteirão, não só no norte e no sul. */
  const ARVORES = [];
  /* o tronco sai do eixo da calçada e encosta mais na divisa do lote:
     assim a copa cresce pro lado do quintal, que é de graça, e mesmo
     com raio 19 ainda sobra folga até a guia */
  const EIXO_CALC = CALC*0.62;
  for(const q of QUADRAS){
    const por = (x, y) => {
      const r = entre(14, EIXO_CALC - 1);
      if(zona(x, y) !== 'cidade') return;
      /* a copa é um QUADRADO de meia-largura r: contra uma avenida
         diagonal a quina dela chega a r·√2, não a r */
      if(naAvenida(x, y, r*1.45)) return;
      if(naFatiaDeEquipamento(x, y, r*1.45)) return;   // a quina da copa quadrada
      if(q.lotes.some(l => dentroLote(x, y, l))) return;
      ARVORES.push({ x, y, r });
    };
    for(let x = q.x0 + 56; x < q.x1 - 46; x += par8(entre(104, 176))){
      if(rng() < 0.6) por(x, q.y0 + EIXO_CALC);
      if(rng() < 0.6) por(x, q.y1 - EIXO_CALC);
    }
    for(let y = q.y0 + 56; y < q.y1 - 46; y += par8(entre(104, 176))){
      if(rng() < 0.55) por(q.x0 + EIXO_CALC, y);
      if(rng() < 0.55) por(q.x1 - EIXO_CALC, y);
    }
  }
  for(const a of ARVORES){ const q = celulaEm(a.x, a.y); if(q){ (q.arvores = q.arvores || []).push(a); } }

  /* ---- postes nas ruas do estádio e na avenida ---- */
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
  for(const sg of AVENIDAS[0].segs){
    for(let t = 60; t < sg.L - 40; t += 220){
      const off = AVENIDAS[0].l/2 + 10;
      const x = sg.x0 + sg.ux*t - sg.uy*off, y = sg.y0 + sg.uy*t + sg.ux*off;
      if(x >= 0 && y >= 0 && x < W && y < H) POSTES.push({ x, y, dx: sg.uy, dz: -sg.ux });
    }
  }
  /* poste nenhum no meio da rua nem na areia: nos cruzamentos a calçada
     da avenida vira asfalto, e a leste a cidade acaba antes da guia */
  for(let i = POSTES.length - 1; i >= 0; i--)
    if(tocaAsfalto(POSTES[i].x, POSTES[i].y, 2) || POSTES[i].x > xLimiteCosta(POSTES[i].y))
      POSTES.splice(i, 1);

  /* =========================================================
     A BEIRA DA ESTRADA — o que fecha o mapa
     ---------------------------------------------------------
     As avenidas saem da cidade e viram estrada pelo mato até a borda
     do que se desenha. Até aqui a borda era mato pelado com moita, e
     de dentro do bairro dava pra ver o cenário ACABAR. O que a estrada
     de verdade tem é o que entra aqui: casa solta na beira, galpão,
     muro de sítio, barraco — indo rareando conforme se afasta, que é
     o que faz o olho ler "a cidade continua pra lá" em vez de "o
     cenário termina aqui".

     Elas ficam FORA do contorno da cidade, viradas pra estrada como as
     casas da avenida (lote com ângulo), longe do asfalto, fora do
     campo, da praia e do mar. Bloqueiam na máscara como qualquer casa,
     num balde espacial — são poucas, mas a máscara pergunta 460 mil
     vezes e varredura linear ali custa caro.
     ========================================================= */
  const BEIRA = [];
  /* o corpo da casa girada amostrado numa grade n × n, com a folga
     somada às medidas: é o teste de "encosta em" pra quem não é reto */
  function cantosGirados(o, folga){
    const c = Math.cos(o.ang), s = Math.sin(o.ang);
    const hw = o.w/2 + (folga || 0), hh = o.h/2 + (folga || 0), pts = [];
    for(let i=0;i<=4;i++) for(let j=0;j<=4;j++){
      const u = -hw + 2*hw*i/4, v = -hh + 2*hh*j/4;
      pts.push([o.cx + u*c - v*s, o.cy + u*s + v*c]);
    }
    return pts;
  }
  const TIPOS_BEIRA = ['casa','casa','casa','sobrado','galpao','muro','muro'];
  for(const av of AVENIDAS){
    let t = 0;
    for(const sg of av.segs){
      /* passo curto e pouca falta: a estrada tem de ficar POVOADA. Com
         passo de 120 a 210 e um terço de falta sobrava buraco de cem
         metros, e o olho lia o fim do cenário do mesmo jeito. */
      for(; t < sg.t0 + sg.L; t += par8(entre(92, 148))){
        const s = t - sg.t0;
        const ex = sg.x0 + sg.ux*s, ey = sg.y0 + sg.uy*s;
        if(zona(ex, ey) !== 'mato') continue;      // dentro da cidade já há quarteirão
        for(const lado of [-1, 1]){
          if(rng() < 0.14) continue;
          /* DUAS FILEIRAS: a da frente na guia e, às vezes, uma atrás
             dela. Uma fileira só lê como cenário de papelão; com a
             segunda a estrada ganha fundo. */
          for(const fila of (rng() < 0.42 ? [0, 1] : [0])){
            const tipo = escolher(fila ? ['casa','muro','galpao','casa'] : TIPOS_BEIRA);
            const T = TIPOS[tipo];
            const w = par8(entre(88, 168)), h = par8(tipo === 'muro' ? entre(16, 24) : entre(76, 112));
            /* recuo da guia: a casa de beira de estrada fica mais longe
               do asfalto que a de rua, e varia — é o que faz a fileira
               não parecer régua */
            const frenteDaCasa = av.l/2 + CALC + entre(6, 62) + fila*entre(150, 230);
            const rec = frenteDaCasa + h/2;
            const cx = ex - sg.uy*rec*lado, cy = ey + sg.ux*rec*lado;
            if(cx < VX0 + 30 || cy < VY0 + 30 || cx > VX0 + VW - 30 || cy > VY0 + VH - 30) continue;
            if(zona(cx, cy) !== 'mato') continue;
            if(noCampo(cx, cy)) continue;
            const c = celulaEm(cx, cy);
            if(c && c.tipo === 'quadra') continue;
            const casa = { tipo, ang: sg.ang, cx, cy, w, h, vf: -lado, frente:'av', beira:true,
                           alt: par8(entre(T.alt[0], T.alt[1])) || T.alt[0], cor: escolher(T.cor) };
            /* nada em cima do asfalto, aqui como em toda parte: a
               avenida pela distância exata, e a RUA da grade amostrada
               no corpo da casa — na saída da cidade a última faixa da
               grade ainda existe, e a casa girada pegava nela */
            if(tocaAvenida(casa, 8)) continue;
            if(cantosGirados(casa, 6).some(([px, py]) => noAsfalto(px, py))) continue;
            if(BEIRA.some(o => Math.hypot(o.cx - cx, o.cy - cy) < (o.w + w)/2 + 22 &&
                               Math.abs(o.cx - cx) + Math.abs(o.cy - cy) < (o.w + o.h + w + h)/2)) continue;
            /* A CALÇADA DA CASA: da guia até a frente dela, mais larga
               que a casa pros pedaços vizinhos se encontrarem e virarem
               uma calçada só. Só a fileira da frente tem — a de trás dá
               pro fundo do terreno. */
            if(!fila){
              const d1 = frenteDaCasa + 3;
              /* A GUIA NÃO É RETA NA DOBRA. A laje é um retângulo preso
                 ao trecho, e onde a avenida vira o asfalto do trecho
                 seguinte corta por dentro dela. Então a beirada interna
                 recua até o corpo da laje sair inteiro do asfalto — e
                 se não sair, a casa fica sem calçada mesmo. */
              let d0 = av.l/2 + 2, laje = null;
              while(d0 < d1 - 10){
                const dm = (d0 + d1)/2;
                const o = { ang: sg.ang, cx: ex - sg.uy*dm*lado, cy: ey + sg.ux*dm*lado,
                            w: w + 52, h: d1 - d0 };
                if(!cantosGirados(o, 1).some(([px, py]) => noAsfalto(px, py))){ laje = o; break; }
                d0 += 4;
              }
              if(laje) casa.calcada = laje;
            }
            BEIRA.push(casa);
            LOTES.push(casa);
          }
        }
      }
    }
  }

  /* ---- A BORDA DA CIDADE ----
     Uma rua da grade existe quando UMA das células ao lado é urbana
     (`ruaEntre`), então na saída do bairro sobra pista com quarteirão
     de um lado e descampado do outro — foi o que o dono viu na foto
     do sul. Aqui a célula de mato encostada numa rua dessas ganha uma
     FILEIRA de casa na guia de fora, com calçada, virada pra pista.

     Elas são RETAS, e por isso saem como lote axial (`frente`, sem
     `ang`) e não como a casa girada da estrada: `ang: 0` é FALSO em
     JavaScript, e todo lugar que pergunta `if(l.ang)` — a começar pelo
     `lote()` que desenha — mandava a casa de ângulo zero pro caminho
     do lote reto e ia ler `l.x0`, que ela não tinha. Onze delas não
     eram desenhadas. Lote reto é lote reto. */
  const amostrasRet = (o, f) => {
    const pts = [];
    for(let i=0;i<=4;i++) for(let j=0;j<=4;j++)
      pts.push([o.x0 - f + (o.x1 - o.x0 + 2*f)*i/4, o.y0 - f + (o.y1 - o.y0 + 2*f)*j/4]);
    return pts;
  };
  const LADOS_BORDA = [[ 1, 0, 'l'], [-1, 0, 'o'], [ 0, 1, 's'], [ 0,-1, 'n']];
  for(let i = 0; i < grade.length; i++){
    for(let j = 0; j < (grade[i] || []).length; j++){
      const n = grade[i][j];
      if(!n || n.tipo === 'quadra' || n.tipo === 'campo') continue;
      for(const [di, dj, frente] of LADOS_BORDA){
        const v = (grade[i + di] || [])[j + dj];
        if(!v || v.tipo !== 'quadra') continue;
        const hor = di !== 0;
        const guia = di > 0 ? n.x1 : di < 0 ? n.x0 : dj > 0 ? n.y1 : n.y0;
        const dentro = (di > 0 || dj > 0) ? -1 : 1;          // pra dentro da célula de mato
        const a0 = hor ? n.y0 : n.x0, a1 = hor ? n.y1 : n.x1;
        for(let a = a0 + 24; a < a1 - 60; a += par8(entre(96, 152))){
          if(rng() < 0.16) continue;
          const tipo = escolher(TIPOS_BEIRA);
          const T = TIPOS[tipo];
          const larg = par8(entre(88, 150));                 // ao longo da rua
          const prof = par8(tipo === 'muro' ? entre(16, 24) : entre(76, 108));
          if(a + larg > a1 - 24) continue;
          const rec = CALC + entre(2, 34);                   // da guia até a FRENTE da casa
          const f0 = guia + dentro*rec, f1 = f0 + dentro*prof;
          const casa = { tipo, frente, beira:true, quadra:null,
                         x0: hor ? Math.min(f0, f1) : a, x1: hor ? Math.max(f0, f1) : a + larg,
                         y0: hor ? a : Math.min(f0, f1),     y1: hor ? a + larg : Math.max(f0, f1),
                         alt: par8(entre(T.alt[0], T.alt[1])) || T.alt[0], cor: escolher(T.cor) };
          const cx = (casa.x0 + casa.x1)/2, cy = (casa.y0 + casa.y1)/2;
          if(cx < VX0 + 30 || cy < VY0 + 30 || cx > VX0 + VW - 30 || cy > VY0 + VH - 30) continue;
          if(zona(cx, cy) !== 'mato') continue;
          if(noCampo(cx, cy)) continue;
          const c = celulaEm(cx, cy);
          if(c && c.tipo === 'quadra') continue;
          if(tocaAvenida(casa, 8)) continue;
          if(amostrasRet(casa, 6).some(([px, py]) => noAsfalto(px, py))) continue;
          if(BEIRA.some(o => {
            const ox = o.ang ? o.cx : (o.x0 + o.x1)/2, oy = o.ang ? o.cy : (o.y0 + o.y1)/2;
            const ow = o.ang ? o.w : (o.x1 - o.x0), oh = o.ang ? o.h : (o.y1 - o.y0);
            return Math.abs(ox - cx) < (ow + larg)/2 + 20 && Math.abs(oy - cy) < (oh + prof)/2 + 20;
          })) continue;
          /* a calçada: da guia até a frente da casa, mais larga que ela.
             Começa DOIS pra dentro da guia, e a amostra vai sem folga:
             a guia é a borda da célula, e um ponto meio à frente dela
             já está na pista. */
          const c0 = guia + dentro*2, c1 = f0 + dentro*3;
          const laje = hor
            ? { x0: Math.min(c0, c1), x1: Math.max(c0, c1), y0: a - 22, y1: a + larg + 22 }
            : { x0: a - 22, x1: a + larg + 22, y0: Math.min(c0, c1), y1: Math.max(c0, c1) };
          if(Math.abs(c1 - c0) > 8 && !amostrasRet(laje, 0).some(([px, py]) => noAsfalto(px, py)))
            casa.calcada = { cx: (laje.x0 + laje.x1)/2, cy: (laje.y0 + laje.y1)/2,
                             w: laje.x1 - laje.x0, h: laje.y1 - laje.y0, ang: 0 };
          BEIRA.push(casa);
          LOTES.push(casa);
        }
      }
    }
  }

  /* o balde da beira, pra máscara perguntar barato */
  const BALDE_B = 256, baldesBeira = new Map();
  for(const o of BEIRA){
    const r = Math.max(o.w, o.h)/2;
    for(let i = ((o.cx - r)/BALDE_B|0); i <= ((o.cx + r)/BALDE_B|0); i++)
      for(let j = ((o.cy - r)/BALDE_B|0); j <= ((o.cy + r)/BALDE_B|0); j++){
        const k = i + ',' + j;
        if(!baldesBeira.has(k)) baldesBeira.set(k, []);
        baldesBeira.get(k).push(o);
      }
  }
  function naBeira(x, y){
    const l = baldesBeira.get(((x/BALDE_B)|0) + ',' + ((y/BALDE_B)|0));
    if(!l) return false;
    for(const o of l) if(dentroLote(x, y, o)) return true;
    return false;
  }
  /* árvore e poste na beira, pro trecho não virar fileira de caixas */
  for(const o of BEIRA){
    if(o.tipo === 'muro' || rng() < 0.5) continue;
    const c = Math.cos(o.ang), s = Math.sin(o.ang);
    const d = -o.vf*(o.h/2 + entre(26, 46)), u = entre(-o.w*0.4, o.w*0.4);
    const x = o.cx + u*c - d*s, y = o.cy + u*s + d*c;
    if(zona(x, y) !== 'mato' || tocaAsfalto(x, y, 26) || naBeira(x, y)) continue;
    ARVORES.push({ x, y, r: entre(15, 22) });
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

  const CIDADE = { PX, MAPA, VISTA, VW, VH, VX0, VY0, pxm, pxX, pxY, RUA, CALC, TORCIDAS,
                   COLUNAS, LINHAS, CELULAS, QUADRAS, grade, celulaEm, zona, xCosta, PRAIA, ORLA,
                   CONTORNO, AVENIDAS, distAvenida, naAvenida, naRua, bordasX, bordasY,
                   xLimiteCosta, cortarPor, recorteCosta, pedacosSemAvenida, dentroPol, ruaEntre,
                   areaPol, noAsfalto, BEIRA, naBeira, CAMPOS, CERCA, PORTEIRA,
                   noCampo, andaNoCampo, LOTES, cantosDoLote, MOITAS, naMoita, TRILHAS,
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
      /* no equipamento anda-se em volta das peças; no quarteirão de
         casa o miolo inteiro é maciço */
      if(q.equip){
        const a = q.equip.area;
        if(x >= a.x0 && x < a.x1 && y >= a.y0 && y < a.y1)
          return !q.solidos.some(o => x >= o.x0 && x < o.x1 && y >= o.y0 && y < o.y1);
      }
      return !dentroPol(x, y, q.polMiolo);
    }
    if(z === 'mato') return !naMoita(x, y) && !naBeira(x, y);
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
           QUADRAS, LOTES, CARROS, ARVORES, TORRES, SEDES, EQUIPAMENTOS, noLote, noCarro, andaNaCidade,
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
    /* Caminha pra fora da frente até achar chão onde o CORPO cabe — a
       máscara exige as oito vizinhas livres, e uma distância fixa da
       parede não garante isso em quarteirão nenhum. */
    const d = lote.frente === 'n' ? [0,-1] : lote.frente === 's' ? [0,1]
            : lote.frente === 'o' ? [-1,0] : [1,0];
    const bx = lote.frente === 'o' ? lote.x0 : lote.frente === 'l' ? lote.x1 : (lote.x0+lote.x1)/2;
    const by = lote.frente === 'n' ? lote.y0 : lote.frente === 's' ? lote.y1 : (lote.y0+lote.y1)/2;
    const cabe = (x, y) => {
      for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++) if(!P.anda(x + i*CEL, y + j*CEL)) return false;
      return true;
    };
    for(let f = folga || 30; f < 420; f += CEL){
      const x = bx + d[0]*f, y = by + d[1]*f;
      if(cabe(x, y)) return { x: Math.round(x), y: Math.round(y) };
    }
    return { x: Math.round(bx + d[0]*40), y: Math.round(by + d[1]*40) };
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
