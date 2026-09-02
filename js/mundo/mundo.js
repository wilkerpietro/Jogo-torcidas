/* =========================================================
   MUNDO — consulta e junção dos dados importados
   torcidas.js traz o grafo de relações da era Unity (8857
   direcionais, já simetrizadas na importação). times.js e
   cidades.js vêm da planilha. O que nenhum dos dois traz —
   influência, território — é derivado aqui, num lugar só.
   ========================================================= */
window.TO = window.TO || {};

TO.mundo = (function(){
  const U = TO.util;
  const T = () => TO.dados.times    || [];
  const O = () => TO.dados.torcidas || [];
  const C = () => TO.dados.cidades  || [];
  const D = () => TO.dados.diplomacia || {regras:{relacoes:{}}, parametros:{}};

  let idxT=null, idxO=null, idxC=null;
  function indexar(){
    idxT = new Map(T().map(x=>[x.id,x]));
    idxO = new Map(O().map(x=>[x.id,x]));
    idxC = new Map(C().map(x=>[x.id,x]));
  }
  const time    = id => (idxT||(indexar(),idxT)).get(id);
  const torcida = id => (idxO||(indexar(),idxO)).get(id);
  const cidade  = id => (idxC||(indexar(),idxC)).get(id);

  /* torcidas jogáveis: as completas (a fonte tem um asset vazio) */
  const jogaveis = () => O().filter(o=>!o.incompleta);

  /* Quem dá pra COMANDAR: todas (decisão do autor). O mapa como tela
     saiu do jogo, e a geometria que sobrou — sede, bar, estádio, bairro
     da briga — a planta gerada resolve pra praça de qualquer tamanho.
     Só fica de fora torcida de praça que a fonte não descreve. */
  const PRACA_JOGAVEL = 'Grande';   // ainda decide quem herda a foto
  const selecionaveis = () => jogaveis().filter(o=>{
    const c = cidade(o.mapa);
    return c && (c.bairros||[]).length;
  });

  const torcidasDe = idClube => O().filter(o=>o.clubeId===idClube);
  const torcidasEm = idMapa  => O().filter(o=>o.mapa===idMapa);
  const timesEm    = idMapa  => T().filter(t=>t.mapa===idMapa);

  /* =======================================================
     ESTÁDIOS
     dados/estadios.js diz em que bairro cada praça de jogo
     fica — é o que o mapa da cidade precisa. Clube sem estádio
     mapeado (a fonte cobre 67 dos 108) ganha um bairro fixo,
     sorteado por hash do próprio nome: melhor um lugar estável
     do que nenhum.
     ======================================================= */
  const EST = () => TO.dados.estadios || [];
  let idxE = null;
  const estadio = id => (idxE || (idxE = new Map(EST().map(x=>[x.id,x])))).get(id);
  const estadioDoClube = idClube =>
    EST().find(e=>(e.mandantes||[]).includes(idClube)) || null;

  function estadiosEm(idMapa){
    const daPraca = EST().filter(e=>e.mapa === idMapa);
    /* A comparação é pelo identificador, não pelo nome cru: `estadios.js`
       escreve "Mineirão" e times.js escreve "Mineirao", e comparando as
       duas strings o mesmo estádio entrava duas vezes — dois pinos no
       mapa e dois gramados disputados por um clube só. Belo Horizonte
       tinha 5 entradas pra 3 estádios.

       Nome diferente pro mesmo gramado — Engenhão/Nilton Santos, Aflitos —
       o identificador não pega: quem sabe é a lista de apelidos do
       próprio estádio, em `estadios.js`. */
    const nomes = new Set();
    for(const e of daPraca){
      nomes.add(U.identificador(e.nome));
      for(const ap of (e.apelidos||[])) nomes.add(U.identificador(ap));
    }
    const bairros = bairrosDe(idMapa);
    /* completa com os estádios que os clubes da praça declaram e que a
       fonte antiga não tinha */
    const fora = [];
    for(const t of timesEm(idMapa)){
      if(!t.estadio || nomes.has(U.identificador(t.estadio))) continue;
      nomes.add(U.identificador(t.estadio));
      const b = bairros.length
        ? bairros[Math.abs(U.identificador(t.estadio).split('')
            .reduce((h,c)=>Math.imul(h^c.charCodeAt(0), 16777619), 2166136261)) % bairros.length]
        : null;
      fora.push({id:U.identificador(t.estadio), nome:t.estadio, mapa:idMapa,
                 bairro: b ? b.nome : '', capacidade:t.capacidade||0,
                 mandantes:[t.id], estimado:true});
    }
    return daPraca.concat(fora);
  }

  /* =======================================================
     RELAÇÕES
     ======================================================= */
  const TIPOS = ['Maior Rival','Rival','Irmandade','Aliado','Neutro'];

  /* GDD §11.1 usa escala −100 a +100. A fonte traz o tipo;
     o número inicial sai daqui e depois evolui com o jogo. */
  const VALOR_INICIAL = {
    'Maior Rival': -85, 'Rival': -45, 'Neutro': 0, 'Aliado': 45, 'Irmandade': 80
  };
  function valorInicial(tipo){ return VALOR_INICIAL[tipo] !== undefined ? VALOR_INICIAL[tipo] : 0; }

  /* caminho inverso: de um número em −100..+100 para o rótulo */
  function statusDoValor(v){
    if(v <= -70) return 'Maior Rival';
    if(v <  -15) return 'Rival';
    if(v <   20) return 'Neutro';
    if(v <   70) return 'Aliado';
    return 'Irmandade';
  }

  /* precedência da fonte: Maior Rival vence Rival, que vence o resto */
  function relacaoBase(idA, idB){
    const a = torcida(idA);
    if(!a || idA===idB) return 'Neutro';
    if((a.maioresRivais||[]).includes(idB)) return 'Maior Rival';
    if((a.rivais||[]).includes(idB))        return 'Rival';
    if((a.irmandade||[]).includes(idB))     return 'Irmandade';
    if((a.aliados||[]).includes(idB))       return 'Aliado';
    return 'Neutro';
  }

  /* =======================================================
     TORCIDA-IRMÃ NÃO BRIGA COM TORCIDA-IRMÃ

     Duas organizadas do MESMO CLUBE ligadas por irmandade não se pegam,
     e isto precisa ser regra e não número. Só o valor inicial de +80 não
     basta: `hostis()` devolve verdadeiro quando a relação cai de −15 OU
     quando a tensão passa de 45, e a tensão passa por cima da relação.
     Com a agressividade de §8.26 a tensão sobe muito mais do que subia,
     e nada garantiria que a de duas irmãs ficasse abaixo de 45 pra
     sempre.

     A regra é geral, e não um remendo pro par Leões da TUF / Jovem Garra
     Tricolor que a motivou: o país tem 29 clubes com mais de uma
     organizada, e o que vale pra um vale pra todos. As duas condições
     são necessárias — mesmo clube E irmandade declarada —, porque
     irmandade entre torcidas de clubes diferentes é aliança forte, não
     parentesco, e aliado se ataca (é traição, e traição tem caminho). */
  function saoIrmas(idA, idB){
    if(!idA || !idB || idA === idB) return false;
    const a = torcida(idA), b = torcida(idB);
    if(!a || !b || !a.clubeId || a.clubeId !== b.clubeId) return false;
    return (a.irmandade||[]).includes(idB) || (b.irmandade||[]).includes(idA);
  }

  function estiloRelacao(tipo){
    const r = (D().regras.relacoes||{})[tipo];
    return r || {ordem:0, corTexto:'#8d8d8d', corFundo:'#333', podeMelhorar:true,
                 podePiorar:true, podeAtacar:true};
  }

  /* todas as relações não neutras de uma torcida, prontas pra tabela */
  function relacoesDe(id){
    const a = torcida(id);
    if(!a) return [];
    const saida = [];
    const juntar = (lista, tipo)=>{
      for(const outro of (lista||[])){
        const o = torcida(outro);
        if(!o) continue;
        saida.push({id:outro, nome:o.nome, clube:o.clube, cidade:o.cidade,
                    uf:o.uf, cores:o.cores, tipo, membros:o.membros});
      }
    };
    juntar(a.maioresRivais,'Maior Rival');
    juntar(a.rivais,       'Rival');
    juntar(a.irmandade,    'Irmandade');
    juntar(a.aliados,      'Aliado');
    /* uma torcida pode aparecer em duas listas; a precedência decide */
    const vistas = new Map();
    for(const r of saida){
      const atual = vistas.get(r.id);
      if(!atual || estiloRelacao(r.tipo).ordem > estiloRelacao(atual.tipo).ordem)
        vistas.set(r.id, r);
    }
    return [...vistas.values()];
  }

  /* =======================================================
     NÚMEROS DERIVADOS
     ======================================================= */
  function influencia(o){
    const c = cidade(o.mapa);
    const peso = c ? U.limitar(c.torcedores/1060, 0, 1) : 0.4;
    const base = U.limitar((o.membros||20)/250, 0, 1);
    return U.limitar(Math.round(base*64 + peso*30), 1, 100);
  }
  const territorios = o => Math.max(1, Math.round((o.membros||20)/16));

  /* tudo que a seleção e a diplomacia precisam, num objeto só */
  /* =======================================================
     A RIVALIDADE MÁXIMA É A DO MESMO TAMANHO (régua do dono,
     22/08/2026): rivalidade não se mede por ordem de lista — a briga
     que interessa é a de igual pra igual. Entre todos os rivais
     declarados, vale o de efetivo mais próximo do nosso; empatou, o
     maior rival declarado tem a preferência, porque vem primeiro.
     ======================================================= */
  function rivalPareado(o){
    const lista = [...(o.maioresRivais||[]), ...(o.rivais||[])]
      .map(id => torcida(id)).filter(Boolean);
    if(!lista.length) return null;
    const meu = o.membros || 0;
    return lista.reduce((a, b)=>
      Math.abs((b.membros||0) - meu) < Math.abs((a.membros||0) - meu) ? b : a);
  }

  function ficha(o){
    const t = time(o.clubeId) || {};
    const c = cidade(o.mapa)  || {};
    const par = rivalPareado(o);
    return {
      id:o.id, nome:o.nome, cores:o.cores, detalhe:o.detalhe,
      fundacao:o.fundacao, membros:o.membros, bairroSede:o.bairroSede,
      clube:o.clube, clubeId:o.clubeId, sigla:o.sigla,
      cidade:c.nome || o.cidade || '', uf:o.uf || t.uf || '',
      regiao:o.regiao || '',
      estadio:o.estadio || t.estadio || '',
      divisao:t.divisao || `Série ${'ABCD'[(o.divisaoClube||1)-1] || '?'}`,
      regional:t.regional || '', mapa:o.mapa,
      grade:c.grade || [8,8], nivelCidade:c.nivel || 3,
      sedeNivel:o.sedeNivel || 1,
      prestigio:o.prestigio || 15, moral:o.moral || 60,
      dinheiro:o.saldo || 0, poder:o.poder || 0,
      influencia:influencia(o), territorios:territorios(o),
      cargos:o.cargos || {},
      rival: par ? par.nome : '—',
      rivalMembros: par ? (par.membros||0) : 0,
      qtdAliados: (o.aliados||[]).length + (o.irmandade||[]).length,
      qtdRivais:  (o.rivais||[]).length + (o.maioresRivais||[]).length
    };
  }

  /* =======================================================
     BAIRROS (GDD §19.3 e §7.2)
     ======================================================= */
  const CLASSES = ['Nobre','Classe Média','Classe Baixa','Favela'];
  const ZONAS   = ['Norte','Sul','Leste','Oeste'];

  const bairrosDe = idCidade => (cidade(idCidade)||{}).bairros || [];

  function bairro(idCidade, nomeOuId){
    const alvo = String(nomeOuId||'').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    return bairrosDe(idCidade).find(b=>
      b.id===alvo ||
      b.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')===alvo);
  }

  /* onde fica a sede desta torcida, como objeto de bairro */
  function bairroDaSede(o){
    return bairro(o.mapa, o.bairroSede);
  }

  /* GDD §7.2: bar, loja e subsede rendem conforme a classe do bairro */
  const multiplicador = b => b ? b.mult : 1.0;

  function bairrosPorZona(idCidade){
    const fora = {};
    for(const z of ZONAS) fora[z] = [];
    for(const b of bairrosDe(idCidade)) (fora[b.zona] = fora[b.zona]||[]).push(b);
    return fora;
  }

  /* =======================================================
     A TORCIDA DO CLUBE NA CIDADE É VIVA (ordem do dono, 02/09/2026)

     O número da planilha é só o PONTO DE PARTIDA: a cada virada de
     ano a fase do clube mexe nele (foi bem: +3 a 5%; foi mal: −3 a
     5%) e a cidade cresce (grande +30–50, média +10–20, pequena
     +5–10 pessoas/ano), com o crescimento repartido de forma NÃO
     proporcional entre os clubes que já têm torcida na praça. O
     valor corrente mora em E.torcedoresEv ("cidade|clube" → n);
     quem quer saber quantos são AGORA pergunta aqui, nunca à
     planilha.
     ======================================================= */
  function torcedoresDoClubeNa(cidadeId, clubeId){
    const E = TO.estado && TO.estado.E;
    const ev = E && E.torcedoresEv;
    const ch = cidadeId + '|' + clubeId;
    if(ev && ev[ch] != null) return ev[ch];
    const c = cidade(cidadeId);
    const t = c && (c.times||[]).find(x=>x.clubeId === clubeId);
    return t ? (t.torcedores||0) : 0;
  }

  /* a virada do ano: `mov` é o sobe-e-desce que a temporada fechou.
     Vai bem = campeão de série, acesso ou G-4 da Série A; vai mal =
     rebaixado ou entre os 4 últimos da Série D. Quem faz os dois no
     mesmo ano (não deveria existir) fica neutro. */
  function evoluirTorcedores(E, mov){
    const S = E && E.temporada;
    if(!S || !S.competicoes) return null;
    const C = TO.competicoes;
    const por = {};
    for(const c of S.competicoes) por[c.nome] = c;
    const bem = new Set(), mal = new Set();
    const A = por['Brasileirão Série A'], D = por['Brasileirão Série D'];
    if(A) for(const id of C.melhores(A, 4)) bem.add(id);
    for(const nome of ['Brasileirão Série A','Brasileirão Série B',
                       'Brasileirão Série C','Brasileirão Série D']){
      const comp = por[nome];
      if(!comp) continue;
      const campeao = comp.campeao || (C.melhores(comp, 1)||[])[0];
      if(campeao) bem.add(campeao);
    }
    for(const m of (mov||[])){
      if(!/Série/.test(m.de || '') || !/Série/.test(m.para || '')) continue;
      (C.subiu(m.de, m.para) ? bem : mal).add(m.id);
    }
    if(D) for(const id of C.piores(D, 4)) mal.add(id);
    for(const id of [...bem]) if(mal.has(id)){ bem.delete(id); mal.delete(id); }

    E.torcedoresEv = E.torcedoresEv || {};
    const irand = n => Math.floor(Math.random()*n);
    const registro = {ano:S.ano, bem:[...bem], mal:[...mal], cidades:{}};
    for(const c of (TO.dados.cidades||[])){
      const ts = c.times || [];
      if(!ts.length) continue;
      /* 1 · a fase do clube mexe na torcida dele em CADA praça */
      for(const t of ts){
        const f = bem.has(t.clubeId) ? 1 + (3 + Math.random()*2)/100
                : mal.has(t.clubeId) ? 1 - (3 + Math.random()*2)/100 : 0;
        if(!f) continue;
        const atual = torcedoresDoClubeNa(c.id, t.clubeId);
        E.torcedoresEv[c.id+'|'+t.clubeId] =
          Math.max(1, Math.round(atual * f));
      }
      /* 2 · a cidade cresce, e o crescimento se reparte de forma NÃO
         proporcional entre quem já tem torcida nela */
      const cresce = c.tamanho === 'Grande' ? 30 + irand(21)
                   : c.tamanho === 'Médio'  ? 10 + irand(11)
                   :                           5 + irand(6);
      registro.cidades[c.id] = cresce;
      const pesos = ts.map(()=>0.2 + Math.random());
      const soma = pesos.reduce((a,b)=>a+b, 0);
      let resto = cresce;
      ts.forEach((t, i)=>{
        const q = i === ts.length-1 ? resto
                : Math.round(cresce * pesos[i] / soma);
        resto -= q;
        if(q <= 0) return;
        E.torcedoresEv[c.id+'|'+t.clubeId] =
          torcedoresDoClubeNa(c.id, t.clubeId) + q;
      });
    }
    E.torcedoresRegistro = registro;
    return registro;
  }

  /* GDD §6.2: base não organizada = torcedores do clube na cidade,
     menos quem já está em alguma organizada daquele clube */
  /* Quem sobra pra recrutar: o torcedor do clube que mora na praça e
     ainda não é de organizada nenhuma. O `vivos` opcional troca o número
     estático da planilha pelo efetivo de agora — sem ele, recrutar não
     encolheria o bolo e a praça viraria fonte infinita. */
  function baseDeRecrutamento(idCidade, idClube, vivos){
    const c = cidade(idCidade);
    if(!c) return 0;
    const t = (c.times||[]).find(x=>x.clubeId===idClube);
    if(!t) return 0;
    const conta = o => (vivos ? vivos(o) : (o.membros||0));
    const organizados = torcidasEm(idCidade)
      .filter(o=>o.clubeId===idClube)
      .reduce((s,o)=>s+conta(o), 0);
    return Math.max(0, torcedoresDoClubeNa(idCidade, idClube) - organizados);
  }

  function sigla(f){
    if(f.sigla) return f.sigla.slice(0,4);
    return (f.nome||'').split(/\s+/).map(p=>p[0]).join('').slice(0,3).toUpperCase();
  }

  /* A SIGLA DA TORCIDA — não a do clube.
     O campo `sigla` do dado é a do TIME: Gaviões traz "SCCP", Camisa 12
     traz "SCCP" e Pavilhão 9 traz "SCCP". No mapa de dia de jogo isso
     fazia as três organizadas do Corinthians virarem o mesmo rótulo, e
     o jogador olhava a rua e via uma torcida só.

     A sigla de verdade vem da planilha do autor, em `siglaTorcida` —
     GAVIOES, C12, P9, CMA, TJF. São 136 das 140. Para as quatro que a
     planilha ainda não tem, ela se deriva do nome:

       · nome de uma palavra vale por si  — GAVIÕES, BAMOR, MOFI
       · nome de várias vira as iniciais  — Mancha Verde → MV,
         Movimento Uniformizado Cruzmaltino → MUC

     Artigo e preposição não contam. Número entra inteiro (Camisa 12 é
     C12, não C1) e palavra que já é sigla entra inteira (Leões da TUF é
     LTUF, Ultras do ABC é UABC).

     Sigla repetida existe de verdade — três torcidas do país se chamam
     RAÇA — e quem resolve isso é quem monta a noite, que sabe quais
     estão na mesma rua. */
  const SEM_PESO = new Set(['da','de','do','das','dos','e','a','o','as','os','em','no','na']);
  function siglaTorcida(t){
    if(t && t.siglaTorcida) return t.siglaTorcida;
    const nome = (typeof t === 'string' ? t : (t && t.nome) || '').trim();
    if(!nome) return '';
    const palavras = nome.split(/[\s/\-]+/).filter(Boolean);
    const fortes = palavras.filter(p=>!SEM_PESO.has(p.toLowerCase()));
    const lista = fortes.length ? fortes : palavras;
    if(lista.length === 1) return lista[0].toUpperCase();
    return lista.map(p=>
      /^\d+$/.test(p) || (p.length >= 2 && p === p.toUpperCase())
        ? p : p[0].toUpperCase()).join('');
  }

  /* AS DUAS CORES DA TORCIDA, e a paleta mente.
     O disco é desenhado em duas camadas: círculo externo na primária,
     miolo na secundária. A primária é sempre `cores[0]`. A secundária
     não é `cores[1]`: cinquenta das 140 torcidas repetem a primária ali
     (`['#FFFFFF','#FFFFFF']`), e pegar cegamente devolveria a mesma cor
     duas vezes — o miolo sumiria dentro do círculo. Vale a primeira de
     `cores[1:]` seguida de `detalhe` que seja DIFERENTE da primária;
     não havendo nenhuma, a secundária é nula e o miolo cai no tom claro
     genérico do lado, que é o que o jogo já fazia. */
  /* duas cores quase iguais não contam como duas: sem isto a paleta
     completada pelo clube dava dois azuis gêmeos no mesmo disco */
  function coresParecidas(a, b){
    const n = c => [1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
    const [r1,g1,b1] = n(a), [r2,g2,b2] = n(b);
    return Math.hypot(r1-r2, g1-g2, b1-b2) < 60;
  }
  function coresDaTorcida(o){
    const lista = [...((o && o.cores) || []), o && o.detalhe]
      .filter(Boolean).map(c=>String(c).toUpperCase());
    /* TODAS as cores são da torcida (pedido do dono, 18/08/2026): a
       fonte de muitas é curta — a TUF vem só com branco e azul —,
       então a paleta se completa com as cores do CLUBE, que é de onde
       a camisa vem (o Fortaleza é tricolor, a TUF também). */
    const t = o && o.clubeId ? time(o.clubeId) : null;
    for(const c of (t && t.cores) || [])
      lista.push(String(c).toUpperCase());
    const dist = [];
    for(const c of lista){
      if(!/^#[0-9A-F]{6}$/.test(c)) continue;
      if(!dist.some(x => coresParecidas(x, c))) dist.push(c);
      if(dist.length === 3) break;
    }
    return {cor: dist[0] || null, cor2: dist[1] || null,
            cor3: dist[2] || null};
  }

  function adversario(idClube){
    const meu = time(idClube);
    if(!meu) return T()[0];
    const mesma = T().filter(t=>t.id!==idClube && t.divisao===meu.divisao);
    const pool = mesma.length ? mesma : T().filter(t=>t.id!==idClube);
    return pool[Math.floor(U.rng()*pool.length)];
  }

  function divisoes(){
    return [...new Set(T().map(t=>t.divisao).filter(Boolean))].sort();
  }
  function regioes(){
    return [...new Set(O().map(o=>o.regiao).filter(Boolean))].sort();
  }

  /* =======================================================
     O NOME DO JOGADOR

     O jogo só tem a força do clube como número; jogador não é entidade.
     Mas duas mensagens do feed precisam de um nome — a contratação e a
     aposentadoria do ídolo —, e "o clube contratou um jogador" é a
     mensagem confessando que não sabe do que fala.

     NÃO USA `apelidos`. Aquela lista é de apelido de rua — Pitbull,
     Gordo, Fumaça, Trovão — e é dos membros da torcida. Um atacante
     chamado Pitbull denuncia que os dois saíram do mesmo saco.

     QUATRO FORMAS, com peso, que é como o futebol brasileiro de fato
     nomeia: primeiro nome só e diminutivo puxam a maior parte, composto
     vem no meio, sobrenome só é minoria.

     O NOME É ESTÁVEL. Ele sai do hash de clube + ano + índice, então o
     jogador contratado numa semana e aposentado três temporadas depois
     é o mesmo sujeito. Nada é sorteado na hora de escrever a mensagem.
     ======================================================= */
  function hashN(txt){
    let h = 2166136261 >>> 0;
    for(let i=0;i<txt.length;i++){
      h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0;
    }
    h ^= h >>> 15; h = Math.imul(h, 2246822507) >>> 0;
    h ^= h >>> 13; h = Math.imul(h, 3266489909) >>> 0;
    h ^= h >>> 16;
    return h >>> 0;
  }
  const VOGAIS = 'aeiouáéíóúâêôãõ';
  /* Pedro → Pedrinho, Diego → Dieguinho, Marco → Marquinho. A grafia
     acompanha o som: antes de `i` o `g` vira `gu` e o `c` vira `qu`.
     Nome terminado em consoante NÃO vira diminutivo aqui — "Lucasinho"
     não existe, e o certo ("Luquinhas") é irregular demais pra regra. */
  function diminutivo(nome){
    const ult = nome[nome.length-1].toLowerCase();
    if(VOGAIS.indexOf(ult) < 0) return null;
    let base = nome.slice(0, -1);
    const fim = base[base.length-1].toLowerCase();
    if(fim === 'g') base += 'u';
    else if(fim === 'c') base = base.slice(0,-1) + 'qu';
    if(base.length < 3) return null;
    return base + 'inho';
  }
  /* Pedro → Pedrão, Marcelo → Marcelão. O aumentativo não muda grafia:
     antes de `ã` o `g` e o `c` continuam com o som que já tinham. */
  function aumentativo(nome){
    const ult = nome[nome.length-1].toLowerCase();
    if(VOGAIS.indexOf(ult) < 0) return null;
    let base = nome.slice(0, -1);
    /* Wallace → Wallação, não "Wallacão": antes de `ã` o `c` teria som
       de /k/, e o apelido que o rádio grita é com cedilha */
    if(base[base.length-1].toLowerCase() === 'c')
      base = base.slice(0,-1) + 'ç';
    return base.length < 3 ? null : base + 'ão';
  }

  /* peso acumulado das quatro formas */
  const FORMAS = [
    {id:'simples',    peso:34},
    {id:'diminutivo', peso:34},
    {id:'composto',   peso:22},
    {id:'sobrenome',  peso:10}
  ];

  /* A lista de compostos serve os MEMBROS da torcida e tem nome de
     mulher dentro. Time de futebol masculino não contrata Ana Paula, e
     a mensagem que diz que contratou está mentindo sobre o mundo. */
  const NAO_JOGADOR = new Set(['Ana Paula']);

  function nomeDeJogador(clubeId, ano, indice){
    /* as listas vivem em `TO.dados.nomes`, não na diplomacia */
    const N = (TO.dados && TO.dados.nomes) || {};
    const simples = N.simples || ['Pedro'];
    const comp = (N.compostos || ['João Paulo']).filter(x=>!NAO_JOGADOR.has(x));
    const sobre = N.sobrenomes || ['Silva'];
    const ch = `jog|${clubeId||'x'}|${ano||0}|${indice||0}`;
    const r = hashN(ch) % 100;
    let acc = 0, forma = 'simples';
    for(const f of FORMAS){ acc += f.peso; if(r < acc){ forma = f.id; break; } }
    const base = simples[hashN(ch+'|s') % simples.length];
    if(forma === 'composto')  return comp[hashN(ch+'|c') % comp.length];
    if(forma === 'sobrenome') return sobre[hashN(ch+'|b') % sobre.length];
    if(forma === 'diminutivo'){
      const grande = hashN(ch+'|g') % 100 < 35;
      /* "dando ruim, cai na forma anterior": consoante no fim não vira
         diminutivo, e o nome sai simples */
      const v = grande ? aumentativo(base) : diminutivo(base);
      return v || base;
    }
    return base;
  }

  return {time, torcida, cidade, jogaveis, selecionaveis, PRACA_JOGAVEL,
          nomeDeJogador,
          torcidasDe, torcidasEm, timesEm,
          CLASSES, ZONAS, bairrosDe, bairro, bairroDaSede, multiplicador,
          bairrosPorZona, baseDeRecrutamento,
          torcedoresDoClubeNa, evoluirTorcedores,
          estadio, estadiosEm, estadioDoClube,
          TIPOS, valorInicial, statusDoValor, relacaoBase, saoIrmas,
          estiloRelacao, relacoesDe,
          influencia, territorios, ficha, sigla, siglaTorcida, coresDaTorcida,
          adversario,
          divisoes, regioes,
          get parametros(){return D().parametros || {};},
          get todasTorcidas(){return O();},
          get todosTimes(){return T();},
          get todasCidades(){return C();}};
})();
