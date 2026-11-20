/* ARENA MRV (Atlético Mineiro, Belo Horizonte, bairro Califórnia) — pelo
   satélite e pelos setores da Itatiaia e do Lance! (15/11/2026); o meio do
   campo foi tirado do círculo central. O campo corre de sul-sudoeste a
   norte-nordeste; no quadro o OESTE fica em cima e o NORTE à direita.
   O dono: "A MRV arena já foi feita? Do Atlético Mineiro" — o Atlético sai do
   Mineirão e manda aqui.
   Arena retangular de cantos bem redondos, toda coberta:
   · O TELHADO (satélite): listras brancas e cinzas que saem da abertura
     retangular e descem até a beira de fora (237 x 197 m; a abertura, de
     127 x 90 m). O satélite foi tirado de lado, e o telhado alto aparece
     deslocado pro leste; as medidas já estão corrigidas. O ARENA MRV escrito
     no telhado do lado sul-sudoeste e o escudo no canto.
   · TRÊS NÍVEIS (os setores): o de baixo (Brahma), a 8,5 a 10,5 m do campo,
     sem boca (entra-se pela circulação atrás dele, a regra dos dois
     andares); o intermediário (Arcelormittal), com umas fileiras de cadeira
     na frente dos camarotes de vidro (112 camarotes e os lounges Sul e
     Norte); o de cima (Inter), o maior, com a boca a um quarto da altura em
     escadas alternadas.
   · O LANCE DE BAIXO DO FUNDO SUL (Brahma Sul) é o único setor SEM CADEIRA
     (os setores dizem "setor sem cadeiras").
   · A COR DAS CADEIRAS NÃO ESTÁ EM NENHUMA FONTE QUE LI: ficou preta com
     branco salpicado (as cores do clube), à espera de foto do dono.
   · Em volta: a esplanada a oeste, a mata a noroeste, a Via Expressa ao sul.
   AS TORCIDAS: a visitante no lance de cima do fundo norte (Inter Norte,
   portões 19 e 20, pelos setores). A Galoucura no setor sem cadeira do fundo
   sul e o Esquadrão na lateral leste: escolhas minhas, sem fonte. */
const PT = '#2f3136', PT2 = '#d7d8d4';
const CADEIRA = { cor: PT, cor2: PT2, padrao: 'mosaico', mistura: 0.18 };
/* os contornos, concêntricos (a - r = 49, b - r = 28,5 em todos): a beira do lance de baixo, o fim dele, a circulação, as
   cadeiras do intermediário, os camarotes, o fim do lance de cima e o corredor do alto */
const C = d => ({ a: 63 + d, b: 42.5 + d, r: 14 + d });
const I = C(0), L = C(16), L2 = C(19), K2 = C(22), K = C(25), F = C(45), TOPO = C(49);
/* o telhado: a abertura, o fim das cadeiras (dali pra fora inteiro na vista de cima) e a beira de fora */
const ABERTURA = { a: 63.5, b: 45, r: 14 }, BEIRA = { a: 118.5, b: 98.5, r: 69.5 };
const LISTRAS = { n: 72, cor: '#f2f2ee', cor2: '#8f9297', nervuras: false };

export default {
  id: 'estadio-arena-mrv', alambrado: false, muro: false, nome: 'Arena MRV', clubes: ['atletico-mineiro'], norte: 33.2, vazado: 0.22, folga: 26,
  chao: { cor: '#8a867d', esplanada: { a: 150, b: 128, forma: 'elipse' }, corEsplanada: '#c3bdb1' },
  campo: { corMargem: '#4f9353' },
  corMureta: '#d9dad6',
  aneis: [
    /* O LANCE DE BAIXO (Brahma), sem boca; o do fundo sul sem cadeira */
    { dentro: I, fora: L, reto: true, h: [1.4, 10], fileiras: 19, vomitorios: false,
      trechos: [
        { de: -152, ate: 152, ...CADEIRA, corredor: 14 },
        { de: 152, ate: 208, cor: '#45474c', cor2: '#3b3d42', padrao: 'mosaico', mistura: 0.3, semCadeiras: true, corredor: 18 }] },
    /* a circulação atrás dele, por onde se entra */
    { dentro: L, fora: L2, reto: true, h: [10.4, 10.4], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', alt: 10.4, cor: '#c9c7bf' }] },
    /* O INTERMEDIÁRIO (Arcelormittal): umas fileiras de cadeira e, atrás, os camarotes de vidro */
    { dentro: L2, fora: K2, reto: true, h: [11, 12.8], fileiras: 3, corredorFrente: 0, vomitorios: false,
      trechos: [{ de: 0, ate: 360, ...CADEIRA, corredor: 10 }] },
    { dentro: K2, fora: K, reto: true, h: [13.2, 14.6], fileiras: 2, corredorFrente: 0, vomitorios: false, semCadeiras: true, passoFileira: 2, corMureta: '#3a3f45',
      trechos: [{ de: 0, ate: 360, cor: '#2b3036', cor2: '#363c43', padrao: 'mosaico', mistura: 0.3, corredor: 0 }] },
    /* O LANCE DE CIMA (Inter), o maior, com a boca a um quarto da altura em escadas alternadas */
    { dentro: K, fora: F, reto: true, h: [16, 34], fileiras: 23, corredorFrente: 1.4,
      trechos: [{ de: 0, ate: 360, ...CADEIRA, corredor: 14, vomitorios: { f: 0.25, cada: 2, larg: 3.6, fundo: 3.2 }, paredeAtras: true, corFachada: '#cfd0cc' }] },
    /* o corredor do alto */
    { dentro: F, fora: TOPO, reto: true, trechos: [{ de: 0, ate: 360, tipo: 'passagem', alt: 34, cor: '#c9c7bf' }] }
  ],
  coberturasAnel: [
    /* o telhado listrado: inteiro por fora das cadeiras, transparente por cima delas (a regra do Beira-Rio) */
    { fora: BEIRA, dentro: TOPO, h: 38, cai: 1.5, ...LISTRAS, opaca: true, bordaFora: { larg: 1.2, cor: '#d9dad6' } },
    { fora: TOPO, dentro: ABERTURA, h: 39.5, cai: -1.5, ...LISTRAS, bordaDentro: { larg: 1.4, cor: '#b9bcbe' } }
  ],
  fachada: { cor: '#cfd0cc' },
  blocos: [
    /* o ARENA MRV escrito no telhado do lado sul-sudoeste e o escudo no canto */
    { u: -110, v: 4, w: 46, d: 7, h: 0.2, y: 38.2, cor: '#f2f2ee', texto: 'ARENA MRV', corTexto: '#2a2b2e', textoLargura: 0.9, textoAltura: 0.7, giro: -90 },
    { u: -88, v: -70, w: 7, d: 7, h: 0.2, y: 37.6, cor: '#2a2b2e' },
    /* os dois telões, pendurados na beira da abertura atrás dos gols */
    { u: 62, v: 0, w: 2, d: 18, h: 7, y: 26, cor: '#16171a', cobertura: true }, { u: -62, v: 0, w: 2, d: 18, h: 7, y: 26, cor: '#16171a', cobertura: true },
    /* os bancos de reserva, ao pé da lateral oeste */
    { u: -10, v: 40, w: 14, d: 2.4, h: 2, cor: '#cfd3d6' }, { u: 10, v: 40, w: 14, d: 2.4, h: 2, cor: '#cfd3d6' }
  ],
  vista: [-40, 18, -30, 40, 10, 30],
  entorno: [
    /* em cima à direita (noroeste): a mata */
    { tipo: 'arvores', u: 140, v: 110, w: 80, d: 70, n: 40 }, { tipo: 'arvores', u: 60, v: 150, w: 120, d: 40, n: 30 },
    /* embaixo (sul e sudeste): a Via Expressa e as ruas */
    { tipo: 'rua', de: [-250, -150], ate: [120, -230], larg: 30 }, { tipo: 'rua', de: [150, -200], ate: [150, 160], larg: 12 },
    /* à direita (leste): os galpões */
    { tipo: 'predio', u: 175, v: -60, w: 30, d: 60, h: 9, cor: '#8a8d90' }, { tipo: 'predio', u: 120, v: -150, w: 40, d: 30, h: 8, cor: '#6f7478' }
  ],
  jogo: { mandante1: [-12, 12], mandante2: [308, 338], mandante3: [264, 294], visitante: [202, 242], tunelMandante: 180, tunelVisitante: 0, folgaPM: 5,
          fracao: { mandante1: 0.4, mandante2: 0.4, mandante3: 0.4, visitante1: 0.78, visitante2: 0.84, visitante3: 0.72 },
          torcidas: { galoucura: 'mandante1', esquadrao_atleticano: 'mandante2' } }
};
