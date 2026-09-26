/* =========================================================
   A GAZETA DOS SPORTS (régua do dono, 20/08/2026)

   A rodada deixou de ser uma linha corrida de placares e virou
   primeira página de jornal. Aqui mora só a LÓGICA: que molde de
   frase cada pedaço usa e o que vai pra cada pedaço. Quem desenha
   é main.js; quem guarda os jogos do dia é a própria mensagem, em
   `dados.jogos`.

   O JORNAL É DO NOSSO CLUBE (decisão do dono, 21/08/2026). A
   edição só sai em dia em que o clube da nossa torcida jogou, e
   a manchete é sempre o jogo DELE — não o do time de mais força
   da rodada. A página fecha no placar grande, com um recorte de
   três linhas da classificação ao lado: o time logo acima do
   nosso, o nosso e o logo abaixo.

   NADA É ESCRITO NA HORA. Toda frase sai de um molde aprovado
   pelo dono, preenchido com o que o jogo já sabe. Onde há mais
   de um molde pra mesma condição, eles andam numa FILA: dentro
   da mesma edição nenhum se repete, e a escolha é determinada
   pelo dia — a mesma rodada dá sempre a mesma página, o que
   importa porque a mensagem sobrevive ao save.
   ========================================================= */
window.TO = window.TO || {};

TO.gazeta = (function(){
  const M = ()=>TO.mundo;

  const COMP = ()=>TO.competicoes;
  const nome    = id => (M().time(id)||{}).nome || id;
  const estadio = id => (M().time(id)||{}).estadio || '';
  const mapaDe  = id => (M().time(id)||{}).mapa;
  const saldo   = j => Math.abs(j.gc - j.gf);
  const gols    = j => j.gc + j.gf;
  const vencedor = j => j.gc > j.gf ? j.c : j.gf > j.gc ? j.f : null;
  const perdedor = j => j.gc > j.gf ? j.f : j.gf > j.gc ? j.c : null;
  /* "{dComp}" vira "do Mineiro" e "da Copa do Nordeste", e
     "{pelComp}" vira "pelo"/"pela": a preposição sai colada no nome,
     já no idioma do jogo ("del Mineiro", "of the Mineiro"). Era
     "d{comp}" com o artigo solto, o que só funcionava em português.
     O gênero vem de dados/genero.js — era regex por aqui, e regex
     mandava "o Argentina Primera". */
  const dArt   = n => !n ? _t('a rodada') : TO.genero.o('competicao', n);
  const dComp  = n => TO.genero.d('competicao', n, _t('da rodada'));
  const pelComp = n => TO.genero.por('competicao', n, _t('pela rodada'));
  /* a fase vai com o nome original pro gênero achar a tradução, e só
     depois desce pra minúscula — em português dá o mesmo texto */
  const naFase = f => {
    const b = String(f || '').toLowerCase();
    if(!b) return _t('na fase');
    if(b === 'grupos') return _t('na fase de grupos');
    return TO.genero.em('fase', String(f)).toLowerCase();
  };
  /* quem passou, num jogo decidido na marca da cal. `temPen` existe
     porque save antigo guarda `pen` como sim/não, e não como placar */
  const temPen = j => !!(j && j.pen && j.pen.c != null && j.pen.f != null);
  const passou = j => !temPen(j) ? null : (j.pen.c > j.pen.f ? j.c : j.f);
  const caiu   = j => !temPen(j) ? null : (j.pen.c > j.pen.f ? j.f : j.c);
  /* ESTÁDIO TEM GÊNERO: é "na Arena Castelão" e "no Maracanã". A lista
     dos 76 está em dados/genero.js; o palpite de antes errava a Joia
     da Princesa e a Moça Bonita.
     E `NoEst` COLAVA UM N NA CRASE: `N` + `na` dava "Nna Arena
     Castelão" no molde da praça. Agora é o mesmo texto com a primeira
     letra em maiúscula. */
  const artEst = e => !e ? '' : TO.genero.artigo('em', 'estadio', e);
  const noEst  = e => e ? TO.genero.em('estadio', e) : '';
  const NoEst  = e => { const t = noEst(e); return t && t[0].toUpperCase() + t.slice(1); };

  const MES = ['janeiro','fevereiro','março','abril','maio','junho','julho',
               'agosto','setembro','outubro','novembro','dezembro'];
  const DIA_SEM = ['','Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  const ROMANO = n => ['','I','II','III','IV','V','VI','VII','VIII','IX','X',
                       'XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'][n] || n;

  /* =======================================================
     OS MOLDES (aprovados pelo dono, 20/08/2026)
     Cada lista é uma fila: dentro da edição a próxima frase da
     mesma condição é a de baixo, e no fim volta pro começo.
     ======================================================= */
  const MOLDES = {
    /* 1 · chapéu — condição única, não alterna */
    chapeu:{
      goleada:  [_t('A maior goleada do dia')],
      decisao:  [_t('Dia de decisão')],
      classico: [_t('Clássico na nossa praça')],
      semana:   [_t('Rodada do meio de semana')],
      padrao:   [_t('O jogo do dia')]
    },
    /* 2 · manchete */
    manchete:{
      s5:[_t('{A} passa o rodo no {B}'),
          _t('Chuva de gols do {A} sobre o {B}'),
          _t('{A} faz {gA} no {B} e não toma nenhum')],
      s4:[_t('{A} atropela o {B}'),
          _t('{A} passeia sobre o {B}')],
      s3:[_t('{A} passa fácil pelo {B}'),
          _t('{A} não dá chance ao {B}'),
          _t('{A} resolve cedo contra o {B}')],
      s2:[_t('{A} bate o {B} com autoridade'),
          _t('{A} vence o {B} sem apuros')],
      s1fora:[_t('{A} vence fora e leva os pontos do {B}'),
              _t('{A} arranca a vitória na casa do {B}')],
      s1casa:[_t('{A} bate o {B} no sufoco'),
              _t('{A} leva a melhor num jogo de detalhe')],
      empate:[_t('{c} e {f} empatam num jogo de {G} gols'),
              _t('{c} e {f} dividem os pontos')],
      zero:[_t('{c} e {f} ficam no zero'),
            _t('Nem {c} nem {f}: o dia foi de zero a zero')],
      mata:[_t('{A} elimina o {B} e passa {naFase}')],
      /* PÊNALTI TEM DE DIZER QUE FOI PÊNALTI, E QUEM PASSOU (crivo do
         dono, 22/08/2026): antes o jogo caía no molde de empate e a
         notícia contava o 1 a 1 sem falar da disputa nem da vaga. */
      penaltis:[_t('{A} passa pelo {B} nos pênaltis'),
                _t('{A} elimina o {B} na marca da cal'),
                _t('Nos pênaltis, o {A} tira o {B} do caminho')]
    },
    /* 3 · olho da manchete */
    olho:{
      comEstadio:[_t('{gA} a {gB} {noEst}, o placar mais largo desta rodada {dComp}.')],
      semEstadio:[_t('{gA} a {gB}, o placar mais largo desta rodada {dComp}.')],
      diaCheio:[_t('{gA} a {gB} {noEst}, num dia de {N} jogos e {Gdia} gols.')],
      empate:[_t('Ficou no {gA} a {gB} {noEst}, pela {rod}ª rodada {dComp}.')],
      mata:[_t('{gA} a {gB} {noEst}, {naFase} {dComp}.')],
      penaltis:[_t('Empate em {gA} a {gB} {noEst} e {pA} a {pB} na marca da cal: quem segue {naFase} {dComp} é o {A}.')]
    },
    /* ---------------------------------------------------
       DAQUI PRA BAIXO: as seções que só aparecem com o
       jornal completo aberto (botão da mensagem).
       --------------------------------------------------- */
    /* 4 · na nossa praça */
    praca:{
      um:[_t('O {A} recebeu o {B} e o placar fechou em {gA} × {gB} {noEst}.'),
          _t('{NoEst}, {A} e {B} fecharam em {gA} × {gB}.')],
      dois:[_t('Dois jogos na cidade: {l1} e {l2}.')],
      nenhum:[_t('Sem outro jogo na nossa praça nesta rodada.'),
              _t('A cidade ficou quieta: nenhum outro jogo por aqui.')]
    },
    /* 5 · a caixa do nosso jogo */
    nossa:{
      vitoriaFora:[_t('Vitória fora de casa, {pelComp}.')],
      vitoriaCasa:[_t('Vitória em casa, na {rod}ª rodada {dComp}.')],
      empate:[_t('Empate na {rod}ª rodada {dComp}.')],
      derrota:[_t('Derrota na {rod}ª rodada {dComp}.')],
      goleadaPro:[_t('Goleada nossa, {pelComp}.')],
      goleadaContra:[_t('Baile do {adv}, {pelComp}.')],
      passouPen:[_t('Classificados nos pênaltis, {naFase} {dComp}.')],
      caiuPen:[_t('Eliminados nos pênaltis, {naFase} {dComp}.')],
      naoJogou:[_t('Não joga hoje')]
    },
    /* 6 · pelo país */
    nota:{
      s4:[_t('Goleada sem sustos.'),
          _t('Passeio do {A} de ponta a ponta.'),
          _t('O {B} não apareceu em campo.')],
      s3:[_t('Resolvido antes do intervalo.'),
          _t('Três de vantagem e nenhum susto no fim.')],
      s2:[_t('Vitória tranquila do {A}.'),
          _t('O {A} controlou o jogo sem apertar.')],
      s1fora:[_t('O visitante levou os pontos de fora.'),
              _t('O {A} calou a casa do {B}.')],
      s1casa:[_t('Vitória em casa, no sufoco.'),
              _t('O {A} segurou a vantagem até o apito.')],
      empate:[_t('Os dois marcaram e nenhum levou.')],
      zero:[_t('Empate travado, sem quem levasse a melhor.'),
            _t('Zero a zero de jogo amarrado.')],
      penaltis:[_t('Decidido na marca da cal: o {A} passou.'),
                _t('Empate no tempo normal, vaga do {A} nos pênaltis.')]
    }
  };

  /* preenche as lacunas de um molde */
  function encher(molde, v){
    return String(molde).replace(/\{(\w+)\}/g, (t, k)=> v[k] != null ? v[k] : t);
  }

  /* =======================================================
     A FILA DOS MOLDES
     Um contador por condição, dentro da edição: a primeira nota
     de goleada usa o molde 0, a segunda o 1, a terceira o 2 e a
     quarta volta pro 0. O ponto de partida vem do dia, então a
     mesma rodada dá sempre a mesma página.
     ======================================================= */
  function filaDe(semente){
    const usados = {};
    return (lista, chave)=>{
      if(!lista || !lista.length) return '';
      const k = chave || lista[0];
      if(usados[k] === undefined) usados[k] = semente % lista.length;
      const i = usados[k] % lista.length;
      usados[k]++;
      return lista[i];
    };
  }

  /* =======================================================
     A MONTAGEM
     ======================================================= */
  function montar(E, m){
    const d = m && m.dados;
    if(!d || !(d.jogos||[]).length) return null;
    const jogos = d.jogos;
    const q = m.quando || {};
    const ano = q.ano || E.data.ano, sem = q.semana || 1, dia = q.dia || 1;
    const dt = TO.estado.dataDaSemana(ano, sem, dia);
    const proxima = filaDe((dt.getDate() + dt.getMonth()*31) || 1);

    const totalGols = jogos.reduce((s,j)=>s+gols(j), 0);
    const comps = [];
    for(const j of jogos) if(j.comp && !comps.includes(j.comp)) comps.push(j.comp);

    /* =====================================================
       A MANCHETE É O NOSSO JOGO (decisão do dono, 21/08/2026)

       A régua antiga escolhia a capa pela FORÇA dos times da
       rodada. Não escolhe mais: a capa é o jogo do clube da
       nossa torcida, e a edição nem sai em dia que ele não
       jogou — quem monta a mensagem já garante isso.
       ===================================================== */
    const nosso = d.nosso || null;
    if(!nosso) return null;
    const topo = nosso;

    /* clássico é o jogo entre dois times da MESMA praça */
    const ehClassico = mapaDe(topo.c) === mapaDe(topo.f);
    /* os outros jogos da nossa cidade: matéria da página completa */
    const praca = jogos.filter(j => mapaDe(j.c) === E.torcida.mapa &&
                                    !(j.c===nosso.c && j.f===nosso.f));

    /* ---- chapéu ---- */
    const CH = MOLDES.chapeu;
    const chapeu = topo.fase ? CH.decisao[0]
                 : saldo(topo) >= 3 ? CH.goleada[0]
                 : ehClassico ? CH.classico[0]
                 : (dia >= 1 && dia <= 5) ? CH.semana[0]
                 : CH.padrao[0];

    /* ---- manchete ---- */
    /* NO JOGO DE PÊNALTI QUEM VENCE NÃO É QUEM FEZ MAIS GOL: no tempo
       normal ninguém venceu. Quem ocupa o lugar de {A} é quem PASSOU —
       senão a manchete falava de um empate e a vaga sumia da notícia. */
    const A = temPen(topo) ? passou(topo) : vencedor(topo);
    const B = temPen(topo) ? caiu(topo)   : perdedor(topo);
    const vTopo = {A: A?nome(A):'', B: B?nome(B):'',
                   c: nome(topo.c), f: nome(topo.f),
                   gA: Math.max(topo.gc, topo.gf), gB: Math.min(topo.gc, topo.gf),
                   G: gols(topo),
                   fase: topo.fase ? TO.genero.o('fase', topo.fase) : '',
                   naFase: naFase(topo.fase),
                   pA: temPen(topo) ? Math.max(topo.pen.c, topo.pen.f) : '',
                   pB: temPen(topo) ? Math.min(topo.pen.c, topo.pen.f) : '',
                   comp: dArt(topo.comp), rod: topo.rod,
                   dComp: dComp(topo.comp), pelComp: pelComp(topo.comp),
                   est: estadio(topo.c), noEst: noEst(estadio(topo.c)),
                   N: jogos.length, Gdia: totalGols};
    const H = MOLDES.manchete;
    const forceD = temPen(topo) ? 'penaltis'
      : !A ? (gols(topo) ? 'empate' : 'zero')
      : topo.fase ? 'mata'
      : saldo(topo) >= 5 ? 's5' : saldo(topo) === 4 ? 's4'
      : saldo(topo) === 3 ? 's3' : saldo(topo) === 2 ? 's2'
      : (A === topo.f ? 's1fora' : 's1casa');
    const manchete = encher(proxima(H[forceD], 'manchete'), vTopo);

    /* ---- olho ---- */
    const O = MOLDES.olho;
    const olho = encher(
      temPen(topo) ? O.penaltis[0]
      : topo.fase ? O.mata[0]
      : !A ? O.empate[0]
      : !estadio(topo.c) ? O.semEstadio[0]
      : jogos.length >= 8 && saldo(topo) < 3 ? O.diaCheio[0]
      : O.comEstadio[0], vTopo);

    /* ---- e o cabeçalho ---- */
    return {
      cabeca:{
        ano: ROMANO(Math.max(1, ano - 2025)),
        edicao: (E.data.absoluto || 0) + 100,
        data: _t('{dia}, {n} de {mes}', {dia:_t(DIA_SEM[dia]), n:dt.getDate(),
                                          mes:_t(MES[dt.getMonth()])})
      },
      tarja: [
        _tn(jogos.length, '<b>{n}</b> jogo', '<b>{n}</b> jogos'),
        _tn(comps.length, '<b>{n}</b> competição', '<b>{n}</b> competições'),
        _tn(totalGols, '<b>{n}</b> gol', '<b>{n}</b> gols'),
        ...comps.slice(0,2).map(c=>{
          const j = jogos.find(x=>x.comp===c);
          return j.fase ? `${c} · <b>${_t(j.fase)}</b>`
                        : _t('{comp} · <b>{n}ª</b> rodada', {comp:c, n:j.rod});
        })
      ],
      chapeu, manchete, olho,
      placar:{a:nome(topo.c), ga:topo.gc, gb:topo.gf, b:nome(topo.f),
              nossaCasa: topo.c === E.torcida.clubeId,
              nossaFora: topo.f === E.torcida.clubeId},
      tabela: recorteDaTabela(E, nosso),
      /* O JORNAL COMPLETO FICA PENDURADO (pedido do dono, 21/08/2026):
         a mensagem abre enxuta e o botão "Mostrar jornal completo"
         solta o resto da página — as seções de antes, com os mesmos
         moldes. Sai na mesma passada porque a fila de moldes tem de
         ser a mesma: a edição é uma só, aberta ou fechada. */
      completo: paginaCheia(E, {jogos, nosso, topo, dia, proxima, praca})
    };
  }

  /* =======================================================
     O RESTO DA PÁGINA (o jornal de 20/08/2026, agora atrás
     do botão "Mostrar jornal completo")
     ======================================================= */
  function paginaCheia(E, ctx){
    const {jogos, nosso, topo, proxima, praca} = ctx;
    /* A RÉGUA DA COLUNA "PELO PAÍS" (régua do dono, 20/08/2026): as
       notas do país saem pelos times de mais FORÇA, com a NOSSA
       divisão na frente. A manchete não usa mais isso — ela é o nosso
       jogo —, mas a coluna continua na régua de antes.
       SEM try/catch: se a API de força não existir, é pra quebrar
       alto, e não sair ordenando pelo saldo às escondidas. */
    const forca = id => COMP().forcaDe(E, id) || 0;
    const divDe = id => COMP().forcaDivisao(E, id);
    const meuDiv = divDe(E.torcida.clubeId);
    const daNossaDiv = j => meuDiv > 0 &&
      (divDe(j.c) === meuDiv || divDe(j.f) === meuDiv) ? 0 : 1;
    const peso = j => Math.max(forca(j.c), forca(j.f));
    const pesoTotal = j => forca(j.c) + forca(j.f);
    const naCapa = (a,b) =>
      daNossaDiv(a) - daNossaDiv(b) ||
      peso(b) - peso(a) ||
      pesoTotal(b) - pesoTotal(a) ||
      saldo(b) - saldo(a) || gols(b) - gols(a);

    /* ---- na nossa praça ---- */
    const P = MOLDES.praca;
    let textoPraca;
    if(praca.length >= 2){
      const l = j => `${nome(j.c)} ${j.gc} × ${j.gf} ${nome(j.f)}`;
      textoPraca = encher(P.dois[0], {l1:l(praca[0]), l2:l(praca[1])});
    } else if(praca.length === 1){
      const j = praca[0];
      const est = estadio(j.c);
      /* sem estádio o molde perde o " {noEst}" — as traduções do
         primeiro molde guardam o marcador com o espaço antes */
      const molde = est ? proxima(P.um, 'praca') : P.um[0].replace(' {noEst}','');
      textoPraca = encher(molde, {A:nome(j.c), B:nome(j.f), gA:j.gc, gB:j.gf,
                                  noEst:noEst(est), NoEst:NoEst(est)});
    } else {
      textoPraca = proxima(P.nenhum, 'pracaVazia');
    }

    /* ---- a caixa do nosso jogo ---- */
    const NS = MOLDES.nossa;
    let caixa = null;
    if(nosso){
      const meu = E.torcida.clubeId;
      const emCasa = nosso.c === meu;
      const meus = emCasa ? nosso.gc : nosso.gf;
      const deles = emCasa ? nosso.gf : nosso.gc;
      const adv = nome(emCasa ? nosso.f : nosso.c);
      /* na chave decidida nos pênaltis o que conta é a vaga, e não o
         empate: "Empate na 3ª rodada" numa eliminatória não diz nada */
      const passamos = temPen(nosso) ? passou(nosso) === meu : null;
      const cond = temPen(nosso) ? (passamos ? 'passouPen' : 'caiuPen')
                 : meus - deles >= 3 ? 'goleadaPro'
                 : deles - meus >= 3 ? 'goleadaContra'
                 : meus > deles ? (emCasa ? 'vitoriaCasa' : 'vitoriaFora')
                 : meus < deles ? 'derrota' : 'empate';
      caixa = {
        placar: temPen(nosso)
          ? _t('{placar} ({a} × {b} nos pênaltis)', {placar:
              `${nome(nosso.c)} ${nosso.gc} × ${nosso.gf} ${nome(nosso.f)}`,
              a:nosso.pen.c, b:nosso.pen.f})
          : `${nome(nosso.c)} ${nosso.gc} × ${nosso.gf} ${nome(nosso.f)}`,
        sob: encher(NS[cond][0], {comp:dArt(nosso.comp), rod:nosso.rod, adv,
                                  dComp:dComp(nosso.comp), pelComp:pelComp(nosso.comp),
                                  naFase:naFase(nosso.fase)}),
        bom: temPen(nosso) ? !!passamos : meus > deles,
        ruim: temPen(nosso) ? !passamos : meus < deles
      };
    } else {
      caixa = {placar: NS.naoJogou[0], sob:'', bom:false, ruim:false};
    }
    caixa.tabela = tabelaNossa(E, nosso);

    /* ---- pelo país: de duas a quatro notas ---- */
    const NT = MOLDES.nota;
    const sobra = jogos.filter(j => j !== topo &&
      !praca.includes(j) && !(nosso && j.c===nosso.c && j.f===nosso.f));
    const condDe = j =>{
      if(temPen(j)) return 'penaltis';
      const a = vencedor(j);
      return !a ? (gols(j) ? 'empate' : 'zero')
        : saldo(j) >= 4 ? 's4' : saldo(j) === 3 ? 's3' : saldo(j) === 2 ? 's2'
        : (a === j.f ? 's1fora' : 's1casa');
    };
    /* ESCOLHE PELA VARIEDADE, não só pelo saldo: quatro jogos na mesma
       condição davam quatro notas do mesmo par de moldes, e a coluna
       saía repetindo. Primeiro um de cada condição, na ordem de saldo;
       só depois é que se repete condição pra completar as quatro. */
    const porCond = {};
    for(const j of sobra.slice().sort(naCapa)){   // a mesma régua da capa
      const c = condDe(j);
      (porCond[c] = porCond[c] || []).push(j);
    }
    const conds = Object.keys(porCond)
      .sort((a,b)=> naCapa(porCond[a][0], porCond[b][0]));
    /* e NENHUMA condição entra mais vezes do que tem molde: `empate`
       tem um só, então dois empates dariam a mesma frase duas vezes.
       Faltando nota pra fechar quatro, sai com três — o dono aprovou
       "de duas a quatro". */
    const escolhidos = [];
    for(let volta = 0; escolhidos.length < 4 && volta < 6; volta++)
      for(const c of conds){
        if(escolhidos.length >= 4) break;
        if(volta >= (NT[c] || []).length) continue;
        if(porCond[c][volta]) escolhidos.push(porCond[c][volta]);
      }
    const notas = escolhidos.map(j=>{
      const cond = condDe(j);
      const a = temPen(j) ? passou(j) : vencedor(j);
      const b = temPen(j) ? caiu(j)   : perdedor(j);
      const pl = `${nome(j.c)} ${j.gc} × ${j.gf} ${nome(j.f)}`;
      return {placar: temPen(j)
                ? _t('{placar} ({a} × {b} pên.)', {placar:pl, a:j.pen.c, b:j.pen.f}) : pl,
              frase: encher(proxima(NT[cond], 'nota-'+cond),
                {A: a?nome(a):'', B: b?nome(b):''})};
    });

    /* ---- o placar completo, com o CORTE (pedido do dono) ---- */
    const corte = placarCortado(E, jogos, nosso, topo);

    return {praca:textoPraca, nossa:caixa, notas,
            cidade: (M().cidade(E.torcida.mapa)||{}).nome || '',
            placares: corte.grupos, resto: corte.resto,
            /* SEM COLUNA VAZIA: sem jogo na praça a primeira coluna
               ficaria com uma caixinha e um palmo de papel em branco */
            magra: !praca.length,
            classificacao: classificacao(E)};
  }

  /* =======================================================
     O CORTE DO PLACAR COMPLETO (pedido do dono, 20/08/2026)
     A coluna não leva mais a rodada inteira: leva as
     competições que interessam — a nossa primeiro, depois as
     dos jogos em destaque — até encher a coluna. O que sobra
     vira a nota de pé e vai pro Ver Competições.
     ======================================================= */
  const LINHAS = 10;
  function placarCortado(E, jogos, nosso, topo){
    const ordem = [];
    const por = {};
    for(const j of jogos){
      /* `k` agrupa e é o título da coluna: já nasce no idioma */
      const k = j.fase ? `${j.comp} · ${_t(j.fase)}`
                       : _t('{comp} · {n}ª rodada', {comp:j.comp, n:j.rod});
      if(!por[k]){ por[k] = []; ordem.push({k, comp:j.comp}); }
      por[k].push(j);
    }
    /* a prioridade: a competição do nosso jogo, depois a da manchete,
       depois as demais na ordem em que apareceram */
    const peso = g => (nosso && g.comp === nosso.comp) ? 0
                    : (g.comp === topo.comp) ? 1 : 2;
    ordem.sort((a,b)=> peso(a) - peso(b));

    const grupos = [];
    let cabem = LINHAS, fora = 0;
    for(const g of ordem){
      const lista = por[g.k];
      if(cabem <= 0){ fora += lista.length; continue; }
      const leva = lista.slice(0, cabem);
      fora += lista.length - leva.length;
      cabem -= leva.length;
      grupos.push({titulo:g.k, jogos:leva.map(j=>({
        casa:nome(j.c), fora:nome(j.f), gc:j.gc, gf:j.gf,
        nossa: !!(nosso && j.c===nosso.c && j.f===nosso.f),
        goleada: saldo(j) >= 3
      }))});
    }
    return {grupos, resto:fora};
  }

  /* =======================================================
     A CLASSIFICAÇÃO DA NOSSA DIVISÃO (pedido do dono, 20/08/2026)
     A faixa de baixo do jornal traz sempre a tabela da divisão
     em que o NOSSO clube joga — e, quando a competição tem
     grupos (a Série D tem), só o grupo em que ele está.

     Resumida: as oito primeiras linhas. Se o nosso clube não
     estiver entre elas, as seis primeiras mais a vizinhança
     dele, com um risco no meio pra marcar o salto.
     ======================================================= */
  const TOPO_TABELA = 8;
  function classificacao(E){
    try{
      const meu = E.torcida.clubeId;
      const div = COMP().divisaoDe(E, M().time(meu) || {});
      const rodou = c => (c.rodadas||[]).some(r =>
        r.jogos.some(j => j.gc != null && (j.c===meu || j.f===meu)));
      const todas = E.temporada.competicoes || [];
      /* O NACIONAL COMEÇA NO MEIO DO ANO: até lá a divisão do clube
         existe no papel mas não tem bola rolada, e a faixa ficaria
         vazia. Nesses meses ela mostra o campeonato que ele ESTÁ
         jogando — o estadual, o regional —, que é a classificação que
         interessa ao leitor naquele momento. */
      /* quantas rodadas o clube já cumpriu em cada competição: o
         desempate do fallback é a que ele está jogando AGORA, não a
         que tem mais rodadas no papel */
      const cumpriu = c => (c.rodadas||[]).reduce((n,r)=>
        n + (r.jogos.some(j=>j.gc!=null && (j.c===meu||j.f===meu)) ? 1 : 0), 0);
      const comp = (todas.find(c => c.nome === div && rodou(c)))
                || todas.filter(rodou).sort((a,b)=> cumpriu(b) - cumpriu(a))[0];
      if(!comp) return null;
      /* Série D joga em grupos: só o grupo dele interessa */
      let grupo, rot = comp.nome;
      if(comp.grupos && comp.grupos.length > 1){
        grupo = comp.grupos.findIndex(g => g.indexOf(meu) >= 0);
        if(grupo < 0) grupo = undefined;
        else rot = _t('{comp} · Grupo {g}', {comp:rot, g:String.fromCharCode(65 + grupo)});
      }
      const t = COMP().tabela(comp, grupo);
      if(!t.length || !t.some(l => l.j)) return null;
      const eu = t.findIndex(l => l.id === meu);
      const linha = (l, i) => ({pos:i+1, nome:nome(l.id), j:l.j, p:l.p,
                               sg:l.sg, nossa:l.id === meu});
      let linhas;
      if(eu < TOPO_TABELA){
        linhas = t.slice(0, TOPO_TABELA).map(linha);
      } else {
        linhas = t.slice(0, TOPO_TABELA - 2).map(linha);
        linhas.push({salto:true});
        for(let i = Math.max(0, eu-1); i <= Math.min(t.length-1, eu+1); i++)
          linhas.push(linha(t[i], i));
      }
      return {rot, linhas, total:t.length};
    }catch(x){ return null; }
  }

  /* a tabela é a do campeonato que o clube joga HOJE — pegar a
     primeira da temporada mostrava "0 pontos em 0 jogos" */
  function tabelaNossa(E, nosso){
    try{
      const meu = E.torcida.clubeId;
      const alvo = nosso && nosso.comp;
      const comp = (E.temporada.competicoes||[]).find(c=>
        (alvo ? c.nome === alvo : true) &&
        (c.rodadas||[]).some(r=>r.jogos.some(j=>j.c===meu || j.f===meu)));
      if(!comp) return null;
      const t = COMP().tabela(comp);
      const i = t.findIndex(x=>x.id === meu);
      if(i < 0 || !t[i].j) return null;
      return _t('{comp} · <b>{pos}º</b> lugar · {pontos} em {jogos}', {comp:comp.nome, pos:i+1,
        pontos:_tn(t[i].p, '<b>{n}</b> ponto', '<b>{n}</b> pontos'),
        jogos:_tn(t[i].j, '{n} jogo', '{n} jogos')});
    }catch(x){ return null; }
  }

  /* =======================================================
     O RECORTE DA CLASSIFICAÇÃO (pedido do dono, 21/08/2026)
     Ao lado da manchete, SETE linhas com o nosso clube no
     centro (régua do dono, 21/08/2026). Nas pontas não há
     três vizinhos de cada lado, então a janela desliza pra
     dentro e continua com sete: do 1º ao 4º lugar ela mostra
     sempre os sete primeiros, e nas quatro últimas posições
     sempre os sete últimos.

     A tabela é sempre a da divisão em que o nosso clube joga,
     e na Série D só o grupo dele. O NACIONAL COMEÇA NO MEIO DO
     ANO: até lá a divisão existe no papel mas não tem bola
     rolada, e o recorte mostra o campeonato que ele ESTÁ
     jogando — o estadual, o regional.
     ======================================================= */
  const RECORTE = 7;
  /* quantos vizinhos de cada lado, com o nosso no centro */
  const LADO = (RECORTE - 1) / 2;
  /* A TABELA DA COMPETIÇÃO DA MANCHETE (correção do dono, 21/09/2026):
     "a classificação deve ser conforme a notícia da manchete" — a
     capa falava do empate na Sul-Americana e o recorte ao lado
     mostrava o Brasileirão. Dado o nome da competição do jogo de capa,
     devolve a tabela DELA: liga ou estadual pela tabela da temporada
     (no grupo do nosso clube, se há grupos); Libertadores e
     Sul-Americana pelo grupo do torneio real em `E.conmebol`, que a
     sombra na agenda não guarda. Competição sem tabela (Copa do
     Brasil, mata-mata seco) devolve null e a manchete sai sozinha. */
  function tabelaDaCompeticao(E, nomeComp){
    const meu = E.torcida.clubeId;
    const todas = E.temporada.competicoes || [];
    const comp = todas.find(c => c.nome === nomeComp);
    if(!comp) return null;
    if(comp.deFora || comp.tipo === 'copa-de-fora'){
      const CM = E.conmebol || {};
      const R = comp.nome === 'Copa Libertadores' ? CM.libertadores
              : comp.nome === 'Copa Sul-Americana' ? CM.sulamericana : null;
      const ig = R && R.grupos ? R.grupos.findIndex(g => g.includes(meu)) : -1;
      if(!R || ig < 0 || !R.tabela || !R.tabela[ig] || !TO.ligas) return {rot:comp.nome, t:[]};
      const t = TO.ligas.ordenar(R.tabela[ig], R.grupos[ig])
        .map(l => ({id:l.id, j:l.j, p:l.p, sg:l.gp - l.gc}));
      return {rot:_t('{comp} · Grupo {g}', {comp:comp.nome, g:String.fromCharCode(65 + ig)}), t};
    }
    let grupo, rot = comp.nome;
    if(comp.grupos && comp.grupos.length > 1){
      grupo = comp.grupos.findIndex(g => g.indexOf(meu) >= 0);
      if(grupo < 0) grupo = undefined;
      else rot = _t('{comp} · Grupo {g}', {comp:rot, g:String.fromCharCode(65 + grupo)});
    }
    return {rot, t: COMP().tabela(comp, grupo)};
  }
  function recorteDaTabela(E, nosso){
    try{
      const meu = E.torcida.clubeId;
      let t, rot;
      /* a competição da manchete manda; sem ela (save antigo, mensagem
         sem `comp`), a divisão do clube, como era */
      const daCapa = nosso && nosso.comp ? tabelaDaCompeticao(E, nosso.comp) : null;
      if(daCapa){
        t = daCapa.t; rot = daCapa.rot;
        if(!t.length || !t.some(l => l.j)) return null;
      } else {
        const div = COMP().divisaoDe(E, M().time(meu) || {});
        const rodou = c => (c.rodadas||[]).some(r =>
          r.jogos.some(j => j.gc != null && (j.c===meu || j.f===meu)));
        const todas = E.temporada.competicoes || [];
        /* o desempate do fallback é a que ele está jogando AGORA, não a
           que tem mais rodadas no papel */
        const cumpriu = c => (c.rodadas||[]).reduce((n,r)=>
          n + (r.jogos.some(j=>j.gc!=null && (j.c===meu||j.f===meu)) ? 1 : 0), 0);
        const comp = (todas.find(c => c.nome === div && rodou(c)))
                  || todas.filter(rodou).sort((a,b)=> cumpriu(b) - cumpriu(a))[0];
        if(!comp) return null;
        let grupo; rot = comp.nome;
        if(comp.grupos && comp.grupos.length > 1){
          grupo = comp.grupos.findIndex(g => g.indexOf(meu) >= 0);
          if(grupo < 0) grupo = undefined;
          else rot = _t('{comp} · Grupo {g}', {comp:rot, g:String.fromCharCode(65 + grupo)});
        }
        t = COMP().tabela(comp, grupo);
        if(!t.length || !t.some(l => l.j)) return null;
      }
      const eu = t.findIndex(l => l.id === meu);
      if(eu < 0) return null;
      /* a janela de sete, empurrada pra dentro nas pontas: o clamp
         resolve as duas regras do dono de uma vez — nas quatro
         primeiras posições ela encosta em 0 (sete primeiros) e nas
         quatro últimas encosta no fim (sete últimos) */
      const ini = Math.max(0, Math.min(eu - LADO, t.length - RECORTE));
      const linhas = t.slice(ini, ini + RECORTE).map((l, i)=>({
        pos: ini + i + 1, nome: nome(l.id), j:l.j, p:l.p, sg:l.sg,
        nossa: l.id === meu
      }));
      return {rot, linhas, total:t.length};
    }catch(x){ return null; }
  }

  return {montar, MOLDES, encher, recorteDaTabela, RECORTE,
          LINHAS, classificacao, TOPO_TABELA};
})();
