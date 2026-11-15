/* ESTÁDIO DO CAFÉ (Jacy Scaff — Londrina) — pelo satélite e pelas fotos de
   referência (15/11/2026); o meio do campo foi tirado dos dois gols. O campo
   é norte-sul; no quadro o NORTE fica à DIREITA e o OESTE (a coberta) em
   cima. O estádio é ENTERRADO no morro: uma FERRADURA de degrau de cimento
   em volta da pista de terra, aberta na ponta sul (à esquerda), onde ficam
   o portão e o prédio da entrada.
   A ARQUIBANCADA É UMA SÓ (dono, 15/11/2026: "a arquibancada tem formato de
   ferradura"; "não tem dois anéis, tem um só"): um lance único e contínuo,
   da ponta sudoeste, pelo lado oeste, pela curva norte e pelo lado leste,
   até a ponta sudeste. A COBERTA não é um bloco à parte: é o trecho oeste
   dessa mesma ferradura, com cadeira e com o telhado em cima.
   OS ACESSOS: não há boca de vomitório. Entra-se POR CIMA, pelo corredor
   largo que dá a volta no alto da ferradura, no nível da rua, e desce-se
   pelas escadas.
   · EM CIMA (oeste), o trecho COBERTO: cadeira em blocos vermelhos e azuis,
     debaixo do telhado cinza em arco; as fileiras da frente descobertas;
     duas torres de refletor atrás.
   · O RESTO da ferradura (a curva norte, à direita, e o lado leste,
     embaixo): degrau de cimento cru e escurecido (a pintura azul das fotos
     antigas já saiu), com as escadas mais claras. No corredor do alto, os
     barracões dos bares.
   · Entre a pista e a arquibancada sobra uma faixa de grama; do lado da
     coberta ficam os bancos de reserva (os túneis brancos). */
const CIM = '#857d70', CIM2 = '#766f63';                /* o degrau de cimento cru */
const PISO = '#a39c8d', ESCADA = '#c2bbab';
const VM = '#d2433f', AZ = '#2f5fc4';
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* os contornos da ferradura (as retas de u = -30,5 a 30,5): a beira de dentro, o fim do lance e o corredor do alto (6 m).
   O lado leste e o oeste são mais fundos (40 m de lance) que a curva norte (34 m). */
const I = { a: 93, b: 62.5, r: 62.5 }, L = { a: 127, b: 103, r: 96.5 }, FORA = { a: 133, b: 109, r: 102.5 };
/* a direção (vista do centro do canto) de cada ponto da ferradura: a ponta sudeste (embaixo à esquerda), onde o telhado
   começa (em cima à direita) e a ponta sudoeste, onde o telhado e a ferradura acabam (em cima à esquerda) */
const SE = 253, TETO = 59.5, SO = 101;
const fim = (r, fi, cv = 0) => A((Math.cos(fi * RAD) >= 0 ? 30.5 : -30.5) + r * Math.cos(fi * RAD), (Math.sin(fi * RAD) >= 0 ? cv : -cv) + r * Math.sin(fi * RAD));
const trecho = (r, cv, f0, f1, mais) => ({ de: fim(r, f0, cv) - (f0 > 180 ? 360 : 0), ate: fim(r, f1, cv), ...mais });
const DEGRAU = { cor: CIM, cor2: CIM2, padrao: 'mosaico', mistura: 0.4, semCadeiras: true, corredor: 26, corEscada: ESCADA, vomitorios: false };
/* o trecho coberto: seis blocos de cadeira, em xadrez de vermelho e azul (duas fileiras de blocos) */
const COBERTO = { cor: VM, cor2: AZ, padrao: 'blocos', bloco: 10.3, blocoFileiras: 11, corredor: 17.5, corEscada: '#d9d9d4', vomitorios: false };
/* os barracões dos bares no corredor do alto */
const BAR = (u, v, giro) => ({ u, v, w: 11, d: 4, h: 3, y: 17.3, cor: '#3b4a5c', giro });
/* os bancos de reserva: os túneis brancos na faixa de grama, do lado da coberta */
const BANCO = (u, w) => ({ u, v: 51.5, w, d: 3.4, h: 2.4, cor: '#eef0ee' });

export default {
  id: 'estadio-do-cafe', nome: 'Estádio do Café', clubes: ['londrina'], norte: 355.6, vazado: 0.4, folga: 16,
  corEscada: ESCADA,
  chao: { cor: '#7f8a63' },
  campo: { corMargem: '#55934f', pista: { dentro: { a: 78.5, b: 40, r: 40 }, fora: { a: 86.5, b: 47.5, r: 47.5 }, cor: '#7a6a5a', raias: 0 } },
  corMureta: '#2f61b3',
  aneis: [
    /* O LANCE, um só: o cimento cru da ponta sudeste até o começo do telhado, e as cadeiras do trecho coberto até a ponta
       sudoeste; à esquerda, o caminho ao pé do muro na ponta aberta */
    { dentro: I, fora: L, reto: true, h: [1.5, 17], fileiras: 20,
      trechos: [
        trecho(62.5, 0, SE, TETO, DEGRAU), trecho(62.5, 0, TETO, SO, COBERTO),
        { de: fim(62.5, SO), ate: fim(62.5, SE), tipo: 'passagem', cor: '#8f8b80', fora: { a: 98, b: 67.5, r: 67.5 } }
      ] },
    /* O CORREDOR DO ALTO, no nível da rua: é por ele que se entra */
    { dentro: L, fora: FORA, reto: true, h: [17.2, 17.2], fileiras: 2, corredorFrente: 0,
      trechos: [trecho(96.5, 6.5, SE, SO, { tipo: 'passagem', alt: 17.2, cor: PISO })] }
  ],
  /* o telhado cinza da coberta, em arco */
  telhados: [{ y: 22, h: 0.6, cor: '#b9bbbc', pontos: [[-42.5, 68.3], [-20, 69.3], [0, 69.5], [20, 68.8], [40, 67], [68.3, 61.3], [82, 93.3], [62, 99.5], [40, 104], [20, 106.5], [0, 107.5], [-25, 105.5], [-49, 101.7]] }],
  /* o estádio é enterrado: por fora é o barranco */
  fachada: { cor: '#6f8a55' },
  refletores: [[-31, 111, 42], [38, 111, 42], [2, -113, 42], [34, -114, 42]],
  blocos: [
    BAR(55, -106, 0), BAR(-38, -106, 0), BAR(122, -57, 62),
    BANCO(-27, 6), BANCO(-14, 11), BANCO(-1, 4), BANCO(12, 11), BANCO(30, 6),
    /* a ponta sul (à esquerda): o prédio da entrada, o barracão e o placar */
    { u: -106, v: 3, w: 15, d: 44, h: 6, cor: '#c9cbc7' }, { u: -103, v: -50, w: 8, d: 26, h: 4, cor: '#8a8880', giro: -25 },
    { u: -90, v: -6, w: 1, d: 12, h: 5, y: 2, cor: '#17181b' },
    /* os gols de treino e a lona, atrás do gol do sul */
    { u: -59, v: -1, w: 0.6, d: 44, h: 0.3, cor: '#6b4a3a' }
  ],
  entorno: [
    /* à esquerda (sul): a rua, o pátio e as árvores */
    { tipo: 'rua', de: [-132, -200], ate: [-132, 200], larg: 11 },
    { tipo: 'arvores', u: -96, v: -98, w: 80, d: 50, n: 44 }, { tipo: 'arvores', u: -78, v: 98, w: 60, d: 50, n: 34 },
    { tipo: 'estacionamento', u: -118, v: 62, w: 20, d: 36, cheio: 0.2 },
    /* à direita e embaixo (norte e leste): o kartódromo e o saibro */
    { tipo: 'rua', de: [60, -128], ate: [150, -92], larg: 9 }, { tipo: 'rua', de: [150, -92], ate: [150, 40], larg: 9 },
    { tipo: 'grama', u: 132, v: 108, w: 34, d: 34, cor: '#c9805c' }, { tipo: 'arvores', u: 112, v: -104, w: 40, d: 20, n: 10 }
  ],
  /* a Falange Azul no meio do lado leste e a visitante na ponta sudeste da ferradura (escolhas minhas, sem fonte); os outros
     bondes da casa na curva norte e na coberta */
  jogo: { mandante1: [266, 292], mandante2: [-22, 14], mandante3: [78, 102], visitante: [241, 256], tunelMandante: 279, tunelVisitante: 248, folgaPM: 4,
          fracao: { mandante1: 0.3, mandante2: 0.3, mandante3: 0.4, visitante1: 0.3, visitante2: 0.3, visitante3: 0.3 },
          torcidas: { falange_azul: 'mandante1' } }
};
