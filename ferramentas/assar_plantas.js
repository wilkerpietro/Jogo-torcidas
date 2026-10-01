/* ASSAR AS PLANTAS DAS PRAÇAS PRO MAPA DO JOGO 2D (01/10/2026)

   O dono: "implementar o mapa 2d que acabamos de construir na versão 3d
   no jogo". A planta da cidade é desenhada pela página do jogo 3D
   (cenario3d/planta.html, um módulo de 8 mil linhas com o three.js) e não
   cabe no jogo de feed. Este script abre a planta no Chromium, em modo
   teste, e guarda de cada uma das 30 praças:
     · o chão (ruas, quadras, favelas, estádios, praia) sem bairros, sem
       rótulos e sem carros, em img/mapas/<id>.webp (uns 4,4 milhões de
       pixels por praça, a comprida mais larga);
     · em dados/plantas.js, a grade dos bairros, os rótulos (estádios,
       equipamentos, marcos, os nomes das cidades) e as sedes da planta.
   O jogo pinta por cima, ao vivo, a dona de cada bairro.

   Uso (com o servidor da raiz no ar em 127.0.0.1:8799):
     git show origin/claude/stadium-3d-crowd-scene-rkgk8o:vendor/three/three.module.min.js > /tmp/three.module.min.js
     THREE_JS=/tmp/three.module.min.js node ferramentas/assar_plantas.js
   (SO=fortaleza,recife assa só essas; o resto de dados/plantas.js fica.)
*/
let chromium;
try { ({chromium} = require('playwright')); } catch(e){ ({chromium} = require('/opt/node22/lib/node_modules/playwright')); }
const fs = require('fs'), path = require('path');
const RAIZ = path.resolve(__dirname, '..');
const THREE_JS = process.env.THREE_JS || '/tmp/three.module.min.js';
const LADO = +(process.env.LADO || 2200), QUAL = +(process.env.QUAL || 0.7);
const SO = process.env.SO ? process.env.SO.split(',') : null;
(async () => {
  const nav = await chromium.launch({executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined, args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const ctx = await nav.newContext({viewport:{width:1400,height:900}});
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/three/, r => r.fulfill({body: fs.readFileSync(THREE_JS), contentType:'application/javascript'}));
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.fulfill({body:'', contentType:'text/css'}));
  const pg = await ctx.newPage();
  pg.on('pageerror', e=>console.log('ERRO', e.message));
  await pg.goto('http://127.0.0.1:8799/cenario3d/planta.html?teste', {timeout:120000});
  await pg.waitForFunction(()=>window.__planta && document.querySelector('#sel-cidade').options.length > 0, null, {timeout:120000});
  await pg.waitForTimeout(3000);
  const nomes = await pg.evaluate(()=>[...document.querySelector('#sel-cidade').options].map(o=>o.value));
  fs.mkdirSync(RAIZ+'/img/mapas', {recursive:true});
  const saida = {};
  for(const nome of nomes){
    const r = await pg.evaluate(async ({nome, LADO, QUAL, SO})=>{
      const P = window.__planta, norm = s => String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();
      const cid = (TO.dados.cidades.find(c => norm(c.nome) === norm(nome)) || {}).id;
      if(!cid || (SO && !SO.includes(cid))) return {pula:nome};
      const sel = document.querySelector('#sel-cidade'); sel.value = nome;
      P.mudarCidade(nome);
      await new Promise(ok => setTimeout(ok, 300));
      const L = P.api.limite();
      const w = L.x1 - L.x0, h = L.y1 - L.y0, s = Math.min(Math.sqrt(LADO*LADO*0.9 / (w*h)), 6000 / Math.max(w, h));
      const cv = document.createElement('canvas'); cv.width = Math.round(w*s); cv.height = Math.round(h*s);
      const c2 = cv.getContext('2d');
      const cam = P.estado.camadas, antes = {...cam};
      Object.assign(cam, {bairros:false, rotulos:false, carros:false, props:false, grade:false});
      P.api.pintarMapa(c2, L.x0, L.y0, s, 1);
      const img = cv.toDataURL('image/webp', QUAL);
      /* os rótulos: o mesmo desenho com os rótulos ligados, gravando o fillText */
      const cv2 = document.createElement('canvas'); cv2.width = cv.width; cv2.height = cv.height;
      const c3 = cv2.getContext('2d'), rot = [];
      const orig = c3.fillText.bind(c3);
      c3.fillText = (t, x, y, mw) => { rot.push({t:String(t), x:+(x/s + L.x0).toFixed(0), y:+(y/s + L.y0).toFixed(0), cor:c3.fillStyle, fonte:c3.font}); return orig(t, x, y, mw); };
      Object.assign(cam, {bairros:false, rotulos:true, carros:false, props:false, grade:false, arvores:false});
      P.api.pintarMapa(c3, L.x0, L.y0, s, 1);
      Object.assign(cam, antes);
      /* a grade dos bairros, linha por linha em corridas [bairro, quantas] */
      const S = P.SETORES;
      const linhas = [];
      for(let j=0;j<S.ny;j++){
        const l = []; let i = 0;
        while(i < S.nx){ const k = S.rot[j*S.nx+i]; let e = i+1; while(e < S.nx && S.rot[j*S.nx+e] === k) e++; l.push(k, e-i); i = e; }
        linhas.push(l);
      }
      const bairros = S.bairros.map(b => ({id:b.id, nome:b.nome, zona:b.zona || null, cx:b.centro ? Math.round(b.centro.x) : null, cy:b.centro ? Math.round(b.centro.y) : null, cel:b.celulas || 0, fora:!!b.deFora}));
      const sedes = (P.espacos || []).filter(e => e.dono).map(e => ({sigla:e.dono.sigla, id:e.dono.id || null, x:Math.round((e.bb.x0+e.bb.x1)/2), y:Math.round((e.bb.y0+e.bb.y1)/2)}));
      return {cid, nome, img, w:cv.width, h:cv.height, L:{x0:Math.round(L.x0), y0:Math.round(L.y0), x1:Math.round(L.x1), y1:Math.round(L.y1)},
              grade:{x0:S.x0, y0:S.y0, cel:S.cel, nx:S.nx, ny:S.ny, linhas}, bairros, rot, sedes, zonas:S.zonas};
    }, {nome, LADO, QUAL, SO});
    if(r.pula){ continue; }
    const buf = Buffer.from(r.img.split(',')[1], 'base64');
    fs.writeFileSync(`${RAIZ}/img/mapas/${r.cid}.webp`, buf);
    delete r.img;
    saida[r.cid] = r;
    console.log(r.cid, r.w+'x'+r.h, (buf.length/1024).toFixed(0)+'KB', 'bairros', r.bairros.length, 'rotulos', r.rot.length, 'sedes', r.sedes.length);
  }
  gravar(saida);
  await nav.close();
})();

/* os rótulos que valem no mapa do jogo: as etiquetas (estádio,
   equipamento, marco) e os nomes das cidades; a sede, o bar e a quadra
   numerada saem (o jogo desenha as sedes dele, na cor da dona) */
function gravar(novas){
  const arq = path.join(RAIZ, 'dados', 'plantas.js');
  let velhas = {};
  if(SO && fs.existsSync(arq)){
    const t = fs.readFileSync(arq, 'utf8');
    velhas = JSON.parse(t.slice(t.indexOf('TO.dados.plantas = ') + 19).replace(/;\s*$/, ''));
  }
  const FORA = /^(Sede\b|Bar d[ao]\b|Casa de classe|Q \d)/;
  for(const [cid, p] of Object.entries(novas)){
    const r = [], vistos = new Set();
    for(const x of p.rot){
      const tipo = x.cor === '#ffe9a8' ? 'c' : x.cor === '#f2f3ef' ? 'e' : null;
      if(!tipo || (tipo === 'e' && FORA.test(x.t))) continue;
      const k = `${x.t}|${Math.round(x.x/200)}|${Math.round(x.y/200)}`;
      if(vistos.has(k)) continue;
      vistos.add(k); r.push([x.t, x.x, x.y, tipo]);
    }
    const g = p.grade, z = {};
    for(const [k, v] of Object.entries(p.zonas || {})) if(v) z[k] = [Math.round(v.x), Math.round(v.y)];
    velhas[cid] = {w:p.w, h:p.h, L:p.L,
      g:{x0:+g.x0.toFixed(1), y0:+g.y0.toFixed(1), cel:+g.cel.toFixed(3), nx:g.nx, ny:g.ny, l:g.linhas},
      b:p.bairros.map(b => [b.id, b.nome, b.zona, b.cx, b.cy]), r,
      s:p.sedes.map(s => [s.id, s.sigla, s.x, s.y]), z};
  }
  const ord = {};
  for(const k of Object.keys(velhas).sort()) ord[k] = velhas[k];
  const CAB = fs.readFileSync(arq, 'utf8').split('TO.dados.plantas = ')[0];
  fs.writeFileSync(arq, CAB + 'TO.dados.plantas = ' + JSON.stringify(ord) + ';\n');
  console.log('dados/plantas.js:', Object.keys(ord).length, 'praças');
}
