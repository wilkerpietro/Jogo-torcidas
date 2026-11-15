/* COUTO PEREIRA (Major Antônio Couto Pereira — Coritiba, Curitiba) — pelo
   satélite e pelas fotos de referência (15/11/2026); o meio do campo foi
   tirado do círculo central. O campo é noroeste-sudeste; no quadro a MAUÁ
   (a do CFC) fica em cima, pro letreiro sair de pé, a SOCIAL coberta
   embaixo, a curva do sudeste à esquerda e a do noroeste (a da avenida) à
   direita. O gramado é oval (a grama continua atrás dos dois gols).
   OS ACESSOS (dono, 15/11/2026: "tenha mais atenção aos vomitórios, tem
   algumas arquibancadas que não são exatamente quadrados, são acessados
   pela parte de cima"): aqui NÃO há boca quadrada no meio do lance. O anel
   das curvas tem TRÊS LANCES separados por duas GALERIAS (os corredores em
   volta do estádio); o público entra pela galeria, por cima de cada lance,
   e sobe ou desce de um nível pro outro pelas caixas de escada que abrem no
   piso da galeria.
   · EM CIMA, a MAUÁ: o lance de baixo em blocos verdes e brancos, a
     galeria, e o lance de cima com o CFC em cadeira branca no meio; o
     telhado escuro de treliça por cima das fileiras de trás; uma torre de
     refletor em cada ponta.
   · EMBAIXO, a SOCIAL: o lance de baixo descoberto, de cadeira escura, e o
     de cima debaixo do telhado claro (a frente mais escura).
   · AS DUAS CURVAS: os três lances de cadeira branca com as divisas verdes;
     as pontas coladas na social são de cadeira escura; a marquise verde
     cobre o alto do lance de cima. */
const BR = '#eceeea', BR2 = '#dfe2dd';                  /* a cadeira branca */
const VD = '#2f9a84', VD2 = '#288a76';                  /* a cadeira verde */
const ESC = '#2a4a52', ESC2 = '#223f47';                /* a cadeira escura (a social e as pontas das curvas) */
const DIVISA = '#4d9b82', PISO = '#b9b7ad', BURACO = '#26282b';
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
/* os contornos das curvas, de dentro pra fora: o gramado, o fim do lance de baixo (8 m), a 1ª galeria (3 m), o fim do lance
   do meio (6 m), a 2ª galeria (3 m) e o fim do lance de cima (10 m). Os cantos são concêntricos (centros em ±42, ±0,5). */
const C = [45, 53, 56, 62, 65, 75].map(r => ({ a: 42 + r, b: 0.5 + r, r }));
/* o ângulo (visto do meio do campo) do ponto do contorno de raio r na direção fi do centro do canto */
const fim = (r, fi) => { const cu = Math.cos(fi * RAD) >= 0 ? 42 : -42, cv = Math.sin(fi * RAD) >= 0 ? 0.5 : -0.5; return A(cu + r * Math.cos(fi * RAD), cv + r * Math.sin(fi * RAD)); };
/* onde cada curva acaba (direção vista do centro do canto): as pontas entram um pouco por baixo da Mauá e da social, pra não
   sobrar fresta; e onde a cadeira escura começa, perto da social */
const DIR = [-90, -38, 76], ESQ = [116, 218, 247];
/* os trechos das duas curvas num anel de raio de dentro r: `branco` e `escuro` são os dois jeitos de pintar (ou o piso) */
const curvas = (r, branco, escuro) => [
  { de: fim(r, DIR[0]) - 360, ate: fim(r, DIR[1]) - 360, ...escuro }, { de: fim(r, DIR[1]) - 360, ate: fim(r, DIR[2]), ...branco },
  { de: fim(r, ESQ[0]), ate: fim(r, ESQ[1]), ...branco }, { de: fim(r, ESQ[1]), ate: fim(r, ESQ[2]), ...escuro }];
const LANCE = { padrao: 'mosaico', mistura: 0.3, corredor: 14, corEscada: DIVISA, vomitorios: false };
const BRANCO = { ...LANCE, cor: BR, cor2: BR2 }, ESCURO = { ...LANCE, cor: ESC, cor2: ESC2 };
const GALERIA = alt => ({ tipo: 'passagem', alt, cor: PISO });
/* as duas retas: a Mauá de u = -64 a 55, a social de u = -62 a 44; cada nível com a sua frente e o seu fundo */
const reta = b => ({ a: 120, b, r: 2 });
const MAUA = (v0, v1, u0, u1) => ({ de: A(u0, v0), ate: A(u1, v0), dentro: reta(v0), fora: reta(v1) });
const SOCIAL = (v0, v1) => ({ de: A(-62, -v0), ate: A(44, -v0), dentro: reta(v0), fora: reta(v1) });
const BLOCO = cor => ({ cor, cor2: cor === BR ? BR2 : VD2, padrao: 'mosaico', mistura: 0.28, corredor: 0, escadaNaBorda: true, corEscada: '#cfd3cf', vomitorios: false });
/* o lance de baixo da Mauá: oito blocos, verde e branco */
const MAUA_BAIXO = Array.from({ length: 8 }, (_, i) => ({ ...MAUA(46, 54, 55 - i * 14.875, 55 - (i + 1) * 14.875), h: [1.5, 4.8], ...BLOCO(i % 2 ? BR : VD) }));
/* o lance de cima da Mauá: branco, verde, branco, o CFC, branco, verde, branco */
const MAUA_CIMA = [[55, 42, BR], [42, 29, VD], [29, 16, BR], [16, -25, 'CFC'], [-25, -38, BR], [-38, -51, VD], [-51, -64, BR]].map(([u0, u1, cor]) => cor === 'CFC'
  ? { ...MAUA(57, 76, u0, u1), h: [7, 19], ...BLOCO(VD), escadaNaBorda: false, passoFileira: 0.45, celula: 0.4, texto: 'C F C', corTexto: BR, textoLargura: 0.86, textoAltura: 0.72, paredeAtras: true }
  : { ...MAUA(57, 76, u0, u1), h: [7, 19], ...BLOCO(cor), paredeAtras: true });
/* as caixas de escada que abrem no piso das galerias das curvas (os quadrados escuros do satélite) */
const caixa = (r, alt, fi) => { const cu = Math.cos(fi * RAD) >= 0 ? 42 : -42, cv = Math.sin(fi * RAD) >= 0 ? 0.5 : -0.5;
  return { u: cu + r * Math.cos(fi * RAD), v: cv + r * Math.sin(fi * RAD), w: 2.2, d: 3.4, h: 0.14, y: alt + 0.03, cor: BURACO, giro: fi }; };
const CAIXAS = [...[-62, -20, 18, 54, 138, 168, 198, 232].map(fi => caixa(63.5, 10.2, fi)), ...[-40, 0, 36, 152, 182, 216].map(fi => caixa(54.5, 4.9, fi))];
/* a marquise verde por cima do alto do lance de cima, em cada curva */
const arco = (r, f0, f1) => Array.from({ length: 41 }, (_, i) => { const fi = f0 + (f1 - f0) * i / 40, cu = Math.cos(fi * RAD) >= 0 ? 42 : -42, cv = Math.sin(fi * RAD) >= 0 ? 0.5 : -0.5;
  return [cu + r * Math.cos(fi * RAD), cv + r * Math.sin(fi * RAD)]; });
const MARQUISE = (f0, f1) => ({ y: 22, h: 0.5, cor: '#5f9a8e', pontos: [...arco(78.5, f0, f1), ...arco(71, f1, f0)] });
/* as treliças do telhado da Mauá */
const TRELICAS = Array.from({ length: 13 }, (_, i) => ({ u: -62 + i * 9.6, v: 73, w: 0.9, d: 14, h: 0.6, y: 25.6, cor: '#5a5c5f', cobertura: true }));

export default {
  id: 'estadio-couto-pereira', nome: 'Couto Pereira', clubes: ['coritiba'], norte: 309, vazado: 0.38, folga: 20,
  corEscada: DIVISA,
  chao: { cor: '#8d8981' },
  campo: { corMargem: '#3f8f4b' },
  corMureta: '#3f8f78',
  aneis: [
    /* O LANCE DE BAIXO, a volta inteira */
    { dentro: C[0], fora: C[1], reto: true, h: [1.5, 4.6], fileiras: 8,
      trechos: [...curvas(45, BRANCO, ESCURO), ...MAUA_BAIXO,
        { ...SOCIAL(45.5, 56), h: [1.5, 5.5], cor: ESC, cor2: ESC2, padrao: 'mosaico', mistura: 0.3, corredor: 13, corEscada: '#9fb3ad', vomitorios: false }] },
    /* A PRIMEIRA GALERIA */
    { dentro: C[1], fora: C[2], reto: true, h: [4.8, 4.8], fileiras: 2, corredorFrente: 0,
      trechos: [...curvas(53, GALERIA(4.8), GALERIA(4.8)), { ...MAUA(54, 57, 55, -64), ...GALERIA(5) }, { ...SOCIAL(56, 58.5), ...GALERIA(5.7) }] },
    /* O LANCE DO MEIO das curvas; o lance de cima da Mauá e o da social */
    { dentro: C[2], fora: C[3], reto: true, h: [6.6, 10], fileiras: 7, corredorFrente: 0,
      trechos: [...curvas(56, BRANCO, ESCURO), ...MAUA_CIMA,
        { ...SOCIAL(58.5, 78), h: [7.5, 17], cor: ESC, cor2: ESC2, padrao: 'mosaico', mistura: 0.3, corredor: 13, corEscada: '#9fb3ad', vomitorios: false, paredeAtras: true, corFachada: '#e3e6e2' }] },
    /* A SEGUNDA GALERIA, só nas curvas */
    { dentro: C[3], fora: C[4], reto: true, h: [10.1, 10.1], fileiras: 2, corredorFrente: 0,
      trechos: curvas(62, GALERIA(10.1), GALERIA(10.1)) },
    /* O LANCE DE CIMA das curvas */
    { dentro: C[4], fora: C[5], reto: true, h: [12.6, 18.6], fileiras: 11, corredorFrente: 0,
      trechos: curvas(65, { ...BRANCO, paredeAtras: true, corFachada: '#e9ece8', parapeito: 3 }, { ...ESCURO, paredeAtras: true, corFachada: '#e9ece8', parapeito: 3 }) }
  ],
  telhados: [MARQUISE(DIR[0], DIR[2]), MARQUISE(ESQ[0], ESQ[2])],
  fachada: { cor: '#e9ece8' },
  /* os refletores saem do alto das duas torres da Mauá */
  refletores: [[-67, 60, 46, 40], [58, 60, 46, 40]],
  blocos: [
    ...CAIXAS,
    /* MAUÁ: o telhado escuro de treliça, a testeira, o prédio de trás e as duas torres */
    { u: -4.5, v: 73, w: 119, d: 14, h: 0.6, y: 25, cor: '#3b3c3e', cobertura: true }, ...TRELICAS,
    { u: -4.5, v: 66.2, w: 119, d: 0.5, h: 1.2, y: 24.4, cor: '#2c2d2f', cobertura: true },
    { u: -4.5, v: 78.2, w: 117, d: 4, h: 24, cor: '#dfe3df' },
    { u: -67, v: 60, w: 4, d: 3.4, h: 40, cor: '#eceeea', cobertura: true }, { u: 58, v: 60, w: 4, d: 3.4, h: 40, cor: '#eceeea', cobertura: true },
    /* SOCIAL: o telhado claro (a frente mais escura), a fileira de luzes na beira e o prédio de trás */
    { u: -9, v: -75, w: 106, d: 16, h: 0.8, y: 24, cor: '#cfcdc8', cobertura: true }, { u: -9, v: -61.5, w: 106, d: 11, h: 0.8, y: 24, cor: '#a9a8a3', cobertura: true },
    { u: -9, v: -56.4, w: 100, d: 0.6, h: 0.9, y: 24.8, cor: '#eef0f1', cobertura: true },
    { u: -9, v: -80.5, w: 106, d: 5, h: 23, cor: '#e3e6e2' },
    /* os bancos de reserva, do lado da Mauá */
    { u: -11, v: 42.4, w: 9, d: 1.6, h: 1.8, cor: '#e9eeea' }, { u: 11, v: 42.4, w: 9, d: 1.6, h: 1.8, cor: '#e9eeea' }
  ],
  entorno: [
    /* em cima (atrás da Mauá): o estacionamento, o prédio do clube e a sede de telhado branco */
    { tipo: 'estacionamento', u: -92, v: 98, w: 56, d: 26, cheio: 0.6 },
    { tipo: 'predio', u: -6, v: 90, w: 30, d: 12, h: 9, cor: '#b5b3aa' }, { tipo: 'predio', u: 52, v: 97, w: 56, d: 26, h: 9, cor: '#e6e6e2' },
    { tipo: 'arvores', u: 112, v: 88, w: 30, d: 36, n: 14 },
    /* à direita: a avenida larga */
    { tipo: 'rua', de: [128, -220], ate: [128, 220], larg: 22 }, { tipo: 'casas', u: 160, v: 0, nu: 2, nv: 12, passo: 14 },
    /* embaixo (atrás da social): os prédios e as casas */
    { tipo: 'predio', u: -44, v: -104, w: 22, d: 22, h: 34, cor: '#e6e4de', cor2: '#9aa3ab' }, { tipo: 'predio', u: 8, v: -106, w: 24, d: 22, h: 26, cor: '#dcdad3', cor2: '#9aa3ab' },
    { tipo: 'predio', u: 60, v: -104, w: 22, d: 22, h: 30, cor: '#e9e7e1', cor2: '#9aa3ab' }, { tipo: 'casas', u: 110, v: -104, nu: 3, nv: 2, passo: 14 },
    /* à esquerda: a rua e as casas */
    { tipo: 'rua', de: [-130, -220], ate: [-130, 220], larg: 9 }, { tipo: 'casas', u: -154, v: 0, nu: 2, nv: 12, passo: 14 }
  ],
  /* a Império Alviverde e a Dragões Alviverdes no lance de cima da Mauá; a visitante no lance de cima da curva do sudeste
     (escolhas minhas, sem fonte); o outro bonde da casa na curva do noroeste */
  jogo: { mandante1: [82, 100], mandante2: [112, 128], mandante3: [-15, 15], visitante: [166, 194], tunelMandante: 91, tunelVisitante: 180, folgaPM: 5,
          fracao: { mandante1: 0.7, mandante2: 0.7, mandante3: 0.45, visitante1: 0.85, visitante2: 0.85, visitante3: 0.85 },
          torcidas: { imperio_alviverde: 'mandante1', dragoes_alviverdes: 'mandante2' } }
};
