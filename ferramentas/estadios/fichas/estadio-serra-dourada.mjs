/* SERRA DOURADA (Goiás e Vila Nova, Goiânia) — a planta pelo satélite (de
   2026, com o estádio parado e em obra) e o resto pelas três imagens do
   PROJETO DA REFORMA que o dono mandou depois da primeira versão
   (16/11/2026): o camarote do nível do campo, a aérea e a vista da
   arquibancada. É o estádio como fica depois da obra, não como o satélite
   mostra hoje. O campo corre quase norte-sul; no quadro o OESTE fica em cima
   e o NORTE à direita. Estádio grande, quase redondo, de concreto:
   · Em volta do gramado, a PISTA DE ATLETISMO vermelha, de oito raias, e o
     piso cinza-azulado entre ela e a arquibancada.
   · O ANEL DE BAIXO, de cadeira amarela, fundo, dando a volta inteira, em
     blocos entre as escadas; a frente dele é alta, com o CAMAROTE DO NÍVEL
     DO CAMPO (o vidro) por baixo.
   · EM CIMA (oeste) e EMBAIXO (leste), por trás do anel de baixo, a faixa
     dos CAMAROTES de vidro e a ARQUIBANCADA DE CIMA, de cadeira amarela, com
     as caixas das bocas perto da frente, debaixo da cobertura de concreto
     claro, com os mastros e os tirantes por cima e a armação comprida de
     refletores no meio.
   · À ESQUERDA (sul), sem arquibancada de cima: o terraço com as árvores e
     o bloco no eixo do campo.
   · À DIREITA (norte), sem arquibancada de cima: o prédio em arco de laje
     cinza-azulada, com o bloco no eixo do campo.
   Estimado: as alturas, o número de blocos e de fileiras, a largura da
   faixa dos camarotes.
   AS TORCIDAS (escolhas minhas, sem fonte): a da casa (a Força Jovem Goiás
   ou o Esquadrão Vilanovense, conforme quem manda) no meio da arquibancada
   de cima do oeste; a visitante na ponta norte da de cima do leste. */
import OSM from '../arredores/estadio-serra-dourada.osm.mjs';
const RAD = Math.PI / 180;
const E = (a, b, cu = 0, cv = 0) => ({ forma: 'elipse', a, b, cu, cv });
/* a beira da arquibancada, o fundo do anel de baixo, o fundo da faixa dos camarotes e o contorno de fora */
const BEIRA = E(82, 60, 0, -2), FRENTE = E(84.5, 62.5, 0, -2), BAIXO = E(104, 95, -2, -3), CAMAROTE = E(107.5, 98.5, -2, -3), FORA = E(141, 134, -8, -3);
const AM = '#d9b23c', AM2 = '#cfa630', CONC = '#c9c5ba', VIDRO = '#36434d';
const CAD = { cor: AM, cor2: AM2, padrao: 'mosaico', mistura: 0.3, corEscada: '#dedacd', corredor: 0, escadaNaBorda: true, vomitorios: false };
/* o anel de baixo: 36 blocos de 10 graus, a escada em cada divisa */
const ANEL_BAIXO = Array.from({ length: 36 }, (_, i) => ({ ...CAD, de: i * 10, ate: (i + 1) * 10, escadaNaBorda: i > 0 }));
/* uma arquibancada de cima em pares de blocos: a escada do meio de cada par leva a caixa da boca; as das divisas, não */
const BOCA = { f: 0.14, cada: 1, larg: 4.4, fundo: 5, cor: '#2f2c28', corParapeito: '#e6e3d8' };
const CIMA = (de, ate, pares) => Array.from({ length: pares }, (_, i) => { const a0 = de + (ate - de) * i / pares, a1 = de + (ate - de) * (i + 1) / pares;
  return { ...CAD, de: a0, ate: a1, escadaNaBorda: i > 0, corredor: (a1 - a0) * RAD * 108 * 0.52, vomitorios: BOCA, paredeAtras: true, corFachada: CONC, parapeito: 2.4 }; });
const FAIXA = (de, ate) => ({ de, ate, semCadeiras: true, passoFileira: 1.6, cor: VIDRO, cor2: '#3f4d58', padrao: 'mosaico', mistura: 0.3, corMureta: '#e3e0d6', vomitorios: false, corredor: 0, escadaNaBorda: false });
const COBERTURA = (de, ate) => ({ fora: FORA, dentro: BAIXO, de, ate, n: Math.round((ate - de) / 5.6), h: 32, cai: -1.5, cor: '#c2beb3', cor2: '#b9b5aa', corNervura: '#dedad0', larguraNervura: 0.4,
  beiral: [2.2, 1.4], corBeiral: '#d3cfc4', pilares: { f: 0.97, base: 0, cor: '#c9c5ba', esp: 0.9, viga: false }, mastros: { f: 0.72, h: 10, abre: 0.6, cada: 3, cor: '#eceae2', esp: 0.3 } });
/* a armação comprida de refletores em cima do meio de cada cobertura */
const LUZES = v => [{ u: -6, v, w: 64, d: 1.2, h: 4.6, y: 36, cor: '#e9ebe6', cobertura: true }, ...[-34, -20, -6, 8, 22].map(u => ({ u, v, w: 0.5, d: 0.5, h: 4.4, y: 32, cor: '#d9dcd7', cobertura: true }))];
const O0 = 25, O1 = 159, L0 = 204, L1 = 331;

export default {
  id: 'estadio-serra-dourada', nome: 'Serra Dourada', clubes: ['goias', 'vila-nova'], norte: 9.1, vazado: 0.3, folga: 20,
  chao: { cor: '#a39c8c' },
  /* (o campo de 105 x 68 dentro da pista, como no projeto) */
  campo: { corMargem: '#4f9150', corFosso: '#8f9aa5', pista: { dentro: { a: 78.5, b: 38.5, r: 38.5 }, fora: { a: 89, b: 49, r: 49 }, cor: '#c8573f', raias: 8 } },
  corMureta: VIDRO, corAlambrado: '#c9d3d8',
  alambrado: { cor: '#c9d3d8', corBase: '#b9b6ac' },
  aneis: [
    /* a beira de piso ao pé do anel de baixo, com o guarda-corpo */
    { dentro: BEIRA, fora: FRENTE, h: [0.2, 0.2], fileiras: 2, corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#b9b6ac' }] },
    /* O ANEL DE BAIXO, de cadeira amarela, a volta inteira; a frente alta é o vidro do camarote do nível do campo */
    { dentro: FRENTE, fora: BAIXO, h: [3.2, 11], fileiras: 28, corredorFrente: 1.2, vomitorios: false, trechos: ANEL_BAIXO },
    /* a faixa dos camarotes de vidro, só debaixo das duas arquibancadas de cima */
    { dentro: BAIXO, fora: CAMAROTE, h: [11.6, 13.4], fileiras: 2, corredorFrente: 0, vomitorios: false,
      trechos: [FAIXA(O0, O1), { de: O1, ate: L0, tipo: 'passagem', alt: 11, cor: '#bdb9ae' }, FAIXA(L0, L1), { de: L1, ate: O0 + 360, tipo: 'passagem', alt: 11, cor: '#bdb9ae' }] },
    /* AS DUAS DE CIMA, e o que há nas pontas */
    { dentro: CAMAROTE, fora: FORA, h: [14, 28], fileiras: 34, corredorFrente: 2.2,
      trechos: [
        ...CIMA(O0, O1, 9),
        /* À ESQUERDA (sul): o terraço */
        { de: O1, ate: L0, tipo: 'passagem', cor: '#b3a78f' },
        ...CIMA(L0, L1, 9),
        /* À DIREITA (norte): o vão e o prédio em arco */
        { de: L1, ate: O0 + 360, tipo: 'vazio' }
      ] }
  ],
  /* as duas coberturas de concreto claro, com os mastros, e a laje do prédio em arco do norte */
  coberturasAnel: [
    COBERTURA(O0, O1), COBERTURA(L0, L1),
    { fora: FORA, dentro: E(116, 109, -8, -3), de: L1 - 360 + 5, ate: O0 - 5, n: 10, h: 13, cai: 0, cor: '#aab3ba', cor2: '#a3acb3', corNervura: '#c9cfd3', beiral: [1.2, 1.2], opaca: true,
      pilares: { f: 0.9, base: 0, cor: '#c9c5ba', esp: 0.8, viga: false } }
  ],
  fachada: { cor: CONC },
  refletores: [],
  blocos: [
    ...LUZES(121), ...LUZES(-127),
    /* os dois blocos no eixo do campo: o do terraço do sul e o do prédio em arco do norte */
    { u: -140, v: -3, w: 13, d: 25, h: 9, cor: '#a8a399' }, { u: 121, v: -4, w: 13, d: 24, h: 16.5, cor: '#8f9396' },
    /* a parede de baixo do prédio em arco */
    { u: 124, v: -4, w: 5, d: 60, h: 12.8, cor: '#b9b6ad' }
  ],
  /* a câmera de uma das imagens do dono: do alto da arquibancada do oeste, olhando a do leste e a ponta sul */
  vista: [40, 30, 118, -20, 4, -40],
  entorno: [
    /* as árvores do terraço do sul e as de fora, a leste e a nordeste */
    { tipo: 'arvores', u: -124, v: 4, w: 12, d: 60, n: 8 }, { tipo: 'arvores', u: 150, v: 55, w: 40, d: 60, n: 9 }, { tipo: 'arvores', u: -150, v: -110, w: 50, d: 60, n: 9 },
    /* a Goiânia Arena, a nordeste do estádio (no quadro, embaixo à direita) */
    { tipo: 'predio', u: 138, v: -140, w: 104, d: 74, h: 22, cor: '#d9ddd6', giro: -26 },
    /* o estacionamento do oeste (em cima) e do sul (à esquerda) */
    { tipo: 'estacionamento', u: -20, v: 172, w: 190, d: 34, cheio: 0.08 }, { tipo: 'estacionamento', u: -186, v: 60, w: 30, d: 110, cheio: 0.08 }
  ],
  jogo: { mandante1: [78, 104], mandante2: [240, 290], mandante3: [118, 146], visitante: [302, 327], tunelMandante: 91, tunelVisitante: 314, folgaPM: 4,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { forca_jovem_goias: 'mandante1', esquadrao_vilanovense: 'mandante1' } },
  /* OS ARREDORES DE VERDADE (dono, 16/11/2026: "Cadê as ruas ao redor do Serra dourada? Goiás e vila nova vão mandar todos os
     jogos lá"). O estádio fica no meio de um estacionamento: não há quarteirão de casas dentro do quadro. O que há, pelo mapa
     e pelo satélite: a esplanada em anel em volta do estádio, com a rua de serviço que dá a volta; em cima (oeste), a
     esplanada do eixo, que sobe até a Avenida Fued José Sebba entre os dois estacionamentos grandes; à direita (norte), o
     estacionamento dos eventos; embaixo à direita, a Goiânia Arena; à esquerda (sul), a mata. As ruas do estacionamento são
     as de serviço do OpenStreetMap.
     OS PORTÕES E QUEM VEM DE ONDE são escolhas minhas (não achei a lista de portões): a torcida da casa chega pela esplanada
     do oeste e pelos dois estacionamentos de cima e entra pelos portões do oeste (o do meio e o do sudoeste); a visitante
     chega pelo estacionamento do norte e entra pelo portão do nordeste, ao pé da ponta norte da arquibancada do leste. Os
     cordões cortam a esplanada em anel a noroeste e a leste. */
  arredores: {
    osm: OSM, servico: true, quadro: { u: 250, v: 250, cu: 20, cv: 50 }, vazado: 0.62, semente: 5, corQuadra: '#a39a86',
    pisos: [
      /* os estacionamentos (o contorno é do mapa) */
      ...OSM.areas.filter(a => a.tipo === 'amenity=parking').map(a => ({ pts: a.pts, cor: '#77777a' })),
      /* a esplanada em anel em volta do estádio e a do eixo, do oeste */
      { pts: Array.from({ length: 72 }, (_, i) => [-8 + 192 * Math.cos(i * 5 * RAD), -3 + 186 * Math.sin(i * 5 * RAD)]), cor: '#b9b3a4' },
      { pts: [[-24, 150], [24, 150], [24, 300], [-24, 300]], cor: '#c2bcad' },
      /* as ligações: a travessa entre os dois estacionamentos de cima e a que vai ao estacionamento do norte */
      { pts: [[-160, 216], [160, 216]], larg: 12, cor: '#8a8a8c' }, { pts: [[150, 0], [268, 0]], larg: 16, cor: '#8a8a8c' },
      /* (o estádio não é chão) */
      { pts: Array.from({ length: 72 }, (_, i) => [-8 + 141.6 * Math.cos(i * 5 * RAD), -3 + 134.6 * Math.sin(i * 5 * RAD)]), tira: true }
    ],
    portoes: [
      { n: 1, nome: 'PORTÃO OESTE', u: -8, v: 136.5, dir: [0, -1], larg: 12 },
      { n: 2, nome: 'PORTÃO SUDOESTE', u: -92, v: 111.5, dir: [0.56, -0.83], larg: 10 },
      { n: 3, nome: 'VISITANTE', u: 95.5, v: -101.5, dir: [-0.69, 0.72], larg: 10, cor: '#7a2f2f' }
    ],
    bondes: { mandante1: { de: [0, 290], portao: 1, exato: true }, mandante2: { de: [-150, 250], portao: 2, exato: true }, mandante3: { de: [120, 262], portao: 1, exato: true },
              visitante1: { de: [262, 30], portao: 3, exato: true }, visitante2: { de: [262, -24], portao: 3, exato: true }, visitante3: { de: [262, 84], portao: 3, exato: true } },
    grades: [{ de: [100.5, 83.5], ate: [139, 116] }, { de: [16.5, -135.5], ate: [25, -186] }],
    filas: [{ pts: [[-16, 138], [-16, 150]] }, { pts: [[0, 138], [0, 150]] }, { pts: [[90, -106], [84, -114]] }, { pts: [[101, -97], [108, -103]] }],
    pm: [[112, 96], [128, 110], [20, -160], [-8, 160], [60, 150], [-70, 150], [150, -20], [150, 20], [110, -120], [-110, 130]],
    predios: { 'Goiânia Arena': { h: 22, cor: '#cfd3cc', corTeto: '#e3e6e0' } },
    entorno: [
      /* à mão, pelo satélite: a mata do sul e as árvores em volta, os carros nos estacionamentos, os galpões e o pátio atrás do
         estádio (leste) */
      { tipo: 'arvores', u: -205, v: 30, w: 44, d: 150, n: 22 }, { tipo: 'arvores', u: -200, v: -120, w: 50, d: 120, n: 18 }, { tipo: 'arvores', u: 168, v: 70, w: 26, d: 60, n: 8 },
      { tipo: 'arvores', u: -124, v: 4, w: 12, d: 60, n: 8 }, { tipo: 'arvores', u: 60, v: 196, w: 60, d: 14, n: 5 }, { tipo: 'arvores', u: -70, v: 196, w: 60, d: 14, n: 5 },
      { tipo: 'estacionamento', u: -150, v: 262, w: 120, d: 34, cheio: 0.25 }, { tipo: 'estacionamento', u: 130, v: 262, w: 120, d: 34, cheio: 0.25 }, { tipo: 'estacionamento', u: 250, v: 40, w: 30, d: 110, cheio: 0.3 },
      { tipo: 'predio', u: -20, v: -176, w: 50, d: 12, h: 5, cor: '#d9d6cc' }, { tipo: 'predio', u: -40, v: -230, w: 16, d: 40, h: 6, cor: '#b9b6ad' }
    ],
    vista: [-40, 150, 420, 0, 0, 40]
  }
};
