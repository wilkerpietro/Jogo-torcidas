/* =========================================================
   A SEDE DA TORCIDA, NO JEITO DAS CONSTRUÇÕES NOVAS
   ---------------------------------------------------------
   A sede da planta (`sedeDaTorcida`, em dados/cena_estadio.js) é a
   sede andável da cena do dia de jogo: parede, porta e móvel em caixa
   lisa, que é o que a máscara de caminhada precisa. Aqui ela ganha o
   tratamento das construções novas (o bar da torcida, as casas da
   favela, o Atacadex): parede e piso com a textura do atlas, a
   fachada com rodapé, faixa e letreiro, janela de grade, verga e
   batente nas portas, telhado de fibrocimento — e cada cômodo
   mobiliado conforme o que ele é.

   AS PAREDES E AS PORTAS SÃO AS DA PLANTA. `planoDaSede` refaz a conta
   do `sedeDaTorcida` (os mesmos cômodos, os mesmos vãos, a mesma folha
   de porta) em coordenada local — u ao longo da fachada, v da fachada
   pro fundo, em unidade de mundo, pelo mesmo `eixos` da planta —, e o
   teste da planta em HTML confere parede por parede que ela bate. O
   que entra aqui é visual e não muda a caminhada: a janela, a verga, a
   janela de balcão do bar, a parede do pátio subindo até o telhado, e
   a mobília. O móvel da planta que BLOQUEIA a caminhada (a mesa e o
   armário da sede grande; a caixa d'água, as mesas, os armários e a
   estante do barracão) fica exatamente onde a planta põe, na medida
   dela; o resto é novo e não bloqueia nada ainda.

   NÍVEL 1, o barracão (12,9 × 9,3 m):
     PÁTIO        descoberto: os colchões do aliado, a caixa d'água e o
                  tanque, a churrasqueira de tijolo, a mesa de plástico,
                  o varal, o banco, o mastro e a faixa na parede;
     PATRIMÔNIO   o armário do material com os troféus em cima, a
                  estante de aço com bandeira enrolada, os surdos, o
                  mastro de bandeira e as caixas;
     PRESIDÊNCIA  a mesa no canto (a da planta) com o computador, a
                  cadeira de escritório, o armário, o sofá, o mural, a
                  bandeira na parede e o ar-condicionado.
   NÍVEL 3, a sede grande (22 × 12,8 m):
     SECRETARIA   a mesa de atendimento com computador, as cadeiras de
                  quem chega, o arquivo de aço, a estante de pasta, o
                  mural, o bebedouro e o ar;
     BAR          a janela de balcão pro salão, o balcão, a prateleira
                  de garrafa, a geladeira, o freezer e o engradado;
     BANHEIRO     azulejo até 1,60 m, dois boxes com vaso, dois
                  mictórios, a pia de duas cubas com espelho e a janela
                  de tijolo de vidro;
     ALMOXARIFADO as estantes de aço cheias (caixa, bandeira, surdo), os
                  surdos no chão, os mastros encostados no canto;
     CORREDOR     o capacho, o extintor e o quadro de aviso;
     SALÃO        o barrado na cor da torcida, a sinuca, a mesa comprida
                  com as cadeiras de plástico, a bateria (os surdos no
                  pé), a faixa com o nome da torcida, a TV, os bancos,
                  a pilha de cadeira e as banquetas do balcão do bar;
     ALOJAMENTO   três beliches, colchões no chão e o armário de aço;
     DIRETORIA    a mesa do diretor (a da planta) com o computador e as
                  cadeiras, a estante de troféus, a mesa de reunião com
                  seis cadeiras, a TV, a bandeira e o ar;
     DEPÓSITO     estantes de aço, faixa dobrada, colchão empilhado,
                  caixas, o armário (o da planta) com troféu velho em
                  cima e o bumbo velho.

   SEDE VAGA (nenhuma torcida, ou torcida de sede nível 0): a mesma
   construção em cor de reboco, sem nada dentro, a porta de enrolar
   abaixada na entrada, as portas fechadas e o telhado.

   `montarSede` devolve os blocos no mundo (casas, grades e o telhado à
   parte, que quem mostra pode esconder), os decalques com texto (o
   letreiro, as placas das salas, os escudos e as faixas: quem desenha
   o texto é quem mostra) e a planta baixa em retângulos.

   A PASSAGEM (25/09/2026). O boneco que anda a pé no cenário 3D da
   planta bate em toda a mobília, e a folha das portas das salas da
   frente abre pra dentro, com 1,5 m: o que fica logo depois da ponta
   dela vira parede. Na secretaria a mesa e as cadeiras de quem chega
   foram pro lado oposto ao da folha, e no banheiro o box ficou 0,90 ×
   1,25 m — os dois tinham passagem de 55 cm. `conferir_passagem.mjs`
   (em ferramentas/planta_html) prova que em toda sede dos três mapas
   um corpo de 70 cm entra em todo cômodo; mexeu na mobília, rode ele.
   ========================================================= */
import { Construtor, METRO, arSplit } from './construtor3d.js';

const M = METRO;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const PISO = 0.09;   // o piso, na altura do `piso` da planta (1,7 unidade)

const CLARO = '#d9d3c4', CREME = '#ede6d4', BRANCO = '#f3f2ee', LOUCA = '#f4f4f1', MADEIRA = '#7a4e2e',
      MADEIRA_CLARA = '#a47a4e', ACO = '#8e959b', ACO_ESCURO = '#565d63', PRETO = '#26282b', GRANITO = '#3b3936',
      OURO = '#d4a93a', PAPELAO = '#b88a50', FELTRO = '#2e7a3a', TELA = '#2f6a3c', CIMENTO = '#a8a396',
      SALAO = '#b7b2a4', RODAPE = '#8a7d6a', PAREDE_SALA = '#efe8d6', AZUL_COLCHAO = '#5a7fb0', ACO_ARMARIO = '#6f7a82',
      ACO_DENTRO = '#c3c8cb';
export const NEUTRO_SEDE = { cor: '#d6d1c4', cor2: '#c4beb0', cor3: '#8f8a7f' };

/* a tinta da torcida no reboco: o preto puro vira buraco no Lambert e o
   branco puro estoura (a mesma regra do bar da torcida) */
function viva(c) {
  const n = parseInt(String(c || '#888888').slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
  if (Math.max(r, g, b) < 0x26) return '#262626';
  if (Math.min(r, g, b) > 0xf2) return '#f2f1ec';
  return c;
}
const luz = hex => { const n = parseInt(String(hex).slice(1), 16); return 0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255); };
const legivel = hex => luz(hex) > 150 ? '#1a1a1a' : '#f6f3ea';

/* O REFERENCIAL DA PLANTA: o mesmo `eixos` do sedeDaTorcida — u ao longo
   da fachada, v da fachada pro fundo. Em duas das quatro frentes ele é
   espelhado (a sede de frente pro sul é a da frente pro norte vista no
   espelho), e é assim que a planta monta. */
export function eixosDaSede(a, frente) {
  const X0 = a.x0, X1 = a.x1, Y0 = a.y0, Y1 = a.y1;
  if (frente === 'n') return { L: X1 - X0, A: Y1 - Y0, pt: (u, v) => [X0 + u, Y0 + v] };
  if (frente === 's') return { L: X1 - X0, A: Y1 - Y0, pt: (u, v) => [X0 + u, Y1 - v] };
  if (frente === 'o') return { L: Y1 - Y0, A: X1 - X0, pt: (u, v) => [X0 + v, Y0 + u] };
  return { L: Y1 - Y0, A: X1 - X0, pt: (u, v) => [X1 - v, Y0 + u] };
}

/* =======================================================
   A PLANTA DA SEDE — a conta do sedeDaTorcida, em u e v
   ======================================================= */
const TIPO = { BAR: 'bar', 'PATRIMÔNIO': 'patrimonio', 'PRESIDÊNCIA': 'presidencia', HOSPEDAGEM: 'hospedagem',
               MARKETING: 'marketing', 'SETOR CRIATIVO': 'criativo', GARAGEM: 'garagem', ACADEMIA: 'academia', VARANDA: 'varanda' };
/* O NÍVEL QUE A FATIA COMPORTA: o terreno estreito demais pro nível pedido
   fica com o de baixo (o 5 só cabe no quarteirão inteiro, uns 30 m; o 3 e
   o 4, no terreno de 22 m; o 2, na fatia de 16 m) */
const FRENTE_MIN = { 2: 12, 3: 17, 4: 19.5, 5: 28.5 };
export function nivelQueCabe(L, nivel) {
  let N = Math.max(1, Math.min(5, Math.round(nivel || 1)));
  while (N > 1 && L < FRENTE_MIN[N] * M) N--;
  return N;
}
export function planoDaSede(L, A, nivel, lado = 'mandante') {
  const N = nivelQueCabe(L, nivel);
  return N === 1 ? planoNivel1(L, A, lado) : N === 5 ? planoNivel5(L, A) : planoNovo(L, A, N);
}
function planoNivel1(L, A, lado) {
  const N = 1;
  const m = v => Math.round(v * M);
  const PAR = 9, MF = 13, F0 = 2.5, VAO = 30, PORTAO = 56, ALT_PORTA = Math.round(2.10 * M);
  const MURO = 66, ALT_EXT = 60, ALT = m(2.60);
  const DF = Math.min(96, Math.max(58, A * 0.30)), DB = Math.min(104, Math.max(60, A * 0.32));
  const vF = MF + DF, vB = A - DB, uDiv = Math.round(L * 0.58);
  const eixo = (PAR + uDiv) / 2, g0 = eixo - PORTAO / 2, g1 = eixo + PORTAO / 2;
  const paredes = [], comodos = [], portas = [];
  const parede = (u0, u1, v0, v1, alt, o = {}) => {
    const w = Object.assign({ u0, u1, v0, v1, alt, ao: u1 - u0 >= v1 - v0 ? 'u' : 'v', vaos: [] }, o);
    paredes.push(w);
    return w;
  };
  /* o vão da porta e a folha dela (`folhasNoVao` da planta). Na planta o
     vão sobe até o alto da parede; aqui ele para na verga, que é visual */
  const porta = (w, c, larg, o = {}) => {
    const tipo = o.tipo || 'porta';
    w.vaos.push({ a0: c - larg / 2, a1: c + larg / 2, b0: 0, b1: o.b1 || ALT_PORTA + 2, tipo });
    portas.push({ ao: w.ao, c, w: larg, parede: w, abre: o.abre || 1, vidro: !!o.vidro, nome: o.nome || null, tipo });
  };
  const janela = (w, c, larg, b0, b1, k) =>
    w.vaos.push({ a0: c - larg * M / 2, a1: c + larg * M / 2, b0: b0 * M, b1: b1 * M, tipo: 'janela', k });
  const comodo = (nome, u0, u1, v0, v1, pt, tipo) => {
    const c = { tipo: tipo || TIPO[nome], nome, u0, u1, v0, v1, porta: pt };
    comodos.push(c);
    return c;
  };

  const fachada = parede(0, L, F0, MF, MURO, { fachada: true, ext: true });
  porta(fachada, eixo, PORTAO, { tipo: 'portao', vidro: true, abre: 1, b1: 53 });
  parede(0, PAR, 0, A, ALT_EXT, { ext: true });
  const leste = parede(L - PAR, L, 0, A, ALT_EXT, { ext: true });
  const fundo = parede(PAR, L - PAR, A - PAR, A, ALT_EXT, { ext: true });
  const vDiv = MF + Math.round((A - MF - PAR) * 0.46);
  const uS0 = uDiv + PAR, uS1 = L - PAR, vPa0 = MF, vPa1 = vDiv, vPr0 = vDiv + PAR, vPr1 = A - PAR;
  /* a parede entre o pátio e as salas é a fachada delas pro pátio: no
     modelo ela sobe até o telhado (na planta para em 2,60, e dali pra
     cima ninguém anda) */
  const salas = parede(uDiv, uS0, MF, A - PAR, ALT, { fachadaPatio: true, altModelo: MURO - 1 });
  porta(salas, (vPa0 + vPa1) / 2, VAO, { abre: 1, nome: 'PATRIMÔNIO' });
  porta(salas, (vPr0 + vPr1) / 2, VAO, { abre: 1, nome: 'PRESIDÊNCIA' });
  parede(uS0, uS1, vDiv, vPr0, ALT);
  comodo('PÁTIO', PAR, uDiv, MF, A - PAR, { lado: 'v0', c: eixo, w: PORTAO }, 'patio');
  comodo('PATRIMÔNIO', uS0, uS1, vPa0, vPa1, { lado: 'u0', c: (vPa0 + vPa1) / 2, w: VAO });
  comodo('PRESIDÊNCIA', uS0, uS1, vPr0, vPr1, { lado: 'u0', c: (vPr0 + vPr1) / 2, w: VAO });
  janela(leste, vPr0 + (vPr1 - vPr0) * 0.28, 1.1, 1.2, 2.2, 'jan_grade');
  janela(fundo, uS0 + (uS1 - uS0) * 0.62, 1.1, 1.15, 2.05, 'jan_grade');
  const teto = [{ u0: uDiv, u1: L, v0: MF, v1: A, agua: 'uma' }];
  const mastro = { u: uDiv - 16, v: MF + 20, base: 0, alt: 112 };
  return { N, L, A, PAR, MF, F0, VAO, PORTAO, ALT_PORTA, MURO, ALT_EXT, ALT, vF, vB, uDiv, eixo, g0, g1,
           paredes, comodos, portas, teto, mastro, lado };
}

/* =======================================================
   OS NÍVEIS 2 A 4 (o dono, 30/09/2026): "O pátio sempre vai ser a maior
   área da sede, os compartimentos ficam ao redor dele." O terreno é o
   quarteirão de sempre, de 12,8 m de fundo, então o pátio pega o fundo
   inteiro e os cômodos ficam em COLUNAS dos dois lados dele, cada um com
   a porta pro pátio (a coluna de cá, A, e a de lá, B); o BAR é o da
   frente da coluna A, com a porta pra rua e sem porta pro pátio; a
   GARAGEM, na ponta oeste, pega o fundo inteiro também (o ônibus entra
   de ré) e só abre pra rua.

     nível 2 (fatia de 16,2 m)  pátio (treino improvisado) · B: marketing,
                                patrimônio, presidência
     nível 3 (terreno, 22 m)    A: bar, hospedagem · pátio (o treino
                                maior) · B: marketing, patrimônio,
                                presidência
     nível 4 (terreno, 22 m)    garagem de 1 ônibus · A: bar, hospedagem
                                maior · pátio, com a ACADEMIA no fundo
                                dele (o treino sai do pátio e vira sala)
                                · B: marketing, patrimônio, presidência
                                com mais coisa

   O nível 5 é de dois andares (planoNivel5, mais abaixo). O pátio fica
   sempre maior que a garagem e que qualquer cômodo. O que muda por nível
   de uma coluna pra outra é o fundo de cada cômodo (em m; 0 fica com o
   resto); `academia` é o fundo da academia, no fundo do pátio.
   ======================================================= */
const NIVEIS = {
  2: { baias: 0, colA: 0, colB: 5.4, A: [], B: [['MARKETING', 2.8], ['PATRIMÔNIO', 3.2], ['PRESIDÊNCIA', 0]] },
  3: { baias: 0, colA: 3.6, colB: 4.6, A: [['BAR', 4.3], ['HOSPEDAGEM', 0]], B: [['MARKETING', 2.7], ['PATRIMÔNIO', 3.1], ['PRESIDÊNCIA', 0]] },
  4: { baias: 1, colA: 3.9, colB: 4.4, A: [['BAR', 4.3], ['HOSPEDAGEM', 0]], B: [['MARKETING', 2.5], ['PATRIMÔNIO', 2.6], ['PRESIDÊNCIA', 0]], academia: 3.4 }
};
/* O CANTEIRO DE UMA PLANTA: as listas e quem põe parede, porta, janela e
   cômodo nelas (a medida em unidade de planta; a da janela em m) */
function canteiro(ALT_PORTA) {
  const paredes = [], comodos = [], portas = [];
  const parede = (u0, u1, v0, v1, alt, o = {}) => {
    const w = Object.assign({ u0, u1, v0, v1, alt, ao: u1 - u0 >= v1 - v0 ? 'u' : 'v', vaos: [] }, o);
    paredes.push(w);
    return w;
  };
  const porta = (w, c, larg, o = {}) => {
    const tipo = o.tipo || 'porta';
    w.vaos.push({ a0: c - larg / 2, a1: c + larg / 2, b0: 0, b1: o.b1 || ALT_PORTA + 2, tipo });
    if (tipo === 'porta' || tipo === 'portao') portas.push({ ao: w.ao, c, w: larg, parede: w, abre: o.abre || 1, vidro: !!o.vidro, nome: o.nome || null, tipo });
  };
  const janela = (w, c, larg, b0, b1, k) =>
    w.vaos.push({ a0: c - larg * M / 2, a1: c + larg * M / 2, b0: b0 * M, b1: b1 * M, tipo: 'janela', k });
  const comodo = (nome, u0, u1, v0, v1, pt, tipo) => {
    const c = { tipo: tipo || TIPO[nome], nome, u0, u1, v0, v1, porta: pt };
    comodos.push(c);
    return c;
  };
  return { paredes, comodos, portas, parede, porta, janela, comodo };
}
function planoNovo(L, A, N) {
  const m = v => Math.round(v * M);
  const PAR = 9, MF = 13, F0 = 2.5, VAO = 30, PORTAO = 56, ALT_PORTA = Math.round(2.10 * M);
  const MURO = 72, ALT_EXT = 64, ALT = m(2.75);
  /* a garagem é um galpão mais alto: o ônibus tem 3,9 m com o ar em cima */
  const G_ALT = m(4.9), G_MURO = m(5.3), G_PORTA = m(4.3);
  const V0 = MF, V1 = A - PAR, U1 = L - PAR;
  const { paredes, comodos, portas, parede, porta, janela, comodo } = canteiro(ALT_PORTA), janelasPatio = [];
  const K = NIVEIS[N], baia = m(3.6);
  /* AS FAIXAS AO LONGO DA FACHADA: garagem, coluna A, pátio, coluna B */
  let u = PAR;
  const gar = K.baias ? { u0: u, u1: u + K.baias * baia } : null;
  if (gar) u = gar.u1 + PAR;
  const colA = K.colA ? { u0: u, u1: u + m(K.colA) } : null;
  if (colA) u = colA.u1 + PAR;
  const colB = { u0: U1 - m(K.colB), u1: U1 };
  const pat = { u0: u, u1: colB.u0 - PAR };
  const eixo = Math.round((pat.u0 + pat.u1) / 2), g0 = eixo - PORTAO / 2, g1 = eixo + PORTAO / 2;
  /* onde o pátio acaba (no nível 4, na parede da academia): a porta de cada
     sala abre no trecho dele */
  const vPat1 = K.academia ? V1 - m(K.academia) - PAR : V1;

  /* ---- a casca: a fachada (a da garagem mais alta), os lados e o fundo ---- */
  const fachG = gar ? parede(0, gar.u1 + PAR, F0, MF, G_MURO, { fachada: true, ext: true }) : null;
  const fachada = parede(gar ? gar.u1 + PAR : 0, L, F0, MF, MURO, { fachada: true, ext: true });
  porta(fachada, eixo, PORTAO, { tipo: 'portao', vidro: true, abre: 1, b1: 53 });
  parede(0, PAR, 0, A, gar ? G_ALT : ALT_EXT, { ext: true });
  parede(L - PAR, L, 0, A, ALT_EXT, { ext: true });
  const fundoG = gar ? parede(PAR, gar.u1 + PAR, A - PAR, A, G_ALT, { ext: true }) : null;
  const fundo = parede(gar ? gar.u1 + PAR : PAR, L - PAR, A - PAR, A, ALT_EXT, { ext: true });

  /* ---- A GARAGEM: uma baia por ônibus, com o portão de grade (pela grade
     a rua vê o ônibus), mais largo que o ônibus (2,55 m), e o ônibus de
     ré, com a frente pra rua ---- */
  const vagas = [];
  if (gar) {
    parede(gar.u1, gar.u1 + PAR, MF, V1, G_ALT);
    for (let i = 0; i < K.baias; i++) {
      const c = gar.u0 + (i + 0.5) * baia;
      porta(fachG, c, Math.min(baia - m(0.2), m(3.2)), { tipo: 'garagem', b1: G_PORTA });
      vagas.push({ u: c, v0: MF, v1: V1 });
    }
    comodo('GARAGEM', gar.u0, gar.u1, MF, V1, { lado: 'v0', c: (gar.u0 + gar.u1) / 2, w: baia }, 'garagem');
    for (let i = 0; i < K.baias; i++) janela(fundoG, gar.u0 + (i + 0.5) * baia, 1.2, 3.3, 3.9, 'basc');
  }

  /* ---- AS COLUNAS: os cômodos de frente pro fundo, a parede do pátio
     (a fachada deles pro pátio, que sobe até o telhado) com a porta de
     cada um, e as paredes entre eles ---- */
  const coluna = (col, lista, ladoDaPorta) => {
    const wP = ladoDaPorta === 'u1' ? parede(col.u1, col.u1 + PAR, MF, V1, ALT, { fachadaPatio: true, altModelo: MURO - 1 })
                                    : parede(col.u0 - PAR, col.u0, MF, V1, ALT, { fachadaPatio: true, altModelo: MURO - 1 });
    let v = V0;
    lista.forEach(([nome, d], i) => {
      const v1 = d && i < lista.length - 1 ? v + m(d) : V1;
      const tipo = TIPO[nome];
      if (tipo === 'bar') {
        /* O BAR: a porta de enrolar pra rua, do lado de cá (o de lá fica pra
           mesa do pagode), sem porta pro pátio — só o basculante lá no alto */
        const larg = Math.min(m(2.0), col.u1 - col.u0 - m(2.2)), c = col.u0 + m(0.25) + larg / 2;
        porta(fachada, c, larg, { tipo: 'bar', b1: m(2.55) });
        comodo(nome, col.u0, col.u1, v, v1, { lado: 'v0', c, w: larg }, tipo);
        janela(wP, (v + v1) / 2, 0.9, 1.75, 2.3, 'basc');
      } else {
        /* a porta perto da frente do cômodo (o fundo fica pra mobília), e a
           janela de grade do lado dela, pro pátio */
        const cP = Math.min(v + VAO / 2 + m(0.35), (v + v1) / 2, vPat1 - VAO / 2 - m(0.12));
        porta(wP, cP, VAO, { abre: ladoDaPorta === 'u1' ? -1 : 1, nome });
        comodo(nome, col.u0, col.u1, v, v1, { lado: ladoDaPorta, c: cP, w: VAO }, tipo);
        const j = cP + VAO / 2 + m(0.9);
        if (j + m(0.7) < v1) janelasPatio.push([wP, j, tipo]);
      }
      if (i < lista.length - 1) parede(col.u0, col.u1, v1, v1 + PAR, ALT);
      v = v1 + PAR;
    });
    return wP;
  };
  if (colA) coluna(colA, K.A, 'u1');
  coluna(colB, K.B, 'u0');
  for (const [w, j, tipo] of janelasPatio)
    if (tipo === 'patrimonio' || tipo === 'garagem') janela(w, j, 0.7, 1.7, 2.3, 'basc');
    else janela(w, j, 1.1, 1.1, 2.15, 'jan_grade');
  /* A ACADEMIA (o nível 4), no fundo do pátio: a parede dela é a fachada
     pro pátio, com a porta no eixo do portão (quem entra na sede vê a
     academia lá no fundo) e o vidro dos dois lados; o pátio acaba nela */
  const lp = pat.u1 - pat.u0;
  if (K.academia) {
    const vA = V1 - m(K.academia);
    const wA = parede(pat.u0, pat.u1, vPat1, vA, ALT, { fachadaPatio: true, altModelo: MURO - 1 });
    porta(wA, eixo, VAO, { abre: 1, nome: 'ACADEMIA' });
    const lj = Math.min(1.8, (lp / 2 - VAO / 2 - m(1.9)) / M);
    if (lj > 0.8) for (const d of [-1, 1]) janela(wA, eixo + d * (VAO / 2 + m(0.35) + lj * M / 2), lj, 0.9, 2.2, 'jan_alu4');
    comodo('ACADEMIA', pat.u0, pat.u1, vA, V1, { lado: 'v0', c: eixo, w: VAO }, 'academia');
    janela(fundo, (pat.u0 + pat.u1) / 2, Math.min(3.0, lp / M * 0.35), 1.9, 2.5, 'basc');
  }
  comodo('PÁTIO', pat.u0, pat.u1, MF, vPat1, { lado: 'v0', c: eixo, w: PORTAO }, 'patio');

  /* ---- as janelas da rua: a da sala da frente da coluna B na fachada, as
     do fundo dos dois cômodos de trás, e o cobogó no muro do fundo do pátio ---- */
  /* (o marketing não tem janela pra rua: as paredes dele são dos quadros) */
  const frenteB = comodos.find(c => c.u0 === colB.u0 && c.v0 === MF);
  if (frenteB && frenteB.tipo !== 'marketing') janela(fachada, (colB.u0 + colB.u1) / 2, 1.4, 1.0, 2.2, 'jan_grade');
  for (const col of [colA, colB]) {
    if (!col) continue;
    const c = comodos.find(k => k.u0 === col.u0 && k.v1 === V1);
    if (c && c.tipo !== 'bar' && c.tipo !== 'marketing') janela(fundo, (col.u0 + col.u1) / 2, c.tipo === 'hospedagem' ? 0.8 : 1.2, c.tipo === 'hospedagem' ? 1.6 : 1.15, 2.2, c.tipo === 'hospedagem' ? 'basc' : 'jan_grade');
  }
  if (!K.academia && lp > m(4)) janela(fundo, (pat.u0 + pat.u1) / 2, Math.min(3.0, lp / M * 0.35), 1.9, 2.5, 'cobogo');

  /* ---- O TELHADO: fibrocimento em cada bloco coberto (as colunas, a
     garagem e a academia), com a platibanda em volta — a parede do pátio e
     as de fora passam dele, e a água cai pro lado de fora. O pátio é
     descoberto ---- */
  const teto = [];
  const aba = (col, cai, alto, queda, v0 = MF, v1 = V1) => teto.push({ u0: col.u0, u1: col.u1, v0, v1, agua: 'plat', cai, y0: alto, y1: alto - queda });
  if (gar) aba(gar, '-u', G_ALT - 1.5, m(0.5));
  if (colA) aba(colA, '-u', ALT_EXT - 1.5, m(0.4));
  aba(colB, '+u', ALT_EXT - 1.5, m(0.4));
  if (K.academia) aba(pat, '+v', ALT_EXT - 1.5, m(0.35), V1 - m(K.academia), V1);

  /* o mastro no pátio, perto do portão; o letreiro em cima do portão */
  const mastro = { u: pat.u0 + m(0.7), v: MF + m(1.1), base: 0, alt: m(6.2) };
  const letreiro = { u: eixo, y: 3.3, alt: 0.55, larg: Math.min((lp - m(0.8)) / M, 5.6) };
  /* as duas listras da torcida no cimento, no fundo do pátio */
  const listras = [[pat.u0 + 10, pat.u1 - 10, vPat1 - 20, vPat1 - 13, 'cor2'], [pat.u0 + 10, pat.u1 - 10, vPat1 - 11, vPat1 - 4, 'cor3']];
  return { N, novo: true, L, A, PAR, MF, F0, VAO, PORTAO, ALT_PORTA, MURO, ALT_EXT, ALT, G_ALT, G_MURO, G_PORTA,
           eixo, g0, g1, gar, colA, colB, pat, baia, vagas, paredes, comodos, portas, teto, mastro, letreiro, listras, lado: 'mandante' };
}

/* =======================================================
   O NÍVEL 5, EM DOIS ANDARES (o dono, 30/09/2026: "Se fizer a sede
   nível 5 com dois andares não fica melhor? [...] Quando falo dois
   andares é um térreo e um andar"; e a academia de treino dentro da sede
   nos níveis 4 e 5). O quarteirão inteiro (uns 30 m):
     térreo    a GARAGEM de três ônibus (baias de 3,3 m: o motorista
               desce) · o PÁTIO, descoberto, a maior área da sede (uns
               146 m²) · a coluna de lá: o BAR (a porta pra rua), o
               PATRIMÔNIO e a PRESIDÊNCIA, com a porta pro pátio
     1º andar  em cima da garagem, a ACADEMIA (o ringue, os sacos, os
               pesos) e a HOSPEDAGEM grande; em cima da coluna de lá, o
               MARKETING e o SETOR CRIATIVO; e a VARANDA em U em volta do
               pátio (os dois lados e a passarela da frente, por cima do
               portão), de onde se entra em cada sala
   A escada de concreto sobe encostada no muro do fundo do pátio e chega
   na ponta de trás da varanda de cá. A laje entre os andares (20 cm)
   aparece na fachada como a faixa entre eles; os pilares seguram a
   varanda. O 1º andar é outra planta (`andar`), no referencial dela (o
   piso em 0): quem monta ergue ela até `h1`.
   ======================================================= */
export const ANDAR_5 = { h1: 4.7, laje: 0.2, pe: 2.9, plat: 3.4 };   // m: o piso de cima, a laje, o pé-direito e a platibanda de cima
function planoNivel5(L, A) {
  const N = 5, m = v => Math.round(v * M);
  const PAR = 9, MF = 13, F0 = 2.5, VAO = 30, PORTAO = 56, ALT_PORTA = Math.round(2.10 * M);
  const H1 = m(ANDAR_5.h1), TERREO = H1 - m(ANDAR_5.laje);
  /* no térreo tudo sobe até o fundo da laje (a garagem pede 4,3 m de pé-direito) */
  const MURO = TERREO, ALT_EXT = TERREO, ALT = TERREO, G_ALT = TERREO, G_MURO = TERREO, G_PORTA = m(4.0);
  const V1 = A - PAR, U1 = L - PAR;
  const T = canteiro(ALT_PORTA);
  const baia = m(3.3), nB = 3, VAR = m(1.4), BR = m(1.8), ESC = m(1.1);
  const gar = { u0: PAR, u1: PAR + nB * baia };
  const colB = { u0: U1 - m(6.0), u1: U1 };
  const pat = { u0: gar.u1 + PAR, u1: colB.u0 - PAR };
  const eixo = Math.round((pat.u0 + pat.u1) / 2), g0 = eixo - PORTAO / 2, g1 = eixo + PORTAO / 2;

  /* ---- O TÉRREO: a casca até a laje ---- */
  const fachada = T.parede(0, L, F0, MF, TERREO, { fachada: true, ext: true });
  T.porta(fachada, eixo, PORTAO, { tipo: 'portao', vidro: true, abre: 1, b1: 53 });
  const oeste = T.parede(0, PAR, 0, A, TERREO, { ext: true });
  const leste = T.parede(L - PAR, L, 0, A, TERREO, { ext: true });
  const fundo = T.parede(PAR, L - PAR, A - PAR, A, TERREO, { ext: true });
  /* a garagem: três baias, o portão de grade de cada uma (3 m, o ônibus
     passa com folga), o basculante alto no fundo e no lado */
  const vagas = [];
  T.parede(gar.u1, gar.u1 + PAR, MF, V1, TERREO);
  for (let i = 0; i < nB; i++) {
    const c = gar.u0 + (i + 0.5) * baia;
    T.porta(fachada, c, baia - m(0.3), { tipo: 'garagem', b1: G_PORTA });
    vagas.push({ u: c, v0: MF, v1: V1 });
    T.janela(fundo, c, 1.2, 3.3, 3.9, 'basc');
  }
  for (const f of [0.3, 0.7]) T.janela(oeste, MF + (V1 - MF) * f, 1.4, 3.2, 3.9, 'basc');
  T.comodo('GARAGEM', gar.u0, gar.u1, MF, V1, { lado: 'v0', c: (gar.u0 + gar.u1) / 2, w: baia }, 'garagem');
  /* a coluna de lá: o bar na frente (a porta de enrolar pra rua, a janela do
     lado), o patrimônio e a presidência com a porta pro pátio */
  const wB = T.parede(colB.u0 - PAR, colB.u0, MF, V1, TERREO, { fachadaPatio: true });
  const vBar = MF + m(4.0), larg = m(2.2), cBar = colB.u0 + m(0.3) + larg / 2;
  T.porta(fachada, cBar, larg, { tipo: 'bar', b1: m(2.55) });
  T.comodo('BAR', colB.u0, colB.u1, MF, vBar, { lado: 'v0', c: cBar, w: larg }, 'bar');
  T.janela(wB, (MF + vBar) / 2, 0.9, 1.75, 2.3, 'basc');
  T.janela(leste, (MF + vBar) / 2 + m(0.4), 1.2, 1.1, 2.1, 'jan_grade');
  T.parede(colB.u0, colB.u1, vBar, vBar + PAR, TERREO);
  const vPa0 = vBar + PAR, vPa1 = vPa0 + m(2.7), vPr0 = vPa1 + PAR;
  for (const [nome, v0, v1] of [['PATRIMÔNIO', vPa0, vPa1], ['PRESIDÊNCIA', vPr0, V1]]) {
    const cP = Math.min(v0 + VAO / 2 + m(0.35), (v0 + v1) / 2);
    T.porta(wB, cP, VAO, { abre: 1, nome });
    T.comodo(nome, colB.u0, colB.u1, v0, v1, { lado: 'u0', c: cP, w: VAO });
    const j = cP + VAO / 2 + m(0.9);
    if (j + m(0.7) < v1) nome === 'PATRIMÔNIO' ? T.janela(wB, j, 0.7, 1.7, 2.3, 'basc') : T.janela(wB, j, 1.1, 1.1, 2.15, 'jan_grade');
  }
  T.parede(colB.u0, colB.u1, vPa1, vPa1 + PAR, TERREO);
  T.janela(leste, (vPa0 + vPa1) / 2, 0.7, 1.7, 2.3, 'basc');
  T.janela(leste, (vPr0 + V1) / 2, 1.2, 1.1, 2.1, 'jan_grade');
  T.janela(fundo, (colB.u0 + colB.u1) / 2, 1.2, 1.15, 2.2, 'jan_grade');
  T.comodo('PÁTIO', pat.u0, pat.u1, MF, V1, { lado: 'v0', c: eixo, w: PORTAO }, 'patio');

  /* ---- a laje (a do 1º andar: os dois blocos, a varanda dos lados e a
     passarela da frente), os pilares da varanda e a escada ---- */
  const lajes = [{ u0: 0, u1: pat.u0 + VAR, v0: F0, v1: A }, { u0: pat.u1 - VAR, u1: L, v0: F0, v1: A },
                 { u0: pat.u0 + VAR, u1: pat.u1 - VAR, v0: F0, v1: MF + BR }];
  const pl = m(0.13);
  const pilares = [], uW = pat.u0 + VAR - pl, uE = pat.u1 - VAR + pl, vB = MF + BR - pl;
  for (const v of [vB, (vB + V1 - ESC) / 2, V1 - ESC - m(0.2)]) pilares.push({ u: uW, v });
  for (const v of [vB, (vB + V1) / 2, V1 - pl]) pilares.push({ u: uE, v });
  for (const du of [-m(2.6), m(2.6)]) pilares.push({ u: eixo + du, v: vB });
  const escada = { u0: pat.u0 + VAR, u1: pat.u0 + VAR + m(7.0), v0: V1 - ESC, v1: V1, sobe: '-u', y1: H1 };

  /* ---- O 1º ANDAR, no referencial dele (o piso em 0) ---- */
  const S = canteiro(ALT_PORTA), PE = m(ANDAR_5.pe), PLAT = m(ANDAR_5.plat);
  const fachada2 = S.parede(0, L, F0, MF, PLAT, { fachada: true, ext: true });
  const oeste2 = S.parede(0, PAR, 0, A, PLAT, { ext: true });
  const leste2 = S.parede(L - PAR, L, 0, A, PLAT, { ext: true });
  const fundoW = S.parede(PAR, pat.u0, A - PAR, A, PLAT, { ext: true });
  const fundoE = S.parede(colB.u0 - PAR, L - PAR, A - PAR, A, PLAT, { ext: true });
  /* a mureta no fim de cada varanda, no fundo */
  S.parede(pat.u0, pat.u0 + VAR, A - PAR, A, m(1.1), { ext: true });
  S.parede(pat.u1 - VAR, pat.u1, A - PAR, A, m(1.1), { ext: true });
  /* o bloco de cá (em cima da garagem): a academia na frente, a hospedagem
     no fundo; a parede deles pra varanda, com as portas e as janelas */
  const vDivA = MF + m(6.2), wA = S.parede(gar.u1, pat.u0, MF, V1, PLAT, { fachadaPatio: true });
  S.parede(gar.u0, gar.u1, vDivA, vDivA + PAR, PE);
  const cAc = MF + m(2.4), cHo = vDivA + PAR + VAO / 2 + m(0.35);
  S.porta(wA, cAc, VAO, { abre: -1, nome: 'ACADEMIA' });
  S.porta(wA, cHo, VAO, { abre: -1, nome: 'HOSPEDAGEM' });
  S.comodo('ACADEMIA', gar.u0, gar.u1, MF, vDivA, { lado: 'u1', c: cAc, w: VAO }, 'academia');
  S.comodo('HOSPEDAGEM', gar.u0, gar.u1, vDivA + PAR, V1, { lado: 'u1', c: cHo, w: VAO });
  for (const f of [0.55, 0.85]) S.janela(wA, MF + (vDivA - MF) * f, 1.2, 1.0, 2.1, 'jan_alu4');
  S.janela(wA, cHo + VAO / 2 + m(1.4), 1.0, 1.1, 2.1, 'jan_grade');
  for (const i of [0, 2]) S.janela(fachada2, gar.u0 + (i + 0.5) * baia, 1.6, 0.9, 2.2, 'jan_alu4');
  for (const f of [0.3, 0.7]) S.janela(oeste2, MF + (vDivA - MF) * f, 1.4, 0.9, 2.2, 'jan_alu4');
  S.janela(oeste2, (vDivA + V1) / 2, 1.2, 1.1, 2.1, 'jan_grade');
  for (const f of [0.3, 0.7]) S.janela(fundoW, gar.u0 + (gar.u1 - gar.u0) * f, 0.8, 1.6, 2.2, 'basc');
  /* o bloco de lá (em cima da coluna): o marketing na frente, o setor
     criativo, grande, no fundo */
  const vDivB = MF + m(3.2), wE = S.parede(colB.u0 - PAR, colB.u0, MF, V1, PLAT, { fachadaPatio: true });
  S.parede(colB.u0, colB.u1, vDivB, vDivB + PAR, PE);
  const cMk = MF + m(2.2), cCr = vDivB + PAR + VAO / 2 + m(0.35);
  S.porta(wE, cMk, VAO, { abre: 1, nome: 'MARKETING' });
  S.porta(wE, cCr, VAO, { abre: 1, nome: 'SETOR CRIATIVO' });
  S.comodo('MARKETING', colB.u0, colB.u1, MF, vDivB, { lado: 'u0', c: cMk, w: VAO });
  S.comodo('SETOR CRIATIVO', colB.u0, colB.u1, vDivB + PAR, V1, { lado: 'u0', c: cCr, w: VAO });
  for (const f of [0.45, 0.8]) S.janela(wE, vDivB + (V1 - vDivB) * f, 1.2, 1.0, 2.1, 'jan_alu4');
  S.janela(fachada2, (colB.u0 + colB.u1) / 2, 1.2, 1.0, 2.1, 'jan_grade');
  for (const f of [0.35, 0.72]) S.janela(leste2, vDivB + (V1 - vDivB) * f, 1.6, 0.9, 2.2, 'jan_alu4');
  S.janela(fundoE, (colB.u0 + colB.u1) / 2, 1.4, 1.0, 2.2, 'jan_alu4');
  /* a varanda em U: os dois lados e a passarela por cima do portão (a
     fachada dela é a do letreiro, com duas janelas pequenas nas pontas) */
  S.comodo('VARANDA', pat.u0, pat.u0 + VAR, MF, V1, null, 'varanda');
  S.comodo('VARANDA', pat.u1 - VAR, pat.u1, MF, V1, null, 'varanda');
  S.comodo('VARANDA', pat.u0 + VAR, pat.u1 - VAR, MF, MF + BR, null, 'varanda');
  for (const u of [pat.u0 + VAR * 0.5, pat.u1 - VAR * 0.5]) S.janela(fachada2, u, 0.8, 1.2, 2.2, 'jan_grade');
  /* o guarda-corpo na beira da varanda (sem ele na chegada da escada) */
  const guardas = [{ u0: pat.u0 + VAR, v0: MF + BR, u1: pat.u0 + VAR, v1: V1 - ESC },
                   { u0: pat.u0 + VAR, v0: MF + BR, u1: pat.u1 - VAR, v1: MF + BR },
                   { u0: pat.u1 - VAR, v0: MF + BR, u1: pat.u1 - VAR, v1: V1 }];
  /* o telhado dos dois blocos (a varanda é descoberta) */
  const teto2 = [{ u0: gar.u0, u1: gar.u1, v0: MF, v1: V1, agua: 'plat', cai: '-u', y0: PLAT - 1.5, y1: PLAT - 1.5 - m(0.45) },
                 { u0: colB.u0, u1: colB.u1, v0: MF, v1: V1, agua: 'plat', cai: '+u', y0: PLAT - 1.5, y1: PLAT - 1.5 - m(0.45) }];
  const andar = { N, novo: true, andar: 1, h1: ANDAR_5.h1, L, A, PAR, MF, F0, VAO, PORTAO, ALT_PORTA, MURO: PLAT, ALT_EXT: PLAT, ALT: PE,
                  eixo, gar, colB, pat, paredes: S.paredes, comodos: S.comodos, portas: S.portas, teto: teto2, guardas, vagas: [], lado: 'mandante' };

  /* o mastro no aberto do pátio (a bandeira passa da fachada de cima), o
     letreiro grande na passarela, o escudo alto nos lados, as listras na
     frente da escada */
  const mastro = { u: pat.u0 + VAR + m(1.0), v: MF + BR + m(1.0), base: 0, alt: m(8.8) };
  const letreiro = { u: eixo, y: ANDAR_5.h1 + 1.3, alt: 0.85, larg: Math.min((pat.u1 - pat.u0 - 2 * VAR) / M - 0.6, 8.0) };
  const vL = V1 - ESC - m(0.35);
  const listras = [[pat.u0 + VAR + 10, pat.u1 - VAR - 10, vL - 20, vL - 13, 'cor2'], [pat.u0 + VAR + 10, pat.u1 - VAR - 10, vL - 11, vL - 4, 'cor3']];
  return { N, novo: true, dois: true, L, A, PAR, MF, F0, VAO, PORTAO, ALT_PORTA, MURO, ALT_EXT, ALT, G_ALT, G_MURO, G_PORTA, TERREO, H1,
           eixo, g0, g1, gar, colA: null, colB, pat, baia, vagas, paredes: T.paredes, comodos: T.comodos, portas: T.portas, teto: [],
           lajes, pilares, escada, andar, mastro, letreiro, listras, escudoLado: { y: ANDAR_5.h1 + 1.7, larg: 1.3 }, lado: 'mandante' };
}

/* =======================================================
   O CANTEIRO: o Construtor da casa, o do telhado e as listas
   ======================================================= */
/* um Construtor que não desenha nada, pra só a planta baixa */
function construtorMudo() {
  const nada = () => {};
  return { pos: [], uv: [], cor: [], caixa: nada, tampa: nada, ladrilhar: nada, esticar: nada, torno: nada, pintar: nada,
           fachada: nada, viga: nada, plano: (O, U, V) => ({ O, U, V, N: [0, 0, 0] }), ret: (a0, a1, b0, b1) => [[a0, b0], [a1, b0], [a1, b1], [a0, b1]],
           noPlano: () => [0, 0, 0], cel: () => [0, 0, 1, 1, 1, 1] };
}
const FACE = { '+x': 'dir', '-x': 'esq', '+z': 'frente', '-z': 'tras' };
const VEC = { '+x': [1, 0], '-x': [-1, 0], '+z': [0, 1], '-z': [0, -1] };
const lisa = tinta => ({ k: 'lisa', tinta });

/* O CÔMODO COMO REFERENCIAL: `s` ao longo da parede da porta, `t` da
   porta pra dentro, em metros. A mobília de cada cômodo é escrita
   assim, e o quarto converte pro modelo (x, z) — as quatro paredes em
   que a porta pode estar dão os quatro jeitos de girar. */
function quarto(c) {
  const lado = { u0: 'x0', u1: 'x1', v0: 'z0', v1: 'z1' }[c.porta ? c.porta.lado : 'v0'];
  const nz = lado[0] === 'z';
  const W = nz ? c.x1 - c.x0 : c.z1 - c.z0, D = nz ? c.z1 - c.z0 : c.x1 - c.x0;
  const pt = (s, t) => lado === 'z0' ? [c.x0 + s, c.z0 + t] : lado === 'z1' ? [c.x0 + s, c.z1 - t]
                     : lado === 'x0' ? [c.x0 + t, c.z0 + s] : [c.x1 - t, c.z0 + s];
  const MAPA = { z0: { '+s': '+x', '-s': '-x', '+t': '+z', '-t': '-z' }, z1: { '+s': '+x', '-s': '-x', '+t': '-z', '-t': '+z' },
                 x0: { '+s': '+z', '-s': '-z', '+t': '+x', '-t': '-x' }, x1: { '+s': '+z', '-s': '-z', '+t': '-x', '-t': '+x' } }[lado];
  const ret = (s0, s1, t0, t1) => {
    const [a, b] = pt(s0, t0), [c2, d] = pt(s1, t1);
    return [Math.min(a, c2), Math.max(a, c2), Math.min(b, d), Math.max(b, d)];
  };
  const pc = c.porta ? c.porta.c - (nz ? c.x0 : c.z0) : W / 2, pw = c.porta ? c.porta.w : 0;
  return { W, D, pt, ret, d: k => MAPA[k], pc, pw, c };
}
/* a caixa no referencial do cômodo: as faces pedidas por '+s', '-t'... */
function qcaixa(ctx, Q, s0, s1, t0, t1, y0, y1, spec, marca) {
  const [x0, x1, z0, z1] = Q.ret(s0, s1, t0, t1);
  const sp = {};
  for (const k of Object.keys(spec)) sp[k[0] === '+' || k[0] === '-' ? FACE[Q.d(k)] : k] = spec[k];
  ctx.B.caixa(x0, x1, y0, y1, z0, z1, sp);
  if (marca) ctx.marca(x0, x1, z0, z1, marca);
  return [x0, x1, z0, z1];
}
/* o bloco de uma cor só */
const qbloco = (ctx, Q, s0, s1, t0, t1, y0, y1, tinta, marca, k = 'lisa') =>
  qcaixa(ctx, Q, s0, s1, t0, t1, y0, y1, { todas: { k, tinta }, base: null }, marca);
/* o que fica na parede: `lado` é a parede ('-t' a da porta, '+t' a do
   fundo, '-s' e '+s' as dos lados), `a0`–`a1` o trecho dela, `prof`
   quanto sai da parede. 'frente' no spec é a face que olha o cômodo. */
function naParede(ctx, Q, lado, a0, a1, y0, y1, prof, spec, marca) {
  const oposto = { '-t': '+t', '+t': '-t', '-s': '+s', '+s': '-s' }[lado];
  const r = lado === '+t' ? [a0, a1, Q.D - prof, Q.D] : lado === '-t' ? [a0, a1, 0, prof]
          : lado === '-s' ? [0, prof, a0, a1] : [Q.W - prof, Q.W, a0, a1];
  const sp = Object.assign({}, spec);
  if (sp.frente !== undefined) { sp[oposto] = sp.frente; delete sp.frente; }
  if (sp[lado] === undefined) sp[lado] = null;
  return qcaixa(ctx, Q, r[0], r[1], r[2], r[3], y0, y1, sp, marca);
}

/* =======================================================
   OS LUGARES DE GENTE (a sede com vida, 27/09/2026)
   O dono: "Preciso que a sede da torcida selecionada tenha vida, com
   atividades dentro dela acontecendo, e o presidente fica sentado na
   sua sala enquanto as mensagens chegam em formato de balão na cadeira
   de alguém que senta na frente dele. A reunião da diretoria agora
   acontece dentro da sede 3D mesmo, numa sala que tem mesas e
   cadeiras."
   Cada móvel que recebe gente marca aqui ONDE o corpo fica (`s`, `t`
   do meio dele, no referencial do cômodo), pra onde ele OLHA ('+t' é
   pro fundo do cômodo), se é SENTADO e a altura do assento (m, do
   chão da rua), e o GESTO do que ele faz ali. `montarSede` devolve a
   lista no mundo (`lugares`): é dela que o jogo 3D senta o presidente,
   o recado na cadeira da frente, a diretoria na mesa de reunião e o
   povo de cada cômodo. O lugar é só marca: não desenha nem bloqueia.
   ======================================================= */
const ASSENTO = { cadeira: PISO + 0.44, escritorio: PISO + 0.5, banqueta: PISO + 0.79, banco: PISO + 0.45,
                  sofa: PISO + 0.42, cama: PISO + 0.43 };
function lugar(ctx, Q, tipo, s, t, olha, o = {}) {
  if (!ctx.lugares) return;
  const [x, z] = Q.pt(s, t), [nx, nz] = VEC[Q.d(olha)];
  const l = Object.assign({ tipo, comodo: Q.c.tipo, x, z, nx, nz, sentado: false, assento: 0 }, o);
  /* `conversa`: pra onde ele vira quando tem alguém no recado ('-s'...) */
  if (typeof l.conversa === 'string') l.conversa = VEC[Q.d(l.conversa)];
  ctx.lugares.push(l);
}
/* olhando pra um ponto do cômodo (o meio da mesa, a TV): o rumo sai do vetor */
function lugarPara(ctx, Q, tipo, s, t, ps, pt, o = {}) {
  if (!ctx.lugares) return;
  const [x, z] = Q.pt(s, t), [ax, az] = Q.pt(ps, pt), l = Math.hypot(ax - x, az - z) || 1;
  ctx.lugares.push(Object.assign({ tipo, comodo: Q.c.tipo, x, z, nx: (ax - x) / l, nz: (az - z) / l, sentado: false, assento: 0 }, o));
}

/* =======================================================
   A MOBÍLIA — tudo em metros, no referencial do cômodo
   ======================================================= */
function mesa(ctx, Q, s0, s1, t0, t1, h, tinta, perna = tinta) {
  const e = 0.045, tp = 0.035;
  qcaixa(ctx, Q, s0, s1, t0, t1, PISO + h - tp, PISO + h, { todas: lisa(tinta) }, tinta);
  for (const [s, t] of [[s0 + 0.06, t0 + 0.06], [s1 - 0.06, t0 + 0.06], [s1 - 0.06, t1 - 0.06], [s0 + 0.06, t1 - 0.06]])
    qcaixa(ctx, Q, s - e / 2, s + e / 2, t - e / 2, t + e / 2, PISO, PISO + h - tp, { todas: lisa(perna), base: null, topo: null });
}
/* a cadeira de quatro pés (plástico ou madeira); `costas` é o lado do encosto */
function cadeira(ctx, Q, s, t, costas, tinta, lado = 0.42) {
  const h = lado / 2, a = 0.44, e = 0.035;
  qcaixa(ctx, Q, s - h, s + h, t - h, t + h, PISO + a - 0.04, PISO + a, { todas: lisa(tinta) });
  for (const [ds, dt] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const ps = s + ds * (h - e / 2), pt = t + dt * (h - e / 2);
    qcaixa(ctx, Q, ps - e / 2, ps + e / 2, pt - e / 2, pt + e / 2, PISO, PISO + a - 0.04, { todas: lisa(tinta), base: null, topo: null });
  }
  const g = 0.04;
  const enc = { '-s': [s - h, s - h + g, t - h, t + h], '+s': [s + h - g, s + h, t - h, t + h],
                '-t': [s - h, s + h, t - h, t - h + g], '+t': [s - h, s + h, t + h - g, t + h] }[costas];
  qcaixa(ctx, Q, enc[0], enc[1], enc[2], enc[3], PISO + a, PISO + a + 0.46, { todas: lisa(tinta), base: null });
}
/* a cadeira de escritório: o assento, o encosto, a coluna e a estrela */
function cadeiraEscritorio(ctx, Q, s, t, costas) {
  const h = 0.24;
  qcaixa(ctx, Q, s - h, s + h, t - h, t + h, PISO + 0.42, PISO + 0.5, { todas: lisa(PRETO) });
  const g = 0.05, enc = { '-s': [s - h - 0.02, s - h + g, t - h, t + h], '+s': [s + h - g, s + h + 0.02, t - h, t + h],
                          '-t': [s - h, s + h, t - h - 0.02, t - h + g], '+t': [s - h, s + h, t + h - g, t + h + 0.02] }[costas];
  qcaixa(ctx, Q, enc[0], enc[1], enc[2], enc[3], PISO + 0.55, PISO + 1.05, { todas: lisa(PRETO) });
  qcaixa(ctx, Q, s - 0.025, s + 0.025, t - 0.025, t + 0.025, PISO + 0.08, PISO + 0.42, { todas: lisa(ACO_ESCURO), base: null, topo: null });
  qcaixa(ctx, Q, s - 0.3, s + 0.3, t - 0.025, t + 0.025, PISO + 0.04, PISO + 0.08, { todas: lisa(PRETO), base: null });
  qcaixa(ctx, Q, s - 0.025, s + 0.025, t - 0.3, t + 0.3, PISO + 0.04, PISO + 0.08, { todas: lisa(PRETO), base: null });
}
/* o monitor e o teclado, na mesa (a tela olha pra `olha`) */
function computador(ctx, Q, s, t, y, olha) {
  const d = olha, ao = d === '-s' || d === '+s';
  const [a0, a1, b0, b1] = ao ? [s - 0.03, s + 0.03, t - 0.26, t + 0.26] : [s - 0.26, s + 0.26, t - 0.03, t + 0.03];
  qcaixa(ctx, Q, a0, a1, b0, b1, y + 0.1, y + 0.44, { todas: lisa(PRETO), [d]: lisa('#26384a') });
  qcaixa(ctx, Q, s - 0.03, s + 0.03, t - 0.03, t + 0.03, y, y + 0.1, { todas: lisa(PRETO), base: null });
  const off = 0.28, [ks, kt] = { '-s': [-off, 0], '+s': [off, 0], '-t': [0, -off], '+t': [0, off] }[d];
  const [c0, c1, e0, e1] = ao ? [s + ks - 0.08, s + ks + 0.08, t - 0.22, t + 0.22] : [s - 0.22, s + 0.22, t + kt - 0.08, t + kt + 0.08];
  qcaixa(ctx, Q, c0, c1, e0, e1, y, y + 0.02, { todas: lisa('#3a3c40'), base: null });
}
/* papel espalhado na mesa */
function papeis(ctx, Q, s, t, y) {
  qcaixa(ctx, Q, s - 0.15, s + 0.15, t - 0.1, t + 0.1, y, y + 0.012, { todas: lisa(BRANCO), base: null });
  qcaixa(ctx, Q, s + 0.05, s + 0.3, t - 0.02, t + 0.18, y, y + 0.02, { todas: lisa('#f1e9b8'), base: null });
}
/* o armário de duas portas (madeira ou aço), a frente pro cômodo */
function armario(ctx, Q, s0, s1, t0, t1, h, frente, tinta, portas = 2) {
  qcaixa(ctx, Q, s0, s1, t0, t1, PISO, PISO + h, { todas: lisa(tinta), base: null }, tinta);
  const ao = frente === '-s' || frente === '+s';
  const larg = ao ? t1 - t0 : s1 - s0, esc = '#2c2a26';
  for (let i = 1; i < portas; i++) {
    const a = (ao ? t0 : s0) + larg * i / portas;
    const [c0, c1] = frente === '-s' ? [s0 - 0.006, s0] : frente === '+s' ? [s1, s1 + 0.006] : frente === '-t' ? [t0 - 0.006, t0] : [t1, t1 + 0.006];
    if (ao) qcaixa(ctx, Q, c0, c1, a - 0.006, a + 0.006, PISO + 0.05, PISO + h - 0.05, { todas: lisa(esc), base: null });
    else qcaixa(ctx, Q, a - 0.006, a + 0.006, c0, c1, PISO + 0.05, PISO + h - 0.05, { todas: lisa(esc), base: null });
  }
  for (let i = 0; i < portas; i++) {
    const a = (ao ? t0 : s0) + larg * (i + (i < portas / 2 ? 0.85 : 0.15)) / portas;
    const [c0, c1] = frente === '-s' ? [s0 - 0.03, s0] : frente === '+s' ? [s1, s1 + 0.03] : frente === '-t' ? [t0 - 0.03, t0] : [t1, t1 + 0.03];
    if (ao) qcaixa(ctx, Q, c0, c1, a - 0.012, a + 0.012, PISO + h * 0.48, PISO + h * 0.6, { todas: lisa('#c9c6bd') });
    else qcaixa(ctx, Q, a - 0.012, a + 0.012, c0, c1, PISO + h * 0.48, PISO + h * 0.6, { todas: lisa('#c9c6bd') });
  }
}
/* o armário de aço do alojamento: as portinhas com a ventilação */
function armarioAco(ctx, Q, s0, s1, t0, t1, h, frente, n) {
  qcaixa(ctx, Q, s0, s1, t0, t1, PISO, PISO + h, { todas: lisa(ACO), base: null }, ACO);
  const ao = frente === '-s' || frente === '+s', larg = ao ? t1 - t0 : s1 - s0;
  const [c0, c1] = frente === '-s' ? [s0 - 0.008, s0] : frente === '+s' ? [s1, s1 + 0.008] : frente === '-t' ? [t0 - 0.008, t0] : [t1, t1 + 0.008];
  for (let i = 0; i < n; i++) {
    const a = (ao ? t0 : s0) + larg * i / n + 0.02, b = a + larg / n - 0.04;
    const esp = { todas: lisa('#9aa2a8'), base: null, [frente]: { k: 'veneziana_ar', modo: 'esticar', tinta: '#b9c0c5' } };
    const esp2 = { todas: lisa('#a3aab0'), base: null };
    if (ao) {
      qcaixa(ctx, Q, c0, c1, a, b, PISO + h - 0.36, PISO + h - 0.06, esp);
      qcaixa(ctx, Q, c0, c1, a, b, PISO + 0.06, PISO + h - 0.4, esp2);
    } else {
      qcaixa(ctx, Q, a, b, c0, c1, PISO + h - 0.36, PISO + h - 0.06, esp);
      qcaixa(ctx, Q, a, b, c0, c1, PISO + 0.06, PISO + h - 0.4, esp2);
    }
  }
}
/* O ARMÁRIO DE TELA (o dono, 29/09/2026: "as faixas tomadas vão estar
   armazenadas dentro do armário do almoxarifado, e em outro armário o
   patrimonio próprio. esse detalhe vai fazer parte de uma mecanica de
   invasão de sede que vai acontecer de maneira rara no jogo
   futuramente"): o armário de aço de duas portas de TELA — dá pra ver o
   que está guardado —, com o montante do meio, três prateleiras (quatro
   nichos de cada lado), a testeira com a placa (TOMADAS ou PATRIMÔNIO)
   e, no das tomadas, o cadeado. O que vai dentro não é desenhado aqui:
   o armário marca os nichos dele em `ctx.armarios`, e
   `guardarNosArmarios` enche numa malha à parte (a cidade troca só ela
   quando o patrimônio do save muda). `o`: { tipo, placa, cadeado } */
function armarioDeTela(ctx, Q, s0, s1, t0, t1, h, frente, o) {
  const ao = frente === '-s' || frente === '+s';
  const A0 = ao ? t0 : s0, A1 = ao ? t1 : s1, P = ao ? s1 - s0 : t1 - t0;
  /* (ao longo da frente `a`, fundo `d` a partir da frente) → (s, t) do cômodo */
  const st = (a0, a1, d0, d1) => frente === '-t' ? [a0, a1, t0 + d0, t0 + d1] : frente === '+t' ? [a0, a1, t1 - d1, t1 - d0]
                               : frente === '-s' ? [s0 + d0, s0 + d1, a0, a1] : [s1 - d1, s1 - d0, a0, a1];
  const ptDe = (a, d) => frente === '-t' ? Q.pt(a, t0 + d) : frente === '+t' ? Q.pt(a, t1 - d) : frente === '-s' ? Q.pt(s0 + d, a) : Q.pt(s1 - d, a);
  const cx = (a0, a1, d0, d1, y0, y1, spec) => { const [p0, p1, q0, q1] = st(a0, a1, d0, d1); return qcaixa(ctx, Q, p0, p1, q0, q1, y0, y1, spec); };
  const e = 0.02, chapa = { todas: lisa(ACO_ARMARIO), base: null }, y0 = PISO, yT = PISO + h, rod = 0.08, testeira = 0.2;
  const yA = y0 + rod, yB = yT - testeira, NIV = 4, am = (A0 + A1) / 2;
  /* o corpo: o fundo, os lados, o tampo, o rodapé e a testeira (o fundo e
     as prateleiras claros por dentro: atrás da tela, o escuro engolia as
     peças) */
  cx(A0, A1, P - e, P, y0, yT, { todas: lisa(ACO_DENTRO), base: null });
  cx(A0, A0 + e, 0, P - e, y0, yT, chapa);
  cx(A1 - e, A1, 0, P - e, y0, yT, chapa);
  cx(A0, A1, 0, P, yT - e, yT, { todas: lisa(ACO_ARMARIO) });
  cx(A0 + e, A1 - e, 0, P - e, y0, yA, chapa);
  cx(A0 + e, A1 - e, 0, 0.015, yB, yT - e, chapa);
  /* as prateleiras e o montante do meio (as duas portas, os dois lados) */
  const prat = [];
  for (let i = 0; i <= NIV; i++) {
    const y = yA + (yB - yA) * i / NIV;
    if (i > 0 && i < NIV) cx(A0 + e, A1 - e, 0.015, P - e, y - 0.016, y, { todas: lisa(ACO_DENTRO) });
    prat.push(y);
  }
  cx(am - 0.016, am + 0.016, 0, P - e, yA, yB, chapa);
  /* AS PORTAS DE TELA: o quadro de chapa e a tela (a rede da folha das
     grades, miúda), um dedo na frente do corpo */
  const lados = [[A0 + e, am - 0.016], [am + 0.016, A1 - e]], fr = 0.03, q0 = -0.022, q1 = -0.004;
  const quadro = { todas: lisa(ACO_ESCURO), base: null };
  for (const [a0, a1] of lados) {
    cx(a0, a1, q0, q1, yA, yA + fr, quadro); cx(a0, a1, q0, q1, yB - fr, yB, quadro);
    cx(a0, a0 + fr, q0, q1, yA, yB, quadro); cx(a1 - fr, a1, q0, q1, yA, yB, quadro);
    const [pa, pb] = ptDe(a0 + fr, -0.013), [qa, qb] = ptDe(a1 - fr, -0.013), L = Math.hypot(qa - pa, qb - pb);
    if (L > 0.05) {
      const F = ctx.G.plano([pa, 0, pb], [(qa - pa) / L, 0, (qb - pb) / L], [0, 1, 0]);
      /* (a malha de 9 cm da folha, clara: a miúda, de longe, virava pano preto e escondia o que está dentro) */
      ctx.G.ladrilhar(F, [[0, yA + fr], [L, yA + fr], [L, yB - fr], [0, yB - fr]], 'rede', { tw: 1.0, th: 1.0, tinta: '#a9b0b5' });
    }
  }
  /* os puxadores, perto do meio; o cadeado no das tomadas */
  const yp = yA + (yB - yA) * 0.46;
  for (const a of [am - 0.07, am + 0.055]) cx(a, a + 0.015, -0.05, q0, yp, yp + 0.14, { todas: lisa('#c9c6bd') });
  if (o.cadeado) {
    cx(am - 0.034, am + 0.034, -0.075, -0.03, yp - 0.07, yp - 0.005, { todas: lisa('#c49a2c') });
    cx(am - 0.022, am - 0.012, -0.058, -0.047, yp - 0.005, yp + 0.04, { todas: lisa('#a3a8ac') });
    cx(am + 0.012, am + 0.022, -0.058, -0.047, yp - 0.005, yp + 0.04, { todas: lisa('#a3a8ac') });
    cx(am - 0.022, am + 0.022, -0.058, -0.047, yp + 0.03, yp + 0.042, { todas: lisa('#a3a8ac') });
  }
  /* a placa na testeira, e o armário inteiro na planta baixa */
  if (o.placa) ctx.placa(Q, ptDe(am, -0.006), frente, yB + (testeira - e) / 2, Math.min(1.0, (A1 - A0) * 0.62), 0.13, o.placa);
  ctx.marca(...Q.ret(s0, s1, t0, t1), ACO_ARMARIO);
  /* os NICHOS, de cima pra baixo na ordem de encher (a altura do peito
     primeiro, que é o que se vê), cada um com a largura e a altura livres */
  const nichos = [];
  for (const i of [2, 3, 1, 0]) for (const [a0, a1] of lados)
    nichos.push({ a0: a0 + 0.025, a1: a1 - 0.025, y: prat[i], yTopo: prat[i + 1] - 0.03, d0: 0.03, d1: P - e - 0.03 });
  ctx.armarios.push({ tipo: o.tipo, Q, st, ptDe, frente, nichos, A0, A1, P, h, ret: Q.ret(s0, s1, t0, t1), comodo: Q.c.tipo });
}
/* O QUE ESTÁ GUARDADO: cada peça dobrada no nicho, em pilhas — a faixa
   (da largura do nicho até 62 cm, 30 de fundo, 6 de altura) na cor 1 da
   dona com a dobra na 2, a bandeira (70% da largura) igual e mais fina. As pilhas enchem o nicho da
   esquerda pra direita, de baixo pra cima; o que não cabe no armário
   fica de fora (e a conta diz quantas ficaram). `pecas`: [{ tipo, cor,
   cor2 }]. Devolve quantas couberam. */
function guardarNoArmario(ctx, B, A, pecas) {
  const Q = A.Q, cg = { B, marca() {} };
  let k = 0;
  for (const n of A.nichos) {
    const larg = n.a1 - n.a0, colunas = Math.max(1, Math.floor(larg / 0.45)), passo = larg / colunas;
    for (let c = 0; c < colunas && k < pecas.length; c++) {
      let y = n.y;
      while (k < pecas.length) {
        const p = pecas[k], faixa = p.tipo !== 'bandeira', wf = Math.max(0.3, Math.min(0.62, passo - 0.05));
        const w = faixa ? wf : wf * 0.7, dd = faixa ? 0.3 : 0.26, hh = faixa ? 0.06 : 0.045;
        if (y + hh > n.yTopo) break;
        /* (a pilha arrumada à mão: cada uma um tico fora do lugar) */
        const j1 = ((k * 37) % 7 - 3) * 0.005, j2 = ((k * 53) % 5 - 2) * 0.006;
        const am = n.a0 + passo * (c + 0.5) + j1, dm = (n.d0 + n.d1) / 2 + j2;
        const a0 = am - Math.min(w, passo - 0.03) / 2, a1 = am + Math.min(w, passo - 0.03) / 2, d0 = dm - Math.min(dd, n.d1 - n.d0) / 2, d1 = dm + Math.min(dd, n.d1 - n.d0) / 2;
        const [s0, s1, t0, t1] = A.st(a0, a1, d0, d1);
        qcaixa(cg, Q, s0, s1, t0, t1, y, y + hh, { todas: lisa(p.cor || '#777'), base: null });
        /* a dobra na frente, na cor 2 */
        const [u0, u1, v0, v1] = A.st(a0 + 0.02, a1 - 0.02, d0 - 0.004, d0);
        qcaixa(cg, Q, u0, u1, v0, v1, y + hh * 0.3, y + hh * 0.7, { todas: lisa(p.cor2 || '#ddd'), base: null });
        y += hh + 0.004; k++;
      }
    }
    if (k >= pecas.length) break;
  }
  return k;
}
/* o arquivo de aço de quatro gavetas */
function arquivo(ctx, Q, s0, s1, t0, t1, frente) {
  const h = 1.32;
  qcaixa(ctx, Q, s0, s1, t0, t1, PISO, PISO + h, { todas: lisa('#9ea5a9'), base: null }, '#9ea5a9');
  const ao = frente === '-s' || frente === '+s';
  const [c0, c1] = frente === '-s' ? [s0 - 0.02, s0] : frente === '+s' ? [s1, s1 + 0.02] : frente === '-t' ? [t0 - 0.02, t0] : [t1, t1 + 0.02];
  for (let i = 0; i < 4; i++) {
    const y = PISO + 0.05 + i * (h - 0.08) / 4, y1 = y + (h - 0.08) / 4 - 0.02;
    const m = ao ? (t0 + t1) / 2 : (s0 + s1) / 2;
    if (ao) qcaixa(ctx, Q, c0, c1, m - 0.1, m + 0.1, y1 - 0.08, y1 - 0.05, { todas: lisa('#5f6468') });
    else qcaixa(ctx, Q, m - 0.1, m + 0.1, c0, c1, y1 - 0.08, y1 - 0.05, { todas: lisa('#5f6468') });
    const [d0, d1] = frente === '-s' || frente === '-t' ? [c1 - 0.004, c1] : [c0, c0 + 0.004];
    if (ao) qcaixa(ctx, Q, d0, d1, t0 + 0.02, t1 - 0.02, y1, y1 + 0.012, { todas: lisa('#6d7377'), base: null });
    else qcaixa(ctx, Q, s0 + 0.02, s1 - 0.02, d0, d1, y1, y1 + 0.012, { todas: lisa('#6d7377'), base: null });
  }
}
/* A ESTANTE DE AÇO: quatro montantes, as prateleiras, e em cada uma o
   que `itens(nivel, a0, a1, b0, b1, y)` puser */
function estanteAco(ctx, Q, s0, s1, t0, t1, h, niveis, itens) {
  const e = 0.035;
  for (const [s, t] of [[s0 + e / 2, t0 + e / 2], [s1 - e / 2, t0 + e / 2], [s1 - e / 2, t1 - e / 2], [s0 + e / 2, t1 - e / 2]])
    qcaixa(ctx, Q, s - e / 2, s + e / 2, t - e / 2, t + e / 2, PISO, PISO + h, { todas: lisa(ACO_ESCURO), base: null });
  for (let i = 0; i < niveis; i++) {
    const y = PISO + 0.12 + i * (h - 0.16) / (niveis - 1);
    qcaixa(ctx, Q, s0, s1, t0, t1, y - 0.02, y, { todas: lisa(ACO) });
    if (itens && i < niveis - 1 || itens && niveis === 1) itens(i, s0 + 0.03, s1 - 0.03, t0 + 0.03, t1 - 0.03, y);
  }
  ctx.marca(...Q.ret(s0, s1, t0, t1), ACO);
}
/* a caixa de papelão, com a fita */
function caixaPapelao(ctx, Q, s0, s1, t0, t1, y, h) {
  qcaixa(ctx, Q, s0, s1, t0, t1, y, y + h, { todas: lisa(PAPELAO), base: null });
  const m = (s0 + s1) / 2;
  qcaixa(ctx, Q, m - 0.025, m + 0.025, t0 - 0.002, t1 + 0.002, y + h, y + h + 0.003, { todas: lisa('#d8c49a'), base: null });
}
/* O SURDO: o corpo na cor, os aros de metal e a pele branca */
function surdo(ctx, s, t, y, r, h, cor, Q) {
  const [cx, cz] = Q.pt(s, t), B = ctx.B;
  B.pintar(cor);
  B.torno(cx, cz, [[r, y + 0.02], [r, y + h - 0.02]], 12, 'lisa');
  B.pintar('#c3c7ca');
  B.torno(cx, cz, [[r + 0.012, y], [r + 0.012, y + 0.035]], 12, 'lisa');
  B.torno(cx, cz, [[r + 0.012, y + h - 0.035], [r + 0.012, y + h]], 12, 'lisa');
  B.pintar('#efece2');
  B.torno(cx, cz, [[r, y + h], [0, y + h + 0.002]], 12, 'lisa');
  B.pintar(null);
  ctx.marca(cx - r, cx + r, cz - r, cz + r, cor);
}
/* a bandeira enrolada, deitada (um rolo quadrado na cor da torcida) */
function bandeiraEnrolada(ctx, Q, s0, s1, t0, t1, y, cor, cor2) {
  const h = Math.min(s1 - s0, t1 - t0);
  qcaixa(ctx, Q, s0, s1, t0, t1, y, y + h, { todas: lisa(cor), base: null });
  const ao = s1 - s0 > t1 - t0;
  if (ao) qcaixa(ctx, Q, s0 + (s1 - s0) * 0.3, s0 + (s1 - s0) * 0.36, t0 - 0.003, t1 + 0.003, y, y + h + 0.003, { todas: lisa(cor2), base: null });
  else qcaixa(ctx, Q, s0 - 0.003, s1 + 0.003, t0 + (t1 - t0) * 0.3, t0 + (t1 - t0) * 0.36, y, y + h + 0.003, { todas: lisa(cor2), base: null });
}
/* o colchão no chão, com o travesseiro e a coberta na cor da torcida */
function colchao(ctx, Q, s0, s1, t0, t1, y, cabeca, cor, grosso = 0.15) {
  qcaixa(ctx, Q, s0, s1, t0, t1, y, y + grosso, { todas: lisa(AZUL_COLCHAO), base: null }, AZUL_COLCHAO);
  const ao = cabeca === '-s' || cabeca === '+s';
  const tr = { '-s': [s0 + 0.05, s0 + 0.4, t0 + 0.08, t1 - 0.08], '+s': [s1 - 0.4, s1 - 0.05, t0 + 0.08, t1 - 0.08],
               '-t': [s0 + 0.08, s1 - 0.08, t0 + 0.05, t0 + 0.4], '+t': [s0 + 0.08, s1 - 0.08, t1 - 0.4, t1 - 0.05] }[cabeca];
  qcaixa(ctx, Q, tr[0], tr[1], tr[2], tr[3], y + grosso, y + grosso + 0.1, { todas: lisa(BRANCO), base: null });
  const cb = ao ? (cabeca === '-s' ? [s0 + 0.5, s1, t0 - 0.01, t1 + 0.01] : [s0, s1 - 0.5, t0 - 0.01, t1 + 0.01])
                : (cabeca === '-t' ? [s0 - 0.01, s1 + 0.01, t0 + 0.5, t1] : [s0 - 0.01, s1 + 0.01, t0, t1 - 0.5]);
  qcaixa(ctx, Q, cb[0], cb[1], cb[2], cb[3], y + grosso, y + grosso + 0.03, { todas: lisa(cor), base: null });
}
/* O BELICHE: os quatro pés de ferro, as duas camas e a escadinha */
function beliche(ctx, Q, s0, s1, t0, t1, cabeca, cor, cor2) {
  const h = 1.65, e = 0.045, ferro = '#3b4046';
  for (const [s, t] of [[s0 + e / 2, t0 + e / 2], [s1 - e / 2, t0 + e / 2], [s1 - e / 2, t1 - e / 2], [s0 + e / 2, t1 - e / 2]])
    qcaixa(ctx, Q, s - e / 2, s + e / 2, t - e / 2, t + e / 2, PISO, PISO + h, { todas: lisa(ferro), base: null });
  for (const [y, c] of [[PISO + 0.3, cor], [PISO + 1.22, cor2]]) {
    qcaixa(ctx, Q, s0, s1, t0, t1, y - 0.05, y, { todas: lisa(ferro) });
    colchao(ctx, Q, s0 + 0.03, s1 - 0.03, t0 + 0.03, t1 - 0.03, y, cabeca, c, 0.13);
  }
  const ao = cabeca === '-s' || cabeca === '+s';
  /* a grade do alto, pra ninguém cair, e a escadinha no pé */
  if (ao) {
    qcaixa(ctx, Q, s0, s1, t0, t0 + 0.03, PISO + 1.45, PISO + 1.5, { todas: lisa(ferro) });
    const sp = cabeca === '-s' ? s1 - 0.05 : s0 + 0.05;
    for (let y = PISO + 0.5; y < PISO + 1.2; y += 0.24) qcaixa(ctx, Q, sp - 0.02, sp + 0.02, t0, t1, y, y + 0.03, { todas: lisa(ferro) });
  } else {
    qcaixa(ctx, Q, s0, s0 + 0.03, t0, t1, PISO + 1.45, PISO + 1.5, { todas: lisa(ferro) });
    const tp = cabeca === '-t' ? t1 - 0.05 : t0 + 0.05;
    for (let y = PISO + 0.5; y < PISO + 1.2; y += 0.24) qcaixa(ctx, Q, s0, s1, tp - 0.02, tp + 0.02, y, y + 0.03, { todas: lisa(ferro) });
  }
  ctx.marca(...Q.ret(s0, s1, t0, t1), ferro);
}
/* o troféu: a base escura, a haste e a taça dourada */
function trofeu(ctx, Q, s, t, y, h) {
  const [cx, cz] = Q.pt(s, t), B = ctx.B;
  qcaixa(ctx, Q, s - 0.05, s + 0.05, t - 0.05, t + 0.05, y, y + h * 0.18, { todas: lisa('#2f2a24'), base: null });
  B.pintar(OURO);
  B.torno(cx, cz, [[0.018, y + h * 0.18], [0.018, y + h * 0.45], [h * 0.22, y + h * 0.62], [h * 0.26, y + h], [h * 0.2, y + h]], 8, 'lisa');
  B.pintar(null);
}
/* a TV presa na parede, com o jogo passando */
function tv(ctx, Q, lado, a, y, larg = 1.1) {
  const h = larg * 0.58;
  naParede(ctx, Q, lado, a - larg / 2, a + larg / 2, y, y + h, 0.06, { todas: lisa('#161616'), frente: lisa(PRETO) });
  naParede(ctx, Q, lado, a - larg / 2 + 0.04, a + larg / 2 - 0.04, y + 0.04, y + h - 0.04, 0.065, { todas: null, frente: lisa(TELA) });
  naParede(ctx, Q, lado, a - 0.006, a + 0.006, y + 0.06, y + h - 0.06, 0.068, { todas: null, frente: lisa('#dfe8dc') });
}
/* a unidade de dentro do ar-condicionado */
function arInterno(ctx, Q, lado, a, y) {
  naParede(ctx, Q, lado, a - 0.42, a + 0.42, y, y + 0.28, 0.2, { todas: lisa(BRANCO) });
  naParede(ctx, Q, lado, a - 0.36, a + 0.36, y + 0.03, y + 0.06, 0.205, { todas: null, frente: lisa('#6f7477') });
}
/* o quadro de aviso: a cortiça na moldura e os papéis presos */
function mural(ctx, Q, lado, a0, a1, y0, y1) {
  naParede(ctx, Q, lado, a0, a1, y0, y1, 0.03, { todas: lisa('#5b3b22'), frente: lisa('#b98a55') });
  const cores = [BRANCO, '#f1e9b8', '#f4c7c3', '#c9dcf0', BRANCO];
  const w = (a1 - a0) / 5.2, h = (y1 - y0);
  cores.forEach((c, i) => {
    const b0 = a0 + 0.08 + i * w * 1.02, alto = i % 2 ? 0.5 : 0.18;
    naParede(ctx, Q, lado, b0, b0 + w * 0.8, y0 + h * alto, y0 + h * (alto + 0.36), 0.036, { todas: null, frente: lisa(c) });
  });
}
/* a bandeira da torcida pregada na parede: as três faixas da cor dela */
function bandeiraParede(ctx, Q, lado, a0, a1, y0, y1, cores) {
  const h = (y1 - y0) / 3;
  [cores.cor, cores.cor2, cores.cor3].forEach((c, i) =>
    naParede(ctx, Q, lado, a0, a1, y1 - (i + 1) * h, y1 - i * h, 0.012, { todas: lisa(viva(c)) }));
}
/* a geladeira de duas portas */
function geladeira(ctx, Q, s0, s1, t0, t1, frente) {
  const h = 1.8;
  qcaixa(ctx, Q, s0, s1, t0, t1, PISO, PISO + h, { todas: lisa('#eceeed'), base: null }, '#eceeed');
  const [c0, c1] = frente === '-s' ? [s0 - 0.01, s0] : frente === '+s' ? [s1, s1 + 0.01] : frente === '-t' ? [t0 - 0.01, t0] : [t1, t1 + 0.01];
  const ao = frente === '-s' || frente === '+s';
  const g = [PISO + h * 0.7 - 0.008, PISO + h * 0.7 + 0.008];
  if (ao) {
    qcaixa(ctx, Q, c0, c1, t0 + 0.02, t1 - 0.02, g[0], g[1], { todas: lisa('#a7abaa') });
    qcaixa(ctx, Q, c0 - (frente === '-s' ? 0.03 : -0.03), c1 - (frente === '-s' ? 0.03 : -0.03), t1 - 0.1, t1 - 0.07, PISO + 0.7, PISO + 1.15, { todas: lisa('#b9bcbb') });
  } else {
    qcaixa(ctx, Q, s0 + 0.02, s1 - 0.02, c0, c1, g[0], g[1], { todas: lisa('#a7abaa') });
    qcaixa(ctx, Q, s1 - 0.1, s1 - 0.07, c0 - (frente === '-t' ? 0.03 : -0.03), c1 - (frente === '-t' ? 0.03 : -0.03), PISO + 0.7, PISO + 1.15, { todas: lisa('#b9bcbb') });
  }
}
/* o freezer horizontal, com a faixa da marca */
function freezer(ctx, Q, s0, s1, t0, t1, frente) {
  qcaixa(ctx, Q, s0, s1, t0, t1, PISO, PISO + 0.82, { todas: lisa('#eef0ef'), base: null, topo: null }, '#eef0ef');
  qcaixa(ctx, Q, s0 - 0.01, s1 + 0.01, t0 - 0.01, t1 + 0.01, PISO + 0.82, PISO + 0.88, { todas: lisa('#c9ced1'), base: null });
  const [c0, c1] = frente === '-s' ? [s0 - 0.006, s0] : frente === '+s' ? [s1, s1 + 0.006] : frente === '-t' ? [t0 - 0.006, t0] : [t1, t1 + 0.006];
  if (frente === '-s' || frente === '+s') qcaixa(ctx, Q, c0, c1, t0 + 0.1, t1 - 0.1, PISO + 0.5, PISO + 0.66, { todas: lisa('#c8342b') });
  else qcaixa(ctx, Q, s0 + 0.1, s1 - 0.1, c0, c1, PISO + 0.5, PISO + 0.66, { todas: lisa('#c8342b') });
}
/* o engradado de cerveja, em pilha */
function engradados(ctx, Q, s, t, n) {
  for (let k = 0; k < n; k++)
    qcaixa(ctx, Q, s, s + 0.42, t, t + 0.34, PISO + k * 0.3, PISO + 0.3 + k * 0.3, { todas: { k: 'engradado', modo: 'esticar' }, base: null });
  ctx.marca(...Q.ret(s, s + 0.42, t, t + 0.34), '#e0b32a');
}
/* a banqueta alta, de assento redondo */
function banqueta(ctx, Q, s, t, tinta) {
  const [cx, cz] = Q.pt(s, t), B = ctx.B, ferro = { k: 'laje_borda', tinta: '#34322f' };
  qcaixa(ctx, Q, s - 0.025, s + 0.025, t - 0.025, t + 0.025, PISO, PISO + 0.72, { todas: ferro, base: null, topo: null });
  qcaixa(ctx, Q, s - 0.14, s + 0.14, t - 0.14, t + 0.14, PISO + 0.22, PISO + 0.245, { todas: ferro, base: null });
  B.pintar(tinta);
  B.torno(cx, cz, [[0.17, PISO + 0.72], [0.185, PISO + 0.76], [0.1, PISO + 0.785], [0, PISO + 0.79]], 8, 'lisa');
  B.pintar(null);
}
/* o banco de madeira de ripa */
function banco(ctx, Q, s0, s1, t0, t1) {
  const ao = s1 - s0 > t1 - t0;
  qcaixa(ctx, Q, s0, s1, t0, t1, PISO + 0.4, PISO + 0.45, { todas: lisa(MADEIRA_CLARA) }, MADEIRA_CLARA);
  const pes = ao ? [s0 + 0.12, s1 - 0.16] : [t0 + 0.12, t1 - 0.16];
  for (const p of pes) {
    if (ao) qcaixa(ctx, Q, p, p + 0.05, t0 + 0.03, t1 - 0.03, PISO, PISO + 0.4, { todas: lisa(MADEIRA), base: null, topo: null });
    else qcaixa(ctx, Q, s0 + 0.03, s1 - 0.03, p, p + 0.05, PISO, PISO + 0.4, { todas: lisa(MADEIRA), base: null, topo: null });
  }
}
/* o bebedouro com o galão azul */
function bebedouro(ctx, Q, s, t) {
  qcaixa(ctx, Q, s - 0.16, s + 0.16, t - 0.16, t + 0.16, PISO, PISO + 1.0, { todas: lisa('#eceeed'), base: null }, '#eceeed');
  const [cx, cz] = Q.pt(s, t), B = ctx.B;
  B.pintar('#7fb3d8');
  B.torno(cx, cz, [[0.13, PISO + 1.0], [0.14, PISO + 1.08], [0.14, PISO + 1.36], [0.05, PISO + 1.44], [0.001, PISO + 1.45]], 10, 'lisa');
  B.pintar(null);
}
/* o extintor vermelho na parede, com a placa em cima */
function extintor(ctx, Q, lado, a) {
  const s = lado === '-s' ? 0.12 : lado === '+s' ? Q.W - 0.12 : a, t = lado === '-t' ? 0.12 : lado === '+t' ? Q.D - 0.12 : a;
  const [cx, cz] = Q.pt(s, t), B = ctx.B;
  B.pintar('#c8261e');
  B.torno(cx, cz, [[0.075, PISO + 0.45], [0.075, PISO + 0.95], [0.03, PISO + 1.02], [0.001, PISO + 1.03]], 10, 'lisa');
  B.pintar(null);
  naParede(ctx, Q, lado, a - 0.12, a + 0.12, PISO + 1.2, PISO + 1.44, 0.01, { todas: lisa('#c8261e') });
}
/* a churrasqueira de tijolo: a base, a grelha, a coifa e a chaminé */
function churrasqueira(ctx, Q, s0, s1, t0, t1, frente) {
  const tij = { todas: { k: 'tijolo' }, base: null };
  qcaixa(ctx, Q, s0, s1, t0, t1, PISO, PISO + 0.9, tij, '#a4664a');
  qcaixa(ctx, Q, s0 + 0.08, s1 - 0.08, t0 + 0.08, t1 - 0.08, PISO + 0.9, PISO + 0.93, { todas: null, topo: lisa('#2a2724') });
  const ao = frente === '-s' || frente === '+s';
  for (let k = 0; k < 7; k++) {
    const f = 0.12 + k * 0.12;
    if (ao) qcaixa(ctx, Q, s0 + 0.1, s1 - 0.1, t0 + (t1 - t0) * f - 0.006, t0 + (t1 - t0) * f + 0.006, PISO + 0.95, PISO + 0.96, { todas: lisa('#6f6a64') });
    else qcaixa(ctx, Q, s0 + (s1 - s0) * f - 0.006, s0 + (s1 - s0) * f + 0.006, t0 + 0.1, t1 - 0.1, PISO + 0.95, PISO + 0.96, { todas: lisa('#6f6a64') });
  }
  const fundo = { '-s': [s1 - 0.25, s1, t0, t1], '+s': [s0, s0 + 0.25, t0, t1], '-t': [s0, s1, t1 - 0.25, t1], '+t': [s0, s1, t0, t0 + 0.25] }[frente];
  qcaixa(ctx, Q, fundo[0], fundo[1], fundo[2], fundo[3], PISO + 0.9, PISO + 1.9, tij);
  const cm = [(s0 + s1) / 2, (t0 + t1) / 2];
  qcaixa(ctx, Q, s0 + 0.05, s1 - 0.05, t0 + 0.05, t1 - 0.05, PISO + 1.9, PISO + 2.2, tij);
  const cw = 0.22, [cs, ct] = ao ? [frente === '-s' ? s1 - 0.2 : s0 + 0.2, cm[1]] : [cm[0], frente === '-t' ? t1 - 0.2 : t0 + 0.2];
  qcaixa(ctx, Q, cs - cw / 2, cs + cw / 2, ct - cw / 2, ct + cw / 2, PISO + 2.2, PISO + 3.1, tij);
}
/* o tanque de lavar roupa, de cimento */
function tanque(ctx, Q, s0, s1, t0, t1) {
  qcaixa(ctx, Q, s0, s1, t0, t1, PISO, PISO + 0.82, { todas: { k: 'laje', tinta: '#cfcbc2' }, base: null }, '#cfcbc2');
  qcaixa(ctx, Q, s0 + 0.05, s1 - 0.05, t0 + 0.05, t1 - 0.05, PISO + 0.82, PISO + 0.825, { todas: null, topo: lisa('#8e8a82') });
}
/* a caixa d'água de mil litros, no chão do pátio */
function caixaDagua(ctx, Q, s, t, r) {
  const [cx, cz] = Q.pt(s, t);
  ctx.B.torno(cx, cz, [[r, PISO], [r, PISO + 0.72], [r + 0.05, PISO + 0.74], [r * 0.55, PISO + 0.96], [0, PISO + 1.02]], 10, 'caixa');
  ctx.marca(cx - r, cx + r, cz - r, cz + r, '#2d52b8');
}
/* o varal de roupa entre dois paus, ao longo de `t` */
function varal(ctx, Q, s, t0, t1) {
  for (const t of [t0, t1]) qcaixa(ctx, Q, s - 0.03, s + 0.03, t - 0.03, t + 0.03, PISO, PISO + 1.85, { todas: lisa('#7a6a58'), base: null });
  const [x0, z0] = Q.pt(s, t0), [x1, z1] = Q.pt(s, t1);
  const L = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / L, uz = (z1 - z0) / L;
  ctx.G.esticar(ctx.G.plano([x0, PISO + 1.2, z0], [ux, 0, uz], [0, 1, 0]), 0, L, 0, 0.62, 'varal');
}
/* a pilha de cadeira de plástico */
function pilhaCadeiras(ctx, Q, s, t, n, tinta, costas) {
  for (let k = 0; k < n; k++) {
    const y = PISO + 0.44 + k * 0.05;
    qcaixa(ctx, Q, s - 0.21, s + 0.21, t - 0.21, t + 0.21, y - 0.04, y, { todas: lisa(tinta) });
  }
  cadeira(ctx, Q, s, t, costas, tinta);
}
/* o pebolim: a caixa verde nos quatro pés e as varetas com os bonecos */
function pebolim(ctx, Q, s, t, cor1, cor2) {
  const l = 1.2, p = 0.72, h = 0.9;
  for (const [ds, dt] of [[0.06, 0.06], [l - 0.1, 0.06], [l - 0.1, p - 0.1], [0.06, p - 0.1]])
    qcaixa(ctx, Q, s + ds, s + ds + 0.05, t + dt, t + dt + 0.05, PISO, PISO + h - 0.2, { todas: lisa('#3a2a1c'), base: null, topo: null });
  qcaixa(ctx, Q, s, s + l, t, t + p, PISO + h - 0.2, PISO + h, { todas: lisa('#5c3a22'), topo: null }, '#2f6a3c');
  qcaixa(ctx, Q, s + 0.04, s + l - 0.04, t + 0.04, t + p - 0.04, PISO + h - 0.16, PISO + h - 0.15, { todas: null, topo: lisa('#2f7a3c') });
  for (let k = 0; k < 8; k++) {
    const ss = s + 0.12 + k * (l - 0.24) / 7, cor = k % 2 ? cor1 : cor2;
    qcaixa(ctx, Q, ss - 0.008, ss + 0.008, t - 0.12, t + p + 0.12, PISO + h - 0.07, PISO + h - 0.055, { todas: lisa('#b9bcbe') });
    for (let j = 0; j < 3; j++) qcaixa(ctx, Q, ss - 0.012, ss + 0.012, t + 0.16 + j * 0.2 - 0.02, t + 0.16 + j * 0.2 + 0.02, PISO + h - 0.15, PISO + h - 0.03, { todas: lisa(viva(cor)) });
  }
}
/* o sofá de dois lugares */
function sofa(ctx, Q, s0, s1, t0, t1, costas, tinta) {
  qcaixa(ctx, Q, s0, s1, t0, t1, PISO, PISO + 0.42, { todas: lisa(tinta), base: null }, tinta);
  const cc = { '-s': [s0, s0 + 0.2, t0, t1], '+s': [s1 - 0.2, s1, t0, t1], '-t': [s0, s1, t0, t0 + 0.2], '+t': [s0, s1, t1 - 0.2, t1] }[costas];
  qcaixa(ctx, Q, cc[0], cc[1], cc[2], cc[3], PISO + 0.42, PISO + 0.85, { todas: lisa(tinta), base: null });
  const ao = costas === '-s' || costas === '+s';
  for (const b of ao ? [[s0, s1, t0, t0 + 0.16], [s0, s1, t1 - 0.16, t1]] : [[s0, s0 + 0.16, t0, t1], [s1 - 0.16, s1, t0, t1]])
    qcaixa(ctx, Q, b[0], b[1], b[2], b[3], PISO + 0.42, PISO + 0.62, { todas: lisa(tinta), base: null });
}
/* o mastro; a BANDEIRA (o pano, ao longo de `dir`) não vai no bloco: ela
   tremula, então sai à parte (`ctx.bandeira`, no mundo em `bandeira`) e
   quem mostra monta o pano vivo — o escudo da torcida no meio, o fundo
   na cor 1 e a borda nas cores 2 e 3 */
const BANDEIRA = { larg: 1.6, alt: 1.05 };
function mastroComBandeira(ctx, x, z, y0, alt, dx, dz) {
  const B = ctx.B;
  B.pintar('#c9ccce');
  B.torno(x, z, [[0.04, y0], [0.03, y0 + alt], [0.05, y0 + alt + 0.04], [0.001, y0 + alt + 0.1]], 8, 'lisa');
  B.pintar(null);
  ctx.bandeira = { x: x + dx * 0.04, z: z + dz * 0.04, topo: y0 + alt - 0.05, dx, dz, larg: BANDEIRA.larg, alt: BANDEIRA.alt };
}

/* =======================================================
   CADA CÔMODO, MOBILIADO CONFORME O QUE ELE É
   ======================================================= */
/* a zona da porta: a folha abre pra dentro e ali ninguém põe móvel */
const livreDaPorta = Q => [Q.pc - Q.pw / 2 - 0.15, Q.pc + Q.pw / 2 + 0.15];
const MOBILIA = {
  patio(ctx, Q) {
    const { W, D } = Q, P = ctx.P, c = ctx.cores;
    /* A MOBÍLIA DA PLANTA fica onde a planta põe: os três colchões na
       parede oeste, a caixa d'água no canto do fundo, o mastro perto do
       portão; o resto (churrasqueira, tanque, mesa, varal) ocupa o que
       sobra sem entrar no caminho do portão pras duas salas */
    for (let i = 0; i < 3; i++) {
      const t = u2(20) + i * u2(34);
      if (t + 0.9 > D - 1.3) break;
      colchao(ctx, Q, 0.2, 2.1, t, t + 0.9, PISO, '-s', [ctx.c1, ctx.c2, ctx.c3][i]);
    }
    ctx.faixa('-s', D * 0.36, PISO + 1.35, Math.min(3.6, D * 0.55), 0.8, Q);
    caixaDagua(ctx, Q, u2(20), D - u2(22), u2(mm(0.52)));
    /* a grade de correr recolhida ao lado da porta de vidro (a da planta) */
    const g0 = (P.g1 + 6 - P.PAR) / M, g1 = g0 + Math.min(44, P.uDiv - P.g1 - 12) / M;
    const [ax, az] = Q.pt(g0, 0.04), [bx, bz] = Q.pt(g1, 0.04), Lg = Math.hypot(bx - ax, bz - az);
    if (Lg > 0.3) ctx.G.esticar(ctx.G.plano([ax, PISO, az], [(bx - ax) / Lg, 0, (bz - az) / Lg], [0, 1, 0]), 0, Lg, 0, 2.2, 'preta');
    tanque(ctx, Q, 1.85, 2.5, D - 0.58, D - 0.05);
    churrasqueira(ctx, Q, 2.9, 4.2, D - 0.7, D - 0.05, '-t');
    lugar(ctx, Q, 'churrasco', 3.55, D - 1.08, '+t', { gesto: 'churrasco' });
    const ms = Math.min(W - 0.9, 3.05), mt = D - 2.3;
    mesa(ctx, Q, ms - 0.45, ms + 0.45, mt - 0.45, mt + 0.45, 0.72, BRANCO, '#d4d6d6');
    cadeira(ctx, Q, ms - 0.72, mt, '-s', BRANCO);
    cadeira(ctx, Q, ms + 0.72, mt, '+s', BRANCO);
    cadeira(ctx, Q, ms, mt + 0.72, '+t', BRANCO);
    const sent = g => ({ sentado: true, assento: ASSENTO.cadeira, gesto: g });
    lugar(ctx, Q, 'mesa', ms - 0.72, mt, '+s', sent('bebe'));
    lugar(ctx, Q, 'mesa', ms + 0.72, mt, '-s', sent('conversa'));
    lugar(ctx, Q, 'mesa', ms, mt + 0.72, '-t', sent('escuta'));
    varal(ctx, Q, 2.6, 1.0, 2.9);
    const bs0 = Math.min(W - 2.4, 4.5), bs1 = Math.min(W - 0.3, 6.6);
    banco(ctx, Q, bs0, bs1, D - 0.55, D - 0.12);
    for (let s = bs0 + 0.4; s <= bs1 - 0.35; s += 0.7)
      lugar(ctx, Q, 'banco', s, D - 0.33, '-t', { sentado: true, assento: ASSENTO.banco, gesto: s < bs0 + 1 ? 'celular' : 'conversa' });
    /* a roda em pé no meio do pátio, longe do caminho do portão; com a
       ÁREA DE TREINO (o anexo do save), o treino no lugar dela */
    const rs = Math.min(W - 1.6, 4.9), rt = D * 0.42;
    if (ctx.anexos.treino) areaDeTreino(ctx, Q, ctx.anexos.treino, Math.max(3.4, W - 3.3), W - 1.1, D * 0.28, Math.min(D - 3.0, D * 0.28 + 2.4), '+s', false);
    else for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2 + 0.3;
      lugarPara(ctx, Q, 'roda', rs + Math.cos(a) * 0.6, rt + Math.sin(a) * 0.6, rs, rt, { gesto: 'festa' });
    }
    for (const [s, t, h] of [[W - 0.55, 0.35, 0.45], [W - 0.95, 0.4, 0.34], [W - 0.62, 0.85, 0.3]]) caixaPapelao(ctx, Q, s, s + h, t, t + h, PISO, h);
  },
  patrimonio(ctx, Q) {
    const { W, D } = Q, [p0, p1] = livreDaPorta(Q);
    /* o da planta: o armário comprido na parede leste (com os troféus em
       cima), a estante de aço na fachada, as caixas */
    const ha = u2(mm(2.00));
    /* (o comprido da planta vira OS DOIS ARMÁRIOS DE TELA, o dono,
       29/09/2026: o patrimônio da torcida à esquerda, as tomadas à
       direita — no mesmo retângulo, que é o que barra quem anda) */
    const a0 = u2(6), a1 = W - u2(6), b0 = D - u2(2 + mm(0.45)), b1 = D - u2(2), am = (a0 + a1) / 2;
    armarioDeTela(ctx, Q, a0, am - 0.01, b0, b1, ha, '-t', { tipo: 'patrimonio', placa: 'PATRIMÔNIO' });
    armarioDeTela(ctx, Q, am + 0.01, a1, b0, b1, ha, '-t', { tipo: 'tomadas', placa: 'TOMADAS', cadeado: true });
    ctx.marca(...Q.ret(a0, a1, b0, b1), ACO_ARMARIO);
    for (let s = 0.5; s < W - 0.4; s += 0.42) trofeu(ctx, Q, s, D - u2(4 + mm(0.40) / 2), PISO + ha, 0.28 + ((s * 7) % 3) * 0.05);
    estanteAco(ctx, Q, u2(2), u2(2 + mm(0.38)), u2(4), D - u2(28), u2(mm(1.90)), 4, (i, a0, a1, b0, b1, y) => {
      if (i === 1) { bandeiraEnrolada(ctx, Q, a0, a1, b0, b0 + 0.9, y, ctx.c1, ctx.c2); bandeiraEnrolada(ctx, Q, a0, a1, b0 + 1.0, b0 + 1.9, y, ctx.c2, ctx.c1); return; }
      for (let t = b0; t + 0.32 <= b1; t += 0.36) caixaPapelao(ctx, Q, a0, a1, t, t + 0.32, y, 0.24);
    });
    surdo(ctx, 1.05, 2.35, PISO, 0.3, 0.6, ctx.c1, Q);
    surdo(ctx, 1.05, 2.35, PISO + 0.6, 0.26, 0.5, ctx.c3, Q);
    lugar(ctx, Q, 'estante', W / 2 - 0.5, D - u2(2 + mm(0.45)) - 0.45, '+t', { gesto: 'arruma', armario: 'patrimonio' });
    lugar(ctx, Q, 'armario', W / 2 + 0.5, D - u2(2 + mm(0.45)) - 0.45, '+t', { gesto: 'arruma', armario: 'tomadas' });
    surdo(ctx, 1.75, 2.75, PISO, 0.26, 0.5, ctx.c2, Q);
    for (let k = 0; k < 3; k++) qcaixa(ctx, Q, W - 0.2 - k * 0.05, W - 0.17 - k * 0.05, 0.1, 0.13, PISO, PISO + 2.2, { todas: lisa('#caa77a'), base: null });
    caixaPapelao(ctx, Q, W - 0.7, W - 0.2, 0.5, 1.0, PISO, 0.48);
  },
  presidencia(ctx, Q) {
    const { W, D } = Q, [p0, p1] = livreDaPorta(Q);
    /* A MESA DA PLANTA, encostada no canto do fundo (a planta explica
       por quê), com o computador, e a cadeira de frente pra ela */
    mesa(ctx, Q, W - u2(4 + 14), W - u2(4), u2(8 + 23), D - u2(4), 0.75, MADEIRA, '#3a2618');
    computador(ctx, Q, W - 0.35, D - 0.9, PISO + 0.75, '-s');
    papeis(ctx, Q, W - 0.4, D - 1.8, PISO + 0.75);
    trofeu(ctx, Q, W - 0.3, D - 2.3, PISO + 0.75, 0.34);
    cadeiraEscritorio(ctx, Q, W - 1.1, D - 1.2, '-s');
    armario(ctx, Q, W - u2(2 + mm(0.45)), W - u2(2), u2(4), u2(4 + mm(1.20)), u2(mm(1.80)), '-s', MADEIRA, 2);
    sofa(ctx, Q, 0.4, 2.2, D - 0.85, D - 0.08, '+t', '#2f3a4a');
    /* O PRESIDENTE de frente pro computador, e a CADEIRA DO RECADO atrás
       dele: quem traz a mensagem senta ali, e ele gira a cadeira pra
       ouvir (`conversa`: o rumo de quando tem gente no recado) */
    const rs = W - 2.05, rt = D - 1.3;
    cadeira(ctx, Q, rs, rt, '-s', '#2b2b2e');
    lugar(ctx, Q, 'presidente', W - 1.1, D - 1.2, '+s', { sentado: true, assento: ASSENTO.escritorio, gesto: 'digita', conversa: '-s' });
    lugar(ctx, Q, 'recado', rs, rt, '+s', { sentado: true, assento: ASSENTO.cadeira, gesto: 'conversa' });
    lugar(ctx, Q, 'sofa', 0.85, D - 0.5, '-t', { sentado: true, assento: ASSENTO.sofa, gesto: 'celular' });
    mural(ctx, Q, '-s', 1.34, 2.34, PISO + 1.4, PISO + 2.1);
    bandeiraParede(ctx, Q, '-s', 2.55, Math.min(D - 0.3, 4.1), PISO + 1.3, PISO + 2.05, ctx.cores);
    arInterno(ctx, Q, '+s', D - 0.95, PISO + 2.15);
  }
};
const u2 = v => v / M;
const mm = v => Math.round(v * M);     // o `m()` da planta: metro pra unidade inteira

/* =======================================================
   A MOBÍLIA DOS NÍVEIS 2 A 5 (o dono, 30/09/2026)
   -------------------------------------------------------
   PÁTIO        "área de trânsito entre as salas, ocupa o maior espaço
                da área da sede. Tem decoração própria como já existe na
                sede de hoje": a churrasqueira e o tanque no fundo, a
                caixa d'água no canto, a mesa de plástico, o banco, a
                faixa no muro do fundo, a bateria (do 3 em diante), o
                pebolim (4 e 5); no 2, os colchões do aliado (lá não tem
                hospedagem) e o varal; e o TREINO: improvisado no 2 (a
                trave de madeira com um saco, o pneu, o colchonete),
                maior no 3 (o tatame, a trave de aço com dois sacos, o
                supino e os halteres)
   PRESIDÊNCIA  "a decoração atual está boa": a mesa com o computador, a
                cadeira do presidente de frente pra porta, as duas de quem
                vem falar, o armário, o sofá, o mural, a bandeira e o ar;
                no 4 e no 5, "com mais detalhes": o tapete, a estante de
                troféus, os quadros com a camisa, a TV, o frigobar, o
                cofre, a planta e a mesinha de reunião
   BAR          "virado pra rua sem se conectar com a sede": o balcão no
                fundo com a prateleira de garrafa e o armário atrás, a
                geladeira, o freezer, o engradado, as banquetas, a TV; e a
                MESA DO PAGODE, que só enche no turno de festa (os
                instrumentos numa malha à parte, que o jogo mostra na festa)
   HOSPEDAGEM   "onde os aliados ficam. Quartos, beliches, etc": 2
                beliches no 3, 3 no 4 e 4 no 5, o armário de aço, o
                ventilador, a mesa, os colchões extras
   PATRIMÔNIO   "onde o material fica guardado": os dois armários de tela
                (o do patrimônio e o das tomadas, os do almoxarifado de
                antes), a estante, os surdos e os mastros
   MARKETING    "uma sala com uma pessoa dentro mexendo no computador.
                Quadros em volta dele com a camisa da torcida"
   SETOR        "vai produzir novos materiais como bandeirão, faixas,
   CRIATIVO     bandeiras": a mesa grande com a faixa sendo pintada, as
                latas de tinta, a máquina de costura, os rolos de pano, o
                varal com bandeiras secando, o bandeirão dobrado
   GARAGEM      "mostra os ônibus (se tiver) com portão grande virado pra
                rua": os ônibus são malha à parte (o jogo põe quantos a
                torcida tem); aqui, a mancha de óleo, o extintor, o tambor
   ======================================================= */
const PLASTICO = '#f1f0ea';
/* as portas que dão num cômodo pelas paredes do lado (`-s` e `+s`), em `t` */
function portasNosLados(ctx, Q) {
  const c = Q.c, out = [];
  for (const p of ctx.portas) {
    const w = p.parede;
    if (w.ao !== 'v') continue;
    const lado = Math.abs(w.x1 - c.x0) < 0.03 ? '-s' : Math.abs(w.x0 - c.x1) < 0.03 ? '+s' : null;
    if (lado) out.push({ lado, t0: p.c - p.w / 2 - c.z0, t1: p.c + p.w / 2 - c.z0 });
  }
  return out;
}
const semPorta = (portas, lado, t0, t1, folga = 0.3) => !portas.some(p => p.lado === lado && p.t1 + folga > t0 && p.t0 - folga < t1);
/* a trave (dois pés e a viga, ao longo de `s`), de madeira ou de aço */
function trave(ctx, Q, s0, s1, t, h, tinta) {
  for (const s of [s0, s1]) qcaixa(ctx, Q, s - 0.05, s + 0.05, t - 0.05, t + 0.05, PISO, PISO + h, { todas: lisa(tinta), base: null }, tinta);
  qcaixa(ctx, Q, s0 - 0.06, s1 + 0.06, t - 0.05, t + 0.05, PISO + h, PISO + h + 0.1, { todas: lisa(tinta) });
}
/* o saco de pancada pendurado na viga: a corrente e o corpo de couro */
function sacoDePancada(ctx, Q, s, t, yViga, cor) {
  const [cx, cz] = Q.pt(s, t), B = ctx.B;
  qcaixa(ctx, Q, s - 0.008, s + 0.008, t - 0.008, t + 0.008, PISO + 1.55, yViga, { todas: lisa('#8a8f94'), base: null, topo: null });
  B.pintar(cor);
  B.torno(cx, cz, [[0.001, PISO + 0.46], [0.15, PISO + 0.47], [0.17, PISO + 0.55], [0.17, PISO + 1.46], [0.14, PISO + 1.54], [0.001, PISO + 1.55]], 10, 'lisa');
  B.pintar(null);
  ctx.marca(cx - 0.17, cx + 0.17, cz - 0.17, cz + 0.17, cor);
}
/* o pneu velho deitado no chão */
function pneu(ctx, Q, s, t, y = PISO) {
  const [cx, cz] = Q.pt(s, t), B = ctx.B;
  B.pintar('#1c1c1e');
  B.torno(cx, cz, [[0.33, y], [0.34, y + 0.1], [0.33, y + 0.2], [0.21, y + 0.21], [0.2, y + 0.12]], 12, 'lisa');
  B.pintar(null);
  ctx.marca(cx - 0.34, cx + 0.34, cz - 0.34, cz + 0.34, '#1c1c1e');
}
/* o tatame de EVA, as placas de um metro em xadrez de duas cores */
function tatame(ctx, Q, s0, s1, t0, t1, c1, c2) {
  const ns = Math.max(1, Math.round(s1 - s0)), nt = Math.max(1, Math.round(t1 - t0)), ps = (s1 - s0) / ns, pt = (t1 - t0) / nt;
  for (let i = 0; i < ns; i++) for (let j = 0; j < nt; j++)
    qcaixa(ctx, Q, s0 + i * ps, s0 + (i + 1) * ps, t0 + j * pt, t0 + (j + 1) * pt, PISO, PISO + 0.025, { todas: lisa((i + j) % 2 ? c1 : c2), base: null });
  ctx.marca(...Q.ret(s0, s1, t0, t1), c1);
}
/* o par de halteres no chão */
function halteres(ctx, Q, s, t) {
  for (const d of [0, 0.26]) {
    qcaixa(ctx, Q, s + d - 0.13, s + d + 0.13, t - 0.018, t + 0.018, PISO + 0.05, PISO + 0.086, { todas: lisa('#8a8f94') });
    for (const e of [-0.1, 0.1]) qcaixa(ctx, Q, s + d + e - 0.035, s + d + e + 0.035, t - 0.07, t + 0.07, PISO, PISO + 0.14, { todas: lisa('#1f2124'), base: null });
  }
}
/* o colchonete de exercício */
const colchonete = (ctx, Q, s0, s1, t0, t1, cor) => qcaixa(ctx, Q, s0, s1, t0, t1, PISO, PISO + 0.03, { todas: lisa(cor), base: null }, cor);
/* o supino: o banco estofado ao longo de `t`, os dois pés da barra e a
   barra com as anilhas */
function supino(ctx, Q, s, t0, t1) {
  qcaixa(ctx, Q, s - 0.15, s + 0.15, t0 + 0.2, t1, PISO + 0.38, PISO + 0.46, { todas: lisa('#232326') }, '#232326');
  for (const t of [t0 + 0.35, t1 - 0.12]) qcaixa(ctx, Q, s - 0.12, s + 0.12, t - 0.03, t + 0.03, PISO, PISO + 0.38, { todas: lisa(ACO_ESCURO), base: null });
  for (const d of [-0.42, 0.42]) qcaixa(ctx, Q, s + d - 0.03, s + d + 0.03, t0 + 0.1, t0 + 0.16, PISO, PISO + 1.12, { todas: lisa(ACO_ESCURO), base: null });
  qcaixa(ctx, Q, s - 0.85, s + 0.85, t0 + 0.11, t0 + 0.15, PISO + 1.06, PISO + 1.1, { todas: lisa('#b9bcbe') });
  for (const d of [-0.72, 0.72]) qcaixa(ctx, Q, s + d - 0.03, s + d + 0.03, t0 - 0.06, t0 + 0.32, PISO + 0.9, PISO + 1.26, { todas: lisa('#1f2124') });
  ctx.marca(...Q.ret(s - 0.85, s + 0.85, t0, t1), '#232326');
}
/* o vaso com a planta (a folhagem em cone) */
function plantaNoVaso(ctx, Q, s, t) {
  const [cx, cz] = Q.pt(s, t), B = ctx.B;
  B.pintar('#9a5b3a'); B.torno(cx, cz, [[0.15, PISO], [0.19, PISO + 0.38], [0.2, PISO + 0.4]], 8, 'lisa');
  B.pintar('#3d7a3a'); B.torno(cx, cz, [[0.16, PISO + 0.4], [0.34, PISO + 0.75], [0.24, PISO + 1.15], [0.001, PISO + 1.4]], 7, 'lisa');
  B.pintar(null);
  ctx.marca(cx - 0.2, cx + 0.2, cz - 0.2, cz + 0.2, '#3d7a3a');
}
/* o tambor de 200 litros */
function tambor(ctx, Q, s, t, cor) {
  const [cx, cz] = Q.pt(s, t), B = ctx.B;
  B.pintar(cor); B.torno(cx, cz, [[0.29, PISO], [0.29, PISO + 0.88], [0.001, PISO + 0.885]], 12, 'lisa'); B.pintar(null);
  ctx.marca(cx - 0.29, cx + 0.29, cz - 0.29, cz + 0.29, cor);
}
/* a mancha de óleo no chão da garagem */
const manchaOleo = (ctx, Q, s0, s1, t0, t1) => qcaixa(ctx, Q, s0, s1, t0, t1, PISO + 0.002, PISO + 0.004, { todas: null, topo: lisa('#5f5c56') });
/* a bateria de pé (quatro surdos no tripé), com o ritmista atrás de cada um, de frente pra `olha` */
function bateriaDePe(ctx, Q, s0, t, olha, passo = 0.62) {
  const cores = [ctx.c1, ctx.c2, ctx.c1, ctx.c3], dt = olha === '+t' ? -1 : 1;
  [[0.3, 0.62], [0.27, 0.55], [0.27, 0.55], [0.24, 0.5]].forEach(([r, h], k) => {
    const s = s0 + k * passo;
    for (const [a, b] of [[-1, -1], [1, -1], [0, 1]]) qcaixa(ctx, Q, s + a * r * 0.7 - 0.012, s + a * r * 0.7 + 0.012, t + b * r * 0.7 - 0.012, t + b * r * 0.7 + 0.012, PISO, PISO + 0.35, { todas: lisa('#3a3d40'), base: null });
    surdo(ctx, s, t, PISO + 0.35, r, h, cores[k], Q);
    lugar(ctx, Q, 'bateria', s, t + dt * (r + 0.34), olha, { gesto: 'surdo' });
  });
}
/* a mesa de plástico com as cadeiras em volta (lugares de `mesa`) */
function mesaDePlastico(ctx, Q, s, t, lados, tinta = PLASTICO) {
  mesa(ctx, Q, s - 0.45, s + 0.45, t - 0.45, t + 0.45, 0.72, tinta, '#d4d6d6');
  const sent = g => ({ sentado: true, assento: ASSENTO.cadeira, gesto: g }), gestos = ['bebe', 'conversa', 'escuta', 'conversa'];
  lados.forEach((lado, k) => {
    const [ds, dt] = { '-s': [-0.72, 0], '+s': [0.72, 0], '-t': [0, -0.72], '+t': [0, 0.72] }[lado];
    const olha = { '-s': '+s', '+s': '-s', '-t': '+t', '+t': '-t' }[lado];
    cadeira(ctx, Q, s + ds, t + dt, lado, tinta);
    lugar(ctx, Q, 'mesa', s + ds, t + dt, olha, sent(gestos[k % 4]));
  });
}
/* a roda de conversa em pé (quatro lugares olhando pro meio) */
function roda(ctx, Q, s, t, r = 0.6, fase = 0.3) {
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2 + fase;
    lugarPara(ctx, Q, 'roda', s + Math.cos(a) * r, t + Math.sin(a) * r, s, t, { gesto: 'festa' });
  }
}
/* A ESTANTE DE TROFÉUS: o móvel de madeira na parede `lado`, de a0 a a1,
   com quatro prateleiras de taça */
function estanteDeTrofeus(ctx, Q, lado, a0, a1) {
  naParede(ctx, Q, lado, a0, a1, PISO, PISO + 1.9, 0.4, { todas: lisa(MADEIRA) }, MADEIRA);
  for (let i = 0; i < 4; i++) {
    const y = PISO + 0.35 + i * 0.42;
    naParede(ctx, Q, lado, a0 + 0.04, a1 - 0.04, y - 0.02, y, 0.42, { todas: lisa('#8a6a48') });
    for (let a = a0 + 0.2 + (i % 2) * 0.12; a < a1 - 0.15; a += 0.34) {
      const d = 0.2, [s, t] = lado === '+t' ? [a, Q.D - d] : lado === '-t' ? [a, d] : lado === '-s' ? [d, a] : [Q.W - d, a];
      trofeu(ctx, Q, s, t, y, 0.24 + ((i * 3 + Math.round(a * 5)) % 3) * 0.05);
    }
  }
}
/* o tapete na cor da torcida, com a borda na segunda */
function tapete(ctx, Q, s0, s1, t0, t1) {
  qcaixa(ctx, Q, s0, s1, t0, t1, PISO, PISO + 0.012, { todas: lisa(ctx.c2), base: null });
  qcaixa(ctx, Q, s0 + 0.12, s1 - 0.12, t0 + 0.12, t1 - 0.12, PISO + 0.012, PISO + 0.016, { todas: null, topo: lisa(viva(ctx.c1)) });
}
/* o frigobar e o cofre */
const frigobar = (ctx, Q, s0, s1, t0, t1) => qcaixa(ctx, Q, s0, s1, t0, t1, PISO, PISO + 0.85, { todas: lisa('#e9ebea'), base: null }, '#e9ebea');
function cofre(ctx, Q, s0, s1, t0, t1, frente) {
  qcaixa(ctx, Q, s0, s1, t0, t1, PISO, PISO + 0.7, { todas: lisa('#3f4347'), base: null }, '#3f4347');
  const sm = (s0 + s1) / 2, tm = (t0 + t1) / 2, [a0, a1, b0, b1] = { '-t': [sm - 0.06, sm + 0.06, t0 - 0.02, t0], '+t': [sm - 0.06, sm + 0.06, t1, t1 + 0.02], '-s': [s0 - 0.02, s0, tm - 0.06, tm + 0.06], '+s': [s1, s1 + 0.02, tm - 0.06, tm + 0.06] }[frente];
  qcaixa(ctx, Q, a0, a1, b0, b1, PISO + 0.42, PISO + 0.54, { todas: lisa('#b9bcbe') });
}
/* o ventilador de coluna */
function ventilador(ctx, Q, s, t) {
  const [cx, cz] = Q.pt(s, t), B = ctx.B;
  B.pintar('#e9ebea'); B.torno(cx, cz, [[0.16, PISO], [0.001, PISO + 0.03]], 8, 'lisa');
  B.torno(cx, cz, [[0.02, PISO + 0.03], [0.02, PISO + 1.1]], 6, 'lisa');
  B.torno(cx, cz, [[0.001, PISO + 1.05], [0.2, PISO + 1.15], [0.2, PISO + 1.35], [0.001, PISO + 1.45]], 10, 'lisa'); B.pintar(null);
}
/* o tripé com a câmera e o anel de luz (o marketing grava vídeo) */
function tripeComLuz(ctx, Q, s, t) {
  const [cx, cz] = Q.pt(s, t), B = ctx.B;
  for (const [a, b] of [[-1, -1], [1, -1], [0, 1]]) qcaixa(ctx, Q, s + a * 0.18 - 0.012, s + a * 0.18 + 0.012, t + b * 0.18 - 0.012, t + b * 0.18 + 0.012, PISO, PISO + 0.5, { todas: lisa(PRETO), base: null });
  qcaixa(ctx, Q, s - 0.015, s + 0.015, t - 0.015, t + 0.015, PISO + 0.5, PISO + 1.55, { todas: lisa(PRETO), base: null });
  B.pintar('#f6f4e8'); B.torno(cx, cz, [[0.2, PISO + 1.52], [0.22, PISO + 1.56], [0.2, PISO + 1.6], [0.001, PISO + 1.6]], 14, 'lisa'); B.pintar(null);
  qcaixa(ctx, Q, s - 0.06, s + 0.06, t - 0.04, t + 0.04, PISO + 1.6, PISO + 1.7, { todas: lisa(PRETO) });
  ctx.marca(cx - 0.22, cx + 0.22, cz - 0.22, cz + 0.22, PRETO);
}
/* a lata de tinta aberta, na cor pedida */
function lataDeTinta(ctx, Q, s, t, y, cor) {
  const [cx, cz] = Q.pt(s, t), B = ctx.B;
  B.pintar('#c3c7ca'); B.torno(cx, cz, [[0.1, y], [0.1, y + 0.19]], 10, 'lisa');
  B.pintar(cor); B.torno(cx, cz, [[0.095, y + 0.17], [0.001, y + 0.172]], 10, 'lisa'); B.pintar(null);
}
/* a máquina de costura na mesa: o corpo, o braço e a base */
function maquinaDeCostura(ctx, Q, s, t, y, olha) {
  const ao = olha === '-s' || olha === '+s';
  const [a0, a1, b0, b1] = ao ? [s - 0.1, s + 0.1, t - 0.22, t + 0.22] : [s - 0.22, s + 0.22, t - 0.1, t + 0.1];
  qcaixa(ctx, Q, a0, a1, b0, b1, y, y + 0.08, { todas: lisa('#e9e6dc') });
  const [c0, c1, d0, d1] = ao ? [s - 0.07, s + 0.07, t + 0.1, t + 0.2] : [s + 0.1, s + 0.2, t - 0.07, t + 0.07];
  qcaixa(ctx, Q, c0, c1, d0, d1, y + 0.08, y + 0.3, { todas: lisa('#e9e6dc') });
  const [e0, e1, f0, f1] = ao ? [s - 0.07, s + 0.07, t - 0.2, t + 0.2] : [s - 0.2, s + 0.2, t - 0.07, t + 0.07];
  qcaixa(ctx, Q, e0, e1, f0, f1, y + 0.24, y + 0.32, { todas: lisa('#d23c32') });
}
/* O VARAL DE BANDEIRA: o fio ao longo de `s` na altura y, e as bandeiras
   penduradas secando, nas cores da torcida */
function varalDeBandeiras(ctx, Q, s0, s1, t, y) {
  qcaixa(ctx, Q, s0, s1, t - 0.006, t + 0.006, y - 0.01, y, { todas: lisa('#7a6a58') });
  const cores = [[ctx.c1, ctx.c2], [ctx.c2, ctx.c3], [ctx.c1, ctx.c3]];
  for (let k = 0, s = s0 + 0.25; s + 0.8 < s1 && k < 3; k++, s += 1.0) {
    qcaixa(ctx, Q, s, s + 0.8, t - 0.008, t + 0.008, y - 0.62, y - 0.01, { todas: lisa(viva(cores[k][0])) });
    qcaixa(ctx, Q, s + 0.05, s + 0.75, t - 0.01, t + 0.01, y - 0.4, y - 0.24, { todas: lisa(viva(cores[k][1])) });
  }
}
/* OS INSTRUMENTOS DO PAGODE, na malha à parte (`ctx.Bp`): no colo de quem
   toca, no lugar dele (s, t, olhando pra `olha`); o jogo só mostra no
   turno de festa */
function instrumento(ctx, Q, qual, s, t, olha) {
  const cg = { B: ctx.Bp, marca() {} }, y = ASSENTO.cadeira;
  const [fs, ft] = { '+s': [1, 0], '-s': [-1, 0], '+t': [0, 1], '-t': [0, -1] }[olha], ao = fs !== 0;
  const sp = (s0, s1, t0, t1, y0, y1, cor) => qcaixa(cg, Q, s0, s1, t0, t1, y0, y1, { todas: lisa(cor) });
  const ps = s + fs * 0.24, pt = t + ft * 0.24;
  if (qual === 'cavaco') {
    /* o corpo na barriga, o braço subindo pro lado */
    if (ao) { sp(ps - 0.04, ps + 0.04, pt - 0.16, pt + 0.16, y + 0.2, y + 0.46, '#8a4f24'); sp(ps - 0.02, ps + 0.02, pt + 0.16, pt + 0.46, y + 0.38, y + 0.44, '#3a2416'); }
    else { sp(ps - 0.16, ps + 0.16, pt - 0.04, pt + 0.04, y + 0.2, y + 0.46, '#8a4f24'); sp(ps + 0.16, ps + 0.46, pt - 0.02, pt + 0.02, y + 0.38, y + 0.44, '#3a2416'); }
  } else if (qual === 'pandeiro') {
    const [cx, cz] = Q.pt(ps, pt);
    ctx.Bp.pintar('#d8c9a4'); ctx.Bp.torno(cx, cz, [[0.13, y + 0.52], [0.13, y + 0.57], [0.001, y + 0.572]], 12, 'lisa'); ctx.Bp.pintar(null);
  } else if (qual === 'tanta') {
    /* o tantã deitado no colo, atravessado */
    if (ao) sp(ps - 0.15, ps + 0.15, pt - 0.28, pt + 0.28, y + 0.12, y + 0.42, viva(ctx.c1));
    else sp(ps - 0.28, ps + 0.28, pt - 0.15, pt + 0.15, y + 0.12, y + 0.42, viva(ctx.c1));
  } else if (qual === 'microfone') {
    /* (o pedestal fica onde pediram, na frente de quem canta) */
    sp(s - 0.012, s + 0.012, t - 0.012, t + 0.012, PISO, PISO + 1.45, PRETO);
    sp(s - 0.03, s + 0.03, t - 0.03, t + 0.03, PISO + 1.45, PISO + 1.55, '#4a4d50');
    sp(s - 0.16, s + 0.16, t - 0.16, t + 0.16, PISO, PISO + 0.02, PRETO);
  }
}

/* O PÁTIO: a porta dele é o portão da rua (`s` ao longo da fachada, `t`
   da fachada pro fundo); as portas dos cômodos ficam nas paredes do lado
   e ali nada encosta */
function patioNovo(ctx, Q) {
  if (ctx.P.dois) return patio5(ctx, Q);
  const { W, D } = Q, N = ctx.P.N, portas = portasNosLados(ctx, Q);
  const g0 = Q.pc - Q.pw / 2 - 0.3, g1 = Q.pc + Q.pw / 2 + 0.3;
  /* o fundo: a churrasqueira e o tanque no canto de cá, a caixa d'água no
     de lá, e a faixa da torcida no muro entre eles (embaixo do cobogó) */
  churrasqueira(ctx, Q, 0.3, 1.6, D - 0.7, D - 0.05, '-t');
  lugar(ctx, Q, 'churrasco', 0.95, D - 1.08, '+t', { gesto: 'churrasco' });
  tanque(ctx, Q, 1.8, 2.45, D - 0.58, D - 0.05);
  /* (no nível 4 a porta da presidência cai no canto do fundo: a caixa
     d'água sai de lá) */
  if (N !== 4) caixaDagua(ctx, Q, W - 0.72, D - 0.72, 0.52);
  /* (no nível 4 o fundo é a parede da academia, com a porta e o vidro: a
     faixa vai lá no alto, por cima deles) */
  const lf = N === 4 ? Math.min(3.6, W - 2.2) : Math.min(3.6, W - 5.0);
  if (lf > 1.4) ctx.faixa('+t', N === 4 ? W / 2 : W / 2 + 0.3, N === 4 ? PISO + 2.25 : PISO + 0.95, lf, N === 4 ? 0.62 : 0.78, Q);
  /* (no nível 4, a ÁREA DE TREINO do save vai no muro de cá, no lugar da
     mesa comprida: de 2,8 m da frente, atrás da bateria, até 0,4 m do vão
     do portão — o pátio do 4 na cidade tem 7 a 8 m de largura, então a
     zona fica com 1,6 a 2,1 m; ela leva o banco, que cai no mesmo trecho) */
  const zT = N === 4 && ctx.anexos.treino ? [0.05, Math.min(g0 - 0.1, 2.7), 2.8, Math.min(D - 2.75, 5.05, ...portas.filter(p => p.lado === '-s' && p.t1 > 2.5).map(p => p.t0 - 0.3))] : null;
  const treino4 = zT && zT[1] - zT[0] >= 1.6 && zT[3] - zT[2] >= 1.6 ? zT : null;
  /* o banco no muro do lado de cá, onde não tem porta */
  const tb0 = D - 4.2, tb1 = D - 2.4;
  if (semPorta(portas, '-s', tb0, tb1) && !(treino4 && treino4[3] > tb0 - 0.1)) {
    banco(ctx, Q, 0.05, 0.5, tb0, tb1);
    for (let t = tb0 + 0.4; t <= tb1 - 0.35; t += 0.7) lugar(ctx, Q, 'banco', 0.3, t, '+s', { sentado: true, assento: ASSENTO.banco, gesto: t < tb0 + 1 ? 'celular' : 'conversa' });
  }
  if (N === 2) {
    /* NÍVEL 2: os colchões do aliado no muro de cá (não tem hospedagem),
       o varal, a mesa, e o TREINO IMPROVISADO do lado de lá: a trave de
       madeira com o saco, o pneu, o colchonete e os halteres */
    for (let i = 0; i < 3; i++) colchao(ctx, Q, 0.1, 2.0, 2.4 + i * 1.0, 3.3 + i * 1.0, PISO, '-s', [ctx.c1, ctx.c2, ctx.c3][i]);
    varal(ctx, Q, 3.0, 2.6, 4.9);
    mesaDePlastico(ctx, Q, W / 2 - 0.9, D - 2.6, ['-s', '+s', '+t']);
    /* (a ÁREA DE TREINO do save no lugar do treino improvisado) */
    const sT = W - 2.3;
    if (ctx.anexos.treino) areaDeTreino(ctx, Q, ctx.anexos.treino, W - 3.8, W - 1.4, 4.4, Math.min(D - 3.3, 8.4), '+s', false);
    else {
      trave(ctx, Q, sT - 1.0, sT + 1.0, 5.2, 2.3, '#8a6a48');
      sacoDePancada(ctx, Q, sT, 5.2, PISO + 2.3, '#2b2b2e');
      lugar(ctx, Q, 'treino', sT, 4.55, '+t', { gesto: 'saco' });
      pneu(ctx, Q, sT + 0.2, 6.7);
      colchonete(ctx, Q, sT - 1.0, sT + 0.8, 7.4, 8.0, '#2d5fa8');
      halteres(ctx, Q, sT - 1.3, 6.5);
      lugar(ctx, Q, 'treino', sT - 1.1, 7.0, '-t', { gesto: 'halter' });
    }
    roda(ctx, Q, W / 2 - 0.4, 3.6);
    for (const [s, t, h] of [[g1 + 0.2, 0.35, 0.45], [g1 + 0.65, 0.4, 0.34]]) if (s + h < W - 1.3) caixaPapelao(ctx, Q, s, s + h, t, t + h, PISO, h);
    return;
  }
  if (N === 3) {
    /* a bateria de pé na frente, do lado de cá do portão */
    if (g0 > 3.2) bateriaDePe(ctx, Q, g0 - 2.25, 1.35, '+t', 0.62);
    /* O TREINO DO NÍVEL 3, ocupando o meio do fundo: o tatame, a trave de
       aço com os dois sacos, o supino e os halteres */
    const s0 = Math.max(2.8, W / 2 - 2.2), s1 = Math.min(W - 1.4, s0 + 4.2), t1 = D - 1.2, t0 = t1 - 3.8;
    tatame(ctx, Q, s0, s1, t0, t1, '#2d5fa8', '#1f7a3a');
    trave(ctx, Q, s0 + 0.4, s0 + 2.6, t1 - 0.25, 2.5, ACO_ESCURO);
    sacoDePancada(ctx, Q, s0 + 1.0, t1 - 0.25, PISO + 2.5, '#b8322b');
    sacoDePancada(ctx, Q, s0 + 2.0, t1 - 0.25, PISO + 2.5, '#2b2b2e');
    lugar(ctx, Q, 'treino', s0 + 1.0, t1 - 0.9, '+t', { gesto: 'saco' });
    lugar(ctx, Q, 'treino', s0 + 2.0, t1 - 0.9, '+t', { gesto: 'saco' });
    /* a luta no meio do tatame: dois de frente um pro outro */
    lugarPara(ctx, Q, 'treino', s0 + 1.1, t0 + 1.2, s0 + 2.2, t0 + 1.2, { gesto: 'guarda' });
    lugarPara(ctx, Q, 'treino', s0 + 2.2, t0 + 1.2, s0 + 1.1, t0 + 1.2, { gesto: 'guarda' });
    supino(ctx, Q, s1 - 0.6, t0 + 0.3, t0 + 1.7);
    halteres(ctx, Q, s1 - 0.7, t1 - 0.5);
    lugar(ctx, Q, 'treino', s1 - 0.55, t1 - 1.1, '-s', { gesto: 'halter' });
    /* a ÁREA DE TREINO do save: o pedaço livre do lado de lá, até 1,7 m das
       portas da coluna (no terreno de 21,6 m o pedaço tem 1,64 m: cabe) */
    if (ctx.anexos.treino && W - 1.7 - (s1 + 0.45) >= 1.6) areaDeTreino(ctx, Q, ctx.anexos.treino, s1 + 0.45, W - 1.7, t0 - 1.4, D - 1.3, '+s', false);
    mesaDePlastico(ctx, Q, 2.1, 4.4, ['-t', '+s', '+t']);
    roda(ctx, Q, Math.min(W - 2.2, g1 + 1.2), 3.3);
    pilhaCadeiras(ctx, Q, W - 1.6, D - 0.45, 6, PLASTICO, '+t');
    return;
  }
  /* NÍVEL 4 (o treino foi pra academia, no fundo): do lado de cá do
     portão, a bateria na frente e a mesa comprida atrás dela, ao longo do
     muro; do lado de lá, o pebolim na frente; a roda, as plantas nos
     cantos da frente e a pilha de cadeira no canto do fundo — o eixo do
     portão até a porta da academia fica livre */
  if (g0 > 2.0) bateriaDePe(ctx, Q, 0.45, 2.3, '+t', 0.55);
  const mt0 = 3.0, mt1 = Math.min(D - 3.2, 4.6), ms0 = 0.95, ms1 = 1.75;
  /* (a ÁREA DE TREINO do save no lugar da mesa comprida, encostada no muro de cá) */
  if (treino4) areaDeTreino(ctx, Q, ctx.anexos.treino, ...treino4, '-s', true);
  else if (mt1 - mt0 > 1.0 && g0 > 1.9) {
    mesa(ctx, Q, ms0, ms1, mt0, mt1, 0.74, PLASTICO, '#c9cbcc');
    for (let t = mt0 + 0.35; t <= mt1 - 0.3; t += 0.62) {
      cadeira(ctx, Q, ms0 - 0.38, t, '-s', PLASTICO); cadeira(ctx, Q, ms1 + 0.38, t, '+s', PLASTICO);
      lugar(ctx, Q, 'mesa', ms0 - 0.38, t, '+s', { sentado: true, assento: ASSENTO.cadeira, gesto: 'conversa' });
      lugar(ctx, Q, 'mesa', ms1 + 0.38, t, '-s', { sentado: true, assento: ASSENTO.cadeira, gesto: 'bebe' });
    }
  }
  const pbS = Math.max(g1 + 0.05, W - 1.95), pbT = 1.4;
  if (pbS + 1.2 < W - 0.3) {
    pebolim(ctx, Q, pbS, pbT, ctx.c1, ctx.c2);
    lugar(ctx, Q, 'pebolim', pbS + 0.6, pbT - 0.42, '+t', { gesto: 'pebolim' });
    lugar(ctx, Q, 'pebolim', pbS + 0.6, pbT + 0.72 + 0.42, '-t', { gesto: 'pebolim' });
  }
  roda(ctx, Q, Math.min(W - 1.4, g1 + 0.6), 4.3);
  for (const s of [0.35, W - 0.35]) if (semPorta(portas, s < 1 ? '-s' : '+s', 0.1, 0.9, 0.1)) plantaNoVaso(ctx, Q, s, 0.4);
  /* (a pilha de cadeira fica no bar: no fundo do pátio do 4 é a porta da academia e a da presidência) */
}

/* A PRESIDÊNCIA (a porta na parede do pátio, perto da frente do cômodo; `s`
   ao longo dela, `t` pra dentro): a mesa do presidente de frente pra
   porta, perto da parede do fundo, com as duas cadeiras de quem vem falar
   (o RECADO) na frente dela */
function presidenciaNova(ctx, Q) {
  const { W, D } = Q, N = ctx.P.N, [, p1] = livreDaPorta(Q);
  const ms = Math.max(p1 - 0.2, W / 2 - 0.5), mS1 = Math.min(W - 0.9, ms + 1.5), mt1 = D - 0.95, mt0 = mt1 - 0.75, mm = (ms + mS1) / 2;
  if (N >= 4) tapete(ctx, Q, ms - 0.6, mS1 + 0.5, mt0 - 1.5, D - 0.15);
  mesa(ctx, Q, ms, mS1, mt0, mt1, 0.76, MADEIRA, '#3a2618');
  computador(ctx, Q, mm - 0.3, mt1 - 0.25, PISO + 0.76, '+t');
  papeis(ctx, Q, mS1 - 0.35, (mt0 + mt1) / 2, PISO + 0.76);
  trofeu(ctx, Q, ms + 0.15, mt0 + 0.15, PISO + 0.76, 0.32);
  cadeiraEscritorio(ctx, Q, mm, D - 0.45, '+t');
  lugar(ctx, Q, 'presidente', mm, D - 0.45, '-t', { sentado: true, assento: ASSENTO.escritorio, gesto: 'digita' });
  cadeira(ctx, Q, mm - 0.35, mt0 - 0.45, '-t', '#2b2b2e');
  cadeira(ctx, Q, mm + 0.4, mt0 - 0.45, '-t', '#2b2b2e');
  lugar(ctx, Q, 'recado', mm - 0.35, mt0 - 0.45, '+t', { sentado: true, assento: ASSENTO.cadeira, gesto: 'conversa' });
  lugar(ctx, Q, 'recado', mm + 0.4, mt0 - 0.45, '+t', { sentado: true, assento: ASSENTO.cadeira, gesto: 'escuta' });
  /* atrás dele, a bandeira da torcida e o ar-condicionado */
  bandeiraParede(ctx, Q, '+t', Math.max(0.3, mm - 0.9), Math.min(W - 0.3, mm + 0.9), PISO + 1.25, PISO + 2.15, ctx.cores);
  arInterno(ctx, Q, '+t', Math.min(W - 0.6, mS1 + 0.2), PISO + 2.3);
  /* o armário na parede da frente, o sofá na de trás com a mesinha */
  armario(ctx, Q, 0.05, 0.5, 1.9, Math.min(D - 1.2, 3.1), 1.8, '+s', MADEIRA, 2);
  sofa(ctx, Q, W - 0.85, W - 0.08, 0.3, Math.min(2.1, mt0 - 0.2), '+s', '#2f3a4a');
  lugar(ctx, Q, 'sofa', W - 0.45, 0.8, '-s', { sentado: true, assento: ASSENTO.sofa, gesto: 'celular' });
  mural(ctx, Q, '-t', p1 + 0.25, Math.min(W - 1.3, p1 + 1.05), PISO + 1.4, PISO + 2.1);
  if (N < 4) return;
  /* MAIS DETALHES (o 4 e o 5): a estante de troféus, os quadros com a
     camisa, a TV, o frigobar, o cofre e a planta */
  if (D > 4.2) estanteDeTrofeus(ctx, Q, '-s', 3.3, Math.min(D - 0.3, 4.9));
  ctx.camisa(Q, '+s', 2.7, PISO + 1.6, 0.55, 0.7, 1);
  if (D > 3.9) ctx.camisa(Q, '+s', 3.5, PISO + 1.6, 0.55, 0.7, 2);
  tv(ctx, Q, '-t', Math.min(W - 0.75, p1 + 1.95), PISO + 1.55, 1.0);
  frigobar(ctx, Q, W - 0.62, W - 0.08, mt0 - 0.1, mt0 + 0.42);
  /* O COFRE BLINDADO (o anexo do save): do lado da mesa, no lugar do
     cofrinho, ou no canto do fundo do outro lado */
  if (ctx.anexos.cofre && mS1 + 1.0 < W - 0.55) cofreBlindado(ctx, Q, mS1 + 0.15, mS1 + 1.0, D - 0.8, D - 0.06, '-t');
  else if (ctx.anexos.cofre && ms > 1.5) cofreBlindado(ctx, Q, 0.08, 0.93, D - 0.8, D - 0.06, '-t');
  else if (mS1 + 0.75 < W - 0.6) cofre(ctx, Q, mS1 + 0.15, mS1 + 0.7, D - 0.6, D - 0.06, '-t');
  plantaNoVaso(ctx, Q, W - 0.35, D - 0.35);
}

/* O BAR PRA RUA (a porta é a de enrolar na fachada, do lado de cá: `s` ao
   longo da rua, `t` pra dentro): o balcão no fundo com o barman atrás, a
   prateleira e o armário na parede do fundo, a geladeira no canto, as
   banquetas na frente do balcão, o freezer e o engradado, a TV na parede
   — e a MESA DO PAGODE do lado de lá da porta: o cavaquinho, o tantã e o
   pandeiro em volta dela, e quem canta de pé no microfone (esses lugares
   só enchem no turno de festa, e os instrumentos só aparecem nele) */
function barDaRua(ctx, Q) {
  const { W, D } = Q, pf1 = Q.pc + Q.pw / 2;
  /* o fundo: o armário e a prateleira na parede (35 cm), a passagem do
     barman (85 cm) e o balcão (52 cm), com a PORTINHOLA na ponta de cá (a
     da porta): é por ela que o barman entra; a geladeira no canto de lá */
  const ARM = 0.35, PASS = 0.85, BAL = 0.52, bt1 = D - ARM - PASS, bt0 = bt1 - BAL, gap = 0.95;
  qcaixa(ctx, Q, gap, W - 0.05, bt0, bt1, PISO, PISO + 1.0, { todas: lisa(ctx.c2), topo: lisa(GRANITO), base: null }, ctx.c2);
  naParede(ctx, Q, '+t', 0.1, W - 0.9, PISO + 1.2, PISO + 2.1, 0.26, { todas: lisa('#5b3b22'), frente: { k: 'prateleira', modo: 'esticar' } });
  naParede(ctx, Q, '+t', 0.1, W - 0.9, PISO, PISO + 0.9, ARM, { todas: lisa(MADEIRA), topo: lisa(GRANITO), frente: { k: 'armario', modo: 'esticar' } }, MADEIRA);
  geladeira(ctx, Q, W - 0.78, W - 0.08, D - 0.72, D - 0.06, '-s');
  lugar(ctx, Q, 'barman', Math.min(W - 1.2, Math.max(1.4, W / 2)), bt1 + PASS / 2, '-t', { gesto: 'balcao' });
  /* A MESA DO PAGODE, na frente e do lado de lá (longe da porta e da portinhola) */
  const ps = Math.max(pf1 + 0.85, W - 1.0), pt = Math.max(0.95, Math.min(1.1, bt0 - 1.45));
  mesa(ctx, Q, ps - 0.3, ps + 0.3, pt - 0.3, pt + 0.3, 0.72, '#e8b923', '#9aa0a4');
  const sent = { sentado: true, assento: ASSENTO.cadeira };
  for (const [ds, dt, qual, costas] of [[-0.62, 0, 'cavaco', '-s'], [0.62, 0, 'tanta', '+s'], [0, -0.6, 'pandeiro', '-t']]) {
    const s = ps + ds, t = pt + dt;
    if (s + 0.22 > W - 0.03 || t - 0.22 < 0.05) continue;
    cadeira(ctx, Q, s, t, costas, '#d23c32');
    const olha = { '-s': '+s', '+s': '-s', '+t': '-t', '-t': '+t' }[costas];
    lugar(ctx, Q, 'pagode', s, t, olha, Object.assign({ gesto: qual }, sent));
    instrumento(ctx, Q, qual, s, t, olha);
  }
  /* quem canta: de pé do lado do balcão da mesa, virado pra rua, e o
     pedestal do microfone na frente dele */
  lugar(ctx, Q, 'pagode', ps, pt + 0.68, '-t', { gesto: 'canta' });
  instrumento(ctx, Q, 'microfone', ps + 0.18, pt + 0.4, '-t');
  /* as banquetas no balcão, da portinhola até perto da roda do pagode */
  for (let s = gap + 0.35; s <= W - 0.4; s += 0.55) {
    if (Math.abs(s - ps) < 0.9) continue;
    banqueta(ctx, Q, s, bt0 - 0.35, ctx.c1);
    lugar(ctx, Q, 'balcao', s, bt0 - 0.35, '+t', { sentado: true, assento: ASSENTO.banqueta, gesto: 'bebe' });
  }
  /* a TV lá no alto da parede de cá; o freezer e o engradado encostados na
     parede da rua, entre a porta e o pagode, quando cabe */
  tv(ctx, Q, '-s', Math.max(0.8, Math.min(bt0 - 0.5, 1.6)), PISO + 1.75, 0.9);
  const fz0 = pf1 + 0.2, fz1 = fz0 + 0.65;
  if (fz1 < ps - 0.62 - 0.3) {
    freezer(ctx, Q, fz0, fz1, 0.08, 0.72, '+t');
    if (fz1 + 0.75 < ps - 0.92) engradados(ctx, Q, fz1 + 0.25, 0.1, 2);
  }
}

/* A HOSPEDAGEM (a porta na parede do pátio, perto da frente; `s` ao
   longo dela, `t` pra dentro): os beliches — 2 no nível 3, 3 no 4 e 4 no
   5 — primeiro na parede de lá, depois na do fundo do cômodo e na da
   frente (atravessados, depois da folha da porta); o armário de aço, o
   ventilador, a mesa com duas cadeiras e os colchões extras. A cama de
   baixo de cada beliche é um lugar (o aliado que dorme ali) */
function hospedagemNova(ctx, Q) {
  const { W, D } = Q, N = ctx.P.N, [, p1] = livreDaPorta(Q), cores = [ctx.c1, ctx.c2, ctx.c3];
  const quer = N >= 5 ? 6 : N === 4 ? 3 : 2, tMax = D - 1.05;
  const camas = [];
  for (let s = 0.1; s + 2.0 <= W - 0.08 && camas.length < quer; s += 2.1) camas.push({ lado: '+t', a: s });
  /* (a da parede do fundo do cômodo fica antes da fileira da parede de lá: não encosta nela) */
  for (let t = 0.3; t + 2.0 <= tMax && camas.length < quer; t += 2.1) camas.push({ lado: '+s', a: t });
  let naFrente = false;
  for (let t = 1.9; t + 2.0 <= tMax && camas.length < quer; t += 2.1) { camas.push({ lado: '-s', a: t }); naFrente = true; }
  /* A ENFERMARIA (o anexo do save) fica no lugar do último beliche */
  const enf = ctx.anexos.enfermaria && camas.length >= 2 ? camas.pop() : null;
  if (enf && enf.lado === '-s') naFrente = true;   // (a parede de cá é da maca: o armário vai pra da porta)
  if (enf) enfermaria(ctx, Q, enf);
  camas.forEach((c, k) => {
    const c1 = cores[k % 3], c2 = cores[(k + 1) % 3];
    if (c.lado === '+t') {
      beliche(ctx, Q, c.a, c.a + 2.0, D - 0.98, D - 0.06, k % 2 ? '+s' : '-s', c1, c2);
      lugar(ctx, Q, 'cama', c.a + 1.0, D - 0.8, '-t', { sentado: true, assento: ASSENTO.cama, gesto: k % 2 ? 'conversa' : 'celular' });
    } else if (c.lado === '+s') {
      beliche(ctx, Q, W - 0.98, W - 0.06, c.a, c.a + 2.0, '-t', c1, c2);
      lugar(ctx, Q, 'cama', W - 0.8, c.a + 1.0, '-s', { sentado: true, assento: ASSENTO.cama, gesto: 'celular' });
    } else {
      beliche(ctx, Q, 0.06, 0.98, c.a, c.a + 2.0, '+t', c1, c2);
      lugar(ctx, Q, 'cama', 0.8, c.a + 1.0, '+s', { sentado: true, assento: ASSENTO.cama, gesto: 'conversa' });
    }
  });
  /* o armário de aço na parede da frente do cômodo (ou, se ela ganhou
     beliche, na parede da porta, depois da folha) */
  if (!naFrente) armarioAco(ctx, Q, 0.06, 0.5, 1.9, Math.min(D - 1.1, 3.1), 1.8, '+s', 3);
  else armarioAco(ctx, Q, p1 + 0.25, p1 + 1.25, 0.06, 0.5, 1.8, '+t', 3);
  const temPonta = camas.some(c => c.lado === '+s') || !!(enf && enf.lado === '+s');
  ventilador(ctx, Q, temPonta ? Math.min(W - 1.3, 3.9) : W - 0.4, D - 1.3);
  /* a mesa com duas cadeiras no meio */
  const ms = Math.max(p1 + 0.6, 1.4), mt = Math.min(D - 1.9, 2.1);
  if (ms + 0.9 < W - (temPonta ? 1.2 : 0.4) && mt > 1.4) {
    mesa(ctx, Q, ms - 0.4, ms + 0.4, mt - 0.3, mt + 0.3, 0.74, MADEIRA_CLARA, '#6b6f73');
    cadeira(ctx, Q, ms - 0.7, mt, '-s', PLASTICO); cadeira(ctx, Q, ms + 0.7, mt, '+s', PLASTICO);
    lugar(ctx, Q, 'mesa', ms - 0.7, mt, '+s', { sentado: true, assento: ASSENTO.cadeira, gesto: 'conversa' });
    lugar(ctx, Q, 'mesa', ms + 0.7, mt, '-s', { sentado: true, assento: ASSENTO.cadeira, gesto: 'celular' });
  }
  /* os colchões extras empilhados, no 4 e no 5 */
  if (N >= 4) {
    const cs = naFrente ? W - 2.1 : 0.62;
    for (let k = 0; k < 3; k++) colchao(ctx, Q, cs + k * 0.02, cs + 0.88 - k * 0.02, D - 1.9, D - 1.1, PISO + k * 0.14, '+s', AZUL_COLCHAO, 0.13);
  }
  if (N >= 5) tv(ctx, Q, '-t', W - 0.6, PISO + 1.75, 0.8);
}

/* O PATRIMÔNIO (a porta na parede do pátio; `t` pra dentro): OS DOIS
   ARMÁRIOS DE TELA na parede de lá — o do patrimônio da torcida e o das
   tomadas, com cadeado (o dono, 29/09/2026) — e é clicando neles que o
   jogo abre a lista do que tem dentro; a estante de aço na parede do
   fundo do cômodo, os surdos, os mastros e as caixas */
function patrimonioNovo(ctx, Q) {
  const { W, D } = Q, [, p1] = livreDaPorta(Q);
  const aw = Math.min(1.25, (W - 0.2) / 2 - 0.02), a0 = Math.max(0.08, W / 2 - aw - 0.02), am = W / 2;
  armarioDeTela(ctx, Q, a0, am - 0.02, D - 0.55, D - 0.05, 2.0, '-t', { tipo: 'patrimonio', placa: 'PATRIMÔNIO' });
  armarioDeTela(ctx, Q, am + 0.02, am + aw + 0.02, D - 0.55, D - 0.05, 2.0, '-t', { tipo: 'tomadas', placa: 'TOMADAS', cadeado: true });
  for (let s = a0 + 0.2; s < am + aw - 0.1; s += 0.42) trofeu(ctx, Q, s, D - 0.3, PISO + 2.0, 0.26 + ((Math.round(s * 7)) % 3) * 0.05);
  lugar(ctx, Q, 'estante', (a0 + am) / 2, D - 0.95, '+t', { gesto: 'arruma', armario: 'patrimonio' });
  lugar(ctx, Q, 'armario', (am + am + aw) / 2, D - 0.95, '+t', { gesto: 'arruma', armario: 'tomadas' });
  /* a estante de aço na parede do fundo do cômodo (+s), com caixa e bandeira
     enrolada; com o GALPÃO DE MATERIAL (o anexo do save), a gaiola de tela
     cheia no lugar dela (até o meio metro da frente dos armários) */
  if (ctx.anexos.galpao && D - 1.25 - 1.6 >= 0.9) gaiolaDeMaterial(ctx, Q, W - 0.85, W - 0.05, 1.6, D - 1.25, '-s');
  else if (D - 0.7 - 1.9 > 1.0) estanteAco(ctx, Q, W - 0.45, W - 0.05, 1.9, D - 0.7, 1.9, 4, (i, b0, b1, c0, c1, y) => {
    if (i === 1) { bandeiraEnrolada(ctx, Q, b0, b1, c0, c0 + 0.8, y, ctx.c1, ctx.c2); bandeiraEnrolada(ctx, Q, b0, b1, c0 + 0.9, Math.min(c1, c0 + 1.7), y, ctx.c2, ctx.c1); return; }
    for (let t = c0; t + 0.32 <= c1; t += 0.36) caixaPapelao(ctx, Q, b0, b1, t, t + 0.32, y, 0.22);
  });
  /* os surdos no chão e os mastros encostados no canto da frente */
  surdo(ctx, 0.42, 2.25, PISO, 0.3, 0.6, ctx.c1, Q);
  surdo(ctx, 0.42, 2.25, PISO + 0.6, 0.26, 0.5, ctx.c3, Q);
  if (D > 4.3) surdo(ctx, 0.4, 2.95, PISO, 0.26, 0.5, ctx.c2, Q);
  for (let k = 0; k < 3; k++) qcaixa(ctx, Q, W - 0.2 - k * 0.05, W - 0.17 - k * 0.05, 0.1, 0.13, PISO, PISO + 2.2, { todas: lisa('#caa77a'), base: null });
  if (p1 + 0.6 < W - 0.5) caixaPapelao(ctx, Q, W - 0.75, W - 0.25, 0.45, 0.95, PISO, 0.46);
}

/* O MARKETING (a porta na parede do pátio; `t` pra dentro): a mesa com os
   dois monitores na parede de lá, o rapaz sentado de costas pra porta
   mexendo no computador, e em volta dele os QUADROS COM A CAMISA da
   torcida (a de jogo, a listrada, a retrô); o tripé com o anel de luz, a
   estante com a camisa dobrada e o banner de pé */
function marketingNovo(ctx, Q) {
  const { W, D } = Q, [, p1] = livreDaPorta(Q), portas = portasNosLados(ctx, Q);
  const ms0 = Math.max(0.15, W / 2 - 0.8), ms1 = Math.min(W - 0.15, W / 2 + 0.8), mm = (ms0 + ms1) / 2;
  mesa(ctx, Q, ms0, ms1, D - 0.72, D - 0.05, 0.75, BRANCO, '#6b6f73');
  computador(ctx, Q, mm - 0.32, D - 0.3, PISO + 0.75, '-t');
  computador(ctx, Q, mm + 0.32, D - 0.3, PISO + 0.75, '-t');
  papeis(ctx, Q, ms1 - 0.3, D - 0.45, PISO + 0.75);
  cadeiraEscritorio(ctx, Q, mm, D - 1.08, '-t');
  lugar(ctx, Q, 'marketing', mm, D - 1.08, '+t', { sentado: true, assento: ASSENTO.escritorio, gesto: 'digita' });
  /* os quadros: na parede de lá (em cima da mesa) e nas duas do lado */
  ctx.camisa(Q, '+t', mm, PISO + 1.75, 0.5, 0.62, 0);
  const tq = [];
  for (let t = Math.max(3.05, D - 2.6); t <= D - 1.0 && tq.length < 2; t += 0.8) tq.push(t);
  tq.forEach((t, k) => { ctx.camisa(Q, '-s', t, PISO + 1.6, 0.5, 0.62, k + 1); ctx.camisa(Q, '+s', t, PISO + 1.6, 0.5, 0.62, (k + 2) % 3); });
  /* o tripé com a luz num canto da frente; a estante da camisa dobrada no outro */
  tripeComLuz(ctx, Q, W - 0.45, Math.max(1.85, Math.min(D - 2.4, 2.2)));
  if (W > 2.4) estanteAco(ctx, Q, 0.05, 0.45, 1.9, Math.min(D - 1.4, 2.9), 1.7, 4, (i, b0, b1, c0, c1, y) => {
    const cs = [ctx.c1, ctx.c2, ctx.c3, ctx.c1];
    for (let t = c0, k = 0; t + 0.28 <= c1; t += 0.32, k++)
      for (let j = 0; j < 3; j++) qcaixa(ctx, Q, b0 + 0.02, b1 - 0.02, t, t + 0.28, y + j * 0.035, y + 0.03 + j * 0.035, { todas: lisa(viva(cs[(i + k) % 4])) });
  });
  /* o banner de pé (o rolo e a lona com a cor da torcida) */
  if (semPorta(portas, '-s', 0, 1)) {
    const bs = Math.min(W - 0.3, p1 + 0.5);
    qcaixa(ctx, Q, bs - 0.35, bs + 0.35, 0.12, 0.2, PISO, PISO + 0.08, { todas: lisa('#9aa0a4') });
    qcaixa(ctx, Q, bs - 0.3, bs + 0.3, 0.155, 0.165, PISO + 0.08, PISO + 1.75, { todas: lisa(viva(ctx.c1)), '-t': lisa(viva(ctx.c1)), '+t': lisa(viva(ctx.c2)) });
  }
}

/* O SETOR CRIATIVO (o nível 5; a porta na parede do pátio, `t` pra
   dentro): a mesa grande no meio com a FAIXA NOVA sendo pintada (a do
   nome da torcida, deitada), as latas de tinta, quem pinta dos dois lados;
   a mesa da costura na parede de lá com a máquina e quem costura; os rolos
   de pano na estante; o varal com as bandeiras secando lá em cima; o
   bandeirão dobrado no chão e os mastros de bambu no canto */
function criativoNovo(ctx, Q) {
  const { W, D } = Q, [, p1] = livreDaPorta(Q);
  const ms = W / 2, mt0 = 1.9, mt1 = Math.min(D - 1.3, mt0 + 2.3), h = 0.8;
  mesa(ctx, Q, ms - 0.55, ms + 0.55, mt0, mt1, h, MADEIRA_CLARA, '#6b6f73');
  qcaixa(ctx, Q, ms - 0.5, ms + 0.5, mt0 + 0.08, mt1 - 0.08, PISO + h, PISO + h + 0.004, { todas: null, topo: lisa('#f1ede2') });
  ctx.faixaDeitada(Q, ms - 0.42, ms + 0.42, mt0 + 0.2, mt1 - 0.2, PISO + h + 0.008, '+t');
  for (const [s, t, c] of [[ms + 0.4, mt0 + 0.1, ctx.c1], [ms - 0.42, mt1 - 0.12, ctx.c2]]) lataDeTinta(ctx, Q, s, t, PISO + h, viva(c));
  lataDeTinta(ctx, Q, ms - 0.85, mt0 + 0.3, PISO, viva(ctx.c3));
  lugar(ctx, Q, 'criativo', ms - 0.9, (mt0 + mt1) / 2 + 0.3, '+s', { gesto: 'pinta' });
  lugar(ctx, Q, 'criativo', ms + 0.9, (mt0 + mt1) / 2 - 0.2, '-s', { gesto: 'pinta' });
  /* a costura na parede de lá */
  const cs0 = Math.max(0.15, W - 1.6), cs1 = W - 0.1;
  mesa(ctx, Q, cs0, cs1, D - 0.65, D - 0.05, 0.75, BRANCO, '#6b6f73');
  maquinaDeCostura(ctx, Q, (cs0 + cs1) / 2, D - 0.35, PISO + 0.75, '-t');
  cadeira(ctx, Q, (cs0 + cs1) / 2, D - 1.0, '-t', '#2b2b2e');
  lugar(ctx, Q, 'costura', (cs0 + cs1) / 2, D - 1.0, '+t', { sentado: true, assento: ASSENTO.cadeira, gesto: 'costura' });
  /* os rolos de pano, na cor da torcida, na estante da parede da frente do cômodo */
  estanteAco(ctx, Q, 0.05, 0.5, 1.9, Math.min(D - 0.8, 3.6), 1.9, 4, (i, b0, b1, c0, c1, y) => {
    const cs = [ctx.c1, ctx.c2, ctx.c3];
    for (let t = c0, k = 0; t + 0.3 <= c1; t += 0.34, k++) bandeiraEnrolada(ctx, Q, b0, b1, t, t + 0.28, y, viva(cs[(i + k) % 3]), '#e9e6dc');
  });
  /* o varal das bandeiras secando, atravessado lá no alto */
  varalDeBandeiras(ctx, Q, 0.6, W - 0.3, D - 1.55, PISO + 2.45);
  /* o bandeirão dobrado no chão, no canto de lá, e os mastros de bambu */
  qcaixa(ctx, Q, 0.1, 1.5, D - 0.95, D - 0.1, PISO, PISO + 0.16, { todas: lisa(viva(ctx.c1)) }, ctx.c1);
  qcaixa(ctx, Q, 0.1, 1.5, D - 0.6, D - 0.5, PISO + 0.16, PISO + 0.165, { todas: null, topo: lisa(viva(ctx.c2)) });
  for (let k = 0; k < 4; k++) qcaixa(ctx, Q, W - 0.22 - k * 0.05, W - 0.18 - k * 0.05, 0.1, 0.14, PISO, PISO + 2.5 - k * 0.12, { todas: lisa('#caa77a'), base: null });
}

/* A GARAGEM (a porta é a fachada: `s` ao longo dela, `t` pra dentro): os
   ônibus não são daqui (o jogo põe os do save, malha à parte, de frente
   pra rua); aqui a mancha de óleo embaixo de cada um, o tambor de óleo e
   os pneus no fundo do lado, o extintor na parede */
const BANCADA_G = 0.35;   // o fundo da bancada da garagem (m)
function garagemNova(ctx, Q) {
  const { W, D } = Q, P = ctx.P, n = P.vagas ? P.vagas.length : 1, baia = W / n;
  for (let i = 0; i < n; i++) {
    const s = (i + 0.5) * baia;
    manchaOleo(ctx, Q, s - 0.45, s + 0.35, 2.2, 3.1);
    manchaOleo(ctx, Q, s - 0.3, s + 0.4, D - 3.4, D - 2.7);
  }
  extintor(ctx, Q, '-s', 1.2);
  /* a bancada de ferramenta no fundo, atrás dos ônibus (a vaga deixa 10 cm
     entre ela e o para-choque), e o quadro das ferramentas */
  naParede(ctx, Q, '+t', 0.15, W - 0.15, PISO, PISO + 0.88, BANCADA_G, { todas: lisa('#6b4a2e'), topo: lisa('#8a6a48') }, '#6b4a2e');
  naParede(ctx, Q, '+t', 0.3, Math.min(W - 0.3, 2.4), PISO + 1.15, PISO + 1.85, 0.02, { todas: lisa('#c9b48f') });
  for (let s = 0.45; s < Math.min(W - 0.4, 2.3); s += 0.28) naParede(ctx, Q, '+t', s, s + 0.06, PISO + 1.3, PISO + 1.7, 0.05, { todas: lisa(s * 7 % 2 < 1 ? '#c8342b' : '#3a3d40') });
}

/* =======================================================
   O NÍVEL 5 EM DOIS ANDARES: a laje, os pilares, a escada e o
   guarda-corpo (em metro, no referencial do modelo)
   ======================================================= */
/* A LAJE do 1º andar: por baixo o forro claro do térreo, por cima o
   contrapiso (o piso de cada cômodo de cima fica em cima dela) e a borda
   na cor 2 — na fachada, a faixa entre os dois andares */
function lajes3d(ctx) {
  const { B, P, u } = ctx, y1 = u(P.H1), y0 = u(P.TERREO);
  for (const l of P.lajes)
    B.caixa(u(l.u0), u(l.u1), y0, y1, u(l.v0), u(l.v1), { todas: lisa(ctx.c2), topo: { k: 'laje', tinta: '#bdb8ad' }, base: lisa(CLARO) });
}
/* os PILARES que seguram a varanda, na cor 3 da torcida */
function pilares3d(ctx) {
  const { B, P, u } = ctx, y1 = u(P.TERREO), r = 0.13;
  for (const p of P.pilares) B.caixa(u(p.u) - r, u(p.u) + r, 0, y1, u(p.v) - r, u(p.v) + r, { todas: lisa(ctx.c3), base: null, topo: null });
}
/* A ESCADA de concreto, encostada no muro do fundo do pátio: o degrau de
   uns 18 cm por 28, maciça por baixo, e o corrimão do lado do pátio (o
   outro lado é o muro); sobe pro lado de `sobe` e chega no piso de cima */
function escada3d(ctx) {
  /* (o espelho até 17 cm: o boneco a pé do cenário tem a faixa do corpo de
     35 cm do pé, e dois espelhos juntos têm de ficar abaixo dela) */
  /* (a subida é a de piso a piso: do piso do pátio ao da varanda, que fica
     em cima da laje, `ANDAR_5.h1` acima — todo espelho do mesmo tamanho) */
  const { B, P, u } = ctx, e = P.escada, h = ANDAR_5.h1, n = Math.ceil(h / 0.17), esp = h / n, nd = n - 1;
  const x0 = u(e.u0), x1 = u(e.u1), z0 = u(e.v0), z1 = u(e.v1), piso = (x1 - x0) / nd, desce = e.sobe === '-u';
  const concreto = { todas: { k: 'laje_borda', tinta: '#cfcac0' }, topo: { k: 'laje', tinta: '#bdb8ad' }, base: null };
  for (let i = 0; i < nd; i++) {
    /* o degrau i (o de baixo na ponta de onde se sobe) */
    const a = desce ? x1 - (i + 1) * piso : x0 + i * piso;
    B.caixa(a, a + piso, 0, PISO + (i + 1) * esp, z0, z1, concreto);
  }
  /* o corrimão: um montante a cada três degraus e o tubo inclinado */
  const zc = z0 + 0.05, alto = 0.9, topoDe = x => PISO + (desce ? x1 - x : x - x0) / piso * esp + esp * 0.5;
  for (let i = 0; i < nd; i += 3) {
    const x = desce ? x1 - (i + 0.5) * piso : x0 + (i + 0.5) * piso, y = PISO + (i + 1) * esp;
    B.caixa(x - 0.025, x + 0.025, y, y + alto, zc - 0.025, zc + 0.025, { todas: lisa(ACO_ESCURO), base: null });
  }
  const xa = desce ? x1 - 0.5 * piso : x0 + 0.5 * piso, xb = desce ? x0 + 0.1 : x1 - 0.1;
  B.pintar(ACO_ESCURO);
  B.viga([xa, topoDe(xa) + alto - 0.05, zc], [xb, topoDe(xb) + alto - 0.05, zc], 0.05, 0.05, 'lisa');
  B.pintar(null);
  ctx.marca(Math.min(x0, x1), Math.max(x0, x1), z0, z1, '#9d998f');
}
/* O GUARDA-CORPO da varanda (o 1º andar): a mureta de alvenaria na cor
   1, a grade preta em cima dela e o corrimão de aço, até 1,1 m */
function guardas3d(ctx, guardas) {
  const { B, G, u } = ctx;
  for (const g of guardas || []) {
    const x0 = u(Math.min(g.u0, g.u1)), x1 = u(Math.max(g.u0, g.u1)), z0 = u(Math.min(g.v0, g.v1)), z1 = u(Math.max(g.v0, g.v1));
    const X = x1 - x0 > z1 - z0, e = 0.06;
    const [a0, a1, b0, b1] = X ? [x0, x1, z0 - e, z0 + e] : [x0 - e, x0 + e, z0, z1];
    B.caixa(a0, a1, PISO, PISO + 0.35, b0, b1, { todas: lisa(ctx.c1), topo: lisa(ctx.c2) });
    B.caixa(a0 - 0.01, a1 + 0.01, PISO + 1.05, PISO + 1.1, b0 - 0.015, b1 + 0.015, { todas: lisa(ACO_ESCURO) });
    const L = X ? a1 - a0 : b1 - b0, n = Math.max(1, Math.ceil(L / 1.5));
    for (let k = 0; k <= n; k++) {
      const a = (X ? a0 : b0) + L * k / n;
      if (X) B.caixa(a - 0.025, a + 0.025, PISO + 0.35, PISO + 1.05, b0 + 0.02, b1 - 0.02, { todas: lisa(ACO_ESCURO), base: null, topo: null });
      else B.caixa(a0 + 0.02, a1 - 0.02, PISO + 0.35, PISO + 1.05, a - 0.025, a + 0.025, { todas: lisa(ACO_ESCURO), base: null, topo: null });
    }
    const F = X ? G.plano([a0, PISO + 0.35, (b0 + b1) / 2], [1, 0, 0], [0, 1, 0]) : G.plano([(a0 + a1) / 2, PISO + 0.35, b0], [0, 0, 1], [0, 1, 0]);
    G.ladrilhar(F, G.ret(0, L, 0, 0.7), 'preta');
  }
}

/* =======================================================
   A ACADEMIA (os níveis 4 e 5)
   ======================================================= */
/* O RINGUE (o nível 5): o tablado com a lona clara e a saia na cor 1, os
   quatro postes e as três cordas, uma em cada cor da torcida */
const RINGUE_H = 0.45;
function ringue(ctx, Q, s0, s1, t0, t1) {
  const h = RINGUE_H;
  qcaixa(ctx, Q, s0, s1, t0, t1, PISO, PISO + h, { todas: lisa(ctx.c1), topo: lisa('#e7e2d6'), base: null }, ctx.c1);
  const r = 0.06, alt = 1.3, cantos = [[s0 + 0.12, t0 + 0.12], [s1 - 0.12, t0 + 0.12], [s1 - 0.12, t1 - 0.12], [s0 + 0.12, t1 - 0.12]];
  for (const [s, t] of cantos) qcaixa(ctx, Q, s - r, s + r, t - r, t + r, PISO + h, PISO + h + alt, { todas: lisa(ACO_ESCURO), base: null });
  [0.42, 0.78, 1.14].forEach((y, k) => {
    const c = { todas: lisa(viva([ctx.c1, ctx.c2, ctx.c3][k])) }, yy = PISO + h + y;
    qcaixa(ctx, Q, s0 + 0.12, s1 - 0.12, t0 + 0.1, t0 + 0.14, yy, yy + 0.035, c);
    qcaixa(ctx, Q, s0 + 0.12, s1 - 0.12, t1 - 0.14, t1 - 0.1, yy, yy + 0.035, c);
    qcaixa(ctx, Q, s0 + 0.1, s0 + 0.14, t0 + 0.12, t1 - 0.12, yy, yy + 0.035, c);
    qcaixa(ctx, Q, s1 - 0.14, s1 - 0.1, t0 + 0.12, t1 - 0.12, yy, yy + 0.035, c);
  });
}
/* o rack de halteres: duas prateleiras de aço, os pares em fila */
function rackDeHalteres(ctx, Q, s0, s1, t0, t1) {
  const aoS = s1 - s0 >= t1 - t0, aco = { todas: lisa(ACO_ESCURO) };
  for (const y of [0.32, 0.68]) qcaixa(ctx, Q, s0, s1, t0, t1, PISO + y, PISO + y + 0.04, aco);
  for (const [s, t] of [[s0 + 0.03, t0 + 0.03], [s1 - 0.03, t0 + 0.03], [s1 - 0.03, t1 - 0.03], [s0 + 0.03, t1 - 0.03]])
    qcaixa(ctx, Q, s - 0.025, s + 0.025, t - 0.025, t + 0.025, PISO, PISO + 0.72, { todas: lisa(ACO_ESCURO), base: null });
  const L = aoS ? s1 - s0 : t1 - t0, n = Math.max(2, Math.floor((L - 0.1) / 0.2));
  for (const y of [0.36, 0.72]) for (let k = 0; k < n; k++) {
    const a = (aoS ? s0 : t0) + 0.1 + (L - 0.2) * (k + 0.5) / n, m = aoS ? (t0 + t1) / 2 : (s0 + s1) / 2, d = 0.05 + (k % 3) * 0.01;
    if (aoS) qcaixa(ctx, Q, a - d, a + d, m - 0.13, m + 0.13, PISO + y, PISO + y + 0.1, { todas: lisa('#1f2124') });
    else qcaixa(ctx, Q, m - 0.13, m + 0.13, a - d, a + d, PISO + y, PISO + y + 0.1, { todas: lisa('#1f2124') });
  }
  ctx.marca(...Q.ret(s0, s1, t0, t1), ACO_ESCURO);
}
/* o espelho de parede */
const espelho = (ctx, Q, lado, a0, a1, topo = 2.1) =>
  naParede(ctx, Q, lado, a0, a1, PISO + 0.3, PISO + topo, 0.02, { todas: lisa('#8f9aa0'), frente: lisa('#c7d6dc') });
/* a esteira: a lona ao longo de `t`, o painel na ponta de t0 */
function esteira(ctx, Q, s, t0, t1) {
  qcaixa(ctx, Q, s - 0.36, s + 0.36, t0, t1, PISO, PISO + 0.2, { todas: lisa('#2b2d30'), topo: lisa('#1b1c1e') }, '#2b2d30');
  for (const d of [-0.32, 0.32]) qcaixa(ctx, Q, s + d - 0.03, s + d + 0.03, t0 + 0.06, t0 + 0.13, PISO + 0.2, PISO + 1.18, { todas: lisa('#3a3c40'), base: null });
  qcaixa(ctx, Q, s - 0.34, s + 0.34, t0, t0 + 0.22, PISO + 1.1, PISO + 1.26, { todas: lisa('#2b2d30'), '+t': lisa('#3a5a78') });
}
function academiaNova(ctx, Q) {
  const { W, D } = Q, N = ctx.P.N, [p0, p1] = livreDaPorta(Q);
  if (N >= 5) {
    /* NO 1º ANDAR DO NÍVEL 5 (a porta na parede da varanda: `s` da
       fachada pro fundo, `t` pra dentro): o RINGUE no fundo, os três sacos
       na viga ao longo da fachada, o espelho com o rack de halteres e o
       supino na parede da hospedagem, as duas esteiras perto da varanda */
    const rs0 = Math.max(0.9, W / 2 - 2.0), rs1 = Math.min(W - 0.6, rs0 + 4.0), rt1 = D - 0.5, rt0 = rt1 - Math.min(4.0, rs1 - rs0);
    ringue(ctx, Q, rs0, rs1, rt0, rt1);
    const rm = (rs0 + rs1) / 2, rtm = (rt0 + rt1) / 2;
    lugarPara(ctx, Q, 'treino', rm - 0.7, rtm, rm + 0.7, rtm, { gesto: 'guarda', elevado: RINGUE_H });
    lugarPara(ctx, Q, 'treino', rm + 0.7, rtm, rm - 0.7, rtm, { gesto: 'guarda', elevado: RINGUE_H });
    /* a viga dos sacos ao longo da fachada, nos dois pés dela */
    const bt0 = 1.3, bt1 = Math.min(rt0 - 0.9, 4.6);
    for (const t of [bt0, bt1]) qcaixa(ctx, Q, 0.7, 0.8, t - 0.05, t + 0.05, PISO, PISO + 2.45, { todas: lisa(ACO_ESCURO), base: null }, ACO_ESCURO);
    qcaixa(ctx, Q, 0.69, 0.81, bt0 - 0.06, bt1 + 0.06, PISO + 2.45, PISO + 2.55, { todas: lisa(ACO_ESCURO) });
    const cores = ['#b8322b', '#2b2b2e', viva(ctx.c1)];
    for (let k = 0; k < 3; k++) {
      const t = bt0 + (bt1 - bt0) * (k + 0.5) / 3;
      sacoDePancada(ctx, Q, 0.75, t, PISO + 2.45, cores[k]);
      lugar(ctx, Q, 'treino', 1.4, t, '-s', { gesto: 'saco' });
    }
    espelho(ctx, Q, '+s', 1.0, Math.min(rt0 - 0.4, 4.4));
    rackDeHalteres(ctx, Q, W - 0.48, W - 0.06, 1.2, 2.7);
    lugar(ctx, Q, 'treino', W - 0.95, 1.95, '+s', { gesto: 'halter' });
    supino(ctx, Q, W - 1.35, 3.0, Math.min(rt0 - 0.35, 4.6));
    lugar(ctx, Q, 'treino', W - 1.35, 3.55, '-t', { gesto: 'halter' });
    for (const s of [p1 + 0.9, p1 + 1.85]) if (s + 0.4 < W - 0.55) esteira(ctx, Q, s, 0.35, 2.1);
    bebedouro(ctx, Q, Math.max(0.3, p0 - 0.35), 0.25);
    ventilador(ctx, Q, W - 0.4, D - 0.4);
    lugar(ctx, Q, 'treino', rs1 + 0.35 < W - 0.3 ? rs1 + 0.3 : rs0 - 0.4, rtm, rs1 + 0.35 < W - 0.3 ? '-s' : '+s', { gesto: 'conversa' });
    return;
  }
  /* NO NÍVEL 4 (o fundo do pátio: a porta no meio, `t` pro fundo): do lado
     de cá, os dois sacos na viga do fundo e o supino na frente; no meio, o
     espelho e o rack de halteres na parede do fundo; do lado de lá, o
     tatame com a dupla na luta; o bebedouro do lado da porta */
  const sT0 = 0.45, sT1 = Math.min(p0 - 0.25, 2.8), tT = D - 0.55;
  /* (a ÁREA DE TREINO do save, no 4, também cresce aqui: o terceiro saco no
     nível 3 da obra, a barra fixa no canto de lá no 2 — o pátio do 4 só
     tem lugar pra trave dela) */
  const nT = ctx.anexos.treino || 0;
  if (sT1 - sT0 > 1.4) {
    trave(ctx, Q, sT0, sT1, tT, 2.35, ACO_ESCURO);
    const sacosA = nT >= 3 && sT1 - sT0 > 2.0 ? [[0.2, '#b8322b'], [0.5, '#2b2b2e'], [0.8, viva(ctx.c1)]] : [[0.3, '#b8322b'], [0.74, '#2b2b2e']];
    for (const [s, c] of sacosA.map(([f, c]) => [sT0 + (sT1 - sT0) * f, c])) {
      sacoDePancada(ctx, Q, s, tT, PISO + 2.35, c);
      lugar(ctx, Q, 'treino', s, tT - 0.62, '+t', { gesto: 'saco' });
    }
  }
  if (p0 > 2.2) {
    supino(ctx, Q, (sT0 + sT1) / 2, 0.35, Math.min(1.65, tT - 1.15));
    lugar(ctx, Q, 'treino', Math.min(p0 - 0.4, (sT0 + sT1) / 2 + 1.0), 1.05, '-s', { gesto: 'halter' });
  }
  espelho(ctx, Q, '+t', p0 - 0.2, p1 + 0.2, 1.8);
  rackDeHalteres(ctx, Q, p0, p1, D - 0.45, D - 0.06);
  lugar(ctx, Q, 'treino', (p0 + p1) / 2, D - 1.0, '+t', { gesto: 'halter' });
  const ts0 = p1 + 0.35, ts1 = W - 0.75;
  if (ts1 - ts0 > 1.4) {
    tatame(ctx, Q, ts0, ts1, 0.4, D - 0.3, '#2d5fa8', '#1f7a3a');
    const tm = (0.4 + D - 0.3) / 2;
    lugarPara(ctx, Q, 'treino', ts0 + 0.45, tm, ts1 - 0.45, tm, { gesto: 'guarda' });
    lugarPara(ctx, Q, 'treino', ts1 - 0.45, tm, ts0 + 0.45, tm, { gesto: 'guarda' });
  }
  bebedouro(ctx, Q, Math.max(0.3, p0 - 0.35), 0.25);
  ventilador(ctx, Q, W - 0.35, D - 0.4);
  if (nT >= 2 && ts1 + 0.25 < W - 0.3 && D > 2.2) {
    barraFixa(ctx, Q, W - 0.45, W - 0.35, 0.45, D - 1.0);
    lugar(ctx, Q, 'treino', W - 0.4, (D - 0.55) / 2, '+t', { gesto: 'guarda' });
  }
}
/* A VARANDA do 1º andar: os vasos nas pontas e, na passarela por cima do
   portão, quem fica apoiado no guarda-corpo olhando o pátio */
function varandaNova(ctx, Q) {
  const { W, D } = Q;
  if (W > D) {
    /* a passarela: `s` ao longo dela, `t` da fachada pro pátio */
    for (const s of [W * 0.3, W * 0.5, W * 0.7]) lugar(ctx, Q, 'roda', s, D - 0.45, '+t', { gesto: s === W * 0.5 ? 'celular' : 'conversa' });
    return;
  }
  /* os lados: o vaso na ponta do fundo — só no de lá (no de cá, a ponta
     do fundo é onde a escada chega) */
  if (Math.abs(Q.c.x0 - ctx.u(ctx.P.pat.u0)) > 0.05) plantaNoVaso(ctx, Q, W / 2, D - 0.4);
}

/* O PÁTIO DO NÍVEL 5 (descoberto no meio, a varanda por cima das beiras,
   a escada no fundo): a faixa no muro do fundo, por cima da escada; a
   bateria na frente da escada; a churrasqueira e o tanque no fundo, do
   lado de onde se sobe; a mesa comprida no meio, o pebolim, a mesa
   amarela, a roda, o banco no muro da garagem, os vasos e a pilha de
   cadeira debaixo da varanda */
function patio5(ctx, Q) {
  const { W, D } = Q, P = ctx.P, u = ctx.u, VAR = 1.4, e = P.escada;
  const eS0 = u(e.u0 - P.pat.u0), eS1 = u(e.u1 - P.pat.u0), eT0 = D - u(e.v1 - e.v0);
  /* a faixa no muro da garagem, debaixo da varanda de cá (é o muro sem porta) */
  ctx.faixa('-s', Math.min(D - 2.8, 7.0), PISO + 1.45, Math.min(3.8, D - 5.0), 0.8, Q);
  bateriaDePe(ctx, Q, Math.max(VAR + 0.9, (eS0 + eS1) / 2 - 1.6), eT0 - 1.2, '-t', 0.62);
  /* (a churrasqueira e o tanque depois do pé da escada, com 1,1 m de chão
     livre entre eles: é por ali que se chega ao primeiro degrau) */
  const ch = eS1 + 1.1;
  churrasqueira(ctx, Q, ch, ch + 1.3, D - 0.7, D - 0.05, '-t');
  lugar(ctx, Q, 'churrasco', ch + 0.65, D - 1.08, '+t', { gesto: 'churrasco' });
  if (ch + 2.1 < W - VAR - 0.2) tanque(ctx, Q, ch + 1.45, ch + 2.1, D - 0.58, D - 0.05);
  /* o banco no muro da garagem, debaixo da varanda */
  banco(ctx, Q, 0.05, 0.5, 2.6, 4.6);
  for (let t = 3.0; t <= 4.3; t += 0.7) lugar(ctx, Q, 'banco', 0.3, t, '+s', { sentado: true, assento: ASSENTO.banco, gesto: t < 3.5 ? 'celular' : 'conversa' });
  /* a mesa comprida no meio */
  const ml = Math.min(3.4, W - 2 * VAR - 4.0), ms = W / 2 - ml / 2, mt = D / 2 + 0.4;
  mesa(ctx, Q, ms, ms + ml, mt - 0.4, mt + 0.4, 0.74, PLASTICO, '#c9cbcc');
  for (let s = ms + 0.35; s <= ms + ml - 0.3; s += 0.62) {
    cadeira(ctx, Q, s, mt - 0.78, '-t', PLASTICO); cadeira(ctx, Q, s, mt + 0.78, '+t', PLASTICO);
    lugar(ctx, Q, 'mesa', s, mt - 0.78, '+t', { sentado: true, assento: ASSENTO.cadeira, gesto: 'conversa' });
    lugar(ctx, Q, 'mesa', s, mt + 0.78, '-t', { sentado: true, assento: ASSENTO.cadeira, gesto: 'bebe' });
  }
  /* o pebolim e a mesa amarela do lado de lá, a roda do lado de cá */
  const pbS = W - VAR - 2.1, pbT = 3.1;
  pebolim(ctx, Q, pbS, pbT, ctx.c1, ctx.c2);
  lugar(ctx, Q, 'pebolim', pbS + 0.6, pbT - 0.42, '+t', { gesto: 'pebolim' });
  lugar(ctx, Q, 'pebolim', pbS + 0.6, pbT + 0.72 + 0.42, '-t', { gesto: 'pebolim' });
  mesaDePlastico(ctx, Q, W - VAR - 1.6, D / 2 + 1.9, ['-t', '-s', '+t'], '#e3b23c');
  roda(ctx, Q, VAR + 2.3, D / 2 - 0.6);
  for (const s of [0.4, W - 0.4]) plantaNoVaso(ctx, Q, s, 0.45);
  pilhaCadeiras(ctx, Q, W - 0.6, D - 0.45, 6, PLASTICO, '+t');
  /* a ÁREA DE TREINO do save: na frente, do lado de cá do portão, entre os pilares e a roda */
  if (ctx.anexos.treino) areaDeTreino(ctx, Q, ctx.anexos.treino, VAR + 0.4, Math.min(W / 2 - 1.4, VAR + 3.4), 2.1, Math.min(D / 2 - 1.4, 4.5), '-t', false);
}

/* =======================================================
   OS ANEXOS DA SEDE (o item 6 da varredura, 02/10/2026: "os anexos da
   sede (enfermaria, cofre, área de treino) não aparecem"). O que o save
   diz que a torcida comprou (`sede.anexos`: { enfermaria, galpao, cofre,
   treino }) entra na mobília do cômodo dele:
     ENFERMARIA   (sede 4: "ferido volta em 3 a 9 dias") na hospedagem,
                  no lugar do último beliche: a maca de hospital com a
                  cabeceira levantada e a grade, o suporte de soro, o
                  biombo, o armarinho de primeiros socorros com a cruz
                  vermelha e a placa ENFERMARIA
     GALPÃO DE    (sede 3: "bomba 15% mais barata e o saque no nosso bar
     MATERIAL     leva 30% menos") no patrimônio, no lugar da estante: a
                  gaiola de tela com cadeado, cheia — as caixas de rojão
                  com a faixa de perigo, os sinalizadores, as faixas
                  enroladas e os mastros — e a placa MATERIAL
     COFRE        (sede 5: "metade do prejuízo de qualquer saque fica
     BLINDADO     guardada") na presidência: o cofre de aço de 1,5 m com
                  o volante, o segredo e as dobradiças, no canto do fundo
                  (no lugar do cofrinho, quando tinha)
     ÁREA DE      (os três níveis da obra: +25, 50 e 75% de gente
     TREINO       treinando) num canto livre do pátio de cada nível: o piso
                  de borracha com a borda na cor 1 e a placa ÁREA DE
                  TREINO, e a cada nível mais aparelho — a trave com dois
                  sacos (1), o rack de halteres e a barra fixa (2), o
                  supino e o pneu de virar (3) —, com os lugares de treino
   ======================================================= */
/* A MACA de hospital (a cabeça do lado `cabeca`): os pés de aço, o
   estrado, o colchão com a cabeceira levantada (em degraus), o lençol, o
   travesseiro e a grade do lado */
function maca(ctx, Q, s0, s1, t0, t1, cabeca) {
  const aoS = cabeca === '-s' || cabeca === '+s';
  const L = aoS ? s1 - s0 : t1 - t0, Lb = aoS ? t1 - t0 : s1 - s0;
  /* (a ao longo da maca, da cabeça; b atravessado) */
  const cx = (a0, a1, b0, b1, y0, y1, spec) => {
    const [A0, A1] = aoS ? (cabeca === '-s' ? [s0 + a0, s0 + a1] : [s1 - a1, s1 - a0]) : (cabeca === '-t' ? [t0 + a0, t0 + a1] : [t1 - a1, t1 - a0]);
    if (aoS) qcaixa(ctx, Q, A0, A1, t0 + b0, t0 + b1, y0, y1, spec); else qcaixa(ctx, Q, s0 + b0, s0 + b1, A0, A1, y0, y1, spec);
  };
  const aco = { todas: lisa('#b9bfc4'), base: null }, h = 0.6, branco = { todas: lisa('#f4f4f1') }, cab = Math.min(0.75, L * 0.38);
  for (const a of [0.05, L - 0.1]) for (const b of [0.05, Lb - 0.1]) cx(a, a + 0.05, b, b + 0.05, PISO, PISO + h, aco);
  cx(0, L, 0, Lb, PISO + h - 0.05, PISO + h, { todas: lisa('#8f979d') });
  cx(cab, L - 0.03, 0.04, Lb - 0.04, PISO + h, PISO + h + 0.12, branco);
  for (let i = 0; i < 4; i++) { const a = cab * i / 4; cx(a + 0.02, a + cab / 4 + 0.02, 0.04, Lb - 0.04, PISO + h, PISO + h + 0.12 + (4 - i) * 0.1, branco); }
  cx(L - 0.5, L - 0.05, 0.03, Lb - 0.03, PISO + h + 0.12, PISO + h + 0.16, { todas: lisa('#8fc1a9') });
  cx(0.06, 0.32, 0.12, Lb - 0.12, PISO + h + 0.52, PISO + h + 0.6, branco);
  for (const b of [0, Lb - 0.025]) cx(L * 0.3, L * 0.68, b, b + 0.025, PISO + h + 0.12, PISO + h + 0.38, aco);
  ctx.marca(...Q.ret(s0, s1, t0, t1), '#dfe3e6');
}
/* o suporte de soro: o pé de cinco pontas, a haste e a bolsa com o tubo */
function suporteDeSoro(ctx, Q, s, t) {
  const aco = { todas: lisa('#b9bfc4'), base: null };
  qcaixa(ctx, Q, s - 0.25, s + 0.25, t - 0.02, t + 0.02, PISO, PISO + 0.04, aco);
  qcaixa(ctx, Q, s - 0.02, s + 0.02, t - 0.25, t + 0.25, PISO, PISO + 0.04, aco);
  qcaixa(ctx, Q, s - 0.012, s + 0.012, t - 0.012, t + 0.012, PISO, PISO + 1.85, aco);
  qcaixa(ctx, Q, s - 0.14, s + 0.14, t - 0.01, t + 0.01, PISO + 1.82, PISO + 1.85, aco);
  qcaixa(ctx, Q, s + 0.06, s + 0.16, t - 0.025, t + 0.025, PISO + 1.55, PISO + 1.8, { todas: lisa('#e7eef0') });
  qcaixa(ctx, Q, s + 0.105, s + 0.115, t - 0.005, t + 0.005, PISO + 0.95, PISO + 1.55, { todas: lisa('#d6e3e7') });
}
/* o biombo de três folhas (o pano verde-claro no quadro de aço), em pé ao longo de s ou de t */
function biombo(ctx, Q, s0, s1, t0, t1) {
  const aoS = s1 - s0 >= t1 - t0, L = aoS ? s1 - s0 : t1 - t0, f = L / 3, aco = { todas: lisa('#9aa2a8'), base: null }, pano = { todas: lisa('#bfdccb') };
  for (let i = 0; i < 3; i++) {
    const a0 = (aoS ? s0 : t0) + i * f + 0.01, a1 = a0 + f - 0.02, d = (i % 2) * 0.06;
    const [S0, S1, T0, T1] = aoS ? [a0, a1, t0 + d, t0 + d + 0.03] : [s0 + d, s0 + d + 0.03, a0, a1];
    qcaixa(ctx, Q, S0, S1, T0, T1, PISO + 0.18, PISO + 1.72, pano);
    for (const a of [a0, a1 - 0.025]) qcaixa(ctx, Q, aoS ? a : S0, aoS ? a + 0.025 : S1, aoS ? T0 : a, aoS ? T1 : a + 0.025, PISO, PISO + 1.78, aco);
  }
  ctx.marca(...Q.ret(s0, s1, t0, t1), '#bfdccb');
}
/* A ENFERMARIA no lugar de um beliche (`cama`: a parede e onde começa):
   a maca encostada na mesma parede, a cabeça pro lado que tem folga (lá
   vai o soro), o biombo atravessado no pé (separa do dormitório), o
   armarinho da cruz e a placa na parede de cima, e quem visita do lado */
function enfermaria(ctx, Q, cama) {
  const { W, D } = Q, ao = cama.lado === '+t';
  /* a maca: ao longo da parede, 1,9 m × 0,9 */
  const [s0, s1, t0, t1] = ao ? [cama.a + 0.05, cama.a + 1.95, D - 0.98, D - 0.08]
                         : cama.lado === '+s' ? [W - 0.98, W - 0.08, cama.a + 0.05, cama.a + 1.95] : [0.08, 0.98, cama.a + 0.05, cama.a + 1.95];
  /* a cabeça pro fim da fileira (o último beliche: depois dele não tem
     outro, e o soro cabe lá); o pé fica do lado do beliche vizinho */
  const cab = ao ? '+s' : '+t', folga = ao ? W - s1 : D - t1;
  maca(ctx, Q, s0, s1, t0, t1, cab);
  /* o soro: depois da cabeça, se cabe; senão do lado de fora da maca, na cabeça */
  let ss, st;
  if (folga >= 0.55) [ss, st] = ao ? [cab === '+s' ? s1 + 0.28 : s0 - 0.28, t0 + 0.35] : [cama.lado === '+s' ? s0 + 0.35 : s1 - 0.35, cab === '+t' ? t1 + 0.28 : t0 - 0.28];
  else [ss, st] = ao ? [cab === '+s' ? s1 - 0.25 : s0 + 0.25, t0 - 0.3] : [cama.lado === '+s' ? s0 - 0.3 : s1 + 0.3, cab === '+t' ? t1 - 0.25 : t0 + 0.25];
  suporteDeSoro(ctx, Q, ss, st);
  /* o biombo atravessado no pé, da parede até meio metro além da maca */
  if (ao) { const pe = cab === '+s' ? s0 : s1, x = cab === '+s' ? pe - 0.12 : pe + 0.03; biombo(ctx, Q, x, x + 0.09, t0 - 0.55, D - 0.06); }
  else { const pe = cab === '+t' ? t0 : t1, z = cab === '+t' ? pe - 0.12 : pe + 0.03; biombo(ctx, Q, cama.lado === '+s' ? s0 - 0.55 : 0.06, cama.lado === '+s' ? W - 0.06 : s1 + 0.55, z, z + 0.09); }
  /* o armarinho de primeiros socorros na parede, por cima da maca, e a placa */
  const parede = cama.lado, aPar = ao ? (s0 + s1) / 2 : (t0 + t1) / 2, yA = PISO + 1.45;
  naParede(ctx, Q, parede, aPar - 0.3, aPar + 0.3, yA, yA + 0.5, 0.2, { todas: lisa('#f3f2ee') }, '#f3f2ee');
  naParede(ctx, Q, parede, aPar - 0.04, aPar + 0.04, yA + 0.1, yA + 0.4, 0.21, { todas: lisa('#c8342b') });
  naParede(ctx, Q, parede, aPar - 0.15, aPar + 0.15, yA + 0.21, yA + 0.29, 0.21, { todas: lisa('#c8342b') });
  const olha = { '+t': '-t', '+s': '-s', '-s': '+s' }[parede];
  const [px, pz] = parede === '+t' ? Q.pt(aPar, D - 0.02) : parede === '+s' ? Q.pt(W - 0.02, aPar) : Q.pt(0.02, aPar);
  ctx.placa(Q, [px, pz], olha, PISO + 2.2, 1.1, 0.16, 'ENFERMARIA');
  /* quem visita o ferido, de pé do lado aberto da maca, perto do pé */
  const mS = (s0 + s1) / 2, mT = (t0 + t1) / 2;
  if (ao) lugarPara(ctx, Q, 'enfermaria', cab === '+s' ? s0 + 0.55 : s1 - 0.55, t0 - 0.32, mS, mT, { gesto: 'conversa' });
  else lugarPara(ctx, Q, 'enfermaria', cama.lado === '+s' ? s0 - 0.35 : s1 + 0.35, cab === '+t' ? t0 + 0.55 : t1 - 0.55, mS, mT, { gesto: 'conversa' });
}
/* A GAIOLA DE MATERIAL (o galpão de material, no patrimônio): o quadro de
   cantoneira, a tela nas três faces de fora e na porta, o cadeado, e
   dentro as caixas de rojão (o papelão com a faixa amarela e preta), os
   sinalizadores (o tubo vermelho), as faixas enroladas e os mastros de
   bambu. `frente`: o lado da porta da gaiola */
function gaiolaDeMaterial(ctx, Q, s0, s1, t0, t1, frente) {
  const h = 2.15, aco = { todas: lisa(ACO_ESCURO), base: null };
  for (const [s, t] of [[s0, t0], [s1 - 0.04, t0], [s1 - 0.04, t1 - 0.04], [s0, t1 - 0.04]]) qcaixa(ctx, Q, s, s + 0.04, t, t + 0.04, PISO, PISO + h, aco);
  qcaixa(ctx, Q, s0, s1, t0, t1, PISO + h - 0.04, PISO + h, { todas: lisa(ACO_ESCURO), base: null, topo: null });
  /* a tela nas faces que não são parede: a da frente (com a porta), e as duas pontas */
  const tela = (lado, a0, a1) => {
    const [pA, pB] = lado === '-s' ? [Q.pt(s0, a0), Q.pt(s0, a1)] : lado === '+s' ? [Q.pt(s1, a0), Q.pt(s1, a1)] : lado === '-t' ? [Q.pt(a0, t0), Q.pt(a1, t0)] : [Q.pt(a0, t1), Q.pt(a1, t1)];
    const L = Math.hypot(pB[0] - pA[0], pB[1] - pA[1]);
    if (L < 0.05) return;
    const F = ctx.G.plano([pA[0], 0, pA[1]], [(pB[0] - pA[0]) / L, 0, (pB[1] - pA[1]) / L], [0, 1, 0]);
    ctx.G.ladrilhar(F, [[0, PISO + 0.05], [L, PISO + 0.05], [L, PISO + h - 0.05], [0, PISO + h - 0.05]], 'rede', { tw: 1.0, th: 1.0, tinta: '#a9b0b5' });
  };
  const aoS = frente === '-s' || frente === '+s';
  if (aoS) { tela(frente, t0, t1); tela('-t', s0, s1); tela('+t', s0, s1); } else { tela(frente, s0, s1); tela('-s', t0, t1); tela('+s', t0, t1); }
  /* a porta de tela (o quadro) com o cadeado, no meio da frente */
  const pm = aoS ? (t0 + t1) / 2 : (s0 + s1) / 2, fs = frente === '-s' ? s0 - 0.03 : frente === '+s' ? s1 + 0.005 : null, ft = frente === '-t' ? t0 - 0.03 : frente === '+t' ? t1 + 0.005 : null;
  const quadroP = (a0, a1, y0, y1) => aoS ? qcaixa(ctx, Q, fs, fs + 0.025, a0, a1, y0, y1, aco) : qcaixa(ctx, Q, a0, a1, ft, ft + 0.025, y0, y1, aco);
  quadroP(pm - 0.4, pm + 0.4, PISO + 0.06, PISO + 0.1); quadroP(pm - 0.4, pm + 0.4, PISO + 1.95, PISO + 1.99);
  quadroP(pm - 0.4, pm - 0.37, PISO + 0.06, PISO + 1.99); quadroP(pm + 0.37, pm + 0.4, PISO + 0.06, PISO + 1.99);
  const yc = PISO + 1.0;
  if (aoS) qcaixa(ctx, Q, fs - (frente === '-s' ? 0.03 : -0.03), fs + 0.025 + (frente === '-s' ? 0 : 0.03), pm + 0.3, pm + 0.37, yc - 0.06, yc, { todas: lisa('#c49a2c') });
  else qcaixa(ctx, Q, pm + 0.3, pm + 0.37, ft - (frente === '-t' ? 0.03 : -0.03), ft + 0.025 + (frente === '-t' ? 0 : 0.03), yc - 0.06, yc, { todas: lisa('#c49a2c') });
  /* dentro: as caixas de rojão em pilhas (o papelão, a faixa de perigo), os sinalizadores, as faixas enroladas */
  const papelao = { todas: lisa(PAPELAO) }, perigo = { todas: lisa('#e3b23c') };
  const L = aoS ? t1 - t0 : s1 - s0, P = aoS ? s1 - s0 : t1 - t0;
  /* (a ao longo da gaiola; d da parede pra frente da gaiola) */
  const cxG = (a0, a1, d0, d1, y0, y1, spec) => {
    if (aoS) { const [S0, S1] = frente === '-s' ? [s1 - d1, s1 - d0] : [s0 + d0, s0 + d1]; qcaixa(ctx, Q, S0, S1, t0 + a0, t0 + a1, y0, y1, spec); }
    else { const [T0, T1] = frente === '-t' ? [t1 - d1, t1 - d0] : [t0 + d0, t0 + d1]; qcaixa(ctx, Q, s0 + a0, s0 + a1, T0, T1, y0, y1, spec); }
  };
  let k = 0;
  for (let a = 0.1; a + 0.4 <= L * 0.62; a += 0.45) {
    const n = 3 + (k % 2);   // (até 1,2 m: a prateleira fica em cima)
    for (let i = 0; i < n; i++) {
      const y = PISO + i * 0.3;
      cxG(a, a + 0.4, 0.06, Math.min(P - 0.12, 0.5), y, y + 0.28, papelao);
      cxG(a, a + 0.4, Math.min(P - 0.12, 0.5), Math.min(P - 0.12, 0.5) + 0.004, y + 0.09, y + 0.15, perigo);
    }
    k++;
  }
  /* os sinalizadores em pé, num engradado */
  const sa = L * 0.66;
  if (sa + 0.5 < L - 0.1) {
    cxG(sa, sa + 0.5, 0.08, 0.42, PISO, PISO + 0.22, { todas: lisa('#2b4a8a') });
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) cxG(sa + 0.06 + i * 0.11, sa + 0.1 + i * 0.11, 0.14 + j * 0.13, 0.18 + j * 0.13, PISO + 0.22, PISO + 0.5, { todas: lisa('#c8342b') });
  }
  /* a prateleira de cima, de lado a lado, com as faixas e as bandeiras enroladas nas cores da torcida */
  const yP = PISO + 1.55, dP = Math.min(P - 0.1, 0.55);
  cxG(0.06, L - 0.2, 0.04, dP, yP - 0.03, yP, { todas: lisa(ACO_ESCURO) });
  for (let a = 0.12, i = 0; a + 0.22 < L - 0.24; a += 0.26, i++) cxG(a, a + 0.22, 0.08, dP - 0.04, yP, yP + 0.2, { todas: lisa(viva([ctx.c1, ctx.c2, ctx.c3][i % 3])) });
  /* os mastros de bambu encostados no canto */
  for (let i = 0; i < 4; i++) cxG(L - 0.12 - i * 0.04, L - 0.09 - i * 0.04, 0.06 + i * 0.03, 0.09 + i * 0.03, PISO, PISO + 2.05 - i * 0.08, { todas: lisa('#caa77a'), base: null });
  ctx.marca(...Q.ret(s0, s1, t0, t1), ACO_ESCURO);
  /* a placa MATERIAL em cima da porta */
  const [px, pz] = aoS ? Q.pt(frente === '-s' ? s0 - 0.04 : s1 + 0.04, pm) : Q.pt(pm, frente === '-t' ? t0 - 0.04 : t1 + 0.04);
  ctx.placa(Q, [px, pz], frente, PISO + h - 0.13, 0.9, 0.15, 'MATERIAL');
}
/* O COFRE BLINDADO: o corpo de aço grosso de 1,5 m, a porta com as
   dobradiças, o volante de quatro raios, o segredo e a placa do fabricante
   (a porta virada pra `frente`) */
function cofreBlindado(ctx, Q, s0, s1, t0, t1, frente) {
  const h = 1.5, corpo = { todas: lisa('#3b4146') };
  qcaixa(ctx, Q, s0, s1, t0, t1, PISO, PISO + h, corpo);
  ctx.marca(...Q.ret(s0, s1, t0, t1), '#3b4146');
  const aoS = frente === '-s' || frente === '+s', A0 = aoS ? t0 : s0, A1 = aoS ? t1 : s1;
  /* (a ao longo da frente, y; `sai` pra fora da frente) */
  const fr = (a0, a1, y0, y1, sai0, sai1, tinta) => {
    if (frente === '-t') qcaixa(ctx, Q, a0, a1, t0 - sai1, t0 - sai0, y0, y1, { todas: lisa(tinta) });
    else if (frente === '+t') qcaixa(ctx, Q, a0, a1, t1 + sai0, t1 + sai1, y0, y1, { todas: lisa(tinta) });
    else if (frente === '-s') qcaixa(ctx, Q, s0 - sai1, s0 - sai0, a0, a1, y0, y1, { todas: lisa(tinta) });
    else qcaixa(ctx, Q, s1 + sai0, s1 + sai1, a0, a1, y0, y1, { todas: lisa(tinta) });
  };
  /* a porta (um dedo pra fora), as três dobradiças, o volante e o segredo */
  fr(A0 + 0.06, A1 - 0.06, PISO + 0.1, PISO + h - 0.08, 0, 0.025, '#4a5157');
  for (const y of [0.3, 0.75, 1.2]) fr(A0 + 0.02, A0 + 0.07, PISO + y, PISO + y + 0.12, 0, 0.05, '#2a2e31');
  const am = (A0 + A1) / 2 + 0.08, ym = PISO + 0.82;
  fr(am - 0.2, am + 0.2, ym - 0.02, ym + 0.02, 0.025, 0.05, '#c9c6bd');
  fr(am - 0.02, am + 0.02, ym - 0.2, ym + 0.2, 0.025, 0.05, '#c9c6bd');
  fr(am - 0.05, am + 0.05, ym - 0.05, ym + 0.05, 0.025, 0.07, '#9aa0a4');
  fr(am - 0.06, am + 0.06, ym + 0.3, ym + 0.42, 0.025, 0.045, '#d4a93a');
  fr(am - 0.16, am + 0.16, PISO + h - 0.28, PISO + h - 0.2, 0.025, 0.03, '#d4a93a');
}
/* O PISO DE BORRACHA da área de treino: o preto com a borda na cor 1 */
function pisoDeBorracha(ctx, Q, s0, s1, t0, t1) {
  qcaixa(ctx, Q, s0, s1, t0, t1, PISO, PISO + 0.025, { todas: lisa('#26282b'), base: null }, '#26282b');
  const b = 0.08, borda = { todas: lisa(viva(ctx.c1)), base: null };
  qcaixa(ctx, Q, s0, s1, t0, t0 + b, PISO + 0.025, PISO + 0.03, borda); qcaixa(ctx, Q, s0, s1, t1 - b, t1, PISO + 0.025, PISO + 0.03, borda);
  qcaixa(ctx, Q, s0, s0 + b, t0, t1, PISO + 0.025, PISO + 0.03, borda); qcaixa(ctx, Q, s1 - b, s1, t0, t1, PISO + 0.025, PISO + 0.03, borda);
}
/* a barra fixa: os dois montantes e o tubo, ao longo de s (ou de t) */
function barraFixa(ctx, Q, s0, s1, t0, t1) {
  const aoS = s1 - s0 >= t1 - t0, aco = { todas: lisa(ACO_ESCURO), base: null }, h = 2.3;
  const [p0, p1] = aoS ? [[s0, (t0 + t1) / 2], [s1 - 0.06, (t0 + t1) / 2]] : [[(s0 + s1) / 2, t0], [(s0 + s1) / 2, t1 - 0.06]];
  for (const [s, t] of [p0, p1]) qcaixa(ctx, Q, s, s + 0.06, t - 0.03, t + 0.03, PISO, PISO + h, aco);
  if (aoS) qcaixa(ctx, Q, s0, s1, (t0 + t1) / 2 - 0.02, (t0 + t1) / 2 + 0.02, PISO + h - 0.08, PISO + h - 0.04, { todas: lisa('#c9c6bd') });
  else qcaixa(ctx, Q, (s0 + s1) / 2 - 0.02, (s0 + s1) / 2 + 0.02, t0, t1, PISO + h - 0.08, PISO + h - 0.04, { todas: lisa('#c9c6bd') });
}
/* o pneu grande de trator (o de virar), deitado */
function pneuGrande(ctx, Q, s, t) {
  qcaixa(ctx, Q, s - 0.55, s + 0.55, t - 0.55, t + 0.55, PISO, PISO + 0.3, { todas: lisa('#1b1c1e') }, '#1b1c1e');
  qcaixa(ctx, Q, s - 0.25, s + 0.25, t - 0.25, t + 0.25, PISO + 0.3, PISO + 0.302, { todas: lisa('#3a3c40') });
}
/* A ÁREA DE TREINO num retângulo livre do cômodo (`n`, o nível da obra,
   1 a 3): o piso de borracha, a placa e os aparelhos em vagas ao longo do
   lado maior, com os lugares de quem treina —
     vaga 1 (nível 1)  a trave de aço com dois sacos, perto do lado `parede`
     vaga 2 (nível 2)  o rack de halteres, e a barra fixa do outro lado
     vaga 3 (nível 3)  o supino e o pneu de virar
   O que não cabe (o pátio pequeno) vira o pequeno: os halteres soltos e o
   colchonete (2), o pneu velho e o kettlebell (3), cada um num pedaço
   livre (o resto do lado maior, o fundo da vaga 1).
   `naParede`: o lado `parede` encosta numa parede (a placa vai nela;
   senão, pendurada em cima da viga da trave) */
function areaDeTreino(ctx, Q, n, s0, s1, t0, t1, parede, naParede) {
  if (!n || s1 - s0 < 1.6 || t1 - t0 < 1.6) return;
  pisoDeBorracha(ctx, Q, s0, s1, t0, t1);
  const aoS = s1 - s0 >= t1 - t0, L = aoS ? s1 - s0 : t1 - t0, P = aoS ? t1 - t0 : s1 - s0;
  /* (a ao longo do lado maior; d atravessado, a partir do lado `parede`) */
  const ST = (a, d) => aoS ? [s0 + a, parede === '+t' ? t1 - d : t0 + d] : [parede === '+s' ? s1 - d : s0 + d, t0 + a];
  const rt = (a0, a1, d0, d1) => { const [p, q] = ST(a0, d0), [r, w] = ST(a1, d1); return [Math.min(p, r), Math.max(p, r), Math.min(q, w), Math.max(q, w)]; };
  const fora = { '-t': '+t', '+t': '-t', '-s': '+s', '+s': '-s' }[parede];
  const treina = (a, d, aa, da, gesto) => { const [ls, lt] = ST(a, d), [ps, pt] = ST(aa, da); lugarPara(ctx, Q, 'treino', ls, lt, ps, pt, { gesto }); };
  /* VAGA 1: a trave de aço com dois sacos */
  const tL = Math.min(2.2, Math.max(1.0, L * 0.45)), a1 = 0.1 + tL;
  for (const a of [0.15, a1 - 0.05]) qcaixa(ctx, Q, ...rt(a - 0.05, a + 0.05, 0.325, 0.425), PISO, PISO + 2.35, { todas: lisa(ACO_ESCURO), base: null }, ACO_ESCURO);
  qcaixa(ctx, Q, ...rt(0.08, a1 + 0.02, 0.325, 0.425), PISO + 2.35, PISO + 2.45, { todas: lisa(ACO_ESCURO) });
  [0.1 + tL * 0.32, 0.1 + tL * 0.72].forEach((a, k) => {
    const [ss, st] = ST(a, 0.375);
    sacoDePancada(ctx, Q, ss, st, PISO + 2.35, k ? '#2b2b2e' : '#b8322b');
    treina(a, 0.95, a, 0.375, 'saco');
  });
  {
    const [ps, pt] = naParede ? ST(Math.min(L / 2, 1.2), 0.02) : ST(0.1 + tL / 2, 0.44), [px, pz] = Q.pt(ps, pt);
    ctx.placa(Q, [px, pz], fora, naParede ? PISO + 2.35 : PISO + 2.62, Math.min(1.3, tL), 0.17, 'ÁREA DE TREINO');
  }
  /* VAGA 2: o rack de halteres e a barra fixa; VAGA 3: o supino e o pneu de virar */
  const a2 = a1 + 0.1, cabe2 = L - a2 >= 1.1;
  const a3 = cabe2 ? Math.min(L - 0.1, a2 + 1.1) + 0.15 : a2, cabe3 = aoS ? L - a3 >= 1.0 && P >= 1.75 : L - a3 >= 1.5;
  /* O PEQUENO, o que não coube na vaga dele, vai pros pedaços que sobram,
     um pra cada vaga: o resto do lado maior (quando a vaga 2 não coube e a
     3 não fica lá) e o fundo da vaga 1, do outro lado de quem bate no saco
     — os dois juntos no mesmo pedaço ficavam um em cima do outro */
  const sobras = [];
  if (!cabe2 && !(n >= 3 && cabe3) && L - a2 >= 0.75) sobras.push({ a0: a2, a1: L - 0.08, d0: 0.1, d1: P - 0.08 });
  if (P - 1.35 >= 0.6) sobras.push({ a0: 0.15, a1: a1 - 0.05, d0: 1.35, d1: P - 0.08 });
  /* (no pedaço `p`, ao longo do lado maior dele: x ao longo, y atravessado) */
  const pequeno = (p, k) => {
    const ao = p.a1 - p.a0 >= p.d1 - p.d0, X = ao ? p.a1 - p.a0 : p.d1 - p.d0, Y = ao ? p.d1 - p.d0 : p.a1 - p.a0;
    const em = (x, y) => ao ? ST(p.a0 + x, p.d0 + y) : ST(p.a0 + y, p.d0 + x);
    const ret = (x0, x1, y0, y1) => ao ? rt(p.a0 + x0, p.a0 + x1, p.d0 + y0, p.d0 + y1) : rt(p.a0 + y0, p.a0 + y1, p.d0 + x0, p.d0 + x1);
    if (k === 2) {
      /* os halteres soltos e o colchonete */
      halteres(ctx, Q, ...em(0.2, Y / 2));
      const c = Math.min(0.3, Y / 2 - 0.04);
      if (X >= 1.05) colchonete(ctx, Q, ...ret(0.7, Math.min(X - 0.05, 1.6), Y / 2 - c, Y / 2 + c), '#2d5fa8');
    } else {
      /* o pneu velho e o kettlebell */
      pneu(ctx, Q, ...em(Math.max(0.36, X - 0.4), Y / 2));
      if (X >= 1.3) { const [ks, kt] = em(X - 1.0, Y / 2); qcaixa(ctx, Q, ks - 0.1, ks + 0.1, kt - 0.1, kt + 0.1, PISO, PISO + 0.24, { todas: lisa('#1f2124') }, '#1f2124'); }
    }
  };
  if (n >= 2) {
    if (cabe2) {
      const b = Math.min(L - 0.1, a2 + 1.1);
      rackDeHalteres(ctx, Q, ...rt(a2, b, 0.05, 0.47));
      treina((a2 + b) / 2, 1.0, (a2 + b) / 2, 0.3, 'halter');
      if (P >= 2.2) { barraFixa(ctx, Q, ...rt(a2 + 0.05, b - 0.05, P - 0.72, P - 0.62)); treina((a2 + b) / 2, P - 1.15, (a2 + b) / 2, P - 0.67, 'guarda'); }
    } else if (sobras.length) pequeno(sobras.shift(), 2);
  }
  /* (o supino corre em t: no lado maior em s ele vai atravessado) */
  if (n >= 3) {
    if (cabe3) {
      if (aoS) { const [ss] = ST(a3 + 0.5, 0), [, tA] = ST(0, P / 2 - 0.75), [, tB] = ST(0, P / 2 + 0.65); supino(ctx, Q, ss, Math.min(tA, tB), Math.max(tA, tB)); }
      else { const [ss] = ST(0, P / 2), [, tA] = ST(a3, 0), [, tB] = ST(a3 + 1.4, 0); supino(ctx, Q, ss, Math.min(tA, tB), Math.max(tA, tB)); }
      if (L - a3 >= 2.4 && P >= 1.3) { const [ps, pt] = ST(a3 + 1.85, P / 2); pneuGrande(ctx, Q, ps, pt); treina(a3 + 1.85, P / 2 + 0.85 > P - 0.1 ? P / 2 - 0.85 : P / 2 + 0.85, a3 + 1.85, P / 2, 'guarda'); }
    } else if (sobras.length) pequeno(sobras.shift(), 3);
  }
}

const MOBILIA_N = { patio: patioNovo, presidencia: presidenciaNova, bar: barDaRua, hospedagem: hospedagemNova, patrimonio: patrimonioNovo,
                    marketing: marketingNovo, criativo: criativoNovo, garagem: garagemNova, academia: academiaNova, varanda: varandaNova };

/* =======================================================
   AS PAREDES: caixa por trecho, o acabamento de cada lado
   ======================================================= */
/* as faixas de acabamento de uma face, do chão ao alto: [y0, y1, peça] */
function faixasDaFace(ctx, reg, w) {
  const { c1, c2, c3 } = ctx, H = 20;
  const externa = () => {
    const b = [[0, 0.12, lisa(c1)], [0.12, 0.5, lisa(c3)], [0.5, 2.28, lisa(c1)], [2.28, 2.42, lisa(c2)], [2.42, H, lisa(c1)]];
    return b;
  };
  /* (no 1º andar do nível 5, a de fora sem o rodapé: um filete na cor 2
     no pé e outro perto do alto) */
  const deCima = () => [[0, 0.05, lisa(c2)], [0.05, 3.2, lisa(c1)], [3.2, 3.28, lisa(c2)], [3.28, H, lisa(c1)]];
  if (reg === 'fora') return ctx.andar ? deCima() : externa();
  if (reg.tipo === 'varanda') return deCima();
  if (reg.tipo === 'patio') return w.fachadaPatio ? externa() : [[0, H, { k: 'bloco', tinta: '#d8d4ca' }]];
  /* nos níveis 2 a 5, o que a parede do cômodo passa do telhado dele (a
     platibanda por dentro, a parede da garagem, que é mais alta) é de fora */
  const P = ctx.P;
  if (P.novo && reg.tipo !== 'garagem') {
    const yT = ctx.u(P.ALT_EXT);
    return faixasDeDentro(ctx, reg).map(([a, b, k]) => [a, Math.min(b, yT), k]).filter(([a, b]) => b > a).concat([[yT, H, lisa(c1)]]);
  }
  return faixasDeDentro(ctx, reg);
}
/* o acabamento de dentro de cada cômodo, do chão ao alto */
function faixasDeDentro(ctx, reg) {
  const { c1 } = ctx, H = 20;
  switch (reg.tipo) {
    case 'bar': return [[0, 1.1, { k: 'piso_bar' }], [1.1, 1.16, lisa(c1)], [1.16, H, lisa(CREME)]];
    case 'presidencia': return [[0, 0.1, lisa(RODAPE)], [0.1, H, lisa(PAREDE_SALA)]];
    case 'marketing': return [[0, 0.1, lisa(RODAPE)], [0.1, 1.0, lisa(PAREDE_SALA)], [1.0, 1.08, lisa(c1)], [1.08, H, lisa(PAREDE_SALA)]];
    case 'hospedagem': return [[0, 0.1, lisa(RODAPE)], [0.1, H, lisa('#e3dcc8')]];
    /* a academia: o rodapé preto alto (de borracha) e a faixa na cor 1 */
    case 'academia': return [[0, 0.3, lisa('#2d2f33')], [0.3, 1.2, lisa('#e6e3dc')], [1.2, 1.35, lisa(c1)], [1.35, H, lisa('#e6e3dc')]];
    case 'garagem': return [[0, 1.2, lisa('#77726a')], [1.2, 1.28, lisa(c1)], [1.28, H, { k: 'bloco', tinta: '#cfcbc0' }]];
    default: return [[0, H, { k: 'crua' }]];
  }
}
function pisoDe(ctx, c) {
  switch (c.tipo) {
    case 'patio': case 'patrimonio': case 'criativo': case 'varanda': return { k: 'laje', tinta: '#c2beb4' };
    case 'garagem': return { k: 'laje', tinta: '#a19d94' };
    /* o piso de borracha preta da academia */
    case 'academia': return { k: 'lisa', tinta: '#2d2f33' };
    default: return { k: 'piso_bar' };
  }
}
function paredes3d(ctx) {
  const { B } = ctx;
  for (const w of ctx.paredes) {
    const X = w.ao === 'u';
    const A0 = X ? w.x0 : w.z0, A1 = X ? w.x1 : w.z1, C0 = X ? w.z0 : w.x0, C1 = X ? w.z1 : w.x1;
    const pt = (a, c) => X ? [a, c] : [c, a];
    const cortes = new Set([A0, A1]);
    const add = c => { if (c > A0 + 1e-4 && c < A1 - 1e-4) cortes.add(c); };
    for (const v of w.vaos) { add(v.a0); add(v.a1); }
    for (const c of ctx.comodos) for (const e of X ? [c.x0, c.x1] : [c.z0, c.z1]) add(e);
    for (const o of ctx.paredes) if (o !== w) for (const e of X ? [o.x0, o.x1] : [o.z0, o.z1]) add(e);
    const cs = [...cortes].sort((a, b) => a - b);
    const topo = ctx.regiao(...pt((A0 + A1) / 2, C0 - 0.03)) === 'fora' || ctx.regiao(...pt((A0 + A1) / 2, C1 + 0.03)) === 'fora' || w.fachadaPatio
      ? lisa(ctx.c1) : lisa(CLARO);
    for (let i = 0; i < cs.length - 1; i++) {
      const s0 = cs[i], s1 = cs[i + 1];
      if (s1 - s0 < 1e-4) continue;
      const sm = (s0 + s1) / 2, vao = w.vaos.find(v => sm > v.a0 && sm < v.a1);
      const partes = vao ? (vao.b0 > 1e-3 ? [[0, vao.b0], [vao.b1, w.h]] : [[vao.b1, w.h]]) : [[0, w.h]];
      const rA = ctx.regiao(...pt(sm, C0 - 0.03)), rB = ctx.regiao(...pt(sm, C1 + 0.03));
      for (const [y0, y1] of partes) {
        if (y1 - y0 < 1e-4) continue;
        faceLonga(ctx, w, X, s0, s1, C0, y0, y1, -1, rA, A0, A1);
        faceLonga(ctx, w, X, s0, s1, C1, y0, y1, +1, rB, A0, A1);
        const pts = X ? [[s0, C1], [s1, C1], [s1, C0], [s0, C0]] : [[C0, s1], [C1, s1], [C1, s0], [C0, s0]];
        B.tampa(pts, y1, topo.k, false, { tinta: topo.tinta });
        if (y0 > 1e-4) B.tampa(pts, y0, 'lisa', true, { tinta: vao && vao.tipo === 'balcao' ? CREME : CLARO });
      }
      /* a ponta do trecho: ombreira de vão, ou ponta de parede solta */
      for (const [s, lado] of [[s0, -1], [s1, +1]]) {
        if (vao) continue;
        const colado = w.vaos.some(v => lado < 0 ? Math.abs(v.a1 - s) < 1e-4 : Math.abs(v.a0 - s) < 1e-4);
        const naPonta = (lado < 0 ? Math.abs(s - A0) < 1e-4 : Math.abs(s - A1) < 1e-4) && ctx.regiao(...pt(s + lado * 0.02, (C0 + C1) / 2)) !== 'parede';
        if (!colado && !naPonta) continue;
        const reg = naPonta ? ctx.regiao(...pt(s + lado * 0.05, (C0 + C1) / 2)) : (rA === 'fora' || rB === 'fora' ? 'fora' : rA !== 'parede' ? rA : rB);
        if (reg === 'parede') continue;
        const bandas = faixasDaFace(ctx, reg === null ? 'fora' : reg, w);
        const F = X ? (lado < 0 ? B.plano([s, 0, C1], [0, 0, -1], [0, 1, 0]) : B.plano([s, 0, C0], [0, 0, 1], [0, 1, 0]))
                    : (lado < 0 ? B.plano([C0, 0, s], [1, 0, 0], [0, 1, 0]) : B.plano([C1, 0, s], [-1, 0, 0], [0, 1, 0]));
        for (const [b0, b1, sp] of bandas) {
          const y0 = Math.max(0, b0), y1 = Math.min(w.h, b1);
          if (y1 - y0 > 1e-4) B.ladrilhar(F, B.ret(0, C1 - C0, y0, y1), sp.k, { tinta: sp.tinta });
        }
      }
    }
    for (const v of w.vaos) vao3d(ctx, w, X, v, C0, C1);
  }
}
function faceLonga(ctx, w, X, s0, s1, c, y0, y1, sinal, reg, A0, A1) {
  if (reg === 'parede') return;
  const { B } = ctx, larg = s1 - s0;
  const F = X ? (sinal < 0 ? B.plano([s1, 0, c], [-1, 0, 0], [0, 1, 0]) : B.plano([s0, 0, c], [1, 0, 0], [0, 1, 0]))
              : (sinal < 0 ? B.plano([c, 0, s0], [0, 0, 1], [0, 1, 0]) : B.plano([c, 0, s1], [0, 0, -1], [0, 1, 0]));
  /* a grade da peça continua de um trecho pro outro (o azulejo não pode
     pular no meio da parede) */
  const oa = X ? (sinal < 0 ? s1 - A1 : A0 - s0) : (sinal < 0 ? A0 - s0 : s1 - A1);
  for (const [b0, b1, sp] of faixasDaFace(ctx, reg, w)) {
    const a = Math.max(y0, b0), b = Math.min(y1, b1);
    if (b - a > 1e-4) B.ladrilhar(F, B.ret(0, larg, a, b), sp.k, { tinta: sp.tinta, oa });
  }
}
/* o que vai dentro de cada vão: a folha de madeira, a porta de vidro da
   rua, a janela, o balcão */
function vao3d(ctx, w, X, v, C0, C1) {
  const { B, G } = ctx, cm = (C0 + C1) / 2, esp = C1 - C0;
  const P = (a, c, y) => X ? [a, y, c] : [c, y, a];
  const U = X ? [1, 0, 0] : [0, 0, 1];
  if (v.tipo === 'janela') {
    B.esticar(B.plano(P(v.a0, cm, v.b0), U, [0, 1, 0]), 0, v.a1 - v.a0, 0, v.b1 - v.b0, v.k);
    /* o peitoril saltado pra fora, na parede externa */
    const fora = ctx.regiao(...(X ? [(v.a0 + v.a1) / 2, C0 - 0.03] : [C0 - 0.03, (v.a0 + v.a1) / 2])) === 'fora' ? -1 : 1;
    const c0 = fora < 0 ? C0 - 0.05 : C1, c1 = fora < 0 ? C0 : C1 + 0.05;
    if (X) B.caixa(v.a0 - 0.04, v.a1 + 0.04, v.b0 - 0.04, v.b0, c0, c1, { todas: { k: 'laje_borda', tinta: '#dcd8cf' }, base: null });
    else B.caixa(c0, c1, v.b0 - 0.04, v.b0, v.a0 - 0.04, v.a1 + 0.04, { todas: { k: 'laje_borda', tinta: '#dcd8cf' }, base: null });
    return;
  }
  /* o chão do vão (a soleira) */
  const pts = X ? [[v.a0, C1], [v.a1, C1], [v.a1, C0], [v.a0, C0]] : [[C0, v.a1], [C1, v.a1], [C1, v.a0], [C0, v.a0]];
  B.tampa(pts, PISO, 'laje_borda', false, { tinta: v.tipo === 'garagem' ? '#9d998f' : '#cbc6ba' });
  /* O PORTÃO DA GARAGEM (a fachada é ao longo de x): o requadro de aço, a
     guia do portão de correr lá em cima e a folha de GRADE na face da rua
     — pela grade quem passa vê o ônibus. A sede vaga fica de porta de
     enrolar abaixada */
  if (v.tipo === 'garagem' || v.tipo === 'bar') {
    const fr = C0 + 0.02, aco = { todas: lisa(ACO_ESCURO), base: null };
    if (v.tipo === 'garagem') {
      B.caixa(v.a0 - 0.1, v.a0, 0, v.b1 + 0.1, C0 - 0.03, C1, aco);
      B.caixa(v.a1, v.a1 + 0.1, 0, v.b1 + 0.1, C0 - 0.03, C1, aco);
      B.caixa(v.a0 - 0.1, v.a1 + 0.1, v.b1, v.b1 + 0.12, C0 - 0.05, C0 + 0.08, aco);
      if (ctx.aberta) {
        ctx.G.ladrilhar(ctx.G.plano([v.a0, 0.02, fr + 0.03], [1, 0, 0], [0, 1, 0]), ctx.G.ret(0, v.a1 - v.a0, 0, v.b1 - 0.02), 'preta');
        B.caixa(v.a0, v.a1, 0, 0.05, fr, fr + 0.05, aco);
      } else B.esticar(B.plano([v.a0, 0, fr], [1, 0, 0], [0, 1, 0]), 0, v.a1 - v.a0, 0, v.b1, 'enrolar');
      return;
    }
    /* A PORTA DO BAR, de enrolar: aberta (o rolo lá em cima, as duas guias)
       com a torcida na sede; abaixada na sede vaga */
    B.caixa(v.a0 - 0.05, v.a0, 0, v.b1, C0 - 0.02, C0 + 0.06, aco);
    B.caixa(v.a1, v.a1 + 0.05, 0, v.b1, C0 - 0.02, C0 + 0.06, aco);
    B.caixa(v.a0 - 0.05, v.a1 + 0.05, v.b1 - 0.26, v.b1, C0 + 0.02, C0 + 0.3, { todas: lisa('#8d9296'), base: lisa('#5f6468') });
    if (!ctx.aberta) B.esticar(B.plano([v.a0, 0, fr], [1, 0, 0], [0, 1, 0]), 0, v.a1 - v.a0, 0, v.b1 - 0.26, 'enrolar');
    return;
  }
  const pt = ctx.portas.find(p => p.parede === w && Math.abs(p.c - (v.a0 + v.a1) / 2) < 1e-3);
  if (!pt) return;
  const sentido = pt.abre;
  /* o giro da folha: fechada ao longo da parede, aberta pra `sentido`
     (o mesmo da planta); presa na face pra onde ela abre */
  const aberta = ctx.aberta, angAberta = v.tipo === 'portao' ? 1.25 : 1.4, ang = aberta && !ctx.vivas ? angAberta : 0;
  const face = sentido > 0 ? C1 - 0.03 : C0 + 0.03;
  if (v.tipo === 'portao') {
    /* os batentes na terceira cor, a bandeira de vidro em cima, as duas
       folhas de vidro de loja; fechada, a porta de enrolar abaixada */
    const g0 = v.a0 + ctx.u(4), g1 = v.a1 - ctx.u(4);
    /* os batentes sobem até a faixa da verga (na planta vão até o alto da
       platibanda; acima da cabeça ninguém esbarra, e ali mora o letreiro) */
    const hb = v.b1 + ctx.u(5);
    for (const [a, b] of [[v.a0 - ctx.u(4), g0], [g1, v.a1 + ctx.u(4)]]) {
      if (X) B.caixa(a, b, 0, hb, 0, C1 + ctx.u(1), { todas: lisa(ctx.c3), base: null });
      else B.caixa(0, C1 + ctx.u(1), 0, hb, a, b, { todas: lisa(ctx.c3), base: null });
    }
    if (X) B.caixa(v.a0 - ctx.u(3), v.a1 + ctx.u(3), v.b1, v.b1 + ctx.u(5), 0, C1 + ctx.u(1.4), { todas: lisa(ctx.c3) });
    else B.caixa(0, C1 + ctx.u(1.4), v.b1, v.b1 + ctx.u(5), v.a0 - ctx.u(3), v.a1 + ctx.u(3), { todas: lisa(ctx.c3) });
    const hp = 2.1, larg = (g1 - g0) / 2;
    B.esticar(B.plano(P(g0, cm, hp), U, [0, 1, 0]), 0, g1 - g0, 0, v.b1 - hp, 'vitro_alto');
    if (X) B.caixa(g0, g1, hp - 0.04, hp, cm - 0.04, cm + 0.04, { todas: lisa('#b9bcbe') });
    else B.caixa(cm - 0.04, cm + 0.04, hp - 0.04, hp, g0, g1, { todas: lisa('#b9bcbe') });
    for (const [h, dirF] of [[g0, 1], [g1, -1]]) folhaDaPorta(ctx, X, h, face, dirF, sentido, larg, hp, ang, 'jan2', 'portao', angAberta);
    if (!aberta) {
      const fr = ctx.u(ctx.P.F0) - 0.02;
      B.esticar(B.plano(P(g0, fr, 0), U, [0, 1, 0]), 0, g1 - g0, 0, v.b1, 'enrolar');
    }
    return;
  }
  /* a porta de madeira das salas, com o alizar branco dos dois lados */
  const hp = ctx.u(ctx.P.ALT_PORTA);
  for (const c of [C0 - 0.012, C1]) {
    const al = { todas: lisa('#e9e5da'), base: null };
    if (X) {
      B.caixa(v.a0 - 0.07, v.a0, 0, hp + 0.07, c, c + 0.012, al);
      B.caixa(v.a1, v.a1 + 0.07, 0, hp + 0.07, c, c + 0.012, al);
      B.caixa(v.a0 - 0.07, v.a1 + 0.07, hp, hp + 0.07, c, c + 0.012, al);
    } else {
      B.caixa(c, c + 0.012, 0, hp + 0.07, v.a0 - 0.07, v.a0, al);
      B.caixa(c, c + 0.012, 0, hp + 0.07, v.a1, v.a1 + 0.07, al);
      B.caixa(c, c + 0.012, hp, hp + 0.07, v.a0 - 0.07, v.a1 + 0.07, al);
    }
  }
  folhaDaPorta(ctx, X, v.a0, face, 1, sentido, v.a1 - v.a0, hp, ang, 'porta_madeira', 'porta:' + ctx.vivas?.length, angAberta);
}
/* A FOLHA QUE ABRE E FECHA (opc.portasVivas, o cenário a pé: o F abre e
   fecha): a folha sai FECHADA num construtor só dela, com a dobradiça e
   o rumo da folha fechada e aberta (no modelo; quem monta passa pro
   mundo). `grupo`: as duas folhas do portão abrem juntas. Sem as portas
   vivas, a folha entra na malha da sede, aberta ou fechada */
function folhaDaPorta(ctx, X, h, face, dirF, sentido, larg, alt, ang, k, grupo, angAberta) {
  if (!ctx.vivas) { folha(ctx, X, h, face, dirF, sentido, larg, alt, ang, k); return; }
  const C = Construtor('casas');
  folha({ ...ctx, B: C }, X, h, face, dirF, sentido, larg, alt, 0, k);
  const fechada = X ? [dirF, 0] : [0, dirF];
  const aberta = X ? [dirF * Math.cos(angAberta), sentido * Math.sin(angAberta)] : [sentido * Math.sin(angAberta), dirF * Math.cos(angAberta)];
  ctx.vivas.push({ C, hx: X ? h : face, hz: X ? face : h, fechada, aberta, larg, alt, grupo, vidro: k === 'jan2' });
}
/* uma folha de porta: presa em `h` (ao longo da parede), na linha
   `face`; fechada ela corre pra `dirF` ao longo da parede, e gira `ang`
   pra `sentido`, que é o lado pra onde ela abre */
function folha(ctx, X, h, face, dirF, sentido, larg, alt, ang, k) {
  const { B } = ctx;
  const cf = Math.cos(ang), sf = Math.sin(ang);
  /* em (along, across): fechada = (dirF, 0); aberta = (0, sentido) */
  const da = dirF * cf, dc = sentido * sf;
  const hx = X ? h : face, hz = X ? face : h;
  const dx = X ? da : dc, dz = X ? dc : da;
  const e = 0.04, nx = -dz, nz = dx;
  const p0 = [hx + nx * e / 2, hz + nz * e / 2], p1 = [hx - nx * e / 2, hz - nz * e / 2];
  B.esticar(B.plano([p0[0], 0.01, p0[1]], [dx, 0, dz], [0, 1, 0]), 0, larg, 0, alt, k);
  B.esticar(B.plano([p1[0] + dx * larg, 0.01, p1[1] + dz * larg], [-dx, 0, -dz], [0, 1, 0]), 0, larg, 0, alt, k);
  const borda = { tinta: '#b9b4a8' };
  B.ladrilhar(B.plano([p1[0] + dx * larg, 0.01, p1[1] + dz * larg], [nx, 0, nz], [0, 1, 0]), B.ret(0, e, 0, alt), 'lisa', borda);
  B.ladrilhar(B.plano([p1[0], alt + 0.01, p1[1]], [dx, 0, dz], [nx, 0, nz]), B.ret(0, larg, 0, e), 'lisa', borda);
}

/* =======================================================
   O TELHADO: fibrocimento, numa lista à parte
   ======================================================= */
function telhado3d(ctx) {
  const T = ctx.T, P = ctx.P, u = ctx.u;
  for (const t of P.teto) {
    const x0 = u(t.u0), x1 = u(t.u1), z0 = u(t.v0), z1 = u(t.v1), hE = u(P.ALT_EXT);
    if (t.agua === 'plat') {
      /* O BLOCO COM PLATIBANDA (os níveis 2 a 5): a folha de fibrocimento
         entre as paredes, alta do lado do pátio e caindo pro lado de fora,
         por baixo do alto das paredes em volta (que escondem a borda dela),
         e a calha no pé da água */
      const ya = u(t.y0), yb = u(t.y1), dx = x1 - x0, dy = yb - ya, Lr = Math.hypot(dx, dy);
      if (t.cai === '+v') {
        /* (a academia do nível 4, no fundo do pátio: a água cai pro fundo) */
        const dz = z1 - z0, Lz = Math.hypot(dz, dy);
        T.ladrilhar(T.plano([x1, ya, z0], [-1, 0, 0], [0, dy / Lz, dz / Lz]), T.ret(0, x1 - x0, 0, Lz), 'fibro');
        T.caixa(x0, x1, yb - 0.14, yb, z1 - 0.14, z1, { todas: 'calha' });
      } else if (t.cai === '+u') {
        T.ladrilhar(T.plano([x0, ya, z0], [0, 0, 1], [dx / Lr, dy / Lr, 0]), T.ret(0, z1 - z0, 0, Lr), 'fibro');
        T.caixa(x1 - 0.14, x1, yb - 0.14, yb, z0, z1, { todas: 'calha' });
      } else {
        T.ladrilhar(T.plano([x1, ya, z1], [0, 0, -1], [-dx / Lr, dy / Lr, 0]), T.ret(0, z1 - z0, 0, Lr), 'fibro');
        T.caixa(x0, x0 + 0.14, yb - 0.14, yb, z0, z1, { todas: 'calha' });
      }
    } else {
      /* uma água, caindo do pátio pro lado de lá (o barracão do nível 1) */
      const ya = u(P.MURO) - 0.06, yb = hE + 0.02, dx = x1 - x0, dy = yb - ya, L = Math.hypot(dx, dy);
      T.ladrilhar(T.plano([x0, ya, z0], [0, 0, 1], [dx / L, dy / L, 0]), T.ret(0, z1 - z0, 0, L), 'fibro');
      T.caixa(x1 - 0.1, x1 + 0.02, yb - 0.14, yb, z0, z1, { todas: 'calha' });
      /* o fechamento acima da parede do fundo, até o telhado */
      for (const zf of [z1 - u(P.PAR), z1]) {
        const F = T.plano([0, 0, zf], [1, 0, 0], [0, 1, 0]);
        T.ladrilhar(F, [[x0, hE], [x1, hE], [x1, yb], [x0, ya]], 'lisa', { tinta: zf === z1 ? ctx.c1 : CLARO });
      }
    }
  }
}

/* =======================================================
   A SEDE INTEIRA
   ======================================================= */
/* `sede`: { area, frente, nivel, lado, torcida: { cor, cor2, cor3, sigla,
   nome, clubeSigla, clubeCor, clubeCor2, escudo, escudoClube } | null }.
   Sem torcida é a sede vaga. `escudo` e `escudoClube` são o caminho do
   PNG do jogo (img/escudos/torcida-<id>.png e clube-<id>.png), que quem
   monta a sede resolve pelo manifesto; vão no `img` do decalque, e quem
   mostra põe a imagem por cima do escudo gerado (sem o PNG, fica o
   gerado). `opc.so2d` só faz a planta baixa (sem geometria). */
export function montarSede(sede, destino = {}, opc = {}) {
  const E = eixosDaSede(sede.area, sede.frente);
  const P = planoDaSede(E.L, E.A, sede.nivel, sede.lado || 'mandante');
  const T0 = sede.torcida || null, aberta = !!T0;
  const cor = T0 ? { cor: viva(T0.cor), cor2: viva(T0.cor2 || '#e8e2d0'), cor3: viva(T0.cor3 || T0.cor2 || '#e8e2d0') } : NEUTRO_SEDE;
  const so2d = !!opc.so2d;
  const novoC = folha => so2d ? construtorMudo() : Construtor(folha);
  const B = novoC('casas'), G = novoC('grades'), Tt = novoC('casas');
  /* o que está guardado nos armários, numa malha à parte (a cidade troca
     só ela quando o patrimônio do save muda) */
  const Bg = novoC('casas');
  const u = v => v / M;
  const conv = r => ({ ...r, x0: u(r.u0), x1: u(r.u1), z0: u(r.v0), z1: u(r.v1) });
  const dentro = (r, x, z) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1;
  const marcas = [], placas = [], lugares = [], armarios = [];
  const vivas = opc.portasVivas && aberta && !so2d ? [] : null;
  /* O CANTEIRO DE UMA PLANTA (o térreo; no nível 5, também o 1º andar, no
     referencial dele): as paredes, os cômodos e as portas em metro, e quem
     escreve em cada construtor. `marcar`: o que vai pra planta baixa */
  function fazerCtx(Pl, Bx, Gx, Tx, marcar) {
    const paredes = Pl.paredes.map(w => ({ ...conv(w), orig: w, ao: w.ao, h: u(w.altModelo || w.alt), fachada: w.fachada, fachadaPatio: w.fachadaPatio,
                                         vaos: w.vaos.map(v => ({ ...v, a0: u(v.a0), a1: u(v.a1), b0: u(v.b0), b1: u(v.b1) })) }));
    const comodos = Pl.comodos.map(c => ({ ...conv(c), porta: c.porta ? { lado: c.porta.lado, c: u(c.porta.c), w: u(c.porta.w) } : null }));
    const paredeDe = new Map(Pl.paredes.map((w, i) => [w, paredes[i]]));
    const portas = Pl.portas.map(p => ({ ...p, c: u(p.c), w: u(p.w), parede: paredeDe.get(p.parede) }));
    const c = {
      B: Bx, G: Gx, T: Tx, P: Pl, u, aberta, cores: cor, c1: cor.cor, c2: cor.cor2, c3: cor.cor3, paredes, comodos, portas, PAR_M: u(Pl.PAR),
      lugares, armarios, vivas, andar: Pl.andar || 0,
      /* os anexos que o save diz (a enfermaria, o galpão, o cofre, a área de treino) */
      anexos: (aberta && sede.anexos) || {},
      regiao(x, z) {
        for (const k of comodos) if (dentro(k, x, z)) return k;
        for (const w of paredes) if (dentro(w, x, z)) return 'parede';
        return 'fora';
      },
      marca(x0, x1, z0, z1, k) { if (marcar) marcas.push({ x0, x1, z0, z1, cor: k, tipo: 'movel' }); },
      /* a faixa da torcida com o nome, pregada na parede `lado` do cômodo */
      faixa(lado, a, y, larg, alt, Q) {
        if (!T0) return;
        const off = 0.03, [s, t] = lado === '+t' ? [a, Q.D - off] : lado === '-t' ? [a, off] : lado === '-s' ? [off, a] : [Q.W - off, a];
        const n = { '+t': '-t', '-t': '+t', '-s': '+s', '+s': '-s' }[lado];
        const [x, z] = Q.pt(s, t), [nx, nz] = VEC[Q.d(n)];
        placas.push({ tipo: 'faixa', texto: T0.nome || T0.sigla, fundo: cor.cor, tinta: legivelSobre(cor.cor, [cor.cor2, cor.cor3]),
                      x, y: y + alt / 2, z, nx, nz, larg, alt });
      },
      /* a placa de um móvel (a testeira do armário): no ponto (x, z) do
         modelo, virada pra `olha` do cômodo, nas cores das placas das salas */
      placa(Q, [x, z], olha, y, larg, alt, texto) {
        if (!T0) return;
        const [nx, nz] = VEC[Q.d(olha)];
        placas.push({ tipo: 'placa', texto, fundo: cor.cor2, tinta: legivel(cor.cor2), x, y, z, nx, nz, larg, alt });
      },
      /* O QUADRO COM A CAMISA DA TORCIDA (o marketing, a presidência): na
         parede `lado` do cômodo, no ponto `a` dela, o centro na altura `y`;
         quem mostra desenha a camisa nas cores e com o escudo, na moldura.
         `k` varia o modelo (a de jogo, a listrada, a retrô) */
      camisa(Q, lado, a, y, larg, alt, k = 0) {
        if (!T0) return;
        const off = 0.035, [s, t] = lado === '+t' ? [a, Q.D - off] : lado === '-t' ? [a, off] : lado === '-s' ? [off, a] : [Q.W - off, a];
        const n = { '+t': '-t', '-t': '+t', '-s': '+s', '+s': '-s' }[lado];
        const [x, z] = Q.pt(s, t), [nx, nz] = VEC[Q.d(n)];
        naParede(c, Q, lado, a - larg / 2 - 0.03, a + larg / 2 + 0.03, y - alt / 2 - 0.03, y + alt / 2 + 0.03, 0.03, { todas: lisa('#2b2622') });
        placas.push({ tipo: 'camisa', k, cor: cor.cor, cor2: cor.cor2, cor3: cor.cor3, texto: T0.sigla, img: T0.escudo || null,
                      x: x + nx * 0.006, y, z: z + nz * 0.006, nx, nz, larg, alt });
      },
      /* a faixa DEITADA (o setor criativo: a faixa nova sendo pintada na mesa):
         o retângulo (s0..s1, t0..t1) do cômodo, na altura y, o texto correndo em `ao` */
      faixaDeitada(Q, s0, s1, t0, t1, y, ao) {
        if (!T0) return;
        const [x, z] = Q.pt((s0 + s1) / 2, (t0 + t1) / 2), [ax, az] = VEC[Q.d(ao)];
        const lS = s1 - s0, lT = t1 - t0, larg = ao === '+s' || ao === '-s' ? lS : lT, alt = ao === '+s' || ao === '-s' ? lT : lS;
        placas.push({ tipo: 'faixa', deitada: true, texto: T0.nome || T0.sigla, fundo: cor.cor, tinta: legivelSobre(cor.cor, [cor.cor2, cor.cor3]),
                      x, y, z, nx: ax, nz: az, larg, alt });
      }
    };
    return c;
  }
  /* os pisos de uma planta (e a planta baixa deles) */
  const pisos = (c, marcar) => {
    for (const k of c.comodos) {
      const f = pisoDe(c, k);
      c.B.tampa([[k.x0, k.z1], [k.x1, k.z1], [k.x1, k.z0], [k.x0, k.z0]], PISO, f.k, false, { tinta: f.tinta });
      if (marcar) marcas.push({ x0: k.x0, x1: k.x1, z0: k.z0, z1: k.z1, cor: f.tinta || '#d8d5cf', tipo: 'piso' });
    }
  };
  /* a mobília de uma planta, cômodo por cômodo */
  const mobiliar = c => {
    for (const k of c.comodos) {
      const f = (P.novo ? MOBILIA_N : MOBILIA)[k.tipo];
      if (f) f(c, quarto(k));
    }
  };
  /* A PLACA DE CADA SALA, na verga, do lado de quem chega (a planta põe
     ali o mesmo letreiro); `dy`, a altura do andar */
  const placasDasPortas = (c, dy) => {
    if (!T0) return;
    for (const p of c.portas) {
      if (!p.nome) continue;
      const w = p.parede, X = w.ao === 'u', sentido = p.abre;
      const cc = X ? (sentido > 0 ? w.z0 : w.z1) : (sentido > 0 ? w.x0 : w.x1);
      const off = -sentido * 0.035, vao = w.vaos.find(v => Math.abs((v.a0 + v.a1) / 2 - p.c) < 1e-3), topoVao = vao ? vao.b1 : u(c.P.ALT_PORTA);
      const hPl = Math.min(u(9), w.h - topoVao - 0.1), lPl = Math.min(hPl * 4.2, p.w + u(10));
      if (hPl < u(4)) continue;
      const [x, z] = X ? [p.c, cc + off] : [cc + off, p.c];
      const [nx, nz] = X ? [0, -sentido] : [-sentido, 0];
      placas.push({ tipo: 'placa', texto: p.nome, fundo: cor.cor2, tinta: legivel(cor.cor2), x, y: dy + topoVao + 0.05 + hPl / 2, z, nx, nz, larg: lPl, alt: hPl });
    }
  };

  const ctx = fazerCtx(P, B, G, Tt, true);
  const { paredes, comodos, portas } = ctx;
  /* ---- os pisos ---- */
  pisos(ctx, true);
  /* a calçada da frente, um dedo acima da calçada da rua */
  B.tampa([[0, u(P.F0)], [u(P.L), u(P.F0)], [u(P.L), 0], [0, 0]], 0.08, 'laje', false, { tinta: CIMENTO });
  /* as duas listras da torcida no piso do salão e no fundo do pátio */
  const listra = (x0, x1, z0, z1, tinta) => {
    B.tampa([[x0, z1], [x1, z1], [x1, z0], [x0, z0]], PISO + 0.008, 'lisa', false, { tinta });
    marcas.push({ x0, x1, z0, z1, cor: tinta, tipo: 'piso' });
  };
  if (P.novo) for (const [a, b, z0, z1, k] of P.listras) listra(u(a), u(b), u(z0), u(z1), cor[k]);
  else {
    const a = u(P.PAR + 10), b = u(P.uDiv - 10), v1 = u(P.A - P.PAR);
    listra(a, b, v1 - u(20), v1 - u(13), cor.cor2);
    listra(a, b, v1 - u(11), v1 - u(4), cor.cor3);
  }

  /* ---- as paredes, as portas e as janelas ---- */
  if (!so2d) paredes3d(ctx);
  for (const w of paredes) {
    const X = w.ao === 'u', A0 = X ? w.x0 : w.z0, A1 = X ? w.x1 : w.z1;
    let a = A0;
    for (const v of w.vaos.filter(v => v.b0 < 1e-3).sort((p, q) => p.a0 - q.a0).concat([{ a0: A1, a1: A1 }])) {
      if (v.a0 - a > 1e-3) marcas.push(X ? { x0: a, x1: v.a0, z0: w.z0, z1: w.z1, cor: '#3d3b37', tipo: 'parede' }
                                          : { x0: w.x0, x1: w.x1, z0: a, z1: v.a0, cor: '#3d3b37', tipo: 'parede' });
      a = Math.max(a, v.a1);
    }
  }
  /* ---- o nível 5: a laje do 1º andar, os pilares da varanda e a escada ---- */
  if (P.dois) {
    if (!so2d) { lajes3d(ctx); pilares3d(ctx); escada3d(ctx); }
    const e = P.escada;
    marcas.push({ x0: u(e.u0), x1: u(e.u1), z0: u(e.v0), z1: u(e.v1), cor: '#9d998f', tipo: 'movel' });
    for (const p of P.pilares) marcas.push({ x0: u(p.u) - 0.13, x1: u(p.u) + 0.13, z0: u(p.v) - 0.13, z1: u(p.v) + 0.13, cor: '#3d3b37', tipo: 'parede' });
  }

  /* ---- a mobília, cômodo por cômodo (a sede vaga fica vazia) ---- */
  /* o kit do pagode (os instrumentos na mesa do bar): malha à parte, que o
     jogo 3D só mostra no turno de festa */
  const Bp = novoC('casas');
  ctx.Bp = Bp;
  if (aberta) {
    mobiliar(ctx);
    /* O QUE ESTÁ GUARDADO: o patrimônio da torcida (as faixas e as
       bandeiras dela, na cor dela) no armário do PATRIMÔNIO, e as
       tomadas (na cor de quem era dona) no das TOMADAS. `sede.guardados`
       vem do save (o jogo 3D); sem ele, o que toda torcida tem no começo:
       uma faixa e uma bandeira, nenhuma tomada */
    const gd = sede.guardados || {}, pr = gd.proprias || { faixas: 1, bandeiras: 1 };
    const proprias = [];
    for (let i = 0; i < (pr.faixas || 0); i++) proprias.push({ tipo: 'faixa', cor: cor.cor, cor2: cor.cor2 });
    for (let i = 0; i < (pr.bandeiras || 0); i++) proprias.push({ tipo: 'bandeira', cor: cor.cor2, cor2: cor.cor });
    const tomadas = (gd.tomadas || []).map(t => ({ tipo: t.tipo === 'bandeira' ? 'bandeira' : 'faixa', de: t.de || null,
                                                     cor: viva(t.cor || '#6b6b6b'), cor2: viva(t.cor2 || '#d8d8d8') }));
    for (const A of armarios) {
      const pecas = A.tipo === 'tomadas' ? tomadas : proprias;
      A.pecas = pecas;
      A.guardadas = guardarNoArmario(ctx, Bg, A, pecas);
    }
  }

  /* ---- O 1º ANDAR (o nível 5): a mesma conta num construtor à parte, no
     referencial do andar (o piso em 0), e depois erguida até o piso de
     cima; os lugares, as placas e as portas vivas de lá sobem junto ---- */
  let cima = null;
  if (P.andar) {
    const A2 = P.andar, h1 = A2.h1;
    const Bu = novoC('casas'), Gu = novoC('grades'), Tu = novoC('casas');
    const nL = lugares.length, nP = placas.length, nV = vivas ? vivas.length : 0;
    const ctx2 = fazerCtx(A2, Bu, Gu, Tu, false);
    ctx2.Bp = construtorMudo();
    pisos(ctx2, false);
    if (!so2d) { paredes3d(ctx2); guardas3d(ctx2, A2.guardas); }
    if (aberta) mobiliar(ctx2);
    if (!so2d) telhado3d(ctx2);
    placasDasPortas(ctx2, 0);
    const erguer = C => { for (let i = 1; i < C.pos.length; i += 3) C.pos[i] += h1; };
    for (const C of [Bu, Gu, Tu]) erguer(C);
    for (let i = nL; i < lugares.length; i++) lugares[i].andar = 1;
    for (let i = nP; i < placas.length; i++) placas[i].y += h1;
    if (vivas) for (let i = nV; i < vivas.length; i++) { erguer(vivas[i].C); vivas[i].yb = h1; }
    cima = { ctx: ctx2, Bu, Gu, Tu, h1 };
  }

  /* ---- a fachada: mastro, arandelas, o ar do lado de fora ---- */
  const mt = P.mastro;
  if (aberta && mt) mastroComBandeira(ctx, u(mt.u), u(mt.v), u(mt.base), u(mt.alt), 1, 0);
  if (!so2d) {
    const fz = u(P.F0) - 0.01, gl = u(P.g0) - u(8), gr = u(P.g1) + u(8);
    for (const x of [gl, gr]) {
      B.caixa(x - 0.09, x + 0.09, 2.3, 2.52, fz - 0.14, fz, { todas: lisa(PRETO) });
      B.caixa(x - 0.07, x + 0.07, 2.32, 2.46, fz - 0.141, fz - 0.139, { todas: null, tras: lisa('#f3dc8a') });
    }
    telhado3d(ctx);
    const exterior = [];
    const pr = comodos.find(c => c.tipo === 'presidencia');
    if (P.novo) {
      /* a condensadora da presidência (e a do marketing) na parede do fundo, que dá pra rua de trás */
      for (const c of [pr, comodos.find(k => k.tipo === 'marketing')])
        if (c && Math.abs(c.z1 - u(P.A - P.PAR)) < 1e-3) exterior.push(B.plano([(c.x0 + c.x1) / 2 - 0.45, c.tipo === 'marketing' ? 1.9 : 1.3, u(P.A) + 0.001], [1, 0, 0], [0, 1, 0]));
      /* O BAR PRA RUA: a faixa da cerveja em cima da porta de enrolar */
      const bar = comodos.find(c => c.tipo === 'bar');
      if (aberta && bar && bar.porta) {
        const x0 = Math.max(bar.x0 + 0.05, bar.porta.c - bar.porta.w / 2 - 0.35), x1 = Math.min(bar.x1 - 0.05, bar.porta.c + bar.porta.w / 2 + 0.35);
        B.esticar(B.plano([x1, 2.63, u(P.F0) - 0.012], [-1, 0, 0], [0, 1, 0]), 0, x1 - x0, 0, 0.36, 'faixa_cerveja');
      }
    } else if (pr) exterior.push(B.plano([u(P.L) + 0.001, 1.25, pr.z1 - 0.9], [0, 0, -1], [0, 1, 0]));
    if (aberta) for (const F of exterior) arSplit(B, F, 0, 0);
  }

  /* ---- os decalques com texto (quem mostra é quem escreve) ---- */
  const L = u(P.L), zF = u(P.F0) - 0.035;
  if (T0) {
    /* o nome da torcida na platibanda, em cima do portão (níveis 2 a 5) ou
       no meio da fachada (nível 1), e os escudos dos dois lados */
    /* nível 1: no trecho das salas, que a porta fica no do pátio */
    const LT = P.letreiro;
    const yL = LT ? LT.y : 2.83, alt = LT ? LT.alt : 0.66;
    const xL = LT ? u(LT.u) : (u(P.g1) + u(4) + L) / 2;
    const larg = Math.min(LT ? LT.larg - 2 * alt * 0.95 * 0.8 - 0.2 : (L - u(P.g1) - u(4)) * 0.62, alt * 5.6);
    placas.push({ tipo: 'placa', texto: T0.nome || T0.sigla, fundo: cor.cor2, tinta: legivel(cor.cor2), x: xL, y: yL, z: zF, nx: 0, nz: -1, larg, alt });
    const esc = alt * 0.95, dx = larg / 2 + esc * 0.8;
    placas.push({ tipo: 'escudo', forma: 'bola', cor: cor.cor, cor2: cor.cor2, texto: T0.sigla, corTexto: legivelSobre(cor.cor, [cor.cor2, cor.cor3]),
                  img: T0.escudo || null, x: xL - dx, y: yL, z: zF, nx: 0, nz: -1, larg: esc, alt: esc });
    /* o do clube, nas duas cores dele; sem os clubes carregados, nas duas
       últimas da torcida (branco sobre a parede de reboco some) */
    const cc1 = T0.clubeCor || cor.cor2, cc2 = T0.clubeCor ? T0.clubeCor2 || cor.cor2 : cor.cor3;
    if (T0.clubeSigla || T0.escudoClube) placas.push({ tipo: 'escudo', forma: 'diagonal', cor: cc1, cor2: cc2, texto: T0.clubeSigla || '',
                                     corTexto: '#ffffff', img: T0.escudoClube || null, x: xL + dx, y: yL, z: zF, nx: 0, nz: -1, larg: esc * 0.85, alt: esc * 0.85 });
    /* e um escudo em cada parede do lado, que também é parede de fora (o da
       garagem, lá em cima, que ela é mais alta; no nível 5, no 1º andar) */
    const zm = u(P.A / 2);
    for (const [x, nx] of [[-0.035, -1], [L + 0.035, 1]]) {
      const alto = P.escudoLado || (nx < 0 && P.gar ? { y: 3.2, larg: 1.2 } : { y: 1.9, larg: 0.8 });
      placas.push({ tipo: 'escudo', forma: 'bola', cor: cor.cor, cor2: cor.cor2, texto: T0.sigla, corTexto: legivelSobre(cor.cor, [cor.cor2, cor.cor3]),
                    img: T0.escudo || null, x, y: alto.y, z: zm, nx, nz: 0, larg: alto.larg, alt: alto.larg });
    }
    /* A PLACA DO BAR em cima da porta de enrolar, na rua */
    const barC = P.novo && comodos.find(c => c.tipo === 'bar');
    if (barC && barC.porta) {
      const lB = Math.min(barC.x1 - barC.x0 - 0.3, 3.0);
      placas.push({ tipo: 'placa', texto: 'BAR DA ' + T0.sigla, fundo: cor.cor2, tinta: legivel(cor.cor2), x: barC.porta.c, y: 3.3, z: zF, nx: 0, nz: -1, larg: lB, alt: Math.min(0.5, lB / 5) });
    }
    /* a garagem: o nome da torcida pintado na testeira, em cima dos portões */
    if (P.gar) {
      const gx0 = u(P.gar.u0), gx1 = u(P.gar.u1), lG = Math.min(gx1 - gx0 - 0.4, 7.5);
      const topo = u(P.G_MURO) - (P.dois ? 0.08 : 0.3), aG = Math.min(0.6, lG / 5.5, topo - u(P.G_PORTA) - 0.2);
      placas.push({ tipo: 'placa', texto: (T0.nome || T0.sigla), fundo: cor.cor, tinta: legivelSobre(cor.cor, [cor.cor2, cor.cor3]),
                    x: (gx0 + gx1) / 2, y: u(P.G_PORTA) + 0.14 + aG / 2, z: zF, nx: 0, nz: -1, larg: lG, alt: aG });
    }
    placasDasPortas(ctx, 0);
  }

  /* ---- do modelo pro mundo ---- */
  const y0 = opc.y0 || 0;
  const noMundo = (x, z) => E.pt(x * M, z * M);
  /* na frente espelhada (sul e oeste), o triângulo troca dois cantos: a
     face de fora segue de fora (o piso é virado pra cima — é por ele que o
     passo do cenário acha o chão da sede de dois andares) */
  const [o0x, o0z] = noMundo(0, 0), [o1x, o1z] = noMundo(1, 0), [o2x, o2z] = noMundo(0, 1);
  const espelhada = (o1x - o0x) * (o2z - o0z) - (o1z - o0z) * (o2x - o0x) < 0;
  const bloco = C => {
    const n = C.pos.length / 3;
    if (!n) return null;
    const pos = new Float32Array(n * 3), p = C.pos, uv = new Float32Array(C.uv), cor = new Float32Array(C.cor);
    for (let i = 0; i < n; i++) {
      const [wx, wz] = noMundo(p[3 * i], p[3 * i + 2]);
      pos[3 * i] = wx; pos[3 * i + 1] = y0 + p[3 * i + 1] * M; pos[3 * i + 2] = wz;
    }
    if (espelhada) for (let t = 0; t + 2 < n; t += 3) {
      const a = t + 1, b = t + 2;
      for (let k = 0; k < 3; k++) { const q = pos[3 * a + k]; pos[3 * a + k] = pos[3 * b + k]; pos[3 * b + k] = q; }
      for (let k = 0; k < 2; k++) { const q = uv[2 * a + k]; uv[2 * a + k] = uv[2 * b + k]; uv[2 * b + k] = q; }
      for (let k = 0; k < 3; k++) { const q = cor[3 * a + k]; cor[3 * a + k] = cor[3 * b + k]; cor[3 * b + k] = q; }
    }
    return { pos, uv, cor };
  };
  if (!so2d) {
    const listas = [[B, 'casas'], [G, 'grades'], [Tt, 'telhado'], [Bg, 'guardados'], [Bp, 'pagode']];
    if (cima) listas.push([cima.Bu, 'casas'], [cima.Gu, 'grades'], [cima.Tu, 'telhado']);
    for (const [C, lista] of listas) {
      const b = bloco(C);
      if (b) (destino[lista] = destino[lista] || []).push(b);
    }
  }
  const [ox, oz] = noMundo(0, 0);
  const dirMundo = (nx, nz) => { const [a, b] = noMundo(nx, nz); return [a - ox, b - oz]; };
  const placasMundo = placas.map(p => {
    const [x, z] = noMundo(p.x, p.z), [dx, dz] = dirMundo(p.nx, p.nz), n = Math.hypot(dx, dz) || 1;
    return { ...p, x, y: y0 + p.y * M, z, ox: dx / n, oz: dz / n, larg: p.larg * M, alt: p.alt * M };
  });
  /* AS PORTAS VIVAS no mundo: a folha fechada, a dobradiça e o giro (em
     y, o do three.js) que leva a folha fechada até a aberta; `y0`, o piso
     dela (a do 1º andar fica lá em cima) */
  if (vivas) destino.portas = vivas.map(f => {
    const b = bloco(f.C);
    if (!b) return null;
    const [hx, hz] = noMundo(f.hx, f.hz), v0 = dirMundo(...f.fechada), v1 = dirMundo(...f.aberta);
    const n0 = Math.hypot(...v0) || 1;
    return { bloco: b, hx, hz, y0: y0 + (f.yb || 0) * M, larg: f.larg * M, alt: f.alt * M, grupo: f.grupo, vidro: f.vidro, dir: [v0[0] / n0, v0[1] / n0],
             ang: Math.atan2(v0[1] * v1[0] - v0[0] * v1[1], v0[0] * v1[0] + v0[1] * v1[1]) };
  }).filter(Boolean);
  const retMundo = r => {
    const [ax, az] = noMundo(r.x0, r.z0), [bx, bz] = noMundo(r.x1, r.z1);
    return { x0: Math.min(ax, bx), x1: Math.max(ax, bx), y0: Math.min(az, bz), y1: Math.max(az, bz), cor: r.cor, tipo: r.tipo };
  };
  const tetoMundo = P.teto.concat(P.andar ? P.andar.teto : []).map(t => retMundo({ x0: u(t.u0), x1: u(t.u1), z0: u(t.v0), z1: u(t.v1), cor: '#8e8a82', tipo: 'teto' }));
  /* A BANDEIRA no mundo: o canto de cima do pano do lado do mastro, o rumo
     do pano (`dx`, `dz`), as cores e o escudo */
  const bm = ctx.bandeira && T0 ? ctx.bandeira : null;
  const bandeira = bm ? (() => {
    const [x, z] = noMundo(bm.x, bm.z), [dx, dz] = dirMundo(bm.dx, bm.dz), n = Math.hypot(dx, dz) || 1;
    return { x, z, topo: y0 + bm.topo * M, dx: dx / n, dz: dz / n, larg: bm.larg * M, alt: bm.alt * M,
             cor: cor.cor, cor2: cor.cor2, cor3: cor.cor3, img: T0.escudo || null, sigla: T0.sigla || '',
             corTexto: legivelSobre(cor.cor2, [cor.cor, cor.cor3]) };
  })() : null;
  /* OS LUGARES no mundo: o meio do corpo (x, z), o rumo (o do three.js:
     atan2 do vetor pra onde ele olha), o chão (`chao`, em unidade de
     mundo; o do 1º andar, lá em cima) e o assento (m); `conversa`, quando
     tem, vira rumo também */
  const rumoDe = (nx, nz) => { const [dx, dz] = dirMundo(nx, nz); return Math.atan2(dx, dz); };
  const hCima = cima ? cima.h1 : 0;
  const lugaresMundo = lugares.map((l, i) => {
    const [x, z] = noMundo(l.x, l.z);
    const r = { ...l, i, x, z, rumo: rumoDe(l.nx, l.nz), chao: y0 + (PISO + (l.andar ? hCima : 0)) * M, andar: l.andar || 0 };
    delete r.nx; delete r.nz;
    if (l.conversa) r.rumoConversa = rumoDe(l.conversa[0], l.conversa[1]);
    delete r.conversa;
    return r;
  });
  /* o meio de cada cômodo no mundo (a câmera enquadra por ele); `andar` e
     `piso` (m) dizem em que andar ele fica */
  const comodoMundo = (c, andar) => {
    const [ax, az] = noMundo(c.x0, c.z0), [bx, bz] = noMundo(c.x1, c.z1);
    return { nome: c.nome, tipo: c.tipo, larg: c.x1 - c.x0, fundo: c.z1 - c.z0, andar, piso: andar ? hCima : 0,
             x0: Math.min(ax, bx), x1: Math.max(ax, bx), z0: Math.min(az, bz), z1: Math.max(az, bz) };
  };
  const comodosMundo = comodos.map(c => comodoMundo(c, 0)).concat(cima ? cima.ctx.comodos.map(c => comodoMundo(c, 1)) : []);
  /* OS ARMÁRIOS no mundo (a base da INVASÃO DE SEDE, que vem depois: o
     dono, 29/09/2026): o de cada tipo, a caixa dele, pra onde a frente
     olha (`frente`, `rumo`), a BOCA (o ponto no chão, 0,7 m na frente,
     onde quem abre fica), quantas peças cabem e o que tem dentro — as
     tomadas com o id da dona */
  const armariosMundo = armarios.map(A => {
    const [x0, x1, z0, z1] = A.ret, [ax, az] = noMundo(x0, z0), [bx, bz] = noMundo(x1, z1);
    const [fx, fz] = VEC[A.Q.d(A.frente)], [dx, dz] = dirMundo(fx, fz), n = Math.hypot(dx, dz) || 1;
    const [px, pz] = A.ptDe((A.A0 + A.A1) / 2, -0.7), [bwx, bwz] = noMundo(px, pz);
    let cabe = 0;
    for (const nc of A.nichos) cabe += Math.max(1, Math.floor((nc.a1 - nc.a0) / 0.45)) * Math.max(0, Math.floor((nc.yTopo - nc.y) / 0.064));
    return { tipo: A.tipo, comodo: A.comodo, x0: Math.min(ax, bx), x1: Math.max(ax, bx), z0: Math.min(az, bz), z1: Math.max(az, bz),
             x: (ax + bx) / 2, z: (az + bz) / 2, chao: y0 + PISO * M, alt: A.h * M, larg: (A.A1 - A.A0) * M, prof: A.P * M,
             frente: [dx / n, dz / n], rumo: Math.atan2(dx / n, dz / n), boca: { x: bwx, z: bwz }, cabe,
             guardadas: A.guardadas || 0, pecas: (A.pecas || []).map(p => ({ tipo: p.tipo, de: p.de || null })) };
  });
  /* AS VAGAS DA GARAGEM no mundo: o meio do ônibus, pra onde a frente
     dele olha (a rua: ele entra de ré) e o comprimento que cabe — a frente
     25 cm atrás do portão, a traseira livre da bancada do fundo (o
     para-choque passa 13 cm de cada ponta da carroceria) */
  const vagas = (P.vagas || []).map(g => {
    const fundo = u(g.v1 - g.v0), comp = Math.min(11.0, fundo - 0.25 - 0.26 - BANCADA_G - 0.1);
    const [x, z] = noMundo(u(g.u), u(g.v0) + 0.25 + 0.13 + comp / 2), [dx, dz] = dirMundo(0, -1), n = Math.hypot(dx, dz) || 1;
    return { x, z, chao: y0 + PISO * M, frente: [dx / n, dz / n], comp };
  });
  /* AS ENTRADAS no mundo, no meio do vão, na calçada: o portão da sede, a
     porta do bar (que é da rua) e os portões da garagem */
  const naRua = c => { const [x, z] = noMundo(u(c), u(P.F0) / 2); return { x, z }; };
  const vBar = P.novo ? (P.paredes.find(w => w.fachada && w.vaos.some(v => v.tipo === 'bar')) || {}).vaos : null;
  const vaoBar = vBar ? vBar.find(v => v.tipo === 'bar') : null;
  const entradas = { portao: naRua(P.eixo), bar: vaoBar ? naRua((vaoBar.a0 + vaoBar.a1) / 2) : null,
                     garagem: (P.vagas || []).map(g => naRua(g.u)) };
  /* O 1º ANDAR no mundo (o nível 5): a altura do piso de cima (em unidade
     de mundo) e a ESCADA — o pé dela no pátio, o alto dela na varanda, e o
     caminho da varanda até a porta de cada sala de cima (quem sobe anda
     por ele); `retangulo`: a caixa da sede, pra saber se (x, z) é dela */
  let andarMundo = null;
  if (cima) {
    const e = P.escada, vm = u((e.v0 + e.v1) / 2), yC = y0 + (PISO + hCima) * M;
    const ponto = (x, z, y) => { const [wx, wz] = noMundo(x, z); return { x: wx, z: wz, y }; };
    const pe = ponto(u(e.u1) + 0.5, vm, y0 + PISO * M), topo = ponto(u(e.u0) - 0.35, vm, yC);
    /* da chegada da escada, a varanda de cá corre pra frente; a passarela
       atravessa; a varanda de lá corre pro fundo */
    const A2 = P.andar, xW = u(A2.pat.u0) + u(A2.pat.u1 - A2.pat.u0) * 0 + 0.7, xE = u(A2.pat.u1) - 0.7, zBr = u(A2.MF) + 0.9;
    const portasDeCima = cima.ctx.portas.filter(p => p.nome).map(p => {
      const w = p.parede, X = w.ao === 'u';
      /* o ponto na varanda, na frente da porta (o lado de fora da parede) */
      const fora = X ? [p.c, p.abre > 0 ? w.z0 - 0.5 : w.z1 + 0.5] : [p.abre > 0 ? w.x0 - 0.5 : w.x1 + 0.5, p.c];
      const dentroP = X ? [p.c, p.abre > 0 ? w.z1 + 0.6 : w.z0 - 0.6] : [p.abre > 0 ? w.x1 + 0.6 : w.x0 - 0.6, p.c];
      return { nome: p.nome, tipo: TIPO[p.nome] || null, fora: ponto(fora[0], fora[1], yC), dentro: ponto(dentroP[0], dentroP[1], yC), lado: fora[0] < (xW + xE) / 2 ? 'oeste' : 'leste' };
    });
    andarMundo = { h1: hCima * M, piso: yC, escada: { pe, topo }, varanda: { oeste: ponto(xW, zBr, yC), leste: ponto(xE, zBr, yC) }, portas: portasDeCima };
  }
  return { plano: P, placas: placasMundo, planta2d: marcas.map(retMundo), teto: tetoMundo, bandeira,
           comodos: comodosMundo, lugares: lugaresMundo, armarios: armariosMundo, vagas, entradas, andar: andarMundo, nivel: P.N };
}
/* a cor que se lê sobre a cor da torcida: a primeira das dela que se
   separa do fundo; se nenhuma servir, preto ou branco */
function legivelSobre(fundo, outras) {
  const lf = luz(fundo);
  for (const c of outras) if (c && Math.abs(luz(c) - lf) > 90) return c;
  return legivel(fundo);
}
