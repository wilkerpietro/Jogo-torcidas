/* =========================================================
   O ESTÁDIO, PINTADO — e agora em coordenada de MUNDO
   ---------------------------------------------------------
   Antes esta pintura servia a dois donos: era a cena 2D e era
   a textura do 3D. Com a dobra ela só pode servir a um. O
   motivo é a dobra em si: o corredor e a arquibancada caem no
   MESMO ponto do mundo, em alturas diferentes, e uma projeção
   de cima não sabe pintar dois pisos no mesmo pixel.

   Então esta pintura é do MUNDO: gramado, pista, degrau,
   arcada e rua, todos no raio em que eles de fato
   estão. O 3D projeta ela de cima na geometria, como o
   telhado dos arredores já fazia. O piso do corredor, que
   mora embaixo, tem material próprio — é o único que não sai
   daqui, e é por isso que ele não sai.

   A paleta saiu da foto do Presidente Vargas: gramado puxando
   pro seco, pista avermelhada, arquibancada azul com a barra
   de baixo amarela, concreto encardido.
   ========================================================= */
window.TO = window.TO || {};
TO.diaJogo = TO.diaJogo || {};

TO.diaJogo.estadioPintura = (function(){
  const COR = {
    rua:       '#3b3b39',
    calcada:   '#8a867b',
    arcada:    '#b8b1a0',
    degrau:    '#2f6ba8',
    degrauAlt: '#2a5f97',
    degrauBase:'#d3a32c',
    divisa:    '#e6e3d8',
    faixa:     '#e8c22a',
    pista:     '#a3543f',
    raia:      '#e8e2d4',
    gramado:   '#3d7a36',
    gramadoA:  '#437f3a',
    gramadoB:  '#377232',
    linha:     '#eef0e6',
    concreto:  '#9d998e'
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
    c.beginPath();
    contorno(c, P, r1, false);
    contorno(c, P, r0, true);
    c.fillStyle = cor; c.fill();
  }
  function risco(c, P, r, cor, larg){
    c.beginPath(); contorno(c, P, r, false);
    c.strokeStyle = cor; c.lineWidth = larg || 1; c.stroke();
  }
  /* granulado, pra o concreto não sair chapado na câmera de perto */
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

  /* pinta o MUNDO inteiro no canvas do tabuleiro */
  function pintar(c, P, W, H){
    const D = P.D, R = P.R;

    c.fillStyle = COR.rua; c.fillRect(0, 0, W, H);
    sujar(c, 0, 0, W, H, 2400, 0.18);
    faixa(c, P, R.rua0, R.rua0 + 40, COR.calcada);      // a calçada do lado de fora

    /* a arcada e o piso de trás dela */
    faixa(c, P, R.fachada0, R.rua0, COR.arcada);

    /* a arquibancada, degrau por degrau, de fora pra dentro.
       CATORZE IGUAIS: não há mais faixa de cadeira. A barra
       amarela de baixo é a única coisa que muda de cor, e ela é a
       mureta do fosso, não um setor. */
    for(let i=P.NDEG-1;i>=0;i--){
      const r0 = D.pista + i*P.ALT.degrau, r1 = r0 + P.ALT.degrau;
      faixa(c, P, r0, r1, i < 2 ? COR.degrauBase : i % 2 ? COR.degrau : COR.degrauAlt);
      risco(c, P, r0, 'rgba(0,0,0,.30)', 1.6);
    }
    /* A FAIXA AMARELA DO NARIZ NÃO ESTÁ AQUI, e já esteve.
       Pintada, ela virava uma tarja: um filete de 1,3 numa
       textura de 2× passa por mipmap e por anisotropia e chega
       na tela com três vezes a largura, e de longe a
       arquibancada lia como listra amarela e azul alternada em
       vez de degrau com nariz marcado. Agora ela é volume, em
       `estadio3d.js` — custa 6,8 mil triângulos e sai nítida. */
    /* as divisas de setor: um risco claro de tempo em tempo */
    c.save();
    c.beginPath(); contorno(c, P, D.arq, false); contorno(c, P, D.pista, true); c.clip();
    const dentro = P.anel(D.pista), fora = P.anel(D.arq);
    c.strokeStyle = COR.divisa; c.lineWidth = 2.6;
    for(let i=0;i<P.N;i+=Math.round(P.N/16)){
      c.beginPath(); c.moveTo(dentro[i][0], dentro[i][1]); c.lineTo(fora[i][0], fora[i][1]); c.stroke();
    }
    c.restore();

    /* a pista e o gramado */
    faixa(c, P, 0, D.pista, COR.pista);
    for(let k=1;k<3;k++) risco(c, P, D.pista*k/3, 'rgba(238,232,218,.4)', 1.4);
    gramado(c, P);
  }

  /* o piso do corredor tem material próprio: ele mora EMBAIXO
     da arquibancada e a projeção de cima já está ocupada */
  function pisoCorredor(lado){
    const cv = document.createElement('canvas');
    cv.width = cv.height = lado || 256;
    const c = cv.getContext('2d');
    c.fillStyle = '#7d7a73'; c.fillRect(0, 0, cv.width, cv.height);
    sujar(c, 0, 0, cv.width, cv.height, 5200, 0.26);
    /* as juntas de dilatação, que é o que um piso de cimento
       queimado tem e o que dá escala quando se anda nele */
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
