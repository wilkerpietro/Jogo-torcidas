/* JORGE ISMAEL DE BIASI (o Jorjão — Novorizontino, Novo Horizonte) — pelo
   satélite e pelas fotos de referência (15/11/2026); o meio do campo foi
   tirado do círculo central. O campo corre de sudeste a noroeste; no quadro
   o SUDOESTE (a coberta) fica em cima e o NOROESTE à direita. NÃO achei
   mapa de setores do clube.
   Estádio retangular, fechado dos quatro lados, amarelo e preto:
   · EM CIMA (sudoeste), a COBERTA: cadeira escura, com o meio debaixo do
     telhado claro; atrás, o prédio amarelo e preto com o escudo e o nome do
     estádio.
   · EMBAIXO (nordeste), a arquibancada comprida, em cinco blocos de
     cadeira: escuro, amarelo-palha, escuro, amarelo-palha, escuro; os dois
     cantos em curva, escuros.
   · ATRÁS DOS DOIS GOLS, a arquibancada amarelo-palha em cunha: funda do
     lado da arquibancada comprida e rasa do lado da coberta (o muro de trás
     é enviesado). A do sudeste (à esquerda) é maior que a do noroeste.
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
/* a arquibancada comprida do nordeste: cinco blocos (da esquerda pra direita) */
const NORDESTE = [ESC, PALHA, ESC, PALHA, ESC].map((cor, i) => CAD(A(-56 + i * 22.4, -41.5), A(-56 + (i + 1) * 22.4, -41.5), cor, cor === ESC ? ESC2 : PALHA2, 13));
/* a cunha de trás de um gol: três degraus de fundura, do lado da coberta (v = 33,5) pro lado da comprida (v = -33,5) */
const CUNHA = (lado, ks) => { const a = v => A(lado * 64, v) - (lado > 0 && v < 0 ? 360 : 0), vs = lado > 0 ? [-33.5, -10, 12, 33.5] : [33.5, 12, -10, -33.5], k = lado > 0 ? [ks[2], ks[1], ks[0]] : ks;
  return k.map((kk, i) => CAD(a(vs[i]), a(vs[i + 1]), PALHA, PALHA2, kk, { escadaNaBorda: false, corredor: 14 })); };

export default {
  id: 'estadio-jorge-ismael-de-biasi', nome: 'Jorge Ismael de Biasi', clubes: ['novorizontino', 'inter-de-limeira', 'xv-de-piracicaba'], norte: 315.6, vazado: 0.4, folga: 22,
  corEscada: LINHA,
  /* a vista de perto da fachada */
  vista: [-40, 30, 135, -5, 6, 60],
  chao: { cor: '#7b7870' },
  campo: { corMargem: '#4f9353' },
  corMureta: '#e9e6dc',
  aneis: [
    /* a calçada em volta do gramado */
    { dentro: GRAMA, fora: C(0), h: [0.2, 0.2], fileiras: 2, corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#a9a69c' }] },
    /* AS ARQUIBANCADAS; a altura acompanha a fundura */
    { dentro: C(0), fora: C(26), reto: true, andarReto: true, h: [1.5, 7.5], inclinacao: 0.46, fileiras: 16,
      trechos: [
        /* atrás do gol do noroeste (à direita): a cunha menor */
        ...CUNHA(1, [8, 13, 18]),
        /* o piso entre a cunha e a coberta */
        { de: A(64, 33.5), ate: A(46, 41.5), tipo: 'passagem', cor: '#a9a69c', fora: C(8) },
        /* a COBERTA (em cima): as pontas descobertas e o meio debaixo do telhado */
        CAD(A(46, 41.5), A(16, 41.5), ESC, ESC2, 13, { corredor: 15, escadaNaBorda: false, corFachada: AMAR }),
        CAD(A(16, 41.5), A(-26, 41.5), ESC, AMAR, 13, { mistura: 0.18, corredor: 14, corFachada: AMAR }),
        CAD(A(-26, 41.5), A(-49, 41.5), ESC, ESC2, 13, { corredor: 0, corFachada: AMAR }),
        { de: A(-49, 41.5), ate: A(-64, 33.5), tipo: 'passagem', cor: '#a9a69c', fora: C(8) },
        /* atrás do gol do sudeste (à esquerda): a cunha maior */
        ...CUNHA(-1, [18, 22, 26]),
        /* o canto sul, em curva, a arquibancada comprida e o canto leste, em curva */
        CAD(A(-64, -33.5), A(-56, -41.5), ESC, ESC2, 20, { escadaNaBorda: false }),
        ...NORDESTE,
        CAD(A(56, -41.5), A(64, -33.5), ESC, ESC2, 15)
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
  /* (escolhas minhas, sem fonte: não achei mapa de setores) a Garra do Tigre no meio da arquibancada comprida e a visitante
     atrás do gol do sudeste; os outros bondes da casa atrás do gol do noroeste e na coberta */
  jogo: { mandante1: [255, 285], mandante2: [-14, 14], mandante3: [75, 105], visitante: [166, 194], tunelMandante: 270, tunelVisitante: 180, folgaPM: 4,
          fracao: { mandante1: 0.55, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { garra_do_tigre: 'mandante1' } }
};
