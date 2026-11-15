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
   · À ESQUERDA (sul), TRÊS arquibancadas separadas, de chapa azul
     desbotada: uma atrás do gol, uma na diagonal do canto sudeste e uma no
     começo do lado leste; na frente delas, a calçada ao pé do alambrado;
     por fora, o muro alto azul.
   · EMBAIXO (leste), NÃO há arquibancada: só o alambrado, o banco de
     reservas de teto azul, o pátio e o terreno de grama.
   OS ACESSOS: nenhuma boca de vomitório aparece; ficou sem. */
const AZ = '#2c4a8a', AZ2 = '#27427c';                  /* a cadeira azul da coberta */
const AZE = '#263a72', AZE2 = '#2f4683';                /* a cadeira azul-escura do norte */
const CIM = '#93938d', CIM2 = '#878782', AM = '#d8c46a';
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* a beira do gramado oval; o fundo da coberta e do fundo sul; o fundo da arquibancada azul; a calçada do lado leste */
const I = { a: 83, b: 46.7, r: 38 }, F = { a: 102, b: 65.7, r: 57 }, F_NORTE = { a: 107, b: 70.7, r: 62 };
/* as pontas: a coberta vai de 29 a 151 graus; o fundo sul segue até o canto sudeste; a azul fica de -1 a 29 */
const COB_N = 29, COB_S = 151;
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
/* AS TRÊS ARQUIBANCADAS DO SUL (dono, 15/11/2026: "você interpretou errado, são 3 arquibancadas diferentes mesmo, atrás do
   gol"; "veja bem o formato"): três lances separados, de chapa azul desbotada e enferrujada, cada um um plano inclinado.
   A primeira, atrás do gol (em leque, acompanhando a curva); a segunda, reta, na diagonal do canto sudeste; a terceira,
   reta, no começo do lado leste. Eu tinha lido as três como telhados em cima de uma arquibancada só. */
const ZINCO = { cor: '#86a3b8', cor2: '#b59f86', padrao: 'mosaico', mistura: 0.22, semCadeiras: true, corEscada: '#9fb4c4', vomitorios: false, corMureta: '#6f8798' };
const D_SUL = { a: 87.5, b: 51.2, r: 42.5 }, F_SUL = { a: 100.5, b: 64.2, r: 55.5 };

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
        /* do fim da coberta até o fundo norte, pelo sul e pelo leste: só a calçada ao pé do alambrado */
        { de: COB_S, ate: 359, tipo: 'passagem', cor: '#9a978e', fora: D_SUL }
      ] },
    /* A ARQUIBANCADA DE TRÁS DO GOL DO SUL (a primeira das três): em leque, atrás da calçada */
    { dentro: D_SUL, fora: F_SUL, reto: true, h: [2, 9.5], fileiras: 16, corredorFrente: 0,
      trechos: [{ de: 154, ate: 180.7, ...ZINCO, corredor: 0, paredeAtras: true, corFachada: '#2b4d9b', parapeito: 2.5 }] }
  ],
  /* os gomos da coberta */
  telhados: GOMOS,
  /* a segunda e a terceira arquibancadas do sul: retas, separadas, cada uma virada pro campo no seu ângulo */
  retas: [
    { u: -81.9, v: -26.1, ang: 209.1, comp: 36, prof: 11.8, h: [2, 8.5], fileiras: 14, ...ZINCO, corredor: 0, corredorFrente: 0, parapeito: 2.5, corFachada: '#2b4d9b', corLado: '#5f7486' },
    { u: -52.3, v: -48.7, ang: 254.2, comp: 36.7, prof: 13.7, h: [2, 9.5], fileiras: 16, ...ZINCO, corredor: 0, corredorFrente: 0, parapeito: 2.5, corFachada: '#2b4d9b', corLado: '#5f7486' }
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
  /* (escolhas minhas, sem fonte: não achei mapa de setores) a Comando Azul na arquibancada azul do norte e a visitante na
     arquibancada de trás do gol do sul; os outros bondes da casa na coberta */
  jogo: { mandante1: [2, 26], mandante2: [75, 105], mandante3: [112, 140], visitante: [160.5, 175], tunelMandante: 14, tunelVisitante: 168, folgaPM: 3.5,
          fracao: { mandante1: 0.55, mandante2: 0.4, mandante3: 0.4, visitante1: 0.62, visitante2: 0.7, visitante3: 0.55 },
          torcidas: { comando_azul: 'mandante1' } }
};
