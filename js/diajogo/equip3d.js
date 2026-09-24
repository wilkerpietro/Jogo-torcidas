/* =========================================================
   OS EQUIPAMENTOS NOVOS DA PROPOSTA — o shopping, a delegacia e a praça
   ---------------------------------------------------------
   O SHOPPING POENTE (no lugar do campo de várzea) é o da primeira foto
   do dono: três andares de cortina de vidro verde com a faixa de
   alumínio em cada laje, a ponta redonda, o último andar recuado de
   vidro, a marquise de vidro da entrada, o totem vermelho e cinza na
   praça da frente e a casa de máquinas, o ar e a claraboia no teto.

   O 2º DISTRITO POLICIAL (no lugar do posto de saúde) é o da segunda:
   o bloco de dois andares de pastilha bege, a platibanda e o volume de
   cima em azul, as janelas de caixilho escuro, a marquise branca de
   friso vermelho em pilares finos, o brasão da Polícia Civil, a
   bandeira do Brasil no mastro da fachada, o ar e a placa solar no
   teto; do lado, o pátio cercado com as três viaturas e a guarita.

   A PRAÇA DA VILA é de bairro: o calçadão de pedra portuguesa em onda,
   o chafariz de pastilha no meio, o parquinho na areia (escorregador,
   balanço, gangorra), a academia ao ar livre, as mesas de xadrez, a
   banca de jornal, os ipês amarelos e as outras árvores, os bancos de
   ripa, os postes de praça e as lixeiras.

   O REFERENCIAL é o do construtor: x da esquerda pra direita de quem
   olha a fachada, z negativo entrando no terreno, em metros. Pro mundo
   ele só GIRA (nunca espelha), então o que tem letra na folha (a porta
   da delegacia, a viatura, a banca) sai lendo certo. O que tem texto que
   muda (o nome do shopping, a placa da praça) vai como decalque, pra
   quem mostra escrever.
   ========================================================= */
import { Construtor, METRO, lerp, sub, unit } from './construtor3d.js';

const M = METRO;
const lisa = tinta => ({ k: 'lisa', tinta });
const BRANCO = '#f1f1ee', GRAFITE = '#3d4347', PRETO = '#202225', VERMELHO = '#c3202b', VERDE_PRACA = '#2f5f3a';

/* do terreno (retângulo de mundo) e da frente pro referencial local:
   L ao longo da fachada, A de fundo, e o ponto de mundo de (x, z) */
export function eixosDoEquip(a, frente) {
  if (frente === 'n') return { L: a.x1 - a.x0, A: a.y1 - a.y0, pt: (x, z) => [a.x1 - x * M, a.y0 - z * M] };
  if (frente === 's') return { L: a.x1 - a.x0, A: a.y1 - a.y0, pt: (x, z) => [a.x0 + x * M, a.y1 + z * M] };
  if (frente === 'o') return { L: a.y1 - a.y0, A: a.x1 - a.x0, pt: (x, z) => [a.x0 - z * M, a.y0 + x * M] };
  return { L: a.y1 - a.y0, A: a.x1 - a.x0, pt: (x, z) => [a.x1 + z * M, a.y1 - x * M] };
}
/* o fim de todo modelo: os construtores viram blocos de mundo, os
   decalques e as marcas da planta também */
function fechar(E, Cs, destino, placas, marcas, y0 = 0) {
  const bloco = C => {
    const n = C.pos.length / 3;
    if (!n) return null;
    const pos = new Float32Array(n * 3), p = C.pos;
    for (let i = 0; i < n; i++) {
      const [wx, wz] = E.pt(p[3 * i], p[3 * i + 2]);
      pos[3 * i] = wx; pos[3 * i + 1] = y0 + p[3 * i + 1] * M; pos[3 * i + 2] = wz;
    }
    return { pos, uv: new Float32Array(C.uv), cor: new Float32Array(C.cor) };
  };
  for (const [lista, C] of Object.entries(Cs)) {
    const b = bloco(C);
    if (b) (destino[lista] = destino[lista] || []).push(b);
  }
  const [ox, oz] = E.pt(0, 0);
  const dir = (nx, nz) => { const [a, b] = E.pt(nx, nz); const dx = a - ox, dz = b - oz, n = Math.hypot(dx, dz) || 1; return [dx / n, dz / n]; };
  const placasMundo = placas.map(p => {
    const [x, z] = E.pt(p.x, p.z), [dx, dz] = dir(p.nx, p.nz);
    return { ...p, x, y: y0 + p.y * M, z, ox: dx, oz: dz, larg: p.larg * M, alt: p.alt * M };
  });
  const retMundo = r => {
    if (r.r !== undefined) { const [x, z] = E.pt(r.x, r.z); return { ...r, x, y: z, r: r.r * M }; }
    const [a0, b0] = E.pt(r.x0, r.z0), [a1, b1] = E.pt(r.x1, r.z1);
    return { x0: Math.min(a0, a1), x1: Math.max(a0, a1), y0: Math.min(b0, b1), y1: Math.max(b0, b1), cor: r.cor, tipo: r.tipo };
  };
  return { placas: placasMundo, planta2d: marcas.map(retMundo) };
}
/* a placa com texto, de frente pra (nx, nz) */
const placa = (lista, tipo, texto, fundo, tinta, x, y, z, nx, nz, larg, alt, extra = {}) =>
  lista.push({ tipo, texto, fundo, tinta, x, y, z, nx, nz, larg, alt, ...extra });

/* uma barra entre dois pontos (poste, mastro, cano), de seção quadrada */
function barra(C, p, q, e, k, tinta) {
  const d = unit(sub(q, p));
  let a = [-d[2], 0, d[0]];
  if (Math.hypot(...a) < 1e-4) a = [1, 0, 0];
  a = unit(a);
  const b = unit([d[1] * a[2] - d[2] * a[1], d[2] * a[0] - d[0] * a[2], d[0] * a[1] - d[1] * a[0]]);
  const h = e / 2, off = (s, t) => [a[0] * s + b[0] * t, a[1] * s + b[1] * t, a[2] * s + b[2] * t];
  const cs = [off(-h, -h), off(h, -h), off(h, h), off(-h, h)];
  const c = C.cel(k);
  if (tinta) C.pintar(tinta);
  for (let i = 0; i < 4; i++) {
    const c0 = cs[i], c1 = cs[(i + 1) % 4];
    C.poli([[p[0] + c0[0], p[1] + c0[1], p[2] + c0[2]], [p[0] + c1[0], p[1] + c1[1], p[2] + c1[2]],
            [q[0] + c1[0], q[1] + c1[1], q[2] + c1[2]], [q[0] + c0[0], q[1] + c0[1], q[2] + c0[2]]],
           [[c[0], c[1]], [c[2], c[1]], [c[2], c[3]], [c[0], c[3]]]);
  }
  if (tinta) C.pintar(null);
}
/* o cilindro (torno) de uma cor, em pé */
function cilindro(C, x, z, y0, y1, r, tinta, lados = 10, k = 'lisa') {
  C.pintar(tinta);
  C.torno(x, z, [[0.001, y0], [r, y0], [r, y1], [0.001, y1]], lados, k);
  C.pintar(null);
}

/* =======================================================
   AS PEÇAS DE PRAÇA (a praça e a frente do shopping)
   ======================================================= */
/* o torno com a peça REPETIDA: `rep` vezes em volta e uma vez por pedaço
   do perfil (o do construtor estica a peça numa volta só, e a folha da
   copa, de 2 m, virava risco) */
function tornoRep(C, cx, cz, perfil, lados, k, rep, giro = 0) {
  const c = C.cel(k), n = lados / rep;
  for (let i = 0; i < lados; i++) {
    const t0 = giro + i / lados * Math.PI * 2, t1 = giro + (i + 1) / lados * Math.PI * 2;
    const f0 = (i % n) / n, f1 = (i % n + 1) / n;
    const u0 = lerp(c[0], c[2], f0), u1 = lerp(c[0], c[2], f1);
    for (let j = 0; j < perfil.length - 1; j++) {
      const [r0, y0] = perfil[j], [r1, y1] = perfil[j + 1];
      C.poli([[cx + r0 * Math.cos(t0), y0, cz - r0 * Math.sin(t0)], [cx + r0 * Math.cos(t1), y0, cz - r0 * Math.sin(t1)],
              [cx + r1 * Math.cos(t1), y1, cz - r1 * Math.sin(t1)], [cx + r1 * Math.cos(t0), y1, cz - r1 * Math.sin(t0)]],
             [[u0, c[1]], [u1, c[1]], [u1, c[3]], [u0, c[3]]]);
    }
  }
}
/* a árvore: o tronco de casca, dois galhos e a copa de folha em volta; o
   ipê leva a copa amarela. `marcas` recebe a copa em planta. */
function arvore(C, x, z, alt, raio, ipe, marcas) {
  const r = raio, y0 = alt * 0.42;
  C.torno(x, z, [[0.2, 0], [0.16, y0 * 0.6], [0.13, y0 + 0.2]], 7, 'casca');
  for (const [dx, dz, h] of [[0.5, 0.2, 0.7], [-0.4, -0.3, 0.8]]) barra(C, [x, y0 * 0.85, z], [x + dx, y0 + h, z + dz], 0.1, 'casca');
  const k = ipe ? 'copa_ipe' : 'copa';
  tornoRep(C, x, z, [[0.05, y0], [r * 0.75, y0 + 0.15 * alt], [r, y0 + 0.36 * alt], [r * 0.92, y0 + 0.5 * alt],
                     [r * 0.6, y0 + 0.62 * alt], [0.05, y0 + 0.66 * alt]], 12, k, 4, (x * 7 + z * 3) % 1);
  if (marcas) marcas.push({ x, z, r, cor: ipe ? '#e6b81f' : '#3f7a34', tipo: 'arvore' });
}
/* o banco de praça: o assento e o encosto de ripa nos pés de ferro */
function banco(C, x0, x1, z, dir, marcas) {
  const zs = z, zc = z - dir * 0.42, zb = z - dir * 0.47;
  const [a, b] = dir > 0 ? [zc, zs] : [zs, zc];
  C.caixa(x0, x1, 0.42, 0.47, a, b, { todas: lisa('#5a3d22'), topo: { k: 'ripas', modo: 'esticar' } });
  const [c, d] = dir > 0 ? [zb, zc] : [zc, zb];
  C.caixa(x0, x1, 0.5, 0.92, c, d, { todas: lisa('#5a3d22'), frente: { k: 'ripas', modo: 'esticar' }, tras: { k: 'ripas', modo: 'esticar' } });
  for (const px of [x0 + 0.12, x1 - 0.16])
    C.caixa(px, px + 0.05, 0, 0.9, Math.min(a, c), Math.max(b, d), { todas: lisa(PRETO) });
  if (marcas) marcas.push({ x0, x1, z0: Math.min(a, c), z1: Math.max(b, d), cor: '#8f5d33', tipo: 'movel' });
}
/* o poste de praça: o fuste verde-escuro e a lanterna de globo branco */
function postePraca(C, x, z) {
  cilindro(C, x, z, 0, 0.5, 0.14, VERDE_PRACA, 8);
  cilindro(C, x, z, 0.5, 3.7, 0.06, VERDE_PRACA, 8);
  C.pintar(VERDE_PRACA); C.torno(x, z, [[0.06, 3.7], [0.22, 3.78], [0.24, 3.84], [0.05, 3.9]], 8, 'lisa'); C.pintar(null);
  C.pintar('#fbf6e0'); C.torno(x, z, [[0.05, 3.84], [0.2, 3.95], [0.22, 4.12], [0.15, 4.28], [0.01, 4.32]], 10, 'lisa'); C.pintar(null);
}
function lixeira(C, x, z) {
  cilindro(C, x, z, 0, 0.08, 0.2, PRETO, 8);
  cilindro(C, x, z, 0.08, 0.8, 0.22, '#2f6b3f', 10);
  cilindro(C, x, z, 0.8, 0.86, 0.24, '#23532f', 10);
}
/* o canteiro: a guia de concreto em volta e a grama por dentro */
function canteiro(C, x0, x1, z0, z1, marcas, k = 'grama') {
  C.tampa([[x0, z1], [x1, z1], [x1, z0], [x0, z0]], 0.14, k, false);
  const e = 0.12;
  for (const [a0, a1, b0, b1] of [[x0 - e, x1 + e, z0 - e, z0], [x0 - e, x1 + e, z1, z1 + e], [x0 - e, x0, z0, z1], [x1, x1 + e, z0, z1]])
    C.caixa(a0, a1, 0, 0.2, b0, b1, { todas: 'concreto_claro', base: null });
  if (marcas) marcas.push({ x0, x1, z0, z1, cor: k === 'grama' ? '#6f9a55' : k === 'areia' ? '#d8c393' : '#b3523a', tipo: 'grama' });
}

/* =======================================================
   O SHOPPING POENTE
   ======================================================= */
/* `spec`: { area (o miolo da quadra), frente, nome } */
export function montarShopping(spec, destino = {}, opc = {}) {
  const E = eixosDoEquip(spec.area, spec.frente);
  const L = E.L / M, A = E.A / M;
  const B = Construtor('equip'), V = Construtor('equip');
  const placas = [], marcas = [];
  /* o prédio: da praça (5 m na ponta esquerda) até a ponta redonda */
  const xa = 5.2, zf = -0.9, zt = -A + 0.6, R = (zf - zt) / 2, zc = (zf + zt) / 2, xr = L - 0.4 - R;
  const ANDARES = [[0, 4.5, 'cortina_terreo'], [4.5, 8.7, 'cortina'], [8.7, 12.9, 'cortina']];
  const H3 = 12.9, recuo = 1.3, H4 = H3 + 3.4;

  /* o chão: o granito da praça em volta de tudo */
  B.tampa([[0, 0], [L, 0], [L, -A], [0, -A]], 0.08, 'granito', false);
  marcas.push({ x0: 0, x1: L, z0: -A, z1: 0, cor: '#c9c6bf', tipo: 'piso' });

  /* O CONTORNO DO PRÉDIO em planta, no sentido de sempre (frente-esquerda
     → frente-direita → a volta da ponta → fundo): a reta da frente, o
     meio círculo e a reta do fundo, fechando na parede cega */
  const contorno = (d) => {
    const pts = [[xa + d, zf - d], [xr, zf - d]];
    const N = 12;
    for (let i = 1; i < N; i++) { const t = Math.PI / 2 - Math.PI * i / N; pts.push([xr + (R - d) * Math.cos(t), zc + (R - d) * Math.sin(t)]); }
    pts.push([xr, zt + d], [xa + d, zt + d]);
    return pts;
  };
  const planta = contorno(0);
  /* as fachadas, andar por andar: cada lado vira módulos de 1,5 m de
     cortina; a parede da ponta esquerda (a da praça) é de painel cinza,
     com a faixa vertical de vidro */
  for (const [y0, y1, k] of ANDARES) {
    B.paredes(planta, y0, (F, len, i) => {
      if (i === planta.length - 1) {                                 // a parede cega da praça
        B.ladrilhar(F, B.ret(0, len, 0, y1 - y0), 'acm');
        B.esticar(B.recuado(F, -0.02), len / 2 - 0.75, len / 2 + 0.75, 0.6, y1 - y0 - 0.4, k === 'cortina_terreo' ? 'cortina' : k, { parte: [0, 1, 0, 1] });
        return;
      }
      const n = Math.max(1, Math.round(len / 1.5));
      B.modulos(F, 0, len, 0, y1 - y0, n, 1, () => k);
    });
  }
  /* a cornija escura em cima do 3º andar, saindo 30 cm */
  const aba = contorno(-0.3);
  B.paredes(aba, H3, (F, len) => B.ladrilhar(F, B.ret(0, len, 0, 0.5), 'acm_escuro'));
  B.tampa(aba, H3 + 0.5, 'membrana', false);
  B.tampa(aba, H3, 'acm_escuro', true);
  marcas.push({ x0: xa, x1: L - 0.4, z0: zt, z1: zf, cor: '#8f8b83', tipo: 'teto' });
  /* O ÚLTIMO ANDAR, recuado, de vidro inclinado pra fora como o da foto:
     o pé 30 cm pra dentro do alto */
  const topo = contorno(recuo), topo2 = contorno(recuo - 0.35);
  for (let i = 0; i < topo.length - 1; i++) {
    const [ax, az] = topo[i], [bx, bz] = topo[i + 1], [cx, cz] = topo2[i + 1], [dx, dz] = topo2[i];
    const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / 1.5));
    for (let k2 = 0; k2 < n; k2++) {
      const t0 = k2 / n, t1 = (k2 + 1) / n;
      const P = [[lerp(ax, bx, t0), H3 + 0.5, lerp(az, bz, t0)], [lerp(ax, bx, t1), H3 + 0.5, lerp(az, bz, t1)],
                 [lerp(dx, cx, t1), H4, lerp(dz, cz, t1)], [lerp(dx, cx, t0), H4, lerp(dz, cz, t0)]];
      const c = B.cel('cortina_topo');
      B.poli(P, [[c[0], c[1]], [c[2], c[1]], [c[2], c[3]], [c[0], c[3]]]);
    }
  }
  const [lx, lz] = topo[topo.length - 1], [fx, fz] = topo[0], [lx2, lz2] = topo2[topo2.length - 1], [fx2, fz2] = topo2[0];
  B.poli([[lx, H3 + 0.5, lz], [fx, H3 + 0.5, fz], [fx2, H4, fz2], [lx2, H4, lz2]], (() => { const c = B.cel('acm'); return [[c[0], c[1]], [c[2], c[1]], [c[2], c[3]], [c[0], c[3]]]; })());
  B.tampa(topo2, H4, 'membrana', false);
  B.paredes(contorno(recuo - 0.45), H4, (F, len) => B.ladrilhar(F, B.ret(0, len, 0, 0.35), 'acm'));

  /* A ENTRADA: as portas de correr, a marquise de vidro em dois pilares
     e o nome do shopping na faixa da cornija */
  const e0 = xa + 3.0, e1 = e0 + 4.0;
  B.esticar(B.plano([e0, 0, zf + 0.02], [1, 0, 0], [0, 1, 0]), 0, 4.0, 0, 3.0, 'porta_shop');
  const mq = { x0: e0 - 0.8, x1: e1 + 0.8, z0: zf, z1: zf + 2.6, y: 4.1 };
  B.caixa(mq.x0, mq.x1, mq.y, mq.y + 0.12, mq.z0, mq.z1, { todas: lisa('#9aa3a6'), topo: null, base: null });
  V.poli([[mq.x0, mq.y + 0.12, mq.z1], [mq.x1, mq.y + 0.12, mq.z1], [mq.x1, mq.y + 0.12, mq.z0], [mq.x0, mq.y + 0.12, mq.z0]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  for (let x = mq.x0; x <= mq.x1 + 0.01; x += (mq.x1 - mq.x0) / 4) barra(B, [x, mq.y + 0.06, mq.z0], [x, mq.y + 0.06, mq.z1], 0.08, 'lisa', '#9aa3a6');
  for (const x of [mq.x0 + 0.2, mq.x1 - 0.2]) barra(B, [x, 0, mq.z1 - 0.15], [x, mq.y, mq.z1 - 0.15], 0.14, 'lisa', '#c7cbcc');
  placa(placas, 'letreiro', (spec.nome || 'SHOPPING').toUpperCase(), '#3d4347', '#ffffff', (xa + xr) / 2, H3 + 0.25, zf + 0.31, 0, 1, 8.5, 0.46);
  placa(placas, 'letreiro', 'ENTRADA', '#1d7a4a', '#ffffff', (e0 + e1) / 2, 3.3, zf + 0.05, 0, 1, 2.2, 0.4);
  /* o logo redondo na ponta, lá em cima */
  placa(placas, 'logo', 'P', VERMELHO, '#ffffff', xr + R + 0.33, H3 + 1.9, zc, 1, 0, 2.2, 2.2);
  B.caixa(xr + R - 0.1, xr + R + 0.3, H3 + 0.5, H3 + 3.2, zc - 0.15, zc + 0.15, { todas: lisa(GRAFITE) });

  /* O TETO: a casa de máquinas com a cobertura em meia-lua de alumínio,
     as condensadoras, a claraboia em pirâmide e os exaustores */
  const cmx0 = xa + 3.0, cmx1 = cmx0 + 5.0, cmz0 = zt + recuo + 2.0, cmz1 = cmz0 + 3.2;
  B.caixa(cmx0, cmx1, H4, H4 + 1.6, cmz0, cmz1, { todas: 'acm', base: null, topo: null });
  const rr = (cmz1 - cmz0) / 2, zm = (cmz0 + cmz1) / 2, N = 8;
  for (let i = 0; i < N; i++) {
    const t0 = Math.PI * i / N, t1 = Math.PI * (i + 1) / N;
    const p = (x, t) => [x, H4 + 1.6 + rr * 0.55 * Math.sin(t), zm + rr * Math.cos(t)];
    const c = B.cel('acm');
    B.pintar('#dfe3e5');
    B.poli([p(cmx0, t0), p(cmx1, t0), p(cmx1, t1), p(cmx0, t1)], [[c[0], c[1]], [c[2], c[1]], [c[2], c[3]], [c[0], c[3]]]);
    B.pintar(null);
  }
  for (const x of [cmx0, cmx1]) {
    const pts = [];
    for (let i = 0; i <= N; i++) { const t = Math.PI * i / N; pts.push([x, H4 + 1.6 + rr * 0.55 * Math.sin(t), zm + rr * Math.cos(t)]); }
    const c = B.cel('acm');
    for (let i = 1; i < pts.length - 1; i++) B.tri(pts[0], pts[i], pts[i + 1], [c[0], c[1]], [c[2], c[1]], [c[2], c[3]]);
  }
  marcas.push({ x0: cmx0, x1: cmx1, z0: cmz0, z1: cmz1, cor: '#d6dadc', tipo: 'movel' });
  for (let i = 0; i < 3; i++) {
    const x = cmx1 + 1.2 + i * 2.2, z = zf - recuo - 1.8;
    B.caixa(x, x + 1.8, H4, H4 + 1.2, z - 1.0, z, { todas: lisa('#c9cdce'), topo: lisa('#6b7174') });
    for (const dx of [0.45, 1.35]) cilindro(B, x + dx, z - 0.5, H4 + 1.2, H4 + 1.25, 0.36, '#3c4044', 12);
    marcas.push({ x0: x, x1: x + 1.8, z0: z - 1.0, z1: z, cor: '#c9cdce', tipo: 'movel' });
  }
  const px = xr - 1.2, pz = zc, ph = 1.3, pw = 1.6;
  const pir = [[px - pw, H4, pz - pw], [px + pw, H4, pz - pw], [px + pw, H4, pz + pw], [px - pw, H4, pz + pw]];
  for (let i = 0; i < 4; i++) V.poli([pir[i], pir[(i + 1) % 4], [px, H4 + ph, pz]], [[0, 0], [1, 0], [0.5, 1]]);
  for (const p of pir) barra(B, p, [px, H4 + ph, pz], 0.06, 'lisa', '#9aa3a6');
  marcas.push({ x0: px - pw, x1: px + pw, z0: pz - pw, z1: pz + pw, cor: '#a9c2ca', tipo: 'movel' });
  for (const [x, z] of [[xa + 1.5, zt + recuo + 1.2], [xa + 1.5, zf - recuo - 1.4], [xr - 4.2, zt + recuo + 1.0]]) {
    cilindro(B, x, z, H4, H4 + 0.9, 0.3, '#b9bdc0', 10);
    cilindro(B, x, z, H4 + 0.9, H4 + 1.05, 0.42, '#8d9295', 10);
  }
  barra(B, [cmx0 + 0.4, H4 + 2.4, cmz0 + 0.4], [cmx0 + 0.4, H4 + 5.6, cmz0 + 0.4], 0.07, 'lisa', '#9aa3a6');
  for (let k2 = 0; k2 < 3; k2++) barra(B, [cmx0 + 0.4, H4 + 3.6 + k2 * 0.7, cmz0 + 0.4], [cmx0 + 1.1, H4 + 3.6 + k2 * 0.7, cmz0 + 0.4], 0.05, 'lisa', '#9aa3a6');

  /* A PRAÇA DA FRENTE: o totem, as duas árvores no vaso, os bancos, o
     bicicletário e os balizadores */
  const tx = 2.4, tz = -3.2;
  B.caixa(tx - 0.8, tx + 0.8, 0, 8.0, tz - 0.35, tz + 0.35, { todas: 'acm_escuro' });
  B.caixa(tx - 0.3, tx + 0.3, 1.2, 6.6, tz + 0.35, tz + 0.37, { todas: lisa(VERMELHO) });
  B.caixa(tx - 0.3, tx + 0.3, 1.2, 6.6, tz - 0.37, tz - 0.35, { todas: lisa(VERMELHO) });
  B.caixa(tx - 0.95, tx + 0.95, 8.0, 9.5, tz - 0.5, tz + 0.5, { todas: lisa(BRANCO) });
  B.caixa(tx - 0.9, tx + 0.9, 0, 0.4, tz - 0.5, tz + 0.5, { todas: 'concreto' });
  for (const s of [1, -1]) placa(placas, 'totem', (spec.nome || 'SHOPPING').replace(/^Shopping /i, '').toUpperCase(), BRANCO, VERMELHO,
                                 tx, 8.75, tz + s * 0.505, 0, s, 1.8, 0.6);
  marcas.push({ x0: tx - 0.95, x1: tx + 0.95, z0: tz - 0.5, z1: tz + 0.5, cor: VERMELHO, tipo: 'movel' });
  for (const [x, z] of [[1.3, -8.0], [3.6, -10.8]]) {
    B.caixa(x - 0.8, x + 0.8, 0, 0.5, z - 0.8, z + 0.8, { todas: 'concreto_claro' });
    B.tampa([[x - 0.7, z + 0.7], [x + 0.7, z + 0.7], [x + 0.7, z - 0.7], [x - 0.7, z - 0.7]], 0.46, 'grama', false);
    arvore(B, x, z, 5.4, 1.7, false, marcas);
  }
  banco(B, 0.4, 2.2, -5.3, -1, marcas);
  banco(B, 3.0, 4.8, -6.4, 1, marcas);
  for (let i = 0; i < 4; i++) {
    const x = 0.6 + i * 0.55;
    barra(B, [x, 0, -11.7], [x, 0.8, -11.7], 0.05, 'lisa', '#9aa3a6');
    barra(B, [x, 0.8, -11.7], [x, 0.8, -11.2], 0.05, 'lisa', '#9aa3a6');
    barra(B, [x, 0, -11.2], [x, 0.8, -11.2], 0.05, 'lisa', '#9aa3a6');
  }
  for (let x = xa + 0.6; x < xr; x += 2.6) cilindro(B, x, zf + 0.55, 0, 0.9, 0.1, '#6f7477', 8);
  lixeira(B, 4.4, -1.2);

  const r = fechar(E, { equip: B, vidros: V }, destino, placas, marcas);
  return { ...r, altura: H4 + 3.4 };
}

/* =======================================================
   O 2º DISTRITO POLICIAL
   ======================================================= */
/* a viatura da Polícia Civil: a caixa preta com a faixa, a cabine, as
   rodas e o giroflex; `dir` +1 com a frente pra x+ */
function viatura(C, x, z, dir, marcas) {
  const L = 4.6, W = 1.8, h = L / 2;
  const x0 = x - h, x1 = x + h;
  /* o nome lê certo dos dois lados (a peça nunca espelha): o lado em que
     a frente fica à direita de quem olha usa a célula invertida, com o
     farol do outro lado e o nome escrito certo */
  const lado = (zz, U) => C.esticar(C.plano([U > 0 ? x0 : x1, 0.2, zz], [U, 0, 0], [0, 1, 0]), 0, L, 0, 1.3,
                                    (U > 0) === (dir > 0) ? 'viatura_lado_i' : 'viatura_lado', { parte: [0, 1, 0.13, 1] });
  lado(z + W / 2, 1);
  lado(z - W / 2, -1);
  const fr = dir > 0 ? [x1, 'viatura_frente', x0, 'viatura_tras'] : [x0, 'viatura_frente', x1, 'viatura_tras'];
  for (const [xx, k] of [[fr[0], fr[1]], [fr[2], fr[3]]]) {
    const olha = xx > x ? 1 : -1;
    C.esticar(olha > 0 ? C.plano([xx, 0.2, z + W / 2], [0, 0, -1], [0, 1, 0]) : C.plano([xx, 0.2, z - W / 2], [0, 0, 1], [0, 1, 0]), 0, W, 0, 1.3, k, { parte: [0, 1, 0.13, 1] });
  }
  /* o capô e a tampa do porta-malas (pretos) e o teto da cabine */
  C.tampa([[x0, z + W / 2], [x1, z + W / 2], [x1, z - W / 2], [x0, z - W / 2]], 1.02, 'lisa', false, { tinta: '#1c1e21' });
  const c0 = x + dir * -0.7, c1 = x + dir * 1.25;
  C.caixa(Math.min(c0, c1), Math.max(c0, c1), 1.02, 1.5, z - W / 2 + 0.12, z + W / 2 - 0.12, { todas: lisa('#0d1014'), topo: lisa('#1c1e21') });
  /* o giroflex: a barra de luz vermelha e azul */
  const gx = x + dir * 0.35;
  C.caixa(gx - 0.18, gx + 0.18, 1.5, 1.6, z - 0.55, z, { todas: lisa('#d42a2a') });
  C.caixa(gx - 0.18, gx + 0.18, 1.5, 1.6, z, z + 0.55, { todas: lisa('#2a52d4') });
  for (const dx of [-1.45, 1.4]) for (const s of [-1, 1])
    C.caixa(x + dx - 0.33, x + dx + 0.33, 0, 0.66, z + s * (W / 2 - 0.02) - 0.12, z + s * (W / 2 - 0.02) + 0.12, { todas: lisa('#141414'), frente: lisa('#2c2c2c'), tras: lisa('#2c2c2c') });
  if (marcas) marcas.push({ x0, x1, z0: z - W / 2, z1: z + W / 2, cor: '#1c1e21', tipo: 'movel' });
}
export function montarDelegacia(spec, destino = {}, opc = {}) {
  const E = eixosDoEquip(spec.area, spec.frente);
  const L = E.L / M, A = E.A / M;
  const B = Construtor('equip'), G = Construtor('grades'), V = Construtor('equip');
  const placas = [], marcas = [];
  /* o prédio de dois andares, com a ala baixa de cada lado */
  const bx0 = 3.2, bx1 = 20.4, bz0 = -A + 0.8, bz1 = -2.8;
  const H1 = 3.8, H2 = 7.2, HP = 8.1;
  B.tampa([[0, 0], [L, 0], [L, -A], [0, -A]], 0.08, 'concreto_claro', false);
  marcas.push({ x0: 0, x1: L, z0: -A, z1: 0, cor: '#cfcabe', tipo: 'piso' });
  /* as fachadas: a da frente com a porta e as janelas em fita, as outras
     com janela a cada módulo; a pastilha até o alto e a platibanda azul */
  const vaosFrente = (andar) => {
    const v = [];
    const larg = bx1 - bx0;
    if (andar === 0) {
      for (const a of [0.8, 2.6, 4.4]) v.push({ a0: a, a1: a + 1.6, b0: 0.95, b1: 2.25, k: 'janela_pol' });
      v.push({ a0: 7.9, a1: 10.1, b0: 0, b1: 2.6, k: 'porta_pol' });
      for (const a of [11.4, 13.2, 15.0]) v.push({ a0: a, a1: a + 1.6, b0: 0.95, b1: 2.25, k: 'janela_pol' });
    } else {
      for (const a of [0.8, 2.4, 4.0, 5.6]) v.push({ a0: a, a1: a + 1.6, b0: 0.9, b1: 2.2, k: 'janela_pol' });
      for (const a of [10.2, 11.8, 13.4, 15.0]) v.push({ a0: a, a1: a + 1.6, b0: 0.9, b1: 2.2, k: 'janela_pol' });
    }
    return v.filter(x => x.a1 <= larg - 0.3);
  };
  const vaosLado = (larg, andar) => {
    const v = [], n = Math.floor((larg - 0.8) / 2.6);
    for (let i = 0; i < n; i++) { const a = 0.9 + i * 2.6; v.push({ a0: a, a1: a + 1.6, b0: andar ? 0.9 : 0.95, b1: andar ? 2.2 : 2.25, k: 'janela_pol' }); }
    return v;
  };
  const planta = [[bx0, bz1], [bx1, bz1], [bx1, bz0], [bx0, bz0]];
  for (const [y0, y1, andar] of [[0, H1, 0], [H1, H2, 1]]) {
    B.paredes(planta, y0, (F, len, i) => {
      const vaos = i === 0 ? vaosFrente(andar) : vaosLado(len, andar);
      B.fachada(F, len, y1 - y0, 'pastilha', vaos.map(v => ({ ...v, fundo: 0.12 })));
    });
  }
  B.paredes(planta, H2, (F, len) => B.ladrilhar(F, B.ret(0, len, 0, HP - H2), 'azul_pol'));
  /* a mureta da platibanda por dentro (vista de cima) */
  const dentro = [[bx0 + 0.25, bz1 - 0.25], [bx1 - 0.25, bz1 - 0.25], [bx1 - 0.25, bz0 + 0.25], [bx0 + 0.25, bz0 + 0.25]];
  B.tampa(dentro, HP - 0.7, 'concreto', false);
  marcas.push({ x0: bx0, x1: bx1, z0: bz0, z1: bz1, cor: '#8c8a84', tipo: 'teto' });
  /* O VOLUME AZUL DE CIMA, com a janela em fita */
  const ux0 = bx0 + 5.5, ux1 = bx1 - 4.0, uz0 = bz0 + 2.2, uz1 = bz1 - 2.0, HU = HP - 0.7 + 2.9;
  const up = [[ux0, uz1], [ux1, uz1], [ux1, uz0], [ux0, uz0]];
  B.paredes(up, HP - 0.7, (F, len, i) => {
    const v = i % 2 === 0 ? [{ a0: 0.8, a1: len - 0.8, b0: 1.1, b1: 2.2, k: 'janela_pol', modo: 'ladrilho', tw: 1.6, th: 1.1 }] : [];
    B.fachada(F, len, HU - (HP - 0.7), 'azul_pol', v);
  });
  B.tampa(up, HU, 'concreto', false);
  marcas.push({ x0: ux0, x1: ux1, z0: uz0, z1: uz1, cor: '#2a4a8c', tipo: 'movel' });
  /* as alas baixas: o arquivo à esquerda e a garagem à direita */
  for (const [a0, a1] of [[0.6, bx0], [bx1, bx1 + 3.0]]) {
    const pl = [[a0, bz1 + 0.6], [a1, bz1 + 0.6], [a1, bz0 + 1.2], [a0, bz0 + 1.2]];
    B.paredes(pl, 0, (F, len, i) => B.fachada(F, len, H1 - 0.4, 'pastilha', i === 0 && a0 > 5 ? [{ a0: 0.4, a1: len - 0.4, b0: 0, b1: 2.6, k: 'porta_pol', fundo: 0.1 }] :
                                                                     i === 0 ? [{ a0: 0.5, a1: 2.1, b0: 1.0, b1: 2.3, k: 'janela_pol', fundo: 0.1 }] : []));
    if (a0 > 5) placa(placas, 'letreiro', 'PLANTÃO 24 H', '#1f3a74', '#ffffff', (a0 + a1) / 2, 2.95, bz1 + 0.62, 0, 1, 2.4, 0.34);
    B.paredes(pl, H1 - 0.4, (F, len) => B.ladrilhar(F, B.ret(0, len, 0, 0.4), 'azul_pol'));
    B.tampa(pl, H1, 'concreto', false);
    marcas.push({ x0: a0, x1: a1, z0: bz0 + 1.2, z1: bz1 + 0.6, cor: '#8c8a84', tipo: 'teto' });
  }
  /* A MARQUISE BRANCA de friso vermelho, nos pilares finos, dobrando a
     quina da direita */
  const my = 3.35, mz0 = bz1, mz1 = -0.4, mx0 = bx0 - 0.3, mx1 = bx1 + 3.6;
  B.caixa(mx0, mx1, my, my + 0.28, mz0, mz1, { todas: lisa(BRANCO), base: lisa('#e3e3de') });
  B.caixa(mx0 - 0.02, mx1 + 0.02, my + 0.02, my + 0.16, mz1, mz1 + 0.03, { todas: lisa(VERMELHO) });
  for (const x of [mx0, mx1]) B.caixa(x - 0.03, x + 0.03, my + 0.02, my + 0.16, mz0, mz1, { todas: lisa(VERMELHO) });
  for (let x = mx0 + 0.6; x < mx1; x += 3.4) barra(B, [x, 0, mz1 - 0.3], [x, my, mz1 - 0.3], 0.16, 'lisa', BRANCO);
  marcas.push({ x0: mx0, x1: mx1, z0: mz0, z1: mz1, cor: '#eeeeea', tipo: 'teto' });
  placa(placas, 'letreiro', 'DELEGACIA DE POLÍCIA · ' + (spec.sigla || '2º DP'), '#f4f3ef', '#1f2a4a', (bx0 + bx1) / 2 + 1.5, my + 0.52, mz1 - 0.6, 0, 1, 8.8, 0.5);
  B.caixa((bx0 + bx1) / 2 + 1.5 - 4.5, (bx0 + bx1) / 2 + 1.5 + 4.5, my + 0.28, my + 0.8, mz1 - 0.66, mz1 - 0.6, { todas: lisa('#f4f3ef') });
  /* o brasão da Polícia Civil na fachada, do lado da bandeira */
  placa(placas, 'brasao', 'POLÍCIA CIVIL', '#1f3a74', '#f2d36b', bx1 - 1.7, H1 + 1.7, bz1 + 0.04, 0, 1, 1.5, 1.8);
  /* A BANDEIRA no mastro inclinado da fachada: o pano sai da ponta, ao
     longo da fachada, com a onda do vento */
  const bxp = bx1 - 7.4, byp = H1 + 1.3, tip = [bxp + 0.6, byp + 1.4, bz1 + 1.3];
  barra(B, [bxp, byp, bz1], tip, 0.05, 'lisa', '#c9cdce');
  B.caixa(tip[0] - 0.05, tip[0] + 0.05, tip[1], tip[1] + 0.1, tip[2] - 0.05, tip[2] + 0.05, { todas: lisa('#d4a93a') });
  const c = B.cel('bandeira_br'), NB = 5;
  const pano = i => { const t = i / NB; return [tip[0] + t * 1.5, tip[1] - 0.05, tip[2] + 0.15 * Math.sin(t * Math.PI * 1.6)]; };
  for (let i = 0; i < NB; i++) {
    const a = pano(i), b = pano(i + 1);
    B.poli([[a[0], a[1] - 1.05, a[2]], [b[0], b[1] - 1.05, b[2]], b, a],
           [[lerp(c[0], c[2], i / NB), c[1]], [lerp(c[0], c[2], (i + 1) / NB), c[1]], [lerp(c[0], c[2], (i + 1) / NB), c[3]], [lerp(c[0], c[2], i / NB), c[3]]]);
  }
  /* o teto: as condensadoras, os canos de respiro e as placas solares */
  for (let i = 0; i < 3; i++) {
    const x = bx0 + 1.0 + i * 1.3, z = bz0 + 1.2;
    B.caixa(x, x + 0.95, HP - 0.7, HP - 0.05, z, z + 0.4, { todas: lisa('#e6e6e1'), frente: lisa('#bfc3c5') });
    cilindro(B, x + 0.47, z + 0.41, HP - 0.45, HP - 0.3, 0.22, '#5b6064', 12);
  }
  for (const [x, z] of [[bx1 - 1.2, bz0 + 1.0], [bx1 - 1.9, bz0 + 1.0], [bx0 + 4.8, bz1 - 1.1]]) cilindro(B, x, z, HP - 0.7, HP + 0.2, 0.07, '#9aa0a4', 8);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
    const x = ux1 + 0.6 + i * 1.05, z = uz0 + 0.4 + j * 1.9;
    if (x + 1.0 > bx1 - 0.4) continue;
    const y0 = HP - 0.6, dy = 0.5;
    B.poli([[x, y0, z + 1.65], [x + 1.0, y0, z + 1.65], [x + 1.0, y0 + dy, z], [x, y0 + dy, z]],
           (() => { const cc = B.cel('solar'); return [[cc[0], cc[1]], [cc[2], cc[1]], [cc[2], cc[3]], [cc[0], cc[3]]]; })());
    marcas.push({ x0: x, x1: x + 1.0, z0: z, z1: z + 1.65, cor: '#1d2c4d', tipo: 'movel' });
  }
  /* O PÁTIO DAS VIATURAS: a cerca de grade, o portão de correr, a guarita
     e as três viaturas no concreto */
  const px0 = bx1 + 3.2, px1 = L - 0.3, pz0 = -A + 0.4, pz1 = -0.4;
  B.tampa([[px0, pz1], [px1, pz1], [px1, pz0], [px0, pz0]], 0.09, 'concreto', false);
  marcas.push({ x0: px0, x1: px1, z0: pz0, z1: pz1, cor: '#b3aea3', tipo: 'grama' });
  const cerca = (p, q, porta) => {
    const U = unit(sub([q[0], 0, q[1]], [p[0], 0, p[1]])), len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const F = G.plano([p[0], 0.3, p[1]], U, [0, 1, 0]);
    G.ladrilhar(F, G.ret(0, porta ? len * 0.35 : len, 0, 1.9), 'gradil');
    B.caixa(Math.min(p[0], q[0]) - 0.1, Math.max(p[0], q[0]) + 0.1, 0, 0.3, Math.min(p[1], q[1]) - 0.1, Math.max(p[1], q[1]) + 0.1, { todas: 'pastilha' });
    for (const t of [0, 1]) { const x = lerp(p[0], q[0], t), z = lerp(p[1], q[1], t); B.caixa(x - 0.15, x + 0.15, 0, 2.3, z - 0.15, z + 0.15, { todas: 'pastilha', topo: lisa('#2a4a8c') }); }
  };
  cerca([px0, pz1], [px1, pz1], true);
  cerca([px1, pz1], [px1, pz0], false);
  cerca([px1, pz0], [px0, pz0], false);
  /* o portão de correr aberto, recolhido atrás do trecho de grade */
  G.ladrilhar(G.plano([px0 + 0.3, 0.1, pz1 - 0.12], [1, 0, 0], [0, 1, 0]), G.ret(0, (px1 - px0) * 0.4, 0, 2.0), 'preta');
  /* a guarita, na quina do portão */
  const gx0 = px1 - 2.2, gx1 = px1 - 0.4, gz0 = pz1 - 2.4, gz1 = pz1 - 0.6;
  B.caixa(gx0, gx1, 0, 2.6, gz0, gz1, { todas: 'pastilha', topo: lisa('#2a4a8c') });
  B.esticar(B.plano([gx0 + 0.2, 1.0, gz1 + 0.005], [1, 0, 0], [0, 1, 0]), 0, 1.4, 0, 1.2, 'janela_pol');
  B.caixa(gx0 - 0.2, gx1 + 0.2, 2.6, 2.75, gz0 - 0.2, gz1 + 0.2, { todas: lisa(BRANCO) });
  marcas.push({ x0: gx0, x1: gx1, z0: gz0, z1: gz1, cor: '#d6ccb2', tipo: 'movel' });
  viatura(B, px0 + 3.0, -A + 2.3, 1, marcas);
  viatura(B, px0 + 3.0, -A + 4.6, 1, marcas);
  viatura(B, px0 + 3.0, -A + 6.9, -1, marcas);
  /* na calçada da frente, os balizadores e a lixeira */
  for (let x = bx0 + 0.6; x < bx1; x += 2.2) cilindro(B, x, -0.15, 0, 0.8, 0.09, '#2a4a8c', 8);
  lixeira(B, bx0 - 1.2, -1.2);
  arvore(B, 1.6, -1.6, 5.2, 1.6, false, marcas);

  return fechar(E, { equip: B, grades: G, vidros: V }, destino, placas, marcas);
}

/* =======================================================
   A PRAÇA DA VILA
   ======================================================= */
/* o escorregador: a torre com o telhadinho, a escada e a rampa amarela */
function escorregador(C, x, z, marcas) {
  const h = 1.5, t = 1.1;
  for (const [dx, dz] of [[0, 0], [t, 0], [t, t], [0, t]]) barra(C, [x + dx, 0, z + dz], [x + dx, h + 1.4, z + dz], 0.09, 'lisa', '#1f5aa8');
  C.caixa(x, x + t, h, h + 0.08, z, z + t, { todas: lisa('#d96a1f') });
  C.pintar('#c8342b');
  for (const [a, b] of [[[x + t + 0.1, h + 1.4, z - 0.1], [x + t + 0.1, h + 1.4, z + t + 0.1]], [[x + t + 0.1, h + 1.4, z + t + 0.1], [x - 0.1, h + 1.4, z + t + 0.1]], [[x - 0.1, h + 1.4, z + t + 0.1], [x - 0.1, h + 1.4, z - 0.1]], [[x - 0.1, h + 1.4, z - 0.1], [x + t + 0.1, h + 1.4, z - 0.1]]]) {
    const c = C.cel('lisa');
    C.tri(a, b, [x + t / 2, h + 2.0, z + t / 2], [c[0], c[1]], [c[2], c[1]], [c[2], c[3]]);
  }
  C.pintar(null);
  /* a escada de um lado, a rampa do outro */
  for (let k = 0; k < 5; k++) C.caixa(x - 0.5 + k * 0.1, x - 0.4 + k * 0.1, 0, 0.05 + k * 0.3, z + 0.25, z + t - 0.25, { todas: lisa('#1f5aa8') });
  const r0 = [x + t, h, z + 0.3], r1 = [x + t + 2.6, 0.25, z + 0.3];
  C.pintar('#e8b320');
  const c = C.cel('lisa');
  C.poli([[r0[0], r0[1], z + 0.3], [r1[0], r1[1], z + 0.3], [r1[0], r1[1], z + 0.8], [r0[0], r0[1], z + 0.8]], [[c[0], c[1]], [c[2], c[1]], [c[2], c[3]], [c[0], c[3]]]);
  C.pintar(null);
  for (const zz of [z + 0.27, z + 0.83]) barra(C, [r0[0], r0[1] + 0.2, zz], [r1[0], r1[1] + 0.2, zz], 0.05, 'lisa', '#e8b320');
  if (marcas) marcas.push({ x0: x - 0.5, x1: x + t + 2.6, z0: z, z1: z + t, cor: '#d96a1f', tipo: 'movel' });
}
/* o balanço: o pórtico em A dos dois lados, a trave e dois assentos */
function balanco(C, x, z, marcas) {
  const w = 3.2, h = 2.4;
  for (const xx of [x, x + w]) {
    barra(C, [xx, 0, z - 0.8], [xx, h, z], 0.1, 'lisa', '#1d7a4a');
    barra(C, [xx, 0, z + 0.8], [xx, h, z], 0.1, 'lisa', '#1d7a4a');
  }
  barra(C, [x, h, z], [x + w, h, z], 0.1, 'lisa', '#1d7a4a');
  for (const xs of [x + 0.9, x + 2.3]) {
    for (const d of [-0.22, 0.22]) barra(C, [xs + d, h, z], [xs + d, 0.5, z + 0.05], 0.025, 'lisa', '#8d9295');
    C.caixa(xs - 0.26, xs + 0.26, 0.45, 0.52, z - 0.12, z + 0.2, { todas: lisa('#c8342b') });
  }
  if (marcas) marcas.push({ x0: x, x1: x + w, z0: z - 0.8, z1: z + 0.8, cor: '#1d7a4a', tipo: 'movel' });
}
function gangorra(C, x, z, marcas) {
  C.caixa(x - 0.12, x + 0.12, 0, 0.45, z - 0.2, z + 0.2, { todas: lisa('#1f5aa8') });
  const p = [x - 1.6, 0.18, z], q = [x + 1.6, 0.72, z];
  barra(C, p, q, 0.22, 'lisa', '#e0a52a');
  for (const [xx, yy] of [[x - 1.4, 0.3], [x + 1.4, 0.8]]) barra(C, [xx, yy, z - 0.2], [xx, yy + 0.3, z - 0.2], 0.04, 'lisa', '#c8342b');
  if (marcas) marcas.push({ x0: x - 1.6, x1: x + 1.6, z0: z - 0.2, z1: z + 0.2, cor: '#e0a52a', tipo: 'movel' });
}
/* a academia ao ar livre: quatro aparelhos de tubo pintado */
function academia(C, x, z, marcas) {
  const cores = ['#1d7a4a', '#e0a52a', '#1f5aa8', '#1d7a4a'];
  const ap = [
    /* o simulador de caminhada: o poste com o guidão e os dois pêndulos */
    (x0) => { barra(C, [x0, 0, z], [x0, 1.5, z], 0.12, 'lisa', cores[0]); barra(C, [x0 - 0.3, 1.4, z], [x0 + 0.3, 1.4, z], 0.06, 'lisa', cores[1]);
              for (const d of [-0.2, 0.2]) { barra(C, [x0 + d, 1.3, z], [x0 + d, 0.25, z + 0.25], 0.05, 'lisa', cores[1]); C.caixa(x0 + d - 0.12, x0 + d + 0.12, 0.2, 0.26, z + 0.15, z + 0.45, { todas: lisa(PRETO) }); } },
    /* a remada */
    (x0) => { barra(C, [x0, 0, z - 0.4], [x0, 1.2, z - 0.4], 0.12, 'lisa', cores[2]); barra(C, [x0, 0.45, z - 0.4], [x0, 0.45, z + 0.6], 0.08, 'lisa', cores[2]);
              C.caixa(x0 - 0.22, x0 + 0.22, 0.45, 0.52, z + 0.2, z + 0.6, { todas: lisa(PRETO) }); barra(C, [x0 - 0.35, 1.05, z - 0.3], [x0 + 0.35, 1.05, z - 0.3], 0.05, 'lisa', cores[1]); },
    /* a roda de ombro no poste */
    (x0) => { barra(C, [x0, 0, z], [x0, 1.6, z], 0.12, 'lisa', cores[3]); C.pintar(cores[1]);
              C.torno(x0, z + 0.14, [[0.001, 1.25], [0.5, 1.25], [0.5, 1.3], [0.001, 1.3]].map(([r, y]) => [r, y]), 12, 'lisa'); C.pintar(null); },
    /* o surf: a base e a prancha */
    (x0) => { barra(C, [x0, 0, z], [x0, 1.3, z], 0.1, 'lisa', cores[0]); barra(C, [x0 - 0.35, 1.25, z], [x0 + 0.35, 1.25, z], 0.05, 'lisa', cores[1]);
              C.caixa(x0 - 0.35, x0 + 0.35, 0.3, 0.36, z + 0.1, z + 0.5, { todas: lisa(cores[2]) }); barra(C, [x0, 0, z + 0.3], [x0, 0.3, z + 0.3], 0.08, 'lisa', cores[0]); }
  ];
  ap.forEach((f, i) => f(x + i * 1.6));
  if (marcas) marcas.push({ x0: x - 0.5, x1: x + 3 * 1.6 + 0.5, z0: z - 0.5, z1: z + 0.7, cor: '#e0a52a', tipo: 'movel' });
}
/* a mesa de xadrez de granito e os quatro banquinhos */
function mesaXadrez(C, x, z, marcas) {
  C.pintar('#9a978f');
  C.torno(x, z, [[0.2, 0], [0.15, 0.7], [0.001, 0.7]], 10, 'lisa');
  C.pintar(null);
  C.caixa(x - 0.4, x + 0.4, 0.7, 0.78, z - 0.4, z + 0.4, { todas: lisa('#9a978f'), topo: { k: 'tabuleiro', modo: 'esticar' } });
  for (const [dx, dz] of [[-0.75, 0], [0.75, 0], [0, -0.75], [0, 0.75]]) {
    C.pintar('#9a978f');
    C.torno(x + dx, z + dz, [[0.16, 0], [0.12, 0.42], [0.2, 0.44], [0.001, 0.46]], 10, 'lisa');
    C.pintar(null);
  }
  if (marcas) marcas.push({ x0: x - 0.9, x1: x + 0.9, z0: z - 0.9, z1: z + 0.9, cor: '#9a978f', tipo: 'movel' });
}
/* a banca de jornal: a caixa verde, a frente com as revistas e o toldo */
function banca(C, x0, z0, marcas) {
  const w = 3.0, d = 2.0, h = 2.6;
  C.caixa(x0, x0 + w, 0, h, z0 - d, z0, { todas: lisa('#2e6b3f'), topo: lisa('#24532f'), frente: { k: 'banca', modo: 'esticar' } });
  C.caixa(x0 - 0.25, x0 + w + 0.25, h, h + 0.12, z0 - d - 0.2, z0 + 0.6, { todas: lisa('#24532f') });
  if (marcas) marcas.push({ x0, x1: x0 + w, z0: z0 - d, z1: z0, cor: '#2e6b3f', tipo: 'movel' });
}
export function montarPraca(spec, destino = {}, opc = {}) {
  const E = eixosDoEquip(spec.area, spec.frente || 's');
  const L = E.L / M, A = E.A / M;
  const B = Construtor('equip'), V = Construtor('equip');
  const placas = [], marcas = [];
  const zm = -A / 2, xm = L / 2;
  /* O CHÃO: a pedra portuguesa branca na volta (a calçada é da praça), a
     onda no calçadão do meio e na cruz, e os quatro canteiros */
  B.tampa([[0, 0], [L, 0], [L, -A], [0, -A]], 0.085, 'pedra_branca', false);
  B.tampa([[0, zm + 2.2], [L, zm + 2.2], [L, zm - 2.2], [0, zm - 2.2]], 0.09, 'pedra', false);
  B.tampa([[xm - 1.6, 0], [xm + 1.6, 0], [xm + 1.6, -A], [xm - 1.6, -A]], 0.091, 'pedra', false);
  marcas.push({ x0: 0, x1: L, z0: -A, z1: 0, cor: '#e5e1d6', tipo: 'piso' });
  marcas.push({ x0: 0, x1: L, z0: zm - 2.2, z1: zm + 2.2, cor: '#8f8c86', tipo: 'piso' });
  marcas.push({ x0: xm - 1.6, x1: xm + 1.6, z0: -A, z1: 0, cor: '#8f8c86', tipo: 'piso' });
  const m = 2.6;                                                      // a calçada em volta
  const q = {
    no: [m, xm - 1.6 - 0.8, zm + 2.2 + 0.8, -m],                      // noroeste (x0, x1, z0, z1): o parquinho
    ne: [xm + 1.6 + 0.8, L - m, zm + 2.2 + 0.8, -m],                  // nordeste: a academia
    so: [m, xm - 1.6 - 0.8, -A + m, zm - 2.2 - 0.8],                  // sudoeste: o xadrez e o gramado
    se: [xm + 1.6 + 0.8, L - m, -A + m, zm - 2.2 - 0.8]               // sudeste: o gramado, os ipês e a banca
  };
  /* o parquinho: a areia com a guia, e os brinquedos */
  const [p0, p1, p2, p3] = q.no;
  canteiro(B, p0, p1, p2, p3, marcas, 'areia');
  escorregador(B, p0 + 1.0, p3 - 2.4, marcas);
  balanco(B, p0 + 5.4, p3 - 1.6, marcas);
  gangorra(B, p0 + 10.9, (p2 + p3) / 2, marcas);
  /* a academia ao ar livre no emborrachado */
  const [a0, a1, a2, a3] = q.ne;
  canteiro(B, a0, a1, a2, a3, marcas, 'emborrachado');
  academia(B, a0 + 1.4, (a2 + a3) / 2 + 0.3, marcas);
  academia(B, a0 + 7.8, (a2 + a3) / 2 - 0.2, null);
  /* o gramado do sudoeste com as árvores e as mesas de xadrez no piso */
  const [s0, s1, s2, s3] = q.so;
  canteiro(B, s0, s0 + 4.2, s2, s3, marcas);
  canteiro(B, s1 - 3.4, s1, s2, s3, marcas);
  mesaXadrez(B, s0 + 6.0, (s2 + s3) / 2 + 0.5, marcas);
  mesaXadrez(B, s0 + 8.8, (s2 + s3) / 2 - 0.3, marcas);
  arvore(B, s0 + 1.8, (s2 + s3) / 2, 6.2, 2.2, false, marcas);
  arvore(B, s1 - 1.7, s2 + 1.4, 5.6, 1.9, true, marcas);
  /* o sudeste: o gramado, os dois ipês, a banca na quina */
  const [e0, e1, e2, e3] = q.se;
  canteiro(B, e0, e1 - 3.6, e2, e3, marcas);
  arvore(B, e0 + 2.0, e3 - 1.6, 6.0, 2.1, true, marcas);
  arvore(B, e0 + 6.8, e2 + 1.5, 6.4, 2.3, false, marcas);
  arvore(B, e1 - 5.8, e3 - 1.4, 5.4, 1.8, true, marcas);
  banca(B, e1 - 3.2, e3 + 0.1, marcas);
  /* O CHAFARIZ no cruzamento: a borda de pastilha, a água, o pé e o
     esguicho */
  const fx = xm, fz = zm, fr = 2.1;
  {
    const N = 20, c = B.cel('mosaico');
    const perfil = [[fr, 0.08], [fr, 0.55], [fr - 0.25, 0.6], [fr - 0.25, 0.3]];
    for (let i = 0; i < N; i++) {
      const t0 = i / N * Math.PI * 2, t1 = (i + 1) / N * Math.PI * 2, seg = fr * (t1 - t0);
      for (let j = 0; j < perfil.length - 1; j++) {
        const [r0, y0] = perfil[j], [r1, y1] = perfil[j + 1], h = Math.hypot(r1 - r0, y1 - y0);
        B.poli([[fx + r0 * Math.cos(t0), y0, fz - r0 * Math.sin(t0)], [fx + r0 * Math.cos(t1), y0, fz - r0 * Math.sin(t1)],
                [fx + r1 * Math.cos(t1), y1, fz - r1 * Math.sin(t1)], [fx + r1 * Math.cos(t0), y1, fz - r1 * Math.sin(t0)]],
               [[c[0], c[1]], [lerp(c[0], c[2], seg), c[1]], [lerp(c[0], c[2], seg), lerp(c[1], c[3], h)], [c[0], lerp(c[1], c[3], h)]]);
      }
    }
  }
  B.tampa(Array.from({ length: 16 }, (_, i) => { const t = -2 * Math.PI * i / 16; return [fx + (fr - 0.25) * Math.cos(t), fz + (fr - 0.25) * Math.sin(t)]; }), 0.42, 'agua', false);
  B.pintar('#d8d3c7');
  B.torno(fx, fz, [[0.45, 0.42], [0.3, 0.9], [0.55, 1.05], [0.5, 1.15], [0.12, 1.2], [0.1, 1.5], [0.001, 1.52]], 12, 'lisa');
  B.pintar(null);
  V.torno(fx, fz, [[0.05, 1.5], [0.25, 2.3], [0.5, 2.0], [0.7, 1.2], [0.8, 0.45]], 10, 'lisa');
  marcas.push({ x: fx, z: fz, r: fr, cor: '#3d7f95', tipo: 'agua' });
  /* os bancos do calçadão, os postes, as lixeiras */
  for (const x of [3.5, 8.5, L - 10.3, L - 5.3]) {
    banco(B, x, x + 1.8, zm + 2.1, -1, marcas);
    banco(B, x, x + 1.8, zm - 2.1, 1, marcas);
  }
  for (const x of [2.2, xm - 4.8, xm + 4.8, L - 2.2]) for (const z of [zm + 2.5, zm - 2.5]) postePraca(B, x, z);
  for (const [x, z] of [[6.4, zm + 2.4], [L - 7.4, zm - 2.4], [xm + 2.0, -1.4], [xm - 2.0, -A + 1.4]]) lixeira(B, x, z);
  /* o bicicletário e a placa da praça, na quina de quem chega */
  for (let i = 0; i < 4; i++) {
    const x = L - 1.2 - i * 0.6;
    barra(B, [x, 0, -A + 0.8], [x, 0.8, -A + 0.8], 0.05, 'lisa', '#9aa3a6');
    barra(B, [x, 0.8, -A + 0.8], [x, 0.8, -A + 1.3], 0.05, 'lisa', '#9aa3a6');
    barra(B, [x, 0, -A + 1.3], [x, 0.8, -A + 1.3], 0.05, 'lisa', '#9aa3a6');
  }
  B.caixa(1.0, 4.4, 0, 0.7, -1.0, -0.4, { todas: 'concreto_claro' });
  placa(placas, 'placa_praca', (spec.nome || 'PRAÇA').toUpperCase(), '#e3dfd3', '#2f4f3a', 2.7, 0.38, -0.39, 0, 1, 3.2, 0.5);
  placa(placas, 'placa_praca', (spec.nome || 'PRAÇA').toUpperCase(), '#e3dfd3', '#2f4f3a', 2.7, 0.38, -1.01, 0, -1, 3.2, 0.5);
  return fechar(E, { equip: B, vidros: V }, destino, placas, marcas);
}
