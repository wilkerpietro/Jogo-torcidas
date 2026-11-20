/* JAYME CINTRA (Paulista de Jundiaí, Jundiaí) — pelo satélite e pelas fotos
   de referência (15/11/2026); o meio do campo foi tirado do círculo
   central. O campo é quase norte-sul; no quadro o OESTE (a coberta) fica em
   cima e o NORTE à direita. NÃO achei mapa de setores do clube.
   Bacia oval de degrau de cimento pintado de vermelho (desbotado), com as
   escadas amarelas, e uma arquibancada coberta só num pedaço do lado oeste:
   · A FERRADURA de degrau: o lado leste inteiro (embaixo) e as duas curvas,
     de uns 20 m de fundo. No alto do lado leste, a faixa escura dos
     anúncios pintados; por fora, o muro e os tetos brancos dos bares.
   · EM CIMA (oeste), a COBERTA: fica na metade SUL do lado (à esquerda no
     quadro), não no meio. Cadeira branca na frente, vermelha no meio e
     escura no alto, debaixo do telhado branco; atrás, o prédio branco.
   · O resto do lado oeste (à direita no quadro) NÃO tem arquibancada: só o
     muro e o estacionamento.
   As fotos antigas mostram a ferradura em blocos vermelhos e brancos com o
   letreiro CAMPEÃO COPA DO BRASIL 2005 no alto; o satélite atual mostra
   tudo vermelho desbotado e os anúncios. Vale o satélite.
   OS ACESSOS: nenhuma boca de vomitório aparece; ficou sem. */
const VM = '#b5625c', VM2 = '#a8837a', AM = '#d9c070';
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* a beira do gramado; a frente e o fundo da ferradura; a linha da frente da coberta; o fundo da coberta */
const GRAMA = { a: 86, b: 46, r: 40 }, I = { a: 87.5, b: 47.5, r: 41.5 }, F = { a: 105, b: 69, r: 62 };
const TOPO = { a: 90, b: 52.5, r: 2 }, C_F = { a: 115, b: 77.5, r: 27 };
/* a ferradura vai da ponta noroeste (33 graus), pelo norte, pelo leste e pelo sul, até a ponta sudoeste (145 graus); as
   escadas amarelas onde o satélite mostra */
const ESCADAS = [-215, -186.4, -177.1, -162, -129.6, -92.5, -51.2, -12.1, 7, 33];
const ANUNCIO = { 4: '#6b6f76', 5: '#39425f' };
const FERRADURA = ESCADAS.slice(0, -1).map((de, i) => ({ de, ate: ESCADAS[i + 1], cor: VM, cor2: VM2, padrao: 'mosaico', mistura: 0.3, semCadeiras: true, corredor: 0, escadaNaBorda: i > 0, corEscada: AM,
  vomitorios: false, ...(ANUNCIO[i] ? { faixaTopo: { n: 4, cor: ANUNCIO[i] } } : {}) }));
/* os tetos brancos dos bares, por fora do muro */
const BAR = (u, v, w, giro = 0) => ({ u, v, w, d: 5, h: 3, cor: '#e9e9e4', giro });

export default {
  id: 'estadio-jayme-cintra', nome: 'Jayme Cintra', clubes: ['paulista-de-jundiai'], norte: 13.2, vazado: 0.4, folga: 22,
  corEscada: AM,
  chao: { cor: '#7d7a72' },
  campo: { corMargem: '#5f8f52' },
  corMureta: '#e3e1da',
  aneis: [
    /* a calçada ao pé do alambrado; do lado oeste ela vai até a linha da coberta e do muro */
    { dentro: GRAMA, fora: I, h: [0.2, 0.2], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 33, ate: 145, tipo: 'passagem', cor: '#a9a69c', fora: TOPO }, { de: -215, ate: 33, tipo: 'passagem', cor: '#a9a69c' }] },
    /* A FERRADURA de degrau vermelho */
    { dentro: I, fora: F, h: [1.5, 10.5], fileiras: 22, trechos: FERRADURA },
    /* A COBERTA, na metade sul do lado oeste */
    { dentro: TOPO, fora: C_F, reto: true, andarReto: true, h: [2, 15], fileiras: 26,
      trechos: [{ de: A(9, 52.5), ate: A(-66, 52.5), cor: '#e9e9e6', padrao: 'fracoes', fracoes: [[0.3, '#e9e9e6'], [0.62, '#b8433c'], [1, '#2b2d33']], corredor: 15, corEscada: '#d9d6cc', vomitorios: false,
                  paredeAtras: true, corFachada: '#dcdcd6' }] }
  ],
  /* o telhado branco da coberta */
  telhados: [{ y: 19, h: 0.6, cor: '#e3e3df', pontos: [[-65.8, 59], [9.2, 59], [9.2, 78], [-65.8, 78]] }],
  fachada: { cor: '#e3e1da' },
  refletores: [[-98, 52, 38], [100, 50, 38], [-96, -62, 38], [98, -62, 38]],
  blocos: [
    /* o prédio branco atrás da coberta */
    { u: -28.3, v: 83, w: 75, d: 10, h: 17, cor: '#dcdcd6' },
    /* os bancos de reserva de teto vermelho, do lado da coberta */
    { u: -15.8, v: 44.6, w: 7, d: 2.2, h: 2, cor: '#c9544c' }, { u: -3, v: 44.6, w: 4, d: 2.2, h: 2, cor: '#c9544c' }, { u: 11.3, v: 44.6, w: 7, d: 2.2, h: 2, cor: '#c9544c' },
    /* o muro do lado oeste sem arquibancada e o portão do canto noroeste */
    { u: 40, v: 53.5, w: 52, d: 1, h: 3, cor: '#cfcbc0' }, { u: 71, v: 62, w: 10, d: 12, h: 5, cor: '#d9d3c4', giro: 30 },
    /* os bares por fora do muro do leste e da curva norte */
    BAR(-49, -77.5, 15, -8), BAR(-27, -80.5, 14, -3), BAR(17, -80, 26, 2), BAR(52, -75, 14, 14), { u: 108, v: 10, w: 4, d: 55, h: 3, cor: '#e9e9e4' }
  ],
  entorno: [
    /* a rua que dá a volta no estádio */
    { tipo: 'rua', de: [-110, -92], ate: [110, -92], larg: 10 }, { tipo: 'rua', de: [122, -80], ate: [122, 70], larg: 10 }, { tipo: 'rua', de: [-122, -80], ate: [-122, 70], larg: 10 },
    { tipo: 'rua', de: [-110, 96], ate: [110, 96], larg: 10 },
    /* em cima à direita (noroeste): o estacionamento */
    { tipo: 'estacionamento', u: 40, v: 70, w: 48, d: 26, cheio: 0.1 },
    /* as árvores e os gramados em volta; as casas em cima à esquerda */
    { tipo: 'arvores', u: 128, v: 50, w: 8, d: 40, n: 8 }, { tipo: 'grama', u: 0, v: -106, w: 200, d: 12, cor: '#7f9a62' },
    { tipo: 'casas', u: -100, v: 110, nu: 4, nv: 1, passo: 15 }, { tipo: 'arvores', u: -110, v: -100, w: 30, d: 10, n: 6 }
  ],
  /* (escolhas minhas, sem fonte: não achei mapa de setores) a Raça Tricolor no meio do lado leste e a visitante na curva
     norte; os outros bondes da casa na coberta e na curva sul */
  jogo: { mandante1: [255, 285], mandante2: [100, 125], mandante3: [165, 195], visitante: [-18, 14], tunelMandante: 270, tunelVisitante: -2, folgaPM: 5,
          fracao: { mandante1: 0.6, mandante2: 0.6, mandante3: 0.6, visitante1: 0.6, visitante2: 0.65, visitante3: 0.55 },
          torcidas: { raca_tricolor: 'mandante1' } }
};
