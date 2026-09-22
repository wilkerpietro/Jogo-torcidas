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
  /* =======================================================
     A TABELA DA RELAÇÃO (régua do dono, 21/08/2026)

     Todo movimento de relação do jogo mora aqui, e em nenhum
     outro lugar. Antes os números estavam soltos em cinco
     arquivos, de −1 a −26, e rebalancear era caça ao tesouro.

     A RÉGUA: toda mexida vale de 5 a 20 pontos, e BRIGA SEMPRE
     TIRA MAIS. Por isso a faixa é dividida:
       · briga ............ 10 a 20 (só briga entra aqui)
       · resto do negativo . 5 a  9
       · positivo ......... 5 a 20
     Assim nenhum gesto de paz, por maior que seja, azeda a
     relação tanto quanto o menor dos socos.
     ======================================================= */
  const REL = {
    /* --- BRIGA: 10 a 20, sempre o que mais tira --- */
    ataqueGanho:    20,   // invadir o bar, a sede ou a loja dela e vencer
    briga:          18,   // encontro de rua no dia de jogo
    ataquePerdido:  17,   // invadir e apanhar lá dentro
    defesaSegura:   15,   // defender a casa ou a caravana e segurar
    arquibancadaMenos: 13, // arquibancada: encaramos quem era maior
    defesaPerdida:  13,   // defender e perder
    arquibancadaIgual: 12, // arquibancada: efetivo parelho
    arquibancadaMais:  11, // arquibancada: passamos por cima do menor
    treta:          10,   // treta marcada, de efetivo igual

    /* --- NEGATIVO SEM BRIGA: 5 a 9 --- */
    pichacao:        9,   // pichar o território do rival
    largarAliado:    9,   // deixar o aliado apanhando sozinho
    provocar:        8,   // o botão Provocar, na Diplomacia
    ataqueMarcado:   8,   // uma rival marca ataque-surpresa contra nós
    naoReceber:      7,   // aliado na nossa cidade e a gente não recebe
    furarAniversario: 6,  // não aparecer no aniversário da aliada

    /* --- POSITIVO: 5 a 20 --- */
    churrasco:      20,   // recepção de irmandade: carne, bebida e escolta
    descerPeloAliado: 16, // entrar na briga que era dele
    hospedarEscolta: 12,  // hospedar e caminhar junto até o portão
    irAniversario:   8,   // aparecer na festa dela
    hospedar:        7,   // colchão no salão e café de manhã
    reuniao:         6,   // reunião de diretoria com o aliado mais próximo
    aproximar:       5,   // o botão Aproximar, na Diplomacia

    /* --- ENTRE ELAS (IA × IA), na mesma régua --- */
    iaBriga:        16,   // briga entre duas torcidas do mundo
    iaAjudouAmiga:  14,   // quem entrou na briga pela outra
    iaAjudouRival:  12,   // ...e o rival de quem ela ajudou
    iaTreta:        10,   // treta marcada entre elas
    iaConviteAceito: 8,   // convite de festa aceito
    iaConviteRecusado: 6, // convite de festa recusado
    iaReuniao:       6    // reunião de diretoria delas
  };

  const HOSTIL  = -15;   // daqui pra baixo há risco de briga
  const QUENTE  = -55;   // daqui pra baixo o rival vem sozinho
  const ALIADO  =  45;   // daqui pra cima é aliado de verdade

  /* MENOS BRIGA, E ENTRE OS MAIORES RIVAIS (régua do dono, 08/09/2026).
     `FREIO_BRIGA` corta 40% de toda chance de briga do jogo — a nossa e
     a das IAs, na rua, na estrada, na arquibancada, na treta, entre
     filiais. Ficam de fora o BAR (calendário do trimestre e bar do
     rival) e a LNT, que não sorteiam. `pesoDoRival` é o viés: contra
     maior rival a chance vale cheia; contra rival comum ou hostil,
     metade — e onde o alvo é escolhido de uma lista, o maior rival
     entra na frente. Maior rival é o declarado na fonte, de um lado ou
     do outro, ou relação viva de −70 pra baixo. */
  const FREIO_BRIGA = 0.6;
  /* O FREIO DAS IAs ENTRE SI (pedido do dono, 08/09/2026): com o olheiro
     sugerindo menos, o mundo brigava numa faixa muito acima da nossa —
     mediana de 42 brigas por torcida no ano, contra as ~15 a 25 de um
     jogador comum. Este fator só entra nas brigas espontâneas de IA
     contra IA (surpresa, sombra do jogo, estrada, caravana de subsede e
     guerra de filiais); o calendário do trimestre delas (treta marcada e
     bar) e os ataques contra nós ficam como estão. Vale por cima do
     FREIO_BRIGA. */
  const FREIO_IA = 0.4;

  /* A DÍVIDA DAS IAs (pedido do dono, 08/09/2026): a mesma memória que
     o jogador tem. Quem apanha anota de quem apanhou — de nós ou de
     outra IA — e vale até o fim da temporada; vencer a credora quita, e
     a trégua com a gente apaga. Na hora de escolher alvo a credora passa
     na frente da fila, e a tentativa sai com o dobro da chance em vez
     de passar pelo freio das IAs. Contra nós vira ataque marcado com
     `cobranca`; entre elas, a briga sai como revanche. */
  const COBRANCA_MULT = 2;
  /* ENTRE ELAS a cobrança só pula o freio das IAs (sem dobrar) e a
     dívida vence em 16 semanas: com o dobro e validade de temporada
     inteira cada briga virava revanche da revanche e a mediana do mundo
     subia de 22 pra 36 no ano. Contra nós o dobro fica. */
  const VALIDADE_DIVIDA = 16;   // semanas
  /* o que a vingança frustrada custa A MAIS, na régua interna de 0–20
     (a derrota comum da IA já tira 0,6 de moral e o swing de prestígio) */
  const VINGANCA_FRUSTRADA = {moral:0.6, prestigio:0.3};
  function dividaIA(E, devedor, credor){
    const t = (E.mundoTorcidas||{})[devedor];
    const d = t && t.dividas && t.dividas[credor];
    if(!d || d.ano !== E.data.ano) return null;
    if(d.sa != null && semanaAbs(E) - d.sa > VALIDADE_DIVIDA) return null;
    return d;
  }
  function anotarDividaIA(E, devedor, credor){
    const t = (E.mundoTorcidas||{})[devedor];
    if(!t || !credor || devedor === credor) return;
    t.dividas = t.dividas || {};
    t.dividas[credor] = {ano:E.data.ano, semana:E.data.semana, sa:semanaAbs(E)};
  }
  function quitarDividaIA(E, devedor, credor){
    const t = (E.mundoTorcidas||{})[devedor];
    if(t && t.dividas) delete t.dividas[credor];
  }
  /* credoras na frente, sem mexer na ordem do resto */
  const credorasPrimeiro = (E, devedor, lista) =>
    lista.slice().sort((x,y)=>(dividaIA(E, devedor, y.id)?1:0) - (dividaIA(E, devedor, x.id)?1:0));
  /* quem nos deve na frente: cada candidata é a devedora e nós a credora */
  const devedorasPrimeiro = (E, lista) =>
    lista.slice().sort((x,y)=>(dividaIA(E, y.id, E.torcida.id)?1:0) - (dividaIA(E, x.id, E.torcida.id)?1:0));
  const PESO_OUTROS = 0.5;
  /* O MAIOR RIVAL DE NASCENÇA DEIXA DE SER QUANDO VIRA ALIADO (correção
     do dono, 22/09/2026): a rivalidade de nascença (`relacaoBase`)
     segurava o par em "maior rival" com qualquer número — a Jovem Garra
     e a Inferno Coral a +39, aproximadas a pedido nosso, continuavam
     nos "maiores rivais" e nunca viravam aliadas. Agora o ódio de
     nascença vale enquanto a relação não chega ao patamar de aliado
     (20); chegando, é aliança como outra qualquer. E ≤ −70 é maior
     rival de qualquer par, como sempre. */
  const ALIADO_MIN = 20;
  function ehMaiorRival(E, idA, idB){
    if(!idA || !idB || idA === idB) return false;
    const rel = (idA === E.torcida.id) ? nivel(E, idB)
              : (idB === E.torcida.id) ? nivel(E, idA)
              : relacaoDelas(E, idA, idB);
    if(rel <= -70) return true;
    if(rel >= ALIADO_MIN) return false;
    const base = M().relacaoBase(idA, idB), base2 = M().relacaoBase(idB, idA);
    return base === 'Maior Rival' || base2 === 'Maior Rival';
  }
  const pesoDoRival = (E, a, b) => ehMaiorRival(E, a, b) ? 1 : PESO_OUTROS;
  /* A TRÉGUA (mensagens entre torcidas, 08/09/2026): aceita a proposta
     do rival, ninguém procura ninguém até o fim da temporada — nem eles
     vêm, nem a gente marca. Vale o ano civil da proposta. */
  const emTregua = (E, id) => !!(E && E.treguas && E.treguas[id] === E.data.ano);
  /* os maiores rivais primeiro, depois a relação mais azeda */
  const maioresPrimeiro = (E, ids, relDe) => ids.slice().sort((a,b)=>
    (ehMaiorRival(E, E.torcida.id, b)?1:0) - (ehMaiorRival(E, E.torcida.id, a)?1:0) ||
    relDe(a) - relDe(b));

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

  /* =======================================================
     A ORDEM DE GASTO DAS OUTRAS TORCIDAS
     (régua do dono, 20/08/2026 — acabou o arquétipo;
      fila RODANTE em 26/08/2026)

     Cada torcida carrega a própria fila, que nasce desta ordem
     — com a FILIAL subida, por ordem do dono. A torcida olha o
     primeiro item que ainda falta e JUNTA DINHEIRO até poder
     pagar: ela não desce a fila atrás de coisa barata só porque
     o de cima ainda não coube.

     UMA POR VEZ (régua do dono, 26/08/2026): comprou um bar, a
     vez do PRÓXIMO bar vai pro fim da fila da torcida — e assim
     com tudo. Ninguém enfileira três bares seguidos enquanto a
     filial espera; o patrimônio cresce em rodízio.

     A SEDE NÃO ESTÁ NA FILA porque não é preferência: é o que
     DESTRAVA. Ela sobe quando o efetivo encosta no teto, ou
     quando é ela que impede o item da vez — loja não cabe em
     sede nível 1, bar nível 2 só existe em sede nível 3. Comprar
     sede não roda a fila: o item travado segue com a vez.
     ======================================================= */
  /* A FILA DITADA PELO DONO (03/09/2026). Ela REPETE de propósito:
     professor, loja, bar, filial, investimento e bomba aparecem mais
     de uma vez, e a segunda rodada delas vem ANTES das obras caras —
     galpão, enfermaria e cofre só entram quando o barato já rodou
     duas vezes. A bomba aparece três vezes porque munição é o que se
     gasta. Item repetido não é engano: é a ordem dele. */
  /* A ORDEM NOVA (dono, 08/09/2026): comércio primeiro — loja, bar e a
     ampliação dos dois — antes de professor e advogado; a segunda
     rodada de comércio vem antes de ônibus, filial e clube; a área de
     treino saiu da fila. */
  const ORDEM = ['loja', 'bar', 'bombas', 'evoluir:loja', 'evoluir:bar',
                 'mma', 'advogado',
                 'loja', 'bar', 'bombas', 'evoluir:loja', 'evoluir:bar',
                 'onibus', 'filial', 'elenco', 'bombas', 'mma', 'subsede',
                 'filial', 'elenco', 'evoluir:sorteio',
                 'galpao', 'enfermaria', 'cofre'];
  /* muda a ORDEM? sobe o número, e toda torcida recomeça a fila nova.
     A fila viva de save antigo tem outras chaves e outra contagem de
     repetições — comparar por conjunto não daria conta. */
  const FILA_V = 4;
  /* os que NUNCA acabam: bomba se gasta e o clube sempre aceita
     dinheiro. Eles não podem segurar a sede pra sempre (ver a nota
     no proximaCompra). */
  const INFINITO = new Set(['bombas', 'elenco']);

  /* a fila viva da torcida: nasce da ORDEM e roda a cada compra.
     Save de fila antiga recomeça na ordem nova, do começo. */
  function filaDe(t){
    if(!Array.isArray(t.fila) || t.filaV !== FILA_V){
      t.fila = ORDEM.slice();
      t.filaV = FILA_V;
    }
    return t.fila;
  }

  /* A CIDADE DA FILIAL DELAS (aprovado pelo dono, 25/08/2026): a IA
     prioriza sempre a praça com MAIS torcedores do clube dela, fora
     da própria e das que já têm filial. */
  function melhorCidadeFilial(E, id, t){
    const o = M().torcida(id);
    if(!o || !o.clubeId) return null;
    const tem = new Set((t.filiais||[]).map(f=>f.cidade).concat([o.mapa]));
    let melhor = null;
    for(const c of (TO.dados.cidades||[])){
      if(tem.has(c.id)) continue;
      const x = (c.times||[]).find(y=>y.clubeId === o.clubeId);
      const n = x ? M().torcedoresDoClubeNa(c.id, o.clubeId) : 0;
      if(n > 0 && (!melhor || n > melhor.torcedores))
        melhor = {cidade:c.id, torcedores:n};
    }
    return melhor && melhor.cidade;
  }
  /* A COMISSÃO TÉCNICA DELAS é a nossa: até três professores, R$ 2.000
     por mês cada, e o treino rendendo +30%, +60% e +100% (régua do
     dono, 20/08/2026). Nenhum cobra entrada, só o mês — o que a fila
     exige de cada contratação é caixa que aguente três meses da folha
     que ela vai deixar. */
  /* a sala de treino delas é a nossa: sede 1 não comporta professor
     nenhum, sede 2 comporta um, sede 3 dois e sede 5 os três */
  const mmaDe = t =>{
    if(!t || !t.mma) return 0;
    return U.limitar(Math.round(t.mma === true ? 1 : t.mma),
                     0, FIN().cabeNaSede(t.sede));
  };
  const ganhoDeleas = t => FIN().GANHO_MMA[mmaDe(t)] || 1;
  const cofreDoProfessor = t => FIN().MMA_MES * 3 * (mmaDe(t) + 1);
  /* O ESCRITÓRIO DELAS É O NOSSO (pedido do dono, 31/08/2026): R$ 5.000
     por mês por advogado, 10 dias a menos de cadeia por cabeça — na
     contratação e em toda prisão nova — e a escada própria da sede:
     0/1/2/4/8. A fila exige o mesmo cofre de três meses da folha. */
  const advogadosIA = t =>{
    if(!t || !t.advogados) return 0;
    return U.limitar(Math.round(t.advogados), 0,
                     FIN().ADVOGADOS_SEDE[U.limitar(t.sede == null ? 1 : t.sede, 0, 5)] || 0);
  };
  const cofreDoAdvogado = t => FIN().ADVOGADO_MES * 3 * (advogadosIA(t) + 1);
  /* a pena que o camburão dá hoje, já com o corte do escritório */
  const penaIA = t => Math.max(1,
    U.inteiro(15, 90) - advogadosIA(t) * FIN().ADVOGADO_DIAS);
  /* a chegada do advogado alivia quem já está preso: todo lote perde
     10 dias na hora, e lote que zera sai da cadeia junto */
  function aliviarPresosIA(E, t){
    const hoje = E.data.absoluto || 0;
    t.presosIA = (t.presosIA || [])
      .map(x=>({n:x.n, ate:x.ate - FIN().ADVOGADO_DIAS}))
      .filter(x=>x.ate > hoje);
  }
  /* o lote de 5 acompanha os R$ 400 por bomba do jogador (reajuste do
     dono, 31/08/2026): a IA paga o mesmo preço unitário */
  const BOMBA = {lote:5, custo:2000, teto:10};
  /* a cama da enfermaria delas é a nossa: 3–9 dias com o anexo */
  const camaIA = t => (t && t.enfermaria) ? U.inteiro(3, 9)
                                          : U.inteiro(5, 15);
  /* SEM ARQUÉTIPO, a vontade de brigar vem da OUSADIA, que cada
     torcida já tem desde que nasce (sai do poder dela). A escala
     mantém a média de ataques por mês que a tabela dava. */
  const brigaDe = t => t ? 0.6 + (t.ousadia != null ? t.ousadia : 0.25)*1.1 : 1;

  function mundo(E){
    if(E.mundoTorcidas) return E.mundoTorcidas;
    E.mundoTorcidas = {};
    for(const o of M().jogaveis()){
      if(o.id === E.torcida.id) continue;
      const membros = o.membros || 20;
      /* a pequena da IA também mora no ponto de encontro (dono, 22/09/2026) */
      const sede = TO.membros.nivelInicialDaSede({membros, sedeNivel:o.sedeNivel, cargos:o.cargos});
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
        onibus:0, mma:0, bombas:10,
        /* a faixa da torcida (dono, 09/09/2026): uma, e as que ela tomou */
        faixas:1, faixasTomadas:[], bandeiras:1, bandeirasTomadas:[],
        /* subsedes em OUTRAS cidades (dono, 25/08/2026) */
        filiais:[],
        /* a fila de compras rodante de cada uma (dono, 26/08/2026) */
        fila: ORDEM.slice(),
        vermelho:0,
        mult: multDaSede(o),
        pool: poolDaPraca(o),
        irmas: M().torcidasEm(o.mapa)
                  .filter(x=>x.clubeId===o.clubeId && x.id!==o.id && !x.incompleta)
                  .map(x=>x.id),
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

  /* =======================================================
     O BALANÇO DELAS É O NOSSO (ordem do dono, 02/09/2026: "tem que
     ser a mesma complexidade"). Linha a linha, a mesma régua do
     contas() do jogador, em unidades MENSAIS (a economiaDelas aplica
     a fatia semanal): mensalidade POR CARGO com preso não pagando,
     receita de cada ponto no bairro DELE (o mesmo hash fixo que o
     perfil da cidade mostra), fator comercial, moral, fábrica,
     insumo, manutenção, ônibus, professores, advogados e anexos nas
     MESMAS mensalidades cheias — as folhas delas entravam na fatia
     errada (~¼ do que o jogador paga) e a assimetria fechou.
     ======================================================= */
  function bairroIA(o, tipo, i){
    const bs = M().bairrosDe(o.mapa) || [];
    if(!bs.length) return null;
    if(tipo === 'sede'){
      const fixo = o.bairroSede && bs.find(x=>x.nome === o.bairroSede);
      if(fixo) return fixo;
      return bs[TO.mapa.hash(`${o.id}|sede`) % bs.length];
    }
    return bs[TO.mapa.hash(`${o.id}|${tipo}|${i}`) % bs.length];
  }

  function balancoDetalhado(t, E, id){
    const R = FIN().RECEITA, MAN = FIN().MANUT, fab = P().FABRICA;
    const o = M().torcida(id) || {};
    const rec = [], des = [];
    const pon = (l, rot, v)=>{ v = Math.round(v); if(v) l.push({rot, v}); };

    /* mensalidade por cargo, preso não paga — a régua do jogador.
       O plano da fonte é absoluto, então a pirâmide dá o valor por
       cabeça e os pagantes multiplicam. */
    const total = Math.max(1, Math.round(t.membros));
    const presos = (t.presosIA||[]).reduce((s,x)=>s+x.n, 0);
    const pagantes = Math.max(0, total - presos);
    let mensCheia = 0;
    for(const [cargo, n] of TO.membros.planoDeCargos(total, o.cargos))
      mensCheia += TO.membros.CARGOS[cargo].mensalidade * n;
    pon(rec, `Mensalidades (${pagantes})`, mensCheia * pagantes / total);

    const fx = FIN().faixaDaMoral ? FIN().faixaDaMoral((t.moral||12)*5) : 1;
    const fator = fx * (0.7 + ((t.prestigio||0)/20)*0.4
                            + U.limitar(t.membros/150, 0, 1)*0.3);
    const multB = b => b ? M().multiplicador(b) : (t.mult || 1);

    const hojeAbs = (E && E.data && E.data.absoluto) || 0;
    (t.bares||[]).forEach((b, i)=>{
      const ba = bairroIA(o, 'bar', i);
      /* bar quebrado no ataque rende metade por 45 dias, pra elas
         também (dono, 10/09/2026) */
      const dd = FIN().diasDeDano ? FIN().diasDeDano(b, hojeAbs) : 0;
      pon(rec, `Bar${ba?' — '+ba.nome:''} (n${b.nivel})`+
               (dd ? ` · quebrado, ${dd} d` : ''),
          R.bar[b.nivel] * multB(ba) * fator
            * (FIN().multDano ? FIN().multDano(b, hojeAbs) : 1));
    });
    (t.lojas||[]).forEach((l, i)=>{
      const ba = bairroIA(o, 'loja', i);
      pon(rec, `Loja${ba?' — '+ba.nome:''} (n${l.nivel})`+
               `${t.fabrica?' · fábrica':''}`,
          R.loja[l.nivel] * multB(ba) * fator);
    });
    for(let i=0; i<(t.subsedes||0); i++){
      const ba = bairroIA(o, 'subsede', i);
      pon(rec, `Subsede${ba?' — '+ba.nome:''}`,
          R.subsede * multB(ba) * fator);
    }
    for(const f of (t.filiais||[]))
      pon(rec, `Subsede — ${(TO.dados.cidades.find(x=>x.id===f.cidade)||{}).nome
                 || f.cidade} (n${f.nivel})`,
          R.subsede * (E && id && FIN().multFilial
            ? FIN().multFilial(E, f, id) : (t.mult||1)) * fator);

    pon(des, `Manutenção da sede (n${t.sede})`, FIN().MANUT_SEDE[t.sede]);
    /* a fábrica delas corta os MESMOS 50% do custo da loja */
    const corteFab = t.fabrica ? fab.corteCusto : 0;
    let manutCom = 0;
    for(const b of (t.bares||[])) manutCom += MAN.bar[b.nivel];
    for(const l of (t.lojas||[])) manutCom += MAN.loja[l.nivel]*(1-corteFab);
    manutCom += (t.subsedes||0) * MAN.subsede[1];
    for(const f of (t.filiais||[]))
      manutCom += MAN.subsede[f.nivel] || MAN.subsede[1];
    pon(des, 'Manutenção do comércio', manutCom);
    let insumo = 0;
    for(const l of (t.lojas||[]))
      insumo += R.loja[l.nivel]*FIN().INSUMO*(1-corteFab);
    pon(des, `Insumos das lojas${t.fabrica?' · fábrica':''}`, insumo);
    /* as folhas nas mensalidades CHEIAS do jogador */
    pon(des, 'Ônibus da torcida', frotaIA(t) * FIN().ONIBUS_MES);
    pon(des, 'Professores de MMA', mmaDe(t) * FIN().MMA_MES);
    pon(des, 'Advogados', advogadosIA(t) * FIN().ADVOGADO_MES);
    /* recepção de aliado: o que ela gastou hospedando nas últimas 4
       semanas — o mês corrido, na mesma unidade do resto do balanço */
    if(E && (t.recepcoes||[]).length){
      const sa = semanaAbs(E);
      t.recepcoes = t.recepcoes.filter(x=>sa - x.sem < 4);
      const gasto = t.recepcoes.reduce((s,x)=>s+x.v, 0);
      pon(des, `Recepção de aliados (${t.recepcoes.length})`, gasto);
    }
    if(t.enfermaria) pon(des, 'Enfermaria da sede', P().ANEXOS.enfermaria.mes);
    if(t.galpao)     pon(des, 'Galpão de material', P().ANEXOS.galpao.mes);

    const soma = l => l.reduce((s,x)=>s+x.v, 0);
    return {receitas:rec, despesas:des,
            rec:soma(rec), des:soma(des), saldo:soma(rec)-soma(des)};
  }
  const balanco = balancoDetalhado;

  /* =======================================================
     O ELENCO FIXO DE QUALQUER TORCIDA (crivo do dono, 31/08/2026)
     A lista completa de membros de uma torcida IA, DETERMINÍSTICA:
     neste save ou em qualquer outro, o membro nº 37 da Cearamor é
     sempre o mesmo homem, com o mesmo nome e a mesma ficha de
     nascença. O que é VIVO entra por cima: quantos são (t.membros),
     quem está ferido ou preso hoje (os lotes da IA, espalhados por
     índice determinístico) e quem mora na filial (os núcleos, no
     rabo da lista). O formato é o da tabela de Torcida > Membros.
     ======================================================= */
  function elencoDaTorcida(E, id){
    const t = mundo(E)[id];
    const o = M().torcida(id);
    if(!t || !o) return [];
    const H = TO.mapa.hash;
    const n = Math.max(0, Math.round(t.membros));
    if(!n) return [];
    const nomes = TO.membros.nomesDaTorcida(o.nome, 0, n);
    /* a pirâmide de cargos da fonte, esticada pro tamanho de hoje */
    let plano = TO.membros.planoDeCargos(n, o.cargos);
    const somaP = plano.reduce((s,p)=>s+p[1], 0);
    if(somaP > n){
      const fator = n/somaP;
      plano = plano.map(p=>[p[0], Math.floor(p[1]*fator)]);
    }
    const cargoDe = [];
    for(const p of plano)
      for(let i=0; i<p[1] && cargoDe.length<n; i++) cargoDe.push(p[0]);
    while(cargoDe.length < n) cargoDe.push('novato');
    /* ferido e preso de hoje, em índices determinísticos do lote */
    const hoje = E.data.absoluto || 0;
    const sit = new Array(n).fill(null);
    const marca = (lotes, rot)=>{
      for(const l of (lotes||[])){
        let i = H(`${o.nome}|${rot}|${l.ate}`) % n;
        for(let k=0; k<(l.n||0); k++){
          let voltas = 0;
          while(sit[i] && voltas++ < n) i = (i+1) % n;
          if(!sit[i]) sit[i] = {rot, dias: Math.max(1, l.ate - hoje)};
          i = (i+1) % n;
        }
      }
    };
    marca(t.presosIA, 'Preso');
    marca(t.feridosIA, 'Ferido');
    /* O NÚCLEO DA SUBSEDE DELAS TEM CHEFIA (ordem do dono, 03/09/2026)
       Antes o núcleo saía inteiro do fim da lista — ou seja, subsede só
       de novato. Agora a IA destaca a MESMA gente que a gente destaca
       ao fundar: um da diretoria e dois da linha de frente; o que
       passar disso fecha com o fim da lista, como antes. */
    const origem = new Array(n).fill(null);
    const tomado = new Array(n).fill(false);
    const ultimoLivreDe = cargo => {
      for(let i=n-1; i>=0; i--) if(!tomado[i] && cargoDe[i] === cargo) return i;
      return -1;
    };
    let fim = n;
    const doFim = () => {
      while(fim > 0 && tomado[fim-1]) fim--;
      return fim > 0 ? --fim : -1;
    };
    for(const f of (t.filiais||[])){
      let q = Math.min(f.membros||0, n);
      const pega = i => {
        if(i < 0 || q <= 0) return;
        tomado[i] = true; origem[i] = f.cidade; q--;
      };
      for(const c of ['diretoria','frente','frente']) pega(ultimoLivreDe(c));
      while(q > 0){ const i = doFim(); if(i < 0) break; pega(i); }
    }
    /* a ficha de nascença sai da MESMA régua do povoarInicial —
       base por cargo + 0..3 —, só que por hash em vez de dado, pra
       ser a mesma em qualquer save */
    const BASE_F = {novato:1, componente:5, frente:10, diretoria:14};
    const XP_DE = {novato:[0,30], componente:[40,95],
                   frente:[100,290], diretoria:[300,500]};
    const fora = [];
    for(let i=0; i<n; i++){
      const c = cargoDe[i];
      const cfg = TO.membros.CARGOS[c] || {};
      const h = k => H(`${o.nome}|elenco|${i}|${k}`);
      const teto = cfg.teto || 10;
      const ficha = k => Math.min(teto, (BASE_F[c]||1) + h(k) % 4);
      const [x0, x1] = XP_DE[c] || [0, 40];
      fora.push({
        nome: nomes[i], cargo: c, origem: origem[i],
        idade: c === 'diretoria' ? 28 + h('id') % 17 : 17 + h('id') % 22,
        forca: ficha('f'), defesa: ficha('d'),
        xp: x0 + h('x') % (x1 - x0 + 1),
        preso: sit[i] && sit[i].rot === 'Preso' ? sit[i].dias : 0,
        ferido: sit[i] && sit[i].rot === 'Ferido' ? sit[i].dias : 0
      });
    }
    return fora;
  }

  /* O EXTRATO DELAS (crivo do dono, 31/08/2026): a IA guarda um anel
     de lançamentos de verdade — semana fechada, compra da fila,
     caravanas e saque sofrido — pro perfil da torcida mostrar. */
  function lancarIA(E, id, descricao, valor){
    const t = (E.mundoTorcidas||{})[id];
    const v = Math.round(valor);
    if(!t || !v) return;
    (t.extrato = t.extrato || []).unshift(
      {q:`${E.data.ano} s${E.data.semana}`, d:descricao, v});
    if(t.extrato.length > 36) t.extrato.pop();
  }
  const ROTULO_COMPRA = {
    sede:'Ampliação da sede', bar:'Bar novo', loja:'Loja nova',
    subsede:'Subsede nova', filial:'Subsede em outra cidade',
    elenco:'Investimento no clube', onibus:'Ônibus novo',
    bombas:'Bombas ×5', fabrica:'Fábrica de material',
    'anexo:galpao':'Galpão de material',
    'anexo:enfermaria':'Enfermaria da sede',
    'anexo:cofre':'Cofre blindado',
    'area-treino':'Área de treino ampliada',
    'ampliar:bar':'Ampliação do bar', 'ampliar:loja':'Ampliação da loja',
    'ampliar:subsede':'Ampliação da subsede',
    'ampliar:filial':'Ampliação da filial'
  };

  /* =======================================================
     O PRESENTE PRO ALIADO (pedido do dono, 17/09/2026)
     A gente paga, o patrimônio é dele: subir a sede, abrir loja,
     bar ou subsede em outra cidade. Vale a MESMA régua que a fila
     dela obedece — a sede dela tem de comportar o ponto, a filial
     precisa de cidade com torcedor do clube dela e de vaga na sede.
     Quem ganha presente fica mais próximo: a relação com quem ganhou
     sobe +50, seja qual for o presente (régua do dono, 17/09/2026).
     ======================================================= */
  const PRESENTE_GANHO = 50;
  const PRESENTES = ['sede', 'loja', 'bar', 'filial'];
  const ROTULO_PRESENTE = {sede:'Ampliar a sede', loja:'Abrir uma loja',
                           bar:'Abrir um bar', filial:'Abrir subsede em outra cidade'};
  function presenteDe(E, id, tipo){
    const t = mundo(E)[id];
    if(!t) return {custo:null, trava:'torcida fora do mundo'};
    const T = P().TETO, PT = P().PONTO, SD = P().SEDE, FL = P().FILIAL;
    if(tipo === 'sede'){
      const prox = SD[t.sede + 1];
      return prox ? {custo:prox.custo, rot:`sede nível ${t.sede + 1}`}
                  : {custo:null, trava:'a sede dela já é o Complexo (nível 6)'};
    }
    if(tipo === 'filial'){
      const lim = FL.porSede[t.sede] || 0;
      if((t.filiais || []).length >= lim)
        return {custo:null, trava: lim
          ? `a sede nível ${t.sede} dela banca ${lim} ${lim===1?'filial':'filiais'}`
          : `a sede nível ${t.sede} dela ainda não banca filial`};
      const cidade = melhorCidadeFilial(E, id, t);
      return cidade
        ? {custo:FL.compra, cidade, rot:`subsede em ${FIN().nomeCidade(cidade)}`}
        : {custo:null, trava:'não há cidade com torcedor do clube dela sem subsede'};
    }
    const lim = T[tipo][t.sede], cfg = PT[tipo];
    const quantos = (t[cfg.plural] || []).length;
    if(quantos >= lim.qtd)
      return {custo:null, trava:`a sede nível ${t.sede} dela `+
        (lim.qtd ? `não comporta mais ${cfg.plural}` : `não comporta ${cfg.rot.toLowerCase()}`)};
    return {custo:cfg.compra, rot: tipo === 'bar' ? 'bar novo' : 'loja nova'};
  }
  function presentear(E, id, tipo){
    const pr = presenteDe(E, id, tipo);
    if(pr.trava) return null;
    const t = mundo(E)[id];
    if(tipo === 'sede') t.sede++;
    else if(tipo === 'filial')
      (t.filiais = t.filiais || []).push({cidade:pr.cidade, nivel:1, membros:8});
    else (t[P().PONTO[tipo].plural] = t[P().PONTO[tipo].plural] || []).push({nivel:1});
    /* no extrato dela, com o valor do presente — o caixa dela não mexe */
    (t.extrato = t.extrato || []).unshift(
      {q:`${E.data.ano} s${E.data.semana}`,
       d:`Presente da ${E.torcida.nome}: ${pr.rot}`, v:pr.custo});
    if(t.extrato.length > 36) t.extrato.pop();
    const ganho = PRESENTE_GANHO;
    E.relacoes[id] = U.limitar(nivel(E, id) + ganho, -100, 100);
    return Object.assign({ganho}, pr);
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

  /* UM ITEM DA FILA. Devolve a compra, `null` se essa torcida já
     cumpriu esse item (a fila anda), ou {sede:true} quando quem
     está impedindo não é o dinheiro e sim o tamanho da sede. */
  function itemDaFila(E, t, id, chave){
    const T = P().TETO, PT = P().PONTO;

    if(chave === 'mma'){
      if(mmaDe(t) < FIN().cabeNaSede(t.sede))
        return {tipo:'mma', custo:0, cofre:cofreDoProfessor(t)};
      /* a sala está cheia: uma sede maior comporta mais? */
      return FIN().cabeNaSede(t.sede) < FIN().MMA_MAX ? {sede:true} : null;
    }
    if(chave === 'advogado'){
      const teto = FIN().ADVOGADOS_SEDE[U.limitar(t.sede || 1, 1, 5)] || 0;
      if(advogadosIA(t) < teto)
        return {tipo:'advogado', custo:0, cofre:cofreDoAdvogado(t)};
      /* o escritório está cheio: sede maior comporta mais? */
      return t.sede < 6 ? {sede:true} : null;
    }
    if(chave === 'bombas')
      return t.bombas >= BOMBA.teto ? null
           : {tipo:'bombas', custo: t.galpao
               ? Math.round(BOMBA.custo * 0.85) : BOMBA.custo};
    /* os ANEXOS da sede (pacote do dono, 02/09/2026): as IAs compram
       pelo mesmo preço e porta de sede do jogador */
    if(chave === 'area-treino'){
      const AT = P().AREA_TREINO;
      const n = t.areaTreino || 0;
      return AT.custo[n+1] ? {tipo:'area-treino', custo:AT.custo[n+1]} : null;
    }
    if(chave === 'galpao' || chave === 'enfermaria' || chave === 'cofre'){
      if(t[chave]) return null;
      const ax = P().ANEXOS[chave];
      if(t.sede < ax.sede) return {sede:true};
      return {tipo:'anexo:'+chave, custo:ax.custo};
    }
    if(chave === 'elenco') return elencoAlvo(E, id);
    if(chave === 'onibus'){
      if(frotaIA(t) < FIN().cabeNaSede(t.sede))
        return {tipo:'onibus', custo:FIN().ONIBUS_CUSTO};
      return FIN().cabeNaSede(t.sede) < FIN().ONIBUS_MAX ? {sede:true} : null;
    }

    if(chave === 'filial'){
      const FL = P().FILIAL;
      if((t.filiais||[]).length >= (FL.porSede[t.sede]||0))
        return t.sede < 6 ? {sede:true} : null;
      if((t.prestigio||0) < FL.prestigioMin) return null;
      const cidade = melhorCidadeFilial(E, id, t);
      return cidade ? {tipo:'filial', custo:FL.compra, cidade} : null;
    }
    if(chave === 'evoluir:filial'){
      const FL = P().FILIAL;
      const alvo = (t.filiais||[]).filter(f=>FL.ampliar[f.nivel])
                     .sort((a,b)=>a.nivel-b.nivel)[0];
      return alvo ? {tipo:'ampliar:filial', custo:FL.ampliar[alvo.nivel], alvo}
                  : null;
    }

    /* AMPLIAR NO SORTEIO (ordem do dono, 03/09/2026): um item só na
       fila, e a vez é de bar, loja OU filial — tirado na hora. Deu
       num que não tem o que ampliar, a fila anda; semana que vem o
       dado rola de novo e outro pode sair. */
    if(chave === 'evoluir:sorteio')
      return itemDaFila(E, t, id, 'evoluir:'+
        ['bar','loja','filial'][Math.floor(U.rng()*3)]);

    /* evoluir: sobe o ponto de nível mais baixo que ainda cabe */
    if(chave.indexOf('evoluir:') === 0){
      const tipo = chave.slice(8), cfg = PT[tipo];
      const lista = tipo === 'subsede' ? [] : t[cfg.plural];
      const temPraOnde = x => cfg.ampliar[x.nivel] != null;
      const alvo = lista.filter(x => temPraOnde(x) &&
                                     x.nivel + 1 <= T[tipo][t.sede].nivel)
                        .sort((a,b)=>a.nivel-b.nivel)[0];
      if(alvo) return {tipo:'ampliar:'+tipo, custo:cfg.ampliar[alvo.nivel], alvo};
      /* tem ponto que subiria, e o que segura é a sede */
      return lista.some(temPraOnde) ? {sede:true} : null;
    }

    /* comprar: abre mais um até o que a sede comporta */
    const lim = T[chave][t.sede], cfg = PT[chave];
    const quantos = chave === 'subsede' ? t.subsedes : t[cfg.plural].length;
    if(quantos < lim.qtd) return {tipo:chave, custo:cfg.compra};
    return T[chave].some((x,n)=> x && n > t.sede && x.qtd > lim.qtd)
         ? {sede:true} : null;
  }

  function proximaCompra(E, t, id){
    /* QUEM PEDE SEDE MAIOR PERDE A VEZ (ordem do dono, 03/09/2026):
       antes o item travado mandava comprar a ampliação da sede na
       hora — um cheque gordo furando a fila do barato. Agora ele é
       PULADO e vai pro fim da fila; a torcida segue gastando no que
       cabe. A sede só é comprada quando não sobrou mais nada pra
       fazer (lá embaixo), que é quando ela vira, de novo, a única
       coisa que destrava o resto. */
    const fila = filaDe(t);
    const travados = [];
    const paga = it => t.caixa >= Math.max(it.custo || 0, it.cofre || 0);
    let achou = null;

    /* O LAÇO NÃO PARA NO PRIMEIRO ACHADO quando a vez é fraca — e
       isso é o conserto do conserto (03/09/2026). Empurrar o travado
       pro fim tem um efeito colateral: na semana seguinte o laço
       encontra a vez ANTES de chegar nos travados, que agora moram no
       rabo, e conclui que não há nada travado. Foi assim que o
       destrave nunca disparou e 241 torcidas passaram a década na
       sede 1 com dinheiro no bolso. Agora: se a vez é construção que
       o caixa paga, a fila para ali mesmo (é o caso comum e barato);
       se a vez é consumível ou coisa fora do bolso, o laço segue até
       o fim pra saber se existe alguém travado esperando sede. */
    for(const chave of fila.slice()){
      const it = itemDaFila(E, t, id, chave);
      if(!it) continue;                    // cumprido: a fila anda
      if(it.sede){ travados.push(chave); continue; }
      if(achou) continue;                  // a vez já é de outro
      it.chave = chave;                    // pra rodar a fila na compra
      achou = it;                          // a vez é desta — e ela ESPERA
      if(!INFINITO.has(chave) && paga(it)) break;
    }
    for(const chave of travados){
      const i = fila.indexOf(chave);
      if(i >= 0){ fila.splice(i, 1); fila.push(chave); }
    }

    /* A SEDE DESTRAVA QUANDO A VEZ NÃO ANDA. Duas coisas emperravam
       a fila para sempre com a regra do pulo: BOMBA e INVESTIMENTO NO
       CLUBE nunca acabam (a torcida gastaria o século em munição), e
       uma CONSTRUÇÃO CARA na vez segura tudo enquanto ela junta — e
       ela junta para sempre, porque o barato está travado pela sede
       que ninguém compra. Então: havendo travado, e a vez sendo de
       consumível ou de coisa que o caixa não paga, a sede passa na
       frente — se o caixa já paga ELA. Quem não paga nem a sede segue
       no barato, juntando. */
    const sedeNova = P().SEDE[t.sede+1];
    if(achou && !INFINITO.has(achou.chave) && paga(achou)) return achou;
    if(travados.length && sedeNova && t.caixa >= sedeNova.custo)
      return {tipo:'sede', custo:sedeNova.custo};
    if(achou) return achou;

    /* fila inteira cumprida ou toda travada: o que sobra é obra
       grande. A sede primeiro — é ela que destrava todo o resto —,
       a fábrica depois. */
    if(sedeNova)
      return {tipo:'sede', custo:sedeNova.custo};
    if(!t.fabrica && t.sede >= P().FABRICA.sede)
      return {tipo:'fabrica', custo:P().FABRICA.custo};
    return null;
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
      if(t.bombas == null){ t.bombas = 10; t.onibus = t.onibus ? 1 : 0; }
      /* ônibus e professor viraram CONTA, não sim-ou-não — e a conta
         guardada é a que CABE na sede: sem isso ficava professor
         fantasma no cadastro, invisível na ficha e imune à demissão */
      t.mma = mmaDe(t);
      t.onibus = frotaIA(t);
      /* MIGRAÇÃO (correção do dono, 31/08/2026): o núcleo das filiais
         nunca tinha entrado no TOTAL de membros — a Cearamor abria
         subsede e seguia com os mesmos 200. Conta uma vez e marca. */
      if(!t.nucleoContado){
        t.membros += (t.filiais||[]).reduce((s,f)=>s+(f.membros||0), 0);
        t.nucleoContado = true;
      }
      /* o núcleo das filiais delas cresce devagar até o teto do nível
         (dose do dono, 26/08/2026): ~1 membro a cada 3 semanas — e o
         recruta da filial é recruta DA TORCIDA: entra no total
         (correção do dono, 31/08/2026) */
      for(const f of (t.filiais = t.filiais || [])){
        f.membros = f.membros || 8;
        const tetoF = P().FILIAL.teto[f.nivel] || 0;
        if(f.membros < tetoF && U.rng() < 1/3){
          f.membros += 1;
          t.membros += 1;
        } else if(f.membros > tetoF) f.membros = tetoF;
      }
      const b = balanco(t, E, id);
      t.caixa += Math.round(b.saldo * SEM);
      lancarIA(E, id, 'Semana — comércio, folhas e manutenção',
               Math.round(b.saldo * SEM));

      /* A CARAVANA DELAS PAGA ESTRADA (assimetria fechada pelo dono,
         27/08/2026): semana com jogo fora da praça cobra a mesma
         régua do jogador — por cabeça, 40% da torcida, frota
         abatendo. A régua média vale 2 trechos de viagem. */
      const o = M().torcida(id);
      if(o && o.clubeId && TO.competicoes.jogosDaSemana){
        const jogos = TO.competicoes.jogosDaSemana(E, o.clubeId,
                                                   E.data.semana) || [];
        const viaja = jogos.some(j=>{
          if(j.casa) return false;
          const adv = M().time(j.adversario);
          return adv && adv.mapa !== o.mapa;
        });
        if(viaja && TO.planejamento.custoCaravanaIA){
          const n = TO.planejamento.caravanaDe(o, 0, E);
          const cv = TO.planejamento.custoCaravanaIA(n, frotaIA(t));
          t.caixa -= cv;
          lancarIA(E, id, `Caravana — jogo fora (${n} cabeças)`, -cv);
        }
        if(viaja) recepcaoIA(E, o, t, jogos);
        /* A CARAVANA SILENCIOSA DA SUBSEDE DELAS (ordem do dono,
           31/08/2026): em todo jogo da semana — em casa e fora — o
           núcleo de cada filial viaja pra praça da partida pela rota
           mais curta, pagando o mesmo padrão da caravana, com a
           vontade do jogador e o redutor de visitante (×0,6). E a
           estrada cobra de vez em quando: a caravana do núcleo pode
           se pegar com uma torcida hostil da praça de destino. */
        if(TO.planejamento.custoCaravanaFilial && (t.filiais||[]).length){
          for(const j of jogos){
            const destino = j.casa ? o.mapa
              : ((M().time(j.adversario)||{}).mapa || o.mapa);
            for(const f of t.filiais){
              if(f.cidade === destino || (f.membros||0) < 2) continue;
              const saltos = TO.planejamento.saltosEntre(E, f.cidade, destino);
              const vontade = U.limitar(0.72 - saltos*0.09
                + (t.moral/20)*0.4, 0.08, 0.95) * 0.6;
              const nF = Math.min(f.membros,
                Math.round(f.membros * vontade));
              if(nF < 2) continue;
              const cvf = TO.planejamento.custoCaravanaFilial(
                nF, saltos, frotaIA(t));
              t.caixa -= cvf;
              lancarIA(E, id, `Caravana da subsede (${nF} cabeças)`, -cvf);
              if(U.rng() >= 0.04 * FREIO_BRIGA * FREIO_IA) continue;   // 2,4% × freio das IAs
              const hostil = M().torcidasEm(destino)
                .filter(x=>x.id !== id && x.id !== E.torcida.id &&
                  !x.incompleta && x.clubeId !== o.clubeId &&
                  !(M().saoIrmas && M().saoIrmas(id, x.id)) &&
                  relacaoDelas(E, id, x.id) <= -20)
                .sort((x,y)=>relacaoDelas(E,id,x.id) -
                             relacaoDelas(E,id,y.id))[0];
              if(hostil) brigaIA(E, o, hostil, destino, '', {tetoA:nF});
            }
          }
        }
      }

      /* PERDA DE MEMBROS IGUAL À NOSSA (decisão do dono, 18/08/2026):
         caixa no vermelho derruba a MORAL — 1 por semana, a mesma
         régua do nosso fechamento — e ninguém debanda. Membro delas
         só sai de circulação ferido ou preso, e volta. */
      if(t.caixa < 0){
        t.vermelho++;
        t.moral = U.limitar(t.moral - 1, 0, 20);
        /* duas semanas no vermelho e o advogado vai embora primeiro —
           é a folha mais cara; sem advogado, cai o professor de MMA */
        if(t.vermelho >= 2){
          if(advogadosIA(t)) t.advogados = advogadosIA(t) - 1;
          else if(mmaDe(t)) t.mma = mmaDe(t) - 1;
        }
        /* A VENDA FORÇADA delas (ordem do dono, 02/09/2026): 30 dias
           de dívida — aqui contados na fatia semanal — e uma loja sai
           por R$ 90 mil, a de nível mais baixo */
        t.diasVermelho = (t.diasVermelho || 0) + 7;
        if(t.diasVermelho >= 30){
          let mexeu = false;
          if((t.lojas||[]).length){
            let iL = 0;
            for(let k=1; k<t.lojas.length; k++)
              if((t.lojas[k].nivel||1) < (t.lojas[iL].nivel||1)) iL = k;
            t.lojas.splice(iL, 1);
            t.caixa += FIN().VENDA_LOJA || 90000;
            lancarIA(E, id, 'Loja vendida — 30 dias no vermelho',
                     FIN().VENDA_LOJA || 90000);
            mexeu = true;
          }
          /* e até 3 subsedes fecham junto (ordem do dono, 02/09/2026):
             as da cidade primeiro, depois a filial mais fraca — o
             núcleo volta pra sede, o total de membros não muda */
          let fechou = 0;
          while(fechou < 3 && (t.subsedes||0) > 0){ t.subsedes--; fechou++; }
          while(fechou < 3 && (t.filiais||[]).length){
            let iF = 0;
            for(let k=1; k<t.filiais.length; k++)
              if((t.filiais[k].nivel||1) < (t.filiais[iF].nivel||1)) iF = k;
            t.filiais.splice(iF, 1);
            fechou++;
          }
          if(mexeu || fechou) t.diasVermelho = 0;
        }
        continue;
      }
      t.vermelho = 0;
      t.diasVermelho = 0;

      /* A FILA DO DONO, uma compra por semana. Sem colchão de
         arquétipo: o preço é o preço, e quem não tem espera. O
         professor de MMA não cobra entrada, cobra mensalidade — por
         isso ele pede `cofre` em vez de custo. */
      /* a promoção vem ANTES da compra da semana: gente de pé é
         patrimônio, e o que sobrar depois é que vai pra fila */
      promoverDelas(E, t, id);

      /* FAIXA E BANDEIRA ANTES DE TUDO (ordem do dono, 09/09/2026): toda
         torcida IA quer ter uma faixa e uma bandeira na sede. Ficou sem
         — tomada na arquibancada, no bar, na praça — repõe como
         prioridade, na frente da fila, pelo preço da loja. É a compra
         da semana quando acontece. */
      if(reporPanos(E, t, id)) continue;

      const compra = proximaCompra(E, t, id);
      if(compra && t.caixa >= Math.max(compra.custo, compra.cofre || 0)){
        t.caixa -= compra.custo;
        if(compra.tipo === 'sede') t.sede++;
        else if(compra.tipo === 'mma') t.mma = mmaDe(t) + 1;
        else if(compra.tipo === 'advogado'){
          /* o advogado delas também chega trabalhando: 10 dias a
             menos pra quem já está no camburão */
          t.advogados = advogadosIA(t) + 1;
          aliviarPresosIA(E, t);
        }
        else if(compra.tipo === 'bombas')
          t.bombas = Math.min(BOMBA.teto, t.bombas + BOMBA.lote);
        else if(compra.tipo === 'fabrica') t.fabrica = true;
        else if(compra.tipo.indexOf('anexo:') === 0)
          t[compra.tipo.slice(6)] = true;
        else if(compra.tipo === 'area-treino')
          t.areaTreino = (t.areaTreino || 0) + 1;
        else if(compra.tipo === 'onibus') t.onibus = frotaIA(t) + 1;
        else if(compra.tipo === 'subsede') t.subsedes++;
        else if(compra.tipo === 'filial')
          /* a fundação desce com gente da sede (ordem do dono,
             31/08/2026, ampliada em 09/09/2026): 8 destacados — um
             diretor, dois linha de frente e cinco componentes — mudam
             de cidade, não de torcida, então o total não muda; o resto
             o núcleo recruta lá, no ritmo dele */
          (t.filiais = t.filiais || []).push(
            {cidade:compra.cidade, nivel:1, membros:8});
        else if(compra.tipo === 'elenco'){
          E.investimento = E.investimento || {};
          E.investimento[compra.clube] = (E.investimento[compra.clube] || 0) + 1;
          TO.competicoes.usarSave(E);
        }
        else if(compra.tipo.startsWith('ampliar:')) compra.alvo.nivel++;
        else t[P().PONTO[compra.tipo].plural].push({nivel:1});
        /* a compra entra no extrato dela (crivo do dono, 31/08/2026) */
        if(compra.custo) lancarIA(E, id,
          ROTULO_COMPRA[compra.tipo] || compra.tipo, -compra.custo);
        /* O MUNDO PASSOU A AVISAR (pedido do dono, 19/09/2026): obra
           de torcida que interessa à gente — a da nossa cidade, a da
           aliada, a do rival — vira cartão no feed. O filtro é do
           feed; aqui só se anuncia. */
        if(TO.feed && TO.feed.registrarObra && TO.feed.obraInteressa(E, id))
          TO.feed.registrarObra(E,
            {tipo:'obra', torcida:id, item:compra.tipo, cidade:compra.cidade});
        /* UMA POR VEZ (dono, 26/08/2026): comprou, a vez desse item
           vai pro fim da fila da torcida. Sede e fábrica não rodam
           nada — não estão na fila. */
        if(compra.chave){
          const fl = filaDe(t), i = fl.indexOf(compra.chave);
          if(i >= 0){ fl.splice(i, 1); fl.push(compra.chave); }
        }
        continue;
      }

      /* o sorteio de 18%/semana saiu: quem recruta agora é o
         expediente diário delas (mundoDia), com o dado do dono */

      if(!compra){
        const cofre = b.des * 12;
        if(t.caixa > cofre)
          t.caixa -= Math.round((t.caixa - cofre) * 0.06 * brigaDe(t));
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

  /* =======================================================
     O GANHO QUE ENCOLHE (régua do dono, 17/09/2026)
     Convite de festa e recepção de caravana somavam sem teto: no
     save do dono, 1.232 alianças viraram irmandade em cinco anos por
     essas duas vias. Agora, por dupla de torcidas e por via, o
     PRIMEIRO do ano vale cheio e cada repetição vale METADE do
     anterior (8, 4, 2, 1, 1, 0…). Vale pra nós e pras IAs, nos dois
     sentidos, e zera na virada do ano. As perdas (não receber,
     recusar) seguem inteiras.
     ======================================================= */
  function ganhoRepetido(E, a, b, via, base){
    const ano = E.data.ano;
    if(!E.repeticoes || E.repeticoes.ano !== ano) E.repeticoes = {ano, n:{}};
    const ch = `${via}|${chaveDe(a, b)}`;
    const n = E.repeticoes.n[ch] || 0;
    E.repeticoes.n[ch] = n + 1;
    return Math.round(base / Math.pow(2, n));
  }

  /* O PAR INTOCADO NÃO É GRAVADO (correção do dono, 22/09/2026): isto
     gravava em `E.relacoesDelas` todo par que fosse LIDO, mesmo com o
     valor inicial — e o valor inicial é tabela fixa (`valorInicial` de
     `relacaoBase`), informação nenhuma. Com 386 torcidas são 74 mil
     pares; na semana 12 o save carregava 2,4 MB disso, 99% igual ao
     inicial, e o `localStorage` recusava a gravação. Agora só o par
     que alguém MEXEU mora no save; o resto é recalculado na leitura. */
  function relacaoDelas(E, a, b){
    E.relacoesDelas = E.relacoesDelas || {};
    const v = E.relacoesDelas[chaveDe(a,b)];
    return v === undefined ? M().valorInicial(M().relacaoBase(a, b)) : v;
  }
  function moverRelacao(E, a, b, quanto){
    E.relacoesDelas[chaveDe(a,b)] =
      U.limitar(relacaoDelas(E, a, b) + quanto, -100, 100);
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
  /* QUEM ALCANÇA A GENTE. Da mesma praça, sempre. Visitante só quando
     está na cidade — e NO DIA em que está (correção do dono, 10/09/2026:
     a Bamor, de Salvador, fechou a TUF a caminho do Castelão num jogo
     Fortaleza × Fluminense; ela estava em Fortaleza noutro dia da
     semana, pelo Bahia, e a conta antiga aceitava qualquer dia de 1 a
     7). Sem `dia`, vale qualquer dia — é o que os outros usos querem. */
  function alcanca(E, id, dia){
    const o = M().torcida(id);
    if(!o) return false;
    if(o.mapa === E.torcida.mapa) return true;               // mesma praça
    if(TO.praca && TO.praca.naRuaEm){                        // visitante na cidade
      const dias = dia ? [dia] : [1,2,3,4,5,6,7];
      for(const d of dias)
        if(TO.praca.naRuaEm(E, d).some(x=>x.id===id)) return true;
    }
    return false;
  }

  function ataquesContraNos(E){
    const fora = [];
    if(E.ataqueMarcado && !E.ataqueMarcado.resolvido &&
       E.ataqueMarcado.semana === E.data.semana) return fora;
    /* os maiores rivais são testados primeiro (dono, 08/09/2026) */
    const candidatas = devedorasPrimeiro(E, maioresPrimeiro(E,
      M().jogaveis().filter(o=>o.id !== E.torcida.id && !o.incompleta).map(o=>o.id),
      id => nivel(E, id)).map(id => M().torcida(id)));
    for(const o of candidatas){
      const r = nivel(E, o.id);
      if(r > QUENTE) continue;
      if(emTregua(E, o.id)) continue;
      if(M().saoIrmas && M().saoIrmas(E.torcida.id, o.id)) continue;
      /* o ataque é no dia do nosso jogo: visitante tem de estar na
         cidade NESSE dia, não em qualquer um da semana */
      if(!alcanca(E, o.id, (E.proximoJogo && E.proximoJogo.dia) || 6)) continue;
      const t = (E.mundoTorcidas||{})[o.id];
      /* ATAQUE DE NANICA NÃO EXISTE (decisão do dono, 17/08/2026):
         torcida com menos da metade do nosso efetivo não vem — a cena
         abria e acabava na hora, com eles correndo por minoria. O
         contrário vale: efetivo muito maior que o nosso ataca à
         vontade. */
      /* de pé, sem ferido nem preso, dos dois lados (dono, 27/08/2026) */
      const vivoDeles = disponiveisIA(E, o.id);
      if(vivoDeles < TO.membros.aptosParaOEstadio(E).length * 0.5) continue;
      const briga = brigaDe(t);
      /* de −55 pra baixo a chance cresce; em −100, com torcida bem
         ousada, é quase um ataque por mês */
      const cobra = !!dividaIA(E, o.id, E.torcida.id);
      const chance = ((QUENTE - r)/(100 + QUENTE)) * 0.28 * briga
                     * (cobra ? COBRANCA_MULT : FREIO_BRIGA * pesoDoRival(E, E.torcida.id, o.id));
      if(U.rng() > chance) continue;

      /* concentração e pista só existem em semana de jogo em casa */
      const jogoEmCasa  = E.proximoJogo && E.proximoJogo.casa;
      if(!jogoEmCasa) continue;
      const sorteio = [];
      for(const a of ALVOS) for(let i=0;i<a.peso;i++) sorteio.push(a);
      const alvo = U.escolher(sorteio);
      const dia = E.proximoJogo.dia || 6;
      E.ataqueMarcado = {torcida:o.id, nome:o.nome, alvo:alvo.id,
                         cena:alvo.cena, mapa:E.torcida.mapa,
                         ano:E.data.ano, semana:E.data.semana, dia,
                         cobranca: cobra};
      hostilidade(E, o.id, REL.ataqueMarcado);
      /* a campana do olheiro pode farejar a fita (dono, 24/08/2026) */
      if(TO.feed && TO.feed.avisoDoOlheiro)
        TO.feed.avisoDoOlheiro(E, {
          chave:`atq|${E.data.ano}|${E.data.semana}|${o.id}|${alvo.id}`,
          alvo:alvo.id, nome:o.nome, cobranca: cobra});
      fora.push({id:o.id, torcida:o.nome, alvo:alvo.id, dia});
      break;              // um ataque-surpresa por semana já é guerra
    }

    /* A SUB-SEDE INIMIGA NA NOSSA PRAÇA (decisão do dono, 26/08/2026):
       torcida de fora que abriu filial na nossa cidade pode atacar a
       gente aqui dentro, com a quantidade de membros da sub-sede dela.
       O nome vem decorado — "Jovem Fla Sub-Sede Fortaleza" — e o bar
       cai em dia comum; concentração/pista só em semana de jogo em
       casa e se o núcleo deles tiver metade do nosso efetivo. */
    if(!fora.length){
      const nomeCid = FIN().nomeCidade ? FIN().nomeCidade(E.torcida.mapa)
                                       : E.torcida.mapa;
      for(const o of M().jogaveis()){
        if(o.id === E.torcida.id || o.incompleta) continue;
        if(o.mapa === E.torcida.mapa) continue;      // essas já vêm por cima
        const t = (E.mundoTorcidas||{})[o.id];
        const f = t && (t.filiais||[]).find(x=>x.cidade === E.torcida.mapa);
        if(!f || (f.membros||0) < 6) continue;       // núcleo pequeno não desce
        if(M().saoIrmas && M().saoIrmas(E.torcida.id, o.id)) continue;
        const r = nivel(E, o.id);
        if(r > QUENTE) continue;
        const jogoEmCasa = E.proximoJogo && E.proximoJogo.casa;
        const aptos = TO.membros.aptosParaOEstadio
          ? TO.membros.aptosParaOEstadio(E).length : E.membros.length;
        const podeRua = jogoEmCasa && f.membros >= aptos * 0.5;
        /* o bar fica fora do freio (dono, 08/09/2026); a rua leva */
        const cobra = !!dividaIA(E, o.id, E.torcida.id);
        const chance = ((QUENTE - r)/(100 + QUENTE)) * 0.18 * brigaDe(t)
                       * (cobra ? COBRANCA_MULT
                          : podeRua ? FREIO_BRIGA * pesoDoRival(E, E.torcida.id, o.id) : 1);
        if(U.rng() > chance) continue;

        const alvo = podeRua ? U.escolher(ALVOS) : {id:'bar', cena:'bar'};
        const dia = alvo.id === 'bar'
          ? diaDoAtaque(E, o.id) : (E.proximoJogo.dia || 6);
        if(alvo.id === 'bar' && dia < E.data.dia) continue;  // hash já passou
        E.ataqueMarcado = {torcida:o.id,
                           nome:`${o.nome} Sub-Sede ${nomeCid}`,
                           alvo:alvo.id, cena:alvo.cena,
                           efetivo:f.membros, filial:true,
                           mapa:E.torcida.mapa,
                           ano:E.data.ano, semana:E.data.semana, dia,
                           cobranca: cobra};
        hostilidade(E, o.id, REL.ataqueMarcado);
        if(TO.feed && TO.feed.avisoDoOlheiro)
          TO.feed.avisoDoOlheiro(E, {
            chave:`atqf|${E.data.ano}|${E.data.semana}|${o.id}`,
            alvo:alvo.id, nome:`${o.nome} Sub-Sede ${nomeCid}`, cobranca: cobra});
        fora.push({id:o.id, torcida:o.nome, alvo:alvo.id, dia, filial:true});
        break;
      }
    }

    /* JOGO FORA: A CONCENTRAÇÃO É NA PRAÇA DELES (correção do dono,
       27/08/2026). A concentração e a pista do dia de jogo fora
       acontecem na cidade do MANDANTE — então quem cai em cima é
       torcida hostil DAQUELA praça, nunca a da nossa. A nanica se
       mede contra a CARAVANA que viajou, não contra a torcida
       inteira, e a filial nossa por lá é olheiro fixo do aviso. */
    const j = E.proximoJogo;
    if(!fora.length && j && !j.casa && j.mapaAdv &&
       j.mapaAdv !== E.torcida.mapa){
      const est = TO.planejamento.estimativaCaravana
        ? TO.planejamento.estimativaCaravana(E) : null;
      const crew = (est && est.vao) ||
        TO.membros.aptosParaOEstadio(E).length;
      const daPraca = devedorasPrimeiro(E, maioresPrimeiro(E,
        M().torcidasEm(j.mapaAdv).filter(o=>o.id !== E.torcida.id && !o.incompleta).map(o=>o.id),
        id => nivel(E, id)).map(id => M().torcida(id)));
      for(const o of daPraca){
        if(M().saoIrmas && M().saoIrmas(E.torcida.id, o.id)) continue;
        if(emTregua(E, o.id)) continue;
        const r = nivel(E, o.id);
        if(r > QUENTE) continue;
        if(disponiveisIA(E, o.id) < crew * 0.5) continue;
        const t = (E.mundoTorcidas||{})[o.id];
        const cobra = !!dividaIA(E, o.id, E.torcida.id);
        const chance = ((QUENTE - r)/(100 + QUENTE)) * 0.28 * brigaDe(t)
                       * (cobra ? COBRANCA_MULT : FREIO_BRIGA * pesoDoRival(E, E.torcida.id, o.id));
        if(U.rng() > chance) continue;
        const sorteio = [];
        for(const a of ALVOS) for(let i=0;i<a.peso;i++) sorteio.push(a);
        const alvo = U.escolher(sorteio);
        const dia = j.dia || 6;
        E.ataqueMarcado = {torcida:o.id, nome:o.nome, alvo:alvo.id,
                           cena:alvo.cena, mapa:j.mapaAdv,
                           ano:E.data.ano, semana:E.data.semana, dia,
                           cobranca: cobra};
        hostilidade(E, o.id, REL.ataqueMarcado);
        if(TO.feed && TO.feed.avisoDoOlheiro)
          TO.feed.avisoDoOlheiro(E, {
            chave:`atq|${E.data.ano}|${E.data.semana}|${o.id}|${alvo.id}`,
            alvo:alvo.id, nome:o.nome, cidade:j.cidadeAdv || '', cobranca: cobra,
            forcar: !!(TO.patrimonio && TO.patrimonio.temFilialEm &&
                       TO.patrimonio.temFilialEm(E, j.mapaAdv))});
        fora.push({id:o.id, torcida:o.nome, alvo:alvo.id, dia});
        break;
      }
    }
    return fora;
  }

  /* =======================================================
     O CALENDÁRIO DO TRIMESTRE (decisão do autor)
     A cada 13 semanas: 1 a 2 TRETAS MARCADAS em rua e, na
     maioria dos trimestres, 1 ataque ao nosso bar. Agendado por
     hash — o mesmo bloco dá sempre o mesmo calendário — e sempre
     FORA de dia de jogo do clube e de dia de caravana.

     A DOSE CAIU PELA METADE (decisão do dono, 24/08/2026): era 2 a 4
     tretas (média 3) e 1 a 2 ataques ao bar (média 1,5) por trimestre.
     Agora é 1 a 2 tretas (média 1,5) e 3 trimestres com ataque pra 1
     sem (média 0,75). A conta vale igual pro mundo inteiro: as IAs
     puxam o mesmo sorteio.
     ======================================================= */
  const SEMANAS_TRI = 13;

  /* sem `id` é o calendário do jogador; com `id`, o da torcida IA —
     o mesmo sorteio por hash vale pro mundo inteiro */
  function eventosDoTrimestre(E, id){
    const H = TO.mapa.hash;
    const bloco = Math.floor((semanaAbs(E) - 1) / SEMANAS_TRI);
    const chave = `tri|${bloco}|${id || E.torcida.id}`;
    /* 0, 1 ou 2 tretas (30% / 50% / 20%, média 0,9): os 40% a menos do
       dono (08/09/2026) sobre a média antiga de 1,5. O bar não muda. */
    const dado = H(chave + '|nt') % 10;
    const nTreta = dado < 3 ? 0 : dado < 8 ? 1 : 2;
    /* A CASA DE PISCINA DIVIDE COM O BAR (pedido do dono, 21/09/2026):
       o ataque do trimestre segue vindo em 3 de 4 blocos, mas metade
       das vezes o alvo é a resenha da zona numa casa de piscina, e a
       outra metade o bar — o bar caiu 50% pra abrir espaço pra casa.
       O mesmo dado decide os dois, pra nunca vir bar E casa no bloco. */
    const dadoB  = H(chave + '|nb') % 8;
    const nBar   = dadoB < 3 ? 1 : 0;              // 3/8 (era 3/4)
    const nCasa  = dadoB >= 3 && dadoB < 6 ? 1 : 0; // 3/8
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
    for(let i=0;i<nCasa;i++)  poe('casa', i);
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
      /* três em quatro tretas são com maior rival, se houver (dono,
         08/09/2026); a quarta continua sorteando no balde inteiro */
      const maiores = balde.filter(o=>ehMaiorRival(E, E.torcida.id, o.id));
      if(maiores.length && TO.mapa.hash(`${semente}|mr`) % 4)
        return maiores[TO.mapa.hash(`${semente}|rival`) % maiores.length];
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
  /* O ESFRIAR MORREU (ordem do dono, 31/08/2026): a relação não anda
     mais sozinha de volta pra base — nem a nossa, nem a das IAs entre
     si. O que se constrói ou se quebra fica construído ou quebrado, e
     só EVENTO move o ponteiro: briga, recepção, escolta, aniversário,
     reunião — e a convivência do dono (17/08), que lê as marcas de
     hostilidade e ajuda reais, não o relógio puro. */

  /* =======================================================
     CONVIVÊNCIA (decisão do dono, 17/08/2026)
     Mês (4 semanas) sem hostilidade entre nós e uma torcida
     melhora a relação em +1; dois meses (8 semanas) sem
     nenhuma ajuda pioram em −1. O relógio de cada torcida
     zera na última briga (marcaHostil, via hostilidade) e na
     última ajuda (marcaAjuda: escolta, recepção, reunião).
     ======================================================= */
  /* A RÉGUA REVISTA (ordem do dono, 03/09/2026): a paz pagava +1 por
     mês e a secura cobrava −1 a cada dois — saldo de +0,5 por mês, ou
     +65 numa década. Era isso que deixava o mundo inteiro aliado sem
     ninguém fazer nada. Agora a paz paga +0,2 e a secura cobra os
     mesmos −1: relação sem contato APODRECE, e aliado de verdade só
     se sustenta com evento — recepção, escolta, descer pela outra. */
  const PAZ_MES  =  0.2;
  const SECO_MES = -1;

  /* O MUNDO NÃO ANDA EM BLOCO (correção do dono, 15/09/2026)
     A régua acima era a MESMA para as 386 torcidas, e o relógio de
     todas começava no mesmo dia: quem nunca cruzou com a gente tinha,
     ano após ano, exatamente o mesmo número que todas as outras. Aí
     bastava esse número encostar numa linha de status pra o mundo
     inteiro atravessar de uma vez — foi o que deu 286 torcidas
     perguntando a mesma coisa na semana 50 de 2029.
     Agora cada torcida tem o passo dela, sorteado por hash do id e
     fixo pra sempre: a paz rende de +0,1 a +0,3 por mês e a secura
     cobra de −0,6 a −1,4 a cada dois, e o primeiro vencimento de cada
     uma cai numa semana diferente. A régua do dono continua a mesma na
     média; o que acaba é o pelotão andando em fila. */
  const passoDaPaz  = id => PAZ_MES  * (0.5 + (TO.mapa.hash(`conv|paz|${id}`)  % 101) / 100);
  const passoDaSeca = id => SECO_MES * (0.6 + (TO.mapa.hash(`conv|seca|${id}`) %  81) / 100);
  const atrasoDaPaz  = id => TO.mapa.hash(`conv|dp|${id}`) % 4;
  const atrasoDaSeca = id => TO.mapa.hash(`conv|ds|${id}`) % 8;

  function convivencia(E){
    const sa = semanaAbs(E);
    E.marcaHostil = E.marcaHostil || {};
    E.marcaAjuda  = E.marcaAjuda  || {};
    E.convivenciaDesde = E.convivenciaDesde || sa;
    for(const o of M().jogaveis()){
      if(o.id === E.torcida.id || o.incompleta) continue;
      const h0 = E.marcaHostil[o.id] || (E.convivenciaDesde + atrasoDaPaz(o.id));
      if(sa - h0 >= 4){
        E.relacoes[o.id] = U.limitar(nivel(E, o.id) + passoDaPaz(o.id), -100, 100);
        E.marcaHostil[o.id] = h0 + 4;      // um passo por mês cheio de paz
      }
      const a0 = E.marcaAjuda[o.id] || (E.convivenciaDesde + atrasoDaSeca(o.id));
      if(sa - a0 >= 8){
        E.relacoes[o.id] = U.limitar(nivel(E, o.id) + passoDaSeca(o.id), -100, 100);
        E.marcaAjuda[o.id] = a0 + 8;       // e a conta dos dois meses secos
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
  /* =======================================================
     O QUADRO VIVO DELAS (régua do dono, 20/08/2026)

     Antes a ficha delas era uma CONTA CONGELADA: a pirâmide de
     cargos da fonte, e pronto. Quem crescia só ganhava novato,
     então a torcida ficava mais FRACA quanto mais crescia (5,7
     com 20 membros, 3,5 com 250) e nunca passava disso, com ou
     sem professor.

     Agora cada torcida do mundo tem quadro de verdade: quantos
     em cada cargo e a força média de cada cargo. Ela TREINA
     todo dia, como a nossa — o mesmo passo de 0 a 0,3 por
     sessão, o mesmo número de vagas de treino por nível de sede
     e o mesmo dobro com o professor de MMA —, e PROMOVE pelas
     nossas regras: o cargo só sobe quando encosta na força que
     a promoção exige, custa o mesmo dinheiro e a Diretoria tem
     o mesmo teto por nível de sede.
     ======================================================= */
  const BASE_FICHA = {novato:1, componente:5, frente:10, diretoria:14};
  const ESCADA = ['novato', 'componente', 'frente', 'diretoria'];
  /* quanto do cargo sobe por semana: promoção é ato de diretoria, não
     enxurrada — um décimo do grupo apto por vez */
  const FATIA_PROMO = 0.10;

  function quadroDe(E, id){
    const t = (E.mundoTorcidas||{})[id];
    if(!t) return null;
    if(!t.quadro){
      const o = M().torcida(id);
      const cargos = {novato:0, componente:0, frente:0, diretoria:0}, forca = {};
      for(const [c, n] of TO.membros.planoDeCargos(t.membros, o && o.cargos, t.sede))
        cargos[c] = (cargos[c] || 0) + n;
      const xp = {}, desgaste = {};
      for(const c of ESCADA){ forca[c] = BASE_FICHA[c] + 1.5; xp[c] = 0; desgaste[c] = 0; }
      t.quadro = {cargos, forca, xp, desgaste, total: t.membros};
    }
    /* o efetivo mexeu desde ontem: quem entra entra por baixo, e quem
       sai sai por baixo também — a mesma porta */
    const q = t.quadro, dif = Math.round(t.membros) - q.total;
    /* save de antes do quadro vivo ganha a coluna de XP */
    if(!q.xp){ q.xp = {}; for(const c of ESCADA) q.xp[c] = 0; }
    if(!q.desgaste){ q.desgaste = {}; for(const c of ESCADA) q.desgaste[c] = 0; }
    if(dif > 0){
      const n = q.cargos.novato;
      q.forca.novato = (n*q.forca.novato + dif*BASE_FICHA.novato)/(n + dif);
      q.xp.novato    = (n*q.xp.novato)/(n + dif);   // quem chega chega zerado
      q.cargos.novato += dif;
    } else if(dif < 0){
      let sai = -dif;
      for(const c of ESCADA){
        const leva = Math.min(sai, q.cargos[c]);
        q.cargos[c] -= leva; sai -= leva;
        if(!sai) break;
      }
    }
    q.total = Math.round(t.membros);
    return q;
  }

  /* a média do quadro: é o número que o ranking mostra */
  function mediaDoQuadro(q){
    let soma = 0, n = 0;
    for(const c of ESCADA){ soma += q.cargos[c]*q.forca[c]; n += q.cargos[c]; }
    return n ? soma/n : BASE_FICHA.novato + 1.5;
  }

  /* O TREINO DELAS, todo dia. As vagas de treino são as da sede (2 no
     nível 1, 20 no 5), então quem tem sede grande treina mais gente:
     o passo médio da NOSSA sessão é 0,15, e o professor dobra. */
  function treinarDelas(E){
    const m = mundo(E);
    for(const id of Object.keys(m)){
      const t = m[id];
      const q = quadroDe(E, id);
      if(!q || !q.total) continue;
      const vagas = Math.round(TO.membros.SEDE[t.sede].treino *
        TO.membros.AREA_TREINO[t.areaTreino || 0]);
      const fatia = Math.min(vagas, q.total)/q.total;
      const passo = fatia * 0.15 * ganhoDeleas(t);
      /* QUEM TREINA CHEGA LÁ (ordem do dono, 09/09/2026): a média do
         grupo sobe devagar porque as vagas se diluem em todo mundo, mas
         as vagas são gente de verdade: quem senta na sala todo dia sobe
         0,15 por sessão (o dobro com professor) e em ~50 dias sai de 1
         pra 8, que é a régua da promoção. `aptos[c]` conta essa gente:
         as vagas do dia repartidas pelos cargos promovíveis, cada uma
         entregando 0,15·ganho de força, e o apto nasce quando junta a
         força que falta do piso do cargo até a exigência. */
      q.aptos = q.aptos || {novato:0, componente:0, frente:0};
      const promoviveis = ESCADA.slice(0, 3);
      const somaN = promoviveis.reduce((a,c)=>a + q.cargos[c], 0);
      if(somaN > 0){
        const vagasReais = Math.min(vagas, somaN);
        for(const c of promoviveis){
          const vagasC = vagasReais * q.cargos[c] / somaN;
          const falta = Math.max(1, TO.membros.CARGOS[c].forcaPromo - BASE_FICHA[c]);
          q.aptos[c] = Math.min(q.cargos[c], q.aptos[c] + vagasC * 0.15 * ganhoDeleas(t) / falta);
        }
      }
      for(const c of ESCADA){
        /* o teto do grupo é o do cargo menos o desgaste permanente que
           sequela e idade já cobraram — treino não devolve isso */
        const teto = Math.max(1, TO.membros.CARGOS[c].teto - (q.desgaste[c] || 0));
        q.forca[c] = Math.min(teto, q.forca[c] + passo);
        /* 1 de XP por sessão, como o nosso — e o professor NÃO dobra
           XP, só treino: quem sobe de cargo sobe pelo rodado */
        q.xp[c] += fatia;
      }
    }
  }

  /* A PROMOÇÃO DELAS, toda semana, ANTES da compra da fila e pelas
     NOSSAS regras — e TODO APTO SOBE (ordem do dono, 09/09/2026): "se
     tem membro pra promover e dinheiro em caixa, promove, registra no
     financeiro". Os aptos são os que o treino formou (`q.aptos`, ver
     treinarDelas) e que têm o XP rodado do cargo. Limites que ficam:
     o caixa (cada promoção custa o que custa pra nós) e o teto da
     Diretoria por sede — o apto barrado continua apto, esperando a
     vaga. A promoção vai pro extrato delas. */
  /* a reposição de faixa e bandeira das IAs: uma de cada, a mais cara
     primeiro; devolve true se comprou alguma */
  function reporPanos(E, t, id){
    const pan = P().faixasIA(E, id);
    if(!pan) return false;
    let comprou = false;
    if(pan.faixas < 1 && t.caixa >= P().FAIXA.custo){
      t.caixa -= P().FAIXA.custo; pan.faixas = 1; comprou = true;
      lancarIA(E, id, 'Faixa nova', -P().FAIXA.custo);
    }
    if(pan.bandeiras < 1 && t.caixa >= P().BANDEIRA.custo){
      t.caixa -= P().BANDEIRA.custo; pan.bandeiras = 1; comprou = true;
      lancarIA(E, id, 'Bandeira nova', -P().BANDEIRA.custo);
    }
    return comprou;
  }

  function promoverDelas(E, t, id){
    const q = quadroDe(E, id);
    if(!q) return 0;
    q.aptos = q.aptos || {novato:0, componente:0, frente:0};
    const C = TO.membros.CARGOS;
    let subiram = 0;
    for(let i = ESCADA.length - 2; i >= 0; i--){
      const cargo = ESCADA[i], acima = ESCADA[i+1], c = C[cargo];
      if(!q.cargos[cargo]) { q.aptos[cargo] = 0; continue; }
      if(q.xp[cargo] < c.xpPromo) continue;
      let quantos = Math.min(q.cargos[cargo], Math.floor(q.aptos[cargo] + 1e-9));
      if(quantos <= 0) continue;
      if(acima === 'diretoria')
        quantos = Math.min(quantos,
          Math.max(0, TO.membros.SEDE[t.sede].diretoria - q.cargos.diretoria));
      if(c.custoPromo) quantos = Math.min(quantos, Math.floor(t.caixa/c.custoPromo));
      if(quantos <= 0) continue;
      const custo = quantos * c.custoPromo;
      t.caixa -= custo;
      if(custo) lancarIA(E, id, `Promoção de ${quantos} a ${C[acima].nome}`, -custo);
      /* quem sobe chega com a força da régua; quem fica perde essa
         gente de cima e a média do cargo cede um pouco */
      const n = q.cargos[acima], N = q.cargos[cargo], resto = N - quantos;
      const fSobe = Math.max(c.forcaPromo, q.forca[cargo]);
      q.forca[acima] = (n*q.forca[acima] + quantos*fSobe)/(n + quantos);
      if(resto > 0) q.forca[cargo] = U.limitar((N*q.forca[cargo] - quantos*fSobe)/resto, BASE_FICHA[cargo], q.forca[cargo]);
      q.cargos[acima] += quantos;
      q.cargos[cargo] -= quantos;
      q.aptos[cargo] -= quantos;
      subiram += quantos;
    }
    return subiram;
  }

  function mediaDeFichaGerada(o, membrosVivos, E){
    /* SEM BÔNUS DE PODER (decisão do dono, 18/08/2026): a ficha vem só
       do cargo. O `poder` da fonte dava até +3 por cabeça e cravava as
       gigantes acima de todo mundo por decreto; agora o que separa as
       torcidas na média é a pirâmide de cargos e o tamanho. */
    /* professor de MMA delas (decisão do dono, 18/08/2026): quem paga
       os R$ 2.000 por mês tem gente mais treinada — +1 por cabeça, o
       espelho do treino em dobro que o professor dá pro jogador. */
    /* com quadro vivo, a média É o quadro: o professor já entrou nela
       pelo treino em dobro, e não vale contar duas vezes */
    const t = E && E.mundoTorcidas && E.mundoTorcidas[o.id];
    if(t) return mediaDoQuadro(quadroDe(E, o.id));
    /* sem mundo vivo (tela de seleção, bancada), a conta velha */
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
  const CHANCE_BRIGA_JOGO = 0.18 * FREIO_BRIGA * FREIO_IA;
  /* a fatia de brigas entre elas em que a faixa ou a bandeira muda de mão */
  const CHANCE_PANO_BRIGA = 0.05;   // 10,8% × freio das IAs
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
    /* o núcleo destacado pra subsede não está na praça da sede — a
       mesma régua nossa, onde o membro com `filial` sai do bonde de
       casa (ordem do dono, 03/09/2026) */
    const naFilial = t
      ? (t.filiais||[]).reduce((s,f)=>s + (f.membros||0), 0) : 0;
    return Math.max(0, Math.round(total) - foraDeCombate(E, id) - naFilial);
  }

  /* quantos ônibus a torcida da IA tem: save antigo guardava `true` */
  /* e a garagem delas também: ônibus que não cabe na sede não roda */
  const frotaIA = t => !t || !t.onibus ? 0
    : U.limitar(Math.round(t.onibus === true ? 1 : t.onibus), 0,
                FIN().cabeNaSede(t.sede));

  /* =======================================================
     O PLACAR DE BRIGAS DO ANO (pedido do dono, 20/08/2026)
     Quantas brigas cada torcida venceu e perdeu no ano corrente. O
     saldo (vitórias − derrotas) é a coluna nova do ranking. Vira o
     ano, zera: o contador guarda o ano dele e se refaz sozinho.
     ======================================================= */
  function placarDoAno(E, id){
    if(!E || !id) return null;
    const zero = ()=>({ano:E.data.ano, v:0, d:0});
    if(id === E.torcida.id){
      if(!E.brigasAno || E.brigasAno.ano !== E.data.ano) E.brigasAno = zero();
      return E.brigasAno;
    }
    const t = mundo(E)[id];
    if(!t) return null;
    if(!t.brigasAno || t.brigasAno.ano !== E.data.ano) t.brigasAno = zero();
    return t.brigasAno;
  }
  /* A NOITE DE BRIGA DELAS TAMBÉM RENDE XP, na mesma tabela da nossa
     (3 a 15 pela escala do bonde, ×1,5 pra quem ganha). Sem isso o
     mundo só subiria de cargo pelo treino, e cargo alto (300 de XP
     pra Diretoria) nunca sairia — do mesmo jeito que não sai pra nós
     numa temporada de paz. */
  function xpDeBrigaIA(E, id, venceu, escala){
    const q = quadroDe(E, id);
    if(!q) return;
    const base = escala <= 10 ? 3 : escala <= 30 ? 6 : escala <= 60 ? 10 : 15;
    const ganho = Math.round(base * (venceu ? 1.5 : 1));
    /* SEM DILUIR PELO EFETIVO. Do nosso lado quem vai pra rua leva o
       XP inteiro da noite, e é justamente esse pessoal — o mesmo bonde
       de sempre — que sobe de cargo. Repartir o ganho por toda a
       torcida faria a média subir 1 por ano e ninguém promoveria
       nunca: a média aqui representa quem roda, não quem fica. */
    for(const c of ESCADA) q.xp[c] += ganho;
  }

  function anotarBriga(E, id, venceu, escala){
    /* a torcida do jogador não tem quadro no mundo: o XP dela vem das
       fichas de verdade, que a cena já credita membro a membro */
    if(E.torcida && id !== E.torcida.id) xpDeBrigaIA(E, id, venceu, escala);
    const p = placarDoAno(E, id);
    if(!p) return null;
    if(venceu) p.v++; else p.d++;
    return p;
  }
  const saldoDoAno = (E, id)=>{
    const p = placarDoAno(E, id);
    return p ? p.v - p.d : 0;
  };

  /* todo registro passa por aqui: alimenta a aba Brigas, a notícia de
     segunda e o contador que invalida o cache do ranking */
  function registrarBrigaIA(E, reg){
    E.brigasIA = E.brigasIA || [];
    /* a dívida entre elas: a briga é revanche se algum lado devia ao
       outro; depois, quem perdeu anota e quem ganhou quita */
    if(reg.a && reg.b && reg.a.id && reg.b.id){
      const devA = !!dividaIA(E, reg.a.id, reg.b.id);
      const devB = !!dividaIA(E, reg.b.id, reg.a.id);
      reg.revanche = reg.revanche || devA || devB;
      const venc = reg.ganhouA ? reg.a.id : reg.b.id;
      const perd = reg.ganhouA ? reg.b.id : reg.a.id;
      const perdDevia = reg.ganhouA ? devB : devA;
      /* QUEM TENTA SE VINGAR E SE DÁ MAL DEIXA QUIETO (regra do dono,
         08/09/2026): a dívida da perdedora some em vez de renascer — sem
         isso a Cearamor voltava toda semana. E se ela era a que veio
         cobrar (o lado `a` é quem toma a iniciativa), a derrota custa
         mais que uma derrota comum: moral e prestígio em dobro. */
      if(perdDevia){
        quitarDividaIA(E, perd, venc);
        if(perd === reg.a.id){
          reg.vingancaFrustrada = true;
          mover(E, perd, 'moral', -VINGANCA_FRUSTRADA.moral);
          mover(E, perd, 'prestigio', -VINGANCA_FRUSTRADA.prestigio);
        }
      } else anotarDividaIA(E, perd, venc);
      quitarDividaIA(E, venc, perd);
    }
    /* A PEÇA MUDA DE MÃO NA RUA (ordem do dono, 09/09/2026): em cerca de
       5% das brigas entre elas o vencedor leva a faixa ou a bandeira do
       perdedor — a que ele tem; as duas, tira na sorte. Vale o mesmo
       prestígio da arquibancada (faixa −10/+5, bandeira −5/+2 na régua
       de 0 a 100), e a semana seguinte o perdedor repõe na loja. */
    if(reg.a && reg.b && reg.a.id && reg.b.id && reg.ganhouA != null &&
       U.rng() < CHANCE_PANO_BRIGA){
      const venc = reg.ganhouA ? reg.a : reg.b, perd = reg.ganhouA ? reg.b : reg.a;
      const dona = P().faixasIA(E, perd.id), quem = P().faixasIA(E, venc.id);
      if(dona && quem){
        const tem = [];
        if(dona.faixas > 0) tem.push('faixa');
        if(dona.bandeiras > 0) tem.push('bandeira');
        if(tem.length){
          const tipo = tem[Math.floor(U.rng()*tem.length)];
          const V = tipo === 'bandeira' ? P().BANDEIRA : P().FAIXA;
          if(tipo === 'bandeira') dona.bandeiras--; else dona.faixas--;
          quem[tipo === 'bandeira' ? 'bandeirasTomadas' : 'faixasTomadas']
            .push({de:perd.id, nome:perd.nome, ano:E.data.ano});
          mover(E, perd.id, 'prestigio', -V.perda/5);
          mover(E, venc.id, 'prestigio', V.ganho/5);
          reg.pano = {tipo, de:perd.nome, deId:perd.id, para:venc.nome};
        }
      }
    }
    E.brigasIA.unshift(reg);
    /* a maior treta do ano é medida na hora: o anuário lê no fim, e
       varrer o feed lá na frente não acharia a briga de janeiro */
    if(TO.almanaque && TO.almanaque.anotarTreta) TO.almanaque.anotarTreta(E, reg);
    if(E.brigasIA.length > 300) E.brigasIA.pop();
    E.brigasIATotal = (E.brigasIATotal || 0) + 1;
    /* o placar do ano de cada lado, que vira o saldo no ranking — e a
       noite rendeu XP pros dois, na tabela da nossa */
    if(reg.a && reg.a.id) anotarBriga(E, reg.a.id, !!reg.ganhouA, reg.a.n);
    if(reg.b && reg.b.id) anotarBriga(E, reg.b.id, !reg.ganhouA, reg.b.n);
    /* a noite zera o relógio da paz dos dois e cobra o que custou */
    const m = E.mundoTorcidas || {}, abs = E.data.absoluto || 0;
    for(const lado of [reg.a, reg.b]){
      if(!lado || !lado.id || !m[lado.id]) continue;
      m[lado.id].ultimaBrigaIA = abs;
      desgasteDaNoite(E, lado.id, lado.feridos, lado.presos);
    }
    return reg;
  }

  /* BAIXA VINDA DE BRIGA NOSSA (conferência do dono, 18/08/2026): o
     rival que apanha da gente também sai de circulação — ferido 30
     dias fora, preso de 15 a 90 — na mesma régua das brigas entre
     IAs. Antes a mensagem contava os feridos e o efetivo dele
     seguia inteiro. */
  /* =======================================================
     O DESGASTE DELAS (régua do dono, 20/08/2026)
     As mesmas quatro cobranças da nossa ficha, traduzidas pro
     quadro por cargo: sequela de briga, ferrugem de cadeia,
     ferrugem da paz e idade. Elas não têm ficha individual —
     o que se mexe é a MÉDIA do cargo, na proporção de quantos
     do grupo passaram por aquilo.
     ======================================================= */
  /* membros.js carrega DEPOIS deste arquivo: a régua da idade tem de
     ser lida na hora de usar, não na hora de definir */
  const M_ = () => TO.membros;
  /* uma sequela custa de 0,06 a 0,15 (30% da régua velha, decisão do
     dono, 24/08/2026), e pega 15% dos feridos: na média do grupo isso
     é 0,15 × 0,105 por ferido */
  const SEQUELA_MEDIA = 0.15 * 0.105;
  /* a pena média de briga fica na faixa dos 30 a 60 dias, que a tabela
     do dono (a 30%) cobra em 0,3 */
  const CADEIA_MEDIA = 0.3;

  function desgastarQuadro(E, id, quanto, permanente){
    const q = quadroDe(E, id);
    if(!q || !quanto) return;
    for(const c of ESCADA){
      if(permanente) q.desgaste[c] = (q.desgaste[c] || 0) + quanto;
      q.forca[c] = Math.max(1, q.forca[c] - quanto);
    }
  }
  /* o que a noite cobrou do grupo: feridos deixam sequela e presos
     voltam enferrujados, diluídos no efetivo que ficou */
  function desgasteDaNoite(E, id, feridos, presos){
    const q = quadroDe(E, id);
    if(!q || !q.total) return;
    /* sequela deixa marca (teto abaixo); cadeia só enferruja */
    desgastarQuadro(E, id, ((feridos||0)*SEQUELA_MEDIA)/q.total, true);
    desgastarQuadro(E, id, ((presos||0)*CADEIA_MEDIA)/q.total, false);
  }

  /* A FERRUGEM DA PAZ delas: a mesma régua nossa — 0,2 a cada 20 dias
     sem briga. O relógio de cada uma é a última briga registrada. */
  function ferrugemDaPaz(E){
    const m = mundo(E), abs = E.data.absoluto || 0;
    for(const id of Object.keys(m)){
      const t = m[id];
      if(t.ultimaBrigaIA == null) t.ultimaBrigaIA = abs;
      const marco = Math.max(t.ultimaBrigaIA, t.ultimaFerrugem || 0);
      if(abs - marco < 20) continue;
      t.ultimaFerrugem = abs;
      desgastarQuadro(E, id, 0.2);
    }
  }

  /* A IDADE DELAS. Sem ficha individual não há como saber quem tem 35;
     o que dá pra saber é quanto do grupo tem. Com as idades espalhadas
     de 16 a 45 como as nossas, todo ano 11 dos 30 anos de faixa estão
     no declínio (0,6 cada) e 1 dos 30 pendura a bandeira. */
  const faixaDeIdade = () => M_().IDADE_MAX - M_().IDADE_MIN + 1;
  const desgasteDelas = () => M_().DESGASTE_ANO *
    (M_().IDADE_MAX - M_().IDADE_DECLINIO + 1) / faixaDeIdade();
  const aposentaPorAno = () => 1 / faixaDeIdade();
  function envelhecerDelas(E){
    const m = mundo(E);
    const FAIXA = faixaDeIdade(), APOSENTA = aposentaPorAno();
    for(const id of Object.keys(m)){
      const t = m[id];
      const q = quadroDe(E, id);
      if(!q || !q.total) continue;
      desgastarQuadro(E, id, desgasteDelas(), true);   // idade não volta
      /* quem pendura a bandeira sai do efetivo; o recrutamento repõe
         por baixo, que é o que puxa a média da torcida pra baixo.
         SAI DE TODO CARGO, na mesma proporção: idade não escolhe
         patente. Tirar os 3,3% só do topo esvaziava a Diretoria e a
         Linha de Frente em poucos anos — o mundo inteiro virava
         novato e a força média despencava pra 6 e ficava lá. */
      for(const c of ESCADA)
        q.cargos[c] = Math.max(0, q.cargos[c] - Math.round(q.cargos[c] * APOSENTA));
      q.total = ESCADA.reduce((s,c)=>s+q.cargos[c], 0);
      /* quem pendurou a bandeira levou o desgaste junto: o grupo que
         fica é mais novo, e o teto dele alivia na mesma proporção */
      for(const c of ESCADA)
        q.desgaste[c] = Math.max(0, (q.desgaste[c] || 0) * (1 - APOSENTA*FAIXA/6));
      t.membros = Math.max(1, q.total);
      t.piso = Math.min(t.piso, t.membros);
    }
  }

  function baixasIA(E, id, feridos, presos){
    const t = mundo(E)[id];
    if(!t) return;
    desgasteDaNoite(E, id, feridos, presos);
    /* o contador entra na chave do cache do ranking: baixa nossa tem
       de derrubar a posição deles na hora, como a briga de IA já faz */
    E.baixasIASeq = (E.baixasIASeq || 0) + 1;
    const abs = E.data.absoluto || 0;
    if(feridos > 0)
      (t.feridosIA = t.feridosIA||[]).push({n:Math.round(feridos),
                                          ate: abs + camaIA(t)});
    if(presos > 0)
      (t.presosIA = t.presosIA||[]).push({n:Math.round(presos),
                                          ate: abs + penaIA(t)});
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
          .push({n:feridos, ate: abs + camaIA(t)});
        if(presos) (t.presosIA = t.presosIA||[])
          .push({n:presos, ate: abs + penaIA(t)});
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
      moverRelacao(E, dono.id, aj.o.id, +REL.iaAjudouAmiga);
      moverRelacao(E, aj.o.id, rivalDe.id, -REL.iaAjudouRival);
    }
    /* O PRESTÍGIO ACOMPANHA A BRIGA (decisão do dono, 17/08/2026;
       zebra engordada em 18/08): briga grande move mais, e zebra —
       vencer em menor número — move MUITO mais: +4 na régua de 0 a
       100 e teto 10 (a comum fica no teto 8), e a moral do zebra
       vencedor dobra (+1,2 contra +0,6 da vitória comum). O vencedor
       leva, o perdedor devolve; a relação entre os dois azeda — e
       fica azeda: o esfriar passivo morreu (dono, 31/08/2026). */
    const zebra = ganhouA ? nA < nB : nB < nA;
    const swingDisplay = U.limitar(
      Math.round(1 + (nA + nB)/25) + (zebra ? 4 : 0), 1, zebra ? 10 : 8);
    const swing = swingDisplay/5;
    mover(E, ganhouA ? a.id : b.id, 'prestigio', swing);
    mover(E, ganhouA ? a.id : b.id, 'moral', zebra ? 1.2 : 0.6);
    mover(E, ganhouA ? b.id : a.id, 'prestigio', -swing);
    mover(E, ganhouA ? b.id : a.id, 'moral', -0.6);
    moverRelacao(E, a.id, b.id, -REL.iaBriga);
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
      /* a maioria das brigas é entre maiores rivais quando há par assim
         (dono, 08/09/2026): três em quatro vezes o sorteio é só entre eles */
      const paresMR = pares.filter(([a,b])=>ehMaiorRival(E, a.id, b.id));
      const balde = (paresMR.length && U.rng() < 0.75) ? paresMR : pares;
      const [a, b] = balde[Math.floor(U.rng()*balde.length)];
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
     A RECEPÇÃO ENTRE ELAS (ordem do dono, 03/09/2026)
     O mundo acolhe aliado como a gente acolhe. Quando a torcida
     vai jogar na praça de uma aliada e NÃO tem subsede lá, quem
     decide é a dona da casa — a aliada mais próxima da praça:
     30% hospeda e escolta, 20% só hospeda, 50% não recebe. A
     conta é a nossa (R$ 50 e R$ 25 por cabeça, da tabela de
     RECEPÇÃO do planejamento) e a relação anda pela mesma
     tabela: +12, +7 ou −7. Casa sem caixa pro combinado não
     recebe — igualzinho ao nosso fechamento.
     ======================================================= */
  function recepcaoIA(E, o, t, jogos){
    for(const j of (jogos||[])){
      if(j.casa) continue;
      const adv = M().time(j.adversario);
      if(!adv || adv.mapa === o.mapa) continue;
      const destino = adv.mapa;
      if((t.filiais||[]).some(f=>f.cidade === destino)) continue;
      const n = TO.planejamento.caravanaDe(o, 0, E);
      if(n < 2) continue;
      /* a casa é UMA só: a aliada mais próxima que mora na praça */
      const anf = M().torcidasEm(destino)
        .filter(x => x.id !== o.id && x.id !== E.torcida.id && !x.incompleta &&
                     relacaoDelas(E, o.id, x.id) >= ALIADO)
        .sort((x,y)=>relacaoDelas(E,o.id,y.id) - relacaoDelas(E,o.id,x.id))[0];
      if(!anf) continue;
      const ta = (E.mundoTorcidas||{})[anf.id];
      const d = U.rng();
      let nivel = d < 0.30 ? 'escolta' : d < 0.50 ? 'hospedar' : 'nada';
      const porCabeca = {escolta:50, hospedar:25, nada:0}[nivel];
      let custo = porCabeca * n;
      if(ta && custo > ta.caixa){ nivel = 'nada'; custo = 0; }
      if(custo > 0 && ta){
        ta.caixa -= custo;
        lancarIA(E, anf.id, `Recepção da ${o.nome} (${n} cabeças)`, -custo);
        /* e fica anotado pro balanço mensal do perfil dela (ordem do
           dono, 03/09/2026): a recepção é gasto de evento, então o
           balanço mostra o que ela gastou nas últimas 4 semanas */
        (ta.recepcoes = ta.recepcoes || []).push({sem: semanaAbs(E), v: custo});
      }
      moverRelacao(E, o.id, anf.id,
        nivel === 'escolta'  ? ganhoRepetido(E, o.id, anf.id, 'caravana', REL.hospedarEscolta)
      : nivel === 'hospedar' ? ganhoRepetido(E, o.id, anf.id, 'caravana', REL.hospedar)
      : -REL.naoReceber);
    }
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
    /* a credora passa na frente: treta marcada e bar viram cobrança */
    const credora = lista.find(x=>dividaIA(E, o.id, x.id));
    if(credora) return credora;
    if(semente){
      const maiores = lista.filter(x=>ehMaiorRival(E, o.id, x.id));
      if(maiores.length && TO.mapa.hash(`${semente}|mr`) % 4)
        return maiores[TO.mapa.hash(`${semente}|rv`) % maiores.length];
      return lista[TO.mapa.hash(`${semente}|rv`) % lista.length];
    }
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
      if(t && n) (t.feridosIA = t.feridosIA||[]).push({n, ate: abs + camaIA(t)});
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
    moverRelacao(E, o.id, r.id, -REL.iaTreta);
    return registrarBrigaIA(E, {
      ano:E.data.ano, semana:E.data.semana, dia:E.data.dia,
      cidade:(M().cidade(o.mapa)||{}).nome || o.mapa, jogo:'treta marcada',
      a:{id:o.id, nome:o.nome, n:tam, feridos:fA, presos:0},
      b:{id:r.id, nome:r.nome, n:tam, feridos:fB, presos:0},
      vencedor: ganhouA ? o.nome : r.nome, prestigio:display, ganhouA
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
      /* o dinheiro já mudava de mão, mas em silêncio: agora entra no
         extrato dos dois lados, como qualquer conta delas (ordem do
         dono, 03/09/2026) */
      if(tDono){
        tDono.caixa -= saque;
        lancarIA(E, o.id, `Bar saqueado pela ${atk.nome}`, -saque);
      }
      if(tAtk){
        tAtk.caixa += saque;
        lancarIA(E, atk.id, `Saque no bar da ${o.nome}`, saque);
      }
      /* e o bar do dono sai quebrado, metade da receita por 45 dias —
         a mesma régua do nosso (dono, 10/09/2026) */
      const bd = tDono && FIN().barMaisVisado(tDono.bares);
      if(bd){
        FIN().danificarBar(bd, (E.data && E.data.absoluto) || 0);
        reg.barQuebrado = true;
        /* bar quebrado é notícia de rua (dono, 19/09/2026) */
        if(TO.feed && TO.feed.registrarObra && TO.feed.obraInteressa(E, o.id))
          TO.feed.registrarObra(E,
            {tipo:'bar-quebrado', dono:o.id, atacante:atk.id});
      }
      reg.saque = saque;
    }
    return reg;
  }

  /* o ATAQUE-SURPRESA delas: relação fervendo (≤ −55) vem sozinha em
     dia comum — a mesma régua nossa (chance cresce com a mágoa e com
     a ousadia dela), diluída no dia */
  function surpresaIA(E, o){
    const hostis = credorasPrimeiro(E, o.id, hostisLocaisIA(E, o).sort((x,y)=>
      (ehMaiorRival(E, o.id, y.id)?1:0) - (ehMaiorRival(E, o.id, x.id)?1:0) ||
      relacaoDelas(E, o.id, x.id) - relacaoDelas(E, o.id, y.id)));
    for(const v of hostis){
      const rel = relacaoDelas(E, o.id, v.id);
      if(rel > QUENTE) continue;
      if(vivoDe(E, o.id) < vivoDe(E, v.id) * 0.5) continue;
      const t = (E.mundoTorcidas||{})[o.id];
      const briga = brigaDe(t);
      const cobra = !!dividaIA(E, o.id, v.id);
      const chance = ((QUENTE - rel)/(100 + QUENTE)) * 0.28 * briga / 7
                     * FREIO_BRIGA * (cobra ? 1 : FREIO_IA * pesoDoRival(E, o.id, v.id));
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
      if(U.rng() > 0.10 * FREIO_BRIGA * FREIO_IA) continue;      // 6% × freio das IAs
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
        const hostis = M().torcidasEm(cid).filter(x =>
          !x.incompleta && x.id !== E.torcida.id && x.id !== o.id &&
          x.clubeId !== o.clubeId &&
          !(M().saoIrmas && M().saoIrmas(o.id, x.id)) &&
          (relacaoDelas(E, o.id, x.id) <= HOSTIL ||
           ['Rival','Maior Rival'].includes(M().relacaoBase(o.id, x.id))));
        /* o maior rival da praça fecha a pista primeiro */
        const emb = hostis.find(x=>ehMaiorRival(E, o.id, x.id)) || hostis[0];
        if(!emb) continue;
        const r = brigaIA(E, emb, o, cid, 'emboscada na estrada');
        if(r) fora.push(r);
        break;
      }
    }
  }

  /* o EXPEDIENTE DA SEDE delas (régua do dono, 20/08/2026): os MESMOS
     três turnos, todo dia, pra toda torcida — recrutar, festa e
     reunião de diretoria. Sem sorteio e sem arquétipo. */
  const EXPEDIENTE = ['recrutar', 'festa', 'reuniao'];
  const REL_ALIADA_DA_MESA = 20;   // o corte de Aliado na régua
  function expedienteIA(){ return EXPEDIENTE; }

  /* A REUNIÃO DE DIRETORIA delas: o mesmo passo da nossa (+4,2 com o
     aliado mais próximo) e a mesma exigência de dois diretores de pé,
     que aqui vêm da ficha da torcida. Ela conversa com as torcidas da
     PRÓPRIA praça — a mesa da diretoria delas não mexe na relação
     conosco, que continua vindo do que a gente faz. */
  /* =======================================================
     A REUNIÃO NÃO FAZ AMIGO DE INIMIGO (correção do dono, 12/09/2026)
     O dono pegou no jogo: a Independente do Anápolis virou IRMANDADE da
     Força Jovem Goiás E do Esquadrão Vilanovense ao mesmo tempo — e os
     dois são maiores rivais entre si. E a Fúria Azul do Iguatu virou
     irmandade da Fúria Icasiana, que é rival dela de nascença.

     O rastro apontou para cá: 346 das 358 mudanças naqueles pares saíram
     desta função. O comentário acima sempre disse "com o ALIADO mais
     próximo", mas o código abria em `melhor = -70` e escolhia a melhor
     torcida da praça FOSSE ELA QUEM FOSSE — bastava ser a menos pior.
     Em Goiânia, a Independente do Anápolis era a única não-maior-rival
     dos dois; no interior do Ceará, Iguatu e Icasa só tinham uma à
     outra. Rodando TODO DIA a +6, uma rival a −45 virava irmandade em
     vinte e cinco dias.

     Três travas, e o código volta a fazer o que o comentário promete:
       · só senta com ALIADA de verdade (+20 ou mais) da própria praça,
         e nunca com um maior rival;
       · UMA VEZ POR SEMANA, não todo dia — a nossa gasta ação da
         semana, a delas não gastava nada;
       · e a mesa não constrói IRMANDADE: ela leva até o fim do Aliado
         (+69) e para. Irmandade se constrói na rua e na fonte.
     ======================================================= */
  const TETO_DA_REUNIAO = 69;      // o degrau antes da Irmandade
  function reuniaoIA(E, o, t){
    if(((o.cargos||{}).diretoria || 0) < 2) return;
    if(E.data.dia !== 1) return;                    // uma vez por semana
    let alvo = null, melhor = -Infinity;
    for(const v of M().torcidasEm(o.mapa)){
      if(v.id === o.id || v.incompleta || v.id === E.torcida.id) continue;
      if(ehMaiorRival(E, o.id, v.id)) continue;
      const r = relacaoDelas(E, o.id, v.id);
      if(r < REL_ALIADA_DA_MESA) continue;          // rival não vira amigo na mesa
      if(r > melhor){ melhor = r; alvo = v; }
    }
    if(!alvo) return;
    const atual = relacaoDelas(E, o.id, alvo.id);
    if(atual >= TETO_DA_REUNIAO) return;
    moverRelacao(E, o.id, alvo.id,
                 Math.min(REL.iaReuniao, TETO_DA_REUNIAO - atual));
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
    treinarDelas(E);
    ferrugemDaPaz(E);
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
      for(const op of expedienteIA()){
        if(op === 'recrutar'){
          /* o teto da sede vale pra SEDE: quem mora na filial não come
             a vaga de quem recruta na cidade-mãe (dono, 31/08/2026) */
          const teto = tetoDe(E, t)
            + (t.filiais||[]).reduce((s,f)=>s+(f.membros||0), 0);
          if(t.membros >= teto || t.caixa < 10) continue;
          const tab = TAB[regimeIA(E, t)] || {um:0.10, dois:0.05};
          const r = U.rng();
          const n = Math.min(r < tab.dois ? 2
                           : r < tab.dois + tab.um ? 1 : 0,
                             teto - t.membros);
          if(n > 0){ t.membros += n; t.caixa -= n*5; }
        } else if(op === 'festa'){
          /* A FESTA DELAS É A NOSSA, com o preço do nível da sede
             (régua do dono, 20/08/2026): mesmo custo, mesma renda por
             cabeça e a mesma conta de presentes — quem conta são os
             DISPONÍVEIS, porque ferido e preso não bebem. Ela é turno
             de todo dia, mas só sai quando se paga: torcida nenhuma
             faz vaquinha diária, e era isso que estava comendo o caixa
             do mundo inteiro e segurando a fila de compras. */
          const custo = FIN().FESTA[t.sede] || 700;
          const publico = disponiveisIA(E, o.id);
          if(t.caixa < custo || publico < FIN().pisoDaFesta(t.sede)) continue;
          t.caixa += Math.round(publico * U.entre(4.8, 6.4)) - custo;
        } else if(op === 'reuniao'){
          reuniaoIA(E, o, t);
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
          moverRelacao(E, o.id, c.id,
            ganhoRepetido(E, o.id, c.id, 'festa', REL.iaConviteAceito));
        } else {
          moverRelacao(E, o.id, c.id, -REL.iaConviteRecusado);
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
  /* a situação pesa de 0,8 a 1,2 (régua do dono, 24/08/2026): o caixa
     tempera o ranking, não o domina */
  function situacaoFinanceira(caixa){
    if(caixa < -10000) return {rot:'Endividado', slug:'endividado', mult:0.8};
    if(caixa <= 0)     return {rot:'Muito ruim', slug:'muitoruim',  mult:0.88};
    if(caixa <= 10000) return {rot:'Pobre',      slug:'pobre',      mult:0.96};
    if(caixa <= 20000) return {rot:'Estável',    slug:'estavel',    mult:1.04};
    if(caixa <= 40000) return {rot:'Bem financeiramente', slug:'bem', mult:1.12};
    return {rot:'Rico', slug:'rico', mult:1.2};
  }

  let cacheRanking = {chave:'', lista:null};
  /* =======================================================
     A FOTO DO COMEÇO DO MÊS (pedido do dono, 20/08/2026)
     O ranking mostra, ao lado de membros, prestígio e força
     média, o quanto cada um andou NO MÊS. Pra isso o mundo
     guarda uma foto dos três números na virada do mês e a
     tela compara o de agora com o de então.
     ======================================================= */
  function marcaDoMes(E){
    const d = TO.estado.dataDaSemana(E.data.ano, E.data.semana, E.data.dia || 1);
    return `${d.getFullYear()}-${d.getMonth()}`;
  }
  /* os três números do ranking, medidos igual pra nós e pra elas */
  /* A RÉGUA DO RANKING (refeita pelo dono, 24/08/2026):
     membros TODOS — ferido e preso seguem sendo da torcida, e a
     régua parou de puni-los duas vezes —, o prestígio na escala de
     0 a 100, e a ficha média (força+defesa)/2 vezes cinco. */
  function medirNoRanking(E, o){
    if(o.id === E.torcida.id){
      const nT = E.membros.length || 1;
      const mf = E.membros.reduce((s,m)=>s+m.forca, 0)/nT;
      const md = E.membros.reduce((s,m)=>s+m.defesa, 0)/nT;
      return {membros: E.membros.length,
              prestigio: Math.round(E.indicadores.prestigio*5),
              forca: (mf+md)/2};
    }
    const viva = (E.mundoTorcidas||{})[o.id] || {};
    const n = viva.membros !== undefined ? viva.membros : (o.membros || 0);
    return {membros: n,
            prestigio: Math.round((viva.prestigio !== undefined ? viva.prestigio
              : U.limitar((o.prestigio||15)/5, 0, 20))*5),
            forca: mediaDeFichaGerada(o, n, E)};
  }
  /* tira a foto quando o mês vira — e na primeira vez que rodar num
     save que ainda não tinha foto, pra ninguém abrir o ranking e ver
     variação inventada */
  function fotoDoMes(E){
    const marca = marcaDoMes(E);
    if(E.fotoMes && E.fotoMes.marca === marca) return E.fotoMes;
    mundo(E);
    const dados = {};
    for(const o of M().jogaveis()){
      if(o.incompleta) continue;
      dados[o.id] = medirNoRanking(E, o);
    }
    return (E.fotoMes = {marca, dados});
  }

  function ranking(E){
    const foto = fotoDoMes(E);
    const chave = `${E.data.ano}|${semanaAbs(E)}|${E.data.dia}|`+
      `${E.membros.length}|${Math.round(E.indicadores.prestigio*100)}|`+
      `${E.brigasIATotal || (E.brigasIA||[]).length}|${Math.round(E.dinheiro)}|`+
      `${((E.brigasAno||{}).v||0)}-${((E.brigasAno||{}).d||0)}|`+
      `${E.baixasIASeq || 0}|${foto.marca}`;
    if(cacheRanking.chave === chave) return cacheRanking.lista;
    mundo(E);
    const fora = [];
    for(const o of M().jogaveis()){
      if(o.incompleta) continue;
      /* contam os DISPONÍVEIS: ferido e preso não somam ponto — é o
         que faz briga (nossa e das IAs) mexer no ranking. Os três
         números saem de `medirNoRanking`, o mesmo que tira a foto do
         mês: o que a tela mostra e o que a variação compara não podem
         ser medidos de jeitos diferentes. */
      const {membros:n, prestigio:prest, forca} = medirNoRanking(E, o);
      if(o.id === E.torcida.id){
        const sit = situacaoFinanceira(E.dinheiro);
        const pat = FIN().patrimonio(E);
        /* PRÉDIOS SOMADOS (pedido do dono, 20/08/2026): a sede conta 1,
           e somam bar, loja e subsede — o número que aparece é a
           quantidade de portas que a torcida mantém abertas. */
        const predios = 1 + (pat.bares||[]).length + (pat.lojas||[]).length +
                        (pat.subsedes||[]).length;
        fora.push({id:o.id, nome:o.nome, nossa:true,
                   membros:n, prestigio:prest, forca,
                   caixa:E.dinheiro, situacao:sit, predios,
                   saldo: saldoDoAno(E, o.id),
                   /* a fórmula do dono (24/08/2026): membros + prestígio
                      + ficha média ×5, tudo vezes a situação */
                   pontos:Math.round((n + prest + forca*5)*sit.mult)});
      } else {
        const viva = (E.mundoTorcidas||{})[o.id] || {};
        const caixa = viva.caixa !== undefined ? viva.caixa : (o.saldo||200)*4;
        const sit = situacaoFinanceira(caixa);
        const predios = 1 + (viva.bares||[]).length + (viva.lojas||[]).length +
                        (viva.subsedes || 0);
        fora.push({id:o.id, nome:o.nome, nossa:false,
                   membros:n, prestigio:prest, forca,
                   caixa, situacao:sit, predios,
                   saldo: saldoDoAno(E, o.id),
                   pontos:Math.round((n + prest + forca*5)*sit.mult)});
      }
    }
    /* quanto cada um andou desde a foto do começo do mês */
    for(const r of fora){
      const antes = foto.dados[r.id];
      r.varMembros   = antes ? r.membros   - antes.membros   : 0;
      r.varPrestigio = antes ? r.prestigio - antes.prestigio : 0;
      r.varForca     = antes ? r.forca     - antes.forca     : 0;
    }
    fora.sort((a,b)=>b.pontos - a.pontos || b.membros - a.membros ||
                     (a.nome < b.nome ? -1 : 1));
    fora.forEach((x,i)=>x.pos = i+1);
    cacheRanking = {chave, lista:fora};
    return fora;
  }
  /* =======================================================
     DOIS RANKINGS (pedido do dono, 23/08/2026)

     Com as barras dentro, o ranking passou a ter 388 torcidas de dez
     países, e uma organizada de interior brasileiro aparecia em 200º
     por causa da Boca e da Colo-Colo. Agora são dois: o do PAÍS, que é
     com quem a gente compete de verdade e é o que vai no cabeçalho do
     feed, e o do MUNDO, que é o continente inteiro. A conta de pontos é
     a mesma nos dois; o que muda é quem entra na fila.
     ======================================================= */
  function paisDaTorcida(id){
    const o = M().torcida(id);
    const t = o && M().time(o.clubeId);
    return (t && t.pais) || 'Brasil';
  }
  const paisDoJogador = E => paisDaTorcida(E && E.torcida && E.torcida.id);

  /* o mesmo ranking, só com quem joga no nosso país, renumerado. A
     posição no mundo viaja junto, pra tela poder mostrar as duas. */
  function rankingDoPais(E, pais){
    const alvo = pais || paisDoJogador(E);
    return ranking(E)
      .filter(r => paisDaTorcida(r.id) === alvo)
      .map((r, i) => Object.assign({}, r, {pos: i + 1, posMundo: r.pos}));
  }

  /* A DO CABEÇALHO É A NACIONAL (régua do dono, 23/08/2026) — e o
     título dela já dizia "ranking nacional" antes de ser verdade. */
  function posicaoNoRanking(E){
    const x = rankingDoPais(E).find(v=>v.nossa);
    return x ? x.pos : 0;
  }

  function posicaoNoMundo(E){
    const x = ranking(E).find(v=>v.nossa);
    return x ? x.pos : 0;
  }

  /* SUBSEDE × SUBSEDE (pedido do dono, 31/08/2026): duas torcidas com
     filial na MESMA cidade podem se pegar por lá — Gaviões e Jovem Fla
     se enfrentando em Fortaleza. Régua: núcleos com 6+ (a mesma que
     libera as descidas), relação ruim entre as duas, dose semanal
     pequena. A briga entra em brigasIA como qualquer outra — os bondes
     têm o TAMANHO DOS NÚCLEOS — e o jornal dá a nota. */
  function guerraDeFiliais(E){
    const m = E.mundoTorcidas || {};
    const porCidade = {};
    for(const id of Object.keys(m))
      for(const f of (m[id].filiais||[]))
        if((f.membros||0) >= 6)
          (porCidade[f.cidade] = porCidade[f.cidade] || []).push({id, f});
    for(const cidade of Object.keys(porCidade)){
      const lst = porCidade[cidade];
      if(lst.length < 2) continue;
      for(let x=0;x<lst.length;x++) for(let y=x+1;y<lst.length;y++){
        const a = M().torcida(lst[x].id), b = M().torcida(lst[y].id);
        if(!a || !b || a.clubeId === b.clubeId) continue;
        if(M().saoIrmas && M().saoIrmas(a.id, b.id)) continue;
        const r = relacaoDelas(E, a.id, b.id);
        if(r > -20) continue;
        const chance = ((-20 - r)/120) * 0.10 *
          Math.max(brigaDe(m[a.id]), brigaDe(m[b.id]))
          * FREIO_BRIGA * pesoDoRival(E, a.id, b.id) * FREIO_IA;
        if(U.rng() >= chance) continue;
        brigaIA(E, a, b, cidade, '', {tetoA: lst[x].f.membros,
                                      tetoB: lst[y].f.membros});
      }
    }
  }

  function passarSemana(E){
    mundo(E);
    /* a foto do mês é tirada ANTES do que a semana faz: assim a
       variação que a tela mostra cobre o mês inteiro */
    fotoDoMes(E);
    convivencia(E);
    economiaDelas(E);
    guerraDeFiliais(E);
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

  return {REL, HOSTIL, QUENTE, ALIADO, FREIO_BRIGA, FREIO_IA, COBRANCA_MULT, VINGANCA_FRUSTRADA, dividaIA, anotarDividaIA, quitarDividaIA, brigaIA,
          ehMaiorRival, pesoDoRival, emTregua,
          nivel, hostilidade, marcarAjuda,
          ranking, rankingDoPais, posicaoNoRanking, posicaoNoMundo,
          paisDaTorcida, situacaoFinanceira,
          brigasDeHoje, mundoDia, brigaIA, disponiveisIA, foraDeCombate, baixasIA,
          convitesDeAniversario,
          mundo, balanco, economiaDelas, ORDEM, proximaCompra, EXPEDIENTE,
          PRESENTES, ROTULO_PRESENTE, presenteDe, presentear, ganhoRepetido,
          relacaoDelas, moverRelacao, chaveDe,
          mover, indicadoresDe, semanaAbs,
          ataquesContraNos, ataqueDeHoje, diaDoAtaque,
          eventosDoTrimestre, eventoDeHoje, rivalDaPraca, SEMANAS_TRI,
          conquistaDoClube, passarSemana, guerraDeFiliais, panorama,
          elencoDaTorcida, lancarIA, recepcaoIA, convivencia,
          MENSALIDADE,
          fotoDoMes, marcaDoMes, medirNoRanking,
          quadroDe, mediaDoQuadro, treinarDelas, promoverDelas, xpDeBrigaIA,
          envelhecerDelas, ferrugemDaPaz, desgasteDaNoite, desgastarQuadro,
          mmaDe,
          mediaDeFichaGerada,
          placarDoAno, anotarBriga, saldoDoAno, frotaIA};
})();
