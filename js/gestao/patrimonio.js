/* =========================================================
   PATRIMÔNIO — o que a torcida tem e o que ela pode comprar
   ---------------------------------------------------------
   Duas coisas diferentes moram aqui, e é de propósito que
   estejam juntas: as duas saem do mesmo caixa.

   ESTRUTURA é imóvel: sede, bar, loja, subsede, fábrica.
   Rende e custa todo mês, e o financeiro já sabia somar isso
   — o que faltava era onde comprar.

   MATERIAL é o que a torcida leva pro estádio: bateria,
   faixa, bandeirão, bandeira, bomba. Não rende dinheiro;
   rende festa, e festa é satisfação do torcedor comum e
   prestígio na rua. Bomba é a exceção: ela vira estoque do
   dia de jogo.

   PREÇOS. Todos vêm do GDD V4 §8.1 e §8.3, com uma exceção
   anotada no lugar (subsede, que o GDD não precifica).
   Imóvel neste jogo é caro de propósito: um bar custa
   cinquenta meses do que ele rende, então comprar é decisão
   de temporada e não de semana.
   ========================================================= */
window.TO = window.TO || {};

TO.patrimonio = (function(){
  const U = TO.util;
  const F = () => TO.financeiro;

  /* -------------------------------------------------------
     ESTRUTURA
     ------------------------------------------------------- */

  /* Ampliar a sede é a compra que destrava as outras: teto de
     membros, diretoria, treino e quantos pontos comerciais cabem —
     e não só quantos, também de que nível. GDD V4 §8.1. */
  const SEDE = [null,
    null,                                        // n1 é onde se começa
    {custo: 40000,  rot:'Sede nível 2'},
    {custo:100000,  rot:'Sede nível 3'},
    {custo:200000,  rot:'Sede nível 4'},
    {custo:400000,  rot:'Sede nível 5'}
  ];

  /* Quanto de cada coisa cabe por nível de sede (GDD V4 §8.1). Duas
     dimensões, não uma: `qtd` é quantos pontos, `nivel` é até que
     nível eles podem chegar. Bar nível 3 só existe em sede nível 5. */
  const TETO = {
    bar:     [null, {qtd:1, nivel:1}, {qtd:1, nivel:1}, {qtd:1, nivel:2},
                    {qtd:2, nivel:2}, {qtd:2, nivel:3}],
    loja:    [null, {qtd:0, nivel:0}, {qtd:1, nivel:1}, {qtd:1, nivel:2},
                    {qtd:2, nivel:2}, {qtd:2, nivel:3}],
    /* subsede na cidade e fora somadas: a cena não distingue as duas
       ainda, então o teto é a soma das duas colunas do GDD */
    subsede: [null, {qtd:0, nivel:1}, {qtd:1, nivel:1}, {qtd:2, nivel:1},
                    {qtd:5, nivel:1}, {qtd:8, nivel:1}]
  };

  /* GDD V4 §8.3. O preço de cada nível é o preço de ter o ponto
     naquele nível, então ampliar custa o cheio do nível novo. */
  const PONTO = {
    bar: {
      rot:'Bar', plural:'bares',
      compra: 40000,
      ampliar:[null, 80000, 150000, null]
    },
    loja: {
      rot:'Loja', plural:'lojas',
      compra: 50000,
      ampliar:[null, 100000, 150000, null]
    },
    subsede: {
      rot:'Subsede', plural:'subsedes',
      /* ÚNICO PREÇO INFERIDO: o GDD V4 §8.3 descreve o que a subsede
         faz mas não diz quanto custa. Ela rende 600/mês contra 90 de
         manutenção e dobra o recrutamento da zona — na escala dos
         outros pontos (bar 40k pra 680/mês), 30k é o equivalente. */
      compra: 30000,
      ampliar:[null, null]
    }
  };

  /* A fábrica não corta material: ela é fábrica de produto de loja.
     Triplica o faturamento das lojas e derruba o insumo em 60%
     (GDD V4 §8.3), e só existe em sede nível 5. */
  const FABRICA = {custo:400000, sede:5, multLoja:3, corteInsumo:0.6,
                   rot:'Fábrica'};

  const nivelSede = E => E.torcida.sedeNivel;
  const cont = (E, tipo) => (F().patrimonio(E)[PONTO[tipo].plural] || []).length;

  /* =======================================================
     A TABELA DA ESTRUTURA
     Um mês de cada ponto, com receita, despesa e o que sobra.
     Mensal e não semanal porque é assim que se compara com o
     preço de compra — o fechamento semanal continua sendo um
     quarto disto, como sempre foi.
     ======================================================= */
  function linhas(E){
    const p = F().patrimonio(E);
    const fator = F().fatorComercial(E);
    const mult = b => TO.mundo.multiplicador(
      TO.mundo.bairro(E.torcida.mapa, b));
    /* os números do GDD moram no financeiro; puxar de lá é o que
       impede a tabela de mentir quando o balanço mudar */
    const REC = F().RECEITA, MAN = F().MANUT, INSUMO = F().INSUMO;
    const fora = [];

    fora.push({tipo:'sede', rot:`Sede (nível ${nivelSede(E)})`,
               bairro:(TO.mundo.bairroDaSede(E.torcida)||{}).nome || '',
               receita:0, despesa:F().MANUT_SEDE[nivelSede(E)]});

    for(const b of p.bares) fora.push({tipo:'bar',
      rot:`Bar (nível ${b.nivel})${b.gratis?' · da sede':''}`, bairro:b.bairro,
      receita: REC.bar[b.nivel]*mult(b.bairro)*fator, despesa: MAN.bar[b.nivel]});
    const fab = p.fabrica ? FABRICA : null;
    for(const l of p.lojas) fora.push({tipo:'loja',
      rot:`Loja (nível ${l.nivel})${l.semInsumo?' · sem insumo':fab?' · fábrica':''}`,
      bairro:l.bairro,
      receita: l.semInsumo ? 0
             : REC.loja[l.nivel]*mult(l.bairro)*fator*(fab?fab.multLoja:1),
      despesa: MAN.loja[l.nivel]
             + REC.loja[l.nivel]*INSUMO*(fab?1-fab.corteInsumo:1)});
    for(const s of p.subsedes) fora.push({tipo:'subsede', rot:'Subsede', bairro:s.bairro,
      receita: REC.subsede*mult(s.bairro)*fator, despesa: MAN.subsede});

    if(E.onibus) fora.push({tipo:'onibus', rot:'Ônibus da torcida',
      bairro:'', nota:'combustível e manutenção · estrada de graça',
      receita:0, despesa:1500});

    /* A LINHA DE MATERIAL POR MEMBRO SAIU do financeiro, e sai daqui
       junto: a tabela de patrimônio mostrava a mesma despesa que as
       contas cobravam, e deixar a sombra dela aqui faria a tela cobrar
       um custo que o caixa não paga mais. */

    for(const f of fora){
      f.receita = Math.round(f.receita);
      f.despesa = Math.round(f.despesa);
      f.saldo   = f.receita - f.despesa;
    }
    return fora;
  }

  /* =======================================================
     O QUE DÁ PRA COMPRAR
     Cada opção diz o preço e, quando não dá, diz por quê —
     botão cinza sem explicação é o que faz o jogador achar
     que o jogo travou.
     ======================================================= */
  function opcoes(E){
    const p = F().patrimonio(E);
    const n = nivelSede(E);
    const lista = [];
    const trava = (custo, extra)=> extra ? extra
      : E.dinheiro < custo ? 'falta caixa' : null;

    if(SEDE[n+1]) lista.push({
      id:'sede', rot:`Ampliar a sede para o nível ${n+1}`,
      nota:'mais membros, mais diretoria, mais pontos comerciais',
      custo:SEDE[n+1].custo, trava:trava(SEDE[n+1].custo)});

    for(const tipo of ['bar','loja','subsede']){
      const cfg = PONTO[tipo], tem = cont(E,tipo), teto = TETO[tipo][n];
      lista.push({id:'comprar:'+tipo, rot:`Abrir ${cfg.rot.toLowerCase()}`,
        nota:`${tem} de ${teto.qtd} pela sede nível ${n}`,
        custo:cfg.compra,
        trava:trava(cfg.compra, tem>=teto.qtd ? 'a sede não comporta mais' : null)});

      /* ampliar o ponto mais fraco de cada tipo: é o que o jogador
         faria de qualquer jeito, e evita uma lista de dez botões */
      const pontos = p[cfg.plural] || [];
      const alvo = pontos.filter(x=>cfg.ampliar[x.nivel])
                         .sort((a,b)=>a.nivel-b.nivel)[0];
      if(alvo) lista.push({
        id:'ampliar:'+tipo, rot:`Ampliar ${cfg.rot.toLowerCase()} para nível ${alvo.nivel+1}`,
        nota:alvo.bairro ? `em ${alvo.bairro}` : '',
        custo:cfg.ampliar[alvo.nivel],
        trava:trava(cfg.ampliar[alvo.nivel],
          alvo.nivel+1 > teto.nivel ? `sede nível ${n} não comporta ${cfg.rot.toLowerCase()} nível ${alvo.nivel+1}` : null)});
    }

    /* O ÔNIBUS DA TORCIDA (decisão do dono, 17/08/2026): R$ 100 mil,
       R$ 1.500/mês de combustível e manutenção, 1% ao mês de uma
       manutenção séria de R$ 15 mil — e a caravana de estrada sai de
       graça. Avião continua pago: ônibus não voa. */
    if(!E.onibus) lista.push({
      id:'onibus', rot:'Comprar o ônibus da torcida',
      nota:'acaba a despesa da caravana na estrada · R$ 1.500/mês de '+
           'combustível e manutenção · rota de avião continua paga',
      custo:100000, trava:trava(100000)});

    if(!p.fabrica) lista.push({
      id:'fabrica', rot:FABRICA.rot,
      nota:`triplica o faturamento das lojas e corta ${Math.round(FABRICA.corteInsumo*100)}% do insumo`,
      custo:FABRICA.custo,
      trava:trava(FABRICA.custo,
        n < FABRICA.sede ? `precisa de sede nível ${FABRICA.sede}` : null)});

    return lista;
  }

  function comprar(E, id){
    const p = F().patrimonio(E);
    const o = opcoes(E).find(x=>x.id===id);
    if(!o) return {ok:false, msg:'Opção que não existe.'};
    if(o.trava) return {ok:false, msg:`Não dá: ${o.trava}.`};

    const [acao, tipo] = id.split(':');
    if(acao==='sede'){
      E.torcida.sedeNivel++;
      TO.estado.lancar(E, `Ampliação da sede — nível ${E.torcida.sedeNivel}`, -o.custo);
      /* a inauguração é EFEMÉRIDE (feed 9.4), e quem sabe que ela
         aconteceu é quem comprou. O feed lê este carimbo e conta. */
      E.inauguracao = {tipo:'sede', nivel:E.torcida.sedeNivel,
                       quando:(E.data||{}).absoluto || 0, contada:false};
    } else if(acao==='fabrica'){
      p.fabrica = true;
      TO.estado.lancar(E, 'Fábrica de material', -o.custo);
    } else if(acao==='onibus'){
      E.onibus = {desde:(E.data||{}).absoluto || 0};
      TO.estado.lancar(E, 'Ônibus da torcida', -o.custo);
    } else if(acao==='comprar'){
      const cfg = PONTO[tipo];
      const bairro = F().bairroDeFora(E, tipo+'-'+(cont(E,tipo)+1));
      p[cfg.plural].push({nivel:1, bairro});
      TO.estado.lancar(E, `${cfg.rot} em ${bairro}`, -o.custo);
      /* subsede nova tem batismo (feed 9.5); bar e loja não — quem se
         reúne na subsede é a torcida, e é isso que vira data */
      if(tipo === 'subsede')
        E.inauguracao = {tipo:'subsede', bairro,
                         quando:(E.data||{}).absoluto || 0, contada:false};
    } else if(acao==='ampliar'){
      const cfg = PONTO[tipo];
      const alvo = (p[cfg.plural]||[]).filter(x=>cfg.ampliar[x.nivel])
                                      .sort((a,b)=>a.nivel-b.nivel)[0];
      if(!alvo) return {ok:false, msg:'Não há o que ampliar.'};
      alvo.nivel++;
      TO.estado.lancar(E, `Ampliação — ${cfg.rot} ${alvo.bairro} (n${alvo.nivel})`, -o.custo);
    }
    return {ok:true, msg:o.rot};
  }

  /* =======================================================
     BOMBAS
     O catálogo de materiais saiu do jogo (decisão do autor).
     O que sobrou de consumível é a bomba: ela é comprada na
     hora do planejamento do ataque e vai pro estoque que a
     cena gasta.
     ======================================================= */
  const PRECO_BOMBA = 120;

  function estoquePiro(E){
    if(!E.estoque) E.estoque = {bombas:0};
    if(E.estoque.bombas == null) E.estoque.bombas = 0;
    return E.estoque;
  }
  const bombas = E => estoquePiro(E).bombas;

  function comprarBombas(E, qtd){
    qtd = Math.max(0, Math.round(qtd||0));
    if(!qtd) return {ok:true, compradas:0};
    const custo = qtd * PRECO_BOMBA;
    if(E.dinheiro < custo) return {ok:false, msg:'falta caixa'};
    estoquePiro(E).bombas += qtd;
    TO.estado.lancar(E, `Bombas ×${qtd}`, -custo);
    return {ok:true, compradas:qtd, custo};
  }

  return {SEDE, TETO, PONTO, FABRICA,
          linhas, opcoes, comprar,
          PRECO_BOMBA, bombas, comprarBombas};
})();
