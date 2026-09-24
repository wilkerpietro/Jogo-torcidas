/* =========================================================
   A PROPOSTA DE EXPANSÃO (3ª versão)
   ---------------------------------------------------------
   A grade continua a da cidade: a mesma rua de 118,8 (6,1 m), a mesma
   quadra de 691 × 346 (35,6 × 17,8 m), as colunas de 810 em 810 e as
   linhas de 464,4 em 464,4 (a linha 2, a do estádio, é a alta: 960).

   A 2ª versão trouxe a borda em escada (12 quadras a oeste, 10 ao
   norte), o atacarejo na estrada norte, o Estádio Municipal a sudoeste,
   os três condomínios e as duas entradas com pórtico. A 3ª, com o que o
   dono circulou no mapa:
   - as duas favelas saem da cópia torta e nascem de novo nas manchas
     que ele desenhou (noroeste e sudoeste), com o mesmo jeito da favela
     do jogo (quadra miúda, casa encostada na casa, beco estreito), mas
     na grade da cidade: beco de norte a sul ou de leste a oeste. E
     encostam na cidade: a faixa de mato entre a mancha e a rua entra
     na favela, e a casa que bate na rua é aparada até a guia;
   - as duas avenidas transversais do oeste (a oeste e a noroeste2)
     saem: as quadras que elas cortavam voltam a ser quadra inteira, e a
     1,4 de hoje, que a avenida oeste rasgava, é refeita;
   - as quadras altas −3,2, −1,2 e 0,2 ganham uma rua no meio, de norte
     a sul (o quintal enorme some);
   - 0,7 e 1,7, −2,3 e −1,3, 0,−1 e 1,−1 viram uma quadra só cada par,
     por cima da rua que as separava.

   Os lotes saem com a mesma conta do `lotear()` da planta, só que com
   hash da posição no lugar do sorteio, e a favela com a mesma conta da
   favela da planta, com um sorteio próprio de semente fixa: a proposta
   é a mesma toda vez que a página abre.
   ========================================================= */
export const RUA = 118.8;
const PASSO_Y = 464.4;

const TIPOS = {
  casa:    { alt: [66, 80],   cor: ['#e8dcc0', '#d9c9a3', '#e2b9a6', '#cfd8c9', '#e6e2d6', '#d8c8b0', '#e9d3b3'] },
  sobrado: { alt: [112, 136], cor: ['#e3d3b2', '#c9b48a', '#d4a48f', '#b7c4c2', '#ded9cd'] },
  predio:  { alt: [160, 240], cor: ['#cfcac0', '#b9b4aa', '#d5d0c4', '#a9b0b6', '#e0dcd2'] },
  muro:    { alt: [38, 48],   cor: ['#b0a794', '#a59a86', '#bdb3a0', '#9d9585'] },
  galpao:  { alt: [96, 128],  cor: ['#9fa4a6', '#8f948f', '#a8a39a'] }
};
const COMERCIO = [
  'BAR DO ZÉ', 'BOTECO DA ESQUINA', 'BAR E MERCEARIA', 'PONTO DO CHOPE', 'BAR DO NEGUINHO', 'BOTEQUIM DA VILA',
  'LANCHONETE TRÊS IRMÃOS', 'MERCADINHO SÃO JOÃO', 'PADARIA PÃO QUENTE', 'AÇOUGUE BOI GORDO', 'SALÃO DA DONA MARIA',
  'BARBEARIA DO TIÃO', 'BORRACHARIA 24H', 'OFICINA DO GORDO', 'LOTÉRICA SORTE GRANDE', 'FARMÁCIA POPULAR',
  'MATERIAIS DE CONSTRUÇÃO', 'SORVETERIA GELADÃO', 'PASTEL DA FEIRA', 'LAN HOUSE CYBER', 'DEPÓSITO DE BEBIDAS',
  'CASA DE CARNES', 'ELETRÔNICA DO ZÉ', 'CHAVEIRO 24 HORAS', 'BAZAR PREÇO BOM', 'AUTO PEÇAS IRMÃOS',
  'MÓVEIS POPULARES', 'GÁS E ÁGUA', 'SALGADOS DA VÓ', 'ESPETINHO DO MINEIRO', 'MERCEARIA DOIS IRMÃOS',
  'COSTURA E CONSERTOS', 'VIDRAÇARIA CENTRAL', 'PEIXARIA MARÉ ALTA'
];
const RECADOS = [
  'VENDE-SE', 'ALUGA-SE', 'PINTA-SE CASAS', 'PRECISA-SE DE AJUDANTE', 'É PROIBIDO JOGAR LIXO', 'NÃO ESTACIONE',
  'ENTRADA DE VEÍCULOS', 'TE AMO MARIA', 'SAUDADES ETERNAS', 'DEUS É FIEL', 'PROIBIDO COLAR CARTAZ',
  'CUIDADO COM O CÃO', 'TEM ÁGUA', 'LAVA-SE ROUPA', 'CONSERTA-SE GELADEIRA'
];
/* a casa de muro precisa desse tanto de frente e de fundo (em metros) */
const MIN_MURO = { m1: [4.6, 4.6], m2: [4.8, 4.6], m3: [4.2, 4.3], m4: [3.6, 4.0] };

/* as quadras novas: coluna → [primeira linha, última linha] (dá mais de
   um intervalo por coluna). A coluna 1 nas linhas 1 a 3 é o lugar da
   favela de hoje. */
const GRADE = {
  '-4': [[2, 5]],
  '-3': [[1, 8]],
  '-2': [[-1, 10]],
  '-1': [[-2, 10]],
  '0':  [[-2, 10]],
  '1':  [[-3, 0], [1, 3]],
  '2':  [[-3, 0]],
  '3':  [[-2, 0]],
  '4':  [[-2, 0]],
  '5':  [[-2, 0]]
};
/* a quadra do estádio 2: seis quadras juntas, sem as ruas do meio */
const ESTADIO2 = { i: [-2, -1], j: [8, 10] };

/* o que vira equipamento, e não casa */
const EQUIP = {
  '1,1':  { tipo: 'praca',  nome: 'Praça da Vila', cor: '#5f9a4c',
            nota: 'No meio de onde era a favela: o bairro novo ganha a praça dele.' },
  '-2,4': { tipo: 'campo',  nome: 'Campo de várzea', cor: '#3f7f3a',
            nota: 'O segundo campo da cidade, pra pelada e pra briga de torcida.' },
  '-1,6': { tipo: 'ubs',    nome: 'Posto de saúde', cor: '#e2ddd0',
            nota: 'UBS pro oeste, no meio do bairro novo.' },
  '2,-1': { tipo: 'igreja', nome: 'Igreja', cor: '#d8cfb8',
            nota: 'A igreja do bairro novo do norte.' },
  '-4,4': { tipo: 'sede',   nome: 'Terreno para sede', cor: '#9a4f9a',
            nota: 'Lugar pra sede de uma torcida nova, na ponta oeste, longe do estádio.' },
  '5,0':  { tipo: 'sede',   nome: 'Terreno para sede', cor: '#9a4f9a',
            nota: 'Lugar pra sede de uma torcida nova, a duas quadras do estádio.' }
};
/* os condomínios: a quadra alta (linha 2) e a folha de cor de cada um */
const CONDOMINIOS = [
  { id: '1,2',  folha: 'torres_v1', t1: 'Edifício Horizonte', t2: 'Residencial Porto Belo',
    cores: 'concreto areia, vidro verde e tijolo vinho' },
  { id: '-2,2', folha: 'torres_v2', t1: 'Edifício Atlântico', t2: 'Residencial Monte Verde',
    cores: 'concreto branco, vidro fumê e pastilha grafite' },
  { id: '-4,2', folha: 'torres_v3', t1: 'Edifício Solar', t2: 'Residencial Ipê Amarelo',
    cores: 'concreto terracota, vidro bronze e tijolo mostarda' }
];

/* as quadras altas que ganham rua no meio (um corte de norte a sul) */
const PARTIDAS = ['-3,2', '-1,2', '0,2'];
/* os pares que viram uma quadra só, por cima da rua (de oeste pra leste) */
const JUNTAS = [['0,-1', '1,-1'], ['-2,3', '-1,3'], ['0,7', '1,7']];
/* as avenidas transversais que saem da proposta */
const SEM_AVENIDA = ['oeste', 'noroeste2'];

/* AS FAVELAS: as manchas que o dono circulou, em coordenada de planta */
const FAVELAS = [
  { id: 'noroeste', nome: 'Favela do Noroeste', semente: 913247,
    poly: [[-4230, 1530], [-4975, 1150], [-4985, 360], [-4580, -130], [-3935, -565], [-3290, -745], [-2745, -745],
           [-2450, -475], [-2375, -105], [-2595, -65], [-3040, -30], [-3170, 20], [-3170, 430], [-3735, 410],
           [-4045, 560], [-4060, 1150], [-4010, 1370]] },
  { id: 'sudoeste', nome: 'Favela do Sudoeste', semente: 481523,
    /* com o canto entre a favela e a cidade (a oeste de −3,6 a −3,8 e ao
       sul de −4,5) dentro: a favela encosta na quina da cidade */
    poly: [[-3100, 3120], [-3900, 3120], [-4000, 3500], [-4150, 4300], [-4310, 5010], [-4555, 5875], [-4310, 6125],
           [-3690, 6430], [-2950, 6555], [-2085, 6495], [-1215, 6310], [-720, 6000], [-660, 5660], [-1095, 5595],
           [-1590, 5445], [-2085, 5350], [-2160, 5195], [-2180, 4640], [-3230, 4565], [-3070, 4360]] }
];
/* as cores da favela do jogo */
const CORES_FAVELA = {
  tijolo:  ['#a4664a', '#9a5f45', '#ae6f52', '#95614a', '#b07354', '#8f5a42'],
  reboco:  ['#b0aca2', '#a39e93', '#bab5aa', '#9c968c', '#c2bcb0'],
  pintada: ['#d97b9c', '#4a9d97', '#d7a23c', '#6f8fb0', '#b5643f', '#7f9c5c', '#a83f3c', '#e8dcc0', '#c98b3f', '#dd8a4a', '#5f8fa8', '#c7d0c2']
};
const TELHAS_FAVELA = ['#b0603c', '#a85a38', '#bd6f45', '#9c5334', '#c07a52', '#ab6340'];
const LAJES_FAVELA = ['#9a958c', '#8f8a80', '#a6a096'];
const GRAFITE_FAVELA = RECADOS.concat(['RUA SEM MEDO', 'FAVELA VIVA', 'LUZ NO BECO', 'CRIA DA VILA', 'SOMOS DAQUI', 'FÉ NÃO FALHA',
  'MC ZINHO', 'DJ BEIJA-FLOR', 'RESPEITA QUEM SUBIU O MORRO', 'BONDE DO BECO', 'TUDO NOSSO', 'ISSO AQUI É NOSSO']);
const TINTAS_PIXO = ['#2a2a28', '#1c2a44', '#3a1f1f', '#23331f', '#b02a22', '#22439a'];
/* as casas grandes da favela do jogo: largura e fundo em metros, quantas,
   e a distância mínima entre duas iguais */
const CASAS_GRANDES = [
  { modelo: 'bar',     w: [5.0, 7.8], d: 4.3, n: 2, longe: 30, tipo: 'sobrado', alt: 6.0, parede: 'tijolo', esquina: true },
  { modelo: 'f2',      w: [5.6, 8.6], d: 4.4, n: 3, longe: 18, tipo: 'casa',    alt: 3.4, parede: 'pintada' },
  { modelo: 'lanche',  w: [5.0, 7.4], d: 4.3, n: 2, longe: 22, tipo: 'sobrado', alt: 6.2, parede: 'pintada' },
  { modelo: 'f1',      w: [5.0, 7.6], d: 4.4, n: 4, longe: 15, tipo: 'sobrado', alt: 8.2, parede: 'tijolo' },
  { modelo: 'escada',  w: [6.4, 8.6], d: 4.3, n: 2, longe: 15, perto: 5, tipo: 'sobrado', alt: 6.1, parede: 'reboco', esquina: true },
  { modelo: 'varal',   w: [5.0, 7.0], d: 4.3, n: 2, longe: 15, perto: 5, tipo: 'sobrado', alt: 6.2, parede: 'tijolo' },
  { modelo: 'garagem', w: [6.2, 8.2], d: 4.3, n: 2, longe: 15, perto: 5, tipo: 'sobrado', alt: 5.6, parede: 'tijolo' },
  { modelo: 'base',    w: [6.0, 8.2], d: 4.3, n: 2, longe: 15, perto: 5, tipo: 'sobrado', alt: 6.5, parede: 'tijolo' }
];
const dentroPol = (x, y, pol) => {
  let d = false;
  for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) {
    const [xi, yi] = pol[i], [xj, yj] = pol[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) d = !d;
  }
  return d;
};

export function gerarProposta(P) {
  const K = P.CIDADE, CALC = K.CALC, M = P.METRO;
  const par8 = v => Math.round(v / 8) * 8;
  const hash = (...n) => {
    let h = 2166136261;
    for (const v of n) { h = Math.imul(h ^ Math.round(v * 7 + 3), 16777619); h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; }
    return h >>> 0;
  };
  const sorte = (...n) => hash(...n) / 4294967296;
  const entre = (a, b, ...n) => a + sorte(...n) * (b - a);
  const cruza = (a, b, m) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.y0 < b.y1 + m && a.y1 > b.y0 - m;
  const MARGEM = RUA / 2 + 4;

  /* ---- a grade: as colunas e as linhas de hoje, e as novas no mesmo passo ---- */
  const cx0 = K.COLUNAS[0].c, passoX = K.COLUNAS[1].c - K.COLUNAS[0].c;
  const ly0 = K.LINHAS[0].c;
  const colX = i => i >= 1 ? [K.bordasX[2 * i], K.bordasX[2 * i + 1]]
                           : [cx0 + (i - 1) * passoX + RUA / 2, cx0 + i * passoX - RUA / 2];
  const linY = j => j >= 1 ? [K.bordasY[2 * j], K.bordasY[2 * j + 1]]
                           : [ly0 + (j - 1) * PASSO_Y + RUA / 2, ly0 + j * PASSO_Y - RUA / 2];

  /* ---- as avenidas da proposta ---- */
  const av = id => K.AVENIDAS.find(a => a.id === id);
  const avenidas = [], avenidasTiradas = K.AVENIDAS.filter(a => SEM_AVENIDA.includes(a.id));
  /* a borda do mundo: as favelas mandam no oeste e no sul */
  const polys = FAVELAS.flatMap(f => f.poly);
  const mundoY1 = Math.max(6100, ...polys.map(p => p[1])) + 300;
  for (const a of K.AVENIDAS) {
    if (SEM_AVENIDA.includes(a.id)) continue;
    const p = a.pontos.map(q => q.slice());
    const n = p.length;
    if (a.id === 'norte') p[1] = [p[1][0], -2750];                               // a estrada de entrada do norte
    else if (a.id === 'noroeste') {
      /* o último trecho segue até encontrar a estrada norte: vira um entroncamento */
      const [xa, ya] = p[n - 2], [xb, yb] = p[n - 1];
      const xn = av('norte').pontos[0][0], s = (xn - xa) / (xb - xa);
      p[n - 1] = [xn, ya + (yb - ya) * s];
    } else if (a.id === 'sudoeste') {
      /* a estrada de entrada do sul: o primeiro ponto desce até a borda nova */
      const [xa, ya] = p[1], [xb, yb] = p[0], yN = mundoY1;
      p[0] = [xb + (xb - xa) * (yN - yb) / (yb - ya), yN];
    } else if (a.id === 'beiramar') {
      /* a beira-mar termina nas duas pontas da orla, com retorno */
      const yN = linY(-2)[0] - RUA / 2, yS = linY(10)[1] + RUA;
      const [xa, ya] = p[n - 2], [xb, yb] = p[n - 1];
      const s = (yS - ya) / (yb - ya);
      p[n - 1] = [xa + (xb - xa) * s, yS];
      p.unshift([p[0][0], yN]);
    }
    avenidas.push({ id: a.id, l: a.l, pontos: p });
  }
  const distSeg = (x, y, [ax, ay], [bx, by]) => {
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    const t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)) : 0;
    return Math.hypot(x - ax - t * dx, y - ay - t * dy);
  };
  const distAvenida = (x, y, a) => { let d = Infinity; for (let k = 1; k < a.pontos.length; k++) d = Math.min(d, distSeg(x, y, a.pontos[k - 1], a.pontos[k])); return d; };
  const naAvenida = (x, y, m = 0) => avenidas.some(a => distAvenida(x, y, a) < a.l / 2 + m);

  const cantos = l => K.cantosDoLote(l).slice(0, 4);
  const bbOf = pts => ({ x0: Math.min(...pts.map(p => p[0])), x1: Math.max(...pts.map(p => p[0])),
                         y0: Math.min(...pts.map(p => p[1])), y1: Math.max(...pts.map(p => p[1])) });
  const FAV = K.BEIRA.filter(l => l.favela);
  const favBB = bbOf(FAV.flatMap(cantos));

  /* ---- o atacarejo, na estrada norte: de frente pra estrada, antes do pórtico ---- */
  const A0 = K.ATACADEX;
  let atacadex = null;
  if (A0) {
    const norte = av('norte'), xN = norte.pontos[0][0];
    const zP = 20;                                                        // o estacionamento: 20 m até a guia
    const W = A0.W, D = A0.D;
    const f = { x0: xN + norte.l / 2 + CALC + 30 + zP * M, y0: -2560 };
    f.x1 = f.x0 + D * M; f.y1 = f.y0 + W * M;
    /* a borda do estacionamento agora é reta: as vagas, o totem e os
       postes da guia são refeitos com a mesma conta da planta */
    const m0 = A0.massa;
    const massa = { ...m0, norte: [[0, zP], [W, zP]], zNorte: () => zP };
    massa.vagas = [];
    for (const [z0, z1] of [[2.2, 7.2], [13.0, 18.0]])
      for (let x = m0.E0 + 0.4; x + 2.5 <= m0.E1 - 0.4 + 1e-6; x += 2.5) {
        if (x < m0.faixa.x1 && x + 2.5 > m0.faixa.x0) continue;
        if (zP < z1 + 0.6) continue;
        massa.vagas.push({ x0: x, x1: x + 2.5, z0, z1 });
      }
    massa.totem = { ...m0.totem, z: zP - 1.3 };
    massa.postes = m0.postes.map(p => ({ x: p.x, z: zP - 0.6 }));
    const tt = massa.totem;
    massa.volumes = m0.volumes.slice(0, -1).concat([{ x0: tt.x - tt.larg / 2, x1: tt.x + tt.larg / 2, z0: tt.z - tt.esp / 2, z1: tt.z + tt.esp / 2, alt: tt.alt }]);
    const noMundo = (lx, lz) => [f.x0 - lz * M, f.y0 + lx * M];         // o referencial do marco, frente pro oeste
    const volumes = massa.volumes.map(v => {
      const [ax, ay] = noMundo(v.x0, v.z0), [bx, by] = noMundo(v.x1, v.z1);
      return { x0: Math.min(ax, bx), x1: Math.max(ax, bx), y0: Math.min(ay, by), y1: Math.max(ay, by), alt: v.alt * M, base: (v.base || 0) * M };
    });
    const area = [[f.x0 - zP * M, f.y0], [f.x1, f.y0], [f.x1, f.y1], [f.x0 - zP * M, f.y1]];
    atacadex = { pc: { ...A0, frente: 'o', fatia: f, massa, area, volumes }, area, volumes, bb: bbOf(area) };
  }

  /* ---- os pórticos: onde a estrada cruza a borda da cidade ---- */
  const porticos = [];
  {
    const n = av('norte'), xN = n.pontos[0][0];
    porticos.push({ id: 'norte', nome: 'Pórtico da entrada norte', x: xN, y: linY(-2)[0] - RUA - 88, dir: [0, 1], l: n.l });
    const s = avenidas.find(a => a.id === 'sudoeste').pontos, [ax, ay] = s[0], [bx, by] = s[1];
    const yP = linY(10)[1] + RUA + 84, t = (yP - ay) / (by - ay);
    const L = Math.hypot(bx - ax, by - ay);
    porticos.push({ id: 'sul', nome: 'Pórtico da entrada sul', x: ax + (bx - ax) * t, y: yP, dir: [(bx - ax) / L, (by - ay) / L], l: av('sudoeste').l });
  }

  /* ---- as células ---- */
  const celulas = [];
  const nova = (i, j, x0, x1, y0, y1, parte, extra) => celulas.push({ i, j, x0, x1, y0, y1, parte: parte || '', ...extra });
  const xn = av('norte').pontos[0][0], ln = av('norte').l;
  const noEstadio2 = (i, j) => i >= ESTADIO2.i[0] && i <= ESTADIO2.i[1] && j >= ESTADIO2.j[0] && j <= ESTADIO2.j[1];
  const deHoje = id => K.QUADRAS.find(q => q.i + ',' + q.j === id);
  /* as quadras de hoje que a proposta refaz: a que a avenida tirada
     rasgava (sem a avenida, o rasgo ficaria vazio) e a que se junta
     com uma nova */
  const cortada = q => {
    for (let a = 0; a <= 8; a++) for (let b = 0; b <= 8; b++) {
      const x = q.x0 + (q.x1 - q.x0) * a / 8, y = q.y0 + (q.y1 - q.y0) * b / 8;
      if (avenidasTiradas.some(av => { let d = Infinity; for (let k = 1; k < av.pontos.length; k++) d = Math.min(d, distSeg(x, y, av.pontos[k - 1], av.pontos[k])); return d < av.l / 2 + CALC; })) return true;
    }
    return false;
  };
  const substitui = new Set(K.QUADRAS.filter(cortada).map(q => q.i + ',' + q.j));
  for (const par of JUNTAS) for (const id of par) if (deHoje(id)) substitui.add(id);
  const ids = [];
  for (const [ci, faixas] of Object.entries(GRADE)) for (const [ja, jb] of faixas) for (let j = ja; j <= jb; j++) ids.push([+ci, j]);
  for (const id of substitui) { const [i, j] = id.split(',').map(Number); if (!ids.some(([a, b]) => a === i && b === j)) ids.push([i, j]); }
  const juntaDe = new Map();
  for (const par of JUNTAS) for (const id of par) juntaDe.set(id, par);
  const feitas = new Set();
  for (const [i, j] of ids) {
    const id = i + ',' + j;
    if (noEstadio2(i, j) || feitas.has(id)) continue;
    const par = juntaDe.get(id);
    if (par) {
      /* as duas viram uma, por cima da rua que as separava */
      const rs = par.map(k => { const [a, b] = k.split(',').map(Number); return [colX(a), linY(b)]; });
      const [a0, b0] = par[0].split(',').map(Number);
      nova(a0, b0, Math.min(...rs.map(r => r[0][0])), Math.max(...rs.map(r => r[0][1])),
           Math.min(...rs.map(r => r[1][0])), Math.max(...rs.map(r => r[1][1])), '',
           { id: par.join('+'), rotulo: par[0].split(',')[0] + '+' + par[1].split(',')[0] + ',' + par[0].split(',')[1] +
               (par[0].split(',')[1] !== par[1].split(',')[1] ? '+' + par[1].split(',')[1] : ''),
             juntas: par.slice(), substitui: par.filter(k => deHoje(k)), sal: 3 });
      for (const k of par) feitas.add(k);
      continue;
    }
    feitas.add(id);
    const [x0, x1] = colX(i), [y0, y1] = linY(j);
    if (PARTIDAS.includes(id)) {
      /* a quadra alta com a rua no meio, de norte a sul */
      const xm = (x0 + x1) / 2;
      nova(i, j, x0, xm - RUA / 2, y0, y1, 'o', { sal: 1, partida: true });
      nova(i, j, xm + RUA / 2, x1, y0, y1, 'l', { sal: 2, partida: true });
    } else if (xn > x0 && xn < x1) {
      /* a avenida norte sobe reta pelo meio da coluna do estádio e parte a quadra em duas */
      nova(i, j, x0, xn - ln / 2, y0, y1, 'o', { sal: 1 }); nova(i, j, xn + ln / 2, x1, y0, y1, 'l', { sal: 2 });
    } else nova(i, j, x0, x1, y0, y1, '', substitui.has(id) ? { substitui: [id], refeita: true } : {});
  }
  /* a quadra do estádio 2 */
  const e2 = { x0: colX(ESTADIO2.i[0])[0], x1: colX(ESTADIO2.i[1])[1], y0: linY(ESTADIO2.j[0])[0], y1: linY(ESTADIO2.j[1])[1] };
  const estadio2 = {
    dx: (e2.x0 + e2.x1) / 2 - (P.QEST_X0 + P.QEST_X1) / 2,
    dy: (e2.y0 + e2.y1) / 2 - (P.QEST_Y0 + P.QEST_Y1) / 2,
    nome: 'Estádio Municipal'
  };
  estadio2.qest = { x0: P.QEST_X0 + estadio2.dx, x1: P.QEST_X1 + estadio2.dx, y0: P.QEST_Y0 + estadio2.dy, y1: P.QEST_Y1 + estadio2.dy };

  const quadras = [], fora = [];
  for (const c of celulas) {
    const id = c.id || c.i + ',' + c.j + c.parte;
    /* nada de quadra debaixo do atacarejo */
    if (atacadex && cruza(c, atacadex.bb, MARGEM)) { fora.push({ ...c, id, motivo: 'atacadex' }); continue; }
    c.id = id;
    c.ix0 = c.x0 + CALC; c.ix1 = c.x1 - CALC; c.iy0 = c.y0 + CALC; c.iy1 = c.y1 - CALC;
    c.equip = EQUIP[c.i + ',' + c.j] && !c.parte && !c.juntas ? { ...EQUIP[c.i + ',' + c.j] } : null;
    c.lotes = [];
    quadras.push(c);
  }
  quadras.push({ i: -2, j: 8, parte: '', id: 'estadio2', ...e2, ix0: e2.x0 + CALC, ix1: e2.x1 - CALC, iy0: e2.y0 + CALC, iy1: e2.y1 - CALC,
                 lotes: [], equip: { tipo: 'estadio', nome: estadio2.nome, cor: '#9d9a90',
                                     nota: 'Cópia do quarteirão do estádio, com a esplanada em volta: o estádio de outro clube da cidade.' } });

  /* ---- os condomínios: o par de prédios na ponta oeste da quadra alta ---- */
  const baldio = K.QUADRAS.find(q => q.equip && q.equip.pecas.some(p => p.k === 'modelo' && p.modelo === 'torre1'));
  const torres0 = baldio ? baldio.equip.pecas.filter(p => p.k === 'modelo' && /^torre/.test(p.modelo)) : [];
  const volumesDaFatia = (vs, f) => (vs || []).filter(v => v.x0 >= f.x0 - 1 && v.x1 <= f.x1 + 1 && v.y0 >= f.y0 - 1 && v.y1 <= f.y1 + 1);
  const condominios = [];
  for (const cd of CONDOMINIOS) {
    const q = quadras.find(q => q.id === cd.id);
    if (!q || torres0.length < 2) continue;
    const L = 380, meio = q.iy0 + (q.iy1 - q.iy0) / 2;
    const torres = torres0.map(pc => {
      const f = { x0: q.ix0, x1: q.ix0 + L, y0: pc.modelo === 'torre1' ? q.iy0 : meio, y1: pc.modelo === 'torre1' ? meio : q.iy1 };
      const dx = f.x0 - pc.fatia.x0, dy = f.y0 - pc.fatia.y0;
      const volumes = volumesDaFatia(baldio.equip.volumes, pc.fatia).map(v => ({ ...v, x0: v.x0 + dx, x1: v.x1 + dx, y0: v.y0 + dy, y1: v.y1 + dy }));
      return { ...pc, fatia: f, folha: cd.folha, nome: pc.modelo === 'torre1' ? cd.t1 : cd.t2, volumes, condominio: cd.id };
    });
    q.equip = { tipo: 'condominio', nome: 'Condomínio ' + cd.t1.replace('Edifício ', ''), cor: '#b5afa0', torres, cores: cd.cores,
                nota: `${cd.t1} e ${cd.t2}: os mesmos dois prédios do baldio, em ${cd.cores}.` };
    q.faixaLotes = { x0: q.ix1 - 112, x1: q.ix1, y0: q.iy0, y1: q.iy1 };  // a fileira de casas do outro lado
    q.jardim = { x0: q.ix0 + L, x1: q.ix1 - 112, y0: q.iy0, y1: q.iy1 };
    condominios.push({ q, torres, ...cd });
  }

  /* ---- os lotes: a conta do `lotear()`, com hash no lugar do sorteio ---- */
  const tocaAvenida = l => {
    const xs = [l.x0, (l.x0 + l.x1) / 2, l.x1], ys = [l.y0, (l.y0 + l.y1) / 2, l.y1];
    for (const x of xs) for (const y of ys) if (naAvenida(x, y, CALC + 4)) return true;
    return false;
  };
  const noEstadio = l => (l.x1 > P.QEST_X0 && l.x0 < P.QEST_X1 && l.y1 > P.QEST_Y0 && l.y0 < P.QEST_Y1) || cruza(l, estadio2.qest, 0);
  const perto = q => q.j <= 0 && q.i >= 3;                      // o norte perto do estádio: mais denso
  const LISTA_NORTE = ['casa', 'sobrado', 'sobrado', 'predio', 'galpao', 'casa', 'sobrado', 'muro'];
  const LISTA_OESTE = ['casa', 'casa', 'casa', 'casa', 'sobrado', 'sobrado', 'muro', 'galpao'];
  const lotear = (q, frentes) => {
    /* as duas metades da quadra partida (e a quadra juntada) têm o
       mesmo i,j: o sal separa o sorteio de uma do da outra */
    const si = q.i, sj = q.j + (q.sal || 0) * 1000;
    frentes.forEach((fr, fi) => {
      const hz = fr.f === 'n' || fr.f === 's';
      const a0 = hz ? fr.x0 : fr.y0, a1 = hz ? fr.x1 : fr.y1;
      if (a1 - a0 < 40) return;
      let a = a0, k = 0;
      while (a < a1 - 24) {
        let larg = par8(entre(72, 144, si, sj, fi, k, 2));
        if (a + larg > a1 - 36) larg = a1 - a;
        const lista = perto(q) ? LISTA_NORTE : LISTA_OESTE;
        const tipo = lista[Math.floor(sorte(si, sj, fi, k, 3) * lista.length)];
        const T = TIPOS[tipo];
        const l = { frente: fr.f, tipo, proposta: true,
                    x0: hz ? a : fr.x0, x1: hz ? a + larg : fr.x1,
                    y0: hz ? fr.y0 : a, y1: hz ? fr.y1 : a + larg,
                    alt: par8(entre(T.alt[0], T.alt[1], si, sj, fi, k, 4)) || T.alt[0],
                    cor: T.cor[hash(si, sj, fi, k, 5) % T.cor.length],
                    quadra: { i: q.i, j: q.j, proposta: true } };
        a += larg; k++;
        if (tocaAvenida(l) || noEstadio(l)) continue;
        /* o comércio e o recado na parede, na mesma proporção da cidade */
        if (tipo !== 'muro') {
          const r = sorte(si, sj, fi, k, 6);
          if (r < 0.26) l.placa = COMERCIO[hash(si, sj, fi, k, 7) % COMERCIO.length];
          else if (r < 0.46) l.pixacao = RECADOS[hash(si, sj, fi, k, 8) % RECADOS.length];
        } else if (sorte(si, sj, fi, k, 9) < 0.5) l.pixacao = RECADOS[hash(si, sj, fi, k, 8) % RECADOS.length];
        /* uma casa em oito vira casa de muro, se couber o modelo */
        if (tipo === 'casa' && !l.placa && sorte(si, sj, fi, k, 10) < 0.125) {
          const nS = l.frente === 'n' || l.frente === 's';
          const w = (nS ? l.x1 - l.x0 : l.y1 - l.y0) / M, d = (nS ? l.y1 - l.y0 : l.x1 - l.x0) / M;
          const m = ['m1', 'm2', 'm3', 'm4'][hash(si, sj, fi, k, 11) % 4];
          if (w >= MIN_MURO[m][0] && d >= MIN_MURO[m][1]) l.muro = m;
        }
        q.lotes.push(l);
      }
    });
  };
  for (const q of quadras) {
    if (q.equip && q.equip.tipo === 'condominio') {
      const r = q.faixaLotes;
      lotear(q, [{ f: 'l', x0: r.x0, x1: r.x1, y0: r.y0, y1: r.y1 }]);
      continue;
    }
    if (q.equip) continue;
    const largI = q.ix1 - q.ix0, altI = q.iy1 - q.iy0;
    if (largI < 40 || altI < 40) continue;
    let prof = par8(entre(88, 112, q.i, q.j + (q.sal || 0) * 1000, 1));
    const raso = altI < 2 * prof + 24 || largI < 2 * prof + 24;
    if (raso) prof = Math.min(altI, largI);
    /* a metade da quadra alta partida é estreita e comprida: duas
       fileiras de costas, uma pra cada rua do lado, sem quintal */
    const xm = q.ix0 + largI / 2, ym = q.iy0 + altI / 2;
    const frentes = raso && altI > largI && largI >= 150
      ? [{ f: 'o', x0: q.ix0, x1: xm, y0: q.iy0, y1: q.iy1 }, { f: 'l', x0: xm, x1: q.ix1, y0: q.iy0, y1: q.iy1 }]
      : raso && largI > altI && altI >= 150
      ? [{ f: 'n', x0: q.ix0, x1: q.ix1, y0: q.iy0, y1: ym }, { f: 's', x0: q.ix0, x1: q.ix1, y0: ym, y1: q.iy1 }]
      : raso
      ? (largI >= altI ? [{ f: 'n', x0: q.ix0, x1: q.ix1, y0: q.iy0, y1: q.iy1 }]
                       : [{ f: 'o', x0: q.ix0, x1: q.ix1, y0: q.iy0, y1: q.iy1 }])
      : [{ f: 'n', x0: q.ix0, x1: q.ix1, y0: q.iy0, y1: q.iy0 + prof },
         { f: 's', x0: q.ix0, x1: q.ix1, y0: q.iy1 - prof, y1: q.iy1 },
         { f: 'o', x0: q.ix0, x1: q.ix0 + prof, y0: q.iy0 + prof, y1: q.iy1 - prof },
         { f: 'l', x0: q.ix1 - prof, x1: q.ix1, y0: q.iy0 + prof, y1: q.iy1 - prof }];
    lotear(q, frentes);
    if (!raso) q.quintal = { x0: q.ix0 + prof, x1: q.ix1 - prof, y0: q.iy0 + prof, y1: q.iy1 - prof };
    /* a avenida que atravessa a quadra na diagonal pode não deixar lote
       nenhum: a sobra vira praça, como já é no centro */
    if (q.lotes.length < 3) {
      q.lotes = []; q.quintal = null;
      q.equip = { tipo: 'praca', nome: 'Praça', cor: '#5f9a4c', nota: 'A avenida corta a quadra na diagonal e não sobra lote: a sobra vira praça.' };
    }
  }

  /* ---- AS FAVELAS: primeiro a grade de ruas, casando com a da cidade;
     depois as casas nos quarteirões que ela deixa ----
     A grade da favela É a da cidade. Cada rua da cidade segue dentro da
     favela na mesma linha, só que estreita: a viela de 48 (2,5 m) no
     meio da faixa da rua. Onde a favela encosta numa quadra da cidade,
     a rua da cidade é a borda dela, e a casa dá direto pra rua. Cada
     quarteirão da grade que cai na favela vira miolo de favela, com a
     conta da favela da planta:
     - faixas de 86 a 124 de fundo separadas por beco de 32 a 42;
     - um ou dois becos de norte a sul (que às vezes não cortam a faixa);
     - em cada faixa, duas fileiras de costas, casa encostada na casa
       (42 a 66 de frente), cada uma virada pro seu beco.
     A mancha que o dono desenhou recorta as casas do lado do mato. */
  const barra = quadras.map(q => ({ x0: q.x0 - RUA, x1: q.x1 + RUA, y0: q.y0 - RUA, y1: q.y1 + RUA }))
    .concat(K.QUADRAS.filter(q => !substitui.has(q.i + ',' + q.j)).map(q => ({ x0: q.x0 - RUA, x1: q.x1 + RUA, y0: q.y0 - RUA, y1: q.y1 + RUA })))
    .concat(K.BEIRA.filter(l => !l.favela).map(l => bbOf(cantos(l))).filter(b => {
      /* a casa de beira que a proposta tira (debaixo da grade nova, ou
         longe de toda estrada que sobrou) não segura a favela */
      const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
      const coberta = quadras.some(q => cx > q.x0 - RUA && cx < q.x1 + RUA && cy > q.y0 - RUA && cy < q.y1 + RUA);
      return !coberta && avenidas.some(a => distAvenida(cx, cy, a) <= a.l / 2 + 260);
    }).map(b => ({ x0: b.x0 - 30, x1: b.x1 + 30, y0: b.y0 - 30, y1: b.y1 + 30 })))
    .concat(atacadex ? [{ x0: atacadex.bb.x0 - 60, x1: atacadex.bb.x1 + 60, y0: atacadex.bb.y0 - 60, y1: atacadex.bb.y1 + 60 }] : []);
  const livre = (x, y) => !barra.some(r => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1) && !naAvenida(x, y, CALC + 10) &&
                          !porticos.some(p => Math.hypot(p.x - x, p.y - y) < 280);
  /* a grade estendida: as linhas depois da 10 seguem no mesmo passo */
  const linYx = j => {
    if (j <= 10) return linY(j);
    const y0 = linY(10)[1] + RUA + (j - 11) * PASSO_Y;
    return [y0, y0 + PASSO_Y - RUA];
  };
  const faixaX = i => [colX(i)[1], colX(i + 1)[0]];                   // a faixa da rua entre a coluna i e a i+1
  const faixaY = j => [linYx(j)[1], linYx(j + 1)[0]];
  const meioX = i => (faixaX(i)[0] + faixaX(i)[1]) / 2, meioY = j => (faixaY(j)[0] + faixaY(j)[1]) / 2;
  /* onde a grade já é cidade: quadra nova, quadra de hoje, estádio, campo */
  const ocupadas = new Set();
  for (const q of quadras) {
    if (q.id === 'estadio2') { for (let i = ESTADIO2.i[0]; i <= ESTADIO2.i[1]; i++) for (let j = ESTADIO2.j[0]; j <= ESTADIO2.j[1]; j++) ocupadas.add(i + ',' + j); }
    else if (q.juntas) for (const id of q.juntas) ocupadas.add(id);
    else ocupadas.add(q.i + ',' + q.j);
  }
  for (const q of K.QUADRAS) if (!substitui.has(q.i + ',' + q.j)) ocupadas.add(q.i + ',' + q.j);
  for (let i = 0; i < K.grade.length; i++) for (let j = 0; j < (K.grade[i] || []).length; j++) {
    const c = K.grade[i][j];
    if (c && (c.tipo === 'estadio' || c.tipo === 'campo')) ocupadas.add(i + ',' + j);
  }
  const cidade = (i, j) => ocupadas.has(i + ',' + j);
  const VIELA = 48;
  const favelas = FAVELAS.map(F => gerarFavela(F));
  function gerarFavela(F) {
    let est = F.semente >>> 0;
    const rnd = () => {                                                  // mulberry32: sorteio próprio, semente fixa
      est = (est + 0x6D2B79F5) >>> 0; let t = est;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const ent = (a, b) => a + rnd() * (b - a), esc = l => l[Math.floor(rnd() * l.length)];
    /* A MANCHA: o traço do dono e, junto, a faixa estreita entre ele e a
       cidade (o ponto de fora cuja distância até a mancha mais a
       distância até a rua não passa de GAP), pra não sobrar mato entre
       a favela e a rua */
    const GAP = 340;
    const distPoly = (x, y) => { let d = Infinity; for (let i = 0, j = F.poly.length - 1; i < F.poly.length; j = i++) d = Math.min(d, distSeg(x, y, F.poly[j], F.poly[i])); return d; };
    const distBarra = (x, y) => { let d = Infinity; for (const r of barra) { const dx = Math.max(r.x0 - x, 0, x - r.x1), dy = Math.max(r.y0 - y, 0, y - r.y1); d = Math.min(d, Math.hypot(dx, dy)); } return d; };
    const naArea = (x, y) => dentroPol(x, y, F.poly) || distPoly(x, y) + distBarra(x, y) <= GAP;
    const bb0 = bbOf(F.poly), bb = { x0: bb0.x0 - GAP, x1: bb0.x1 + GAP, y0: bb0.y0 - GAP, y1: bb0.y1 + GAP };
    const dentro = (x, y) => naArea(x, y) && livre(x, y);
    const cabe = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [(x0 + x1) / 2, (y0 + y1) / 2]].every(([x, y]) => dentro(x, y));
    /* a casa que bate na rua da cidade é aparada até a guia */
    const encaixar = (x0, x1, y0, y1) => {
      for (let it = 0; it < 4; it++) {
        const r = barra.find(r => x0 < r.x1 && x1 > r.x0 && y0 < r.y1 && y1 > r.y0);
        if (!r) break;
        const ops = [];
        if (r.x0 > x0) ops.push([x0, r.x0, y0, y1]);
        if (r.x1 < x1) ops.push([r.x1, x1, y0, y1]);
        if (r.y0 > y0) ops.push([x0, x1, y0, r.y0]);
        if (r.y1 < y1) ops.push([x0, x1, r.y1, y1]);
        const ok = ops.filter(([a, b, c, d]) => b - a >= 32 && d - c >= 36)
                      .sort((p, q) => (q[1] - q[0]) * (q[3] - q[2]) - (p[1] - p[0]) * (p[3] - p[2]));
        if (!ok.length) return null;
        [x0, x1, y0, y1] = ok[0];
      }
      return [x0, x1, y0, y1];
    };

    /* 1. OS QUARTEIRÕES: as células da grade que caem na mancha e não são cidade */
    const cels = [];
    for (let i = -10; i <= 1; i++) for (let j = -6; j <= 16; j++) {
      if (cidade(i, j)) continue;
      const [x0, x1] = colX(i), [y0, y1] = linYx(j);
      if (x1 < bb.x0 || x0 > bb.x1 || y1 < bb.y0 || y0 > bb.y1) continue;
      let alguma = false;
      for (let a = 0; a <= 6 && !alguma; a++) for (let b = 0; b <= 6 && !alguma; b++)
        if (dentro(x0 + (x1 - x0) * a / 6, y0 + (y1 - y0) * b / 6)) alguma = true;
      if (alguma) cels.push({ i, j, x0, x1, y0, y1 });
    }
    /* a borda de cada quarteirão: rua da cidade do lado de lá → a borda é
       a guia (a casa dá pra rua); senão, a viela corre no meio da faixa
       e o quarteirão avança até ela */
    for (const c of cels) {
      c.sb = { x0: cidade(c.i - 1, c.j) ? c.x0 : meioX(c.i - 1) + VIELA / 2, x1: cidade(c.i + 1, c.j) ? c.x1 : meioX(c.i) - VIELA / 2,
               y0: cidade(c.i, c.j - 1) ? c.y0 : meioY(c.j - 1) + VIELA / 2, y1: cidade(c.i, c.j + 1) ? c.y1 : meioY(c.j) - VIELA / 2 };
    }

    /* 2. AS VIELAS DA GRADE: a continuação das ruas da cidade, de cruzamento a cruzamento */
    const vielas = new Map();
    for (const c of cels) {
      const { i, j } = c;
      if (!cidade(i - 1, j)) vielas.set('v' + (i - 1) + ',' + j, [[meioX(i - 1), meioY(j - 1)], [meioX(i - 1), meioY(j)]]);
      if (!cidade(i + 1, j)) vielas.set('v' + i + ',' + j, [[meioX(i), meioY(j - 1)], [meioX(i), meioY(j)]]);
      if (!cidade(i, j - 1)) vielas.set('h' + i + ',' + (j - 1), [[meioX(i - 1), meioY(j - 1)], [meioX(i), meioY(j - 1)]]);
      if (!cidade(i, j + 1)) vielas.set('h' + i + ',' + j, [[meioX(i - 1), meioY(j)], [meioX(i), meioY(j)]]);
    }

    /* 3. O MIOLO: cada quarteirão em faixas, com os becos */
    const blocos = [], becosMiolo = [];
    for (const c of cels) {
      const sb = c.sb, H = sb.y1 - sb.y0, W = sb.x1 - sb.x0;
      if (H < 60 || W < 60) continue;
      const n = Math.max(1, Math.round((H + 37) / (112 + 37)));
      const gs = Array.from({ length: n - 1 }, () => Math.round(ent(32, 42)));
      const b = (H - gs.reduce((a, v) => a + v, 0)) / n;
      const nv = W > 560 ? (rnd() < 0.5 ? 1 : 2) : W > 330 ? 1 : 0;
      const xs = [];
      for (let k = 1; k <= nv; k++) xs.push(par8(sb.x0 + W * k / (nv + 1) + ent(-36, 36)));
      const gv = xs.map(() => Math.round(ent(32, 42)));
      let y = sb.y0;
      for (let k = 0; k < n; k++) {
        const v0 = y, v1 = y + b;
        const ext0 = k ? gs[k - 1] / 2 : 14, ext1 = k < n - 1 ? gs[k] / 2 : 14;
        let u = sb.x0;
        xs.forEach((x, m) => {
          if (rnd() > 0.82) return;                                        // o beco que não corta esta faixa
          blocos.push({ v0, v1, u0: u, u1: x - gv[m] / 2, c });
          becosMiolo.push({ pts: [[x, v0 - ext0], [x, v1 + ext1]], w: gv[m] });
          u = x + gv[m] / 2;
        });
        blocos.push({ v0, v1, u0: u, u1: sb.x1, c });
        if (k < n - 1) { becosMiolo.push({ pts: [[sb.x0 - 14, v1 + gs[k] / 2], [sb.x1 + 14, v1 + gs[k] / 2]], w: gs[k] }); y = v1 + gs[k]; }
      }
    }

    /* o campinho de terra, no quarteirão mais perto do meio da mancha que o comporte */
    let campinho = null;
    {
      const cx = F.poly.reduce((a, p) => a + p[0], 0) / F.poly.length, cy = F.poly.reduce((a, p) => a + p[1], 0) / F.poly.length;
      let melhor = Infinity;
      for (const c of cels) {
        const sb = c.sb, r = { x0: sb.x0 + 24, x1: sb.x0 + 24 + 360, y0: sb.y0 + 12, y1: sb.y0 + 12 + 200 };
        if (r.x1 > sb.x1 - 24 || r.y1 > sb.y1 - 12) continue;
        const d = Math.hypot((r.x0 + r.x1) / 2 - cx, (r.y0 + r.y1) / 2 - cy);
        if (d < melhor && cabe(r.x0 - 20, r.x1 + 20, r.y0 - 20, r.y1 + 20)) { melhor = d; campinho = r; }
      }
    }
    const noCampinho = (x0, x1, y0, y1) => !!campinho && x0 < campinho.x1 + 18 && x1 > campinho.x0 - 18 && y0 < campinho.y1 + 18 && y1 > campinho.y0 - 18;

    /* 4. AS CASAS GRANDES da favela: guardam o pedaço delas (a faixa inteira, de beco a beco) */
    const reservas = [], lotes = [];
    const conta = new Map();
    for (let rodada = 0; rodada < 8; rodada++) for (const md of CASAS_GRANDES) {
      if ((conta.get(md) || 0) >= md.n || !blocos.length) continue;
      for (let t = 0; t < 60; t++) {
        const bl = blocos[Math.floor(rnd() * blocos.length)];
        if ((bl.v1 - bl.v0) / M < md.d) continue;
        const w = par8(ent(md.w[0], md.w[1]) * M);
        const ponta = md.esquina ? (rnd() < 0.5 ? 'oeste' : 'leste') : null;
        const u0 = ponta === 'oeste' ? bl.u0 : ponta === 'leste' ? bl.u1 - w : par8(ent(bl.u0 + 60, bl.u1 - 60 - w));
        const u1 = u0 + w;
        if (u0 < bl.u0 || u1 > bl.u1 || !cabe(u0, u1, bl.v0, bl.v1) || noCampinho(u0, u1, bl.v0, bl.v1)) continue;
        if (reservas.some(r => r.bl === bl && u0 < r.u1 + 8 && u1 > r.u0 - 8)) continue;
        const cx = (u0 + u1) / 2, cy = (bl.v0 + bl.v1) / 2;
        if (reservas.some(r => Math.hypot(r.cx - cx, r.cy - cy) < (r.md === md ? md.longe : (md.perto || 8)) * M)) continue;
        reservas.push({ bl, u0, u1, md, ponta, cx, cy });
        conta.set(md, (conta.get(md) || 0) + 1);
        break;
      }
    }

    /* 5. AS CASAS, nos pedaços que sobram */
    const casa = (x0, x1, y0, y1, fr) => {
      if (!cabe(x0, x1, y0, y1)) {
        const e = encaixar(x0, x1, y0, y1);
        if (!e || !cabe(...e)) return;
        [x0, x1, y0, y1] = e;
      }
      if (noCampinho(x0, x1, y0, y1)) return;
      /* a mesma altura, cobertura e parede da favela da planta */
      let alt = par8(ent(52, 74));
      if (rnd() < 0.34) alt += par8(ent(28, 46));
      if (rnd() < 0.10) alt += par8(ent(26, 40));
      const r = rnd(), tipo = r < 0.68 ? 'casa' : r < 0.88 ? 'barraco' : 'galpao';
      const telha = tipo === 'casa' ? esc(TELHAS_FAVELA) : tipo === 'barraco' ? esc(LAJES_FAVELA) : '#9aa0a2';
      const p = rnd(), parede = p < 0.44 ? 'tijolo' : p < 0.68 ? 'reboco' : 'pintada';
      const l = { tipo, frente: fr, x0, x1, y0, y1, alt, cor: esc(CORES_FAVELA[parede]), telha, parede, favela: true, proposta: true };
      if (rnd() < 0.42) { l.pixacao = esc(GRAFITE_FAVELA); l.pixoTinta = esc(TINTAS_PIXO); }
      lotes.push(l);
    };
    const fileira = (u0, u1, y0, y1, fr) => {
      let u = u0;
      while (u < u1 - 32) {
        let w = Math.min(par8(ent(42, 66)), u1 - u);
        if (u1 - u - w < 32) w = u1 - u;
        if (w < 32) break;
        casa(u, u + w, y0, y1, fr);
        /* o vão entre duas casas é ou nada ou viela */
        u += w + (rnd() < 0.08 ? par8(ent(40, 56)) : ent(-1, 3));
      }
    };
    for (const bl of blocos) {
      const BV = bl.v1 - bl.v0;
      const dA = par8(BV * ent(0.42, 0.58));
      const linhas = BV < 88 ? [[bl.v0, bl.v1, rnd() < 0.5 ? 'n' : 's']] : [[bl.v0, bl.v0 + dA, 'n'], [bl.v0 + dA, bl.v1, 's']];
      const rs = reservas.filter(r => r.bl === bl).sort((p, q) => p.u0 - q.u0);
      const trechos = [];
      let u = bl.u0;
      for (const r of rs) { if (r.u0 - u > 32) trechos.push([u, r.u0]); u = r.u1; }
      if (bl.u1 - u > 32) trechos.push([u, bl.u1]);
      for (const [a0, a1] of trechos) for (const [y0, y1, fr] of linhas) fileira(a0, a1, y0, y1, fr);
    }
    for (const r of reservas) {
      const fr = rnd() < 0.5 ? 'n' : 's', md = r.md;
      const l = { tipo: md.tipo, frente: fr, x0: r.u0, x1: r.u1, y0: r.bl.v0, y1: r.bl.v1, alt: Math.round(md.alt * M),
                  cor: esc(CORES_FAVELA[md.parede]), telha: esc(TELHAS_FAVELA), parede: md.parede, favela: true, proposta: true, modelo: md.modelo };
      /* o lado da esquina, na mão de quem olha a fachada */
      if (r.ponta) l.esquina = (r.ponta === 'oeste') === (fr === 's') ? 'esq' : 'dir';
      if (rnd() < 0.42) { l.pixacao = esc(GRAFITE_FAVELA); l.pixoTinta = esc(TINTAS_PIXO); }
      lotes.push(l);
    }

    /* 6. O CHÃO DAS RUAS: a viela e o beco só onde tem casa do lado */
    const balde = new Map(), B = 120;
    for (const l of lotes) for (let a = Math.floor(l.x0 / B); a <= Math.floor(l.x1 / B); a++) for (let b = Math.floor(l.y0 / B); b <= Math.floor(l.y1 / B); b++) {
      const k = a + ',' + b; if (!balde.has(k)) balde.set(k, []); balde.get(k).push(l);
    }
    const temCasaPerto = (x, y, r) => {
      for (let a = Math.floor((x - r) / B); a <= Math.floor((x + r) / B); a++) for (let b = Math.floor((y - r) / B); b <= Math.floor((y + r) / B); b++)
        for (const l of balde.get(a + ',' + b) || []) if (x > l.x0 - r && x < l.x1 + r && y > l.y0 - r && y < l.y1 + r) return true;
      return false;
    };
    const becos = [];
    const recortar = (pts, w) => {
      const [[ax, ay], [bx, by]] = pts, L = Math.hypot(bx - ax, by - ay), N = Math.max(1, Math.ceil(L / 16));
      let atual = null;
      for (let k = 0; k <= N; k++) {
        const x = ax + (bx - ax) * k / N, y = ay + (by - ay) * k / N;
        const vale = temCasaPerto(x, y, w / 2 + 30) && !noCampinho(x, x, y, y);
        if (vale) { if (!atual) { atual = []; atual.w = w; becos.push(atual); } atual.push([x, y]); }
        else atual = null;
      }
    };
    for (const pts of vielas.values()) recortar(pts, VIELA);
    for (const bc of becosMiolo) recortar(bc.pts, bc.w);
    for (let k = becos.length - 1; k >= 0; k--) if (becos[k].length < 2) becos.splice(k, 1);

    /* umas árvores no que sobra: longe da casa e do beco */
    const arvores = [];
    const noBeco = (x, y) => becos.some(b => distSeg(x, y, b[0], b[b.length - 1]) < b.w / 2 + 12);
    for (let t = 0; t < 800 && arvores.length < 12; t++) {
      const x = ent(bb.x0, bb.x1), y = ent(bb.y0, bb.y1), r = ent(12, 19);
      if (!dentro(x, y) || noBeco(x, y) || noCampinho(x - r, x + r, y - r, y + r) || temCasaPerto(x, y, r + 6)) continue;
      arvores.push({ x, y, r });
    }
    const bbL = lotes.length ? bbOf(lotes.flatMap(l => [[l.x0, l.y0], [l.x1, l.y1]])) : bb0;
    return { id: F.id, nome: F.nome, poly: F.poly, lotes, becos, arvores, moitas: [], campinho, bb: bbL,
             grandes: reservas.length, quarteiroes: cels.length };
  }

  /* ---- o que a proposta cobre (pra esconder o mato, a beira e a favela de hoje) ---- */
  const coberto = (x, y, folga = RUA / 2) => quadras.some(q => x > q.x0 - folga && x < q.x1 + folga && y > q.y0 - folga && y < q.y1 + folga);
  const naFavelaNova = (x, y) => favelas.some(f => dentroPol(x, y, f.poly));
  const noAtacadex = (x, y, m = 0) => !!atacadex && x > atacadex.bb.x0 - m && x < atacadex.bb.x1 + m && y > atacadex.bb.y0 - m && y < atacadex.bb.y1 + m;

  const residenciais = quadras.filter(q => !q.equip);
  const lotesNovos = quadras.reduce((n, q) => n + q.lotes.length, 0);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const q of quadras) { x0 = Math.min(x0, q.x0); y0 = Math.min(y0, q.y0); x1 = Math.max(x1, q.x1); y1 = Math.max(y1, q.y1); }
  for (const f of favelas) for (const [px, py] of f.poly) { x0 = Math.min(x0, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
  const conta = {};
  for (const q of quadras) if (q.equip) conta[q.equip.tipo] = (conta[q.equip.tipo] || 0) + 1;
  return {
    quadras, fora, avenidas, avenidasTiradas, favelas, atacadex, porticos, estadio2, condominios, substitui,
    coberto, naFavelaNova, noAtacadex, naAvenida, distAvenida, favelaDeHoje: favBB,
    contagem: { quadras: quadras.length, residenciais: residenciais.length, equipamentos: quadras.length - residenciais.length,
                porTipo: conta, lotesNovos, casasFavela: favelas.map(f => f.lotes.length), casasFavelaHoje: FAV.length,
                quadrasTrocadas: substitui.size,
                quadrasHoje: K.QUADRAS.length, lotesHoje: K.QUADRAS.reduce((n, q) => n + q.lotes.length, 0) },
    limite: { x0: x0 - RUA, y0: y0 - RUA, x1, y1 },
    mundo: { x0: x0 - 400, y0: -2750, x1: K.VX0 + K.VW, y1: mundoY1 }
  };
}
