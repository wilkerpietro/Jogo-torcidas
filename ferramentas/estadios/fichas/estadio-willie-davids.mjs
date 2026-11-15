/* WILLIE DAVIDS (Estádio Regional — Maringá Futebol Clube, Maringá) — pelo
   satélite e pelas fotos de referência (15/11/2026); o meio do campo foi
   tirado do círculo central. O campo é norte-sul; no quadro o NORTE fica à
   DIREITA e o OESTE (a coberta) em cima. O estádio fica em cima de um
   aterro gramado, com a pista de atletismo vermelha de oito raias.
   A ARQUIBANCADA É UMA SÓ, de um lance (a lição do Estádio do Café): um
   anel oval contínuo de degrau de cimento em volta da pista, raso nas duas
   curvas (9 m) e fundo no meio do lado leste (24 m). A COBERTA é o trecho
   oeste desse mesmo anel, mais fundo (34 m), com cadeira e com o telhado.
   OS ACESSOS: não há boca de vomitório. Entra-se POR CIMA, pela rua de
   asfalto que dá a volta no alto do anel (o estádio é sobre aterro), e
   desce-se pelas escadas.
   · EM CIMA (oeste), a COBERTA: cadeira vinho nas pontas e amarela no meio,
     azul-marinho na ponta norte; as fileiras da frente descobertas; por
     cima, o telhado em leque de nove panos claros, que passa do fundo da
     arquibancada e cobre o corredor de trás.
   · O RESTO do anel (a curva sul à esquerda, o lado leste embaixo, a curva
     norte à direita): degrau de cimento cinza com as escadas claras.
   · EMBAIXO, atrás do lado leste, o prédio das cabines e a escadaria da
     entrada. Em volta, o aterro gramado e os pátios de terra. */
const CIM = '#9a9c9c', CIM2 = '#8e9090', ESCADA = '#e3e0bc';
const VIN = '#8e3b34', VIN2 = '#7e332d', AM = '#d9b23a', AZE = '#2a3558';
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* a beira de dentro, o fundo do anel e a rua do alto (8 m); o fundo da coberta */
const I = { a: 94, b: 50, r: 50 }, F = { a: 103, b: 74, r: 74 }, RUA = { a: 111, b: 82, r: 82 };
const F_COB = { a: 103, b: 84, r: 84 };
/* o trecho coberto, pela beira de dentro: de u = 68 (ponta norte) a u = -60 (ponta sul) */
const N0 = A(68, 43.9), S0 = A(-60, 47.4);
const DEGRAU = { cor: CIM, cor2: CIM2, padrao: 'mosaico', mistura: 0.4, semCadeiras: true, corredor: 17, corEscada: ESCADA, vomitorios: false };
const COB = (de, ate, cor, cor2, mistura) => ({ de, ate, fora: F_COB, cor, cor2, padrao: 'mosaico', mistura, corredor: 13, corEscada: '#d9d6cc', vomitorios: false, paredeAtras: true, corFachada: '#d9d6cc' });
/* o telhado em leque: nove panos entre o arco de fora (um círculo de 118 m com o centro em (2, -10)) e o de dentro */
const fora = t => { const a = (136 - t * 94.2) * RAD; return [2 + 118 * Math.cos(a), -10 + 118 * Math.sin(a)]; };
const dentro = t => { const u = -60 + t * 127; return [u, 62 - 0.00278 * u * u]; };
const PANOS = Array.from({ length: 9 }, (_, i) => ({ y: 24 + (i % 2) * 0.25, h: 0.5, cor: i % 2 ? '#c2baa7' : '#d3cbb8',
  pontos: [dentro(i / 9), dentro((i + 0.5) / 9), dentro((i + 1) / 9), fora((i + 1) / 9), fora((i + 0.5) / 9), fora(i / 9)] }));

export default {
  id: 'estadio-willie-davids', nome: 'Willie Davids', clubes: ['maringa'], norte: 0, vazado: 0.38, folga: 32,
  corEscada: ESCADA,
  chao: { cor: '#8f7f70', esplanada: { a: 150, b: 120, forma: 'elipse' }, corEsplanada: '#6f9a55' },
  campo: { corMargem: '#b9b6ac', pista: { dentro: { a: 72, b: 36.5, r: 36.5 }, fora: { a: 93, b: 47.5, r: 47.5 }, cor: '#b5533c', raias: 8 } },
  corMureta: '#d9d6cc',
  aneis: [
    /* O ANEL, um só; a altura acompanha a fundura */
    { dentro: I, fora: F, reto: true, h: [1.5, 11], inclinacao: 0.42, fileiras: 26,
      trechos: [
        /* da ponta norte da coberta, pela curva norte, pelo lado leste e pela curva sul, até a ponta sul da coberta */
        { de: S0 - 360, ate: N0, ...DEGRAU },
        /* a coberta (do norte pro sul): azul-marinho, vinho, amarelo, vinho */
        COB(N0, 46, AZE, '#232c4a', 0.3), COB(46, 62, VIN, VIN2, 0.3), COB(62, 120, AM, VIN, 0.14), COB(120, S0, VIN, VIN2, 0.3)
      ] },
    /* A RUA DO ALTO, em cima do aterro: é por ela que se entra */
    { dentro: F, fora: RUA, reto: true, h: [6, 6], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', alt: 6, cor: '#5f5d5b' }] }
  ],
  telhados: PANOS,
  /* por fora é o aterro gramado */
  fachada: { cor: '#6f9a55' },
  refletores: [[-90, -64, 40], [90, -64, 40], [-100, 52, 40], [102, 50, 40]],
  blocos: [
    /* o prédio das cabines atrás do lado leste, as caixas-d'água em cima dele e a escadaria da entrada */
    { u: -2.5, v: -88.5, w: 75, d: 11, h: 8, cor: '#8f9498' },
    { u: -32, v: -88.5, w: 7, d: 7, h: 2, y: 8, cor: '#e6e6e2' }, { u: 28, v: -88.5, w: 7, d: 7, h: 2, y: 8, cor: '#e6e6e2' },
    { u: -3, v: -101, w: 11, d: 14, h: 3, cor: '#b9b6ac' },
    /* o placar no alto da curva norte e o portal do nome na ponta sul */
    { u: 104, v: 10, w: 1, d: 12, h: 5, y: 7, cor: '#17181b' },
    { u: -127, v: 24, w: 5, d: 16, h: 5, cor: '#e9e9e4' },
    /* os bancos de reserva, do lado da coberta */
    { u: -10, v: 48.4, w: 8, d: 1.6, h: 1.8, cor: '#eeeeea' }, { u: 10, v: 48.4, w: 8, d: 1.6, h: 1.8, cor: '#eeeeea' }
  ],
  entorno: [
    /* à esquerda (sul): o estacionamento e as árvores */
    { tipo: 'estacionamento', u: -150, v: 96, w: 40, d: 44, cheio: 0.5 }, { tipo: 'arvores', u: -168, v: 20, w: 24, d: 90, n: 20 },
    /* à direita (norte): o ginásio, as piscinas e os ônibus */
    { tipo: 'predio', u: 168, v: 96, w: 34, d: 30, h: 12, cor: '#dcdad3' }, { tipo: 'piscina', u: 172, v: 30, w: 24, d: 50 },
    { tipo: 'estacionamento', u: 148, v: -20, w: 14, d: 60, cheio: 0.3 },
    /* embaixo (leste): o pátio de terra, a avenida e as palmeiras */
    { tipo: 'rua', de: [-260, -150], ate: [260, -150], larg: 16 }, { tipo: 'arvores', u: 0, v: -138, w: 300, d: 5, n: 26 },
    { tipo: 'cupula', u: -134, v: -84, r: 6, h: 2.5, cor: '#d9d3c4', cor2: '#cfc9bb' },
    /* em cima (oeste): as árvores atrás da coberta */
    { tipo: 'arvores', u: -40, v: 146, w: 220, d: 16, n: 40 }
  ],
  /* a Força Maringaense no meio da coberta e a visitante na metade norte do lado leste (escolhas minhas, sem fonte); os
     outros bondes da casa na metade sul do lado leste e na curva sul */
  jogo: { mandante1: [76, 104], mandante2: [228, 256], mandante3: [168, 192], visitante: [288, 316], tunelMandante: 90, tunelVisitante: 302, folgaPM: 5,
          torcidas: { forca_maringaense: 'mandante1' } }
};
