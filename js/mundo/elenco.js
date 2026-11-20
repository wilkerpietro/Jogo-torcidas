/* =========================================================
   O ELENCO FIXO DE CADA TORCIDA (pedido do dono, 15/10/2026)
   "É melhor você gerar logo membros fixos pra cada torcida pra não
   ser aleatório pra cada save, e cada membro vai ter sua idade,
   bairro, etc."

   Cada organizada da IA tem uma fila de membros que sai do HASH da
   torcida e da posição — o membro nº 37 da Cearamor se chama igual,
   tem a mesma idade e mora no mesmo bairro em todo save. O tamanho da
   fila é o efetivo de hoje dela: cresceu, entram os próximos da fila;
   encolheu, saem os últimos. O cargo segue a pirâmide da fonte da
   torcida; a ficha nasce da média treinada do cargo no quadro vivo
   dela (o mesmo que a cena já usava), ou da ficha nova do cargo.

   O BAIRRO É ONDE ELE MORA: pesa a torcida do clube no bairro
   (`dominio.presencaDa`), o reduto da sede (×4) e a zona dela (×1,5).
   Moradia não muda com o domínio — quem mora no Antônio Bezerra
   continua morando lá depois que o bairro troca de dona.

   A FILIAL ("Cearamor Recife") é outra fila, com o efetivo do núcleo,
   morando em volta do bairro dela na cidade de lá.

   OS NOSSOS são os de verdade (`E.membros`): cada um ganha o bairro
   dele na primeira leitura (o mesmo sorteio por hash), e o novato
   recrutado mora no bairro do recrutamento do mês.

   É deste elenco que sai quem desce numa briga de bairro: os moradores
   do bairro, os mais fortes primeiro (até 15, no beco até 7), e quem
   ataca traz os mais fortes da cidade (até 20).
   ========================================================= */
window.TO = window.TO || {};

TO.elenco = (function(){
  'use strict';
  const D = () => TO.dominio;
  const H = s => D().hash(s);
  const fr = s => (H(s) % 100000) / 100000;
  const IDADE = [16, 45];
  /* a ficha de entrada de cada cargo (a régua de TO.membros.FICHA_NOVA) */
  const faixa = cargo => ((TO.membros && TO.membros.FICHA_NOVA) || {})[cargo] || [3, 8];
  const tetoDe = cargo => (((TO.membros || {}).CARGOS || {})[cargo] || {teto:20}).teto;
  const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
  const eu = E => E && E.torcida ? E.torcida.id : null;

  /* de que cidade é a torcida (a sede-mãe) */
  const casaDe = tid => ((TO.mundo && TO.mundo.torcida(tid)) || {}).mapa || null;

  /* ---- onde se mora: os pesos dos bairros de uma cidade pra uma torcida ---- */
  const pesosMemo = new Map();
  function pesosDeMoradia(tid, cid){
    const ch = tid + '|' + cid;
    if(pesosMemo.has(ch)) return pesosMemo.get(ch);
    const Dm = D(), bs = Dm.bairrosDe(cid);
    if(!bs.length){ pesosMemo.set(ch, null); return null; }
    const home = casaDe(tid) === cid;
    const ref = home ? Dm.sedeDe(tid, cid) : Dm.bairroDaFilial(tid, cid);
    const c = Dm.indice().cidade.get(cid);
    const zona = b => Dm.semZonas(cid) ? 'cidade:' + Dm.cidadeDoBairro(cid, b.id) : b.zona;
    const viz = ref ? new Set(Dm.vizinhosDe(cid, ref.id).map(v => v.id)) : new Set();
    const w = bs.map(b => {
      let v = Math.max(0.05, Dm.presencaDa(tid, cid, b.id));
      if(ref && b.id === ref.id) v *= home ? 4 : 6;
      else if(!home && viz.has(b.id)) v *= 2;
      else if(home && ref && zona(b) === zona(ref)) v *= 1.5;
      /* a filial mora em volta do bairro dela, não espalhada pela praça */
      else if(!home) v *= 0.15;
      return v;
    });
    const soma = w.reduce((a, b) => a + b, 0) || 1;
    const r = {bs, w, soma};
    void c;
    pesosMemo.set(ch, r);
    return r;
  }
  function sortearBairro(tid, cid, chave){
    const P = pesosDeMoradia(tid, cid);
    if(!P) return null;
    let x = fr(chave + '|bairro') * P.soma;
    for(let i = 0; i < P.bs.length; i++){ x -= P.w[i]; if(x <= 0) return P.bs[i].id; }
    return P.bs[P.bs.length - 1].id;
  }

  /* ---- a pirâmide de cargos da fonte, em fração ---- */
  const piramideMemo = new Map();
  function piramide(tid){
    if(piramideMemo.has(tid)) return piramideMemo.get(tid);
    const o = (TO.mundo && TO.mundo.torcida(tid)) || {};
    const plano = TO.membros && TO.membros.planoDeCargos ? TO.membros.planoDeCargos(100, o.cargos) : [['novato', 100]];
    const tot = plano.reduce((s, [, n]) => s + n, 0) || 1;
    let acc = 0;
    const r = plano.map(([c, n]) => { acc += n / tot; return [c, acc]; });
    piramideMemo.set(tid, r);
    return r;
  }

  /* ---- a fila de uma torcida numa cidade ---- */
  const filaMemo = new Map();
  function nomeDaFila(tid, cid){
    const o = (TO.mundo && TO.mundo.torcida(tid)) || {nome:tid};
    if(casaDe(tid) === cid) return o.nome;
    const c = D().indice().cidade.get(cid);
    return `${o.nome} ${(c && c.nome) || cid}`;
  }
  function membroDaFila(E, tid, cid, i, nomeFila, quadro){
    const chave = `elenco|${tid}|${cid}|${i}`;
    const pir = piramide(tid), x = fr(chave + '|cargo');
    const cargo = (pir.find(([, a]) => x <= a) || pir[pir.length - 1] || ['novato'])[0];
    const media = quadro && quadro.forca && quadro.forca[cargo] != null ? quadro.forca[cargo] : null;
    const [lo, hi] = faixa(cargo), teto = tetoDe(cargo);
    const ficha = k => media != null
      ? limitar(Math.round(media + fr(chave + k) * 3 - 1.5), 1, teto)
      : limitar(lo + Math.floor(fr(chave + k) * (hi - lo + 1)), 1, teto);
    const nome = TO.membros && TO.membros.nomesDaTorcida ? TO.membros.nomesDaTorcida(nomeFila, i, 1)[0] : `#${i}`;
    return {id:`${tid}#${cid}#${i}`, i, torcida:tid, cidade:cid, apelido:nome, cargo,
            idade: IDADE[0] + H(chave + '|idade') % (IDADE[1] - IDADE[0] + 1),
            bairro: sortearBairro(tid, cid, chave), forca:ficha('|f'), defesa:ficha('|d')};
  }
  /* o efetivo de hoje da torcida naquela cidade, e quantos estão de pé */
  function tamanhos(E, tid, cid){
    const W = TO.relacoes && TO.relacoes.mundo ? TO.relacoes.mundo(E) : {};
    const t = W[tid];
    if(casaDe(tid) === cid){
      const n = t ? (t.membros || 0) : (((TO.mundo && TO.mundo.torcida(tid)) || {}).membros || 0);
      const dp = t && TO.relacoes.disponiveisIA ? TO.relacoes.disponiveisIA(E, tid) : n;
      return {n, dp:Math.min(n, dp)};
    }
    const f = t && (t.filiais || []).find(x => x.cidade === cid);
    const n = f ? (f.membros || 0) : 0;
    return {n, dp:n};
  }
  /* A FILA DA IA (a lista inteira, de pé ou não) */
  function filaIA(E, tid, cid){
    const {n} = tamanhos(E, tid, cid);
    const q = TO.relacoes && TO.relacoes.quadroDe ? TO.relacoes.quadroDe(E, tid) : null;
    const sem = (E.data && E.data.semana) || 0;
    const ch = `${tid}|${cid}|${n}|${(E.data && E.data.ano) || 0}|${sem}`;
    const m = filaMemo.get(tid + '|' + cid);
    if(m && m.ch === ch) return m.l;
    const nomeFila = nomeDaFila(tid, cid), l = [];
    for(let i = 0; i < n; i++) l.push(membroDaFila(E, tid, cid, i, nomeFila, q));
    filaMemo.set(tid + '|' + cid, {ch, l});
    return l;
  }

  /* ---- os nossos: o bairro de cada um ---- */
  function bairroDoNosso(E, m){
    const cid = m.filial || E.torcida.mapa;
    const Dm = D();
    if(m.bairro && Dm.bairro(cid, m.bairro)) return m.bairro;
    m.bairro = sortearBairro(E.torcida.id, cid, `nosso|${E.torcida.id}|${cid}|${m.id}`);
    return m.bairro;
  }
  function garantirNossos(E){
    if(!E || !E.membros || !E.torcida) return;
    for(const m of E.membros) bairroDoNosso(E, m);
  }
  /* o novato recrutado mora no bairro do recrutamento do mês */
  function morarNoRecrutamento(E, m){
    const b = D().bairroDoRecrutamento ? D().bairroDoRecrutamento(E) : null;
    if(m && b && !m.filial) m.bairro = b.id;
  }

  /* ---- quem desce ---- */
  const forcaDe = m => (m.forca || 0) + (m.defesa || 0);
  function disponiveis(E, tid, cid){
    if(tid === eu(E)){
      const M = TO.membros;
      return E.membros.filter(m => (cid === E.torcida.mapa ? !m.filial : m.filial === cid) &&
        (!M || !M.disponivel || M.disponivel(m)) && m.cargo !== 'velha');
    }
    const l = filaIA(E, tid, cid), {n, dp} = tamanhos(E, tid, cid);
    if(!n || dp >= n) return l;
    /* quem está ferido ou preso na IA: uma fatia fixa da semana */
    const sa = (E.data && ((E.data.ano || 0) * 60 + (E.data.semana || 0))) || 0;
    return l.filter(m => fr(`${m.id}|pe|${sa}`) < dp / n);
  }
  /* os mais fortes da cidade (quem ataca traz até 20) */
  function maisFortes(E, tid, cid, max){
    if(tid === eu(E)) for(const m of E.membros) bairroDoNosso(E, m);
    return disponiveis(E, tid, cid).slice().sort((a, b) => forcaDe(b) - forcaDe(a)).slice(0, max || 20);
  }
  /* os moradores do bairro (quem defende: até 15; no beco, até 7). Com
     menos de 3 ali, chegam os mais fortes da mesma zona até 3 */
  function noBairro(E, tid, cid, bid, max){
    max = max || 15;
    const todos = disponiveis(E, tid, cid);
    if(tid === eu(E)) for(const m of todos) bairroDoNosso(E, m);
    const ali = todos.filter(m => m.bairro === bid).sort((a, b) => forcaDe(b) - forcaDe(a));
    if(ali.length >= Math.min(3, max)) return ali.slice(0, max);
    const Dm = D(), x = Dm.bairro(cid, bid);
    const z = x ? x.zona : null;
    const perto = todos.filter(m => m.bairro !== bid && (!z || ((Dm.bairro(cid, m.bairro) || {}).zona === z)))
      .sort((a, b) => forcaDe(b) - forcaDe(a));
    return ali.concat(perto.slice(0, Math.min(3, max) - ali.length));
  }
  /* quantos moram no bairro, por torcida (o cartão do bairro) */
  function moradores(E, cid, bid){
    const out = {};
    const Dm = D();
    const ts = Dm.torcidasDaCidade(cid).map(o => o.id);
    const W = TO.relacoes && TO.relacoes.mundo ? TO.relacoes.mundo(E) : {};
    for(const id in W) if((W[id].filiais || []).some(f => f.cidade === cid) && !ts.includes(id)) ts.push(id);
    if(((E.patrimonio || {}).filiais || []).some(f => f.cidade === cid) && !ts.includes(eu(E))) ts.push(eu(E));
    for(const tid of ts){
      let l;
      if(tid === eu(E)){ garantirNossos(E); l = E.membros.filter(m => (cid === E.torcida.mapa ? !m.filial : m.filial === cid)); }
      else l = filaIA(E, tid, cid);
      const n = l.filter(m => m.bairro === bid).length;
      if(n) out[tid] = n;
    }
    return out;
  }
  /* o nome que aparece: a torcida, ou "Cearamor Recife" fora de casa */
  const nomeNaCidade = (tid, cid) => nomeDaFila(tid, cid);

  /* o teto do ataque numa briga de bairro: até 60% a mais que os
     defensores (dono, 15/10/2026) */
  const ATAQUE = 1.6;
  const ataqueContra = nDef => Math.max(2, Math.floor(Math.max(1, nDef) * ATAQUE));
  /* quantos vêm de fato, sorteado entre 70% e 160% dos defensores (o
     dono, 15/10/2026: "não é obrigatório sempre ter 60% a mais, mas até
     60%" e "continua gerando 7x7 também, 7x5, etc") — `r` é um número
     de 0 a 1 */
  const PISO = 0.7;
  const ataqueSorteado = (nDef, r) => {
    const base = Math.max(2, Math.ceil(Math.max(1, nDef) * PISO)), teto = ataqueContra(nDef);
    return base + Math.floor(Math.max(0, Math.min(0.999, r)) * (teto - base + 1));
  };
  return {ATAQUE, ataqueContra, ataqueSorteado, fila:filaIA, maisFortes, noBairro, moradores, bairroDoNosso, garantirNossos,
          morarNoRecrutamento, nomeNaCidade, disponiveis, tamanhos};
})();
