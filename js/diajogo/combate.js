/* =========================================================
   COMBATE — discos, formações, moral, debandada
   Roda sobre a cena de arredores.js: toda locomoção passa
   pela malha de caminhabilidade, ninguém anda em cima de casa.
   ========================================================= */
window.TO = window.TO || {};
TO.diaJogo = TO.diaJogo || {};

/* ---------- parâmetros de calibragem ---------- */
/* Os números que ficaram depois de calibrar na bancada. Efetivo é o
   único que não é padrão de verdade: no jogo ele vem da escalação da
   semana e do tamanho do bonde rival, e o valor aqui só serve pra
   cena aberta solta. */
TO.diaJogo.P = {
  efetivo:34, efetivoRival:30,
  velocidade:60, dano:1.0,
  vidaGrade:420, forcaPM:18, debandada:30,
  atrasoCarga:7, tropaCarga:8, duracaoCarga:18, aguentaPM:10,
  cdPedra:2, cdBomba:2.5, alcancePedra:170, alcanceBomba:210,
  bombas:4, bombasRival:2, chancePaz:50,
  /* noite tranquila nos arredores: o relógio da cena anda 0,6 min por
     segundo, e o pessoal fica de conversa em volta do próprio ponto até
     faltar isto pra bola rolar.
     raioVadiagem era 200, feito pra trinta discos. Com o efetivo de
     verdade — 250 da Gaviões — duzentos pixels são um formigueiro: é o
     mesmo espaço pra oito vezes mais gente. */
  minutosAteJogo:150, entrarFaltando:[25,20], raioVadiagem:800
};

TO.diaJogo.combate = (function(){
  const OUTRO_LADO = {mandante:'visitante', visitante:'mandante'};
  const U = TO.util;
  const A = TO.diaJogo.arredores;
  const P = TO.diaJogo.P;
  /* A cena pode trocar no ar (arredores, praça, rua), então D não pode ser
     uma referência congelada no carregamento do módulo. */
  const D = new Proxy({}, {
    get:(_, k)=>A.D[k],
    set:(_, k, v)=>{ A.D[k] = v; return true; },
    has:(_, k)=>k in A.D,
    ownKeys:()=>Reflect.ownKeys(A.D),
    getOwnPropertyDescriptor:(_, k)=>
      Object.getOwnPropertyDescriptor(A.D, k) ||
      {configurable:true, enumerable:true, value:A.D[k]}
  });

  const FORMACOES={
    bonde    :{nome:'Bonde',    tecla:'1', desc:'coluna'},
    muralha  :{nome:'Muralha',  tecla:'2', desc:'linha'},
    investida:{nome:'Quadrado',tecla:'3', desc:'bloco fechado atrás do líder'},
    espalhar :{nome:'Espalhar', tecla:'4', desc:'aberto'}
  };

  const inimigos=(a,b)=> a!==b;

  /* =======================================================
     DISCO
     ======================================================= */
  class Disco{
    constructor(nome,lado,spawn,x,y,lider){
      this.nome=nome; this.lado=lado;
      this.spawn=spawn.id; this.entrada=spawn.entrada;
      this.escalao=spawn.rot;
      /* quem nasce de guarda está no lugar dele, não indo pra lugar
         nenhum: fica onde nasceu até a cena acordar (D.gatilho).
         `guarda` cai quando a casa acorda; `daCasa` não cai nunca — é
         quem tem pra onde voltar quando a briga acaba. */
      this.guarda=!!spawn.guarda;
      this.daCasa=!!spawn.guarda;
      this.x=x; this.y=y; this.vx=0; this.vy=0;
      this.r=lider?9:7; this.lider=!!lider;
      /* O LÍDER É 20/20 E SÓ (decisão do autor): topo da régua dos
         membros, mas a MESMA régua — nada de vida extra nem bônus
         escondido que o faça valer por três. */
      this.forca  = lider?20:5+U.inteiro(0,8);
      this.defesa = lider?20:4+U.inteiro(0,8);
      this.hpMax  = lider?90+20*7:150; this.hp=this.hpMax;
      this.moral=12;
      this.caido=false; this.preso=false; this.fugindo=false; this.entrou=false;
      this.entrando=false;  // recebeu ordem de ir pro portão do escalão
      this.correEm=null;    // debandou, mas ainda não virou as costas
      this.agarrado=0;      // segundos de mão em cima enquanto foge
      this.sumiu=false;     // debandou e saiu da cena por uma boca de rua
      this.voltando=false;  // defendeu, ganhou, e está voltando pro posto
      this.vadiando=false;  // noite tranquila: fica de conversa até a hora
      this.atordoado=0; this.tremor=0; this.golpe=0; this.hostil=0;
      this.membroId=null;   // costura com a gestão
    }
    get vivo(){return !this.caido && !this.preso && !this.entrou && !this.sumiu;}
  }

  class Policial{
    constructor(posto){
      this.postoX=posto.x; this.postoY=posto.y;
      this.x=posto.x; this.y=posto.y; this.vx=0; this.vy=0;
      this.r=9; this.hpMax=340; this.hp=this.hpMax;
      this.caido=false; this.giro=U.entre(0,7); this.cooldown=0; this.carga=false;
    }
    get vivo(){return !this.caido;}
  }

  class Projetil{
    constructor(x,y,ax,ay,tipo,lado){
      this.x=x; this.y=y; this.tipo=tipo; this.lado=lado;
      const dx=ax-x, dy=ay-y, d=Math.hypot(dx,dy)||1;
      const v = tipo==='pedra'?430:300;
      this.vx=dx/d*v; this.vy=dy/d*v;
      this.t=0; this.dur=d/v; this.morto=false;
    }
  }

  /* =======================================================
     ESTADO
     ======================================================= */
  /* BOMBA EM TODO CONFRONTO (régua do dono, 18/08/2026): o estoque
     inteiro da torcida está na mochila em qualquer cena — rua, praça,
     arredores, bar, sede, CT —, planejada ou não. A única exceção é a
     cena declarada sem armas: a treta 5×5/7×7/10×10, que é mano a
     mano. */
  function bombasDaCena(cfg){
    if(cfg.semArmas) return 0;
    const base = cfg.bombas !== undefined ? cfg.bombas : P.bombas;
    const E = TO.estado && TO.estado.E;
    const estoque = (E && E.estoque && E.estoque.bombas) || 0;
    return Math.max(base || 0, estoque);
  }

  function criarEstado(cfg){
    cfg=cfg||{};
    /* campo de fluxo é geometria da cena que estava no ar. Trocar de
       cena sem limpar faz o bonde de 'mandante1' andar pro spawn da
       cena anterior, que na nova é dentro de um prédio. */
    for(const k in camposSpawn) delete camposSpawn[k];
    cacheFuga = {versao:-1, lista:null};
    const J={
      t:0, fase:'ativo',
      discos:[], policiais:[], projeteis:[], grades:A.montarGrades(),
      form:'bonde',
      /* o estoque da noite vem do planejamento da semana */
      /* cena combinada não tem projétil de lado nenhum: nem pedra, nem
         bomba, nem braço automático (decisão do dono, 17/08/2026) */
      semArmas: !!cfg.semArmas,
      bombas: bombasDaCena(cfg),
      bombasIniciais: bombasDaCena(cfg),
      /* do outro lado também tem quem junte pedra: sem isso a briga é
         um lado bombardeando e o outro correndo pra cima na mão */
      /* metade do que você levou, no mínimo uma — mas SÓ se você levou.
         O mínimo de uma valia até pra cena declarada sem bomba (treta é
         mano a mano), e uma bomba única no bonde pareado de 7 atordoava
         o lado inteiro por 1,1 s com o deles batendo por cima: medido,
         era ela que virava o 7×7 em 7×0 contra nós. Briga sem bomba
         nossa é briga sem bomba deles. */
      rivalInfo: cfg.rival || null,
      /* o estoque DELES agora existe (decisão do dono, 18/08/2026): a
         metade-do-nosso continua sendo o teto da cena, mas ninguém
         joga bomba que não comprou — se o perfil da torcida diz
         quantas ela tem no paiol, a cena não passa disso. Perfil sem
         estoque declarado (bancada, cena solta) segue a regra velha. */
      bombasRival: cfg.bombasRival!==undefined ? cfg.bombasRival
                 : (n => {
                     const meia = n>0 ? Math.max(1, Math.ceil(n/2)) : 0;
                     const perfil = cfg.perfilRival ||
                       (((cfg.bondes||[]).find(b=>!b.nossa))||{}).perfil;
                     const paiol = perfil ? perfil.bombas : null;
                     return paiol == null ? meia : Math.min(meia, paiol);
                   })(bombasDaCena(cfg)),
      /* ele não começa jogando: nos primeiros segundos o bonde ainda
         está em coluna no spawn, e uma bomba ali derruba doze de uma
         vez antes de o jogador ter chance de abrir a formação */
      cdRival:8,
      alerta: 12 + (cfg.intencao==='atacar' ? 8 : 0), rompido:false, reforco:0,
      cargaEm:null, cargaAte:0, tropaVeio:false,
      sobPressao:0, fracPM:0, avisouPM:false,
      recuando:false, recuoVisitante:false,
      /* quem sai pra atacar não tem noite tranquila (GDD §15.4) */
      /* Nos arredores a noite SEMPRE começa tranquila: ninguém desce do
         ônibus batendo, e quem veio disposto ainda vai levar um tempo
         pra ir atrás. Nas outras cenas o interruptor continua sendo da
         cena inteira, porque lá a briga já é o motivo de estar ali. */
      paz: cfg.paz!==undefined ? cfg.paz
         : !D.id ? true
         : cfg.intencao==='atacar' ? false : U.rng()*100 < P.chancePaz,
      intencao: cfg.intencao || 'paz', cdClima:0,
      config_perfilRival: cfg.perfilRival || null,
      /* onde a briga cai: arredores do estádio, praça ou rua. Muda o
         tamanho do bonde rival e a pressa da PM (GDD §12). */
      local: cfg.local || 'arredores',
      efetivoRival: cfg.efetivoRival || P.efetivoRival,
      /* Quem de fato chegou na esplanada, vindo do mapa da cidade: cada
         bonde traz o efetivo que sobrou da caminhada e a cor da torcida.
         Sem isso a cena inventava 30 discos genéricos por lado. */
      bondes_: cfg.bondes || null,
      cdPedraAte:0, cdBombaAte:0,
      entraram:{}, presos:0,
      caidos:{mandante:0, visitante:0}, presosPor:{mandante:0, visitante:0},
      sumiram:{mandante:0, visitante:0},
      armas:{mandante:{pedra:0,bomba:0}, visitante:{pedra:0,bomba:0}},
      total:{mandante:0, visitante:0},
      debandou:{}, debandouPor:{}, entrando:false, entrarAte:0,
      log:[], aviso:null, avisoAte:0,
      versaoGrades:0,
      /* cena com gatilho começa dormindo: quem defende está dentro e
         ainda não sabe de nada. Sem gatilho, tudo acordado, como sempre. */
      acordou: !D.gatilho,
      /* nos arredores o humor não é da cena, é de cada bonde */
      bondes:{}
    };

    for(const g of J.grades){ g.hpMax=P.vidaGrade; g.hp=P.vidaGrade; }
    for(const p of D.pmPostos) J.policiais.push(new Policial(p));

    /* ---- povoa cada spawn ----
       Com escalação, cada disco É um membro: nome, força, defesa e moral
       vêm da ficha, e o id volta no fim pra virar Ferido ou Preso.
       Sem escalação (página solta da cena), gera gente fictícia. */
    /* o apelido do figurante segue o país da nossa torcida: numa treta
       em Buenos Aires o disco se chama Zurdo, não Pitbull */
    const nomes=U.embaralhar(bancoDeApelidos());

    /* Quem cria disco é o BONDE, não o portão. Um portão pode receber dois
       bondes num clássico, e cada um traz a sua cor e o seu efetivo: se a
       Gaviões veio com 250 do mapa da cidade, nascem 250. Sem bonde — a
       página solta da cena — cada portão gera pelo efetivo do parâmetro,
       que é como era antes. */
    const porLado = {mandante:[], visitante:[]};
    for(const b of (J.bondes_ || [])) (porLado[b.lado] || porLado.mandante).push(b);
    /* DE QUE LADO NÓS ESTAMOS, antes de existir disco pra perguntar:
       quem diz é o bonde marcado `nossa`. Atacando em viagem ele vem
       como visitante, e é isso que faz a escalação nascer nos spawns
       certos. Sem bonde nenhum — a página solta da cena —, mandante,
       que é como sempre foi. */
    const ladoCfg = ((J.bondes_ || []).find(b=>b.nossa) || {}).lado || 'mandante';
    J.ladoNosso = ladoCfg;
    /* o nosso primeiro na fila: é dele o portão do jogador. EXCETO na
       cena de setores (arquibancada, 19/08/2026): lá o spawn é o
       ESCALÃO — a fila já vem ordenada por tamanho e o líder continua
       no bonde `nossa`, onde quer que ele sente. */
    const iNosso = porLado[ladoCfg].findIndex(b=>b.nossa);
    if(iNosso > 0 && !cfg.setores)
      porLado[ladoCfg].unshift(porLado[ladoCfg].splice(iNosso, 1)[0]);

    const temEscalacao = !!(cfg.escalacao && cfg.escalacao.length);
    const grupos = [];
    for(const lado of ['mandante','visitante']){
      const spawns = D.spawns.filter(s=>s.lado === lado);
      if(!spawns.length) continue;
      const fila = porLado[lado];
      if(fila.length){
        /* portão do jogador na frente, pra casar com o nosso bonde */
        const ordem = spawns.slice().sort((a,b)=>(b.jogador?1:0)-(a.jogador?1:0));
        /* UM BONDE, DOIS PONTOS (cenas de emboscada, régua do dono
           20/08/2026): quem é atacado fica espalhado em volta do ônibus
           — a cena marca dois spawns pra isso. Sem espalhar, um bonde
           tomava um spawn só e o outro ficava vazio.
           MAS QUEM ATACA VEM EM UMA TURMA SÓ (correção do dono,
           22/08/2026): emboscada é bonde que desce junto, não dois
           grupos entrando por pontas opostas. Por isso o `espalharBonde`
           deixou de ser interruptor da cena inteira e passa a dizer QUAL
           LADO se espalha — nas duas emboscadas, só o lado emboscado. */
        const espalha = D.espalharBonde === true || D.espalharBonde === lado;
        if(espalha && fila.length === 1 && ordem.length > 1){
          const b = fila[0], k = ordem.length;
          const base = Math.floor(Math.max(k, Math.round(b.n)) / k);
          const sobra = Math.max(k, Math.round(b.n)) - base*k;
          ordem.forEach((s, i)=> grupos.push({s, bonde:b,
                                              qtd: base + (i < sobra ? 1 : 0)}));
        } else {
          fila.forEach((b, i)=> grupos.push({s:ordem[i % ordem.length], bonde:b,
                                             qtd:Math.max(1, Math.round(b.n))}));
        }
      } else {
        /* com escalação e sem bonde, quem diz o tamanho é a escalação */
        /* sem bonde vindo do mapa, o nosso lado é o que a cena marcou
           como do jogador — e não o mandante por decreto */
        const base = (lado === ladoCfg && temEscalacao) ? 0
          : Math.max(1, Math.round(
              (lado===ladoCfg?P.efetivo:J.efetivoRival)/contarSpawns(lado)));
        for(const s of spawns) grupos.push({s, bonde:null, qtd:base});
      }
    }

    /* A escalação diz quem tem NOME — força, defesa, ficha e consequência
       depois da briga. Ela não diz quantos foram: o resto é povão, sem
       ficha, que é o que o povão é. Quando o bonde veio do mapa os
       escalados são todos NOSSOS; sem bonde, se espalham pelos portões de
       casa, como era antes. */
    const nossos = grupos.filter(g=>g.bonde ? g.bonde.nossa : g.s.lado === ladoCfg);
    const alvo = nossos.length ? nossos : grupos.filter(g=>g.s.lado === ladoCfg);
    /* O LÍDER VAI NO BONDE `nossa`, e não no spawn que o dado marcou
       como do jogador: `jogador:true` está cravado em `mandante1` no
       `cena_arredores.js`, e atacando em viagem o nosso bonde nasce do
       lado visitante. A bandeira do dado vira reserva, pra a página
       solta da cena, que não tem bonde nenhum. */
    const grupoLider = alvo.find(g=>g.bonde && g.bonde.nossa)
                    || alvo.find(g=>g.s.jogador) || alvo[0] || null;
    const fichas = new Map();
    if(temEscalacao && grupoLider){
      /* o mais rodado vai no bonde do jogador e vira o líder */
      const fila=[...cfg.escalacao].sort((a,b)=>b.xp-a.xp);
      fichas.set(grupoLider, [fila.shift()]);
      let k=0;
      for(const m of fila){
        const g = alvo[k++ % alvo.length];
        if(!fichas.has(g)) fichas.set(g, []);
        fichas.get(g).push(m);
      }
    }

    /* o líder não depende da escalação: `grupoLider` sai do grupo do
       nosso portão, e a escalação só decide se ele tem NOME e ficha.
       Conferido com escalação vazia: líder existe e anda. */
    for(const g of grupos)
      nascerGrupo(J, g, fichas.get(g) || [], g === grupoLider, nomes);

    /* =======================================================
       O HUMOR DE CADA BONDE (só nos arredores)
       Ali não há dois lados numa briga marcada: há vários bondes
       chegando pro mesmo jogo, e cada um vem com a sua intenção. A
       noite SEMPRE começa tranquila — ninguém sai do ônibus batendo —,
       mas quem veio disposto vai procurar o rival em algum momento, e
       é a tensão entre as torcidas que diz quantos vieram assim.

       O seu bonde fica de fora do sorteio: ele te segue, é o que você
       manda, e não tem programação própria nenhuma.
       ======================================================= */
    if(fugaPelaEntrada()){
      const tensao = cfg.tensao!==undefined ? cfg.tensao : 20;
      /* Calmaria quase não gera hostil; Guerra gera quase todo mundo */
      const chance = Math.min(90, 3 + tensao*0.85);
      const ateJogo = P.minutosAteJogo/0.6;
      for(const s of D.spawns){
        const b = {id:s.id, rot:s.rot||s.id, lado:s.lado,
                   jogador:!!s.jogador, humor:'paz', agirEm:Infinity};
        if(!s.jogador && U.rng()*100 < chance){
          b.humor='atacar';
          /* e mesmo esse não sai atrás de ninguém no primeiro segundo:
             espera, mistura-se, e só depois vai. A noite começa igual
             pros dois casos — o que muda é como ela termina.

             A janela para em 55% do caminho: quem sai depois disso
             chega no ponto do rival quando o rival já entrou, e a
             hostilidade não vira nada. */
          b.agirEm = U.entre(0.20, 0.55) * ateJogo;
          const inimigos = D.spawns.filter(o=>o.lado!==s.lado);
          if(inimigos.length) b.alvo = U.escolher(inimigos).id;
        }
        J.bondes[s.id]=b;
      }
    }

    /* =======================================================
       NOITE TRANQUILA NOS ARREDORES
       Sem briga, ninguém marcha pro portão no primeiro segundo: fica
       de conversa em volta de onde chegou e entra na hora de entrar.
       E não entram todos juntos — cada escalão tem o seu momento
       dentro da janela, e dentro do escalão cada um sai com alguns
       segundos de diferença. Torcida inteira partindo no mesmo quadro
       é a coisa mais artificial que essa cena pode fazer.
       ======================================================= */
    if(fugaPelaEntrada()){
      const grupos=D.spawns.map(s=>s.id);
      const [cedo, tarde]=P.entrarFaltando;
      /* a janela é fechada: o primeiro escalão sai faltando 25 min e o
         último tem de estar dentro faltando 20, contando o sorteio de
         cada um. Por isso o passo entre grupos para 1,5 min antes do
         fim da janela — é esse 1,5 que o sorteio individual gasta. */
      const FOLGA=1.5;
      for(const d of J.discos){
        if(d.lider) continue;      // o líder é do jogador, ele decide
        const g=Math.max(0, grupos.indexOf(d.spawn));
        const passo=grupos.length>1 ? (cedo-tarde-FOLGA)/(grupos.length-1) : 0;
        /* relógio curto (a bancada baixa isto pra dar pra ver a cena
           sem esperar a noite) não pode pedir que entrem antes de a
           cena começar: a janela encolhe junto */
        const faltando=Math.min(cedo - g*passo, P.minutosAteJogo*0.7);
        d.vadiando=true;
        d.entraEm=(P.minutosAteJogo - faltando)/0.6 + U.entre(0, FOLGA/0.6);
      }
    }

    /* PEDRA NOSSA É SEMPRE MANUAL (decisão do dono, 17/08/2026): o
       braço automático existe SÓ do lado da IA — o nosso arremesso é
       decisão do jogador, nas teclas Q e E. E em cena sem armas
       (treta marcada) ninguém taca nada. */
    J.bracos = {};
    if(!J.semArmas){
      const ladoIA = (J.ladoNosso||'mandante')==='mandante'
                   ? 'visitante' : 'mandante';
      const doLado=J.discos.filter(d=>d.lado===ladoIA);
      if(doLado.length){
        const braco=doLado.reduce((a,b)=> b.forca>a.forca ? b : a);
        braco.arremessador=true;
        J.bracos[ladoIA]=braco;
      }
    }
    J.bracoRival = J.bracos[(J.ladoNosso||'mandante')==='mandante'
                            ? 'visitante' : 'mandante'] || null;
    conferirPortoes(J);
    return J;
  }

  /* PORTÃO SELADO É BUG DE ARTE, E BUG DE ARTE TEM DE APARECER.
     A cena pode ser repintada, a máscara pode ganhar um prédio e uma
     grade de fila pode crescer dois módulos — qualquer uma dessas
     coisas fecha um funil e deixa um escalão sem caminho até o portão
     dele. Foi o que aconteceu com a `fila_m1`, e o sintoma foi um botão
     cinza que ninguém sabia explicar. Então, ao montar a cena, cada
     spawn pergunta se chega no portão que lhe deram; quem não chega vai
     pro log da cena e pro console, com nome e sobrenome. Custa quatro
     BFS de 24 mil células, uma vez por cena — e os campos ficam no
     cache, que o combate ia construir de qualquer jeito. */
  /* MENOS NA ARQUIBANCADA, ONDE NINGUÉM VAI PRO PORTÃO.
     Lá o túnel é objetivo do LÍDER, não rota de todo mundo: quem
     debanda some pelas bocas da máscara e quem está de pé marcha pro
     setor rival. Divisória entre setores da casa é coisa que existe em
     estádio, e o 3º escalão não chegar ao túnel do 1º não é bug de
     arte — só o setor do jogador precisa da rota. */
  function conferirPortoes(J){
    const selados=[];
    const soDoJogador = !fugaPelaEntrada();
    for(const s of D.spawns){
      if(soDoJogador && !s.jogador) continue;
      const e=D.entradas.find(x=>x.id===s.entrada);
      if(!e){ selados.push({spawn:s.id, portao:s.entrada||'(nenhum)',
                            motivo:'portão não existe na cena'}); continue; }
      const campo=A.campoDaEntrada(e.id, J.grades, J.versaoGrades);
      if(campo.passo(s.x, s.y).semRota)
        selados.push({spawn:s.id, portao:e.id, motivo:'sem rota'});
    }
    for(const p of selados){
      const msg=`cena '${D.id||'arredores'}': ${p.spawn} não tem rota até `+
                `${p.portao} (${p.motivo})`;
      console.warn('[cena] PORTÃO SELADO —', msg);
      logar(J, 'PORTÃO SELADO: '+msg, 'r');
    }
    J.portoesSelados=selados;
    return selados;
  }
  function contarSpawns(lado){
    return D.spawns.filter(s=>s.lado===lado).length||1;
  }

  /* =======================================================
     NASCER UM GRUPO NA CENA

     Um bonde vira discos aqui. Fica separado de `montar` porque a
     esplanada não é uma foto: quem ainda estava na rua quando a briga
     começou chega no meio dela, e chega por este mesmo caminho.
     ======================================================= */
  /* A FICHA GERADA DO RIVAL (decisão do autor): o disco deles replica
     os dados dos membros da torcida dele — a mesma distribuição de
     cargos da fonte e o mesmo bônus de poder que geram os NOSSOS
     membros em povoarInicial. Força dá dano, defesa segura dano, dos
     dois lados pela mesma régua. */
  const ESCADA_CARGO = ['diretoria', 'frente', 'componente', 'novato'];
  function fichasDoPerfil(perfil, qtd){
    const p = perfil || {};
    const CARGOS = TO.membros.CARGOS;
    /* O PLANTEL INTEIRO PRIMEIRO, os melhores depois. O nosso lado leva
       os N mais rodados da torcida; sortear o lado deles da
       distribuição crua punha a nossa elite contra novato — medido,
       5×5 terminava 5×0 sempre. Quem marca treta também leva os
       melhores que tem: gera o plantel do tamanho da torcida deles e
       corta o topo, que é a MESMA seleção que fazemos. */
    const tamanho = Math.max(qtd, Math.min(p.membros || 60, 250));
    /* O QUADRO VIVO DELAS manda (régua do dono, 20/08/2026): quem
       treinou e promovou chega na cena com a ficha que ganhou, e não
       com a pirâmide congelada da fonte. Perfil sem quadro (bancada,
       cena solta, tela de seleção) segue a conta antiga. */
    const q = p.quadro;
    const plano = q ? ESCADA_CARGO
        .map(c => [c, Math.round((q.cargos[c] || 0) * tamanho /
                                 Math.max(1, q.total))])
        .filter(([,n]) => n > 0)
      : TO.membros.planoDeCargos(tamanho, p.cargos);
    /* SEM BÔNUS DE PODER (decisão do dono, 18/08/2026): a ficha do
       rival sai só do cargo, a mesma régua da média do ranking. */
    /* professor de MMA delas (decisão do dono, 18/08/2026): torcida
       que paga o professor tem gente mais treinada — +1 por cabeça,
       o espelho do treino em dobro do jogador */
    const mma = p.mma ? 1 : 0;
    /* a moral deles vem da moral viva da torcida no mundo (a mesma
       régua do nosso povoarInicial: indicador ±3), não de um 12 fixo */
    const moralBase = Math.round(p.moral !== undefined ? p.moral : 12);
    const BASE = {novato:1, componente:5, frente:10, diretoria:14};
    const fora = [];
    for(const [cargo, n] of plano){
      const teto = (CARGOS[cargo] || CARGOS.novato).teto;
      /* com quadro vivo, a ficha nasce em volta da média TREINADA do
         cargo; o professor já está dentro dela, pelo treino em dobro */
      const media = q && q.forca[cargo] != null ? q.forca[cargo] : null;
      const tira = () => media != null
        ? U.limitar(Math.round(media + U.entre(-1.5, 1.5)), 1, teto)
        : Math.min(teto, (BASE[cargo]||1) + U.inteiro(0,3) + mma);
      for(let i=0;i<n && fora.length<tamanho;i++)
        fora.push({cargo, forca: tira(), defesa: tira(),
          moral:  U.limitar(moralBase + U.inteiro(-3,3), 1, 20)});
    }
    while(fora.length < tamanho)
      fora.push({cargo:'novato', forca:1+U.inteiro(0,3)+mma,
                 defesa:1+U.inteiro(0,3)+mma, moral:moralBase});
    return fora.sort((a,b)=>(b.forca+b.defesa)-(a.forca+a.defesa))
               .slice(0, qtd);
  }

  function bancoDeApelidos(){
    const N = TO.dados.nomes;
    if(!N) return ['TROVÃO'];
    const B = (TO.membros && TO.membros.bancoDe)
      ? TO.membros.bancoDe(TO.estado && TO.estado.E) : N;
    return (B && B.apelidos) || N.apelidos || ['TROVÃO'];
  }

  function nascerGrupo(J, g, escalados, temLider, nomes){
    const s = g.s;
    const qtd = Math.max(g.qtd, escalados.length);
    if(qtd <= 0) return;
    /* só o nosso bonde tem ficha de verdade; o resto joga com a ficha
       gerada do perfil da própria torcida */
    const meuLado = g.bonde ? !!g.bonde.nossa : !!s.jogador;
    /* O ELENCO FIXO DA TORCIDA (pedido do dono, 27/08/2026): o
       figurante tem nome sorteado por hash da PRÓPRIA torcida — o
       mesmo bonde traz os mesmos nomes em todo save, no banco do país
       dele (a barra argentina se chama Zurdo e Adrián, não Pitbull).
       O contador por torcida evita nome repetido dentro da cena sem
       quebrar a fila fixa. */
    const donoDoNome = g.bonde || (!meuLado && J.rivalInfo) || null;
    const rotN = donoDoNome ? donoDoNome.nome
      : (meuLado && TO.estado && TO.estado.E ? TO.estado.E.torcida.nome : '');
    if(TO.membros && TO.membros.nomesDaTorcida){
      const idx = (J._nomeIdx = J._nomeIdx || {});
      const de = idx[rotN] || 0;
      nomes = TO.membros.nomesDaTorcida(rotN, de, qtd);
      idx[rotN] = de + qtd;
    } else nomes = nomes || U.embaralhar(bancoDeApelidos());
    const perfil = (g.bonde && g.bonde.perfil) || J.config_perfilRival || null;
    const geradas = meuLado ? null : fichasDoPerfil(perfil, qtd);
    /* só o nosso bonde obedece à formação; aliado que divide o portão não */
    const meu = g.bonde ? !!g.bonde.nossa : !!s.jogador;
    /* LADO A LADO, COMO NO QUADRADO (pedido do dono, 19/08/2026).
       A nuvem redonda sorteada espalhava o bonde como se cada um
       tivesse chegado por conta própria; torcida chega junta, em
       bloco. A grade é a mesma do botão 3: `cols` pela raiz do
       efetivo e passo de 18 px, que é o diâmetro do disco mais um
       fio — encostado, sem sobrepor. Fica centrada no ponto do spawn,
       e quem não couber (rua estreita, degrau da arquibancada) é
       reencostado pelo `pontoLivreMaisProximo`, como sempre foi. */
    const PASSO = 18;
    const cols = Math.max(1, Math.ceil(Math.sqrt(qtd)));
    const linhas = Math.ceil(qtd/cols);
    const x0 = s.x - (cols-1)*PASSO/2, y0 = s.y - (linhas-1)*PASSO/2;
    /* E QUANDO O BONDE NÃO CABE NA RUA?
       Uma rua não é uma esplanada: 800 px de raio não existem ali. Duas
       saídas eram possíveis — cortar o efetivo pro que cabe, ou deixar
       nascer todo mundo e quem não achou lugar se empilha na boca da
       rua, entrando conforme abre espaço. Ficou a segunda: é o que o
       `pontoLivreMaisProximo` já faz sozinho (procura em anéis a partir
       do sorteio e para no primeiro vão livre), é realista, e faz o
       corredor virar gargalo tático em vez de sumir com gente.

       Medido antes de fechar, com 400 discos — mais do que qualquer
       bonde que o jogo produz — nas cinco cenas:
         rua 96 FPS · rua-media 99 · rua-nobre 97 · praça 88 · arredores 117.
       Com 140 discos: 181 / 186 / 179 / 150 / 218. Nenhuma cena chega
       perto de 60, então não há motivo de desempenho pra cortar
       ninguém. */
    /* UM LUGAR POR CABEÇA. O reencosto no vão livre não sabe de quem
       já nasceu: quando a grade bate em parede — degrau de
       arquibancada, muro de beco — ele devolve o MESMO vão pra vários,
       e os discos nascem empilhados no mesmo pixel. O registro de
       ocupados desempata, procurando o vizinho livre em anéis da
       célula da malha. Vale pra cena inteira, porque dois bondes podem
       dividir o mesmo portão. */
    /* a reserva é do TAMANHO DO DISCO (18 px, o passo da grade), e não
       da célula de 8 da malha: reservando célula, dois discos cabiam
       em quadrados vizinhos e nasciam sobrepostos pela metade */
    const CEL = PASSO;
    const ocupados = (J._ocupadosNasc = J._ocupadosNasc || new Set());
    const chave = q => `${Math.round(q.x/CEL)}|${Math.round(q.y/CEL)}`;
    const vago = q => A.caminhavel(q.x, q.y) && !ocupados.has(chave(q));
    for(let i=0;i<qtd;i++){
      let p=A.pontoLivreMaisProximo(x0 + (i%cols)*PASSO,
                                    y0 + Math.floor(i/cols)*PASSO, 7);
      /* NINGUÉM NASCE EM CIMA DE CASA. Quando a rua está lotada na hora
         do nascimento, a busca em anéis falha e devolve o ponto do
         sorteio — que pode ser um telhado, e disco em telhado não anda,
         não briga e trava o fim da cena. O bonde que não coube se
         empilha na boca do próprio spawn, que é sempre rua. */
      if(!A.caminhavel(p.x, p.y)){
        const q = A.pontoLivreMaisProximo(s.x, s.y, 7);
        p = A.caminhavel(q.x, q.y) ? q : {x:s.x, y:s.y};
      }
      if(!vago(p)){
        busca: for(let anel=1; anel<=14; anel++)
          for(let dy=-anel; dy<=anel; dy++)
            for(let dx=-anel; dx<=anel; dx++){
              if(Math.max(Math.abs(dx), Math.abs(dy)) !== anel) continue;
              const q = {x:p.x + dx*CEL, y:p.y + dy*CEL};
              if(vago(q)){ p = q; break busca; }
            }
      }
      ocupados.add(chave(p));
      const m = escalados[i];
      const lider = temLider && i===0;
      const d=new Disco(
        m ? m.apelido.toUpperCase()
          : String(nomes[i%nomes.length]||'ZÉ').toUpperCase(),
        s.lado, s, p.x, p.y, lider);
      if(m){
        d.membroId=m.id;
        d.forca=m.forca; d.defesa=m.defesa; d.moral=m.moral;
        /* defesa vira resistência: quem apanha melhor cai depois */
        d.hpMax = 90 + m.defesa*7;
        d.hp=d.hpMax;
        d.cargo=m.cargo;
      } else if(geradas){
        /* o disco rival com a ficha da torcida dele: mesma régua nossa */
        const v = geradas[i % geradas.length];
        d.forca=v.forca; d.defesa=v.defesa; d.moral=v.moral;
        d.hpMax = 90 + v.defesa*7;
        d.hp=d.hpMax;
        d.cargo=v.cargo;
      }
      /* o líder é sempre 20/20, pela mesma régua de hp de todo mundo */
      if(lider){
        d.forca=20; d.defesa=20;
        d.hpMax = 90 + 20*7; d.hp = d.hpMax;
      }
      /* TODAS as cores da torcida vão pro disco (pedido do dono,
         18/08/2026). O rival das cenas de ação não vem como bonde —
         os defensores se espalham pelos pontos da cena —, então a
         identidade dele chega por cfg.rival: sem isto o bar da
         Falange Coral descia com cor de time nenhum. */
      const dono = g.bonde || (!meu && J.rivalInfo) || null;
      d.cor  = dono ? dono.cor  : null;
      d.cor2 = dono ? dono.cor2 : null;
      d.cor3 = dono ? dono.cor3 : null;
      d.torcida = dono ? dono.nome : null;
      /* bonde `controlado` é o aliado escoltado (dono, 28/08/2026):
         cor e ficha dele, mas o comando é do jogador — os discos
         seguem a formação do nosso líder e obedecem R e F */
      d.doJogador = meu || !!(g.bonde && g.bonde.controlado);
      J.discos.push(d);
    }
    J.total[s.lado] += qtd;
  }

  /* =======================================================
     REFORÇO: QUEM CHEGOU COM A BRIGA JÁ ROLANDO

     A esplanada não é uma foto. Se o jogador desceu com três dos seis
     bondes, os outros três continuam andando na rua e chegam no meio do
     tumulto. Quem é de torcida metida no confronto entra nele; quem não
     tem nada com aquilo atravessa e vai pro próprio portão — é o que o
     humor do bonde já sabe fazer, então aqui só se diz qual é.
     ======================================================= */
  function reforcar(J, bonde){
    if(!J || J.fase === 'acabando' || !bonde || !(bonde.n > 0)) return null;
    const lado = bonde.lado === 'visitante' ? 'visitante' : 'mandante';
    const spawns = D.spawns.filter(x=>x.lado === lado);
    if(!spawns.length) return null;
    /* o portão de quem chega atrasado é o do lado dele, o menos usado */
    const uso = {};
    for(const d of J.discos) if(d.spawn) uso[d.spawn] = (uso[d.spawn]||0)+1;
    const s = spawns.slice().sort((x,y)=>(uso[x.id]||0)-(uso[y.id]||0))[0];

    nascerGrupo(J, {s, bonde, qtd: Math.max(1, Math.round(bonde.n))}, [], false);

    /* O humor: entra na briga quem tem lado nela. Bonde do jogador é
       sempre do jogador; o resto, se a cena já não está em paz e ele é
       de um dos lados envolvidos, chega batendo. */
    J.bondes[s.id] = J.bondes[s.id] || {};
    const b = J.bondes[s.id];
    b.nome = bonde.nome; b.jogador = !!bonde.nossa;
    b.humor = (!J.paz && !bonde.nossa) ? 'atacar' : (b.humor || 'paz');
    b.agirEm = J.t;
    b.entraEm = b.entraEm || (J.t + 90);
    if(b.humor === 'atacar') J.paz = false;
    logar(J, `${bonde.nome} chegou na esplanada.`, bonde.nossa ? 'v' : 'a');
    return s.id;
  }

  /* =======================================================
     PASSO
     ======================================================= */
  function passo(J,dt,teclas,podeControlar){
    /* 'voltando' é o respiro entre a briga acabar e a tela de fim:
       ninguém mais se pega, mas quem defendeu ainda anda de volta */
    if(J.fase!=='ativo' && J.fase!=='voltando') return;
    J.t+=dt;
    refazerGrade(J);      // uma vez por quadro, antes de qualquer busca
    if(J.fase==='voltando'){
      moverDiscos(J,dt);
      separar(J);
      conferirVolta(J);
      return;
    }
    destravarEncalhados(J, dt);
    conferirGatilho(J);
    conferirBondes(J);
    moverLider(J,dt,teclas,podeControlar);
    moverDiscos(J,dt);
    moverPoliciais(J,dt);
    contatos(J,dt);
    iaArremesso(J,dt);
    moverProjeteis(J,dt);
    medirClima(J,dt);
    passoCarga(J,dt);
    pressaoSobreMim(J,dt);
    iaRecuo(J);
    separar(J);
    checarDebandada(J);
    conferirEntrada(J);
    conferirFim(J);
  }

  /* =======================================================
     NINGUÉM MORA EM CIMA DE CASA
     A rede de segurança do nascimento e do empurra-empurra: um
     disco vivo parado em célula que não é rua não anda, não
     briga e segura o fim da cena pra sempre. Uma vez por
     segundo a cena confere e devolve o encalhado pra rua — no
     vão livre mais próximo, ou na boca do próprio spawn.
     ======================================================= */
  function destravarEncalhados(J, dt){
    J.tDestravar = (J.tDestravar || 0) + dt;
    if(J.tDestravar < 1) return;
    J.tDestravar = 0;
    for(const d of J.discos){
      if(!d.vivo || A.caminhavel(d.x, d.y)) continue;
      const q = A.pontoLivreMaisProximo(d.x, d.y, d.r || 7);
      if(A.caminhavel(q.x, q.y)){ d.x = q.x; d.y = q.y; continue; }
      const s = D.spawns.find(x=>x.id===d.spawn) ||
                D.spawns.find(x=>x.lado===d.lado);
      if(s){ d.x = s.x; d.y = s.y; }
    }
  }

  /* =======================================================
     QUANDO A BRIGA ACABA SOZINHA
     Não é o relógio nem o botão: acabou quando um dos dois
     lados não tem mais ninguém em pé na cena — caiu, foi
     preso, entrou ou correu pra fora. Antes disso a tela de
     fim só vinha se o jogador andasse até a saída, o que
     deixava o vencedor sozinho no cenário sem nada pra fazer.
     ======================================================= */
  const dePe = (J,lado)=> J.discos.filter(d=>d.lado===lado && d.vivo).length;

  /* =======================================================
     QUEM ESTÁ DISPOSTO A BATER
     O seu bonde sempre está: ele te segue e briga onde você
     brigar. Os outros dependem do humor do próprio bonde e da
     hora dele. Cena que não tem bondes (praça, rua, bar) cai no
     interruptor de sempre, que lá continua sendo da cena inteira.
     ======================================================= */
  function agressivo(J, d){
    /* quem recebeu ordem de entrar não revida: largar o pau e ir pro
       portão é uma decisão, e decisão que o disco desobedece no quadro
       seguinte não é decisão nenhuma */
    if(d.entrando) return false;
    if(d.doJogador) return true;
    const b=J.bondes[d.spawn];
    if(!b) return !J.paz;
    return b.humor==='atacar' && J.t>=b.agirEm;
  }

  /* Levou pancada: o bonde decide na hora se revida ou se corre pro
     portão. Quem não foi tocado não muda de vida — é o vizinho vendo
     briga do outro lado da esplanada e continuando na fila. */
  function atacado(J, d){
    const b=J.bondes[d.spawn];
    if(!b || b.jogador || b.humor!=='paz') return;
    const meus=J.discos.filter(x=>x.spawn===b.id && x.vivo);
    if(!meus.length) return;
    let emCima=0;
    for(const x of J.discos){
      if(!x.vivo || !inimigos(x.lado,b.lado)) continue;
      if(meus.some(m=>U.dist(m.x,m.y,x.x,x.y)<220)) emCima++;
    }
    /* moral saiu da briga (decisão do dono): a decisão de revidar é
       aritmética de cabeça contada, igual pros dois lados */
    const reage = meus.length >= emCima*0.75;
    b.humor = reage ? 'atacar' : 'fugir';
    b.agirEm = J.t;
    /* correr aqui é entrar: o portão é a saída de quem não quer briga */
    if(!reage) for(const m of meus) m.entraEm = J.t;
    logar(J, `${b.rot}: ${reage?'veio pra cima':'correu pro portão'}.`,
          b.lado===ladoDoJogador(J)?'r':'a');
  }

  /* O clima da cena passa a ser a soma dos humores, e não um
     interruptor: basta um bonde partir pra cima pra noite deixar de
     ser tranquila, e os outros continuam na programação deles. */
  function conferirBondes(J){
    const ids=Object.keys(J.bondes);
    if(!ids.length) return;
    const brigando=ids.some(k=>{
      const b=J.bondes[k];
      return b.humor==='atacar' && !b.jogador && J.t>=b.agirEm;
    });
    if(J.paz && brigando){
      J.paz=false;
      logar(J,'O clima virou — tem bonde procurando briga.','r');
    }
    if(!J.paz && !brigando && J.caidos.mandante+J.caidos.visitante===0) J.paz=true;
  }

  function conferirFim(J){
    if(J.fase!=='ativo') return;
    /* Nos arredores o fim é outro e é mais simples: acabou quando o
       presidente entrou pelo portão. Lá não se toma nada de ninguém —
       o que se faz é chegar e entrar, e depois disso não há mais cena
       pra jogar, mesmo que sobre gente de pé na esplanada. */
    /* Com a ordem de entrar dada, quem fecha a cena é `conferirEntrada`:
       esperar a torcida inteira é justamente o ponto. Sem esta guarda o
       presidente cruzando o portão encerraria tudo em oito segundos e os
       outros 249 sumiriam junto com a tela, que era o defeito. */
    if(fugaPelaEntrada() && !J.entrando){
      const l=J.discos.find(d=>d.lider);
      if(l && l.entrou){
        J.fase='acabando';
        const venceu = J.caidos.visitante >= J.caidos.mandante;
        /* `venceu` segue a convenção do MANDANTE — é a ponte que a
           vira pro nosso lado. O que estava errado era o `lado`. */
        J.acabou={lado:ladoDoJogador(J), venceu,
                  tranquila: J.caidos.mandante+J.caidos.visitante===0,
                  motivo:'o presidente entrou pelo portão'};
        logar(J, J.acabou.motivo, 'p');
        return;
      }
    }
    const m=dePe(J,'mandante'), v=dePe(J,'visitante');
    if(m>0 && v>0) return;
    const lado = m>0 ? 'mandante' : (v>0 ? 'visitante' : null);

    /* defensor que ganhou volta pra dentro antes de a tela subir: o bar
       é deles de novo, e ver o bonde voltando pro salão é o que conta
       isso sem precisar de texto */
    if(lado==='visitante'){
      const casa=J.discos.filter(d=>d.lado==='visitante' && d.vivo && d.daCasa);
      if(casa.length){
        J.fase='voltando'; J.voltarAte=J.t+9; J.ladoVencedor=lado;
        for(const d of casa){ d.voltando=true; d.fugindo=false; }
        logar(J,'Eles voltaram pra dentro.','a');
        return;
      }
    }
    acabar(J, lado);
  }

  /* =======================================================
     ENTRAR NO ESTÁDIO É UMA ORDEM, NÃO UM ENCERRAMENTO

     O botão fazia outra coisa do que o nome prometia: exigia o LÍDER no
     raio do portão, marcava só o líder como entrado e fechava a tela na
     hora. O resto da torcida não entrava em lugar nenhum — sumia junto
     com a cena.

     Agora ele manda todo mundo pro portão de cada um e a cena fecha
     quando todos entraram. Vale a qualquer momento, inclusive no meio
     da briga: largar o pau e entrar é decisão legítima, e o resultado
     da noite conta quem caiu de cada lado, não quem desistiu.
     ======================================================= */
  const TEMPO_DE_ENTRAR = 90;      // segundos de escape, como o `voltando`

  /* O portão de cada disco é o do escalão dele, e ponto. Houve aqui um
     `portaoAlcancavel()` que mandava o disco pro portão do mesmo lado
     mais perto que tivesse rota, porque do spawn do jogador não havia
     caminho até `ent_mandante1`: a `fila_m1` deixava 21 px entre a
     ponta dela e a parede, e 21 px não passa um disco de raio 7. Era
     contorno de bug de arte, e contorno silencioso — o botão "Entrar
     pelo portão" vivia cinza e nada dizia por quê. A fila foi encurtada
     (dados/cena_arredores.js), o contorno saiu, e no lugar dele ficou o
     `conferirPortoes()` lá embaixo, que grita quando uma cena sela um
     portão. */
  function mandarEntrar(J){
    if(J.fase !== 'ativo' || J.entrando) return 0;
    let n = 0;
    for(const d of J.discos){
      if(!d.vivo || !d.doJogador || d.fugindo) continue;
      d.entrando = true; d.recuando = false;
      n++;
    }
    if(!n) return 0;
    J.entrando = true;
    J.entrarAte = J.t + TEMPO_DE_ENTRAR;
    logar(J, 'Ordem de entrar: todo mundo pro portão.', 'v');
    aviso(J, 'TODO MUNDO PRO PORTÃO', '#d9a441');
    return n;
  }

  /* Acabou quando não sobrou nenhum nosso de pé fora do portão. O
     escape por emperramento é o mesmo do `voltando`: dez discos não
     cabem no mesmo raio de portão, e quem trava contra os próprios
     companheiros já entrou pra todos os efeitos. */
  const PAROU = 1.2;
  const PERTO_DO_PORTAO = 130;
  function pertoDoPortao(d){
    const e = D.entradas.find(x=>x.id===d.entrada) ||
              D.entradas.find(x=>x.lado===d.lado);
    return !!e && U.dist(d.x, d.y, e.x, e.y) < PERTO_DO_PORTAO;
  }
  function conferirEntrada(J){
    if(!J.entrando || J.fase !== 'ativo') return;
    const fora = J.discos.filter(d=>d.entrando && d.vivo);
    /* emperrado conta como entrado só JUNTO DO PORTÃO: dez discos não
       cabem no mesmo raio de entrada e quem trava contra os próprios
       companheiros ali já entrou pra todos os efeitos. Travar no meio
       da esplanada, contra o cordão, não é ter entrado — é estar
       empurrando. */
    const emperrados = fora.filter(d=>(d.travado||0) > PAROU && pertoDoPortao(d));
    if(fora.length && fora.length > emperrados.length && J.t < J.entrarAte) return;
    for(const d of emperrados){ d.porEmperro = true; entrarNoEstadio(J, d); }
    /* estourou o tempo com gente ainda andando: entra quem faltou */
    for(const d of J.discos)
      if(d.entrando && d.vivo){ d.porEmperro = true; entrarNoEstadio(J, d); }
    J.fase = 'acabando';
    J.acabou = {lado:ladoDoJogador(J),
                venceu: J.caidos.visitante >= J.caidos.mandante,
                tranquila: J.caidos.mandante + J.caidos.visitante === 0,
                entrou:true, motivo:'sua torcida entrou pelo portão'};
    logar(J, J.acabou.motivo, 'p');
  }

  function conferirVolta(J){
    const casa=J.discos.filter(d=>d.voltando && d.vivo);
    /* catorze discos não cabem todos em volta de dois pontos de spawn:
       quem emperra contra os próprios companheiros já voltou pra todos
       os efeitos, senão a tela de fim espera o relógio inteiro */
    const chegou=casa.every(d=>{
      const s=D.spawns.find(x=>x.id===d.spawn);
      return !s || U.dist(d.x,d.y,s.x,s.y)<60 || (d.travado||0)>1.2;
    });
    if(chegou || J.t>J.voltarAte) acabar(J, J.ladoVencedor);
  }

  function acabar(J, lado){
    /* noite tranquila acaba pelo mesmo caminho — todo mundo entrou —,
       e aí não houve vencido: dizer que a cena esvaziou porque não
       sobrou ninguém de pé seria mentir sobre uma noite sem briga */
    const semBriga = lado===null && J.caidos.mandante+J.caidos.visitante===0;
    /* `venceu` É DO PONTO DE VISTA DO MANDANTE, e continua sendo: é a
       ponte que o vira pro nosso lado (`ganhamos`), e virar duas vezes
       daria o resultado trocado de novo, agora pro outro lado. O
       `'mandante'` aqui é o nome do lado, não sinônimo de nós. */
    const venceu = lado ? lado==='mandante'
                        : J.caidos.visitante >= J.caidos.mandante;
    /* O TERCEIRO FIM: ELES CORRERAM.
       A cena podia esvaziar de dois jeitos e só sabia contar um. Se o
       outro lado saiu inteiro pela boca da rua, ninguém tomou nada de
       ninguém — anunciar vitória com zero caído é a tela dizer uma
       coisa e o número dizer outra. Então isto é um fim próprio, como
       a noite tranquila já era.

       O corte é o que o jogador viu acontecer: eles debandaram, saíram
       da cena correndo, e não ficou nenhum deles caído nem preso. Segurar
       um só já muda a história — aí houve briga, e vale o fim de sempre.
       Correr NÓS continua sendo derrota: este fim é o do outro lado. */
    const outro = lado ? OUTRO_LADO[lado] : null;
    const correram = !!outro && lado === ladoDoJogador(J) &&
      !!J.debandou[outro] && (J.sumiram[outro]||0) > 0 &&
      J.caidos[outro] + J.presosPor[outro] === 0;
    J.fase='acabando';       // a ponte vê isto e abre a tela de fim
    J.acabou={lado, venceu, correram, tranquila:semBriga && !correram, motivo:
        correram ? 'eles correram sem ninguém encostar em ninguém'
      : semBriga ? 'a noite foi tranquila e todo mundo entrou'
      : lado===null ? 'não sobrou ninguém de pé dos dois lados'
      /* O TEXTO É DO NOSSO PONTO DE VISTA, e `venceu` é do mandante:
         ganhando como visitante, `venceu` é falso e a tela dizia "sua
         torcida foi corrida do lugar" pra uma briga que a gente venceu.
         Quem sobrou de pé é `lado`; se for o nosso, sobramos nós. */
      : lado === ladoDoJogador(J) ? 'não sobrou ninguém deles na cena'
               : 'sua torcida foi corrida do lugar'};
    /* nada de faixa na cena aqui: quem conta o resultado é a tela de
       resumo, e um aviso piscando por cima do palco no mesmo instante
       só fazia perguntar qual dos dois era o resultado de verdade */
    logar(J, J.acabou.motivo, semBriga?'p':venceu?'v':'r');
  }

  function logar(J,txt,cor){
    J.log.unshift({t:J.t, txt, cor:cor||''});
    if(J.log.length>90) J.log.pop();
  }
  function aviso(J,txt,cor){ J.aviso={txt,cor}; J.avisoAte=J.t+1.7; }

  /* moral saiu da briga (decisão do dono, 17/08/2026): dano, velocidade
     e reação não olham mais pra ela. A escada fica só pra quem exibe. */
  const nivelMoral = () => 1;

  /* ---------- líder ---------- */
  function moverLider(J,dt,teclas,podeControlar){
    const l=J.discos.find(d=>d.lider&&d.vivo);
    if(!l||l.fugindo||l.entrando||!podeControlar) return;
    let dx=0,dy=0;
    /* A BOLA DE CONTROLE (pedido do dono, 22/08/2026): no celular a
       direção não sai mais de quatro botões, sai de um vetor livre —
       qualquer ângulo, e não só os oito da cruz. Quando o vetor existe
       é ele que manda; o teclado segue exatamente como estava. */
    const eixo = teclas.eixo;
    if(eixo && (eixo.x || eixo.y)){ dx = eixo.x; dy = eixo.y; }
    else {
      if(teclas['a']||teclas['arrowleft'])  dx--;
      if(teclas['d']||teclas['arrowright']) dx++;
      if(teclas['w']||teclas['arrowup'])    dy--;
      if(teclas['s']||teclas['arrowdown'])  dy++;
    }
    const m=Math.hypot(dx,dy);
    if(!m) return;
    /* o jogador corre atrás no mesmo passo de quem foge — a mesma
       regra dos discos, e pelo mesmo motivo (ver `inimigoFugindo`) */
    const cacando = J.discos.some(o=>o.vivo && o.fugindo && inimigos(l.lado,o.lado));
    const v = P.velocidade * (cacando ? 1.25 : 1);
    A.mover(l, dx/m*v*dt, dy/m*v*dt);
    A.barrarGrades(l,J.grades);
  }

  /* ---------- slots de formação ---------- */
  function slots(form,n,dx,dy){
    const s=[], e=22, px=-dy, py=dx;
    for(let i=0;i<n;i++){
      let a=0,b=0;
      switch(form){
        case 'bonde':    {const f=Math.floor(i/2)+1,l=i%2?1:-1; a=-f*e*0.8; b=l*e*0.42; break;}
        case 'muralha':  {const c=i-(n-1)/2; a=-e*0.3+(i%2)*(-e*0.42); b=c*e*0.72; break;}
        case 'investida':{
          /* QUADRADO ATRÁS DO LÍDER (decisão do autor): bloco cerrado,
             lado = raiz do efetivo, todo mundo às costas de quem manda */
          const cols=Math.max(1, Math.ceil(Math.sqrt(n)));
          const f=Math.floor(i/cols)+1, c=(i%cols)-(cols-1)/2;
          a=-f*e*0.75; b=c*e*0.75; break;}
        case 'espalhar': {const c=i-(n-1)/2; a=-(i%3)*e*0.7; b=c*e*1.05; break;}
      }
      s.push({x:dx*a+px*b, y:dy*a+py*b});
    }
    return s;
  }

  /* =======================================================
     O GATILHO DA CASA
     Cena de invasão não pode começar com os dois lados sabendo
     um do outro: quem está dentro do bar não vê a rua, e quem
     vem pela transversal não vê o salão. A cena declara uma
     zona (D.gatilho) na frente da porta — rival pisou ali, a
     casa acordou.

     Linha de visão entra como segundo caminho, e não como o
     único, justamente porque ela é honesta: A.livre() não
     atravessa parede, então de dentro do salão só se enxerga
     quem já está no vão da porta. Sem a zona, a casa só
     acordaria com o invasor em cima — e sem a visão, uma
     invasão pelos fundos pegaria todo mundo de costas pra
     sempre. Os dois juntos cobrem os dois casos.
     ======================================================= */
  function conferirGatilho(J){
    if(J.acordou) return;
    const g=D.gatilho;
    const atacantes=J.discos.filter(d=>d.vivo && d.lado===(g.lado||'mandante'));
    let por=null;
    /* dois jeitos de a cena declarar o gatilho, porque são duas
       situações: no bar o que importa é o LUGAR (a porta), na praça e
       na rua o que importa é a DISTÂNCIA — não há porta pra vigiar,
       eles só reagem quando o outro bonde chega perto. */
    if(g.perto){
      const parados=J.discos.filter(d=>d.vivo && d.guarda);
      for(const d of parados){
        for(const a of atacantes)
          if(U.dist(a.x,a.y,d.x,d.y) <= g.perto){ por='perto'; break; }
        if(por) break;
      }
    }
    if(!por && g.raio) for(const a of atacantes)
      if(U.dist(a.x,a.y,g.x,g.y) <= g.raio){ por='zona'; break; }
    if(!por) for(const d of J.discos){
      if(!d.vivo || !d.guarda) continue;
      if(inimigoAlcancavel(J,d,170)){ por='visao'; break; }
    }
    if(!por) return;
    J.acordou=true; J.acordouPor=por; J.acordouEm=J.t;
    for(const d of J.discos) d.guarda=false;
    logar(J, g.aviso || 'a casa acordou', 'r');
    aviso(J, g.aviso || 'A CASA ACORDOU', 'r');
  }

  /* =======================================================
     A GRADE ESPACIAL
     Procurar inimigo varrendo todos os discos é O(n²), e com o
     efetivo de verdade na esplanada — 250 da Gaviões mais os
     rivais — são 510 discos. A grade divide o palco em células
     de 96 px e cada busca só olha as nove células em volta.
     Refeita uma vez por quadro, que é mais barato que mantê-la
     incremental.

     Sinceridade sobre o ganho: isto foi o primeiro palpite pros
     5 quadros por segundo e, medido, NÃO mudou nada — a busca
     de inimigo não era o gargalo. Fica porque é o jeito certo
     de procurar vizinho e porque a separação e os contatos
     passaram a depender dela. Quem custava era
     pontoLivreMaisProximo (arredores.js) e a varredura par a
     par de separar().
     ======================================================= */
  const CELULA = 96;
  function refazerGrade(J){
    const g = new Map();
    let maior = 8;
    for(const o of J.discos){
      if(!o.vivo) continue;
      const k = ((o.x/CELULA)|0) + ',' + ((o.y/CELULA)|0);
      let l = g.get(k); if(!l){ l=[]; g.set(k,l); }
      l.push(o);
      if(o.r > maior) maior = o.r;
    }
    J._grade = g;
    /* o maior raio da cena: quem procura vizinho precisa dele pra saber
       até onde olhar sem varrer a lista inteira */
    J._raioMax = maior;
  }
  /* todos os discos vivos num raio, sem varrer a lista inteira */
  function porPerto(J, x, y, raio){
    const g = J._grade;
    if(!g) return J.discos;
    const c0=((x-raio)/CELULA)|0, c1=((x+raio)/CELULA)|0;
    const r0=((y-raio)/CELULA)|0, r1=((y+raio)/CELULA)|0;
    const fora=[];
    for(let c=c0;c<=c1;c++) for(let r=r0;r<=r1;r++){
      const l=g.get(c+','+r);
      if(l) for(const o of l) fora.push(o);
    }
    return fora;
  }

  function inimigoAlcancavel(J,d,raio){
    const cands=[];
    for(const o of porPerto(J,d.x,d.y,raio)){
      if(!o.vivo||!inimigos(d.lado,o.lado)) continue;
      const q=U.dist2(d.x,d.y,o.x,o.y);
      if(q<=raio*raio) cands.push([q,o]);
    }
    if(!cands.length) return null;
    cands.sort((a,b)=>a[0]-b[0]);
    for(let i=0;i<Math.min(3,cands.length);i++)
      if(A.livre(d.x,d.y,cands[i][1].x,cands[i][1].y)) return cands[i][1];
    return null;
  }

  /* o inimigo que já virou as costas, que se enxerga de longe */
  const RAIO_CACA = 420;
  function inimigoFugindo(J,d,raio){
    let melhor=null, md=raio*raio;
    for(const o of porPerto(J,d.x,d.y,raio)){
      if(!o.vivo || !o.fugindo || !inimigos(d.lado,o.lado)) continue;
      const q=U.dist2(d.x,d.y,o.x,o.y);
      if(q<md && A.livre(d.x,d.y,o.x,o.y)){ md=q; melhor=o; }
    }
    return melhor;
  }

  function entrarNoEstadio(J,d){
    if(d.entrou) return;
    d.entrou=true; d.vx=d.vy=0;
    J.entraram[d.lado]=(J.entraram[d.lado]||0)+1;
  }

  /* ---------- discos ---------- */
  function moverDiscos(J,dt){
    /* quem já tem inimigo ao alcance neste quadro. Sai de graça daqui,
       onde a busca já é feita, e é o que `checarDebandada` usa pra
       saber se um lado chegou perto o bastante pra ver o tamanho do
       outro — ver MINORIA. */
    J.encostou = {};
    /* Tem gente fugindo neste quadro? Uma varredura O(n) aqui evita
       `inimigoFugindo` — que olha 420 px, nove por nove células da
       grade — em todo disco que não tem inimigo por perto. Medido: sem
       esta guarda, 430 discos numa rua caíam de 91 pra 68 quadros por
       segundo, e na esmagadora maioria dos quadros não há ninguém
       fugindo pra procurar. */
    const fugindo = {mandante:false, visitante:false};
    for(const d of J.discos)
      if(d.vivo && d.fugindo) fugindo[d.lado] = true;
    const lider = J.discos.find(d=>d.lider&&d.vivo);
    /* formação é coisa do SEU bonde. Os outros escalões — inclusive os do
       mesmo clube — têm portão próprio e vão sozinhos. */
    const meus  = J.discos.filter(d=>d.doJogador&&d.vivo&&!d.lider);
    let dirX=0, dirY=-1;
    if(lider){
      const c=A.campoDaEntrada(lider.entrada,J.grades,J.versaoGrades).passo(lider.x,lider.y);
      if(c.dx||c.dy){dirX=c.dx;dirY=c.dy;}
    }
    const sl=slots(J.form, Math.max(meus.length,1), dirX, dirY);

    for(const d of J.discos){
      if(!d.vivo) continue;

      if(d.atordoado>0){
        d.atordoado-=dt; d.vx*=0.85; d.vy*=0.85;
        A.mover(d, d.vx*dt, d.vy*dt); A.barrarGrades(d,J.grades);
        continue;
      }
      /* o líder é do jogador e não anda sozinho — MENOS quando a ordem
         de entrar foi dada: aí o presidente vai pro portão como todo
         mundo, senão a cena fica esperando um disco que só o teclado
         move e a torcida inteira já entrou.
         E MENOS QUANDO O BONDE CORRE (correção do dono, 22/08/2026):
         quebrada a torcida, o presidente não fica plantado no meio da
         rua olhando o pessoal sumir. Ele corre junto, pela mesma rota.
         Sem isto a cena nem acabava: `dePe` contava o líder parado e a
         briga ficava de pé esperando um disco que só o teclado move —
         e o teclado, em fuga, não move ele (ver `moverLider`). */
      if(d.lider && !d.entrando && !d.fugindo) continue;
      d._cacando = false;

      const recua = d.fugindo || recuando(J, d.lado);

      let ax,ay, usarCampo=false, campo=null;

      /* de guarda: fica no posto. Sem isto o dono do bar sai andando
         pro fim da rua no primeiro segundo, porque o padrão de quem
         não tem inimigo à vista é caminhar pra própria saída. */
      /* guarda que debandou não é mais guarda: sem o `!d.fugindo`,
         o dono do posto ficava plantado no lugar mesmo em fuga —
         o ramo de guarda rodava antes do ramo de correr (24/08/2026) */
      if(d.guarda && !J.acordou && !d.fugindo){
        d._ramo='guarda'; d._alvo=null;
        d.vx*=0.82; d.vy*=0.82;
        A.mover(d, d.vx*dt, d.vy*dt);
        continue;
      }

      if(d.voltando){
        /* acabou e a casa é deles: volta pro lugar de onde saiu */
        const s=D.spawns.find(x=>x.id===d.spawn)||D.spawns[0];
        if(U.dist(d.x,d.y,s.x,s.y)<44){ d.vx*=0.8; d.vy*=0.8; d._ramo='voltou'; continue; }
        campo = campoDoSpawn(s); usarCampo=true;
      } else if(d.fugindo){
        /* debandada é fuga, não recuo: corre até sumir da tela. */
        const rota = rotaDeFuga(J, d);
        const destino = rota && rota.destino;
        if(destino){
          /* 46 px de folga: no gargalo do portão dez discos convergem
             pro mesmo ponto e não cabem todos dentro do raio marcado —
             sem a folga a fila para ali e ninguém some nunca */
          const perto = Math.max(destino.raio||34, 46);
          if(U.dist(d.x,d.y,destino.x,destino.y) < perto){
            /* nos arredores fugir é entrar: some pro estádio, e é isso
               que o placar de quem entrou tem de contar */
            if(destino.entrada) entrarNoEstadio(J,d); else sumir(J,d);
            continue;
          }
          campo = rota.campo; usarCampo=true;
        } else {
          const s=D.spawns.find(x=>x.id===d.spawn)||D.spawns[0];
          campo = campoDoSpawn(s); usarCampo=true;
        }
      } else if(d.entrando){
        /* ORDEM DE ENTRAR: cada um pro SEU portão.
           O caminho já existe e é o mesmo que a debandada nos arredores
           usa, onde fugir é entrar — só que aqui ninguém está fugindo:
           é a torcida inteira indo pra arquibancada porque o presidente
           mandou. */
        const id = d.entrada;
        const e = D.entradas.find(x=>x.id===id) ||
                  D.entradas.find(x=>x.lado===d.lado);
        if(e && U.dist(d.x,d.y,e.x,e.y) < (e.raio||34)+8){
          entrarNoEstadio(J,d); continue;
        }
        campo = A.campoDaEntrada(id, J.grades, J.versaoGrades);
        usarCampo = true;
      } else if(recua){
        // recuo mandado pelo jogador: volta pro próprio spawn e espera
        const s=D.spawns.find(x=>x.id===d.spawn)||D.spawns[0];
        campo = campoDoSpawn(s); usarCampo=true;
      } else if(d.vadiando && !agressivo(J,d) && J.t < d.entraEm){
        vadiar(J, d); ax=d.vagoX; ay=d.vagoY;
      } else {
        /* MESMO ALCANCE PROS DOIS LADOS (era 110 nosso × 130 deles), e
           com briga armada o nosso disco não larga o inimigo próximo
           pra voltar pro slot da formação — era isso que fazia o bonde
           pareado apanhar de 7×0: os nossos recuavam no meio da troca
           e os deles ficavam em cima (medido). */
        /* MESMA VISTA PROS DOIS LADOS: com briga armada, QUALQUER disco
           disposto enxerga inimigo a 240 px — era só o nosso, e a
           assimetria de caça pesava a briga pareada pro jogador */
        let alvo = inimigoAlcancavel(J,d, 130);
        if(!alvo && !J.paz && agressivo(J,d))
          alvo = inimigoAlcancavel(J,d, 240);
        if(alvo && !alvo.fugindo){
          J.encostou[d.lado]=true; J.encostou[alvo.lado]=true;
        }
        /* CORRER ATRÁS.
           Bonde que vira as costas é visível de muito mais longe que o
           inimigo que está te encarando: é um bloco inteiro correndo
           pra mesma boca de rua. Por isso quem persegue enxerga a 420
           px e corre no mesmo passo de quem foge.

           Sem isso a fuga por inferioridade seria aritmética e nada
           mais: eles quebram a 260 px (o alcance do gatilho da cena),
           correm a 1,25 da velocidade e ninguém alcança ninguém nunca
           — o jogador que rastreou o rival pela cidade inteira abriria
           a cena pra assistir ela terminar sozinha. Correndo igual,
           quem decide não é a corrida: é o gargalo. Doze discos não
           passam juntos por uma boca de 48 px, e quem chega junto da
           fila segura os últimos. */
        if(!alvo && fugindo[OUTRO_LADO[d.lado]] && agressivo(J,d))
          alvo = inimigoFugindo(J, d, RAIO_CACA);
        d._cacando = !!(alvo && alvo.fugindo);
        const meuBonde = J.bondes[d.spawn];
        if(alvo && agressivo(J,d)){ ax=alvo.x; ay=alvo.y; }
        /* veio pra brigar e não tem ninguém por perto: vai até onde o
           rival está. Sem isto ele só ficava disposto — andava pro
           próprio portão e a hostilidade não encontrava ninguém. */
        else if(agressivo(J,d) && meuBonde && meuBonde.alvo){
          const s=D.spawns.find(x=>x.id===meuBonde.alvo);
          if(s){ campo=campoDoSpawn(s); usarCampo=true; }
        }
        /* o seu bonde te segue sempre, com ou sem briga no ar: ele não
           tem programação própria, ele tem você */
        else if(d.doJogador && lider){
          const i=meus.indexOf(d), s=sl[i<0?0:i]||{x:0,y:0};
          /* O slot é geometria pura e pode cair em cima de prédio, ou
             fora da cena quando o líder está colado numa borda. Nesse
             caso puxa pro ponto válido mais perto.
             Só nesse caso: pontoLivreMaisProximo devolve CENTRO DE
             CÉLULA, então puxar sempre faria vários seguidores mirarem
             exatamente o mesmo ponto, empilhando e se empurrando. */
          ax=lider.x+s.x; ay=lider.y+s.y;
          if(!A.livrePara(ax,ay,A.raioMalha(d.r))){
            const q=A.pontoLivreMaisProximo(ax,ay,d.r);
            ax=q.x; ay=q.y;
          }
        }
        /* na bancada ninguém espera o rival vir: vai-se por cima da
           grade, que é a única coisa entre um setor e o outro */
        else if(D.marchaAoInimigo && agressivo(J,d) && setorInimigo(J,d)){
          const s=setorInimigo(J,d);
          campo=A.campoDoPonto('setor:'+s.id, s.x, s.y, J.grades, J.versaoGrades);
          usarCampo=true;
        } else {
          campo=A.campoDaEntrada(d.entrada,J.grades,J.versaoGrades); usarCampo=true;
          const e=D.entradas.find(x=>x.id===d.entrada);
          if(e && U.dist(d.x,d.y,e.x,e.y)<(e.raio||34)){ entrarNoEstadio(J,d); continue; }
        }
      }

      // rastro de diagnóstico: qual decisão e qual alvo, por disco
      d._ramo = recua?'recuo' : usarCampo?'campo' : (d.doJogador&&lider)?'formacao':'inimigo';
      d._alvo = usarCampo?null:[Math.round(ax),Math.round(ay)];

      let dirx,diry;
      if(usarCampo && campo){
        const c=campo.passo(d.x,d.y);
        dirx=c.dx; diry=c.dy;
        /* Sem caminho até o portão sem derrubar nada: só então a grade
           vira alvo. Enquanto houver volta, o campo já mandou dar a volta. */
        if(c.semRota){
          let g=null, md=1e9;
          for(const x of J.grades){
            if(x.hp<=0 || x.tipo==='fila') continue;
            const dd=U.dist(d.x,d.y,x.x,x.y);
            if(dd<md){md=dd;g=x;}
          }
          if(g){
            const gx=g.x-d.x, gy=g.y-d.y, gd=Math.hypot(gx,gy)||1;
            dirx=gx/gd; diry=gy/gd;
          }
        }
        if(recua && !d.fugindo){
          const s=D.spawns.find(x=>x.id===d.spawn);
          if(s && U.dist(d.x,d.y,s.x,s.y)<40){dirx=0;diry=0;}
        }
      } else {
        const ddx=ax-d.x, ddy=ay-d.y, dist=Math.hypot(ddx,ddy)||1;
        /* Histerese: chega com 9, só volta a andar depois de 22. Sem as
           duas soleiras ele oscila em cima do limite — para com 8, a
           separação empurra pra 10, anda de novo — e é isso que faz o
           bonde inteiro parecer inquieto parado no lugar. */
        if(d.acomodado && dist>22) d.acomodado=false;
        if(dist<=9) d.acomodado=true;
        if(d.acomodado){
          dirx=0; diry=0; d.melhorDist=undefined; d.semGanho=0;
        } else {
          /* Desistência: se em 0,8 s ele não encostou nem 2 px mais perto,
             o alvo é inalcançável daqui. Para, em vez de empurrar pedra.
             Se o alvo se afasta muito, é porque mudou — recomeça a contar. */
          if(d.melhorDist===undefined || dist<d.melhorDist-2){
            d.melhorDist=dist; d.semGanho=0;
          } else if(dist>d.melhorDist+25){
            d.melhorDist=dist; d.semGanho=0;
          } else {
            d.semGanho=(d.semGanho||0)+dt;
          }
          if(d.semGanho>0.8){dirx=0;diry=0;}
          else {dirx=ddx/dist; diry=ddy/dist;}
        }
      }

      /* quem está de conversa anda devagar: é passeio, não deslocamento */
      const passeio = d.vadiando && !agressivo(J,d) && J.t < d.entraEm;
      /* quem corre atrás corre igual — ver `inimigoFugindo` */
      const vel=P.velocidade*(d.fugindo||d._cacando?1.25:recua?1.15:passeio?0.5:1);
      if(!dirx && !diry && d.acomodado){
        /* Chegou: para de verdade. Deixar o steering rodando com alvo
           a 8 px mantém micromovimento que, com 60 discos na tela,
           lê como uma multidão inquieta. Quem chegou, chegou. */
        d.vx=0; d.vy=0; d.travado=0;
        continue;
      }
      if(!dirx && !diry){
        /* chegou onde queria: freia e assenta. Decaimento exponencial
           sozinho nunca chega a zero, e o disco fica vibrando de leve —
           com 60 deles na tela isso vira inquietação visível. */
        d.vx*=0.70; d.vy*=0.70;
        if(Math.hypot(d.vx,d.vy)<3.5){d.vx=0; d.vy=0;}
      } else {
        d.vx += (dirx*vel-d.vx)*Math.min(1,dt*6);
        d.vy += (diry*vel-d.vy)*Math.min(1,dt*6);
      }
      const px=d.x, py=d.y;
      A.mover(d, d.vx*dt, d.vy*dt);
      A.barrarGrades(d,J.grades);
      /* progresso medido na posição real. O retorno do mover mente:
         ele pode "andar" 0,9 px e ser desfeito logo depois por um
         empurrão, e aí o disco nunca é considerado travado. */
      const andou = Math.hypot(d.x-px, d.y-py) > vel*dt*0.25;

      /* Rede de segurança: se nem deslizando nem contornando ele saiu
         do lugar, larga o steering e vai direto pela célula que o campo
         de fluxo aponta. Melhor andar torto que ficar parado na borda. */
      if(andou){ d.travado=0; }
      else {
        d.travado=(d.travado||0)+dt;
        if(d.travado>0.45){
          const guia = campo || A.campoDaEntrada(d.entrada,J.grades,J.versaoGrades);
          const st=guia.passo(d.x,d.y);
          if(st.dx||st.dy){
            d.vx=st.dx*vel; d.vy=st.dy*vel;
            A.mover(d, st.dx*vel*dt*1.6, st.dy*vel*dt*1.6);
          }
          /* FUGA EMPERRADA TROCA DE SAÍDA (correção do dono,
             24/08/2026): quase um segundo parado a caminho de uma
             saída é a saída entupida — cordão de PM, aglomeração,
             tanto faz. Este disco risca ELA do mapa por 5s e a
             `rotaDeFuga` escolhe outra no quadro seguinte; se não
             existir outra, a própria rotaDeFuga volta pra riscada.
             O teletransporte de 2s continua embaixo, de rede final. */
          if(d.fugindo && d.travado>0.9 && d._fugaChave){
            d.fugaEvita = {chave:d._fugaChave, ate:J.t+5};
            d.travado = 0.5;
          }
          if(d.travado>2.0){
            const q=A.pontoLivreMaisProximo(d.x,d.y,d.r);
            d.x=q.x; d.y=q.y; d.vx=d.vy=0; d.travado=0;
          }
        }
      }
    }
  }

  /* Anda um pouco, para um pouco, sempre em volta do próprio ponto.
     O alvo é sorteado dentro do raio a cada troca, e a parada é o que
     tira a cara de formiga em fila — gente esperando jogo fica em roda,
     não andando em linha reta o tempo todo. */
  function vadiar(J, d){
    if(d.vagoAte===undefined || J.t > d.vagoAte){
      d.vagoParado = !d.vagoParado;
      d.vagoAte = J.t + (d.vagoParado ? U.entre(2,6) : U.entre(1.5,4));
      if(!d.vagoParado){
        const s=D.spawns.find(x=>x.id===d.spawn)||D.spawns[0];
        const a=U.rng()*Math.PI*2, r=U.entre(20, P.raioVadiagem);
        const q=A.pontoLivreMaisProximo(s.x+Math.cos(a)*r, s.y+Math.sin(a)*r, d.r);
        d.vagoX=q.x; d.vagoY=q.y;
      }
    }
    if(d.vagoParado || d.vagoX===undefined){ d.vagoX=d.x; d.vagoY=d.y; }
  }

  const camposSpawn={};
  function campoDoSpawn(s){
    if(!camposSpawn[s.id]) camposSpawn[s.id]=A.criarCampo(s.x,s.y);
    return camposSpawn[s.id];
  }

  /* =======================================================
     MARCHAR PRO SETOR DO RIVAL (arquibancada)
     Nos arredores quem veio disposto tem um bonde com alvo sorteado;
     na briga de rua os dois lados nascem colados e a hostilidade
     resolve tudo. Na bancada não é nem uma coisa nem outra: os setores
     nascem a 900 px um do outro e cercados de grade, e sem uma ordem
     de marcha cada disco andava pro PRÓPRIO túnel — a briga que o
     clima abriu terminava com zero baixas e o relógio correndo à toa
     (medido: 0 de 31 módulos tocados em 20 s).

     Marcha-se pro setor rival mais perto que ainda tem gente de pé,
     porque setor vazio é marchar pra parede.
     ======================================================= */
  function setoresDePe(J){
    if(J._setoresT === J.t && J._setoresPe) return J._setoresPe;
    const m={};
    for(const o of J.discos)
      if(o.vivo && !o.fugindo && !o.entrou) m[o.spawn]=(m[o.spawn]||0)+1;
    J._setoresPe=m; J._setoresT=J.t;
    return m;
  }
  function setorInimigo(J, d){
    const pe=setoresDePe(J);
    let melhor=null, md=1e9;
    for(const s of D.spawns){
      if(!inimigos(d.lado, s.lado) || !pe[s.id]) continue;
      const q=U.dist2(d.x,d.y,s.x,s.y);
      if(q<md){md=q; melhor=s;}
    }
    return melhor;
  }

  /* =======================================================
     DEBANDADA: SAIR DA CENA
     Quem debanda não recua pro spawn e fica parado ali — corre
     até sumir. O destino é a boca de rua mais perto, lida da
     malha por arredores.js, então cai sempre em cima de rua.

     Nos arredores é diferente e de propósito: ali não se corre
     pra rua, se entra pro estádio. A cena não tem id (é a
     padrão) e é a única assim, o que serve de teste.
     ======================================================= */
  const fugaPelaEntrada = ()=> !D.id || D.id === 'arredores';

  /* Um campo de fluxo por boca de rua, e todos respeitando a grade:
     cerca de CT e cordão de PM fecham caminho de verdade, e um campo
     que os ignora manda o bonde empurrar o alambrado pra sempre.
     Custa uma varredura por boca, então só se constrói quando alguém
     debanda — e se refaz quando uma grade cai. */
  /* O CORDÃO DA PM TAMBÉM É PAREDE NA FUGA (correção do dono,
     24/08/2026, vídeo da arquibancada): a rota de fuga contornava
     grade mas atravessava policial — que fisicamente não se atravessa
     (`separar`). O disco escolhia o corredor do cordão e ficava a
     cena inteira empurrando PM, parado. Cada saída ganhou DOIS
     campos: `desvia`, que trata PM viva como parede e dá a volta no
     cordão, e `campo`, o antigo, só com grades — o plano B de quando
     a única rota passa por cima da PM mesmo. Como a PM anda (carga,
     reforço), o cache expira a cada 1,2s além de expirar com grade
     caída. */
  let cacheFuga = {versao:-1, ate:-1, lista:null, saidaDe:null};
  function camposDeFuga(J){
    if(cacheFuga.versao !== J.versaoGrades || J.t > cacheFuga.ate)
      cacheFuga = {versao:J.versaoGrades, ate:J.t + 1.2, lista:null, saidaDe:null};
    if(!cacheFuga.lista){
      const bloq = A.celulasDeGrades(J.grades);
      const comPM = A.celulasDeDiscos(J.policiais.filter(p=>p.vivo), 12, bloq);
      cacheFuga.lista = A.fugas.map(f=>({f, chave:f.x+'|'+f.y,
        desvia:A.criarCampo(f.x, f.y, comPM),
        campo: A.criarCampo(f.x, f.y, bloq)}));
    }
    return cacheFuga.lista;
  }

  /* CADA LADO FOGE PRA UM CANTO (correção do dono, 24/08/2026).
     Quando os DOIS bondes correm, os dois escolhiam a mesma boca — a
     mais perto — e a tela mostrava caçador e caça fugindo abraçados
     pela mesma rua. Agora cada lado em fuga tem a SUA saída: a mais
     perto do centro do bonde; se os dois escolherem a mesma e houver
     outra com rota, o lado que debandou POR ÚLTIMO pega a segunda —
     quem quebrou primeiro já estava correndo, não muda de rua no meio.
     Com uma boca só, fica todo mundo nela mesmo: porta é porta. */
  function saidasPorLado(J){
    const lista = camposDeFuga(J);
    if(cacheFuga.saidaDe) return cacheFuga.saidaDe;
    const saida = {};
    const lados = ['mandante','visitante'].filter(l=>
      J.discos.some(d=>d.vivo && !d.sumiu && d.fugindo && d.lado===l));
    const escolha = {};
    for(const l of lados){
      const fugindo = J.discos.filter(d=>d.vivo && !d.sumiu && d.fugindo && d.lado===l);
      const cx = fugindo.reduce((s,d)=>s+d.x,0)/fugindo.length;
      const cy = fugindo.reduce((s,d)=>s+d.y,0)/fugindo.length;
      /* SÓ BOCA COM ROTA entra na fila do lado — e a rota que vale é a
         que DESVIA da PM: escolher a boca mais perto sem olhar o
         cordão devolvia o bonde pro corredor tampado (regressão pega
         pelo fuga-cordao). Sem nenhuma desviável, vale a de grades;
         sem nenhuma, o lado fica sem preferência e cada disco se vira. */
      const fila = lista.slice().sort((a,b)=>
        U.dist2(cx,cy,a.f.x,a.f.y) - U.dist2(cx,cy,b.f.x,b.f.y));
      const passa = o => !o.desvia.passo(cx,cy).semRota;
      const passaGrade = o => !o.campo.passo(cx,cy).semRota;
      escolha[l] = fila.filter(passa);
      if(!escolha[l].length) escolha[l] = fila.filter(passaGrade);
      saida[l] = escolha[l][0] ? escolha[l][0].chave : null;
    }
    if(lados.length === 2 && lista.length > 1 &&
       saida[lados[0]] && saida[lados[0]] === saida[lados[1]]){
      /* quem debandou por último cede a boca */
      const ordem = lados.slice().sort((a,b)=>
        (J.correuEm && J.correuEm[a] || 0) - (J.correuEm && J.correuEm[b] || 0));
      const cede = ordem[1];
      const alt = escolha[cede].find(o=>o.chave !== saida[ordem[0]]);
      if(alt) saida[cede] = alt.chave;
    }
    cacheFuga.saidaDe = saida;
    return saida;
  }

  /* A saída mais perto QUE TEM CAMINHO. Sem o teste de rota, o disco
     escolhe a boca do outro lado do muro e vai morrer de empurrar
     parede — foi o que travou dez discos no CT e onze nos arredores.
     A ordem de preferência é: rota que DESVIA da PM pra qualquer
     saída (a mais perto), depois rota que passa pela PM (plano B),
     sempre pulando a saída que este disco marcou como emperrada
     (`fugaEvita`, ver o movimento) enquanto a marca vale. */
  function rotaDeFuga(J, d){
    if(fugaPelaEntrada()){
      const e = D.entradas.find(x=>x.id===d.entrada) ||
                D.entradas.find(x=>x.lado===d.lado);
      if(e){
        const c = A.campoDaEntrada(e.id, J.grades, J.versaoGrades);
        if(!c.passo(d.x,d.y).semRota)
          return {destino:{x:e.x, y:e.y, raio:e.raio||34, entrada:e.id}, campo:c};
      }
    }
    const evita = (d.fugaEvita && d.fugaEvita.ate > J.t) ? d.fugaEvita.chave : null;
    /* a boca do MEU lado primeiro: é o que separa as duas debandadas */
    const minha = saidasPorLado(J)[d.lado] || null;
    const acha = (qualCampo, pulaEvitada, soDoLado)=>{
      let melhor=null, md=Infinity;
      for(const o of camposDeFuga(J)){
        if(pulaEvitada && o.chave === evita) continue;
        if(soDoLado && o.chave !== minha) continue;
        const c = o[qualCampo];
        if(c.passo(d.x,d.y).semRota) continue;
        const q=U.dist2(d.x,d.y,o.f.x,o.f.y);
        if(q<md){md=q; melhor={destino:o.f, campo:c, chave:o.chave};}
      }
      return melhor;
    };
    /* a boca do lado só vale enquanto ela desvia do cordão: se daqui
       deste disco só se chega nela empurrando PM, cai na régua normal */
    const r = (minha && minha !== evita && acha('desvia', false, true)) ||
              acha('desvia', !!evita) || acha('campo', !!evita) ||
              (evita && (acha('desvia', false) || acha('campo', false))) || null;
    if(r) d._fugaChave = r.chave;
    return r;
  }
  /* usada pelos testes e pelo editor: só o destino, sem o campo */
  function alvoDeFuga(J, d){ const r=rotaDeFuga(J,d); return r && r.destino; }

  function sumir(J,d){
    if(d.sumiu) return;
    d.sumiu=true; d.vx=d.vy=0;
    J.sumiram[d.lado]=(J.sumiram[d.lado]||0)+1;
  }

  /* ---------- polícia ---------- */
  function procurandoConflito(J,d){
    if(!d.vivo||d.fugindo||d.entrou) return false;
    if(recuando(J, d.lado)) return false;
    return d.hostil>0;
  }

  function moverPoliciais(J,dt){
    const buracos=J.grades.filter(g=>g.hp<=0);
    for(const p of J.policiais){
      if(!p.vivo) continue;
      p.cooldown=Math.max(0,p.cooldown-dt);
      let ax,ay,vel=54;

      if(p.carga){
        const alvo=alvoDaCarga(J,p);
        if(alvo){ax=alvo.x;ay=alvo.y;vel=96;} else {ax=p.postoX;ay=p.postoY;vel=76;}
        for(const d of porPerto(J,p.x,p.y,40)){
          if(!procurandoConflito(J,d)) continue;
          if(U.dist(d.x,d.y,p.x,p.y)>d.r+p.r+8) continue;
          if(p.cooldown>0) break;
          p.cooldown=1.25;
          d.hp-=P.forcaPM*P.dano*1.4; d.atordoado=1.0; d.tremor=6;
          if(d.hp<=0) prender(J,d);
          break;
        }
      } else if(buracos.length){
        let alvo=buracos[0], md=1e9;
        for(const b of buracos){const dd=U.dist(b.x,b.y,p.x,p.y); if(dd<md){md=dd;alvo=b;}}
        ax=alvo.x; ay=alvo.y; vel=64;
      } else {
        let perto=null, pd=1e9;
        for(const d of porPerto(J,p.x,p.y,80)){
          if(!procurandoConflito(J,d)) continue;
          const dd=U.dist(d.x,d.y,p.x,p.y);
          if(dd>=80||dd>=pd) continue;
          // atrás da grade não se persegue: o cordão é pra ser segurado
          if(A.atravessaGrade(p.x,p.y,d.x,d.y,J.grades)) continue;
          pd=dd; perto=d;
        }
        if(perto){
          ax=perto.x; ay=perto.y; vel=70;
          const fx=ax-p.postoX, fy=ay-p.postoY, f=Math.hypot(fx,fy);
          if(f>80){ax=p.postoX+fx/f*80; ay=p.postoY+fy/f*80;}
          if(p.cooldown<=0 && pd<perto.r+p.r+8){
            p.cooldown=2.0;
            perto.hp-=P.forcaPM*P.dano; perto.atordoado=0.6; perto.tremor=5;
            if(perto.hp<=0) prender(J,perto);
          }
        } else {
          ax=p.postoX; ay=p.postoY+Math.sin(J.t*0.55+p.giro)*26; vel=42;
        }
      }

      const dx=ax-p.x, dy=ay-p.y, dist=Math.hypot(dx,dy)||1;
      if(dist>6){
        p.vx=dx/dist*vel; p.vy=dy/dist*vel;
        const andou=A.mover(p, p.vx*dt, p.vy*dt);
        A.barrarGrades(p, J.grades);
        // empacou tentando alcançar algo inalcançável: volta pro posto
        p.travado = andou ? 0 : (p.travado||0)+dt;
        if(p.travado>1.0){
          const v=A.pontoLivreMaisProximo(p.postoX,p.postoY,p.r);
          const bx=v.x-p.x, by=v.y-p.y, bd=Math.hypot(bx,by)||1;
          A.mover(p, bx/bd*vel*dt, by/bd*vel*dt);
          if(p.travado>2.5){p.x=v.x; p.y=v.y; p.travado=0;}
        }
      } else {p.vx=p.vy=0; p.travado=0;}
    }
    const vv=J.policiais.filter(p=>p.vivo);
    for(let i=0;i<vv.length;i++)for(let j=i+1;j<vv.length;j++){
      const a=vv[i],b=vv[j],dx=b.x-a.x,dy=b.y-a.y;
      const d=Math.hypot(dx,dy)||0.01, min=a.r+b.r;
      if(d<min){const e=(min-d)/2,nx=dx/d,ny=dy/d;a.x-=nx*e;a.y-=ny*e;b.x+=nx*e;b.y+=ny*e;}
    }
  }

  function alvoDaCarga(J,p){
    let melhor=null, melhorN=-1;
    for(const d of J.discos){
      if(!procurandoConflito(J,d)) continue;
      if(A.atravessaGrade(p.x,p.y,d.x,d.y,J.grades)) continue;
      let n=0;
      for(const o of porPerto(J,d.x,d.y,70))
        if(procurandoConflito(J,o)&&U.dist(o.x,o.y,d.x,d.y)<70) n++;
      const nota=n-U.dist(d.x,d.y,p.x,p.y)/90;
      if(nota>melhorN){melhorN=nota;melhor=d;}
    }
    return melhor;
  }

  /* ---------- contatos ---------- */
  function contatos(J,dt){
    const vivos=J.discos.filter(d=>d.vivo);
    for(const a of vivos){
      if(a.fugindo||a.atordoado>0) continue;
      /* RECUADO BATE DE COSTAS (correção do dono, 27/08/2026): o lado
         em recuo era pulado inteiro aqui — não devolvia um soco
         enquanto o outro lado seguia batendo, e apertar R virava
         sentença. Recuar segue mandando o disco de volta pro spawn
         (ramo de movimento), mas quem COLAR nele leva o golpe normal:
         recuo reposiciona, não desarma. Só a debandada (`fugindo`)
         continua sem revidar — quem virou as costas de vez não briga. */

      const bate = agressivo(J,a);
      if(bate) for(const b of porPerto(J,a.x,a.y,a.r+(J._raioMax||8)+5)){
        if(a===b||!b.vivo||!inimigos(a.lado,b.lado)) continue;
        if(U.dist(a.x,a.y,b.x,b.y)>a.r+b.r+5) continue;
        /* MORAL NÃO ENTRA NA BRIGA (decisão do dono, 17/08/2026): o
           multiplicador de moral criava bola de neve — cada caído
           derrubava a moral de um lado e subia a do outro, e briga
           pareada virava varrida. Dano é força contra defesa, ponto. */
        const bruto=(a.forca*U.entre(0.8,1.2))-b.defesa*0.5;
        b.hp-=Math.max(1,bruto)*P.dano*dt*(b.fugindo?1.6:1);
        b.tremor=Math.min(6,b.tremor+0.6); a.golpe=0.12; a.hostil=3.0;
        atacado(J,b);
        /* ALCANÇOU, PEGOU — e só pra quem correu sem brigar.
           Quem debanda por inferioridade sai com a vida cheia, e no
           dano de cima um disco inteiro leva vinte segundos de contato
           pra ir ao chão: a janela de uma fuga é de dois a quatro, então
           com o 1,6× e nada mais "dá pra alcançar quem foge" era frase
           sem consequência — medido, zero de doze em oito corridas.
           Segundo e pouco de mão em cima e ele fica, que é o que
           acontece quando se alcança alguém de costas.

           Só pra debandada por minoria, de propósito. Quem quebra
           DEPOIS da briga já está gasto, e ali o 1,6× sozinho já
           segurava gente — medido, 11 de 25. Estender a regra àquele
           caso virava toda derrota em extermínio: 26 caídos de 40
           passavam a 36.

           1,2 s foi escolhido medindo dez corridas de 40×12 em cada
           corte. Com 1,2 o jogador que corre atrás segura 1 ou 2 dos
           12 e nunca zero; o que fica parado vê a tela ELES CORRERAM em
           4 de 10. Com 2,0 e 2,8 a coisa vira sim/não: quem persegue
           segura exatamente 1, sempre. É a diferença entre perseguir
           valer a pena e perseguir ser protocolo. */
        if(b.fugindo && J.debandouPor[b.lado]==='minoria'){
          b.agarrado=(b.agarrado||0)+dt*2;   // −dt do decaimento = +dt líquido
          if(b.agarrado>=1.2 && b.hp>0) derrubar(J,b);
        }
        if(b.hp<=0) derrubar(J,b);
      }

      /* QUEM VAI ENTRAR EMPURRA A GRADE, mas não bate em ninguém.
         O cordão é o que está entre a multidão e o portão: com ele de
         pé não existe rota até a entrada (medido: `campoDaEntrada`
         devolve `semRota` com as 54 barras inteiras). Se a ordem de
         entrar também desligasse o empurrão na grade, "todo mundo pro
         portão" viraria "todo mundo encostado no cordão até o tempo
         estourar" — que foi exatamente o que a primeira versão fez.
         Empurrar barreira pra entrar em estádio não é revidar. */
      if(bate || a.entrando) for(const g of J.grades){
        if(g.hp<=0 || g.tipo==='fila') continue;   // fila não quebra
        if(U.dist(g.x,g.y,a.x,a.y)>a.r+g.meia+4) continue;
        g.hp-=a.forca*P.dano*dt*1.6;
        g.tremor=Math.min(5,g.tremor+0.5); a.hostil=3.5;
        if(g.hp<=0){
          g.hp=0; J.versaoGrades++; J.alerta=Math.min(100,J.alerta+13);
          logar(J,'Um módulo da grade foi ao chão.','pm');
          romperCordao(J);
        }
      }

      /* Só quem está procurando conflito se pega com a PM. Passar do lado
         de um policial a caminho do portão não é enfrentamento — sem esta
         guarda, a atenção policial ia a 100 em segundos só de todo mundo
         andar pela rua, e a IA recuava sem que nada tivesse acontecido. */
      if(procurandoConflito(J,a))
      for(const p of J.policiais){
        if(!p.vivo) continue;
        if(U.dist(p.x,p.y,a.x,a.y)>a.r+p.r+5) continue;
        p.hp-=a.forca*P.dano*dt*0.55; a.hostil=4.0;
        J.alerta=Math.min(100,J.alerta+7*dt);
        if(p.hp<=0){p.caido=true; J.alerta=Math.min(100,J.alerta+18); logar(J,'Um PM foi ao chão.','pm');}
        if(p.cooldown<=0){
          p.cooldown=1.9; a.hp-=P.forcaPM*P.dano; a.atordoado=0.7; a.tremor=5;
          if(a.hp<=0) prender(J,a);
        }
      }
    }
    for(const d of J.discos){
      d.tremor=Math.max(0,d.tremor-dt*9);
      d.golpe =Math.max(0,d.golpe-dt);
      d.hostil=Math.max(0,d.hostil-dt);
      if(d.agarrado) d.agarrado=Math.max(0,d.agarrado-dt);
    }
    for(const g of J.grades) g.tremor=Math.max(0,g.tremor-dt*8);
    J.alerta=Math.max(0,J.alerta-dt*1.2);

    if(J.alerta>=100&&J.reforco<3&&!J.rompido){
      J.reforco++;
      const base=D.pmPostos[U.inteiro(0,D.pmPostos.length-1)];
      for(let i=0;i<3;i++) J.policiais.push(new Policial(base));
      /* o reset fica ABAIXO do limiar de desarme do recuo (62): com 64,
         o reforço chegava e ainda segurava o visitante recuado uns
         segundos à toa (ordem do dono, 31/08/2026) */
      J.alerta=56; logar(J,'Chegou reforço da PM.','pm');
    }
  }

  function derrubar(J,d){
    if(d.caido||d.preso) return;
    d.caido=true; d.hp=0; d.vx=d.vy=0;
    J.caidos[d.lado]++;
    /* a cascata de moral saiu junto com a moral da briga (decisão do
       dono): cada caído derrubava o lado dele e subia o outro, e era
       ela que transformava a primeira queda em varrida */
    if(d.lider){logar(J,'Seu líder caiu.','r'); aviso(J,'Líder caiu','#d9705f');}
  }
  function prender(J,d){
    if(d.caido||d.preso) return;
    d.preso=true; d.hp=0; d.vx=d.vy=0;
    J.presos++; J.caidos[d.lado]++; J.presosPor[d.lado]++;
    logar(J,`${d.nome} foi preso.`,'pm');
  }

  /* Tropa de choque é coisa de operação montada: existe no cordão do
     estádio e no comércio, que tem botão de pânico. Em praça de bairro,
     rua, bar e CT quem responde é a PM que já estava ali — a linha
     avança, mas ninguém manda batalhão. */
  const temChoque = () => D.tropaChoque !== false;

  function romperCordao(J){
    if(J.rompido) return;
    J.rompido=true; J.alerta=100;
    const choque = temChoque();
    J.cargaEm = choque ? J.t+P.atrasoCarga : null;
    J.cargaAte= J.t + (choque ? P.atrasoCarga : 0) + P.duracaoCarga;
    for(const p of J.policiais) p.carga=true;
    aviso(J,'Grade rompida','#e0b040');
    logar(J, choque
      ? `Romperam a grade. Tropa de choque a caminho (${Math.round(P.atrasoCarga)}s).`
      : 'Romperam a grade. A PM que estava ali partiu pra cima.', 'pm');
  }

  function passoCarga(J,dt){
    /* O ALERTA SOLTA QUANDO A CARGA ACABA (ordem do dono, 31/08/2026).
       O rompido cravava 100 a cada tique até o fim da noite, e o recuo
       do visitante — que só desarma com alerta < 62 — virava catraca:
       nos arredores, onde romper a grade é rotina (entrar no estádio
       empurra o cordão), o rival recuava e nunca mais voltava. Agora o
       100 vale enquanto a carga dura; recomposta a linha, o alerta
       decai normal e a briga pode voltar. */
    if(J.rompido && J.t<=J.cargaAte) J.alerta=100;
    if(J.cargaEm!==null&&!J.tropaVeio&&J.t>=J.cargaEm){
      J.tropaVeio=true;
      J.cargaAte=Math.max(J.cargaAte, J.t+P.duracaoCarga);
      const n=Math.round(P.tropaCarga);
      /* POR ONDE A TROPA ENTRA. Sem marcador ela entra pelo buraco que
         abriram na grade — é de onde a cena vem sozinha. Quando a cena
         marca `tropaEm` (editor F2), a tropa entra sempre dali: cena
         com portão de serviço, túnel ou boca de rua tem lugar certo
         pra caminhão de choque parar, e nascer no meio da briga é
         teletransporte. */
      const porta = D.tropaEm || J.grades.find(g=>g.hp<=0)
                 || J.grades[0] || D.pmPostos[0] || D.spawns[0];
      for(let i=0;i<n;i++){
        const p=new Policial({x:porta.x, y:porta.y});
        const q=A.pontoLivreMaisProximo(porta.x+U.entre(-70,70), porta.y+U.entre(-70,70), 10);
        p.x=q.x; p.y=q.y; p.carga=true; p.hpMax=380; p.hp=380; p.r=10;
        J.policiais.push(p);
      }
      aviso(J,'Tropa de choque entrou','#5fa87d');
      logar(J,`${n} PMs entraram dispersando os dois lados.`,'pm');
    }
    if(J.tropaVeio&&J.t>J.cargaAte){
      let voltou=false;
      for(const p of J.policiais) if(p.carga){p.carga=false;voltou=true;}
      if(voltou) logar(J,'A tropa recompôs a linha.','pm');
    }
  }

  function medirClima(J,dt){
    /* nos arredores quem diz o clima é conferirBondes: lá a cena não
       vira de uma vez, vira bonde por bonde */
    if(!J.paz || Object.keys(J.bondes).length) return;
    J.cdClima=(J.cdClima||0)-dt;
    if(J.cdClima>0) return;
    J.cdClima=0.35;
    let motivo=null;
    if(J.rompido) motivo='romperam a grade';
    else if(J.caidos.mandante+J.caidos.visitante>0) motivo='caiu gente';
    else if(J.alerta>45) motivo='a PM se mexeu';
    else if(J.projeteis.some(p=>!p.morto)) motivo='voou pedra';
    else{
      const vivos=J.discos.filter(d=>d.vivo);
      for(const a of vivos){
        if(motivo) break;
        for(const b of vivos){
          if(b===a||!inimigos(a.lado,b.lado)) continue;
          if(U.dist(a.x,a.y,b.x,b.y)<110&&A.livre(a.x,a.y,b.x,b.y)){motivo='os bondes se encostaram';break;}
        }
      }
    }
    if(motivo){
      J.paz=false;
      logar(J,`O clima virou — ${motivo}. Ninguém mais entra em paz.`,'r');
      aviso(J,'O clima virou','#d9705f');
    }
  }

  function ameacaPM(J,d){
    for(const p of J.policiais){
      if(!p.vivo) continue;
      const dist=U.dist(p.x,p.y,d.x,d.y);
      if(p.carga && dist<120) return true;
      if(!p.carga && dist<46 && J.alerta>55) return true;
    }
    return false;
  }
  /* PRESSÃO DA PM — mede e avisa, NÃO manda no seu bonde.

     Antes ela recuava sozinha depois de P.aguentaPM segundos com mais de
     35% do bonde perto de PM em carga. Na prática isso disparava
     exatamente no melhor momento da noite: romper a grade põe TODA a PM
     em carga de uma vez, e a carga ameaça a 120 px em vez de 46 — o
     bonde estava colado no cordão, porque foi ele que derrubou a grade,
     e dez segundos depois virava as costas sozinho.

     Quem manda no bonde é o jogador (R pra recuar). A única coisa que o
     quebra sem ordem é o preço de sangue combinado: a debandada em
     P.debandada por cento de baixas, em checarDebandada(). A pressão
     continua pesando onde deve — derruba a moral, e moral baixa é o que
     leva à debandada. */
  function pressaoSobreMim(J,dt){
    const meu = ladoDoJogador(J);
    const meus=J.discos.filter(d=>d.lado===meu&&d.vivo&&!d.fugindo);
    if(!meus.length){J.fracPM=0;return;}
    const frac=meus.filter(d=>ameacaPM(J,d)).length/meus.length;
    J.fracPM=frac;
    if(frac>0.35&&!J.recuando){
      J.sobPressao+=dt;
      if(!J.avisouPM&&J.sobPressao>1.2){
        J.avisouPM=true;
        aviso(J,'PM em cima do seu bonde','#5fa87d');
        logar(J,'A PM encostou no seu pessoal. R pra recuar.','pm');
      }
    } else {
      J.sobPressao=Math.max(0,J.sobPressao-dt*1.6);
      if(J.sobPressao<=0) J.avisouPM=false;
    }
  }
  function iaRecuo(J){
    const g=J.discos.filter(d=>d.lado===ladoDeles(J)&&d.vivo);
    if(!g.length) return;
    const sob=g.filter(d=>ameacaPM(J,d)).length/g.length;
    /* NA ARQUIBANCADA NÃO SE RECUA DA PM (régua do dono, 19/08/2026).
       O alerta foi calibrado pra rua, onde dá pra abrir distância do
       cordão; no setor a PM está DENTRO do curral, todo mundo nasce
       colado nela e o alerta ia a 100 antes do primeiro soco — o
       rival virava as costas e a briga que o clima abriu terminava
       0×0 (medido: 0 caídos em 17 s, 8 corridas). Lá a PM continua
       carregando e prendendo; o que ela não faz é cancelar a briga. */
    if(D.semRecuoPM) return;
    if(!J.recuoVisitante && J.alerta>78 && sob>0.22){
      J.recuoVisitante=true; J.recuoVisitanteAte=J.t+9;
      logar(J,'Os visitantes recuaram.','pm');
    } else if(J.recuoVisitante && J.t>J.recuoVisitanteAte && J.alerta<62){
      J.recuoVisitante=false;
    }
  }

  /* ---------- projéteis ---------- */
  function moverProjeteis(J,dt){
    for(const p of J.projeteis){
      if(p.morto) continue;
      p.t+=dt; p.x+=p.vx*dt; p.y+=p.vy*dt;
      const bateu = p.t>0.07 && p.t<p.dur && !A.caminhavel(p.x,p.y);
      if(bateu && p.tipo==='pedra'){p.morto=true;continue;}
      if(!bateu && p.t<p.dur) continue;
      p.morto=true;

      const alvos=J.discos.filter(d=>d.vivo&&inimigos(p.lado,d.lado));
      if(p.tipo==='pedra'){
        for(const d of alvos) if(U.dist(d.x,d.y,p.x,p.y)<32){
          d.hp-=22*P.dano; d.tremor=5; atacado(J,d);
          if(d.hp<=0) derrubar(J,d); break;
        }
        for(const g of J.grades) if(g.hp>0&&g.tipo!=='fila'&&U.dist(g.x,g.y,p.x,p.y)<26){g.hp-=30;g.tremor=4;break;}
      } else {
        p.explosao=0;
        for(const d of alvos){
          const dist=U.dist(d.x,d.y,p.x,p.y);
          if(dist<92){
            d.hp-=(58-dist*0.4)*P.dano; d.atordoado=1.1; d.tremor=6; atacado(J,d);
            const a=Math.atan2(d.y-p.y,d.x-p.x);
            d.vx=Math.cos(a)*150; d.vy=Math.sin(a)*150;
            if(d.hp<=0) derrubar(J,d);
          }
        }
        for(const g of J.grades){
          if(g.tipo==='fila') continue;
          const dist=U.dist(g.x,g.y,p.x,p.y);
          if(g.hp>0&&dist<92){
            g.hp-=110-dist*0.6; g.tremor=5;
            if(g.hp<=0){g.hp=0; J.versaoGrades++; J.alerta=Math.min(100,J.alerta+13); romperCordao(J);}
          }
        }
        J.alerta=Math.min(100,J.alerta+16);
      }
    }
    for(const p of J.projeteis) if(p.morto&&p.explosao!==undefined) p.explosao+=dt;
    J.projeteis=J.projeteis.filter(p=>!p.morto||(p.explosao!==undefined&&p.explosao<0.45));
  }

  const FOLGA=1.5;      // sobreposição tolerada, em px
  const MACIEZ=0.45;    // fração da sobreposição resolvida por quadro

  /* Resolver a sobreposição inteira todo quadro faz o par bater e
     voltar pra sempre. Com folga e resolução parcial, eles encostam
     e acomodam — que é como gente parada em aglomeração fica.

     O empurrão não é aplicado aqui: fica somado no disco e sai num
     movimento só no fim da varredura. No meio da aglomeração cada
     disco encosta em cinco ou seis vizinhos, e mover um pouquinho a
     cada par custava dez colisões contra a malha por disco por quadro
     — além de dar resultado diferente conforme a ordem da lista.
     Somado, os empurrões opostos se cancelam antes de custar nada. */
  function resolverPar(a,b){
    const lim=a.r+b.r-FOLGA;
    const dx=b.x-a.x; if(dx>lim||dx<-lim) return;
    const dy=b.y-a.y; if(dy>lim||dy<-lim) return;
    const q=dx*dx+dy*dy;
    if(q>=lim*lim) return;
    const d=Math.sqrt(q)||0.01;
    const e=(lim-d)*MACIEZ, nx=dx/d*e, ny=dy/d*e;
    /* O líder é âncora (GDD §16.2): não é empurrado pelos próprios
       seguidores. Sem isso ele deriva, os slots da formação vão
       junto, e o bonde inteiro persegue a si mesmo sem parar. */
    if(a.lider)      { b._edx+=nx*2; b._edy+=ny*2; }
    else if(b.lider) { a._edx-=nx*2; a._edy-=ny*2; }
    else { a._edx-=nx; a._edy-=ny; b._edx+=nx; b._edy+=ny; }
  }

  /* Grade própria da separação. A de busca de inimigo tem célula de
     96 px — grossa demais aqui, porque dois discos só se empurram a
     uns 15 px um do outro. A célula certa é do tamanho do maior disco:
     aí basta comparar cada célula consigo mesma e com quatro vizinhas.
     São quatro e não oito de propósito — as outras quatro chegam pelo
     outro lado, e comparar o par duas vezes dobraria o empurrão.
     Com a esplanada cheia isso troca 288 mil comparações por quadro
     por algumas dezenas por disco. */
  const VIZ_SEP=[[1,0],[-1,1],[0,1],[1,1]];
  let _baldes=[], _bCol=0, _bLin=0, _bCel=0;
  function baldesDeSeparacao(t, raioMax){
    const cel=Math.max(16, raioMax*2+2);
    const nc=Math.ceil(D.largura/cel)+1, nr=Math.ceil(D.altura/cel)+1;
    if(cel!==_bCel||nc!==_bCol||nr!==_bLin){
      _bCel=cel; _bCol=nc; _bLin=nr;
      _baldes=new Array(nc*nr);
      for(let i=0;i<_baldes.length;i++) _baldes[i]=[];
    } else for(let i=0;i<_baldes.length;i++) _baldes[i].length=0;
    for(const d of t){
      const c=U.limitar((d.x/cel)|0,0,nc-1), r=U.limitar((d.y/cel)|0,0,nr-1);
      _baldes[r*nc+c].push(d);
    }
    return _baldes;
  }

  function separar(J){
    const t=J.discos.filter(d=>d.vivo);
    for(const d of t){ d._edx=0; d._edy=0; }
    const baldes=baldesDeSeparacao(t, J._raioMax||8);
    const nc=_bCol, nr=_bLin;
    for(let r=0;r<nr;r++) for(let c=0;c<nc;c++){
      const aqui=baldes[r*nc+c];
      if(!aqui.length) continue;
      for(let i=0;i<aqui.length;i++){
        const a=aqui[i];
        for(let j=i+1;j<aqui.length;j++) resolverPar(a, aqui[j]);
        for(const [dc,dr] of VIZ_SEP){
          const c2=c+dc, r2=r+dr;
          if(c2<0||c2>=nc||r2>=nr) continue;
          const la=baldes[r2*nc+c2];
          for(let j=0;j<la.length;j++) resolverPar(a, la[j]);
        }
      }
    }
    /* ninguém atravessa policial: a PM é obstáculo mesmo pra quem
       está só de passagem — desviar dela é o que faz o posto importar */
    const pms=J.policiais.filter(p=>p.vivo);
    for(const a of t) for(const p of pms){
      const dx=a.x-p.x, dy=a.y-p.y;
      const d=Math.hypot(dx,dy)||0.01, min=a.r+p.r;
      if(d<min-FOLGA){
        const e=(min-FOLGA-d)*MACIEZ;
        a._edx+=dx/d*e; a._edy+=dy/d*e;
      }
    }
    /* e agora o movimento, um por disco */
    for(const d of t)
      if(d._edx || d._edy) A.empurrar(d, d._edx, d._edy);
  }

  /* =======================================================
     DEBANDADA — dois motivos pra um bonde quebrar

     1. PREÇO DE SANGUE: passou de `P.debandada` por cento de caídos.
        Vale pros dois lados, inclusive o do jogador — é o combinado.
     2. INFERIORIDADE NUMÉRICA: o lado tem 40% ou menos de gente de pé
        que o outro (ver MINORIA). Corre no primeiro quadro em que
        reconhece o tamanho do outro bonde, sem ninguém
        encostar em ninguém: bonde de doze não encara bonde de quarenta
        pra ver no que dá, e fingir que encara era o que fazia a rua
        parecer um simulador em vez de uma rua.

     Três travas no gatilho novo:

     · NÃO VALE PRO BONDE DO JOGADOR. Quem manda nele é ele; a única
       coisa que o quebra sem ordem é o preço de sangue combinado. IA
       decidindo por conta própria que a sua torcida vai correr é
       exatamente o que já foi consertado uma vez aqui.
     · PISO DE SEIS, o mesmo do preço de sangue: numa briga de três
       contra seis "metade" não quer dizer nada.
     · DE PERTO. Eles não correm de longe: deixam o bonde chegar, veem
       o tamanho a um passo, e aí viram as costas — `J.encostou`, que é
       ter inimigo dentro do alcance de busca (110/130 px). Disparar no
       instante em que a cena acorda (260 px, o alcance do gatilho)
       punha os dois bondes longe demais pra alguém alcançar alguém, e
       aí não existia briga nenhuma pra jogar.
     · FORA DOS ARREDORES SÓ, E COM A CENA ACORDADA. Nos arredores
       ninguém está brigando — está todo mundo indo pro portão —, e um
       visitante em minoria fugir na abertura acabaria com a cena antes
       de ela começar. Na cena com gatilho (bar, comércio, CT) quem
       defende está dentro e ainda não viu ninguém: não se corre de um
       bonde que você não sabe que chegou.

     Os dois disparam uma vez e não voltam atrás: sem isso o lado
     entraria e sairia do estado a cada disco que cai e cada disco que
     se levanta, e debandada não se desfaz.
     ======================================================= */
  /* O LIMIAR, E POR QUE NÃO É METADE.
     O projeto pedia metade. Medido nos encontros que o mapa produz de
     verdade — 80 esbarrões de rua em 120 dias de jogo de três praças —,
     metade fazia 39% deles acabarem em fuga antes de alguém encostar em
     alguém, e o teto combinado era um terço: passar disso é a rua voltar
     a ser vazia por outro caminho, depois de o RAIO_ENCONTRO ter sido
     subido justamente pra ela ter briga. A 40% dá 29%, que cabe. Os
     outros cortes medidos: 1/3 → 20%, 30% → 15%, 25% → 12,5%. */
  const MINORIA = 0.40;     // 40% ou menos de pé que o outro lado

  /* De quem é o bonde do jogador. O líder é o disco que ele dirige;
     sem líder na cena, vale a marca que o mapa pôs no bonde dele.

     ESTA FUNÇÃO EXISTIA E NÃO ERA CHAMADA. Oito pontos do arquivo
     tinham `'mandante'` cravado como sinônimo de "o nosso lado", e o
     jogo nunca reparou porque o jogador sempre foi o mandante. Atacar
     em viagem (§8.28) inverte isso, e aí o vencedor saía trocado, a
     tecla R não recuava ninguém, a barra da PM media o bonde deles e a
     debandada dizia "os visitantes correram" quando quem correu era o
     nosso pessoal. Nenhum `'mandante'` literal sobrou como sinônimo de
     nosso — os que restam são o nome do lado, e só. */
  function ladoDoJogador(J){
    const l = J.discos.find(d=>d.lider);
    if(l) return l.lado;
    const meu = J.discos.find(d=>d.doJogador);
    return meu ? meu.lado : (J.ladoNosso || 'mandante');
  }
  const ladoDeles = J => OUTRO_LADO[ladoDoJogador(J)];

  /* recuar é do LADO, e cada lado tem a sua bandeira: a nossa é a tecla
     R (`J.recuando`), a deles é a decisão da IA (`J.recuoVisitante`) */
  const recuando = (J, lado) => lado === ladoDoJogador(J)
    ? !!J.recuando : !!J.recuoVisitante;

  function checarDebandada(J){
    const meuLado = ladoDoJogador(J);
    const pe = {mandante:dePe(J,'mandante'), visitante:dePe(J,'visitante')};
    for(const lado of ['mandante','visitante']){
      if(J.debandou[lado]) continue;
      const total=J.total[lado], caidos=J.caidos[lado];
      if(total < 6) continue;
      let motivo = null;
      /* NA ARQUIBANCADA SE BRIGA (régua do dono, 19/08/2026): o setor
         é curral cercado de grade — não existe olhar o tamanho do outro
         e sair andando. Lá a cena declara `debandadaEm` (50% de baixas,
         o dobro do preço de sangue de rua) e `semFugaPorMinoria`, e por
         isso o confronto sempre acontece. */
      const precoDeSangue = D.debandadaEm || P.debandada;
      if(caidos/total >= precoDeSangue/100) motivo = 'baixas';
      else if(!D.semFugaPorMinoria &&
              lado !== meuLado && !fugaPelaEntrada() && J.acordou &&
              (J.encostou||{})[lado] && pe[lado] > 0 &&
              pe[lado] <= pe[OUTRO_LADO[lado]] * MINORIA) motivo = 'minoria';
      if(!motivo) continue;
      J.debandou[lado]=true;
      J.debandouPor[lado]=motivo;
      (J.correuEm=J.correuEm||{})[lado]=J.correuEm[lado]??J.t;
      const meu = lado === meuLado;
      const txt = motivo==='minoria'
        ? (meu ? 'Seu pessoal viu o tamanho deles e correu.'
               : 'Eles viram o tamanho do bonde e correram.')
        : (meu ? 'Seu pessoal correu.' : 'Os visitantes correram.');
      logar(J, txt, meu?'r':'a');
      aviso(J, meu?'Seu pessoal correu':'Eles correram', meu?'#d9705f':'#7098d9');
    }
    soltarFuga(J);
  }

  /* =======================================================
     NINGUÉM VIRA AS COSTAS NO MESMO QUADRO

     Debandada não é coreografia. Uns entendem na hora, outros ainda
     estão olhando pro lado quando o bonde já saiu andando — e é essa
     ponta atrasada que dá ao jogador a chance de segurar alguém.

     Sem ela a fuga é aritmética fechada e o resultado é sempre o
     mesmo: eles quebram no alcance do gatilho da cena (260 px), a boca
     de rua deles fica a 80 px do posto onde nasceram, e ninguém
     alcança ninguém em cena nenhuma — o jogador que rastreou o rival
     pela cidade abre a briga pra assistir ela terminar sozinha. Com
     2,2 s de rabo, quem persegue (que corre no mesmo passo, ver
     `inimigoFugindo`) chega na boca da rua antes dos últimos.
     ======================================================= */
  const ATRASO_FUGA = 2.6;
  function soltarFuga(J){
    for(const d of J.discos){
      if(!d.vivo || d.fugindo || !J.debandou[d.lado]) continue;
      /* quem chegou depois num lado que já quebrou também tem o seu
         instante — o retardatário entra na cena e vê o bonde correndo */
      if(d.correEm == null){
        /* e o rabo não é sorteio puro: quem está de frente pro outro
           bonde é o último a virar as costas, porque antes precisa se
           desvencilhar. Quem está no fundo já saiu andando. É esse
           atraso da linha de frente que dá ao perseguidor os dois
           segundos de que ele precisa pra cobrir os 130 px do alcance
           de busca — sem ele, dois discos na mesma velocidade nunca se
           encontram. */
        const encarando = !!inimigoAlcancavel(J, d, 160);
        d.correEm = J.t + (encarando ? ATRASO_FUGA : 0) + U.rng()*0.6;
      }
      else if(J.t >= d.correEm) d.fugindo = true;
    }
  }

  /* =======================================================
     A ORDEM DE CORRER (pedido do dono, 22/08/2026)

     Debandada é o bonde quebrando sozinho, por sangue ou por medo do
     tamanho do outro. ISTO É OUTRA COISA: é o presidente mandando
     correr antes de tomar prejuízo — poupar ficha custa a briga, e a
     conta é do jogador.

     Por isso não tem rabo: `soltarFuga` dá 2,6 s de atraso a quem está
     encarando o outro bonde, porque quem quebra sozinho demora a virar
     as costas. Ordem dada é ordem cumprida — todo mundo vira de uma
     vez, o líder inclusive, e cada um sai pela rota do seu spawn. A
     cena fecha sozinha quando o último sumir, pelo caminho de sempre.
     ======================================================= */
  function mandarFugir(J){
    if(!J || J.fase !== 'ativo') return 0;
    const meu = ladoDoJogador(J);
    let n = 0;
    for(const d of J.discos){
      if(!d.vivo || d.lado !== meu || d.fugindo) continue;
      d.fugindo = true;
      d.correEm = J.t;
      d.entrando = false;
      d.voltando = false;
      n++;
    }
    if(!n) return 0;
    J.debandou[meu] = true;
    J.debandouPor[meu] = 'ordem';
    (J.correuEm=J.correuEm||{})[meu]=J.correuEm[meu]??J.t;
    J.fugaOrdenada = true;
    /* recuo ligado junto da fuga só atrapalha: são duas ordens de andar
       pra trás no mesmo bonde, e a fuga é a que vale */
    J.recuando = false;
    logar(J, 'Ordem de correr: todo mundo pra saída.', 'r');
    aviso(J, 'TODO MUNDO CORRENDO', '#d9705f');
    return n;
  }
  /* o bonde correndo não bate, não recua e não joga pedra */
  const emFuga = J => !!(J && J.fugaOrdenada);

  /* ---------- ações do jogador ---------- */
  function restaCd(J,tipo){
    return Math.max(0,(tipo==='pedra'?J.cdPedraAte:J.cdBombaAte)-J.t);
  }
  function arremessar(J,tipo){
    if(J.fase!=='ativo'||J.semArmas||emFuga(J)||restaCd(J,tipo)>0) return;
    const l=J.discos.find(d=>d.lider&&d.vivo);
    if(!l) return;
    const alcance = tipo==='pedra'?P.alcancePedra:P.alcanceBomba;

    let alvo=null, md=1e9;
    for(const o of porPerto(J,l.x,l.y,alcance*1.6)){
      if(!o.vivo||!inimigos(l.lado,o.lado)) continue;
      const d=U.dist(l.x,l.y,o.x,o.y);
      if(d<md){md=d;alvo=o;}
    }
    if(!alvo||md>alcance*1.6){
      let g=null; md=1e9;
      for(const x of J.grades){
        if(x.hp<=0) continue;
        const d=U.dist(l.x,l.y,x.x,x.y);
        if(d<md){md=d;g=x;}
      }
      alvo=g;
    }
    if(!alvo){logar(J,'Não tem em quem jogar daqui.','p');return;}

    let ax=alvo.x, ay=alvo.y;
    const dx=ax-l.x, dy=ay-l.y, dist=Math.hypot(dx,dy)||1;
    if(dist>alcance){ax=l.x+dx/dist*alcance; ay=l.y+dy/dist*alcance;}

    if(tipo==='bomba'){ if(J.bombas<=0) return; J.bombas--; }
    if(tipo==='pedra') J.cdPedraAte=J.t+P.cdPedra; else J.cdBombaAte=J.t+P.cdBomba;
    l.hostil=4.0;
    J.armas[l.lado][tipo]++;
    J.projeteis.push(new Projetil(l.x,l.y,ax,ay,tipo,l.lado));
  }

  /* =======================================================
     O BRAÇO DELES
     A mesma arma, a mesma física e o mesmo alcance do jogador —
     o que muda é quem decide. Ele joga bomba só quando compensa
     (três ou mais juntos no raio) e pedra no resto do tempo, com
     cadência mais lenta que a sua: a vantagem do jogador deixa
     de ser ter pedra e passa a ser saber quando jogar.
     ======================================================= */
  function iaArremesso(J, dt){
    if(J.semArmas) return;
    J.cdBraco = J.cdBraco || {};
    for(const lado of ['mandante','visitante']){
      const b=(J.bracos||{})[lado] ||
              (J.bracoRival && J.bracoRival.lado===lado ? J.bracoRival : null);
      if(!b || !b.vivo || b.fugindo || J.t < (J.cdBraco[lado]||0)) continue;
      if(!agressivo(J,b)) continue;
      if(b.guarda && !J.acordou) continue;

      const alvos=J.discos.filter(d=>d.vivo && inimigos(b.lado,d.lado) && !d.fugindo);
      if(!alvos.length) continue;

      /* bomba automática é só da IA: a nossa bomba é decisão do
         jogador, na tecla E */
      let melhor=null, maior=0;
      if(!b.doJogador && J.bombasRival>0) for(const a of alvos){
        if(U.dist(b.x,b.y,a.x,a.y) > P.alcanceBomba*0.6) continue;
        if(!A.livre(b.x,b.y,a.x,a.y)) continue;
        let n=0;
        for(const o of alvos) if(U.dist(o.x,o.y,a.x,a.y)<80) n++;
        if(n>maior){maior=n; melhor=a;}
      }
      let tipo=null, alvo=null;
      if(melhor && maior>=4){ tipo='bomba'; alvo=melhor; }
      else {
        let md=1e9;
        for(const a of alvos){
          const d=U.dist(b.x,b.y,a.x,a.y);
          if(d<md && d<=P.alcancePedra && A.livre(b.x,b.y,a.x,a.y)){md=d; alvo=a;}
        }
        if(alvo) tipo='pedra';
      }
      if(!alvo) continue;

      /* mira torta: ele erra mais que o jogador, e erro de bomba é o
         que impede que um único braço decida a briga sozinho */
      const erro = tipo==='bomba' ? 34 : 22;
      const ax = alvo.x + U.entre(-erro,erro), ay = alvo.y + U.entre(-erro,erro);
      if(tipo==='bomba') J.bombasRival--;
      J.cdBraco[lado] = J.t + (tipo==='bomba' ? P.cdBomba*2.2 : P.cdPedra*1.7);
      b.hostil=4.0;
      J.armas[b.lado][tipo]++;
      J.projeteis.push(new Projetil(b.x,b.y,ax,ay,tipo,b.lado));
      if(tipo==='bomba'){
        J.alerta=Math.min(100,J.alerta+10);
        logar(J,'Bomba deles.','a');
      }
    }
  }
  function alternarRecuo(J){
    if(J.fase!=='ativo'||emFuga(J)) return;
    J.recuando=!J.recuando;
    logar(J, J.recuando?'Recuando pro ponto de saída.':'De volta pra cima.','r');
  }
  function noPortao(J){
    const l=J.discos.find(d=>d.lider&&d.vivo);
    if(!l) return null;
    const e=D.entradas.find(x=>x.id===l.entrada);
    if(!e) return null;
    return U.dist(l.x,l.y,e.x,e.y) < (e.raio||34)+8 ? e : null;
  }

  /* =======================================================
     DESENHO
     ======================================================= */
  function corLado(l,claro){
    if(l==='visitante') return claro?'#e8e8e8':'#2a5fa8';
    return claro?'#e8e4dc':'#c0392b';
  }
  /* O DISCO TEM DUAS CORES, E AS DUAS SÃO DA TORCIDA.
     Círculo externo na primária, miolo na secundária — que é o que a
     camisa faz. Antes só a externa era da torcida e o miolo caía no tom
     claro genérico do lado, então a segunda cor não aparecia em lugar
     nenhum do jogo e duas torcidas de primária igual viravam o mesmo
     disco. Torcida sem segunda cor de verdade (paleta de uma cor só, ou
     com a primária repetida) continua com o miolo genérico, e nas cenas
     soltas da bancada as duas camadas continuam sendo as do lado. */
  const corDisco = (d, claro) => claro ? (d.cor2 || corLado(d.lado, true))
                                       : (d.cor  || corLado(d.lado, false));
  function desenharDisco(c,d){
    /* O TREMOR É 70% MENOR NO DESENHO (pedido do dono, 18/08/2026):
       a amplitude cheia (±3px por eixo, a cada quadro) virava chiado
       na hora do contato e ninguém entendia a briga — pior ainda com
       o zoom. O `tremor` em si continua igual pra quem o lê como
       estado (decaimento, acúmulo por golpe); só a sacudida encolhe. */
    const tx=d.tremor?(Math.random()-0.5)*d.tremor*0.3:0;
    const ty=d.tremor?(Math.random()-0.5)*d.tremor*0.3:0;
    const x=d.x+tx, y=d.y+ty;
    if(!d.vivo){
      if(d.entrou) return;
      c.globalAlpha=d.preso?.5:.33;
      c.fillStyle='#000'; c.beginPath(); c.ellipse(x,y,d.r,d.r*.6,0,0,7); c.fill();
      c.strokeStyle=d.preso?'#5fa87d':corDisco(d,false); c.lineWidth=2.5;
      c.beginPath(); c.ellipse(x,y,d.r,d.r*.6,0,0,7); c.stroke();
      c.globalAlpha=1; return;
    }
    c.fillStyle='rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(x+2,y+4,d.r,d.r*.82,0,0,7); c.fill();
    /* O DISCO VESTE A CAMISA DA TORCIDA (pedido do dono, 18/08/2026):
       base na primária; com TRÊS cores, duas listras finas no meio —
       secundária e terciária, camisa do São Paulo; com DUAS, só a
       borda na secundária; com uma, sólido. O miolo escuro saiu de
       todas, e o miolo claro genérico (que dava cor de time nenhum)
       só sobrevive nas cenas da bancada, sem torcida de verdade. */
    const base = d.cor || corLado(d.lado, false);
    const sec  = d.cor ? d.cor2 : corLado(d.lado, true);
    const ter  = d.cor ? d.cor3 : null;
    c.fillStyle=base; c.beginPath(); c.arc(x,y,d.r,0,7); c.fill();
    /* UM PADRÃO SÓ, EM CENA NENHUMA DIFERENTE (pedido do dono,
       20/08/2026): base na primária e a camisa em LISTRA FINA na
       borda — uma listra pra quem tem duas cores, duas pra quem tem
       três, e a MESMA grossura nos dois casos. O que muda de uma
       torcida pra outra é quantas listras, nunca a espessura delas.

       Antes a borda comia o disco: 2 px de anel num raio de 7
       deixavam um miolo de 3 px de primária, e num tricolor sobravam
       menos ainda — o disco lia como alvo de tiro, e a cor que a
       torcida usa pra se chamar era a que menos aparecia. A listra é
       fração do raio (20%, subido de 16% a pedido do dono em
       20/08/2026), então o líder, que é maior, tem a mesma proporção
       do resto: o padrão não muda nem por disco nem por cena. */
    const LISTRA = Math.max(1.2, d.r*0.20);
    if(sec){
      c.strokeStyle=sec; c.lineWidth=LISTRA;
      c.beginPath(); c.arc(x,y,d.r-LISTRA/2,0,7); c.stroke();
      if(ter){
        c.strokeStyle=ter; c.lineWidth=LISTRA;
        c.beginPath(); c.arc(x,y,d.r-LISTRA*1.5,0,7); c.stroke();
      }
    }
    /* contorno fino: o disco tem de se ler sobre qualquer chão */
    c.strokeStyle='rgba(0,0,0,.45)'; c.lineWidth=1.2;
    c.beginPath(); c.arc(x,y,d.r,0,7); c.stroke();
    if(d.lider){c.strokeStyle='#e0b040';c.lineWidth=3;c.beginPath();c.arc(x,y,d.r+3,0,7);c.stroke();}
    if(d.golpe>0){c.strokeStyle=`rgba(255,235,190,${d.golpe*6})`;c.lineWidth=2;
      c.beginPath();c.arc(x,y,d.r+6,0,7);c.stroke();}
    if(d.hp<d.hpMax){
      const w=d.r*2, p=Math.max(0,d.hp/d.hpMax);
      c.fillStyle='rgba(0,0,0,.6)'; c.fillRect(x-w/2,y-d.r-9,w,3);
      c.fillStyle=p>.5?'#6a9c4a':p>.25?'#c8a03c':'#b6432f'; c.fillRect(x-w/2,y-d.r-9,w*p,3);
    }
    if(d.lider){
      c.font='600 10px "IBM Plex Mono",monospace'; c.textAlign='center';
      c.fillStyle='rgba(0,0,0,.75)'; c.fillText(d.nome,x+1,y-d.r-13);
      c.fillStyle='#e0b040';         c.fillText(d.nome,x,y-d.r-14);
    }
  }
  function desenharPolicial(c,p,t){
    if(!p.vivo){
      c.globalAlpha=.3; c.fillStyle='#1e3a2c';
      c.beginPath(); c.ellipse(p.x,p.y,p.r,p.r*.6,0,0,7); c.fill(); c.globalAlpha=1; return;
    }
    c.fillStyle='rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(p.x+1.5,p.y+3,p.r,p.r*.85,0,0,7); c.fill();
    c.fillStyle='#1e3a2c'; c.beginPath(); c.arc(p.x,p.y,p.r,0,7); c.fill();
    c.fillStyle='#3f7d5a'; c.beginPath(); c.arc(p.x,p.y,p.r*.62,0,7); c.fill();
    c.fillStyle='#0f1a14'; c.beginPath(); c.arc(p.x,p.y,p.r*.32,0,7); c.fill();
    const b=(Math.sin(t*6+p.giro)+1)/2;
    c.strokeStyle=`rgba(${b>0.5?'220,70,60':'80,140,235'},.8)`; c.lineWidth=2;
    c.beginPath(); c.arc(p.x,p.y,p.r+4,0,7); c.stroke();
    if(p.carga){
      c.strokeStyle='rgba(95,168,125,.55)'; c.lineWidth=1.5;
      c.beginPath(); c.arc(p.x,p.y,p.r+9,0,7); c.stroke();
      c.fillStyle='rgba(232,228,220,.75)'; c.fillRect(p.x-7,p.y-p.r-6,14,4);
    }
  }
  function desenharProjetil(c,p){
    if(p.morto){
      if(p.explosao!==undefined){
        const k=p.explosao/0.45;
        c.strokeStyle=`rgba(226,140,60,${1-k})`; c.lineWidth=4*(1-k);
        c.beginPath(); c.arc(p.x,p.y,20+k*76,0,7); c.stroke();
      }
      return;
    }
    const alt=Math.sin((p.t/p.dur)*Math.PI)*36;
    c.fillStyle='rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(p.x,p.y,5,3,0,0,7); c.fill();
    c.fillStyle=p.tipo==='pedra'?'#8d8880':'#c8562f';
    c.beginPath(); c.arc(p.x,p.y-alt,p.tipo==='pedra'?5:7,0,7); c.fill();
  }

  function desenhar(J,c,opc){
    A.desenharFundo(c);
    A.desenharSobreposicoes(c,J.grades,Object.assign({t:J.t},opc||{}));
    for(const p of J.policiais) desenharPolicial(c,p,J.t);
    const ord=[...J.discos].sort((a,b)=>a.y-b.y);
    for(const d of ord) if(!d.vivo) desenharDisco(c,d);
    for(const d of ord) if(d.vivo)  desenharDisco(c,d);
    for(const p of J.projeteis) desenharProjetil(c,p);
  }

  return {FORMACOES, Disco, criarEstado, passo, desenhar, reforcar,
          /* o simulador precisa das MESMAS fichas que a cena geraria:
             simular não pode dar ao rival um bonde diferente */
          fichasDoPerfil,
          ladoDoJogador, ladoDeles, OUTRO_LADO,
          arremessar, alternarRecuo, noPortao, entrarNoEstadio,
          restaCd, logar, aviso, nivelMoral, romperCordao, conferirGatilho,
          iaArremesso, alvoDeFuga, conferirFim, dePe, agressivo, atacado,
          mandarEntrar, mandarFugir, emFuga, conferirPortoes};
})();
