/* montar.js <pasta de saída> : monta a página da BANCADA DA CHEGADA (ver chegada.js) numa pasta só — a página, com o painel
   embutido, e ao lado dela a cópia dos arquivos do jogo que a cena de arredores usa, nos mesmos caminhos de jogo.html. A
   versão de cache (`?v=…`) sai dos endereços: a pasta é servida como está, sem cache pra furar. Imprime a lista dos
   arquivos copiados (é a lista que se publica junto com a página). */
const fs = require('fs'), path = require('path');
const RAIZ = path.join(__dirname, '..', '..', 'cenario3d'), SAIDA = path.resolve(process.argv[2] || 'chegada_saida');
const ARQUIVOS = ['css/jogo.css', 'css/jogo3d.css', 'css/portal.css', 'css/telas3d.css',
  'js/jogo2d.js', 'js/jogo_casca.js', 'js/jogo.js', 'js/portal.js', 'js/bonecos3_global.js', 'js/bonecos3_cena.js', 'js/GLTFLoader.js',
  'dados/imagens_jogo.js', 'dados/estadios_cenas.js', 'dados/arredores_cenas.js', 'dados/boneco_glb.js'];
/* as fotos de cima dos arredores (só elas: a cena de dentro de cada estádio não abre na bancada) */
const cenas = fs.readFileSync(path.join(RAIZ, 'dados', 'arredores_cenas.js'), 'utf8');
for (const m of cenas.matchAll(/"imagem": "([^"?]+)/g)) ARQUIVOS.push(m[1]);
const semVersao = t => t.replace(/\?v=[0-9a-f]{8,10}/g, '');
fs.rmSync(SAIDA, { recursive: true, force: true });
let total = 0;
for (const a of ARQUIVOS) { const de = path.join(RAIZ, a), para = path.join(SAIDA, a); fs.mkdirSync(path.dirname(para), { recursive: true });
  if (/\.(js|css)$/.test(a)) fs.writeFileSync(para, semVersao(fs.readFileSync(de, 'utf8'))); else fs.copyFileSync(de, para);
  total += fs.statSync(para).size; }
const pagina = fs.readFileSync(path.join(__dirname, 'pagina.html'), 'utf8').replace('/*CHEGADA*/', () => fs.readFileSync(path.join(__dirname, 'chegada.js'), 'utf8'));
fs.writeFileSync(path.join(SAIDA, 'chegada.html'), pagina);
fs.writeFileSync(path.join(SAIDA, 'arquivos.json'), JSON.stringify(ARQUIVOS));
console.log(ARQUIVOS.length + ' arquivos, ' + (total / 1048576).toFixed(1) + ' MB, em ' + SAIDA);
