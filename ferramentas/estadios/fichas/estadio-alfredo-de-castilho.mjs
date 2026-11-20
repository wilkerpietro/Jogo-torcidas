/* ALFREDO DE CASTILHO (o Alfredão — Noroeste, Bauru) — pelo satélite e pelas
   fotos de referência (15/11/2026); o meio do campo foi tirado dos dois
   gols. O campo corre de noroeste a sudeste; no quadro o NORDESTE (as
   cobertas de teto vermelho) fica em cima e o SUDESTE à direita. NÃO achei
   mapa de setores do clube.
   · EMBAIXO e nas duas pontas, a FERRADURA de degrau: dá a volta do canto
     norte, pelo fundo noroeste (à esquerda), pelo lado sudoeste (embaixo) e
     pelo fundo sudeste (à direita). Rasa nas pontas (17 a 21 m) e funda no
     meio do lado (29 m). No meio do lado, o telhado cinza cobre o fundo do
     degrau. As escadas claras, uma a uma, onde o satélite mostra.
   · EM CIMA (nordeste), três cobertas baixas de teto vermelho, de cadeira
     vermelha, com a torre das cabines entre elas.
   · Atrás dos dois gols, na grama, o NORUSCA escrito em branco.
   O degrau aparece cinza no satélite; fotos de dentro mostram ele
   avermelhado. Vale o satélite.
   OS ACESSOS: nenhuma boca de vomitório aparece; ficou sem. */
const CIN = '#8f949c', CIN2 = '#858a92', ESC = '#e6dfb4', VM = '#c8463f';
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* a grama; a beira de dentro da ferradura; o fundo dela (o lado do noroeste é mais raso que o do sudeste) */
const GRAMA = { a: 88, b: 40, r: 22 }, I = { a: 92, b: 61, r: 40 }, F_ESQ = { a: 109, b: 90, r: 62 }, F_DIR = { a: 112.5, b: 90, r: 64 };
/* as cobertas do nordeste: a frente e o fundo */
const N_D = { a: 92, b: 46, r: 26 }, N_F = { a: 100, b: 54, r: 34 };
/* a ferradura, escada a escada (os ângulos valem na beira de dentro) */
const ESCADAS = [152.5, 173.2, 194.6, 210.8, 226, 239.4, 269, 299.1, 314, 326.1, 344.8, 366.9, 387.5];
const FERRADURA = ESCADAS.slice(0, -1).map((de, i) => ({ de, ate: ESCADAS[i + 1], fora: de < 269 ? F_ESQ : F_DIR, cor: CIN, cor2: CIN2, padrao: 'mosaico', mistura: 0.35, semCadeiras: true, corredor: 0,
  escadaNaBorda: i > 0, corEscada: ESC, vomitorios: false, paredeAtras: true, corFachada: '#d9d6cc' }));
const COBERTA = (u0, u1) => ({ de: A(u0, 46), ate: A(u1, 46), cor: VM, cor2: '#b93e38', padrao: 'mosaico', mistura: 0.3, corredor: 0, vomitorios: false, paredeAtras: true, corFachada: '#e9e6dc' });
const TETO = (u, v, w, d) => ({ u, v, w, d, h: 0.4, y: 6.5, cor: '#d9534a', cobertura: true });
const NORUSCA = (u, giro) => ({ u, v: 1.5, w: 36, d: 7, h: 0.12, cor: '#a8604a', texto: 'NORUSCA', corTexto: '#f1efe8', textoLargura: 0.92, textoAltura: 0.7, giro });
const TENDA = (u, v) => ({ u, v, w: 5, d: 5, h: 3, cor: '#f1efe9' });

export default {
  id: 'estadio-alfredo-de-castilho', nome: 'Alfredo de Castilho', clubes: ['noroeste'], norte: 122.3, vazado: 0.4, folga: 24,
  corEscada: ESC,
  chao: { cor: '#7f8a63' },
  campo: { corMargem: '#4f9353' },
  corMureta: '#d9d6cc',
  aneis: [
    /* a pista de terra em volta da grama; do lado da ferradura sobra uma faixa de grama até o pé do degrau */
    { dentro: GRAMA, fora: I, h: [0.2, 0.2], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 27.5, ate: 152.5, tipo: 'passagem', cor: '#8a7f72', fora: N_D }, { de: 152.5, ate: 215, tipo: 'passagem', cor: '#8a7f72' },
                { de: 215, ate: 325, tipo: 'passagem', cor: '#4a8b49' }, { de: 325, ate: 387.5, tipo: 'passagem', cor: '#8a7f72' }] },
    /* AS COBERTAS do nordeste */
    { dentro: N_D, fora: N_F, reto: true, andarReto: true, h: [1.2, 4.6], fileiras: 8, corredorFrente: 0,
      trechos: [COBERTA(50, 37.5), COBERTA(34, 10), COBERTA(-7.5, -62.5)] },
    /* A FERRADURA (por último: é ela que dá o tamanho do quadro); a altura acompanha a fundura */
    { dentro: I, fora: F_DIR, reto: true, normal: true, h: [1.5, 12], inclinacao: 0.42, fileiras: 26, trechos: FERRADURA }
  ],
  /* o telhado cinza por cima do fundo do degrau, no meio do lado sudoeste */
  telhados: [{ y: 16.5, h: 0.5, cor: '#9a9c9e', pontos: [[-56, -70], [-30, -72.5], [0, -73], [30, -72.5], [56, -69], [62, -79], [30, -89], [0, -90.5], [-30, -89.5], [-61, -80]] }],
  fachada: { cor: '#d9d6cc' },
  refletores: [[-40, 60, 30], [45, 60, 30], [-100, -62, 30], [102, -62, 30]],
  blocos: [
    /* os tetos vermelhos das três cobertas e a torre das cabines */
    TETO(43.75, 50, 12.5, 8), TETO(22, 50, 24, 8), TETO(-35, 50, 55, 8),
    { u: 2, v: 51, w: 9, d: 11, h: 9, cor: '#e9e6dc' }, { u: 2, v: 51, w: 10, d: 12, h: 0.4, y: 9, cor: '#d9534a' },
    /* os prédios brancos do canto leste */
    { u: 73, v: 50.5, w: 30, d: 6, h: 4, cor: '#e3e1da' },
    /* o NORUSCA na grama, atrás dos dois gols */
    NORUSCA(-78, -90), NORUSCA(79, 90),
    /* a fileira de bancos e placas do lado da ferradura, e o marco do escudo */
    { u: -2, v: -39.5, w: 100, d: 1.4, h: 1, cor: '#d9d9d3' }, { u: 0, v: -56, w: 4, d: 6, h: 0.3, cor: '#d9534a' },
    /* as tendas brancas atrás da ferradura */
    TENDA(-61, -86), TENDA(-48, -90), TENDA(-28, -93), TENDA(0, -95), TENDA(49, -89), TENDA(62, -86), TENDA(106, -48), TENDA(110, -55)
  ],
  entorno: [
    /* em cima (nordeste): a rua, as árvores, o terreno arado e os galpões */
    { tipo: 'rua', de: [-120, 61], ate: [120, 61], larg: 7 }, { tipo: 'arvores', u: 30, v: 62, w: 50, d: 8, n: 9 },
    { tipo: 'grama', u: 30, v: 86, w: 70, d: 32, cor: '#c9a070' }, { tipo: 'predio', u: -52, v: 82, w: 34, d: 12, h: 6, cor: '#c9bfae', giro: 32 },
    { tipo: 'predio', u: -22, v: 84, w: 24, d: 10, h: 5, cor: '#9a9c9e', giro: -50 },
    /* à esquerda (noroeste): as árvores; embaixo: o gramado e as árvores */
    { tipo: 'arvores', u: -118, v: 20, w: 12, d: 90, n: 16 }, { tipo: 'arvores', u: -80, v: -96, w: 30, d: 12, n: 6 }, { tipo: 'arvores', u: 108, v: -96, w: 16, d: 12, n: 4 }
  ],
  /* (escolhas minhas, sem fonte: não achei mapa de setores) a Sangue Rubro debaixo do telhado, no meio da ferradura, e a
     visitante no fundo sudeste (à direita); os outros bondes da casa ao lado dela e nas cobertas do nordeste */
  jogo: { mandante1: [241, 267], mandante2: [271, 297], mandante3: [105, 140], visitante: [-13, 12], tunelMandante: 254, tunelVisitante: 0, folgaPM: 4,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.55, visitante2: 0.6, visitante3: 0.5 },
          torcidas: { sangue_rubro: 'mandante1' } }
};
