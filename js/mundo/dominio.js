/* =========================================================
   O DOMÍNIO DOS BAIRROS (o dono, 30/09/2026: "inicie a setorização
   dos bairros de acordo com os dados que temos e as zonas também …
   Em cada bairro vai apontar qual torcida comanda, e a torcida que
   comandar mais bairros domina a cidade").

   A BARRA DE 7 (o dono, 15/10/2026: "cada domínio agora vai ser uma
   barrinha de 7 pontos apenas, e quem tiver 4 pontos num bairro domina
   ele ... Somente as brigas vão ditar os pontos de domínio"). Cada
   bairro tem 7 pontos inteiros repartidos entre as torcidas; o que
   sobra é neutro. Quem tem 4 ou mais é a DONA; ninguém com 4, o bairro
   está em disputa. Toda briga no bairro passa 1 ponto de quem perdeu
   pra quem venceu; se quem perdeu não tem ponto ali, o vencedor tira 1
   do neutro, e sem neutro não muda nada ("tem que ganhar de quem tem").
   Toda torcida tem um ponto FIXO no bairro da sede dela (e a filial, no
   bairro dela na outra cidade): esse ninguém tira. Vale nos dois modos.
   Pixação, recrutamento, estrutura e ação social não mexem mais na
   barra, e nada rende por dia.

   A CIDADE. Domina a cidade quem é dona de MAIS bairros que qualquer
   outra; empate no topo, ninguém domina. Todo dia:
     · quem domina ganha +0,1 de prestígio e +0,1 de moral (na régua
       de 0 a 100 que a tela mostra: 0,02 no indicador de 0 a 20);
     · a primeira e a segunda maior da cidade (pelos membros de hoje)
       que NÃO dominam perdem 0,1 de cada.

   O COMEÇO. Cada save sorteia o seu padrão (a semente do save), e a
   mesma semente dá sempre o mesmo padrão. Numa cidade de 16 bairros,
   a maior e a segunda maior ficam com uns 5 cada (às vezes 4, às
   vezes 6 — e dá empate, a cidade começa sem dono), e o resto é
   rateado entre as demais pelos membros de partida. O bairro da SEDE
   é sempre da torcida dela no começo, com a barra alta, e é o mais
   difícil de tomar: quem não é da casa ganha metade ali, e a casa soma
   meio ponto por dia, sem teto. Perdido, custa 0,2 de moral por dia. A subsede também segura o bairro
   dela (um terço de ponto por dia até 65) — é assim que ela chega a
   dominar.

   DUAS SEDES NO MESMO BAIRRO (nos dados há 3 praças do Brasil e mais
   de 30 de fora assim): a maior fica; a outra vai pro bairro livre
   mais parecido — a mesma zona primeiro, depois a zona vizinha. A
   troca é feita nos DADOS, na carga (`o.bairroSede` e as `sedes` do
   bairro), pra valer igual no jogo de feed, no jogo 3D e na planta.

   O SAVE só guarda a cidade que mudou (`E.dominio.c`): o padrão de
   partida sai da semente toda vez que é lido, e a cidade que ninguém
   tocou não pesa nada no save. A do jogador é gravada na primeira
   leitura, porque o começo dela considera onde estão o bar, a loja e
   a subsede que ele já tem.

   A RECEITA (voltou em 16/10/2026, ver `fator`: dona de fora que não é
   aliada nem irmã corta 30% de bar, loja, subsede e festa da sede). Antes: bar, loja, subsede (e a festa da sede) em bairro cuja
   dona era RIVAL da torcida rendiam 30% menos — o corte acabou (o dono,
   05/10/2026: "Acabe com o debuff de 'Os nossos pontos aqui rendem 30%
   menos: o bairro é da Falange Coral, rival'"): `fator` vale 1 sempre
   e `notaDoCorte` não escreve nada; ficam as duas, que o financeiro, o
   patrimônio e a IA chamam.

   A TORCIDA DO BAIRRO (o dono, 01/10/2026): cada bairro tem quantos
   torcedores de cada clube moram nele — o clube da praça mora na
   cidade dele (as praças de várias cidades: Paraíba, Maranhão, os
   interiores). Bar, loja e subsede rendem pelo tanto de torcida do
   clube no bairro, os pontos de uma ação no bairro pesam pelo mesmo
   tanto, e cada organizada começa nos bairros da cidade dela onde o
   clube tem mais gente (a cidade sem organizada começa sem dona).
   ========================================================= */
window.TO = window.TO || {};

TO.dominio = (function(){
  'use strict';
  /* a tradução é do jogo; na planta sozinha (sem o jogo) o texto sai
     como está, com os {marcadores} trocados */
  const sub = (s, p) => String(s).replace(/\{(\w+)\}/g, (m, k) => p && p[k] != null ? p[k] : m);
  const _t = (s, p) => typeof window._t === 'function' ? window._t(s, p) : sub(s, p);

  /* ---- as réguas (o dono, 30/09/2026) ---- */
  const MAX = 7;                     // a barra: 7 pontos inteiros (15/10/2026)
  const DOMINA = 4;                  // 4 ou mais: dona do bairro
  const DIA = 0.02;                  // 0,1 na régua de 0 a 100
  const CORTE = 0.7;                 // receita em bairro de dona de fora (não aliada): −30% (voltou em 16/10/2026)
  /* quem não é dona do bairro da própria sede perde 0,2 de moral por
     dia (na régua de 0 a 100; 0,04 no indicador) */
  const SEDE_PERDIDA = 0.04;
  /* quanto cada ação vale na barra (pontos de 0 a 100) */
  const GANHO = {
    treta: {5:10, 7:14, 10:18},      // treta marcada, pelo tamanho
    rua: 10,                         // ataque na pista, na concentração, na praça
    arredores: 8,                    // arredores do estádio
    estadio: 6,                      // a arquibancada (02/10/2026)
    estrada: 8,                      // a emboscada na estrada, na entrada da praça (02/10/2026)
    defesa: 10,                      // quem segurou (ou tomou) o ataque em casa
    bar: 12, quebrou: 6,             // bote no bar (+6 se o bar quebrou)
    sede: 12,                        // bote na sede
    casa: 8,                         // a festa na casa com piscina
    reuniao: 12,                     // a reunião da zona na praça (01/10/2026)
    estrutura: {bar:8, loja:8, subsede:20, filial:15},
    social: [6, 10],                 // ação social no bairro
    iaRua: 8, iaBar: 12              // as brigas entre as IAs
  };
  /* A AÇÃO SOCIAL NO BAIRRO (a de antes foi aposentada em 24/08/2026;
     esta é outra, com outro id): uma por semana, com gente na rua */
  const SOCIAL = {custo:1500, gente:5};

  const ZONAS = ['Norte', 'Leste', 'Sul', 'Oeste'];
  const VIZINHAS = {Norte:['Leste','Oeste'], Sul:['Leste','Oeste'],
                    Leste:['Norte','Sul'], Oeste:['Norte','Sul']};

  /* o mesmo hash do mapa (TO.mapa.hash), pra os bairros sorteados por
     hash baterem com os que o resto do jogo sorteia */
  function hash(txt){
    let h = 2166136261;
    const s = String(txt);
    for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  /* um sorteio próprio, que não mexe no do jogo (mulberry32) */
  function sorteio(chave){
    let a = hash(chave) || 1;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
  const um = v => Math.round(v * 10) / 10;

  /* =======================================================
     OS DADOS: as cidades, as torcidas de cada uma e as sedes já
     espalhadas. Refeito quando os vetores dos dados mudam (o jogo 3D
     carrega os dados de novo por cima dos da planta).
     ======================================================= */
  let base = null;
  const memo = new Map();
  function indice(){
    const D = (window.TO && TO.dados) || {};
    const C = D.cidades || [], O = D.torcidas || [], TT = D.times || [];
    if(base && base.C === C && base.O === O && base.TT === TT && base.nC === C.length && base.nO === O.length) return base;
    memo.clear();
    const cidade = new Map(), torcidas = new Map(), sedes = new Map(), bairros = new Map();
    /* (o clube de cada torcida e a cidade de cada clube: a torcida do bairro) */
    const porId = new Map(O.map(o => [o.id, o])), times = new Map(TT.map(t => [t.id, t]));
    for(const c of C){
      cidade.set(c.id, c);
      const bm = new Map();
      for(const b of (c.bairros || [])){ bm.set(b.id, b); bm.set(norm(b.nome), b); }
      bairros.set(c.id, bm);
      torcidas.set(c.id, []);
    }
    for(const o of O) if(!o.incompleta && torcidas.has(o.mapa)) torcidas.get(o.mapa).push(o);
    for(const [cid, ts] of torcidas){
      ts.sort((a, b) => (b.membros || 0) - (a.membros || 0) || String(a.id).localeCompare(String(b.id)));
      sedes.set(cid, espalhar(cidade.get(cid), bairros.get(cid), ts));
    }
    base = {C, O, TT, nC:C.length, nO:O.length, cidade, torcidas, sedes, bairros, porId, times,
            comTorcida:[...torcidas.keys()].filter(cid => torcidas.get(cid).length && (cidade.get(cid).bairros || []).length)};
    return base;
  }

  /* DUAS SEDES NO MESMO BAIRRO: a maior fica (a lista vem da maior pra
     menor), a outra vai pro bairro livre mais parecido — a mesma zona,
     depois a vizinha, depois a oposta; na mesma zona, a mesma classe
     de bairro; e, entre iguais, a zona com menos sede. A torcida sem
     bairro nos dados (há uma) cai no bairro livre da zona mais vazia.
     O resultado é gravado nos dados: `bairroSede` (o de antes fica em
     `bairroSedeDados`) e a lista `sedes` dos dois bairros. */
  function espalhar(c, bm, ts){
    const fora = new Map();
    const bs = (c && c.bairros) || [];
    if(!bs.length) return fora;
    const dono = new Map(), pend = [];
    for(const t of ts){
      const b = bm.get(norm(t.bairroSede)) || null;
      if(b && !dono.has(b.id)){ dono.set(b.id, t); fora.set(t.id, b); }
      else pend.push({t, orig:b});
    }
    for(const {t, orig} of pend){
      const livres = bs.filter(b => !dono.has(b.id));
      if(!livres.length) break;
      const naZona = z => [...fora.values()].filter(x => zonaDe(c, x) === z).length;
      const nota = b => {
        let n = 0;
        const zb = zonaDe(c, b);
        if(orig){
          /* a sede fica na cidade dela (as praças de várias cidades, 01/10/2026) */
          if((b.cidade || '') !== (orig.cidade || '')) n += 100;
          const zo = zonaDe(c, orig);
          n += zb === zo ? 0 : (VIZINHAS[zo] || []).includes(zb) ? 10 : 20;
          if(b.classe === orig.classe) n -= 3;
        }
        return n + 2 * naZona(zb) + (hash(t.id + '|' + b.id) % 1000) / 1000;
      };
      const b = livres.sort((x, y) => nota(x) - nota(y))[0];
      dono.set(b.id, t); fora.set(t.id, b);
      /* grava nos dados (uma vez: quem já foi espalhado não volta) */
      if(norm(t.bairroSede) !== norm(b.nome)){
        if(t.bairroSedeDados === undefined) t.bairroSedeDados = t.bairroSede || '';
        if(orig && Array.isArray(orig.sedes)){
          const k = orig.sedes.indexOf(t.nome);
          if(k >= 0) orig.sedes.splice(k, 1);
        }
        t.bairroSede = b.nome;
        if(Array.isArray(b.sedes)){ if(!b.sedes.includes(t.nome)) b.sedes.push(t.nome); }
        else b.sedes = [t.nome];
      }
    }
    return fora;
  }

  const cidadeDe = cid => indice().cidade.get(cid) || null;
  const bairrosDe = cid => (cidadeDe(cid) || {}).bairros || [];
  /* o bairro pelo id ou pelo nome (com ou sem acento) */
  function bairro(cid, x){
    if(!x) return null;
    if(typeof x === 'object') x = x.id || x.nome;
    const bm = indice().bairros.get(cid);
    return (bm && bm.get(norm(x))) || (bm && bm.get(String(x))) || null;
  }
  const torcidasDaCidade = cid => indice().torcidas.get(cid) || [];
  /* o bairro da sede de uma torcida (já espalhado) */
  function sedeDe(tid, cid){
    const I = indice();
    if(!cid){ const o = I.O.find(x => x.id === tid); cid = o && o.mapa; }
    const m = I.sedes.get(cid);
    return (m && m.get(tid)) || null;
  }
  /* de quem é a sede que fica neste bairro */
  function casaDe(cid, bid){
    const m = indice().sedes.get(cid);
    if(!m) return null;
    for(const [tid, b] of m) if(b.id === bid) return tid;
    return null;
  }
  const nomeDe = tid => {
    const eu = TO.estado && TO.estado.E && TO.estado.E.torcida;
    if(eu && eu.id === tid) return eu.nome;
    const o = (TO.mundo && TO.mundo.torcida) ? TO.mundo.torcida(tid) : indice().O.find(x => x.id === tid);
    return o ? o.nome : tid;
  };

  /* O BAIRRO PADRÃO DE UM PONTO DA IA (bar, loja, subsede sem bairro
     gravado): fora de todo bairro de sede, na zona da própria sede e
     depois nas vizinhas — a torcida abre o comércio no território
     dela. O hash é o de sempre (`id|tipo|i`), então o mesmo ponto fica
     no mesmo bairro pra sempre. */
  function bairroPadrao(o, tipo, i){
    const bs = bairrosDe(o.mapa);
    if(!bs.length) return null;
    const s = sedeDe(o.id, o.mapa);
    if(tipo === 'sede') return s || bs[hash(`${o.id}|sede`) % bs.length];
    const sedes = new Set([...(indice().sedes.get(o.mapa) || new Map()).values()].map(b => b.id));
    let cand = bs.filter(b => !sedes.has(b.id));
    if(!cand.length) cand = bs.slice();
    /* na cidade da sede (as praças de várias cidades, 01/10/2026): a
       torcida de Campina Grande abre o comércio em Campina Grande */
    if(s){ const mesma = cand.filter(b => (b.cidade || '') === (s.cidade || '')); if(mesma.length) cand = mesma; }
    if(s){
      /* a zona da sede; quando ela não tem bairro livre pra tanto ponto,
         entram as vizinhas */
      const c = cidadeDe(o.mapa), zs = zonaDe(c, s);
      const nivel = b => { const zb = zonaDe(c, b); return zb === zs ? 0 : (VIZINHAS[zs] || []).includes(zb) ? 1 : 2; };
      const z0 = cand.filter(b => nivel(b) === 0), z1 = cand.filter(b => nivel(b) <= 1);
      cand = z0.length > i ? z0 : z1.length ? z1 : cand;
    }
    return cand[hash(`${o.id}|${tipo}|${i}`) % cand.length];
  }

  /* =======================================================
     QUEM TEM O QUÊ, E ONDE (as estruturas de cada torcida na cidade)
     ======================================================= */
  const eu = E => E && E.torcida ? E.torcida.id : null;
  function estruturas(E, cid){
    const fora = [];
    const push = (tid, tipo, b, i, obj) => { if(b) fora.push({tid, tipo, bairro:b.id, i, obj:obj || null}); };
    const I = indice();
    const mundo = E && TO.relacoes && TO.relacoes.mundo ? TO.relacoes.mundo(E) : null;
    for(const o of I.torcidas.get(cid) || []){
      push(o.id, 'sede', sedeDe(o.id, cid), 0);
      if(E && o.id === eu(E)){
        const p = E.patrimonio || {};
        (p.bares || []).forEach((b, i) => push(o.id, 'bar', bairro(cid, b.bairro), i, b));
        (p.lojas || []).forEach((l, i) => push(o.id, 'loja', bairro(cid, l.bairro), i, l));
        (p.subsedes || []).forEach((s, i) => push(o.id, 'subsede', bairro(cid, s.bairro), i, s));
        /* A FÁBRICA (o 3D a pôs num galpão do bairro da sede, 02/10/2026) */
        if(p.fabrica) push(o.id, 'fabrica', sedeDe(o.id, cid), 0);
        continue;
      }
      const t = mundo && mundo[o.id];
      if(!t){ push(o.id, 'bar', bairroPadrao(o, 'bar', 0), 0); continue; }
      (t.bares || []).forEach((b, i) => push(o.id, 'bar', bairro(cid, b.bairro) || bairroPadrao(o, 'bar', i), i, b));
      (t.lojas || []).forEach((l, i) => push(o.id, 'loja', bairro(cid, l.bairro) || bairroPadrao(o, 'loja', i), i, l));
      for(let i = 0; i < (t.subsedes || 0); i++) push(o.id, 'subsede', bairroPadrao(o, 'subsede', i), i);
      if(t.fabrica) push(o.id, 'fabrica', sedeDe(o.id, cid), 0);
    }
    /* as subsedes de fora (filiais) que ficam NESTA cidade */
    if(E){
      const p = E.patrimonio || {};
      (p.filiais || []).forEach((f, i) => { if(f.cidade === cid) push(eu(E), 'filial', bairroDaFilial(eu(E), cid), i, f); });
      if(mundo) for(const id in mundo) (mundo[id].filiais || []).forEach((f, i) => {
        if(f.cidade === cid) push(id, 'filial', bairroDaFilial(id, cid), i, f);
      });
    }
    return fora;
  }
  /* o bairro da filial é o mesmo hash que o financeiro usa pra ela */
  function bairroDaFilial(tid, cid){
    const bs = bairrosDe(cid);
    return bs.length ? bs[hash(`${tid}|filial|${cid}`) % bs.length] : null;
  }

  /* =======================================================
     O PADRÃO DE PARTIDA (a semente do save + os dados)
     ======================================================= */
  const ehRival = (a, b) => {
    const t = TO.mundo && TO.mundo.relacaoBase ? TO.mundo.relacaoBase(a, b) : 'Neutro';
    return t === 'Rival' || t === 'Maior Rival';
  };
  /* O COMEÇO POR CIDADE (01/10/2026): numa praça de várias cidades,
     cada organizada começa na cidade dela (a da sede) — a régua de
     sempre (a maior e a segunda maior com uns 5 de cada 16, o resto
     pelos membros) vale dentro de cada cidade, com os bairros dela. A
     cidade sem organizada começa sem dona (Patos e Cajazeiras na
     Paraíba, Niterói no Subúrbio). Quem não tem sede fica com a cidade
     do clube, ou com a maior da praça. */
  function inicial(cid, semente, preferidos){
    const c = cidadeDe(cid), bs = (c && c.bairros) || [];
    const ts = torcidasDaCidade(cid);
    const fora = {b:{}};
    if(!bs.length || !ts.length) return fora;
    const r = sorteio(`${semente}|dominio|${cid}`);
    const sedes = indice().sedes.get(cid) || new Map();
    const grupos = new Map();
    for(const b of bs){
      const x = cidadeDoBairro(c, b);
      if(!grupos.has(x)) grupos.set(x, {bs:[], ts:[]});
      grupos.get(x).bs.push(b);
    }
    const maior = cidadesDa(cid)[0].nome;
    for(const t of ts){
      const s = sedes.get(t.id);
      let x = s ? cidadeDoBairro(c, s) : cidadeDoClube(t.clubeId);
      if(!grupos.has(x)) x = maior;
      grupos.get(x).ts.push(t);
    }
    for(const g of grupos.values()){
      if(!g.ts.length){ for(const b of g.bs) fora.b[b.id] = {}; continue; }
      inicialDaCidade(cid, g.bs, g.ts, sedes, r, preferidos, fora);
    }
    return fora;
  }
  function inicialDaCidade(cid, bs, ts, sedes, r, preferidos, fora){
    const N = bs.length;
    const quota = new Map(ts.map(t => [t.id, 0]));
    /* o tanto de bairros de cada uma */
    const k = Math.max(1, Math.round(N * 5 / 16));
    const varia = () => [0, 0, 1, -1][Math.floor(r() * 4)];
    const temSede = t => sedes.has(t.id) ? 1 : 0;
    if(ts.length === 1) quota.set(ts[0].id, N);
    else {
      const [t1, t2] = ts, resto = ts.slice(2);
      /* o empate no topo sai em 3 de cada 10 cidades ("podendo começar
         igualado e sem ninguém dominando"); no resto, uma tem um bairro a
         mais — e nem sempre é a maior */
      const empate = r() < 0.3;
      let k1 = Math.max(1, k + varia());
      let k2 = empate ? k1 : Math.max(1, k1 + (r() < 0.5 ? 1 : -1));
      const minResto = resto.reduce((s, t) => s + temSede(t), 0);
      const cabe = Math.max(2, N - minResto);
      while(k1 + k2 > cabe && (k1 > 1 || k2 > 1)){
        if(k1 > k2) k1--; else if(k2 > k1) k2--;
        else if(empate){ k1--; k2--; } else if(r() < 0.5) k1--; else k2--;
      }
      let sobra = N - k1 - k2;
      const q = resto.map(t => ({t, n:temSede(t)}));
      sobra -= q.reduce((s, x) => s + x.n, 0);
      /* o resto é rateado pelos membros de partida, com a sede de cada
         uma garantida e ninguém chegando no tamanho das duas maiores */
      const teto = Math.max(1, Math.min(k1, k2) - 1);
      for(let g = 0; sobra > 0 && g < 200; g++){
        const cand = q.filter(x => x.n < teto);
        if(!cand.length) break;
        cand.sort((a, b) => (b.t.membros || 1) / (b.n + 1) - (a.t.membros || 1) / (a.n + 1) || r() - 0.5);
        cand[0].n++; sobra--;
      }
      /* o que ninguém mais pode levar volta pras duas maiores; no empate,
         aos pares (o último que sobrar vai pra maior das outras) */
      let vez = r() < 0.5;
      while(sobra > 0){
        if(empate && sobra >= 2){ k1++; k2++; sobra -= 2; continue; }
        if(empate && q.length){ q.sort((a, b) => (b.t.membros || 0) - (a.t.membros || 0)); q[0].n++; sobra--; continue; }
        if(vez) k1++; else k2++;
        vez = !vez; sobra--;
      }
      if(!empate && k1 === k2 && k1 > 1){ if(r() < 0.5){ k1++; k2--; } else { k1--; k2++; } }
      for(const x of q) quota.set(x.t.id, x.n);
      quota.set(t1.id, k1); quota.set(t2.id, k2);
    }
    /* onde: a sede primeiro; depois, em rodadas, cada uma pega o bairro
       livre mais perto do que já tem (a mesma zona, depois a vizinha),
       com os pontos dela (`preferidos`) na frente */
    const dono = new Map(), tem = new Map(ts.map(t => [t.id, []]));
    for(const t of ts){
      const b = sedes.get(t.id);
      if(b && !dono.has(b.id) && quota.get(t.id) > 0){ dono.set(b.id, t.id); tem.get(t.id).push(b); }
    }
    /* cada uma pega o bairro livre onde o clube dela tem MAIS torcida (a
       presença: o reduto da sede, a zona dela, os bairros de mais gente),
       com os pontos dela (`preferidos`) na frente (01/10/2026) */
    const nota = (tid, b) => {
      let n = -12 * presencaDa(tid, cid, b);
      if(preferidos && preferidos[tid] && preferidos[tid].has(b.id)) n -= 15;
      return n + r() * 3;
    };
    for(let volta = 0; volta < N * 2; volta++){
      const querem = ts.filter(t => tem.get(t.id).length < quota.get(t.id));
      if(!querem.length) break;
      /* as rodadas começam por quem tem mais a pegar, com a ordem na sorte entre iguais */
      querem.sort((a, b) => (quota.get(b.id) - tem.get(b.id).length) - (quota.get(a.id) - tem.get(a.id).length) || r() - 0.5);
      let pegou = false;
      for(const t of querem){
        const livres = bs.filter(b => !dono.has(b.id));
        if(!livres.length) break;
        if(tem.get(t.id).length >= quota.get(t.id)) continue;
        const b = livres.map(b => [b, nota(t.id, b)]).sort((x, y) => x[1] - y[1])[0][0];
        dono.set(b.id, t.id); tem.get(t.id).push(b); pegou = true;
      }
      if(!pegou) break;
    }
    /* A BARRA DE 7 NO COMEÇO (o dono, 15/10/2026: "começa de forma
       proporcional, as torcidas maiores já começam com mais barras, e a
       torcida sempre tem um ponto fixo no bairro que tem sede"): a dona
       com 4 ou 5 (5 no bairro da sede; fora dela, a maior da cidade tem
       mais chance do 5), e em 6 de cada 10 bairros uma segunda com 1 ou
       2 (a rival primeiro). O resto é neutro. */
    const maiorM = Math.max(1, ...ts.map(t => t.membros || 0));
    for(const b of bs){
      const t = dono.get(b.id);
      if(!t){ fora.b[b.id] = {}; continue; }
      const naSede = (sedes.get(t) || {}).id === b.id;
      const peso = ((ts.find(o => o.id === t) || {}).membros || 0) / maiorM;
      const v = naSede ? 5 : (r() < 0.2 + 0.5 * peso ? 5 : 4);
      const p = {[t]: v};
      if(r() < 0.6){
        const outras = ts.filter(o => o.id !== t && !(TO.mundo && TO.mundo.saoIrmas && TO.mundo.saoIrmas(o.id, t)));
        const rivais = outras.filter(o => ehRival(o.id, t));
        const vizinhas = (rivais.length ? rivais : outras).filter(o => tem.get(o.id).some(x => x.zona === b.zona));
        const lista = vizinhas.length ? vizinhas : (rivais.length ? rivais : outras);
        if(lista.length){
          const o = lista[Math.floor(r() * lista.length)];
          p[o.id] = Math.min(MAX - v, r() < 0.4 ? 2 : 1);
        }
      }
      fora.b[b.id] = p;
    }
    /* o ponto fixo de cada sede, mesmo quando a dona do bairro é outra */
    for(const t of ts){
      const s = sedes.get(t.id), p = s && fora.b[s.id];
      if(p && !(p[t.id] >= 1)){
        const soma = Object.values(p).reduce((x, y) => x + y, 0);
        if(soma >= MAX){ const maior = Object.keys(p).sort((x, y) => p[y] - p[x])[0]; p[maior]--; }
        p[t.id] = 1;
      }
    }
    return fora;
  }

  /* =======================================================
     O ESTADO NO SAVE
     ======================================================= */
  function raiz(E){
    /* O SAVE ANTIGO (barra de 0 a 100) É REFEITO DO ZERO (dono, 15/10/2026):
       a distribuição nova sai da semente, como num save novo */
    if(!E.dominio || typeof E.dominio !== 'object' || E.dominio.v !== 2) E.dominio = {v:2};
    const D = E.dominio;
    D.c = D.c || {}; D.donos = D.donos || {}; D.log = D.log || [];
    return D;
  }
  const semente = E => (E && E.semente) || 1;
  /* os pontos de cada torcida na cidade do jogador, pra o começo dela */
  function preferidosDe(E, cid){
    const pr = {};
    for(const s of estruturas(E, cid)){
      if(s.tipo === 'sede') continue;
      (pr[s.tid] = pr[s.tid] || new Set()).add(s.bairro);
    }
    return pr;
  }
  /* a cidade pra LER: a gravada, ou o padrão de partida */
  function daCidade(E, cid){
    const D = raiz(E);
    if(D.c[cid]) return D.c[cid];
    /* a do jogador é gravada na primeira leitura (o começo dela lê os
       pontos que ele tem hoje, que mudam) */
    if(E.torcida && cid === E.torcida.mapa){
      D.c[cid] = inicial(cid, semente(E), preferidosDe(E, cid));
      return D.c[cid];
    }
    const ch = semente(E) + '|' + cid;
    let g = memo.get(ch);
    if(!g){ g = inicial(cid, semente(E), preferidosDe(null, cid)); memo.set(ch, g); }
    return g;
  }
  /* a cidade pra MEXER: a cópia vai pro save */
  function paraMexer(E, cid){
    const D = raiz(E);
    if(!D.c[cid]) D.c[cid] = JSON.parse(JSON.stringify(daCidade(E, cid)));
    D.c[cid].b = D.c[cid].b || {};
    return D.c[cid];
  }

  /* as partes de um bairro, da maior pra menor: [{t, v}] */
  function partes(E, cid, bid){
    const p = ((daCidade(E, cid).b) || {})[bid] || {};
    return Object.keys(p).filter(t => p[t] > 0).map(t => ({t, v:p[t]})).sort((a, b) => b.v - a.v || (a.t < b.t ? -1 : 1));
  }
  const donaDoObjeto = p => {
    let m = null;
    for(const t in p) if(p[t] >= DOMINA && (!m || p[t] > p[m])) m = t;
    return m;
  };
  const donaDoBairro = (E, cid, bid) => donaDoObjeto(((daCidade(E, cid).b) || {})[bid] || {});

  /* os bairros da cidade prontos pra tela */
  function bairros(E, cid){
    return bairrosDe(cid).map(b => {
      const ps = partes(E, cid, b.id);
      const dono = ps.length && ps[0].v >= DOMINA ? ps[0].t : null;
      return {id:b.id, nome:b.nome, zona:b.zona, semZona:semZonas(cidadeDe(cid)), classe:b.classe, mult:b.mult, cidade:cidadeDoBairro(cidadeDe(cid), b),
              dono, v: dono ? ps[0].v : 0, partes:ps, sede:casaDe(cid, b.id)};
    });
  }
  /* quantos bairros cada uma tem, e quem domina a cidade (a que tem
     mais que todas; empate no topo, ninguém) */
  function placar(E, cid){
    const n = {};
    let semDono = 0;
    const bs = bairrosDe(cid);
    const st = daCidade(E, cid).b || {};
    for(const b of bs){
      const d = donaDoObjeto(st[b.id] || {});
      if(d) n[d] = (n[d] || 0) + 1; else semDono++;
    }
    const ord = Object.keys(n).sort((a, b) => n[b] - n[a]);
    const dono = ord.length && (ord.length === 1 || n[ord[0]] > n[ord[1]]) ? ord[0] : null;
    return {n, semDono, dono, total:bs.length, ordem:ord};
  }
  const donaDaCidade = (E, cid) => placar(E, cid).dono;

  /* os membros de hoje de cada torcida (o jogador conta a lista dele) */
  function membrosDe(E, tid){
    if(E && E.torcida && tid === E.torcida.id) return (E.membros || []).length;
    const m = E && E.mundoTorcidas && E.mundoTorcidas[tid];
    if(m) return m.membros || 0;
    const o = indice().O.find(x => x.id === tid);
    return (o && o.membros) || 0;
  }
  /* a primeira e a segunda maior da cidade, pelos membros de hoje */
  function maiores(E, cid){
    return torcidasDaCidade(cid).map(o => ({id:o.id, n:membrosDe(E, o.id)}))
      .sort((a, b) => b.n - a.n || (a.id < b.id ? -1 : 1)).slice(0, 2).map(x => x.id);
  }

  /* AMIGAS NÃO SE ATACAM NEM COBREM O PIXO UMA DA OUTRA (o dono, 02/10/2026:
     "a Jovem Garra Tricolor chegou na praça de Granja Portugal em cima da
     reunião da Zona Oeste... Isso não acontece quando as torcidas são
     aliadas. Nem uma cobrir o pixo da outra"): irmãs do mesmo clube, e
     quem está em Aliado ou Irmandade HOJE (relação de +20 pra cima, a
     régua do rótulo da Diplomacia) */
  const ALIADA = 20;
  function amigas(E, a, b){
    if(!a || !b) return false;
    if(a === b) return true;
    if(TO.mundo && TO.mundo.saoIrmas && TO.mundo.saoIrmas(a, b)) return true;
    const R = TO.relacoes, meu = eu(E);
    if(!E || !R) return false;
    if(a === meu || b === meu) return R.nivel(E, a === meu ? b : a) >= ALIADA;
    return R.relacaoDelas ? R.relacaoDelas(E, a, b) >= ALIADA : false;
  }
  /* rival de verdade, pela relação de HOJE (a mesma régua do rótulo
     da Diplomacia: abaixo de −15 é Rival). Irmãs nunca. */
  function rivais(E, a, b){
    if(!a || !b || a === b) return false;
    if(TO.mundo && TO.mundo.saoIrmas && TO.mundo.saoIrmas(a, b)) return false;
    const R = TO.relacoes, meu = eu(E);
    if(E && R && (a === meu || b === meu)) return R.nivel(E, a === meu ? b : a) < -15;
    if(E && R && R.relacaoDelas) return R.relacaoDelas(E, a, b) < -15;
    return ehRival(a, b);
  }
  /* O FATOR DA RECEITA DE UM PONTO (volta do corte, dono 16/10/2026:
     "volte a aplicar o debuff de receitas de estruturas cujo bairro é
     dominado por outra torcida, inclusive a sede agora"): bar, loja,
     subsede, subsede de fora e a festa da sede rendem 70% quando o
     bairro tem dona (4 pontos ou mais) e ela não é a própria torcida nem
     aliada ou irmã dela. Vale pra nós e pras IAs. */
  function fator(E, tid, cid, b){
    const x = bairro(cid, b);
    if(!E || !x || !tid) return 1;
    const d = donaDoBairro(E, cid, x.id);
    return d && d !== tid && !amigas(E, tid, d) ? CORTE : 1;
  }
  /* a nota que a linha do financeiro leva quando corta */
  function notaDoCorte(E, tid, cid, b){
    const x = bairro(cid, b);
    if(!E || !x || fator(E, tid, cid, x) === 1) return '';
    return _t('bairro da {sigla} −30%', {sigla:siglaDe(donaDoBairro(E, cid, x.id))});
  }
  function siglaDe(tid){
    const o = TO.mundo && TO.mundo.torcida ? TO.mundo.torcida(tid) : indice().O.find(x => x.id === tid);
    if(!o) return tid;
    return (o.siglaTorcida || o.nome || tid);
  }

  /* =======================================================
     A TORCIDA DO BAIRRO (o dono, 01/10/2026: "Quero começar a dividir
     a quantidade da torcida por bairro ... não vai compensar ter
     bar/loja/subsede em bairro que tem pouca torcida, agora em bairros
     que tem mais torcida vai arrecadar mais").

     O TOTAL de cada clube na praça é o do jogo (o da planilha, que a
     virada do ano mexe: TO.mundo.torcedoresDoClubeNa); o que muda é
     como ele se reparte. O PESO de um bairro pra um clube:
       · a gente do bairro: favela 1,3, Classe Baixa 1,15, Média 1,
         Nobre 0,8 (bairro pobre tem mais gente por quarteirão);
       · a cidade: o clube da praça mora na cidade dele — numa praça de
         várias cidades, o bairro de outra cidade pesa 0,08 (uns 85% da
         torcida fica em casa). O clube de fora (Flamengo, Corinthians…)
         e o da praça de uma cidade só pesam 1 em todo bairro;
       · o reduto: o bairro da sede de uma organizada do clube, ×1,6; os
         da mesma zona e da mesma cidade dela, ×1,25;
       · uma variação fixa de até 15% pra cima ou pra baixo (o hash da
         praça, do clube e do bairro), a mesma em todo save.
     A PRESENÇA (P) do clube num bairro é o peso dele ali sobre a média
     dos bairros da cidade dele (de todos, pro clube de fora): 1 é o
     bairro médio da casa. Ela não depende do total, só da repartição.
       · RECEITA de bar, loja e subsede: × (0,5 + 0,5 × P), com P até 2
         (×0,5 sem torcida, ×1 na média, até ×1,5 no reduto);
       · GANHO no domínio: × (0,4 + 0,6 × P), com P até 1,5.
     ======================================================= */
  const POVO = {'Favela':1.3, 'Classe Baixa':1.15, 'Classe Média':1.0, 'Nobre':0.8};
  const DE_FORA = 0.08, REDUTO_SEDE = 1.6, REDUTO_ZONA = 1.25, VARIA = 0.15;
  const TORCIDA = {receita:{base:0.5, teto:2}, ganho:{base:0.4, teto:1.5}};
  const cidadeDoBairro = (c, b) => (b && b.cidade) || (c && c.nome) || '';
  /* A PRAÇA SEM ZONA (o dono, 01/10/2026: "essas praças com mais de 2
     cidades não vão ter mais zonas pra facilitar a criação do design do
     mapa"): na praça de três cidades ou mais o mapa é de cidades, não de
     quatro gomos — a zona de um bairro é a cidade dele */
  const semZonasDe = new Map();
  function semZonas(c){
    if(!c || !c.bairros) return false;
    if(!semZonasDe.has(c)) semZonasDe.set(c, new Set(c.bairros.map(b => cidadeDoBairro(c, b))).size >= 3);
    return semZonasDe.get(c);
  }
  const zonaDe = (c, b) => b ? (semZonas(c) ? 'cidade:' + cidadeDoBairro(c, b) : b.zona) : null;
  const cidadeDoClube = k => { const t = indice().times.get(k); return t ? (t.cidade || '') : ''; };
  /* as cidades da praça (a de mais bairros primeiro) */
  function cidadesDa(cid){
    const c = cidadeDe(cid), n = new Map();
    for(const b of (c && c.bairros) || []){ const x = cidadeDoBairro(c, b); n.set(x, (n.get(x) || 0) + 1); }
    return [...n.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).map(([nome, bairros]) => ({nome, bairros}));
  }
  function pesos(cid){
    const ch = 'pesos|' + cid;
    if(memo.has(ch)) return memo.get(ch);
    const I = indice(), c = I.cidade.get(cid), bs = (c && c.bairros) || [];
    const daPraca = new Set(bs.map(b => cidadeDoBairro(c, b)));
    const varias = daPraca.size > 1;
    const sedesDoClube = new Map();
    for(const o of I.torcidas.get(cid) || []){
      const b = (I.sedes.get(cid) || new Map()).get(o.id);
      if(!b || !o.clubeId) continue;
      if(!sedesDoClube.has(o.clubeId)) sedesDoClube.set(o.clubeId, []);
      sedesDoClube.get(o.clubeId).push(b);
    }
    const por = new Map();
    for(const t of (c && c.times) || []){
      const k = t.clubeId, casa = cidadeDoClube(k);
      const daCasa = varias && !!t.local && daPraca.has(casa);
      const w = bs.map(b => {
        const cb = cidadeDoBairro(c, b);
        let v = POVO[b.classe] || 1;
        if(daCasa && cb !== casa) v *= DE_FORA;
        let red = 1;
        for(const s of sedesDoClube.get(k) || []){
          if(s.id === b.id) red = Math.max(red, REDUTO_SEDE);
          else if(zonaDe(c, s) === zonaDe(c, b) && cidadeDoBairro(c, s) === cb) red = Math.max(red, REDUTO_ZONA);
        }
        return v * red * (1 - VARIA + 2 * VARIA * (hash(`${cid}|${k}|${b.id}`) % 10000) / 10000);
      });
      const ref = bs.map((b, i) => i).filter(i => !daCasa || cidadeDoBairro(c, bs[i]) === casa);
      const media = ref.reduce((s, i) => s + w[i], 0) / Math.max(1, ref.length);
      por.set(k, {w, media, soma:w.reduce((s, v) => s + v, 0), daCasa, casa, time:t});
    }
    const r = {bs, idx:new Map(bs.map((b, i) => [b.id, i])), por, varias};
    memo.set(ch, r);
    return r;
  }
  /* a presença do clube k no bairro (1 = o bairro médio da cidade dele) */
  function presenca(cid, k, b){
    const x = bairro(cid, b);
    if(!x || !k) return 1;
    const W = pesos(cid), p = W.por.get(k);
    if(!p || !(p.media > 0)) return 1;
    return p.w[W.idx.get(x.id)] / p.media;
  }
  /* o clube de uma torcida (a do jogador, a dos dados) */
  function clubeDe(tid){
    const eu = TO.estado && TO.estado.E && TO.estado.E.torcida;
    if(eu && eu.id === tid && eu.clubeId) return eu.clubeId;
    const o = indice().porId.get(tid);
    return o ? o.clubeId : null;
  }
  const presencaDa = (tid, cid, b) => presenca(cid, clubeDe(tid), b);
  /* o fator da RECEITA de um ponto (bar, loja, subsede, filial) da torcida no bairro */
  function fatorTorcida(E, tid, cid, b){
    if(!b) return 1;
    return TORCIDA.receita.base + (1 - TORCIDA.receita.base) * Math.min(presencaDa(tid, cid, b), TORCIDA.receita.teto);
  }
  /* o fator do GANHO na barra (os pontos de uma ação no bairro) */
  function fatorGanho(E, tid, cid, b){
    if(!b) return 1;
    return TORCIDA.ganho.base + (1 - TORCIDA.ganho.base) * Math.min(presencaDa(tid, cid, b), TORCIDA.ganho.teto);
  }
  /* quantos torcedores de cada clube moram no bairro (o total de hoje de
     cada clube na praça, repartido pelos pesos), do maior pro menor */
  function torcedoresNoBairro(cid, b){
    const x = bairro(cid, b);
    if(!x) return [];
    const W = pesos(cid), i = W.idx.get(x.id), out = [];
    for(const [k, p] of W.por){
      const T = TO.mundo && TO.mundo.torcedoresDoClubeNa ? TO.mundo.torcedoresDoClubeNa(cid, k) : (p.time.torcedores || 0);
      out.push({clubeId:k, clube:p.time.clube || k, sigla:p.time.sigla || '', n:p.soma > 0 ? T * p.w[i] / p.soma : 0});
    }
    const tot = out.reduce((s, o) => s + o.n, 0) || 1;
    for(const o of out) o.perc = o.n / tot;
    return out.sort((a, c) => c.n - a.n || (a.clubeId < c.clubeId ? -1 : 1));
  }
  /* a parte do clube da torcida no bairro (0 a 1) */
  function parteDaTorcida(tid, cid, b){
    const k = clubeDe(tid), l = torcedoresNoBairro(cid, b), o = l.find(x => x.clubeId === k);
    return o ? o.perc : 0;
  }
  /* o número de duas casas no idioma do jogo (na planta sozinha, com vírgula) */
  const duas = v => (TO.util && TO.util.numero) ? TO.util.numero(v, 2) : v.toFixed(2).replace('.', ',');
  /* uma casa, sem o ",0" (a barra nos textos da briga: 34%, 41,5%) */
  const umaCasa = v => String((TO.util && TO.util.numero) ? TO.util.numero(v, 1) : v.toFixed(1).replace('.', ',')).replace(/[,.]0$/, '');
  /* a nota curta do fator, pra linha do financeiro: "torcida ×0,87" */
  function notaDaTorcida(E, tid, cid, b){
    const f = fatorTorcida(E, tid, cid, b);
    if(Math.abs(f - 1) < 0.005) return '';
    return _t('torcida ×{f}', {f:duas(f)});
  }

  /* =======================================================
     A BRIGA MEXE 1 PONTO (o dono, 15/10/2026)
     "Se a TUF tem 1 ponto de domínio e vence uma briga contra a
     Cearamor que tem 4 pontos num bairro, ganha 1 ponto naquele bairro
     e a Cearamor perde um." Quem perdeu e não tem ponto ali (ou só tem
     o fixo da sede): o vencedor tira 1 do neutro; sem neutro, nada.
     ======================================================= */
  /* o ponto fixo: a sede da torcida no bairro, ou a filial dela ali */
  function fixoDe(E, cid, bid, tid){
    if(!tid) return 0;
    if(casaDe(cid, bid) === tid) return 1;
    const o = (TO.mundo && TO.mundo.torcida) ? TO.mundo.torcida(tid) : indice().porId.get(tid);
    if(o && o.mapa !== cid){
      const f = bairroDaFilial(tid, cid);
      if(f && f.id === bid && temFilialEm(E, tid, cid)) return 1;
    }
    return 0;
  }
  function temFilialEm(E, tid, cid){
    if(!E) return false;
    if(tid === eu(E)) return ((E.patrimonio || {}).filiais || []).some(f => f.cidade === cid);
    const m = TO.relacoes && TO.relacoes.mundo ? TO.relacoes.mundo(E)[tid] : null;
    return !!(m && (m.filiais || []).some(f => f.cidade === cid));
  }
  const somaDe = p => Object.keys(p).reduce((x, k) => x + (p[k] || 0), 0);
  /* a conta pura (a prévia roda numa cópia) */
  function passarPonto(E, cid, bid, p, venc, perd){
    const antesV = p[venc] || 0, antesP = perd ? (p[perd] || 0) : 0;
    if(antesV >= MAX) return {ganho:0, antesV, antesP};
    if(perd && antesP > fixoDe(E, cid, bid, perd)){
      p[perd] = antesP - 1; if(!p[perd]) delete p[perd];
      p[venc] = antesV + 1;
      return {ganho:1, tirou:perd, antesV, antesP};
    }
    if(somaDe(p) < MAX){ p[venc] = antesV + 1; return {ganho:1, tirou:null, antesV, antesP}; }
    return {ganho:0, antesV, antesP};
  }
  function transferir(E, cid, b, venc, perd, motivo){
    const x = bairro(cid, b);
    if(!E || !x || !venc || venc === perd) return null;
    const st = paraMexer(E, cid);
    const p = st.b[x.id] = st.b[x.id] || {};
    const dono0 = donaDoObjeto(p);
    const q = passarPonto(E, cid, x.id, p, venc, perd);
    const dono1 = donaDoObjeto(p);
    const r = {cid, bairro:x, tid:venc, contra:perd || null, antes:q.antesV, depois:p[venc] || 0, ganho:q.ganho,
               contraAntes:q.antesP, contraDepois:perd ? (p[perd] || 0) : 0, tirou:q.tirou || null, dono0, dono1};
    if(dono0 !== dono1) virou(E, r, motivo || '');
    return r;
  }
  /* (compatibilidade: quem ainda chama `mexer` com pontos de 0 a 100
     ganha 1 ponto, tirado de `contra`) */
  function mexer(E, cid, b, tid, pts, opc){
    return pts > 0 ? transferir(E, cid, b, tid, (opc || {}).contra || null, (opc || {}).motivo) : null;
  }
  function fecharBarra(p){ return p; }

  /* o bairro mudou de dona: fica no registro, e o jogador sabe quando
     é com ele ou na cidade dele */
  function virou(E, r, motivo){
    const D = raiz(E);
    const abs = (E.data && E.data.absoluto) || 0;
    D.log.unshift({abs, ano:E.data && E.data.ano, semana:E.data && E.data.semana,
                   cid:r.cid, bairro:r.bairro.id, de:r.dono0 || null, para:r.dono1 || null, motivo});
    if(D.log.length > 60) D.log.pop();
    const meu = eu(E);
    if(!meu) return;
    const nb = r.bairro.nome, cidade = (cidadeDe(r.cid) || {}).nome || r.cid;
    let texto = null;
    if(r.dono1 === meu)
      texto = r.dono0 ? _t('Tomamos {bairro} ({cidade}) da {de}. O bairro agora é nosso.', {bairro:nb, cidade, de:nomeDe(r.dono0)})
                      : _t('{bairro} ({cidade}) chegou a 4 pontos pra nós. O bairro agora é nosso.', {bairro:nb, cidade});
    else if(r.dono0 === meu && casaDe(r.cid, r.bairro.id) === meu)
      texto = r.dono1 ? _t('Perdemos o bairro da nossa sede, {bairro}, pra {para}: −0,2 de moral por dia até retomar.', {bairro:nb, para:nomeDe(r.dono1)})
                      : _t('O bairro da nossa sede, {bairro}, caiu abaixo de 4 pontos: −0,2 de moral por dia até retomar.', {bairro:nb});
    else if(r.dono0 === meu)
      texto = r.dono1 ? _t('Perdemos {bairro} ({cidade}) pra {para}.', {bairro:nb, cidade, para:nomeDe(r.dono1)})
                      : _t('{bairro} ({cidade}) caiu abaixo de 4 pontos pra nós: o bairro está em disputa.', {bairro:nb, cidade});
    else if(r.cid === E.torcida.mapa){
      /* O BAIRRO DOS OUTROS VAI PRO RESUMO DA SEMANA (02/10/2026): um
         cartão por virada enchia o feed; fica a última dona de cada um */
      D.semanaVirou = (D.semanaVirou || []).filter(x => x.b !== r.bairro.id);
      D.semanaVirou.push({b:r.bairro.id, de:r.dono0 || null, para:r.dono1 || null});
    }
    if(texto) avisar(E, texto, `dominio|${abs}|${r.cid}|${r.bairro.id}|${r.dono1 || '-'}`);
  }
  function avisar(E, texto, chave){
    if(TO.feed && TO.feed.propor)
      TO.feed.propor(E, {kind:'dominio', peso:'info', voz:'porrada', chave, texto});
  }

  /* =======================================================
     O DIA (o dono, 15/10/2026: "mantém só os dois efeitos"): quem domina
     a cidade ganha +0,1 de prestígio e de moral por dia e as duas
     maiores que não dominam perdem 0,1; quem não é dona do bairro da
     própria sede perde 0,2 de moral por dia. Nada rende ponto por dia.
     ======================================================= */
  /* o que o dia faz no indicador: o jogador leva direto (o livro de
     moral e prestígio ganha uma linha por semana, não 7); as IAs, pelo
     `mover` delas */
  function noIndicador(E, tid, q){
    if(tid === eu(E)){
      const I = E.indicadores, D = raiz(E);
      D.acum = D.acum || {prestigio:0, moral:0};
      for(const k of ['prestigio', 'moral']){
        const a = I[k] || 0;
        I[k] = limitar(a + q, 0, 20);
        D.acum[k] = (D.acum[k] || 0) + (I[k] - a);
      }
      return;
    }
    if(TO.relacoes && TO.relacoes.mover){
      TO.relacoes.mover(E, tid, 'prestigio', q);
      TO.relacoes.mover(E, tid, 'moral', q);
    }
  }
  /* a moral de quem não é dona do bairro da própria sede: −0,2 por dia */
  function sedesPerdidas(E){
    const I = indice(), meu = eu(E);
    for(const cid of I.comTorcida){
      for(const [tid, b] of (I.sedes.get(cid) || new Map())){
        if(donaDoBairro(E, cid, b.id) === tid) continue;
        if(tid === meu){
          const In = E.indicadores, D = raiz(E), a = In.moral || 0;
          In.moral = limitar(a - SEDE_PERDIDA, 0, 20);
          D.acum = D.acum || {prestigio:0, moral:0};
          D.acum.moral = (D.acum.moral || 0) + (In.moral - a);
        } else if(TO.relacoes && TO.relacoes.mover) TO.relacoes.mover(E, tid, 'moral', -SEDE_PERDIDA);
      }
    }
  }
  function fecharLivro(E){
    const D = raiz(E), a = D.acum;
    if(!a) return;
    const cidade = (cidadeDe(E.torcida.mapa) || {}).nome || '';
    for(const k of ['prestigio', 'moral']){
      const v = Math.round((a[k] || 0) * 100) / 100;
      if(!v) continue;
      E.historicoIndicadores = E.historicoIndicadores || [];
      E.historicoIndicadores.unshift({dia:`${E.data.semana}/${E.data.dia}`, ano:E.data.ano, ind:k, delta:v,
        motivo: v > 0 ? _t('Dominamos {cidade} (a semana)', {cidade}) : _t('Sem o domínio de {cidade} (a semana)', {cidade})});
      if(E.historicoIndicadores.length > 300) E.historicoIndicadores.pop();
    }
    D.acum = {prestigio:0, moral:0};
  }

  function dia(E){
    if(!E || !E.data) return;
    const D = raiz(E), abs = E.data.absoluto || 0;
    if(D.dia === abs) return;
    D.dia = abs;
    const I = indice(), minha = E.torcida.mapa;
    for(const cid of I.comTorcida){
      const pl = placar(E, cid);
      const dono = pl.dono || null;
      if(dono) noIndicador(E, dono, DIA);
      for(const t of maiores(E, cid)) if(t !== dono) noIndicador(E, t, -DIA);
      const antes = D.donos[cid];
      D.donos[cid] = dono;
      if(antes !== undefined && antes !== dono && cid === minha) avisarCidade(E, cid, antes, dono, pl);
    }
    try{ sedesPerdidas(E); }catch(e){ /* a moral não derruba o dia */ }
    if(E.data.dia === 1){ fecharLivro(E); resumoDaSemana(E); }
    /* a briga de bairro das IAs entre si: uma por mês cada (15/10/2026) */
    try{ brigasDasIAs(E); }catch(e){ console.warn('[domínio] brigas das IAs', e); }
  }
  /* os bairros que trocaram de dona na nossa cidade na semana, num cartão só */
  function resumoDaSemana(E){
    const D = raiz(E), l = D.semanaVirou || [];
    D.semanaVirou = [];
    const cid = E.torcida.mapa;
    const itens = l.map(v => {
      const x = bairro(cid, v.b);
      if(!x || donaDoBairro(E, cid, x.id) !== v.para) return null;     // virou de novo e voltou
      return v.para ? _t('{bairro} agora é da {nome}', {bairro:x.nome, nome:nomeDe(v.para)})
                    : _t('{bairro} ficou sem dona', {bairro:x.nome});
    }).filter(Boolean);
    if(!itens.length) return;
    avisar(E, _t('Na semana, os bairros da cidade: {lista}.', {lista:itens.join('; ')}),
           `dominio-semana|${E.data.ano}|${E.data.semana}`);
  }
  function avisarCidade(E, cid, antes, dono, pl){
    const cidade = (cidadeDe(cid) || {}).nome || cid, meu = eu(E);
    const n = dono ? pl.n[dono] : 0;
    const texto = dono === meu ? _t('Dominamos {cidade}: {n} de {total} bairros são nossos. +0,1 de prestígio e de moral por dia.', {cidade, n, total:pl.total})
      : dono ? _t('A {nome} domina {cidade} com {n} de {total} bairros.', {nome:nomeDe(dono), cidade, n, total:pl.total})
      : antes === meu ? _t('Perdemos o domínio de {cidade}: agora ninguém tem mais bairros que todo mundo.', {cidade})
      : _t('{cidade} ficou sem dona: empate no número de bairros.', {cidade});
    avisar(E, texto, `dominio-cidade|${E.data.absoluto}|${cid}|${dono || '-'}`);
  }

  /* =======================================================
     A BRIGA DE BAIRRO DAS IAs (o dono, 15/10/2026: "as IAs também brigam
     por bairro entre elas, pro mapa se mexer sem a gente")
     Cada organizada da IA tenta uma briga por mês, num dia fixo pela
     semente, contra a dona de um bairro da cidade dela que não seja
     aliada nem irmã (filial de fora conta). O alvo é a DONA do bairro.
     Resolve no simulado: a chance de vencer é a força de quem ataca (até
     20) sobre a soma com a de quem defende (os moradores, até 15). Quem
     vence leva 1 ponto ali. A nossa torcida fica de fora: contra nós são
     os dois ataques do mês, no feed.
     ======================================================= */
  const mesDe = E => (E.data.ano || 0) * 12 + Math.floor(((E.data.semana || 1) - 1) / 4.35);
  /* quem apanha num ataque de `atk` ao bairro: a dona; sem dona, a que
     tem mais pontos ali (fora a atacante, as aliadas dela e a gente) */
  function defensoraDe(E, b, atk){
    const meu = eu(E);
    const ok = t => t && t !== atk && t !== meu && !amigas(E, atk, t);
    if(b.dono) return ok(b.dono) ? b.dono : null;
    const p = b.partes.find(x => ok(x.t));
    return p ? p.t : null;
  }
  function brigasDasIAs(E){
    const mundo = TO.relacoes && TO.relacoes.mundo ? TO.relacoes.mundo(E) : null;
    if(!mundo) return;
    const I = indice(), meu = eu(E), mes = mesDe(E), abs = E.data.absoluto || 0;
    const EL = TO.elenco;
    for(const cid of I.comTorcida){
      for(const o of torcidasDaCidade(cid)){
        if(o.id === meu || !mundo[o.id]) continue;
        const r = sorteio(`${semente(E)}|bairroIA|${o.id}|${mes}`);
        /* o dia do mês dela: 1 em cada ~30 dias, fixo pela semente */
        if(hash(`${semente(E)}|diaIA|${o.id}|${mes}`) % 30 !== abs % 30) continue;
        /* quem defende: a dona; no bairro em disputa, a maior que não é
           ela, nem aliada, nem a gente (sem isso a cidade inteira virava
           "em disputa" em um ano e ninguém mais a fechava) */
        const bs = bairros(E, cid).map(b => ({...b, def:defensoraDe(E, b, o.id)})).filter(b => b.def);
        if(!bs.length) continue;
        /* onde ela já tem ponto, ou vizinho do que é dela, na frente */
        const minhas = new Set(bairros(E, cid).filter(b => b.dono === o.id).map(b => b.id));
        const nota = b => ((b.partes.find(x => x.t === o.id) || {}).v || 0) * 3 +
          (vizinhosDe(cid, b.id).some(v => minhas.has(v.id)) ? 2 : 0) + r() * 3;
        /* PERDEU O BAIRRO DA SEDE, VAI ATRÁS DELE (dono, 16/10/2026): sem
           o domínio de casa, o ataque do mês é lá, contra quem estiver
           mandando ou com mais ponto */
        const sb = sedeDe(o.id, cid);
        const casa = sb ? bs.find(b => b.id === sb.id && b.dono !== o.id) : null;
        const alvo = casa || bs.sort((a, c) => nota(c) - nota(a))[0];
        const soma = (l, max) => l.reduce((x, m) => x + (m.forca || 5) + (m.defesa || 5), 0) || max * 8;
        /* os moradores defendem (até 15) e o ataque vem com até 60% a mais */
        const defs = EL ? EL.noBairro(E, alvo.def, cid, alvo.id, 15) : [];
        const maxA = EL ? EL.ataqueSorteado(defs.length, r()) : 20;
        const fa = soma(EL ? EL.maisFortes(E, o.id, cid, maxA) : [], maxA), fd = soma(defs, 15);
        const venceu = r() < fa / (fa + fd);
        const venc = venceu ? o.id : alvo.def, perd = venceu ? alvo.def : o.id;
        transferir(E, cid, alvo.id, venc, perd, 'briga-ia');
        if(TO.relacoes.moverRelacao) try{ TO.relacoes.moverRelacao(E, o.id, alvo.def, -2); }catch(_){}
      }
    }
  }
  /* (as metas mensais antigas da IA saíram: ficam as portas, vazias) */
  function metasDoDia(){}
  function alvosDe(){ return []; }

  /* A PIXAÇÃO SAIU DO JOGO (dono, 15/10/2026: "sem pixação"): as portas
     que o resto do código ainda chama ficam, sem efeito */
  const PIX = {dia:0, cota:() => 0, lider:0, desbota:0};
  const vagasPix = () => 0;
  function muros(){ return []; }
  function saldoPix(){ return {cota:0, extra:0, lider:0, total:0, usadas:0, resta:0}; }
  function pixar(){ return {ok:false, msg:''}; }
  function ganharPix(){}

  /* =======================================================
     O RECRUTAMENTO POR BAIRRO continua escolhendo ONDE se recruta (a
     chance do novato pesa pela torcida do clube no bairro, e o novato
     passa a morar ali — o elenco fixo, 15/10/2026), mas não rende mais
     ponto de domínio.
     ======================================================= */
  const RECRUTA_DIA = 0;
  function bairrosPraRecrutar(E, tid, cid, n){
    tid = tid || eu(E); cid = cid || (tid === eu(E) ? E.torcida.mapa : ((TO.mundo && TO.mundo.torcida(tid)) || {}).mapa);
    const bs = bairros(E, cid);
    return bs.map(b => {
      const pres = presencaDa(tid, cid, b.id), minha = (b.partes.find(p => p.t === tid) || {}).v || 0;
      return {id:b.id, nome:b.nome, presenca:pres, minha, dono:b.dono, v:b.v,
              nota:Math.min(pres, 2) * (b.sede && b.sede !== tid ? 0.6 : 1)};
    }).sort((a, c) => c.nota - a.nota).slice(0, n || 3);
  }
  function bairroDoRecrutamento(E){
    const r = E.recrutamento;
    if(r && r.bairro && bairro(E.torcida.mapa, r.bairro)) return bairro(E.torcida.mapa, r.bairro);
    const l = bairrosPraRecrutar(E, eu(E), E.torcida.mapa, 1);
    return l.length ? bairro(E.torcida.mapa, l[0].id) : null;
  }
  function pesoDoRecrutamento(E){
    const b = bairroDoRecrutamento(E);
    return b ? 0.7 + 0.3 * Math.min(presencaDa(eu(E), E.torcida.mapa, b.id), 2) : 1;
  }
  function recrutouHoje(){}
  function recrutandoEm(E, cid){
    const out = new Map(), meu = eu(E);
    if(cid === E.torcida.mapa){ const b = bairroDoRecrutamento(E); if(b) out.set(meu, b); }
    return out;
  }
  /* a ação social no bairro saiu junto (só briga mexe na barra) */
  function podeSocial(){ return {ok:false, motivo:''}; }
  function social(){ return {ok:false, msg:''}; }
  function alvoSocial(){ return null; }

  /* =======================================================
     AS AÇÕES QUE MEXEM NA BARRA
     ======================================================= */
  /* ONDE FOI A BRIGA (o dono, 02/10/2026: "confira se todas as ações de
     briga do jogo vinculam a algum bairro"): TODA briga do jogador cai
     num bairro, e é a mesma conta pro anúncio (a prévia) e pro fim
     (`confronto`). O bairro vem da briga; sem ele:
       · a estrada (emboscada na caravana): a entrada da praça de
         passagem por onde a caravana passa;
       · a arquibancada, a pista, os arredores e a escolta: o bairro do
         estádio do jogo;
       · a concentração: a porta da sede de quem foi atacado (fora de
         casa, sem sede nossa lá, o bairro do estádio deles).
     A cidade vem da briga; sem ela, a nossa. O bairro também pode ser o
     nome de uma cidade (a briga da subsede de fora). Empate não mexe. */
  function ondeDaBriga(E, d){
    if(!E || !d || !d.torcidaId) return null;
    const meu = eu(E), rival = d.torcidaId;
    const L = d.local || {};
    const cena = String(L.cena || '');
    let cid = L.cidade || null, b = null;
    const tenta = (c, x) => { const y = c && bairro(c, x); if(y){ cid = c; b = y; } return !!y; };
    if(cid && L.bairro) tenta(cid, L.bairro);
    if(!b && L.bairro){
      /* o bairro pode ser da nossa cidade, da do rival (jogo fora) ou
         ser o nome de uma cidade (a briga da subsede de fora) */
      const oRival = (TO.mundo && TO.mundo.torcida(rival)) || {};
      if(!tenta(E.torcida.mapa, L.bairro) && !tenta(oRival.mapa, L.bairro)){
        const c = indice().C.find(x => norm(x.nome) === norm(L.bairro) || x.id === L.bairro);
        if(c){ cid = c.id; b = bairroDaFilial(meu, c.id); }
      }
    }
    if(!cid || !bairrosDe(cid).length) cid = E.torcida.mapa;
    const atacado = d.atacamos ? rival : meu;
    const estrada = !!d.estrada || /^emb/.test(cena);
    if(!b){
      if(estrada) b = bairroDaEntrada(cid, L.chave || `${rival}|${cid}`);
      else if(/praca|concentra/.test(cena) || d.tipoDefesa === 'concentracao'){
        const s = sedeDe(atacado, cid);
        b = s && bairrosDe(cid).includes(s) ? s : bairroDoEstadio(E, cid, L.estadio);
      }
      /* A PISTA É NA VIZINHANÇA DO ESTÁDIO (o dono, 02/10/2026: "se o jogo é
         no Castelão, que é na Maraponga, a pista pode ser no Bom Jardim, no
         Conjunto Ceará ou na Granja Portugal") */
      else if(d.tipoDefesa === 'pista' || /pista/.test(cena) || L.pista)
        b = bairroDaPista(E, cid, L.estadio, L.chave || `pista|${cid}|${E.data.ano}|${E.data.semana}|${E.data.dia}`);
      else if(/^estadio|arquibancada|invas|escolta|rua|arredores/.test(cena))
        b = bairroDoEstadio(E, cid, L.estadio);
    }
    if(!b) return null;
    const pts = 1;
    return {cid, b, pts, cena, meu, rival};
  }

  /* A BRIGA DO JOGADOR (TO.feed.registrarConfronto): quem venceu leva
     1 ponto no bairro da briga, de quem perdeu (15/10/2026) */
  function confronto(E, d){
    const o = ondeDaBriga(E, d);
    /* empate não mexe (ninguém saiu por cima) */
    if(!o || d.empatou) return null;
    const {cid, b, cena, meu, rival} = o;
    const ganhou = !!d.ganhamos;
    const r = ganhou ? transferir(E, cid, b, meu, rival, cena || 'briga')
                     : transferir(E, cid, b, rival, meu, cena || 'briga');
    if(r){
      const p = ((daCidade(E, cid).b) || {})[r.bairro.id] || {};
      r.nosDepois = p[meu] || 0;
      r.nosAntes = ganhou ? r.antes : r.contraAntes;
      r.elesDepois = p[rival] || 0;
      r.elesAntes = ganhou ? r.contraAntes : r.antes;
    }
    return r;
  }

  /* A PRÉVIA (o anúncio da briga): o bairro e os pontos nossos e deles
     ali, vencendo e perdendo — a mesma conta do fim, numa cópia */
  function previaBriga(E, d){
    const o = ondeDaBriga(E, d);
    if(!o) return null;
    const {cid, b, meu, rival} = o;
    const x = bairro(cid, b);
    if(!x) return null;
    const barra = Object.assign({}, ((daCidade(E, cid).b) || {})[x.id] || {});
    const lado = (venc, perd) => {
      const p = Object.assign({}, barra);
      passarPonto(E, cid, x.id, p, venc, perd);
      return {nos:p[meu] || 0, eles:p[rival] || 0, dona:donaDoObjeto(p)};
    };
    return {cid, cidade:(cidadeDe(cid) || {}).nome || cid, bairro:x, pts:1,
            antes:{nos:barra[meu] || 0, eles:barra[rival] || 0, dona:donaDoObjeto(barra)},
            vencendo:lado(meu, rival), perdendo:lado(rival, meu), meu, rival};
  }
  /* a prévia em texto: "Bairro X (Cidade)" e a linha do domínio */
  function ondeEmTexto(pv){
    if(!pv) return '';
    return pv.cidade && pv.cidade !== pv.bairro.nome ? _t('{bairro} ({cidade})', {bairro:pv.bairro.nome, cidade:pv.cidade})
                                                     : pv.bairro.nome;
  }
  const de7 = v => _t('{n}/7', {n:v || 0});
  function linhaDaPrevia(E, pv){
    if(!pv) return '';
    const vira = (r, meu) => r.dona !== pv.antes.dona
      ? (r.dona === meu ? ' ' + _t('(o bairro vira nosso)')
         : r.dona ? ' ' + _t('(o bairro vira da {nome})', {nome:nomeDe(r.dona)})
         : pv.antes.dona === meu ? ' ' + _t('(perdemos o bairro)') : ' ' + _t('(o bairro fica sem dona)'))
      : '';
    return _t('Domínio em {bairro} (nós {a}, a {rival} {c}): vencendo, nós {b}{va}; perdendo, nós {e} e ela {d}{vp}',
      {bairro:pv.bairro.nome, rival:nomeDe(pv.rival), a:de7(pv.antes.nos), c:de7(pv.antes.eles),
       b:de7(pv.vencendo.nos), va:vira(pv.vencendo, pv.meu), e:de7(pv.perdendo.nos), d:de7(pv.perdendo.eles), vp:vira(pv.perdendo, pv.meu)});
  }
  /* o resultado em texto (a mensagem da briga): o ponto que andou */
  function linhaDoResultado(E, r){
    if(!r || !r.bairro) return '';
    const cidade = (cidadeDe(r.cid) || {}).nome || r.cid;
    const onde = cidade && cidade !== r.bairro.nome ? _t('{bairro} ({cidade})', {bairro:r.bairro.nome, cidade}) : r.bairro.nome;
    const meu = eu(E);
    if(!r.ganho) return r.tid === meu
      ? _t('Domínio em {onde}: nada a tirar de ninguém, os pontos não mexeram', {onde})
      : _t('Domínio em {onde}: a {nome} não tinha o que tirar, os pontos não mexeram', {onde, nome:nomeDe(r.tid)});
    const quem = t => t === meu ? _t('nós') : _t('a {nome}', {nome:nomeDe(t)});
    const tirou = r.tirou
      ? ' · ' + _t('{quem} de {c} pra {d}', {quem:quem(r.tirou), c:de7(r.contraAntes), d:de7(r.contraDepois)})
      : ' · ' + _t('o ponto veio de ninguém');
    return _t('Domínio em {onde}: {quem} de {a} pra {b}', {onde, quem:quem(r.tid), a:de7(r.antes), b:de7(r.depois)}) + tirou;
  }

  /* o bairro do estádio do jogo (dados/estadios.js): o do nome, quando
     vem; senão o principal da cidade */
  function bairroDoEstadio(E, cid, nome){
    const ests = (TO.mundo && TO.mundo.estadiosEm) ? TO.mundo.estadiosEm(cid) : [];
    const n = norm(nome);
    /* pelo nome ou por um apelido: o Botafogo joga no "Nilton Santos",
       que é o Engenhão — sem isso caía no primeiro estádio da praça */
    const eh = e => [e.nome].concat(e.apelidos || []).some(x => norm(x) === n);
    const ord = n ? ests.slice().sort((a, c) => eh(c) - eh(a)) : ests;
    for(const e of ord){ const b = bairro(cid, e.bairro); if(b) return b; }
    const bs = bairrosDe(cid);
    return bs.length ? bs[hash(`${cid}|estadio`) % bs.length] : null;
  }
  /* OS VIZINHOS DE UM BAIRRO: quem faz divisa com ele na planta (a grade
     de dados/plantas.js); sem planta, os da mesma zona */
  const vizMemo = new Map();
  function vizinhosDe(cid, bid){
    const ch = cid + '|' + bid;
    if(vizMemo.has(ch)) return vizMemo.get(ch);
    const bs = bairrosDe(cid), x = bairro(cid, bid);
    let out = [];
    const P = TO.dados && TO.dados.plantas && TO.dados.plantas[cid];
    if(x && P && P.g && Array.isArray(P.b)){
      const k = P.b.findIndex(pb => pb[0] === x.id), g = P.g, viz = new Set();
      if(k >= 0){
        let ant = null;
        for(let j = 0; j < g.ny; j++){
          const row = [], l = g.l[j] || [];
          for(let i = 0; i < l.length; i += 2) for(let n = 0; n < l[i + 1]; n++) row.push(l[i]);
          for(let i = 0; i < row.length; i++){
            const v = row[i];
            if(i + 1 < row.length && row[i + 1] !== v && (v === k || row[i + 1] === k)) viz.add(v === k ? row[i + 1] : v);
            if(ant && ant[i] !== v && (v === k || ant[i] === k)) viz.add(v === k ? ant[i] : v);
          }
          ant = row;
        }
      }
      out = [...viz].filter(v => v >= 0 && v !== k).map(v => bairro(cid, P.b[v][0])).filter(Boolean);
    }
    if(!out.length && x) out = bs.filter(b => b !== x && b.zona === x.zona);
    out.sort((a, c) => (a.id < c.id ? -1 : 1));
    vizMemo.set(ch, out);
    return out;
  }
  /* o bairro da pista: um dos vizinhos do bairro do estádio, pela chave do dia */
  function vizinhosDoEstadio(E, cid, nome){
    const est = bairroDoEstadio(E, cid, nome);
    return est ? vizinhosDe(cid, est.id) : [];
  }
  function bairroDaPista(E, cid, nome, chave){
    const vs = vizinhosDoEstadio(E, cid, nome);
    return vs.length ? vs[hash(chave || cid) % vs.length] : bairroDoEstadio(E, cid, nome);
  }
  /* A ENTRADA DA PRAÇA (a emboscada na estrada): o bairro mais perto de
     uma das entradas da planta ("Entrada norte", "Estrada pra…"), a
     sorteada pela chave da viagem; sem planta, o do estádio */
  function bairroDaEntrada(cid, chave){
    const P = TO.dados && TO.dados.plantas && TO.dados.plantas[cid];
    const bs = bairrosDe(cid);
    if(!bs.length) return null;
    if(P && P.g && Array.isArray(P.r)){
      const ents = P.r.filter(r => r[3] === 'e' && /^(Entrada|Estrada)\b/.test(r[0]));
      if(ents.length){
        const [, x, y] = ents[hash(chave) % ents.length];
        const g = P.g, ci = Math.floor((x - g.x0) / g.cel), cj = Math.floor((y - g.y0) / g.cel);
        /* (a grade em linhas corridas: acha a célula de bairro mais perto) */
        let melhor = null, dm = Infinity;
        for(let j = 0; j < g.ny; j++){
          const l = g.l[j] || [];
          for(let k = 0, i = 0; k < l.length; i += l[k + 1], k += 2){
            if(l[k] < 0) continue;
            const ii = Math.max(i, Math.min(ci, i + l[k + 1] - 1));
            const dd = (ii - ci) * (ii - ci) + (j - cj) * (j - cj);
            if(dd < dm){ dm = dd; melhor = l[k]; }
          }
        }
        const pb = melhor != null && P.b[melhor];
        const b = pb && bairro(cid, pb[0]);
        if(b) return b;
      }
    }
    return bairroDoEstadio(null, cid);
  }

  /* A BRIGA DAS IAs NA RUA, NA ESTRADA E NO ESTÁDIO (TO.relacoes.registrarBrigaIA)
     não mexe mais no domínio: entre elas, é a briga de bairro do mês
     (`brigasDasIAs`) que move a barra (15/10/2026) */
  function brigaIA(){ return null; }

  /* UMA ESTRUTURA NOVA NO BAIRRO (bar, loja, subsede; a filial na
     cidade dela): a torcida ganha presença ali */
  function estrutura(){ return null; }
  /* o bairro que a IA escolhe pro ponto novo: um dela (fora da sede),
     depois um sem dona perto do território, depois o padrão */
  function bairroNovoIA(E, tid, tipo){
    const o = (TO.mundo && TO.mundo.torcida(tid)) || indice().O.find(x => x.id === tid);
    if(!o) return null;
    const cid = o.mapa, bs = bairros(E, cid);
    const ja = new Set(estruturas(E, cid).filter(s => s.tid === tid && s.tipo === tipo).map(s => s.bairro));
    const r = sorteio(`${semente(E)}|novo|${tid}|${tipo}|${E.data ? E.data.absoluto : 0}`);
    /* (a IA também abre onde o clube dela tem torcida: a receita sai disso) */
    const nota = b => (b.dono === tid ? 0 : !b.dono ? 20 : rivais(E, tid, b.dono) ? 90 : 45) + (ja.has(b.id) ? 25 : 0)
                      + 30 * (1 - Math.min(presenca(cid, o.clubeId, b.id), 1.5)) + r() * 10;
    const cand = bs.filter(b => !b.sede);
    const esc = (cand.length ? cand : bs).sort((a, c) => nota(a) - nota(c))[0];
    return esc ? bairro(cid, esc.id) : bairroPadrao(o, tipo, 0);
  }
  /* a compra da IA: grava o bairro no objeto (bar, loja) e soma a presença */
  function compraIA(E, tid, tipo, obj){
    const o = (TO.mundo && TO.mundo.torcida(tid)) || null;
    if(!o) return null;
    if(tipo === 'filial') return null;
    const b = tipo === 'subsede'
      ? bairroPadrao(o, 'subsede', Math.max(0, (((E.mundoTorcidas || {})[tid] || {}).subsedes || 1) - 1))
      : bairroNovoIA(E, tid, tipo);
    if(obj && b && tipo !== 'subsede') obj.bairro = b.nome;
    return b || null;
  }

  /* o que o save antigo precisa: a sede do jogador no bairro espalhado */
  function reparar(E){
    if(!E || !E.torcida) return;
    const s = sedeDe(E.torcida.id, E.torcida.mapa);
    if(s && norm(E.torcida.bairroSede) !== norm(s.nome)) E.torcida.bairroSede = s.nome;
    const D = raiz(E);
    /* a barra que passou de 100 no save de antes do conserto (01/10/2026) */
    for(const cid in D.c) for(const bid in ((D.c[cid] || {}).b || {})) fecharBarra(D.c[cid].b[bid], null);
  }

  /* monta os dados já na carga: a sede espalhada vale pra todo mundo
     que ler `bairroSede` depois daqui */
  try{ indice(); }catch(e){ /* sem dados ainda: monta na primeira leitura */ }

  /* O DOMÍNIO VALE NOS DOIS MODOS (dono, 15/10/2026): os embrulhos do
     modo rápido, que apagavam tudo, saíram */
  const rapido = () => false;

  return {MAX, transferir, passarPonto, fixoDe, brigasDasIAs, defensoraDe, DOMINA, DIA, CORTE, GANHO, SOCIAL, ZONAS, VIZINHAS, TORCIDA, POVO, rapido,
          duas, presenca, presencaDa, clubeDe, fatorTorcida, fatorGanho, torcedoresNoBairro, parteDaTorcida, notaDaTorcida, cidadesDa,
          semZonas:cid => semZonas(cidadeDe(cid)),
          cidadeDoBairro:(cid, b) => { const x = bairro(cid, b); return x ? cidadeDoBairro(cidadeDe(cid), x) : ''; },
          indice, espalhar, bairro, bairrosDe, sedeDe, casaDe, bairroPadrao, bairroDaFilial,
          torcidasDaCidade, estruturas, inicial, daCidade, partes, bairros, placar, donaDaCidade,
          donaDoBairro, SEDE_PERDIDA, maiores, membrosDe, rivais, amigas, fator, notaDoCorte, siglaDe, nomeDe,
          mexer, confronto, ondeDaBriga, previaBriga, linhaDaPrevia, linhaDoResultado, ondeEmTexto, bairroDaEntrada, brigaIA, estrutura, vizinhosDe, vizinhosDoEstadio, bairroDaPista, compraIA, bairroNovoIA, bairroDoEstadio,
          podeSocial, social, alvoSocial, dia, reparar, fecharLivro, hash, metasDoDia, alvosDe,
          PIX, vagasPix, muros, saldoPix, pixar, ganharPix, bairrosPraRecrutar, bairroDoRecrutamento, pesoDoRecrutamento, recrutouHoje, recrutandoEm, RECRUTA_DIA,
          get log(){ return (TO.estado && TO.estado.E && TO.estado.E.dominio && TO.estado.E.dominio.log) || []; }};
})();
