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
  /* OS ESTÁDIOS DE DOIS CLUBES (dono, 17/11/2026: "classico no estadio de dois clubes cada um usa a sua entrada, a aliança
     entra junto com a mofi"; "padrão que voce entendeu"; no Maracanã, "mesmas do flamengo. no Fla Flu crie mais entradas e
     chegadas pra distinguir"). A cena de base é a do primeiro clube em casa; cada variante (`<mandante>` ou
     `<mandante>@<visitante>`, no clássico) diz, pelos índices das marcas do dono, quem nasce onde e entra por qual portão. */
  /* Castelão: 0 entrada TUF (= Aliança, 4), 1 JGT (= MOFI, 3), 2 Cearamor (= a da visitante nos jogos do Fortaleza, 6), 5 a
     da visitante nos jogos do Ceará; chegadas 7 visitante (Ceará em casa), 8 visitante (Fortaleza em casa), 9 Cearamor,
     10 MOFI, 11 Aliança, 12 TUF, 13 JGT */
  'estadio-castelao': { unir: 30, sel: { chM: [12, 13], enM: [0, 1], chV: [8], enV: [6] },
    variantes: {
      'ceara': { sel: { chM: [9, 10, 11], enM: [2, 3, 3], chV: [7], enV: [5] }, torcidas: { cearamor: 'mandante1', mofi: 'mandante2', alianca: 'mandante3' } },
      'fortaleza@ceara': { sel: { chM: [12, 13], enM: [0, 1], chV: [9, 10, 11], enV: [2, 3, 3] }, torcidas: { leoes_da_tuf: 'mandante1', jovem_garra_tricolor: 'mandante2' } },
      'ceara@fortaleza': { sel: { chM: [9, 10, 11], enM: [2, 3, 3], chV: [12, 13], enV: [0, 1] }, torcidas: { cearamor: 'mandante1', mofi: 'mandante2', alianca: 'mandante3' } } } },
  /* Mangueirão: entradas 0 e 1 do Remo (a 1 = a da visitante nos jogos do Paysandu, 4), 2 e 3 do Paysandu (a 3 = a da
     visitante nos jogos do Remo, 5); chegadas 6 e 8 do lado do Remo (a visitante quando o Paysandu manda), 7 e 9 do lado do
     Paysandu (a visitante quando o Remo manda) */
  'estadio-mangueirao': { unir: 30, sel: { chM: [6, 8], enM: [0, 1], chV: [7, 9], enV: [5] },
    variantes: {
      'paysandu': { sel: { chM: [7, 9], enM: [2, 3], chV: [6, 8], enV: [4] }, torcidas: { terror_bicolor: 'mandante1', faccao_jovem_paysandu: 'mandante2' } },
      'remo@paysandu': { sel: { chM: [6, 8], enM: [0, 1], chV: [7, 9], enV: [2, 3] }, torcidas: { remista: 'mandante1', pavilhao_6: 'mandante2' } },
      'paysandu@remo': { sel: { chM: [7, 9], enM: [2, 3], chV: [6, 8], enV: [0, 1] }, torcidas: { terror_bicolor: 'mandante1', faccao_jovem_paysandu: 'mandante2' } } } },
  /* Maracanã: o Fluminense usa as marcas do Flamengo; no Fla×Flu, o clube de fora chega pela Avenida Rei Pelé, do lado da
     estação, e entra pelo nordeste (marcas minhas, 10 a 12) */
  'estadio-maracana': { sel: { chM: [8, 9], enM: [0, 1], chV: [3, 4], enV: [2] },
    extras: [{ k: 'chegada', de: 'flaflu', u: 121.4, v: 215.1 }, { k: 'chegada', de: 'flaflu', u: 77.2, v: 259.4 }, { k: 'entrada', de: 'flaflu', u: 100, v: 150 }],
    variantes: {
      'flamengo@fluminense': { sel: { chM: [8, 9], enM: [0, 1], chV: [10, 11], enV: [12] } },
      'fluminense@flamengo': { sel: { chM: [8, 9], enM: [0, 1], chV: [10, 11], enV: [12] } } } }
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
  const pontos = [...M.pontos, ...(o.extras || [])].map(p => Object.assign({}, p, (([u, v]) => ({ u, v }))(gira([p.u, p.v]))));
  const corte = M.corte.map(gira);
  let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const p of corte) { u0 = Math.min(u0, p[0]); u1 = Math.max(u1, p[0]); v0 = Math.min(v0, p[1]); v1 = Math.max(v1, p[1]); }
  const quadro = { u: r1((u1 - u0) / 2), v: r1((v1 - v0) / 2), cu: r1((u0 + u1) / 2), cv: r1((v0 + v1) / 2) };
  /* (o corte de mais de quatro cantos o dono desenhou de propósito: o quadro é o retângulo dele, e o polígono é o limite do
     que se pisa; fora dele a cena fica escurecida) */
  const limite = corte.length > 4 ? corte : null;

  /* O SÓLIDO e o meio dele */
  const solido = o.solido || solidoDe(ficha, true), su = solido.reduce((q, p) => q + p[0], 0) / solido.length, sv = solido.reduce((q, p) => q + p[1], 0) / solido.length;

  /* AS MARCAS de cada lado, na ordem em que o dono marcou */
  const casa = o.casa || ficha.clubes[0];
  /* (`sel`: { chM, enM, chV, enV } com os índices das marcas na lista do dono — os estádios de dois clubes, em que a mesma
     marca serve a papéis diferentes conforme quem manda o jogo) */
  const escolhe = (sel, k, lado) => { if (sel && sel[k]) return sel[k].map(i => pontos[i]);
    const tipo = k[0] === 'c' ? 'chegada' : 'entrada';
    return pontos.filter(p => p.k === tipo && (lado === 'visitante' ? p.de === 'visitante' : p.de === casa)); };
  const papeis = sel => { const r = { chM: escolhe(sel, 'chM', 'mandante'), enM: escolhe(sel, 'enM', 'mandante'), chV: escolhe(sel, 'chV', 'visitante'), enV: escolhe(sel, 'enV', 'visitante') };
    if (!r.chM.length || !r.enM.length || !r.chV.length || !r.enV.length || [...r.chM, ...r.enM, ...r.chV, ...r.enV].some(p => !p)) throw new Error(ficha.id + ': faltam marcas (chegada/entrada da casa ou da visitante)');
    return r; };
  const base = papeis(o.sel), variantes = Object.fromEntries(Object.entries(o.variantes || {}).map(([k, v]) => [k, Object.assign({}, v, { papeis: papeis(v.sel) })]));

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
  const ar = Object.assign({ osm, servico: true, quadro, ...(limite ? { limite } : {}), vazado: 0.62, semente: h % 97 + 1, marcas: true, pisos, predios: o.predios || {}, entorno: o.entorno || [],
    vista: [quadro.cu - quadro.u * 0.25, 170, quadro.cv + quadro.v * 1.1, quadro.cu, 0, quadro.cv] }, o.soFora ? { soFora: true } : {});

  /* OS PORTÕES: de cada entrada marcada, anda-se em direção ao meio do campo pelo chão até ele acabar — é a parede do
     estádio (ou o muro que estiver na frente dela). Assim o portão fica sempre ligado à rua em que o dono marcou. Se a marca
     não cair no chão, vale o chão mais perto dela (até 20 m). */
  const P = preparar(Object.assign({}, ficha, { arredores: ar }));
  const noChao = (u, v) => { if (P.andavel(u, v)) return [u, v]; for (let r = 1; r <= 20; r++) for (let a = 0; a < 360; a += 15) { const x = u + Math.cos(a * RAD) * r, y = v + Math.sin(a * RAD) * r; if (P.andavel(x, y)) return [x, y]; } return null; };
  const portoes = [], porMarca = new Map(), acessos = [];
  /* dois pontos ligados pelo chão (na malha de 1 m da planta)? */
  const comp = new Map();
  /* (com o corpo, não só com o pé: uma fresta de 1 m entre um prédio e a arquibancada liga na malha de 1 m, mas o boneco não
     passa — São Januário; conta como chão só o que tem chão também a 1,5 m pros quatro lados) */
  const corpo = (u, v) => P.andavel(u, v) && P.andavel(u + 1.5, v) && P.andavel(u - 1.5, v) && P.andavel(u, v + 1.5) && P.andavel(u, v - 1.5);
  const ligados = (a, b) => { if (!corpo(b[0], b[1])) return false; const ch = (u, v) => Math.floor(u) + ',' + Math.floor(v), alvo = ch(b[0], b[1]);
    let marca = comp.get(ch(a[0], a[1])); if (marca == null) { marca = comp.size + 1; const fila = [[Math.floor(a[0]), Math.floor(a[1])]]; comp.set(ch(a[0], a[1]), marca);
      while (fila.length) { const [u, v] = fila.pop(); for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = u + du, y = v + dv, c = x + ',' + y;
          if (!comp.has(c) && corpo(x + 0.5, y + 0.5)) { comp.set(c, marca); fila.push([x, y]); } } } }
    return comp.get(alvo) === marca; };
  const marcaDoPortao = [];
  const portao = (p, nome, cor) => { if (porMarca.has(p)) return porMarca.get(p);
    /* (entradas que o dono disse serem a mesma, a menos de `unir` metros uma da outra, viram um portão só) */
    if (o.unir) { const j = marcaDoPortao.findIndex(q => Math.hypot(q.u - p.u, q.v - p.v) < o.unir); if (j >= 0) { porMarca.set(p, j + 1); return j + 1; } }
    const n = portoes.length + 1, ini = noChao(p.u, p.v); marcaDoPortao.push(p);
    let g;
    if (ini) { const L = Math.hypot(ini[0], ini[1]) || 1, du = -ini[0] / L, dv = -ini[1] / L; let k = 0; while (k < L && P.andavel(ini[0] + du * (k + 0.5), ini[1] + dv * (k + 0.5))) k += 0.5;
      /* (se o chão acabou antes do estádio — o terreno em volta dele não é esplanada no mapa —, abre-se um acesso da rua até a
         parede, nessa mesma direção, e o portão fica na parede) */
      let w = k; while (w < L && !dentroPoli(solido, ini[0] + du * w, ini[1] + dv * w)) w += 0.5;
      /* (se o chão junto da parede, nessa direção, já se liga ao lugar da marca — dando a volta num prédio, por exemplo —,
         o portão vai pra parede sem abrir acesso nenhum) */
      if (w - k > 4 && ligados(ini, [ini[0] + du * (w - 1.5), ini[1] + dv * (w - 1.5)])) k = w;
      else if (w - k > 4) { acessos.push({ pts: [[r1(ini[0] + du * Math.max(0, k - 2)), r1(ini[1] + dv * Math.max(0, k - 2))], [r1(ini[0] + du * (w - 1)), r1(ini[1] + dv * (w - 1))]], larg: 9, cor: '#c2bcad' }); k = w; }
      g = { u: r1(ini[0] + du * Math.max(0, k - 1.5)), v: r1(ini[1] + dv * Math.max(0, k - 1.5)), dir: [+du.toFixed(2), +dv.toFixed(2)] }; }
    else { const q = maisPerto(solido, p.u, p.v, su, sv); g = { u: r1(q.u + q.nx * 1.5), v: r1(q.v + q.ny * 1.5), dir: [+(-q.nx).toFixed(2), +(-q.ny).toFixed(2)] }; }
    portoes.push(Object.assign({ n, nome }, g, { larg: 9 }, cor ? { cor } : {}));
    porMarca.set(p, n); return n; };
  /* (nos estádios de dois clubes os portões servem a papéis diferentes conforme o mandante: levam número, não papel) */
  const neutro = Object.keys(variantes).length > 0;
  base.enM.forEach((p, i) => portao(p, neutro ? null : 'ENTRADA ' + (i + 1)));
  base.enV.forEach(p => portao(p, neutro ? null : 'VISITANTE', neutro ? null : '#7a2f2f'));
  for (const v of Object.values(variantes)) [...v.papeis.enM, ...v.papeis.enV].forEach(p => portao(p, null));
  for (const g of portoes) if (!g.nome) g.nome = 'PORTÃO ' + g.n;
  const ult = (l, i) => l[Math.min(i, l.length - 1)];
  const bondesDe = r => { const b = {};
    for (let i = 0; i < 3; i++) b['mandante' + (i + 1)] = { de: [ult(r.chM, i).u, ult(r.chM, i).v], portao: porMarca.get(ult(r.enM, i)) };
    /* (o 3º bonde visitante só se enche quando o visitante vem com três torcidas: "a chegada visitante 3 vai ser só em caso de
       times com 3 torcidas"; sem marca própria, nasce na última chegada da visitante, 15 m atrás dela) */
    for (let i = 0; i < 3; i++) { const c = ult(r.chV, i), atras = i >= r.chV.length ? 15 : 0, L = Math.hypot(c.u, c.v) || 1;
      b['visitante' + (i + 1)] = { de: [r1(c.u + c.u / L * atras), r1(c.v + c.v / L * atras)], portao: porMarca.get(ult(r.enV, i)) }; }
    return b; };
  const bondes = bondesDe(base);

  /* O SETOR DE CADA ESCALÃO NUMA VARIANTE: o trecho da arquibancada atrás do portão dele, com a largura que o setor tem na
     ficha; dois escalões no mesmo portão ficam lado a lado (é a conta que pôs os setores das fichas, 17/11/2026) */
  const setoresDe = b => { const j = ficha.jogo || {}, A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360, out = {}, usados = [];
    const larg = k => j[k] ? j[k][1] - j[k][0] : 30, ang = k => { const g = portoes.find(q => q.n === b[k].portao); return A(g.u, g.v); };
    const ocupa = (a, w) => usados.some(([c, x]) => Math.abs(((a - c + 540) % 360) - 180) < (w + x) / 2 + 1);
    for (const [k, kj] of [['visitante1', 'visitante'], ['mandante1', 'mandante1'], ['mandante2', 'mandante2'], ['mandante3', 'mandante3']]) {
      const w = larg(kj), g = ang(k); let c = g;
      for (let d = 0; d < 180 && ocupa(c, w); d += 2) { c = g + d; if (!ocupa(c, w)) break; c = g - d; }
      usados.push([c, w]); c = (c % 360 + 360) % 360; let a = c - w / 2, z = c + w / 2; if (z > 360) { a -= 360; z -= 360; } out[kj] = [Math.round(a), Math.round(z)]; }
    return out; };
  const saidaVariantes = Object.fromEntries(Object.entries(variantes).map(([k, v]) => { const b = bondesDe(v.papeis);
    return [k, { bondes: b, jogo: Object.assign(setoresDe(b), v.torcidas ? { torcidas: v.torcidas } : {}) }]; }));

  ar.pisos.push(...acessos);
  /* A SEGURANÇA (dono, 17/11/2026: "desenhe o ideal de acordo com o que eu marquei"), pra cada cena (a de base e as
     variantes), sobre a planta já com os acessos: o funil de cada portão, o cordão da visitante e a polícia */
  const P2 = preparar(Object.assign({}, ficha, { arredores: Object.assign({}, ar, { portoes }) }));
  /* (a escala da cena, a mesma conta da bancada: a cena tem a área de 3072 × 2048 na proporção do quadro) */
  const esc = Math.round(Math.sqrt(3072 * 2048 * quadro.u / quadro.v) / 8) * 8 / (2 * quadro.u);
  const seg = b => seguranca(P2, portoes, b, esc);
  const s0 = seg(bondes);
  for (const v of Object.values(saidaVariantes)) Object.assign(v, seg(v.bondes));
  return Object.assign(ar, { portoes, bondes }, s0, neutro ? { variantes: saidaVariantes } : {});
}

/* =========================================================
   A SEGURANÇA DE UMA CENA, pelos caminhos de verdade dos bondes:
   · O FUNIL: dois gradis de fila saindo de cada portão, 7 m um do outro, até
     14 m — e nunca por cima do asfalto (o funil não fecha a rua).
   · O CORDÃO: um anel de grades de proteção em volta do portão da visitante,
     aberto só por onde a visitante chega. O raio é o maior (de 70 a 30 m)
     em que nenhum bonde da casa precisa passar por dentro do anel; se nenhum
     serve, não há cordão. A grade é a que quebra.
   · A POLÍCIA: um posto de cada lado de cada portão e um atrás de cada
     pedaço do cordão, do lado da casa.
   No fim, cada bonde tem de ter caminho com tudo de pé; se não tiver, sai o
   cordão e, se precisar, o funil.
   ========================================================= */
function seguranca(P, portoes, bondes, esc) {
  /* (tudo na escala da cena: o corpo do boneco ocupa uma célula de 8 px; a grade, a faixa de 5 px pra cada lado mais a célula
     — a mesma conta da assadeira e do jogo. Numa cena de 4 px por metro, isso é 2 m de corpo e 3 m de grade) */
  const rc = Math.max(1.5, 8 / esc), rb = 13 / esc, folga = rb + rc + 8 / esc;
  const corpo = (u, v) => P.andavel(u, v) && P.andavel(u + rc, v) && P.andavel(u - rc, v) && P.andavel(u, v + rc) && P.andavel(u, v - rc);
  const asfalto = (u, v) => { const q = P.cel(u, v); return q >= 0 && P.via[q] === 1; };
  const g = n => portoes.find(q => q.n === n);
  /* o caminho de um bonde (malha de 1 m, com o corpo), evitando as células bloqueadas */
  const caminho = (de, alvo, bloq) => { const ini = [Math.floor(de[0]), Math.floor(de[1])], fim = [alvo.u, alvo.v], key = (u, v) => u + ',' + v, pai = new Map([[key(...ini), null]]), fila = [ini];
    for (let k = 0; k < fila.length; k++) { const [u, v] = fila[k]; if (Math.hypot(u + 0.5 - fim[0], v + 0.5 - fim[1]) < 3.5) { const pts = []; let c = key(u, v); while (c) { pts.push(c.split(',').map(Number)); c = pai.get(c); } return pts; }
      for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = u + du, y = v + dv, c = key(x, y); if (pai.has(c)) continue; const perto = Math.hypot(x + 0.5 - fim[0], y + 0.5 - fim[1]) < 3.5;
        if ((perto && P.andavel(x + 0.5, y + 0.5)) || (corpo(x + 0.5, y + 0.5) && !(bloq && bloq.has(c)))) { pai.set(c, key(u, v)); fila.push([x, y]); } } }
    return null; };
  const saida = b => P.naRua(b.de[0], b.de[1]);
  const todos = Object.entries(bondes), casa = todos.filter(([k]) => k.startsWith('m')), fora = todos.filter(([k]) => k.startsWith('v'));
  const rotas = Object.fromEntries(todos.map(([k, b]) => [k, caminho(saida(b), g(b.portao))]));
  /* o funil de cada portão */
  const filas = [];
  for (const q of portoes) { const du = q.dir[0], dv = q.dir[1], tu = -dv, tv = du;
    let L = 0; while (L < 14 && !asfalto(q.u - du * (L + 1), q.v - dv * (L + 1)) && P.andavel(q.u - du * (L + 1), q.v - dv * (L + 1))) L += 1;
    if (L < 4) continue;
    for (const k of [-1, 1]) filas.push({ pts: [[r1(q.u + tu * k * folga), r1(q.v + tv * k * folga)], [r1(q.u + tu * k * folga - du * L), r1(q.v + tv * k * folga - dv * L)]] }); }
  /* o cordão em volta do portão (ou dos portões) da visitante */
  const portoesV = [...new Set(fora.map(([, b]) => b.portao))].map(g), portoesM = [...new Set(casa.map(([, b]) => b.portao))].map(g);
  let grades = [], pmCordao = [];
  for (const R of [70, 55, 42, 32]) {
    const dentro = (u, v) => portoesV.some(q => Math.hypot(u - q.u, v - q.v) < R);
    if (portoesM.some(q => portoesV.some(w => Math.hypot(q.u - w.u, q.v - w.v) < R + 10))) continue;
    if (casa.some(([k]) => (rotas[k] || []).some(([u, v]) => dentro(u + 0.5, v + 0.5)))) continue;
    const passaV = (u, v) => fora.some(([k]) => (rotas[k] || []).some(([x, y]) => Math.hypot(x + 0.5 - u, y + 0.5 - v) < 2.5));
    for (const q of portoesV) { const N = Math.round(2 * Math.PI * R), pts = [];
      for (let i = 0; i < N; i++) { const a = i / N * 2 * Math.PI, u = q.u + Math.cos(a) * R, v = q.v + Math.sin(a) * R, outro = portoesV.some(w => w !== q && Math.hypot(u - w.u, v - w.v) < R);
        pts.push({ u, v, a, livre: !outro && P.andavel(u, v) }); }
      /* os arcos de chão no círculo (começando num ponto sem chão, pra não partir um arco no meio) */
      const z = pts.findIndex(p => !p.livre); if (z < 0) continue;
      const ord = [...pts.slice(z), ...pts.slice(0, z)], arcos = []; let cur = null;
      for (const p of ord) { if (p.livre) { (cur = cur || []).push(p); } else if (cur) { arcos.push(cur); cur = null; } } if (cur) arcos.push(cur);
      for (const arco of arcos) { if (arco.some(p => passaV(p.u, p.v))) continue;
        for (let i = 0; i < arco.length - 1; i += 25) { const a = arco[Math.max(0, i - 1)], b = arco[Math.min(arco.length - 1, i + 26)];
          grades.push({ de: [r1(a.u), r1(a.v)], ate: [r1(b.u), r1(b.v)] }); }
        const m = arco[Math.floor(arco.length / 2)], ux = (m.u - q.u) / R, vy = (m.v - q.v) / R; pmCordao.push([r1(m.u + ux * 5), r1(m.v + vy * 5)]); } }
    break; }
  /* a polícia dos portões */
  const pm = []; for (const q of portoes) { const tx = -q.dir[1], ty = q.dir[0]; for (const k of [-1, 1]) pm.push([r1(q.u - q.dir[0] * 6 + tx * k * 8), r1(q.v - q.dir[1] * 6 + ty * k * 8)]); }
  /* cada bonde ainda chega no portão dele com tudo de pé? */
  const R = Math.ceil(rb), viz = []; for (let du = -R; du <= R; du++) for (let dv = -R; dv <= R; dv++) if (du * du + dv * dv <= rb * rb) viz.push([du, dv]);
  const bloqueio = (gs, fs) => { const set = new Set(), seg = (a, b) => { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2); for (let k = 0; k <= n; k++) { const u = a[0] + (b[0] - a[0]) * k / n, v = a[1] + (b[1] - a[1]) * k / n;
        for (const [du, dv] of viz) set.add(Math.floor(u + du) + ',' + Math.floor(v + dv)); } };
    for (const x of gs) seg(x.de, x.ate); for (const f of fs) seg(f.pts[0], f.pts[1]); return set; };
  const chegam = (gs, fs) => { const bl = bloqueio(gs, fs); return todos.every(([, b]) => caminho(saida(b), g(b.portao), bl)); };
  /* (as peças entram uma a uma: cada funil e cada pedaço de cordão só fica se, junto com os que já ficaram, todo bonde
     ainda chega no portão dele) */
  const pares = []; for (let i = 0; i < filas.length; i += 2) pares.push(filas.slice(i, i + 2));
  let fs = []; for (const par of pares) if (chegam([], [...fs, ...par])) fs.push(...par);
  const gs = []; for (const x of grades) if (chegam([...gs, x], fs)) gs.push(x);
  if (!gs.length) pmCordao = [];
  return { grades: gs, filas: fs, pm: [...pm, ...pmCordao] };
}

