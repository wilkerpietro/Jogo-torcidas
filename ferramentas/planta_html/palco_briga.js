/* =========================================================
   O PALCO DA BRIGA NA CIDADE (o jogo 3D, 28/09/2026)

   O dono: "crie uma rua de casas de veraneio em pontas do mapa pra
   criar a cena de ataque à festa na casa com piscina".

   A briga é a MESMA do jogo de feed — o combate, a ponte, o HUD, os
   comandos —, e quem desenha é o cenário: o tabuleiro do combate (1536
   × 1024, em px) é um retângulo do mundo, em cima do lugar da cena (a
   casa da festa na rua de veraneio), e cada disco vira o boneco da
   cidade no ponto do mundo dele. O tabuleiro pode estar girado (a rua
   de veraneio corre de norte a sul numa praça, de leste a oeste em
   outra): `noMundo(x, y)` leva o ponto do tabuleiro pro mundo, `u` e
   `v` são os eixos x e y do tabuleiro no mundo.

   O contrato é o do renderizador da ponte (js/diajogo/tres.js): montar,
   desenhar, vetorDoTeclado, trocarCamera, MODOS, limparDeCima. O palco
   do cenário (`C.vida.palco`) dá os discos, o lugar e o rumo de cada
   um, e a câmera (`seguir`: ela vai atrás do líder, e o WASD é dele).
   O que o 2D da cena desenhava e o boneco não desenha fica aqui: a
   faixa estendida no muro (e enrolada no ombro de quem pegou) e o
   círculo do objetivo no chão.
   ========================================================= */
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

/* as duas câmeras (C troca): perto do líder e a casa inteira do alto (m e rad) */
const VISTAS = { perto: { dist: 21, el: 1.1 }, alto: { dist: 44, el: 1.3 } };

/* `o`: { C (o cenário), M (unidades por metro), cena (a do combate),
   noMundo(x, y) → [x, z], u, v (os eixos do tabuleiro no mundo), chao(x,
   y) → m (o piso ali), predio: {x, z} (o prédio que perde o telhado),
   peca (o grupo do palco à parte, que entra na cena e sai no fim), livre
   (a câmera sai da área da praça), aoDesmontar() } */
export function palcoDeBriga(o) {
  const { C, M } = o;
  let montado = false, THREE = null, grupo = null, modo = 'perto', seguindo = false;
  const PE = {}, PC = {};
  const J = () => (window.TO && TO.diaJogo && TO.diaJogo.J) || null;
  const ladoDoJogador = () => {
    const Cb = TO.diaJogo && TO.diaJogo.combate, j = J();
    return j && Cb && Cb.ladoDoJogador ? Cb.ladoDoJogador(j) : 'mandante';
  };
  /* quem a câmera segue: o líder de pé; sem ele, quem sobrou do nosso lado */
  function lider() {
    const j = J();
    if (!j) return null;
    const l = ladoDoJogador(), de = d => d.lado === l && d.vivo && !d.sumiu && !d.entrou;
    return j.discos.find(d => d.lider && de(d)) || j.discos.find(de) || null;
  }
  /* o tabuleiro no mundo */
  const pos = (x, y, d, P) => { const [wx, wz] = o.noMundo(x, y); P.x = wx; P.z = wz; P.y = o.chao(x, y) * M; return P; };
  const rumoDe = (vx, vy) => Math.atan2(vx * o.u[0] + vy * o.v[0], vx * o.u[1] + vy * o.v[1]);
  const rumo = d => typeof d.rumo === 'number' ? rumoDe(Math.sin(d.rumo), Math.cos(d.rumo)) : undefined;
  /* A CÂMERA: o alvo vai atrás do líder (macio); a distância e a
     inclinação são da vista, e a roda e o arrasto do cenário continuam
     valendo (girar em volta dele, chegar mais perto) */
  function seguir(dt, orb) {
    const l = lider();
    if (!l) return;
    const [wx, wz] = o.noMundo(l.x, l.y);
    const k = seguindo ? 1 - Math.exp(-dt * 5) : 1;
    orb.alvo.x += (wx - orb.alvo.x) * k; orb.alvo.z += (wz - orb.alvo.z) * k;
    seguindo = true;
  }
  function vista(nome, voar) {
    modo = nome;
    const v = VISTAS[nome], orb = C.orb;
    /* na montagem a briga ainda não nasceu (a ponte monta o palco e só
       depois a noite): a câmera voa pro lugar de onde o nosso bonde sai */
    const l = voar ? null : lider(), sp = (o.cena.spawns || []).find(s => s.jogador) || (o.cena.spawns || [])[0];
    const [x, z] = l ? o.noMundo(l.x, l.y) : sp ? o.noMundo(sp.x, sp.y) : [orb.alvo.x, orb.alvo.z];
    /* longe (o palco à parte, na estrada): a câmera salta, não voa por cima de tudo */
    if (voar && Math.hypot(x - orb.alvo.x, z - orb.alvo.z) > 800 * M) { seguindo = false; C.olhar(x, z, v.dist * M, v.el, Math.atan2(o.v[0], o.v[1])); }
    else if (voar) { seguindo = false; C.voarPara(x, z, v.dist * M, v.el, Math.atan2(o.v[0], o.v[1])); }
    else { orb.dist = v.dist * M; orb.el = v.el; C.pedir(); }
  }

  /* =====================================================
     O QUE O BONECO NÃO DESENHA: a faixa e o objetivo
     ===================================================== */
  const panos = new Map();
  let anel = null, texturas = new Map(), escondidos = [];
  function texturaDe(F) {
    if (!F.img) return null;
    let t = texturas.get(F.img);
    if (!t) {
      t = new THREE.Texture(F.img);
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      texturas.set(F.img, t);
    }
    if (!t.version && (F.img.naturalWidth || F.img.width)) t.needsUpdate = true;
    return t;
  }
  function panoDe(F) {
    let p = panos.get(F);
    if (p) return p;
    const cor = (F.cores && F.cores.cor) || '#444';
    const mat = new THREE.MeshLambertMaterial({ color: '#ffffff', side: THREE.DoubleSide, transparent: true, alphaTest: 0.04 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    /* o contorno que pisca enquanto recolhem */
    const brilho = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#ffd35a', transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }));
    /* enrolada no ombro de quem pegou: o rolo na cor da torcida */
    const rolo = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * M, 0.08 * M, 1.0 * M, 10), new THREE.MeshLambertMaterial({ color: cor }));
    rolo.rotation.z = Math.PI / 2;
    const suporte = new THREE.Group(); suporte.add(rolo);
    grupo.add(brilho); grupo.add(mesh); grupo.add(suporte);
    p = { mesh, mat, brilho, suporte, cor, semImagem: true };
    panos.set(F, p);
    return p;
  }
  function desenharPanos(j) {
    const vistos = new Set();
    for (const F of j.faixas || []) {
      vistos.add(F);
      const p = panoDe(F);
      const tex = texturaDe(F);
      if (tex && p.mat.map !== tex) { p.mat.map = tex; p.mat.needsUpdate = true; }
      else if (!tex && p.semImagem) { p.mat.color.set(p.cor); p.semImagem = false; }
      const pendurada = F.estado === 'exposta' || F.estado === 'recolhendo', naMao = F.estado === 'na-mao' && F.portador;
      p.mesh.visible = pendurada; p.brilho.visible = pendurada && F.estado === 'recolhendo'; p.suporte.visible = !!naMao;
      if (pendurada) {
        /* NO MURO: o ponto é no chão, na frente dele; `dir` aponta pro muro.
           O pano fica em pé rente ao muro, de frente pra quem está no deck */
        const d = F.dir || [0, -1], enc = (F.encosto != null ? F.encosto : 10) - 1.5;
        const [wx, wz] = o.noMundo(F.x + d[0] * enc, F.y + d[1] * enc);
        const nx = -(d[0] * o.u[0] + d[1] * o.v[0]), nz = -(d[0] * o.u[1] + d[1] * o.v[1]);
        const w = F.w, h = F.h, y0 = o.chao(F.x, F.y) * M + Math.max(0.35 * M, 1.3 * M - h / 2);
        p.mesh.scale.set(w, h, 1); p.mesh.position.set(wx, y0 + h / 2, wz); p.mesh.rotation.set(0, Math.atan2(nx, nz), 0);
        if (p.brilho.visible) {
          p.brilho.scale.set(w + 0.25 * M, h + 0.25 * M, 1);
          p.brilho.position.set(wx - nx * 0.6, y0 + h / 2, wz - nz * 0.6); p.brilho.rotation.copy(p.mesh.rotation);
          p.brilho.material.opacity = 0.35 + 0.35 * Math.sin(j.t * 8);
        }
      } else if (naMao) {
        const q = pos(F.portador.x, F.portador.y, F.portador, PE);
        p.suporte.position.set(q.x, q.y + 1.5 * M, q.z);
        p.suporte.rotation.set(0, C.orb.az, 0);
      }
    }
    for (const [F, p] of panos) if (!vistos.has(F)) {
      grupo.remove(p.mesh); grupo.remove(p.brilho); grupo.remove(p.suporte);
      p.mesh.geometry.dispose(); p.mat.dispose(); p.brilho.geometry.dispose(); p.brilho.material.dispose();
      panos.delete(F);
    }
  }
  /* O NOME DO LÍDER em cima da cabeça, com a barra de vida (a camada 2D
     da cena, que fazia isso, não existe no palco da cidade) */
  let rotulo = null;
  const PL = {}, QL = {};
  function desenharLider() {
    const l = lider();
    if (!rotulo) return;
    if (!l || !l.lider) { rotulo.hidden = true; return; }
    const q = pos(l.x, l.y, l, PL), a = C.vida.projetar(q.x, q.y + 2.05 * M, q.z, QL);
    if (!a.frente) { rotulo.hidden = true; return; }
    rotulo.hidden = false;
    rotulo.style.left = Math.round(a.x) + 'px'; rotulo.style.top = Math.round(a.y) + 'px';
    const nome = String(l.nome || ''), vida = l.hpMax ? clamp01(l.hp / l.hpMax) : 1;
    if (rotulo.dataset.nome !== nome) { rotulo.dataset.nome = nome; rotulo.firstChild.textContent = nome; }
    rotulo.lastChild.firstChild.style.width = Math.round(vida * 100) + '%';
  }
  const clamp01 = v => Math.max(0, Math.min(1, v || 0));
  /* O OBJETIVO: o círculo dourado no chão onde o líder tem de chegar */
  function desenharObjetivo(j) {
    const D = o.cena, l = ladoDoJogador(), e = (D.entradas || []).find(x => x.lado === l);
    if (!e) { if (anel) anel.visible = false; return; }
    if (!anel) {
      anel = new THREE.Mesh(new THREE.RingGeometry(0.78, 1, 40), new THREE.MeshBasicMaterial({ color: '#e0b040', transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
      anel.rotation.x = -Math.PI / 2;
      grupo.add(anel);
    }
    const [wx, wz] = o.noMundo(e.x, e.y), r = Math.max(0.9 * M, (e.raio || 46) * 0.8);
    anel.visible = true;
    anel.position.set(wx, o.chao(e.x, e.y) * M + 0.06 * M, wz);
    anel.scale.set(r, r, 1);
    anel.material.opacity = 0.45 + 0.3 * Math.sin(j.t * 3.2);
  }

  /* =====================================================
     O CONTRATO DA PONTE
     ===================================================== */
  const R = {
    MODOS: [{ nome: 'perto', rot: 'câmera perto do líder' }, { nome: 'alto', rot: o.rotAlto || 'a cena inteira, do alto' }],
    montar() {
      if (!C || !C.vida) return false;
      montado = true; seguindo = false;
      document.body.classList.add('palco3d', 'palco-briga');
      C.vida.palco = {
        get J() { return J() || { t: 0, discos: [], policiais: [], projeteis: [], grades: [] }; },
        pos, rumo, rumoDe, seguir, semAnel: false, comVida: false, livre: !!o.livre,
        /* o cone do corte: da cabeça do líder até a câmera */
        alvoDoCorte: () => { const l = lider(); return l ? pos(l.x, l.y, l, PC) : null; }
      };
      /* o prédio da cena sem o telhado: de cima se vê dentro da casa */
      if (o.predio) C.vida.abrirPredio(o.predio.x, o.predio.z, 2.2);
      /* a peça do palco à parte (o posto, a estrada) entra na cena do cenário;
         o chão de longe da praça (o mato até o horizonte) sai enquanto ela
         está lá — de perto ele se desenhava por cima do pátio */
      if (o.peca) {
        C.vida.cena.add(o.peca);
        let raiz = C.vida.cena; while (raiz.parent) raiz = raiz.parent;
        escondidos = [];
        raiz.traverse(x => { if (x.name === 'longe' && x.visible) { x.visible = false; escondidos.push(x); } });
      }
      import(THREE_URL).then(m => {
        THREE = m;
        if (!montado) return;
        grupo = new THREE.Group(); grupo.name = 'palco da briga';
        C.vida.cena.add(grupo);
      }).catch(() => {});
      rotulo = document.createElement('div');
      rotulo.className = 'j3d-lider'; rotulo.hidden = true;
      rotulo.innerHTML = '<span></span><i><b></b></i>';
      document.body.appendChild(rotulo);
      vista('perto', true);
      return true;
    },
    desenhar(j) {
      if (!montado || !j || !grupo) return;
      desenharPanos(j);
      desenharObjetivo(j);
      desenharLider();
    },
    /* o WASD em relação à câmera: pra frente é pra onde ela olha */
    vetorDoTeclado(t) {
      let dx = 0, dy = 0;
      if (t['a'] || t['arrowleft']) dx--;
      if (t['d'] || t['arrowright']) dx++;
      if (t['w'] || t['arrowup']) dy++;
      if (t['s'] || t['arrowdown']) dy--;
      if (!dx && !dy) return null;
      const az = C.orb.az, fx = -Math.sin(az), fz = -Math.cos(az), rx = Math.cos(az), rz = -Math.sin(az);
      const wx = fx * dy + rx * dx, wz = fz * dy + rz * dx;
      const x = wx * o.u[0] + wz * o.u[1], y = wx * o.v[0] + wz * o.v[1], m = Math.hypot(x, y) || 1;
      return { x: x / m, y: y / m };
    },
    trocarCamera() { vista(modo === 'perto' ? 'alto' : 'perto', false); return modo; },
    limparDeCima() {
      if (!montado) return;
      montado = false;
      document.body.classList.remove('palco3d', 'palco-briga');
      if (C.vida.palco && C.vida.palco.seguir === seguir) C.vida.palco = null;
      C.vida.abrirPredio(null);
      if (o.peca) o.peca.removeFromParent();
      for (const x of escondidos) x.visible = true;
      if (rotulo) { rotulo.remove(); rotulo = null; }
      escondidos = [];
      if (grupo) {
        grupo.removeFromParent();
        grupo.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) x.material.dispose(); });
        grupo = null;
      }
      for (const t of texturas.values()) t.dispose();
      texturas = new Map(); panos.clear(); anel = null;
      if (o.aoDesmontar) try { o.aoDesmontar(); } catch (e) { console.error('palco da briga:', e); }
    },
    /* a cabeça do boneco na tela (os balões de fala do jogo) */
    projetar(d) {
      const q = pos(d.x, d.y, d, {});
      const a = C.vida.projetar(q.x, q.y + 1.85 * M, q.z, {});
      if (!a.frente) return null;
      const b = C.vida.projetar(q.x, q.y + 0.2 * M, q.z, {});
      return { x: a.x, cima: a.y, baixo: b.y };
    }
  };
  R.projetar.chave = () => { const c = C.vida.camera; return [c.position.x.toFixed(1), c.position.y.toFixed(1), c.position.z.toFixed(1), innerWidth, innerHeight].join('|'); };
  return R;
}
