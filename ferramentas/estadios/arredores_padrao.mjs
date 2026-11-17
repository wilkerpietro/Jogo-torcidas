/* =========================================================
   OS ARREDORES PADRÃO DE UM ESTÁDIO (dono, 16/11/2026: "nos arredores do
   estádio, deve haver uma estrutura de polícia com efetivo policial e
   grades, similar ao que o jogo 3d fazia, e o jogo deve ter 9 quarteirões
   com o quarteirão do estádio estando no meio. As grades devem induzir a
   torcida a fazer a rota até a sua respectiva entrada pro seu local").

   Serve pra todo estádio que NÃO está na lista dos arredores de verdade (os
   21 dos grandes, que levam as ruas do mapa). A ficha pede com
   `arredoresPadrao: true` (ou um objeto com ajustes) e este módulo devolve o
   `arredores` pronto, no formato de arredores.mjs:

   · OS 9 QUARTEIRÕES: o do estádio no meio e oito em volta, separados por
     quatro ruas (duas ao longo do campo, duas atravessadas) que seguem até a
     beira da cena. As casas dos oito de fora são as do jogo 3D antigo, uma
     fileira de frente pra cada rua (arredores.mjs as põe).
   · O QUARTEIRÃO DO ESTÁDIO: o SÓLIDO (o estádio com os muros e os prédios
     dele: o casco de tudo o que a ficha desenha em pé) e, em volta, o
     calçadão até a rua.
   · AS ENTRADAS: três do mandante (1º, 2º e 3º escalão) e uma da visitante,
     cada uma na beira do sólido, virada pro setor dela (`jogo.mandante1..3`
     e `jogo.visitante` da ficha).
   · AS GRADES QUE CONDUZEM: o GRADIL contínuo entre a calçada e o calçadão,
     em volta do quarteirão inteiro, aberto só na frente de cada entrada, e
     de cada abertura o FUNIL de dois gradis até o portão.
   · O CORDÃO DA POLÍCIA: a zona da visitante é o pedaço do contorno do
     quarteirão em volta da entrada dela, até a metade do caminho da entrada
     mandante mais próxima de cada lado. Em cada ponta, a GRADE DE PROTEÇÃO
     atravessa a rua (é a que quebra) e o gradil atravessa o calçadão até o
     estádio; atrás dela, do lado do mandante, o efetivo da PM. Há PM também
     em cada portão.
   · OS BONDES: chegam pelas pontas das ruas, na beira da cena. Os da
     visitante, pelas pontas que ficam dentro da zona dela; os do mandante,
     pelas outras.

   AJUSTES (`arredoresPadrao: { ... }`): `solido` (o contorno do que não se
   pisa, quando o casco não serve), `margem` (a largura da calçada em volta do estádio, 7 m),
   `fundo` (a fundura dos quarteirões de fora, 62 m), `ruas` (os nomes:
   { cima, baixo, esquerda, direita }), `portoes` ([{ n, nome, u, v, dir }])
   com `entradaDe` ({ mandante1: n, .., visitante: n }), `tiras` (pisos a
   recortar a mais), `pisos` (pisos a mais, desenhados), `entorno`, `px`.
   ========================================================= */
import { colunasDe, raioDe } from './estadio_lowpoly.mjs';
/* QUEM TEM os arredores padrão. O Centro-Oeste entrou estádio a estádio; o Sul e o Sudeste entraram de uma vez (dono,
   16/11/2026: "Pode aplicar esse padrão aos demais estádios do sul e sudeste que já fizemos, fora os que são diferenciados").
   Os diferenciados não entram aqui: levam `arredores` na própria ficha, com as ruas e as casas do lugar de verdade
   (Maracanã, Nilton Santos, São Januário, Mineirão, Arena MRV, Independência, Morumbi, Allianz Parque, Neo Química Arena,
   Vila Belmiro, Arena da Baixada, Couto Pereira, Beira-Rio, Arena do Grêmio, Ilha do Retiro, Arruda, Aflitos, Barradão,
   Fonte Nova, Castelão, Mangueirão e Serra Dourada). */
export const COM_PADRAO = new Set([
  /* o Centro-Oeste */
  'estadio-dutrinha', 'estadio-arena-pantanal', 'estadio-serejao', 'estadio-bezerrao', 'estadio-jonas-duarte',
  'estadio-antonio-accyoly',
  /* o Rio Grande do Sul */
  'estadio-alfredo-jaconi', 'estadio-centenario', 'estadio-colosso-da-lagoa', 'estadio-bento-freitas', 'estadio-boca-do-lobo',
  'estadio-passo-dareia',
  /* Santa Catarina */
  'estadio-heriberto-hulse', 'estadio-arena-conda', 'estadio-da-ressacada', 'estadio-orlando-scarpelli', 'estadio-arena-joinville',
  /* o Paraná */
  'estadio-vila-capanema', 'estadio-do-cafe', 'estadio-germano-kruger', 'estadio-willie-davids',
  /* São Paulo */
  'estadio-caninde', 'estadio-moises-lucarelli', 'estadio-brinco-de-ouro', 'estadio-ulrico-mursa', 'estadio-anacleto-campanella',
  'estadio-bruno-daniel', 'estadio-primeiro-de-maio', 'estadio-jayme-cintra', 'estadio-nabi-abi-chedid', 'estadio-santa-cruz',
  'estadio-alfredo-de-castilho', 'estadio-maiao', 'estadio-novelli-junior', 'estadio-jorge-ismael-de-biasi', 'estadio-limeirao',
  'estadio-barao-de-serra-negra',
  /* Minas Gerais */
  'estadio-joaquim-portugal', 'estadio-bernardo-rubinger-de-queiroz', 'estadio-zama-maciel',
  /* o Rio de Janeiro */
  'estadio-moca-bonita', 'estadio-conselheiro-galvao', 'estadio-ary-de-oliveira-e-souza', 'estadio-giulite-coutinho', 'estadio-raulino-de-oliveira',
  'estadio-godofredo-cruz',
  /* o Norte (o Pará) */
  'estadio-do-souza', 'estadio-zinho-de-oliveira',
  /* o Amazonas */
  'estadio-carlos-zamith', 'estadio-da-colina',
  /* o Nordeste (a Bahia, Sergipe, Alagoas) */
  'estadio-joia-da-princesa', 'estadio-batistao', 'estadio-etelvino-mendonca', 'estadio-rei-pele',
  'estadio-fumeirao',
  /* Pernambuco */
  'estadio-lacerdao'
]);
const RAD = Math.PI / 180;
const dentroPoli = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
/* o casco convexo de uma nuvem de pontos */
function casco(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), vira = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && vira(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length >= 2 && vira(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
/* o sólido do estádio: tudo o que a ficha põe em pé (as arquibancadas, os muros, os prédios, os postes) */
function solidoDe(ficha) {
  const pts = [];
  /* (as arquibancadas pelo desenho de verdade, coluna a coluna: o teste de chão de um lance `reto` sobra em cunha nas pontas) */
  for (const anel of ficha.aneis || []) for (const t of anel.trechos) { if (t.tipo === 'vazio') continue;
    if (t.tipo === 'passagem') { for (let a = t.de; a <= t.ate; a += 3) { const r = raioDe(a, t.fora || anel.fora); pts.push([Math.cos(a * RAD) * r, Math.sin(a * RAD) * r]); } continue; }
    const G = colunasDe(ficha, anel, t); for (const a of G.angs) { pts.push(G.pos(a, 0)); pts.push(G.pos(a, 1)); } }
  for (const b of ficha.blocos || []) { if ((b.h || 0) + (b.y || 0) < 1 || b.cobertura) continue; const g = (b.giro || 0) * RAD, c = Math.cos(g), s = Math.sin(g);
    for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) pts.push([b.u + x * b.w * c + z * b.d * s, b.v + x * b.w * s - z * b.d * c]); }
  /* (as arquibancadas retas avulsas, os telhados em polígono e as passarelas também são estádio) */
  for (const r of ficha.retas || []) { const g = r.ang * RAD, o = [Math.cos(g), Math.sin(g)], tg = [-Math.sin(g), Math.cos(g)];
    for (const [x, y] of [[-r.comp / 2, 0], [r.comp / 2, 0], [r.comp / 2, r.prof], [-r.comp / 2, r.prof]]) pts.push([r.u + tg[0] * x + o[0] * y, r.v + tg[1] * x + o[1] * y]); }
  for (const tl of ficha.telhados || []) for (const q of tl.pontos || []) pts.push([q[0], q[1]]);
  for (const q of ficha.passarelas || []) for (const [x, z] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) pts.push([q.u + x * q.w, q.v + z * q.d]);
  for (const k of ficha.conchas || []) for (let t = 0; t < 360; t += 6) pts.push([k.cu + k.a * Math.cos(t * RAD), k.cv + (k.lado === -1 ? -1 : 1) * Math.abs(k.b * Math.sin(t * RAD))]);
  for (const r of ficha.refletores || []) pts.push([r[0], r[1]]);
  const h = casco(pts), cu = h.reduce((q, p) => q + p[0], 0) / h.length, cv = h.reduce((q, p) => q + p[1], 0) / h.length;
  return h.map(p => { const d = Math.hypot(p[0] - cu, p[1] - cv) || 1; return [p[0] + (p[0] - cu) / d * 1.2, p[1] + (p[1] - cv) / d * 1.2]; });
}

/* a meia largura e a meia altura do que a cena de DENTRO do estádio mostra (a mesma conta da bancada) */
function semente(n) { let s = n >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const dSeg = (px, py, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], q = dx * dx + dy * dy || 1e-9, t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / q)); return Math.hypot(px - a[0] - dx * t, py - a[1] - dy * t); };

export function arredoresPadrao(ficha) {
  const o = ficha.arredoresPadrao === true ? {} : (ficha.arredoresPadrao || {});
  const solido = o.solido || solidoDe(ficha), margem = o.margem == null ? 7 : o.margem, fundo = o.fundo == null ? 62 : o.fundo, LARG = 10, CALC = 2.6, MEIA = LARG / 2 + CALC;
  let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const p of solido) { u0 = Math.min(u0, p[0]); u1 = Math.max(u1, p[0]); v0 = Math.min(v0, p[1]); v1 = Math.max(v1, p[1]); }
  u0 = Math.floor(u0 - margem); u1 = Math.ceil(u1 + margem); v0 = Math.floor(v0 - margem); v1 = Math.ceil(v1 + margem);
  /* O QUARTEIRÃO DO ESTÁDIO É SÓ O ESTÁDIO (dono, 16/11/2026: "reduza o tamanho dos quarteirões pro quarteirão ser sempre
     somente o estádio, no caso dos estádios dos arredores genéricos"). Ele já foi o casco mais 12 m de calçadão, esticado
     até cobrir tudo o que a cena de dentro mostra, o que dava uma praça em volta de estádio pequeno; agora é o casco mais
     uma calçada de 7 m, o bastante pro gradil, o funil de cada portão e uma fileira de árvores. As ruas passam rente. */
  const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2, MU = (u1 - u0) / 2 + 2 * MEIA + fundo, MV = (v1 - v0) / 2 + 2 * MEIA + fundo, nomes = o.ruas || {};
  /* as quatro ruas, pelo eixo, até depois da beira da cena */
  const R = { cima: v1 + MEIA, baixo: v0 - MEIA, esquerda: u0 - MEIA, direita: u1 + MEIA };
  const ruas = [
    { nome: nomes.cima || '', tipo: 'residential', larg: LARG, pts: [[cu - MU - 30, R.cima], [cu + MU + 30, R.cima]] }, { nome: nomes.baixo || '', tipo: 'residential', larg: LARG, pts: [[cu - MU - 30, R.baixo], [cu + MU + 30, R.baixo]] },
    { nome: nomes.esquerda || '', tipo: 'residential', larg: LARG, pts: [[R.esquerda, cv - MV - 30], [R.esquerda, cv + MV + 30]] }, { nome: nomes.direita || '', tipo: 'residential', larg: LARG, pts: [[R.direita, cv - MV - 30], [R.direita, cv + MV + 30]] }];
  /* O CONTORNO DO QUARTEIRÃO, andando no sentido anti-horário a partir do canto de baixo à direita: s (metros) → ponto, e
     pra que lado é fora (`n`) e ao longo (`t`) */
  const Wq = u1 - u0, Hq = v1 - v0, P = 2 * (Wq + Hq);
  const noContorno = s => { s = ((s % P) + P) % P;
    if (s < Hq) return { p: [u1, v0 + s], n: [1, 0], t: [0, 1], lado: 'direita' };
    if (s < Hq + Wq) return { p: [u1 - (s - Hq), v1], n: [0, 1], t: [-1, 0], lado: 'cima' };
    if (s < 2 * Hq + Wq) return { p: [u0, v1 - (s - Hq - Wq)], n: [-1, 0], t: [0, -1], lado: 'esquerda' };
    return { p: [u0 + (s - 2 * Hq - Wq), v0], n: [0, -1], t: [1, 0], lado: 'baixo' }; };
  const sDe = (u, v) => { const d = [[u1 - u, Math.max(0, Math.min(Hq, v - v0))], [v1 - v, Hq + Math.max(0, Math.min(Wq, u1 - u))], [u - u0, Hq + Wq + Math.max(0, Math.min(Hq, v1 - v))], [v - v0, 2 * Hq + Wq + Math.max(0, Math.min(Wq, u - u0))]];
    return d.reduce((q, x) => x[0] < q[0] ? x : q)[1]; };
  const CANTOS = [0, Hq, Hq + Wq, 2 * Hq + Wq];   /* (o de baixo à direita, o de cima à direita, o de cima à esquerda, o de baixo à esquerda) */
  /* a beira do sólido numa direção, vista do meio dele */
  const su = solido.reduce((q, p) => q + p[0], 0) / solido.length, sv = solido.reduce((q, p) => q + p[1], 0) / solido.length;
  const beira = ang => { const dx = Math.cos(ang * RAD), dy = Math.sin(ang * RAD); let r = 0; for (let k = 0; k < solido.length; k++) { const [x1, y1] = solido[k], [x2, y2] = solido[(k + 1) % solido.length], ex = x2 - x1, ey = y2 - y1, den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) continue;
      const q = ((x1 - su) * ey - (y1 - sv) * ex) / den, w = ((x1 - su) * dy - (y1 - sv) * dx) / den; if (q > 0 && w >= 0 && w <= 1) r = Math.max(r, q); } return [su + dx * (r + 2.2), sv + dy * (r + 2.2)]; };
  /* AS ENTRADAS: as da ficha, ou uma pra cada setor, na beira do sólido, virada pro setor */
  const J = ficha.jogo || {}, meio = f => f ? (f[0] + f[1]) / 2 : null, ROT = { mandante1: '1º ESCALÃO MANDANTE', mandante2: '2º ESCALÃO MANDANTE', mandante3: '3º ESCALÃO MANDANTE', visitante: 'VISITANTE' };
  let portoes, entradaDe;
  if (o.portoes) { portoes = o.portoes; entradaDe = o.entradaDe; }
  else { portoes = []; entradaDe = {};
    for (const [id, ang] of [['mandante1', meio(J.mandante1)], ['mandante2', meio(J.mandante2)], ['mandante3', meio(J.mandante3)], ['visitante', meio(J.visitante)]]) { if (ang == null) continue;
      /* (o ângulo do setor é visto do meio do campo: o portão fica onde essa direção sai do sólido) */
      const alvo = [Math.cos(ang * RAD) * 400, Math.sin(ang * RAD) * 400], a2 = Math.atan2(alvo[1] - sv, alvo[0] - su) / RAD, g = beira(a2), n = portoes.length + 1;
      portoes.push({ n, nome: id === 'visitante' ? 'PORTÃO ' + n + ' · VISITANTE' : 'PORTÃO ' + n, u: +g[0].toFixed(1), v: +g[1].toFixed(1), dir: [-Math.cos(a2 * RAD), -Math.sin(a2 * RAD)], larg: 9, cor: id === 'visitante' ? '#7a2f2f' : '#1f6a45' }); entradaDe[id] = n; } }
  const portao = n => portoes.find(g => g.n === n);
  /* as aberturas do gradil: uma na frente de cada entrada usada */
  const usadas = [...new Set(Object.values(entradaDe))].map(n => { const g = portao(n), s = sDe(g.u, g.v); return { n, g, s, c: noContorno(s) }; });
  const ABRE = 7, dist = (a, b) => { const d = Math.abs(a - b) % P; return Math.min(d, P - d); };
  const filas = [], grades = [], pm = [];
  /* o gradil em volta do quarteirão, aberto na frente de cada entrada */
  { const cortes = usadas.map(e => [e.s - ABRE, e.s + ABRE]).sort((a, b) => a[0] - b[0]); let s = cortes.length ? cortes[cortes.length - 1][1] - P : 0;
    const trecho = (a, b) => { if (b - a < 2) return; const pts = [noContorno(a).p]; for (const c of [...CANTOS, ...CANTOS.map(x => x + P), ...CANTOS.map(x => x - P)].sort((x, y) => x - y)) if (c > a + 0.5 && c < b - 0.5) pts.push(noContorno(c).p); pts.push(noContorno(b).p); filas.push({ pts }); };
    if (!cortes.length) trecho(0, P); else for (const [a, b] of cortes) { trecho(s, a); s = b; } }
  /* o funil de cada abertura até o portão */
  for (const e of usadas) { const g = e.g, c = e.c, gl = Math.hypot(g.dir[0], g.dir[1]) || 1, tx = -g.dir[1] / gl, ty = g.dir[0] / gl;
    /* O FUNIL ENTRA NA PAREDE (16/11/2026): cada gradil do funil acabava na altura do portão, a 2,2 m da parede do estádio,
       e por essa fresta o campo de rota achava passagem: o bonde entrava pela abertura do portão VIZINHO, que ficava mais
       perto, seguia por dentro, rente à parede, e entalava na ponta do funil (Bruno Daniel, Anacleto Campanella, Nabi Abi
       Chedid, com dois ou três portões no mesmo lado). O gradil agora segue 4,5 m pra dentro do sólido: entre um funil e
       outro não se passa, e cada bonde só chega ao portão pela abertura dele. */
    for (const sg of [-1, 1]) { const k = sg * 5.5 * (tx * c.t[0] + ty * c.t[1] >= 0 ? 1 : -1), q = [g.u + tx * k, g.v + ty * k];
      filas.push({ pts: [[c.p[0] + c.t[0] * sg * ABRE, c.p[1] + c.t[1] * sg * ABRE], q, [q[0] + g.dir[0] / gl * 4.5, q[1] + g.dir[1] / gl * 4.5]] }); }
    /* o PM do portão fica do lado de DENTRO do gradil, ao lado do funil (16/11/2026): na calçada, do lado de fora, ele
       ficava no caminho de quem vem rente ao gradil — o disco não atravessa PM e o campo de rota não o vê, então meia
       dúzia passava a noite empurrando o policial (medido no Jonas Duarte, com o quarteirão reduzido) */
    pm.push([c.p[0] + c.t[0] * (ABRE + 3) - c.n[0] * Math.min(3, margem * 0.45), c.p[1] + c.t[1] * (ABRE + 3) - c.n[1] * Math.min(3, margem * 0.45)]); }
  /* O CORDÃO: a zona da visitante vai, de cada lado da abertura dela, até a metade do caminho da abertura mandante mais
     próxima (no máximo 30% do contorno), e pega pelo menos um canto, que é por onde ela chega */
  const eV = usadas.find(e => e.n === entradaDe.visitante), zona = { de: 0, ate: 0 }, cordoes = [];
  if (eV) {
    const outras = usadas.filter(e => e !== eV), lim = dir => { let m = P * 0.3; for (const e of outras) { const d = ((dir * (e.s - eV.s)) % P + P) % P; if (d > 0) m = Math.min(m, d / 2); } return Math.max(18, m); };
    let a = lim(-1), b = lim(1);
    const cantoEm = (de, ate) => CANTOS.some(c => { const d = ((c - de) % P + P) % P; return d > 6 && d < ((ate - de) % P + P) % P - 6; });
    if (!cantoEm(eV.s - a, eV.s + b)) { /* estica o lado em que o canto está mais perto, até 14 m depois dele (se não bater noutra abertura) */
      const dc = dir => Math.min(...CANTOS.map(c => { const d = ((dir * (c - eV.s)) % P + P) % P; return d > 0 ? d : P; }));
      const da = dc(-1), db = dc(1); if (db <= da) b = Math.max(b, db + 14); else a = Math.max(a, da + 14); }
    zona.de = eV.s - a; zona.ate = eV.s + b;
    for (const [s, sg] of [[zona.de, 1], [zona.ate, -1]]) { const c = noContorno(s);
      /* a grade de proteção atravessa a rua; o gradil atravessa o calçadão até o estádio */
      grades.push({ de: [c.p[0] + c.n[0] * (2 * MEIA - 0.4), c.p[1] + c.n[1] * (2 * MEIA - 0.4)], ate: [c.p[0] + c.n[0] * 0.3, c.p[1] + c.n[1] * 0.3] });
      /* (o gradil vai ao ponto MAIS PERTO do estádio, não reto pra dentro: num quarteirão largo, reto pra dentro ele passava ao
         lado do estádio e fechava o funil da própria visitante — o Jonas Duarte) */
      let perto = null; for (let k = 0; k < solido.length; k++) { const a = solido[k], b = solido[(k + 1) % solido.length], dx = b[0] - a[0], dy = b[1] - a[1], q = dx * dx + dy * dy || 1e-9, t = Math.max(0, Math.min(1, ((c.p[0] - a[0]) * dx + (c.p[1] - a[1]) * dy) / q)), x = a[0] + dx * t, y = a[1] + dy * t, dd = Math.hypot(c.p[0] - x, c.p[1] - y); if (!perto || dd < perto.d) perto = { d: dd, x, y }; }
      const d = perto.d, fim = [perto.x + (perto.x - c.p[0]) / (d || 1) * 1.2, perto.y + (perto.y - c.p[1]) / (d || 1) * 1.2];
      filas.push({ pts: [c.p, fim] }); cordoes.push([c.p, fim]);
      /* o efetivo, atrás da grade, do lado do mandante (`sg` aponta pra dentro da zona: a PM fica do outro lado) */
      for (const [fn, ft] of [[MEIA, 6], [MEIA - 3.5, 9], [-3, 6]]) pm.push([c.p[0] + c.n[0] * fn - c.t[0] * sg * ft, c.p[1] + c.n[1] * fn - c.t[1] * sg * ft]); }
    pm.push([eV.c.p[0] + eV.c.n[0] * MEIA, eV.c.p[1] + eV.c.n[1] * MEIA]);
  }
  /* OS BONDES: as oito pontas de rua (duas em cada canto do quarteirão: a rua de cada lado continua até a beira da cena) */
  const naZona = s => eV && (((s - zona.de) % P + P) % P) < (((zona.ate - zona.de) % P + P) % P);
  const B = 9, pontas = [
    { canto: 0, p: [cu + MU - B, R.baixo] }, { canto: 0, p: [R.direita, cv - MV + B] }, { canto: 1, p: [cu + MU - B, R.cima] }, { canto: 1, p: [R.direita, cv + MV - B] },
    { canto: 2, p: [cu - MU + B, R.cima] }, { canto: 2, p: [R.esquerda, cv + MV - B] }, { canto: 3, p: [cu - MU + B, R.baixo] }, { canto: 3, p: [R.esquerda, cv - MV + B] }].map(q => Object.assign(q, { visita: naZona(CANTOS[q.canto]), livre: true }));
  const bondes = {}, pegar = (alvo, visita) => { const lista = pontas.filter(q => q.visita === visita); if (!lista.length) return null;
    /* DE QUE PONTA DE RUA O BONDE CHEGA: o da casa, da que dá a caminhada mais curta até a abertura dele PELO CONTORNO DO
       QUARTEIRÃO SEM CRUZAR A ZONA DA VISITANTE (16/11/2026); era a mais perto em linha reta, e no Moisés Lucarelli o 2º
       escalão nascia do outro lado do cordão: dava a volta no quarteirão inteiro, mais de dois minutos andando. A
       visitante segue chegando pela ponta mais perto do portão dela, dentro da zona.
       DOIS BONDES PODEM VIR PELA MESMA RUA: ponta já usada custa 70 m a mais, e só. Antes cada bonde tinha de pegar uma
       ponta livre, e com três portões do mesmo lado (Anacleto Campanella, Nabi Abi Chedid) o 3º escalão sobrava com a
       ponta do canto oposto. Quem divide a rua nasce 26 m mais pra dentro dela, por bonde que já está ali. */
    const reta = x => Math.hypot(x.p[0] - alvo[0], x.p[1] - alvo[1]), sA = sDe(alvo[0], alvo[1]), arco = (de, ate) => ((ate - de) % P + P) % P;
    const andar = x => { const sP = CANTOS[x.canto]; let m = Infinity;
      for (const sn of [1, -1]) { const len = sn > 0 ? arco(sP, sA) : arco(sA, sP); let ok = true; for (let k = 0; k <= len && ok; k += 2) if (naZona(sP + sn * k)) ok = false; if (ok) m = Math.min(m, len); }
      return m + reta(x) * 0.001; };
    const custo = x => (visita ? reta(x) : andar(x)) + (x.usos || 0) * 70;
    const q = lista.reduce((m, x) => custo(x) < custo(m) ? x : m), k = q.usos || 0; q.usos = k + 1; q.livre = false;
    const naHorizontal = Math.abs(q.p[1] - R.cima) < 1 || Math.abs(q.p[1] - R.baixo) < 1;
    return k ? [q.p[0] + (naHorizontal ? Math.sign(cu - q.p[0]) * 26 * k : 0), q.p[1] + (naHorizontal ? 0 : Math.sign(cv - q.p[1]) * 26 * k)] : q.p; };
  for (const id of ['mandante1', 'mandante2', 'mandante3']) { const n = entradaDe[id]; if (n == null) continue; const g = portao(n), de = pegar([g.u, g.v], false); if (de) bondes[id] = { de, portao: n, exato: true }; }
  if (eV) for (const id of ['visitante1', 'visitante2']) { const de = pegar([eV.g.u, eV.g.v], true); if (de) bondes[id] = { de, portao: eV.n, exato: true }; }
  const quadra = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  /* ---- O QUARTEIRÃO DO ESTÁDIO NÃO FICA VAZIO (dono, 16/11/2026: "adicione elementos decorativos no quarteirão do estádio como
     calçada ou concreto, grama, mais árvores, e pontos de venda como barraquinhas, churrasquinho, cachorro quente e etc, como
     o outro jogo 3d fazia [...] não deixe o visual do quarteirão tão vazio assim"; e, vendo a primeira versão, de canteiros
     quadrados com árvores: "preciso de mais detalhismo no quarteirão do estádio nas áreas que o estádio não ocupa [...] pode
     ter calçadas, ciclovias, jardim maior, ou concreto também, ou piso de praça"). É uma praça em volta do estádio, sorteada
     com a semente dele, que respeita os funis dos portões e os cordões:
     · por dentro do gradil, a CALÇADA de ladrilho e a CICLOVIA vermelha, dando a volta no quarteirão, com os postes;
     · em volta do estádio, o CALÇADÃO em anel, de ladrilho maior;
     · na frente de cada portão, a pracinha de PEDRA PORTUGUESA, do gradil ao portão;
     · a PRAÇA DO CHAFARIZ (piso xadrez, o chafariz, os bancos) e um ou dois ESTACIONAMENTOS, onde couberem;
     · os JARDINS grandes (cerca viva, o caminho que atravessa, flores, árvores e bancos) no que sobra;
     · os AMBULANTES na calçada (os cinco do jogo 3D antigo: pipoca, cachorro-quente, espetinho, bebidas e camelô), dois de
       cada lado de cada portão e os outros espalhados, com árvores entre eles.
     A barraca é obstáculo (recorte no chão); o resto se pisa. ---- */
  const CAL = 4.4, CIC = 2.6, BORDA = CAL + 0.3 + CIC + 1.2, rnd = semente(o.semente || [...(ficha.id || 'x')].reduce((q, ch) => q * 31 + ch.charCodeAt(0) >>> 0, 7)), decor = [], barracas = [];
  const inflado = d => solido.map(p => { const q = Math.hypot(p[0] - su, p[1] - sv) || 1; return [p[0] + (p[0] - su) / q * d, p[1] + (p[1] - sv) / q * d]; }), anel = inflado(7.5), folgado = inflado(9.5);
  const funis = usadas.map(e => [e.c.p, [e.g.u, e.g.v]]);
  const naPraca = (u, v) => { if (u < u0 + BORDA || u > u1 - BORDA || v < v0 + BORDA || v > v1 - BORDA || dentroPoli(folgado, u, v)) return false;
    for (const f of funis) if (dSeg(u, v, f[0], f[1]) < 15) return false; for (const c of cordoes) if (dSeg(u, v, c[0], c[1]) < 4.5) return false; return true; };
  const ocupados = [], cabe = (u, v, w, d) => { for (const fx of [-0.5, -0.25, 0, 0.25, 0.5]) for (const fy of [-0.5, 0, 0.5]) if (!naPraca(u + fx * w, v + fy * d)) return false;
    return !ocupados.some(c => Math.abs(c.u - u) < (c.w + w) / 2 + 3.5 && Math.abs(c.v - v) < (c.d + d) / 2 + 3.5); };
  const achar = (w, d, n) => { for (let k = 0; k < n; k++) { const u = u0 + BORDA + w / 2 + rnd() * Math.max(0, Wq - 2 * BORDA - w), v = v0 + BORDA + d / 2 + rnd() * Math.max(0, Hq - 2 * BORDA - d); if (cabe(u, v, w, d)) { const c = { u: +u.toFixed(1), v: +v.toFixed(1), w, d }; ocupados.push(c); return c; } } return null; };
  /* o calçadão em anel em volta do estádio e a pracinha de pedra portuguesa de cada portão */
  decor.push({ tipo: 'piso', pts: anel, furo: solido, padrao: 'ladrilho', passo: 3.2, cor: '#c2bcad', cor2: '#a8a293', y: 0.07 });
  for (const e of usadas) { const ax = e.g.u - e.c.p[0], ay = e.g.v - e.c.p[1], L = Math.hypot(ax, ay) || 1, tx = ax / L, ty = ay / L, nx = -ty, ny = tx, a = [e.c.p[0] + tx * (CAL + 0.2), e.c.p[1] + ty * (CAL + 0.2)], b = [e.g.u + tx * 1.5, e.g.v + ty * 1.5];
    decor.push({ tipo: 'piso', pts: [[a[0] + nx * 13, a[1] + ny * 13], [b[0] + nx * 9, b[1] + ny * 9], [b[0] - nx * 9, b[1] - ny * 9], [a[0] - nx * 13, a[1] - ny * 13]], padrao: 'pedra', passo: 2.2, cor: '#e4e0d4', cor2: '#77746d', y: 0.09 }); }
  /* a calçada e a ciclovia, dando a volta por dentro do gradil */
  for (const [u, v, w, d, giro] of [[cu, v1 - CAL / 2, Wq, CAL, 0], [cu, v0 + CAL / 2, Wq, CAL, 0], [u0 + CAL / 2, cv, CAL, Hq - 2 * CAL, 0], [u1 - CAL / 2, cv, CAL, Hq - 2 * CAL, 0]]) decor.push({ tipo: 'piso', u, v, w, d, padrao: 'ladrilho', passo: 2.2, cor: '#cdc8bb', cor2: '#b2ad9f', y: 0.1 });
  { const r = CAL + 0.3 + CIC / 2; for (const [u, v, w, giro] of [[cu, v1 - r, Wq - 2 * (CAL + 0.3), 0], [cu, v0 + r, Wq - 2 * (CAL + 0.3), 0], [u0 + r, cv, Hq - 2 * (CAL + 0.3), 90], [u1 - r, cv, Hq - 2 * (CAL + 0.3), 90]]) decor.push({ tipo: 'piso', u, v, w, d: CIC, giro, padrao: 'ciclovia', y: 0.115 }); }
  /* a praça do chafariz e os estacionamentos */
  { const c = achar(22, 22, 500); if (c) { decor.push({ tipo: 'piso', u: c.u, v: c.v, w: 22, d: 22, padrao: 'xadrez', passo: 2.75, cor: '#ddd8cb', cor2: '#b7b1a2', y: 0.1 }, { tipo: 'chafariz', u: c.u, v: c.v, r: 4.2 });
      for (const [du, dv, giro] of [[0, 8.6, 0], [0, -8.6, 0], [8.6, 0, 90], [-8.6, 0, 90]]) decor.push({ tipo: 'banco', u: c.u + du, v: c.v + dv, giro }); for (const [du, dv] of [[10, 10], [-10, 10], [10, -10], [-10, -10]]) decor.push({ tipo: 'poste', u: c.u + du, v: c.v + dv }); } }
  for (let k = 0; k < 2; k++) { const deitado = rnd() < 0.5, c = achar(deitado ? 38 : 19, deitado ? 19 : 38, 260) || achar(deitado ? 19 : 38, deitado ? 38 : 19, 260); if (c) decor.push({ tipo: 'estacionamento', u: c.u, v: c.v, w: c.w, d: c.d, cheio: 0.3 + rnd() * 0.3 }); }
  /* os jardins: primeiro os grandes, depois os que couberem */
  { const alvo = Math.max(6, Math.min(20, Math.round((Wq * Hq) / 2300))); let n = 0;
    for (const [w, d, tent] of [[44, 20, 120], [20, 40, 120], [34, 18, 160], [18, 30, 160], [26, 16, 220], [16, 24, 220], [20, 13, 300], [13, 18, 300], [13, 11, 400]]) for (let k = 0; k < 4 && n < alvo; k++) { const c = achar(w, d, tent); if (!c) break; n++;
      decor.push({ tipo: 'jardim', u: c.u, v: c.v, w, d, n: Math.max(1, Math.round(w * d / 62)), cor: rnd() < 0.5 ? '#6f9a55' : '#79a45d' }); } }
  /* os postes da ciclovia e as árvores e os ambulantes da calçada */
  const SABORES = ['espetinho', 'cachorro', 'bebidas', 'pipoca', 'camelo'], cores = o.cores || ['#f2c230', '#1f8a3c']; let ns = Math.floor(rnd() * 5);
  const naCalcada = (u, v) => { for (const f of funis) if (dSeg(u, v, f[0], f[1]) < 10.5) return false; for (const c of cordoes) if (dSeg(u, v, c[0], c[1]) < 4) return false; return !dentroPoli(solido, u, v); };
  const barraca = s => { const c = noContorno(s), u = c.p[0] - c.n[0] * 2.4, v = c.p[1] - c.n[1] * 2.4; if (!naCalcada(u, v) || CANTOS.some(q => dist(q, s) < 5) || barracas.some(b => Math.hypot(b.u - u, b.v - v) < 6)) return false;
    const sabor = SABORES[ns++ % 5]; barracas.push({ u, v }); decor.push({ tipo: 'ambulante', escala: 1.6, sabor, u: +u.toFixed(1), v: +v.toFixed(1), giro: Math.round(Math.atan2(c.t[1], c.t[0]) / RAD), cores, cor: ['#c62828', '#1f6a45', '#2f6fb0'][ns % 3] }); return true; };
  for (const e of usadas) for (const ds of [-ABRE - 5.5, -ABRE - 12, ABRE + 5.5, ABRE + 12]) barraca(e.s + ds);
  for (let s = 9, k = 0; s < P - 4; s += 11, k++) { const c = noContorno(s), perto = usadas.some(e => dist(e.s, s) < ABRE + 14);
    if (k % 3 === 1 && !perto) { barraca(s); continue; }
    const u = c.p[0] - c.n[0] * (CAL - 0.9), v = c.p[1] - c.n[1] * (CAL - 0.9); if (naCalcada(u, v) && !usadas.some(e => dist(e.s, s) < ABRE + 2) && !CANTOS.some(q => dist(q, s) < 5) && !barracas.some(b => Math.hypot(b.u - u, b.v - v) < 4)) decor.push({ tipo: 'arvores', u: +u.toFixed(1), v: +v.toFixed(1), w: 0.6, d: 0.6, n: 1 });
    if (k % 2 === 0) { const pu = c.p[0] - c.n[0] * (BORDA - 0.5), pv = c.p[1] - c.n[1] * (BORDA - 0.5); if (naCalcada(pu, pv) && !CANTOS.some(q => dist(q, s) < 9)) decor.push({ tipo: 'poste', u: +pu.toFixed(1), v: +pv.toFixed(1) }); } }
  const obstaculos = barracas.map(b => ({ pts: [[b.u - 2, b.v - 2], [b.u + 2, b.v - 2], [b.u + 2, b.v + 2], [b.u - 2, b.v + 2]], tira: true }));
  /* o miolo dos quatro quarteirões do meio de cada lado: as árvores do fundo dos quintais */
  const fq = 2 * MEIA + fundo * 0.72, quintais = [
    { tipo: 'arvores', u: cu, v: v1 + fq, w: Wq - 30, d: 12, n: Math.round(Wq / 16) }, { tipo: 'arvores', u: cu, v: v0 - fq, w: Wq - 30, d: 12, n: Math.round(Wq / 16) },
    { tipo: 'arvores', u: u0 - fq, v: cv, w: 12, d: Hq - 30, n: Math.round(Hq / 16) }, { tipo: 'arvores', u: u1 + fq, v: cv, w: 12, d: Hq - 30, n: Math.round(Hq / 16) }];
  return { osm: { ruas, areas: [], predios: [] }, padrao: true, soFora: !!ficha.soFora, quadro: Object.assign({ u: MU, v: MV, cu, cv }, o.px ? { px: o.px } : {}), vazado: 0.62, semente: o.semente || 11, corQuadra: o.corQuadra || '#8d887d',
    corCalcadao: o.corCalcadao || '#b3ad9f',
    reservas: [quadra], pisos: [{ pts: quadra, cor: o.corCalcadao || '#b3ad9f' }, ...(o.pisos || []), { pts: solido, tira: true }, ...obstaculos, ...(o.tiras || [])],
    portoes, bondes, grades, filas: filas.concat(o.filas || []), pm: pm.concat(o.pm || []), entorno: decor.concat(quintais, o.entorno || []), vista: o.vista || [cu - MU * 0.9, MU * 0.75, cv - MV * 1.5, cu, 0, cv] };
}
