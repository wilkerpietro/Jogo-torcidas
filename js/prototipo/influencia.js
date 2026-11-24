/* =========================================================
   INFLUÊNCIA DOS EIXOS — protótipo à parte (dono, 13/10/2026)
   ---------------------------------------------------------
   "Faça um modelo de contrainteligência pra manipular as outras
   torcidas a seguirem nossa ideologia, inspirado em como o Hearts of
   Iron IV manipula um país a virar de outra ideologia. Toda torcida
   tende a ser de um eixo e quer influenciar as aliadas a fazer parte
   dele. O jogo vai caminhar pra quatro ou cinco grandes eixos
   nacionais. As torcidas grandes regem essa lógica por terem mais
   poder de influência, igual à esfera de influência do Victoria II."

   A IDEOLOGIA É O EIXO. Cada torcida tem um APOIO a cada eixo (em %,
   somando 100 com "sem eixo") — o que o HoI4 chama de popularidade
   dos partidos. Toda semana:

     1. cada torcida gera PONTOS DE INFLUÊNCIA (PI): tamanho ^0,85,
        prestígio e sede. As 8 maiores do país são POTÊNCIAS (×1,5) —
        a esfera do Victoria II;
     2. um pedaço fica em casa (a base, que segura a ideologia dela)
        e o resto vira CAMPANHA nas aliadas (relação ≥ +20) que ainda
        não são do eixo — ou nas do eixo que estão balançando;
     3. a CONTRAINTELIGÊNCIA de cada uma corta a campanha que chega de
        fora (a IA liga quando ela própria balança; a nossa é escolha);
     4. o apoio anda 8% por semana na direção da fatia de influência
        que cada eixo pôs ali (a deriva de ideologia do HoI4).

   QUANDO UM EIXO DE FORA PASSA O DA CASA, a torcida se inclina: toda
   semana sobe a relação com os membros do eixo novo e esfria com os
   do antigo. Com 50% de apoio ela pede entrada (pelas regras de
   sempre do `TO.eixos.podeEntrar` — rival dentro barra); com menos de
   15% pelo eixo de casa, ela sai dele. Eixo que fica com um membro só
   se dissolve. É isso que empurra o país pra poucos eixos grandes.

   A NOSSA TORCIDA NÃO VIRA SOZINHA: a gente vê a pressão e paga moral
   se a base estiver dividida, mas trocar de eixo segue sendo decisão
   nossa, na Diplomacia.

   Como o Desenvolvimento, este arquivo só entra no `desenvolvimento.html`
   e mexe no jogo por fora (relações, `TO.eixos`). Texto só em
   português: é protótipo.
   ========================================================= */
(function(){
  'use strict';
  const ST = () => TO.estado;
  const Ev = () => ST() && ST().E;
  const X  = () => TO.eixos;
  const M  = () => TO.mundo;
  const R  = () => TO.relacoes;
  const um = v => (Math.round(v * 10) / 10).toLocaleString('pt-BR');
  const pct = v => Math.round(v) + '%';

  /* -------------------------------------------------------
     A RÉGUA
     ------------------------------------------------------- */
  const SEM_EIXO     = '_';
  /* a régua veio do Hearts of Iron IV (pesquisa de 13/10/2026, arquivos do
     jogo): a deriva é SOMA de pontos por semana, não salto; a defesa contra
     a deriva corta até a metade; o não alinhado é 30% mais fácil de virar;
     os 7 maiores são os "majors"; facção pede 30% da ideologia do líder */
  const POTENCIAS    = 7;      // os "majors" do país: ×1,5 (e a esfera do Victoria II)
  const MULT_POTENCIA= 1.5;
  const ALIADA       = 20;     // só se influencia quem anda com a gente
  const GANHO        = 3;      // pontos de apoio por semana por PI de campanha, sobre (PI do alvo + 5)
  const BASE_CASA    = 0.5;    // a base segura o eixo de casa: +0,5 ponto por semana (no HoI4 o partido no poder não tem deriva própria)
  const BASE_SEM_EIXO= 1;      // quem não tem eixo segura menos: "toda torcida tende a ter um"
  const ALVOS_IA     = 4;      // a IA concentra a campanha em até 4 torcidas
  const ALVOS_NOSSOS = 3;      // e a gente escolhe até 3
  const DEFESA_IA    = [0.1, 0.3];  // contrainteligência da IA: tranquila / balançando
  const RESIST_MAX   = 0.6;    // a resistência à deriva não passa de 60%
  const SEM_EIXO_RES = -0.3;   // sem eixo: 30% mais fácil de virar (o não alinhado do HoI4)
  const INCLINA      = 50;     // eixo de fora acima disto: as relações começam a andar
  const ENTRAR_MIN   = 30;     // apoio mínimo pra entrar num eixo (os 30% da facção do HoI4)
  const TRAICAO      = 50;     // sair de um eixo: −50 com cada membro, mas para no neutro
  const DERIVA_REL   = 1.5;    // relação por semana quando inclinada (até 3)
  const EIXOS_MAX    = 8;      // teto de eixos ativos por país (dono, 13/10/2026: "pode ter até 8 eixos agora")
  const CORES = ['#d64545', '#3b82d6', '#2f9e5b', '#e0a400', '#8e5bd0', '#159a9a', '#e06a1c',
                 '#c2418d', '#6b8e23', '#b07d48', '#4b6cb7', '#a33b3b'];

  /* o caixote no save */
  function I(E){
    if(!E || !E.torcida) return null;
    const i = E.influencia = E.influencia || {};
    i.apoio  = i.apoio  || {};
    i.hist   = i.hist   || [];
    i.nossa  = i.nossa  || {auto:true, alvos:[], defesa:0.25, bandeira:null};
    i.semana = i.semana || null;
    i.ult    = i.ult    || {};   // a foto da última semana, pra tela
    i.avisos = i.avisos || {};
    return i;
  }

  /* -------------------------------------------------------
     AS PEÇAS DO MUNDO
     ------------------------------------------------------- */
  const rel = (E, a, b) => a === E.torcida.id ? R().nivel(E, b)
    : b === E.torcida.id ? R().nivel(E, a) : R().relacaoDelas(E, a, b);
  function porRel(E, a, b, v){
    v = Math.max(-100, Math.min(100, v));
    if(a === E.torcida.id) E.relacoes[b] = v;
    else if(b === E.torcida.id) E.relacoes[a] = v;
    else { R().relacaoDelas(E, a, b); E.relacoesDelas[R().chaveDe(a, b)] = v; }
  }
  const pais = o => (o && o.fora) ? o.regiao : 'Brasil';
  function membrosDe(E, id){
    if(id === E.torcida.id) return E.membros.length;
    const t = (E.mundoTorcidas || {})[id];
    return t ? (t.membros || 0) : ((M().torcida(id) || {}).membros || 0);
  }
  function prestigioDe(E, id){
    if(id === E.torcida.id) return (E.indicadores || {}).prestigio || 0;
    return ((E.mundoTorcidas || {})[id] || {}).prestigio || 0;
  }
  function sedeDe(E, id){
    if(id === E.torcida.id) return E.torcida.sedeNivel || 0;
    return ((E.mundoTorcidas || {})[id] || {}).sede || 0;
  }
  /* o poder de influência da semana */
  function piBase(E, id){
    const m = Math.max(1, membrosDe(E, id));
    return Math.pow(m, 0.85) / 10 * (0.6 + prestigioDe(E, id) / 25) * (1 + sedeDe(E, id) * 0.1);
  }

  /* a bandeira de cada uma: o eixo de maior apoio entre os que ela é membro */
  function bandeiraDe(E, id, ap){
    const meus = X().de(E, id);
    if(!meus.length) return null;
    if(id === E.torcida.id){
      const b = I(E).nossa.bandeira;
      if(b && meus.some(x => x.id === b)) return b;
    }
    ap = ap || I(E).apoio[id] || {};
    return meus.slice().sort((a, b) => (ap[b.id] || 0) - (ap[a.id] || 0))[0].id;
  }

  /* o apoio de partida: quem é de um eixo começa com 80%; de dois, 65/25 */
  function apoioInicial(E, id){
    const meus = X().de(E, id);
    if(!meus.length) return {[SEM_EIXO]: 100};
    if(meus.length === 1) return {[meus[0].id]: 80, [SEM_EIXO]: 20};
    return {[meus[0].id]: 65, [meus[1].id]: 25, [SEM_EIXO]: 10};
  }
  function apoioDe(E, id){
    const i = I(E);
    if(!i.apoio[id]) i.apoio[id] = apoioInicial(E, id);
    return i.apoio[id];
  }

  /* -------------------------------------------------------
     A SEMANA
     ------------------------------------------------------- */
  function semana(E, forcar){
    const i = I(E); if(!i) return null;
    const chave = `${E.data.ano}-${E.data.semana}`;
    if(!forcar && i.semana === chave) return null;
    i.semana = chave;
    const nos = E.torcida.id;
    const J = M().jogaveis().filter(o => !o.incompleta);
    const ids = J.map(o => o.id);
    const porId = new Map(J.map(o => [o.id, o]));

    /* 1. o PI de cada uma, e as potências de cada país */
    const pi = {};
    for(const id of ids) pi[id] = piBase(E, id);
    const potencias = new Set();
    const porPais = {};
    for(const o of J) (porPais[pais(o)] = porPais[pais(o)] || []).push(o.id);
    for(const lista of Object.values(porPais))
      lista.slice().sort((a, b) => pi[b] - pi[a]).slice(0, POTENCIAS).forEach(id => { potencias.add(id); pi[id] *= MULT_POTENCIA; });

    /* 2. quem anda com quem (dentro do mesmo país: eixo não atravessa fronteira) */
    const aliadas = new Map(ids.map(id => [id, []]));
    for(const lista of Object.values(porPais))
      for(let a = 0; a < lista.length; a++) for(let b = a + 1; b < lista.length; b++){
        const v = rel(E, lista[a], lista[b]);
        if(v >= ALIADA){ aliadas.get(lista[a]).push([lista[b], v]); aliadas.get(lista[b]).push([lista[a], v]); }
      }

    /* 3. a bandeira, a defesa e a campanha de cada uma */
    const inf = new Map(ids.map(id => [id, {}]));        // alvo -> {eixo: pontos}
    const nossaParte = {};                                // alvo -> pontos nossos
    const defesa = {}, bandeira = {}, campanha = {};
    const soma = (alvo, eixo, v) => { const o = inf.get(alvo); o[eixo] = (o[eixo] || 0) + v; };
    for(const id of ids){
      const ap = apoioDe(E, id);
      const b = bandeira[id] = bandeiraDe(E, id, ap);
      const p = pi[id];
      if(!b){ defesa[id] = 0; continue; }
      /* a contrainteligência: a IA liga quando ela própria balança */
      let df;
      if(id === nos) df = i.nossa.defesa || 0;
      else df = (ap[b] || 0) < 60 ? DEFESA_IA[1] : DEFESA_IA[0];
      defesa[id] = df;
      /* a campanha: aliadas que ainda não são da bandeira, ou que balançam */
      const verba = p * (1 - df);
      let alvos;
      if(id === nos && !i.nossa.auto){
        const ok = new Set((aliadas.get(id) || []).map(x => x[0]));
        alvos = (i.nossa.alvos || []).filter(a => ok.has(a)).map(a => [a, 1]);
      } else {
        alvos = (aliadas.get(id) || [])
          .filter(([a]) => (apoioDe(E, a)[b] || 0) < 95 && a !== nos)
          .map(([a, v]) => [a, (v - 10) / 50 * (1.5 - (apoioDe(E, a)[b] || 0) / 100) * Math.sqrt(membrosDe(E, a) + 4)])
          .sort((x, y) => y[1] - x[1]).slice(0, id === nos ? ALVOS_NOSSOS : ALVOS_IA);
      }
      const pesoTot = alvos.reduce((s, x) => s + x[1], 0);
      campanha[id] = alvos.map(([a, w]) => ({alvo:a, v: pesoTot ? verba * w / pesoTot : 0}));
    }
    for(const id of ids) for(const c of (campanha[id] || [])){
      soma(c.alvo, bandeira[id], c.v);
      if(id === nos) nossaParte[c.alvo] = (nossaParte[c.alvo] || 0) + c.v;
    }

    /* 4. a deriva (o drift do HoI4): pontos somados por semana.
       A campanha de fora rende GANHO × PI ÷ (PI do alvo + 5) — torcida
       grande é difícil de virar — e perde a RESISTÊNCIA do alvo (o
       "drift defence": tamanho + contrainteligência, até 60%; sem eixo,
       −30%). A base de casa soma +0,5 por semana pro eixo dela, e a
       campanha das parceiras do mesmo eixo entra inteira. Depois a soma
       volta a 100 — é isso que faz o empurrão minguar perto do topo. */
    const total = {}, resist = {};
    for(const id of ids){
      const o = inf.get(id), ap = apoioDe(E, id);
      const meus = X().de(E, id).map(x => x.id);
      let r = 0.1 + 0.25 * Math.min(1, membrosDe(E, id) / 500) + (defesa[id] || 0);
      if(!meus.length) r += SEM_EIXO_RES;
      r = resist[id] = Math.max(SEM_EIXO_RES, Math.min(RESIST_MAX, r));
      total[id] = Object.values(o).reduce((s, v) => s + v, 0);
      const escala = GANHO / (pi[id] + 5);
      for(const [k, v] of Object.entries(o))
        ap[k] = (ap[k] || 0) + v * escala * (meus.includes(k) ? 1 : (1 - r));
      if(meus.length){
        const tot = meus.reduce((s, k) => s + (ap[k] || 1), 0);
        for(const k of meus) ap[k] = (ap[k] || 0) + BASE_CASA * (ap[k] || 1) / tot;
      } else ap[SEM_EIXO] = (ap[SEM_EIXO] || 0) + BASE_SEM_EIXO;
      /* eixo que sumiu do mapa sai da conta; migalha também */
      for(const k of Object.keys(ap)) if(ap[k] < 0.5 || (k !== SEM_EIXO && !X().eixo(E, k))) delete ap[k];
      const s = Object.values(ap).reduce((a, v) => a + v, 0) || 1;
      for(const k of Object.keys(ap)) ap[k] = ap[k] * 100 / s;
    }

    /* 5. quem passou do ponto (dono, 13/10/2026): "gradualmente as relações
       com os membros do eixo em que ela está vão piorando e melhorando com
       os membros do outro eixo, a ponto dela sair de um eixo e entrar em
       outro". Nada de troca automática: acima de 50% a relação anda toda
       semana; ela SAI quando deixa de ser aliada de metade do eixo de casa
       (a mesma régua que o jogo usa pra entrar), pagando a traição; e
       ENTRA quando o eixo novo a aceita pelas regras de sempre e o apoio
       passa de 30% (o piso de facção do HoI4). */
    const eventos = [];
    for(const id of ids){
      if(id === nos) continue;
      const ap = apoioDe(E, id);
      let meus = X().de(E, id).map(x => x.id);
      const deFora = Object.keys(ap).filter(k => k !== SEM_EIXO && !meus.includes(k))
        .sort((a, b) => ap[b] - ap[a])[0];
      if(!deFora) continue;
      const vFora = ap[deFora] || 0;
      const xF = X().eixo(E, deFora);
      const casa = meus.length ? meus.slice().sort((a, b) => (ap[b] || 0) - (ap[a] || 0))[0] : SEM_EIXO;
      const k = `${id}|${deFora}`;
      if(vFora > INCLINA){
        const passo = Math.min(3, DERIVA_REL * Math.max(1, (vFora - INCLINA) / 15));
        for(const m of xF.membros){
          if(m === id) continue;
          const v = rel(E, id, m);
          if(v > -15 && v < 60) porRel(E, id, m, Math.min(60, v + passo));
          /* a treta com rival comum de dentro do eixo novo também esfria,
             na metade do passo e só até o neutro — o rival dentro barra a
             entrada (`podeEntrar`), e sem isto nenhum eixo grande
             absorvia ninguém. Maior rival não: esse barra pra sempre. */
          else if(v <= -15 && !(R().ehMaiorRival && R().ehMaiorRival(E, id, m)))
            porRel(E, id, m, Math.min(0, v + passo / 2));
        }
        for(const c of meus) for(const m of (X().eixo(E, c) || {membros:[]}).membros){
          if(m === id || xF.membros.includes(m) || (M().saoIrmas && M().saoIrmas(id, m))) continue;
          const v = rel(E, id, m);
          if(v > 0) porRel(E, id, m, Math.max(0, v - passo));
        }
        if(!i.avisos[k]){ i.avisos[k] = E.data.absoluto || 1;
          eventos.push({tipo:'inclinou', torcida:id, eixo:deFora, de:casa}); }
        /* sai do eixo de casa quando não é mais aliada de metade dele */
        for(const c of meus){
          const outros = ((X().eixo(E, c) || {}).membros || []).filter(m => m !== id);
          const amigas = outros.filter(m => rel(E, id, m) >= ALIADA).length;
          if(outros.length && amigas * 2 < outros.length && sair(E, c, id))
            eventos.push({tipo:'saiu', torcida:id, eixo:c, pra:deFora});
        }
        meus = X().de(E, id).map(x => x.id);
      }
      /* entra quando o eixo a aceita e o apoio passa do piso */
      if(vFora >= ENTRAR_MIN && meus.length < X().MAX_POR_TORCIDA && X().podeEntrar(E, deFora, id).ok){
        X().entrar(E, deFora, id);
        eventos.push({tipo:'entrou', torcida:id, eixo:deFora, de:casa});
        delete i.avisos[k];
      }
    }
    /* 6. eixo de um membro só se dissolve */
    const Xc = X().caixas(E);
    for(const x of Xc.lista.slice()){
      if(x.membros.length > 1 || x.dissolvido) continue;
      const ultimo = x.membros[0] || null;
      if(ultimo){ delete apoioDe(E, ultimo)[x.id]; anotarEixo(E, {tipo:'saiu', eixo:x.id, torcida:ultimo}); }
      /* o eixo de nascença fica no save, vazio e marcado: tirado da lista,
         a migração do jogo o recriaria a cada leitura (ela devolve todo
         eixo da fonte que falta). Vazio, ninguém é recrutado pra ele —
         `podeEntrar` pede aliada de pelo menos um membro. */
      if(x.base){ x.membros = []; x.dissolvido = true; }
      else Xc.lista = Xc.lista.filter(y => y !== x);
      eventos.push({tipo:'dissolveu', eixo:x.id, nome:x.nome, torcida:ultimo});
    }

    /* 7. a nossa base: eixo de fora passando a nossa bandeira custa moral */
    const nAp = apoioDe(E, nos), nB = bandeira[nos];
    const fora = Object.keys(nAp).filter(k => k !== SEM_EIXO && k !== nB).sort((a, b) => nAp[b] - nAp[a])[0];
    if(nB && fora && nAp[fora] > (nAp[nB] || 0) && E.indicadores){
      E.indicadores.moral = Math.max(0, (E.indicadores.moral || 0) - 0.3);
      eventos.push({tipo:'pressao', torcida:nos, eixo:fora});
    }

    /* a foto da semana, pra tela */
    i.ult = {abs:E.data.absoluto || 0, quando:quando(E),
      pi: Object.fromEntries(ids.map(id => [id, Math.round(pi[id] * 10) / 10])),
      potencias:[...potencias], nossaParte, total,
      recebido: Object.fromEntries(ids.filter(id => Object.keys(inf.get(id)).length).map(id => [id, inf.get(id)])),
      campanha: (campanha[nos] || []).map(c => ({alvo:c.alvo, v:c.v})),
      defesa: defesa[nos] || 0, resist: resist[nos] || 0};
    for(const ev of eventos){
      if(ev.tipo === 'pressao' && i.hist[0] && i.hist[0].tipo === 'pressao') continue;
      i.hist.unshift(Object.assign({abs:E.data.absoluto || 0, quando:quando(E)}, ev));
      avisar(E, ev);
    }
    if(i.hist.length > 120) i.hist.length = 120;
    return {eventos};
  }

  /* sair de um eixo: o mesmo custo da saída do jogo (−20 com quem fica) */
  function sair(E, eixoId, id){
    const x = X().eixo(E, eixoId);
    if(!x || !x.membros.includes(id)) return false;
    x.membros = x.membros.filter(m => m !== id);
    /* a traição (dono, 13/10/2026): −50, "mas não vira rival de cara,
       vira neutro" — quem estava acima de zero para no zero */
    for(const m of x.membros){ const v = rel(E, id, m); if(v > 0) porRel(E, id, m, Math.max(0, v - TRAICAO)); }
    const Xc = X().caixas(E);
    Xc.vetos[`${eixoId}|${id}`] = R().semanaAbs(E);
    anotarEixo(E, {tipo:'saiu', eixo:eixoId, torcida:id, outra:null});
    return true;
  }
  function anotarEixo(E, linha){
    const Xc = X().caixas(E);
    Xc.seqHist = (Xc.seqHist || 0) + 1;
    Xc.historico.unshift(Object.assign({seq:Xc.seqHist, abs:E.data.absoluto || 0, ano:E.data.ano, semana:E.data.semana}, linha));
  }
  const quando = E => ST().dataTexto ? ST().dataTexto(E).curta : `${E.data.semana}/${E.data.ano}`;

  /* -------------------------------------------------------
     O QUE MEXE COM A GENTE VIRA AVISO
     ------------------------------------------------------- */
  function avisar(E, ev){
    const nos = E.torcida.id, nossos = X().de(E, nos).map(x => x.id);
    const nome = id => (M().torcida(id) || {}).nome || id;
    const eixoNome = id => (X().eixo(E, id) || {}).nome || (id === SEM_EIXO ? 'sem eixo' : id);
    let txt = null;
    if(ev.tipo === 'entrou' && nossos.includes(ev.eixo)) txt = `A ${nome(ev.torcida)} virou: agora é do nosso ${eixoNome(ev.eixo)}.`;
    else if(ev.tipo === 'saiu' && nossos.includes(ev.eixo)) txt = `A ${nome(ev.torcida)} largou o nosso ${eixoNome(ev.eixo)}.`;
    else if(ev.tipo === 'inclinou' && nossos.includes(ev.eixo)) txt = `A ${nome(ev.torcida)} está se inclinando pro ${eixoNome(ev.eixo)}.`;
    else if(ev.tipo === 'pressao') txt = `A nossa base está dividida: o ${eixoNome(ev.eixo)} já tem mais apoio aqui dentro que a nossa bandeira. Moral −0,3.`;
    if(txt && TO.ui && TO.ui.aviso) TO.ui.aviso(txt, ev.tipo === 'saiu' || ev.tipo === 'pressao' ? 'ruim' : 'boa');
  }

  /* -------------------------------------------------------
     AS ESCOLHAS DO DONO
     ------------------------------------------------------- */
  function aliadasNossas(E){
    const nos = E.torcida.id, b = bandeiraDe(E, nos);
    return M().jogaveis().filter(o => !o.incompleta && o.id !== nos && pais(o) === pais(M().torcida(nos)) &&
      rel(E, nos, o.id) >= ALIADA)
      .map(o => ({id:o.id, nome:o.nome, rel:Math.round(rel(E, nos, o.id)), membros:membrosDe(E, o.id),
                  nossoEixo: b ? Math.round(apoioDe(E, o.id)[b] || 0) : 0,
                  dentro: b ? X().eixo(E, b).membros.includes(o.id) : false}))
      .sort((a, b2) => (a.dentro - b2.dentro) || (b2.rel - a.rel));
  }
  function alternarAlvo(id){
    const E = Ev(), n = I(E).nossa;
    const i = n.alvos.indexOf(id);
    if(i >= 0) n.alvos.splice(i, 1);
    else { if(n.alvos.length >= ALVOS_NOSSOS) n.alvos.shift(); n.alvos.push(id); }
    n.auto = false;
  }

  /* -------------------------------------------------------
     A PÁGINA DO MENU (mesmas peças das páginas do jogo)
     ------------------------------------------------------- */
  let aba = 'nossa', pgAtual = null;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const linha = (rot, val, cls) => `<div class="linha-dado"><span>${rot}</span><b${cls ? ` class="${cls}"` : ''}>${val}</b></div>`;
  function corDoEixo(E, id){
    if(id === SEM_EIXO) return '#777';
    const lista = X().caixas(E).lista;
    const k = lista.findIndex(x => x.id === id);
    return CORES[(k < 0 ? 0 : k) % CORES.length];
  }
  const nomeEixo = (E, id) => id === SEM_EIXO ? 'Sem eixo' : ((X().eixo(E, id) || {}).nome || id);
  const siglaEixo = (E, id) => id === SEM_EIXO ? '—' : ((X().eixo(E, id) || {}).sigla || nomeEixo(E, id));
  /* a barra empilhada do apoio, com legenda curta */
  function barraApoio(E, ap, larga){
    const ks = Object.keys(ap).sort((a, b) => ap[b] - ap[a]);
    const seg = ks.map(k => `<i title="${esc(nomeEixo(E, k))} · ${pct(ap[k])}" style="display:block;height:100%;width:${ap[k]}%;background:${corDoEixo(E, k)}"></i>`).join('');
    const leg = ks.filter(k => ap[k] >= 5).slice(0, larga ? 4 : 3)
      .map(k => `<span style="color:${corDoEixo(E, k)}">■</span> ${esc(siglaEixo(E, k))} ${pct(ap[k])}`).join(' · ');
    return `<span style="display:flex;flex-direction:column;gap:3px;min-width:${larga ? 220 : 150}px;max-width:100%">`+
      `<span style="display:flex;height:8px;border-radius:2px;overflow:hidden;background:var(--sulco)">${seg}</span>`+
      `<small class="fraco" style="font-weight:400;white-space:normal">${leg}</small></span>`;
  }

  function pintarPagina(pg){
    pgAtual = pg;
    const E = Ev(), UI = TO.ui;
    if(!E || !UI) return;
    I(E);
    pg.innerHTML = '';
    pg.appendChild(UI.el('div', {class:'titulo-pagina', texto:'Influência dos eixos'}));
    pg.appendChild(UI.subabas([
      {id:'nossa', rot:'Nossa influência'}, {id:'eixos', rot:'Eixos do país'},
      {id:'disputa', rot:'Em disputa'}, {id:'movimentos', rot:'Movimentos'}], aba, id => { aba = id; pintarPagina(pg); }));
    if(aba === 'nossa') pgNossa(pg, E, UI);
    else if(aba === 'eixos') pgEixos(pg, E, UI);
    else if(aba === 'disputa') pgDisputa(pg, E, UI);
    else pgMovimentos(pg, E, UI);
  }
  const repintar = () => { if(pgAtual && pgAtual.isConnected) pintarPagina(pgAtual); };

  function pgNossa(pg, E, UI){
    const i = I(E), nos = E.torcida.id, meus = X().de(E, nos), b = bandeiraDe(E, nos);
    const ult = i.ult || {};
    pg.appendChild(UI.el('div', {class:'recado', html:
      `Protótipo à parte. A ideologia de cada torcida é o eixo: toda semana as torcidas gastam <b>pontos de influência</b> nas aliadas pra puxá-las pro eixo delas. `+
      `Acima de 50% de apoio a um eixo de fora, a torcida se aproxima dos membros dele e esfria com os do eixo dela, semana a semana, até sair de um e entrar no outro.`+
      `<small>As 7 maiores do país são potências (×1,5). Torcida grande resiste mais; a contrainteligência soma resistência. Sair de um eixo custa −50 com cada membro, parando no neutro.</small>`}));
    const grade = UI.el('div', {class:'colunas-3'});

    const c1 = UI.cartao('A nossa bandeira', b ? siglaEixo(E, b) : 'sem eixo');
    if(!meus.length){
      c1.corpo.innerHTML = `<div class="em-construcao"><b>Sem eixo, sem bandeira</b>Sem eixo não há ideologia pra vender. Funde um eixo ou entre num, em Diplomacia → Eixos. A contrainteligência continua valendo.</div>`;
    } else {
      c1.corpo.innerHTML = `<div class="valorao"><span>a ideologia que a gente espalha</span><b>${esc(nomeEixo(E, b))}</b></div>`;
      if(meus.length > 1){
        for(const x of meus){
          const bt = UI.el('button', {class:'oferta' + (x.id === b ? ' travada' : '')});
          bt.innerHTML = `<span class="txt"><b>${x.id === b ? '✓ ' : ''}${esc(x.nome)}</b><small>${x.membros.length} membros</small></span><span class="preco">${x.id === b ? 'bandeira' : 'trocar'}</span>`;
          bt.disabled = x.id === b;
          bt.onclick = () => { i.nossa.bandeira = x.id; repintar(); };
          c1.corpo.appendChild(bt);
        }
      }
    }
    grade.appendChild(c1);

    const piN = ult.pi ? ult.pi[nos] : piBase(E, nos);
    const pot = (ult.potencias || []).includes(nos);
    const c2 = UI.cartao('Pontos de influência', `${um(piN)} PI/semana`);
    c2.corpo.innerHTML =
      linha('Membros · prestígio · sede', `${E.membros.length} · ${um(prestigioDe(E, nos))} · ${sedeDe(E, nos)}`)+
      linha('Potência do país', pot ? '<span class="positivo">sim · ×1,5</span>' : '<span class="fraco">não (as 7 maiores)</span>')+
      linha('Na contrainteligência', `${Math.round((i.nossa.defesa || 0) * 100)}% do PI · resistência ${pct((ult.resist || 0) * 100)}`)+
      linha('Em campanha', `${um((ult.campanha || []).reduce((s, c) => s + c.v, 0))} PI`);
    const defs = UI.el('div', {class:'linha-dado'});
    defs.innerHTML = '<span>Contrainteligência</span>';
    const bx = UI.el('b'); bx.style.cssText = 'display:flex;gap:6px;flex-wrap:nowrap';
    for(const v of [0, 0.25, 0.5]){
      const bt = UI.el('button', {class:'bt' + (Math.abs((i.nossa.defesa || 0) - v) < 0.01 ? ' destaque' : ''), texto:Math.round(v * 100) + '%'});
      bt.onclick = () => { i.nossa.defesa = v; repintar(); };
      bx.appendChild(bt);
    }
    defs.appendChild(bx);
    c2.corpo.appendChild(defs);
    grade.appendChild(c2);

    const nAp = apoioDe(E, nos);
    const c3 = UI.cartao('A ideologia da nossa base');
    c3.corpo.innerHTML = linha('Apoio aqui dentro', barraApoio(E, nAp, true))+
      Object.entries((ult.recebido || {})[nos] || {}).filter(([k]) => k !== b).sort((x, y) => y[1] - x[1]).slice(0, 3)
        .map(([k, v]) => linha(`Campanha do ${esc(nomeEixo(E, k))}`, `${um(v)} PI`, 'negativo')).join('')+
      `<div class="linha-dado"><span class="fraco">Se um eixo de fora passar a nossa bandeira, a base racha: moral −0,3 por semana. A gente não troca de eixo sozinha — isso é decisão nossa, na Diplomacia.</span></div>`;
    grade.appendChild(c3);
    pg.appendChild(grade);

    /* as campanhas */
    const al = aliadasNossas(E);
    const cc = UI.cartao('Campanhas nas aliadas', i.nossa.auto ? 'a diretoria escolhe' : `${i.nossa.alvos.length}/${ALVOS_NOSSOS} escolhidas`);
    const topo = UI.el('div', {class:'linha-dado'});
    topo.innerHTML = `<span class="fraco">Até ${ALVOS_NOSSOS} alvos por semana. Só aliada (+${ALIADA}) do nosso país pode ser trabalhada; a verba se divide entre elas.</span>`;
    const auto = UI.el('button', {class:'bt' + (i.nossa.auto ? ' destaque' : ''), texto: i.nossa.auto ? 'Automático ✓' : 'Deixar a diretoria escolher'});
    auto.onclick = () => { i.nossa.auto = !i.nossa.auto; repintar(); };
    topo.appendChild(auto);
    cc.corpo.appendChild(topo);
    if(!b) cc.corpo.appendChild(UI.el('div', {class:'em-construcao', html:'<b>Sem bandeira</b>Sem eixo a campanha não tem pra onde puxar.'}));
    else if(!al.length) cc.corpo.appendChild(UI.el('div', {class:'em-construcao', html:'<b>Sem aliadas</b>Influência anda pela amizade: faça aliadas primeiro.'}));
    else for(const a of al){
      const naCamp = (ult.campanha || []).find(c => c.alvo === a.id);
      const escolhida = !i.nossa.auto && i.nossa.alvos.includes(a.id);
      const ap = apoioDe(E, a.id);
      const bt = UI.el('button', {class:'oferta' + (a.dentro ? ' travada' : '')});
      const parte = ult.nossaParte && ult.nossaParte[a.id] && ult.total && ult.total[a.id]
        ? ` · a nossa fatia: ${pct(ult.nossaParte[a.id] / ult.total[a.id] * 100)}` : '';
      bt.innerHTML = `<span class="txt"><b>${escolhida ? '✓ ' : ''}${esc(a.nome)}</b>`+
        `<small>${a.dentro ? 'já é do nosso eixo' : `apoio ao ${esc(siglaEixo(E, b))}: ${a.nossoEixo}%`} · relação +${a.rel} · ${a.membros} membros${parte}</small>`+
        `${barraApoio(E, ap)}</span>`+
        `<span class="preco">${naCamp ? um(naCamp.v) + ' PI' : (escolhida ? 'na fila' : 'escolher')}</span>`;
      bt.onclick = () => { alternarAlvo(a.id); repintar(); };
      cc.corpo.appendChild(bt);
    }
    pg.appendChild(cc);
  }

  /* o tamanho de cada eixo do país */
  function quadroDosEixos(E){
    const ult = I(E).ult || {}, nosPais = pais(M().torcida(E.torcida.id));
    return X().lista(E).filter(x => x.membros.some(m => pais(M().torcida(m)) === nosPais)).map(x => {
      const mem = x.membros.map(m => membrosDe(E, m)).reduce((s, v) => s + v, 0);
      const pi = x.membros.reduce((s, m) => s + ((ult.pi || {})[m] || piBase(E, m)), 0);
      const pot = x.membros.filter(m => (ult.potencias || []).includes(m)).length;
      const simp = M().jogaveis().filter(o => !o.incompleta && !x.membros.includes(o.id) && (apoioDe(E, o.id)[x.id] || 0) >= 30).length;
      return {x, torcidas:x.membros.length, mem, pi, pot, simp};
    }).sort((a, b) => b.pi - a.pi);
  }
  function pgEixos(pg, E, UI){
    const q = quadroDosEixos(E), nossos = X().de(E, E.torcida.id).map(x => x.id);
    pg.appendChild(UI.el('div', {class:'recado', html:
      `<b>${q.length} de até ${EIXOS_MAX} eixos</b> no país. Eixo novo só nasce se houver vaga, e eixo que fica com um membro só se dissolve.`+
      `<small>Simpatizantes: torcidas de fora do eixo com 30% ou mais de apoio a ele.</small>`}));
    const c = UI.cartao('Os eixos, pelo poder de influência');
    for(const r of q){
      const d = UI.el('div', {class:'linha-dado'});
      d.innerHTML = `<span><span style="color:${corDoEixo(E, r.x.id)}">■</span> <b>${esc(r.x.nome)}</b>${nossos.includes(r.x.id) ? ' <span class="positivo">· nosso</span>' : ''}`+
        `<small class="fraco" style="display:block">${r.torcidas} torcidas · ${r.mem.toLocaleString('pt-BR')} membros · ${r.pot} potência${r.pot === 1 ? '' : 's'} · ${r.simp} simpatizante${r.simp === 1 ? '' : 's'}</small></span>`+
        `<b>${um(r.pi)} PI</b>`;
      c.corpo.appendChild(d);
    }
    pg.appendChild(c);
    const ult = I(E).ult || {};
    const pot = UI.cartao('As potências do país', 'as 7 que regem a influência');
    pot.corpo.innerHTML = (ult.potencias || []).filter(id => pais(M().torcida(id)) === pais(M().torcida(E.torcida.id)))
      .sort((a, b) => (ult.pi[b] || 0) - (ult.pi[a] || 0))
      .map(id => linha(`${esc((M().torcida(id) || {}).nome)} <span class="fraco">· ${esc(siglaEixo(E, bandeiraDe(E, id) || SEM_EIXO))}</span>`, `${um(ult.pi[id])} PI`)).join('')
      || `<div class="em-construcao">Aparece depois da primeira semana.</div>`;
    pg.appendChild(pot);
  }
  function pgDisputa(pg, E, UI){
    const nosPais = pais(M().torcida(E.torcida.id));
    const lista = M().jogaveis().filter(o => !o.incompleta && pais(o) === nosPais).map(o => {
      const ap = apoioDe(E, o.id), meus = X().de(E, o.id).map(x => x.id);
      const casa = meus.length ? meus.slice().sort((a, b) => (ap[b] || 0) - (ap[a] || 0))[0] : SEM_EIXO;
      const fora = Object.keys(ap).filter(k => k !== SEM_EIXO && !meus.includes(k)).sort((a, b) => ap[b] - ap[a])[0];
      return {o, ap, casa, fora, folga:(ap[casa] || 0) - (fora ? ap[fora] : 0)};
    }).filter(r => r.fora && r.ap[r.fora] >= 15).sort((a, b) => a.folga - b.folga);
    pg.appendChild(UI.el('div', {class:'recado', html:
      `As torcidas com um eixo de fora acima de 15% de apoio, das mais perto de virar às mais firmes.`+
      `<small>Acima de 50% pro eixo de fora ela está inclinada: esfria com os parceiros de casa e se aproxima dos do eixo novo.</small>`}));
    const c = UI.cartao('Em disputa', `${lista.length}`);
    c.corpo.innerHTML = lista.slice(0, 40).map(r => linha(
      `<b>${esc(r.o.nome)}</b> <span class="fraco">· ${esc(siglaEixo(E, r.casa))} ⟵ ${esc(siglaEixo(E, r.fora))}</span>${barraApoio(E, r.ap)}`,
      `${r.folga >= 0 ? '+' : ''}${Math.round(r.folga)}`, r.folga < 0 ? 'negativo' : '')).join('')
      || `<div class="em-construcao">Ninguém em disputa ainda.</div>`;
    pg.appendChild(c);
  }
  function pgMovimentos(pg, E, UI){
    const i = I(E), nome = id => (M().torcida(id) || {}).nome || id;
    const nossos = X().de(E, E.torcida.id).map(x => x.id);
    const txt = h => h.tipo === 'entrou' ? `<b>${esc(nome(h.torcida))}</b> entrou pro ${esc(nomeEixo(E, h.eixo))}`
      : h.tipo === 'saiu' ? `<b>${esc(nome(h.torcida))}</b> largou o ${esc(nomeEixo(E, h.eixo))}${h.pra ? ` (puxada pelo ${esc(nomeEixo(E, h.pra))})` : ''}`
      : h.tipo === 'inclinou' ? `<b>${esc(nome(h.torcida))}</b> se inclinou pro ${esc(nomeEixo(E, h.eixo))}`
      : h.tipo === 'dissolveu' ? `O <b>${esc(h.nome)}</b> se dissolveu`
      : h.tipo === 'pressao' ? `A nossa base rachou: o ${esc(nomeEixo(E, h.eixo))} passou a nossa bandeira` : esc(h.tipo);
    const c = UI.cartao('Movimentos da influência', `${i.hist.length}`);
    c.corpo.innerHTML = i.hist.slice(0, 60).map(h => linha(txt(h) + (nossos.includes(h.eixo) || nossos.includes(h.pra) ? ' <span class="positivo">· nosso eixo</span>' : ''),
      `<span class="fraco">${esc(h.quando)}</span>`)).join('') || `<div class="em-construcao">Nada ainda. A influência anda no fechamento de cada semana.</div>`;
    pg.appendChild(c);
  }

  /* -------------------------------------------------------
     A LIGAÇÃO
     ------------------------------------------------------- */
  /* O TETO DE EIXOS (dono, 13/10/2026: "pode ter até 8 eixos agora"): a
     fundação de eixo novo mora dentro do `TO.eixos.eventosDoDia` do jogo,
     e o protótipo não mexe no código dele. Por fora: se a fundação do dia
     deixou o país com mais de 8 eixos ativos, o eixo recém-nascido é
     desfeito na hora — sai da lista e do histórico, e o nome volta pra
     lista de nomes. As relações que o nascimento já tinha subido ficam:
     o grupo continua amigo, só não virou eixo. */
  const ativosNoPais = (E, p) => X().lista(E).filter(x => !x.dissolvido && x.membros.length >= 2 &&
    pais(M().torcida(x.membros[0])) === p).length;
  function travarFundacao(){
    const Xm = TO.eixos;
    if(!Xm || Xm._tetoInfluencia) return;
    const orig = Xm.eventosDoDia;
    Xm.eventosDoDia = function(E, forcar){
      const evs = orig.apply(this, arguments) || [];
      try{
        const Xc = Xm.caixas(E);
        for(const ev of evs.slice()){
          if(ev.tipo !== 'fundou') continue;
          const x = Xm.eixo(E, ev.eixo); if(!x) continue;
          const p = pais(M().torcida(x.membros[0]));
          if(ativosNoPais(E, p) <= EIXOS_MAX) continue;
          Xc.lista = Xc.lista.filter(y => y !== x);
          Xc.historico = Xc.historico.filter(h => h.eixo !== x.id);
          Xc.nomesUsados = (Xc.nomesUsados || []).filter(n => n !== x.nome);
          evs.splice(evs.indexOf(ev), 1);
          const i = I(E); if(i) i.barradas = (i.barradas || 0) + 1;
        }
      }catch(e){ console.warn('[influência] teto', e); }
      return evs;
    };
    Xm._tetoInfluencia = true;
  }

  function registrar(){
    if(!TO.ui || !TO.ui.registrarPagina) return false;
    if(TO.icones && TO.icones.todos && !TO.icones.todos.influencia)
      TO.icones.todos.influencia = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+
        '<circle cx="12" cy="12" r="2"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 16.2a6 6 0 0 0 0-8.4"/><path d="M4.9 4.9a10 10 0 0 0 0 14.2M19.1 19.1a10 10 0 0 0 0-14.2"/></svg>';
    TO.ui.registrarPagina({id:'influencia', rot:'Influência', ic:'influencia', antes:'jogo', pintar:pintarPagina});
    return true;
  }
  function iniciar(){
    if(!TO.estado || !TO.eixos || !TO.relacoes){ return setTimeout(iniciar, 300); }
    registrar();
    travarFundacao();
    ST().aoFecharSemana && ST().aoFecharSemana((fecho, E) => {
      try{ E = E || Ev(); if(E && E.torcida){ semana(E); if(TO.ui && TO.ui.painelAberto && TO.ui.painelAberto() === 'influencia') repintar(); } }
      catch(e){ console.warn('[influência] semana', e); }
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();

  /* pra quem testa */
  TO.influencia = {I, semana, apoioDe, piBase, bandeiraDe, quadroDosEixos, aliadasNossas, alternarAlvo, sair,
                   abrir: () => TO.ui && TO.ui.abrirPainel('influencia'),
                   ativosNoPais, REGUA:{EIXOS_MAX, POTENCIAS, MULT_POTENCIA, GANHO, BASE_CASA, INCLINA, ENTRAR_MIN, TRAICAO, ALVOS_IA, ALVOS_NOSSOS}};
})();
