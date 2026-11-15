/* PRIMEIRO DE MAIO (São Bernardo FC, São Bernardo do Campo) — pelo satélite
   e pelas fotos de referência (15/11/2026); o meio do campo foi tirado do
   círculo central. O campo corre de sudoeste a nordeste; no quadro o
   NOROESTE (a coberta) fica em cima e o NORDESTE (o fundo do
   estacionamento) à direita. NÃO achei mapa de setores do clube.
   Estádio em U, aberto pro nordeste, de degrau pintado de amarelo e de
   preto (as cores do clube), com as escadas brancas:
   · EM CIMA (noroeste), a COBERTA: reta, a mais funda (23 m); o telhado
     claro cobre a metade de trás, a frente fica descoberta, em blocos
     amarelos e pretos. Na frente, o teto verde dos bancos de reserva.
   · À ESQUERDA (sudoeste), atrás do gol: a arquibancada reta de 17 m, com
     o bloco amarelo em cima (no quadro) e os pretos embaixo.
   · EMBAIXO (sudeste), a arquibancada comprida: três blocos pretos e três
     amarelos; ela fica em cima de uma galeria aberta, com o muro amarelo no
     alto.
   · OS DOIS CANTOS de baixo são em curva: o da esquerda amarelo, o da
     direita preto, que sobe até o começo do lado nordeste.
   · À DIREITA (nordeste), atrás do gol, NÃO há arquibancada: só o
     alambrado e o estacionamento.
   OS ACESSOS: as caixinhas cobertas que o satélite mostra na frente das
   arquibancadas, no pé de algumas escadas (três embaixo, duas à esquerda). */
const AM = '#dcb64a', AM2 = '#cfa93f', PT = '#3b3e46', PT2 = '#33363d', BR = '#e9e6dc';
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* a beira do gramado; a frente e o fundo das arquibancadas; o fundo da coberta; a frente e o fundo da arquibancada do sudoeste */
const GRAMA = { a: 69, b: 40, r: 12 }, I = { a: 73, b: 43.5, r: 16 }, F = { a: 90.5, b: 61, r: 33.5 }, F_COB = { a: 97, b: 67.5, r: 40 };
const L_D = { a: 73, b: 45, r: 1.5 }, L_F = { a: 90, b: 62, r: 18.5 };
const DEG = (de, ate, cor, mais) => ({ de, ate, cor, cor2: cor === AM ? AM2 : PT2, padrao: 'mosaico', mistura: 0.35, semCadeiras: true, corredor: 0, escadaNaBorda: true, corEscada: BR, vomitorios: false, ...mais });
const BOCA = em => ({ vomitorios: { f: 0, larg: 3, fundo: 3, em } });
/* a coberta, bloco a bloco (do nordeste pro sudoeste) */
const COBERTA = [[57, 41, PT], [41, 21, AM], [21, 3, PT], [3, -17, PT, true], [-17, -35, PT], [-35, -57, AM]].map(([u0, u1, cor, misto]) =>
  DEG(A(u0, 43.5), A(u1, 43.5), cor, { fora: F_COB, h: [1.5, 13], escadaNaBorda: u0 < 57, ...(misto ? { padrao: 'fracoes', fracoes: [[0.22, AM], [1, PT]] } : {}), paredeAtras: true, corFachada: '#d9d6cc' }));
/* a arquibancada do sudoeste, atrás do gol (de cima pra baixo no quadro) */
const SUDOESTE = [[43, 21.7, AM, [1]], [21.7, 15, AM, [0]], [15, 3.3, PT], [3.3, -16.7, PT, [1]], [-16.7, -27.5, PT, [0]]].map(([v0, v1, cor, boca]) =>
  DEG(A(-73, v0), A(-73, v1), cor, { dentro: L_D, fora: L_F, escadaNaBorda: v0 < 43, ...(boca ? BOCA(boca) : {}), paredeAtras: true, corFachada: AM }));
/* a arquibancada do sudeste (da esquerda pra direita) */
const SUDESTE = [[-57, -52.5, AM, [1]], [-52.5, -33.7, PT, [0]], [-33.7, -16.7, PT], [-16.7, -2, PT, [1]], [-2, 16.7, AM, [0]], [16.7, 34.3, AM], [34.3, 49.2, AM, [1]], [49.2, 57, PT, [0]]].map(([u0, u1, cor, boca]) =>
  DEG(A(u0, -43.5), A(u1, -43.5), cor, { h: [3, 11], escadaNaBorda: u0 > -57, ...(boca ? BOCA(boca) : {}), paredeAtras: true, corFachada: AM, parapeito: 2, corMureta: AM }));

export default {
  id: 'estadio-primeiro-de-maio', nome: 'Primeiro de Maio', clubes: ['sao-bernardo'], norte: 45, vazado: 0.4, folga: 20,
  corEscada: BR,
  chao: { cor: '#7b7870' },
  campo: { corMargem: '#4f9353' },
  corMureta: '#d9d6cc',
  aneis: [
    /* a calçada em volta do gramado, ao pé do alambrado */
    { dentro: GRAMA, fora: I, h: [0.2, 0.2], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#a9a69c' }] },
    /* AS ARQUIBANCADAS, em U */
    { dentro: I, fora: F, reto: true, andarReto: true, h: [1.5, 10], fileiras: 18,
      trechos: [
        ...COBERTA,
        /* o canto oeste: o piso entre a coberta e a arquibancada do sudoeste */
        { de: A(-57, 43.5), ate: 153, tipo: 'passagem', cor: '#a9a69c' },
        ...SUDOESTE,
        /* o canto sul, em curva: amarelo, com a escada no meio */
        DEG(A(-73, -27.5), 209, AM, { paredeAtras: true, corFachada: AM }), DEG(209, A(-57, -43.5), AM, { paredeAtras: true, corFachada: AM }),
        ...SUDESTE,
        /* o canto leste, em curva: preto, até o começo do lado nordeste */
        DEG(A(57, -43.5), 328.5, PT, { h: [3, 11], paredeAtras: true, corFachada: AM, parapeito: 2, corMureta: AM }),
        DEG(328.5, 334, PT, { h: [3, 11], paredeAtras: true, corFachada: AM, parapeito: 2, corMureta: AM }),
        DEG(334, A(73, -27.5), PT, { h: [3, 11], paredeAtras: true, corFachada: AM, parapeito: 2, corMureta: AM })
      ] }
  ],
  /* o telhado claro da coberta, por cima da metade de trás */
  telhados: [{ y: 15.5, h: 0.5, cor: '#c9c9c4', pontos: [[-54.5, 54.2], [61.7, 54.2], [61.7, 68], [-54.5, 68]] }],
  fachada: { cor: '#d9d6cc' },
  refletores: [[-70.8, 54, 34], [75.8, 57.5, 34], [-93, -44, 34], [80, -62, 34]],
  blocos: [
    /* o teto verde dos bancos de reserva, do lado da coberta */
    { u: 0.9, v: 38, w: 40, d: 4, h: 2.4, cor: '#7fbf9a' },
    /* o muro comprido que segue da coberta até o estacionamento */
    { u: 82, v: 43.5, w: 30, d: 1, h: 3, cor: '#b9b6ad' },
    /* o muro e o alambrado de trás do gol do nordeste */
    { u: 74.5, v: 5, w: 1, d: 60, h: 3, cor: '#8f8c84' }
  ],
  entorno: [
    /* à direita (nordeste): o estacionamento, as quadras de saibro e a casa de telha */
    { tipo: 'estacionamento', u: 84, v: 6, w: 16, d: 60, cheio: 0.1 }, { tipo: 'quadra', u: 106, v: 26, w: 12, d: 32, cor: '#c9603f' },
    { tipo: 'predio', u: 104, v: -34, w: 12, d: 30, h: 6, cor: '#b5533c' },
    /* em cima (noroeste): o terreno, as árvores e o campo de saibro */
    { tipo: 'grama', u: -34, v: 88, w: 40, d: 12, cor: '#c9805c' }, { tipo: 'arvores', u: 50, v: 82, w: 90, d: 14, n: 26 },
    /* embaixo (sudeste): a rua e os galpões */
    { tipo: 'rua', de: [-115, -68], ate: [115, -70], larg: 9 }, { tipo: 'predio', u: -56, v: -86, w: 34, d: 18, h: 8, cor: '#a9aaa8' },
    { tipo: 'predio', u: -14, v: -86, w: 26, d: 18, h: 7, cor: '#c9c6bb' }, { tipo: 'casas', u: 40, v: -86, nu: 5, nv: 1, passo: 15 },
    /* à esquerda (sudoeste): os prédios e a rua */
    { tipo: 'predio', u: -100, v: -40, w: 12, d: 22, h: 9, cor: '#b9b6ad' }, { tipo: 'arvores', u: -100, v: 30, w: 10, d: 30, n: 6 }
  ],
  /* (escolhas minhas, sem fonte: não achei mapa de setores) a Guerreiros do Tigre nos blocos amarelos da arquibancada do
     sudeste e a visitante na arquibancada de trás do gol do sudoeste; os outros bondes da casa na coberta e nos blocos pretos */
  jogo: { mandante1: [276, 298], mandante2: [80, 100], mandante3: [245, 265], visitante: [168, 192], tunelMandante: 287, tunelVisitante: 180, folgaPM: 4,
          fracao: { mandante1: 0.6, mandante2: 0.55, mandante3: 0.6, visitante1: 0.6, visitante2: 0.65, visitante3: 0.55 },
          torcidas: { guerreiros_do_tigre: 'mandante1' } }
};
