/* BRUNO DANIEL (o Ramalhão joga aqui — Santo André) — pelo satélite e pelas
   fotos de referência (15/11/2026); o meio do campo foi tirado do círculo
   central. O campo é quase norte-sul; no quadro o OESTE (a arquibancada
   grande) fica em cima e o NORTE à direita. NÃO achei mapa de setores.
   As fotos misturam épocas: as antigas mostram a marquise de concreto em
   balanço sobre a arquibancada grande, que foi demolida. Vale o satélite:
   · EM CIMA (oeste), a ARQUIBANCADA GRANDE: reta, funda (28 m) e alta,
     DESCOBERTA, de degrau pintado em faixas azuis e brancas; os dois blocos
     do meio são mais escuros. As escadas claras e as quatro bocas na
     frente, onde o satélite mostra. Atrás, a estrutura de concreto com os
     pilares da marquise que saiu. Na frente, no meio, o teto branco do
     túnel.
   · EMBAIXO (leste), a arquibancada menor: reta, de cadeira azul, com cinco
     escadas; atrás dela, o galpão comprido de teto branco.
   · NAS DUAS CURVAS (atrás dos gols) NÃO há arquibancada: só o barranco de
     grama e o muro.
   · Em volta do gramado, a pista oval pintada de bege e azul-claro.
   OS ACESSOS: as quatro bocas da frente da arquibancada grande. */
const BR = '#eef1f4', AZ = '#5f8fd0', AZM = '#3f6fc0', AZE = '#2c4f9c';
const ESC = '#d9d2bd';
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* o gramado oval; a pista; a faixa azul-clara de fora da pista */
const GRAMA = { a: 76, b: 38, r: 38 }, PISTA = { a: 80, b: 44, r: 44 }, OVAL = { a: 86, b: 50.5, r: 50.5 };
/* a arquibancada grande: a frente (v = 56,3) e o fundo (v = 84,7); a menor: a frente (v = -50,8) e o fundo (v = -66,7) */
const G_D = { a: 88, b: 56.3, r: 2 }, G_F = { a: 116.4, b: 84.7, r: 30.4 };
const M_D = { a: 88, b: 50.8, r: 2 }, M_F = { a: 103.9, b: 66.7, r: 17.9 };
/* a arquibancada grande, bloco a bloco (do norte pro sul); a boca fica na frente, na fração do bloco que o satélite mostra */
const GRANDE = [[63, 43.5], [43.5, 31, 0.36], [31, 16.7], [16.7, 0.8, 0.26, true], [0.8, -16.5, 0.8, true], [-16.5, -40, 0.9], [-40, -62]].map(([u0, u1, boca, meio]) => ({
  de: A(u0, 56.3), ate: A(u1, 56.3), padrao: 'faixas', cores: meio ? [AZM, AZE] : [BR, AZ], faixaM: 1.8, cor: meio ? AZM : BR, semCadeiras: true, corredor: 0, escadaNaBorda: u0 < 63, corEscada: ESC,
  vomitorios: boca ? { f: 0, larg: 4.5, fundo: 4, em: [boca] } : false, fora: G_F, paredeAtras: true, corFachada: '#cfc6ae', parapeito: 1.5 }));
/* a arquibancada menor, bloco a bloco (do sul pro norte) */
const MENOR = [[-59, -47.5], [-47.5, -25.8], [-25.8, -4.2], [-4.2, 17.5], [17.5, 39.2], [39.2, 51.7]].map(([u0, u1]) => ({
  de: A(u0, -50.8), ate: A(u1, -50.8), dentro: M_D, fora: M_F, h: [1.5, 9], cor: '#4f6fb8', cor2: '#6283c9', padrao: 'mosaico', mistura: 0.4, corredor: 0, escadaNaBorda: u0 > -59, corEscada: ESC,
  vomitorios: false, paredeAtras: true, corFachada: '#3c5fa8' }));
/* os pilares da marquise demolida, atrás da arquibancada grande */
const PILARES = Array.from({ length: 12 }, (_, i) => ({ u: -57 + i * 10.6, v: 92, w: 2.4, d: 5, h: 21, cor: '#cfc6ae' }));

export default {
  id: 'estadio-bruno-daniel', nome: 'Bruno Daniel', clubes: ['santo-andre'], norte: 336.7, vazado: 0.4, folga: 22,
  corEscada: ESC,
  chao: { cor: '#6f8a5c' },
  campo: { corMargem: '#3f8a4a', pista: { dentro: GRAMA, fora: PISTA, cor: '#e6c58f', raias: 0 } },
  corMureta: '#e3e6ea',
  aneis: [
    /* a faixa azul-clara em volta da pista; do lado das duas arquibancadas ela vai até o pé delas */
    { dentro: PISTA, fora: OVAL, h: [0.2, 0.2], fileiras: 2, corredorFrente: 0,
      trechos: [
        { de: A(51.7, -50.8) - 360, ate: A(63, 56.3), tipo: 'passagem', cor: '#a9d3df' },
        { de: A(63, 56.3), ate: A(-62, 56.3), tipo: 'passagem', cor: '#a9d3df', fora: G_D },
        { de: A(-62, 56.3), ate: A(-59, -50.8), tipo: 'passagem', cor: '#a9d3df' },
        { de: A(-59, -50.8), ate: A(51.7, -50.8), tipo: 'passagem', cor: '#8fae7c', fora: M_D }
      ] },
    /* AS DUAS ARQUIBANCADAS, retas */
    { dentro: G_D, fora: G_F, reto: true, andarReto: true, h: [3.5, 18], fileiras: 30,
      trechos: [...GRANDE, ...MENOR] }
  ],
  fachada: { cor: '#cfc6ae' },
  refletores: [[-73, 55, 36], [77, 58, 36], [-76, -65, 36], [84, -61, 36]],
  blocos: [
    /* a estrutura de concreto de trás da arquibancada grande e os pilares da marquise que saiu */
    { u: 0.5, v: 87.6, w: 125, d: 5, h: 19, cor: '#cfc6ae' }, ...PILARES,
    /* o teto branco do túnel, na frente da arquibancada grande */
    { u: -0.4, v: 51.2, w: 32, d: 6, h: 3, cor: '#e9ecee' },
    /* os dois abrigos na ponta do gramado */
    { u: -61.7, v: 22.5, w: 5, d: 3.4, h: 2.2, cor: '#dfe3e6' }, { u: 60.3, v: 23.7, w: 5, d: 3.4, h: 2.2, cor: '#dfe3e6' },
    /* o galpão comprido de teto branco atrás da arquibancada menor */
    { u: 13.8, v: -78.3, w: 115.8, d: 13.3, h: 8, cor: '#e3e3df' }
  ],
  entorno: [
    /* em cima à esquerda: a avenida em diagonal; em cima à direita: o estacionamento */
    { tipo: 'rua', de: [-125, 62], ate: [-52, 112], larg: 18 }, { tipo: 'estacionamento', u: 95, v: 82, w: 34, d: 26, cheio: 0.3 },
    /* à direita (norte) e à esquerda (sul): as árvores dos barrancos */
    { tipo: 'arvores', u: 104, v: -4, w: 18, d: 110, n: 30 }, { tipo: 'arvores', u: -94, v: -50, w: 40, d: 70, n: 26 },
    { tipo: 'arvores', u: -100, v: 20, w: 12, d: 40, n: 8 },
    /* embaixo (leste): a rua e as casas */
    { tipo: 'rua', de: [-125, -96], ate: [125, -96], larg: 9 }, { tipo: 'casas', u: 0, v: -112, nu: 15, nv: 1, passo: 15 }
  ],
  /* (escolhas minhas, sem fonte: não achei mapa de setores) a Fúria Andreense no meio da arquibancada grande e a visitante na
     ponta norte da arquibancada menor; os outros bondes da casa nas pontas da grande */
  jogo: { mandante1: [80, 100], mandante2: [108, 125], mandante3: [55, 72], visitante: [285, 303], tunelMandante: 90, tunelVisitante: 294, folgaPM: 4,
          fracao: { mandante1: 0.65, mandante2: 0.65, mandante3: 0.65, visitante1: 0.65, visitante2: 0.7, visitante3: 0.6 },
          torcidas: { furia_andreense: 'mandante1' } }
};
