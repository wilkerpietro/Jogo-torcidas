/* NOVELLI JÚNIOR (Ituano, Itu) — pelo mapa de setores achado na busca, pelo
   satélite e pelas fotos de referência (15/11/2026); o meio do campo foi
   tirado dos dois gols. O campo corre de sul-sudeste a norte-noroeste; no
   quadro o OESTE (a coberta) fica em cima e o NORTE à direita.
   Quatro arquibancadas RETAS de cadeira vermelha, separadas nos cantos, em
   volta de um gramado oval com o piso de concreto e asfalto por fora:
   · EM CIMA (oeste), a COBERTA: comprida e rasa (12 m), toda debaixo do
     telhado cinza, com o prédio atrás. No mapa: a metade norte é a Coberta
     Ituano, a metade sul a Coberta Visitante.
   · À DIREITA (norte), a ARQUIBANCADA ITUANO: a mais funda (26 m), com o
     escudo em cadeira preta no meio e uma asa de cadeira branca em cada
     ponta, virada pro campo.
   · À ESQUERDA (sul), a ARQUIBANCADA VISITANTE: igual, mais rasa (16 m).
   · EMBAIXO (leste), a CENTRAL, em dois lances: o de baixo e, atrás do
     corredor, o de cima, com o ITUANO escrito em cadeira escura.
   OS ACESSOS: nenhuma boca de vomitório aparece; ficou sem. */
const VM = '#c8473f', VM2 = '#bb4038', PT = '#2b2d33', BR = '#e3ddd0', ESC = '#e9d9d3';
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* a grama oval; a família de contornos das arquibancadas: a linha da frente (k = 0) e as de k metros pra trás */
const GRAMA = { a: 85, b: 44.5, r: 40 };
const C = k => ({ a: 87.5 + k, b: 48.5 + k, r: 1 + k });
const CAD = (de, ate, mais) => ({ de, ate, cor: VM, cor2: VM2, padrao: 'mosaico', mistura: 0.3, corredor: 10, corEscada: ESC, vomitorios: false, ...mais });
/* uma arquibancada de trás do gol: vermelha, com o escudo em cadeira preta no meio */
const FUNDO = (lado, v0, v1, k, h) => { const a = v => A(lado * 87.5, v) - (lado > 0 && v < 0 ? 360 : 0), o = lado > 0 ? [v0, -7, 7, v1] : [v1, 7, -7, v0], base = { fora: C(k), h, paredeAtras: true, corFachada: '#d9d6cc' };
  return [CAD(a(o[0]), a(o[1]), base), CAD(a(o[1]), a(o[2]), { ...base, padrao: 'fracoes', fracoes: [[0.22, VM], [0.78, PT], [1, VM]], corredor: 0 }), CAD(a(o[2]), a(o[3]), base)]; };
/* uma asa de cadeira branca, na ponta de uma arquibancada de trás do gol */
const ASA = (u, v, ang, prof, h1) => ({ u, v, ang, comp: 9.5, prof, h: [1.5, h1], cor: BR, cor2: '#d6d0c3', padrao: 'mosaico', mistura: 0.3, corredor: 0, corredorFrente: 0, vomitorios: false, corFachada: '#d9d6cc', corLado: '#c9c6bb' });

export default {
  id: 'estadio-novelli-junior', nome: 'Novelli Júnior', clubes: ['ituano'], norte: 338.3, vazado: 0.4, folga: 24,
  corEscada: ESC,
  chao: { cor: '#6f6d68' },
  campo: { corMargem: '#55934f' },
  corMureta: '#e9e9e4',
  aneis: [
    /* o piso em volta do gramado oval, até a linha da frente das arquibancadas */
    { dentro: GRAMA, fora: C(0), h: [0.2, 0.2], fileiras: 2, corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#8a8780' }] },
    /* AS ARQUIBANCADAS */
    { dentro: C(0), fora: C(26), reto: true, andarReto: true, h: [1.5, 13], fileiras: 28,
      trechos: [
        /* a ARQUIBANCADA ITUANO (norte, à direita) */
        ...FUNDO(1, -35, 38, 26, [1.5, 13]),
        /* a COBERTA (oeste, em cima): a metade norte vermelha, o meio branco, a metade sul vermelha */
        CAD(A(80, 48.5), A(30, 48.5), { fora: C(13.5), h: [1.5, 7.5], corredor: 16, paredeAtras: true, corFachada: '#3a3d44' }),
        CAD(A(30, 48.5), A(-20, 48.5), { fora: C(13.5), h: [1.5, 7.5], cor: '#e9e6e0', cor2: '#dcd9d2', corredor: 16, paredeAtras: true, corFachada: '#3a3d44' }),
        CAD(A(-20, 48.5), A(-67.5, 48.5), { fora: C(13.5), h: [1.5, 7.5], corredor: 16, paredeAtras: true, corFachada: '#3a3d44' }),
        /* a ARQUIBANCADA VISITANTE (sul, à esquerda) */
        ...FUNDO(-1, -37, 40, 16, [1.5, 9]),
        /* a CENTRAL (leste, embaixo): o lance de baixo */
        CAD(A(-61, -48.5), A(68, -48.5), { fora: C(10), h: [1.5, 6], corredor: 20 })
      ] },
    /* o corredor entre os dois lances da central */
    { dentro: C(10), fora: C(13.5), reto: true, andarReto: true, h: [6, 6], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: A(-61, -58.5), ate: A(68, -58.5), tipo: 'passagem', alt: 6, cor: '#b9b6ad' }] },
    /* a CENTRAL: o lance de cima, com o ITUANO nas cadeiras */
    { dentro: C(13.5), fora: C(26), reto: true, andarReto: true, h: [7, 12], fileiras: 10, corredorFrente: 0,
      trechos: [CAD(A(-53, -62), A(52.5, -62), { fora: C(23), cor: VM, cor2: VM, corredor: 0, passoFileira: 0.45, celula: 0.4, texto: 'ITUANO', corTexto: PT, textoLargura: 0.84, textoAltura: 0.74,
                  paredeAtras: true, corFachada: '#d9d6cc' })] }
  ],
  /* as quatro asas de cadeira branca */
  retas: [ASA(84.3, 40.8, 27, 25, 12.5), ASA(84.3, -38.5, -28, 25, 12.5), ASA(-84.5, 41.5, 141, 16, 8.5), ASA(-83.5, -41.2, 214, 15.5, 8.5)],
  /* o telhado cinza da coberta */
  telhados: [{ y: 11.5, h: 0.5, cor: '#a9aaa8', pontos: [[-67.5, 51.3], [80, 51.3], [80, 62.5], [-67.5, 62.5]] }],
  fachada: { cor: '#d9d6cc' },
  /* as duas torres de trás da coberta e as duas do corredor da central */
  refletores: [[-30, 78, 38], [25, 78, 38], [-27, -60.2, 38, 6], [27.5, -60.2, 38, 6]],
  blocos: [
    /* o prédio de trás da coberta e o bloco das cabines */
    { u: 6, v: 66.5, w: 147, d: 7, h: 10, cor: '#3a3d44' }, { u: 29, v: 73.5, w: 43, d: 7, h: 9, cor: '#4a4d54' },
    /* os bancos de reserva vermelhos, do lado da coberta */
    { u: -11, v: 42, w: 9, d: 2.2, h: 2, cor: '#c8473f' }, { u: 2, v: 42, w: 4, d: 2.2, h: 2, cor: '#c8473f' }, { u: 14, v: 42, w: 9, d: 2.2, h: 2, cor: '#c8473f' }
  ],
  entorno: [
    /* em cima (oeste): o pátio, as piscinas do clube e o prédio de telha */
    { tipo: 'piscina', u: 71, v: 91, w: 15, d: 12 }, { tipo: 'piscina', u: 101, v: 91, w: 24, d: 12 }, { tipo: 'predio', u: -93, v: 84, w: 18, d: 22, h: 6, cor: '#d9a070' },
    /* à esquerda (sul): o campo de treino; embaixo (leste): a rua, as árvores e a rotatória */
    { tipo: 'grama', u: -128, v: 0, w: 30, d: 110, cor: '#4f8a52' }, { tipo: 'rua', de: [-130, -86], ate: [60, -86], larg: 9 }, { tipo: 'arvores', u: 0, v: -80, w: 100, d: 8, n: 16 },
    { tipo: 'rua', de: [60, -86], ate: [125, -100], larg: 14 },
    /* à direita (norte): o ginásio redondo */
    { tipo: 'cupula', u: 143, v: 5, r: 22, h: 9, cor: '#dcdcd6', cor2: '#c9c9c4' }
  ],
  /* pelo mapa de setores: a Galoucura do Ituano na Arquibancada Ituano (atrás do gol do norte) e a VISITANTE na Arquibancada
     Visitante (atrás do gol do sul); os outros bondes da casa na central e na metade norte da coberta */
  jogo: { mandante1: [-14, 16], mandante2: [255, 285], mandante3: [50, 72], visitante: [165, 195], tunelMandante: 0, tunelVisitante: 180, folgaPM: 4,
          fracao: { mandante1: 0.5, mandante2: 0.2, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { galoucura_do_ituano: 'mandante1' } }
};
