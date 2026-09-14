/* =========================================================
   O ESTÁDIO — a planta dobrada
   ---------------------------------------------------------
   Inspirado no Presidente Vargas (Fortaleza): estádio de
   bairro, bacia retangular de quinas arredondadas, pista
   avermelhada, arquibancada azul, cobertura de um lado só e o
   muro com os portões dando na rua.

   O PROBLEMA. A briga tem dois andares: arquibancada em cima,
   corredor EMBAIXO DELA, e vomitórios — os buracos na
   arquibancada — ligando os dois. E `combate.js` é um
   tabuleiro plano de 1536 × 1024: uma célula, um lugar. Não
   tem andar, não tem altura, não tem escada.

   A SAÍDA: DOBRAR O TABULEIRO. O tabuleiro continua plano e
   continua sendo uma célula por lugar — mas o mapa que leva
   do tabuleiro pro mundo 3D não é mais "põe em pé onde está".
   Duas faixas distantes do tabuleiro caem NO MESMO ponto do
   mundo, em alturas diferentes: a faixa da arquibancada e a
   faixa do corredor. Andar do corredor pro degrau é andar uma
   distância no tabuleiro e subir no mundo.

   É isso que `mundo(x, y) → {X, Y, Z}` faz, e é a única coisa
   que esta cena tem de diferente de todas as outras. A
   simulação não sabe de nada: `combate.js` não foi tocado.

   ---------------------------------------------------------
   A DOBRA, faixa por faixa. `d` é a distância ao retângulo do
   gramado no TABULEIRO; `r` é a distância no MUNDO.

     faixa       d              r                 altura
     pista       0 → 26         r = d             0          bloqueia
     geral       26 → 122       r = d             6 → 56,6   ANDA (12 degraus)
     cadeira     122 → 170      r = d             61 → 84    bloqueia (6 fileiras)
     muro        170 → 186      r = d             —          bloqueia
     CORREDOR    186 → 254      r = 102 + (d−186) 0          ANDA  ← sob a arquibancada
     fachada     254 → 270      r = 170 + (d−254) 0 → 108    bloqueia, com portões
     rua         270 →          r = 186 + (d−270) 0          ANDA

   Repare no corredor: `d` de 186 a 254 vira `r` de 102 a 170,
   que é exatamente onde a arquibancada está por cima. O
   corredor tem 68 de fundo e o pé-direito é o fundo da laje —
   39 no ponto mais apertado, contra 34 de boneco. É corredor
   de estádio: baixo.

   POR QUE A ARQUIBANCADA DE CIMA É CADEIRA E NÃO SE PISA.
   Não é enfeite: é o que fecha a conta da dobra. O vomitório
   é uma tira do tabuleiro que atravessa da geral até o
   corredor; ela COME as células da arquibancada no caminho,
   porque uma célula só pode estar num lugar. Se a
   arquibancada de cima fosse andável, essas células comidas
   virariam laje que se vê e não se pisa — a mentira que este
   projeto não comete. Sendo cadeira, elas já eram bloqueadas
   em toda parte, e a tira só as usa por baixo, como túnel.
   A cadeira também é o que a foto mostra.

   TRÊS LEITORES desta planta: a máscara de caminhabilidade
   (gerada aqui na carga, é o que `combate.js` enxerga), a
   pintura do chão e a geometria 3D. Um número, três lugares.
   ========================================================= */
TO.dados = TO.dados || {};

TO.dados.plantaEstadio = (function(){
  const W = 1536, H = 1024, CEL = 8;
  const CX = W/2, CY = H/2;
  const AX = 294, AY = 190;          // meio retângulo do gramado (588 × 380)

  /* as bordas das faixas, no tabuleiro */
  const D = {
    pista:   26,
    geral:  122,
    cadeira:170,
    muro:   186,
    corred: 254,
    fachada:270
  };
  /* onde cada faixa cai no mundo */
  const R = {
    corred0: 102, corred1: 170,       // o corredor, sob a arquibancada
    fachada0:170, fachada1:186,
    rua0:    186
  };
  /* A ARCADA DA FACHADA, tirada da foto: o lado de fora do
     corredor não é muro cego. É pilar quadrado de tantos em
     tantos metros, mureta na altura da cintura entre eles, e
     vazio por cima até a laje — é de lá que vem a luz que
     deixa o corredor claro de um lado e escuro do outro. A
     mureta bloqueia (é o que a máscara já diz da fachada); o
     vazio por cima é só desenho, porque ninguém pula mureta
     neste jogo. */
  const ARCADA = { mureta: 24, pilar: 18, passo: 74 };

  const ALT = {
    degrau: 8,       // profundidade de um degrau
    subida: 4.6,     // altura de um degrau
    base:   6,       // o primeiro degrau, sobre a pista
    laje:   8,       // espessura da laje da arquibancada
    muro: 108,       // o topo do muro de fundo
    cadeira: 13,     // a cadeira, sobre o degrau
    alambrado: 30,
    cobertura: 150
  };
  const NGERAL   = (D.geral - D.pista) / ALT.degrau;      // 12 degraus de geral
  const NCADEIRA = (D.cadeira - D.geral) / ALT.degrau;    //  6 fileiras de cadeira
  const NDEG     = NGERAL + NCADEIRA;                      // 18 ao todo

  /* a altura do degrau que está no raio r */
  function alturaDegrau(r){
    const i = Math.max(0, Math.min(NDEG-1, Math.floor((r - D.pista)/ALT.degrau)));
    return ALT.base + ALT.subida*i;
  }

  /* =======================================================
     O PONTO DO RETÂNGULO E A NORMAL
     Toda a planta é "distância ao retângulo do gramado". O
     ponto mais próximo dá a âncora, e a direção dá a normal —
     nas quinas isso vira arco, que é a bacia arredondada da
     foto, sem desenhar uma curva sequer.
     ======================================================= */
  const presa = (v, a, b) => v < a ? a : v > b ? b : v;
  function ancora(x, y){
    const cx = presa(x, CX-AX, CX+AX), cy = presa(y, CY-AY, CY+AY);
    const dx = x - cx, dy = y - cy;
    const d = Math.hypot(dx, dy);
    return d > 0.0001 ? {cx, cy, d, nx: dx/d, ny: dy/d}
                      : {cx, cy, d: 0, nx: 0, ny: 0};
  }
  const dist = (x, y) => ancora(x, y).d;

  /* =======================================================
     O PERFIL — a volta em torno do gramado, amostrada uma vez
     ======================================================= */
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
  /* o anel do MUNDO no raio r */
  const anel = r => PERFIL.map(q => [q.x + q.nx*r, q.y + q.ny*r]);

  /* =======================================================
     OS LADOS RETOS — é neles que moram vomitório, portão e loja
     ======================================================= */
  const LADOS = { n:{eixo:'x', sinal:-1}, s:{eixo:'x', sinal:1},
                  o:{eixo:'y', sinal:-1}, l:{eixo:'y', sinal:1} };
  const RETO = { n:[CX-AX, CX+AX], s:[CX-AX, CX+AX],
                 o:[CY-AY, CY+AY], l:[CY-AY, CY+AY] };
  /* (lado, s, distância) → ponto, no tabuleiro OU no mundo (a
     conta é a mesma; muda só qual distância entra) */
  function ponto(lado, s, dist){
    const L = LADOS[lado];
    if(L.eixo === 'x') return [s, (L.sinal<0 ? CY-AY-dist : CY+AY+dist)];
    return [(L.sinal<0 ? CX-AX-dist : CX+AX+dist), s];
  }
  /* o inverso: em que lado e em que `s` este ponto cai */
  function ondeNoReto(x, y){
    if(x >= CX-AX && x <= CX+AX){
      if(y < CY-AY) return {lado:'n', s:x, d:(CY-AY)-y};
      if(y > CY+AY) return {lado:'s', s:x, d:y-(CY+AY)};
    }
    if(y >= CY-AY && y <= CY+AY){
      if(x < CX-AX) return {lado:'o', s:y, d:(CX-AX)-x};
      if(x > CX+AX) return {lado:'l', s:y, d:x-(CX+AX)};
    }
    return null;      // quina
  }

  /* =======================================================
     OS VOMITÓRIOS

     Uma tira radial do tabuleiro que vai da geral (d=66) até o
     corredor (d=214). No mundo ela sai do degrau 5 da geral
     (r=66, altura 29) e desce até o chão do corredor (r=130,
     altura 0): 64 de tiro pra 29 de queda, **24 graus**, que é
     escada de gente.

     No caminho ela atravessa a cadeira e o muro — e é por isso
     que a cadeira não se pisa: as células dela já eram
     bloqueadas, então a tira pode usá-las por baixo, como
     túnel, sem deixar laje órfã em lugar nenhum.

     O BURACO na arquibancada é a parte da tira onde o teto
     ainda não cabe em cima de uma pessoa: de r=66 a r≈110. Daí
     pra fora vira túnel coberto, que é o que a foto mostra.

     O corrimão fecha os dois lados compridos: entra-se pelo
     alto (da geral) ou pelo pé (do corredor), e mais nada. É o
     funil, e é onde a briga de arquibancada acontece.
     ======================================================= */
  const VOM = {
    dTop: 66, dFoot: 214,     // no tabuleiro
    larg: 44,                  // largura útil
    corrim: 6,                 // corrimão de cada lado
    degraus: 16
  };
  VOM.rTop  = VOM.dTop;                                   // 66
  VOM.rFoot = R.corred0 + (VOM.dFoot - D.muro);           // 130
  VOM.yTop  = alturaDegrau(VOM.rTop);                     // 29

  const VOMITORIOS = [
    { lado:'n', c: 620 }, { lado:'n', c: 916 },
    { lado:'s', c: 620 }, { lado:'s', c: 916 },
    { lado:'o', c: 512 }, { lado:'l', c: 512 }
  ].map(v => Object.assign(v, {
    s0: v.c - VOM.larg/2, s1: v.c + VOM.larg/2,
    e0: v.c - VOM.larg/2 - VOM.corrim, e1: v.c + VOM.larg/2 + VOM.corrim
  }));

  /* onde (x,y) cai em relação a um vomitório */
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
  /* a rampa: onde no mundo cai a distância `d` de tabuleiro */
  function rampa(d){
    const t = (d - VOM.dTop) / (VOM.dFoot - VOM.dTop);
    const r = VOM.rTop + (VOM.rFoot - VOM.rTop)*t;
    /* degrau é degrau: a altura desce em degrau, não em rampa */
    const k = Math.ceil(t*VOM.degraus) / VOM.degraus;
    return { r, y: VOM.yTop*(1 - k) };
  }

  /* =======================================================
     OS PORTÕES — os vãos da fachada
     ======================================================= */
  const PORTOES = [
    { id:'portao_oeste', lado:'o', c:CY, larg:80, rot:'PORTÃO 1', time:'mandante'  },
    { id:'portao_leste', lado:'l', c:CY, larg:80, rot:'PORTÃO 4', time:'visitante' },
    { id:'portao_norte', lado:'n', c:CX, larg:80, rot:'PORTÃO 2', time:'neutro'    },
    { id:'portao_sul',   lado:'s', c:CX, larg:80, rot:'PORTÃO 3', time:'neutro'    }
  ].map(p => {
    const d = (D.corred + D.fachada)/2;
    const [x, y] = ponto(p.lado, p.c, d);
    const L = LADOS[p.lado];
    return Object.assign(p, { x:Math.round(x), y:Math.round(y),
      dir: L.eixo==='x' ? [0, L.sinal] : [L.sinal, 0] });
  });
  function noPortao(x, y){
    const q = ondeNoReto(x, y);
    if(!q) return false;
    for(const p of PORTOES)
      if(p.lado === q.lado && Math.abs(q.s - p.c) <= p.larg/2) return true;
    return false;
  }

  /* =======================================================
     O COMÉRCIO DO CORREDOR

     Corredor de estádio não é um túnel vazio: é carrinho de
     pipoca, lanchonete, bar de cerveja, banheiro e a lojinha
     da torcida. Eles estão na MÁSCARA, não só no desenho — o
     corpo esbarra neles, e é isso que faz o corredor ter forma
     em vez de ser um anel liso.

     ENCOSTADOS NA PAREDE DE DENTRO, e isso veio da foto: o
     corredor do Presidente Vargas tem o balcão pintado de
     amarelo de um lado e o outro lado ABERTO, com mureta na
     altura da cintura e a luz entrando por cima. O lado
     fechado é o de dentro (r=102), onde a arquibancada baixa
     é maciça; o aberto é o de fora, que aqui vira arcada.
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
    { lado:'n', c: 520, tipo:'lanche'   }, { lado:'n', c: 700, tipo:'pipoca' },
    { lado:'n', c: 820, tipo:'bar'      }, { lado:'n', c:1010, tipo:'cachorro' },
    { lado:'s', c: 520, tipo:'banheiro' }, { lado:'s', c: 700, tipo:'cachorro' },
    { lado:'s', c: 820, tipo:'loja'     }, { lado:'s', c:1010, tipo:'lanche' },
    { lado:'o', c: 380, tipo:'pipoca'   }, { lado:'o', c: 644, tipo:'bar' },
    { lado:'l', c: 380, tipo:'lanche'   }, { lado:'l', c: 644, tipo:'banheiro' }
  ].map(o => {
    const L = LOJA[o.tipo];
    /* encostada na parede de dentro: a borda interna do
       corredor, que no tabuleiro é `D.muro` */
    return Object.assign({}, o, L, { d0: D.muro, d1: D.muro + L.fundo,
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
     A DOBRA: tabuleiro → mundo
     ======================================================= */
  function faixaDe(d){
    if(d < D.pista)   return 'pista';
    if(d < D.geral)   return 'geral';
    if(d < D.cadeira) return 'cadeira';
    if(d < D.muro)    return 'muro';
    if(d < D.corred)  return 'corredor';
    if(d < D.fachada) return 'fachada';
    return 'rua';
  }
  /* o raio do mundo e a altura, faixa por faixa */
  function dobra(d){
    if(d < D.cadeira) return { r: d, y: d < D.pista ? 0 : alturaDegrau(d) };
    if(d < D.muro)    return { r: d, y: ALT.muro };
    if(d < D.corred)  return { r: R.corred0 + (d - D.muro), y: 0 };
    if(d < D.fachada) return { r: R.fachada0 + (d - D.corred), y: 0 };
    return { r: R.rua0 + (d - D.fachada), y: 0 };
  }

  const saida = { x:0, y:0, z:0 };
  function mundo(x, y, alvo){
    const a = ancora(x, y);
    const v = noVomitorio(x, y);
    const m = v ? rampa(v.d) : dobra(a.d);
    const o = alvo || saida;
    o.x = a.cx + a.nx*m.r;
    o.z = a.cy + a.ny*m.r;
    o.y = m.y;
    return o;
  }

  /* =======================================================
     O QUE SE PISA
     ======================================================= */
  function anda(x, y){
    const v = noVomitorio(x, y);
    if(v) return !v.corrim;
    const f = faixaDe(dist(x, y));
    if(f === 'pista' || f === 'cadeira' || f === 'muro') return false;
    if(f === 'fachada') return noPortao(x, y);
    if(f === 'corredor') return !naLoja(x, y);
    return true;                                  // geral e rua
  }

  /* =======================================================
     O QUE É SÓLIDO, NO MUNDO
     A câmera de ombro precisa saber onde ela não entra, e
     agora "onde" é em três dimensões: o teto do corredor é
     sólido por cima e vazio por baixo. Isto responde isso.
     ======================================================= */
  function solido(X, Y, Z){
    if(Y < 0) return true;
    const a = ancora(X, Z);
    const r = a.d;
    if(r < D.pista) return false;
    if(r < D.cadeira){
      const topo = alturaDegrau(r);
      /* de r=26 até o começo do corredor a arquibancada é maciça;
         dali pra fora ela é laje, e embaixo é o corredor */
      if(r < R.corred0) return Y < topo;
      return Y > topo - ALT.laje && Y < topo + (r >= D.geral ? ALT.cadeira : 0);
    }
    if(r < R.fachada0){        // ainda é laje de arquibancada por cima do corredor
      const topo = alturaDegrau(Math.min(r, D.cadeira - 1));
      return Y > topo - ALT.laje && Y < topo + ALT.cadeira;
    }
    if(r < R.rua0) return Y < ALT.muro;            // a fachada
    return false;
  }
  /* o teto do corredor naquele ponto (pra prender a câmera lá embaixo) */
  function teto(X, Z){
    const r = ancora(X, Z).d;
    if(r < R.corred0 || r > R.fachada0) return Infinity;
    return alturaDegrau(Math.min(r, D.cadeira - 1)) - ALT.laje;
  }

  /* =======================================================
     A MÁSCARA — o mesmo formato de `arredores.codificarMascara`
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

  return { W, H, CEL, CX, CY, AX, AY, D, R, ALT, N, NGERAL, NCADEIRA, NDEG,
           PERFIL, anel, ancora, dist, alturaDegrau,
           LADOS, RETO, ponto, ondeNoReto,
           VOM, VOMITORIOS, noVomitorio, rampa,
           PORTOES, noPortao, LOJA, LOJAS, naLoja, ARCADA,
           faixaDe, dobra, mundo, anda, solido, teto, mascara };
})();

/* =========================================================
   A CENA
   ========================================================= */
TO.dados.cenaEstadio = (function(){
  const P = TO.dados.plantaEstadio;
  const { W, H, CEL } = P;

  /* Os dois setores ficam de frente um pro outro, na geral: é
     lá que cabe gente. O segundo escalão de cada lado nasce no
     corredor, embaixo — sem isso o corredor começaria vazio, e
     ele é metade da cena. */
  const spawns = [
    { id:'mandante1', rot:'1º ESCALÃO', lado:'mandante', x:404, y:600,
      jogador:true, entrada:'portao_oeste' },
    { id:'mandante2', rot:'2º ESCALÃO', lado:'mandante', x:254, y:640,
      entrada:'portao_oeste' },
    { id:'visitante1', rot:'SETOR VISITANTE', lado:'visitante', x:1132, y:420,
      guarda:true, entrada:'portao_leste' },
    { id:'visitante2', rot:'RETAGUARDA', lado:'visitante', x:1282, y:400,
      guarda:true, entrada:'portao_leste' }
  ];

  const entradas = P.PORTOES.map(p => ({
    id:p.id, rot:p.rot, lado:p.time, x:p.x, y:p.y, raio:44, dir:p.dir
  }));

  /* a PM fica no corredor, longe do pé dos vomitórios */
  const pmPostos = [
    { x:768, y:102 }, { x:768, y:922 }, { x:254, y:380 }, { x:1282, y:644 }
  ];

  /* grade que quebra e vira arma (GDD §12): duas no corredor,
     duas na geral, deitadas ao longo de um degrau */
  const grades = [
    { id:'cordao_norte', rot:'CORDÃO DA PM',
      de:{x:660,y:102}, ate:{x:800,y:102}, modulos:3, espessura:9 },
    { id:'cordao_sul',   rot:'CORDÃO DA PM',
      de:{x:740,y:922}, ate:{x:880,y:922}, modulos:3, espessura:9 },
    { id:'divisa_norte', rot:'DIVISA DE SETOR',
      de:{x:700,y:252}, ate:{x:840,y:252}, modulos:3, espessura:9 },
    { id:'divisa_sul',   rot:'DIVISA DE SETOR',
      de:{x:700,y:772}, ate:{x:840,y:772}, modulos:3, espessura:9 }
  ];

  return {
    id:'estadio', nome:'Estádio',
    largura:W, altura:H, celula:CEL, imagem:null,
    /* A MÁSCARA MANDA. Os polígonos existem só pra o editor F2
       abrir a cena sem engasgar: a planta é curva e dobrada, e
       polígono não descreve nem uma coisa nem outra. */
    poligonos:{
      caminhavel:[{rot:'chão', pontos:[[0,0],[W,0],[W,H],[0,H]]}],
      bloqueio:[]
    },
    mascara: P.mascara(),
    local:'No estádio',
    tropaChoque:true,
    saida:{ perto:'Sair pelo portão', longe:'Portão (leve o líder)',
            feito:'sua torcida saiu do estádio com a arquibancada na mão',
            dica:'Leve o líder até o portão da sua torcida.' },
    enfeites:[], varais:[],
    spawns, entradas, pmPostos, grades,
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
