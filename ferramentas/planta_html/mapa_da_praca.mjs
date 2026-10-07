/* =========================================================
   O MAPA DE CADA PRAÇA, pros conferidores (node): as opções que a planta
   passa pro gerador (index.html, `varianteDe`) — quantos estádios, o
   metrô, a costa e o TERRENO DE VERDADE de cada estádio (o modelo 3D da
   lotação dele, js/diajogo/estadios3d.js) —, pra conferir o mapa que a
   praça abre de fato, com os estádios no tamanho de verdade.
   ========================================================= */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
/* o módulo dos estádios pinta textura em canvas: aqui, um canvas de mentira */
if (!globalThis.document) {
  const ctx = new Proxy({}, {
    get: (_, k) => k === 'createImageData' ? (w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h) * 4) })
      : k === 'measureText' ? () => ({ width: 0 })
      : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} })
      : () => {},
    set: () => true
  });
  globalThis.document = { createElement: () => ({ get width() { return 1; }, set width(v) {}, get height() { return 1; }, set height(v) {}, getContext: () => ctx }) };
}
globalThis.TO = globalThis.TO || { dados: {} };
if (!TO.dados.estadios) require(path.join(R, 'dados', 'estadios.js'));
const { ESTADIOS_JOGO, modeloDaLotacao } = await import(path.join(R, 'js/diajogo/estadios3d.js'));
const { MAPAS, MAPA_DO_PORTE } = await import(path.join(R, 'ferramentas/planta_html/proposta.js'));
const lotacao = nome => { const e = TO.dados.estadios.find(x => x.nome === nome); return e ? e.capacidade : 0; };
export const modeloDoEstadio = nome => lotacao(nome) ? modeloDaLotacao(lotacao(nome)) : 'estadio-20';
/* a praça c (de dados/cidades.js): o mapa do porte dela e as opções do gerador */
export function mapaDaPraca(c) {
  const id = MAPA_DO_PORTE[c.tamanho], cfg = MAPAS[id], n = Math.min(cfg.estadios.length, c.estadios.length || cfg.estadios.length);
  const terrenos = Array.from({ length: n }, (_, k) => { const m = modeloDoEstadio(c.estadios[k]); return { modelo: m, ...ESTADIOS_JOGO[m].terreno }; });
  return { id, cfg, opc: { estadios: n, metro: !!cfg.metro && !!c.temMetro, terrenos, costa: !!(c.temPraia || c.temLagoa) } };
}
