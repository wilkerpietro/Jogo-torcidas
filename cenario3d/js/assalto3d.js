/* =========================================================
   O ASSALTO NA CIDADE 3D (o jogo 3D, 30/09/2026)

   O motor (assalto.js) roda aqui em cima da cidade de verdade: a loja do
   alvo (lojas3d.js, posta no mapa pela planta), as ruas em volta, a
   polícia chegando pela rua. Este arquivo faz três coisas:

   1. O TABULEIRO (`tabuleiroDaLoja`): a grade de 25 cm em volta da loja
      (24 m de cada lado), com o chão onde o corpo cabe (a grade do passo
      do cenário: a mesma parede em que o boneco a pé bate), o que barra o
      olhar (a parede e a gôndola da planta da loja; fora dela, o prédio),
      as zonas (a loja, a área restrita) e os pontos — os da planta, levados
      pro mundo, e os da rua: o carro da fuga parado no asfalto, do lado de
      fora da esquina; os dois olheiros (a esquina e a calçada); por onde a
      PM chega (as pontas das ruas); por onde o povo passa.
   2. O PALCO (`iniciarAssalto`): os discos do motor viram os bonecos da
      cidade (C.vida.palco), a câmera vai atrás do líder, o teto da loja
      some (de cima se vê dentro), a hora é a do plano (a abertura, a tarde,
      o fechamento — a noite acesa da cidade).
   3. O HUD e o CONTROLE: a Exposição, a Suspeita e a Situação (o que a
      orientação do dono pede), o butim, a equipe, a polícia; o olho (quem
      está te vendo agora), o "?" e o "!" em cima de quem desconfia; o
      teclado (WASD/setas, Shift, E, Q, Z, X, V, Esc) e, no toque, o
      joystick e os botões.
   ========================================================= */
import { criarAssalto, passoAssalto, acaoPossivel, olhosEm, alvoDaConversa, REGUA } from './assalto.js?v=b51650b3ce';
import { planoDaLoja } from './lojas3d.js?v=b51650b3ce';

const CEL_M = 0.25, RAIO_M = 0.22, MARGEM_M = 24;
const HORA_DO_PLANO = { abertura: 9.2, tarde: 15.5, fechamento: 19.6 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const _t = (s, o) => {
  const f = (typeof window !== 'undefined' && window._t) || null;
  let r = f ? f(s, o) : s;
  if (!f && o) for (const [k, v] of Object.entries(o)) r = r.split('{' + k + '}').join(v);
  return r;
};
const dinheiro = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');

/* =========================================================
   1. O TABULEIRO
   ========================================================= */
function frameDoLote(l) {
  const mx = (l.x0 + l.x1) / 2, mz = (l.y0 + l.y1) / 2, f = l.frente;
  if (f === 'n') return { fx: mx, fz: l.y0, rx: -1, rz: 0, nx: 0, nz: -1 };
  if (f === 's') return { fx: mx, fz: l.y1, rx: 1, rz: 0, nx: 0, nz: 1 };
  if (f === 'o') return { fx: l.x0, fz: mz, rx: 0, rz: 1, nx: -1, nz: 0 };
  return { fx: l.x1, fz: mz, rx: 0, rz: -1, nx: 1, nz: 0 };
}
export function tabuleiroDaLoja(ctx, loja) {
  const M = ctx.M, P = ctx.P, g = ctx.grade;
  if (!g) return { erro: 'a praça não tem a grade do passo' };
  const l = loja.lote, W = loja.W, D = loja.D, F = frameDoLote(l);
  const esquina = l.esquina || 'dir';
  const plano = planoDaLoja(loja.tipo, W, D, esquina);
  /* o lote no mundo (x de quem olha a fachada, z negativo pra dentro, em m) */
  const doLote = (lx, lz) => [F.fx + ((lx - W / 2) * F.rx + lz * F.nx) * M, F.fz + ((lx - W / 2) * F.rz + lz * F.nz) * M];
  const rumoDoLote = r => { const dx = Math.sin(r), dz = Math.cos(r); return Math.atan2(dx * F.rx + dz * F.nx, dx * F.rz + dz * F.nz); };
  const retMundo = r => { const [ax, az] = doLote(r.x0, r.z0), [bx, bz] = doLote(r.x1, r.z1); return { x0: Math.min(ax, bx), x1: Math.max(ax, bx), z0: Math.min(az, bz), z1: Math.max(az, bz) }; };
  const m = MARGEM_M * M;
  const x0 = Math.min(l.x0, l.x1) - m, x1 = Math.max(l.x0, l.x1) + m, z0 = Math.min(l.y0, l.y1) - m, z1 = Math.max(l.y0, l.y1) + m;
  const cel = CEL_M * M, nx = Math.ceil((x1 - x0) / cel), nz = Math.ceil((z1 - z0) / cel);
  const anda = new Uint8Array(nx * nz), ve = new Uint8Array(nx * nz), zona = new Uint8Array(nx * nz);
  const noLote = (wx, wz) => wx >= l.x0 && wx <= l.x1 && wz >= l.y0 && wz <= l.y1;
  const naRua = P && P.naRuaOuCalcada ? (wx, wz) => P.naRuaOuCalcada(wx, wz) : () => true;
  const opacos = plano.opacos.map(retMundo), zLoja = plano.zonas.loja.map(retMundo), zRestr = plano.zonas.restrita.map(retMundo), zFora = (plano.zonas.fora || []).map(retMundo);
  const dentroDe = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
  const r = RAIO_M * M;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i, cx0 = x0 + i * cel, cz0 = z0 + j * cel, wx = cx0 + cel / 2, wz = cz0 + cel / 2;
    const noL = noLote(wx, wz), rua = !noL && naRua(wx, wz);
    anda[k] = (noL || rua) && g.cabe(wx, wz, r) && !(ctx.noEstadio && ctx.noEstadio(wx, wz)) ? 1 : 0;
    if (noL) ve[k] = opacos.some(o => cx0 + cel > o.x0 && cx0 < o.x1 && cz0 + cel > o.z0 && cz0 < o.z1) ? 0 : 1;
    else ve[k] = rua || anda[k] ? 1 : 0;
    zona[k] = zRestr.some(o => dentroDe(o, wx, wz)) ? 2 : zLoja.some(o => dentroDe(o, wx, wz)) && !zFora.some(o => dentroDe(o, wx, wz)) ? 1 : 0;
  }
  const idx = (wx, wz) => { const i = Math.floor((wx - x0) / cel), j = Math.floor((wz - z0) / cel); return i < 0 || j < 0 || i >= nx || j >= nz ? -1 : j * nx + i; };
  const centro = k => ({ x: x0 + ((k % nx) + 0.5) * cel, z: z0 + (Math.floor(k / nx) + 0.5) * cel });
  /* o ponto livre mais perto (em espiral, até `ate` m) */
  const soltar = (wx, wz, ate = 3) => {
    const k0 = idx(wx, wz);
    if (k0 >= 0 && anda[k0]) return { x: wx, z: wz };
    const R = Math.ceil(ate / CEL_M), i0 = Math.floor((wx - x0) / cel), j0 = Math.floor((wz - z0) / cel);
    let best = -1, bd = Infinity;
    for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) {
      const i = i0 + di, j = j0 + dj;
      if (i < 0 || j < 0 || i >= nx || j >= nz || !anda[j * nx + i]) continue;
      const d = di * di + dj * dj;
      if (d < bd) { bd = d; best = j * nx + i; }
    }
    return best >= 0 ? centro(best) : null;
  };
  /* SÓ O CHÃO LIGADO À PORTA DA LOJA (o que se alcança andando da calçada dela) */
  const frente = plano.portas.find(q => q.rua === 'frente') || plano.portas[0];
  const [pfx, pfz] = doLote(frente.x, frente.z + 1.6);
  const semente = soltar(pfx, pfz, 4);
  if (!semente) return { erro: 'a calçada da loja não é andável' };
  {
    const n = nx * nz, visto = new Uint8Array(n), fila = new Int32Array(n);
    let a = 0, b = 0;
    const s0 = idx(semente.x, semente.z); visto[s0] = 1; fila[b++] = s0;
    while (a < b) {
      const k = fila[a++], i = k % nx, j = (k - i) / nx;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ii = i + di, jj = j + dj, q = jj * nx + ii;
        if (ii < 0 || jj < 0 || ii >= nx || jj >= nz || visto[q] || !anda[q]) continue;
        visto[q] = 1; fila[b++] = q;
      }
    }
    for (let k = 0; k < n; k++) if (!visto[k]) anda[k] = 0;
  }
  /* OS PONTOS DA PLANTA NO MUNDO */
  const pt = p => { if (!p) return null; const [x, z] = doLote(p.x, p.z); return Object.assign({}, p, { x, z }, p.rumo != null ? { rumo: rumoDoLote(p.rumo) } : {}); };
  const naRuaEm = (lx, lz, ate = 3) => { const [x, z] = doLote(lx, lz); return soltar(x, z, ate); };
  /* o lado da esquina (a rua de lado) e o de dentro, no x do lote */
  const xEsq = esquina === 'esq' ? -1.5 : W + 1.5, xDentro = esquina === 'esq' ? W : 0, sDentro = esquina === 'esq' ? 1 : -1;
  /* O CARRO DA FUGA: no asfalto da rua da frente, do lado de dentro da quadra (longe da esquina), a uns 12–22 m da porta */
  let carro = null;
  const asf = P && P.ehAsfalto ? (x, z) => P.ehAsfalto(x, z) : () => true;
  for (let d = 12; d <= 24 && !carro; d += 1) for (const lz of [4.2, 5.2, 3.6, 6.2]) {
    const lx = frente.x + sDentro * d, [x, z] = doLote(lx, lz);
    const k = idx(x, z);
    if (k >= 0 && anda[k] && asf(x, z)) { carro = { x, z, rumo: rumoDoLote(sDentro > 0 ? Math.PI / 2 : -Math.PI / 2) }; break; }
  }
  if (!carro) { const c = naRuaEm(frente.x + sDentro * 14, 4.5, 6); if (c) carro = { ...c, rumo: rumoDoLote(Math.PI / 2) }; }
  if (!carro) return { erro: 'não achei onde parar o carro' };
  /* os olheiros: a esquina e a calçada do outro lado */
  const olheiros = [naRuaEm(xEsq, 1.5, 3), naRuaEm(xDentro + sDentro * 7, 1.4, 3)].filter(Boolean).map((p, i) => ({ ...p, rumo: rumoDoLote(i === 0 ? (esquina === 'esq' ? -Math.PI / 2 : Math.PI / 2) : (sDentro > 0 ? Math.PI / 2 : -Math.PI / 2)) }));
  /* por onde a PM chega: as duas pontas da rua da frente e o fim da rua de lado */
  const chegadaPM = [naRuaEm(-MARGEM_M + 3, 4.5, 4), naRuaEm(W + MARGEM_M - 3, 4.5, 4), naRuaEm(esquina === 'esq' ? -4.5 : W + 4.5, -D - MARGEM_M + 4, 4)].filter(Boolean)
    .map(p => ({ ...p, rumo: 0 }));
  /* o povo na calçada: a da frente e a de lado */
  const rua = [];
  for (const lx of [-16, -9, -3, W / 2, W + 3, W + 9, W + 16]) { const p = naRuaEm(lx, 1.4, 2); if (p) rua.push(p); }
  for (const lz of [-2, -D / 2, -D + 1]) { const p = naRuaEm(xEsq, lz, 2); if (p) rua.push(p); }
  const fugaPovo = [naRuaEm(-MARGEM_M + 2, 1.4, 3), naRuaEm(W + MARGEM_M - 2, 1.4, 3)].filter(Boolean);
  const pontos = {
    carro, olheiros, chegadaPM, rua, fugaPovo,
    porta: pt({ x: frente.x, z: frente.z }), saidaRua: pt({ x: frente.x, z: 2.2 }),
    funcionarios: plano.funcionarios.map(pt), segurancas: plano.segurancas.map(s => Object.assign(pt(s), { ronda: (s.ronda || []).map(pt) })),
    clientes: plano.clientes.map(pt), saque: plano.saque.map(pt), cameras: plano.cameras.map(pt), alarmes: plano.alarmes.map(pt),
    gravador: pt(plano.gravador), fundos: pt(plano.fundos)
  };
  const [cx, cz] = doLote(W / 2, -D / 2);
  return {
    mapa: { M, x0, z0, cel, nx, nz, anda, ve, zona, pontos, chao: (x, z) => (ctx.chaoDaRua ? ctx.chaoDaRua(x, z) : 0) },
    plano, doLote, F, centro: { x: cx, z: cz }, loja
  };
}

/* =========================================================
   2 e 3. O PALCO, O HUD E O CONTROLE
   `o`: { C (o cenário), ctx (C.vida.contextoDoDia()), loja (de
   P.lojas()), cfg (o do motor: alvo, equipe, dentro, abordagem,
   horario, calor, potencial, semente), aoFim(resultado) }
   ========================================================= */
const CSS = `
.asl-hud{position:fixed;left:12px;top:12px;z-index:60;width:300px;max-width:calc(100vw - 24px);background:rgba(16,18,22,.86);color:#f2f2f2;border-radius:12px;padding:10px 12px;font:13px/1.35 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35);pointer-events:none}
.asl-hud h3{margin:0 0 2px;font-size:14px;letter-spacing:.04em}
.asl-hud .sub{opacity:.75;font-size:12px;margin-bottom:8px}
.asl-barra{margin:5px 0}.asl-barra .rot{display:flex;justify-content:space-between;font-size:12px}
.asl-barra .fundo{height:8px;border-radius:5px;background:rgba(255,255,255,.14);overflow:hidden}.asl-barra .cheio{height:100%;border-radius:5px;transition:width .2s}
.asl-sit{margin:8px 0 4px;font-weight:700;font-size:15px;padding:4px 8px;border-radius:6px;display:inline-block}
.asl-linha{display:flex;justify-content:space-between;font-size:12px;margin-top:3px}
.asl-olho{margin-top:6px;font-size:12px}
.asl-dica{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:60;background:rgba(16,18,22,.88);color:#fff;border-radius:10px;padding:8px 14px;font:14px/1.3 system-ui,sans-serif;max-width:min(640px,calc(100vw - 24px));text-align:center;pointer-events:none}
.asl-dica b{color:#ffd35a}
.asl-prog{height:6px;border-radius:4px;background:rgba(255,255,255,.18);margin-top:6px;overflow:hidden}.asl-prog i{display:block;height:100%;background:#ffd35a}
.asl-avisos{position:fixed;right:12px;top:12px;z-index:60;width:320px;max-width:calc(100vw - 24px);display:flex;flex-direction:column;gap:6px;pointer-events:none}
.asl-avisos div{background:rgba(16,18,22,.86);border-radius:8px;padding:6px 10px;font:13px/1.3 system-ui,sans-serif;color:#fff;border-left:4px solid currentColor}
.asl-botoes{position:fixed;right:12px;bottom:18px;z-index:61;display:grid;grid-template-columns:repeat(2,auto);gap:8px}
.asl-botoes button{font:600 13px system-ui,sans-serif;border:0;border-radius:10px;padding:10px 12px;background:rgba(255,255,255,.92);color:#111;box-shadow:0 3px 10px rgba(0,0,0,.3);cursor:pointer;min-width:92px}
.asl-botoes button:disabled{opacity:.45;cursor:default}
.asl-botoes button.forte{background:#ffd35a}.asl-botoes button.perigo{background:#ff6b6b;color:#fff}
.asl-joy{position:fixed;left:22px;bottom:22px;z-index:61;width:130px;height:130px;border-radius:50%;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.35);touch-action:none}
.asl-joy i{position:absolute;left:50%;top:50%;width:54px;height:54px;margin:-27px 0 0 -27px;border-radius:50%;background:rgba(255,255,255,.85)}
.asl-marca{position:fixed;z-index:59;font:900 22px system-ui,sans-serif;transform:translate(-50%,-100%);pointer-events:none;text-shadow:0 2px 4px rgba(0,0,0,.6)}
.asl-fim{position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45)}
.asl-fim .caixa{background:#16181c;color:#f2f2f2;border-radius:14px;padding:18px 20px;width:min(440px,calc(100vw - 32px));font:14px/1.4 system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.5)}
.asl-fim h2{margin:0 0 6px;font-size:20px}.asl-fim .obs{margin:2px 0 6px;font-size:12.5px;color:#c9c9c9}.asl-fim .linha{display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.08);padding:5px 0}
.asl-fim button{margin-top:14px;width:100%;font:700 15px system-ui,sans-serif;border:0;border-radius:10px;padding:12px;background:#ffd35a;color:#111;cursor:pointer}
.asl-teclas{position:fixed;left:12px;bottom:12px;z-index:59;background:rgba(16,18,22,.7);color:#ddd;border-radius:8px;padding:6px 9px;font:12px/1.4 system-ui,sans-serif;pointer-events:none;max-width:300px}
@media (pointer:coarse){.asl-teclas{display:none}}
@media (pointer:fine){.asl-joy{display:none}}
body.asl-ativo #jogo,body.asl-ativo #j3dHora,body.asl-ativo #j3dPraca,body.asl-ativo .j3d-balao,body.asl-ativo .j3d-avisos,body.asl-ativo #j3dAndar,body.asl-ativo .j3d-dia,body.asl-ativo .j3d-placar{visibility:hidden!important}
body.asl-ativo .cen-topo,body.asl-ativo .cen-dica,body.asl-ativo .cen-ficha,body.asl-ativo .cen-hover,body.asl-ativo .cen-joy,body.asl-ativo .cen-bt-porta,body.asl-ativo .cen-fps{display:none!important}
`;
const COR_SIT = { 'Normal': '#2e7d32', 'Suspeita': '#c77800', 'Alerta': '#c62828', 'Polícia no local': '#6a1b9a' };
const ROT_SIT = { 'Normal': 'Normal', 'Suspeita': 'Suspeita', 'Alerta': 'Alerta', 'Polícia no local': 'Polícia no local' };

export function iniciarAssalto(o) {
  const { C, ctx, loja, cfg } = o;
  const M = ctx.M;
  const T = tabuleiroDaLoja(ctx, loja);
  if (T.erro) return { erro: T.erro };
  const J = criarAssalto(T.mapa, cfg);
  const L = J.lider;
  let fechado = false, pausado = false, modo = 'perto';
  const VISTAS = { perto: { dist: 16, el: 1.05 }, alto: { dist: 34, el: 1.3 } };
  /* ---- o DOM ---- */
  const estilo = document.createElement('style'); estilo.textContent = CSS; document.head.appendChild(estilo);
  const hud = document.createElement('div'); hud.className = 'asl-hud'; document.body.appendChild(hud);
  const dica = document.createElement('div'); dica.className = 'asl-dica'; document.body.appendChild(dica);
  const avisos = document.createElement('div'); avisos.className = 'asl-avisos'; document.body.appendChild(avisos);
  const teclasTxt = document.createElement('div'); teclasTxt.className = 'asl-teclas';
  teclasTxt.innerHTML = _t('<b>WASD</b> anda · <b>Shift</b> corre · <b>E</b> (segurado) age · <b>Q</b> anuncia · <b>Z</b> distrai · <b>X</b> esperar/seguir · <b>V</b> câmera · <b>Esc</b> abortar');
  document.body.appendChild(teclasTxt);
  const botoes = document.createElement('div'); botoes.className = 'asl-botoes'; document.body.appendChild(botoes);
  const bt = (rot, cls, fn) => { const b = document.createElement('button'); b.textContent = rot; if (cls) b.className = cls; b.addEventListener('pointerdown', ev => { ev.preventDefault(); fn(true, b); }); b.addEventListener('pointerup', ev => { ev.preventDefault(); fn(false, b); }); b.addEventListener('pointerleave', () => fn(false, b)); botoes.appendChild(b); return b; };
  const segura = { acao: false };
  const umaVez = {};
  const btAcao = bt(_t('Ação (E)'), 'forte', v => { segura.acao = v; });
  const btAnunciar = bt(_t('Anunciar (Q)'), 'perigo', v => { if (v) umaVez.anunciar = true; });
  const btDistrair = bt(_t('Distrair (Z)'), '', v => { if (v) umaVez.distrair = true; });
  const btOrdem = bt(_t('Esperar (X)'), '', v => { if (v) umaVez.ordem = 'alternar'; });
  const btCamera = bt(_t('Câmera (V)'), '', v => { if (v) trocarVista(); });
  const btAbortar = bt(_t('Abortar'), '', v => { if (v) pedirAbortar(); });
  /* o joystick do toque */
  const joy = document.createElement('div'); joy.className = 'asl-joy'; joy.innerHTML = '<i></i>'; document.body.appendChild(joy);
  const pino = joy.firstChild, eixo = { x: 0, y: 0, m: 0, id: null };
  const mexerJoy = ev => {
    const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = (ev.clientX - cx) / (r.width / 2), dy = (ev.clientY - cy) / (r.height / 2);
    const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
    eixo.x = dx; eixo.y = dy; eixo.m = Math.min(1, m);
    pino.style.transform = `translate(${dx * 38}px,${dy * 38}px)`;
  };
  joy.addEventListener('pointerdown', ev => { eixo.id = ev.pointerId; joy.setPointerCapture(ev.pointerId); mexerJoy(ev); });
  joy.addEventListener('pointermove', ev => { if (ev.pointerId === eixo.id) mexerJoy(ev); });
  const soltarJoy = () => { eixo.id = null; eixo.x = eixo.y = eixo.m = 0; pino.style.transform = ''; };
  joy.addEventListener('pointerup', soltarJoy); joy.addEventListener('pointercancel', soltarJoy);
  /* as marcas em cima das cabeças (o ? e o !) */
  const marcas = [];
  const marcaEl = () => { const d = document.createElement('div'); d.className = 'asl-marca'; document.body.appendChild(d); return d; };
  /* ---- o teclado ---- */
  const teclas = new Set();
  const JOGO = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift', 'e', 'q', 'z', 'x', 'v', 'escape', ' ']);
  const aoDescer = ev => {
    if (fechado) return;
    const k = ev.key.toLowerCase();
    if (!JOGO.has(k)) return;
    ev.preventDefault(); ev.stopPropagation();
    if (ev.repeat && k !== 'e') return;
    teclas.add(k);
    if (k === 'q') umaVez.anunciar = true;
    if (k === 'z') umaVez.distrair = true;
    if (k === 'x') umaVez.ordem = 'alternar';
    if (k === 'v') trocarVista();
    if (k === 'escape') pedirAbortar();
  };
  const aoSubir = ev => { const k = ev.key.toLowerCase(); if (JOGO.has(k)) { teclas.delete(k); ev.preventDefault(); } };
  window.addEventListener('keydown', aoDescer, true);
  window.addEventListener('keyup', aoSubir, true);
  const soltarTudo = () => teclas.clear();
  window.addEventListener('blur', soltarTudo);
  /* o vetor do teclado e do joystick, virado pela câmera (o W anda pra onde a câmera olha) */
  function vetor() {
    let dx = 0, dy = 0;
    if (teclas.has('a') || teclas.has('arrowleft')) dx--;
    if (teclas.has('d') || teclas.has('arrowright')) dx++;
    if (teclas.has('w') || teclas.has('arrowup')) dy++;
    if (teclas.has('s') || teclas.has('arrowdown')) dy--;
    let forca = dx || dy ? 1 : 0;
    if (!forca && eixo.m > 0.16) { dx = eixo.x; dy = -eixo.y; forca = eixo.m; }
    if (!forca) return { mx: 0, mz: 0, correr: false };
    const az = C.orb.az, fx = -Math.sin(az), fz = -Math.cos(az), rx = Math.cos(az), rz = -Math.sin(az);
    const wx = fx * dy + rx * dx, wz = fz * dy + rz * dx, m = Math.hypot(wx, wz) || 1;
    return { mx: wx / m * Math.min(1, forca), mz: wz / m * Math.min(1, forca), correr: teclas.has('shift') || (eixo.m > 0.92) };
  }
  /* ---- a câmera ---- */
  let seguindo = false;
  function seguir(dt, orb) {
    const alvo = L.vivo || L.preso ? L : J.equipe.find(d => d.vivo) || L;
    const k = seguindo ? 1 - Math.exp(-dt * 5) : 1;
    orb.alvo.x += (alvo.x - orb.alvo.x) * k; orb.alvo.z += (alvo.y - orb.alvo.z) * k;
    seguindo = true;
  }
  function trocarVista() {
    modo = modo === 'perto' ? 'alto' : 'perto';
    const v = VISTAS[modo]; C.orb.dist = v.dist * M; C.orb.el = v.el; C.pedir && C.pedir();
  }
  /* ---- o palco ---- */
  const horaAntes = (window.TO && TO.jogo3d && TO.jogo3d.vida && TO.jogo3d.vida.relogio) ? TO.jogo3d.vida.relogio.hora : null;
  const hora = HORA_DO_PLANO[cfg.horario] ?? 15;
  C.vida.hora(hora);
  C.vida.abrirPredio(T.centro.x, T.centro.z, 2.2);
  document.body.classList.add('asl-ativo', 'palco3d');
  C.vida.palco = {
    J, semAnel: true, seguir, quadro,
    alvoDoCorte: () => ({ x: L.x, y: L.alt || 0, z: L.y })
  };
  /* a câmera salta pro carro, de onde a equipe sai */
  { const v = VISTAS.perto; C.olhar(L.x, L.y, v.dist * M, v.el, Math.atan2(T.F.nx, T.F.nz) + Math.PI); }
  /* ---- o quadro ---- */
  let tHud = 0;
  function quadro(dt) {
    if (fechado || pausado) return;
    const v = vetor();
    /* (o robô do teste dirige no lugar do teclado) */
    const ent = ctl.robo ? Object.assign(ctl.robo(J) || {}, umaVez) : { mx: v.mx, mz: v.mz, correr: v.correr, acao: teclas.has('e') || teclas.has(' ') || segura.acao, ...umaVez };
    for (const k of Object.keys(umaVez)) delete umaVez[k];
    passoAssalto(J, Math.min(dt, 0.1), ent);
    tHud -= dt;
    if (tHud <= 0) { tHud = 0.1; pintarHud(); }
    pintarMarcas();
    if (J.fim) terminar();
  }
  /* ---- o HUD ---- */
  function barra(rot, v, cor) {
    return `<div class="asl-barra"><div class="rot"><span>${rot}</span><span>${Math.round(v)}</span></div><div class="fundo"><div class="cheio" style="width:${clamp(v, 0, 100)}%;background:${cor}"></div></div></div>`;
  }
  const historico = [];
  function pintarHud() {
    const sit = J.situacao, dentro = J.equipe.filter(d => d.papel !== 'olheiro' && !d.preso && !d.fugiu).length;
    const fora = J.equipe.filter(d => d.papel === 'olheiro' && !d.preso && !d.fugiu).length, presos = J.equipe.filter(d => d.preso).length;
    const olhos = olhosEm(J, L), gente = olhos.filter(x => !x.camera).length, cams = olhos.length - gente;
    const pm = J.pmChegou ? _t('{n} PMs na rua', { n: J.policiais.filter(p => p.vivo).length })
      : J.alerta ? (J.etaConhecido ? _t('chega em {s} s', { s: Math.max(0, Math.ceil(J.eta - (J.t - J.tAlerta))) }) : _t('a caminho'))
      : _t('ninguém chamou');
    hud.innerHTML = `<h3>${esc(loja.nome)}</h3><div class="sub">${esc(_t(cfg.abordagem === 'rapido' ? 'Rápido' : 'Furtivo'))} · ${esc(_t({ abertura: 'Abertura', tarde: 'Tarde', fechamento: 'Fechamento' }[cfg.horario] || ''))} · ${Math.floor(J.t / 60)}:${String(Math.floor(J.t % 60)).padStart(2, '0')}</div>`
      + barra(_t('Exposição'), J.exposicao, J.exposicao > 66 ? '#ff5252' : J.exposicao > 33 ? '#ffb74d' : '#8bc34a')
      + barra(_t('Suspeita'), J.suspeita, J.suspeita > 66 ? '#ff5252' : J.suspeita > 33 ? '#ffb74d' : '#8bc34a')
      + `<div class="asl-sit" style="background:${COR_SIT[sit] || '#444'}">${esc(_t('Situação: {s}', { s: _t(ROT_SIT[sit] || sit) }))}</div>`
      + `<div class="asl-linha"><span>${esc(_t('Butim'))}</span><b>${dinheiro(J.butim)} / ${dinheiro(J.potencial)}</b></div>`
      + `<div class="asl-linha"><span>${esc(_t('Equipe'))}</span><span>${esc(_t('{d} dentro · {f} fora · {p} presos', { d: dentro, f: fora, p: presos }))}</span></div>`
      + `<div class="asl-linha"><span>${esc(_t('Polícia'))}</span><span>${esc(pm)}</span></div>`
      + `<div class="asl-olho">${gente ? '👁 ' + esc(_tn(gente, '{n} pessoa te olhando', '{n} pessoas te olhando')) : '👁 ' + esc(_t('ninguém te olhando'))}${cams ? ' · 📹 ' + esc(_tn(cams, '{n} câmera', '{n} câmeras')) : ''}${J.ordem === 'esperar' ? ' · ' + esc(_t('equipe esperando')) : ''}</div>`;
    /* a dica: a ação do lugar (E), o progresso, ou a dica geral */
    const ac = J.acao || acaoPossivel(J);
    let txt = '';
    if (ac) {
      txt = `<b>[E]</b> ${esc(_t(ac.rot))}` + (ac.tipo === 'saque' ? ' · ' + dinheiro(ac.alvo.valor) : '');
      if (ac.tipo === 'saque' && ac.alvo.prog > 0) txt += `<div class="asl-prog"><i style="width:${clamp(ac.alvo.prog / ac.alvo.tempo * 100, 0, 100)}%"></i></div>`;
      if (J.progresso && J.progresso.gravador) txt += `<div class="asl-prog"><i style="width:${clamp(J.progresso.prog / J.progresso.tempo * 100, 0, 100)}%"></i></div>`;
    } else txt = esc(_t(J.dica));
    const conversa = !J.anunciado && alvoDaConversa(J);
    if (conversa && !ac) txt += ` · <b>[Z]</b> ${esc(_t('distrair'))}`;
    dica.innerHTML = txt;
    btAnunciar.disabled = J.anunciado;
    btDistrair.disabled = J.anunciado || !conversa;
    btOrdem.textContent = J.ordem === 'esperar' ? _t('Seguir (X)') : _t('Esperar (X)');
    /* os avisos novos (o HUD esvazia a lista do motor) */
    for (const a of J.avisos.splice(0)) {
      const d = document.createElement('div'); d.style.color = a.cor || '#fff'; d.textContent = _t(a.txt);
      avisos.prepend(d); setTimeout(() => d.remove(), 6000);
      while (avisos.children.length > 5) avisos.lastChild.remove();
      historico.push(a);
    }
  }
  const _tn = (n, um, varios, o) => _t(n === 1 ? um : varios, Object.assign({ n }, o || {}));
  const P2 = { x: 0, y: 0 };
  function pintarMarcas() {
    let i = 0;
    for (const mk of J.marcas) {
      const d = mk.d;
      if (!C.vida.projetar) break;
      const q = C.vida.projetar(d.x, (d.alt || 0) + 2.05 * M, d.y, P2);
      if (!q.frente) continue;
      const el = marcas[i] || (marcas[i] = marcaEl());
      el.style.display = ''; el.style.left = q.x + 'px'; el.style.top = q.y + 'px';
      el.textContent = mk.tipo; el.style.color = mk.tipo === '!' ? '#ff5252' : '#ffd35a';
      i++;
    }
    for (; i < marcas.length; i++) marcas[i].style.display = 'none';
  }
  /* ---- abortar ---- */
  function pedirAbortar() {
    if (fechado || J.fim) return;
    pausado = true;
    const w = document.createElement('div'); w.className = 'asl-fim';
    w.innerHTML = `<div class="caixa"><h2>${esc(_t('Abortar o assalto?'))}</h2><p>${esc(_t('A equipe larga tudo e some. O que já pegou vai junto; com a polícia na rua, quem estiver perto dela cai.'))}</p><button class="sim">${esc(_t('Abortar'))}</button><button class="nao" style="background:#444;color:#fff">${esc(_t('Continuar o assalto'))}</button></div>`;
    document.body.appendChild(w);
    w.querySelector('.sim').onclick = () => { w.remove(); pausado = false; umaVez.abortar = true; };
    w.querySelector('.nao').onclick = () => { w.remove(); pausado = false; };
  }
  /* ---- o fim ---- */
  function terminar() {
    if (fechado) return;
    fechado = true;
    const f = J.fim;
    pintarHud();
    const titulo = f.abortou ? _t('Assalto abortado') : f.motivo === 'lider-preso' ? _t('Deu ruim: o líder caiu') : f.motivo === 'tempo' ? _t('A equipe desistiu') : f.butim > 0 ? _t('Assalto feito') : _t('Saíram de mãos vazias');
    const linha = (a, b) => `<div class="linha"><span>${esc(a)}</span><b>${esc(b)}</b></div>`;
    const w = document.createElement('div'); w.className = 'asl-fim';
    w.innerHTML = `<div class="caixa"><h2>${esc(titulo)}</h2>`
      + linha(_t('Butim'), dinheiro(f.butim))
      + (f.pego > f.butim ? `<p class="obs">${esc(_t('Pegaram {pego}', { pego: dinheiro(f.pego) }) + ': ' + [f.aPe ? _tn(f.aPe, '{n} saiu a pé, longe da van, e largou metade', '{n} saíram a pé, longe da van, e largaram metade') : '', f.presos.length ? _t('o que os presos levavam ficou com a polícia') : ''].filter(Boolean).join('; ') + '.')}</p>` : '')
      + linha(_t('Presos'), String(f.presos.length))
      + linha(_t('Exposição'), String(f.exposicao))
      + linha(_t('Alerta'), f.alerta ? _t('sim') : _t('não'))
      + linha(_t('Polícia no local'), f.policia ? _t('sim') : _t('não'))
      + linha(_t('Câmeras'), f.camerasDesligadas ? _t('desligadas') : f.gravado ? _t('gravaram a equipe') : _t('não pegaram nada'))
      + linha(_t('Tempo'), `${Math.floor(f.tempo / 60)}:${String(f.tempo % 60).padStart(2, '0')}`)
      + `<button>${esc(_t('Voltar pro jogo'))}</button></div>`;
    document.body.appendChild(w);
    w.querySelector('button').onclick = () => { w.remove(); desmontar(); if (o.aoFim) o.aoFim(Object.assign({ modo: '3d', alvo: loja.tipo }, f)); };
  }
  function desmontar() {
    window.removeEventListener('keydown', aoDescer, true);
    window.removeEventListener('keyup', aoSubir, true);
    window.removeEventListener('blur', soltarTudo);
    for (const el of [hud, dica, avisos, botoes, joy, teclasTxt, estilo, ...marcas]) el.remove();
    document.body.classList.remove('asl-ativo', 'palco3d');
    if (C.vida.palco && C.vida.palco.J === J) C.vida.palco = null;
    C.vida.abrirPredio(null);
    if (horaAntes != null) C.vida.hora(horaAntes); else C.vida.hora(null);
  }
  pintarHud();
  const ctl = {
    J, T, historico, robo: null,
    /* pro teste: o passo com uma entrada, a ação, o fim */
    passo: (dt, ent) => passoAssalto(J, dt, ent || {}),
    parar: () => { if (!fechado) { fechado = true; desmontar(); } },
    /* pro teste: fecha o painel do fim (o botão "Voltar pro jogo") */
    fecharFim: () => { const b = document.querySelector('.asl-fim button'); if (b) b.click(); },
    get fechado() { return fechado; }
  };
  return ctl;
}
