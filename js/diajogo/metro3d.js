/* =========================================================
   O METRÔ DA PROPOSTA — a entrada, a estação, o túnel e o trem
   ---------------------------------------------------------
   A Linha 1 tem duas estações subterrâneas (os dados saem de
   `gerarProposta`, em ferramentas/planta_html/proposta.js: o terreno da
   entrada, o salão da plataforma embaixo da quadra, a linha do trilho e
   o caminho do túnel de uma à outra).

   A ENTRADA é a da foto do dono: a caixa de vidro com o pórtico branco
   e a viga em onda descendo no fundo, a faixa grafite com o M e METRÔ,
   a grade de enrolar recolhida no canto, e dentro a escada fixa e a
   rolante descendo entre paredes de azulejo azul até o MEZANINO (5,2 m),
   onde ficam a bilheteria, o mapa da linha e as catracas. Do lado pago
   a escada desce pra PLATAFORMA (10 m): o piso bege, a pedra da borda e
   a faixa amarela, a parede de azulejo claro com a faixa azul e o friso
   de triângulos, os bancos, os anúncios iluminados, os dois painéis dos
   próximos trens pendurados, o nome da estação na parede e, no fim, a
   parede de tijolo com a boca do túnel.

   A ESTAÇÃO É ESCRITA UMA VEZ SÓ, no referencial da Poente: x ao longo
   do salão (a entrada e o túnel na ponta de x grande), z do lado do
   trilho (norte) pro lado da plataforma (sul), y a altura (0 = rua). A
   Norte é a mesma girada 180°, que não espelha nada.

   O CORTE DE CASA DE BONECA. Tudo que fica embaixo da terra sai com a
   face virada pra DENTRO do cômodo e vai numa lista à parte
   (`metro_sub`), que quem mostra desenha só de frente (FrontSide): de
   cima, o teto e a parede do lado de cá, que mostram as costas, somem
   sozinhos, e a estação aparece inteira; da plataforma, tudo está lá.
   O que fica pendurado no teto só tem a face de baixo, pelo mesmo
   motivo. O vidro vai em `vidros` (transparente); a grade, em `grades`.

   A PÉ. No cenário da planta o boneco desce a escada (ou a rolante) da
   rua até o mezanino, passa a catraca e desce pra plataforma, pisando
   nos próprios triângulos da estação (ferramentas/planta_html/
   subsolo.js). `montarEstacao` devolve em `andar` o que os triângulos
   não dizem: o poço (a rua ali não tem chão), a caixa da estação, a
   borda da plataforma e os braços das catracas, que o corpo atravessa.

   O TREM é de três carros de 11 m: a cara azul-marinho com a moldura
   vermelha nas duas pontas, o carro branco com a faixa azul e as portas
   vermelhas. `montarCarro` devolve cada carro na origem (x ao longo dele,
   em unidade de mundo): quem mostra põe os carros no caminho.
   ========================================================= */
import { Construtor, METRO, lerp, sub, unit } from './construtor3d.js';

const M = METRO;
/* o salão da plataforma, em metros (a conta tem de bater com a de proposta.js) */
const LARG = 11.0, PAREDE = 0.4, TRILHO_Z = 2.7, BORDA_Z = 5.0;
const Y_PLAT = -10.0, Y_LEITO = -11.1, Y_TRILHO = -10.95, Y_TETO = -5.5;
const Y_MEZ = -5.2, Y_MEZ_TETO = -1.8, Y_RUA = 0.08;
const AZUL = '#2b3f9c', BRANCO = '#efefeb', GRAFITE = '#3b3f44', INOX = '#b9bdc0', PRETO = '#1e2023', VERMELHO = '#c3202b';

/* =======================================================
   AS PEÇAS
   ======================================================= */
/* a lista de blocos de cada construtor; `destino[nome]` recebe o que
   estiver cheio */
function construtores() {
  return { R: Construtor('metro'), S: Construtor('metro'), G: Construtor('grades'), V: Construtor('metro') };
}
const lisa = tinta => ({ k: 'lisa', tinta });

/* A SALA VISTA DE DENTRO: piso pra cima, teto pra baixo e as quatro
   paredes com a face pro miolo. `spec` diz a peça de cada uma (null não
   desenha): chao, teto, n (z0), s (z1), o (x0), l (x1). */
function salaInterna(C, x0, x1, y0, y1, z0, z1, spec) {
  const peca = (s, f) => { if (!s) return; if (typeof s === 'string') s = { k: s }; f(s); };
  peca(spec.chao, s => C.tampa([[x0, z1], [x1, z1], [x1, z0], [x0, z0]], y0, s.k, false, s));
  peca(spec.teto, s => C.tampa([[x0, z0], [x1, z0], [x1, z1], [x0, z1]], y1, s.k, true, s));
  const h = y1 - y0;
  peca(spec.n, s => C.ladrilhar(C.plano([x0, y0, z0], [1, 0, 0], [0, 1, 0]), C.ret(0, x1 - x0, 0, h), s.k, s));
  peca(spec.s, s => C.ladrilhar(C.plano([x1, y0, z1], [-1, 0, 0], [0, 1, 0]), C.ret(0, x1 - x0, 0, h), s.k, s));
  peca(spec.o, s => C.ladrilhar(C.plano([x0, y0, z1], [0, 0, -1], [0, 1, 0]), C.ret(0, z1 - z0, 0, h), s.k, s));
  peca(spec.l, s => C.ladrilhar(C.plano([x1, y0, z0], [0, 0, 1], [0, 1, 0]), C.ret(0, z1 - z0, 0, h), s.k, s));
}
/* uma faixa de parede (de dentro) na parede `lado` da sala, de a0 a a1
   ao longo dela e de y0 a y1, afastada `d` da parede */
function naParede(C, sala, lado, a0, a1, y0, y1, k, o = {}, d = 0.002) {
  const { x0, x1, z0, z1 } = sala;
  const F = lado === 'n' ? C.plano([x0 + a0, y0, z0 + d], [1, 0, 0], [0, 1, 0])
          : lado === 's' ? C.plano([x1 - a0, y0, z1 - d], [-1, 0, 0], [0, 1, 0])
          : lado === 'o' ? C.plano([x0 + d, y0, z1 - a0], [0, 0, -1], [0, 1, 0])
          : C.plano([x1 - d, y0, z0 + a0], [0, 0, 1], [0, 1, 0]);
  if (o.modo === 'esticar') C.esticar(F, 0, a1 - a0, 0, y1 - y0, k, o);
  else C.ladrilhar(F, C.ret(0, a1 - a0, 0, y1 - y0), k, o);
  return F;
}
/* a parede de ponta a ponta com a BOCA DO TÚNEL: o buraco é a seção do
   túnel (a mesma de `perfilDoTunel`), centrada em `ac`. Fora dela, dois
   retângulos; em cima da abóbada, uma tira por pedaço do arco. */
function paredeComBoca(C, F, larg, alt, ac, k, o = {}) {
  const arco = perfilDoTunel().filter(([r, h]) => h >= 2.99).map(([r, h]) => [ac - r, h]).sort((p, q) => p[0] - q[0]);
  const a0 = arco[0][0], a1 = arco[arco.length - 1][0];
  if (a0 > 0.001) C.ladrilhar(F, C.ret(0, a0, 0, alt), k, o);
  if (a1 < larg - 0.001) C.ladrilhar(F, C.ret(a1, larg, 0, alt), k, o);
  for (let i = 0; i < arco.length - 1; i++) {
    const [p0, h0] = arco[i], [p1, h1] = arco[i + 1];
    if (p1 - p0 < 1e-4) continue;
    C.ladrilhar(F, [[p0, h0], [p1, h1], [p1, alt], [p0, alt]], k, o);
  }
}
/* um quadrilátero qualquer com a peça esticada, virado pro lado de
   `dentro` (um ponto que tem de ficar na frente dele) */
function quad(C, P, k, dentro, o = {}) {
  const c = C.cel(k);
  const [f0, f1, g0, g1] = o.parte || [0, 1, 0, 1];
  const U0 = lerp(c[0], c[2], f0), U1 = lerp(c[0], c[2], f1), V0 = lerp(c[1], c[3], g0), V1 = lerp(c[1], c[3], g1);
  let T = [[U0, V0], [U1, V0], [U1, V1], [U0, V1]], Q = P;
  if (dentro) {
    const e1 = sub(P[1], P[0]), e2 = sub(P[3], P[0]);
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const c0 = [(P[0][0] + P[2][0]) / 2, (P[0][1] + P[2][1]) / 2, (P[0][2] + P[2][2]) / 2];
    if (n[0] * (dentro[0] - c0[0]) + n[1] * (dentro[1] - c0[1]) + n[2] * (dentro[2] - c0[2]) < 0) {
      Q = [P[0], P[3], P[2], P[1]]; T = [T[0], T[3], T[2], T[1]];
    }
  }
  if (o.tinta !== undefined) { C.pintar(o.tinta); C.poli(Q, T, o.escuro); C.pintar(null); }
  else C.poli(Q, T, o.escuro);
}
/* uma barra entre dois pontos (a viga da onda, o corrimão), de seção
   quadrada `e`, com as quatro faces */
function barra(C, p, q, e, k, tinta) {
  const d = unit(sub(q, p));
  let a = [d[1] * 0 - d[2] * 1, d[2] * 0 - d[0] * 0, d[0] * 1 - d[1] * 0];     // d × y
  if (Math.hypot(...a) < 1e-4) a = [1, 0, 0];
  a = unit(a);
  const b = unit([d[1] * a[2] - d[2] * a[1], d[2] * a[0] - d[0] * a[2], d[0] * a[1] - d[1] * a[0]]);
  const off = (s, t) => [a[0] * s + b[0] * t, a[1] * s + b[1] * t, a[2] * s + b[2] * t];
  const h = e / 2, cs = [off(-h, -h), off(h, -h), off(h, h), off(-h, h)];
  const mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
  if (tinta) C.pintar(tinta);
  for (let i = 0; i < 4; i++) {
    const c0 = cs[i], c1 = cs[(i + 1) % 4];
    const P = [[p[0] + c0[0], p[1] + c0[1], p[2] + c0[2]], [p[0] + c1[0], p[1] + c1[1], p[2] + c1[2]],
               [q[0] + c1[0], q[1] + c1[1], q[2] + c1[2]], [q[0] + c0[0], q[1] + c0[1], q[2] + c0[2]]];
    const fora = [mid[0] + (c0[0] + c1[0]) * 4, mid[1] + (c0[1] + c1[1]) * 4, mid[2] + (c0[2] + c1[2]) * 4];
    quad(C, P, k, fora);
  }
  if (tinta) C.pintar(null);
}

/* =======================================================
   A ENTRADA — na rua, no terreno da ponta da quadra
   ======================================================= */
/* `T`: o terreno no referencial da estação ({x0, x1, z0, z1}); o povo
   entra pelo lado z0 e desce pra z1. Devolve a caixa do poço (onde a
   escada corta a laje) e onde a escada e a rolante chegam lá embaixo. */
const DEGRAU = 0.29, ESPELHO = (Y_RUA - Y_MEZ) / 31;
function entrada(C, T, ctx) {
  const { R, S, G, V } = C;
  const W = T.x1 - T.x0, xm = (T.x0 + T.x1) / 2;
  /* o poço: a escada fixa de 2,3 m, a mureta do meio e a rolante de 1,35 */
  const P0 = xm - 2.15, P1 = xm + 2.15, B0 = T.z0 + 1.6, B1 = T.z0 + 11.0;
  const esc0 = P0 + 0.2, esc1 = P0 + 2.5, rol0 = P0 + 2.75, rol1 = P1 - 0.2;
  const zEsc1 = B0 + 31 * DEGRAU;                                      // o pé da escada
  const zRol0 = B0 + 0.9, zRol1 = zRol0 + (Y_RUA - Y_MEZ) / Math.tan(30 * Math.PI / 180);

  /* a praça: o granito do terreno, com o buraco do poço */
  const praca = [[T.x0, T.z0, T.x1, B0], [T.x0, B1, T.x1, T.z1], [T.x0, B0, P0 - 0.2, B1], [P1 + 0.2, B0, T.x1, B1]];
  for (const [a0, b0, a1, b1] of praca) R.tampa([[a0, b1], [a1, b1], [a1, b0], [a0, b0]], Y_RUA, 'granito', false);
  ctx.marca(T.x0, T.x1, T.z0, T.z1, '#c9c6bf', 'piso');

  /* a mureta de concreto em volta do poço (os dois lados e o fundo) e o
     vidro em cima dela, com os montantes pretos */
  const mH = 0.45, vH = 2.9;
  R.caixa(P0 - 0.2, P0, 0, mH, B0, B1 + 0.2, { todas: lisa('#cfccc4'), base: null });
  R.caixa(P1, P1 + 0.2, 0, mH, B0, B1 + 0.2, { todas: lisa('#cfccc4'), base: null });
  R.caixa(P0, P1, 0, mH, B1, B1 + 0.2, { todas: lisa('#cfccc4'), base: null });
  const vidroEm = (p, q) => {
    V.poli([[p[0], mH, p[1]], [q[0], mH, q[1]], [q[0], vH, q[1]], [p[0], vH, p[1]]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const L = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(1, Math.round(L / 1.2));
    for (let i = 0; i <= n; i++) {
      const x = lerp(p[0], q[0], i / n), z = lerp(p[1], q[1], i / n);
      R.caixa(x - 0.025, x + 0.025, mH, vH, z - 0.025, z + 0.025, { todas: lisa(PRETO) });
    }
    barra(R, [p[0], vH, p[1]], [q[0], vH, q[1]], 0.06, 'lisa', BRANCO);
    barra(R, [p[0], 1.1, p[1]], [q[0], 1.1, q[1]], 0.04, 'lisa', BRANCO);
  };
  vidroEm([P0 - 0.1, B0], [P0 - 0.1, B1 + 0.1]);
  vidroEm([P1 + 0.1, B0], [P1 + 0.1, B1 + 0.1]);
  vidroEm([P0 - 0.1, B1 + 0.1], [P1 + 0.1, B1 + 0.1]);
  ctx.marca(P0 - 0.2, P1 + 0.2, B0, B1 + 0.2, '#2f3033', 'vao');

  /* O PÓRTICO: os pilares brancos, a laje de cobertura na metade da
     frente e a faixa grafite com o M; no fundo, a viga em onda */
  const cob0 = T.z0 + 0.3, cob1 = B0 + 5.2, yC = 3.4, a0 = P0 - 0.45, a1 = P1 + 0.45;
  for (const x of [a0 + 0.07, a1 - 0.07]) for (const z of [cob0 + 0.1, B0 + 2.6, cob1 - 0.1])
    R.caixa(x - 0.08, x + 0.08, 0, yC, z - 0.08, z + 0.08, { todas: lisa(BRANCO) });
  R.caixa(a0, a1, yC, yC + 0.22, cob0, cob1, { todas: lisa(BRANCO), base: lisa('#d9d9d4') });
  ctx.marca(a0, a1, cob0, cob1, '#e9e9e5', 'teto');
  const fx0 = a0 - 0.05, fx1 = a1 + 0.05, fy0 = 2.75, fy1 = yC + 0.25;
  R.caixa(fx0, fx1, fy0, fy1, cob0 - 0.2, cob0, { todas: lisa(GRAFITE) });
  R.esticar(R.plano([fx1, fy0, cob0 - 0.2 - 0.002], [-1, 0, 0], [0, 1, 0]), 0, fx1 - fx0, 0, fy1 - fy0, 'placa');
  for (const [x, dir] of [[fx0, -1], [fx1, 1]]) {
    R.caixa(Math.min(x, x + dir * 0.2), Math.max(x, x + dir * 0.2), fy0, fy1, cob0 - 0.2, cob0 + 3.2, { todas: lisa(GRAFITE) });
    ctx.placa('placa', 'ESTAÇÃO ' + ctx.nome.toUpperCase(), GRAFITE, '#ffffff', x + dir * 0.205, (fy0 + fy1) / 2, cob0 + 1.5, dir, 0, 2.9, fy1 - fy0 - 0.12);
  }
  /* a onda: sai da laje, sobe um palmo e desce até o chão no fim do poço,
     dos dois lados, com as terças brancas e o vidro por cima */
  const ondaY = t => yC + 0.2 + 0.55 * Math.sin(Math.PI * Math.min(1, t * 1.6)) * (1 - t) - (yC - 0.2) * Math.pow(Math.max(0, (t - 0.25) / 0.75), 1.6);
  const Nw = 14, zW0 = cob1, zW1 = B1 + 0.3;
  const onda = [];
  for (let i = 0; i <= Nw; i++) { const t = i / Nw; onda.push([lerp(zW0, zW1, t), Math.max(0.5, ondaY(t))]); }
  for (const x of [a0 + 0.07, a1 - 0.07])
    for (let i = 0; i < Nw; i++) barra(R, [x, onda[i][1], onda[i][0]], [x, onda[i + 1][1], onda[i + 1][0]], 0.16, 'lisa', BRANCO);
  for (let i = 1; i < Nw; i += 2) barra(R, [a0 + 0.07, onda[i][1], onda[i][0]], [a1 - 0.07, onda[i][1], onda[i][0]], 0.08, 'lisa', BRANCO);
  for (let i = 0; i < Nw; i++) {
    const [zA, yA] = onda[i], [zB, yB] = onda[i + 1];
    V.poli([[a0, yA, zA], [a1, yA, zA], [a1, yB, zB], [a0, yB, zB]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  /* A GRADE DE ENROLAR, recolhida no canto da entrada, e a lixeira */
  G.esticar(G.plano([P1 - 0.55, 0, B0 - 0.25], [1, 0, 0], [0, 1, 0]), 0, 0.55, 0, 2.6, 'preta');
  G.esticar(G.plano([P1, 0, B0 - 0.25], [-1, 0, 0], [0, 1, 0]), 0, 0.55, 0, 2.6, 'preta');
  R.caixa(P1 - 0.58, P1 + 0.03, 2.6, 2.75, B0 - 0.3, B0 - 0.2, { todas: lisa(PRETO) });
  /* O TOTEM do metrô na calçada: o poste com o cubo do M */
  const tx = T.x1 - 0.5, tz = T.z0 + 0.5;
  R.caixa(tx - 0.07, tx + 0.07, 0, 3.6, tz - 0.07, tz + 0.07, { todas: lisa(GRAFITE) });
  R.caixa(tx - 0.4, tx + 0.4, 3.6, 4.4, tz - 0.4, tz + 0.4, { todas: { k: 'logo', modo: 'esticar' }, topo: lisa(GRAFITE), base: lisa(GRAFITE) });

  /* O POÇO: a escada, a rolante e o azulejo azul até o mezanino */
  poco(C, { P0, P1, B0, B1, esc0, esc1, rol0, rol1, zEsc1, zRol0, zRol1 }, ctx);
  return { P0, P1, B0, B1, esc0, esc1, rol0, rol1, zEsc1, zRol0, zRol1, a0, a1, cob0, cob1 };
}

/* a escada fixa: degrau por degrau, o piso com o bocel amarelo e o
   espelho; `dir` é pra onde desce (+1: z cresce), (x0, x1) a largura */
function escada(C, x0, x1, zTopo, yTopo, n, dir, passo, alt, k = 'degrau') {
  for (let i = 0; i < n; i++) {
    const zA = zTopo + dir * i * passo, zB = zA + dir * passo, y = yTopo - (i + 1) * alt;
    const [za, zb] = dir > 0 ? [zA, zB] : [zB, zA];
    /* o piso do degrau: a peça tem o bocel na borda de cima da célula, que
       vai pro lado de onde se desce */
    const F = dir > 0 ? C.plano([x0, y, zb], [1, 0, 0], [0, 0, -1]) : C.plano([x1, y, za], [-1, 0, 0], [0, 0, 1]);
    C.esticar(F, 0, x1 - x0, 0, passo, k);
    /* o espelho, virado pro pé da escada (é quem sobe que o vê; ele
       estava virado pro alto, e de baixo a escada saía vazada) */
    const Fe = dir > 0 ? C.plano([x0, y, za], [1, 0, 0], [0, 1, 0]) : C.plano([x1, y, zb], [-1, 0, 0], [0, 1, 0]);
    C.ladrilhar(Fe, C.ret(0, x1 - x0, 0, alt), 'lisa', { tinta: '#8f8d88' });
  }
}
/* a escada rolante: o patamar de cima, a rampa dos degraus a 30°, o de
   baixo; as duas laterais de inox e vidro fumê e o corrimão */
function rolante(C, x0, x1, z0, yTopo, z1, yBase, dir) {
  const land = 0.9, zA = z0 + dir * land, zB = z1, zC = z1 + dir * land;
  /* U corre pra x menor: U × V aponta pra cima na rampa e no patamar */
  const plano = (za, ya, zb, yb) => {
    const dz = zb - za, dy = yb - ya, L = Math.hypot(dz, dy);
    return [C.plano([x1, ya, za], [-1, 0, 0], [0, dy / L, dz / L]), L];
  };
  for (const [za, ya, zb, yb, k] of [[z0, yTopo, zA, yTopo, 'granito'], [zA, yTopo, zB, yBase, 'rolante'], [zB, yBase, zC, yBase, 'granito']]) {
    const [F, L] = plano(za, ya, zb, yb);
    C.ladrilhar(F, C.ret(0, x1 - x0, 0, L), k, k === 'rolante' ? { tw: x1 - x0, th: 0.4 } : {});
  }
  /* as laterais, de 1 m de altura acompanhando a rampa */
  for (const x of [x0 - 0.04, x1 + 0.04]) {
    const pts = [[z0, yTopo], [zA, yTopo], [zB, yBase], [zC, yBase]];
    for (let i = 0; i < 3; i++) {
      const [za, ya] = pts[i], [zb, yb] = pts[i + 1];
      const P = [[x, ya, za], [x, yb, zb], [x, yb + 1.0, zb], [x, ya + 1.0, za]];
      quad(C, P, 'rolante_lado', null);
      quad(C, [P[1], P[0], P[3], P[2]], 'rolante_lado', null);
      barra(C, [x, ya + 1.02, za], [x, yb + 1.02, zb], 0.07, 'lisa', PRETO);
    }
  }
}
function poco(C, p, ctx) {
  const { S, R } = C;
  const { P0, P1, B0, B1, esc0, esc1, rol0, rol1, zEsc1, zRol0, zRol1 } = p;
  /* a escada desce pra z grande */
  escada(S, esc0, esc1, B0, Y_RUA, 31, 1, DEGRAU, ESPELHO);
  rolante(S, rol0, rol1, B0, Y_RUA, zRol1, Y_MEZ, 1);
  /* a mureta entre as duas, de inox, acompanhando a escada */
  S.pintar(INOX);
  for (let i = 0; i < 31; i++) {
    const z = B0 + i * DEGRAU, y = Y_RUA - (i + 1) * ESPELHO;
    S.caixa(esc1, rol0 - 0.04, y, y + 1.0, z, z + DEGRAU, { todas: 'lisa', base: null });
  }
  S.pintar(null);
  /* o corrimão da escada na parede */
  barra(S, [esc0 + 0.06, Y_RUA + 0.9, B0], [esc0 + 0.06, Y_MEZ + 0.9, zEsc1], 0.05, 'lisa', INOX);
  /* O AZULEJO AZUL: as duas paredes do poço. Até o mezanino (z0 dele) a
     parede desce inteira, da rua ao chão de baixo; dali em diante o poço
     já é o mezanino, e o azulejo é só a borda da laje, da rua ao teto
     dele; e a borda do fundo do buraco */
  const zMez = ctx.zMez, sala = { x0: P0, x1: P1, z0: B0, z1: B1 };
  const faixaZ = (lado, za, zb, y0, y1) => lado === 'o'
    ? naParede(S, sala, 'o', sala.z1 - zb, sala.z1 - za, y0, y1, 'azulejo_azul', { ob: Y_RUA - y0 }, 0)
    : naParede(S, sala, 'l', za - sala.z0, zb - sala.z0, y0, y1, 'azulejo_azul', { ob: Y_RUA - y0 }, 0);
  for (const lado of ['o', 'l']) {
    faixaZ(lado, B0, zMez, Y_MEZ, Y_RUA);
    faixaZ(lado, zMez, B1, Y_MEZ_TETO, Y_RUA);
  }
  naParede(S, sala, 's', 0, P1 - P0, Y_MEZ_TETO, Y_RUA, 'azulejo_azul', {}, 0);
  ctx.poco = sala;
}

/* =======================================================
   O MEZANINO E A PLATAFORMA
   ======================================================= */
function mezanino(C, e, ctx) {
  const { S } = C;
  /* do pé da escada da rua até 14 m pra dentro, do lado da plataforma */
  const x1 = ctx.T.x1, x0 = x1 - 14.1, z0 = 6.5, z1 = Math.max(12.5, e.zRol1 + 1.2);
  const catraca = x0 + 5.3;
  const sala = { x0, x1, z0, z1 };
  const alt = Y_MEZ_TETO - Y_MEZ;
  /* o piso de granito, com o buraco da escada pra plataforma */
  const bx0 = x0, bx1 = x0 + 4.0, bz0 = 7.4, bz1 = 9.8;
  for (const [a0, b0, a1, b1] of [[x0, z0, x1, bz0], [x0, bz1, x1, z1], [bx1, bz0, x1, bz1]])
    S.tampa([[a0, b1], [a1, b1], [a1, b0], [a0, b0]], Y_MEZ, 'granito', false);
  const p0 = e.P0 - 0.2, p1 = e.P1 + 0.2;
  for (const [a0, b0, a1, b1] of [[x0, z0, p0, z1], [p1, z0, x1, z1], [p0, e.B1, p1, z1]])
    S.tampa([[a0, b0], [a1, b0], [a1, b1], [a0, b1]], Y_MEZ_TETO, 'forro', true);
  /* as paredes: azulejo claro com a faixa azul; a do norte tem o vão do
     poço (a escada da rua chega por ali) */
  const faixas = (lado, a0, a1) => {
    naParede(S, sala, lado, a0, a1, Y_MEZ, Y_MEZ + 2.3, 'azulejo_claro');
    naParede(S, sala, lado, a0, a1, Y_MEZ + 2.3, Y_MEZ + 2.55, 'lisa', { tinta: AZUL });
    naParede(S, sala, lado, a0, a1, Y_MEZ + 2.55, Y_MEZ_TETO, 'lisa', { tinta: '#dcdad3' });
  };
  faixas('s', 0, x1 - x0);
  faixas('o', 0, z1 - z0);
  faixas('l', 0, z1 - z0);
  faixas('n', 0, e.P0 - 0.2 - x0);
  faixas('n', e.P1 + 0.2 - x0, x1 - x0);
  ctx.marcaSub(x0, x1, z0, z1, 'mezanino');
  /* A BILHETERIA na parede sul, do lado de quem chega, e o mapa da linha */
  const bil0 = catraca + 0.6, bil1 = bil0 + 3.0;
  naParede(S, sala, 's', x1 - bil1, x1 - bil0, Y_MEZ, Y_MEZ + 2.6, 'bilheteria', { modo: 'esticar' }, 0.004);
  S.caixa(bil0, bil1, Y_MEZ, Y_MEZ + 1.0, z1 - 0.55, z1 - 0.004, { todas: lisa('#9ea3a6'), topo: lisa(INOX), base: null });
  naParede(S, sala, 'o', 0.6, 3.0, Y_MEZ + 1.3, Y_MEZ + 2.2, 'mapa', { modo: 'esticar' }, 0.01);
  naParede(S, sala, 'n', x1 - x0 - 1.0, x1 - x0 - 0.01, Y_MEZ, Y_MEZ + 2.3, 'lisa', { tinta: '#dcdad3' }, 0.004);
  /* AS CATRACAS: cinco, atravessando o mezanino, com a porta de vidro do
     cadeirante na ponta */
  for (let i = 0; i < 6; i++) {
    const z = z0 + 0.9 + i * 0.95;
    if (z > z1 - 0.8) break;
    S.caixa(catraca - 0.6, catraca + 0.6, Y_MEZ, Y_MEZ + 1.0, z - 0.15, z + 0.15,
            { todas: lisa(INOX), base: null, frente: { k: 'catraca', modo: 'esticar' }, tras: { k: 'catraca', modo: 'esticar' } });
    if (i < 5) {
      S.caixa(catraca - 0.05, catraca + 0.05, Y_MEZ + 0.85, Y_MEZ + 0.9, z + 0.15, z + 0.6, { todas: lisa(PRETO) });
      ctx.bracos.push({ x0: catraca - 0.05, x1: catraca + 0.05, z0: z + 0.15, z1: z + 0.6, y0: Y_MEZ + 0.85, y1: Y_MEZ + 0.9 });
    }
  }
  ctx.marca(catraca - 0.6, catraca + 0.6, z0 + 0.75, z1 - 0.8, '#8d9295', 'movel', true);
  /* o guarda-corpo dos dois lados do buraco da escada da plataforma. Na
     ponta do leste é a boca da escada (o primeiro degrau sai de bx1 pro
     oeste): ali não tem guarda-corpo — o que tinha tapava a descida; na
     do oeste, a parede do mezanino */
  const gc = 1.05;
  barra(S, [bx0 + 0.02, Y_MEZ + gc, bz0], [bx1, Y_MEZ + gc, bz0], 0.05, 'lisa', INOX);
  barra(S, [bx0 + 0.02, Y_MEZ + gc, bz1], [bx1, Y_MEZ + gc, bz1], 0.05, 'lisa', INOX);
  for (const [p, q] of [[[bx0, bz0], [bx1, bz0]], [[bx0, bz1], [bx1, bz1]]])
    C.V.poli([[p[0], Y_MEZ, p[1]], [q[0], Y_MEZ, q[1]], [q[0], Y_MEZ + gc, q[1]], [p[0], Y_MEZ + gc, p[1]]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  /* as placas penduradas: PLATAFORMA do lado pago, SAÍDA do outro */
  ctx.pendurada(catraca - 1.6, Y_MEZ_TETO - 0.45, (z0 + z1) / 2, 'PLATAFORMA · SENTIDO ' + ctx.sentido, -1);
  ctx.pendurada(catraca + 1.8, Y_MEZ_TETO - 0.45, (z0 + z1) / 2 - 1.2, 'SAÍDA · RUA', 1);
  return { x0, x1, z0, z1, bx0, bx1, bz0, bz1, catraca };
}

function plataforma(C, L, mz, ctx) {
  const { S } = C;
  const sala = { x0: 0, x1: L, z0: 0, z1: LARG };
  const zP = LARG - PAREDE;                                          // a parede do fundo da plataforma
  /* o chão: a plataforma (piso, faixa amarela, pedra da borda) e o leito
     do trilho 1,1 m abaixo */
  S.tampa([[0, zP], [L, zP], [L, BORDA_Z + 0.75], [0, BORDA_Z + 0.75]], Y_PLAT, 'piso', false);
  S.tampa([[0, BORDA_Z + 0.75], [L, BORDA_Z + 0.75], [L, BORDA_Z + 0.35], [0, BORDA_Z + 0.35]], Y_PLAT, 'tatil', false);
  S.tampa([[0, BORDA_Z + 0.35], [L, BORDA_Z + 0.35], [L, BORDA_Z], [0, BORDA_Z]], Y_PLAT, 'borda', false);
  ctx.marcaSub(0, L, BORDA_Z, zP, 'plataforma');
  /* a cara da plataforma, de frente pro trilho */
  S.ladrilhar(S.plano([L, Y_LEITO, BORDA_Z], [-1, 0, 0], [0, 1, 0]), S.ret(0, L, 0, Y_PLAT - Y_LEITO), 'teto', { tinta: '#8b8983' });
  leito(S, 0, L, PAREDE, BORDA_Z);
  ctx.marcaSub(0, L, 0, LARG, 'salao');
  /* as paredes do comprido: azulejo claro até 2,4 m, a faixa azul, o
     friso de triângulos e o reboco até o teto */
  const paredeLonga = lado => {
    const y0 = lado === 'n' ? Y_LEITO : Y_PLAT;
    const s = { x0: 0, x1: L, z0: lado === 'n' ? PAREDE : 0, z1: zP };
    naParede(S, s, lado, 0, L, y0, Y_PLAT + 2.4, 'azulejo_claro', { ob: Y_PLAT - y0 });
    naParede(S, s, lado, 0, L, Y_PLAT + 2.4, Y_PLAT + 2.62, 'lisa', { tinta: AZUL });
    naParede(S, s, lado, 0, L, Y_PLAT + 2.62, Y_PLAT + 3.42, 'friso', { th: 0.8 });
    naParede(S, s, lado, 0, L, Y_PLAT + 3.42, Y_TETO, 'teto', { tinta: '#b9b6ae' });
  };
  paredeLonga('n');
  paredeLonga('s');
  /* o teto, só de baixo (com o buraco da escada do mezanino), e a faixa
     de luz comprida */
  for (const [a0, b0, a1, b1] of [[0, PAREDE, L, mz.bz0], [0, mz.bz1, L, zP], [0, mz.bz0, mz.bx0, mz.bz1], [mz.bx1, mz.bz0, L, mz.bz1]])
    S.tampa([[a0, b0], [a1, b0], [a1, b1], [a0, b1]], Y_TETO, 'teto', true);
  for (const z of [BORDA_Z + 0.3, zP - 1.4])
    S.tampa([[0.5, z - 0.08], [L - 0.5, z - 0.08], [L - 0.5, z + 0.08], [0.5, z + 0.08]], Y_TETO - 0.06, 'lisa', true, { tinta: '#fffbea' });
  /* AS PONTAS: o tijolo marrom com a boca do túnel em arco */
  const alt = Y_TETO - Y_LEITO;
  for (const oeste of [true, false]) {
    /* a parede do oeste olha pro leste (a vai de zP pra PAREDE); a do
       leste olha pro oeste (a vai de PAREDE pra zP) */
    const F = oeste ? S.plano([0, Y_LEITO, zP], [0, 0, -1], [0, 1, 0]) : S.plano([L, Y_LEITO, PAREDE], [0, 0, 1], [0, 1, 0]);
    const larg = zP - PAREDE, ac = oeste ? zP - TRILHO_Z : TRILHO_Z - PAREDE;
    paredeComBoca(S, F, larg, alt, ac, 'tijolo');
  }
  /* A PLATAFORMA MOBILIADA ------------------------------------------
     os bancos de ripa laranja no pé da parede do fundo e os anúncios
     entre eles, fora do trecho da escada do mezanino (que desce colada
     na parede) */
  const livre = (a, b) => b < ctx.xPe - 0.6 || a > mz.bx1 + 0.4;
  const bancos = [], anuncios = [];
  for (let x = 2.4; x < L - 4.0; x += 4.6) {
    if (livre(x, x + 1.8)) bancos.push(x);
    if (livre(x + 2.45, x + 3.65)) anuncios.push(x + 2.45);
  }
  for (const x of bancos) {
    S.caixa(x, x + 1.8, Y_PLAT + 0.42, Y_PLAT + 0.47, zP - 0.5, zP - 0.08, { todas: lisa('#b5572d'), base: lisa('#7a3a1e') });
    S.caixa(x, x + 1.8, Y_PLAT + 0.47, Y_PLAT + 0.9, zP - 0.12, zP - 0.06, { todas: lisa('#b5572d') });
    for (const px of [x + 0.15, x + 1.65]) S.caixa(px - 0.03, px + 0.03, Y_PLAT, Y_PLAT + 0.42, zP - 0.45, zP - 0.12, { todas: lisa(PRETO), base: null });
    ctx.marca(x, x + 1.8, zP - 0.5, zP - 0.08, '#b5572d', 'movel', true);
  }
  anuncios.forEach((xa, i) => {
    const k = ['anuncio1', 'anuncio2', 'anuncio3', 'anuncio4'][i % 4];
    S.caixa(xa - 0.05, xa + 1.25, Y_PLAT + 1.05, Y_PLAT + 2.95, zP - 0.12, zP - 0.004, { todas: lisa('#2a2c2f'), base: null });
    naParede(S, { x0: 0, x1: L, z0: 0, z1: zP - 0.12 }, 's', L - xa - 1.2, L - xa, Y_PLAT + 1.1, Y_PLAT + 2.9, k, { modo: 'esticar' }, 0.004);
  });
  /* o nome da estação na parede: no fundo da plataforma e do outro lado
     do trilho, pra quem está no trem */
  for (let x = 6; x < L - 4; x += 12) {
    ctx.placa('nome', ctx.nome.toUpperCase(), AZUL, '#ffffff', x, Y_PLAT + 3.0, zP - 0.02, 0, -1, 2.6, 0.62);
    ctx.placa('nome', ctx.nome.toUpperCase(), AZUL, '#ffffff', x + 6, Y_PLAT + 2.2, PAREDE + 0.02, 0, 1, 2.6, 0.62);
  }
  /* OS PAINÉIS DOS PRÓXIMOS TRENS, pendurados em dois tubos, e a câmera */
  const kp = ctx.painel;
  for (const x of [L * 0.3, L * 0.62]) {
    const z = BORDA_Z + 2.2, y0 = Y_TETO - 1.55, y1 = y0 + 0.8;
    S.caixa(x - 1.5, x + 1.5, y0, y1, z - 0.12, z + 0.12, { todas: lisa(PRETO), frente: { k: kp, modo: 'esticar' }, tras: { k: kp, modo: 'esticar' } });
    for (const dx of [-1.1, 1.1]) S.caixa(x + dx - 0.03, x + dx + 0.03, y1, Y_TETO, z - 0.03, z + 0.03, { todas: lisa(PRETO) });
    S.caixa(x + 1.2, x + 1.45, y1 + 0.3, y1 + 0.5, z - 0.1, z + 0.18, { todas: lisa('#e5e5e0') });
  }
  /* o extintor e a placa de saída no pé da escada */
  S.caixa(L - 2.0, L - 1.8, Y_PLAT + 0.3, Y_PLAT + 0.85, zP - 0.2, zP - 0.02, { todas: lisa(VERMELHO) });
  return { zP };
}
/* o leito do trilho: o dormente e a brita da célula e os dois trilhos de
   aço por cima, de x0 a x1 ao longo do eixo z = TRILHO_Z */
function leito(C, x0, x1, z0, z1) {
  C.tampa([[x0, TRILHO_Z + 1.3], [x1, TRILHO_Z + 1.3], [x1, TRILHO_Z - 1.3], [x0, TRILHO_Z - 1.3]], Y_LEITO, 'lastro', false, { th: 2.6, ob: -(TRILHO_Z + 1.3) });
  if (z0 < TRILHO_Z - 1.3) C.tampa([[x0, TRILHO_Z - 1.3], [x1, TRILHO_Z - 1.3], [x1, z0], [x0, z0]], Y_LEITO, 'borda', false, { tinta: '#8f8d88' });
  if (z1 > TRILHO_Z + 1.3) C.tampa([[x0, z1], [x1, z1], [x1, TRILHO_Z + 1.3], [x0, TRILHO_Z + 1.3]], Y_LEITO, 'borda', false, { tinta: '#8f8d88' });
  C.pintar('#9aa0a4');
  for (const dz of [-0.72, 0.72]) C.caixa(x0, x1, Y_LEITO, Y_TRILHO, TRILHO_Z + dz - 0.035, TRILHO_Z + dz + 0.035, { todas: 'lisa', base: null });
  C.pintar(null);
}

/* =======================================================
   A ESTAÇÃO INTEIRA
   ======================================================= */
/* `est`: a estação de `gerarProposta().metro.estacoes`. Devolve os
   decalques com texto, a planta baixa (o que está na rua e o que está
   embaixo, à parte) e onde o trem para (no mundo). */
export function montarEstacao(est, destino = {}, opc = {}) {
  const S0 = est.salao, Lh = (S0.x1 - S0.x0) / M, giro = !!est.giro;
  /* do referencial da estação pro mundo (a Norte é a Poente girada 180°) */
  const noMundo = (x, z) => giro ? [S0.x0 + (Lh - x) * M, S0.y0 + (LARG - z) * M] : [S0.x0 + x * M, S0.y0 + z * M];
  const doMundo = (wx, wy) => giro ? [Lh - (wx - S0.x0) / M, LARG - (wy - S0.y0) / M] : [(wx - S0.x0) / M, (wy - S0.y0) / M];
  const [ax, az] = doMundo(est.entrada.x0, est.entrada.y0), [bx, bz] = doMundo(est.entrada.x1, est.entrada.y1);
  const T = { x0: Math.min(ax, bx), x1: Math.max(ax, bx), z0: Math.min(az, bz), z1: Math.max(az, bz) };
  const C = construtores();
  const marcas = [], sub_ = [], placas = [];
  const ctx = {
    T, nome: est.nome, sentido: (opc.outra || '').toUpperCase(), painel: opc.painel || 'partidas_norte',
    marca(x0, x1, z0, z1, cor, tipo = 'piso', embaixo = false) { (embaixo ? sub_ : marcas).push({ x0, x1, z0, z1, cor, tipo }); },
    marcaSub(x0, x1, z0, z1, tipo) { sub_.push({ x0, x1, z0, z1, cor: '#2b3f9c', tipo }); },
    placa(tipo, texto, fundo, tinta, x, y, z, nx, nz, larg, alt) { placas.push({ tipo, texto, fundo, tinta, x, y, z, nx, nz, larg, alt }); },
    /* a placa pendurada no teto: a caixa azul e o texto dos dois lados */
    pendurada(x, y, z, texto, lado) {
      const w = Math.min(3.2, 0.32 * texto.length + 0.6), h = 0.36;
      C.S.caixa(x - 0.08, x + 0.08, y - h / 2, y + h / 2, z - w / 2, z + w / 2, { todas: lisa(AZUL) });
      for (const s of [-1, 1]) placas.push({ tipo: 'pendurada', texto, fundo: AZUL, tinta: '#ffffff', x: x + s * 0.085, y, z, nx: s, nz: 0, larg: w - 0.06, alt: h - 0.06 });
      C.S.caixa(x - 0.02, x + 0.02, y + h / 2, Y_MEZ_TETO, z - 0.02, z + 0.02, { todas: lisa(PRETO) });
    }
  };
  ctx.zMez = 6.5;
  ctx.bracos = [];
  const e = entrada(C, T, ctx);
  const mz = mezanino(C, e, ctx);
  /* a escada do mezanino pra plataforma: desce pro oeste, no lado pago */
  const nP = Math.round((Y_MEZ - Y_PLAT) / 0.17), aP = (Y_MEZ - Y_PLAT) / nP;
  escadaX(C.S, mz.bx1, Y_MEZ, nP, -1, DEGRAU, aP, mz.bz0 + 0.1, mz.bz1 - 0.1);
  const xPe = mz.bx1 - nP * DEGRAU;
  ctx.xPe = xPe;
  ctx.marca(xPe, mz.bx1, mz.bz0, mz.bz1, '#8b8983', 'escada', true);
  /* a mureta de azulejo dos dois lados da descida: do chão da plataforma
     até um metro acima do degrau (lá em cima ela vira o guarda-corpo do
     buraco), com o corrimão de inox */
  for (const z of [mz.bz0, mz.bz1]) {
    const P = [[xPe, Y_PLAT, z], [mz.bx1, Y_PLAT, z], [mz.bx1, Y_MEZ + 1.0, z], [xPe, Y_PLAT + 1.0, z]];
    quad(C.S, P, 'azulejo_claro', [xPe + 2, Y_PLAT + 0.5, z - 1]);
    quad(C.S, P, 'azulejo_claro', [xPe + 2, Y_PLAT + 0.5, z + 1]);
    barra(C.S, [xPe, Y_PLAT + 1.02, z], [mz.bx1, Y_MEZ + 1.02, z], 0.06, 'lisa', INOX);
  }
  plataforma(C, Lh, mz, ctx);
  /* os tocos de túnel: o da ponta morta, e o da ponta da linha (que a
     viagem troca pelo túnel inteiro) */
  if (!opc.semToco) tocoDeTunel(C.S, Lh, Lh + 14.4, 1);
  tocoDeTunel(C.S, 0, -9.6, -1);

  /* ---- do referencial pro mundo ---- */
  const y0 = opc.y0 || 0;
  const bloco = Cn => {
    const n = Cn.pos.length / 3;
    if (!n) return null;
    const pos = new Float32Array(n * 3), p = Cn.pos;
    for (let i = 0; i < n; i++) {
      const [wx, wz] = noMundo(p[3 * i], p[3 * i + 2]);
      pos[3 * i] = wx; pos[3 * i + 1] = y0 + p[3 * i + 1] * M; pos[3 * i + 2] = wz;
    }
    return { pos, uv: new Float32Array(Cn.uv), cor: new Float32Array(Cn.cor) };
  };
  for (const [Cn, lista] of [[C.R, 'metro'], [C.S, 'metro_sub'], [C.G, 'grades'], [C.V, 'vidros']]) {
    const b = bloco(Cn);
    if (b) (destino[lista] = destino[lista] || []).push(b);
  }
  const [ox, oz] = noMundo(0, 0);
  const dirMundo = (nx, nz) => { const [a, b] = noMundo(nx, nz); return [a - ox, b - oz]; };
  const placasMundo = placas.map(p => {
    const [x, z] = noMundo(p.x, p.z), [dx, dz] = dirMundo(p.nx, p.nz), n = Math.hypot(dx, dz) || 1;
    return { ...p, x, y: y0 + p.y * M, z, ox: dx / n, oz: dz / n, larg: p.larg * M, alt: p.alt * M };
  });
  const retMundo = r => {
    const [a0, b0] = noMundo(r.x0, r.z0), [a1, b1] = noMundo(r.x1, r.z1);
    return { x0: Math.min(a0, a1), x1: Math.max(a0, a1), y0: Math.min(b0, b1), y1: Math.max(b0, b1), cor: r.cor, tipo: r.tipo };
  };
  const ret3 = (x0, x1, z0, z1) => { const r = retMundo({ x0, x1, z0, z1 }); return { x0: r.x0, x1: r.x1, z0: r.y0, z1: r.y1 }; };
  const [px, pz] = noMundo(Lh / 2, TRILHO_Z);
  return {
    placas: placasMundo, planta2d: marcas.map(retMundo), subsolo: sub_.map(retMundo),
    parada: { x: px, y: y0 + Y_TRILHO * M, z: pz, dir: giro ? -1 : 1 },
    /* o olho de quem desce: perto da ponta morta, entre a borda e a
       mureta da escada (fora do plano dela, que de lado vira um risco),
       olhando pro túnel da linha (o trem à esquerda, a parede à direita) */
    olhar: { x: noMundo(2.8, 6.4)[0], y: y0 + (Y_PLAT + 1.65) * M, z: noMundo(2.8, 6.4)[1] },
    niveis: { rua: Y_RUA, mezanino: Y_MEZ, plataforma: Y_PLAT },
    /* PRA QUEM ANDA (o boneco a pé do cenário), no mundo: o POÇO (o
       buraco da rua por onde a escada e a rolante descem: ali a rua não
       tem chão) e a BOCA dele (o ponto da praça na frente da escada), o
       MEZANINO e a PLATAFORMA, a CAIXA da estação inteira (o salão, o
       mezanino e o terreno da entrada), a BORDA da plataforma (o degrau
       de 1,1 m pro trilho, que não tem parede), os BRAÇOS das catracas
       (giram: o corpo passa) e a altura de cada nível e do teto dele
       (m). Os retângulos vão em x e z do 3D (o z é o y da planta) */
    andar: {
      boca: noMundo((e.P0 + e.P1) / 2, T.z0 + 0.8),
      poco: ret3(e.P0, e.P1, e.B0, e.B1),
      mezanino: ret3(mz.x0, mz.x1, mz.z0, mz.z1),
      plataforma: ret3(0, Lh, BORDA_Z, LARG - PAREDE),
      caixa: ret3(Math.min(0, mz.x0, T.x0), Math.max(Lh, mz.x1, T.x1), Math.min(0, mz.z0, T.z0), Math.max(LARG, mz.z1, T.z1)),
      borda: [...noMundo(0, BORDA_Z), ...noMundo(Lh, BORDA_Z), y0 + Y_PLAT * M],
      bracos: ctx.bracos.map(b => ({ ...ret3(b.x0, b.x1, b.z0, b.z1), y0: y0 + b.y0 * M, y1: y0 + b.y1 * M })),
      niveis: { rua: Y_RUA, mezanino: Y_MEZ, tetoMezanino: Y_MEZ_TETO, plataforma: Y_PLAT, tetoPlataforma: Y_TETO }
    }
  };
}
/* a escada que desce em x (a do mezanino pra plataforma): o piso virado
   pra cima, com o bocel na borda de onde se desce, e o espelho virado
   pro pé da escada (os dois estavam do avesso: de cima o degrau sumia, e
   o boneco a pé não tinha onde pisar) */
function escadaX(C, xTopo, yTopo, n, dir, passo, alt, z0, z1) {
  for (let i = 0; i < n; i++) {
    const xA = xTopo + dir * i * passo, xB = xA + dir * passo, y = yTopo - (i + 1) * alt;
    const [xa, xb] = dir > 0 ? [xA, xB] : [xB, xA];
    const F = dir < 0 ? C.plano([xb, y, z1], [0, 0, -1], [-1, 0, 0]) : C.plano([xa, y, z0], [0, 0, 1], [1, 0, 0]);
    C.esticar(F, 0, z1 - z0, 0, passo, 'degrau');
    const Fe = dir < 0 ? C.plano([xb, y, z0], [0, 0, 1], [0, 1, 0]) : C.plano([xa, y, z1], [0, 0, -1], [0, 1, 0]);
    C.ladrilhar(Fe, C.ret(0, z1 - z0, 0, alt), 'lisa', { tinta: '#8f8d88' });
  }
}
/* o toco do túnel na ponta da plataforma (reto, no eixo do trilho) */
function tocoDeTunel(C, xA, xB, dir) {
  const x0 = Math.min(xA, xB), x1 = Math.max(xA, xB);
  leito(C, x0, x1, TRILHO_Z - 2.3, TRILHO_Z + 2.3);
  const perfil = perfilDoTunel();
  for (let a = x0; a < x1 - 1e-3; a += 2.4) {
    const b = Math.min(x1, a + 2.4);
    for (let i = 0; i < perfil.length - 1; i++) {
      const [r0, h0] = perfil[i], [r1, h1] = perfil[i + 1];
      const P = [[a, Y_LEITO + h0, TRILHO_Z + r0], [b, Y_LEITO + h0, TRILHO_Z + r0], [b, Y_LEITO + h1, TRILHO_Z + r1], [a, Y_LEITO + h1, TRILHO_Z + r1]];
      quad(C, P, 'tunel', [(a + b) / 2, Y_LEITO + 2.4, TRILHO_Z], { parte: [0, (b - a) / 2.4, 0, Math.min(1, Math.hypot(r1 - r0, h1 - h0) / 2.4)] });
    }
  }
  /* no fim do toco que segue pra outra estação, o escuro do túnel (a
     seção inteira, virada pra plataforma) */
  if (dir > 0) {
    const perfil2 = perfilDoTunel();
    for (let i = 1; i < perfil2.length - 2; i++) {
      const P = [[x1, Y_LEITO, TRILHO_Z], [x1, Y_LEITO + perfil2[i][1], TRILHO_Z + perfil2[i][0]], [x1, Y_LEITO + perfil2[i + 1][1], TRILHO_Z + perfil2[i + 1][0]]];
      const c = C.cel('lisa');
      C.pintar('#0d0d0e');
      C.tri(P[0], P[1], P[2], [c[0], c[1]], [c[2], c[1]], [c[2], c[3]]);
      C.pintar(null);
    }
    const c = C.cel('lisa');
    C.pintar('#0d0d0e');
    C.tri([x1, Y_LEITO, TRILHO_Z - 2.3], [x1, Y_LEITO, TRILHO_Z + 2.3], [x1, Y_LEITO + 3.0, TRILHO_Z + 2.3], [c[0], c[1]], [c[2], c[1]], [c[2], c[3]]);
    C.tri([x1, Y_LEITO, TRILHO_Z - 2.3], [x1, Y_LEITO + 3.0, TRILHO_Z + 2.3], [x1, Y_LEITO + 3.0, TRILHO_Z - 2.3], [c[0], c[1]], [c[2], c[3]], [c[0], c[3]]);
    C.pintar(null);
  }
  /* no fim do toco da ponta morta, o para-choque listrado */
  if (dir < 0) {
    C.caixa(x0, x0 + 0.4, Y_LEITO, Y_LEITO + 1.0, TRILHO_Z - 1.0, TRILHO_Z + 1.0, { todas: lisa('#e2b01f') });
    quad(C, [[x0, Y_LEITO, TRILHO_Z + 2.3], [x0, Y_LEITO, TRILHO_Z - 2.3], [x0, Y_LEITO + 4.8, TRILHO_Z - 2.3], [x0, Y_LEITO + 4.8, TRILHO_Z + 2.3]],
         'tunel', [x0 + 1, Y_LEITO + 2, TRILHO_Z], { escuro: 0.6 });
  }
}
/* a seção do túnel: (afastamento do eixo, altura sobre o leito), da
   parede de um lado, pela abóbada, até a outra */
function perfilDoTunel() {
  const hw = 2.3, hp = 3.0, alt = 4.8, pts = [[hw, 0], [hw, hp]];
  const N = 6;
  for (let i = 1; i < N; i++) {
    const t = Math.PI / 2 * i / N;
    pts.push([hw * Math.cos(t), hp + (alt - hp) * Math.sin(t)]);
  }
  pts.push([0, alt]);
  for (let i = N - 1; i >= 1; i--) {
    const t = Math.PI / 2 * i / N;
    pts.push([-hw * Math.cos(t), hp + (alt - hp) * Math.sin(t)]);
  }
  pts.push([-hw, hp], [-hw, 0]);
  return pts;
}

/* =======================================================
   O TÚNEL DE UMA ESTAÇÃO À OUTRA
   ======================================================= */
/* `caminho`: os pontos (x, y) de mundo do eixo do trilho, de uma
   plataforma à outra; `de`/`ate`, a distância em que o túnel começa e
   acaba (fora das estações). Refaz o caminho em passos de 2,4 m (o
   tamanho da peça do revestimento) e levanta o tubo em volta. */
export function montarTunel(caminho, destino = {}, opc = {}) {
  const C = Construtor('metro');
  const acum = [0];
  for (let i = 1; i < caminho.length; i++) acum.push(acum[i - 1] + Math.hypot(caminho[i][0] - caminho[i - 1][0], caminho[i][1] - caminho[i - 1][1]));
  const total = acum[acum.length - 1];
  const em = s => {
    let i = 1;
    while (i < acum.length - 1 && acum[i] < s) i++;
    const t = (s - acum[i - 1]) / Math.max(1e-6, acum[i] - acum[i - 1]);
    return [lerp(caminho[i - 1][0], caminho[i][0], t), lerp(caminho[i - 1][1], caminho[i][1], t)];
  };
  const de = opc.de || 0, ate = opc.ate === undefined ? total : opc.ate, passo = 2.4 * M;
  const n = Math.max(1, Math.round((ate - de) / passo));
  const secoes = [];
  for (let k = 0; k <= n; k++) {
    const s = de + (ate - de) * k / n, p = em(s), q = em(Math.min(total, s + 5)), r = em(Math.max(0, s - 5));
    const dx = q[0] - r[0], dz = q[1] - r[1], l = Math.hypot(dx, dz) || 1;
    secoes.push({ p, lado: [-dz / l, dx / l] });                           // o lado direito de quem anda
  }
  const perfil = perfilDoTunel(), y0 = opc.y0 || 0, Y = h => y0 + (Y_LEITO + h) * M;
  const ponto = (sec, r, h) => [sec.p[0] + sec.lado[0] * r * M, Y(h), sec.p[1] + sec.lado[1] * r * M];
  for (let k = 0; k < n; k++) {
    const A = secoes[k], B = secoes[k + 1];
    const meio = [(A.p[0] + B.p[0]) / 2, Y(2.4), (A.p[1] + B.p[1]) / 2];
    for (let i = 0; i < perfil.length - 1; i++) {
      const [r0, h0] = perfil[i], [r1, h1] = perfil[i + 1];
      quad(C, [ponto(A, r0, h0), ponto(B, r0, h0), ponto(B, r1, h1), ponto(A, r1, h1)], 'tunel', meio,
           { parte: [0, 1, 0, Math.min(1, Math.hypot(r1 - r0, h1 - h0) / 2.4)] });
    }
    /* o chão: a brita com o dormente no meio, o concreto dos lados */
    quad(C, [ponto(A, -1.3, 0), ponto(B, -1.3, 0), ponto(B, 1.3, 0), ponto(A, 1.3, 0)], 'lastro', [meio[0], Y(1), meio[2]]);
    for (const [a, b] of [[-2.3, -1.3], [1.3, 2.3]])
      quad(C, [ponto(A, a, 0.001), ponto(B, a, 0.001), ponto(B, b, 0.001), ponto(A, b, 0.001)], 'borda', [meio[0], Y(1), meio[2]], { tinta: '#8f8d88' });
    /* os trilhos */
    for (const t of [-0.72, 0.72]) {
      for (const [a, b, h] of [[t - 0.035, t + 0.035, 0.15]]) {
        quad(C, [ponto(A, a, h), ponto(B, a, h), ponto(B, b, h), ponto(A, b, h)], 'lisa', [meio[0], Y(2), meio[2]], { tinta: '#9aa0a4' });
        quad(C, [ponto(A, a, 0), ponto(B, a, 0), ponto(B, a, h), ponto(A, a, h)], 'lisa', ponto(A, t - 0.5, 0.07), { tinta: '#6f7477' });
        quad(C, [ponto(A, b, 0), ponto(B, b, 0), ponto(B, b, h), ponto(A, b, h)], 'lisa', ponto(A, t + 0.5, 0.07), { tinta: '#6f7477' });
      }
    }
    /* a luminária na parede, a cada 12 m */
    if (k % 5 === 0) {
      const L0 = ponto(A, 2.29, 2.6), L1 = ponto(B, 2.29, 2.6);
      const c = [(L0[0] * 0.8 + L1[0] * 0.2), L0[1], (L0[2] * 0.8 + L1[2] * 0.2)], d = [(L0[0] * 0.6 + L1[0] * 0.4), L0[1], (L0[2] * 0.6 + L1[2] * 0.4)];
      quad(C, [[c[0], c[1], c[2]], [d[0], d[1], d[2]], [d[0], d[1] + 0.12 * M, d[2]], [c[0], c[1] + 0.12 * M, c[2]]], 'lisa', [meio[0], Y(2.4), meio[2]], { tinta: '#fff3c4' });
    }
  }
  const b = { pos: new Float32Array(C.pos), uv: new Float32Array(C.uv), cor: new Float32Array(C.cor) };
  if (b.pos.length) (destino.metro_sub = destino.metro_sub || []).push(b);
  return { comprimento: total };
}

/* =======================================================
   O TREM — três carros de 11 m
   ======================================================= */
export const TREM = { carro: 11.0, vao: 0.8, largura: 2.7, carros: 3 };
/* o perfil do carro de lado a lado: a parede reta e o teto arredondado */
const PERFIL_CARRO = [[-1.35, 0.05], [1.35, 0.05], [1.35, 3.0], [1.2, 3.25], [0.8, 3.38], [0, 3.42], [-0.8, 3.38], [-1.2, 3.25], [-1.35, 3.0]];
/* `ponta`: 'frente' (a cabine em x+), 'tras' (a cabine em x−) ou 'meio'.
   Devolve os blocos (em unidade de mundo, x ao longo do carro, y a partir
   do topo do trilho) numa lista `metro`. */
export function montarCarro(ponta = 'meio') {
  const C = Construtor('metro');
  const L = TREM.carro, h = L / 2, hw = TREM.largura / 2;
  /* os dois lados: a peça do carro esticada, e o teto em três águas */
  C.esticar(C.plano([-h, 0.05, hw], [1, 0, 0], [0, 1, 0]), 0, L, 0, 2.95, 'trem_lado', { parte: [0, 1, 0.017, 1] });
  C.esticar(C.plano([h, 0.05, -hw], [-1, 0, 0], [0, 1, 0]), 0, L, 0, 2.95, 'trem_lado', { parte: [0, 1, 0.017, 1] });
  for (let i = 2; i < PERFIL_CARRO.length - 1; i++) {
    const [z0, y0] = PERFIL_CARRO[i], [z1, y1] = PERFIL_CARRO[i + 1];
    const l = Math.hypot(z1 - z0, y1 - y0);
    C.ladrilhar(C.plano([-h, y0, z0], [1, 0, 0], [0, (y1 - y0) / l, (z1 - z0) / l]), C.ret(0, L, 0, l), 'trem_teto');
  }
  quad(C, [[-h, 0.05, -hw], [h, 0.05, -hw], [h, 0.05, hw], [-h, 0.05, hw]], 'lisa', [0, -5, 0], { tinta: '#26282b' });
  /* as pontas: a cara (na cabine) ou o fim liso com a sanfona */
  for (const s of [1, -1]) {
    const cab = (ponta === 'frente' && s > 0) || (ponta === 'tras' && s < 0);
    const x = s * h;
    const pts = PERFIL_CARRO.map(([z, y]) => [x, y, -s * z]);
    const c = C.cel(cab ? 'trem_frente' : 'lisa');
    const T = PERFIL_CARRO.map(([z, y]) => [lerp(c[0], c[2], (z + hw) / (2 * hw)), lerp(c[1], c[3], Math.min(1, y / 3.1))]);
    if (!cab) C.pintar('#d8d8d4');
    for (let i = 1; i < pts.length - 1; i++) C.tri(pts[0], pts[i], pts[i + 1], T[0], T[i], T[i + 1]);
    if (!cab) {
      C.pintar(null);
      C.caixa(x - s * 0.02 - 0.2, x - s * 0.02 + 0.2, 0.3, 2.6, -0.8, 0.8, { todas: lisa('#2b2d30') });
    }
  }
  /* os dois truques embaixo, com as rodas */
  for (const s of [1, -1]) {
    const xc = s * (h - 1.9);
    C.caixa(xc - 1.2, xc + 1.2, 0.08, 0.5, -1.0, 1.0, { todas: lisa('#2a2b2d') });
    for (const dx of [-0.75, 0.75]) for (const dz of [-0.72, 0.72])
      C.caixa(xc + dx - 0.36, xc + dx + 0.36, 0.0, 0.62, dz - 0.05, dz + 0.05, { todas: lisa('#3b3c3e') });
  }
  const pos = C.pos.map((v, i) => v * M);
  return { metro: [{ pos: new Float32Array(pos), uv: new Float32Array(C.uv), cor: new Float32Array(C.cor) }], comprimento: L * M };
}
