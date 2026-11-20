/* JOIA DA PRINCESA (Estádio Municipal Alberto Oliveira, Fluminense de Feira,
   Feira de Santana) — pelas cinco fotos que o dono mandou (16/11/2026: "vamos
   começar o Nordeste pela Bahia no estádio Joia da Princesa"; duas de drone,
   uma de dentro, a tribuna e a fachada) e pelo satélite (o do Google; a Esri
   não tem Feira de Santana). O rumo do campo, 141,7 graus, saiu do contorno do
   gramado no OpenStreetMap.
   No quadro o SUDESTE fica à direita e o NORDESTE em cima; a tribuna coberta
   fica EMBAIXO (sudoeste).
   Oval inteiro de arquibancada de cimento (203 × 128 m por fora), com um pátio
   largo de concreto entre a grama e a mureta branca; o degrau é pintado por
   setor de vermelho, branco e verde, as cores do Fluminense de Feira, e no alto
   do muro corre a fileira de quadros vermelhos e verdes. Por fora, a fachada
   de pilastras, com o quadro pintado embaixo e o cobogó em cima.
   · EMBAIXO, no meio, a TRIBUNA: cadeiras (verde, vermelho e verde em cima;
     vermelho, branco e verde embaixo) debaixo da laje branca de beira verde,
     com a caixa-d'água vermelha em cima; os bancos de reserva verdes ao pé.
   · EM CIMA, de frente pra ela: verde no meio, branco dos dois lados e
     vermelho nas pontas (a foto de dentro).
   ESTIMADO: as alturas; AS CORES DAS DUAS CURVAS e dos lados da tribuna (as
   fotos mostram pedaços, e a pintura muda de uma foto pra outra); as torres de
   luz. O oval está 3,7 m fora do meio do gramado no satélite; na ficha ficou
   centrado. O satélite é antigo e escuro: as cores saíram todas das fotos.
   AS TORCIDAS (escolha minha): a Falange Tricolor no meio da arquibancada de
   frente pra tribuna; a visitante na curva da esquerda. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const VERM = '#b23a36', VERM2 = '#a5332f', BRANCO = '#e6e4dc', BRANCO2 = '#dad8cf', VERDE = '#4f9a62', VERDE2 = '#468d58', CONC = '#c9c4b0';
/* a beira da grama, a frente das arquibancadas (o fim do pátio) e o muro de fora */
const GRAMA = { a: 60, b: 37.7, r: 1 }, DENTRO = { a: 88.8, b: 47.7, r: 39 }, FORA = { a: 101.5, b: 64, r: 52 };
const B = 47.7, TOPO = 9.2;
const SETOR = (de, ate, cor, cor2, mais) => ({ de, ate, cor, cor2, padrao: 'mosaico', mistura: 0.22, semCadeiras: true, espelhoPintado: true, corredor: 0, escadaNaBorda: true,
  corEscada: '#d6d3c8', vomitorios: false, parapeito: 0.5, corFachada: CONC, ...mais });
const BOCA = { vomitorios: { em: [0.5], f: 0.3, larg: 3.6, fundo: 3 } };
const VM = (de, ate, mais) => SETOR(de, ate, VERM, VERM2, mais), BR = (de, ate, mais) => SETOR(de, ate, BRANCO, BRANCO2, mais), VD = (de, ate, mais) => SETOR(de, ate, VERDE, VERDE2, mais);
/* a tribuna: três blocos de cadeira debaixo da laje */
const LAJE = { h: 14.6, larg: 14.5, avanco: 2.4, cai: 0.5, cor: '#eceae3', corBorda: '#3f8f5a', corTrelica: '#cfcdc4', corPilar: '#d9d6cb', pelaColuna: true };
const TRIB = (u0, u1, baixo, cima) => ({ de: A(u0, -B), ate: A(u1, -B), padrao: 'fracoes', fracoes: [[0.46, baixo], [0.5, '#d6d3c8'], [1, cima]], corredor: 0, escadaNaBorda: true,
  corEscada: '#d6d3c8', vomitorios: false, parapeito: 2.6, corFachada: BRANCO, cobertura: LAJE });
/* O MURO DE FORA, de pilastra em pilastra (6,4 m): o quadro pintado embaixo, o cobogó em cima e, no alto, a fileira de
   quadros vermelhos e verdes. O trecho da tribuna fica de fora (ali é o prédio dela). */
function muroDeFora(c, passo) {
  const { a, b, r } = c, s = a - r, t = b - r, pecas = [
    ['reta', [s, b], [-s, b]], ['arco', [-s, t], 90, 180], ['reta', [-a, t], [-a, -t]], ['arco', [-s, -t], 180, 270],
    ['reta', [-s, -b], [s, -b]], ['arco', [s, -t], 270, 360], ['reta', [a, -t], [a, t]], ['arco', [s, t], 0, 90]], out = [];
  let k = 0;
  for (const p of pecas) {
    const comp = p[0] === 'reta' ? Math.hypot(p[2][0] - p[1][0], p[2][1] - p[1][1]) : r * (p[3] - p[2]) * RAD, n = Math.max(1, Math.round(comp / passo));
    const pt = f => p[0] === 'reta' ? [p[1][0] + (p[2][0] - p[1][0]) * f, p[1][1] + (p[2][1] - p[1][1]) * f]
      : [p[1][0] + r * Math.cos((p[2] + (p[3] - p[2]) * f) * RAD), p[1][1] + r * Math.sin((p[2] + (p[3] - p[2]) * f) * RAD)];
    for (let i = 0; i < n; i++, k++) {
      const p0 = pt(i / n), p1 = pt((i + 1) / n), u = (p0[0] + p1[0]) / 2, v = (p0[1] + p1[1]) / 2, w = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      if (v < -b + 2 && Math.abs(u) < 17) continue;
      const giro = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) / RAD;
      out.push({ u: p0[0], v: p0[1], w: 0.7, d: 1, h: TOPO + 0.5, cor: CONC, giro });
      out.push({ u, v, w: w - 0.6, d: 0.5, h: 3.6, cor: [VERM, BRANCO, VERDE, BRANCO][k % 4], giro });
      out.push({ u, v, w: w - 0.6, d: 0.4, h: 4.2, y: 4.2, cor: '#9c9889', giro });
      out.push({ u, v, w: w * 0.72, d: 0.5, h: 1.3, y: TOPO + 0.5, cor: k % 2 ? VERDE : VERM, giro });
    }
  }
  return out;
}

export default {
  id: 'estadio-joia-da-princesa', nome: 'Joia da Princesa', clubes: ['fluminense-de-feira'], norte: 141.7, vazado: 0.3, folga: 20,
  chao: { cor: '#8d8a82' },
  campo: { c: 108, l: 70, corMargem: '#4f9a55' },
  corMureta: BRANCO, alambrado: false, muro: false,
  aneis: [
    /* o pátio de concreto entre a grama e a mureta das arquibancadas */
    { dentro: GRAMA, fora: DENTRO, h: [0.12, 0.12], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#a29d91' }] },
    { dentro: DENTRO, fora: FORA, reto: true, h: [2.4, TOPO], fileiras: 15, corredorFrente: 1.6,
      trechos: [
        /* a curva da direita e a ponta de cima: vermelho */
        VM(-20, 8, BOCA), VM(8, A(36, B)),
        /* EM CIMA, de frente pra tribuna: branco, verde no meio, branco */
        BR(A(36, B), A(18, B)), VD(A(18, B), A(0, B)), VD(A(0, B), A(-18, B)), BR(A(-18, B), A(-36, B)),
        /* a ponta de cima e a curva da esquerda: vermelho, branco e verde */
        VM(A(-36, B), 160, BOCA), BR(160, 190, BOCA), VD(190, A(-38, -B), BOCA),
        /* EMBAIXO: vermelho, a TRIBUNA, verde */
        VM(A(-38, -B), A(-15, -B)),
        TRIB(-15, -5, VERM, VERDE), TRIB(-5, 5, BRANCO, VERM), TRIB(5, 15, VERDE, VERDE2),
        VD(A(15, -B), A(38, -B)),
        /* a curva da direita, do lado da tribuna: branco */
        BR(A(38, -B), 340, BOCA)
      ] }
  ],
  fachada: { cor: CONC },
  refletores: [[-62, -70, 32], [62, -70, 32], [-62, 70, 32], [62, 70, 32]],
  blocos: [
    ...muroDeFora(FORA, 6.4),
    /* o prédio da tribuna, atrás dela, e a caixa-d'água vermelha em cima da laje */
    { u: 0, v: -68.6, w: 31, d: 9, h: 12.6, cor: BRANCO }, { u: 0, v: -73.2, w: 31, d: 0.3, h: 3.4, cor: VERDE },
    { u: 2, v: -66.5, w: 5, d: 4, h: 3.6, y: 14.8, cor: VERM },
    /* os bancos de reserva verdes, ao pé da tribuna */
    { u: -18.5, v: -44.6, w: 23, d: 2, h: 2, cor: '#3d9b8a' }, { u: 15, v: -44.6, w: 24, d: 2, h: 2, cor: '#3d9b8a' }
  ],
  /* a câmera da primeira foto de drone do dono: do alto, por trás do gol da direita, com a tribuna à esquerda */
  vista: [138, 56, 0, -20, 0, 0],
  entorno: [
    { tipo: 'rua', de: [-170, 84], ate: [170, 84], larg: 11 }, { tipo: 'rua', de: [122, -170], ate: [122, 170], larg: 11 },
    { tipo: 'rua', de: [-170, -104], ate: [170, -104], larg: 9 }, { tipo: 'rua', de: [-122, -170], ate: [-122, 170], larg: 8 },
    { tipo: 'arvores', u: -10, v: 74, w: 80, d: 6, n: 8 }, { tipo: 'arvores', u: -50, v: -86, w: 60, d: 20, n: 9 },
    { tipo: 'casas', u: 0, v: 104, nu: 14, nv: 2, passo: 15 }, { tipo: 'casas', u: -144, v: 0, nu: 2, nv: 10, passo: 15 },
    { tipo: 'casas', u: 0, v: -124, nu: 12, nv: 1, passo: 15 }, { tipo: 'casas', u: 144, v: 0, nu: 2, nv: 10, passo: 15 },
    { tipo: 'estacionamento', u: 62, v: -86, w: 60, d: 22 }
  ],
  jogo: { mandante1: [75, 105], mandante2: [112, 140], mandante3: [40, 68], visitante: [160, 200], tunelMandante: 270, tunelVisitante: 180, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { falange_tricolor: 'mandante1' } }
};
