/* =========================================================
   DA CALÇADA SE CHEGA À PLATAFORMA DO METRÔ?
   ---------------------------------------------------------
   O boneco a pé do cenário 3D desce pro metrô pisando nos triângulos da
   estação (subsolo.js): o chão é o que está a um degrau do pé, e a
   parede é o que a estação tem na faixa do corpo contada do pé. Este
   teste monta cada estação que os mapas têm (metro3d.js), com a mesma
   conta do cenário, e procura, a partir da praça na frente da escada, por
   onde um corpo de RAIO m passa — de 10 em 10 cm, em x, z e na altura do
   pé. Pede:
   - que se chegue ao MEZANINO do lado pago (depois da catraca);
   - que se chegue à PLATAFORMA, e a pelo menos 85% do chão livre dela
     (o canto atrás do banco é normal; meia plataforma não);
   - que o pé nunca fique abaixo da plataforma (no trilho).
   O boneco tem 25 cm de raio; o teste pede 30.

     node ferramentas/planta_html/conferir_metro.mjs [--fotos pasta]

   Com --fotos, sai uma imagem por estação (PPM), vista de cima: a cor é
   a altura do pé onde o corpo chegou (claro na rua, escuro embaixo),
   vermelho o chão livre da plataforma aonde ele não chega, preto os
   riscos da plataforma.
   ========================================================= */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
global.TO = { dados: {} };
for (const f of ['torcidas', 'times', 'cena_estadio', 'cidades']) require(path.join(R, 'dados', f + '.js'));
const P = TO.dados.plantaEstadio;
const { gerarProposta, MAPAS } = await import(path.join(R, 'ferramentas/planta_html/proposta.js'));
const { montarEstacao } = await import(path.join(R, 'js/diajogo/metro3d.js'));
const { METRO: M } = await import(path.join(R, 'js/diajogo/construtor3d.js'));
const { Subsolo } = await import(path.join(R, 'ferramentas/planta_html/subsolo.js'));

export const RAIO = 0.3;
const PASSO = 0.1;                        // m: a grade da procura
const arg = process.argv.indexOf('--fotos'), FOTOS = arg > 0 ? process.argv[arg + 1] : null;
if (FOTOS) fs.mkdirSync(FOTOS, { recursive: true });

/* as estações: uma por (mapa, estação), sem repetir a mesma planta */
const casos = new Map();
for (const id of ['pequeno', 'medio', 'grande']) {
  const G = gerarProposta(P, MAPAS[id]);
  if (!G.metro) continue;
  for (const e of G.metro.estacoes) {
    const k = [e.nome, e.entrada.x0, e.entrada.x1, e.entrada.y0, e.entrada.y1].map(v => typeof v === 'number' ? Math.round(v) : v).join('|');
    if (!casos.has(k)) casos.set(k, { est: e, outra: G.metro.estacoes.find(o => o !== e).nome, onde: id + ' ' + e.nome });
  }
}

let falhas = 0;
for (const cs of casos.values()) {
  const destino = {};
  const r = montarEstacao(cs.est, destino, { outra: cs.outra });
  const A = r.andar, S = Subsolo(M, [A]);
  for (const lista of Object.values(destino)) for (const b of lista) S.juntar(b.pos, b.pos.length / 3);
  S.fechar();
  const h = PASSO * M, rr = RAIO * M, mg = 3 * M;
  const x0 = A.caixa.x0 - mg, z0 = A.caixa.z0 - mg, nx = Math.ceil((A.caixa.x1 + mg - x0) / h), nz = Math.ceil((A.caixa.z1 + mg - z0) / h);
  const KY = 0.02 * M, NY = 800, BASE = 700;           // a altura do pé, de 2 em 2 cm (de -14 m a +2 m)
  const chave = (i, j, y) => (Math.round(y / KY) + BASE) * nx * nz + j * nx + i;
  /* a procura em largura, da boca do poço */
  const [bx, bz] = A.boca, i0 = Math.round((bx - x0) / h), j0 = Math.round((bz - z0) / h);
  const y0 = S.chao(x0 + i0 * h, z0 + j0 * h, 0);
  const visto = new Set(), fila = [];
  const chegou = new Map();                            // (i, j) → a altura mais baixa do pé ali
  if (y0 === y0 && S.cabe(x0 + i0 * h, z0 + j0 * h, y0, rr)) { visto.add(chave(i0, j0, y0)); fila.push([i0, j0, y0]); }
  let yMin = Infinity;
  for (let q = 0; q < fila.length; q++) {
    const [i, j, y] = fila[q];
    const k2 = j * nx + i;
    if (!chegou.has(k2) || y < chegou.get(k2)) chegou.set(k2, y);
    if (y < yMin) yMin = y;
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      if (!di && !dj) continue;
      const a = i + di, b = j + dj;
      if (a < 0 || b < 0 || a >= nx || b >= nz) continue;
      const x = x0 + a * h, z = z0 + b * h, y2 = S.chao(x, z, y);
      if (y2 !== y2) continue;
      const k = chave(a, b, y2);
      if (visto.has(k)) continue;
      if (!S.cabe(x, z, y2, rr)) continue;
      visto.add(k); fila.push([a, b, y2]);
    }
  }
  /* o que se pede */
  const N = A.niveis, yPlat = N.plataforma * M, yMez = N.mezanino * M;
  const noRet = (rt, x, z) => x >= rt.x0 && x <= rt.x1 && z >= rt.z0 && z <= rt.z1;
  let platLivre = 0, platAlc = 0, mezPago = 0;
  /* o lado pago do mezanino: do outro lado da catraca, visto da boca do poço */
  const cat = A.bracos[0], catX = (cat.x0 + cat.x1) / 2, bocaLado = Math.sign(bx - catX);
  for (const [i, j, y] of fila) {
    const x = x0 + i * h, z = z0 + j * h;
    if (Math.abs(y - yMez) < 0.01 * M && noRet(A.mezanino, x, z) && Math.sign(x - catX) === -bocaLado) mezPago++;
  }
  const img = FOTOS ? new Uint8Array(nx * nz * 3).fill(235) : null;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = x0 + i * h, z = z0 + j * h, y = chegou.get(j * nx + i);
    if (noRet(A.plataforma, x, z)) {
      const yc = S.chao(x, z, yPlat);
      if (yc === yc && Math.abs(yc - yPlat) < 0.01 * M && S.cabe(x, z, yc, rr)) {
        platLivre++;
        if (y !== undefined && Math.abs(y - yPlat) < 0.01 * M) platAlc++;
        else if (img) img.set([200, 30, 30], (j * nx + i) * 3);
      }
    }
    if (img && y !== undefined) { const t = Math.max(0, Math.min(1, -y / (11 * M))); img.set([Math.round(120 - 90 * t), Math.round(210 - 150 * t), Math.round(120 + 60 * t)], (j * nx + i) * 3); }
  }
  const pct = platLivre ? 100 * platAlc / platLivre : 0;
  const erros = [];
  if (!mezPago) erros.push('não passa a catraca');
  if (!platAlc) erros.push('não chega à plataforma');
  else if (pct < 85) erros.push('só alcança ' + pct.toFixed(0) + '% da plataforma');
  if (yMin < yPlat - 0.01 * M) erros.push('o pé desce abaixo da plataforma (' + (yMin / M).toFixed(2) + ' m)');
  if (erros.length) falhas++;
  console.log(cs.onde.padEnd(16), 'estados', String(visto.size).padStart(7), '· mezanino pago', String(mezPago).padStart(5),
              '· plataforma', platAlc + '/' + platLivre, '(' + pct.toFixed(0) + '%) · pé mais baixo', (yMin / M).toFixed(2), 'm', erros.length ? '· ERRO: ' + erros.join('; ') : '· ok');
  if (img) {
    /* os riscos da plataforma, pretos */
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = x0 + i * h, z = z0 + j * h;
      if (noRet(A.plataforma, x, z) && !S.cabe(x, z, yPlat, 0.04 * M)) img.set([20, 20, 20], (j * nx + i) * 3);
    }
    const arq = path.join(FOTOS, cs.onde.replace(/\W+/g, '_') + '.ppm');
    fs.writeFileSync(arq, Buffer.concat([Buffer.from(`P6 ${nx} ${nz} 255\n`), Buffer.from(img)]));
  }
}
console.log(falhas ? `${falhas} estação(ões) com erro` : 'de toda estação se chega da calçada à plataforma');
process.exit(falhas ? 1 : 0);
