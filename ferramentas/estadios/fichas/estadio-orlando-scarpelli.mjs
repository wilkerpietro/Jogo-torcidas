/* ORLANDO SCARPELLI (Figueirense, Florianópolis) — pelo satélite e pelas
   fotos de referência (14/11/2026); o meio do campo foi tirado dos dois
   gols. O campo é norte-sul; no quadro o NORTE fica à DIREITA e o OESTE em
   cima (pro FFC das cadeiras sair de pé). Um oval fechado de cadeira verde
   com as escadas amarelas, de fundura diferente em cada lado:
   · EM CIMA (oeste), a COBERTA: o lance de baixo descoberto, com FFC em
     cadeira branca, e o de cima debaixo do telhado escuro e velho; atrás, o
     prédio e as duas torres de refletor. Na frente, no chão, a faixa preta
     FIGUEIRENSE (lida de quem está na coberta) e as tendas dos bancos.
   · À DIREITA (norte), a arquibancada mais FUNDA, em gomos, atrás do gol.
   · EMBAIXO (leste), a arquibancada reta e alta, descoberta, com as duas
     torres de refletor saindo do meio dela; atrás, o prédio do clube, o
     estacionamento e a avenida em diagonal.
   · À ESQUERDA (sul), a curva baixa do anel, que liga os dois lados.
   · Os cantos do lado norte: o de cima (noroeste) mais fundo, o de baixo
     (nordeste) raso, espremido pela avenida. */
const VD = '#2f8f63', VD2 = '#287f57';                  /* a cadeira verde */
const AM = '#e6cf4f';
const TELHA = '#514b49';
const FINO = { passoFileira: 0.45, celula: 0.4 };
/* o anel: a frente (4 m atrás da beira do gramado) e o fundo, 16 m atrás */
const R_D = { a: 77, b: 46, r: 42 }, R_F = { a: 93, b: 62, r: 58 };
/* o oeste: reto de u = -50,8 a 35,8; o lance de baixo (18 m) e o de cima (12 m) */
const W_D = { a: 77, b: 46, r: 22 }, W_1 = { a: 95, b: 64, r: 40 }, W_2 = { a: 107, b: 76, r: 52 };
/* o leste: reto de u = -41,7 a 42,5, com 27 m de fundura */
const E_D = { a: 77, b: 46, r: 30 }, E_F = { a: 104, b: 73, r: 57 };
/* o norte fundo (32 m), o canto noroeste (19 m) e o canto nordeste (12 m) */
const N_F = { a: 109, b: 78, r: 74 }, NO_F = { a: 96, b: 65, r: 61 }, NE_F = { a: 89, b: 58, r: 54 };
const CADEIRA = { cor: VD, cor2: VD2, padrao: 'mosaico', mistura: 0.32, corEscada: AM, paredeAtras: true, corFachada: '#e9e8e2' };
const TENDA = (u, v) => ({ u, v, w: 4.6, d: 4.6, h: 2.6, cor: '#eeeeea' });

export default {
  id: 'estadio-orlando-scarpelli', nome: 'Orlando Scarpelli', clubes: ['figueirense'], norte: 0, vazado: 0.4, folga: 20,
  corEscada: AM,
  chao: { cor: '#8d8981' },
  campo: { corMargem: '#4a9450' },
  corMureta: '#e9e8e2',
  aneis: [
    { dentro: R_D, fora: R_F, reto: true, h: [1.5, 8], fileiras: 14,
      trechos: [
        /* o norte (à direita): a arquibancada funda, atrás do gol */
        { de: -16.5, ate: 14.3, fora: N_F, h: [1.5, 17], ...CADEIRA, corredor: 13, escadaNaBorda: true, vomitorios: { f: 0.42, cada: 2 } },
        /* o canto noroeste */
        { de: 14.3, ate: 54, fora: NO_F, h: [1.5, 10], ...CADEIRA, corredor: 17 },
        /* o oeste (em cima), lance de baixo: FFC em cadeira branca */
        { de: 52.1, ate: 137.8, dentro: W_D, fora: W_1, h: [1.5, 10.5], ...CADEIRA, ...FINO, paredeAtras: false, corredor: 17.3, escadaNaBorda: true, vomitorios: false,
          texto: 'F  F  C', corTexto: '#eef0ec', textoLargura: 0.5, textoAltura: 0.7 },
        /* a curva sul (à esquerda), de ponta a ponta (as pontas entram um pouco por baixo da coberta e da reta do leste, pra não
           sobrar fresta: o chão tem de ser um só) */
        { de: 134.5, ate: 230.5, ...CADEIRA, corredor: 19, escadaNaBorda: true },
        /* o leste (embaixo): reta e alta */
        { de: 227.8, ate: 312.7, dentro: E_D, fora: E_F, h: [1.5, 15], ...CADEIRA, corredor: 20, escadaNaBorda: true, vomitorios: { f: 0.3, cada: 2 } },
        /* o canto nordeste, raso */
        { de: 310, ate: 343.5, fora: NE_F, h: [1.5, 6.5], ...CADEIRA, corredor: 16, escadaNaBorda: true }
      ] },
    /* O LANCE DE CIMA DA COBERTA, debaixo do telhado */
    { dentro: W_1, fora: W_2, reto: true, h: [11.5, 16.5], fileiras: 12, corredorFrente: 1.4,
      trechos: [{ de: 60.8, ate: 128.4, cor: '#2a7d56', cor2: '#256f4c', padrao: 'mosaico', mistura: 0.3, corredor: 17.3, corEscada: AM, escadaNaBorda: true, vomitorios: false }] }
  ],
  fachada: { cor: '#e9e8e2' },
  /* as duas do leste saem do meio da arquibancada (são assim de verdade); as duas do oeste ficam atrás do prédio */
  refletores: [[-28.3, -63, 40], [31.7, -61, 40], [-28.3, 91, 40], [31.7, 91, 40]],
  blocos: [
    /* OESTE: o telhado escuro e remendado, a testeira e o prédio atrás do lance de cima */
    { u: -7.7, v: 76.2, w: 88, d: 24.4, h: 0.6, y: 22, cor: TELHA, cobertura: true },
    { u: -20, v: 80, w: 9, d: 2, h: 0.2, y: 22.6, cor: '#bdb8ae', cobertura: true }, { u: -24, v: 73, w: 12, d: 2.4, h: 0.2, y: 22.6, cor: '#c9c4ba', cobertura: true },
    { u: 6, v: 82, w: 6, d: 2, h: 0.2, y: 22.6, cor: '#bdb8ae', cobertura: true }, { u: -44, v: 70, w: 3, d: 8, h: 0.2, y: 22.6, cor: '#aaa59b', cobertura: true },
    { u: -7.7, v: 64.2, w: 88, d: 0.5, h: 1.3, y: 20.8, cor: '#1f2a24', cobertura: true },
    { u: -7.7, v: 82.3, w: 87, d: 12, h: 21, cor: '#ecebe6' },
    /* a faixa FIGUEIRENSE no chão, na frente da coberta, com os dois escudos, e as tendas dos bancos */
    { u: -1.7, v: 43.4, w: 27, d: 4, h: 0.3, cor: '#1b1c1e', texto: 'FIGUEIRENSE', corTexto: '#f1f1ec', textoLargura: 0.9, textoAltura: 0.7, textoGiro: 180 },
    { u: -17.5, v: 43.4, w: 4, d: 4, h: 0.4, cor: '#f1f1ec' }, { u: 14.1, v: 43.4, w: 4, d: 4, h: 0.4, cor: '#f1f1ec' },
    TENDA(-42.7, 43), TENDA(38.7, 41.5), TENDA(-36, -43), TENDA(-7, -43), TENDA(18, -43), TENDA(38.7, -43),
    /* LESTE: o prédio do clube atrás da arquibancada, com a faixa preta do letreiro */
    { u: -3, v: -76.8, w: 80, d: 7, h: 15, cor: '#ecebe6' }, { u: -3, v: -80.5, w: 78, d: 0.4, h: 3, y: 9, cor: '#1b1c1e' }
  ],
  entorno: [
    /* o leste (embaixo): o estacionamento atrás do prédio, a avenida em diagonal e os prédios do outro lado */
    { tipo: 'estacionamento', u: -24, v: -93, w: 40, d: 18, cheio: 0.4 },
    { tipo: 'rua', de: [-60, -148], ate: [175, 2], larg: 12 },
    { tipo: 'predio', u: 52, v: -112, w: 16, d: 16, h: 32, cor: '#e6e4de', cor2: '#9aa3ab' }, { tipo: 'grama', u: 120, v: -105, w: 70, d: 60, cor: '#5d9450' },
    { tipo: 'predio', u: -66, v: -96, w: 18, d: 18, h: 26, cor: '#dfe6dc', cor2: '#9aa3ab' },
    /* o sul (à esquerda): as casas coladas na curva */
    { tipo: 'casas', u: -112, v: -40, nu: 2, nv: 6, passo: 13 }, { tipo: 'casas', u: -122, v: 40, nu: 1, nv: 3, passo: 13 },
    /* o oeste (em cima): o gramado atrás da coberta e a rua que contorna */
    { tipo: 'grama', u: -70, v: 84, w: 34, d: 26, cor: '#5d9450' },
    { tipo: 'rua', de: [-108, 30], ate: [-60, 104], larg: 10 }, { tipo: 'rua', de: [-60, 104], ate: [60, 104], larg: 10 }, { tipo: 'rua', de: [60, 104], ate: [140, 76], larg: 10 },
    /* o norte (à direita): o terreno e o mato do outro lado da rua */
    { tipo: 'rua', de: [122, 110], ate: [128, 20], larg: 10 },
    { tipo: 'grama', u: 160, v: 60, w: 56, d: 90, cor: '#6a8f55' }
  ],
  /* a Gaviões Alvinegros na arquibancada funda do norte e a visitante na curva sul (as duas escolhas minhas, sem fonte);
     os outros bondes da casa no leste e na coberta */
  jogo: { mandante1: [-12, 10], mandante2: [250, 290], mandante3: [75, 115], visitante: [165, 195], tunelMandante: 0, tunelVisitante: 180, folgaPM: 5,
          torcidas: { gavioes_alvinegros: 'mandante1' } }
};
