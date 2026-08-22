/* =========================================================
   O ALMANAQUE (pedido do dono, 21/08/2026)

   As notícias de virada de ano e de título, no mesmo layout
   de jornal da Gazeta e do Futebol e Porrada: cabeçalho,
   tarja, chapéu, manchete, olho e um quadro ao lado.

   São seis edições:
     · CAMPEÃO ......... uma por competição que o NOSSO clube
                         jogou, na hora em que o campeão sai
     · SOBE E DESCE .... quem subiu e quem caiu, na virada
     · TORCIDA DO ANO .. a 1ª do ranking no fechamento do ano
     · REI DA PISTA .... o maior saldo de brigas do ano
     · A JANELA ........ quem se reforçou, pela evolução de
                         força de um ano pro outro
     · O PATRIMÔNIO .... quem mais comprou prédio no ano

   NADA É ESCRITO NA HORA. Toda frase sai de um molde
   submetido ao crivo do dono, preenchido com o que o ano já
   sabe. A FOTO DO ANO é tirada no primeiro dia de cada ano
   (`E.almanaque`) e é contra ela que a virada compara.
   ========================================================= */
window.TO = window.TO || {};

TO.almanaque = (function(){
  const M = ()=>TO.mundo;
  const C = ()=>TO.competicoes;

  /* quantos nomes cabem em cada quadro */
  const LINHAS = 6;

  /* =======================================================
     OS MOLDES (submetidos ao crivo do dono, 21/08/2026)
     ======================================================= */
  const MOLDES = {
    campeao:{
      chapeu:{
        nosso:  ['É NOSSO'],
        rival:  ['A taça ficou com eles'],
        outros: ['Deu campeão']
      },
      manchete:{
        nosso:  ['{A} é campeão e a festa é nossa',
                 'Acabou: o título é do {A}',
                 '{A} levanta a taça {comp}'],
        rival:  ['{A} levanta a taça e a gente engole',
                 'Deu {A}, e não dá pra fingir que não doeu'],
        outros: ['{A} fatura {compO}',
                 '{A} é o campeão {comp}',
                 'A taça {comp} é do {A}']
      },
      olho:{
        comVice:['{A} terminou {compO} na frente de todo mundo; '+
                 'o {B} ficou com o vice.'],
        semVice:['{A} terminou {compO} na frente de todo mundo.']
      }
    },

    sobeDesce:{
      chapeu:{
        nosso:  ['O nosso clube se mexeu'],
        padrao: ['Sobe e desce']
      },
      manchete:{
        subimosNos: ['Subimos! O {A} está de volta',
                     'Acesso do {A}: a divisão é outra'],
        caimosNos:  ['O {A} caiu, e o ano que vem é embaixo',
                     'Rebaixado: o {A} desce de divisão'],
        padrao:     ['{N} clubes trocam de divisão na virada',
                     'A virada mexeu com {N} clubes']
      },
      olho:{
        comNosso:['{S} subiram e {D} desceram no país. '+
                  'O nosso clube está no meio.'],
        padrao:  ['{S} subiram e {D} desceram no país.']
      }
    },

    torcidaDoAno:{
      chapeu:{
        nossa:  ['A coroa é nossa'],
        padrao: ['Torcida do ano']
      },
      manchete:{
        nossa:  ['A {A} fecha o ano em primeiro',
                 'Ninguém segurou a {A} em {ano}'],
        padrao: ['A {A} é a torcida do ano',
                 '{ano} foi da {A}',
                 'A {A} fecha {ano} no topo do ranking']
      },
      olho:{
        comSegunda:['Fechou o ano com {P} pontos, {D} à frente da {B}.'],
        sozinha:   ['Fechou o ano com {P} pontos no ranking.']
      }
    },

    reiDaPista:{
      chapeu:{
        nossa:  ['A pista é nossa'],
        padrao: ['Rei da pista']
      },
      manchete:{
        nossa:  ['Ninguém correu com a gente em {ano}',
                 'A {A} é o rei da pista e não teve pra ninguém'],
        padrao: ['A {A} é o rei da pista de {ano}',
                 'Quem mandou na rua em {ano} foi a {A}'],
        vazio:  ['{ano} passou sem ninguém dominar a rua']
      },
      olho:{
        cheio:['{V} brigas ganhas contra {Dr} perdidas: saldo de {S} no ano.'],
        vazio:['Nenhuma torcida fechou o ano com saldo de brigas.']
      }
    },

    janela:{
      chapeu:{padrao:['A janela fechou']},
      manchete:{
        cheia:['{A} foi quem mais se reforçou',
               'O {A} montou time pra brigar lá em cima',
               '{A} chega {ano} com outro elenco'],
        magra:['A janela passou em branco pelo país']
      },
      olho:{
        cheia:['Ganhou {G} de força de um ano pro outro; '+
               'quem mais perdeu foi o {B}, com {P}.'],
        soGanho:['Ganhou {G} de força de um ano pro outro.'],
        magra:['Nenhum elenco mudou o suficiente pra virar notícia.']
      }
    },

    patrimonio:{
      chapeu:{
        nossa:  ['A obra foi nossa'],
        padrao: ['O ano da obra']
      },
      manchete:{
        cheia:['A {A} foi quem mais construiu em {ano}',
               '{ano} foi de obra na {A}',
               'A {A} abriu mais porta que ninguém'],
        magra:['Ninguém levantou tijolo em {ano}']
      },
      olho:{
        cheia:['Abriu {N} {porta} no ano e fechou com {T} no total.'],
        magra:['Nenhuma torcida do país abriu prédio novo no ano.']
      }
    }
  };

  /* ---- o motor de moldes: o mesmo da Gazeta ---- */
  function encher(molde, v){
    return String(molde||'').replace(/\{(\w+)\}/g, (t,k)=>
      v[k] === undefined || v[k] === null ? '' : String(v[k]));
  }
  const daFila = (lista, semente) =>
    (!lista || !lista.length) ? '' : lista[Math.abs(semente) % lista.length];

  const nomeTime    = id => (M().time(id)||{}).nome || id;
  const nomeTorcida = id => (M().torcida(id)||{}).nome || id;
  /* DOIS ARTIGOS, DOIS LUGARES. "a taça DO Brasileirão" e "a taça DA
     Copa" pedem a forma com de; "faturou O Brasileirão" e "terminou A
     Copa" pedem a forma sem. Um molde só dava "terminou do
     Brasileirão", que não é português. */
  const feminino = n => /^(Copa|Taça|Série|Copinha)/i.test(n||'');
  const dArt = n => !n ? 'do campeonato' : (feminino(n) ? `da ${n}` : `do ${n}`);
  const oArt = n => !n ? 'o campeonato'  : (feminino(n) ? `a ${n}`  : `o ${n}`);

  /* =======================================================
     A FOTO DO ANO
     Tirada no primeiro dia de cada ano. É contra ela que a
     virada compara — sem foto não há "no ano passado".
     ======================================================= */
  function tirarFoto(E){
    if(!E) return null;
    const predios = {}, forcas = {};
    for(const o of M().jogaveis()){
      if(o.incompleta) continue;
      predios[o.id] = prediosDe(E, o.id);
    }
    for(const id of Object.keys(E.forcas || {})) forcas[id] = E.forcas[id];
    E.almanaque = {ano:E.data.ano, predios, forcas};
    return E.almanaque;
  }

  /* prédios de uma torcida: a sede conta 1, e somam bar, loja e
     subsede — a mesma conta da coluna do ranking */
  function prediosDe(E, id){
    if(E.torcida && id === E.torcida.id){
      const pat = TO.financeiro.patrimonio(E);
      return 1 + (pat.bares||[]).length + (pat.lojas||[]).length +
                 (pat.subsedes||[]).length;
    }
    const t = (E.mundoTorcidas || {})[id];
    if(!t) return 0;
    const n = x => Array.isArray(x) ? x.length : (x ? Math.round(x) : 0);
    return 1 + n(t.bares) + n(t.lojas) + n(t.subsedes);
  }

  /* =======================================================
     AS SEIS EDIÇÕES
     Cada uma devolve o modelo da página, ou null quando não
     há notícia — e página sem notícia não sai.
     ======================================================= */

  /* 1 · CAMPEÃO — só as competições que o NOSSO clube jogou */
  function campeao(E, comp){
    if(!comp || !comp.campeao) return null;
    const meu = E.torcida.clubeId;
    const jogou = (comp.rodadas||[]).some(r =>
      r.jogos.some(j => j.c === meu || j.f === meu));
    if(!jogou) return null;

    const ano = E.data.ano;
    const A = comp.campeao, B = comp.vice;
    const nosso = A === meu;
    const rival = !nosso && B === meu;
    const cond = nosso ? 'nosso' : rival ? 'rival' : 'outros';
    const sem = (E.data.ano||0) + comp.nome.length;
    const v = {A:nomeTime(A), B: B ? nomeTime(B) : '',
               comp:dArt(comp.nome), compO:oArt(comp.nome), ano};
    const CM = MOLDES.campeao;
    return {
      ano, tipo:'campeao', tom: nosso ? 'boa' : rival ? 'ruim' : '',
      jornal:'O Almanaque', edicao:'Edição de campeão',
      chapeu: CM.chapeu[cond][0],
      manchete: encher(daFila(CM.manchete[cond], sem), v),
      olho: encher(B ? CM.olho.comVice[0] : CM.olho.semVice[0], v),
      tarja:[comp.nome, `<b>${E.data.ano}</b>`],
      quadro:{
        titulo:'O pódio',
        linhas:[{rot:'Campeão', valor:nomeTime(A), forte:true, nossa:nosso}]
          .concat(B ? [{rot:'Vice', valor:nomeTime(B), nossa: B === meu}] : [])
      }
    };
  }

  /* 2 · SOBE E DESCE — na virada do ano */
  function sobeDesce(E, mov, ano){
    if(!mov || !mov.length) return null;
    const meu = E.torcida.clubeId;
    const sobem = mov.filter(m => C().subiu(m.de, m.para));
    const caem  = mov.filter(m => !C().subiu(m.de, m.para));
    const nosso = mov.find(m => m.id === meu);
    const cond = !nosso ? 'padrao'
               : C().subiu(nosso.de, nosso.para) ? 'subimosNos' : 'caimosNos';
    const SD = MOLDES.sobeDesce;
    const v = {A: nomeTime(meu), N: mov.length,
               S: sobem.length, D: caem.length, ano};
    const linha = (m, sobe) => ({
      rot: sobe ? 'sobe' : 'cai', valor: nomeTime(m.id),
      nota: m.para, sobe, nossa: m.id === meu});
    return {
      ano, tipo:'sobeDesce', tom: !nosso ? '' :
        C().subiu(nosso.de, nosso.para) ? 'boa' : 'ruim',
      jornal:'O Almanaque', edicao:'Edição da virada',
      chapeu: nosso ? SD.chapeu.nosso[0] : SD.chapeu.padrao[0],
      manchete: encher(daFila(SD.manchete[cond], ano), v),
      olho: encher(nosso ? SD.olho.comNosso[0] : SD.olho.padrao[0], v),
      tarja:[`<b>${sobem.length}</b> subiram`, `<b>${caem.length}</b> desceram`,
             `temporada de <b>${ano}</b>`],
      quadro:{
        titulo:'Quem trocou de divisão',
        linhas:[...sobem.slice(0, LINHAS).map(m=>linha(m,true)),
                ...caem.slice(0, LINHAS).map(m=>linha(m,false))],
        resto: Math.max(0, mov.length - Math.min(sobem.length, LINHAS)
                                      - Math.min(caem.length, LINHAS))
      }
    };
  }

  /* 3 · TORCIDA DO ANO — a 1ª do ranking no fechamento */
  function torcidaDoAno(E, lista, ano){
    if(!lista || !lista.length) return null;
    const primeira = lista[0], segunda = lista[1];
    const nossa = primeira.id === E.torcida.id;
    const TA = MOLDES.torcidaDoAno;
    const v = {A: primeira.nome || nomeTorcida(primeira.id), ano,
               P: Math.round(primeira.pontos),
               B: segunda ? (segunda.nome || nomeTorcida(segunda.id)) : '',
               D: segunda ? Math.round(primeira.pontos - segunda.pontos) : 0};
    return {
      ano, tipo:'torcidaDoAno', tom: nossa ? 'boa' : '',
      jornal:'O Almanaque', edicao:'Prêmio do ano',
      chapeu: nossa ? TA.chapeu.nossa[0] : TA.chapeu.padrao[0],
      manchete: encher(daFila(TA.manchete[nossa?'nossa':'padrao'], ano), v),
      olho: encher(segunda ? TA.olho.comSegunda[0] : TA.olho.sozinha[0], v),
      tarja:[`fechamento de <b>31/12/${ano}</b>`, 'ranking geral'],
      quadro:{
        titulo:'O pódio do ranking',
        linhas: lista.slice(0, LINHAS).map((x,i)=>({
          rot:`${i+1}º`, valor: x.nome || nomeTorcida(x.id),
          nota: `${Math.round(x.pontos)} pt`,
          forte: i === 0, nossa: x.id === E.torcida.id}))
      }
    };
  }

  /* 4 · REI DA PISTA — maior saldo de brigas do ano */
  function reiDaPista(E, placar, ano){
    const RP = MOLDES.reiDaPista;
    const lista = (placar||[]).filter(x => x.saldo > 0)
                              .sort((a,b)=> b.saldo - a.saldo || b.v - a.v);
    if(!lista.length) return {
      ano, tipo:'reiDaPista', tom:'',
      jornal:'O Almanaque', edicao:'Prêmio do ano',
      chapeu: RP.chapeu.padrao[0],
      manchete: encher(RP.manchete.vazio[0], {ano}),
      olho: RP.olho.vazio[0],
      tarja:[`temporada de <b>${ano}</b>`],
      quadro:{titulo:'A rua em ' + ano, linhas:[]}
    };
    const rei = lista[0];
    const nossa = rei.id === E.torcida.id;
    const v = {A: rei.nome, ano, V: rei.v, Dr: rei.d, S: `+${rei.saldo}`};
    return {
      ano, tipo:'reiDaPista', tom: nossa ? 'boa' : '',
      jornal:'O Almanaque', edicao:'Prêmio do ano',
      chapeu: nossa ? RP.chapeu.nossa[0] : RP.chapeu.padrao[0],
      manchete: encher(daFila(RP.manchete[nossa?'nossa':'padrao'], ano), v),
      olho: encher(RP.olho.cheio[0], v),
      tarja:[`<b>${rei.v}</b> ganhas`, `<b>${rei.d}</b> perdidas`,
             `saldo <b>+${rei.saldo}</b>`],
      quadro:{
        titulo:'O saldo do ano',
        linhas: lista.slice(0, LINHAS).map((x,i)=>({
          rot:`${i+1}º`, valor:x.nome, nota:`${x.v}–${x.d} · +${x.saldo}`,
          forte: i === 0, nossa: x.id === E.torcida.id}))
      }
    };
  }

  /* 5 · A JANELA — quem se reforçou, pela evolução de força */
  function janela(E, movForca, ano){
    const JN = MOLDES.janela;
    const lista = (movForca||[]).map(m=>({id:m.id, nome:nomeTime(m.id),
                                          d: m.para - m.de, para:m.para}))
                                .filter(x=>x.d !== 0);
    const subiram = lista.filter(x=>x.d > 0).sort((a,b)=> b.d - a.d);
    const cairam  = lista.filter(x=>x.d < 0).sort((a,b)=> a.d - b.d);
    if(!subiram.length) return {
      ano, tipo:'janela', tom:'',
      jornal:'O Almanaque', edicao:'Edição da janela',
      chapeu: JN.chapeu.padrao[0],
      manchete: JN.manchete.magra[0],
      olho: JN.olho.magra[0],
      tarja:[`janela de <b>${ano}</b>`],
      quadro:{titulo:'Os elencos', linhas:[]}
    };
    const top = subiram[0], pior = cairam[0];
    const v = {A: top.nome, ano, G:`+${top.d}`,
               B: pior ? pior.nome : '', P: pior ? String(pior.d) : ''};
    return {
      ano, tipo:'janela', tom: top.id === E.torcida.clubeId ? 'boa' : '',
      jornal:'O Almanaque', edicao:'Edição da janela',
      chapeu: JN.chapeu.padrao[0],
      manchete: encher(daFila(JN.manchete.cheia, ano), v),
      olho: encher(pior ? JN.olho.cheia[0] : JN.olho.soGanho[0], v),
      tarja:[`<b>${subiram.length}</b> se reforçaram`,
             `<b>${cairam.length}</b> perderam elenco`,
             `janela de <b>${ano}</b>`],
      quadro:{
        titulo:'Quem mais mexeu no elenco',
        linhas:[...subiram.slice(0, LINHAS).map((x,i)=>({
                  rot:`+${x.d}`, valor:x.nome, nota:`força ${x.para}`,
                  sobe:true, forte: i === 0,
                  nossa: x.id === E.torcida.clubeId})),
                ...cairam.slice(0, 2).map(x=>({
                  rot:`${x.d}`, valor:x.nome, nota:`força ${x.para}`,
                  sobe:false, nossa: x.id === E.torcida.clubeId}))]
      }
    };
  }

  /* 6 · O PATRIMÔNIO — quem mais comprou prédio no ano */
  function patrimonio(E, ano){
    const PT = MOLDES.patrimonio;
    const antes = (E.almanaque && E.almanaque.predios) || {};
    const lista = [];
    for(const o of M().jogaveis()){
      if(o.incompleta) continue;
      const hoje = prediosDe(E, o.id);
      const d = hoje - (antes[o.id] != null ? antes[o.id] : hoje);
      if(d > 0) lista.push({id:o.id, nome:o.nome, d, total:hoje});
    }
    lista.sort((a,b)=> b.d - a.d || b.total - a.total);
    if(!lista.length) return {
      ano, tipo:'patrimonio', tom:'',
      jornal:'O Almanaque', edicao:'Edição do balanço',
      chapeu: PT.chapeu.padrao[0],
      manchete: encher(PT.manchete.magra[0], {ano}),
      olho: PT.olho.magra[0],
      tarja:[`balanço de <b>${ano}</b>`],
      quadro:{titulo:'As obras do ano', linhas:[]}
    };
    const top = lista[0];
    const nossa = top.id === E.torcida.id;
    const v = {A: top.nome, ano, N: top.d, T: top.total,
               porta: top.d === 1 ? 'porta' : 'portas'};
    return {
      ano, tipo:'patrimonio', tom: nossa ? 'boa' : '',
      jornal:'O Almanaque', edicao:'Edição do balanço',
      chapeu: nossa ? PT.chapeu.nossa[0] : PT.chapeu.padrao[0],
      manchete: encher(daFila(PT.manchete.cheia, ano), v),
      olho: encher(PT.olho.cheia[0], v),
      tarja:[`<b>${lista.length}</b> torcidas construíram`,
             `balanço de <b>${ano}</b>`],
      quadro:{
        titulo:'Quem mais construiu',
        linhas: lista.slice(0, LINHAS).map((x,i)=>({
          rot:`+${x.d}`, valor:x.nome, nota:`${x.total} no total`,
          sobe:true, forte: i === 0, nossa: x.id === E.torcida.id}))
      }
    };
  }

  /* =======================================================
     A VIRADA DO ANO
     Chamada de dentro do fecho da temporada, ANTES do ano
     virar de verdade: `placarDoAno` zera na virada, e o
     ranking do fechamento é o do último dia. Devolve as
     páginas na ordem em que devem cair no feed.
     ======================================================= */
  function fecharAno(E, ctx){
    const ano = (ctx && ctx.ano) || E.data.ano;
    return [
      sobeDesce(E, (ctx && ctx.sobeDesce) || [], ano),
      torcidaDoAno(E, (ctx && ctx.ranking) || [], ano),
      reiDaPista(E, (ctx && ctx.placar) || [], ano),
      janela(E, (ctx && ctx.forca) || [], ano + 1),
      patrimonio(E, ano)
    ].filter(Boolean);
  }

  /* O SALDO DE BRIGAS DO ANO QUE FECHA. O ano vem por fora de
     propósito: quando a virada chama isto, `E.data.ano` já é o ano
     novo, e o placar guardado ainda é o do ano velho. */
  function placarDoAnoTodo(E, ano){
    const alvo = ano != null ? ano : E.data.ano;
    const fora = [];
    const conta = (id, nome, p)=>{
      if(!p || p.ano !== alvo) return;
      if(!p.v && !p.d) return;
      fora.push({id, nome, v:p.v, d:p.d, saldo:p.v - p.d});
    };
    conta(E.torcida.id, E.torcida.nome, E.brigasAno);
    for(const [id, t] of Object.entries(E.mundoTorcidas || {}))
      conta(id, nomeTorcida(id), t.brigasAno);
    return fora;
  }

  return {MOLDES, encher, tirarFoto, prediosDe, LINHAS,
          fecharAno, placarDoAnoTodo,
          campeao, sobeDesce, torcidaDoAno, reiDaPista, janela, patrimonio};
})();
