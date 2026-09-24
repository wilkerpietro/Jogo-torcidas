/* =========================================================
   A SEDE NOVA BATE COM A SEDE DA PLANTA?
   ---------------------------------------------------------
   O modelo da sede (js/diajogo/sede3d.js) refaz a conta do
   `sedeDaTorcida` da planta. Este teste confere, nas duas sedes que a
   planta põe na cidade (a de nível 3 da 2,9 e a de nível 1 da 5,2):

   - PAREDE POR PAREDE: as do modelo, partidas nos vãos de porta com a
     regra do `comVaos` (pedaço de até 3 some), são as da planta (tirando
     os batentes da porta da rua, que o modelo desenha como batente);
   - PORTA POR PORTA: a dobradiça e o tamanho de cada folha;
   - SALA POR SALA: os nomes das placas;
   - O MÓVEL QUE BLOQUEIA a caminhada está no mesmo retângulo nos dois.

   Se a planta mudar a sede, é aqui que aparece o que o modelo tem que
   acompanhar.

     node ferramentas/planta_html/conferir_sede.mjs
   ========================================================= */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
global.TO = { dados: {} };
for (const f of ['torcidas', 'times', 'cena_estadio']) require(path.join(R, 'dados', f + '.js'));
const K = TO.dados.plantaEstadio.CIDADE;
const { planoDaSede, eixosDaSede, montarSede } = await import(path.join(R, 'js/diajogo/sede3d.js'));

const igual = (a, b, tol = 0.01) => a.every((v, i) => Math.abs(v - b[i]) < tol);
let falhas = 0;
for (const q of K.QUADRAS.filter(q => q.equip && q.equip.tipo === 'sede')) {
  const e = q.equip, E = eixosDaSede(e.area, e.frente);
  const pl = planoDaSede(E.L, E.A, e.nivel, e.lado);
  const ret = (u0, u1, v0, v1) => { const [ax, ay] = E.pt(u0, v0), [bx, by] = E.pt(u1, v1); return [Math.min(ax, bx), Math.max(ax, bx), Math.min(ay, by), Math.max(ay, by)]; };

  /* as paredes */
  const minhas = [];
  for (const w of pl.paredes) {
    const X = w.ao === 'u', A0 = X ? w.u0 : w.v0, A1 = X ? w.u1 : w.v1;
    let a = A0;
    for (const v of w.vaos.filter(v => v.tipo === 'porta' || v.tipo === 'portao').sort((p, q) => p.a0 - q.a0)) {
      if (v.a0 - a > 3) minhas.push(X ? ret(a, v.a0, w.v0, w.v1) : ret(w.u0, w.u1, a, v.a0));
      a = Math.max(a, v.a1);
    }
    if (A1 - a > 3) minhas.push(X ? ret(a, A1, w.v0, w.v1) : ret(w.u0, w.u1, a, A1));
  }
  const T = e.torcida, c3 = String(T.cor3 || T.cor2 || '').toUpperCase();
  const batente = o => String(o.cor).toUpperCase() === c3 && Math.min(o.x1 - o.x0, o.y1 - o.y0) === 8 && Math.max(o.x1 - o.x0, o.y1 - o.y0) < 20;
  const dela = e.pecas.filter(o => o.k === 'muro' && !batente(o)).map(o => [o.x0, o.x1, o.y0, o.y1]);
  const pSobra = dela.filter(d => !minhas.some(m => igual(m, d))), pFalta = minhas.filter(m => !dela.some(d => igual(m, d)));

  /* as folhas de porta */
  const folhasDela = e.pecas.filter(o => o.k === 'porta').map(o => [o.x, o.y, o.larg]);
  const minhasFolhas = [];
  for (const p of pl.portas) {
    const duas = p.w > 44;
    for (const s of duas ? [1, -1] : [1]) {
      const off = s > 0 ? p.c - p.w / 2 : p.c + p.w / 2, outro = p.ao === 'u' ? (p.parede.v0 + p.parede.v1) / 2 : (p.parede.u0 + p.parede.u1) / 2;
      const [x, y] = p.ao === 'u' ? E.pt(off, outro) : E.pt(outro, off);
      minhasFolhas.push([x, y, duas ? p.w / 2 : p.w]);
    }
  }
  const fDif = folhasDela.filter(d => !minhasFolhas.some(m => igual(m, d))).length + minhasFolhas.filter(m => !folhasDela.some(d => igual(m, d))).length;

  /* as placas das salas */
  const nomes = pl.portas.filter(p => p.nome).map(p => p.nome).join(',');
  const placas = e.pecas.filter(o => o.k === 'letreiro' && o.base > 40).map(o => o.texto).join(',');

  /* o móvel que bloqueia: o retângulo da planta é um dos do modelo */
  const r = montarSede({ area: e.area, frente: e.frente, nivel: e.nivel, lado: e.lado,
                         torcida: { cor: T.cor, cor2: T.cor2, cor3: T.cor3, sigla: T.rot, nome: T.nomeCompleto } }, {}, { so2d: true });
  const moveis = r.planta2d.filter(m => m.tipo === 'movel').map(m => [m.x0, m.x1, m.y0, m.y1]);
  const bloqueiam = e.pecas.filter(o => o.bloqueia !== false && !['muro', 'porta', 'portao', 'piso'].includes(o.k));
  const fora = bloqueiam.filter(o => {
    const b = o.x0 !== undefined ? [o.x0, o.x1, o.y0, o.y1] : [o.x - o.r, o.x + o.r, o.y - o.r, o.y + o.r];
    return !moveis.some(m => igual(m, b, 0.05));
  });

  const erros = pSobra.length + pFalta.length + fDif + (nomes === placas ? 0 : 1) + fora.length;
  console.log(`${q.i},${q.j} nível ${e.nivel}, frente ${e.frente}: paredes ${dela.length}/${minhas.length} (sobra ${pSobra.length}, falta ${pFalta.length}) · ` +
              `folhas ${folhasDela.length}/${minhasFolhas.length} (diferentes ${fDif}) · salas ${nomes === placas ? 'iguais' : nomes + ' ≠ ' + placas} · ` +
              `móveis que bloqueiam ${bloqueiam.length - fora.length}/${bloqueiam.length} no lugar`);
  for (const x of pSobra.concat(pFalta).slice(0, 6)) console.log('   parede', x.map(v => v.toFixed(1)).join(' '));
  for (const o of fora) console.log('   móvel fora do lugar:', o.k, [o.x0 ?? o.x, o.y0 ?? o.y].map(v => v.toFixed(1)).join(' '));
  falhas += erros;
}
console.log(falhas ? 'FALHOU: ' + falhas : 'o modelo bate com a planta');
process.exit(falhas ? 1 : 0);
