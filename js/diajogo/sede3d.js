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
      SALAO = '#b7b2a4', RODAPE = '#8a7d6a', PAREDE_SALA = '#efe8d6', AZUL_COLCHAO = '#5a7fb0';
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
const TIPO = { SECRETARIA: 'secretaria', BAR: 'bar', BANHEIRO: 'banheiro', ALMOXARIFADO: 'almoxarifado',
               ALOJAMENTO: 'alojamento', DIRETORIA: 'diretoria', 'DEPÓSITO': 'deposito',
               'PATRIMÔNIO': 'patrimonio', 'PRESIDÊNCIA': 'presidencia' };
export function planoDaSede(L, A, nivel, lado = 'mandante') {
  const N = nivel === 1 ? 1 : 3;
  const m = v => Math.round(v * M);
  const PAR = 9, MF = 13, F0 = 2.5, VAO = 30, PORTAO = 56, ALT_PORTA = Math.round(2.10 * M);
  const MURO = N === 1 ? 66 : 74, ALT_EXT = N === 1 ? 60 : 66, ALT = m(N === 1 ? 2.60 : 2.75);
  const DF = Math.min(96, Math.max(58, A * 0.30)), DB = Math.min(104, Math.max(60, A * 0.32));
  const vF = MF + DF, vB = A - DB, uDiv = Math.round(L * 0.58);
  const eixo = N === 1 ? (PAR + uDiv) / 2 : L / 2, g0 = eixo - PORTAO / 2, g1 = eixo + PORTAO / 2;
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
  let teto, mastro;
  if (N === 3) {
    const oeste = parede(0, PAR, 0, A, ALT_EXT, { ext: true });
    const leste = parede(L - PAR, L, 0, A, ALT_EXT, { ext: true });
    parede(g0 - PAR, g0, MF, vF, ALT);
    parede(g1, g1 + PAR, MF, vF, ALT);
    const nomesF = lado === 'mandante' ? ['SECRETARIA', 'BAR', 'BANHEIRO', 'ALMOXARIFADO']
                                       : ['SECRETARIA', 'BANHEIRO', 'BAR', 'ALMOXARIFADO'];
    let iF = 0;
    for (const [a, b] of [[PAR, g0 - PAR], [g1 + PAR, L - PAR]]) {
      if (b - a < 70) continue;
      const parte = b - a > 150;
      const w = parede(a, b, vF - PAR, vF, ALT, { divisa: true });
      const centros = parte ? [a + (b - a) * 0.25, a + (b - a) * 0.75] : [(a + b) / 2];
      const nomes = parte ? [nomesF[iF], nomesF[iF + 1]] : [nomesF[iF]];
      centros.forEach((c, k) => porta(w, c, VAO, { abre: -1, nome: nomes[k] }));
      const md = (a + b) / 2;
      if (parte) parede(md - PAR / 2, md + PAR / 2, MF, vF - PAR, ALT);
      const faixas = parte ? [[a, md - PAR / 2], [md + PAR / 2, b]] : [[a, b]];
      faixas.forEach(([u0, u1], k) => {
        const c = comodo(nomes[k], u0, u1, MF, vF - PAR, { lado: 'v1', c: centros[k], w: VAO });
        /* a janela do balcão do bar, pro salão: do lado contrário à
           dobradiça, que é o da folha aberta */
        if (c.tipo === 'bar') {
          const j0 = centros[k] + VAO / 2 + 5, j1 = u1 - 5;
          if (j1 - j0 > 10) w.vaos.push({ a0: j0, a1: j1, b0: 1.0 * M, b1: 2.05 * M, tipo: 'balcao' });
        }
      });
      iF += parte ? 2 : 1;
    }
    comodo('CORREDOR', g0, g1, MF, vF, { lado: 'v0', c: eixo, w: PORTAO }, 'corredor');
    comodo('SALÃO', PAR, L - PAR, vF, vB, null, 'salao');
    const fundo = parede(PAR, L - PAR, A - PAR, A, ALT_EXT, { ext: true });
    const n = L > 400 ? 3 : 2, passo = (L - 2 * PAR) / n;
    for (let i = 0; i < n; i++) {
      const a = PAR + i * passo, b = a + passo;
      const nome = i === 0 ? 'ALOJAMENTO' : i === n - 1 ? 'DEPÓSITO' : 'DIRETORIA';
      const w = parede(a, b, vB, vB + PAR, ALT, { divisa: true });
      porta(w, (a + b) / 2, VAO, { abre: 1, nome });
      if (i) parede(a - PAR / 2, a + PAR / 2, vB, A - PAR, ALT);
      comodo(nome, a + (i ? PAR / 2 : 0), b - (i < n - 1 ? PAR / 2 : 0), vB + PAR, A - PAR, { lado: 'v0', c: (a + b) / 2, w: VAO });
    }
    /* AS JANELAS: a de grade na frente de cada sala (o banheiro leva a de
       tijolo de vidro e o almoxarifado o basculante), o vitrô alto no
       salão, e basculante e janela nos cômodos do fundo */
    for (const c of comodos) {
      const um = (c.u0 + c.u1) / 2;
      if (c.v0 === MF && c.tipo !== 'corredor') {
        if (c.tipo === 'banheiro') janela(fachada, um - 0.5 * M, 0.8, 1.42, 2.2, 'tijolo_vidro');
        else if (c.tipo === 'almoxarifado') janela(fachada, um, 0.6, 1.6, 2.2, 'basc');
        else janela(fachada, um, 1.4, 1.0, 2.2, 'jan_grade');
      }
      if (c.v1 === A - PAR) {
        if (c.tipo === 'diretoria') janela(fundo, c.u0 + (c.u1 - c.u0) * 0.78, 1.2, 1.1, 2.1, 'jan_grade');
        else janela(fundo, um, 0.6, c.tipo === 'deposito' ? 2.15 : 1.95, c.tipo === 'deposito' ? 2.75 : 2.55, 'basc');
      }
    }
    for (const w of [oeste, leste]) janela(w, (vF + vB) / 2, 1.6, 2.25, 2.95, 'vitro_alto');
    janela(oeste, (vB + PAR + A - PAR) / 2, 0.6, 1.9, 2.5, 'basc');
    teto = [{ u0: 0, u1: L, v0: MF, v1: A, agua: 'duas' }];
    mastro = { u: L - 1.4 * M, v: (F0 + MF) / 2, base: MURO, alt: 3.2 * M };
  } else {
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
    teto = [{ u0: uDiv, u1: L, v0: MF, v1: A, agua: 'uma' }];
    mastro = { u: uDiv - 16, v: MF + 20, base: 0, alt: 112 };
  }
  return { N, L, A, PAR, MF, F0, VAO, PORTAO, ALT_PORTA, MURO, ALT_EXT, ALT, vF, vB, uDiv, eixo, g0, g1,
           paredes, comodos, portas, teto, mastro, lado };
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
/* o vaso sanitário, de costas pra parede `costas` */
function vaso(ctx, Q, s, t, costas) {
  const [ds, dt] = { '-s': [1, 0], '+s': [-1, 0], '-t': [0, 1], '+t': [0, -1] }[costas];
  const cs = s - ds * 0.24, ct = t - dt * 0.24;                    // a caixa acoplada, na parede
  const ao = ds !== 0;
  if (ao) qcaixa(ctx, Q, cs - 0.09, cs + 0.09, ct - 0.2, ct + 0.2, PISO + 0.4, PISO + 0.78, { todas: lisa(LOUCA) });
  else qcaixa(ctx, Q, cs - 0.2, cs + 0.2, ct - 0.09, ct + 0.09, PISO + 0.4, PISO + 0.78, { todas: lisa(LOUCA) });
  const [cx, cz] = Q.pt(s, t), B = ctx.B;
  B.pintar(LOUCA);
  B.torno(cx, cz, [[0.12, PISO], [0.14, PISO + 0.2], [0.2, PISO + 0.38], [0.2, PISO + 0.42], [0.13, PISO + 0.42]], 10, 'lisa');
  B.pintar('#e6e6e2');
  B.torno(cx, cz, [[0.2, PISO + 0.42], [0.2, PISO + 0.45], [0.12, PISO + 0.45]], 10, 'lisa');
  B.pintar(null);
  ctx.marca(cx - 0.2, cx + 0.2, cz - 0.2, cz + 0.2, LOUCA);
}
/* o mictório na parede */
function mictorio(ctx, Q, lado, a) {
  naParede(ctx, Q, lado, a - 0.18, a + 0.18, PISO + 0.52, PISO + 1.1, 0.3, { todas: lisa(LOUCA) });
  naParede(ctx, Q, lado, a - 0.13, a + 0.13, PISO + 0.62, PISO + 1.0, 0.305, { todas: null, frente: lisa('#d9dcda') });
  naParede(ctx, Q, lado, a - 0.02, a + 0.02, PISO + 1.1, PISO + 1.45, 0.05, { todas: lisa('#c3c7ca') });
}
/* o espelho na parede */
function espelho(ctx, Q, lado, a0, a1, y0, y1) {
  naParede(ctx, Q, lado, a0 - 0.02, a1 + 0.02, y0 - 0.02, y1 + 0.02, 0.02, { todas: lisa('#b8bcbe') });
  naParede(ctx, Q, lado, a0, a1, y0, y1, 0.024, { todas: null, frente: lisa('#a9bcc6') });
}
/* a pia de cubas na bancada de granito, contra a parede `lado` */
function pia(ctx, Q, lado, a0, a1, n) {
  const prof = 0.55, y = PISO + 0.86;
  naParede(ctx, Q, lado, a0, a1, y - 0.04, y, prof, { todas: lisa(GRANITO) }, GRANITO);
  naParede(ctx, Q, lado, a0, a1, PISO, y - 0.04, prof - 0.03, { todas: lisa('#cfc9bb'), topo: null, base: null });
  for (let i = 0; i < n; i++) {
    const c = a0 + (a1 - a0) * (i + 0.5) / n;
    naParede(ctx, Q, lado, c - 0.2, c + 0.2, y - 0.001, y + 0.004, prof - 0.1, { todas: null, topo: lisa('#e9ebea') });
    naParede(ctx, Q, lado, c - 0.14, c + 0.14, y + 0.002, y + 0.006, prof - 0.16, { todas: null, topo: lisa('#8d9496') });
    naParede(ctx, Q, lado, c - 0.015, c + 0.015, y, y + 0.22, 0.12, { todas: lisa('#c3c7ca') });
  }
}
/* a mesa de sinuca: o móvel de madeira, o pano verde, as bordas, as
   caçapas, as bolas e o taco */
function sinuca(ctx, Q, s0, s1, t0, t1) {
  const y = PISO, h = 0.8, bd = 0.1;
  for (const [s, t] of [[s0 + 0.12, t0 + 0.12], [s1 - 0.12, t0 + 0.12], [s1 - 0.12, t1 - 0.12], [s0 + 0.12, t1 - 0.12], [(s0 + s1) / 2, t0 + 0.12], [(s0 + s1) / 2, t1 - 0.12]])
    qcaixa(ctx, Q, s - 0.06, s + 0.06, t - 0.06, t + 0.06, y, y + h - 0.2, { todas: lisa('#4a2d18'), base: null, topo: null });
  qcaixa(ctx, Q, s0, s1, t0, t1, y + h - 0.2, y + h - 0.04, { todas: lisa('#5c3a22') }, FELTRO);
  qcaixa(ctx, Q, s0 + bd, s1 - bd, t0 + bd, t1 - bd, y + h - 0.04, y + h - 0.035, { todas: null, topo: lisa(FELTRO) });
  for (const [a0, a1, b0, b1] of [[s0, s1, t0, t0 + bd], [s0, s1, t1 - bd, t1], [s0, s0 + bd, t0 + bd, t1 - bd], [s1 - bd, s1, t0 + bd, t1 - bd]])
    qcaixa(ctx, Q, a0, a1, b0, b1, y + h - 0.04, y + h + 0.02, { todas: lisa('#6b4428'), base: null });
  for (const [s, t] of [[s0 + bd, t0 + bd], [s1 - bd, t0 + bd], [s1 - bd, t1 - bd], [s0 + bd, t1 - bd], [(s0 + s1) / 2, t0 + bd], [(s0 + s1) / 2, t1 - bd]])
    qcaixa(ctx, Q, s - 0.05, s + 0.05, t - 0.05, t + 0.05, y + h - 0.034, y + h - 0.03, { todas: null, topo: lisa('#141414') });
  const bolas = ['#f3f1e7', '#e2c21e', '#1f4fb0', '#c8342b', '#4a2a7a', '#e07b1a', '#1f7a3a', '#7a1f1f', '#141414'];
  const B = ctx.B;
  bolas.forEach((c, i) => {
    const s = s0 + (s1 - s0) * (0.3 + 0.07 * (i % 3) + (i === 0 ? -0.15 : 0.12)), t = (t0 + t1) / 2 + ((i % 3) - 1) * 0.07 + (i > 5 ? 0.12 : i > 2 ? 0.06 : 0);
    const [cx, cz] = Q.pt(s, t), r = 0.028, yb = y + h - 0.035;
    B.pintar(c);
    B.torno(cx, cz, [[0.001, yb], [r * 0.87, yb + r * 0.5], [r, yb + r], [r * 0.87, yb + r * 1.5], [0.001, yb + 2 * r]], 6, 'lisa');
  });
  B.pintar(null);
  const tc = (t0 + t1) / 2 - 0.25;
  qcaixa(ctx, Q, s0 + 0.35, s0 + 1.75, tc - 0.012, tc + 0.012, y + h - 0.02, y + h + 0.004, { todas: lisa('#c9a46b') });
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
/* a lojinha: a mesa com a camisa dobrada em pilha e a arara com três */
function lojinha(ctx, Q, s, D) {
  const t1 = D - 0.1, t0 = t1 - 0.6, a0 = s - 1.0, a1 = s + 0.4;
  mesa(ctx, Q, a0, a1, t0, t1, 0.75, BRANCO, '#c9cbcc');
  const cores = [ctx.c1, ctx.c2, ctx.c1, ctx.c3];
  cores.forEach((c, i) => {
    const b = a0 + 0.12 + i * 0.32;
    for (let k = 0; k < 3; k++) qcaixa(ctx, Q, b, b + 0.28, t0 + 0.14, t0 + 0.44, PISO + 0.75 + k * 0.035, PISO + 0.78 + k * 0.035, { todas: lisa(c) });
  });
  /* a arara: dois pés, a barra e as três camisas penduradas */
  const r0 = s + 0.6, r1 = s + 1.6, tm = D - 0.4;
  for (const r of [r0, r1]) qcaixa(ctx, Q, r - 0.02, r + 0.02, tm - 0.02, tm + 0.02, PISO, PISO + 1.6, { todas: lisa('#9aa0a4'), base: null });
  qcaixa(ctx, Q, r0, r1, tm - 0.015, tm + 0.015, PISO + 1.58, PISO + 1.61, { todas: lisa('#9aa0a4') });
  [ctx.c1, ctx.c2, ctx.c1].forEach((c, i) => {
    const m = r0 + 0.2 + i * 0.3;
    qcaixa(ctx, Q, m - 0.12, m + 0.12, tm - 0.012, tm + 0.012, PISO + 0.95, PISO + 1.52, { todas: lisa(viva(c)) });
    qcaixa(ctx, Q, m - 0.2, m + 0.2, tm - 0.012, tm + 0.012, PISO + 1.36, PISO + 1.52, { todas: lisa(viva(c)) });
  });
  ctx.marca(...Q.ret(a0, r1, t0, t1), ctx.c1);
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
/* o mastro com a bandeira nas três cores, o pano ao longo de `dir` */
function mastroComBandeira(ctx, x, z, y0, alt, dx, dz, cores) {
  const B = ctx.B;
  B.pintar('#c9ccce');
  B.torno(x, z, [[0.04, y0], [0.03, y0 + alt], [0.05, y0 + alt + 0.04], [0.001, y0 + alt + 0.1]], 8, 'lisa');
  B.pintar(null);
  const larg = 1.3, h = 0.84, topo = y0 + alt - 0.05;
  const F = B.plano([x + dx * 0.04, topo - h, z + dz * 0.04], [dx, 0, dz], [0, 1, 0]);
  [cores.cor, cores.cor2, cores.cor3].forEach((c, i) =>
    B.esticar(F, 0, larg, h - (i + 1) * h / 3, h - i * h / 3, 'lisa', { tinta: viva(c) }));
}

/* =======================================================
   CADA CÔMODO, MOBILIADO CONFORME O QUE ELE É
   ======================================================= */
/* a zona da porta: a folha abre pra dentro e ali ninguém põe móvel */
const livreDaPorta = Q => [Q.pc - Q.pw / 2 - 0.15, Q.pc + Q.pw / 2 + 0.15];
const MOBILIA = {
  secretaria(ctx, Q) {
    const { W, D } = Q, [p0, p1] = livreDaPorta(Q);
    /* a mesa de atendimento de frente pra porta: quem trabalha fica
       entre ela e a fachada, quem chega senta do lado de cá. A FOLHA DA
       PORTA abre pra dentro, presa do lado esquerdo, e a ponta dela
       para a 1,5 m da porta: a mesa e as duas cadeiras de quem chega
       vão pro lado direito, a um metro da ponta da folha (quando as
       cadeiras ficavam junto dela, o caminho pro fundo da sala era de
       55 cm), e atrás da mesa ficam 70 cm pra quem trabalha */
    const ponta = Q.pc - Q.pw / 2 + 0.26;
    const m1 = W - 0.25, m0 = Math.max(ponta + 0.8, m1 - 1.5);
    mesa(ctx, Q, m0, m1, D - 1.4, D - 0.7, 0.75, MADEIRA_CLARA, '#6b6f73');
    computador(ctx, Q, m0 + 0.45, D - 1.25, PISO + 0.75, '+t');
    papeis(ctx, Q, m1 - 0.35, D - 1.1, PISO + 0.75);
    cadeiraEscritorio(ctx, Q, (m0 + m1) / 2, D - 0.36, '+t');
    const c0 = Math.max(m0 + 0.35, ponta + 1.0 + 0.21);
    cadeira(ctx, Q, c0, D - 1.87, '-t', '#2d62c8');
    if (m1 - 0.35 - c0 > 0.6) cadeira(ctx, Q, m1 - 0.35, D - 1.87, '-t', '#2d62c8');
    arquivo(ctx, Q, 0.08, 0.58, D - 0.55, D - 0.08, '-t');
    estanteAco(ctx, Q, 0.05, 0.45, 1.75, Math.min(D - 0.7, 2.75), 1.9, 5, (i, a0, a1, b0, b1, y) => {
      const cores = ['#1f4fb0', '#c8342b', '#1f7a3a', '#e0a52a', '#5a5f66'];
      for (let k = 0; b0 + (k + 1) * 0.1 <= b1; k++)
        qcaixa(ctx, Q, a0, a1 - 0.05, b0 + k * 0.1, b0 + k * 0.1 + 0.075, y, y + 0.3, { todas: lisa(cores[(i + k) % 5]), base: null });
    });
    mural(ctx, Q, '-t', p1 + 0.15, Math.min(W - 0.15, p1 + 1.15), PISO + 1.3, PISO + 2.0);
    bebedouro(ctx, Q, 0.3, 0.35);
    arInterno(ctx, Q, '+s', 1.2, PISO + 2.25);
    bandeiraParede(ctx, Q, '+s', 0.25, 0.95, PISO + 1.35, PISO + 1.95, ctx.cores);
  },
  bar(ctx, Q) {
    const { W, D } = Q, [p0, p1] = livreDaPorta(Q);
    /* o balcão por trás da janela de balcão, a prateleira de garrafa e o
       armário na parede do lado, a geladeira e o freezer no fundo */
    qcaixa(ctx, Q, p1 + 0.02, W, 0.02, 0.62, PISO, PISO + 1.0, { todas: lisa(ctx.c2), topo: lisa(GRANITO), base: null }, ctx.c2);
    naParede(ctx, Q, '+s', 1.4, D - 0.1, PISO + 1.15, PISO + 2.05, 0.3, { todas: lisa('#5b3b22'), frente: { k: 'prateleira', modo: 'esticar' } });
    naParede(ctx, Q, '+s', 1.4, D - 0.1, PISO, PISO + 0.9, 0.5, { todas: lisa(MADEIRA), topo: lisa(GRANITO), frente: { k: 'armario', modo: 'esticar' } }, MADEIRA);
    geladeira(ctx, Q, 0.08, 0.8, D - 0.72, D - 0.06, '-t');
    freezer(ctx, Q, 0.08, 1.3, D - 1.52, D - 0.86, '+s');
    engradados(ctx, Q, 0.08, 0.2, 3);
    engradados(ctx, Q, 0.52, 0.2, 2);
    engradados(ctx, Q, 0.08, 0.56, 2);
    /* do lado do salão, as banquetas no balcão */
    for (let s = p1 + 0.3; s <= W - 0.2; s += 0.5) banqueta(ctx, Q, s, -ctx.PAR_M - 0.35, ctx.c1);
  },
  banheiro(ctx, Q) {
    const { W, D } = Q, [p0, p1] = livreDaPorta(Q);
    /* dois boxes contra a fachada, com a divisória e a porta de alumínio:
       0,90 × 1,25 m (eram 1,00 × 1,45 — a quina do box ficava a 65 cm da
       ponta da folha da porta, que abre pra dentro, e o caminho pros
       mictórios era de raspão) */
    const bx = 0.9, t0 = D - 1.25, fim = W, ini = W - 2 * bx;
    for (let i = 0; i < 2; i++) {
      const a = ini + i * bx;
      vaso(ctx, Q, a + bx / 2, D - 0.42, '+t');
      if (i === 0) qbloco(ctx, Q, a - 0.02, a + 0.02, t0, D, PISO + 0.12, PISO + 1.95, '#cfd6d8', '#cfd6d8');
      qbloco(ctx, Q, a + bx - 0.02, a + bx + 0.02, t0, D, PISO + 0.12, PISO + 1.95, '#cfd6d8');
      qcaixa(ctx, Q, a + 0.02, a + 0.12, t0 - 0.02, t0 + 0.02, PISO + 0.12, PISO + 1.95, { todas: lisa('#cfd6d8') });
      qcaixa(ctx, Q, a + 0.12, a + bx - 0.02, t0 - 0.015, t0 + 0.015, PISO + 0.14, PISO + 1.94, { todas: lisa('#e3e7e8'), '-t': { k: 'porta_alu', modo: 'esticar' }, '+t': { k: 'porta_alu', modo: 'esticar' } });
    }
    ctx.marca(...Q.ret(ini, fim, t0, D), '#dfe3e4');
    mictorio(ctx, Q, '-s', D - 1.95);
    mictorio(ctx, Q, '-s', D - 1.3);
    if (p1 + 1.2 < W) {
      pia(ctx, Q, '-t', p1 + 0.1, Math.min(W - 0.1, p1 + 1.3), 2);
      espelho(ctx, Q, '-t', p1 + 0.15, Math.min(W - 0.15, p1 + 1.25), PISO + 1.2, PISO + 1.85);
    } else {
      pia(ctx, Q, '+s', 0.3, 1.5, 2);
      espelho(ctx, Q, '+s', 0.35, 1.45, PISO + 1.2, PISO + 1.85);
    }
    const [cx, cz] = Q.pt(0.35, 0.4);
    ctx.B.pintar('#6d7377');
    ctx.B.torno(cx, cz, [[0.14, PISO], [0.16, PISO + 0.45], [0.001, PISO + 0.46]], 8, 'lisa');
    ctx.B.pintar(null);
  },
  almoxarifado(ctx, Q) {
    const { W, D } = Q, cores = ctx.cores;
    const itens = (i, a0, a1, b0, b1, y) => {
      if (i === 0) { surdo(ctx, (a0 + a1) / 2 - 0.2, (b0 + b1) / 2, y, 0.19, 0.42, ctx.c1, Q); surdo(ctx, (a0 + a1) / 2 + 0.25, (b0 + b1) / 2, y, 0.16, 0.36, ctx.c3, Q); return; }
      if (i === 2) { bandeiraEnrolada(ctx, Q, a0, a1, b0, b0 + 0.18, y, ctx.c1, ctx.c2); bandeiraEnrolada(ctx, Q, a0, a1, b1 - 0.18, b1, y, ctx.c2, ctx.c1); return; }
      for (let s = a0; s + 0.34 <= a1; s += 0.38) caixaPapelao(ctx, Q, s, s + 0.34, b0, b1 - 0.02, y, 0.26 + ((i + s * 7) % 3) * 0.04);
    };
    /* uma estante de cada lado da janela, e outra na parede da direita */
    const jw = 0.3;
    estanteAco(ctx, Q, 0.05, Math.max(0.9, W / 2 - jw - 0.25), D - 0.5, D - 0.05, 2.0, 4, itens);
    estanteAco(ctx, Q, Math.min(W - 0.9, W / 2 + jw + 0.25), W - 0.05, D - 0.5, D - 0.05, 2.0, 4, itens);
    estanteAco(ctx, Q, W - 0.5, W - 0.05, 1.8, D - 0.6, 2.0, 4, itens);
    for (const [s, t, r, h, c] of [[0.35, 1.9, 0.28, 0.55, ctx.c1], [0.95, 1.95, 0.25, 0.5, ctx.c3], [0.4, 2.45, 0.22, 0.45, ctx.c2]]) surdo(ctx, s, t, PISO, r, h, c, Q);
    surdo(ctx, 0.35, 1.9, PISO + 0.555, 0.2, 0.4, ctx.c2, Q);
    /* os mastros encostados no canto e a bandeira dobrada no chão */
    for (let k = 0; k < 4; k++) qcaixa(ctx, Q, 0.08 + k * 0.05, 0.11 + k * 0.05, 0.1, 0.13, PISO, PISO + 2.3 - k * 0.1, { todas: lisa('#caa77a'), base: null });
    bandeiraEnrolada(ctx, Q, 0.25, 1.05, 1.2, 1.42, PISO, cores.cor2 ? ctx.c2 : ctx.c1, ctx.c1);
  },
  corredor(ctx, Q) {
    const { W, D } = Q;
    qcaixa(ctx, Q, 0.3, W - 0.3, 0.1, 0.8, PISO, PISO + 0.012, { todas: lisa('#4a3f36'), base: null });
    extintor(ctx, Q, '-s', 1.2);
    mural(ctx, Q, '+s', 0.8, Math.min(D - 0.4, 2.0), PISO + 1.3, PISO + 2.0);
  },
  salao(ctx, Q) {
    const { W, D } = Q, P = ctx.P;
    /* as portas das salas nas duas paredes compridas, pra não pôr nada
       na frente delas */
    const portasF = ctx.portasDoSalao.frente, portasB = ctx.portasDoSalao.fundo;
    /* a sinuca na ponta oeste, a mesa comprida na ponta leste */
    const sw = Math.min(2.4, W * 0.14);
    sinuca(ctx, Q, 0.9, 0.9 + sw, D / 2 - 0.65, D / 2 + 0.65);
    const m1 = W - 0.9, m0 = m1 - Math.min(3.4, W * 0.18), mt0 = D / 2 - 0.4, mt1 = D / 2 + 0.4;
    mesa(ctx, Q, m0, m1, mt0, mt1, 0.74, BRANCO, '#c9cbcc');
    for (let s = m0 + 0.35; s <= m1 - 0.3; s += 0.62) {
      cadeira(ctx, Q, s, mt0 - 0.38, '-t', BRANCO);
      cadeira(ctx, Q, s, mt1 + 0.38, '+t', BRANCO);
    }
    /* a bateria no pé da faixa, na parede do fundo, entre duas portas */
    const vaoFundo = ctx.maiorVao(portasB, 0.6, W - 0.6);
    if (vaoFundo) {
      const [f0, f1] = vaoFundo, fm = (f0 + f1) / 2;
      const cores = [ctx.c1, ctx.c2, ctx.c1, ctx.c3];
      [[-0.9, 0.3, 0.62], [-0.3, 0.27, 0.55], [0.3, 0.27, 0.55], [0.9, 0.24, 0.5]].forEach(([ds, r, h], k) => {
        const s = fm + ds, t = D - 0.55;
        for (const [a, b] of [[-1, -1], [1, -1], [0, 1]]) qcaixa(ctx, Q, s + a * r * 0.7 - 0.012, s + a * r * 0.7 + 0.012, t + b * r * 0.7 - 0.012, t + b * r * 0.7 + 0.012, PISO, PISO + 0.35, { todas: lisa('#3a3d40'), base: null });
        surdo(ctx, s, t, PISO + 0.35, r, h, cores[k], Q);
      });
      ctx.faixa('+t', fm, PISO + 1.45, Math.min(4.6, f1 - f0 - 0.4), 0.85, Q);
    }
    /* a TV na parede da frente, perto da sinuca, e os bancos nos
       lados curtos, onde não há porta */
    const vaoTV = ctx.maiorVao(portasF.filter(p => p[0] < W / 2), 0.4, W / 2);
    if (vaoTV) tv(ctx, Q, '-t', (vaoTV[0] + vaoTV[1]) / 2, PISO + 1.75, 1.2);
    banco(ctx, Q, 0.05, 0.5, 0.9, Math.min(D - 0.9, 3.1));
    banco(ctx, Q, W - 0.5, W - 0.05, 0.9, Math.min(D - 0.9, 3.1));
    pilhaCadeiras(ctx, Q, W - 0.4, D - 0.4, 6, BRANCO, '+t');
    pilhaCadeiras(ctx, Q, W - 0.9, D - 0.4, 4, BRANCO, '+t');
    /* o pebolim entre a sinuca e o corredor */
    pebolim(ctx, Q, Math.min(W * 0.3, 0.9 + sw + 1.1), D / 2 - 0.36, ctx.c1, ctx.c2);
    /* a lojinha da torcida no outro vão da parede do fundo: a mesa com a
       camisa dobrada e a arara com três penduradas */
    const vaos = [];
    let a = 0.6;
    for (const [p0, p1] of portasB.slice().sort((p, q) => p[0] - q[0]).concat([[W - 0.6, W - 0.6]])) { if (p0 - a > 2.2) vaos.push([a + 0.25, p0 - 0.25]); a = p1; }
    const loja = vaos.filter(v => !vaoFundo || Math.abs((v[0] + v[1]) / 2 - (vaoFundo[0] + vaoFundo[1]) / 2) > 1).sort((p, q) => (q[1] - q[0]) - (p[1] - p[0]))[0];
    if (loja) lojinha(ctx, Q, (loja[0] + loja[1]) / 2, D);
    /* a bandeira pregada na parede da frente, no vão entre duas salas do lado leste */
    const vaoBand = ctx.maiorVao(portasF.filter(p => p[0] > W / 2), W / 2, W - 0.5);
    if (vaoBand) bandeiraParede(ctx, Q, '-t', (vaoBand[0] + vaoBand[1]) / 2 - 1.1, (vaoBand[0] + vaoBand[1]) / 2 + 1.1, PISO + 1.45, PISO + 2.45, ctx.cores);
  },
  alojamento(ctx, Q) {
    const { W, D } = Q, [p0, p1] = livreDaPorta(Q), c = ctx.cores;
    beliche(ctx, Q, 0.08, 2.08, D - 0.98, D - 0.06, '-s', ctx.c1, ctx.c2);
    beliche(ctx, Q, W - 2.08, W - 0.08, D - 0.98, D - 0.06, '+s', ctx.c2, ctx.c1);
    beliche(ctx, Q, 0.06, 1.0, 0.1, Math.min(2.1, D - 1.1), '-t', ctx.c3, ctx.c1);
    armarioAco(ctx, Q, 2.3, Math.min(W - 2.3, 4.1), D - 0.5, D - 0.05, 1.8, '-t', 4);
    colchao(ctx, Q, W - 0.98, W - 0.1, 0.2, 2.1, PISO, '+t', ctx.c3);
    colchao(ctx, Q, W - 1.9, W - 1.02, 0.2, 2.1, PISO, '+t', ctx.c2);
    for (const [s, t, cor] of [[0.5, D - 0.52, '#3d5a3a'], [W - 1.3, D - 0.5, '#3a3f58']])
      qcaixa(ctx, Q, s, s + 0.35, t - 0.12, t + 0.12, PISO + 0.43, PISO + 0.68, { todas: lisa(cor), base: null });
    if (p0 > 2.2) arInterno(ctx, Q, '-t', 1.2, PISO + 2.3);
  },
  diretoria(ctx, Q) {
    const { W, D } = Q, [p0, p1] = livreDaPorta(Q), P = ctx.P;
    /* A MESA DA PLANTA, a do diretor: 1,40 × 0,70 perto do fundo, do lado
       oeste (é ela que bloqueia a caminhada; a planta conta da divisória
       de fora, meia parede antes do cômodo). O computador, a cadeira de
       escritório entre ela e a parede, as duas de quem vem falar com ele
       e a estante de troféus na parede do lado */
    const ms0 = u2(14 - P.PAR / 2), ms1 = ms0 + u2(mm(1.40)), mt1 = D - u2(12), mt0 = mt1 - u2(mm(0.70));
    mesa(ctx, Q, ms0, ms1, mt0, mt1, 0.75, MADEIRA, '#3a2618');
    computador(ctx, Q, ms0 + 0.4, mt0 + 0.3, PISO + 0.75, '+t');
    papeis(ctx, Q, ms1 - 0.35, (mt0 + mt1) / 2, PISO + 0.75);
    trofeu(ctx, Q, ms1 - 0.12, mt0 + 0.12, PISO + 0.75, 0.3);
    cadeiraEscritorio(ctx, Q, (ms0 + ms1) / 2, D - 0.31, '+t');
    cadeira(ctx, Q, ms0 + 0.4, mt0 - 0.36, '-t', '#2b2b2e');
    cadeira(ctx, Q, ms1 - 0.4, mt0 - 0.36, '-t', '#2b2b2e');
    const e1 = mt0 - 0.1;
    qcaixa(ctx, Q, 0.05, 0.45, 0.15, e1, PISO, PISO + 1.9, { todas: lisa(MADEIRA), base: null }, MADEIRA);
    for (let i = 0; i < 4; i++) {
      const y = PISO + 0.35 + i * 0.42;
      qcaixa(ctx, Q, 0.45, 0.47, 0.2, e1 - 0.05, y - 0.02, y, { todas: lisa('#8a6a48') });
      for (let t = 0.4 + (i % 2) * 0.15; t < e1 - 0.15; t += 0.38) trofeu(ctx, Q, 0.25, t, y, 0.26 + ((i * 3 + t * 5) % 3) * 0.05);
    }
    /* a mesa de reunião na metade que sobra, comprida no fundo do
       cômodo, com as seis cadeiras; a TV na parede do lado */
    const rs0 = p1 + 0.55, rs1 = Math.min(W - 0.75, rs0 + 0.9), rt0 = 0.75, rt1 = Math.min(D - 0.75, rt0 + 1.7);
    if (rs1 - rs0 > 0.6) {
      mesa(ctx, Q, rs0, rs1, rt0, rt1, 0.75, MADEIRA, '#3a2618');
      for (let t = rt0 + 0.4; t <= rt1 - 0.35; t += 0.75) {
        cadeira(ctx, Q, rs0 - 0.36, t, '-s', '#2b2b2e');
        cadeira(ctx, Q, rs1 + 0.36, t, '+s', '#2b2b2e');
      }
      cadeira(ctx, Q, (rs0 + rs1) / 2, rt1 + 0.36, '+t', '#2b2b2e');
      cadeira(ctx, Q, (rs0 + rs1) / 2, rt0 - 0.36, '-t', '#2b2b2e');
      papeis(ctx, Q, (rs0 + rs1) / 2, (rt0 + rt1) / 2, PISO + 0.75);
      tv(ctx, Q, '+s', (rt0 + rt1) / 2, PISO + 1.45, 1.1);
    }
    /* a bandeira atrás do diretor e o ar na mesma parede, onde a
       condensadora está do lado de fora */
    bandeiraParede(ctx, Q, '+t', 0.35, Math.min(ms1 + 0.1, 2.0), PISO + 1.25, PISO + 2.2, ctx.cores);
    arInterno(ctx, Q, '+t', 2.6, PISO + 2.3);
  },
  deposito(ctx, Q) {
    const { W, D } = Q, [p0, p1] = livreDaPorta(Q);
    const itens = (i, a0, a1, b0, b1, y) => {
      if (i % 2) { bandeiraEnrolada(ctx, Q, a0, a1, b0, b0 + 0.2, y, ctx.c1, ctx.c2); caixaPapelao(ctx, Q, a0, a0 + 0.38, b1 - 0.2, b1, y, 0.2); return; }
      for (let s = a0; s + 0.36 <= a1; s += 0.4) caixaPapelao(ctx, Q, s, s + 0.36, b0, b1 - 0.02, y, 0.24 + ((i + s * 5) % 3) * 0.05);
    };
    for (const [a, b] of [[0.08, 1.28], [1.36, 2.56], [W - 2.56, W - 1.36], [W - 1.28, W - 0.08]])
      estanteAco(ctx, Q, a, b, D - 0.5, D - 0.05, 2.0, 4, itens);
    /* O ARMÁRIO DA PLANTA (é ele que bloqueia a caminhada): a 8 da parede
       do lado, junto da parede do salão, com os troféus velhos em cima */
    const ha = u2(mm(2.00));
    armario(ctx, Q, W - u2(8 + mm(0.45)), W - u2(8), u2(4), u2(4 + mm(1.00)), ha, '-s', ACO, 2);
    for (let k = 0; k < 3; k++) trofeu(ctx, Q, W - u2(6 + mm(0.40) / 2 + 2), u2(6) + 0.14 + k * 0.28, PISO + ha, 0.24 + (k % 2) * 0.06);
    /* a faixa dobrada, o colchão empilhado, a caixa e o bumbo velho */
    for (let k = 0; k < 3; k++) bandeiraEnrolada(ctx, Q, 0.3, 1.5, 1.25 + k * 0.02, 1.95 - k * 0.02, PISO + k * 0.12, [ctx.c1, ctx.c2, ctx.c3][k], ctx.c2);
    for (let k = 0; k < 4; k++) colchao(ctx, Q, W - 2.5 + k * 0.02, W - 0.7 - k * 0.02, 1.35, 2.25, PISO + k * 0.14, '+s', AZUL_COLCHAO, 0.13);
    caixaPapelao(ctx, Q, Math.max(1.6, p0 - 0.62), Math.max(2.02, p0 - 0.2), 2.1, 2.5, PISO, 0.38);
    surdo(ctx, Math.max(1.9, p0 - 0.45), 1.15, PISO, 0.3, 0.6, '#6d5a44', Q);
  },
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
    const ms = Math.min(W - 0.9, 3.05), mt = D - 2.3;
    mesa(ctx, Q, ms - 0.45, ms + 0.45, mt - 0.45, mt + 0.45, 0.72, BRANCO, '#d4d6d6');
    cadeira(ctx, Q, ms - 0.72, mt, '-s', BRANCO);
    cadeira(ctx, Q, ms + 0.72, mt, '+s', BRANCO);
    cadeira(ctx, Q, ms, mt + 0.72, '+t', BRANCO);
    varal(ctx, Q, 2.6, 1.0, 2.9);
    banco(ctx, Q, Math.min(W - 2.4, 4.5), Math.min(W - 0.3, 6.6), D - 0.55, D - 0.12);
    for (const [s, t, h] of [[W - 0.55, 0.35, 0.45], [W - 0.95, 0.4, 0.34], [W - 0.62, 0.85, 0.3]]) caixaPapelao(ctx, Q, s, s + h, t, t + h, PISO, h);
  },
  patrimonio(ctx, Q) {
    const { W, D } = Q, [p0, p1] = livreDaPorta(Q);
    /* o da planta: o armário comprido na parede leste (com os troféus em
       cima), a estante de aço na fachada, as caixas */
    const ha = u2(mm(2.00));
    armario(ctx, Q, u2(6), W - u2(6), D - u2(2 + mm(0.45)), D - u2(2), ha, '-t', '#6f7a82', 4);
    for (let s = 0.5; s < W - 0.4; s += 0.42) trofeu(ctx, Q, s, D - u2(4 + mm(0.40) / 2), PISO + ha, 0.28 + ((s * 7) % 3) * 0.05);
    estanteAco(ctx, Q, u2(2), u2(2 + mm(0.38)), u2(4), D - u2(28), u2(mm(1.90)), 4, (i, a0, a1, b0, b1, y) => {
      if (i === 1) { bandeiraEnrolada(ctx, Q, a0, a1, b0, b0 + 0.9, y, ctx.c1, ctx.c2); bandeiraEnrolada(ctx, Q, a0, a1, b0 + 1.0, b0 + 1.9, y, ctx.c2, ctx.c1); return; }
      for (let t = b0; t + 0.32 <= b1; t += 0.36) caixaPapelao(ctx, Q, a0, a1, t, t + 0.32, y, 0.24);
    });
    surdo(ctx, 1.05, 2.35, PISO, 0.3, 0.6, ctx.c1, Q);
    surdo(ctx, 1.05, 2.35, PISO + 0.6, 0.26, 0.5, ctx.c3, Q);
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
    mural(ctx, Q, '-s', 1.34, 2.34, PISO + 1.4, PISO + 2.1);
    bandeiraParede(ctx, Q, '-s', 2.55, Math.min(D - 0.3, 4.1), PISO + 1.3, PISO + 2.05, ctx.cores);
    arInterno(ctx, Q, '+s', D - 0.95, PISO + 2.15);
  }
};
const u2 = v => v / M;
const mm = v => Math.round(v * M);     // o `m()` da planta: metro pra unidade inteira

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
  if (reg === 'fora') return externa();
  if (reg.tipo === 'patio') return w.fachadaPatio ? externa() : [[0, H, { k: 'bloco', tinta: '#d8d4ca' }]];
  switch (reg.tipo) {
    case 'salao': return [[0, 1.15, lisa(c1)], [1.15, 1.25, lisa(c2)], [1.25, H, lisa(CREME)]];
    case 'corredor': return [[0, 1.0, lisa(c1)], [1.0, 1.08, lisa(c2)], [1.08, H, lisa(CREME)]];
    case 'banheiro': return [[0, 1.6, { k: 'piso_bar' }], [1.6, H, lisa(BRANCO)]];
    case 'bar': return [[0, 1.1, { k: 'piso_bar' }], [1.1, 1.16, lisa(c1)], [1.16, H, lisa(CREME)]];
    case 'secretaria': case 'diretoria': case 'presidencia': return [[0, 0.1, lisa(RODAPE)], [0.1, H, lisa(PAREDE_SALA)]];
    case 'alojamento': return [[0, 0.1, lisa(RODAPE)], [0.1, H, lisa('#e3dcc8')]];
    default: return [[0, H, { k: 'crua' }]];
  }
}
function pisoDe(ctx, c) {
  switch (c.tipo) {
    case 'salao': return { k: 'lisa', tinta: SALAO };
    case 'patio': case 'almoxarifado': case 'deposito': case 'patrimonio': return { k: 'laje', tinta: '#c2beb4' };
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
  if (v.tipo === 'balcao') {
    if (X) B.caixa(v.a0, v.a1, v.b0, v.b0 + 0.04, C0 - 0.18, C1 + 0.12, { todas: lisa(MADEIRA) });
    else B.caixa(C0 - 0.18, C1 + 0.12, v.b0, v.b0 + 0.04, v.a0, v.a1, { todas: lisa(MADEIRA) });
    return;
  }
  /* o chão do vão (a soleira) */
  const pts = X ? [[v.a0, C1], [v.a1, C1], [v.a1, C0], [v.a0, C0]] : [[C0, v.a1], [C1, v.a1], [C1, v.a0], [C0, v.a0]];
  B.tampa(pts, PISO, 'laje_borda', false, { tinta: '#cbc6ba' });
  const pt = ctx.portas.find(p => p.parede === w && Math.abs(p.c - (v.a0 + v.a1) / 2) < 1e-3);
  if (!pt) return;
  const sentido = pt.abre;
  /* o giro da folha: fechada ao longo da parede, aberta pra `sentido`
     (o mesmo da planta); presa na face pra onde ela abre */
  const aberta = ctx.aberta, ang = aberta ? (v.tipo === 'portao' ? 1.25 : 1.4) : 0;
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
    for (const [h, dirF] of [[g0, 1], [g1, -1]]) folha(ctx, X, h, face, dirF, sentido, larg, hp, ang, 'jan2');
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
  folha(ctx, X, v.a0, face, 1, sentido, v.a1 - v.a0, hp, ang, 'porta_madeira');
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
    if (t.agua === 'duas') {
      /* duas águas, a cumeeira paralela à fachada: a da frente some atrás
         da platibanda, a de trás apoia na parede do fundo */
      const zm = (z0 + z1) / 2, yf = hE + 0.1, yr = hE + 0.58, yb = hE + 0.02;
      for (const [za, ya, zb, yb2] of [[z0, yf, zm, yr], [z1, yb, zm, yr]]) {
        const dz = zb - za, dy = yb2 - ya, L = Math.hypot(dz, dy);
        T.ladrilhar(T.plano([x0, ya, za], [1, 0, 0], [0, dy / L, dz / L]), T.ret(0, x1 - x0, 0, L), 'fibro');
      }
      T.caixa(x0, x1, yr - 0.02, yr + 0.08, zm - 0.12, zm + 0.12, { todas: { k: 'laje_borda', tinta: '#9da1a3' }, base: null });
      T.caixa(x0, x1, yb - 0.14, yb, z1 - 0.1, z1 + 0.02, { todas: 'calha' });
      /* os oitões nas paredes do lado, do alto da parede até o telhado */
      for (const [xa, xb] of [[0, u(P.PAR)], [u(P.L - P.PAR), u(P.L)]]) {
        const oitao = [[z0, hE], [z0, yf], [zm, yr], [z1, yb], [z1, hE]];
        for (const xf of [xa, xb]) {
          const F = T.plano([xf, 0, 0], [0, 0, 1], [0, 1, 0]);
          T.ladrilhar(F, oitao, 'lisa', { tinta: xf === 0 || xf === u(P.L) ? ctx.c1 : CLARO });
        }
      }
    } else {
      /* uma água, caindo do pátio pro lado de lá */
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
  const B = so2d ? construtorMudo() : Construtor('casas'), G = so2d ? construtorMudo() : Construtor('grades');
  const Tt = so2d ? construtorMudo() : Construtor('casas');
  const u = v => v / M;
  const conv = r => ({ ...r, x0: u(r.u0), x1: u(r.u1), z0: u(r.v0), z1: u(r.v1) });
  const paredes = P.paredes.map(w => ({ ...conv(w), orig: w, ao: w.ao, h: u(w.altModelo || w.alt), fachada: w.fachada, fachadaPatio: w.fachadaPatio,
                                        vaos: w.vaos.map(v => ({ ...v, a0: u(v.a0), a1: u(v.a1), b0: u(v.b0), b1: u(v.b1) })) }));
  const comodos = P.comodos.map(c => ({ ...conv(c), porta: c.porta ? { lado: c.porta.lado, c: u(c.porta.c), w: u(c.porta.w) } : null }));
  const paredeDe = new Map(P.paredes.map((w, i) => [w, paredes[i]]));
  const portas = P.portas.map(p => ({ ...p, c: u(p.c), w: u(p.w), parede: paredeDe.get(p.parede) }));
  const dentro = (r, x, z) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1;
  const marcas = [], placas = [];
  const ctx = {
    B, G, T: Tt, P, u, aberta, cores: cor, c1: cor.cor, c2: cor.cor2, c3: cor.cor3, paredes, comodos, portas, PAR_M: u(P.PAR),
    regiao(x, z) {
      for (const c of comodos) if (dentro(c, x, z)) return c;
      for (const w of paredes) if (dentro(w, x, z)) return 'parede';
      return 'fora';
    },
    marca(x0, x1, z0, z1, c) { marcas.push({ x0, x1, z0, z1, cor: c, tipo: 'movel' }); },
    /* a faixa da torcida com o nome, pregada na parede `lado` do cômodo */
    faixa(lado, a, y, larg, alt, Q) {
      if (!T0) return;
      const off = 0.03, [s, t] = lado === '+t' ? [a, Q.D - off] : lado === '-t' ? [a, off] : lado === '-s' ? [off, a] : [Q.W - off, a];
      const n = { '+t': '-t', '-t': '+t', '-s': '+s', '+s': '-s' }[lado];
      const [x, z] = Q.pt(s, t), [nx, nz] = VEC[Q.d(n)];
      placas.push({ tipo: 'faixa', texto: T0.nome || T0.sigla, fundo: cor.cor, tinta: legivelSobre(cor.cor, [cor.cor2, cor.cor3]),
                    x, y: y + alt / 2, z, nx, nz, larg, alt });
    },
    maiorVao(lista, a0, a1) {
      const oc = lista.slice().sort((p, q) => p[0] - q[0]);
      let melhor = null, a = a0;
      for (const [p0, p1] of oc.concat([[a1, a1]])) {
        if (p0 - 0.25 - a > (melhor ? melhor[1] - melhor[0] : 0.8)) melhor = [a, p0 - 0.25];
        a = Math.max(a, p1 + 0.25);
      }
      return melhor;
    }
  };

  /* ---- os pisos ---- */
  for (const c of comodos) {
    const f = pisoDe(ctx, c);
    B.tampa([[c.x0, c.z1], [c.x1, c.z1], [c.x1, c.z0], [c.x0, c.z0]], PISO, f.k, false, { tinta: f.tinta });
    marcas.push({ x0: c.x0, x1: c.x1, z0: c.z0, z1: c.z1, cor: f.tinta || '#d8d5cf', tipo: 'piso' });
  }
  /* a calçada da frente, um dedo acima da calçada da rua */
  B.tampa([[0, u(P.F0)], [u(P.L), u(P.F0)], [u(P.L), 0], [0, 0]], 0.08, 'laje', false, { tinta: CIMENTO });
  /* as duas listras da torcida no piso do salão e no fundo do pátio */
  const listra = (x0, x1, z0, z1, tinta) => {
    B.tampa([[x0, z1], [x1, z1], [x1, z0], [x0, z0]], PISO + 0.008, 'lisa', false, { tinta });
    marcas.push({ x0, x1, z0, z1, cor: tinta, tipo: 'piso' });
  };
  if (P.N === 3) {
    const mS = u((P.vF + P.vB) / 2), a = u(P.PAR + 26), b = u(P.L - P.PAR - 26);
    listra(a, b, mS - u(15), mS - u(5), cor.cor2);
    listra(a, b, mS + u(5), mS + u(15), cor.cor3);
  } else {
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

  /* ---- a mobília, cômodo por cômodo (a sede vaga fica vazia) ---- */
  if (aberta) {
    const salao = comodos.find(c => c.tipo === 'salao');
    if (salao) {
      /* as portas que dão no salão, em `s` (ao longo dele) */
      const frente = [], fundo = [];
      for (const p of portas) {
        const w = p.parede;
        if (w.ao !== 'u') continue;
        const a = [p.c - p.w / 2 - salao.x0, p.c + p.w / 2 - salao.x0];
        if (Math.abs(w.z1 - salao.z0) < 1e-3) frente.push(a);
        if (Math.abs(w.z0 - salao.z1) < 1e-3) fundo.push(a);
      }
      const cor0 = comodos.find(c => c.tipo === 'corredor');
      if (cor0) frente.push([cor0.x0 - salao.x0, cor0.x1 - salao.x0]);
      ctx.portasDoSalao = { frente, fundo };
    }
    for (const c of comodos) {
      const f = MOBILIA[c.tipo];
      if (f) f(ctx, quarto(c));
    }
  }

  /* ---- a fachada: mastro, arandelas, o ar do lado de fora ---- */
  const mt = P.mastro;
  if (aberta && mt) mastroComBandeira(ctx, u(mt.u), u(mt.v), u(mt.base), u(mt.alt), 1, 0, cor);
  if (!so2d) {
    const fz = u(P.F0) - 0.01, gl = u(P.g0) - u(8), gr = u(P.g1) + u(8);
    for (const x of [gl, gr]) {
      B.caixa(x - 0.09, x + 0.09, 2.3, 2.52, fz - 0.14, fz, { todas: lisa(PRETO) });
      B.caixa(x - 0.07, x + 0.07, 2.32, 2.46, fz - 0.141, fz - 0.139, { todas: null, tras: lisa('#f3dc8a') });
    }
    telhado3d(ctx);
    const exterior = [];
    if (P.N === 3) {
      const d = comodos.find(c => c.tipo === 'diretoria') || comodos.find(c => c.tipo === 'alojamento');
      if (d) exterior.push(B.plano([d.x0 + 2.2, 1.3, u(P.A) + 0.001], [1, 0, 0], [0, 1, 0]));
    } else {
      const pr = comodos.find(c => c.tipo === 'presidencia');
      if (pr) exterior.push(B.plano([u(P.L) + 0.001, 1.25, pr.z1 - 0.9], [0, 0, -1], [0, 1, 0]));
    }
    if (aberta) for (const F of exterior) arSplit(B, F, 0, 0);
  }

  /* ---- os decalques com texto (quem mostra é quem escreve) ---- */
  const L = u(P.L), zF = u(P.F0) - 0.035, H = u(P.MURO);
  if (T0) {
    /* o nome da torcida na platibanda, em cima da porta (nível 3) ou no
       meio da fachada (nível 1), e os escudos dos dois lados */
    /* nível 3: em cima da porta, acima da faixa da verga; nível 1: no
       trecho das salas, que a porta fica no do pátio */
    const yL = P.N === 3 ? 3.4 : 2.83, alt = P.N === 3 ? 0.7 : 0.66;
    const xL = P.N === 3 ? u(P.eixo) : (u(P.g1) + u(4) + L) / 2;
    const larg = Math.min(P.N === 3 ? 4.2 : (L - u(P.g1) - u(4)) * 0.62, alt * 5.6);
    placas.push({ tipo: 'placa', texto: T0.nome || T0.sigla, fundo: cor.cor2, tinta: legivel(cor.cor2), x: xL, y: yL, z: zF, nx: 0, nz: -1, larg, alt });
    const esc = alt * 0.95, dx = larg / 2 + esc * 0.8;
    placas.push({ tipo: 'escudo', forma: 'bola', cor: cor.cor, cor2: cor.cor2, texto: T0.sigla, corTexto: legivelSobre(cor.cor, [cor.cor2, cor.cor3]),
                  img: T0.escudo || null, x: xL - dx, y: yL, z: zF, nx: 0, nz: -1, larg: esc, alt: esc });
    /* o do clube, nas duas cores dele; sem os clubes carregados, nas duas
       últimas da torcida (branco sobre a parede de reboco some) */
    const cc1 = T0.clubeCor || cor.cor2, cc2 = T0.clubeCor ? T0.clubeCor2 || cor.cor2 : cor.cor3;
    if (T0.clubeSigla || T0.escudoClube) placas.push({ tipo: 'escudo', forma: 'diagonal', cor: cc1, cor2: cc2, texto: T0.clubeSigla || '',
                                     corTexto: '#ffffff', img: T0.escudoClube || null, x: xL + dx, y: yL, z: zF, nx: 0, nz: -1, larg: esc * 0.85, alt: esc * 0.85 });
    /* e um escudo em cada parede do lado, que também é parede de fora */
    const zm = P.N === 3 ? u((P.vF + P.vB) / 2) : u(P.A / 2);
    for (const [x, nx] of [[-0.035, -1], [L + 0.035, 1]])
      placas.push({ tipo: 'escudo', forma: 'bola', cor: cor.cor, cor2: cor.cor2, texto: T0.sigla, corTexto: legivelSobre(cor.cor, [cor.cor2, cor.cor3]),
                    img: T0.escudo || null, x, y: 1.9, z: zm - (P.N === 3 ? 1.9 : 0), nx, nz: 0, larg: 0.8, alt: 0.8 });
    /* A PLACA DE CADA SALA, na verga, do lado de quem chega (a planta
       põe ali o mesmo letreiro) */
    for (const p of portas) {
      if (!p.nome) continue;
      const w = p.parede, X = w.ao === 'u', sentido = p.abre;
      const c = X ? (sentido > 0 ? w.z0 : w.z1) : (sentido > 0 ? w.x0 : w.x1);
      const off = -sentido * 0.035, vao = w.vaos.find(v => Math.abs((v.a0 + v.a1) / 2 - p.c) < 1e-3), topoVao = vao ? vao.b1 : u(P.ALT_PORTA);
      const hPl = Math.min(u(9), w.h - topoVao - 0.1), lPl = Math.min(hPl * 4.2, p.w + u(10));
      if (hPl < u(4)) continue;
      const [x, z] = X ? [p.c, c + off] : [c + off, p.c];
      const [nx, nz] = X ? [0, -sentido] : [-sentido, 0];
      placas.push({ tipo: 'placa', texto: p.nome, fundo: cor.cor2, tinta: legivel(cor.cor2), x, y: topoVao + 0.05 + hPl / 2, z, nx, nz, larg: lPl, alt: hPl });
    }
  }

  /* ---- do modelo pro mundo ---- */
  const y0 = opc.y0 || 0;
  const noMundo = (x, z) => E.pt(x * M, z * M);
  const bloco = C => {
    const n = C.pos.length / 3;
    if (!n) return null;
    const pos = new Float32Array(n * 3), p = C.pos;
    for (let i = 0; i < n; i++) {
      const [wx, wz] = noMundo(p[3 * i], p[3 * i + 2]);
      pos[3 * i] = wx; pos[3 * i + 1] = y0 + p[3 * i + 1] * M; pos[3 * i + 2] = wz;
    }
    return { pos, uv: new Float32Array(C.uv), cor: new Float32Array(C.cor) };
  };
  if (!so2d) {
    for (const [C, lista] of [[B, 'casas'], [G, 'grades'], [Tt, 'telhado']]) {
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
  const retMundo = r => {
    const [ax, az] = noMundo(r.x0, r.z0), [bx, bz] = noMundo(r.x1, r.z1);
    return { x0: Math.min(ax, bx), x1: Math.max(ax, bx), y0: Math.min(az, bz), y1: Math.max(az, bz), cor: r.cor, tipo: r.tipo };
  };
  const tetoMundo = P.teto.map(t => retMundo({ x0: u(t.u0), x1: u(t.u1), z0: u(t.v0), z1: u(t.v1), cor: '#8e8a82', tipo: 'teto' }));
  return { plano: P, placas: placasMundo, planta2d: marcas.map(retMundo), teto: tetoMundo,
           comodos: comodos.map(c => ({ nome: c.nome, tipo: c.tipo, larg: c.x1 - c.x0, fundo: c.z1 - c.z0 })) };
}
/* a cor que se lê sobre a cor da torcida: a primeira das dela que se
   separa do fundo; se nenhuma servir, preto ou branco */
function legivelSobre(fundo, outras) {
  const lf = luz(fundo);
  for (const c of outras) if (c && Math.abs(luz(c) - lf) > 90) return c;
  return legivel(fundo);
}
