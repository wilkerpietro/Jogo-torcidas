/* ASSAR OS ESTÁDIOS LOW-POLY (14/11/2026)
   Abre a bancada (bancada.html) no Chromium, monta cada ficha (fichas.mjs),
   fotografa de cima e grava:
     · cenario3d/img/cenas/<id>.webp — o palco da cena, 3072 × 2048 (o dobro da cena comum);
     · cenario3d/dados/estadios_cenas.js — a máscara de onde se anda, os
       marcadores (bondes, túneis, grades, PM, faixas) e os clubes de cada um;
     · as fotos de conferência (satélite, aérea, TV) na pasta dada em CONF.
   Uso (com o servidor da raiz em 127.0.0.1:8799):
     node ferramentas/estadios/assar.js            (todas as fichas)
     SO=estadio-aflitos CONF=/tmp/x node ferramentas/estadios/assar.js
   OS ARREDORES DE VERDADE (as fichas que têm `arredores`): ARREDORES=1 assa a cena de fora do estádio em vez da de dentro —
     · cenario3d/img/cenas/arredores_<id>.webp e cenario3d/dados/arredores_cenas.js.
     ARREDORES=1 SO=estadio-independencia CONF=/tmp/x node ferramentas/estadios/assar.js
   Pra conferir UMA FICHA AVULSA sem gravar nada no jogo (só as fotos de conferência em CONF):
     FICHA=ferramentas/estadios/fichas/estadio-x.mjs CONF=/tmp/x node ferramentas/estadios/assar.js */
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const fs = require('fs'), path = require('path');
const RAIZ = path.resolve(__dirname, '..', '..');
const SO = process.env.SO ? process.env.SO.split(',') : null, CONF = process.env.CONF || null;
const FICHA = process.env.FICHA ? process.env.FICHA.replace(/^\/+/, '') : null;
if (FICHA && !CONF) { console.log('com FICHA=... diga também CONF=<pasta das fotos de conferência>'); process.exit(1); }
const bin = u => Buffer.from(u.split(',')[1], 'base64');
(async () => {
  const nav = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await nav.newPage({ viewport: { width: 1600, height: 1100 } });
  pg.on('pageerror', e => console.log('ERRO', e.message)); pg.on('console', m => { if (m.type() === 'error') console.log('console:', m.text().slice(0, 200)); });
  await pg.goto('http://127.0.0.1:8799/ferramentas/estadios/bancada.html' + (FICHA ? '?ficha=/' + FICHA : ''), { waitUntil: 'load' });
  await pg.waitForFunction(() => window.pronto, null, { timeout: 60000 });
  const ids = FICHA ? [await pg.evaluate(() => window.SO_FICHA)] : (await pg.evaluate(() => window.FICHAS)).filter(id => !SO || SO.includes(id));
  /* ---- OS ARREDORES DE VERDADE ---- */
  if (process.env.ARREDORES) {
    const saidaA = path.join(RAIZ, 'cenario3d', 'dados', 'arredores_cenas.js');
    let dadosA = {};
    if (fs.existsSync(saidaA)) { try { dadosA = JSON.parse(fs.readFileSync(saidaA, 'utf8').match(/window\.__ARREDORES = (\{[\s\S]*\});/)[1]); } catch (e) { dadosA = {}; } }
    const com = await pg.evaluate(() => window.COM_ARREDORES);
    for (const id of ids.filter(i => com.includes(i))) {
      const t0 = Date.now(), r = await pg.evaluate(id => window.assarArredores(id), id), arq = 'arredores_' + id.replace(/-/g, '_') + '.webp';
      if (!FICHA) fs.writeFileSync(path.join(RAIZ, 'cenario3d', 'img', 'cenas', arq), bin(r.imagem));
      dadosA[id] = Object.assign({ nome: r.nome, escala: r.escala, imagem: 'img/cenas/' + arq + '?v=' + require('crypto').createHash('sha1').update(bin(r.imagem)).digest('hex').slice(0, 8), largura: r.largura, altura: r.altura, celula: 8,
        poligonos: { caminhavel: [], bloqueio: [] }, mascara: r.mascara }, r.soFora ? { soFora: true } : {}, r.cena);
      if (CONF) { fs.mkdirSync(CONF, { recursive: true }); fs.writeFileSync(path.join(CONF, id + '_arredores.webp'), bin(r.imagem)); for (const k of ['aerea', 'aerea2', 'perto']) if (r[k]) fs.writeFileSync(path.join(CONF, id + '_arredores_' + k + '.jpg'), bin(r[k])); }
      /* cada bonde tem caminho até o portão dele? (pela máscara, com as grades e as filas fechando a passagem) */
      { const linhas = r.mascara.split(';'), C = r.largura / 8, R = linhas.length, m = new Uint8Array(C * R);
        linhas.forEach((l, y) => { let c = 0, v = 0; for (const n of l.split(',')) { for (let k = 0; k < +n && c < C; k++, c++) m[y * C + c] = v; v ^= 1; } });
        const fecha = (a, b) => { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3); for (let k = 0; k <= n; k++) { const x = a[0] + (b[0] - a[0]) * k / n, y = a[1] + (b[1] - a[1]) * k / n; for (const [dx, dy] of [[0, 0], [5, 0], [-5, 0], [0, 5], [0, -5]]) { const i = Math.floor((y + dy) / 8) * C + Math.floor((x + dx) / 8); if (i >= 0 && i < m.length) m[i] = 0; } } };
        for (const g of r.cena.grades) fecha([g.de.x, g.de.y], [g.ate.x, g.ate.y]);
        for (const f of r.cena.filas) for (let k = 0; k < f.pontos.length - 1; k++) fecha(f.pontos[k], f.pontos[k + 1]);
        const faltam = [];
        for (const sp of r.cena.spawns) { const e = r.cena.entradas.find(x => x.id === sp.entrada), alvo = Math.floor(e.y / 8) * C + Math.floor(e.x / 8), ini = Math.floor(sp.y / 8) * C + Math.floor(sp.x / 8), visto = new Uint8Array(C * R), f = [ini]; visto[ini] = 1; let achou = false;
          if (!m[ini]) { faltam.push(sp.id + ' (nasce fora do chão)'); continue; }
          while (f.length) { const j = f.pop(); if (Math.abs((j % C) - (alvo % C)) <= 3 && Math.abs(Math.floor(j / C) - Math.floor(alvo / C)) <= 3) { achou = true; break; } const c = j % C, y = (j - c) / C;
            for (const k of [c > 0 ? j - 1 : -1, c < C - 1 ? j + 1 : -1, y > 0 ? j - C : -1, y < R - 1 ? j + C : -1]) if (k >= 0 && m[k] && !visto[k]) { visto[k] = 1; f.push(k); } }
          if (!achou) faltam.push(sp.id + ' → ' + sp.entrada); }
        console.log(id, 'arredores ·', r.largura + '×' + r.altura, '·', r.escala, 'px/m ·', r.lotes, 'lotes,', r.casas, 'casas,', r.falhas, 'falhas ·', Math.round(bin(r.imagem).length / 1024), 'KB ·', Date.now() - t0, 'ms · caminho até o portão:', faltam.length ? 'FALTA ' + faltam.join(', ') : 'todos'); }
    }
    if (!FICHA) fs.writeFileSync(saidaA, '/* GERADO por ferramentas/estadios/assar.js (ARREDORES=1) — não editar à mão.\n   Os arredores de verdade de cada estádio: a foto de cima, a máscara de onde se anda e os marcadores (bondes, portões,\n   grades, filas, PM), no formato da cena de arredores do jogo. As ruas são do OpenStreetMap (© colaboradores do\n   OpenStreetMap, ODbL). */\nwindow.__ARREDORES = ' + JSON.stringify(dadosA, null, 1) + ';\n');
    await nav.close(); return;
  }
  const saida = path.join(RAIZ, 'cenario3d', 'dados', 'estadios_cenas.js');
  let dados = {};
  if (fs.existsSync(saida)) { try { dados = JSON.parse(fs.readFileSync(saida, 'utf8').match(/window\.__ESTADIOS = (\{[\s\S]*\});/)[1]); } catch (e) { dados = {}; } }
  for (const id of ids) {
    const t0 = Date.now();
    const r = await pg.evaluate(id => window.assar(id), id);
    const arq = id.replace(/-/g, '_') + '.webp';
    if (!FICHA) fs.writeFileSync(path.join(RAIZ, 'cenario3d', 'img', 'cenas', arq), bin(r.imagem));
    dados[id] = { nome: r.nome, clubes: r.clubes, escala: r.escala, largura: r.largura, altura: r.altura, setores: { mandante: r.cena.spawns.filter(s => s.lado === 'mandante').length, visitante: r.cena.spawns.filter(s => s.lado === 'visitante').length },
                  foto: { imagem: 'img/cenas/' + arq + '?v=' + require('crypto').createHash('sha1').update(bin(r.imagem)).digest('hex').slice(0, 8), mascara: r.mascara }, cena: r.cena };
    if (CONF) { fs.mkdirSync(CONF, { recursive: true }); for (const k of ['satelite', 'aerea', 'aerea2', 'tv']) fs.writeFileSync(path.join(CONF, id + '_' + k + '.jpg'), bin(r[k])); fs.writeFileSync(path.join(CONF, id + '_cima.webp'), bin(r.imagem)); if (r.perto) fs.writeFileSync(path.join(CONF, id + '_perto.jpg'), bin(r.perto)); }
    /* O CHÃO É UM SÓ? As ilhas de chão andável da máscara, e se os marcadores (bondes, túneis, PM) caem na maior. */
    { const linhas = r.mascara.split(';'), C = 384, R = linhas.length, m = new Uint8Array(C * R);
      linhas.forEach((l, y) => { let c = 0, v = 0; for (const n of l.split(',')) { for (let k = 0; k < +n && c < C; k++, c++) m[y * C + c] = v; v ^= 1; } });
      const ilha = new Int32Array(C * R).fill(-1), tam = [];
      for (let i = 0; i < m.length; i++) { if (!m[i] || ilha[i] >= 0) continue; const n = tam.length, f = [i]; let t = 0; ilha[i] = n;
        while (f.length) { const j = f.pop(), c = j % C, y = (j - c) / C; t++; for (const k of [c > 0 ? j - 1 : -1, c < C - 1 ? j + 1 : -1, y > 0 ? j - C : -1, y < R - 1 ? j + C : -1]) if (k >= 0 && m[k] && ilha[k] < 0) { ilha[k] = n; f.push(k); } }
        tam.push(t); }
      const maior = tam.indexOf(Math.max(...tam)), fora = [];
      const confere = (rot, p) => { const i = Math.floor(p.y / 8) * C + Math.floor(p.x / 8); if (ilha[i] !== maior) fora.push(rot); };
      r.cena.spawns.forEach(p => confere(p.id, p)); r.cena.entradas.forEach(p => confere(p.id, p)); r.cena.pmPostos.forEach((p, k) => confere('pm' + k, p));
      console.log(id, 'chão:', tam.length === 1 ? 'um só' : tam.length + ' ilhas ' + JSON.stringify(tam.sort((a, b) => b - a).slice(0, 6)), '· marcadores fora da ilha maior:', fora.length ? fora.join(', ') : 'nenhum'); }
    console.log(id, 'escala', r.escala, 'px/m ·', Math.round(bin(r.imagem).length / 1024), 'KB ·', Date.now() - t0, 'ms');
  }
  if (!FICHA) fs.writeFileSync(saida, '/* GERADO por ferramentas/estadios/assar.js — não editar à mão.\n   Os estádios low-poly das cenas: a foto de cima, a máscara de onde se anda\n   e os marcadores de cada um; `clubes` diz quem manda o jogo ali. */\nwindow.__ESTADIOS = ' + JSON.stringify(dados, null, 1) + ';\n');
  await nav.close();
})();
