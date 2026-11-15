/* MAIÃO (Estádio Municipal José Maria de Campos Maia — Mirassol) — as
   MEDIDAS saíram do satélite, que pega o estádio no meio da reforma (a
   curva norte demolida, o lado leste em obra); o ESTADO ATUAL saiu das
   aéreas recentes (15/11/2026), já com a fachada amarela. O meio do campo
   foi tirado do círculo central. O campo é norte-sul; no quadro o OESTE (a
   coberta) fica em cima e o NORTE à direita. NÃO achei mapa de setores.
   · EM CIMA (oeste), a COBERTA: reta, de cadeira em blocos (azul, verde,
     verde, amarelo, do norte pro sul), debaixo do telhado claro; a frente
     fica descoberta. Atrás, o ginásio de teto em arco e as piscinas do
     clube.
   · À DIREITA (norte), a CURVA NOVA: cadeira azul-escura, com a fachada
     amarela alta por fora, o escudo e o nome do estádio.
   · EMBAIXO (leste) e À ESQUERDA (sul), a arquibancada de cadeira AMARELA,
     que vem do lado leste inteiro e dá a volta na curva sul até encostar na
     coberta; no alto do meio do leste, a cabine.
   · Em volta do gramado, a pista de piso azulado.
   OS ACESSOS: nenhuma boca de vomitório aparece; ficou sem. */
const AM = '#e6c22e', AM2 = '#d9b526', AZE = '#22346b', VD = '#2f8a57', AZ = '#2f4f9c', FACH = '#e6b820';
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* a grama e a pista; a beira das arquibancadas; o fundo da amarela e o da curva nova; a frente e o fundo da coberta */
const GRAMA = { a: 74, b: 39, r: 32 }, I = { a: 81, b: 45, r: 38 };
const F_AM = { a: 92, b: 56, r: 49 }, F_N = { a: 97, b: 61, r: 54 }, W_D = { a: 87, b: 51, r: 44 }, W_F = { a: 104, b: 68, r: 61 };
const CAD = (de, ate, cor, cor2, mais) => ({ de, ate, cor, cor2, padrao: 'mosaico', mistura: 0.3, corEscada: '#f1ead0', vomitorios: false, ...mais });
const COBERTA = [[42, 22, AZ, '#2a478c'], [22, 1, VD, '#2a7d4f'], [1, -19.5, VD, '#2a7d4f'], [-19.5, -45, AM, AM2]].map(([u0, u1, cor, cor2]) =>
  CAD(A(u0, 51), A(u1, 51), cor, cor2, { dentro: W_D, fora: W_F, h: [2, 10], corredor: 0, escadaNaBorda: u0 < 42, paredeAtras: true, corFachada: '#e3e1da' }));

export default {
  id: 'estadio-maiao', nome: 'Maião', clubes: ['mirassol', 'ituano'], norte: 0, vazado: 0.4, folga: 22,
  corEscada: '#f1ead0',
  /* a vista de perto da fachada */
  vista: [175, 28, -45, 92, 6, 0],
  chao: { cor: '#7b7870' },
  campo: { corMargem: '#4f9353', pista: { dentro: GRAMA, fora: I, cor: '#8f97b0', raias: 0 } },
  corMureta: '#e9e9e4',
  aneis: [
    { dentro: I, fora: F_AM, reto: true, andarReto: true, h: [1.5, 6.5], fileiras: 12,
      trechos: [
        /* a CURVA NOVA do norte: cadeira azul-escura, com a fachada amarela alta por fora */
        CAD(-40.3, A(42, 51), AZE, '#1c2c5c', { fora: F_N, h: [1.5, 9], corredor: 10, corEscada: '#c9cbd3', paredeAtras: true, corFachada: FACH, parapeito: 4.5 }),
        /* a COBERTA */
        ...COBERTA,
        /* a AMARELA: a curva sul e o lado leste inteiro */
        CAD(A(-45, 51), 319.7, AM, AM2, { corredor: 9, paredeAtras: true, corFachada: '#e9e9e4', parapeito: 2.5 })
      ] }
  ],
  /* o telhado claro da coberta */
  telhados: [{ y: 13.5, h: 0.5, cor: '#d9dadb', pontos: [[-45, 57], [38, 57], [38, 69.5], [-45, 69.5]] }],
  fachada: { cor: '#e9e9e4' },
  refletores: [[-70, 63, 32], [62, 73, 32], [-55, -61, 32], [56, -61, 32]],
  blocos: [
    /* o painel da fachada, com o escudo e o nome do estádio */
    { u: 97.4, v: 0, w: 0.8, d: 32, h: 11, y: 1.5, cor: FACH, texto: 'MFC|ESTÁDIO MUNICIPAL JOSÉ MARIA DE CAMPOS MAIA', corTexto: '#1f7a4a', textoFace: true, textoLargura: 0.92, textoAltura: 0.2 },
    /* os retângulos verdes e cinza da fachada, nos dois cantos */
    ...[[84, 44, 52, '#2f8a57'], [88, 38, 46, '#8f9498'], [91.5, 31, 38, '#2f8a57'], [84, -44, -52, '#8f9498'], [88, -38, -46, '#2f8a57'], [91.5, -31, -38, '#8f9498']]
      .map(([u, v, giro, cor]) => ({ u: u + 1.2 * Math.cos(giro * RAD), v: v + 1.2 * Math.sin(giro * RAD), w: 0.4, d: 7, h: 2.2, y: 6, cor, giro })),
    /* a cabine no alto do meio do lado leste */
    { u: 0, v: -58.5, w: 14, d: 5, h: 6, y: 5, cor: '#e6c22e' }, { u: 0, v: -58.5, w: 14.6, d: 5.6, h: 0.5, y: 11, cor: '#2f4f9c' },
    /* os bancos de reserva, do lado da coberta */
    { u: -12, v: 47.5, w: 16, d: 3, h: 2.2, cor: '#e9ecee' }, { u: 12, v: 47.5, w: 16, d: 3, h: 2.2, cor: '#e9ecee' }
  ],
  entorno: [
    /* em cima (oeste): o ginásio de teto em arco, o prédio e as piscinas do clube */
    { tipo: 'predio', u: -67, v: 73, w: 43, d: 23, h: 12, cor: '#b9bcc0' }, { tipo: 'predio', u: -20, v: 80, w: 40, d: 12, h: 6, cor: '#3f4046' },
    { tipo: 'piscina', u: 35, v: 80, w: 30, d: 15 }, { tipo: 'piscina', u: 92, v: 86, w: 16, d: 10 },
    /* à direita (norte): a avenida; à esquerda (sul) e embaixo (leste): as ruas e as casas */
    { tipo: 'rua', de: [107, -100], ate: [107, 100], larg: 9 }, { tipo: 'rua', de: [-99, -100], ate: [-99, 100], larg: 6 },
    { tipo: 'casas', u: -112, v: -6, nu: 1, nv: 11, passo: 15 }, { tipo: 'casas', u: 4, v: -76, nu: 11, nv: 1, passo: 15 },
    { tipo: 'arvores', u: 104, v: -50, w: 8, d: 30, n: 6 }
  ],
  /* (escolhas minhas, sem fonte: não achei mapa de setores) a Fúria do Leão (e a Galoucura do Ituano, enquanto o Ituano manda
     aqui) no meio da amarela do leste e a visitante na curva nova do norte; os outros bondes da casa na curva sul e na coberta */
  jogo: { mandante1: [255, 285], mandante2: [165, 195], mandante3: [75, 105], visitante: [-22, 12], tunelMandante: 270, tunelVisitante: -5, folgaPM: 4,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { furia_do_leao: 'mandante1', galoucura_do_ituano: 'mandante1' } }
};
