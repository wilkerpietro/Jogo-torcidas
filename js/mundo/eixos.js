/* =========================================================
   EIXOS DE ALIANÇA — os clãs (pedido do dono, 11/09/2026)

   Um eixo é um grupo de torcidas aliadas entre si. Entrar num eixo
   faz a torcida ALIADA de todas as do eixo e RIVAL dos maiores
   rivais de todas. As torcidas de IA buscam fortalecer o eixo
   recrutando quem faz sentido — aliada de alguém de dentro, não
   rival de ninguém de dentro e não maior rival de ninguém —, e
   grupos de aliadas sem eixo fundam eixos novos, com nome da lista.
   Cada torcida cabe em no máximo dois eixos.
   ========================================================= */
window.TO = window.TO || {};

TO.eixos = (function(){
  const U = TO.util;
  const M = () => TO.mundo;
  const R = () => TO.relacoes;

  const MAX_POR_TORCIDA = 2;
  const ALIADO_AO_ENTRAR = 45;     // o valor inicial de "Aliado" da fonte
  const RIVAL_AO_ENTRAR  = -45;    // o de "Rival"
  const RECRUTA_CADA_DIAS = 15;    // cada eixo convida uma vez a cada 15 dias (dono, 11/09/2026)
  const PROPOSTA_CADA    = 13;     // ...mas o eixo NOSSO só põe um nome na
                                   // mesa a cada 13 semanas: cada nome é uma
                                   // decisão nossa, e a cada 15 dias era 24
                                   // cartão por ano
  const FUNDA_CADA       = 13;     // eixo novo: quatro tentativas por ano...
  const FUNDA_CHANCE     = 0.75;   // ...três vingando (dono, 11/09/2026: aliadas
                                   // entre si fundam eixo naturalmente)
  const METADE_ALIADA    = 0.5;    // faz sentido: aliada de metade do eixo
  const RECUSA_CADA      = 26;     // semanas até o eixo convidar o dono de novo
  const MIN_FUNDADORES   = 3;
  const MAX_EM_COMUM     = 3;      // membros em comum entre um eixo novo e
                                   // qualquer outro (dono, 11/09/2026)

  function caixas(E){
    if(E.eixos) return migrar(E);
    const ids = new Set(M().jogaveis().map(o=>o.id));
    E.eixos = {
      lista: (TO.dados.eixos.base||[]).map(x=>({
        id:x.id, nome:x.nome, sigla:x.sigla||'', base:true,
        fundado:{ano:E.data.ano, semana:E.data.semana},
        membros: x.membros.filter(id=>ids.has(id))
      })),
      historico:[], recusas:{}, vetos:{}, propostas:{}, nomesUsados:[], seq:1,
      seqHist:0, vistoAte:0,
      /* as jogadas do dono: o relógio da mesa, o convite de cada eixo
         nosso e quem já disse não (dono, 11/09/2026) */
      nossos:{mesa:0, convites:{}, recusaram:{}, recusaramNos:{}}
    };
    /* os membros de nascença já são aliados entre si: onde a fonte
       deixou a relação abaixo do corte, ela sobe; nada de rivalidade
       nova aqui — isso é só pra quem ENTRA */
    for(const x of E.eixos.lista) consolidar(E, x);
    return E.eixos;
  }

  /* O SAVE ANTIGO NÃO PODE DERRUBAR O DIA (correção do dono, 11/09/2026)
     Quem começou a jogar antes de um campo existir carregava um `E.eixos`
     sem ele — e a primeira leitura (`X.vetos[...]`) estourava DENTRO do
     dia, no meio de `eventosDoDia`: o dia morria pela metade, o relógio
     não era reagendado e o jogo ficava parado sem nada pra responder.
     Aqui o caixote velho ganha os campos que faltam, e os eixos de
     nascença recebem os membros que a fonte passou a listar depois. */
  function migrar(E){
    const X = E.eixos;
    if(!Array.isArray(X.lista))     X.lista = [];
    if(!Array.isArray(X.historico)) X.historico = [];
    if(!X.recusas   || typeof X.recusas   !== 'object') X.recusas = {};
    if(!X.vetos     || typeof X.vetos     !== 'object') X.vetos = {};
    if(!X.propostas || typeof X.propostas !== 'object') X.propostas = {};
    if(!Array.isArray(X.nomesUsados)) X.nomesUsados = [];
    if(typeof X.seq      !== 'number') X.seq = X.lista.filter(x=>!x.base).length + 1;
    if(typeof X.seqHist  !== 'number') X.seqHist = X.historico.length;
    if(typeof X.vistoAte !== 'number') X.vistoAte = X.seqHist;
    if(!X.nossos || typeof X.nossos !== 'object')
      X.nossos = {mesa:0, convites:{}, recusaram:{}, recusaramNos:{}};
    X.nossos.convites     = X.nossos.convites     || {};
    X.nossos.recusaram    = X.nossos.recusaram    || {};
    X.nossos.recusaramNos = X.nossos.recusaramNos || {};
    /* os eixos de nascença acompanham a fonte: eixo novo entra inteiro,
       e membro que o dono somou depois entra no eixo que já estava no
       save — sempre respeitando o teto de eixos por torcida */
    const ids = new Set(M().jogaveis().map(o=>o.id));
    for(const base of (TO.dados.eixos.base||[])){
      const membros = (base.membros||[]).filter(id=>ids.has(id));
      let x = X.lista.find(y=>y.id === base.id), mexeu = false;
      if(!x){
        x = {id:base.id, nome:base.nome, sigla:base.sigla||'', base:true,
             fundado:{ano:E.data.ano, semana:E.data.semana}, membros:[]};
        X.lista.push(x); mexeu = true;
      }
      /* QUEM SAIU NÃO VOLTA PELA PORTA DA FONTE (correção do dono,
         21/09/2026): "Jovem Chape saiu do União Punho Cruzado" e ela
         seguia na lista — cada `caixas()` passava por aqui e devolvia
         o membro de nascença que a briga tinha tirado. O histórico diz
         quem saiu: se o último registro dela neste eixo é `saiu`, ela
         está fora, e fora fica (e sai agora, se algum repinte anterior
         já a tinha devolvido). */
      const foraDe = new Set();
      for(const h of X.historico.slice().sort((a,b)=>(a.seq||0)-(b.seq||0))){
        if(h.eixo !== x.id || !h.torcida) continue;
        if(h.tipo === 'saiu') foraDe.add(h.torcida);
        else if(h.tipo === 'entrou') foraDe.delete(h.torcida);
      }
      if(x.membros.some(id=>foraDe.has(id))){
        x.membros = x.membros.filter(id=>!foraDe.has(id)); mexeu = true;
      }
      for(const id of membros){
        if(x.membros.includes(id) || foraDe.has(id)) continue;
        if(X.lista.filter(y=>y.membros.includes(id)).length >= MAX_POR_TORCIDA) continue;
        x.membros.push(id); mexeu = true;
      }
      if(mexeu) consolidar(E, x);
    }
    return X;
  }
  const lista = E => caixas(E).lista;
  const eixo  = (E, id) => lista(E).find(x=>x.id === id) || null;
  const de    = (E, torcidaId) => lista(E).filter(x=>x.membros.includes(torcidaId));

  /* ---- a relação entre duas torcidas quaisquer, com o dono no meio ---- */
  const relDe = (E, a, b) =>
    a === E.torcida.id ? R().nivel(E, b)
    : b === E.torcida.id ? R().nivel(E, a)
    : R().relacaoDelas(E, a, b);
  function porRel(E, a, b, v){
    v = U.limitar(v, -100, 100);
    if(a === E.torcida.id) E.relacoes[b] = v;
    else if(b === E.torcida.id) E.relacoes[a] = v;
    else { R().relacaoDelas(E, a, b); E.relacoesDelas[R().chaveDe(a, b)] = v; }
  }
  const noMinimo = (E, a, b, v) => { if(relDe(E, a, b) < v) porRel(E, a, b, v); };
  const noMaximo = (E, a, b, v) => { if(relDe(E, a, b) > v) porRel(E, a, b, v); };

  /* cada linha do histórico tem número próprio: é por ele que a tela
     sabe o que é novidade, e não pela data (duas coisas no mesmo dia
     também contam) */
  function anotar(E, linha){
    const X = caixas(E);
    X.seqHist = (X.seqHist || 0) + 1;
    X.historico.unshift(Object.assign({
      seq:X.seqHist, abs:E.data.absoluto||0, ano:E.data.ano, semana:E.data.semana
    }, linha));
  }

  function consolidar(E, x){
    for(let i=0;i<x.membros.length;i++)
      for(let j=i+1;j<x.membros.length;j++)
        noMinimo(E, x.membros[i], x.membros[j], ALIADO_AO_ENTRAR);
  }

  /* os maiores rivais de uma torcida: a fonte (dos dois lados) e o valor */
  function maioresRivaisDe(E, id){
    const o = M().torcida(id); if(!o) return [];
    const fora = new Set(o.maioresRivais || []);
    for(const p of M().jogaveis()){
      if(p.id === id || p.incompleta) continue;
      if((p.maioresRivais||[]).includes(id) || relDe(E, id, p.id) <= -70) fora.add(p.id);
    }
    return [...fora];
  }
  /* os maiores rivais do eixo inteiro (união dos membros), sem os membros */
  function maioresRivaisDoEixo(E, x){
    const s = new Set();
    for(const m of x.membros) for(const r of maioresRivaisDe(E, m)) if(!x.membros.includes(r)) s.add(r);
    return [...s];
  }

  /* =========================================================
     A LEALDADE VEM ANTES DA MESA (correção do dono, 12/09/2026)
     Duas torcidas não se acertam — nem por aproximação, nem por fim de
     treta — quando uma delas é MAIOR RIVAL de uma aliada da outra.
     O caso que o dono pegou no jogo: a Máfia Vermelha não pode esfriar
     a treta com a Raça Fla, porque anda com a Young Flu e a Raça Fla é
     maior rival da Young. Quem senta essa mesa está pedindo pra uma
     das duas trair quem já anda com ela, e isso não se faz.

     Vale nos dois sentidos, e vale igual pra mesa das outras e pra
     nossa reunião. O AFASTAR é o contrário disto — separa em vez de
     juntar —, e por isso passa livre.
     ========================================================= */
  const TRANCA_ALIADO = 20;      // o corte de "aliada" pra valer a lealdade
  function trancaDeAliado(E, b, c){
    const anda = (x, y) => x !== y && relDe(E, x, y) >= TRANCA_ALIADO;
    for(const r of maioresRivaisDe(E, c)) if(anda(b, r))
      return {quem:b, aliada:r, contra:c};
    for(const r of maioresRivaisDe(E, b)) if(anda(c, r))
      return {quem:c, aliada:r, contra:b};
    return null;
  }
  /* o motivo em português, pra nota de tela e pra teste */
  const motivoDaTranca = (E, t) => !t ? '' :
    `${(M().torcida(t.quem)||{}).nome} anda com a ${(M().torcida(t.aliada)||{}).nome}, `+
    `que é maior rival da ${(M().torcida(t.contra)||{}).nome}`;

  /* =========================================================
     O CÍRCULO EM COMUM (regra do dono, 12/09/2026)
     "Uma só se aproxima da outra quando possui muitos aliados (mais de
     50%) em comum." O caso que o dono pegou: *Trovão Azul aproximou
     Fúria Jovem Baraúnas e Força Jovem Pelotas* — duas torcidas que
     não andam com a mesma gente. Aproximação não é apresentação de
     estranhos: é duas turmas que já se cruzam na rua toda semana
     fechando o que faltava.

     A conta é sobre o CÍRCULO MENOR: mais da metade das aliadas da que
     tem menos aliadas precisa ser aliada da outra também. Quem
     intermedeia já conta como uma dessas — ela é aliada das duas, é o
     que a põe no meio.

     Vale só pra APROXIMAR. Pacificar é outra coisa: encerrar uma treta
     não faz ninguém virar aliado de ninguém, e não exige convívio.
     ========================================================= */
  const CIRCULO_EM_COMUM = 0.5;
  function aliadasDe(E, id, cache){
    if(cache && cache.has(id)) return cache.get(id);
    const s = new Set();
    for(const o of M().jogaveis()){
      if(o.incompleta || o.id === id) continue;
      if(relDe(E, id, o.id) >= TRANCA_ALIADO) s.add(o.id);
    }
    if(cache) cache.set(id, s);
    return s;
  }
  function circuloEmComum(E, b, c, cache){
    const A = aliadasDe(E, b, cache), B = aliadasDe(E, c, cache);
    let comuns = 0;
    for(const x of A) if(B.has(x)) comuns++;
    const menor = Math.min(A.size, B.size);
    return {comuns, nA:A.size, nB:B.size, menor,
            ok: menor > 0 && comuns > menor * CIRCULO_EM_COMUM};
  }

  /* ---- quem pode entrar ---- */
  function podeEntrar(E, eixoId, torcidaId){
    const x = eixo(E, eixoId); const o = M().torcida(torcidaId);
    if(!x || !o || o.incompleta) return {ok:false, motivo:'não existe'};
    if(x.membros.includes(torcidaId)) return {ok:false, motivo:'já é do eixo'};
    if(de(E, torcidaId).length >= MAX_POR_TORCIDA) return {ok:false, motivo:'já está em dois eixos'};
    /* PORTA GIRATÓRIA FECHADA (17/09/2026): quem saiu — por briga com
       um membro, ou vetado pelo dono — fica meio ano fora daquele eixo.
       Sem isto o Bamor saiu do Dedo pro Alto três vezes em cinco semanas:
       o eixo o chamava de volta e a mesma treta o punha pra fora. */
    const veto = (caixas(E).vetos||{})[`${eixoId}|${torcidaId}`];
    if(veto && R().semanaAbs(E) - veto < RECUSA_CADA)
      return {ok:false, motivo:'saiu há pouco desse eixo'};
    /* O EIXO NÃO ATRAVESSA A FRONTEIRA (12/09/2026). Eixo é política de
       arquibancada perto de casa — quem entra desce junto, escolta e
       cobra. Antes dos hermanamientos isto se garantia sozinho: relação
       entre torcida daqui e barra de fora era sempre neutra, e entrar
       pede +45. Com a irmandade internacional valendo +80, uma barra
       chilena passou a caber num eixo brasileiro; a fronteira agora é
       regra, e não efeito colateral de não haver relação. */
    const pais = t => (t && t.fora) ? t.regiao : 'Brasil';
    for(const m of x.membros){
      const mo = M().torcida(m);
      if(mo && pais(mo) !== pais(o))
        return {ok:false, motivo:`a ${mo.nome} é de outro país`};
    }
    let aliadas = 0;
    for(const m of x.membros){
      if(R().ehMaiorRival(E, m, torcidaId)) return {ok:false, motivo:`maior rival da ${(M().torcida(m)||{}).nome}`};
      const v = relDe(E, m, torcidaId);
      if(v < -15) return {ok:false, motivo:`rival da ${(M().torcida(m)||{}).nome}`};
      if(v >= 20) aliadas++;
    }
    /* "se fizerem sentido": aliada de pelo menos metade do eixo */
    if(aliadas < Math.max(1, Math.ceil(x.membros.length * METADE_ALIADA)))
      return {ok:false, motivo:`aliada de só ${aliadas} de ${x.membros.length}`};
    /* e não pode ser aliada/irmã de um maior rival do eixo? Não: basta
       não ser maior rival de ninguém — o dono pediu só isso. Mas quem é
       irmã de um maior rival do eixo não entra: irmã não vira rival. */
    for(const r of maioresRivaisDoEixo(E, x))
      if(M().saoIrmas && M().saoIrmas(torcidaId, r)) return {ok:false, motivo:`irmã da ${(M().torcida(r)||{}).nome}, maior rival do eixo`};
    /* eixo novo não pode virar cópia de outro: com ela dentro, no
       máximo MAX_EM_COMUM membros em comum com qualquer eixo em que ela
       já esteja — quando um dos dois é novo */
    for(const y of de(E, torcidaId)){
      if(x.base && y.base) continue;
      const comum = x.membros.filter(m=>y.membros.includes(m)).length + 1;
      if(comum > MAX_EM_COMUM) return {ok:false, motivo:`o ${x.nome} ficaria com ${comum} em comum com o ${y.nome}`};
    }
    return {ok:true};
  }
  /* a nota de um candidato: soma das relações com os membros, e o
     bônus de praça descoberta */
  function notaDe(E, x, torcidaId){
    const o = M().torcida(torcidaId);
    const pracas = new Set(x.membros.map(m=>(M().torcida(m)||{}).mapa));
    let n = 0;
    for(const m of x.membros) n += relDe(E, m, torcidaId);
    if(!pracas.has(o.mapa)) n += 40;
    return n;
  }
  function candidatos(E, eixoId){
    const x = eixo(E, eixoId); if(!x) return [];
    return M().jogaveis()
      .filter(o=>!o.incompleta && podeEntrar(E, eixoId, o.id).ok)
      .map(o=>({id:o.id, nome:o.nome, nota:notaDe(E, x, o.id)}))
      .sort((a,b)=>b.nota - a.nota);
  }

  /* ---- entrar: aliada de todos, rival dos maiores rivais de todos ---- */
  function entrar(E, eixoId, torcidaId){
    const x = eixo(E, eixoId); if(!x || x.membros.includes(torcidaId)) return null;
    const antes = x.membros.slice();
    const rivais = maioresRivaisDoEixo(E, x);
    x.membros.push(torcidaId);
    const novasAliadas = [], novosRivais = [];
    for(const m of antes){
      if(relDe(E, m, torcidaId) < 20) novasAliadas.push(m);
      noMinimo(E, m, torcidaId, ALIADO_AO_ENTRAR);
    }
    for(const r of rivais){
      if(r === torcidaId) continue;
      if(M().saoIrmas && M().saoIrmas(torcidaId, r)) continue;
      if(relDe(E, r, torcidaId) > -15) novosRivais.push(r);
      noMaximo(E, r, torcidaId, RIVAL_AO_ENTRAR);
    }
    /* o dono entrando (ou o dono sendo o outro lado) não pode receber
       a pergunta "virou neutro?" por causa disto: o vigia reconhece */
    const S = E.statusRel;
    if(S && S.visto){
      const marcar = (a, b) => {
        const outro = a === E.torcida.id ? b : b === E.torcida.id ? a : null;
        if(!outro) return;
        const v = R().nivel(E, outro);
        S.visto[outro] = v <= -15 ? 'rival' : v < 20 ? 'neutro' : 'aliado';
      };
      for(const m of antes) marcar(m, torcidaId);
      for(const r of rivais) marcar(r, torcidaId);
    }
    anotar(E, {tipo:'entrou', eixo:eixoId, torcida:torcidaId});
    return {eixo:x, novasAliadas, novosRivais};
  }

  /* ---- fundar um eixo novo ---- */
  function nomeNovo(E, membros){
    const X = caixas(E);
    /* a língua é a da maioria dos fundadores: Brasil fala português,
       o resto do continente fala espanhol */
    const pais = id => (R().paisDaTorcida ? R().paisDaTorcida(id) : 'Brasil');
    const doBrasil = membros.filter(m=>pais(m) === 'Brasil').length;
    const lingua = doBrasil * 2 >= membros.length ? 'pt' : 'es';
    const pool = (TO.dados.eixos.nomesNovos || {});
    const lista = Array.isArray(pool) ? pool : (pool[lingua] || pool.pt || []);
    const livres = lista.filter(n=>!X.nomesUsados.includes(n.nome));
    const esc = livres[0];
    if(!esc) return null;                 // acabaram os nomes: não nasce mais eixo
    X.nomesUsados.push(esc.nome);
    return {nome:esc.nome, sigla:esc.sigla || ''};
  }
  function fundar(E, membros, nomeDado){
    const X = caixas(E);
    const n = nomeDado || nomeNovo(E, membros);
    if(!n) return null;
    const {nome, sigla} = n;
    const x = {id:`novo_${X.seq++}`, nome, sigla, base:false,
               fundado:{ano:E.data.ano, semana:E.data.semana}, membros:[]};
    X.lista.push(x);
    x.membros.push(membros[0]);
    for(const m of membros.slice(1)) entrar(E, x.id, m);
    anotar(E, {tipo:'fundou', eixo:x.id, membros:membros.slice()});
    return x;
  }

  /* ---- o dia: recrutamento por eixo e fundação de eixo novo ----
     Devolve os eventos pro feed contar. O convite ao dono é evento
     de decisão; o feed responde chamando `entrar` ou `recusar`. */
  /* =======================================================
     RIVAL NÃO CONVIVE NO MESMO EIXO (régua do dono, 17/09/2026)

     O dono pegou a Força Jovem Guarany e a Fúria Independente no
     mesmo eixo e rivais entre si. Impossível. A relação entre duas
     torcidas anda por conta própria — briga, mesa alheia, secura — e
     nada conferia se o eixo ainda fazia sentido. Agora confere, todo
     dia: quando dois membros viram rivais, UM SAI — o que tem a menor
     soma de relação com o resto do eixo (o eixo fica com quem é mais
     próximo). Sair custa −20 com cada um dos que ficam. Irmãs (mesmo
     clube) nunca são separadas.
     ======================================================= */
  const SAIDA_DO_EIXO = -20;
  const saoRivais = (E, a, b) =>
    (R().ehMaiorRival && R().ehMaiorRival(E, a, b)) || relDe(E, a, b) < -15;
  function marcarStatusVisto(E, a, b){
    const S = E.statusRel; if(!S || !S.visto) return;
    const outro = a === E.torcida.id ? b : b === E.torcida.id ? a : null;
    if(!outro) return;
    const v = R().nivel(E, outro);
    S.visto[outro] = v <= -15 ? 'rival' : v < 20 ? 'neutro' : 'aliado';
  }
  function sanearEixos(E){
    const X = caixas(E), saidas = [];
    for(const x of X.lista){
      for(let guarda = 0; guarda < 20; guarda++){
        const m = x.membros;
        let par = null;
        for(let i = 0; i < m.length && !par; i++)
          for(let j = i + 1; j < m.length && !par; j++){
            if(M().saoIrmas && M().saoIrmas(m[i], m[j])) continue;
            if(saoRivais(E, m[i], m[j])) par = [m[i], m[j]];
          }
        if(!par) break;
        const [a, b] = par;
        const soma = id => m.filter(o=>o !== a && o !== b)
                            .reduce((t, o)=>t + relDe(E, id, o), 0);
        const sa = soma(a), sb = soma(b);
        const sai = sa < sb ? a : sb < sa ? b
                  : (TO.mapa.hash(`eixo|sai|${x.id}|${a}|${b}`) % 2 ? a : b);
        const fica = sai === a ? b : a;
        x.membros = m.filter(o=>o !== sai);
        for(const o of x.membros){
          porRel(E, sai, o, relDe(E, sai, o) + SAIDA_DO_EIXO);
          marcarStatusVisto(E, sai, o);
        }
        X.vetos = X.vetos || {};
        X.vetos[`${x.id}|${sai}`] = R().semanaAbs(E);   // meio ano sem voltar
        anotar(E, {tipo:'saiu', eixo:x.id, torcida:sai, outra:fica});
        saidas.push({tipo:'saida', eixo:x.id, torcida:sai, outra:fica});
      }
    }
    return saidas;
  }

  /* =======================================================
     O PEDIDO A UM ALIADO (régua do dono, 17/09/2026)

     Em toda reunião de diplomacia a gente pode pedir a UM aliado que se
     aproxime de um rival dele ou se afaste de um aliado dele. A chance
     de ele topar é o quanto ele anda com a gente — a mesma régua da
     mesa das outras (25% + 60% × força, força = quanto a relação passa
     de +20 até +80). Topando, mexe o que a mesa alheia mexe: aproximar
     de +15 a +25 (sem passar de Aliado), afastar de −15 a −25 (sem
     descer de Neutro), e +2 com quem topou. Recusando, −3 com ele.
     Maior rival não senta na mesa, e irmã não se larga — os dois ficam
     de fora das listas. Um pedido por reunião.
     ======================================================= */
  const PEDIDO_TOPOU = 2, PEDIDO_RECUSOU = -3;
  function forcaDoPedido(E, aliadoId){
    return U.limitar((relDe(E, E.torcida.id, aliadoId) - 20) / 60, 0, 1);
  }
  const chanceDoPedido = (E, aliadoId) => 0.25 + 0.6 * forcaDoPedido(E, aliadoId);
  function aliadosNossos(E){
    const nos = E.torcida.id;
    return M().jogaveis()
      .filter(o=>o.id !== nos && !o.incompleta && relDe(E, nos, o.id) >= DIPLO_ALIADO)
      .sort((a,b)=>relDe(E, nos, b.id) - relDe(E, nos, a.id));
  }
  /* DE QUEM SE PEDE (régua do dono, 22/09/2026): no APROXIMAR, a lista
     é dos NOSSOS aliados que ainda não são aliados nem irmãos do aliado
     pedido — tanto faz se entre os dois é neutro, rival ou maior rival;
     a ideia é juntar a nossa turma. No afastar continua sendo dos
     aliados dele (irmã não se larga). */
  function alvosDoPedido(E, tipo, aliadoId){
    const nos = E.torcida.id;
    return M().jogaveis().filter(o=>{
      if(o.id === nos || o.id === aliadoId || o.incompleta) return false;
      if(M().saoIrmas && M().saoIrmas(aliadoId, o.id)) return false;
      const v = relDe(E, aliadoId, o.id);
      if(tipo === 'aproximar')
        return relDe(E, nos, o.id) >= DIPLO_ALIADO && v < DIPLO_ALIADO;
      return v >= DIPLO_ALIADO;
    }).sort((a,b)=>relDe(E, aliadoId, b.id) - relDe(E, aliadoId, a.id));
  }
  function pedirAoAliado(E, tipo, aliadoId, alvoId){
    const X = caixas(E), nos = E.torcida.id;
    const Rn = E.reuniao || {};
    if(Rn.pedido && Rn.pedido.marca === Rn.ultima)
      return {ok:false, motivo:'já pedimos nesta reunião'};
    const aliado = M().torcida(aliadoId), alvo = M().torcida(alvoId);
    if(!aliado || !alvo) return {ok:false, motivo:'torcida desconhecida'};
    if(!alvosDoPedido(E, tipo, aliadoId).some(o=>o.id === alvoId))
      return {ok:false, motivo:'esse pedido não cabe'};
    const forca = forcaDoPedido(E, aliadoId), chance = chanceDoPedido(E, aliadoId);
    const sa = R().semanaAbs(E);
    const topou = (TO.mapa.hash(`pedido|${sa}|${aliadoId}|${alvoId}`) % 1000) / 1000 < chance;
    const v = relDe(E, aliadoId, alvoId);
    let texto;
    if(topou){
      if(tipo === 'aproximar'){
        const ganho = Math.round(15 + 10 * forca);
        porRel(E, aliadoId, alvoId, Math.min(DIPLO_TETO, v + ganho));
        texto = `A ${aliado.nome} topou e sentou com a ${alvo.nome}: a relação entre as duas `+
                `subiu ${Math.min(DIPLO_TETO, v + ganho) - v}.`;
      } else {
        const perda = Math.round(15 + 10 * forca);
        porRel(E, aliadoId, alvoId, Math.max(0, v - perda));
        texto = `A ${aliado.nome} topou e se afastou da ${alvo.nome}: a relação entre as duas `+
                `caiu ${v - Math.max(0, v - perda)}.`;
      }
      porRel(E, nos, aliadoId, relDe(E, nos, aliadoId) + PEDIDO_TOPOU);
      anotar(E, {tipo, eixo:null, porta:nos, torcida:aliadoId, outra:alvoId});
    } else {
      porRel(E, nos, aliadoId, relDe(E, nos, aliadoId) + PEDIDO_RECUSOU);
      texto = `A ${aliado.nome} não topou: "isso é problema nosso". `+
              `A relação com ela caiu ${-PEDIDO_RECUSOU}.`;
    }
    marcarStatusVisto(E, nos, aliadoId);
    E.reuniao = E.reuniao || {};
    E.reuniao.pedido = {marca:Rn.ultima || null, tipo, aliado:aliadoId, alvo:alvoId,
                        topou, texto, chance};
    return {ok:true, topou, chance, texto};
  }

  function eventosDoDia(E, forcar){
    const X = caixas(E);
    /* antes de qualquer mesa, o eixo confere se ainda faz sentido */
    const saidas = sanearEixos(E);
    const H = TO.mapa.hash, sa = R().semanaAbs(E);
    const evs = saidas.slice();
    /* 1. cada eixo tenta recrutar */
    for(const x of X.lista){
      if(!forcar){
        /* o relógio de cada eixo tem a própria fase, pra não convidarem
           todos no mesmo dia */
        if(((E.data.absoluto||0) + H('eixo|'+x.id)) % RECRUTA_CADA_DIAS !== 0) continue;
      }
      const cands = candidatos(E, x.id);
      if(!cands.length) continue;
      let esc = cands[0];
      if(esc.id === E.torcida.id){
        const rec = (X.recusas||{})[x.id];
        if(rec && sa - rec < RECUSA_CADA){ esc = cands[1]; if(!esc) continue; }
      }
      if(esc.id === E.torcida.id){
        /* quem chama é o membro mais próximo da gente */
        const porta = x.membros.slice().sort((a,b)=>R().nivel(E,b) - R().nivel(E,a))[0];
        evs.push({tipo:'convite', eixo:x.id, porta});
      } else if(x.membros.includes(E.torcida.id)){
        /* NO NOSSO EIXO QUEM DECIDE É O DONO (dono, 11/09/2026): o eixo
           propõe o nome e espera a gente concordar. Vetado, o nome só
           volta à mesa depois de meio ano; e entre uma proposta e outra
           passa um trimestre, senão o feed vira mesa de reunião. */
        const veto = (X.vetos||{})[`${x.id}|${esc.id}`];
        if(veto && sa - veto < RECUSA_CADA) continue;
        const ult = X.propostas && X.propostas[x.id];
        if(!forcar && ult && sa - ult < PROPOSTA_CADA) continue;
        X.propostas = X.propostas || {};
        X.propostas[x.id] = sa;
        const porta = x.membros.filter(m=>m !== E.torcida.id)
          .sort((a,b)=>R().nivel(E,b) - R().nivel(E,a))[0];
        evs.push({tipo:'proposta', eixo:x.id, torcida:esc.id, porta});
      } else {
        const r = entrar(E, x.id, esc.id);
        if(r) evs.push({tipo:'entrou', eixo:x.id, torcida:esc.id,
                        novasAliadas:r.novasAliadas, novosRivais:r.novosRivais});
      }
    }
    /* 2. um eixo novo: aliadas sem eixo que se fecham num grupo */
    if(forcar || ((sa + H('eixo|novo')) % FUNDA_CADA === 0 && (H(`eixo|novo|${sa}`) % 7) + 1 === E.data.dia
                  && (H(`eixo|novo|vinga|${sa}`) % 1000) / 1000 < FUNDA_CHANCE)){
      /* ALIADAS ENTRE SI FUNDAM EIXO NATURALMENTE (dono, 11/09/2026: Os
         Imbatíveis, Remista, Jovem Sport e Jovem Garra Tricolor são
         aliadas duas a duas — e a Jovem Sport já é do Punho Cruzado). A
         semente é quem
         não tem eixo; os outros fundadores podem ter um, desde que
         metade do grupo ainda esteja sem eixo. Todos aliados dois a dois
         a +45, sem maior rival entre si, e o grupo não pode ser pedaço
         de um eixo que já existe. */
      const livres = M().jogaveis().filter(o=>!o.incompleta && o.id !== E.torcida.id && de(E, o.id).length === 0);
      const cabem  = M().jogaveis().filter(o=>!o.incompleta && o.id !== E.torcida.id && de(E, o.id).length < MAX_POR_TORCIDA);
      let melhor = null;
      for(const s of livres){
        const grupo = [s.id];
        const alis = cabem.filter(o=>o.id !== s.id && relDe(E, s.id, o.id) >= ALIADO_AO_ENTRAR)
          .sort((a,b)=>(de(E, a.id).length - de(E, b.id).length) || (relDe(E, s.id, b.id) - relDe(E, s.id, a.id)));
        for(const a of alis){
          if(grupo.length >= 5) break;
          const semEixo = grupo.filter(g=>de(E, g).length === 0).length + (de(E, a.id).length ? 0 : 1);
          if(semEixo * 2 < grupo.length + 1) continue;
          if(!grupo.every(g=>relDe(E, g, a.id) >= ALIADO_AO_ENTRAR && !R().ehMaiorRival(E, g, a.id))) continue;
          if(X.lista.some(x=>grupo.filter(g=>x.membros.includes(g)).length + (x.membros.includes(a.id) ? 1 : 0) > MAX_EM_COMUM)) continue;
          grupo.push(a.id);
        }
        if(grupo.length < MIN_FUNDADORES) continue;
        /* no máximo MAX_EM_COMUM membros em comum com qualquer eixo que
           já existe (dono, 11/09/2026) */
        if(X.lista.some(x=>grupo.filter(g=>x.membros.includes(g)).length > MAX_EM_COMUM)) continue;
        if(!melhor || grupo.length > melhor.length ||
           (grupo.length === melhor.length && H(`eixo|semente|${sa}|${s.id}`) % 2)) melhor = grupo;
      }
      if(melhor){
        const x = fundar(E, melhor);
        if(x) evs.push({tipo:'fundou', eixo:x.id, membros:melhor});
      }
    }
    return evs;
  }
  function recusar(E, eixoId, porta){
    caixas(E).recusas[eixoId] = R().semanaAbs(E);
    if(porta) E.relacoes[porta] = U.limitar(R().nivel(E, porta) - 3, -100, 100);
  }
  /* o dono vetou um nome no eixo dele: some da mesa por meio ano */
  function vetar(E, eixoId, torcidaId){
    caixas(E).vetos[`${eixoId}|${torcidaId}`] = R().semanaAbs(E);
  }

  /* AS NOVIDADES (dono, 11/09/2026): as entradas e fundações saíram do
     feed e viram a lista da aba Eixos, em Diplomacia. `nova` é o que
     aconteceu depois da última visita; `marcarVistas` zera o contador. */
  function novidades(E, quantas){
    const X = caixas(E);
    /* A TELA MOSTRA O MUNDO INTEIRO (dono, 11/09/2026): o feed só fala
       do nosso eixo; toda a movimentação das outras alianças aparece
       aqui, com as nossas em destaque. */
    return (X.historico||[]).slice(0, quantas || 40).map(h=>{
      const x = eixo(E, h.eixo);
      return {
        abs:h.abs, ano:h.ano, semana:h.semana, tipo:h.tipo,
        eixo:h.eixo, nomeEixo: x ? x.nome : '', nosso: !!x && x.membros.includes(E.torcida.id),
        torcida:h.torcida || null, membros:h.membros || null,
        outra:h.outra || null, porta:h.porta || null,
        nova: (h.seq||0) > (X.vistoAte||0)
      };
    });
  }
  const naoVistas = E => novidades(E, 60).filter(n=>n.nova).length;
  const naoVistasNossas = E => novidades(E, 60).filter(n=>n.nova && n.nosso).length;
  function marcarVistas(E){
    const X = caixas(E);
    X.vistoAte = Math.max(X.vistoAte||0, X.seqHist||0);
  }

  /* =========================================================
     A DIPLOMACIA DAS OUTRAS (pedido do dono, 11/09/2026)
     O que a gente faz na reunião do dia 5, elas fazem entre si: cada
     torcida senta a própria mesa e usa as amizades que tem pra mexer
     nas relações das outras — sempre pra fortalecer o eixo em que ela
     está. São três jogadas, as mesmas nossas:

       APROXIMAR   duas aliadas dela que são neutras entre si viram
                   aliadas — é assim que nasce candidato pro eixo;
       PACIFICAR   duas aliadas dela que são rivais entre si esfriam
                   a treta até o neutro;
       AFASTAR     uma aliada dela que anda com um MAIOR RIVAL do eixo
                   é puxada pra escolher lado: a aliança com o
                   inimigo esfria até o neutro (a "desaliança").

     "Quanto melhor a relação entre duas torcidas, uma vai favorecer a
     outra" (dono): quem manda no tamanho do empurrão e na chance de
     ele pegar é a PIOR das duas relações da intermediária com o par —
     ela só consegue sentar quem confia nela. Por isso cada torcida só
     trabalha com as doze aliadas mais próximas.

     Maior rival nunca vira aliado por mesa de terceiro, e ninguém
     passa de Aliado (+45) por aqui: irmandade se constrói na rua.
     Nada disso toca a NOSSA relação com ninguém — o que é nosso se
     decide na nossa reunião.
     ========================================================= */
  const DIPLO_CADA_DIAS = 91;    // cada torcida senta a mesa dela 4x por ano
  const DIPLO_ALIADO    = 20;    // o corte de "aliada" da régua
  const DIPLO_NEUTRO    = -15;   // o corte de "rival"
  const DIPLO_PARCEIRAS = 12;    // com quantas aliadas ela trabalha
  const DIPLO_TETO      = ALIADO_AO_ENTRAR;  // até onde a mesa leva (+45)

  /* o quanto ela puxa: a PIOR das duas relações dela com o par */
  function forcaDaMesa(E, a, b, c){
    const v = Math.min(relDe(E, a, b), relDe(E, a, c));
    return Math.max(0, Math.min(1, (v - DIPLO_ALIADO) / 60));
  }

  function mesaDela(E, aId){
    const H = TO.mapa.hash, sa = R().semanaAbs(E), nos = E.torcida.id;
    const meus = de(E, aId);
    const noEixo = id => meus.some(x=>x.membros.includes(id));
    const rivaisDoEixo = new Set();
    for(const x of meus) for(const r of maioresRivaisDoEixo(E, x)) rivaisDoEixo.add(r);
    /* as doze mais próximas: é com quem ela tem voz */
    const parceiras = M().jogaveis()
      .filter(o=>!o.incompleta && o.id !== aId && o.id !== nos &&
                 relDe(E, aId, o.id) >= DIPLO_ALIADO)
      .sort((x,y)=>relDe(E, aId, y.id) - relDe(E, aId, x.id))
      .slice(0, DIPLO_PARCEIRAS);
    if(!parceiras.length) return null;

    const jogadas = [];
    /* 1 e 2: entre as parceiras dela */
    for(let i=0;i<parceiras.length;i++) for(let j=i+1;j<parceiras.length;j++){
      const b = parceiras[i].id, c = parceiras[j].id;
      if(R().ehMaiorRival(E, b, c)) continue;
      const v = relDe(E, b, c);
      const dentro = (noEixo(b)?1:0) + (noEixo(c)?1:0);
      if(v >= DIPLO_NEUTRO && v < DIPLO_TETO){
        /* aproximar: o eixo ganha mais quando UMA está dentro e a outra
           fora — é o nome de fora que vira candidato */
        jogadas.push({tipo:'aproximar', b, c, v,
          peso: 1 + (dentro === 1 ? 2 : dentro === 2 ? 1 : 0)});
      } else if(v < DIPLO_NEUTRO){
        jogadas.push({tipo:'pacificar', b, c, v,
          peso: 1 + (dentro ? 2 : 0)});
      }
    }
    /* 3: a parceira que anda com um maior rival do eixo
       NINGUÉM PEDE PRA LARGAR QUEM ELA PRÓPRIA ABRAÇA (correção do dono,
       16/09/2026): a lista de alvos vinha dos maiores rivais do EIXO —
       dos outros membros, portanto —, e a anfitriã acabava puxando uma
       parceira pra longe de uma torcida que ELA mesma tinha como aliada
       ou irmã. Saía "a Remista puxou a Jovem Garra Tricolor pra longe da
       Jovem Sport" com as três de bem. Quem senta a mesa só cobra
       distância de quem é rival ou maior rival DELA. */
    const hostilPraAnfitria = r => {
      if(M().saoIrmas && M().saoIrmas(aId, r)) return false;
      const st = M().statusDoValor(relDe(E, aId, r));
      return st === 'Rival' || st === 'Maior Rival';
    };
    if(rivaisDoEixo.size) for(const p of parceiras){
      if(!noEixo(p.id)) continue;
      for(const r of rivaisDoEixo){
        if(r === nos || r === p.id || r === aId) continue;
        if(!hostilPraAnfitria(r)) continue;
        const v = relDe(E, p.id, r);
        if(v < DIPLO_ALIADO) continue;
        if(M().saoIrmas && M().saoIrmas(p.id, r)) continue;   // irmã não se larga
        jogadas.push({tipo:'afastar', b:p.id, c:r, v, peso:3});
      }
    }
    if(!jogadas.length) return null;
    const nota = j => H(`mesa|${sa}|${aId}|${j.b}|${j.c}`) % 1000;
    jogadas.sort((x,y)=>y.peso - x.peso || nota(x) - nota(y));
    /* a primeira que a lealdade deixa passar — oito tentativas, que a
       trava custa uma varredura do mapa por par */
    let j = null;
    const cacheAliadas = new Map();
    for(const cand of jogadas.slice(0, 8)){
      /* aproximar pede círculo em comum; pacificar, não (dono, 12/09/2026) */
      if(cand.tipo === 'aproximar' &&
         !circuloEmComum(E, cand.b, cand.c, cacheAliadas).ok) continue;
      if(cand.tipo !== 'afastar' && trancaDeAliado(E, cand.b, cand.c)) continue;
      j = cand; break;
    }
    if(!j) return null;
    const forca = forcaDaMesa(E, aId, j.b, j.c);
    if((H(`mesa|ok|${sa}|${aId}|${j.b}`) % 1000) / 1000 >= 0.25 + 0.6 * forca) return null;

    /* A RÉGUA DO DONO (12/09/2026): a mesa mexia pouco — de +5 a +20 no
       aproximar e de −4 a −14 no afastar —, e uma jogada a cada 91 dias
       nesse tamanho quase não muda o mapa. Agora aproximar vale +15 a
       +25, pacificar +15 a +20 e afastar −15 a −25. Os limites são os
       mesmos: aproximar não passa de Aliado, pacificar não passa de
       Neutro e afastar não desce abaixo de Neutro. */
    if(j.tipo === 'aproximar'){
      const ganho = Math.round(15 + 10 * forca);
      porRel(E, j.b, j.c, Math.min(DIPLO_TETO, j.v + ganho));
    } else if(j.tipo === 'pacificar'){
      const alivio = Math.round(15 + 5 * forca);
      porRel(E, j.b, j.c, Math.min(0, j.v + alivio));
    } else {
      const perda = Math.round(15 + 10 * forca);
      porRel(E, j.b, j.c, Math.max(0, j.v - perda));
    }
    /* o que mexe com gente do NOSSO eixo vira linha das novidades; o
       resto do mundo se mexe em silêncio, senão a lista vira enxurrada */
    if(meus.some(x=>x.membros.includes(nos)) ||
       de(E, j.b).some(x=>x.membros.includes(nos)))
      anotar(E, {tipo:j.tipo, eixo:(meus[0]||{}).id || null,
                 porta:aId, torcida:j.b, outra:j.c});
    return Object.assign({de:aId}, j, {forca});
  }

  /* o dia: as torcidas cuja vez chegou sentam a mesa delas */
  function diplomaciaDelas(E, forcar){
    const H = TO.mapa.hash, abs = E.data.absoluto || 0, nos = E.torcida.id;
    const feitas = [];
    for(const o of M().jogaveis()){
      if(o.incompleta || o.id === nos) continue;
      if(!forcar && ((abs + H('dip|'+o.id)) % DIPLO_CADA_DIAS) !== 0) continue;
      const r = mesaDela(E, o.id);
      if(r) feitas.push(r);
      if(forcar && feitas.length >= 40) break;
    }
    return feitas;
  }

  /* =========================================================
     AS JOGADAS DO DONO (pedido do dono, 11/09/2026)
     Estando em UM eixo só, a nossa torcida pode sentar a própria
     mesa: fundar um eixo — com nome escolhido por nós e os fundadores
     que a gente chamar — ou se candidatar a entrar num eixo que já
     existe. Quem está em dois eixos não cabe em mais nenhum: o teto é
     o mesmo que vale pra IA.

     Freio: uma mesa dessas por trimestre (fundar ou se candidatar,
     deu certo ou não), e cada eixo nosso chama um nome a cada 15
     dias — o mesmo compasso de recrutamento dos eixos da IA. Quem diz
     não some da lista por meio ano.
     ========================================================= */
  const MESA_CADA        = 13;   // semanas entre uma jogada nossa e outra
  const CONVITE_CADA_DIAS= 15;   // cada eixo nosso chama um nome a cada 15 dias
  const RECUSA_NOSSA     = 26;   // semanas até voltar a chamar quem disse não

  const cabemosEmMais = E => de(E, E.torcida.id).length < MAX_POR_TORCIDA;
  const eixosNossos   = E => de(E, E.torcida.id);

  /* quantas semanas faltam pra próxima mesa (0 = pode agora) */
  function esperaDaMesa(E){
    const X = caixas(E), sa = R().semanaAbs(E);
    const falta = MESA_CADA - (sa - (X.nossos.mesa || -MESA_CADA));
    return Math.max(0, falta);
  }
  /* quantos dias faltam pro próximo convite DESTE eixo nosso */
  function esperaDoConvite(E, eixoId){
    const X = caixas(E), abs = E.data.absoluto || 0;
    const ult = X.nossos.convites[eixoId];
    if(ult === undefined) return 0;
    return Math.max(0, CONVITE_CADA_DIAS - (abs - ult));
  }

  /* a chance de alguém aceitar o nosso convite: manda a relação com a
     gente, e quem já tem eixo pensa duas vezes */
  function chanceDoConvite(E, eixoId, torcidaId){
    const v = relDe(E, E.torcida.id, torcidaId);
    let c = (v - 5) / 80;
    c += de(E, torcidaId).length ? -0.2 : 0.1;
    return Math.max(0.08, Math.min(0.92, c));
  }
  /* a chance de um eixo aceitar a NOSSA candidatura: a média das
     relações com os membros, com bônus se a gente abre praça nova e
     desconto se a gente já anda em outro eixo */
  function chanceDaCandidatura(E, eixoId){
    const x = eixo(E, eixoId); if(!x || !x.membros.length) return 0;
    const nos = E.torcida.id;
    const media = x.membros.reduce((sm, m)=>sm + relDe(E, m, nos), 0) / x.membros.length;
    let c = (media + 10) / 90;
    const pracas = new Set(x.membros.map(m=>(M().torcida(m)||{}).mapa));
    if(!pracas.has((M().torcida(nos)||{}).mapa)) c += 0.1;
    if(de(E, nos).length) c -= 0.15;
    return Math.max(0.05, Math.min(0.9, c));
  }

  /* PEDIR ENTRADA NÃO É SER RECRUTADO (regra do dono, 11/09/2026): pra
     a IA convidar alguém, o nome tem que "fazer sentido" — ser aliada
     de metade do eixo. Pra a gente BATER NA PORTA basta que o eixo não
     tenha rival nosso dentro: nenhum membro rival, nenhum maior rival
     dos dois lados. O quanto eles gostam da gente não barra o pedido —
     manda na CHANCE de a porta abrir. O resto continua de pé: o teto de
     dois eixos, a irmã de um maior rival do eixo e o limite de membros
     em comum, que são regras de estrutura, não de simpatia. */
  function podemosPedir(E, eixoId){
    const x = eixo(E, eixoId); const nos = E.torcida.id;
    if(!x) return {ok:false, motivo:'não existe'};
    if(x.membros.includes(nos)) return {ok:false, motivo:'a gente já é do eixo'};
    if(de(E, nos).length >= MAX_POR_TORCIDA) return {ok:false, motivo:'a gente já está em dois eixos'};
    for(const m of x.membros){
      if(R().ehMaiorRival(E, m, nos)) return {ok:false, motivo:`maior rival da ${(M().torcida(m)||{}).nome}`};
      if(relDe(E, m, nos) < -15)      return {ok:false, motivo:`rival da ${(M().torcida(m)||{}).nome}`};
    }
    for(const r of maioresRivaisDoEixo(E, x))
      if(M().saoIrmas && M().saoIrmas(nos, r))
        return {ok:false, motivo:`a gente é irmã da ${(M().torcida(r)||{}).nome}, maior rival do eixo`};
    for(const y of de(E, nos)){
      if(x.base && y.base) continue;
      const comum = x.membros.filter(m=>y.membros.includes(m)).length + 1;
      if(comum > MAX_EM_COMUM) return {ok:false, motivo:`o ${x.nome} ficaria com ${comum} em comum com o ${y.nome}`};
    }
    return {ok:true};
  }

  /* os eixos a que a gente pode se candidatar, com a chance de cada um */
  function eixosPraCandidatar(E){
    const X = caixas(E), sa = R().semanaAbs(E), nos = E.torcida.id;
    return lista(E).map(x=>{
      const pode = podemosPedir(E, x.id);
      const neg = X.nossos.recusaramNos[x.id];
      const espera = neg ? Math.max(0, RECUSA_NOSSA - (sa - neg)) : 0;
      return {id:x.id, nome:x.nome, membros:x.membros.length,
              ok: pode.ok && !espera, motivo: espera ? `disseram não — voltam a ouvir em ${espera} semanas` : pode.motivo,
              chance: pode.ok ? chanceDaCandidatura(E, x.id) : 0};
    }).sort((a,b)=>(b.ok?1:0) - (a.ok?1:0) || b.chance - a.chance);
  }

  /* os nomes da lista que ainda ninguém usou, pra sugerir no campo */
  function nomesLivres(E, quantos){
    const X = caixas(E);
    const pais = R().paisDaTorcida ? R().paisDaTorcida(E.torcida.id) : 'Brasil';
    const pool = TO.dados.eixos.nomesNovos || {};
    const lst = Array.isArray(pool) ? pool : (pool[pais === 'Brasil' ? 'pt' : 'es'] || pool.pt || []);
    const usados = new Set([...X.nomesUsados, ...lista(E).map(x=>x.nome)]);
    return lst.filter(n=>!usados.has(n.nome)).slice(0, quantos || 99);
  }
  /* o nome serve? não pode ser vazio nem repetir eixo que existe */
  function nomeServe(E, nome){
    const n = String(nome || '').trim();
    if(n.length < 3)  return {ok:false, motivo:'o nome precisa de pelo menos 3 letras'};
    if(n.length > 32) return {ok:false, motivo:'nome comprido demais'};
    const igual = s2 => String(s2||'').trim().toLowerCase() === n.toLowerCase();
    if(lista(E).some(x=>igual(x.nome))) return {ok:false, motivo:'já existe um eixo com esse nome'};
    return {ok:true, nome:n};
  }

  /* quem a gente pode chamar pra FUNDAR: aliada de verdade, que cabe
     em mais um eixo e não é maior rival nossa */
  function fundadoresPossiveis(E){
    const X = caixas(E), sa = R().semanaAbs(E), nos = E.torcida.id;
    return M().jogaveis().filter(o=>{
      if(o.incompleta || o.id === nos) return false;
      if(de(E, o.id).length >= MAX_POR_TORCIDA) return false;
      if(R().ehMaiorRival(E, nos, o.id)) return false;
      const neg = X.nossos.recusaram[o.id];
      if(neg && sa - neg < RECUSA_NOSSA) return false;
      return relDe(E, nos, o.id) >= ALIADO_AO_ENTRAR;
    }).map(o=>({id:o.id, nome:o.nome, mapa:o.mapa,
                rel: Math.round(relDe(E, nos, o.id)),
                eixos: de(E, o.id).length,
                chance: Math.max(0.08, Math.min(0.92, (relDe(E, nos, o.id) - 5)/80 +
                                                     (de(E, o.id).length ? -0.2 : 0.1)))}))
      .sort((a,b)=>b.chance - a.chance);
  }
  /* dois convidados não podem ser maiores rivais entre si */
  function brigaNoGrupo(E, ids){
    for(let i=0;i<ids.length;i++) for(let j=i+1;j<ids.length;j++){
      if(R().ehMaiorRival(E, ids[i], ids[j]))
        return `${(M().torcida(ids[i])||{}).nome} e ${(M().torcida(ids[j])||{}).nome} são maiores rivais`;
      if(relDe(E, ids[i], ids[j]) < -15)
        return `${(M().torcida(ids[i])||{}).nome} e ${(M().torcida(ids[j])||{}).nome} são rivais`;
    }
    return null;
  }

  /* ---- fundar o NOSSO eixo ---- */
  function fundarNosso(E, nome, sigla, convidados){
    const X = caixas(E), sa = R().semanaAbs(E), nos = E.torcida.id;
    if(!cabemosEmMais(E)) return {ok:false, motivo:'a gente já está em dois eixos'};
    if(esperaDaMesa(E))   return {ok:false, motivo:`a mesa só senta de novo em ${esperaDaMesa(E)} semanas`};
    const nm = nomeServe(E, nome);
    if(!nm.ok) return {ok:false, motivo:nm.motivo};
    const ids = [...new Set(convidados || [])].filter(id=>id !== nos);
    if(ids.length < MIN_FUNDADORES - 1)
      return {ok:false, motivo:`um eixo nasce com ${MIN_FUNDADORES}: chame pelo menos ${MIN_FUNDADORES-1}`};
    const briga = brigaNoGrupo(E, ids);
    if(briga) return {ok:false, motivo:briga};
    /* gasta a mesa do trimestre, tenha dado certo ou não */
    X.nossos.mesa = sa;
    const H = TO.mapa.hash;
    const dentro = [], fora = [];
    for(const id of ids){
      const c = chanceDoConvite(E, null, id);
      const sorte = (H(`fundar|${sa}|${nos}|${id}`) % 1000) / 1000;
      if(sorte < c) dentro.push(id);
      else { fora.push(id); X.nossos.recusaram[id] = sa; }
    }
    if(dentro.length < MIN_FUNDADORES - 1)
      return {ok:false, nasceu:false, dentro, fora,
              motivo:`só ${dentro.length} toparam — um eixo nasce com ${MIN_FUNDADORES}`};
    const x = fundar(E, [nos, ...dentro], {nome:nm.nome, sigla:String(sigla||'').trim().toUpperCase().slice(0,5)});
    if(!x) return {ok:false, motivo:'não rolou'};
    X.nomesUsados.push(nm.nome);
    X.nossos.convites[x.id] = E.data.absoluto || 0;
    return {ok:true, nasceu:true, eixo:x, dentro, fora};
  }

  /* ---- pedir entrada num eixo que já existe ---- */
  function candidatar(E, eixoId){
    const X = caixas(E), sa = R().semanaAbs(E), nos = E.torcida.id;
    const x = eixo(E, eixoId);
    if(!x) return {ok:false, motivo:'esse eixo não existe'};
    if(!cabemosEmMais(E)) return {ok:false, motivo:'a gente já está em dois eixos'};
    if(esperaDaMesa(E))   return {ok:false, motivo:`a mesa só senta de novo em ${esperaDaMesa(E)} semanas`};
    const neg = X.nossos.recusaramNos[eixoId];
    if(neg && sa - neg < RECUSA_NOSSA)
      return {ok:false, motivo:`eles disseram não faz pouco — voltam a ouvir em ${RECUSA_NOSSA - (sa - neg)} semanas`};
    const pode = podemosPedir(E, eixoId);
    if(!pode.ok) return {ok:false, motivo:pode.motivo};
    X.nossos.mesa = sa;
    const c = chanceDaCandidatura(E, eixoId);
    const sorte = (TO.mapa.hash(`cand|${sa}|${nos}|${eixoId}`) % 1000) / 1000;
    if(sorte >= c){ X.nossos.recusaramNos[eixoId] = sa;
                    return {ok:true, aceito:false, chance:c, eixo:x}; }
    const r = entrar(E, eixoId, nos);
    return {ok:true, aceito:true, chance:c, eixo:x,
            novasAliadas:(r||{}).novasAliadas || [], novosRivais:(r||{}).novosRivais || []};
  }

  /* ---- chamar um nome pro nosso eixo ---- */
  function convidar(E, eixoId, torcidaId){
    const X = caixas(E), sa = R().semanaAbs(E), abs = E.data.absoluto || 0;
    const x = eixo(E, eixoId);
    if(!x) return {ok:false, motivo:'esse eixo não existe'};
    if(!x.membros.includes(E.torcida.id)) return {ok:false, motivo:'esse eixo não é nosso'};
    const espera = esperaDoConvite(E, eixoId);
    if(espera) return {ok:false, motivo:`o eixo já chamou alguém: o próximo nome sai em ${espera} dias`};
    const neg = X.nossos.recusaram[torcidaId];
    if(neg && sa - neg < RECUSA_NOSSA)
      return {ok:false, motivo:`eles disseram não faz pouco — voltam a ouvir em ${RECUSA_NOSSA - (sa - neg)} semanas`};
    const pode = podeEntrar(E, eixoId, torcidaId);
    if(!pode.ok) return {ok:false, motivo:pode.motivo};
    X.nossos.convites[eixoId] = abs;
    const c = chanceDoConvite(E, eixoId, torcidaId);
    const sorte = (TO.mapa.hash(`conv|${sa}|${eixoId}|${torcidaId}`) % 1000) / 1000;
    if(sorte >= c){ X.nossos.recusaram[torcidaId] = sa;
                    return {ok:true, aceito:false, chance:c}; }
    const r = entrar(E, eixoId, torcidaId);
    return {ok:true, aceito:true, chance:c,
            novasAliadas:(r||{}).novasAliadas || [], novosRivais:(r||{}).novosRivais || []};
  }

  /* quem o NOSSO eixo pode chamar, com a chance de cada um */
  function convidaveis(E, eixoId){
    const X = caixas(E), sa = R().semanaAbs(E);
    return M().jogaveis().filter(o=>!o.incompleta && o.id !== E.torcida.id)
      .map(o=>{
        const pode = podeEntrar(E, eixoId, o.id);
        const neg = X.nossos.recusaram[o.id];
        const espera = neg ? Math.max(0, RECUSA_NOSSA - (sa - neg)) : 0;
        return {id:o.id, nome:o.nome, mapa:o.mapa,
                rel: Math.round(relDe(E, E.torcida.id, o.id)),
                eixos: de(E, o.id).length,
                ok: pode.ok && !espera,
                motivo: espera ? `disseram não — voltam a ouvir em ${espera} semanas` : pode.motivo,
                chance: pode.ok ? chanceDoConvite(E, eixoId, o.id) : 0};
      })
      .filter(c=>c.ok || c.chance > 0 || c.rel >= 20)
      .sort((a,b)=>(b.ok?1:0) - (a.ok?1:0) || b.chance - a.chance || b.rel - a.rel);
  }

  /* pro perfil e pra Diplomacia */
  function resumo(E, id){
    const x = eixo(E, id); if(!x) return null;
    const membros = x.membros.map(m=>M().torcida(m)).filter(Boolean);
    const pracas = [...new Set(membros.map(o=>o.mapa))];
    const forca = membros.reduce((s,o)=>{
      const t = o.id === E.torcida.id ? null : (E.mundoTorcidas||{})[o.id];
      return s + (t ? t.membros : (o.id === E.torcida.id ? E.membros.length : (o.membros||0)));
    }, 0);
    return {x, membros, pracas, forca, rivais: maioresRivaisDoEixo(E, x),
            nosso: x.membros.includes(E.torcida.id)};
  }

  return {caixas, lista, eixo, de, podeEntrar, candidatos, entrar, fundar,
          eventosDoDia, recusar, resumo, maioresRivaisDoEixo,
          diplomaciaDelas, mesaDela, DIPLO_CADA_DIAS,
          trancaDeAliado, motivoDaTranca, circuloEmComum, aliadasDe,
          novidades, naoVistas, naoVistasNossas, marcarVistas, vetar,
          /* as jogadas do dono (11/09/2026) */
          cabemosEmMais, eixosNossos, esperaDaMesa, esperaDoConvite,
          eixosPraCandidatar, podemosPedir, nomesLivres, nomeServe, fundadoresPossiveis,
          brigaNoGrupo, fundarNosso, candidatar, convidar, convidaveis,
          chanceDoConvite, chanceDaCandidatura,
          sanearEixos, aliadosNossos, alvosDoPedido, pedirAoAliado, chanceDoPedido,
          MAX_POR_TORCIDA, MIN_FUNDADORES, MESA_CADA, CONVITE_CADA_DIAS,
          ALIADO_AO_ENTRAR, RIVAL_AO_ENTRAR};
})();
