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
    /* cada estudo guarda o seu progresso: trocar não leva o andamento junto */
    d.progs = d.progs || {};
    if(d.atual && d.atual !== id) d.progs[d.atual] = d.prog;
    if(d.atual !== id){ d.prog = d.progs[id] || 0; delete d.progs[id]; }
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
    if(TO.ui && TO.ui.painelAberto && TO.ui.painelAberto() === 'desenvolvimento') pintarAgora();
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
     liberados. Os efeitos delas vêm em `efeitosIA` (paridade, 12/10/2026) — e aparecem
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
      try{ efeitosIA(E, id, t, x); }catch(e){ console.warn('[desenv] efeitos IA', e); }
    }
  }

  /* OS ESTUDOS DELAS TAMBÉM RENDEM (paridade, dono 12/10/2026: "dar às
     IAs os efeitos dos estudos"). Sem livro-caixa por lançamento nem
     ficha por membro, cada efeito vira o equivalente na conta delas:
     receita e custo pela fatia do balanço da semana, ficha pela média do
     quadro, recrutamento por chance extra, torcedores e elenco do clube
     pelas mesmas contas da nossa, moral e prestígio pelo indicador. */
  function efeitosIA(E, id, t, x){
    const tem2 = k => x.feitos.includes(k);
    const R = TO.relacoes;
    x.aplicados = x.aplicados || [];
    const umaVez = (k, f) => { if(tem2(k) && !x.aplicados.includes(k)){ x.aplicados.push(k); f(); } };
    /* ficha: o quadro sobe pela média */
    const q = R && R.quadroDe ? R.quadroDe(E, id) : null;
    const C = TO.membros.CARGOS || {};
    const somarQ = (cargos, f) => { if(!q) return; for(const c of cargos)
      if(q.forca[c] != null) q.forca[c] = Math.min(((C[c] || {}).teto || 20), q.forca[c] + f); };
    umaVez('p_frente', () => somarQ(['frente', 'diretoria'], 0.6));
    umaVez('p_bloco', () => somarQ(['novato', 'componente'], 0.3));
    if(tem2('p_treino')) somarQ(['novato', 'componente', 'frente', 'diretoria'], 0.01);   // treino +20%, na semana
    if(tem2('m_tecnica')) somarQ(['novato'], 0.02);                                        // quem chega melhor
    /* dinheiro: a fatia da semana do balanço */
    if(R && R.balanco){
      const b = R.balanco(t, E, id), sem = 1/4;
      let pct = 0;
      if(tem2('n_chope')) pct += 0.08;
      if(tem2('n_marca')) pct += 0.12;
      let corte = 0;
      for(const k of ['n_estampa', 'e_frota', 'n_contab', 'a_festa', 'p_bomba', 'e_rateio']) if(tem2(k)) corte += 0.02;
      const v = Math.round(b.rec * sem * pct + b.des * sem * corte + (tem2('n_socio') ? 0.1 * Math.max(0, b.mensal || 0) * sem : 0));
      if(v > 0) t.caixa += v;
    }
    /* recrutamento: chance extra na semana, se tiver vaga */
    const extra = (tem2('m_peneira') ? 0.25 : 0) + (tem2('m_portas') ? 0.5 : 0);
    const cabe = ((TO.membros.SEDE || [])[Math.max(0, Math.min(6, t.sede || 0))] || {}).membros || 0;
    if(extra && (t.membros || 0) < cabe && Math.random() < extra) t.membros = (t.membros || 0) + 1;
    /* moral e prestígio */
    if(R && R.mover){
      if(tem2('a_hino')) R.mover(E, id, 'prestigio', 0.02);
      if(tem2('a_orgulho') || tem2('e_lanche')) R.mover(E, id, 'moral', 0.05);
    }
    /* saúde e jurídico: quem está preso sai um pouco antes */
    if(tem2('o_juri') || tem2('o_saude'))
      t.presosIA = (t.presosIA || []).map(p => ({n:p.n, ate:p.ate - 1}));
    /* torcedores e elenco do clube: a mesma conta da nossa, no mês */
    const o = TO.mundo.torcida(id);
    const mes = Math.floor((E.data.absoluto || 0) / 28);
    if(o && o.clubeId && x.mes !== mes){
      x.mes = mes;
      const crescer = (cid, pct) => {
        const a = TO.mundo.torcedoresDoClubeNa(cid, o.clubeId);
        if(!a) return;
        E.torcedoresEv = E.torcedoresEv || {};
        E.torcedoresEv[cid + '|' + o.clubeId] = Math.round(a * (1 + pct) * 100) / 100;
      };
      if(tem2('m_escola')) crescer(o.mapa, 0.005);
      if(tem2('m_interior')) for(const f of (t.filiais || [])) crescer(f.cidade, 0.005);
      x.meses = (x.meses || 0) + 1;
      E.investimento = E.investimento || {};
      if(tem2('m_vaquinha') && x.meses % 6 === 0) E.investimento[o.clubeId] = (E.investimento[o.clubeId] || 0) + 1;
      if(tem2('m_base') && x.meses % 3 === 0) E.investimento[o.clubeId] = (E.investimento[o.clubeId] || 0) + 1;
    }
  }

  /* -------------------------------------------------------
     A PÁGINA DO MENU (dono, 12/10/2026: "o desenvolvimento deve ocupar
     uma página do menu com padrão visual idêntico ao das outras
     páginas"). Entra pela porta TO.ui.registrarPagina do main.js e usa
     as MESMAS peças das páginas do jogo: título de página, subabas,
     cartões com h2, linha-dado, valorão, a medida com barra e a oferta
     da Loja. Nada de CSS próprio.
     ------------------------------------------------------- */
  let aba = 'resumo';
  const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const linha = (rot, val, cls) => `<div class="linha-dado"><span>${rot}</span><b${cls ? ` class="${cls}"` : ''}>${val}</b></div>`;
  const medida = (v, max) => {
    const p = Math.max(0, Math.min(1, max ? v / max : 0));
    return `<span class="medida ${p > 0.66 ? '' : p > 0.33 ? 'media' : 'baixa'}"><span class="n">${Math.floor(v)}/${max}</span>`+
           `<span class="barra"><i style="width:${p * 100}%"></i></span></span>`;
  };
  function aviso(txt, leve){
    if(TO.ui && TO.ui.aviso) TO.ui.aviso(txt, leve ? '' : 'boa');
  }
  /* o selo do item do menu: aceso quando não há estudo escolhido */
  function pintarBotao(){
    const E = Ev();
    const d = E && E.torcida ? D(E) : null;
    for(const b of document.querySelectorAll('.nav-item[data-pag="desenvolvimento"] .ic-badge, .mapa-ic[data-pag="desenvolvimento"] .ic-badge')){
      const sem = !!(d && !d.atual);
      b.hidden = !sem;
      if(sem) b.textContent = '!';
    }
  }
  let pgAtual = null;
  function pintarAgora(){ if(pgAtual && pgAtual.isConnected) pintarPagina(pgAtual); }

  function pintarPagina(pg){
    pgAtual = pg;
    const E = Ev(), UI = TO.ui;
    if(!E || !UI) return;
    const d = D(E);
    pg.innerHTML = '';
    pg.appendChild(UI.el('div', {class:'titulo-pagina', texto:'Desenvolvimento da Torcida'}));
    const feitosNa = a => d.feitos.filter(id => POR_ID[id].area === a.id).length;
    pg.appendChild(UI.subabas([{id:'resumo', rot:'Resumo'}].concat(AREAS.map(a => ({
      id:a.id, rot:`${a.nome} · ${feitosNa(a)}/${ESTUDOS.filter(x => x.area === a.id).length}`}))),
      aba, id => { aba = id; pintarPagina(pg); }));
    if(aba === 'resumo') resumo(pg, E, d, UI);
    else area(pg, E, d, UI, AREAS.find(a => a.id === aba));
  }

  function resumo(pg, E, d, UI){
    const F = fontes(E), s = d.atual && POR_ID[d.atual];
    const c = s ? custo(E, s) : null;
    const sem = F.total > 0 && c ? Math.ceil((c.valor - d.prog) / F.total) : null;
    pg.appendChild(UI.el('div', {class:'recado', html:
      `Protótipo à parte: o jogo normal não tem esta página. <b>${d.feitos.length} de ${ESTUDOS.length}</b> estudos feitos.`+
      `<small>Uma torcida pequena faz uns 2 estudos por ano, a média 3 e a grande 5.</small>`}));
    const grade = UI.el('div', {class:'colunas-3'});

    const c1 = UI.cartao('Estudo atual', s ? AREAS.find(a => a.id === s.area).nome : '');
    if(s){
      c1.corpo.innerHTML =
        `<div class="valorao"><span>${esc(s.trilha)} · degrau ${s.n}</span><b>${esc(s.nome)}</b></div>`+
        linha('Efeito', `<span class="fraco">${esc(s.efeito)}</span>`)+
        linha('Progresso', medida(d.prog, c.valor))+
        linha('Faltam', sem > 0 ? `~${sem} semana${sem > 1 ? 's' : ''}` : 'fecha na próxima semana')+
        (c.desc ? linha('Desconto', `−${Math.round(c.desc * 100)}% · ${c.ja} torcidas já têm`) : '');
    } else {
      c1.corpo.innerHTML = `<div class="em-construcao"><b>Sem estudo</b>Os pontos ficam guardados (${Math.floor(d.pd)} PD). Escolha um estudo numa das áreas.</div>`;
    }
    grade.appendChild(c1);

    const c2 = UI.cartao('Pontos por semana', `${um(F.total)} PD`);
    c2.corpo.innerHTML = F.linhas.map(l => linha(`${l.rot} <span class="fraco">· ${esc(l.nota)}</span>`, um(l.v))).join('')+
      linha(`Multiplicador <span class="fraco">· ${esc(F.multNota)}</span>`, `×${um(F.mult)}`)+
      linha('Reserva', `${Math.floor(d.pd)} PD`);
    grade.appendChild(c2);

    const r = d.rendeu;
    const c3 = UI.cartao('O que já rendeu');
    c3.corpo.innerHTML =
      linha('Dinheiro (economizado + ganho)', R$(r.dinheiro), r.dinheiro > 0 ? 'positivo' : '')+
      linha('Força e defesa nos membros', `+${um(r.fichas)}`)+
      linha('Torcedores do clube', `+${um(r.torcedores)}`)+
      linha('Força no elenco do clube', `+${r.forcaClube}`)+
      linha('Novatos garantidos', r.recrutas)+
      linha('Dias de ferido poupados', r.diasFerido)+
      linha('Prestígio a mais · moral poupada', `+${um(r.prestigio)} · +${um(r.moral)}`)+
      linha('Fator Torcida nas festas · bombas', `+${um(r.festa)} · ${r.bombas}`)+
      (d.cidadesNovas.length ? linha('Cidades novas', d.cidadesNovas.map(x => esc((TO.mundo.cidade(x.cidade) || {}).nome || x.cidade)).join(', ')) : '');
    grade.appendChild(c3);
    pg.appendChild(grade);

    const rivais = Object.entries(d.ia).map(([id, x]) => ({n:x.feitos.length, nome:(TO.mundo.torcida(id) || {}).nome || id}))
      .sort((a, b) => b.n - a.n);
    const pos = 1 + rivais.filter(x => x.n > d.feitos.length).length;
    const grade2 = UI.el('div', {class:'colunas-3'});
    const c4 = UI.cartao('As rivais também estudam', `${pos}º do país`);
    c4.corpo.innerHTML = rivais.length
      ? rivais.slice(0, 8).map(x => linha(esc(x.nome), x.n)).join('')+
        `<div class="linha-dado"><span class="fraco">Os estudos delas rendem pela mesma régua (na conta delas), e baixam o custo pra quem vem depois (−1% por torcida, −3% se for aliada, até −10%).</span></div>`
      : `<div class="em-construcao">Começa a contar na primeira semana.</div>`;
    grade2.appendChild(c4);
    const c5 = UI.cartao('Últimos concluídos');
    c5.corpo.innerHTML = d.historico.length
      ? d.historico.slice(0, 8).map(h => linha(esc(POR_ID[h.id].nome), esc(h.quando || ''))).join('')
      : `<div class="em-construcao">Nenhum ainda.</div>`;
    grade2.appendChild(c5);
    const c6 = UI.cartao('Como funciona');
    c6.corpo.innerHTML =
      linha('Um estudo por vez', '<span class="fraco">o que sobra vai pra reserva</span>')+
      linha('Degraus 1 · 2 · 3', `${CUSTO[1]} · ${CUSTO[2]} · ${CUSTO[3]} PD`)+
      linha('Sede pra liberar', `${SEDE_MIN[1]} · ${SEDE_MIN[2]} · ${SEDE_MIN[3]}`)+
      linha('Turno "Estudar" no expediente', `+${String(PD_TURNO).replace('.', ',')} PD cada, até 3`);
    grade2.appendChild(c6);
    pg.appendChild(grade2);
  }

  function area(pg, E, d, UI, a){
    pg.appendChild(UI.el('div', {class:'recado', html:`<b>${a.nome}</b> — ${a.desc}.`+
      `<small>Cada trilha sobe um degrau por vez; o estudo em andamento aparece marcado.</small>`}));
    /* uma trilha por linha: lado a lado, três trilhas espremiam o texto */
    const grade = UI.el('div');
    for(const tr of [...new Set(ESTUDOS.filter(x => x.area === a.id).map(x => x.trilha))]){
      const lista = ESTUDOS.filter(x => x.area === a.id && x.trilha === tr).sort((p, q) => p.n - q.n);
      const c = UI.cartao(tr, `${lista.filter(x => d.feitos.includes(x.id)).length}/${lista.length}`);
      for(const x of lista){
        const tv = trava(E, x), cc = custo(E, x), feito = tv === 'feito', atual = x.id === d.atual;
        const b = UI.el('button', {class:'oferta' + (tv && !feito ? ' travada' : '')});
        b.innerHTML = `<span class="txt"><b>${feito ? '✓ ' : ''}${x.n}. ${esc(x.nome)}</b><small>${esc(x.efeito)}</small></span>`+
          `<span class="preco">${feito ? 'feito' : atual ? `${Math.floor(d.prog)}/${cc.valor} PD` : `${cc.valor} PD`}</span>`;
        if(tv && !feito) b.appendChild(UI.el('small', {class:'trava', texto:tv}));
        if(atual) b.appendChild(UI.el('small', {class:'trava', texto:'estudando agora'}));
        b.disabled = !!tv || atual;
        b.onclick = () => {
          if(escolher(x.id)){ aviso(`Estudo escolhido: ${x.nome}.`, true); pintarBotao(); pintarPagina(pg); }
        };
        c.corpo.appendChild(b);
      }
      grade.appendChild(c);
    }
    pg.appendChild(grade);
  }

  /* o ícone do menu: uma escada subindo, que é o que o desenvolvimento é */
  function registrar(){
    if(!TO.ui || !TO.ui.registrarPagina) return false;
    if(TO.icones && TO.icones.todos && !TO.icones.todos.desenvolvimento)
      TO.icones.todos.desenvolvimento = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+
        '<path d="M4 20h4v-4h4v-4h4V8h4"/><path d="M14 4h6v6"/><path d="m20 4-7 7"/></svg>';
    TO.ui.registrarPagina({id:'desenvolvimento', rot:'Desenvolvimento', ic:'desenvolvimento', antes:'jogo', pintar:pintarPagina});
    return true;
  }
  let salvarT = null;
  function salvarLeve(){ clearTimeout(salvarT); salvarT = setTimeout(() => { try{ ST().salvar && ST().salvar(); }catch(_){} }, 300); }

  /* -------------------------------------------------------
     A PARTIDA
     ------------------------------------------------------- */
  function iniciar(){
    if(!TO.estado || !TO.membros){ return setTimeout(iniciar, 300); }
    registrar();
    ligarEfeitos();
    ST().aoFecharSemana && ST().aoFecharSemana((fecho, E) => { try{ porSemana(E || Ev()); }catch(e){ console.warn('[desenv] semana', e); } });
    ST().aoMudar && ST().aoMudar(E => { try{ if(E && E.torcida){ porDia(E); pintarBotao(); } }catch(e){ console.warn('[desenv] dia', e); } });
    setInterval(() => { try{ const E = Ev(); if(E && E.torcida){ porDia(E); } pintarBotao(); }catch(e){ console.warn('[desenv]', e); } }, 1000);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();

  /* pra quem testa */
  TO.desenvolvimento = {AREAS, ESTUDOS, POR_ID, D, fontes, custo, trava, escolher, concluir: (id) => concluir(Ev(), POR_ID[id]),
                        porSemana, porMes, porDia, fincarBandeira, abrir: () => TO.ui && TO.ui.abrirPainel('desenvolvimento')};
})();
