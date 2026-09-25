/* =========================================================
   O CENÁRIO 3D — o mapa inteiro da praça, montado pela planta
   ---------------------------------------------------------
   A planta (index.html) desenha o mapa em 2D e monta cada coisa em 3D
   quando se clica nela. O cenário monta TUDO de uma vez, com os mesmos
   montadores e os mesmos filtros, e deixa andar por cima:

   - O CHÃO é o próprio desenho da planta, só com o que é chão (a rua, a
     calçada, a terra do lote, a areia, a água, o mato), na paleta do
     chão do jogo (`pintarChao`), em ladrilhos de 1024 px.
   - O MATO em volta sai do `mato3d.js` do jogo, plantado onde o desenho
     é mato: a MÁSCARA é o mesmo desenho, com o mato em magenta.
   - AS COISAS (a casa, o marco, a sede, o equipamento, o estádio, o
     pórtico, o poste, o prop, a árvore, o carro, a peça da praia) saem
     de `pecasDoCenario()`, a lista da planta. Cada uma é montada, e as
     malhas dela vão pro FORNO, que junta tudo o que tem o mesmo material
     no mesmo bloco de terreno numa malha só: de dezenas de milhares de
     malhas pra umas centenas de chamadas de desenho.
   - O LETREIRO, A PIXAÇÃO E O ESCUDO (cada um com o texto num canvas
     só dele) vão pra folhas de decalque de 2048 px, e a malha deles
     também junta por bloco.
   - A PÉ, o boneco do jogo (js/bonecos3.js) anda na rua, na camisa de
     uma torcida da praça: a GRADE DO PASSO, riscada pelo forno com o
     que cada coisa tem na altura do corpo, diz onde ele bate, e o PISO
     DA RUA (o que cada coisa tem de chão embaixo da faixa do corpo: a
     laje da calçada, o piso da sede) diz em que altura ele pisa. No metrô
     ele desce a escada até a plataforma: embaixo da rua quem diz onde
     ele pisa é o SUBSOLO (subsolo.js), com os triângulos da estação.

   Nada aqui decide o que vai no mapa: muda a planta, muda o cenário.
   Em unidades de mundo da planta (x pra leste, y da planta = z do 3D pro
   sul, 1 m = P.M unidades).
   ========================================================= */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
import { plantarMato, montarMato, LONGE_M } from './mato3d.js';
import { FAIXA_M, riscosDaFaixa, Paredes, PisoDaRua } from './passo.js';
import { Subsolo } from './subsolo.js';

/* O CHÃO: ladrilho de 1024 px (e 2 de sobra em volta, pra costura não
   aparecer), na resolução da qualidade */
const PX_CHAO = 1024, SOBRA = 2;
/* A QUALIDADE: pixels por metro no chão, o teto da densidade de pixel
   da tela e a escala do texto na folha de decalque (o canvas do letreiro
   tem 512 × 128; na folha normal, 256 × 64). SEM SOMBRA: o cenário não
   desenha sombra nenhuma (o sol só dá a luz de cada face). A sombra custa
   desenhar a cena mais uma vez por quadro (o mapa de sombra), e o dono
   pediu pra ver o fps sem ela */
/* A MÍNIMA é pra placa de vídeo fraca (a integrada de dez anos atrás):
   a tela desenhada com 0,6 pixel por pixel (sai borrada, e custa um terço) */
const QUALIDADES = {
  minima: { nome: 'Mínima', pxm: 3, dpr: 0.6, decal: 0.3 },
  leve:   { nome: 'Leve', pxm: 4, dpr: 1, decal: 0.35 },
  normal: { nome: 'Normal', pxm: 6, dpr: 1.5, decal: 0.5 },
  alta:   { nome: 'Alta', pxm: 8, dpr: 2, decal: 0.62 }
};
/* A PÉ (o boneco do jogo na rua, visto DE CIMA): as velocidades (m/s), o
   raio do corpo pra colisão, a altura pra onde a câmera olha, quantos
   metros cabem no lado menor da tela (a roda e a pinça mudam) e a
   inclinação da câmera (1,25 rad: quase a pino, com um pouco da fachada) */
const APE = { anda: 2.2, corre: 6, raio: 0.25, olho: 1.0, vao: 13, el: 1.25 };
/* O CORTE: o que fica entre a câmera e o boneco, acima da cabeça, some
   (a copa, o beiral, o prédio do lado), e o prédio em que ele está
   DENTRO perde o que passa de 2,20 m (o telhado, a laje, o alto da
   parede): de cima se vê a planta dos cômodos */
const CORTE_M = { raio: 2.2, acima: 2.2, dentro: 2.2 };
/* EMBAIXO DA RUA (no metrô): a cidade em cima da caixa da estação, com
   esta folga (m) pra cada lado, some do teto do nível dele pra cima, e a
   terra em volta aparece (a caixa marrom, do mesmo tamanho) */
const SUB_FOLGA = 1.5, TERRA_M = -12;
/* A BEIRA DO MATO (m): a faixa rente ao que não é mato que fica só com a
   vegetação rasteira (a árvore do mato começa depois dela) */
const LIMPO_M = 3;
/* o que é prédio (a câmera não entra na parede dele); o resto (o poste,
   a árvore, o carro, o prop, a peça da praia) só barra o corpo */
const PREDIOS = new Set(['casa', 'favela', 'bar', 'marco', 'sede', 'equipamento', 'metro', 'estadio']);
/* o lado do BLOCO do forno (m): a malha junta tudo o que cai nele; o
   bloco é também o que a câmera descarta fora da vista */
const BLOCO_M = 96;
/* a folha dos decalques e o vão entre um quadro e outro */
const FOLHA_DECAL = 2048, VAO_DECAL = 4;
/* o sol do mapa: de noroeste, alto (a sombra da copa no 2D vai pro sudeste); só luz */
const SOL = new THREE.Vector3(-0.52, 0.78, -0.36).normalize();
const CEU = new THREE.Color('#cfdde6'), ZENITE = new THREE.Color('#7fa6c4');

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const espera = () => new Promise(ok => setTimeout(ok, 0));

/* ======================================================
   A GRADE DO PASSO: onde o boneco pisa
   ------------------------------------------------------
   O CORPO bate nos RISCOS DA FAIXA (passo.js): o forno passa por aqui
   cada coisa que assa, e o que ela tem entre 35 cm e 1,80 m do chão vira
   risco — a parede, o muro, a folha da porta aberta, o carro, o poste, o
   tronco, a mesa, a cadeira. O corpo desliza contra eles, exato. (A
   primeira versão marcava células de meio metro: cada móvel e cada
   batente engrossavam até meio metro, e 29 cômodos das sedes fechavam.)
   A GRADE, de meio metro, fica pro resto:
   - a ÁGUA: o mar pra lá da linha d'água, a lagoa menos a ilhota e o
     trapiche, que se pisa;
   - o MATO: o boneco não entra nele (a grade de proteção fecha a divisa
     com a cidade; onde ela não chega, a beira do mato segura);
   - o ALCANCE: o que se chega andando da borda da área, com os riscos
     marcados nas células (de sobra: é só pra escolher onde o boneco
     nasce, e ele não nasce dentro de casa fechada);
   - o TETO: o número da coisa (o prédio) cujo telhado cobre a célula —
     é por ele que a câmera de cima sabe de que prédio tirar o telhado.
   ====================================================== */
const CEL_M = 0.5, TETO_M = 2.3;
const SOLIDO = 1, AGUA = 2, ALCANCE = 4, MATO = 8;
function GradeDoPasso(ar, M) {
  const c = CEL_M * M, nx = Math.ceil((ar.x1 - ar.x0) / c), nz = Math.ceil((ar.y1 - ar.y0) / c);
  const g = new Uint8Array(nx * nz), teto = new Uint16Array(nx * nz);
  const Y0 = FAIXA_M[0] * M, Y1 = FAIXA_M[1] * M, YT = TETO_M * M;
  const ox = ar.x0, oz = ar.y0;
  const paredes = Paredes(ox, oz, ar.x1, ar.y1, 2 * M);
  let alcancou = false, ms = 0;
  /* o risco de (a) a (b), em células: toda célula que a reta atravessa */
  function riscar(ax, az, bx, bz) {
    let i = Math.floor(ax), j = Math.floor(az);
    const dx = bx - ax, dz = bz - az, si = dx > 0 ? 1 : -1, sj = dz > 0 ? 1 : -1;
    const tdx = dx ? Math.abs(1 / dx) : Infinity, tdz = dz ? Math.abs(1 / dz) : Infinity;
    let tx = dx ? (dx > 0 ? i + 1 - ax : ax - i) * tdx : Infinity, tz = dz ? (dz > 0 ? j + 1 - az : az - j) * tdz : Infinity;
    let n = Math.min(40000, Math.abs(Math.floor(bx) - i) + Math.abs(Math.floor(bz) - j));
    for (;;) {
      if (i >= 0 && j >= 0 && i < nx && j < nz) g[j * nx + i] |= SOLIDO;
      if (n-- <= 0) break;
      if (tx < tz) { tx += tdx; i += si; } else { tz += tdz; j += sj; }
    }
  }
  /* uma coisa assada: os triângulos soltos P (x, y, z), n vértices; `id`
     é o número dela quando é prédio (0: não cobre nada) */
  function assar(P, n, id) {
    const t0 = performance.now();
    paredes.novaCoisa();
    riscosDaFaixa(P, n, Y0, Y1, 0.01 * M, paredes.juntar);
    if (id) cobrir(P, n, id);
    ms += performance.now() - t0;
  }
  /* O TETO: o triângulo todo acima de 2,30 m e deitado (o telhado, a laje,
     o forro — não a parede) cobre as células cujo meio está debaixo dele */
  function cobrir(P, n, id) {
    for (let o = 0; o + 8 < n * 3; o += 9) {
      const ya = P[o + 1], yb = P[o + 4], yc = P[o + 7];
      if (ya < YT || yb < YT || yc < YT) continue;
      const ax = P[o], az = P[o + 2], bx = P[o + 3], bz = P[o + 5], cx = P[o + 6], cz = P[o + 8];
      const ux = bx - ax, uy = yb - ya, uz = bz - az, vx = cx - ax, vy = yc - ya, vz = cz - az;
      const ny = uz * vx - ux * vz, nl = Math.hypot(uy * vz - uz * vy, ny, ux * vy - uy * vx);
      if (!nl || Math.abs(ny) / nl < 0.35) continue;
      const i0 = Math.max(0, Math.floor((Math.min(ax, bx, cx) - ox) / c)), i1 = Math.min(nx - 1, Math.floor((Math.max(ax, bx, cx) - ox) / c));
      const j0 = Math.max(0, Math.floor((Math.min(az, bz, cz) - oz) / c)), j1 = Math.min(nz - 1, Math.floor((Math.max(az, bz, cz) - oz) / c));
      const lado = (px, pz, qx, qz, rx, rz) => (qx - px) * (rz - pz) - (qz - pz) * (rx - px);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const px = ox + (i + 0.5) * c, pz = oz + (j + 0.5) * c;
        const d1 = lado(ax, az, bx, bz, px, pz), d2 = lado(bx, bz, cx, cz, px, pz), d3 = lado(cx, cz, ax, az, px, pz);
        if ((d1 >= 0 && d2 >= 0 && d3 >= 0) || (d1 <= 0 && d2 <= 0 && d3 <= 0)) teto[j * nx + i] = id;
      }
    }
  }
  /* a água: o mar pra lá da linha d'água; a lagoa (o contorno), menos a
     ilhota e o trapiche, que se pisa. Depois dela, os riscos se arrumam */
  function agua(costa, lagoa) {
    const cruza = (pol, z, xs) => {
      xs.length = 0;
      for (let k = 0, l = pol.length - 1; k < pol.length; l = k++) {
        const [xa, za] = pol[k], [xb, zb] = pol[l];
        if ((za > z) !== (zb > z)) xs.push(xa + (z - za) / (zb - za) * (xb - xa));
      }
      return xs.sort((a, b) => a - b);
    };
    const xs = [], i0 = x => Math.max(0, Math.ceil((x - ox) / c - 0.5)), i1 = x => Math.min(nx - 1, Math.floor((x - ox) / c - 0.5));
    for (let j = 0; j < nz; j++) {
      const z = oz + (j + 0.5) * c, lin = j * nx;
      if (costa) for (let i = i0(costa.agua(z)); i < nx; i++) g[lin + i] |= AGUA;
      if (!lagoa) continue;
      cruza(lagoa.agua, z, xs);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let i = i0(xs[k]), e = i1(xs[k + 1]); i <= e; i++) g[lin + i] |= AGUA;
      cruza(lagoa.ilha, z, xs);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let i = i0(xs[k]), e = i1(xs[k + 1]); i <= e; i++) g[lin + i] &= ~AGUA;
      for (const r of lagoa.pisa) if (z >= r.y0 && z <= r.y1) for (let i = i0(r.x0), e = i1(r.x1); i <= e; i++) g[lin + i] &= ~AGUA;
    }
    const t0 = performance.now();
    paredes.fechar();
    ms += performance.now() - t0;
  }
  /* o alcance: o que se chega andando da borda (a busca em largura, com a
     fila circular que cresce se precisar), por cima dos riscos marcados
     nas células — feito na primeira vez que alguém entra a pé, e não na
     montagem, que não precisa dele */
  function alcancar() {
    if (alcancou) return;
    alcancou = true;
    const sg = paredes.seg;
    for (let s = 0; s < paredes.n; s++)
      riscar((sg[s * 4] - ox) / c, (sg[s * 4 + 1] - oz) / c, (sg[s * 4 + 2] - ox) / c, (sg[s * 4 + 3] - oz) / c);
    let q = new Int32Array(1 << 18), ini = 0, fim = 0;
    const poe = k => {
      if (g[k] & (SOLIDO | AGUA | MATO | ALCANCE)) return;
      g[k] |= ALCANCE;
      if (fim - ini === q.length) {
        const nq = new Int32Array(q.length * 2);
        for (let t = ini; t < fim; t++) nq[t - ini] = q[t & (q.length - 1)];
        q = nq; fim -= ini; ini = 0;
      }
      q[fim++ & (q.length - 1)] = k;
    };
    for (let i = 0; i < nx; i++) { poe(i); poe((nz - 1) * nx + i); }
    for (let j = 0; j < nz; j++) { poe(j * nx); poe(j * nx + nx - 1); }
    while (ini < fim) {
      const k = q[ini++ & (q.length - 1)], i = k % nx;
      if (i > 0) poe(k - 1);
      if (i < nx - 1) poe(k + 1);
      if (k >= nx) poe(k - nx);
      if (k < (nz - 1) * nx) poe(k + nx);
    }
  }
  /* o chão debaixo do corpo (um círculo de raio r) é seco e fica na área? */
  function seco(x, z, r) {
    const i0 = Math.floor((x - r - ox) / c), i1 = Math.floor((x + r - ox) / c), j0 = Math.floor((z - r - oz) / c), j1 = Math.floor((z + r - oz) / c);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      if (i < 0 || j < 0 || i >= nx || j >= nz) return false;
      if (!(g[j * nx + i] & (AGUA | MATO))) continue;
      const px = clamp(x, ox + i * c, ox + (i + 1) * c), pz = clamp(z, oz + j * c, oz + (j + 1) * c);
      if ((px - x) * (px - x) + (pz - z) * (pz - z) < r * r) return false;
    }
    return true;
  }
  /* cabe o corpo com o meio em (x, z): nenhum risco a menos de r, chão seco */
  const cabe = (x, z, r) => seco(x, z, r) && paredes.cabe(x, z, r);
  /* o lugar alcançável mais perto de (x, z) onde o corpo cabe, até `raio` */
  function perto(x, z, r, raio) {
    alcancar();
    const ci = Math.floor((x - ox) / c), cj = Math.floor((z - oz) / c), R = Math.ceil(raio / c);
    for (let d = 0; d <= R; d++) {
      let melhor = null, md = Infinity;
      for (let j = cj - d; j <= cj + d; j++) for (let i = ci - d; i <= ci + d; i++) {
        if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== d || i < 0 || j < 0 || i >= nx || j >= nz) continue;
        if (!(g[j * nx + i] & ALCANCE)) continue;
        const px = ox + (i + 0.5) * c, pz = oz + (j + 0.5) * c, dd = (px - x) ** 2 + (pz - z) ** 2;
        if (dd < md && cabe(px, pz, r)) { md = dd; melhor = { x: px, z: pz }; }
      }
      if (melhor) return melhor;
    }
    return null;
  }
  /* o prédio cujo telhado cobre (x, z) (0: céu aberto) */
  function tetoEm(x, z) {
    const i = Math.floor((x - ox) / c), j = Math.floor((z - oz) / c);
    return i < 0 || j < 0 || i >= nx || j >= nz ? 0 : teto[j * nx + i];
  }
  /* o prédio em que (x, z) está DENTRO: coberto ali e a 60 cm pros quatro
     lados (debaixo do beiral, na calçada, não conta; encostado na parede
     de dentro, os 60 cm caem dentro da parede, que é coberta) */
  function dentroDe(x, z) {
    const id = tetoEm(x, z), d = 0.6 * M;
    return id && tetoEm(x + d, z) === id && tetoEm(x - d, z) === id && tetoEm(x, z + d) === id && tetoEm(x, z - d) === id ? id : 0;
  }
  /* O MATO: `m(x, z)` diz se o meio da célula é mato (a máscara do chão) */
  function mato(m) {
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (m(ox + (i + 0.5) * c, oz + (j + 0.5) * c)) g[j * nx + i] |= MATO;
  }
  /* o retângulo (x0, x1, z0, z1) fica fora do alcance: o boneco não nasce
     ali (o poço do metrô: na rua ele é buraco) */
  function bloquear(r) {
    const i0 = Math.max(0, Math.floor((r.x0 - ox) / c)), i1 = Math.min(nx - 1, Math.floor((r.x1 - ox) / c));
    const j0 = Math.max(0, Math.floor((r.z0 - oz) / c)), j1 = Math.min(nz - 1, Math.floor((r.z1 - oz) / c));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) g[j * nx + i] |= SOLIDO;
  }
  /* o que tem na célula de (x, z): SÓLIDO, ÁGUA, ALCANCE (pro teste) */
  function celula(x, z) {
    const i = Math.floor((x - ox) / c), j = Math.floor((z - oz) / c);
    return i < 0 || j < 0 || i >= nx || j >= nz ? -1 : g[j * nx + i];
  }
  function conta() {
    let a = 0, t = 0, mt = 0;
    for (let k = 0; k < g.length; k++) { if (g[k] & AGUA) a++; if (g[k] & MATO) mt++; if (teto[k]) t++; }
    return { celulas: g.length, nx, nz, agua: a, mato: mt, cobertas: t, riscos: paredes.n, ms: Math.round(ms) };
  }
  return { assar, agua, mato, alcancar, bloquear, cabe, perto, tetoEm, dentroDe, celula, conta, paredes, nx, nz };
}
const agora = () => performance.now();
const milhar = n => Math.round(n).toLocaleString('pt-BR');

/* O ESTILO do cenário, por cima da planta, nas variáveis de cor dela */
const CSS = `
.cen { position: fixed; inset: 0; z-index: 40; background: #cfdde6; color: var(--tinta); font: 14px/1.4 var(--f-texto); overflow: hidden; }
.cen[hidden] { display: none !important; }
.cen-tela { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; cursor: grab; outline: none; }
.cen-tela.arrastando { cursor: grabbing; }
.cen-topo { position: absolute; left: 12px; right: 12px; top: 10px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px;
  padding: 8px 12px; border-radius: 10px; background: color-mix(in srgb, var(--folha) 90%, transparent); border: 1px solid var(--linha);
  box-shadow: 0 2px 12px rgba(0,0,0,.12); backdrop-filter: blur(6px); }
.cen-nome { min-width: 0; flex: 1 1 260px; }
.cen-nome h1 { margin: 0; font: 700 20px/1.1 var(--f-ui); letter-spacing: .01em; }
.cen-resumo { margin: 2px 0 0; font: 12px/1.3 var(--f-dado); color: var(--tinta-2); font-variant-numeric: tabular-nums; }
.cen-ctrl { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; }
.cen-ctrl label { display: inline-flex; align-items: center; gap: 6px; font: 600 13px/1 var(--f-ui); color: var(--tinta-2); }
.cen-ctrl select { font: 600 14px/1.2 var(--f-ui); color: var(--tinta); background: var(--papel); border: 1px solid var(--linha); border-radius: 8px; padding: 6px 8px; max-width: 200px; }
.cen-bt { font: 600 14px/1 var(--f-ui); letter-spacing: .02em; color: var(--tinta); background: var(--papel); border: 1px solid var(--linha);
  border-radius: 8px; padding: 8px 11px; cursor: pointer; }
.cen-bt:hover { border-color: var(--acento); }
.cen-bt[aria-pressed="true"], .cen-mapas button[aria-selected="true"] { background: var(--acento); color: var(--folha); border-color: var(--acento); }
.cen-mapas { display: inline-flex; border: 1px solid var(--linha); border-radius: 8px; padding: 2px; background: var(--papel); }
.cen-mapas button { font: 600 13px/1 var(--f-ui); color: var(--tinta-2); background: none; border: 0; border-radius: 6px; padding: 7px 10px; cursor: pointer; }
.cen-mapas button.porte::after { content: '•'; margin-left: 4px; color: var(--selecao); }
.cen button:focus-visible, .cen select:focus-visible { outline: 2px solid var(--selecao); outline-offset: 2px; }
.cen-ficha { position: absolute; left: 12px; bottom: 62px; width: min(360px, calc(100% - 24px)); max-height: min(52vh, 480px); overflow: auto;
  padding: 12px 14px; border-radius: 10px; background: color-mix(in srgb, var(--folha) 94%, transparent); border: 1px solid var(--linha);
  box-shadow: 0 2px 14px rgba(0,0,0,.16); }
.cen-ficha .acoes { display: none; }
.cen-ficha h2 { margin: 2px 0 8px; font: 700 18px/1.15 var(--f-ui); padding-right: 28px; }
.cen-ficha .sobre { margin: 0; font: 600 11px/1.2 var(--f-ui); letter-spacing: .06em; text-transform: uppercase; color: var(--tinta-2); }
.cen-ficha .dados { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 3px 12px; margin: 0; font-size: 13px; }
.cen-ficha .dados dt { color: var(--tinta-2); }
.cen-ficha .dados dd { margin: 0; }
.cen-ficha .nota { font-size: 12.5px; color: var(--tinta-2); }
.cen-x { position: absolute; top: 8px; right: 8px; width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--linha); background: var(--papel);
  color: var(--tinta); font: 600 18px/1 var(--f-ui); cursor: pointer; }
.cen-dica { position: absolute; right: 12px; bottom: 12px; max-width: min(430px, calc(100% - 24px)); margin: 0; padding: 7px 10px; border-radius: 8px;
  font: 12px/1.35 var(--f-texto); color: var(--tinta-2); background: color-mix(in srgb, var(--folha) 88%, transparent); border: 1px solid var(--linha); }
.cen-dica b { color: var(--tinta); font-weight: 600; }
.cen-num { display: block; margin-top: 4px; font: 11px/1.3 var(--f-dado); font-variant-numeric: tabular-nums; }
.cen-fps { position: absolute; left: 12px; bottom: 12px; margin: 0; padding: 5px 9px; border-radius: 7px; pointer-events: none;
  font: 600 12px/1.3 var(--f-dado); font-variant-numeric: tabular-nums; color: #f2f3ef; background: rgba(20,22,21,.8); }
.cen-fps b { font-size: 15px; }
.cen-fps b.bom { color: #7fd67a; } .cen-fps b.meio { color: #f0c64a; } .cen-fps b.ruim { color: #ff7b6b; }
.cen-fps small { display: block; font-weight: 400; color: #c9ccc6; }
.cen-fps small.cen-aviso { color: #ffb4a8; font-weight: 600; max-width: 300px; white-space: normal; }
.cen-hover { position: absolute; pointer-events: none; transform: translate(12px, -30px); padding: 4px 8px; border-radius: 6px; white-space: nowrap;
  font: 600 13px/1.2 var(--f-ui); color: #f2f3ef; background: rgba(20,22,21,.82); }
.cen-carga { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(207,221,230,.55); }
.cen-carga-caixa { width: min(420px, calc(100% - 40px)); padding: 16px 18px; border-radius: 12px; background: var(--folha); border: 1px solid var(--linha);
  box-shadow: 0 4px 22px rgba(0,0,0,.18); }
.cen-carga-txt { margin: 0 0 10px; font: 600 15px/1.3 var(--f-ui); }
.cen-barra { height: 8px; border-radius: 4px; background: var(--papel); overflow: hidden; border: 1px solid var(--linha); }
.cen-barra i { display: block; height: 100%; width: 0; background: var(--acento); }
.cen-escolha { position: absolute; inset: 0; overflow: auto; padding: 22px 16px 40px; background: var(--papel); }
.cen-escolha-miolo { max-width: 1080px; margin: 0 auto; }
.cen-escolha h1 { margin: 0 0 4px; font: 700 28px/1.1 var(--f-ui); }
.cen-escolha > div > p { margin: 0 0 14px; color: var(--tinta-2); max-width: 70ch; }
.cen-escolha h2 { margin: 20px 0 8px; font: 700 17px/1.2 var(--f-ui); }
.cen-escolha h2 small { font: 500 13px var(--f-texto); color: var(--tinta-2); margin-left: 6px; }
.cen-praças { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 8px; }
.cen-praças button { width: 100%; text-align: left; border: 1px solid var(--linha); background: var(--folha); border-radius: 9px; padding: 9px 11px;
  cursor: pointer; font: 600 15px/1.2 var(--f-ui); color: var(--tinta); }
.cen-praças button:hover { border-color: var(--acento); box-shadow: inset 4px 0 0 var(--acento); }
.cen-praças small { display: block; margin-top: 3px; font: 400 12px/1.3 var(--f-texto); color: var(--tinta-2); }
.cen-como { font-size: 13px; }
.cen-voltar { float: right; margin: 4px 0 8px 12px; }
.cen.ape .so-voo, .cen:not(.ape) .so-ape { display: none !important; }
.cen-bt:disabled { opacity: .55; cursor: progress; }
/* O JOYSTICK: o círculo embaixo à esquerda, com o pino que segue o dedo
   (ou o mouse); até a borda, corre. A pé ele aparece em qualquer tela */
.cen-joy { position: absolute; left: calc(18px + env(safe-area-inset-left)); bottom: calc(18px + env(safe-area-inset-bottom)); width: 136px; height: 136px;
  border-radius: 50%; display: none; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; cursor: grab;
  background: radial-gradient(circle, rgba(20,22,21,.18) 0 52%, rgba(20,22,21,.42) 53% 100%); border: 2px solid rgba(255,255,255,.5);
  box-shadow: 0 2px 14px rgba(0,0,0,.25); }
.cen.ape .cen-joy { display: block; }
.cen-joy::after { content: ''; position: absolute; inset: 8px; border-radius: 50%; border: 1px dashed rgba(255,255,255,.35); pointer-events: none; }
.cen-joy-pino { position: absolute; left: 50%; top: 50%; width: 58px; height: 58px; margin: -29px 0 0 -29px; border-radius: 50%; pointer-events: none;
  background: rgba(242,243,239,.94); box-shadow: 0 2px 8px rgba(0,0,0,.4); transition: transform .14s ease-out; }
.cen-joy.ativo { cursor: grabbing; }
.cen-joy.ativo .cen-joy-pino { transition: none; }
.cen-joy.correndo .cen-joy-pino { background: var(--acento); }
/* O BOTÃO DA PORTA: aparece a pé, perto de uma porta da sede, do lado
   oposto ao joystick */
.cen-bt-porta { position: absolute; right: calc(18px + env(safe-area-inset-right)); bottom: calc(40px + env(safe-area-inset-bottom)); padding: 12px 16px;
  font-size: 15px; box-shadow: 0 2px 12px rgba(0,0,0,.25); }
.cen-bt-porta[hidden] { display: none; }
.cen-bt-porta kbd { font: 600 12px/1 var(--f-dado); margin-left: 6px; padding: 2px 5px; border: 1px solid var(--linha); border-radius: 4px; }
.cen.toque .cen-bt-porta kbd, .cen:not(.ape) .cen-bt-porta { display: none; }
.cen.ape .cen-dica { bottom: 96px; }
/* a pé, o fps sobe pra baixo da barra de cima (embaixo é do joystick) e a
   ficha sobe por cima dele; no toque, o fps fica só com o número */
.cen.ape .cen-fps { top: calc(var(--topo-alt, 60px) + 16px); bottom: auto; left: 12px; }
.cen.ape.toque .cen-fps small:not(.cen-aviso) { display: none; }
.cen.ape.toque .cen-fps small.cen-aviso { max-width: 230px; }
.cen.ape .cen-ficha { bottom: calc(172px + env(safe-area-inset-bottom)); max-height: 34vh; }
.cen .curto { display: none; }
@media (max-width: 760px) {
  .cen-topo { left: 8px; right: 8px; top: 8px; padding: 7px 9px; gap: 6px 10px; }
  .cen-nome h1 { font-size: 17px; }
  .cen-resumo { display: none; }
  .cen-ctrl { gap: 5px 6px; }
  .cen-bt { padding: 7px 9px; font-size: 13px; }
  .cen-mapas button { padding: 6px 8px; }
  .cen-dica { display: none; }
  .cen-ficha { left: 8px; bottom: 56px; max-height: 40vh; }
  /* a pé, a barra de cima numa linha ou duas: sem o nome da praça, com os rótulos curtos */
  .cen.ape .cen-nome, .cen.ape .cen-ctrl label > .rot { display: none; }
  .cen.ape .longo { display: none; }
  .cen.ape .curto { display: inline; }
  .cen.ape .cen-camisa { max-width: 150px; }
  .cen-fps { left: 8px; bottom: 8px; }
}`;

export function criarCenario(P) {
  const M = P.M;
  /* a mesma imagem de folha pedida por vários marcos vem uma vez só */
  THREE.Cache.enabled = true;

  /* ======================================================
     A PÁGINA
     ====================================================== */
  const estilo = document.createElement('style'); estilo.textContent = CSS; document.head.appendChild(estilo);
  const raiz = document.createElement('div');
  raiz.className = 'cen'; raiz.hidden = true;
  raiz.innerHTML = `
    <canvas class="cen-tela" tabindex="0" aria-label="O cenário 3D da praça: arraste pra andar, botão direito gira, role pra aproximar"></canvas>
    <header class="cen-topo">
      <div class="cen-nome"><h1>Cenário 3D</h1><p class="cen-resumo">—</p></div>
      <div class="cen-ctrl">
        <label class="so-voo">Praça <select class="cen-cidade"></select></label>
        <div class="cen-mapas so-voo" role="tablist" aria-label="Qual mapa">
          <button role="tab" data-mapa="pequeno">Pequeno</button><button role="tab" data-mapa="medio">Médio</button><button role="tab" data-mapa="grande">Grande</button>
        </div>
        <button class="cen-bt so-voo" data-acao="cima">Vista de cima</button>
        <button class="cen-bt so-voo" data-acao="rua">Nível da rua</button>
        <button class="cen-bt so-voo cen-bt-ape" data-acao="ape" title="Põe o boneco do jogo na rua, no meio da tela, pra andar com ele">A pé</button>
        <label class="so-ape"><span class="rot">Camisa</span> <select class="cen-camisa" aria-label="A camisa do boneco"></select></label>
        <button class="cen-bt so-ape cen-bt-sede" data-acao="sede"><span class="longo">Ir pra sede</span><span class="curto">Sede</span></button>
        <button class="cen-bt so-ape" data-acao="rosto"><span class="longo">Outro boneco</span><span class="curto">Outro</span></button>
        <label><span class="rot">Qualidade</span> <select class="cen-q" aria-label="Qualidade">${Object.entries(QUALIDADES).map(([k, q]) => `<option value="${k}">${q.nome}</option>`).join('')}</select></label>
        <button class="cen-bt so-voo" data-acao="escolher">Praças</button>
        <button class="cen-bt so-voo" data-acao="planta">Planta 2D</button>
        <button class="cen-bt so-ape" data-acao="sair"><span class="longo">Sair da rua</span><span class="curto">Sair</span></button>
      </div>
    </header>
    <aside class="cen-ficha" hidden><button class="cen-x" aria-label="Fechar a ficha">×</button><div class="cen-ficha-corpo"></div></aside>
    <p class="cen-dica"><span class="so-voo"><b>Arraste</b> pra andar · <b>botão direito</b> (ou Shift) gira e inclina · <b>role</b> pra aproximar · <b>WASD</b> anda, <b>Q/E</b> gira · <b>duplo clique</b> voa até o ponto · <b>clique</b> numa coisa pra ver a ficha</span><span class="so-ape">O <b>joystick</b> anda (na borda, corre) · <b>WASD</b> ou as setas também (<b>Shift</b> corre) · <b>arraste</b> a tela pra girar · <b>role</b> aproxima · <b>Q/E</b> giram, <b>R/T</b> inclinam · <b>F</b> abre e fecha a porta · <b>clique</b> numa coisa pra ver a ficha</span><span class="cen-num"></span></p>
    <div class="cen-joy" role="application" aria-label="Joystick: arraste o pino pra andar; na borda, corre"><div class="cen-joy-pino"></div></div>
    <button class="cen-bt cen-bt-porta" data-acao="porta" hidden>Abrir a porta <kbd>F</kbd></button>
    <div class="cen-hover" hidden></div>
    <p class="cen-fps" aria-live="off"><b>—</b> fps<small>medindo…</small></p>
    <div class="cen-carga" hidden><div class="cen-carga-caixa" role="status" aria-live="polite"><p class="cen-carga-txt">Montando…</p><div class="cen-barra"><i></i></div></div></div>
    <section class="cen-escolha" hidden aria-label="Escolha a praça"><div class="cen-escolha-miolo"></div></section>`;
  document.body.appendChild(raiz);
  const $ = sel => raiz.querySelector(sel);
  const tela = $('.cen-tela'), selCidade = $('.cen-cidade'), selQ = $('.cen-q');

  /* as praças por porte: o porte decide o mapa (a planta decide qual) */
  const PORTES = [['Grande', 'Cidades grandes'], ['Médio', 'Cidades médias'], ['Pequeno', 'Cidades pequenas']];
  const doPorte = t => P.CIDADES.filter(n => ((P.infoDaCidade(n) || {}).tamanho || 'Grande') === t);
  selCidade.innerHTML = PORTES.map(([t, rot]) => `<optgroup label="${rot}">` + doPorte(t).map(n => `<option>${esc(n)}</option>`).join('') + '</optgroup>').join('');
  function montarEscolha() {
    const linha = n => {
      const c = P.infoDaCidade(n) || {}, e = (c.estadios || []).length;
      const tem = [e ? e + (e > 1 ? ' estádios' : ' estádio') : null, c.temLagoa ? 'lagoa' : c.temPraia ? 'praia' : null, c.temMetro ? 'metrô' : null,
                   { mata: 'mata', cerrado: 'cerrado', caatinga: 'caatinga' }[c.vegetacao] || null].filter(Boolean).join(' · ');
      return `<li><button data-cidade="${esc(n)}">${esc(n)}<small>${esc(tem)}</small></button></li>`;
    };
    $('.cen-escolha-miolo').innerHTML = `<button class="cen-bt cen-voltar" data-acao="voltar" hidden>Voltar ao cenário</button><h1>Cenário 3D das praças</h1>
      <p>Escolha a praça: abre o mapa do porte dela (o pequeno, o médio ou o grande), montado em 3D com o que a planta tem hoje — as casas, as favelas, os bares e as sedes das torcidas da praça, os estádios, o metrô, a praia ou a lagoa e o mato em volta.</p>
      <p class="cen-como"><b>Pra andar:</b> arraste o chão; botão direito (ou Shift) gira e inclina; a roda aproxima; WASD e as setas andam. <b>No celular:</b> um dedo arrasta, dois dedos giram, inclinam e aproximam. Toque numa casa, bar, sede ou estádio pra ver a ficha dela. <b>A pé</b>, o F (ou o botão que aparece perto da porta) abre e fecha as portas da sede.</p>` +
      PORTES.map(([t, rot]) => `<h2>${rot}<small>mapa ${P.NOME_MAPA[P.MAPA_DO_PORTE[t]] || ''}</small></h2><ul class="cen-praças">${doPorte(t).map(linha).join('')}</ul>`).join('');
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  /* a qualidade guardada; sem ela, a leve no celular e a normal no resto */
  let qualidade = null;
  try { qualidade = localStorage.getItem('cenario-qualidade'); } catch (e) {}
  if (!QUALIDADES[qualidade]) qualidade = matchMedia('(pointer: coarse)').matches ? 'leve' : 'normal';
  selQ.value = qualidade;

  /* ======================================================
     O 3D
     ====================================================== */
  const rend = new THREE.WebGLRenderer({ canvas: tela, antialias: true, powerPreference: 'high-performance' });
  rend.shadowMap.enabled = false;
  const cena = new THREE.Scene();
  cena.background = CEU.clone();
  cena.fog = new THREE.Fog(CEU.clone(), 1000, 100000);
  const cam = new THREE.PerspectiveCamera(42, 1, 1, 100000);
  cena.add(new THREE.HemisphereLight(0xe3edf5, 0x6d695d, 1.25));
  const sol = new THREE.DirectionalLight(0xfff1da, 2.2);
  cena.add(sol, sol.target);
  /* o céu: a cúpula clara no horizonte (a cor da névoa) e azul no alto */
  {
    const g = new THREE.SphereGeometry(1, 32, 16), cor = [], p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const t = clamp(p.getY(i) * 1.6, 0, 1); const c = CEU.clone().lerp(ZENITE, t); cor.push(c.r, c.g, c.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3));
    const ceu = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
    ceu.renderOrder = -10; ceu.frustumCulled = false; ceu.name = 'ceu';
    cena.add(ceu);
    ceu.onBeforeRender = () => { ceu.position.copy(cam.position); ceu.scale.setScalar(cam.far * 0.9); ceu.updateMatrixWorld(); };
  }
  /* o que é do mapa da vez (o chão, o mato, o forno, a seleção): sai inteiro na troca */
  let doMapa = new THREE.Group(); cena.add(doMapa);

  function ajustarTela() {
    const r = tela.getBoundingClientRect();
    rend.setPixelRatio(Math.min(window.devicePixelRatio || 1, QUALIDADES[qualidade].dpr));
    rend.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
    cam.aspect = Math.max(1, r.width) / Math.max(1, r.height);
    pedir();
  }
  new ResizeObserver(ajustarTela).observe(tela);
  new ResizeObserver(() => raiz.style.setProperty('--topo-alt', Math.round($('.cen-topo').getBoundingClientRect().height) + 'px')).observe($('.cen-topo'));

  /* ======================================================
     A CÂMERA: órbita em volta de um alvo no chão
     ====================================================== */
  const orb = { alvo: new THREE.Vector3(), dist: 6000, az: -0.55, el: 0.85 };
  let area = { x0: 0, y0: 0, x1: 1000, y1: 1000 };
  const OLHO = 1.6;                       // m: a altura do olho de quem anda
  const suave = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  /* A PÉ, DE CIMA: a distância da câmera que põe `vao` metros no lado
     menor da tela (no celular em pé, a largura) */
  const FOV_APE = 40;
  const distDoVao = vao => vao * M / 2 / (Math.tan(THREE.MathUtils.degToRad(FOV_APE / 2)) * Math.min(1, cam.aspect));
  function posicionar() {
    /* a pé (`k` vai de 0 a 1 na chegada): o alvo é o boneco e a câmera
       olha de cima; `kv`, a lente e o longe de a pé (no pulo de um lugar
       da rua pro outro, já são os de a pé) */
    const k = ape ? suave(ape.chegada) : 0, kv = ape && ape.de.pulo ? 1 : k;
    if (ape && k >= 1) { orb.dist = distDoVao(ape.vao); orb.el = clamp(orb.el, 0.9, 1.5); }
    else { orb.dist = clamp(orb.dist, 2.5 * M, 2600 * M); orb.el = clamp(orb.el, 0.02, 1.54); }
    if (ape) {
      const de = ape.de;
      orb.alvo.set(de.x + (ape.x - de.x) * k, (OLHO + (APE.olho - OLHO) * k) * M + ape.yv * k, de.z + (ape.z - de.z) * k);
    } else {
      orb.alvo.x = clamp(orb.alvo.x, area.x0 - 200 * M, area.x1 + 200 * M);
      orb.alvo.z = clamp(orb.alvo.z, area.y0 - 200 * M, area.y1 + 200 * M);
      orb.alvo.y = OLHO * M;
    }
    const c = orb.alvo, ce = Math.cos(orb.el), d = orb.dist;
    cam.position.set(c.x + d * ce * Math.sin(orb.az), c.y + d * Math.sin(orb.el), c.z + d * ce * Math.cos(orb.az));
    cam.lookAt(c);
    cam.fov = 42 + (FOV_APE - 42) * kv;
    /* o perto e o longe acompanham a distância: a profundidade não perde
       precisão rente ao chão, e a névoa esconde a borda do mundo. A pé,
       de cima, a tela só mostra umas dezenas de metros em volta dele: o
       longe fica curto, sem névoa, e o que passa dele nem vai pra placa */
    const mis = (a, b) => a + (b - a) * kv, longe = d * 3 + 60 * M;
    cam.near = mis(clamp(d * 0.02, 0.5, 400), Math.max(0.3 * M, d * 0.03));
    cam.far = mis(d * 6 + 60000, longe);
    cam.updateProjectionMatrix();
    cena.fog.near = mis(d * 1.6 + 1500, longe * 2);
    cena.fog.far = mis(d * 5 + 40000, longe * 3);
    /* o sol: só a direção conta (luz sem sombra) */
    sol.target.position.set(c.x, 0, c.z);
    sol.position.copy(sol.target.position).addScaledVector(SOL, 1000);
    sol.target.updateMatrixWorld();
  }

  /* pedir um quadro: desenha só quando algo muda */
  let pedido = 0, ultimo = 0;
  const teclas = new Set();
  let voo = null;
  /* O LAÇO: com o cenário aberto, desenha todo quadro, como um jogo — é o
     que o medidor de fps mede (parado ou andando dá o mesmo trabalho).
     Enquanto a praça monta, só desenha quando pede (o quadro contínuo
     roubaria o tempo da montagem na máquina lenta) */
  function pedir() { if (!pedido && !raiz.hidden) pedido = requestAnimationFrame(quadro); }
  const medidor = { desde: 0, quadros: 0, cpu: 0 };
  function quadro(t) {
    pedido = 0;
    /* o tempo de verdade (a máquina lenta pula quadro, mas chega na hora) */
    const dt = ultimo ? Math.min(0.2, (t - ultimo) / 1000) : 0.016;
    ultimo = t;
    if (ape) andarAPe(dt);
    else if (teclas.size) andar(dt);
    animarPortas(dt);
    if (voo) voo(dt);
    posicionar();
    atualizarCorte();
    const t0 = performance.now();
    rend.render(cena, cam);
    medir(t, performance.now() - t0);
    contar();
    if (!montando) pedir();
  }
  /* O MEDIDOR: quadros por segundo e milissegundos por quadro, na média de
     meio segundo; o tempo do processador pra mandar o quadro; as chamadas
     de desenho e os triângulos do quadro */
  const fpsEl = $('.cen-fps');
  /* QUEM DESENHA: o nome da placa de vídeo que o navegador usa. Quando ele
     desiste da placa (a lista negra do Chrome pega placa velha e driver
     velho), o WebGL cai no SwiftShader, que desenha no processador — e aí
     o fps é de um dígito em qualquer máquina. O medidor avisa */
  const placa = (() => {
    try {
      const gl = rend.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
      const nome = String((ext && gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || '');
      const semPlaca = /swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(nome);
      const curto = nome.replace(/^ANGLE \((.*)\)$/, '$1').replace(/Direct3D.*|vs_\d.*|\(0x[0-9a-f]+\)/gi, '').replace(/\s+/g, ' ').replace(/[ ,]+$/, '').slice(0, 60);
      return { nome, semPlaca, curto };
    } catch (e) { return { nome: '', semPlaca: false, curto: '' }; }
  })();
  function medir(t, cpu) {
    medidor.quadros++; medidor.cpu += cpu;
    if (!medidor.desde) { medidor.desde = t; medidor.quadros = 0; medidor.cpu = 0; return; }
    const passou = t - medidor.desde;
    if (montando) { medidor.desde = 0; fpsEl.innerHTML = '<b>—</b> fps<small>montando a praça…</small>'; return; }
    if (passou < 500 || !medidor.quadros) return;
    const fps = medidor.quadros * 1000 / passou, ms = passou / medidor.quadros, r = rend.info.render;
    const classe = fps >= 50 ? 'bom' : fps >= 28 ? 'meio' : 'ruim';
    fpsEl.innerHTML = `<b class="${classe}">${Math.round(fps)}</b> fps · ${ms.toFixed(1).replace('.', ',')} ms` +
      `<small>${r.calls} chamadas · ${milhar(r.triangles / 1000)} mil triângulos · CPU ${(medidor.cpu / medidor.quadros).toFixed(1).replace('.', ',')} ms</small>` +
      (placa.semPlaca ? `<small class="cen-aviso">Sem placa de vídeo: o navegador desenha no processador (${esc(placa.curto)})</small>`
        : placa.curto ? `<small>${esc(placa.curto)}</small>` : '');
    medidor.desde = t; medidor.quadros = 0; medidor.cpu = 0;
  }

  /* ANDAR NO TECLADO: WASD e setas no chão, Q/E gira, R/F inclina; com
     Shift, o dobro */
  function andar(dt) {
    const v = Math.max(5 * M, orb.dist * 0.9) * dt * (teclas.has('shift') ? 2.2 : 1);
    const fx = -Math.sin(orb.az), fz = -Math.cos(orb.az), rx = Math.cos(orb.az), rz = -Math.sin(orb.az);
    let f = 0, r = 0;
    if (teclas.has('w') || teclas.has('arrowup')) f += 1;
    if (teclas.has('s') || teclas.has('arrowdown')) f -= 1;
    if (teclas.has('d') || teclas.has('arrowright')) r += 1;
    if (teclas.has('a') || teclas.has('arrowleft')) r -= 1;
    orb.alvo.x += (fx * f + rx * r) * v; orb.alvo.z += (fz * f + rz * r) * v;
    if (teclas.has('q')) orb.az += dt * 1.3;
    if (teclas.has('e')) orb.az -= dt * 1.3;
    if (teclas.has('r')) orb.el += dt * 0.8;
    if (teclas.has('f')) orb.el -= dt * 0.8;
    if (teclas.has('+') || teclas.has('=')) orb.dist *= Math.exp(-dt * 1.6);
    if (teclas.has('-')) orb.dist *= Math.exp(dt * 1.6);
  }
  const TECLAS = new Set(['w', 'a', 's', 'd', 'q', 'e', 'r', 'f', 't', '+', '=', '-', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift']);
  window.addEventListener('keydown', ev => {
    if (raiz.hidden || ev.target.closest && ev.target.closest('select, input, textarea')) return;
    const k = ev.key.toLowerCase();
    if (k === 'escape') { fecharFicha(); return; }
    if (!TECLAS.has(k) || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    /* a pé, o F abre e fecha a porta mais perto (uma vez por aperto) */
    if (k === 'f' && ape) { if (!ev.repeat) alternarPorta(); return; }
    if (k.startsWith('arrow')) ev.preventDefault();
    teclas.add(k); cancelarVoo(); pedir();
  });
  window.addEventListener('keyup', ev => { teclas.delete(ev.key.toLowerCase()); if (ev.key === 'Shift') teclas.delete('shift'); });
  window.addEventListener('blur', () => teclas.clear());

  /* o ponto do chão debaixo do cursor (a planta chama de y o que aqui é z) */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), CHAO = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  function raioEm(sx, sy) {
    const r = tela.getBoundingClientRect();
    ndc.set((sx - r.left) / r.width * 2 - 1, -((sy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    return ray.ray;
  }
  function chaoEm(sx, sy) {
    const p = raioEm(sx, sy).intersectPlane(CHAO, new THREE.Vector3());
    if (!p || p.distanceTo(cam.position) > orb.dist * 12 + 2000) return null;
    return p;
  }
  function cancelarVoo() { voo = null; }
  /* VOAR até um ponto: o alvo e a distância vão juntos, suave */
  function voarPara(x, z, dist, el, az) {
    const de = { x: orb.alvo.x, z: orb.alvo.z, dist: orb.dist, el: orb.el, az: orb.az };
    const para = { x, z, dist: dist ?? orb.dist, el: el ?? orb.el, az: az ?? orb.az };
    let da = para.az - de.az; da = Math.atan2(Math.sin(da), Math.cos(da));
    let t = 0;
    const T = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.01 : 0.7;
    voo = dt => {
      t = Math.min(1, t + dt / T);
      const f = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      orb.alvo.x = de.x + (para.x - de.x) * f; orb.alvo.z = de.z + (para.z - de.z) * f;
      orb.dist = Math.exp(Math.log(de.dist) + (Math.log(para.dist) - Math.log(de.dist)) * f);
      orb.el = de.el + (para.el - de.el) * f; orb.az = de.az + da * f;
      if (t >= 1) { voo = null; return false; }
      return true;
    };
    pedir();
  }

  /* ---- o mouse e o toque ---- */
  const ptrs = new Map();
  let gesto = null;                        // { tipo: 'arrasta' | 'gira' | 'dois', ... }
  tela.addEventListener('contextmenu', ev => ev.preventDefault());
  tela.addEventListener('pointerdown', ev => {
    tela.focus({ preventScroll: true });
    tela.setPointerCapture(ev.pointerId);
    ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY, x0: ev.clientX, y0: ev.clientY });
    cancelarVoo();
    if (ptrs.size === 1) {
      /* a pé, o chão não se arrasta: arrastar gira a câmera em volta dele */
      const gira = !!ape || ev.button === 2 || ev.button === 1 || ev.shiftKey || ev.ctrlKey;
      gesto = gira ? { tipo: 'gira', moveu: false } : { tipo: 'arrasta', ponto: chaoEm(ev.clientX, ev.clientY), moveu: false };
    } else if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      gesto = { tipo: 'dois', d: Math.hypot(a.x - b.x, a.y - b.y), ang: Math.atan2(b.y - a.y, b.x - a.x), my: (a.y + b.y) / 2, dist: orb.dist, vao: ape ? ape.vao : 0, az: orb.az, el: orb.el, moveu: true };
    }
    $('.cen-hover').hidden = true;
  });
  tela.addEventListener('pointermove', ev => {
    const p = ptrs.get(ev.pointerId);
    if (!p) { if (ev.pointerType === 'mouse') passar(ev.clientX, ev.clientY); return; }
    const dx = ev.clientX - p.x, dy = ev.clientY - p.y;
    p.x = ev.clientX; p.y = ev.clientY;
    if (!gesto) return;
    if (Math.hypot(p.x - p.x0, p.y - p.y0) > 5) { gesto.moveu = true; tela.classList.add('arrastando'); }
    if (!gesto.moveu) return;
    if (gesto.tipo === 'gira') {
      orb.az -= dx * 0.006; orb.el += dy * 0.005;
    } else if (gesto.tipo === 'arrasta') {
      /* PEGAR O CHÃO: o ponto que estava debaixo do dedo continua debaixo dele */
      const agoraP = gesto.ponto && chaoEm(ev.clientX, ev.clientY);
      if (agoraP) { orb.alvo.x += gesto.ponto.x - agoraP.x; orb.alvo.z += gesto.ponto.z - agoraP.z; }
      else {
        const k = orb.dist / Math.max(200, tela.clientHeight) * 1.6;
        orb.alvo.x -= (Math.cos(orb.az) * dx + Math.sin(orb.az) * dy) * k;
        orb.alvo.z -= (-Math.sin(orb.az) * dx + Math.cos(orb.az) * dy) * k;
      }
    } else if (gesto.tipo === 'dois' && ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y), ang = Math.atan2(b.y - a.y, b.x - a.x), my = (a.y + b.y) / 2;
      /* a pé, a pinça muda o quanto cabe na tela */
      if (ape) ape.vao = clamp(gesto.vao * gesto.d / Math.max(1, d), 5, 80);
      else orb.dist = gesto.dist * gesto.d / Math.max(1, d);
      orb.az = gesto.az - (ang - gesto.ang);
      orb.el = gesto.el + (my - gesto.my) * 0.004;
    }
    pedir();
  });
  const soltar = ev => {
    const p = ptrs.get(ev.pointerId);
    ptrs.delete(ev.pointerId);
    tela.classList.remove('arrastando');
    if (gesto && !gesto.moveu && p && ev.type === 'pointerup' && ptrs.size === 0 && ev.button === 0) clicar(ev.clientX, ev.clientY);
    if (ptrs.size === 1 && gesto && gesto.tipo === 'dois') {
      const [q] = [...ptrs.values()];
      gesto = ape ? { tipo: 'gira', moveu: true } : { tipo: 'arrasta', ponto: chaoEm(q.x, q.y), moveu: true };
    } else if (ptrs.size === 0) gesto = null;
  };
  tela.addEventListener('pointerup', soltar);
  tela.addEventListener('pointercancel', soltar);
  tela.addEventListener('wheel', ev => {
    ev.preventDefault();
    cancelarVoo();
    const f = Math.exp(clamp(ev.deltaY, -120, 120) * (ev.deltaMode === 1 ? 0.05 : 0.0016));
    /* a pé, a roda muda o quanto cabe na tela, com o boneco no meio */
    if (ape) { ape.vao = clamp(ape.vao * f, 5, 80); pedir(); return; }
    /* aproxima NO CURSOR: o ponto do chão debaixo dele fica onde está */
    const p = chaoEm(ev.clientX, ev.clientY);
    const antes = orb.dist;
    orb.dist = clamp(orb.dist * f, 2.5 * M, 2600 * M);
    if (p) { const k = 1 - orb.dist / antes; orb.alvo.x += (p.x - orb.alvo.x) * k; orb.alvo.z += (p.z - orb.alvo.z) * k; }
    pedir();
  }, { passive: false });
  tela.addEventListener('dblclick', ev => {
    if (ape) return;
    const p = chaoEm(ev.clientX, ev.clientY);
    if (p) voarPara(p.x, p.z, Math.max(18 * M, orb.dist * 0.4));
  });

  /* ======================================================
     O CLIQUE: o número da coisa no pixel
     ------------------------------------------------------
     Cada vértice do forno leva o número da coisa de onde veio (1, 2, 3…;
     0 é o que não tem ficha: o chão, o mato, a árvore). No clique, a cena
     é desenhada de novo num alvo de 1 × 1 pixel, só com esse número na
     cor — o que se vê naquele pixel é o que se clicou, exato (a parede,
     não a caixa em volta do prédio). Com o recorte de 1 pixel, a câmera
     descarta quase tudo e o desenho sai barato.
     ====================================================== */
  let coisas = [null], selecao = null;
  const caixaSel = new THREE.Box3Helper(new THREE.Box3(), 0xf09c45);
  caixaSel.visible = false; caixaSel.material.depthTest = false; caixaSel.renderOrder = 5; cena.add(caixaSel);
  const alvoId = new THREE.WebGLRenderTarget(1, 1), pixel = new Uint8Array(4);
  /* o clique respeita o corte (o telhado que sumiu não pega o clique, nem
     a cidade em cima da estação quando ele está no metrô) e o buraco do
     poço no chão (o chão é a coisa 0) — os uniformes entram com o CORTE,
     lá embaixo */
  const matId = new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: `attribute float idCoisa; varying vec3 vId; varying vec3 vCorteP; varying float vCorteId;
      void main() {
        vId = vec3(mod(idCoisa, 256.0), mod(floor(idCoisa / 256.0), 256.0), floor(idCoisa / 65536.0)) / 255.0;
        vCorteId = idCoisa;
        vec4 p = modelMatrix * vec4(position, 1.0);
        vCorteP = p.xyz;
        gl_Position = projectionMatrix * viewMatrix * p;
      }`,
    fragmentShader: `varying vec3 vId; varying vec3 vCorteP; varying float vCorteId;
      CORTE_GLSL
      void main() {
        if ( corteSub( vCorteP ) ) discard;
        if ( uCorte > 0.5 && uCorteId > 0.5 && abs( vCorteId - uCorteId ) < 0.5 && vCorteP.y > uCorteY ) discard;
        if ( vCorteId < 0.5 && abs( vCorteP.y ) < 1.0 && noBuraco( vCorteP ) ) discard;
        gl_FragColor = vec4(vId, 1.0);
      }`,
    side: THREE.DoubleSide
  });
  function pegar(sx, sy) {
    if (coisas.length < 2) return null;
    const r = tela.getBoundingClientRect();
    posicionar();
    const fundo = cena.background, cor = rend.getClearColor(new THREE.Color()), alfa = rend.getClearAlpha();
    const vis = caixaSel.visible;
    cena.background = null; cena.overrideMaterial = matId; caixaSel.visible = false;
    rend.setClearColor(0x000000, 1);
    cam.setViewOffset(r.width, r.height, Math.floor(sx - r.left), Math.floor(sy - r.top), 1, 1);
    rend.setRenderTarget(alvoId);
    rend.render(cena, cam);
    rend.readRenderTargetPixels(alvoId, 0, 0, 1, 1, pixel);
    rend.setRenderTarget(null);
    cam.clearViewOffset();
    cena.background = fundo; cena.overrideMaterial = null; caixaSel.visible = vis;
    rend.setClearColor(cor, alfa);
    const id = pixel[0] + pixel[1] * 256 + pixel[2] * 65536;
    return coisas[id] || null;
  }
  function clicar(sx, sy) {
    const c = pegar(sx, sy);
    if (!c) { fecharFicha(); return; }
    selecao = c;
    const t = c.caixa;
    caixaSel.box.min.set(t[0], t[1], t[2]); caixaSel.box.max.set(t[3], t[4], t[5]);
    caixaSel.visible = true;
    $('.cen-ficha-corpo').innerHTML = P.fichaDe(c.it) || `<h2>${esc(P.tituloDe(c.it) || '')}</h2>`;
    $('.cen-ficha').hidden = false;
    pedir();
  }
  function fecharFicha() { selecao = null; caixaSel.visible = false; $('.cen-ficha').hidden = true; pedir(); }
  $('.cen-x').onclick = fecharFicha;
  /* o nome do que está debaixo do mouse, quando ele para (a leitura do
     pixel faz a placa de vídeo esperar: só com o mouse parado) */
  let passo = 0, ultimoXY = null;
  function passar(sx, sy) {
    ultimoXY = [sx, sy];
    $('.cen-hover').hidden = true;
    clearTimeout(passo);
    passo = setTimeout(() => {
      passo = 0;
      if (gesto || raiz.hidden || montando) return;
      const [x, y] = ultimoXY, c = pegar(x, y), h = $('.cen-hover');
      if (!c || (selecao && c.it === selecao.it)) { h.hidden = true; return; }
      const r = tela.getBoundingClientRect();
      h.textContent = P.tituloDe(c.it) || '';
      h.style.left = (x - r.left) + 'px'; h.style.top = (y - r.top) + 'px';
      h.hidden = !h.textContent;
    }, 180);
  }
  tela.addEventListener('pointerleave', () => { $('.cen-hover').hidden = true; });

  /* ======================================================
     O FORNO: junta as malhas por bloco e por material
     ====================================================== */
  /* O CORTE NOS MATERIAIS (a pé, de cima): os uniformes são os mesmos
     objetos em todos, e o quadro só troca o valor. No fragmento:
     - o que é da coisa `uCorteId` (o prédio em que o boneco está dentro,
       pelo número de cada vértice) e passa de `uCorteY` some: o telhado,
       a laje e o alto da parede — de cima se vê a planta dos cômodos;
     - o que passa de `uCorteAcima` e está dentro do CONE da cabeça dele
       até a câmera (`uCorteR` de raio em cima da cabeça, fechando até a
       câmera: só o que fica na frente dele na tela) fica ralo, num
       pontilhado que some no meio (a copa, o beiral, o prédio alto do lado
       da câmera): vê-se através */
  /* - EMBAIXO DA RUA (no metrô), o que passa de `uSubY` dentro do
       retângulo `uSub` (a caixa da estação, com folga) some: a cidade em
       cima dela, o chão, o mezanino quando ele está na plataforma;
     - SEMPRE, o chão tem um buraco em cada POÇO do metrô (`uBuraco`): é
       por ali que a escada desce */
  const CORTE = {
    uCorte: { value: 0 }, uCorteId: { value: 0 }, uCorteY: { value: 0 }, uCorteR: { value: 1 }, uCorteAcima: { value: 0 },
    uCorteA: { value: new THREE.Vector3() }, uCorteB: { value: new THREE.Vector3() },
    uSub: { value: new THREE.Vector4() }, uSubY: { value: 1e9 },
    uBuraco: { value: [0, 1, 2, 3].map(() => new THREE.Vector4()) }, uNBuraco: { value: 0 }
  };
  const CORTE_GLSL = `uniform float uCorte, uCorteId, uCorteY, uCorteR, uCorteAcima, uSubY;
uniform vec3 uCorteA, uCorteB;
uniform vec4 uSub;
uniform vec4 uBuraco[ 4 ];
uniform int uNBuraco;
bool corteSub( vec3 p ) { return uCorte > 0.5 && p.y > uSubY && p.x > uSub.x && p.x < uSub.z && p.z > uSub.y && p.z < uSub.w; }
float corteBayer( vec2 a ) { a = floor( a ); return fract( a.x / 2.0 + a.y * a.y * 0.75 ); }
bool corteCone( vec3 p ) {
  if ( uCorte < 0.5 || p.y <= uCorteAcima ) return false;
  vec3 ab = uCorteB - uCorteA;
  float t = clamp( dot( p - uCorteA, ab ) / max( dot( ab, ab ), 1e-3 ), 0.0, 1.0 );
  float d = length( p - ( uCorteA + ab * t ) ), R = uCorteR * ( 1.0 - 0.85 * t );
  float k = 1.0 - smoothstep( R * 0.55, R, d );
  float limiar = corteBayer( 0.5 * gl_FragCoord.xy ) * 0.25 + corteBayer( gl_FragCoord.xy );
  return k * 0.92 > limiar;
}
bool noBuraco( vec3 p ) {
  for ( int i = 0; i < 4; i++ ) {
    if ( i >= uNBuraco ) break;
    vec4 b = uBuraco[ i ];
    if ( p.x > b.x && p.x < b.z && p.z > b.y && p.z < b.w ) return true;
  }
  return false;
}
`;
  matId.fragmentShader = matId.fragmentShader.replace('CORTE_GLSL', CORTE_GLSL);
  Object.assign(matId.uniforms, CORTE);
  function cortavel(mat, comId) {
    const antes = mat.onBeforeCompile;
    mat.onBeforeCompile = (sh, r) => {
      if (antes) antes.call(mat, sh, r);
      Object.assign(sh.uniforms, CORTE);
      sh.vertexShader = sh.vertexShader
        .replace('void main() {', `${comId ? 'attribute float idCoisa;' : ''}\nvarying vec3 vCorteP;\nvarying float vCorteId;\nvoid main() {`)
        .replace('#include <project_vertex>', `#include <project_vertex>\n  vCorteP = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;\n  vCorteId = ${comId ? 'idCoisa' : '0.0'};`);
      sh.fragmentShader = sh.fragmentShader.replace('void main() {', `${CORTE_GLSL}
varying vec3 vCorteP;
varying float vCorteId;
void main() {
  if ( corteSub( vCorteP ) || corteCone( vCorteP ) ) discard;
  if ( uCorte > 0.5 && uCorteId > 0.5 && abs( vCorteId - uCorteId ) < 0.5 && vCorteP.y > uCorteY ) discard;`);
    };
    const chave = mat.customProgramCacheKey && mat.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey ? mat.customProgramCacheKey() : '';
    mat.customProgramCacheKey = () => chave + '|corte' + (comId ? 1 : 0);
    return mat;
  }

  /* a cor do material entra no vértice (em linear, como o three.js
     guarda), multiplicada pela do vértice quando ele tem */
  const matsDoForno = new Map();
  function chaveDoMaterial(m) {
    const mapa = m.map;
    if (mapa && mapa.isCanvasTexture && mapa.wrapS !== THREE.RepeatWrapping) return 'decal';
    return [mapa ? 'map:' + (mapa.userData.src || mapa.uuid) : 'cor', m.side, m.transparent ? 1 : 0, m.transparent ? m.opacity : 1,
            m.alphaTest || 0, m.depthWrite ? 1 : 0, m.flatShading ? 1 : 0, m.alphaToCoverage ? 1 : 0].join('|');
  }
  function materialDoForno(chave, m) {
    if (matsDoForno.has(chave)) return matsDoForno.get(chave);
    const mat = cortavel(new THREE.MeshLambertMaterial({
      map: m.map || null, vertexColors: true, side: m.side, transparent: m.transparent, opacity: m.transparent ? m.opacity : 1,
      alphaTest: m.alphaTest || 0, depthWrite: m.depthWrite, flatShading: !!m.flatShading, alphaToCoverage: !!m.alphaToCoverage }), true);
    matsDoForno.set(chave, mat);
    return mat;
  }

  /* AS FOLHAS DE DECALQUE: cada canvas de texto vira um quadro numa folha
     de 2048 px, em prateleiras; a malha do decalque aponta pro quadro */
  function FolhasDeDecalque(escala) {
    const folhas = [], quadros = [];
    let atual = null;
    function nova() {
      const cv = document.createElement('canvas'); cv.width = cv.height = FOLHA_DECAL;
      const f = { cv, c: cv.getContext('2d'), x: VAO_DECAL, y: VAO_DECAL, alt: 0, tex: null, i: folhas.length };
      folhas.push(f); atual = f; return f;
    }
    function lugar(fonte) {
      const w = Math.max(8, Math.round(fonte.width * escala)), h = Math.max(8, Math.round(fonte.height * escala));
      let f = atual || nova();
      if (f.x + w + VAO_DECAL > FOLHA_DECAL) { f.x = VAO_DECAL; f.y += f.alt + VAO_DECAL; f.alt = 0; }
      if (f.y + h + VAO_DECAL > FOLHA_DECAL) f = nova();
      const q = { f, x: f.x, y: f.y, w, h, fonte };
      f.x += w + VAO_DECAL; f.alt = Math.max(f.alt, h);
      f.c.drawImage(fonte, q.x, q.y, w, h);
      quadros.push(q);
      return q;
    }
    function texturas() {
      for (const f of folhas) {
        if (f.tex) { f.tex.needsUpdate = true; continue; }
        const t = new THREE.CanvasTexture(f.cv);
        t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
        f.tex = t;
      }
    }
    /* O ESCUDO QUE CHEGA DEPOIS: o PNG do escudo repinta o canvas dele
       quando carrega; a folha copia de novo. Na última cópia (`final`),
       depois de subir pra placa de vídeo, o canvas da folha e os dos
       decalques saem da memória */
    function recopiar(final) {
      for (const q of quadros) { q.f.c.clearRect(q.x, q.y, q.w, q.h); q.f.c.drawImage(q.fonte, q.x, q.y, q.w, q.h); }
      for (const f of folhas) if (f.tex) {
        if (final) f.tex.onUpdate = () => { f.cv.width = f.cv.height = 1; f.tex.onUpdate = null; };
        f.tex.needsUpdate = true;
      }
      if (final) quadros.length = 0;
    }
    function jogarFora() { for (const f of folhas) { if (f.tex) f.tex.dispose(); f.cv.width = f.cv.height = 1; } }
    return { lugar, texturas, recopiar, jogarFora, folhas };
  }

  function Forno(ar, escalaDecal, grade, sub, piso) {
    const LADO = BLOCO_M * M;
    const nx = Math.max(1, Math.ceil((ar.x1 - ar.x0) / LADO)), nz = Math.max(1, Math.ceil((ar.y1 - ar.y0) / LADO));
    const baldes = new Map(), decal = FolhasDeDecalque(escalaDecal), lista = [null], vivos = [];
    const v = new THREE.Vector3(), n3 = new THREE.Matrix3(), cor = new THREE.Color();
    let triangulos = 0, malhas = 0;
    /* uma malha montada vira pedaço de balde: posição no mundo, normal,
       uv e cor por vértice (sem índice) */
    function pedaco(malha) {
      const m = Array.isArray(malha.material) ? malha.material[0] : malha.material;
      if (!m || !malha.geometry || !malha.geometry.attributes.position) return null;
      let chave = chaveDoMaterial(m);
      const g = malha.geometry;
      if (!g.attributes.normal) g.computeVertexNormals();
      const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv, col = g.attributes.color, idx = g.index;
      const n = idx ? idx.count : pos.count;
      if (!n) return null;
      const mw = malha.matrixWorld;
      n3.getNormalMatrix(mw);
      const P3 = new Float32Array(n * 3), N3 = new Int8Array(n * 3), C3 = new Uint8Array(n * 3);
      const temMapa = !!m.map, U2 = temMapa ? new Float32Array(n * 2) : null;
      const usaVC = !!m.vertexColors && !!col;
      const mc = m.color || cor.setRGB(1, 1, 1);
      let q = null;
      if (chave === 'decal') {
        q = decal.lugar(m.map.image);
        chave = 'decal|' + q.f.i;
      }
      for (let k = 0; k < n; k++) {
        const i = idx ? idx.getX(k) : k;
        v.fromBufferAttribute(pos, i).applyMatrix4(mw);
        P3[3 * k] = v.x; P3[3 * k + 1] = v.y; P3[3 * k + 2] = v.z;
        v.fromBufferAttribute(nor, i).applyMatrix3(n3).normalize();
        N3[3 * k] = Math.round(v.x * 127); N3[3 * k + 1] = Math.round(v.y * 127); N3[3 * k + 2] = Math.round(v.z * 127);
        let r = mc.r, gg = mc.g, b = mc.b;
        if (usaVC) { r *= col.getX(i); gg *= col.getY(i); b *= col.getZ(i); }
        C3[3 * k] = Math.round(clamp(r, 0, 1) * 255); C3[3 * k + 1] = Math.round(clamp(gg, 0, 1) * 255); C3[3 * k + 2] = Math.round(clamp(b, 0, 1) * 255);
        if (U2) {
          let u = uv ? uv.getX(i) : 0, w = uv ? uv.getY(i) : 0;
          if (q) {
            /* o quadro na folha (o canvas da folha sobe com flipY, como o do decalque) */
            u = (q.x + u * q.w) / FOLHA_DECAL;
            w = 1 - (q.y + (1 - w) * q.h) / FOLHA_DECAL;
          }
          U2[2 * k] = u; U2[2 * k + 1] = w;
        }
      }
      return { chave, m, P3, N3, C3, U2, n };
    }
    /* ASSAR uma coisa: as malhas dela, no bloco do meio dela (e, na grade
       do passo, o que barra o corpo e, se é prédio, o telhado dela) */
    function assar(grupo, it, tipo) {
      grupo.updateMatrixWorld(true);
      const pedacos = [];
      /* a folha da porta que abre e fecha fica viva (não junta nem risca: o
         cenário gira ela e bate nela na hora) */
      grupo.traverse(o => { if (o.isMesh && o.userData.porta) vivos.push(o); else if (o.isMesh && o.visible) { const p = pedaco(o); if (p) pedacos.push(p); } });
      /* a caixa da coisa inteira: o bloco dela e o contorno da seleção */
      let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
      for (const p of pedacos) for (let k = 0; k < p.n; k++) {
        const x = p.P3[3 * k], y = p.P3[3 * k + 1], z = p.P3[3 * k + 2];
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z;
      }
      /* o que a coisa trouxe e é só dela (o decalque, a geometria) sai */
      grupo.traverse(o => {
        if (o.userData.porta) return;
        if (o.geometry) o.geometry.dispose();
        if (o.material && o.material.map && o.material.map.isCanvasTexture && o.material.map.wrapS !== THREE.RepeatWrapping) { o.material.map.dispose(); o.material.dispose(); }
      });
      if (!pedacos.length) return;
      let id = 0;
      if (it) { id = lista.length; lista.push({ it, caixa: [x0, Math.max(0, y0), z0, x1, Math.max(y1, 4), z1] }); }
      for (const p of pedacos) p.id = id;
      if (grade) { const teto = PREDIOS.has(tipo) ? id : 0; for (const p of pedacos) grade.assar(p.P3, p.n, teto); }
      /* a estação do metrô vai inteira pro subsolo (onde o boneco desce);
         o resto deixa o chão dele no piso da rua */
      if (sub && tipo === 'metro') for (const p of pedacos) sub.juntar(p.P3, p.n);
      else if (piso) for (const p of pedacos) piso.juntar(p.P3, p.n);
      const i = clamp(Math.floor(((x0 + x1) / 2 - ar.x0) / LADO), 0, nx - 1), j = clamp(Math.floor(((z0 + z1) / 2 - ar.y0) / LADO), 0, nz - 1);
      for (const p of pedacos) {
        const k = i + ',' + j + '|' + p.chave;
        let b = baldes.get(k);
        if (!b) baldes.set(k, b = { chave: p.chave, m: p.m, partes: [], n: 0, i, j });
        b.partes.push(p); b.n += p.n;
        triangulos += p.n / 3;
      }
      malhas += pedacos.length;
    }
    /* TIRAR DO FORNO: cada balde vira uma malha */
    function tirar() {
      decal.texturas();
      const grupo = new THREE.Group(), matsDecal = new Map();
      for (const b of baldes.values()) {
        let mat;
        if (b.chave.startsWith('decal|')) {
          const f = decal.folhas[+b.chave.slice(6)];
          if (!matsDecal.has(f)) {
            const md = cortavel(new THREE.MeshLambertMaterial({ map: f.tex, alphaTest: 0.35, side: THREE.DoubleSide,
              vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }), true);
            md.userData.doMapa = true;
            matsDecal.set(f, md);
          }
          mat = matsDecal.get(f);
        } else mat = materialDoForno(b.chave, b.m);
        const temUV = !!b.partes[0].U2;
        const P3 = new Float32Array(b.n * 3), N3 = new Int8Array(b.n * 3), C3 = new Uint8Array(b.n * 3), U2 = temUV ? new Float32Array(b.n * 2) : null;
        const ID = new Float32Array(b.n);
        let o = 0;
        for (const p of b.partes) {
          P3.set(p.P3, o * 3); N3.set(p.N3, o * 3); C3.set(p.C3, o * 3); if (U2) U2.set(p.U2, o * 2);
          if (p.id) ID.fill(p.id, o, o + p.n);
          o += p.n;
        }
        b.partes = null;
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(P3, 3));
        g.setAttribute('normal', new THREE.BufferAttribute(N3, 3, true));
        g.setAttribute('color', new THREE.BufferAttribute(C3, 3, true));
        if (U2) g.setAttribute('uv', new THREE.BufferAttribute(U2, 2));
        g.setAttribute('idCoisa', new THREE.BufferAttribute(ID, 1));
        g.computeBoundingSphere(); g.computeBoundingBox();
        /* depois de subir pra placa de vídeo, a cópia daqui sai */
        for (const a of Object.values(g.attributes)) a.onUpload(function () { this.array = null; });
        const malha = new THREE.Mesh(g, mat);
        malha.matrixAutoUpdate = false;
        grupo.add(malha);
      }
      baldes.clear();
      return grupo;
    }
    return { assar, tirar, decal, vivos, coisas: lista, get triangulos() { return triangulos; }, get malhas() { return malhas; } };
  }

  /* ======================================================
     O CHÃO: o desenho da planta em ladrilhos
     ====================================================== */
  let grao = null;
  function texturaDoGrao() {
    if (grao) return grao;
    /* o grão: manchas miúdas claras e escuras, que emendam na borda (a
       conta do chao3d.js do jogo, sem o relevo); de longe o mipmap o
       reduz à média e ele some */
    const T = 256, cv = document.createElement('canvas'); cv.width = cv.height = T;
    const c = cv.getContext('2d');
    c.fillStyle = '#808080'; c.fillRect(0, 0, T, T);
    let s = 91331;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (const [n, r0, r1, a] of [[40, 18, 44, 0.10], [260, 4, 10, 0.16], [1400, 0.8, 2.2, 0.22]])
      for (let i = 0; i < n; i++) {
        const x = rnd() * T, y = rnd() * T, r = r0 + rnd() * (r1 - r0);
        c.globalAlpha = a; c.fillStyle = rnd() < 0.5 ? '#ffffff' : '#000000';
        for (const dx of [-T, 0, T]) for (const dy of [-T, 0, T]) { c.beginPath(); c.arc(x + dx, y + dy, r, 0, 7); c.fill(); }
      }
    grao = new THREE.CanvasTexture(cv);
    grao.wrapS = grao.wrapT = THREE.RepeatWrapping; grao.colorSpace = THREE.NoColorSpace; grao.anisotropy = 4;
    return grao;
  }
  /* O CAPIM DE PERTO: o chão pintado tem 3 a 8 pixels por metro, e o mato
     de perto sai borrado. Onde é mato (a MÁSCARA do mato, a mesma com
     que o mato3d planta, um pixel por metro), o chão ganha este ladrilho
     de 1,6 m — o fiapo do capim em cinza, que só clareia e escurece a
     cor pintada — em duas escalas, pra não se ver a repetição */
  let capim = null;
  function texturaDoCapim() {
    if (capim) return capim;
    const T = 256, cv = document.createElement('canvas'); cv.width = cv.height = T;
    const c = cv.getContext('2d');
    c.fillStyle = '#808080'; c.fillRect(0, 0, T, T);
    let s = 60493;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 2600; i++) {
      const x = rnd() * T, y = rnd() * T, a = rnd() * Math.PI * 2, l = 3 + rnd() * 7, v = rnd() < 0.55 ? 40 + rnd() * 50 : 175 + rnd() * 50;
      c.strokeStyle = `rgb(${v},${v},${v})`; c.lineWidth = 0.8 + rnd() * 0.9; c.globalAlpha = 0.5 + rnd() * 0.4;
      for (const dx of [-T, 0, T]) for (const dy of [-T, 0, T]) {
        c.beginPath(); c.moveTo(x + dx, y + dy); c.quadraticCurveTo(x + dx + Math.cos(a) * l * 0.5 + 1.5, y + dy + Math.sin(a) * l * 0.5, x + dx + Math.cos(a) * l, y + dy + Math.sin(a) * l); c.stroke();
      }
    }
    c.globalAlpha = 1;
    capim = new THREE.CanvasTexture(cv);
    capim.wrapS = capim.wrapT = THREE.RepeatWrapping; capim.colorSpace = THREE.NoColorSpace; capim.anisotropy = 4;
    return capim;
  }
  const MATO_U = { uCapim: { value: null }, uCapimEscala: { value: 1 / (1.6 * M) }, uMatoM: { value: null }, uMatoC: { value: new THREE.Vector4(0, 0, 1, 1) }, uMatoK: { value: 0 } };
  function materialDoChao(tex, metros) {
    const m = new THREE.MeshLambertMaterial({ map: tex });
    if (!MATO_U.uCapim.value) MATO_U.uCapim.value = texturaDoCapim();
    if (!MATO_U.uMatoM.value) { MATO_U.uMatoM.value = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); MATO_U.uMatoM.value.needsUpdate = true; }
    const u = { uGrao: { value: texturaDoGrao() }, uEscala: { value: metros / 3.2 } };
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u, CORTE, MATO_U);
      /* o buraco do poço do metrô e, com ele embaixo da rua, o corte */
      sh.vertexShader = sh.vertexShader
        .replace('void main() {', 'varying vec3 vChaoP;\nvoid main() {')
        .replace('#include <project_vertex>', '#include <project_vertex>\n  vChaoP = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('void main() {', `uniform sampler2D uGrao, uCapim, uMatoM; uniform float uEscala, uCapimEscala, uMatoK; uniform vec4 uMatoC;\n${CORTE_GLSL}\nvarying vec3 vChaoP;\nvoid main() {\n  if ( noBuraco( vChaoP ) || corteSub( vChaoP ) || corteCone( vChaoP ) ) discard;`)
        .replace('#include <map_fragment>', `#include <map_fragment>
  {
    float gA = texture2D( uGrao, vMapUv * uEscala ).r, gB = texture2D( uGrao, vMapUv * uEscala * 0.21 + 0.37 ).r;
    diffuseColor.rgb *= 1.0 + ( gA * 0.62 + gB * 0.38 - 0.5 ) * 0.55;
    float mato = uMatoK * texture2D( uMatoM, clamp( ( vChaoP.xz - uMatoC.xy ) / uMatoC.zw, 0.0, 1.0 ) ).r;
    if ( mato > 0.01 ) {
      float cA = texture2D( uCapim, vChaoP.xz * uCapimEscala ).r, cB = texture2D( uCapim, vChaoP.xz * uCapimEscala * 0.43 + 0.29 ).r;
      diffuseColor.rgb *= 1.0 + ( cA * 0.6 + cB * 0.4 - 0.5 ) * 0.85 * mato;
    }
  }`);
    };
    m.customProgramCacheKey = () => 'chao-grao-poco-capim';
    return m;
  }
  /* uma textura do canvas (e o canvas volta pra ser pintado de novo) */
  async function texturaDoCanvas(cv) {
    if (window.createImageBitmap) {
      try {
        const bm = await createImageBitmap(cv);
        const t = new THREE.Texture(bm);
        t.flipY = false; t.needsUpdate = true;
        /* a imagem sai da memória depois de subir */
        t.onUpdate = () => { if (t.image && t.image.close) { t.image.close(); } };
        return t;
      } catch (e) { /* cai no canvas */ }
    }
    const c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height;
    c2.getContext('2d').drawImage(cv, 0, 0);
    const t = new THREE.CanvasTexture(c2); t.flipY = false;
    return t;
  }
  async function montarChao(ar, grupo, avisar, vivo) {
    const pxm = QUALIDADES[qualidade].pxm, s = pxm / M, lado = PX_CHAO / s;
    const nx = Math.ceil((ar.x1 - ar.x0) / lado), nz = Math.ceil((ar.y1 - ar.y0) / lado);
    const W = PX_CHAO + 2 * SOBRA;
    const cv = document.createElement('canvas'); cv.width = cv.height = W;
    const c2 = cv.getContext('2d');
    const aniso = Math.min(8, rend.capabilities.getMaxAnisotropy());
    const u0 = SOBRA / W, u1 = (SOBRA + PX_CHAO) / W;
    let feitos = 0;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      if (!vivo()) return;
      const x0 = ar.x0 + i * lado, y0 = ar.y0 + j * lado;
      P.pintarChao(c2, x0 - SOBRA / s, y0 - SOBRA / s, s);
      const tex = await texturaDoCanvas(cv);
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = aniso;
      tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true;
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      const g = new THREE.BufferGeometry(), x1 = Math.min(x0 + lado, ar.x1), y1 = Math.min(y0 + lado, ar.y1);
      const uX = u0 + (u1 - u0) * (x1 - x0) / lado, uY = u0 + (u1 - u0) * (y1 - y0) / lado;
      g.setAttribute('position', new THREE.Float32BufferAttribute([x0, 0, y0, x0, 0, y1, x1, 0, y1, x1, 0, y0], 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute([u0, u0, u0, uY, uX, uY, uX, u0], 2));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      const m = new THREE.Mesh(g, materialDoChao(tex, lado / M));
      m.position.y = -0.3; m.name = 'chao';
      m.updateMatrix(); m.matrixAutoUpdate = false;
      grupo.add(m);
      avisar(++feitos / (nx * nz));
      await espera();
    }
  }
  /* O CHÃO DE LONGE: pra lá da área pintada, até o horizonte, em quatro
     faixas em volta dela, que NÃO se sobrepõem (plano embaixo de plano,
     de longe, briga pela profundidade e sai listrado — era o "mato dentro
     do mar"). Todas na altura do chão pintado:
     - o MATO é o próprio ladrilho do mato da planta (a copa da mata, o
       capim do cerrado: 2.400 unidades que repetem sem emenda), com a uv
       no mundo — emenda com o chão pintado, que tem o mesmo ladrilho;
     - na praça de praia, a costa segue reta pra lá das pontas (como na
       planta): ao norte e ao sul, o mato, a FAIXA DA PRAIA (um pedaço da
       própria praia pintada pela planta — a areia, a areia molhada, a
       espuma, o raso e a onda — repetido ao longo da costa) e o mar; a
       leste, só o mar, na cor do mar da planta. */
  function chaoDeLonge(ar, grupo) {
    const G = 400000, T = 2400, Y = -0.3;
    const quad = (x0, x1, z0, z1, mat, uv) => {
      if (x1 - x0 < 1 || z1 - z0 < 1) return;
      const g = new THREE.BufferGeometry(), c = [[x0, z0], [x0, z1], [x1, z1], [x1, z0]];
      g.setAttribute('position', new THREE.Float32BufferAttribute(c.flatMap(([x, z]) => [x, Y, z]), 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(c.flatMap(([x, z]) => uv(x, z)), 2));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      const m = new THREE.Mesh(g, mat); m.name = 'longe'; m.frustumCulled = false;
      grupo.add(m);
    };
    const material = (cv, repete) => {
      const tex = new THREE.CanvasTexture(cv);
      tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      tex.wrapS = repete ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping; tex.wrapT = THREE.RepeatWrapping;
      const m = new THREE.MeshLambertMaterial({ map: tex });
      m.userData.doMapa = true;
      return m;
    };
    /* o ladrilho do mato, pintado longe da cidade, num múltiplo de T */
    const cvM = document.createElement('canvas'); cvM.width = cvM.height = 512;
    P.pintarChao(cvM.getContext('2d'), Math.floor((ar.x0 - 4 * T) / T) * T, Math.floor((ar.y0 - 4 * T) / T) * T, 512 / T);
    const mato = material(cvM, true), uvMundo = (x, z) => [x / T, z / T];
    /* o mato de longe com o mesmo grão e o mesmo capim do chão pintado
       (sem eles, a borda da área pintada aparecia, andando perto dela) */
    mato.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, { uGrao: { value: texturaDoGrao() }, uEscala: { value: T / M / 3.2 } }, MATO_U);
      sh.vertexShader = sh.vertexShader
        .replace('void main() {', 'varying vec3 vLongeP;\nvoid main() {')
        .replace('#include <project_vertex>', '#include <project_vertex>\n  vLongeP = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('void main() {', 'uniform sampler2D uGrao, uCapim; uniform float uEscala, uCapimEscala;\nvarying vec3 vLongeP;\nvoid main() {')
        .replace('#include <map_fragment>', `#include <map_fragment>
  {
    float gA = texture2D( uGrao, vMapUv * uEscala ).r, gB = texture2D( uGrao, vMapUv * uEscala * 0.21 + 0.37 ).r;
    diffuseColor.rgb *= 1.0 + ( gA * 0.62 + gB * 0.38 - 0.5 ) * 0.55;
    float cA = texture2D( uCapim, vLongeP.xz * uCapimEscala ).r, cB = texture2D( uCapim, vLongeP.xz * uCapimEscala * 0.43 + 0.29 ).r;
    diffuseColor.rgb *= 1.0 + ( cA * 0.6 + cB * 0.4 - 0.5 ) * 0.85;
  }`);
    };
    mato.customProgramCacheKey = () => 'longe-mato-capim';
    const costa = P.costa && P.costa();
    quad(ar.x0 - G, ar.x0, ar.y0, ar.y1, mato, uvMundo);                      // oeste
    if (!costa) {
      quad(ar.x1, ar.x1 + G, ar.y0, ar.y1, mato, uvMundo);                    // leste
      quad(ar.x0 - G, ar.x1 + G, ar.y0 - G, ar.y0, mato, uvMundo);            // norte
      quad(ar.x0 - G, ar.x1 + G, ar.y1, ar.y1 + G, mato, uvMundo);            // sul
      return;
    }
    /* a faixa da praia: 124 m da praia pintada logo pra lá da ponta, da
       beira de terra da areia até 25 m mar adentro */
    let corMar = null;
    const faixa = (zBorda, sentido) => {
      const xa = costa.areia(zBorda), xw = costa.agua(zBorda), x1 = xw + 25 * M;
      const s = 0.3, L = T, cv = document.createElement('canvas');
      cv.width = Math.max(8, Math.ceil((x1 - xa) * s)); cv.height = Math.ceil(L * s);
      const c2 = cv.getContext('2d', { willReadFrequently: true });
      const z0 = sentido < 0 ? zBorda - L : zBorda;
      P.pintarChao(c2, xa, z0, s);
      if (!corMar) { const d = c2.getImageData(cv.width - 2, 2, 1, 1).data; corMar = new THREE.Color().setRGB(d[0] / 255, d[1] / 255, d[2] / 255, THREE.SRGBColorSpace); }
      return { xa, x1, z0, L, mat: material(cv, false) };
    };
    const norte = faixa(ar.y0, -1), sul = faixa(ar.y1, 1);
    const mar = new THREE.MeshLambertMaterial({ color: corMar }); mar.userData.doMapa = true;
    const nada = () => [0, 0];
    quad(ar.x1, ar.x1 + G, ar.y0, ar.y1, mar, nada);                          // leste: o mar
    for (const [f, z0, z1] of [[norte, ar.y0 - G, ar.y0], [sul, ar.y1, ar.y1 + G]]) {
      quad(ar.x0 - G, f.xa, z0, z1, mato, uvMundo);
      quad(f.xa, f.x1, z0, z1, f.mat, (x, z) => [(x - f.xa) / (f.x1 - f.xa), (z - f.z0) / f.L]);
      quad(f.x1, ar.x1 + G, z0, z1, mar, nada);
    }
  }

  /* ======================================================
     O MATO: onde o desenho é mato, o mato3d.js do jogo
     ====================================================== */
  function montarMatoDoMapa(ar, grupo, grade) {
    const m1 = 1 / M;                                   // metro por unidade
    const W = Math.ceil((ar.x1 - ar.x0) * m1), H = Math.ceil((ar.y1 - ar.y0) * m1);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c2 = cv.getContext('2d', { willReadFrequently: true });
    P.pintarChao(c2, ar.x0, ar.y0, 1 / M, true);
    const px = c2.getImageData(0, 0, W, H).data;
    /* a máscara vai pro chão: o capim de perto só onde é mato */
    const dados = new Uint8Array(W * H);
    for (let k = 0; k < W * H; k++) dados[k] = px[k * 4] > 200 && px[k * 4 + 1] < 60 && px[k * 4 + 2] > 200 ? 255 : 0;
    if (MATO_U.uMatoM.value) MATO_U.uMatoM.value.dispose();
    const tm = new THREE.DataTexture(dados, W, H, THREE.RedFormat, THREE.UnsignedByteType);
    tm.magFilter = tm.minFilter = THREE.LinearFilter; tm.unpackAlignment = 1; tm.needsUpdate = true;
    MATO_U.uMatoM.value = tm;
    MATO_U.uMatoC.value.set(ar.x0, ar.y0, W * M, H * M);
    MATO_U.uMatoK.value = 1;
    /* e o boneco não entra no mato: a célula cujo meio é mato na máscara
       (a de beira de pixel, meio mato meio calçada, não é) */
    if (grade) grade.mato((x, z) => {
      const i = Math.floor((x - ar.x0) * m1), j = Math.floor((z - ar.y0) * m1);
      return i >= 0 && j >= 0 && i < W && j < H && dados[j * W + i] === 255;
    });
    const magenta = (x, y) => {
      const i = Math.floor(x), j = Math.floor(y);
      if (i < 0 || j < 0 || i >= W || j >= H) return false;
      const k = (j * W + i) * 4;
      return px[k] > 200 && px[k + 1] < 60 && px[k + 2] > 200;
    };
    /* longe da beira do que não é mato: 2 m pros quatro lados; e a BEIRA
       do mato (LIMPO_M, rente à cidade, à estrada e à favela) fica só com
       a vegetação rasteira do chão — a árvore começa depois dela */
    const ox = ar.x0 * m1, oz = ar.y0 * m1;
    const dentro = (x, z) => {
      const a = x - ox, b = z - oz;
      if (!(magenta(a, b) && magenta(a - 2, b) && magenta(a + 2, b) && magenta(a, b - 2) && magenta(a, b + 2))) return false;
      for (let k = 0; k < 8; k++) if (!magenta(a + LIMPO_M * Math.cos(k * Math.PI / 4), b + LIMPO_M * Math.sin(k * Math.PI / 4))) return false;
      return true;
    };
    /* PRA LÁ DO CHÃO PINTADO, um anel de ANEL_M metros com metade das
       árvores, pra borda do mato não sair reta; no litoral, só do lado de
       terra da linha d'água */
    const ANEL_M = 110, costa = P.costa && P.costa();
    const fora = (x, z) => {
      if (costa) {
        const X = x * M, Z = z * M, lim = Z < ar.y0 ? costa.areia(ar.y0) : Z > ar.y1 ? costa.areia(ar.y1) : ar.x1;
        if (X > Math.min(lim, ar.x1) - 8 * M) return false;
      }
      const h = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
      return h - Math.floor(h) < 0.5;
    };
    const pode = (x, z) => (x >= ox && x < ox + W && z >= oz && z < oz + H) ? dentro(x, z) : fora(x, z);
    const lugar = P.vegetacao();
    const arvores = plantarMato({ x0: ox - ANEL_M, x1: ox + W + ANEL_M, z0: oz - ANEL_M, z1: oz + H + ANEL_M, lugar, semente: 7, pode });
    const lads = montarMato(arvores, { lado: BLOCO_M });
    let tri = 0;
    for (const t of lads) {
      const perto = malhaLowpoly(t.perto.lowpoly), longe = malhaLowpoly(t.longe.lowpoly);
      if (!perto || !longe) continue;
      /* o tronco (e o galho baixo) barra o corpo */
      if (grade) for (const b of t.perto.lowpoly) grade.assar(b.pos, b.pos.length / 3, 0);
      const lod = new THREE.LOD(), cx = t.cx * M, cz = t.cz * M;
      lod.position.set(cx, 0, cz);
      for (const m of [perto, longe]) { m.position.set(-cx, 0, -cz); m.updateMatrix(); m.matrixAutoUpdate = false; }
      /* a distância é do meio do bloco: meia diagonal a mais */
      lod.addLevel(perto, 0); lod.addLevel(longe, (LONGE_M + BLOCO_M * 0.7) * M);
      grupo.add(lod);
      tri += t.triLonge;
    }
    return { arvores: arvores.length, tri };
  }
  const matLowpoly = cortavel(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side: THREE.DoubleSide }), false);
  function malhaLowpoly(blocos) {
    if (!blocos || !blocos.length) return null;
    let n = 0;
    for (const b of blocos) n += b.pos.length;
    const pos = new Float32Array(n), cor = new Float32Array(n);
    let o = 0;
    for (const b of blocos) { pos.set(b.pos, o); cor.set(b.cor, o); o += b.pos.length; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(cor, 3));
    g.computeVertexNormals(); g.computeBoundingSphere();
    return new THREE.Mesh(g, matLowpoly);
  }

  /* ======================================================
     MONTAR A PRAÇA
     ====================================================== */
  let vez = 0, montado = null, numeros = null, montando = false;
  const carga = $('.cen-carga'), cargaTxt = $('.cen-carga-txt'), cargaBarra = $('.cen-barra i');
  function aviso(txt, f) { cargaTxt.textContent = txt; cargaBarra.style.width = Math.round(clamp(f, 0, 1) * 100) + '%'; }
  function jogarForaOMapa() {
    MATO_U.uMatoK.value = 0;
    cena.remove(doMapa);
    doMapa.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && o.name === 'chao') { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
      else if (o.material && o.material.userData.doMapa) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
    });
    if (montado && montado.decal) montado.decal.jogarFora();
    doMapa = new THREE.Group(); cena.add(doMapa);
    coisas = [null]; fecharFicha();
    portas = [];
  }
  /* MONTAR: a praça inteira; a montagem que chega depois cancela a de
     antes (`vivo`), e o erro aparece na caixa em vez de travar a tela */
  async function montar(nome, modo) {
    const minha = ++vez, vivo = () => minha === vez;
    montando = true;
    try { await montarPraca(nome, modo, vivo); }
    catch (e) { console.error('cenário:', e); if (vivo()) { carga.hidden = false; aviso('Não deu pra montar ' + nome + ': ' + e.message, 1); } }
    finally {
      if (vivo()) {
        montando = false; medidor.desde = 0; $('.cen-bt-ape').disabled = !grade; pedir();
        /* quem estava a pé (a troca de qualidade remonta) volta pro mesmo lugar */
        if (voltarAPe) { const v = voltarAPe; voltarAPe = null; entrarAPe(v); }
      }
    }
  }
  async function montarPraca(nome, modo, vivo) {
    raiz.querySelector('.cen-escolha').hidden = true;
    carga.hidden = false;
    aviso('Abrindo ' + nome + '…', 0);
    await espera();
    P.irPara(nome, modo);
    atualizarTopo();
    const t0 = agora();
    sairDaRua(false);
    grade = null; sub = null; piso = null; CORTE.uNBuraco.value = 0;
    $('.cen-bt-ape').disabled = true;
    jogarForaOMapa();
    area = P.areaDoCenario();
    enquadrarCidade(true);
    /* 1. o chão */
    const grupoChao = new THREE.Group(); doMapa.add(grupoChao);
    await montarChao(area, grupoChao, f => aviso('Pintando o chão…', f * 0.25), vivo);
    if (!vivo()) return;
    chaoDeLonge(area, grupoChao);
    pedir();
    /* 2. as coisas, no forno (e a estação do metrô também no subsolo) */
    const gradeNova = GradeDoPasso(area, M), pisoNovo = PisoDaRua(area.x0, area.y0, area.x1, area.y1, M);
    const estacoes = P.metro ? P.metro() : [], subNovo = estacoes.length ? Subsolo(M, estacoes) : null;
    const pecas = P.pecas(), forno = Forno(area, QUALIDADES[qualidade].decal, gradeNova, subNovo, pisoNovo), porTipo = {};
    let i = 0, tFatia = agora();
    for (const pc of pecas) {
      const g = new THREE.Group();
      try { pc.montar(g); } catch (e) { console.error('cenário: não montei', pc.tipo, e); }
      forno.assar(g, pc.it, pc.tipo);
      porTipo[pc.tipo] = (porTipo[pc.tipo] || 0) + 1;
      i++;
      if (agora() - tFatia > 40) {
        aviso(`Montando a cidade… ${milhar(i)} de ${milhar(pecas.length)}`, 0.25 + 0.6 * i / pecas.length);
        await espera();
        if (!vivo()) return;
        tFatia = agora();
      }
    }
    aviso('Juntando as malhas…', 0.86);
    await espera();
    if (!vivo()) return;
    const tri = forno.triangulos, nMalhas = forno.malhas;
    const cidade3d = forno.tirar();
    doMapa.add(cidade3d);
    montarPortas(forno.vivos);
    coisas = forno.coisas;
    /* 3. o mato em volta */
    aviso('Plantando o mato…', 0.92);
    await espera();
    if (!vivo()) return;
    const grupoMato = new THREE.Group(); doMapa.add(grupoMato);
    const mato = montarMatoDoMapa(area, grupoMato, gradeNova);
    /* a água entra por último na grade do passo */
    const tGrade = agora();
    gradeNova.agua(P.costa && P.costa(), P.lagoa && P.lagoa());
    pisoNovo.fechar();
    /* O METRÔ: o poço de cada estação é buraco no chão (e o boneco não
       nasce nele), o subsolo fecha, e a terra em volta da estação fica
       pronta pra quando ele descer */
    const tSub = agora();
    if (subNovo) {
      subNovo.fechar();
      estacoes.slice(0, 4).forEach((e, k) => { CORTE.uBuraco.value[k].set(e.poco.x0, e.poco.z0, e.poco.x1, e.poco.z1); gradeNova.bloquear(e.poco); });
      CORTE.uNBuraco.value = Math.min(4, estacoes.length);
      for (const e of estacoes) doMapa.add(terraDaEstacao(e));
    }
    grade = gradeNova; sub = subNovo; piso = pisoNovo;
    montado = { nome, decal: forno.decal };
    numeros = { tri, nMalhas, chamadas: cidade3d.children.length, pecas: pecas.length, porTipo, mato, segundos: (agora() - t0) / 1000,
                folhas: forno.decal.folhas.length, area: { ...area }, grade: Object.assign(grade.conta(), { msAgua: Math.round(tSub - tGrade), piso: piso.n }),
                subsolo: sub ? { estacoes: estacoes.length, triangulos: sub.n, ms: Math.round(agora() - tSub) } : null };
    /* o escudo em PNG chega depois: a folha copia de novo */
    setTimeout(() => { if (vivo()) { forno.decal.recopiar(); pedir(); } }, 700);
    setTimeout(() => { if (vivo()) { forno.decal.recopiar(true); pedir(); } }, 2500);
    carga.hidden = true;
    if (window.__cenarioPronto) window.__cenarioPronto(numeros);
  }

  /* A TERRA em volta da estação: uma caixa marrom do tamanho do corte,
     vista de dentro (o chão dela e as paredes do lado de lá). Na rua ela
     fica embaixo do chão (só aparece pelo poço, no fundo da escada); com
     ele no metrô, a cidade em cima some e a estação aparece dentro dela.
     Ela não é cortada: a parede dela sobe até a rua e fecha a borda do
     corte (sem ela, entre o chão cortado e o resto via-se o céu) */
  const matTerra = new THREE.MeshLambertMaterial({ color: '#4d3d2e', side: THREE.BackSide });
  function terraDaEstacao(e) {
    const c = e.caixa, f = SUB_FOLGA * M, y0 = TERRA_M * M, y1 = -0.5;
    const m = new THREE.Mesh(new THREE.BoxGeometry(c.x1 - c.x0 + 2 * f, y1 - y0, c.z1 - c.z0 + 2 * f), matTerra);
    m.position.set((c.x0 + c.x1) / 2, (y0 + y1) / 2, (c.z0 + c.z1) / 2);
    m.name = 'terra'; m.updateMatrix(); m.matrixAutoUpdate = false;
    return m;
  }

  /* a cidade inteira na tela, de três quartos */
  function enquadrarCidade(ja) {
    const L = P.limite(), r = Math.hypot(L.x1 - L.x0, L.y1 - L.y0) / 2;
    const d = r / Math.sin(THREE.MathUtils.degToRad(cam.fov / 2)) * 0.92, az = -0.5;
    /* o alvo um pouco pra lá do meio: a cidade desce na tela e sai de
       baixo da barra de cima */
    const cx = (L.x0 + L.x1) / 2 - Math.sin(az) * d * 0.035, cz = (L.y0 + L.y1) / 2 - Math.cos(az) * d * 0.035;
    if (ja) { orb.alvo.set(cx, 0, cz); orb.dist = d; orb.el = 0.72; orb.az = az; pedir(); }
    else voarPara(cx, cz, d, 0.72, az);
  }
  function nivelDaRua() {
    /* desce onde a câmera está olhando, de frente pra rua */
    voarPara(orb.alvo.x, orb.alvo.z, 14 * M, 0.07, orb.az);
  }

  /* ======================================================
     O TOPO E OS NÚMEROS
     ====================================================== */
  function atualizarTopo() {
    const nome = P.cidade(), modo = P.modo();
    selCidade.value = nome;
    const doPorteDela = P.mapaDoPorte(nome);
    for (const b of raiz.querySelectorAll('.cen-mapas button')) {
      b.setAttribute('aria-selected', String(b.dataset.mapa === modo));
      b.classList.toggle('porte', b.dataset.mapa === doPorteDela);
      b.title = b.dataset.mapa === doPorteDela ? 'O mapa do porte desta praça' : 'Pra comparar: a praça num mapa de outro porte';
    }
    $('.cen-nome h1').textContent = nome;
    $('.cen-resumo').textContent = P.resumo();
    /* o endereço abre de novo nesta praça (e neste mapa, se não é o do porte) */
    try {
      const q = new URLSearchParams(location.search);
      for (const k of ['cenario', 'cidade', 'mapa']) q.delete(k);
      const resto = q.toString();
      history.replaceState(null, '', location.pathname + '?cenario&cidade=' + encodeURIComponent(nome) +
        (modo !== doPorteDela ? '&mapa=' + modo : '') + (resto ? '&' + resto : '') + location.hash);
    } catch (e) {}
  }
  let ultimaConta = 0;
  function contar() {
    if (!numeros) return;
    const t = agora();
    if (t - ultimaConta < 500) return;
    ultimaConta = t;
    $('.cen-num').textContent = `${milhar(numeros.pecas)} peças · ${milhar(numeros.tri + numeros.mato.tri)} triângulos na cena · montado em ${numeros.segundos.toFixed(1).replace('.', ',')} s`;
  }

  /* ======================================================
     A PÉ: o boneco do jogo, na rua
     ------------------------------------------------------
     O boneco é o do jogo (js/bonecos3.js, o modelo do Blender), com o
     mesmo andar e o mesmo correr, na camisa de uma torcida da praça. Ele
     só carrega quando alguém entra a pé: o modelo tem 2,7 MB. Anda contra
     os riscos da grade do passo (não atravessa parede, muro, móvel,
     carro, poste, tronco nem água), e a câmera o segue DE CIMA, quase a
     pino, com o norte pra cima: arrastar gira, a roda e a pinça mudam
     quanto cabe na tela. O joystick (o círculo embaixo à esquerda) anda
     pra onde o pino aponta na tela; na borda, corre. O que fica entre a
     câmera e ele some (O CORTE), e o prédio em que ele entra perde o
     telhado. NO METRÔ ele desce a escada (ou a rolante) do poço, passa a
     catraca e desce pra plataforma: o pé tem altura (`ape.y`), e embaixo
     da rua quem diz onde ele pisa é o SUBSOLO; a câmera desce junto, e a
     cidade em cima da estação some (a caixa dela, do teto do nível em que
     ele está pra cima), com a terra em volta.
     ====================================================== */
  const toque = matchMedia('(pointer: coarse)').matches;
  raiz.classList.toggle('toque', toque);
  const selCamisa = $('.cen-camisa');
  let grade = null, sub = null, piso = null, ape = null, povo = null, chamando = null, eu = null, jogo = null, voltarAPe = null;
  /* o penteado sai da semente (o modelo leve não tem boné nem bandana) */
  const CABELOS = ['curto', 'raspado', 'degrade', 'black', 'cacheado', 'topete', 'franja', 'entradas', 'moicano', 'comprido', 'rabo', 'coque', 'careca'];
  /* a camisa é lembrada pela torcida (o id; 'nenhuma' é o "Sem torcida"), não pela posição na lista */
  let semente = 1 + Math.floor(Math.random() * 997), torcidas = [], camisa = 0, camisaId = null;
  function carregarScript(src) {
    return new Promise((ok, falhou) => {
      const s = document.createElement('script');
      s.src = src; s.onload = () => ok(); s.onerror = () => falhou(new Error('não carregou ' + src));
      document.head.appendChild(s);
    });
  }
  /* o módulo do boneco e o modelo (em base64, dados/boneco_glb.js: o
     carregador do jogo lê dali sem pedir arquivo nenhum), uma vez só */
  function chamarBoneco() {
    if (!chamando) chamando = (async () => {
      const TO = window.TO || (window.TO = { dados: {} });
      TO.dados = TO.dados || {}; TO.diaJogo = TO.diaJogo || {};
      if (!TO.dados.bonecoGLB) await carregarScript(new URL('../dados/boneco_glb.js', import.meta.url).href);
      const mod = await import('./bonecos3.js');
      /* a câmera chega a um metro dele: a malha afina menos que no jogo */
      mod.cfg.afinarCelulas = 72;
      /* o líder sai com 1,1 × 0,86 da escala: aqui, 1,75 m. O lugar dele
         tem altura: a do pé que se vê (no metrô, embaixo da rua) */
      const PE = { x: 0, y: 0, z: 0 };
      povo = mod.entrarEm(cena, { escala: 1 / (1.1 * 0.86), pos: (x, y) => { PE.x = x; PE.y = ape ? ape.yv : 0; PE.z = y; return PE; } });
      return povo;
    })().catch(e => { chamando = null; throw e; });
    return chamando;
  }
  /* o disco do boneco (o que o jogo passa por quadro): a camisa, a
     semente do rosto e o lugar */
  function vestir() {
    const t = torcidas[camisa] || null;
    eu = { nome: 'na rua ' + semente, spawn: 'cenario', lado: 'mandante', lider: true, vivo: true,
           torcida: t ? t.nome : 'sem torcida', cor: t ? t.cor : '#E8E4DC', cor2: t ? t.cor2 : '#3A3A3A', cor3: t ? t.cor3 : null,
           cabecaForcada: CABELOS[semente % CABELOS.length],
           x: ape ? ape.x : 0, y: ape ? ape.z : 0, rumo: ape ? ape.rumo : 0, passada: 1,
           derrubado: 0, golpe: 0, apanhou: 0, atordoado: 0, esquivou: 0, tremor: 0, defendendo: 0, hostil: 0,
           inimigoPerto: 0, chamou: -99, linha: 'frente' };
    /* um jogo novo a cada roupa: a paleta do calção é por jogo */
    jogo = { t: jogo ? jogo.t : 0, discos: [eu], policiais: [], projeteis: [], grades: [], paz: true };
    window.TO.diaJogo.J = jogo;
    const tem = !!(t && t.porta);
    $('.cen-bt-sede').disabled = !tem;
    $('.cen-bt-sede').title = tem ? 'Leva o boneco pra calçada na frente da sede da ' + t.nome : 'Esta torcida não tem sede nesta praça';
    pedir();
  }
  function encherCamisas() {
    torcidas = P.torcidas ? P.torcidas() : [];
    selCamisa.innerHTML = torcidas.map((t, i) => `<option value="${i}">${esc(t.nome)}${t.porta ? '' : ' (sem sede)'}</option>`).join('') +
      `<option value="${torcidas.length}">Sem torcida</option>`;
    /* a de antes, se é desta praça; senão, a maior com sede */
    const antes = camisaId === 'nenhuma' ? torcidas.length : torcidas.findIndex(t => t.id === camisaId);
    camisa = antes >= 0 ? antes : Math.max(0, torcidas.findIndex(t => t.porta));
    selCamisa.value = String(camisa);
  }
  /* o chão da rua em (x, z) pra quem está com o pé em `yPe`: o do piso da
     rua (a laje da calçada, 7 cm; o piso da sede) ou o da estação do
     metrô (a praça da entrada fica 8 cm acima da rua) */
  function naRua(x, z, yPe = 0) {
    if (!sub || !sub.estacaoEm(x, z)) return piso ? piso.chao(x, z, yPe) : 0;
    const y = sub.chao(x, z, 0);
    return y === y ? y : 0;
  }
  /* ======================================================
     AS PORTAS DA SEDE: abrem e fecham no F
     ------------------------------------------------------
     A folha de cada porta da sede (a de madeira das salas, as duas de
     vidro do portão) vem da planta numa malha só dela, com a origem na
     dobradiça, FECHADA — o forno não junta ela com o resto. A pé, o F
     (ou o botão "Abrir a porta", que aparece do lado oposto ao joystick
     quando tem porta ao alcance) abre a mais perto, em meio segundo, e
     fecha de novo; as duas do portão andam juntas. O corpo bate na folha
     onde ela estiver (o risco dela gira junto), e a folha não fecha em
     cima do boneco.
     ====================================================== */
  let portas = [];
  const PORTA_ALCANCE_M = 1.2, PORTA_VEL = 3.2;              // m da borda do corpo até a folha; rad/s
  const matPorta = new Map();
  function montarPortas(vivos) {
    portas = [];
    for (const m of vivos) {
      const d = m.userData.porta;
      if (!matPorta.has(m.material)) matPorta.set(m.material, cortavel(m.material.clone(), false));
      m.material = matPorta.get(m.material);
      m.rotation.y = 0; m.updateMatrix();
      doMapa.add(m);
      portas.push({ m, hx: d.hx, hz: d.hz, larg: d.larg, dir: d.dir, ang: d.ang, grupo: d.grupo, vidro: d.vidro, a: 0, alvo: 0 });
    }
  }
  /* a ponta da folha com o giro `a` (o do three.js em y) */
  const pontaDa = (p, a) => {
    const c = Math.cos(a), s = Math.sin(a);
    return [p.hx + p.larg * (p.dir[0] * c + p.dir[1] * s), p.hz + p.larg * (-p.dir[0] * s + p.dir[1] * c)];
  };
  const PQ = [0, 0];
  const maisPertoNa = (ax, az, bx, bz, x, z) => {
    const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
    const t = L2 > 0 ? clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1) : 0;
    PQ[0] = ax + dx * t; PQ[1] = az + dz * t;
    return PQ;
  };
  const longe = (p, x, z, r) => Math.abs(x - p.hx) > p.larg + r + 2 || Math.abs(z - p.hz) > p.larg + r + 2;
  function empurrarPortas(c, r) {
    for (const p of portas) {
      if (longe(p, c.x, c.z, r)) continue;
      const [bx, bz] = pontaDa(p, p.a), [qx, qz] = maisPertoNa(p.hx, p.hz, bx, bz, c.x, c.z);
      const dx = c.x - qx, dz = c.z - qz, d = Math.hypot(dx, dz);
      if (d >= r) continue;
      if (d > 1e-6) { c.x = qx + dx / d * r; c.z = qz + dz / d * r; }
      else { const ex = bx - p.hx, ez = bz - p.hz, L = Math.hypot(ex, ez) || 1; c.x += -ez / L * r; c.z += ex / L * r; }
    }
  }
  function cabePortas(x, z, r) {
    for (const p of portas) {
      if (longe(p, x, z, r)) continue;
      const [bx, bz] = pontaDa(p, p.a), [qx, qz] = maisPertoNa(p.hx, p.hz, bx, bz, x, z);
      if ((qx - x) ** 2 + (qz - z) ** 2 < r * r) return false;
    }
    return true;
  }
  /* a porta ao alcance do boneco (a mais perto) */
  function portaPerto() {
    if (!ape || ape.y < -0.5 * M) return null;
    let melhor = null, md = PORTA_ALCANCE_M * M;
    for (const p of portas) {
      if (longe(p, ape.x, ape.z, md)) continue;
      const [bx, bz] = pontaDa(p, p.a), [qx, qz] = maisPertoNa(p.hx, p.hz, bx, bz, ape.x, ape.z);
      const d = Math.hypot(ape.x - qx, ape.z - qz) - APE.raio * M;
      if (d < md) { md = d; melhor = p; }
    }
    return melhor;
  }
  /* ABRIR OU FECHAR a porta mais perto (e a irmã do portão); a folha não
     fecha se o boneco está no caminho dela */
  function alternarPorta() {
    const p = portaPerto();
    if (!p) return false;
    const abrir = p.alvo === 0, grupo = portas.filter(q => q.grupo === p.grupo), r = APE.raio * M;
    if (!abrir) for (const q of grupo) for (let k = 0; k <= 8; k++) {
      const a = q.a * k / 8, [bx, bz] = pontaDa(q, a), [qx, qz] = maisPertoNa(q.hx, q.hz, bx, bz, ape.x, ape.z);
      if ((qx - ape.x) ** 2 + (qz - ape.z) ** 2 < r * r) return false;
    }
    for (const q of grupo) q.alvo = abrir ? q.ang : 0;
    pedir();
    return true;
  }
  const btPorta = $('.cen-bt-porta');
  btPorta.addEventListener('click', ev => { ev.stopPropagation(); alternarPorta(); atualizarBotaoPorta(); devolverTeclado(); });
  let portaVista = undefined;
  function atualizarBotaoPorta() {
    const p = portaPerto();
    const rot = p ? (p.alvo === 0 ? 'Abrir' : 'Fechar') + (p.vidro ? ' o portão' : ' a porta') : null;
    if (rot === portaVista) return;
    portaVista = rot;
    btPorta.hidden = !rot;
    if (rot) btPorta.innerHTML = rot + ' <kbd>F</kbd>';
  }
  /* a folha gira até onde deve estar */
  function animarPortas(dt) {
    for (const p of portas) {
      if (p.a === p.alvo) continue;
      const passo = PORTA_VEL * dt, d = p.alvo - p.a;
      p.a = Math.abs(d) <= passo ? p.alvo : p.a + Math.sign(d) * passo;
      /* a folha que abre em cima do boneco o empurra */
      if (ape) { const c = { x: ape.x, z: ape.z }; empurrarPortas(c, APE.raio * M); if (grade.cabe(c.x, c.z, APE.raio * M * 0.97)) { ape.x = c.x; ape.z = c.z; } }
      p.m.rotation.y = p.a;
      p.m.updateMatrix();
    }
    if (ape) atualizarBotaoPorta();
    else if (!btPorta.hidden) { btPorta.hidden = true; portaVista = null; }
  }
  /* ENTRAR A PÉ: onde a câmera olha (ou `onde`), no lugar alcançável mais
     perto em que o corpo cabe; `onde` com `y` embaixo da rua (a troca de
     qualidade no metrô) volta pro mesmo degrau */
  async function entrarAPe(onde) {
    if (ape || montando || !grade) return false;
    const bt = $('.cen-bt-ape');
    bt.disabled = true;
    try {
      /* no meio da rua, se der: primeiro onde sobra 3 m pra todo lado */
      const alvo = onde || { x: orb.alvo.x, z: orb.alvo.z };
      const yEmbaixo = onde && onde.y < -0.05 * M && sub ? sub.chao(onde.x, onde.z, onde.y) : NaN;
      const lugar = () => yEmbaixo === yEmbaixo ? { x: onde.x, z: onde.z, y: yEmbaixo } : onde ? grade.perto(alvo.x, alvo.z, APE.raio * M, 60 * M)
        : grade.perto(alvo.x, alvo.z, 3 * M, 60 * M) || grade.perto(alvo.x, alvo.z, 1.5 * M, 150 * M) || grade.perto(alvo.x, alvo.z, APE.raio * M, 400 * M);
      if (!lugar()) throw new Error('não achei chão livre perto do meio da tela');
      if (!povo) {
        carga.hidden = false; aviso('Chamando o boneco…', 0.5);
        try { await chamarBoneco(); } finally { carga.hidden = true; }
      }
      /* a praça pode ter mudado enquanto ele carregava */
      if (ape || montando || !grade) return false;
      const p = lugar();
      if (!p) throw new Error('não achei chão livre perto do meio da tela');
      encherCamisas();
      /* de cima, a rua fica de pé ou deitada na tela: o giro da câmera vai
         pro quarto de volta mais perto (com a cidade inteira na tela, o
         norte pra cima, como na planta) */
      const quarto = Math.PI / 2, az = onde && onde.az != null ? onde.az : Math.round(orb.az / quarto) * quarto;
      const y = p.y != null ? p.y : naRua(p.x, p.z);
      ape = { x: p.x, z: p.z, y, yv: y, vx: 0, vz: 0, rumo: Math.atan2(-Math.sin(az), -Math.cos(az)), vao: (onde && onde.vao) || APE.vao, teto: 0, tetoAte: 0,
              chegada: 0, de: { x: orb.alvo.x, z: orb.alvo.z, dist: orb.dist, el: orb.el, az: orb.az }, para: { az } };
      vestir();
      cancelarVoo(); fecharFicha();
      raiz.classList.add('ape');
      tela.focus({ preventScroll: true });
      pedir();
      return true;
    } catch (e) {
      console.error('cenário, a pé:', e);
      carga.hidden = false; aviso('O boneco não veio: ' + e.message, 1);
      setTimeout(() => { if (!montando) carga.hidden = true; }, 3500);
      return false;
    } finally { bt.disabled = montando; }
  }
  /* SAIR DA RUA: o boneco sai da cena e a câmera sobe por cima de onde ele estava */
  function sairDaRua(voar = true) {
    if (!ape) return;
    const { x, z } = ape;
    ape = null;
    raiz.classList.remove('ape');
    for (const k of ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']) teclas.delete(k);
    soltarJoy();
    CORTE.uCorte.value = 0;
    if (povo && jogo) { jogo.discos = []; povo.atualizar(jogo, 0.016); }
    if (voar) { orb.alvo.set(x, 0, z); voarPara(x, z, 70 * M, 0.62, orb.az); }
    pedir();
  }
  /* LEVAR o boneco a um ponto (a porta da sede), com a câmera pulando por
     cima dos telhados até lá */
  function levarPara(x, z, az) {
    const p = grade && (grade.perto(x, z, 1.2 * M, 10 * M) || grade.perto(x, z, APE.raio * M, 80 * M));
    if (!ape || !p) return false;
    ape.de = { x: ape.x, z: ape.z, dist: orb.dist, el: orb.el, az: orb.az, pulo: true };
    ape.para = { az };
    ape.x = p.x; ape.z = p.z; ape.vx = ape.vz = 0; ape.chegada = 0;
    ape.y = ape.yv = naRua(p.x, p.z);
    ape.rumo = Math.atan2(-Math.sin(az), -Math.cos(az));
    if (eu) { eu.x = ape.x; eu.y = ape.z; }
    pedir();
    return true;
  }
  function irPraSede() {
    const t = torcidas[camisa];
    if (!t || !t.porta) return;
    /* de frente pra porta, com a câmera do lado da rua: de cima, a fachada
       da sede fica embaixo na tela, com o nome dela */
    const P0 = t.porta;
    levarPara(P0.x, P0.y, Math.atan2(P0.fx, P0.fy));
  }
  /* O PASSO: o corpo anda de 12 em 12 cm; o que bate num risco o empurra
     pra fora e ele desliza ao longo dele (passo.js). A água e a borda da
     área seguram: ali só anda o eixo que dá. Embaixo da rua (ou entrando
     no poço do metrô), o passo é o do SUBSOLO: o chão a um degrau do pé e
     a faixa do corpo contada dele */
  const corpo = { x: 0, z: 0, y: 0 };
  function mover(dx, dz) {
    const r = APE.raio * M, n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (0.12 * M)));
    const sx = dx / n, sz = dz / n, W = grade.paredes;
    const tenta = (ax, az) => {
      if (sub && (ape.y < -0.05 * M || sub.noPoco(ape.x + ax, ape.z + az))) {
        if (!sub.passo(corpo, ape.x, ape.z, ape.y, ax, az, r)) return false;
        ape.x = corpo.x; ape.z = corpo.z; ape.y = corpo.y;
        return true;
      }
      corpo.x = ape.x + ax; corpo.z = ape.z + az;
      W.empurrar(corpo, r);
      empurrarPortas(corpo, r);
      if (!grade.cabe(corpo.x, corpo.z, r * 0.97) || !cabePortas(corpo.x, corpo.z, r * 0.97)) return false;
      /* a rua o empurrou pra dentro do poço: lá o chão é o do subsolo */
      if (sub && sub.noPoco(corpo.x, corpo.z)) {
        const y = sub.chao(corpo.x, corpo.z, ape.y);
        if (y !== y || !sub.cabe(corpo.x, corpo.z, y, r * 0.97)) return false;
        ape.y = y;
      } else ape.y = naRua(corpo.x, corpo.z, ape.y);
      ape.x = corpo.x; ape.z = corpo.z;
      return true;
    };
    for (let i = 0; i < n; i++) {
      if (tenta(sx, sz) || tenta(sx, 0) || tenta(0, sz)) continue;
      ape.vx = ape.vz = 0;
      break;
    }
  }
  function andarAPe(dt) {
    const t = teclas;
    if (t.has('q')) orb.az += dt * 1.6;
    if (t.has('e')) orb.az -= dt * 1.6;
    if (t.has('r')) orb.el += dt * 0.8;
    if (t.has('t')) orb.el -= dt * 0.8;
    if (t.has('+') || t.has('=')) ape.vao = clamp(ape.vao * Math.exp(-dt * 1.6), 5, 80);
    if (t.has('-')) ape.vao = clamp(ape.vao * Math.exp(dt * 1.6), 5, 80);
    /* a chegada: a câmera desce de onde estava até em cima dele (ou pula
       por cima dos telhados, do lugar de antes pro novo) */
    if (ape.chegada < 1) {
      const de = ape.de, alvo = distDoVao(ape.vao), T = de.pulo ? 1.3 : 0.6 + 0.35 * Math.log10(Math.max(1, de.dist / alvo));
      ape.chegada = Math.min(1, ape.chegada + dt / T);
      const k = suave(ape.chegada), arco = de.pulo ? Math.sin(Math.PI * k) : 0;
      orb.dist = Math.exp(Math.log(de.dist) + (Math.log(alvo) - Math.log(de.dist)) * k) * (1 + 3 * arco);
      orb.el = de.el + (APE.el - de.el) * k;
      let da = ape.para.az - de.az; da = Math.atan2(Math.sin(da), Math.cos(da));
      orb.az = de.az + da * k;
    }
    /* pra onde: o joystick (na tela, pra cima é pra frente) ou o teclado */
    let frente, lado, forca = 1, corre;
    if (joy.ativo && joy.m > 0) { frente = -joy.y; lado = joy.x; forca = joy.m; corre = joy.borda; }
    else {
      frente = (t.has('w') || t.has('arrowup') ? 1 : 0) - (t.has('s') || t.has('arrowdown') ? 1 : 0);
      lado = (t.has('d') || t.has('arrowright') ? 1 : 0) - (t.has('a') || t.has('arrowleft') ? 1 : 0);
      corre = t.has('shift');
    }
    const fx = -Math.sin(orb.az), fz = -Math.cos(orb.az), rx = Math.cos(orb.az), rz = -Math.sin(orb.az);
    let dx = fx * frente + rx * lado, dz = fz * frente + rz * lado;
    const L = Math.hypot(dx, dz);
    if (L) { dx /= L; dz /= L; }
    const quer = L ? (corre ? APE.corre : APE.anda * forca) * M : 0;
    const k = Math.min(1, dt * (quer ? 7 : 10));
    ape.vx += (dx * quer - ape.vx) * k; ape.vz += (dz * quer - ape.vz) * k;
    const x0 = ape.x, z0 = ape.z;
    mover(ape.vx * dt, ape.vz * dt);
    if (L) ape.rumo = Math.atan2(dx, dz);
    const v = dt > 0 ? Math.hypot(ape.x - x0, ape.z - z0) / dt : 0;
    /* o pé que se vê (e a câmera) vai atrás do pé da conta, macio: na
       escada, o degrau de 17 cm não sacode a tela */
    ape.yv += (ape.y - ape.yv) * Math.min(1, dt * 12);
    /* o prédio em que ele está dentro (e ainda um instante depois de
       sair: na porta, o telhado não pisca); embaixo da rua, nenhum */
    const dentro = ape.y > -0.5 * M ? grade.dentroDe(ape.x, ape.z) : 0;
    if (dentro) { ape.teto = dentro; ape.tetoAte = agora() + 350; }
    else if (agora() > ape.tetoAte) ape.teto = 0;
    /* o boneco: o jogo lê o disco e faz o resto (o passo, o parado, a virada) */
    eu.x = ape.x; eu.y = ape.z; eu.rumo = ape.rumo;
    eu._cacando = corre && v > APE.anda * M * 1.25;
    eu.passada = eu._cacando ? 2.1 : 1.15;
    jogo.t += dt;
    povo.atualizar(jogo, dt);
  }
  /* O CORTE, a cada quadro: do alto da cabeça dele até a câmera (tudo
     contado do pé que se vê) */
  function atualizarCorte() {
    if (!ape) { CORTE.uCorte.value = 0; return; }
    const y = ape.yv;
    CORTE.uCorte.value = 1;
    CORTE.uCorteA.value.set(ape.x, y + 1.7 * M, ape.z);
    CORTE.uCorteB.value.copy(cam.position);
    CORTE.uCorteR.value = CORTE_M.raio * M;
    CORTE.uCorteAcima.value = y + CORTE_M.acima * M;
    CORTE.uCorteId.value = ape.chegada >= 1 ? ape.teto : 0;
    CORTE.uCorteY.value = y + CORTE_M.dentro * M;
    /* EMBAIXO DA RUA: a cidade em cima da estação some, do teto do nível
       dele pra cima (com a terra em volta) */
    const est = sub && ape.y < -1.2 * M ? sub.estacaoEm(ape.x, ape.z, SUB_FOLGA * M) : null;
    if (est) {
      const c = est.caixa, f = SUB_FOLGA * M;
      CORTE.uSub.value.set(c.x0 - f, c.z0 - f, c.x1 + f, c.z1 + f);
      CORTE.uSubY.value = alturaDoCorte(est.niveis, y / M) * M;
    } else CORTE.uSubY.value = 1e9;
  }
  /* A ALTURA DO CORTE embaixo da rua (m), pelo pé: descendo a escada da
     rua, o chão da cidade (e o que tem em cima) some logo que a cabeça
     chega nele; mais embaixo o corte desce com ele até o teto do mezanino;
     e da metade da escada da plataforma pra baixo (2 m abaixo do
     mezanino), o mezanino some também, do teto da plataforma pra cima */
  function alturaDoCorte(N, y) {
    if (y < N.mezanino - 2.0) return N.tetoPlataforma;
    return Math.max(N.tetoMezanino, Math.min(-0.05, y + 2.2));
  }
  /* depois de escolher, o teclado volta pro boneco (no seletor, o W e as
     setas trocariam a opção em vez de andar) */
  const devolverTeclado = () => { if (ape) tela.focus({ preventScroll: true }); };
  selCamisa.onchange = () => {
    camisa = +selCamisa.value;
    camisaId = torcidas[camisa] ? torcidas[camisa].id : 'nenhuma';
    if (ape) vestir();
    devolverTeclado();
  };
  /* O JOYSTICK: o pino segue o dedo (ou o mouse) dentro do círculo; a
     direção é a da tela (pra cima é pra frente), a força é o quanto ele
     saiu do meio (com uma folga no meio, pra o dedo parado não andar), e
     da borda pra fora ele corre */
  const joyEl = $('.cen-joy'), pino = $('.cen-joy-pino');
  const joy = { ativo: false, id: null, x: 0, y: 0, m: 0, borda: false };
  function mexerJoy(ev) {
    const r = joyEl.getBoundingClientRect(), R = r.width / 2, lim = R - 12;
    const ex = ev.clientX - (r.left + R), ey = ev.clientY - (r.top + R), d = Math.hypot(ex, ey);
    const f = Math.min(1, d / lim), k = d > lim ? lim / d : 1;
    pino.style.transform = `translate(${(ex * k).toFixed(1)}px, ${(ey * k).toFixed(1)}px)`;
    joy.x = d ? ex / d : 0; joy.y = d ? ey / d : 0;
    joy.m = f < 0.18 ? 0 : Math.min(1, (f - 0.18) / 0.7);
    joy.borda = f > 0.9;
    joyEl.classList.toggle('correndo', joy.borda);
  }
  function soltarJoy(ev) {
    if (ev && ev.pointerId !== joy.id) return;
    joy.ativo = false; joy.id = null; joy.x = joy.y = joy.m = 0; joy.borda = false;
    pino.style.transform = '';
    joyEl.classList.remove('ativo', 'correndo');
  }
  joyEl.addEventListener('pointerdown', ev => {
    ev.preventDefault(); ev.stopPropagation();
    if (!ape) return;
    try { joyEl.setPointerCapture(ev.pointerId); } catch (e) {}
    joy.ativo = true; joy.id = ev.pointerId;
    joyEl.classList.add('ativo');
    mexerJoy(ev); pedir();
  });
  joyEl.addEventListener('pointermove', ev => { if (joy.ativo && ev.pointerId === joy.id) { ev.preventDefault(); mexerJoy(ev); } });
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) joyEl.addEventListener(t, soltarJoy);
  joyEl.addEventListener('contextmenu', ev => ev.preventDefault());

  /* ======================================================
     OS BOTÕES
     ====================================================== */
  selCidade.onchange = () => montar(selCidade.value);
  for (const b of raiz.querySelectorAll('.cen-mapas button')) b.onclick = () => montar(P.cidade(), b.dataset.mapa);
  selQ.onchange = () => {
    qualidade = selQ.value;
    try { localStorage.setItem('cenario-qualidade', qualidade); } catch (e) {}
    ajustarTela();
    /* a pé: volta pro mesmo lugar, virado pro mesmo lado e com o mesmo
       zoom, depois de remontar */
    if (ape) voltarAPe = { x: ape.x, z: ape.z, y: ape.y, az: orb.az, vao: ape.vao };
    /* o chão muda de resolução: remonta a praça (o forno junta de novo) */
    if (montado) montar(P.cidade(), P.modo());
  };
  raiz.querySelector('.cen-topo').addEventListener('click', ev => {
    const b = ev.target.closest('button[data-acao]');
    if (!b) return;
    if (b.dataset.acao === 'cima') enquadrarCidade(false);
    else if (b.dataset.acao === 'rua') nivelDaRua();
    else if (b.dataset.acao === 'ape') entrarAPe();
    else if (b.dataset.acao === 'sair') sairDaRua();
    else if (b.dataset.acao === 'sede') { irPraSede(); devolverTeclado(); }
    else if (b.dataset.acao === 'rosto') { semente++; if (ape) vestir(); devolverTeclado(); }
    else if (b.dataset.acao === 'escolher') escolher();
    else if (b.dataset.acao === 'planta') fechar();
  });
  $('.cen-escolha').addEventListener('click', ev => {
    const b = ev.target.closest('button[data-cidade]');
    if (b) montar(b.dataset.cidade);
    else if (ev.target.closest('button[data-acao="voltar"]')) { $('.cen-escolha').hidden = true; pedir(); }
  });
  function escolher() {
    if (!$('.cen-escolha-miolo').childElementCount) montarEscolha();
    $('.cen-voltar').hidden = !montado;
    $('.cen-escolha').hidden = false;
    $('.cen-escolha').scrollTop = 0;
  }

  /* ======================================================
     ABRIR E FECHAR
     ====================================================== */
  function abrir(nome, modo) {
    raiz.hidden = false;
    medidor.desde = 0; ultimo = 0;
    document.documentElement.style.overflow = 'hidden';
    ajustarTela();
    /* sem praça: a lista pra escolher */
    if (!nome) { escolher(); return; }
    if (montado && montado.nome === nome && P.modo() === (modo || P.mapaDoPorte(nome)) && !montando) { atualizarTopo(); pedir(); return; }
    montar(nome, modo);
  }
  function fechar() {
    sairDaRua(false);
    raiz.hidden = true;
    document.documentElement.style.overflow = '';
    teclas.clear();
    try {
      const q = new URLSearchParams(location.search);
      q.delete('cenario'); q.delete('mapa');
      const resto = q.toString();
      history.replaceState(null, '', location.pathname + (resto ? '?' + resto : '') + location.hash);
    } catch (e) {}
    P.aoFechar && P.aoFechar();
  }
  /* a textura que chega depois (a folha do atlas) pede outro quadro */
  const gerente = THREE.DefaultLoadingManager, antesLoad = gerente.onLoad, antesProg = gerente.onProgress;
  gerente.onLoad = (...a) => { if (antesLoad) antesLoad(...a); pedir(); };
  gerente.onProgress = (...a) => { if (antesProg) antesProg(...a); pedir(); };

  return { abrir, fechar, get numeros() { return numeros; }, montar, orb, pedir, get aberto() { return !raiz.hidden; },
           /* pro teste: o que está no pixel (sx, sy) */
           pegarEm(sx, sy) { const c = pegar(sx, sy); return c ? { tipo: c.it.tipo, titulo: P.tituloDe(c.it) } : null; },
           /* pro teste: a câmera num lugar */
           olhar(x, z, dist, el, az) { cancelarVoo(); orb.alvo.set(x, 0, z); orb.dist = dist; orb.el = el; orb.az = az; pedir(); },
           /* pro teste: a pé */
           aPe: { entrar: entrarAPe, sair: sairDaRua, irPraSede, levar: levarPara,
                  /* pro teste: um passo de (dx, dz) metros, com a colisão de verdade */
                  mover(dx, dz) { if (!ape) return null; mover(dx * M, dz * M); ape.yv = ape.y; pedir(); return { x: ape.x, z: ape.z, y: ape.y / M }; },
                  get estado() { return ape && { x: ape.x, z: ape.z, y: ape.y / M, rumo: ape.rumo, v: Math.hypot(ape.vx, ape.vz), chegada: ape.chegada, az: orb.az, el: orb.el, vao: ape.vao, teto: ape.teto, subY: CORTE.uSubY.value / M, camisa: torcidas[camisa] && torcidas[camisa].nome }; },
                  get grade() { return grade; }, get sub() { return sub; }, get piso() { return piso; }, get povo() { return povo; },
                  porta: () => alternarPorta(), get portas() { return portas.map(p => ({ hx: p.hx, hz: p.hz, larg: p.larg, a: p.a, alvo: p.alvo, ang: p.ang, grupo: p.grupo, vidro: p.vidro })); },
                  perto: () => { const p = portaPerto(); return p && { hx: p.hx, hz: p.hz, grupo: p.grupo, alvo: p.alvo }; }, cabe: (x, z) => !!grade && grade.cabe(x, z, APE.raio * M) } };
}
