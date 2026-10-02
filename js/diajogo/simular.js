/* =========================================================
   O CONFRONTO SIMULADO (pedido do dono, 23/08/2026)

   "Vamos criar um botão de simular em todas as ações de confronto.
   Esse botão vai rodar o motor de confronto de duas IAs pra definir o
   vencedor do duelo. As consequências nas relações, prestígio, etc
   continuam na mesma regra, independente se é simulado ou não."

   Então este arquivo NÃO tem regra de consequência nenhuma. Ele monta
   exatamente o mesmo objeto de resultado que a cena entrega no apito
   final — `res` — e chama o mesmo `aoTerminar`. Quem cobra prestígio,
   relação, ferido, preso, XP e moral continua sendo `fecharDiaDeJogo`
   e a `aplicarResultadoDaNoite`, sem saber se a briga foi jogada ou
   simulada. Trocar o motor sem trocar a régua era o pedido.

   O QUE ELE DECIDE, E COMO:
   · A força de cada lado é efetivo × ficha, somando força e defesa de
     cada um — nossos membros de verdade de um lado, e do outro as
     fichas que `fichasDoPerfil` gera, que são as MESMAS que entrariam
     na cena. Simular não enfraquece nem engorda ninguém.
   · O mais forte é o favorito, e o favorito vence 70% — a régua que
     `relacoes.brigaIA` usa nas brigas entre duas IAs desde 18/08. Três
     em cada dez o bonde menor sai por cima, e é isso que faz simular
     valer a pena arriscar.
   · As baixas seguem a mesma tabela da briga de IA: quem perde deixa
     de 25% a 40% do bonde no chão e de 5% a 12% no camburão; quem
     ganha, de 8% a 16% e de 1% a 4%. Quem cai é sorteado com peso
     invertido pela ficha — o mais fraco vai ao chão primeiro, que é o
     que acontece na cena.
   · O prestígio sai da MESMA fórmula da ponte, sobre os caídos e
     presos dos dois lados. Não há atalho: se a conta muda lá, muda
     aqui, porque é a mesma conta escrita uma vez só.
   ========================================================= */
TO.diaJogo = TO.diaJogo || {};
TO.diaJogo.simular = (function(){
  const U = TO.util;

  /* o favorito vence 70% — igual à briga entre duas IAs */
  const CHANCE_FAVORITO = 0.70;

  /* a tabela de baixas, também igual: [ferido, preso] */
  const BAIXAS = {
    perdeu: {ferido:[0.25, 0.40], preso:[0.05, 0.12]},
    venceu: {ferido:[0.08, 0.16], preso:[0.01, 0.04]}
  };

  const fichaDe = m => (m && ((m.forca||1) + (m.defesa||1))) || 2;

  /* as fichas do outro lado, do mesmo jeito que a cena as geraria */
  function fichasDeles(cfg, quantos){
    const perfil = cfg.perfilRival ||
      ((cfg.bondes || []).find(b=>!b.nossa) || {}).perfil || null;
    const C = TO.diaJogo && TO.diaJogo.combate;
    if(C && C.fichasDoPerfil) return C.fichasDoPerfil(perfil, quantos) || [];
    /* sem o gerador (bancada, teste solto) todo mundo vale o mesmo */
    return Array.from({length:quantos}, ()=>({forca:2, defesa:2}));
  }

  /* quem vai ao chão: sorteio com peso invertido pela ficha */
  function derrubar(fichas, quantos){
    if(quantos <= 0 || !fichas.length) return [];
    const pool = fichas.map((m, i)=>({i, peso: 1 / Math.max(1, fichaDe(m))}));
    const caem = [];
    for(let k = 0; k < quantos && pool.length; k++){
      let soma = pool.reduce((s,x)=>s + x.peso, 0);
      let r = U.rng() * soma, escolhido = pool.length - 1;
      for(let j = 0; j < pool.length; j++){
        r -= pool[j].peso;
        if(r <= 0){ escolhido = j; break; }
      }
      caem.push(pool[escolhido].i);
      pool.splice(escolhido, 1);
    }
    return caem;
  }

  const conta = (n, faixa) => Math.round(n * U.entre(faixa[0], faixa[1]));

  /* =======================================================
     O DUELO
     Devolve o mesmo `res` que a cena devolveria, e entrega
     pro mesmo `aoTerminar`.
     ======================================================= */
  function rodar(op){
    const cfg = (op && op.config) || {};
    const nossos = (cfg.escalacao || []).slice();
    const nossoLado = (cfg.bondes || []).some(b=>b.nossa && b.lado === 'visitante')
      ? 'visitante' : 'mandante';
    const outroLado = nossoLado === 'mandante' ? 'visitante' : 'mandante';

    const nA = nossos.length;
    const nB = Math.max(1, Math.round(cfg.efetivoRival ||
      ((cfg.bondes || []).find(b=>!b.nossa) || {}).n || nA));
    const deles = fichasDeles(cfg, nB);

    /* força é efetivo × ficha: a soma de força e defesa dos dois lados */
    const pA = nossos.reduce((s,m)=>s + fichaDe(m), 0);
    const pB = deles.reduce((s,m)=>s + fichaDe(m), 0) || nB * 2;

    const favoritoNosso = pA === pB ? U.rng() < 0.5 : pA > pB;
    const ganhamos = U.rng() < CHANCE_FAVORITO ? favoritoNosso : !favoritoNosso;

    const nossaTab  = ganhamos ? BAIXAS.venceu : BAIXAS.perdeu;
    const delesTab  = ganhamos ? BAIXAS.perdeu : BAIXAS.venceu;
    const nossosPresos  = Math.min(nA, conta(nA, nossaTab.preso));
    const nossosCaidos  = Math.min(nA - nossosPresos, conta(nA, nossaTab.ferido));
    const delesPresos   = Math.min(nB, conta(nB, delesTab.preso));
    const delesCaidos   = Math.min(nB - delesPresos, conta(nB, delesTab.ferido));

    /* quem, da nossa gente, sai carregado e quem sai no camburão */
    const idxPresos = derrubar(nossos, nossosPresos);
    const sobra = nossos.map((m,i)=>i).filter(i=>!idxPresos.includes(i));
    const idxCaidos = derrubar(sobra.map(i=>nossos[i]), nossosCaidos)
      .map(k=>sobra[k]);

    const caidos = {}, presos = {};
    caidos[nossoLado] = nossosCaidos;  caidos[outroLado] = delesCaidos;
    presos[nossoLado] = nossosPresos;  presos[outroLado] = delesPresos;

    /* XP pela escala, igual à ponte */
    const escala = (nA + nB) / 2;
    const xpBase = escala <= 10 ? 3 : escala <= 30 ? 6 : escala <= 60 ? 10 : 15;
    const xpNoite = Math.round(xpBase * (ganhamos ? 1.5 : 1));

    const membros = nossos.map((m, i)=>{
      const preso = idxPresos.includes(i);
      const caido = !preso && idxCaidos.includes(i);
      return {id:m.id, caido, preso, entrou:false, naRua:false,
              xp: xpNoite,
              moral: preso ? -4 : caido ? -3 : ganhamos ? +1.5 : -0.5};
    });

    /* A MESMA FÓRMULA DA PONTE. `rompido` é sempre falso: simular não
       arromba portão, que é coisa de cena. */
    const venceu = nossoLado === 'mandante' ? ganhamos : !ganhamos;
    const prestigio = U.limitar(Math.round(
      (caidos[outroLado]*2 - caidos[nossoLado]*1.5 - presos[nossoLado]*2) / 3),
      -10, 10) || 0;

    const res = {
      motivo: _t('briga simulada'),
      simulada: true,
      caidosMandante: caidos.mandante, caidosVisitante: caidos.visitante,
      presosMandante: presos.mandante, presosVisitante: presos.visitante,
      rompido: false,
      entraram: 0,
      venceu, ganhamos, nossoLado, xpNoite,
      tranquila: (nossosCaidos + delesCaidos) === 0,
      correram: false,
      efetivo: {[nossoLado]: nA, [outroLado]: nB},
      bombasUsadas: 0,
      armas: {mandante:{}, visitante:{}},
      sumiram: {mandante:0, visitante:0},
      /* `ganhamos`, não `venceu`: a mesma correção da ponte (dono,
         24/08/2026) — venceu é do mandante, e a moral é nossa */
      moralTorcida: ganhamos ? +1 : -0.5,
      prestigio,
      /* a conta que decidiu, pro relatório poder dizer se a gente era
         favorito ou zebra — e pro teste medir a régua */
      forca: {nossa: pA, deles: pB, favoritoNosso},
      membros
    };
    if(op && op.aoTerminar) op.aoTerminar(res);
    return res;
  }

  return {rodar, CHANCE_FAVORITO, BAIXAS};
})();
