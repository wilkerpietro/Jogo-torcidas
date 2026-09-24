/* =========================================================
   LNT — LIGA NACIONAL DAS TRETAS (pedido do dono, 22/08/2026)

   Uma competição de tretas 10×10 entre linhas de frente, duas vezes
   por ano, correndo POR CIMA do calendário normal: ela não substitui
   a treta marcada nem o dia de jogo, ela se soma. Treta de LNT pode
   cair em dia vazio, e é isso que enche o calendário morto.

   Quatro divisões, 138 torcidas:
     1ª  24 · 4 chaves de 6 · 16 no mata-mata · caem 4
     2ª  24 · 4 chaves de 6 · 16 no mata-mata · sobem 4, caem 4
     3ª  36 · 6 chaves de 6 · 24 no mata-mata (8 direto às oitavas)
         · sobem 4, caem 6
     4ª  54 · 9 chaves de 6 · os 32 melhores no mata-mata
         · sobem 6 (4 semifinalistas + 2 do playoff dos perdedores
           das quartas) · não cai ninguém, que não há 5ª

   Tudo em duelo de IDA, sem volta. Vitória 3 pontos, derrota 0, e o
   desempate é saldo de feridos e depois feridos do rival — quem bate
   mais e apanha menos passa na frente.

   O QUE ESTE ARQUIVO NÃO FAZ: não desenha nada e não escreve notícia.
   Ele monta a chave, roda os duelos entre as torcidas do mundo e
   guarda o que aconteceu. O feed e o Futebol e Porrada leem daqui.
   ========================================================= */
window.TO = window.TO || {};

TO.lnt = (function(){
  const U = TO.util;
  const M = ()=>TO.mundo;
  const R = ()=>TO.relacoes;

  /* o ano em que a liga nasce, e a semana em que a notícia sai */
  const ANO_FUNDACAO = 2027;

  /* =======================================================
     O FORMATO, divisão por divisão (régua do dono)
     ======================================================= */
  const FORMATO = [
    {n:1, nome:'1ª Divisão',  clubes:24, grupos:4, porGrupo:6,
     passam:4, direto:0, sobem:0, caem:4, playoff:false,
     premio:{campeao:300000, vice:150000, semi:100000,
             quartas:50000, oitavas:30000, dezesseis:0}},
    {n:2, nome:'2ª Divisão',  clubes:24, grupos:4, porGrupo:6,
     passam:4, direto:0, sobem:4, caem:4, playoff:false,
     premio:{campeao:100000, vice:50000, semi:30000,
             quartas:20000, oitavas:10000, dezesseis:0}},
    {n:3, nome:'3ª Divisão',  clubes:36, grupos:6, porGrupo:6,
     passam:4, direto:8, sobem:4, caem:6, playoff:false,
     premio:{campeao:50000, vice:25000, semi:15000,
             quartas:10000, oitavas:5000, dezesseis:3000}},
    {n:4, nome:'4ª Divisão',  clubes:54, grupos:9, porGrupo:6,
     /* aqui não passam os 4 de cada chave: passam os 32 melhores do
        geral, que é o que fecha uma chave de 32 com 9 grupos */
     passam:null, melhores:32, direto:0, sobem:4, caem:0, playoff:true,
     premio:{campeao:30000, vice:15000, semi:10000,
             quartas:5000, oitavas:3000, dezesseis:1500}}
  ];

  /* as fases, da maior pra menor, e quantos duelos cada uma tem */
  const NOME_FASE = {32:'16-avos', 16:'Oitavas', 8:'Quartas',
                     4:'Semifinal', 2:'Final'};

  /* =======================================================
     O CALENDÁRIO DO SEMESTRE

     Dez rodadas: cinco de chave (turno único de 6 dá cinco rodadas)
     e cinco de mata-mata. Uma a cada duas semanas, sempre no mesmo
     dia da semana da edição — e o dia foge de jogo do nosso clube e
     de estrada, pela mesma porta que a treta marcada usa.
     ======================================================= */
  const RODADAS_GRUPO = 5;
  const RODADAS_MATA  = 5;
  const PASSO = 2;                 // semanas entre uma rodada e outra
  const PRIMEIRA = 3;              // semana do semestre em que abre

  function semestreDe(semana){ return semana <= 26 ? 1 : 2; }
  function inicioDoSemestre(semestre){ return semestre === 1 ? 1 : 27; }
  /* a semana em que a primeira rodada do semestre cai */
  const semanaDeAbertura = semestre => inicioDoSemestre(semestre) + PRIMEIRA;
  /* dá pra montar a edição deste semestre? só antes da primeira
     rodada — liga que abre com a chave pela metade não é liga */
  function podeAbrir(E){
    if(!existe(E)) return false;
    const sem = semestreDe(E.data.semana);
    const ed = E.lnt.edicao;
    if(ed && !ed.encerrada && ed.ano === E.data.ano && ed.semestre === sem)
      return false;
    return E.data.semana < semanaDeAbertura(sem);
  }

  function calendario(E, semestre){
    const H = TO.mapa.hash;
    const base = inicioDoSemestre(semestre);
    const dia = 1 + H(`lnt|${E.data.ano}|${semestre}`) % 5;   // seg a sex
    const fora = [];
    for(let i = 0; i < RODADAS_GRUPO + RODADAS_MATA; i++)
      fora.push({rodada:i, semana: base + PRIMEIRA + i*PASSO, dia});
    return fora;
  }

  /* =======================================================
     A LIGA NASCE
     ======================================================= */
  function existe(E){ return !!(E && E.lnt && E.lnt.fundada); }

  /* as 138 que entram: as maiores primeiro, e a divisão sai daí.
     Quem sobrar fica de fora desta edição e entra na próxima, no
     lugar do pior da 4ª — liga fechada pra sempre seria injusta com
     quem cresceu.

     A LIGA É NACIONAL, E NACIONAL QUER DIZER UM PAÍS SÓ (23/08/2026).
     Com as barras bravas dentro do jogo, `jogaveis()` passou de 139
     pra 239, e a peneira despejava as 101 sobrando na 4ª Divisão de
     uma vez: chave de 17 numa liga de 6, e a edição quebrava na hora
     de montar as rodadas. Além do defeito, uma "Liga Nacional" com
     La 12 e Garra Blanca dentro não é nacional. Então a lista é a do
     país da nossa torcida — e país que não tem as 138 não funda liga
     nenhuma até o dono decidir o formato de lá. */
  function paisDaNossa(E){
    const meu = E && E.torcida && E.torcida.clubeId;
    const t = meu ? M().time(meu) : null;
    return (t && t.pais) || 'Brasil';
  }

  function ordenarPorForca(E){
    const pais = paisDaNossa(E);
    const vivas = M().jogaveis().filter(o=>{
      const t = M().time(o.clubeId);
      return ((t && t.pais) || 'Brasil') === pais;
    });
    const peso = o => {
      const t = (E.mundoTorcidas||{})[o.id] || {};
      const membros = t.membros != null ? t.membros : (o.membros||20);
      const ind = R().indicadoresDe ? R().indicadoresDe(E, o.id) : null;
      const prest = ind ? (ind.prestigio||0) : (o.prestigio||15);
      return membros + prest*2;
    };
    return vivas.sort((a,b)=> peso(b) - peso(a) ||
                              (a.nome < b.nome ? -1 : 1));
  }

  const VAGAS_LNT = FORMATO.reduce((a,f)=>a + f.clubes, 0);   // 138

  function fundar(E){
    if(existe(E)) return null;
    const lista = ordenarPorForca(E).map(o=>o.id);
    if(lista.length < VAGAS_LNT) return null;   // país sem liga ainda
    const divs = [];
    let i = 0;
    for(const f of FORMATO){
      divs.push(lista.slice(i, i + f.clubes));
      i += f.clubes;
    }
    E.lnt = {
      fundada:{ano:E.data.ano, semana:E.data.semana, dia:E.data.dia},
      edicoes: 0,
      fora: lista.slice(i),          // as que não couberam desta vez
      composicao: divs,              // quem joga cada divisão na próxima
      edicao: null,
      historico: []
    };
    return {ano:E.data.ano, divisoes:divs.map((d,k)=>({
      n: FORMATO[k].n, nome: FORMATO[k].nome, clubes: d.length}))};
  }

  /* =======================================================
     A EDIÇÃO
     ======================================================= */
  function chaves(ids, grupos, semente){
    /* cabeças de chave espalhadas: o 1º vai pro grupo A, o 2º pro B…
       e a serpentina volta, que é como se semeia chave de verdade */
    const g = Array.from({length:grupos}, ()=>[]);
    ids.forEach((id, k)=>{
      const volta = Math.floor(k / grupos);
      const pos = volta % 2 ? grupos - 1 - (k % grupos) : k % grupos;
      g[pos].push(id);
    });
    return g;
  }

  /* turno único de 6: método do círculo, cinco rodadas de três duelos */
  function rodadasDoGrupo(grupo){
    const t = grupo.slice();
    const n = t.length;
    const fora = [];
    const giro = t.slice(1);
    for(let r = 0; r < n - 1; r++){
      const jogos = [];
      const ordem = [t[0]].concat(giro);
      for(let k = 0; k < n/2; k++){
        const a = ordem[k], b = ordem[n-1-k];
        /* o mando alterna pra ninguém receber cinco vezes */
        jogos.push(r % 2 ? {a:b, b:a} : {a, b});
      }
      fora.push(jogos);
      giro.unshift(giro.pop());
    }
    return fora;
  }

  function montarEdicao(E){
    if(!existe(E)) return null;
    const L = E.lnt;
    const semestre = semestreDe(E.data.semana);
    const cal = calendario(E, semestre);
    const H = TO.mapa.hash;
    const divs = L.composicao.map((ids, k)=>{
      const f = FORMATO[k];
      const gs = chaves(ids, f.grupos, H(`lnt|${E.data.ano}|${semestre}|${k}`));
      const rodadas = [];
      for(let r = 0; r < RODADAS_GRUPO; r++) rodadas.push([]);
      gs.forEach((grupo, gi)=>{
        rodadasDoGrupo(grupo).forEach((jogos, r)=>{
          for(const j of jogos)
            rodadas[r].push({grupo:gi, a:j.a, b:j.b,
                             fa:null, fb:null, venceu:null});
        });
      });
      return {n:f.n, nome:f.nome, clubes:ids.slice(), grupos:gs,
              rodadas, mata:[], campeao:null, vice:null, premiados:{}};
    });
    L.edicao = {ano:E.data.ano, semestre, n: ++L.edicoes,
                calendario:cal, divs, rodada:0, encerrada:false};
    return L.edicao;
  }

  /* =======================================================
     O DUELO — 10 contra 10, linha de frente contra linha de frente
     ======================================================= */
  const EFETIVO = 10;

  /* A FORÇA É A DOS DEZ QUE DESCEM (correção do dono, 23/08/2026)

     Antes isto lia a média de ficha do QUADRO INTEIRO da torcida, com
     novato dentro. Duas coisas quebravam:

       · a IA era medida por uma régua e nós por outra — o `abrirTreta`
         escala os NOSSOS dez melhores (linha de frente primeiro,
         componente improvisando), e a IA respondia pela média de todo
         mundo;
       · a média do quadro DILUI com o tamanho, então a torcida de 250
         saía mais fraca que a de 30. Medido no começo de um jogo: o
         mundo inteiro cabia entre 5,59 e 5,77, e 47% dos pares
         empatavam na casa decimal.

     Agora a conta é a mesma dos dois lados: os dez que desceriam, na
     ordem em que a diretoria escala — linha de frente, componente,
     diretoria, novato. Faltando gente apta, o bonde chega desfalcado e
     a força cai na proporção do que faltou. Medido depois: o mundo se
     abre de 8,50 a 11,50 e os pares empatados caem de 4.486 pra 1.941. */
  const ORDEM_LNT = ['frente', 'componente', 'diretoria', 'novato'];

  function forcaDe(E, id){
    const o = M().torcida(id);
    if(!o) return 5;
    const q = R().quadroDe ? R().quadroDe(E, id) : null;
    if(!q) return (R().mediaDeFichaGerada(o, 20, E) || 5);
    const disp = Math.max(0, R().disponiveisIA(E, id));
    const cabem = Math.min(EFETIVO, disp);
    if(!cabem) return 0;
    let falta = cabem, soma = 0;
    for(const c of ORDEM_LNT){
      const n = Math.min(falta, q.cargos[c] || 0);
      soma += n * (q.forca[c] || 0);
      falta -= n;
      if(!falta) break;
    }
    const usados = cabem - falta;
    if(!usados) return 0;
    /* desfalcado é desfalcado: sete contra dez não vale dez */
    return (soma / usados) * (usados / EFETIVO);
  }

  /* O FAVORITO GANHA PROPORCIONAL À VANTAGEM (régua do dono,
     23/08/2026): o 70% cravado dava o mesmo resultado num duelo
     parelho e no mais desigual do mundo. Agora é uma rampa — 55% no
     duelo de igual pra igual, 80% quando um lado é 35% mais forte que
     o outro, e nada passa disso. A conta é de RAZÃO e não de
     diferença, pra que a régua continue valendo quando as fichas do
     mundo inteiro subirem com os anos de treino. */
  const PISO_FAV = 0.55, TETO_FAV = 0.80, RAMPA_FAV = 0.35;
  function chanceDoFavorito(pFrt, pFrc){
    if(pFrc <= 0) return TETO_FAV;
    const vantagem = pFrt / pFrc - 1;
    return PISO_FAV + U.limitar(vantagem / RAMPA_FAV, 0, 1) *
                      (TETO_FAV - PISO_FAV);
  }

  /* devolve {venceuA, fa, fb} — feridos de cada lado, de 0 a 9 */
  function simularDuelo(E, a, b){
    const pA = forcaDe(E, a), pB = forcaDe(E, b);
    const favA = pA === pB ? U.rng() < 0.5 : pA > pB;
    const chance = chanceDoFavorito(Math.max(pA, pB), Math.min(pA, pB));
    const venceuA = U.rng() < chance ? favA : !favA;
    const feridos = perdeu => U.inteiro(perdeu ? 3 : 0, perdeu ? 7 : 3);
    return {venceuA, fa: feridos(!venceuA), fb: feridos(venceuA)};
  }

  /* o preço da briga no mundo: baixa de verdade e prestígio */
  function cobrarDuelo(E, id, feridos, venceu, fase){
    if(R().baixasIA) R().baixasIA(E, id, feridos, 0);
    if(R().mover) R().mover(E, id, 'prestigio', venceu ? 0.4 : -0.2);
    if(R().anotarBriga) R().anotarBriga(E, id, venceu);
  }

  function resolver(E, j, fase){
    if(j.venceu) return j;
    const d = simularDuelo(E, j.a, j.b);
    j.fa = d.fa; j.fb = d.fb;
    j.venceu = d.venceuA ? j.a : j.b;
    cobrarDuelo(E, j.a, j.fa, d.venceuA, fase);
    cobrarDuelo(E, j.b, j.fb, !d.venceuA, fase);
    return j;
  }

  /* =======================================================
     A TABELA — 3 pontos, saldo de feridos, feridos do rival
     ======================================================= */
  function linhaVazia(id){
    return {id, j:0, v:0, d:0, p:0, fez:0, tomou:0, sf:0};
  }

  function tabelaDoGrupo(div, gi){
    const linhas = {};
    for(const id of div.grupos[gi]) linhas[id] = linhaVazia(id);
    for(const r of div.rodadas)
      for(const j of r){
        if(j.grupo !== gi || !j.venceu) continue;
        const a = linhas[j.a], b = linhas[j.b];
        if(!a || !b) continue;
        a.j++; b.j++;
        /* "fez" é ferido do RIVAL: quem bate mais soma mais */
        a.fez += j.fb; a.tomou += j.fa;
        b.fez += j.fa; b.tomou += j.fb;
        if(j.venceu === j.a){ a.v++; a.p += 3; b.d++; }
        else { b.v++; b.p += 3; a.d++; }
      }
    const fora = Object.values(linhas);
    for(const l of fora) l.sf = l.fez - l.tomou;
    const nome = id => (M().torcida(id)||{}).nome || id;
    return fora.sort((x,y)=>
      (y.p - x.p) || (y.sf - x.sf) || (y.fez - x.fez) ||
      (nome(x.id) < nome(y.id) ? -1 : 1));
  }

  function tabelaGeral(div){
    const fora = [];
    div.grupos.forEach((g, gi)=>
      tabelaDoGrupo(div, gi).forEach((l, pos)=>
        fora.push(Object.assign({grupo:gi, pos:pos+1}, l))));
    const nome = id => (M().torcida(id)||{}).nome || id;
    return fora.sort((x,y)=>
      (y.p - x.p) || (y.sf - x.sf) || (y.fez - x.fez) ||
      (nome(x.id) < nome(y.id) ? -1 : 1));
  }

  /* =======================================================
     O MATA-MATA — cruzamento olímpico: 1×n, 2×n-1, e assim por diante
     ======================================================= */
  function cruzar(ids){
    const jogos = [];
    for(let k = 0; k < ids.length/2; k++)
      jogos.push({a:ids[k], b:ids[ids.length-1-k],
                  fa:null, fb:null, venceu:null});
    return jogos;
  }

  function classificados(div, f){
    const geral = tabelaGeral(div);
    if(f.melhores) return geral.slice(0, f.melhores).map(l=>l.id);
    /* os `passam` melhores de cada chave, semeados pelo geral */
    const passa = new Set();
    div.grupos.forEach((g, gi)=>
      tabelaDoGrupo(div, gi).slice(0, f.passam).forEach(l=>passa.add(l.id)));
    return geral.filter(l=>passa.has(l.id)).map(l=>l.id);
  }

  function abrirMata(E, div, slot){
    const f = FORMATO.find(x=>x.n === div.n);
    const cls = classificados(div, f);
    if(f.direto){
      /* os melhores esperam nas oitavas; o resto briga o 16-avos */
      const direto = cls.slice(0, f.direto);
      const resto  = cls.slice(f.direto);
      div.mata.push({fase:NOME_FASE[32], jogos:cruzar(resto),
                     espera:direto, slot});
    } else {
      div.mata.push({fase:NOME_FASE[cls.length] || `${cls.length} clubes`,
                     jogos:cruzar(cls), espera:[], slot});
    }
    return div.mata[0];
  }

  /* quem passou de uma fase, na ordem de semente da primeira fase.
     `slot` é a rodada que acabou de rolar: o que nasce aqui joga na
     seguinte, e é isso que impede o playoff e a semifinal — criados
     no mesmo instante — de caírem no mesmo dia da quartas. */
  function avancarMata(E, div, slot){
    const f = FORMATO.find(x=>x.n === div.n);
    /* a última fase NÃO-playoff é a que dá a vez: o playoff é um galho
       lateral e não decide quem segue na chave */
    const linha = div.mata.filter(m=>!m.playoff);
    const ult = linha[linha.length - 1];
    if(!ult || ult.jogos.some(j=>!j.venceu)) return null;
    if(div.mata.some(m=>m.slot > slot)) return null;   // já tem fase marcada
    const vivos = [...(ult.espera||[]), ...ult.jogos.map(j=>j.venceu)];
    /* o playoff dos perdedores das quartas (só na 4ª): dois acessos a
       mais, decididos entre os quatro que caíram nas quartas. Ele roda
       junto da semifinal, no mesmo dia. */
    if(f.playoff && ult.fase === 'Quartas' &&
       !div.mata.some(m=>m.playoff)){
      const caidos = ult.jogos.map(j=>j.venceu === j.a ? j.b : j.a);
      const ordem = tabelaGeral(div).map(l=>l.id)
        .filter(id=>caidos.includes(id));
      div.mata.push({fase:'Playoff do acesso', jogos:cruzar(ordem),
                     espera:[], playoff:true, slot: slot + 1});
    }
    if(ult.fase === 'Final'){
      const j = ult.jogos[0];
      div.campeao = j.venceu;
      div.vice = j.venceu === j.a ? j.b : j.a;
      return null;
    }
    if(vivos.length < 2){ div.campeao = vivos[0] || null; return null; }
    const ordem = tabelaGeral(div).map(l=>l.id).filter(id=>vivos.includes(id));
    const nova = {fase:NOME_FASE[ordem.length] || `${ordem.length} clubes`,
                  jogos:cruzar(ordem), espera:[], slot: slot + 1};
    div.mata.push(nova);
    return nova;
  }

  /* a fase que está aberta agora, se houver */
  function faseAberta(div){
    for(const m of div.mata) if(m.jogos.some(j=>!j.venceu)) return m;
    return null;
  }

  /* =======================================================
     A RODADA DO DIA

     `rodar` é chamada uma vez por dia pelo fechamento do dia. Ela
     resolve os duelos de TODO MUNDO, menos o nosso: o nosso vira
     decisão no feed, e a chave só anda quando ele for respondido.
     ======================================================= */
  /* quantas rodadas de mata-mata cada divisão precisa — as menores
     entram depois, pra todas decidirem no mesmo dia */
  function fasesDe(f){
    if(f.melhores) return 5;                 // 32 → 16 → 8 → 4 → 2
    if(f.direto)   return 5;                 // 16-avos com 8 esperando
    return 4;                                // 16 → 8 → 4 → 2
  }
  const atrasoDe = f => RODADAS_MATA - fasesDe(f);

  function rodadaDeHoje(E){
    if(!existe(E) || !E.lnt.edicao || E.lnt.edicao.encerrada) return null;
    const ed = E.lnt.edicao;
    return (ed.calendario || []).find(c=>
      c.semana === E.data.semana && c.dia === E.data.dia) || null;
  }

  /* os duelos que rolam hoje, divisão por divisão */
  function duelosDoDia(E, r){
    const ed = E.lnt.edicao;
    const fora = [];
    ed.divs.forEach((div, k)=>{
      const f = FORMATO[k];
      if(r.rodada < RODADAS_GRUPO){
        for(const j of div.rodadas[r.rodada])
          fora.push({div, f, fase:`${r.rodada+1}ª rodada`, grupo:j.grupo, j});
        return;
      }
      const slot = r.rodada - RODADAS_GRUPO;
      if(slot < atrasoDe(f)) return;          // esta divisão ainda espera
      if(!div.mata.length){
        if(div.rodadas.some(rr=>rr.some(j=>!j.venceu))) return;
        abrirMata(E, div, slot);
      }
      for(const m of div.mata){
        if(m.slot !== slot) continue;
        for(const j of m.jogos) if(!j.venceu)
          fora.push({div, f, fase:m.fase, m, j});
      }
    });
    return fora;
  }

  const nosso = (E, j) => j.a === E.torcida.id || j.b === E.torcida.id;

  function rodar(E){
    const r = rodadaDeHoje(E);
    if(!r) return null;
    const ed = E.lnt.edicao;
    if(ed.rodadaFeita === r.rodada) return null;
    ed.rodadaFeita = r.rodada;
    const lista = duelosDoDia(E, r);
    let meu = null;
    const feitos = [];
    for(const d of lista){
      if(nosso(E, d.j)){ meu = d; continue; }   // o nosso é jogado, não sorteado
      resolver(E, d.j, d.fase);
      feitos.push(d);
    }
    conferir(E, r.rodada - RODADAS_GRUPO);
    return {rodada:r.rodada, meu, feitos};
  }

  /* o nosso duelo em aberto, se houver */
  function meuDuelo(E){
    if(!existe(E) || !E.lnt.edicao) return null;
    const ed = E.lnt.edicao;
    for(const div of ed.divs){
      for(let r = 0; r < div.rodadas.length; r++)
        for(const j of div.rodadas[r])
          if(!j.venceu && nosso(E, j))
            return {div, j, fase:`${r+1}ª rodada`, grupo:j.grupo};
      for(const m of div.mata)
        for(const j of m.jogos)
          if(!j.venceu && nosso(E, j)) return {div, j, fase:m.fase, m};
    }
    return null;
  }

  /* o resultado do NOSSO duelo, vindo da cena */
  function registrarNosso(E, dados){
    const d = meuDuelo(E);
    if(!d) return null;
    const souA = d.j.a === E.torcida.id;
    const meusFeridos  = Math.max(0, Math.round(dados.nossos || 0));
    const delesFeridos = Math.max(0, Math.round(dados.deles || 0));
    d.j.fa = souA ? meusFeridos : delesFeridos;
    d.j.fb = souA ? delesFeridos : meusFeridos;
    d.j.venceu = dados.ganhamos ? E.torcida.id
                                : (souA ? d.j.b : d.j.a);
    d.j.wo = !!dados.wo;
    /* o rival também sangra e também colhe, como em qualquer duelo */
    const rival = souA ? d.j.b : d.j.a;
    cobrarDuelo(E, rival, delesFeridos, !dados.ganhamos, d.fase);
    const ed = E.lnt.edicao;
    conferir(E, (ed.rodadaFeita || 0) - RODADAS_GRUPO);
    return d;
  }

  /* =======================================================
     O DINHEIRO E O QUE FICA PRO SEMESTRE SEGUINTE
     ======================================================= */
  const CHAVE_PREMIO = {'16-avos':'dezesseis', 'Oitavas':'oitavas',
                        'Quartas':'quartas', 'Semifinal':'semi',
                        'Final':'vice'};

  function pagar(E, div, id, valor, rot){
    if(!valor) return;
    div.premiados[id] = (div.premiados[id] || 0) + valor;
    if(id === E.torcida.id){
      TO.estado.lancar(E, _t('LNT · {rot}', {rot}), valor);
    } else {
      const t = (E.mundoTorcidas || {})[id];
      if(t) t.caixa = (t.caixa || 0) + valor;
    }
  }

  /* fecha o que dá pra fechar: paga quem caiu, abre a fase seguinte */
  function conferir(E, slot){
    const ed = E.lnt.edicao;
    if(!ed) return;
    ed.divs.forEach((div, k)=>{
      const f = FORMATO[k];
      for(const m of div.mata){
        if(m.pago || m.jogos.some(j=>!j.venceu)) continue;
        m.pago = true;
        /* o playoff não elimina ninguém da chave: ali se disputa acesso */
        if(!m.playoff){
          const chave = CHAVE_PREMIO[m.fase];
          const valor = chave ? f.premio[chave] : 0;
          for(const j of m.jogos){
            const caiu = j.venceu === j.a ? j.b : j.a;
            if(m.fase === 'Final'){
              pagar(E, div, j.venceu, f.premio.campeao, _t('campeão'));
              pagar(E, div, caiu, f.premio.vice, _t('vice'));
            } else pagar(E, div, caiu, valor, _t(m.fase).toLowerCase());
          }
        }
      }
      if(!div.campeao) avancarMata(E, div, slot);
    });
    if(ed.divs.every(d=>d.campeao) && !ed.encerrada) encerrar(E);
  }

  /* =======================================================
     O FIM DA EDIÇÃO: sobe, desce e a liga do semestre que vem
     ======================================================= */
  function semifinalistas(div){
    const semi = div.mata.find(m=>m.fase === 'Semifinal');
    if(!semi) return [];
    return semi.jogos.reduce((f,j)=>f.concat([j.a, j.b]), []);
  }
  function doPlayoff(div){
    const p = div.mata.find(m=>m.playoff);
    return p ? p.jogos.map(j=>j.venceu).filter(Boolean) : [];
  }
  function ultimosDosGrupos(div){
    return div.grupos.map((g, gi)=>{
      const t = tabelaDoGrupo(div, gi);
      return t[t.length - 1];
    }).filter(Boolean)
      .sort((a,b)=> (a.p - b.p) || (a.sf - b.sf))
      .map(l=>l.id);
  }

  function encerrar(E){
    const L = E.lnt, ed = L.edicao;
    if(!ed || ed.encerrada) return null;
    ed.encerrada = true;
    const sobem = [], caem = [];
    ed.divs.forEach((div, k)=>{
      const f = FORMATO[k];
      sobem[k] = k === 0 ? [] :
        [...semifinalistas(div), ...(f.playoff ? doPlayoff(div) : [])]
          .filter((v,i,a)=>a.indexOf(v)===i);
      caem[k] = f.caem ? ultimosDosGrupos(div).slice(0, f.caem) : [];
    });
    /* a composição nova: cada divisão perde quem sobe e quem cai, e
       recebe quem veio de cima e de baixo */
    const nova = ed.divs.map((div, k)=>
      div.clubes.filter(id=>!sobem[k].includes(id) && !caem[k].includes(id)));
    for(let k = 0; k < nova.length; k++){
      if(k > 0) nova[k] = nova[k].concat(caem[k-1]);
      if(k < nova.length - 1) nova[k] = nova[k].concat(sobem[k+1]);
    }
    /* A PENEIRA: quem ficou de fora entra no lugar do pior da última
       divisão. Liga fechada pra sempre seria injusta com quem cresceu
       — e sem isto a torcida que sobrou na fundação nunca jogaria. */
    /* A TROCA É UM POR UM: sai um pior da última, entra um de fora.
       Antes isto entregava a fila INTEIRA de uma vez e ainda jogava
       fora quem estava esperando — com 1 sobrando não se notava, com
       101 a 4ª Divisão virava chave de 17 e a edição quebrava. Agora
       `fora` é fila de verdade: quem não entrou continua na frente, e
       quem caiu vai pro fim dela. */
    const ultima = nova.length - 1;
    if((L.fora || []).length){
      const piores = ultimosDosGrupos(ed.divs[ultima])
        .filter(id=>nova[ultima].includes(id))
        .slice(0, L.fora.length);
      const entram = L.fora.slice(0, piores.length);
      nova[ultima] = nova[ultima].filter(id=>!piores.includes(id))
                                 .concat(entram);
      L.fora = L.fora.slice(entram.length).concat(piores);
    }
    L.composicao = nova;
    L.historico.push({
      ano:ed.ano, semestre:ed.semestre, n:ed.n,
      campeoes: ed.divs.map((d,k)=>({div:d.n, campeao:d.campeao,
                                     vice:d.vice,
                                     sobem:sobem[k].slice(),
                                     caem:caem[k].slice()})),
      nosso: nossoNaEdicao(E, ed)
    });
    return L.historico[L.historico.length - 1];
  }

  /* onde a nossa torcida chegou nesta edição */
  function nossoNaEdicao(E, ed){
    const meu = E.torcida.id;
    for(const div of ed.divs){
      if(!div.clubes.includes(meu)) continue;
      let fase = 'Fase de chaves';
      for(const m of div.mata)
        if(m.jogos.some(j=>j.a === meu || j.b === meu) ||
           (m.espera||[]).includes(meu)) fase = m.fase;
      if(div.campeao === meu) fase = 'Campeão';
      else if(div.vice === meu) fase = 'Vice';
      return {div:div.n, nome:div.nome, fase,
              premio: div.premiados[meu] || 0};
    }
    return null;
  }

  return {FORMATO, NOME_FASE, ANO_FUNDACAO, EFETIVO,
          RODADAS_GRUPO, RODADAS_MATA,
          existe, fundar, montarEdicao, calendario, semestreDe,
          podeAbrir, semanaDeAbertura, inicioDoSemestre,
          simularDuelo, resolver, cruzar, chaves, rodadasDoGrupo,
          forcaDe, chanceDoFavorito, PISO_FAV, TETO_FAV, RAMPA_FAV,
          tabelaDoGrupo, tabelaGeral, classificados,
          abrirMata, avancarMata, faseAberta, ordenarPorForca,
          rodadaDeHoje, duelosDoDia, rodar, meuDuelo, registrarNosso,
          conferir, encerrar, nossoNaEdicao, fasesDe, atrasoDe,
          semifinalistas, doPlayoff, ultimosDosGrupos};
})();
