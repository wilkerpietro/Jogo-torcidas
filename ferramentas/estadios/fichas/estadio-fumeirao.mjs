/* FUMEIRÃO (Estádio Municipal Coaracy da Mata Fonseca, ASA, Arapiraca) — pelas
   seis fotos que o dono mandou (16/11/2026: "Segue as fotos do fumeirao pra você
   aprimorar"; três aéreas, uma panorâmica e uma foto de dentro, e um postal) e
   pelo satélite (o do Google). A primeira versão tinha saído só do satélite, e
   errada: eu tinha lido a lateral principal como coberta e o lado da rua como
   arquibancada. O rumo do campo, 17,6 graus, saiu do contorno do gramado no
   OpenStreetMap.
   No quadro a lateral principal (a das cabines) fica EM CIMA e o lado da rua, o
   da entrada, à DIREITA.
   Arquibancadas descobertas de degrau pintado de azul-ardósia, com as escadas
   amarelas, o muro branco e as placas de publicidade no alto:
   · EM CIMA, a lateral principal, de 120 m, em DOIS LANCES: o de baixo,
     estreito, junto do campo (os bancos de reserva ficam ao pé dele), a faixa
     branca, e o de cima, maior, em duas metades, com o bloco branco das cabines
     de imprensa no meio;
   · EMBAIXO, a outra lateral, com as três caixas brancas das bocas; no canto da
     direita ela DOBRA EM CURVA, com arquibancada, e continua atrás do gol;
   · À ESQUERDA, atrás do gol, a mais curta (68 m), solta das laterais.
   · À DIREITA, atrás do outro gol, a continuação dela, por cima do prédio da
     entrada: de fora só se veem as placas de publicidade no alto e a fachada
     branca do letreiro ESTÁDIO MUNICIPAL COARACY DA MATA FONSECA (por isso, na
     segunda versão, eu tinha tirado a arquibancada dali; a panorâmica de dentro
     mostra o degrau fazendo a curva).
   ESTIMADO: as alturas; o tom do azul (nas fotos de noite o degrau parece
   cinza); quantas escadas tem a lateral principal (pus como a outra) e o tamanho
   da caixa das cabines; as cores das placas; as torres de luz.
   AS TORCIDAS (escolha minha): a Mancha Negra no meio da lateral das bocas; a
   visitante atrás do gol da esquerda, a única arquibancada de trás do gol. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const AZUL = '#46526e', AZUL2 = '#3e4a64', AMARELO = '#dcb84f', BRANCO = '#ecece8', PRETO = '#26272a';
/* a beira de dentro (o fim da grama) e os fundos de cada lado */
const I = { a: 64, b: 46, r: 0.5 };
const LAT = b => ({ a: 64, b, r: 0.5 }), FUN = a => ({ a, b: 46, r: 0.5 });
/* a que dobra no canto: a mesma beira, de canto redondo (8 m por dentro, 20,5 por fora) */
const IC = { a: 64, b: 46, r: 8 }, FC = { a: 76.5, b: 58.5, r: 20.5 };
const DEGRAU = { cor: AZUL, cor2: AZUL2, padrao: 'mosaico', mistura: 0.25, semCadeiras: true, espelhoPintado: true, corEscada: AMARELO, corredor: 19, vomitorios: false,
  paredeAtras: true, corFachada: BRANCO, parapeito: 1.2 };
/* as placas de publicidade em fila: de (u0, v0) a (u1, v1), a `y` metros do chão */
const CORES = ['#e9e9e4', '#1d2c5e', '#b3262b', '#26272a', '#d9b62a', '#e9e9e4', '#2f6fc4', '#8a1f24'];
const PLACAS = (u0, v0, u1, v1, y, cada = 9) => { const L = Math.hypot(u1 - u0, v1 - v0), n = Math.max(1, Math.round(L / cada)), giro = Math.atan2(v1 - v0, u1 - u0) / RAD;
  return Array.from({ length: n }, (_, i) => ({ u: u0 + (u1 - u0) * (i + 0.5) / n, v: v0 + (v1 - v0) * (i + 0.5) / n, w: L / n - 0.8, d: 0.25, h: 1.5, y, cor: CORES[i % CORES.length], giro })); };

export default {
  id: 'estadio-fumeirao', nome: 'Fumeirão', clubes: ['asa'], norte: 17.6, vazado: 0.3, folga: 24,
  chao: { cor: '#a39a86' },
  campo: { corMargem: '#4f9a55' },
  corMureta: BRANCO, corAlambrado: '#d9dcdf',
  aneis: [
    /* a grama em volta do campo, até o pé das arquibancadas */
    { dentro: { a: 55.5, b: 37, r: 0.5 }, fora: I, reto: true, h: [0.12, 0.12], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#4f9a55' }] },
    /* a lateral principal tem DOIS LANCES (dono, 16/11/2026, com o postal de novo: "A arquibancada das cabines de imprensa tem
       dois lances de arquibancada"): este é o de BAIXO, estreito, junto do campo; no mesmo anel, a de trás do gol da esquerda */
    { dentro: I, fora: LAT(51.2), reto: true, h: [1.2, 3.6], fileiras: 5, corredorFrente: 1.2,
      trechos: [
        { de: 0, ate: A(62, 46), tipo: 'vazio' },
        { de: A(62, 46), ate: A(-58, 46), ...DEGRAU, paredeAtras: false },
        { de: A(-58, 46), ate: A(-64, 38), tipo: 'vazio' },
        /* À ESQUERDA, atrás do gol: a mais curta, solta das laterais */
        { de: A(-64, 38), ate: A(-64, -30), fora: FUN(77), h: [1.6, 8], fileiras: 13, ...DEGRAU, corredor: 15 },
        { de: A(-64, -30), ate: 360, tipo: 'vazio' }
      ] },
    /* e o lance de CIMA da lateral principal, atrás da faixa branca, em duas metades, com o bloco das cabines no meio */
    { dentro: LAT(51.2), fora: LAT(60.6), reto: true, h: [5.6, 10.2], fileiras: 9, corredorFrente: 1.2, corMureta: BRANCO,
      trechos: [
        { de: 0, ate: A(62, 51.2), tipo: 'vazio' },
        { de: A(62, 51.2), ate: A(12, 51.2), ...DEGRAU },
        { de: A(12, 51.2), ate: A(-10, 51.2), tipo: 'vazio' },
        { de: A(-10, 51.2), ate: A(-58, 51.2), ...DEGRAU },
        { de: A(-58, 51.2), ate: 360, tipo: 'vazio' }
      ] },
    /* a lateral das bocas, a CURVA do canto e a de trás do gol da direita: uma arquibancada só, que dobra (dono, 16/11/2026, com
       a panorâmica de novo: "Observe que tem uma curva com arquibancada") */
    { dentro: IC, fora: FC, reto: true, h: [2, 8.4], fileiras: 13, corredorFrente: 1.6,
      trechos: [
        /* À DIREITA, atrás do gol, por cima do prédio da entrada */
        { de: A(64, -38) - 360, ate: A(64, 38), ...DEGRAU, corredor: 15 },
        { de: A(64, 38), ate: A(-50, -46), tipo: 'vazio' },
        /* EMBAIXO, a lateral das três bocas, de caixa branca */
        { de: A(-50, -46), ate: A(56, -46), ...DEGRAU, vomitorios: { em: [0.2, 0.5, 0.8], f: 0.22, larg: 4.6, fundo: 3.4, cor: '#2b6f73', corParapeito: '#f1f3f0' } },
        /* a curva do canto, em leque */
        { de: A(56, -46), ate: A(64, -38), ...DEGRAU, corredor: 0 }
      ] }
  ],
  fachada: { cor: BRANCO },
  refletores: [[-40, 64, 28], [40, 64, 28], [-40, -63, 28], [40, -63, 28]],
  blocos: [
    /* a caixa branca das cabines, no alto da lateral principal, no meio */
    { u: 1, v: 55.9, w: 22, d: 9.4, h: 10.4, cor: BRANCO }, { u: 1, v: 51.1, w: 20.6, d: 0.2, h: 1.5, y: 7.2, cor: '#27303c' },
    { u: 1, v: 55.6, w: 23.4, d: 10.4, h: 0.3, y: 10.4, cor: '#d9dcdf' },
    /* os bancos de reserva, ao pé dela */
    ...[-24, -6, 12, 30].map(u => ({ u, v: 43.4, w: 8, d: 2.2, h: 2.1, cor: '#1d2c5e' })),
    /* as placas de publicidade no alto das três arquibancadas */
    ...PLACAS(-48, -58.6, 60, -58.6, 9.6), ...PLACAS(-76.6, -28, -76.6, 36, 9.2), ...PLACAS(-56, 60.4, -12, 60.4, 11.4), ...PLACAS(14, 60.4, 60, 60.4, 11.4),
    /* o lado da entrada: as placas no alto da arquibancada, que de fora escondem o degrau */
    ...PLACAS(76.2, -36, 76.2, 36, 9.6, 8),
    /* a fachada branca da entrada, pra rua, com a barra preta e o letreiro */
    { u: 76.9, v: 0, w: 0.3, d: 86, h: 1.2, cor: PRETO },
    { u: 77, v: 0, w: 0.3, d: 52, h: 1.4, y: 4.6, cor: BRANCO, texto: 'ESTÁDIO MUNICIPAL COARACY DA MATA FONSECA', corTexto: '#26272a', textoFace: true, giro: 0, textoLargura: 0.95, textoAltura: 0.5 }
  ],
  /* a câmera da aérea de noite do dono: do alto, por cima do lado da entrada, olhando o campo ao comprido */
  vista: [128, 46, -24, 0, 0, 4],
  entorno: [
    { tipo: 'rua', de: [-170, -84], ate: [170, -70], larg: 14 }, { tipo: 'rua', de: [90, -170], ate: [90, 170], larg: 12 },
    { tipo: 'rua', de: [-96, -170], ate: [-96, 170], larg: 9 }, { tipo: 'casas', u: -10, v: -72, nu: 9, nv: 1, passo: 14 },
    { tipo: 'predio', u: 40, v: 112, w: 50, d: 14, h: 6, cor: '#e4e4df' }, { tipo: 'casas', u: 120, v: 0, nu: 2, nv: 9, passo: 15 },
    { tipo: 'casas', u: -124, v: 0, nu: 2, nv: 9, passo: 15 }
  ],
  jogo: { mandante1: [256, 286], mandante2: [-16, 16], mandante3: [72, 100], visitante: [168, 196], tunelMandante: 88, tunelVisitante: 100, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { mancha_negra_do_asa: 'mandante1' } }
};
