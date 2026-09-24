/* =========================================================
   CADA CIDADE CABE EM QUAL MAPA?
   ---------------------------------------------------------
   A ideia do dono: o mapa de hoje (a planta) é o das cidades pequenas, e
   a proposta de expansão é o das grandes. Este teste pega as 30 praças
   de dados/cidades.js e as torcidas de dados/torcidas.js e confere, pra
   cada uma, o que ela pede contra o que cada mapa tem:

   - ESTÁDIO: um por estádio da praça (o array `estadios`);
   - SEDE: uma por torcida — a de nível 2 em diante pede espaço de sede
     grande; a de nível 1 cabe no espaço pequeno ou no grande;
   - BAR: um por torcida (a regra da página);
   - FAVELA: uma mancha de favela por bairro de classe Favela;
   - METRÔ: se a praça tem (`temMetro`).

   O que cada mapa tem sai dele mesmo (as sedes, os bares e o estádio da
   planta; os espaços, os bares, os estádios, as favelas e o metrô da
   proposta), então dá pra rodar de novo depois de mexer num mapa.

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
const { gerarProposta } = await import(path.join(R, 'ferramentas/planta_html/proposta.js'));
const PROP = gerarProposta(P);

/* o que cada mapa tem */
const sedesHoje = K.QUADRAS.filter(q => q.equip && q.equip.tipo === 'sede').map(q => q.equip);
const MAPAS = [
  { id: 'atual', nome: 'Mapa atual', em: 'no mapa atual', estadios: 1,
    sedeGrande: sedesHoje.filter(e => e.nivel !== 1).length, sedePequena: sedesHoje.filter(e => e.nivel === 1).length,
    bares: K.QUADRAS.filter(q => q.equip && q.equip.tipo === 'bar').length, favelas: K.BEIRA.some(l => l.favela) ? 1 : 0, metro: false },
  { id: 'proposta', nome: 'Proposta', em: 'na proposta', estadios: 1 + (PROP.estadio2 ? 1 : 0),
    sedeGrande: PROP.espacosSede.filter(e => e.cabe > 1).length, sedePequena: PROP.espacosSede.filter(e => e.cabe === 1).length,
    bares: PROP.bares.length, favelas: PROP.favelas.length, metro: !!PROP.metro }
];
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
           falta: Object.fromEntries(MAPAS.map(m => [m.id, falta(m, x)])) };
}).sort((a, b) => ORDEM[a.c.tamanho] - ORDEM[b.c.tamanho] || b.x.torcidas - a.x.torcidas || a.c.nome.localeCompare(b.c.nome));

for (const m of MAPAS)
  console.log(`${m.nome}: ${m.estadios} estádio(s), ${m.sedeGrande} espaço(s) de sede grande e ${m.sedePequena} pequeno, ${m.bares} bares, ${m.favelas} favela(s), ${m.metro ? 'com' : 'sem'} metrô`);
console.log('');
for (const { c, x, zonas, falta: f } of linhas)
  console.log(`${c.tamanho.padEnd(7)} ${c.nome.padEnd(20)} ${x.torcidas} torcidas (${x.sedeGrande} de sede grande) · ${x.estadios} estádio(s) · ` +
              `${x.favelas} favela(s)${zonas ? ' ' + zonas : ''} · ${x.metro ? 'metrô' : 'sem metrô'}  | ` +
              MAPAS.map(m => `${m.nome}: ${f[m.id].length ? 'falta ' + f[m.id].join(', ') : 'cabe'}`).join('  | '));
console.log('');
for (const porte of ['Pequeno', 'Médio', 'Grande']) {
  const g = linhas.filter(l => l.c.tamanho === porte);
  console.log(`${porte}: ${g.length} praças · ` + MAPAS.map(m => `cabem ${m.em}: ${g.filter(l => !l.falta[m.id].length).length}`).join(' · '));
}

const i = process.argv.indexOf('--csv');
if (i > 0) {
  const cab = ['Cidade', 'Porte', 'Bairros', 'Torcidas', 'Sedes de nível 2+', 'Sedes de nível 1', 'Estádios', 'Bairros de favela', 'Zonas das favelas', 'Metrô']
    .concat(MAPAS.map(m => m.nome));
  const csv = [cab.join(';')].concat(linhas.map(({ c, x, zonas, falta: f }) => [c.nome, c.tamanho, c.bairros.length, x.torcidas, x.sedeGrande, x.sedePequena,
    x.estadios, x.favelas, zonas || '—', x.metro ? 'sim' : 'não'].concat(MAPAS.map(m => f[m.id].length ? 'falta ' + f[m.id].join(', ') : 'cabe')).join(';')));
  fs.writeFileSync(process.argv[i + 1], '﻿' + csv.join('\r\n'));
  console.log('\nCSV em', process.argv[i + 1]);
}
