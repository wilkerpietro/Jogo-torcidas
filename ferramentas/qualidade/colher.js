/* Colhe do jogo REAL os dois conjuntos que o TypeSafe vai julgar:
   1) toda linha de texto gerada — feed, jornal da rodada, resultado de
      briga, virada de ano, pergunta de entrevista e rotulo de botao
   2) cada par dica -> consequencia, com o efeito MEDIDO do clique

   VARIAS TORCIDAS, DUAS TEMPORADAS CADA (21/09/2026). Com uma torcida
   so a colheita via um estado, uma praca, um rival e as competicoes de
   uma regiao — e o texto do jogo varia justamente nisso. Cada torcida
   roda numa aba limpa e o resultado entra no mesmo caldeirao, sem
   repetir linha.

   Uso:
     node ferramentas/qualidade/colher.js                       # as tres padrao
     node ferramentas/qualidade/colher.js "Mancha Verde,Bamor"  # as que quiser
     node ferramentas/qualidade/colher.js "" saida.json 3       # 3 temporadas  */
const {chromium} = require('playwright-core');
const fs = require('fs');
const TORCIDAS = (process.argv[2] || 'Mancha Verde,Cearamor,Guarda Popular')
                   .split(',').map(s=>s.trim()).filter(Boolean);
const SAIDA = process.argv[3] || '/home/user/Jogo-torcidas/ferramentas/qualidade/amostra.json';
const ANOS  = Math.max(1, parseInt(process.argv[4] || '2', 10));

(async () => {
  const nav = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const erros=[], textos=[], pares=[];
  const vistoT = new Set(), vistoP = new Set();

  for(const torcida of TORCIDAS){
  const pg = await nav.newPage({viewport:{width:1280,height:900}});
  pg.on('pageerror', e=>erros.push(`[${torcida}] ${e.message}`));
  await pg.goto('http://127.0.0.1:8765/index.html'); await pg.waitForTimeout(900);
  await pg.click('#btNovoJogo'); await pg.waitForTimeout(400);
  const achou = await pg.evaluate(t=>{ try{ return !!TO.tela.escolherTorcida(t); }catch(e){ return false; } }, torcida);
  await pg.click('#btSelecionarTorcida'); await pg.waitForTimeout(1600);
  for(let k=0;k<3;k++){ const c = await pg.evaluate(()=>{ const b=[...document.querySelectorAll('button')].find(x=>x.offsetParent && /já sei jogar|pular/i.test(x.textContent)); if(b){ b.click(); return 1; } return null; }); if(!c) break; await pg.waitForTimeout(400); }

  const dados = await pg.evaluate((ANOS)=>{
    TO.tela.pausarTempo("teste");
    const E=TO.estado.E, F=TO.feed, R=TO.relacoes, RC=TO.relacaoClube;
    const textos = [], pares = [];
    const vistoT = new Set(), vistoP = new Set();   /* locais desta torcida */
    const nm = id => (TO.mundo.torcida(id)||{}).nome || (TO.mundo.time(id)||{}).nome || id;
    const medir = () => ({moral:Math.round(E.indicadores.moral*5*10)/10,
                          prestigio:Math.round(E.indicadores.prestigio*5*10)/10,
                          clube:RC.nivel(E), dinheiro:Math.round(E.dinheiro)});
    const guardaTexto = (o) => {
      const ch = o.tipo+'|'+o.texto;
      if(o.texto && !vistoT.has(ch)){ vistoT.add(ch); textos.push(o); }
    };
    /* ---- (2) dica -> consequencia: clica CADA opcao e mede ---- */
    function provarCartao(gerar, rotulo){
      for(let sa=1; sa<140 && pares.length<200; sa++){
        E.feed=[]; E.feedFila=[];
        const antesFila = E.feed.length;
        try{ gerar(sa); }catch(_){ continue; }
        for(let i=0;i<40 && F.dropar(E);i++){}
        const m = E.feed.find(x=>(x.botoes||[]).length || x.kind==='entrevista');
        if(!m) continue;
        /* entrevista: cada pergunta tem opcoes proprias */
        if(m.kind==='entrevista'){
          for(const p of (m.dados.perguntas||[])){
            guardaTexto({tipo:'pergunta', kind:m.kind, id:p.id, texto:p.texto});
            for(const o of (p.opcoes||[])){
              const ch = `${rotulo}|entrevista|${p.id}|${o.id}`;
              if(vistoP.has(ch)) continue; vistoP.add(ch);
              guardaTexto({tipo:'rotulo-botao', kind:m.kind, id:p.id, texto:o.rot});
              /* mede num cartao virgem */
              E.feed=[]; E.feedFila=[];
              try{ gerar(sa); }catch(_){ continue; }
              for(let i=0;i<40 && F.dropar(E);i++){}
              const m2 = E.feed.find(x=>x.kind==='entrevista'); if(!m2) continue;
              const p2 = (m2.dados.perguntas||[]).find(x=>x.id===p.id); if(!p2) continue;
              const alvo = p2.alvo || null;
              const a = medir(), relA = alvo ? R.nivel(E, alvo) : null;
              try{ F.responderEntrevista(E, m2.id, p2.id, o.id); }catch(_){ continue; }
              const d = medir(), relD = alvo ? R.nivel(E, alvo) : null;
              pares.push({fonte:rotulo, kind:m2.kind, pergunta:p2.texto, rotulo_botao:o.rot,
                dica:o.nota||'', consequencia:m2.consequencia||'(a mensagem ainda nao fechou)',
                medido:{moral:Math.round((d.moral-a.moral)*10)/10,
                        prestigio:Math.round((d.prestigio-a.prestigio)*10)/10,
                        relacao_clube:d.clube-a.clube,
                        relacao_com_ela: relA===null?null:(relD-relA),
                        alvo: alvo?nm(alvo):null,
                        dinheiro:d.dinheiro-a.dinheiro}});
            }
          }
          continue;
        }
        guardaTexto({tipo:'mensagem', kind:m.kind, texto:m.texto});
        for(const b of (m.botoes||[])){
          const ch = `${rotulo}|${m.kind}|${b.id}|${(b.dica||'').slice(0,30)}`;
          if(vistoP.has(ch)) continue; vistoP.add(ch);
          guardaTexto({tipo:'rotulo-botao', kind:m.kind, texto:b.rot});
          E.feed=[]; E.feedFila=[];
          try{ gerar(sa); }catch(_){ continue; }
          for(let i=0;i<40 && F.dropar(E);i++){}
          const m2 = E.feed.find(x=>(x.botoes||[]).some(y=>y.id===b.id)); if(!m2) continue;
          const alvo = (m2.dados||{}).alvo || null;
          const a = medir(), relA = alvo ? R.nivel(E, alvo) : null;
          try{ F.responder(E, m2.id, b.id); }catch(_){ continue; }
          const d = medir(), relD = alvo ? R.nivel(E, alvo) : null;
          pares.push({fonte:rotulo, kind:m2.kind, pergunta:m2.texto, rotulo_botao:b.rot,
            dica:b.dica||'', consequencia:m2.consequencia||'(sem linha de consequencia)',
            medido:{moral:Math.round((d.moral-a.moral)*10)/10,
                    prestigio:Math.round((d.prestigio-a.prestigio)*10)/10,
                    relacao_clube:d.clube-a.clube,
                    relacao_com_ela: relA===null?null:(relD-relA),
                    alvo: alvo?nm(alvo):null,
                    dinheiro:d.dinheiro-a.dinheiro}});
        }
      }
    }

    function provas(){
      const guardado = {seq: E.sequenciaClube, ult: E.entrevistaUltimas,
                        feed: E.feed, fila: E.feedFila};
      E.sequenciaClube=['D','D','D','V','E'];
      provarCartao(sa=>F.entrevistaDeHoje(E,sa), 'entrevista (time mal)');
      E.sequenciaClube=['V','V','V','V','V']; E.entrevistaUltimas=null;
      provarCartao(sa=>F.entrevistaDeHoje(E,sa), 'entrevista (time bem)');
      E.sequenciaClube=['D','D','D','D','E'];
      provarCartao(sa=>F.protestoNoCT(E,sa), 'protesto no CT');
      E.veredictosVistos={};
      provarCartao(()=>{ E.veredictosVistos={}; F.veredictoDeHoje(E); },
                   'veredicto da campanha');
      /* devolve o jogo ao estado em que estava: o resto da colheita
         continua de onde parou, e a prova nao pode contaminar */
      E.sequenciaClube = guardado.seq; E.entrevistaUltimas = guardado.ult;
      E.feed = guardado.feed; E.feedFila = guardado.fila;
    }

    /* AS LINHAS QUE NAO PASSAM PELO `texto` DA MENSAGEM.
       O jornal da rodada, o resultado da briga e a virada de ano sao
       montados por modulo proprio na hora de desenhar a tela, entao
       nao aparecem em `E.feed[].texto` e a colheita antiga nao os via
       — eram ~1800 linhas fora do alcance. `cata` achata o que cada
       montador devolve, que e objeto aninhado de pedacos de frase. */
    const cata = (o, kind, fundo) => {
      if(!o) return;
      if(typeof o === 'string'){
        if(o.length > 3 && /[a-zà-ú]{3}/i.test(o))
          guardaTexto({tipo:fundo, kind, texto:o});
      }
      else if(Array.isArray(o)) o.forEach(x=>cata(x, kind, fundo));
      else if(typeof o === 'object') Object.values(o).forEach(x=>cata(x, kind, fundo));
    };
    const colherDaTela = m => {
      if(!m) return;
      guardaTexto({tipo:'mensagem', kind:m.kind, texto:m.texto});
      for(const b of (m.botoes||[])) guardaTexto({tipo:'rotulo-botao', kind:m.kind, texto:b.rot});
      try{ if(m.kind==='rodada' && TO.gazeta) cata(TO.gazeta.montar(E,m), 'rodada', 'jornal'); }catch(_){}
      try{ if(TO.porrada && m.dados && m.dados.a) cata(TO.porrada.montar(E,m), m.kind, 'briga'); }catch(_){}
      try{ if(TO.porrada && m.kind==='lnt') cata(TO.porrada.montarLNT(E,m), 'lnt', 'briga'); }catch(_){}
    };

    /* roda temporada inteira pra encher tabela, sequencia, chave e
       fechar competicao — o veredicto e a virada de ano so existem no
       fim, e era ai que a colheita de 200 dias parava antes */
    let anoAnterior = E.data.ano;
    let provou = false;
    for(let d=0; d<380*ANOS; d++){ try{TO.estado.avancarDia();}catch(e){}
      /* AS PROVAS NO FIM DA PRIMEIRA TEMPORADA, NAO DEPOIS DE TODAS.
         O veredicto da campanha so existe enquanto a participacao do
         time na competicao esta encerrada; passada a virada de ano a
         tabela reinicia e nao ha campanha pra julgar — era por isso
         que a colheita de temporada inteira voltava zero veredicto
         onde a de 200 dias trazia dois. */
      if(!provou && d > 330){ provou = true; provas(); }
      for(const m of (E.feedFila||[]).concat(E.feed||[])) colherDaTela(m);
      try{while(F.dropar(E)){}}catch(_){}
      if(E.data.ano !== anoAnterior){
        anoAnterior = E.data.ano;
        try{ cata(TO.almanaque.placarDoAnoTodo(E, E.data.ano-1), 'almanaque', 'virada'); }catch(_){}
        for(const comp of (E.temporada && E.temporada.competicoes || []))
          try{ cata(TO.almanaque.abertura(E, comp), 'almanaque', 'abertura'); }catch(_){}
      }
      let g=0; while(F.travado(E)&&g++<30){const m=F.decisaoAberta(E); if(!m)break;
        colherDaTela(m);
        const bs=m.botoes||[]; const b=bs[Math.floor(Math.random()*bs.length)];
        if(b){try{F.responder(E,m.id,b.id);}catch(_){}}
        if(!m.respondido)m.respondido={rot:'auto'}; try{while(F.dropar(E)){}}catch(_){}} }

    /* se a temporada acabou antes de 330 dias, prova agora */
    if(!provou) provas();
    /* --- noticia de obra (so texto, nao tem botao) --- */
    const nossa = TO.mundo.torcida(E.torcida.id);
    const daPraca = TO.mundo.jogaveis().filter(o=>o.mapa===nossa.mapa && !o.incompleta);
    for(const o of daPraca.slice(0,4))
      for(const item of ['bar','loja','subsede','sede','ampliar:bar','ampliar:loja','filial']){
        E.feed=[];E.feedFila=[];E.obrasDaCidade=[];
        F.registrarObra(E,{tipo:'obra', torcida:o.id, item, cidade:'salvador'});
        F.obraDeHoje(E); for(let i=0;i<40&&F.dropar(E);i++){}
        const m=E.feed.find(x=>x.kind==='obra');
        if(m) guardaTexto({tipo:'noticia', kind:'obra', texto:m.texto});
      }
    return {textos, pares};
  }, ANOS);

  /* junta no caldeirao sem repetir: a mesma frase colhida em duas
     torcidas e uma linha so pro julgamento */
  let novosT=0, novosP=0;
  for(const t of dados.textos){
    const ch = t.tipo+'|'+t.texto;
    if(vistoT.has(ch)) continue; vistoT.add(ch); t.torcida = torcida; textos.push(t); novosT++;
  }
  for(const p of dados.pares){
    const ch = p.fonte+'|'+p.rotulo_botao+'|'+(p.dica||'').slice(0,40);
    if(vistoP.has(ch)) continue; vistoP.add(ch); p.torcida = torcida; pares.push(p); novosP++;
  }
  console.log(`${torcida}${achou?'':' (NAO ACHOU ESSE NOME — caiu na padrao)'}: `+
              `+${novosT} textos, +${novosP} pares`);
  await pg.close();
  }

  fs.writeFileSync(SAIDA, JSON.stringify({textos, pares}, null, 1));
  const conta = (lista, campo) => JSON.stringify(
    lista.reduce((a,x)=>(a[x[campo]||'?']=(a[x[campo]||'?']||0)+1,a),{}));
  console.log(`\ntextos colhidos: ${textos.length}`);
  console.log(`  por origem: ${conta(textos,'tipo')}`);
  console.log(`pares dica->consequencia: ${pares.length}`);
  console.log(`  por fonte: ${conta(pares,'fonte')}`);
  if(erros.length) console.log('PAGEERR', [...new Set(erros)].slice(0,3));
  console.log('-> '+SAIDA);
  await nav.close();
})();
