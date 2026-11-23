/* =========================================================
   A SEDE COMO CENA DE BRIGA (a invasão de sede, 23/11/2026)

   O dono, sobre a invasão de sede: "prefiro que seja o modelo 3d vivo
   mesmo". Então a cena é a sede de verdade (sede3d.js, `montarSede`):
   as paredes, as portas, os móveis, o armário do patrimônio e o das
   tomadas com o que está guardado neles, as placas das salas e a faixa
   da torcida — sem o telhado, e cortada a 2,3 m (a câmera de cima vê
   dentro dos cômodos; o miolo da parede cortada é o da sede3d). Na
   frente, a calçada e a rua; dos lados e no fundo, o muro dos vizinhos.

   Quem monta a cena (jogo.js, `TO.dados.cenaDaSede`) guarda em `D.sede`
   a sede que pediu e em `D.sedeNoTabuleiro` onde ela cai: o tabuleiro
   tem 24 px por metro (o boneco), e a sede é feita na unidade do mundo
   do cenário 3D (34/1,75 por metro) — daí a escala de 1,25.

   À NOITE (a invasão furtiva) a luz da cena baixa e as lâmpadas das
   salas ficam acesas, poucas: quem entra no escuro enxerga pouco.
   ========================================================= */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { montarSede } from './sede3d.js?v=15e2ed423a';
import { ATLAS } from './modelos_atlas.js?v=15e2ed423a';
import * as K from './detalhe3d.js?v=15e2ed423a';

const MUNDO = 34 / 1.75;          // unidade do mundo por metro (o cenário 3D)
const PX = 24;                    // px do tabuleiro por metro (o boneco)

/* ---------- o atlas das construções (as mesmas folhas da cidade) ---------- */
const texturas = {}, materiais = {};
function textura(folha) {
  if (!texturas[folha]) {
    const t = new THREE.TextureLoader().load(ATLAS[folha].arquivo);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    texturas[folha] = t;
  }
  return texturas[folha];
}
function material(folha, corte) {
  const k = folha + '|' + (corte || '');
  if (materiais[k]) return materiais[k];
  const m = new THREE.MeshLambertMaterial({ map: textura(folha), vertexColors: true, side: THREE.DoubleSide,
                                            alphaTest: folha === 'grades' ? 0.08 : 0 });
  if (corte) m.clippingPlanes = [corte];
  return (materiais[k] = m);
}
function malhaDeBlocos(blocos, folha, corte) {
  const lista = (blocos || []).filter(Boolean);
  if (!lista.length) return null;
  const junta = campo => { let n = 0; for (const b of lista) n += b[campo].length; const o = new Float32Array(n); let i = 0; for (const b of lista) { o.set(b[campo], i); i += b[campo].length; } return o; };
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(junta('pos'), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(junta('uv'), 2));
  g.setAttribute('color', new THREE.BufferAttribute(junta('cor'), 3));
  g.computeVertexNormals();
  return new THREE.Mesh(g, material(folha, corte));
}

/* a régua por cima da porta fechada da sala (bem visível de cima, inclusive de noite) */
let matRegua = null;
const reguaPorta = () => matRegua || (matRegua = new THREE.MeshLambertMaterial({ color: '#d7a256', emissive: '#4a2c08' }));

/* ---------- as placas com texto (a faixa, a placa da sala, o escudo) ---------- */
let proprios = [];
const luz = c => { const x = new THREE.Color(c || '#888'); return (x.r * 0.299 + x.g * 0.587 + x.b * 0.114) * 255; };
function telaDe(w, h, pintar) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  pintar(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function texturaPlaca(texto, tinta, fundo, razao, faixa) {
  const H = 128, W = Math.round(H * Math.min(8, Math.max(1.2, razao)));
  return telaDe(W, H, (c) => {
    c.fillStyle = fundo; c.fillRect(0, 0, W, H);
    if (faixa) { c.fillStyle = tinta; c.fillRect(0, 10, W, 7); c.fillRect(0, H - 17, W, 7); }
    else { c.strokeStyle = luz(fundo) > 150 ? 'rgba(40,36,28,.75)' : 'rgba(255,255,255,.35)'; c.lineWidth = 8; c.strokeRect(7, 7, W - 14, H - 14); }
    c.fillStyle = tinta; c.textAlign = 'center'; c.textBaseline = 'middle';
    const fonte = t => `${faixa ? 'italic ' : ''}bold ${t}px "Arial Narrow", Arial, sans-serif`;
    let tam = faixa ? 78 : 70; c.font = fonte(tam);
    while (tam > 18 && c.measureText(texto || '').width > W - 44) { tam -= 3; c.font = fonte(tam); }
    c.fillText(texto || '', W / 2, H / 2 + 4);
  });
}
/* o escudo, a camisa e o pano na parede: o desenho simples nas cores */
function texturaDesenho(p) {
  return telaDe(128, Math.round(128 * Math.max(0.4, Math.min(2.5, p.alt / p.larg))), (c, w, h) => {
    if (p.tipo === 'escudo') {
      c.clearRect(0, 0, w, h);
      c.fillStyle = p.cor2 || '#fff'; c.beginPath(); c.arc(w / 2, h / 2, Math.min(w, h) / 2 - 2, 0, 6.29); c.fill();
      c.fillStyle = p.cor || '#c00'; c.beginPath(); c.arc(w / 2, h / 2, Math.min(w, h) / 2 - 12, 0, 6.29); c.fill();
      c.fillStyle = p.corTexto || p.cor2 || '#fff'; c.font = `bold ${Math.round(h * 0.22)}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(p.texto || p.sigla || '', w / 2, h / 2);
    } else if (p.tipo === 'camisa') {
      c.fillStyle = '#e8e4da'; c.fillRect(0, 0, w, h);
      c.fillStyle = p.cor || '#c00'; c.fillRect(w * 0.22, h * 0.18, w * 0.56, h * 0.7); c.fillRect(w * 0.06, h * 0.18, w * 0.2, h * 0.24); c.fillRect(w * 0.74, h * 0.18, w * 0.2, h * 0.24);
      c.fillStyle = p.cor2 || '#fff'; c.fillRect(w * 0.22, h * 0.18, w * 0.56, h * 0.06);
    } else {
      c.fillStyle = p.cor2 || '#fff'; c.fillRect(0, 0, w, h);
      c.fillStyle = p.cor3 || p.cor || '#000'; c.fillRect(w * 0.04, h * 0.04, w * 0.92, h * 0.92);
      c.fillStyle = p.cor || '#c00'; c.fillRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);
      c.fillStyle = p.corTexto || p.cor2 || '#fff'; c.font = `bold ${Math.round(h * 0.2)}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(p.sigla || '', w / 2, h / 2);
    }
  });
}
function placaNoMundo(g, p, tex, alfa, corte) {
  const mt = new THREE.MeshLambertMaterial({ map: tex, transparent: !!alfa, alphaTest: alfa ? 0.35 : 0, side: THREE.DoubleSide });
  if (corte) mt.clippingPlanes = [corte];
  proprios.push(mt);
  const geo = new THREE.PlaneGeometry(p.larg, p.alt);
  const m = new THREE.Mesh(geo, mt);
  if (p.deitada) { geo.rotateX(-Math.PI / 2); m.rotation.y = Math.atan2(-p.oz, p.ox); }
  else m.rotation.y = Math.atan2(p.ox, p.oz);
  m.position.set(p.x, p.y, p.z);
  g.add(m);
}

/* =======================================================
   A MONTAGEM
   ======================================================= */
let atual = null;
export function cenarioDaSede(D) {
  if (!D || !D.sede || !D.sedeNoTabuleiro) return null;
  liberar(atual);
  const T = D.sedeNoTabuleiro, k = PX / MUNDO;
  const raiz = new THREE.Group(); raiz.name = 'sede3d';
  /* a noite (a invasão furtiva): a luz baixa */
  raiz.userData.luz = D.noite ? 0.16 : 0.85;
  /* o corte: a parede some acima de 2,3 m (no tabuleiro, em px) */
  const corte = new THREE.Plane(new THREE.Vector3(0, -1, 0), 2.3 * PX);
  raiz.userData.corte = true;
  /* o chão da sede é 9 cm acima da calçada: o boneco pisa nele */
  const chao = (D.sede.chao || 1.75) * k;
  raiz.userData.alturaEm = (x, y) => (x > T.x && x < T.x + T.w && y > T.y && y < T.y + T.h) ? chao : 0;

  /* o que está em volta: a rua, a calçada, o muro dos vizinhos */
  entorno(raiz, D, T);

  /* a sede: o modelo inteiro, sem o telhado (e, na de dois andares, sem o de cima) */
  const destino = {};
  const r = montarSede(D.sede, destino, { portasVivas: true });
  const g = new THREE.Group();
  g.position.set(T.x, 0, T.y);
  g.scale.setScalar(k);
  for (const [lista, folha] of [['casas', 'casas'], ['grades', 'grades'], ['guardados', 'casas']]) {
    const blocos = (destino[lista] || []).slice(0, lista === 'guardados' ? 9 : 1);
    const m = malhaDeBlocos(blocos, folha, corte);
    if (m) g.add(m);
  }
  /* AS FOLHAS DAS PORTAS (o dono, 23/11/2026: as portas das salas ficam
     fechadas e quebram na pancada ou na bomba): cada folha numa malha
     sua, presa na dobradiça. A da sala (a que a cena fez de grade,
     `porta:<i>`) fica fechada, treme quando apanha e cai no chão quando
     a grade vai a zero; as outras (o portão da rua, o bar) ficam abertas */
  const folhas = [];
  const salas = r.portasSalas || [];
  for (const f of destino.portas || []) {
    const m = malhaDeBlocos([f.bloco], 'casas', corte);
    if (!m) continue;
    const piv = new THREE.Group();
    piv.position.set(f.hx, f.y0, f.hz);
    m.position.set(-f.hx, -f.y0, -f.hz);
    piv.add(m);
    if (f.y0 > 2.3 * MUNDO) continue;
    /* de que sala ela é: o meio da folha fechada perto do meio do vão */
    const cx = f.hx + f.dir[0] * f.larg / 2, cz = f.hz + f.dir[1] * f.larg / 2;
    let sala = -1, md = Infinity;
    salas.forEach((p, i) => {
      const d = Math.hypot((p.de.x + p.ate.x) / 2 - cx, (p.de.z + p.ate.z) / 2 - cz);
      if (d < md) { md = d; sala = i; }
    });
    if (!(md < Math.max(f.larg, 0.5 * MUNDO))) sala = -1;
    if (sala < 0) piv.rotation.y = f.ang;
    /* A PORTA FECHADA SE VÊ DE CIMA (dono, 23/11/2026: a folha fechada, vista de cima, era só um risco fino na parede):
       por cima da folha da sala, logo abaixo do corte da parede, uma régua cor de madeira clara da largura do vão, que
       treme e cai junto com a folha */
    if (sala >= 0) {
      const regua = new THREE.Mesh(new THREE.BoxGeometry(f.larg, 0.08 * MUNDO, 0.22 * MUNDO), reguaPorta());
      regua.position.set(f.dir[0] * f.larg / 2, 2.18 * MUNDO, f.dir[1] * f.larg / 2);
      regua.rotation.y = -Math.atan2(f.dir[1], f.dir[0]);
      piv.add(regua);
    }
    g.add(piv);
    if (sala >= 0) folhas.push({ piv, id: 'porta:' + sala, eixo: new THREE.Vector3(f.dir[0], 0, f.dir[1]).normalize(), caiu: 0 });
  }
  /* a cada quadro: a folha segue a grade da cena */
  raiz.userData.aCadaQuadro = (J, dt) => {
    if (!J || !J.grades || !folhas.length) return;
    for (const fo of folhas) {
      const gr = J.grades.find(x => x.grade === fo.id);
      if (!gr) continue;
      if (gr.hp <= 0) {
        if (fo.caiu < 1) {
          fo.caiu = Math.min(1, fo.caiu + dt / 0.35);
          fo.piv.quaternion.setFromAxisAngle(fo.eixo, fo.caiu * fo.caiu * Math.PI / 2);
        }
      } else {
        /* apanhando: a folha sacode na dobradiça */
        const tr = gr.tremor || 0;
        fo.piv.rotation.set(0, tr > 0.05 ? Math.sin(performance.now() / 28) * 0.012 * tr : 0, 0);
      }
    }
  };
  for (const p of r.placas || []) {
    if (p.y > 2.3 * MUNDO) continue;
    if (p.tipo === 'escudo' || p.tipo === 'camisa' || p.tipo === 'bandeira') placaNoMundo(g, p, texturaDesenho(p), p.tipo === 'escudo', corte);
    else placaNoMundo(g, p, texturaPlaca(p.texto, p.tinta, p.fundo, p.larg / p.alt, p.tipo === 'faixa'), false, corte);
  }
  raiz.add(g);
  /* A NOITE (a furtiva): além da luz baixa, um véu azul-escuro por cima de
     tudo — a sede, a rua e os bonecos — como a madrugada vista de cima */
  if (D.noite) {
    const veu = new THREE.Mesh(new THREE.PlaneGeometry(D.largura + 200, D.altura + 200),
      new THREE.MeshBasicMaterial({ color: 0x050a1c, transparent: true, opacity: 0.42, depthWrite: false }));
    veu.rotation.x = -Math.PI / 2; veu.position.set(D.largura / 2, 4.2 * PX, D.altura / 2); veu.renderOrder = 10;
    raiz.add(veu);
  }
  atual = raiz;
  return raiz;
}

/* a rua da frente (asfalto, meio-fio, calçada), o terreno dos lados e
   do fundo, o muro de bloco dos vizinhos e um poste na calçada */
function entorno(raiz, D, T) {
  const W = D.largura, H = D.altura;
  const g = new THREE.Group(); g.scale.setScalar(PX);
  const m = v => v / PX;
  const yFrente = T.y + T.h;                  // a fachada
  const calcada = 2.2 * PX;                   // a calçada tem 2,2 m
  const { pintado, TEX } = K;
  /* o terreno em volta (terra batida) e o chão por baixo de tudo */
  g.add(K.chao(m(W) + 10, m(H) + 10, pintado('terra', TEX.terra(), { cor: '#8f8270' }), 4, m(W / 2), -0.04, m(H / 2)));
  /* a calçada na frente, de ponta a ponta, e a rua */
  g.add(K.chao(m(W) + 10, m(calcada), pintado('concretoCalcada', TEX.concreto(), { cor: '#bdb7ac' }), 3, m(W / 2), -0.02, m(yFrente + calcada / 2)));
  g.add(K.chao(m(W) + 10, m(H - yFrente - calcada) + 5, pintado('asfalto', TEX.asfalto()), 4, m(W / 2), -0.025, m(yFrente + calcada + (H - yFrente - calcada) / 2) + 2.5));
  g.add(K.caixa(m(W) + 10, 0.15, 0.25, K.fosco('#9a958b'), m(W / 2), -0.02, m(yFrente + calcada)));
  /* o muro dos vizinhos: dos lados e no fundo do terreno */
  const muro = (x0, y0, x1, y1) => {
    const L = Math.hypot(m(x1 - x0), m(y1 - y0)); if (L < 0.5) return;
    const q = K.muroDeBloco(L, 2.4, 0.2);
    q.position.set(m((x0 + x1) / 2), 0, m((y0 + y1) / 2)); q.rotation.y = -Math.atan2(m(y1 - y0), m(x1 - x0));
    g.add(q);
  };
  muro(4, T.y - 8, W - 4, T.y - 8);
  muro(T.x - 8, T.y - 8, T.x - 8, yFrente);
  muro(T.x + T.w + 8, T.y - 8, T.x + T.w + 8, yFrente);
  /* AS CASAS DOS VIZINHOS (a sede no tamanho dela, no meio da quadra):
     cada lote com a casa térrea recuada 1,5 m, o telhado (telha ou laje)
     e o muro baixo da frente; o quintal no fundo */
  const PAREDES = ['#d8cdb4', '#c9b79a', '#b8c4b0', '#d3b8a4', '#c2c0b8', '#e0d6c0'];
  const TELHAS = ['#9c5a3c', '#8a4f36', '#a7643f', '#8f8a80', '#7d786f'];
  for (const v of D.vizinhos || []) {
    const w = m(v.x1 - v.x0) - 0.3, cx = m((v.x0 + v.x1) / 2);
    const zf = m(v.y1) - 1.5, zb = m(v.y0) + 3.5, d = zf - zb;
    if (w < 3 || d < 3) continue;
    const alt = 2.9 + (v.i % 3) * 0.15;
    g.add(K.caixa(w - 0.4, alt, d, K.fosco(PAREDES[v.i % PAREDES.length]), cx, 0, zb + d / 2));
    g.add(K.caixa(w, 0.18, d + 0.6, K.fosco(TELHAS[(v.i * 3) % TELHAS.length]), cx, alt, zb + d / 2));
    g.add(K.sombra(w + 0.6, d + 1.2, cx + 0.4, zb + d / 2 + 0.4));
    /* o muro baixo da frente, com o vão do portãozinho */
    const L = (w - 1.2) / 2;
    for (const sg of [-1, 1]) { const q = K.muroDeBloco(L, 1.3, 0.15); q.position.set(cx + sg * (0.6 + L / 2), 0, m(v.y1) - 0.1); g.add(q); }
    /* o muro de divisa entre um lote e outro */
    muro(v.x0, v.y0, v.x0, v.y1);
  }
  /* o poste da calçada */
  const p = K.poste(7.5); p.position.set(m(T.x + T.w * 0.85), 0, m(yFrente + calcada - 8)); p.rotation.y = Math.PI / 2; g.add(p);
  raiz.add(K.juntar(g, 'entorno'));
}

function liberar(g) {
  if (!g) return;
  g.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
  for (const mt of proprios) { if (mt.map) mt.map.dispose(); mt.dispose(); }
  proprios = [];
}
