/* =========================================================
   FUTEBOL E PORRADA (pedido do dono, 21/08/2026)

   O jornal da briga. Mesma estrutura da Gazeta dos Sports —
   cabeçalho, tarja, chapéu, manchete, olho e placar grande —,
   mas a voz é da rua e o que vai ao lado da manchete não é
   classificação: é o QUADRO DA NOITE, com envolvidos, feridos,
   presos e quem levou a melhor dos dois lados.

   Toda briga da NOSSA torcida vira uma edição. As brigas que o
   resto do país teve no mesmo dia ficam atrás do botão "Ver
   mais notícias", como as outras seções da Gazeta.

   NADA É ESCRITO NA HORA. Toda frase sai de um molde submetido
   ao crivo do dono, preenchido com o que a briga já sabe. Onde
   há mais de um molde pra mesma condição eles andam numa fila:
   dentro da mesma edição nenhum se repete, e a escolha é
   determinada pelo dia — a mesma briga dá sempre a mesma
   página, o que importa porque a mensagem sobrevive ao save.
   ========================================================= */
window.TO = window.TO || {};

TO.porrada = (function(){
  const M = ()=>TO.mundo;

  const MES = ['janeiro','fevereiro','março','abril','maio','junho','julho',
               'agosto','setembro','outubro','novembro','dezembro'];
  const DIA_SEM = ['','Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  const ROMANO = n => ['','I','II','III','IV','V','VI','VII','VIII','IX','X',
                       'XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'][n] || n;

  /* =======================================================
     OS MOLDES (submetidos ao crivo do dono, 21/08/2026)
     Cada lista é uma fila: dentro da edição a próxima frase
     da mesma condição é a de baixo, e no fim volta pro começo.
     ======================================================= */
  const MOLDES = {
    /* 1 · chapéu — condição única, não alterna */
    chapeu:{
      atropelo:  ['Atropelo'],
      menos:     ['Era menos e não correu'],
      cadeia:    ['Noite de camburão'],
      semLuta:   ['Ninguém desceu'],
      arquibancada:['O setor se pegou'],
      lnt:       ['Dia de LNT'],
      padrao:    ['O pau do dia']
    },

    /* 2 · manchete
       {A} vencedor · {B} perdedor · {nA} efetivo do vencedor
       {nB} efetivo do perdedor · {fA} feridos do vencedor
       {fB} feridos do perdedor · {onde} o lugar */
    manchete:{
      /* venceu atropelando: 3 ou mais feridos de diferença */
      atropelo:[
        '{A} passou o trator na {B}',
        '{A} amassou a {B} e não teve conversa',
        '{B} não durou nem cinco minutos contra a {A}',
        'Deu {A} do começo ao fim, e a {B} não teve resposta'
      ],
      /* venceu no sufoco */
      vitoria:[
        '{A} levou a melhor contra a {B} no sufoco',
        'Foi apertado, mas quem ficou de pé foi a {A}',
        '{A} segurou o rojão e virou o jogo',
        '{A} saiu por cima por pouco'
      ],
      /* venceu em menor número */
      vitoriaMenos:[
        '{A} era menos e ainda correu com a {B}',
        'Em menor número, {A} não correu e ainda botou a {B} pra correr',
        '{A} tinha {nA} contra {nB} e mesmo assim mandou'
      ],
      /* perdeu no detalhe */
      derrota:[
        'Deu {A} no detalhe, e a treta não morre aí',
        '{A} levou por pouco e a {B} não engoliu',
        'A {B} caiu de pé, mas caiu: quem levou foi a {A}'
      ],
      /* apanhou feio */
      apanhou:[
        '{B} tomou um baile da {A}',
        'Sobrou pra {B} de todo lado, e quem distribuiu foi a {A}',
        '{A} passou o rodo e a {B} foi contar os feridos'
      ],
      /* perdeu em desvantagem numérica */
      apanhouMenos:[
        'A {B} era {nB} contra {nA} e a {A} não perdoou',
        'Eram muitos: a {B} apanhou da {A} no braço contado'
      ],
      /* ninguém levou a melhor */
      empate:[
        '{A} e {B}: ninguém levou a melhor e os dois contaram ferido',
        'Deu treta e deu empate entre {A} e {B}: saíram machucados os dois',
        '{A} e {B} bateram de igual pra igual e ficou por isso mesmo'
      ],
      /* ninguém desceu pra segurar */
      semLuta:[
        'A {A} quebrou tudo e foi embora sem achar ninguém',
        'A {A} chegou, quebrou e ninguém desceu pra segurar'
      ],
      /* a polícia levou gente demais */
      cadeia:[
        'A polícia encheu o camburão, e quem levou a melhor foi a {A}',
        'Acabou com camburão cheio dos dois lados, e a melhor foi da {A}',
        'Terminou na delegacia com {P} nomes na lista, e a {A} ainda levou a melhor'
      ]
    },

    /* 3 · olho da manchete */
    olho:{
      completo:['Foi {onde}, {nA} de um lado e {nB} do outro: '+
                '{fA} {plA} da {A} e {fB} da {B}.'],
      comPresos:['Foi {onde}, {nA} contra {nB}. Saldo: {F} no chão e '+
                 '{P} no camburão — a melhor foi da {A}.'],
      empate:['Foi {onde}, {nA} de um lado e {nB} do outro, e saiu todo '+
              'mundo contando o que doeu.'],
      semLuta:['Foi {onde}. Não teve briga: teve prejuízo.'],
      /* DUAS FRASES, E NÃO UMA (revisão do dono, 22/08/2026): "era
         menos" é sempre sobre o NOSSO lado, e {A} é sempre o vencedor.
         Com um olho só, a derrota em menor número saía dizendo que
         quem venceu é que estava em desvantagem. */
      menosGanhou:['Foi {onde}. A {A} era {nA} contra {nB} e mandou '+
                   'embora do mesmo jeito.'],
      menosPerdeu:['Foi {onde}. A {B} era {nB} contra {nA} e não teve '+
                   'como segurar a {A}.']
    },

    /* 4 · as notas das outras brigas do dia (o card aberto) */
    /* CADA CONDIÇÃO PRECISA DE MOLDE SOBRANDO: a regra é a mesma da
       Gazeta — nenhuma condição entra mais vezes do que tem frase —,
       e com um molde só o dia de seis brigas saía com uma nota. */
    nota:{
      atropelo:['{A} correu com a {B} e não deu trabalho.',
                'A {B} nem esquentou: {A} resolveu rápido.',
                '{A} passou por cima da {B} sem sustos.'],
      vitoria: ['{A} levou a melhor contra a {B} no aperto.',
                'Deu {A} sobre a {B}, mas custou caro.',
                '{A} ganhou da {B} no detalhe.'],
      empate:  ['{A} e {B} bateram de igual e ninguém levou nada.',
                'Nem {A} nem {B}: saíram os dois no prejuízo.'],
      cadeia:  ['{A} sobre a {B}, e a viatura levou {P}.',
                'Deu {A} sobre a {B} e a noite acabou na delegacia.']
    },

    /* 6 · A LNT (textos submetidos ao crivo do dono, 23/08/2026)
       {D} divisão · {A} campeã · {V} vice · {S} quem sobe
       {C} quem desce · {N} quantas torcidas */
    lnt:{
      fundacao:[
        'A LNT está de pé: {N} torcidas, quatro divisões, dez contra dez'],
      fundacaoOlho:[
        'Duas edições por ano, uma em cada semestre. Cinco rodadas de '+
        'chave e depois mata-mata; o último de cada chave desce de '+
        'divisão e o mata-mata dá o acesso. Na 1ª Divisão o campeão '+
        'leva {P}.'],
      campeao:[
        '{A} é campeã da {D} da LNT',
        '{A} levantou a taça da {D} da LNT',
        'Deu {A} na {D}: a taça da LNT ficou com ela'],
      campeaoNos:[
        'A taça da {D} da LNT é NOSSA',
        'Somos campeões da {D} da LNT'],
      olhoFim:[
        '{V} ficou com o vice. Sobem: {S}. Descem: {C}.',
        'O vice foi da {V}. Quem sobe: {S}. Quem desce: {C}.'],
      olhoFimSemDesce:[
        '{V} ficou com o vice. Sobem: {S}.'],
      nosso:[
        'A gente parou {F} da {DN} Divisão.',
        'A nossa campanha acabou {F} da {DN} Divisão.']
    },

    /* 5 · quando o país não se pegou */
    vazio:['O resto do país passou o dia em paz.',
           'Fora essa, nenhuma outra treta hoje.']
  };

  /* ---- o motor de moldes (o mesmo da Gazeta) ---- */
  function encher(molde, v){
    return String(molde||'').replace(/\{(\w+)\}/g, (t,k)=>
      v[k] === undefined || v[k] === null ? '' : String(v[k]));
  }
  /* a fila: mesma condição duas vezes na edição não repete frase */
  function filaDe(semente){
    const usados = {};
    return (lista, chave)=>{
      if(!lista || !lista.length) return '';
      const i = (usados[chave] === undefined
                 ? (semente % lista.length)
                 : (usados[chave] + 1)) % lista.length;
      usados[chave] = i;
      return lista[i];
    };
  }

  const NOMES_CENA = {
    arredores:'nos arredores do estádio', praca:'na praça',
    rua:'numa rua de periferia', 'rua-media':'numa rua de classe média',
    'rua-nobre':'numa rua de classe alta', bar:'no bar', comercio:'no comércio',
    ct:'no CT', sede:'na sede', loja:'na loja', subsede:'na subsede',
    'estadio-10':'na arquibancada', 'estadio-20':'na arquibancada',
    'estadio-40':'na arquibancada',
    'treta-beco':'no beco', 'treta-galpao':'no pátio do galpão',
    'treta-campo':'no campo de terra',
    'emb-posto':'no posto', 'emb-onibus':'na estrada'
  };
  const SEM_BAIRRO = ['estadio-10','estadio-20','estadio-40','emb-onibus'];
  const ondeDe = d =>{
    const c = d.cena || '';
    const nome = NOMES_CENA[c] || 'na rua';
    const cabe = d.bairro && SEM_BAIRRO.indexOf(c) < 0 &&
                 NOMES_CENA[c] !== `na ${d.bairro}` &&
                 NOMES_CENA[c] !== `no ${d.bairro}`;
    return cabe ? `${nome}, no bairro ${d.bairro}` : nome;
  };

  /* =======================================================
     A PÁGINA
     ======================================================= */
  function montar(E, m){
    const d = m && m.dados;
    if(!d || !d.a || !d.b || !d.b.nome) return null;
    const q = m.quando || {};
    const ano = q.ano || E.data.ano, sem = q.semana || 1, dia = q.dia || 1;
    const dt = TO.estado.dataDaSemana(ano, sem, dia);
    const proxima = filaDe((dt.getDate() + dt.getMonth()*31) || 1);

    const a = d.a, b = d.b;
    const nA = a.n || 0, nB = b.n || 0;
    const fA = a.caidos || 0, fB = b.caidos || 0;
    const pA = a.presos || 0, pB = b.presos || 0;
    const ganhamos = !!d.ganhamos;
    /* empate é ninguém levar a melhor: a briga aconteceu e as duas
       fichas saíram parecidas */
    const houveBriga = !d.semResistencia && (fA || fB || nA);
    const empate = houveBriga && fA === fB && !ganhamos;
    const venc = d.semResistencia ? b : empate ? null : (ganhamos ? a : b);
    const perd = d.semResistencia ? a : empate ? null : (ganhamos ? b : a);

    /* ---- a condição que manda na página ---- */
    /* "era menos" é sempre sobre o NOSSO lado — vencendo vira mérito,
       apanhando vira explicação. A conta é a mesma nos dois casos:
       antes ela vinha invertida na derrota e a briga de 10 contra 30
       saía no molde de quem apanhou de igual pra igual. */
    const emMenor = nA < nB * 0.8;
    const dif = Math.abs(fA - fB);
    const presos = pA + pB;
    const cond = d.semResistencia ? 'semLuta'
               : empate ? 'empate'
               : presos >= 4 ? 'cadeia'
               : ganhamos ? (emMenor ? 'vitoriaMenos'
                          : dif >= 3 ? 'atropelo' : 'vitoria')
               : (emMenor ? 'apanhouMenos'
                  : dif >= 3 ? 'apanhou' : 'derrota');

    /* na LNT o lugar é a fase: o campo de terra é o mesmo toda
       edição, e o que a página precisa dizer é o que estava em jogo */
    const onde = d.lnt
      ? `${naFaseLNT(d.lnt.fase)} da ${d.lnt.nomeDiv} da LNT`
      : ondeDe(d);
    const v = {
      A: venc ? venc.nome : a.nome, B: perd ? perd.nome : b.nome,
      nA: venc === b ? nB : nA, nB: venc === b ? nA : nB,
      fA: venc === b ? fB : fA, fB: venc === b ? fA : fB,
      F: fA + fB, P: presos, onde
    };
    /* "1 feridos" não existe: a palavra acompanha o número */
    v.plA = v.fA === 1 ? 'ferido' : 'feridos';

    /* ---- chapéu ---- */
    const CH = MOLDES.chapeu;
    const chapeu = d.semResistencia ? CH.semLuta[0]
                 /* o camburão passa na frente do lugar: quem foi preso
                    é a notícia, a arquibancada é só o endereço */
                 : presos >= 4 ? CH.cadeia[0]
                 : d.lnt ? CH.lnt[0]
                 : /^estadio-/.test(d.cena||'') ? CH.arquibancada[0]
                 : (cond === 'vitoriaMenos' || cond === 'apanhouMenos') ? CH.menos[0]
                 : cond === 'atropelo' ? CH.atropelo[0]
                 : CH.padrao[0];

    const manchete = encher(proxima(MOLDES.manchete[cond], 'manchete'), v);

    /* ---- olho ---- */
    const O = MOLDES.olho;
    const olho = encher(
      d.semResistencia ? O.semLuta[0]
      : empate ? O.empate[0]
      : cond === 'vitoriaMenos' ? O.menosGanhou[0]
      : cond === 'apanhouMenos' ? O.menosPerdeu[0]
      : presos ? O.comPresos[0]
      : O.completo[0], v);

    return {
      cabeca:{
        ano: ROMANO(Math.max(1, ano - 2025)),
        edicao: d.edicao || E.brigasNossasTotal || 1,
        data: `${DIA_SEM[dia]}, ${dt.getDate()} de ${MES[dt.getMonth()]}`
      },
      tarja: [
        `<b>${nA + nB}</b> na treta`,
        `<b>${fA + fB}</b> ${fA + fB === 1 ? 'ferido' : 'feridos'}`,
        `<b>${presos}</b> ${presos === 1 ? 'preso' : 'presos'}`,
        onde.replace(/^n[ao]s? /, '').replace(/^num[a]? /, '')
      ],
      chapeu, manchete, olho,
      /* o placar grande da briga é o ferido de cada lado */
      placar:{a:a.nome, ga:fA, gb:fB, b:b.nome, nossaCasa:true},
      /* O QUADRO DA NOITE, no lugar da classificação */
      quadro:{
        lados:[{nome:a.nome, nossa:true,  n:nA, feridos:fA, presos:pA},
               {nome:b.nome, nossa:false, n:nB, feridos:fB, presos:pB}],
        vencedor: venc ? venc.nome : null,
        empate
      },
      /* as outras brigas do dia, atrás do botão */
      completo: outrasBrigas(E, q, proxima)
    };
  }

  /* =======================================================
     AS OUTRAS BRIGAS DO DIA (o card aberto)
     O que o resto do país se pegou no mesmo dia, cada uma
     com a sua nota e o seu quadro curto.
     ======================================================= */
  const MOSTRA = 6;
  function outrasBrigas(E, q, proxima){
    const ano = q.ano || E.data.ano, sem = q.semana || 1, dia = q.dia || 1;
    const todas = (E.brigasIA || []).filter(x =>
      x.ano === ano && x.semana === sem && x.dia === dia);
    /* as maiores primeiro, como o resumo da semana já faz */
    const ord = todas.slice().sort((x,y)=>(y.a.n + y.b.n) - (x.a.n + x.b.n));
    const NT = MOLDES.nota;
    const condDe = x =>{
      const dif = Math.abs(x.a.feridos - x.b.feridos);
      const presos = (x.a.presos||0) + (x.b.presos||0);
      return presos >= 12 ? 'cadeia'
           : x.a.feridos === x.b.feridos ? 'empate'
           : dif >= 3 ? 'atropelo' : 'vitoria';
    };
    /* ESCOLHE PELA VARIEDADE, não só pelo tamanho (a mesma régua que a
       Gazeta usa em "pelo país"): primeiro uma de cada condição, e
       nenhuma condição entra mais vezes do que tem molde — senão seis
       brigas com camburão davam seis vezes a mesma frase. */
    const porCond = {};
    for(const x of ord) (porCond[condDe(x)] = porCond[condDe(x)] || []).push(x);
    const conds = Object.keys(porCond);
    const escolhidos = [];
    for(let volta = 0; escolhidos.length < MOSTRA && volta < 6; volta++)
      for(const c of conds){
        if(escolhidos.length >= MOSTRA) break;
        if(volta >= (NT[c] || []).length) continue;
        if(porCond[c][volta]) escolhidos.push(porCond[c][volta]);
      }
    const itens = escolhidos.map(x=>{
      const venc = x.ganhouA ? x.a : x.b, perd = x.ganhouA ? x.b : x.a;
      const presos = (x.a.presos||0) + (x.b.presos||0);
      const c = condDe(x);
      return {
        frase: encher(proxima(NT[c], 'nota-'+c),
                      {A:venc.nome, B:perd.nome, P:presos}),
        cidade: x.cidade || '',
        motivo: /×/.test(x.jogo||'') ? `na sombra de ${x.jogo}` : (x.jogo || ''),
        lados:[{nome:x.a.nome, n:x.a.n, feridos:x.a.feridos, presos:x.a.presos},
               {nome:x.b.nome, n:x.b.n, feridos:x.b.feridos, presos:x.b.presos}],
        vencedor: x.vencedor
      };
    });
    return {
      itens,
      total: ord.length,
      resto: Math.max(0, ord.length - itens.length),
      vazio: itens.length ? '' : proxima(MOLDES.vazio, 'vazio')
    };
  }


  /* =======================================================
     A LNT NO JORNAL (pedido do dono, 22/08/2026)
     A fundação e o fim de cada edição saem no mesmo esqueleto
     da Porrada, com o quadro das quatro divisões no lugar do
     quadro da noite.
     ======================================================= */
  function montarLNT(E, m){
    const d = m && m.dados;
    if(!d) return null;
    const q = m.quando || {};
    const ano = q.ano || E.data.ano, sem = q.semana || 1, dia = q.dia || 1;
    const dt = TO.estado.dataDaSemana(ano, sem, dia);
    const proxima = filaDe((dt.getDate() + dt.getMonth()*31) || 1);
    const L = MOLDES.lnt;
    const cabeca = {
      ano: ROMANO(Math.max(1, ano - 2025)),
      edicao: d.n || 1,
      data: `${DIA_SEM[dia]}, ${dt.getDate()} de ${MES[dt.getMonth()]}`
    };
    const dinheiro = v => TO.util.dinheiro(v);

    if(m.kind === 'lnt-fundacao'){
      const total = (d.divisoes||[]).reduce((s,x)=>s + x.clubes, 0);
      return {
        cabeca, especial:'A fundação da liga',
        tarja:[`<b>${total}</b> torcidas`, `<b>4</b> divisões`,
               `<b>2</b> edições por ano`, 'dez contra dez'],
        chapeu:'Nasce a liga',
        manchete: encher(proxima(L.fundacao, 'lnt-man'), {N:total}),
        olho: encher(proxima(L.fundacaoOlho, 'lnt-olho'),
                     {P:dinheiro(300000)}),
        divisoes: (d.divisoes||[]).map(x=>({
          nome:x.nome, clubes:x.clubes, minha: x.n === d.minha})),
        fora: d.fora || 0
      };
    }

    if(m.kind === 'lnt-fim'){
      const c = (d.campeoes || [])[0] || {};
      /* a página é da 1ª Divisão: quem SOBE nela é quem veio da 2ª,
         e quem DESCE é o último de cada chave dela mesma */
      const sobem = ((d.campeoes || [])[1] || {}).sobem || '';
      const nos = d.nosso && /Campeão/.test(d.nosso.fase) && d.nosso.div === 1;
      const v = {D:'1ª Divisão', A:c.campeao || '—', V:c.vice || '—',
                 S: sobem || '—', C: c.caem || '—'};
      const olho = c.caem
        ? encher(proxima(L.olhoFim, 'lnt-olho'), v)
        : encher(proxima(L.olhoFimSemDesce, 'lnt-olho'), v);
      const meu = d.nosso ? encher(proxima(L.nosso, 'lnt-nosso'),
        {F: /Campeão|Vice/.test(d.nosso.fase)
             ? `como ${d.nosso.fase.toLowerCase()}`
             : `${naFaseLNT(d.nosso.fase)}`,
         DN: d.nosso.div + 'ª'}) : '';
      return {
        cabeca, especial:`${d.semestre}º semestre de ${d.ano}`,
        tarja:[`<b>${d.n}ª</b> edição`,
               `<b>${(d.campeoes||[]).length}</b> divisões decididas`,
               d.nosso ? `nós na <b>${d.nosso.div}ª</b>` : 'nós de fora',
               d.nosso && d.nosso.premio
                 ? `<b>${dinheiro(d.nosso.premio)}</b> de prêmio` : 'sem prêmio'],
        chapeu:'Fim de LNT',
        manchete: encher(proxima(nos ? L.campeaoNos : L.campeao, 'lnt-man'), v),
        olho, meu,
        campeoes: d.campeoes || []
      };
    }
    return null;
  }
  /* "na semifinal", "nas quartas", "no 16-avos" — a preposição
     acompanha a fase, como na Gazeta */
  const FASE_LNT = {'Fase de chaves':'na fase de chaves',
                    '16-avos':'no 16-avos', 'Oitavas':'nas oitavas',
                    'Quartas':'nas quartas', 'Semifinal':'na semifinal',
                    'Final':'na final'};
  const naFaseLNT = f => FASE_LNT[f] || `na ${String(f||'').toLowerCase()}`;

  return {montar, montarLNT, MOLDES, encher, ondeDe, MOSTRA, naFaseLNT};
})();
