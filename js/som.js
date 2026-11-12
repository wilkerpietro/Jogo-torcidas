/* =========================================================
   O SOM DA BRIGA (dono, 12/11/2026)
   "Som: grito de torcida, sirene e bomba são o que mais aumenta a
   sensação de briga pelo menor custo." Não há arquivo de áudio: tudo é
   sintetizado na hora (WebAudio) — ruído filtrado pra pancada, queda,
   bomba e gás; duas notas alternadas pra sirene; um apito.

   O combate não toca nada: ele anota o nome do som em `J.sons` e a
   ponte chama `TO.som.escoar(J)` uma vez por quadro. O navegador só
   libera áudio depois de um gesto do jogador; até lá fica calado.
   Liga/desliga em `TO.som.ligado` (guardado em localStorage).
   ========================================================= */
window.TO = window.TO || {};
TO.som = (function(){
  let ctx = null, ruido = null, ligado = true, ultimo = {};
  try{ ligado = localStorage.getItem('to.som') !== '0'; }catch(_){}
  const AC = window.AudioContext || window.webkitAudioContext;
  function contexto(){
    if(!AC) return null;
    if(!ctx){
      try{ ctx = new AC(); }catch(_){ return null; }
      const n = ctx.sampleRate, b = ctx.createBuffer(1, n, n), d = b.getChannelData(0);
      for(let i = 0; i < n; i++) d[i] = Math.random()*2 - 1;
      ruido = b;
    }
    if(ctx.state === 'suspended'){ try{ ctx.resume(); }catch(_){} }
    return ctx.state === 'running' ? ctx : null;
  }
  /* o primeiro toque ou tecla acorda o áudio */
  const acordar = () => { if(ligado) contexto(); };
  addEventListener('pointerdown', acordar, {passive:true});
  addEventListener('keydown', acordar);

  /* um sopro de ruído filtrado: o corpo de quase todo som daqui */
  function sopro(c, o){
    const t = c.currentTime + (o.em || 0), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = ruido; s.loop = true;
    f.type = o.tipo || 'lowpass'; f.frequency.setValueAtTime(o.f0, t);
    if(o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
    f.Q.value = o.q || 0.7;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol, t + (o.ataque || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    s.connect(f); f.connect(g); g.connect(c.destination);
    s.start(t, Math.random()*0.5); s.stop(t + o.dur + 0.05);
  }
  function nota(c, o){
    const t = c.currentTime + (o.em || 0), os = c.createOscillator(), g = c.createGain();
    os.type = o.onda || 'sine'; os.frequency.setValueAtTime(o.f0, t);
    if(o.f1) os.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol, t + (o.ataque || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    os.connect(g); g.connect(c.destination);
    os.start(t); os.stop(t + o.dur + 0.05);
  }
  const SONS = {
    soco(c){ sopro(c, {f0:900, f1:180, dur:0.09, vol:0.22}); nota(c, {f0:150, f1:70, dur:0.08, vol:0.18}); },
    chute(c){ sopro(c, {f0:600, f1:120, dur:0.14, vol:0.3}); nota(c, {f0:110, f1:48, dur:0.14, vol:0.28}); },
    queda(c){ sopro(c, {f0:320, f1:70, dur:0.22, vol:0.3}); nota(c, {f0:80, f1:38, dur:0.2, vol:0.3}); },
    bomba(c){ sopro(c, {f0:2400, f1:60, dur:0.9, vol:0.7, ataque:0.002}); nota(c, {f0:90, f1:28, dur:0.7, vol:0.6}); },
    gas(c){ sopro(c, {f0:1800, f1:300, dur:0.25, vol:0.4, ataque:0.002});
            sopro(c, {tipo:'bandpass', f0:5200, f1:2600, dur:2.4, vol:0.12, ataque:0.2, q:1.2, em:0.1}); },
    pedra(c){ sopro(c, {tipo:'bandpass', f0:2600, f1:900, dur:0.07, vol:0.2, q:2}); },
    apito(c){ nota(c, {onda:'square', f0:2300, f1:2500, dur:0.5, vol:0.06}); },
    sirene(c){ for(let i = 0; i < 6; i++) nota(c, {onda:'sawtooth', f0:i%2 ? 620 : 880, dur:0.36, vol:0.07, em:i*0.36, ataque:0.03}); }
  };
  /* dois sons iguais colados (dez socos no mesmo quadro) viram um só */
  const FOLGA = {soco:0.05, chute:0.07, queda:0.1, pedra:0.05, gas:0.5, sirene:2.5, apito:1, bomba:0.15};
  function tocar(nome){
    if(!ligado || !SONS[nome]) return;
    const c = contexto(); if(!c) return;
    const agora = c.currentTime;
    if(agora - (ultimo[nome] || -9) < (FOLGA[nome] || 0.05)) return;
    ultimo[nome] = agora;
    try{ SONS[nome](c); }catch(_){}
  }
  /* esvazia a fila que o combate encheu */
  function escoar(J){
    if(!J || !J.sons || !J.sons.length) return;
    const fila = J.sons; J.sons = [];
    if(ligado) for(const n of fila) tocar(n);
  }
  return {tocar, escoar,
          get ligado(){ return ligado; },
          set ligado(v){ ligado = !!v; try{ localStorage.setItem('to.som', ligado ? '1' : '0'); }catch(_){} }};
})();
