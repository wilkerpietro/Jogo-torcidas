/* exportar3d.js <id do estádio> <saída.glb> [estadio|arredores] [fatias] : o protótipo 3D dos arredores de um estádio (a cena de fora inteira: o estádio,
   as ruas do mapa, as casas, os portões), em .glb, pra ver girando. Precisa do servidor da bancada:
     python3 -m http.server 8799 --bind 127.0.0.1   (na raiz do repositório)
   Imprime um .json ao lado, com o quadro da cena e os portões. */
const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const [id, saida, parte, fat] = process.argv.slice(2), fatias = +fat || 0;
  const nav = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await nav.newPage(); pg.on('pageerror', e => console.log('ERRO', e.message));
  await pg.goto('http://127.0.0.1:8799/ferramentas/estadios/bancada.html', { waitUntil: 'load' }); await pg.waitForFunction(() => window.pronto, null, { timeout: 120000 });
  /* (com `fatias`, grava <saída>-1.json … <saída>-N.json: o .gltf de texto, com os dados dentro, que a página publicada serve) */
  if (fatias) { for (let k = 0; k < fatias; k++) { const r = await pg.evaluate(([id, parte, k, n]) => window.exportar3d(id, parte, k, n), [id, parte, k, fatias]);
      const arq = saida.replace(/\.glb$/, '') + '-' + (k + 1) + '.json'; fs.writeFileSync(arq, r.gltf); console.log(arq, r.malhas, 'malhas,', (fs.statSync(arq).size / 1048576).toFixed(1), 'MB'); }
    await nav.close(); return; }
  const r = await pg.evaluate(([id, parte]) => window.exportar3d(id, parte), [id, parte]);
  fs.writeFileSync(saida, Buffer.from(r.glb, 'base64')); fs.writeFileSync(saida.replace(/\.glb$/, '') + '.json', JSON.stringify({ id, quadro: r.quadro, portoes: r.portoes }, null, 1));
  console.log(id, r.malhas, 'malhas,', (fs.statSync(saida).size / 1048576).toFixed(1), 'MB'); await nav.close(); })();
