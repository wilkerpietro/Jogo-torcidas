/* =========================================================
   RELAÇÃO COM O CLUBE (pedido do dono, 18/09/2026)

   Um medidor à parte de moral e prestígio, na régua de 0 a
   100: mede o quanto a TORCIDA está alinhada com o CLUBE que
   ela apoia — presença nos jogos, disciplina no dia de jogo,
   e o que ela diz da diretoria e da temporada quando alguém
   pergunta. A régua de 0–20 de `indicadores` não serve aqui:
   o dono pediu 0 a 100 de propósito, e os quatro degraus de
   benefício (25/50/75/100) pedem números redondos que só a
   escala cheia dá.

   NASCE EM 50 — nem torcida contra, nem torcida de joelhos.
   Sobe com presença em jogo, desce com bagunça e crítica
   pública; os BENEFÍCIOS (ingresso, loja, caravana) só saem
   daqui — quem lê o nível e aplica é cada sistema por conta
   própria (financeiro pro comércio e pra caravana, o feed pro
   dia de jogo em casa).
   ========================================================= */
window.TO = window.TO || {};

TO.relacaoClube = (function(){
  const U = TO.util;

  const PRECO_INGRESSO = 10;

  /* =======================================================
     OS QUATRO DEGRAUS (tabela do dono, 18/09/2026)
     0–25 não dá nada; dali pra cima, ingresso sempre sobe
     junto — e só nos dois de cima é que loja e caravana
     entram.
     ======================================================= */
  const FAIXAS = [
    {min:0,  max:25,  ingressos:0,    lojaBuff:0,    caravana:0,
     rot:'ruim'},
    {min:26, max:50,  ingressos:0.10, lojaBuff:0,    caravana:0,
     rot:'morna'},
    {min:51, max:75,  ingressos:0.30, lojaBuff:0.05, caravana:0,
     rot:'boa'},
    {min:76, max:100, ingressos:0.60, lojaBuff:0.15, caravana:0.20,
     rot:'ótima'}
  ];
  function faixaDe(v){
    for(const f of FAIXAS) if(v <= f.max) return f;
    return FAIXAS[FAIXAS.length - 1];
  }

  function nivel(E){
    if(!E) return 50;
    if(E.relacaoClube == null) E.relacaoClube = 50;
    return E.relacaoClube;
  }

  /* o livro da relação com o clube, no mesmo espírito do livro de
     moral e prestígio (`TO.estado.mexerIndicador`) — motivo sempre
     junto, é o que a sub-tela mostra item a item */
  /* `tipo` É PRA QUEM LÊ, `motivo` É PRA QUEM OLHA (21/09/2026).
     A pauta da entrevista perguntava "teve briga recente?" rodando
     /^Briga/ no motivo — quer dizer, decidindo estado de jogo pela
     redação de uma frase de tela. Trocar "Briga nos arredores" por
     "Confusão nos arredores" apagava a pergunta sem erro nenhum:
     ela só deixava de aparecer. Quem grava agora diz o tipo. */
  function mexer(E, delta, motivo, tipo){
    if(!E || !delta) return 0;
    const antes = nivel(E);
    E.relacaoClube = U.limitar(antes + delta, 0, 100);
    const real = Math.round((E.relacaoClube - antes) * 10) / 10;
    if(real){
      E.relacaoClubeHistorico = E.relacaoClubeHistorico || [];
      E.relacaoClubeHistorico.unshift({
        dia:`${E.data.semana}/${E.data.dia}`, ano:E.data.ano,
        delta: real, motivo: motivo || '', t: tipo || ''});
      if(E.relacaoClubeHistorico.length > 200)
        E.relacaoClubeHistorico.pop();
    }
    return real;
  }

  const multLoja      = E => 1 + faixaDe(nivel(E)).lojaBuff;
  const abateCaravana = E => faixaDe(nivel(E)).caravana;
  const pctIngressos  = E => faixaDe(nivel(E)).ingressos;

  /* QUANTOS INGRESSOS A TORCIDA VENDE PROS PRÓPRIOS MEMBROS, num jogo
     em casa: a fatia da faixa vezes o efetivo total (não só quem foi
     de fato — é venda antecipada, o critério é ser membro). */
  function ingressosDoJogo(E){
    const pct = pctIngressos(E);
    if(!pct) return {n:0, valor:0, pct:0};
    const n = Math.round((E.membros || []).length * pct);
    return {n, valor: n * PRECO_INGRESSO, pct};
  }

  /* =======================================================
     PRESENÇA EM JOGO (tabela do dono, 18/09/2026)
     Em casa só a faixa de cima paga; fora, o degrau mais alto
     que a caravana alcançou — não soma os três, é o teto.
     ======================================================= */
  function pontosPorPresenca(E, pct, casa){
    let delta = 0;
    if(casa){
      if(pct > 0.8) delta = 2;
    } else {
      if(pct > 0.6) delta = 6;
      else if(pct > 0.4) delta = 4;
      else if(pct > 0.2) delta = 1;
    }
    if(delta) mexer(E, delta, casa
      ? `Casa cheia: ${Math.round(pct*100)}% dos membros no estádio`
      : `Caravana forte: ${Math.round(pct*100)}% dos membros na viagem`);
    return delta;
  }

  /* =======================================================
     BRIGA EM DIA DE JOGO (tabela do dono, 18/09/2026)
     Nos arredores incomoda menos que dentro da arquibancada —
     é a arena do clube, não a rua — e em casa pesa mais que
     fora, porque é a imagem da torcida na frente da própria
     cidade.
     ======================================================= */
  const PONTOS_BRIGA = {
    arredores:    {casa:-6,  fora:-4},
    arquibancada: {casa:-10, fora:-6}
  };
  function pontosPorBriga(E, tipo, casa){
    const t = PONTOS_BRIGA[tipo];
    if(!t) return 0;
    const delta = casa ? t.casa : t.fora;
    mexer(E, delta, tipo === 'arquibancada'
      ? `Briga na arquibancada, jogo ${casa ? 'em casa' : 'fora'}`
      : `Briga nos arredores do estádio, jogo ${casa ? 'em casa' : 'fora'}`,
      'briga');
    return delta;
  }

  /* =======================================================
     A SEQUÊNCIA DO CLUBE EM CAMPO
     Guarda o resultado de cada jogo (V/E/D), o suficiente pra
     saber se o protesto na porta do CT faz sentido: 3 ou mais
     derrotas nos últimos 5 jogos. Régua do autor — o dono não
     cravou o número, e esta é a leitura mais direta do "observe
     a sequência ruim na tabela" que ele pediu.
     ======================================================= */
  function registrarResultadoClube(E, venceu, perdeu){
    E.sequenciaClube = E.sequenciaClube || [];
    E.sequenciaClube.unshift(venceu ? 'V' : perdeu ? 'D' : 'E');
    if(E.sequenciaClube.length > 8) E.sequenciaClube.length = 8;
  }
  function sequenciaRuim(E){
    const s = (E.sequenciaClube || []).slice(0, 5);
    return s.filter(x => x === 'D').length >= 3;
  }
  const derrotasRecentes = E => (E.sequenciaClube || []).slice(0, 5)
    .filter(x => x === 'D').length;

  return {PRECO_INGRESSO, FAIXAS, faixaDe, nivel, mexer,
          multLoja, abateCaravana, pctIngressos, ingressosDoJogo,
          pontosPorPresenca, pontosPorBriga,
          registrarResultadoClube, sequenciaRuim, derrotasRecentes};
})();
