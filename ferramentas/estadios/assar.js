/* ASSAR OS ESTÁDIOS LOW-POLY (14/11/2026)
   Abre a bancada (bancada.html) no Chromium, monta cada ficha (fichas.mjs),
   fotografa de cima e grava:
     · cenario3d/img/cenas/<id>.webp — o palco da cena, 1536 × 1024;
     · cenario3d/dados/estadios_cenas.js — a máscara de onde se anda, os
       marcadores (bondes, túneis, grades, PM, faixas) e os clubes de cada um;
     · as fotos de conferência (satélite, aérea, TV) na pasta dada em CONF.
   Uso (com o servidor da raiz em 127.0.0.1:8799):
     node ferramentas/estadios/assar.js            (todas as fichas)
     SO=estadio-aflitos CONF=/tmp/x node ferramentas/estadios/assar.js */
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const fs = require('fs'), path = require('path');
const RAIZ = path.resolve(__dirname, '..', '..');
const SO = process.env.SO ? process.env.SO.split(',') : null, CONF = process.env.CONF || null;
const bin = u => Buffer.from(u.split(',')[1], 'base64');
(async () => {
  const nav = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await nav.newPage({ viewport: { width: 1600, height: 1100 } });
  pg.on('pageerror', e => console.log('ERRO', e.message)); pg.on('console', m => { if (m.type() === 'error') console.log('console:', m.text().slice(0, 200)); });
  await pg.goto('http://127.0.0.1:8799/ferramentas/estadios/bancada.html', { waitUntil: 'load' });
  await pg.waitForFunction(() => window.pronto, null, { timeout: 60000 });
  const ids = (await pg.evaluate(() => window.FICHAS)).filter(id => !SO || SO.includes(id));
  const saida = path.join(RAIZ, 'cenario3d', 'dados', 'estadios_cenas.js');
  let dados = {};
  if (fs.existsSync(saida)) { try { dados = JSON.parse(fs.readFileSync(saida, 'utf8').match(/window\.__ESTADIOS = (\{[\s\S]*\});/)[1]); } catch (e) { dados = {}; } }
  for (const id of ids) {
    const t0 = Date.now();
    const r = await pg.evaluate(id => window.assar(id), id);
    const arq = id.replace(/-/g, '_') + '.webp';
    fs.writeFileSync(path.join(RAIZ, 'cenario3d', 'img', 'cenas', arq), bin(r.imagem));
    dados[id] = { nome: r.nome, clubes: r.clubes, escala: r.escala, setores: { mandante: r.cena.spawns.filter(s => s.lado === 'mandante').length, visitante: r.cena.spawns.filter(s => s.lado === 'visitante').length },
                  foto: { imagem: 'img/cenas/' + arq, mascara: r.mascara }, cena: r.cena };
    if (CONF) { fs.mkdirSync(CONF, { recursive: true }); for (const k of ['satelite', 'aerea', 'tv']) fs.writeFileSync(path.join(CONF, id + '_' + k + '.jpg'), bin(r[k])); fs.writeFileSync(path.join(CONF, id + '_cima.webp'), bin(r.imagem)); }
    console.log(id, 'escala', r.escala, 'px/m ·', Math.round(bin(r.imagem).length / 1024), 'KB ·', Date.now() - t0, 'ms');
  }
  fs.writeFileSync(saida, '/* GERADO por ferramentas/estadios/assar.js — não editar à mão.\n   Os estádios low-poly das cenas: a foto de cima, a máscara de onde se anda\n   e os marcadores de cada um; `clubes` diz quem manda o jogo ali. */\nwindow.__ESTADIOS = ' + JSON.stringify(dados, null, 1) + ';\n');
  await nav.close();
})();
