/* VARREDURA NUMERICA DAS DICAS — deterministica, sem modelo.
   Toda dica/nota promete numero. O jogo aplica um `ef`. As duas contas tem
   de dar igual. Isto e aritmetica exata: fica em codigo.

   Escalas do jogo:
     moral e prestigio: internos 0..20, a TELA mostra x5
     relacao com o clube: direto, 0..100
     relacao com outra torcida: ef.outra x REL.aproximar (5)                */
const {chromium} = require('playwright-core');
(async () => {
  const nav = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const pg = await nav.newPage({viewport:{width:1280,height:900}});
  const erros=[]; pg.on('pageerror', e=>erros.push(e.message));
  await pg.goto('http://127.0.0.1:8765/index.html'); await pg.waitForTimeout(900);
  await pg.click('#btNovoJogo'); await pg.waitForTimeout(400);
  await pg.evaluate(t=>TO.tela.escolherTorcida(t), process.argv[2]||'Mancha Verde');
  await pg.click('#btSelecionarTorcida'); await pg.waitForTimeout(1600);
  for(let k=0;k<3;k++){ const c = await pg.evaluate(()=>{ const b=[...document.querySelectorAll('button')].find(x=>x.offsetParent && /já sei jogar|pular/i.test(x.textContent)); if(b){ b.click(); return 1; } return null; }); if(!c) break; await pg.waitForTimeout(400); }

  const achados = await pg.evaluate(()=>{
    TO.tela.pausarTempo("teste");
    const E=TO.estado.E, F=TO.feed, R=TO.relacoes, RC=TO.relacaoClube;
    const APROX = R.REL.aproximar;
    const out = [];
    /* o que a DICA promete, lido do texto */
    function prometido(nota){
      const t = String(nota||'');
      const num = rx => { const m = t.match(rx); return m ? parseFloat(m[1].replace('−','-').replace(',','.')) : null; };
      return {
        moral:     num(/([−\-+]?\d+(?:[.,]\d+)?)\s*de\s*moral/i),
        prestigio: num(/([−\-+]?\d+(?:[.,]\d+)?)\s*(?:de\s*)?prest[íi]gio/i),
        clube:     num(/([−\-+]?\d+(?:[.,]\d+)?)\s*(?:de\s*)?rela[çc][ãa]o(?!\s+com\s+(?:a|ela))/i),
        semEfeito: /^sem efeito$/i.test(t.trim())
      };
    }
    /* o que o EF entrega, na escala da tela.
       `moralSeMal` SO conta quando o time vem mal — sem esse cuidado o
       verificador acusava seis dicas corretas de esconder perda de moral
       que, naquela situacao, nao acontece. */
    function entregue(ef, timeMal){
      ef = ef||{};
      const moralBruta = (ef.moralGanho||0) - (ef.moral||0)
                       - (timeMal ? (ef.moralSeMal||0) : 0);
      return {
        moral: moralBruta ? Math.round(moralBruta*5*100)/100 : null,
        prestigio: ef.prestigio ? Math.round(ef.prestigio*5*100)/100 : null,
        clube: ef.clube || null,
        outra: ef.outra ? ef.outra*APROX : null
      };
    }
    /* ---- 1. banco de perguntas da entrevista, nas duas situacoes ---- */
    for(const seq of [['D','D','D','V','E'], ['V','V','V','V','V']]){
      const rot = seq[0]==='D' ? 'time mal' : 'time bem';
      E.sequenciaClube = seq.slice();
      const vistos = new Set();
      for(let sa=1; sa<500; sa++){
        E.feed=[];E.feedFila=[];E.entrevistaUltimas=null;
        E.relacaoClube = 50;                 /* longe do teto do elogio */
        F.entrevistaDeHoje(E, sa);
        for(let i=0;i<40&&F.dropar(E);i++){}
        const m = E.feed.find(x=>x.kind==='entrevista'); if(!m) continue;
        for(const p of (m.dados.perguntas||[]))
          for(const o of (p.opcoes||[])){
            const ch = `${rot}|${p.id}|${o.id}`;
            if(vistos.has(ch)) continue; vistos.add(ch);
            const pr = prometido(o.nota), en = entregue(o.ef, !!m.dados.timeMal);
            const linhas = [];
            const cmp = (rotulo, a, b) => {
              if(a===null && b===null) return;
              if(a===null && b!==null) linhas.push(`${rotulo}: entrega ${b}, a dica nao fala`);
              else if(a!==null && b===null) linhas.push(`${rotulo}: promete ${a}, nao entrega nada`);
              else if(Math.abs(Math.abs(a)-Math.abs(b))>0.001 || (a<0)!==(b<0))
                linhas.push(`${rotulo}: promete ${a}, entrega ${b}`);
            };
            cmp('moral', pr.moral, en.moral);
            cmp('prestigio', pr.prestigio, en.prestigio);
            cmp('relacao com o clube', pr.clube, en.clube);
            if(pr.semEfeito && (en.moral||en.prestigio||en.clube||en.outra))
              linhas.push(`diz "sem efeito" mas entrega ${JSON.stringify(en)}`);
            if(linhas.length) out.push({onde:`entrevista/${p.id}/${o.id} (${rot})`,
              rotulo:o.rot, nota:o.nota, ef:JSON.parse(JSON.stringify(o.ef||{})), linhas});
          }
      }
    }
    return out;
  });
  console.log(`== DICAS QUE NAO BATEM (${achados.length}) ==\n`);
  for(const a of achados){
    console.log(`  ${a.onde}`);
    console.log(`    botao : ${a.rotulo}`);
    console.log(`    dica  : ${a.nota}`);
    console.log(`    ef    : ${JSON.stringify(a.ef)}`);
    for(const l of a.linhas) console.log(`    !! ${l}`);
    console.log();
  }
  if(erros.length) console.log('PAGEERR', [...new Set(erros)].slice(0,3));
  await pg.close(); await nav.close();
})();
