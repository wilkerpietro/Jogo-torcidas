/* =========================================================
   RELAÇÕES — o único termômetro entre torcidas
   ---------------------------------------------------------
   O indicador de tensão foi removido de vez: tudo que antes
   escalava por tensão agora se baseia na RELAÇÃO (−100 a
   +100). Hostilidade derruba a relação; a semana sem briga
   deixa a relação voltar devagar pro valor natural do grafo.

   Este módulo também carrega a vida econômica das outras
   torcidas: caixa, sede, bar, loja, subsede e arquétipo — a
   mesma tabela de contas que o jogador paga.
   ========================================================= */
window.TO = window.TO || {};

TO.relacoes = (function(){
  const U = TO.util;
  const M = () => TO.mundo;

  /* -------------------------------------------------------
     A ESCALA — os cortes saem de statusDoValor (mundo.js):
     ≤ −70 Maior Rival · < −15 Rival · < 20 Neutro ·
     < 70 Aliado · ≥ 70 Irmandade
     ------------------------------------------------------- */
  const HOSTIL  = -15;   // daqui pra baixo há risco de briga
  const QUENTE  = -55;   // daqui pra baixo o rival vem sozinho
  const ALIADO  =  45;   // daqui pra cima é aliado de verdade

  const nivel = (E, id) => (E.relacoes||{})[id] !== undefined
    ? E.relacoes[id]
    : M().valorInicial(M().relacaoBase(E.torcida.id, id));

  /* hostilidade entre nós e outra torcida: derruba a relação.
     `quanto` positivo = briga (afasta); negativo = gesto de paz. */
  function hostilidade(E, id, quanto){
    E.relacoes = E.relacoes || {};
    const antes = nivel(E, id);
    E.relacoes[id] = U.limitar(antes - quanto, -100, 100);
    /* a convivência conta a partir da última hostilidade */
    if(quanto > 0) (E.marcaHostil = E.marcaHostil || {})[id] = semanaAbs(E);
    return E.relacoes[id] - antes;
  }

  /* ajuda registrada (escolta, recepção, reunião): zera o relógio da
     indiferença da convivência */
  function marcarAjuda(E, id){
    if(id) (E.marcaAjuda = E.marcaAjuda || {})[id] = semanaAbs(E);
  }

  /* =======================================================
     A SEMANA DAS OUTRAS TORCIDAS (item 24 — mantido)
     Cada uma tem caixa, sede com nível, bar, loja, subsede e
     paga a tabela do GDD. O teto de membros é o da sede; o
     bolo da praça limita o crescimento.
     ======================================================= */
  const MENSALIDADE = 0.50*20 + 0.30*50 + 0.15*100 + 0.05*100;   // R$ 45
  const SEM = 1/4;

  const P = () => TO.patrimonio;
  const FIN = () => TO.financeiro;

  const ARQUETIPOS = {
    agressiva:   {compra:['bar'],                  reserva:1.00, briga:1.6},
    fanatica:    {compra:['bar','subsede'],        reserva:1.10, briga:1.0},
    empresaria:  {compra:['loja','bar','subsede'], reserva:1.25, briga:0.7},
    diplomatica: {compra:['loja','subsede'],       reserva:1.40, briga:0.4},
    tradicional: {compra:['bar','loja'],           reserva:1.70, briga:0.8}
  };
  const NOMES_ARQ = Object.keys(ARQUETIPOS);

  function mundo(E){
    if(E.mundoTorcidas) return E.mundoTorcidas;
    E.mundoTorcidas = {};
    for(const o of M().jogaveis()){
      if(o.id === E.torcida.id) continue;
      const membros = o.membros || 20;
      const sede = TO.membros.nivelQueCabe(membros, (o.cargos||{}).diretoria || 0);
      E.mundoTorcidas[o.id] = {
        membros, sede,
        piso: membros,
        caixa: (o.saldo || 200) * 4,
        moral: 12,
        prestigio: U.limitar(Math.round((o.prestigio || 15)/5), 0, 20),
        bares:[{nivel:1}], lojas:[], subsedes:0, fabrica:false,
        vermelho:0,
        mult: multDaSede(o),
        pool: poolDaPraca(o),
        irmas: M().torcidasEm(o.mapa)
                  .filter(x=>x.clubeId===o.clubeId && x.id!==o.id && !x.incompleta)
                  .map(x=>x.id),
        arq: NOMES_ARQ[TO.mapa.hash(o.id + '|arq') % NOMES_ARQ.length],
        ousadia: U.limitar((o.poder || 60)/260 + U.entre(-0.15, 0.15), 0.05, 1)
      };
    }
    return E.mundoTorcidas;
  }

  function multDaSede(o){
    const b = M().bairroDaSede(o);
    return b ? M().multiplicador(b) : 1.0;
  }

  const POR_MIL = 0.55;
  function poolDaPraca(o){
    const base = M().baseDeRecrutamento(o.mapa, o.clubeId, () => 0);
    const bolo = base ? Math.round(base*POR_MIL) : 500;
    const jaTem = M().torcidasEm(o.mapa)
      .filter(x=>x.clubeId===o.clubeId && !x.incompleta)
      .reduce((s,x)=>s+(x.membros||20), 0);
    return Math.max(bolo, jaTem);
  }

  function balanco(t){
    const R = FIN().RECEITA, MAN = FIN().MANUT, fab = P().FABRICA;
    let rec = t.membros * MENSALIDADE;
    for(const b of t.bares) rec += R.bar[b.nivel] * t.mult;
    for(const l of t.lojas) rec += R.loja[l.nivel] * t.mult * (t.fabrica ? fab.multLoja : 1);
    rec += t.subsedes * R.subsede * t.mult;

    let des = FIN().MANUT_SEDE[t.sede];
    for(const b of t.bares) des += MAN.bar[b.nivel];
    for(const l of t.lojas) des += MAN.loja[l.nivel]
                                 + R.loja[l.nivel]*FIN().INSUMO*(t.fabrica ? 1-fab.corteInsumo : 1);
    des += t.subsedes * MAN.subsede;
    return {rec, des, saldo:rec - des};
  }

  function espacoDaPraca(E, t){
    const m = E.mundoTorcidas;
    let ocupado = 0;
    for(const ir of t.irmas)
      ocupado += m[ir] ? m[ir].membros
               : (ir === E.torcida.id ? E.membros.length : 0);
    return Math.max(t.piso, t.pool - ocupado);
  }

  const tetoDe = (E, t) =>
    Math.min(TO.membros.SEDE[t.sede].membros, espacoDaPraca(E, t));

  function proximaCompra(E, t, id){
    const cfgArq = ARQUETIPOS[t.arq];
    const espaco = espacoDaPraca(E, t);
    const teto = Math.min(TO.membros.SEDE[t.sede].membros, espaco);
    if(t.membros >= teto * 0.9 && P().SEDE[t.sede+1]
       && TO.membros.SEDE[t.sede].membros < espaco)
      return {tipo:'sede', custo:P().SEDE[t.sede+1].custo};

    for(const tipo of cfgArq.compra){
      const lim = P().TETO[tipo][t.sede];
      const cfg = P().PONTO[tipo];
      const lista = tipo==='subsede' ? {length:t.subsedes} : t[cfg.plural];
      if(lista.length < lim.qtd) return {tipo, custo:cfg.compra};
      if(tipo !== 'subsede'){
        const alvo = t[cfg.plural].filter(x=>cfg.ampliar[x.nivel] && x.nivel+1 <= lim.nivel)
                                  .sort((a,b)=>a.nivel-b.nivel)[0];
        if(alvo) return {tipo:'ampliar:'+tipo, custo:cfg.ampliar[alvo.nivel], alvo};
      }
    }
    if(!t.fabrica && t.sede >= P().FABRICA.sede)
      return {tipo:'fabrica', custo:P().FABRICA.custo};
    return elencoAlvo(E, id);
  }

  let _mediaDiv = null, _mediaAno = null;
  function mediaDaDivisao(E, div){
    if(_mediaAno !== E.data.ano){ _mediaDiv = {}; _mediaAno = E.data.ano; }
    if(_mediaDiv[div] != null) return _mediaDiv[div];
    const C = TO.competicoes;
    let soma = 0, n = 0;
    for(const t of M().todosTimes){
      if(C.divisaoDe(E, t) !== div) continue;
      soma += C.forcaDe(E, t.id); n++;
    }
    return (_mediaDiv[div] = n ? soma/n : 0);
  }

  function elencoAlvo(E, id){
    const C = TO.competicoes, o = M().torcida(id);
    if(!o || !o.clubeId) return null;
    const time = M().time(o.clubeId);
    if(!time) return null;
    if(C.forcaDe(E, o.clubeId) >= mediaDaDivisao(E, C.divisaoDe(E, time)))
      return null;
    return {tipo:'elenco', clube:o.clubeId, custo:C.custoDoPonto(E, o.clubeId)};
  }

  function economiaDelas(E){
    const m = mundo(E);
    for(const id of Object.keys(m)){
      const t = m[id];
      const b = balanco(t);
      t.caixa += Math.round(b.saldo * SEM);

      if(t.caixa < 0){
        t.vermelho++;
        if(t.vermelho >= 2){
          t.membros = Math.max(8, t.membros - Math.ceil(t.membros*0.03));
          t.moral = U.limitar(t.moral - 0.4, 0, 20);
        }
        continue;
      }
      t.vermelho = 0;

      const compra = proximaCompra(E, t, id);
      if(compra && t.caixa >= compra.custo * ARQUETIPOS[t.arq].reserva){
        t.caixa -= compra.custo;
        if(compra.tipo === 'sede') t.sede++;
        else if(compra.tipo === 'fabrica') t.fabrica = true;
        else if(compra.tipo === 'subsede') t.subsedes++;
        else if(compra.tipo === 'elenco'){
          E.investimento = E.investimento || {};
          E.investimento[compra.clube] = (E.investimento[compra.clube] || 0) + 1;
          TO.competicoes.usarSave(E);
        }
        else if(compra.tipo.startsWith('ampliar:')) compra.alvo.nivel++;
        else t[P().PONTO[compra.tipo].plural].push({nivel:1});
        continue;
      }

      const teto = tetoDe(E, t);
      if(t.membros < teto && t.caixa > 2000 && U.rng() < 0.18){
        const n = Math.min(U.inteiro(1,2), teto - t.membros);
        t.membros += n;
        t.caixa -= n * 5;
      }

      if(!compra){
        const cofre = b.des * 12;
        if(t.caixa > cofre)
          t.caixa -= Math.round((t.caixa - cofre) * 0.06 * ARQUETIPOS[t.arq].briga);
      }
    }
  }

  /* =======================================================
     RELAÇÃO ENTRE AS OUTRAS TORCIDAS
     Só o valor: nasce do grafo e volta devagar pra ele. Sem
     noticiário próprio — a briga do mundo entra no jogo pelo
     que acontece nas praças em dia de jogo.
     ======================================================= */
  const chaveDe = (a,b) => a < b ? a+'|'+b : b+'|'+a;

  function relacaoDelas(E, a, b){
    E.relacoesDelas = E.relacoesDelas || {};
    const ch = chaveDe(a,b);
    if(E.relacoesDelas[ch] === undefined)
      E.relacoesDelas[ch] = M().valorInicial(M().relacaoBase(a, b));
    return E.relacoesDelas[ch];
  }
  function moverRelacao(E, a, b, quanto){
    const ch = chaveDe(a,b);
    relacaoDelas(E, a, b);
    E.relacoesDelas[ch] = U.limitar(E.relacoesDelas[ch] + quanto, -100, 100);
  }

  /* mexer num indicador delas devolve o delta aplicado — é o número
     que a linha de consequência mostra */
  function mover(E, id, ind, quanto){
    const t = (E.mundoTorcidas||{})[id];
    if(!t || !quanto) return 0;
    const antes = t[ind] || 0;
    t[ind] = U.limitar(antes + quanto, 0, 20);
    return Math.round((t[ind] - antes)*100)/100;
  }
  const indicadoresDe = (E, id) => (E.mundoTorcidas||{})[id] || null;

  const semanaAbs = E => (E.data.ano - 2026)*52 + E.data.semana;

  /* =======================================================
     O QUE ELAS FAZEM CONOSCO
     Relação muito ruim é convite: quanto mais funda, maior a
     chance de a semana trazer um ataque-surpresa — no bar ou
     loja em dia comum, na concentração em dia de jogo em
     casa, na pista a caminho do estádio, ou na estrada se há
     caravana. Só ataca quem pode nos alcançar: torcida da
     nossa praça, ou que está na nossa cidade nesta semana.
     ======================================================= */
  /* a emboscada na estrada não sai daqui: ela é dos rivais da ROTA da
     caravana (planejamento.emboscadaDaRota). E o ataque ao BAR também
     não: ele virou evento do CALENDÁRIO DO TRIMESTRE (decisão do autor
     — estava caindo 2x por mês). Aqui só ficam as surpresas do dia de
     jogo em casa. */
  const ALVOS = [
    {id:'concentracao', peso:2, cena:'praca'},      // dia de jogo em casa
    {id:'pista',        peso:2, cena:'rua'}         // a caminho do estádio
  ];

  function diaDoAtaque(E, id){
    const semente = `${E.data.ano}|${E.data.semana}|${id}`;
    let h = 0;
    for(let i=0;i<semente.length;i++) h = (h*31 + semente.charCodeAt(i)) >>> 0;
    return 1 + (h % 7);
  }

  /* quem pode chegar até nós esta semana */
  function alcanca(E, id){
    const o = M().torcida(id);
    if(!o) return false;
    if(o.mapa === E.torcida.mapa) return true;               // mesma praça
    if(TO.praca && TO.praca.naRuaEm){                        // visitante na cidade
      for(let dia=1; dia<=7; dia++)
        if(TO.praca.naRuaEm(E, dia).some(x=>x.id===id)) return true;
    }
    return false;
  }

  function ataquesContraNos(E){
    const fora = [];
    if(E.ataqueMarcado && !E.ataqueMarcado.resolvido &&
       E.ataqueMarcado.semana === E.data.semana) return fora;
    for(const o of M().jogaveis()){
      if(o.id === E.torcida.id || o.incompleta) continue;
      const r = nivel(E, o.id);
      if(r > QUENTE) continue;
      if(M().saoIrmas && M().saoIrmas(E.torcida.id, o.id)) continue;
      if(!alcanca(E, o.id)) continue;
      const t = (E.mundoTorcidas||{})[o.id];
      /* ATAQUE DE NANICA NÃO EXISTE (decisão do dono, 17/08/2026):
         torcida com menos da metade do nosso efetivo não vem — a cena
         abria e acabava na hora, com eles correndo por minoria. O
         contrário vale: efetivo muito maior que o nosso ataca à
         vontade. */
      const vivoDeles = (t && t.membros) || o.membros || 0;
      if(vivoDeles < E.membros.length * 0.5) continue;
      const briga = t ? ARQUETIPOS[t.arq].briga : 1;
      /* de −55 pra baixo a chance cresce; em −100 com arquétipo
         agressivo é quase um ataque por mês */
      const chance = ((QUENTE - r)/(100 + QUENTE)) * 0.28 * briga;
      if(U.rng() > chance) continue;

      /* concentração e pista só existem em semana de jogo em casa */
      const jogoEmCasa  = E.proximoJogo && E.proximoJogo.casa;
      if(!jogoEmCasa) continue;
      const sorteio = [];
      for(const a of ALVOS) for(let i=0;i<a.peso;i++) sorteio.push(a);
      const alvo = U.escolher(sorteio);
      const dia = E.proximoJogo.dia || 6;
      E.ataqueMarcado = {torcida:o.id, nome:o.nome, alvo:alvo.id,
                         cena:alvo.cena,
                         ano:E.data.ano, semana:E.data.semana, dia};
      hostilidade(E, o.id, 6);
      fora.push({id:o.id, torcida:o.nome, alvo:alvo.id, dia});
      break;              // um ataque-surpresa por semana já é guerra
    }
    return fora;
  }

  /* =======================================================
     O CALENDÁRIO DO TRIMESTRE (decisão do autor)
     A cada 13 semanas: 2 a 4 TRETAS MARCADAS em rua e 1 a 2
     ataques ao nosso bar. Agendado por hash — o mesmo bloco dá
     sempre o mesmo calendário — e sempre FORA de dia de jogo
     do clube e de dia de caravana.
     ======================================================= */
  const SEMANAS_TRI = 13;

  function eventosDoTrimestre(E){
    const H = TO.mapa.hash;
    const bloco = Math.floor((semanaAbs(E) - 1) / SEMANAS_TRI);
    const chave = `tri|${bloco}|${E.torcida.id}`;
    const nTreta = 2 + H(chave + '|nt') % 3;      // 2 a 4
    const nBar   = 1 + H(chave + '|nb') % 2;      // 1 a 2
    const fora = [], usados = new Set();
    const poe = (tipo, i)=>{
      let d = H(`${chave}|${tipo}${i}`) % (SEMANAS_TRI * 7);
      while(usados.has(d)) d = (d + 11) % (SEMANAS_TRI * 7);
      usados.add(d);
      fora.push({tipo, chave:`${chave}|${tipo}${i}`,
                 semanaAbs: bloco*SEMANAS_TRI + Math.floor(d/7) + 1,
                 dia: (d % 7) + 1});
    };
    for(let i=0;i<nTreta;i++) poe('treta', i);
    for(let i=0;i<nBar;i++)   poe('bar', i);
    return fora;
  }

  /* dia comum: sem jogo do nosso clube e sem caravana na estrada */
  function diaComum(E, dia){
    const meu = M().time(E.torcida.clubeId);
    if(meu && TO.competicoes.jogosDaSemana(E, meu.id, E.data.semana)
                .some(j=>j.dia === dia)) return false;
    return !TO.financeiro.diasDeCaravana(E).includes(dia);
  }

  /* o evento do trimestre que cai HOJE, já deslocado pra fora de dia
     de jogo — o deslocamento é determinístico, então o mesmo dia
     reaberto responde igual */
  function eventoDeHoje(E){
    const agora = semanaAbs(E);
    for(const ev of eventosDoTrimestre(E)){
      if(ev.semanaAbs !== agora) continue;
      let dia = ev.dia;
      for(let k=0; k<7 && !diaComum(E, dia); k++) dia = (dia % 7) + 1;
      if(dia === E.data.dia) return Object.assign({}, ev, {dia});
    }
    return null;
  }

  /* quem marca treta e quem vem no bar: a maior rival declarada da
     praça; sem ela, a pior relação local */
  function rivalDaPraca(E, semente){
    const nossa = M().torcida(E.torcida.id) || {};
    const locais = M().torcidasEm(E.torcida.mapa).filter(o=>
      o.id !== E.torcida.id && !o.incompleta &&
      !(M().saoIrmas && M().saoIrmas(E.torcida.id, o.id)));
    const vivo = id => ((E.mundoTorcidas||{})[id] || {}).membros
                     || (M().torcida(id)||{}).membros || 0;
    const mrs = locais.filter(o=>(nossa.maioresRivais||[]).includes(o.id))
      .sort((a,b)=>vivo(b.id) - vivo(a.id));
    const hostis = locais.map(o=>({o, rel: nivel(E, o.id)}))
      .filter(x=>x.rel <= -15)
      .sort((a,b)=>a.rel - b.rel || vivo(b.o.id) - vivo(a.o.id));
    /* COM SEMENTE (a treta marcada): sorteia entre TODAS as hostis da
       praça, maior rival e nanica no mesmo balde — treta é de efetivo
       idêntico, então tamanho não pesa (decisão do dono, 17/08/2026).
       O hash mantém o dia determinístico. */
    if(semente){
      const balde = [...new Set(mrs.concat(hostis.map(x=>x.o)))];
      if(!balde.length) return null;
      return balde[TO.mapa.hash(`${semente}|rival`) % balde.length];
    }
    /* sem semente (o bar): a MAIOR rival declarada da praça — pegar a
       primeira da lista punha a Gaviões brigando com a nanica do bairro */
    if(mrs.length) return mrs[0];
    return hostis.length ? hostis[0].o : null;
  }

  function ataqueDeHoje(E){
    const a = E.ataqueMarcado;
    if(!a || a.resolvido) return null;
    return (a.ano === E.data.ano && a.semana === E.data.semana &&
            a.dia === E.data.dia) ? a : null;
  }

  /* o que o clube faz em campo move a moral da torcida dele */
  const CONQUISTA_MORAL = {campeao:2.5, vice:0.8, acesso:2, rebaixado:-3};
  function conquistaDoClube(E, clubeId, tipo){
    const d = CONQUISTA_MORAL[tipo];
    if(!d || !clubeId) return [];
    mundo(E);
    const fora = [];
    for(const o of M().torcidasDe(clubeId)){
      if(o.id === E.torcida.id) continue;
      const delta = mover(E, o.id, 'moral', d);
      if(delta) fora.push({id:o.id, nome:o.nome, delta});
    }
    return fora;
  }

  /* =======================================================
     A SEMANA ESFRIA: a relação volta devagar pro valor
     natural do grafo — mágoa de briga passa, favor também.
     ======================================================= */
  function esfriar(E){
    for(const id of Object.keys(E.relacoes||{})){
      const base = M().valorInicial(M().relacaoBase(E.torcida.id, id));
      const atual = E.relacoes[id];
      if(Math.abs(base - atual) < 2) continue;
      E.relacoes[id] = U.limitar(atual + (base - atual)*0.05, -100, 100);
    }
    for(const ch of Object.keys(E.relacoesDelas||{})){
      const [a, b] = ch.split('|');
      const base = M().valorInicial(M().relacaoBase(a, b));
      const atual = E.relacoesDelas[ch];
      if(Math.abs(base - atual) < 2) continue;
      E.relacoesDelas[ch] = U.limitar(atual + (base - atual)*0.05, -100, 100);
    }
  }

  /* =======================================================
     CONVIVÊNCIA (decisão do dono, 17/08/2026)
     Mês (4 semanas) sem hostilidade entre nós e uma torcida
     melhora a relação em +1; dois meses (8 semanas) sem
     nenhuma ajuda pioram em −1. O relógio de cada torcida
     zera na última briga (marcaHostil, via hostilidade) e na
     última ajuda (marcaAjuda: escolta, recepção, reunião).
     ======================================================= */
  function convivencia(E){
    const sa = semanaAbs(E);
    E.marcaHostil = E.marcaHostil || {};
    E.marcaAjuda  = E.marcaAjuda  || {};
    E.convivenciaDesde = E.convivenciaDesde || sa;
    for(const o of M().jogaveis()){
      if(o.id === E.torcida.id || o.incompleta) continue;
      const h0 = E.marcaHostil[o.id] || E.convivenciaDesde;
      if(sa - h0 >= 4){
        E.relacoes[o.id] = U.limitar(nivel(E, o.id) + 1, -100, 100);
        E.marcaHostil[o.id] = h0 + 4;      // um +1 por mês cheio de paz
      }
      const a0 = E.marcaAjuda[o.id] || E.convivenciaDesde;
      if(sa - a0 >= 8){
        E.relacoes[o.id] = U.limitar(nivel(E, o.id) - 1, -100, 100);
        E.marcaAjuda[o.id] = a0 + 8;       // um −1 a cada dois meses secos
      }
    }
  }

  /* =======================================================
     O RANKING DE TORCIDAS (decisão do dono, 17/08/2026)
     Pontos = (membros + prestígio×2) × média de força e defesa
     dos membros. O prestígio entra na escala de 0 a 100 (peso
     2); a média das IAs sai da MESMA régua que gera as fichas
     delas nas brigas (cargo + bônus de poder), sem sorteio —
     é a esperança da distribuição, estável de um dia pro outro.
     ======================================================= */
  function mediaDeFichaGerada(o, membrosVivos){
    const CARGOS = TO.membros.CARGOS;
    const tamanho = Math.min(Math.max(membrosVivos || o.membros || 60, 1), 250);
    const plano = TO.membros.planoDeCargos(tamanho, o.cargos);
    const peso = U.limitar((o.poder || 60)/250, 0, 1);
    const bonus = Math.round(peso*3);
    const BASE = {novato:1, componente:5, frente:10, diretoria:14};
    let soma = 0, n = 0;
    for(const [cargo, q] of plano){
      const teto = (CARGOS[cargo] || CARGOS.novato).teto;
      soma += q * Math.min(teto, (BASE[cargo]||1) + 1.5 + bonus);
      n += q;
    }
    return n ? soma/n : 1;
  }

  /* =======================================================
     AS BRIGAS ENTRE AS IAs (decisão do dono, 17/08/2026)
     O mundo briga sozinho, mas só onde faz sentido: a briga
     nasce de um JOGO — torcida metida no jogo se pega com a
     torcida do clube adversário ou com hostil local da cidade
     que recebe a partida (Mancha em Flamengo × Palmeiras no
     Rio pode pegar a Jovem Fla ou a Young Flu). Feridos ficam
     30 dias fora; presos, de 15 a 90. Quem vence leva
     prestígio e moral; quem perde, devolve. Tudo vai pro
     registro que a aba Brigas das Notícias mostra — e mexe no
     ranking, porque lá contam os DISPONÍVEIS.
     ======================================================= */
  const CHANCE_BRIGA_JOGO = 0.18;
  function foraDeCombate(E, id){
    const t = (E.mundoTorcidas||{})[id];
    if(!t) return 0;
    const hoje = E.data.absoluto || 0;
    t.feridosIA = (t.feridosIA||[]).filter(x=>x.ate > hoje);
    t.presosIA  = (t.presosIA ||[]).filter(x=>x.ate > hoje);
    return t.feridosIA.reduce((s,x)=>s+x.n, 0) +
           t.presosIA.reduce((s,x)=>s+x.n, 0);
  }
  function disponiveisIA(E, id){
    const t = (E.mundoTorcidas||{})[id];
    const total = t ? t.membros : ((M().torcida(id)||{}).membros || 0);
    return Math.max(0, Math.round(total) - foraDeCombate(E, id));
  }

  function brigaIA(E, a, b, cidade, jogoRot){
    const abs = E.data.absoluto || 0;
    const dispA = disponiveisIA(E, a.id), dispB = disponiveisIA(E, b.id);
    if(dispA < 8 || dispB < 8) return null;
    /* quem é da cidade bota mais gente na rua; quem viajou traz caravana */
    const bonde = (o, disp) => Math.max(4, Math.round(disp *
      (o.mapa === cidade ? U.entre(0.18, 0.35) : U.entre(0.08, 0.18))));
    const nA = Math.min(dispA, bonde(a, dispA));
    const nB = Math.min(dispB, bonde(b, dispB));
    /* a mesma régua das cenas: efetivo × ficha média, com o acaso da rua */
    const pA = nA * mediaDeFichaGerada(a, dispA) * U.entre(0.85, 1.15);
    const pB = nB * mediaDeFichaGerada(b, dispB) * U.entre(0.85, 1.15);
    const ganhouA = pA >= pB;
    const baixas = (o, n, perdeu) => {
      const t = (E.mundoTorcidas||{})[o.id];
      /* o perdedor sai carregado (pedido do dono): um quarto a dois
         quintos do bonde dele no chão, e a PM leva mais dos que
         apanharam */
      const feridos = Math.round(n * (perdeu ? U.entre(0.25, 0.40)
                                             : U.entre(0.08, 0.16)));
      const presos  = Math.round(n * (perdeu ? U.entre(0.05, 0.12)
                                             : U.entre(0.01, 0.04)));
      if(t){
        if(feridos) (t.feridosIA = t.feridosIA||[])
          .push({n:feridos, ate: abs + 30});
        if(presos) (t.presosIA = t.presosIA||[])
          .push({n:presos, ate: abs + U.inteiro(15, 90)});
      }
      return {feridos, presos};
    };
    const bxA = baixas(a, nA, !ganhouA);
    const bxB = baixas(b, nB, ganhouA);
    /* O PRESTÍGIO ACOMPANHA A BRIGA (decisão do dono, 17/08/2026):
       briga grande move mais, e zebra — vencer em menor número —
       move mais ainda. Na régua de 0 a 100: 1 + envolvidos/25, +2 de
       zebra, teto 8. O vencedor leva, o perdedor devolve; a relação
       entre os dois azeda, com o esfriar semanal puxando de volta. */
    const zebra = ganhouA ? nA < nB : nB < nA;
    const swingDisplay = U.limitar(
      Math.round(1 + (nA + nB)/25) + (zebra ? 2 : 0), 1, 8);
    const swing = swingDisplay/5;
    mover(E, ganhouA ? a.id : b.id, 'prestigio', swing);
    mover(E, ganhouA ? a.id : b.id, 'moral', 0.6);
    mover(E, ganhouA ? b.id : a.id, 'prestigio', -swing);
    mover(E, ganhouA ? b.id : a.id, 'moral', -0.6);
    moverRelacao(E, a.id, b.id, -8);
    const reg = {
      ano: E.data.ano, semana: E.data.semana, dia: E.data.dia,
      cidade: (M().cidade(cidade)||{}).nome || cidade, jogo: jogoRot,
      a: {id:a.id, nome:a.nome, n:nA, feridos:bxA.feridos, presos:bxA.presos},
      b: {id:b.id, nome:b.nome, n:nB, feridos:bxB.feridos, presos:bxB.presos},
      vencedor: ganhouA ? a.nome : b.nome,
      prestigio: swingDisplay
    };
    E.brigasIA = E.brigasIA || [];
    E.brigasIA.unshift(reg);
    if(E.brigasIA.length > 200) E.brigasIA.pop();
    return reg;
  }

  function brigasDeHoje(E, jogos){
    mundo(E);
    const fora = [];
    for(const j of (jogos||[])){
      if(U.rng() > CHANCE_BRIGA_JOGO) continue;
      const casa = M().time(j.c), vis = M().time(j.f);
      if(!casa || !vis) continue;
      const cidade = casa.mapa;
      const doJogo = new Set(
        [...M().torcidasDe(casa.id), ...M().torcidasDe(vis.id)].map(o=>o.id));
      const cands = [...new Set([
        ...M().torcidasDe(casa.id), ...M().torcidasDe(vis.id),
        ...M().torcidasEm(cidade)
      ])].filter(o=>!o.incompleta && o.id !== E.torcida.id);
      const pares = [];
      for(let x=0;x<cands.length;x++) for(let y=x+1;y<cands.length;y++){
        const a = cands[x], b = cands[y];
        if(a.clubeId === b.clubeId) continue;
        if(M().saoIrmas && M().saoIrmas(a.id, b.id)) continue;
        /* pelo menos um dos dois é do jogo; o outro se ALCANÇA — é do
           jogo também, ou é da cidade que recebe a partida */
        const aJogo = doJogo.has(a.id), bJogo = doJogo.has(b.id);
        if(!aJogo && !bJogo) continue;
        if(!(aJogo || a.mapa === cidade) || !(bJogo || b.mapa === cidade))
          continue;
        /* e o par tem de ter MOTIVO: relação viva azeda ou rivalidade
           declarada na fonte */
        if(relacaoDelas(E, a.id, b.id) > -15){
          const base = M().relacaoBase(a.id, b.id);
          if(base !== 'Rival' && base !== 'Maior Rival') continue;
        }
        pares.push([a, b]);
      }
      if(!pares.length) continue;
      const [a, b] = pares[Math.floor(U.rng()*pares.length)];
      const r = brigaIA(E, a, b, cidade, `${casa.nome} × ${vis.nome}`);
      if(r) fora.push(r);
    }
    return fora;
  }

  let cacheRanking = {chave:'', lista:null};
  function ranking(E){
    const chave = `${E.data.ano}|${semanaAbs(E)}|${E.data.dia}|`+
      `${E.membros.length}|${Math.round(E.indicadores.prestigio*100)}|`+
      `${(E.brigasIA||[]).length}`;
    if(cacheRanking.chave === chave) return cacheRanking.lista;
    mundo(E);
    const fora = [];
    for(const o of M().jogaveis()){
      if(o.incompleta) continue;
      if(o.id === E.torcida.id){
        const nT = E.membros.length || 1;
        const mf = E.membros.reduce((s,m)=>s+m.forca, 0)/nT;
        const md = E.membros.reduce((s,m)=>s+m.defesa, 0)/nT;
        const prest = Math.round(E.indicadores.prestigio*5);
        const forca = (mf+md)/2;
        /* contam os DISPONÍVEIS: ferido e preso não somam ponto — é o
           que faz briga (nossa e das IAs) mexer no ranking */
        const n = E.membros.filter(m=>!m.ferido && !m.preso).length;
        fora.push({id:o.id, nome:o.nome, nossa:true,
                   membros:n, prestigio:prest, forca,
                   pontos:Math.round((n + prest*2)*forca)});
      } else {
        const viva = (E.mundoTorcidas||{})[o.id] || {};
        const n = disponiveisIA(E, o.id);
        const prest = Math.round((viva.prestigio !== undefined
          ? viva.prestigio : U.limitar((o.prestigio||15)/5, 0, 20))*5);
        const forca = mediaDeFichaGerada(o, viva.membros || o.membros || n);
        fora.push({id:o.id, nome:o.nome, nossa:false,
                   membros:n, prestigio:prest, forca,
                   pontos:Math.round((n + prest*2)*forca)});
      }
    }
    fora.sort((a,b)=>b.pontos - a.pontos || b.membros - a.membros ||
                     (a.nome < b.nome ? -1 : 1));
    fora.forEach((x,i)=>x.pos = i+1);
    cacheRanking = {chave, lista:fora};
    return fora;
  }
  function posicaoNoRanking(E){
    const x = ranking(E).find(v=>v.nossa);
    return x ? x.pos : 0;
  }

  function passarSemana(E){
    mundo(E);
    esfriar(E);
    convivencia(E);
    economiaDelas(E);
    return {ataques: ataquesContraNos(E)};
  }

  /* pra tela de Diplomacia: as relações que fogem do neutro */
  function panorama(E){
    return M().jogaveis()
      .filter(o => o.id !== E.torcida.id && !o.incompleta)
      .map(o => {
        const v = nivel(E, o.id);
        return {id:o.id, nome:o.nome, cores:o.cores||['#666'],
                relacao: Math.round(v), status: M().statusDoValor(v)};
      })
      .filter(x => x.relacao !== 0)
      .sort((a,b) => a.relacao - b.relacao);
  }

  return {HOSTIL, QUENTE, ALIADO, nivel, hostilidade, marcarAjuda,
          ranking, posicaoNoRanking,
          brigasDeHoje, disponiveisIA, foraDeCombate,
          mundo, balanco, ARQUETIPOS, economiaDelas,
          relacaoDelas, moverRelacao, chaveDe,
          mover, indicadoresDe, semanaAbs,
          ataquesContraNos, ataqueDeHoje, diaDoAtaque,
          eventosDoTrimestre, eventoDeHoje, rivalDaPraca, SEMANAS_TRI,
          conquistaDoClube, esfriar, passarSemana, panorama, MENSALIDADE};
})();
