/* =========================================================
   CENÁRIO — pintura das cenas desenhadas (praça e rua)
   ---------------------------------------------------------
   A cena dos arredores é foto. Estas duas são desenhadas em
   canvas, vistas de cima, e a régua é a rua brasileira de
   verdade: calçada portuguesa em onda, meio-fio pintado de
   preto e branco, muro pichado, boteco com mesa de plástico,
   caçamba de entulho, poste com gambiarra e bandeirinha de
   festa junina atravessando de um lado ao outro.

   Tudo o que bloqueia passagem vem da lista de blocos da
   cena — o que se pinta aqui é exatamente o que a malha
   conhece. Enfeite que não bloqueia é enfeite, e ponto.
   ========================================================= */
window.TO = window.TO || {};
TO.diaJogo = TO.diaJogo || {};

TO.diaJogo.cenario = (function(){
  const U = TO.util;

  /* semente fixa por elemento: a mesma casa tem sempre a mesma cor */
  function hash(txt){
    let h = 2166136261;
    const s = String(txt);
    for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h,16777619)>>>0; }
    return h >>> 0;
  }
  const dado = (txt, n) => hash(txt) % n;
  const frac = txt => (hash(txt) % 1000) / 1000;

  /* -------------------------------------------------------
     PALETA — periferia brasileira vista de cima
     ------------------------------------------------------- */
  const TELHADO = ['#a64a32','#8a4030','#7a4a3a','#6a504a','#56524a','#5a4030'];
  const LAJE    = ['#8d8b83','#7d7b74','#96938a','#6f6d67'];
  const PAREDE  = ['#c8b89a','#b8a488','#d4c3a5','#9fb0a8','#c2a48f','#a8b6c0'];
  const PICHACAO= ['#1c1c1c','#20303f','#2a1c30','#123018'];

  /* -------------------------------------------------------
     PISOS
     ------------------------------------------------------- */
  function asfalto(c, x, y, w, h, chave){
    c.fillStyle = '#33333a'; c.fillRect(x, y, w, h);
    /* remendo: asfalto de bairro é uma colcha de retalhos */
    for(let i=0;i<14;i++){
      const s = hash(`${chave}|rem|${i}`);
      const rx = x + (s % Math.max(1,w-90)), ry = y + ((s>>>7) % Math.max(1,h-70));
      c.fillStyle = (s>>>3)%2 ? 'rgba(24,24,28,.55)' : 'rgba(64,62,66,.4)';
      c.beginPath();
      c.ellipse(rx, ry, 28+(s%38), 18+((s>>>5)%26), (s%7), 0, Math.PI*2);
      c.fill();
    }
    /* buraco fundo, dois ou três por rua */
    for(let i=0;i<3;i++){
      const s = hash(`${chave}|buraco|${i}`);
      const rx = x + (s % Math.max(1,w-60)), ry = y + ((s>>>9) % Math.max(1,h-60));
      c.fillStyle = '#141418';
      c.beginPath(); c.ellipse(rx, ry, 12+(s%10), 8+((s>>>4)%8), 0, 0, Math.PI*2);
      c.fill();
    }
  }

  /* calçada portuguesa: a onda preta e branca de Copacabana, que virou
     calçada de praça no país inteiro */
  function calcadaPortuguesa(c, x, y, w, h){
    c.save();
    c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.fillStyle = '#cfc8b8'; c.fillRect(x, y, w, h);
    /* a onda é miúda: pedra portuguesa tem 5 cm, não meio metro */
    c.strokeStyle = 'rgba(46,44,42,.78)'; c.lineWidth = 4;
    const passo = 15;
    for(let k=-h; k<w+h; k+=passo*2){
      c.beginPath();
      for(let t=0; t<=h; t+=6){
        const px = x + k + t*0.55 + Math.sin(t/34)*13;
        if(t===0) c.moveTo(px, y+t); else c.lineTo(px, y+t);
      }
      c.stroke();
    }
    /* pedra solta e junta */
    c.fillStyle = 'rgba(0,0,0,.10)';
    for(let i=0;i<40;i++){
      const s = hash(`cp|${x}|${y}|${i}`);
      c.fillRect(x + (s%Math.max(1,w)), y + ((s>>>8)%Math.max(1,h)), 4, 4);
    }
    c.restore();
  }

  function calcadaComum(c, x, y, w, h, chave){
    c.fillStyle = '#9d968a'; c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 1;
    for(let px=x; px<x+w; px+=26){ c.beginPath(); c.moveTo(px,y); c.lineTo(px,y+h); c.stroke(); }
    for(let py=y; py<y+h; py+=26){ c.beginPath(); c.moveTo(x,py); c.lineTo(x+w,py); c.stroke(); }
    /* mato na junta e mancha de óleo */
    for(let i=0;i<18;i++){
      const s = hash(`${chave}|cc|${i}`);
      c.fillStyle = (s%3) ? 'rgba(70,88,52,.5)' : 'rgba(0,0,0,.18)';
      c.fillRect(x+(s%Math.max(1,w)), y+((s>>>6)%Math.max(1,h)), 3+(s%5), 3);
    }
  }

  /* paralelepípedo: rua velha de centro, ainda de pedra */
  function paralelepipedo(c, x, y, w, h, chave){
    c.save(); c.beginPath(); c.rect(x,y,w,h); c.clip();
    c.fillStyle = '#4a4640'; c.fillRect(x,y,w,h);
    const p = 15;
    for(let ry=y, l=0; ry<y+h; ry+=p, l++){
      for(let rx=x - (l%2)*p/2; rx<x+w; rx+=p){
        const s = hash(`${chave}|pp|${rx}|${ry}`);
        const t = 62 + (s%26);
        c.fillStyle = `rgb(${t},${t-4},${t-10})`;
        c.fillRect(rx+1, ry+1, p-2.5, p-2.5);
      }
    }
    c.restore();
  }

  /* terra batida: o fundo de quintal, o beco entre duas casas e o
     estacionamento de saibro. É o que sobra onde não há piso nem asfalto,
     e sem ele o vão entre dois prédios vira buraco preto na tela. */
  function terreno(c, x, y, w, h, chave, tom){
    c.fillStyle = tom || '#5a4c3c'; c.fillRect(x, y, w, h);
    for(let i=0;i<Math.round(w*h/2600);i++){
      const s = hash(`${chave}|t|${i}`);
      c.fillStyle = (s%4) ? 'rgba(96,82,64,.5)' : 'rgba(48,40,30,.45)';
      c.fillRect(x+(s%Math.max(1,w)), y+((s>>>8)%Math.max(1,h)), 5+(s%9), 4);
    }
    /* mato nascendo na junta, que é o que dá vida a terreno de periferia */
    for(let i=0;i<Math.round(w*h/9000);i++){
      const s = hash(`${chave}|m|${i}`);
      c.fillStyle = 'rgba(74,96,52,.55)';
      c.fillRect(x+(s%Math.max(1,w)), y+((s>>>6)%Math.max(1,h)), 7, 5);
    }
  }

  /* meio-fio pintado de preto e branco, do jeito da prefeitura */
  function meioFio(c, x, y, w, h, horizontal){
    const passo = 30;
    if(horizontal){
      for(let px=x, k=0; px<x+w; px+=passo, k++){
        c.fillStyle = k%2 ? '#1b1b1b' : '#e8e4d8';
        c.fillRect(px, y, Math.min(passo, x+w-px), h);
      }
    }else{
      for(let py=y, k=0; py<y+h; py+=passo, k++){
        c.fillStyle = k%2 ? '#1b1b1b' : '#e8e4d8';
        c.fillRect(x, py, w, Math.min(passo, y+h-py));
      }
    }
  }

  function faixaPedestre(c, cx, cy, comp, larg, vertical){
    c.fillStyle = 'rgba(236,232,220,.88)';
    const n = 7, f = larg/(n*2-1);
    for(let i=0;i<n;i++){
      if(vertical) c.fillRect(cx - larg/2 + i*f*2, cy - comp/2, f, comp);
      else         c.fillRect(cx - comp/2, cy - larg/2 + i*f*2, comp, f);
    }
  }

  /* -------------------------------------------------------
     CONSTRUÇÕES
     ------------------------------------------------------- */
  function casa(c, b){
    const s = `casa|${b.x}|${b.y}`;
    const laje = frac(s) > 0.45;
    c.fillStyle = laje ? LAJE[dado(s+'l', LAJE.length)]
                       : TELHADO[dado(s+'t', TELHADO.length)];
    c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 2;
    c.strokeRect(b.x+1, b.y+1, b.w-2, b.h-2);

    if(laje){
      /* laje: caixa d'água, varal, antena e o tijolo esperando o segundo andar */
      c.fillStyle = 'rgba(0,0,0,.18)';
      c.fillRect(b.x+6, b.y+6, b.w-12, b.h-12);
      const cx = b.x + b.w*0.25, cy = b.y + b.h*0.3;
      c.fillStyle = '#2d6fa8';                       // caixa d'água azul
      c.beginPath(); c.arc(cx, cy, Math.min(16, b.w*0.12), 0, Math.PI*2); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.stroke();
      /* varal de roupa */
      c.strokeStyle = 'rgba(230,230,225,.55)'; c.lineWidth = 1.5;
      const vy = b.y + b.h*0.68;
      c.beginPath(); c.moveTo(b.x+14, vy); c.lineTo(b.x+b.w-14, vy); c.stroke();
      for(let i=0;i<5;i++){
        const px = b.x + 22 + i*((b.w-44)/4);
        c.fillStyle = ['#c94a3a','#dcd6c6','#3a6ba8','#d8b23a','#5a8a4a'][ (dado(s+i,5) ) ];
        c.fillRect(px, vy, 9, 13);
      }
    }else{
      /* telhado de duas águas: a cumeeira no meio */
      c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 2;
      c.beginPath();
      if(b.w > b.h){ c.moveTo(b.x+3, b.y+b.h/2); c.lineTo(b.x+b.w-3, b.y+b.h/2); }
      else         { c.moveTo(b.x+b.w/2, b.y+3); c.lineTo(b.x+b.w/2, b.y+b.h-3); }
      c.stroke();
      /* fiada de telha */
      c.strokeStyle = 'rgba(0,0,0,.16)'; c.lineWidth = 1;
      for(let py=b.y+7; py<b.y+b.h-4; py+=7){
        c.beginPath(); c.moveTo(b.x+3, py); c.lineTo(b.x+b.w-3, py); c.stroke();
      }
    }
  }

  function sobrado(c, b){
    casa(c, b);
    c.fillStyle = 'rgba(0,0,0,.25)';
    c.fillRect(b.x+b.w*0.15, b.y+b.h*0.12, b.w*0.7, b.h*0.24);
  }

  /* muro pichado: a mancha de tinta que dá o tom do bairro */
  function pichar(c, b){
    const n = 2 + dado(`p|${b.x}|${b.y}`, 3);
    for(let i=0;i<n;i++){
      const s = hash(`pich|${b.x}|${b.y}|${i}`);
      const px = b.x + 8 + (s % Math.max(1, b.w-40));
      const py = b.y + 6 + ((s>>>7) % Math.max(1, b.h-24));
      c.save();
      c.globalAlpha = 0.55;
      c.strokeStyle = PICHACAO[s % PICHACAO.length];
      c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(px, py);
      for(let k=1;k<5;k++){
        const q = hash(`${s}|${k}`);
        c.lineTo(px + k*7 + (q%9), py + ((q>>>4)%16) - 8);
      }
      c.stroke();
      c.restore();
    }
  }

  function boteco(c, b){
    c.fillStyle = '#b8442f'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 2;
    c.strokeRect(b.x+1, b.y+1, b.w-2, b.h-2);
    /* toldo listrado na frente, virado pra rua */
    const alto = b.y < 512;
    const ty = alto ? b.y + b.h - 26 : b.y;
    for(let px=b.x+6, k=0; px<b.x+b.w-6; px+=22, k++){
      c.fillStyle = k%2 ? '#e8e2d2' : '#2f7a3f';
      c.fillRect(px, ty, Math.min(22, b.x+b.w-6-px), 26);
    }
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(b.x+6, ty + (alto?26:-4), b.w-12, 4);
  }

  function igreja(c, b){
    c.fillStyle = '#d8d2c2'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 2.5;
    c.strokeRect(b.x+1, b.y+1, b.w-2, b.h-2);
    /* nave e as duas torres, vistas de cima */
    c.fillStyle = '#9d3f34';
    c.fillRect(b.x + b.w*0.28, b.y, b.w*0.44, b.h);
    c.fillStyle = '#c8c2b2';
    c.fillRect(b.x + b.w*0.10, b.y + b.h - 66, 60, 66);
    c.fillRect(b.x + b.w*0.90 - 60, b.y + b.h - 66, 60, 66);
    /* a cruz no telhado */
    c.fillStyle = '#e8e2cc';
    const cx = b.x + b.w/2;
    c.fillRect(cx-4, b.y + b.h*0.3, 8, 46);
    c.fillRect(cx-17, b.y + b.h*0.3 + 13, 34, 8);
  }

  function coreto(c, b){
    const cx = b.x + b.w/2, cy = b.y + b.h/2, r = b.w/2;
    /* base de concreto */
    c.fillStyle = '#8d8578'; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI*2); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 3; c.stroke();
    /* telhado oitavado, verde de coreto de praça */
    c.fillStyle = '#2f6b4a';
    c.beginPath();
    for(let i=0;i<8;i++){
      const a = i*Math.PI/4 - Math.PI/8;
      const px = cx + Math.cos(a)*(r-8), py = cy + Math.sin(a)*(r-8);
      i ? c.lineTo(px,py) : c.moveTo(px,py);
    }
    c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 2; c.stroke();
    /* as oito colunas e o pináculo */
    c.fillStyle = '#e2dccc';
    for(let i=0;i<8;i++){
      const a = i*Math.PI/4;
      c.beginPath(); c.arc(cx+Math.cos(a)*(r-16), cy+Math.sin(a)*(r-16), 5, 0, Math.PI*2);
      c.fill();
    }
    c.fillStyle = '#d8b23a';
    c.beginPath(); c.arc(cx, cy, 9, 0, Math.PI*2); c.fill();
  }

  function canteiro(c, b){
    c.fillStyle = '#4a6b38'; c.fillRect(b.x, b.y, b.w, b.h);
    /* terra batida aparecendo na grama pisada */
    for(let i=0;i<22;i++){
      const s = hash(`gr|${b.x}|${b.y}|${i}`);
      c.fillStyle = (s%3) ? 'rgba(90,120,64,.6)' : 'rgba(120,96,60,.45)';
      c.fillRect(b.x+(s%Math.max(1,b.w)), b.y+((s>>>7)%Math.max(1,b.h)),
                 6+(s%10), 5);
    }
    c.strokeStyle = '#9d968a'; c.lineWidth = 6;
    c.strokeRect(b.x+3, b.y+3, b.w-6, b.h-6);
    /* mangueira e ipê: a copa grande e a florada amarela */
    const n = Math.max(2, Math.round(b.w/70));
    for(let i=0;i<n;i++){
      const s = hash(`arv|${b.x}|${b.y}|${i}`);
      const px = b.x + 26 + i*((b.w-52)/Math.max(1,n-1));
      const py = b.y + b.h/2 + ((s%20)-10);
      arvore(c, px, py, 22 + (s%12), (s%5)===0);
    }
  }

  function arvore(c, x, y, r, ipe){
    c.save();
    c.fillStyle = 'rgba(0,0,0,.35)';
    c.beginPath(); c.arc(x+4, y+5, r, 0, Math.PI*2); c.fill();
    /* a copa em três tufos, pra não virar bolinha */
    const base = ipe ? ['#c9a227','#d8b23a','#b08c1c'] : ['#2f5c2a','#3d7233','#27491f'];
    for(let i=0;i<3;i++){
      const a = i*2.1;
      c.fillStyle = base[i];
      c.beginPath();
      c.arc(x + Math.cos(a)*r*0.28, y + Math.sin(a)*r*0.28, r*0.78, 0, Math.PI*2);
      c.fill();
    }
    c.fillStyle = 'rgba(60,40,24,.9)';
    c.beginPath(); c.arc(x, y, r*0.2, 0, Math.PI*2); c.fill();
    c.restore();
  }

  function carro(c, b){
    const s = `car|${b.x}|${b.y}`;
    const cores = ['#b8352c','#2f4f7a','#d8d2c4','#3a3a3e','#7a7f85','#8d6a2a'];
    const deitado = b.w > b.h;
    c.save();
    c.fillStyle = 'rgba(0,0,0,.4)';
    c.fillRect(b.x+3, b.y+4, b.w, b.h);
    c.fillStyle = cores[dado(s, cores.length)];
    c.fillRect(b.x, b.y, b.w, b.h);
    c.fillStyle = 'rgba(20,26,34,.75)';                 // para-brisa e vidro
    if(deitado){ c.fillRect(b.x+b.w*0.24, b.y+3, b.w*0.30, b.h-6);
                 c.fillRect(b.x+b.w*0.62, b.y+4, b.w*0.16, b.h-8); }
    else       { c.fillRect(b.x+3, b.y+b.h*0.24, b.w-6, b.h*0.30);
                 c.fillRect(b.x+4, b.y+b.h*0.62, b.w-8, b.h*0.16); }
    c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 1.5;
    c.strokeRect(b.x+.5, b.y+.5, b.w-1, b.h-1);
    c.restore();
  }

  function cacamba(c, b){
    c.fillStyle = '#c26a1e'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = '#7a3f10'; c.lineWidth = 3;
    c.strokeRect(b.x+1.5, b.y+1.5, b.w-3, b.h-3);
    /* entulho por cima, que é o que dá pedra na briga */
    for(let i=0;i<26;i++){
      const s = hash(`ent|${b.x}|${i}`);
      const t = 110 + (s%60);
      c.fillStyle = `rgb(${t},${t-8},${t-16})`;
      c.fillRect(b.x+6+(s%Math.max(1,b.w-14)), b.y+6+((s>>>6)%Math.max(1,b.h-14)),
                 4+(s%6), 4+((s>>>3)%5));
    }
  }

  function banca(c, b){
    c.fillStyle = '#2f6b8a'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 2;
    c.strokeRect(b.x+1, b.y+1, b.w-2, b.h-2);
    /* as revistas penduradas na frente */
    for(let i=0;i<6;i++){
      c.fillStyle = ['#d8d2c4','#c94a3a','#d8b23a','#e8e2d2'][i%4];
      c.fillRect(b.x+6+i*((b.w-12)/6), b.y+b.h-14, (b.w-12)/6-3, 11);
    }
  }

  /* quiosque de praça: toldo listrado por cima, guarita no meio e o
     balcão virado pra quem passa */
  function quiosque(c, b){
    c.save();
    c.fillStyle = 'rgba(0,0,0,.3)';
    c.fillRect(b.x+4, b.y+5, b.w, b.h);
    /* o toldo, em gomos de duas cores */
    const gomos = Math.max(4, Math.round(b.w/26));
    for(let i=0;i<gomos;i++){
      c.fillStyle = i%2 ? '#d8402f' : '#eee6d2';
      c.fillRect(b.x + i*b.w/gomos, b.y, b.w/gomos + .5, b.h);
    }
    c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 2;
    c.strokeRect(b.x+1, b.y+1, b.w-2, b.h-2);
    /* a guarita por baixo do toldo */
    c.fillStyle = '#8d7a58';
    c.fillRect(b.x+b.w*0.24, b.y+b.h*0.24, b.w*0.52, b.h*0.52);
    c.fillStyle = 'rgba(0,0,0,.35)';
    c.fillRect(b.x+b.w*0.30, b.y+b.h*0.62, b.w*0.40, b.h*0.14);
    /* caixa de isopor e engradado do lado */
    c.fillStyle = '#dfe4e8';
    c.fillRect(b.x+b.w-16, b.y+b.h-20, 12, 14);
    c.fillStyle = '#7a5a2a';
    c.fillRect(b.x+4, b.y+b.h-18, 14, 12);
    c.restore();
  }

  function predio(c, b){
    const s = `pr|${b.x}|${b.y}`;
    c.fillStyle = PAREDE[dado(s, PAREDE.length)];
    c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 2;
    c.strokeRect(b.x+1, b.y+1, b.w-2, b.h-2);
    c.fillStyle = 'rgba(0,0,0,.22)';
    for(let px=b.x+12; px<b.x+b.w-18; px+=34)
      for(let py=b.y+12; py<b.y+b.h-18; py+=30)
        c.fillRect(px, py, 20, 16);
    pichar(c, b);
  }

  /* -------------------------------------------------------
     O QUE SÓ EXISTE NAS CENAS DE AÇÃO
     ------------------------------------------------------- */

  /* letreiro pintado à mão na laje, do jeito que bar de bairro faz */
  function letreiro(c, b, txt, cor){
    const alto = Math.max(18, Math.min(30, b.h*0.13));
    c.save();
    c.fillStyle = 'rgba(0,0,0,.5)';
    c.fillRect(b.x+10, b.y+b.h-alto-12, b.w-20, alto+6);
    c.fillStyle = cor || '#f0e6c8';
    c.font = `900 ${alto}px Arial, sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(txt, b.x+b.w/2, b.y+b.h-alto/2-9);
    c.restore();
  }

  /* o bar da outra torcida: fachada nas cores deles, sinuca no salão */
  function barRival(c, b){
    const cor = b.cor || '#2f4f9a';
    c.fillStyle = '#6f6a5e'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 3;
    c.strokeRect(b.x+1.5, b.y+1.5, b.w-3, b.h-3);
    /* faixa das cores no beiral, virada pra rua */
    c.fillStyle = cor; c.fillRect(b.x, b.y+b.h-46, b.w, 30);
    c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(b.x, b.y+b.h-22, b.w, 8);
    /* salão: mesa de sinuca no meio e o balcão encostado no fundo */
    c.fillStyle = '#2c6b3f';
    c.fillRect(b.x+b.w*0.30, b.y+b.h*0.30, b.w*0.34, b.h*0.30);
    c.strokeStyle = '#5a3a20'; c.lineWidth = 6;
    c.strokeRect(b.x+b.w*0.30, b.y+b.h*0.30, b.w*0.34, b.h*0.30);
    c.fillStyle = '#e8e2d2';
    for(let i=0;i<5;i++){
      const s = hash(`bola|${b.x}|${i}`);
      c.beginPath();
      c.arc(b.x+b.w*0.34+(s%Math.round(b.w*0.26)),
            b.y+b.h*0.34+((s>>>6)%Math.round(b.h*0.22)), 4, 0, Math.PI*2);
      c.fill();
    }
    c.fillStyle = '#7a4a26';
    c.fillRect(b.x+b.w*0.72, b.y+22, b.w*0.20, b.h*0.52);
    /* freezer e engradado empilhado atrás do balcão */
    c.fillStyle = '#c8ccd2'; c.fillRect(b.x+b.w*0.74, b.y+b.h*0.62, 54, 40);
    letreiro(c, b, 'BAR DO ZÉ', '#f2e2a8');
    pichar(c, b);
  }

  /* muro alto: o que separa quintal, CT e terreno */
  function muro(c, b){
    c.fillStyle = '#8d867a'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 2;
    c.strokeRect(b.x+1, b.y+1, b.w-2, b.h-2);
    /* fiada de bloco e o caco de vidro em cima */
    c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1;
    const passo = 34;
    if(b.w > b.h) for(let px=b.x; px<b.x+b.w; px+=passo){
      c.beginPath(); c.moveTo(px, b.y); c.lineTo(px, b.y+b.h); c.stroke(); }
    else for(let py=b.y; py<b.y+b.h; py+=passo){
      c.beginPath(); c.moveTo(b.x, py); c.lineTo(b.x+b.w, py); c.stroke(); }
    for(let i=0;i<Math.round((b.w+b.h)/26);i++){
      const s = hash(`caco|${b.x}|${b.y}|${i}`);
      c.fillStyle = ['#7ac6c0','#c0d8a8','#d8c8a0'][s%3];
      const px = b.w>b.h ? b.x+(s%Math.max(1,b.w)) : b.x+b.w/2;
      const py = b.w>b.h ? b.y+b.h/2 : b.y+((s>>>5)%Math.max(1,b.h));
      c.fillRect(px, py-3, 4, 7);
    }
    pichar(c, b);
  }

  /* engradado de cerveja / carrinho de bola: pilha baixa que serve de arma */
  function engradado(c, b){
    c.fillStyle = '#3a2a1c'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 2;
    c.strokeRect(b.x+1, b.y+1, b.w-2, b.h-2);
    const cols = 3, rows = 3;
    for(let r=0;r<rows;r++) for(let k=0;k<cols;k++){
      c.fillStyle = '#7a5a2a';
      c.beginPath();
      c.arc(b.x + (k+0.5)*b.w/cols, b.y + (r+0.5)*b.h/rows,
            Math.min(b.w/cols, b.h/rows)*0.32, 0, Math.PI*2);
      c.fill();
    }
  }

  /* vitrine de loja de rua, com a grade de proteção baixada pela metade */
  function vitrine(c, b){
    c.fillStyle = '#c6bda8'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 2;
    c.strokeRect(b.x+1, b.y+1, b.w-2, b.h-2);
    /* o vidro da frente, virado pra calçada */
    c.fillStyle = 'rgba(120,170,190,.55)';
    c.fillRect(b.x+14, b.y+b.h-58, b.w-28, 44);
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2;
    c.strokeRect(b.x+14, b.y+b.h-58, b.w-28, 44);
    /* manequim atrás do vidro */
    for(let i=0;i<4;i++){
      c.fillStyle = ['#d8b23a','#c94a3a','#3a6ba8','#e8e2d2'][i%4];
      c.fillRect(b.x+34+i*((b.w-68)/4), b.y+b.h-52, 16, 32);
    }
    letreiro(c, b, b.rot || 'LOJA', '#f0e6c8');
  }

  /* joalheria: porta de aço, vidro blindado e a luz da vitrine */
  function joalheria(c, b){
    c.fillStyle = '#d2c8ae'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 3;
    c.strokeRect(b.x+1.5, b.y+1.5, b.w-3, b.h-3);
    /* a porta de aço sanfonada, que é o alvo */
    const px = b.x+b.w*0.34, pw = b.w*0.32;
    c.fillStyle = '#8f9298'; c.fillRect(px, b.y+b.h-34, pw, 30);
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 1.5;
    for(let k=0;k<10;k++){
      const lx = px + k*pw/10;
      c.beginPath(); c.moveTo(lx, b.y+b.h-34); c.lineTo(lx, b.y+b.h-4); c.stroke();
    }
    /* vitrine iluminada dos dois lados da porta */
    for(const vx of [b.x+16, b.x+b.w*0.70]){
      c.fillStyle = 'rgba(255,236,170,.55)';
      c.fillRect(vx, b.y+b.h-52, b.w*0.16, 42);
      c.fillStyle = '#e8d27a';
      for(let i=0;i<3;i++) c.fillRect(vx+8+i*16, b.y+b.h-40, 8, 8);
    }
    /* câmera na quina */
    c.fillStyle = '#2b2b2e';
    c.fillRect(b.x+b.w-30, b.y+b.h-70, 20, 10);
    c.fillStyle = '#c33';
    c.beginPath(); c.arc(b.x+b.w-12, b.y+b.h-65, 3, 0, Math.PI*2); c.fill();
    letreiro(c, b, 'JOALHERIA', '#f2e2a8');
  }

  /* agência bancária com o vestíbulo do caixa eletrônico */
  function banco(c, b){
    c.fillStyle = '#b9b3a4'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 3;
    c.strokeRect(b.x+1.5, b.y+1.5, b.w-3, b.h-3);
    /* frontão de colunas, que é como banco se anuncia */
    c.fillStyle = '#e0dbcc'; c.fillRect(b.x+10, b.y+8, b.w-20, 34);
    c.fillStyle = '#9d968a';
    for(let i=0;i<5;i++) c.fillRect(b.x+26+i*((b.w-52)/5), b.y+42, 16, 44);
    /* vestíbulo envidraçado com dois caixas eletrônicos */
    c.fillStyle = 'rgba(120,170,190,.45)';
    c.fillRect(b.x+b.w*0.28, b.y+10, b.w*0.44, 70);
    for(const dx of [0.34, 0.56]){
      c.fillStyle = '#2f4f3a';
      c.fillRect(b.x+b.w*dx, b.y+22, 44, 46);
      c.fillStyle = '#7ad0a0'; c.fillRect(b.x+b.w*dx+8, b.y+30, 28, 18);
    }
    letreiro(c, b, 'AGÊNCIA', '#e8e2d2');
    pichar(c, b);
  }

  function guarita(c, b){
    c.fillStyle = '#5c6b52'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 2;
    c.strokeRect(b.x+1, b.y+1, b.w-2, b.h-2);
    c.fillStyle = 'rgba(140,180,200,.5)';
    c.fillRect(b.x+8, b.y+8, b.w-16, b.h-30);
    c.fillStyle = '#d8b23a'; c.fillRect(b.x+8, b.y+b.h-16, b.w-16, 8);
  }

  function carroforte(c, b){
    c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(b.x+4, b.y+5, b.w, b.h);
    c.fillStyle = '#3f4a3a'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = '#22271f'; c.lineWidth = 3;
    c.strokeRect(b.x+1.5, b.y+1.5, b.w-3, b.h-3);
    /* a fresta blindada e o giroflex */
    c.fillStyle = '#1a1d18'; c.fillRect(b.x+b.w*0.16, b.y+8, b.w*0.22, b.h-16);
    c.fillStyle = '#d8b23a'; c.fillRect(b.x+b.w*0.62, b.y+6, 22, 10);
    c.fillStyle = '#e8e2d2'; c.font = '900 14px Arial, sans-serif';
    c.textAlign = 'center';
    c.fillText('VALORES', b.x+b.w*0.66, b.y+b.h/2+6);
  }

  /* ônibus da delegação, parado de frente pro portão */
  function onibus(c, b){
    c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(b.x+5, b.y+6, b.w, b.h);
    c.fillStyle = '#dcd6c6'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 3;
    c.strokeRect(b.x+1.5, b.y+1.5, b.w-3, b.h-3);
    /* faixa nas cores do clube e as janelas */
    c.fillStyle = '#1f4f8a'; c.fillRect(b.x, b.y+b.h*0.42, b.w, 18);
    c.fillStyle = 'rgba(24,30,38,.75)';
    for(let i=0;i<7;i++) c.fillRect(b.x+18+i*((b.w-40)/7), b.y+8, 24, 16);
    c.fillRect(b.x+b.w-26, b.y+8, 18, b.h-16);
  }

  /* vestiário / sala de imprensa: bloco baixo de alvenaria */
  function vestiario(c, b){
    c.fillStyle = '#8f9a92'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 3;
    c.strokeRect(b.x+1.5, b.y+1.5, b.w-3, b.h-3);
    /* telhado metálico de duas águas */
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2;
    for(let py=b.y+10; py<b.y+b.h-6; py+=13){
      c.beginPath(); c.moveTo(b.x+4, py); c.lineTo(b.x+b.w-4, py); c.stroke();
    }
    c.fillStyle = 'rgba(0,0,0,.3)';
    c.fillRect(b.x+b.w*0.12, b.y+b.h*0.40, 26, b.h*0.20);
    c.fillStyle = '#d8b23a';
    c.fillRect(b.x+b.w-46, b.y+16, 30, 12);
  }

  function arquibancada(c, b){
    c.fillStyle = '#9d968a'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 2;
    c.strokeRect(b.x+1, b.y+1, b.w-2, b.h-2);
    /* os degraus, com a cadeira pintada de duas cores */
    const n = Math.max(3, Math.round(b.h/22));
    for(let r=0;r<n;r++){
      c.fillStyle = r%2 ? '#7d766a' : '#8d867a';
      c.fillRect(b.x+3, b.y+3+r*(b.h-6)/n, b.w-6, (b.h-6)/n-2);
      for(let k=0;k<Math.round(b.w/28);k++){
        c.fillStyle = (k+r)%2 ? '#20539a' : '#c9c3b4';
        c.fillRect(b.x+8+k*28, b.y+6+r*(b.h-6)/n, 18, (b.h-6)/n-7);
      }
    }
  }

  /* -------------------------------------------------------
     CLASSE MÉDIA
     ------------------------------------------------------- */

  /* casa de muro baixo: garagem coberta, jardim na frente e laje com
     placa de aquecedor solar — o retrato do bairro que subiu de vida */
  function casaMedia(c, b){
    const s = `cm|${b.x}|${b.y}`;
    const pro = b.y < 512 ? 1 : -1;                 // que lado é a rua
    /* o corpo da casa, recuado do muro */
    c.fillStyle = '#b9b3a6'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 2;
    c.strokeRect(b.x+1, b.y+1, b.w-2, b.h-2);
    const rec = 62;                                  // o recuo do jardim
    const cy = pro > 0 ? b.y : b.y + rec;
    const ch = b.h - rec;
    c.fillStyle = dado(s, 2) ? '#a8532f' : '#8d8a80';
    c.fillRect(b.x+6, cy, b.w-12, ch);
    c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 2;
    c.strokeRect(b.x+6, cy, b.w-12, ch);
    /* telha em fiada, e a placa do aquecedor solar na laje */
    c.strokeStyle = 'rgba(0,0,0,.14)'; c.lineWidth = 1;
    for(let py=cy+8; py<cy+ch-4; py+=9){
      c.beginPath(); c.moveTo(b.x+9, py); c.lineTo(b.x+b.w-9, py); c.stroke();
    }
    c.fillStyle = '#243a4a';
    c.fillRect(b.x+b.w*0.55, cy+14, b.w*0.32, 30);
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1;
    c.strokeRect(b.x+b.w*0.55, cy+14, b.w*0.32, 30);
    /* o ar-condicionado e a caixa d'água escondida */
    c.fillStyle = '#d8d4c8'; c.fillRect(b.x+14, cy+16, 20, 14);
    /* jardim na frente, com grama cortada e o carro na garagem */
    const jy = pro > 0 ? b.y + ch : b.y;
    c.fillStyle = '#4f7040'; c.fillRect(b.x+6, jy, b.w-12, rec);
    for(let i=0;i<10;i++){
      const q = hash(`${s}|g|${i}`);
      c.fillStyle = 'rgba(96,124,70,.7)';
      c.fillRect(b.x+10+(q%Math.max(1,b.w-24)), jy+4+((q>>>6)%(rec-8)), 8, 5);
    }
    c.fillStyle = '#9a958c'; c.fillRect(b.x+b.w-62, jy, 52, rec);
    c.fillStyle = '#5a5f6a'; c.fillRect(b.x+b.w-56, jy+8, 40, rec-16);
    /* o muro baixo e o portão de chapa, virados pra rua */
    const my = pro > 0 ? b.y + b.h - 9 : b.y;
    c.fillStyle = '#cfc8b8'; c.fillRect(b.x, my, b.w, 9);
    c.fillStyle = '#7a5a2a'; c.fillRect(b.x+b.w-62, my, 52, 9);
  }

  /* predinho de três andares: caixa d'água, ar-condicionado e a laje */
  function predinho(c, b){
    const s = `pd|${b.x}|${b.y}`;
    c.fillStyle = '#a9a89f'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 2.5;
    c.strokeRect(b.x+1.5, b.y+1.5, b.w-3, b.h-3);
    c.fillStyle = 'rgba(0,0,0,.16)';
    c.fillRect(b.x+10, b.y+10, b.w-20, b.h-20);
    /* caixa d'água grande, casa de máquinas e as condensadoras na laje */
    c.fillStyle = '#2d6fa8';
    c.beginPath(); c.arc(b.x+b.w*0.30, b.y+b.h*0.32, 15, 0, Math.PI*2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#8f8d84'; c.fillRect(b.x+b.w*0.55, b.y+b.h*0.22, 48, 34);
    c.fillStyle = '#d8d4c8';
    for(let i=0;i<4;i++)
      c.fillRect(b.x+18+i*26, b.y+b.h-40, 20, 15);
    letreiro(c, b, 'EDIFÍCIO', '#e8e2d2');
  }

  /* padaria de esquina: toldo, mesa na calçada e a placa na fachada */
  function padaria(c, b){
    c.fillStyle = '#c9bfa6'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 2.5;
    c.strokeRect(b.x+1.5, b.y+1.5, b.w-3, b.h-3);
    const alto = b.y < 512;
    const ty = alto ? b.y + b.h - 30 : b.y;
    for(let px=b.x+6, k=0; px<b.x+b.w-6; px+=24, k++){
      c.fillStyle = k%2 ? '#e8e2d2' : '#c8452f';
      c.fillRect(px, ty, Math.min(24, b.x+b.w-6-px), 30);
    }
    c.fillStyle = 'rgba(120,170,190,.5)';
    c.fillRect(b.x+12, alto ? b.y+b.h-64 : b.y+34, b.w-24, 30);
    letreiro(c, b, 'PADARIA', '#f2e2a8');
  }

  /* árvore nova de calçada, no berço de concreto */
  function arvoreRua(c, b){
    const cx = b.x+b.w/2, cy = b.y+b.h/2;
    c.fillStyle = '#8f8a80'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 2;
    c.strokeRect(b.x+1, b.y+1, b.w-2, b.h-2);
    c.fillStyle = '#5a4a34'; c.fillRect(b.x+5, b.y+5, b.w-10, b.h-10);
    arvore(c, cx, cy, b.w*0.42, false);
  }

  function pontoOnibus(c, b){
    c.fillStyle = '#2f4f5a'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 2;
    c.strokeRect(b.x+1, b.y+1, b.w-2, b.h-2);
    c.fillStyle = 'rgba(190,220,230,.45)';
    c.fillRect(b.x+8, b.y+8, b.w-16, b.h-24);
    c.fillStyle = '#d8b23a'; c.fillRect(b.x+8, b.y+b.h-13, b.w-16, 7);
  }

  /* -------------------------------------------------------
     CLASSE ALTA
     ------------------------------------------------------- */

  /* torre residencial: muro alto com cerca elétrica, piscina e quadra
     na cobertura, rampa de garagem descendo */
  function torre(c, b){
    const s = `tr|${b.x}|${b.y}`;
    /* o terreno murado */
    c.fillStyle = '#8a9184'; c.fillRect(b.x, b.y, b.w, b.h);
    /* o muro alto, com o vergalhão da cerca elétrica por cima */
    c.fillStyle = '#d2cdc0'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = '#5c5952'; c.lineWidth = 7;
    c.strokeRect(b.x+3.5, b.y+3.5, b.w-7, b.h-7);
    c.strokeStyle = 'rgba(220,90,60,.75)'; c.lineWidth = 1.5;
    c.strokeRect(b.x+7, b.y+7, b.w-14, b.h-14);
    /* jardim interno */
    c.fillStyle = '#4a7040'; c.fillRect(b.x+12, b.y+12, b.w-24, b.h-24);
    /* a torre, recuada do muro */
    const tx = b.x+b.w*0.16, ty = b.y+b.h*0.16;
    const tw = b.w*0.68, th = b.h*0.60;
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(tx+6, ty+8, tw, th);
    c.fillStyle = '#c6c8c4'; c.fillRect(tx, ty, tw, th);
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 2.5;
    c.strokeRect(tx+1.5, ty+1.5, tw-3, th-3);
    /* piscina e quadra na cobertura */
    c.fillStyle = '#3d92b8'; c.fillRect(tx+tw*0.10, ty+th*0.14, tw*0.34, th*0.28);
    c.strokeStyle = '#e8ecec'; c.lineWidth = 2;
    c.strokeRect(tx+tw*0.10, ty+th*0.14, tw*0.34, th*0.28);
    c.fillStyle = '#7a8f5a'; c.fillRect(tx+tw*0.54, ty+th*0.14, tw*0.34, th*0.34);
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.5;
    c.strokeRect(tx+tw*0.54, ty+th*0.14, tw*0.34, th*0.34);
    /* casa de máquinas e caixa embutida */
    c.fillStyle = '#9d9a92'; c.fillRect(tx+tw*0.16, ty+th*0.58, tw*0.28, th*0.26);
    /* palmeira no jardim */
    for(let i=0;i<3;i++){
      const q = hash(`${s}|pm|${i}`);
      arvore(c, b.x+22+(q%Math.max(1,b.w-44)),
                b.y+b.h-30-((q>>>7)%30), 15, false);
    }
    /* a rampa da garagem, virada pra rua */
    const rampa = b.y < 512 ? b.y+b.h-16 : b.y;
    c.fillStyle = '#5e5b55'; c.fillRect(b.x+b.w*0.62, rampa, b.w*0.24, 16);
  }

  /* casa de alto padrão: muro liso, gramado cortado e piscina no fundo */
  function jardimAlto(c, b){
    const s = `ja|${b.x}|${b.y}`;
    c.fillStyle = '#dcd7c8'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = '#5c5952'; c.lineWidth = 7;
    c.strokeRect(b.x+3.5, b.y+3.5, b.w-7, b.h-7);
    c.strokeStyle = 'rgba(220,90,60,.75)'; c.lineWidth = 1.5;
    c.strokeRect(b.x+7, b.y+7, b.w-14, b.h-14);
    /* gramado */
    c.fillStyle = '#4f7a44'; c.fillRect(b.x+12, b.y+12, b.w-24, b.h-24);
    for(let i=0;i<14;i++){
      const q = hash(`${s}|g|${i}`);
      c.fillStyle = 'rgba(90,124,70,.6)';
      c.fillRect(b.x+16+(q%Math.max(1,b.w-32)), b.y+16+((q>>>6)%Math.max(1,b.h-32)), 10, 6);
    }
    /* a casa, de telhado claro */
    const cxx = b.x+b.w*0.14, cyy = b.y+b.h*0.20;
    const cw = b.w*0.56, chh = b.h*0.46;
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(cxx+5, cyy+6, cw, chh);
    c.fillStyle = '#c3b9a4'; c.fillRect(cxx, cyy, cw, chh);
    c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 2;
    c.strokeRect(cxx+1, cyy+1, cw-2, chh-2);
    c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(cxx+4, cyy+chh/2); c.lineTo(cxx+cw-4, cyy+chh/2); c.stroke();
    /* piscina e deck */
    c.fillStyle = '#eae4d6'; c.fillRect(b.x+b.w*0.60, b.y+b.h*0.52, b.w*0.30, b.h*0.30);
    c.fillStyle = '#3d92b8'; c.fillRect(b.x+b.w*0.64, b.y+b.h*0.56, b.w*0.22, b.h*0.22);
    /* duas palmeiras */
    arvore(c, b.x+b.w*0.24, b.y+b.h*0.76, 17, false);
    arvore(c, b.x+b.w*0.42, b.y+b.h*0.82, 14, false);
    /* portão de correr e a entrada coberta */
    const py = b.y < 512 ? b.y+b.h-9 : b.y;
    c.fillStyle = '#4a4a46'; c.fillRect(b.x+b.w*0.16, py, b.w*0.26, 9);
  }

  /* mangueira grande de calçada de bairro nobre */
  function arvoreGrande(c, b){
    const cx = b.x+b.w/2, cy = b.y+b.h/2;
    c.fillStyle = '#a29c90'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 2;
    c.strokeRect(b.x+1, b.y+1, b.w-2, b.h-2);
    c.fillStyle = '#4a3a24'; c.fillRect(b.x+6, b.y+6, b.w-12, b.h-12);
    arvore(c, cx, cy, b.w*0.62, false);
  }

  function manequim(c, b){
    const cx = b.x+b.w/2, cy = b.y+b.h/2;
    c.fillStyle = 'rgba(0,0,0,.35)';
    c.beginPath(); c.ellipse(cx+3, cy+4, b.w*0.5, b.h*0.4, 0, 0, Math.PI*2); c.fill();
    c.fillStyle = '#d8642a';
    c.beginPath(); c.arc(cx, cy, b.w*0.46, 0, Math.PI*2); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 2; c.stroke();
  }

  /* -------------------------------------------------------
     ENFEITES (não bloqueiam: o corpo passa raspando)
     ------------------------------------------------------- */
  const ENFEITE = {
    poste(c, e){
      c.save();
      /* o cone de luz, que de dia é só uma mancha clara */
      const g = c.createRadialGradient(e.x, e.y, 4, e.x, e.y, 70);
      g.addColorStop(0, 'rgba(255,236,180,.16)');
      g.addColorStop(1, 'rgba(255,236,180,0)');
      c.fillStyle = g; c.beginPath(); c.arc(e.x, e.y, 70, 0, Math.PI*2); c.fill();
      c.fillStyle = '#4a4740';
      c.beginPath(); c.arc(e.x, e.y, 6, 0, Math.PI*2); c.fill();
      c.strokeStyle = '#3a3833'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(e.x+22, e.y-8); c.stroke();
      c.fillStyle = '#e8dcae';
      c.beginPath(); c.arc(e.x+24, e.y-9, 5, 0, Math.PI*2); c.fill();
      c.restore();
    },
    orelhao(c, e){
      c.save();
      c.fillStyle = '#2f6bb8';
      c.beginPath(); c.arc(e.x, e.y, 15, Math.PI, Math.PI*2); c.fill();
      c.fillStyle = 'rgba(0,0,0,.35)';
      c.beginPath(); c.arc(e.x, e.y, 8, Math.PI, Math.PI*2); c.fill();
      c.restore();
    },
    lixeira(c, e){
      c.save();
      c.strokeStyle = '#4a4740'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(e.x, e.y); c.lineTo(e.x, e.y-14); c.stroke();
      c.fillStyle = '#3f6b3a';
      c.fillRect(e.x-11, e.y-24, 22, 14);
      c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 1.5;
      c.strokeRect(e.x-11, e.y-24, 22, 14);
      c.restore();
    },
    banco(c, e){
      c.save();
      c.translate(e.x, e.y); if(e.ang) c.rotate(Math.PI/2);
      c.fillStyle = '#8d7a5c'; c.fillRect(-36, -8, 72, 16);
      c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1.5;
      c.strokeRect(-36, -8, 72, 16);
      c.fillStyle = '#6f6b62'; c.fillRect(-32, -12, 8, 24); c.fillRect(24, -12, 8, 24);
      c.restore();
    },
    /* mesa de plástico branca com as quatro cadeiras: o boteco na calçada */
    mesa(c, e){
      c.save();
      c.fillStyle = 'rgba(0,0,0,.32)';
      c.beginPath(); c.arc(e.x+2, e.y+3, 15, 0, Math.PI*2); c.fill();
      for(const [dx,dy] of [[-22,0],[22,0],[0,-22],[0,22]]){
        c.fillStyle = '#e4e0d6';
        c.beginPath(); c.arc(e.x+dx, e.y+dy, 7, 0, Math.PI*2); c.fill();
        c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.stroke();
      }
      c.fillStyle = '#f0ece2';
      c.beginPath(); c.arc(e.x, e.y, 15, 0, Math.PI*2); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1.5; c.stroke();
      /* as garrafas em cima */
      c.fillStyle = '#3f6b2a';
      c.beginPath(); c.arc(e.x-4, e.y-3, 3, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(e.x+4, e.y+2, 3, 0, Math.PI*2); c.fill();
      c.restore();
    },
    lombada(c, e){
      c.save();
      for(let i=0;i<8;i++){
        c.fillStyle = i%2 ? '#e8e2d2' : '#3a3833';
        c.fillRect(e.x-160+i*40, e.y-11, 40, 22);
      }
      c.restore();
    }
  };

  /* bandeirinha de festa junina de poste a poste */
  function varal(c, a, b, chave){
    const [x1,y1] = a, [x2,y2] = b;
    const meioX = (x1+x2)/2, meioY = (y1+y2)/2 + 26;   // a barriga do fio
    c.save();
    c.strokeStyle = 'rgba(20,20,20,.6)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x1,y1); c.quadraticCurveTo(meioX, meioY, x2, y2); c.stroke();
    const cores = ['#c94a3a','#d8b23a','#3a6ba8','#3f8a3f','#c86ab0','#e8e2d2'];
    const n = 22;
    for(let i=1;i<n;i++){
      const t = i/n, u = 1-t;
      const px = u*u*x1 + 2*u*t*meioX + t*t*x2;
      const py = u*u*y1 + 2*u*t*meioY + t*t*y2;
      c.fillStyle = cores[(i + hash(chave)) % cores.length];
      c.beginPath();
      c.moveTo(px-6, py); c.lineTo(px+6, py); c.lineTo(px, py+12);
      c.closePath(); c.fill();
    }
    c.restore();
  }

  const PINTOR = {
    igreja, coreto, canteiro, carro, cacamba, banca, quiosque, boteco,
    predio, sobrado, casa, muro,
    'bar-rival':barRival, engradado, vitrine, joalheria, banco, guarita,
    carroforte, onibus, vestiario, arquibancada, manequim,
    'casa-media':casaMedia, predinho, padaria, 'arvore-rua':arvoreRua,
    'ponto-onibus':pontoOnibus, torre, 'jardim-alto':jardimAlto,
    'arvore-grande':arvoreGrande
  };

  /* -------------------------------------------------------
     AS DUAS CENAS
     ------------------------------------------------------- */
  /* A praça é um largo: quadra aberta no meio, rua contornando os quatro
     lados e uma transversal chegando no meio de cada borda — quatro
     esquinas, uma por lado. O piso é calçada portuguesa quase toda, com
     duas ilhas de canteiro só; espaço aberto é o que a briga pede. */
  function praca(c, D, W, H){
    c.fillStyle = '#22201e'; c.fillRect(0, 0, W, H);
    asfalto(c, 0, 0, W, H, 'praca-asf');

    /* a mesma régua de dados/cenas.js: fachada, rua de contorno, largo */
    const MX = 226, MY = 250, FX = 96, FY = 120, VAO = 190;
    const cx = W/2, cy = H/2;

    /* o largo, de calçada portuguesa */
    calcadaPortuguesa(c, MX, MY, W-MX*2, H-MY*2);
    meioFio(c, MX, MY-8, W-MX*2, 8, true);
    meioFio(c, MX, H-MY, W-MX*2, 8, true);
    meioFio(c, MX-8, MY, 8, H-MY*2, false);
    meioFio(c, W-MX, MY, 8, H-MY*2, false);

    /* calçada dos comércios, colada na fachada dos quatro lados */
    calcadaComum(c, 0, FY, W, 22, 'praca-cn');
    calcadaComum(c, 0, H-FY-22, W, 22, 'praca-cs');
    calcadaComum(c, FX, FY, 22, H-FY*2, 'praca-co');
    calcadaComum(c, W-FX-22, FY, 22, H-FY*2, 'praca-cl');

    /* as quatro transversais: a boca de cada uma no meio de uma borda */
    asfalto(c, cx-VAO/2, 0, VAO, MY, 'praca-tn');
    asfalto(c, cx-VAO/2, H-MY, VAO, MY, 'praca-ts');
    asfalto(c, 0, cy-VAO/2, MX, VAO, 'praca-to');
    asfalto(c, W-MX, cy-VAO/2, MX, VAO, 'praca-tl');

    /* eixo tracejado no meio de cada pista, pra ler como rua e não pátio */
    c.save();
    c.strokeStyle = 'rgba(226,200,110,.6)'; c.lineWidth = 4;
    c.setLineDash([38, 30]);
    for(const y of [(FY+MY)/2, H-(FY+MY)/2]){
      c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
    }
    for(const x of [(FX+MX)/2, W-(FX+MX)/2]){
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke();
    }
    c.setLineDash([]); c.restore();

    /* faixa de pedestre atravessando cada boca */
    faixaPedestre(c, cx, (FY+MY)/2, VAO-30, 52, false);
    faixaPedestre(c, cx, H-(FY+MY)/2, VAO-30, 52, false);
    faixaPedestre(c, (FX+MX)/2, cy, VAO-30, 52, true);
    faixaPedestre(c, W-(FX+MX)/2, cy, VAO-30, 52, true);

    /* os dois caminhos que cortam o largo em cruz, batendo em cada boca */
    c.save();
    c.strokeStyle = 'rgba(0,0,0,.16)'; c.lineWidth = 62; c.lineCap = 'butt';
    c.beginPath(); c.moveTo(MX, cy); c.lineTo(W-MX, cy); c.stroke();
    c.beginPath(); c.moveTo(cx, MY); c.lineTo(cx, H-MY); c.stroke();
    c.strokeStyle = '#bdb4a4'; c.lineWidth = 56;
    c.beginPath(); c.moveTo(MX, cy); c.lineTo(W-MX, cy); c.stroke();
    c.beginPath(); c.moveTo(cx, MY); c.lineTo(cx, H-MY); c.stroke();
    c.restore();

    blocos(c, D);
    enfeites(c, D);
  }

  /* Rua larga de bairro, com calçada larga dos dois lados e uma
     transversal em cada ponta — duas esquinas de cada lado. A pista é
     o corredor da briga; as calçadas dão por onde escapar sem sair
     da cena, e as transversais deixam flanquear em vez de bater de frente. */
  /* As três ruas dividem o mesmo chão: pista de 330 a H-330, calçada larga
     dos dois lados e uma transversal em cada ponta. O que muda é o
     acabamento — asfalto remendado ou novo, calçada de cimento ou de
     bloquete, faixa de estacionamento pintada. */
  function chaoDeRua(c, W, H, est){
    const PONTA = 250;
    terreno(c, 0, 0, W, H, est.id+'-terr', est.fundo);
    est.calcada(c, 0, 190, W, 140, est.id+'-cn');
    est.calcada(c, 0, H-330, W, 140, est.id+'-cs');
    asfalto(c, 0, 330, W, H-660, est.id+'-asf');
    if(est.pedra) paralelepipedo(c, 620, 330, 300, H-660, est.id+'-pp');
    /* as duas transversais das pontas, atravessando de cima a baixo */
    asfalto(c, 0, 0, PONTA-40, H, est.id+'-to');
    asfalto(c, W-PONTA+40, 0, PONTA-40, H, est.id+'-tl');
    /* a calçada dobra a esquina: cada casa de quina fica com a dela */
    for(const x of [0, W-PONTA+40]){
      est.calcada(c, x, 190, PONTA-40, 26, est.id+'-q'+x);
      est.calcada(c, x, H-216, PONTA-40, 26, est.id+'-r'+x);
    }
    /* asfalto novo é liso: o remendo e o buraco só valem na periferia */
    if(est.liso){
      c.save(); c.fillStyle = 'rgba(58,58,64,.55)';
      c.fillRect(0, 330, W, H-660);
      c.fillRect(0, 0, PONTA-40, H); c.fillRect(W-PONTA+40, 0, PONTA-40, H);
      c.restore();
    }
    meioFio(c, 0, 322, W, 9, true);
    meioFio(c, 0, H-331, W, 9, true);
    /* faixa de estacionamento demarcada, que bairro cuidado tem */
    if(est.vagas){
      c.save(); c.strokeStyle = 'rgba(238,234,222,.75)'; c.lineWidth = 3;
      for(const y of [[340, 400], [H-400, H-340]])
        for(let x=PONTA+40; x<W-PONTA-40; x+=124){
          c.beginPath(); c.moveTo(x, y[0]); c.lineTo(x, y[1]); c.stroke();
        }
      c.restore();
    }
    /* eixo tracejado da pista e das duas transversais */
    c.save();
    c.strokeStyle = est.eixo; c.lineWidth = 5;
    c.setLineDash([44, 34]);
    c.beginPath(); c.moveTo(0, 512); c.lineTo(W, 512); c.stroke();
    c.setLineDash([32, 26]);
    for(const x of [(PONTA-40)/2, W-(PONTA-40)/2]){
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke();
    }
    c.setLineDash([]); c.restore();
    /* faixa nas quatro esquinas, que é onde pedestre atravessa */
    faixaPedestre(c, PONTA+30, 512, 320, 60, true);
    faixaPedestre(c, W-PONTA-30, 512, 320, 60, true);
    faixaPedestre(c, (PONTA-40)/2, 260, 150, 52, false);
    faixaPedestre(c, W-(PONTA-40)/2, 764, 150, 52, false);
  }

  /* periferia: cimento gasto, remendo no asfalto, trecho de pedra */
  function rua(c, D, W, H){
    chaoDeRua(c, W, H, {id:'rua', calcada:calcadaComum, pedra:true,
                        eixo:'rgba(226,200,110,.75)'});
    blocos(c, D); enfeites(c, D);
  }

  /* classe média: bloquete na calçada, asfalto inteiro e vaga pintada */
  function ruaMedia(c, D, W, H){
    chaoDeRua(c, W, H, {id:'rua-media', calcada:bloquete, liso:true, vagas:true,
                        fundo:'#5f5a4a', eixo:'rgba(240,214,120,.9)'});
    blocos(c, D); enfeites(c, D);
  }

  /* classe alta: calçada de pedra clara, asfalto novo, faixa contínua */
  function ruaNobre(c, D, W, H){
    chaoDeRua(c, W, H, {id:'rua-nobre', calcada:pedraClara, liso:true,
                        fundo:'#4e5544', eixo:'rgba(246,240,224,.9)'});
    blocos(c, D); enfeites(c, D);
  }

  /* bloquete intertravado: a calçada que a prefeitura assenta em bairro
     de classe média — junta certinha e nada de mato */
  function bloquete(c, x, y, w, h, chave){
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.fillStyle = '#b6ada0'; c.fillRect(x, y, w, h);
    const p = 22;
    for(let ry=y, l=0; ry<y+h; ry+=p, l++)
      for(let rx=x - (l%2)*p/2; rx<x+w; rx+=p){
        const s = hash(`${chave}|bq|${rx}|${ry}`);
        const t = 176 + (s%16);
        c.fillStyle = `rgb(${t},${t-8},${t-20})`;
        c.fillRect(rx+1, ry+1, p-2.5, p-2.5);
      }
    c.restore();
  }

  /* pedra clara serrada: a calçada larga de bairro nobre */
  function pedraClara(c, x, y, w, h, chave){
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.fillStyle = '#ded8ca'; c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(0,0,0,.13)'; c.lineWidth = 1.5;
    for(let px=x; px<x+w; px+=52){ c.beginPath(); c.moveTo(px,y); c.lineTo(px,y+h); c.stroke(); }
    for(let py=y; py<y+h; py+=52){ c.beginPath(); c.moveTo(x,py); c.lineTo(x+w,py); c.stroke(); }
    /* faixa de grama entre a calçada e o meio-fio */
    c.fillStyle = 'rgba(84,116,68,.75)';
    if(h > 60){ c.fillRect(x, y+h-20, w, 16); }
    c.restore();
  }

  /* Esquina do bar: a rua faz L, o bar toma a quina e a calçada da
     frente dele é larga porque é ali que ficam as mesas. */
  function bar(c, D, W, H){
    terreno(c, 0, 0, W, H, 'bar-terr');               // quintal e beco no fundo
    asfalto(c, 0, 430, W, 430, 'bar-asf');            // a rua da frente
    calcadaComum(c, 0, 340, W, 92, 'bar-calc-n');
    calcadaComum(c, 0, 800, W, 92, 'bar-calc-s');
    calcadaComum(c, 1010, 430, 526, 148, 'bar-calc-bar');   // o deck das mesas
    meioFio(c, 0, 428, W, 8, true);
    meioFio(c, 0, 856, W, 8, true);
    c.save();
    c.strokeStyle = 'rgba(226,200,110,.7)'; c.lineWidth = 5;
    c.setLineDash([40, 32]);
    c.beginPath(); c.moveTo(0, 644); c.lineTo(W, 644); c.stroke();
    c.setLineDash([]); c.restore();
    faixaPedestre(c, 560, 644, 300, 58, true);
    blocos(c, D);
    enfeites(c, D);
  }

  /* Rua de comércio: pista larga, calçadão dos dois lados e a vaga
     demarcada onde para o carro-forte. */
  function comercio(c, D, W, H){
    terreno(c, 0, 0, W, H, 'com-terr', '#4a4238');    // o beco de serviço atrás
    calcadaComum(c, 0, 250, W, 130, 'com-calc-n');
    calcadaComum(c, 0, 630, W, 130, 'com-calc-s');
    asfalto(c, 0, 380, W, 250, 'com-asf');
    meioFio(c, 0, 372, W, 9, true);
    meioFio(c, 0, 630, W, 9, true);
    c.save();
    c.strokeStyle = 'rgba(226,200,110,.75)'; c.lineWidth = 5;
    c.setLineDash([44, 34]);
    c.beginPath(); c.moveTo(0, 505); c.lineTo(W, 505); c.stroke();
    c.setLineDash([]); c.restore();
    /* vaga de carga e descarga, listrada de amarelo */
    c.save();
    c.strokeStyle = 'rgba(226,200,110,.55)'; c.lineWidth = 4;
    c.strokeRect(580, 640, 220, 100);
    c.restore();
    faixaPedestre(c, 300, 505, 250, 60, true);
    faixaPedestre(c, 1180, 505, 250, 60, true);
    blocos(c, D);
    enfeites(c, D);
  }

  /* CT: gramado no meio, estacionamento de saibro na entrada e o
     alambrado separando um do outro. */
  function ct(c, D, W, H){
    /* fora do muro é a rua de acesso; o portão a oeste dá nela */
    asfalto(c, 0, 0, W, H, 'ct-acesso');
    /* saibro do estacionamento, a oeste do alambrado */
    c.fillStyle = '#8a6a4a'; c.fillRect(60, 96, 300, H-192);
    for(let i=0;i<120;i++){
      const s = hash(`saibro|${i}`);
      c.fillStyle = (s%3) ? 'rgba(120,92,62,.6)' : 'rgba(60,46,32,.4)';
      c.fillRect(60+(s%300), 96+((s>>>7)%(H-192)), 5+(s%7), 4);
    }
    /* o gramado de treino, com as faixas do cortador */
    c.fillStyle = '#2f6b34'; c.fillRect(360, 96, W-420, H-192);
    for(let px=360, k=0; px<W-60; px+=76, k++){
      c.fillStyle = k%2 ? 'rgba(255,255,255,.055)' : 'rgba(0,0,0,.06)';
      c.fillRect(px, 96, 76, H-192);
    }
    /* linhas de campo reduzido, do jeito que treino usa */
    c.save();
    c.strokeStyle = 'rgba(236,240,232,.55)'; c.lineWidth = 4;
    c.strokeRect(420, 180, 560, H-360);
    c.beginPath(); c.moveTo(700, 180); c.lineTo(700, H-180); c.stroke();
    c.beginPath(); c.arc(700, 512, 92, 0, Math.PI*2); c.stroke();
    c.strokeRect(420, 372, 100, 280);
    c.strokeRect(880, 372, 100, 280);
    c.restore();
    /* cone de treino espalhado */
    for(let i=0;i<14;i++){
      const s = hash(`cone|${i}`);
      const px = 470 + (s % 820), py = 220 + ((s>>>6) % 560);
      c.fillStyle = '#e06a1e';
      c.beginPath(); c.moveTo(px, py-9); c.lineTo(px+7, py+6); c.lineTo(px-7, py+6);
      c.closePath(); c.fill();
    }
    blocos(c, D);
    enfeites(c, D);
  }

  function blocos(c, D){
    for(const b of D.blocos || []){
      const f = PINTOR[b.tipo];
      if(f) f(c, b);
      else { c.fillStyle = '#5a564e'; c.fillRect(b.x, b.y, b.w, b.h); }
    }
  }
  function enfeites(c, D){
    for(const [i, v] of (D.varais||[]).entries()) varal(c, v[0], v[1], D.id+i);
    for(const e of D.enfeites || []){
      const f = ENFEITE[e.tipo];
      if(f) f(c, e);
    }
  }

  const CENAS = {praca, rua, 'rua-media':ruaMedia, 'rua-nobre':ruaNobre,
                 bar, comercio, ct};
  const pintar = (c, D, W, H) => {
    const f = CENAS[D && D.pintura];
    if(!f) return false;
    f(c, D, W, H);
    return true;
  };

  return {pintar, CENAS, ENFEITE, PINTOR, arvore, varal,
          asfalto, calcadaPortuguesa, calcadaComum, paralelepipedo,
          bloquete, pedraClara, terreno, meioFio, faixaPedestre};
})();
