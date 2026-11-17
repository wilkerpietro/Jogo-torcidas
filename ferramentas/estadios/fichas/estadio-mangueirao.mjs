/* MANGUEIRÃO (Estádio Olímpico do Pará, Jornalista Edgar Proença; Remo e
   Paysandu; Belém; o Águia de Marabá saiu pro Zinho de Oliveira) — no estado de depois da reforma de
   2023. Pelo satélite, por cinco fotos do acervo livre da Wikimedia (duas de
   dentro, de 2025, e uma aérea de 2023) e por cinco quadros de drone que o
   dono mandou (16/11/2026): a lateral com a estrela, a ponta com o telão, a
   virada da lateral pra curva e a fachada vista de fora.
   O campo corre de norte a sul; no quadro o SUL fica à direita e o LESTE em
   cima. Estádio oval de DOIS LANCES em toda a volta, com a pista de
   atletismo vermelha de oito raias em volta do gramado:
   · O LANCE DE BAIXO: nas laterais, cadeira azul nas fileiras da frente e
     vermelha com branca nas de cima; nas pontas ele encolhe pra quatro
     fileiras vermelhas e brancas atrás da mureta dos anúncios.
   · A FAIXA DO MEIO: os camarotes de concreto branco nas laterais; nas
     pontas, a parede de vidro cinza.
   · O LANCE DE CIMA: fundo nas laterais (umas trinta fileiras), raso nas
     pontas (umas doze), perdendo fileiras bloco a bloco ao longo da lateral e
     da curva, com a altura acompanhando a fundura. Nas laterais,
     o MOSAICO DA BANDEIRA DO PARÁ nas cadeiras: vermelho em cima e azul
     embaixo, com a faixa branca atravessando em diagonal e a estrela azul no
     meio; pra fora do meio a pintura vira três camadas salpicadas (vermelho,
     branco, azul), que seguem pelas curvas e pelas pontas. As bocas de acesso
     ficam a um quarto da altura, uma a cada dois blocos.
   · A COBERTURA é um anel só de laje branca, que dá a volta inteira e cobre
     os dois lances (do alto só se vê uma faixa estreita de arquibancada): a
     beira de fora corre na mesma altura e a de dentro sobe em arco no meio de
     cada lateral e desce nas pontas. Em cada divisa, a aleta branca em cima
     da coluna fina que vai até o chão; nas laterais, as treliças de aço por
     cima; as placas solares; e o TELÃO em cima da beira de cada ponta.
   · POR FORA, três andares de GALERIA ABERTA atrás do lance de cima (a beira
     branca de cada laje, o vão escuro entre elas, os pilares recuados), as
     colunas brancas finas da cobertura na frente, o anel largo da rampa
     embaixo, o nome do
     estádio na fachada do OESTE, e o anel de concreto da esplanada com as
     duas marquises brancas das entradas (leste e oeste).
   LADO A E LADO B: o Lado A é o do leste (em cima), o da torcida do Remo; o
   Lado B é o do oeste (embaixo), o da torcida do Paysandu, do lado da Via
   Transmangueirão. A reportagem de venda de ingressos põe a visitante no B4.
   O QUE É ESTIMADO OU ESCOLHA MINHA: todas as alturas; a fundura de cada
   lance (medi a volta de fora e a abertura da cobertura no satélite, e
   reparti pelas fileiras contadas nas fotos); a estrela nos DOIS lados (só
   vi a de um); em que ponta do Lado B fica o B4 (pus na do sul); o lugar do
   3º escalão (a ponta do norte). Não achei mapa de setores desenhado.
   O MURO DO TERRENO não entra: o terreno é o estacionamento inteiro, muito
   além do quadro; fica pros arredores de verdade (o Mangueirão é dos
   diferenciados). */
const RAD = Math.PI / 180;
/* os contornos: ovais de ponta em meio-círculo (o raio é a meia largura) */
const PISTA_D = { a: 78.7, b: 36.5, r: 36.5 }, PISTA_F = { a: 88.5, b: 46.3, r: 46.3 };
const W = { a: 99, b: 52, r: 52 };        /* a mureta: a frente do lance de baixo */
const L = { a: 103, b: 64, r: 64 };       /* o fundo do lance de baixo (12 m nas laterais, 4 nas pontas) */
const BN = { a: 108, b: 69, r: 69 };      /* a faixa dos camarotes */
/* O FUNDO DO LANCE DE CIMA É UM ARCO (dono, 16/11/2026, com duas fotos de dentro: "veja como a arquibancada tem uma variação
   maior de degraus quando chega atrás do gol"): a frente dele corre reta ao longo da lateral, mas o fundo é uma elipse — 26 m
   de fundura no meio da lateral, 21 onde a reta acaba, 14 no canto, 10 atrás do gol. Na primeira versão o fundo era um oval de
   lado reto, e o lance tinha a mesma altura a lateral inteira. */
const U = { a: 118, b: 95, forma: 'elipse' };
const GAL = { a: 124.5, b: 108, r: 108 };  /* a beira das galerias de fora, atrás do lance de cima */
const DECK = { a: 139, b: 123, r: 123 };   /* a beira do anel da rampa, o primeiro andar, que passa das colunas */
const TETO_D = { a: 99.5, b: 50.5, r: 50.5 }, TETO_F = { a: 128, b: 112, r: 112 };
const VERM = '#c22a2e', AZUL = '#1f3f93', BRANCO = '#f1f1ec', CONC = '#d2cfc5', CONC2 = '#c6c3b9';
/* a estrela de cinco pontas (a ponta pra cima), em metros a partir do meio dela */
const ESTRELA = Array.from({ length: 10 }, (_, k) => { const r = k % 2 ? 5.3 : 12.5, a = (90 + 36 * k) * RAD; return [r * Math.cos(a), r * Math.sin(a)]; });
const naEstrela = (x, y) => { let c = false; for (let i = 0, j = 9; i < 10; j = i++) { const [xi, yi] = ESTRELA[i], [xj, yj] = ESTRELA[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const reta = (x, pts) => { if (x <= pts[0][0]) return pts[0][1]; for (let k = 1; k < pts.length; k++) if (x <= pts[k][0]) { const [x0, y0] = pts[k - 1], [x1, y1] = pts[k]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); } return pts[pts.length - 1][1]; };
/* A PINTURA DO LANCE DE CIMA. `X`: metros ao longo da lateral, a partir do meio (negativo à esquerda de quem olha do campo);
   `y`: de 0 (frente) a 1 (fundo); `fundo`: a fundura do lance em metros. Acima de `yv` é vermelho, abaixo de `ya` é azul, o
   resto é branco; no meio as duas divisas viram a diagonal da faixa branca da bandeira, e a estrela fica em cima dela. */
const YV = [[-48, 0.60], [-14, 1.04], [9, 1.0], [44, 0.58]], YA = [[-44, 0.44], [-6, 0.0], [30, 0.0], [52, 0.42]];
const bandeira = (X, y, rnd, fundo) => {
  if (Math.abs(X) < 14 && naEstrela(X, (y - 0.5) * fundo)) return AZUL;
  const yv = reta(X, YV), ya = reta(X, YA), salp = Math.max(0.1, Math.min(1, (Math.abs(X) - 24) / 24));
  if (y > yv) return rnd() < Math.max(0, 1 - (y - yv) / 0.24) * 0.8 * salp ? BRANCO : VERM;
  if (y < ya) return rnd() < Math.max(0, 1 - (ya - y) / 0.2) * 0.75 * salp ? BRANCO : AZUL;
  if (yv - y < 0.1 && rnd() < 0.35 * salp) return VERM;
  if (y - ya < 0.1 && rnd() < 0.35 * salp) return AZUL;
  return BRANCO;
};
const BASE = { cor: AZUL, cor2: BRANCO, paredeAtras: true, corFachada: CONC, corMureta: '#e4e2da', parapeito: 1.1, corEscada: '#bdbab0' };
/* O LANCE DE CIMA EM BLOCOS: sessenta blocos de uns dez metros em volta do estádio, cada um um trecho com a escada na divisa e
   COM O NÚMERO DE FILEIRAS DELE (o gerador conta as fileiras pela fundura do meio do trecho): umas trinta no meio da lateral,
   caindo bloco a bloco até umas doze atrás do gol. As divisas saem andando pelo meio do lance em passos iguais, a partir do
   meio da lateral, onde a escada corta a estrela. */
const raioOval = (ang, c) => { const co = Math.abs(Math.cos(ang * RAD)), si = Math.abs(Math.sin(ang * RAD)), k = c.a - c.r; if (si > 1e-6 && c.b / si * co <= k) return c.b / si; return k * co + Math.sqrt(c.r * c.r - k * k * si * si); };
const raioElipse = (ang, c) => 1 / Math.sqrt(Math.pow(Math.cos(ang * RAD) / c.a, 2) + Math.pow(Math.sin(ang * RAD) / c.b, 2));
const meioDoLance = ang => (raioOval(ang, BN) + raioElipse(ang, U)) / 2, funduraEm = ang => raioElipse(ang, U) - raioOval(ang, BN);
const DIVISAS = (() => { const N = 15, ac = [0]; for (let a = 0.05; a <= 90.0001; a += 0.05) ac.push(ac[ac.length - 1] + meioDoLance(a - 0.025) * 0.05 * RAD);
  const tot = ac[ac.length - 1], q = [0]; for (let k = 1; k < N; k++) { const alvo = tot * k / N; let i = 0; while (ac[i] < alvo) i++; q.push(+(i * 0.05).toFixed(2)); } q.push(90);
  /* (um quadrante, espelhado nos outros três) */
  return [...q, ...q.slice(0, -1).reverse().map(a => 180 - a), ...q.slice(1).map(a => 180 + a), ...q.slice(0, -1).reverse().map(a => 360 - a)]; })();
/* onde um ponto do lance cai ao longo da lateral, em metros a partir do meio dela (negativo à esquerda de quem olha do campo) */
const aoLongo = ang => meioDoLance(ang) * Math.cos(ang * RAD) * (Math.sin(ang * RAD) >= 0 ? 1 : -1);
const BLOCOS_DE_CIMA = DIVISAS.slice(0, -1).map((de, k) => { const ate = DIVISAS[k + 1], Xe = aoLongo(ate - 0.01), Xd = aoLongo(de + 0.01), fundo = funduraEm((de + ate) / 2);
  return { ...BASE, de, ate, corredor: 0, escadaNaBorda: true,
    /* (uma boca a cada duas divisas, a um quinto da altura; meia de cada lado da escada) */
    vomitorios: fundo > 11 ? { f: 0.2, larg: 4.2, fundo: 4.2, cor: '#2c2d2f', em: [k % 2 ? 0 : 1] } : false,
    pinta: (x, y, rnd) => bandeira(Xe + (Xd - Xe) * x, y, rnd, fundo) }; });
/* o lance de baixo: azul na frente, vermelho e branco em cima; nas pontas, só o vermelho e branco */
const BAIXO_LADO = { ...BASE, vomitorios: false, paredeAtras: false, corredor: 12, pinta: (x, y, rnd) => y < 0.47 ? (rnd() < 0.12 ? BRANCO : AZUL) : (rnd() < 0.42 ? BRANCO : VERM) };
const BAIXO_PONTA = { ...BASE, vomitorios: false, paredeAtras: false, corredor: 14, pinta: (x, y, rnd) => rnd() < 0.45 ? BRANCO : VERM };
/* as divisas, vistas do meio do campo: onde a lateral reta acaba (a 62 m do meio, no meio da fundura do lance de cima) e onde
   a curva vira ponta */
const D1 = 53, D2 = 127, P1 = 22;
/* A COBERTURA (dono, 16/11/2026, com a foto de fora: "corrija a cobertura"; a primeira versão eram quatro lajes soltas,
   com um degrau de nove metros entre a das laterais e a das pontas). É UM ANEL SÓ, de laje branca: a beira de fora corre
   na mesma altura a volta inteira, e a de dentro sobe em arco no meio de cada lateral e desce nas pontas, em sela. Em cada
   divisa, a ALETA branca que sobe até passar da beira de fora, em cima da COLUNA fina que desce até o chão. Nas laterais,
   a beira da frente mais clara e as três TRELIÇAS de aço deitadas por cima da laje; as placas solares escuras em volta. */
const ALTURAS = ang => { const s = Math.abs(Math.sin(ang * RAD)); return [26, 21.5 + 11.5 * Math.pow(s, 1.5)]; };
const LAJE = { dentro: TETO_D, fora: TETO_F, alturas: ALTURAS, h: 26, cor: '#eceae3', cor2: '#e2e0d8', corNervura: '#f6f6f2', larguraNervura: 0.3, beiral: [1.8, 1.4], corBeiral: '#f1f0ea',
  aletas: { h: 3.6, de: 0.22, esp: 0.5, cor: '#f6f6f2', bico: 0.05, base: 5 } };
const TETO = (de, ate, lateral) => lateral
  ? { ...LAJE, de, ate, n: 14, bordaDentro: { larg: 10, cor: '#f8f8f5' }, aneis: [{ f: 0.5, larg: 4.5, cor: '#55627a' }], trelicas: { angs: [(de + ate) / 2 - 21, (de + ate) / 2, (de + ate) / 2 + 21], esp: 1.5, alt: 1.3, cor: '#e9ebec' } }
  : { ...LAJE, de, ate, n: 12, aneis: [{ f: 0.42, larg: 5, cor: '#4a5870' }] };
/* a esplanada: o anel de concreto em volta, com o estacionamento por dentro e por fora */
const anelPts = (a, b, n = 72) => Array.from({ length: n }, (_, k) => [a * Math.cos(k * 360 / n * RAD), b * Math.sin(k * 360 / n * RAD)]);

export default {
  id: 'estadio-mangueirao', nome: 'Mangueirão', clubes: ['remo', 'paysandu'], norte: 178.2, vazado: 0.2, folga: 34,
  chao: { cor: '#63666a' },
  vista: [-40, 40, -52, 60, 14, 62],
  campo: { corMargem: '#4c9a4e', pista: { dentro: PISTA_D, fora: PISTA_F, cor: '#b04a3e', raias: 8 } },
  corMureta: '#e4e2da', corAlambrado: '#9aa0a4', alambrado: false, muro: false,
  aneis: [
    /* o LANCE DE BAIXO */
    { dentro: W, fora: L, h: [1.9, 6.0], corredorFrente: 0.8, passoFileira: 0.85,
      trechos: [
        { ...BAIXO_PONTA, de: -P1, ate: P1, h: [3.4, 6.0] },
        { ...BAIXO_LADO, de: P1, ate: 180 - P1 },
        { ...BAIXO_PONTA, de: 180 - P1, ate: 180 + P1, h: [3.4, 6.0] },
        { ...BAIXO_LADO, de: 180 + P1, ate: 360 - P1 }
      ] },
    /* a FAIXA DOS CAMAROTES (concreto branco nas laterais, vidro cinza nas pontas) */
    { dentro: L, fora: BN, h: [6.4, 6.4], corredorFrente: 0,
      trechos: [
        { de: -P1, ate: P1, tipo: 'passagem', alt: 6.4, cor: '#8f9aa6' },
        { de: P1, ate: 180 - P1, tipo: 'passagem', alt: 6.4, cor: '#e3e1d9' },
        { de: 180 - P1, ate: 180 + P1, tipo: 'passagem', alt: 6.4, cor: '#8f9aa6' },
        { de: 180 + P1, ate: 360 - P1, tipo: 'passagem', alt: 6.4, cor: '#e3e1d9' }
      ] },
    /* o LANCE DE CIMA, com a altura acompanhando a fundura */
    { dentro: BN, fora: U, h: [9.4, 27], inclinacao: 0.68, corredorFrente: 1.2, passoFileira: 0.85,
      trechos: BLOCOS_DE_CIMA },
    /* as GALERIAS de fora, atrás do lance de cima: o piso alto por onde se chega às bocas, aberto até a cobertura, com as
       colunas da cobertura na beira (na foto de fora do dono, os três andares de galeria atrás das colunas) */
    { dentro: U, fora: GAL, h: [14, 14], corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', alt: 14, cor: '#cdcabf', semParede: true }] }
  ],
  coberturasAnel: [TETO(D1 - 12, D2 + 12, true), TETO(D1 + 168, D2 + 192, true), TETO(D2 + 12 - 180, D1 - 12, false), TETO(D2 + 12, D1 + 168, false)],
  /* A FACHADA (dono, 16/11/2026, com duas fotos de fora: "veja como se constrói a fachada do estádio, voce fez só um bloco
     liso"): três andares de galeria abertos atrás das colunas da cobertura — a beira branca de cada laje, o vão escuro entre
     elas, os pilares recuados — e, embaixo, o anel largo da rampa, que passa das colunas e é aberto por baixo. */
  fachada: { cor: CONC2, galerias: { dentro: U, fora: GAL, pisos: [5, 9.5], bordas: [14], topo: 14, esp: 0.5, guarda: 1.1, cor: '#efeee8', corPiso: '#cdcabf', corFundo: '#45484c',
    pilares: { n: 52, recuo: 3.2, larg: 1.7, h: 14, cor: '#d6d3c9' }, deck: { fora: DECK, h: 5, guarda: 1.1, cor: '#eceae3', corPiso: '#d4d1c6', corVao: '#3c3e41' } } },
  blocos: [
    /* os dois TELÕES, em cima da beira da cobertura das pontas */
    { u: 100.5, v: 0, w: 1.2, d: 22, h: 9, y: 21.4, cor: '#0f1114' }, { u: -100.5, v: 0, w: 1.2, d: 22, h: 9, y: 21.4, cor: '#0f1114' },
    /* os túneis dos vestiários, no meio de cada lateral, e os bancos de reserva */
    { u: 0, v: 53.5, w: 5, d: 5, h: 2.6, cor: '#e9ebee' }, { u: 0, v: -53.5, w: 5, d: 5, h: 2.6, cor: '#e9ebee' },
    { u: -18, v: 48.6, w: 10, d: 1.8, h: 1.9, cor: '#dfe4ea' }, { u: 18, v: 48.6, w: 10, d: 1.8, h: 1.9, cor: '#dfe4ea' },
    /* o NOME DO ESTÁDIO na fachada do oeste (embaixo) */
    { u: 0, v: -108.6, w: 0.6, d: 46, h: 2.0, y: 13.4, cor: '#2f6fb3', texto: 'ESTÁDIO OLÍMPICO DO PARÁ', corTexto: '#ffffff', textoFace: true, giro: -90 },
    { u: 0, v: -108.6, w: 0.6, d: 40, h: 1.7, y: 8.95, cor: '#e9e8e2', texto: 'JORNALISTA  EDGAR  PROENÇA', corTexto: '#2b2f36', textoFace: true, giro: -90 },
    /* as duas marquises brancas das entradas, no anel da esplanada */
    { u: 0, v: 166, w: 20, d: 22, h: 0.5, y: 6, cor: '#f3f3ef' }, { u: 0, v: -166, w: 20, d: 22, h: 0.5, y: 6, cor: '#f3f3ef' }
  ],
  entorno: [
    /* o anel de concreto da esplanada */
    { tipo: 'piso', pts: anelPts(186, 180), furo: anelPts(160, 153), cor: '#cdc6b6', cor2: '#c4bdad', padrao: 'liso', y: 0.06 },
    { tipo: 'arvores', u: -170, v: 170, w: 30, d: 16, n: 6 }, { tipo: 'arvores', u: 172, v: -172, w: 26, d: 16, n: 5 }
  ],
  jogo: { mandante1: [134, 174], mandante2: [81, 121], mandante3: [49, 79], visitante: [274, 309], tunelMandante: 90, tunelVisitante: 318, folgaPM: 3,
          fracao: { mandante1: 0.52, mandante2: 0.52, mandante3: 0.55, visitante1: 0.53, visitante2: 0.53, visitante3: 0.53 },
          torcidas: { remista: 'mandante1', pavilhao_6: 'mandante3', terror_bicolor: 'mandante2', faccao_jovem_paysandu: 'mandante3' } }
};
