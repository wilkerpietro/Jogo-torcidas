/* SIMULAR O MUNDO SEM ESCOLHER TORCIDA (pedido do dono, 01/10/2026:
   "arranje uma forma de você iniciar um save sem selecionar uma torcida
   e me diga como fica o mapa de fortaleza depois de 1 ano simulado")

   O jogo precisa de uma torcida do jogador pra existir (calendário,
   caixa, feed). Aqui ela é FIGURANTE: a menor organizada de uma praça
   fora do Brasil, longe da cidade observada, com toda decisão do feed e
   da reunião respondida sem efeito ("deixar pra lá"). Na cidade
   observada, então, só joga a IA: as metas do mês, as brigas entre
   elas, as compras, as pixações espalhadas e o recrutamento.

   No fim: o placar da cidade (quem domina, quantos bairros cada uma),
   cada bairro com a dona, as partes e os muros, o que mudou de mão no
   ano, e o print do mapa (a planta com as donas).

   Uso (com o servidor da raiz no ar em 127.0.0.1:8799):
     node ferramentas/simular_mundo.js [cidade] [dias] [pasta de saída]
     node ferramentas/simular_mundo.js fortaleza 365 /tmp/mundo
   (sem pasta, vai pra <tmp>/simulacao: <cidade>.json e <cidade>.png)
*/
let chromium;
try { ({chromium} = require('playwright')); } catch(e){ ({chromium} = require('/opt/node22/lib/node_modules/playwright')); }
const fs = require('fs'), path = require('path');
const CIDADE = process.argv[2] || 'fortaleza';
const DIAS = +(process.argv[3] || 365);
const SAIDA = process.argv[4] || path.join(require('os').tmpdir(), 'simulacao');

(async () => {
  fs.mkdirSync(SAIDA, {recursive:true});
  const nav = await chromium.launch({executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined});
  const pg = await nav.newPage({viewport:{width:1440, height:900}});
  const erros = [];
  pg.on('pageerror', e => erros.push(e.message));
  await pg.goto('http://127.0.0.1:8799/index.html');
  await pg.waitForTimeout(1200);
  await pg.click('#btNovoJogo'); await pg.waitForTimeout(400);
  /* a figurante: a menor organizada fora do Brasil */
  const figurante = await pg.evaluate(cidade => {
    const br = new Set((TO.dados.cidades || []).filter(c => c.uf && c.uf.length === 2 && /Norte|Nordeste|Sul|Sudeste|Centro-Oeste/.test(c.regiao || '')).map(c => c.id));
    const l = TO.mundo.selecionaveis().filter(o => o.mapa !== cidade && !br.has(o.mapa)).sort((a, b) => (a.membros || 0) - (b.membros || 0));
    const o = l[0];
    return o ? {nome:o.nome, mapa:o.mapa} : null;
  }, CIDADE);
  if(!figurante){ console.log('sem torcida figurante'); process.exit(1); }
  await pg.evaluate(n => TO.tela.escolherTorcida('^' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), figurante.nome);
  await pg.click('#btSelecionarTorcida').catch(() => {}); await pg.waitForTimeout(500);
  await pg.click('#btComecarPartida').catch(() => {}); await pg.waitForTimeout(1500);
  const quem = await pg.evaluate(() => ({nome:TO.estado.E.torcida.nome, mapa:TO.estado.E.torcida.mapa}));
  console.log('figurante:', quem.nome, '(' + quem.mapa + ')');

  /* o ano, em blocos (pra não estourar o tempo de uma chamada) */
  const t0 = Date.now();
  for(let feito = 0; feito < DIAS; feito += 30){
    const n = Math.min(30, DIAS - feito);
    await pg.evaluate(n => {
      const E = TO.estado.E;
      TO.tela.pausarTempo('sim');
      for(let i = 0; i < n; i++){
        /* a figurante não decide nada: tudo fica como "deixar pra lá" */
        for(const m of E.feed) if(m.peso === 'decisao' && !m.respondido){
          if(m.kind === 'partida') TO.feed.encerrarPartida(E, m.id);
          else m.respondido = {botao:'figurante', rot:'—'};
        }
        if(E.reuniao) for(const it of E.reuniao.pauta) if(!it.decidido) it.decidido = {botao:'figurante', rot:'—'};
        TO.tela.passarUmDia(E);
        for(let k = 0; k < 40 && TO.feed.pendentes(E) > 0 && !TO.feed.travado(E); k++) TO.feed.dropar(E);
      }
    }, n);
    process.stdout.write(`  ${Math.min(DIAS, feito + n)} dias (${Math.round((Date.now() - t0) / 1000)} s)\n`);
  }

  /* o retrato da cidade */
  const r = await pg.evaluate(cid => {
    const E = TO.estado.E, D = TO.dominio, sig = id => D.siglaDe(id), nm = id => D.nomeDe(id);
    const pl = D.placar(E, cid);
    const bs = D.bairros(E, cid).map(b => ({
      bairro:b.nome, zona:b.zona, classe:b.classe,
      dona: b.dono ? sig(b.dono) : null, v:Math.round(b.v),
      partes: b.partes.map(p => sig(p.t) + ' ' + Math.round(p.v)).join(', '),
      ninguem: Math.round(100 - b.partes.reduce((s, p) => s + p.v, 0)),
      muros: D.muros(E, cid, b.id).map(m => m.t ? sig(m.t) : '·').join(' ')
    }));
    const log = (E.dominio.log || []).filter(l => l.cid === cid);
    const motivos = {};
    for(const l of log) motivos[l.motivo] = (motivos[l.motivo] || 0) + 1;
    const membros = {};
    for(const o of D.torcidasDaCidade(cid)) membros[sig(o.id)] = {nome:nm(o.id), membros:D.membrosDe(E, o.id), sede:((E.mundoTorcidas || {})[o.id] || {}).sede};
    return {data:E.data, dona:pl.dono ? nm(pl.dono) : null, placar:Object.fromEntries(pl.ordem.map(t => [sig(t), pl.n[t]])),
            semDona:pl.semDono, total:pl.total, torcidas:membros, bairros:bs, viradasNoLog:log.length, motivos,
            pixacoes:Object.keys((E.dominio.pix || {})[cid] || {}).length};
  }, CIDADE);
  fs.writeFileSync(path.join(SAIDA, CIDADE + '.json'), JSON.stringify(r, null, 1));
  await pg.evaluate(cid => TO.mapaBrasil.abrir(cid), CIDADE);
  await pg.waitForTimeout(2000);
  await pg.screenshot({path:path.join(SAIDA, CIDADE + '.png')});
  console.log(JSON.stringify(r, null, 1));
  console.log('erros:', erros.length ? erros.slice(0, 5) : 'nenhum');
  await nav.close();
})();
