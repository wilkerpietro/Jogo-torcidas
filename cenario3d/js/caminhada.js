/* =========================================================
   A BRIGA NA CAMINHADA AO ESTÁDIO (o jogo 3D, 28/09/2026)

   O dono: "A cena de ataque em praça ou rua agora vão ser os ataques de
   alguma torcida em outra nos dias de caminhada ao estádio, que
   ajustamos mais cedo."

   Quando o jogo de feed abre uma cena de praça ou de rua num dia de jogo
   na praça do jogador (a investida que ele marcou, ou o ataque que ele
   sofre na concentração ou na pista), a briga não abre na foto: ela cai
   na cidade em 3D, no caminho das torcidas até o estádio — o mesmo
   plano do dia de jogo (dia_de_jogo.js): as rotas da sede até o portão
   de cada uma, e o ponto da emboscada que a IA acharia (a briga mandada,
   `escolha.briga`). A praça é a CONCENTRAÇÃO do alvo (a porta de onde
   ele sai, onde a torcida junta); a rua é o MEIO DO CAMINHO dele, fora
   dos arredores (onde a PM está), com quem ataca esperando escondido
   numa transversal.

   O tabuleiro do combate (1536 × 1024 px) é um retângulo da cidade em
   volta do ponto, deitado ao longo da rua do alvo, na escala das
   emboscadas da caravana (1 px = √0,3 unidade: 43 × 29 m; o corpo de 7
   px dá 20 cm de raio e a marcha, 1,7 m/s). A máscara sai da grade do
   passo do cenário (onde o corpo cabe: a rua, a calçada, o recuo das
   casas, sem parede, carro nem poste). O alvo nasce andando na rua
   dele, antes do ponto, com a faixa estendida na frente do bonde; quem
   ataca nasce na tocaia. O objetivo de quem é atacado é seguir pro
   estádio (a rua dele, pra frente); o de quem ataca, sumir pela rua de
   onde veio. A PM chega pelas duas pontas da rua do alvo.
   ========================================================= */
import { planejar } from './dia_de_jogo.js?v=2dbc7cb671';

const TAB = { W: 1536, H: 1024, CEL: 8 };
const ESCALA = Math.sqrt(0.3);          // unidade de mundo por px (a mesma das emboscadas da caravana)

/* o plano do dia (caro: as rotas de todas as torcidas do jogo), guardado
   pelo jogo e pela briga — a mesma briga aberta de novo não refaz */
let guardado = null;

/* `o`: { casa, fora (os clubes do jogo), a, v (as torcidas: quem ataca e
   quem é atacado), onde ('praca' | 'rua'), nosso (o id da torcida do
   jogador), nossoLado ('mandante' | 'visitante', o lado dela no combate),
   plano (o do dia de jogo que já está no ar, com a briga dentro) }.
   Devolve { cena, noMundo, doMundo, u, v, chao, escala, plano, br } ou
   { erro } */
export function brigaNaCaminhada(ctx, o) {
  const M = ctx.M;
  const chave = [ctx.P && ctx.P.cidade ? ctx.P.cidade() : '', o.casa, o.fora, o.a, o.v, o.onde].join('|');
  /* O DIA DE JOGO NO AR (o jogo 3D, dia3d.js): o plano é o do dia que está
     passando na cidade — a briga cai onde os dois bondes se encontram */
  let plano = o.plano || (guardado && guardado.chave === chave ? guardado.plano : null);
  if (!plano) {
    plano = planejar(ctx, { casa: o.casa, fora: o.fora, ia: 'paz', gente: 1, briga: { a: o.a, v: o.v, onde: o.onde } });
    guardado = { chave, plano };
  }
  if (plano.erro) return { erro: plano.erro };
  const br = plano.brigas && plano.brigas[0];
  if (!br) {
    const falta = [o.a, o.v].filter(id => !plano.vivos.some(b => b.t.id === id));
    return { erro: falta.length ? 'sem rota pra ' + falta.join(', ') : 'não achou onde a emboscada cabe' };
  }
  const A = br.a, V = br.v, Q = {};
  /* O TABULEIRO NA CIDADE: o x ao longo da rua do alvo (pra onde ele
     anda, no ponto), o y de lado; o meio puxado 35% do ponto pra tocaia */
  V.rua.ponto(br.sV, Q);
  const u = [Q.tx, Q.tz], vv = [-Q.tz, Q.tx];
  const P = [Q.x, Q.z];
  A.rua.ponto(br.sQ, Q);
  const H = [Q.x, Q.z];
  const cx = P[0] + (H[0] - P[0]) * 0.35, cz = P[1] + (H[1] - P[1]) * 0.35;
  const K = ESCALA, O = [cx - (TAB.W / 2 * u[0] + TAB.H / 2 * vv[0]) * K, cz - (TAB.W / 2 * u[1] + TAB.H / 2 * vv[1]) * K];
  const noMundo = (x, y) => [O[0] + (x * u[0] + y * vv[0]) * K, O[1] + (x * u[1] + y * vv[1]) * K];
  const doMundo = (wx, wz) => { const dx = wx - O[0], dz = wz - O[1]; return [(dx * u[0] + dz * u[1]) / K, (dx * vv[0] + dz * vv[1]) / K]; };
  const dentro = (x, y, m = 0) => x > m && y > m && x < TAB.W - m && y < TAB.H - m;

  /* A MÁSCARA: a célula de 8 px anda se o corpo (12 cm; o do combate tem
     20, e encosta na parede) cabe no meio dela, na grade do passo, não é
     estádio E É CHÃO DE RUA (o dono, 28/09/2026: "a cena iniciada deu
     vários membros da minha torcida presos dentro de terrenos, e quando o
     rival corre eles ficam parados e a cena não evolui porque tem um
     membro da torcida IA preso também"): o asfalto e a calçada do plano
     do dia (`R.publico`, dia_de_jogo.js). O bonde nasce em bloco em volta
     do ponto e quem não cabe é reencostado no vão livre mais perto — que
     era o miolo do lote, do terreno baldio, do quintal murado, de onde
     não se sai; e a cena só fecha quando não sobra ninguém de um lado */
  const COLS = TAB.W / TAB.CEL, ROWS = TAB.H / TAB.CEL, malha = new Uint8Array(COLS * ROWS);
  const g = ctx.grade, r = 0.12 * M, R = plano.R;
  const naRua = (wx, wz) => { if (!R || !R.publico) return true; const K = R.celula(wx, wz); return K >= 0 && R.publico[K] === 1; };
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const [wx, wz] = noMundo((i + 0.5) * TAB.CEL, (j + 0.5) * TAB.CEL);
    malha[j * COLS + i] = g && g.cabe(wx, wz, r) && naRua(wx, wz) && !(ctx.noEstadio && ctx.noEstadio(wx, wz)) ? 1 : 0;
  }
  const livre = (x, y) => { const i = Math.floor(x / TAB.CEL), j = Math.floor(y / TAB.CEL); return i >= 0 && j >= 0 && i < COLS && j < ROWS && malha[j * COLS + i] === 1; };
  /* o ponto andável mais perto de (x, y), em espiral (px) */
  const soltar = (x, y) => {
    if (livre(x, y)) return [x, y];
    for (let rr = 8; rr < 200; rr += 8) for (let k = 0; k < 16; k++) {
      const a = k / 16 * 2 * Math.PI, px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (dentro(px, py, 40) && livre(px, py)) return [px, py];
    }
    return [x, y];
  };
  /* SÓ O CHÃO LIGADO A QUEM BRIGA: o pedaço de rua que se alcança andando
     do alvo, da tocaia e do ponto; o que sobra (a calçada fechada entre
     muros, o recuo sem saída) sai da máscara — ninguém nasce nem fica
     preso onde não se chega */
  {
    const n = COLS * ROWS, visto = new Uint8Array(n), fila = new Int32Array(n);
    let ini = 0, fim = 0;
    const semente = ([x, y]) => {
      const i = Math.floor(x / TAB.CEL), j = Math.floor(y / TAB.CEL), c = j * COLS + i;
      if (i >= 0 && j >= 0 && i < COLS && j < ROWS && malha[c] && !visto[c]) { visto[c] = 1; fila[fim++] = c; }
    };
    V.rua.ponto(Math.max(0, br.sV - 10 * M), Q); semente(soltar(...doMundo(Q.x, Q.z)));
    semente(soltar(...doMundo(H[0], H[1])));
    semente(soltar(...doMundo(P[0], P[1])));
    while (ini < fim) {
      const c = fila[ini++], i = c % COLS, j = (c - i) / COLS;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ii = i + di, jj = j + dj, k = jj * COLS + ii;
        if (ii < 0 || jj < 0 || ii >= COLS || jj >= ROWS || visto[k] || !malha[k]) continue;
        visto[k] = 1; fila[fim++] = k;
      }
    }
    if (fim) for (let k = 0; k < n; k++) if (!visto[k]) malha[k] = 0;
  }
  const linhas = [];
  for (let j = 0; j < ROWS; j++) {
    const runs = []; let v0 = 0, n = 0;
    for (let i = 0; i < COLS; i++) { const v1 = malha[j * COLS + i]; if (v1 === v0) n++; else { runs.push(n); v0 = v1; n = 1; } }
    runs.push(n);
    linhas.push(runs.join(','));
  }
  /* um ponto da rua (Trilha) no tabuleiro, e o primeiro, andando de s pra
     s + passo·k, que sai da margem `m` (px) do tabuleiro */
  const naTab = (rua, s) => { rua.ponto(s, Q); return doMundo(Q.x, Q.z); };
  const ateABorda = (rua, s, passo, m) => {
    let ult = naTab(rua, s);
    for (let k = 1; k < 400; k++) {
      const ss = s + passo * k;
      if (ss < 0 || ss > rua.L) break;
      const p = naTab(rua, ss);
      if (!dentro(p[0], p[1], m)) break;
      ult = p;
    }
    return ult;
  };
  const dirEm = (rua, s, sinal) => { rua.ponto(s, Q); const x = Q.tx * sinal, z = Q.tz * sinal; return [x * u[0] + z * u[1], x * vv[0] + z * vv[1]]; };

  /* QUEM É QUEM: o lado do jogador no combate é o do bonde dele; o outro, do outro */
  const nossoLado = o.nossoLado === 'visitante' ? 'visitante' : 'mandante', outroLado = nossoLado === 'mandante' ? 'visitante' : 'mandante';
  const ladoDe = id => id === o.nosso ? nossoLado : outroLado;
  const ladoA = ladoDe(A.t.id), ladoV = ladoDe(V.t.id);
  const somosV = V.t.id === o.nosso;
  /* o alvo: andando na rua dele, 10 e 18 m antes do ponto (a frente e o grosso) */
  const sV1 = Math.max(0, br.sV - 10 * M), sV2 = Math.max(0, br.sV - 18 * M);
  const pV1 = soltar(...naTab(V.rua, sV1)), pV2 = soltar(...naTab(V.rua, sV2));
  const pA = soltar(...doMundo(H[0], H[1]));
  /* (na porta da sede — a concentração, antes de sair — o alvo está nas
     rodinhas, e quem ataca vem da esquina de lá; na pista, o alvo anda e
     quem ataca sai da tocaia na transversal) */
  const naPorta = !!br.naPorta;
  const spawns = [
    { id: ladoV + '1', rot: somosV ? (naPorta ? 'NÓS, NA CONCENTRAÇÃO' : 'NÓS, NA CAMINHADA') : (naPorta ? 'ELES, NA CONCENTRAÇÃO' : 'ELES, NA CAMINHADA'), lado: ladoV, x: Math.round(pV1[0]), y: Math.round(pV1[1]), jogador: somosV, entrada: 'saida_' + ladoV },
    { id: ladoV + '2', rot: somosV ? 'NÓS, O GROSSO' : 'ELES, O GROSSO', lado: ladoV, x: Math.round(pV2[0]), y: Math.round(pV2[1]), entrada: 'saida_' + ladoV },
    { id: ladoA + '1', rot: somosV ? (naPorta ? 'ELES, NA ESQUINA' : 'ELES, NA TOCAIA') : (naPorta ? 'NÓS, NA ESQUINA' : 'NÓS, NA TOCAIA'), lado: ladoA, x: Math.round(pA[0]), y: Math.round(pA[1]), jogador: !somosV, entrada: 'saida_' + ladoA }
  ];
  /* AS SAÍDAS: o alvo segue pro estádio (a rua dele, pra frente, até a
     borda); quem ataca bate e some — pela rua de onde o alvo veio (pra
     trás do grosso dele: como nas ruas do jogo de feed, cada um tem de
     furar o outro), pela rua de onde ele mesmo veio (pra trás da tocaia)
     ou pela rota dele pro estádio (depois da tocaia) — a que ficar mais
     longe de onde as duas torcidas nascem e da saída do alvo. (Na
     concentração o alvo sai da porta da sede: a rua de trás dele É a
     porta, e a saída caía em cima dele; e a tocaia fica na borda do
     tabuleiro, então a rua de trás dela acaba logo) */
  const fimV = soltar(...ateABorda(V.rua, br.sV, M, 90));
  const pelaDoAlvo = { p: soltar(...ateABorda(V.rua, sV2, -M, 90)), dir: dirEm(V.rua, Math.max(0, sV2 - 5 * M), -1) };
  const pelaDele = { p: soltar(...ateABorda(A.rua, br.sQ, -M, 90)), dir: dirEm(A.rua, Math.max(0, br.sQ - 5 * M), -1) };
  /* (e a rota dele seguindo pro estádio depois da tocaia: ela contorna o ponto da briga) */
  const praFrente = { p: soltar(...ateABorda(A.rua, br.sQ, M, 90)), dir: dirEm(A.rua, Math.min(A.rua.L, br.sQ + 5 * M), 1) };
  const nota = q => Math.min(...[pA, pV1, pV2].map(s => Math.hypot(q.p[0] - s[0], q.p[1] - s[1])), 0.8 * Math.hypot(q.p[0] - fimV[0], q.p[1] - fimV[1]));
  let fuga = [pelaDoAlvo, pelaDele, praFrente].sort((x, y) => nota(y) - nota(x))[0];
  /* (as três ruas saem do tabuleiro colado em alguém — 10 m: a tocaia na
     beira dele: o ponto andável da beira, ligado à tocaia pela máscara,
     mais longe de todo mundo) */
  if (nota(fuga) < 360) {
    const n = COLS * ROWS, visto = new Uint8Array(n), fila = new Int32Array(n);
    const c0 = Math.floor(pA[1] / TAB.CEL) * COLS + Math.floor(pA[0] / TAB.CEL);
    let ini = 0, fim = 0;
    if (malha[c0]) { visto[c0] = 1; fila[fim++] = c0; }
    while (ini < fim) {
      const c = fila[ini++], i = c % COLS, j = (c - i) / COLS;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ii = i + di, jj = j + dj, k = jj * COLS + ii;
        if (ii < 0 || jj < 0 || ii >= COLS || jj >= ROWS || visto[k] || !malha[k]) continue;
        visto[k] = 1; fila[fim++] = k;
      }
    }
    let melhor = null;
    for (let k = 0; k < fim; k++) {
      const c = fila[k], i = c % COLS, j = (c - i) / COLS, x = (i + 0.5) * TAB.CEL, y = (j + 0.5) * TAB.CEL;
      const beira = Math.min(x, y, TAB.W - x, TAB.H - y);
      if (beira < 60 || beira > 130) continue;
      const q = { p: [x, y] }, v = nota(q);
      if (!melhor || v > melhor.v) melhor = { q, v, x, y };
    }
    if (melhor && melhor.v > nota(fuga)) {
      const { x, y } = melhor, bx = Math.min(x, TAB.W - x), by = Math.min(y, TAB.H - y);
      fuga = { p: [x, y], dir: bx < by ? [x < TAB.W / 2 ? -1 : 1, 0] : [0, y < TAB.H / 2 ? -1 : 1] };
    }
  }
  const entradas = [
    { id: 'saida_' + ladoV, rot: somosV ? 'PRO ESTÁDIO' : 'A RUA DELES', lado: ladoV, x: Math.round(fimV[0]), y: Math.round(fimV[1]), raio: 48, dir: dirEm(V.rua, Math.min(V.rua.L, br.sV + 20 * M), 1) },
    { id: 'saida_' + ladoA, rot: somosV ? 'A RUA DELES' : 'A RUA DE FUGA', lado: ladoA, x: Math.round(fuga.p[0]), y: Math.round(fuga.p[1]), raio: 48, dir: fuga.dir }
  ];
  /* A PM chega por onde quem ataca veio (a transversal da tocaia) e pela
     frente da rua do alvo (o lado do estádio, onde ela está) */
  const pmTras = soltar(...ateABorda(A.rua, br.sQ, -M, 60)), pmFrente = soltar(...ateABorda(V.rua, br.sV, M, 150));
  const pmPostos = [{ x: Math.round(pmTras[0]), y: Math.round(pmTras[1]) }, { x: Math.round(pmFrente[0]), y: Math.round(pmFrente[1]) }];
  /* A FAIXA do alvo, estendida na frente do bonde dele (dois seguram, de
     lado a lado da rua): o pano em pé, atravessado, com o nome virado pra
     onde ele anda (o `dir` da cena aponta pro "muro" atrás do pano: o bonde) */
  const pF = soltar(...naTab(V.rua, Math.min(V.rua.L, sV1 + 3 * M)));
  const faixas = { [ladoV]: { x: Math.round(pF[0]), y: Math.round(pF[1]), len: 150, dir: dirEm(V.rua, sV1, -1) } };

  const naConcentracao = o.onde === 'praca';
  const cena = {
    id: 'caminhada@3d', base: o.onde === 'praca' ? 'praca' : 'rua', tres: true,
    nome: naConcentracao ? 'Na concentração' : 'Na caminhada',
    local: naConcentracao ? 'Na porta da sede, antes de sair pro estádio' : br.esquina ? 'Na esquina, a caminho do estádio' : 'Na rua, a caminho do estádio',
    largura: TAB.W, altura: TAB.H, celula: TAB.CEL, imagem: null, mascara: linhas.join(';'),
    blocos: [], enfeites: [], varais: [], grades: [], pintura: null,
    espalharBonde: ladoV, marchaAoInimigo: true,
    saida: somosV
      ? { perto: 'Seguir pro estádio', longe: 'Pro estádio (leve o líder)', feito: 'sua torcida furou a emboscada e seguiu pro estádio', dica: 'Leve o líder pela rua do estádio.' }
      : { perto: 'Sumir na rua', longe: 'Rua de fuga (leve o líder)', feito: 'sua torcida bateu e sumiu na rua de onde veio', dica: 'Leve o líder de volta pela rua de onde veio.' },
    spawns, entradas, pmPostos, faixas
  };
  const chao = (x, y) => { const [wx, wz] = noMundo(x, y); return (ctx.chaoDaRua ? ctx.chaoDaRua(wx, wz) : 0) / M; };
  return { cena, noMundo, doMundo, u, v: vv, chao, escala: K, plano, br, P, H, malha, COLS, ROWS,
           /* pra câmera e pro teste: o estádio e as duas ruas no mundo */
           estadio: plano.centroEst, ruaAlvo: V.rua, ruaAtaque: A.rua };
}
