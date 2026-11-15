/* ANACLETO CAMPANELLA (São Caetano, São Caetano do Sul) — pelo satélite
   ampliado lado por lado e pelas fotos de referência (15/11/2026); o meio
   do campo foi tirado do círculo central. O campo é quase norte-sul; no
   quadro o OESTE (a coberta) fica em cima e o NORTE à direita. NÃO achei
   mapa de setores do clube.
   As fotos misturam épocas: as antigas mostram arquibancadas tubulares
   (vermelha no sul, amarela no leste) e um prédio no lado leste que não
   existem mais. Vale o satélite e a aérea recente:
   · EM CIMA (oeste), a COBERTA: cadeira azul com as escadas amarelas e o
     telhado de concreto em gomos claros, que acompanha o oval e dobra nas
     duas pontas; as fileiras da frente ficam descobertas.
   · À DIREITA (norte), a ARQUIBANCADA AZUL: funda e alta, descoberta, em
     dois blocos de cadeira azul-escura, só na metade oeste do fundo; na
     outra metade ficam os prédios do clube.
   · À ESQUERDA (sul), a arquibancada do fundo sul: os degraus de cimento
     na frente e, por cima do fundo dela, os telhados de zinco azulado e
     enferrujado, que seguem pelo canto sudeste; por fora, o muro alto de
     listras azuis e brancas.
   · EMBAIXO (leste), NÃO há arquibancada: só o alambrado, o banco de
     reservas de teto azul, o pátio e o terreno de grama.
   OS ACESSOS: nenhuma boca de vomitório aparece; ficou sem. */
const AZ = '#2c4a8a', AZ2 = '#27427c';                  /* a cadeira azul da coberta */
const AZE = '#263a72', AZE2 = '#2f4683';                /* a cadeira azul-escura do norte */
const CIM = '#93938d', CIM2 = '#878782', AM = '#d8c46a';
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* a beira do gramado oval; o fundo da coberta e do fundo sul; o fundo da arquibancada azul; a calçada do lado leste */
const I = { a: 83, b: 46.7, r: 38 }, F = { a: 102, b: 65.7, r: 57 }, F_NORTE = { a: 107, b: 70.7, r: 62 }, F_LESTE = { a: 86.5, b: 50.2, r: 41.5 };
/* as pontas: a coberta vai de 29 a 151 graus; o fundo sul segue até o canto sudeste; a azul fica de -1 a 29 */
const COB_N = 29, COB_S = 151, SUL_FIM = A(-35, -46.7);
/* a coberta: cada vão entre duas escadas amarelas (pelo u de cada escada) */
const ESCADAS = [COB_N, ...[52, 13, -13, -50, -70].map(u => A(u, 46.7)), COB_S];
const COBERTA = ESCADAS.slice(0, -1).map((de, i) => ({ de, ate: ESCADAS[i + 1], cor: AZ, cor2: AZ2, padrao: 'mosaico', mistura: 0.3, corredor: 0, escadaNaBorda: i > 0, corEscada: AM, vomitorios: false, paredeAtras: true, corFachada: '#2b4d9b' }));
/* O TELHADO da coberta: 30 gomos de concreto claro, um ao lado do outro, acompanhando o oval (a beira de dentro tem a reta de
   u = -45 a 45 e os cantos de raio 38); cada gomo vai de 6 m da beira até passar do fundo */
const naBeira = (s, d) => { if (s < 25.9) { const f = (51 + s / 38 / RAD) * RAD; return [45 + (38 + d) * Math.cos(f), 8.7 + (38 + d) * Math.sin(f)]; }
  if (s < 115.9) return [45 - (s - 25.9), 46.7 + d];
  const f = (90 + (s - 115.9) / 38 / RAD) * RAD; return [-45 + (38 + d) * Math.cos(f), 8.7 + (38 + d) * Math.sin(f)]; };
const GOMOS = Array.from({ length: 30 }, (_, i) => { const s0 = i * 141.8 / 30 + 0.35, s1 = (i + 1) * 141.8 / 30 - 0.35;
  return { y: 14 + (i % 2) * 0.2, h: 0.6, cor: i % 2 ? '#cbc4b4' : '#d9d2c2', pontos: [naBeira(s0, 6.2), naBeira(s1, 6.2), naBeira(s1, 20), naBeira(s0, 20)] }; });
const ZINCO = (pontos, cor) => ({ y: 12.5, h: 0.4, cor, pontos });

export default {
  id: 'estadio-anacleto-campanella', nome: 'Anacleto Campanella', clubes: ['sao-caetano'], norte: 346.7, vazado: 0.42, folga: 22,
  corEscada: AM,
  chao: { cor: '#7d7a72' },
  campo: { corMargem: '#55934f' },
  corMureta: '#3a5aa6',
  aneis: [
    { dentro: I, fora: F, reto: true, h: [1.5, 10.5], fileiras: 20,
      trechos: [
        /* a ARQUIBANCADA AZUL (norte, à direita): dois blocos, com a escada no meio */
        { de: -1, ate: 15, fora: F_NORTE, h: [1.5, 13.5], cor: AZE, cor2: AZE2, padrao: 'mosaico', mistura: 0.35, corredor: 0, corEscada: '#e3e1d6', vomitorios: false, paredeAtras: true, corFachada: '#2b4d9b' },
        { de: 15, ate: COB_N, fora: F_NORTE, h: [1.5, 13.5], cor: AZE, cor2: AZE2, padrao: 'mosaico', mistura: 0.35, corredor: 0, escadaNaBorda: true, corEscada: '#e3e1d6', vomitorios: false, paredeAtras: true, corFachada: '#2b4d9b' },
        /* a COBERTA (oeste, em cima) */
        ...COBERTA,
        /* o FUNDO SUL (à esquerda) e o canto sudeste: os degraus de cimento, com os telhados de zinco por cima do fundo */
        { de: COB_S, ate: SUL_FIM, cor: CIM, cor2: CIM2, padrao: 'mosaico', mistura: 0.4, semCadeiras: true, corredor: 22, corEscada: '#b9b6ad', vomitorios: false, paredeAtras: true, corFachada: '#2b4d9b', parapeito: 3 },
        /* o lado leste (embaixo): só a calçada ao pé do alambrado */
        { de: SUL_FIM, ate: 359, tipo: 'passagem', cor: '#9a978e', fora: F_LESTE }
      ] }
  ],
  /* os gomos da coberta e os telhados de zinco do fundo sul e do canto sudeste */
  telhados: [
    ...GOMOS,
    ZINCO([[-100, 43], [-88, 43], [-87, 20], [-86.5, -2], [-101, -2]], '#7f93a3'),
    ZINCO([[-100, -13], [-86, -9], [-72, -41], [-83, -49]], '#7b8c98'),
    ZINCO([[-71, -44], [-36, -54], [-38, -68], [-71, -58]], '#8795a0')
  ],
  fachada: { cor: '#2b4d9b' },
  refletores: [[-42, 74, 32], [44, 74, 32], [-40, -58, 32], [40, -58, 32]],
  blocos: [
    /* as cabines na frente do telhado da coberta, no meio */
    { u: 0, v: 53, w: 14, d: 2.6, h: 3, y: 9.6, cor: '#8f9498' },
    /* o banco de reservas de teto azul, no lado leste, e os dois bancos brancos do lado da coberta */
    { u: 1.2, v: -48.6, w: 24, d: 3, h: 2.3, cor: '#2f5fb0' },
    { u: -16, v: 43.5, w: 9, d: 1.8, h: 1.8, cor: '#e9e9e4' }, { u: 9.5, v: 43.5, w: 9, d: 1.8, h: 1.8, cor: '#e9e9e4' },
    /* os prédios do clube atrás da metade leste do gol do norte */
    { u: 97, v: -28, w: 13, d: 40, h: 7, cor: '#8f9498', giro: 15 }, { u: 73, v: -57, w: 38, d: 7, h: 5, cor: '#e3e1da', giro: 14 },
    /* a caixa-d'água atrás do fundo sul */
    { u: -110, v: -10, w: 5, d: 5, h: 18, cor: '#c9c9c4' }
  ],
  entorno: [
    /* em cima (oeste): a rua e o ginásio de teto verde, com os galpões ao lado */
    { tipo: 'rua', de: [-120, 73], ate: [125, 73], larg: 7 },
    { tipo: 'predio', u: 23, v: 88, w: 58, d: 22, h: 12, cor: '#3f9a78' }, { tipo: 'predio', u: -42, v: 88, w: 68, d: 22, h: 10, cor: '#8a8d90' },
    /* embaixo (leste): o terreno de grama, o pátio e a rua */
    { tipo: 'grama', u: 5, v: -62, w: 52, d: 22, cor: '#7f8a55' }, { tipo: 'estacionamento', u: 46, v: -62, w: 22, d: 20, cheio: 0.15 },
    { tipo: 'rua', de: [-60, -82], ate: [125, -76], larg: 9 }, { tipo: 'arvores', u: -62, v: -80, w: 50, d: 14, n: 14 },
    /* à direita (norte): a rua em curva e as casas */
    { tipo: 'rua', de: [118, 73], ate: [118, -76], larg: 9 }, { tipo: 'arvores', u: 112, v: 40, w: 6, d: 40, n: 6 }
  ],
  /* (escolhas minhas, sem fonte: não achei mapa de setores) a Comando Azul na arquibancada azul do norte e a visitante no
     fundo sul; os outros bondes da casa na coberta */
  jogo: { mandante1: [2, 26], mandante2: [75, 105], mandante3: [112, 140], visitante: [163, 197], tunelMandante: 14, tunelVisitante: 180, folgaPM: 5,
          fracao: { mandante1: 0.55, mandante2: 0.4, mandante3: 0.4, visitante1: 0.3, visitante2: 0.35, visitante3: 0.25 },
          torcidas: { comando_azul: 'mandante1' } }
};
