/* =========================================================
   A PROPOSTA DE EXPANSÃO — dobrar as quadras crescendo pra oeste e
   pro norte, sem mexer em nada do que já existe
   ---------------------------------------------------------
   A grade continua a da cidade: a mesma rua de 118,8 (6,1 m), a mesma
   quadra de 691 × 346 (35,6 × 17,8 m), as colunas de 810 em 810 e as
   linhas de 464,4 em 464,4. Entram três colunas a oeste (i = 0, −1 e
   −2; a 0 era a lasca de 70 entre a borda do mapa e a primeira rua) e
   duas linhas ao norte (j = 0 e −1). A favela, o atacarejo, o estádio,
   as avenidas e a orla ficam onde estão: quadra nova que encosta na
   favela ou no atacarejo encolhe (ou sai), a avenida corta a quadra na
   diagonal como já corta no centro, e a avenida norte, que é reta,
   parte a coluna do estádio em duas.

   Os lotes saem com a mesma conta do `lotear()` da planta (fundo de
   4 a 5,7 m, frente de 3,7 a 7,4 m, as quatro faces e o quintal no
   meio), só que com hash da posição no lugar do sorteio: a proposta é
   a mesma toda vez que a página abre.
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

/* o que vira equipamento na parte nova, e não casa */
const EQUIP = {
  '1,0':  { tipo: 'praca',  nome: 'Praça da Vila', cor: '#5f9a4c',
            nota: 'Entre a favela e o bairro novo do norte: a quadra que sobra rasa vira praça.' },
  '-1,2': { tipo: 'escola', nome: 'Escola estadual', cor: '#c9b27a',
            nota: 'O bairro novo do oeste precisa de escola; fica na avenida.' },
  '-2,4': { tipo: 'campo',  nome: 'Campo de várzea', cor: '#3f7f3a',
            nota: 'O segundo campo da cidade, pra pelada e pra briga de torcida.' },
  '-1,8': { tipo: 'ubs',    nome: 'Posto de saúde', cor: '#e2ddd0',
            nota: 'UBS pro oeste, perto da estrada do sudoeste.' },
  '2,-1': { tipo: 'igreja', nome: 'Igreja', cor: '#d8cfb8',
            nota: 'A igreja do bairro novo do norte.' },
  '-2,8': { tipo: 'sede',   nome: 'Terreno para sede', cor: '#9a4f9a',
            nota: 'Lugar pra sede de uma torcida nova, longe do estádio.' },
  '5,0':  { tipo: 'sede',   nome: 'Terreno para sede', cor: '#9a4f9a',
            nota: 'Lugar pra sede de uma torcida nova, a duas quadras do estádio.' }
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

  /* a grade: as colunas e as linhas de hoje, e as novas no mesmo passo */
  const cx0 = K.COLUNAS[0].c, passoX = K.COLUNAS[1].c - K.COLUNAS[0].c;
  const ly0 = K.LINHAS[0].c;
  const colX = i => i >= 1 ? [K.bordasX[2 * i], K.bordasX[2 * i + 1]]
                           : [cx0 + (i - 1) * passoX + RUA / 2, cx0 + i * passoX - RUA / 2];
  const linY = j => j >= 1 ? [K.bordasY[2 * j], K.bordasY[2 * j + 1]]
                           : [ly0 + (j - 1) * PASSO_Y + RUA / 2, ly0 + j * PASSO_Y - RUA / 2];
  const celulas = [];
  const nova = (i, j, x0, x1, y0, y1, parte) => celulas.push({ i, j, x0, x1, y0, y1, parte: parte || '' });
  for (const i of [-2, -1, 0]) for (let j = -1; j <= 10; j++) { const [x0, x1] = colX(i), [y0, y1] = linY(j); nova(i, j, x0, x1, y0, y1); }
  for (let i = 1; i <= 5; i++) for (const j of [-1, 0]) {
    const [x0, x1] = colX(i), [y0, y1] = linY(j);
    /* a avenida norte é reta e sobe pelo meio da coluna do estádio:
       ela parte a quadra em duas, e cada metade tem a sua calçada */
    const norte = K.AVENIDAS.find(a => a.id === 'norte');
    const xn = norte ? norte.pontos[0][0] : Infinity;
    if (xn > x0 && xn < x1) {
      nova(i, j, x0, xn - norte.l / 2, y0, y1, 'o');
      nova(i, j, xn + norte.l / 2, x1, y0, y1, 'l');
    } else nova(i, j, x0, x1, y0, y1);
  }

  /* ---- o que já existe e não pode ser pisado ---- */
  const cantos = l => K.cantosDoLote(l).slice(0, 4);
  const favela = K.BEIRA.filter(l => l.favela).map(l => {
    const c = cantos(l);
    return { x0: Math.min(...c.map(p => p[0])), x1: Math.max(...c.map(p => p[0])),
             y0: Math.min(...c.map(p => p[1])), y1: Math.max(...c.map(p => p[1])) };
  });
  const at = K.ATACADEX ? K.ATACADEX.area : null;
  const atRet = at ? { x0: Math.min(...at.map(p => p[0])), x1: Math.max(...at.map(p => p[0])),
                       y0: Math.min(...at.map(p => p[1])), y1: Math.max(...at.map(p => p[1])) } : null;
  const cruza = (a, b, m) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.y0 < b.y1 + m && a.y1 > b.y0 - m;
  const MARGEM = RUA / 2 + 4;
  const quadras = [], fora = [];
  for (const c of celulas) {
    const id = c.i + ',' + c.j + c.parte;
    /* o atacarejo: a quadra que ele só raspa encolhe (pro lado de lá
       dele: oeste, sul ou norte); a que ele toma sai */
    if (atRet && cruza(c, atRet, MARGEM)) {
      const x1 = atRet.x0 - MARGEM, y0 = atRet.y1 + MARGEM, y1 = atRet.y0 - MARGEM;
      /* das três saídas, a que deixa a quadra maior */
      const opcoes = [];
      if (x1 - c.x0 >= 300 && x1 < c.x1) opcoes.push({ area: (x1 - c.x0) * (c.y1 - c.y0), faz: () => { c.x1 = x1; } });
      if (c.y1 - y0 >= 220 && c.y0 < y0) opcoes.push({ area: (c.x1 - c.x0) * (c.y1 - y0), faz: () => { c.y0 = y0; } });
      if (y1 - c.y0 >= 220 && c.y1 > y1) opcoes.push({ area: (c.x1 - c.x0) * (y1 - c.y0), faz: () => { c.y1 = y1; } });
      if (!opcoes.length) { fora.push({ ...c, id, motivo: 'atacadex' }); continue; }
      opcoes.sort((a, b) => b.area - a.area)[0].faz();
      c.encolheu = 'atacadex';
    }
    /* a favela: encolhe do lado dela (a leste, ou a sul) */
    const f = favela.filter(r => cruza(c, r, MARGEM));
    if (f.length) {
      const x1 = Math.min(...f.map(r => r.x0)) - MARGEM, y1 = Math.min(...f.map(r => r.y0)) - MARGEM;
      if (x1 - c.x0 >= 360 && x1 < c.x1) { c.x1 = x1; c.encolheu = 'favela'; }
      else if (y1 - c.y0 >= 200 && y1 < c.y1) { c.y1 = y1; c.encolheu = 'favela'; }
      else { fora.push({ ...c, id, motivo: 'favela' }); continue; }
    }
    c.id = id;
    c.ix0 = c.x0 + CALC; c.ix1 = c.x1 - CALC; c.iy0 = c.y0 + CALC; c.iy1 = c.y1 - CALC;
    c.equip = EQUIP[c.i + ',' + c.j] && !c.parte ? EQUIP[c.i + ',' + c.j] : null;
    c.lotes = [];
    quadras.push(c);
  }

  /* ---- os lotes: a conta do `lotear()`, com hash no lugar do sorteio ---- */
  const tocaAvenida = l => {
    const xs = [l.x0, (l.x0 + l.x1) / 2, l.x1], ys = [l.y0, (l.y0 + l.y1) / 2, l.y1];
    for (const x of xs) for (const y of ys) if (K.naAvenida(x, y, CALC + 4)) return true;
    return false;
  };
  const noEstadio = l => l.x1 > P.QEST_X0 && l.x0 < P.QEST_X1 && l.y1 > P.QEST_Y0 && l.y0 < P.QEST_Y1;
  const perto = q => q.j <= 0 && q.i >= 3;                      // o norte perto do estádio: mais denso
  const LISTA_NORTE = ['casa', 'sobrado', 'sobrado', 'predio', 'galpao', 'casa', 'sobrado', 'muro'];
  const LISTA_OESTE = ['casa', 'casa', 'casa', 'casa', 'sobrado', 'sobrado', 'muro', 'galpao'];
  for (const q of quadras) {
    if (q.equip) continue;
    const largI = q.ix1 - q.ix0, altI = q.iy1 - q.iy0;
    if (largI < 40 || altI < 40) continue;
    let prof = par8(entre(88, 112, q.i, q.j, 1));
    const raso = altI < 2 * prof + 24 || largI < 2 * prof + 24;
    if (raso) prof = Math.min(altI, largI);
    const frentes = raso
      ? (largI >= altI ? [{ f: 'n', x0: q.ix0, x1: q.ix1, y0: q.iy0, y1: q.iy1 }]
                       : [{ f: 'o', x0: q.ix0, x1: q.ix1, y0: q.iy0, y1: q.iy1 }])
      : [{ f: 'n', x0: q.ix0, x1: q.ix1, y0: q.iy0, y1: q.iy0 + prof },
         { f: 's', x0: q.ix0, x1: q.ix1, y0: q.iy1 - prof, y1: q.iy1 },
         { f: 'o', x0: q.ix0, x1: q.ix0 + prof, y0: q.iy0 + prof, y1: q.iy1 - prof },
         { f: 'l', x0: q.ix1 - prof, x1: q.ix1, y0: q.iy0 + prof, y1: q.iy1 - prof }];
    frentes.forEach((fr, fi) => {
      const hz = fr.f === 'n' || fr.f === 's';
      const a0 = hz ? fr.x0 : fr.y0, a1 = hz ? fr.x1 : fr.y1;
      if (a1 - a0 < 40) return;
      let a = a0, k = 0;
      while (a < a1 - 24) {
        let larg = par8(entre(72, 144, q.i, q.j, fi, k, 2));
        if (a + larg > a1 - 36) larg = a1 - a;
        const lista = perto(q) ? LISTA_NORTE : LISTA_OESTE;
        const tipo = lista[Math.floor(sorte(q.i, q.j, fi, k, 3) * lista.length)];
        const T = TIPOS[tipo];
        const l = { frente: fr.f, tipo, proposta: true,
                    x0: hz ? a : fr.x0, x1: hz ? a + larg : fr.x1,
                    y0: hz ? fr.y0 : a, y1: hz ? fr.y1 : a + larg,
                    alt: par8(entre(T.alt[0], T.alt[1], q.i, q.j, fi, k, 4)) || T.alt[0],
                    cor: T.cor[hash(q.i, q.j, fi, k, 5) % T.cor.length],
                    quadra: { i: q.i, j: q.j, proposta: true } };
        a += larg; k++;
        if (tocaAvenida(l) || noEstadio(l)) continue;
        if (favela.some(r => cruza(l, r, 2)) || (atRet && cruza(l, atRet, 2))) continue;
        /* o comércio e o recado na parede, na mesma proporção da cidade */
        if (tipo !== 'muro') {
          const r = sorte(q.i, q.j, fi, k, 6);
          if (r < 0.26) l.placa = COMERCIO[hash(q.i, q.j, fi, k, 7) % COMERCIO.length];
          else if (r < 0.46) l.pixacao = RECADOS[hash(q.i, q.j, fi, k, 8) % RECADOS.length];
        } else if (sorte(q.i, q.j, fi, k, 9) < 0.5) l.pixacao = RECADOS[hash(q.i, q.j, fi, k, 8) % RECADOS.length];
        /* uma casa em oito vira casa de muro, se couber o modelo */
        if (tipo === 'casa' && !l.placa && sorte(q.i, q.j, fi, k, 10) < 0.125) {
          const nS = l.frente === 'n' || l.frente === 's';
          const w = (nS ? l.x1 - l.x0 : l.y1 - l.y0) / M, d = (nS ? l.y1 - l.y0 : l.x1 - l.x0) / M;
          const m = ['m1', 'm2', 'm3', 'm4'][hash(q.i, q.j, fi, k, 11) % 4];
          if (w >= MIN_MURO[m][0] && d >= MIN_MURO[m][1]) l.muro = m;
        }
        q.lotes.push(l);
      }
    });
    if (!raso) q.quintal = { x0: q.ix0 + prof, x1: q.ix1 - prof, y0: q.iy0 + prof, y1: q.iy1 - prof };
    /* a avenida que atravessa a quadra na diagonal pode não deixar lote
       nenhum: a sobra vira praça, como já é no centro */
    if (q.lotes.length < 3) {
      q.lotes = []; q.quintal = null;
      q.equip = { tipo: 'praca', nome: 'Praça', cor: '#5f9a4c', nota: 'A avenida corta a quadra na diagonal e não sobra lote: a sobra vira praça.' };
    }
  }

  const regulares = quadras.filter(q => !q.equip);
  const lotes = regulares.reduce((n, q) => n + q.lotes.length, 0);
  let xmin = Infinity, ymin = Infinity;
  for (const q of quadras) { xmin = Math.min(xmin, q.x0); ymin = Math.min(ymin, q.y0); }
  return {
    quadras, fora,
    contagem: { quadrasNovas: regulares.length, equipamentos: quadras.length - regulares.length, lotesNovos: lotes,
                quadrasHoje: K.QUADRAS.length, lotesHoje: K.QUADRAS.reduce((n, q) => n + q.lotes.length, 0) },
    limite: { x0: xmin - RUA, y0: ymin - RUA }
  };
}
