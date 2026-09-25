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
   (A menos de `DX`: o tabuleiro da simulação começa a oeste do
   mundo — o mato do atacarejo é andável — e o x dele é o x da
   planta mais `DX`. Aqui dentro tudo continua no x da planta; só a
   cena e o `mundo()` falam o do tabuleiro.)

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
  /* O TABULEIRO COMEÇA A OESTE DO MUNDO. O mato a oeste da cidade,
     onde fica o atacarejo, passou a ser andável — e o tabuleiro de
     `arredores.js` conta célula a partir de zero. Então quem cresce
     pra oeste é o TABULEIRO: o x dele é o x da planta mais `DX`. O
     mundo, a cidade, a favela e tudo o que a planta sorteia não saem
     do lugar (mover o MAPA mudaria cada sorteio por posição). */
  /* 1152 = 2 × 576, e 576 é o mmc de 8, 18 e 64 — a célula da malha,
     a vaga de nascimento e a grade espacial de `combate.js`. Com isso
     a noite de antes sai IDÊNTICA, disco por disco, com a mesma
     semente (medido: 90 s, 76 discos, zero diferença); com 1040 ela
     saía equivalente mas não igual, porque o arredondamento caía em
     outro lugar. */
  const DX = 1152;
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
  /* O CAMPO DO LADO DO ESTÁDIO SAIU. Várzea encostada na arena não
     existe: aquele quarteirão virou TERRENO BALDIO, murado no fundo e
     com a frente de bar e loja virada pro estádio, que é o que se vê
     de verdade em volta de estádio de bairro. Ficou o campo do sul, que
     está no meio do residencial. */
  const CAMPOS = [ campo(360, 1020, 480, 1090) ];
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

  /* ---- OS CRUZAMENTOS DA AVENIDA COM A RUA DA GRADE ----
     Onde o EIXO da avenida atravessa uma rua de verdade — `naRua` é a
     mesma régua da máscara, então o cruzamento nasce exatamente onde
     um corpo pode de fato virar a esquina. Cada avenida é uma
     sequência de segmentos retos; cada COLUNA e cada LINHA é uma
     banda em x ou em y. O cruzamento é o ponto do segmento onde ele
     atravessa aquela banda — não precisa mais conta que isso, porque
     a rua da cidade é sempre reta e ortogonal.

     Serve pro pintor (faixa de pedestre nos dois sentidos) e pro
     3D (poste de semáforo nos PRINCIPAIS — as duas avenidas de
     entrada, que são por onde a torcida de fato chega andando; as
     saídas curtas pro mato e a beira-mar não levam semáforo). */
  const CRUZAMENTOS = (function(){
    const pontos = [];
    for(const av of AVENIDAS){
      const principal = av.id === 'sudoeste' || av.id === 'noroeste';
      for(const sg of av.segs){
        for(const col of COLUNAS){
          if((col.c - sg.x0)*(col.c - sg.x1) > 0 || Math.abs(sg.x1 - sg.x0) < 1) continue;
          const t = (col.c - sg.x0)/(sg.x1 - sg.x0), y = sg.y0 + t*(sg.y1 - sg.y0);
          if(zona(col.c, y) !== 'cidade' || !naRua(col.c, y)) continue;
          pontos.push({ x: col.c, y, ang: sg.ang, avLarg: av.l, ruaLarg: col.l, vertical: true, principal });
        }
        for(const lin of LINHAS){
          if((lin.c - sg.y0)*(lin.c - sg.y1) > 0 || Math.abs(sg.y1 - sg.y0) < 1) continue;
          const t = (lin.c - sg.y0)/(sg.y1 - sg.y0), x = sg.x0 + t*(sg.x1 - sg.x0);
          if(zona(x, lin.c) !== 'cidade' || !naRua(x, lin.c)) continue;
          pontos.push({ x, y: lin.c, ang: sg.ang, avLarg: av.l, ruaLarg: lin.l, vertical: false, principal });
        }
      }
    }
    /* QUANDO A AVENIDA PASSA POR UMA ESQUINA DA GRADE ela atravessa a
       COLUNA e a LINHA quase no mesmo lugar, e sai um par de pontos a
       poucas dezenas de distância. Não são dois cruzamentos: é UM, de
       seis pernas. Desenhar os dois dava dois anéis de faixa
       embolados. O raio de fusão é generoso (200) porque ao longo da
       avenida dois cruzamentos do MESMO tipo nunca ficam a menos de
       550 — a grade é larga —, então nada legítimo se perde. Fica o
       da rua mais larga, que é a que manda no cruzamento. */
    const unicos = [];
    for(const p of pontos){
      const j = unicos.findIndex(u => Math.hypot(u.x - p.x, u.y - p.y) < 200);
      if(j < 0) unicos.push(p);
      else if(p.ruaLarg > unicos[j].ruaLarg) unicos[j] = p;
    }
    return unicos;
  })();

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

  /* A ESCALA É A DO BONECO, e ela é o `METRO` lá de cima: ele tem 34
     unidades pra 1,75 m, então UMA UNIDADE É 5,1 CM e um metro são
     19,4 unidades. (Este comentário já disse "39 unidades, 4,5 cm",
     que não bate com a constante e foi de onde saiu uma leva inteira
     de móveis 1,8 vez maior que o certo. O número que manda é o
     `METRO`.) Com as alturas antigas a casa tinha 1,6 m e a porta
     0,90 — o boneco não passava por ela. */
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
                   clube:'CASA', fundacao:1970,
                   clubeSigla:'CASA', clubeCor:'#b02a22', clubeCor2:'#e8e2d0', efetivo:180,
                   cor:'#b02a22', cor2:'#e8e2d0', cor3:'#1a1a1a' },
      visitante: { id:'fora', nome:'VISITANTE', rot:'VISITANTE', nomeCompleto:'VISITANTE',
                   clube:'FORA', fundacao:1975,
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
        /* o ano vai na pixação: "TOC - 1985" é a assinatura mais comum
           de muro de torcida, e ele não estava saindo da ficha */
        fundacao: t.fundacao || null,
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
  /* `nivel` é o tamanho da sede, que no jogo cresce com a torcida.
     NÍVEL 1 é o barracão de três compartimentos — pátio com colchão,
     sala de patrimônio e sala do presidente. NÍVEL 3 é a sede grande,
     com salão, ala da frente e ala do fundo. Aqui vai uma de cada, que
     é o que deixa as duas à vista no mesmo mapa pra comparar; no jogo
     quem manda nisso é o progresso da torcida. */
  const SEDES = {
    mandante:  { ponto: pxm(280, 1058), frente:'n', torcida: TORCIDAS.mandante, nivel: 3,
                 cor: TORCIDAS.mandante.cor, rot: TORCIDAS.mandante.rot },
    visitante: { ponto: pxm(980, 255),  frente:'n', torcida: TORCIDAS.visitante, nivel: 1,
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
  /* =========================================================
     A PIXAÇÃO DA TORCIDA
     ---------------------------------------------------------
     Pixação de bairro de torcida não é frase solta: é ASSINATURA, e o
     que ela diz é DE QUEM É A RUA. São quatro formas, todas tiradas da
     ficha da torcida — o nome por extenso, a sigla, a sigla com o ano
     de fundação e o amor ao clube —, e a tinta é SEMPRE a cor primária
     dela, que é o que se lê de longe sem precisar ler a letra.

     Cada muro pixado guarda AS DUAS versões, a da mandante e a da
     visitante, e só mostra a do dono. É isso que deixa o jogador
     COBRIR a do rival: as duas já estão no atlas, e trocar de dono é
     reescrever a UV daquele quadrado — nenhuma malha se remonta.
     ========================================================= */
  function dizeresDaTorcida(T){
    if(!T) return [];
    const nome  = String(T.nomeCompleto || T.nome || '').toUpperCase().trim();
    const sigla = String(T.nome || '').toUpperCase().trim();
    const clube = String(T.clube || '').toUpperCase().trim();
    const l = [];
    if(nome)  l.push(nome);                                   // LEÕES DA TUF
    if(sigla) l.push(sigla);                                   // TUF
    if(sigla && T.fundacao) l.push(sigla + ' - ' + T.fundacao); // TUF - 1991
    if(clube) l.push(clube + ' MEU AMOR', 'SOMOS ' + clube, 'VIVEMOS DE ' + clube);
    /* sigla e nome podem ser a mesma palavra ("BAMOR"/"BAMOR"): o
       sorteio não precisa da mesma pixação duas vezes */
    return [...new Set(l)];
  }
  const PIXO_DE = { mandante: dizeresDaTorcida(TORCIDAS.mandante),
                    visitante: dizeresDaTorcida(TORCIDAS.visitante) };

  /* O RECADO DE PAREDE não é pixação: é o anúncio de quem mora ali —
     aluguel, obra, cão bravo. Ele FICA. Muro só com as duas torcidas
     lê como cenário de duas frases repetidas, não como bairro. */
  const RECADOS = [
    'VENDE-SE', 'ALUGA-SE', 'PINTA-SE CASAS', 'PRECISA-SE DE AJUDANTE',
    'É PROIBIDO JOGAR LIXO', 'NÃO ESTACIONE', 'ENTRADA DE VEÍCULOS',
    'TE AMO MARIA', 'SAUDADES ETERNAS', 'DEUS É FIEL',
    'PROIBIDO COLAR CARTAZ', 'CUIDADO COM O CÃO', 'TEM ÁGUA',
    'LAVA-SE ROUPA', 'CONSERTA-SE GELADEIRA'
  ];

  /* SEMENTE PRÓPRIA. A pixação sorteia de quem é cada muro e qual das
     frases vai nele; no sorteio compartilhado isso mexeria em TODA a
     cidade gerada depois — lote, árvore, moita, favela. */
  const rngPixo = semente(487219);
  const centroDaSede = lado => {
    const s = sedeDe[lado];
    return s ? [(s.x0 + s.x1)/2, (s.y0 + s.y1)/2] : SEDES[lado].ponto;
  };
  /* DE QUEM É O MURO. Perto da sede de uma torcida quase tudo é dela;
     no meio do bairro é meio a meio. É isso que dá TERRITÓRIO ao mapa:
     dá pra ver de longe onde acaba um lado e começa o outro. O peso é o
     inverso do quadrado da distância, que faz a virada acontecer no
     meio do caminho, e não na porta da sede.
     Os 12% de piso dos dois lados não são folga de conta: sem eles não
     sobra pixação de rival pra cobrir perto da sede, que é justamente
     onde o jogador começa. */
  function ladoDoMuro(cx, cy){
    const m = centroDaSede('mandante'), v = centroDaSede('visitante');
    const dm = Math.max(1, (cx-m[0])*(cx-m[0]) + (cy-m[1])*(cy-m[1]));
    const dv = Math.max(1, (cx-v[0])*(cx-v[0]) + (cy-v[1])*(cy-v[1]));
    const p = Math.min(0.88, Math.max(0.12, dv / (dm + dv)));
    return rngPixo() < p ? 'mandante' : 'visitante';
  }
  /* QUANTO DO QUE SE PINTA EM MURO É TORCIDA; o resto é recado de casa */
  const FATIA_PIXO = 0.66;
  /* PÕE A PIXAÇÃO NO LOTE, com as duas versões e a do dono à vista.
     `recado` chega de fora JÁ SORTEADO: o sorteio dele é do `rng()`
     compartilhado e tem de acontecer do lado de lá, gastando o mesmo
     número de sempre, senão a cidade inteira muda de lugar. */
  function pixar(l, recado, sempre){
    const temTorcida = PIXO_DE.mandante.length && PIXO_DE.visitante.length;
    /* o sorteio acontece SEMPRE, mesmo quando o muro é obrigado a ser
       de torcida: é o mesmo `rngPixo` pra todo mundo, e pular um número
       nele mudaria de quem são todos os muros seguintes */
    const sorte = rngPixo();
    if(!temTorcida || (!sempre && sorte >= FATIA_PIXO)){
      if(recado) l.pixacao = recado;
      return;
    }
    const cx = l.cx !== undefined ? l.cx : (l.x0 + l.x1)/2;
    const cy = l.cx !== undefined ? l.cy : (l.y0 + l.y1)/2;
    const lado = ladoDoMuro(cx, cy);
    const alt = {};
    for(const k of ['mandante', 'visitante'])
      alt[k] = { texto: PIXO_DE[k][Math.floor(rngPixo()*PIXO_DE[k].length)],
                 tinta: TORCIDAS[k].cor };
    l.pixo = { lado, alt };
    l.pixacao = alt[lado].texto;
    l.pixoTinta = alt[lado].tinta;
  }
  const EQUIPAMENTOS = [
    { tipo: 'hospital',  ponto: pxm(765, 448) },   // logo ao sul do estádio
    { tipo: 'delegacia', ponto: pxm(419, 448) },   // a oeste, no caminho da torcida
    { tipo: 'shopping',  ponto: pxm(568, 792) },   // no nordeste, de frente pra orla
    { tipo: 'posto',     ponto: pxm(765, 620) },   // na via larga, ao sul
    { tipo: 'escola',    ponto: pxm(568, 706) },   // no meio do residencial
    { tipo: 'galeria',   ponto: pxm(765, 706) },   // o beco de lojas, ao lado da escola
    { tipo: 'praca',     ponto: pxm(568, 878) },   // o centro do bairro do sul
    { tipo: 'baldio',    ponto: pxm(568, 305) }    // onde era o campo, ao lado do estádio
  ];
  const CORES_CARRO_PM = ['#f0f0ee','#1a3f86'];
  /* a mesma paleta dos carros da rua — ela é declarada mais abaixo,
     junto do estacionamento da beira do estádio */
  const CORES_CARRO_EQ = ['#d9d9d9','#2b2b2b','#8a8f96','#b8242a','#2a4f9a','#e6e6e6','#6b7280'];

  /* QUANTO DO QUARTEIRÃO CADA UM TOMA. O resto é casa: quarteirão de
     posto tem casa, o da escola também — é assim na cidade, e um
     equipamento sozinho num quarteirão inteiro lê como maquete. */
  /* `baldio` é a exceção: ele TOMA O QUARTEIRÃO INTEIRO — era o campo
     de várzea, e meia quadra de terreno baldio não vira nada. */
  const FATIA = { praca: 0.78, galeria: 0.66, shopping: 0.74, hospital: 0.66,
                  escola: 0.68, delegacia: 0.58, posto: 0.48, baldio: 1 };
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
    /* o que o equipamento quer contar pra quem vem depois (o baldio diz
       onde acaba o miolo murado e começa a fileira das lojas) */
    const extra = {};
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
      /* a cruz e o nome vão no ANDAR DE CIMA da lâmina, no painel liso que
         o modelo (js/diajogo/equip_antigo3d.js) deixa entre as janelas —
         acima do telhado da ala oeste, senão ela come metade do letreiro */
      p('cruz', { x: cx - 120, y: Y0 + fundo, base: 181, ox: 0, oz: 1, tam: 44 }, false);
      p('letreiro', { x: cx + 40, y: Y0 + fundo, ox: 0, oz: 1, texto: 'HOSPITAL MUNICIPAL', placa: true, larg: 148, altura: 26, base: 190 }, false);
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
      p('totem', { x0: X1 - 46, x1: X1 - 20, y0: Y1 - 52, y1: Y1 - 26, alt: 150, cor: '#c8232c' });
      p('carro', { x0: kx0 + 34, x1: kx0 + 70, y0: ky0 + 34, y1: ky0 + 68, cor: escolher(CORES_CARRO_EQ) });
      fila(3, X0 + 30, cx - lw/2 - 30, x => p('arvore', { x, y: Y0 + 34, r: 18 }, false));
      /* a placa branca de letra vermelha, na faixa da marca (a marca é nossa) */
      p('letreiro', { x: cx, y: ky0 - 26, ox: 0, oz: 1, texto: 'POSTO BEIRA-ESTRADA', placa: true,
                      larg: Math.min(130, lw - 16), altura: 22, base: 48, fundo: '#f4f3ee', tinta: '#c8232c' }, false);
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
      /* o nome vai na fachada da caixa, a oeste da torre de vidro e acima
         da marquise: na frente da torre (4 m) a placa de 7,7 m ficava
         pendurada no ar dos dois lados */
      p('letreiro', { x: (bx0 + cx - larg*0.18)/2, y: Y0 + fundo, ox: 0, oz: 1, texto: 'SHOPPING BEIRA-MAR', placa: true,
                      larg: Math.min(150, cx - larg*0.18 - bx0 - 16), altura: 30, base: 90 }, false);
      p('arvore', { x: X1 - 22, y: Y0 + 22, r: 16 }, false);
    }
    if(tipo === 'baldio'){
      /* O TERRENO BALDIO, onde era o campo de várzea. O muro fecha a
         face de TRÁS — a que dá as costas pro estádio — e as duas
         laterais; a face virada PRO ESTÁDIO é uma fileira de bares e
         lojas, que é por onde a torcida passa indo pro jogo. Dentro do
         muro é terra batida com mato, entulho e um carro abandonado.
         O muro tem DOIS FUROS de propósito: baldio murado sem buraco
         não existe, e sem eles o miolo ficaria inalcançável. */
      chao = '#97865c';                                    // terra batida
      /* EIXO LOCAL: `u` cresce da face murada pra face do estádio, e
         `rx` devolve o retângulo já no sentido certo — a mesma planta
         serve se o quarteirão trocar de lado do mapa. */
      const proLeste = CX > cx;
      const ux = u => proLeste ? X0 + u : X1 - u;
      const rx = (u0, u1) => proLeste ? { x0: X0 + u0, x1: X0 + u1 } : { x0: X1 - u1, x1: X1 - u0 };
      const ofora = proLeste ? 1 : -1;                     // pra onde olha a frente das lojas
      const M_ALT = 54, M_ESP = 9;                         // o muro do baldio
      /* o muro recua 3 da guia: a placa de VENDE-SE sai meio ponto à
         frente dele, e encostado na guia ela pendurava sobre a calçada */
      const REC = 3;
      const PAT = 32;                                      // o pátio das mesas, na guia
      const FUNDO = Math.min(L*0.34, 176);                 // o fundo das lojas
      const uL1 = L - PAT, uL0 = uL1 - FUNDO;              // a faixa das lojas, em u
      extra.murado = { ...rx(0, uL0), y0: Y0, y1: Y1 };     // o terreno de dentro do muro

      /* ---- A FILEIRA DE BARES E LOJAS ----
         Encostadas uma na outra de propósito: as costas delas são a
         quarta parede do baldio, e vão entre duas seria furo pra rua. */
      const PA = rx(uL1, L);
      piso(PA.x0, Y0, PA.x1, Y1, '#a8a296');               // a calçada das mesas
      /* LOJA GRANDE, POUCAS. Dez portas de 3,9 m de frente enfileiradas
         liam como box de camelô, não como o comércio que atende o
         estádio: agora são seis de 6,5 m de frente por 7,9 de fundo.
         Menos letreiro e mais prédio. */
      const nlj = Math.max(4, Math.round(A/155)), wlj = A/nlj;
      /* nome sem repetir na mesma fileira: duas placas iguais lado a
         lado entregam que o letreiro é sorteado */
      const nomes = COMERCIO.slice();
      for(let i=nomes.length-1;i>0;i--){ const j = Math.floor(rng()*(i+1)); [nomes[i], nomes[j]] = [nomes[j], nomes[i]]; }
      for(let i=0;i<nlj;i++){
        const y0 = Y0 + i*wlj, y1 = Y0 + (i+1)*wlj, ym = (y0 + y1)/2;
        /* A FRENTE é sempre na guia; o FUNDO varia. Assim o telhado
           deixa de ser uma laje só e o muro dos fundos fica recortado,
           como fileira de loja que cresceu uma de cada vez. Varia só
           pra dentro: a fileira continua vedando o baldio. */
        const ub = uL0 + FUNDO*rng()*0.30, lj = rx(ub, uL1);
        const alt = par8(entre(88, 124));
        p('bloco', { x0: lj.x0, x1: lj.x1, y0, y1, alt,
                     cor: escolher(TIPOS.casa.cor), teto: escolher(['#8f8a80', '#97928a', '#867f74']) });
        /* a caixa d'água em cima de uma sim, outra não — no fundo DESTA
           loja, senão ela flutua sobre o baldio nas mais rasas */
        if(i % 3 === 1){
          const cd = rx(ub + 20, ub + 42);
          p('maquina', { x0: cd.x0, x1: cd.x1, y0: ym - 11, y1: ym + 11,
                         y: alt + 4, alt: 20, cor: '#9aa0a2' }, false);
        }
        const tol = rx(uL1, uL1 + 16), por = rx(uL1 - 1.0, uL1 + 0.4);
        p('marquise', { x0: tol.x0, x1: tol.x1, y0: y0 + 3, y1: y1 - 3, y: 56, alt: 5,
                        cor: i % 2 ? '#c05a3a' : '#2f6a4a' }, false);
        p('marquise', { x0: por.x0, x1: por.x1, y0: ym - 16, y1: ym + 16, y: 0, alt: 46, cor: '#4a3a2c' }, false);
        p('letreiro', { x: ux(uL1), y: ym, ox: ofora, oz: 0, texto: nomes[i % nomes.length], placa: true,
                        larg: Math.min(wlj - 20, 152), altura: 20, base: 66 }, false);
        /* as mesas na calçada: é o que faz o bar em dia de jogo */
        if(i % 2 === 0) p('banco', Object.assign({}, ret(ux(uL1 + 19), ym, 20, 11)), false);
      }
      fila(4, Y0 + 70, Y1 - 70, y => p('poste', { x: ux(uL1 + 26), y, dx: -ofora, dz: 0 }, false));

      /* ---- O MURO ----
         A face de trás é inteira; as laterais vão da face de trás até
         as costas das lojas, cada uma com um vão — o portão de arame
         no norte, o pedaço caído no sul. */
      const MT = rx(REC, REC + M_ESP);
      p('muro', { x0: MT.x0, x1: MT.x1, y0: Y0 + REC, y1: Y1 - REC, alt: M_ALT, cor: '#b3ab98' });
      const VAO = [[uL0*0.42, 60, M_ALT], [uL0*0.72, 44, M_ALT - 16]];
      [[Y0 + REC, Y0 + REC + M_ESP], [Y1 - REC - M_ESP, Y1 - REC]].forEach((fy, k) => {
        const [uc, w, alt] = VAO[k];
        for(const [ua, ub] of [[REC, uc - w/2], [uc + w/2, uL0]]){
          if(ub - ua < 6) continue;
          const r = rx(ua, ub);
          p('muro', { x0: r.x0, x1: r.x1, y0: fy[0], y1: fy[1], alt, cor: '#b3ab98' });
        }
      });

      /* ---- O MIOLO: mato, entulho e o carro abandonado ----
         Baldio é BAGUNÇA: mato em tufo, terra pelada, restos de
         alicerce e o que os vizinhos largaram lá. Nada disso é
         geometria cara — o mato é chão pintado, e o entulho é caixa
         baixa, que o boneco contorna sem ficar preso. */
      const B = rx(REC + M_ESP, uL0), by0 = Y0 + REC + M_ESP, by1 = Y1 - REC - M_ESP;
      const BL = B.x1 - B.x0, BA = by1 - by0;
      /* AS MANCHAS DO CHÃO. Antes eram quatro verdes fortes, e no
         canvas do chão (0,47 px por unidade) cada uma virava um
         retângulo verde de aresta dura — lia como falha de textura.
         O mato de verdade agora vem dos DECALQUES, que são foto; o
         que o chão pintado tem de fazer é só variar o tom da terra,
         mais seca aqui, mais úmida ali, pra a placa não pousar sobre
         uma cor chapada. Mesma quantidade de sorteios de propósito:
         `rng()` é compartilhado com a cidade inteira. */
      const MATO = ['#8f8257', '#9b8c62', '#877a52', '#948553'];
      for(let i=0;i<34;i++){
        const w = entre(34, 132), h = entre(30, 104);
        /* o mato pega mais no pé do muro, que é onde ninguém passa */
        const beira = rng() < 0.45;
        const mx = beira ? (rng() < 0.5 ? B.x0 + entre(0, 26) : B.x1 - w - entre(0, 26))
                         : B.x0 + 6 + rng()*(BL - w - 12);
        const my = beira && rng() < 0.5 ? (rng() < 0.5 ? by0 + entre(0, 26) : by1 - h - entre(0, 26))
                                        : by0 + 6 + rng()*(BA - h - 12);
        piso(Math.max(B.x0, mx), Math.max(by0, my), Math.min(B.x1, mx + w), Math.min(by1, my + h),
             i % 4 ? escolher(MATO) : '#8a7a4e');   // o quarto é terra pelada
      }
      /* o entulho: monte de alicerce velho, tijolo quebrado e concreto */
      const ENTULHO = ['#9a9288', '#8c6a56', '#6e675c', '#a49a86'];
      for(let i=0;i<11;i++){
        const w = par8(entre(16, 46)), h = par8(entre(14, 38));
        const ex = B.x0 + 20 + rng()*(BL - w - 40), ey = by0 + 20 + rng()*(BA - h - 40);
        p('bloco', { x0: ex, x1: ex + w, y0: ey, y1: ey + h,
                     alt: par8(entre(10, 28)), cor: escolher(ENTULHO) });
      }
      /* dois pedaços de muro caído, deitados no mato */
      for(const [fx, fy, deitado] of [[0.30, 0.22, true], [0.68, 0.78, false]]){
        const cx2 = B.x0 + BL*fx, cy2 = by0 + BA*fy;
        p('muro', Object.assign({ alt: 11, cor: '#b3ab98' },
                                ret(cx2, cy2, deitado ? 86 : 14, deitado ? 14 : 78)));
      }
      /* os dois carros largados: um sem rodas e outro queimado */
      for(const [fx, fy, cor] of [[0.58, 0.72, '#6f6153'], [0.34, 0.46, '#3a342e']]){
        const carx = B.x0 + BL*fx, cary = by0 + BA*fy;
        p('carro', { x0: carx - 19, x1: carx + 19, y0: cary - 21, y1: cary + 21, cor });
      }
      /* mangueira grande num canto e o mato que virou arbusto */
      p('arvore', { x: B.x0 + 46, y: by0 + 84, r: 22 }, false);
      p('arvore', { x: B.x0 + 58, y: by1 - 104, r: 17 }, false);
      p('arvore', { x: B.x1 - 54, y: by0 + BA*0.36, r: 13 }, false);
      p('arvore', { x: B.x1 - 70, y: by1 - 120, r: 11 }, false);
      p('poste', { x: ux(REC + M_ESP + 24), y: (by0 + by1)/2, dx: ofora, dz: 0 }, false);
      /* O QUE SE LÊ DA RUA. Muro de baldio não tem placa: tem tinta —
         `placa: false` pinta o dizer direto no reboco. */
      const pixo = (u, y, ox, oz, texto, larg, px) =>
        p('letreiro', { x: ux(u), y, ox, oz, texto, placa: false, larg, altura: 20, base: 20,
                        tinta: px ? px.alt[px.lado].tinta : undefined, pixo: px }, false);
      pixo(REC, (Y0 + Y1)/2 - 150, -ofora, 0, 'VENDE-SE', 116);
      pixo(REC, (Y0 + Y1)/2 + 130, -ofora, 0, 'ALUGA-SE', 116);
      pixo(uL0*0.22, Y0 + REC, 0, -1, 'É PROIBIDO JOGAR LIXO', 150);
      /* O MURO GRANDE DO BALDIO é o melhor pedaço de parede do bairro:
         alto, comprido e de frente pra rua. Ali a pixação é de torcida,
         e dá pra cobrir a do rival como em qualquer muro. */
      const alvoPix = { cx: ux(uL0*0.62), cy: Y1 - REC };
      pixar(alvoPix, escolher(RECADOS), true);
      pixo(uL0*0.62, alvoPix.cy, 0, 1, alvoPix.pixacao, 150, alvoPix.pixo);
    }

    return { tipo, chao, pecas, area, ...extra };
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
  function areaDaSede(q, frente, nivel){
    const Lx = q.ix1 - q.ix0, Ly = q.iy1 - q.iy0;
    /* A SEDE NÍVEL 1 NÃO PEGA O QUARTEIRÃO DE PONTA A PONTA. Ela é um
       barracão de 11,2 × 8,1 m encostado na guia, e o resto do
       quarteirão continua sendo casa — é essa diferença de FATIA, e
       não só de mobília, que faz ela ler como sede pequena. */
    if(nivel === 1){
      const LF = 250, PR = 180;
      if(frente === 'n' || frente === 's'){
        if(Lx < LF + 40 || Ly < PR + 30) return null;
        return frente === 'n' ? { x0: q.ix0, x1: q.ix0 + LF, y0: q.iy0, y1: q.iy0 + PR }
                              : { x0: q.ix0, x1: q.ix0 + LF, y0: q.iy1 - PR, y1: q.iy1 };
      }
      if(Lx < PR + 30 || Ly < LF + 40) return null;
      return frente === 'o' ? { x0: q.ix0, x1: q.ix0 + PR, y0: q.iy0, y1: q.iy0 + LF }
                            : { x0: q.ix1 - PR, x1: q.ix1, y0: q.iy0, y1: q.iy0 + LF };
    }
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
  /* =========================================================
     OBRA: a caixa de ferramentas de um prédio com cômodos
     ---------------------------------------------------------
     Eixo local, peça, parede com vão, folha de porta e placa de
     sala. A SEDE usa e o BAR usa — e o que vier depois usa também.
     É aqui que mora a regra de que a porta abre pra dentro do cômodo
     e a placa fica do lado de fora dele, e ela vale uma vez só: sem
     isto, cada prédio novo trazia a sua cópia da mesma sutileza pra
     sair errada de um jeito diferente.

     `cor2` é a cor da chapa da placa de sala — a segunda cor da
     torcida dona do prédio. `lado` marca de quem é a peça. */
  function obra(area, frente, cor2, lado){
    const E = eixos(area, frente), L = E.L, A = E.A;
    /* O METRO, pra mobília sair do tamanho do BONECO e não do gosto.
       Ele tem 34 unidades pra 1,75 m, então 1 m ≈ 19,4. Escrito assim
       (`m(0.75)` é a altura de uma mesa) o número fica conferível: a
       primeira leva de móveis foi chutada em unidade e saiu 1,8 vez
       maior que o certo — cadeira com assento na altura do quadril,
       mesa na altura do peito, TV de três metros. */
    const m = v => Math.round(v * METRO);
    const pecas = [];
      const p = (k, o, bloqueia) => pecas.push(Object.assign({ k, bloqueia: bloqueia !== false }, o));
      const par  = (u0,u1,v0,v1, alt, cor) => p('muro', Object.assign(E.ret(u0,u1,v0,v1), { alt, cor }));
      const piso = (u0,u1,v0,v1, cor, base) => p('piso', Object.assign(E.ret(u0,u1,v0,v1), { cor, base: base || 1.72 }), false);
      const faixa = (u0,u1,v0,v1, y, alt, cor) => p('marquise', Object.assign(E.ret(u0,u1,v0,v1), { y, alt, cor }), false);

      const VAO = 30;       // porta: 1,54 m — o mínimo que passa corpo com folga
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
      /* ---- A FOLHA DA PORTA NO VÃO ----
         O vão já existia: `comVaos` abre o buraco na parede e o corpo
         passa por ele. O que entra agora é a FOLHA, que gira na
         dobradiça — VIDRO na da rua (porta de comércio, que é o que
         sede de torcida põe na fachada) e MADEIRA nas de dentro.

         ELA NÃO BLOQUEIA, nem fechada, e isso é decisão, não esquecimento:
         a máscara e os campos de fluxo dos quatro spawns saem prontos na
         carga. Porta que fecha de verdade pediria recalcular os dois a
         cada giro, e o bonde que já estava a caminho ficaria com a rota
         velha, atravessando a folha ou empacando na frente dela.

         `ang0` e `ang1` são o giro do three.js (em torno de Y) com a
         folha FECHADA e ABERTA. O +X local da folha aponta pro mundo em
         `(dx, dz)`, e o `rotation.y` que faz isso é `atan2(-dz, dx)` —
         o menos é porque o z do three cresce pro lado contrário do
         ângulo de rotação.

         PORTA LARGA É DE DUAS FOLHAS. Uma folha de 2,5 m girando
         sozinha não existe: a da fachada parte no meio, cada metade na
         sua dobradiça, as duas abrindo pro mesmo lado. */
      const ALT_PORTA = Math.round(2.10*METRO);   // 41: folha de 2,10 m
    /* A LARGURA DA PORTA É A ÚNICA MEDIDA QUE NÃO PODE SER REAL.
       Uma folha de 0,80 m daria 16 unidades, e a máscara exige 24 pro
       corpo passar (o corpo do motor de luta é largo demais pra
       escala do desenho — é a calibragem que o §9 chama de "boneco de
       mesa"). 30 é o meio-termo: passa o corpo e para de parecer
       portão de garagem, que é o que 40 parecia ao lado do boneco. */
      function folhasNoVao(ao, c, outro, w, altParede, opc, espessura){
        const alt = Math.min(altParede - 4, ALT_PORTA);
        if(alt < 20) return;
        const vidro = !!(opc && opc.vidro), sentido = (opc && opc.abre) || 1;
        const [dx, dz] = ao === 'u' ? dir(1, 0) : dir(0, 1);
        const [ax, az] = ao === 'u' ? dir(0, sentido) : dir(sentido, 0);
        const duas = w > 44;
        for(const s of duas ? [1, -1] : [1]){
          const off = s > 0 ? c - w/2 : c + w/2;
          const [hx, hy] = ao === 'u' ? E.pt(off, outro) : E.pt(outro, off);
          p('porta', { x: hx, y: hy, larg: duas ? w/2 : w, alt, vidro, lado,
                       ang0: Math.atan2(-dz*s, dx*s), ang1: Math.atan2(-az, ax) }, false);
        }
        /* ---- A PLACA DA SALA, na verga ----
           Quem passa no corredor tem de saber o que é cada porta. A
           placa vai do LADO DE FORA do cômodo — a folha abre pra dentro
           (`sentido`), então quem lê está no lado contrário, e é pra lá
           que a normal aponta. Sem isso a placa sairia dentro da sala,
           de costas pra quem chega.

           Ela cabe na verga e só: a altura é o que sobrou entre a folha
           e o teto do cômodo, e a largura vem dela pela proporção da
           célula do atlas (256 × 64). Placa maior que a verga
           atravessaria a parede por cima. */
        if(!opc || !opc.nome) return;
        const hPlaca = Math.min(9, altParede - alt - 3);
        if(hPlaca < 4) return;
        const lPlaca = Math.min(hPlaca*4.2, w + 10);
        const [px, py] = ao === 'u' ? E.pt(c, sentido > 0 ? espessura[0] : espessura[1])
                                    : E.pt(sentido > 0 ? espessura[0] : espessura[1], c);
        const [nx, nz] = ao === 'u' ? dir(0, -sentido) : dir(-sentido, 0);
        p('letreiro', { x: px, y: py, ox: nx, oz: nz, texto: opc.nome,
                        larg: lPlaca, altura: hPlaca, base: alt + 1.5,
                        fundo: cor2, tinta: corLegivel(cor2) }, false);
      }
      /* `opc.nome` vale por VÃO: string quando há um só, lista quando a
         parede abre mais de um — a ordem é a de `em`, que é a mesma em
         que os vãos foram pedidos. */
      const nomeDoVao = (opc, i) =>
        Array.isArray(opc.nome) ? opc.nome[i] : (i === 0 ? opc.nome : null);
      const porVaos = (ao, em, outro, larg, alt, cor, opc, espessura) => {
        const lista = [].concat(em === undefined ? [] : em);
        lista.forEach((c, i) => folhasNoVao(ao, c, outro, larg || VAO, alt,
          Object.assign({}, opc, { nome: nomeDoVao(opc, i) }), espessura));
      };
      const paredeU = (u0,u1,v0,v1, alt, cor, em, larg, opc) => {
        for(const [a, b] of comVaos(u0, u1, em, larg)) par(a, b, v0, v1, alt, cor);
        if(opc) porVaos('u', em, (v0 + v1)/2, larg, alt, cor, opc, [v0, v1]);
      };
      const paredeV = (u0,u1,v0,v1, alt, cor, em, larg, opc) => {
        for(const [a, b] of comVaos(v0, v1, em, larg)) par(u0, u1, a, b, alt, cor);
        if(opc) porVaos('v', em, (u0 + u1)/2, larg, alt, cor, opc, [u0, u1]);
      };

      /* a direção no MUNDO pra onde aponta um vetor do eixo local: é o
         que o móvel precisa pra saber de que lado fica a frente dele */
      const [e0x, e0y] = E.pt(0, 0), [eux, euy] = E.pt(1, 0), [evx, evy] = E.pt(0, 1);
      const dir = (du, dv) => [(eux - e0x)*du + (evx - e0x)*dv,
                               (euy - e0y)*du + (evy - e0y)*dv];
      const movel = (k, u0, u1, v0, v1, o, bloqueia) =>
        p(k, Object.assign(E.ret(u0, u1, v0, v1), o || {}), bloqueia);
    return { E, L, A, m, pecas, p, par, piso, faixa, movel, dir,
             paredeU, paredeV, folhasNoVao, comVaos, VAO, PORTAO, ALT_PORTA };
  }

  function sedeDaTorcida(lado, q, area, frente, nivel){
    const N = nivel === 1 ? 1 : 3;
    const T = SEDES[lado].torcida;
    const E = eixos(area, frente), L = E.L, A = E.A;
    const cor1 = T.cor || '#b02a22';
    const cor2 = T.cor2 || '#e8e2d0';
    const cor3 = T.cor3 || cor2;
    const CLARO = '#d9d3c4';                 // o reboco dos cômodos, por dentro
    const O = obra(area, frente, cor2, lado);
    const { pecas, p, par, piso, faixa, movel, dir,
            paredeU, paredeV, VAO, PORTAO, m } = O;
    const PAR = 9;        // parede interna: 40 cm
    /* A SEDE TEM ALTURA DE CASA, não de galpão de fábrica: a fachada
       bate com o sobrado do lado e o telhado fica por baixo da linha
       do bairro. Era 86/74/66 e lia como um armazém no meio da rua. */
    const MURO = N === 1 ? 66 : 74;      // a fachada da rua, que é platibanda
    const ALT_EXT = N === 1 ? 60 : 66;   // as paredes de fora, que seguram o telhado
    /* A PAREDE DE CÔMODO SUBIU pra caber a PLACA em cima da porta.
       Era 48 (2,16 m) com folha de 46: sobravam 2 de verga, e placa
       nenhuma cabe em 2. Com 56 sobram 10, que é onde a placa mora —
       e de quebra o pé-direito virou 2,52 m, que é medida de cômodo
       de verdade; 2,16 já era baixo demais pro boneco de 1,75. */
    const ALT = m(N === 1 ? 2.60 : 2.75);  // parede de cômodo, abaixo do telhado
    const MF = 13;                                   // espessura da fachada
    const DF = Math.min(96, Math.max(58, A*0.30));   // ala da frente (nível 3)
    const DB = Math.min(104, Math.max(60, A*0.32));  // ala do fundo  (nível 3)
    const vF = MF + DF, vB = A - DB;                 // fim da ala da frente, início da do fundo
    const uDiv = Math.round(L*0.58);                 // nível 1: onde o pátio acaba
    /* ONDE FICA O PORTÃO. No nível 3 ele parte a fachada no meio e o
       corredor atravessa até o salão. No nível 1 ele tem de dar NO
       PÁTIO, que é a metade esquerda — no meio da fachada ele abriria
       dentro da sala de patrimônio. */
    const eixo = N === 1 ? (PAR + uDiv)/2 : L/2;
    const g0 = eixo - PORTAO/2, g1 = eixo + PORTAO/2;


    /* ---- A FACHADA: a cor primária dá pra rua ----
       Nada sai do miolo do quarteirão: a parede recua 2,5 e o rodapé,
       a faixa e os batentes ocupam esse recuo em vez de avançar pra
       calçada, que é a regra que vale pra casa e vale pra sede. */
    const F0 = 2.5;
    /* A PORTA DA RUA É DE VIDRO, nos dois níveis: porta de comércio,
       duas folhas, abrindo pra dentro (`abre: 1` é o sentido de `+v`,
       que entra na sede). */
    paredeU(0, L, F0, MF, MURO, cor1, eixo, PORTAO, { vidro: true, abre: 1 });
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
    const ux = p1x - p0x, uy = p1y - p0y, vm = N === 1 ? A/2 : (vF + vB)/2;
    for(const [uu, sx, sy] of [[VESC, -ux, -uy], [L - VESC, ux, uy]]){
      const [sxx, syy] = E.pt(uu, vm);
      escudoDaTorcida(sxx, syy, sx, sy, 0.8);
    }
    /* os batentes do portão, na terceira cor */
    for(const u of [g0, g1]) par(u - 4, u + 4, 0, MF + 1, MURO, cor3);

    /* ---- O MIOLO NÍVEL 3: salão, ala da frente e ala do fundo ---- */
    function mioloNivel3(){
      /* ---- o chão: cimento no pátio, e o salão pintado ---- */
      piso(0, L, 0, A, '#a8a396', 1.70);
      piso(PAR, L - PAR, vF, vB, '#b7b2a4', 1.74);
      /* a faixa da torcida no piso do salão: duas listras finas, que
         larga demais o piso vira bandeira e come o pátio */
      const mS = (vF + vB)/2;
      piso(PAR + 26, L - PAR - 26, mS - 15, mS - 5, cor2, 1.78);
      piso(PAR + 26, L - PAR - 26, mS + 5, mS + 15, cor3, 1.78);
    /* ---- ALA DA FRENTE: secretaria, bar, banheiro ----
         O corredor do portão atravessa ela e desemboca no salão. */
      par(0, PAR, 0, A, ALT_EXT, cor1);           // parede lateral oeste
      par(L - PAR, L, 0, A, ALT_EXT, cor1);       // parede lateral leste
      par(g0 - PAR, g0, MF, vF, ALT, CLARO);      // as paredes do corredor
      par(g1, g1 + PAR, MF, vF, ALT, CLARO);
      let iF = 0;
      for(const [a, b] of [[PAR, g0 - PAR], [g1 + PAR, L - PAR]]){
        if(b - a < 70) continue;
        const parte = b - a > 150;                       // dá dois cômodos
        /* a porta de cada cômodo pro salão — nunca em cima da divisória */
        /* os cômodos da ala da frente, na ordem em que o laço os abre:
           dois de cada lado do corredor quando o trecho é largo, um
           quando não é */
        const nomesF = lado === 'mandante' ? ['SECRETARIA', 'BAR', 'BANHEIRO', 'ALMOXARIFADO']
                                           : ['SECRETARIA', 'BANHEIRO', 'BAR', 'ALMOXARIFADO'];
        paredeU(a, b, vF - PAR, vF, ALT, CLARO,
                parte ? [a + (b-a)*0.25, a + (b-a)*0.75] : (a + b)/2,
                VAO, { abre: -1, nome: parte ? [nomesF[iF], nomesF[iF+1]] : [nomesF[iF]] });
        iF += parte ? 2 : 1;               // madeira, abrindo pra dentro do cômodo
        if(parte) par((a + b)/2 - PAR/2, (a + b)/2 + PAR/2, MF, vF - PAR, ALT, CLARO);
      }

      /* ---- ALA DO FUNDO: alojamento, diretoria e o depósito ---- */
      par(PAR, L - PAR, A - PAR, A, ALT_EXT, cor1);   // a parede dos fundos
      const n = L > 400 ? 3 : 2, passo = (L - 2*PAR)/n;
      for(let i = 0; i < n; i++){
        const a = PAR + i*passo, b = a + passo;
        /* o nome bate com o que há DENTRO de cada um: o primeiro é o
           alojamento (colchão), o último o depósito (armário e
           troféus) e o do meio a diretoria (mesa e cadeira) */
        const nomeF = i === 0 ? 'ALOJAMENTO' : i === n - 1 ? 'DEPÓSITO' : 'DIRETORIA';
        paredeU(a, b, vB, vB + PAR, ALT, CLARO, (a + b)/2, VAO,
                { abre: 1, nome: nomeF });                       // a porta pro salão
        if(i) par(a - PAR/2, a + PAR/2, vB, A - PAR, ALT, CLARO);  // a divisória
        /* O QUE HÁ DENTRO DE CADA CÔMODO. Eram três caixas vazias: de
           dentro da sede via-se parede e mais nada. O primeiro é o
           ALOJAMENTO (colchão no chão, como no pátio do nível 1), o
           último é o DEPÓSITO (armário e troféus) e o do meio é a
           DIRETORIA (mesa e cadeira). */
        const vq0 = vB + PAR + 4, vq1 = A - PAR - 4;
        if(i === 0){
          for(let k = 0; k < 2; k++){
            const u0 = a + 12 + k*26;
            if(u0 + 22 > b - 8) break;
            movel('colchao', u0, u0 + m(0.90), vq1 - 4 - m(1.90), vq1 - 4, { ox: 0, oz: 0 }, false);
          }
        } else if(i === n - 1){
          movel('armario', b - 8 - m(0.45), b - 8, vq0, vq0 + m(1.00),
                { alt: m(2.00), ox: dir(-1, 0)[0], oz: dir(-1, 0)[1] });
          movel('trofeus', b - 6 - m(0.40), b - 10, vq0 + 2, vq0 + m(0.95),
                { base: m(2.00) + 1.6, n: 3 }, false);
        } else {
          movel('mesa', a + 14, a + 14 + m(1.40), vq1 - 8 - m(0.70), vq1 - 8, { alt: m(0.75) });
          const [cx, cy] = E.pt(a + 40, vq1 - 44);
          const rc3 = m(0.30);
          p('cadeira', { x0: cx - rc3, x1: cx + rc3, y0: cy - rc3, y1: cy + rc3,
                         ang: Math.atan2(dir(0, 1)[1], dir(0, 1)[0]) }, false);
        }
      }

      /* ---- o que vive no salão ----
         Poste e árvore saíram: a sede é COBERTA, e luminária de rua e pé
         de árvore dentro de galpão não existem. Ficam os bancos e o
         mastro, que sobe pela frente e passa do telhado, como o de
         sede de verdade. */
      const [mx, my] = E.pt(L - 54, MF + 26);
      /* O MASTRO leva a bandeira da torcida, com o escudo dela no pano.
         `dir` é pra que lado o pano estende: pro lado de fora da sede,
         que é de onde a rua vê. */
      /* o pano estende AO LONGO da fachada, não pra fora dela: assim
         quem olha da rua vê a bandeira de lado inteiro, e não de perfil.
         É a normal girada de 90°. (E aqui não cabe `-E.ox || 1`: menos
         zero é FALSO em JavaScript, e a bandeira saía na diagonal.) */
      p('mastro', { x: mx, y: my, alt: 128, cor: cor1, cor2,
                    bandeira: { larg: 54, alt: 27, dirx: -E.oz, dirz: E.ox,
                                texto: T.rot, corTexto: corQueLeSobre(cor1, [cor2, cor3]),
                                img: caminhoDoEscudo('t', T.id) } }, false);
      for(const u of [PAR + 46, L - PAR - 46]){
        const r = E.ret(u - 26, u + 26, vF + 16, vF + 26);
        p('banco', r, false);
      }
      /* O TELHADO fica FORA da lista de peças: ele sai numa malha só
         dele, que a cena esconde quando o jogador entra — é o corte que
         deixa a planta à vista de dentro e o galpão fechado de fora. */
    }
    /* ---- O MIOLO NÍVEL 1: pátio, patrimônio e a sala do presidente ----
       Um barracão de três compartimentos, como o da foto: o PÁTIO
       descoberto tomando a metade esquerda de ponta a ponta, e a
       metade direita partida em duas salas. Cada sala abre pro pátio
       pela sua própria porta — entre elas a parede é cega, como na
       foto. Assim nenhum cômodo depende do outro pra ser alcançado,
       que é o que já muralhou cômodo nesta cena antes.

       O PÁTIO NÃO TEM TELHADO. É ele que faz a sede pequena ler como
       sede pequena: de cima vê-se o chão de cimento, o colchão e a
       caixa d'água, sem precisar esconder malha nenhuma. */
    function mioloNivel1(){
      const vDiv = MF + Math.round((A - MF - PAR)*0.46);
      const uP0 = PAR, uP1 = uDiv;                    // o pátio, em u
      const uS0 = uDiv + PAR, uS1 = L - PAR;          // as salas, em u
      const vPa0 = MF, vPa1 = vDiv;                   // patrimônio (frente)
      const vPr0 = vDiv + PAR, vPr1 = A - PAR;        // presidente (fundo)

      /* ---- os chãos ---- */
      piso(0, L, 0, A, '#a8a396', 1.70);                       // cimento queimado
      piso(uS0, uS1, vPa0, vPa1, '#c4c0b3', 1.74);             // piso frio nas salas
      piso(uS0, uS1, vPr0, vPr1, '#c8c3b6', 1.74);
      /* a faixa da torcida no cimento do pátio, no fundo — longe do
         caminho do portão, que é por onde o bonde entra em fila */
      piso(uP0 + 10, uP1 - 10, vPr1 - 20, vPr1 - 13, cor2, 1.78);
      piso(uP0 + 10, uP1 - 10, vPr1 - 11, vPr1 - 4, cor3, 1.78);

      /* ---- as paredes ---- */
      par(0, PAR, 0, A, ALT_EXT, cor1);                 // lateral oeste
      par(L - PAR, L, 0, A, ALT_EXT, cor1);             // lateral leste
      par(PAR, L - PAR, A - PAR, A, ALT_EXT, cor1);     // fundos
      /* as duas portas do pátio pras salas, cada uma com a sua placa.
         `paredeV` abre os dois vãos na mesma parede, então a placa de
         cada um vem da lista — a ordem é a dos vãos. */
      paredeV(uDiv, uS0, MF, A - PAR, ALT, CLARO,       // pátio | salas: uma porta pra cada
              [(vPa0 + vPa1)/2, (vPr0 + vPr1)/2], VAO,
              { abre: 1, nome: ['PATRIMÔNIO', 'PRESIDÊNCIA'] });
      par(uS0, uS1, vDiv, vPr0, ALT, CLARO);            // entre as duas salas, cega

      /* ---- O PÁTIO: onde o aliado dorme ----
         Três colchões no chão encostados na parede oeste, com o
         comprimento entrando no pátio como na foto — quem dorme fica
         fora do caminho de quem entra pelo portão. Não bloqueiam: o
         aliado deita EM CIMA deles. */
      const oL = dir(1, 0);
      for(let i = 0; i < 3; i++){
        const v = MF + 20 + i*34;
        if(v + 20 > vPr1 - 26) break;
        movel('colchao', uP0 + 4, uP0 + 4 + m(1.90), v, v + m(0.90), { ox: oL[0], oz: oL[1] }, false);
      }
      /* a caixa d'água de plástico no canto do fundo, que é onde ela
         fica em sede de bairro: perto da parede e longe do portão */
      const [cdx, cdy] = E.pt(uP0 + 20, vPr1 - 22);
      p('caixadagua', { x: cdx, y: cdy, r: m(0.52), alt: 0 });
      /* o ralo no meio do cimento — pátio de verdade tem caimento */
      const [rlx, rly] = E.pt((uP0 + uP1)/2, (MF + vPr1)/2);
      p('ralo', { x: rlx, y: rly, r: m(0.16) }, false);
      /* a grade de correr, RECOLHIDA na parede ao lado da porta de
         vidro: é o que a loja fecha depois do expediente, e com a
         porta de vidro no vão ela não pode ficar no meio dele */
      movel('portao', g1 + 6, g1 + 6 + Math.min(44, uP1 - g1 - 12), MF - 5, MF - 1,
            { alt: MURO - m(0.6), cor: cor3 }, false);
      /* o entulho do pátio: caixa de material largada perto da porta */
      movel('caixote', uP1 - 8 - m(0.45), uP1 - 8, MF + 8, MF + 8 + m(0.45), { alt: m(0.45) }, false);
      movel('caixote', uP1 - 12 - m(0.34), uP1 - 12, MF + 28, MF + 28 + m(0.34), { alt: m(0.34) }, false);

      /* ---- A SALA DE PATRIMÔNIO: o armário do material e os troféus ----
         É o cômodo da frente, junto da rua: é por onde entra e sai
         bandeira, instrumento e material de viagem. */
      const oOeste = dir(-1, 0), oFundo = dir(0, 1);
      movel('armario', uS1 - 2 - m(0.45), uS1 - 2, vPa0 + 6, vPa1 - 6,
            { alt: m(2.00), ox: oOeste[0], oz: oOeste[1] });
      movel('trofeus', uS1 - 4 - m(0.40), uS1 - 4, vPa0 + 8, vPa1 - 8,
            { base: m(2.00) + 1.6, n: 4 }, false);
      movel('estante', uS0 + 4, uS1 - 28, vPa0 + 2, vPa0 + 2 + m(0.38),
            { alt: m(1.90), prateleiras: 4, ox: oFundo[0], oz: oFundo[1] });
      movel('caixote', uS0 + 6, uS0 + 6 + m(0.48), vPa1 - 6 - m(0.48), vPa1 - 6, { alt: m(0.48) }, false);
      movel('caixote', uS0 + 26, uS0 + 26 + m(0.34), vPa1 - 8 - m(0.34), vPa1 - 8, { alt: m(0.34) }, false);

      /* ---- A SALA DO PRESIDENTE ----
         A MESA ENCOSTADA NAS DUAS PAREDES DO CANTO, e não solta no
         meio: mesa com folga atrás dela abre um bolsão de 21 entre o
         tampo e a parede — largo demais pra sumir, estreito demais pro
         corpo passar (ele pede 24). Foram três células presas na
         primeira montagem. No canto não sobra fundo nenhum. Pelo mesmo
         motivo o armário encosta na mesa em vez de ficar do outro
         lado dela, que é o que fechava a volta. */
      const oFrente = dir(0, -1);
      movel('armario', uS0 + 4, uS0 + 4 + m(1.20), vPr1 - 2 - m(0.45), vPr1 - 2,
            { alt: m(1.80), ox: oFrente[0], oz: oFrente[1] });
      movel('mesa', uS0 + 8 + m(1.20), uS1 - 4, vPr1 - 4 - m(0.70), vPr1 - 4, { alt: m(0.75) });
      const [cdrx, cdry] = E.pt(uS1 - 4 - m(0.70), vPr1 - 4 - m(0.70) - m(0.55));
      const rcP = m(0.30);
      p('cadeira', { x0: cdrx - rcP, x1: cdrx + rcP, y0: cdry - rcP, y1: cdry + rcP,
                     ang: Math.atan2(oFundo[1], oFundo[0]) }, false);
      /* o ar-condicionado a 2,15 do chão e o mural a 1,40, que é a
         altura de quem lê em pé */
      movel('ar', uS1 - 10 - m(0.85), uS1 - 10, A - PAR - 3, A - PAR,
            { base: m(2.15), alt: m(0.30), ox: oFrente[0], oz: oFrente[1] }, false);
      movel('mural', uS0 + 26, uS0 + 26 + m(1.00), vPr0 + 1, vPr0 + 3,
            { base: m(1.40), alt: m(0.70), ox: oFundo[0], oz: oFundo[1] }, false);

      /* o mastro sobe do pátio, que é a parte descoberta — no nível 3
         ele nasce dentro da ala da frente e fura o telhado, aqui não
         precisa furar nada */
      const [mx, my] = E.pt(uP1 - 16, MF + 20);
      p('mastro', { x: mx, y: my, alt: 112, cor: cor1, cor2,
                    bandeira: { larg: 46, alt: 23, dirx: -E.oz, dirz: E.ox,
                                texto: T.rot, corTexto: corQueLeSobre(cor1, [cor2, cor3]),
                                img: caminhoDoEscudo('t', T.id) } }, false);
      const b = E.ret(uP0 + 8, uP0 + 52, vPr1 - 34, vPr1 - 24);
      p('banco', b, false);
    }

    if(N === 1) mioloNivel1(); else mioloNivel3();

    /* O TELHADO cobre SÓ AS SALAS no nível 1 — o pátio é descoberto —
       e a sede inteira no nível 3. Ele sai numa malha só dele, que a
       cena esconde quando o jogador entra. */
    const teto = N === 1
      ? Object.assign({ base: ALT_EXT, queda: 10, cor: '#7c8285', caixas: 0 },
                      { area: E.ret(uDiv, L, 0, A) })
      : { base: ALT_EXT, queda: 15, cor: '#7c8285' };
    return { tipo: 'sede', lado, nivel: N, torcida: T, frente, chao: '#a8a396', pecas, area, teto };
  }

  /* =========================================================
     O BAR DA TORCIDA
     ---------------------------------------------------------
     Fiel à foto de referência, mas APERTADO: o dono pediu a largura
     valendo metade da profundidade, então o salão que na foto é
     quase quadrado aqui vira um corredor. É 116 × 232 — 5,2 × 10,4 m.

     Por que 232 de fundo e não mais: o miolo de um quarteirão tem uns
     249 no sentido curto. Um bar mais fundo que isso só entraria nas
     quadras viradas pro norte-sul, e a torcida ficaria sem bar se o
     quarteirão perto dela fosse do outro jeito.

     A planta, do sul (a porta) pro norte:

       oeste     faixa de serviço, o balcão em L e o engradado de
                 cerveja no canto sudoeste
       meio      o salão, com três mesas de quatro cadeiras
       norte     os dois freezers, e a TV passando futebol em cima
       nordeste  o banheiro

     O BANHEIRO É DE PROPÓSITO PEQUENO DEMAIS PRO CORPO. O dono disse
     que o jogador não entra nele; em vez de fingir com um bloco
     maciço (e a folha da porta batendo numa parede cheia), ele é um
     cubículo de verdade com 20 × 28 de vão livre. O corpo pede 24,
     então ninguém entra — e, o que importa pra máscara, ninguém fica
     PRESO lá dentro, que é o que um cômodo grande e sem saída faria.
     ========================================================= */
  function barDaTorcida(lado, area, frente){
    const T = SEDES[lado].torcida;
    const cor1 = T.cor || '#b02a22';
    const cor2 = T.cor2 || '#e8e2d0';
    const cor3 = T.cor3 || cor2;
    const O = obra(area, frente, cor2, lado);
    const { pecas, p, par, piso, faixa, movel, dir, paredeU, paredeV, VAO, m } = O;
    const E = O.E, L = O.L, A = O.A;
    const PAR = 8, MF = 11;
    /* pé-direito de 2,60 m, parede externa de 2,90 e platibanda de 3,20 */
    const MURO = m(3.20), ALT_EXT = m(2.90), ALT = m(2.60);
    const CLARO = '#dcd6c6';
    const AZULEJO = '#5b7fa8', CREME = '#ddd6c2';   // o xadrez do piso
    const uPorta = Math.round(L*0.66), wPorta = 56;

    /* ---- o chão: xadrez de ladrilho, como na foto ----
       Ele é UMA peça, não mil: o 3D desenha só os ladrilhos escuros
       por cima de um piso claro, que é metade da geometria pelo mesmo
       desenho. A 1,76 o ladrilho caía DENTRO da caixa do `piso` (que
       vai de 1,70 a 1,85) e o xadrez existia sem aparecer; fica acima
       do topo dela. */
    piso(0, L, 0, A, CREME, 1.70);
    movel('xadrez', PAR, L - PAR, MF, A - PAR,
          { cor: AZULEJO, tam: m(0.42), base: 1.92 }, false);

    /* ---- as paredes ---- */
    paredeU(0, L, 2.5, MF, MURO, cor1, uPorta, wPorta, { vidro: true, abre: 1 });
    par(0, PAR, 0, A, ALT_EXT, cor1);                  // oeste
    par(L - PAR, L, 0, A, ALT_EXT, cor1);              // leste
    par(PAR, L - PAR, A - PAR, A, ALT_EXT, cor1);      // norte
    faixa(0, L, 0, MF + 1, 4, 10, cor3);
    faixa(0, L, 0, MF + 1, MURO - 18, 11, cor2);
    const [lx, ly] = E.pt(Math.round(L*0.28), 1);
    p('letreiro', { x: lx, y: ly, ox: E.ox, oz: E.oz, texto: 'BAR DO ' + (T.rot || 'BONDE'),
                    larg: Math.min(L*0.42, 120), altura: Math.min(L*0.42, 120)/4.2, base: 22,
                    fundo: cor2, tinta: corLegivel(cor2) }, false);

    /* ---- O BANHEIRO, no nordeste ----
       A PORTA DÁ PRO SUL. A folha é menor que o vão da parede de
       propósito: com a folha do tamanho dela o `comVaos` descartava as
       sobras (que ficam abaixo de 3) e o banheiro saía sem parede. */
    const bU0 = L - PAR - 58, bV0 = A - PAR - 62;
    par(bU0, bU0 + PAR, bV0, A - PAR, ALT, CLARO);              // a parede oeste dele
    paredeU(bU0 + PAR, L - PAR, bV0, bV0 + PAR, ALT, CLARO,     // a do sul, com a porta
            (bU0 + PAR + L - PAR)/2, VAO, { abre: 1, nome: 'BANHEIRO' });

    /* ---- O BALCÃO EM L, no oeste, E O LADO DE DENTRO DELE ----
       A faixa de serviço tem 38 de vão: o corpo pede 24, então dá pra
       ENTRAR no balcão e ficar atrás dele, que era o pedido. Ela fecha
       ao sul pelo pé do L e a leste pelo braço comprido, e fica aberta
       ao norte — é por ali que o dono do bar entra, como no balcão de
       verdade. */
    const uServ = PAR + 38;                 // até onde vai a faixa de serviço
    const uBal = uServ + m(0.62);           // a face do balcão que dá pro salão
    const vBal0 = MF + 50, vBal1 = A - PAR - 70;
    movel('balcao', uServ, uBal, vBal0 + 22, vBal1, { alt: m(1.10), ox: dir(1,0)[0], oz: dir(1,0)[1] });
    movel('balcao', PAR, uBal, vBal0, vBal0 + 22, { alt: m(1.10), ox: dir(0,-1)[0], oz: dir(0,-1)[1] });

    /* ---- O ARMÁRIO DO BALCÃO, com as garrafas ----
       Encostado na parede oeste, DENTRO da faixa de serviço: é o que o
       dono do bar alcança sem sair de trás do balcão. Duas prateleiras
       de garrafa em cima do armário — uísque, cachaça e cerveja, que é
       o que tem atrás de um balcão de bar de torcida. */
    movel('armario', PAR + 1, PAR + 1 + m(0.45), vBal0 + 30, vBal1 - 30,
          { alt: m(0.85), ox: dir(1,0)[0], oz: dir(1,0)[1] });
    /* as duas prateleiras de garrafa, a 1,05 e a 1,45 do chão */
    for(const yG of [m(1.05), m(1.45)]){
      movel('prateleira', PAR + 1, PAR + 2 + m(0.40), vBal0 + 30, vBal1 - 30,
            { base: yG - 2, cor: '#6b4a2c' }, false);
      movel('garrafas', PAR + 2, PAR + 2 + m(0.30), vBal0 + 32, vBal1 - 32,
            { base: yG, n: 10, alt: m(0.30) }, false);
    }

    /* ---- AS BANQUETAS, em volta do balcão ----
       Do LADO DO FREGUÊS, que é o de fora do L: a leste do braço
       comprido e ao sul do pé dele. Não bloqueiam, pela mesma razão
       da cadeira de plástico — uma fila delas encostada no balcão
       fecharia o corredor que leva ao fundo do bar, e banqueta se
       empurra com a perna. */
    const rB = m(0.19);                   // meia banqueta: 38 cm de assento
    for(let v = vBal0 + 28; v < vBal1 - 8; v += m(1.05))
      movel('banqueta', uBal + 6, uBal + 6 + rB*2, v - rB, v + rB, { alt: m(0.75) }, false);
    for(let u = PAR + 14; u < uBal - 8; u += m(1.05))
      movel('banqueta', u - rB, u + rB, vBal0 - 6 - rB*2, vBal0 - 6, { alt: m(0.75) }, false);

    /* ---- O ENGRADADO DE CERVEJA, no sudoeste ---- */
    const cE = m(0.40);                   // o engradado tem 40 cm de lado
    movel('engradado', PAR + 3, PAR + 3 + cE, MF + 6, MF + 6 + cE, { pilha: 4 });
    movel('engradado', PAR + 3, PAR + 3 + cE, MF + 9 + cE, MF + 9 + cE*2, { pilha: 3 });
    movel('engradado', PAR + 6 + cE, PAR + 6 + cE*2, MF + 6, MF + 6 + cE, { pilha: 3 });

    /* ---- OS DOIS FREEZERS na parede norte, e a TV em cima ----
       ENCOSTADOS nela: com folga atrás sobra um corredor estreito
       demais pro corpo e largo demais pra sumir, que é a receita de
       célula presa. */
    const fL = m(1.30), fP = m(0.68);     // freezer horizontal de 1,30 × 0,68
    const vFrz = A - PAR - fP;
    for(const u0 of [PAR + 8, PAR + 12 + fL]){
      movel('freezer', u0, u0 + fL, vFrz, A - PAR,
            { alt: m(0.88), ox: dir(0,-1)[0], oz: dir(0,-1)[1] });
    }
    /* a TV de 1,10 m, pendurada a 1,55 do chão: acima da cabeça de
       quem está sentado e na linha do olho de quem está em pé */
    const uTV = PAR + 10 + fL;
    movel('tv', uTV - m(0.55), uTV + m(0.55), A - PAR - 3, A - PAR,
          { base: m(1.55), alt: m(0.62), ox: dir(0,-1)[0], oz: dir(0,-1)[1] }, false);

    /* ---- AS TRÊS MESAS DO SALÃO ----
       Agora com as QUATRO cadeiras: no bar estreito a quarta batia na
       parede e o conjunto fechava o corredor. Elas ficam na metade
       leste, com o corredor do balcão livre a oeste — é por ele que a
       torcida anda do portão até o fundo.

       A mesa BLOQUEIA e a cadeira NÃO: cadeira de plástico se empurra
       com o pé, e uma fila delas fechando o corredor seria pior que
       qualquer ganho de fidelidade. */
    /* com 320 de fundo as três mesas sobem: a última tem de parar
       antes do banheiro, senão ela tapa a porta dele */
    const uMesa = (uBal + L - PAR)/2 + 22;
    const rM = m(0.40), dC = m(0.72);    // mesa de 80 cm, cadeira a 72 do centro
    for(const vM of [MF + 35, MF + 91, MF + 147]){
      movel('mesabar', uMesa - rM, uMesa + rM, vM - rM, vM + rM, { alt: m(0.75) });
      for(const [du, dv] of [[0, -dC], [0, dC], [-dC, 0], [dC, 0]]){
        const [cx, cy] = E.pt(uMesa + du, vM + dv);
        const [ax, az] = dir(-du, -dv);
        const rC = m(0.25);              // cadeira de 50 cm de lado
        p('cadeiramad', { x0: cx - rC, x1: cx + rC, y0: cy - rC, y1: cy + rC,
                          ang: Math.atan2(-az, ax) }, false);
      }
    }

    return { tipo: 'bar', lado, torcida: T, frente, chao: CREME, pecas, area,
             teto: { base: ALT_EXT, queda: 12, cor: '#7c8285', caixas: 1 } };
  }

  /* A FATIA DO BAR, encostada na guia como a da sede nível 1. */
  /* A FATIA DO BAR: 170 de frente por 270 de fundo — 8,7 × 13,8 m.
     SÓ NAS FACES LESTE E OESTE do quarteirão. O miolo tem uns 595 no
     sentido comprido e 249 no curto: 400 de fundo só cabe no
     comprido, que corre em x. Virado pro norte ou pro sul o bar não
     entraria, e é melhor ele existir numa face certa do que caber
     torto em qualquer uma. */
  function areaDoBar(q, frente){
    const LF = 170, PR = 270;
    const Lx = q.ix1 - q.ix0, Ly = q.iy1 - q.iy0;
    if(frente === 'n' || frente === 's') return null;
    if(Lx < PR + 8 || Ly < LF + 8) return null;
    return frente === 'o' ? { x0: q.ix0, x1: q.ix0 + PR, y0: q.iy1 - LF, y1: q.iy1 }
                          : { x0: q.ix1 - PR, x1: q.ix1, y0: q.iy1 - LF, y1: q.iy1 };
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
        const area = areaDaSede(q, frente, sd.nivel);
        if(!area) continue;
        /* a frente dá pra rua? o ponto logo à frente dela não pode
           cair no miolo do próprio quarteirão */
        const fx = frente === 'o' ? area.x0 - 40 : frente === 'l' ? area.x1 + 40 : (area.x0+area.x1)/2;
        const fy = frente === 'n' ? area.y0 - 40 : frente === 's' ? area.y1 + 40 : (area.y0+area.y1)/2;
        if(dentroPol(fx, fy, q.polMiolo)) continue;
        /* e a avenida não pode CORTAR a fatia: onde a banda dela passa,
           o chão é calçada de avenida e o quarteirão fica com um
           corredor aberto no meio da sede */
        if(tocaAvenida(area, CALC)) continue;
        const eq = sedeDaTorcida(lado, q, area, frente, sd.nivel);
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

  /* ---- O BAR DE CADA TORCIDA ----
     Cada torcida começa com um, então são dois no mapa. Eles escolhem
     DEPOIS das sedes e ANTES dos outros equipamentos: a sede é o que
     a cena precisa pra existir e fica com o quarteirão que quiser; o
     bar quer o quarteirão mais perto DELA que ainda esteja livre, que
     é onde o bonde pararia de verdade antes do jogo.

     A frente tem de dar pra rua — o mesmo teste da sede —, e a fatia
     não pode ser cortada por avenida, senão o chão do bar vira
     calçada de avenida no meio do salão. */
  const BARES = {};
  for(const lado of ['mandante', 'visitante']){
    const sd = sedeDe[lado];
    if(!sd) continue;
    const alvo = [(sd.x0 + sd.x1)/2, (sd.y0 + sd.y1)/2];
    let melhor = null;
    for(const q of QUADRAS){
      if(q.equip) continue;
      const d = Math.hypot(q.cx - alvo[0], q.cy - alvo[1]);
      if(d > 1400) continue;
      for(const frente of ['n', 's', 'o', 'l']){
        const area = areaDoBar(q, frente);
        if(!area) continue;
        const fx = frente === 'o' ? area.x0 - 40 : frente === 'l' ? area.x1 + 40 : (area.x0+area.x1)/2;
        const fy = frente === 'n' ? area.y0 - 40 : frente === 's' ? area.y1 + 40 : (area.y0+area.y1)/2;
        if(dentroPol(fx, fy, q.polMiolo)) continue;
        if(tocaAvenida(area, CALC)) continue;
        if(!melhor || d < melhor.d) melhor = { q, area, frente, d };
        break;
      }
    }
    if(!melhor) continue;
    const eq = barDaTorcida(lado, melhor.area, melhor.frente);
    melhor.q.equip = eq;
    melhor.q.solidos = eq.pecas.filter(o => o.bloqueia);
    BARES[lado] = { x0: melhor.area.x0, x1: melhor.area.x1,
                    y0: melhor.area.y0, y1: melhor.area.y1,
                    frente: melhor.frente, quadra: melhor.q, torcida: eq.torcida };
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
    /* `escolher(RECADOS)` continua saindo do `rng()` compartilhado e
       gastando UM número, como o `escolher(PIXACAO)` de antes: quem
       decide se o muro é de torcida é o `rngPixo`, lá dentro. Trocar
       isso de lugar mudaria o sorteio de tudo o que vem depois. */
    if(l.tipo === 'muro'){ if(rng() < 0.55) pixar(l, escolher(RECADOS)); continue; }
    const r = rng();
    if(r < 0.30) l.placa = escolher(COMERCIO);
    else if(r < 0.54) pixar(l, escolher(RECADOS));
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

  /* a área da favela, DECLARADA AQUI — antes das moitas — pra elas
     nunca nascerem lá dentro. Nascer e depois recortar deixava um
     fantasma no balde espacial: a moita some do desenho (o balde não
     é reconstruído), mas continua bloqueando `naMoita`, e vira parede
     invisível no meio da rua. */
  /* DENTRO DO TABULEIRO. `anda()` só responde dentro de [4, W-4] ×
     [4, H-4] — o que o mapa desenha (`VISTA`) vai bem mais longe que
     isso, mas o que se ANDA para ali. A primeira área que escolhi
     (a oeste, fora do tabuleiro) desenhava certinho e não tinha UMA
     célula andável: o corpo cabia em zero lugar. Esta aqui é a faixa
     de mato livre mais larga que sobra DENTRO do tabuleiro, na beira
     oeste, longe da estrada que a avenida faz por ali (e das casas
     de beira dela) e do campo/baldio ao sul. */
  /* A FAVELA PELA METADE (o dono pediu, pra ganhar triângulo): a área de
     casa é só a metade de baixo da faixa, a de y ≥ 1347 — onde caía a
     metade da área construída —, colada nas quadras da coluna 1 e longe
     da estrada que cortava a de cima. A grade torta continua medida na
     faixa inteira (`FAIXA_FAV`), então a quadra e o beco caem no mesmo
     traçado; a de cima volta a ser mato (moita, trilha). */
  const FAIXA_FAV = { x0:8, x1:1120, y0:90, y1:2700 };
  const AREA_FAV = { x0:8, x1:1120, y0:1347, y1:2700 };
  /* a folga de 48 é porque a casa pode passar um pouco da divisa da
     área (a divisa é contabilidade minha; o que manda de verdade é o
     mato, o asfalto e a borda do tabuleiro) — e moita nenhuma pode
     nascer em cima do que a favela vai ocupar */
  const naAreaFavela = (x, y) => x > AREA_FAV.x0 - 48 && x < AREA_FAV.x1 + 48 &&
                                 y > AREA_FAV.y0 - 48 && y < AREA_FAV.y1 + 48;

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
    if(naAreaFavela(x, y)) continue;                  // ali é favela, não descampado
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
      /* E A RUA DA GRADE TAMBÉM. A avenida estava testada, a rua não:
         numa QUINA de quarteirão o tronco fica na calçada de uma face
         e a copa alcança o asfalto da outra. Passou despercebido
         enquanto o sorteio não pôs árvore naquela quina — o que muda
         a cada vez que a planta mexe no `rng()` compartilhado, e foi
         o que aconteceu ao encolher a fatia da sede nível 1. */
      if(tocaAsfalto(x, y, r + 2)) return;
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

  /* ---- os semáforos, nos cruzamentos PRINCIPAIS ----
     Um poste por esquina de verdade, plantado na guia, com o braço
     estendendo por cima da faixa mais próxima. `ang` é a direção da
     avenida (o sentido de quem dirige); a esquina de qual lado
     plantar é sorteada pela posição, não fixa, senão os postes saíam
     todos do mesmo lado da rua no mapa inteiro.

     O recuo NÃO é só `avLarg/2 + folga`: no próprio cruzamento a rua
     que corta a avenida também é asfalto, e um recuo perpendicular à
     avenida corta essa segunda faixa antes de sair dela — a esquina
     de verdade fica mais longe do centro do que a avenida sozinha
     sugere. Por isso o recuo cresce até `noAsfalto` desistir, com um
     teto: se aos 140 ainda não limpou, não é esquina de plantar poste
     (avenida e rua muito largas ali), e o cruzamento fica sem
     semáforo em vez de nascer dentro do asfalto. */
  const SEMAFOROS = [];
  for(const p of CRUZAMENTOS){
    if(!p.principal) continue;
    const lado = ((Math.round(p.x) ^ Math.round(p.y)) & 1) ? 1 : -1;
    const perp = p.ang + Math.PI/2;
    let x, y, achou = false;
    for(let off = p.avLarg/2 + 14; off <= 140; off += 8){
      x = p.x + Math.cos(perp)*off*lado; y = p.y + Math.sin(perp)*off*lado;
      if(!tocaAsfalto(x, y, 3)){ achou = true; break; }
    }
    if(!achou) continue;
    if(x < 0 || y < 0 || x >= W || y >= H || x > xLimiteCosta(y)) continue;
    SEMAFOROS.push({ x, y, ang: p.ang, lado: -lado, braco: Math.min(p.avLarg*0.6, 46) });
  }

  /* ---- AS FAIXAS DE PEDESTRE DOS CRUZAMENTOS ----
     Quatro por cruzamento: uma em cada perna, encostada na SAÍDA do
     cruzamento, com a listra no sentido de quem dirige naquela perna.
     A planta entrega o retângulo pronto (centro, ângulo, largura de
     pista e profundidade) e o pintor só desenha — assim dá pra auditar
     a tinta como se audita casa, e não olhando screenshot.

     ONDE A PERNA COMEÇA, e por que a conta não é "metade da largura".
     A avenida é DIAGONAL. Andando pela rua a partir do centro do
     cruzamento, o quanto se anda até sair do asfalto da avenida é
     `a/proj` — a meia-largura da avenida dividida pela projeção de um
     sentido na normal do outro. Num cruzamento a 57° isso dá quase o
     dobro da meia-largura. A projeção é a mesma nos dois sentidos
     (|v·nu| = |u·nv|), então uma conta serve pras quatro pernas.

     UMA FAIXA NÃO ENCOSTA NA OUTRA. Só recuar pela conta acima não
     garante isso: na quina AGUDA do cruzamento (57° de um lado, 123°
     do outro) a faixa da rua e a da avenida saem do cruzamento por
     direções que ainda se cruzam, e os dois retângulos se tocam. O
     mecanismo é o que um projeto de rua faz de verdade — RECUAR a
     faixa pra trás na própria perna, que é a única direção em que ela
     continua fazendo sentido:

       1. nasce quem cabe inteiro no asfalto (as quatro quinas);
       2. enquanto duas se tocarem (com folga de GAP), as duas andam
          pra trás de PASSO em PASSO na sua própria perna — como as
          pernas divergem, afastar funciona;
       3. quem não tem pra onde ir (o passo a tiraria do asfalto) ou
          já andou EMPURRA_MAX para de andar;
       4. o que ainda assim se tocar, some — e some a da via mais
          ESTREITA, que é a regra da rua: quem cede é a via menor.

     O teste de toque é o do eixo separador (SAT) entre dois
     retângulos girados. Não dá pra usar caixa alinhada aqui: a faixa
     da avenida está a 57°, e a caixa dela alinhada aos eixos é quase o
     dobro do retângulo de verdade — daria toque onde não há. */
  /* PROF 46 e GAP 6 saíram de varredura, não de gosto: com 56 e 10 o
     mecanismo salvava 36 das 46 pernas — as outras 10 batiam no teto
     de recuo e eram apagadas. Com 46 e 6 sobram as 46, e o teto de 140
     nem chega a morder (o pior recuo para em 126), ou seja o afastamento
     converge sozinho em vez de ser cortado. */
  const FAIXA_PROF = 46;
  const FAIXAS = (function(){
    const FOLGA = 7, GAP = 6, PASSO = 6, EMPURRA_MAX = 140;
    const bruta = [];
    for(const cz of CRUZAMENTOS){
      const ux = Math.cos(cz.ang), uy = Math.sin(cz.ang);        // sentido da avenida
      const vx = cz.vertical ? 0 : 1, vy = cz.vertical ? 1 : 0;  // sentido da rua
      const proj = Math.abs(vy*ux - vx*uy);
      if(proj < 0.2) continue;                  // quase paralelas: não é esquina
      const angRua = Math.atan2(vy, vx);
      const pernas = [
        { dx: vx, dy: vy, ang: angRua, larg: cz.ruaLarg, rec: cz.avLarg/2/proj },
        { dx:-vx, dy:-vy, ang: angRua, larg: cz.ruaLarg, rec: cz.avLarg/2/proj },
        { dx: ux, dy: uy, ang: cz.ang, larg: cz.avLarg, rec: cz.ruaLarg/2/proj },
        { dx:-ux, dy:-uy, ang: cz.ang, larg: cz.avLarg, rec: cz.ruaLarg/2/proj }
      ];
      for(const p of pernas)
        bruta.push({ cx: cz.x, cy: cz.y, dx: p.dx, dy: p.dy, ang: p.ang, larg: p.larg,
                     prof: FAIXA_PROF, principal: cz.principal,
                     d: p.rec + FOLGA + FAIXA_PROF/2, empurrao: 0 });
    }
    /* as quatro quinas do retângulo, com recuo opcional nas duas
       medidas — o teste de asfalto usa quina puxada pra dentro (a
       tinta encosta na guia de propósito), o de toque usa a de fora */
    const quinas = (f, ra, rb) => {
      const cx = f.cx + f.dx*f.d, cy = f.cy + f.dy*f.d;
      const ca = Math.cos(f.ang), sa = Math.sin(f.ang);
      const A = f.prof/2 - ra, B = f.larg/2 - rb;
      return [[-A,-B],[A,-B],[A,B],[-A,B]].map(([a, b]) => [cx + a*ca - b*sa, cy + a*sa + b*ca]);
    };
    /* A QUINA, não o meio da borda: a ponta da avenida do norte é uma
       CALOTA (o traço tem `lineCap` redondo e `distAvenida` trunca o
       t), e ali o meio da borda ainda cai no asfalto enquanto as
       quinas já estão fora. */
    const cabe = f => quinas(f, 2, 3).every(([x, y]) => noAsfalto(x, y));
    const separadas = (f, g, folga) => {
      const A = quinas(f, 0, 0), B = quinas(g, 0, 0);
      for(const [R, S] of [[A, B], [B, A]])
        for(let i=0;i<2;i++){                    // retângulo: só duas normais valem
          const [x0, y0] = R[i], [x1, y1] = R[i+1];
          const L = Math.hypot(x1 - x0, y1 - y0);
          const nx = -(y1 - y0)/L, ny = (x1 - x0)/L;
          const r = R.map(([x, y]) => x*nx + y*ny), t = S.map(([x, y]) => x*nx + y*ny);
          if(Math.min(...t) - Math.max(...r) >= folga) return true;
          if(Math.min(...r) - Math.max(...t) >= folga) return true;
        }
      return false;
    };

    let vivas = bruta.filter(cabe);
    for(let volta = 0; volta < 40; volta++){
      let mexeu = false;
      for(let i=0;i<vivas.length;i++) for(let j=i+1;j<vivas.length;j++){
        if(separadas(vivas[i], vivas[j], GAP)) continue;
        for(const f of [vivas[i], vivas[j]]){
          if(f.empurrao >= EMPURRA_MAX) continue;
          f.d += PASSO; f.empurrao += PASSO;
          if(cabe(f)) mexeu = true;
          else { f.d -= PASSO; f.empurrao = EMPURRA_MAX; }   // não tem pra onde ir
        }
      }
      if(!mexeu) break;
    }
    /* quem ainda se toca: cede a da via mais estreita */
    for(;;){
      let par = null;
      for(let i=0;i<vivas.length && !par;i++) for(let j=i+1;j<vivas.length && !par;j++)
        if(!separadas(vivas[i], vivas[j], GAP)) par = [i, j];
      if(!par) break;
      const [i, j] = par;
      vivas.splice(vivas[i].larg <= vivas[j].larg ? i : j, 1);
    }

    /* A RETENÇÃO, atrás da faixa, na mão de quem CHEGA: o sentido de
       chegada é -d, e a direita de (tx,ty) num eixo com y pra baixo é
       (-ty,tx) — com t = -d isso vira (dy,-dx). Só nos cruzamentos com
       semáforo: barra de parada em rua sem sinal nenhum é tinta que a
       prefeitura não pintou. E ela não pode cair dentro da faixa de
       outra perna, pelo mesmo motivo que as faixas não se encostam. */
    for(const f of vivas){
      f.x = f.cx + f.dx*f.d; f.y = f.cy + f.dy*f.d;
      f.ret = null;
      if(!f.principal) continue;
      const rx = f.x + f.dx*(f.prof/2 + 11) + f.dy*f.larg*0.25;
      const ry = f.y + f.dy*(f.prof/2 + 11) - f.dx*f.larg*0.25;
      if(!noAsfalto(rx, ry)) continue;
      const dentroDeOutra = vivas.some(g => g !== f &&
        Math.hypot(rx - g.x, ry - g.y) < (g.prof + g.larg)/2 &&
        Math.abs((rx - g.x)*Math.cos(g.ang) + (ry - g.y)*Math.sin(g.ang)) < g.prof/2 + 5 &&
        Math.abs(-(rx - g.x)*Math.sin(g.ang) + (ry - g.y)*Math.cos(g.ang)) < g.larg/2 + 5);
      if(!dentroDeOutra) f.ret = { x: rx, y: ry };
    }
    return vivas.map(f => ({ x: f.x, y: f.y, ang: f.ang, larg: f.larg, prof: f.prof,
                             dx: f.dx, dy: f.dy, ret: f.ret, empurrao: f.empurrao }));
  })();

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

  /* =========================================================
     A FAVELA — o bairro informal, no flanco oeste
     ---------------------------------------------------------
     A referência que o dono mandou é foto de periferia de verdade, e
     o que se vê de cima nela é UMA MASSA DE TELHA CERÂMICA: casa
     colada na casa, parede com parede, e o que sobra de chão é o
     beco. Não é casinha solta espalhada no descampado, que foi o que
     a primeira versão virou. Então o traçado aqui não é passeio
     aleatório: é QUADRA. Uma grade de quadras miúdas, TORTA em
     relação à grade da cidade (a cidade é reta, a favela não nasceu
     medida), com becos estreitos entre elas; dentro de cada quadra,
     duas fileiras de costas uma pra outra, casa encostada na casa,
     cada fileira virada pro seu beco.

     Três coisas vêm disso de graça:
     — DENSIDADE: sem folga entre casa e casa, o beiral de uma encosta
       no da outra (o beiral sai 2 do corpo e o corpo recua 2), e de
       cima lê como a massa contínua da foto.
     — CAMINHO GARANTIDO: grade de beco é grade — sempre conexa. O
       passeio aleatório da versão anterior fechava anel e prendia
       mato, e o conserto comia um terço das casas.
     — ESCALA: a casa é menor que a da cidade (a da cidade tem 88 a
       168 de frente), mas não é caixa de fósforo: 48 a 80 de frente
       por 44 a 70 de fundo é 2,2 a 3,6 m por 2 a 3,2 m. Barraco de
       um cômodo, que é o que a maior parte daquilo é.

     O VÃO É OU NADA OU BECO. Entre duas casas ou não há folga (0 a 3,
     parede com parede) ou há uma viela de 32 pra cima. O meio-termo —
     uma fresta de 10, de 20 — é o que faz célula que ANDA mas que o
     CORPO não atravessa, e foi de onde saíram todas as ilhas.

     ONDE ELA CABE. Não num retângulo limpo: o flanco oeste é cortado
     por duas estradas (avenida que virou estrada) e pelas casas de
     beira delas, então a área declarada é a faixa inteira e quem
     recorta é o teste casa a casa — mato, fora do asfalto, longe da
     casa de beira. A favela sai em três manchas, uma de cada lado das
     estradas, que é como esse bairro cresce de verdade.

     Entra pelo MESMO cano da casa de beira de estrada: um `lote()`
     girado, com corpo, telhado, porta, janela e pixação, e o mesmo
     balde espacial (`BEIRA`/`naBeira`) bloqueia na máscara. Só a
     caixa d'água azul, o poste de pau e o fio de gato são daqui —
     nenhum dos três bloqueia: dois estão no telhado, um no ar. */
  const CORES_FAVELA = {
    /* tijolo aparente: a casa que nunca foi rebocada, que é a maioria
       na foto */
    tijolo:  ['#a4664a','#9a5f45','#ae6f52','#95614a','#b07354','#8f5a42'],
    /* reboco cru, sem pintura */
    reboco:  ['#b0aca2','#a39e93','#bab5aa','#9c968c','#c2bcb0'],
    /* a que o dono pintou: é ela que dá cor ao beco */
    pintada: ['#d97b9c','#4a9d97','#d7a23c','#6f8fb0','#b5643f','#7f9c5c',
              '#a83f3c','#e8dcc0','#c98b3f','#dd8a4a','#5f8fa8','#c7d0c2']
  };
  /* a telha cerâmica em seis tons — é ela que dá a cor da foto */
  const TELHAS_FAVELA = ['#b0603c','#a85a38','#bd6f45','#9c5334','#c07a52','#ab6340'];
  const LAJES_FAVELA = ['#9a958c','#8f8a80','#a6a096'];
  const GRAFITE_FAVELA = RECADOS.concat([
    'RUA SEM MEDO', 'FAVELA VIVA', 'LUZ NO BECO', 'CRIA DA VILA',
    'SOMOS DAQUI', 'FÉ NÃO FALHA', 'MC ZINHO', 'DJ BEIJA-FLOR',
    'RESPEITA QUEM SUBIU O MORRO', 'BONDE DO BECO', 'TUDO NOSSO', 'ISSO AQUI É NOSSO'
  ]);
  const FAVELA = [], FAVELA_CAIXAS = [], FAVELA_RUAS = [];
  (function(){
    /* RNG PRÓPRIO. A favela sorteia muito — se ela bebesse do `rng()`
       compartilhado, TODA a cidade gerada depois dela mudaria de
       sorteio sem eu ter mexido lá. Local, ela não consome um número
       sequer do sorteio de fora. */
    const rngFav = semente(913247);
    const entreFav = (a, b) => a + rngFav()*(b - a);
    const escolherFav = l => l[Math.floor(rngFav()*l.length)];

    /* EIXO LOCAL, TORTO. A cidade é uma grade reta; se a favela usasse
       os mesmos eixos ela leria como mais um bairro planejado. O
       ângulo é de pouco mais de 90° de propósito: a faixa de mato é
       alta e estreita, então a QUADRA COMPRIDA tem de correr no
       sentido dela (norte-sul), senão a quadra nasce cortada. */
    const ANG = 1.88;
    const CO = Math.cos(ANG), SE = Math.sin(ANG);
    const CXF = (FAIXA_FAV.x0 + FAIXA_FAV.x1)/2, CYF = (FAIXA_FAV.y0 + FAIXA_FAV.y1)/2;
    const paraMundo = (u, v) => [CXF + u*CO - v*SE, CYF + u*SE + v*CO];
    const RAIO = Math.hypot(FAIXA_FAV.x1 - FAIXA_FAV.x0, FAIXA_FAV.y1 - FAIXA_FAV.y0)/2 + 40;

    /* O LIMITE DURO é o TABULEIRO, não a área declarada. Exigir a casa
       INTEIRA dentro do retângulo comia uma faixa de meia casa em toda
       a volta; a área manda no CENTRO, e o corpo pode passar da divisa
       — ali fora continua sendo mato, e quem diz se dá é o teste de
       zona/asfalto abaixo. */
    const LIM = { x0: Math.max(10, AREA_FAV.x0 - 40), x1: Math.min(W - 10, AREA_FAV.x1 + 40),
                  y0: Math.max(10, AREA_FAV.y0 - 40), y1: Math.min(H - 10, AREA_FAV.y1 + 40) };
    function cabe(cx, cy, w, h, ang){
      const meia = Math.max(w, h)/2;
      if(cx < AREA_FAV.x0 || cx > AREA_FAV.x1 || cy < AREA_FAV.y0 || cy > AREA_FAV.y1) return false;
      if(cx - meia < LIM.x0 || cx + meia > LIM.x1 ||
         cy - meia < LIM.y0 || cy + meia > LIM.y1) return false;
      for(const [px, py] of cantosGirados({ ang, cx, cy, w, h }, 4)){
        /* MATO E TERRENO ABERTO, os dois. Exigir mato parava a favela
           no contorno da cidade e deixava uma língua de areia vazia
           entre ela e a rua de leste — foi o que o dono viu na foto.
           O que está ali é célula `aberto`, sem lote e sem calçada:
           descampado de dentro do contorno, e é dele que a favela toma
           conta até encostar no asfalto. Mar, praia e orla não. */
        const z = zona(px, py);
        if(z === 'mar' || z === 'praia' || z === 'orla') return false;
        /* nem no asfalto NEM na calçada da estrada: a avenida vira
           estrada aqui fora e leva a banda de calçada com ela, e casa
           por cima de calçada é o que a varredura de geometria pega */
        if(noAsfalto(px, py) || naAvenida(px, py, CALC)) return false;
        /* nem em célula de QUADRA nem de CAMPO: ali a calçada, o miolo
           e a cerca já são de outra gente */
        const cel = celulaEm(px, py);
        if(cel && (cel.tipo === 'quadra' || cel.tipo === 'campo')) return false;
      }
      for(const b of BEIRA)
        if(!b.favela && Math.hypot(b.cx - cx, b.cy - cy) < (Math.max(b.w,b.h) + Math.max(w,h))/2 + 14)
          return false;
      return true;
    }

    function casaEm(cx, cy, w, h, ang, vf){
      if(!cabe(cx, cy, w, h, ang)) return null;
      /* altura: a maioria é térrea; um terço levantou o segundo andar
         e alguns o terceiro — na foto é exatamente isso, um dente de
         serra de lajes em cima de um mar de telha */
      let alt = par8(entreFav(52, 74));
      if(rngFav() < 0.34) alt += par8(entreFav(28, 46));
      if(rngFav() < 0.10) alt += par8(entreFav(26, 40));
      /* A COBERTURA. Telha cerâmica de duas águas na maioria — é ela
         que dá a cor da foto —, laje nua em parte (casa que ainda vai
         subir mais um andar) e fibrocimento no resto. */
      const r = rngFav();
      const tipo = r < 0.68 ? 'casa' : r < 0.88 ? 'barraco' : 'galpao';
      const telha = tipo === 'casa' ? escolherFav(TELHAS_FAVELA)
                  : tipo === 'barraco' ? escolherFav(LAJES_FAVELA) : '#9aa0a2';
      /* a parede: tijolo aparente na maior parte, reboco cru, e a
         pintada, que é a que dá vida ao beco */
      const p = rngFav();
      const cor = p < 0.44 ? escolherFav(CORES_FAVELA.tijolo)
                : p < 0.68 ? escolherFav(CORES_FAVELA.reboco)
                           : escolherFav(CORES_FAVELA.pintada);
      /* `parede` diz ao modelo da casa (casas3d.js) qual das três é —
         a cor sozinha não diz, e sortear de novo andaria o `rngFav` */
      const parede = p < 0.44 ? 'tijolo' : p < 0.68 ? 'reboco' : 'pintada';
      const casa = { tipo, ang: ang || 1e-6, vf, cx, cy, w, h, alt, cor, telha, parede, favela: true };
      /* a casa da favela pixa pela mesma regra do resto do bairro: o
         `escolherFav` gasta o número do sorteio DELA, e quem decide se
         sai torcida ou recado é o `rngPixo`, de dentro do `pixar` */
      if(rngFav() < 0.42) pixar(casa, escolherFav(GRAFITE_FAVELA));
      FAVELA.push(casa);
      return casa;
    }

    /* OS CORTES: onde acaba a quadra e começa o beco, com largura
       sorteada — a grade sai irregular como a da foto. O beco nunca
       fica abaixo de 40: ele corre na diagonal em cima de uma máscara
       de célula reta, e diagonal estreita pincha. */
    function cortes(meio, blocoMin, blocoMax, becoMin, becoMax){
      const faixas = [], becos = [];
      let t = -meio;
      while(t < meio){
        const b = par8(entreFav(blocoMin, blocoMax));
        if(t + b > meio) break;
        faixas.push([t, t + b]);
        t += b;
        const g = Math.round(entreFav(becoMin, becoMax));
        becos.push([t, t + g]);
        t += g;
      }
      return { faixas, becos };
    }
    /* A QUADRA E O BECO. Estes números são VARRIDOS, não escolhidos.
       Ao encolher a fatia da sede nível 1 a cidade toda andou no
       `rng()` compartilhado, a reparação de ilha passou a tirar mais
       casas e a favela caiu de 262 pra 231. Havia dois caminhos pra
       trazer de volta: baixar a frente da casa (que devolvia 264, mas
       a 2,14 m — justamente o que o dono reclamou antes) ou apertar a
       quadra. Apertar a quadra, então; e o beco saiu de varredura:

         beco 30–38 → 262 casas, mas 30 células PRESAS (a reparação de
                      ilha empaca num bolsão que nenhuma remoção única
                      abre)
         beco 31–39 → presa nenhuma, mas só 248 casas
         beco 32–42 → 260 casas e 25.384 de 25.384 alcançáveis

       Fica o 32–42: 1,44 a 1,89 m de beco, que continua beco de
       favela e continua passando corpo (que pede 24). */
    const CU = cortes(RAIO, 500, 850, 32, 42);     // a quadra comprida, no sentido da faixa
    const CV = cortes(RAIO, 86, 124, 32, 42);      // e a travessa

    /* O BECO VIRA LINHA NO CHÃO, recortada: a reta inteira atravessaria
       o mapa, e o que interessa é só o pedaço que cai na favela */
    function traçarBeco(pa, pb){
      const L = Math.hypot(pb[0]-pa[0], pb[1]-pa[1]), N = Math.ceil(L/18);
      let atual = null;
      for(let i=0;i<=N;i++){
        const t = i/N, x = pa[0] + (pb[0]-pa[0])*t, y = pa[1] + (pb[1]-pa[1])*t;
        /* A VIELA TEM DE DESEMBOCAR NA RUA. Antes ela parava onde o
           MATO parava — e a casa, que aceita terreno aberto, ia bem
           além disso: sobrava um pedaço de viela sem asfalto entre a
           última casa e a rua da cidade, e o bairro lia como coisa
           solta largada ao lado do mapa. Agora ela vale onde a CASA
           vale (a mesma régua de chão), e vai UM PONTO PARA DENTRO do
           asfalto: o traço do beco entra na rua, a rua é pintada por
           cima depois, e as duas viram uma só. A folga de 70 na divisa
           da área é pra alcançar a rua que passa logo fora dela. */
        const F = 70;
        const dentro = x > AREA_FAV.x0 - F && x < AREA_FAV.x1 + F &&
                       y > AREA_FAV.y0 - F && y < AREA_FAV.y1 + F;
        const z = zona(x, y), cel = celulaEm(x, y);
        const chao = dentro && z !== 'mar' && z !== 'praia' && z !== 'orla' &&
                     !(cel && (cel.tipo === 'quadra' || cel.tipo === 'campo'));
        if(chao && noAsfalto(x, y)){          // encostou na rua: emenda e fecha
          if(atual) atual.push([x, y]);
          atual = null;
          continue;
        }
        if(chao){ if(!atual){ atual = []; FAVELA_RUAS.push(atual); } atual.push([x, y]); }
        else atual = null;
      }
    }
    for(const [a, b] of CU.becos){ const m = (a+b)/2; traçarBeco(paraMundo(m, -RAIO), paraMundo(m, RAIO)); }
    for(const [a, b] of CV.becos){ const m = (a+b)/2; traçarBeco(paraMundo(-RAIO, m), paraMundo(RAIO, m)); }
    for(let i = FAVELA_RUAS.length - 1; i >= 0; i--) if(FAVELA_RUAS[i].length < 3) FAVELA_RUAS.splice(i, 1);

    /* O VÃO ENTRE DUAS CASAS É OU NADA OU BECO — o meio-termo é fresta
       que anda e não passa, e foi dali que saíram as ilhas */
    const vaoEntreCasas = () => rngFav() < 0.08 ? par8(entreFav(40, 56)) : entreFav(-1, 3);

    /* uma fileira: caminha ao longo da quadra encostando casa em casa.
       A ÚLTIMA ENGOLE A SOBRA — deixar 30 de rabo em cada fileira
       custava um sétimo do bairro. */
    function fileira(u0, u1, vc, fundo, vf){
      let u = u0;
      while(u < u1 - 32){
        let frente = Math.min(par8(entreFav(42, 66)), u1 - u);
        if(u1 - u - frente < 32) frente = u1 - u;
        if(frente < 32) break;
        /* a casa torta de um grau ou dois: fileira de favela não é
           régua, e a sobreposição de um ponto ou dois entre vizinhas
           não incomoda — parede de favela é parede compartilhada */
        const ang = ANG + entreFav(-0.035, 0.035);
        const [cx, cy] = paraMundo(u + frente/2, vc);
        casaEm(cx, cy, frente, fundo, ang, vf);
        u += frente + vaoEntreCasas();
      }
    }

    for(const [u0, u1] of CU.faixas){
      for(const [v0, v1] of CV.faixas){
        const BV = v1 - v0;
        if(BV < 88){ fileira(u0, u1, (v0 + v1)/2, BV, rngFav() < 0.5 ? 1 : -1); continue; }
        /* quadra funda: duas fileiras de COSTAS uma pra outra, cada
           uma com a porta virada pro seu beco */
        const dA = par8(BV*entreFav(0.42, 0.58));
        const dB = BV - dA;
        fileira(u0, u1, v0 + dA/2, dA, -1);
        fileira(u0, u1, v1 - dB/2, dB, 1);
      }
    }

    /* CAIXA D'ÁGUA AZUL numa quina do telhado: quase toda casa tem.
       Numa armação, acima do beiral — na foto elas aparecem espetadas
       por cima da telha, e é assim que se vê de cima. */
    for(const c of FAVELA){
      if(rngFav() < 0.14) continue;
      const co = Math.cos(c.ang), so = Math.sin(c.ang);
      const su = rngFav() < 0.5 ? -1 : 1, sv = rngFav() < 0.5 ? -1 : 1;
      const u = su*(c.w/2 - 10), v = sv*(c.h/2 - 9);
      FAVELA_CAIXAS.push({ x: c.cx + u*co - v*so, y: c.cy + u*so + v*co,
                           alt: c.alt, r: entreFav(7, 9.5) });
    }

    /* DESENCALHA ILHA — a rede de segurança. Com grade de beco isso
       quase não dispara, mas quadra cortada pela borda da mancha, pela
       estrada ou por uma casa de beira ainda fecha um canto. O teste é
       o que o jogo faz: grade do tamanho da célula, o CORPO cabe se as
       8 vizinhas estão livres (fresta de uma célula anda mas não
       passa), inunda a partir da borda, e quem não afoga é ilha.
       Candidata a sair é quem encosta nela; só sai de verdade se TIRAR
       ELA encolher a ilha — adivinhar por proximidade já me deixou
       rodando à toa, tirando um lado do corredor de cada vez. */
    (function desencalhar(){
      const G = 8;
      const gx0 = Math.floor(AREA_FAV.x0/G) - 1, gx1 = Math.ceil(AREA_FAV.x1/G) + 1;
      const gy0 = Math.floor(AREA_FAV.y0/G) - 1, gy1 = Math.ceil(AREA_FAV.y1/G) + 1;
      const GW = gx1 - gx0, GH = gy1 - gy0;
      const mx = i => (gx0 + i + 0.5)*G, my = j => (gy0 + j + 0.5)*G;
      /* O QUE JÁ ESTAVA LÁ, marcado UMA vez: casa de beira de estrada e
         moita. O conserto só conhecia as casas da favela, e por isso
         dava por conectada uma faixa de 700 células que, na máscara de
         verdade, a fileira de casas da estrada fechava por cima. É a
         mesma pergunta que `andaNaCidade` faz no mato — `naMoita` e o
         corpo das casas de beira —, e ela não muda quando a favela
         perde uma casa, então sai do laço. */
      const base = new Uint8Array(GW * GH);
      for(let i=0;i<GW;i++) for(let j=0;j<GH;j++){
        const x = mx(i), y = my(j);
        if(naMoita(x, y)) base[j*GW + i] = 1;
      }
      for(const b of BEIRA){
        if(b.favela) continue;
        const meia = Math.max(b.w, b.h)/2 + 2;
        const i0 = Math.max(0, Math.floor((b.cx - meia)/G) - gx0), i1 = Math.min(GW-1, Math.ceil((b.cx + meia)/G) - gx0);
        const j0 = Math.max(0, Math.floor((b.cy - meia)/G) - gy0), j1 = Math.min(GH-1, Math.ceil((b.cy + meia)/G) - gy0);
        for(let i = i0; i <= i1; i++) for(let j = j0; j <= j1; j++){
          const k = j*GW + i;
          if(!base[k] && dentroLote(mx(i), my(j), b)) base[k] = 1;
        }
      }
      function ilhaDe(lista){
        const bloq = base.slice();
        for(const c of lista){
          const meia = Math.max(c.w, c.h)/2 + 2;
          const i0 = Math.max(0, Math.floor((c.cx - meia)/G) - gx0), i1 = Math.min(GW-1, Math.ceil((c.cx + meia)/G) - gx0);
          const j0 = Math.max(0, Math.floor((c.cy - meia)/G) - gy0), j1 = Math.min(GH-1, Math.ceil((c.cy + meia)/G) - gy0);
          for(let i = i0; i <= i1; i++) for(let j = j0; j <= j1; j++){
            const k = j*GW + i;
            if(!bloq[k] && dentroLote(mx(i), my(j), c)) bloq[k] = 1;
          }
        }
        /* FORA DO TABULEIRO NÃO É LIVRE. `anda()` só responde dentro
           de [4, W-4] × [4, H-4] — a mesma comparação, não uma
           parecida —, e a favela agora encosta na borda oeste do mapa.
           Fora da GRADE (mas dentro do tabuleiro) é mato aberto, e
           esse sim é livre. */
        /* (o tabuleiro cresceu depois pra oeste, `DX`: esta conta fica
           com a borda antiga de propósito — a favela é sorteada com ela
           e sairia outra) */
        const noTab = (x, y) => x >= 4 && y >= 4 && x <= W - 4 && y <= H - 4;
        const livre = (i, j) => {
          if(i < 0 || j < 0 || i >= GW || j >= GH) return noTab(mx(i), my(j));
          if(!noTab(mx(i), my(j))) return false;
          return !bloq[j*GW+i];
        };
        const corpo = new Uint8Array(GW * GH);
        for(let i=0;i<GW;i++) for(let j=0;j<GH;j++){
          if(!livre(i,j)) continue;
          let ok = 1;
          for(let a=-1;a<=1&&ok;a++) for(let b=-1;b<=1;b++) if(!livre(i+a,j+b)){ ok=0; break; }
          corpo[j*GW+i] = ok;
        }
        const vis = new Uint8Array(GW * GH), fila = [];
        const semear = k => { if(corpo[k] && !vis[k]){ vis[k] = 1; fila.push(k); } };
        /* SEMEIA SÓ ONDE HÁ MUNDO DO LADO DE FORA. A borda da grade é
           saída quando o que vem depois dela é tabuleiro; na beira
           OESTE não é — ali a grade acaba porque o MAPA acaba. Semear
           aquela borda dava por conectada uma fresta entre a primeira
           fileira de casas e o fim do mapa que, no jogo, é beco sem
           saída de 700 células. */
        for(let i=0;i<GW;i++){
          if(noTab(mx(i), my(-1))) semear(i);
          if(noTab(mx(i), my(GH))) semear((GH-1)*GW + i);
        }
        for(let j=0;j<GH;j++){
          if(noTab(mx(-1), my(j))) semear(j*GW);
          if(noTab(mx(GW), my(j))) semear(j*GW + GW-1);
        }
        let n = 0;
        while(n < fila.length){
          const k = fila[n++], i = k % GW, j = (k - i)/GW;
          for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){
            const a = i+di, c2 = j+dj;
            if(a < 0 || c2 < 0 || a >= GW || c2 >= GH) continue;
            const kk = c2*GW + a;
            if(vis[kk] || !corpo[kk]) continue;
            vis[kk] = 1; fila.push(kk);
          }
        }
        const presas = [];
        for(let k=0;k<GW*GH;k++) if(corpo[k] && !vis[k]) presas.push(k);
        return presas;
      }
      for(let rodada = 0; rodada < 30; rodada++){
        const presas = ilhaDe(FAVELA);
        if(!presas.length) break;
        /* só quem ENCOSTA na ilha entra no teste — sem esse filtro
           seriam duzentas recontagens por rodada */
        const perto = [];
        for(let idx=0; idx<FAVELA.length; idx++){
          const c = FAVELA[idx], raio = Math.max(c.w, c.h)/2 + 44;
          for(const k of presas){
            const i = k % GW;
            if(Math.hypot(mx(i) - c.cx, my((k - i)/GW) - c.cy) < raio){ perto.push(idx); break; }
          }
        }
        let tirou = false;
        for(const idx of perto){
          const resto = FAVELA.slice(0, idx).concat(FAVELA.slice(idx + 1));
          if(ilhaDe(resto).length < presas.length){ FAVELA.splice(idx, 1); tirou = true; break; }
        }
        if(!tirou) break;
      }
    })();

    /* O MATO DE VOLTA NAS SOBRAS. As moitas nascem antes da favela (e
       por isso a área toda ficou proibida pra elas), mas a favela não
       ocupa a faixa inteira: entre uma mancha e outra sobra descampado,
       e descampado sem moita lê como terra arrasada. Aqui elas voltam,
       longe de casa, com o RNG local — e entram TAMBÉM no balde
       espacial, senão `naMoita` não enxergaria e a moita ficaria de
       enfeite, sem bloquear. */
    for(let n=0;n<900;n++){
      const x = entreFav(AREA_FAV.x0, AREA_FAV.x1), y = entreFav(AREA_FAV.y0, AREA_FAV.y1);
      const r = entreFav(16, 38);
      if(zona(x, y) !== 'mato' || noAsfalto(x, y)) continue;
      if(tocaAsfalto(x, y, r*0.9) || naAvenida(x, y, CALC + 10)) continue;
      /* LONGE DA FAVELA, não só fora das casas. Moita é bloqueio, e
         moita solta no meio de um beco ou na fresta entre a primeira
         fileira e a borda do mapa SELA a passagem — foram 743 células
         presas assim, e o desencalha-ilha nem via, porque ele só
         conhece casa. Aqui elas só voltam no descampado de verdade. */
      if(FAVELA.some(o => Math.hypot(o.cx - x, o.cy - y) < Math.max(o.w, o.h)/2 + r + 95)) continue;
      const m = { x, y, r };
      MOITAS.push(m);
      if(x >= -BALDE && y >= -BALDE){
        const k = chave(x, y);
        if(!baldes.has(k)) baldes.set(k, []);
        baldes.get(k).push(m);
      }
    }

    /* uma arvorezinha rala na beirada — favela não tem quintal, mas
       uma sombra no fim do beco tira o ar de maquete */
    for(const c of FAVELA){
      if(rngFav() < 0.95) continue;
      const co = Math.cos(c.ang), so = Math.sin(c.ang);
      const d = -c.vf*(c.h/2 + entreFav(22, 40)), u = entreFav(-c.w*0.4, c.w*0.4);
      const x = c.cx + u*co - d*so, y = c.cy + u*so + d*co;
      if(!naAreaFavela(x, y) || zona(x, y) !== 'mato') continue;
      if(FAVELA.some(o => Math.hypot(o.cx - x, o.cy - y) < Math.max(o.w, o.h)/2 + 14)) continue;
      /* asfalto nenhum sob a copa. Este laço não tinha teste de
         asfalto NENHUM — só olhava a área da favela e a zona —, e uma
         casa da beirada punha a árvore com a copa por cima da rua da
         cidade. O sorteio é que escondia: só aparece quando a peça cai
         naquela quina, e mudou ao encolher a fatia da sede nível 1.
         O raio é sorteado ANTES do teste de propósito: `entreFav`
         continua sendo chamado nas mesmas voltas, então a favela
         inteira sai igual — o que muda é só a árvore não nascer. */
      const rArv = entreFav(11, 17);
      if(tocaAsfalto(x, y, rArv + 2)) continue;
      ARVORES.push({ x, y, r: rArv });
    }

    /* AS CASAS GRANDES DA FAVELA. Quatro referências — a casa de laje
       com terraço e guarda-sol, a casa rosa de quintal e muro, o bar e
       a lanchonete — não cabem na casa de 2,6 m que a fileira sorteia:
       elas têm de 5 a 8 m de frente. Então nascem JUNTANDO vizinhas,
       como a casa que comprou a do lado. Só se junta quem já encosta
       (vão de até 8 — nunca por cima de beco, que fecharia passagem),
       e a casa funda pega as DUAS fileiras de costas, de beco a beco:
       é onde a quadra dá os 4,5 a 6,4 m de fundo que a referência pede.
       O corte tem de cair numa junta das duas fileiras ao mesmo tempo
       (14 de folga: a fresta que sobra não passa corpo, então não vira
       ilha), senão a casa nova morderia meia vizinha.
       Quem vira o quê sai de um hash da POSIÇÃO — nenhum `rngFav` —, e
       isto roda depois de tudo que sorteia: o resto da favela sai igual.
       A casa nova herda a pixação de uma das que engoliu (a de torcida,
       se houver), e a caixa d'água e a árvore que caíam dentro dela saem
       (o modelo tem a caixa dele). */
    (function juntarCasasGrandes(){
      const Mt = METRO;
      const hashPos = (s) => { let h = 2166136261 >>> 0;
        for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
        return h / 4294967296; };
      const loc = (x, y) => { const dx = x - CXF, dy = y - CYF; return [dx*CO + dy*SE, -dx*SE + dy*CO]; };
      /* as fileiras: mesma linha de centro e mesmo lado de porta */
      const fileiras = new Map();
      for(const c of FAVELA){
        const [u, v] = loc(c.cx, c.cy);
        const k = Math.round(v) + '|' + c.vf;
        if(!fileiras.has(k)) fileiras.set(k, { v, h: c.h, vf: c.vf, casas: [] });
        fileiras.get(k).casas.push({ c, u0: u - c.w/2, u1: u + c.w/2 });
      }
      /* cada fileira em TRECHOS de casas encostadas, com as juntas */
      const trechosDe = f => {
        f.casas.sort((a, b) => a.u0 - b.u0);
        const out = [];
        let atual = null;
        for(const x of f.casas){
          if(!atual || x.u0 - atual[atual.length - 1].u1 > 8){ atual = []; out.push(atual); }
          atual.push(x);
        }
        return out.map(t => ({ casas: t, juntas: [t[0].u0].concat(t.slice(1).map((x, i) => (t[i].u1 + x.u0)/2), [t[t.length - 1].u1]) }));
      };
      const lista = [...fileiras.values()];
      for(const f of lista) f.trechos = trechosDe(f);
      const cands = [];
      const pedaco = (tA, k1, k2, tB, m1, m2, fA, fB) => {
        const cs = tA.casas.slice(k1, k2).concat(tB ? tB.casas.slice(m1, m2) : []);
        const u0 = Math.max(tA.casas[k1].u0, tB ? tB.casas[m1].u0 : -1e9);
        const u1 = Math.min(tA.casas[k2 - 1].u1, tB ? tB.casas[m2 - 1].u1 : 1e9);
        const v0 = fA.v - fA.h/2, v1 = tB ? fB.v + fB.h/2 : fA.v + fA.h/2;
        /* ESQUINA: a ponta do trecho (nas duas fileiras) dá pro beco de
           lado — é onde o bar abre pros dois lados, como na foto */
        const pontaU0 = k1 === 0 && (!tB || m1 === 0);
        const pontaU1 = k2 === tA.casas.length && (!tB || m2 === tB.casas.length);
        cands.push({ casas: cs.map(x => x.c), u0, u1, v0, v1, W: (u1 - u0)/Mt, D: (v1 - v0)/Mt,
                     lados: tB ? [-1, 1] : [fA.vf], pontaU0, pontaU1 });
      };
      for(const fA of lista){
        /* a fileira de COSTAS pra esta (a de porta pro outro lado, com
           a borda de trás colada) — se houver, a casa pega as duas */
        const fB = fA.vf < 0 ? lista.find(g => g.vf > 0 && Math.abs((fA.v + fA.h/2) - (g.v - g.h/2)) < 2) : null;
        if(fA.vf > 0 && lista.some(g => g.vf < 0 && Math.abs((g.v + g.h/2) - (fA.v - fA.h/2)) < 2)) continue;
        for(const tA of fA.trechos){
          const n = tA.casas.length;
          if(!fB){
            for(let k1 = 0; k1 < n; k1++) for(let k2 = k1 + 2; k2 <= n; k2++) pedaco(tA, k1, k2, null, 0, 0, fA, null);
            continue;
          }
          for(const tB of fB.trechos){
            if(tB.juntas[tB.juntas.length - 1] < tA.juntas[0] || tB.juntas[0] > tA.juntas[n]) continue;
            /* os cortes que caem numa junta das duas fileiras */
            const cortes = [];
            for(let k = 0; k <= n; k++) for(let m = 0; m < tB.juntas.length; m++)
              if(Math.abs(tA.juntas[k] - tB.juntas[m]) <= 14) cortes.push([k, m]);
            for(const [k1, m1] of cortes) for(const [k2, m2] of cortes)
              if(k2 > k1 && m2 > m1) pedaco(tA, k1, k2, tB, m1, m2, fA, fB);
          }
        }
      }
      /* as quatro, das mais exigentes pras mais fáceis: largura e fundo
         em metros, quantas, e a distância mínima entre duas iguais */
      /* o fundo da quadra de duas fileiras aqui é quase sempre 4,5 a
         4,9 m (só uma em oito passa de 5,8): o modelo se ajusta a ele */
      /* com a favela pela metade, a conta de cada uma também caiu pela
         metade (uma de cada, duas da f1 e da f2) */
      const MODELOS = [
        { modelo: 'bar',    w: [5.0, 7.8], d: 4.3, n: 1, longe: 30, tipo: 'sobrado', alt: 6.0, parede: 'tijolo', esquina: true },
        { modelo: 'f2',     w: [5.6, 8.6], d: 4.4, n: 2, longe: 18, tipo: 'casa',    alt: 3.4, parede: 'pintada' },
        { modelo: 'lanche', w: [5.0, 7.4], d: 4.3, n: 1, longe: 22, tipo: 'sobrado', alt: 6.2, parede: 'pintada' },
        { modelo: 'f1',     w: [5.0, 7.6], d: 4.4, n: 2, longe: 15, tipo: 'sobrado', alt: 8.2, parede: 'tijolo' }
      ];
      /* a segunda leva de referências: a casa da escada de fora com o
         muro curvo (quer esquina), o sobrado do varal com o poste, o
         sobrado das duas garagens e a casa de tijolo no embasamento alto */
      const MODELOS2 = [
        { modelo: 'escada',  w: [6.4, 8.6], d: 4.3, n: 1, longe: 15, perto: 5, tipo: 'sobrado', alt: 6.1, parede: 'reboco', esquina: true },
        { modelo: 'varal',   w: [5.0, 7.0], d: 4.3, n: 1, longe: 15, perto: 5, tipo: 'sobrado', alt: 6.2, parede: 'tijolo' },
        { modelo: 'garagem', w: [6.2, 8.2], d: 4.3, n: 1, longe: 15, perto: 5, tipo: 'sobrado', alt: 5.6, parede: 'tijolo' },
        { modelo: 'base',    w: [6.0, 8.2], d: 4.3, n: 1, longe: 15, perto: 5, tipo: 'sobrado', alt: 6.5, parede: 'tijolo' }
      ];
      const usadas = new Set(), postas = [];
      /* em RODADAS, uma de cada por vez: a primeira da lista não leva
         todos os terrenos bons antes da última escolher. A segunda leva
         escolhe no que sobrou da primeira, que assim não mexe. */
      function escolherEmRodadas(lista){
        for(const md of lista){
          md.fila = cands.filter(c => c.W >= md.w[0] && c.W <= md.w[1] && c.D >= md.d)
            .map(c => ({ c, h: hashPos(md.modelo + ':' + Math.round(c.u0) + ',' + Math.round(c.v0)) }))
            .sort((a, b) => md.esquina ? ((b.c.pontaU0 || b.c.pontaU1) - (a.c.pontaU0 || a.c.pontaU1)) || a.h - b.h : a.h - b.h);
          md.postas = 0;
        }
        for(let rodada = 0; rodada < 8; rodada++){
          for(const md of lista){
            if(md.postas >= md.n) continue;
            for(const { c, h } of md.fila){
              if(c.casas.some(x => usadas.has(x))) continue;
              const uc = (c.u0 + c.u1)/2, vc = (c.v0 + c.v1)/2;
              if(postas.some(p => Math.hypot(p.uc - uc, p.vc - vc) < (p.modelo === md.modelo ? md.longe : (md.perto || 8))*Mt)) continue;
              for(const x of c.casas) usadas.add(x);
              postas.push({ c, uc, vc, modelo: md.modelo, md, vf: c.lados[Math.floor(h*1e4) % c.lados.length] });
              md.postas++;
              break;
            }
          }
        }
      }
      escolherEmRodadas(MODELOS);
      escolherEmRodadas(MODELOS2);
      for(const p of postas){
        const { c, md } = p;
        const [cx, cy] = paraMundo(p.uc, p.vc);
        const base = c.casas[0];
        const lote = { tipo: md.tipo, ang: ANG, vf: p.vf, cx, cy, w: c.u1 - c.u0, h: c.v1 - c.v0,
                       alt: Math.round(md.alt*Mt), cor: base.cor, telha: base.telha, parede: md.parede,
                       favela: true, modelo: md.modelo };
        /* o lado da esquina, na mão de quem olha a fachada: a direita dele
           é +u quando a porta dá pra +v, e −u quando dá pra −v */
        const esqU = p.vf > 0 ? 'esq' : 'dir', dirU = p.vf > 0 ? 'dir' : 'esq';
        if(c.pontaU0 || c.pontaU1) lote.esquina = c.pontaU0 ? esqU : dirU;
        const pix = c.casas.find(x => x.pixo) || c.casas.find(x => x.pixacao);
        if(pix){ lote.pixacao = pix.pixacao; if(pix.pixoTinta) lote.pixoTinta = pix.pixoTinta; if(pix.pixo) lote.pixo = pix.pixo; }
        for(const x of c.casas) FAVELA.splice(FAVELA.indexOf(x), 1);
        FAVELA.push(lote);
        /* a caixa d'água e a árvore que caíam dentro da casa nova — ou de
           uma das engolidas, que pode passar um palmo da casa nova e
           deixaria a caixa dela no ar — saem */
        const dentro = (x, y, folga) => { const [u, v] = loc(x, y);
          return (u > c.u0 - folga && u < c.u1 + folga && v > c.v0 - folga && v < c.v1 + folga) ||
                 c.casas.some(o => { const [uo, vo] = loc(o.cx, o.cy);
                   return Math.abs(u - uo) < o.w/2 + folga && Math.abs(v - vo) < o.h/2 + folga; }); };
        for(let i = FAVELA_CAIXAS.length - 1; i >= 0; i--)
          if(dentro(FAVELA_CAIXAS[i].x, FAVELA_CAIXAS[i].y, 4)) FAVELA_CAIXAS.splice(i, 1);
        for(let i = ARVORES.length - 1; i >= 0; i--)
          if(dentro(ARVORES[i].x, ARVORES[i].y, ARVORES[i].r*0.5)) ARVORES.splice(i, 1);
      }
    })();

    for(const c of FAVELA){ BEIRA.push(c); LOTES.push(c); }
  })();

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
  /* árvore e poste na beira, pro trecho não virar fileira de caixas.
     A casa da favela pula ANTES do `rng()`: ela já ganhou a árvore
     dela lá na hora, com o RNG próprio — se entrasse aqui, consumiria
     um número do sorteio compartilhado por casa nova, e a cidade
     inteira gerada depois mudaria de sorteio sem eu ter mexido nela. */
  for(const o of BEIRA){
    if(o.favela) continue;
    if(o.tipo === 'muro' || rng() < 0.5) continue;
    /* `ang: 0` É FALSO EM JAVASCRIPT, de novo. As 22 casas da BORDA DA
       CIDADE são lote RETO — têm `frente` e caixa, não têm `ang` nem
       `vf` —, e este laço lia `o.ang` e `o.vf` de todo mundo: saía
       `-undefined`, a coordenada virava NaN e a árvore era descartada
       adiante sem um pio (`celulaEm(NaN)` não acha célula nenhuma).
       Eram quatro árvores que nunca existiram. */
    const fora = entre(26, 46);
    let x, y;
    if(o.ang){
      const c = Math.cos(o.ang), s = Math.sin(o.ang);
      const d = -o.vf*(o.h/2 + fora), u = entre(-o.w*0.4, o.w*0.4);
      x = o.cx + u*c - d*s; y = o.cy + u*s + d*c;
    } else {
      const mx = (o.x0 + o.x1)/2, my = (o.y0 + o.y1)/2;
      const jx = entre(-(o.x1 - o.x0)*0.4, (o.x1 - o.x0)*0.4);
      const jy = entre(-(o.y1 - o.y0)*0.4, (o.y1 - o.y0)*0.4);
      if(o.frente === 'n'){ x = mx + jx; y = o.y0 - fora; }
      else if(o.frente === 's'){ x = mx + jx; y = o.y1 + fora; }
      else if(o.frente === 'o'){ x = o.x0 - fora; y = my + jy; }
      else { x = o.x1 + fora; y = my + jy; }
    }
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

  /* =========================================================
     OS DECALQUES DE CHÃO
     ---------------------------------------------------------
     Mato, entulho, terra e folha vindos de um pack de fotos zenitais
     (`ferramentas/importar_decalques.py` recorta a folha de contato e
     monta o atlas `img/texturas/chao.png`, 8 × 4). Cada um é UMA PLACA
     deitada no chão: duas faces de triângulo, recorte por alfa, e
     NADA na máscara — decalque é decoração, não obstáculo. É por isso
     que ele pode ser espalhado à vontade: não há um caminho no mapa
     que ele feche.

     Onde NÃO vai: asfalto e calçada de avenida (chão da cidade tem
     acabamento próprio), dentro de casa, no quarteirão da cidade (lá
     já há calçada, lote e quintal), no campo de várzea (que tem a
     grama dele) e no mar e na areia. Sobra o mato, o terreno aberto e
     o baldio — que são justamente os lugares que liam como descampado
     chapado.

     SEMENTE PRÓPRIA, como a favela: são uns milhares de sorteios, e se
     eles saíssem do `rng()` compartilhado a cidade inteira mudaria de
     desenho por causa de um detalhe de decoração. */
  const DEC_FAMILIA = {
    /* a família de cada célula do atlas, lida na folha de contato */
    mato:    [4,5,8,9,11,14,15,17,19,21,23,24,25,27,28,30,31],
    entulho: [0,1,3,6,7,12,13,18,20,22,29],
    terra:   [2,16,26],
    folha:   [10]
  };
  const DECALQUES = [];
  (function decorar(){
    const rngD = semente(560431);
    const entreD = (a, b) => a + rngD()*(b - a);
    const escolherD = l => l[Math.floor(rngD()*l.length)];
    /* a arte ocupa 91,7% da célula do atlas (o resto é folga
       transparente), então a placa é o tamanho real dividido por isso */
    const placa = t => t/0.917;
    /* O chão desenhado acaba na VISTA. Uma placa que passa da borda
       fica boiando no vazio — dá pra ver de longe. Então quem não cabe
       inteiro (com a diagonal, porque ela gira) simplesmente não nasce. */
    function por(x, y, cel, tam, ang){
      const h = tam/2*1.42;
      if(x - h < VX0 || y - h < VY0 || x + h > VX0 + VW || y + h > VY0 + VH) return;
      DECALQUES.push({ x, y, cel, tam, ang });
    }
    function ondeCabe(x, y){
      const z = zona(x, y);
      if(z === 'mar' || z === 'praia') return null;
      if(noAsfalto(x, y) || naAvenida(x, y, CALC)) return null;
      if(naBeira(x, y)) return null;
      if(noCampo(x, y)) return null;
      const q = celulaEm(x, y);
      if(q && q.tipo === 'quadra'){
        /* o quarteirão da cidade fica de fora — MENOS o baldio, que é
           terreno abandonado e é onde entulho e mato fazem sentido */
        if(!q.equip || q.equip.tipo !== 'baldio') return null;
        const a = q.equip.area;
        if(x < a.x0 + 12 || x > a.x1 - 12 || y < a.y0 + 12 || y > a.y1 - 12) return null;
        if(q.solidos && q.solidos.some(o => x > o.x0 - 8 && x < o.x1 + 8 &&
                                            y > o.y0 - 8 && y < o.y1 + 8)) return null;
        return 'baldio';
      }
      return z === 'mato' ? 'mato' : 'aberto';
    }
    const MISTURA = {
      /* quanto de cada família, por lugar */
      mato:   [['mato', 0.66], ['entulho', 0.92], ['terra', 1]],
      aberto: [['mato', 0.55], ['entulho', 0.90], ['terra', 1]],
      baldio: [['entulho', 0.52], ['mato', 0.84], ['terra', 1]]
    };
    const TAM = { mato: [20, 40], entulho: [26, 52], terra: [38, 62], folha: [40, 66] };
    let tentativas = 0;
    while(DECALQUES.length < 1300 && tentativas < 26000){
      tentativas++;
      const x = entreD(20, W - 20), y = entreD(20, H - 20);
      const lugar = ondeCabe(x, y);
      if(!lugar) continue;
      const r = rngD();
      const fam = MISTURA[lugar].find(([, p]) => r <= p)[0];
      const [t0, t1] = TAM[fam];
      por(x, y, escolherD(DEC_FAMILIA[fam]),
          placa(entreD(t0, t1)), rngD()*Math.PI*2);
    }
    /* A SAIA DA MOITA. A moita é duas pirâmides — ela BLOQUEIA, então
       precisa de volume e não pode virar decalque. Só que, ao lado de
       um tufo de capim fotografado, o cone verde chapado fica ainda
       mais falso do que era sozinho. A saída é dar chão a ele: um
       decalque de mato POR BAIXO, maior que a base, de modo que o cone
       vire o corpo do arbusto e a vegetação de verdade apareça em
       volta. É onde a moita já está, então não espalha nada novo. */
    for(const m of MOITAS){
      if(!Number.isFinite(m.x)) continue;
      por(m.x, m.y, escolherD(DEC_FAMILIA.mato),
          placa(m.r*entreD(2.1, 3.0)), rngD()*Math.PI*2);
    }

    /* A FOLHA CAÍDA SOB A ÁRVORE. Só uma peça de folha veio no pack,
       então ela repete — o giro é o que disfarça, e por isso cada
       placa nasce com um ângulo sorteado. */
    for(const a of ARVORES){
      if(!Number.isFinite(a.x) || !Number.isFinite(a.y)) continue;
      if(rngD() < 0.55) continue;
      if(!ondeCabe(a.x, a.y)) continue;
      por(a.x, a.y, DEC_FAMILIA.folha[0],
          placa(a.r*entreD(1.9, 2.8)), rngD()*Math.PI*2);
    }
  })();

  /* =========================================================
     OS MARCOS — cinco prédios modelados peça por peça
     ---------------------------------------------------------
     A igreja matriz, o centro administrativo, o prédio alto, o
     prédio de três andares com o mercado embaixo e a casa de classe
     média. Não são lote sorteado: cada um tem lugar certo, na PONTA
     de um quarteirão (`ponta`), com a fachada virada pra uma rua
     (`frente`).

     POR QUE ENTRAM AQUI, NO FIM, E NÃO JUNTO COM OS EQUIPAMENTOS.
     Tudo o que vem antes gasta o `rng()` compartilhado, e um
     quarteirão com fatia de equipamento gasta DIFERENTE (o quintal
     encolhe, o puxadinho do fundo não sorteia a posição). Posto lá
     em cima, cada marco mexeria no sorteio da cidade inteira dali pra
     frente — já aconteceu uma vez, quando a sede encolheu. Aqui no fim
     ele só troca o que está embaixo dele: a cidade em volta sai igual,
     casa por casa.

     A FATIA. Parte da largura pedida, na ponta do quarteirão, e engole
     os lotes que ela pisa: lote que sobra com 2,5 m ou mais de frente
     do lado de fora é aparado; o que sobra menos que isso sai e a
     fatia cresce até a divisa dele — sem isso ficaria uma fresta de
     meio lote vazio entre o marco e a casa vizinha.

     A MASSA. Cada modelo diz, em metros e no referencial DELE (x da
     esquerda pra direita de quem olha a fachada, z negativo pra dentro
     do terreno), onde ficam os volumes grandes. É a mesma conta pros
     dois lados: aqui ela vira o que bloqueia o boneco e o que a
     câmera não atravessa; no 3D (`js/diajogo/modelos3d.js`) ela é o
     esqueleto em que a fachada é montada. Uma fonte só.
     ========================================================= */
  const MASSAS = {
    igreja(W, D){
      const larg = 12.1, T = 3.225, fz = -0.55;
      const xa = (W - larg)/2, xb = xa + larg, xm = W/2;
      const m = { fz, larg, T, xa, xb, xm, naveZ: fz - 13.5, fundoZ: fz - 20.3,
                  hNave: 9.6, hCornija: 10.05, hFundo: 7.4, hTorre: 13.8 };
      m.volumes = [
        { x0: xa, x1: xa + T, z0: fz - T, z1: fz, alt: 18 },
        { x0: xb - T, x1: xb, z0: fz - T, z1: fz, alt: 18 },
        { x0: xa, x1: xb, z0: m.naveZ, z1: fz, alt: 13.2 },
        { x0: xa, x1: xb, z0: m.fundoZ, z1: m.naveZ, alt: 10.9 },
        { x0: xm - 1.7, x1: xm + 1.7, z0: fz, z1: fz + 0.5, alt: 0.45 }        // os degraus
      ];
      return m;
    },
    predio(W, D){
      const fz = -0.45, p0 = 0.4, p1 = W - 0.4;
      const t1 = W - 1.6, t0 = t1 - 14.4, tz1 = fz - 1.4, tz0 = tz1 - 9.2;
      const m = { fz, p0, p1, pz0: fz - 11.9, chanfro: 2.2, hTerreo: 4.0, hPodio: 7.4,
                  t0, t1, tz0, tz1, andares: 12, pe: 2.9,
                  w0: t0 - 3.3, w1: t0, wz0: fz - 10.15, wz1: tz1 - 1.95, andaresAla: 11 };
      m.hTorre = m.hPodio + m.andares*m.pe + m.pe;
      m.volumes = [
        { x0: p0, x1: p1, z0: m.pz0, z1: fz, alt: 8.2 },
        { x0: t0, x1: t1, z0: tz0, z1: tz1, alt: m.hTorre + 2.6 },
        { x0: m.w0, x1: m.w1, z0: m.wz0, z1: m.wz1, alt: m.hPodio + (m.andaresAla + 1)*m.pe + 0.4 }
      ];
      return m;
    },
    loja(W, D){
      const fz = -0.9;
      const m = { fz, g0: 0.35, g1: 3.95, gz0: fz - 6.0, m0: 3.95, m1: 14.75, mz0: fz - 11.4,
                  c1: Math.min(W - 0.3, 17.95), grade: 0.7, alturas: [3.8, 6.7, 9.6, 10.2] };
      m.volumes = [
        { x0: m.g0, x1: m.g1, z0: m.gz0, z1: fz, alt: 2.9 },
        { x0: m.m0, x1: m.m1, z0: m.mz0, z1: fz, alt: 11.5 },
        { x0: m.c1 - 0.6, x1: m.c1, z0: fz - 4.0, z1: fz, alt: 2.2 },
        /* a grade da frente do mercado: dos lados da porta de enrolar */
        { x0: m.m0 + 0.15, x1: m.m0 + 3.75, z0: fz + m.grade - 0.12, z1: fz + m.grade + 0.12, alt: 2.2 },
        { x0: m.m1 - 3.45, x1: m.m1 - 0.15, z0: fz + m.grade - 0.12, z1: fz + m.grade + 0.12, alt: 2.2 }
      ];
      return m;
    },
    adm(W, D){
      const fz = -1.2, vao = 2.44, recuo = 2.4;
      const m1 = W - 0.5, m0 = m1 - 11*vao, mz0 = fz - 4*vao;
      const m = { fz, vao, recuo, m0, m1, mz0, a0: m0 - 3*vao, a1: m0, az0: mz0, az1: fz - recuo,
                  alturas: [3.4, 6.6, 9.8, 10.6], alturasAla: [3.4, 6.6, 7.4] };
      m.volumes = [
        /* o térreo fechado, atrás da colunata */
        { x0: m0, x1: m1, z0: mz0, z1: fz - recuo, alt: 10.6 },
        /* os andares de cima, por cima da colunata: a câmera não entra,
           o boneco passa embaixo */
        { x0: m0, x1: m1, z0: fz - recuo, z1: fz + 0.2, alt: 10.6, base: 3.4 },
        { x0: m.a0, x1: m.a1, z0: m.az0, z1: m.az1, alt: 7.4 }
      ];
      /* os pilotis, um a cada vão */
      for(let k = 0; k <= 11; k++){
        const x = m0 + k*vao;
        m.volumes.push({ x0: x - 0.25, x1: x + 0.25, z0: fz - 0.25, z1: fz + 0.25, alt: 3.4 });
      }
      return m;
    },
    casa(W, D){
      const fz = -0.5;
      /* 0,35 da divisa dos dois lados: é o que o beiral do telhado avança */
      const m = { fz, a0: 0.35, a1: 5.2, s0: 5.2, s1: Math.min(W - 0.35, 10.3), z0: fz - 12.0 };
      m.volumes = [
        { x0: m.a0, x1: m.a1, z0: m.z0, z1: fz, alt: 4.6 },
        { x0: m.s0, x1: m.s1, z0: m.z0, z1: fz, alt: 8.0 }
      ];
      return m;
    },
    /* O ATACAREJO. O referencial é o do marco com a frente pro norte:
       x cresce da divisa LESTE pra oeste (esquerda pra direita de quem
       olha a loja do estacionamento), z = 0 é a testa da marquise, z
       negativo entra no galpão e z positivo é o estacionamento, até a
       avenida. `norte` é a borda do estacionamento nesse referencial,
       [[x, z], ...], x crescendo. */
    atacadex(W, D, norte){
      const m = { W, D, norte,
                  E0: 2.6, E1: 38.6,              // as paredes leste e oeste do galpão (36 m de frente)
                  zP: -4.5, zF: -30.5,            // a fachada de vidro (sob a marquise) e o fundo (26 m)
                  hM0: 4.6, hM1: 6.1,             // a marquise: a laje embaixo e o alto da testeira
                  hP: 8.8,                        // o alto da platibanda do galpão
                  zCol: -0.7 };                   // o eixo das colunas, pra dentro da testeira
      const zNorte = x => {
        if(x <= norte[0][0]) return norte[0][1];
        for(let i = 1; i < norte.length; i++){
          const [xa, za] = norte[i-1], [xb, zb] = norte[i];
          if(x <= xb) return za + (zb - za)*(x - xa)/(xb - xa);
        }
        return norte[norte.length-1][1];
      };
      m.zNorte = zNorte;
      /* as colunas da marquise, na divisa dos nove vãos de 4 m da vitrine
         (fora da divisa, uma delas caía na frente da porta) */
      const nV = 9, passo = (m.E1 - m.E0)/nV;
      m.colunas = [];
      for(let i = 0; i <= nV; i++) m.colunas.push(m.E0 + i*passo);
      m.vaoPorta = Math.floor(nV/2);             // a porta automática, no vão do meio
      /* a parede oeste: o painel amarelo na quina da frente e as cinco
         docas atrás dele, de 4 em 4 m */
      m.painel = { z0: -10.4, z1: -4.9 };
      m.docas = [-12.4, -16.4, -20.4, -24.4, -28.4];
      m.docaCaminhao = 1;                        // o caminhão encostado na segunda
      /* AS VAGAS: a fileira de frente pra loja e, onde a avenida deixa,
         a de trás; 2,5 × 5 m. Na frente da porta fica a faixa de
         pedestre, sem vaga. */
      const xP0 = m.colunas[m.vaoPorta], xP1 = m.colunas[m.vaoPorta + 1];
      m.faixa = { x0: xP0 + 0.4, x1: xP1 - 0.4, z0: 0, z1: 12.4 };
      m.vagas = [];
      const fileira = (z0, z1) => {
        for(let x = m.E0 + 0.4; x + 2.5 <= m.E1 - 0.4 + 1e-6; x += 2.5){
          if(x < m.faixa.x1 && x + 2.5 > m.faixa.x0) continue;
          if(zNorte(x) < z1 + 0.6 || zNorte(x + 2.5) < z1 + 0.6) continue;
          m.vagas.push({ x0: x, x1: x + 2.5, z0, z1 });
        }
      };
      fileira(2.2, 7.2);
      fileira(13.0, 18.0);
      /* o totem na esquina da avenida com a rua da borda, e os postes na guia */
      m.totem = { x: 1.5, z: zNorte(1.5) - 1.3, larg: 2.4, esp: 0.7, alt: 8.5 };
      m.postes = [9, 21, 33, 47].map(x => ({ x, z: zNorte(x) - 0.6 }));
      const zC = m.docas[m.docaCaminhao];
      m.volumes = [
        { x0: m.E0, x1: m.E1, z0: m.zF, z1: m.zP, alt: m.hP },                       // o galpão
        { x0: m.E0 - 0.4, x1: m.E1 + 0.4, z0: m.zP, z1: 0, alt: m.hM1, base: m.hM0 },  // a marquise: só a câmera
        ...m.colunas.map(x => ({ x0: x - 0.25, x1: x + 0.25, z0: m.zCol - 0.25, z1: m.zCol + 0.25, alt: m.hM0 })),
        ...m.docas.map(z => ({ x0: m.E1, x1: m.E1 + 0.7, z0: z - 1.8, z1: z + 1.8, alt: 4.3 })),
        { x0: m.E1 + 0.6, x1: m.E1 + 13.0, z0: zC - 1.25, z1: zC + 1.25, alt: 4.1 },     // a carreta
        { x0: m.E1 + 13.05, x1: m.E1 + 15.25, z0: zC - 1.2, z1: zC + 1.2, alt: 3.2 },    // o cavalo
        { x0: m.totem.x - m.totem.larg/2, x1: m.totem.x + m.totem.larg/2,
          z0: m.totem.z - m.totem.esp/2, z1: m.totem.z + m.totem.esp/2, alt: m.totem.alt }
      ];
      return m;
    },
    /* OS DOIS PRÉDIOS DO BALDIO, cada um no seu meio terreno (22 × 19,6
       m), com a frente pro oeste — a rua entre o baldio e a rua sem
       saída. Referencial do marco: x da esquerda pra direita de quem
       olha a fachada (do norte pro sul), z = 0 no muro da frente, z
       negativo entrando no terreno. Os dois dividem o muro do
       condomínio: frente, fundo e o lado que dá pra rua.

       O EDIFÍCIO MIRANTE: concreto cinza, 18 andares sobre o térreo. A
       frente é partida por um RASGO fundo com a cortina de vidro azul,
       e a quina da direita é outra faixa de vidro que dobra pro lado.
       A massa da esquerda para um andar antes; a da direita sobe na
       coroa da casa de máquinas. Na frente, a caixa da portaria. */
    torre1(W, D){
      const m = { W, D, x0: 3.0, x1: W - 3.0, zf: -4.4, zb: -16.6,
                  hT: 3.6, pe: 2.9, andares: 18,
                  e1: 8.2, r1: 10.0, q0: W - 4.8,           // a massa da esquerda, o rasgo, a da direita, a quina de vidro
                  fundoRasgo: 1.5, dobra: 1.8, muro: 2.4, ladoRua: 'esq',
                  recMuro: 0.15 };                         // o muro recua da divisa: a pixação sai à frente dele
      m.hTopo = m.hT + m.andares*m.pe;                      // 55,8 m
      m.hEsq = m.hTopo - m.pe;
      m.coroa = { x0: m.r1, x1: m.q0, z0: -12.0, z1: m.zf, alt: m.hTopo + 3.8 };
      m.portaria = { x0: 12.2, x1: 16.2, z0: m.zf, z1: m.zf + 2.8, alt: 3.5 };
      m.guarita = { x0: 9.6, x1: 11.4, z0: -2.2, z1: -m.recMuro, alt: 2.7 };
      m.pedestre = { a0: 13.6, a1: 14.8 };                  // no muro da frente, em x
      m.portao = { a0: W - 4.2, a1: W - 0.3 };
      /* o jardim: a frente da esquerda, o recuo do lado da rua e o fundo */
      m.jardins = [{ x0: 0.25, x1: 9.4, z0: m.zf, z1: -0.25 },
                   { x0: 0.25, x1: m.x0, z0: -D + 0.25, z1: m.zf },
                   { x0: m.x0, x1: m.x1, z0: -D + 0.25, z1: m.zb }];
      m.arvores = [[1.6, -2.2], [5.6, -2.6], [1.5, -10.5]];
      m.volumes = [
        { x0: m.x0, x1: m.x1, z0: m.zb, z1: m.zf, alt: m.hTopo + 1.0 },
        m.coroa,
        m.portaria, m.guarita,
        { x0: 0, x1: W, z0: -m.recMuro - 0.25, z1: -m.recMuro, alt: m.muro },    // o muro da frente
        { x0: m.recMuro, x1: m.recMuro + 0.25, z0: -D, z1: 0, alt: m.muro },     // o do lado da rua
        { x0: 0, x1: W, z0: -D, z1: -D + 0.25, alt: m.muro }                     // o do fundo
      ];
      return m;
    },
    /* O RESIDENCIAL BELA VISTA: quadro branco, os dois painéis de
       tijolinho laranja e, no meio, as duas colunas de sacada de vidro
       azul com a borda branca da laje, separadas pela ALETA branca que
       passa do telhado. 15 andares sobre um térreo alto, e o PÓRTICO
       branco na frente, com o nome na viga. */
    torre2(W, D){
      const m = { W, D, x0: 3.0, x1: W - 3.0, zf: -5.0, zb: -17.0,
                  hT: 4.2, pe: 2.9, andares: 15, muro: 2.4, ladoRua: 'dir',
                  canto: 1.2, sacada: 2.7, aleta: 0.6, fundoSacada: 1.1, recMuro: 0.15 };
      m.hTopo = m.hT + m.andares*m.pe;                      // 47,7 m
      const xm = (m.x0 + m.x1)/2;
      m.xm = xm;
      m.tij = (m.x1 - m.x0 - 2*m.canto - 2*m.sacada - m.aleta)/2;   // cada painel de tijolo
      m.aletaV = { x0: xm - m.aleta/2, x1: xm + m.aleta/2, z0: m.zf, z1: m.zf + 0.9, alt: m.hTopo + 3.8 };
      m.portico = { x0: 3.4, x1: 18.6, z0: -2.9, z1: -1.7, y0: 5.4, y1: 6.7, pilar: 0.8 };
      m.guarita = { x0: 13.2, x1: 15.0, z0: -1.6, z1: -m.recMuro, alt: 2.7 };
      m.pedestre = { a0: xm - 0.6, a1: xm + 0.6 };
      m.portao = { a0: W - 4.0, a1: W - 0.4 };
      m.jardins = [{ x0: 0.25, x1: m.portico.x0 - 0.2, z0: m.zf, z1: -0.25 },
                   { x0: m.portico.x0 + 1.0, x1: xm - 1.4, z0: -1.5, z1: -0.25 },
                   { x0: m.x0, x1: m.x1, z0: -D + 0.25, z1: m.zb }];
      m.arvores = [[1.4, -2.4], [6.2, -0.9]];
      const P = m.portico;
      m.volumes = [
        { x0: m.x0, x1: m.x1, z0: m.zb, z1: m.zf, alt: m.hTopo + 1.0 },
        m.aletaV,
        { x0: P.x0, x1: P.x1, z0: P.z0, z1: P.z1, alt: P.y1, base: P.y0 },       // a viga: só a câmera
        { x0: P.x0, x1: P.x0 + P.pilar, z0: P.z0, z1: P.z1, alt: P.y0 },
        { x0: P.x1 - P.pilar, x1: P.x1, z0: P.z0, z1: P.z1, alt: P.y0 },
        m.guarita,
        { x0: 0, x1: W, z0: -m.recMuro - 0.25, z1: -m.recMuro, alt: m.muro },
        { x0: W - m.recMuro - 0.25, x1: W - m.recMuro, z0: -D, z1: 0, alt: m.muro },
        { x0: 0, x1: W, z0: -D, z1: -D + 0.25, alt: m.muro }
      ];
      return m;
    }
  };

  /* o referencial do modelo (metros, x pra direita de quem olha a
     fachada, z negativo pra dentro) → o mundo. É uma rotação de 0°,
     90°, 180° ou 270°: nunca espelha, então letreiro não sai ao
     contrário. */
  function paraMundoDoMarco(f, frente, lx, lz){
    const M = METRO;
    if(frente === 's') return [f.x0 + lx*M, f.y1 + lz*M];
    if(frente === 'n') return [f.x1 - lx*M, f.y0 - lz*M];
    if(frente === 'o') return [f.x0 - lz*M, f.y0 + lx*M];
    return [f.x1 + lz*M, f.y1 - lx*M];                                // 'l'
  }
  function retDoMarco(f, frente, v){
    const [ax, ay] = paraMundoDoMarco(f, frente, v.x0, v.z0);
    const [bx, by] = paraMundoDoMarco(f, frente, v.x1, v.z1);
    return { x0: Math.min(ax, bx), x1: Math.max(ax, bx), y0: Math.min(ay, by), y1: Math.max(ay, by) };
  }

  const MARCOS = [
    /* a matriz ao sul da Praça da Matriz: a praça já tinha o nome e
       não tinha igreja. A fachada dá pra rua de oeste, e o lado
       comprido fica de frente pra praça, do outro lado da rua. */
    { modelo: 'igreja', ponto: pxm(568, 964),  ponta: 'o', frente: 'o', larg: 21.3, chao: '#b5afa0' },
    /* o centro administrativo de frente pro hospital */
    { modelo: 'adm',    ponto: pxm(765, 534),  ponta: 'o', frente: 'n', larg: 37.5, chao: '#b5afa0' },
    /* o prédio alto no meio da cidade, com a quina chanfrada na esquina */
    { modelo: 'predio', ponto: pxm(568, 620),  ponta: 'l', frente: 'n', larg: 17.5, chao: '#b5afa0' },
    /* o mercado na esquina da rua que a torcida da casa sobe pro estádio */
    { modelo: 'loja',   ponto: pxm(419, 534),  ponta: 'l', frente: 'n', larg: 17.0, chao: '#9d9a90' },
    /* a casa de classe média na esquina do bairro residencial do sul */
    { modelo: 'casa',   ponto: pxm(568, 1050), ponta: 'o', frente: 'n', larg: 10.5, chao: '#9d9a90' }
  ];
  const MARCOS_POSTOS = [];
  for(const mc of MARCOS){
    const q = celulaEm(mc.ponto[0], mc.ponto[1]);
    /* só em quarteirão reto, inteiro e sem equipamento: a fatia é um
       retângulo e a massa não sabe se desviar de costa nem de avenida */
    if(!q || q.tipo !== 'quadra' || q.equip) continue;
    if(q.polMiolo.length !== 4 || q.lotes.some(l => l.ang)) continue;
    const f = mc.ponta === 'o' ? { x0: q.ix0, x1: q.ix0 + mc.larg*METRO }
                               : { x0: q.ix1 - mc.larg*METRO, x1: q.ix1 };
    f.y0 = q.iy0; f.y1 = q.iy1;
    if(tocaAvenida(f, CALC)) continue;
    const SOBRA_MIN = 48;
    const tirar = l => {
      q.lotes.splice(q.lotes.indexOf(l), 1);
      LOTES.splice(LOTES.indexOf(l), 1);
    };
    for(let volta = 0; volta < 8; volta++){
      let cresceu = false;
      for(const l of q.lotes.slice()){
        if(!cruzaRet(l, f)) continue;
        const sobra = mc.ponta === 'o' ? l.x1 - f.x1 : f.x0 - l.x0;
        if(sobra >= SOBRA_MIN){
          if(mc.ponta === 'o') l.x0 = f.x1; else l.x1 = f.x0;
        } else {
          tirar(l);
          if(sobra > 0){
            if(mc.ponta === 'o') f.x1 = l.x1; else f.x0 = l.x0;
            cresceu = true;
          }
        }
      }
      if(!cresceu) break;
    }
    q.fundos = (q.fundos || []).filter(p => !cruzaRet(p, f));
    if(q.quintal){
      if(mc.ponta === 'o') q.quintal.x0 = Math.max(q.quintal.x0, f.x1);
      else q.quintal.x1 = Math.min(q.quintal.x1, f.x0);
      if(q.quintal.x1 - q.quintal.x0 < 24) q.quintal = null;
    }
    const W = (mc.frente === 'n' || mc.frente === 's' ? f.x1 - f.x0 : f.y1 - f.y0)/METRO;
    const D = (mc.frente === 'n' || mc.frente === 's' ? f.y1 - f.y0 : f.x1 - f.x0)/METRO;
    const massa = MASSAS[mc.modelo](W, D);
    const pecas = [{ k: 'modelo', modelo: mc.modelo, frente: mc.frente, fatia: { ...f }, W, D, massa, bloqueia: false }];
    const volumes = massa.volumes.map(v => Object.assign(retDoMarco(f, mc.frente, v), { alt: v.alt*METRO, base: (v.base || 0)*METRO }));
    /* ÁRVORE DE CALÇADA CUJA COPA ENCOSTA NO PRÉDIO SAI: a copa tampava
       a fachada da igreja e entrava na parede do prédio alto. Só essas —
       a primeira versão tirava tudo o que estava a 60 cm da fatia e
       levou 28 árvores, a calçada dos cinco quarteirões inteira. */
    const encosta = a => volumes.some(v => a.x + a.r > v.x0 - 8 && a.x - a.r < v.x1 + 8 &&
                                           a.y + a.r > v.y0 - 8 && a.y - a.r < v.y1 + 8);
    for(let i = ARVORES.length - 1; i >= 0; i--) if(encosta(ARVORES[i])) ARVORES.splice(i, 1);
    for(const c of CELULAS) if(c.arvores) c.arvores = c.arvores.filter(a => !encosta(a));
    /* o que toca o chão bloqueia o boneco; o que flutua (o andar por
       cima da colunata) só a câmera enxerga */
    for(const v of volumes) if(!v.base) pecas.push(Object.assign({ k: 'volume', bloqueia: true }, v));
    const noMundo = (lx, lz) => paraMundoDoMarco(f, mc.frente, lx, lz);
    /* a direção pra onde a fachada olha, no mundo */
    const olha = { n: [0, -1], s: [0, 1], o: [-1, 0], l: [1, 0] }[mc.frente];
    if(mc.modelo === 'adm'){
      /* a placa de pé na frente e dois carros no pátio da ala */
      const [lx, ly] = noMundo(massa.m0 + 5.5*massa.vao, -0.45);
      pecas.push({ k: 'letreiro', x: lx, y: ly, ox: olha[0], oz: olha[1], texto: 'CENTRO ADMINISTRATIVO',
                   placa: true, larg: 150, altura: 24, base: 30, pernas: true, bloqueia: false });
      for(const [cx, cz] of [[2.2, -4.0], [4.9, -4.0]]){
        const r = retDoMarco(f, mc.frente, { x0: cx - 1.0, x1: cx + 1.0, z0: cz - 2.2, z1: cz + 2.2 });
        pecas.push(Object.assign({ k: 'carro', cor: cx < 3 ? '#8a8f96' : '#2a4f9a', bloqueia: true }, r));
      }
    }
    q.equip = { tipo: 'marco', modelo: mc.modelo, area: { ...f }, chao: mc.chao, pisoPBR: true, pecas, volumes };
    q.solidos = pecas.filter(o => o.bloqueia);
    MARCOS_POSTOS.push({ modelo: mc.modelo, quadra: [q.i, q.j], fatia: { ...f }, frente: mc.frente, W, D });
  }
  /* =========================================================
     O ATACAREJO — o ATACADEX, no mato a oeste da cidade
     ---------------------------------------------------------
     No lugar que o dono marcou no mapa: entre a avenida do oeste e a
     trilha de terra, encostado na rua da borda da cidade. É por ele
     que o tabuleiro cresceu pra oeste (`DX`). Entra no fim, como os
     marcos: não sorteia nada e só tira o que está embaixo — as
     moitas, o pedaço da trilha, as árvores e as cinco casas de beira
     do lado sul da avenida.
     ========================================================= */
  const ATACADEX = (function(){
    const M = METRO;
    const f = { x0: -1010, x1: 40, y0: 2990, y1: 3622 };        // y0: a testa da marquise
    /* a borda do estacionamento é a da faixa da avenida (asfalto e
       calçada) mais a guia, medida de 30 em 30 */
    const bordaAv = x => {
      let y = 2300;
      while(!naAvenida(x, y) && y < 3000) y += 1;
      while(naAvenida(x, y)) y += 1;
      return y;
    };
    const GUIA = 12;
    const norteMundo = [];
    for(let x = f.x1; x > f.x0; x -= 30) norteMundo.push([x, bordaAv(x) + GUIA]);
    norteMundo.push([f.x0, bordaAv(f.x0) + GUIA]);
    const norte = norteMundo.map(([x, y]) => [(f.x1 - x)/M, (f.y0 - y)/M]);
    const W = (f.x1 - f.x0)/M, D = (f.y1 - f.y0)/M;
    const massa = MASSAS.atacadex(W, D, norte);
    const noMundo = (lx, lz) => paraMundoDoMarco(f, 'n', lx, lz);
    const volumes = massa.volumes.map(v => Object.assign(retDoMarco(f, 'n', v), { alt: v.alt*M, base: (v.base || 0)*M }));
    const solidos = volumes.filter(v => !v.base);
    /* o terreno inteiro: da guia da avenida ao fundo do galpão */
    const area = norteMundo.concat([[f.x0, f.y1], [f.x1, f.y1]]);
    const noTerreno = (x, y, r) => {
      if(!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('atacarejo: ponto sem coordenada');
      if(dentroPol(x, y, area)) return true;
      if(!r) return false;
      for(const [dx, dy] of [[r,0],[-r,0],[0,r],[0,-r]]) if(dentroPol(x + dx, y + dy, area)) return true;
      return false;
    };

    /* o que estava embaixo sai: as moitas (do balde também, senão a
       moita some do desenho e continua barrando o boneco) ... */
    for(let i = MOITAS.length - 1; i >= 0; i--) if(noTerreno(MOITAS[i].x, MOITAS[i].y, MOITAS[i].r)) MOITAS.splice(i, 1);
    for(const [k, l] of baldes) baldes.set(k, l.filter(m => !noTerreno(m.x, m.y, m.r)));
    /* ... as casas de beira do lado sul da avenida ... */
    const meio = l => l.ang ? [l.cx, l.cy] : [(l.x0 + l.x1)/2, (l.y0 + l.y1)/2];
    const fora = BEIRA.filter(l => !l.favela && noTerreno(...meio(l)));
    for(const l of fora){
      BEIRA.splice(BEIRA.indexOf(l), 1);
      if(LOTES.includes(l)) LOTES.splice(LOTES.indexOf(l), 1);
    }
    for(const [k, l] of baldesBeira) baldesBeira.set(k, l.filter(o => !fora.includes(o)));
    /* ... as árvores e os postes ... */
    for(let i = ARVORES.length - 1; i >= 0; i--) if(noTerreno(ARVORES[i].x, ARVORES[i].y, ARVORES[i].r)) ARVORES.splice(i, 1);
    for(const c of CELULAS) if(c.arvores) c.arvores = c.arvores.filter(a => !noTerreno(a.x, a.y, a.r));
    for(let i = POSTES.length - 1; i >= 0; i--) if(noTerreno(POSTES[i].x, POSTES[i].y)) POSTES.splice(i, 1);
    /* ... o capim e o entulho pintados no chão (no asfalto eles boiavam) ... */
    for(let i = DECALQUES.length - 1; i >= 0; i--) if(noTerreno(DECALQUES[i].x, DECALQUES[i].y, DECALQUES[i].tam/2)) DECALQUES.splice(i, 1);
    /* ... e o pedaço da trilha que atravessava: ela passa a chegar
       até o muro de trás e recomeçar do outro lado */
    const corte = { x0: f.x0 - 12, x1: f.x1 + 12, y0: Math.min(...norteMundo.map(p => p[1])) - 12, y1: f.y1 + 12 };
    const dentroCorte = (x, y) => x > corte.x0 && x < corte.x1 && y > corte.y0 && y < corte.y1;
    const cortarTrilha = t => {
      const pedacos = []; let atual = [];
      for(let i = 0; i < t.length; i++){
        const p = t[i];
        if(!dentroCorte(p[0], p[1])){
          if(i > 0 && dentroCorte(t[i-1][0], t[i-1][1])) atual.push(saidaDoCorte(p, t[i-1]));
          atual.push(p);
        } else if(i > 0 && !dentroCorte(t[i-1][0], t[i-1][1])){
          atual.push(saidaDoCorte(t[i-1], p));
          if(atual.length > 1) pedacos.push(atual);
          atual = [];
        }
      }
      if(atual.length > 1) pedacos.push(atual);
      return pedacos;
    };
    /* o ponto em que o segmento de fora (a) pra dentro (b) cruza a borda */
    function saidaDoCorte(a, b){
      let lo = 0, hi = 1;
      for(let k = 0; k < 30; k++){
        const t = (lo + hi)/2, x = a[0] + (b[0] - a[0])*t, y = a[1] + (b[1] - a[1])*t;
        if(dentroCorte(x, y)) hi = t; else lo = t;
      }
      return [a[0] + (b[0] - a[0])*lo, a[1] + (b[1] - a[1])*lo];
    }
    const trilhas = [];
    for(const t of TRILHAS) for(const p of cortarTrilha(t)) trilhas.push(p);
    TRILHAS.length = 0;
    for(const t of trilhas) TRILHAS.push(t);

    /* O ESTACIONAMENTO: uns carros nas vagas (sem sorteio: um padrão
       fixo, que deixa vaga livre na frente da porta e no fundo) */
    const CORES = ['#e8e6e0', '#8a8f96', '#23272c', '#b8bcc1', '#a3312c', '#2a4f9a', '#d7d3c6', '#4d5a3f'];
    const vagas = massa.vagas.map(v => retDoMarco(f, 'n', v));
    vagas.forEach((v, i) => {
      if((i*7 + 3) % 11 >= 5) return;
      const mx = (v.x0 + v.x1)/2, my = (v.y0 + v.y1)/2;
      CARROS.push({ x0: Math.round(mx - 0.9*M), x1: Math.round(mx + 0.9*M), y0: Math.round(my - 2.15*M), y1: Math.round(my + 2.15*M),
                    cor: CORES[(i*5 + 1) % CORES.length] });
    });
    /* os postes na guia da avenida, com o braço pra dentro do estacionamento */
    for(const pt of massa.postes){ const [x, y] = noMundo(pt.x, pt.z); POSTES.push({ x, y, dx: 0, dz: 1 }); }

    return { modelo: 'atacadex', frente: 'n', fatia: { ...f }, W, D, massa, area, volumes, solidos,
             caixa: { x0: f.x0 - 40, x1: f.x1 + 40, y0: corte.y0 - 40, y1: f.y1 + 40 } };
  })();
  /* =========================================================
     AS CASAS DE MURO — três de cada modelo, espalhadas pelo mapa
     ---------------------------------------------------------
     O dono mandou quatro casas de muro (a da garagem coberta com o
     gradil, a do muro alto com a torrinha da caixa d'água, a do
     quintal com a porta no corredor e a casinha no meio do lote) e
     pediu TRÊS DE CADA, espalhadas, cada uma diferente da outra (a
     roupa de cada uma sai do hash da posição, no `casas3d.js`). Quem
     escolhe o lote é esta conta, sem sorteio nenhum: um modelo por
     vez, a casa térrea comum (sem comércio, fora da favela, no
     tabuleiro de antes do atacarejo) que cabe o modelo e fica MAIS
     LONGE das já escolhidas.
     A primeira é a mais perto do meio da cidade.
     ========================================================= */
  (function(){
    const MIN = { m1: [4.6, 4.6], m2: [4.8, 4.6], m3: [4.2, 4.3], m4: [3.6, 4.0] };
    const medida = l => {
      if(l.ang) return [l.w/METRO, l.h/METRO];
      const nS = l.frente === 'n' || l.frente === 's';
      return [(nS ? l.x1 - l.x0 : l.y1 - l.y0)/METRO, (nS ? l.y1 - l.y0 : l.x1 - l.x0)/METRO];
    };
    const centro = l => l.ang ? [l.cx, l.cy] : [(l.x0 + l.x1)/2, (l.y0 + l.y1)/2];
    const cands = LOTES.filter(l => {
      if(l.tipo !== 'casa' || l.favela || l.placa || l.modelo) return false;
      const [x, y] = centro(l);
      /* dentro do tabuleiro de antes: a faixa nova a oeste é mato de beira
         de estrada, e casa escolhida lá ficava na borda do mapa */
      return x > 40 && x < W - 40 && y > 40 && y < H - 40;
    });
    const [mx, my] = pxm(700, 600);                 // o meio da cidade
    const postas = [];
    for(const tipo of ['m1', 'm2', 'm3', 'm4', 'm1', 'm2', 'm3', 'm4', 'm1', 'm2', 'm3', 'm4']){
      const [wm, dm] = MIN[tipo];
      let melhor = null, nota = -Infinity;
      for(const l of cands){
        if(l.muro) continue;
        const [w, d] = medida(l);
        if(w < wm || d < dm) continue;
        const [x, y] = centro(l);
        const n = postas.length ? Math.min(...postas.map(([a, b]) => Math.hypot(x - a, y - b))) : -Math.hypot(x - mx, y - my);
        if(n > nota){ nota = n; melhor = l; }
      }
      if(!melhor) continue;
      melhor.muro = tipo;
      postas.push(centro(melhor));
    }
  })();

  /* =========================================================
     A RUA SEM SAÍDA — no miolo do quarteirão ao sul da avenida
     ---------------------------------------------------------
     O dono marcou no mapa o miolo do quarteirão 2,2 (o fundo de
     quintal com os puxadinhos, entre a avenida noroeste e a rua da
     delegacia) e pediu uma rua sem saída com casas em volta. Ela
     entra pela rua do sul no lugar de um sobrado, sobe pelo meio do
     quarteirão e acaba num T — o retorno —, encostado no fundo das
     casas da avenida. Em volta, dez lotes novos: três de cada lado da
     haste, de frente pra ela, três de frente pro T e um muro na ponta
     de oeste, onde o fundo das casas da avenida só deixa 2 m de chão.

     Entra no fim, como o atacarejo e DEPOIS das casas de muro: não
     sorteia nada (a cidade continua igual, e as doze casas de muro
     são as mesmas) e só mexe no que estava embaixo — o quintal, os
     puxadinhos, o sobrado da boca e o vizinho dele, que estreita. O
     que a rua é fica em `q.semSaida`: o asfalto e as calçadas, em
     retângulos, e a guia em volta do asfalto. Quem pinta o chão, quem
     monta a laje e quem diz onde se anda leem dali.
     ========================================================= */
  const SEM_SAIDA = (function(){
    const q = QUADRAS.find(c => c.i === 2 && c.j === 2);
    const Q = q && q.quintal;
    if(!Q) throw new Error('rua sem saída: o quarteirão 2,2 não tem mais o quintal do miolo');
    const ASF = 110, CAL = 30;                 // 5,7 m de asfalto e 1,5 m de calçada
    /* A BOCA: o lote da face sul que está no meio do quintal sai
       inteiro, e a rua começa na divisa oeste dele — a parede do
       galpão vizinho vira a quina da calçada */
    const xc = (Q.x0 + Q.x1)/2;
    const boca = q.lotes.find(l => !l.ang && l.frente === 's' && l.x0 <= xc && l.x1 > xc);
    const xs0 = boca.x0, xs1 = xs0 + 2*CAL + ASF;
    const xa0 = xs0 + CAL, xa1 = xs1 - CAL;
    /* três lotes de 4,8 m de frente de cada lado da haste; o T (5,1 m
       de asfalto) logo acima deles, de uma ponta à outra do quintal */
    const FRENTE = 94;
    const yR0 = Q.y1 - 3*FRENTE;
    const yT1 = yR0 - CAL, yT0 = yT1 - 100, yN = yT0 - CAL;
    const asfalto = [
      { x0: xa0, x1: xa1, y0: yT1, y1: q.y1 },                  // a haste, até o asfalto da rua do sul
      { x0: Q.x0 + CAL, x1: Q.x1 - CAL, y0: yT0, y1: yT1 }      // o T
    ];
    const calcadas = [
      { x0: Q.x0, x1: Q.x1, y0: yN, y1: yT0 },                  // a do norte do T
      { x0: Q.x0, x1: Q.x0 + CAL, y0: yT0, y1: yT1 },           // as duas pontas do T
      { x0: Q.x1 - CAL, x1: Q.x1, y0: yT0, y1: yT1 },
      { x0: Q.x0, x1: xa0, y0: yT1, y1: yR0 },                  // as do sul do T
      { x0: xa1, x1: Q.x1, y0: yT1, y1: yR0 },
      { x0: xs0, x1: xa0, y0: yR0, y1: q.iy1 },                 // as da haste, até a calçada da rua
      { x0: xa1, x1: xs1, y0: yR0, y1: q.iy1 }
    ];
    /* a guia contorna o asfalto e fica aberta na boca */
    const guia = [[xa0, q.y1], [xa0, yT1], [Q.x0 + CAL, yT1], [Q.x0 + CAL, yT0],
                  [Q.x1 - CAL, yT0], [Q.x1 - CAL, yT1], [xa1, yT1], [xa1, q.y1]];

    /* o que estava embaixo sai: o quintal e os puxadinhos dele ... */
    q.quintal = null;
    q.fundos = [];
    /* ... e a face sul na boca: o lote que fica inteiro dentro dela
       sai, o que passa da divisa encolhe (e sai se sobrar menos de
       2 m de frente) */
    for(const l of q.lotes.slice()){
      if(l.ang || l.frente !== 's' || l.x1 <= xs0 || l.x0 >= xs1) continue;
      const a = l.x0 < xs0 ? l.x0 : xs1, b = l.x0 < xs0 ? xs0 : l.x1;
      if(b - a < 40){ q.lotes.splice(q.lotes.indexOf(l), 1); LOTES.splice(LOTES.indexOf(l), 1); continue; }
      l.x0 = a; l.x1 = b;
    }

    /* OS LOTES NOVOS, sem sorteio: tipo, altura e cor por posição. A
       casa que vai em cada um (e a roupa dela) sai do hash da posição
       no `casas3d.js`, como no resto da cidade. */
    const ALTS = { casa: [72, 80], sobrado: [120, 128, 136], muro: [40, 48] };
    const novos = [];
    const novo = (frente, tipo, x0, x1, y0, y1, k) => {
      const cores = TIPOS[tipo].cor;
      const l = { quadra: q, frente, tipo, x0, x1, y0, y1, semSaida: true,
                  alt: ALTS[tipo][k % ALTS[tipo].length], cor: cores[(k*3 + 1) % cores.length] };
      LOTES.push(l); q.lotes.push(l); novos.push(l);
      return l;
    };
    const fileira = i => [yR0 + i*FRENTE, i < 2 ? yR0 + (i + 1)*FRENTE : Q.y1];
    ['casa', 'sobrado', 'casa'].forEach((t, i) => novo('l', t, Q.x0, xs0, ...fileira(i), i));
    ['casa', 'casa', 'sobrado'].forEach((t, i) => novo('o', t, xs1, Q.x1, ...fileira(i), i + 3));
    /* De frente pro T: o chão começa no fundo das casas da avenida
       (que são giradas e entram no quintal) e da pracinha da cunha. */
    const fundoLivre = (a, b) => {
      let y = Q.y0;
      for(const l of q.lotes){
        if(!l.ang) continue;
        const pol = cortarPor(cortarPor(cantosDoLote(l).slice(0, 4), -1, 0, -a), 1, 0, b);
        for(const p of pol) y = Math.max(y, p[1]);
      }
      for(const pr of q.pracinhas || []) for(const t of pr.tiras) if(t.x1 > a && t.x0 < b) y = Math.max(y, t.y1);
      return y > Q.y0 ? Math.ceil(y + 4) : Q.y0;
    };
    const passo = (Q.x1 - Q.x0)/4;
    for(let i = 0; i < 4; i++){
      const a = Q.x0 + i*passo, b = i < 3 ? a + passo : Q.x1;
      const y0 = fundoLivre(a, b), fundo = (yN - y0)/METRO;
      /* sem 3 m de fundo não cabe casa: vira o muro de um terreno
         vazio, com o recado de sempre de rua sem saída */
      if(fundo < 3){
        const m = novo('s', 'muro', a, b, yN - 12, yN, i);
        m.pixacao = 'É PROIBIDO JOGAR LIXO';
      } else novo('s', fundo < 6 ? 'casa' : 'sobrado', a, b, y0, yN, i + 6);
    }
    /* um carro parado na guia da haste; o T fica livre, que é o retorno */
    CARROS.push({ x0: Math.round(xa1 - 4 - 1.8*METRO), x1: xa1 - 4, y0: yR0 + 60, y1: Math.round(yR0 + 60 + 4.3*METRO),
                  cor: '#8a8f96' });

    const livre = asfalto.concat(calcadas);
    q.semSaida = { asfalto, calcadas, livre, guia, lotes: novos,
                   caixa: { x0: Q.x0, x1: Q.x1, y0: yN, y1: q.y1 } };
    return q.semSaida;
  })();
  /* =========================================================
     OS DOIS PRÉDIOS NO BALDIO
     ---------------------------------------------------------
     O dono pediu que o terreno baldio virasse dois prédios no estilo
     do prédio alto do centro (modelado peça por peça, com a folha de
     textura dele), sendo os dois das fotos que mandou: o EDIFÍCIO
     MIRANTE, de concreto cinza com o rasgo de vidro azul, e o
     RESIDENCIAL BELA VISTA, de quadro branco, tijolinho e sacadas de
     vidro. O miolo murado do baldio vira o condomínio dos dois, um em
     cada metade, de frente pra rua de oeste; a fileira de bares e
     lojas virada pro estádio fica como estava (também foi pedido dele).

     Entra no fim, como os marcos: não sorteia nada e só troca o que
     estava no miolo — o muro, o mato pintado, o entulho, os carros
     largados, as árvores e o poste de dentro —, e o chão de terra
     batida vira piso. A pixação de torcida do muro grande (a que dá
     pra cobrir) passa pro muro do condomínio na mesma rua, com o mesmo
     dizer. O condomínio é fechado: o terreno inteiro barra o boneco, e
     o prédio, o pórtico e o muro barram a câmera (`q.equip.volumes`).
     ========================================================= */
  const PREDIOS_BALDIO = (function(){
    const q = QUADRAS.find(c => c.equip && c.equip.tipo === 'baldio');
    if(!q) return [];
    const eq = q.equip, Mr = eq.murado;
    const noMurado = o => o.x0 !== undefined ? o.x0 < Mr.x1 && o.x1 > Mr.x0 && o.y0 < Mr.y1 && o.y1 > Mr.y0
                                             : o.x >= Mr.x0 && o.x < Mr.x1 && o.y >= Mr.y0 && o.y < Mr.y1;
    const pixo = eq.pecas.find(o => o.k === 'letreiro' && o.pixo && noMurado(o));
    eq.pecas = eq.pecas.filter(o => !noMurado(o));
    /* os postes da calçada dos bares dão pra rua do estádio: viram poste
       de rua (o de concreto, com cruzeta e luminária) */
    for(const o of eq.pecas) if(o.k === 'poste') POSTES.push({ x: o.x, y: o.y, dx: o.dx, dz: o.dz });
    eq.pecas = eq.pecas.filter(o => o.k !== 'poste');
    eq.chao = '#b5afa0';
    eq.pisoPBR = true;
    eq.volumes = [];
    const ym = (Mr.y0 + Mr.y1)/2;
    const terrenos = [{ modelo: 'torre1', f: { x0: Mr.x0, x1: Mr.x1, y0: Mr.y0, y1: ym } },
                      { modelo: 'torre2', f: { x0: Mr.x0, x1: Mr.x1, y0: ym, y1: Mr.y1 } }];
    const postos = [];
    for(const { modelo, f } of terrenos){
      const W = (f.y1 - f.y0)/METRO, D = (f.x1 - f.x0)/METRO;
      const massa = MASSAS[modelo](W, D);
      eq.pecas.push({ k: 'modelo', modelo, frente: 'o', fatia: { ...f }, W, D, massa, bloqueia: false });
      for(const v of massa.volumes)
        eq.volumes.push(Object.assign(retDoMarco(f, 'o', v), { alt: v.alt*METRO, base: (v.base || 0)*METRO }));
      eq.pecas.push({ k: 'volume', bloqueia: true, x0: f.x0, x1: f.x1, y0: f.y0, y1: f.y1 });
      /* o jardim é chão pintado (grama no mapa e no material do chão);
         a laje do pátio já veste o material do chão, então ele não
         precisa de caixa no 3D */
      for(const j of massa.jardins)
        eq.pecas.push(Object.assign({ k: 'piso', cor: '#4e7f40', soMapa: true, bloqueia: false }, retDoMarco(f, 'o', j)));
      for(const [lx, lz] of massa.arvores){
        const [x, y] = paraMundoDoMarco(f, 'o', lx, lz);
        eq.pecas.push({ k: 'arvore', x, y, r: 15, bloqueia: false });
      }
      postos.push({ modelo, quadra: [q.i, q.j], fatia: { ...f }, frente: 'o', W, D });
    }
    if(pixo){
      /* a face de fora do muro do lado da rua do sul */
      const f = terrenos[1].f;
      Object.assign(pixo, { y: f.y1 - 0.15*METRO, ox: 0, oz: 1, x: Math.min(Math.max(pixo.x, f.x0 + 90), f.x1 - 90) });
      eq.pecas.push(pixo);
    }
    q.solidos = eq.pecas.filter(o => o.bloqueia);
    /* o mato e o entulho que eram decalque no chão do baldio saem */
    for(let i = DECALQUES.length - 1; i >= 0; i--){
      const d = DECALQUES[i], r = d.tam/2;
      if(d.x + r > Mr.x0 && d.x - r < Mr.x1 && d.y + r > Mr.y0 && d.y - r < Mr.y1) DECALQUES.splice(i, 1);
    }
    return postos;
  })();

  /* =========================================================
     OS PROPS DE RUA
     ---------------------------------------------------------
     O dono mandou um pacote de mobiliário urbano — contêiner de lixo,
     lixeiras de coleta seletiva, sacos, caixas de papelão, cestos,
     barreira de concreto, caixa de correio, hidrante, balizadores,
     delineador, cone, cinzeiro e banco de madeira — e pediu que fosse
     espalhado pelas calçadas: os sacos de lixo do lado dos tambores de
     lixo, e as caixas junto; os cestos e o banco de madeira na praça.
     O poste fica de fora: ele vai mandar o dele.

     ONDE. Na faixa de serviço da calçada do quarteirão — a que encosta
     na guia, onde fica o que é da rua e não da casa —, um ponto
     candidato a cada 150 (7,7 m), longe da esquina. O HASH do ponto
     diz se ali tem alguma coisa e o quê; nada sai do `rng()`, então a
     cidade é a mesma e o ponto também, toda vez. Um grupo só entra se
     CADA peça dele cabe na calçada (nem no asfalto, nem no lote, nem
     na calçada da avenida), longe do tronco, do poste, do semáforo, da
     faixa de pedestre, do carro e de outro grupo. Na praça, o banco de
     caixote vira o banco de madeira, de frente pro coreto, com um
     cesto a cada dois; nas pracinhas das cunhas, a mesma coisa. E na
     rua sem saída, o lixo da vizinhança amontoado debaixo do "É
     PROIBIDO JOGAR LIXO".

     O QUE BARRA. O contêiner, a lixeira de rodinha, a barreira e a
     caixa de correio barram o boneco (são móvel de verdade, e ficam
     todos na beira da guia: a calçada continua passando). Saco, caixa,
     cone, balizador, hidrante, cesto, cinzeiro e o banco da praça não:
     a praça é onde a torcida se junta, e o miúdo não pode fazer da
     calçada um labirinto.
     ========================================================= */
  const PROPS = [];
  const PROPS_SOLIDOS = [], baldesProps = new Map();
  (function(){
    const M = METRO;
    const hash = (...n) => {
      let h = 2166136261;
      for(const v of n){ h = Math.imul(h ^ Math.round(v), 16777619); h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; }
      return h >>> 0;
    };
    const sorte = (...n) => hash(...n)/4294967296;
    /* a meia medida de cada peça, em metros: ao longo da frente (x) e
       de frente pra trás (z) — o que ela ocupa no chão */
    const MEIA = { cacamba: [0.78, 0.6], lixeira: [0.33, 0.44], saco: [0.33, 0.33], caixa: [0.36, 0.3],
                   cesto: [0.24, 0.24], barreira: [1.0, 0.3], correio: [0.25, 0.23], hidrante: [0.18, 0.18],
                   balizador: [0.07, 0.07], espuma: [0.13, 0.13], delineador: [0.19, 0.19], cone: [0.18, 0.18],
                   cinzeiro: [0.18, 0.18], banco: [0.9, 0.3] };
    const BARRA = new Set(['cacamba', 'lixeira', 'barreira', 'correio']);
    const naCalcada = (x, y) => {
      const q = celulaEm(x, y);
      return !!q && q.tipo === 'quadra' && !dentroPol(x, y, q.polMiolo) && dentroPol(x, y, q.pol) &&
             !naAvenida(x, y, CALC) && !noAsfalto(x, y) && !noCarro(x, y) &&
             /* a boca da rua sem saída corta a calçada do quarteirão */
             !SEM_SAIDA.asfalto.some(r => x > r.x0 - 6 && x < r.x1 + 6 && y > r.y0 - 6 && y < r.y1 + 6);
    };
    const longeDe = (x, y, r) =>
      ARVORES.every(a => Math.hypot(x - a.x, y - a.y) > r + 5) &&
      POSTES.every(p => Math.hypot(x - p.x, y - p.y) > r + 9) &&
      SEMAFOROS.every(s => Math.hypot(x - s.x, y - s.y) > r + 14) &&
      FAIXAS.every(f => Math.hypot(x - f.x, y - f.y) > r + 64) &&
      PROPS.every(p => Math.hypot(x - p.x, y - p.y) > r + p.r + 10);
    /* o retângulo que a peça ocupa no chão, já girado (ângulo reto) */
    const pegada = (k, x, y, ang, s) => {
      const [hx, hz] = MEIA[k].map(v => v*M*(s || 1));
      const c = Math.abs(Math.cos(ang)), sn = Math.abs(Math.sin(ang));
      const ex = hx*c + hz*sn, ey = hx*sn + hz*c;
      return { x0: x - ex, x1: x + ex, y0: y - ey, y1: y + ey };
    };
    const poe = (p, alt0) => {
      const r = Math.hypot(...MEIA[p.k])*M*(p.s || 1);
      const o = Object.assign({ v: 0, s: 1, alt0 }, p, { r });
      PROPS.push(o);
      if(BARRA.has(o.k)){
        const b = pegada(o.k, o.x, o.y, o.ang, o.s);
        PROPS_SOLIDOS.push(b);
        for(let i = Math.floor(b.x0/64); i <= Math.floor(b.x1/64); i++)
          for(let j = Math.floor(b.y0/64); j <= Math.floor(b.y1/64); j++){
            const ch = i + ',' + j;
            if(!baldesProps.has(ch)) baldesProps.set(ch, []);
            baldesProps.get(ch).push(b);
          }
      }
    };

    /* OS GRUPOS, em metros: `u` ao longo da guia, `w` da guia pra dentro
       (o centro da peça), `da` um giro a mais (o que se larga não fica
       alinhado). `h` é o hash do ponto: ele escolhe cor, quantidade e
       o jeito de cada coisa. */
    const G = 0.35;                                  // a folga da peça pra guia
    const GRUPOS = {
      lixo: h => [{ k: 'cacamba', u: 0, w: G + 0.6 },
                  { k: 'saco', u: 1.02, w: G + 0.3, v: h, s: 0.95, da: h % 7 },
                  { k: 'saco', u: 1.5, w: G + 0.55, v: h + 1, da: h % 5 },
                  { k: 'saco', u: 1.1, w: G + 0.9, v: h + 2, s: 0.85, da: h % 3 },
                  ...(h % 2 ? [{ k: 'saco', u: 1.95, w: G + 0.3, v: h + 3, s: 1.1 }] : []),
                  { k: 'caixa', u: -1.25, w: G + 0.35, v: h, da: 0.35 },
                  ...(h % 3 === 0 ? [{ k: 'caixa', u: -1.35, w: G + 1.05, v: h + 1, da: -0.5 }] : [])],
      seletiva: h => {
        const n = 3 + h % 3, g = [];
        for(let i = 0; i < n; i++) g.push({ k: 'lixeira', u: i*0.7, w: G + 0.44, v: h + i });
        g.push({ k: 'saco', u: n*0.7 + 0.1, w: G + 0.3, v: h, da: h % 7 }, { k: 'saco', u: n*0.7 + 0.35, w: G + 0.8, v: h + 2, s: 0.9 });
        if(h % 2) g.push({ k: 'caixa', u: -0.75, w: G + 0.35, v: h, da: -0.3 });
        return g;
      },
      sacos: h => [{ k: 'saco', u: 0, w: G + 0.3, v: h, da: h % 7 }, { k: 'saco', u: 0.5, w: G + 0.45, v: h + 1, s: 0.9 },
                   ...(h % 2 ? [{ k: 'saco', u: 0.2, w: G + 0.85, v: h + 2, s: 1.05 }] : []),
                   { k: 'caixa', u: -0.6, w: G + 0.3, v: h, da: 0.4 }],
      cesto: h => [{ k: 'cesto', u: 0, w: G + 0.25, v: h }],
      hidrante: () => [{ k: 'hidrante', u: 0, w: G + 0.2 }],
      correio: () => [{ k: 'correio', u: 0, w: G + 0.25 }],
      balizadores: h => (h % 2 ? [-1.2, 0, 1.2] : [-0.8, 0.8]).map(u => ({ k: h % 3 === 0 ? 'espuma' : 'balizador', u, w: 0.3 })),
      obra: h => [{ k: 'barreira', u: 0, w: G + 0.3 }, { k: 'cone', u: 1.45, w: G + 0.2, da: 0.4 },
                  { k: 'cone', u: 1.95, w: G + 0.55, da: 1.1 }, { k: 'delineador', u: -1.4, w: G + 0.2 },
                  ...(h % 2 ? [{ k: 'cone', u: -1.9, w: G + 0.45 }] : [])],
      cinzeiro: () => [{ k: 'cinzeiro', u: 0, w: G + 0.2 }]
    };
    /* o que sai em cada ponto: comércio atrás puxa cinzeiro e correio */
    const PESOS = [['lixo', 24], ['seletiva', 18], ['sacos', 8], ['cesto', 14], ['hidrante', 11],
                   ['balizadores', 9], ['obra', 7], ['correio', 4], ['cinzeiro', 5]];
    const PESOS_COMERCIO = [['lixo', 20], ['seletiva', 8], ['sacos', 12], ['cesto', 12], ['hidrante', 6],
                            ['balizadores', 6], ['obra', 4], ['correio', 14], ['cinzeiro', 18]];
    const escolhe = (pesos, r) => {
      let tot = 0; for(const [, p] of pesos) tot += p;
      let a = r*tot;
      for(const [k, p] of pesos){ if(a < p) return k; a -= p; }
      return pesos[pesos.length - 1][0];
    };
    /* monta o grupo no chão: devolve as peças no mundo, ou nada se
       alguma não cabe */
    const montar = (g, ponto, alt0) => {
      const pecas = [];
      for(const p of g){
        const [x, y] = ponto(p.u*M, p.w*M);
        const ang = ponto.ang + (p.da || 0);
        const b = pegada(p.k, x, y, ponto.ang, p.s);
        if(![[b.x0, b.y0], [b.x1, b.y0], [b.x0, b.y1], [b.x1, b.y1], [x, y]].every(([a, c]) => naCalcada(a, c))) return null;
        const r = Math.hypot(...MEIA[p.k])*M*(p.s || 1);
        if(!longeDe(x, y, r)) return null;
        /* o que barra não fica de frente pra carro parado na guia: o
           asfalto entre os dois virava um beco onde o corpo não passa */
        if(BARRA.has(p.k) && CARROS.some(c => c.x0 < b.x1 + 32 && c.x1 > b.x0 - 32 && c.y0 < b.y1 + 32 && c.y1 > b.y0 - 32))
          return null;
        pecas.push({ k: p.k, x, y, ang, v: p.v || 0, s: p.s || 1 });
      }
      for(const p of pecas) poe(p, alt0);
      return pecas;
    };

    /* ---- a calçada dos quarteirões ---- */
    const PASSO = 150, ESQUINA = 96;
    for(const q of QUADRAS){
      const lados = [
        { f: 'n', a0: q.x0, a1: q.x1, olha: [0, -1], ponto: (u, w) => [u, q.y0 + w] },
        { f: 's', a0: q.x0, a1: q.x1, olha: [0, 1],  ponto: (u, w) => [u, q.y1 - w] },
        { f: 'o', a0: q.y0, a1: q.y1, olha: [-1, 0], ponto: (u, w) => [q.x0 + w, u] },
        { f: 'l', a0: q.y0, a1: q.y1, olha: [1, 0],  ponto: (u, w) => [q.x1 - w, u] }
      ];
      lados.forEach((L, li) => {
        const ang = Math.atan2(L.olha[0], L.olha[1]);
        for(let k = 0, u = L.a0 + ESQUINA; u < L.a1 - ESQUINA; k++, u += PASSO){
          if(sorte(q.i, q.j, li, k, 11) > 0.34) continue;
          /* o lote de trás: comércio muda o que se põe na calçada, e a
             sede da torcida fica com a calçada livre */
          const nS = L.f === 'n' || L.f === 's';
          const atras = q.lotes.find(l => !l.ang && l.frente === L.f && (nS ? l.x0 <= u && l.x1 > u : l.y0 <= u && l.y1 > u));
          if(q.equip && q.equip.tipo === 'sede') continue;
          const h = hash(q.i, q.j, li, k, 5);
          const tipo = escolhe(atras && atras.placa ? PESOS_COMERCIO : PESOS, sorte(q.i, q.j, li, k, 7));
          const ponto = (du, dw) => L.ponto(u + du, dw);
          ponto.ang = ang;
          montar(GRUPOS[tipo](h % 1000), ponto, 1.4);
        }
      });
    }

    /* ---- a praça: o banco de madeira de frente pro coreto, e o cesto ---- */
    for(const q of QUADRAS){
      if(!q.equip || q.equip.tipo !== 'praca') continue;
      const eq = q.equip, coreto = eq.pecas.find(o => o.k === 'coreto');
      const bancos = eq.pecas.filter(o => o.k === 'banco');
      eq.pecas = eq.pecas.filter(o => o.k !== 'banco');
      bancos.forEach((b, i) => {
        const mx = (b.x0 + b.x1)/2, my = (b.y0 + b.y1)/2;
        const fx = coreto.x - mx, fy = coreto.y - my, l = Math.hypot(fx, fy) || 1;
        poe({ k: 'banco', x: mx, y: my, ang: Math.atan2(fx/l, fy/l) }, 1.65);
        if(i % 2 === 0) poe({ k: 'cesto', x: mx - fy/l*28, y: my + fx/l*28, ang: 0, v: i/2 }, 1.65);
      });
    }
    /* ---- as pracinhas das cunhas ---- */
    for(const q of QUADRAS) for(const pr of q.pracinhas || []){
      const bancos = pr.pecas.filter(o => o.k === 'banco');
      if(!bancos.length) continue;
      pr.pecas = pr.pecas.filter(o => o.k !== 'banco');
      bancos.forEach((b, i) => {
        const mx = (b.x0 + b.x1)/2, my = (b.y0 + b.y1)/2;
        const fx = pr.cx - mx, fy = pr.cy - my, l = Math.hypot(fx, fy) || 1;
        poe({ k: 'banco', x: mx, y: my, ang: Math.atan2(fx/l, fy/l) }, 1.7);
        if(i === 0) poe({ k: 'cesto', x: mx, y: my + 22, ang: 0, v: hash(q.i, q.j) % 5 }, 1.7);
      });
    }

    /* ---- o lixo da rua sem saída, debaixo do "É PROIBIDO JOGAR LIXO" ---- */
    const muro = SEM_SAIDA.lotes.find(l => l.tipo === 'muro');
    if(muro){
      const y = muro.y1, x = muro.x0 + 10;
      const ponto = (du, dw) => [x + du, y + dw];
      ponto.ang = 0;                                   // de frente pro T, pro sul
      const g = [{ k: 'lixeira', u: 0.45, w: 0.5, v: 3 }, { k: 'lixeira', u: 1.15, w: 0.5, v: 1 },
                 { k: 'saco', u: 1.95, w: 0.35, v: 5, da: 1 }, { k: 'saco', u: 2.4, w: 0.55, v: 6, s: 1.1 },
                 { k: 'saco', u: 2.1, w: 0.95, v: 7, s: 0.9 }, { k: 'saco', u: 2.85, w: 0.35, v: 8 },
                 { k: 'caixa', u: 3.4, w: 0.4, v: 1, da: 0.5 }, { k: 'caixa', u: 3.3, w: 0.95, v: 2, da: -0.3 }];
      for(const p of g){
        const [px, py] = ponto(p.u*M, p.w*M);
        poe({ k: p.k, x: px, y: py, ang: (p.da || 0), v: p.v, s: p.s || 1 }, 1.4);
      }
    }
  })();
  function noProp(x, y){
    const l = baldesProps.get(Math.floor(x/64) + ',' + Math.floor(y/64));
    if(!l) return null;
    for(const b of l) if(x >= b.x0 && x < b.x1 && y >= b.y0 && y < b.y1) return b;
    return null;
  }

  /* na rua sem saída se anda: asfalto e calçada, dentro do miolo maciço */
  const naRuaSemSaida = (q, x, y) => {
    const s = q.semSaida;
    if(!s || x < s.caixa.x0 || x >= s.caixa.x1 || y < s.caixa.y0 || y >= s.caixa.y1) return false;
    return s.livre.some(r => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1);
  };

  const naMassaDoAtacadex = (x, y) => {
    const c = ATACADEX.caixa;
    if(x < c.x0 || x > c.x1 || y < c.y0 || y > c.y1) return false;
    return ATACADEX.solidos.some(o => x >= o.x0 && x < o.x1 && y >= o.y0 && y < o.y1);
  };

  /* a câmera não atravessa marco: o volume vale da `base` até o `alt` */
  function noMarco(x, z, y){
    const c = ATACADEX.caixa;
    if(x >= c.x0 && x <= c.x1 && z >= c.y0 && z <= c.y1)
      return ATACADEX.volumes.some(v => x >= v.x0 && x < v.x1 && z >= v.y0 && z < v.y1 && y >= v.base && y < v.alt);
    /* o marco da ponta do quarteirão e os prédios do baldio: todo
       equipamento que tem volume */
    const q = celulaEm(x, z);
    if(!q || !q.equip || !q.equip.volumes) return false;
    for(const v of q.equip.volumes)
      if(x >= v.x0 && x < v.x1 && z >= v.y0 && z < v.y1 && y >= v.base && y < v.alt) return true;
    return false;
  }

  const CIDADE = { PX, MAPA, VISTA, VW, VH, VX0, VY0, pxm, pxX, pxY, RUA, CALC, TORCIDAS,
                   COLUNAS, LINHAS, CELULAS, QUADRAS, grade, celulaEm, zona, xCosta, PRAIA, ORLA,
                   CONTORNO, AVENIDAS, distAvenida, naAvenida, naRua, bordasX, bordasY,
                   xLimiteCosta, cortarPor, recorteCosta, pedacosSemAvenida, dentroPol, ruaEntre,
                   areaPol, noAsfalto, BEIRA, naBeira, CAMPOS, CERCA, PORTEIRA,
                   noCampo, andaNoCampo, LOTES, cantosDoLote, MOITAS, naMoita, TRILHAS,
                   CARROS, ARVORES, POSTES, SEDES, sedeDe, BARES, CRUZAMENTOS, SEMAFOROS, FAIXAS,
                   FAVELA, FAVELA_CAIXAS, FAVELA_RUAS, DECALQUES, MARCOS: MARCOS_POSTOS, PREDIOS: PREDIOS_BALDIO, PROPS, noProp, noMarco,
                   ATACADEX };

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
  function mundo(xTab, y, alvo){
    /* quem chama é a simulação: o x dela é o do tabuleiro */
    const x = xTab - DX;
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
    if(noProp(x, y)) return false;
    if(naMassaDoAtacadex(x, y)) return false;
    const q = celulaEm(x, y);
    /* PAREDE DE EQUIPAMENTO GANHA DA AVENIDA.
       A banda da avenida é andável — asfalto mais calçada — e vinha
       antes de tudo. Onde ela cruzava a fatia de um equipamento, as
       paredes dele sumiam da máscara e dava pra entrar na sede por
       fora, atravessando o muro. Peça no ASFALTO já é recusada na
       montagem do equipamento, então o que pode sobrar aqui é peça na
       calçada da avenida — e parede é parede, com avenida do lado ou
       sem ela. */
    if(q && q.equip && q.solidos.some(o => x >= o.x0 && x < o.x1 && y >= o.y0 && y < o.y1))
      return false;
    if(naAvenida(x, y)) return true;
    if(naRua(x, y)) return true;
    if(q && q.tipo === 'quadra'){
      /* no equipamento anda-se em volta das peças; no quarteirão de
         casa o miolo inteiro é maciço */
      if(q.equip){
        const a = q.equip.area;
        if(x >= a.x0 && x < a.x1 && y >= a.y0 && y < a.y1) return true;
      }
      if(naRuaSemSaida(q, x, y)) return true;
      return !dentroPol(x, y, q.polMiolo);
    }
    if(z === 'mato') return !naMoita(x, y) && !naBeira(x, y);
    /* praia, orla e TERRENO ABERTO. O aberto de dentro do contorno era
       livre sem perguntar nada, e passou a ter casa em cima: a favela
       cresceu até a rua de leste, e ali a célula é `aberto`, não mato.
       Sem o `naBeira` aqui a casa aparecia e não barrava ninguém. */
    return !naBeira(x, y);
  }
  function anda(x, y){
    const a = ancora(x, y);
    if(a.d >= D.calcada){
      /* a lasca da quina, e o canto das torres: dentro do quadrado do
         estádio e fora da calçada redonda, nada se pisa */
      if(noQuadradoDoEstadio(x, y)) return false;
      if(x < 4 - DX || y < 4 || x > W-4 || y > H-4) return false;
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
      if(noMarco(X, Z, Y)) return true;
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
    const COLS = Math.ceil((W + DX)/CEL), ROWS = Math.ceil(H/CEL);
    const linhas = [];
    for(let r=0;r<ROWS;r++){
      const y = (r+0.5)*CEL;
      const runs = []; let atual = 0, cont = 0;
      for(let c=0;c<COLS;c++){
        const v = anda((c+0.5)*CEL - DX, y) ? 1 : 0;
        if(v === atual) cont++;
        else { runs.push(cont); atual = v; cont = 1; }
      }
      runs.push(cont);
      linhas.push(runs.join(','));
    }
    return linhas.join(';');
  }

  return { W, H, CEL, DX, CX, CY, AX, AY, AXb, AYb, DOBRA, D, R, ALT, N, NDEG, TOPO_ARQ, tetoDe,
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
