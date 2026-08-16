/* =========================================================
   FEED — a fila de mensagens que virou o jogo

   O jogo deixou de ser "abrir o mapa e apertar avançar dia" e
   passou a ser um fluxo de mensagens que chega sozinho. Este
   arquivo é a fila: quem produz mensagem, em que ordem ela sai
   e o que acontece quando o jogador aperta um botão.

   TRÊS COISAS QUE ESTE ARQUIVO NÃO FAZ, de propósito:

   · não simula nada. Competição, tensão, economia, membros,
     patrimônio, a rua e as cenas continuam onde sempre
     estiveram; o feed lê o que elas produziram e escreve a
     linha. Se uma mensagem precisar de regra de jogo nova, a
     regra vai pro módulo dela e o feed chama.
   · não desenha nada. `main.js` pinta a lista; aqui só existe
     o modelo. Botão é `{rot, efeito}`, texto, e `responder`
     devolve pra tela o que ela tem de abrir.
   · não sorteia com `U.rng()`. Toda escolha do feed sai de
     hash da semente com a data — a mesma disciplina do dia do
     assalto (§8.9) e do dia do ataque (§8.15). Assim o mesmo
     save reaberto traz o mesmo feed, mesmo que o resto do
     mundo tenha consumido o gerador em outra ordem.
   ========================================================= */
window.TO = window.TO || {};

TO.feed = (function(){
  const U = TO.util;
  const M  = () => TO.mundo;
  const PL = () => TO.planejamento;

  /* AS NOVE CATEGORIAS. Eram sete, e as duas últimas nasceram por falta
     de espaço, não por gosto: a interna tem cota de uma por semana e a
     diplomacia de duas a quatro por mês, e enfiar ameaça de delegado e
     aniversário de torcida lá dentro faria uma sufocar a outra. Cada
     nova tem cota própria de UMA por semana, e as duas obedecem à regra
     de nunca repetir categoria em sequência. */
  const CATEGORIAS = [
    {n:1, id:'olheiro',    rot:'Olheiro'},
    {n:2, id:'diajogo',    rot:'Dia de jogo'},
    {n:3, id:'convocacao', rot:'Convocação'},
    {n:4, id:'resultado',  rot:'Resultado'},
    {n:5, id:'mundo',      rot:'Mundo e jornal'},
    {n:6, id:'interna',    rot:'Interna'},
    {n:7, id:'diplomacia', rot:'Diplomacia'},
    {n:8, id:'policia',    rot:'Polícia'},
    {n:9, id:'efemeride',  rot:'Efeméride'}
  ];
  const catDe = n => CATEGORIAS.find(c=>c.n===n) || CATEGORIAS[4];

  /* TETO, NÃO META. Semana comum fecha em 3 a 6; isto é o freio de
     emergência pra semana em que tudo acontece junto. */
  const TETO_SEMANA = 15;
  /* a única categoria que pode sair duas vezes seguidas */
  const CAT_LIVRE = 5;
  /* quem responde primeiro quando duas decisões caem no mesmo instante */
  const ORDEM_DECISAO = {3:0, 8:1, 2:2, 6:3, 9:4, 7:5};
  /* quem sai primeiro entre as que não param o tempo: o que acabou de
     acontecer, depois o que o olheiro viu, depois a casa, a diplomacia,
     e o mundo lá fora por último — ele é o pulso, não a manchete */
  const ORDEM_INFO = {4:0, 8:1, 3:2, 2:3, 1:4, 6:5, 9:6, 7:7, 5:8};
  /* quanto tempo uma mensagem espera na fila antes de ser descartada,
     e quanto tempo o botão de uma `acao` continua valendo */
  const VALIDADE = {info:2, acao:6, decisao:21};
  /* cotas das duas categorias que precisam de freio (item 7) */
  const COTA_INTERNA_SEMANA = 1;
  const COTA_DIPLOMACIA_MES = 4;
  /* as duas novas: uma por semana cada. Na prática a 8 sai bem menos —
     as condições dela são raras —, e a 9 se espalha sozinha porque é
     calendário. */
  const COTA_POLICIA_SEMANA   = 1;
  const COTA_EFEMERIDE_SEMANA = 1;
  /* carência da ameaça: a mesma fala não volta antes disso */
  const CARENCIA_AMEACA = 56;      // dias

  /* =======================================================
     ESTADO
     ======================================================= */
  const feed = E => (E.feed = E.feed || []);
  const fila = E => (E.feedFila = E.feedFila || []);

  const semanaAbs = E => (E.data.ano - 2026)*52 + E.data.semana;
  const mesAbs    = E => Math.floor(((E.data.ano - 2026)*52 + E.data.semana - 1)/4);

  function ctl(E){
    const c = E.feedCtl = E.feedCtl || {};
    if(c.prox      === undefined) c.prox = 1;
    if(c.ultimaCat === undefined) c.ultimaCat = 0;
    c.semana  = c.semana  || {n:0, chave:0, c6:0, c5:0, c8:0, c9:0};
    c.mes     = c.mes     || {chave:-1, c7:0};
    c.assunto = c.assunto || {};     // assunto da categoria 6 → semana absoluta
    c.ameacas = c.ameacas || {};     // rival|nº da ameaça → dia absoluto
    c.contas  = c.contas  || {publicadas:0, descartadas:0, porCat:{}};
    if(c.semana.chave !== semanaAbs(E)){
      c.semana = {n:0, chave:semanaAbs(E), c6:0, c5:0, c8:0, c9:0};
    }
    if(c.mes.chave !== mesAbs(E)) c.mes = {chave:mesAbs(E), c7:0};
    return c;
  }

  /* =======================================================
     SORTEIO SEM SORTEIO
     ======================================================= */
  /* FNV-1a COM DISPERSÃO NO FIM, e a dispersão não é enfeite.

     Quase toda chave daqui muda só no ÚLTIMO pedaço — `c7m|2026|0`,
     `c7m|2026|1`, `c7m|2026|2`. No FNV puro, mexer no último caractere
     multiplica a diferença pelo primo 16777619 ≈ 2²⁴ e para por aí: os
     bits ALTOS quase não se movem. Como `dado()` lê justamente os bits
     altos (divide por 2³²), treze meses seguidos caíam todos na mesma
     faixa e a cota mensal da diplomacia saía constante o ano inteiro —
     quatro por mês em toda temporada, ou dois em toda temporada,
     conforme a semente. Parecia determinismo funcionando e era o
     contrário: era a chave não chegando ao resultado.

     As três voltas de xor-shift e multiplicação abaixo espalham os bits
     baixos pelos altos. Com elas a cota volta a variar de 2 a 4 dentro
     da mesma temporada, que é o que o enunciado pede. */
  function hash(txt){
    let h = 2166136261 >>> 0;
    for(let i=0;i<txt.length;i++){
      h ^= txt.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    h ^= h >>> 15; h = Math.imul(h, 2246822507) >>> 0;
    h ^= h >>> 13; h = Math.imul(h, 3266489909) >>> 0;
    h ^= h >>> 16;
    return h >>> 0;
  }
  const dado = (E, chave) => hash(`${E.semente}|${chave}`) / 4294967296;
  /* uma casa decimal: é a precisão em que a linha de consequência lê */
  const r1 = v => Math.round(v*10)/10;
  const pega = (E, chave, lista) =>
    lista.length ? lista[Math.floor(dado(E, chave)*lista.length) % lista.length] : null;
  const inteiro = (E, chave, a, b) => a + Math.floor(dado(E, chave)*(b-a+1));

  /* a hora do relógio de parede em que a coisa aconteceu: das 8 às 23,
     tirada do hash, pra a mesma mensagem trazer sempre a mesma hora */
  function horaDe(E, chave){
    const h = inteiro(E, 'h|'+chave, 8, 23), m = inteiro(E, 'm|'+chave, 0, 59);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  /* =======================================================
     A LINHA DE CONSEQUÊNCIA

     Toda mensagem que move indicador mostra o que moveu, numa segunda
     linha: "Relação entre ambos piora −10 · Tensão aumenta +15".

     A REGRA QUE SUSTENTA ISSO: a linha é gerada dos efeitos que foram
     DE FATO aplicados, nunca escrita no texto. Quem aplica devolve
     `{ind, delta, dono}`, e a linha sai daí. Número escrito à mão no
     texto vira mentira de tela no dia em que a fórmula mudar — e
     mentira de tela é a coisa mais difícil de achar depois.

     Mensagem que não move nada não tem linha: "nenhum efeito" é ruído.

     A COR SAI DO SIGNIFICADO, não do sinal. Subir é bom em quase tudo,
     mas tensão é o contrário: +15 de tensão é vermelho. E polícia anda
     ao contrário do que a palavra sugere — o número é a folga que a
     gente tem com ela, então `polícia −1` é vermelho, não verde. */
  const EFEITO = {
    relacao:   {rot:'Relação',    sobe:'melhora', desce:'piora',   bomSobe:true},
    tensao:    {rot:'Tensão',     sobe:'aumenta', desce:'diminui', bomSobe:false},
    moral:     {rot:'Moral',      sobe:'sobe',    desce:'cai',     bomSobe:true},
    prestigio: {rot:'Prestígio',  sobe:'sobe',    desce:'cai',     bomSobe:true},
    policia:   {rot:'Polícia',    sobe:'afrouxa', desce:'aperta',  bomSobe:true},
    satisfacao:{rot:'Satisfação', sobe:'sobe',    desce:'cai',     bomSobe:true},
    dinheiro:  {rot:'Caixa',      sobe:'entra',   desce:'sai',     bomSobe:true},
    membros:   {rot:'Efetivo',    sobe:'cresce',  desce:'encolhe', bomSobe:true},
    bombas:    {rot:'Bombas',     sobe:'entram',  desce:'somem',   bomSobe:true},
    acao:      {rot:'Ações',      sobe:'sobra',   desce:'gasta',   bomSobe:true}
  };

  /* o texto de um efeito, pronto pra tela e pro teste */
  function lerEfeito(e){
    const cfg = EFEITO[e.ind] || {rot:e.ind, sobe:'sobe', desce:'cai', bomSobe:true};
    const d = Math.round(e.delta*10)/10;
    if(!d) return null;
    const num = e.ind === 'dinheiro'
      ? (d>0?'+':'−') + U.dinheiro(Math.abs(d)).replace('−','')
      : (d>0?'+':'−') + Math.abs(d).toLocaleString('pt-BR');
    return {texto:`${cfg.rot}${e.dono ? ' '+e.dono : ''} `+
                  `${d>0 ? cfg.sobe : cfg.desce} ${num}`,
            bom: (d>0) === cfg.bomSobe, delta:d, ind:e.ind};
  }
  const lerEfeitos = m => ((m && m.efeitos) || []).map(lerEfeito).filter(Boolean);

  /* =======================================================
     PROPOR — todo mundo entra pela mesma porta

     Produtor nenhum publica: ele PROPÕE, e o escalonador decide
     quando (e se) aquilo sai. É o que permite as regras da fila
     valerem pra mensagem vinda de `anotar` — que nasce lá no
     fundo de `financeiro.js` — do mesmo jeito que pras que
     nascem aqui.
     ======================================================= */
  function propor(E, m){
    if(!E || !m || !m.texto) return null;
    const c = ctl(E);
    const hoje = E.data.absoluto || 0;
    const msg = {
      chave: m.chave || `${hoje}|${m.cat||4}|${(m.texto||'').slice(0,24)}`,
      cat:   m.cat || 4,
      peso:  m.peso || 'info',
      voz:   m.voz || {tipo:'rua'},
      texto: m.texto,
      linhaAbaixo: m.linhaAbaixo || null,
      botoes: m.botoes || [],
      tipo:  m.tipo || '',
      assunto: m.assunto || null,
      frequencia: m.frequencia || null,
      urgente: !!m.urgente,
      seguido: !!m.seguido,
      local: !!m.local,
      /* o que a mensagem moveu no estado, pra linha de consequência */
      efeitos: (m.efeitos || []).filter(x=>x && x.delta),
      dados: m.dados || null,
      naoAntesDe: m.naoAntesDe != null ? Math.max(hoje, m.naoAntesDe) : hoje,
      validoAte:  null
    };
    /* mensagem sem botão não tem prazo de resposta; o prazo aqui é o de
       PACIÊNCIA da fila: informativa velha não vale a pena guardar. */
    msg.validoAte = m.validoAte != null ? m.validoAte
                  : msg.naoAntesDe + (VALIDADE[msg.peso] || 2);
    /* a mesma coisa proposta duas vezes é uma coisa só */
    if(fila(E).some(x=>x.chave === msg.chave)) return null;
    if(feed(E).some(x=>x.chave === msg.chave)) return null;
    fila(E).push(msg);
    c.contas.propostas = (c.contas.propostas||0) + 1;
    c.contas.propPorCat = c.contas.propPorCat || {};
    c.contas.propPorCat[msg.cat] = (c.contas.propPorCat[msg.cat]||0) + 1;
    return msg;
  }

  /* =======================================================
     O ESCALONADOR

     As seis regras do item 8, todas aqui, uma por vez:

     1. nunca duas da mesma categoria em sequência, exceto a 5;
     2. dentro da 5, o que aconteceu no nosso mapa vem primeiro;
     3. teto de 15 por semana, descartando pelo peso;
     4. duas decisões no mesmo instante viram fila, não pilha;
     5. determinismo — nada aqui sorteia;
     6. o 1×/2× é do relógio, não da fila.
     ======================================================= */

  /* está travado? tem decisão publicada e sem resposta */
  function travado(E){
    if(!E) return false;
    return feed(E).some(m=>m.peso === 'decisao' && !m.respondido);
  }
  const decisaoAberta = E =>
    feed(E).find(m=>m.peso === 'decisao' && !m.respondido) || null;

  /* =======================================================
     CLASSE DE FREQUÊNCIA — DE QUANTO EM QUANTO CADA UMA PODE VOLTAR

     A carência era uma só, de duas semanas por assunto, e isso dá até
     26 vezes por ano pra qualquer mensagem cuja condição esteja sempre
     de pé. A da mãe doente é uma dessas: basta ter R$ 1.000 no caixa e
     três membros inteiros, o que é quase sempre. Medido: 24 vezes numa
     temporada, duas por mês, e o jogador para de ler.

     Carência única não serve porque as mensagens não têm todas a mesma
     natureza — o assalto proposto pelo diretor pode voltar todo mês, a
     dificuldade familiar de um membro não. Então a carência sai da
     CLASSE, e toda mensagem nasce com uma declarada. Mensagem sem
     classe é mensagem que vai aparecer demais, e por isso o padrão é o
     mais apertado que ainda faz sentido, não o mais frouxo.

     `evento` é a ausência de carência, e é uma escolha, não um esquecimento:
     o fato mandou, a mensagem sai. O alarme do caixa é o caso limite —
     ver `fechoDaSemana`. */
  const FREQUENCIA = {
    evento:     0,    // sem carência: o fato manda
    mensal:     4,    // ~13 por ano
    ocasional: 10,    // ~5 por ano
    rara:      26,    // 1 a 2 por ano
    anual:     52     // exatamente 1
  };
  const CLASSE_PADRAO = 'ocasional';
  const carenciaDe = m => {
    const f = m && m.frequencia;
    return FREQUENCIA[f] != null ? FREQUENCIA[f] : FREQUENCIA[CLASSE_PADRAO];
  };
  /* está de carência? só quem tem assunto: é o assunto que se repete */
  function naCarencia(E, m){
    if(!m || !m.assunto) return false;
    const ult = ctl(E).assunto[m.assunto];
    return ult != null && semanaAbs(E) - ult < carenciaDe(m);
  }

  /* quem pode sair hoje */
  function candidatas(E){
    const hoje = E.data.absoluto || 0;
    /* O QUE APODRECEU NA FILA SAI DELA. Informativa de três dias atrás
       não é notícia, é entulho; e decisão que ficou vinte e um dias sem
       conseguir sair — porque a regra da categoria em sequência a fez
       ceder a vez toda vez — também não vale mais nada: uma provocação
       de rival respondida um mês depois é o jogo falando sozinho.
       Cada peso tem a paciência dele, e o que cai é contado. */
    const f = fila(E);
    for(let i=f.length-1;i>=0;i--){
      if(f[i].validoAte < hoje){
        const c = ctl(E).contas;
        c.descartadas++;
        c.descartePorCat = c.descartePorCat || {};
        c.descartePorCat[f[i].cat] = (c.descartePorCat[f[i].cat]||0) + 1;
        f.splice(i,1);
      }
    }
    return f.filter(m=>m.naoAntesDe <= hoje);
  }

  /* a cota que cada categoria ainda tem nesta semana / neste mês */
  function temCota(E, m){
    const c = ctl(E);
    if(m.cat === 6){
      /* `urgente` FURA O TETO SEMANAL, e só ele. Nasceu pro alarme do
         caixa, que não podia ficar preso atrás do pedido de assalto da
         mesma semana — o jogador era avisado depois de perder oito
         pessoas. Hoje também carrega a segunda decisão da abertura. A
         carência do ASSUNTO continua valendo pra quem tem assunto;
         quem não tem, passa. */
      if(!m.urgente && c.semana.c6 >= COTA_INTERNA_SEMANA) return false;
      if(naCarencia(E, m)) return false;
    }
    if(m.cat === 7 && c.mes.c7 >= COTA_DIPLOMACIA_MES) return false;
    /* as duas novas usam a mesma máquina: teto semanal e carência de
       assunto, e `urgente` fura o teto — a proibição de entrar no
       estádio não pode esperar a semana que vem pra ser contada */
    if(m.cat === 8 || m.cat === 9){
      const teto = m.cat === 8 ? COTA_POLICIA_SEMANA : COTA_EFEMERIDE_SEMANA;
      const usadas = m.cat === 8 ? c.semana.c8 : c.semana.c9;
      if(!m.urgente && usadas >= teto) return false;
      if(naCarencia(E, m)) return false;
    }
    return true;
  }

  function ordenar(E, lista){
    return lista.slice().sort((a,b)=>
      (ORDEM_INFO[a.cat] - ORDEM_INFO[b.cat]) ||
      /* regra 2: no mesmo lote da categoria 5, o nosso mapa primeiro */
      ((b.local?1:0) - (a.local?1:0)) ||
      (a.naoAntesDe - b.naoAntesDe) ||
      (a.chave < b.chave ? -1 : 1));
  }
  const ordenarDecisoes = (E, lista) => lista.slice().sort((a,b)=>
    (ORDEM_DECISAO[a.cat] - ORDEM_DECISAO[b.cat]) ||
    (a.naoAntesDe - b.naoAntesDe) ||
    (a.chave < b.chave ? -1 : 1));

  /* publica UMA mensagem: tira da fila, carimba data e hora, empurra
     pro histórico e atualiza as cotas */
  function publicar1(E, m){
    const c = ctl(E);
    const i = fila(E).indexOf(m);
    if(i >= 0) fila(E).splice(i,1);
    m.id = c.prox++;
    m.ano = E.data.ano; m.semana = E.data.semana;
    m.dia = E.data.dia; m.absoluto = E.data.absoluto || 0;
    /* A HORA NÃO ANDA PRA TRÁS dentro do mesmo dia. Cada mensagem tira a
       própria hora do hash, mas a lista é cronológica de baixo pra cima:
       duas do mesmo dia saindo 22h41 e depois 21h41 fariam a linha de
       cima parecer mais velha que a de baixo. Quem sai depois, sai
       depois — no relógio também. */
    let h = horaDe(E, m.chave);
    if(c.horaDia !== m.absoluto){ c.horaDia = m.absoluto; c.horaUlt = '00:00'; }
    if(h < c.horaUlt) h = c.horaUlt;
    c.horaUlt = h;
    m.hora = h;
    delete m.naoAntesDe;
    feed(E).push(m);
    c.ultimaCat = m.cat;
    c.semana.n++;
    c.contas.publicadas++;
    c.contas.porCat[m.cat] = (c.contas.porCat[m.cat]||0) + 1;
    if(m.cat === 6){ c.semana.c6++; if(m.assunto) c.assunto[m.assunto] = semanaAbs(E); }
    if(m.cat === 7) c.mes.c7++;
    if(m.cat === 5) c.semana.c5++;
    if(m.cat === 8){ c.semana.c8++; if(m.assunto) c.assunto[m.assunto] = semanaAbs(E); }
    if(m.cat === 9){ c.semana.c9++; if(m.assunto) c.assunto[m.assunto] = semanaAbs(E); }
    return m;
  }

  /* A RAJADA. Tudo que pode sair agora sai agora, na ordem da fila, e a
     última entra por cima — é isso que "várias mensagens caem de uma
     vez" quer dizer. A decisão vem por último de propósito: ela fica no
     topo, que é onde o jogador olha primeiro, e ela é a que segura o
     relógio. Uma decisão por vez, sempre: duas decisões no mesmo
     instante viram fila, não pilha. */
  function publicar(E){
    const saiu = [];
    if(!E) return saiu;
    const c = ctl(E);
    if(travado(E)) return saiu;

    let guarda = 0;
    while(guarda++ < 60){
      const disp = candidatas(E);
      if(!disp.length) break;
      /* regra 3: no teto, informativa cede lugar; o que tem botão espera
         a semana virar em vez de sumir */
      const noTeto = c.semana.n >= TETO_SEMANA;
      const naoDec = ordenar(E, disp.filter(m=>m.peso !== 'decisao'));
      let escolhida = null;
      for(const m of naoDec){
        if(!temCota(E, m)) continue;
        if(noTeto){
          if(m.peso === 'info'){
            const i = fila(E).indexOf(m);
            if(i>=0){ fila(E).splice(i,1); c.contas.descartadas++; }
          }
          continue;
        }
        /* regra 1: repetiu categoria, cede a vez */
        if(m.cat === c.ultimaCat && m.cat !== CAT_LIVRE) continue;
        escolhida = m; break;
      }
      if(escolhida){ saiu.push(publicar1(E, escolhida)); continue; }

      /* acabaram as informativas publicáveis: vai uma decisão, e o
         relógio para até ela ser respondida.

         A REGRA 1 VALE PRA DECISÃO TAMBÉM. Ela é dura: se a próxima
         repete a categoria da que acabou de sair, cede a vez — e uma
         decisão que cede espera na fila até que outra categoria saia,
         o que acontece sozinho porque a 5 pinga o mundo lá fora três
         vezes por semana. Sem isto, duas provocações seguidas de rivais
         diferentes saíam coladas e a tela virava a mesma coisa duas
         vezes. */
      /* `seguido` é a única saída da regra 1, e existe pra a ABERTURA:
         ideologia e rotina são a mesma categoria e são pedidas uma
         depois da outra de propósito, antes de o tempo começar a
         correr. Sem isto a segunda ficava presa até uma mensagem de
         outra categoria sair, e o jogador começava a partida sem nunca
         ter visto a rotina. Nenhum produtor de dia usa este campo. */
      const decs = ordenarDecisoes(E, disp.filter(m=>m.peso === 'decisao'
                                                  && temCota(E, m)
                                                  && (m.seguido ||
                                                      m.cat !== c.ultimaCat)));
      if(!noTeto && decs.length){ saiu.push(publicar1(E, decs[0])); break; }
      break;
    }
    return saiu;
  }

  /* =======================================================
     RESPONDER

     O efeito é de ESTADO, e mora aqui; o que a tela tem de abrir
     volta como pedido. Assim o botão pode ser apertado por um
     teste headless sem DOM nenhum, que é como os critérios são
     medidos.
     ======================================================= */
  function responder(E, id, iBotao){
    const m = feed(E).find(x=>x.id === id);
    if(!m || m.respondido) return {ok:false};
    const b = (m.botoes||[])[iBotao||0];
    if(!b) return {ok:false};
    const hoje = E.data.absoluto || 0;
    if(m.peso === 'acao' && m.validoAte != null && hoje > m.validoAte){
      m.expirado = true;
      return {ok:false, motivo:'o prazo desse botão passou'};
    }
    m.respondido = b.rot;
    m.respondidoEm = hoje;
    const r = aplicar(E, m, b) || {};
    /* os efeitos da OPÇÃO ESCOLHIDA entram na mensagem, junto do
       "Você respondeu: …": é o mesmo cartão que conta o que o jogador
       decidiu e o que aquilo custou */
    if(r.efeitos && r.efeitos.length)
      m.efeitos = (m.efeitos || []).concat(r.efeitos.filter(x=>x && x.delta));
    /* respondida a decisão, a fila volta a andar na mesma hora: o que
       estava esperando cai agora, e não só no dia seguinte */
    if(m.peso === 'decisao') r.saiu = publicar(E);
    return Object.assign({ok:true, msg:m}, r);
  }

  function aplicar(E, m, b){
    const d = m.dados || {};
    switch(b.efeito){
      case 'nada': return {};

      /* seguir a ideologia é deixar a política fechar o plano, que é
         exatamente o que o modo automático já fazia */
      case 'ideologia': {
        const P = PL();
        const fez = P.aplicarPolitica(E);
        const falta = P.falta(E);
        if(falta.length) return {abrir:'gestao', aviso:
          `A ideologia não fechou o plano: falta ${falta.join(', ')}.`};
        const r = P.confirmar(E);
        return {aviso: resumoDoPlano(E, fez), efeitos:[
          {ind:'dinheiro', delta: -(r.gasto||0), dono:'de recepção'},
          {ind:'acao',     delta: -(r.investidas||0), dono:'da semana'}
        ]};
      }
      case 'gestao':  return {abrir:'gestao'};
      case 'ideologia-tela': return {tela:'ideologia'};
      /* a tela do ataque resolve no `aplicar` dela, não aqui: o que
         volta é o pedido de abrir, como a caravana */
      case 'ataque':  return {tela:'ataque'};
      case 'painel':  return {abrir: d.pagina || b.pagina || 'inicio'};
      case 'cena':    return {cena: d};
      /* o único botão que resolve mundo em vez de abrir tela: a ida ao
         estádio devolve ou um aviso de paz ou um encontro pra cena */
      case 'ida':     return irProEstadio(E);
      /* o Calendário tem três abas; a rotina é a segunda, e a mensagem
         que a pede tem de cair nela e não na primeira */
      case 'rotina':  return {abrir:'calendario', aba:'rotina'};
      /* a caravana tem tela própria, e é a casca que a monta: aqui só
         se diz qual é */
      case 'caravana': return {tela:'caravana'};

      /* a provocação: +1 de tensão de um lado, nada do outro */
      case 'tensao': {
        if(!d.torcidaId || !TO.tensao) return {};
        const antes = TO.tensao.nivel(E, d.torcidaId);
        const rAntes = (E.relacoes||{})[d.torcidaId];
        TO.tensao.somar(E, d.torcidaId, b.quanto || 1, 'respondemos à provocação');
        /* a relação só cai se o botão pedir: `tensao` também serve a
           mensagem que só esquenta o clima sem xingar ninguém */
        if(b.relacao && rAntes !== undefined)
          E.relacoes[d.torcidaId] = U.limitar(rAntes + b.relacao, -100, 100);
        const nome = (M().torcida(d.torcidaId)||{}).nome || 'eles';
        const ef = [{ind:'tensao',
                     delta: TO.tensao.nivel(E, d.torcidaId) - antes,
                     dono:`com a ${nome}`}];
        if(rAntes !== undefined)
          ef.push({ind:'relacao', delta: (E.relacoes[d.torcidaId]||0) - rAntes,
                   dono:`com a ${nome}`});
        return {efeitos: ef};
      }

      case 'festa-sim': {
        const custo = d.custo || 3000;
        const antes = (E.relacoes[d.torcidaId]||0);
        TO.estado.lancar(E, `Festa da ${d.nome || 'aliada'}`, -custo);
        E.relacoes[d.torcidaId] = U.limitar(antes + 5, -100, 100);
        return {efeitos:[
          {ind:'dinheiro', delta:-custo, dono:'da festa'},
          {ind:'relacao',  delta:(E.relacoes[d.torcidaId]-antes),
           dono:`com a ${d.nome||'aliada'}`}]};
      }
      case 'festa-nao': {
        const antes = (E.relacoes[d.torcidaId]||0);
        E.relacoes[d.torcidaId] = U.limitar(antes - 4, -100, 100);
        return {efeitos:[{ind:'relacao', delta:(E.relacoes[d.torcidaId]-antes),
                          dono:`com a ${d.nome||'aliada'}`}]};
      }

      case 'assalto': {
        const r = TO.acoes.executar(E, 'assalto');
        if(!r.ok) return {aviso: r.msg};
        return {cena: r.cena, aviso: r.msg};
      }

      /* ---- a interna 6.8: a mãe do moleque ---- */
      case 'ajudar-membro': {
        const m = E.membros.find(x=>x.id === d.membroId);
        const custo = 1000;
        TO.estado.lancar(E, `Ajuda ao ${d.nome || 'pessoal'}`, -custo);
        const antesM = E.indicadores.moral;
        if(m) m.moral = U.limitar(m.moral + 10, 0, 20);
        E.indicadores.moral = U.limitar(E.indicadores.moral + 1, 0, 20);
        return {efeitos:[
          {ind:'dinheiro', delta:-custo, dono:'nosso'},
          {ind:'moral', delta:r1(E.indicadores.moral - antesM), dono:'nossa'}]};
      }
      case 'nao-ajudar': {
        const antesM = E.indicadores.moral;
        E.indicadores.moral = U.limitar(E.indicadores.moral - 1, 0, 20);
        return {efeitos:[{ind:'moral',
          delta:r1(E.indicadores.moral - antesM), dono:'nossa'}]};
      }

      /* ---- a interna 6.9: o preso esquecido ---- */
      case 'visitar-preso': {
        const m = E.membros.find(x=>x.id === d.membroId);
        const custo = 1000;
        TO.estado.lancar(E, `Visita ao ${d.nome || 'preso'}`, -custo);
        const antesM = E.indicadores.moral;
        if(m){
          m.moral = U.limitar(m.moral + 8, 0, 20);
          if(m.preso && typeof m.preso === 'object') m.preso.visitado = true;
        }
        E.indicadores.moral = U.limitar(E.indicadores.moral + 1, 0, 20);
        return {efeitos:[
          {ind:'dinheiro', delta:-custo, dono:'nosso'},
          {ind:'moral', delta:r1(E.indicadores.moral - antesM), dono:'nossa'}]};
      }
      case 'nao-visitar': {
        const m = E.membros.find(x=>x.id === d.membroId);
        const antesM = E.indicadores.moral;
        if(m){
          m.moral = U.limitar(m.moral - 10, 0, 20);
          /* marcado mesmo sem visita: a pergunta foi feita e respondida,
             e repeti-la toda semana seria o feed cobrando duas vezes */
          if(m.preso && typeof m.preso === 'object') m.preso.visitado = true;
        }
        E.indicadores.moral = U.limitar(E.indicadores.moral - 1, 0, 20);
        return {efeitos:[{ind:'moral',
          delta:r1(E.indicadores.moral - antesM), dono:'nossa'}]};
      }

      /* ---- a polícia 8.1 ---- */
      case 'segurar': {
        const antes = E.indicadores.policia;
        E.indicadores.policia = U.limitar(antes + 2, 0, 20);
        /* três semanas de ideologia amarrada: quem cobra é o
           planejamento, que já sabe ler `E.trela` */
        E.trela = {ate: semanaAbs(E) + 3};
        PL().definirIntencao(E, 'paz');
        return {aviso:'Três semanas sem atacar ninguém.', efeitos:[
          {ind:'policia', delta:r1(E.indicadores.policia - antes), dono:'nossa'}]};
      }
      case 'foda-se': {
        /* nada agora. A conta vem na próxima briga: `E.gatilhoPunicao`
           é lido pelo fecho de cena, e ali a punição sai direto, sem
           esperar a polícia chegar a zero. */
        E.gatilhoPunicao = true;
        return {aviso:'O delegado que se vire.'};
      }

      /* ---- a efeméride 9.1 e 9.3 ---- */
      case 'festa-torcida': {
        const custo = 30000, antes = {m:E.indicadores.moral,
                                      s:E.indicadores.satisfacao};
        if(E.dinheiro < custo) return {aviso:'Não tem caixa pra isso.'};
        TO.estado.lancar(E, `Festa de ${d.anos} anos`, -custo);
        /* a festa grande se paga em parte: bar, rifa e camisa */
        const arrecada = inteiro(E, `festa|${E.data.ano}`, 20000, 35000);
        TO.estado.lancar(E, 'Arrecadação da festa', arrecada);
        E.indicadores.moral = U.limitar(antes.m + 5, 0, 20);
        E.indicadores.satisfacao = U.limitar(antes.s + 2, 0, 20);
        return {efeitos:[
          {ind:'dinheiro', delta: arrecada - custo, dono:'da festa'},
          {ind:'moral', delta:r1(E.indicadores.moral - antes.m), dono:'nossa'},
          {ind:'satisfacao', delta:r1(E.indicadores.satisfacao - antes.s),
           dono:'da torcida'}]};
      }
      case 'festa-simples': {
        const custo = 5000, antes = E.indicadores.moral;
        TO.estado.lancar(E, `Festa de ${d.anos} anos`, -custo);
        E.indicadores.moral = U.limitar(antes + 2, 0, 20);
        return {efeitos:[
          {ind:'dinheiro', delta:-custo, dono:'da festa'},
          {ind:'moral', delta:r1(E.indicadores.moral - antes), dono:'nossa'}]};
      }
      case 'sem-festa': {
        const antes = E.indicadores.moral;
        E.indicadores.moral = U.limitar(antes - 2, 0, 20);
        return {efeitos:[{ind:'moral',
          delta:r1(E.indicadores.moral - antes), dono:'nossa'}]};
      }
      case 'mosaico': {
        const custo = 12000, antes = E.indicadores.moral;
        if(E.dinheiro < custo) return {aviso:'Não tem caixa pra isso.'};
        TO.estado.lancar(E, 'Mosaico da arquibancada', -custo);
        E.indicadores.moral = U.limitar(antes + 3, 0, 20);
        return {efeitos:[
          {ind:'dinheiro', delta:-custo, dono:'do mosaico'},
          {ind:'moral', delta:r1(E.indicadores.moral - antes), dono:'nossa'}]};
      }

      /* ---- o jornal 5.9, 5.10 e 5.11 ---- */
      case 'carreata': {
        const custo = 8000;
        const a = {m:E.indicadores.moral, s:E.indicadores.satisfacao,
                   p:E.indicadores.prestigio};
        TO.estado.lancar(E, 'Carreata do título', -custo);
        E.indicadores.moral = U.limitar(a.m + 6, 0, 20);
        E.indicadores.satisfacao = U.limitar(a.s + 5, 0, 20);
        E.indicadores.prestigio = U.limitar(a.p + 2, 0, 20);
        return {efeitos:[
          {ind:'dinheiro', delta:-custo, dono:'da carreata'},
          {ind:'moral', delta:r1(E.indicadores.moral - a.m), dono:'nossa'},
          {ind:'satisfacao', delta:r1(E.indicadores.satisfacao - a.s),
           dono:'da torcida'},
          {ind:'prestigio', delta:r1(E.indicadores.prestigio - a.p),
           dono:'nosso'}]};
      }
      case 'comemorar-sede': {
        const custo = 1500;
        const a = {m:E.indicadores.moral, s:E.indicadores.satisfacao};
        TO.estado.lancar(E, 'Comemoração na sede', -custo);
        E.indicadores.moral = U.limitar(a.m + 3, 0, 20);
        E.indicadores.satisfacao = U.limitar(a.s + 3, 0, 20);
        return {efeitos:[
          {ind:'dinheiro', delta:-custo, dono:'da festa'},
          {ind:'moral', delta:r1(E.indicadores.moral - a.m), dono:'nossa'},
          {ind:'satisfacao', delta:r1(E.indicadores.satisfacao - a.s),
           dono:'da torcida'}]};
      }
      case 'faixa-despedida': {
        const custo = 2000;
        const a = {m:E.indicadores.moral, s:E.indicadores.satisfacao};
        TO.estado.lancar(E, `Faixa de despedida do ${d.nome||'ídolo'}`, -custo);
        E.indicadores.moral = U.limitar(a.m + 3, 0, 20);
        E.indicadores.satisfacao = U.limitar(a.s + 2, 0, 20);
        return {efeitos:[
          {ind:'dinheiro', delta:-custo, dono:'da faixa'},
          {ind:'moral', delta:r1(E.indicadores.moral - a.m), dono:'nossa'},
          {ind:'satisfacao', delta:r1(E.indicadores.satisfacao - a.s),
           dono:'da torcida'}]};
      }
      case 'caixao': {
        /* provocação de rua contra TODAS as organizadas do clube que
           caiu: é o clube que foi rebaixado, não uma torcida */
        const ef = [];
        const aP = E.indicadores.prestigio, aPo = E.indicadores.policia;
        let alvos = 0;
        for(const o of M().torcidasDe(d.clubeId || '')){
          if(!TO.tensao) break;
          const antes = TO.tensao.nivel(E, o.id);
          TO.tensao.somar(E, o.id, 12, 'caixão na frente da sede deles');
          const dt = TO.tensao.nivel(E, o.id) - antes;
          if(dt) ef.push({ind:'tensao', delta:dt, dono:`com a ${o.nome}`});
          alvos++;
        }
        E.indicadores.prestigio = U.limitar(aP + 3, 0, 20);
        E.indicadores.policia   = U.limitar(aPo - 1, 0, 20);
        ef.push({ind:'prestigio', delta:r1(E.indicadores.prestigio - aP),
                 dono:'nosso'});
        ef.push({ind:'policia', delta:r1(E.indicadores.policia - aPo),
                 dono:'nossa'});
        return {aviso: alvos ? 'O caixão foi.' : 'Ninguém pra provocar lá.',
                efeitos: ef};
      }

      case 'fianca': {
        const alvo = E.membros.find(x=>x.id === d.membroId);
        if(!alvo) return {aviso:'esse não está mais preso'};
        const r = TO.membros.resgatar(E, alvo);
        return {aviso: r.ok ? `${TO.membros.nomeDe(alvo)} solto.` : r.motivo,
                efeitos: r.ok ? [{ind:'dinheiro', delta:-r.custo,
                                  dono:'de fiança'}] : []};
      }
    }
    return {};
  }

  const resumoDoPlano = (E, fez) => 'Ideologia: ' +
    (fez.intencao === 'paz' ? 'ir em paz'
      : `atacar ${fez.alvo || '—'} nos arredores`) +
    (fez.investidas && fez.investidas.length
      ? ` · investida contra ${fez.investidas.join(' e ')}` : '');

  /* =======================================================
     AS VOZES
     ======================================================= */
  /* o diretor é um MEMBRO DE VERDADE, e o mesmo assunto traz o mesmo
     diretor: é isso que faz o Serrote que propôs o assalto ser o mesmo
     Serrote que aparece preso duas mensagens depois */
  function diretor(E, chave){
    const gente = E.membros || [];
    const dir = gente.filter(m=>m.cargo === 'diretoria' && !m.preso);
    const fr  = gente.filter(m=>m.cargo === 'frente' && !m.preso);
    const lista = dir.length ? dir : fr.length ? fr : gente;
    const m = pega(E, 'dir|'+chave, lista);
    if(!m) return {tipo:'rua'};
    return {tipo:'diretor', membroId:m.id, nome:TO.membros.nomeDe(m),
            cargo:(TO.membros.CARGOS[m.cargo]||{}).nome || ''};
  }
  const vozOlheiro = () => ({tipo:'olheiro', nome:'Olheiro'});
  const vozJornal  = () => ({tipo:'jornal',  nome:'Jornal'});
  const vozRua     = () => ({tipo:'rua',     nome:'A rua'});
  function vozRival(E, o, chave){
    /* a rival não tem lista de membros; o nome do diretor dela sai do
       mesmo banco de nomes dos nossos, preso ao id — então é sempre o
       mesmo sujeito falando pela mesma torcida */
    const N = TO.dados.nomes;
    const ap = pega(E, 'rv1|'+o.id, N.apelidos) || 'Chefe';
    const sb = pega(E, 'rv2|'+o.id, N.sobrenomes) || '';
    return {tipo:'rival', torcidaId:o.id, nome:`${ap} ${sb}`.trim(),
            cargo:`Diretor da ${o.nome}`};
  }
  function vozAliado(E, o){
    const N = TO.dados.nomes;
    const ap = pega(E, 'al1|'+o.id, N.apelidos) || 'Chefe';
    const sb = pega(E, 'al2|'+o.id, N.sobrenomes) || '';
    return {tipo:'aliado', torcidaId:o.id, nome:`${ap} ${sb}`.trim(),
            cargo:`Diretor da ${o.nome}`};
  }

  /* =======================================================
     PEÇAS QUE OS PRODUTORES USAM
     ======================================================= */
  const DIA_ROT = ['','segunda','terça','quarta','quinta','sexta','sábado','domingo'];
  const diaRot = d => DIA_ROT[d] || 'sábado';

  /* NÚMERO DE RIVAL É ESTIMATIVA — decisão de design já fechada. O
     olheiro nunca dá o número exato: ele dá a faixa, e a faixa é larga
     de propósito. */
  function faixaDe(E, n, chave){
    const erro = 0.25 + dado(E, 'f|'+chave)*0.25;
    const a = Math.max(5, Math.round(n*(1-erro)/5)*5);
    const b = Math.round(n*(1+erro)/5)*5;
    return `${a} a ${b}`;
  }

  const nossaTensao = (E, id) => TO.tensao ? TO.tensao.nivel(E, id) : 0;

  /* as torcidas do adversário e das visitantes que pisam na praça */
  function visitantesDaSemana(E){
    const fora = [];
    const vistos = {};
    const põe = (o, jogo) => {
      if(!o || vistos[o.id]) return;
      vistos[o.id] = true;
      fora.push({torcida:o, jogo, tensao:nossaTensao(E, o.id),
                 relacao:(E.relacoes||{})[o.id]});
    };
    for(const j of TO.praca.jogosDaPraca(E)){
      if(j.vis.mapa === E.torcida.mapa) continue;   // clássico local: não é caravana
      for(const o of M().torcidasDe(j.vis.id)) põe(o, j);
    }
    return fora;
  }

  /* =======================================================
     QUEM PODE MANDAR AMEAÇA

     Isto devolvia TODOS os rivais declarados do grafo, do país inteiro,
     mais os visitantes da semana que fossem rivais. Uma torcida de
     outro estado, que nunca vai pisar aqui, mandava recado como se
     fosse vizinha de bairro.

     São dois grupos, e só:

     a) MAIOR RIVAL, sempre e sem condição. Ele provoca porque existe,
        não porque tem jogo marcado — é o inimigo histórico.
     b) RIVAL COMUM, só com jogo do clube dele na NOSSA praça nos
        próximos dez dias. Passou o jogo ou está longe demais, cala.

     Dez dias não cabem numa semana de sete, então a busca olha a semana
     corrente E a seguinte, contando em dia absoluto. Na última semana
     do ano não há olhada adiante: a temporada é remontada na virada, e
     a "semana 1" que se leria dali é a da temporada velha.
     ======================================================= */
  const JANELA_AMEACA = 10;      // dias

  function clubesNaPracaEmDias(E, dias){
    const fora = new Set();
    if(!E.temporada) return fora;
    const hoje = E.data.absoluto || 0;
    const semanas = [{s:E.data.semana, d:0}];
    if(E.data.semana < TO.competicoes.SEMANAS_ANO)
      semanas.push({s:E.data.semana + 1, d:7});
    for(const w of semanas)
      for(const j of TO.praca.jogosDaPraca(E, w.s)){
        const abs = hoje - E.data.dia + (j.dia || 6) + w.d;
        if(abs < hoje || abs > hoje + dias) continue;
        fora.add(j.casa.id); fora.add(j.vis.id);
      }
    return fora;
  }

  function rivais(E){
    const nossa = M().torcida(E.torcida.id) || E.torcida;
    const maiores = new Set(nossa.maioresRivais || []);
    const naPraca = clubesNaPracaEmDias(E, JANELA_AMEACA);
    const fora = [];
    for(const id of new Set([...maiores, ...(nossa.rivais || [])])){
      const o = M().torcida(id);
      if(!o || o.incompleta) continue;
      if(!maiores.has(id) && !naPraca.has(o.clubeId)) continue;
      fora.push(o);
    }
    return fora;
  }
  /* por que cada uma entrou, pra medição poder dizer o motivo */
  function motivoDaAmeaca(E, id){
    const nossa = M().torcida(E.torcida.id) || E.torcida;
    if((nossa.maioresRivais||[]).includes(id)) return 'maior rival';
    const o = M().torcida(id);
    return o && clubesNaPracaEmDias(E, JANELA_AMEACA).has(o.clubeId)
      ? 'jogo na praça em 10 dias' : 'não elegível';
  }

  /* o jogo do nosso clube nesta semana, com o dia */
  const nossoJogo = E => E.proximoJogo || null;

  /* =======================================================
     PRODUTOR 1 — O OLHEIRO
     Só existe quando há jogo nosso ou de rival na praça. Uma
     por semana de jogo, dois dias antes.
     ======================================================= */
  /* O OLHEIRO ACOMPANHA O INIMIGO, NÃO O CALENDÁRIO DA NOSSA CIDADE.
     Ele só falava quando havia visitante na praça, e isso deixava mudo
     justamente o caso que interessa: saber que a Cearamor vai botar 60
     na rua num jogo em Juazeiro é informação, e a gente não pisa lá.
     Agora ele fala também quando um MAIOR RIVAL nosso joga em qualquer
     lugar — em casa ou fora, na praça dele ou na nossa. */
  function jogosDeMaiorRival(E){
    if(!E.temporada) return [];
    const nossa = M().torcida(E.torcida.id) || E.torcida;
    const clubes = new Set();
    for(const id of (nossa.maioresRivais||[])){
      const o = M().torcida(id);
      if(o && o.clubeId) clubes.add(o.clubeId);
    }
    if(!clubes.size) return [];
    const fora = [];
    for(const comp of E.temporada.competicoes)
      for(const etapa of [...comp.rodadas, ...comp.mata]){
        if(etapa.semana !== E.data.semana) continue;
        for(const j of etapa.jogos){
          if(!j.f) continue;
          if(!clubes.has(j.c) && !clubes.has(j.f)) continue;
          const casa = M().time(j.c), vis = M().time(j.f);
          if(!casa || !vis) continue;
          fora.push({casa, vis, comp:comp.nome, dia: j.d || etapa.dia || 6,
                     deles: clubes.has(j.c) ? casa : vis,
                     naNossa: casa.mapa === E.torcida.mapa});
        }
      }
    return fora;
  }

  function cat1(E){
    const jogos = TO.praca.jogosDaPraca(E);
    const rivais = jogosDeMaiorRival(E);
    if(!jogos.length && !rivais.length) return;
    const todos = jogos.concat(rivais);
    const primeiro = todos.reduce((a,b)=>a.dia<=b.dia?a:b);
    if(E.data.dia !== Math.max(1, primeiro.dia - 2)) return;
    const ch = `c1|${E.data.ano}|${E.data.semana}`;
    const vis = visitantesDaSemana(E);
    const linhas = [];

    /* a) quantos vêm, e em quantos bondes */
    for(const v of vis.slice(0,3)){
      const n = (TO.tensao && (TO.tensao.mundo(E)[v.torcida.id]||{}).membros)
              || v.torcida.membros || 20;
      const vao = Math.max(6, Math.round(n*0.25));
      const bondes = Math.max(1, Math.round(vao/45));
      linhas.push({txt:`Chefe, a ${v.torcida.nome} vai pro ${v.jogo.casa.nome} × `+
        `${v.jogo.vis.nome} ${diaRot(v.jogo.dia)} com ${faixaDe(E, vao, ch+v.torcida.id)} `+
        `cabeças, dividindo em ${bondes} ${bondes===1?'bonde':'bondes'}.`});
      /* b) compraram material de briga */
      if(v.tensao >= 30)
        linhas.push({txt:`Compraram bomba essa semana na ${v.torcida.nome}. `+
                         `Não sei quanto.`});
      /* c) onde vão dormir — a mesma conta que a rua usa pra decidir de
         qual sede o bonde deles sai na manhã do jogo */
      const anf = TO.praca.anfitriaoDe(E, null, v.torcida);
      if(anf && anf.id !== E.torcida.id)
        linhas.push({txt:`A ${v.torcida.nome} chega ${diaRot(v.jogo.dia)} de manhã. `+
                         `Vão dormir na sede da ${anf.nome}.`});
    }

    /* c2) O RIVAL QUE JOGA LONGE. É o que o olheiro passou a enxergar:
       o efetivo que eles vão botar na rua num jogo que não é aqui. */
    for(const r of rivais.filter(x=>!x.naNossa).slice(0,2))
      for(const o of M().torcidasDe(r.deles.id)){
        if(!PL().ehRival(E, o)) continue;
        const n = (TO.tensao && (TO.tensao.mundo(E)[o.id]||{}).membros)
                || o.membros || 20;
        const vao = Math.max(6, Math.round(n*0.25));
        const cidade = (M().cidade(r.deles.mapa)||{}).nome || 'fora';
        linhas.push({txt:`Chefe, a ${o.nome} joga ${diaRot(r.dia)} em `+
          `${cidade}, ${r.casa.nome} × ${r.vis.nome}. Vão botar `+
          `${faixaDe(E, vao, ch+'r'+o.id)} na rua por lá.`});
        break;
      }

    /* d) o clima com quem está quase estourando */
    const quentes = (TO.tensao ? TO.tensao.panorama(E) : [])
      .filter(x=>x.tensao >= 25 && x.tensao < 60);
    if(quentes.length){
      const q = quentes[0];
      linhas.push({txt:`Chefe, o clima com a ${q.nome} tá esquentando, `+
        (q.tensao >= 45 ? 'do jeito que tá, é questão de dias.'
                        : 'pra guerra estourar vai demorar.')});
    }

    /* e) A AUSÊNCIA DE INFORMAÇÃO TAMBÉM É INFORMAÇÃO. Uma semana em
       cada seis o olheiro volta de mãos vazias, e isso é conteúdo: é o
       que impede o jogador de tratar o relatório dele como oráculo. */
    if(!linhas.length || dado(E, ch+'|vazio') < 0.16)
      linhas.length = 0, linhas.push({txt:'Chefe, não consegui colher '+
        'informações essa semana.', tipo:'ruim'});

    const esc = pega(E, ch+'|esc', linhas);
    if(esc) propor(E, {cat:1, peso:'info', voz:vozOlheiro(), texto:esc.txt,
                       tipo:esc.tipo || '', chave:ch});
  }

  /* =======================================================
     PRODUTOR 2 — A DECISÃO DE DIA DE JOGO
     Uma por evento que precisa de decisão. Cai três dias antes
     do jogo, ou no primeiro dia da semana se o jogo for cedo.
     ======================================================= */
  function perguntaAntes(E){
    /* a chave é a mesma de sempre; o que mudou é quem pergunta — antes
       era a Gestão abrindo sozinha, agora é a mensagem */
    const o = E.opcoes || {};
    return o.perguntarJogo === undefined
         ? (o.abrirGestao === undefined ? true : !!o.abrirGestao)
         : !!o.perguntarJogo;
  }

  /* A PERGUNTA É POR EVENTO, NÃO UMA POR SEMANA.

     Quatro coisas impediam a pergunta pré-jogo de aparecer, e as quatro
     estavam aqui:

     a) `if(p.decidido) return`. `plano()` nasce com `decidido: !!padrao`,
        então QUEM TEM PLANO PADRÃO SALVO nunca era perguntado — nem uma
        vez, e em silêncio. Plano padrão é atalho pra quem não quer
        decidir toda semana, não mordaça. O teste certo é se FALTA
        decisão, e quem sabe disso é `PL().falta(E)`.
     b) o dia era o do NOSSO jogo e só. Com jogo nosso no domingo e jogo
        de outro clube na quarta, a pergunta caía na quinta — depois do
        jogo de quarta. Cada evento conta os próprios dias.
     c) a janela era de UM DIA. Se aquele dia passasse por qualquer
        motivo — fila cheia, decisão travando o feed —, a pergunta sumia
        pra sempre naquela semana. Agora é janela: de cinco dias antes
        até a véspera, contada em dia absoluto (ver `JANELA_PREJOGO`).
     d) os ramos eram exclusivos, e o nosso jogo EM CASA caía no
        genérico: ele virava "Vai ter A × B e C × D", com `slice(0,2)`
        descartando o terceiro jogo em diante.

     Agora são eventos independentes, cada um com a própria chave, o
     próprio texto e a própria contagem. Dois no mesmo dia entram na
     fila, não empilhados — a regra 1 continua valendo. */
  /* De D-5 até a véspera. O número saiu de medição, não de gosto: numa
     temporada, com janela de 3 dias, 5 das 62 noites de jogo na praça
     ficavam sem pergunta, e a mesma noite quase sempre — domingo, o
     último dia da semana, que divide a janela com o nosso jogo de
     sábado. A regra 1 só deixa sair uma decisão de cat 2 por vez, e
     três perguntas disputando três dias não cabem. Com 4 sobrava uma;
     com 5, nenhuma: 61 de 61 e 42 de 42. */
  const JANELA_PREJOGO = 5;

  /* A SEMANA QUE VEM TAMBÉM ENTRA NA CONTA.

     "De D-3 até a véspera" só cabe dentro da semana pra jogo de quinta
     em diante. Jogo de segunda tem a véspera no domingo ANTERIOR, e a
     conta feita em dia-da-semana espremia a janela num dia só — com o
     `Math.max(1, …)` a pergunta caía no próprio dia do jogo, quando
     caía. Medido numa temporada: 8 dos 71 dias de jogo na praça não
     chegavam nem a ser propostos.

     Na última semana do ano não há olhada adiante: a temporada é
     remontada na virada, e a "semana 1" que se leria daqui é a da
     temporada velha. */
  function semanasDaJanela(E){
    const s = [{ano:E.data.ano, semana:E.data.semana, adiante:0}];
    if(E.temporada && E.data.semana < TO.competicoes.SEMANAS_ANO)
      s.push({ano:E.data.ano, semana:E.data.semana+1, adiante:1});
    return s;
  }

  /* o nosso jogo de uma semana adiante, no mínimo que o texto usa:
     `E.proximoJogo` só conhece a semana corrente */
  function nossoJogoDe(E, semana){
    if(!E.temporada) return null;
    const meu = M().time(E.torcida.clubeId);
    if(!meu) return null;
    const a = TO.competicoes.jogoDaSemana(E, meu.id, semana);
    const adv = a ? M().time(a.adversario) : null;
    if(!adv) return null;
    return {dia: a.dia || 6, casa: a.casa, advId: adv.id,
            mandante: a.casa ? meu : adv, visitante: a.casa ? adv : meu};
  }

  function cat2(E){
    const hoje = E.data.absoluto || 0;
    const j = nossoJogo(E);
    const outros = PL().outrosJogosNaCidade(E, E.data.semana);

    /* MODO AUTOMÁTICO. Com a pergunta desligada a ideologia fecha o
       plano sozinha e o feed conta o que foi decidido — automático que
       não conta o que fez é automático que esconde. */
    if(!perguntaAntes(E)){
      if(!j && !outros.length) return;
      const ch0 = `c2|${E.data.ano}|${E.data.semana}`;
      if(PL().plano(E).decidido) return;
      const diaJ = j ? (j.dia||6) : outros[0].dia || 6;
      if(E.data.dia !== Math.max(1, diaJ - JANELA_PREJOGO)) return;
      const fez = PL().aplicarPolitica(E);
      if(!PL().falta(E).length){
        PL().confirmar(E);
        propor(E, {cat:2, peso:'info', voz:diretor(E, ch0), chave:ch0,
                   texto: resumoDoPlano(E, fez) + '.'});
        return;
      }
      /* automático que falha em silêncio é pior que manual: cai no
         caminho de baixo e pergunta */
    }

    /* Tudo daqui pra baixo conta em DIA ABSOLUTO, e não em dia da
       semana: é a única conta em que a véspera de segunda é domingo. */
    const absDe = (d, adiante) => hoje - E.data.dia + d + 7*(adiante||0);
    const naJanela = a => hoje >= a - JANELA_PREJOGO && hoje <= a - 1;
    /* PERGUNTA QUE CHEGA DEPOIS DO JOGO NÃO É PERGUNTA. Se a fila
       segurar até a véspera passar, ela é descartada em vez de sair
       atrasada — a mesma regra da notícia de jogo (§8.20). */
    const prazo = a => a - 1;
    const quandoRot = (d, adiante) => diaRot(d) + (adiante ? ' que vem' : '');

    /* O GRANDE RIVAL NA CIDADE não é outra pergunta: é a MESMA, com
       outro texto. As duas decidem o mesmo plano, e separá-las faria o
       feed perguntar duas vezes o que se responde uma. Só vale pra
       semana corrente: `visitantesDaSemana` lê a praça de hoje. */
    const quente = visitantesDaSemana(E)
      .filter(v=>PL().ehRival(E, v.torcida))
      .sort((a,b)=>b.tensao-a.tensao)[0];

    /* NENHUM `return` AQUI DENTRO. Propor não é publicar: quem decide o
       que sai hoje é o escalonador, e cortar a varredura no primeiro
       sucesso fazia o segundo evento do dia nunca ser oferecido — era
       essa, e não a fila, a causa dos dias de praça mudos. */
    for(const s of semanasDaJanela(E)){
      const ch0 = `c2|${s.ano}|${s.semana}`;
      const nosso = s.adiante ? nossoJogoDe(E, s.semana) : j;

      /* --- evento 1: o NOSSO jogo, em casa ou fora ---

         NÃO HÁ GATE DE "JÁ DECIDIU". A chave já garante uma pergunta por
         evento, e é ela que faz o papel que `p.decidido` fazia errado. E
         o teste de `PL().falta(E)` também não serve aqui, embora pareça:
         plano de paz não tem passo pendente NENHUM, então `falta` é
         vazio na maioria das semanas e a pergunta sumiria em metade dos
         jogos — medido, 22 de 41. "Antes de todo jogo" quer dizer todo. */
      const aN = nosso ? absDe(nosso.dia || 6, s.adiante) : 0;
      if(nosso && naJanela(aN)){
        const fora = !nosso.casa;
        const briga = !s.adiante && quente && quente.tensao >= PL().TENSAO_QUENTE;
        const quando = quandoRot(nosso.dia || 6, s.adiante);
        propor(E, {cat:2, peso:'decisao', voz:diretor(E, ch0),
          chave:`${ch0}|nosso`, validoAte: prazo(aN),
          texto: briga
            ? `Nosso grande rival, a ${quente.torcida.nome}, está na cidade `+
              `essa semana. Bora dar um trato neles?`
            : fora
            ? `${E.torcida.clube} joga fora ${quando}, contra o `+
              `${nosso.mandante.nome}. Quantos vão na caravana, e por qual estrada?`
            : `Vai ter ${nosso.mandante.nome} × ${nosso.visitante.nome} `+
              `${quando}. Pretende fazer algo?`,
          /* A CARAVANA TEM TELA (§8.23); o jogo em casa fecha pela
             ideologia ou abre a Gestão pra escolher alvo. */
          botoes: (fora && !briga)
            ? [{rot:'Montar a caravana', efeito:'caravana',
                nota:'quantos vão, por qual estrada e quantas bombas'},
               {rot:'Seguir ideologia', efeito:'ideologia',
                nota:'a ideologia fecha o plano da semana'}]
            : BOTOES_PLANO});
      }

      /* --- evento 2: os OUTROS jogos da praça, todos eles ---
         A mensagem lista a rodada inteira do dia, e não os dois
         primeiros: `slice(0,2)` fazia a linha parecer a praça inteira
         quando era um pedaço dela. Eles se agrupam por DIA, porque é o
         dia que define a decisão — investida é por jogo, mas a pergunta
         é uma por noite. */
      const porDia = {};
      for(const o of (s.adiante ? PL().outrosJogosNaCidade(E, s.semana) : outros))
        (porDia[o.dia] = porDia[o.dia] || []).push(o);
      for(const dia of Object.keys(porDia).map(Number).sort((a,b)=>a-b)){
        const a = absDe(dia, s.adiante);
        if(!naJanela(a)) continue;
        const nomes = porDia[dia].map(x=>`${x.casa.nome} × ${x.vis.nome}`);
        const quando = quandoRot(dia, s.adiante);
        propor(E, {cat:2, peso:'decisao', voz:diretor(E, ch0),
          chave:`${ch0}|praca|${dia}`, validoAte: prazo(a),
          texto: nomes.length === 1
            ? `Vai ter ${nomes[0]} ${quando}. Quer fazer alguma coisa?`
            : `Vai ter ${nomes.slice(0,-1).join(', ')} e `+
              `${nomes[nomes.length-1]} ${quando}. Quer fazer alguma coisa?`,
          botoes: BOTOES_PLANO});
      }
    }
  }

  /* "Atacar alguém" tinha `efeito:'gestao'` e jogava o jogador na Gestão
     inteira pra ele achar sozinho três campos. Agora abre a tela do
     ataque, que tem esses três campos e mais nada — o mesmo caminho que
     a caravana fez em §8.23. A Gestão completa continua no ícone. */
  const BOTOES_PLANO = [
    {rot:'Seguir ideologia', efeito:'ideologia',
     nota:'a ideologia fecha o plano da semana'},
    {rot:'Atacar alguém', efeito:'ataque',
     nota:'quem, onde e quantas bombas'}
  ];

  /* =======================================================
     PRODUTOR 3 — A CONVOCAÇÃO PRA CENA
     Nunca sorteio solto: ou é coisa que a gente planejou, ou é
     coisa que um rival planejou contra nós.
     ======================================================= */
  function cat3(E){
    /* a) eles marcaram este dia pra vir na nossa casa */
    const atq = TO.tensao && TO.tensao.ataqueDeHoje(E);
    if(atq && !atq.avisado){
      atq.avisado = true;
      const o = M().torcida(atq.torcida) || {nome:atq.nome};
      const naEstrada = atq.alvo === 'emboscada';
      propor(E, {cat:3, peso:'decisao', voz:vozRua(), tipo:'ruim',
        chave:`c3atq|${E.data.absoluto}`,
        texto: naEstrada
          ? `Pegaram a caravana na estrada. A ${o.nome} fechou a pista.`
          : `Invadiram nosso ${atq.alvo}! A ${o.nome} tá na porta.`,
        dados:{tipo:'ataque', alvo:atq.alvo},
        botoes:[{rot: naEstrada ? 'Ir pra treta' : 'Descer pra lá',
                 efeito:'cena'},
                {rot: naEstrada ? 'Mandar seguir viagem' : 'Deixar quebrarem',
                 efeito:'nada',
                 nota: naEstrada ? 'ninguém desce do ônibus, e eles cobram'
                                 : 'ninguém desce, e a casa é deles'}]});
      return;
    }

    /* b) O DIA DO NOSSO JOGO. Duas mensagens diferentes, e o que decide
       é onde o jogo é.

       EM CASA é decisão: o botão manda RESOLVER a ida ao estádio, e o
       que volta é um dos três desfechos do §8.22 — dois deles são cena.

       FORA é a CHEGADA, e é informação: a estrada já aconteceu quando
       esta mensagem sai. A emboscada cai na véspera (o dia da ida, por
       `diasDeCaravana`), a cena dela é jogada lá, e o que sobra aqui é
       contar como o ônibus chegou. Ir ao estádio do adversário não abre
       cena nenhuma: a praça dele não é a nossa, e `resolverIda` sabe
       disso — devolveria "paz" sempre. Botão que não leva a lugar
       nenhum é botão mentiroso. */
    const j = nossoJogo(E);
    if(!j || (j.dia||6) !== E.data.dia) return;
    const cartaz = `Hoje tem ${j.mandante.nome} × ${j.visitante.nome} no `+
                   `${j.estadio}.`;

    if(!j.casa){
      /* A CARAVANA QUE MARCOU ATAQUE tem o dia da guerra dela, na
         cidade deles (§8.28). Sem ataque, a viagem continua sendo a
         mensagem de chegada de §8.23. */
      const viagem = TO.praca.encontroDaViagem(E);
      if(viagem){
        const p2 = PL().plano(E);
        const onde = (PL().ONDE_ATAQUE.find(o=>o.id === PL().ondeDoPlano(p2))
                      || {}).rot || 'nos arredores';
        propor(E, {cat:3, peso:'decisao', voz:vozRua(), tipo:'ruim',
          chave:`c3fora|${E.data.absoluto}`,
          texto:`Hoje é o dia. A ${viagem.enc.b.nome} vai estar `+
                `${onde.toLowerCase()}, em ${viagem.cidade || 'casa deles'}, `+
                `e a gente vai pra cima.`,
          dados:{tipo:'ida'},
          botoes:[{rot:'Ir para a guerra', efeito:'ida',
                   nota:`${viagem.enc.a.n} embarcados`+
                        `${p2.bombas ? ` · ${p2.bombas} bomba`+
                                       `${p2.bombas>1?'s':''}` : ''}`}]});
        return;
      }
      propor(E, {cat:3, peso:'info', voz:vozRua(),
        chave:`c3fora|${E.data.absoluto}`,
        tipo: chegadaRuim(E, j) ? 'ruim' : '',
        texto:`${cartaz} ${chegada(E, j)}`});
      return;
    }

    const naPraca = TO.praca.jogosDaPraca(E).some(x=>x.dia === E.data.dia);
    if(!naPraca) return;
    const p = PL().plano(E);
    const alvo = p.intencao === 'paz' ? null
               : (M().torcida(p.alvoTorcida)||{}).nome;

    /* O DIA DA GUERRA. Com ataque marcado a mensagem não é mais a
       convocação comum com outro rótulo de botão: é a briga que a
       gente marcou, com o alvo e o lugar escolhidos no assistente.
       Sem ataque, a convocação continua a de sempre. */
    if(alvo){
      const onde = (PL().ONDE_ATAQUE.find(o=>o.id === PL().ondeDoPlano(p))
                    || {}).rot || 'nos arredores';
      propor(E, {cat:3, peso:'decisao', voz:vozRua(), tipo:'ruim',
        chave:`c3jogo|${E.data.absoluto}`,
        texto:`Hoje é o dia. A ${alvo} vai estar `+
              `${onde.toLowerCase().replace(/^na /,'na ').replace(/^nos /,'nos ')}`+
              `, e a gente vai pra cima.`,
        dados:{tipo:'ida'},
        botoes:[{rot:'Ir para a guerra', efeito:'ida',
                 nota:`${PL().efetivoDaSaida(E)} nossos`+
                      `${p.bombas ? ` · ${p.bombas} bomba`+
                                    `${p.bombas>1?'s':''}` : ''}`}]});
      return;
    }
    propor(E, {cat:3, peso:'decisao', voz:vozRua(),
      chave:`c3jogo|${E.data.absoluto}`,
      texto:`${cartaz} A bateria sai da sede.`,
      dados:{tipo:'ida'},
      /* UM BOTÃO SÓ. "Ficar em casa" saiu: o time joga, a torcida vai.
         Não era escolha de verdade — era a opção que o jogador apertava
         pra não abrir a cena, e o custo dela em moral nunca foi sentido
         porque a moral já cai por outros seis caminhos. */
      botoes:[{rot:'Ir pro estádio', efeito:'ida'}]});
  }

  /* A ESTRADA DESTA VIAGEM, quando houve emboscada nela. `E.viagem` é
     escrito pelo fecho da cena (`acoes.fecharDefesa`) e vale só pra
     semana em que foi escrito: viagem da semana passada não conta
     história de hoje. */
  const viagemDeHoje = E => {
    const v = E.viagem;
    return (v && v.ano === E.data.ano && v.semana === E.data.semana) ? v : null;
  };
  const chegadaRuim = (E, j) => {
    const v = viagemDeHoje(E);
    return !!(v && !v.seguramos);
  };
  function chegada(E, j){
    const cidade = j.cidadeAdv || 'lá';
    const v = viagemDeHoje(E);
    if(!v) return `Nossa caravana foi tranquila e já estamos em ${cidade}.`;
    if(v.seguramos)
      return `Eles tentaram atacar a gente na estrada, mas passamos por cima.`;
    /* PERDER SEM FERIDO EXISTE, e o texto tem de saber disso. A briga
       pode terminar sem ninguém no chão — as duas turmas se olham, a PM
       chega, o ônibus segue —, e aí quem perdeu perdeu no critério de
       desempate, não no soco. Dizer "tivemos algumas baixas com 0
       feridos" é a mensagem se contradizendo dentro da própria frase. */
    if(!v.feridos)
      return `Levamos a pior na estrada, mas ninguém ficou pelo caminho: `+
             `já estamos em ${cidade}.`;
    /* O NÚMERO É EXATO e sai de quem embarcou: são os feridos da cena da
       emboscada, contados na escalação da caravana. Quem se feriu não
       está na conta de quem chegou. */
    return `Tivemos algumas baixas na caravana com ${v.feridos} `+
           `${v.feridos === 1 ? 'ferido' : 'feridos'}, mas já chegamos em `+
           `${cidade}.`;
  }

  /* A IDA RESOLVIDA.
     O jogo não simula mais a caminhada: ele calcula de uma vez o que
     aconteceu no caminho e devolve o desfecho. Chegar em paz é
     informação e vira mensagem aqui mesmo; os outros dois são cena, e
     quem abre a tela é a casca — este módulo não conhece canvas. */
  function irProEstadio(E){
    /* A BRIGA MARCADA EM VIAGEM vem primeiro: `resolverIda` só conhece
       a nossa praça e devolveria "paz" com `semNos`, que é verdade — a
       rua daqui está vazia — e que não é a resposta da pergunta. */
    const r = TO.praca.encontroDaViagem(E) || TO.praca.resolverIda(E);
    if(!r || r.desfecho === 'paz'){
      propor(E, {cat:4, peso:'info', voz:vozRua(), chave:`ida|${E.data.absoluto}`,
        texto: r && r.semNos
          /* nosso clube não joga nesta praça hoje: quem viajou foi a
             caravana, e o que pode acontecer com ela na estrada é a
             emboscada, que tem caminho próprio */
          ? 'A viagem foi tranquila. Ninguém fechou a pista, e a caravana '+
            'chegou inteira.'
          : 'A ida foi tranquila. Ninguém cruzou com ninguém no caminho, '+
            'e a bateria entrou inteira.'});
      return {aviso:'Chegamos em paz.', desfecho:'paz'};
    }
    const deles = r.enc.b;
    const onde = r.onde || {};
    /* a surpresa vira registro ANTES da cena: quando o jogador sair da
       briga, o feed já tem a linha que explica por que ela existiu */
    propor(E, {cat:4, peso:'info', voz:vozRua(), tipo:'ruim',
      chave:`ida|${E.data.absoluto}`,
      texto: r.desfecho === 'planejada'
        ? `Fomos pra cima da ${deles.nome} ${ondeRot(onde)}: `+
          `${r.enc.a.n} nossos contra ${deles.n} deles.`
        : `${r.porQue === 'procuraram' ? `A ${deles.nome} veio nos procurar`
                                       : `Demos de cara com a ${deles.nome}`} `+
          `${ondeRot(onde)}: ${deles.n} deles contra ${r.enc.a.n} nossos.`});
    return {encontro: r.enc, desfecho: r.desfecho, onde, porQue: r.porQue};
  }

  const LOCAL_ROT = {rua:'numa rua de periferia',
                     'rua-media':'numa rua de classe média',
                     'rua-nobre':'numa rua de bairro nobre',
                     praca:'na praça', bar:'no bar deles',
                     arredores:'nos arredores do estádio'};
  /* "no bairro X" e não "no X": nome de bairro tem gênero, o gênero não
     está nos dados, e adivinhar dá "no Aldeota" e "dAldeota". */
  const ondeRot = onde =>
    (LOCAL_ROT[onde.local] || 'na rua') +
    (onde.bairro ? `, no bairro ${onde.bairro}` : '');

  /* =======================================================
     PRODUTOR 4 — RESULTADO
     Quase todo resultado chega por `anotar`, de dentro do módulo
     que o produziu. O que nasce aqui é o que ninguém anotava: a
     fiança de quem foi preso.
     ======================================================= */
  function cat4(E){
    const c = ctl(E);
    c.fiancas = c.fiancas || {};
    for(const m of E.membros){
      if(!m.preso || c.fiancas[m.id]) continue;
      c.fiancas[m.id] = E.data.absoluto;
      propor(E, {cat:4, peso:'acao', voz:vozRua(), tipo:'ruim',
        chave:`c4fi|${m.id}|${E.data.absoluto}`,
        texto:`O ${TO.membros.nomeDe(m)} foi preso. Fiança de `+
              `${U.dinheiro(TO.membros.fianca(m))}.`,
        dados:{membroId:m.id},
        botoes:[{rot:'Pagar fiança', efeito:'fianca'}]});
    }
    /* solto ou cumprida a pena, o registro sai — pra a próxima prisão
       do mesmo sujeito virar mensagem de novo */
    for(const id of Object.keys(c.fiancas)){
      const m = E.membros.find(x=>String(x.id) === String(id));
      if(!m || !m.preso) delete c.fiancas[id];
    }
  }

  /* =======================================================
     PRODUTOR 5 — MUNDO E JORNAL
     O pulso regular. Roda no fechamento da semana e espalha o
     que tem pra dizer pelos sete dias seguintes: notícia
     empilhada na segunda-feira não é feed, é boletim.
     ======================================================= */
  function cat5(E, rel){
    const ch = `c5|${E.data.ano}|${E.data.semana}`;
    const hoje = E.data.absoluto || 0;
    /* QUANTO O MUNDO FALA DEPENDE DE QUANTO FUTEBOL TEVE. Fora de
       competição a praça não tem rodada, e o feed tem de ficar quieto:
       inventar manchete pra tapar buraco é exatamente o que o item 7
       proíbe. */
    const teve = (rel && rel.jogo) || TO.praca.jogosDaPraca(E).length;
    let cota = teve ? 3 : 1;
    const espalhar = i => hoje + 1 + ((hash(ch+'|d'+i) % 6));

    /* a) a rodada inteira em UMA linha */
    const jogos = jogosDaRodada(E);
    if(jogos.length){
      /* OS OITO RESULTADOS DA RODADA SÃO UMA LINHA, NÃO OITO. Cabem
         quatro placares na linha, os da nossa praça na frente; o resto
         é contado em vez de sumir — corte silencioso faz a linha parecer
         a rodada inteira quando ela é um pedaço dela. */
      const nossos = jogos.filter(x=>x.local), fora = jogos.filter(x=>!x.local);
      const todos = nossos.concat(fora);
      const lista = todos.slice(0,4).map(x=>`${x.casa} ${x.gc}×${x.gf} ${x.vis}`);
      const resto = todos.length - lista.length;
      propor(E, {cat:5, peso:'info', voz:vozJornal(), chave:ch+'|rodada',
        local:!!nossos.length, naoAntesDe:hoje,
        texto:`Confira os resultados de ${diaRot(6)}: ${lista.join(', ')}`+
              (resto ? ` e mais ${resto} ${resto===1?'jogo':'jogos'}.` : '.'),
        linhaAbaixo:{texto:'Ver Competições', acao:'painel', pagina:'competicoes'}});
      cota--;
    }

    /* b) o que as outras aprontaram, com o nosso mapa na frente

       BRIGA DE FORA NÃO ENTRA AQUI, E ISTO É FILTRO DE EXIBIÇÃO. Nada
       muda no mundo: as 138 continuam brigando entre si pelos mesmos
       dois portões, na mesma frequência, movendo tensão, relação,
       moral, prestígio, polícia, caixa e efetivo. O que muda é o que o
       FEED carrega — duas torcidas de outro estado se pegando não é
       assunto de quem não tem nada com aquilo, e ocupava linha na tela.
       Elas continuam existindo e continuam contadas na aba "Todos os
       confrontos" da tela de Notícias, que é pra isso que ela existe.

       `local` deixou de ser `some` e virou `every`: uma briga entre uma
       torcida daqui e uma de fora acontece longe daqui na metade dos
       casos, e o que qualifica a notícia é as DUAS dividirem a nossa
       praça. Só a briga é filtrada — trégua e diplomacia continuam
       passando, porque acordo entre duas grandes é notícia de jornal
       em qualquer cidade.

       Briga NOSSA não passa por aqui em momento nenhum: ela chega como
       resultado, na categoria 4, e esse caminho não mudou. */
    const noticias = (E.ultimasNoticias||[]).map((n,i)=>{
      const t = (n.torcidas||[]).map(id=>M().torcida(id)).filter(Boolean);
      return {n, i, daPraca: t.length > 0 &&
                             t.every(x=>x.mapa === E.torcida.mapa)};
    }).filter(x => x.n.tipo !== 'briga' || x.daPraca)
      .map(x => ({n:x.n, i:x.i, local:x.daPraca}))
      .sort((a,b)=>(b.local?1:0)-(a.local?1:0));
    for(const x of noticias){
      if(cota <= 0) break;
      cota--;
      /* QUANDO A NOTÍCIA CAI. A que nasceu de um jogo já vem com o dia
         marcado — o do jogo ou o seguinte —, porque foi a caravana que
         criou o encontro e a data faz parte do fato. A que nasceu de
         duas torcidas que dividem a praça cai em dia qualquer da
         semana: elas se cruzam sem precisar de jogo. */
      propor(E, {cat:5, peso:'info', voz:vozJornal(), local:x.local,
        chave:`${ch}|n${x.i}`,
        naoAntesDe: x.n.naoAntesDe != null ? x.n.naoAntesDe : espalhar(x.i),
        /* A NOTÍCIA DE JOGO TEM JANELA DE DOIS DIAS e morre nela. Sem
           isso a fila podia segurá-la — por cota da semana ou pela
           regra da categoria em sequência — e ela saía na segunda-feira
           seguinte, contando uma briga de um jogo que já tinha virado
           semana. Notícia atrasada não é notícia. */
        validoAte: x.n.naoAntesDe != null ? x.n.naoAntesDe + 1 : null,
        efeitos: x.n.efeitos,
        /* quem são e por que podiam se encontrar: é o que permite
           conferir no save que a notícia era possível */
        dados:{torcidas:x.n.torcidas, motivo:x.n.motivo, diaJogo:x.n.dia,
               absJogo:x.n.absJogo, semanaJogo:x.n.semanaJogo,
               vencedor:x.n.vencedor, perdedor:x.n.perdedor, contas:x.n.contas},
        texto: /[.!?]$/.test(x.n.txt) ? x.n.txt : x.n.txt + '.'});
    }

    /* c) o marco: a maior do país, a que passou de 400, a que fechou */
    if(cota > 0) marcoDoMundo(E, ch, espalhar(9));
  }

  /* a rodada que acabou de ser jogada, com a nossa praça marcada */
  function jogosDaRodada(E){
    const fora = [];
    if(!E.temporada) return fora;
    /* `jogarSemana` roda no fecho e a semana já virou: a rodada que
       interessa é a anterior */
    const sem = E.data.semana - 1 || 52;
    for(const comp of E.temporada.competicoes)
      for(const etapa of [...comp.rodadas, ...comp.mata]){
        if(etapa.semana !== sem) continue;
        for(const j of etapa.jogos){
          /* jogo jogado é jogo com placar: `gc` só existe depois que
             `jogarSemana` rodou. Não há campo `jogado` — procurar por um
             deixava a linha de resultados muda a temporada inteira. */
          if(!j.f || j.gc == null) continue;
          const casa = M().time(j.c), vis = M().time(j.f);
          if(!casa || !vis) continue;
          fora.push({casa:casa.nome, vis:vis.nome, gc:j.gc, gf:j.gf,
                     local: casa.mapa === E.torcida.mapa ||
                            vis.mapa  === E.torcida.mapa});
        }
      }
    return fora;
  }

  function marcoDoMundo(E, ch, quando){
    const m = TO.tensao ? TO.tensao.mundo(E) : null;
    if(!m) return;
    const c = ctl(E);
    c.marcos = c.marcos || {};
    let maior = null, quebrada = null;
    for(const [id, v] of Object.entries(m)){
      if(!maior || v.membros > m[maior].membros) maior = id;
      if(v.membros <= 8 && !c.marcos['fim|'+id]) quebrada = id;
    }
    if(quebrada){
      const o = M().torcida(quebrada);
      c.marcos['fim|'+quebrada] = true;
      if(o) propor(E, {cat:5, peso:'info', voz:vozJornal(), naoAntesDe:quando,
        chave:ch+'|fim', local:o.mapa === E.torcida.mapa,
        texto:`${o.nome} fechou as portas — sem caixa, sem sede.`});
      return;
    }
    if(maior && m[maior].membros >= 400 && !c.marcos['400|'+maior]){
      const o = M().torcida(maior);
      c.marcos['400|'+maior] = true;
      if(o) propor(E, {cat:5, peso:'info', voz:vozJornal(), naoAntesDe:quando,
        chave:ch+'|400', local:o.mapa === E.torcida.mapa,
        texto:`A ${o.nome} passou dos 400 membros. É a maior do país.`});
    }
  }

  /* =======================================================
     PRODUTOR 6 — A INTERNA
     No máximo uma por semana, e só com condição real de pé. A
     cota e o "não repete o assunto duas semanas seguidas" são
     do escalonador; aqui só se escolhe o assunto do dia.
     ======================================================= */
  const ASSUNTOS = [
    /* O CAIXA NO VERMELHO SAIU DAQUI e virou o alarme do fechamento
       (`fecharSemana`). Ele nunca foi assunto de dia: é a leitura da
       semana que fechou, e quem sabe disso é o `rel` que o fecho
       entrega. Mantê-lo como produtor de dia obrigava a consultar
       `semanasNoVermelho`, que é um contador de estado e não sabe de
       gente saindo — o outro motivo pelo qual a semana é grave. */

    {id:'assalto', peso:'decisao', freq:'mensal',
     quando: E => E.dinheiro < 8000 &&
                  (TO.acoes.porId('assalto').disponivel(E)||{}).ok,
     monta: (E, v) => ({
       texto:`Mestre, deixa nós meter o assalto na joalheria, tamo `+
             `precisando de caixa.`,
       botoes:[{rot:'Pode ir', efeito:'assalto', nota:'gasta uma ação da semana'},
               {rot:'Deixa isso', efeito:'nada'}]})},

    {id:'sede', peso:'acao', freq:'mensal',
     quando: E => E.membros.length >= TO.membros.capacidade(E)*0.9,
     monta: (E, v) => ({
       texto:`A sede não comporta mais gente. Tá na hora de subir de nível.`,
       botoes:[{rot:'Abrir Patrimônio', efeito:'painel', pagina:'financeiro'}]})},

    {id:'material', peso:'acao', freq:'mensal',
     quando: E => TO.torcedores.material(E) < 0.6,
     monta: (E, v) => ({
       texto:`Bora comprar material, a arquibancada tá muda.`,
       botoes:[{rot:'Abrir Patrimônio', efeito:'painel', pagina:'financeiro'}]})},

    {id:'promocao', peso:'acao', freq:'mensal',
     quando: E => E.membros.filter(m=>TO.membros.podePromover(E,m).ok).length >= 5,
     monta: (E, v) => {
       const n = E.membros.filter(m=>TO.membros.podePromover(E,m).ok).length;
       return {texto:`Tem ${n} moleque pronto pra promoção.`,
         botoes:[{rot:'Abrir Torcida', efeito:'painel', pagina:'torcida'}]};}},

    {id:'elenco', peso:'acao', freq:'mensal',
     quando: E => E.dinheiro >= 300000,
     monta: (E, v) => ({
       texto:`Tamo com ${U.dinheiro(E.dinheiro)} parado. Dá pra reforçar o `+
             `elenco do ${E.torcida.clube}.`,
       botoes:[{rot:'Abrir Patrimônio › Elenco', efeito:'painel',
                pagina:'financeiro'}]})},

    /* 6.8 — A DIFICULDADE DE UM MEMBRO. Quem é o membro sai do hash da
       semana, e não de sorteio: o mesmo save reaberto traz o mesmo
       nome. Só entra quem está disponível — quem já está ferido ou
       preso tem problema maior que a mãe doente. */
    {id:'ajuda', peso:'decisao', freq:'ocasional',
     quando: E => E.dinheiro >= 1000 &&
                  E.membros.filter(TO.membros.disponivel).length >= 3,
     monta: (E, v) => {
       const aptos = E.membros.filter(TO.membros.disponivel);
       const m = aptos[hash(`ajuda|${E.semente}|${semanaAbs(E)}`) % aptos.length];
       return {texto:`O membro ${TO.membros.nomeDe(m)} tá passando `+
                     `dificuldade com a mãe. Bora ajudar ele?`,
         dados:{membroId:m.id, nome:TO.membros.nomeDe(m)},
         botoes:[{rot:'Ajudar', efeito:'ajudar-membro',
                  nota:'R$ 1.000 · a moral dele sobe muito'},
                 {rot:'Não ajudar', efeito:'nao-ajudar',
                  nota:'a moral coletiva cai'}]};}},

    /* 6.9 — O PRESO ESQUECIDO. Quatorze dias é o prazo em que a fiança
       deixou de ser a resposta: quem não pagou não vai pagar, e o que
       resta é aparecer. */
    {id:'visita-preso', peso:'decisao', freq:'ocasional',
     quando: E => !!presoEsquecido(E),
     monta: (E, v) => {
       const m = presoEsquecido(E);
       return {texto:`O ${TO.membros.nomeDe(m)} tá no presídio há duas `+
                     `semanas e ninguém foi visitar.`, tipo:'ruim',
         dados:{membroId:m.id, nome:TO.membros.nomeDe(m)},
         botoes:[{rot:'Organizar a visita', efeito:'visitar-preso',
                  nota:'R$ 1.000 · a moral dele sobe'},
                 {rot:'Deixar quieto', efeito:'nao-visitar',
                  nota:'ele não esquece'}]};}},

    {id:'moral', peso:'info', freq:'ocasional',
     quando: E => E.indicadores.moral <= 7,
     monta: (E, v) => ({tipo:'ruim',
       texto:`O pessoal tá desanimado. Ninguém quer sair de casa esse fim `+
             `de semana.`})}
  ];

  /* quem está preso há 14 dias ou mais e ninguém pagou fiança */
  function presoEsquecido(E){
    const hoje = E.data.absoluto || 0;
    return (E.membros||[]).find(m=>m.preso && typeof m.preso === 'object' &&
      (hoje - (m.preso.desde != null ? m.preso.desde : hoje)) >= 14 &&
      !m.preso.visitado) || null;
  }

  function cat6(E){
    /* um dia fixo da semana por assunto, tirado do hash: a interna não
       cai sempre na segunda-feira.

       O ASSUNTO URGENTE NÃO ESPERA O DIA SORTEADO. O caixa no vermelho
       é a rede de segurança da debandada: ele tem de chegar na semana
       em que o buraco apareceu, não na semana seguinte, senão o jogador
       é avisado depois que o pessoal já saiu — que é exatamente o
       contrário de avisar. */
    const ch = `c6|${E.data.ano}|${E.data.semana}`;
    const noDia = E.data.dia === inteiro(E, ch+'|dia', 2, 6);
    const c = ctl(E);
    for(const a of ASSUNTOS){
      if(!noDia && !a.urgente) continue;
      if(!a.quando(E)) continue;
      if(naCarencia(E, {assunto:a.id, frequencia:a.freq})) continue;
      const voz = diretor(E, ch+'|'+a.id);
      const m = a.monta(E, voz);
      propor(E, Object.assign({cat:6, peso:a.peso, voz, assunto:a.id,
                               frequencia:a.freq,
                               urgente:!!a.urgente, chave:ch+'|'+a.id}, m));
      return;                 // uma por semana, e a primeira da lista manda
    }
  }

  /* =======================================================
     PRODUTOR 7 — DIPLOMACIA E PROVOCAÇÃO
     Duas a quatro por mês somando aliados e rivais.
     ======================================================= */

  /* AS NOVE AMEAÇAS. Cada uma só dispara com a condição de pé — é a
     condição que faz a provocação acertar. Ameaça sobre caravana em
     semana sem viagem denuncia que o texto é sorteado; com a condição, a
     rival parece estar prestando atenção no jogador.

     As de nº 1 e 2 são reserva: só saem quando nenhuma das outras está
     de pé. */
  const AMEACAS = [
    {n:1, reserva:true, quando:()=>true,
     fala:()=>`Se liga, moleque. Quando menos esperar a gente tá na tua porta.`},

    {n:2, reserva:true,
     quando:(E,o,x)=> x.jogoEm != null && x.jogoEm <= 3,
     fala:(E,o,x)=>`${x.diaJogo} a gente se vê no ${x.estadio}. Vai com Deus `+
                   `que com a gente não dá.`},

    {n:3, quando:(E,o,x)=> !!x.mesmaZona,
     fala:(E,o,x)=>`Some do ${x.bairroDeles}, otário. Esse pedaço aí não é de `+
                   `vocês e nunca foi.`},

    {n:4, quando:(E,o,x)=> x.ultimo && !x.ultimo.ganhamos,
     fala:(E,o,x)=>`Ainda tá cheirando a sangue de vocês lá na `+
                   `${x.ultimo.bairro || x.bairroDeles}. Volta lá pra tomar mais.`},

    {n:5, quando:(E,o,x)=> x.ultimo && x.ultimo.ganhamos,
     fala:()=>`Ganharam com o dobro de gente e tão se achando. Vem sozinho da `+
              `próxima vez, vacilão.`},

    {n:6, quando:(E,o,x)=> x.sedeNossa <= 2 || x.sedeDeles > x.sedeNossa,
     fala:()=>`Aquele barraco que vocês chamam de sede tá com os dias contados.`},

    {n:7, quando:(E,o,x)=> x.caravana,
     fala:()=>`Boa viagem, hein. Estrada é longa e escura, cuidado no caminho.`},

    {n:8, quando:(E,o,x)=> x.deles > x.nossos,
     fala:(E,o,x)=>`Vocês são ${x.nossos} gato pingado. A gente leva isso aí de `+
                   `bonde, sem suar.`},

    {n:9, quando:(E,o,x)=> x.temMaterial,
     fala:(E,o,x)=>`Cuida bem desse ${x.temMaterial}, viu. Vai ficar bonito `+
                   `pendurado na nossa sede.`}
  ];

  /* o retrato do par nós×eles que as nove condições consultam */
  function contexto(E, o){
    const j = nossoJogo(E);
    const mundoDeles = (TO.tensao && TO.tensao.mundo(E)[o.id]) || {};
    const nossoB = M().bairroDaSede(E.torcida);
    const delesB = M().bairroDaSede(o);
    /* jogo nosso ou deles em três dias */
    let jogoEm = null, diaJogo = '', estadio = '';
    const jogosPraca = TO.praca.jogosDaPraca(E);
    const contra = jogosPraca.find(x=>
      M().torcidasDe(x.vis.id).some(t=>t.id===o.id) ||
      M().torcidasDe(x.casa.id).some(t=>t.id===o.id));
    if(contra && contra.dia >= E.data.dia){
      jogoEm = contra.dia - E.data.dia;
      diaJogo = diaRot(contra.dia).replace(/^./, s=>s.toUpperCase());
      estadio = (M().estadioDoClube && (M().estadioDoClube(contra.casa.id)||{}).nome)
              || contra.casa.estadio || 'estádio';
    } else if(j && (j.advId === o.clubeId) && (j.dia||6) >= E.data.dia){
      jogoEm = (j.dia||6) - E.data.dia;
      diaJogo = diaRot(j.dia||6).replace(/^./, s=>s.toUpperCase());
      estadio = j.estadio || 'estádio';
    }
    const P = TO.patrimonio;
    const temMaterial = P && P.quantidade(E,'bandeirao_20') + P.quantidade(E,'bandeirao_10')
                          + P.quantidade(E,'bandeirao_50') > 0 ? 'bandeirão'
                      : P && P.quantidade(E,'bateria_base') + P.quantidade(E,'bateria_completa') > 0
                        ? 'instrumento da bateria' : null;
    return {
      jogoEm, diaJogo, estadio,
      mesmaZona: !!(nossoB && delesB && nossoB.zona === delesB.zona &&
                    o.mapa === E.torcida.mapa),
      bairroDeles: (delesB||{}).nome || o.bairroSede || 'quebrada',
      ultimo: (E.ultimoConfronto||{})[o.id] || null,
      sedeNossa: E.torcida.sedeNivel || 1,
      sedeDeles: mundoDeles.sede || o.sedeNivel || 1,
      caravana: TO.financeiro.temCaravana(E),
      nossos: E.membros.length,
      deles: mundoDeles.membros || o.membros || 20,
      temMaterial
    };
  }

  function cat7(E){
    const c = ctl(E);
    const ch = `c7|${E.data.ano}|${E.data.semana}`;
    /* A COTA DO MÊS, ESPALHADA PELAS SEMANAS. Duas a quatro por mês:
       sorteia-se o alvo do mês uma vez, e a cada semana a chance é a
       cota que falta dividida pelas semanas que faltam. Sem isso, ou
       tudo cai na primeira semana ou o mês fecha com zero. */
    const alvoMes = 2 + Math.floor(dado(E, `c7m|${E.data.ano}|${mesAbs(E)}`)*3);
    const semanaNoMes = ((E.data.semana - 1) % 4) + 1;
    const faltamSem = 5 - semanaNoMes;
    const faltamMsg = Math.max(0, alvoMes - c.mes.c7);
    if(!faltamMsg) return;
    if(E.data.dia !== inteiro(E, ch+'|dia', 1, 7)) return;
    if(dado(E, ch+'|vai') > faltamMsg/faltamSem) return;

    /* aliado em festa tem preferência: é data marcada, e data marcada
       não espera a semana seguinte */
    if(festaDeAliado(E, ch)) return;

    /* a rival: nunca a mesma duas vezes seguidas */
    const cands = rivais(E).filter(o=>o.id !== c.ultimaRival);
    if(!cands.length) return;
    const o = pega(E, ch+'|quem', cands);
    if(!o) return;
    const x = contexto(E, o);
    const hoje = E.data.absoluto || 0;
    const podeUsar = a => {
      const ult = c.ameacas[`${o.id}|${a.n}`];
      return (ult == null || hoje - ult >= CARENCIA_AMEACA) && a.quando(E, o, x);
    };
    const fortes = AMEACAS.filter(a=>!a.reserva && podeUsar(a));
    const reserva = AMEACAS.filter(a=>a.reserva && podeUsar(a));
    const a = pega(E, ch+'|fala', fortes.length ? fortes : reserva);
    if(!a) return;
    c.ameacas[`${o.id}|${a.n}`] = hoje;
    c.ultimaRival = o.id;
    propor(E, {cat:7, peso:'decisao', voz:vozRival(E, o, ch), chave:ch+'|'+o.id,
      texto:a.fala(E, o, x), dados:{torcidaId:o.id, ameaca:a.n},
      /* RESPONDER PROVOCAÇÃO É COMPRAR BRIGA, e passou a custar o que
         custa: era +1 de tensão, um agrado que não movia nada — com o
         corte da ideologia em 30, seriam trinta provocações respondidas
         pra ela valer uma vez. */
      botoes:[{rot:'Vem, verme', efeito:'tensao', quanto:5, relacao:-3,
               nota:'+5 de tensão · −3 de relação'},
              {rot:'Não dar moral', efeito:'nada', nota:'nada acontece'}]});
  }

  /* A FESTA DO ALIADO CAI NO DIA DE FUNDAÇÃO DELE, e agora é o dia de
     verdade: a planilha do autor sempre teve a data completa — Gaviões
     em 01/07/1969 — e a importação jogava dia e mês fora, guardando só o
     ano. Enquanto foi só o ano, o dia saía do hash do id: inventado, mas
     fixo. Hoje 137 das 140 têm a data da planilha; as 3 que não têm
     continuam no hash, que virou reserva em vez de regra. */
  function semanaDaFundacao(E, o){
    if(o.fundacaoDia && o.fundacaoMes){
      const d = TO.estado.semanaDiaDe(
        new Date(E.data.ano, o.fundacaoMes - 1, o.fundacaoDia));
      /* 1º de janeiro de 2026 é ANTES da semana 1 do jogo: o calendário
         começa na primeira segunda-feira do ano, dia 5, e `semanaDiaDe`
         devolve nulo pros quatro dias antes dela. Quinze torcidas —
         Bamor, Camisa 12 do Vitória e outras fundadas em 01/01 — caíam
         calada no hash por causa disso. Aniversário de 1º de janeiro é
         semana 1, e ponto. */
      if(d) return d.semana;
      return 1;
    }
    return Math.floor((hash('fest|'+o.id) % 364)/7) + 1;
  }

  function festaDeAliado(E, ch){
    const c = ctl(E);
    for(const [id, v] of Object.entries(E.relacoes||{})){
      if(v < PL().RELACAO_ALIADO) continue;
      const o = M().torcida(id);
      if(!o || !o.fundacao) continue;
      if(semanaDaFundacao(E, o) !== E.data.semana) continue;
      if(c.assunto['festa|'+id] === semanaAbs(E)) continue;
      c.assunto['festa|'+id] = semanaAbs(E);
      const anos = E.data.ano - o.fundacao;
      propor(E, {cat:7, peso:'decisao', voz:vozAliado(E, o), chave:ch+'|festa|'+id,
        texto:`Fala irmão, vamos fazer uma festa de comemoração aos nossos `+
              `${anos} anos de história. Consegue vir?`,
        dados:{torcidaId:id, nome:o.nome, custo:3000},
        botoes:[{rot:'Sim', efeito:'festa-sim', nota:'+5 de relação · R$ 3.000'},
                {rot:'Não', efeito:'festa-nao', nota:'−4 de relação'}]});
      return true;
    }
    return false;
  }

  /* =======================================================
     PRODUTOR 5B — O CLUBE

     Dez linhas de calendário e de campanha. Elas moram na categoria 5
     porque a 5 já é o jornal e já tem volume: abrir uma categoria pra
     "o clube contratou fulano" seria dar a ela o mesmo peso de fila que
     a diplomacia tem.

     A CAMPANHA SAI DA TABELA, NÃO DE UM CONTADOR NOVO. `tabela()` já
     ordena a competição e as rodadas dizem o que falta jogar; daqui sai
     tudo — título ao alcance, rebaixamento e acesso confirmados. Um
     número que o jogo já sabe calcular não vira campo no save.
     ======================================================= */
  const CP = () => TO.competicoes;
  const VIT = 3;                       // pontos por vitória

  /* a competição de pontos corridos em que o nosso clube está, com a
     posição, o que falta jogar e as duas linhas de corte */
  function campanha(E){
    if(!E.temporada) return null;
    const meu = E.torcida.clubeId;
    for(const comp of E.temporada.competicoes){
      if(!comp.pontosCorridos || !(comp.clubes||[]).includes(meu)) continue;
      const tab = CP().tabela(comp, 0);
      const pos = tab.findIndex(l=>l.id === meu);
      if(pos < 0) continue;
      let restam = 0;
      for(const r of comp.rodadas)
        for(const j of r.jogos)
          if((j.c === meu || j.f === meu) && (j.gc == null)) restam++;
      return {comp, tab, pos, linha:tab[pos], restam, total:tab.length};
    }
    return null;
  }
  const maxDe = (l, restam) => l.p + VIT*restam;

  /* quantas rodadas faltam pra CADA clube: o cálculo do "matematicamente
     confirmado" precisa do máximo do adversário, não do nosso */
  function restamDe(comp, id){
    let n = 0;
    for(const r of comp.rodadas)
      for(const j of r.jogos)
        if((j.c === id || j.f === id) && (j.gc == null)) n++;
    return n;
  }

  function cat5Clube(E){
    const c = ctl(E);
    c.clube = c.clube || {};
    const meu = E.torcida.clubeId;
    const clube = M().time(meu);
    if(!clube) return;
    const ano = E.data.ano, hoje = E.data.absoluto || 0;
    const jaFoi = k => c.clube[k+'|'+ano];
    const marca = k => { c.clube[k+'|'+ano] = hoje; };

    /* ---- 5.9 e 5.11: o que o fim de temporada carimbou ---- */
    const fim = E.fimDeTemporada;
    if(fim && !fim.contado){
      fim.contado = true;
      if(fim.titulos && fim.titulos.length){
        propor(E, {cat:5, peso:'decisao', urgente:true, voz:vozJornal(),
          tipo:'boa', chave:`c5tit|${ano}|${fim.titulos[0]}`,
          texto:`O ${clube.nome} é campeão.`,
          botoes:[{rot:'Carreata pela cidade', efeito:'carreata',
                   nota:'R$ 8.000 · a cidade inteira vê'},
                  {rot:'Comemorar na sede', efeito:'comemorar-sede',
                   nota:'R$ 1.500 · churrasco e bateria'}]});
      }
      if(fim.rivalCaiu){
        const rc = M().time(fim.rivalCaiu);
        if(rc) propor(E, {cat:5, peso:'decisao', voz:vozJornal(), tipo:'boa',
          chave:`c5rival|${ano}|${fim.rivalCaiu}`,
          texto:`O ${rc.nome} foi rebaixado.`,
          dados:{clubeId:fim.rivalCaiu, nome:rc.nome},
          botoes:[{rot:'Fazer o caixão na frente da sede deles',
                   efeito:'caixao',
                   nota:'prestígio sobe, a polícia aperta e eles não esquecem'},
                  {rot:'Deixar quieto', efeito:'nada'}]});
      }
      return;
    }

    /* ---- 5.1: o sorteio da Copa ---- */
    const copa = (E.temporada.competicoes||[]).find(x=>x.copa);
    if(copa && (copa.mata||[]).length){
      const etapa = copa.mata[copa.mata.length-1];
      const j = (etapa.jogos||[]).find(x=>x.c === meu || x.f === meu);
      if(j && !jaFoi('copa|'+etapa.fase)){
        marca('copa|'+etapa.fase);
        const advId = j.c === meu ? j.f : j.c;
        const adv = M().time(advId);
        if(adv) propor(E, {cat:5, peso:'info', voz:vozJornal(),
          chave:`c5copa|${ano}|${etapa.fase}`,
          texto:`Sorteio da ${CP().COPA_NOME}: pegamos o ${adv.nome} `+
                `${j.c === meu ? 'em casa' : 'fora de casa'}.`,
          linhaAbaixo:{texto:'Ver Competições', acao:'painel',
                       pagina:'competicoes'}});
        return;
      }
      /* ---- 5.6: caímos ---- */
      for(const et of copa.mata){
        const jj = (et.jogos||[]).find(x=>(x.c === meu || x.f === meu) && x.venceu);
        if(!jj || jj.venceu === meu) continue;
        if(jaFoi('copafora')) break;
        marca('copafora');
        const advId = jj.c === meu ? jj.f : jj.c;
        const adv = M().time(advId);
        const a = E.indicadores.satisfacao;
        E.indicadores.satisfacao = U.limitar(a - 2, 0, 20);
        propor(E, {cat:5, peso:'info', voz:vozJornal(), tipo:'ruim',
          chave:`c5copafora|${ano}`,
          texto:`Nosso clube caiu na ${CP().COPA_NOME} pro `+
                `${(adv||{}).nome || 'adversário'}.`,
          efeitos:[{ind:'satisfacao',
                    delta:r1(E.indicadores.satisfacao - a), dono:'da torcida'}]});
        return;
      }
    }

    /* ---- 5.3: o clássico daqui a três dias ---- */
    const jg = E.proximoJogo;
    if(jg && (jg.dia||6) - 3 === E.data.dia && jg.advId){
      /* `rivaisDiretos` devolve um Map clube → Set dos rivais dele */
      const pares = CP().rivaisDiretos();
      const meus = pares && pares.get ? pares.get(meu) : null;
      const ehClassico = !!(meus && meus.has && meus.has(jg.advId));
      if(ehClassico && !jaFoi('classico|'+jg.chave)){
        marca('classico|'+jg.chave);
        propor(E, {cat:5, peso:'info', voz:vozJornal(),
          chave:`c5clas|${jg.chave}`, texto:'Clássico daqui a 3 dias.'});
        return;
      }
    }

    /* ---- 5.2, 5.4 e 5.5: a conta da tabela ---- */
    const cp = campanha(E);
    if(cp && cp.restam > 0){
      const meusMax = maxDe(cp.linha, cp.restam);
      const outros = cp.tab.filter(l=>l.id !== meu);
      /* 5.2 — uma vitória e é título: ninguém pode passar do que eu faço
         ganhando o próximo, e falta um jogo */
      if(cp.restam === 1 && !jaFoi('titulo')){
        const seEuGanhar = cp.linha.p + VIT;
        const teto = Math.max(...outros.map(l=>maxDe(l, restamDe(cp.comp, l.id))));
        if(seEuGanhar >= teto){
          marca('titulo');
          propor(E, {cat:5, peso:'info', voz:vozJornal(), tipo:'boa',
            chave:`c5campeaoja|${ano}`,
            texto:`Se ganhar ${diaRot(jg ? (jg.dia||6) : 6)}, o `+
                  `${clube.nome} é campeão.`});
          return;
        }
      }
      /* 5.4 — rebaixamento confirmado: nem ganhando tudo eu passo de
         quem está na última vaga de permanência */
      const CAI = 4;
      if(cp.total > CAI && !jaFoi('rebaixado')){
        const salvo = cp.tab[cp.total - CAI - 1];
        if(salvo && cp.pos >= cp.total - CAI && meusMax < salvo.p){
          marca('rebaixado');
          const a = {s:E.indicadores.satisfacao, m:E.indicadores.moral};
          E.indicadores.satisfacao = U.limitar(a.s - 3, 0, 20);
          E.indicadores.moral      = U.limitar(a.m - 2, 0, 20);
          E.recrutamento = {ate: semanaAbs(E) + 8, fator:0.45,
                            motivo:'rebaixamento'};
          propor(E, {cat:5, peso:'info', voz:vozJornal(), tipo:'ruim',
            chave:`c5cai|${ano}`,
            texto:'Rebaixamento matematicamente confirmado.',
            efeitos:[
              {ind:'satisfacao', delta:r1(E.indicadores.satisfacao - a.s),
               dono:'da torcida'},
              {ind:'moral', delta:r1(E.indicadores.moral - a.m), dono:'nossa'}]});
          return;
        }
      }
      /* 5.5 — acesso garantido: quem está fora da zona não me alcança */
      const SOBE = 4;
      if(cp.total > SOBE && !jaFoi('acesso') && cp.pos < SOBE){
        const primeiroDeFora = cp.tab[SOBE];
        if(primeiroDeFora &&
           cp.linha.p > maxDe(primeiroDeFora, restamDe(cp.comp, primeiroDeFora.id))){
          marca('acesso');
          const a = {s:E.indicadores.satisfacao, m:E.indicadores.moral};
          E.indicadores.satisfacao = U.limitar(a.s + 5, 0, 20);
          E.indicadores.moral      = U.limitar(a.m + 3, 0, 20);
          E.recrutamento = {ate: semanaAbs(E) + 4, fator:1.6, motivo:'acesso'};
          propor(E, {cat:5, peso:'info', voz:vozJornal(), tipo:'boa',
            chave:`c5acesso|${ano}`,
            texto:`O ${clube.nome} garantiu o acesso.`,
            efeitos:[
              {ind:'satisfacao', delta:r1(E.indicadores.satisfacao - a.s),
               dono:'da torcida'},
              {ind:'moral', delta:r1(E.indicadores.moral - a.m), dono:'nossa'}]});
          return;
        }
      }
    }

    /* ---- 5.8: o técnico. Quatro derrotas nos últimos cinco jogos ---- */
    if(cp && !jaFoi('tecnico')){
      const jogos = [];
      for(const r of cp.comp.rodadas)
        for(const j of r.jogos){
          if(j.gc == null) continue;
          if(j.c !== meu && j.f !== meu) continue;
          const meusGols = j.c === meu ? j.gc : j.gf;
          const deles    = j.c === meu ? j.gf : j.gc;
          jogos.push({s:r.semana, perdeu: meusGols < deles});
        }
      jogos.sort((a,b)=>a.s-b.s);
      const ult = jogos.slice(-5);
      if(ult.length === 5 && ult.filter(x=>x.perdeu).length >= 4){
        marca('tecnico');
        const a = E.indicadores.satisfacao;
        E.indicadores.satisfacao = U.limitar(a - 1, 0, 20);
        propor(E, {cat:5, peso:'info', voz:vozJornal(), tipo:'ruim',
          chave:`c5tec|${ano}`, texto:'O técnico foi demitido.',
          efeitos:[{ind:'satisfacao',
                    delta:r1(E.indicadores.satisfacao - a), dono:'da torcida'}]});
        return;
      }
    }

    /* ---- 5.7 e 5.10: o elenco. Duas datas por temporada, do hash ----
       NÃO HÁ MODELO DE ELENCO NESTE JOGO: o clube é um número de força.
       O reforço e a aposentadoria são, então, calendário — uma de cada
       por temporada, em semana e dia tirados do hash do clube com o ano,
       com o nome saindo de `mundo.nomeDeJogador`, que é estável. O que
       elas movem é real (satisfação), e é por isso que existem. */
    const diaDe = (tag, de, ate) => {
      const sem = de + (hash(`${tag}|${meu}|${ano}`) % (ate - de + 1));
      const dia = 1 + (hash(`${tag}d|${meu}|${ano}`) % 7);
      return {sem, dia};
    };
    const ref = diaDe('reforco', 2, 12);
    if(E.data.semana === ref.sem && E.data.dia === ref.dia && !jaFoi('reforco')){
      marca('reforco');
      const nome = M().nomeDeJogador(meu, ano, 1);
      const a = E.indicadores.satisfacao;
      E.indicadores.satisfacao = U.limitar(a + 3, 0, 20);
      propor(E, {cat:5, peso:'info', voz:vozJornal(), tipo:'boa',
        chave:`c5ref|${ano}`,
        texto:`O clube contratou o ${nome}. A torcida tá empolgada.`,
        efeitos:[{ind:'satisfacao',
                  delta:r1(E.indicadores.satisfacao - a), dono:'da torcida'}]});
      return;
    }
    const ido = diaDe('idolo', 30, 50);
    if(E.data.semana === ido.sem && E.data.dia === ido.dia && !jaFoi('idolo')){
      marca('idolo');
      /* o índice 0 é o ídolo da casa: o mesmo nome ano após ano até ele
         pendurar as chuteiras */
      const nome = M().nomeDeJogador(meu, Math.floor(ano/4)*4, 0);
      propor(E, {cat:5, peso:'decisao', voz:vozJornal(),
        chave:`c5idolo|${ano}`, dados:{nome},
        texto:`O ${nome} pendurou as chuteiras hoje.`,
        botoes:[{rot:'Faixa de despedida', efeito:'faixa-despedida',
                 nota:'R$ 2.000 · o nome dele no pano'},
                {rot:'Deixar quieto', efeito:'nada'}]});
    }
  }

  /* =======================================================
     PRODUTOR 8 — A POLÍCIA

     Tudo que vem de fora da lei: a ameaça, a revista, a punição e o fim
     dela. Condição dura e cota baixa — uma por semana no teto, e na
     prática bem menos, porque `policia ≤ 5` não é o estado normal de
     ninguém que não esteja aprontando.
     ======================================================= */
  const TC = () => TO.torcedores;

  function cat8(E){
    const c = ctl(E);
    const ch = `c8|${E.data.ano}|${E.data.semana}`;
    const I = E.indicadores;

    /* 8.4 — O FIM DA PUNIÇÃO vem primeiro: é o único que não pode
       esperar a semana seguinte, porque ele encerra um estado. */
    if(TC().punicaoAcabou(E)){
      E.punicao.fechado = true;
      const a = {m:I.moral, s:I.satisfacao, p:I.policia};
      I.moral      = U.limitar(a.m + 5, 0, 20);
      I.satisfacao = U.limitar(a.s + 2, 0, 20);
      /* CUMPRIU A PENA, LIMPOU A FICHA. Sem isto a punição vira laço:
         ela acaba, a polícia continua no chão, e a semana seguinte
         proíbe de novo pra sempre — medido, e o feed repetiu "proibida
         por 4 semanas" dois dias depois de "acabou a proibição". Quatro
         semanas fora do estádio é o preço; pago o preço, o delegado
         devolve a torcida ao piso de quem não deve nada. */
      const PISO = 6;
      if(I.policia < PISO) I.policia = PISO;
      propor(E, {cat:8, peso:'info', urgente:true, voz:vozRua(), tipo:'boa',
        chave:ch+'|volta',
        texto:'Acabou a proibição. Domingo a gente volta pro estádio.',
        efeitos:[
          {ind:'moral', delta:r1(I.moral - a.m), dono:'nossa'},
          {ind:'satisfacao', delta:r1(I.satisfacao - a.s), dono:'da torcida'},
          {ind:'policia', delta:r1(I.policia - a.p), dono:'nossa'}]});
      return;
    }
    /* enquanto a punição corre, a polícia não tem mais nada a dizer */
    if(TC().punida(E)) return;

    /* 8.2 — A PUNIÇÃO. Dois caminhos chegam aqui: a polícia zerada, e o
       gatilho que o "Foda-se" armou e a briga seguinte disparou. */
    if(E.punicaoPendente){
      E.punicaoPendente = false;
      TC().punir(E, 'estádio');
      propor(E, {cat:8, peso:'info', urgente:true, voz:vozRua(), tipo:'ruim',
        chave:ch+'|proibida',
        texto:`Torcida proibida de entrar no estádio por `+
              `${TC().PUNICAO_SEMANAS} semanas.`,
        linhaAbaixo:{texto:'Ver Torcida', acao:'painel', pagina:'torcida'}});
      return;
    }
    if(I.policia <= 0){
      E.punicaoPendente = true;
      return;                       // sai na próxima passada, já punida
    }

    /* 8.3 — A REVISTA. Só com bomba na sede pra levar, e com uma
       carência de seis semanas por cima da cota: a PM não bate na
       porta todo mês. A chance é do hash da semana, não de `U.rng()`. */
    const ultRevista = c.assunto['revista'];
    const podeRevista = I.policia < 8 && ((E.estoque||{}).bombas > 0) &&
      (ultRevista == null || semanaAbs(E) - ultRevista >= 6);
    if(podeRevista && dado(E, ch+'|revista') < 0.22){
      const tinha = E.estoque.bombas;
      E.estoque.bombas = 0;
      propor(E, {cat:8, peso:'info', voz:vozRua(), tipo:'ruim',
        assunto:'revista', frequencia:'mensal', chave:ch+'|revista',
        texto:'A PM revistou a sede ontem. Levaram todas as bombas.',
        efeitos:[{ind:'bombas', delta:-tinha, dono:'do estoque'}]});
      return;
    }

    /* 8.1 — O RECADO DO DELEGADO. Decisão, e a mais séria da categoria:
       uma saída amarra a ideologia por três semanas, a outra troca o
       aviso por uma punição imediata na próxima briga. */
    if(I.policia <= 5 && !E.gatilhoPunicao){
      propor(E, {cat:8, peso:'decisao', voz:vozRua(), tipo:'ruim',
        assunto:'delegado', frequencia:'mensal', chave:ch+'|delegado',
        texto:'Delegado mandou recado: mais uma dessas e a torcida tá '+
              'proibida de entrar no estádio.',
        botoes:[{rot:'Segurar a rapaziada', efeito:'segurar',
                 nota:'três semanas sem atacar · a polícia afrouxa'},
                {rot:'Foda-se', efeito:'foda-se',
                 nota:'a próxima briga já vale a punição'}]});
    }
  }

  /* =======================================================
     PRODUTOR 9 — EFEMÉRIDE

     Data marcada e memória. Uma por semana no teto, e elas se espalham
     sozinhas porque são calendário: duas por ano têm data fixa, três
     dependem de o jogador ter feito alguma coisa.
     ======================================================= */
  /* o dia absoluto de uma data deste ano do jogo */
  function absDoAno(E, semana, dia){
    const hojeNoAno = (E.data.semana - 1)*7 + (E.data.dia - 1);
    return (E.data.absoluto || 0) - hojeNoAno + (semana - 1)*7 + (dia - 1);
  }
  /* a semana e o dia do aniversário de uma torcida neste ano */
  function diaDaFundacao(E, o){
    if(o && o.fundacaoDia && o.fundacaoMes){
      const d = TO.estado.semanaDiaDe(
        new Date(E.data.ano, o.fundacaoMes - 1, o.fundacaoDia));
      if(d) return {semana:d.semana, dia:d.dia};
      return {semana:1, dia:1};
    }
    const h = hash('fest|' + ((o&&o.id) || 'x')) % 364;
    return {semana: Math.floor(h/7) + 1, dia: (h%7) + 1};
  }

  const AVISO_FESTA = 10;     // dias de antecedência da 9.1

  function cat9(E){
    const c = ctl(E);
    const ch = `c9|${E.data.ano}|${E.data.semana}`;
    const hoje = E.data.absoluto || 0;
    const nossa = M().torcida(E.torcida.id) || E.torcida;

    /* 9.1 — O ANIVERSÁRIO DA TORCIDA, dez dias antes */
    if(nossa && nossa.fundacao){
      const f = diaDaFundacao(E, nossa);
      const quando = absDoAno(E, f.semana, f.dia);
      if(hoje === quando - AVISO_FESTA){
        const anos = E.data.ano - nossa.fundacao;
        const dt = TO.estado.dataDaSemana
          ? TO.estado.dataDaSemana(E.data.ano, f.semana, f.dia) : null;
        const rot = dt ? `${String(dt.getDate()).padStart(2,'0')}/`+
                         `${String(dt.getMonth()+1).padStart(2,'0')}` : 'logo';
        propor(E, {cat:9, peso:'decisao', voz:diretor(E, ch+'|aniv'),
          assunto:'aniversario', frequencia:'anual',
          chave:`c9aniv|${E.data.ano}`,
          texto:`Dia ${rot} a ${E.torcida.sigla} faz ${anos} anos.`,
          dados:{anos},
          botoes:[{rot:'Festa grande', efeito:'festa-torcida',
                   nota:'R$ 30.000 · a rifa e o bar devolvem parte'},
                  {rot:'Festa simples', efeito:'festa-simples',
                   nota:'R$ 5.000 · churrasco na sede'},
                  {rot:'Passar batido', efeito:'sem-festa',
                   nota:'a moral cobra'}]});
        return;
      }
    }

    /* 9.3 — O ANIVERSÁRIO DO CLUBE. `dados/times.js` traz só o ANO de
       fundação; o dia sai do hash do id, fixo pro clube e igual em toda
       partida. Dia e mês de verdade dos 108 clubes é trabalho de
       importador, não de código — fica anotado. */
    const clube = M().time(E.torcida.clubeId);
    if(clube && clube.fundacao){
      const f = diaDaFundacao(E, {id:'clube|'+clube.id,
        fundacaoDia:clube.fundacaoDia, fundacaoMes:clube.fundacaoMes});
      if(f.semana === E.data.semana && E.data.dia === Math.max(1, f.dia - 1) &&
         c.assunto['aniv-clube'] !== semanaAbs(E)){
        const anos = E.data.ano - clube.fundacao;
        propor(E, {cat:9, peso:'decisao', voz:diretor(E, ch+'|clube'),
          assunto:'aniv-clube', frequencia:'anual',
          chave:`c9clube|${E.data.ano}`,
          texto:`O ${clube.nome} faz ${anos} anos essa semana.`,
          botoes:[{rot:'Fazer mosaico', efeito:'mosaico',
                   nota:'R$ 12.000 · a arquibancada inteira'},
                  {rot:'Só a faixa de sempre', efeito:'nada'}]});
        return;
      }
    }

    /* 9.4 e 9.5 — A CASA NOVA. Quem avisa é o patrimônio, que carimba
       `E.inauguracao` quando a compra acontece; aqui só se conta. */
    const inau = E.inauguracao;
    if(inau && !inau.contada){
      inau.contada = true;
      const a = {m:E.indicadores.moral, p:E.indicadores.prestigio};
      if(inau.tipo === 'sede'){
        E.indicadores.moral     = U.limitar(a.m + 4, 0, 20);
        E.indicadores.prestigio = U.limitar(a.p + 1, 0, 20);
        propor(E, {cat:9, peso:'info', urgente:true, voz:vozRua(), tipo:'boa',
          chave:`c9sede|${hoje}`, texto:'Inauguração da sede nova.',
          efeitos:[
            {ind:'moral', delta:r1(E.indicadores.moral - a.m), dono:'nossa'},
            {ind:'prestigio', delta:r1(E.indicadores.prestigio - a.p),
             dono:'nosso'}]});
      }else{
        E.indicadores.moral = U.limitar(a.m + 3, 0, 20);
        propor(E, {cat:9, peso:'info', urgente:true, voz:vozRua(), tipo:'boa',
          chave:`c9sub|${hoje}`,
          texto:`Batismo da subsede nova no ${inau.bairro || 'bairro'}.`,
          efeitos:[{ind:'moral', delta:r1(E.indicadores.moral - a.m),
                    dono:'nossa'}]});
      }
      return;
    }

    /* 9.2 — O ANIVERSÁRIO DE UMA TRETA. Só as que valeram muito
       prestígio entram: o log guarda tudo, a memória é seletiva. */
    const marco = confrontoDeAnos(E);
    if(marco){
      const a = E.indicadores.moral;
      E.indicadores.moral = U.limitar(a + (marco.ganhamos ? 1 : -1), 0, 20);
      propor(E, {cat:9, peso:'info', voz:vozRua(),
        assunto:'memoria', frequencia:'anual',
        chave:`c9mem|${marco.id}|${E.data.ano}`,
        tipo: marco.ganhamos ? 'boa' : 'ruim',
        /* "no bairro X" e não "no X": o gênero do nome do bairro não
           está nos dados, e adivinhar dá "no Aldeota" (§8.22) */
        texto:`Faz ${marco.anos} ${marco.anos===1?'ano':'anos'} daquela `+
              `treta no bairro ${marco.bairro} contra a ${marco.rival}.`,
        efeitos:[{ind:'moral', delta:r1(E.indicadores.moral - a), dono:'nossa'}]});
    }
  }

  /* PESO DE MEMÓRIA: o confronto que rendeu ou custou muito prestígio.
     Dois pontos de prestígio é a metade de uma investida bem-sucedida —
     abaixo disso a briga não vira história. */
  const PRESTIGIO_DE_MEMORIA = 2;
  function confrontoDeAnos(E){
    const hoje = E.data.absoluto || 0;
    for(const r of (E.confrontos||[])){
      if(!r.data || !r.nossos) continue;
      const anos = E.data.ano - r.data.ano;
      if(anos < 1) continue;
      if(Math.abs(r.prestigioNosso || 0) < PRESTIGIO_DE_MEMORIA) continue;
      if(absDoAno(E, r.data.semana, r.data.dia) !== hoje) continue;
      return {id:r.id, anos, bairro:r.local && r.local.bairro || 'bairro',
              rival:r.rival, ganhamos:!!r.ganhamos};
    }
    return null;
  }

  /* =======================================================
     O DIA E A SEMANA
     ======================================================= */
  function passarDia(E){
    if(!E) return [];
    ctl(E);
    cat3(E); cat8(E); cat2(E); cat1(E); cat6(E); cat9(E); cat7(E);
    cat5Clube(E); cat4(E);
    return publicar(E);
  }
  function fecharSemana(E, rel){
    if(!E) return;
    ctl(E);
    cat5(E, rel);
    fechoDaSemana(E, rel);
  }

  /* =======================================================
     O FECHAMENTO DA SEMANA — DUAS MENSAGENS, NUNCA AS DUAS

     O fecho abria um modal por cima do feed. Não era engano: a regra
     era `relatorio || grave`, e `grave` — semana no vermelho, caixa
     negativo ou gente saindo — abria de qualquer jeito. O que estava
     errado era o FORMATO. Na arquitetura do feed, o que chega ao
     jogador é mensagem; tela por cima é escolha dele.

     São duas, com pesos diferentes, e uma exclui a outra:

     · O RESUMO (`acao`) sai no fecho do MÊS, com o VALOR no texto.
       O comentário que antes suprimia o resumo dizia que uma linha
       genérica por semana é barulho de fundo, e ele estava certo — o
       conserto é escrever o número, não calar. É esta mensagem que dá
       ao jogador um caminho até o detalhamento quando a chave do
       relatório está desligada, que é o padrão.
     · O ALARME (`decisao`) para o tempo. Semana grave é parada
       obrigatória: é quando a torcida começa a se desfazer, e descobrir
       isso trinta dias depois não é conforto, é perda.

     Nunca as duas na mesma semana: dizer "fechou em −R$ 800" e logo
     abaixo "chefe, o caixa fechou no vermelho" é a mesma notícia duas
     vezes.
     ======================================================= */
  function fechoDaSemana(E, rel){
    const saiu = (rel.saidas || []).length;
    /* O ALARME É DO CAIXA, NÃO DO RESULTADO DA SEMANA. Ele testava
       `rel.saldo < 0 || E.dinheiro < 0`, e a primeira metade morreu com
       a mensalidade mensal: em três semanas de cada quatro só há
       despesa, então a semana fecha negativa por projeto. Medido antes
       do conserto: 50 alarmes numa temporada de 52 semanas, e resumo
       mensal nenhum — o alarme comia o mês inteiro. Quem manda no
       alarme é a mesma condição que manda na debandada, o caixa
       negativo, e ela não mudou. */
    const vermelho = E.dinheiro < 0;
    const ch = `fecho|${E.data.ano}|${E.data.semana}`;
    if(vermelho || saiu){
      /* O TEXTO SEGUE A CAUSA. O aprovado fala do caixa, e é o certo
         quando o caixa é o problema — mas `grave` também é verdade com
         o caixa positivo e gente indo embora, e aí dizer "fechou no
         vermelho" seria mentira na cara do jogador. */
      /* CLASSE `evento`, E SEM `assunto` — as duas coisas, de propósito.
         A carência por classe (§8.29) vale pra assunto de dia: "não
         repita a mesma conversa tão cedo". O alarme não é conversa, é a
         rede de segurança da debandada: ele tem de falar TODA vez que a
         condição existir, e atrasá-lo é avisar depois que o pessoal já
         saiu. Sem `assunto` a carência nem chega a ser consultada; a
         classe fica escrita mesmo assim, porque mensagem sem classe
         declarada é mensagem que ninguém sabe de que frequência é. */
      propor(E, {cat:6, peso:'decisao', urgente:true, frequencia:'evento',
        voz:diretor(E, ch), chave:ch+'|alarme', tipo:'ruim',
        texto: vermelho
          ? `Chefe, o caixa fechou no vermelho. Segunda semana assim e o `+
            `pessoal começa a sair.`
          : `Chefe, ${saiu === 1 ? 'saiu um' : `saíram ${saiu}`} essa semana. `+
            `Do jeito que tá, semana que vem sai mais.`,
        botoes:[{rot:'Ver Financeiro', efeito:'painel', pagina:'financeiro'},
                {rot:'Deixar como está', efeito:'nada',
                 nota:'a moral cai toda semana enquanto durar'}]});
      return 'alarme';
    }
    /* O RESUMO É MENSAL, e só sai no fecho do mês. Com a mensalidade
       caindo numa semana em quatro (§8.25), a linha semanal mostraria
       vermelho três vezes em quatro e treinaria o jogador a ignorá-la. O
       mês é o ciclo em que a receita de verdade entra. */
    const mes = rel.mes;
    if(!mes) return 'nada';
    const sinal = mes.saldo > 0 ? '+' : mes.saldo < 0 ? '−' : '';
    propor(E, {cat:4, peso:'acao', voz:diretor(E, ch), chave:ch,
      texto:`O mês fechou em ${sinal}${U.dinheiro(Math.abs(mes.saldo))}.`,
      efeitos:[{ind:'dinheiro', delta:Math.round(mes.saldo), dono:'do mês'}],
      botoes:[{rot:'Ver Financeiro', efeito:'painel', pagina:'financeiro'}]});
    return 'resumo';
  }

  /* quem ganhou o último confronto com cada rival — é o que faz as
     ameaças 4 e 5 saberem do que estão falando */
  /* =======================================================
     O HISTÓRICO DE CONFRONTOS

     `registrarConfronto` guardava três coisas — quem, se ganhamos e
     onde — e servia a uma coisa só: as ameaças 4 e 5 saberem do que
     estavam falando. Agora ele é o LOG, e serve a três clientes: as
     ameaças, as duas abas de Notícias e a efeméride 9.2, que precisava
     de duas coisas que não existiam — a DATA e quanto prestígio aquilo
     valeu.

     ELE NÃO RECALCULA NADA. Guarda o que foi APLICADO, que é a mesma
     regra da linha de consequência do feed: os números vêm do fecho da
     cena (os nossos) e de `tensao.hostil` (os do mundo).

     AS BAIXAS NÃO SÃO A MESMA COISA DOS DOIS LADOS, e isso é dito e não
     escondido. Na nossa briga há cena, e a cena sabe quem caiu e quem
     foi preso, ficha por ficha. A briga entre duas torcidas da IA é
     abstrata: o que ela produz de baixa é gente que saiu da torcida.
     Inventar "feridos" pra ela seria número que não move nada, que é
     justamente o que §8.20 proibiu.

     O TETO. São seis episódios por semana no mundo — umas 300 brigas por
     temporada —, e num save de dez temporadas isso passa de três mil
     registros dentro do `localStorage`. Então o log do MUNDO tem teto e
     descarta o mais antigo. O NOSSO não: são poucos por temporada e são
     a memória da partida.
     ======================================================= */
  const TETO_CONFRONTOS_DELAS = 400;     // ~15 meses de mundo

  /* O DIA 8 NÃO EXISTE, e o log guardava. A briga entre duas torcidas
     da IA acontece no FECHO da semana, e o fecho roda com `data.dia`
     momentaneamente em 8 — é o contador que ainda não virou. Sem este
     `min`, um em cada seis registros do mundo nascia com uma data que o
     calendário não sabe converter. */
  const dataDeAgora = E => ({ano:E.data.ano, semana:E.data.semana,
                             dia:Math.min(7, E.data.dia),
                             absoluto:E.data.absoluto||0});

  /* devolve o delta de um indicador dentro da lista de efeitos aplicados */
  const deEfeito = (efeitos, ind, casa) => {
    const e = (efeitos||[]).find(x=>x.ind === ind &&
      (casa === undefined || (x.dono||'').includes(casa)));
    return e ? e.delta : 0;
  };

  function registrarConfronto(E, a, b, c){
    if(!E) return null;
    /* forma antiga — `(E, torcidaId, ganhamos, bairro)` — continua
       valendo: ela é o que as ameaças precisam, e três chamadores ainda
       usam. A forma nova passa um objeto. */
    const r = (a && typeof a === 'object') ? a
            : {torcidaId:a, ganhamos:b, local:{bairro:c||''}};
    if(!r.torcidaId) return null;

    E.ultimoConfronto = E.ultimoConfronto || {};
    E.ultimoConfronto[r.torcidaId] = {ganhamos:!!r.ganhamos,
      bairro:(r.local && r.local.bairro) || '', quando:E.data.absoluto||0};

    const nome = id => (M().torcida(id)||{}).nome || id;
    const reg = {
      id: (E.proxConfronto = (E.proxConfronto||0) + 1),
      nossos: true,
      data: dataDeAgora(E),
      ganhamos: !!r.ganhamos,
      rival: nome(r.torcidaId), rivalId: r.torcidaId,
      local: {cena:(r.local&&r.local.cena)||'', bairro:(r.local&&r.local.bairro)||''},
      a: r.a || null, b: r.b || null,
      efeitos: (r.efeitos||[]).filter(x=>x && x.delta),
      prestigioNosso: r.prestigioNosso != null ? r.prestigioNosso
                    : deEfeito(r.efeitos, 'prestigio', 'nosso')
    };
    (E.confrontos = E.confrontos || []).push(reg);
    return reg;
  }

  /* o mesmo log, do lado do mundo: quem brigou com quem, longe da gente */
  /* O REGISTRO DO MUNDO É ENXUTO, e o motivo é aritmética: são umas
     cem brigas por temporada, e cada byte a mais vira dez mil no save de
     dez anos. Então nada de nome repetido (o id resolve na hora de
     desenhar), nada de campo que se deduz da lista em que o registro
     está, e o `dono` de cada efeito é `a` ou `b` em vez do nome inteiro
     escrito duas vezes. */
  const efeitoEnxuto = (efeitos, venc, perd) => (efeitos||[])
    .filter(x=>x && x.delta)
    .map(x=>({ind:x.ind, delta:Math.round(x.delta*10)/10,
              dono: /entre ambos/.test(x.dono||'') ? '' :
                    (x.dono||'').includes(venc) ? 'a' :
                    (x.dono||'').includes(perd) ? 'b' : ''}))
    .filter(x=>x.delta);

  function registrarConfrontoDelas(E, r){
    if(!E || !r) return null;
    const nome = id => (M().torcida(id)||{}).nome || id;
    const nv = nome(r.vencedor), np = nome(r.perdedor);
    const reg = {
      id: (E.proxConfronto = (E.proxConfronto||0) + 1),
      data: dataDeAgora(E),
      a: {torcidaId:r.vencedor, baixas:0},
      b: {torcidaId:r.perdedor, baixas:r.foram||0},
      bairro: r.bairro || '',
      efeitos: efeitoEnxuto(r.efeitos, nv, np)
    };
    const l = (E.confrontosDelas = E.confrontosDelas || []);
    l.push(reg);
    /* o teto: o mais antigo sai, e o corte é anotado pra a tela poder
       dizer quantos já não estão lá */
    if(l.length > TETO_CONFRONTOS_DELAS){
      E.confrontosCortados = (E.confrontosCortados||0) +
                             (l.length - TETO_CONFRONTOS_DELAS);
      l.splice(0, l.length - TETO_CONFRONTOS_DELAS);
    }
    return reg;
  }

  /* =======================================================
     ABERTURA
     Partida nova não abre na Gestão: abre no feed, e é a
     segunda mensagem que chama a Gestão.
     ======================================================= */
  function abrir(E){
    E.feed = []; E.feedFila = []; E.feedCtl = null;
    ctl(E);
    propor(E, {cat:5, peso:'info', voz:vozJornal(), chave:'inicio|1',
      texto:`Jogo iniciado. ${E.torcida.nome} — ${E.torcida.cidade}, `+
            `${E.membros.length} membros.`});
    propor(E, {cat:6, peso:'decisao', voz:diretor(E,'inicio'), chave:'inicio|2',
      assunto:'ideologia', frequencia:'evento',
      texto:`Chefe, antes de tudo: define a nossa ideologia. O que a gente `+
            `faz com o adversário, como recebe aliado e o que faz com os `+
            `outros jogos da praça.`,
      /* SÓ A IDEOLOGIA, e não a Gestão inteira: o botão abria a
         tabela de folga e o plano da semana, e a ideologia — que é
         o que ele promete — ficava no rodapé de tudo (§8.29). */
      botoes:[{rot:'Definir ideologia', efeito:'ideologia-tela'}]});
    /* A ROTINA ENTRA NA ABERTURA, junto da ideologia. Ela existe desde
       sempre — uma ação padrão por dia da semana, que roda sozinha sem
       furar o orçamento —, e o jogador descobria por acaso, abrindo o
       Calendário. Duas decisões seguidas param o tempo até serem
       respondidas, e só então o feed começa a correr. */
    /* `urgente` aqui não é alarme: é o que fura o teto de UMA interna
       por semana. Sem ele a segunda decisão da abertura ficava na fila
       até a semana seguinte, e o jogador começava a partida sem nunca
       ter visto a rotina — que é justamente o que este item conserta. */
    propor(E, {cat:6, peso:'decisao', urgente:true, seguido:true,
      voz:diretor(E,'inicio'), chave:'inicio|3', assunto:'rotina',
      frequencia:'evento',
      texto:`E define a rotina da semana: uma ação padrão por dia, que a `+
            `rapaziada toca sozinha. Dia de jogo e dia de estrada ficam de `+
            `fora.`,
      botoes:[{rot:'Abrir rotina', efeito:'rotina'}]});
    return publicar(E);
  }

  /* =======================================================
     LEITURA — o que a tela e os testes perguntam
     ======================================================= */
  const historico = E => (E && E.feed) ? E.feed.slice().reverse() : [];
  function resumo(E){
    const c = ctl(E);
    return {publicadas:c.contas.publicadas, descartadas:c.contas.descartadas,
            porCat:Object.assign({}, c.contas.porCat),
            naSemana:c.semana.n, naFila:fila(E).length,
            travado:travado(E)};
  }
  /* a mensagem de `acao` cujo prazo passou continua na tela dizendo que
     passou: botão que some sem explicação vira a suspeita de que o jogo
     comeu a jogada */
  function expirada(E, m){
    return m.peso === 'acao' && !m.respondido && m.validoAte != null &&
           (E.data.absoluto||0) > m.validoAte;
  }

  return {CATEGORIAS, catDe, TETO_SEMANA, COTA_INTERNA_SEMANA, EFEITO,
          lerEfeito, lerEfeitos,
          COTA_DIPLOMACIA_MES, CARENCIA_AMEACA, AMEACAS, ASSUNTOS,
          FREQUENCIA, CLASSE_PADRAO, carenciaDe, naCarencia,
          propor, publicar, responder, travado, decisaoAberta, semanaDaFundacao,
          passarDia, fecharSemana, fechoDaSemana, irProEstadio,
          registrarConfronto, registrarConfrontoDelas, TETO_CONFRONTOS_DELAS,
          abrir, historico, resumo, expirada, contexto, perguntaAntes,
          rivais, motivoDaAmeaca, clubesNaPracaEmDias, JANELA_AMEACA,
          feed, fila, ctl};
})();
