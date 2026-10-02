/* =========================================================
   AS LOJAS DO ASSALTO SE ANDAM POR DENTRO?
   ---------------------------------------------------------
   Monta cada loja (lojas3d.js, pelo casas3d.js como a planta monta) nos
   tamanhos que a planta dá — o terreno do fundo inteiro da quadra
   (12,4 a 13 m) e a fileira da esquina (4,5 a 5,8 m), a esquina dos dois
   lados —, risca a faixa do corpo com a conta do cenário (passo.js) e
   procura, a partir da calçada na frente da porta, por onde um corpo de
   RAIO m passa (de 5 em 5 cm). Cada ponto da planta do assalto tem de
   se alcançar: o saque (o líder chega a 1,3 m dele), os postos de quem
   trabalha, os pontos dos clientes, o gravador, os fundos e a porta do
   lado (a fuga pela rua de lado).

     node ferramentas/planta_html/conferir_lojas.mjs
   ========================================================= */
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { planoDaCasa, montarCasa } = await import(path.join(R, 'js/diajogo/casas3d.js'));
const { TIPOS_DE_LOJA, MEDIDAS_LOJA, planoDaLoja } = await import(path.join(R, 'js/diajogo/lojas3d.js'));
const { METRO: M } = await import(path.join(R, 'js/diajogo/construtor3d.js'));
const { riscosDaFaixa, Paredes, FAIXA_M } = await import(path.join(R, 'ferramentas/planta_html/passo.js'));

const RAIO = 0.28, PASSO = 0.05;
const arg = process.argv.indexOf('--fotos'), FOTOS = arg > 0 ? process.argv[arg + 1] : null;
if (FOTOS) fs.mkdirSync(FOTOS, { recursive: true });
const falhas = [];
function conferir(tipo, W, D, esquina) {
  const l = { modelo: 'loja_' + tipo, frente: 's', esquina, x0: 0, x1: W * M, y0: -D * M, y1: 0, alt: 4.4 * M, placa: 'TESTE' };
  const p = planoDaCasa(l);
  const destino = { casas: [], grades: [] };
  montarCasa(l, p, destino, 0);
  const tris = destino.casas.concat(destino.grades);
  let nTri = 0;
  for (const b of tris) nTri += b.pos.length / 9;
  /* a caixa da procura: o lote e 3 m de calçada na frente e dos lados */
  const x0 = -3 * M, x1 = (W + 3) * M, z0 = (-D - 0.5) * M, z1 = 3 * M;
  const Wp = Paredes(x0, z0, x1, z1, 1.5 * M);
  for (const b of tris) riscosDaFaixa(b.pos, b.pos.length / 3, FAIXA_M[0] * M, FAIXA_M[1] * M, 0.01 * M, Wp.juntar);
  Wp.fechar();
  const c = PASSO * M, nx = Math.ceil((x1 - x0) / c), nz = Math.ceil((z1 - z0) / c);
  const livre = new Uint8Array(nx * nz), r = RAIO * M;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = x0 + (i + 0.5) * c, z = z0 + (j + 0.5) * c;
    /* fora do lote é rua (a calçada da frente e a do lado da esquina) — dentro, só o que não bate */
    livre[j * nx + i] = Wp.cabe(x, z, r) ? 1 : 0;
  }
  const cel = (x, z) => { const i = Math.floor((x - x0) / c), j = Math.floor((z - z0) / c); return i < 0 || j < 0 || i >= nx || j >= nz ? -1 : j * nx + i; };
  /* a procura: da calçada na frente da porta da frente */
  const plano = planoDaLoja(tipo, W, D, esquina);
  const frente = plano.portas.find(q => q.rua === 'frente');
  const ini = cel(frente.x * M, 1.5 * M);
  const visto = new Uint8Array(nx * nz), fila = [ini];
  if (ini >= 0 && livre[ini]) visto[ini] = 1;
  while (fila.length) {
    const k = fila.pop(), i = k % nx, j = (k - i) / nx;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ii = i + di, jj = j + dj, q = jj * nx + ii;
      if (ii < 0 || jj < 0 || ii >= nx || jj >= nz || visto[q] || !livre[q]) continue;
      visto[q] = 1; fila.push(q);
    }
  }
  /* o ponto se alcança se alguma célula alcançada está a `ate` m dele */
  const alcanca = (x, z, ate) => {
    const n = Math.ceil(ate / PASSO);
    const i0 = Math.floor((x * M - x0) / c), j0 = Math.floor((z * M - z0) / c);
    for (let dj = -n; dj <= n; dj++) for (let di = -n; di <= n; di++) {
      if (di * di + dj * dj > n * n) continue;
      const i = i0 + di, j = j0 + dj;
      if (i >= 0 && j >= 0 && i < nx && j < nz && visto[j * nx + i]) return true;
    }
    return false;
  };
  const erros = [];
  for (const s of plano.saque) if (!alcanca(s.x, s.z, 1.1)) erros.push('saque ' + s.id);
  for (const f of plano.funcionarios) if (!alcanca(f.x, f.z, 0.3)) erros.push(f.papel + ' (posto)');
  for (const f of plano.segurancas) { if (!alcanca(f.x, f.z, 0.3)) erros.push('segurança (posto)'); for (const q of f.ronda || []) if (!alcanca(q.x, q.z, 0.4)) erros.push('segurança (ronda)'); }
  for (const f of plano.clientes) if (!alcanca(f.x, f.z, 0.4)) erros.push('cliente ' + f.x.toFixed(1) + ',' + f.z.toFixed(1));
  if (plano.gravador && !alcanca(plano.gravador.x, plano.gravador.z, 1.1)) erros.push('gravador');
  if (plano.fundos && !alcanca(plano.fundos.x, plano.fundos.z, 0.5)) erros.push('fundos');
  for (const q of plano.portas) if (q.rua === 'lado') {
    const fora = esquina === 'esq' ? -1.2 : W + 1.2;
    if (!alcanca(fora, q.z, 0.3)) erros.push('saída do lado');
  }
  /* quanto do chão da loja se anda (as zonas da loja) */
  let chao = 0, anda = 0;
  for (const z of plano.zonas.loja) for (let x = z.x0 + 0.1; x < z.x1 - 0.1; x += 0.1) for (let zz = z.z0 + 0.1; zz < z.z1 - 0.1; zz += 0.1) {
    const k = cel(x * M, zz * M); if (k < 0) continue; chao++; if (visto[k]) anda++;
  }
  /* a foto (--fotos pasta): cinza o que o corpo não pisa, verde o que ele alcança, vermelho o livre que não se alcança, azul os pontos */
  if (FOTOS) {
    const img = Buffer.alloc(nx * nz * 3);
    for (let k = 0; k < nx * nz; k++) { const cor = visto[k] ? [90, 190, 90] : livre[k] ? [220, 60, 60] : [70, 70, 70]; img[3 * k] = cor[0]; img[3 * k + 1] = cor[1]; img[3 * k + 2] = cor[2]; }
    const marca = (x, z, cor) => { for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) { const k = cel(x * M + di * c, z * M + dj * c); if (k >= 0) { img[3 * k] = cor[0]; img[3 * k + 1] = cor[1]; img[3 * k + 2] = cor[2]; } } };
    for (const s of plano.saque) marca(s.x, s.z, [255, 220, 0]);
    for (const f of plano.funcionarios.concat(plano.segurancas, plano.clientes)) marca(f.x, f.z, [40, 120, 255]);
    if (plano.fundos) marca(plano.fundos.x, plano.fundos.z, [255, 0, 255]);
    fs.writeFileSync(path.join(FOTOS, `${tipo}_${D.toFixed(1)}_${esquina}.ppm`), Buffer.concat([Buffer.from(`P6 ${nx} ${nz} 255\n`), img]));
  }
  const txt = `${tipo.padEnd(12)} ${W.toFixed(1)} × ${D.toFixed(1)} m (${esquina}) · ${nTri} triângulos · ${Math.round(100 * anda / Math.max(1, chao))}% do chão da loja se anda`;
  if (erros.length) { console.log('  FALHOU · ' + txt + ' · ' + erros.join(', ')); falhas.push(txt); }
  else console.log('  ok · ' + txt);
}
for (const tipo of TIPOS_DE_LOJA) {
  const m = MEDIDAS_LOJA[tipo];
  const fundos = m.fundo === 'inteiro' ? [12.4, 12.9] : [4.5, 5.3, 5.8];
  for (const D of fundos) for (const esq of ['dir', 'esq']) conferir(tipo, m.larg, D, esq);
}
console.log(falhas.length ? `\n${falhas.length} loja(s) com ponto que não se alcança` : '\ntoda loja se anda por dentro e cada ponto do assalto se alcança da calçada');
process.exit(falhas.length ? 1 : 0);
