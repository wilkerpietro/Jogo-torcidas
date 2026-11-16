/* ZAMA MACIEL (URT, Patos de Minas) — pelo satélite e pelas quatro fotos que o
   dono mandou depois da primeira versão (15/11/2026: "Segue fotos do
   estádio": uma de jogo, com a Galoucura atrás do gol, uma aérea antiga,
   uma do gramado e uma de drone recente). O campo corre quase norte-sul; no
   quadro o OESTE fica em cima e o NORTE à direita.
   Estádio pequeno, no meio de um quarteirão do centro (a Rua Uberlândia):
   · EMBAIXO (leste), a lateral comprida DESCOBERTA, de degrau cinza-azulado,
     com os painéis laranja e azul no alto do muro de trás; perto da ponta
     sul, a TRIBUNA coberta BAMBU & SABIÁ LOTEAMENTOS: as cadeiras cinza
     embaixo, o camarote de vidro de molduras laranja em cima e o telhado azul
     com a fachada laranja.
   · À ESQUERDA (sul), a arquibancada de trás do gol, descoberta (a da foto
     do jogo, com a Galoucura de visitante), com as letras pintadas no degrau
     (no satélite parecem TUF; li URT de cabeça pra baixo) e, atrás, os
     galpões de telhado curvo.
   · EM CIMA (oeste), NÃO há arquibancada: os prédios brancos do clube, de
     dois andares e terraço, e a caixa das cabines em cima de pilotis, de
     telhado cinza com o beiral azul. (Na primeira versão eu tinha lido os
     telhados desses prédios como duas arquibancadas cobertas.)
   · À DIREITA (norte), NÃO há arquibancada: o muro, a grade e a árvore.
   AS TORCIDAS: a visitante atrás do gol do sul (a foto do jogo); a Poeira
   Azul no meio da lateral leste (escolha minha, sem mapa de setores). */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const I = { a: 56.5, b: 39, r: 0.5 };
const LAT = b => ({ a: 56.5, b, r: 0.5 }), FUN = a => ({ a, b: 39, r: 0.5 });
const BR = '#e9e9e4', LARANJA = '#e0782f', AZUL = '#2f5fa8';
/* os painéis laranja e azul no alto do muro de trás da lateral leste */
const PAINEIS = Array.from({ length: 22 }, (_, i) => ({ u: -28 + i * 3.8 + 1.9, v: -46.4, w: 3.7, d: 0.4, h: 1.6, y: 5, cor: i % 2 ? AZUL : LARANJA }));

export default {
  id: 'estadio-zama-maciel', nome: 'Zama Maciel', clubes: ['urt'], norte: 354, vazado: 0.3, folga: 26,
  chao: { cor: '#7e7a72' },
  campo: { corMargem: '#4f9353' },
  corMureta: BR,
  aneis: [
    /* a margem de grama em volta do gramado, ao pé de tudo */
    { dentro: { a: 52.8, b: 34.3, r: 0.5 }, fora: I, reto: true, h: [0.15, 0.15], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#4f9353' }] },
    { dentro: I, fora: LAT(46), reto: true, h: [1, 4.6], fileiras: 9,
      trechos: [
        /* EM CIMA (oeste) e À DIREITA (norte): sem arquibancada */
        { de: A(55, -39) - 360, ate: A(-56.5, 30), tipo: 'vazio' },
        /* À ESQUERDA (sul): a arquibancada de trás do gol, com as letras no degrau */
        { de: A(-56.5, 30), ate: A(-56.5, -35), fora: FUN(65), h: [0.8, 4.6], fileiras: 9, cor: '#999b9f', cor2: '#8c8e92', padrao: 'mosaico', mistura: 0.25,
          semCadeiras: true, corEscada: BR, vomitorios: false, corredor: 16, paredeAtras: true, corFachada: BR, texto: 'URT', corTexto: '#f1f2ee', textoLargura: 0.3, textoAltura: 0.7 },
        { de: A(-56.5, -35), ate: A(-52, -39), tipo: 'vazio' },
        /* EMBAIXO (leste): as cadeiras cinza debaixo da tribuna BAMBU & SABIÁ */
        { de: A(-52, -39), ate: A(-30, -39), cor: '#9a9ea4', cor2: '#8c9096', padrao: 'mosaico', mistura: 0.3, corEscada: BR, vomitorios: false, corredor: 11,
          escadaNaBorda: true, paredeAtras: true, corFachada: BR },
        /* o resto da lateral leste: degrau cinza-azulado */
        { de: A(-30, -39), ate: A(55, -39), cor: '#7b8796', cor2: '#717d8c', padrao: 'mosaico', mistura: 0.3, semCadeiras: true, corEscada: BR,
          vomitorios: false, corredor: 17, escadaNaBorda: true, paredeAtras: true, corFachada: BR }
      ] }
  ],
  fachada: { cor: BR },
  refletores: [[-42, -48, 24], [10, -48, 24], [-30, 48, 22], [30, 48, 22]],
  blocos: [
    /* a tribuna BAMBU & SABIÁ: o camarote de vidro de molduras laranja em cima das cadeiras, o telhado azul e a fachada laranja */
    { u: -41, v: -46.5, w: 22, d: 3.5, h: 3.2, y: 4.8, cor: '#3a4a55' },
    { u: -41, v: -44.7, w: 22, d: 0.3, h: 3.2, y: 4.8, cor: LARANJA },
    { u: -41, v: -43.5, w: 23, d: 7.5, h: 0.4, y: 8.4, cor: AZUL, cobertura: true },
    { u: -41, v: -39.8, w: 0.4, d: 23, h: 1.3, y: 8.1, cor: LARANJA, texto: 'BAMBU & SABIÁ LOTEAMENTOS', corTexto: '#f4f4f0', textoFace: true, giro: 90, textoLargura: 0.92, textoAltura: 0.6, cobertura: true },
    ...PAINEIS,
    /* o oeste, sem arquibancada: os prédios brancos do clube (dois andares, terraço em cima) e a caixa das cabines em pilotis */
    { u: -38, v: 45, w: 37, d: 10, h: 6, cor: BR }, { u: -38, v: 45, w: 37, d: 10, h: 0.3, y: 6, cor: '#9da1a3' },
    { u: 30, v: 46, w: 52, d: 12, h: 6, cor: BR }, { u: 30, v: 46, w: 52, d: 12, h: 0.3, y: 6, cor: '#9da1a3' },
    ...[-17, -9, -1].map(u => ({ u, v: 41.5, w: 0.6, d: 0.6, h: 4, cor: '#c9c9c4' })),
    { u: -8, v: 45, w: 20, d: 9, h: 5, y: 4, cor: BR }, { u: -8, v: 45, w: 21, d: 10, h: 0.5, y: 9, cor: '#8f9396' },
    { u: -8, v: 40, w: 21, d: 0.3, h: 0.8, y: 8.7, cor: AZUL },
    /* o muro do fundo norte, com a grade */
    { u: 57.5, v: 0, w: 1, d: 76, h: 3, cor: '#2f3a33' },
    /* os galpões de telhado curvo atrás da arquibancada do sul */
    { u: -74, v: 18, w: 16, d: 22, h: 7, cor: '#e3dccb' }, { u: -74, v: -6, w: 16, d: 22, h: 7, cor: '#e3dccb' },
    /* os bancos de reserva, do lado oeste */
    { u: -14, v: 37.5, w: 9, d: 2.2, h: 2, cor: '#2f5fa8' }, { u: 10, v: 37.5, w: 9, d: 2.2, h: 2, cor: '#2f5fa8' }
  ],
  /* a câmera da foto do gramado: do lado oeste, olhando a tribuna BAMBU & SABIÁ */
  vista: [-10, 6, 30, -40, 5, -42],
  entorno: [
    { tipo: 'rua', de: [-140, -56], ate: [140, -56], larg: 12 }, { tipo: 'rua', de: [82, 120], ate: [82, -120], larg: 12 },
    { tipo: 'rua', de: [-90, 120], ate: [-90, -120], larg: 10 },
    { tipo: 'casas', u: 0, v: -72, nu: 14, nv: 1, passo: 15 }, { tipo: 'casas', u: -20, v: 68, nu: 10, nv: 1, passo: 15 },
    { tipo: 'predio', u: -74, v: -32, w: 16, d: 30, h: 7, cor: '#c9714f' },
    { tipo: 'arvores', u: 68, v: 30, w: 14, d: 20, n: 5 }, { tipo: 'predio', u: 70, v: -10, w: 14, d: 30, h: 7, cor: '#c9c9c4' },
    { tipo: 'predio', u: 70, v: -36, w: 18, d: 18, h: 9, cor: '#d9d9d4' }
  ],
  jogo: { mandante1: [262, 288], mandante2: [292, 316], mandante3: [228, 246], visitante: [168, 192], tunelMandante: 275, tunelVisitante: 180, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { poeira_azul: 'mandante1' } }
};
