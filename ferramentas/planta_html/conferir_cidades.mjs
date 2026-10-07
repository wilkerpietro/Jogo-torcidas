/* =========================================================
   CADA CIDADE CABE NO MAPA DO PORTE DELA?
   ---------------------------------------------------------
   São três mapas (proposta.js, MAPAS): o pequeno (o mapa de hoje com o
   que a praça pequena pede), o médio e o grande. Este teste pega as 30
   praças de dados/cidades.js e as torcidas de dados/torcidas.js e
   confere, pra cada uma, o que ela pede contra o que cada mapa tem (e o
   "Jogo hoje", a planta como o jogo usa, pra comparar):

   - ESTÁDIO: um por estádio da praça (o array `estadios`);
   - SEDE: uma por torcida — a de nível 2 em diante pede espaço de sede
     grande; a de nível 1 cabe no espaço pequeno ou no grande;
   - BAR: um por torcida (a regra da página);
   - FAVELA: uma mancha de favela por bairro de classe Favela;
   - METRÔ: se a praça tem (`temMetro`).

   O que cada mapa tem sai dele mesmo (as sedes, os bares e o estádio da
   planta; os espaços, os bares, as vagas de estádio, as favelas e o
   metrô de cada mapa, com todas as vagas ocupadas), então dá pra rodar de
   novo depois de mexer num mapa. A praça tem de caber no mapa do porte
   dela; se alguma não cabe, o teste sai com erro.

   E depois, O MAPA DE CADA PRAÇA DE VERDADE: o que a planta abre pra ela
   (mapa_da_praca.mjs), com os estádios dela no tamanho de verdade — o
   modelo da lotação, que sai da vaga pra fora da cidade e muda o que
   fica longe de estádio (a sede e o bar). A praça tem de caber nele
   também.

     node ferramentas/planta_html/conferir_cidades.mjs
     node ferramentas/planta_html/conferir_cidades.mjs --csv saida.csv
   ========================================================= */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
global.TO = { dados: {} };
for (const f of ['torcidas', 'times', 'cena_estadio', 'cidades']) require(path.join(R, 'dados', f + '.js'));
const P = TO.dados.plantaEstadio, K = P.CIDADE;
const { gerarProposta, MAPAS, MAPA_DO_PORTE } = await import(path.join(R, 'ferramentas/planta_html/proposta.js'));

/* o que cada mapa tem */
const sedesHoje = K.QUADRAS.filter(q => q.equip && q.equip.tipo === 'sede').map(q => q.equip);
const doMapa = id => {
  const R = gerarProposta(P, MAPAS[id]);                     // todas as vagas de estádio, com metrô
  return { id, nome: MAPAS[id].nome, em: 'no ' + MAPAS[id].nome.toLowerCase(), estadios: R.mapa.vagas,
           sedeGrande: R.espacosSede.filter(e => e.cabe > 1).length, sedePequena: R.espacosSede.filter(e => e.cabe === 1).length,
           bares: R.bares.length, favelas: R.favelas.length + (R.ficaFavelaDeHoje ? 1 : 0), metro: !!R.mapa.metro };
};
const LISTA = [
  { id: 'atual', nome: 'Jogo hoje', em: 'no jogo de hoje', estadios: 1,
    sedeGrande: sedesHoje.filter(e => e.nivel !== 1).length, sedePequena: sedesHoje.filter(e => e.nivel === 1).length,
    bares: K.QUADRAS.filter(q => q.equip && q.equip.tipo === 'bar').length, favelas: K.BEIRA.some(l => l.favela) ? 1 : 0, metro: false }
].concat(['pequeno', 'medio', 'grande'].map(doMapa));
/* o que falta no mapa `m` pra praça `x` */
function falta(m, x) {
  const f = [];
  if (x.estadios > m.estadios) f.push(`+${x.estadios - m.estadios} estádio`);
  const grandesLivres = m.sedeGrande - x.sedeGrande;
  if (grandesLivres < 0) f.push(`+${-grandesLivres} sede grande`);
  const semLugar = Math.max(0, x.sedePequena - m.sedePequena) - Math.max(0, grandesLivres);
  if (semLugar > 0) f.push(`+${semLugar} sede`);
  if (x.torcidas > m.bares) f.push(`+${x.torcidas - m.bares} bar`);
  if (x.favelas > m.favelas) f.push(`+${x.favelas - m.favelas} favela`);
  if (x.metro && !m.metro) f.push('metrô');
  return f;
}

const { mapaDaPraca } = await import(path.join(R, 'ferramentas/planta_html/mapa_da_praca.mjs'));
const ORDEM = { Pequeno: 0, 'Médio': 1, Grande: 2 };
const linhas = TO.dados.cidades.map(c => {
  const ts = TO.dados.torcidas.filter(t => t.mapa === c.id);
  const x = {
    torcidas: ts.length,
    sedeGrande: ts.filter(t => (t.sedeNivel ?? 1) >= 2).length,
    sedePequena: ts.filter(t => (t.sedeNivel ?? 1) === 1).length,
    estadios: c.estadios.length,
    favelas: c.bairros.filter(b => b.classe === 'Favela').length,
    metro: !!c.temMetro
  };
  return { c, x, zonas: c.bairros.filter(b => b.classe === 'Favela').map(b => b.zona[0]).join(''),
           falta: Object.fromEntries(LISTA.map(m => [m.id, falta(m, x)])) };
}).sort((a, b) => ORDEM[a.c.tamanho] - ORDEM[b.c.tamanho] || b.x.torcidas - a.x.torcidas || a.c.nome.localeCompare(b.c.nome));

for (const m of LISTA)
  console.log(`${m.nome}: ${m.estadios} estádio(s), ${m.sedeGrande} espaço(s) de sede grande e ${m.sedePequena} pequeno, ${m.bares} bares, ${m.favelas} favela(s), ${m.metro ? 'com' : 'sem'} metrô`);
console.log('');
for (const { c, x, zonas, falta: f } of linhas)
  console.log(`${c.tamanho.padEnd(7)} ${c.nome.padEnd(20)} ${x.torcidas} torcidas (${x.sedeGrande} de sede grande) · ${x.estadios} estádio(s) · ` +
              `${x.favelas} favela(s)${zonas ? ' ' + zonas : ''} · ${x.metro ? 'metrô' : 'sem metrô'}  | ` +
              LISTA.map(m => `${m.nome}: ${f[m.id].length ? 'falta ' + f[m.id].join(', ') : 'cabe'}`).join('  | '));
console.log('');
let fora = 0;
for (const porte of ['Pequeno', 'Médio', 'Grande']) {
  const g = linhas.filter(l => l.c.tamanho === porte), seu = MAPA_DO_PORTE[porte];
  const naoCabem = g.filter(l => l.falta[seu].length);
  fora += naoCabem.length;
  console.log(`${porte}: ${g.length} praças · ` + LISTA.map(m => `cabem ${m.em}: ${g.filter(l => !l.falta[m.id].length).length}`).join(' · ') +
              (naoCabem.length ? `  ← NÃO CABEM no mapa do porte: ${naoCabem.map(l => l.c.nome).join(', ')}` : ''));
}

const i = process.argv.indexOf('--csv');
if (i > 0) {
  const cab = ['Cidade', 'Porte', 'Bairros', 'Torcidas', 'Sedes de nível 2+', 'Sedes de nível 1', 'Estádios', 'Bairros de favela', 'Zonas das favelas', 'Metrô']
    .concat(LISTA.map(m => m.nome));
  const csv = [cab.join(';')].concat(linhas.map(({ c, x, zonas, falta: f }) => [c.nome, c.tamanho, c.bairros.length, x.torcidas, x.sedeGrande, x.sedePequena,
    x.estadios, x.favelas, zonas || '—', x.metro ? 'sim' : 'não'].concat(LISTA.map(m => f[m.id].length ? 'falta ' + f[m.id].join(', ') : 'cabe')).join(';')));
  fs.writeFileSync(process.argv[i + 1], '﻿' + csv.join('\r\n'));
  console.log('\nCSV em', process.argv[i + 1]);
}
/* o mapa de cada praça de verdade, com os estádios dela no tamanho de verdade */
console.log('\nO MAPA DE CADA PRAÇA, com os estádios de verdade:');
let foraDeVerdade = 0;
for (const { c, x } of linhas) {
  const { id, cfg, opc } = mapaDaPraca(c);
  const G = gerarProposta(P, cfg, opc);
  const m = { estadios: G.estadios.length, sedeGrande: G.espacosSede.filter(e => e.cabe > 1).length, sedePequena: G.espacosSede.filter(e => e.cabe === 1).length,
              bares: G.bares.length, favelas: G.favelas.length + (G.ficaFavelaDeHoje ? 1 : 0), metro: !!G.metro };
  const f = falta(m, x);
  if (f.length) foraDeVerdade++;
  const W = (G.mundo.x1 - G.mundo.x0) / P.METRO, H = (G.mundo.y1 - G.mundo.y0) / P.METRO;
  console.log(`  ${c.nome.padEnd(20)} ${id.padEnd(7)} ${G.estadios.map(e => e.modelo.replace('estadio-', '') + (e.vagaUsada !== e.vaga ? '(vaga ' + e.vagaUsada + ')' : '')).join(' ')} · mundo ${Math.round(W)} × ${Math.round(H)} m · ` +
              `${m.sedeGrande} sede grande, ${m.sedePequena} pequena, ${m.bares} bares · ${f.length ? 'FALTA ' + f.join(', ') : 'cabe'}`);
}
fora += foraDeVerdade;
console.log(fora ? `\nFALHOU: ${fora} praça(s) não cabem no mapa do porte delas` : '\ntoda praça cabe no mapa do porte dela (e no mapa dela, com os estádios de verdade)');
process.exit(fora ? 1 : 0);
