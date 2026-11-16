/* JONAS DUARTE (Anápolis) — pelo satélite e pelas duas fotos de drone que o
   dono mandou no meio do levantamento (16/11/2026). O campo corre de
   su-sudoeste a nor-nordeste; no quadro o OESTE fica em cima e o NORTE à
   direita. Não achei mapa de setores. Estádio oval, baixo, de degrau de
   cimento claro com as muretas e o muro de fora azuis:
   · Em volta do gramado, a mureta azul e o anel de cimento (a pista velha),
     com a grade ao pé das arquibancadas.
   · EM CIMA (oeste), a SOCIAL: cadeiras em blocos azuis e brancos, com a
     cobertura na metade de trás; ao pé dela, os três bancos de reserva
     azuis.
   · À DIREITA (norte), a CURVA de cimento, com a boca de acesso e a caixa
     azul do placar no alto.
   · EMBAIXO (leste), a arquibancada de cimento descoberta, com a escada
     pintada no meio.
   · À ESQUERDA (sul), a outra CURVA de cimento, com as bocas e a escada
     listrada de vermelho, branco e azul no eixo do campo.
   Estimado: as alturas e o desenho dos blocos de cadeira da social.
   AS TORCIDAS (escolhas minhas, sem fonte): a Independente do Anápolis na
   curva do sul; a visitante na curva do norte. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const AZ = '#2545a8', AZ2 = '#2f52b8', CIM = '#d0cec6', CIM2 = '#c4c2ba', BR = '#eceae4';
/* a mureta do gramado, o fim do anel de cimento (o pé das arquibancadas) e o fundo */
const GRAMA = { a: 70.5, b: 43.5, r: 36 }, I = { a: 78.5, b: 51.5, r: 44 }, F = { a: 92, b: 65.5, r: 58 }, F_N = { a: 95, b: 65.5, r: 61 };   /* (o mesmo trecho reto do F: 95 - 61 = 92 - 58, senão a emenda com as laterais faz dente) */
const DEGRAU = { cor: CIM, cor2: CIM2, padrao: 'mosaico', mistura: 0.35, semCadeiras: true, corEspelho: '#b9b7af', corEscada: '#aeb4c2', paredeAtras: true, corFachada: AZ, corMureta: AZ, parapeito: 1.4 };
const BOCA = { f: 0.45, larg: 3.2, fundo: 3.4, cor: '#22262e', corParapeito: AZ };

export default {
  id: 'estadio-jonas-duarte', nome: 'Jonas Duarte', clubes: ['anapolis'], norte: 25.8, vazado: 0.3, folga: 22,
  chao: { cor: '#8f8b83' },
  campo: { corMargem: '#6f9650' },
  corMureta: AZ, corAlambrado: '#c9ced6',
  alambrado: { cor: '#c9ced6', corBase: AZ },
  aneis: [
    /* o anel de cimento em volta do gramado (a pista velha), com a mureta azul */
    { dentro: GRAMA, fora: I, reto: true, h: [0.15, 0.15], fileiras: 2, corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#a09d95' }] },
    { dentro: I, fora: F, reto: true, h: [1.2, 7], fileiras: 14, corredorFrente: 1.2,
      trechos: [
        /* À DIREITA (norte): a curva, com a boca de acesso */
        { ...DEGRAU, de: A(40, -51.5) - 360, ate: A(40, 51.5), fora: F_N, h: [1.2, 8.2], fileiras: 17, corredor: 16, vomitorios: { ...BOCA, em: [0.72] } },
        /* EM CIMA (oeste): a social, de cadeira azul e branca em blocos, coberta na metade de trás */
        { de: A(40, 51.5), ate: A(-40, 51.5), cor: AZ, cor2: BR, padrao: 'blocos', bloco: 10, blocoFileiras: 99, corEscada: '#d9d9d4', corredor: 10, escadaNaBorda: true, vomitorios: false, paredeAtras: true,
          corFachada: AZ, corMureta: AZ, parapeito: 2.4, h: [1.2, 8], cobertura: { h: 12.5, larg: 9.5, avanco: 0.6, cai: 0.8, cor: '#e3e3de', cor2: '#d6d6d1', listras: true, corTrelica: '#8f959c', corPilar: '#d9dce0' } },
        /* À ESQUERDA (sul): a outra curva, com as bocas */
        { ...DEGRAU, de: A(-40, 51.5), ate: A(-40, -51.5), corredor: 16, vomitorios: { ...BOCA, em: [0.2, 0.8] } },
        /* EMBAIXO (leste): a arquibancada de cimento descoberta */
        { ...DEGRAU, de: A(-40, -51.5), ate: A(40, -51.5), corredor: 11.5, escadaNaBorda: true, vomitorios: false }
      ] }
  ],
  fachada: { cor: AZ },
  /* os postes de luz, de fora das duas laterais */
  refletores: [[-34, 78, 22], [34, 78, 22], [-34, -76, 22], [34, -76, 22]],
  blocos: [
    /* os três bancos de reserva azuis, ao pé da social */
    ...[-23, -1, 19].map(u => ({ u, v: 40.5, w: 8.5, d: 2, h: 2, cor: AZ2 })),
    /* a caixa azul do placar, no alto da curva do norte */
    { u: 94.2, v: 0, w: 2, d: 7, h: 4.5, y: 8, cor: AZ },
    /* a escada listrada de vermelho, branco e azul no eixo do campo, na curva do sul, e a escada pintada do meio do leste */
    { u: -85.2, v: 0, w: 13, d: 1, h: 0.12, y: 4.2, cor: '#c93a35' }, { u: -85.2, v: 1, w: 13, d: 1, h: 0.12, y: 4.2, cor: BR }, { u: -85.2, v: -1, w: 13, d: 1, h: 0.12, y: 4.2, cor: AZ },
    /* as cabines e os camarotes de telhado claro, no alto da social */
    { u: 2, v: 67.5, w: 76, d: 3, h: 3, y: 8, cor: '#d9dadd' }
  ],
  /* a câmera de uma das fotos do dono: do alto, por trás da curva do sul */
  vista: [-150, 62, -6, -10, 0, 0],
  entorno: [
    /* em cima (oeste): a avenida com as vagas; embaixo (leste): o estacionamento; as ruas e as casas */
    { tipo: 'rua', de: [-140, 88], ate: [140, 88], larg: 14 }, { tipo: 'arvores', u: -75, v: 76, w: 20, d: 10, n: 4 }, { tipo: 'casas', u: 0, v: 110, nu: 16, nv: 1, passo: 15 },
    { tipo: 'estacionamento', u: -5, v: -84, w: 120, d: 22, cheio: 0.25 }, { tipo: 'casas', u: 0, v: -112, nu: 16, nv: 1, passo: 15 },
    { tipo: 'rua', de: [112, 88], ate: [112, -120], larg: 9 }, { tipo: 'casas', u: 132, v: -20, nu: 1, nv: 9, passo: 15 }, { tipo: 'arvores', u: -110, v: -30, w: 14, d: 60, n: 6 }
  ],
  jogo: { mandante1: [164, 196], mandante2: [250, 290], mandante3: [70, 110], visitante: [-20, 20], tunelMandante: 180, tunelVisitante: 0, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { independente_do_anapolis: 'mandante1' } }
};
