/* =========================================================
   OS ARREDORES DE VERDADE MONTADOS PELAS MARCAS DO DONO (17/11/2026).

   O dono marcou, nos mapas do levantamento, onde cada torcida chega, por onde
   entra e o corte do mapa (a prancheta "Marcação dos Arredores";
   marcas_do_dono.mjs). Este módulo transforma isso no `arredores` da ficha,
   o mesmo formato que arredores.mjs desenha:

   · O CORTE vira o quadro da cena: o retângulo que contém os cantos marcados
     ("endireite").
   · AS ENTRADAS são as marcas, levadas até a parede do estádio ("ajuste a
     entrada pra perto da parede do estadio"): o ponto do sólido (o casco do
     que a ficha põe em pé, arredores_padrao.mjs) mais perto da marca.
   · OS BONDES, em ordem ("entrada 1 é a da torcida do primeiro escalão";
     "chegada 1 vai pra entrada 1, chegada 2 vai pra entrada 2"): o 1º
     escalão da casa nasce na 1ª chegada e entra pela 1ª entrada; com menos
     marcas que escalões, os que sobram usam a última ("isso mesmo"). A
     visitante tem uma entrada só por jogo.
   · O CHÃO: as ruas do mapa (as de serviço também), o terreno do estádio do
     mapa (a esplanada), os estacionamentos, um calçadão em volta do sólido e
     um corredor de cada portão até a rua mais perto. O estádio e os prédios
     do mapa não se pisam.
   · A POLÍCIA: um posto de cada lado de cada portão. O gradil e o cordão
     ficam pra quando o dono marcar de novo em cima da cena desenhada.

   As marcas estão no quadro do levantamento (o `rumo` dele); se o `norte` da
   ficha for outro, tudo (as marcas e as ruas) é girado pro quadro da ficha.

   AJUSTES por estádio (o terceiro argumento): `casa` (de quem são as marcas
   da casa, quando não é o primeiro clube da ficha), `chegadas`/`entradas`
   ({ mandante: [índices], visitante: [índices] } na lista de marcas, pra
   escolher quais valem), `soFora`, `calcadao` (a largura do calçadão em
   volta do estádio, 12 m), `pisos`, `tiras`, `entorno`, `predios`.
   ========================================================= */
import { solidoDe } from './arredores_padrao.mjs';

const RAD = Math.PI / 180;
const dentroPoli = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const VIAS = new Set(['trunk', 'primary', 'secondary', 'secondary_link', 'tertiary', 'tertiary_link', 'residential', 'living_street', 'unclassified', 'pedestrian', 'service']);
const r1 = x => Math.round(x * 10) / 10;

/* o ponto mais perto de (u, v) num polígono fechado, com a normal pra fora */
function maisPerto(poli, u, v, cu, cv) {
  let m = null;
  for (let k = 0; k < poli.length; k++) { const a = poli[k], b = poli[(k + 1) % poli.length], dx = b[0] - a[0], dy = b[1] - a[1], q = dx * dx + dy * dy || 1e-9;
    const t = Math.max(0, Math.min(1, ((u - a[0]) * dx + (v - a[1]) * dy) / q)), x = a[0] + dx * t, y = a[1] + dy * t, d = Math.hypot(u - x, v - y);
    if (!m || d < m.d) { let nx = dy, ny = -dx; const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L; if (nx * (x - cu) + ny * (y - cv) < 0) { nx = -nx; ny = -ny; } m = { d, u: x, v: y, nx, ny }; } }
  return m;
}

export function arredoresDasMarcas(ficha, osmLev, M, o = {}) {
  /* O QUADRO: gira as marcas e as ruas do rumo do levantamento pro norte da ficha */
  const giro = ((ficha.norte - M.rumo) % 360 + 360) % 360, c = Math.cos(giro * RAD), s = Math.sin(giro * RAD);
  const gira = p => [r1(p[0] * c - p[1] * s), r1(p[0] * s + p[1] * c)];
  const osm = giro ? Object.assign({}, osmLev, { norte: ficha.norte,
    ruas: osmLev.ruas.map(r => Object.assign({}, r, { pts: r.pts.map(gira) })), trilhos: (osmLev.trilhos || []).map(r => Object.assign({}, r, { pts: r.pts.map(gira) })),
    predios: osmLev.predios.map(r => Object.assign({}, r, { pts: r.pts.map(gira) })), areas: osmLev.areas.map(r => Object.assign({}, r, { pts: r.pts.map(gira) })) }) : osmLev;
  const pontos = M.pontos.map(p => Object.assign({}, p, (([u, v]) => ({ u, v }))(gira([p.u, p.v]))));
  const corte = M.corte.map(gira);
  let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const p of corte) { u0 = Math.min(u0, p[0]); u1 = Math.max(u1, p[0]); v0 = Math.min(v0, p[1]); v1 = Math.max(v1, p[1]); }
  const quadro = { u: r1((u1 - u0) / 2), v: r1((v1 - v0) / 2), cu: r1((u0 + u1) / 2), cv: r1((v0 + v1) / 2) };

  /* O SÓLIDO e o meio dele */
  const solido = o.solido || solidoDe(ficha), su = solido.reduce((q, p) => q + p[0], 0) / solido.length, sv = solido.reduce((q, p) => q + p[1], 0) / solido.length;

  /* AS MARCAS de cada lado, na ordem em que o dono marcou */
  const casa = o.casa || ficha.clubes[0];
  const escolhe = (k, lado) => { const todas = pontos.filter(p => p.k === k && (lado === 'visitante' ? p.de === 'visitante' : p.de === casa));
    const idx = o[k === 'chegada' ? 'chegadas' : 'entradas'] && o[k === 'chegada' ? 'chegadas' : 'entradas'][lado];
    return idx ? idx.map(i => pontos.filter(p => p.k === k)[i]) : todas; };
  const chM = escolhe('chegada', 'mandante'), enM = escolhe('entrada', 'mandante'), chV = escolhe('chegada', 'visitante'), enV = escolhe('entrada', 'visitante');
  if (!chM.length || !enM.length || !chV.length || !enV.length) throw new Error(ficha.id + ': faltam marcas (chegada/entrada da casa ou da visitante)');

  /* OS PORTÕES: cada entrada marcada, levada até a parede (1,5 m pra fora do sólido) */
  const portoes = [], porMarca = new Map();
  const portao = (p, nome, cor) => { if (porMarca.has(p)) return porMarca.get(p);
    const q = maisPerto(solido, p.u, p.v, su, sv), n = portoes.length + 1;
    portoes.push(Object.assign({ n, nome, u: r1(q.u + q.nx * 1.5), v: r1(q.v + q.ny * 1.5), dir: [+(-q.nx).toFixed(2), +(-q.ny).toFixed(2)], larg: 9 }, cor ? { cor } : {}));
    porMarca.set(p, n); return n; };
  enM.forEach((p, i) => portao(p, 'ENTRADA ' + (i + 1)));
  const pv = portao(enV[0], 'VISITANTE', '#7a2f2f');
  const ult = (l, i) => l[Math.min(i, l.length - 1)];
  const bondes = {};
  for (let i = 0; i < 3; i++) bondes['mandante' + (i + 1)] = { de: [ult(chM, i).u, ult(chM, i).v], portao: porMarca.get(ult(enM, i)), exato: true };
  for (let i = 0; i < 2; i++) bondes['visitante' + (i + 1)] = { de: [ult(chV, i).u, ult(chV, i).v], portao: pv, exato: true };

  /* O CHÃO fora das ruas */
  const calcadao = o.calcadao == null ? 12 : o.calcadao;
  const inflado = d => solido.map(p => { const q = Math.hypot(p[0] - su, p[1] - sv) || 1; return [r1(p[0] + (p[0] - su) / q * d), r1(p[1] + (p[1] - sv) / q * d)]; });
  const ruas = osm.ruas.filter(r => VIAS.has(r.tipo));
  const naRua = (u, v) => { let m = null; for (const r of ruas) for (let k = 0; k < r.pts.length - 1; k++) { const a = r.pts[k], b = r.pts[k + 1], dx = b[0] - a[0], dy = b[1] - a[1], q = dx * dx + dy * dy || 1e-9;
      const t = Math.max(0, Math.min(1, ((u - a[0]) * dx + (v - a[1]) * dy) / q)), x = a[0] + dx * t, y = a[1] + dy * t, d = Math.hypot(u - x, v - y); if (!m || d < m.d) m = { d, u: x, v: y }; } return m; };
  const esplanada = osm.areas.filter(a => a.tipo === 'leisure=stadium' && a.pts.length > 3), estac = osm.areas.filter(a => a.tipo === 'amenity=parking' && a.pts.length > 3);
  const pisos = [
    ...esplanada.map(a => ({ pts: a.pts, cor: '#b9b3a4' })),
    ...estac.map(a => ({ pts: a.pts, cor: '#77777a' })),
    { pts: inflado(calcadao), cor: '#c2bcad' },
    /* o corredor de cada portão até a rua mais perto */
    ...portoes.map(g => { const q = naRua(g.u, g.v); return q && q.d > 4 ? { pts: [[g.u, g.v], [r1(q.u), r1(q.v)]], larg: 9, cor: '#c2bcad' } : null; }).filter(Boolean),
    ...(o.pisos || []),
    /* (o estádio e os prédios do mapa não são chão) */
    { pts: solido, tira: true },
    ...osm.predios.filter(p => p.pts.length > 3 && !['stadium', 'grandstand', 'roof'].includes(p.tipo)).map(p => ({ pts: p.pts, tira: true })),
    ...(o.tiras || []).map(t => ({ pts: t, tira: true }))
  ];

  /* A POLÍCIA: um posto de cada lado de cada portão, 6 m pra fora */
  const pm = []; for (const g of portoes) { const tx = -g.dir[1], ty = g.dir[0]; for (const k of [-1, 1]) pm.push([r1(g.u - g.dir[0] * 6 + tx * k * 8), r1(g.v - g.dir[1] * 6 + ty * k * 8)]); }

  let h = 0; for (const ch of ficha.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return Object.assign({
    osm, servico: true, quadro, vazado: 0.62, semente: h % 97 + 1, marcas: true,
    pisos, portoes, bondes, grades: [], filas: [], pm, predios: o.predios || {}, entorno: o.entorno || [],
    vista: [quadro.cu - quadro.u * 0.25, 170, quadro.cv + quadro.v * 1.1, quadro.cu, 0, quadro.cv]
  }, o.soFora ? { soFora: true } : {});
}
