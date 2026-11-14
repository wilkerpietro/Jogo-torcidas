/* =========================================================
   AS FESTAS DA ARQUIBANCADA (pedido do dono, 11/10/2026)

   "Animações da torcida durante o jogo: mosaico, subida de
   bandeirão, festa com trapos, chuva de papel picado e mosaico
   3D. Cada uma pode ser comprada pela torcida na loja e cada uma
   aumenta uma porcentagem do Fator Torcida, que ajuda o time a
   ganhar o jogo."

   COMO FUNCIONA
     · Compra na Loja (Financeiro → Loja → Festa na arquibancada).
       Cada compra é UMA festa: o material de um jogo — papel,
       tinta, tecido, a mão de obra de montar na véspera.
     · O estoque é gasto sozinho no próximo jogo do nosso clube em
       que a torcida estiver no estádio: em casa sempre; fora, só
       se a caravana sai com gente (mínimo `MIN_FORA`). Uma de cada
       tipo por jogo — duas iguais no mesmo jogo não somam.
     · O Fator Torcida é o mesmo da bateria (competicoes.bonusTorcida):
       porcentagem da régua de 55 pontos do placar. Em casa empurra o
       mandante; fora, o visitante (o bônus entra negativo).
     · O jogo guarda quais festas teve (`j.festas`), e é isso que a
       cena da arquibancada (js/diajogo/festas_cena.js) desenha.
   ========================================================= */
window.TO = window.TO || {};

TO.festas = (function(){
  /* A ordem é a do catálogo na loja, da mais barata pra mais cara.
     `pct` é a fatia da régua de força: 0,05 = 5% = 2,75 pontos. */
  const CATALOGO = [
    {id:'papel',     nome:_t('Chuva de papel picado'), custo:3000,  pct:0.04,
     nota:_t('papel picado nas cores da torcida na entrada do time e a cada gol nosso')},
    {id:'trapos',    nome:_t('Festa com trapos'),      custo:6000,  pct:0.05,
     nota:_t('tiras de tecido nas cores da torcida penduradas na arquibancada o jogo inteiro')},
    {id:'bandeirao', nome:_t('Bandeirão'),             custo:12000, pct:0.08,
     nota:_t('a torcida sobe o bandeirão e ele tremula por cima das cabeças')},
    {id:'mosaico',   nome:_t('Mosaico'),               custo:20000, pct:0.10,
     nota:_t('cada um levanta um papel colorido: de cima, forma o escudo do clube ou as cores da torcida')},
    {id:'mosaico3d', nome:_t('Mosaico 3D'),            custo:35000, pct:0.13,
     nota:_t('a bandeira gigante pendurada em pé na arquibancada, com arte da torcida')}
  ];
  const POR_ID = Object.fromEntries(CATALOGO.map(f => [f.id, f]));
  const REGUA = 55;          // o divisor do placar (competicoes.simular)
  const MIN_FORA = 10;       // caravana com menos que isso não monta festa
  const MAX_ESTOQUE = 20;

  function estoque(E){
    E.festas = E.festas || {};
    for(const f of CATALOGO) if(typeof E.festas[f.id] !== 'number') E.festas[f.id] = 0;
    return E.festas;
  }

  function comprar(E, id, qtd){
    const f = POR_ID[id];
    if(!f) return {ok:false, msg:_t('Festa desconhecida.')};
    qtd = Math.max(1, Math.round(qtd || 1));
    const est = estoque(E);
    if(est[id] + qtd > MAX_ESTOQUE)
      return {ok:false, msg:_t('O depósito só guarda {n} de cada.', {n:MAX_ESTOQUE})};
    const custo = f.custo * qtd;
    if(E.dinheiro < custo) return {ok:false, msg:_t('Não dá: falta caixa.')};
    est[id] += qtd;
    TO.estado.lancar(E, _tn(qtd, 'Festa na arquibancada: {nome}', 'Festa na arquibancada: {nome} (×{n})', {nome:f.nome}), -custo);
    return {ok:true, msg:_t('{nome} no depósito: {n}.', {nome:f.nome, n:est[id]})};
  }

  /* a nossa torcida vai estar no estádio deste jogo? */
  function vamosEstar(E, j){
    const meu = E.torcida && E.torcida.clubeId;
    if(!meu) return false;
    if(j.c === meu) return TO.membros.aptosParaOEstadio(E).length >= 6;
    if(j.f !== meu) return false;
    const mapa = (TO.mundo.time(j.c) || {}).mapa;
    if(mapa && mapa === E.torcida.mapa) return true;          // clássico na praça
    const n = TO.planejamento && TO.planejamento.efetivoDaSaida
      ? TO.planejamento.efetivoDaSaida(E, {mapa}) : 0;
    return n >= MIN_FORA;
  }

  /* GASTA o estoque do jogo e devolve o bônus em pontos de força, na
     orientação do mandante (fora = negativo). Chamado UMA vez por jogo,
     na hora em que o placar é sorteado; o jogo leva a lista junto. */
  function usarNoJogo(E, j){
    if(!E || !j || j.festas) return 0;
    const meu = E.torcida && E.torcida.clubeId;
    if(!meu || (j.c !== meu && j.f !== meu)) return 0;
    const est = estoque(E);
    const tem = CATALOGO.filter(f => est[f.id] > 0);
    if(!tem.length || !vamosEstar(E, j)) return 0;
    for(const f of tem) est[f.id]--;
    j.festas = tem.map(f => f.id);
    const pct = tem.reduce((s, f) => s + f.pct, 0);
    const pts = REGUA * pct;
    return j.c === meu ? pts : -pts;
  }

  const pctDe = ids => (ids || []).reduce((s, id) => s + ((POR_ID[id] || {}).pct || 0), 0);

  return {CATALOGO, POR_ID, REGUA, MIN_FORA, MAX_ESTOQUE,
          estoque, comprar, usarNoJogo, vamosEstar, pctDe};
})();
