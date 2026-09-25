/* =========================================================
   TODO CÔMODO DA SEDE SE ALCANÇA DO PORTÃO?
   ---------------------------------------------------------
   O boneco que anda a pé no cenário 3D bate no que a sede tem na faixa
   do corpo (passo.js): parede, folha de porta aberta, móvel. Este teste
   monta cada sede que os três mapas podem ter — a de nível 3 em cada
   terreno de sede, a de nível 1 no terreno (a fatia do canto) e no
   espaço pequeno, cada uma na frente do terreno dela —, risca a faixa
   com a mesma conta do cenário e procura, a partir da calçada, por onde
   um corpo de RAIO m de raio passa (de 5 em 5 cm). O boneco tem 25 cm
   de raio; o teste pede 35 (uma passagem de 70 cm), e a folga é pro
   móvel que vier depois não fechar caminho sem ninguém ver. Cômodo em
   que o corpo não entra, ou em que ele alcança menos de 80% do chão
   livre, é erro (o canto atrás da estante é normal; metade do cômodo
   não).

     node ferramentas/planta_html/conferir_passagem.mjs [--fotos pasta]

   Com --fotos, sai uma imagem por sede (PPM): cinza o que o corpo não
   pisa, verde o que ele alcança, vermelho o que é livre e não se
   alcança, preto os riscos.
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
const { montarSede, eixosDaSede } = await import(path.join(R, 'js/diajogo/sede3d.js'));
const { METRO: M } = await import(path.join(R, 'js/diajogo/construtor3d.js'));
const { riscosDaFaixa, Paredes, FAIXA_M } = await import(path.join(R, 'ferramentas/planta_html/passo.js'));

export const RAIO = 0.35;
const PASSO = 0.05;                       // m: a grade da procura
const arg = process.argv.indexOf('--fotos'), FOTOS = arg > 0 ? process.argv[arg + 1] : null;
if (FOTOS) fs.mkdirSync(FOTOS, { recursive: true });

/* a fatia do canto que a sede de nível 1 ocupa num terreno inteiro (a
   `fatiaDoNivel1` da planta) */
function fatiaDoNivel1(a, frente) {
  const LF = 250, PR = 180;
  if (frente === 'n') return { x0: a.x0, x1: a.x0 + LF, y0: a.y0, y1: a.y0 + PR };
  if (frente === 's') return { x0: a.x0, x1: a.x0 + LF, y0: a.y1 - PR, y1: a.y1 };
  if (frente === 'o') return { x0: a.x0, x1: a.x0 + PR, y0: a.y0, y1: a.y0 + LF };
  return { x0: a.x1 - PR, x1: a.x1, y0: a.y0, y1: a.y0 + LF };
}

/* as sedes possíveis: uma por (tamanho, nível, frente) */
const casos = new Map();
for (const id of ['pequeno', 'medio', 'grande']) {
  const G = gerarProposta(P, MAPAS[id]);
  for (const e of G.espacosSede) {
    const lista = e.cabe === 1 ? [[1, e.area]] : [[3, e.area], [1, fatiaDoNivel1(e.area, e.frente)]];
    for (const [nivel, area] of lista) {
      const L = Math.round(area.x1 - area.x0), A = Math.round(area.y1 - area.y0);
      const k = [nivel, L, A, e.frente].join('|');
      if (!casos.has(k)) casos.set(k, { nivel, area, frente: e.frente, onde: id + ' ' + e.id });
    }
  }
}

const TORCIDA = { cor: '#1f4fb0', cor2: '#f4f4f1', cor3: '#e0a52a', sigla: 'TESTE', nome: 'TORCIDA TESTE' };
let falhas = 0;
for (const cs of casos.values()) {
  const destino = {};
  const r = montarSede({ area: cs.area, frente: cs.frente, nivel: cs.nivel, lado: 'mandante', torcida: TORCIDA }, destino, {});
  const E = eixosDaSede(cs.area, cs.frente);
  /* os riscos da faixa (a casa e a grade; o telhado fica em cima) */
  const mg = 3 * M, x0 = cs.area.x0 - mg, z0 = cs.area.y0 - mg, x1 = cs.area.x1 + mg, z1 = cs.area.y1 + mg;
  const W = Paredes(x0, z0, x1, z1, 1.5 * M);
  for (const b of (destino.casas || []).concat(destino.grades || []))
    riscosDaFaixa(b.pos, b.pos.length / 3, FAIXA_M[0] * M, FAIXA_M[1] * M, 0.01 * M, W.juntar);
  W.fechar();
  /* onde o corpo cabe, de 5 em 5 cm */
  const h = PASSO * M, nx = Math.ceil((x1 - x0) / h), nz = Math.ceil((z1 - z0) / h), rr = RAIO * M;
  const livre = new Uint8Array(nx * nz), alc = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) livre[j * nx + i] = W.cabe(x0 + (i + 0.5) * h, z0 + (j + 0.5) * h, rr) ? 1 : 0;
  /* da calçada, 1 m pra fora da frente, na linha do portão */
  const [sx, sz] = E.pt(r.plano.eixo, -1.0 * M);
  const si = Math.floor((sx - x0) / h), sj = Math.floor((sz - z0) / h);
  const fila = [sj * nx + si];
  alc[sj * nx + si] = 1;
  for (let q = 0; q < fila.length; q++) {
    const k = fila[q], i = k % nx;
    for (const v of [i > 0 ? k - 1 : -1, i < nx - 1 ? k + 1 : -1, k - nx, k + nx]) {
      if (v < 0 || v >= livre.length || !livre[v] || alc[v]) continue;
      alc[v] = 1; fila.push(v);
    }
  }
  /* cômodo por cômodo: o miolo (o cômodo menos o raio do corpo) */
  const linhas = [];
  let erros = 0;
  for (const c of r.plano.comodos) {
    const [ax, az] = E.pt(c.u0, c.v0), [bx, bz] = E.pt(c.u1, c.v1), f = (RAIO + 0.05) * M;
    const ci0 = Math.ceil((Math.min(ax, bx) + f - x0) / h), ci1 = Math.floor((Math.max(ax, bx) - f - x0) / h);
    const cj0 = Math.ceil((Math.min(az, bz) + f - z0) / h), cj1 = Math.floor((Math.max(az, bz) - f - z0) / h);
    let nLivre = 0, nAlc = 0;
    for (let j = cj0; j <= cj1; j++) for (let i = ci0; i <= ci1; i++) { const k = j * nx + i; if (livre[k]) { nLivre++; if (alc[k]) nAlc++; } }
    const pct = nLivre ? Math.round(100 * nAlc / nLivre) : 0;
    const ruim = !nAlc || pct < 80;
    if (ruim) erros++;
    linhas.push(`${c.nome} ${nAlc ? pct + '%' : 'FECHADO'}${ruim ? ' ←' : ''}`);
  }
  falhas += erros;
  console.log(`nível ${cs.nivel} ${Math.round((cs.area.x1 - cs.area.x0) / M * 10) / 10} × ${Math.round((cs.area.y1 - cs.area.y0) / M * 10) / 10} m, frente ${cs.frente} (${cs.onde}): ${W.n} riscos · ` + linhas.join(' · '));
  if (FOTOS) {
    const img = Buffer.alloc(nx * nz * 3);
    for (let k = 0; k < nx * nz; k++) {
      const [R0, G0, B0] = !livre[k] ? [150, 150, 150] : alc[k] ? [120, 200, 120] : [230, 80, 70];
      img[k * 3] = R0; img[k * 3 + 1] = G0; img[k * 3 + 2] = B0;
    }
    const seg = W.seg;
    for (let s = 0; s < W.n; s++) {
      const ax = seg[s * 4], az = seg[s * 4 + 1], bx = seg[s * 4 + 2], bz = seg[s * 4 + 3], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / (h * 0.5)));
      for (let t = 0; t <= n; t++) {
        const i = Math.floor((ax + (bx - ax) * t / n - x0) / h), j = Math.floor((az + (bz - az) * t / n - z0) / h);
        if (i >= 0 && j >= 0 && i < nx && j < nz) img.fill(20, (j * nx + i) * 3, (j * nx + i) * 3 + 3);
      }
    }
    const nome = `nivel${cs.nivel}_${cs.frente}_${Math.round((cs.area.x1 - cs.area.x0))}x${Math.round((cs.area.y1 - cs.area.y0))}.ppm`;
    fs.writeFileSync(path.join(FOTOS, nome), Buffer.concat([Buffer.from(`P6\n${nx} ${nz}\n255\n`), img]));
  }
}
console.log(falhas ? `FALHOU: ${falhas} cômodo(s) que o corpo não alcança direito` : 'todo cômodo se alcança do portão');
process.exit(falhas ? 1 : 0);
