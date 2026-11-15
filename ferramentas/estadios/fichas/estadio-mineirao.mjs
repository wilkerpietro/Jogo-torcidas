/* MINEIRÃO (Cruzeiro e Atlético-MG, Belo Horizonte) — pelo satélite (o
   telhado, a abertura e o entorno) e pelas sete fotos (seis de dentro e uma aérea) que o
   dono mandou (15/11/2026). O campo corre quase norte-sul; no quadro o
   OESTE (o lado dos bancos e da tribuna) fica em cima e o NORTE à direita.
   A FORMA (dono, 15/11/2026, com o mapa de setores: "ele não é tão oval
   assim como você desenhou"; depois: "observe detalhadamente a imagem do
   mapa pra planta da arquibancada vista de cima ser extremamente fiel ao
   mapa"): a planta saiu do MAPA, endireitado na escala do campo (105 x
   68) e medido raio a raio, de 3 em 3 graus. Cada contorno é uma tabela de
   120 raios (`forma: 'raios'`). O que o mapa mostra:
   · A FRENTE DO LANCE DE BAIXO: atrás de cada gol um arco bem aberto (68 m
     do meio do campo no meio do gol, 63 m nas pontas); nas laterais, outro
     arco aberto (50 m no meio, 45 m perto dos cantos); cantos redondos que
     vão a 71 m. Nos quatro cantos, uma PASSAGEM diagonal corta o lance de
     baixo (entre os setores 101 e 145, 111 e 113, 121 e 123, 135 e 137).
   · O LANCE DE BAIXO (101 a 146): raso nas laterais (17 a 21 m) e fundo
     atrás dos gols (37 m), até a divisa com o de cima.
   · AS FAIXAS DE CAMAROTES, entre os dois lances, só nas laterais: no oeste
     a de 8 m, de canto a canto, com os camarotes abertos na frente (C101 a
     C124: cadeira atrás de vidro, em cima do muro laranja, com o corredor
     na frente) e os fechados atrás (C201 a C236, vidro escuro); no leste a
     faixa vermelha (C237 a C274), de 5 a 6 m, que dobra os cantos e afina
     até sumir.
   · A DIVISA COM O LANCE DE CIMA: 105 m atrás dos gols, 76 m nas laterais.
   · O LANCE DE CIMA (301 a 344): um anel de uns 27 m de fundo, quase uma
     elipse (132 x 103 m por fora), um pouco mais quadrado que ela.
   Arena de dois lances, toda coberta:
   · A CADEIRA, nos dois lances: mosaico de cinza claro com cinza mais
     escuro, bem misturado. As bocas do lance de baixo são LARANJA, no meio
     do lance; as do de cima, VERMELHAS, perto da frente.
   · A TRIBUNA (setores 201 a 203 do mapa) fica no meio da faixa de
     camarotes do oeste, entre os C201-C218 e os C219-C236; o lance de
     cima é todo da mesma cadeira. (Eu tinha posto dois lotes de cadeira
     escura no meio do lance de cima do oeste, como tribuna de imprensa,
     por uma leitura de foto; o mapa não tem isso. Dono, 15/11/2026: "Não
     entendi esses dois lotes de cadeiras escuras no meio".)
   · A margem verde larga entre o campo e o muro, mais larga atrás dos gols;
     os bancos de teto de vidro do lado oeste.
   · O TELHADO (satélite): por fora, o anel de concreto com as placas
     solares escuras entre as 88 nervuras claras dos pórticos, que descem
     inclinados pela fachada; por dentro, a membrana branca até a abertura
     oval. Um telão pendurado na beira da abertura em cada ponta.
   · Em volta, a esplanada de concreto, com as tendas brancas das entradas.
   (A linha fina em forma de lente no fundo do lance de baixo atrás dos
   gols, perto da divisa, ficou sem desenho: não sei o que é.)
   OS SETORES (mapa do dono; o norte do desenho aponta pro canto de cima à
   esquerda): o LARANJA é o fundo norte (135 a 145 e 335 a 344, portão F);
   o ROXO, a lateral oeste (101 a 111 e 301 a 312, portões A e B); o
   AMARELO, o fundo sul (112 a 122 e 313 a 322, portão C); o do leste (123
   a 134 e 323 a 334, portões D e E) é o Vermelho.
   AS TORCIDAS: o Amarelo é o das organizadas do Cruzeiro (Máfia Azul); a
   visitante fica no Roxo Superior, do lado do portão A (a ponta norte da
   lateral oeste). A Galoucura ficou no mesmo fundo sul quando o Atlético
   manda (escolha minha, sem fonte). */
const E = (a, b) => ({ a, b, forma: 'elipse' });
const CD = '#e6e8ea', CD2 = '#c2c8ce';                   /* a cadeira: cinza claro e cinza mais escuro, em mosaico */
const CADEIRA = { cor: CD, cor2: CD2, padrao: 'mosaico', mistura: 0.35 };
const LARANJA = '#dd6a3c', VERMELHO = '#c8452f';         /* as bocas de baixo e as de cima */
/* OS CONTORNOS, medidos no mapa: o raio, a partir do meio do campo, de 3 em 3 graus (0 = o gol norte, 90 = a lateral oeste) */
const R = raios => ({ forma: 'raios', raios, a: Math.max(raios[0], raios[60]), b: Math.max(raios[30], raios[90]) });
/* a frente do lance de baixo (a beira da margem) */
const I = R([68, 67.9, 68, 68.2, 68.5, 68.8, 69.3, 69.9, 70.4, 70.8, 70.9, 70.4, 69, 66.8, 64.2, 62.2, 60.5, 58.8, 57.1, 55.5, 54.2, 53.5, 52.9, 52, 51.1, 50.5, 50.2, 50.2, 50.3, 50.3, 50.3, 50.2, 50.2, 50.2, 50.3, 50.6, 51, 51.5, 52.2, 53.2, 54.5, 55.8, 57.1, 58.5, 60.2, 62.2, 64.5, 67, 69.1, 70.4, 71, 70.9, 70.4, 69.8, 69.2, 68.8, 68.5, 68.2, 68, 68, 68, 68, 68, 68.2, 68.5, 68.8, 69.2, 69.8, 70.4, 70.9, 70.8, 69.9, 68.2, 66, 63.6, 61.5, 59.6, 58, 56.5, 55, 53.6, 52.5, 51.6, 51, 50.5, 50, 49.5, 49.2, 49, 48.8, 48.7, 48.8, 49, 49.2, 49.5, 50, 50.5, 51, 51.6, 52.5, 53.6, 55, 56.5, 57.8, 59.2, 61, 63, 65.2, 67.3, 69.2, 70.5, 70.8, 70.5, 70, 69.5, 69, 68.5, 68.2, 67.9, 67.9]);
/* a frente das faixas de camarotes (fora delas, a própria divisa) e o meio da faixa do oeste (entre os abertos e os fechados) */
const CA = R([104.9, 105, 104.7, 104.3, 103.8, 102.9, 102, 101, 99.7, 98, 96.6, 85.5, 85.5, 85, 84.5, 82.5, 80.5, 79, 77.5, 76, 74.5, 73, 71.5, 70.5, 69.5, 69, 68.5, 68.2, 68, 67.8, 67.5, 67.8, 68, 68.2, 68.5, 69, 69.5, 70.8, 72, 72.8, 73.5, 75.5, 77.5, 79, 80.5, 82.5, 84.5, 85, 85.5, 85.5, 96.6, 98, 99.7, 101, 102, 102.9, 103.8, 104.3, 104.7, 105, 104.9, 104.8, 104.6, 104.2, 103.5, 102.4, 101.6, 100.5, 99.2, 97.8, 96, 94.5, 92.9, 91.1, 86.4, 84.3, 82.2, 80.5, 78.7, 77.3, 75.9, 74.6, 73.3, 72.5, 71.7, 71.1, 70.4, 70, 69.6, 69.5, 69.4, 69.6, 69.7, 70, 70.3, 70.9, 71.6, 72.4, 73.3, 74.5, 75.8, 77.2, 78.7, 80.6, 82.5, 84.5, 86.5, 91.1, 92.9, 94.5, 96, 97.8, 99.2, 100.5, 101.6, 102.4, 103.5, 104.2, 104.6, 104.8]);
const CM = R([104.9, 105, 104.7, 104.3, 103.8, 102.9, 102, 101, 99.7, 98, 96.6, 90.2, 89.5, 88.2, 87.1, 85.2, 83.4, 82, 80.6, 79.2, 77.9, 76.6, 75.3, 74.4, 73.5, 73, 72.6, 72.3, 72.1, 72, 71.8, 72, 72.2, 72.5, 72.7, 73.1, 73.5, 74.5, 75.5, 76.3, 77, 78.6, 80.2, 81.8, 83.4, 85.2, 87.1, 88.2, 89.5, 90.2, 96.6, 98, 99.7, 101, 102, 102.9, 103.8, 104.3, 104.7, 105, 104.9, 104.8, 104.6, 104.2, 103.5, 102.4, 101.6, 100.5, 99.2, 97.8, 96, 94.5, 92.9, 91.1, 89.6, 87.9, 86.5, 85, 83.6, 82.4, 81.2, 80.2, 79.1, 78.3, 77.5, 76.8, 76.2, 75.8, 75.4, 75.2, 75.1, 75.2, 75.4, 75.8, 76.2, 76.8, 77.5, 78.3, 79.1, 80.2, 81.2, 82.4, 83.6, 85, 86.5, 87.9, 89.6, 91.1, 92.9, 94.5, 96, 97.8, 99.2, 100.5, 101.6, 102.4, 103.5, 104.2, 104.6, 104.8]);
/* a divisa com o lance de cima */
const DV = R([104.9, 105, 104.7, 104.3, 103.8, 102.9, 102, 101, 99.7, 98, 96.6, 94.9, 93.4, 91.5, 89.7, 88, 86.3, 85, 83.7, 82.3, 81.3, 80.2, 79.2, 78.3, 77.6, 77, 76.7, 76.5, 76.2, 76.2, 76.2, 76.3, 76.5, 76.7, 76.8, 77.2, 77.6, 78.3, 79, 79.8, 80.5, 81.7, 82.9, 84.6, 86.3, 88, 89.7, 91.5, 93.4, 94.9, 96.6, 98, 99.7, 101, 102, 102.9, 103.8, 104.3, 104.7, 105, 104.9, 104.8, 104.6, 104.2, 103.5, 102.4, 101.6, 100.5, 99.2, 97.8, 96, 94.5, 92.9, 91.1, 89.6, 87.9, 86.5, 85, 83.6, 82.4, 81.2, 80.2, 79.1, 78.3, 77.5, 76.8, 76.2, 75.8, 75.4, 75.2, 75.1, 75.2, 75.4, 75.8, 76.2, 76.8, 77.5, 78.3, 79.1, 80.2, 81.2, 82.4, 83.6, 85, 86.5, 87.9, 89.6, 91.1, 92.9, 94.5, 96, 97.8, 99.2, 100.5, 101.6, 102.4, 103.5, 104.2, 104.6, 104.8]);
/* o fim do lance de cima e o corredor do alto, debaixo do anel de concreto */
const F = R([132.3, 132.3, 132.2, 131.8, 131.4, 130.6, 129.8, 128.8, 127.7, 126.3, 124.7, 123.1, 121.4, 119.7, 118, 116.4, 114.8, 113.2, 111.6, 110.2, 108.9, 107.7, 106.6, 105.7, 104.9, 104.2, 103.6, 103.2, 103, 102.9, 102.8, 102.8, 103, 103.4, 103.8, 104.3, 105, 105.8, 106.6, 107.6, 108.6, 109.8, 111.2, 112.7, 114.4, 116, 117.6, 119.3, 121, 122.6, 124.2, 125.6, 126.9, 128.1, 129, 129.9, 130.6, 131, 131.4, 131.6, 131.8, 131.8, 131.6, 131.2, 130.8, 130.2, 129.4, 128.4, 127.2, 125.7, 124, 122.4, 120.9, 119.2, 117.5, 115.9, 114.4, 112.8, 111.2, 109.8, 108.6, 107.5, 106.5, 105.7, 105, 104.4, 103.8, 103.4, 103.1, 103, 103, 103, 103.2, 103.4, 103.8, 104.4, 105, 105.9, 106.8, 107.8, 109, 110.2, 111.5, 113, 114.5, 116.1, 117.8, 119.6, 121.3, 122.9, 124.4, 125.9, 127.2, 128.4, 129.4, 130.2, 130.9, 131.5, 131.9, 132.2]);
const TOPO = R(F.raios.map(r => r + 4));
/* OS BLOCOS DE CADEIRAS (as regras do dono, 14/11/2026: cadeira uma a uma; a escada é a faixa de concreto liso entre dois blocos):
   cada lance é cortado em PARES de blocos de largura igual, medida no meio do lance (um trecho só dando a volta inteira esticava
   as cadeiras atrás dos gols, onde o raio é maior). Cada par tem uma escada na divisa e outra no meio, e a boca fica EM CIMA da
   escada do meio, a meia altura do lance: uma boca a cada duas escadas (dono, 15/11/2026, com a foto do lance de cima: "você
   gerou muitas escadas entre os blocos [...] observe o padrão correto de como o vomitório fica no meio da altura das cadeiras e
   da escada"). `PAR` devolve o trecho com o `corredor` na metade do par, pra escada do meio cair no meio. */
const RAD = Math.PI / 180;
const rEm = (c, a) => { const n = c.raios.length, p = (((a % 360) + 360) % 360) / 360 * n, i = Math.floor(p), f = p - i; return c.raios[i % n] * (1 - f) + c.raios[(i + 1) % n] * f; };
const BLOCOS = (de, ate, c0, c1, alvo) => { const out = []; let a = de;
  while (a < ate - 0.01) { const passo = alvo / ((rEm(c0, a) + rEm(c1, a)) / 2 * RAD); let b = a + passo; if (ate - b < passo * 0.5) b = ate; out.push([a, b]); a = b; }
  return out; };
const PAR = ([de, ate], c0, c1, mais) => { const m = (de + ate) / 2, larg = (ate - de) * RAD * (rEm(c0, m) + rEm(c1, m)) / 2;
  return { de, ate, corredor: larg * 0.52, escadaNaBorda: true, ...mais }; };
/* onde ficam as faixas de camarotes e as quatro passagens dos cantos */
const OESTE = [33, 147], LESTE = [222, 318], CANTOS = [38, 142, 214, 326], PASSO = 2.2;
/* o telhado: a abertura, a divisa da membrana com o anel de concreto, a beira de fora dos pórticos */
const ABERTURA = E(85, 54), DIVISA = E(111, 79), BEIRA = E(141, 109);
/* as tendas brancas das entradas, em volta da esplanada */
const TENDA = (u, v, giro) => ({ u, v, w: 20, d: 7, h: 4, cor: '#eeeeea', giro });

export default {
  id: 'estadio-mineirao', alambrado: false, muro: false, nome: 'Mineirão', clubes: ['cruzeiro', 'atletico-mineiro'], norte: 8, vazado: 0.2, folga: 30,
  chao: { cor: '#8f8a80', esplanada: E(172, 140), corEsplanada: '#bdb6a6' },
  campo: { corMargem: '#4f9353' },
  corMureta: '#d9d6cc',
  aneis: [
    /* O LANCE DE BAIXO, com as bocas laranja no meio do lance; nos quatro cantos, a passagem diagonal */
    { dentro: I, fora: CA, h: [2.6, 10], fileiras: 22,
      trechos: [[CANTOS[3] + PASSO - 360, CANTOS[0] - PASSO], [CANTOS[0] + PASSO, CANTOS[1] - PASSO], [CANTOS[1] + PASSO, CANTOS[2] - PASSO], [CANTOS[2] + PASSO, CANTOS[3] - PASSO]]
        .flatMap(([de, ate], k) => [...BLOCOS(de, ate, I, CA, 24).map(x => PAR(x, I, CA, { ...CADEIRA,
          vomitorios: { f: 0.3, cada: 1, larg: 3.4, fundo: 6.5, cor: LARANJA, corParapeito: LARANJA } })),
          { de: ate, ate: CANTOS[k] + PASSO, tipo: 'passagem', alt: 0.3, cor: '#a9a59a' }].filter(t => t.ate > t.de)) },
    /* A FRENTE DAS FAIXAS DE CAMAROTES: no oeste, os camarotes abertos (cadeira atrás de vidro, em cima do muro laranja, com o
       corredor na frente); no leste, a faixa vermelha de vidro escuro. Fora das laterais, nada (a faixa tem largura zero) */
    { dentro: CA, fora: CM, h: [10.6, 11.8], fileiras: 3, corredorFrente: 1.6, vomitorios: false,
      trechos: [
        ...BLOCOS(OESTE[0], OESTE[1], CA, CM, 6).map(([de, ate]) => ({ de, ate, ...CADEIRA, corredor: 0, corEscada: '#cfdedd', escadaNaBorda: true, corMureta: LARANJA })),
        { de: OESTE[1], ate: LESTE[0], tipo: 'vazio' },
        { de: LESTE[0], ate: LESTE[1], fora: DV, h: [10.6, 12.8], corredorFrente: 0, semCadeiras: true, passoFileira: 2, cor: '#3a2a2e', cor2: '#462f33',
          padrao: 'mosaico', mistura: 0.3, corredor: 0, corMureta: '#3a3f45' },
        { de: LESTE[1], ate: OESTE[0] + 360, tipo: 'vazio' }] },
    /* os camarotes fechados do oeste, de vidro escuro, atrás dos abertos */
    { dentro: CM, fora: DV, h: [12, 13], fileiras: 2, corredorFrente: 0, vomitorios: false, semCadeiras: true, passoFileira: 2, corMureta: '#3a3f45',
      trechos: [
        { de: OESTE[0], ate: OESTE[1], cor: '#2b2f34', cor2: '#34393f', padrao: 'mosaico', mistura: 0.3, corredor: 0 },
        { de: OESTE[1], ate: OESTE[0] + 360, tipo: 'vazio' }] },
    /* O LANCE DE CIMA, em blocos de uns 15 m com a escada de concreto entre eles; as bocas vermelhas em escadas alternadas
       (dono, 15/11/2026: "Veja a regra dos vomitórios que apliquei nos demais estádios, vc colocou muitos na superior"), em
       cima da escada, a meia altura (a foto do dono). Sem tribuna aqui: ela fica na faixa de camarotes (201 a 203 no mapa) */
    { dentro: DV, fora: F, h: [13.5, 29], fileiras: 26, corredorFrente: 1.5, corMureta: '#d9d6cc',
      trechos: [
        ...BLOCOS(90, 450, DV, F, 30).map(x => PAR(x, DV, F, { ...CADEIRA,
          vomitorios: { f: 0.42, cada: 1, larg: 3.6, fundo: 3.2, cor: VERMELHO, corParapeito: VERMELHO } }))] },
    /* o corredor do alto, debaixo do anel de concreto */
    { dentro: F, fora: TOPO, trechos: [{ de: 0, ate: 360, tipo: 'passagem', alt: 29, cor: '#cfc9bb' }] }
  ],
  coberturasAnel: [
    /* o anel de concreto com as placas solares entre as nervuras dos 88 pórticos: inteiro por fora das cadeiras, transparente
       por cima delas (a regra do Beira-Rio, dono, 14/11/2026) */
    { fora: BEIRA, dentro: TOPO, h: 33, cai: 0.2, n: 88, cor: '#4b5564', cor2: '#465060', corNervura: '#d6d1c4', larguraNervura: 0.5, opaca: true,
      bordaFora: { larg: 1.2, cor: '#d6d1c4' } },
    { fora: TOPO, dentro: DIVISA, h: 32.8, cai: 0.8, n: 88, cor: '#4b5564', cor2: '#465060', nervuras: false },
    /* a membrana branca, do anel até a abertura */
    { fora: DIVISA, dentro: ABERTURA, h: 32, cai: 3.5, n: 88, cor: '#f3f1ea', cor2: '#eeece4', nervuras: false,
      bordaDentro: { larg: 1.6, cor: '#b9bcbe' } }
  ],
  /* os pórticos de concreto, inclinados, em volta da fachada */
  fachada: { cor: '#c9c3b4', pilares: { n: 88, h: 32, pe: 8, topo: 1, esp: 1.3, fundo: 2.6, cor: '#d6d1c4', contorno: TOPO } },
  blocos: [
    /* os dois telões pendurados na beira da abertura */
    { u: 84, v: 0, w: 2, d: 18, h: 8, y: 20, cor: '#16171a' }, { u: -84, v: 0, w: 2, d: 18, h: 8, y: 20, cor: '#16171a' },
    /* os bancos de teto de vidro, do lado oeste */
    { u: -12, v: 42.5, w: 17, d: 2.6, h: 2.2, cor: '#cfdedd' }, { u: 18, v: 42.5, w: 23, d: 2.6, h: 2.2, cor: '#cfdedd' },
    TENDA(-54, 124, 8), TENDA(62, 120, -8), TENDA(158, 36, 78), TENDA(36, -126, 4), TENDA(-44, -124, -4), TENDA(-156, -38, 80)
  ],
  /* a câmera de uma das fotos do dono: do canto sudeste, olhando o campo e o lado oeste */
  vista: [-70, 14, -45, 45, 5, 28],
  entorno: [
    /* em cima à esquerda (sudoeste): as quadras vermelhas da esplanada */
    { tipo: 'quadra', u: -168, v: 82, w: 22, d: 14, cor: '#c96a5a' }, { tipo: 'quadra', u: -138, v: 92, w: 20, d: 12, cor: '#c96a5a' },
    { tipo: 'quadra', u: -152, v: 108, w: 14, d: 12, cor: '#5f8f6a' },
    /* embaixo à direita (nordeste): a avenida arborizada; embaixo à esquerda, o estacionamento */
    { tipo: 'rua', de: [-10, -205], ate: [240, -62], larg: 24 }, { tipo: 'arvores', u: 150, v: -138, w: 60, d: 16, n: 12 },
    { tipo: 'estacionamento', u: -130, v: -150, w: 110, d: 34, cheio: 0.15 },
    /* em cima (oeste): a avenida */
    { tipo: 'rua', de: [-240, 146], ate: [10, 190], larg: 22 }
  ],
  /* a Máfia Azul (e a Galoucura, quando o Atlético manda) no lance de baixo do fundo sul, o Amarelo; a visitante no lance de
     cima da ponta norte da lateral oeste, o Roxo Superior do portão A; os outros bondes da casa no lance de baixo do leste */
  jogo: { mandante1: [165, 195], mandante2: [255, 285], mandante3: [224, 244], visitante: [44, 64], tunelMandante: 180, tunelVisitante: 54, folgaPM: 5,
          fracao: { mandante1: 0.28, mandante2: 0.15, mandante3: 0.15, visitante1: 0.66, visitante2: 0.74, visitante3: 0.58 },
          torcidas: { mafia_azul: 'mandante1', galoucura: 'mandante1' } }
};
