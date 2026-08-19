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
        /* o menu Financeiro inteiro vale pra elas (decisão do dono,
           18/08/2026): ônibus, professor de MMA e estoque de bombas
           são comprados com o caixa delas, como o jogador faz */
        onibus:false, mma:false, bombas:10,
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
    /* ônibus e professor de MMA custam o mesmo que pro jogador:
       R$ 1.500 e R$ 2.000 por mês, aqui na fatia semanal */
    if(t.onibus) des += 350;
    if(t.mma)    des += 460;
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
    /* com o patrimônio de pé, o ônibus é a compra grande que falta —
       mesmo preço do jogador; depois dele o dinheiro vai pro elenco */
    if(!t.onibus) return {tipo:'onibus', custo:100000};
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
      /* save de antes do Financeiro delas: ganha os campos novos */
      if(t.bombas == null){ t.bombas = 10; t.onibus = !!t.onibus; t.mma = !!t.mma; }
      const b = balanco(t);
      t.caixa += Math.round(b.saldo * SEM);

      /* PERDA DE MEMBROS IGUAL À NOSSA (decisão do dono, 18/08/2026):
         caixa no vermelho derruba a MORAL — 1 por semana, a mesma
         régua do nosso fechamento — e ninguém debanda. Membro delas
         só sai de circulação ferido ou preso, e volta. */
      if(t.caixa < 0){
        t.vermelho++;
        t.moral = U.limitar(t.moral - 1, 0, 20);
        /* duas semanas no vermelho e o professor de MMA vai embora —
           é o corte que qualquer diretoria faria primeiro */
        if(t.vermelho >= 2 && t.mma) t.mma = false;
        continue;
      }
      t.vermelho = 0;

      /* professor de MMA: contrata quem tem sobra toda semana e um
         colchão no caixa — o mesmo juízo que o jogador faz */
      if(!t.mma && b.saldo > 1000 && t.caixa > 25000) t.mma = true;

      /* estoque de pirotecnia: repõe um lote de 5 por semana (R$ 600,
         o preço do jogador) até voltar às 10 de praxe */
      if(t.bombas < 10 && t.caixa > 3000){ t.caixa -= 600; t.bombas += 5; }

      const compra = proximaCompra(E, t, id);
      if(compra && t.caixa >= compra.custo * ARQUETIPOS[t.arq].reserva){
        t.caixa -= compra.custo;
        if(compra.tipo === 'sede') t.sede++;
        else if(compra.tipo === 'fabrica') t.fabrica = true;
        else if(compra.tipo === 'onibus') t.onibus = true;
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

      /* o sorteio de 18%/semana saiu: quem recruta agora é o
         expediente diário delas (mundoDia), com o dado do dono */

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

  /* sem `id` é o calendário do jogador; com `id`, o da torcida IA —
     o mesmo sorteio por hash vale pro mundo inteiro */
  function eventosDoTrimestre(E, id){
    const H = TO.mapa.hash;
    const bloco = Math.floor((semanaAbs(E) - 1) / SEMANAS_TRI);
    const chave = `tri|${bloco}|${id || E.torcida.id}`;
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
    /* a janela quente/seca do recrutamento também é delas (decisão do
       dono, 18/08/2026): título e acesso abrem 2 semanas de 40/20;
       rebaixamento fecha o portão por 2 semanas */
    const janela = tipo === 'campeao' || tipo === 'acesso'
      ? {tipo:'titulo', ate: semanaAbs(E) + 2}
      : tipo === 'rebaixado'
      ? {tipo:'rebaixamento', ate: semanaAbs(E) + 2}
      : null;
    const fora = [];
    for(const o of M().torcidasDe(clubeId)){
      if(o.id === E.torcida.id) continue;
      const delta = mover(E, o.id, 'moral', d);
      if(janela){
        const t = (E.mundoTorcidas||{})[o.id];
        if(t) t.janelaIA = janela;
      }
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
     delas nas brigas (só o cargo), sem sorteio — é a esperança
     da distribuição, estável de um dia pro outro.
     ======================================================= */
  function mediaDeFichaGerada(o, membrosVivos, E){
    /* SEM BÔNUS DE PODER (decisão do dono, 18/08/2026): a ficha vem só
       do cargo. O `poder` da fonte dava até +3 por cabeça e cravava as
       gigantes acima de todo mundo por decreto; agora o que separa as
       torcidas na média é a pirâmide de cargos e o tamanho. */
    /* professor de MMA delas (decisão do dono, 18/08/2026): quem paga
       os R$ 2.000 por mês tem gente mais treinada — +1 por cabeça, o
       espelho do treino em dobro que o professor dá pro jogador. */
    const t = E && E.mundoTorcidas && E.mundoTorcidas[o.id];
    const mma = t && t.mma ? 1 : 0;
    const CARGOS = TO.membros.CARGOS;
    const tamanho = Math.min(Math.max(membrosVivos || o.membros || 60, 1), 250);
    const plano = TO.membros.planoDeCargos(tamanho, o.cargos);
    const BASE = {novato:1, componente:5, frente:10, diretoria:14};
    let soma = 0, n = 0;
    for(const [cargo, q] of plano){
      const teto = (CARGOS[cargo] || CARGOS.novato).teto;
      soma += q * Math.min(teto, (BASE[cargo]||1) + 1.5 + mma);
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
     de 5 a 15 dias fora; presos, de 15 a 90. Quem vence leva
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

  /* todo registro passa por aqui: alimenta a aba Brigas, a notícia de
     segunda e o contador que invalida o cache do ranking */
  function registrarBrigaIA(E, reg){
    E.brigasIA = E.brigasIA || [];
    E.brigasIA.unshift(reg);
    if(E.brigasIA.length > 300) E.brigasIA.pop();
    E.brigasIATotal = (E.brigasIATotal || 0) + 1;
    return reg;
  }

  /* BAIXA VINDA DE BRIGA NOSSA (conferência do dono, 18/08/2026): o
     rival que apanha da gente também sai de circulação — ferido 30
     dias fora, preso de 15 a 90 — na mesma régua das brigas entre
     IAs. Antes a mensagem contava os feridos e o efetivo dele
     seguia inteiro. */
  function baixasIA(E, id, feridos, presos){
    const t = mundo(E)[id];
    if(!t) return;
    /* o contador entra na chave do cache do ranking: baixa nossa tem
       de derrubar a posição deles na hora, como a briga de IA já faz */
    E.baixasIASeq = (E.baixasIASeq || 0) + 1;
    const abs = E.data.absoluto || 0;
    if(feridos > 0)
      (t.feridosIA = t.feridosIA||[]).push({n:Math.round(feridos),
                                          ate: abs + U.inteiro(5, 15)});
    if(presos > 0)
      (t.presosIA = t.presosIA||[]).push({n:Math.round(presos),
                                          ate: abs + U.inteiro(15, 90)});
  }

  function brigaIA(E, a, b, cidade, jogoRot, opts){
    opts = opts || {};
    const abs = E.data.absoluto || 0;
    const dispA = disponiveisIA(E, a.id), dispB = disponiveisIA(E, b.id);
    if(dispA < 8 || dispB < 8) return null;
    /* quem é da cidade bota mais gente na rua; quem viajou traz caravana */
    const bonde = (o, disp) => Math.max(4, Math.round(disp *
      (o.mapa === cidade ? U.entre(0.18, 0.35) : U.entre(0.08, 0.18))));
    /* tetos por cena (o bar do mundo usa 60 do atacante × 40 do
       defensor, régua do dono de 18/08/2026) */
    const nA = Math.min(dispA, bonde(a, dispA), opts.tetoA || Infinity);
    const nB = Math.min(dispB, bonde(b, dispB), opts.tetoB || Infinity);
    /* A ESCOLTA DO MUNDO (decisão do dono, 18/08/2026): quem viaja pra
       cidade de um aliado pode ter o anfitrião na briga — o bonde da
       casa entra do lado do hóspede, como a nossa escolta */
    const ajuda = lado => {
      const anf = lado === 'a' ? opts.ajudaA : opts.ajudaB;
      if(!anf) return null;
      const n = Math.max(3, Math.round(disponiveisIA(E, anf.id) * 0.15));
      return {o:anf, n};
    };
    const ajA = ajuda('a'), ajB = ajuda('b');
    /* A RUA TEM ACASO (correção do dono, 18/08/2026): efetivo × ficha
       média diz quem é o FAVORITO, mas o favorito vence 70% — não
       100%. O ±15% antigo nunca virava briga desigual, e Gaviões e
       Raça simplesmente venciam todas; agora 3 em cada 10 o bonde
       menor sai por cima. */
    const pA = nA * mediaDeFichaGerada(a, dispA, E)
      + (ajA ? ajA.n * mediaDeFichaGerada(ajA.o, disponiveisIA(E, ajA.o.id), E) : 0);
    const pB = nB * mediaDeFichaGerada(b, dispB, E)
      + (ajB ? ajB.n * mediaDeFichaGerada(ajB.o, disponiveisIA(E, ajB.o.id), E) : 0);
    const favoritoA = pA === pB ? U.rng() < 0.5 : pA > pB;
    const ganhouA = U.rng() < 0.70 ? favoritoA : !favoritoA;
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
          .push({n:feridos, ate: abs + U.inteiro(5, 15)});
        if(presos) (t.presosIA = t.presosIA||[])
          .push({n:presos, ate: abs + U.inteiro(15, 90)});
      }
      return {feridos, presos};
    };
    const bxA = baixas(a, nA, !ganhouA);
    const bxB = baixas(b, nB, ganhouA);
    /* o anfitrião também sangra e também colhe: baixas na proporção do
       bonde dele, prestígio pra ele se o lado dele venceu (é a mesma
       regra da NOSSA escolta: o prestígio da briga é de quem foi
       ajudado e de quem ajudou, não muda de dono no meio) */
    for(const [aj, doLadoA] of [[ajA, true], [ajB, false]]){
      if(!aj) continue;
      const venceu = doLadoA === ganhouA;
      baixas(aj.o, aj.n, !venceu);
      if(venceu) mover(E, aj.o.id, 'prestigio', 0.2);
      const dono = doLadoA ? a : b, rivalDe = doLadoA ? b : a;
      moverRelacao(E, dono.id, aj.o.id, +4);
      moverRelacao(E, aj.o.id, rivalDe.id, -6);
    }
    /* O PRESTÍGIO ACOMPANHA A BRIGA (decisão do dono, 17/08/2026;
       zebra engordada em 18/08): briga grande move mais, e zebra —
       vencer em menor número — move MUITO mais: +4 na régua de 0 a
       100 e teto 10 (a comum fica no teto 8), e a moral do zebra
       vencedor dobra (+1,2 contra +0,6 da vitória comum). O vencedor
       leva, o perdedor devolve; a relação entre os dois azeda, com o
       esfriar semanal puxando de volta. */
    const zebra = ganhouA ? nA < nB : nB < nA;
    const swingDisplay = U.limitar(
      Math.round(1 + (nA + nB)/25) + (zebra ? 4 : 0), 1, zebra ? 10 : 8);
    const swing = swingDisplay/5;
    mover(E, ganhouA ? a.id : b.id, 'prestigio', swing);
    mover(E, ganhouA ? a.id : b.id, 'moral', zebra ? 1.2 : 0.6);
    mover(E, ganhouA ? b.id : a.id, 'prestigio', -swing);
    mover(E, ganhouA ? b.id : a.id, 'moral', -0.6);
    moverRelacao(E, a.id, b.id, -8);
    const reg = {
      ano: E.data.ano, semana: E.data.semana, dia: E.data.dia,
      cidade: (M().cidade(cidade)||{}).nome || cidade, jogo: jogoRot,
      a: {id:a.id, nome:a.nome, n:nA, feridos:bxA.feridos, presos:bxA.presos},
      b: {id:b.id, nome:b.nome, n:nB, feridos:bxB.feridos, presos:bxB.presos},
      vencedor: ganhouA ? a.nome : b.nome,
      prestigio: swingDisplay,
      ganhouA
    };
    if(ajA) reg.a.ajuda = {nome:ajA.o.nome, n:ajA.n};
    if(ajB) reg.b.ajuda = {nome:ajB.o.nome, n:ajB.n};
    return registrarBrigaIA(E, reg);
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
      /* quem viajou pode estar hospedado num aliado da cidade: metade
         das vezes o anfitrião desce junto (a escolta do mundo) */
      const anfitriaoDe = (o, outro) => {
        if(o.mapa === cidade) return null;
        const anf = M().torcidasEm(cidade).find(x =>
          x.id !== o.id && x.id !== outro.id && !x.incompleta &&
          x.id !== E.torcida.id && x.clubeId !== outro.clubeId &&
          (relacaoDelas(E, o.id, x.id) >= ALIADO ||
           ['Aliado','Irmandade'].includes(M().relacaoBase(o.id, x.id)) ||
           (M().saoIrmas && M().saoIrmas(o.id, x.id))));
        return (anf && U.rng() < 0.5) ? anf : null;
      };
      const r = brigaIA(E, a, b, cidade, `${casa.nome} × ${vis.nome}`,
        {ajudaA: anfitriaoDe(a, b), ajudaB: anfitriaoDe(b, a)});
      if(r) fora.push(r);
    }
    return fora;
  }

  /* =======================================================
     O MUNDO VIVE COMO A GENTE (decisão do dono, 18/08/2026)
     As mecânicas do jogador — menos o olheiro — replicadas pras
     138: cada torcida tem o próprio calendário do trimestre
     (tretas marcadas e ataque ao bar), sofre ataque-surpresa de
     relação fervendo, é emboscada na estrada quando viaja, tem
     escolta de aliado (na brigaIA acima) e roda um Expediente
     da Sede de 3 turnos com o MESMO dado de recrutamento — com
     janela de título/acesso e regime seco de rebaixamento. E a
     perda de membros ficou idêntica à nossa: caixa no vermelho
     derruba MORAL, não membro; membro só sai de circulação
     ferido ou preso, e volta.
     ======================================================= */
  const vivoDe = (E, id) => {
    const t = (E.mundoTorcidas||{})[id];
    return t ? t.membros : ((M().torcida(id)||{}).membros || 0);
  };

  /* as hostis que uma torcida IA alcança na própria praça */
  function hostisLocaisIA(E, o){
    return M().torcidasEm(o.mapa).filter(x =>
      x.id !== o.id && !x.incompleta && x.id !== E.torcida.id &&
      x.clubeId !== o.clubeId &&
      !(M().saoIrmas && M().saoIrmas(o.id, x.id)) &&
      (relacaoDelas(E, o.id, x.id) <= HOSTIL ||
       ['Rival','Maior Rival'].includes(M().relacaoBase(o.id, x.id))));
  }
  /* com semente sorteia entre todas (regra da treta — nanica entra);
     sem semente é a maior, que é quem vem no bar */
  function rivalDaPracaIA(E, o, semente){
    const lista = hostisLocaisIA(E, o);
    if(!lista.length) return null;
    if(semente) return lista[TO.mapa.hash(`${semente}|rv`) % lista.length];
    return lista.sort((x,y)=>vivoDe(E,y.id)-vivoDe(E,x.id))[0];
  }

  /* a TRETA MARCADA delas: efetivos idênticos (5/7/10), a conta do
     dono — prestígio ±1 na régua de 0-100, relação −2, sem dinheiro */
  function tretaIA(E, o, chave){
    const r = rivalDaPracaIA(E, o, chave);
    if(!r) return null;
    const tam = [5, 7, 10][TO.mapa.hash(`${chave}|n`) % 3];
    if(disponiveisIA(E, o.id) < tam || disponiveisIA(E, r.id) < tam)
      return null;
    const abs = E.data.absoluto || 0;
    const pA = tam * mediaDeFichaGerada(o, disponiveisIA(E, o.id), E) * U.entre(0.85, 1.15);
    const pB = tam * mediaDeFichaGerada(r, disponiveisIA(E, r.id), E) * U.entre(0.85, 1.15);
    const ganhouA = pA >= pB;
    const machuca = (id, perdeu) => {
      const t = (E.mundoTorcidas||{})[id];
      const n = Math.round(tam * (perdeu ? U.entre(0.25, 0.45)
                                         : U.entre(0.08, 0.20)));
      if(t && n) (t.feridosIA = t.feridosIA||[]).push({n, ate: abs + U.inteiro(5, 15)});
      return n;
    };
    const fA = machuca(o.id, !ganhouA), fB = machuca(r.id, ganhouA);
    /* régua do dono (18/08/2026): treta paga no mínimo 3 de prestígio
       na régua de 0-100 — 3 no 5×5, 4 no 7×7, 5 no 10×10 */
    const display = tam >= 10 ? 5 : tam >= 7 ? 4 : 3;
    mover(E, ganhouA ? o.id : r.id, 'prestigio',  display/5);
    /* perder a treta custa −1 de prestígio e um tanto de moral
       (preço do dono, 19/08/2026 — a mesma régua da nossa) */
    mover(E, ganhouA ? r.id : o.id, 'prestigio', -0.2);
    mover(E, ganhouA ? o.id : r.id, 'moral', 0.6);
    mover(E, ganhouA ? r.id : o.id, 'moral', -0.2);
    moverRelacao(E, o.id, r.id, -2);
    return registrarBrigaIA(E, {
      ano:E.data.ano, semana:E.data.semana, dia:E.data.dia,
      cidade:(M().cidade(o.mapa)||{}).nome || o.mapa, jogo:'treta marcada',
      a:{id:o.id, nome:o.nome, n:tam, feridos:fA, presos:0},
      b:{id:r.id, nome:r.nome, n:tam, feridos:fB, presos:0},
      vencedor: ganhouA ? o.nome : r.nome, prestigio:display
    });
  }

  /* o ATAQUE AO BAR delas: a maior rival da praça vem, e dinheiro SÓ
     muda de mão aqui — como no nosso bar (saque de 60 por cabeça do
     bonde da casa + 22% do caixa do dono, se o dono perde) */
  function barIA(E, o, chave){
    const atk = rivalDaPracaIA(E, o);
    if(!atk) return null;
    /* ataque de nanica não existe — a mesma régua do nosso bar */
    if(vivoDe(E, atk.id) < vivoDe(E, o.id) * 0.5) return null;
    const reg = brigaIA(E, atk, o, o.mapa, 'ataque ao bar',
                        {tetoA:60, tetoB:40});
    if(!reg) return null;
    if(reg.ganhouA){
      const tAtk = (E.mundoTorcidas||{})[atk.id];
      const tDono = (E.mundoTorcidas||{})[o.id];
      const saque = Math.round(60*reg.b.n +
        0.22*Math.max(0, tDono ? tDono.caixa : 0));
      if(tDono) tDono.caixa -= saque;
      if(tAtk)  tAtk.caixa  += saque;
      reg.saque = saque;
    }
    return reg;
  }

  /* o ATAQUE-SURPRESA delas: relação fervendo (≤ −55) vem sozinha em
     dia comum — a mesma régua nossa (chance cresce com a mágoa e com
     o arquétipo), diluída no dia */
  function surpresaIA(E, o){
    for(const v of hostisLocaisIA(E, o)){
      const rel = relacaoDelas(E, o.id, v.id);
      if(rel > QUENTE) continue;
      if(vivoDe(E, o.id) < vivoDe(E, v.id) * 0.5) continue;
      const t = (E.mundoTorcidas||{})[o.id];
      const briga = t ? ARQUETIPOS[t.arq].briga : 1;
      const chance = ((QUENTE - rel)/(100 + QUENTE)) * 0.28 * briga / 7;
      if(U.rng() > chance) continue;
      return brigaIA(E, o, v, o.mapa, 'ataque-surpresa');
    }
    return null;
  }

  /* a EMBOSCADA DA ESTRADA delas: torcida que viaja pro jogo cruza
     cidade de rival da rota — a mesma lógica da nossa caravana */
  function estradaIA(E, jogos, fora){
    if(!TO.planejamento || !TO.planejamento.caminho) return;
    for(const j of (jogos||[])){
      if(U.rng() > 0.10) continue;
      const casa = M().time(j.c), vis = M().time(j.f);
      if(!casa || !vis || casa.mapa === vis.mapa) continue;
      const viajantes = M().torcidasDe(vis.id)
        .filter(o=>!o.incompleta && o.id !== E.torcida.id &&
                   o.mapa === vis.mapa);
      if(!viajantes.length) continue;
      const o = viajantes[Math.floor(U.rng()*viajantes.length)];
      const rota = TO.planejamento.caminho(E, vis.mapa, casa.mapa, false);
      if(!rota) continue;
      for(const cid of rota.cidades.slice(1, -1)){
        const emb = M().torcidasEm(cid).find(x =>
          !x.incompleta && x.id !== E.torcida.id && x.id !== o.id &&
          x.clubeId !== o.clubeId &&
          !(M().saoIrmas && M().saoIrmas(o.id, x.id)) &&
          (relacaoDelas(E, o.id, x.id) <= HOSTIL ||
           ['Rival','Maior Rival'].includes(M().relacaoBase(o.id, x.id))));
        if(!emb) continue;
        const r = brigaIA(E, emb, o, cid, 'emboscada na estrada');
        if(r) fora.push(r);
        break;
      }
    }
  }

  /* o EXPEDIENTE DA SEDE delas: cada torcida compõe 3 turnos — por
     hash, então a mesma torcida joga sempre do mesmo jeito — entre
     recrutar (o dado do dono) e festa (receita, pra quem tem povo) */
  function expedienteIA(t, id){
    if(t.exped) return t.exped;
    const H = TO.mapa.hash;
    const daFesta = t.membros >= 120;
    const e = [];
    for(let i = 0; i < 3; i++){
      const gosto = ARQUETIPOS[t.arq].compra.includes('loja') ? 4 : 2;
      e.push(daFesta && (H(`${id}|exp${i}`) % 10) < gosto ? 'festa'
                                                          : 'recrutar');
    }
    return (t.exped = e);
  }
  function regimeIA(E, t){
    const sa = semanaAbs(E);
    if(t.janelaIA && sa < t.janelaIA.ate)
      return t.janelaIA.tipo === 'rebaixamento' ? 'rebaixado' : 'titulo';
    if(t.ultimoJogo && t.ultimoJogo.venceu) return 'ganhou';
    if(t.ultimoJogo && t.ultimoJogo.perdeu) return 'perdeu';
    return 'normal';
  }

  /* O DIA DO MUNDO: expediente, calendário do trimestre, surpresa e
     estrada — roda uma vez por dia, depois das brigas de jogo */
  function mundoDia(E, jogos){
    const m = mundo(E);
    /* o placar do dia vira regime de recrutamento das torcidas dos
       dois clubes — a mesma janela quente/seca que a gente tem */
    for(const j of (jogos||[])){
      if(j.gc == null || j.gf == null) continue;
      const marcar = (clube, venceu, perdeu)=>{
        for(const o of M().torcidasDe(clube)){
          const t = m[o.id];
          if(t) t.ultimoJogo = {venceu, perdeu};
        }
      };
      marcar(j.c, j.gc > j.gf, j.gc < j.gf);
      marcar(j.f, j.gf > j.gc, j.gf < j.gc);
    }

    const sa = semanaAbs(E), fora = [];
    const TAB = (TO.acoes && TO.acoes.TABELA_RECRUTA) || {};
    for(const o of M().jogaveis()){
      if(o.id === E.torcida.id || o.incompleta) continue;
      const t = m[o.id];
      if(!t) continue;

      /* --- os 3 turnos do expediente --- */
      for(const op of expedienteIA(t, o.id)){
        if(op === 'recrutar'){
          const teto = tetoDe(E, t);
          if(t.membros >= teto || t.caixa < 10) continue;
          const tab = TAB[regimeIA(E, t)] || {um:0.10, dois:0.05};
          const r = U.rng();
          const n = Math.min(r < tab.dois ? 2
                           : r < tab.dois + tab.um ? 1 : 0,
                             teto - t.membros);
          if(n > 0){ t.membros += n; t.caixa -= n*5; }
        } else if(op === 'festa'){
          if(t.caixa < 700) continue;
          t.caixa += Math.round(t.membros * U.entre(2.8, 4.9)) - 700;
        }
      }

      /* --- o calendário do trimestre dela --- */
      for(const ev of eventosDoTrimestre(E, o.id)){
        if(ev.semanaAbs !== sa || ev.dia !== E.data.dia) continue;
        const r = ev.tipo === 'treta' ? tretaIA(E, o, ev.chave)
                                      : barIA(E, o, ev.chave);
        if(r) fora.push(r);
      }

      /* --- e a surpresa de quem ferve --- */
      const s = surpresaIA(E, o);
      if(s) fora.push(s);
    }
    estradaIA(E, jogos, fora);
    convitesDeAniversario(E);
    return fora;
  }

  /* =======================================================
     ANIVERSÁRIO ENTRE ELAS (decisão do dono, 18/08/2026)
     Quando uma torcida do mundo faz aniversário — a mesma
     data por hash que manda o convite pra gente —, ela também
     convida o próprio círculo: as da mesma praça sem briga e
     as aliadas e irmãs declaradas. Cada convidada aceita ou
     recusa: aceitar custa R$ 2.000 do caixa dela e aproxima
     as duas (+3); recusar afasta (−3). Quanto melhor a
     relação, maior a chance de aparecer — e quebrada não vai.
     ======================================================= */
  /* a data de verdade manda aqui também (correção do dono,
     19/08/2026): fundacaoDia/fundacaoMes da fonte; hash só de reserva */
  const diaDoAnivIA = id => {
    const o = M().torcida(id);
    if(o && o.fundacaoDia && o.fundacaoMes){
      const d = new Date(2001, o.fundacaoMes - 1, o.fundacaoDia);
      return Math.round((d - new Date(2001, 0, 0)) / 86400000);
    }
    return 1 + TO.mapa.hash(`${id}|aniv`) % 364;
  };

  function convitesDeAniversario(E){
    const m = mundo(E);
    const hoje = TO.estado.dataDaSemana(E.data.ano, E.data.semana, E.data.dia);
    const fora = [];
    for(const o of M().jogaveis()){
      if(o.id === E.torcida.id || o.incompleta || !o.fundacao) continue;
      const d = new Date(hoje.getFullYear(), 0, diaDoAnivIA(o.id));
      if(d.getDate() !== hoje.getDate() || d.getMonth() !== hoje.getMonth())
        continue;
      /* o círculo da aniversariante */
      const circulo = [...new Set([
        ...M().torcidasEm(o.mapa),
        ...(o.aliados || []).map(x => M().torcida(x)),
        ...(o.irmandade || []).map(x => M().torcida(x))
      ])].filter(x => x && x.id !== o.id && x.id !== E.torcida.id
                        && !x.incompleta);
      for(const c of circulo){
        const rel = relacaoDelas(E, o.id, c.id);
        /* a régua estrita do dono (18/08/2026), a mesma do nosso
           convite: só aliada de verdade recebe — relação viva ≥ 20
           (o que a Diplomacia rotula Aliado/Irmandade) ou irmã de
           clube. Neutra da praça ficou de fora. */
        const irma = M().saoIrmas && M().saoIrmas(o.id, c.id);
        if(!irma && rel < 20) continue;
        const t = m[c.id];
        const podePagar = t && t.caixa > 2000;
        const aceita = podePagar &&
          U.rng() < U.limitar(0.5 + rel/100, 0.15, 0.95);
        if(aceita){
          if(t) t.caixa -= 2000;
          moverRelacao(E, o.id, c.id, 3);
        } else {
          moverRelacao(E, o.id, c.id, -3);
        }
        fora.push({ano:E.data.ano, semana:E.data.semana, dia:E.data.dia,
                   quem:o.nome, convidada:c.nome, aceitou:aceita});
      }
    }
    if(fora.length){
      E.convitesIA = E.convitesIA || [];
      E.convitesIA.unshift(...fora);
      if(E.convitesIA.length > 100) E.convitesIA.length = 100;
    }
    return fora;
  }

  /* A SITUAÇÃO FINANCEIRA NO RANKING (tabela do dono, 18/08/2026):
     o saldo atual vira rótulo e multiplicador dos pontos —
     Endividado (abaixo de −10 mil) ×0,6 · Muito ruim (−10 mil a 0)
     ×0,8 · Pobre (até 10 mil) ×1,0 · Estável (até 20 mil) ×1,2 ·
     Bem financeiramente (até 40 mil) ×1,4 · Rico (acima) ×1,6 */
  function situacaoFinanceira(caixa){
    if(caixa < -10000) return {rot:'Endividado', slug:'endividado', mult:0.6};
    if(caixa <= 0)     return {rot:'Muito ruim', slug:'muitoruim',  mult:0.8};
    if(caixa <= 10000) return {rot:'Pobre',      slug:'pobre',      mult:1.0};
    if(caixa <= 20000) return {rot:'Estável',    slug:'estavel',    mult:1.2};
    if(caixa <= 40000) return {rot:'Bem financeiramente', slug:'bem', mult:1.4};
    return {rot:'Rico', slug:'rico', mult:1.6};
  }

  let cacheRanking = {chave:'', lista:null};
  function ranking(E){
    const chave = `${E.data.ano}|${semanaAbs(E)}|${E.data.dia}|`+
      `${E.membros.length}|${Math.round(E.indicadores.prestigio*100)}|`+
      `${E.brigasIATotal || (E.brigasIA||[]).length}|${Math.round(E.dinheiro)}|`+
      `${E.baixasIASeq || 0}`;
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
        const sit = situacaoFinanceira(E.dinheiro);
        fora.push({id:o.id, nome:o.nome, nossa:true,
                   membros:n, prestigio:prest, forca,
                   caixa:E.dinheiro, situacao:sit,
                   pontos:Math.round((n + prest*2)*forca*sit.mult)});
      } else {
        const viva = (E.mundoTorcidas||{})[o.id] || {};
        const n = disponiveisIA(E, o.id);
        const prest = Math.round((viva.prestigio !== undefined
          ? viva.prestigio : U.limitar((o.prestigio||15)/5, 0, 20))*5);
        const forca = mediaDeFichaGerada(o, viva.membros || o.membros || n, E);
        const caixa = viva.caixa !== undefined ? viva.caixa : (o.saldo||200)*4;
        const sit = situacaoFinanceira(caixa);
        fora.push({id:o.id, nome:o.nome, nossa:false,
                   membros:n, prestigio:prest, forca,
                   caixa, situacao:sit,
                   pontos:Math.round((n + prest*2)*forca*sit.mult)});
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
          ranking, posicaoNoRanking, situacaoFinanceira,
          brigasDeHoje, mundoDia, brigaIA, disponiveisIA, foraDeCombate, baixasIA,
          convitesDeAniversario,
          mundo, balanco, ARQUETIPOS, economiaDelas,
          relacaoDelas, moverRelacao, chaveDe,
          mover, indicadoresDe, semanaAbs,
          ataquesContraNos, ataqueDeHoje, diaDoAtaque,
          eventosDoTrimestre, eventoDeHoje, rivalDaPraca, SEMANAS_TRI,
          conquistaDoClube, esfriar, passarSemana, panorama, MENSALIDADE};
})();
