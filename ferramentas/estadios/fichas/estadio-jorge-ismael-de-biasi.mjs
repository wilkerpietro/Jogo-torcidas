/* JORGE ISMAEL DE BIASI (o Jorjão — Novorizontino, Novo Horizonte) — pelo
   satélite e pelas fotos de referência (15/11/2026); o meio do campo foi
   tirado do círculo central. O campo corre de sudeste a noroeste; no quadro
   o SUDOESTE (a coberta) fica em cima e o NOROESTE à direita. O mapa de
   setores veio do dono.
   Estádio retangular, fechado dos quatro lados, amarelo e preto:
   · EM CIMA (sudoeste), a COBERTA: cadeira escura, com o meio debaixo do
     telhado claro; atrás, o prédio amarelo e preto com o escudo e o nome do
     estádio.
   · EMBAIXO (nordeste) e ATRÁS DOS DOIS GOLS, o U: uma arquibancada só,
     emendada pelos cantos (ver abaixo). A comprida tem cinco blocos de
     cadeira; as de trás dos gols afinam em rampa até a coberta.
   · As quatro torres dos refletores nos cantos do gramado.
   As fotos misturam épocas: as mais antigas mostram o degrau de cimento
   cinza, sem cadeira, e outras a pintura com a cara do tigre no meio. Vale
   a aérea mais recente (cadeira nos quatro lados, fachada amarela).
   OS ACESSOS: nenhuma boca de vomitório aparece; ficou sem. */
const ESC = '#3d4046', ESC2 = '#33363b', PALHA = '#c9ad5f', PALHA2 = '#bda153', AMAR = '#e3b92e', LINHA = '#e9e6dc';
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* a grama; a família de contornos das arquibancadas: a linha da frente (k = 0) e as de k metros pra trás */
const GRAMA = { a: 63, b: 39, r: 4 };
const C = k => ({ a: 64 + k, b: 41.5 + k, r: 8 + k });
const CAD = (de, ate, cor, cor2, k, mais) => ({ de, ate, cor, cor2, padrao: 'mosaico', mistura: 0.3, corredor: 0, escadaNaBorda: true, corEscada: LINHA, vomitorios: false, fora: C(k),
  paredeAtras: true, corFachada: '#d9d3c0', ...mais });
/* O U (dono, 15/11/2026, com o mapa de setores e uma aérea: "a arquibancada atrás do gol e a lateral [...] não está coerente
   com a realidade, refaça até ficar coerente"): a comprida e as duas de trás dos gols são UMA arquibancada só, emendada
   pelos dois cantos em leque. Medido de novo no satélite e conferido na aérea do dono, vista do mesmo lugar (`vista`):
   O U TEM A MESMA FUNDURA (22 m) na comprida, nos dois cantos e no começo das duas de trás dos gols (dono, 15/11/2026, na
   revisão: "deixe a altura da arquibancada lateral norte da altura de como a curva entrega, sem reduzir"): a curva não
   afina pra chegar na comprida.
   · a COMPRIDA (nordeste): cinco blocos de cadeira (escuro, palha, escuro, palha, escuro);
   · os dois CANTOS: leques de cadeira escura, de fundura constante;
   · atrás do gol do SUDESTE (à esquerda): cadeira palha, afinando de 22 m (no canto) até quase nada (4 m) na coberta (dono,
     com uma linha desenhada: "a arquibancada oeste também reduz igual a leste");
   · atrás do gol do NOROESTE (à direita): cadeira PRETA (dono: "a cor da arquibancada leste é preta; acho que o reflexo das
     imagens que mandei deu a impressão de que era mais claro"), afinando de 22 m a 7 m. É o setor cinza do mapa, o da
     visitante.
   O MURO DE TRÁS das duas é uma linha reta ENVIESADA. Duas tentativas erradas antes desta: três degraus grandes, e depois
   fatias finas (o muro saía serrilhado). Agora o fundo é um contorno liso: um círculo enorme (700 m de raio) que passa
   pelas duas pontas do muro, e `normal: true` faz as fileiras ficarem paralelas ao gol e acabarem nessa linha. Cada canto é
   um leque só, até uma elipse centrada no canto. */
const FUNDO = 22;
const NORDESTE = [ESC, PALHA, ESC, PALHA, ESC].map((cor, i) => CAD(A(-56 + i * 22.4, -41.5), A(-56 + (i + 1) * 22.4, -41.5), cor, cor === ESC ? ESC2 : PALHA2, FUNDO));
/* a linha reta entre dois pontos, como contorno: o círculo de 700 m que passa pelos dois, com o centro do lado do campo */
const LINHA_RETA = ([u0, v0], [u1, v1]) => { const R = 700, mu = (u0 + u1) / 2, mv = (v0 + v1) / 2, du = u1 - u0, dv = v1 - v0, L = Math.hypot(du, dv); let nu = -dv / L, nv = du / L;
  if (nu * mu + nv * mv > 0) { nu = -nu; nv = -nv; } const h = Math.sqrt(R * R - L * L / 4); return { a: R, b: R, forma: 'elipse', cu: mu + nu * h, cv: mv + nv * h }; };
/* a de trás de um gol: seis vãos entre as escadas, da fundura `k0` (do lado da coberta, v = 33,5) à `k1` (do lado da comprida) */
const RAMPA = (lado, k0, k1, cor, cor2, mais) => { const fora = LINHA_RETA([lado * (64 + k0), 33.5], [lado * (64 + k1), -33.5]), a = v => A(lado * 64, v) - (lado > 0 && v < 0 ? 360 : 0);
  return Array.from({ length: 6 }, (_, i) => { const x = [a(33.5 - 67 * i / 6), a(33.5 - 67 * (i + 1) / 6)].sort((p, q) => p - q);
    return CAD(x[0], x[1], cor, cor2, 0, { fora, normal: true, escadaNaBorda: lado > 0 ? i < 5 : i > 0, ...mais }); }); };
/* um canto em leque, da fundura `kv` (do lado da comprida) à `ku` (do lado de trás do gol) */
const LEQUE = (lado, ku, kv) => { const x = [A(lado * 64, -33.5), A(lado * 56, -41.5)].sort((p, q) => p - q);
  return CAD(x[0], x[1], ESC, ESC2, 0, { fora: { a: 8 + ku, b: 8 + kv, forma: 'elipse', cu: lado * 56, cv: -33.5 }, normal: true, celula: 0.3, escadaNaBorda: false, corredor: 0 }); };

export default {
  id: 'estadio-jorge-ismael-de-biasi', nome: 'Jorge Ismael de Biasi', clubes: ['novorizontino', 'xv-de-piracicaba'], norte: 315.6, vazado: 0.4, folga: 22,
  corEscada: LINHA,
  /* a vista da aérea do dono (do canto oeste, por cima da coberta), pra comparar com ela */
  vista: [96, 72, 116, -4, 0, -10],
  chao: { cor: '#7b7870' },
  campo: { corMargem: '#4f9353' },
  corMureta: '#e9e6dc',
  aneis: [
    /* a calçada em volta do gramado */
    /* (atrás do gol do noroeste ela é a faixa de terra batida da foto) */
    { dentro: GRAMA, fora: C(0), h: [0.2, 0.2], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: -27.6, ate: 27.6, tipo: 'passagem', cor: '#9a6f55' }, { de: 27.6, ate: 332.4, tipo: 'passagem', cor: '#a9a69c' }] },
    /* AS ARQUIBANCADAS; a altura acompanha a fundura */
    { dentro: C(0), fora: C(26), reto: true, andarReto: true, h: [1.5, 7.5], inclinacao: 0.46, fileiras: 16,
      trechos: [
        /* atrás do gol do noroeste (à direita): a rampa de cadeira preta (no mapa é o setor cinza, o da visitante) */
        ...RAMPA(1, 7, FUNDO, ESC, ESC2),
        /* o piso entre a cunha e a coberta */
        { de: A(64, 33.5), ate: A(46, 41.5), tipo: 'passagem', cor: '#a9a69c', fora: C(8) },
        /* a COBERTA (em cima): as pontas descobertas e o meio debaixo do telhado */
        CAD(A(46, 41.5), A(16, 41.5), ESC, ESC2, 13, { corredor: 15, escadaNaBorda: false, corFachada: AMAR }),
        CAD(A(16, 41.5), A(-26, 41.5), ESC, AMAR, 13, { mistura: 0.18, corredor: 14, corFachada: AMAR }),
        CAD(A(-26, 41.5), A(-49, 41.5), ESC, ESC2, 13, { corredor: 0, corFachada: AMAR }),
        { de: A(-49, 41.5), ate: A(-64, 33.5), tipo: 'passagem', cor: '#a9a69c', fora: C(5) },
        /* atrás do gol do sudeste (à esquerda): a rampa maior */
        ...RAMPA(-1, 4, FUNDO, PALHA, PALHA2),
        /* o canto sul, em leque, a arquibancada comprida e o canto leste, em leque */
        LEQUE(-1, FUNDO, FUNDO),
        ...NORDESTE,
        LEQUE(1, FUNDO, FUNDO)
      ] }
  ],
  /* o telhado claro do meio da coberta */
  telhados: [{ y: 14.5, h: 0.5, cor: '#dcdcd6', pontos: [[-26, 45.5], [16, 45.5], [16, 63], [-26, 63]] }],
  fachada: { cor: '#d9d3c0' },
  refletores: [[-55, -40.2, 30], [46, -40.2, 30], [-50, 40.2, 30], [45, 40.2, 30]],
  blocos: [
    /* o prédio amarelo e preto de trás da coberta: o corpo comprido, o miolo debaixo do telhado e as faixas pretas */
    { u: -1.5, v: 58.6, w: 95, d: 7, h: 9, cor: AMAR }, { u: -5, v: 59, w: 42, d: 8, h: 13.5, cor: AMAR },
    { u: -1.5, v: 62.2, w: 95, d: 0.3, h: 0.5, y: 3, cor: '#1d1e21' }, { u: -1.5, v: 62.2, w: 95, d: 0.3, h: 0.5, y: 6, cor: '#1d1e21' },
    ...Array.from({ length: 12 }, (_, i) => ({ u: -45 + i * 8, v: 62.2, w: 0.5, d: 0.3, h: 9, cor: '#1d1e21' })),
    /* o painel preto do escudo e o letreiro do nome do estádio */
    { u: -5, v: 63.2, w: 0.5, d: 12, h: 5, y: 7, cor: '#17181b', giro: 90 },
    { u: -5, v: 63.3, w: 0.6, d: 44, h: 2.4, y: 2, cor: AMAR, giro: 90, texto: 'ESTÁDIO DR. JORGE ISMAEL DE BIASI', corTexto: '#1d1e21', textoFace: true, textoLargura: 0.94, textoAltura: 0.62 },
    /* os prédios brancos do canto sul e a casa de telha do canto oeste */
    { u: -68, v: 52, w: 30, d: 18, h: 6, cor: '#e9e6dc' }, { u: 62, v: 54, w: 14, d: 12, h: 4, cor: '#b5604a' },
    /* os bancos de reserva, do lado da coberta */
    { u: -12, v: 40, w: 13, d: 1.8, h: 1.8, cor: '#e9e6dc' }, { u: 10, v: 40, w: 13, d: 1.8, h: 1.8, cor: '#e9e6dc' }
  ],
  entorno: [
    /* embaixo (nordeste): o estacionamento e a rua; em cima (sudoeste): a rua, os carros e as árvores */
    { tipo: 'estacionamento', u: -4, v: -70, w: 150, d: 8, cheio: 0.15 }, { tipo: 'rua', de: [-115, -80], ate: [115, -80], larg: 10 },
    { tipo: 'rua', de: [-90, 68], ate: [50, 68], larg: 8 }, { tipo: 'arvores', u: -40, v: 80, w: 110, d: 10, n: 22 },
    /* à esquerda (sudeste): as árvores; à direita (noroeste): o terreno de terra */
    { tipo: 'arvores', u: -102, v: 0, w: 12, d: 100, n: 18 }, { tipo: 'grama', u: 104, v: 0, w: 22, d: 120, cor: '#8f7f6a' }
  ],
  /* pelo mapa de setores do dono: a VISITANTE no setor cinza, atrás do gol do noroeste (à direita); a casa no amarelo. A Garra
     do Tigre no meio da arquibancada comprida é escolha minha (o mapa não diz onde ela fica); os outros bondes da casa atrás
     do gol do sudeste e na coberta */
  jogo: { mandante1: [255, 285], mandante2: [166, 194], mandante3: [75, 105], visitante: [-15, 13], tunelMandante: 270, tunelVisitante: -1, folgaPM: 4,
          fracao: { mandante1: 0.55, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { garra_do_tigre: 'mandante1' } }
};
