/* ETELVINO MENDONÇA (o Mendonção, Itabaiana, Sergipe) — pela foto de drone
   que o dono mandou (16/11/2026: "segue as imagens do estadio do itabaiana") e
   pelo satélite (o do Google). O rumo do campo, 170,3 graus, saiu do contorno do
   gramado no OpenStreetMap.
   No quadro o fundo do letreiro (norte) fica à ESQUERDA, o fundo do escudo
   pintado na grama (sul) à direita, a avenida e a tribuna coberta (oeste)
   EMBAIXO.
   Oval inteiro de arquibancada baixa de cimento (uns nove degraus), com a
   pista estreita de concreto ao pé da mureta:
   · o degrau pintado em BLOCOS AZUIS E VERMELHOS alternados, de uns 13 m, na
     volta toda;
   · do lado da avenida, pouco depois do meio, a TRIBUNA COBERTA pequena, de
     telhado azul-acinzentado;
   · o fundo do norte é mais fundo (uns 13 m) e, por fora, tem o muro branco com
     o letreiro O MENDONÇÃO; o muro de fora é branco na volta toda;
   · ao pé do fundo do norte, as três coberturas brancas dos túneis.
   ESTIMADO: as alturas, onde começa cada bloco de cor (a foto mostra a
   alternância, não a posição exata), a largura da tribuna (24 m; o satélite
   mostra o telhado com a sombra) e os postes de luz. As duas listras finas,
   azul e vermelha, do muro de fora não entraram.
   AS TORCIDAS (escolha minha, sem mapa de setores): a Jovem Tricolor no meio
   da lateral de frente pra tribuna; a visitante atrás do gol do sul. */
const RAD = Math.PI / 180;
const A = (u, v) => (Math.atan2(v, u) / RAD + 360) % 360;
const AZUL = '#2d5fb0', VERM = '#c9404f', BRANCO = '#ececea';
/* a beira da grama, a frente da arquibancada e o fundo (o contorno abre `d` metros pra fora) */
const C = d => ({ a: 81 + d, b: 43.3 + d, r: 40 + d });
const GRAMA = { a: 78, b: 40.3, r: 37 };
/* a tribuna coberta: de u = -9 a u = 15, do lado de baixo */
const T0 = A(-9, -43.3) - 360, T1 = A(15, -43.3) - 360;
const BLOCOS = { cor: AZUL, cor2: VERM, padrao: 'blocos', bloco: 7.6, semCadeiras: true, espelhoPintado: true, corredor: 0, vomitorios: false, parapeito: 1.2, corFachada: BRANCO };

export default {
  id: 'estadio-etelvino-mendonca', nome: 'Etelvino Mendonça', clubes: ['itabaiana'], norte: 170.3, vazado: 0.3, folga: 22,
  chao: { cor: '#8d8a83' },
  campo: { corMargem: '#4f9a55' },
  corMureta: BRANCO, alambrado: { cor: '#d9dcdf' },
  aneis: [
    /* a pista estreita de concreto, entre a grama e a mureta */
    { dentro: GRAMA, fora: C(0), h: [0.12, 0.12], fileiras: 2, corredorFrente: 0,
      trechos: [{ de: 0, ate: 360, tipo: 'passagem', cor: '#bdb9ad' }] },
    { dentro: C(0), fora: C(9.5), h: [1.4, 5.8], fileiras: 9, corredorFrente: 1.2,
      trechos: [
        /* do canto do norte até a tribuna, do lado da avenida */
        { de: -150, ate: T0, ...BLOCOS },
        /* a TRIBUNA COBERTA */
        { de: T0, ate: T1, cor: AZUL, cor2: '#e9e9e4', padrao: 'blocos', bloco: 1.2, corredor: 0, vomitorios: false, parapeito: 2.4, corFachada: BRANCO, pisoPintado: true,
          cobertura: { h: 9.6, larg: 10.2, avanco: 1.2, cai: 0.9, cor: '#6f86ad', cor2: '#647ba2', listras: true, corTrelica: '#d9dcdf', corPilar: '#c9404f' } },
        /* o resto da lateral da avenida, o fundo do sul e a lateral de cima */
        { de: T1, ate: 150, ...BLOCOS },
        /* o fundo do norte, mais fundo, com o letreiro por fora */
        { de: 150, ate: 210, ...BLOCOS, fora: C(13), h: [1.4, 7.4], fileiras: 13 }
      ] }
  ],
  fachada: { cor: BRANCO },
  refletores: [[-45, 56.5, 22], [0, 56.5, 22], [45, 56.5, 22], [-45, -57, 22], [48, -57, 22]],
  blocos: [
    /* o letreiro no muro branco do fundo do norte, virado pra fora */
    { u: -94.4, v: 0, w: 0.3, d: 26, h: 1.7, y: 2.4, cor: BRANCO, texto: 'O MENDONÇÃO', corTexto: '#1d2c5e', textoFace: true, giro: 180, textoLargura: 0.9, textoAltura: 0.62 },
    /* as três coberturas brancas dos túneis, ao pé do fundo do norte */
    { u: -68, v: 0, w: 11, d: 2.4, h: 2.2, cor: '#f1f1ee' },
    { u: -64, v: 22, w: 11, d: 2.4, h: 2.2, cor: '#f1f1ee', giro: -28 }, { u: -64, v: -22, w: 11, d: 2.4, h: 2.2, cor: '#f1f1ee', giro: 28 }
  ],
  /* a câmera da foto de drone do dono: do alto, por cima do fundo do letreiro, olhando o campo ao comprido */
  vista: [-150, 70, 6, 0, 0, 0],
  entorno: [
    { tipo: 'rua', de: [-170, -74], ate: [170, -74], larg: 18 }, { tipo: 'rua', de: [112, -170], ate: [112, 170], larg: 9 },
    { tipo: 'estacionamento', u: -128, v: 30, w: 44, d: 90 }, { tipo: 'estacionamento', u: 0, v: 88, w: 150, d: 36 },
    { tipo: 'casas', u: 0, v: -104, nu: 14, nv: 1, passo: 15 }, { tipo: 'casas', u: 140, v: 0, nu: 2, nv: 9, passo: 15 },
    { tipo: 'casas', u: 0, v: 128, nu: 14, nv: 1, passo: 15 }, { tipo: 'arvores', u: -104, v: -30, w: 10, d: 40, n: 4 }
  ],
  jogo: { mandante1: [75, 105], mandante2: [112, 138], mandante3: [42, 68], visitante: [-22, 22], tunelMandante: 172, tunelVisitante: 188, folgaPM: 3,
          fracao: { mandante1: 0.5, mandante2: 0.5, mandante3: 0.5, visitante1: 0.5, visitante2: 0.55, visitante3: 0.45 },
          torcidas: { jovem_tricolor: 'mandante1' } }
};
