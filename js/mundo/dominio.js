/* =========================================================
   O DOMÍNIO DOS BAIRROS (o dono, 30/09/2026: "inicie a setorização
   dos bairros de acordo com os dados que temos e as zonas também …
   Em cada bairro vai apontar qual torcida comanda, e a torcida que
   comandar mais bairros domina a cidade").

   A BARRA. Cada bairro tem uma barra de 0 a 100 repartida entre as
   torcidas (o que sobra é de ninguém). Quem passa de 50 é a DONA do
   bairro; ninguém acima de 50, o bairro está em disputa. Toda ação
   ganha no bairro soma pontos na barra de quem ganhou e tira de quem
   perdeu — passou de 50, virou dona.

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
   difícil de tomar: quem não é da casa ganha metade ali, e a casa se
   refaz meio ponto por dia até 80. A subsede também segura o bairro
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

   A RECEITA. Bar, loja, subsede (e a festa da sede) em bairro cuja
   dona é RIVAL da torcida rendem 30% menos. Rival é a relação de
   hoje (Rival ou Maior Rival); vizinha neutra, aliada ou irmã não
   corta nada.

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
  const DOMINA = 50;                 // mais que isto na barra: dona do bairro
  const DIA = 0.02;                  // 0,1 na régua de 0 a 100
  const CORTE = 0.7;                 // receita em bairro de rival: −30%
  const SEDE_TETO = 80, SEDE_REFAZ = 0.5;       // a sede se refaz até 80
  const SUBSEDE_TETO = 65, SUBSEDE_REFAZ = 1/3; // a subsede, até 65
  const RESISTE = 0.5;               // quem não é da casa ganha metade no bairro da sede
  /* quanto cada ação vale na barra (pontos de 0 a 100) */
  const GANHO = {
    treta: {5:10, 7:14, 10:18},      // treta marcada, pelo tamanho
    rua: 10,                         // ataque na pista, na concentração, na praça
    arredores: 8,                    // arredores do estádio
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
        continue;
      }
      const t = mundo && mundo[o.id];
      if(!t){ push(o.id, 'bar', bairroPadrao(o, 'bar', 0), 0); continue; }
      (t.bares || []).forEach((b, i) => push(o.id, 'bar', bairro(cid, b.bairro) || bairroPadrao(o, 'bar', i), i, b));
      (t.lojas || []).forEach((l, i) => push(o.id, 'loja', bairro(cid, l.bairro) || bairroPadrao(o, 'loja', i), i, l));
      for(let i = 0; i < (t.subsedes || 0); i++) push(o.id, 'subsede', bairroPadrao(o, 'subsede', i), i);
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
    /* a barra de cada bairro: a dona com 55–75 (a da sede, 80–92) e,
       em 6 de cada 10, uma segunda de olho (a rival primeiro) */
    for(const b of bs){
      const t = dono.get(b.id);
      if(!t){ fora.b[b.id] = {}; continue; }
      const naSede = (sedes.get(t) || {}).id === b.id;
      const v = um(naSede ? 80 + r() * 12 : 55 + r() * 20);
      const p = {[t]: v};
      if(r() < 0.6){
        const outras = ts.filter(o => o.id !== t && !(TO.mundo && TO.mundo.saoIrmas && TO.mundo.saoIrmas(o.id, t)));
        const rivais = outras.filter(o => ehRival(o.id, t));
        const vizinhas = (rivais.length ? rivais : outras).filter(o => tem.get(o.id).some(x => x.zona === b.zona));
        const lista = vizinhas.length ? vizinhas : (rivais.length ? rivais : outras);
        if(lista.length){
          const o = lista[Math.floor(r() * lista.length)];
          const q = um(Math.min(100 - v - 2, 5 + r() * 20));
          if(q >= 3) p[o.id] = q;
        }
      }
      fora.b[b.id] = p;
    }
    return fora;
  }

  /* =======================================================
     O ESTADO NO SAVE
     ======================================================= */
  function raiz(E){
    if(!E.dominio || typeof E.dominio !== 'object') E.dominio = {v:1};
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
    for(const t in p) if(p[t] > DOMINA && (!m || p[t] > p[m])) m = t;
    return m;
  };
  const donaDoBairro = (E, cid, bid) => donaDoObjeto(((daCidade(E, cid).b) || {})[bid] || {});

  /* os bairros da cidade prontos pra tela */
  function bairros(E, cid){
    return bairrosDe(cid).map(b => {
      const ps = partes(E, cid, b.id);
      const dono = ps.length && ps[0].v > DOMINA ? ps[0].t : null;
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
  /* o fator da receita de um ponto: 0,7 em bairro de dona rival */
  function fator(E, tid, cid, b){
    const x = bairro(cid, b);
    if(!E || !x) return 1;
    const d = donaDoBairro(E, cid, x.id);
    return d && d !== tid && rivais(E, tid, d) ? CORTE : 1;
  }
  /* a nota que a linha do financeiro leva quando corta */
  function notaDoCorte(E, tid, cid, b){
    const x = bairro(cid, b);
    if(!x || fator(E, tid, cid, x) === 1) return '';
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
  /* a nota curta do fator, pra linha do financeiro: "torcida ×0,87" */
  function notaDaTorcida(E, tid, cid, b){
    const f = fatorTorcida(E, tid, cid, b);
    if(Math.abs(f - 1) < 0.005) return '';
    return _t('torcida ×{f}', {f:duas(f)});
  }

  /* =======================================================
     MEXER NA BARRA
     `tid` ganha `pts` no bairro; os pontos saem primeiro de `contra`
     (quem perdeu ali), depois do que é de ninguém, depois das outras
     (a maior primeiro). No bairro da sede de outra torcida, quem não é
     da casa ganha metade.
     ======================================================= */
  function mexer(E, cid, b, tid, pts, opc){
    opc = opc || {};
    const x = bairro(cid, b);
    if(!E || !x || !tid || !(pts > 0)) return null;
    /* A TORCIDA DO BAIRRO PESA NO GANHO (01/10/2026): ×0,4 onde o clube
       quase não tem torcida, ×1 na média da cidade dele, até ×1,3 no
       reduto. A sede e a subsede se refazem como antes */
    if(!opc.semTorcida && opc.motivo !== 'sede' && opc.motivo !== 'subsede') pts *= fatorGanho(E, tid, cid, x);
    const casa = casaDe(cid, x.id);
    if(casa && casa !== tid) pts *= RESISTE;
    const st = paraMexer(E, cid);
    const p = st.b[x.id] = st.b[x.id] || {};
    const dono0 = donaDoObjeto(p);
    const antes = p[tid] || 0;
    const tirar = (id, q) => {
      const t = Math.min(p[id] || 0, q);
      p[id] = um((p[id] || 0) - t);
      if(!(p[id] > 0)) delete p[id];
      return t;
    };
    let ganho = Math.min(pts, 100 - antes), resta = ganho;
    if(opc.contra && opc.contra !== tid) resta -= tirar(opc.contra, resta);
    const soma = () => Object.keys(p).reduce((s, k) => s + p[k], 0);
    resta -= Math.min(Math.max(0, 100 - soma()), resta);
    for(let g = 0; resta > 0.05 && g < 12; g++){
      const outras = Object.keys(p).filter(k => k !== tid && p[k] > 0).sort((a, c) => p[c] - p[a]);
      if(!outras.length) break;
      resta -= tirar(outras[0], resta);
    }
    ganho -= Math.max(0, resta);
    p[tid] = um(limitar(antes + ganho, 0, 100));
    const dono1 = donaDoObjeto(p);
    const r = {cid, bairro:x, tid, contra:opc.contra || null, antes, depois:p[tid], ganho:um(ganho), dono0, dono1};
    if(dono0 !== dono1) virou(E, r, opc.motivo || '');
    return r;
  }

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
                      : _t('{bairro} ({cidade}) passou de 50% pra nós. O bairro agora é nosso.', {bairro:nb, cidade});
    else if(r.dono0 === meu)
      texto = r.dono1 ? _t('Perdemos {bairro} ({cidade}) pra {para}.', {bairro:nb, cidade, para:nomeDe(r.dono1)})
                      : _t('{bairro} ({cidade}) caiu abaixo de 50% pra nós: o bairro está em disputa.', {bairro:nb, cidade});
    else if(r.cid === E.torcida.mapa)
      texto = r.dono1 ? _t('A {para} tomou {bairro}{de}.', {para:nomeDe(r.dono1), bairro:nb,
                          de: r.dono0 ? _t(' da {de}', {de:nomeDe(r.dono0)}) : ''})
                      : _t('{bairro} ficou sem dona: a {de} caiu abaixo de 50%.', {bairro:nb, de:nomeDe(r.dono0)});
    if(texto) avisar(E, texto, `dominio|${abs}|${r.cid}|${r.bairro.id}|${r.dono1 || '-'}`);
  }
  function avisar(E, texto, chave){
    if(TO.feed && TO.feed.propor)
      TO.feed.propor(E, {kind:'dominio', peso:'info', voz:'porrada', chave, texto});
  }

  /* =======================================================
     O DIA: a cidade dominada rende, a grande sem cidade sangra, a sede
     e a subsede se refazem. Chamado por TO.estado.avancarDia.
     ======================================================= */
  function refazer(E, cid){
    const D = raiz(E);
    const st = D.c[cid];
    if(!st) return;
    const I = indice();
    const sedes = I.sedes.get(cid) || new Map();
    for(const [tid, b] of sedes){
      const p = (st.b || {})[b.id] || {};
      if((p[tid] || 0) < SEDE_TETO) mexer(E, cid, b, tid, Math.min(SEDE_REFAZ, SEDE_TETO - (p[tid] || 0)), {motivo:'sede'});
    }
    for(const s of estruturas(E, cid)){
      if(s.tipo !== 'subsede' && s.tipo !== 'filial') continue;
      const p = (st.b || {})[s.bairro] || {};
      if((p[s.tid] || 0) < SUBSEDE_TETO) mexer(E, cid, s.bairro, s.tid, Math.min(SUBSEDE_REFAZ, SUBSEDE_TETO - (p[s.tid] || 0)), {motivo:'subsede'});
    }
  }
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
      refazer(E, cid);
      const pl = placar(E, cid);
      const dono = pl.dono || null;
      if(dono) noIndicador(E, dono, DIA);
      for(const t of maiores(E, cid)) if(t !== dono) noIndicador(E, t, -DIA);
      const antes = D.donos[cid];
      D.donos[cid] = dono;
      if(antes !== undefined && antes !== dono && cid === minha) avisarCidade(E, cid, antes, dono, pl);
    }
    /* a IA que está atrás na cidade dela faz ação social (a semana) */
    if(E.data.dia === 1){ fecharLivro(E); semanaDasIAs(E); }
    /* as metas do mês de cada organizada da IA (01/10/2026) */
    try{ metasDoDia(E); }catch(e){ /* as metas não derrubam o dia */ }
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
     AS METAS DA IA (pedido do dono, 01/10/2026: "o objetivo da torcida
     IA e da nossa é sempre dominar a cidade inteira" — "dois alvos por
     mês ... sede nível 0 a 2 é um alvo, 5 a 6 são 3"; aprovados o
     "ataque com motivo" e o "sem descanso quando domina")
     No começo de cada mês, cada organizada da IA escolhe os bairros
     mais baratos de virar na cidade dela — o que falta pra passar de
     50%, dividido pelo quanto um ponto dela rende ali, com desconto pra
     zona onde ela já manda (o motivo). Quem domina a cidade não para:
     os bairros dela abaixo de 60% entram na frente. Cada alvo ganha um
     dia do mês e um golpe: o bote no bar da dona (se o bar fica ali),
     a reunião da zona na praça ou a treta marcada.
     No dia: se a dona somos nós, é ataque contra a gente (a reunião
     da nossa zona na praça, ou o nosso bar, se ele fica no bairro),
     com o aviso do olheiro e a cena de defesa; se é outra IA, é a
     briga das duas (`relacoes.brigaIA`), e a barra mexe no bairro do
     alvo, não no mais fraco da perdedora.
     ======================================================= */
  let ALVO_FORCADO = null;
  const ALVOS_PELA_SEDE = n => n >= 5 ? 3 : n >= 3 ? 2 : 1;
  function mesDe(E){
    const d = TO.estado && TO.estado.dataDaSemana ? TO.estado.dataDaSemana(E.data.ano, E.data.semana, E.data.dia) : null;
    return d ? `${d.getFullYear()}|${d.getMonth()}` : `${E.data.ano}|${Math.floor((E.data.semana - 1) / 4.35)}`;
  }
  /* os bairros que valem a pena pra `tid` na cidade (a régua do jogador) */
  function alvosDe(E, cid, tid, n, bs, pl){
    const zk = b => b.semZona ? 'c:' + b.cidade : b.zona;
    const minhas = new Set(bs.filter(b => b.dono === tid).map(zk));
    const amiga = o => o === tid || (TO.mundo && TO.mundo.saoIrmas && TO.mundo.saoIrmas(tid, o));
    const domina = pl.dono === tid;
    const cand = [];
    for(const b of bs){
      const minha = (b.partes.find(p => p.t === tid) || {}).v || 0;
      const f = fatorGanho(E, tid, cid, b) * (b.sede && b.sede !== tid ? RESISTE : 1);
      if(b.dono === tid){
        if(b.v >= 60) continue;
        const r = b.partes.find(p => !amiga(p.t));
        if(r) cand.push({b, v:r.t, nota:(b.v - 50) / Math.max(0.2, f) * (domina ? 0.5 : 1.3)});
        continue;
      }
      const r = b.dono && !amiga(b.dono) ? b.dono : (b.partes.find(p => !amiga(p.t)) || {}).t;
      if(!r) continue;
      const falta = Math.max(0, 50.1 - minha) + (b.dono ? Math.max(0, b.v - 50) : 0);
      cand.push({b, v:r, nota:falta / Math.max(0.2, f) - (minhas.has(zk(b)) ? 8 : 0)});
    }
    return cand.sort((x, y) => x.nota - y.nota).slice(0, n);
  }
  function planejarMes(E){
    const I = indice(), meu = eu(E);
    const mundo = TO.relacoes && TO.relacoes.mundo ? TO.relacoes.mundo(E) : null;
    if(!mundo) return [];
    const hoje = E.data.absoluto || 0, out = [];
    const r = sorteio(`${semente(E)}|metas|${mesDe(E)}`);
    for(const cid of I.comTorcida){
      const bs = bairros(E, cid), pl = placar(E, cid);
      if(!bs.length) continue;
      for(const o of torcidasDaCidade(cid)){
        if(o.id === meu) continue;
        const t = mundo[o.id];
        if(!t) continue;
        const ests = estruturas(E, cid);
        for(const a of alvosDe(E, cid, o.id, ALVOS_PELA_SEDE(t.sede || 0), bs, pl)){
          const barDela = ests.some(s => s.tid === a.v && s.tipo === 'bar' && s.bairro === a.b.id);
          const k = barDela && r() < 0.6 ? 'bar' : r() < 0.55 ? 'reuniao' : 'treta';
          out.push({t:o.id, c:cid, b:a.b.id, v:a.v, k, d:hoje + 2 + Math.floor(r() * 25)});
        }
      }
    }
    return out;
  }
  function metasDoDia(E){
    const D = raiz(E), mes = mesDe(E);
    if(D.mesIA !== mes){ D.mesIA = mes; D.metas = planejarMes(E); }
    const hoje = E.data.absoluto || 0, meu = eu(E);
    const mundo = TO.relacoes && TO.relacoes.mundo ? TO.relacoes.mundo(E) : null;
    for(const m of D.metas || []){
      if(m.feito || m.d > hoje) continue;
      m.feito = 1;
      const x = bairro(m.c, m.b), att = TO.mundo && TO.mundo.torcida(m.t);
      if(!x || !att || !mundo || !mundo[m.t]) continue;
      /* a vítima é quem está no caminho HOJE: a dona, ou a maior das outras */
      const ps = partes(E, m.c, x.id).filter(p => p.t !== m.t && !(TO.mundo.saoIrmas && TO.mundo.saoIrmas(m.t, p.t)));
      const dona = donaDoBairro(E, m.c, x.id);
      const vit = dona && dona !== m.t ? dona : (ps[0] || {}).t;
      if(!vit) continue;
      if(vit === meu){ contraNos(E, m, x, att); continue; }
      const vo = TO.mundo.torcida(vit);
      if(!vo || !mundo[vit] || !TO.relacoes.brigaIA) continue;
      ALVO_FORCADO = {cid:m.c, b:x.id, a:m.t, v:vit, k:m.k};
      try{
        TO.relacoes.brigaIA(E, att, vo, m.c, m.k === 'bar' ? _t('ataque ao bar') : '',
          {tipo: m.k === 'bar' ? 'bar' : m.k === 'treta' ? 'treta' : 'rua'});
      }catch(e){ /* a meta não derruba o dia */ }
      finally{ ALVO_FORCADO = null; }
    }
    /* o mês velho sai do save */
    D.metas = (D.metas || []).filter(m => !m.feito);
  }
  /* a meta da IA em cima da gente: o ataque marcado de hoje, com o aviso */
  function contraNos(E, m, x, att){
    if(m.c !== E.torcida.mapa) return;
    const a = E.ataqueMarcado;
    if(a && !a.resolvido && a.semana === E.data.semana) return;
    /* no dia do nosso jogo a rua é do itinerário */
    const pj = E.proximoJogo;
    if(pj && pj.semana === E.data.semana && pj.dia === E.data.dia) return;
    const nossoBar = (E.patrimonio && E.patrimonio.bares || []).some(b => bairro(m.c, b.bairro) === x);
    const noBar = m.k === 'bar' && nossoBar;
    const Z = (TO.mundo && TO.mundo.ZONAS) || ZONAS;
    const zona = x.zona && Z.includes(x.zona) ? x.zona : Z[hash(`${m.t}|${x.id}`) % Z.length];
    E.ataqueMarcado = {torcida:m.t, nome:att.nome, alvo: noBar ? 'bar' : 'reuniao',
                       cena: noBar ? 'bar' : 'praca-reuniao', zona: noBar ? null : zona,
                       bairro:x.nome, mapa:m.c, ano:E.data.ano, semana:E.data.semana, dia:E.data.dia,
                       meta:true};
    if(TO.relacoes.hostilidade && TO.relacoes.REL) TO.relacoes.hostilidade(E, m.t, TO.relacoes.REL.ataqueMarcado || 8);
    if(TO.feed && TO.feed.avisoDoOlheiro)
      TO.feed.avisoDoOlheiro(E, {chave:`meta|${E.data.ano}|${E.data.semana}|${m.t}|${x.id}`,
                                 alvo: noBar ? 'bar' : 'reuniao', nome:att.nome, zona});
  }

  /* A IA NÃO FICA PARADA: a primeira ou a segunda maior da cidade que
     não domina faz uma ação social por semana, em 35% das semanas, no
     bairro sem dona ou de dona fraca mais perto do território dela.
     Paga do caixa dela. */
  function semanaDasIAs(E){
    const mundo = TO.relacoes && TO.relacoes.mundo ? TO.relacoes.mundo(E) : null;
    if(!mundo) return;
    const I = indice(), meu = eu(E);
    for(const cid of I.comTorcida){
      const pl = placar(E, cid);
      /* SEM DESCANSO QUANDO DOMINA (01/10/2026): a dona da cidade também
         trabalha — no bairro dela abaixo de 60% */
      if(pl.dono && pl.dono !== meu && mundo[pl.dono] && (mundo[pl.dono].caixa || 0) >= SOCIAL.custo * 2){
        const r0 = sorteio(`${semente(E)}|segura|${pl.dono}|${E.data.ano}|${E.data.semana}`);
        const fraco = bairros(E, cid).filter(b => b.dono === pl.dono && b.v < 60 && b.sede !== pl.dono).sort((a, c) => a.v - c.v)[0];
        if(fraco && r0() < 0.35){
          mundo[pl.dono].caixa -= SOCIAL.custo;
          mexer(E, cid, fraco.id, pl.dono, GANHO.social[0] + r0() * (GANHO.social[1] - GANHO.social[0]), {motivo:'social'});
        }
      }
      for(const tid of maiores(E, cid)){
        if(tid === meu || tid === pl.dono) continue;
        const t = mundo[tid];
        if(!t || (t.caixa || 0) < SOCIAL.custo * 2) continue;
        const r = sorteio(`${semente(E)}|social|${tid}|${E.data.ano}|${E.data.semana}`);
        if(r() >= 0.35) continue;
        const alvo = alvoSocial(E, cid, tid, r);
        if(!alvo) continue;
        t.caixa -= SOCIAL.custo;
        mexer(E, cid, alvo, tid, GANHO.social[0] + r() * (GANHO.social[1] - GANHO.social[0]), {motivo:'social'});
      }
    }
  }
  /* onde a ação social rende mais: sem dona, ou dona fraca, perto do
     que a torcida já tem */
  function alvoSocial(E, cid, tid, r){
    const bs = bairros(E, cid);
    /* (a zona; na praça sem zona, a cidade) */
    const zk = b => b.semZona ? 'cidade:' + b.cidade : b.zona;
    const zonas = new Set(bs.filter(b => b.dono === tid).map(zk));
    const cand = bs.filter(b => b.dono !== tid && !(b.sede && b.sede !== tid));
    if(!cand.length) return null;
    const nota = b => (b.dono ? b.v : 30) - (zonas.has(zk(b)) ? 12 : 0) - 20 * (Math.min(presencaDa(tid, cid, b.id), 1.5) - 1) + r() * 8;
    return cand.sort((a, c) => nota(a) - nota(c))[0].id;
  }

  /* =======================================================
     AS AÇÕES QUE MEXEM NA BARRA
     ======================================================= */
  /* A BRIGA DO JOGADOR (TO.feed.registrarConfronto): quem ganhou soma
     no bairro da briga, quem perdeu perde. O bairro vem da briga; sem
     ele, a concentração é na porta da sede de quem foi atacado e a
     pista, no bairro do estádio. Arquibancada, invasão, escolta e LNT
     não são briga de bairro. */
  function confronto(E, d){
    if(!E || !d || !d.torcidaId) return null;
    const meu = eu(E), rival = d.torcidaId;
    const L = d.local || {};
    const cena = String(L.cena || '');
    if(d.lnt || d.aliado || /^estadio|arquibancada|invas|escolta|ct$/.test(cena)) return null;
    /* empate não mexe (ninguém saiu por cima) */
    if(d.empatou) return null;
    let cid = L.cidade || null, b = null;
    const tenta = (c, x) => { const y = bairro(c, x); if(y){ cid = c; b = y; } return !!y; };
    if(cid) tenta(cid, L.bairro);
    if(!b && L.bairro){
      /* o bairro pode ser da nossa cidade, da do rival (jogo fora) ou
         ser o nome de uma cidade (a briga da subsede de fora) */
      const oRival = (TO.mundo && TO.mundo.torcida(rival)) || {};
      if(!tenta(E.torcida.mapa, L.bairro) && !tenta(oRival.mapa, L.bairro)){
        const c = indice().C.find(x => norm(x.nome) === norm(L.bairro) || x.id === L.bairro);
        if(c){ cid = c.id; b = bairroDaFilial(meu, c.id); }
      }
    }
    if(!cid) cid = E.torcida.mapa;
    const atacado = d.atacamos ? rival : meu;
    if(!b){
      if(/praca|concentra/.test(cena) || d.tipoDefesa === 'concentracao') b = sedeDe(atacado, cid) || sedeDe(atacado);
      else if(/pista|rua/.test(cena) || d.tipoDefesa === 'pista') b = bairroDoEstadio(E, cid);
      else if(/bar/.test(cena)) b = null;
    }
    if(!b) return null;
    const ganhou = !!d.ganhamos;
    let pts = /treta/.test(cena) ? (GANHO.treta[d.tam] || GANHO.treta[7])
            : /arredores/.test(cena) ? GANHO.arredores
            : /reuniao/.test(cena) || d.alvoTipo === 'reuniao' || d.tipoDefesa === 'reuniao' ? GANHO.reuniao
            : /^bar|bote/.test(cena) || d.alvoTipo === 'bar' ? GANHO.bar + (d.quebrou ? GANHO.quebrou : 0)
            : d.alvoTipo === 'sede' ? GANHO.sede
            : /casa|festa|piscina/.test(cena) ? GANHO.casa
            : d.atacamos === false ? GANHO.defesa
            : GANHO.rua;
    return ganhou ? mexer(E, cid, b, meu, pts, {contra:rival, motivo:cena || 'briga'})
                  : mexer(E, cid, b, rival, pts, {contra:meu, motivo:cena || 'briga'});
  }
  /* o bairro do estádio principal da cidade (dados/estadios.js) */
  function bairroDoEstadio(E, cid){
    const ests = (TO.mundo && TO.mundo.estadiosEm) ? TO.mundo.estadiosEm(cid) : [];
    for(const e of ests){ const b = bairro(cid, e.bairro); if(b) return b; }
    const bs = bairrosDe(cid);
    return bs.length ? bs[hash(`${cid}|estadio`) % bs.length] : null;
  }

  /* A BRIGA DAS IAs (TO.relacoes.registrarBrigaIA): a vencedora soma no
     bairro mais exposto da perdedora naquela cidade (o dela de barra
     mais baixa, fora da sede), ou onde a perdedora tem mais barra */
  function brigaIA(E, reg){
    /* a emboscada na estrada não é briga de bairro */
    if(!E || !reg || !reg.a || !reg.b || reg.tipo === 'estrada') return null;
    const venc = reg.ganhouA ? reg.a.id : reg.b.id, perd = reg.ganhouA ? reg.b.id : reg.a.id;
    /* O ALVO DO MÊS (01/10/2026): a briga que a IA foi buscar acontece no
       bairro que ela quer virar, e é ali que a barra mexe */
    const F = ALVO_FORCADO;
    if(F && F.cid && bairro(F.cid, F.b) && [F.a, F.v].includes(venc) && [F.a, F.v].includes(perd)){
      const tam = reg.a.n || 0;
      const pts = F.k === 'reuniao' ? GANHO.reuniao : F.k === 'bar' ? GANHO.iaBar
                : F.k === 'treta' ? (GANHO.treta[tam] || GANHO.treta[7]) : GANHO.iaRua;
      return mexer(E, F.cid, F.b, venc, pts, {contra:perd, motivo:'alvo-' + (F.k || 'rua')});
    }
    let cid = reg.mapa;
    if(!cid){ const c = indice().C.find(x => x.nome === reg.cidade || x.id === reg.cidade); cid = c && c.id; }
    if(!cid || !bairrosDe(cid).length) return null;
    const bs = bairros(E, cid);
    const daPerd = bs.filter(b => b.dono === perd && b.sede !== perd).sort((a, c) => a.v - c.v);
    let alvo = daPerd[0] || null;
    if(!alvo){
      const onde = bs.map(b => ({b, v:(b.partes.find(x => x.t === perd) || {}).v || 0})).filter(x => x.v > 0 && x.b.sede !== perd)
        .sort((a, c) => c.v - a.v)[0];
      alvo = onde ? onde.b : null;
    }
    if(!alvo) return null;
    const tam = reg.a.n || 0;
    const pts = reg.tipo === 'treta' ? (GANHO.treta[tam] || GANHO.treta[7])
              : reg.tipo === 'bar' ? GANHO.iaBar : GANHO.iaRua;
    return mexer(E, cid, alvo.id, venc, pts, {contra:perd, motivo:reg.tipo || 'ia'});
  }

  /* UMA ESTRUTURA NOVA NO BAIRRO (bar, loja, subsede; a filial na
     cidade dela): a torcida ganha presença ali */
  function estrutura(E, tid, tipo, cid, b){
    const pts = GANHO.estrutura[tipo] || 0;
    if(!pts) return null;
    if(tipo === 'filial') b = bairroDaFilial(tid, cid);
    return mexer(E, cid, b, tid, pts, {motivo:'estrutura'});
  }
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
    if(tipo === 'filial') return estrutura(E, tid, 'filial', obj && obj.cidade, null);
    const b = tipo === 'subsede'
      ? bairroPadrao(o, 'subsede', Math.max(0, (((E.mundoTorcidas || {})[tid] || {}).subsedes || 1) - 1))
      : bairroNovoIA(E, tid, tipo);
    if(obj && b && tipo !== 'subsede') obj.bairro = b.nome;
    return b ? estrutura(E, tid, tipo, o.mapa, b) : null;
  }

  /* A AÇÃO SOCIAL NO BAIRRO (do jogador): cesta básica, mutirão, o
     campinho arrumado — a torcida aparece no bairro sem briga. Uma por
     semana, na cidade da torcida. */
  function podeSocial(E){
    if(!E) return {ok:false, motivo:''};
    E.acoes = E.acoes || {};
    if(E.acoes.ultimaSocial === `${E.data.ano}|${E.data.semana}`)
      return {ok:false, motivo:_t('já teve ação social esta semana')};
    if((E.dinheiro || 0) < SOCIAL.custo) return {ok:false, motivo:_t('custa {valor}', {valor:dinheiro(SOCIAL.custo)})};
    const aptos = TO.membros && TO.membros.aptosParaOEstadio ? TO.membros.aptosParaOEstadio(E).length : (E.membros || []).length;
    if(aptos < SOCIAL.gente) return {ok:false, motivo:_t('gente apta de menos ({n} de {min})', {n:aptos, min:SOCIAL.gente})};
    return {ok:true};
  }
  function social(E, b){
    const pode = podeSocial(E);
    if(!pode.ok) return {ok:false, msg:pode.motivo};
    const cid = E.torcida.mapa, x = bairro(cid, b);
    if(!x) return {ok:false, msg:_t('Esse bairro não é da nossa cidade.')};
    E.acoes.ultimaSocial = `${E.data.ano}|${E.data.semana}`;
    /* (o lancarNoResumo já tira do caixa: descontar antes cobrava duas
       vezes — R$ 3.000 por ação, 01/10/2026) */
    if(TO.estado && TO.estado.lancarNoResumo) TO.estado.lancarNoResumo(E, 'social', -SOCIAL.custo);
    else E.dinheiro -= SOCIAL.custo;
    const r0 = sorteio(`${semente(E)}|social-nosso|${E.data.absoluto}|${x.id}`);
    const pts = GANHO.social[0] + r0() * (GANHO.social[1] - GANHO.social[0]);
    const r = mexer(E, cid, x, eu(E), pts, {motivo:'social'});
    const v = r ? r.depois : 0;
    return {ok:true, r, msg:_t('Ação social em {bairro}: a barra da torcida foi a {v}%.', {bairro:x.nome, v:Math.round(v)})};
  }
  const dinheiro = v => (TO.util && TO.util.dinheiro) ? TO.util.dinheiro(v) : 'R$ ' + Math.round(v).toLocaleString('pt-BR');

  /* o que o save antigo precisa: a sede do jogador no bairro espalhado */
  function reparar(E){
    if(!E || !E.torcida) return;
    const s = sedeDe(E.torcida.id, E.torcida.mapa);
    if(s && norm(E.torcida.bairroSede) !== norm(s.nome)) E.torcida.bairroSede = s.nome;
    raiz(E);
  }

  /* monta os dados já na carga: a sede espalhada vale pra todo mundo
     que ler `bairroSede` depois daqui */
  try{ indice(); }catch(e){ /* sem dados ainda: monta na primeira leitura */ }

  return {DOMINA, DIA, CORTE, GANHO, SOCIAL, ZONAS, VIZINHAS, TORCIDA, POVO,
          duas, presenca, presencaDa, clubeDe, fatorTorcida, fatorGanho, torcedoresNoBairro, parteDaTorcida, notaDaTorcida, cidadesDa,
          semZonas:cid => semZonas(cidadeDe(cid)),
          cidadeDoBairro:(cid, b) => { const x = bairro(cid, b); return x ? cidadeDoBairro(cidadeDe(cid), x) : ''; },
          indice, espalhar, bairro, bairrosDe, sedeDe, casaDe, bairroPadrao, bairroDaFilial,
          torcidasDaCidade, estruturas, inicial, daCidade, partes, bairros, placar, donaDaCidade,
          donaDoBairro, maiores, membrosDe, rivais, fator, notaDoCorte, siglaDe, nomeDe,
          mexer, confronto, brigaIA, estrutura, compraIA, bairroNovoIA, bairroDoEstadio,
          podeSocial, social, alvoSocial, dia, reparar, fecharLivro, hash, metasDoDia, alvosDe,
          get log(){ return (TO.estado && TO.estado.E && TO.estado.E.dominio && TO.estado.E.dominio.log) || []; }};
})();
