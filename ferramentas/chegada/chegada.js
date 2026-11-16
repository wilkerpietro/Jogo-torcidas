/* =========================================================
   A BANCADA DA CHEGADA (dono, 16/11/2026: "crie um artefato que simula isso com opção de selecionar estádio em um dropdown
   pra eu mesmo ver o resultado. eu posso controlar uma torcida mandante ou visitante ou então dizer qual torcida é de cada
   lado em cada um dos estádios pra aprofundar ainda mais o teste").

   Não é imitação: é o jogo inteiro carregado (o mesmo jogo.js, os mesmos bonecos, as mesmas cenas de arredores gravadas),
   com um painel por cima que escolhe o estádio, as torcidas de cada escalão e o lado que se controla, e abre a cena de
   arredores daquele estádio — a chegada: cada bonde nasce na ponta de uma rua, segue o gradil até o portão dele, entra e
   aparece no lugar dele na arquibancada.

   A cena abre pelo mesmo caminho da briga da arquibancada (`TO.tela.abrirBrigaNoEstadio`), que já monta os bondes com as
   cores e os perfis de cada torcida; o painel só troca o palco (os arredores do estádio escolhido) e o clima (paz ou briga)
   na hora de montar. Nada disto entra no jogo: este arquivo só é carregado pela página da bancada (montar.js).
   ========================================================= */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const LADOS = { mandante: ['1º escalão', '2º escalão', '3º escalão'], visitante: ['1º escalão', '2º escalão'] };
  const TAM = { mandante: [40, 28, 20], visitante: [34, 22] };
  let sel = [], cronometro = null, t0 = 0, fica = false;

  const linhas = () => [...document.querySelectorAll('.chg-linha')];
  const aviso = txt => { const a = $('chgAviso'); a.textContent = txt || ''; a.hidden = !txt; };

  /* ---------- o painel ---------- */
  function opcoesDeTorcida(comNinguem) {
    const porUF = {};
    for (const t of sel) (porUF[t.uf || '—'] = porUF[t.uf || '—'] || []).push(t);
    let h = comNinguem ? '<option value="">— ninguém —</option>' : '';
    for (const uf of Object.keys(porUF).sort()) {
      h += `<optgroup label="${uf}">`;
      for (const t of porUF[uf].sort((a, b) => (a.clube || '').localeCompare(b.clube || '', 'pt') || (b.membros || 0) - (a.membros || 0)))
        h += `<option value="${t.id}">${t.clube} · ${t.nome}</option>`;
      h += '</optgroup>';
    }
    return h;
  }
  function montarLinhas() {
    for (const lado of ['mandante', 'visitante']) {
      const caixa = $(lado === 'mandante' ? 'chgMandante' : 'chgVisitante');
      LADOS[lado].forEach((rot, i) => {
        const d = document.createElement('div'); d.className = 'chg-linha'; d.dataset.lado = lado; d.dataset.i = i;
        d.innerHTML = `<label for="chgT_${lado}${i}">${rot}</label>` +
          `<select id="chgT_${lado}${i}" class="chg-torcida">${opcoesDeTorcida(i > 0)}</select>` +
          `<input id="chgN_${lado}${i}" class="chg-n" type="number" min="4" max="150" step="1" value="${TAM[lado][i]}" aria-label="Quantos vão no ${rot} ${lado}" title="Quantos vão neste bonde">`;
        caixa.appendChild(d);
      });
    }
  }
  /* o estádio escolhido sugere as torcidas: as do clube da casa de um lado, o maior rival dela do outro */
  function sugerir() {
    const id = $('chgEstadio').value, lp = (TO.dados.estadiosLowPoly || {})[id] || {}, clubes = lp.clubes || [];
    const daCasa = sel.filter(t => clubes[0] && t.clubeId === clubes[0]).sort((a, b) => (b.membros || 0) - (a.membros || 0));
    const casa = daCasa[0] || sel[0];
    const rivais = [...(casa.maioresRivais || []), ...(casa.rivais || [])].map(r => sel.find(t => t.id === (r.id || r))).filter(t => t && t.clubeId !== casa.clubeId);
    const fora = rivais[0] || sel.find(t => clubes[1] && t.clubeId === clubes[1]) || sel.find(t => t.uf === casa.uf && t.clubeId !== casa.clubeId) || sel.find(t => t.clubeId !== casa.clubeId);
    const por = (lado, i, v) => { $('chgT_' + lado + i).value = v || ''; };
    por('mandante', 0, casa.id); por('mandante', 1, (daCasa[1] || {}).id); por('mandante', 2, (daCasa[2] || {}).id);
    const deFora = sel.filter(t => t.clubeId === fora.clubeId && t.id !== fora.id).sort((a, b) => (b.membros || 0) - (a.membros || 0));
    por('visitante', 0, fora.id); por('visitante', 1, (deFora[0] || {}).id);
    $('chgSoFora').hidden = !lp.soFora;
    aviso('');
  }

  function escolhas() {
    const o = { estadio: $('chgEstadio').value, lado: document.querySelector('input[name="chgLado"]:checked').value,
      clima: document.querySelector('input[name="chgClima"]:checked').value, logo: $('chgLogo').checked, bondes: [] };
    for (const l of linhas()) {
      const id = l.querySelector('select').value, n = Math.max(4, Math.min(150, Math.round(+l.querySelector('input').value || 0)));
      if (id) o.bondes.push({ id, n, casa: l.dataset.lado === 'mandante', i: +l.dataset.i });
    }
    return o;
  }

  /* ---------- abrir a cena ---------- */
  function comecar() {
    const o = escolhas(), M = TO.mundo, P = TO.diaJogo.ponte;
    const ids = o.bondes.map(b => b.id);
    if (new Set(ids).size !== ids.length) return aviso('A mesma torcida está em dois bondes. Cada bonde precisa de uma torcida diferente.');
    const nosso = o.bondes.find(b => b.casa === (o.lado === 'mandante') && b.i === 0);
    if (!nosso) return aviso('Falta a torcida do 1º escalão do lado que você controla.');
    if (!o.bondes.some(b => b.casa !== nosso.casa)) return aviso('Falta pelo menos uma torcida do outro lado.');
    aviso('');
    /* a cena anterior, se ainda estiver no ar, para aqui */
    try { if (P.rodando) P.parar(); } catch (e) { console.warn(e); }
    { const b = $('btFecharRelatorio'); if (b && b.getClientRects().length) { try { b.click(); } catch (e) { console.warn(e); } } }
    const lp = TO.dados.estadiosLowPoly[o.estadio], casaId = (lp.clubes || [])[0], time = M.time(casaId) || {};
    TO.estado.novo({ torcida: M.ficha(sel.find(t => t.id === nosso.id)), presidente: 'Bancada', semente: 1 + Math.floor(Math.random() * 99999) });
    $('telaMenu').classList.add('oculto'); $('telaSelecao') && $('telaSelecao').classList.add('oculto'); $('jogo').classList.remove('oculto');
    /* na bancada todo mundo que foi escalado desce (no jogo a aliada do rival fica na cadeira) e a ordem dos bondes é a do
       painel (no jogo o maior rival passa na frente): as duas regras saem só durante a montagem */
    const R = TO.relacoes, guardado = { rd: R.relacaoDelas, mr: R.ehMaiorRival, montar: P.montar };
    R.relacaoDelas = () => -100; R.ehMaiorRival = () => false;
    P.montar = function (m) {
      P.montar = guardado.montar;
      const c = m.config;
      c.local = 'arredores'; c.estadioLP = o.estadio; delete c.setores;
      if (o.clima === 'paz') { c.intencao = 'paz'; c.paz = true; }
      const ordem = b => { const k = o.bondes.find(x => x.id === b.id); return k ? (b.nossa ? -1 : k.i) : 9; };
      const meu = nosso.casa ? 'mandante' : 'visitante';
      c.bondes = [...c.bondes.filter(b => b.lado === meu).sort((a, b) => ordem(a) - ordem(b)), ...c.bondes.filter(b => b.lado !== meu).sort((a, b) => ordem(a) - ordem(b))];
      return guardado.montar.call(P, m);
    };
    try {
      TO.tela.abrirBrigaNoEstadio({ id: 90000 + Math.floor(Math.random() * 9999), dados: { presenca: o.bondes.map(b => ({ id: b.id, n: b.n, casa: b.casa })),
        somosCasa: nosso.casa, mapa: time.mapa, estadio: time.estadio, casaId } }, () => {});
    } catch (e) { console.error(e); aviso('A cena não abriu: ' + e.message); }
    finally { R.relacaoDelas = guardado.rd; R.ehMaiorRival = guardado.mr; if (P.montar !== guardado.montar) P.montar = guardado.montar; }
    if (!P.rodando && !P.J) { if ($('chgAviso').hidden) aviso('A cena não abriu.'); return; }
    $('chgPainel').hidden = true; $('chgBarra').hidden = false; $('chgFechar').hidden = false;
    if (innerWidth <= 560) $('chgBarra').classList.add('recolhida');
    $('chgMapa').dataset.longe = ''; $('chgMapa').textContent = 'Ver o mapa inteiro'; $('chgVel').textContent = 'Relógio ' + (P.velocidade || 1) + '×';
    t0 = performance.now(); clearInterval(cronometro);
    let acertouHora = false; fica = false;
    cronometro = setInterval(() => {
      const J = P.J; if (!J || !J.discos) return;
      /* OS OUTROS ENTRAM LOGO: no jogo cada escalão fica de conversa onde chegou e só entra perto da hora da bola; na bancada
         dá pra adiantar, um escalão de cada vez, pra ver a rota sem esperar a noite */
      if (!acertouHora && J.discos.length) { acertouHora = true;
        if (o.logo && o.clima === 'paz') { const ord = [...new Set(J.discos.map(d => d.spawn))];
          for (const d of J.discos) if (!d.doJogador && !d.lider && d.vadiando) d.entraEm = J.t + 2 + ord.indexOf(d.spawn) * 3 + Math.random() * 4;
          /* UM DO OUTRO LADO FICA NA RUA: o jogo encerra a cena quando um dos lados não tem mais ninguém do lado de fora
             ("não sobrou ninguém deles na cena"), e com os outros entrando logo ela fecharia antes de a torcida do jogador
             chegar no portão. O último do outro lado fica de conversa onde chegou e segura a cena aberta. */
          const outro = J.discos.filter(d => d.lado !== (J.ladoNosso || 'mandante') && d.vadiando);
          if (outro.length) { outro[outro.length - 1].entraEm = Infinity; fica = true; } }
        /* VIERAM PRA BRIGAR: nos arredores a noite começa sempre tranquila e o bonde que veio disposto só sai atrás do rival
           mais tarde; na bancada todos os bondes que não são do jogador vêm dispostos e saem já */
        if (o.clima === 'briga') { const meu = (J.discos.find(d => d.lider) || {}).spawn;
          for (const k in (J.bondes || {})) { const b = J.bondes[k]; if (b.jogador || k === meu) continue;
            const rivais = Object.keys(J.bondes).filter(x => J.bondes[x].lado !== b.lado && J.discos.some(d => d.spawn === x));
            if (!rivais.length) continue;
            /* (é o próprio mecanismo do jogo — o humor do bonde e a hora de agir —, só que com a hora adiantada) */
            b.humor = 'atacar'; b.agirEm = J.t + 3; b.alvo = rivais.includes(meu) ? meu : rivais[0]; } } }
      placar(J);
    }, 400);
  }

  /* quem está na rua, quem já entrou e quem apareceu na arquibancada, bonde por bonde */
  function placar(J) {
    const por = {};
    for (const d of J.discos) { const b = por[d.spawn] = por[d.spawn] || { n: 0, rua: 0, arq: 0, entrou: 0, fora: 0, lado: d.lado, meu: false, nome: '' };
      b.n++; if (d.doJogador) b.meu = true; if (d.naArquibancada) b.arq++; if (d.entrou) b.entrou++; else if (d.vivo) b.rua++; else b.fora++;
      if (!b.nome) b.nome = (TO.mundo.torcida(d.torcidaId) || {}).nome || d.torcida || ''; }
    let h = '';
    for (const k of Object.keys(por).sort()) { const b = por[k], esc = k.replace('mandante', 'Casa ').replace('visitante', 'Fora ') + 'º', nome = b.nome;
      h += `<tr class="${b.lado}${b.meu ? ' meu' : ''}"><th>${esc}${b.meu ? ' (você)' : ''}</th><td class="nome">${nome}</td><td>${b.rua}</td><td>${b.arq}</td>${b.fora ? `<td class="fora">${b.fora}</td>` : '<td></td>'}</tr>`; }
    $('chgPlacarCorpo').innerHTML = h;
    $('chgFase').textContent = J.acabou ? 'Fim: ' + (J.acabou.motivo || '') : (J.entrando ? 'Sua torcida está indo pro portão.' : '') + (fica ? ' Um do outro lado fica na rua de propósito: é ele que segura a cena aberta.' : '');
  }

  function novoTeste() { $('chgPainel').hidden = false; }
  function fecharPainel() { if (TO.diaJogo.ponte.J) $('chgPainel').hidden = true; }

  /* ---------- ligar ---------- */
  function iniciar() {
    sel = TO.mundo.selecionaveis();
    const R = TO.dados.arredoresReais || {}, LP = TO.dados.estadiosLowPoly || {};
    const nomeClube = c => (TO.mundo.time(c) || {}).nome || c;
    $('chgEstadio').innerHTML = Object.keys(R).map(id => ({ id, nome: (LP[id] || R[id]).nome || id, clubes: ((LP[id] || {}).clubes || []).map(nomeClube).join(' e ') }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt')).map(e => `<option value="${e.id}">${e.nome} — ${e.clubes}</option>`).join('');
    montarLinhas(); sugerir();
    $('chgEstadio').addEventListener('change', sugerir);
    $('chgComecar').addEventListener('click', comecar);
    $('chgNovo').addEventListener('click', novoTeste);
    $('chgFechar').addEventListener('click', fecharPainel);
    $('chgMapa').addEventListener('click', () => { const P = TO.diaJogo.ponte, longe = $('chgMapa').dataset.longe !== '1'; P.zoom = longe ? 0.2 : 1; $('chgMapa').dataset.longe = longe ? '1' : ''; $('chgMapa').textContent = longe ? 'Ver de perto' : 'Ver o mapa inteiro'; });
    $('chgVel').addEventListener('click', () => { const P = TO.diaJogo.ponte; P.velocidade = P.velocidade >= 2 ? 1 : 2; $('chgVel').textContent = 'Relógio ' + P.velocidade + '×'; });
    $('chgMenos').addEventListener('click', () => { $('chgBarra').classList.toggle('recolhida'); });
    $('telaMenu') && $('telaMenu').classList.add('oculto');
    $('chgCarregando').hidden = true; $('chgForm').hidden = false;
  }
  let tentativas = 0;
  (function esperar() {
    if (window.TO && TO.estado && TO.ritmoDoDia && TO.diaJogo && TO.diaJogo.ponte && TO.mundo) { try { iniciar(); } catch (e) { console.error(e); $('chgCarregando').textContent = 'O painel não montou: ' + e.message; } return; }
    if (++tentativas > 600) { $('chgCarregando').textContent = 'O jogo não carregou. Recarregue a página; se continuar, me avise.'; return; }
    setTimeout(esperar, 200);
  })();
})();
