/* =========================================================
   DESENVOLVIMENTO DA TORCIDA — protótipo à parte (dono, 12/10/2026)
   ---------------------------------------------------------
   "Gostei mas gostaria de testar isso sem aplicar no jogo no
   momento, numa versão fora a parte pra sentir a diferença."

   Este arquivo SÓ é carregado por `desenvolvimento.html` — o
   `index.html` do jogo não o conhece. Tudo que ele faz é por FORA
   do código do jogo: embrulha funções públicas (o livro-caixa, os
   indicadores, o peso do recrutamento, o bônus das festas), escuta o
   fechamento da semana e olha o save uma vez por dia. Nenhum arquivo
   do jogo foi mexido pra ele existir.

   O desenho está em docs/PLANO-PESQUISA.md. Aqui vão seis áreas
   (as cinco do plano mais a MASSA: torcedores do clube, elenco e
   recrutamento), cada uma com trilhas de três degraus.

   Texto só em português: é protótipo. Se o dono aprovar, ele entra no
   jogo de verdade pelo _t() e pelos dicionários.
   ========================================================= */
(function(){
  'use strict';
  const ST = () => TO.estado;
  const Ev = () => ST() && ST().E;
  const R$ = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
  const um = v => (Math.round(v * 10) / 10).toLocaleString('pt-BR');

  /* -------------------------------------------------------
     A ÁRVORE
     ------------------------------------------------------- */
  const AREAS = [
    {id:'pista', nome:'Pista', cor:'#e05252', desc:'briga, treino e material de rua'},
    {id:'estrada', nome:'Estrada', cor:'#e0a040', desc:'caravana, frota e aliadas'},
    {id:'arquibancada', nome:'Arquibancada', cor:'#5aa0e0', desc:'festa, identidade e prestígio'},
    {id:'negocio', nome:'Negócio', cor:'#4cbf7a', desc:'bar, loja, mensalidade e caixa'},
    {id:'organizacao', nome:'Organização', cor:'#a07ae0', desc:'saúde, jurídico e disciplina'},
    {id:'massa', nome:'Massa', cor:'#e07ac0', desc:'torcedores do clube, recrutamento e elenco'}
  ];
  /* O RITMO (dono, 12/10/2026): "em torno de 3 estudos por ano pra uma
     torcida média, com as torcidas variando de 2 a 5". Os degraus ficaram
     mais próximos entre si (eram 12/30/60): a torcida pequena só alcança o
     1º degrau (sede < 2), e com ele barato ela estudava mais que a média */
  const CUSTO = [0, 24, 36, 48];        // PD por degrau
  const SEDE_MIN = [0, 0, 2, 4];        // nível de sede pra liberar o degrau

  const ESTUDOS = [
    /* PISTA */
    {id:'p_treino',  area:'pista', trilha:'Doutrina de rua', n:1, nome:'Treino coletivo', efeito:'o que a torcida ganha de força e defesa no treino rende +20%'},
    {id:'p_frente',  area:'pista', trilha:'Doutrina de rua', n:2, nome:'Linha de frente firme', efeito:'frente e diretoria ganham +0,6 de força e +0,6 de defesa (até o teto do cargo) — e quem for promovido depois também'},
    {id:'p_bloco',   area:'pista', trilha:'Doutrina de rua', n:3, nome:'Bonde disciplinado', efeito:'novatos e componentes ganham +0,6 de defesa (até o teto) — e quem entrar depois também'},
    {id:'p_bomba',   area:'pista', trilha:'Material de rua', n:1, nome:'Bomba caseira', efeito:'bomba 20% mais barata'},
    {id:'p_esconde', area:'pista', trilha:'Material de rua', n:2, nome:'Esconderijo', efeito:'saque no nosso bar leva 25% menos'},
    {id:'p_arsenal', area:'pista', trilha:'Material de rua', n:3, nome:'Arsenal próprio', efeito:'+2 bombas no estoque todo mês, de graça'},
    /* ESTRADA */
    {id:'e_rateio',  area:'estrada', trilha:'Logística', n:1, nome:'Rateio organizado', efeito:'caravana (da sede e das subsedes) 15% mais barata pra torcida'},
    {id:'e_lanche',  area:'estrada', trilha:'Logística', n:2, nome:'Lanche no ônibus', efeito:'toda caravana paga dá +0,2 de moral (na régua de 0 a 20)'},
    {id:'e_frota',   area:'estrada', trilha:'Logística', n:3, nome:'Frota cuidada', efeito:'combustível e manutenção dos ônibus 40% mais baratos'},
    {id:'e_casa',    area:'estrada', trilha:'Hospitalidade', n:1, nome:'Casa de irmão', efeito:'receber aliada custa 30% menos'},
    {id:'e_rede',    area:'estrada', trilha:'Hospitalidade', n:2, nome:'Rede de aliadas', efeito:'a relação com cada aliada (45 ou mais) sobe +1 por mês'},
    {id:'e_estrada', area:'estrada', trilha:'Hospitalidade', n:3, nome:'Estrada conhecida', efeito:'toda caravana paga dá +0,1 de prestígio (na régua de 0 a 20)'},
    /* ARQUIBANCADA */
    {id:'a_festa',   area:'arquibancada', trilha:'Festa', n:1, nome:'Mosaico em série', efeito:'festas da arquibancada 15% mais baratas'},
    {id:'a_coro',    area:'arquibancada', trilha:'Festa', n:2, nome:'Coro ensaiado', efeito:'as festas empurram o time 25% a mais (Fator Torcida)'},
    {id:'a_bateria', area:'arquibancada', trilha:'Festa', n:3, nome:'Bateria de respeito', efeito:'o treino de bateria vale por 14 dias, não 7'},
    {id:'a_hino',    area:'arquibancada', trilha:'Identidade', n:1, nome:'Hino próprio', efeito:'todo ganho de prestígio rende +10%'},
    {id:'a_faixa',   area:'arquibancada', trilha:'Identidade', n:2, nome:'Faixa costurada em casa', efeito:'faixa e bandeira novas 25% mais baratas'},
    {id:'a_orgulho', area:'arquibancada', trilha:'Identidade', n:3, nome:'Orgulho de pertencer', efeito:'toda perda de moral pesa 20% menos'},
    /* NEGÓCIO */
    {id:'n_chope',   area:'negocio', trilha:'Bar e loja', n:1, nome:'Chope próprio', efeito:'receitas do comércio (bar, loja, subsede) +8%'},
    {id:'n_estampa', area:'negocio', trilha:'Bar e loja', n:2, nome:'Estamparia', efeito:'despesas do comércio −10%'},
    {id:'n_marca',   area:'negocio', trilha:'Bar e loja', n:3, nome:'Marca da torcida', efeito:'receitas do comércio +12% (com o Chope, +20%)'},
    {id:'n_socio',   area:'negocio', trilha:'Finanças', n:1, nome:'Sócio-torcedor', efeito:'mensalidades +10%'},
    {id:'n_doacao',  area:'negocio', trilha:'Finanças', n:2, nome:'Rede de simpatizantes', efeito:'doação de simpatizante +50%'},
    {id:'n_contab',  area:'negocio', trilha:'Finanças', n:3, nome:'Contabilidade', efeito:'professores e advogados 10% mais baratos'},
    /* ORGANIZAÇÃO */
    {id:'o_fisio',   area:'organizacao', trilha:'Saúde e jurídico', n:1, nome:'Fisioterapia', efeito:'ferido novo volta 2 dias antes'},
    {id:'o_juri',    area:'organizacao', trilha:'Saúde e jurídico', n:2, nome:'Jurídico', efeito:'pena nova 20% menor e fiança 20% mais barata'},
    {id:'o_saude',   area:'organizacao', trilha:'Saúde e jurídico', n:3, nome:'Plano de saúde', efeito:'todo ferido sara 1 dia a mais por semana'},
    {id:'o_ferrugem',area:'organizacao', trilha:'Disciplina', n:1, nome:'Disciplina da velha guarda', efeito:'a ferrugem da paz (20 dias sem briga) tira metade da força e defesa'},
    {id:'o_biblio',  area:'organizacao', trilha:'Disciplina', n:2, nome:'Biblioteca da sede', efeito:'+10% de pontos de desenvolvimento'},
    {id:'o_mentor',  area:'organizacao', trilha:'Disciplina', n:3, nome:'Velha guarda professora', efeito:'a velha guarda rende até 8% do efetivo (era 5%) e a diretoria dá +1 ponto por semana'},
    /* MASSA — o pedido do dono: torcedores, elenco e recrutamento */
    {id:'m_peneira', area:'massa', trilha:'Recrutamento', n:1, nome:'Peneira', efeito:'chance de recrutar +25%'},
    {id:'m_tecnica', area:'massa', trilha:'Recrutamento', n:2, nome:'Peneira técnica', efeito:'quem entra chega com +1,5 de força e de defesa (até o teto do novato)'},
    {id:'m_portas',  area:'massa', trilha:'Recrutamento', n:3, nome:'Portas abertas', efeito:'chance de recrutar +25% (com a Peneira, +50%) e um novato garantido por mês, se houver vaga'},
    {id:'m_escola',  area:'massa', trilha:'Torcedores do clube', n:1, nome:'Escolinha de torcedor', efeito:'a torcida do clube na nossa cidade cresce +0,5% por mês'},
    {id:'m_interior',area:'massa', trilha:'Torcedores do clube', n:2, nome:'Caravana no interior', efeito:'a torcida do clube cresce +0,5% por mês nas cidades das nossas subsedes'},
    {id:'m_bandeira',area:'massa', trilha:'Torcedores do clube', n:3, nome:'Bandeira fincada', efeito:'surge torcida do clube numa cidade onde ele não tem torcedor — e dá pra abrir subsede lá'},
    {id:'m_olheiro', area:'massa', trilha:'Elenco do clube', n:1, nome:'Olheiros da torcida', efeito:'reforço no elenco do clube 15% mais barato'},
    {id:'m_vaquinha',area:'massa', trilha:'Elenco do clube', n:2, nome:'Vaquinha pro elenco', efeito:'+1 de força no elenco do clube a cada 6 meses'},
    {id:'m_base',    area:'massa', trilha:'Elenco do clube', n:3, nome:'Categoria de base', efeito:'+1 de força no elenco do clube a cada 3 meses'}
  ];
  const POR_ID = Object.fromEntries(ESTUDOS.map(s => [s.id, s]));
  const trilhaDe = s => ESTUDOS.filter(x => x.area === s.area && x.trilha === s.trilha).sort((a,b) => a.n - b.n);

  /* -------------------------------------------------------
     O ESTADO (mora no save, em E.desenv)
     ------------------------------------------------------- */
  function D(E){
    E = E || Ev();
    if(!E) return null;
    if(!E.desenv) E.desenv = {pd:0, atual:null, prog:0, feitos:[], turnos:0, ultimaSemana:null,
      rendeu:{dinheiro:0, recrutas:0, fichas:0, torcedores:0, forcaClube:0, diasFerido:0, moral:0, prestigio:0, festa:0, bombas:0},
      ia:{}, cidadesNovas:[], marcos:{}, historico:[]};
    return E.desenv;
  }
  const tem = (id, E) => { const d = D(E); return !!(d && d.feitos.includes(id)); };
  const rendeu = (k, v) => { const d = D(); if(d) d.rendeu[k] = (d.rendeu[k] || 0) + v; };

  /* -------------------------------------------------------
     OS PONTOS DE DESENVOLVIMENTO (PD) — a régua do Vic2: cada fonte
     rende linear até um ÓTIMO e satura; a sede soma um fixo; a moral
     multiplica (a "pluralidade" nossa)
     ------------------------------------------------------- */
  /* a régua de ~3 por ano: a sede é o grosso (é o tamanho da torcida),
     diretoria e velha guarda são o tempero, o turno de estudo é a escolha */
  /* pequena (sede 0–1) ~2 por ano, média (2–4) ~3, grande (5–6) ~5 (dono, 12/10/2026) */
  const PD_SEDE = [0.5, 0.6, 1.3, 1.6, 1.8, 2.8, 3.2];
  const PD_DIRETORIA = 0.4, PD_VELHA = 0.5, PD_TURNO = 0.15, PD_MENTOR = 0.2;
  function fontes(E){
    E = E || Ev();
    const d = D(E);
    const ativos = Math.max(1, E.membros.length);
    const vg = (E.velhaGuarda || []).length;
    const otimoVG = tem('o_mentor', E) ? 0.08 : 0.05;
    const dir = E.membros.filter(m => m.cargo === 'diretoria').length;
    const sede = Math.max(0, Math.min(6, E.torcida.sedeNivel || 0));
    const moral = E.indicadores.moral;
    const mult = (moral < 8 ? 0.85 : moral < 14 ? 1.0 : 1.15) * (tem('o_biblio', E) ? 1.1 : 1);
    const linhas = [
      {rot:'Velha guarda', v: PD_VELHA * Math.min(1, (vg / ativos) / otimoVG),
       nota: `${vg} na velha guarda · ótimo em ${Math.round(otimoVG*100)}% do efetivo`},
      {rot:'Diretoria', v: PD_DIRETORIA * Math.min(1, (dir / ativos) / 0.06) + (tem('o_mentor', E) ? PD_MENTOR : 0),
       nota: `${dir} diretores · ótimo em 6% do efetivo`},
      {rot:'Sede', v: PD_SEDE[sede], nota:`sede nível ${sede}`},
      {rot:'Turnos de estudo', v: PD_TURNO * Math.min(3, d.turnos || 0), nota:'0,15 por turno "Estudar" na semana, até 3'}
    ];
    const bruto = linhas.reduce((s, l) => s + l.v, 0);
    return {linhas, bruto, mult, total: bruto * mult,
            multNota: `moral ${um(moral)}/20 → ×${um(moral < 8 ? 0.85 : moral < 14 ? 1.0 : 1.15)}` + (tem('o_biblio', E) ? ' · biblioteca ×1,1' : '')};
  }

  /* trava: degrau anterior feito e sede mínima */
  function trava(E, s){
    const d = D(E);
    if(d.feitos.includes(s.id)) return 'feito';
    const ant = trilhaDe(s).find(x => x.n === s.n - 1);
    if(ant && !d.feitos.includes(ant.id)) return `precisa de "${ant.nome}"`;
    if((E.torcida.sedeNivel || 0) < SEDE_MIN[s.n]) return `precisa de sede nível ${SEDE_MIN[s.n]}`;
    return null;
  }
  /* o desconto da difusão: −1% por torcida que já tem, −3% se for
     aliada (relação ≥ 45), até −10% */
  function quemTem(E, id){
    const d = D(E), out = [];
    for(const [tid, x] of Object.entries(d.ia || {})) if((x.feitos || []).includes(id)) out.push(tid);
    return out;
  }
  function custo(E, s){
    const ja = quemTem(E, s.id);
    let desc = 0;
    for(const tid of ja) desc += ((E.relacoes || {})[tid] || 0) >= 45 ? 0.03 : 0.01;
    desc = Math.min(0.1, desc);
    return {base: CUSTO[s.n], desc, valor: Math.round(CUSTO[s.n] * (1 - desc)), ja: ja.length};
  }

  function escolher(id){
    const E = Ev(), d = D(E), s = POR_ID[id];
    if(!s || trava(E, s)) return false;
    d.atual = id;
    avancar(E);           // a reserva entra na hora
    salvarLeve();
    return true;
  }
  function avancar(E){
    const d = D(E);
    while(d.atual){
      const s = POR_ID[d.atual];
      const c = custo(E, s).valor;
      const falta = c - d.prog;
      if(d.pd >= falta){
        d.pd -= falta; d.prog = 0;
        concluir(E, s);
      } else { d.prog += d.pd; d.pd = 0; break; }
    }
  }
  function concluir(E, s){
    const d = D(E);
    d.feitos.push(s.id);
    d.atual = null;
    d.historico.unshift({id:s.id, quando: ST().dataTexto ? ST().dataTexto(E).curta : ''});
    aviso(`Desenvolvimento: ${s.nome} concluído — ${s.efeito}.`);
    /* efeitos de uma vez só */
    if(s.id === 'p_frente' || s.id === 'p_bloco' || s.id === 'm_tecnica') fichasDeUmaVez(E);
    if(s.id === 'm_bandeira') fincarBandeira(E);
    /* o próximo da mesma trilha fica escolhido, se der */
    const prox = trilhaDe(s).find(x => x.n === s.n + 1);
    if(prox && !trava(E, prox)) d.atual = prox.id;
  }

  /* -------------------------------------------------------
     OS EFEITOS — por fora do jogo, pelas portas públicas
     ------------------------------------------------------- */
  function embrulhar(obj, nome, f){
    const orig = obj && obj[nome];
    if(typeof orig !== 'function' || orig.__desenv) return;
    const novo = function(...a){ return f.call(this, orig, ...a); };
    novo.__desenv = true;
    obj[nome] = novo;
  }

  /* o livro-caixa: descontos e acréscimos pelo rótulo do lançamento */
  function ajusteDoLancamento(E, desc, v){
    const t = String(desc || '');
    let f = 1;
    if(v < 0){
      if(tem('p_bomba', E) && /^Bombas/.test(t)) f *= 0.8;
      if(tem('p_esconde', E) && (/^Saque/.test(t) || /^Levaram do nosso bar/.test(t))) f *= 0.75;
      if(tem('e_rateio', E) && /^Caravana/.test(t)) f *= 0.85;
      if(tem('e_frota', E) && /^Ônibus/.test(t)) f *= 0.6;
      if(tem('e_casa', E) && /^Recepção da/.test(t)) f *= 0.7;
      if(tem('a_festa', E) && /^Festa na arquibancada/.test(t)) f *= 0.85;
      if(tem('a_faixa', E) && (/^Faixa nova/.test(t) || /^Bandeira nova/.test(t))) f *= 0.75;
      if(tem('n_contab', E) && (/^Professor/.test(t) || /^Advogado/.test(t))) f *= 0.9;
      if(tem('o_juri', E) && /^Fiança de/.test(t)) f *= 0.8;
      if(tem('m_olheiro', E) && /^Reforço no elenco/.test(t)) f *= 0.85;
    } else if(v > 0){
      if(tem('n_socio', E) && /^Mensalidades/.test(t)) f *= 1.1;
      if(tem('n_doacao', E) && /^Doação de simpatizante/.test(t)) f *= 1.5;
    }
    return f;
  }
  function ligarEfeitos(){
    const S = ST();
    embrulhar(S, 'lancar', function(orig, E, desc, valor, ...r){
      E = E || Ev();
      let v = valor;
      if(E && E.desenv && typeof valor === 'number'){
        const f = ajusteDoLancamento(E, desc, valor);
        if(f !== 1){ v = Math.round(valor * f); rendeu('dinheiro', v - valor); }
        /* a caravana paga dá moral e prestígio */
        if(valor < 0 && /^Caravana/.test(String(desc))){
          if(tem('e_lanche', E)){ S.mexerIndicador(E, 'moral', 0.2, 'Lanche no ônibus (Desenvolvimento)'); }
          if(tem('e_estrada', E)){ S.mexerIndicador(E, 'prestigio', 0.1, 'Estrada conhecida (Desenvolvimento)'); }
        }
      }
      return orig.call(this, E, desc, v, ...r);
    });
    embrulhar(S, 'lancarNoResumo', function(orig, E, grupo, valor, ...r){
      E = E || Ev();
      let v = valor;
      if(E && E.desenv && grupo === 'comercio' && typeof valor === 'number'){
        let f = 1;
        if(valor > 0){ if(tem('n_chope', E)) f += 0.08; if(tem('n_marca', E)) f += 0.12; }
        else if(valor < 0 && tem('n_estampa', E)) f = 0.9;
        if(f !== 1){ v = Math.round(valor * f); rendeu('dinheiro', v - valor); }
      }
      return orig.call(this, E, grupo, v, ...r);
    });
    embrulhar(S, 'mexerIndicador', function(orig, E, ind, delta, ...r){
      E = E || Ev();
      let d = delta;
      if(E && E.desenv && typeof delta === 'number'){
        if(ind === 'prestigio' && delta > 0 && tem('a_hino', E)){ d = delta * 1.1; rendeu('prestigio', d - delta); }
        if(ind === 'moral' && delta < 0 && tem('a_orgulho', E)){ d = delta * 0.8; rendeu('moral', d - delta); }
      }
      return orig.call(this, E, ind, d, ...r);
    });
    /* o recrutamento: o peso do bairro é a porta pública da chance */
    if(TO.dominio) embrulhar(TO.dominio, 'pesoDoRecrutamento', function(orig, E, ...r){
      const p = orig.call(this, E, ...r);
      if(!E || !E.desenv) return p;
      return p * (1 + (tem('m_peneira', E) ? 0.25 : 0) + (tem('m_portas', E) ? 0.25 : 0));
    });
    /* o Fator Torcida das festas */
    if(TO.festas) embrulhar(TO.festas, 'usarNoJogo', function(orig, E, j, ...r){
      const pts = orig.call(this, E, j, ...r);
      if(!pts || !E || !E.desenv || !tem('a_coro', E)) return pts;
      rendeu('festa', Math.abs(pts) * 0.25);
      return pts * 1.25;
    });
    /* o turno de estudo no expediente */
    const A = TO.acoes;
    if(A && Array.isArray(A.LISTA) && !A.LISTA.some(a => a.id === 'estudar')){
      A.LISTA.push({
        id:'estudar', nome:'Estudar (Desenvolvimento)', icone:'conversa', cena:'Sede',
        efeito:'grátis; +0,15 ponto de desenvolvimento na semana (até 3 turnos)',
        disponivel(E){
          const d = D(E);
          return (d.turnos || 0) < 3 ? {ok:true, nota:`${d.turnos || 0}/3 na semana`}
                                     : {ok:false, motivo:'já são 3 turnos de estudo na semana'};
        },
        executar(E){
          const d = D(E);
          if((d.turnos || 0) >= 3) return {ok:false, msg:'Já são 3 turnos de estudo na semana.', semCusto:true};
          d.turnos = (d.turnos || 0) + 1;
          return {ok:true, msg:`A diretoria estudou: ${d.turnos}/3 turnos na semana.`};
        }
      });
    }
  }

  /* fichas: o teto do cargo manda */
  const teto = m => TO.membros.tetoDe ? TO.membros.tetoDe(m) : 20;
  function somar(m, f, d){
    const t = teto(m);
    let g = 0;
    if(f){ const a = Math.min(t, m.forca + f); g += a - m.forca; m.forca = a; }
    if(d){ const a = Math.min(t, m.defesa + d); g += a - m.defesa; m.defesa = a; }
    if(g > 0) rendeu('fichas', g);
  }
  function fichasDeUmaVez(E){
    for(const m of E.membros){
      if(tem('p_frente', E) && (m.cargo === 'frente' || m.cargo === 'diretoria') && !m._dvFrente){
        m._dvFrente = true; somar(m, 0.6, 0.6);
      }
      if(tem('p_bloco', E) && (m.cargo === 'novato' || m.cargo === 'componente') && !m._dvBloco){
        m._dvBloco = true; somar(m, 0, 0.6);
      }
    }
  }

  /* a cidade nova: a maior cidade sem torcedor do nosso clube */
  function fincarBandeira(E, cidadeId){
    const d = D(E), clube = E.torcida.clubeId;
    const t = TO.mundo.time(clube) || {};
    /* só no país da torcida: a cidade brasileira tem UF; a de fora, país */
    const minha = (TO.dados.cidades || []).find(c => c.id === E.torcida.mapa) || {};
    const mesmoPais = c => minha.uf ? !!c.uf : (c.pais && c.pais === minha.pais);
    const sem = (TO.dados.cidades || []).filter(c => c.id !== E.torcida.mapa && mesmoPais(c) &&
      !(c.times || []).some(x => x.clubeId === clube) && !d.cidadesNovas.some(x => x.cidade === c.id));
    if(!sem.length) return null;
    const alvo = cidadeId ? sem.find(c => c.id === cidadeId) : sem.sort((a,b) => (b.populacao||0) - (a.populacao||0))[0];
    if(!alvo) return null;
    const n = alvo.tamanho === 'Grande' ? 60 : alvo.tamanho === 'Médio' ? 30 : 15;
    d.cidadesNovas.push({cidade:alvo.id, n});
    E.torcedoresEv = E.torcedoresEv || {};
    E.torcedoresEv[alvo.id + '|' + clube] = n;
    rendeu('torcedores', n);
    garantirCidades(E);
    aviso(`Bandeira fincada: surgiu torcida do ${t.nome || 'clube'} em ${alvo.nome} (${n}). Já dá pra abrir subsede lá.`);
    return alvo;
  }
  /* a cidade nova não mora no save do jogo: o time é posto de novo na
     lista da cidade toda vez que o save carrega */
  function garantirCidades(E){
    const d = D(E);
    if(!d || !d.cidadesNovas.length) return;
    const clube = E.torcida.clubeId, t = TO.mundo.time(clube) || {};
    for(const x of d.cidadesNovas){
      const c = (TO.dados.cidades || []).find(cc => cc.id === x.cidade);
      if(!c) continue;
      c.times = c.times || [];
      if(!c.times.some(tt => tt.clubeId === clube))
        c.times.push({clube:t.nome || clube, clubeId:clube, sigla:t.sigla || '', perc:1,
                      torcedores:x.n, estadioProprio:false, local:false, _desenv:true});
    }
  }

  /* -------------------------------------------------------
     O RELÓGIO: o dia, a semana e o mês
     ------------------------------------------------------- */
  let fichasOntem = new Map();
  function porDia(E){
    const d = D(E);
    if(!d) return;
    garantirCidades(E);
    const abs = E.data.absoluto || 0;
    if(d.ultimoDia === abs) return;
    d.ultimoDia = abs;
    /* treino coletivo: o que subiu de ontem pra hoje rende +20% */
    if(tem('p_treino', E)){
      for(const m of E.membros){
        const o = fichasOntem.get(m.id || m.nome);
        if(o){
          const df = m.forca - o.f, dd = m.defesa - o.d;
          if(df > 0 && df < 1) somar(m, df * 0.2, 0);
          if(dd > 0 && dd < 1) somar(m, 0, dd * 0.2);
        }
      }
    }
    /* a ferrugem da paz acabou de cair hoje? */
    if(tem('o_ferrugem', E) && E.ultimaDepreciacao === abs && d.marcos.ferrugem !== abs){
      d.marcos.ferrugem = abs;
      for(const m of E.membros) somar(m, 0.1, 0.1);
    }
    /* feridos e presos novos */
    for(const m of E.membros){
      if(m.ferido && !m.ferido._dv){
        m.ferido._dv = true;
        if(tem('o_fisio', E) && m.ferido.dias > 1){
          const a = Math.max(1, m.ferido.dias - 2); rendeu('diasFerido', m.ferido.dias - a); m.ferido.dias = a;
        }
      }
      if(m.preso && typeof m.preso === 'object' && !m.preso._dv){
        m.preso._dv = true;
        if(tem('o_juri', E) && m.preso.dias > 1){
          const a = Math.max(1, Math.round(m.preso.dias * 0.8)); m.preso.dias = a;
        }
      }
      /* quem entrou hoje */
      if(!m._dvVisto){
        m._dvVisto = true;
        if(d.marcos.inicio && tem('m_tecnica', E) && m.cargo === 'novato') somar(m, 1.5, 1.5);
      }
    }
    /* promovidos e novatos depois do estudo */
    fichasDeUmaVez(E);
    /* bateria de respeito: o treino de bateria vale 14 dias */
    if(tem('a_bateria', E) && E.bateriaAbs != null && abs - E.bateriaAbs >= 7 && d.marcos.bateria !== E.bateriaAbs){
      E.bateriaAbs += 7; d.marcos.bateria = E.bateriaAbs;
    }
    fichasOntem = new Map(E.membros.map(m => [m.id || m.nome, {f:m.forca, d:m.defesa}]));
    /* o mês: no dia 1 da semana que vira de mês (a mensalidade é o marco) */
    const mes = ST().dataTexto ? ST().dataTexto(E).curta.slice(3) : String(Math.floor(abs / 30));
    if(d.marcos.mes !== mes){ if(d.marcos.mes != null) porMes(E); d.marcos.mes = mes; }
    if(!d.marcos.inicio) d.marcos.inicio = abs;
  }

  function porSemana(E){
    const d = D(E);
    if(!d) return;
    const chave = `${E.data.ano}-${E.data.semana}`;
    if(d.ultimaSemana === chave) return;
    d.ultimaSemana = chave;
    d.pd += fontes(E).total;
    d.turnos = 0;
    /* teto da reserva: 52 semanas */
    d.pd = Math.min(d.pd, fontes(E).total * 52 + 60);
    if(tem('o_saude', E)) for(const m of E.membros) if(m.ferido && m.ferido.dias > 1){ m.ferido.dias--; rendeu('diasFerido', 1); }
    avancar(E);
    iaSemana(E);
    if(!d.atual) aviso('Desenvolvimento: a diretoria está sem estudo — os pontos estão guardando.', true);
    pintarBotao();
  }

  function porMes(E){
    const d = D(E), clube = E.torcida.clubeId;
    if(tem('p_arsenal', E) && E.estoque){ E.estoque.bombas = (E.estoque.bombas || 0) + 2; rendeu('bombas', 2); }
    if(tem('e_rede', E)) for(const [id, v] of Object.entries(E.relacoes || {}))
      if(v >= 45 && v < 100) E.relacoes[id] = Math.min(100, v + 1);
    const crescer = (cid, pct) => {
      const atual = TO.mundo.torcedoresDoClubeNa(cid, clube);
      if(!atual) return;
      const novo = atual * (1 + pct);
      E.torcedoresEv = E.torcedoresEv || {};
      E.torcedoresEv[cid + '|' + clube] = Math.round(novo * 100) / 100;
      rendeu('torcedores', novo - atual);
    };
    if(tem('m_escola', E)) crescer(E.torcida.mapa, 0.005);
    if(tem('m_interior', E)) for(const f of ((E.patrimonio || {}).filiais || [])) crescer(f.cidade, 0.005);
    if(tem('m_portas', E)) novatoGarantido(E);
    d.marcos.meses = (d.marcos.meses || 0) + 1;
    const forca = n => { E.investimento = E.investimento || {}; E.investimento[clube] = (E.investimento[clube] || 0) + n; rendeu('forcaClube', n); };
    if(tem('m_vaquinha', E) && d.marcos.meses % 6 === 0){ forca(1); aviso('Vaquinha pro elenco: +1 de força no elenco do clube.'); }
    if(tem('m_base', E) && d.marcos.meses % 3 === 0){ forca(1); aviso('Categoria de base: +1 de força no elenco do clube.'); }
  }
  function novatoGarantido(E){
    const M = TO.membros;
    if(!M || !M.capacidade || E.membros.length >= M.capacidade(E)) return;
    const base = TO.mundo.baseDeRecrutamento ? TO.mundo.baseDeRecrutamento(E.torcida.mapa, E.torcida.clubeId) : 1;
    if(base <= 0) return;
    if(typeof M.criar !== 'function') return;
    try{
      const m = M.criar(E, {cargo:'novato'});
      if(m && !E.membros.includes(m)) E.membros.push(m);
      rendeu('recrutas', 1);
    }catch(e){ console.warn('[desenv] novato garantido', e); }
  }

  /* -------------------------------------------------------
     AS RIVAIS ESTUDAM TAMBÉM (pela mesma régua, simplificada): os pontos
     saem do tamanho e da sede delas, e o estudo é sorteado entre os
     liberados. No protótipo elas NÃO ganham os efeitos — só aparecem
     no ranking e baixam o custo pra quem vem depois (a difusão).
     ------------------------------------------------------- */
  function iaSemana(E){
    const d = D(E), W = E.mundoTorcidas || {};
    for(const [id, t] of Object.entries(W)){
      if(id === E.torcida.id) continue;
      const x = d.ia[id] || (d.ia[id] = {pd:0, feitos:[], atual:null});
      const sede = Math.max(0, Math.min(6, t.sede == null ? 1 : t.sede));
      const mem = t.membros || 20;
      const moral = t.moral != null ? t.moral : 12;
      /* a mesma régua: sede + diretoria (a IA não tem ficha de diretor;
         toda torcida tem a sua, então a diretoria vale cheia) */
      x.pd += (PD_SEDE[sede] + PD_DIRETORIA) * (moral < 8 ? 0.85 : moral < 14 ? 1 : 1.15);
      for(let k = 0; k < 4; k++){
        if(!x.atual){
          const livres = ESTUDOS.filter(s => !x.feitos.includes(s.id) &&
            (s.n === 1 || x.feitos.includes(trilhaDe(s).find(y => y.n === s.n - 1).id)) && sede >= SEDE_MIN[s.n]);
          if(!livres.length) break;
          x.atual = livres[Math.floor(Math.random() * livres.length)].id;
        }
        const c = CUSTO[POR_ID[x.atual].n];
        if(x.pd < c) break;
        x.pd -= c; x.feitos.push(x.atual); x.atual = null;
      }
    }
  }

  /* -------------------------------------------------------
     A TELA
     ------------------------------------------------------- */
  const css = `
  #dvBotao{position:fixed;right:12px;bottom:84px;z-index:80;background:#1d1a14;color:#f0e6c8;border:1px solid #c9a23a;border-radius:10px;padding:8px 12px;font:600 13px/1.2 system-ui,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.5);min-width:150px;text-align:left}
  #dvBotao small{display:block;font-weight:400;opacity:.8;margin-top:3px}
  #dvBotao .dv-bar{height:4px;background:#3a3427;border-radius:2px;margin-top:5px;overflow:hidden}
  #dvBotao .dv-bar i{display:block;height:100%;background:#c9a23a}
  #dvBotao.alerta{border-color:#e05252;animation:dvPulse 1.4s infinite}
  @keyframes dvPulse{50%{box-shadow:0 0 0 4px rgba(224,82,82,.35)}}
  #dvTela{position:fixed;inset:0;z-index:90;background:rgba(8,7,5,.94);color:#eee;font:14px/1.4 system-ui,sans-serif;overflow:auto;padding:16px}
  #dvTela.oculto,#dvBotao.oculto{display:none}
  #dvTela .dv-h1{font-size:20px;margin:0}
  #dvTela .dv-topo{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start;justify-content:space-between;margin-bottom:12px}
  #dvTela .dv-fechar{background:#c9a23a;color:#111;border:0;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer}
  #dvTela .dv-cartao{background:#16140f;border:1px solid #333;border-radius:10px;padding:10px 12px}
  #dvTela .dv-linha{display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:2px 0}
  #dvTela .dv-linha span:first-child{opacity:.8}
  #dvTela .dv-resumo{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:12px}
  #dvTela .dv-areas{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px}
  #dvTela .dv-area .dv-h2{font-size:15px;margin:0 0 2px}
  #dvTela .dv-area .dv-d{font-size:12px;opacity:.7;margin-bottom:6px}
  #dvTela .dv-trilha{margin:8px 0 2px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;opacity:.75}
  #dvTela .dv-est{display:block;width:100%;text-align:left;background:#211e17;border:1px solid #3a3427;color:#eee;border-radius:8px;padding:7px 9px;margin:4px 0;cursor:pointer;font:inherit}
  #dvTela .dv-est b{font-size:13px}
  #dvTela .dv-est small{display:block;font-size:12px;opacity:.8;margin-top:2px}
  #dvTela .dv-est .dv-meta{font-size:11px;opacity:.75;margin-top:3px}
  #dvTela .dv-est.dv-feito{border-color:#4cbf7a;background:#16241b}
  #dvTela .dv-est.dv-atual{border-color:#c9a23a;box-shadow:inset 0 0 0 1px #c9a23a}
  #dvTela .dv-est.dv-travado{opacity:.45;cursor:default}
  #dvTela .dv-bar{height:6px;background:#3a3427;border-radius:3px;overflow:hidden;margin-top:6px}
  #dvTela .dv-bar i{display:block;height:100%;background:#c9a23a}
  #dvTela .dv-nota{font-size:12px;opacity:.7}
  #dvToast{position:fixed;left:50%;transform:translateX(-50%);bottom:24px;z-index:95;background:#1d1a14;border:1px solid #c9a23a;color:#f0e6c8;border-radius:10px;padding:10px 14px;font:13px/1.35 system-ui,sans-serif;max-width:min(560px,92vw);box-shadow:0 6px 20px rgba(0,0,0,.6)}
  @media (max-width:600px){#dvBotao{bottom:76px;right:8px;min-width:120px;font-size:12px}#dvTela{padding:10px}}
  `;
  function montarDOM(){
    if(document.getElementById('dvBotao')) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const b = document.createElement('button'); b.id = 'dvBotao'; b.className = 'oculto';
    b.addEventListener('click', abrir);
    document.body.appendChild(b);
    const t = document.createElement('div'); t.id = 'dvTela'; t.className = 'oculto';
    t.addEventListener('click', ev => {
      const e = ev.target.closest('[data-est]');
      if(e && !e.classList.contains('dv-travado') && !e.classList.contains('dv-feito')){ escolher(e.dataset.est); pintar(); pintarBotao(); }
      if(ev.target.closest('[data-fechar]')) fechar();
    });
    document.body.appendChild(t);
  }
  let toastT = null;
  function aviso(txt, leve){
    let el = document.getElementById('dvToast');
    if(!el){ el = document.createElement('div'); el.id = 'dvToast'; document.body.appendChild(el); }
    el.textContent = txt; el.style.display = 'block';
    clearTimeout(toastT); toastT = setTimeout(() => { el.style.display = 'none'; }, leve ? 2600 : 5200);
  }
  function pintarBotao(){
    const b = document.getElementById('dvBotao'), E = Ev();
    if(!b) return;
    const jogo = document.getElementById('jogo');
    const visivel = E && E.torcida && jogo && !jogo.classList.contains('oculto') && !document.body.classList.contains('em-cena');
    b.classList.toggle('oculto', !visivel);
    if(!visivel) return;
    const d = D(E), s = d.atual && POR_ID[d.atual];
    const c = s ? custo(E, s).valor : 0;
    b.classList.toggle('alerta', !s);
    b.innerHTML = `Desenvolvimento<small>${s ? `${s.nome} · ${Math.floor(d.prog)}/${c}` : `sem estudo · ${Math.floor(d.pd)} PD guardados`}</small>` +
      (s ? `<div class="dv-bar"><i style="width:${Math.min(100, d.prog / c * 100)}%"></i></div>` : '');
  }
  let pausou = false;
  function abrir(){
    const t = document.getElementById('dvTela');
    if(!t || !Ev()) return;
    if(ST().estaBloqueado && !ST().estaBloqueado()){ ST().bloquear(true); pausou = true; }
    t.classList.remove('oculto');
    pintar();
  }
  function fechar(){
    document.getElementById('dvTela').classList.add('oculto');
    if(pausou){ ST().bloquear(false); pausou = false; }
    pintarBotao();
  }
  function pintar(){
    const t = document.getElementById('dvTela'), E = Ev();
    if(!t || !E) return;
    const d = D(E), F = fontes(E), s = d.atual && POR_ID[d.atual];
    const c = s ? custo(E, s) : null;
    const sem = F.total > 0 ? Math.ceil(((c ? c.valor - d.prog : 0) - d.pd) / F.total) : null;
    const r = d.rendeu;
    const rivais = Object.entries(d.ia).map(([id, x]) => ({id, n:x.feitos.length, nome:(TO.mundo.torcida(id) || {}).nome || id}))
      .sort((a,b) => b.n - a.n).slice(0, 6);
    const pos = 1 + Object.values(d.ia).filter(x => x.feitos.length > d.feitos.length).length;
    t.innerHTML = `
      <div class="dv-topo">
        <div><div class="dv-h1">Desenvolvimento da Torcida</div>
          <div class="dv-nota">Protótipo à parte — o jogo normal não tem isto. ${d.feitos.length} de ${ESTUDOS.length} estudos feitos · ${pos}º do país em estudos.</div></div>
        <button class="dv-fechar" data-fechar>Voltar ao jogo</button>
      </div>
      <div class="dv-resumo">
        <div class="dv-cartao"><b>Estudo atual</b>
          ${s ? `<div style="margin-top:4px">${s.nome} <span class="dv-nota">(${AREAS.find(a => a.id === s.area).nome} · ${s.trilha} ${s.n})</span></div>
            <div class="dv-nota">${s.efeito}</div>
            <div class="dv-bar"><i style="width:${Math.min(100, d.prog / c.valor * 100)}%"></i></div>
            <div class="dv-linha"><span>Progresso</span><span>${Math.floor(d.prog)} / ${c.valor} PD${c.desc ? ` (−${Math.round(c.desc*100)}%: ${c.ja} torcidas já têm)` : ''}</span></div>
            <div class="dv-linha"><span>Faltam</span><span>${sem != null && sem > 0 ? `~${sem} semana${sem > 1 ? 's' : ''}` : 'fecha na próxima semana'}</span></div>`
            : `<div class="dv-nota" style="margin-top:4px">Nenhum estudo escolhido: os pontos ficam guardados (${Math.floor(d.pd)} PD). Toque num estudo liberado.</div>`}
        </div>
        <div class="dv-cartao"><b>Pontos de Desenvolvimento por semana: ${um(F.total)}</b>
          ${F.linhas.map(l => `<div class="dv-linha"><span>${l.rot} <span class="dv-nota">· ${l.nota}</span></span><span>${um(l.v)}</span></div>`).join('')}
          <div class="dv-linha"><span>Multiplicador <span class="dv-nota">· ${F.multNota}</span></span><span>×${um(F.mult)}</span></div>
          <div class="dv-linha"><span>Reserva</span><span>${Math.floor(d.pd)} PD</span></div>
        </div>
        <div class="dv-cartao"><b>O que o Desenvolvimento já rendeu</b>
          <div class="dv-linha"><span>Dinheiro (economizado + ganho)</span><span>${R$(r.dinheiro)}</span></div>
          <div class="dv-linha"><span>Força e defesa somadas nos membros</span><span>+${um(r.fichas)}</span></div>
          <div class="dv-linha"><span>Torcedores do clube a mais</span><span>+${um(r.torcedores)}</span></div>
          <div class="dv-linha"><span>Força no elenco do clube</span><span>+${r.forcaClube}</span></div>
          <div class="dv-linha"><span>Novatos garantidos</span><span>${r.recrutas}</span></div>
          <div class="dv-linha"><span>Dias de ferido poupados</span><span>${r.diasFerido}</span></div>
          <div class="dv-linha"><span>Prestígio a mais · moral poupada</span><span>+${um(r.prestigio)} · +${um(r.moral)}</span></div>
          <div class="dv-linha"><span>Fator Torcida a mais nas festas · bombas</span><span>+${um(r.festa)} · ${r.bombas}</span></div>
          ${d.cidadesNovas.length ? `<div class="dv-linha"><span>Cidades novas</span><span>${d.cidadesNovas.map(x => (TO.mundo.cidade(x.cidade) || {}).nome || x.cidade).join(', ')}</span></div>` : ''}
        </div>
        <div class="dv-cartao"><b>As rivais também estudam</b>
          ${rivais.length ? rivais.map(x => `<div class="dv-linha"><span>${x.nome}</span><span>${x.n}</span></div>`).join('') : '<div class="dv-nota">Começa a contar na primeira semana.</div>'}
          <div class="dv-nota" style="margin-top:4px">No protótipo elas não ganham os efeitos — só baixam o custo do que já estudaram (−1% por torcida, −3% se for aliada, até −10%).</div>
        </div>
      </div>
      <div class="dv-areas">
        ${AREAS.map(a => `<div class="dv-cartao dv-area" style="border-top:3px solid ${a.cor}">
          <div class="dv-h2">${a.nome}</div><div class="dv-d">${a.desc}</div>
          ${[...new Set(ESTUDOS.filter(x => x.area === a.id).map(x => x.trilha))].map(tr => `
            <div class="dv-trilha">${tr}</div>
            ${ESTUDOS.filter(x => x.area === a.id && x.trilha === tr).sort((p,q) => p.n - q.n).map(x => {
              const tv = trava(E, x), cc = custo(E, x);
              const cls = tv === 'feito' ? 'dv-feito' : x.id === d.atual ? 'dv-atual' : tv ? 'dv-travado' : '';
              return `<button class="dv-est ${cls}" data-est="${x.id}">
                <b>${tv === 'feito' ? '✓ ' : ''}${x.n}. ${x.nome}</b><small>${x.efeito}</small>
                <div class="dv-meta">${tv === 'feito' ? 'feito' : tv ? tv : `${cc.valor} PD${cc.desc ? ` (−${Math.round(cc.desc*100)}%)` : ''}${x.id === d.atual ? ' · estudando' : ' · toque pra estudar'}`}</div>
              </button>`;
            }).join('')}`).join('')}
        </div>`).join('')}
      </div>`;
  }
  let salvarT = null;
  function salvarLeve(){ clearTimeout(salvarT); salvarT = setTimeout(() => { try{ ST().salvar && ST().salvar(); }catch(_){} }, 300); }

  /* -------------------------------------------------------
     A PARTIDA
     ------------------------------------------------------- */
  function iniciar(){
    if(!TO.estado || !TO.membros){ return setTimeout(iniciar, 300); }
    montarDOM();
    ligarEfeitos();
    ST().aoFecharSemana && ST().aoFecharSemana((fecho, E) => { try{ porSemana(E || Ev()); }catch(e){ console.warn('[desenv] semana', e); } });
    ST().aoMudar && ST().aoMudar(E => { try{ if(E && E.torcida){ porDia(E); pintarBotao(); } }catch(e){ console.warn('[desenv] dia', e); } });
    setInterval(() => { try{ const E = Ev(); if(E && E.torcida){ porDia(E); } pintarBotao(); }catch(e){ console.warn('[desenv]', e); } }, 1000);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();

  /* pra quem testa */
  TO.desenvolvimento = {AREAS, ESTUDOS, POR_ID, D, fontes, custo, trava, escolher, concluir: (id) => concluir(Ev(), POR_ID[id]),
                        porSemana, porMes, porDia, fincarBandeira, abrir, fechar, pintar};
})();
