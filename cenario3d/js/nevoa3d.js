/* =========================================================
   A NÉVOA DO JOGO 3D (07/10/2026)

   O dono: "Preciso que exista uma espécie de área escura/bloqueio que
   causa o desconhecimento de onde/como o rival está no mapa, seja em
   dias de jogo ou em dias normais, área escura essa que não existe em
   bairros que a torcida domina e que não existe ao redor de estruturas
   da torcida (por exemplo, a TUF pode ter um bar na Aldeota que pode ser
   momentaneamente dominado pela Cearamor, mas ao redor do bar dá pra ver
   normal). Essa área escura no jogo serve pra poder instigar o jogador a
   ter controle da cidade e consequentemente ter mais informação dos
   inimigos, que pelo contrário quanto menos bairros tiverem pior pra
   eles."

   O MAPA DO QUE SE VÊ: a grade dos bairros da planta (`setores`, uma
   célula de 4 m) diz de que bairro é cada pedaço da praça. Fica claro:
   - o bairro de que a torcida do jogador é DONA (o domínio do save);
   - um círculo de RAIO.estrutura m em volta da sede, de cada bar, loja,
     subsede e fábrica dela — mesmo no bairro de outra;
   - e, a cada quadro, os OLHOS: um círculo em volta do presidente na rua
     (a rua livre, rua3d.js) e da cabeça do nosso bonde no dia de jogo.
   O resto da praça fica escuro (cenario.js pinta: a forma da cidade fica,
   a cor e a luz quase somem), e o que se mexe nele e é de OUTRA torcida
   não aparece: as rodas e a panfletagem da rival, quem passa de camisa
   dela, a turma na porta do bar dela, os bondes do dia de jogo (o filtro
   dos bonecos do cenário). O mapa da cidade (mapa3d.js) pinta o mesmo
   escuro por cima da planta.

   A borda é macia (um borrão de uns 16 m), e o mapa refaz quando o
   domínio muda (o bairro que virou, a estrutura nova) ou a praça troca.
   Fora do jogo (o menu, a planta) a névoa fica desligada. Na praça de
   fora (o jogo fora de casa) a regra é a mesma: lá a torcida quase não tem
   nada, e o que se vê é o que está em volta do bonde.
   ========================================================= */
const RAIO = { estrutura: 45, lider: 28, bonde: 36 };
const ESCURO = 255;
const slugDaPraca = n => String(n || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '-');

export function criarNevoa(api) {
  const M = api.M;
  const C = () => api.cenario;
  const E = () => window.TO && TO.estado && TO.estado.E;
  /* o mapa feito: { dados (0 visto … 255 escuro), x0, z0, cel, nx, ny, chave, praca } */
  let mapa = null, ligada = false, olhos = [], tConf = 0, canvasDoMapa = null;
  /* as torcidas da praça (o id de cada uma: o `spawn` dos bonecos do dia de jogo é o id) */
  let idsDaPraca = new Set();

  /* a chave do que se vê: a praça, a nossa torcida, os bairros nossos e as nossas estruturas */
  function chaveDe(e, cid, nossos, pontos) {
    return [C().praca, e.torcida.id, cid, nossos.join(','), pontos.map(p => Math.round(p.x) + ':' + Math.round(p.z)).join(',')].join('|');
  }
  /* os pontos das nossas estruturas na praça: a porta da sede, dos bares, das lojas, subsedes e fábrica */
  function nossasEstruturas(tid) {
    const P = api.planta, out = [];
    const porta = api.sedeDe ? api.sedeDe(tid) : null;
    if (porta) out.push({ x: porta.x, z: porta.y });
    for (const b of (P && P.bares ? P.bares() : [])) if (b.dono === tid && b.porta) out.push({ x: b.porta.x, z: b.porta.y });
    for (const s of (P && P.estruturas ? P.estruturas() : [])) if (s.dono === tid && s.lote) out.push({ x: (s.lote.x0 + s.lote.x1) / 2, z: (s.lote.y0 + s.lote.y1) / 2 });
    /* (a torcida sem sede no mapa, o nível 0: o ponto de encontro dela) */
    if (!porta && api.casaDe) { const c = api.casaDe(tid); if (c) out.push({ x: c.x, z: c.y }); }
    return out;
  }
  /* MONTAR o mapa do que se vê, da praça na tela */
  function montar(forcar) {
    const e = E(), Cn = C(), P = api.planta;
    if (!e || !e.torcida || !Cn || !Cn.praca || Cn.montando || !P || !P.setores) return false;
    const S = P.setores();
    if (!S || !S.rot || !S.nx) return false;
    const cid = slugDaPraca(Cn.praca), D = TO.dominio, tid = e.torcida.id;
    let nossos = [];
    try { nossos = D && D.bairros ? D.bairros(e, cid).filter(b => b.dono === tid).map(b => b.id) : []; } catch (err) { nossos = []; }
    const pontos = nossasEstruturas(tid);
    const chave = chaveDe(e, cid, nossos, pontos);
    if (!forcar && mapa && mapa.chave === chave) return false;
    idsDaPraca = new Set((P.torcidas ? P.torcidas() : []).map(t => t.id));
    const nx = S.nx, ny = S.ny, cel = S.cel, n = nx * ny;
    const vale = new Set(nossos), cru = new Float32Array(n);
    const idx = S.bairros.map(b => vale.has(b.id));
    for (let k = 0; k < n; k++) { const r = S.rot[k]; cru[k] = r >= 0 && idx[r] ? 0 : 1; }
    /* os círculos das estruturas */
    const R = RAIO.estrutura * M;
    for (const p of pontos) {
      const i0 = Math.floor((p.x - R - S.x0) / cel), i1 = Math.ceil((p.x + R - S.x0) / cel);
      const j0 = Math.floor((p.z - R - S.y0) / cel), j1 = Math.ceil((p.z + R - S.y0) / cel);
      for (let j = Math.max(0, j0); j <= Math.min(ny - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(nx - 1, i1); i++) {
        const cx = S.x0 + (i + 0.5) * cel, cz = S.y0 + (j + 0.5) * cel, d = Math.hypot(cx - p.x, cz - p.z);
        if (d < R) cru[j * nx + i] = Math.min(cru[j * nx + i], Math.max(0, (d - R * 0.75) / (R * 0.25)));
      }
    }
    /* a borda macia: dois borrões de caixa (5 células = 20 m), nas linhas e nas colunas */
    const tmp = new Float32Array(n), borrar = (de, para, passo, lim, q) => {
      for (let a = 0; a < q; a++) {
        let soma = 0, cont = 0;
        const base = passo === 1 ? a * nx : a;
        for (let k = -2; k <= 2; k++) if (k >= 0 && k < lim) { soma += de[base + k * passo]; cont++; }
        for (let k = 0; k < lim; k++) {
          para[base + k * passo] = soma / cont;
          const sai = k - 2, entra = k + 3;
          if (sai >= 0) { soma -= de[base + sai * passo]; cont--; }
          if (entra < lim) { soma += de[base + entra * passo]; cont++; }
        }
      }
    };
    for (let volta = 0; volta < 2; volta++) { borrar(cru, tmp, 1, nx, ny); borrar(tmp, cru, nx, ny, nx); }
    const dados = new Uint8Array(n);
    for (let k = 0; k < n; k++) dados[k] = Math.round(Math.max(0, Math.min(1, cru[k])) * ESCURO);
    mapa = { dados, x0: S.x0, z0: S.y0, cel, nx, ny, chave, praca: Cn.praca, tid };
    canvasDoMapa = null;
    if (Cn.vida && Cn.vida.nevoa) Cn.vida.nevoa.mapa(dados, S.x0, S.y0, cel, nx, ny);
    return true;
  }
  /* o escuro (0 a 1) num ponto do mundo, com os olhos */
  function escuroEm(x, z) {
    if (!mapa) return 0;
    const i = Math.floor((x - mapa.x0) / mapa.cel), j = Math.floor((z - mapa.z0) / mapa.cel);
    let f = i < 0 || j < 0 || i >= mapa.nx || j >= mapa.ny ? 1 : mapa.dados[j * mapa.nx + i] / ESCURO;
    for (const o of olhos) {
      const d = Math.hypot(x - o.x, z - o.z), a = o.r * 0.6;
      f *= d <= a ? 0 : d >= o.r ? 1 : (d - a) / (o.r - a);
    }
    return f;
  }
  /* de que torcida é o boneco: o que a vida põe (`tid`, `uniforme`) ou o id do dia de jogo (`spawn`) */
  const tidDe = d => d.tid || d.uniforme || (d.spawn && idsDaPraca.has(d.spawn) ? d.spawn : null);
  /* o filtro dos bonecos: o de outra torcida no escuro não aparece */
  function filtro(d) {
    if (!ligada || !mapa) return true;
    const t = tidDe(d);
    if (!t || t === mapa.tid) return true;
    return escuroEm(d.x, d.y) < 0.5;
  }
  function ligar(v) {
    const Cn = C();
    ligada = !!v;
    if (!Cn || !Cn.vida || !Cn.vida.nevoa) return;
    if (ligada) { montar(); Cn.vida.filtro = filtro; }
    else if (Cn.vida.filtro === filtro) Cn.vida.filtro = null;
    Cn.vida.nevoa.ligar(ligada && !!mapa);
  }
  /* A CADA QUADRO: os olhos; e, de segundo em segundo, se o domínio mudou */
  function quadro(dt, o = {}) {
    const Cn = C();
    if (!Cn || !Cn.vida || !Cn.vida.nevoa) return;
    const quer = !!o.ligar;
    if (quer !== ligada) ligar(quer);
    if (!ligada) return;
    tConf -= dt;
    if (tConf <= 0 || (mapa && mapa.praca !== Cn.praca)) {
      tConf = 1;
      if (montar()) Cn.vida.nevoa.ligar(true);
    }
    olhos = o.olhos || [];
    Cn.vida.nevoa.olhos(olhos);
    if (Cn.vida.filtro !== filtro) Cn.vida.filtro = filtro;
  }
  /* o escuro em canvas (o mapa da cidade pinta ele por cima da planta): um pixel por célula */
  function canvas() {
    if (!mapa) return null;
    if (canvasDoMapa) return canvasDoMapa;
    const cv = document.createElement('canvas');
    cv.width = mapa.nx; cv.height = mapa.ny;
    const c = cv.getContext('2d'), im = c.createImageData(mapa.nx, mapa.ny);
    for (let k = 0; k < mapa.nx * mapa.ny; k++) {
      im.data[k * 4] = 6; im.data[k * 4 + 1] = 8; im.data[k * 4 + 2] = 14;
      im.data[k * 4 + 3] = Math.round(mapa.dados[k] * 0.78);
    }
    c.putImageData(im, 0, 0);
    canvasDoMapa = cv;
    return cv;
  }
  return {
    quadro, ligar, montar: () => montar(true), escuroEm, filtro, canvas, RAIO,
    /* o ponto se vê (sem névoa, sempre) */
    visivel: (x, z) => !ligada || !mapa || escuroEm(x, z) < 0.5,
    get ligada() { return ligada; },
    get mapa() { return mapa ? { x0: mapa.x0, z0: mapa.z0, cel: mapa.cel, nx: mapa.nx, ny: mapa.ny, praca: mapa.praca } : null; },
    get olhos() { return olhos.slice(); }
  };
}
