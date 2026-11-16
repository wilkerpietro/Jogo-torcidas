/* NILTON SANTOS (Engenhão, Botafogo, Rio de Janeiro) — pelo satélite e pelas
   oito imagens do dono (16/11/2026): o mapa de setores, a planta da maquete
   com o desenho das cadeiras de cada setor, o mapa de ingressos (com a
   visitante) e as fotos de drone. O campo corre de sul-sudoeste a
   norte-nordeste; no quadro o OESTE fica em cima e o NORTE à direita.
   Arena oval coberta, com a pista azul de atletismo em volta do campo (as
   pontas da pista com o escudo do Botafogo) e quatro arquibancadas separadas
   nos cantos por uma fresta:
   · OS DOIS LATERAIS (Leste e Oeste), em dois anéis com a faixa de camarotes
     de vidro no meio. O de baixo (Inferior), branco na frente e escurecendo
     até o preto no alto, salpicado, com as bocas no meio do lance. O de cima
     (Superior):
       – o LESTE (embaixo no quadro), em blocos pretos e brancos alternados: os
         pretos com os dois escudos e o B F R no meio (de quem olha do campo,
         da esquerda pra direita: escudo, B, F, R, escudo); os brancos, mais
         estreitos, com as bocas;
       – o OESTE (em cima), preto com as escadas brancas, os dois escudos e o
         bloco branco da tribuna no meio.
   · O NORTE (à direita), um anel só, preto, com as escadas brancas e as bocas
     cinza.
   · O SUL (à esquerda), um anel só, branco embaixo e quadriculado de preto e
     branco em cima: o da VISITANTE (o mapa de ingressos).
   · O TELHADO branco cobre tudo, com a abertura em cima do campo, pendurado
     nos quatro arcos de treliça branca. Em volta, as duas rampas redondas e
     a esplanada do lado oeste.
   AS TORCIDAS: a visitante no Sul (o mapa); a Fúria Jovem no Norte e a Torcida
   Jovem no Leste Inferior (escolhas minhas, sem fonte). */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const BR = '#f1f1ee', PT = '#2a2c30', PT2 = '#33363b', CINZA = '#7a7c80';
/* a pista (de dentro e de fora), o fim do anel de baixo dos laterais, os camarotes, o fim do anel de cima, o fundo do Norte e do Sul */
const PISTA = { a: 78.7, b: 36.5, r: 36.5 }, W = { a: 92, b: 50, r: 50 };
const L = { a: 114, b: 72, r: 72 }, K = { a: 117, b: 75, r: 75 }, F = { a: 142, b: 100, r: 100 }, FIM = { a: 125, b: 83, r: 83 };
/* os cantos: os laterais vão de 39 a 141 e de 219 a 321 graus; o Norte e o Sul, de -31 a 31 e de 149 a 211 */
const LO = [39, 141], LL = [219, 321], NO = [-31, 31], SU = [149, 211];
/* o anel de baixo dos laterais: branco na frente, escurecendo até o preto, salpicado */
const INFERIOR = { padrao: 'degrade', cores: [BR, BR, BR, '#c9cbcd', PT, PT], mistura: 1.1, corredor: 13, escadaNaBorda: true, corEscada: '#d9dad6',
  vomitorios: { f: 0.45, cada: 2, larg: 3.6, fundo: 3.6, cor: CINZA, corParapeito: '#d9dad6' } };
/* o Leste Superior, do sul pro norte (no quadro, da esquerda pra direita): preto, branco, escudo, branco, R, branco, F, branco, B,
   branco, escudo, branco, preto; os pretos com o dobro da largura dos brancos */
const LESTE_SUP = (() => { const seq = ['', 'b', '★', 'b', 'R', 'b', 'F', 'b', 'B', 'b', '★', 'b', ''], larg = seq.map(t => t === 'b' ? 1 : 2), tot = larg.reduce((x, y) => x + y);
  let a = LL[0]; return seq.map((t, k) => { const de = a, ate = a + (LL[1] - LL[0]) * larg[k] / tot; a = ate;
    return t === 'b' ? { de, ate, cor: BR, cor2: '#e4e5e2', padrao: 'mosaico', mistura: 0.1, corredor: 0, escadaNaBorda: true, corEscada: '#c9cbcd',
                         vomitorios: { f: 0.3, em: [0.5], larg: 3.6, fundo: 3.2, cor: CINZA, corParapeito: BR } }
                     : { de, ate, cor: PT, cor2: PT2, padrao: 'mosaico', mistura: 0.15, corredor: 0, escadaNaBorda: true, corEscada: '#c9cbcd', vomitorios: false,
                         ...(t ? { texto: t, corTexto: BR, textoLargura: 0.8, textoAltura: 0.8 } : {}) }; }); })();
/* o Oeste Superior, do norte pro sul (no quadro, da direita pra esquerda): preto, preto, escudo, preto, preto, tribuna branca, preto, preto,
   escudo, preto, preto */
const OESTE_SUP = (() => { const seq = ['', '', '★', '', '', 'T', '', '', '★', '', ''], n = seq.length;
  return seq.map((t, k) => { const de = LO[0] + (LO[1] - LO[0]) * k / n, ate = LO[0] + (LO[1] - LO[0]) * (k + 1) / n;
    if (t === 'T') return { de, ate, cor: BR, cor2: '#e4e5e2', padrao: 'mosaico', mistura: 0.1, corredor: 0, escadaNaBorda: true, corEscada: '#c9cbcd', vomitorios: false };
    return { de, ate, cor: PT, cor2: PT2, padrao: 'mosaico', mistura: 0.15, corredor: 0, escadaNaBorda: true, corEscada: BR,
      vomitorios: { f: 0.3, em: [0], larg: 3.2, fundo: 3, cor: '#16171a', corParapeito: PT }, ...(t ? { texto: t, corTexto: BR, textoLargura: 0.8, textoAltura: 0.8 } : {}) }; }); })();
const FRESTA = (de, ate) => ({ de, ate, tipo: 'passagem', cor: '#9a9893' });

export default {
  id: 'estadio-nilton-santos', alambrado: false, muro: false, nome: 'Nilton Santos', clubes: ['botafogo'], norte: 24, vazado: 0.12, folga: 20,
  chao: { cor: '#8a867e', esplanada: { a: 175, b: 140, forma: 'elipse' }, corEsplanada: '#b9b2a6' },
  campo: { corMargem: '#6aaed6', pista: { dentro: PISTA, fora: W, cor: '#3f86c4', raias: 8 } },
  corMureta: '#d9dad6',
  aneis: [
    /* O ANEL DE BAIXO: os dois laterais (Inferior), o Norte e o Sul, separados nos cantos por uma fresta */
    { dentro: W, fora: L, h: [1.6, 11.5], fileiras: 22,
      trechos: [
        { de: NO[0], ate: NO[1], fora: FIM, h: [1.6, 20], fileiras: 36, cor: PT, cor2: PT2, padrao: 'mosaico', mistura: 0.15, corredor: 15, escadaNaBorda: true, corEscada: BR,
          vomitorios: { f: 0.45, cada: 1, larg: 3.6, fundo: 3.6, cor: CINZA, corParapeito: PT }, paredeAtras: true, corFachada: '#d9dad6' },
        FRESTA(NO[1], LO[0]),
        { de: LO[0], ate: LO[1], ...INFERIOR },
        FRESTA(LO[1], SU[0]),
        { de: SU[0], ate: SU[1], fora: FIM, h: [1.6, 20], fileiras: 36, padrao: 'degrade', cores: [BR, BR, BR, '#8c8e92', BR, PT, BR, PT], mistura: 1.4, corredor: 15,
          escadaNaBorda: true, corEscada: '#d9dad6', vomitorios: { f: 0.45, cada: 1, larg: 3.6, fundo: 3.6, cor: CINZA, corParapeito: BR }, paredeAtras: true, corFachada: '#d9dad6' },
        FRESTA(SU[1], LL[0]),
        { de: LL[0], ate: LL[1], ...INFERIOR },
        FRESTA(LL[1], NO[0] + 360)
      ] },
    /* A FAIXA DE CAMAROTES de vidro, entre os dois anéis dos laterais */
    { dentro: L, fora: K, h: [12, 14.2], fileiras: 2, corredorFrente: 0, vomitorios: false, semCadeiras: true, passoFileira: 2, corMureta: '#d9dad6',
      trechos: [
        { de: LO[0], ate: LO[1], cor: '#2f3a3a', cor2: '#3c4a46', padrao: 'mosaico', mistura: 0.3, corredor: 0 },
        { de: LO[1], ate: LL[0], tipo: 'vazio' },
        { de: LL[0], ate: LL[1], cor: '#2f3a3a', cor2: '#3c4a46', padrao: 'mosaico', mistura: 0.3, corredor: 0 },
        { de: LL[1], ate: LO[0] + 360, tipo: 'vazio' }] },
    /* O ANEL DE CIMA dos laterais: o Oeste e o Leste Superior */
    { dentro: K, fora: F, h: [15.5, 36], fileiras: 26, corredorFrente: 1.4, corMureta: '#d9dad6',
      trechos: [
        ...OESTE_SUP,
        { de: LO[1], ate: LL[0], tipo: 'vazio' },
        ...LESTE_SUP,
        { de: LL[1], ate: LO[0] + 360, tipo: 'vazio' }] }
  ],
  coberturasAnel: [
    /* o telhado branco, INCLINADO (dono, 16/11/2026: "Observe que a cobertura do Nilton Santos tem uma inclinação"): alto na
       beira da abertura e descendo pra fora, como uma aba de chapéu, com a beira de fora dobrada pra baixo; inteiro por fora das
       arquibancadas, transparente por cima delas (`cai` negativo: a beira de dentro mais alta que a de fora) */
    { fora: { a: 152, b: 112, r: 100 }, dentro: F, h: 35, cai: -9, n: 80, cor: '#eeeeea', cor2: '#e6e6e2', opaca: true, nervuras: false, bordaFora: { larg: 3, cor: '#e3e3df' } },
    { fora: F, dentro: { a: 100, b: 68, r: 58 }, h: 44, cai: -6, n: 80, cor: '#eeeeea', cor2: '#e6e6e2', nervuras: false, bordaDentro: { larg: 1.5, cor: '#c9cbcd' } }
  ],
  fachada: { cor: '#d9dad6' },
  blocos: [
    /* os quatro arcos de treliça branca, por cima do telhado */
    { u: 0, v: 96, w: 270, d: 2.2, h: 2.2, y: 54, cor: '#f4f4f0' }, { u: 0, v: -96, w: 270, d: 2.2, h: 2.2, y: 54, cor: '#f4f4f0' },
    { u: 134, v: 0, w: 2.2, d: 190, h: 2.2, y: 54, cor: '#f4f4f0' }, { u: -134, v: 0, w: 2.2, d: 190, h: 2.2, y: 54, cor: '#f4f4f0' },
    /* o escudo do Botafogo pintado na pista, atrás de cada gol */
    { u: 74, v: 0, w: 10, d: 12, h: 0.12, cor: PT, texto: '★', corTexto: BR, textoLargura: 0.6, textoAltura: 0.6 },
    { u: -74, v: 0, w: 10, d: 12, h: 0.12, cor: PT, texto: '★', corTexto: BR, textoLargura: 0.6, textoAltura: 0.6 },
    /* os dois telões, pendurados no telhado atrás dos gols */
    { u: 108, v: 0, w: 2, d: 20, h: 8, y: 26, cor: '#16171a', cobertura: true }, { u: -108, v: 0, w: 2, d: 20, h: 8, y: 26, cor: '#16171a', cobertura: true },
    /* as duas rampas redondas do lado oeste */
    { u: 60, v: 150, w: 28, d: 28, h: 16, cor: '#bdb9b0' }, { u: -10, v: 156, w: 28, d: 28, h: 16, cor: '#bdb9b0' }
  ],
  vista: [-90, 130, 330, 10, 20, 0],
  entorno: [
    /* à esquerda (sul): os dois campos de treino; à direita, a linha do trem; em cima (oeste), os galpões compridos */
    { tipo: 'grama', u: -205, v: -40, w: 70, d: 110, cor: '#3f8a52' }, { tipo: 'predio', u: 30, v: 220, w: 160, d: 30, h: 9, cor: '#a5583f' },
    { tipo: 'rua', de: [230, -250], ate: [230, 250], larg: 24 }, { tipo: 'casas', u: 0, v: -200, nu: 18, nv: 2, passo: 15 }
  ],
  jogo: { mandante1: [-15, 15], mandante2: [255, 285], mandante3: [75, 105], visitante: [165, 195], tunelMandante: 0, tunelVisitante: 180, folgaPM: 5,
          fracao: { mandante1: 0.35, mandante2: 0.3, mandante3: 0.3, visitante1: 0.4, visitante2: 0.45, visitante3: 0.35 },
          torcidas: { furia_jovem_botafogo: 'mandante1', torcida_jovem_botafogo: 'mandante2' } }
};
