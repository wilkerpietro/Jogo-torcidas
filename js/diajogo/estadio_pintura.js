/* =========================================================
   O ESTÁDIO VISTO DE CIMA
   ---------------------------------------------------------
   Esta pintura serve a dois donos, e é por isso que ela existe
   como pintura e não como geometria:

   1. É A CENA 2D. O `V` da bancada troca de desenhista sem
      recomeçar a noite, e do lado 2D quem pinta é isto.
   2. É A TEXTURA DO 3D. `estadio3d.js` pinta este mesmo canvas
      fora da tela e projeta de cima na bacia inteira — degrau,
      corredor, pista, gramado. É o mesmo truque que os
      arredores já usavam com o telhado ("o telhado é a própria
      foto"), levado pro estádio: a arte é uma só, então não
      existe um estádio azul no 2D e outro cinza no 3D.

   O que NÃO se pinta aqui é o que o 3D tem volume pra dizer
   sozinho: a sombra da cobertura, a espessura do muro, o
   corrimão de pé. Pintar sombra num chão que já recebe sombra
   de sol é sujeira dobrada.

   A paleta saiu da foto do Presidente Vargas: gramado puxando
   pro seco, pista avermelhada, arquibancada azul com a barra
   de baixo amarela, muro claro encardido.
   ========================================================= */
window.TO = window.TO || {};
TO.diaJogo = TO.diaJogo || {};

TO.diaJogo.estadioPintura = (function(){
  const COR = {
    rua:        '#3b3b39',
    calcada:    '#8a867b',
    corredor:   '#86837a',
    muroE:      '#c4bda9',
    muroEbase:  '#2b5a92',
    muroF:      '#cec8b6',
    degrau:     '#2f6ba8',
    degrauAlt:  '#2a5f97',
    degrauBase: '#d3a32c',
    degrauTopo: '#9d998d',
    divisa:     '#e6e3d8',
    pista:      '#a3543f',
    raia:       '#e8e2d4',
    gramado:    '#3d7a36',
    gramadoA:   '#437f3a',
    gramadoB:   '#377232',
    linha:      '#eef0e6',
    escada:     '#a09b8e',
    escadaT:    '#b5b0a2'
  };

  /* o contorno do estádio à distância `d` do gramado, como
     caminho de canvas. Vem da MESMA função que a geometria 3D
     usa — é isso que faz o degrau pintado cair em cima do
     degrau levantado. */
  function contorno(c, P, d, inverso){
    const pts = P.anel(d);
    if(inverso){
      c.moveTo(pts[pts.length-1][0], pts[pts.length-1][1]);
      for(let i=pts.length-2;i>=0;i--) c.lineTo(pts[i][0], pts[i][1]);
    } else {
      c.moveTo(pts[0][0], pts[0][1]);
      for(let i=1;i<pts.length;i++) c.lineTo(pts[i][0], pts[i][1]);
    }
    c.closePath();
  }
  /* a faixa entre duas distâncias: o de fora no sentido normal,
     o de dentro ao contrário — é o que abre o buraco */
  function faixa(c, P, d0, d1, cor){
    c.beginPath();
    contorno(c, P, d1, false);
    contorno(c, P, d0, true);
    c.fillStyle = cor;
    c.fill();
  }
  function risco(c, P, d, cor, largura){
    c.beginPath(); contorno(c, P, d, false);
    c.strokeStyle = cor; c.lineWidth = largura || 1; c.stroke();
  }

  /* granulado leve, pra o concreto não sair chapado na câmera
     de perto (o 3D amplia esta textura umas dez vezes) */
  function sujar(c, x, y, w, h, n, alfa){
    c.save();
    c.beginPath(); c.rect(x, y, w, h); c.clip();
    for(let i=0;i<n;i++){
      const px = x + Math.random()*w, py = y + Math.random()*h;
      c.fillStyle = 'rgba(0,0,0,'+(alfa*Math.random()).toFixed(3)+')';
      c.fillRect(px, py, 1 + Math.random()*2, 1 + Math.random()*2);
    }
    c.restore();
  }

  function gramado(c, P){
    const { CX, CY, AX, AY } = P;
    const x0 = CX-AX, y0 = CY-AY, w = AX*2, h = AY*2;
    c.fillStyle = COR.gramado; c.fillRect(x0, y0, w, h);
    /* o corte do trator: faixas claras e escuras alternadas */
    const faixas = 12, fw = w/faixas;
    for(let i=0;i<faixas;i++){
      c.fillStyle = i%2 ? COR.gramadoA : COR.gramadoB;
      c.fillRect(x0 + i*fw, y0, fw, h);
    }
    /* a marcação. Recuada da borda: a linha de fundo não encosta
       na pista, tem sobra de grama antes dela. */
    const m = 16;
    const a = x0+m, b = y0+m, lx = w-m*2, ly = h-m*2;
    c.strokeStyle = COR.linha; c.lineWidth = 2.4;
    c.strokeRect(a, b, lx, ly);
    c.beginPath(); c.moveTo(CX, b); c.lineTo(CX, b+ly); c.stroke();
    c.beginPath(); c.arc(CX, CY, 46, 0, 7); c.stroke();
    c.beginPath(); c.arc(CX, CY, 3.2, 0, 7); c.fillStyle = COR.linha; c.fill();
    /* áreas */
    const gaX = 62, gaY = 108, paX = 26, paY = 54;
    for(const s of [-1, 1]){
      const bx = s < 0 ? a : a+lx-gaX;
      c.strokeRect(bx, CY-gaY/2, gaX, gaY);
      const px = s < 0 ? a : a+lx-paX;
      c.strokeRect(px, CY-paY/2, paX, paY);
      c.beginPath(); c.arc(s < 0 ? a+42 : a+lx-42, CY, 2.6, 0, 7); c.fill();
      /* o gol, pra fora da linha */
      c.fillStyle = 'rgba(240,244,236,.85)';
      c.fillRect(s < 0 ? a-7 : a+lx, CY-24, 7, 48);
    }
    /* escanteios */
    c.strokeStyle = COR.linha; c.lineWidth = 1.6;
    for(const [qx,qy,a0] of [[a,b,0],[a+lx,b,Math.PI/2],[a+lx,b+ly,Math.PI],[a,b+ly,-Math.PI/2]]){
      c.beginPath(); c.arc(qx, qy, 9, a0, a0+Math.PI/2); c.stroke();
    }
  }

  function pintar(c, D, W, H){
    const P = D.planta || TO.dados.plantaEstadio;
    if(!P) return;
    const R = P.D;

    /* ---- a rua e a calçada ---- */
    c.fillStyle = COR.rua; c.fillRect(0, 0, W, H);
    sujar(c, 0, 0, W, H, 2600, 0.18);
    faixa(c, P, R.muroe, R.muroe + 34, COR.calcada);

    /* ---- o corredor ---- */
    faixa(c, P, R.murof, R.corr, COR.corredor);
    /* encardido junto ao muro: é onde a chuva bate e onde a
       torcida encosta */
    c.save();
    c.beginPath(); contorno(c, P, R.corr, false); contorno(c, P, R.murof, true); c.clip();
    sujar(c, 0, 0, W, H, 5200, 0.3);
    c.restore();

    /* ---- os muros ---- */
    faixa(c, P, R.corr, R.muroe, COR.muroE);
    faixa(c, P, R.corr, R.corr + 7, COR.muroEbase);     // a barra pintada, de dentro
    faixa(c, P, R.arq,  R.murof, COR.muroF);

    /* os vãos dos portões: o muro some ali e vira chão */
    for(const p of P.PORTOES){
      const [ax, ay] = P.mundo(p.lado, p.c - p.larg/2, R.corr - R.murof);
      const [bx, by] = P.mundo(p.lado, p.c + p.larg/2, R.muroe - R.murof + 34);
      c.fillStyle = COR.corredor;
      c.fillRect(Math.min(ax,bx), Math.min(ay,by), Math.abs(bx-ax), Math.abs(by-ay));
      /* a soleira, que é o que se vê de cima de um portão aberto */
      c.fillStyle = '#55524b';
      const meio = R.corr + (R.muroe - R.corr)/2 - R.murof;
      const [sx, sy] = P.mundo(p.lado, p.c - p.larg/2, meio - 3);
      const [tx, ty] = P.mundo(p.lado, p.c + p.larg/2, meio + 3);
      c.fillRect(Math.min(sx,tx), Math.min(sy,ty), Math.abs(tx-sx)||6, Math.abs(ty-sy)||6);
    }

    /* ---- a arquibancada, degrau por degrau ----
       de fora pra dentro, pra o risco de cada degrau cair por
       cima do degrau de baixo */
    for(let i=P.NDEG-1;i>=0;i--){
      const d0 = R.pista + i*P.ALT.degrau, d1 = d0 + P.ALT.degrau;
      const cor = i === P.NDEG-1 ? COR.degrauTopo     // o passeio de cima
                : i < 2          ? COR.degrauBase     // a barra amarela de baixo
                : i % 2          ? COR.degrau : COR.degrauAlt;
      faixa(c, P, d0, d1, cor);
      risco(c, P, d0, 'rgba(0,0,0,.30)', 1.6);
    }
    /* as divisas de setor: um risco claro de tempo em tempo,
       saindo do próprio perfil — é o que quebra o azul */
    c.save();
    c.beginPath(); contorno(c, P, R.arq, false); contorno(c, P, R.pista, true); c.clip();
    const dentro = P.anel(R.pista), fora = P.anel(R.arq);
    c.strokeStyle = COR.divisa; c.lineWidth = 3;
    for(let i=0;i<P.N;i+=Math.round(P.N/16)){
      c.beginPath(); c.moveTo(dentro[i][0], dentro[i][1]); c.lineTo(fora[i][0], fora[i][1]); c.stroke();
    }
    sujar(c, 0, 0, W, H, 4200, 0.22);
    c.restore();

    /* ---- as escadas ---- */
    for(const e of P.ESCADAS){
      const q = (s, t) => P.mundo(e.lado, s, t);
      const cantos = [q(e.a, 0), q(e.b, 0), q(e.b, P.ESC.fundo), q(e.a, P.ESC.fundo)];
      c.beginPath();
      c.moveTo(cantos[0][0], cantos[0][1]);
      for(let i=1;i<4;i++) c.lineTo(cantos[i][0], cantos[i][1]);
      c.closePath();
      c.fillStyle = COR.escada; c.fill();
      /* o patamar, mais claro */
      const pat = [q(e.pa,0), q(e.pb,0), q(e.pb,P.ESC.fundo), q(e.pa,P.ESC.fundo)];
      c.beginPath(); c.moveTo(pat[0][0], pat[0][1]);
      for(let i=1;i<4;i++) c.lineTo(pat[i][0], pat[i][1]);
      c.closePath(); c.fillStyle = COR.escadaT; c.fill();
      /* o vão que atravessa o muro */
      const vao = [q(e.pa,0), q(e.pb,0), q(e.pb,-(R.murof-R.arq)), q(e.pa,-(R.murof-R.arq))];
      c.beginPath(); c.moveTo(vao[0][0], vao[0][1]);
      for(let i=1;i<4;i++) c.lineTo(vao[i][0], vao[i][1]);
      c.closePath(); c.fillStyle = COR.escadaT; c.fill();
      /* o risco de cada degrau */
      c.strokeStyle = 'rgba(0,0,0,.34)'; c.lineWidth = 1.4;
      for(let k=1;k<=P.ESC.degraus;k++){
        const s = e.sobe > 0 ? e.a + P.ESC.lance*k/P.ESC.degraus
                             : e.b - P.ESC.lance*k/P.ESC.degraus;
        const [x0,y0] = q(s, 0), [x1,y1] = q(s, P.ESC.fundo);
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      }
      /* o corrimão — o lado comprido e a ponta de cima */
      c.strokeStyle = '#5e5a52'; c.lineWidth = P.ESC.corrim*0.8; c.lineCap = 'square';
      const [c0x,c0y] = q(e.a - (e.sobe>0?0:P.ESC.corrim), P.ESC.fundo + P.ESC.corrim/2);
      const [c1x,c1y] = q(e.b + (e.sobe>0?P.ESC.corrim:0), P.ESC.fundo + P.ESC.corrim/2);
      c.beginPath(); c.moveTo(c0x, c0y); c.lineTo(c1x, c1y); c.stroke();
      const sPonta = e.sobe > 0 ? e.b + P.ESC.corrim/2 : e.a - P.ESC.corrim/2;
      const [p0x,p0y] = q(sPonta, 0), [p1x,p1y] = q(sPonta, P.ESC.fundo + P.ESC.corrim);
      c.beginPath(); c.moveTo(p0x, p0y); c.lineTo(p1x, p1y); c.stroke();
      c.lineCap = 'butt';
    }

    /* ---- a pista e o gramado ---- */
    faixa(c, P, 0, R.pista, COR.pista);
    for(let k=1;k<3;k++) risco(c, P, R.pista*k/3, 'rgba(238,232,218,.45)', 1.4);
    risco(c, P, R.pista - 2, 'rgba(0,0,0,.35)', 3);     // o pé do alambrado
    gramado(c, P);
  }

  /* Entra no pintor de cenas sem que `cenario.js` precise saber
     que este arquivo existe: `CENAS` volta por referência, e
     `D.pintura === 'estadio'` acha o pintor aqui. */
  if(TO.diaJogo.cenario && TO.diaJogo.cenario.CENAS)
    TO.diaJogo.cenario.CENAS.estadio = pintar;

  return { pintar, COR };
})();
