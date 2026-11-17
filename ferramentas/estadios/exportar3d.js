/* exportar3d.js <id do estádio> <saída.glb> : o protótipo 3D dos arredores de um estádio (a cena de fora inteira: o estádio,
   as ruas do mapa, as casas, os portões), em .glb, pra ver girando. Precisa do servidor da bancada:
     python3 -m http.server 8799 --bind 127.0.0.1   (na raiz do repositório)
   Imprime um .json ao lado, com o quadro da cena e os portões. */
const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const [id, saida] = process.argv.slice(2);
  const nav = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await nav.newPage(); pg.on('pageerror', e => console.log('ERRO', e.message));
  await pg.goto('http://127.0.0.1:8799/ferramentas/estadios/bancada.html', { waitUntil: 'load' }); await pg.waitForFunction(() => window.pronto, null, { timeout: 120000 });
  const r = await pg.evaluate(id => window.exportar3d(id), id);
  fs.writeFileSync(saida, Buffer.from(r.glb, 'base64')); fs.writeFileSync(saida.replace(/\.glb$/, '') + '.json', JSON.stringify({ id, quadro: r.quadro, portoes: r.portoes }, null, 1));
  console.log(id, r.malhas, 'malhas,', (fs.statSync(saida).size / 1048576).toFixed(1), 'MB'); await nav.close(); })();
