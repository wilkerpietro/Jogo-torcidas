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

  /* Quem dá pra COMANDAR. O mundo inteiro roda com as 139 torcidas, mas
     começar uma partida exige uma praça que o mapa saiba desenhar por
     inteiro — as cinco cidades Grandes do GDD §10.1. Nelas os bairros
     chegam a 16 e a cruz por zona fecha nos quatro lados; numa praça
     Pequena de 8 bairros a cidade sai magra demais pra sustentar uma
     temporada de briga de rua. As outras continuam existindo, brigando e
     aparecendo no noticiário — só não são jogáveis. */
  const PRACA_JOGAVEL = 'Grande';
  const selecionaveis = () => jogaveis().filter(o=>{
    const c = cidade(o.mapa);
    return c && c.tamanho === PRACA_JOGAVEL;
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
  function ficha(o){
    const t = time(o.clubeId) || {};
    const c = cidade(o.mapa)  || {};
    const rel = relacoesDe(o.id);
    const maior = rel.find(r=>r.tipo==='Maior Rival')
               || rel.find(r=>r.tipo==='Rival');
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
      rival: maior ? maior.nome : '—',
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
    return Math.max(0, (t.torcedores||0) - organizados);
  }

  function sigla(f){
    if(f.sigla) return f.sigla.slice(0,4);
    return (f.nome||'').split(/\s+/).map(p=>p[0]).join('').slice(0,3).toUpperCase();
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

  return {time, torcida, cidade, jogaveis, selecionaveis, PRACA_JOGAVEL,
          torcidasDe, torcidasEm, timesEm,
          CLASSES, ZONAS, bairrosDe, bairro, bairroDaSede, multiplicador,
          bairrosPorZona, baseDeRecrutamento,
          estadio, estadiosEm, estadioDoClube,
          TIPOS, valorInicial, statusDoValor, relacaoBase, estiloRelacao, relacoesDe,
          influencia, territorios, ficha, sigla, adversario, divisoes, regioes,
          get parametros(){return D().parametros || {};},
          get todasTorcidas(){return O();},
          get todosTimes(){return T();},
          get todasCidades(){return C();}};
})();
