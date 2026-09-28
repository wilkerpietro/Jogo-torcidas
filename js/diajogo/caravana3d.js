/* =========================================================
   A CARAVANA NA ESTRADA (o jogo 3D, 28/09/2026)
   ---------------------------------------------------------
   O dono: "Crie também a cena 3d da caravana inspirado nas duas
   imagens" — as duas emboscadas da viagem do jogo de feed:

   - O POSTO (img/cenas/emb_posto.webp, "No posto, na parada da
     caravana"): o pátio de concreto em placas, murado nos três lados,
     aberto pra rodovia embaixo; a loja de conveniência no fundo (a
     vitrine pro pátio) e o galpãozinho do lado dela, com os pneus e o
     compressor; as duas ilhas de bomba no meio; o ônibus da caravana
     parado na frente das bombas; o carro saindo pra pista; pilha de
     pneu, tambor, a mangueira enrolada no muro.
   - A ESTRADA (img/cenas/emb_onibus.webp, "Na estrada, pista fechada"):
     a pista de duas mãos, com a faixa amarela no meio; o ônibus verde
     parado na mão de cima e dois carros brancos fechando ele na de
     baixo; os terrenos de terra batida dos dois lados, murados, com o
     portão aberto no meio; os galpões de telha de zinco atrás dos muros.

   As duas são palcos à parte, fora da cidade (a viagem é longe da
   praça): o cenário monta a peça num canto vazio do mundo quando a
   cena abre, e tira quando ela fecha. O PLANO de cada uma é em px do
   tabuleiro do combate (1536 × 1024; 1 px = 1 unidade do mundo, 19,4
   por metro): o chão, os sólidos (a máscara da briga sai deles) e os
   pontos da cena — os de dados/cenas.js (os spawns, as entradas, a PM),
   na mesma ordem e no mesmo sentido, só que no chão desenhado aqui.
   ========================================================= */
import { Construtor, METRO } from './construtor3d.js';
import { montarEquipAntigo } from './equip_antigo3d.js';

const M = METRO;
export const TABULEIRO = { W: 1536, H: 1024, CEL: 8 };
const lisa = tinta => ({ k: 'lisa', tinta });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* as tintas da estrada */
const CONCRETO = '#c9c3b6', JUNTA = '#8d887e', ASFALTO = '#55565a', FAIXA = '#e9e7df', AMARELA = '#e0b53c';
const MURO = '#bdb7aa', TERRA = '#c7ab7f', PRETO = '#1f2022';

/* =======================================================
   AS PEÇAS (em metros, x e z do tabuleiro / M)
   ======================================================= */
/* o ônibus: a caixa do corpo com a faixa de janela escura dos dois lados,
   o para-brisa, a porta do lado direito (de quem dirige), a faixa de
   cor, o ar-condicionado no teto e as seis rodas. `frente`: +1 olha pro
   +x, -1 pro -x */
function onibus(B, cx, cz, comp, larg, cor, cor2, frente = 1) {
  const x0 = cx - comp / 2, x1 = cx + comp / 2, z0 = cz - larg / 2, z1 = cz + larg / 2, y0 = 0.42, y1 = 3.3;
  B.caixa(x0, x1, y0, y1, z0, z1, { todas: lisa(cor), base: null });
  /* as janelas: a faixa escura dos lados (1,35 a 2,6 m), um tico pra fora */
  const vid = lisa('#1c2830'), fx = frente > 0 ? x1 : x0, tx = frente > 0 ? x0 : x1;
  const j0 = Math.min(fx, tx + frente * 0.4), j1 = Math.max(fx - frente * 2.6, tx + frente * 0.4);
  for (const z of [z0 - 0.02, z1 + 0.02]) B.caixa(Math.min(j0, j1), Math.max(j0, j1), 1.35, 2.6, z - 0.01, z + 0.01, { todas: vid });
  /* o para-brisa e o vidro de trás */
  B.caixa(fx - 0.03, fx + 0.03, 1.1, 2.9, z0 + 0.12, z1 - 0.12, { todas: vid });
  B.caixa(tx - 0.03, tx + 0.03, 1.9, 2.8, z0 + 0.25, z1 - 0.25, { todas: vid });
  /* a faixa de cor e a porta da frente, do lado direito de quem dirige */
  for (const z of [z0 - 0.025, z1 + 0.025]) B.caixa(x0 + 0.2, x1 - 0.2, 0.85, 1.12, z - 0.01, z + 0.01, { todas: lisa(cor2) });
  const zp = frente > 0 ? z1 + 0.03 : z0 - 0.03, xp = fx - frente * 1.6;
  B.caixa(Math.min(xp, xp - frente * 1.0), Math.max(xp, xp - frente * 1.0), 0.45, 2.75, zp - 0.01, zp + 0.01, { todas: lisa('#23303a') });
  /* o ar-condicionado e as saídas no teto */
  const ac = cx - frente * 0.8;
  B.caixa(ac - 1.1, ac + 1.1, y1, y1 + 0.28, cz - 0.8, cz + 0.8, { todas: lisa('#d7d9d6') });
  for (const dx of [-4, 3.4]) B.caixa(cx + dx - 0.35, cx + dx + 0.35, y1, y1 + 0.12, cz - 0.35, cz + 0.35, { todas: lisa('#cfd2cf') });
  /* as rodas */
  for (const ex of [-comp / 2 + 2.3, -comp / 2 + 3.5, comp / 2 - 2.4])
    for (const z of [z0 - 0.02, z1 + 0.02]) B.caixa(cx + ex - 0.5, cx + ex + 0.5, 0, 1.0, z - 0.14, z + 0.14, { todas: lisa(PRETO) });
}
/* o carro de passeio (a caixa, a cabine, os vidros e as rodas), girado */
function carro(B, x, z, ang, cor) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const pt = (a, b) => [x + a * c - b * s, z + a * s + b * c];
  const caixaGirada = (a0, a1, b0, b1, y0, y1, tinta) => {
    const p = [pt(a0, b0), pt(a1, b0), pt(a1, b1), pt(a0, b1)];
    B.pintar(tinta);
    const cl = B.cel('lisa'), uvs = [[cl[0], cl[1]], [cl[2], cl[1]], [cl[2], cl[3]], [cl[0], cl[3]]];
    for (let i = 0; i < 4; i++) {
      const [ax, az] = p[i], [bx, bz] = p[(i + 1) % 4];
      B.poli([[ax, y0, az], [bx, y1, bz], [bx, y0, bz]], [uvs[0], uvs[2], uvs[1]]);
      B.poli([[ax, y0, az], [ax, y1, az], [bx, y1, bz]], [uvs[0], uvs[3], uvs[2]]);
    }
    B.poli([[p[0][0], y1, p[0][1]], [p[3][0], y1, p[3][1]], [p[2][0], y1, p[2][1]]], [uvs[0], uvs[3], uvs[2]]);
    B.poli([[p[0][0], y1, p[0][1]], [p[2][0], y1, p[2][1]], [p[1][0], y1, p[1][1]]], [uvs[0], uvs[2], uvs[1]]);
    B.pintar(null);
  };
  caixaGirada(-2.3, 2.3, -0.9, 0.9, 0.32, 0.95, cor);
  caixaGirada(-1.15, 1.05, -0.82, 0.82, 0.95, 1.42, cor);
  caixaGirada(-1.1, 1.0, -0.84, 0.84, 1.0, 1.36, '#27313b');
  for (const [a, b] of [[-1.45, -0.92], [1.45, -0.92], [1.45, 0.92], [-1.45, 0.92]]) caixaGirada(a - 0.33, a + 0.33, b - 0.1, b + 0.1, 0, 0.64, PRETO);
}
/* a pilha de pneus (n pneus, um em cima do outro) e o tambor */
function pneus(B, x, z, n) {
  B.pintar('#2a2b2d');
  for (let i = 0; i < n; i++) {
    const y = i * 0.24;
    B.torno(x, z, [[0.22, y], [0.4, y + 0.02], [0.42, y + 0.12], [0.4, y + 0.22], [0.22, y + 0.24]], 12, 'lisa');
  }
  B.pintar(null);
}
function tambor(B, x, z, cor) {
  B.pintar(cor);
  B.torno(x, z, [[0, 0.9], [0.29, 0.9], [0.29, 0.0]], 12, 'lisa');
  B.pintar(null);
  B.pintar('#3b3b3b'); B.torno(x, z, [[0.295, 0.3], [0.3, 0.32], [0.295, 0.34]], 12, 'lisa'); B.pintar(null);
}
/* a parede cheia (o muro, o galpãozinho) de (x0, z0) a (x1, z1), em pé */
const bloco = (B, r, y0, y1, tinta, k = 'suja', topo = 'laje') => B.caixa(r.x0, r.x1, y0, y1, r.z0, r.z1, { todas: { k, tinta }, topo: topo ? { k: topo, tinta: '#b9b4a8' } : null, base: null });
/* o piso de um retângulo, na altura y */
const piso = (B, r, y, k, tinta) => B.tampa([[r.x0, r.z1], [r.x1, r.z1], [r.x1, r.z0], [r.x0, r.z0]], y, k, false, { tinta });
/* a placa de concreto com a junta escura em volta (o pátio do posto) */
function placas(B, r, lado, y) {
  piso(B, r, y, 'laje', CONCRETO);
  for (let x = r.x0 + lado; x < r.x1 - 0.1; x += lado) B.caixa(x - 0.025, x + 0.025, y, y + 0.006, r.z0, r.z1, { todas: null, topo: lisa(JUNTA) });
  for (let z = r.z0 + lado; z < r.z1 - 0.1; z += lado) B.caixa(r.x0, r.x1, y, y + 0.006, z - 0.025, z + 0.025, { todas: null, topo: lisa(JUNTA) });
}
/* a faixa pintada no chão (tracejada ou contínua), ao longo de x */
function faixaNoChao(B, x0, x1, z, larg, tinta, traco = 0, vao = 0, y = 0.012) {
  if (!traco) { B.caixa(x0, x1, y - 0.004, y, z - larg / 2, z + larg / 2, { todas: null, topo: lisa(tinta) }); return; }
  for (let x = x0; x < x1; x += traco + vao) B.caixa(x, Math.min(x1, x + traco), y - 0.004, y, z - larg / 2, z + larg / 2, { todas: null, topo: lisa(tinta) });
}

/* =======================================================
   OS PLANOS (px do tabuleiro)
   ======================================================= */
/* O POSTO: o pátio de x 60 a 1476 e de y 20 a 870, a rodovia de 880 pra
   baixo (e além da borda do tabuleiro) */
function planoDoPosto() {
  const P = {
    nome: 'Posto', patio: { x0: 60, x1: 1476, y0: 20, y1: 872 }, pista: { x0: -600, x1: 2136, y0: 880, y1: 1180 },
    muros: [
      { x0: 0, x1: 60, y0: 0, y1: 872 },          // o da esquerda (com o portão de ferro fechado)
      { x0: 1476, x1: 1536, y0: 0, y1: 872 },     // o da direita
      { x0: 0, x1: 1536, y0: -40, y1: 20 }        // o do fundo
    ],
    loja: { x0: 570, x1: 1000, y0: 20, y1: 250 },
    galpao: { x0: 1000, x1: 1225, y0: 20, y1: 250 },
    ilhas: [{ x0: 505, x1: 690, y0: 497, y1: 545 }, { x0: 858, x1: 1043, y0: 497, y1: 545 }],
    onibus: { x: 815, y: 735, comp: 12.4, larg: 2.55, cor: '#eeeeea', cor2: '#b3261e', frente: -1 },
    carros: [{ x: 1120, y: 862, ang: -1.1, cor: '#d9dadb' }],
    canteiro: { x0: 452, x1: 1078, y0: 826, y1: 876 },
    pneus: [[92, 292, 4], [92, 322, 3], [92, 352, 4], [468, 40, 3], [500, 40, 4], [532, 40, 3], [1168, 132, 4], [1168, 162, 4], [1168, 196, 3]],
    tambores: [[1446, 366, '#e0b83a'], [1446, 400, '#2f5f9e'], [96, 34, '#3a4a5c'], [124, 34, '#3a4a5c']],
    poste: { x: 765, y: 860 }
  };
  /* o que barra o corpo (a máscara da briga): o muro, a loja, o galpão, as
     ilhas com as bombas, o ônibus, o carro, os pneus, os tambores, o poste */
  const B = P.onibus, meioC = B.comp * M / 2, meioL = B.larg * M / 2;
  P.solidos = [
    ...P.muros, P.loja, P.galpao, ...P.ilhas,
    { x0: B.x - meioC, x1: B.x + meioC, y0: B.y - meioL, y1: B.y + meioL },
    ...P.carros.map(c => caixaDoCarro(c)),
    ...P.pneus.map(([x, y]) => ({ x0: x - 9, x1: x + 9, y0: y - 9, y1: y + 9 })),
    ...P.tambores.map(([x, y]) => ({ x0: x - 7, x1: x + 7, y0: y - 7, y1: y + 7 })),
    { x0: P.poste.x - 4, x1: P.poste.x + 4, y0: P.poste.y - 4, y1: P.poste.y + 4 }
  ];
  /* os pontos da cena (os de dados/cenas.js 'emb-posto', no chão daqui) */
  P.cena = {
    id: 'emb-posto@3d', base: 'emb-posto', nome: 'Posto', local: 'No posto, na parada da caravana',
    espalharBonde: 'visitante', semFugaPorMinoria: true, marchaAoInimigo: true, semRecuoPM: true,
    saida: { perto: 'Voltar pro ônibus', longe: 'Ônibus (leve o líder)', feito: 'a torcida voltou pro ônibus e a caravana seguiu',
             dica: 'Leve o líder de volta pro ônibus.' },
    spawns: [
      { id: 'mandante1', rot: 'ELES, PELA PISTA', lado: 'mandante', x: 200, y: 930, entrada: 'ent_mandante' },
      { id: 'visitante1', rot: 'NÓS, NAS BOMBAS', lado: 'visitante', x: 760, y: 610, jogador: true, entrada: 'ent_visitante' },
      { id: 'visitante2', rot: 'NÓS, NO ÔNIBUS', lado: 'visitante', x: 830, y: 800, entrada: 'ent_visitante' }
    ],
    entradas: [
      { id: 'ent_mandante', rot: 'PISTA', lado: 'mandante', x: 40, y: 945, raio: 48, dir: [-1, 0] },
      { id: 'ent_visitante', rot: 'ÔNIBUS', lado: 'visitante', x: 1496, y: 945, raio: 48, dir: [1, 0] }
    ],
    pmPostos: [{ x: 140, y: 560 }, { x: 1380, y: 930 }]
  };
  return P;
}
/* A ESTRADA: a pista de y 410 a 610, os terrenos dos dois lados até os
   muros (em cima de 100 a 160, embaixo de 860 a 920, com o portão aberto
   no meio de cada um) e os galpões atrás */
function planoDaEstrada() {
  const P = {
    nome: 'Estrada', pista: { x0: -600, x1: 2136, y0: 410, y1: 610 },
    terrenos: [{ x0: -600, x1: 2136, y0: 160, y1: 410 }, { x0: -600, x1: 2136, y0: 610, y1: 860 }],
    muros: [
      { x0: -600, x1: 665, y0: 100, y1: 160 }, { x0: 805, x1: 2136, y0: 100, y1: 160 },
      { x0: -600, x1: 790, y0: 860, y1: 920 }, { x0: 880, x1: 2136, y0: 860, y1: 920 }
    ],
    galpoes: [
      { x0: -600, x1: 440, y0: -300, y1: 100, cor: '#c4c0b6', h: 6.5 }, { x0: 1150, x1: 2136, y0: -300, y1: 100, cor: '#b7b3a8', h: 7.2 },
      { x0: -600, x1: 680, y0: 920, y1: 1260, cor: '#bfbab0', h: 5.6 }, { x0: 900, x1: 2136, y0: 920, y1: 1260, cor: '#c9c4b9', h: 6.2 }
    ],
    /* o terreno de dentro do portão de cima e o de baixo (a terra batida) */
    patios: [{ x0: 440, x1: 1150, y0: -300, y1: 100 }, { x0: 680, x1: 900, y0: 920, y1: 1260 }],
    onibus: { x: 782, y: 510, comp: 12.4, larg: 2.55, cor: '#2f5d49', cor2: '#1f3d31', frente: 1 },
    carros: [{ x: 730, y: 612, ang: 0, cor: '#ecedee' }, { x: 906, y: 614, ang: 0.02, cor: '#e6e7e8' }]
  };
  const B = P.onibus, meioC = B.comp * M / 2, meioL = B.larg * M / 2;
  P.solidos = [
    ...P.muros, ...P.galpoes,
    { x0: B.x - meioC, x1: B.x + meioC, y0: B.y - meioL, y1: B.y + meioL },
    ...P.carros.map(c => caixaDoCarro(c))
  ];
  P.cena = {
    id: 'emb-onibus@3d', base: 'emb-onibus', nome: 'Estrada', local: 'Na estrada, pista fechada',
    espalharBonde: 'visitante', semFugaPorMinoria: true, marchaAoInimigo: true, semRecuoPM: true,
    saida: { perto: 'Voltar pro ônibus', longe: 'Ônibus (leve o líder)', feito: 'a torcida voltou pro ônibus e a caravana seguiu',
             dica: 'Leve o líder de volta pro ônibus.' },
    spawns: [
      { id: 'mandante1', rot: 'ELES, NA PISTA', lado: 'mandante', x: 150, y: 500, entrada: 'ent_mandante' },
      { id: 'visitante1', rot: 'NÓS, NO ÔNIBUS', lado: 'visitante', x: 700, y: 572, jogador: true, entrada: 'ent_visitante' },
      { id: 'visitante2', rot: 'NÓS, ATRÁS', lado: 'visitante', x: 1010, y: 560, entrada: 'ent_visitante' }
    ],
    entradas: [
      { id: 'ent_mandante', rot: 'PISTA OESTE', lado: 'mandante', x: 40, y: 512, raio: 48, dir: [-1, 0] },
      { id: 'ent_visitante', rot: 'PISTA LESTE', lado: 'visitante', x: 1496, y: 512, raio: 48, dir: [1, 0] }
    ],
    pmPostos: [{ x: 400, y: 470 }, { x: 1100, y: 540 }]
  };
  return P;
}
/* a caixa (px) do carro girado */
function caixaDoCarro(c) {
  const co = Math.abs(Math.cos(c.ang)), si = Math.abs(Math.sin(c.ang)), hx = (2.3 * co + 0.9 * si) * M, hy = (2.3 * si + 0.9 * co) * M;
  return { x0: c.x - hx, x1: c.x + hx, y0: c.y - hy, y1: c.y + hy };
}
export const PLANOS = { 'emb-posto': planoDoPosto, 'emb-onibus': planoDaEstrada };

/* =======================================================
   A MONTAGEM (os blocos, no mundo: o canto do tabuleiro em `O`)
   ======================================================= */
/* `tipo`: 'emb-posto' ou 'emb-onibus'; `O`: [x, z] do mundo onde fica o
   canto de cima à esquerda do tabuleiro. Devolve os blocos de cada folha
   ({ casas: [...], grades: [...] }) já no mundo */
export function montarCaravana(tipo, O, destino = {}) {
  const P = PLANOS[tipo]();
  const B = Construtor('casas'), G = Construtor('grades');
  const m = r => ({ x0: r.x0 / M, x1: r.x1 / M, z0: r.y0 / M, z1: r.y1 / M });
  /* o chão de longe: a terra seca em volta, até a névoa (uma peça só,
     esticada: ladrilhada, a folha repetia a cada 3 m e eram 70 mil
     triângulos), e em volta do tabuleiro a terra ladrilhada, de perto */
  B.caixa(-400, 480, -0.06, -0.03, -400, 450, { todas: null, topo: { k: 'terra', modo: 'esticar', tinta: '#b49c77' } });
  piso(B, { x0: -30, x1: 110, z0: -30, z1: 85 }, -0.02, 'terra', '#b9a07a');
  if (tipo === 'emb-posto') {
    placas(B, m(P.patio), 5, 0.02);
    piso(B, m(P.pista), 0.0, 'laje', ASFALTO);
    const pz = P.pista.y0 / M, px0 = P.pista.x0 / M, px1 = P.pista.x1 / M;
    faixaNoChao(B, px0, px1, pz + 0.35, 0.14, FAIXA);
    faixaNoChao(B, px0, px1, pz + 4.1, 0.14, FAIXA, 3, 5);
    faixaNoChao(B, px0, px1, pz + 7.9, 0.14, FAIXA);
    /* as setas e as faixas pintadas do pátio */
    faixaNoChao(B, 25, 53, 19.6, 0.16, FAIXA, 0, 0, 0.03);
    faixaNoChao(B, 29, 53.5, 32.8, 0.16, FAIXA, 0, 0, 0.03);
    /* o canteiro da frente, com o meio-fio */
    const cn = m(P.canteiro);
    B.caixa(cn.x0, cn.x1, 0, 0.16, cn.z0, cn.z1, { todas: lisa('#d6d1c6'), topo: { k: 'laje', tinta: '#b7ae99' }, base: null });
    /* os muros e o portão de ferro fechado no da esquerda */
    for (const r of P.muros) bloco(B, m(r), 0, 2.6, MURO);
    G.esticar(G.plano([60 / M + 0.02, 0, 540 / M], [0, 0, -1], [0, 1, 0]), 0, 160 / M, 0, 2.3, 'lanca');
    /* a loja, as ilhas, as bombas e o totem: o posto antigo do jogo (sem a cobertura) */
    const w = r => ({ x0: O[0] + r.x0, x1: O[0] + r.x1, y0: O[1] + r.y0, y1: O[1] + r.y1 });
    const pecas = [{ k: 'bloco', ...w(P.loja), alt: 4.2 * M, teto: '#b3261e' }];
    for (const il of P.ilhas) {
      pecas.push({ k: 'piso', ...w(il), cor: '#c8c3b8' });
      const cx = (il.x0 + il.x1) / 2, cy = (il.y0 + il.y1) / 2;
      for (const dx of [-42, 42]) pecas.push({ k: 'bomba', ...w({ x0: cx + dx - 9, x1: cx + dx + 9, y0: cy - 6, y1: cy + 6 }), alt: 1.85 * M });
    }
    pecas.push({ k: 'totem', ...w({ x0: 1330, x1: 1360, y0: 800, y1: 812 }), alt: 6.5 * M });
    const eq = montarEquipAntigo({ tipo: 'posto', pecas });
    if (eq) for (const pt of eq.partes) for (const [folha, lista] of Object.entries(pt.blocos)) for (const b of lista || []) (destino[folha] = destino[folha] || []).push(b);
    /* o galpãozinho do lado da loja: três paredes, a laje, aberto pro pátio */
    const g = m(P.galpao), e = 0.2;
    bloco(B, { x0: g.x0, x1: g.x0 + e, z0: g.z0, z1: g.z1 }, 0, 3.6, '#e4e2dc', 'lisa', null);
    bloco(B, { x0: g.x1 - e, x1: g.x1, z0: g.z0, z1: g.z1 }, 0, 3.6, '#e4e2dc', 'lisa', null);
    bloco(B, { x0: g.x0, x1: g.x1, z0: g.z0, z1: g.z0 + e }, 0, 3.6, '#e4e2dc', 'lisa', null);
    B.caixa(g.x0, g.x1, 3.6, 3.78, g.z0, g.z1, { todas: lisa('#d9d6cf'), topo: { k: 'laje', tinta: '#bdb8ad' } });
    piso(B, g, 0.03, 'laje', '#b8b2a6');
    B.caixa(g.x0 + 3.2, g.x0 + 4.6, 0, 0.9, g.z0 + 1.2, g.z0 + 1.9, { todas: lisa('#3c5f93') });          // o compressor
    B.caixa(g.x0 + 6.2, g.x0 + 8.1, 0, 0.95, g.z0 + 0.7, g.z0 + 1.6, { todas: lisa('#6b4a33') });         // a bancada
    /* o ônibus da caravana, o carro, os pneus, os tambores e o poste */
    const o = P.onibus;
    onibus(B, o.x / M, o.y / M, o.comp, o.larg, o.cor, o.cor2, o.frente);
    for (const c of P.carros) carro(B, c.x / M, c.y / M, c.ang, c.cor);
    for (const [x, y, n] of P.pneus) pneus(B, x / M, y / M, n);
    for (const [x, y, cor] of P.tambores) tambor(B, x / M, y / M, cor);
    B.caixa(P.poste.x / M - 0.08, P.poste.x / M + 0.08, 0.16, 6.5, P.poste.y / M - 0.08, P.poste.y / M + 0.08, { todas: lisa('#8d8f8f') });
    B.caixa(P.poste.x / M - 0.12, P.poste.x / M + 0.12, 6.3, 6.45, P.poste.y / M - 0.9, P.poste.y / M + 0.1, { todas: lisa('#b9bbbb') });
  } else {
    /* a pista, o acostamento e as faixas */
    const p = m(P.pista);
    piso(B, p, 0.0, 'laje', ASFALTO);
    faixaNoChao(B, p.x0, p.x1, p.z0 + 0.45, 0.14, FAIXA);
    faixaNoChao(B, p.x0, p.x1, p.z1 - 0.45, 0.14, FAIXA);
    faixaNoChao(B, p.x0, p.x1, (p.z0 + p.z1) / 2, 0.14, AMARELA, 3, 5);
    for (const t of P.terrenos) placas(B, m(t), 6, 0.02);
    for (const t of P.patios) piso(B, m(t), 0.01, 'terra', TERRA);
    /* os muros (com o arame em cima) e os galpões de zinco */
    for (const r of P.muros) {
      const q = m(r), meio = (q.z0 + q.z1) / 2;
      bloco(B, { x0: q.x0, x1: q.x1, z0: meio - 0.12, z1: meio + 0.12 }, 0, 2.7, '#cfcac0');
      G.esticar(G.plano([q.x0, 2.7, meio], [1, 0, 0], [0, 1, 0]), 0, q.x1 - q.x0, 0, 0.45, 'lanca');
    }
    for (const r of P.galpoes) {
      const q = m(r);
      B.caixa(q.x0, q.x1, 0, r.h, q.z0, q.z1, { todas: { k: 'fibro', tinta: r.cor }, topo: { k: 'zinco', tinta: '#b9bcbe' }, base: null });
    }
    /* o ônibus verde parado e os dois carros brancos */
    const o = P.onibus;
    onibus(B, o.x / M, o.y / M, o.comp, o.larg, o.cor, o.cor2, o.frente);
    for (const c of P.carros) carro(B, c.x / M, c.y / M, c.ang, c.cor);
  }
  /* leva pro mundo: o metro vira unidade e o canto do tabuleiro vai pra O */
  for (const [C, lista] of [[B, 'casas'], [G, 'grades']]) {
    const n = C.pos.length / 3;
    if (!n) continue;
    const pos = new Float32Array(n * 3), Pp = C.pos;
    for (let i = 0; i < n; i++) { pos[3 * i] = O[0] + Pp[3 * i] * M; pos[3 * i + 1] = Pp[3 * i + 1] * M; pos[3 * i + 2] = O[1] + Pp[3 * i + 2] * M; }
    (destino[lista] = destino[lista] || []).push({ pos, uv: new Float32Array(C.uv), cor: new Float32Array(C.cor) });
  }
  return { plano: P };
}

/* =======================================================
   A BRIGA (a cena do combate, com a máscara)
   ======================================================= */
export function cenaDaCaravana(tipo, O) {
  const { W: TW, H: TH, CEL } = TABULEIRO, COLS = TW / CEL, ROWS = TH / CEL;
  const P = PLANOS[tipo]();
  const malha = new Uint8Array(COLS * ROWS).fill(1);
  /* o que barra: a célula cujo meio cai no sólido (engrossado até uma célula) */
  const barrar = r => {
    const e = Math.max(0, (CEL + 1 - Math.min(r.x1 - r.x0, r.y1 - r.y0)) / 2);
    const c0 = Math.max(0, Math.ceil((r.x0 - e) / CEL - 0.5)), c1 = Math.min(COLS - 1, Math.floor((r.x1 + e) / CEL - 0.5));
    const r0 = Math.max(0, Math.ceil((r.y0 - e) / CEL - 0.5)), r1 = Math.min(ROWS - 1, Math.floor((r.y1 + e) / CEL - 0.5));
    for (let j = r0; j <= r1; j++) for (let i = c0; i <= c1; i++) malha[j * COLS + i] = 0;
  };
  for (const r of P.solidos) barrar(r);
  const linhas = [];
  for (let j = 0; j < ROWS; j++) {
    const runs = []; let v0 = 0, n = 0;
    for (let i = 0; i < COLS; i++) { const v1 = malha[j * COLS + i]; if (v1 === v0) n++; else { runs.push(n); v0 = v1; n = 1; } }
    runs.push(n);
    linhas.push(runs.join(','));
  }
  const cena = Object.assign({ tres: true, largura: TW, altura: TH, celula: CEL, imagem: null, mascara: linhas.join(';'),
                               blocos: [], enfeites: [], varais: [], grades: [], pintura: null }, P.cena);
  const noMundo = (x, y) => [O[0] + x, O[1] + y];
  const doMundo = (x, z) => [x - O[0], z - O[1]];
  /* o chão (m): o concreto do pátio e o asfalto */
  const chao = () => 0.02;
  return { cena, noMundo, doMundo, u: [1, 0], v: [0, 1], origem: O, chao, plano: P, malha, COLS, ROWS };
}
