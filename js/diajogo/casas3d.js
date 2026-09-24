/* =========================================================
   AS CASAS DA CIDADE — cinco tipos que vestem os lotes
   ---------------------------------------------------------
   A planta sorteia LOTE (casa, sobrado, barraco da favela, comércio);
   quem diz com que cara ele sai é este arquivo, a partir de cinco
   modelos de referência:

     T1  a casa térrea de reboco branco encardido, telhado de duas
         águas com a calha na frente;
     T2  a casa de tijolo aparente sem reboco — embasamento de
         cimento, laje com a borda à mostra, o ferro de espera. A de
         dois andares é em L: o bloco do terraço na frente, o de dois
         andares recuado e a escada de alvenaria entre os dois;
     T3  a casa com PONTO COMERCIAL embaixo: porta de enrolar, a
         marquise, o letreiro da loja e o quadro de promoções; em cima,
         a janela de cortina. Só a frente é pintada — o lado é reboco
         cru, como em quase toda casa assim;
     T4  o sobrado de laje com as caixas d'água azuis em cima, a
         garagem de telhadinho com portão de ferro de lança e a grade
         preta nas janelas;
     T5  o casarão colonial: cunhal, cornija, guilhotina de moldura
         amarela, porta-janela em arco com a sacada de gradil.

   E a casa da FAVELA, da família do T2 e do T1: parede de tijolo, de
   reboco cru ou pintada (a planta diz qual), um a três andares, laje,
   telha ou fibrocimento.

   QUEM VIRA O QUÊ sai da POSIÇÃO do lote, não do `rng()` da planta:
   a cidade continua a mesma casa por casa, só muda a roupa. Galpão,
   muro e prédio continuam com o desenho antigo do bairro.

   TUDO CABE NO LOTE. Nada passa da divisa (telhado por cima da
   calçada é o que a varredura pega): quando o tipo tem beiral,
   marquise ou sacada na frente, a parede da frente RECUA o que eles
   avançam (`rec`), e o letreiro, a pixação e a falha de reboco do
   bairro vão pro plano dessa parede, não pro da divisa.
   ========================================================= */
import { Construtor, METRO, mureta } from './construtor3d.js';
import { ATLAS } from './modelos_atlas.js';

/* o arquivo de cada folha, pro bairro montar o material dele */
export const arquivoDaFolha = folha => ATLAS[folha].arquivo;

const M = METRO;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const INCL = Math.tan(24 * Math.PI / 180);

/* =======================================================
   O SORTEIO POR POSIÇÃO
   ======================================================= */
function hash(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h;
}
function sorteDe(l) {
  const base = Math.round(l.x0 !== undefined ? l.x0 : l.cx) + ',' + Math.round(l.y0 !== undefined ? l.y0 : l.cy);
  return k => (hash(base + ':' + k) % 100003) / 100003;
}
const escolher = (s, k, lista) => lista[Math.floor(s(k) * lista.length) % lista.length];

/* as tintas de cada tipo: o reboco da folha é claro e a tinta multiplica */
const TINTAS = {
  t1: ['#f2f1ec', '#ebe9e2', '#dfddd5', '#f4efe2', '#e6e2d9'],
  t3: ['#8a98d8', '#e3c35c', '#7fb27f', '#e39d7c', '#efe9dc', '#c47ea4', '#86c3cb', '#d9d57a'],
  t4: ['#2f5b40', '#8c4232', '#3f607c', '#cdb58c', '#6f6b94', '#9b8f3c', '#4f6f5a', '#b45a4a'],
  t5: ['#f4f4f0', '#f4f4f0', '#f1efe8', '#efd98a', '#b8cde6', '#eec3b8', '#cfe3c8']
};
const TELHA = { t1: ['#c98e7a', '#d69a84', '#bd8470', '#cf9c7c'],
                t5: ['#7a5a50', '#6c5048', '#846258'],
                fav: ['#ffffff', '#f0d8c8', '#e8c0a8', '#d8b0a0', '#f8e0c0', '#c89a88'] };
const FERRUGEM = '#4a3a30';
const BRANCO = '#f6f6f3';
const AZUL_COL = '#2447c4';

/* =======================================================
   O PLANO DA CASA: qual tipo, quanto recua, onde vai o letreiro
   ======================================================= */
function centroDoLote(l) {
  return l.x0 !== undefined ? [(l.x0 + l.x1) / 2, (l.y0 + l.y1) / 2] : [l.cx, l.cy];
}
/* o centro velho: a Praça da Matriz e a igreja. Sobrado ali é casarão. */
function pertoDoCentro(l, K) {
  const [x, y] = centroDoLote(l);
  const [cx, cy] = K && K.pxm ? K.pxm(568, 920) : [2151, 4480];
  return Math.hypot(x - cx, y - cy) < 1300;
}
function medidas(l) {
  if (l.ang) return [l.w / M, l.h / M];
  const nS = l.frente === 'n' || l.frente === 's';
  return [(nS ? l.x1 - l.x0 : l.y1 - l.y0) / M, (nS ? l.y1 - l.y0 : l.x1 - l.x0) / M];
}

export function planoDaCasa(l, K) {
  if (l._plano !== undefined) return l._plano;
  let p = null;
  /* o "galpão" da favela é casa com telha de fibrocimento, não galpão */
  if (l.tipo === 'casa' || l.tipo === 'sobrado' || l.tipo === 'barraco' || (l.favela && l.tipo === 'galpao')) {
    const s = sorteDe(l);
    const [W, D] = medidas(l);
    const H = l.alt / M;
    if (l.favela) {
      const andares = clamp(Math.round(H / 2.6), 1, 3);
      const telhado = l.tipo === 'barraco' ? 'laje' : l.tipo === 'galpao' ? 'fibro' : 'telha';
      p = { tipo: 'favela', andares, telhado, rec: telhado === 'laje' ? 0.03 : 0.18 };
    } else if (l.placa) {
      p = { tipo: 't3', andares: H >= 5 ? 2 : 1, rec: 0.6 };
    } else if (l.tipo === 'sobrado') {
      /* o sobrado do centro velho é casarão; fora dele, o de laje com
         caixa d'água e, um em quatro, o de tijolo com a escada por fora */
      p = s('colonial') < (pertoDoCentro(l, K) ? 0.6 : 0.12) ? { tipo: 't5', andares: 2, rec: 0.45 }
        : s('tijolo2') < 0.28 ? { tipo: 't2', andares: 2, rec: 0.06 } : { tipo: 't4', andares: 2, rec: 0.35 };
    } else {
      p = s('tijolo') < 0.22 ? { tipo: 't2', andares: 1, rec: 0.06 } : { tipo: 't1', andares: 1, rec: 0.32 };
    }
    Object.assign(p, { W, D, H, s });
    /* lote raso (o da avenida chega a 0,7 m de fundo) não aguenta
       marquise de 60 cm: o recuo nunca passa de um quarto do fundo */
    p.rec = Math.max(0.06, Math.min(p.rec, D * 0.25));
    if (p.tipo === 't3') {
      /* O LETREIRO, que o bairro desenha com o atlas dos dizeres: logo
         acima da porta de enrolar, embaixo da marquise. As medidas são
         as da regra antiga do bairro (em unidades de mundo). */
      const larg = Math.min(W * M - 12, 110), alt = Math.min(15, larg / 4.6);
      const terreo = p.andares === 2 ? 3.45 : clamp(H, 3.2, 4.2);
      p.porta = clamp(terreo - 0.2 - alt / M - 0.3, 1.9, 2.5);
      p.terreo = terreo;
      p.placa = { y: (p.porta + 0.1) * M + alt / 2, larg, alt };
    }
    /* falha de reboco só em parede de reboco */
    p.semManchas = p.tipo === 't2' || p.tipo === 't3' || (p.tipo === 'favela' && l.parede !== 'pintada');
  }
  l._plano = p;
  return p;
}

/* =======================================================
   O REFERENCIAL DO LOTE → MUNDO
   Em metros: x da esquerda pra direita de quem olha a fachada (0 a W),
   z = 0 na divisa da frente e negativo pra dentro do lote.
   ======================================================= */
function frameDoLote(l) {
  if (l.ang) {
    const c = Math.cos(l.ang), s = Math.sin(l.ang), vf = l.vf || -1;
    const nx = -s * vf, nz = c * vf;
    return { fx: l.cx + nx * l.h / 2, fz: l.cy + nz * l.h / 2, rx: nz, rz: -nx, nx, nz };
  }
  const f = l.frente, mx = (l.x0 + l.x1) / 2, mz = (l.y0 + l.y1) / 2;
  if (f === 'n') return { fx: mx, fz: l.y0, rx: -1, rz: 0, nx: 0, nz: -1 };
  if (f === 's') return { fx: mx, fz: l.y1, rx: 1, rz: 0, nx: 0, nz: 1 };
  if (f === 'o') return { fx: l.x0, fz: mz, rx: 0, rz: 1, nx: -1, nz: 0 };
  return { fx: l.x1, fz: mz, rx: 0, rz: -1, nx: 1, nz: 0 };
}

/* =======================================================
   AS PEÇAS DE FACHADA: largura e onde começam e acabam na parede
   ======================================================= */
const PECA = {
  porta_vene:  { w: 0.85, b0: 0, b1: 2.1 },
  porta_ferro: { w: 0.85, b0: 0, b1: 2.1 },
  porta_alu:   { w: 0.85, b0: 0, b1: 2.1 },
  porta_ap:    { w: 0.85, b0: 0, b1: 2.2 },
  jan2:        { w: 1.2, b0: 1.0, b1: 2.1 },
  basc:        { w: 0.6, b0: 1.5, b1: 2.1 },
  jan_vidro:   { w: 0.8, b0: 1.3, b1: 2.0 },
  veneziana:   { w: 1.0, b0: 0.95, b1: 2.1 },
  jan_grade:   { w: 1.3, b0: 1.0, b1: 2.0 },
  jan_cortina: { w: 1.4, b0: 0.9, b1: 2.1 },
  jan_peq:     { w: 0.7, b0: 1.3, b1: 2.1 },
  col_janela:  { w: 1.0, b0: 0.9, b1: 2.4 },
  col_porta:   { w: 1.2, b0: 0.12, b1: 2.72 },
  col_arco:    { w: 1.0, b0: 0.2, b1: 2.75 },
  promocoes:   { w: 0.75, b0: 0.9, b1: 2.0 }
};
const E_PORTA = k => k.startsWith('porta') || k === 'col_porta' || k.startsWith('enrolar');

/* distribui as peças por igual numa parede de largura `larg`. Se não
   cabem, as do FIM da lista saem — por isso a porta vem primeiro. */
function distribuir(larg, nomes, fundo, margem0 = 0.22) {
  const lista = nomes.slice();
  while (lista.length) {
    const tot = lista.reduce((a, k) => a + PECA[k].w, 0);
    /* parede estreita (a casa de 2 m da favela) aperta a margem e o
       vão entre as peças antes de desistir da janela */
    let margem = margem0, vao = (larg - 2 * margem - tot) / (lista.length + 1);
    if (vao < 0.16 && lista.length > 1) { margem = Math.min(margem0, 0.1); vao = (larg - 2 * margem - tot) / (lista.length + 1); }
    if (vao >= (margem < margem0 ? 0.08 : 0.16) || lista.length === 1) {
      const out = [];
      let a = margem + Math.max(0, vao);
      for (const k of lista) {
        const pc = PECA[k], w = Math.min(pc.w, Math.max(0.3, larg - 2 * margem));
        out.push({ a0: a, a1: a + w, b0: pc.b0, b1: pc.b1, k, fundo });
        a += w + Math.max(0, vao);
      }
      return out;
    }
    lista.pop();
  }
  return [];
}
const espelhar = (vaos, larg) => vaos.map(v => Object.assign({}, v, { a0: larg - v.a1, a1: larg - v.a0 }));
const subir = (vaos, dy) => vaos.map(v => Object.assign({}, v, { b0: v.b0 + dy, b1: v.b1 + dy }));

/* as quatro paredes de uma caixa. `spec[face] = { k, tinta, vaos }`;
   o que tem vão na FRENTE conta pra auditoria de porta e janela */
function paredes(B, x0, x1, z0, z1, y0, y1, spec, conta) {
  const h = y1 - y0;
  const faces = {
    frente: [B.plano([x0, y0, z1], [1, 0, 0], [0, 1, 0]), x1 - x0],
    dir:    [B.plano([x1, y0, z1], [0, 0, -1], [0, 1, 0]), z1 - z0],
    tras:   [B.plano([x1, y0, z0], [-1, 0, 0], [0, 1, 0]), x1 - x0],
    esq:    [B.plano([x0, y0, z0], [0, 0, 1], [0, 1, 0]), z1 - z0]
  };
  for (const nome of ['frente', 'dir', 'tras', 'esq']) {
    const sp = spec[nome];
    if (!sp) continue;
    const [F, larg] = faces[nome];
    if (larg <= 0.01 || h <= 0.01) continue;
    const vaos = (sp.vaos || []).filter(v => v.a0 >= -1e-6 && v.a1 <= larg + 1e-6 && v.b1 <= h + 1e-6);
    B.fachada(F, larg, h, sp.k, vaos, { tinta: sp.tinta === undefined ? null : sp.tinta });
    if (conta && nome === 'frente') {
      for (const v of vaos) { if (E_PORTA(v.k)) conta.portas++; else conta.janelas++; }
      /* a parede da frente fica registrada, com os vãos: é nela que o
         bairro procura lugar pro letreiro, a pixação e a falha de reboco */
      conta.frentes.push({ x0, x1, y0, y1, z: z1,
        vaos: vaos.map(v => ({ a0: x0 + v.a0, a1: x0 + v.a1, b0: y0 + v.b0, b1: y0 + v.b1, k: v.k, fundo: v.fundo || 0 })) });
    }
    if (conta && nome !== 'frente') conta.janelasLado += vaos.length;
  }
}
/* a faixa horizontal saltada (borda de laje, friso, cornija) na frente
   e nos lados de uma caixa */
function faixa(B, x0, x1, z0, z1, y0, y1, sai, k, tinta, lados = true) {
  /* pra frente ela sai o que pediu (o recuo da parede garante a
     divisa); pro lado e pro fundo, no máximo os 4 cm que sobram entre
     a parede e a divisa — ali já é o vizinho */
  const sl = lados ? Math.min(sai, 0.04) : 0;
  const X0 = x0 - sl, X1 = x1 + sl, Z0 = z0 - sl, Z1 = z1 + sai;
  B.caixa(X0, X1, y0, y1, Z0, Z1, { todas: { k, tinta }, topo: null, base: null });
  /* em cima e embaixo só o LÁBIO aparece (o miolo fica dentro da casa):
     um anel de tiras esticadas, em vez da tampa inteira ladrilhada com
     a peça de 30 cm — era de onde saía metade dos triângulos da casa */
  const tiras = [[X0, X1, z1, Z1]];
  if (sl > 0) tiras.push([X0, X1, Z0, z0], [X0, x0, z0, z1], [x1, X1, z0, z1]);
  for (const [y, emBaixo] of [[y1, false], [y0, true]]) {
    if (emBaixo && y0 <= 0.001) continue;             // no chão ninguém vê
    const F = emBaixo ? B.plano([0, y, 0], [1, 0, 0], [0, 0, 1]) : B.plano([0, y, 0], [1, 0, 0], [0, 0, -1]);
    for (const [a0, a1, c0, c1] of tiras)
      if (a1 - a0 > 1e-4 && c1 - c0 > 1e-4)
        B.esticar(F, a0, a1, emBaixo ? c0 : -c1, emBaixo ? c1 : -c0, k, { tinta, escuro: emBaixo ? 0.7 : 1 });
  }
}

/* TELHADO DE DUAS ÁGUAS com a cumeeira paralela à rua. As paredes vão
   de z0 (fundo) a z1 (frente) e acabam em `h`; o beiral da frente vai
   até `zf` e o de trás até `zb`, com a mesma inclinação. Devolve a
   altura da cumeeira — a empena dos lados é de quem chama. */
function telhado2(B, x0, x1, z0, z1, zf, zb, h, tinta, calha) {
  const zm = (z0 + z1) / 2, yr = h + (z1 - zm) * INCL;
  const yf = h - (zf - z1) * INCL, yb = h - (z0 - zb) * INCL;
  const Vf = [0, yr - yf, zm - zf], Lf = Math.hypot(Vf[1], Vf[2]);
  const Vb = [0, yr - yb, zm - zb], Lb = Math.hypot(Vb[1], Vb[2]);
  B.ladrilhar(B.plano([x0, yf, zf], [1, 0, 0], [0, Vf[1] / Lf, Vf[2] / Lf]), B.ret(0, x1 - x0, 0, Lf), 'telha', { tinta });
  B.ladrilhar(B.plano([x1, yb, zb], [-1, 0, 0], [0, Vb[1] / Lb, Vb[2] / Lb]), B.ret(0, x1 - x0, 0, Lb), 'telha', { tinta });
  B.pintar(tinta);
  B.viga([x0, yr, zm], [x1, yr, zm], 0.24, 0.12, 'telha');
  B.pintar(null);
  if (calha) B.caixa(x0, x1, yf - 0.13, yf + 0.01, zf - 0.1, zf, { todas: 'calha' });
  return yr;
}
/* a empena de um lado (o triângulo acima da parede, até a cumeeira) */
function empenas(B, x0, x1, z0, z1, h, yr, k, tinta) {
  const d = z1 - z0;
  const tri = [[0, h], [d, h], [d / 2, yr]];
  B.ladrilhar(B.plano([x1, 0, z1], [0, 0, -1], [0, 1, 0]), tri, k, { tinta });
  B.ladrilhar(B.plano([x0, 0, z0], [0, 0, 1], [0, 1, 0]), tri, k, { tinta });
}
/* o ferro de espera nas quinas da laje: a casa ainda vai subir */
function ferros(B, x0, x1, z0, z1, y) {
  for (const [x, z] of [[x0 + 0.1, z0 + 0.1], [x1 - 0.1, z0 + 0.1], [x0 + 0.1, z1 - 0.1], [x1 - 0.1, z1 - 0.1]])
    for (const d of [-0.06, 0.06])
      B.caixa(x + d - 0.012, x + d + 0.012, y, y + 0.75, z - 0.012, z + 0.012,
              { todas: { k: 'laje_borda', tinta: FERRUGEM, modo: 'esticar' }, topo: null, base: null });
}
const tampo = (B, x0, x1, z0, z1, y, k, tinta) =>
  B.tampa([[x0, z1], [x1, z1], [x1, z0], [x0, z0]], y, k, false, { tinta });

/* =======================================================
   T1 — A CASA TÉRREA DE REBOCO BRANCO ENCARDIDO
   ======================================================= */
function t1(B, p, l, conta) {
  const { s, W, D } = p;
  const x0 = 0.05, x1 = W - 0.05, z1 = -p.rec, z0 = -D + 0.05;
  const wb = x1 - x0, dd = z1 - z0;
  if (wb < 1 || dd < 1) return;
  const h = clamp(p.H, 2.6, 3.3);
  const tinta = s('pastel') < 0.35 && l.cor ? l.cor : escolher(s, 'cor', TINTAS.t1);
  const nomes = wb < 3.0 ? ['porta_vene', 'basc'] : wb < 5.0 ? ['porta_vene', 'jan2'] :
                wb < 6.8 ? ['porta_vene', 'jan2', 'basc'] : ['porta_vene', 'jan2', 'jan2', 'basc'];
  let vf = distribuir(wb, nomes, 0.08);
  if (s('espelho') < 0.5) vf = espelhar(vf, wb);
  const lado = dd >= 3 ? [{ a0: dd / 2 - 0.3, a1: dd / 2 + 0.3, b0: 1.5, b1: 2.1, k: 'basc', fundo: 0.06 }] : [];
  paredes(B, x0, x1, z0, z1, 0, h, {
    frente: { k: 'suja', tinta, vaos: vf },
    dir: { k: 'suja', tinta, vaos: s('ladoD') < 0.5 ? lado : [] },
    esq: { k: 'suja', tinta, vaos: s('ladoE') < 0.5 ? lado : [] },
    tras: { k: 'suja', tinta, vaos: wb >= 1.6 ? distribuir(wb, ['jan2'], 0.06) : [] }
  }, conta);
  const yr = telhado2(B, 0.02, W - 0.02, z0, z1, -0.02, -D + 0.02, h, escolher(s, 'telha', TELHA.t1), true);
  empenas(B, x0, x1, z0, z1, h, yr, 'suja', tinta);
}

/* =======================================================
   T2 — A CASA DE TIJOLO SEM REBOCO (e a da favela, que é da família)
   O CAIXOTE: um a três andares com a borda da laje à mostra. A de
   tijolo tem o embasamento de cimento; a de reboco cru e a pintada
   têm a mesma estrutura, com a parede delas. Em cima, laje com o
   ferro de espera (a casa ainda vai subir) ou telha.
   ======================================================= */
const PAREDE = { tijolo: 'tijolo', reboco: 'crua', pintada: 'lisa' };

function caixote(B, p, l, conta, o) {
  const { s, W, D } = p;
  const n = o.andares, parede = o.parede;
  const kP = PAREDE[parede], tinta = parede === 'pintada' ? (l.cor || '#d8d2c0') : null;
  const hf = clamp(p.H / n, 2.45, 2.8), laje = 0.22;
  const x0 = 0.04, x1 = W - 0.04, z1 = -p.rec, z0 = -D + 0.04;
  const wb = x1 - x0, dd = z1 - z0;
  if (wb < 0.9 || dd < 0.9) return;
  const porta = parede === 'pintada' ? 'porta_vene' : 'porta_ferro';
  const jan = wb < 2.6 ? 'basc' : parede === 'tijolo' ? 'jan_vidro' : (wb < 3.2 ? 'basc' : 'jan2');
  const janCima = parede === 'tijolo' ? (wb < 2.2 ? 'basc' : 'veneziana') : (wb < 2.4 ? 'basc' : 'jan2');
  for (let i = 0; i < n; i++) {
    const y0 = i * hf, y1 = y0 + hf - laje;
    let vf = distribuir(wb, i === 0 ? [porta, jan] : (wb >= 2.8 ? [janCima, janCima] : [janCima]), 0.07);
    if (i === 0 && s('esp') < 0.5) vf = espelhar(vf, wb);
    const lateral = dd >= 2.6 && s('lat' + i) < 0.45 ? [{ a0: dd / 2 - 0.3, a1: dd / 2 + 0.3, b0: 1.2, b1: 1.8, k: 'basc', fundo: 0.05 }] : [];
    paredes(B, x0, x1, z0, z1, y0, y1, {
      frente: { k: kP, tinta, vaos: vf.map(v => Object.assign(v, { b0: Math.min(v.b0, y1 - y0 - 0.9), b1: Math.min(v.b1, y1 - y0 - 0.05) })) },
      dir: { k: kP, tinta, vaos: lateral }, esq: { k: kP, tinta, vaos: [] },
      tras: { k: kP, tinta, vaos: wb >= 1.4 ? distribuir(wb, [i === 0 ? jan : janCima], 0.05) : [] }
    }, conta);
    /* o embasamento de cimento do tijolo, e a borda da laje */
    if (i === 0 && parede === 'tijolo') faixa(B, x0, x1, z0, z1, 0, 0.7, 0.015, 'crua', null);
    faixa(B, x0, x1, z0, z1, y1, y1 + laje, 0.04, parede === 'pintada' ? 'lisa' : 'laje_borda', tinta);
  }
  const topo = n * hf;
  p.topo = topo;                                    // onde assenta a caixa d'água da favela
  if (o.telhado === 'telha' || o.telhado === 'fibro') {
    /* o fibrocimento é a mesma água, cinza — como o bairro sempre fez */
    const tel = o.telhado === 'fibro' ? '#a4aaac' : escolher(s, 'telha', TELHA.fav);
    const yr = telhado2(B, x0 - 0.02, x1 + 0.02, z0, z1, Math.min(-0.02, z1 + 0.16), z0 - Math.min(0.02, D * 0.01), topo, tel, false);
    empenas(B, x0, x1, z0, z1, topo, yr, kP, tinta);
  } else {
    tampo(B, x0, x1, z0, z1, topo, 'laje');
    if (parede === 'tijolo' && s('ferro') < 0.6) ferros(B, x0, x1, z0, z1, topo);
  }
}

/* O T2 DE DOIS ANDARES — a casa da referência. Em L: na frente, o
   bloco do TERRAÇO (térreo com a porta de ferro e a janelinha, a laje
   em cima com a mureta de tijolo por terminar); recuado, o bloco de
   DOIS ANDARES, com a escada de alvenaria correndo rente a ele, no
   dente que o L deixa, do chão até o terraço. Embaixo da escada o
   tijolo fecha (alvenaria cheia). Na frente da escada, o pilar solto
   com o ferro saindo em cima. */
function t2alto(B, p, l, conta) {
  const { s, W, D } = p;
  const x0 = 0.04, x1 = W - 0.04, wb = x1 - x0;
  const hf = clamp(p.H / 2, 2.45, 2.8), laje = 0.22, y1 = hf - laje;
  const zB = -p.rec, dente = 0.95, zA = zB - dente, z0 = -D + 0.04;
  const terr = clamp(wb * 0.4, 1.9, 2.6);
  const aw = wb - terr;
  const L = Math.min(aw - 0.15, hf / Math.tan(38 * Math.PI / 180));
  /* lote que não comporta o L com escada de até 50°: vira o caixote */
  if (L < hf / Math.tan(50 * Math.PI / 180) || zA - z0 < 1.8)
    return caixote(B, p, l, conta, { andares: 2, parede: 'tijolo', telhado: 'laje' });
  const dir = s('lado') < 0.5;                        // o terraço à direita de quem olha
  const bx0 = dir ? x1 - terr : x0, bx1 = dir ? x1 : x0 + terr;
  const ax0 = dir ? x0 : x0 + terr, ax1 = dir ? x1 - terr : x1;
  const xm = dir ? ax1 : ax0;                         // a divisa entre os dois blocos
  const lat = (d0, d1) => [{ a0: (d1 - d0) / 2 - 0.4, a1: (d1 - d0) / 2 + 0.4, b0: 1.3, b1: 2.0, k: 'jan_vidro', fundo: 0.05 }];
  /* ---- o bloco do terraço: térreo só ---- */
  let vB = distribuir(terr, ['porta_ferro', 'jan_vidro'], 0.07);
  if (!dir) vB = espelhar(vB, terr);
  paredes(B, bx0, bx1, z0, zB, 0, y1, {
    frente: { k: 'tijolo', vaos: vB.map(v => Object.assign(v, { b1: Math.min(v.b1, y1 - 0.05) })) },
    [dir ? 'dir' : 'esq']: { k: 'tijolo', vaos: zB - z0 >= 2.4 ? lat(z0, zB) : [] },
    tras: { k: 'tijolo' }
  }, conta);
  /* o lado do terraço que dá pro dente da escada (o resto encosta no
     outro bloco e não aparece) */
  B.ladrilhar(dir ? B.plano([bx0, 0, zA], [0, 0, 1], [0, 1, 0]) : B.plano([bx1, 0, zB], [0, 0, -1], [0, 1, 0]),
              B.ret(0, dente, 0, y1), 'tijolo');
  faixa(B, bx0, bx1, z0, zB, 0, 0.85, 0.015, 'crua', null);
  faixa(B, bx0, bx1, z0, zB, y1, hf, 0.04, 'laje_borda', null);
  tampo(B, bx0, bx1, z0, zB, hf, 'laje');
  /* ---- o bloco de dois andares, recuado ---- */
  for (let i = 0; i < 2; i++) {
    const ya = i * hf, yb = ya + y1;
    const vf = i === 0 ? [] : distribuir(aw, aw >= 3.4 ? ['veneziana', 'veneziana'] : ['veneziana'], 0.07);
    paredes(B, ax0, ax1, z0, zA, ya, yb, {
      frente: { k: 'tijolo', vaos: vf },
      [dir ? 'esq' : 'dir']: { k: 'tijolo', vaos: zA - z0 >= 2.4 && i === 1 ? lat(z0, zA) : [] },
      /* o lado que encosta no terraço só aparece no andar de cima */
      [dir ? 'dir' : 'esq']: i === 1 ? { k: 'tijolo' } : null,
      tras: { k: 'tijolo', vaos: aw >= 1.4 ? distribuir(aw, [i === 0 ? 'jan_vidro' : 'veneziana'], 0.05) : [] }
    }, conta);
    faixa(B, ax0, ax1, z0, zA, yb, yb + laje, 0.04, 'laje_borda', null);
  }
  faixa(B, ax0, ax1, z0, zA, 0, 0.85, 0.015, 'crua', null);
  tampo(B, ax0, ax1, z0, zA, 2 * hf, 'laje');
  if (s('ferro') < 0.7) ferros(B, ax0, ax1, z0, zA, 2 * hf);
  /* ---- a escada de alvenaria, no dente, subindo pro terraço ---- */
  const passos = Math.max(8, Math.round(hf / 0.19));
  const zf = zA + Math.min(0.78, dente - 0.2);
  const baixo = dir ? xm - L : xm + L;                // onde ela começa
  /* só o que aparece: a face da frente (um plano só, pro tijolo correr
     contínuo de degrau em degrau), o piso e o espelho de cada degrau */
  const e0 = dir ? baixo : baixo - L;
  const Ff = B.plano([e0, 0, zf], [1, 0, 0], [0, 1, 0]);
  for (let k = 0; k < passos; k++) {
    const t0 = k / passos, t1 = (k + 1) / passos;
    const a0 = dir ? L * t0 : L * (1 - t1), a1 = dir ? L * t1 : L * (1 - t0);
    const xa = e0 + a0, xb = e0 + a1, y0 = hf * t0, y1 = hf * t1;
    B.ladrilhar(Ff, B.ret(a0, a1, 0, y1), 'tijolo');
    B.tampa([[xa, zf], [xb, zf], [xb, zA], [xa, zA]], y1, 'laje_borda');
    if (dir) B.ladrilhar(B.plano([xa, y0, zA], [0, 0, 1], [0, 1, 0]), B.ret(0, zf - zA, 0, y1 - y0), 'laje_borda', { escuro: 0.85 });
    else B.ladrilhar(B.plano([xb, y0, zf], [0, 0, -1], [0, 1, 0]), B.ret(0, zf - zA, 0, y1 - y0), 'laje_borda', { escuro: 0.85 });
  }
  conta.obst.push({ a0: Math.min(baixo, xm) - 0.2, a1: Math.max(baixo, xm) + 0.05, b0: 0, b1: hf + 1.2 });
  /* o pilar solto na frente da escada, com o ferro em cima, e o
     mourãozinho no pé dela */
  const px = dir ? baixo + L * 0.45 : baixo - L * 0.45;
  const pz0 = zf + 0.03, pz1 = Math.min(zB - 0.02, pz0 + 0.16);
  B.caixa(px - 0.08, px + 0.08, 0, hf + 1.0, pz0, pz1, { todas: 'crua', base: null });
  for (const d of [-0.03, 0.03])
    B.caixa(px + d - 0.012, px + d + 0.012, hf + 1.0, hf + 1.45, (pz0 + pz1) / 2 - 0.012, (pz0 + pz1) / 2 + 0.012,
            { todas: { k: 'laje_borda', tinta: FERRUGEM, modo: 'esticar' }, topo: null, base: null });
  const qx = dir ? baixo + 0.08 : baixo - 0.08;
  B.caixa(qx - 0.06, qx + 0.06, 0, 1.05, pz0 - 0.1, pz0 + 0.02, { todas: 'crua', base: null });
  /* ---- a mureta do terraço: inteira na frente, e no lado de fora
     os tijolos em degrau, que ninguém terminou ---- */
  const cx = dir ? bx1 : bx0;                         // a quina de fora
  B.caixa(bx0, bx1, hf, hf + 0.95, zB - 0.12, zB, { todas: 'tijolo', topo: 'laje_borda', base: null });
  B.caixa(dir ? cx - 0.16 : cx, dir ? cx : cx + 0.16, hf, hf + 1.05, zB - 0.16, zB, { todas: 'crua', base: null });
  const alturas = [0.95, 0.8, 0.62, 0.45, 0.26];
  const passo = (zB - 0.12 - z0) / alturas.length;
  for (let k = 0; k < alturas.length; k++) {
    const za = zB - 0.12 - (k + 1) * passo, zb2 = zB - 0.12 - k * passo;
    B.caixa(dir ? bx1 - 0.12 : bx0, dir ? bx1 : bx0 + 0.12, hf, hf + alturas[k], za, zb2, { todas: 'tijolo', base: null });
  }
}

function t2(B, p, l, conta) {
  if (p.andares === 2) return t2alto(B, p, l, conta);
  caixote(B, p, l, conta, { andares: 1, parede: 'tijolo', telhado: 'laje' });
}
function favela(B, p, l, conta) {
  caixote(B, p, l, conta, { andares: p.andares, parede: l.parede || 'tijolo', telhado: p.telhado });
}

/* =======================================================
   T3 — A CASA COM PONTO COMERCIAL EMBAIXO
   ======================================================= */
function t3(B, p, l, conta) {
  const { s, W, D } = p;
  const x0 = 0.05, x1 = W - 0.05, z1 = -p.rec, z0 = -D + 0.05;
  const wb = x1 - x0, dd = z1 - z0;
  if (wb < 1 || dd < 1) return;
  const tinta = escolher(s, 'cor', TINTAS.t3);
  const hT = p.terreo, hp = p.porta;
  const doisAndares = p.andares === 2;
  const hTopo = doisAndares ? Math.max(hT + 2.5, Math.min(p.H, hT + 3.1)) : hT;
  /* ---- o térreo: portas de enrolar entre pilastras ---- */
  let nPortas = wb >= 5.6 ? 2 : 1;
  let ap = doisAndares && wb >= 3.9 && nPortas === 1;
  let promo = wb >= 2.8;
  const pil = 0.28;
  let larg = () => (wb - pil * (nPortas + 1) - (ap ? 1.1 : 0) - (promo ? 1.0 : 0)) / nPortas;
  if (larg() < 1.3) promo = false;
  if (larg() < 1.4) ap = false;
  const dw = Math.max(0.9, larg());
  const vaos = [];
  const aberta = s('aberta') < 0.35;
  let a = pil;
  const ladoAp = s('ap') < 0.5;
  /* nada passa da altura da porta de enrolar: acima dela é o letreiro */
  const hAp = Math.min(2.2, hp);
  if (ap && ladoAp) { vaos.push({ a0: a, a1: a + 0.85, b0: 0, b1: hAp, k: 'porta_ap', fundo: 0.1 }); a += 0.85 + 0.25; }
  for (let i = 0; i < nPortas; i++) {
    vaos.push({ a0: a, a1: a + dw, b0: 0.02, b1: hp, k: aberta && i === 0 ? 'enrolar_meia' : 'enrolar', fundo: 0.14 });
    a += dw + pil;
  }
  if (ap && !ladoAp) { vaos.push({ a0: a - 0.03, a1: a + 0.82, b0: 0, b1: hAp, k: 'porta_ap', fundo: 0.1 }); a += 0.85 + 0.25; }
  if (promo) { const t = Math.min(2.0, hp - 0.05); vaos.push({ a0: wb - pil - 0.8, a1: wb - pil - 0.05, b0: t - 1.1, b1: t, k: 'promocoes' }); }
  paredes(B, x0, x1, z0, z1, 0, hT, {
    frente: { k: 'lisa', tinta, vaos },
    dir: { k: 'crua' }, esq: { k: 'crua' },
    tras: { k: 'crua', vaos: wb >= 1.6 ? distribuir(wb, ['jan_peq'], 0.06) : [] }
  }, conta);
  /* a marquise, logo acima do letreiro */
  const yM = hp + 0.1 + p.placa.alt / M + 0.06;
  if (yM + 0.12 < hT) {
    B.caixa(x0, x1, yM, yM + 0.12, z1, Math.min(-0.03, z1 + 0.6),
            { todas: 'laje_borda', topo: 'laje', base: { k: 'crua', escuro: 0.75 } });
    conta.obst.push({ a0: x0, a1: x1, b0: yM - 0.02, b1: yM + 0.14 });
  }
  /* ---- o andar de cima ---- */
  if (doisAndares) {
    const vf = distribuir(wb, wb >= 5.8 ? ['jan_cortina', 'jan_cortina', 'jan_peq'] : wb >= 4.4 ? ['jan_cortina', 'jan_peq'] : ['jan_cortina'], 0.08);
    paredes(B, x0, x1, z0, z1, hT, hTopo, {
      frente: { k: 'lisa', tinta, vaos: vf },
      dir: { k: 'crua' }, esq: { k: 'crua' },
      tras: { k: 'crua', vaos: wb >= 1.6 ? distribuir(wb, ['jan_peq'], 0.06) : [] }
    }, conta);
  }
  /* o beiral fino de fibrocimento no alto da frente, e a laje */
  faixa(B, x0, x1, z0, z1, hTopo - 0.02, hTopo + 0.08, Math.min(0.32, -0.03 - z1), 'laje_borda', null);
  tampo(B, x0, x1, z0, z1, hTopo + 0.08, 'laje');
}

/* =======================================================
   T4 — O SOBRADO DE LAJE COM AS CAIXAS D'ÁGUA AZUIS
   ======================================================= */
function t4(B, p, l, conta, G) {
  const { s, W, D } = p;
  const tinta = escolher(s, 'cor', TINTAS.t4);
  const balanco = D >= 4.2 ? 0.3 : 0;
  const x0 = 0.05, x1 = W - 0.05, zU = -p.rec, zG = zU - balanco, z0 = -D + 0.05;
  const wb = x1 - x0;
  if (wb < 1 || zU - z0 < 1.2) return;
  const h1 = 2.85, lj = 0.2;
  const hTopo = clamp(p.H - 0.35, 5.3, 6.4);
  /* a garagem de telhadinho, de um lado, quando a frente comporta */
  const temGaragem = wb >= 6.3 && D >= 5;
  const gEsq = s('garagem') < 0.5, gw = 2.9;
  const bx0 = temGaragem && gEsq ? x0 + gw : x0, bx1 = temGaragem && !gEsq ? x1 - gw : x1;
  const bw = bx1 - bx0;
  /* ---- o corpo: térreo recuado sob o balanço do andar de cima ---- */
  let vT = distribuir(bw, bw >= 2.6 ? ['porta_alu', 'jan_grade'] : ['porta_alu'], 0.08);
  if (s('esp') < 0.5) vT = espelhar(vT, bw);
  paredes(B, bx0, bx1, z0, zG, 0, h1, {
    frente: { k: 'lisa', tinta, vaos: vT },
    dir: { k: 'lisa', tinta }, esq: { k: 'lisa', tinta },
    tras: { k: 'lisa', tinta, vaos: bw >= 1.6 ? distribuir(bw, ['jan_grade'], 0.06) : [] }
  }, conta);
  /* a laje entre os andares, com a borda e o forro do balanço */
  B.caixa(bx0, bx1, h1, h1 + lj, z0, zU, { todas: { k: 'lisa', tinta }, base: { k: 'crua', escuro: 0.7 } });
  const vC = distribuir(bw, bw >= 3.4 ? ['jan_grade', 'jan_grade'] : ['jan_grade'], 0.08);
  paredes(B, bx0, bx1, z0, zU, h1 + lj, hTopo, {
    frente: { k: 'lisa', tinta, vaos: subir(vC, -0.15) },
    dir: { k: 'lisa', tinta }, esq: { k: 'lisa', tinta },
    tras: { k: 'lisa', tinta, vaos: bw >= 1.6 ? subir(distribuir(bw, ['jan_grade'], 0.06), -0.15) : [] }
  }, conta);
  /* a laje de cima, branca, com a mureta, e as caixas d'água */
  const piso = [[bx0, zU], [bx1, zU], [bx1, z0], [bx0, z0]];
  /* a laje e a mureta são brancas, como na foto: a faixa clara em cima
     é o que faz o sobrado de laje ler de longe */
  B.tampa(piso, hTopo, 'lisa', false, { tinta: BRANCO });
  B.pintar(BRANCO);
  mureta(B, piso, hTopo, 0.35, 0.12, 'lisa');
  B.pintar(null);
  const nCx = bw >= 3.2 && s('caixas') < 0.6 ? 2 : 1;
  for (let i = 0; i < nCx; i++) {
    /* perto da frente, que é de onde a rua vê a caixa d'água */
    const cx = gEsq ? bx1 - 0.75 - i * 1.25 : bx0 + 0.75 + i * 1.25, cz = Math.max(z0 + 0.75, zU - 1.25 - i * 0.45), y = hTopo;
    if (cz > zU - 0.7) continue;
    /* sem o fundo (assenta na laje) e com 10 lados: de longe é a
       mesma caixa, com um terço dos triângulos */
    B.torno(cx, cz, [[0.55, y], [0.55, y + 0.72], [0.6, y + 0.74], [0.3, y + 0.96], [0, y + 1.02]], 10, 'caixa');
  }
  if (!temGaragem) return;
  /* ---- a garagem: telhadinho de telha caindo pra rua, o portão de
     ferro de lança, o piso, o fundo e o muro do lado ---- */
  const gx0 = gEsq ? x0 : x1 - gw, gx1 = gEsq ? x0 + gw : x1;
  const gz0 = Math.max(z0, zU - 4.2), gzF = zU;
  const lado = gEsq ? gx0 : gx1;
  B.caixa(Math.min(lado, lado + (gEsq ? 0.12 : -0.12)), Math.max(lado, lado + (gEsq ? 0.12 : -0.12)), 0, 2.55, gz0, gzF,
          { todas: { k: 'lisa', tinta }, base: null });
  B.ladrilhar(B.plano([gx1, 0, gz0], [-1, 0, 0], [0, 1, 0]), B.ret(0, gw, 0, 2.6), 'lisa', { tinta });
  B.tampa([[gx0, gzF], [gx1, gzF], [gx1, gz0], [gx0, gz0]], 0.02, 'crua');
  const yA = 3.05, yB = 2.5, zE = Math.min(-0.03, gzF + 0.3);
  const V = [0, yA - yB, gz0 - zE], Lv = Math.hypot(V[1], V[2]);
  B.ladrilhar(B.plano([gx0, yB, zE], [1, 0, 0], [0, V[1] / Lv, V[2] / Lv]), B.ret(0, gw, 0, Lv), 'telha');
  B.caixa(gx0, gx1, yB - 0.14, yB + 0.02, zE - 0.06, zE, { todas: { k: 'lisa', tinta: BRANCO } });
  G.ladrilhar(G.plano([gx0 + (gEsq ? 0.12 : 0.02), 0, gzF], [1, 0, 0], [0, 1, 0]),
              G.ret(0, gw - 0.14, 0, 2.2), 'lanca');
  conta.portas++;
}

/* =======================================================
   T5 — O CASARÃO COLONIAL
   ======================================================= */
function t5(B, p, l, conta, G) {
  const { s, W, D } = p;
  const x0 = 0.05, x1 = W - 0.05, z1 = -p.rec, z0 = -D + 0.05;
  const wb = x1 - x0;
  if (wb < 1.4 || z1 - z0 < 1.2) return;
  const tinta = escolher(s, 'cor', TINTAS.t5), claro = '#e4e4e0';
  const hTot = clamp(p.H, 5.8, 7.0), h1 = hTot / 2;
  /* um módulo (porta ou janela embaixo, a porta-janela e a sacada em
     cima) a cada 1,45 m no mínimo: a sacada tem 1,3 e não encosta na
     do lado */
  const n = clamp(Math.floor((wb - 1.1) / 1.45), 1, 4);
  const padrao = { 1: ['col_porta'], 2: ['col_porta', 'col_janela'], 3: ['col_janela', 'col_porta', 'col_janela'],
                   4: ['col_janela', 'col_porta', 'col_janela', 'col_janela'] }[n];
  /* as peças em posições iguais, longe dos cunhais */
  const marg = 0.55, passo = (wb - 2 * marg) / n;
  const centros = padrao.map((k, i) => marg + passo * (i + 0.5));
  const vT = padrao.map((k, i) => ({ a0: centros[i] - PECA[k].w / 2, a1: centros[i] + PECA[k].w / 2,
                                     b0: PECA[k].b0, b1: PECA[k].b1, k, fundo: 0.12 }));
  /* a peça tem o arco pleno de 1,1 m de vão pintado no alto; esticada
     no vão, a flecha dele é esta */
  const vC = centros.map(c => {
    const b1 = Math.min(2.75, hTot - h1 - 0.25);
    return { a0: c - 0.5, a1: c + 0.5, b0: 0.2, b1, k: 'col_arco', fundo: 0.12, arco: 0.55 * (b1 - 0.2) / 2.7 };
  });
  paredes(B, x0, x1, z0, z1, 0, h1, {
    frente: { k: 'lisa', tinta, vaos: vT },
    dir: { k: 'lisa', tinta }, esq: { k: 'lisa', tinta },
    tras: { k: 'lisa', tinta, vaos: wb >= 1.6 ? distribuir(wb, ['col_janela'], 0.1) : [] }
  }, conta);
  paredes(B, x0, x1, z0, z1, h1, hTot, {
    frente: { k: 'lisa', tinta, vaos: vC },
    dir: { k: 'lisa', tinta }, esq: { k: 'lisa', tinta },
    tras: { k: 'lisa', tinta }
  }, conta);
  /* embasamento, friso entre os andares, cunhais e cornija */
  faixa(B, x0, x1, z0, z1, 0, 0.35, 0.03, 'crua', null);
  faixa(B, x0, x1, z0, z1, h1 - 0.1, h1 + 0.1, 0.07, 'lisa', claro);
  for (const x of [x0, x1 - 0.35]) {
    B.caixa(x, x + 0.35, 0.35, hTot, z1, z1 + 0.05, { todas: { k: 'lisa', tinta: claro }, base: null });
    conta.obst.push({ a0: x, a1: x + 0.35, b0: 0, b1: hTot });
  }
  conta.obst.push({ a0: x0, a1: x1, b0: h1 - 0.1, b1: h1 + 0.1 });
  faixa(B, x0, x1, z0, z1, hTot, hTot + 0.32, Math.min(0.22, p.rec - 0.05), 'lisa', claro);
  /* o degrau da porta */
  const iPorta = padrao.indexOf('col_porta');
  if (iPorta >= 0) {
    B.caixa(x0 + centros[iPorta] - 0.75, x0 + centros[iPorta] + 0.75, 0, 0.12, z1, Math.min(-0.03, z1 + 0.3),
            { todas: { k: 'lisa', tinta: claro }, base: null });
    conta.obst.push({ a0: x0 + centros[iPorta] - 0.75, a1: x0 + centros[iPorta] + 0.75, b0: 0, b1: 0.12 });
  }
  /* as sacadas: a laje fina, o gradil azul e o corrimão */
  const sai = Math.min(0.4, -z1 - 0.04);
  for (const c of centros) {
    const a0 = x0 + c - 0.65, a1 = x0 + c + 0.65, yb = h1 + 0.12;
    conta.obst.push({ a0, a1, b0: yb - 0.12, b1: yb + 1.03 });
    B.caixa(a0, a1, yb - 0.12, yb, z1, z1 + sai, { todas: { k: 'lisa', tinta: claro }, base: { k: 'lisa', tinta: claro, escuro: 0.75 } });
    G.ladrilhar(G.plano([a0, yb, z1 + sai], [1, 0, 0], [0, 1, 0]), G.ret(0, a1 - a0, 0, 1.0), 'gradil', { tw: 0.65 });
    G.ladrilhar(G.plano([a0, yb, z1], [0, 0, 1], [0, 1, 0]), G.ret(0, sai, 0, 1.0), 'gradil', { tw: 0.65 });
    G.ladrilhar(G.plano([a1, yb, z1 + sai], [0, 0, -1], [0, 1, 0]), G.ret(0, sai, 0, 1.0), 'gradil', { tw: 0.65 });
    B.caixa(a0 - 0.03, a1 + 0.03, yb + 0.95, yb + 1.03, z1 + sai - 0.03, z1 + sai + 0.02, { todas: { k: 'lisa', tinta: AZUL_COL } });
  }
  /* o telhado baixo de quatro águas, de telha escura */
  B.pintar(escolher(s, 'telha', TELHA.t5));
  /* 8 cm pra dentro da divisa: a capa do espigão tem 24 cm de largura
     e, no casarão raso, nasce quase na quina do beiral */
  B.telhado4(0.08, W - 0.08, -D + 0.08, Math.min(-0.03, z1 + 0.22), hTot + 0.32, 1.2, 'telha', 'telha');
  B.pintar(null);
}

const TIPOS = { t1, t2, t3, t4, t5, favela };

/* =======================================================
   A MONTAGEM DE UMA CASA, direto no acumulador do mundo
   ======================================================= */
/* `destino.casas` e `destino.grades` são listas: cada casa entra com
   os blocos dela já no mundo (Float32Array), e quem monta a malha
   junta tudo de uma vez — empurrar número por número num array de
   milhão de posições custava mais que desenhar a casa.
   `y0` (em unidades) é o chão onde a casa assenta: no quarteirão, a
   laje do lote, que é 1,6 acima da rua. */
export function montarCasa(l, p, destino, y0 = 0) {
  const B = Construtor('casas'), G = Construtor('grades');
  const conta = { portas: 0, janelas: 0, janelasLado: 0, frentes: [], obst: [] };
  TIPOS[p.tipo](B, p, l, conta, G);
  p.frentes = conta.frentes; p.obst = conta.obst; p.y0 = y0;
  const f = frameDoLote(l), meio = p.W / 2;
  for (const [C, lista] of [[B, destino.casas], [G, destino.grades]]) {
    const n = C.pos.length / 3, P = C.pos;
    if (!n) continue;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const lx = P[3 * i] - meio, ly = P[3 * i + 1], lz = P[3 * i + 2];
      pos[3 * i] = f.fx + (lx * f.rx + lz * f.nx) * M;
      pos[3 * i + 1] = y0 + ly * M;
      pos[3 * i + 2] = f.fz + (lx * f.rz + lz * f.nz) * M;
    }
    lista.push({ pos, uv: new Float32Array(C.uv), cor: new Float32Array(C.cor) });
  }
  return conta;
}
/* junta os blocos de uma lista num Float32Array só */
export function juntarBlocos(lista, campo) {
  let n = 0;
  for (const b of lista) n += b[campo].length;
  const out = new Float32Array(n);
  let o = 0;
  for (const b of lista) { out.set(b[campo], o); o += b[campo].length; }
  return out;
}

/* =======================================================
   ONDE CABE UM DECALQUE NA FRENTE
   O letreiro, a pixação e a falha de reboco são quadrados rentes à
   parede. Na casa de modelo a janela e a porta são FUNDAS, então o
   decalque não pode passar por cima delas (ficaria boiando na frente
   do vão), nem da escada, do cunhal ou da sacada. Isto procura, nas
   paredes da frente, o lugar livre mais perto do que se pediu, e
   encolhe o decalque (na mesma proporção) até `min` se não couber.
   `o.portas` deixa ir na porta de enrolar fechada — pixação em porta
   de aço é das coisas mais comuns da cidade.
   Entra e sai em UNIDADES de mundo: `o.u` é o deslocamento do meio da
   frente (positivo pra direita de quem olha) e `o.y` a altura do
   meio, contada do chão da casa. Devolve o meio do quadrado no mundo
   e a normal da parede, ou null.
   ======================================================= */
export function lugarDoDecalque(l, p, larg, alt, o = {}) {
  if (!p || !p.frentes) return null;
  const folga = 0.06;
  const alvoX = p.W / 2 + (o.u || 0) / M, alvoY = (o.y || 0) / M;
  const prop = alt / larg, wMin = (o.min || larg) / M;
  const sup = [];
  for (const S of p.frentes) {
    sup.push({ x0: S.x0, x1: S.x1, y0: S.y0, y1: S.y1, z: S.z, m: folga, obst: S.vaos.concat(p.obst) });
    if (o.portas) for (const v of S.vaos)
      if (v.k === 'enrolar') sup.push({ x0: v.a0, x1: v.a1, y0: v.b0, y1: v.b1, z: S.z - v.fundo, m: 0.1, obst: [] });
  }
  for (let w = larg / M; w >= wMin - 1e-6; w *= 0.86) {
    const h = w * prop;
    let melhor = null, md = Infinity;
    for (const S of sup) {
      const xa = S.x0 + S.m, xb = S.x1 - S.m - w, ya = S.y0 + S.m, yb = S.y1 - S.m - h;
      if (xb < xa || yb < ya) continue;
      const xs = [xa, xb, alvoX - w / 2], ys = [ya, yb, alvoY - h / 2];
      for (const b of S.obst) { xs.push(b.a1 + folga, b.a0 - folga - w); ys.push(b.b1 + folga, b.b0 - folga - h); }
      for (const cx of xs) {
        const x = clamp(cx, xa, xb);
        for (const cy of ys) {
          const y = clamp(cy, ya, yb);
          if (S.obst.some(b => x < b.a1 + folga - 1e-9 && x + w > b.a0 - folga + 1e-9 &&
                               y < b.b1 + folga - 1e-9 && y + h > b.b0 - folga + 1e-9)) continue;
          const d = 3 * Math.abs(y + h / 2 - alvoY) + Math.abs(x + w / 2 - alvoX);
          if (d < md) { md = d; melhor = [S, x, y]; }
        }
      }
    }
    if (!melhor) continue;
    const [S, x, y] = melhor, f = frameDoLote(l);
    /* 3,5 cm à frente da parede: passa do embasamento de cimento (1,5)
       e do rodapé do casarão (3), e de lado não se vê a folga */
    const lx = x + w / 2 - p.W / 2, lz = S.z + 0.035;
    return { x: f.fx + (lx * f.rx + lz * f.nx) * M, y: (p.y0 || 0) + (y + h / 2) * M,
             z: f.fz + (lx * f.rz + lz * f.nz) * M, ox: f.nx, oz: f.nz, larg: w * M, alt: h * M };
  }
  return null;
}
