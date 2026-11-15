/* ARENA DA BAIXADA (Joaquim Américo Guimarães / Mario Celso Petraglia —
   Athletico, Curitiba) — pelo satélite, pelas fotos de referência e pelo
   mapa de acessos e setores do clube (14/11/2026). O quadro está na posição
   desse mapa: a GETÚLIO VARGAS em cima, a BRASÍLIO ITIBERÊ (e o
   estacionamento) embaixo, a CORONEL DULCÍDIO à esquerda e a BUENOS AIRES
   (e a praça) à direita; o norte fica pra cima, um pouco pra esquerda.
   No satélite o teto retrátil está FECHADO: dele saem só o contorno do teto
   (199 × 157 m) e o tamanho da abertura; o que há por baixo vem do mapa e
   das fotos de dentro. O modelo fica com o teto ABERTO (os dois painéis
   recolhidos em cima das pontas), pra aparecer o gramado.
   · Uma caixa retangular fechada, com DOIS ANÉIS de cadeira cinza (clara,
     salpicada de cinza-escuro) nos quatro lados, de cantos redondos: o anel
     inferior (setores 101 a 124) e o superior (301 a 325).
   · A VISITANTE fica no canto de baixo à esquerda do anel superior
     (setores 301 e 302, acesso M, pela Petit Carneiro).
   · O setor Buenos Aires inferior (111 a 113, atrás do gol da direita) é o
     da torcida organizada da casa.
   · Os telões ficam no alto das duas pontas. */
const CZ = '#c6c9cc', CZ2 = '#8d9298';                  /* a cadeira cinza clara e a escura */
const TETO = '#e2e0da', NERV = '#cdcbc5', FERRO = '#8a8f94';
/* o anel inferior (14 m), o anel de circulação atrás dele (4 m, debaixo dos camarotes) e o superior (15 m); os cantos são
   concêntricos */
const D = { a: 60, b: 41, r: 10 }, L = { a: 74, b: 55, r: 24 }, M = { a: 78, b: 59, r: 28 }, F = { a: 93, b: 74, r: 43 };
const CADEIRA = { cor: CZ, cor2: CZ2, padrao: 'mosaico', mistura: 0.34, corredor: 12, corEscada: '#dfe0df' };
/* as nervuras do teto (as abóbadas de policarbonato), de 9,8 em 9,8 m: inteiras nas pontas, cortadas pela abertura no meio */
const NERVURAS = Array.from({ length: 20 }, (_, i) => -93 + i * 9.8).flatMap(u => (u < -54 || u > 55)
  ? [{ u, v: 0.4, w: 1, d: 157, h: 0.25, y: 43, cor: NERV, cobertura: true }]
  : [{ u, v: 58.6, w: 1, d: 41, h: 0.25, y: 43, cor: NERV, cobertura: true }, { u, v: -57.9, w: 1, d: 40.6, h: 0.25, y: 43, cor: NERV, cobertura: true }]);

export default {
  id: 'estadio-arena-da-baixada', nome: 'Arena da Baixada', clubes: ['athletico'], norte: 113, vazado: 0.3, folga: 22,
  corEscada: '#dfe0df',
  chao: { cor: '#8d8981' },
  campo: { corMargem: '#3f8f4b' },
  corMureta: '#e9e9e6',
  aneis: [
    /* O ANEL INFERIOR: sem boca no meio. Entra-se por CIMA (dono, 15/11/2026, com o corte do estádio: "normalmente as
       arquibancadas inferiores de estádios de dois andares são acessadas pelo topo do setor"): o público sai do anel de
       circulação atrás da última fileira e desce as escadas */
    { dentro: D, fora: L, reto: true, h: [1.2, 8.2], fileiras: 16,
      trechos: [{ de: 0, ate: 360, ...CADEIRA, vomitorios: false }] },
    /* O ANEL DE CIRCULAÇÃO atrás do inferior, debaixo dos camarotes */
    { dentro: L, fora: M, reto: true, h: [8.3, 8.3], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', alt: 8.3, cor: '#aeb1b3' }] },
    /* O ANEL SUPERIOR: as bocas abrem no lance, a um terço da altura */
    { dentro: M, fora: F, reto: true, h: [11.5, 24], fileiras: 20, corredorFrente: 1.6,
      trechos: [{ de: 0, ate: 360, ...CADEIRA, vomitorios: { f: 0.3, cada: 2 }, paredeAtras: true, corFachada: '#d5d9dc', parapeito: 2 }] }
  ],
  /* O TETO: o anel fixo, com a abertura do retrátil em cima do gramado */
  telhados: [
    { y: 42, h: 1, cor: TETO, pontos: [[-99.2, -78.3], [100, -78.3], [100, 79.2], [-99.2, 79.2]], furo: [[-53, -37.5], [54.2, -37.5], [54.2, 38], [-53, 38]] }
  ],
  fachada: { cor: '#d5d9dc' },
  blocos: [
    /* os dois painéis do retrátil, recolhidos em cima das pontas, e os dois trilhos ao longo da abertura */
    { u: -76.5, v: 0.3, w: 44, d: 76, h: 2.4, y: 43, cor: '#edebe6', cobertura: true }, { u: 77.5, v: 0.3, w: 44, d: 76, h: 2.4, y: 43, cor: '#edebe6', cobertura: true },
    { u: 0.4, v: 39.2, w: 199, d: 2.2, h: 2.8, y: 43, cor: FERRO, cobertura: true }, { u: 0.4, v: -38.7, w: 199, d: 2.2, h: 2.8, y: 43, cor: FERRO, cobertura: true },
    ...NERVURAS,
    /* as quatro fachadas, debaixo da beira do teto, e o corpo escuro do lado da Coronel Dulcídio */
    { u: 0.4, v: 77.7, w: 196, d: 1.6, h: 42, cor: '#cfd5da' }, { u: 0.4, v: -76.8, w: 196, d: 1.6, h: 42, cor: '#cfd5da' },
    { u: 98.4, v: 0.4, w: 1.6, d: 154, h: 42, cor: '#cfd5da' }, { u: -97.6, v: 0.4, w: 1.6, d: 154, h: 42, cor: '#cfd5da' },
    { u: -103.6, v: 0.4, w: 9.6, d: 157, h: 30, cor: '#4b5056' },
    /* os telões, no alto das duas pontas */
    { u: 91.6, v: 0, w: 1, d: 15, h: 6.5, y: 28, cor: '#17181b' }, { u: -91.6, v: 0, w: 1, d: 15, h: 6.5, y: 28, cor: '#17181b' },
    /* os bancos de reserva, do lado de baixo (a área vip) */
    { u: -12, v: -38.6, w: 10, d: 1.6, h: 1.8, cor: '#2c2f33' }, { u: 12, v: -38.6, w: 10, d: 1.6, h: 1.8, cor: '#2c2f33' }
  ],
  entorno: [
    /* em cima: os prédios entre o estádio e a Getúlio Vargas, e a avenida */
    { tipo: 'predio', u: -88, v: 100, w: 42, d: 20, h: 10, cor: '#b9b6ad' }, { tipo: 'predio', u: -40, v: 99, w: 22, d: 22, h: 30, cor: '#d9d7d0', cor2: '#9aa3ab' },
    { tipo: 'predio', u: -10, v: 101, w: 24, d: 18, h: 7, cor: '#b0694a' }, { tipo: 'predio', u: 30, v: 99, w: 26, d: 24, h: 38, cor: '#e6e4de', cor2: '#9aa3ab' },
    { tipo: 'predio', u: 64, v: 100, w: 24, d: 22, h: 26, cor: '#8f8c86', cor2: '#6f6c66' },
    { tipo: 'rua', de: [-260, 130], ate: [260, 130], larg: 18 }, { tipo: 'arvores', u: 0, v: 118, w: 220, d: 4, n: 16 },
    /* à direita: a Buenos Aires e a praça */
    { tipo: 'rua', de: [112, -220], ate: [112, 220], larg: 14 },
    { tipo: 'grama', u: 146, v: 40, w: 46, d: 120, cor: '#5d9450' }, { tipo: 'arvores', u: 146, v: 40, w: 44, d: 116, n: 46 },
    { tipo: 'casas', u: 146, v: -70, nu: 3, nv: 5, passo: 14 },
    /* embaixo: o edifício do estacionamento, os prédios e a Brasílio Itiberê */
    { tipo: 'predio', u: 31, v: -103, w: 118, d: 34, h: 12, cor: '#aeaba2', cor2: '#9b988f' },
    { tipo: 'predio', u: -62, v: -100, w: 44, d: 16, h: 16, cor: '#cfcdc6', cor2: '#9aa3ab' }, { tipo: 'predio', u: -70, v: -124, w: 34, d: 16, h: 9, cor: '#dedcd5' },
    { tipo: 'rua', de: [-260, -142], ate: [260, -142], larg: 12 },
    /* à esquerda: os prédios e a Coronel Dulcídio */
    { tipo: 'predio', u: -124, v: 54, w: 20, d: 44, h: 24, cor: '#d5d3cc', cor2: '#9aa3ab' }, { tipo: 'predio', u: -124, v: -8, w: 20, d: 50, h: 14, cor: '#c9c6bd' },
    { tipo: 'arvores', u: -126, v: -66, w: 18, d: 40, n: 10 },
    { tipo: 'rua', de: [-146, -220], ate: [-146, 220], larg: 12 }, { tipo: 'casas', u: -172, v: 0, nu: 2, nv: 12, passo: 14 }
  ],
  /* Os Fanáticos no Buenos Aires inferior (atrás do gol da direita); a visitante nos setores 301 e 302 do anel superior
     (o canto de baixo à esquerda), como no mapa do clube; os outros bondes da casa no anel inferior */
  jogo: { mandante1: [-13, 13], mandante2: [70, 110], mandante3: [165, 195], visitante: [199, 219], tunelMandante: 0, tunelVisitante: 210, folgaPM: 4,
          fracao: { mandante1: 0.2, mandante2: 0.22, mandante3: 0.22, visitante1: 0.75, visitante2: 0.75, visitante3: 0.75 },
          torcidas: { os_fanaticos: 'mandante1' } }
};
