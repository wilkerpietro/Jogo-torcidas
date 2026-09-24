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
   telha ou fibrocimento. E as oito CASAS GRANDES da favela, que a
   planta monta juntando vizinhas (`l.modelo`): a de laje com terraço
   (F1), a casa rosa de quintal e muro (F2), o bar, a lanchonete, a
   casa da escada de fora, o sobrado do varal, o das garagens e o do
   embasamento.

   E o GALPÃO e o PRÉDIO da cidade (fora da favela), em quatro modelos:
   o galpão de platibanda (G1), o de telhado em arco (G2), o predinho
   de reboco pintado (P1) e o prédio de tijolo que foi subindo (P2).

   E as quatro CASAS DE MURO (M1 a M4): a térrea atrás do muro, com a
   garagem coberta, o muro alto com a caixa d'água, o quintal com a
   porta no corredor e a casinha no meio do lote — três de cada,
   espalhadas, no lote que a planta escolhe (`l.muro`).

   QUEM VIRA O QUÊ sai da POSIÇÃO do lote, não do `rng()` da planta:
   a cidade continua a mesma casa por casa, só muda a roupa. Só o muro
   continua com o desenho antigo do bairro.

   TUDO CABE NO LOTE. Nada passa da divisa (telhado por cima da
   calçada é o que a varredura pega): quando o tipo tem beiral,
   marquise ou sacada na frente, a parede da frente RECUA o que eles
   avançam (`rec`), e o letreiro, a pixação e a falha de reboco do
   bairro vão pro plano dessa parede, não pro da divisa.
   ========================================================= */
import { Construtor, METRO, mureta, toldo, arSplit } from './construtor3d.js';
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
  t5: ['#f4f4f0', '#f4f4f0', '#f1efe8', '#efd98a', '#b8cde6', '#eec3b8', '#cfe3c8'],
  /* o galpão pintado: as cores de depósito, apagadas */
  g: ['#d9d4c7', '#c9c2b1', '#b9c3c9', '#d8c9a6', '#c7b8a8', '#bfc7b8'],
  /* o predinho: as cores de prédio de bairro */
  p1: ['#e9c46a', '#f0b5a0', '#a8c8e0', '#e8e2d0', '#c9dcb0', '#f2d6a2', '#d6b8d9', '#9fd0c8']
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

/* o recuo da parede da frente de cada casa grande da favela: a da
   lanchonete recua o que o toldinho da porta de enrolar avança. O bar
   da torcida (o de esquina, embaixo do apartamento) é modelo também. */
const REC_MODELO = { f1: 0.06, f2: 0.04, bar: 0.03, lanche: 0.5, escada: 0.04, varal: 0.04, garagem: 0.32, base: 0.04,
                     bartorcida: 0.04 };

export function planoDaCasa(l, K) {
  if (l._plano !== undefined) return l._plano;
  let p = null;
  if (l.modelo && REC_MODELO[l.modelo] !== undefined) {
    const [W, D] = medidas(l);
    p = { tipo: l.modelo, andares: 2, rec: REC_MODELO[l.modelo], W, D, H: l.alt / M, s: sorteDe(l),
          semManchas: l.modelo !== 'f2' && l.modelo !== 'varal' };
    /* o letreiro BAR DO X do bar da torcida vai no frontão da varanda */
    if (l.modelo === 'bartorcida' && l.placa) p.placa = placaDoBar(W, l.esquina);
    l._plano = p;
    return p;
  }
  /* O GALPÃO E O PRÉDIO COMUM da cidade (o galpão da favela é casa) */
  if (!l.favela && (l.tipo === 'galpao' || l.tipo === 'predio')) {
    const s = sorteDe(l);
    const [W, D] = medidas(l);
    const H = l.alt / M;
    if (l.tipo === 'galpao') {
      const arco = !l.placa && W >= 4.2 && D >= 3 && s('arco') < 0.45;
      p = { tipo: arco ? 'g2' : 'g1', rec: arco ? 0.16 : 0.06, parede: s('bloco') < 0.55 ? 'bloco' : 'lisa' };
    } else p = s('predio') < 0.6 ? { tipo: 'p1', rec: 0.36 } : { tipo: 'p2', rec: 0.06 };
    Object.assign(p, { W, D, H, s });
    p.rec = Math.max(0.06, Math.min(p.rec, D * 0.2));
    /* o bloco e o tijolo não têm reboco pra cair */
    p.semManchas = p.tipo === 'p2' || p.parede === 'bloco';
    if (l.placa && (p.tipo === 'g1')) {
      /* o letreiro do comércio no galpão vai na platibanda, em cima das
         portas de enrolar, grande */
      const { wb, hP, hPorta } = alturasGalpao(p);
      const altM = Math.min(1.2, hP - hPorta - 0.45);
      const larg = Math.max(20, Math.min(wb * M * 0.8, altM * M * 4.6));
      p.placa = { y: ((hPorta + 0.15 + hP - 0.15) / 2) * M, larg, alt: larg / 4.6 };
    } else if (l.placa) {
      /* o prédio com comércio embaixo: o letreiro em cima da porta de
         enrolar, como na casa do ponto comercial */
      const larg = Math.min(W * M - 14, 110), alt = Math.min(15, larg / 4.6);
      p.porta = 2.4;
      p.placa = { y: (p.porta + 0.12) * M + alt / 2, larg, alt };
    }
    l._plano = p;
    return p;
  }
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
    } else if (l.muro) {
      /* a casa de muro: a planta escolheu o lote e o modelo (três de cada, espalhadas) */
      p = { tipo: l.muro, andares: 1, rec: 0.06 };
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
  promocoes:   { w: 0.75, b0: 0.9, b1: 2.0 },
  jan_alu4:    { w: 1.2, b0: 0.9, b1: 1.9 },
  jan_madeira: { w: 1.0, b0: 1.0, b1: 2.1 },
  porta_madeira: { w: 0.85, b0: 0, b1: 2.1 }
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

/* =======================================================
   AS CASAS GRANDES DA FAVELA
   Quatro referências que a planta monta juntando vizinhas
   (`l.modelo`), com 5 a 8,6 m de frente e 4,3 a 6,2 m de fundo, de
   beco a beco:
     F1  a casa de laje em três níveis: térreo de tijolo entre pilar e
         viga de concreto, com a porta verde de vidrinho e a vidraça
         verde de correr; o terraço com a mureta, o guarda-sol listrado
         e as cadeiras azuis; o quarto verde; e em cima dele a varanda
         e o quarto de reboco coberto de fibrocimento;
     F2  a casa rosa atrás do muro: muro de reboco encardido com o
         portão de madeira, o pedaço de tijolo por terminar, o quintal
         de grama com bananeira, a varanda de fibrocimento em pilarete;
     BAR o bar de esquina: o térreo aberto pra rua sob a água de
         fibrocimento, a faixa de cerveja, mesa de plástico, cadeira de
         madeira e de plástico, o freezer, os engradados, a escada de
         ladrilho e a prateleira de garrafa; em cima, tijolo com duas
         janelas;
     KI  a lanchonete KI-DELÍCIA: o muro pintado da frente inteira, a
         porta de grade azul, a porta de enrolar com o toldinho; em
         cima, o terraço com a caixa d'água, o guarda-sol amarelo, a
         mesa e as cadeiras vermelhas, e o quartinho de tijolo.
   ======================================================= */
const VERDE_QUARTO = '#a9b443', ROSA = '#d45a82', ROSA_BAIXO = '#a93d62', BRANCO_BAR = '#f1f0ea',
      AZUL_CADEIRA = '#2d62c8', VERMELHO_CADEIRA = '#d23a2a', MADEIRA = '#7a4e2e',
      CINZA_ENROLAR = '#8a8d8e', AMARELO_MURO = '#f2d04a', BRANCO_MURO = '#e4e1da';

/* uma água de telhado reta, de (zA, yA) a (zB, yB), com a borda da
   placa na ponta de baixo */
function agua(B, x0, x1, zA, yA, zB, yB, k) {
  const dz = zB - zA, dy = yB - yA, L = Math.hypot(dz, dy);
  B.ladrilhar(B.plano([x0, yA, zA], [1, 0, 0], [0, dy / L, dz / L]), B.ret(0, x1 - x0, 0, L), k);
  const [zb, yb] = yA < yB ? [zA, yA] : [zB, yB];
  B.esticar(B.plano([x0, yb - 0.03, zb], [1, 0, 0], [0, 1, 0]), 0, x1 - x0, 0, 0.03, 'laje_borda');
}
/* o pilar de concreto aparente, saltado da parede de plano z */
function pilar(B, x, z, y0, y1, larg = 0.22, sai = 0.03) {
  B.caixa(x - larg / 2, x + larg / 2, y0, y1, z - 0.02, z + sai, { todas: 'crua', base: null, tras: null });
}
/* a cadeira (de plástico ou de madeira): assento, quatro pés e o
   encosto do lado `costas` ('n' = −z, 's' = +z, 'o' = −x, 'l' = +x) */
function cadeira(B, cx, cz, y, costas, tinta) {
  const s = 0.42, a = 0.44, e = 0.035, o = { todas: { k: 'lisa', tinta }, base: null };
  B.caixa(cx - s / 2, cx + s / 2, y + a - 0.04, y + a, cz - s / 2, cz + s / 2, { todas: { k: 'lisa', tinta } });
  for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const px = cx + dx * (s / 2 - e / 2), pz = cz + dz * (s / 2 - e / 2);
    B.caixa(px - e / 2, px + e / 2, y, y + a - 0.04, pz - e / 2, pz + e / 2, o);
  }
  const t = 0.04, h = s / 2;
  const enc = { n: [cx - h, cx + h, cz - h, cz - h + t], s: [cx - h, cx + h, cz + h - t, cz + h],
                o: [cx - h, cx - h + t, cz - h, cz + h], l: [cx + h - t, cx + h, cz - h, cz + h] }[costas];
  B.caixa(enc[0], enc[1], y + a, y + a + 0.45, enc[2], enc[3], o);
}
/* a mesa de plástico branca, de quatro pés */
function mesa(B, cx, cz, y, lado = 0.7, tinta = BRANCO_BAR) {
  const a = 0.72, e = 0.04, o = { todas: { k: 'lisa', tinta }, base: null };
  B.caixa(cx - lado / 2, cx + lado / 2, y + a - 0.035, y + a, cz - lado / 2, cz + lado / 2, { todas: { k: 'lisa', tinta } });
  for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const px = cx + dx * (lado / 2 - 0.06), pz = cz + dz * (lado / 2 - 0.06);
    B.caixa(px - e / 2, px + e / 2, y, y + a - 0.035, pz - e / 2, pz + e / 2, o);
  }
}
/* o guarda-sol: o pau e o pano em gomos (o torno dá uma volta na peça) */
function guardaSol(B, cx, cz, y, r, k) {
  B.caixa(cx - 0.02, cx + 0.02, y, y + 2.25, cz - 0.02, cz + 0.02, { todas: { k: 'laje_borda', tinta: '#e8e8e4' }, base: null });
  B.torno(cx, cz, [[r, y + 1.85], [r * 0.6, y + 2.12], [0.06, y + 2.3], [0, y + 2.32]], 12, k);
}
/* a caixa d'água azul de mil litros, assentada em `y` */
function caixaDagua(B, cx, cz, y, r = 0.55) {
  B.torno(cx, cz, [[r, y], [r, y + 0.72], [r + 0.05, y + 0.74], [r * 0.55, y + 0.96], [0, y + 1.02]], 10, 'caixa');
}
/* o pé de bananeira: dois planos cruzados com a folha recortada */
function bananeira(G, cx, cz, y, alt, giro) {
  const larg = alt * 1.6 / 2.4;
  for (const a of [giro, giro + Math.PI / 2]) {
    const ux = Math.cos(a), uz = Math.sin(a);
    G.esticar(G.plano([cx - ux * larg / 2, y, cz - uz * larg / 2], [ux, 0, uz], [0, 1, 0]), 0, larg, 0, alt, 'bananeira');
  }
}
/* a escada encostada numa parede lateral (a de x0), subindo pro fundo:
   o piso e o espelho de cada degrau, e o lado de fora (x1) do chão até
   o piso, num plano só pra peça correr contínua */
function escadaFundo(B, x0, x1, zFrente, zFundo, altura, k, kLado, tintaLado) {
  const passos = Math.max(6, Math.round(altura / 0.2)), run = zFrente - zFundo;
  const Fl = B.plano([x1, 0, zFrente], [0, 0, -1], [0, 1, 0]);
  for (let i = 0; i < passos; i++) {
    const t0 = i / passos, t1 = (i + 1) / passos;
    const za = zFrente - run * t1, zb = zFrente - run * t0, y0 = altura * t0, y1 = altura * t1;
    B.tampa([[x0, zb], [x1, zb], [x1, za], [x0, za]], y1, k);
    B.ladrilhar(B.plano([x0, y0, zb], [1, 0, 0], [0, 1, 0]), B.ret(0, x1 - x0, 0, y1 - y0), k, { escuro: 0.9 });
    B.ladrilhar(Fl, B.ret(zFrente - zb, zFrente - za, 0, y1), kLado, { tinta: tintaLado });
  }
}
/* uma conta à parte: a parede conta porta e janela, mas não entra
   como superfície de decalque (a de trás do quintal, a do fundo do bar) */
const contaMuda = () => ({ portas: 0, janelas: 0, janelasLado: 0, frentes: [], obst: [] });
const somar = (conta, c) => { conta.portas += c.portas; conta.janelas += c.janelas; conta.janelasLado += c.janelasLado; };

/* ---------------- F1: a casa de laje em três níveis ---------------- */
function f1(B, p, l, conta, G) {
  const { s, W, D } = p;
  const x0 = 0.04, x1 = W - 0.04, z1 = -p.rec, z0 = -D + 0.04, wb = x1 - x0;
  const h1 = 2.75, lj = 0.2, y2 = h1 + lj;
  /* o térreo: tijolo entre pilar e viga de concreto, a porta verde de
     vidrinho e a vidraça verde de correr */
  const vw = clamp(wb * 0.42, 1.6, 2.5), pc = clamp(wb * 0.2, 0.75, 1.4), vc = wb - 0.4 - vw / 2;
  paredes(B, x0, x1, z0, z1, 0, h1, {
    frente: { k: 'tijolo', vaos: [{ a0: pc - 0.43, a1: pc + 0.43, b0: 0.02, b1: 2.12, k: 'porta_verde', fundo: 0.1 },
                                  { a0: vc - vw / 2, a1: vc + vw / 2, b0: 0.04, b1: 2.24, k: 'vidraca_verde', fundo: 0.12 }] },
    dir: { k: 'tijolo' }, esq: { k: 'tijolo' }, tras: { k: 'tijolo', vaos: distribuir(wb, ['basc', 'basc'], 0.06) }
  }, conta);
  const xm = x0 + (pc + 0.43 + vc - vw / 2) / 2;
  for (const x of [x0 + 0.11, xm, x1 - 0.11]) {
    pilar(B, x, z1, 0, h1);
    conta.obst.push({ a0: x - 0.14, a1: x + 0.14, b0: 0, b1: h1 });
  }
  faixa(B, x0, x1, z0, z1, h1, y2, 0.04, 'laje_borda', null);
  tampo(B, x0, x1, z0, z1, y2, 'laje');
  /* o terraço, com a mureta de tijolo e pilarete, e o quarto verde no
     fundo; quarto largo deixa uma faixa de terraço do lado */
  const t = clamp((z1 - z0) * 0.38, 1.6, 2.4), zq = z1 - t;
  const gr = wb >= 5.6 ? wb * 0.78 : wb, qx0 = x0, qx1 = x0 + gr;
  const h2 = 2.45, y3 = y2 + h2 + lj, mur = 1.0;
  const vq = [{ a0: gr - 1.25, a1: gr - 0.4, b0: 0, b1: 2.1, k: 'porta_alu', fundo: 0.06 }];
  if (gr >= 3.2) vq.push({ a0: 0.6, a1: 1.2, b0: 1.2, b1: 1.8, k: 'basc', fundo: 0.05 });
  const cq = contaMuda();
  paredes(B, qx0, qx1, z0, zq, y2, y2 + h2, {
    frente: { k: 'lisa', tinta: VERDE_QUARTO, vaos: vq },
    dir: { k: 'lisa', tinta: VERDE_QUARTO }, esq: { k: 'tijolo' }, tras: { k: 'tijolo' }
  }, cq);
  somar(conta, cq);
  faixa(B, qx0, qx1, z0, zq, y2 + h2, y3, 0.04, 'laje_borda', null);
  const tij = { todas: 'tijolo', topo: 'laje_borda', base: null };
  B.caixa(x0, x1, y2, y2 + mur, z1 - 0.12, z1, tij);
  B.caixa(x0, x0 + 0.12, y2, y2 + mur, zq, z1 - 0.12, tij);
  if (gr < wb) {
    B.caixa(x1 - 0.12, x1, y2, y2 + mur, z0, z1 - 0.12, tij);
    B.caixa(qx1, x1 - 0.12, y2, y2 + mur, z0, z0 + 0.12, tij);
    const r = Math.min(0.55, (x1 - 0.12 - qx1) / 2 - 0.05);
    if (r > 0.3) caixaDagua(B, (qx1 + x1 - 0.12) / 2, z0 + 0.12 + r + 0.05, y2, r);
  } else B.caixa(x1 - 0.12, x1, y2, y2 + mur, zq, z1 - 0.12, tij);
  for (const x of [x0 + 0.1, (x0 + x1) / 2, x1 - 0.1])
    B.caixa(x - 0.1, x + 0.1, y2, y2 + mur + 0.08, z1 - 0.16, z1, { todas: 'crua', base: null });
  const ux = x0 + Math.min(1.5, gr * 0.35), uz = (z1 + zq) / 2;
  guardaSol(B, ux, uz, y2, Math.min(1.1, t * 0.5), 'guarda_sol_pb');
  cadeira(B, ux + 0.6, uz + 0.1, y2, 'l', AZUL_CADEIRA);
  cadeira(B, ux - 0.6, uz - 0.15, y2, 'o', AZUL_CADEIRA);
  /* o terceiro nível, em cima do quarto verde: a varanda com a mureta
     e o quarto de reboco com a janela e a porta azul, e o telhado de
     fibrocimento caindo pro fundo, cobrindo a varanda */
  tampo(B, qx0, qx1, z0, zq, y3, 'laje');
  B.caixa(qx0, qx1, y3, y3 + mur, zq - 0.12, zq, tij);
  for (const x of [qx0 + 0.1, qx1 - 0.1]) B.caixa(x - 0.1, x + 0.1, y3, y3 + mur + 0.08, zq - 0.16, zq, { todas: 'crua', base: null });
  const zr = zq - Math.min(0.9, (zq - z0) * 0.3), h3 = 2.3;
  if (zr - z0 >= 1.2) {
    const wq = qx1 - qx0;
    const v3 = [{ a0: wq - 1.2, a1: wq - 0.3, b0: 0, b1: 2.0, k: 'porta_azul', fundo: 0.06 }];
    if (wq * 0.15 + 1.2 < wq - 1.3) v3.push({ a0: wq * 0.15, a1: wq * 0.15 + 1.1, b0: 1.0, b1: 2.05, k: 'jan2', fundo: 0.06 });
    const c3 = contaMuda();
    paredes(B, qx0, qx1, z0, zr, y3, y3 + h3, { frente: { k: 'crua', vaos: v3 }, dir: { k: 'crua' }, esq: { k: 'tijolo' }, tras: { k: 'crua' } }, c3);
    somar(conta, c3);
    agua(B, qx0, qx1, z0, y3 + h3 + 0.05, zq + 0.1, y3 + h3 + 0.3, 'fibro');
  }
}

/* ---------------- F2: a casa rosa atrás do muro ---------------- */
function f2(B, p, l, conta, G) {
  const { s, W, D } = p;
  const zm = -p.rec, zmi = zm - 0.14, hm = 1.85;
  const pd = 1.0, bd = clamp(D - 0.22 - pd - 1.4, 2.2, 3.4);
  const zfu = -D + 0.04, zc = zfu + bd, zv = zc + pd;           // o fundo, a frente da casa, a beira da varanda
  const hx0 = 0.16, hx1 = W - 0.16, hb = 2.7;
  /* o muro da frente: reboco encardido com o portão de madeira entre
     dois pilares, e, da direita, o tijolo por terminar em degrau */
  const xb = W * 0.64, gw = Math.min(1.5, W * 0.22), g0 = Math.max(0.55, W * 0.2), g1 = g0 + gw;
  const mOpts = { todas: { k: 'suja', tinta: BRANCO_MURO }, topo: { k: 'laje_borda' }, base: null };
  B.caixa(0.02, g0 - 0.1, 0, hm, zmi, zm, mOpts);
  B.caixa(g1 + 0.1, xb, 0, hm, zmi, zm, mOpts);
  for (const x of [g0 - 0.1, g1]) B.caixa(x, x + 0.1, 0, hm + 0.2, zmi - 0.03, zm, mOpts);
  B.esticar(B.plano([g0, 0, zm - 0.07], [1, 0, 0], [0, 1, 0]), 0, gw, 0, 1.8, 'portao_madeira');
  B.esticar(B.plano([g1, 0, zm - 0.07], [-1, 0, 0], [0, 1, 0]), 0, gw, 0, 1.8, 'portao_madeira');
  const degraus = [hm, hm - 0.3, hm - 0.55, hm - 0.8], passo = (W - 0.02 - xb) / degraus.length;
  for (let k = 0; k < degraus.length; k++)
    B.caixa(xb + k * passo, xb + (k + 1) * passo, 0, degraus[k], zmi, zm, { todas: 'tijolo', base: null });
  conta.portas++;
  conta.frentes.push({ x0: 0.02, x1: xb, y0: 0, y1: hm, z: zm,
                       vaos: [{ a0: g0 - 0.14, a1: g1 + 0.14, b0: 0, b1: hm + 0.25, k: 'portao_madeira', fundo: 0 }] });
  /* os muros do lado do quintal, o chão de grama, o caminho de cimento
     e as bananeiras */
  B.caixa(0.02, 0.16, 0, hm, zv, zmi, mOpts);
  B.caixa(W - 0.16, W - 0.02, 0, hm - 0.8, zv, zmi, { todas: 'tijolo', base: null });
  B.tampa([[0.16, zmi], [W - 0.16, zmi], [W - 0.16, zv], [0.16, zv]], 0.03, 'grama');
  B.tampa([[g0 + 0.15, zmi], [g1 - 0.15, zmi], [g1 - 0.15, zv], [g0 + 0.15, zv]], 0.045, 'laje');
  const zq = (zmi + zv) / 2, alt = Math.min(2.1, 1.1 + (zmi - zv) * 0.8);
  bananeira(G, 0.7, zq, 0.03, alt, Math.PI / 4 + 0.2);
  if (W - 0.9 > xb) bananeira(G, W - 0.8, zq, 0.03, alt * 0.9, Math.PI / 4 - 0.3);
  /* a varanda: piso de cimento, o degrau, os pilaretes rosa e a água de
     fibrocimento presa na parede da casa */
  const cim = { todas: { k: 'crua', tinta: '#d3cec4' }, base: null };
  B.caixa(hx0, hx1, 0, 0.15, zc, zv, cim);
  B.caixa(W / 2 - 0.6, W / 2 + 0.6, 0, 0.08, zv, zv + 0.28, cim);
  for (const x of [hx0 + 0.06, W * 0.36, W * 0.64, hx1 - 0.06])
    B.caixa(x - 0.04, x + 0.04, 0.15, 2.33, zv - 0.1, zv - 0.02, { todas: { k: 'lisa', tinta: ROSA }, base: null });
  agua(B, hx0, hx1, zc, hb - 0.05, zv + 0.08, 2.3, 'fibro');
  /* a casa: rosa com a barra mais escura, as duas janelas e a porta de
     madeira no meio, a platibanda e o telhado de fibrocimento sujo
     caindo pro fundo */
  const wbH = hx1 - hx0;
  const jan = c => ({ a0: c - 0.5, a1: c + 0.5, b0: 1.0, b1: 1.9, k: 'jan_vidro', fundo: 0.06 });
  const cc = contaMuda();
  paredes(B, hx0, hx1, zfu, zc, 0, hb, {
    frente: { k: 'lisa', tinta: ROSA, vaos: [jan(wbH * 0.2), { a0: wbH / 2 - 0.43, a1: wbH / 2 + 0.43, b0: 0.15, b1: 2.25, k: 'porta_madeira', fundo: 0.08 }, jan(wbH * 0.8)] },
    dir: { k: 'lisa', tinta: ROSA }, esq: { k: 'lisa', tinta: ROSA }, tras: { k: 'crua' }
  }, cc);
  somar(conta, cc);
  faixa(B, hx0, hx1, zfu, zc, 0, 0.45, 0.01, 'lisa', ROSA_BAIXO);
  B.caixa(hx0, hx1, hb, hb + 0.35, zc - 0.12, zc, { todas: { k: 'lisa', tinta: ROSA }, base: null });
  agua(B, hx0, hx1, zc - 0.12, hb + 0.25, zfu + 0.02, hb + 0.02, 'fibro_sujo');
}

/* ---------------- O BAR ---------------- */
function bar(B, p, l, conta, G) {
  const { s, W, D } = p;
  const z1 = -p.rec, z0 = -D + 0.04;
  /* lote largo tem o portão de chapa do lado, pro quintal: do lado que
     não é a esquina */
  let bx0 = 0.04, bx1 = W - 0.04;
  const temPortao = W >= 7.2;
  const ladoPortao = l.esquina === 'esq' ? 'dir' : l.esquina === 'dir' ? 'esq' : (s('portao') < 0.5 ? 'esq' : 'dir');
  if (temPortao) { if (ladoPortao === 'dir') bx1 = W - 2.34; else bx0 = 2.34; }
  const bw = bx1 - bx0;
  const pa = clamp((z1 - z0) * 0.33, 1.3, 1.8), zU = z1 - pa;
  const h1 = 2.9, lj = 0.2, y2 = h1 + lj, h2 = 2.6, topo = y2 + h2;
  /* o andar de cima: tijolo, as janelas, pilar de concreto nas quinas */
  const vj = distribuir(bw, bw >= 3.6 ? ['jan2', 'jan2'] : ['jan2'], 0.06).map(v => Object.assign(v, { b0: 1.0, b1: 2.15 }));
  paredes(B, bx0, bx1, z0, zU, y2, topo, {
    frente: { k: 'tijolo', vaos: vj }, dir: { k: 'tijolo' }, esq: { k: 'tijolo' },
    tras: { k: 'tijolo', vaos: distribuir(bw, ['basc'], 0.05) }
  }, conta);
  for (const x of [bx0 + 0.11, bx1 - 0.11]) {
    pilar(B, x, zU, y2, topo);
    conta.obst.push({ a0: x - 0.14, a1: x + 0.14, b0: y2, b1: topo });
  }
  faixa(B, bx0, bx1, z0, zU, h1, y2, 0.03, 'laje_borda', null);
  faixa(B, bx0, bx1, z0, zU, topo, topo + 0.12, 0.03, 'laje_borda', null);
  agua(B, bx0, bx1, z0, topo + 0.12, zU + 0.08, topo + 0.3, 'fibro');
  caixaDagua(B, bx1 - 0.75, z0 + 0.7, topo + 0.2, 0.5);
  /* o térreo: o piso de cerâmica da beira da varanda ao fundo, o forro,
     as paredes (branca por dentro), e a viga que segura a frente de cima */
  B.caixa(bx0, bx1, 0, 0.05, z0, z1, { topo: 'piso_bar', frente: 'crua', dir: 'crua', esq: 'crua', tras: null, base: null });
  B.tampa([[bx0, zU], [bx1, zU], [bx1, z0], [bx0, z0]], h1, 'lisa', true, { tinta: BRANCO_BAR });
  const esquinaE = l.esquina === 'esq', esquinaD = l.esquina === 'dir';
  const branco = { k: 'lisa', tinta: BRANCO_BAR };
  B.caixa(bx0, bx0 + 0.12, 0, h1, z0, zU, { esq: esquinaE ? branco : 'tijolo', dir: branco, frente: branco, tras: 'tijolo', topo: null, base: null });
  B.caixa(bx1 - 0.12, bx1, 0, h1, z0, zU, { dir: esquinaD ? branco : 'tijolo', esq: branco, frente: branco, tras: 'tijolo', topo: null, base: null });
  B.caixa(bx0, bx1, 0, h1, z0, z0 + 0.12, { tras: 'tijolo', frente: null, dir: null, esq: null, topo: null, base: null });
  B.caixa(bx0, bx1, h1 - 0.3, h1, zU - 0.2, zU, { todas: branco, topo: null });
  /* o fundo por dentro: a prateleira de garrafa, o cartaz, o armário
     amarelo e a porta escura que dá pra casa */
  const iw = bw - 0.24;
  const fundo = [{ a0: iw - 1.25, a1: iw - 0.45, b0: 0, b1: 2.0, k: 'porta_escura', fundo: 0.1 }];
  if (iw >= 3.8) fundo.push({ a0: 1.1, a1: 2.3, b0: 1.0, b1: 2.0, k: 'prateleira' },
                           { a0: 1.4, a1: 2.0, b0: 2.1, b1: 2.75, k: 'cartaz_verde' });
  if (iw >= 4.4) fundo.push({ a0: iw - 2.3, a1: iw - 1.5, b0: 0.05, b1: 1.25, k: 'armario' });
  B.fachada(B.plano([bx0 + 0.12, 0, z0 + 0.12], [1, 0, 0], [0, 1, 0]), iw, h1, 'lisa', fundo, { tinta: BRANCO_BAR });
  /* a escada de ladrilho encostada na parede da esquerda, subindo pro
     fundo (vai pro andar de cima pelo alçapão) */
  escadaFundo(B, bx0 + 0.12, bx0 + 0.95, zU - 0.15, z0 + 0.12, h1 - 0.05, 'azulejo', 'lisa', BRANCO_BAR);
  /* o freezer e os engradados, do lado direito */
  const fx0 = bx1 - 0.12 - 0.8;
  B.caixa(fx0, fx0 + 0.72, 0.05, 1.85, zU - 0.82, zU - 0.12,
          { frente: { k: 'geladeira', modo: 'esticar' }, todas: branco, base: null });
  for (const [dy, dx] of [[0, 0], [0.3, 0], [0.6, 0.03], [0, -0.48]])
    B.caixa(fx0 - 0.5 + dx, fx0 - 0.05 + dx, 0.05 + dy, 0.35 + dy, zU - 0.55, zU - 0.25,
            { todas: { k: 'engradado', modo: 'esticar' }, base: null });
  /* as mesas: uma sob a água da frente, outra lá dentro */
  const tz = (zU + z1) / 2 - 0.05, tx = bx0 + bw * 0.45;
  mesa(B, tx, tz, 0.05);
  cadeira(B, tx - 0.62, tz, 0.05, 'o', MADEIRA);
  cadeira(B, tx + 0.62, tz, 0.05, 'l', AZUL_CADEIRA);
  if (bw >= 4.2 && zU - z0 >= 2.4) {
    const ix = bx0 + 1.1 + (fx0 - 0.6 - bx0 - 1.1) / 2, iz = zU - 1.05;
    mesa(B, ix, iz, 0.05);
    cadeira(B, ix, iz - 0.58, 0.05, 'n', AZUL_CADEIRA);
    cadeira(B, ix - 0.58, iz, 0.05, 'o', MADEIRA);
  }
  /* a varanda: os dois pilares brancos da frente, a água de
     fibrocimento e a faixa de cerveja pendurada na beira (e no lado
     da esquina) */
  B.caixa(bx0, bx0 + 0.24, 0, 2.62, z1 - 0.24, z1, { todas: branco, base: null });
  B.caixa(bx1 - 0.24, bx1, 0, 2.62, z1 - 0.24, z1, { todas: branco, base: null });
  agua(B, bx0, bx1, zU, y2 - 0.05, z1, 2.62, 'fibro');
  B.ladrilhar(B.plano([bx0 + 0.24, 2.07, z1 - 0.12], [1, 0, 0], [0, 1, 0]), B.ret(0, bw - 0.48, 0, 0.55), 'faixa_cerveja');
  if (esquinaE) B.ladrilhar(B.plano([bx0 + 0.06, 2.07, zU], [0, 0, 1], [0, 1, 0]), B.ret(0, pa - 0.24, 0, 0.55), 'faixa_cerveja');
  if (esquinaD) B.ladrilhar(B.plano([bx1 - 0.06, 2.07, z1 - 0.24], [0, 0, -1], [0, 1, 0]), B.ret(0, pa - 0.24, 0, 0.55), 'faixa_cerveja');
  conta.portas++;                                         // o bar é aberto: a frente toda é porta
  /* o portão de chapa do lado, no muro branco, e o quintal de grama */
  if (temPortao) {
    const gx0 = ladoPortao === 'dir' ? bx1 : 0.04, gx1 = ladoPortao === 'dir' ? W - 0.04 : bx0;
    const gw = gx1 - gx0, pw = Math.min(2.4, gw - 0.3);
    const vaoP = [{ a0: (gw - pw) / 2, a1: (gw + pw) / 2, b0: 0, b1: 2.0, k: 'portao_chapa', fundo: 0.05, requadro: 'crua' }];
    B.caixa(gx0, gx1, 0, 2.1, z1 - 0.15, z1, { todas: branco, frente: null, base: null });
    B.fachada(B.plano([gx0, 0, z1], [1, 0, 0], [0, 1, 0]), gw, 2.1, 'lisa', vaoP, { tinta: BRANCO_BAR });
    B.esticar(B.plano([gx0 + (gw + pw) / 2, 0, z1 - 0.15], [-1, 0, 0], [0, 1, 0]), 0, pw, 0, 2.0, 'portao_chapa');
    B.tampa([[gx0, z1 - 0.15], [gx1, z1 - 0.15], [gx1, z0], [gx0, z0]], 0.03, 'grama');
    conta.frentes.push({ x0: gx0, x1: gx1, y0: 0, y1: 2.1, z: z1,
                         vaos: vaoP.map(v => ({ a0: gx0 + v.a0, a1: gx0 + v.a1, b0: v.b0, b1: v.b1, k: v.k, fundo: v.fundo })) });
  }
}

/* ---------------- A LANCHONETE KI-DELÍCIA ---------------- */
function lanche(B, p, l, conta, G) {
  const { s, W, D } = p;
  const x0 = 0.04, x1 = W - 0.04, z1 = -p.rec, z0 = -D + 0.04, wb = x1 - x0;
  const hM = 3.8, h1 = 2.75, lj = 0.2, y2 = h1 + lj;
  /* a frente é o muro pintado inteiro, do chão ao alto da mureta do
     terraço — a pintura esticada UMA vez na parede. A porta de grade e
     a de enrolar abrem nos cantos de baixo que a pintura deixou lisos */
  const dc = wb * 0.12, rw = clamp(wb * 0.19, 1.1, 1.45), rc = wb * 0.845;
  const vaos = [{ a0: dc - 0.43, a1: dc + 0.43, b0: 0.02, b1: 2.1, k: 'porta_grade_azul', fundo: 0.08, requadro: 'crua' },
                { a0: rc - rw / 2, a1: rc + rw / 2, b0: 0.02, b1: 2.3, k: 'enrolar', fundo: 0.12, requadro: 'crua', tinta: CINZA_ENROLAR }];
  const Ff = B.plano([x0, 0, z1], [1, 0, 0], [0, 1, 0]);
  B.fachada(Ff, wb, hM, 'mural_ki', vaos, { tinta: null, tw: wb, th: hM });
  conta.portas += 2;
  conta.frentes.push({ x0, x1, y0: 0, y1: hM, z: z1,
                       vaos: vaos.map(v => ({ a0: x0 + v.a0, a1: x0 + v.a1, b0: v.b0, b1: v.b1, k: v.k, fundo: v.fundo })) });
  /* a pintura (o nome e o que vende em cima, os desenhos e o cardápio
     no meio) não leva decalque por cima: sobra a faixa de baixo e o
     alto da porta */
  conta.obst.push({ a0: x0 + 0.24 * wb, a1: x0 + 0.71 * wb, b0: 0.36, b1: hM },
                  { a0: x0 + 0.1 * wb, a1: x0 + 0.9 * wb, b0: 2.7, b1: hM });
  /* o toldinho vermelho da porta de enrolar, e o degrau na frente dela */
  toldo(B, Ff, rc - rw / 2 - 0.1, rc + rw / 2 + 0.1, 2.72, 0.42, 0.22, 'toldo_ki');
  conta.obst.push({ a0: x0 + rc - rw / 2 - 0.12, a1: x0 + rc + rw / 2 + 0.12, b0: 2.4, b1: 2.8 });
  B.caixa(x0 + rc - rw / 2 - 0.05, x0 + rc + rw / 2 + 0.05, 0, 0.14, z1, z1 + 0.35, { todas: 'crua', base: null });
  /* o resto do térreo, de tijolo; a laje; a mureta dos lados e a face
     de dentro do muro pintado */
  paredes(B, x0, x1, z0, z1, 0, h1, { dir: { k: 'tijolo' }, esq: { k: 'tijolo' },
                                      tras: { k: 'tijolo', vaos: distribuir(wb, ['basc'], 0.05) } }, null);
  tampo(B, x0, x1, z0, z1 - 0.12, y2, 'laje');
  B.ladrilhar(B.plano([x1, y2, z1 - 0.12], [-1, 0, 0], [0, 1, 0]), B.ret(0, wb, 0, hM - y2), 'lisa', { tinta: AMARELO_MURO });
  B.caixa(x0, x1, hM, hM + 0.05, z1 - 0.12, z1, { todas: 'laje_borda', base: null });
  const dr = clamp((z1 - z0) * 0.42, 1.6, 2.2), zr = z0 + dr, rx0 = x0 + wb * 0.32;
  const tij = { todas: 'tijolo', topo: 'laje_borda', base: null };
  B.caixa(x0, x0 + 0.12, y2, hM, zr, z1 - 0.12, tij);
  B.caixa(x1 - 0.12, x1, y2, hM, zr, z1 - 0.12, tij);
  B.caixa(x0, rx0, y2, hM - 0.1, z0, z0 + 0.12, tij);
  B.caixa(x0, x0 + 0.12, y2, hM - 0.1, z0 + 0.12, zr, tij);
  /* o quartinho de tijolo no fundo do terraço, com a janelinha azul e a
     porta de chapa, coberto de fibrocimento */
  const rw2 = x1 - rx0, h3 = 2.3;
  const cr = contaMuda();
  paredes(B, rx0, x1, z0, zr, y2, y2 + h3, {
    frente: { k: 'tijolo', vaos: [{ a0: 0.35, a1: 0.95, b0: 1.3, b1: 1.9, k: 'jan_vidro', fundo: 0.05 },
                                  { a0: rw2 - 1.2, a1: rw2 - 0.35, b0: 0, b1: 2.0, k: 'porta_ferro', fundo: 0.06 }].filter(v => v.a0 >= 0.1) },
    dir: { k: 'tijolo' }, esq: { k: 'tijolo' }, tras: { k: 'tijolo' }
  }, cr);
  somar(conta, cr);
  agua(B, rx0, x1, z0, y2 + h3 + 0.05, zr + 0.12, y2 + h3 + 0.25, 'fibro');
  /* o terraço: a caixa d'água grande, o guarda-sol amarelo, a mesa e
     as cadeiras vermelhas */
  caixaDagua(B, x0 + 0.8, z1 - 0.12 - 0.75, y2, 0.62);
  const ux = x0 + wb * 0.56, uz = (z1 - 0.12 + zr) / 2;
  guardaSol(B, ux, uz, y2, Math.min(1.15, (z1 - 0.12 - zr) / 2), 'guarda_sol_am');
  mesa(B, ux, uz, y2, 0.65);
  cadeira(B, ux - 0.6, uz, y2, 'o', VERMELHO_CADEIRA);
  cadeira(B, ux + 0.6, uz, y2, 'l', VERMELHO_CADEIRA);
  cadeira(B, ux, uz - 0.58, y2, 'n', VERMELHO_CADEIRA);
}

/* =======================================================
   A SEGUNDA LEVA DA FAVELA
     ESCADA   a casa de esquina de reboco cru: muro de tijolo que faz a
              curva na esquina, o portão de grade, a escada de laje por
              fora subindo pra varanda de mureta, o telhado de
              fibrocimento em pilar alto, a antena e o varal;
     VARAL    o sobrado de tijolo com a laje saltada na frente, o varal
              de roupa, o muro baixo de reboco com o portão de grade e o
              toldinho de zinco, e o poste de concreto com a luminária;
     GARAGEM  o sobrado das duas garagens: moldura de concreto ocre, os
              dois portões vermelhos de bandeira vazada, a entrada
              funda; em cima, tijolo rosado com pilar e telha de zinco;
     BASE     a casa de tijolo sobre o embasamento alto de cimento, com
              a escada da frente subindo pra plataforma da porta e a do
              lado subindo pro patamar, e os furos de ventilação.
   ======================================================= */
const OCRE = '#e1a55e', AMARELO_POSTE = '#d9a441';

/* a escada maciça de cimento: ocupa [x0,x1]×[z0,z1] e sobe de y0 a y1
   no sentido `sobe` ('x+', 'x-', 'z+', 'z-'): o piso e o espelho de
   cada degrau, os dois lados em dente e o fundo alto */
function quadroEscada(x0, x1, z0, z1, sobe) {
  const aoX = sobe[0] === 'x', pos = sobe[1] === '+';
  const L = aoX ? x1 - x0 : z1 - z0, larg = aoX ? z1 - z0 : x1 - x0;
  const dS = aoX ? [pos ? 1 : -1, 0, 0] : [0, 0, pos ? 1 : -1], dT = aoX ? [0, 0, 1] : [1, 0, 0];
  const O = [aoX ? (pos ? x0 : x1) : x0, aoX ? z0 : (pos ? z0 : z1)];
  const P = (s, t, y) => [O[0] + dS[0] * s + dT[0] * t, y, O[1] + dS[2] * s + dT[2] * t];
  return { L, larg, dS, dT, P };
}
function escadaMacica(B, x0, x1, z0, z1, y0, y1, sobe, k = 'crua') {
  const { L, larg, dS, dT, P } = quadroEscada(x0, x1, z0, z1, sobe), up = [0, 1, 0];
  const n = Math.max(3, Math.round((y1 - y0) / 0.18));
  const l0 = B.plano(P(0, 0, y0), dS, up), l1 = B.plano(P(0, larg, y0), dS, up);
  for (let i = 0; i < n; i++) {
    const s0 = L * i / n, s1 = L * (i + 1) / n, ya = y0 + (y1 - y0) * i / n, yb = y0 + (y1 - y0) * (i + 1) / n;
    B.ladrilhar(B.plano(P(s0, 0, yb), dS, dT), B.ret(0, s1 - s0, 0, larg), k);
    B.ladrilhar(B.plano(P(s0, 0, ya), dT, up), B.ret(0, larg, 0, yb - ya), k, { escuro: 0.9 });
    B.ladrilhar(l0, B.ret(s0, s1, 0, yb - y0), k, { escuro: 0.85 });
    B.ladrilhar(l1, B.ret(s0, s1, 0, yb - y0), k, { escuro: 0.85 });
  }
  B.ladrilhar(B.plano(P(L, 0, y0), dT, up), B.ret(0, larg, 0, y1 - y0), k, { escuro: 0.8 });
}
/* a escada de laje: o voo de concreto com o fundo inclinado à mostra —
   o degrau em cima, a laje embaixo e o lado em trapézio — do chão (no
   pé) até `yAlto` (no alto) */
function escadaVoo(B, x0, x1, z0, z1, yAlto, sobe, k = 'crua') {
  const { L, larg, dS, dT, P } = quadroEscada(x0, x1, z0, z1, sobe), up = [0, 1, 0];
  const n = Math.max(6, Math.round(yAlto / 0.18)), esp = 0.18;
  const yU = s => Math.max(0, (yAlto - esp) * s / L);
  const l0 = B.plano(P(0, 0, 0), dS, up), l1 = B.plano(P(0, larg, 0), dS, up);
  for (let i = 0; i < n; i++) {
    const s0 = L * i / n, s1 = L * (i + 1) / n, ya = yAlto * i / n, yb = yAlto * (i + 1) / n;
    B.ladrilhar(B.plano(P(s0, 0, yb), dS, dT), B.ret(0, s1 - s0, 0, larg), k);
    B.ladrilhar(B.plano(P(s0, 0, ya), dT, up), B.ret(0, larg, 0, yb - ya), k, { escuro: 0.9 });
    const lado = [[s0, yU(s0)], [s1, yU(s1)], [s1, yb], [s0, yb]];
    B.ladrilhar(l0, lado, k, { escuro: 0.85 });
    B.ladrilhar(l1, lado, k, { escuro: 0.85 });
  }
  const H = yAlto - esp, Lf = Math.hypot(L, H);
  B.ladrilhar(B.plano(P(0, 0, 0), dT, [dS[0] * L / Lf, H / Lf, dS[2] * L / Lf]), B.ret(0, larg, 0, Lf), k, { escuro: 0.72 });
}
/* o muro que faz a curva na esquina: a volta em segmentos, face de fora
   e de dentro com o tijolo correndo contínuo, e a capa em cima */
function muroCurvo(B, Xc, Zc, r, esp, h, k) {
  const N = 6, ponto = (rr, t) => [Xc + rr * Math.sin(t), Zc + rr * Math.cos(t)];
  let acc = 0;
  for (let i = 0; i < N; i++) {
    const t0 = Math.PI / 2 * i / N, t1 = Math.PI / 2 * (i + 1) / N;
    for (const rr of [r + esp / 2, r - esp / 2]) {
      const [ax, az] = ponto(rr, t0), [bx, bz] = ponto(rr, t1), L = Math.hypot(bx - ax, bz - az);
      B.ladrilhar(B.plano([ax, 0, az], [(bx - ax) / L, 0, (bz - az) / L], [0, 1, 0]), B.ret(0, L, 0, h), k,
                  { oa: -acc * (rr / r) });
      if (rr === r + esp / 2) acc += L;
    }
    const q = [ponto(r + esp / 2, t0), ponto(r + esp / 2, t1), ponto(r - esp / 2, t1), ponto(r - esp / 2, t0)];
    B.tampa(q, h, 'laje_borda');
  }
}
/* a antena parabólica na parede de normal (nx, nz): o prato (recortado,
   na folha das grades) um palmo pra fora, olhando um pouco pro céu, e o
   braço que o segura */
function antena(B, G, x, y, z, nx, nz, d = 0.7, sai = 0.2, inc = 0.35) {
  const ux = nz, uz = -nx;
  const cx = x + nx * sai, cz = z + nz * sai;
  const V = [-nx * Math.sin(inc), Math.cos(inc), -nz * Math.sin(inc)];
  G.esticar(G.plano([cx - ux * d / 2 - V[0] * d / 2, y - V[1] * d / 2, cz - uz * d / 2 - V[2] * d / 2], [ux, 0, uz], V), 0, d, 0, d, 'antena');
  B.caixa(Math.min(x, cx) - 0.02, Math.max(x, cx) + 0.02, y - 0.03, y + 0.03, Math.min(z, cz) - 0.02, Math.max(z, cz) + 0.02,
          { todas: { k: 'laje_borda', tinta: '#9a9c9c' }, base: null });
}
/* o varal ao longo de x: o fio e a roupa pendurada (recortada) */
function varalDe(B, G, x0, x1, y, z) {
  B.caixa(x0, x1, y - 0.008, y + 0.008, z - 0.008, z + 0.008, { todas: { k: 'laje_borda', tinta: '#3a3a3a' }, base: null });
  G.ladrilhar(G.plano([x0, y - 0.6, z], [1, 0, 0], [0, 1, 0]), G.ret(0, x1 - x0, 0, 0.6), 'varal');
}
/* o poste de concreto: o fuste afunilado, as duas cruzetas com os
   isoladores, a luminária e o transformador — tudo ao longo de x, que
   é o que cabe no lote */
function poste(B, cx, cz, alt) {
  B.torno(cx, cz, [[0.13, 0], [0.085, alt], [0, alt + 0.02]], 8, 'crua');
  for (const [y, meia] of [[alt - 0.5, 0.72], [alt - 1.2, 0.62]]) {
    B.caixa(cx - meia, cx + meia, y, y + 0.1, cz - 0.05, cz + 0.05, { todas: 'laje_borda', base: null });
    for (let k = 0; k < 4; k++) {
      const x = cx - meia + 0.1 + k * (2 * meia - 0.2) / 3;
      B.caixa(x - 0.03, x + 0.03, y + 0.1, y + 0.22, cz - 0.03, cz + 0.03, { todas: { k: 'lisa', tinta: '#f4f4f0' }, base: null });
    }
  }
  const yl = alt - 2.6;
  B.caixa(cx, cx + 0.95, yl, yl + 0.06, cz - 0.03, cz + 0.03, { todas: { k: 'laje_borda', tinta: '#b8baba' }, base: null });
  B.caixa(cx + 0.72, cx + 1.25, yl - 0.08, yl + 0.06, cz - 0.12, cz + 0.12, { todas: { k: 'lisa', tinta: '#c8cacb' }, base: null });
  B.torno(cx - 0.34, cz, [[0.2, alt - 3.4], [0.2, alt - 2.72], [0.1, alt - 2.64], [0, alt - 2.62]], 8, 'crua');
}
/* o desenho feito do lado canônico e espelhado em x (a esquina do lado
   de lá): os vértices trocam de lado, e as paredes que o bairro usa pro
   decalque também */
function espelhado(B, G, W, conta, fn) {
  const B2 = Construtor('casas'), G2 = Construtor('grades'), c2 = contaMuda();
  fn(B2, G2, c2);
  for (const [C, Dst] of [[B2, B], [G2, G]]) {
    for (let i = 0; i < C.pos.length; i += 3) Dst.pos.push(W - C.pos[i], C.pos[i + 1], C.pos[i + 2]);
    for (const v of C.uv) Dst.uv.push(v);
    for (const v of C.cor) Dst.cor.push(v);
  }
  somar(conta, c2);
  for (const f of c2.frentes) conta.frentes.push({ x0: W - f.x1, x1: W - f.x0, y0: f.y0, y1: f.y1, z: f.z,
    vaos: f.vaos.map(v => Object.assign({}, v, { a0: W - v.a1, a1: W - v.a0 })) });
  for (const o of c2.obst) conta.obst.push(Object.assign({}, o, { a0: W - o.a1, a1: W - o.a0 }));
}

/* ---------------- A CASA DA ESCADA DE FORA ---------------- */
function escada(B, p, l, conta, G) {
  /* o desenho é da esquina à direita, como na foto; com a esquina do
     outro lado ele sai espelhado */
  if (l.esquina === 'esq') return espelhado(B, G, p.W, conta, (B2, G2, c2) => escadaDireita(B2, p, l, c2, G2));
  escadaDireita(B, p, l, conta, G);
}
function escadaDireita(B, p, l, conta, G) {
  const { s, W, D } = p;
  const zm = -p.rec, zmi = zm - 0.14, hm = 1.7, z0 = -D + 0.04;
  const yd = clamp(D - 3.1, 1.2, 1.8), zc = zmi - yd;           // o quintal da frente e a frente da casa
  const xs = clamp(W * 0.4, 2.2, 3.4);                           // a varanda, à esquerda
  const rc = 0.9;                                                // o raio da curva do muro
  const L = clamp(W - rc - 0.35 - xs, 2.3, 3.4), xb = xs + L;    // a escada: do pé (xb) ao alto (xs)
  const h1 = 2.8, lj = 0.2, y2 = h1 + lj, h2 = 2.6, topo = y2 + h2;
  const zv = zm - 0.42;                                          // a beira da varanda
  /* o muro de tijolo: o trecho da esquerda, o portão de grade, o
     trecho da direita, a curva e o lado */
  const gw = 1.9, gx0 = clamp(xb - 1.35, xs + 0.2, W - rc - 0.3 - gw), gx1 = gx0 + gw;
  const tij = { todas: 'tijolo', topo: 'laje_borda', base: null };
  const xCurva = W - 0.11 - rc;
  B.caixa(0.04, gx0 - 0.12, 0, hm, zmi, zm, tij);
  B.caixa(gx1 + 0.12, xCurva, 0, hm, zmi, zm, tij);
  for (const x of [gx0 - 0.12, gx1]) B.caixa(x, x + 0.12, 0, 2.0, zmi, zm, { todas: 'crua', base: null });
  G.ladrilhar(G.plano([gx0, 0, zm - 0.07], [1, 0, 0], [0, 1, 0]), G.ret(0, gw, 0, 1.9), 'ferrugem');
  muroCurvo(B, xCurva, zm - 0.07 - rc, rc, 0.14, hm, 'tijolo');
  B.caixa(W - 0.18, W - 0.04, 0, hm, zc, zm - 0.07 - rc, tij);
  conta.portas++;
  conta.frentes.push({ x0: 0.04, x1: gx0 - 0.12, y0: 0, y1: hm, z: zm, vaos: [] },
                     { x0: gx1 + 0.12, x1: xCurva, y0: 0, y1: hm, z: zm, vaos: [] });
  /* o chão de cimento do quintal e a bananeira no canto da curva */
  B.tampa([[0.18, zmi], [W - 0.18, zmi], [W - 0.18, zc], [0.18, zc]], 0.03, 'laje');
  if (W - 0.8 > xb + 0.2) bananeira(G, W - 0.75, (zmi + zc) / 2 - 0.1, 0.03, 2.1, Math.PI / 4);
  /* a casa: o térreo de reboco cru (a porta e o vitrô de grade debaixo
     da varanda, a janela verde de grade depois da escada) */
  const cm = contaMuda();
  const w = W - 0.08;
  const vT = [{ a0: 0.4, a1: 1.25, b0: 0, b1: 2.1, k: 'porta_ferro', fundo: 0.07 }];
  if (xs >= 2.9) vT.push({ a0: 1.55, a1: 2.75, b0: 1.1, b1: 2.0, k: 'jan_grade_branca', fundo: 0.06 });
  if (w - (xb + 0.2) >= 1.0) vT.push({ a0: xb + 0.25, a1: xb + 1.05, b0: 0.9, b1: 2.1, k: 'jan_verde_grade', fundo: 0.06 });
  paredes(B, 0.04, W - 0.04, z0, zc, 0, h1, { frente: { k: 'crua', vaos: vT }, dir: { k: 'crua' }, esq: { k: 'crua' },
          tras: { k: 'crua', vaos: distribuir(w, ['basc'], 0.05) } }, cm);
  faixa(B, 0.04, W - 0.04, z0, zc, h1, y2, 0.03, 'laje_borda', null);
  /* o andar de cima: a porta escura e o vitrô dando pra varanda, e a
     janela verde de grade no pedaço da escada */
  const vC = [{ a0: 0.35, a1: 1.2, b0: 0, b1: 2.05, k: 'porta_escura', fundo: 0.08 }];
  if (xs >= 2.9) vC.push({ a0: 1.5, a1: 2.7, b0: 1.0, b1: 1.9, k: 'jan_grade_branca', fundo: 0.06 });
  for (let x = xs + 0.45; x + 0.8 <= w - 0.25; x += 1.15) vC.push({ a0: x, a1: x + 0.8, b0: 0.8, b1: 2.0, k: 'jan_verde_grade', fundo: 0.06 });
  paredes(B, 0.04, W - 0.04, z0, zc, y2, topo, { frente: { k: 'crua', vaos: vC }, dir: { k: 'crua' }, esq: { k: 'crua' },
          tras: { k: 'crua', vaos: distribuir(w, ['basc'], 0.05) } }, cm);
  somar(conta, cm);
  /* a varanda: a laje saltada por cima do quintal, a mureta de tijolo e
     os dois pilares altos da frente, que vão até o telhado */
  B.caixa(0.04, xs, h1, y2, zc, zv, { todas: 'laje_borda', topo: 'laje', tras: null });
  B.caixa(0.04, xs, y2, y2 + 1.0, zv - 0.12, zv, tij);
  B.caixa(0.04, 0.16, y2, y2 + 1.0, zc, zv - 0.12, tij);
  B.caixa(xs - 0.12, xs, y2, y2 + 1.0, zc + 0.95, zv - 0.12, tij);
  for (const x of [0.14, xs - 0.1]) B.caixa(x - 0.1, x + 0.1, 0, topo + 0.32, zv - 0.2, zv, { todas: 'crua', base: null });
  /* a escada de laje, rente à casa, do portão até a varanda */
  escadaVoo(B, xs, xb, zc + 0.02, zc + 0.92, y2, 'x-');
  conta.obst.push({ a0: xs, a1: xb, b0: 0, b1: y2 + 0.2 });
  /* o telhado de fibrocimento: cobre a casa e a varanda, e do lado da
     escada chega até a beira dela */
  const yF = topo + 0.34, yT = topo + 0.08, zF = zv + 0.05;
  const yEm = z => yT + (yF - yT) * (z - z0) / (zF - z0);
  agua(B, 0.04, xs, z0, yT, zF, yF, 'fibro');
  agua(B, xs, W - 0.04, z0, yT, zc + 0.98, yEm(zc + 0.98), 'fibro');
  /* a antena e o varal */
  if (W - 0.75 > xs + 1.6) antena(B, G, W - 0.7, y2 + 1.65, zc, 0, 1);
  varalDe(B, G, 0.3, xs - 0.3, topo - 0.1, zv - 0.4);
}

/* ---------------- O SOBRADO DO VARAL ---------------- */
function varal(B, p, l, conta, G) {
  const { s, W, D } = p;
  const zm = -p.rec, zmi = zm - 0.14, hm = 1.1, z0 = -D + 0.04;
  const yd = clamp(D - 3.5, 0.8, 1.25), zc = zmi - yd;
  const x0 = 0.04, x1 = W - 0.04, wb = x1 - x0;
  const h1 = 2.7, lj = 0.2, y2 = h1 + lj, h2 = 2.5, topo = y2 + h2;
  const gw = 1.0, gx1 = W - 0.25, gx0 = gx1 - gw;
  /* o muro baixo de reboco encardido (é nele que picham) */
  B.caixa(0.04, gx0 - 0.1, 0, hm, zmi, zm, { todas: { k: 'suja', tinta: '#dcd8cf' }, topo: { k: 'laje_borda' }, base: null });
  conta.frentes.push({ x0: 0.04, x1: gx0 - 0.1, y0: 0, y1: hm, z: zm, vaos: [] });
  /* o portão de grade entre o pilarzinho de cimento e o poste amarelo,
     com o toldinho de zinco caindo da parede da casa */
  B.caixa(gx0 - 0.1, gx0, 0, 2.1, zmi, zm, { todas: 'crua', base: null });
  B.caixa(gx1, gx1 + 0.15, 0, 2.35, zmi, zm, { todas: { k: 'lisa', tinta: AMARELO_POSTE }, base: null });
  G.ladrilhar(G.plano([gx0, 0, zm - 0.07], [1, 0, 0], [0, 1, 0]), G.ret(0, gw, 0, 2.0), 'ferrugem');
  agua(B, gx0 - 0.2, gx1 + 0.15, zc, 2.55, zm, 2.3, 'zinco');
  conta.portas++;
  B.tampa([[0.18, zmi], [W - 0.18, zmi], [W - 0.18, zc], [0.18, zc]], 0.03, 'laje');
  /* o térreo de tijolo: a janela de madeira e, atrás do portão, a porta
     aberta pro corredor branco */
  const cm = contaMuda();
  const jan = { a0: wb * 0.16, a1: wb * 0.16 + 1.0, b0: 1.0, b1: 2.1, k: 'jan_madeira', fundo: 0.07 };
  const aberta = { a0: gx0 - x0 + 0.02, a1: gx0 - x0 + 0.92, b0: 0, b1: 2.15, k: 'lisa', fundo: 0.9, requadro: 'lisa', tinta: '#efeee8' };
  paredes(B, x0, x1, z0, zc, 0, h1, { frente: { k: 'tijolo', vaos: [jan, aberta] }, dir: { k: 'tijolo' }, esq: { k: 'tijolo' },
          tras: { k: 'tijolo', vaos: distribuir(wb, ['basc'], 0.05) } }, cm);
  const meio = x0 + (jan.a1 + aberta.a0) / 2;
  for (const x of [x0 + 0.11, meio, x1 - 0.11]) { pilar(B, x, zc, 0, h1); pilar(B, x, zc, y2, topo); }
  /* a laje saltada na frente, sem guarda-corpo: é a varandinha */
  faixa(B, x0, x1, z0, zc, h1, y2, 0.6, 'laje_borda', null);
  /* o andar de cima: a janela de madeira e a porta de chapa marrom que
     dá pra laje saltada */
  paredes(B, x0, x1, z0, zc, y2, topo, { frente: { k: 'tijolo', vaos: [
            { a0: wb * 0.12, a1: wb * 0.12 + 1.0, b0: 0.95, b1: 2.05, k: 'jan_madeira', fundo: 0.07 },
            { a0: wb * 0.64, a1: wb * 0.64 + 0.85, b0: 0, b1: 2.05, k: 'porta_ferro', fundo: 0.07, tinta: '#8a5a44' }] },
          dir: { k: 'tijolo' }, esq: { k: 'tijolo' }, tras: { k: 'tijolo' } }, cm);
  somar(conta, cm);
  /* a laje de cima com o ferro de espera e a caixa d'água */
  faixa(B, x0, x1, z0, zc, topo, topo + 0.2, 0.05, 'laje_borda', null);
  tampo(B, x0, x1, z0, zc, topo + 0.2, 'laje');
  ferros(B, x0, x1, z0, zc, topo + 0.2);
  caixaDagua(B, x1 - 0.8, z0 + 0.8, topo + 0.2);
  /* o varal na frente do andar de cima, em cima da laje saltada, e o
     poste da rua com a antena */
  varalDe(B, G, x0 + wb * 0.4, x1 - 0.3, y2 + 1.95, zc + 0.35);
  const pz = zmi - 0.28;
  poste(B, 0.9, pz, 8.4);
  antena(B, G, 0.9, 4.4, pz, 0, 1, 0.6);
}

/* ---------------- O SOBRADO DAS DUAS GARAGENS ---------------- */
function garagem(B, p, l, conta, G) {
  const { s, W, D } = p;
  const x0 = 0.04, x1 = W - 0.04, wb = x1 - x0, z1 = -p.rec, z0 = -D + 0.04;
  const h1 = 2.6, h2 = 2.5, topo = h1 + h2, pl = 0.3;
  /* a moldura de concreto ocre com os dois portões vermelhos e a
     entrada funda da esquerda */
  const gw = clamp((wb - 3 * pl - 1.0) / 2, 1.9, 2.6), ew = wb - 3 * pl - 2 * gw - 0.12;
  const e0 = pl, e1 = pl + ew, g10 = e1 + 0.12, g11 = g10 + gw, g20 = g11 + pl, g21 = g20 + gw;
  const vaos = [{ a0: e0, a1: e1, b0: 0, b1: 2.3, k: 'porta_alu', fundo: 0.9, requadro: 'lisa' },
                { a0: g10, a1: g11, b0: 0, b1: 2.3, k: 'portao_vermelho', fundo: 0.12, requadro: 'crua' },
                { a0: g20, a1: g21, b0: 0, b1: 2.3, k: 'portao_vermelho', fundo: 0.12, requadro: 'crua' }];
  B.fachada(B.plano([x0, 0, z1], [1, 0, 0], [0, 1, 0]), wb, h1, 'lisa', vaos, { tinta: OCRE });
  for (const [a, b] of [[0, pl], [g11, g20], [wb - pl, wb]])
    B.caixa(x0 + a, x0 + b, 0, 2.3, z1, z1 + 0.05, { todas: { k: 'lisa', tinta: OCRE }, tras: null, base: null });
  B.caixa(x0, x1, 2.3, h1, z1, z1 + 0.05, { todas: { k: 'lisa', tinta: OCRE }, tras: null });
  conta.portas += 3;
  conta.frentes.push({ x0, x1, y0: 0, y1: h1, z: z1 + 0.05,
                       vaos: vaos.map(v => ({ a0: x0 + v.a0, a1: x0 + v.a1, b0: v.b0, b1: v.b1, k: v.k, fundo: v.fundo + 0.05 })) });
  paredes(B, x0, x1, z0, z1, 0, h1, { dir: { k: 'crua' }, esq: { k: 'crua' }, tras: { k: 'crua', vaos: distribuir(wb, ['basc'], 0.05) } }, null);
  /* em cima: o tijolo rosado sem reboco, o pilar de concreto nas quinas
     e no meio, as duas janelas de alumínio e a antena */
  const vC = [{ a0: wb * 0.14, a1: wb * 0.14 + 1.2, b0: 0.85, b1: 1.85, k: 'jan_alu4', fundo: 0.06 },
              { a0: wb * 0.62, a1: wb * 0.62 + 1.2, b0: 0.85, b1: 1.85, k: 'jan_alu4', fundo: 0.06 }];
  paredes(B, x0, x1, z0, z1, h1, topo, { frente: { k: 'tijolo_rosa', vaos: vC }, dir: { k: 'crua' }, esq: { k: 'crua' },
          tras: { k: 'tijolo_rosa' } }, conta);
  for (const x of [x0 + 0.11, x0 + (g11 + g20) / 2, x1 - 0.11]) {
    pilar(B, x, z1, h1, topo);
    conta.obst.push({ a0: x - 0.14, a1: x + 0.14, b0: h1, b1: topo });
  }
  antena(B, G, x0 + wb * 0.62 - 0.45, h1 + 1.3, z1, 0, 1, 0.62, 0.12, 0.25);
  conta.obst.push({ a0: x0 + wb * 0.62 - 0.9, a1: x0 + wb * 0.62, b0: h1 + 0.9, b1: h1 + 1.7 });
  /* o telhado de zinco caindo pro fundo, saindo um palmo na frente */
  agua(B, x0, x1, z0, topo + 0.05, Math.min(-0.02, z1 + 0.06), topo + 0.28, 'zinco');
}

/* ---------------- A CASA DO EMBASAMENTO ---------------- */
function base(B, p, l, conta, G) {
  const { s, W, D } = p;
  const z1 = -p.rec, z0 = -D + 0.04;
  const sw = 1.05, bx0 = 0.04 + sw, bx1 = W - 0.04, bw = bx1 - bx0;   // a escada do lado, à esquerda
  const pd = 1.05, zc = z1 - pd;                                      // a plataforma da porta
  const yb = 0.95, h1 = 2.6, lj = 0.2, y2 = yb + h1 + lj, h2 = 2.5, topo = y2 + h2;
  const dd = zc - z0;
  /* o embasamento de cimento, e a casa em cima dele */
  B.caixa(bx0, bx1, 0, yb, z0, zc, { todas: 'crua', topo: null, base: null });
  /* o térreo: a janela de cortina e a porta de veneziana na frente; no
     lado, a porta do patamar e a janela */
  const pc = bw - 1.05;
  const cm = contaMuda();
  paredes(B, bx0, bx1, z0, zc, yb, yb + h1, {
    frente: { k: 'tijolo', vaos: [{ a0: bw * 0.16, a1: bw * 0.16 + 1.4, b0: 0.9, b1: 2.1, k: 'jan_cortina', fundo: 0.07 },
                                  { a0: pc - 0.45, a1: pc + 0.45, b0: 0, b1: 2.1, k: 'porta_vene', fundo: 0.07 }] },
    esq: { k: 'tijolo', vaos: [{ a0: 0.3, a1: 1.15, b0: 0, b1: 2.1, k: 'porta_vene', fundo: 0.07 }]
                               .concat(dd >= 2.9 ? [{ a0: dd - 1.25, a1: dd - 0.45, b0: 1.0, b1: 1.9, k: 'jan2', fundo: 0.06 }] : []) },
    dir: { k: 'tijolo' }, tras: { k: 'tijolo', vaos: distribuir(bw, ['jan2'], 0.06) }
  }, cm);
  for (const x of [bx0 + 0.11, bx0 + bw * 0.16 + 1.62, bx1 - 0.11]) pilar(B, x, zc, yb, yb + h1);
  faixa(B, bx0, bx1, z0, zc, yb + h1, y2, 0.06, 'laje_borda', null);
  /* o andar de cima, com a fiada de furo de ventilação embaixo da laje */
  paredes(B, bx0, bx1, z0, zc, y2, topo - 0.3, {
    frente: { k: 'tijolo', vaos: distribuir(bw, ['jan2', 'jan2'], 0.07) },
    esq: { k: 'tijolo', vaos: [{ a0: dd / 2 - 0.6, a1: dd / 2 + 0.6, b0: 0.9, b1: 1.95, k: 'jan2', fundo: 0.06 }] },
    dir: { k: 'tijolo' }, tras: { k: 'tijolo' }
  }, cm);
  somar(conta, cm);
  paredes(B, bx0, bx1, z0, zc, topo - 0.3, topo, { frente: { k: 'tijolo_furos' }, esq: { k: 'tijolo_furos' },
          dir: { k: 'tijolo_furos' }, tras: { k: 'tijolo_furos' } }, null);
  for (const x of [bx0 + 0.11, bx1 - 0.11]) pilar(B, x, zc, y2, topo);
  faixa(B, bx0, bx1, z0, zc, topo, topo + 0.2, 0.1, 'laje_borda', null);
  tampo(B, bx0, bx1, z0, zc, topo + 0.2, 'laje');
  /* a plataforma da porta da frente e a escada subindo pra ela */
  const px1 = bx1 - 0.3, px0 = px1 - 1.4;
  B.caixa(px0, px1, 0, yb, zc, z1, { todas: 'crua', base: null });
  escadaMacica(B, px0 - 1.3, px0, zc + 0.02, z1, 0, yb, 'x+');
  /* o patamar da porta do lado e a escada do lado subindo pra ele */
  const zp1 = z0 + 1.35;
  B.caixa(0.04, bx0, 0, yb, z0 + 0.05, zp1, { todas: 'crua', base: null });
  escadaMacica(B, 0.04, bx0, zp1, Math.min(zp1 + 1.4, zc), 0, yb, 'z-');
  /* o decalque vai no cimento do embasamento, na frente, fora da escada */
  conta.frentes.push({ x0: bx0, x1: px0 - 1.3, y0: 0, y1: yb, z: zc, vaos: [] });
}

/* =======================================================
   O GALPÃO E O PRÉDIO COMUM
     G1  o galpão de platibanda: bloco de cimento aparente (ou reboco
         pintado), a frente alta escondendo o telhado de duas águas, o
         portão de correr de chapa com a porta de pedestre — ou, no
         comércio, as portas de enrolar e o letreiro na platibanda —,
         o aviso pintado, a fileira de vitrô alto nos lados e o cano;
     G2  o galpão de telhado em arco: a abóbada de zinco, o oitão em
         arco com a veneziana, o portão de correr e o vitrô alto;
     P1  o predinho de reboco pintado: a faixa da escada em tijolo de
         vidro com a porta do prédio embaixo, a sacada embutida com o
         gradil, o ar-condicionado, o friso de cada andar, a platibanda
         e a casinha da caixa d'água; embaixo, a garagem, o vitrô de
         grade ou o comércio;
     P2  o prédio de tijolo e concreto que foi subindo: os andares
         cheios, e o último é um puxadinho no fundo com o terraço, a
         mureta, o ferro de espera e a caixa d'água.
   ======================================================= */
function alturasGalpao(p) {
  const wb = p.W - 0.1;
  const hE = clamp(p.H - 0.9, 3.6, 5.4);                      // a altura do beiral (a parede do lado)
  const rr = (wb / 2) * Math.tan(10 * Math.PI / 180);         // quanto a cumeeira sobe
  const hP = hE + rr + 0.45;                                  // o alto da platibanda da frente
  const hPorta = clamp(hE - 0.9, 2.6, 3.6);                   // o portão e a porta de enrolar
  return { wb, hE, rr, hP, hPorta };
}
/* uma água de telhado que cai pro lado: de (xA, yA) a (xB, yB), de z0 a z1
   (a cumeeira do galpão corre no sentido do fundo) */
function aguaX(B, z0, z1, xA, yA, xB, yB, k) {
  const dx = xB - xA, dy = yB - yA, L = Math.hypot(dx, dy);
  B.ladrilhar(B.plano([xA, yA, z1], [0, 0, -1], [dx / L, dy / L, 0]), B.ret(0, z1 - z0, 0, L), k);
}
const vaosAbs = (x0, vaos) => vaos.map(v => ({ a0: x0 + v.a0, a1: x0 + v.a1, b0: v.b0, b1: v.b1, k: v.k, fundo: v.fundo || 0 }));
const contarVaos = (conta, vaos) => { for (const v of vaos) { if (E_PORTA(v.k)) conta.portas++; else if (!v.k.startsWith('aviso')) conta.janelas++; } };
/* a fileira de vitrô alto de uma parede de comprimento `L` */
const vitrosAltos = (L, hE) => {
  const out = [];
  for (let a = 0.6; a + 1.6 <= L - 0.4; a += 2.4) out.push({ a0: a, a1: a + 1.6, b0: hE - 1.05, b1: hE - 0.35, k: 'vitro_alto', fundo: 0.06 });
  return out;
};

/* ---------------- G1: o galpão de platibanda ---------------- */
function g1(B, p, l, conta, G) {
  const { s, W, D } = p;
  const x0 = 0.05, x1 = W - 0.05, z1 = -p.rec, z0 = -D + 0.05, dd = z1 - z0;
  const { wb, hE, rr, hP, hPorta } = alturasGalpao(p);
  const kP = p.parede, tinta = kP === 'lisa' ? escolher(s, 'cor', TINTAS.g) : null;
  const Ff = B.plano([x0, 0, z1], [1, 0, 0], [0, 1, 0]);
  if (wb < 1.6 || dd < 1.4) {
    /* o galpão espremido (o lote que sobrou do lado de um marco): a
       porta, a parede e a laje */
    const vaos = [{ a0: (wb - 0.85) / 2, a1: (wb + 0.85) / 2, b0: 0, b1: 2.1, k: 'porta_ferro', fundo: 0.06 }];
    paredes(B, x0, x1, z0, z1, 0, hE, { frente: { k: kP, tinta, vaos }, dir: { k: kP, tinta }, esq: { k: kP, tinta }, tras: { k: kP, tinta } }, conta);
    tampo(B, x0, x1, z0, z1, hE, 'laje');
    return;
  }
  /* a frente: o portão de correr (ou as portas de enrolar do comércio),
     a porta de pedestre e, na platibanda, o aviso pintado */
  const vaos = [];
  if (l.placa) {
    const n = wb >= 6.8 ? 2 : 1, pw = wb >= 2.8 ? 0.85 : 0;
    const rw = Math.min(3.2, (wb - 0.5 - (pw ? pw + 0.4 : 0) - (n - 1) * 0.35) / n);
    let a = 0.25;
    for (let i = 0; i < n; i++) {
      vaos.push({ a0: a, a1: a + rw, b0: 0.02, b1: hPorta, k: s('aberta' + i) < 0.3 ? 'enrolar_meia' : 'enrolar', fundo: 0.14, requadro: 'crua' });
      a += rw + 0.35;
    }
    if (pw) {
      vaos.push({ a0: wb - 0.25 - pw, a1: wb - 0.25, b0: 0, b1: 2.1, k: 'porta_ferro', fundo: 0.08 });
      if (hPorta >= 2.75) vaos.push({ a0: wb - 0.25 - pw, a1: wb - 0.25, b0: 2.3, b1: Math.min(hPorta, 3.0), k: 'vitro_alto', fundo: 0.06 });
    }
  } else {
    const pw = wb >= 3.4 ? 0.85 : 0;
    const gw = Math.min(3.6, wb - 0.45 - (pw ? pw + 0.4 : 0));
    const esq = s('lado') < 0.5, g0 = esq ? 0.2 : wb - 0.2 - gw;
    vaos.push({ a0: g0, a1: g0 + gw, b0: 0, b1: Math.min(hPorta, gw + 0.4), k: 'portao_galpao', fundo: 0.12, requadro: 'crua' });
    if (pw) {
      const d0 = esq ? g0 + gw + 0.3 : g0 - 0.3 - pw;
      vaos.push({ a0: d0, a1: d0 + pw, b0: 0, b1: 2.1, k: 'porta_ferro', fundo: 0.08 });
      if (hPorta >= 2.75) vaos.push({ a0: d0, a1: d0 + pw, b0: 2.3, b1: Math.min(hPorta, 3.0), k: 'vitro_alto', fundo: 0.06 });
    }
    if (!pw) {
      /* o galpão estreito é só o portão: o vitrô vai em cima dele */
      const gt = Math.min(hPorta, gw + 0.4), vw = Math.min(1.6, gw - 0.2);
      if (gt + 1.0 <= hP - 0.3 && vw >= 0.8)
        vaos.push({ a0: g0 + (gw - vw) / 2, a1: g0 + (gw + vw) / 2, b0: gt + 0.35, b1: gt + 0.95, k: 'vitro_alto', fundo: 0.06 });
    }
    const alto = hP - 0.2 - (hPorta + 0.3);
    if (s('aviso') < 0.55 && wb >= 3.0 && alto >= 0.5) {
      const k = escolher(s, 'qual', ['aviso_deposito', 'aviso_oficina', 'aviso_aluga']);
      const aw = Math.min(k === 'aviso_aluga' ? 2.4 : 3.0, wb - 0.6), ah = Math.min(alto, aw * 0.7 / 3.0 * 1.2);
      vaos.push({ a0: (wb - aw) / 2, a1: (wb + aw) / 2, b0: hPorta + 0.3, b1: hPorta + 0.3 + ah, k });
    }
  }
  B.fachada(Ff, wb, hP, kP, vaos, { tinta });
  contarVaos(conta, vaos);
  conta.frentes.push({ x0, x1, y0: 0, y1: hP, z: z1, vaos: vaosAbs(x0, vaos) });
  /* a platibanda: a espessura dela, o rufo em cima e o cano de descer
     água na quina */
  const kPl = { k: kP, tinta };
  B.caixa(x0, x1, hE, hP, z1 - 0.15, z1, { frente: null, tras: kPl, dir: kPl, esq: kPl, topo: 'laje_borda', base: null });
  const cx = s('cano') < 0.5 ? x0 + 0.1 : x1 - 0.1;
  B.caixa(cx - 0.04, cx + 0.04, 0, hP - 0.25, z1, z1 + 0.04, { todas: { k: 'laje_borda', tinta: '#8d9092' }, base: null, tras: null });
  /* os lados até o beiral com a fileira de vitrô alto, o fundo com o
     oitão, e o telhado de duas águas escondido atrás da platibanda */
  const vl = vitrosAltos(dd, hE);
  paredes(B, x0, x1, z0, z1, 0, hE, { dir: { k: kP, tinta, vaos: vl }, esq: { k: kP, tinta, vaos: vl.map(v => Object.assign({}, v)) },
          tras: { k: kP, tinta, vaos: wb >= 2 ? [{ a0: wb / 2 - 0.8, a1: wb / 2 + 0.8, b0: hE - 1.05, b1: hE - 0.35, k: 'vitro_alto', fundo: 0.06 }] : [] } }, conta);
  B.ladrilhar(B.plano([x1, 0, z0], [-1, 0, 0], [0, 1, 0]), [[0, hE], [wb, hE], [wb / 2, hE + rr]], kP, { tinta });
  aguaX(B, z0, z1 - 0.15, x0, hE, W / 2, hE + rr, 'fibro');
  aguaX(B, z0, z1 - 0.15, x1, hE, W / 2, hE + rr, 'fibro');
}

/* ---------------- G2: o galpão de telhado em arco ---------------- */
function g2(B, p, l, conta, G) {
  const { s, W, D } = p;
  const x0 = 0.05, x1 = W - 0.05, z1 = -p.rec, z0 = -D + 0.05, wb = x1 - x0, dd = z1 - z0;
  const kP = p.parede, tinta = kP === 'lisa' ? escolher(s, 'cor', TINTAS.g) : null;
  const hE = clamp(p.H - 1.2, 3.4, 4.8), f = clamp(wb * 0.17, 0.6, 1.4);
  const N = 10, arco = [];
  for (let i = 0; i <= N; i++) { const t = i / N; arco.push([x0 + wb * t, hE + f * (1 - (2 * t - 1) ** 2)]); }
  /* a frente: o portão de correr grande e a porta de pedestre; em cima,
     o oitão em arco com a veneziana */
  const pw = wb >= 3.6 ? 0.85 : 0, gw = Math.min(3.8, wb - 0.5 - (pw ? pw + 0.4 : 0));
  const esq = s('lado') < 0.5, g0 = esq ? 0.25 : wb - 0.25 - gw;
  const hp = clamp(hE - 0.6, 2.6, 3.8);
  const vaos = [{ a0: g0, a1: g0 + gw, b0: 0, b1: Math.min(hp, gw + 0.3), k: 'portao_galpao', fundo: 0.12, requadro: 'crua' }];
  if (pw) {
    const d0 = esq ? g0 + gw + 0.3 : g0 - 0.3 - pw;
    vaos.push({ a0: d0, a1: d0 + pw, b0: 0, b1: 2.1, k: 'porta_ferro', fundo: 0.08 },
              { a0: d0, a1: d0 + pw, b0: 2.3, b1: Math.min(hE - 0.3, 3.0), k: 'vitro_alto', fundo: 0.06 });
  }
  const Ff = B.plano([x0, 0, z1], [1, 0, 0], [0, 1, 0]);
  B.fachada(Ff, wb, hE, kP, vaos, { tinta });
  contarVaos(conta, vaos);
  conta.frentes.push({ x0, x1, y0: 0, y1: hE, z: z1, vaos: vaosAbs(x0, vaos) });
  const oitao = arco.map(([x, y]) => [x - x0, y]);
  B.ladrilhar(Ff, oitao, kP, { tinta });
  const vw = Math.min(1.6, wb * 0.3), vh = Math.min(0.75, f * 0.6);
  B.esticar(B.plano([x0 + (wb - vw) / 2, hE + 0.1, z1 + 0.012], [1, 0, 0], [0, 1, 0]), 0, vw, 0, vh, 'veneziana_ar');
  /* o fundo (com o oitão), os lados com a fileira de vitrô alto */
  const vl = vitrosAltos(dd, hE);
  paredes(B, x0, x1, z0, z1, 0, hE, { dir: { k: kP, tinta, vaos: vl }, esq: { k: kP, tinta, vaos: vl.map(v => Object.assign({}, v)) },
          tras: { k: kP, tinta, vaos: wb >= 2 ? [{ a0: wb / 2 - 0.8, a1: wb / 2 + 0.8, b0: hE - 1.05, b1: hE - 0.35, k: 'vitro_alto', fundo: 0.06 }] : [] } }, conta);
  B.ladrilhar(B.plano([x1, 0, z0], [-1, 0, 0], [0, 1, 0]), arco.map(([x, y]) => [x1 - x, y]).reverse(), kP, { tinta });
  /* a abóbada de zinco: a onda corre na volta do arco */
  let acc = 0;
  for (let i = 0; i < N; i++) {
    const [xa, ya] = arco[i], [xb, yb] = arco[i + 1], L = Math.hypot(xb - xa, yb - ya);
    B.ladrilhar(B.plano([xa, ya, Math.min(-0.02, z1 + 0.1)], [0, 0, -1], [(xb - xa) / L, (yb - ya) / L, 0]),
                B.ret(0, Math.min(-0.02, z1 + 0.1) - z0, 0, L), 'zinco', { ob: -acc });
    acc += L;
  }
  /* a calha dos dois lados, no beiral */
  for (const x of [x0, x1 - 0.12]) B.caixa(x, x + 0.12, hE - 0.12, hE, z0, Math.min(-0.02, z1 + 0.1), { todas: { k: 'laje_borda', tinta: '#8d9092' }, base: null });
}

/* ---------------- P1: o predinho de reboco pintado ---------------- */
function p1(B, p, l, conta, G) {
  const { s, W, D } = p;
  const x0 = 0.05, x1 = W - 0.05, z1 = -p.rec, z0 = -D + 0.05, wb = x1 - x0, dd = z1 - z0;
  const n = clamp(Math.round(p.H / 2.85), 3, 4), hf = clamp((p.H - 0.7) / n, 2.6, 2.9);
  /* o térreo do comércio é mais alto: a porta de enrolar e o letreiro
     em cima dela têm de caber */
  const h0 = l.placa ? Math.max(hf, 3.35) : hf, topo = h0 + (n - 1) * hf;
  const tinta = escolher(s, 'cor', TINTAS.p1), claro = '#f3f2ee';
  const largo = wb >= 2.6 && dd >= 2.0;
  /* a faixa da escada (tijolo de vidro, com a porta do prédio embaixo)
     de um lado, o apartamento do outro */
  const ew = 0.9, eEsq = s('escada') < 0.5;
  const ex0 = largo ? (eEsq ? 0.3 : wb - 0.3 - ew) : (wb - 0.85) / 2;
  const l0 = eEsq ? ex0 + ew + 0.35 : 0.3, l1 = eEsq ? wb - 0.3 : ex0 - 0.35, lw = l1 - l0;
  const sacada = largo && lw >= 3.2 && dd >= 3.0, sEsq = s('sacada') < 0.5;
  const sw = Math.min(2.0, lw * 0.5), sa0 = sEsq ? l0 : l1 - sw;
  const garagem = !l.placa && lw >= 2.7 && s('garagem') < 0.55;
  for (let i = 0; i < n; i++) {
    const y0 = i === 0 ? 0 : h0 + (i - 1) * hf, y1 = i === 0 ? h0 : y0 + hf, vaos = [];
    let ar = null;
    if (i === 0) {
      vaos.push({ a0: ex0, a1: ex0 + 0.85, b0: 0, b1: 2.2, k: 'porta_ap', fundo: 0.1 });
      /* no predinho estreito o térreo é só a porta do prédio */
      if (largo && l.placa) vaos.push({ a0: l0, a1: l1, b0: 0.02, b1: p.porta, k: 'enrolar', fundo: 0.14, requadro: 'crua' });
      else if (largo && garagem) vaos.push({ a0: l0 + (lw - 2.4) / 2, a1: l0 + (lw + 2.4) / 2, b0: 0, b1: 2.3, k: 'portao_vermelho', fundo: 0.12, requadro: 'crua' });
      else if (largo && lw >= 1.6) vaos.push({ a0: l0 + (lw - 1.4) / 2, a1: l0 + (lw + 1.4) / 2, b0: 1.0, b1: 2.0, k: 'jan_grade', fundo: 0.07 });
    } else {
      if (largo) vaos.push({ a0: ex0 + 0.1, a1: ex0 + ew - 0.1, b0: 0.35, b1: hf - 0.25, k: 'tijolo_vidro', modo: 'ladrilho' });
      if (sacada) {
        vaos.push({ a0: sa0, a1: sa0 + sw, b0: 0.05, b1: 2.45, k: 'sacada_fundo', fundo: 0.9, tinta });
        const r0 = sEsq ? sa0 + sw + 0.35 : l0, r1 = sEsq ? l1 : sa0 - 0.35;
        if (r1 - r0 >= 1.3) {
          const c = (r0 + r1) / 2;
          vaos.push({ a0: c - 0.6, a1: c + 0.6, b0: 1.0, b1: 2.15, k: 'jan2', fundo: 0.07 });
          ar = c;
        }
      } else if (largo && lw >= 1.3) {
        const c = (l0 + l1) / 2;
        vaos.push({ a0: c - 0.6, a1: c + 0.6, b0: 1.0, b1: 2.15, k: s('cort' + i) < 0.5 ? 'jan2' : 'jan_cortina', fundo: 0.07 });
        ar = c;
      } else if (!largo) vaos.push({ a0: (wb - 0.7) / 2, a1: (wb + 0.7) / 2, b0: 1.2, b1: 2.0, k: 'jan_peq', fundo: 0.06 });
    }
    paredes(B, x0, x1, z0, z1, y0, y1, {
      frente: { k: 'lisa', tinta, vaos }, dir: { k: 'crua' }, esq: { k: 'crua' },
      tras: { k: 'crua', vaos: wb >= 1.6 ? distribuir(wb, i === 0 ? ['basc'] : ['jan2', 'basc'], 0.06) : [] }
    }, conta);
    const F = B.plano([x0, y0, z1], [1, 0, 0], [0, 1, 0]);
    if (ar !== null && s('ar' + i) < 0.55 && -z1 >= 0.34) arSplit(B, F, ar, 0.3);
    if (sacada && i > 0) {
      /* o gradil da sacada, no plano da fachada, e o corrimão */
      G.ladrilhar(G.plano([x0 + sa0, y0 + 0.05, z1 - 0.02], [1, 0, 0], [0, 1, 0]), G.ret(0, sw, 0, 1.0), 'gradil', { tw: 0.65 });
      B.caixa(x0 + sa0, x0 + sa0 + sw, y0 + 1.05, y0 + 1.1, z1 - 0.05, z1 - 0.005, { todas: { k: 'lisa', tinta: claro } });
    }
    if (i > 0) faixa(B, x0, x1, z0, z1, y0 - 0.08, y0 + 0.08, 0.04, 'lisa', claro);
  }
  /* a platibanda (mureta pintada, com a capa) e a laje; no fundo da
     laje, a casinha da caixa d'água */
  tampo(B, x0, x1, z0, z1, topo, 'laje');
  B.pintar(tinta);
  mureta(B, [[x0, z1], [x1, z1], [x1, z0], [x0, z0]], topo, 0.7, 0.15, 'lisa');
  B.pintar(null);
  if (wb >= 2.6 && dd >= 2.6) {
    const cw = Math.min(2.2, wb - 0.6), cx0 = eEsq ? x0 + 0.3 : x1 - 0.3 - cw;
    B.caixa(cx0, cx0 + cw, topo, topo + 1.5, z0 + 0.3, z0 + 0.3 + Math.min(1.8, dd - 0.8),
            { todas: { k: 'lisa', tinta: claro }, base: null });
    B.caixa(cx0 - 0.05, cx0 + cw + 0.05, topo + 1.5, topo + 1.6, z0 + 0.25, z0 + 0.35 + Math.min(1.8, dd - 0.8),
            { todas: 'laje_borda', base: null });
  }
}

/* ---------------- P2: o prédio de tijolo que foi subindo ---------------- */
function p2(B, p, l, conta, G) {
  const { s, W, D } = p;
  const x0 = 0.05, x1 = W - 0.05, z1 = -p.rec, z0 = -D + 0.05, wb = x1 - x0, dd = z1 - z0;
  const n = clamp(Math.round(p.H / 2.85), 3, 4), hf = clamp((p.H - 0.4) / n, 2.6, 2.9), lj = 0.2;
  const nc = n - 1;                                  // os andares cheios; o de cima é o puxadinho
  const h0 = l.placa ? Math.max(hf, 3.55) : hf;      // o térreo do comércio é mais alto
  const cm = contaMuda();
  for (let i = 0; i < nc; i++) {
    const y0 = i === 0 ? 0 : h0 + (i - 1) * hf, y1 = (i === 0 ? h0 : y0 + hf) - lj;
    let vaos;
    if (i === 0) {
      vaos = l.placa && wb >= 3.2
        ? [{ a0: 0.3, a1: wb - 1.4, b0: 0.02, b1: Math.min(p.porta || 2.4, y1 - y0 - 0.1), k: 'enrolar', fundo: 0.14, requadro: 'crua' },
           { a0: wb - 1.15, a1: wb - 0.3, b0: 0, b1: 2.1, k: 'porta_ferro', fundo: 0.08 }]
        : distribuir(wb, ['porta_ferro', 'jan_grade'], 0.08);
    } else vaos = distribuir(wb, wb >= 3.4 ? ['jan_alu4', s('jm' + i) < 0.5 ? 'jan_madeira' : 'jan_alu4'] : ['jan_alu4'], 0.07)
      .map(v => Object.assign(v, { b0: 0.9, b1: 1.9 }));
    paredes(B, x0, x1, z0, z1, y0, y1, {
      frente: { k: 'tijolo', vaos }, dir: { k: 'tijolo' }, esq: { k: 'tijolo' },
      tras: { k: 'tijolo', vaos: wb >= 1.6 ? distribuir(wb, ['basc'], 0.05) : [] }
    }, i === 0 ? conta : cm);
    for (const x of [x0 + 0.11, (x0 + x1) / 2, x1 - 0.11]) pilar(B, x, z1, y0, y1);
    faixa(B, x0, x1, z0, z1, y1, y1 + lj, 0.04, 'laje_borda', null);
  }
  somar(conta, cm);
  /* em cima: a laje do último andar cheio vira terraço, com a mureta de
     tijolo, e o puxadinho no fundo com a porta e a janela, a laje dele
     com o ferro de espera e a caixa d'água */
  const yT = h0 + (nc - 1) * hf;
  tampo(B, x0, x1, z0, z1, yT, 'laje');
  const qd = clamp(dd * 0.6, 1.6, Math.max(1.6, dd - 1.2)), zq = z0 + qd;
  const qx1 = wb >= 4 ? x0 + wb * 0.72 : x1, qw = qx1 - x0;
  const tij = { todas: 'tijolo', topo: 'laje_borda', base: null };
  if (zq < z1 - 0.8) {
    const c3 = contaMuda();
    paredes(B, x0, qx1, z0, zq, yT, yT + 2.4, {
      frente: { k: 'tijolo', vaos: [{ a0: 0.35, a1: 1.2, b0: 0, b1: 2.05, k: 'porta_ferro', fundo: 0.07 }]
        .concat(qw >= 2.9 ? [{ a0: qw - 1.5, a1: qw - 0.3, b0: 0.95, b1: 1.95, k: 'jan_alu4', fundo: 0.06 }] : []) },
      dir: { k: 'tijolo' }, esq: { k: 'tijolo' }, tras: { k: 'tijolo' }
    }, c3);
    somar(conta, c3);
    faixa(B, x0, qx1, z0, zq, yT + 2.4, yT + 2.6, 0.04, 'laje_borda', null);
    tampo(B, x0, qx1, z0, zq, yT + 2.6, 'laje');
    ferros(B, x0, qx1, z0, zq, yT + 2.6);
    caixaDagua(B, x0 + Math.min(0.8, qw / 2), z0 + 0.8, yT + 2.6);
    B.caixa(x0, x1, yT, yT + 0.95, z1 - 0.12, z1, tij);
    B.caixa(x0, x0 + 0.12, yT, yT + 0.95, zq, z1 - 0.12, tij);
    if (qx1 < x1) {
      B.caixa(x1 - 0.12, x1, yT, yT + 0.95, z0, z1 - 0.12, tij);
      B.caixa(qx1, x1 - 0.12, yT, yT + 0.95, z0, z0 + 0.12, tij);
    } else B.caixa(x1 - 0.12, x1, yT, yT + 0.95, zq, z1 - 0.12, tij);
  } else {
    /* lote raso: o último andar é inteiro, com os pilares subindo e a
       caixa d'água na laje */
    const c3 = contaMuda();
    paredes(B, x0, x1, z0, z1, yT, yT + 2.4, { frente: { k: 'tijolo', vaos: distribuir(wb, ['jan_alu4'], 0.07) },
            dir: { k: 'tijolo' }, esq: { k: 'tijolo' }, tras: { k: 'tijolo' } }, c3);
    somar(conta, c3);
    for (const x of [x0 + 0.11, (x0 + x1) / 2, x1 - 0.11]) pilar(B, x, z1, yT, yT + 2.4);
    faixa(B, x0, x1, z0, z1, yT + 2.4, yT + 2.6, 0.04, 'laje_borda', null);
    tampo(B, x0, x1, z0, z1, yT + 2.6, 'laje');
    ferros(B, x0, x1, z0, z1, yT + 2.6);
    const r = Math.min(0.55, dd / 2 - 0.12);
    if (r >= 0.4) caixaDagua(B, x0 + Math.min(0.8, wb / 2), (z0 + z1) / 2, yT + 2.6, r);
  }
}


/* =======================================================
   AS CASAS DE MURO — a térrea atrás do muro, do jeito das quatro fotos
   que o dono mandou (de frente e de cima):
     M1  a garagem coberta na frente, fechada pelo gradil preto sobre
         a mureta, com o portãozinho no canto; a água de telha da
         garagem entra embaixo do beiral da casa de quatro águas;
     M2  o muro alto com o requadro bege em volta do portão de garagem
         de losango e do portão de grade; atrás, a casa de quatro águas
         com a caixa d'água numa torrinha de telhado próprio;
     M3  o muro com o portãozinho de grade à esquerda, o quintal na
         frente, a casa com a janela de veneziana e a porta no corredor;
     M4  a casinha no meio do lote: o muro baixo, o portãozinho à
         direita, o quintal e uma janela.
   A foto é de lote de uns 20 m de fundo; o da cidade tem até 7. Então
   o muro é a divisa da frente, o quintal tem de 1,2 a 2,4 m e a casa
   fica com o resto — o jeito é o da foto, a medida é a do lote.
   ======================================================= */
const TINTA_MURO = ['#f1efe8', '#ebe8df', '#e6e3da', '#efe9dc', '#e2dfd8', '#ece4d4', '#e3e6e2', '#eadfca'];
/* a casa de muro é branca na foto; na cidade, cada cópia sai com a sua:
   branco, creme e os pastéis de bairro */
const CORES_CASA_MURO = ['#f3f1ea', '#ece8dc', '#e9d9b8', '#cfe0d0', '#d5e1ec', '#f0d7cf', '#efe3b4', '#e4e4e4'];
const REQUADROS = ['#c9ad84', '#b9a17c', '#d3bd96', '#a89478'];
/* A ROUPA DE CADA CÓPIA: as três de cada modelo saem diferentes —
   cor do muro e da casa, a janela, a porta, a grade, a altura do muro,
   o lado do portão e a telha, tudo do hash da posição do lote */
function roupaDoMuro(s) {
  return {
    tinta: escolher(s, 'cor', TINTA_MURO),
    casa: escolher(s, 'corCasa', CORES_CASA_MURO),
    telha: escolher(s, 'telha', TELHA.t1),
    jan: escolher(s, 'janMuro', ['jan2', 'jan_grade', 'veneziana', 'jan2']),
    porta: escolher(s, 'portaMuro', ['porta_madeira', 'porta_vene', 'porta_ferro']),
    grade: escolher(s, 'gradeMuro', ['preta', 'branca', 'preta', 'ferrugem']),
    dh: (s('altMuro') - 0.5) * 0.3,
    espelho: s('lado') < 0.5,
    bananeira: s('bananeira') < 0.45
  };
}
/* um pedaço de muro (reboco pintado, capa de laje em cima) */
const muroDe = (B, x0, x1, y1, z0, z1, tinta) =>
  B.caixa(x0, x1, 0, y1, z0, z1, { todas: { k: 'suja', tinta }, topo: 'laje_borda', base: null });
/* os muros do lado do lote, de `zA` (o muro da frente) até `zB`; `lados`
   diz quais ('e' esquerdo, 'd' direito) */
function murosDoLado(B, W, zA, zB, h, tinta, lados = 'ed') {
  if (zA - zB < 0.05) return;
  if (lados.includes('e')) muroDe(B, 0.03, 0.15, h, zB, zA, tinta);
  if (lados.includes('d')) muroDe(B, W - 0.15, W - 0.03, h, zB, zA, tinta);
}
/* a casa atrás do muro: paredes com os vãos e o telhado de quatro águas
   com o beiral (que não passa da divisa) */
function casaDoMuro(B, p, r, x0, x1, z0, z1, h, vf, lados, conta) {
  const { W, D } = p;
  paredes(B, x0, x1, z0, z1, 0, h, {
    frente: { k: 'suja', tinta: r.casa, vaos: vf },
    dir: { k: 'suja', tinta: r.casa, vaos: lados.dir || [] }, esq: { k: 'suja', tinta: r.casa, vaos: lados.esq || [] },
    tras: { k: 'suja', tinta: r.casa, vaos: (x1 - x0) >= 1.6 ? distribuir(x1 - x0, ['jan2'], 0.06) : [] }
  }, conta);
  const xa = Math.max(0.03, x0 - 0.25), xb = Math.min(W - 0.03, x1 + 0.25);
  const za = Math.max(-D + 0.03, z0 - 0.25), zb = z1 + 0.3;
  B.pintar(r.telha);
  B.telhado4(xa, xb, za, zb, h - 0.08, clamp(Math.min(xb - xa, zb - za) * 0.24, 0.8, 1.3), 'telha', 'telha');
  B.pintar(null);
}
/* o portão de pedestre de grade, entre dois pilares mais altos que o muro */
function portaozinho(B, G, xg0, xg1, zm, e, hp, tinta, grade) {
  muroDe(B, xg0 - 0.22, xg0, hp, zm - e, zm, tinta);
  muroDe(B, xg1, xg1 + 0.22, hp, zm - e, zm, tinta);
  G.ladrilhar(G.plano([xg0, 0.02, zm - e / 2], [1, 0, 0], [0, 1, 0]), G.ret(0, xg1 - xg0, 0, Math.min(2.0, hp - 0.15)), grade);
}
/* o modelo é desenhado com o portão de um lado; a cópia com a roupa
   "espelho" sai do outro */
const comEspelho = fn => (B, p, l, conta, G) => {
  const r = roupaDoMuro(p.s);
  if (r.espelho) return espelhado(B, G, p.W, conta, (B2, G2, c2) => fn(B2, p, l, c2, G2, r));
  fn(B, p, l, conta, G, r);
};

/* ---------------- M1: a garagem coberta com o gradil ---------------- */
const m1 = comEspelho((B, p, l, conta, G, r) => {
  const { s, W, D } = p;
  const e = 0.13, zm = -0.03, zmi = zm - e, hm = 0.55, hp = 2.45 + r.dh;
  const dG = clamp(D * 0.4, 1.6, 2.4), zc = zmi - dG, h = 2.8;
  /* a frente: pilar, a mureta com o gradil em cima, o portãozinho e o pilar do canto */
  const grade = r.grade === 'ferrugem' ? 'preta' : r.grade;
  const pw = 0.9, xg1 = W - 0.25, xg0 = xg1 - pw;
  muroDe(B, 0.03, 0.28, hp, zmi, zm, r.tinta);
  muroDe(B, 0.28, xg0 - 0.22, hm, zmi, zm, r.tinta);
  G.ladrilhar(G.plano([0.28, hm, zm - e / 2], [1, 0, 0], [0, 1, 0]), G.ret(0, xg0 - 0.5, 0, hp - 0.12 - hm), grade);
  portaozinho(B, G, xg0, xg1, zm, e, hp, r.tinta, grade);
  muroDe(B, xg1 + 0.22, W - 0.03, hp, zmi, zm, r.tinta);
  conta.portas += 2;
  conta.frentes.push({ x0: 0.28, x1: xg0 - 0.22, y0: 0, y1: hm, z: zm, vaos: [] });
  /* o chão da garagem, as paredes do lado e a água de telha caindo pra rua */
  B.tampa([[0.15, zmi], [W - 0.15, zmi], [W - 0.15, zc], [0.15, zc]], 0.02, 'crua');
  murosDoLado(B, W, zmi, zc, hp - 0.05, r.tinta);
  const yA = 2.6, yB = Math.min(2.36, hp - 0.09), zE = zmi - 0.02;
  const V = [0, yA - yB, zc - zE], Lv = Math.hypot(V[1], V[2]);
  B.ladrilhar(B.plano([0.03, yB, zE], [1, 0, 0], [0, V[1] / Lv, V[2] / Lv]), B.ret(0, W - 0.06, 0, Lv), 'telha', { tinta: r.telha });
  B.caixa(0.03, W - 0.03, yB - 0.14, yB + 0.02, zE - 0.06, zE, { todas: { k: 'lisa', tinta: BRANCO }, base: null });
  /* a casa: a porta e as janelas atrás da garagem */
  const x0 = 0.05, x1 = W - 0.05, z0 = -D + 0.05, wb = x1 - x0;
  let vf = distribuir(wb, wb < 5.2 ? [r.porta, r.jan] : [r.porta, r.jan, r.jan], 0.07);
  if (s('esp') < 0.5) vf = espelhar(vf, wb);
  const lado = z0 < zc - 3 ? [{ a0: 0.6, a1: 1.2, b0: 1.5, b1: 2.1, k: 'basc', fundo: 0.06 }] : [];
  casaDoMuro(B, p, r, x0, x1, z0, zc, h, vf, { dir: lado }, conta);
});

/* ---------------- M2: o muro alto, o requadro bege e a torrinha da caixa ---------------- */
function m2(B, p, l, conta, G) {
  const { s, W, D } = p;
  const r = roupaDoMuro(s);
  /* o muro alto nunca fica abaixo do requadro (2,31 m) */
  const e = 0.14, zm = -0.03, zmi = zm - e, hm = 2.4 + Math.max(0, r.dh);
  const dG = clamp(D * 0.36, 1.5, 2.2), zc = zmi - dG, h = 2.85;
  /* a abertura no requadro: o portão de garagem e o de pedestre de grade */
  const q = 0.16, hA = 2.15, pw = 0.9, gw = clamp(W - 2.3, 2.0, 2.6), meio = 0.12;
  const esq = r.espelho;
  const req = { todas: { k: 'lisa', tinta: escolher(s, 'requadro', REQUADROS) }, base: null };
  const portao = s('portao') < 0.65 ? 'portao_losango' : 'portao_chapa';
  const a0 = esq ? 0.45 : W - 0.45 - (gw + meio + pw), a1 = a0 + gw + meio + pw;
  muroDe(B, 0.03, a0 - q, hm, zmi, zm, r.tinta);
  muroDe(B, a1 + q, W - 0.03, hm, zmi, zm, r.tinta);
  B.caixa(a0 - q, a1 + q, hA + q, hm, zmi, zm, { todas: { k: 'suja', tinta: r.tinta }, topo: 'laje_borda', base: null });
  /* o requadro, 3 cm pra fora, e a coluna do meio */
  B.caixa(a0 - q, a0, 0, hA + q, zmi, zm + 0.03, req);
  B.caixa(a1, a1 + q, 0, hA + q, zmi, zm + 0.03, req);
  B.caixa(a0, a1, hA, hA + q, zmi, zm + 0.03, req);
  const g0 = esq ? a0 : a0 + pw + meio, p0 = esq ? a0 + gw + meio : a0;
  B.caixa(esq ? g0 + gw : p0 + pw, (esq ? g0 + gw : p0 + pw) + meio, 0, hA, zmi, zm - 0.02, req);
  B.esticar(B.plano([g0, 0.02, zm - 0.07], [1, 0, 0], [0, 1, 0]), 0, gw, 0, hA - 0.02, portao);
  G.ladrilhar(G.plano([p0, 0.02, zm - 0.07], [1, 0, 0], [0, 1, 0]), G.ret(0, pw, 0, hA - 0.04), r.grade);
  conta.portas += 2;
  conta.frentes.push({ x0: 0.03, x1: a0 - q, y0: 0, y1: hm, z: zm, vaos: [] },
                     { x0: a1 + q, x1: W - 0.03, y0: 0, y1: hm, z: zm, vaos: [] });
  /* o telhadinho da garagem, atrás do portão, e o chão */
  const zT = zmi - Math.min(1.4, dG - 0.2);
  const V = [0, 0.22, zT - zmi], Lv = Math.hypot(V[1], V[2]);
  B.ladrilhar(B.plano([g0 - 0.05, 2.4, zmi], [1, 0, 0], [0, V[1] / Lv, V[2] / Lv]), B.ret(0, gw + 0.1, 0, Lv), 'telha', { tinta: r.telha });
  B.tampa([[0.15, zmi], [W - 0.15, zmi], [W - 0.15, zc], [0.15, zc]], 0.02, 'crua');
  murosDoLado(B, W, zmi, zc, 2.1, r.tinta);
  /* a casa e a torrinha da caixa d'água, no fundo, do lado da garagem */
  const x0 = 0.05, x1 = W - 0.05, z0 = -D + 0.05, wb = x1 - x0;
  let vf = distribuir(wb, wb < 5.4 ? [r.jan, r.porta] : [r.jan, r.porta, r.jan], 0.07);
  if (!esq) vf = espelhar(vf, wb);
  casaDoMuro(B, p, r, x0, x1, z0, zc, h, vf, {}, conta);
  const tw = 1.5, tz1 = Math.max(z0 + tw + 0.3, zc - Math.min(2.2, (zc - z0) * 0.55));
  const tx0 = esq ? x1 - 0.5 - tw : x0 + 0.5;
  B.caixa(tx0, tx0 + tw, h - 0.3, h + 1.75, tz1 - tw, tz1, { todas: { k: 'lisa', tinta: r.casa }, base: null, topo: null });
  B.pintar(r.telha);
  B.telhado4(tx0 - 0.14, tx0 + tw + 0.14, tz1 - tw - 0.14, tz1 + 0.14, h + 1.7, 0.45, 'telha', 'telha');
  B.pintar(null);
}

/* ---------------- M3: o quintal na frente e a porta no corredor ---------------- */
const m3 = comEspelho((B, p, l, conta, G, r) => {
  const { s, W, D } = p;
  const e = 0.13, zm = -0.03, zmi = zm - e, hm = 1.8 + r.dh, hp = hm + 0.2;
  const dQ = clamp(D * 0.3, 1.2, 1.8), zc = zmi - dQ, h = 2.75, corr = 0.95;
  const grade = r.grade === 'preta' ? 'branca' : r.grade;
  /* o muro com o portãozinho de grade à esquerda, na boca do corredor */
  const xg0 = 0.25, xg1 = xg0 + 0.85;
  muroDe(B, 0.03, xg0 - 0.22, hp, zmi, zm, r.tinta);
  portaozinho(B, G, xg0, xg1, zm, e, hp, r.tinta, grade);
  muroDe(B, xg1 + 0.22, W - 0.03, hm, zmi, zm, r.tinta);
  conta.portas++;
  conta.frentes.push({ x0: xg1 + 0.22, x1: W - 0.03, y0: 0, y1: hm, z: zm, vaos: [] });
  /* o quintal cimentado, o corredor e o muro do lado */
  const z0 = -D + 0.05;
  B.tampa([[0.15, zmi], [W - 0.15, zmi], [W - 0.15, zc], [0.15, zc]], 0.02, 'crua');
  B.tampa([[0.15, zc], [corr, zc], [corr, z0], [0.15, z0]], 0.02, 'crua');
  murosDoLado(B, W, zmi, zc, 1.9, r.tinta, 'd');
  murosDoLado(B, W, zmi, z0, 1.9, r.tinta, 'e');
  if (r.bananeira && dQ >= 1.35) bananeira(G, W - 0.85, (zmi + zc) / 2, 0.02, 1.7, s('giroBan') * Math.PI);
  /* a casa: a janela na frente, a porta no corredor */
  const x0 = 0.05 + corr, x1 = W - 0.05, wb = x1 - x0, dd = zc - z0;
  const jan = r.jan === 'jan2' ? 'veneziana' : r.jan;
  const vf = wb >= 3.4 ? distribuir(wb, [jan, 'jan2'], 0.07) : distribuir(wb, [jan], 0.07);
  const porta = [{ a0: Math.max(0.2, dd - 1.25), a1: Math.max(0.2, dd - 1.25) + 0.85, b0: 0, b1: 2.1, k: r.porta, fundo: 0.08 }];
  casaDoMuro(B, p, r, x0, x1, z0, zc, h, vf, { esq: dd >= 1.3 ? porta : [] }, conta);
});

/* ---------------- M4: a casinha no meio do lote ---------------- */
const m4 = comEspelho((B, p, l, conta, G, r) => {
  const { s, W, D } = p;
  const e = 0.13, zm = -0.03, zmi = zm - e, hm = 1.6 + r.dh, hp = hm + 0.3;
  const dQ = clamp(D * 0.35, 1.2, 2.0), zc = zmi - dQ, h = 2.7, corr = 0.85;
  /* o muro baixo e o portãozinho à direita */
  const xg1 = W - 0.25, xg0 = xg1 - 0.85;
  muroDe(B, 0.03, xg0 - 0.22, hm, zmi, zm, r.tinta);
  portaozinho(B, G, xg0, xg1, zm, e, hp, r.tinta, r.grade);
  muroDe(B, xg1 + 0.22, W - 0.03, hp, zmi, zm, r.tinta);
  conta.portas++;
  conta.frentes.push({ x0: 0.03, x1: xg0 - 0.22, y0: 0, y1: hm, z: zm, vaos: [] });
  /* a casa no meio: o quintal na frente, a passagem à direita e, se o
     lote deixa, um quintalzinho no fundo com o muro */
  const fundo = D >= 5.6 ? 1.0 : 0.05, z0 = -D + fundo;
  const x0 = 0.05, x1 = W - 0.05 - corr, wb = x1 - x0, dd = zc - z0;
  B.tampa([[0.15, zmi], [W - 0.15, zmi], [W - 0.15, zc], [0.15, zc]], 0.02, 'crua');
  B.tampa([[x1, zc], [W - 0.15, zc], [W - 0.15, -D + 0.05], [x1, -D + 0.05]], 0.02, 'crua');
  murosDoLado(B, W, zmi, zc, 1.8, r.tinta, 'e');
  murosDoLado(B, W, zmi, -D + 0.05, 1.8, r.tinta, 'd');
  if (fundo > 0.5) {
    muroDe(B, 0.03, W - 0.03, 1.8, -D + 0.03, -D + 0.15, r.tinta);
    murosDoLado(B, W, z0, -D + 0.15, 1.8, r.tinta, 'e');
  }
  if (r.bananeira && dQ >= 1.35) bananeira(G, 0.85, (zmi + zc) / 2, 0.02, 1.7, s('giroBan') * Math.PI);
  const vf = distribuir(wb, [wb >= 2.2 ? r.jan : 'basc'], 0.07);
  const porta = [{ a0: Math.max(0.15, dd - 1.2), a1: Math.max(0.15, dd - 1.2) + 0.85, b0: 0, b1: 2.1, k: r.porta, fundo: 0.08 }];
  /* a face 'dir' corre do fundo pra frente ao contrário da 'esq': a porta vai perto da frente */
  const portaDir = porta.map(v => ({ ...v, a0: dd - v.a1, a1: dd - v.a0 }));
  casaDoMuro(B, p, r, x0, x1, z0, zc, h, vf, { dir: dd >= 1.3 ? portaDir : [] }, conta);
});


/* =======================================================
   O BAR DA TORCIDA — o bar pequeno de esquina, embaixo do apartamento
   O bar grande (13,9 × 8,8 m, o salão inteiro) encolheu pro tamanho do
   bar da favela e ficou com o arranjo dele: a VARANDA coberta na
   frente, com as mesas, e o salão aberto pra rua atrás dela. Só que no
   jeito de bairro de classe média: reboco pintado, porta de enrolar,
   piso de cerâmica e, em cima, o APARTAMENTO (a sacada de gradil sobre
   a varanda, a janela de alumínio, o ar-condicionado, a platibanda e a
   casinha da caixa d'água). A entrada do apartamento é a porta cinza do
   lado, com a escada no corredor.
   ABERTO, o térreo é da torcida (`l.torcida`): parede, pilar e frontão
   na cor 1, o rodapé na 3, a faixa alta na 2, e o letreiro BAR DO X
   (`l.placa`) no frontão da varanda, no fundo da cor 2. Dentro vai o
   que tinha no bar grande: o chão de xadrez azul e creme, o balcão em
   L com as banquetas, o armário e a prateleira de garrafa atrás dele,
   a cervejeira, os dois freezers e a TV em cima, o engradado, as mesas
   e cadeiras de madeira e a porta do banheiro.
   SEM TORCIDA o bar fica NEUTRO: o térreo em cor de reboco, as portas
   de enrolar abaixadas, o ALUGA-SE numa delas e nada de letreiro.
   O desenho é o da esquina à direita (a escada do apartamento do lado
   de lá); com a esquina à esquerda ele sai espelhado, e a peça que tem
   letra (a cervejeira, o ALUGA-SE) é desenhada depois, sem espelho.
   ======================================================= */
const CORES_APTO = ['#efe9dc', '#e9e2d0', '#f1efe8', '#e2e6e1', '#eee2c9', '#e6ded6'];
const XADREZ_AZUL = '#5b7fa8', XADREZ_CREME = '#ddd6c2', GRANITO = '#3b3936', TELA = '#2f6a3c';
const NEUTRO_BAR = { cor: '#d6d1c4', cor2: '#c4beb0', cor3: '#8f8a7f' };
/* as medidas que o letreiro também precisa (o plano da casa as usa
   antes do modelo existir) */
function medidasDoBar(W) {
  const x0 = 0.04, x1 = W - 0.04, e = 0.12;
  const we = clamp(W * 0.16, 1.05, 1.25);          // o corredor da escada do apartamento
  return { x0, x1, e, we, xe: x0 + we, xi0: x0 + we + e, xi1: x1 - e,
           h1: 3.0, lj: 0.2, yV: 2.2, hp: 2.55 };    // o térreo, a laje, a viga da varanda, a porta de enrolar
}
/* o letreiro no frontão da varanda: a altura do meio, a largura e o
   deslocamento do meio da frente (o frontão não é centrado no lote,
   porque o corredor da escada fica de fora) */
function placaDoBar(W, esquina) {
  const m = medidasDoBar(W);
  /* o frontão vai de yV + 0,08 (a faixa da cor 2 embaixo) até 2 cm da
     laje; o decalque guarda 6 cm de folga em cima e embaixo */
  const alt = Math.min(0.54, m.h1 - 0.02 - (m.yV + 0.08) - 0.13), larg = Math.min(3.3, m.x1 - m.xi0 - 0.5, alt * 5.2);
  const u = ((m.xi0 + m.x1) / 2 - W / 2) * (esquina === 'esq' ? -1 : 1);
  return { y: (m.yV + 0.08 + m.h1 - 0.02) / 2 * M, larg: larg * M, alt: (larg / 5.2) * M, u: u * M };
}
/* a tinta da torcida no reboco: o preto puro vira buraco no Lambert e o
   branco puro estoura, então os dois vão um pouco pra dentro */
function tintaViva(c) {
  const n = parseInt(String(c || '#888888').slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
  if (Math.max(r, g, b) < 0x26) return '#262626';
  if (Math.min(r, g, b) > 0xf2) return '#f2f1ec';
  return c;
}
/* o chão de xadrez: o piso claro inteiro e, por cima, só as pedras escuras */
function xadrez(B, xa, xb, za, zb, y, lado, claro, escuro) {
  tampo(B, xa, xb, za, zb, y, 'lisa', claro);
  const ni = Math.ceil((xb - xa) / lado - 1e-6), nj = Math.ceil((zb - za) / lado - 1e-6);
  for (let i = 0; i < ni; i++) for (let j = 0; j < nj; j++) {
    if ((i + j) % 2) continue;
    const a0 = xa + i * lado, b0 = za + j * lado;
    tampo(B, a0, Math.min(xb, a0 + lado), b0, Math.min(zb, b0 + lado), y + 0.006, 'lisa', escuro);
  }
}
/* a banqueta do balcão: o pé, o apoio do pé e o assento redondo */
function banqueta(B, cx, cz, y, tinta) {
  const ferro = { k: 'laje_borda', tinta: '#34322f' };
  B.caixa(cx - 0.025, cx + 0.025, y, y + 0.72, cz - 0.025, cz + 0.025, { todas: ferro, base: null, topo: null });
  B.caixa(cx - 0.14, cx + 0.14, y + 0.22, y + 0.245, cz - 0.14, cz + 0.14, { todas: ferro, base: null });
  B.pintar(tinta);
  B.torno(cx, cz, [[0.17, y + 0.72], [0.185, y + 0.76], [0.1, y + 0.785], [0, y + 0.79]], 8, 'lisa');
  B.pintar(null);
}
/* o freezer horizontal: a caixa branca, a tampa e a faixa da marca na
   face `frente` ('frente' = +z, 'esq' = −x) */
function freezer(B, x0, x1, z0, z1, y, frente) {
  B.caixa(x0, x1, y, y + 0.82, z0, z1, { todas: { k: 'lisa', tinta: '#eef0ef' }, base: null, topo: null });
  B.caixa(x0 - 0.01, x1 + 0.01, y + 0.82, y + 0.88, z0 - 0.01, z1 + 0.01, { todas: { k: 'lisa', tinta: '#c9ced1' }, base: null });
  const marca = { k: 'lisa', tinta: '#c8342b' };
  if (frente === 'frente') B.caixa(x0 + 0.12, x1 - 0.12, y + 0.5, y + 0.66, z1, z1 + 0.006, { frente: marca, topo: marca, base: null, tras: null });
  else B.caixa(x0 - 0.006, x0, y + 0.5, y + 0.66, z0 + 0.12, z1 - 0.12, { esq: marca, topo: marca, base: null, dir: null });
}
/* a parede do salão, com as portas de enrolar: montantes e vergas em
   caixa, e o vão vazio (a porta enrolada, só a régua de baixo à vista
   no alto) ou com a porta abaixada. `ao` é o eixo em que a parede
   corre: 'x' (a da frente, com a face de fora em +z) ou 'z' (a do
   lado, com a face de fora em +x). `a0`–`a1` é o comprimento, `c0`–`c1`
   a espessura; `vaos` são [a0, a1] com a altura `hp`. */
function paredeDoSalao(B, ao, a0, a1, c0, c1, h, vaos, hp, fora, dentro, aberto, bandas, pontaFim) {
  const cx = (u0, u1, y0, y1, spec) => ao === 'x' ? B.caixa(u0, u1, y0, y1, c0, c1, spec) : B.caixa(c0, c1, y0, y1, u0, u1, spec);
  /* os nomes das faces da caixa: a de fora, a de dentro, e as duas
     pontas (a do começo e a do fim do comprimento) */
  const F = ao === 'x' ? { fora: 'frente', dentro: 'tras', ini: 'esq', fim: 'dir' }
                       : { fora: 'dir', dentro: 'esq', ini: 'tras', fim: 'frente' };
  const cheios = [];
  let a = a0;
  for (const [v0, v1] of vaos) { if (v0 > a + 1e-6) cheios.push([a, v0]); a = v1; }
  if (a1 > a + 1e-6) cheios.push([a, a1]);
  for (const [u0, u1] of cheios) {
    /* a ponta que dá pro vão é ombreira; a do fim da parede só aparece
       quando ela não morre noutra parede (a quina do salão na varanda) */
    const spec = { [F.fora]: fora, [F.dentro]: dentro, [F.ini]: u0 > a0 + 1e-6 ? fora : null,
                   [F.fim]: u1 < a1 - 1e-6 || pontaFim ? fora : null, topo: null, base: null };
    cx(u0, u1, 0, h, spec);
    /* o rodapé da cor 3, saltado um dedo da parede */
    if (bandas.rodape) {
      const r = { [F.fora]: bandas.rodape, topo: bandas.rodape, [F.ini]: bandas.rodape, [F.fim]: bandas.rodape, base: null, [F.dentro]: null };
      if (ao === 'x') B.caixa(u0 + (u0 > a0 + 1e-6 ? 0.01 : 0), u1 - (u1 < a1 - 1e-6 ? 0.01 : 0), 0.12, 0.48, c1, c1 + 0.012, r);
      else B.caixa(c1, c1 + 0.012, 0.12, 0.48, u0 + (u0 > a0 + 1e-6 ? 0.01 : 0), u1 - (u1 < a1 - 1e-6 ? 0.01 : 0), r);
    }
  }
  for (const [v0, v1] of vaos) {
    cx(v0, v1, hp, h, { [F.fora]: fora, [F.dentro]: dentro, base: fora, topo: null, [F.ini]: null, [F.fim]: null });
    /* a porta: abaixada, ou enrolada lá em cima (só a régua de baixo aparece) */
    const Fp = ao === 'x' ? B.plano([v0, 0, c1 - 0.05], [1, 0, 0], [0, 1, 0]) : B.plano([c1 - 0.05, 0, v1], [0, 0, -1], [0, 1, 0]);
    if (aberto) B.esticar(Fp, 0, v1 - v0, hp - 0.13, hp, 'enrolar', { parte: [0, 1, 0, 0.05] });
    else B.esticar(Fp, 0, v1 - v0, 0.02, hp, 'enrolar');
  }
  /* a faixa alta da cor 2, corrida por cima das portas */
  if (bandas.alta) {
    const r = { [F.fora]: bandas.alta, topo: bandas.alta, base: bandas.alta, [F.ini]: bandas.alta, [F.fim]: bandas.alta, [F.dentro]: null };
    if (ao === 'x') B.caixa(a0, a1, hp + 0.08, hp + 0.3, c1, c1 + 0.012, r);
    else B.caixa(c1, c1 + 0.012, hp + 0.08, hp + 0.3, a0, a1, r);
  }
}

function barTorcida(B, p, l, conta, G) {
  const espelho = l.esquina === 'esq', letras = [];
  if (espelho) espelhado(B, G, p.W, conta, (B2, G2, c2) => barTorcidaDireita(B2, p, l, c2, G2, letras));
  else barTorcidaDireita(B, p, l, conta, G, letras);
  /* o que tem letra sai do lado certo mesmo com o bar espelhado */
  for (const t of letras) {
    const a0 = espelho ? p.W - t.x1 : t.x0, a1 = espelho ? p.W - t.x0 : t.x1;
    B.esticar(B.plano([a0, t.y0, t.z], [1, 0, 0], [0, 1, 0]), 0, a1 - a0, 0, t.y1 - t.y0, t.k);
  }
}
function barTorcidaDireita(B, p, l, conta, G, letras) {
  const { s, W, D } = p;
  const T = l.torcida || null, aberto = !!T;
  const c1 = T ? tintaViva(T.cor) : NEUTRO_BAR.cor;
  const c2 = T ? tintaViva(T.cor2 || '#e8e2d0') : NEUTRO_BAR.cor2;
  const c3 = T ? tintaViva(T.cor3 || T.cor2 || '#e8e2d0') : NEUTRO_BAR.cor3;
  const apto = escolher(s, 'apto', CORES_APTO), claro = '#f3f2ee';
  const { x0, x1, e, we, xe, xi0, xi1, h1, lj, yV, hp } = medidasDoBar(W);
  const z1 = -p.rec, z0 = -D + 0.04;
  const pa = clamp((z1 - z0) * 0.3, 1.3, 1.7), zS = z1 - pa;       // a varanda e a frente do salão
  const zi0 = z0 + e, zi1 = zS - e, iw = xi1 - xi0, di = zi1 - zi0;
  const y2 = h1 + lj, h2 = 2.75, topo = y2 + h2;
  const cor1 = { k: 'lisa', tinta: c1 }, dentro = aberto ? cor1 : null;
  const bandas = { rodape: { k: 'lisa', tinta: c3 }, alta: aberto ? { k: 'lisa', tinta: c2 } : null };

  /* ---- O CORREDOR DO APARTAMENTO: a porta cinza na frente; a escada
     sobe por dentro, rente à parede do salão ---- */
  paredes(B, x0, xe, z0, z1, 0, h1, {
    frente: { k: 'lisa', tinta: apto, vaos: [{ a0: (we - 0.85) / 2, a1: (we + 0.85) / 2, b0: 0.02, b1: 2.2, k: 'porta_ap', fundo: 0.08 }] },
    esq: { k: 'lisa', tinta: apto }, tras: { k: 'lisa', tinta: apto }
  }, conta);
  B.caixa(x0, xe, 0, 0.12, z1, z1 + 0.035, { frente: 'laje_borda', topo: 'laje_borda', esq: null, dir: null, base: null, tras: null });
  /* a parede entre o corredor e o bar: do lado do bar, a cor dele */
  B.caixa(xe, xi0, 0, h1, z0, z1, { dir: cor1, frente: cor1, esq: null, tras: { k: 'lisa', tinta: apto }, topo: null, base: null });

  /* ---- O SALÃO ---- */
  /* o fundo: por fora o reboco do prédio, a quina da esquina na cor do bar */
  B.caixa(xi0, x1, 0, h1, z0, zi0, { tras: { k: 'lisa', tinta: apto }, dir: cor1, frente: null, esq: null, topo: null, base: null });
  /* a parede da esquina, com a porta de enrolar do lado quando o salão
     tem fundo pra ela e pros freezers */
  const dwS = Math.min(1.6, di - 1.25);
  const portaLado = dwS >= 1.1 ? [zi1 - 0.2 - dwS, zi1 - 0.2] : null;
  paredeDoSalao(B, 'z', zi0, zS, xi1, x1, h1, portaLado ? [portaLado] : [], hp, cor1, dentro, aberto, bandas, true);
  /* a frente do salão, com as duas portas de enrolar */
  const dw = Math.min(2.4, (iw - 0.9) / 2);
  const portas = [[xi0 + 0.25, xi0 + 0.25 + dw], [xi1 - 0.25 - dw, xi1 - 0.25]];
  paredeDoSalao(B, 'x', xi0, xi1, zS - e, zS, h1, portas, hp, cor1, dentro, aberto, bandas, false);
  conta.portas += portas.length + (portaLado ? 1 : 0);
  if (!aberto) letras.push({ k: 'aviso_aluga', x0: portas[0][0] + 0.3, x1: portas[0][0] + 1.6, y0: 1.3, y1: 1.72, z: zS - 0.04 });

  /* ---- A VARANDA: o chão de cerâmica, o pilar da esquina, a viga da
     frente (o frontão do letreiro) e a do lado, o forro ---- */
  B.caixa(xi0, x1, 0, 0.05, zS, z1, { topo: 'piso_bar', frente: 'crua', dir: 'crua', esq: null, tras: null, base: null });
  B.caixa(x1 - 0.26, x1, 0.05, yV, z1 - 0.26, z1, { todas: cor1, base: null, topo: null });
  B.caixa(x1 - 0.27, x1 + 0.006, 0.05, 0.48, z1 - 0.27, z1 + 0.006, { todas: bandas.rodape, base: null });
  B.caixa(xi0, x1, yV, h1, z1 - 0.22, z1, { frente: cor1, base: cor1, tras: cor1, dir: cor1, esq: null, topo: null });
  B.caixa(x1 - 0.22, x1, yV, h1, zS, z1 - 0.22, { dir: cor1, esq: cor1, base: cor1, frente: null, tras: null, topo: null });
  if (bandas.alta) B.caixa(xi0, x1, yV, yV + 0.08, z1, z1 + 0.01, { frente: bandas.alta, base: bandas.alta, dir: bandas.alta, esq: null, tras: null, topo: null });
  B.tampa([[xi0, z1], [x1, z1], [x1, zS], [xi0, zS]], h1, 'lisa', true, { tinta: BRANCO_BAR });
  /* o frontão é onde o letreiro mora */
  conta.frentes.push({ x0: xi0, x1, y0: yV + 0.08, y1: h1 - 0.02, z: z1, vaos: [] });

  if (aberto) {
    /* o chão de xadrez e o forro do salão */
    xadrez(B, xi0, xi1, zi0, zi1, 0.05, 0.42, XADREZ_CREME, XADREZ_AZUL);
    B.tampa([[xi0, zi1], [xi1, zi1], [xi1, zi0], [xi0, zi0]], h1, 'lisa', true, { tinta: BRANCO_BAR });
    /* o balcão em L: o braço comprido no fundo, com a faixa de serviço
       atrás dele, e o braço curto voltando pra frente junto da parede
       da escada; a frente na cor 2 e o tampo de granito */
    const cL = clamp(iw * 0.5, 2.2, 3.2), zc0 = zi0 + 0.95, zc1 = zc0 + 0.55, hc = 1.08;
    const corpo = { k: 'lisa', tinta: c2 }, pedra = { k: 'lisa', tinta: GRANITO };
    B.caixa(xi0, xi0 + cL, 0.05, hc - 0.04, zc0, zc1, { frente: corpo, dir: corpo, tras: { k: 'lisa', tinta: MADEIRA }, esq: null, topo: null, base: null });
    B.caixa(xi0, xi0 + cL + 0.04, hc - 0.04, hc, zc0 - 0.02, zc1 + 0.06, { todas: pedra, esq: null, base: null });
    B.caixa(xi0, xi0 + 0.5, 0.05, hc - 0.04, zc1 + 0.06, zc1 + 0.66, { frente: corpo, dir: corpo, esq: null, tras: null, topo: null, base: null });
    B.caixa(xi0, xi0 + 0.56, hc - 0.04, hc, zc1 + 0.06, zc1 + 0.68, { todas: pedra, esq: null, tras: null, base: null });
    for (let x = xi0 + 0.95; x <= xi0 + cL - 0.25; x += 0.62) banqueta(B, x, zc1 + 0.32, 0.05, c1);
    /* o fundo por dentro: o armário com a prateleira de garrafa em
       cima, a porta do banheiro depois da ponta do balcão */
    const vf = [{ a0: 0.9, a1: Math.min(2.1, cL - 0.15), b0: 0.05, b1: 0.95, k: 'armario' },
                { a0: 0.9, a1: Math.min(2.1, cL - 0.15), b0: 1.08, b1: 2.05, k: 'prateleira' }];
    const bw0 = cL + 0.22;
    if (bw0 + 0.85 <= iw - 0.1) vf.push({ a0: bw0, a1: bw0 + 0.85, b0: 0, b1: 2.1, k: 'porta_madeira', fundo: 0.06 });
    B.fachada(B.plano([xi0, 0, zi0], [1, 0, 0], [0, 1, 0]), iw, h1, 'lisa', vf, { tinta: c1 });
    /* a cervejeira na ponta da faixa de serviço, virada pro balcão */
    B.caixa(xi0 + 0.08, xi0 + 0.74, 0.05, 1.9, zi0 + 0.02, zi0 + 0.62, { todas: { k: 'lisa', tinta: '#eef0ef' }, frente: null, base: null });
    letras.push({ k: 'geladeira', x0: xi0 + 0.08, x1: xi0 + 0.74, y0: 0.05, y1: 1.9, z: zi0 + 0.62 });
    /* os dois freezers no canto do fundo e a TV em cima (se o salão é
       estreito, fica um freezer só, na parede da esquina) */
    const fA = xi1 - 1.24 >= xi0 + bw0 + 0.95;
    if (fA) {
      freezer(B, xi1 - 1.24, xi1 - 0.02, zi0 + 0.02, zi0 + 0.68, 0.05, 'frente');
      const tx = xi1 - 0.63;
      B.caixa(tx - 0.53, tx + 0.53, 1.66, 2.28, zi0, zi0 + 0.05, { todas: { k: 'lisa', tinta: '#141414' }, tras: null, base: null });
      B.caixa(tx - 0.48, tx + 0.48, 1.7, 2.24, zi0 + 0.05, zi0 + 0.056, { frente: { k: 'lisa', tinta: TELA }, tras: null, base: null, topo: null, esq: null, dir: null });
    }
    const fz0 = zi0 + (fA ? 0.74 : 0.05), fz1 = portaLado ? portaLado[0] - 0.1 : zi1 - 0.1;
    if (fz1 - fz0 >= 1.2) freezer(B, xi1 - 0.68, xi1 - 0.02, fz0, fz0 + 1.2, 0.05, 'esq');
    /* o engradado de cerveja, empilhado no canto da frente */
    const eg = { todas: { k: 'engradado', modo: 'esticar' }, base: null };
    if (zi1 - 0.46 >= zc1 + 0.72)
      for (const [dx, n] of [[0, 3], [0.46, 2]])
        for (let k = 0; k < n; k++)
          B.caixa(xi0 + 0.05 + dx, xi0 + 0.47 + dx, 0.05 + k * 0.3, 0.35 + k * 0.3, zi1 - 0.46, zi1 - 0.12, eg);
    /* a mesa do salão, entre as banquetas e a porta */
    const mz0 = zc1 + 0.6, mz1 = zi1 - 0.1;
    if (mz1 - mz0 >= 1.1) {
      const mx = xi0 + iw * 0.6, mz = (mz0 + mz1) / 2;
      mesa(B, mx, mz, 0.05, 0.7, MADEIRA);
      cadeira(B, mx - 0.6, mz, 0.05, 'o', MADEIRA);
      cadeira(B, mx + 0.6, mz, 0.05, 'l', MADEIRA);
      if (mz1 - mz0 >= 1.9) { cadeira(B, mx, mz - 0.6, 0.05, 'n', MADEIRA); cadeira(B, mx, mz + 0.6, 0.05, 's', MADEIRA); }
    }
    /* as duas mesas da varanda */
    const vz = (zS + z1) / 2 - 0.04, va = xi0 + 0.25, vb = x1 - 0.4;
    for (const f of [0.27, 0.73]) {
      const cx = va + (vb - va) * f;
      mesa(B, cx, vz, 0.05, 0.68, MADEIRA);
      cadeira(B, cx - 0.6, vz, 0.05, 'o', MADEIRA);
      cadeira(B, cx + 0.6, vz, 0.05, 'l', MADEIRA);
    }
  }

  /* ---- A LAJE entre o bar e o apartamento ---- */
  faixa(B, x0, x1, z0, z1, h1, y2, 0.04, 'lisa', claro);

  /* ---- O APARTAMENTO ---- */
  const wb = x1 - x0, dd = z1 - z0;
  const sw = clamp(wb * 0.34, 1.8, 2.4), sa0 = wb - 0.35 - sw;      // a sacada, em cima da varanda
  const vA = [{ a0: sa0, a1: sa0 + sw, b0: 0.05, b1: 2.45, k: 'sacada_fundo', fundo: 0.9, tinta: apto }];
  let ar = null;
  if (sa0 - 0.7 >= 1.3) {
    const c = sa0 / 2;
    vA.push({ a0: c - 0.6, a1: c + 0.6, b0: 1.0, b1: 2.15, k: 'jan2', fundo: 0.07 });
    /* o ar-condicionado ao lado da janela, longe da sacada (embaixo
       dela ele tapava o letreiro visto de cima) */
    if (c - 0.6 - 0.2 - 0.84 >= 0.15) ar = c - 0.6 - 0.2 - 0.42;
  }
  const vLado = [{ a0: 0.8, a1: 2.0, b0: 1.0, b1: 2.15, k: 'jan2', fundo: 0.07 }];
  if (dd >= 4.2) vLado.push({ a0: dd - 1.4, a1: dd - 0.8, b0: 1.5, b1: 2.1, k: 'basc', fundo: 0.05 });
  paredes(B, x0, x1, z0, z1, y2, topo, {
    frente: { k: 'lisa', tinta: apto, vaos: vA }, dir: { k: 'lisa', tinta: apto, vaos: vLado },
    esq: { k: 'lisa', tinta: apto }, tras: { k: 'lisa', tinta: apto, vaos: distribuir(wb, ['jan2', 'basc'], 0.06) }
  }, conta);
  G.ladrilhar(G.plano([x0 + sa0, y2 + 0.05, z1 - 0.02], [1, 0, 0], [0, 1, 0]), G.ret(0, sw, 0, 1.0), 'gradil', { tw: 0.65 });
  B.caixa(x0 + sa0, x0 + sa0 + sw, y2 + 1.05, y2 + 1.1, z1 - 0.05, z1 - 0.005, { todas: { k: 'lisa', tinta: claro } });
  if (ar !== null && s('ar') < 0.6) arSplit(B, B.plano([x0, y2, z1], [1, 0, 0], [0, 1, 0]), ar, 1.2);
  /* a platibanda, a laje e a casinha da caixa d'água no fundo, do lado
     da escada (é por ela que se sobe) */
  tampo(B, x0, x1, z0, z1, topo, 'laje');
  B.pintar(apto);
  mureta(B, [[x0, z1], [x1, z1], [x1, z0], [x0, z0]], topo, 0.7, 0.15, 'lisa');
  B.pintar(null);
  const cw = Math.min(2.0, wb - 0.6), cd = Math.min(1.8, dd - 0.8);
  if (cd >= 1.0) {
    B.caixa(x0 + 0.3, x0 + 0.3 + cw, topo, topo + 1.5, z0 + 0.3, z0 + 0.3 + cd, { todas: { k: 'lisa', tinta: claro }, base: null });
    B.caixa(x0 + 0.25, x0 + 0.35 + cw, topo + 1.5, topo + 1.6, z0 + 0.25, z0 + 0.35 + cd, { todas: 'laje_borda', base: null });
  }
}

const TIPOS = { t1, t2, t3, t4, t5, favela, f1, f2, bar, lanche, escada, varal, garagem, base, g1, g2, p1, p2, m1, m2, m3, m4,
                bartorcida: barTorcida };

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
      if (v.k === 'enrolar' || v.k === 'portao_vermelho')
        sup.push({ x0: v.a0, x1: v.a1, y0: v.b0 + (v.k === 'portao_vermelho' ? 0.1 : 0), y1: v.k === 'portao_vermelho' ? v.b1 * 0.78 : v.b1,
                   z: S.z - v.fundo, m: 0.1, obst: [] });
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
