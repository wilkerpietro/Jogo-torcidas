/* =========================================================
   BONECOS EM THREE.JS — a camada de gente por cima da cena 2D

   Pedido do dono (05/09/2026): refazer toda a animação do boneco
   num desenho em Three.js, com mais detalhe na construção e nos
   movimentos. A cena de cima continua sendo o canvas 2D de sempre
   (foto, malha, nome e vida); este módulo desenha, num canvas WebGL
   transparente por cima, gente, PM, pedra, bomba, fumaça e grade —
   com a mesma API que `tres.js` oferecia à ponte (`montar`,
   `desenharDeCima`, `limparDeCima`, `escalaDeCima`), então a ponte
   escolhe este quando o Three.js está carregado e cai no antigo
   quando não está.

   O CORPO. Uma hierarquia de juntas de verdade: pélvis → tronco →
   peito → pescoço → cabeça; ombro → cotovelo → mão; quadril → joelho
   → pé. Cada junta é um Group do Three.js e cada osso uma cápsula
   ou caixa; a pose é um objeto de ângulos por junta. Cabeça com
   olhos, sobrancelha, nariz, boca e orelha; cabelo, boné, bandana ou
   careca; barba em parte deles; camisa nas cores da torcida com
   listras; bermuda ou calça; tênis. O líder é maior e usa bandana.

   O MOVIMENTO. Cada figura tem uma pose atual e uma pose-alvo; a
   atual persegue a alvo com velocidade que depende do estado (soco
   é seco, descanso é lento), então nenhuma troca de estado dá
   pulo. Os estados vêm dos sinais do combate, que este módulo só lê:
   velocidade medida (andar, correr), `golpe`/`_alvo` (socar),
   `apanhou` (levar), `atordoado` (cambalear), `arremesso` (tacar),
   `fugindo`/`fugaBomba` (correr olhando pra trás / cobrindo a
   cabeça), `hostil` (guarda), `linha` (a retaguarda grita e
   gesticula), `caido`/`preso` (cair / sentar), `tremor`.

   A CÂMERA é ortográfica casada ponto a ponto com a transformação
   do 2D, com um cisalhamento leve: o que é alto sobe um pouco na
   tela, pra corpo ter volume sem sair do lugar no chão.
   ========================================================= */
window.TO = window.TO || {};
TO.diaJogo = TO.diaJogo || {};

TO.diaJogo.bonecos3 = (function(){
  const U = TO.util;
  const A = () => TO.diaJogo.arredores;

  let cv=null, renderer=null, scene=null, cam=null, ativo=false;
  let escalaDeCima = 1.25;
  const CISALHA = 0.42;         // quanto a altura sobe na tela (0 = de cima exato)
  const ALTURA_CAM = 1000;

  /* ---------- paletas ---------- */
  const PELE   = ['#f2c9a6','#e0b088','#c8916a','#a8704c','#7a4b30','#5a3622','#d9a680','#b8825c'];
  const CALCA  = ['#2b2f3a','#1e2a44','#3a3a3a','#4a3b2a','#23262b','#565a63','#2f4a6b','#1a1a1a'];
  const CABELO = ['#111111','#2a1a10','#3b2a1a','#000000','#4a3626','#1a1a1a','#5c4030'];
  const TENIS  = ['#f0f0f0','#111111','#e8e8e8','#2b2b2b','#d8d0c0'];
  const PRETO='#101010', BRANCO='#f4f4f4';

  /* ---------- semente por figura ---------- */
  function hash(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
  const frac = s => (hash(s)%10007)/10007;
  const dado = (s,n) => hash(s)%n;

  /* ---------- materiais e geometrias compartilhados ---------- */
  const mats = new Map();
  function mat(hex, opc){
    const k = hex + (opc?JSON.stringify(opc):'');
    let m = mats.get(k);
    if(!m){ m = new THREE.MeshLambertMaterial(Object.assign({color:new THREE.Color(hex)}, opc||{})); mats.set(k,m); }
    return m;
  }
  const geo = {};
  function G(){
    if(geo.pronto) return geo;
    geo.caixa   = new THREE.BoxGeometry(1,1,1);
    geo.esfera  = new THREE.SphereGeometry(1, 14, 10);
    geo.capsula = new THREE.CapsuleGeometry(0.5, 1, 4, 10);   // raio .5, comprimento 1 → escala dá o osso
    geo.cil     = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
    geo.cone    = new THREE.ConeGeometry(0.5, 1, 12);
    geo.disco   = new THREE.CircleGeometry(1, 20);
    geo.anel    = new THREE.RingGeometry(0.9, 1, 40);
    geo.pedra   = new THREE.DodecahedronGeometry(1, 0);
    geo.pronto = true;
    return geo;
  }

  const capsulas = new Map();
  function capsula(comp, raio){
    const k = comp.toFixed(2)+'|'+raio.toFixed(2);
    let c = capsulas.get(k);
    if(!c){ c = new THREE.CapsuleGeometry(raio, Math.max(0.01, comp - raio*2), 4, 10); capsulas.set(k, c); }
    return c;
  }
  function junta(pai, x, y, z){
    const j = new THREE.Group(); j.position.set(x, y, z); pai.add(j); return j;
  }

  /* O ACUMULADOR: as peças fixas de um osso (cabeça + olho + nariz +
     boné…) viram UMA malha com cor por vértice. Sem isto cada figura
     eram 27 chamadas de desenho; com isto são 15 — o que separa é só
     o que se mexe sozinho (cada junta). */
  const matVertices = new THREE.MeshLambertMaterial({vertexColors:true});
  const matVerticesTransp = new THREE.MeshLambertMaterial({vertexColors:true, transparent:true, opacity:0.75});
  class Acumulador{
    constructor(){ this.pos=[]; this.nor=[]; this.cor=[]; }
    add(g, hex, sx, sy, sz, x, y, z, rx, ry, rz){
      const src = g.index ? g.toNonIndexed() : g;
      const m = new THREE.Matrix4().compose(new THREE.Vector3(x||0,y||0,z||0),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(rx||0, ry||0, rz||0)), new THREE.Vector3(sx,sy,sz));
      const nm = new THREE.Matrix3().getNormalMatrix(m);
      const P = src.attributes.position, N = src.attributes.normal;
      const c = new THREE.Color(hex);
      const v = new THREE.Vector3();
      for(let i=0;i<P.count;i++){
        v.fromBufferAttribute(P, i).applyMatrix4(m); this.pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); this.nor.push(v.x, v.y, v.z);
        this.cor.push(c.r, c.g, c.b);
      }
      return this;
    }
    capsula(comp, raio, hex, x, y, z, rx, ry, rz){ return this.add(capsula(comp, raio), hex, 1,1,1, x, y, z, rx, ry, rz); }
    mesh(pai, transp){
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(this.cor, 3));
      const m = new THREE.Mesh(g, transp ? matVerticesTransp : matVertices);
      if(pai) pai.add(m);
      return m;
    }
  }

  /* =======================================================
     A FICHA VISUAL: o que é fixo em cada figura
     ======================================================= */
  function corLado(lado, claro){
    if(lado==='visitante') return claro?'#e8e8e8':'#2a5fa8';
    return claro?'#e8e4dc':'#c0392b';
  }
  function fichaDe(d, i){
    if(d._b3) return d._b3;
    const s = (d.nome||'')+'|'+(d.spawn||'')+'|'+i;
    const camisa = d.cor || corLado(d.lado,false);
    const faixa  = d.cor2 || corLado(d.lado,true);
    const cabeca = dado(s+'cab', 10);   // 0-4 cabelo, 5-7 boné, 8 bandana, 9 careca
    d._b3 = {
      sem:s, fase:frac(s+'f')*6.28, yaw:frac(s+'y')*6.28,
      pele:PELE[dado(s+'p',PELE.length)],
      calca:CALCA[dado(s+'c',CALCA.length)],
      cabelo:CABELO[dado(s+'h',CABELO.length)],
      tenis:TENIS[dado(s+'t',TENIS.length)],
      bermuda: frac(s+'bm') < 0.5,
      listras: dado(s+'ls', 3),           // 0 lisa, 1 duas faixas, 2 três faixas
      tipoCabeca: d.lider ? 'bandana' : (cabeca<=4?'cabelo':cabeca<=7?'bone':cabeca===8?'bandana':'careca'),
      corBone: frac(s+'bc') < 0.6 ? camisa : PRETO,
      barba: frac(s+'bb') < 0.3,
      camisa, faixa,
      escala: (d.lider ? 1.1 : 0.94 + frac(s+'e')*0.1),
      largo: 0.92 + frac(s+'lg')*0.2,     // largura de ombro
      /* memória da animação */
      soco:0, ladoSoco:dado(s+'ls2',2), tSoco:0, gancho:false,
      grito:frac(s+'gr')*6, olhaTras:0, tGesto:0, gesto:0,
      queda:null, caiDeFrente: frac(s+'q') < 0.55, cobre: frac(s+'cb') < 0.6,
      px:null, pz:null, vx:0, vz:0, ciclo:0,
      pose:null, corpo:null
    };
    return d._b3;
  }

  /* =======================================================
     O CORPO: construção
     Medidas em px de cena, na escala 1: 30 de altura, 13 de ombro.
     Tudo pendurado em `raiz` (no chão, virada pro +z local).
     ======================================================= */
  function construirCorpo(f, pm){
    const g = G();
    const raiz = new THREE.Group();
    const L = f.largo;
    const pele=f.pele, camisa=f.camisa, faixa=f.faixa, calca=f.calca, tenis=f.tenis, cabelo=f.cabelo;

    /* pélvis (a raiz do tronco, a 16,5 do chão) */
    const pelvis = junta(raiz, 0, 16.5, 0);
    new Acumulador().add(g.caixa, calca, 6.4*L, 3.2, 4.2, 0, 0.4, 0).mesh(pelvis);
    /* tronco: barriga e peito numa malha só, com as listras da torcida */
    const tronco = junta(pelvis, 0, 1.6, 0);
    const tr = new Acumulador()
      .add(g.caixa, camisa, 6.2*L, 4.2, 4.0, 0, 2.1, 0)             // barriga
      .add(g.caixa, camisa, 7.2*L, 4.6, 4.4, 0, 6.5, 0);            // peito
    if(!pm && f.listras>0){
      tr.add(g.caixa, faixa, 7.3*L, 1.1, 4.5, 0, 6.5, 0);
      if(f.listras===2) tr.add(g.caixa, faixa, 6.3*L, 1.0, 4.1, 0, 2.1, 0);
      tr.add(g.caixa, faixa, 7.3*L, 0.6, 4.5, 0, 8.6, 0);           // gola
    }
    if(pm){ tr.add(g.caixa, '#1b2a22', 7.4*L, 4.7, 4.6, 0, 6.5, 0).add(g.caixa, '#c9d64a', 7.5*L, 0.7, 4.7, 0, 6.8, 0); }
    tr.add(g.cil, pele, 1.8, 1.4, 1.8, 0, 9.5, 0);                  // pescoço
    tr.mesh(tronco);
    const peito = junta(tronco, 0, 4.2, 0);      // só uma junta de referência (ombros pendem daqui)
    const pescoco = junta(peito, 0, 4.6, 0);

    /* cabeça: crânio, rosto e o que tem por cima, numa malha só */
    const cabeca = junta(pescoco, 0, 1.4, 0);
    const cb = new Acumulador().add(g.esfera, pele, 3.1, 3.4, 3.1, 0, 3.0, 0);
    for(const sx of [-1,1]){
      cb.add(g.esfera, BRANCO, 0.62, 0.5, 0.35, sx*1.1, 3.4, 2.75)
        .add(g.esfera, PRETO, 0.3, 0.3, 0.25, sx*1.1, 3.4, 3.05)
        .add(g.caixa, cabelo, 1.1, 0.25, 0.3, sx*1.1, 4.05, 2.85)
        .add(g.esfera, pele, 0.45, 0.7, 0.4, sx*3.1, 3.1, 0.3);
    }
    cb.add(g.caixa, pele, 0.7, 1.0, 0.8, 0, 2.9, 3.0)               // nariz
      .add(g.caixa, '#5a2a24', 1.3, 0.3, 0.3, 0, 2.0, 2.95);         // boca
    if(f.barba) cb.add(g.caixa, cabelo, 3.0, 1.4, 2.2, 0, 1.6, 1.6);
    if(pm){
      cb.add(g.cil, '#1c2a22', 3.4, 1.5, 3.4, 0, 5.4, 0).add(g.caixa, '#1c2a22', 3.2, 0.3, 2.2, 0, 4.9, 3.1);
    } else if(f.tipoCabeca==='cabelo'){
      cb.add(g.esfera, cabelo, 3.25, 3.0, 3.25, 0, 3.7, -0.3).add(g.caixa, cabelo, 6.2, 1.2, 1.2, 0, 4.6, 0.9);
    } else if(f.tipoCabeca==='bone'){
      cb.add(g.esfera, f.corBone, 3.3, 2.2, 3.3, 0, 4.6, 0).add(g.caixa, f.corBone, 3.4, 0.35, 2.6, 0, 4.9, 3.3)
        .add(g.caixa, cabelo, 6.0, 0.8, 5.6, 0, 3.7, -0.4);
    } else if(f.tipoCabeca==='bandana'){
      cb.add(g.cil, faixa, 6.5, 1.1, 6.5, 0, 4.5, 0).add(g.caixa, faixa, 1.0, 2.2, 0.4, 1.6, 3.6, -3.0)
        .add(g.esfera, cabelo, 3.15, 2.2, 3.15, 0, 4.8, -0.3);
    } else {
      cb.add(g.caixa, cabelo, 5.0, 0.5, 4.0, 0, 3.2, -1.2);
    }
    cb.mesh(cabeca);

    /* braços: ombro no topo do peito; manga + braço numa malha, antebraço, mão */
    const bracos = [], antebracos = [], maos = [];
    for(const sx of [-1,1]){
      const ombro = junta(peito, sx*(3.9*L+0.4), 4.0, 0);
      new Acumulador().capsula(6.0, 1.05, pele, 0, -3.0, 0).capsula(3.4, 1.3, camisa, 0, -1.5, 0).mesh(ombro);
      const cotovelo = junta(ombro, 0, -6.0, 0);
      new Acumulador().capsula(5.6, 0.95, pele, 0, -2.8, 0).mesh(cotovelo);
      const mao = junta(cotovelo, 0, -5.6, 0);
      const punho = new Acumulador().add(g.esfera, pele, 1.25, 1.35, 1.2, 0, -0.9, 0).mesh(mao);
      bracos.push(ombro); antebracos.push(cotovelo); maos.push({j:mao, punho});
    }

    /* pernas: quadril pendurado na pélvis; coxa, canela, pé */
    const coxas = [], joelhos = [], pes = [];
    for(const sx of [-1,1]){
      const quadril = junta(pelvis, sx*2.0*L, -0.6, 0);
      const cx = new Acumulador().capsula(7.6, 1.5, calca, 0, -3.8, 0);
      if(f.bermuda && !pm) cx.capsula(3.2, 1.25, pele, 0, -6.6, 0);
      cx.mesh(quadril);
      const joelho = junta(quadril, 0, -7.6, 0);
      new Acumulador().capsula(7.0, 1.2, (f.bermuda && !pm) ? pele : calca, 0, -3.5, 0).mesh(joelho);
      const pe = junta(joelho, 0, -7.0, 0);
      new Acumulador().add(g.caixa, tenis, 2.6, 1.6, 4.2, 0, -0.6, 0.9).add(g.caixa, '#333', 2.7, 0.5, 4.3, 0, -1.25, 0.9).mesh(pe);
      coxas.push(quadril); joelhos.push(joelho); pes.push(pe);
    }

    /* PM: cassetete na mão direita, escudo na esquerda (só na carga) */
    let cassetete=null, escudo=null;
    if(pm){
      cassetete = new Acumulador().add(g.cil, '#1a1a1a', 0.8, 11, 0.8, 0, -2.0, 4.5, Math.PI/2, 0, 0).mesh(maos[1].j);
      escudo = new Acumulador().add(g.caixa, '#cfd8e0', 9, 14, 0.6, 0, 3, 3.5).mesh(maos[0].j, true);
      escudo.visible = false;
    }

    /* sombra: um disco escuro no chão, mais barato que sombra de luz */
    const sombra = new THREE.Mesh(g.disco, mat(PRETO, {transparent:true, opacity:0.34, depthWrite:false}));
    sombra.rotation.x = -Math.PI/2; sombra.position.y = 0.3; sombra.scale.set(8.5, 6.5, 1);
    raiz.add(sombra);

    return {raiz, pelvis, tronco, peito, pescoco, cabeca, bracos, antebracos, maos, coxas, joelhos, pes,
            sombra, cassetete, escudo};
  }

  /* =======================================================
     A POSE: ângulos por junta
     coxa[k]  : rotação x do quadril (+ perna pra trás)
     joelho[k]: rotação x (+ dobra natural)
     pe[k]    : rotação x do pé
     ombro[k] : rotação x (− braço pra frente), ombroZ (+ abre pro lado)
     cotovelo : rotação x (− dobra natural)
     tronco   : inclina (x), gira (y), tomba (z)
     cabeca   : olhaX (x), olhaY (y)
     y        : altura extra do corpo; rotRaiz (x): deita; rolo (z)
     ======================================================= */
  function poseNeutra(){
    return {coxa:[0,0], joelho:[0,0], pe:[0,0], ombro:[0.06,0.06], ombroZ:[0.10,0.10], cotovelo:[-0.28,-0.28],
            maoZ:[0,0], punho:[0,0], inclina:0, gira:0, tomba:0, olhaX:0, olhaY:0, y:0, rotRaiz:0, rolo:0,
            peito:1, escudo:false};
  }
  function copiar(p){ return JSON.parse(JSON.stringify(p)); }
  function misturarPose(atual, alvo, k){
    for(const c in alvo){
      const v = alvo[c];
      if(Array.isArray(v)){ for(let i=0;i<v.length;i++) atual[c][i] += (v[i]-atual[c][i])*k; }
      else if(typeof v === 'number') atual[c] += (v-atual[c])*k;
      else atual[c] = v;
    }
  }
  function aplicarPose(c, p, escala){
    c.raiz.scale.setScalar(escala);
    c.raiz.rotation.x = p.rotRaiz; c.raiz.rotation.z = p.rolo;
    c.pelvis.position.y = 16.5 + p.y;
    c.tronco.rotation.set(p.inclina, p.gira, p.tomba);
    c.pelvis.position.y = 16.5 + p.y + (p.peito-1)*8;
    c.cabeca.rotation.set(p.olhaX, p.olhaY, 0);
    for(let k=0;k<2;k++){
      c.coxas[k].rotation.x = p.coxa[k];
      c.joelhos[k].rotation.x = p.joelho[k];
      c.pes[k].rotation.x = p.pe[k];
      c.bracos[k].rotation.set(p.ombro[k], 0, (k===0?1:-1)*p.ombroZ[k]);
      c.antebracos[k].rotation.x = p.cotovelo[k];
      c.antebracos[k].rotation.z = (k===0?1:-1)*p.maoZ[k];
      const s = 1 + p.punho[k]*0.25;
      c.maos[k].punho.scale.setScalar(s);
    }
    if(c.escudo) c.escudo.visible = !!p.escudo;
  }

  const suave = k => k<=0 ? 0 : k>=1 ? 1 : k*k*(3-2*k);
  const mistura = (a,b,k) => a + (b-a)*k;
  function girar(atual, alvo, k){
    let d = alvo - atual;
    while(d > Math.PI) d -= Math.PI*2;
    while(d < -Math.PI) d += Math.PI*2;
    return atual + d*k;
  }

  /* =======================================================
     OS MOVIMENTOS: cada um escreve na pose-alvo `p`
     ======================================================= */
  /* parado: respira, pesa numa perna, olha em volta de vez em quando */
  function parado(p, f, t){
    const r = Math.sin(t*1.7 + f.fase);
    p.peito = 1 + 0.02*r;
    p.inclina = 0.02 + 0.012*r;
    p.tomba = 0.03*Math.sin(t*0.6 + f.fase);
    p.coxa = [0.06, -0.04]; p.joelho = [0.10, 0.06];
    p.olhaY = 0.35*Math.sin(t*0.45 + f.fase*2) * (Math.sin(t*0.13+f.fase) > 0.3 ? 1 : 0.2);
    p.olhaX = 0.05*Math.sin(t*0.8+f.fase);
    p.ombro = [0.08, 0.08]; p.cotovelo = [-0.3, -0.35];
  }
  /* andar e correr: ciclo pela velocidade medida */
  function passo(p, f, vel, dt, corre){
    if(vel < 3){ f.ciclo += dt*0.6; return false; }
    const freq = corre ? 0.085 : 0.075;
    f.ciclo += vel*freq*dt*6.28*0.36;
    const c = f.ciclo, s = Math.sin(c), s2 = Math.sin(c+Math.PI);
    const amp = corre ? 0.95 : 0.55;
    const lev = corre ? 1.1 : 0.7;
    p.coxa = [s*amp, s2*amp];
    /* o joelho dobra na perna que vai pra frente (coxa negativa) */
    p.joelho = [Math.max(0, -s)*lev + 0.08, Math.max(0, -s2)*lev + 0.08];
    p.pe = [Math.max(0, s)*0.35, Math.max(0, s2)*0.35];
    const bs = corre ? 0.9 : 0.42;
    p.ombro = [s2*bs - (corre?0.4:0.05), s*bs - (corre?0.4:0.05)];
    p.cotovelo = corre ? [-1.5, -1.5] : [-0.45 - Math.max(0,s2)*0.3, -0.45 - Math.max(0,s)*0.3];
    p.ombroZ = [0.12, 0.12];
    p.gira = -s*(corre?0.22:0.10);          // ombros contra o quadril
    p.tomba = Math.sin(c)*(corre?0.05:0.035);
    p.inclina = corre ? 0.30 : 0.07;
    p.y = Math.abs(Math.sin(c))*(corre?1.4:0.6) - (corre?0.6:0);
    p.olhaX = corre ? -0.1 : 0.02;
    return true;
  }
  /* socar: jab e direto alternados, gancho de vez em quando; o corpo vai junto */
  function socar(p, f, dt, t){
    f.tSoco -= dt;
    if(f.tSoco <= 0){
      f.ladoSoco = 1 - f.ladoSoco; f.soco = 0;
      f.gancho = Math.random() < 0.28;
      f.tSoco = f.gancho ? 0.46 : 0.34;
    }
    f.soco += dt;
    const k = f.soco/(f.gancho?0.46:0.34);
    const ida = suave(k/0.38), volta = suave((k-0.55)/0.45);
    const ext = ida*(1-volta);              // 0→1→0
    const b = f.ladoSoco, o = 1-b;
    if(f.gancho){
      p.ombro[b] = mistura(-0.6, -1.5, ext); p.ombroZ[b] = mistura(1.2, 0.5, ext);
      p.cotovelo[b] = mistura(-1.9, -1.4, ext); p.maoZ[b] = mistura(0, 0.6, ext);
      p.gira = (b===1?1:-1)*mistura(0.35, -0.55, ext);
    } else {
      p.ombro[b] = mistura(-0.7, -1.62, ext); p.ombroZ[b] = mistura(0.3, 0.05, ext);
      p.cotovelo[b] = mistura(-2.0, -0.12, ext);
      p.gira = (b===1?1:-1)*mistura(0.25, -0.35, ext);
    }
    p.punho[b] = 1; p.punho[o] = 1;
    /* a outra mão fica em guarda, o corpo entra no golpe */
    p.ombro[o] = -1.35; p.cotovelo[o] = -2.25; p.ombroZ[o] = 0.25;
    p.inclina = 0.22 + ext*0.18;
    p.coxa = [b===0?-0.35:0.25, b===1?-0.35:0.25];
    p.joelho = [0.35, 0.35]; p.pe = [0, 0];
    p.y = -1.2 - ext*0.6;
    p.olhaX = 0.18; p.olhaY = (b===1?1:-1)*ext*0.15;
  }
  /* guarda: punhos em frente ao queixo, quicando */
  function guarda(p, f, t){
    const q = Math.abs(Math.sin(t*5.5 + f.fase));
    p.ombro = [-1.25, -1.25]; p.cotovelo = [-2.3, -2.3]; p.ombroZ = [0.25, 0.25];
    p.punho = [1, 1];
    p.inclina = 0.2; p.olhaX = 0.2;
    p.coxa = [-0.25, 0.25]; p.joelho = [0.4, 0.4];
    p.y = -1.5 + q*0.8;
    p.gira = 0.15*Math.sin(t*2.2+f.fase);
  }
  /* a retaguarda: grita, aponta, levanta o braço, pula — em turnos */
  function torcer(p, f, t, dt){
    f.tGesto -= dt;
    if(f.tGesto <= 0){ f.gesto = dado(f.sem+'|g'+Math.floor(t/2.3), 4); f.tGesto = 1.6 + Math.random()*1.8; }
    parado(p, f, t);
    const w = t*7 + f.fase;
    if(f.gesto===0){           // braço no alto, bombando
      p.ombro[1] = -2.9 + 0.25*Math.sin(w); p.cotovelo[1] = -0.5; p.ombroZ[1] = 0.3; p.punho[1]=1;
      p.olhaX = -0.25;
    } else if(f.gesto===1){    // os dois braços abertos, "vem"
      p.ombro = [-1.0, -1.0]; p.ombroZ = [1.1, 1.1]; p.cotovelo = [-0.6, -0.6];
      p.inclina = 0.15; p.olhaX = 0.1;
    } else if(f.gesto===2){    // pulando
      const s = Math.max(0, Math.sin(w*0.8));
      p.y = s*3.5; p.joelho = [0.5 - s*0.4, 0.5 - s*0.4]; p.coxa = [-0.2, -0.2];
      p.ombro = [-2.6, -2.6]; p.cotovelo = [-0.3, -0.3]; p.ombroZ = [0.5, 0.5];
    } else {                   // apontando pra frente e gritando
      p.ombro[0] = -1.5; p.cotovelo[0] = -0.1; p.ombroZ[0] = 0.15;
      p.inclina = 0.2; p.olhaX = 0.05; p.gira = -0.2;
    }
  }
  /* levar pancada: cabeça vai, tronco vai atrás, um passo pra trás */
  function apanhar(p, f, k, t){
    const r = suave(k);
    const lado = Math.sin(f.fase*3) > 0 ? 1 : -1;
    p.olhaX = -0.6*r; p.olhaY = lado*0.5*r;
    p.inclina = -0.35*r; p.tomba = lado*0.18*r; p.gira = lado*0.2*r;
    p.coxa = [0.35*r, -0.15*r]; p.joelho = [0.3*r, 0.35*r];
    p.ombro = [-0.9*r, -0.6*r]; p.ombroZ = [0.7*r, 0.5*r]; p.cotovelo = [-1.4*r, -1.1*r];
    p.y = -0.8*r;
  }
  /* atordoado: balança, joelho mole, braço solto, cabeça rodando */
  function cambalear(p, f, t){
    const w = t*3.2 + f.fase;
    p.tomba = 0.25*Math.sin(w); p.inclina = 0.12 + 0.12*Math.sin(w*0.7);
    p.gira = 0.2*Math.sin(w*0.5);
    p.olhaX = -0.15 + 0.2*Math.sin(w*1.3); p.olhaY = 0.45*Math.sin(w*0.9);
    p.coxa = [0.15*Math.sin(w), -0.15*Math.sin(w)]; p.joelho = [0.5, 0.45];
    p.ombro = [0.3, 0.2]; p.ombroZ = [0.55, 0.5]; p.cotovelo = [-0.6, -0.5];
    p.y = -2.2;
  }
  /* arremesso: arma atrás, peso na perna de trás; solta com o corpo todo */
  function arremessar(p, f, arr){
    const k = 1 - arr.t/0.55;                 // 0 no início, 1 no fim
    const arma = suave(k/0.45), solta = suave((k-0.45)/0.4);
    const b = 1;
    p.ombro[b] = mistura(mistura(-0.2, 2.6, arma), -1.7, solta);
    p.cotovelo[b] = mistura(mistura(-0.3, -1.8, arma), -0.15, solta);
    p.ombroZ[b] = mistura(mistura(0.1, 0.9, arma), 0.2, solta);
    p.ombro[0] = mistura(-0.9, -0.2, solta); p.ombroZ[0] = 0.5; p.cotovelo[0] = -0.5;
    p.gira = mistura(mistura(0, 0.75, arma), -0.55, solta);
    p.inclina = mistura(mistura(0.05, -0.2, arma), 0.42, solta);
    p.coxa = [mistura(0.15, -0.5, solta), mistura(-0.3, 0.35, solta)];
    p.joelho = [0.45, 0.3]; p.pe = [0, mistura(0, 0.5, solta)];
    p.y = -1 - solta*0.8;
    p.olhaX = mistura(-0.2, 0.15, solta);
    p.punho[b] = 1;
  }
  /* fugir: corre e olha pra trás de vez em quando */
  function fugir(p, f, t, dt){
    f.olhaTras -= dt;
    if(f.olhaTras <= -1.5) f.olhaTras = 0.7 + Math.random()*1.2;
    if(f.olhaTras > 0){ p.olhaY = 1.3*(Math.sin(f.fase)>0?1:-1); p.gira += 0.3*(Math.sin(f.fase)>0?1:-1); }
    p.inclina += 0.12;
  }
  /* correr da bomba: corre com o braço cobrindo a cabeça */
  function cobrir(p){
    p.ombro[1] = -2.7; p.cotovelo[1] = -2.4; p.ombroZ[1] = 0.6;
    p.olhaX = 0.35; p.inclina += 0.15;
  }
  /* cair: gira até o chão, quica, fica */
  function cair(p, f, dt){
    if(!f.queda) f.queda = {t:0};
    f.queda.t += dt;
    const k = Math.min(1, f.queda.t/0.55);
    const q = suave(k);
    const frente = f.caiDeFrente;
    const quique = k<1 ? 0 : Math.abs(Math.sin(Math.min(1,(f.queda.t-0.55)/0.35)*Math.PI))*0.8;
    p.rotRaiz = (frente ? 1 : -1) * (Math.PI/2) * q;
    p.y = -16.5*q + 3.2 + quique;
    p.coxa = [0.35*q + (frente?0:0.2), -0.25*q]; p.joelho = [0.6*q, 0.35*q];
    p.ombro = frente ? [-2.2*q, -1.6*q] : [1.1*q, 0.7*q];
    p.ombroZ = [0.9*q, 0.6*q]; p.cotovelo = frente ? [-1.4*q, -0.6*q] : [-0.5*q, -0.9*q];
    p.olhaX = frente ? -0.6*q : 0.4*q; p.olhaY = 0.7*q;
    p.tomba = 0.15*q; p.gira = 0.2*q;
    /* um tremor de vez em quando, deitado */
    if(k>=1 && Math.sin(f.queda.t*2.1+f.fase) > 0.93){ p.joelho[0] += 0.2; p.ombro[0] += 0.1; }
  }
  /* preso: sentado, mãos atrás das costas, cabeça baixa */
  function sentar(p, f, t){
    p.y = -8.5; p.coxa = [-1.35, -1.25]; p.joelho = [1.35, 1.45]; p.pe = [-0.4, -0.4];
    p.ombro = [0.75, 0.75]; p.ombroZ = [0.35, 0.35]; p.cotovelo = [-1.6, -1.6]; p.maoZ = [0.6, 0.6];
    p.inclina = 0.28; p.olhaX = 0.45 + 0.05*Math.sin(t*1.5+f.fase);
  }

  /* =======================================================
     A VELOCIDADE MEDIDA (o líder anda sem escrever vx)
     ======================================================= */
  function medirVelocidade(f, x, z, dt){
    if(f.px!==null && dt>0){
      const vx=(x-f.px)/dt, vz=(z-f.pz)/dt;
      const k=Math.min(1, dt*14);
      f.vx += (vx-f.vx)*k; f.vz += (vz-f.vz)*k;
      if(Math.hypot(vx,vz) > 400){ f.vx=0; f.vz=0; }
    }
    f.px=x; f.pz=z;
    return Math.hypot(f.vx, f.vz);
  }

  /* =======================================================
     UMA FIGURA POR QUADRO: do sinal do combate à pose
     ======================================================= */
  const figuras = new Map();     // disco/PM → {corpo, f}
  function figuraDe(d, i, pm){
    let fg = figuras.get(d);
    if(fg) return fg;
    const f = pm ? fichaPM(d, i) : fichaDe(d, i);
    const corpo = construirCorpo(f, pm);
    f.pose = poseNeutra();
    scene.add(corpo.raiz);
    fg = {corpo, f, pm};
    figuras.set(d, fg);
    return fg;
  }
  function fichaPM(pm, i){
    if(pm._b3) return pm._b3;
    const s = 'pm|'+i;
    pm._b3 = {sem:s, fase:frac(s+'f')*6.28, yaw:frac(s+'y')*6.28,
      pele:PELE[dado(s+'p',PELE.length)], calca:'#1b2620', cabelo:'#111', tenis:'#111',
      bermuda:false, listras:0, tipoCabeca:'bone', corBone:'#1c2a22', barba:frac(s+'bb')<0.3,
      camisa:'#233a2c', faixa:'#2d4a38', escala:1.06, largo:1.08,
      soco:0, ladoSoco:1, tSoco:0, gancho:false, grito:0, olhaTras:0, tGesto:0, gesto:0,
      queda:null, caiDeFrente:frac(s+'q')<0.5, cobre:true, px:null, pz:null, vx:0, vz:0, ciclo:0, pose:null};
    return pm._b3;
  }

  function animarDisco(d, i, J, dt){
    const fg = figuraDe(d, i, false), f = fg.f, c = fg.corpo;
    const t = J.t;
    const p = poseNeutra();
    let rapidez = 10;                     // quão rápido a pose atual persegue a alvo

    if(!d.vivo){
      if(d.preso){ sentar(p, f, t); f.queda = null; rapidez = 6; }
      else { cair(p, f, dt); rapidez = 14; }
    } else {
      f.queda = null;
      const vel = medirVelocidade(f, d.x, d.y, dt);
      const corre = !!(d.fugindo || d._cacando || d.fugaBomba);
      if(typeof d.rumo === 'number') f.yaw = girar(f.yaw, d.rumo, Math.min(1, dt*14));
      else if(vel > 4) f.yaw = girar(f.yaw, Math.atan2(f.vx, f.vz), Math.min(1, dt*10));
      if(d.arremesso && d.arremesso.t > 0.4){
        const pr = J.projeteis.find(q=>!q.morto && q.t < 0.2 && Math.hypot(q.x-d.x, q.y-d.y) < 60);
        if(pr) f.yaw = girar(f.yaw, Math.atan2(pr.vx, pr.vy), Math.min(1, dt*18));
      }

      const andando = passo(p, f, vel, dt, corre);
      if(!andando) parado(p, f, t);
      if(corre && d.fugindo) fugir(p, f, t, dt);
      if(d.fugaBomba) cobrir(p);

      if(d.atordoado > 0){ cambalear(p, f, t); rapidez = 7; }
      else if(d.apanhou > 0){ apanhar(p, f, d.apanhou/0.5, t); rapidez = 22; }
      else if(d.arremesso){ arremessar(p, f, d.arremesso); rapidez = 26; }
      else if(d.golpe > 0){ socar(p, f, dt, t); rapidez = 30; }
      else if(d.hostil > 0 && vel < 6 && !corre){ guarda(p, f, t); rapidez = 12; f.soco = 0; f.tSoco = 0; }
      else if(!andando && d.linha==='retaguarda' && !J.paz){ torcer(p, f, t, dt); rapidez = 9; }
      else { f.soco = 0; f.tSoco = 0; rapidez = andando ? 14 : 5; }
    }

    misturarPose(f.pose, p, Math.min(1, dt*rapidez));
    const tx = d.tremor ? (Math.random()-0.5)*d.tremor*0.6 : 0;
    const tz = d.tremor ? (Math.random()-0.5)*d.tremor*0.6 : 0;
    c.raiz.position.set(d.x+tx, 0, d.y+tz);
    c.raiz.rotation.y = f.yaw;
    aplicarPose(c, f.pose, f.escala*escalaDeCima*0.86);
    c.sombra.scale.set(8.5*(d.vivo?1:1.6), 6.5*(d.vivo?1:1.3), 1);
    c.raiz.visible = true;
  }

  function animarPM(pm, i, J, dt){
    const fg = figuraDe(pm, i, true), f = fg.f, c = fg.corpo;
    const p = poseNeutra();
    let rapidez = 10;
    if(!pm.vivo){ cair(p, f, dt); rapidez = 14; }
    else {
      f.queda = null;
      const vel = medirVelocidade(f, pm.x, pm.y, dt);
      if(vel > 4) f.yaw = girar(f.yaw, Math.atan2(f.vx, f.vz), Math.min(1, dt*8));
      const andando = passo(p, f, vel, dt, false);
      if(!andando) parado(p, f, J.t);
      /* cassetete na mão: braço direito meio dobrado */
      p.ombro[1] = Math.min(p.ombro[1], -0.5); p.cotovelo[1] = -1.6;
      if(pm.carga){ p.escudo = true; p.ombro[0] = -1.2; p.cotovelo[0] = -1.4; p.ombroZ[0] = 0.1; p.inclina += 0.14; }
      if(pm.golpe > 0){
        const k = 1 - pm.golpe/0.3, desce = suave(k/0.6);
        p.ombro[1] = mistura(-2.8, -0.9, desce); p.cotovelo[1] = mistura(-0.9, -0.3, desce); p.ombroZ[1] = 0.25;
        p.inclina = mistura(-0.1, 0.32, desce); p.gira = mistura(0.35, -0.2, desce);
        p.coxa = [0.3, -0.3]; p.joelho = [0.3, 0.35]; p.y = -1; rapidez = 28;
      } else if(pm.cooldown > 1.2 && !pm.carga){ p.ombro[1] = -0.7; p.cotovelo[1] = -1.9; }
    }
    misturarPose(f.pose, p, Math.min(1, dt*rapidez));
    c.raiz.position.set(pm.x, 0, pm.y); c.raiz.rotation.y = f.yaw;
    aplicarPose(c, f.pose, f.escala*escalaDeCima*0.86);
    c.raiz.visible = true;
  }

  /* =======================================================
     PEDRA, BOMBA, EXPLOSÃO, FUMAÇA
     ======================================================= */
  const projMeshes = new Map();   // projétil → {grupo, ...}
  const particulas = [];
  function soltar(x, y, z, o){
    const g = G();
    const m = new THREE.Mesh(o.plano ? g.disco : g.esfera,
      new THREE.MeshBasicMaterial({color:new THREE.Color(o.cor||'#888'), transparent:true, opacity:o.alfa||0.8, depthWrite:false}));
    if(o.plano){ m.rotation.x = -Math.PI/2; }
    m.position.set(x, y, z); scene.add(m);
    particulas.push({m, vx:o.vx||0, vy:o.vy||0, vz:o.vz||0, vida:o.dur, dur:o.dur, tam:o.tam||2, cresce:o.cresce||0, grav:o.grav||0, alfa:o.alfa||0.8});
  }
  function fumo(x, y, z, forte){
    soltar(x, y, z, {vy:9+Math.random()*6, vx:(Math.random()-0.5)*8, vz:(Math.random()-0.5)*8, dur:0.5+Math.random()*0.4*(forte?2:1),
      tam:forte?4:2.2, cresce:forte?14:8, cor:forte?'#6a6a6a':'#8a8a8a', alfa:0.55});
  }
  function explodir(x, z){
    /* clarão, anel no chão, estilhaços e fumaça */
    soltar(x, 6, z, {dur:0.22, tam:14, cresce:70, cor:'#ffd35a', alfa:0.9});
    soltar(x, 4, z, {dur:0.35, tam:8, cresce:40, cor:'#ff7a2a', alfa:0.7});
    for(let i=0;i<14;i++){
      const a = Math.random()*6.28, v = 60+Math.random()*120;
      soltar(x, 5, z, {vx:Math.cos(a)*v, vz:Math.sin(a)*v, vy:40+Math.random()*80, grav:220, dur:0.5+Math.random()*0.4, tam:1.2, cor:'#3a2a1a', alfa:0.9});
    }
    for(let i=0;i<10;i++) fumo(x+(Math.random()-0.5)*20, 6, z+(Math.random()-0.5)*20, true);
  }
  function poeira(x, z){
    for(let i=0;i<5;i++) soltar(x+(Math.random()-0.5)*8, 1.5, z+(Math.random()-0.5)*8, {vy:6, dur:0.4, tam:1.8, cresce:6, cor:'#b9a98c', alfa:0.6});
  }
  function atualizarParticulas(dt){
    for(let i=particulas.length-1;i>=0;i--){
      const q = particulas[i];
      q.vida -= dt;
      if(q.vida <= 0){ scene.remove(q.m); q.m.material.dispose(); particulas.splice(i,1); continue; }
      q.vy -= q.grav*dt;
      q.m.position.x += q.vx*dt; q.m.position.y += q.vy*dt; q.m.position.z += q.vz*dt;
      if(q.m.position.y < 0.5 && q.grav){ q.m.position.y = 0.5; q.vy = -q.vy*0.3; q.vx *= 0.6; q.vz *= 0.6; }
      const k = q.vida/q.dur;
      const tam = q.tam + q.cresce*(1-k);
      q.m.scale.setScalar(tam);
      q.m.material.opacity = q.alfa*k;
    }
  }
  function projeteis(J){
    const g = G();
    const agora = new Set();
    const raioBomba = (TO.diaJogo.combate && TO.diaJogo.combate.RAIO_BOMBA) || 92;
    for(const p of J.projeteis){
      agora.add(p);
      let v = projMeshes.get(p);
      if(!v){
        const grupo = new THREE.Group();
        let corpo;
        if(p.tipo==='pedra'){ corpo = new THREE.Mesh(g.pedra, mat('#8d8880')); corpo.scale.setScalar(3.4); }
        else {
          corpo = new THREE.Mesh(g.esfera, mat('#3a2a26')); corpo.scale.setScalar(4.6);
          const pavio = new THREE.Mesh(g.cil, mat('#d8c8a0')); pavio.scale.set(0.6, 3.5, 0.6); pavio.position.set(1.5, 5.2, 0); pavio.rotation.z = -0.5; grupo.add(pavio);
          const faisca = new THREE.Mesh(g.esfera, new THREE.MeshBasicMaterial({color:'#ffd35a'})); faisca.scale.setScalar(1.4); faisca.position.set(2.4, 6.6, 0); grupo.add(faisca);
          const rotulo = new THREE.Mesh(g.caixa, mat('#c8562f')); rotulo.scale.set(9.4, 2.2, 1.2); rotulo.position.set(0, 0, 4.2); grupo.add(rotulo);
          v = {faisca};
          const zona = new THREE.Mesh(g.anel, new THREE.MeshBasicMaterial({color:'#e25028', transparent:true, opacity:0.4, depthWrite:false, side:THREE.DoubleSide}));
          zona.rotation.x = -Math.PI/2; zona.scale.setScalar(raioBomba); zona.visible = false; scene.add(zona);
          v.zona = zona;
        }
        grupo.add(corpo);
        const sombra = new THREE.Mesh(g.disco, mat(PRETO, {transparent:true, opacity:0.28, depthWrite:false}));
        sombra.rotation.x = -Math.PI/2; sombra.position.y = 0.4; sombra.scale.set(5, 3.6, 1); scene.add(sombra);
        scene.add(grupo);
        v = Object.assign(v||{}, {grupo, corpo, sombra, tipo:p.tipo, ultimoFumo:0, explodiu:false, x:p.x, y:p.y, t:0});
        projMeshes.set(p, v);
      }
      v.x = p.x; v.y = p.y; v.t = p.t;
      v.sombra.position.set(p.x, 0.4, p.y);
      if(p.noChao){
        const k = 1 - (p.explodeEm - p.t)/(p.pavio||1);
        v.grupo.position.set(p.x, 4.6, p.y); v.grupo.rotation.set(0, 0, 0);
        v.faisca.visible = Math.sin(p.t*(30+k*70)) > 0;
        v.zona.visible = true; v.zona.position.set(p.x, 0.6, p.y);
        v.zona.material.opacity = 0.25 + 0.45*k;
        if(p.t - v.ultimoFumo > 0.07){ v.ultimoFumo = p.t; fumo(p.x+2.4, 8, p.y, false); }
        continue;
      }
      if(!p.morto){
        const alt = Math.sin((p.t/p.dur)*Math.PI)*36 + 8;
        v.grupo.position.set(p.x, alt, p.y);
        v.grupo.rotation.set(p.t*7, p.t*9, 0);
        if(p.tipo==='bomba' && p.t - v.ultimoFumo > 0.05){ v.ultimoFumo = p.t; fumo(p.x, alt, p.y, false); }
        continue;
      }
      /* morto: explodiu (bomba) — a cena some com ele quando `explosao` passa */
      v.grupo.visible = false; v.sombra.visible = false;
      if(v.zona) v.zona.visible = false;
      if(p.explosao!==undefined && !v.explodiu){ v.explodiu = true; explodir(p.x, p.y); }
    }
    for(const [p,v] of projMeshes) if(!agora.has(p)){
      projMeshes.delete(p);
      scene.remove(v.grupo); scene.remove(v.sombra); if(v.zona) scene.remove(v.zona);
      if(v.tipo==='pedra' && v.t > 0.07) poeira(v.x, v.y);
    }
  }

  /* =======================================================
     AS GRADES DE FERRO
     ======================================================= */
  const gradeMeshes = new Map();
  function gradesDeFerro(mods){
    const g = G();
    const agora = new Set();
    for(const m of mods || []){
      agora.add(m);
      let v = gradeMeshes.get(m);
      if(!v){
        const mesh = new THREE.Mesh(g.caixa, mat('#e8b53c'));
        scene.add(mesh); v = {mesh, hp:null}; gradeMeshes.set(m, v);
      }
      const ang = Math.atan2(m.ux, m.uy);
      const mesh = v.mesh;
      mesh.rotation.y = ang;
      if(m.tipo==='fila'){ mesh.scale.set(m.esp*2, 30, m.meia*2); mesh.position.set(m.x, 15, m.y); mesh.material = mat('#9aa0a6'); continue; }
      if(m.hp<=0){ mesh.scale.set(m.esp*2+6, 3, m.meia*2); mesh.position.set(m.x, 1.5, m.y); mesh.material = mat('#6a5a30'); continue; }
      const p = m.hp/m.hpMax;
      mesh.material = mat(p>0.6 ? '#e8b53c' : p>0.3 ? '#c08a2a' : '#8a5f22');
      mesh.scale.set(m.esp*2, 30, m.meia*2); mesh.position.set(m.x, 15, m.y);
    }
    for(const [m,v] of gradeMeshes) if(!agora.has(m)){ gradeMeshes.delete(m); scene.remove(v.mesh); }
  }

  /* =======================================================
     A CÂMERA DE CIMA, casada com o 2D
     ======================================================= */
  function ajustarCamera(e, cw, ch){
    const x0 = -e.ox/e.s, x1 = (cw-e.ox)/e.s;
    const z0 = -e.oy/e.s, z1 = (ch-e.oy)/e.s;
    cam.left = x0; cam.right = x1; cam.top = -z0; cam.bottom = -z1;
    cam.near = 1; cam.far = ALTURA_CAM*2;
    cam.updateProjectionMatrix();
    /* cisalhamento: a altura (z local da câmera + ALTURA) sobe a tela */
    const el = cam.projectionMatrix.elements;   // por coluna: índice = coluna*4 + linha
    const a = 2/(cam.top-cam.bottom);
    el[9]  = a*CISALHA;              // linha 1 (y de tela), coluna 2 (z local = altura − ALTURA)
    el[13] += a*CISALHA*ALTURA_CAM;  // compensa a câmera estar a ALTURA do chão
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  }

  function ajustarTamanho(){
    const dpr = Math.min(1.5, window.devicePixelRatio||1);
    const w = Math.max(320, Math.round((cv.clientWidth||cv.width)*dpr));
    const h = Math.max(200, Math.round((cv.clientHeight||cv.height)*dpr));
    if(cv.width!==w || cv.height!==h){ renderer.setSize(w, h, false); }
  }

  function montar(canvas){
    if(typeof THREE === 'undefined') return false;
    if(renderer && cv === canvas) return true;
    cv = canvas;
    try{
      renderer = new THREE.WebGLRenderer({canvas:cv, antialias:true, alpha:true, premultipliedAlpha:true});
    }catch(err){ console.error('bonecos3: '+err.message); renderer=null; return false; }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(1);
    scene = new THREE.Scene();
    cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, ALTURA_CAM*2);
    cam.position.set(0, ALTURA_CAM, 0);
    cam.up.set(0, 0, -1);
    cam.lookAt(0, 0, 0);
    scene.add(cam);
    /* luz: céu por cima, sol de noroeste, um pouco de contraluz */
    scene.add(new THREE.HemisphereLight(0xfff4e0, 0x6a5a48, 0.85));
    const sol = new THREE.DirectionalLight(0xffffff, 0.75); sol.position.set(-0.5, 1, -0.6); scene.add(sol);
    const contra = new THREE.DirectionalLight(0xa0c0ff, 0.25); contra.position.set(0.6, 0.5, 0.8); scene.add(contra);
    figuras.clear(); projMeshes.clear(); gradeMeshes.clear();
    ativo = true;
    return true;
  }

  function atualizarCena(J, dt){
    for(const fg of figuras.values()) fg.corpo.raiz.visible = false;
    J.discos.forEach((d,i)=>{ if(!(d.entrou||d.sumiu)) animarDisco(d, i, J, dt); });
    (J.policiais||[]).forEach((p,i)=>animarPM(p, i, J, dt));
    /* figuras que saíram da cena: some da lista, não só da tela */
    for(const [d,fg] of figuras) if(!fg.corpo.raiz.visible){ scene.remove(fg.corpo.raiz); figuras.delete(d); }
    projeteis(J);
    atualizarParticulas(dt);
    gradesDeFerro(J.grades);
  }

  function desenharDeCima(J, opc){
    if(!renderer || !J) return;
    ajustarTamanho();
    const dt = Math.min(0.05, opc.dt || 0.016);
    ajustarCamera(opc.escala, opc.cw, opc.ch);
    atualizarCena(J, dt);
    renderer.render(scene, cam);
  }

  /* A VITRINE (bonecos.html): a mesma cena vista por uma câmera em
     perspectiva que gira em volta, com um chão, pra olhar o boneco de
     perto em cada estado da animação. */
  let camV=null, chaoV=null;
  function desenharVitrine(J, opc){
    if(!renderer || !J) return;
    ajustarTamanho();
    const dt = Math.min(0.05, opc.dt || 0.016);
    if(!camV){
      camV = new THREE.PerspectiveCamera(32, 1, 1, 4000);
      const g = G();
      chaoV = new THREE.Mesh(g.disco, mat('#4a4a46'));
      chaoV.rotation.x = -Math.PI/2; chaoV.scale.setScalar(900); chaoV.position.y = -0.2;
      scene.add(chaoV);
      const grade = new THREE.GridHelper(1800, 60, 0x6a6a64, 0x5a5a56); grade.position.y = 0.1; scene.add(grade);
      scene.background = new THREE.Color('#1c1c1a');
    }
    camV.aspect = cv.width/cv.height; camV.updateProjectionMatrix();
    const a = opc.angulo||0, dist = opc.dist||150, alvo = opc.alvo||{x:0,z:0};
    camV.position.set(alvo.x+Math.sin(a)*dist, opc.altura||55, alvo.z+Math.cos(a)*dist);
    camV.lookAt(alvo.x, opc.mira!==undefined?opc.mira:15, alvo.z);
    atualizarCena(J, dt);
    renderer.render(scene, camV);
  }

  function limparDeCima(){
    if(!renderer) return;
    renderer.clear();
  }

  return {montar, desenharDeCima, desenharVitrine, limparDeCima,
          get escalaDeCima(){ return escalaDeCima; }, set escalaDeCima(v){ escalaDeCima=v; },
          get ativo(){ return ativo; },
          get _dbg(){ return {scene, cam, camV, renderer, figuras}; }};
})();
