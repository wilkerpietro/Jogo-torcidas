/* Colhe do jogo REAL os dois conjuntos que o TypeSafe vai julgar:
   1) toda linha de texto gerada (feed, perguntas, notas de botao)
   2) cada par dica -> consequencia, com o efeito MEDIDO do clique     */
const {chromium} = require('playwright-core');
const fs = require('fs');
const SAIDA = process.argv[3] || '/home/user/Jogo-torcidas/ferramentas/qualidade/amostra.json';
(async () => {
  const nav = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const pg = await nav.newPage({viewport:{width:1280,height:900}});
  const erros=[]; pg.on('pageerror', e=>erros.push(e.message));
  await pg.goto('http://127.0.0.1:8765/index.html'); await pg.waitForTimeout(900);
  await pg.click('#btNovoJogo'); await pg.waitForTimeout(400);
  await pg.evaluate(t=>TO.tela.escolherTorcida(t), process.argv[2]||'Mancha Verde');
  await pg.click('#btSelecionarTorcida'); await pg.waitForTimeout(1600);
  for(let k=0;k<3;k++){ const c = await pg.evaluate(()=>{ const b=[...document.querySelectorAll('button')].find(x=>x.offsetParent && /já sei jogar|pular/i.test(x.textContent)); if(b){ b.click(); return 1; } return null; }); if(!c) break; await pg.waitForTimeout(400); }

  const dados = await pg.evaluate(()=>{
    TO.tela.pausarTempo("teste");
    const E=TO.estado.E, F=TO.feed, R=TO.relacoes, RC=TO.relacaoClube;
    const textos = [], pares = [];
    const vistoT = new Set(), vistoP = new Set();
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
              const ch = `entrevista|${p.id}|${o.id}`;
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
          const ch = `${m.kind}|${b.id}|${(b.dica||'').slice(0,30)}`;
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

    /* roda meia temporada pra encher tabela, sequencia, chave */
    for(let d=0; d<200; d++){ try{TO.estado.avancarDia();}catch(e){}
      for(const m of (E.feed||[])) guardaTexto({tipo:'mensagem', kind:m.kind, texto:m.texto});
      try{while(F.dropar(E)){}}catch(_){}
      let g=0; while(F.travado(E)&&g++<30){const m=F.decisaoAberta(E); if(!m)break;
        const b=(m.botoes||[])[0]; if(b){try{F.responder(E,m.id,b.id);}catch(_){}}
        if(!m.respondido)m.respondido={rot:'auto'}; try{while(F.dropar(E)){}}catch(_){}} }

    /* --- entrevista, nas duas situacoes de time --- */
    E.sequenciaClube=['D','D','D','V','E'];
    provarCartao(sa=>F.entrevistaDeHoje(E,sa), 'entrevista (time mal)');
    E.sequenciaClube=['V','V','V','V','V']; E.entrevistaUltimas=null;
    provarCartao(sa=>F.entrevistaDeHoje(E,sa), 'entrevista (time bem)');
    /* --- protesto no CT --- */
    E.sequenciaClube=['D','D','D','D','E'];
    provarCartao(sa=>F.protestoNoCT(E,sa), 'protesto no CT');
    /* --- veredicto da campanha --- */
    E.veredictosVistos={};
    provarCartao(()=>{ E.veredictosVistos={}; F.veredictoDeHoje(E); }, 'veredicto da campanha');
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
  });
  fs.writeFileSync(SAIDA, JSON.stringify(dados, null, 1));
  console.log(`textos colhidos: ${dados.textos.length}`);
  console.log(`pares dica->consequencia: ${dados.pares.length}`);
  console.log(`por fonte: ${JSON.stringify(dados.pares.reduce((a,p)=>(a[p.fonte]=(a[p.fonte]||0)+1,a),{}))}`);
  if(erros.length) console.log('PAGEERR', [...new Set(erros)].slice(0,3));
  console.log('-> '+SAIDA);
  await pg.close(); await nav.close();
})();
