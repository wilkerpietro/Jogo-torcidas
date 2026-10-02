/* =========================================================
   TODO CÔMODO DA SEDE SE ALCANÇA DO PORTÃO?
   ---------------------------------------------------------
   O boneco que anda a pé no cenário 3D bate no que a sede tem na faixa
   do corpo (passo.js): parede, folha de porta aberta, móvel. Este teste
   monta cada sede que os três mapas podem ter — os cinco níveis (o 1 na
   fatia do canto do terreno e no espaço pequeno, o 2 na fatia de 16,2 m,
   o 3 e o 4 no terreno inteiro, o 5 no quarteirão inteiro, quando ele é
   largo), cada uma na frente do terreno dela —, risca a faixa
   com a mesma conta do cenário e procura, a partir da calçada, por onde
   um corpo de RAIO m de raio passa (de 5 em 5 cm). O boneco tem 25 cm
   de raio; o teste pede 35 (uma passagem de 70 cm), e a folga é pro
   móvel que vier depois não fechar caminho sem ninguém ver. Cômodo em
   que o corpo não entra, ou em que ele alcança menos de 80% do chão
   livre, é erro (o canto atrás da estante é normal; metade do cômodo
   não). O bar se alcança pela porta dele, da calçada (ele não tem porta
   pra sede); a garagem só abre pelo portão de grade, que fica fechado,
   e fica de fora da conta. Na sede de dois andares (o nível 5), o corpo
   também sobe a escada — com o passo do cenário na sede de dois andares
   (subsolo.js: o chão a um degrau do pé) — e, do alto dela, tem de
   alcançar cada sala e cada varanda do 1º andar do mesmo jeito.

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
const { montarSede, eixosDaSede, nivelQueCabe } = await import(path.join(R, 'js/diajogo/sede3d.js'));
const { METRO: M } = await import(path.join(R, 'js/diajogo/construtor3d.js'));
const { riscosDaFaixa, Paredes, FAIXA_M } = await import(path.join(R, 'ferramentas/planta_html/passo.js'));
const { Subsolo } = await import(path.join(R, 'ferramentas/planta_html/subsolo.js'));

export const RAIO = 0.35;
const PASSO = 0.05;                       // m: a grade da procura
const arg = process.argv.indexOf('--fotos'), FOTOS = arg > 0 ? process.argv[arg + 1] : null;
if (FOTOS) fs.mkdirSync(FOTOS, { recursive: true });

/* as fatias do terreno que as sedes de nível 1 e 2 ocupam (a
   `fatiaDoNivel1` e a `fatiaDoNivel2` da planta) */
function fatiaDoNivel2(a, frente) {
  const LF = Math.round(16.2 * M);
  if (frente === 'n' || frente === 's') return { x0: a.x0, x1: Math.min(a.x1, a.x0 + LF), y0: a.y0, y1: a.y1 };
  return { x0: a.x0, x1: a.x1, y0: a.y0, y1: Math.min(a.y1, a.y0 + LF) };
}
/* o quarteirão inteiro da sede de nível 5 (a `quarteiraoInteiro` da
   planta, só a geometria): o miolo do quarteirão, se é largo pro 5 e o
   terreno pega o fundo todo */
function quarteirao(G, e) {
  if (e.cabe === 1 || (e.frente !== 'n' && e.frente !== 's')) return null;
  const q = e.terreno && !e.terreno.emQuadraDeHoje ? G.quadras.find(o => o.terreno === e.terreno) : P.CIDADE.QUADRAS.find(o => o.i + ',' + o.j === e.quadra);
  if (!q) return null;
  const mi = { x0: q.ix0, x1: q.ix1, y0: q.iy0, y1: q.iy1 };
  return nivelQueCabe(mi.x1 - mi.x0, 5) === 5 && Math.abs((mi.y1 - mi.y0) - (e.area.y1 - e.area.y0)) < 0.6 * M ? mi : null;
}
/* a fatia do canto que a sede de nível 1 ocupa num terreno inteiro (a
   `fatiaDoNivel1` da planta) */
function fatiaDoNivel1(a, frente) {
  const LF = 250, PR = 180;
  if (frente === 'n') return { x0: a.x0, x1: a.x0 + LF, y0: a.y0, y1: a.y0 + PR };
  if (frente === 's') return { x0: a.x0, x1: a.x0 + LF, y0: a.y1 - PR, y1: a.y1 };
  if (frente === 'o') return { x0: a.x0, x1: a.x0 + PR, y0: a.y0, y1: a.y0 + LF };
  return { x0: a.x1 - PR, x1: a.x1, y0: a.y0, y1: a.y0 + LF };
}

/* as sedes possíveis: uma por (tamanho, nível, frente), nos três mapas e
   no mapa de cada praça (com os estádios de verdade, o que fica longe de
   estádio muda) */
const casos = new Map();
const { mapaDaPraca } = await import(path.join(R, 'ferramentas/planta_html/mapa_da_praca.mjs'));
const mapas = ['pequeno', 'medio', 'grande'].map(id => [id, gerarProposta(P, MAPAS[id])])
  .concat(TO.dados.cidades.map(c => { const { id, cfg, opc } = mapaDaPraca(c); return [id + ' de ' + c.nome, gerarProposta(P, cfg, opc)]; }));
for (const [id, G] of mapas) {
  for (const e of G.espacosSede) {
    const q5 = quarteirao(G, e);
    const lista = e.cabe === 1 ? [[1, e.area]] : [[1, fatiaDoNivel1(e.area, e.frente)], [2, fatiaDoNivel2(e.area, e.frente)], [3, e.area], [4, e.area]].concat(q5 ? [[5, q5]] : []);
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
  const tris = (destino.casas || []).concat(destino.grades || []);
  const mg = 3 * M, x0 = cs.area.x0 - mg, z0 = cs.area.y0 - mg, x1 = cs.area.x1 + mg, z1 = cs.area.y1 + mg;
  const h = PASSO * M, nx = Math.ceil((x1 - x0) / h), nz = Math.ceil((z1 - z0) / h), rr = RAIO * M;
  const celulaDe = (x, z) => Math.floor((z - z0) / h) * nx + Math.floor((x - x0) / h);
  /* UM ANDAR: os riscos da faixa contada do piso `yP` (a casa e a grade;
     o telhado fica em cima), onde o corpo cabe de 5 em 5 cm (e, em cima,
     onde tem chão: o vão do pátio não é andar) e até onde se chega das
     `sementes` */
  function andar(yP, temChao, sementes) {
    const W = Paredes(x0, z0, x1, z1, 1.5 * M);
    for (const b of tris) riscosDaFaixa(b.pos, b.pos.length / 3, yP + FAIXA_M[0] * M, yP + FAIXA_M[1] * M, 0.01 * M, W.juntar);
    W.fechar();
    const livre = new Uint8Array(nx * nz), alc = new Uint8Array(nx * nz);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = x0 + (i + 0.5) * h, z = z0 + (j + 0.5) * h;
      livre[j * nx + i] = W.cabe(x, z, rr) && (!temChao || temChao(x, z)) ? 1 : 0;
    }
    const fila = [];
    for (const k of sementes) if (k >= 0 && !alc[k]) { alc[k] = 1; fila.push(k); }
    for (let q = 0; q < fila.length; q++) {
      const k = fila[q], i = k % nx;
      for (const v of [i > 0 ? k - 1 : -1, i < nx - 1 ? k + 1 : -1, k - nx, k + nx]) {
        if (v < 0 || v >= livre.length || !livre[v] || alc[v]) continue;
        alc[v] = 1; fila.push(v);
      }
    }
    return { W, livre, alc };
  }
  /* cômodo por cômodo (no mundo): o miolo (o cômodo menos o raio do corpo) */
  let erros = 0;
  function medir(A, cx0, cx1, cz0, cz1, nome) {
    const f = (RAIO + 0.05) * M;
    const ci0 = Math.ceil((cx0 + f - x0) / h), ci1 = Math.floor((cx1 - f - x0) / h);
    const cj0 = Math.ceil((cz0 + f - z0) / h), cj1 = Math.floor((cz1 - f - z0) / h);
    let nLivre = 0, nAlc = 0;
    for (let j = cj0; j <= cj1; j++) for (let i = ci0; i <= ci1; i++) { const k = j * nx + i; if (A.livre[k]) { nLivre++; if (A.alc[k]) nAlc++; } }
    const pct = nLivre ? Math.round(100 * nAlc / nLivre) : 0;
    const ruim = !nAlc || pct < 80;
    if (ruim) erros++;
    return `${nome} ${nAlc ? pct + '%' : 'FECHADO'}${ruim ? ' ←' : ''}`;
  }
  /* O TÉRREO: da calçada, 1 m pra fora da frente, na linha do portão (e na
     da porta do bar, que é da rua) */
  const vBar = r.plano.paredes.flatMap(w => w.fachada ? w.vaos.filter(v => v.tipo === 'bar') : [])[0];
  const sementes = [r.plano.eixo].concat(vBar ? [(vBar.a0 + vBar.a1) / 2] : []).map(u => celulaDe(...E.pt(u, -1.0 * M)));
  const T0 = andar(0, null, sementes);
  const linhas = [];
  for (const c of r.plano.comodos) {
    if (c.tipo === 'garagem') continue;
    const [ax, az] = E.pt(c.u0, c.v0), [bx, bz] = E.pt(c.u1, c.v1);
    linhas.push(medir(T0, Math.min(ax, bx), Math.max(ax, bx), Math.min(az, bz), Math.max(az, bz), c.nome));
  }
  /* O 1º ANDAR (o nível 5): o corpo sobe a escada — do pé dela, no pátio,
     até o alto, andando de 5 em 5 cm com o passo do cenário (o subsolo dos
     sobrados: o chão a um degrau do pé, a faixa contada dele) — e de lá
     anda pela varanda até as salas de cima */
  let T1 = null;
  if (r.andar) {
    const S = Subsolo(M, []);
    for (const b of tris) S.juntar(b.pos, b.pos.length / 3);
    S.fechar();
    const yC = r.andar.piso, { pe, topo } = r.andar.escada;
    const alcancaPe = T0.alc[celulaDe(pe.x, pe.z)];
    let c = { x: pe.x, z: pe.z, y: S.chao(pe.x, pe.z, pe.y) };
    const n = Math.ceil(Math.hypot(topo.x - pe.x, topo.z - pe.z) / (0.05 * M));
    for (let k = 0; k < n && c; k++) {
      const q = S.passo({}, c.x, c.z, c.y, (topo.x - pe.x) / n, (topo.z - pe.z) / n, rr);
      c = q ? { x: q.x, z: q.z, y: q.y } : (linhas.push(`ESCADA trava a ${((c.y) / M).toFixed(2)} m ←`), erros++, null);
    }
    if (c && Math.abs(c.y - yC) > 0.05 * M) { linhas.push(`ESCADA chega a ${(c.y / M).toFixed(2)} m, não ao piso de cima (${(yC / M).toFixed(2)}) ←`); erros++; c = null; }
    if (!alcancaPe) { linhas.push('o PÉ DA ESCADA não se alcança do portão ←'); erros++; }
    if (c) {
      T1 = andar(yC, (x, z) => { const y = S.chao(x, z, yC); return y === y && Math.abs(y - yC) < 0.1 * M; }, [celulaDe(c.x, c.z)]);
      linhas.push('| 1º andar:');
      for (const k of r.comodos.filter(k => k.andar === 1)) linhas.push(medir(T1, k.x0, k.x1, k.z0, k.z1, k.nome));
    }
  }
  falhas += erros;
  console.log(`nível ${cs.nivel} ${Math.round((cs.area.x1 - cs.area.x0) / M * 10) / 10} × ${Math.round((cs.area.y1 - cs.area.y0) / M * 10) / 10} m, frente ${cs.frente} (${cs.onde}): ${T0.W.n} riscos · ` + linhas.join(' · '));
  if (FOTOS) for (const [A, sufixo] of [[T0, ''], [T1, '_andar']]) {
    if (!A) continue;
    const img = Buffer.alloc(nx * nz * 3);
    for (let k = 0; k < nx * nz; k++) {
      const [R0, G0, B0] = !A.livre[k] ? [150, 150, 150] : A.alc[k] ? [120, 200, 120] : [230, 80, 70];
      img[k * 3] = R0; img[k * 3 + 1] = G0; img[k * 3 + 2] = B0;
    }
    const seg = A.W.seg;
    for (let s = 0; s < A.W.n; s++) {
      const ax = seg[s * 4], az = seg[s * 4 + 1], bx = seg[s * 4 + 2], bz = seg[s * 4 + 3], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / (h * 0.5)));
      for (let t = 0; t <= n; t++) {
        const i = Math.floor((ax + (bx - ax) * t / n - x0) / h), j = Math.floor((az + (bz - az) * t / n - z0) / h);
        if (i >= 0 && j >= 0 && i < nx && j < nz) img.fill(20, (j * nx + i) * 3, (j * nx + i) * 3 + 3);
      }
    }
    const nome = `nivel${cs.nivel}_${cs.frente}_${Math.round((cs.area.x1 - cs.area.x0))}x${Math.round((cs.area.y1 - cs.area.y0))}${sufixo}.ppm`;
    fs.writeFileSync(path.join(FOTOS, nome), Buffer.concat([Buffer.from(`P6\n${nx} ${nz}\n255\n`), img]));
  }
}
console.log(falhas ? `FALHOU: ${falhas} cômodo(s) que o corpo não alcança direito` : 'todo cômodo se alcança do portão');
process.exit(falhas ? 1 : 0);
