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

/* as duas câmeras (V troca — o C é o chamar, como no jogo de feed): perto do líder e a casa inteira do alto (m e rad) */
const VISTAS = { perto: { dist: 21, el: 1.1 }, alto: { dist: 44, el: 1.3 } };

/* `o`: { C (o cenário), M (unidades por metro), cena (a do combate),
   noMundo(x, y) → [x, z], u, v (os eixos do tabuleiro no mundo), escala
   (unidades do mundo por px do tabuleiro; sem ela, 1), chao(x, y) → m (o
   piso ali), predio: {x, z} (o prédio que perde o telhado), peca (o grupo
   que entra na cena e sai no fim), semLonge (o chão de longe da praça sai
   junto: o palco à parte, na estrada), livre (a câmera sai da área da
   praça), vistas ({perto, alto}: {dist, el}), aoDesmontar(),
   e (a invasão no estádio, invasao.js) eixos(x, y) → {u, v} (os eixos
   do tabuleiro naquele ponto: o tabuleiro que segue a curva do anel),
   aCadaQuadro(j, THREE, grupo) (o que o palco desenha a mais: o gradil),
   aoLimpar(), semGrades (o boneco não desenha as grades do combate) e
   comDia(discos) (os bonecos do dia de jogo que ficam em volta) } */
export function palcoDeBriga(o) {
  const { C, M } = o, K = o.escala || 1, VIS = o.vistas || VISTAS;
  /* A HORA NO RELÓGIO DA BRIGA (o HUD do jogo de feed, ponte.js): a da
     cidade — o dia de jogo no ar (ou a estrada), senão o relógio da vida da
     praça. Sem ela o relógio da briga começava às 18h, a noite da foto dos
     arredores, com a cidade às 15h (a varredura 2D × 3D) */
  {
    const T = window.TO && TO.jogo3d, h = T && T.dia ? T.dia.hora : null, rel = T && T.vida && T.vida.relogio;
    const min = typeof h === 'number' ? h / 60 : rel && typeof rel.minuto === 'number' ? rel.minuto : null;
    if (o.cena && typeof min === 'number' && isFinite(min)) o.cena.horaIni = ((Math.floor(min) % 1440) + 1440) % 1440;
  }
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
  /* e o mundo no tabuleiro (a volta do noMundo: a origem e os dois eixos, na escala) */
  const O0 = o.noMundo(0, 0);
  const doMundo = o.doMundo || ((wx, wz) => { const dx = wx - O0[0], dz = wz - O0[1]; return [(dx * o.u[0] + dz * o.u[1]) / K, (dx * o.v[0] + dz * o.v[1]) / K]; });
  const rumoDe = (vx, vy) => Math.atan2(vx * o.u[0] + vy * o.v[0], vx * o.u[1] + vy * o.v[1]);
  /* (no tabuleiro que curva, o rumo de cada um é o dos eixos onde ele está) */
  const EX = {};
  const rumo = d => {
    if (typeof d.rumo !== 'number') return undefined;
    if (!o.eixos) return rumoDe(Math.sin(d.rumo), Math.cos(d.rumo));
    const e = o.eixos(d.x, d.y, EX), vx = Math.sin(d.rumo), vy = Math.cos(d.rumo);
    return Math.atan2(vx * e.u[0] + vy * e.v[0], vx * e.u[1] + vy * e.v[1]);
  };
  /* os eixos perto do líder (o teclado e o arrasto da bomba) */
  const eixosDoLider = () => { const l = o.eixos ? lider() : null; return l ? o.eixos(l.x, l.y, EX) : o; };
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
    const v = VIS[nome], orb = C.orb;
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
    /* (a tela da faixa é redesenhada quando a arte de verdade ou os
       escudos chegam — `versao` sobe — e a textura sobe de novo) */
    const v = F.img.versao || 0;
    if ((!t.version || t.userData.versao !== v) && (F.img.naturalWidth || F.img.width)) { t.userData.versao = v; t.needsUpdate = true; }
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
        /* (o pano é em px do tabuleiro: no mundo, vezes a escala) */
        const [wx, wz] = o.noMundo(F.x + d[0] * enc, F.y + d[1] * enc);
        const nx = -(d[0] * o.u[0] + d[1] * o.v[0]), nz = -(d[0] * o.u[1] + d[1] * o.v[1]);
        const w = F.w * K, h = F.h * K, y0 = o.chao(F.x, F.y) * M + Math.max(0.35 * M, 1.3 * M - h / 2);
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
    const [wx, wz] = o.noMundo(e.x, e.y), r = Math.max(0.9 * M, (e.raio || 46) * 0.8 * K);
    anel.visible = true;
    anel.position.set(wx, o.chao(e.x, e.y) * M + 0.06 * M, wz);
    anel.scale.set(r, r, 1);
    anel.material.opacity = 0.45 + 0.3 * Math.sin(j.t * 3.2);
  }

  /* A MIRA DA BOMBA (o dono, 28/09/2026: "Adicione uma forma de mirar a
     bomba com o mouse no 3d"): a ponte abre (`ponte.mira`, no tabuleiro)
     e aqui ela vira o chão — a zona onde a bomba cai (o raio de dano), o
     X no meio, o alcance tracejado em volta do líder e o arco da mão
     dele até o ponto; embaixo, a dica */
  let mira = null;
  const PM1 = {}, PM2 = {}, QM = {}, PT = {};
  function montarMira() {
    const cor = (c, op, extra) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide, ...extra });
    const zona = new THREE.Mesh(new THREE.CircleGeometry(1, 48), cor('#e25028', 0.2));
    const aro = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 64), cor('#ff7846', 0.9));
    for (const m of [zona, aro]) { m.rotation.x = -Math.PI / 2; m.renderOrder = 12; }
    const V = (x, z) => new THREE.Vector3(x, 0, z);
    const xis = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([V(-1, -1), V(1, 1), V(1, -1), V(-1, 1)]),
                                       new THREE.LineBasicMaterial({ color: '#ffdc5a', transparent: true, depthWrite: false }));
    xis.renderOrder = 13;
    /* o alcance: o círculo tracejado em volta do líder (em unidade de mundo: o tracejado não estica) */
    const R = (TO.diaJogo.ponte.alcanceBomba || 210) * K, pts = [];
    for (let i = 0; i <= 72; i++) pts.push(new THREE.Vector3(Math.cos(i / 72 * 2 * Math.PI) * R, 0, Math.sin(i / 72 * 2 * Math.PI) * R));
    const alcance = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: '#ffffff', transparent: true, opacity: 0.4, dashSize: 0.35 * M, gapSize: 0.45 * M, depthWrite: false }));
    alcance.computeLineDistances(); alcance.renderOrder = 12;
    const arco = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(33 * 3), 3)),
                                new THREE.LineDashedMaterial({ color: '#ffdc5a', transparent: true, opacity: 0.95, dashSize: 0.25 * M, gapSize: 0.18 * M, depthWrite: false }));
    arco.frustumCulled = false; arco.renderOrder = 13;
    const g = new THREE.Group(); g.name = 'mira da bomba';
    g.add(zona, aro, xis, alcance, arco);
    grupo.add(g);
    const dica = document.createElement('div');
    dica.className = 'j3d-mira'; dica.hidden = true;
    dica.textContent = 'clique joga · 3 joga · Esc cancela';
    document.body.appendChild(dica);
    return { g, zona, aro, xis, alcance, arco, dica };
  }
  function desenharMira(j) {
    const Pt = TO.diaJogo && TO.diaJogo.ponte, m = Pt && Pt.mira, l = m && lider();
    if (!m || !l || !l.lider) { if (mira) { mira.g.visible = false; mira.dica.hidden = true; } return; }
    if (!mira) mira = montarMira();
    mira.g.visible = true;
    const raio = (Pt.raioBomba || 92) * K, pul = 0.5 + 0.5 * Math.sin(performance.now() / 140);
    /* o ponto (a ponte já puxa pra dentro do alcance) e o líder, no mundo */
    const q = pos(m.x, m.y, null, PM1), a = pos(l.x, l.y, l, PM2), yq = q.y + 0.06 * M;
    mira.zona.position.set(q.x, yq, q.z); mira.zona.scale.set(raio, raio, 1);
    mira.zona.material.opacity = 0.14 + 0.1 * pul;
    mira.aro.position.set(q.x, yq + 0.01 * M, q.z); mira.aro.scale.set(raio, raio, 1);
    mira.aro.material.opacity = 0.65 + 0.3 * pul;
    const cx = Math.max(0.35 * M, raio * 0.12);
    mira.xis.position.set(q.x, yq + 0.02 * M, q.z); mira.xis.scale.set(cx, 1, cx); mira.xis.rotation.y = C.orb.az;
    mira.alcance.position.set(a.x, a.y + 0.05 * M, a.z);
    /* o arco: da mão do líder (1,5 m) até o chão do ponto, mais alto quanto mais longe */
    const P = mira.arco.geometry.attributes.position, y0 = a.y + 1.5 * M, dist = Math.hypot(q.x - a.x, q.z - a.z), h = Math.max(1.2 * M, dist * 0.3);
    for (let i = 0; i <= 32; i++) {
      const k = i / 32;
      P.setXYZ(i, a.x + (q.x - a.x) * k, y0 + (yq - y0) * k + 4 * h * k * (1 - k), a.z + (q.z - a.z) * k);
    }
    P.needsUpdate = true; mira.arco.geometry.computeBoundingSphere(); mira.arco.computeLineDistances();
    /* a dica, embaixo da zona: na beira dela do lado da câmera */
    const az = C.orb.az, t = C.vida.projetar(q.x + Math.sin(az) * raio, yq, q.z + Math.cos(az) * raio, QM);
    mira.dica.hidden = !t.frente;
    if (t.frente) { mira.dica.style.left = Math.round(t.x) + 'px'; mira.dica.style.top = Math.round(t.y + 8) + 'px'; }
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
        pos, rumo, rumoDe, seguir, semAnel: false, comVida: false, livre: !!o.livre, escala: K,
        semGrades: !!o.semGrades, comDia: o.comDia || null,
        /* o cone do corte: da cabeça do líder até a câmera */
        alvoDoCorte: () => { const l = lider(); return l ? pos(l.x, l.y, l, PC) : null; }
      };
      /* o prédio da cena sem o telhado: de cima se vê dentro da casa */
      if (o.predio) C.vida.abrirPredio(o.predio.x, o.predio.z, 2.2);
      /* a peça do palco à parte (o posto, a estrada) entra na cena do cenário;
         o chão de longe da praça (o mato até o horizonte) sai enquanto ela
         está lá — de perto ele se desenhava por cima do pátio */
      escondidos = [];
      if (o.peca) {
        /* (o que passa da cabeça do líder, na frente da câmera, fica ralo: o teto da loja, o poste) */
        if (C.vida.cortavel) o.peca.traverse(x => { const m = x.material; if (m && !m.userData.cortavel) { C.vida.cortavel(m); m.userData.cortavel = true; m.needsUpdate = true; } });
        C.vida.cena.add(o.peca);
      }
      if (o.semLonge) {
        let raiz = C.vida.cena; while (raiz.parent) raiz = raiz.parent;
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
      desenharMira(j);
      if (o.aCadaQuadro) { try { o.aCadaQuadro(j, THREE, grupo); } catch (e) { console.error('palco da briga:', e); } }
    },
    /* A MIRA COM O MOUSE: o ponto do tabuleiro debaixo do ponto da tela
       (px CSS) — o raio da câmera até o chão na altura do líder —, ou
       null (o céu) */
    pontoDaTela(sx, sy) {
      if (!montado || !C.vida.chaoNaTela) return null;
      const l = lider(), y = l ? pos(l.x, l.y, l, PT).y : 0;
      const p = C.vida.chaoNaTela(sx, sy, y);
      if (!p) return null;
      const [x, yb] = doMundo(p.x, p.z);
      return { x, y: yb };
    },
    /* o arrasto do BOMBA no pad (px de tela) no tabuleiro: a direita da
       tela é a direita da câmera; pra baixo, pra perto dela */
    deltaDaTela(dx, dy) {
      const az = C.orb.az, fx = -Math.sin(az), fz = -Math.cos(az), rx = Math.cos(az), rz = -Math.sin(az);
      const wx = rx * dx - fx * dy, wz = rz * dx - fz * dy, e = eixosDoLider();
      return { x: wx * e.u[0] + wz * e.u[1], y: wx * e.v[0] + wz * e.v[1] };
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
      const wx = fx * dy + rx * dx, wz = fz * dy + rz * dx, e = eixosDoLider();
      const x = wx * e.u[0] + wz * e.u[1], y = wx * e.v[0] + wz * e.v[1], m = Math.hypot(x, y) || 1;
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
      if (mira) { mira.dica.remove(); mira = null; }
      escondidos = [];
      if (o.aoLimpar) { try { o.aoLimpar(); } catch (e) { console.error('palco da briga:', e); } }
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
  /* pro teste: os panos das faixas no mundo e na tela (px CSS; `frente`: na frente da câmera) */
  Object.defineProperty(R, 'panos', { get: () => [...panos].map(([F, p]) => {
    const q = p.mesh.position, t = C.vida.projetar(q.x, q.y, q.z, {});
    return { tipo: F.tipo, lado: F.lado, torcida: F.torcidaId, visivel: p.mesh.visible, comImagem: !!p.mat.map,
             tela: { x: Math.round(t.x), y: Math.round(t.y), frente: t.frente }, larg: +(p.mesh.scale.x / M).toFixed(2), alt: +(p.mesh.scale.y / M).toFixed(2),
             mundo: [q.x, q.y, q.z].map(v => +v.toFixed(1)), rumo: +p.mesh.rotation.y.toFixed(3) };
  }) });
  return R;
}
