/* ALMEIDÃO (Estádio José Américo de Almeida Filho, Botafogo/PB e Sousa, João
   Pessoa) — pelas duas fotos aéreas que o dono mandou (17/11/2026: "vamos pro
   Almeidão em João Pessoa que é muito similar [...] Veja as imagens"; uma de
   cima e uma oblíqua) e pelo satélite (o do Google). O rumo do campo, 0,7 grau,
   saiu do contorno do gramado no OpenStreetMap.
   No quadro a arquibancada da cobertura fica EM CIMA.
   Irmão do Amigão: oval em elipse, com o campo no fundo de uma bacia de grama e
   a pista de terra em volta dele, duas arquibancadas grandes em meia-lua nas
   laterais, num lance só, e os dois fundos inacabados.
   · As duas laterais são do MESMO CONCRETO BRANCO, com as bocas quadradas
     escuras (na primeira versão eu fiz a da cobertura azul: era a SOMBRA nas
     fotos; o dono corrigiu: "é da cor da outra, foi só a sombra");
   · a lateral de CIMA tem os quatro bancos de reserva ao pé e, da ponta da
     esquerda até passar do meio, por cima do alto dela, a COBERTURA escura em
     balanço, de nervuras claras;
   · a lateral de BAIXO tem, no meio, a RAMPA larga que desce da arquibancada
     pra grama;
   · os DOIS FUNDOS, atrás dos gols, são inacabados: a terra em degraus, tomada
     de mato (mais verde que no Amigão), com o caminho do corredor e os pilares
     das fundações.
   ESTIMADO: as alturas (as laterais sobem uns 17 m); a fundura da lateral da
   cobertura (o satélite a esconde debaixo do telhado; pus igual à outra, 35 m);
   onde ficam as bocas; os pilares dos fundos (as fotos mostram de
   longe; pus como no Amigão); as três torres de luz, do lado da lateral sem cobertura.
   AS TORCIDAS (escolha minha): a da casa no meio da lateral da cobertura, com
   o apoio na ponta dela e na outra lateral; a visitante na outra lateral, do
   lado oposto. Os fundos inacabados ficam vazios. */
const RAD = Math.PI / 180;
const BRANCA = '#dedcd5', BRANCA2 = '#d2d0c9', BRANCO = '#f0f0ec', TERRA = '#7f7d5c', MATO = '#5f8a4c';
/* a pista em volta do campo (retângulo de pontas redondas) e as elipses das arquibancadas */
const E = (a, b) => ({ a, b, cv: 0, forma: 'elipse' });
const PISTA_D = { a: 72, b: 46, r: 38 }, PISTA_F = { a: 77, b: 51, r: 43 };
const I = E(82, 65), F = E(118, 100);
/* onde começa e acaba cada lateral (graus, do meio do campo) e a cobertura */
const C0 = 23, C1 = 155, B0 = 206, B1 = 336, T0 = 70, T1 = 141;
/* um lance só, como no Amigão: o corredor horizontal do meio é a faixa clara pintada, e as bocas abrem em cima dele */
const noCorredor = (y, meia) => Math.abs(y - 0.5) < meia;
const DE_BRANCO = (x, y) => noCorredor(y, 0.02) ? '#efeeea' : null;
const INACABADO = (x, y) => noCorredor(y, 0.034) ? '#d6d5cc' : null;
const DEGRAU = { padrao: 'mosaico', mistura: 0.3, semCadeiras: true, espelhoPintado: true, corredor: 21, paredeAtras: true, parapeito: 1.4, corFachada: '#cfcdc4', corLado: '#d9d7cf' };
const ALVA = { ...DEGRAU, cor: BRANCA, cor2: BRANCA2, pinta: DE_BRANCO, corEscada: BRANCO, vomitorios: { f: 0.53, cada: 1, larg: 3.8, fundo: 3.6, cor: '#3a3b3e', corParapeito: BRANCO } };
const RUINA = { h: [1.4, 8.4], cor: MATO, cor2: TERRA, padrao: 'mosaico', mistura: 0.4, pinta: INACABADO, semCadeiras: true, corredor: 0, vomitorios: false, paredeAtras: true,
  corFachada: '#b9b6ab', corLado: '#b9b6ab', parapeito: 1.2 };
/* um ponto dos fundos inacabados: no ângulo `ang`, a fração `f` do pé ao alto */
const raio = (ang, c) => c.a * c.b / Math.hypot(c.b * Math.cos(ang * RAD), c.a * Math.sin(ang * RAD));
const PT = (ang, f) => { const r = raio(ang, I) + (raio(ang, F) - raio(ang, I)) * f; return [r * Math.cos(ang * RAD), r * Math.sin(ang * RAD)]; };
const FUNDOS = [[B1 - 360, C0], [C1, B0]];
const PILARES = FUNDOS.flatMap(([a0, a1], k) => [[0.14, 6], [0.3, 6], [0.68, 8], [0.86, 8]].flatMap(([f, passo], j) => { const out = [], r = raio((a0 + a1) / 2, I) + 36 * f, da = passo / r / RAD;
  for (let a = a0 + 1.8 + (j % 2) * da / 2, i = 0; a < a1 - 1.4; a += da, i++) { const [u, v] = PT(a, f), s = ((i * 7 + j * 3 + k * 5) % 5) / 5;
    out.push({ u, v, w: 0.55, d: 0.55, h: 1.5 + s * 0.9, y: 1.2 + 7 * f, cor: s > 0.5 ? '#d9d6cb' : '#c3c0b6', giro: a }); }
  return out; }));

export default {
  id: 'estadio-almeidao', nome: 'Almeidão', clubes: ['botafogo-pb', 'sousa'], norte: 0.7, vazado: 0.3, folga: 26,
  chao: { cor: '#b3a88c' },
  campo: { corMargem: '#5f9a50' },
  corMureta: BRANCO, alambrado: false, muro: { cor: '#d9d7cf' },
  aneis: [
    /* a pista de terra em volta do campo e a bacia de grama até o pé das arquibancadas */
    { dentro: PISTA_D, fora: PISTA_F, h: [0.1, 0.1], fileiras: 2, corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#a8977a' }] },
    { dentro: PISTA_F, fora: I, h: [0.12, 0.12], fileiras: 2, corredorFrente: 0, trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#5f9a50' }] },
    /* A VOLTA, um lance só: as duas laterais do mesmo concreto branco, terra e mato nos fundos, mais baixos */
    { dentro: I, fora: F, h: [2.4, 17.6], fileiras: 39, corredorFrente: 1.6,
      trechos: [
        { de: B1 - 360, ate: C0, ...RUINA }, { de: C0, ate: C1, ...ALVA }, { de: C1, ate: B0, ...RUINA }, { de: B0, ate: B1, ...ALVA }
      ] }
  ],
  fachada: { cor: '#cfcdc4' },
  /* a cobertura em balanço por cima do alto da lateral de cima: escura, de nervuras claras, mais alta na frente */
  coberturasAnel: [
    { dentro: E(103, 86), fora: E(133, 116), de: T0, ate: T1, n: 13, h: 21.5, cai: -3.2, cor: '#34363b', cor2: '#3d4045', corNervura: '#b9bbb8', larguraNervura: 0.5, corBaixo: '#5a5d63',
      beiral: [1.6, 1.2], corBeiral: '#2b2d31', pilares: { f: 0.62, base: 0, cor: '#d9d7cf', esp: 0.8, cada: 1, viga: true, espViga: 0.5, corViga: '#b9bbb8' } }
  ],
  refletores: [[-80, -106, 46], [-6, -116, 46], [72, -110, 46]],
  blocos: [
    /* os quatro bancos de reserva, ao pé da lateral da cobertura */
    ...[-31, -8, 12, 34].map(u => ({ u, v: 55.4, w: 10, d: 2.4, h: 2.2, cor: '#e9e9e4' })),
    /* a rampa larga que desce do meio da lateral de baixo pra grama */
    { u: 3, v: -62.5, w: 7.5, d: 14, h: 2.6, cor: '#cfcdc4' }, { u: 3, v: -62.5, w: 5, d: 14.4, h: 0.3, y: 2.6, cor: '#3a3b3e' },
    ...PILARES
  ],
  /* a câmera da foto oblíqua do dono: do alto, por trás do fundo da esquerda, com a cobertura à esquerda */
  vista: [-152, 70, -46, 6, 0, 6],
  entorno: [
    { tipo: 'rua', de: [-200, 150], ate: [200, 190], larg: 16 }, { tipo: 'rua', de: [-160, -200], ate: [-130, 200], larg: 12 },
    { tipo: 'estacionamento', u: -70, v: -150, w: 120, d: 50 }, { tipo: 'grama', u: 150, v: 20, w: 50, d: 160, cor: '#c9bd9a' },
    { tipo: 'arvores', u: 30, v: -128, w: 60, d: 14, n: 6 }, { tipo: 'predio', u: 150, v: -100, w: 30, d: 20, h: 6, cor: '#d4d7d9' }
  ],
  jogo: { mandante1: [88, 118], mandante2: [34, 62], mandante3: [300, 328], visitante: [212, 248], tunelMandante: 82, tunelVisitante: 98, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { jovem_do_botafogo_pb: 'mandante1', furia_do_botafogo_pb: 'mandante2', forca_alviverde: 'mandante1' } }
};
