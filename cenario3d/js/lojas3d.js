/* =========================================================
   AS LOJAS DO ASSALTO (o jogo 3D, 30/09/2026)

   O dono: "preciso criar uma mecanica de assaltos [...] pro assalto ser
   executado pelo jogador com todos os ambientes sendo entráveis". Os
   seis alvos da tabela do dono (acoes.js, ASSALTOS) viram prédio de
   verdade na cidade, com o térreo inteiro por dentro, andável:

     BANCO        a agência: a fachada de vidro com a porta giratória, os
                  caixas eletrônicos, a fila, os três guichês com o vidro
                  blindado, e atrás a gerência e a sala do cofre-forte;
     JOALHERIA    as vitrines de vidro em U, o caixa no fundo, a porta
                  dos fundos pro escritório com o cofre e a oficina;
     SUPERMERCADO os três caixas na frente, as gôndolas altas (a sombra
                  do furtivo), as geladeiras, o estoque e a gerência;
     POSTO        a cobertura com as duas ilhas de bomba e, no fundo, a
                  loja de conveniência com o caixa e o cofre;
     MERCADINHO   o de esquina, de porta de enrolar: o balcão do dono,
                  as prateleiras e o quartinho do fundo;
     ROUPAS       a vitrine com os manequins, as araras, o provador e o
                  caixa no fundo.

   Os quatro primeiros ficam no terreno do fundo inteiro da quadra (de
   rua a rua, na ponta dela: três ruas dão pro prédio); o mercadinho e a
   loja de roupas, na fileira da esquina. A PLANTA DE CADA UM é uma lista
   de peças (paredes com vão, vidros, móveis) que serve a dois: o modelo
   (`TIPOS_LOJA`, montado pelo casas3d.js como os outros modelos de lote)
   e o motor do assalto (`planoDaLoja`: o que é parede e barra o olhar, o
   que é vidro, a área restrita, os postos de quem trabalha, os caixas,
   o cofre, as câmeras, o botão do alarme, o gravador).

   Referencial: o do lote (casas3d.js) — x de 0 a W da esquerda pra
   direita de quem olha a fachada, z = 0 na divisa da frente e negativo
   pra dentro, em METROS. O rumo de quem está dentro: 0 olha pra rua
   (+z), π pro fundo, π/2 pro +x.
   ========================================================= */
import { METRO } from './construtor3d.js?v=a3fa9607d3';

const M = METRO;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const E = 0.15;                      // a parede
const PE = 3.2;                      // o pé-direito
const PISO = 0.06;                   // o piso de dentro, um dedo acima da calçada

/* as medidas do terreno de cada uma (a planta, proposta.js, usa as mesmas) */
export const MEDIDAS_LOJA = {
  banco: { larg: 14.2, fundo: 'inteiro' }, joalheria: { larg: 8.6, fundo: 'inteiro' },
  supermercado: { larg: 16.4, fundo: 'inteiro' }, posto: { larg: 16.4, fundo: 'inteiro' },
  mercadinho: { larg: 7.4, fundo: 'fileira' }, roupas: { larg: 8.2, fundo: 'fileira' }
};
export const TIPOS_DE_LOJA = Object.keys(MEDIDAS_LOJA);
/* os nomes na fachada (um por praça, pela posição) */
export const NOMES_LOJA = {
  banco: ['BANCO POPULAR', 'BANCO DO POVO', 'BANCO CENTRAL DA VILA'],
  joalheria: ['JOALHERIA OURO FINO', 'JOIAS BRILHANTE', 'JOALHERIA IMPERIAL'],
  supermercado: ['SUPERMERCADO BOM PREÇO', 'SUPERMERCADO ECONOMIA', 'SUPERMERCADO DA VILA'],
  posto: ['AUTO POSTO ESTRELA', 'POSTO CAMINHO', 'AUTO POSTO AVENIDA'],
  mercadinho: ['MERCADINHO SÃO JORGE', 'MERCEARIA DO ZÉ', 'MERCADINHO BOA VISTA'],
  roupas: ['MODAS & CIA', 'BOUTIQUE ESTILO', 'LOJA DA MODA']
};
/* as cores de cada uma: a fachada, a faixa, o piso, o balcão */
const COR = {
  banco: { fachada: '#dfe3e6', faixa: '#1f4e8c', piso: '#d9d6cf', balcao: '#8a6d4f', dentro: '#eef0f0' },
  joalheria: { fachada: '#2b2b2e', faixa: '#b8912e', piso: '#e9e4d8', balcao: '#3a302a', dentro: '#f3efe6' },
  supermercado: { fachada: '#e9e4d8', faixa: '#c62828', piso: '#d8d8d2', balcao: '#7a7d80', dentro: '#f4f4f0' },
  posto: { fachada: '#f2f1ec', faixa: '#2e7d32', piso: '#cfcfc8', balcao: '#6d6f73', dentro: '#f1f1ec' },
  mercadinho: { fachada: '#e6c86a', faixa: '#2f7a46', piso: '#c3c0b8', balcao: '#7b5a3c', dentro: '#efe9dc' },
  roupas: { fachada: '#ece6ee', faixa: '#8e3a7a', piso: '#e5dfd5', balcao: '#f1f1ee', dentro: '#f6f3ef' }
};

/* =========================================================
   A PLANTA: as peças de cada loja
   Peça de parede: { ao: 'x' | 'z', a0, a1 (o comprimento), c0, c1 (a
   espessura), h, vaos: [{ a0, a1, hv }], fora, dentro (a tinta das duas
   faces), vidro } — `ao: 'x'` corre em x (a face de fora é +z); 'z' corre
   em z (a face de fora é +x). Peça de móvel: { tipo, x0, x1, z0, z1, h,
   opaco (barra o olhar), rumo } — o desenho de cada tipo fica no modelo.
   ========================================================= */
function base(tipo, W, D, esquina) {
  const c = COR[tipo];
  const esq = esquina === 'esq';
  /* o lado da esquina (a rua de lado): x1 na 'dir', x0 na 'esq' */
  const X = x => esq ? W - x : x;
  const faixaX = (a, b) => esq ? [W - b, W - a] : [a, b];
  const x0 = 0.06, x1 = W - 0.06, zf = -0.08, zb = -D + 0.06;
  return { tipo, W, D, esq, X, faixaX, c, x0, x1, zf, zb, xi0: x0 + E, xi1: x1 - E, zi1: zf - E, zi0: zb + E,
           paredes: [], moveis: [], zonas: { loja: [], restrita: [], fora: [] },
           funcionarios: [], segurancas: [], clientes: [], saque: [], cameras: [], alarmes: [], gravador: null, fundos: null,
           portas: [], placa: null };
}
/* a parede ao longo de x (z entre c0 e c1) e ao longo de z (x entre c0 e c1), com os vãos já no espelho */
const parX = (L, a0, a1, c0, c1, vaos = [], o = {}) => L.paredes.push({ ao: 'x', a0, a1, c0, c1, h: o.h || PE, vaos, fora: o.fora || L.c.fachada, dentro: o.dentro || L.c.dentro, vidro: !!o.vidro, requadro: o.requadro });
const parZ = (L, a0, a1, c0, c1, vaos = [], o = {}) => L.paredes.push({ ao: 'z', a0, a1, c0, c1, h: o.h || PE, vaos, fora: o.fora || L.c.fachada, dentro: o.dentro || L.c.dentro, vidro: !!o.vidro, requadro: o.requadro });
/* a parede lateral do lado x (sem espelho: `lado` 0 é x0, 1 é x1) */
const lateral = (L, lado, vaos = [], o = {}) => lado ? parZ(L, L.zb, L.zf, L.x1 - E, L.x1, vaos, o) : parZ(L, L.zb, L.zf, L.x0, L.x0 + E, vaos, o);
const movel = (L, m) => { L.moveis.push(m); return m; };
const ret = (x0, x1, z0, z1) => ({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) });
const pt = (x, z, o = {}) => Object.assign({ x, z }, o);
/* o rumo que olha de (x, z) pra (x2, z2) */
const olha = (x, z, x2, z2) => Math.atan2(x2 - x, z2 - z);

/* ---------- BANCO ---------- */
function plantaBanco(W, D, esquina) {
  const L = base('banco', W, D, esquina), { X, faixaX, xi0, xi1, zi0, zi1, zf, zb } = L;
  const esq = L.esq, xs = a => X(a);
  /* A FRENTE: vidro de ponta a ponta, a porta giratória no meio (o vão de 1,8 m) */
  const pm = W / 2;
  parX(L, L.x0, L.x1, zf - E, zf, [{ a0: pm - 0.9, a1: pm + 0.9, hv: 2.4 }], { vidro: true });
  /* o fundo e o lado de dentro (o da vizinha, sem porta) */
  parX(L, L.x0, L.x1, zb, zb + E, [], { fora: '#cfccc4' });
  /* a linha dos guichês (z −6,2): o balcão com o vidro blindado em cima, e a divisória com a porta de serviço no lado da esquina */
  const zc = -6.2, zc0 = zc - 0.35, zc1 = zc + 0.35;
  const [gx0, gx1] = faixaX(xi0 + 0.2, xi1 - 2.3);
  movel(L, { tipo: 'guiche', ...ret(gx0, gx1, zc0, zc1), h: 1.1, vidroAte: 2.3 });
  /* a divisória do resto da linha (opaca), com a porta de serviço de 1,2 m */
  { const [a0, a1] = faixaX(xi1 - 2.3, xi1); const [p0, p1] = faixaX(xi1 - 1.75, xi1 - 0.55);
    parX(L, a0, a1, zc0, zc0 + E, [{ a0: p0, a1: p1, hv: 2.2 }], { fora: '#e7e5df', dentro: '#e7e5df' }); }
  /* o corredor de trás (z −6,55 a −8,05) e a parede das salas com duas portas */
  const zs = -8.05;
  { const xm = W * 0.46, [g0, g1] = faixaX(xi0 + 1.2, xi0 + 2.3), [c0, c1] = faixaX(xi1 - 2.4, xi1 - 1.3);
    parX(L, L.x0 + E, L.x1 - E, zs - E, zs, [{ a0: Math.min(g0, g1), a1: Math.max(g0, g1), hv: 2.2 }, { a0: Math.min(c0, c1), a1: Math.max(c0, c1), hv: 2.2 }], { fora: '#e7e5df', dentro: '#e7e5df' });
    /* a divisória entre a gerência e o cofre */
    const xd = X(xm);
    parZ(L, zi0, zs - E, xd - E / 2, xd + E / 2, [], { fora: '#e7e5df', dentro: '#e7e5df' });
    /* AS LATERAIS: a da esquina com a saída de emergência no corredor de trás */
    const lEsq = esq ? 0 : 1;
    lateral(L, lEsq, [{ a0: -7.85, a1: -6.75, hv: 2.2 }]);
    lateral(L, 1 - lEsq, [], { fora: '#cfccc4' });
    /* os caixas eletrônicos no canto da frente (o lado de dentro) */
    for (let k = 0; k < 3; k++) { const z = -1.2 - k * 1.1, x = X(xi0 + 0.3); movel(L, { tipo: 'atm', ...ret(x - 0.3, x + 0.3, z - 0.4, z + 0.4), h: 1.7, rumo: esq ? -Math.PI / 2 : Math.PI / 2, opaco: true }); }
    /* a fila: os postes de fita no meio do salão; os bancos de espera */
    for (let k = 0; k < 4; k++) movel(L, { tipo: 'poste_fila', ...ret(pm - 1.8 + k * 1.2 - 0.05, pm - 1.8 + k * 1.2 + 0.05, -3.35, -3.25), h: 0.95 });
    for (const zb2 of [-1.6, -2.4]) { const [b0, b1] = faixaX(W * 0.62, W * 0.62 + 2.2); movel(L, { tipo: 'banco_espera', ...ret(b0, b1, zb2 - 0.22, zb2 + 0.22), h: 0.45 }); }
    /* a gerência: a mesa, a cadeira, o armário e o gravador; o cofre-forte no fundo da outra sala */
    const [m0, m1] = faixaX(xi0 + 0.6, xi0 + 2.2);
    movel(L, { tipo: 'mesa_gerente', ...ret(m0, m1, -10.6, -9.8), h: 0.76 });
    movel(L, { tipo: 'armario', ...ret(X(xi0 + 0.05), X(xi0 + 0.55), -12.2, -11.0), h: 1.9, opaco: true });
    const [v0, v1] = faixaX(xi1 - 3.4, xi1 - 0.3);
    movel(L, { tipo: 'cofre_forte', ...ret(v0, v1, zi0, zi0 + 1.1), h: 2.4, opaco: true });
    /* ---- a planta do assalto ---- */
    L.zonas.loja.push(ret(L.x0, L.x1, zb, zf));
    L.zonas.restrita.push(ret(L.x0, L.x1, zb, zc0 + 0.1));
    const nG = 3, gw = (Math.abs(gx1 - gx0)) / nG, gMin = Math.min(gx0, gx1);
    for (let k = 0; k < nG; k++) {
      const x = gMin + gw * (k + 0.5);
      L.funcionarios.push({ papel: 'caixa', x, z: zc0 - 0.55, rumo: 0 });
      L.saque.push({ id: 'guiche' + k, rot: 'Esvaziar o caixa ' + (k + 1), x, z: zc1 + 0.5, tempo: 3, peso: 1, dono: 'caixa' });
      L.alarmes.push({ x, z: zc0 - 0.3 });
      L.clientes.push({ x, z: zc1 + 0.9, rumo: Math.PI });
    }
    L.funcionarios.push({ papel: 'gerente', x: (m0 + m1) / 2, z: -11.0, rumo: 0 });
    L.alarmes.push({ x: (m0 + m1) / 2, z: -10.2 });
    L.gravador = { x: X(xi0 + 0.35), z: -9.0 };
    movel(L, { tipo: 'gravador', ...ret(L.gravador.x - 0.25, L.gravador.x + 0.25, -9.25, -8.75), h: 1.2 });
    L.saque.push({ id: 'cofre', rot: 'Abrir o cofre-forte', x: (v0 + v1) / 2, z: zi0 + 1.7, tempo: 14, peso: 9, precisa: 3, calado: 0.45 });
    L.fundos = { x: (m0 + m1) / 2, z: -9.2 };
    L.segurancas.push({ x: pm + 1.3, z: -1.1, rumo: olha(pm + 1.3, -1.1, pm, -4), ronda: [pt(pm - 2, -4.6), pt(X(xi1 - 1.2), -4.8)] });
    L.segurancas.push({ x: X(xi1 - 1.1), z: -5.0, rumo: olha(X(xi1 - 1.1), -5, pm, -2) });
    for (let k = 0; k < 3; k++) L.clientes.push({ x: X(xi0 + 1.0), z: -1.2 - k * 1.1, rumo: esq ? Math.PI / 2 : -Math.PI / 2 });
    L.clientes.push({ x: X(W * 0.62 + 0.6), z: -0.85, rumo: Math.PI }, { x: X(W * 0.62 + 1.6), z: -0.85, rumo: Math.PI }, { x: pm, z: -3.9, rumo: Math.PI });
    L.cameras.push({ x: X(xi0 + 0.25), z: zi1 - 0.25, rumo: olha(X(xi0 + 0.25), zi1 - 0.25, pm, -4.5) },
                   { x: X(xi1 - 0.25), z: zi1 - 0.25, rumo: olha(X(xi1 - 0.25), zi1 - 0.25, pm, -4.5) },
                   { x: pm, z: zc0 - 0.9, rumo: 0, alcance: 9 },
                   { x: X(xi1 - 0.3), z: zs + 0.3, rumo: esq ? Math.PI / 2 : -Math.PI / 2, alcance: 12 });
    L.portas.push({ x: pm, z: zf + 0.6, rua: 'frente', larg: 1.8 }, { x: X(L.x1 - 0.8), z: -7.3, rua: 'lado', larg: 1.1 });
  }
  L.placa = { y: PE + 0.55, larg: Math.min(6.5, W - 2), alt: 0.7 };
  return L;
}

/* ---------- JOALHERIA ---------- */
function plantaJoalheria(W, D, esquina) {
  const L = base('joalheria', W, D, esquina), { X, faixaX, xi0, xi1, zi0, zi1, zf, zb } = L;
  const esq = L.esq, pm = W / 2;
  parX(L, L.x0, L.x1, zf - E, zf, [{ a0: pm - 0.7, a1: pm + 0.7, hv: 2.4 }], { vidro: true });
  parX(L, L.x0, L.x1, zb, zb + E, [], { fora: '#cfccc4' });
  /* as vitrines em U: o balcão de vidro da esquerda e o da direita, com a moça atrás de cada um */
  const zv0 = -5.6, zv1 = -1.7;
  const vE = ret(xi0 + 0.9, xi0 + 1.5, zv0, zv1), vD = ret(xi1 - 1.5, xi1 - 0.9, zv0, zv1);
  movel(L, { tipo: 'vitrine_balcao', ...vE, h: 1.0 }); movel(L, { tipo: 'vitrine_balcao', ...vD, h: 1.0 });
  /* as vitrines da fachada, por dentro do vidro */
  movel(L, { tipo: 'vitrine_fachada', ...ret(xi0 + 0.1, pm - 1.0, zi1 - 0.55, zi1 - 0.05), h: 0.8 });
  movel(L, { tipo: 'vitrine_fachada', ...ret(pm + 1.0, xi1 - 0.1, zi1 - 0.55, zi1 - 0.05), h: 0.8 });
  /* o caixa do fundo do salão (de lado a lado, a passagem pro lado de dentro no canto da esquina) */
  const zk = -6.4;
  { const [a0, a1] = faixaX(xi0 + 0.9, xi1 - 1.3); movel(L, { tipo: 'balcao', ...ret(a0, a1, zk - 0.3, zk + 0.3), h: 1.05 }); }
  /* a parede do fundo do salão (z −7,4) com a porta restrita no lado da esquina */
  const zs = -7.4;
  { const [p0, p1] = faixaX(xi1 - 1.6, xi1 - 0.4);
    parX(L, L.x0 + E, L.x1 - E, zs - E, zs, [{ a0: p0, a1: p1, hv: 2.2 }], { fora: '#3a3533', dentro: '#e9e4d8' }); }
  /* a divisória do escritório e da oficina */
  { const xd = X(W * 0.5); parZ(L, zi0, zs - E, xd - E / 2, xd + E / 2, [{ a0: -9.9, a1: -8.8, hv: 2.2 }], { fora: '#e9e4d8', dentro: '#e9e4d8' }); }
  const lEsq = esq ? 0 : 1;
  lateral(L, lEsq, [{ a0: -9.6, a1: -8.5, hv: 2.2 }], { fora: L.c.fachada });
  lateral(L, 1 - lEsq, [], { fora: '#cfccc4' });
  /* o escritório (do lado de dentro): o cofre, a mesa e o gravador; a oficina (do lado da esquina): a bancada do ourives */
  const [c0, c1] = faixaX(xi0 + 0.2, xi0 + 1.3);
  movel(L, { tipo: 'cofre', ...ret(c0, c1, zi0, zi0 + 0.9), h: 1.4, opaco: true });
  const [m0, m1] = faixaX(xi0 + 1.8, xi0 + 3.2);
  movel(L, { tipo: 'mesa_gerente', ...ret(m0, m1, -10.2, -9.5), h: 0.76 });
  const [o0, o1] = faixaX(xi1 - 2.6, xi1 - 0.2);
  movel(L, { tipo: 'bancada', ...ret(o0, o1, zi0, zi0 + 0.7), h: 0.95 });
  /* ---- a planta do assalto ---- */
  L.zonas.loja.push(ret(L.x0, L.x1, zb, zf));
  L.zonas.restrita.push(ret(L.x0, L.x1, zb, zs), ret(xi0, xi0 + 0.9, zv0, zv1), ret(xi1 - 0.9, xi1, zv0, zv1), ret(xi0, xi1, zk - 0.3, zk - 0.9));
  L.funcionarios.push({ papel: 'atendente', x: xi0 + 0.45, z: -3.6, rumo: Math.PI / 2 }, { papel: 'atendente', x: xi1 - 0.45, z: -3.6, rumo: -Math.PI / 2 },
                      { papel: 'caixa', x: X(pm - 0.4), z: zk - 0.65, rumo: 0 }, { papel: 'gerente', x: (m0 + m1) / 2, z: -10.6, rumo: 0 });
  for (const z of [-2.6, -4.6]) {
    L.saque.push({ id: 'vE' + z, rot: 'Limpar a vitrine', x: xi0 + 1.95, z, tempo: 2.5, peso: 2, barulho: true });
    L.saque.push({ id: 'vD' + z, rot: 'Limpar a vitrine', x: xi1 - 1.95, z, tempo: 2.5, peso: 2, barulho: true });
  }
  L.saque.push({ id: 'caixa', rot: 'Esvaziar o caixa', x: X(pm - 0.4), z: zk + 0.75, tempo: 3, peso: 1, dono: 'caixa' });
  L.saque.push({ id: 'cofre', rot: 'Abrir o cofre', x: (c0 + c1) / 2, z: zi0 + 1.4, tempo: 10, peso: 5, precisa: 2, calado: 0.5 });
  L.gravador = { x: (m0 + m1) / 2, z: -9.1 };
  L.alarmes.push({ x: xi0 + 0.45, z: -3.2 }, { x: xi1 - 0.45, z: -3.2 }, { x: X(pm - 0.4), z: zk - 0.4 });
  L.fundos = { x: X(W * 0.72), z: -9.0 };
  L.segurancas.push({ x: pm + 0.9, z: -0.9, rumo: Math.PI, ronda: [pt(pm, -5.2), pt(pm - 0.9, -1.0)] });
  L.clientes.push({ x: xi0 + 1.95, z: -2.8, rumo: -Math.PI / 2 }, { x: xi1 - 1.95, z: -4.2, rumo: Math.PI / 2 }, { x: pm, z: -3.4, rumo: Math.PI },
                  { x: pm - 0.6, z: -5.3, rumo: Math.PI }, { x: xi1 - 2.0, z: -2.2, rumo: Math.PI / 2 });
  L.cameras.push({ x: xi0 + 0.2, z: zi1 - 0.2, rumo: olha(xi0 + 0.2, zi1 - 0.2, pm, -4) }, { x: xi1 - 0.2, z: zk - 0.4, rumo: olha(xi1 - 0.2, zk - 0.4, pm, -1.5) },
                 { x: X(xi1 - 0.3), z: zs - 0.3, rumo: olha(X(xi1 - 0.3), zs - 0.3, X(xi0 + 1), -10), alcance: 9 });
  L.portas.push({ x: pm, z: zf + 0.6, rua: 'frente', larg: 1.4 }, { x: X(L.x1 - 0.8), z: -9.05, rua: 'lado', larg: 1.1 });
  L.placa = { y: PE + 0.55, larg: Math.min(5.2, W - 1.6), alt: 0.62 };
  return L;
}

/* ---------- SUPERMERCADO ---------- */
function plantaSupermercado(W, D, esquina) {
  const L = base('supermercado', W, D, esquina), { X, faixaX, xi0, xi1, zi0, zi1, zf, zb } = L;
  const esq = L.esq;
  /* a frente: vidro, a entrada e a saída (2 m cada) */
  const pa = W * 0.24, pb = W * 0.76;
  parX(L, L.x0, L.x1, zf - E, zf, [{ a0: pa - 1, a1: pa + 1, hv: 2.5 }, { a0: pb - 1, a1: pb + 1, hv: 2.5 }], { vidro: true });
  parX(L, L.x0, L.x1, zb, zb + E, [], { fora: '#cfccc4' });
  /* os três caixas (z −2,1 a −3,7): a esteira e o caixa do lado de dentro */
  const caixas = [W * 0.38, W * 0.5, W * 0.62];
  for (const cx of caixas) movel(L, { tipo: 'checkout', ...ret(cx - 0.35, cx + 0.35, -3.7, -2.1), h: 0.9 });
  /* o estoque e a gerência: os 3 m do fundo (a parede em zs), duas portas */
  const zs = zi0 + 3.0;
  /* as gôndolas altas: quatro corredores, do −4,8 até 1,3 m da parede do estoque */
  const g0 = xi0 + 2.2, g1 = xi1 - 1.2, n = 4, passo = (g1 - g0) / n;
  for (let k = 0; k < n; k++) { const x = g0 + passo * (k + 0.5); movel(L, { tipo: 'gondola', ...ret(x - 0.45, x + 0.45, zs + 1.3, -4.8), h: 1.8, opaco: true }); }
  /* as geladeiras na parede de dentro */
  { const [a0, a1] = faixaX(xi0, xi0 + 0.75); movel(L, { tipo: 'geladeiras', ...ret(a0, a1, zs + 0.5, -4.2), h: 2.0, opaco: true, rumo: esq ? -Math.PI / 2 : Math.PI / 2 }); }
  { const [p0, p1] = faixaX(W * 0.2, W * 0.2 + 1.6), [q0, q1] = faixaX(xi1 - 2.2, xi1 - 1.0);
    parX(L, L.x0 + E, L.x1 - E, zs - E, zs, [{ a0: Math.min(p0, p1), a1: Math.max(p0, p1), hv: 2.4 }, { a0: Math.min(q0, q1), a1: Math.max(q0, q1), hv: 2.2 }], { fora: '#e9e4d8', dentro: '#e9e4d8' });
    const xd = X(xi1 - 3.4); parZ(L, zi0, zs - E, xd - E / 2, xd + E / 2, [], { fora: '#e9e4d8', dentro: '#e9e4d8' }); }
  const lEsq = esq ? 0 : 1;
  /* a doca: o portão do estoque pra rua do lado */
  lateral(L, lEsq, [{ a0: zi0 + 0.3, a1: zi0 + 1.6, hv: 2.4 }]);
  lateral(L, 1 - lEsq, [], { fora: '#cfccc4' });
  /* o estoque: os engradados; a gerência: o cofre, a mesa, o gravador */
  for (let k = 0; k < 4; k++) { const [a0, a1] = faixaX(xi0 + 0.4 + k * 1.6, xi0 + 1.4 + k * 1.6); movel(L, { tipo: 'pilha', ...ret(a0, a1, zi0 + 0.1, zi0 + 1.0), h: 1.5, opaco: true }); }
  const [c0, c1] = faixaX(xi1 - 1.2, xi1 - 0.2);
  movel(L, { tipo: 'cofre', ...ret(c0, c1, zi0, zi0 + 0.8), h: 1.3, opaco: true });
  const [m0, m1] = faixaX(xi1 - 2.9, xi1 - 2.0);
  movel(L, { tipo: 'mesa_gerente', ...ret(m0, m1, zi0 + 1.0, zi0 + 1.6), h: 0.76 });
  /* ---- a planta do assalto ---- */
  L.zonas.loja.push(ret(L.x0, L.x1, zb, zf));
  L.zonas.restrita.push(ret(L.x0, L.x1, zb, zs));
  for (const cx of caixas) {
    L.funcionarios.push({ papel: 'caixa', x: cx + 0.75, z: -2.9, rumo: -Math.PI / 2 });
    L.saque.push({ id: 'caixa' + cx.toFixed(1), rot: 'Esvaziar o caixa', x: cx - 0.75, z: -2.9, tempo: 3, peso: 1, dono: 'caixa' });
    L.alarmes.push({ x: cx + 0.5, z: -2.5 });
  }
  L.funcionarios.push({ papel: 'gerente', x: (m0 + m1) / 2, z: zi0 + 0.5, rumo: 0 }, { papel: 'atendente', x: g0 + passo * 2, z: zs + 0.65, rumo: 0 });
  L.saque.push({ id: 'cofre', rot: 'Abrir o cofre da gerência', x: (c0 + c1) / 2, z: zi0 + 1.3, tempo: 8, peso: 4, precisa: 2, calado: 0.5 });
  L.gravador = { x: (m0 + m1) / 2, z: zi0 + 2.1 };
  L.alarmes.push({ x: (m0 + m1) / 2, z: zi0 + 1.3 });
  L.fundos = { x: X(W * 0.2 + 0.8), z: zs - 0.8 };
  L.segurancas.push({ x: pb - 1.4, z: -1.4, rumo: Math.PI, ronda: [pt(g0 + passo, -7.4), pt(g0 + passo * 3, -7.4), pt(W * 0.5, -4.3)] });
  for (let k = 0; k < n + 1; k++) L.clientes.push({ x: g0 + passo * k, z: -5.8 - (k % 2) * 1.8, rumo: k % 2 ? Math.PI / 2 : -Math.PI / 2 });
  L.clientes.push({ x: X(xi0 + 1.3), z: -6.5, rumo: esq ? Math.PI / 2 : -Math.PI / 2 }, { x: W * 0.5, z: -4.2, rumo: Math.PI }, { x: W * 0.3, z: -1.3, rumo: Math.PI });
  L.cameras.push({ x: xi0 + 0.2, z: zi1 - 0.2, rumo: olha(xi0 + 0.2, zi1 - 0.2, W * 0.5, -5) }, { x: xi1 - 0.2, z: zs + 0.3, rumo: olha(xi1 - 0.2, zs + 0.3, W * 0.4, -3) });
  L.portas.push({ x: pa, z: zf + 0.6, rua: 'frente', larg: 2 }, { x: pb, z: zf + 0.6, rua: 'frente', larg: 2 }, { x: X(L.x1 - 0.8), z: zi0 + 0.95, rua: 'lado', larg: 1.3 });
  L.placa = { y: PE + 0.6, larg: Math.min(8.5, W - 3), alt: 0.8 };
  return L;
}

/* ---------- POSTO ---------- */
function plantaPosto(W, D, esquina) {
  const L = base('posto', W, D, esquina), { X, faixaX, xi0, xi1, zi0, zb } = L;
  const esq = L.esq;
  /* a pista aberta (z 0 a −7) com a cobertura e as ilhas; a loja no fundo */
  const zl = -7.3;                                      // a frente da loja
  const [lx0, lx1] = faixaX(xi0, xi1 - 3.2);           // a loja não vai até a esquina: o canto fica pro ar e água
  const lo = Math.min(lx0, lx1), hi = Math.max(lx0, lx1), pl = (lo + hi) / 2;
  movel(L, { tipo: 'cobertura', ...ret(1.0, W - 1.0, -6.6, -0.6), h: 4.8 });
  for (const f of [0.33, 0.67]) movel(L, { tipo: 'ilha', ...ret(W * f - 0.35, W * f + 0.35, -4.7, -2.5), h: 0.25 });
  movel(L, { tipo: 'totem', ...ret(X(W - 0.9) - 0.35, X(W - 0.9) + 0.35, -0.7, -0.4), h: 5.5, opaco: true });
  /* a loja de conveniência: a frente de vidro com a porta, o fundo, as laterais */
  parX(L, lo - E, hi + E, zl - E, zl, [{ a0: pl - 0.8, a1: pl + 0.8, hv: 2.4 }], { vidro: true });
  parX(L, L.x0, L.x1, zb, zb + E, [], { fora: '#cfccc4' });
  parZ(L, zb, zl, lo - E, lo, [], { fora: '#cfccc4' });
  parZ(L, zb, zl, hi, hi + E, esq ? [] : [], {});
  /* o depósito do fundo (z −11) com a porta; a saída dele pra rua de lado passa pelo canto do ar */
  const zs = -11.1;
  { const [p0, p1] = faixaX(xi0 + 0.5, xi0 + 1.6); parX(L, lo, hi, zs - E, zs, [{ a0: Math.min(p0, p1), a1: Math.max(p0, p1), hv: 2.2 }], { fora: '#e9e4d8', dentro: '#e9e4d8' }); }
  /* o balcão do caixa, as prateleiras baixas, as geladeiras */
  const [b0, b1] = faixaX(xi1 - 3.2 - 2.6, xi1 - 3.2 - 0.2);
  movel(L, { tipo: 'balcao', ...ret(b0, b1, -8.9, -8.3), h: 1.05 });
  for (const f of [0.3, 0.5]) movel(L, { tipo: 'prateleira_baixa', ...ret(lo + (hi - lo) * f - 0.35, lo + (hi - lo) * f + 0.35, -10.4, -8.4), h: 1.35 });
  { const [g0, g1] = faixaX(xi0 + 2.3, xi0 + 5.8); movel(L, { tipo: 'geladeiras', ...ret(g0, g1, zs + 0.05, zs + 0.8), h: 2.0, opaco: true, rumo: 0 }); }
  const [c0, c1] = faixaX(xi0 + 2.2, xi0 + 3.1);
  movel(L, { tipo: 'cofre', ...ret(c0, c1, zi0, zi0 + 0.7), h: 1.1, opaco: true });
  /* ---- a planta do assalto ---- */
  L.zonas.loja.push(ret(lo, hi, zb, zl));
  L.zonas.restrita.push(ret(lo, hi, zb, zs), ret(Math.min(b0, b1), Math.max(b0, b1), -8.3, -9.6));
  L.zonas.fora.push(ret(L.x0, L.x1, zl, 0));
  L.funcionarios.push({ papel: 'caixa', x: (b0 + b1) / 2, z: -9.3, rumo: 0 },
                      { papel: 'atendente', x: W * 0.33 + 0.9, z: -3.6, rumo: 0 }, { papel: 'atendente', x: W * 0.67 - 0.9, z: -3.6, rumo: 0 });
  L.saque.push({ id: 'caixa', rot: 'Esvaziar o caixa', x: (b0 + b1) / 2, z: -7.8, tempo: 3, peso: 1.5, dono: 'caixa' });
  L.saque.push({ id: 'cofre', rot: 'Abrir o cofre', x: (c0 + c1) / 2, z: zi0 + 1.2, tempo: 6, peso: 3, calado: 0.6 });
  L.gravador = { x: X(xi0 + 0.5), z: zi0 + 0.5 };
  L.alarmes.push({ x: (b0 + b1) / 2, z: -9.0 });
  L.fundos = { x: X(xi0 + 1.2), z: -12.0 };
  L.clientes.push({ x: lo + (hi - lo) * 0.4, z: -9.4, rumo: 0 }, { x: lo + 1.6, z: -10.0, rumo: Math.PI }, { x: (b0 + b1) / 2, z: -7.7, rumo: Math.PI },
                  { x: W * 0.33 - 1.0, z: -3.6, rumo: 0 }, { x: W * 0.67 + 1.0, z: -3.6, rumo: 0 });
  L.cameras.push({ x: X(xi0 + 0.3), z: -6.4, rumo: olha(X(xi0 + 0.3), -6.4, W * 0.5, -2), alcance: 13 },
                 { x: X(xi1 - 3.4), z: zl - 0.3, rumo: olha(X(xi1 - 3.4), zl - 0.3, pl, -9.5) });
  L.portas.push({ x: pl, z: zl + 0.6, rua: 'frente', larg: 1.6 });
  L.placa = { y: 4.8 + 0.06 + 0.35, larg: Math.min(8, W - 4), alt: 0.5 };
  return L;
}

/* ---------- MERCADINHO (a fileira da esquina) ---------- */
function plantaMercadinho(W, D, esquina) {
  const L = base('mercadinho', W, D, esquina), { X, faixaX, xi0, xi1, zi0, zi1, zf, zb } = L;
  const esq = L.esq;
  /* duas portas de enrolar na frente, uma no lado da esquina */
  const [pa0, pa1] = faixaX(xi0 + 0.5, xi0 + 2.6), [pb0, pb1] = faixaX(xi1 - 2.4, xi1 - 0.4);
  parX(L, L.x0, L.x1, zf - E, zf, [{ a0: Math.min(pa0, pa1), a1: Math.max(pa0, pa1), hv: 2.55, enrolar: true }, { a0: Math.min(pb0, pb1), a1: Math.max(pb0, pb1), hv: 2.55, enrolar: true }]);
  parX(L, L.x0, L.x1, zb, zb + E, [], { fora: '#cfccc4' });
  const lEsq = esq ? 0 : 1;
  lateral(L, lEsq, [{ a0: zi0 + 0.9, a1: zi0 + 2.3, hv: 2.55, enrolar: true }]);
  lateral(L, 1 - lEsq, [], { fora: '#cfccc4' });
  /* o balcão em L do lado de dentro, o dono atrás; as prateleiras do fundo; a geladeira */
  const [b0, b1] = faixaX(xi0 + 1.15, xi0 + 1.7);
  movel(L, { tipo: 'balcao', ...ret(b0, b1, zi0 + 0.7, zi1 - 0.9), h: 1.05 });
  { const [s0, s1] = faixaX(xi0, xi0 + 0.4); movel(L, { tipo: 'prateleira_parede', ...ret(s0, s1, zi0 + 0.3, zi1 - 0.5), h: 2.0, opaco: true, rumo: esq ? -Math.PI / 2 : Math.PI / 2 }); }
  { const [s0, s1] = faixaX(xi0 + 2.2, xi1 - 1.9); movel(L, { tipo: 'prateleira_parede', ...ret(s0, s1, zi0, zi0 + 0.4), h: 2.0, opaco: true, rumo: 0 }); }
  movel(L, { tipo: 'prateleira_baixa', ...ret(W * 0.55 - 0.3, W * 0.55 + 0.3, zi0 + 1.1, zi1 - 1.2), h: 1.3 });
  { const [g0, g1] = faixaX(xi1 - 0.75, xi1); movel(L, { tipo: 'geladeiras', ...ret(g0, g1, zi0 + 2.6, zi1 - 0.3), h: 1.9, opaco: true, rumo: esq ? Math.PI / 2 : -Math.PI / 2 }); }
  /* o quartinho do fundo, no canto da esquina: o cofrinho do dono */
  const [q0, q1] = faixaX(xi1 - 1.8, xi1);
  movel(L, { tipo: 'cofre', ...ret(Math.min(q0, q1) + 0.9, Math.max(q0, q1) - 0.1, zi0, zi0 + 0.6), h: 0.9, opaco: true });
  /* ---- a planta do assalto ---- */
  L.zonas.loja.push(ret(L.x0, L.x1, zb, zf));
  { const [r0, r1] = faixaX(xi0, xi0 + 1.15); L.zonas.restrita.push(ret(r0, r1, zi0, zi1 - 0.9), ret(Math.min(q0, q1), Math.max(q0, q1), zi0, zi0 + 1.4)); }
  L.funcionarios.push({ papel: 'caixa', x: X(xi0 + 0.8), z: (zi0 + zi1) / 2 - 0.3, rumo: esq ? -Math.PI / 2 : Math.PI / 2 });
  L.saque.push({ id: 'caixa', rot: 'Esvaziar o caixa', x: X(xi0 + 2.2), z: (zi0 + zi1) / 2 - 0.3, tempo: 3, peso: 1.2, dono: 'caixa' });
  L.saque.push({ id: 'cigarro', rot: 'Pegar os cigarros', x: X(xi0 + 2.2), z: zi0 + 1.1, tempo: 2, peso: 0.8, dono: 'caixa' });
  L.saque.push({ id: 'cofre', rot: 'Abrir o cofrinho', x: (q0 + q1) / 2 + (esq ? -0.4 : 0.4), z: zi0 + 1.1, tempo: 4, peso: 2, calado: 0.7 });
  L.fundos = { x: (q0 + q1) / 2, z: zi0 + 1.0 };
  L.clientes.push({ x: W * 0.55 - 0.75, z: (zi0 + zi1) / 2, rumo: Math.PI / 2 }, { x: W * 0.55 + 0.75, z: (zi0 + zi1) / 2, rumo: -Math.PI / 2 }, { x: X(xi0 + 2.3), z: zi1 - 0.6, rumo: esq ? Math.PI / 2 : -Math.PI / 2 });
  L.cameras.push({ x: X(xi0 + 0.2), z: zi1 - 0.2, rumo: olha(X(xi0 + 0.2), zi1 - 0.2, W * 0.6, zi0 + 0.5), alcance: 8 });
  L.portas.push({ x: (pa0 + pa1) / 2, z: zf + 0.6, rua: 'frente', larg: 2 }, { x: (pb0 + pb1) / 2, z: zf + 0.6, rua: 'frente', larg: 2 }, { x: X(L.x1 - 0.8), z: zi0 + 1.6, rua: 'lado', larg: 1.4 });
  L.placa = { y: 2.55 + 0.42, larg: Math.min(4.6, W - 1.2), alt: 0.5 };
  return L;
}

/* ---------- LOJA DE ROUPAS (a fileira da esquina) ---------- */
function plantaRoupas(W, D, esquina) {
  const L = base('roupas', W, D, esquina), { X, faixaX, xi0, xi1, zi0, zi1, zf, zb } = L;
  const esq = L.esq;
  const [p0, p1] = faixaX(xi1 - 1.9, xi1 - 0.5);
  parX(L, L.x0, L.x1, zf - E, zf, [{ a0: Math.min(p0, p1), a1: Math.max(p0, p1), hv: 2.4 }], { vidro: true });
  parX(L, L.x0, L.x1, zb, zb + E, [], { fora: '#cfccc4' });
  lateral(L, 0, [], { fora: esq ? L.c.fachada : '#cfccc4' });
  lateral(L, 1, [], { fora: esq ? '#cfccc4' : L.c.fachada });
  /* a vitrine com os manequins, as araras, o provador e o caixa */
  { const [v0, v1] = faixaX(xi0 + 0.1, xi1 - 2.1); movel(L, { tipo: 'vitrine_fachada', ...ret(v0, v1, zi1 - 0.6, zi1 - 0.05), h: 0.35, manequins: 3 }); }
  const araras = [];
  for (const f of [0.28, 0.5]) { const x = X(xi0 + (xi1 - xi0) * f); araras.push(x); movel(L, { tipo: 'arara', ...ret(x - 0.6, x + 0.6, -2.9, -2.5), h: 1.55 }); }
  const [k0, k1] = faixaX(xi1 - 2.6, xi1 - 0.4);
  movel(L, { tipo: 'balcao', ...ret(k0, k1, zi0 + 0.9, zi0 + 1.4), h: 1.0 });
  { const [s0, s1] = faixaX(xi0, xi0 + 0.45); movel(L, { tipo: 'prateleira_parede', ...ret(s0, s1, zi0 + 0.2, zi1 - 0.8), h: 2.1, opaco: true, rumo: esq ? -Math.PI / 2 : Math.PI / 2, roupa: true }); }
  const [r0, r1] = faixaX(xi0 + 0.6, xi0 + 1.8);
  movel(L, { tipo: 'provador', ...ret(r0, r1, zi0, zi0 + 1.2), h: 2.1, opaco: true });
  /* ---- a planta do assalto ---- */
  L.zonas.loja.push(ret(L.x0, L.x1, zb, zf));
  L.zonas.restrita.push(ret(Math.min(k0, k1), Math.max(k0, k1), zb, zi0 + 0.9));
  L.funcionarios.push({ papel: 'caixa', x: (k0 + k1) / 2, z: zi0 + 0.45, rumo: 0 }, { papel: 'atendente', x: X(xi0 + (xi1 - xi0) * 0.39), z: -3.5, rumo: 0 });
  L.saque.push({ id: 'caixa', rot: 'Esvaziar o caixa', x: (k0 + k1) / 2, z: zi0 + 1.95, tempo: 3, peso: 1.5, dono: 'caixa' });
  araras.forEach((x, i) => L.saque.push({ id: 'arara' + i, rot: 'Encher a sacola de roupa', x, z: -2.0, tempo: 2, peso: 1, calado: 0.8 }));
  L.fundos = { x: (r0 + r1) / 2, z: zi0 + 1.6 };
  L.clientes.push({ x: araras[0], z: -3.4, rumo: 0 }, { x: araras[1], z: -2.0, rumo: Math.PI }, { x: X(xi0 + 0.9), z: -2.2, rumo: esq ? Math.PI / 2 : -Math.PI / 2 });
  L.cameras.push({ x: X(xi1 - 0.2), z: zi0 + 0.2, rumo: olha(X(xi1 - 0.2), zi0 + 0.2, W * 0.4, zi1), alcance: 9 });
  L.portas.push({ x: (p0 + p1) / 2, z: zf + 0.6, rua: 'frente', larg: 1.4 });
  L.placa = { y: PE - 0.35, larg: Math.min(4.2, W - 2.4), alt: 0.45 };
  return L;
}

const PLANTAS = { banco: plantaBanco, joalheria: plantaJoalheria, supermercado: plantaSupermercado, posto: plantaPosto, mercadinho: plantaMercadinho, roupas: plantaRoupas };
const cachePlanta = new Map();
export function plantaDaLoja(tipo, W, D, esquina) {
  const k = [tipo, W.toFixed(3), D.toFixed(3), esquina].join('|');
  if (!cachePlanta.has(k)) cachePlanta.set(k, PLANTAS[tipo](W, D, esquina));
  return cachePlanta.get(k);
}

/* =========================================================
   O PLANO DO ASSALTO: o que o motor precisa, no referencial do lote
   - `opacos`: retângulos que barram o olhar (as paredes sem os vãos, os
     móveis altos); o vidro da fachada e o balcão deixam ver;
   - `zonas`: a loja (1) e a área restrita (2); o resto do lote (a pista do
     posto) é rua;
   - os postos, o saque, as câmeras, os alarmes, o gravador, as portas.
   ========================================================= */
export function planoDaLoja(tipo, W, D, esquina) {
  const L = plantaDaLoja(tipo, W, D, esquina);
  const opacos = [];
  for (const p of L.paredes) {
    if (p.vidro) continue;
    const vaos = (p.vaos || []).slice().sort((a, b) => a.a0 - b.a0);
    let a = p.a0;
    const corta = (u0, u1) => { if (u1 - u0 < 1e-3) return; opacos.push(p.ao === 'x' ? ret(u0, u1, p.c0, p.c1) : ret(p.c0, p.c1, u0, u1)); };
    for (const v of vaos) { corta(a, v.a0); a = Math.max(a, v.a1); }
    corta(a, p.a1);
  }
  for (const m of L.moveis) if (m.opaco) opacos.push(ret(m.x0, m.x1, m.z0, m.z1));
  return {
    tipo, W, D, esquina, opacos, zonas: L.zonas, funcionarios: L.funcionarios, segurancas: L.segurancas, clientes: L.clientes,
    saque: L.saque, cameras: L.cameras, alarmes: L.alarmes, gravador: L.gravador, fundos: L.fundos, portas: L.portas
  };
}

/* O LETREIRO (o decalque do nome, `l.placa`): no meio da fachada, em cima
   da porta — {y, larg, alt, u} em unidades, como o do bar */
export function placaDaLoja(tipo, W, D, esquina) {
  const L = plantaDaLoja(tipo, W, D, esquina), P = L.placa;
  return { y: P.y * M, larg: P.larg * M, alt: P.alt * M, u: 0 };
}

/* =========================================================
   O MODELO (casas3d.js chama como os outros modelos de lote)
   ========================================================= */
const REC = 0.08;
export const REC_LOJA = Object.fromEntries(TIPOS_DE_LOJA.map(t => ['loja_' + t, REC]));

/* a parede com vãos: os cheios em caixa, a verga em cima de cada vão,
   o vidro (fachada) em placas com o caixilho */
function desenharParede(B, p) {
  const cx = (u0, u1, y0, y1, spec) => p.ao === 'x' ? B.caixa(u0, u1, y0, y1, p.c0, p.c1, spec) : B.caixa(p.c0, p.c1, y0, y1, u0, u1, spec);
  const F = p.ao === 'x' ? { fora: 'frente', dentro: 'tras', ini: 'esq', fim: 'dir' } : { fora: 'dir', dentro: 'esq', ini: 'tras', fim: 'frente' };
  const fora = { k: 'lisa', tinta: p.fora }, dentro = { k: 'lisa', tinta: p.dentro };
  const vaos = (p.vaos || []).slice().sort((a, b) => a.a0 - b.a0);
  const cheios = [];
  let a = p.a0;
  for (const v of vaos) { if (v.a0 > a + 1e-6) cheios.push([a, v.a0]); a = Math.max(a, v.a1); }
  if (p.a1 > a + 1e-6) cheios.push([a, p.a1]);
  if (p.vidro) {
    /* a fachada de vidro: o rodapé de 0,3 m, os painéis de vidro até 2,6 m e a faixa cheia até o teto */
    for (const [u0, u1] of cheios) {
      cx(u0, u1, 0, 0.3, { [F.fora]: { k: 'lisa', tinta: '#4a4d52' }, [F.dentro]: dentro, topo: { k: 'lisa', tinta: '#4a4d52' }, [F.ini]: fora, [F.fim]: fora, base: null });
      const n = Math.max(1, Math.round((u1 - u0) / 1.5)), w = (u1 - u0) / n;
      for (let i = 0; i < n; i++) {
        const q0 = u0 + i * w, q1 = q0 + w;
        const Fv = p.ao === 'x' ? B.plano([q0, 0.3, p.c1 - 0.04], [1, 0, 0], [0, 1, 0]) : B.plano([p.c1 - 0.04, 0.3, q1], [0, 0, -1], [0, 1, 0]);
        B.esticar(Fv, 0, w, 0, 2.3, 'shop_vidro');
        const Fd = p.ao === 'x' ? B.plano([q1, 0.3, p.c0 + 0.04], [-1, 0, 0], [0, 1, 0]) : B.plano([p.c0 + 0.04, 0.3, q0], [0, 0, 1], [0, 1, 0]);
        B.esticar(Fd, 0, w, 0, 2.3, 'shop_vidro');
        /* o montante */
        cx(q0 - 0.03, q0 + 0.03, 0.3, 2.6, { todas: { k: 'lisa', tinta: '#3a3d42' }, base: null, topo: null });
      }
      cx(u1 - 0.03, u1, 0.3, 2.6, { todas: { k: 'lisa', tinta: '#3a3d42' }, base: null, topo: null });
      cx(u0, u1, 2.6, p.h, { [F.fora]: fora, [F.dentro]: dentro, base: { k: 'lisa', tinta: '#3a3d42' }, topo: null, [F.ini]: fora, [F.fim]: fora });
    }
  } else {
    for (const [u0, u1] of cheios) cx(u0, u1, 0, p.h, { [F.fora]: fora, [F.dentro]: dentro, [F.ini]: fora, [F.fim]: fora, topo: null, base: null });
  }
  /* as vergas (e a porta de enrolar enrolada lá em cima) */
  for (const v of vaos) {
    cx(v.a0, v.a1, v.hv, p.h, { [F.fora]: fora, [F.dentro]: dentro, base: fora, topo: null, [F.ini]: null, [F.fim]: null });
    if (v.enrolar) {
      const Fp = p.ao === 'x' ? B.plano([v.a0, 0, p.c1 - 0.05], [1, 0, 0], [0, 1, 0]) : B.plano([p.c1 - 0.05, 0, v.a1], [0, 0, -1], [0, 1, 0]);
      B.esticar(Fp, 0, v.a1 - v.a0, v.hv - 0.13, v.hv, 'enrolar', { parte: [0, 1, 0, 0.05] });
    } else {
      /* o batente da porta */
      const bat = { todas: { k: 'lisa', tinta: '#5b5e63' }, base: null };
      if (p.ao === 'x') { B.caixa(v.a0, v.a0 + 0.05, 0, v.hv, p.c0, p.c1, bat); B.caixa(v.a1 - 0.05, v.a1, 0, v.hv, p.c0, p.c1, bat); }
      else { B.caixa(p.c0, p.c1, 0, v.hv, v.a0, v.a0 + 0.05, bat); B.caixa(p.c0, p.c1, 0, v.hv, v.a1 - 0.05, v.a1, bat); }
    }
  }
}

/* os móveis: cada tipo com o seu desenho (tudo em caixa, na folha das casas) */
const liso = (tinta, k = 'lisa') => ({ k, tinta });
function desenharMovel(B, m, L) {
  const c = L.c, X0 = m.x0, X1 = m.x1, Z0 = m.z0, Z1 = m.z1, y = PISO;
  switch (m.tipo) {
    case 'balcao': {
      B.caixa(X0, X1, y, y + m.h - 0.04, Z0, Z1, { todas: liso(c.balcao), base: null, topo: null });
      B.caixa(X0 - 0.03, X1 + 0.03, y + m.h - 0.04, y + m.h, Z0 - 0.03, Z1 + 0.03, { todas: liso('#2f2d2b', 'laje'), base: null });
      break;
    }
    case 'guiche': {
      /* o balcão dos caixas e o vidro blindado em cima, com as divisórias */
      B.caixa(X0, X1, y, y + m.h, Z0, Z1, { todas: liso(c.balcao), base: null });
      const n = 3, w = (X1 - X0) / n;
      for (let i = 0; i <= n; i++) { const x = X0 + i * w; B.caixa(x - 0.04, x + 0.04, y + m.h, y + m.vidroAte, Z0 + 0.25, Z1 - 0.25, { todas: liso('#6b6e73'), base: null }); }
      const Fv = B.plano([X0, y + m.h, (Z0 + Z1) / 2], [1, 0, 0], [0, 1, 0]);
      B.esticar(Fv, 0, X1 - X0, 0.12, m.vidroAte - m.h, 'shop_vidro');
      const Fv2 = B.plano([X1, y + m.h, (Z0 + Z1) / 2 - 0.01], [-1, 0, 0], [0, 1, 0]);
      B.esticar(Fv2, 0, X1 - X0, 0.12, m.vidroAte - m.h, 'shop_vidro');
      B.caixa(X0, X1, y + m.vidroAte, y + m.vidroAte + 0.12, Z0 + 0.2, Z1 - 0.2, { todas: liso('#1f4e8c'), base: liso('#1f4e8c') });
      break;
    }
    case 'vitrine_balcao': {
      /* o pé escuro, a caixa de vidro com as joias (o forro de veludo) */
      B.caixa(X0, X1, y, y + 0.55, Z0, Z1, { todas: liso(c.balcao), base: null });
      B.caixa(X0 + 0.03, X1 - 0.03, y + 0.55, y + 0.6, Z0 + 0.03, Z1 - 0.03, { todas: liso('#5a1420'), base: null });
      for (let z = Z0 + 0.25; z < Z1 - 0.1; z += 0.35) B.caixa((X0 + X1) / 2 - 0.08, (X0 + X1) / 2 + 0.08, y + 0.6, y + 0.64, z - 0.05, z + 0.05, { todas: liso('#e8c75a'), base: null });
      const vid = { k: 'shop_vidro', modo: 'esticar' };
      B.caixa(X0, X1, y + 0.6, y + m.h, Z0, Z1, { frente: vid, tras: vid, esq: vid, dir: vid, topo: vid, base: null });
      break;
    }
    case 'vitrine_fachada': {
      B.caixa(X0, X1, y, y + m.h, Z0, Z1, { todas: liso('#e8e2d6'), base: null });
      const n = m.manequins || 0;
      for (let i = 0; i < n; i++) {
        const x = X0 + (X1 - X0) * (i + 0.5) / n, z = (Z0 + Z1) / 2, yb = y + m.h;
        B.caixa(x - 0.04, x + 0.04, yb, yb + 0.9, z - 0.04, z + 0.04, { todas: liso('#b9b3aa'), base: null });
        B.pintar(['#c62828', '#f2f2ee', '#2b3a55'][i % 3]);
        B.torno(x, z, [[0.16, yb + 0.85], [0.2, yb + 1.1], [0.19, yb + 1.45], [0.08, yb + 1.55], [0, yb + 1.56]], 8, 'lisa');
        B.pintar('#d8c4a8');
        B.torno(x, z, [[0.05, yb + 1.56], [0.1, yb + 1.64], [0.1, yb + 1.76], [0, yb + 1.82]], 8, 'lisa');
        B.pintar(null);
      }
      if (!n) for (let x = X0 + 0.3; x < X1 - 0.2; x += 0.45) B.caixa(x - 0.06, x + 0.06, y + m.h, y + m.h + 0.12, (Z0 + Z1) / 2 - 0.06, (Z0 + Z1) / 2 + 0.06, { todas: liso('#e8c75a'), base: null });
      break;
    }
    case 'atm': {
      B.caixa(X0, X1, y, y + m.h, Z0, Z1, { todas: liso('#3d4f6b'), base: null });
      const f = m.rumo > 0 ? 'dir' : 'esq';
      B.caixa(X0 - 0.01, X1 + 0.01, y + 1.05, y + 1.35, Z0 + 0.1, Z1 - 0.1, { [f]: { k: 'jan_vidro', modo: 'esticar' }, topo: null, base: null });
      break;
    }
    case 'poste_fila': B.caixa(X0, X1, y, y + m.h, Z0, Z1, { todas: liso('#9aa0a6'), base: null }); break;
    case 'banco_espera': {
      B.caixa(X0, X1, y + 0.42, y + 0.47, Z0, Z1, { todas: liso('#2e3440'), base: null });
      for (const x of [X0 + 0.1, X1 - 0.1]) B.caixa(x - 0.03, x + 0.03, y, y + 0.42, Z0 + 0.05, Z1 - 0.05, { todas: liso('#9aa0a6'), base: null });
      break;
    }
    case 'mesa_gerente': {
      B.caixa(X0, X1, y + m.h - 0.04, y + m.h, Z0, Z1, { todas: liso('#6b4a2e') });
      for (const [x, z] of [[X0 + 0.05, Z0 + 0.05], [X1 - 0.05, Z0 + 0.05], [X0 + 0.05, Z1 - 0.05], [X1 - 0.05, Z1 - 0.05]]) B.caixa(x - 0.03, x + 0.03, y, y + m.h - 0.04, z - 0.03, z + 0.03, { todas: liso('#3a3a3a'), base: null });
      B.caixa((X0 + X1) / 2 - 0.25, (X0 + X1) / 2 + 0.25, y + m.h, y + m.h + 0.32, (Z0 + Z1) / 2 - 0.02, (Z0 + Z1) / 2 + 0.02, { todas: liso('#1a1a1a'), base: null });
      break;
    }
    case 'armario': B.caixa(X0, X1, y, y + m.h, Z0, Z1, { todas: liso('#8a8d91'), base: null }); break;
    case 'gravador': {
      B.caixa(X0, X1, y, y + 0.8, Z0, Z1, { todas: liso('#3a3a3a'), base: null });
      B.caixa(X0 + 0.05, X1 - 0.05, y + 0.8, y + 0.95, Z0 + 0.05, Z1 - 0.05, { todas: liso('#111111'), base: null });
      B.caixa(X0 + 0.02, X1 - 0.02, y + 0.95, y + 1.2, Z0 + 0.2, Z1 - 0.2, { todas: { k: 'jan_vidro', modo: 'esticar' }, base: null });
      break;
    }
    case 'cofre_forte': {
      /* a parede-cofre de aço e a porta redonda */
      B.caixa(X0, X1, y, y + m.h, Z0, Z1, { todas: liso('#7c8288'), base: null });
      const xc = (X0 + X1) / 2;
      B.caixa(xc - 0.9, xc + 0.9, y + 0.3, y + 2.1, Z1, Z1 + 0.12, { frente: liso('#a7adb3'), esq: liso('#a7adb3'), dir: liso('#a7adb3'), topo: liso('#a7adb3'), base: null, tras: null });
      B.caixa(xc - 0.35, xc + 0.35, y + 1.05, y + 1.35, Z1 + 0.12, Z1 + 0.2, { todas: liso('#555a60'), base: null });
      break;
    }
    case 'cofre': {
      B.caixa(X0, X1, y, y + m.h, Z0, Z1, { todas: liso('#50555b'), base: null });
      B.caixa(X0 + 0.08, X1 - 0.08, y + 0.1, y + m.h - 0.1, Z1, Z1 + 0.03, { frente: liso('#6e747a'), topo: null, base: null, tras: null });
      B.caixa((X0 + X1) / 2 - 0.07, (X0 + X1) / 2 + 0.07, y + m.h * 0.5, y + m.h * 0.5 + 0.14, Z1 + 0.03, Z1 + 0.07, { todas: liso('#c9ccd0'), base: null });
      break;
    }
    case 'bancada': {
      B.caixa(X0, X1, y + m.h - 0.05, y + m.h, Z0, Z1, { todas: liso('#6b4a2e') });
      B.caixa(X0, X1, y, y + m.h - 0.05, Z0, Z0 + 0.05, { todas: liso('#4a3322'), base: null });
      break;
    }
    case 'checkout': {
      /* a esteira e o caixa */
      B.caixa(X0, X1, y, y + m.h, Z0, Z1, { todas: liso('#c7c9cc'), base: null });
      B.caixa(X0 + 0.05, X1 - 0.05, y + m.h, y + m.h + 0.02, Z0 + 0.1, Z1 - 0.5, { todas: liso('#222222'), base: null });
      B.caixa(X1 - 0.3, X1 - 0.02, y + m.h, y + m.h + 0.28, Z1 - 0.45, Z1 - 0.1, { todas: liso('#3a3a3a'), base: null });
      break;
    }
    case 'gondola': {
      /* a gôndola dupla: as prateleiras com mercadoria dos dois lados */
      B.caixa(X0, X1, y, y + m.h, Z0, Z1, { dir: { k: 'prateleira', tinta: '#ffffff' }, esq: { k: 'prateleira', tinta: '#ffffff' }, frente: liso('#c62828'), tras: liso('#c62828'), topo: liso('#d0d0cc'), base: null });
      break;
    }
    case 'prateleira_baixa': {
      const p = { k: 'prateleira', tinta: '#ffffff' };
      B.caixa(X0, X1, y, y + m.h, Z0, Z1, { dir: p, esq: p, frente: liso('#9a9da1'), tras: liso('#9a9da1'), topo: liso('#d0d0cc'), base: null });
      break;
    }
    case 'prateleira_parede': {
      const p = { k: m.roupa ? 'armario' : 'prateleira', tinta: m.roupa ? '#f0ebe4' : '#ffffff' };
      const f = Math.abs(m.rumo) < 0.1 ? 'frente' : m.rumo > 0 ? 'dir' : 'esq';
      B.caixa(X0, X1, y, y + m.h, Z0, Z1, { todas: liso('#9a9da1'), [f]: p, base: null });
      break;
    }
    case 'geladeiras': {
      const f = Math.abs(m.rumo) < 0.1 ? 'frente' : m.rumo > 0 ? 'dir' : 'esq';
      const g = { k: 'geladeira', tinta: '#ffffff' };
      B.caixa(X0, X1, y, y + m.h, Z0, Z1, { todas: liso('#e8e8e4'), [f]: g, base: null });
      break;
    }
    case 'pilha': {
      for (let yy = y; yy < y + m.h - 0.1; yy += 0.3) B.caixa(X0, X1, yy, yy + 0.3, Z0, Z1, { todas: { k: 'engradado', tinta: '#ffffff' }, base: null });
      break;
    }
    case 'arara': {
      const ferro = liso('#8f959b');
      B.caixa(X0, X0 + 0.04, y, y + m.h, (Z0 + Z1) / 2 - 0.02, (Z0 + Z1) / 2 + 0.02, { todas: ferro, base: null });
      B.caixa(X1 - 0.04, X1, y, y + m.h, (Z0 + Z1) / 2 - 0.02, (Z0 + Z1) / 2 + 0.02, { todas: ferro, base: null });
      B.caixa(X0, X1, y + m.h - 0.04, y + m.h, (Z0 + Z1) / 2 - 0.02, (Z0 + Z1) / 2 + 0.02, { todas: ferro, base: null });
      const cores = ['#c62828', '#2b3a55', '#f2f2ee', '#2f7a46', '#e0b83a', '#7b4a8e', '#262626'];
      let i = 0;
      for (let x = X0 + 0.08; x < X1 - 0.06; x += 0.1) B.caixa(x - 0.035, x + 0.035, y + m.h - 0.72, y + m.h - 0.06, Z0 + 0.02, Z1 - 0.02, { todas: liso(cores[i++ % cores.length]), base: null });
      break;
    }
    case 'provador': {
      B.caixa(X0, X1, y, y + m.h, Z0, Z0 + 0.06, { todas: liso('#e5dfd5'), base: null });
      B.caixa(X0, X0 + 0.06, y, y + m.h, Z0, Z1, { todas: liso('#e5dfd5'), base: null });
      B.caixa(X0, X1, y + 0.25, y + m.h - 0.15, Z1 - 0.03, Z1, { todas: liso('#6d2b5e'), base: null });
      break;
    }
    case 'cobertura': {
      /* os quatro pilares, a testada e o forro da cobertura do posto */
      const h = m.h;
      for (const [x, z] of [[X0 + 1.2, Z0 + 0.8], [X1 - 1.2, Z0 + 0.8], [X0 + 1.2, Z1 - 0.8], [X1 - 1.2, Z1 - 0.8]]) B.caixa(x - 0.2, x + 0.2, 0, h, z - 0.2, z + 0.2, { todas: liso('#f2f1ec'), base: null, topo: null });
      B.caixa(X0, X1, h, h + 0.7, Z0, Z1, { frente: { k: 'posto_testeira' }, tras: { k: 'posto_testeira' }, esq: { k: 'posto_testeira' }, dir: { k: 'posto_testeira' }, topo: liso('#cfd2d4', 'laje'), base: { k: 'forro_posto' } });
      if (L.conta) L.conta.frentes.push({ x0: X0, x1: X1, y0: h, y1: h + 0.7, z: Z1, vaos: [] });
      break;
    }
    case 'ilha': {
      B.caixa(X0, X1, 0, m.h, Z0, Z1, { todas: liso('#e0b83a'), base: null });
      const xm = (X0 + X1) / 2;
      for (const z of [Z0 + 0.5, Z1 - 0.5]) B.caixa(xm - 0.28, xm + 0.28, m.h, m.h + 1.6, z - 0.2, z + 0.2, { frente: { k: 'posto_bomba', modo: 'esticar' }, tras: { k: 'posto_bomba', modo: 'esticar' }, esq: liso('#e8e8e4'), dir: liso('#e8e8e4'), topo: liso('#2e7d32'), base: null });
      break;
    }
    case 'totem': {
      const xm = (X0 + X1) / 2, zm = (Z0 + Z1) / 2;
      B.caixa(xm - 0.12, xm + 0.12, 0, m.h - 2.2, zm - 0.12, zm + 0.12, { todas: liso('#d0d0cc'), base: null });
      B.caixa(xm - 0.6, xm + 0.6, m.h - 2.2, m.h, zm - 0.12, zm + 0.12, { frente: { k: 'posto_totem', modo: 'esticar' }, tras: { k: 'posto_totem', modo: 'esticar' }, esq: liso('#2e7d32'), dir: liso('#2e7d32'), topo: liso('#2e7d32'), base: liso('#2e7d32') });
      break;
    }
  }
}

/* a câmera de teto (o "olho" preto no canto) */
function desenharCamera(B, c, h) {
  B.caixa(c.x - 0.06, c.x + 0.06, h - 0.2, h, c.z - 0.06, c.z + 0.06, { todas: liso('#e8e8e4'), base: null });
  const dx = Math.sin(c.rumo) * 0.12, dz = Math.cos(c.rumo) * 0.12;
  B.caixa(c.x + dx - 0.07, c.x + dx + 0.07, h - 0.32, h - 0.18, c.z + dz - 0.07, c.z + dz + 0.07, { todas: liso('#1a1a1a') });
}

function montarLoja(tipo) {
  return (B, p, l, conta) => {
    const L = plantaDaLoja(tipo, p.W, p.D, l.esquina || 'dir'), c = L.c;
    L.conta = conta;
    /* o piso (dentro), o forro */
    for (const z of L.zonas.loja) B.tampa([[z.x0, z.z1], [z.x1, z.z1], [z.x1, z.z0], [z.x0, z.z0]], PISO, 'piso_bar', false, { tinta: c.piso });
    for (const p2 of L.paredes) desenharParede(B, p2);
    for (const m of L.moveis) desenharMovel(B, m, L);
    L.conta = null;
    for (const cam of L.cameras) desenharCamera(B, cam, PE);
    /* a laje e a platibanda: cobre só a loja (a pista do posto fica aberta, com a cobertura dela) */
    for (const z of L.zonas.loja) {
      B.caixa(z.x0, z.x1, PE, PE + 0.18, z.z0, z.z1, { topo: liso('#bdbab2', 'laje'), base: liso('#f2f2ee'), frente: liso(c.fachada), tras: liso(c.fachada), esq: liso(c.fachada), dir: liso(c.fachada) });
      const hp = tipo === 'posto' ? 0.5 : Math.max(0.6, p.H - PE - 0.18), y1 = PE + 0.18 + hp;
      /* a platibanda (a da frente, na cor da faixa, leva o letreiro) */
      B.caixa(z.x0, z.x1, PE + 0.18, y1, z.z1 - 0.15, z.z1, { frente: liso(tipo === 'posto' ? c.fachada : c.faixa), tras: liso(c.fachada), topo: liso('#bdbab2'), esq: liso(c.fachada), dir: liso(c.fachada), base: null });
      /* a frente da platibanda é onde o letreiro vai (o decalque do nome) */
      if (conta && tipo !== 'posto') conta.frentes.push({ x0: z.x0, x1: z.x1, y0: PE + 0.18, y1, z: z.z1, vaos: [] });
      B.caixa(z.x0, z.x1, PE + 0.18, y1, z.z0, z.z0 + 0.15, { todas: liso(c.fachada), base: null });
      B.caixa(z.x0, z.x0 + 0.15, PE + 0.18, y1, z.z0 + 0.15, z.z1 - 0.15, { todas: liso(c.fachada), base: null });
      B.caixa(z.x1 - 0.15, z.x1, PE + 0.18, y1, z.z0 + 0.15, z.z1 - 0.15, { todas: liso(c.fachada), base: null });
    }
    /* a marquise sobre a porta da frente (menos no posto, que tem a cobertura) */
    if (tipo !== 'posto') for (const pt of L.portas.filter(q => q.rua === 'frente')) {
      B.caixa(pt.x - pt.larg / 2 - 0.4, pt.x + pt.larg / 2 + 0.4, 2.62, 2.72, L.zf - 0.02, Math.min(-0.02, L.zf + 0.05), { todas: liso(c.faixa), base: liso('#dcdcd8') });
    }
  };
}
export const TIPOS_LOJA = Object.fromEntries(TIPOS_DE_LOJA.map(t => ['loja_' + t, montarLoja(t)]));
