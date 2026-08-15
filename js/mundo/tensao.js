/* =========================================================
   TENSÃO — o termômetro que a relação não mede
   ---------------------------------------------------------
   Relação é o que se pensa do outro; tensão é o que está
   prestes a acontecer. Atacar um rival dispara a tensão e
   arrasta a relação junto; semana sem hostilidade esfria as
   duas, e a relação volta devagar pro que ela era.

   Tensão alta é ameaça concreta: sede, bar, emboscada na
   rodovia ou nos arredores. E não é só com a gente — as
   outras torcidas têm caixa, tomam decisão e brigam entre
   si, e é isso que enche o noticiário.
   ========================================================= */
window.TO = window.TO || {};

TO.tensao = (function(){
  const U = TO.util;
  const M = () => TO.mundo;

  const MAX = 100;
  /* GDD §12 usa quatro faixas em tudo; aqui também */
  const FAIXAS = [
    {ate:19,  nome:'Calmaria',  cor:'#7fc2a0'},
    {ate:44,  nome:'Atrito',    cor:'#c8a03c'},
    {ate:74,  nome:'Fervendo',  cor:'#d9705f'},
    {ate:100, nome:'Guerra',    cor:'#e04b45'}
  ];
  const faixa = v => FAIXAS.find(f=>v<=f.ate) || FAIXAS[3];

  const nivel = (E, id) => (E.tensao||{})[id] || 0;

  /* Mexer na tensão mexe na relação junto: hostilidade afasta, paz
     aproxima. A relação anda menos que a tensão — mágoa demora. */
  function somar(E, id, quanto, motivo){
    E.tensao = E.tensao || {};
    const antes = E.tensao[id] || 0;
    E.tensao[id] = U.limitar(antes + quanto, 0, MAX);
    if(E.relacoes && E.relacoes[id] !== undefined)
      E.relacoes[id] = U.limitar(E.relacoes[id] - quanto*0.35, -100, 100);
    if(motivo && Math.abs(quanto) >= 8){
      E.focos = E.focos || [];
      E.focos.unshift({semana:E.data.semana, id, quanto:Math.round(quanto), motivo});
      if(E.focos.length > 40) E.focos.pop();
    }
    return E.tensao[id];
  }

  /* =======================================================
     A SEMANA DAS OUTRAS TORCIDAS
     Elas pagam a mesma conta que nós. Antes era uma linha só —
     R$ 24 líquidos por cabeça — e o resultado, medido em vinte
     anos, é que toda torcida crescia ~14 membros por ano, do
     tamanho que fosse: a de bairro alcançava a Gaviões e a
     distância entre a maior e a menor caía de 12,5× pra 2,1×.
     O motivo é que sem estrutura não há custo fixo nem teto —
     e é a estrutura, no GDD, que decide os dois.

     Agora cada uma tem sede com nível, bar, loja e subsede, e
     paga por tudo pela tabela do GDD V4 §8.1 e §8.3. O teto de
     membros passa a ser o da sede; passar dele custa R$ 40.000
     e depois R$ 100.000, então crescer vira projeto e não
     inércia. Continua sendo conta grossa: 138 torcidas rodam
     por 5.200 semanas e não podem custar caro.
     ======================================================= */

  /* GDD §5.1: a proporção de cargos dá a mensalidade média da
     cabeça — 50% novato a 20, 30% componente a 50, 15% frente a
     100 e 5% diretoria a 100. */
  const MENSALIDADE = 0.50*20 + 0.30*50 + 0.15*100 + 0.05*100;   // R$ 45
  const MATERIAL    = 16;      // GDD §7.4, por cabeça/mês
  const SEM         = 1/4;     // mês → semana, igual ao financeiro

  const P = () => TO.patrimonio;
  const FIN = () => TO.financeiro;

  /* GDD §21.1: cada torcida da IA gasta conforme o que ela é. É o que
     decide pra onde vai o caixa quando sobra.

     `reserva` é quanto ela quer ter no bolso pra assinar uma compra,
     como múltiplo do preço — nunca menos que 1, senão ela compra o que
     não tem e cai no vermelho. Foi assim que quinze torcidas quebraram
     em cem anos na primeira medição: a agressiva assinava uma fábrica
     de R$ 400.000 com R$ 240.000 no caixa e nunca mais saía do
     negativo, perdendo 3% do efetivo por semana até o piso.
     `briga` é o quanto ela procura confusão e o quanto queima de
     material e pirotecnia por causa disso. */
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
      /* entra do tamanho que a fonte diz, com a sede que comporta
         esse tamanho — a mesma regra que vale pra nós */
      const sede = TO.membros.nivelQueCabe(membros, (o.cargos||{}).diretoria || 0);
      E.mundoTorcidas[o.id] = {
        membros, sede,
        /* o tamanho de fábrica, que é pra onde ela sempre pode voltar */
        piso: membros,
        caixa: (o.saldo || 200) * 4,
        moral: 12,
        /* GDD §8.1: a sede nível 1 já vem com um bar nível 1 de graça */
        bares:[{nivel:1}], lojas:[], subsedes:0, fabrica:false,
        vermelho:0,
        /* o bairro da sede decide o multiplicador de tudo que ela tem
           (GDD §7.2); guardar o número evita reconsultar o mapa toda
           semana pra 138 torcidas */
        mult: multDaSede(o),
        /* GDD §6.2: não adianta ter sede nível 5 numa praça que não tem
           500 torcedores sobrando — a estrutura limita quando cabe, a
           praça limita se existe gente. Guardado porque recalcular isso
           138 × 5.200 vezes custa caro. */
        pool: poolDaPraca(o),
        /* as outras organizadas do mesmo clube na mesma praça, que
           disputam o mesmo bolo — a do jogador entra aqui também */
        irmas: M().torcidasEm(o.mapa)
                  .filter(x=>x.clubeId===o.clubeId && x.id!==o.id && !x.incompleta)
                  .map(x=>x.id),
        arq: NOMES_ARQ[TO.mapa.hash(o.id + '|arq') % NOMES_ARQ.length],
        /* torcida grande e de clube grande é mais ousada */
        ousadia: U.limitar((o.poder || 60)/260 + U.entre(-0.15, 0.15), 0.05, 1)
      };
    }
    return E.mundoTorcidas;
  }

  function multDaSede(o){
    const b = M().bairroDaSede(o);
    return b ? M().multiplicador(b) : 1.0;
  }

  /* Quanta gente o clube tem pra dar, na praça dele (GDD §6.2). A base
     vem em milhares; medido nas 139 torcidas da fonte, a militância
     fica em 0,23 membro por mil torcedores na mediana e 1,33 no caso
     mais saturado. O bolo usa 0,55 — meio caminho entre o p75 e o
     máximo —, então a torcida mediana ainda pode dobrar.

     O BOLO É DO CLUBE, NÃO DA TORCIDA. É o que o GDD manda ("menos os
     já organizados de todas as torcidas daquele time") e a primeira
     versão disto errou: dava o bolo inteiro pra cada uma, então as
     duas torcidas do Flamengo tinham exatamente o mesmo teto, cresciam
     até ele e terminavam com o mesmo número. Medido em cem anos, 25
     dos 29 clubes com mais de uma organizada acabaram com todas elas
     empatadas na mesma casa — Fúria Jovem e Torcida Jovem do Botafogo
     em 442 cada, Jovem Fla e Raça Fla em 500 cada.

     Agora elas dividem: o que uma recruta some do que sobra pra
     outra, e quem chega primeiro fica com o espaço. */
  const POR_MIL = 0.55;
  function poolDaPraca(o){
    const base = M().baseDeRecrutamento(o.mapa, o.clubeId, () => 0);
    const bolo = base ? Math.round(base*POR_MIL) : 500;
    /* A fonte manda mais que a fórmula. Onde o clube é pequeno, 0,55 por
       mil dá menos gente do que as organizadas dele já têm — Os Farrapos
       começa com 20 e a conta dá 8. Sem este piso elas perdiam gente nas
       brigas e não recrutavam de volta, porque o teto já estava vencido:
       medido, 17 torcidas descendo em cem anos até o piso de 8, todas com
       caixa saudável. O bolo nunca é menor do que o que já está na mesa. */
    const jaTem = M().torcidasEm(o.mapa)
      .filter(x=>x.clubeId===o.clubeId && !x.incompleta)
      .reduce((s,x)=>s+(x.membros||20), 0);
    return Math.max(bolo, jaTem);
  }

  /* o balanço mensal de uma torcida da IA, na mesma tabela do jogador */
  function balanco(t){
    const R = FIN().RECEITA, MAN = FIN().MANUT, fab = P().FABRICA;
    let rec = t.membros * MENSALIDADE;
    for(const b of t.bares) rec += R.bar[b.nivel] * t.mult;
    for(const l of t.lojas) rec += R.loja[l.nivel] * t.mult * (t.fabrica ? fab.multLoja : 1);
    rec += t.subsedes * R.subsede * t.mult;

    let des = FIN().MANUT_SEDE[t.sede] + t.membros * MATERIAL;
    for(const b of t.bares) des += MAN.bar[b.nivel];
    for(const l of t.lojas) des += MAN.loja[l.nivel]
                                 + R.loja[l.nivel]*FIN().INSUMO*(t.fabrica ? 1-fab.corteInsumo : 1);
    des += t.subsedes * MAN.subsede;
    return {rec, des, saldo:rec - des};
  }

  /* Quanto do bolo do clube ainda é desta torcida: o bolo menos o que as
     irmãs já ocupam. O piso é o efetivo com que ela entrou no jogo, e não
     o de agora — apanhar não pode encolher a torcida pra sempre, ela tem
     que poder repor até onde estava. Praça apertada trava o crescimento,
     não expulsa ninguém. */
  function espacoDaPraca(E, t){
    const m = E.mundoTorcidas;
    let ocupado = 0;
    for(const ir of t.irmas)
      ocupado += m[ir] ? m[ir].membros
               : (ir === E.torcida.id ? E.membros.length : 0);
    return Math.max(t.piso, t.pool - ocupado);
  }

  /* o efetivo máximo é o menor dos dois: sede e praça. As duas contas
     ficam separadas de propósito — comparar o teto da sede com este
     mínimo é comparar um número com ele mesmo, e foi assim que numa
     medição inteira de cem anos nenhuma torcida ampliou a sede. */
  const tetoDe = (E, t) =>
    Math.min(TO.membros.SEDE[t.sede].membros, espacoDaPraca(E, t));

  /* o que ela compraria agora, se tivesse dinheiro: o primeiro item da
     lista do arquétipo que ainda cabe na sede */
  function proximaCompra(E, t, id){
    const cfgArq = ARQUETIPOS[t.arq];
    /* Ampliar a sede quando o efetivo está no teto é sempre prioridade:
       sem isso ela para de crescer pra sempre. Só vale, porém, se quem
       está segurando for a SEDE e não a praça — sede nova que a praça
       não enche é R$ 40.000 jogados fora. */
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
      /* cheio de pontos: ampliar o mais fraco que a sede comporta */
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

  /* A média da divisão onde o clube joga, que é o alvo do investimento da
     IA. Recalcular isso pra 138 torcidas toda semana é caro, então vale um
     cache por temporada — a divisão só muda no acesso e no descenso. */
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

  /* GDD V3 §19, do lado da IA: bancar reforço é a última coisa que ela
     compra, e só enquanto o clube estiver ABAIXO da média de quem ele
     enfrenta. Vira meta de poupança como a sede — sem isso a torneira de
     queima segurava o caixa em R$ 56 mil, abaixo dos R$ 100 mil do ponto
     mais barato, e cem anos rendiam 4 pontos no país inteiro. */
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
        /* GDD §7.4: caixa negativo por muito tempo esvazia a torcida */
        t.vermelho++;
        if(t.vermelho >= 2){
          t.membros = Math.max(8, t.membros - Math.ceil(t.membros*0.03));
          t.moral = U.limitar(t.moral - 0.4, 0, 20);
        }
        continue;
      }
      t.vermelho = 0;

      /* comprar vem antes de crescer: estrutura destrava efetivo */
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

      /* GDD §6.2: recrutar custa R$ 5 por cabeça e só cabe até o teto —
         é ele que segura o crescimento, não o sorteio */
      const teto = tetoDe(E, t);
      if(t.membros < teto && t.caixa > 2000 && U.rng() < 0.18){
        const n = Math.min(U.inteiro(1,2), teto - t.membros);
        t.membros += n;
        t.caixa -= n * 5;
      }

      /* GDD §7.4 e §9: material, pirotecnia, festa e estrada. Só entra
         quando não há mais nada pra comprar e a sede está no teto da
         praça — antes disso o dinheiro tem destino e guardar faz
         sentido. Sem esta torneira o caixa delas subia pra sempre:
         medido em cem anos, mediana de R$ 3,9 milhões parados e
         crescendo em linha reta desde 2066. Queimar 6% do que passa de
         um ano de despesa estabiliza sozinho, em qualquer tamanho. */
      if(!compra){
        const cofre = b.des * 12;
        if(t.caixa > cofre)
          t.caixa -= Math.round((t.caixa - cofre) * 0.06 * ARQUETIPOS[t.arq].briga);
      }
    }
  }

  /* =======================================================
     O QUE ELAS FAZEM ENTRE SI
     Um par por semana, escolhido entre quem já se odeia. O
     resultado vira notícia e mexe no clima da cidade.
     ======================================================= */
  const HOSTIS = [
    {id:'sede',      txt:'atacou a sede da', tensao:16, prest:4},
    {id:'bar',       txt:'depredou o bar da', tensao:12, prest:3},
    {id:'emboscada', txt:'emboscou o bonde da', tensao:20, prest:5},
    {id:'arredores', txt:'brigou nos arredores com a', tensao:14, prest:4},
    {id:'pichacao',  txt:'pichou o muro da', tensao:7,  prest:2}
  ];
  const PACIFICAS = [
    {id:'tregua',  txt:'fechou trégua com a',        tensao:-14},
    {id:'visita',  txt:'foi recebida na sede da',    tensao:-10},
    {id:'apoio',   txt:'apoiou no estádio a',        tensao:-8}
  ];

  function paresPossiveis(E){
    const fora = [];
    for(const o of M().jogaveis()){
      if(o.id === E.torcida.id) continue;
      for(const r of (o.maioresRivais||[]).concat(o.rivais||[]))
        if(r > o.id) fora.push([o.id, r]);
      for(const a of (o.aliados||[]))
        if(a > o.id) fora.push([o.id, a]);
    }
    return fora;
  }

  /* A relação entre duas torcidas da IA existe pelo mesmo motivo que a
     nossa: tensão é o que está prestes a acontecer, relação é o que
     ficou. Sem ela, uma rivalidade de trinta anos de porrada terminava
     exatamente onde começou, porque só a tensão se movia e a tensão
     esfria em três semanas. Nasce no valor do grafo importado. */
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

  let _pares = null;
  function diplomaciaDelas(E){
    if(!_pares) _pares = paresPossiveis(E);
    if(!_pares.length) return [];
    const m = mundo(E);
    E.tensoesDelas  = E.tensoesDelas  || {};
    E.relacoesDelas = E.relacoesDelas || {};
    const noticias = [];
    /* três episódios por semana no país inteiro: o bastante pra o
       ticker ter o que dizer sem virar ruído */
    for(let k=0;k<3;k++){
      const [a,b] = U.escolher(_pares);
      const ta = M().torcida(a), tb = M().torcida(b);
      if(!ta || !tb || !m[a] || !m[b]) continue;
      const rivais = (ta.maioresRivais||[]).includes(b) || (ta.rivais||[]).includes(b);
      /* o arquétipo decide quem procura briga (GDD §21.1) */
      const briga = (ARQUETIPOS[m[a].arq].briga + ARQUETIPOS[m[b].arq].briga)/2;
      const ousadia = (m[a].ousadia + m[b].ousadia)/2;
      if(rivais && U.rng() < (0.35 + ousadia*0.4) * briga){
        const ev = U.escolher(HOSTIS);
        /* bater custa; apanhar custa mais, e ainda perde gente */
        m[a].caixa -= 300; m[b].caixa -= 900;
        m[b].membros = Math.max(8, m[b].membros - U.inteiro(0,2));
        const ch = chaveDe(a,b);
        E.tensoesDelas[ch] = U.limitar((E.tensoesDelas[ch]||0) + ev.tensao, 0, MAX);
        moverRelacao(E, a, b, -ev.tensao*0.35);
        noticias.push({txt:`${ta.nome} ${ev.txt} ${tb.nome}`, tipo:'briga',
                       torcidas:[a,b]});
      }else if(!rivais && U.rng() < 0.25){
        const ev = U.escolher(PACIFICAS);
        moverRelacao(E, a, b, -ev.tensao*0.35);   // tensão negativa aproxima
        noticias.push({txt:`${ta.nome} ${ev.txt} ${tb.nome}`, tipo:'paz',
                       torcidas:[a,b]});
      }
    }
    return noticias;
  }

  /* =======================================================
     O QUE ELAS FAZEM CONOSCO
     Tensão alta é convite: quanto mais quente, maior a chance
     de a semana trazer um ataque.
     ======================================================= */
  const ALVOS = [
    {id:'sede', peso:2,
     conta:(E,o)=>({txt:`Bando da ${o.nome} apedrejou a sede`,
                    dinheiro:-U.inteiro(400,1400), feridos:U.inteiro(1,3),
                    moral:-1.2, prestigio:-2})},
    {id:'bar', peso:2,
     conta:(E,o)=>({txt:`${o.nome} quebrou nosso bar`,
                    dinheiro:-U.inteiro(600,2000), feridos:U.inteiro(0,2),
                    moral:-0.8, prestigio:-1})},
    {id:'emboscada', peso:3,
     conta:(E,o)=>({txt:`Emboscada da ${o.nome} na estrada`,
                    dinheiro:-U.inteiro(200,700), feridos:U.inteiro(2,5),
                    moral:-1.6, prestigio:-3})},
    {id:'arredores', peso:2,
     conta:(E,o)=>({txt:`${o.nome} caiu em cima nos arredores`,
                    dinheiro:0, feridos:U.inteiro(2,4),
                    moral:-1, prestigio:-2})}
  ];

  /* ALVO COM CENA E ALVO SEM CENA CONVIVEM, e isso é estado normal por
     enquanto — não é bug. O bar é o primeiro alvo que virou evento
     datado e jogável: em vez de resolver em número no virar da semana,
     ele marca o dia e, naquele dia, abre a cena do bar com os papéis
     invertidos. Subsede, loja e sede continuam resolvendo em número até
     ganharem cena, nesta ordem.

     QUEM COBRA É UM SÓ. Alvo sem cena: `ataquesContraNos` lança o
     dinheiro, fere e mexe em moral e prestígio, como sempre fez. Alvo
     com cena: aqui só agenda e narra, e quem aplica tudo é o fecho da
     cena — senão o jogador paga duas vezes pelo mesmo ataque. A tensão
     de "fomos atacados" acontece nos dois casos, uma vez só. */
  const COM_CENA = {bar:'bar'};

  /* O DIA DO ATAQUE SAI DO CALENDÁRIO, não do sorteio da hora.
     Mesma disciplina dos assaltos (§8.9): hash da data mais o id da
     torcida, então o mesmo dia reaberto traz o mesmo ataque e a semana
     não gera um novo a cada vez que o mapa é montado. Cai num dia sem
     jogo da praça — dia de jogo já tem o que fazer. */
  function diaDoAtaque(E, id){
    const semente = `${E.data.ano}|${E.data.semana}|${id}`;
    let h = 0;
    for(let i=0;i<semente.length;i++) h = (h*31 + semente.charCodeAt(i)) >>> 0;
    return 1 + (h % 7);
  }

  function ataquesContraNos(E){
    const fora = [];
    for(const [id, t] of Object.entries(E.tensao||{})){
      if(t < 45) continue;
      /* de 45 pra cima a chance cresce rápido; em guerra é quase certo */
      const chance = ((t-45)/55) * 0.28;
      if(U.rng() > chance) continue;
      const o = M().torcida(id);
      if(!o) continue;
      /* emboscada na estrada só quando a torcida está viajando */
      const podeEstrada = TO.financeiro.precisaCaravana(E);
      const alvos = ALVOS.filter(a=>a.id!=='emboscada' || podeEstrada);
      const sorteio = [];
      for(const a of alvos) for(let i=0;i<a.peso;i++) sorteio.push(a);
      const alvo = U.escolher(sorteio);
      const ev = alvo.conta(E, o);
      ev.alvo = alvo.id;

      if(COM_CENA[alvo.id]){
        /* agenda e narra. Nada de dinheiro, ferido, moral ou prestígio
           aqui: quem cobra é a cena. */
        E.ataqueMarcado = {torcida:id, nome:o.nome, alvo:alvo.id,
                           cena:COM_CENA[alvo.id],
                           ano:E.data.ano, semana:E.data.semana,
                           dia:diaDoAtaque(E, id),
                           txt:`${o.nome} vem pro nosso ${alvo.id} esta semana`};
        somar(E, id, 6, 'fomos atacados');
        fora.push(Object.assign({id, torcida:o.nome, marcado:true,
                                 dia:E.ataqueMarcado.dia},
                                {txt:E.ataqueMarcado.txt, dinheiro:0, feridos:0,
                                 moral:0, prestigio:0, alvo:alvo.id}));
        continue;
      }

      if(ev.dinheiro) TO.estado.lancar(E, ev.txt, ev.dinheiro);
      const aptos = E.membros.filter(TO.membros.disponivel);
      for(let i=0;i<Math.min(ev.feridos, aptos.length);i++)
        TO.membros.ferir(E, U.escolher(aptos), 12 + U.inteiro(0,14));
      E.indicadores.moral = U.limitar(E.indicadores.moral + ev.moral, 0, 20);
      E.indicadores.prestigio = U.limitar(E.indicadores.prestigio + ev.prestigio/3, 0, 20);
      /* apanhar esquenta ainda mais */
      somar(E, id, 6, 'fomos atacados');
      fora.push(Object.assign({id, torcida:o.nome}, ev));
    }
    return fora;
  }

  /* o ataque marcado para HOJE, se houver — é o que o mapa consulta */
  function ataqueDeHoje(E){
    const a = E.ataqueMarcado;
    if(!a || a.resolvido) return null;
    return (a.ano === E.data.ano && a.semana === E.data.semana &&
            a.dia === E.data.dia) ? a : null;
  }

  /* =======================================================
     ESFRIAMENTO
     Semana sem hostilidade baixa a tensão, e a relação anda de
     volta pro que ela é por natureza.
     ======================================================= */
  function esfriar(E, houveHostilidade){
    E.tensao = E.tensao || {};
    for(const id of Object.keys(E.tensao)){
      if(houveHostilidade[id]) continue;
      const t = E.tensao[id];
      if(t <= 0){ delete E.tensao[id]; continue; }
      E.tensao[id] = Math.max(0, t - (t > 60 ? 4 : 3));
    }

    /* Com o tempo a relação volta pro que ela é por natureza: mágoa de
       briga passa, e favor feito também. Quanto mais quente o clima,
       menos ela se move — tensão alta mantém tudo aflorado. */
    for(const id of Object.keys(E.relacoes||{})){
      const base = M().valorInicial(M().relacaoBase(E.torcida.id, id));
      const atual = E.relacoes[id];
      if(Math.abs(base - atual) < 2) continue;
      const puxao = 0.05 * (1 - (E.tensao[id]||0)/MAX);
      E.relacoes[id] = U.limitar(atual + (base - atual)*puxao, -100, 100);
    }
    for(const ch of Object.keys(E.tensoesDelas||{})){
      const v = E.tensoesDelas[ch] - 3;
      if(v <= 0) delete E.tensoesDelas[ch]; else E.tensoesDelas[ch] = v;
    }
    /* e a relação delas volta pro que era, pela mesma regra da nossa:
       devagar, e mais devagar ainda enquanto o clima estiver quente */
    for(const ch of Object.keys(E.relacoesDelas||{})){
      const [a, b] = ch.split('|');
      const base = M().valorInicial(M().relacaoBase(a, b));
      const atual = E.relacoesDelas[ch];
      if(Math.abs(base - atual) < 2) continue;
      /* a relação existe sem a tensão existir: uma trégua entre duas
         torcidas que nunca brigaram cria o par aqui sem passar pelo
         ramo hostil, que é quem criava o mapa de tensão */
      const puxao = 0.05 * (1 - ((E.tensoesDelas||{})[ch]||0)/MAX);
      E.relacoesDelas[ch] = U.limitar(atual + (base - atual)*puxao, -100, 100);
    }
  }

  /* =======================================================
     AS NOSSAS INVESTIDAS
     O que o jogador marcou nos outros jogos da cidade: cair em
     cima de torcida de passagem ou emboscar um rival. Resolve
     no fechamento, com baixa dos dois lados.
     ======================================================= */
  function resolverInvestidas(E){
    const feitas = [];
    for(const inv of (E.investidas||[])){
      if(inv.semana !== E.data.semana) continue;
      const o = M().torcida(inv.alvo);
      if(!o) continue;
      const nossos = E.membros.filter(TO.membros.disponivel);
      if(nossos.length < 4) continue;

      /* quem tem mais gente e mais moral leva a melhor */
      const nossa = nossos.length * (0.6 + E.indicadores.moral/40);
      const deles = (o.membros||20) * U.entre(0.5, 1.1);
      const ganhamos = nossa >= deles;

      const feridos = U.inteiro(1, ganhamos ? 3 : 6);
      for(let i=0;i<Math.min(feridos, nossos.length);i++)
        TO.membros.ferir(E, U.escolher(nossos), 10 + U.inteiro(0,16));
      if(U.rng() < 0.3){
        const azar = nossos.filter(TO.membros.disponivel);
        if(azar.length) TO.membros.prender(E, U.escolher(azar));
      }
      const prest = ganhamos ? U.inteiro(2,5) : -U.inteiro(1,3);
      E.indicadores.prestigio = U.limitar(E.indicadores.prestigio + prest/3, 0, 20);
      E.indicadores.policia   = U.limitar(E.indicadores.policia - 1, 0, 20);
      somar(E, inv.alvo, 22, 'nós atacamos');

      feitas.push({alvo:o.nome, ganhamos, feridos, prest,
        txt: ganhamos ? `Caímos em cima da ${o.nome} e dominamos`
                      : `Investida contra a ${o.nome} deu errado`});
    }
    E.investidas = (E.investidas||[]).filter(i=>i.semana !== E.data.semana);
    return feitas;
  }

  /* =======================================================
     A SEMANA INTEIRA, NUMA CHAMADA SÓ
     ======================================================= */
  function passarSemana(E){
    mundo(E);
    const quentes = {};
    for(const f of (E.focos||[])) if(f.semana === E.data.semana) quentes[f.id] = true;

    const investidas = resolverInvestidas(E);
    for(const i of investidas) quentes[i.alvo] = true;
    const ataques  = ataquesContraNos(E);
    for(const a of ataques) quentes[a.id] = true;
    esfriar(E, quentes);
    economiaDelas(E);
    const noticias = diplomaciaDelas(E);

    return {ataques, noticias, investidas};
  }

  /* rótulo pra tela: com quem estamos prestes a nos pegar */
  function panorama(E){
    return Object.entries(E.tensao||{})
      .filter(([,v])=>v > 0)
      .map(([id, v])=>{
        const o = M().torcida(id);
        return {id, nome:o?o.nome:id, cores:o?o.cores:['#666'],
                tensao:Math.round(v), faixa:faixa(v),
                relacao: Math.round((E.relacoes||{})[id] || 0)};
      })
      .sort((a,b)=>b.tensao-a.tensao);
  }

  return {MAX, FAIXAS, faixa, nivel, somar, passarSemana, panorama,
          resolverInvestidas, relacaoDelas, chaveDe, balanco, ARQUETIPOS,
          mundo, ataquesContraNos, ataqueDeHoje, HOSTIS, PACIFICAS, MENSALIDADE};
})();
