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

  /* as sete categorias do enunciado, na ordem em que ele as escreve */
  const CATEGORIAS = [
    {n:1, id:'olheiro',    rot:'Olheiro'},
    {n:2, id:'diajogo',    rot:'Dia de jogo'},
    {n:3, id:'convocacao', rot:'Convocação'},
    {n:4, id:'resultado',  rot:'Resultado'},
    {n:5, id:'mundo',      rot:'Mundo e jornal'},
    {n:6, id:'interna',    rot:'Interna'},
    {n:7, id:'diplomacia', rot:'Diplomacia'}
  ];
  const catDe = n => CATEGORIAS.find(c=>c.n===n) || CATEGORIAS[4];

  /* TETO, NÃO META. Semana comum fecha em 3 a 6; isto é o freio de
     emergência pra semana em que tudo acontece junto. */
  const TETO_SEMANA = 15;
  /* a única categoria que pode sair duas vezes seguidas */
  const CAT_LIVRE = 5;
  /* quem responde primeiro quando duas decisões caem no mesmo instante */
  const ORDEM_DECISAO = {3:0, 2:1, 6:2, 7:3};
  /* quem sai primeiro entre as que não param o tempo: o que acabou de
     acontecer, depois o que o olheiro viu, depois a casa, a diplomacia,
     e o mundo lá fora por último — ele é o pulso, não a manchete */
  const ORDEM_INFO = {4:0, 3:1, 2:2, 1:3, 6:4, 7:5, 5:6};
  /* quanto tempo uma mensagem espera na fila antes de ser descartada,
     e quanto tempo o botão de uma `acao` continua valendo */
  const VALIDADE = {info:2, acao:6, decisao:21};
  /* cotas das duas categorias que precisam de freio (item 7) */
  const COTA_INTERNA_SEMANA = 1;
  const COTA_DIPLOMACIA_MES = 4;
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
    c.semana  = c.semana  || {n:0, chave:0, c6:0, c5:0};
    c.mes     = c.mes     || {chave:-1, c7:0};
    c.assunto = c.assunto || {};     // assunto da categoria 6 → semana absoluta
    c.ameacas = c.ameacas || {};     // rival|nº da ameaça → dia absoluto
    c.contas  = c.contas  || {publicadas:0, descartadas:0, porCat:{}};
    if(c.semana.chave !== semanaAbs(E)){
      c.semana = {n:0, chave:semanaAbs(E), c6:0, c5:0};
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
      const ult = m.assunto ? c.assunto[m.assunto] : null;
      if(ult != null && semanaAbs(E) - ult < 2) return false;
    }
    if(m.cat === 7 && c.mes.c7 >= COTA_DIPLOMACIA_MES) return false;
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

  /* quem são as nossas rivais, pra provocação: as declaradas do grafo e
     as que vêm jogar aqui */
  function rivais(E){
    const nossa = M().torcida(E.torcida.id) || E.torcida;
    const ids = new Set([...(nossa.maioresRivais||[]), ...(nossa.rivais||[])]);
    const fora = [];
    for(const id of ids){
      const o = M().torcida(id);
      if(!o || o.incompleta) continue;
      fora.push(o);
    }
    for(const v of visitantesDaSemana(E))
      if(PL().ehRival(E, v.torcida) && !ids.has(v.torcida.id)) fora.push(v.torcida);
    return fora;
  }

  /* o jogo do nosso clube nesta semana, com o dia */
  const nossoJogo = E => E.proximoJogo || null;

  /* =======================================================
     PRODUTOR 1 — O OLHEIRO
     Só existe quando há jogo nosso ou de rival na praça. Uma
     por semana de jogo, dois dias antes.
     ======================================================= */
  function cat1(E){
    const jogos = TO.praca.jogosDaPraca(E);
    if(!jogos.length) return;
    const primeiro = jogos.reduce((a,b)=>a.dia<=b.dia?a:b);
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

  function cat2(E){
    const j = nossoJogo(E);
    const outros = PL().outrosJogosNaCidade(E, E.data.semana);
    if(!j && !outros.length) return;
    const diaJ = j ? (j.dia||6) : outros[0].dia || 6;
    if(E.data.dia !== Math.max(1, diaJ - 3)) return;
    const p = PL().plano(E);
    if(p.decidido) return;
    const ch = `c2|${E.data.ano}|${E.data.semana}`;

    /* MODO AUTOMÁTICO. Com a pergunta desligada a ideologia fecha o
       plano sozinha e o feed conta o que foi decidido — automático que
       não conta o que fez é automático que esconde. */
    if(!perguntaAntes(E)){
      const fez = PL().aplicarPolitica(E);
      const falta = PL().falta(E);
      if(!falta.length){
        PL().confirmar(E);
        propor(E, {cat:2, peso:'info', voz:diretor(E, ch), chave:ch,
                   texto: resumoDoPlano(E, fez) + '.'});
        return;
      }
      /* automático que falha em silêncio é pior que manual */
    }

    /* o grande rival na cidade tem chamada própria: é o clima, não o
       calendário, que faz essa pergunta */
    const quente = visitantesDaSemana(E)
      .filter(v=>PL().ehRival(E, v.torcida))
      .sort((a,b)=>b.tensao-a.tensao)[0];

    let texto, botoes = null;
    if(quente && quente.tensao >= PL().TENSAO_QUENTE){
      texto = `Nosso grande rival, a ${quente.torcida.nome}, está na cidade `+
              `essa semana. Bora dar um trato neles?`;
    } else if(j && !j.casa){
      texto = `${E.torcida.clube} joga fora ${diaRot(j.dia)}, contra o `+
              `${j.mandante.nome}. Quantos vão na caravana, e por qual estrada?`;
      /* A PERGUNTA TEM TELA. Ela chutava o jogador pra dentro da Gestão
         inteira, com onze cartões, pra ele achar sozinho o da caravana.
         A pergunta é específica e a resposta tem três campos: quantos
         vão, por onde e com quantas bombas. Nada disso é regra nova —
         os três números já são do `planejamento`; o que faltava era a
         tela que os põe juntos na hora em que a pergunta é feita. */
      botoes = [{rot:'Montar a caravana', efeito:'caravana',
                 nota:'quantos vão, por qual estrada e quantas bombas'},
                {rot:'Seguir ideologia', efeito:'ideologia',
                 nota:'a ideologia fecha o plano da semana'}];
    } else {
      const lista = TO.praca.jogosDaPraca(E)
        .map(x=>`${x.casa.nome} × ${x.vis.nome}`);
      texto = `Vai ter ${lista.slice(0,2).join(' e ')} ${diaRot(diaJ)}. `+
              `Quer fazer alguma coisa?`;
    }

    propor(E, {cat:2, peso:'decisao', voz:diretor(E, ch), chave:ch, texto,
      botoes: botoes || [{rot:'Seguir ideologia', efeito:'ideologia',
               nota:'a ideologia fecha o plano da semana'},
              {rot:'Atacar alguém', efeito:'gestao',
               nota:'escolher alvo, onde, efetivo e bomba'}]});
  }

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
    const bairro = (M().bairroDaSede(E.torcida)||{}).nome || 'praça';
    propor(E, {cat:3, peso:'decisao', voz:vozRua(),
      chave:`c3jogo|${E.data.absoluto}`,
      texto: alvo
        ? `${cartaz.slice(0,-1)}, e o plano é cima da ${alvo} no ${bairro}.`
        : `${cartaz} A bateria sai da sede.`,
      dados:{tipo:'ida'},
      /* UM BOTÃO SÓ. "Ficar em casa" saiu: o time joga, a torcida vai.
         Não era escolha de verdade — era a opção que o jogador apertava
         pra não abrir a cena, e o custo dela em moral nunca foi sentido
         porque a moral já cai por outros seis caminhos. */
      botoes:[{rot: alvo ? 'Ir pra treta' : 'Ir pro estádio', efeito:'ida'}]});
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
    const r = TO.praca.resolverIda(E);
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

    /* b) o que as outras aprontaram, com o nosso mapa na frente */
    const noticias = (E.ultimasNoticias||[]).map((n,i)=>{
      const t = (n.torcidas||[]).map(id=>M().torcida(id)).filter(Boolean);
      return {n, i, local: t.some(x=>x.mapa === E.torcida.mapa)};
    }).sort((a,b)=>(b.local?1:0)-(a.local?1:0));
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

    {id:'assalto', peso:'decisao',
     quando: E => E.dinheiro < 8000 &&
                  (TO.acoes.porId('assalto').disponivel(E)||{}).ok,
     monta: (E, v) => ({
       texto:`Mestre, deixa nós meter o assalto na joalheria, tamo `+
             `precisando de caixa.`,
       botoes:[{rot:'Pode ir', efeito:'assalto', nota:'gasta uma ação da semana'},
               {rot:'Deixa isso', efeito:'nada'}]})},

    {id:'sede', peso:'acao',
     quando: E => E.membros.length >= TO.membros.capacidade(E)*0.9,
     monta: (E, v) => ({
       texto:`A sede não comporta mais gente. Tá na hora de subir de nível.`,
       botoes:[{rot:'Abrir Patrimônio', efeito:'painel', pagina:'financeiro'}]})},

    {id:'material', peso:'acao',
     quando: E => TO.torcedores.material(E) < 0.6,
     monta: (E, v) => ({
       texto:`Bora comprar material, a arquibancada tá muda.`,
       botoes:[{rot:'Abrir Patrimônio', efeito:'painel', pagina:'financeiro'}]})},

    {id:'promocao', peso:'acao',
     quando: E => E.membros.filter(m=>TO.membros.podePromover(E,m).ok).length >= 5,
     monta: (E, v) => {
       const n = E.membros.filter(m=>TO.membros.podePromover(E,m).ok).length;
       return {texto:`Tem ${n} moleque pronto pra promoção.`,
         botoes:[{rot:'Abrir Torcida', efeito:'painel', pagina:'torcida'}]};}},

    {id:'elenco', peso:'acao',
     quando: E => E.dinheiro >= 300000,
     monta: (E, v) => ({
       texto:`Tamo com ${U.dinheiro(E.dinheiro)} parado. Dá pra reforçar o `+
             `elenco do ${E.torcida.clube}.`,
       botoes:[{rot:'Abrir Patrimônio › Elenco', efeito:'painel',
                pagina:'financeiro'}]})},

    {id:'moral', peso:'info',
     quando: E => E.indicadores.moral <= 7,
     monta: (E, v) => ({tipo:'ruim',
       texto:`O pessoal tá desanimado. Ninguém quer sair de casa esse fim `+
             `de semana.`})}
  ];

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
      const ult = c.assunto[a.id];
      if(ult != null && semanaAbs(E) - ult < 2) continue;
      const voz = diretor(E, ch+'|'+a.id);
      const m = a.monta(E, voz);
      propor(E, Object.assign({cat:6, peso:a.peso, voz, assunto:a.id,
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
      botoes:[{rot:'Vem, verme', efeito:'tensao', quanto:1,
               nota:'+1 de tensão com eles'},
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
     O DIA E A SEMANA
     ======================================================= */
  function passarDia(E){
    if(!E) return [];
    ctl(E);
    cat3(E); cat2(E); cat1(E); cat6(E); cat7(E); cat4(E);
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

     · O RESUMO (`acao`) sai toda semana normal, com o VALOR no texto.
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
    const vermelho = rel.saldo < 0 || E.dinheiro < 0;
    const ch = `fecho|${E.data.ano}|${E.data.semana}`;
    if(vermelho || saiu){
      /* O TEXTO SEGUE A CAUSA. O aprovado fala do caixa, e é o certo
         quando o caixa é o problema — mas `grave` também é verdade com
         o caixa positivo e gente indo embora, e aí dizer "fechou no
         vermelho" seria mentira na cara do jogador. */
      /* SEM `assunto`, DE PROPÓSITO. A carência de duas semanas do
         escalonador vale pra assunto de dia — "não repita a mesma
         conversa na semana seguinte". O alarme não é conversa: é a
         parada obrigatória da semana grave, e com carência a semana
         seguinte no vermelho ficaria SEM mensagem nenhuma, porque o
         resumo também não sai quando a semana é grave. */
      propor(E, {cat:6, peso:'decisao', urgente:true,
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
    const sinal = rel.saldo > 0 ? '+' : rel.saldo < 0 ? '−' : '';
    propor(E, {cat:4, peso:'acao', voz:diretor(E, ch), chave:ch,
      texto:`A semana fechou em ${sinal}${U.dinheiro(Math.abs(rel.saldo))}.`,
      efeitos:[{ind:'dinheiro', delta:Math.round(rel.saldo), dono:'da semana'}],
      botoes:[{rot:'Ver Financeiro', efeito:'painel', pagina:'financeiro'}]});
    return 'resumo';
  }

  /* quem ganhou o último confronto com cada rival — é o que faz as
     ameaças 4 e 5 saberem do que estão falando */
  function registrarConfronto(E, torcidaId, ganhamos, bairro){
    if(!E || !torcidaId) return;
    E.ultimoConfronto = E.ultimoConfronto || {};
    E.ultimoConfronto[torcidaId] = {ganhamos:!!ganhamos, bairro:bairro||'',
                                    quando:E.data.absoluto||0};
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
      assunto:'ideologia',
      texto:`Chefe, antes de tudo: define a nossa ideologia. O que a gente `+
            `faz com o adversário, como recebe aliado e o que faz com os `+
            `outros jogos da praça.`,
      botoes:[{rot:'Definir ideologia', efeito:'gestao'}]});
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
          propor, publicar, responder, travado, decisaoAberta, semanaDaFundacao,
          passarDia, fecharSemana, fechoDaSemana, irProEstadio, registrarConfronto,
          abrir, historico, resumo, expirada, contexto, perguntaAntes,
          feed, fila, ctl};
})();
