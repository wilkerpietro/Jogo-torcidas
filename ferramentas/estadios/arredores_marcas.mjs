/* =========================================================
   OS ARREDORES DE VERDADE MONTADOS PELAS MARCAS DO DONO (17/11/2026).

   O dono marcou, nos mapas do levantamento, onde cada torcida chega, por onde
   entra e o corte do mapa (a prancheta "Marcação dos Arredores";
   marcas_do_dono.mjs). Este módulo transforma isso no `arredores` da ficha,
   o mesmo formato que arredores.mjs desenha:

   · O CORTE vira o quadro da cena: o retângulo que contém os cantos marcados
     ("endireite").
   · AS ENTRADAS são as marcas, levadas até a parede do estádio ("ajuste a
     entrada pra perto da parede do estadio"): da marca, anda-se pelo chão em
     direção ao meio do campo até o chão acabar.
   · OS BONDES, em ordem ("entrada 1 é a da torcida do primeiro escalão";
     "chegada 1 vai pra entrada 1, chegada 2 vai pra entrada 2"): o 1º
     escalão da casa nasce na 1ª chegada e entra pela 1ª entrada; com menos
     marcas que escalões, os que sobram usam a última ("isso mesmo"). A
     visitante tem uma entrada só por jogo.
   · O CHÃO: as ruas do mapa (as de serviço também), o terreno do estádio do
     mapa (a esplanada), os estacionamentos e um calçadão em volta do sólido
     (o casco do que a ficha põe em pé, arredores_padrao.mjs). O estádio e os
     prédios do mapa não se pisam.
   · A POLÍCIA: um posto de cada lado de cada portão. O gradil e o cordão
     ficam pra quando o dono marcar de novo em cima da cena desenhada.

   As marcas estão no quadro do levantamento (o `rumo` dele); se o `norte` da
   ficha for outro, tudo (as marcas e as ruas) é girado pro quadro da ficha.

   AJUSTES por estádio (AJUSTES, abaixo): `casa` (de quem são as marcas da
   casa, quando não é o primeiro clube da ficha), `sel` (quais marcas valem,
   por tipo e lado: { 'chegada:visitante': { de, nota } } pega as marcas
   desse dono cujo recado tem o texto), `soFora`, `calcadao` (a largura do
   calçadão em volta do estádio, 12 m), `pisos`, `tiras`, `entorno`,
   `predios`.
   ========================================================= */
import { solidoDe } from './arredores_padrao.mjs';
import { preparar } from './arredores.mjs';

const RAD = Math.PI / 180;

/* O QUE CADA ESTÁDIO TEM DE DIFERENTE (as respostas do dono, 17/11/2026) */
export const AJUSTES = {
  /* "Arena Corinthians, Allianz Parque, Engenhão, Couto Pereira": só se briga do lado de fora */
  'estadio-neo-quimica-arena': { soFora: true }, 'estadio-allianz-parque': { soFora: true }, 'estadio-nilton-santos': { soFora: true },
  /* Vila Belmiro: a Avenida Senador Pinheiro Machado tem o canal no meio, e o mapa não traz as pontes; as duas que ficam
     perto do estádio (na Rua Delfino Stockler de Lima e na altura da Rua Marechal José Olintho de Carvalho) entram à mão */
  'estadio-vila-belmiro': { pisos: [{ pts: [[12, 214], [0, 252]], larg: 9, cor: '#8a8a8c' }, { pts: [[200, 116], [204, 148]], larg: 9, cor: '#8a8a8c' }] },
  /* Castelão: a cena é a do Fortaleza em casa (a TUF e a JGT); a visitante, a "dos jogos do Fortaleza". A do Ceará em casa
     (a Cearamor, e a Aliança entrando com a MOFI) espera o jogo saber trocar a cena pelo mandante do dia. */
  'estadio-castelao': { sel: { 'chegada:visitante': { de: 'visitante', nota: 'jogos do Fortaleza' }, 'entrada:visitante': { de: 'visitante', nota: 'jogos do Fortaleza' } } },
  /* Mangueirão: o dono não marcou chegada da casa; o Remo nasce onde nasce a visitante dos jogos do Paysandu, e a visitante
     dos jogos do Remo, nos pontos dela ("padrão que voce entendeu") */
  'estadio-mangueirao': { sel: { 'chegada:mandante': { de: 'visitante', nota: 'Paysandu é mandante' }, 'chegada:visitante': { de: 'visitante', nota: 'mando do Remo' },
                                 'entrada:visitante': { de: 'visitante', nota: 'Paysandu 2' } } }
};
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
  const escolhe = (k, lado) => { const f = o.sel && o.sel[k + ':' + lado];
    if (f) return pontos.filter(p => p.k === k && p.de === f.de && (!f.nota || (p.nota || '').includes(f.nota)));
    return pontos.filter(p => p.k === k && (lado === 'visitante' ? p.de === 'visitante' : p.de === casa)); };
  const chM = escolhe('chegada', 'mandante'), enM = escolhe('entrada', 'mandante'), chV = escolhe('chegada', 'visitante'), enV = escolhe('entrada', 'visitante');
  if (!chM.length || !enM.length || !chV.length || !enV.length) throw new Error(ficha.id + ': faltam marcas (chegada/entrada da casa ou da visitante)');

  /* O CHÃO fora das ruas: o terreno do estádio do mapa (a esplanada), os estacionamentos e o calçadão em volta do sólido; o
     estádio e os prédios do mapa não são chão */
  const calcadao = o.calcadao == null ? 12 : o.calcadao;
  const inflado = d => solido.map(p => { const q = Math.hypot(p[0] - su, p[1] - sv) || 1; return [r1(p[0] + (p[0] - su) / q * d), r1(p[1] + (p[1] - sv) / q * d)]; });
  /* (o terreno do clube em que o campo está — Aflitos, Ilha do Retiro — também é chão; as piscinas dele não) */
  const esplanada = osm.areas.filter(a => a.pts.length > 3 && (a.tipo === 'leisure=stadium' || (a.tipo === 'leisure=sports_centre' && dentroPoli(a.pts, 0, 0))));
  const estac = osm.areas.filter(a => a.tipo === 'amenity=parking' && a.pts.length > 3), piscinas = osm.areas.filter(a => a.tipo === 'leisure=swimming_pool' && a.pts.length > 3);
  const pisos = [
    ...esplanada.map(a => ({ pts: a.pts, cor: '#b9b3a4' })),
    ...estac.map(a => ({ pts: a.pts, cor: '#77777a' })),
    { pts: inflado(calcadao), cor: '#c2bcad' },
    ...(o.pisos || []),
    { pts: solido, tira: true },
    ...osm.predios.filter(p => p.pts.length > 3 && !['stadium', 'grandstand', 'roof'].includes(p.tipo)).map(p => ({ pts: p.pts, tira: true })),
    ...piscinas.map(a => ({ pts: a.pts, tira: true })),
    ...(o.tiras || []).map(t => ({ pts: t, tira: true }))
  ];
  let h = 0; for (const ch of ficha.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const ar = Object.assign({ osm, servico: true, quadro, vazado: 0.62, semente: h % 97 + 1, marcas: true, pisos, predios: o.predios || {}, entorno: o.entorno || [],
    vista: [quadro.cu - quadro.u * 0.25, 170, quadro.cv + quadro.v * 1.1, quadro.cu, 0, quadro.cv] }, o.soFora ? { soFora: true } : {});

  /* OS PORTÕES: de cada entrada marcada, anda-se em direção ao meio do campo pelo chão até ele acabar — é a parede do
     estádio (ou o muro que estiver na frente dela). Assim o portão fica sempre ligado à rua em que o dono marcou. Se a marca
     não cair no chão, vale o chão mais perto dela (até 20 m). */
  const P = preparar(Object.assign({}, ficha, { arredores: ar }));
  const noChao = (u, v) => { if (P.andavel(u, v)) return [u, v]; for (let r = 1; r <= 20; r++) for (let a = 0; a < 360; a += 15) { const x = u + Math.cos(a * RAD) * r, y = v + Math.sin(a * RAD) * r; if (P.andavel(x, y)) return [x, y]; } return null; };
  const portoes = [], porMarca = new Map(), acessos = [];
  const portao = (p, nome, cor) => { if (porMarca.has(p)) return porMarca.get(p);
    const n = portoes.length + 1, ini = noChao(p.u, p.v);
    let g;
    if (ini) { const L = Math.hypot(ini[0], ini[1]) || 1, du = -ini[0] / L, dv = -ini[1] / L; let k = 0; while (k < L && P.andavel(ini[0] + du * (k + 0.5), ini[1] + dv * (k + 0.5))) k += 0.5;
      /* (se o chão acabou antes do estádio — o terreno em volta dele não é esplanada no mapa —, abre-se um acesso da rua até a
         parede, nessa mesma direção, e o portão fica na parede) */
      let w = k; while (w < L && !dentroPoli(solido, ini[0] + du * w, ini[1] + dv * w)) w += 0.5;
      if (w - k > 4) { acessos.push({ pts: [[r1(ini[0] + du * Math.max(0, k - 2)), r1(ini[1] + dv * Math.max(0, k - 2))], [r1(ini[0] + du * (w - 1)), r1(ini[1] + dv * (w - 1))]], larg: 9, cor: '#c2bcad' }); k = w; }
      g = { u: r1(ini[0] + du * Math.max(0, k - 1.5)), v: r1(ini[1] + dv * Math.max(0, k - 1.5)), dir: [+du.toFixed(2), +dv.toFixed(2)] }; }
    else { const q = maisPerto(solido, p.u, p.v, su, sv); g = { u: r1(q.u + q.nx * 1.5), v: r1(q.v + q.ny * 1.5), dir: [+(-q.nx).toFixed(2), +(-q.ny).toFixed(2)] }; }
    portoes.push(Object.assign({ n, nome }, g, { larg: 9 }, cor ? { cor } : {}));
    porMarca.set(p, n); return n; };
  enM.forEach((p, i) => portao(p, 'ENTRADA ' + (i + 1)));
  const pv = portao(enV[0], 'VISITANTE', '#7a2f2f');
  const ult = (l, i) => l[Math.min(i, l.length - 1)];
  const bondes = {};
  for (let i = 0; i < 3; i++) bondes['mandante' + (i + 1)] = { de: [ult(chM, i).u, ult(chM, i).v], portao: porMarca.get(ult(enM, i)) };
  for (let i = 0; i < 2; i++) bondes['visitante' + (i + 1)] = { de: [ult(chV, i).u, ult(chV, i).v], portao: pv };

  /* A POLÍCIA: um posto de cada lado de cada portão, 6 m pra fora */
  const pm = []; for (const g of portoes) { const tx = -g.dir[1], ty = g.dir[0]; for (const k of [-1, 1]) pm.push([r1(g.u - g.dir[0] * 6 + tx * k * 8), r1(g.v - g.dir[1] * 6 + ty * k * 8)]); }

  ar.pisos.push(...acessos);
  return Object.assign(ar, { portoes, bondes, grades: [], filas: [], pm });
}
