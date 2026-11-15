/* SANTA CRUZ (Botafogo-SP, Ribeirão Preto) — pelo satélite e pelas fotos de
   referência (15/11/2026); o meio do campo foi tirado do círculo central. O
   campo é norte-sul; no quadro o OESTE (a coberta velha, de teto marrom)
   fica em cima e o NORTE à direita. NÃO achei mapa de setores do clube.
   Bacia oval grande, com a pista de asfalto em volta do gramado:
   · EMBAIXO (leste), a arquibancada NOVA: cadeira em mosaico vermelho e
     branco, do canto sudeste ao nordeste; no meio, por cima do fundo, o
     andar das cadeiras vermelhas e dos camarotes debaixo do telhado branco
     em arco, que passa pra trás por cima do prédio.
   · EM CIMA (oeste), a coberta VELHA: o telhado marrom em leque de 13
     panos por cima do fundo da arquibancada; a frente fica descoberta.
   · À ESQUERDA (sul), a curva de degrau de cimento claro (24 m de fundo).
   · À DIREITA (norte), a curva de degrau de cimento escurecido, mais funda
     (uns 32 m), com a cabine de teto cinza no alto do canto.
   · As escadas amarelo-claras, uma a uma, onde o satélite mostra.
   As fotos antigas mostram a bacia toda pintada em faixas vermelhas,
   brancas e pretas, com o escudo; hoje as curvas estão no cimento. Vale o
   satélite e a aérea recente.
   OS ACESSOS: nenhuma boca de vomitório aparece; ficou sem. */
const AM = '#e6dc7a';
const RAD = Math.PI / 180;
const E = (a, b, mais) => ({ a, b, forma: 'elipse', ...mais });
/* a grama e a pista; a beira de dentro da arquibancada; o fundo (mais fundo no norte que no sul); o meio do lado leste */
const GRAMA = { a: 76, b: 37, r: 37 }, PISTA = { a: 86, b: 46, r: 46 };
const I = E(90, 61), F = E(119, 100, { cu: 3 }), MEIO = E(112, 83);
const DEG = (de, ate, cor, cor2, mais) => ({ de, ate, cor, cor2, padrao: 'mosaico', mistura: 0.35, semCadeiras: true, corredor: 0, escadaNaBorda: true, corEscada: AM, vomitorios: false, ...mais });
const CAD = (de, ate, mais) => ({ de, ate, cor: '#c8463f', cor2: '#eceae4', padrao: 'mosaico', mistura: 0.48, corredor: 0, escadaNaBorda: true, corEscada: AM, vomitorios: false, ...mais });
const trechos = (angs, f) => angs.slice(0, -1).map((de, i) => f(de, angs[i + 1]));
/* a curva norte (cimento escurecido), a coberta velha, a curva sul (cimento claro) e a arquibancada nova, escada a escada */
const NORTE = trechos([-15.5, -0.5, 17.5, 33.8, 51.5], (de, ate) => DEG(de, ate, '#8f8577', '#857b6e'));
const VELHA = trechos([51.5, 65.4, 77, 90, 102.5, 113.3, 121], (de, ate) => DEG(de, ate, '#8a8076', '#7d746a', { paredeAtras: true, corFachada: '#b9b0a0' }));
const SUL = trechos([121, 137, 163, 179.5, 197], (de, ate) => DEG(de, ate, '#b9ab90', '#ad9f85'));
const NOVA = [...trechos([197, 209, 229.5], (de, ate) => CAD(de, ate)), ...trechos([229.5, 256.4, 283.2, 312.5], (de, ate) => CAD(de, ate, { fora: MEIO })), ...trechos([312.5, 329.5, 344.5], (de, ate) => CAD(de, ate))];
/* um ponto de uma elipse, pelo ângulo visto do centro */
const naElipse = (a, b, ang, mais = 0) => { const c = Math.cos(ang * RAD), s = Math.sin(ang * RAD), r = a * b / Math.hypot(b * c, a * s) + mais; return [r * c, r * s]; };
/* O TELHADO MARROM da coberta velha: 13 panos em leque */
const MARROM = Array.from({ length: 13 }, (_, i) => { const a0 = 51.5 + i * 69.5 / 13 + 0.25, a1 = 51.5 + (i + 1) * 69.5 / 13 - 0.25;
  return { y: 20 + (i % 2) * 0.25, h: 0.5, cor: i % 2 ? '#7d4236' : '#8a4a3c', pontos: [naElipse(94, 77, a0), naElipse(94, 77, a1), naElipse(108, 102.5, a1), naElipse(108, 102.5, a0)] }; });
/* O TELHADO BRANCO da nova: a frente em arco, por cima do meio do lance, e o fundo por cima do prédio */
const BRANCO = { y: 24, h: 0.7, cor: '#e6e6e2', pontos: [...Array.from({ length: 11 }, (_, i) => naElipse(112, 83, 234 + i * 7.2, 1)), [70, -108], [72, -127], [-62, -127], [-60, -108]] };
/* as barracas de teto vermelho ao pé do alambrado, do lado da nova */
const BARRACA = (u, v, w, giro) => ({ u, v, w, d: 4, h: 2.5, cor: '#d9705f', giro });

export default {
  id: 'estadio-santa-cruz', nome: 'Santa Cruz', clubes: ['botafogo-sp'], norte: 356.6, vazado: 0.4, folga: 30,
  corEscada: AM,
  chao: { cor: '#7d7a72' },
  campo: { corMargem: '#55934f', pista: { dentro: GRAMA, fora: PISTA, cor: '#4f4f52', raias: 0 } },
  corMureta: '#e3e1da',
  aneis: [
    /* entre a pista e a arquibancada: a grama do lado da velha, o piso de concreto do lado da nova */
    { dentro: PISTA, fora: I, h: [0.2, 0.2], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: -25, ate: 25, tipo: 'passagem', cor: '#8f8b80' }, { de: 25, ate: 155, tipo: 'passagem', cor: '#5f9a55' }, { de: 155, ate: 205, tipo: 'passagem', cor: '#8f8b80' },
                { de: 205, ate: 335, tipo: 'passagem', cor: '#b9b4a6' }] },
    /* A BACIA; a altura acompanha a fundura */
    { dentro: I, fora: F, h: [1.5, 14], inclinacao: 0.42, fileiras: 30, trechos: [...NORTE, ...VELHA, ...SUL, ...NOVA] },
    /* O ANDAR DE CIMA da nova, debaixo do telhado branco: as cadeiras vermelhas e os camarotes */
    { dentro: MEIO, fora: F, h: [12.5, 19.5], fileiras: 14, corredorFrente: 0, corMureta: '#c8463f',
      trechos: [{ de: 229.5, ate: 312.5, cor: '#c23a36', cor2: '#b33230', padrao: 'mosaico', mistura: 0.3, corredor: 16, corEscada: AM, vomitorios: false, paredeAtras: true, corFachada: '#e6e6e2' }] }
  ],
  telhados: [...MARROM, BRANCO],
  fachada: { cor: '#c9bfae' },
  refletores: [[-104, 62, 40], [108, 62, 40], [-100, -78, 40], [112, -76, 40]],
  blocos: [
    /* o prédio da nova, atrás do lance, debaixo do telhado branco */
    { u: 4, v: -113, w: 124, d: 22, h: 22, cor: '#dcdcd6' },
    /* a cabine de teto cinza no alto do canto noroeste */
    { u: 83, v: 73, w: 20, d: 18, h: 0.5, y: 17, cor: '#8f979c', giro: 40, cobertura: true },
    /* os bancos de reserva e o escudo, do lado da velha; o teto escuro do túnel, do lado da nova */
    { u: -27.5, v: 41, w: 15, d: 7, h: 0.4, cor: '#c9c4b6' }, { u: -13, v: 41, w: 13, d: 7, h: 2.2, cor: '#4fa06a' }, { u: 0, v: 41, w: 13, d: 7, h: 0.4, cor: '#e9e6dc' },
    { u: 13.5, v: 41, w: 13, d: 7, h: 2.2, cor: '#4fa06a' }, { u: 24, v: 41, w: 8, d: 7, h: 0.4, cor: '#c9c4b6' },
    { u: 0, v: -43.5, w: 22, d: 11, h: 2.6, cor: '#4a4a4c' },
    BARRACA(-88, -5, 11, 90), BARRACA(-78, -28, 28, -54), BARRACA(-61.7, -45.3, 16, -34.6), BARRACA(87, -8, 13, 90), BARRACA(74, -32.5, 28, 49.8), BARRACA(58, -48, 16, 27.9),
    /* os bares de teto claro por fora das duas curvas */
    { u: -122, v: -2, w: 5, d: 34, h: 3, cor: '#d9d3c4' }, { u: 129, v: 12, w: 5, d: 30, h: 3, cor: '#d9d3c4' }, { u: 126, v: -42, w: 5, d: 28, h: 3, cor: '#d9d3c4', giro: -18 }
  ],
  entorno: [
    /* a mata do lado sul e do oeste; a avenida do lado nordeste; os pátios */
    { tipo: 'arvores', u: -150, v: 40, w: 30, d: 160, n: 40 }, { tipo: 'arvores', u: -40, v: 122, w: 110, d: 16, n: 22 },
    { tipo: 'rua', de: [-160, -150], ate: [170, -150], larg: 12 }, { tipo: 'rua', de: [150, -150], ate: [150, 130], larg: 12 },
    { tipo: 'estacionamento', u: 40, v: 122, w: 60, d: 14, cheio: 0.3 }, { tipo: 'arvores', u: 132, v: 96, w: 20, d: 30, n: 8 },
    { tipo: 'arvores', u: -132, v: -110, w: 30, d: 30, n: 10 }, { tipo: 'arvores', u: 120, v: -122, w: 30, d: 16, n: 8 }
  ],
  /* (escolhas minhas, sem fonte: não achei mapa de setores) a Fiel Força Tricolor na curva sul e a visitante na curva norte;
     os outros bondes da casa na arquibancada nova e debaixo da coberta velha */
  jogo: { mandante1: [165, 195], mandante2: [258, 282], mandante3: [78, 102], visitante: [-12, 30], tunelMandante: 180, tunelVisitante: 9, folgaPM: 5,
          fracao: { mandante1: 0.55, mandante2: 0.45, mandante3: 0.5, visitante1: 0.55, visitante2: 0.6, visitante3: 0.5 },
          torcidas: { fiel_forca_tricolor: 'mandante1' } }
};
