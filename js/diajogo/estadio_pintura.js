/* =========================================================
   A CIDADE, O ESTÁDIO E A COSTA, PINTADOS — em coordenada de MUNDO
   ---------------------------------------------------------
   Esta pintura é a textura do chão do 3D, projetada de cima.
   Cobre o que se DESENHA (`P.CIDADE.VISTA`), que vai além do
   tabuleiro: o mar, a praia e o mato de fora. Fora do estádio o
   mundo é o próprio tabuleiro, então rua, avenida, quarteirão e
   campo saem no lugar em que estão; o estádio sai no raio do
   MUNDO (`P.anel`). O piso do corredor mora EMBAIXO da
   arquibancada e tem material próprio.

   A paleta é a do mapa: telha e reboco nos quarteirões, areia
   clara, mar azul-petróleo, mato bege com moita verde-escura.
   ========================================================= */
window.TO = window.TO || {};
TO.diaJogo = TO.diaJogo || {};

TO.diaJogo.estadioPintura = (function(){
  const COR = {
    rua:        '#3a3a38',
    calcada:    '#8d897d',
    lote:       '#7d7668',
    terreno:    '#a89c80',
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
    linha:      '#eef0e6',
    mato:       '#cbb98a',
    matoEscuro: '#b9a778',
    moita:      '#5d7746',
    trilha:     '#b39e74',
    areia:      '#e6d3a3',
    areiaMolhada:'#d3bf8e',
    mar:        '#2e5a75',
    marFundo:   '#26506a',
    onda:       '#5d86a0',
    grama:      '#4a8a3c',
    gramaB:     '#3f7a33',
    cerca:      '#6e6a5e',
    piso:       '#b5afa0',
    gramaPraca: '#4e7f40',
    patio:      '#9d9a90'
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
  /* o sorteio da pintura é semeado: a textura sai igual toda vez */
  let semente = 7;
  const rnd = () => { semente = (semente * 1664525 + 1013904223) >>> 0; return semente / 4294967296; };
  function sujar(c, x, y, w, h, n, alfa, tam){
    for(let i=0;i<n;i++){
      c.fillStyle = 'rgba(0,0,0,'+(alfa*rnd()).toFixed(3)+')';
      const t = tam || 2;
      c.fillRect(x + rnd()*w, y + rnd()*h, t + rnd()*t*2, t + rnd()*t*2);
    }
  }
  function poli(c, pts, cor){
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for(let i=1;i<pts.length;i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath(); c.fillStyle = cor; c.fill();
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

  /* um campo de várzea: grama, linhas e cerca de mourão */
  function campoVarzea(c, K, f){
    const w = f.x1 - f.x0, h = f.y1 - f.y0;
    const faixas = 8, fw = w/faixas;
    for(let i=0;i<faixas;i++){ c.fillStyle = i%2 ? COR.grama : COR.gramaB; c.fillRect(f.x0 + i*fw, f.y0, fw, h); }
    const m = 22, a = f.x0+m, b = f.y0+m, lx = w-m*2, ly = h-m*2;
    c.strokeStyle = COR.linha; c.lineWidth = 2;
    c.strokeRect(a, b, lx, ly);
    c.beginPath(); c.moveTo(f.cx, b); c.lineTo(f.cx, b+ly); c.stroke();
    c.beginPath(); c.arc(f.cx, f.cy, 30, 0, 7); c.stroke();
    for(const s of [-1, 1]) c.strokeRect(s < 0 ? a : a+lx-40, f.cy-50, 40, 100);
    c.strokeStyle = COR.cerca; c.lineWidth = K.CERCA; c.strokeRect(f.x0 + K.CERCA/2, f.y0 + K.CERCA/2, w - K.CERCA, h - K.CERCA);
  }

  function faixaPedestre(c, x0, y0, w, h, horizontal){
    c.fillStyle = COR.faixaPed;
    if(horizontal){ for(let x = x0; x < x0 + w; x += 12) c.fillRect(x, y0, 6, h); }
    else { for(let y = y0; y < y0 + h; y += 12) c.fillRect(x0, y, w, 6); }
  }
  function tracejado(c, x0, y0, x1, y1){
    c.strokeStyle = COR.eixo; c.lineWidth = 1.6; c.setLineDash([18, 14]);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    c.setLineDash([]);
  }

  /* o chão de cada equipamento: a MESMA lista de peças que o 3D usa,
     então o mapa visto de cima bate com o que se vê lá embaixo */
  function chaoDoEquipamento(c, q){
    c.fillStyle = q.equip.chao;
    c.fillRect(q.ix0, q.iy0, q.ix1 - q.ix0, q.iy1 - q.iy0);
    for(const o of q.equip.pecas){
      if(o.k !== 'piso') continue;
      c.fillStyle = o.cor; c.fillRect(o.x0, o.y0, o.x1 - o.x0, o.y1 - o.y0);
    }
  }

  /* pinta o MUNDO inteiro: o que se desenha, de VX0/VY0 a VW/VH */
  function pintar(c, P){
    const K = P.CIDADE, D = P.D, R = P.R;
    const X0 = K.VX0, Y0 = K.VY0, X1 = K.VX0 + K.VW, Y1 = K.VY0 + K.VH;
    semente = 7;

    /* ---- 1. o mato, base de tudo ---- */
    c.fillStyle = COR.mato; c.fillRect(X0, Y0, K.VW, K.VH);
    for(let i=0;i<260;i++){
      c.fillStyle = 'rgba(160,140,95,' + (0.12 + rnd()*0.2).toFixed(2) + ')';
      c.beginPath(); c.ellipse(X0 + rnd()*K.VW, Y0 + rnd()*K.VH, 60 + rnd()*260, 40 + rnd()*160, rnd()*3, 0, 7); c.fill();
    }
    sujar(c, X0, Y0, K.VW, K.VH, 6000, 0.12, 3);
    c.strokeStyle = COR.trilha; c.lineWidth = 16; c.lineCap = 'round'; c.lineJoin = 'round';
    for(const t of K.TRILHAS){
      c.beginPath(); c.moveTo(t[0][0], t[0][1]);
      for(let i=1;i<t.length;i++) c.lineTo(t[i][0], t[i][1]);
      c.stroke();
    }
    for(const m of K.MOITAS){
      c.fillStyle = COR.moita;
      c.beginPath(); c.ellipse(m.x, m.y, m.r*0.9, m.r*0.7, 0, 0, 7); c.fill();
    }

    /* ---- 2. os quarteirões: calçada, o miolo, a guia ---- */
    const bx = K.bordasX, by = K.bordasY;
    const nCol = bx.length/2, nLin = by.length/2;
    for(const q of K.CELULAS){
      if(q.tipo === 'quadra'){
        /* polígono, não retângulo: na orla o quarteirão acaba na
           diagonal da costa, e o miolo com ele */
        poli(c, q.pol, COR.calcada);
        if(q.equip) chaoDoEquipamento(c, q);
        else if(q.polMiolo.length >= 3) poli(c, q.polMiolo, COR.lote);
        /* as pracinhas das cunhas: as mesmas tiras e peças do 3D */
        for(const pr of q.pracinhas || []){
          c.fillStyle = COR.piso;
          for(const t of pr.tiras) c.fillRect(t.x0, t.y0, t.x1-t.x0, t.y1-t.y0);
          for(const o of pr.pecas){
            if(o.k !== 'piso') continue;
            c.fillStyle = o.cor; c.fillRect(o.x0, o.y0, o.x1-o.x0, o.y1-o.y0);
          }
        }
        c.beginPath(); c.moveTo(q.pol[0][0], q.pol[0][1]);
        for(let i=1;i<q.pol.length;i++) c.lineTo(q.pol[i][0], q.pol[i][1]);
        c.closePath();
        c.strokeStyle = COR.meioFio; c.lineWidth = 2; c.stroke();
      } else if((q.tipo === 'aberto' || q.tipo === 'campo') && K.zona(q.cx, q.cy) === 'cidade'){
        c.fillStyle = COR.terreno; c.fillRect(q.x0, q.y0, q.x1-q.x0, q.y1-q.y0);
      }
    }

    /* ---- 3. a calçada das avenidas, traçada ao longo dos pontos.
       Só dentro do contorno da cidade: fora dele a avenida é estrada no
       mato, e estrada não tem calçada. ---- */
    const tracarAvenida = (av, larg, cor) => {
      c.strokeStyle = cor; c.lineWidth = larg; c.lineJoin = 'round'; c.lineCap = 'round';
      c.beginPath(); c.moveTo(av.pontos[0][0], av.pontos[0][1]);
      for(let i=1;i<av.pontos.length;i++) c.lineTo(av.pontos[i][0], av.pontos[i][1]);
      c.stroke();
    };
    c.save();
    c.beginPath();
    const cont = K.CONTORNO.map(([px, py]) => K.pxm(px, py));
    c.moveTo(cont[0][0], cont[0][1]);
    for(let i=1;i<cont.length;i++) c.lineTo(cont[i][0], cont[i][1]);
    c.closePath(); c.clip();
    for(const av of K.AVENIDAS) tracarAvenida(av, av.l + 2*K.CALC, COR.calcada);
    c.restore();
    /* os lotes rotacionados pintam o próprio chão, por cima dessa calçada */
    for(const l of K.LOTES){
      if(!l.ang) continue;
      c.save(); c.translate(l.cx, l.cy); c.rotate(l.ang);
      c.fillStyle = COR.lote; c.fillRect(-l.w/2 - 2, -l.h/2 - 2, l.w + 4, l.h + 4);
      c.restore();
    }

    /* ---- 4. as ruas da grade: SÓ AS FAIXAS, e só entre células
       urbanas. Vêm DEPOIS da calçada da avenida: onde a avenida cruza
       uma rua o chão é asfalto, não calçada — quem atravessa, atravessa
       no asfalto. ---- */
    c.fillStyle = COR.rua;
    const cel = (i, j) => K.grade[i] && K.grade[i][j];
    const urbana = (i, j) => { const g = cel(i, j); return !!(g && g.urbana); };
    /* a mesma regra da máscara, inclusive a de não cortar campo ao meio */
    const rua = (...ij) => K.ruaEntre(ij.map(([i, j]) => cel(i, j)).filter(Boolean));
    for(let i=0;i<nCol;i++) for(let j=0;j<nLin;j++){
      const x0 = bx[2*i], x1 = bx[2*i+1], y0 = by[2*j], y1 = by[2*j+1];
      const temCol = 2*i + 2 < bx.length, temLin = 2*j + 2 < by.length;
      if(temCol && rua([i, j], [i+1, j])) c.fillRect(x1, y0, bx[2*i+2]-x1, y1-y0);
      if(temLin && rua([i, j], [i, j+1])) c.fillRect(x0, y1, x1-x0, by[2*j+2]-y1);
      if(temCol && temLin && rua([i, j], [i+1, j], [i, j+1], [i+1, j+1]))
        c.fillRect(x1, y1, bx[2*i+2]-x1, by[2*j+2]-y1);
    }
    /* o eixo tracejado das ruas largas, em trechos contínuos de célula urbana */
    const trechos = (n, temUrbana, borda, pintar) => {
      let a = -1;
      for(let k=0;k<=n;k++){
        const u = k < n && temUrbana(k);
        if(u && a < 0) a = k;
        if(!u && a >= 0){ pintar(borda(a, true), borda(k-1, false)); a = -1; }
      }
    };
    K.COLUNAS.forEach((col, k) => {
      if(col.l < 74) return;
      trechos(nLin, j => urbana(k, j) || urbana(k+1, j),
              (j, ini) => ini ? (j > 0 ? by[2*j - 1] : by[0]) : (2*j + 2 < by.length ? by[2*j + 2] : by[by.length-1]),
              (y0, y1) => tracejado(c, col.c, y0, col.c, y1));
    });
    K.LINHAS.forEach((lin, k) => {
      if(lin.l < 74) return;
      trechos(nCol, i => urbana(i, k) || urbana(i, k+1),
              (i, ini) => ini ? (i > 0 ? bx[2*i - 1] : bx[0]) : (2*i + 2 < bx.length ? bx[2*i + 2] : bx[bx.length-1]),
              (x0, x1) => tracejado(c, x0, lin.c, x1, lin.c));
    });

    /* o asfalto e o eixo das avenidas, por cima de tudo isso */
    for(const av of K.AVENIDAS){
      tracarAvenida(av, av.l, COR.rua);
      c.setLineDash([18, 14]); tracarAvenida(av, 1.6, COR.eixo); c.setLineDash([]);
    }
    c.lineCap = 'butt'; c.lineJoin = 'miter';

    /* ---- 5. a costa: orla, praia, mar ---- */
    const costa = (dpx) => {
      const pts = [];
      for(let ypx = -80; ypx <= 1200; ypx += 10) pts.push(K.pxm(K.xCosta(ypx) - dpx, ypx));
      return pts;
    };
    const fechado = (pts, xFim) => pts.concat([[xFim, pts[pts.length-1][1]], [xFim, pts[0][1]]]);
    poli(c, fechado(costa(K.PRAIA + K.ORLA), X1), COR.rua);        // a avenida beira-mar
    poli(c, fechado(costa(K.PRAIA), X1), COR.areia);               // a praia
    poli(c, fechado(costa(4), X1), COR.areiaMolhada);
    poli(c, fechado(costa(0), X1), COR.mar);
    sujar(c, X0, Y0, K.VW, K.VH, 1400, 0.05, 6);
    /* o eixo da beira-mar, e a praia com um pouco de vida */
    c.strokeStyle = COR.eixo; c.lineWidth = 1.6; c.setLineDash([18, 14]);
    c.beginPath(); const eixo = costa(K.PRAIA + K.ORLA/2); c.moveTo(eixo[0][0], eixo[0][1]);
    for(let i=1;i<eixo.length;i++) c.lineTo(eixo[i][0], eixo[i][1]); c.stroke(); c.setLineDash([]);
    /* as ondas: riscos claros paralelos à costa, mar adentro */
    for(let k=1;k<=7;k++){
      const w = costa(-k*38 - rnd()*20);
      c.strokeStyle = 'rgba(120,160,185,' + (0.35 - k*0.03).toFixed(2) + ')'; c.lineWidth = 3 + rnd()*3;
      c.beginPath(); c.moveTo(w[0][0], w[0][1]);
      for(let i=1;i<w.length;i++) c.lineTo(w[i][0] + (rnd()-0.5)*30, w[i][1]);
      c.stroke();
    }
    c.fillStyle = COR.marFundo;
    for(let i=0;i<40;i++){
      const y = Y0 + rnd()*K.VH; const [xc] = K.pxm(K.xCosta(y/K.PX + K.MAPA.y0), 0);
      c.beginPath(); c.ellipse(xc + 300 + rnd()*1500, y, 120 + rnd()*300, 30 + rnd()*60, 0.3, 0, 7); c.fill();
    }

    /* ---- 6. os campos de várzea ---- */
    for(const f of K.CAMPOS) campoVarzea(c, K, f);

    /* ---- 7. o quarteirão do estádio: calçada redonda, arcada, a laje e a arquibancada ---- */
    c.fillStyle = COR.calcadaEst;
    c.fillRect(P.QEST_X0, P.QEST_Y0, P.QEST_X1-P.QEST_X0, P.QEST_Y1-P.QEST_Y0);
    faixa(c, P, R.calcada0, R.calcada1, COR.calcadaEst);
    risco(c, P, R.calcada1, COR.meioFio, 2);
    faixa(c, P, R.fachada0, R.fachada1, COR.arcada);
    faixa(c, P, D.arq, R.fachada0, COR.laje);
    sujar(c, P.QEST_X0, P.QEST_Y0, P.QEST_X1-P.QEST_X0, P.QEST_Y1-P.QEST_Y0, 2600, 0.14);
    for(let i=P.NDEG-1;i>=0;i--){
      const r0 = D.pista + i*P.ALT.degrau, r1 = r0 + P.ALT.degrau;
      faixa(c, P, r0, r1, i % 2 ? COR.degrau : COR.degrauAlt);
      risco(c, P, r0, 'rgba(0,0,0,.28)', 1.4);
    }
    faixa(c, P, 0, D.pista, COR.pista);
    risco(c, P, D.pista*0.5, 'rgba(238,232,218,.35)', 1.2);
    gramado(c, P);

    /* ---- 8. faixas de pedestre: nos três portões, no norte e onde a avenida chega ---- */
    const { CX, CY } = P, RUA = K.RUA;
    faixaPedestre(c, P.QEST_X0 - RUA, CY - 22, RUA, 44, true);
    faixaPedestre(c, P.QEST_X1,       CY - 22, RUA, 44, true);
    faixaPedestre(c, CX - 22, P.QEST_Y1,       44, RUA, false);
    faixaPedestre(c, CX - 22, P.QEST_Y0 - RUA, 44, RUA, false);
  }

  /* o piso do corredor: cimento queimado com junta */
  function pisoCorredor(lado){
    const cv = document.createElement('canvas');
    cv.width = cv.height = lado || 256;
    const c = cv.getContext('2d');
    c.fillStyle = '#7d7a73'; c.fillRect(0, 0, cv.width, cv.height);
    semente = 11; sujar(c, 0, 0, cv.width, cv.height, 5200, 0.26);
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
