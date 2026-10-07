/* =========================================================
   OS AMBULANTES DA PORTA DO ESTÁDIO
   ---------------------------------------------------------
   O dono, 01/10/2026: "adicione casas, comércios (como espetinho,
   hamburgueria, pizzaria, barzinho, ambulantes na porta do estádio)".
   Em dia de jogo a calçada em volta do estádio vira feira:

     pipoca        o carrinho de pipoca de vidro, com a panela, as duas
                   rodas de bicicleta e o telhadinho
     cachorro      o carrinho de cachorro-quente de inox, com o vidro, o
                   molho e o guarda-sol amarelo e vermelho
     espetinho     a churrasqueira do espetinho (os espetos na brasa), o
                   isopor, a cadeira do churrasqueiro e o papelão do preço
     bebidas       os isopores da cerveja no carrinho de mão, as latinhas
                   em cima, o guarda-sol e a cadeira
     camelo        o camelô: a arara de camisas nas cores do clube da
                   casa, as bandeiras no mastro e a mesa dos bonés

   Cada peça em METROS em volta da origem, com o chão em y = 0 e a frente
   pro +z (pra rua, de onde vem quem compra); `noMundo` põe no lugar. As
   ferramentas e a folha são as da praia (praia3d.js): as listas `praia`
   (a folha praia.jpg) e nada mais. O texto (o nome do carrinho, o preço)
   é decalque.

   `PE` é o chão que a peça ocupa ([x0, x1, z0, z1], sem a copa do
   guarda-sol, que passa por cima de quem está na calçada): é por ele
   que a planta acha o lugar dela na calçada do estádio. `sol`: o meio e
   o raio da copa ([x, z, r]), que o mapa desenha de perto.
   ========================================================= */
import { Construtor, noMundo, placasNoMundo, sorteio, esfera, unit } from './construtor3d.js?v=78b065fe68';
import { Lugar, barra, tubo, cilindro, bloco, pano, toro, guardaSol, cadeiraPlastica, isopor, banqueta, CORES_SOL } from './praia3d.js?v=78b065fe68';

const AQUI = Lugar();
const escolha = (rnd, lista) => lista[Math.floor(rnd() * lista.length) % lista.length];
const placa = (lista, tipo, texto, fundo, tinta, x, y, z, nx, nz, larg, alt) =>
  lista.push({ tipo, texto, fundo, tinta, x, y, z, nx, nz, larg, alt });
/* as cores do clube quando ninguém diz (a camisa amarela e verde) */
const CORES_PADRAO = [['#f2c230', '#1f8a3c'], ['#1f8a3c', '#f2c230'], ['#2f6fb0', '#f4f1ea']];

/* a RODA de bicicleta, em pé no plano do x (o eixo no x): o pneu, o aro
   e os raios */
function roda(C, c, r) {
  toro(C, c, [0, 0, 1], [0, 1, 0], r, 0.022, 'lisa', ['#2a2a2a'], 14, 4);
  C.pintar('#b9bcc0');
  toro(C, c, [0, 0, 1], [0, 1, 0], r - 0.035, 0.008, 'metal', ['#b9bcc0'], 14, 3);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI, dy = Math.sin(a) * (r - 0.04), dz = Math.cos(a) * (r - 0.04);
    barra(C, [c[0], c[1] + dy, c[2] + dz], [c[0], c[1] - dy, c[2] - dz], 0.008, 'metal');
  }
  C.pintar(null);
}
/* a RODINHA do carrinho (pequena, de borracha), deitada no x */
const rodinha = (C, c, r = 0.08) => toro(C, c, [0, 0, 1], [0, 1, 0], r * 0.6, r * 0.4, 'lisa', ['#2a2a2a'], 10, 4);
/* a LATINHA em pé */
function latinha(C, x, y, z, cor) {
  C.pintar(cor);
  C.torno(x, z, [[0.001, y], [0.033, y], [0.033, y + 0.115], [0.026, y + 0.122], [0.001, y + 0.122]], 8, 'lisa');
  C.pintar(null);
}
/* o PAPELÃO DO PREÇO na vareta fincada num balde: o papelão (de frente pro
   +z) com o texto de decalque */
function papelao(x, L, texto, tinta = '#7a1e14', larg = 0.62, alt = 0.32, y = 1.05) {
  const { B, placas } = x;
  const p = L.pt([0, 0, 0]);
  B.pintar('#5f6468');
  B.torno(p[0], p[2], [[0.001, 0], [0.13, 0], [0.15, 0.28], [0.001, 0.28]], 10, 'lisa');
  B.pintar('#8a6a44');
  barra(B, L.pt([0, 0.05, 0]), L.pt([0, y + alt / 2, 0]), 0.025, 'madeira_velha');
  B.pintar('#c9a46a');
  bloco(B, L, -larg / 2 - 0.03, larg / 2 + 0.03, y - alt / 2 - 0.03, y + alt / 2 + 0.03, 0.015, 0.025, { todas: 'lisa' });
  B.pintar(null);
  const f = L.pt([0, y, 0.027]), n = L.vet([0, 0, 1]);
  placa(placas, 'letreiro', texto, '#f1e3c4', tinta, f[0], f[1], f[2], n[0], n[2], larg, alt);
}

/* =======================================================
   AS PEÇAS
   ======================================================= */
/* O CARRINHO DE PIPOCA: a caixa pintada com a faixa branca, a vitrine de
   vidro com a pipoca e a panela dentro, o telhadinho, as duas rodas de
   bicicleta, o pé da frente e o guidão do lado */
function pecaPipoca(x) {
  const { B, rnd, placas } = x;
  const cor = escolha(rnd, ['#c8322b', '#2f6fb0', '#d8643c', '#2f8f5a']);
  const W = 0.46, D = 0.3, y0 = 0.4, y1 = 0.95, yv = 1.52;
  B.pintar(cor);
  B.caixa(-W, W, y0, y1, -D, D, { todas: 'lisa' });
  B.pintar('#f4efe6');
  B.caixa(-W - 0.012, W + 0.012, y1 - 0.09, y1, -D - 0.012, D + 0.012, { todas: 'lisa', base: null });
  B.pintar(null);
  /* a vitrine: o vidro dos lados e de trás, e na frente só em cima — embaixo
     dele, a pipoca encostada no vidro (a palha clara faz o miúdo dela) */
  const yp = y1 + 0.28, VIDRO = { k: 'vidro', modo: 'esticar' };
  B.caixa(-W + 0.02, W - 0.02, y1, yv, -D + 0.02, D - 0.02, { tras: VIDRO, dir: VIDRO, esq: VIDRO, frente: null, base: null, topo: null });
  B.caixa(-W + 0.02, W - 0.02, yp, yv, -D + 0.02, D - 0.02, { frente: VIDRO, todas: null });
  B.pintar('#fff1b3');
  B.caixa(-W + 0.03, W - 0.03, y1, yp, -D + 0.03, D - 0.02, { todas: 'palha', base: null });
  for (let i = 0; i < 5; i++) esfera(B, [rnd.entre(-0.3, 0.3), yp, rnd.entre(-0.18, 0.12)], rnd.entre(0.05, 0.08), 'palha', 5, 3);
  B.pintar('#9a9da2');
  barra(B, [-W + 0.02, yp, D - 0.02], [W - 0.02, yp, D - 0.02], 0.02, 'metal');
  B.pintar('#c9ccd0');
  cilindro(B, AQUI, 0.14, -0.06, y1 + 0.3, y1 + 0.42, 0.13, 'metal', 10);
  barra(B, [0.14, y1 + 0.42, -0.06], [0.14, yv, -0.06], 0.02, 'metal');
  B.pintar(cor);
  for (const [px, pz] of [[-W + 0.02, -D + 0.02], [W - 0.02, -D + 0.02], [W - 0.02, D - 0.02], [-W + 0.02, D - 0.02]])
    barra(B, [px, y1, pz], [px, yv, pz], 0.035);
  /* o telhadinho de quatro águas com o beiral branco */
  B.pintar('#f4efe6');
  B.caixa(-W - 0.07, W + 0.07, yv, yv + 0.05, -D - 0.07, D + 0.07, { todas: 'lisa' });
  B.pintar(cor);
  B.telhado4(-W - 0.07, W + 0.07, -D - 0.07, D + 0.07, yv + 0.05, 0.2, 'lisa');
  B.pintar(null);
  /* as rodas, o eixo, o pé da frente e o guidão */
  for (const s of [-1, 1]) roda(B, [s * (W + 0.04), 0.27, -0.04], 0.27);
  B.pintar('#9a9da2');
  barra(B, [-(W + 0.04), 0.27, -0.04], [W + 0.04, 0.27, -0.04], 0.025, 'metal');
  barra(B, [0, y0, D - 0.06], [0, 0, D - 0.02], 0.03, 'metal');
  for (const dz of [-0.16, 0.16]) barra(B, [-W, y1 - 0.15, dz], [-W - 0.42, 0.9, dz * 1.2], 0.025, 'metal');
  B.pintar('#2a2a2a');
  barra(B, [-W - 0.42, 0.9, -0.22], [-W - 0.42, 0.9, 0.22], 0.04);
  B.pintar(null);
  placa(placas, 'letreiro', 'PIPOCA', '#f4efe6', cor, 0, (y0 + y1 - 0.09) / 2, D + 0.014, 0, 1, 0.8, 0.34);
}
/* O CARRINHO DE CACHORRO-QUENTE: a caixa de inox com o painel amarelo do
   nome, o tampo com as cubas, o vidro da frente, os três frascos de
   molho, as quatro rodinhas, o puxador e o guarda-sol amarelo e vermelho
   preso no carrinho; a banqueta do dono atrás */
function pecaCachorro(x) {
  const { B, rnd, placas } = x;
  const W = 0.72, D = 0.32, y0 = 0.22, y1 = 0.92;
  B.pintar('#dfe2e6');
  B.caixa(-W, W, y0, y1, -D, D, { todas: 'metal', frente: null });
  B.pintar('#f2c230');
  B.caixa(-W, W, y0, y1, D - 0.01, D, { frente: 'lisa', todas: null });
  B.pintar('#c9ccd0');
  B.caixa(-W - 0.02, W + 0.02, y1, y1 + 0.035, -D - 0.02, D + 0.02, { todas: 'metal' });
  /* as cubas (a salsicha, o purê, a batata palha) e a chapa */
  const cubas = [['#9c3f25', -0.45], ['#f0dfa8', -0.12], ['#e9b949', 0.2]];
  for (const [c, cx] of cubas) {
    B.pintar('#b9bcc0'); B.caixa(cx - 0.14, cx + 0.14, y1 + 0.035, y1 + 0.09, -0.2, 0.06, { todas: 'metal', base: null });
    B.pintar(c); B.caixa(cx - 0.12, cx + 0.12, y1 + 0.09, y1 + 0.095, -0.18, 0.04, { topo: 'lisa', todas: null });
  }
  B.pintar('#3b3b3b'); B.caixa(0.42, 0.68, y1 + 0.035, y1 + 0.06, -0.24, 0.1, { todas: 'metal', base: null });
  B.pintar(null);
  /* o vidro da frente, um pouco deitado */
  B.esticar(B.plano([-W + 0.04, y1 + 0.035, D - 0.02], [1, 0, 0], unit([0, 1, -0.18])), 0, 2 * W - 0.08, 0, 0.3, 'vidro');
  B.esticar(B.plano([W - 0.04, y1 + 0.035, D - 0.02], [-1, 0, 0], unit([0, 1, -0.18])), 0, 2 * W - 0.08, 0, 0.3, 'vidro');
  /* os molhos: ketchup, mostarda e maionese */
  for (const [c, mx] of [['#c8322b', -0.62], ['#e8c02a', -0.54], ['#f2ead2', -0.46]]) {
    B.pintar(c);
    B.torno(mx, 0.18, [[0.001, y1 + 0.035], [0.032, y1 + 0.035], [0.032, y1 + 0.2], [0.012, y1 + 0.24], [0.001, y1 + 0.24]], 7, 'lisa');
  }
  B.pintar(null);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) rodinha(B, [sx * (W - 0.12), 0.08, sz * (D - 0.08)]);
  B.pintar('#9a9da2');
  for (const dz of [-0.18, 0.18]) barra(B, [W, y1 - 0.12, dz], [W + 0.3, y1 - 0.08, dz], 0.025, 'metal');
  barra(B, [W + 0.3, y1 - 0.08, -0.2], [W + 0.3, y1 - 0.08, 0.2], 0.035, 'metal');
  B.pintar(null);
  guardaSol(B, Lugar(-0.1, -0.12), { raio: 1.05, altura: 1.35, y0: y1 + 0.035, cores: ['#f2c230', '#c8322b'], giro: rnd() });
  banqueta(B, Lugar(0.25, -0.75), '#c8322b');
  placa(placas, 'letreiro', 'CACHORRO-QUENTE', '#f2c230', '#b5322a', 0, (y0 + y1) / 2 + 0.06, D + 0.012, 0, 1, 1.32, 0.3);
  placa(placas, 'letreiro', 'R$ 12', '#f2c230', '#1d1d1d', 0, (y0 + y1) / 2 - 0.2, D + 0.012, 0, 1, 0.4, 0.16);
}
/* O ESPETINHO: a churrasqueira de chapa nos quatro pés abertos, a brasa,
   os espetos na grelha (carne, frango, linguiça), o isopor do lado, a
   cadeira do churrasqueiro, o guarda-sol e o papelão do preço */
function pecaEspetinho(x) {
  const { B, rnd } = x;
  const W = 0.5, D = 0.17, yb = 0.72, yt = 0.88;
  B.pintar('#3a3a3a');
  B.caixa(-W, W, yb, yt, -D, D, { todas: 'metal', topo: null });
  for (const [px, pz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) barra(B, [px * (W - 0.04), yb, pz * (D - 0.03)], [px * (W + 0.04), 0, pz * (D + 0.06)], 0.03, 'metal');
  barra(B, [-W - 0.02, 0.25, D + 0.03], [W + 0.02, 0.25, D + 0.03], 0.02, 'metal');
  B.pintar('#d2541f');
  B.caixa(-W + 0.03, W - 0.03, yt - 0.06, yt - 0.05, -D + 0.03, D - 0.03, { topo: 'lisa', todas: null });
  B.pintar('#5a2a1a');
  for (let i = 0; i < 9; i++) esfera(B, [rnd.entre(-W + 0.08, W - 0.08), yt - 0.055, rnd.entre(-0.1, 0.1)], 0.035, 'lisa', 5, 2);
  /* os espetos: ao comprido no z, por cima da grelha */
  const n = 9;
  for (let i = 0; i < n; i++) {
    const ex = -W + 0.07 + i * (2 * W - 0.14) / (n - 1), ey = yt + 0.012;
    B.pintar('#d9c9a0');
    barra(B, [ex, ey, -D - 0.12], [ex, ey, D + 0.02], 0.008, 'madeira_velha');
    const tipo = i % 3;
    B.pintar(tipo === 0 ? '#7a3b1e' : tipo === 1 ? '#c98b4a' : '#8e2b22');
    if (tipo === 2) B.torno(ex, 0, [[0.001, ey - 0.02], [0.022, ey - 0.02], [0.022, ey + 0.02], [0.001, ey + 0.02]], 6, 'lisa');
    for (let k = 0; k < 4; k++) {
      const z = -0.12 + k * 0.065;
      B.caixa(ex - 0.022, ex + 0.022, ey - 0.02, ey + 0.024, z - 0.024, z + 0.024, { todas: 'lisa', base: null });
    }
  }
  B.pintar(null);
  isopor(B, Lugar(0.98, -0.05, rnd.entre(-0.2, 0.2)), { larg: 0.55 });
  cadeiraPlastica(B, Lugar(-0.25, -0.62, rnd.entre(-0.3, 0.3)), escolha(rnd, ['#f1efe9', '#c8322b', '#2f6fb0']));
  guardaSol(B, Lugar(0.4, -0.3), { raio: 1.1, altura: 2.15, cores: escolha(rnd, CORES_SOL), inclina: 0.05, rumo: 1.6, giro: rnd() });
  papelao(x, Lugar(-0.85, 0.12, rnd.entre(-0.25, 0.1)), escolha(rnd, ['ESPETINHO R$ 10', 'ESPETO R$ 8', 'CHURRASQUINHO R$ 10']));
}
/* AS BEBIDAS: os dois isopores no carrinho de mão (o terceiro em cima),
   as latinhas na tampa, o papel do preço colado, o guarda-sol e a
   cadeira de plástico */
function pecaBebidas(x) {
  const { B, rnd, placas } = x;
  /* o carrinho: a chapa no chão, as rodas atrás e o cabo */
  B.pintar('#5f6468');
  B.caixa(-0.62, 0.62, 0.06, 0.1, -0.24, 0.26, { todas: 'metal' });
  B.pintar(null);
  for (const s of [-1, 1]) rodinha(B, [s * 0.66, 0.12, -0.2], 0.2);
  B.pintar('#5f6468');
  for (const s of [-1, 1]) barra(B, [s * 0.6, 0.1, -0.24], [s * 0.6, 1.05, -0.36], 0.03, 'metal');
  barra(B, [-0.6, 1.05, -0.36], [0.6, 1.05, -0.36], 0.035, 'metal');
  B.pintar(null);
  /* os isopores */
  const L1 = Lugar(-0.3, 0.02, 0, 0.1), L2 = Lugar(0.3, 0.02, 0, 0.1), L3 = Lugar(0.02, 0.0, rnd.entre(-0.15, 0.15), 0.55);
  isopor(B, L1, { larg: 0.56 }); isopor(B, L2, { larg: 0.56 }); isopor(B, L3, { larg: 0.5 });
  /* as latinhas na tampa de cima e o gelo escorrendo */
  const cores = ['#c8322b', '#d9d9d6', '#1f6f3f', '#c8322b', '#f2c230', '#1f4e8c'];
  for (let i = 0; i < 5; i++) latinha(B, -0.17 + i * 0.085 + rnd.entre(-0.01, 0.01), 1.0, rnd.entre(-0.08, 0.08), escolha(rnd, cores));
  placa(placas, 'letreiro', escolha(rnd, ['CERVEJA', 'GELADA', 'BRAHMA', 'LATÃO']), '#ffffff', '#1f4e8c', -0.3, 0.3, 0.222, 0, 1, 0.44, 0.2);
  placa(placas, 'letreiro', escolha(rnd, ['ÁGUA R$ 3', 'REFRI R$ 5', 'ÁGUA · REFRI']), '#ffffff', '#c8322b', 0.3, 0.3, 0.222, 0, 1, 0.44, 0.2);
  guardaSol(B, Lugar(-0.82, -0.3), { raio: 1.0, altura: 2.15, cores: escolha(rnd, [['#c8322b', '#f4efe6'], ['#2f6fb0', '#f4efe6'], ['#1f8a3c', '#f2c230']]), inclina: 0.06, rumo: 0.2, giro: rnd() });
  cadeiraPlastica(B, Lugar(0.95, -0.42, rnd.entre(-0.5, -0.1)), escolha(rnd, ['#f1efe9', '#c8322b']));
}
/* O CAMELÔ: a arara (dois pés e o cano) com as camisas penduradas nas
   cores dos clubes da casa (a listra de cor 2 no peito), o mastro das
   bandeiras do lado e a mesa dobrável na frente com os bonés e os
   cachecóis enrolados */
function camisa(B, L, cor, cor2, listra) {
  /* o contorno da camiseta, de frente pro +z: o corpo e as mangas */
  const pts = [[-0.2, 0], [0.2, 0], [0.2, 0.42], [0.31, 0.38], [0.36, 0.5], [0.16, 0.62], [0.07, 0.6], [0, 0.56], [-0.07, 0.6], [-0.16, 0.62], [-0.36, 0.5], [-0.31, 0.38], [-0.2, 0.42]];
  const U = L.vet([1, 0, 0]);
  B.pintar(cor);
  B.extrudar(B.plano(L.pt([0, 0, 0]), U, [0, 1, 0]), pts, 0.015, 'lisa', 'lisa', 'lisa');
  /* a cor 2 na frente: a faixa no peito, a gola ou a listra do meio */
  const [a0, b0, w, h] = listra === 'faixa' ? [-0.2, 0.22, 0.4, 0.1] : listra === 'gola' ? [-0.09, 0.55, 0.18, 0.05] : [-0.05, 0, 0.1, 0.56];
  B.pintar(cor2);
  B.esticar(B.plano(L.pt([a0, b0, 0.004]), U, [0, 1, 0]), 0, w, 0, h, 'lisa');
  B.pintar(null);
}
/* a BANDEIRA de três faixas (cor, cor 2, cor) batendo no vento, presa no
   mastro pela beira de x0, dos dois lados */
function bandeira(B, x0, y, z, w, h, c1, c2) {
  for (let j = 0; j < 3; j++) {
    B.pintar(j === 1 ? c2 : c1);
    const P = (s, t) => [x0 + s * w, y - (j + t) * h / 3, z + 0.06 * Math.sin(s * 5) * s];
    for (let i = 0; i < 4; i++) {
      const s0 = i / 4, s1 = (i + 1) / 4;
      pano(B, [P(s0, 1), P(s1, 1), P(s1, 0), P(s0, 0)], 'lisa');
      pano(B, [P(s1, 1), P(s0, 1), P(s0, 0), P(s1, 0)], 'lisa');
    }
  }
  B.pintar(null);
}
function pecaCamelo(x) {
  const { B, rnd, placas } = x;
  const cores = x.cores && x.cores.length ? x.cores : CORES_PADRAO;
  /* a arara */
  B.pintar('#9a9da2');
  for (const s of [-1, 1]) {
    tubo(B, [s * 1.05, 0, -0.22], [s * 1.05, 1.82, -0.22], 0.02);
    barra(B, [s * 1.05, 0.02, -0.45], [s * 1.05, 0.02, 0.01], 0.03, 'metal');
  }
  tubo(B, [-1.08, 1.8, -0.22], [1.08, 1.8, -0.22], 0.016);
  B.pintar(null);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const cx = -0.86 + i * 1.72 / (n - 1), [c1, c2] = cores[i % cores.length];
    B.pintar('#5f6468');
    barra(B, [cx, 1.8, -0.22], [cx, 1.7, -0.22], 0.01, 'metal');
    B.pintar(null);
    const L = Lugar(cx, -0.2 + (i % 2) * 0.03, rnd.entre(-0.08, 0.08), 1.06);
    camisa(B, L, i % 3 === 2 ? c2 : c1, i % 3 === 2 ? c1 : c2, escolha(rnd, ['faixa', 'gola', 'listra']));
  }
  /* o mastro das bandeiras (duas, nas cores do clube, uma em cima da outra) */
  B.pintar('#8a6a44');
  barra(B, [1.32, 0, -0.1], [1.32, 2.45, -0.1], 0.04, 'madeira_velha');
  B.pintar(null);
  cores.slice(0, 2).forEach(([c1, c2], k) => bandeira(B, 1.34, 2.4 - k * 0.72, -0.1, 0.9, 0.6, c1, c2));
  /* a mesa dobrável com os bonés e os cachecóis */
  B.pintar('#e8e4da');
  B.caixa(-0.62, 0.62, 0.72, 0.75, 0.12, 0.58, { todas: 'lisa' });
  B.pintar('#6f7378');
  for (const s of [-1, 1]) { barra(B, [s * 0.55, 0.72, 0.16], [s * 0.5, 0, 0.54], 0.025, 'metal'); barra(B, [s * 0.55, 0.72, 0.54], [s * 0.5, 0, 0.16], 0.025, 'metal'); }
  B.pintar(null);
  for (let i = 0; i < 5; i++) {
    const bx = -0.48 + i * 0.24, bz = 0.3 + (i % 2) * 0.12, [c1, c2] = cores[(i + 1) % cores.length];
    B.pintar(i % 2 ? c2 : c1);
    B.torno(bx, bz, [[0.001, 0.75], [0.09, 0.75], [0.085, 0.79], [0.06, 0.83], [0.001, 0.845]], 8, 'lisa');
    B.caixa(bx - 0.07, bx + 0.07, 0.75, 0.758, bz + 0.05, bz + 0.15, { todas: 'lisa', base: null });
  }
  for (let i = 0; i < 3; i++) {
    const [c1, c2] = cores[i % cores.length], cz = 0.2 + i * 0.12;
    B.pintar(c1); tubo(B, [-0.6, 0.79, cz], [-0.36, 0.79, cz], 0.04, 'lisa', 8);
    B.pintar(c2); tubo(B, [-0.36, 0.79, cz], [-0.3, 0.79, cz], 0.041, 'lisa', 8);
  }
  B.pintar(null);
  placa(placas, 'letreiro', escolha(rnd, ['CAMISA R$ 30', 'CAMISA 2 POR R$ 50', 'BONÉ R$ 20']), '#f4f1ea', '#1d1d1d', 0, 0.62, 0.585, 0, 1, 0.9, 0.18);
}

/* =======================================================
   O CATÁLOGO
   ======================================================= */
export const PECAS_AMBULANTES = {
  pipoca:    { nome: 'Carrinho de pipoca', montar: pecaPipoca, cor: '#c8322b', PE: [-0.95, 0.56, -0.38, 0.38],
    nota: 'A vitrine de vidro com a pipoca e a panela, o telhadinho, a faixa branca com o nome, as rodas de bicicleta e o guidão do lado.' },
  cachorro:  { nome: 'Cachorro-quente', montar: pecaCachorro, cor: '#f2c230', PE: [-0.76, 1.06, -0.95, 0.36], sol: [-0.1, -0.12, 1.05],
    nota: 'O carrinho de inox com o painel amarelo, as cubas, a chapa, o vidro da frente, os três molhos, o guarda-sol amarelo e vermelho e a banqueta do dono.' },
  espetinho: { nome: 'Espetinho', montar: pecaEspetinho, cor: '#7a3b1e', PE: [-1.2, 1.32, -0.9, 0.3], sol: [0.4, -0.3, 1.1],
    nota: 'A churrasqueira de chapa com a brasa e os espetos (carne, frango e linguiça), o isopor, a cadeira do churrasqueiro, o guarda-sol e o papelão do preço.' },
  bebidas:   { nome: 'Isopor de bebidas', montar: pecaBebidas, cor: '#2f6fb0', PE: [-0.9, 1.2, -0.66, 0.28], sol: [-0.82, -0.3, 1.0],
    nota: 'Os isopores no carrinho de mão com as latinhas em cima, o papel do preço colado, o guarda-sol e a cadeira de plástico.' },
  camelo:    { nome: 'Camelô de camisas', montar: pecaCamelo, cor: '#1f8a3c', PE: [-1.12, 1.4, -0.46, 0.6],
    nota: 'A arara de camisas nas cores dos clubes da casa, as bandeiras no mastro e a mesa dobrável com os bonés e os cachecóis.' }
};

/* MONTA o ambulante `id` com a `semente`, em (onde.x, onde.z) do mundo,
   girado de `onde.giro` (a frente, o +z, pra onde ele olha): os blocos
   vão pra `destino` e os decalques voltam no mundo. `opc.cores`: as
   cores das camisas e bandeiras do camelô ([[cor, cor2], ...], as dos
   clubes da casa). `info`: a planta (largura × fundo), a altura e os
   triângulos */
export function montarAmbulante(id, onde = {}, destino = {}, semente = 1, opc = {}) {
  const peca = PECAS_AMBULANTES[id];
  if (!peca) throw new Error('ambulantes3d: não conheço o ambulante ' + id);
  const rnd = sorteio(semente * 7919 + id.length * 104729 + id.charCodeAt(0));
  const B = Construtor('praia'), placas = [];
  peca.montar({ B, rnd, placas, cores: opc.cores });
  const caixa = [Infinity, -Infinity, 0, Infinity, -Infinity];
  for (let i = 0; i < B.pos.length; i += 3) {
    caixa[0] = Math.min(caixa[0], B.pos[i]); caixa[1] = Math.max(caixa[1], B.pos[i]); caixa[2] = Math.max(caixa[2], B.pos[i + 1]);
    caixa[3] = Math.min(caixa[3], B.pos[i + 2]); caixa[4] = Math.max(caixa[4], B.pos[i + 2]);
  }
  noMundo({ praia: B }, destino, onde);
  return {
    placas: placasNoMundo(placas, onde),
    info: { larg: caixa[1] - caixa[0], fundo: caixa[4] - caixa[3], altura: caixa[2], triangulos: B.pos.length / 9, caixa }
  };
}
