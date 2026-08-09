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

  function quiosque(c, b){
    c.fillStyle = '#d8b23a'; c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 2;
    c.strokeRect(b.x+1, b.y+1, b.w-2, b.h-2);
    c.fillStyle = '#b8352c';
    c.fillRect(b.x+b.w*0.2, b.y+b.h*0.2, b.w*0.6, b.h*0.6);
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
    predio, sobrado, casa, muro:predio
  };

  /* -------------------------------------------------------
     AS DUAS CENAS
     ------------------------------------------------------- */
  function praca(c, D, W, H){
    c.fillStyle = '#22201e'; c.fillRect(0, 0, W, H);
    /* rua contornando a praça, e a praça de calçada portuguesa no meio */
    asfalto(c, 0, 0, W, H, 'praca-asf');
    calcadaPortuguesa(c, 150, 150, W-300, H-300);
    /* meio-fio dos quatro lados */
    meioFio(c, 150, 142, W-300, 8, true);
    meioFio(c, 150, H-158, W-300, 8, true);
    meioFio(c, 142, 150, 8, H-300, false);
    meioFio(c, W-158, 150, 8, H-300, false);
    /* faixas de pedestre nas quatro bocas */
    faixaPedestre(c, 384, 100, 90, 54, false);
    faixaPedestre(c, 1152, 924, 90, 54, false);
    faixaPedestre(c, 60, 512, 90, 54, true);
    faixaPedestre(c, 1476, 512, 90, 54, true);
    /* caminho diagonal de quem corta a praça */
    c.save();
    c.strokeStyle = '#b9b0a0'; c.lineWidth = 40; c.lineCap = 'round';
    c.beginPath(); c.moveTo(170,170); c.lineTo(W-170,H-170); c.stroke();
    c.beginPath(); c.moveTo(W-170,170); c.lineTo(170,H-170); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 44;
    c.beginPath(); c.moveTo(170,170); c.lineTo(W-170,H-170); c.stroke();
    c.beginPath(); c.moveTo(W-170,170); c.lineTo(170,H-170); c.stroke();
    c.restore();
    blocos(c, D);
    enfeites(c, D);
  }

  function rua(c, D, W, H){
    /* a viela entre as casas é escura, não é buraco na tela */
    c.fillStyle = '#1d1b19'; c.fillRect(0, 0, W, H);
    /* calçada dos dois lados, asfalto no meio e um trecho de pedra */
    calcadaComum(c, 0, 250, W, 110, 'calc-n');
    calcadaComum(c, 0, H-360, W, 110, 'calc-s');
    asfalto(c, 0, 360, W, H-720, 'rua-asf');
    paralelepipedo(c, 520, 360, 420, H-720, 'rua-pp');
    /* meio-fio nas duas bordas do asfalto */
    meioFio(c, 0, 352, W, 9, true);
    meioFio(c, 0, H-361, W, 9, true);
    /* eixo tracejado no meio da pista */
    c.save();
    c.strokeStyle = 'rgba(226,200,110,.75)'; c.lineWidth = 5;
    c.setLineDash([44, 34]);
    c.beginPath(); c.moveTo(0, 512); c.lineTo(W, 512); c.stroke();
    c.setLineDash([]); c.restore();
    faixaPedestre(c, 250, 512, 300, 60, true);
    faixaPedestre(c, 1290, 512, 300, 60, true);
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

  const CENAS = {praca, rua};
  const pintar = (c, D, W, H) => {
    const f = CENAS[D && D.pintura];
    if(!f) return false;
    f(c, D, W, H);
    return true;
  };

  return {pintar, CENAS, ENFEITE, PINTOR, arvore, varal,
          asfalto, calcadaPortuguesa, calcadaComum, paralelepipedo,
          meioFio, faixaPedestre};
})();
