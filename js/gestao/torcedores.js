/* =========================================================
   TORCEDOR COMUM — só a base de recrutamento
   ---------------------------------------------------------
   O que morava aqui e saiu do jogo por decisão do autor:
   · Satisfação do torcedor comum (indicador 0–20);
   · Fator Torcida no placar (o placar agora é puro, só a
     força dos clubes);
   · punição/proibição de estádio (o sistema de polícia saiu);
   · o material paralelo de faixas e bateria.

   O que fica é a pergunta que o recrutamento faz: quantos
   torcedores do clube moram na cidade e ainda não são de
   organizada nenhuma.
   ========================================================= */
window.TO = window.TO || {};

TO.torcedores = (function(){
  const U = TO.util;
  const M = () => TO.mundo;

  /* fração da base que topa entrar na organizada numa campanha —
     antes variava com a satisfação; agora é fixa no nível "Contente" */
  const ORGANIZAR = 0.15;
  const ORGANIZAR_MAX = 0.30;

  function base(E){
    return TO.mundo.baseDeRecrutamento(E.torcida.mapa, E.torcida.clubeId,
      o => TO.acoes.efetivoDe(E, o));
  }

  /* a janela de recrutamento que o acesso e o rebaixamento abrem:
     multiplicador com prazo em semana absoluta */
  const semanaAbs = E => (E.data.ano - 2026)*52 + E.data.semana;
  function janela(E){
    const j = E.recrutamento;
    if(!j || semanaAbs(E) > j.ate) return 1;
    return j.mult || 1;
  }
  function abrirJanela(E, mult, semanas){
    E.recrutamento = {mult, ate: semanaAbs(E) + semanas};
  }

  return {ORGANIZAR, ORGANIZAR_MAX, base, janela, abrirJanela};
})();
