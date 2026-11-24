/* GERMANO KRÜGER (Operário Ferroviário, Ponta Grossa) — pelo satélite e pelas
   fotos de referência (15/11/2026); o meio do campo foi tirado dos dois gols.
   O campo é norte-sul; no quadro o NORTE fica à DIREITA e o OESTE em cima
   (pro OFEC sair de pé). Estádio pequeno, de um lance só em volta do gramado
   de cantos redondos, mais a arquibancada alta do OFEC.
   OS ACESSOS: não há boca de vomitório em lugar nenhum. Nos degraus baixos
   entra-se por trás, pelo nível da rua; na arquibancada do OFEC sobe-se
   pelas escadas amarelas a partir da passarela que fica na frente dela, em
   cima dos camarotes.
   · EM CIMA (oeste): o lance baixo de cadeira preta com as escadas amarelas,
     de ponta a ponta; atrás dele, na metade norte, a ARQUIBANCADA DO OFEC,
     alta e íngreme, de cadeira preta com O F E C em cadeira branca (uma
     letra por bloco) e as escadas amarelas, debaixo do telhado grande; na
     metade sul, o prédio branco dos camarotes e o ginásio.
   · À ESQUERDA (sul), a curva de degrau de cimento, a mais funda.
   · EMBAIXO (leste) e À DIREITA (norte), o degrau baixo e escuro, com o
     gradil preto atrás; a curva norte é a mais rasa, colada na avenida. */
const PT = '#1e1e21', PT2 = '#2a2a2e';                  /* a cadeira preta */
const AM = '#e3c22e', BR = '#f0f0ec';
const CIM = '#96948e', CIM2 = '#8a8882', ESC = '#57575b', ESC2 = '#4c4c50';
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* o gramado (cantos de 21 m) e os fundos de cada lado: a curva sul 13 m, o leste 10 m, o norte e o lance baixo do oeste 6 m */
const D = { a: 71, b: 43, r: 21 };
const F_SUL = { a: 84, b: 56, r: 34 }, F_LESTE = { a: 81, b: 53, r: 31 }, F_BAIXO = { a: 77, b: 49, r: 27 };
/* a arquibancada do OFEC: de u = 5 a 44, da passarela (v = 49) ao fundo (v = 70) */
const reta = b => ({ a: 120, b, r: 2 });
const OFEC = (u0, u1, mais) => ({ de: A(u0, 51.5), ate: A(u1, 51.5), dentro: reta(51.5), fora: reta(70), ...mais });
const LETRA = l => ({ cor: PT, cor2: PT2, padrao: 'mosaico', mistura: 0.25, corredor: 0, escadaNaBorda: true, corEscada: AM, vomitorios: false, paredeAtras: true, corFachada: '#2a2a2c',
  passoFileira: 0.45, celula: 0.4, texto: l, corTexto: BR, textoLargura: 0.62, textoAltura: 0.5 });
const DEGRAU = { padrao: 'mosaico', mistura: 0.4, semCadeiras: true, vomitorios: false, paredeAtras: true };

export default {
  id: 'estadio-germano-kruger', nome: 'Germano Krüger', clubes: ['operario-pr'], norte: 0, vazado: 0.4, folga: 24,
  corEscada: AM,
  chao: { cor: '#8d8981' },
  campo: { corMargem: '#3f8f4b' },
  corMureta: '#e9e9e6',
  aneis: [
    /* O LANCE BAIXO, a volta inteira */
    { dentro: D, fora: F_BAIXO, reto: true, h: [1.2, 3.6], fileiras: 7,
      trechos: [
        /* a curva norte (à direita): rasa e escura */
        { de: A(50, -43) - 360, ate: A(58, 43), ...DEGRAU, cor: ESC, cor2: ESC2, corredor: 0, corFachada: '#1e1e21', parapeito: 2.4 },
        /* o oeste (em cima): cadeira preta, escadas amarelas */
        { de: A(58, 43), ate: A(-55, 43), cor: PT, cor2: PT2, padrao: 'mosaico', mistura: 0.25, corredor: 16, escadaNaBorda: true, corEscada: AM, vomitorios: false },
        /* a curva sul (à esquerda): cimento, a mais funda */
        { de: A(-55, 43), ate: A(-50, -43), fora: F_SUL, h: [1.2, 7], ...DEGRAU, cor: CIM, cor2: CIM2, corredor: 22, corEscada: '#d9d7cf', corFachada: '#3a3a3d', parapeito: 2 },
        /* o leste (embaixo): escuro */
        { de: A(-50, -43), ate: A(50, -43), fora: F_LESTE, h: [1.2, 5.6], ...DEGRAU, cor: ESC, cor2: ESC2, corredor: 24, corEscada: '#8f8f93', corFachada: '#1e1e21', parapeito: 2.6 }
      ] },
    /* A PASSARELA em cima dos camarotes e A ARQUIBANCADA DO OFEC (C, E, F, O: do norte pro sul) */
    { dentro: reta(49), fora: reta(51.5), reto: true, h: [6.5, 18], fileiras: 22, corredorFrente: 0,
      trechos: [
        { de: A(44, 49), ate: A(5, 49), tipo: 'passagem', alt: 5.6, cor: '#c9c8c2' },
        OFEC(44, 34.25, LETRA('C')), OFEC(34.25, 24.5, LETRA('E')), OFEC(24.5, 14.75, LETRA('F')), OFEC(14.75, 6.3, LETRA('O')),
        OFEC(6.3, 5, { cor: AM, semCadeiras: true, corredor: 0, vomitorios: false, paredeAtras: true, corFachada: '#2a2a2c' })
      ] }
  ],
  fachada: { cor: '#2a2a2c' },
  /* as quatro torres, fora das arquibancadas */
  refletores: [[20, -68, 30], [72, -60, 30], [-53, 62, 30], [51, 60, 30]],
  blocos: [
    /* OFEC: o telhado grande, a testeira branca do letreiro, as cabines no alto e o prédio de trás */
    { u: 24.5, v: 57, w: 42, d: 32, h: 0.7, y: 22, cor: '#b9b7b0', cobertura: true },
    { u: 24.5, v: 41.2, w: 42, d: 0.5, h: 1.6, y: 20.8, cor: '#f0f0ec', cobertura: true },
    { u: 24.5, v: 71, w: 40, d: 2, h: 21.5, cor: '#2a2a2c' },
    /* os camarotes de vidro debaixo da passarela, o prédio branco da metade sul e o ginásio atrás */
    { u: 24.5, v: 50.2, w: 39, d: 2.4, h: 5.5, cor: '#dfe3e6' },
    { u: -21, v: 53.2, w: 52, d: 8, h: 5.5, cor: '#ecebe6' }, { u: -12.5, v: 65, w: 35, d: 14, h: 9, cor: '#c9c9c5' },
    { u: 57, v: 53.5, w: 15, d: 8, h: 4, cor: '#ecebe6' },
    /* os bancos de reserva, do lado do OFEC */
    { u: -8, v: 40.6, w: 18, d: 1.6, h: 1.8, cor: '#f0f0ec' },
    /* o placar no fim da curva sul */
    { u: -72, v: 46, w: 1, d: 9, h: 4.5, y: 7, cor: '#17181b', giro: 50 }
  ],
  entorno: [
    /* o oeste (em cima): o estacionamento, as piscinas do clube e a rua */
    { tipo: 'estacionamento', u: 70, v: 76, w: 24, d: 30, cheio: 0.6 },
    { tipo: 'piscina', u: -88, v: 104, w: 44, d: 20 }, { tipo: 'predio', u: -62, v: 68, w: 18, d: 12, h: 4, cor: '#dedcd5' },
    { tipo: 'rua', de: [-200, 126], ate: [200, 126], larg: 9 }, { tipo: 'casas', u: 30, v: 104, nu: 8, nv: 1, passo: 13 },
    /* o norte (à direita): a avenida colada na curva e as casas */
    { tipo: 'rua', de: [91, -200], ate: [91, 200], larg: 14 }, { tipo: 'casas', u: 124, v: 20, nu: 3, nv: 12, passo: 13 },
    /* o leste (embaixo): a rua em diagonal, o terreno gramado e os prédios */
    { tipo: 'rua', de: [91, -40], ate: [20, -86], larg: 10 }, { tipo: 'rua', de: [20, -86], ate: [-200, -86], larg: 10 },
    { tipo: 'grama', u: -24, v: -68, w: 56, d: 22, cor: '#6a9a52' },
    { tipo: 'predio', u: 66, v: -84, w: 26, d: 18, h: 30, cor: '#5a3f44', cor2: '#9aa3ab' }, { tipo: 'casas', u: -40, v: -110, nu: 12, nv: 2, passo: 13 },
    /* o sul (à esquerda): o mato */
    { tipo: 'arvores', u: -118, v: 0, w: 40, d: 150, n: 60 }
  ],
  /* a Trem Fantasma no degrau do leste e a visitante na curva sul (escolhas minhas, sem fonte); os outros bondes da casa na
     arquibancada do OFEC e no lance baixo do oeste */
  jogo: { mandante1: [255, 285], mandante2: [56, 80], mandante3: [108, 132], visitante: [166, 194], tunelMandante: 270, tunelVisitante: 180, folgaPM: 4,
          torcidas: { trem_fantasma: 'mandante1' } }
};
