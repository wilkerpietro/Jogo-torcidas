/* =========================================================
   O ESTÁDIO E O BAIRRO, PINTADOS — em coordenada de MUNDO
   ---------------------------------------------------------
   Esta pintura é a textura do chão do 3D, projetada de cima.
   Fora do estádio o mundo é o próprio tabuleiro, então rua,
   calçada e quarteirão saem no lugar em que estão. O estádio
   sai no raio do MUNDO (`P.anel`), que é onde a geometria está.
   O piso do corredor mora EMBAIXO da arquibancada e a projeção
   de cima já está ocupada: ele tem material próprio.

   A paleta é a da foto aérea: concreto claro e encardido,
   asfalto, gramado puxando pro seco.
   ========================================================= */
window.TO = window.TO || {};
TO.diaJogo = TO.diaJogo || {};

TO.diaJogo.estadioPintura = (function(){
  const COR = {
    rua:        '#3a3a38',
    calcada:    '#8d897d',
    lote:       '#7d7668',
    calcadaEst: '#9c9789',
    arcada:     '#b3ac9b',
    laje:       '#a39e91',
    degrau:     '#c6bfab',
    degrauAlt:  '#b9b29e',
    meioFio:    '#6a675f',
    faixaPed:   '#d9d6cc',
    eixo:       '#c9b96a',
    pista:      '#8f8b80',
    gramadoA:   '#437f3a',
    gramadoB:   '#377232',
    linha:      '#eef0e6'
  };

  function contorno(c, P, r, inverso){
    const pts = P.anel(r);
    if(inverso){
      c.moveTo(pts[pts.length-1][0], pts[pts.length-1][1]);
      for(let i=pts.length-2;i>=0;i--) c.lineTo(pts[i][0], pts[i][1]);
    } else {
      c.moveTo(pts[0][0], pts[0][1]);
      for(let i=1;i<pts.length;i++) c.lineTo(pts[i][0], pts[i][1]);
    }
    c.closePath();
  }
  function faixa(c, P, r0, r1, cor){
    c.beginPath(); contorno(c, P, r1, false); contorno(c, P, r0, true);
    c.fillStyle = cor; c.fill();
  }
  function risco(c, P, r, cor, larg){
    c.beginPath(); contorno(c, P, r, false);
    c.strokeStyle = cor; c.lineWidth = larg || 1; c.stroke();
  }
  function sujar(c, x, y, w, h, n, alfa){
    for(let i=0;i<n;i++){
      c.fillStyle = 'rgba(0,0,0,'+(alfa*Math.random()).toFixed(3)+')';
      c.fillRect(x + Math.random()*w, y + Math.random()*h, 1+Math.random()*2, 1+Math.random()*2);
    }
  }

  function gramado(c, P){
    const { CX, CY, AX, AY } = P;
    const x0 = CX-AX, y0 = CY-AY, w = AX*2, h = AY*2;
    const faixas = 12, fw = w/faixas;
    for(let i=0;i<faixas;i++){
      c.fillStyle = i%2 ? COR.gramadoA : COR.gramadoB;
      c.fillRect(x0 + i*fw, y0, fw, h);
    }
    const m = 16, a = x0+m, b = y0+m, lx = w-m*2, ly = h-m*2;
    c.strokeStyle = COR.linha; c.lineWidth = 2.4;
    c.strokeRect(a, b, lx, ly);
    c.beginPath(); c.moveTo(CX, b); c.lineTo(CX, b+ly); c.stroke();
    c.beginPath(); c.arc(CX, CY, 48, 0, 7); c.stroke();
    c.beginPath(); c.arc(CX, CY, 3.2, 0, 7); c.fillStyle = COR.linha; c.fill();
    const gaX = 64, gaY = 112, paX = 27, paY = 56;
    for(const s of [-1, 1]){
      c.strokeRect(s < 0 ? a : a+lx-gaX, CY-gaY/2, gaX, gaY);
      c.strokeRect(s < 0 ? a : a+lx-paX, CY-paY/2, paX, paY);
      c.beginPath(); c.arc(s < 0 ? a+44 : a+lx-44, CY, 2.6, 0, 7); c.fill();
      c.fillStyle = 'rgba(240,244,236,.85)';
      c.fillRect(s < 0 ? a-7 : a+lx, CY-25, 7, 50);
    }
    c.strokeStyle = COR.linha; c.lineWidth = 1.6;
    for(const [qx,qy,a0] of [[a,b,0],[a+lx,b,Math.PI/2],[a+lx,b+ly,Math.PI],[a,b+ly,-Math.PI/2]]){
      c.beginPath(); c.arc(qx, qy, 9, a0, a0+Math.PI/2); c.stroke();
    }
  }

  /* faixa de pedestre: barras atravessando a rua */
  function faixaPedestre(c, x0, y0, w, h, horizontal){
    c.fillStyle = COR.faixaPed;
    if(horizontal){ for(let x = x0; x < x0 + w; x += 12) c.fillRect(x, y0, 6, h); }
    else { for(let y = y0; y < y0 + h; y += 12) c.fillRect(x0, y, w, 6); }
  }

  function bairro(c, P, W, H){
    c.fillStyle = COR.rua; c.fillRect(0, 0, W, H);
    sujar(c, 0, 0, W, H, 9000, 0.16);
    /* o eixo das ruas, tracejado */
    c.strokeStyle = COR.eixo; c.lineWidth = 1.6; c.setLineDash([18, 14]);
    const R = P.RUA;
    for(const y of [R/2, P.QEST_Y0 - R/2, P.QEST_Y1 + R/2, H - R/2]){
      c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
    }
    for(const x of [R/2, P.QEST_X0 - R/2, P.QEST_X1 + R/2, W - R/2]){
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke();
    }
    c.setLineDash([]);
    /* os quarteirões: calçada por fora, terreno por dentro */
    for(const q of P.QUADRAS){
      c.fillStyle = COR.calcada; c.fillRect(q.x0, q.y0, q.x1-q.x0, q.y1-q.y0);
      c.fillStyle = COR.lote;    c.fillRect(q.ix0, q.iy0, q.ix1-q.ix0, q.iy1-q.iy0);
      c.strokeStyle = COR.meioFio; c.lineWidth = 2;
      c.strokeRect(q.x0, q.y0, q.x1-q.x0, q.y1-q.y0);
    }
    /* faixas de pedestre: na frente dos três portões e no norte */
    const { CX, CY } = P;
    faixaPedestre(c, P.QEST_X0 - R, CY - 22, R, 44, true);
    faixaPedestre(c, P.QEST_X1,     CY - 22, R, 44, true);
    faixaPedestre(c, CX - 22, P.QEST_Y1,     44, R, false);
    faixaPedestre(c, CX - 22, P.QEST_Y0 - R, 44, R, false);
  }

  /* pinta o MUNDO inteiro no canvas do tabuleiro */
  function pintar(c, P, W, H){
    const D = P.D, R = P.R;
    bairro(c, P, W, H);

    /* o quarteirão do estádio: calçada redonda, arcada, a laje de
       trás e a arquibancada, de fora pra dentro */
    c.fillStyle = COR.calcadaEst;
    c.fillRect(P.QEST_X0, P.QEST_Y0, P.QEST_X1-P.QEST_X0, P.QEST_Y1-P.QEST_Y0);
    faixa(c, P, R.calcada0, R.calcada1, COR.calcadaEst);
    risco(c, P, R.calcada1, COR.meioFio, 2);
    faixa(c, P, R.fachada0, R.fachada1, COR.arcada);
    faixa(c, P, D.arq, R.fachada0, COR.laje);
    sujar(c, P.QEST_X0, P.QEST_Y0, P.QEST_X1-P.QEST_X0, P.QEST_Y1-P.QEST_Y0, 2600, 0.14);

    /* a arquibancada: dezoito degraus de concreto, iguais */
    for(let i=P.NDEG-1;i>=0;i--){
      const r0 = D.pista + i*P.ALT.degrau, r1 = r0 + P.ALT.degrau;
      faixa(c, P, r0, r1, i % 2 ? COR.degrau : COR.degrauAlt);
      risco(c, P, r0, 'rgba(0,0,0,.28)', 1.4);
    }
    /* a pista e o gramado */
    faixa(c, P, 0, D.pista, COR.pista);
    risco(c, P, D.pista*0.5, 'rgba(238,232,218,.35)', 1.2);
    gramado(c, P);
  }

  /* o piso do corredor: cimento queimado com junta */
  function pisoCorredor(lado){
    const cv = document.createElement('canvas');
    cv.width = cv.height = lado || 256;
    const c = cv.getContext('2d');
    c.fillStyle = '#7d7a73'; c.fillRect(0, 0, cv.width, cv.height);
    sujar(c, 0, 0, cv.width, cv.height, 5200, 0.26);
    c.strokeStyle = 'rgba(0,0,0,.24)'; c.lineWidth = 1.4;
    for(let k=0;k<=4;k++){
      const p = k*cv.width/4;
      c.beginPath(); c.moveTo(p, 0); c.lineTo(p, cv.height); c.stroke();
      c.beginPath(); c.moveTo(0, p); c.lineTo(cv.width, p); c.stroke();
    }
    return cv;
  }

  return { pintar, pisoCorredor, COR };
})();
