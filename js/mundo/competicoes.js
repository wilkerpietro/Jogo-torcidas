/* =========================================================
   COMPETIÇÕES — temporada, tabelas e calendário (GDD §18)
   ---------------------------------------------------------
   O ano tem duas fases, nessa ordem (GDD §18.1): primeiro os
   regionais e estaduais, depois o Brasileirão das séries A a
   D. Uma rodada por semana, o que faz o calendário do jogo e
   o do futebol serem a mesma coisa.

   Nada aqui vem de arquivo novo: os 108 clubes de times.js já
   trazem `divisao` e `regional`, e é dali que saem as onze
   competições regionais e as quatro nacionais.
   ========================================================= */
window.TO = window.TO || {};

TO.competicoes = (function(){
  const U = TO.util;
  const M = () => TO.mundo;

  const SEMANAS_ANO      = 52;
  const INICIO_REGIONAL  = 1;    // janeiro
  const INICIO_NACIONAL  = 14;   // abril, como no GDD §18.1

  const PONTOS = {v:3, e:1, d:0};

  /* =======================================================
     SORTEIO DE TABELA
     Método do círculo: com número ímpar entra um fantasma e
     quem cair contra ele folga na rodada.
     ======================================================= */
  function roundRobin(clubes, voltas){
    const t = [...clubes];
    if(t.length % 2) t.push(null);
    const n = t.length, meia = n/2;
    const rodadas = [];
    for(let r=0; r<n-1; r++){
      const jogos = [];
      for(let i=0;i<meia;i++){
        const a = t[i], b = t[n-1-i];
        if(!a || !b) continue;
        /* alterna o mando pra ninguém jogar tudo em casa */
        jogos.push(r%2 ? {c:b, f:a} : {c:a, f:b});
      }
      rodadas.push(jogos);
      t.splice(1, 0, t.pop());     // gira, fixando o primeiro
    }
    if(voltas > 1){
      const ida = rodadas.map(j=>j.map(g=>({...g})));
      for(const jogos of ida)
        rodadas.push(jogos.map(g=>({c:g.f, f:g.c})));
    }
    return rodadas;
  }

  /* divide em grupos servindo em zigue-zague, pra não juntar
     os melhores todos no mesmo lado da chave */
  function dividirGrupos(clubes, quantos){
    const ordem = [...clubes].sort((a,b)=>qual(b)-qual(a));
    const g = Array.from({length:quantos}, ()=>[]);
    ordem.forEach((c,i)=>{
      const volta = Math.floor(i/quantos) % 2;
      const k = volta ? quantos-1-(i%quantos) : i%quantos;
      g[k].push(c);
    });
    return g;
  }

  const qual = id => (M().time(id)||{}).qualidade || 10;

  /* =======================================================
     RESULTADO
     Poisson com o gol esperado saindo da qualidade dos dois
     e do fator casa. Nada de sortear vencedor direto: placar
     de verdade dá empate, goleada e zebra na medida certa.
     ======================================================= */
  function poisson(lambda){
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= U.rng(); } while(p > L);
    return k-1;
  }

  function simular(casa, fora){
    const dif = (qual(casa) - qual(fora)) / 55;
    const lc = U.limitar(1.30 + 0.30 + dif*1.5, 0.25, 5);
    const lf = U.limitar(1.30 - 0.20 - dif*1.5, 0.20, 5);
    return [poisson(lc), poisson(lf)];
  }

  /* mata-mata empatado vai a pênaltis; quem é melhor leva
     vantagem, mas longe de garantia (GDD §18.3) */
  function penaltis(a, b){
    const p = qual(a) / (qual(a) + qual(b) || 1);
    return U.rng() < (0.5 + (p-0.5)*0.5) ? a : b;
  }

  /* =======================================================
     MONTAGEM DA TEMPORADA
     ======================================================= */
  /* O GDD §18.3 prevê grupo único ou dois grupos conforme o tamanho.
     Ida e volta em todos porque a janela do regional é de treze
     semanas: com turno único sobrariam sete semanas de folga seguidas,
     e semana sem jogo é a única em que a torcida não tem o que fazer. */
  function formatoRegional(n){
    if(n >= 12) return {grupos:4, passam:2, voltas:2};
    if(n >= 8)  return {grupos:2, passam:2, voltas:2};
    return {grupos:1, passam:4, voltas:2};
  }

  function criarCompeticao(id, nome, tipo, clubes, cfg, semanaInicio){
    const grupos = cfg.grupos > 1 ? dividirGrupos(clubes, cfg.grupos) : [clubes];
    const porGrupo = grupos.map(g=>roundRobin(g, cfg.voltas));
    const maior = Math.max(...porGrupo.map(r=>r.length));

    const rodadas = [];
    for(let r=0; r<maior; r++){
      const jogos = [];
      porGrupo.forEach((rr, ig)=>{
        for(const j of (rr[r]||[])) jogos.push({...j, g:ig});
      });
      rodadas.push({semana: semanaInicio + r, fase:'grupos', jogos});
    }
    return {
      id, nome, tipo,
      clubes, grupos: grupos.map(g=>[...g]),
      passam: cfg.passam, voltas: cfg.voltas,
      semanaInicio, rodadas, mata:[], campeao:null, vice:null,
      /* série com pontos corridos não tem mata-mata: campeão é o líder */
      pontosCorridos: !!cfg.pontosCorridos
    };
  }

  function montarTemporada(E){
    U.usarSemente((E.semente || 1) + (E.data.ano||2026));
    const T = M().todosTimes;
    const comps = [];

    /* ---- fase 1: regionais e estaduais (GDD §18.3 e §18.4) ---- */
    const porRegional = {};
    for(const t of T) (porRegional[t.regional] = porRegional[t.regional] || []).push(t.id);
    for(const nome of Object.keys(porRegional).sort()){
      const clubes = porRegional[nome];
      comps.push(criarCompeticao(U.identificador(nome), nome, 'regional',
        clubes, formatoRegional(clubes.length), INICIO_REGIONAL));
    }

    /* ---- fase 2: Brasileirão (GDD §18.2) ---- */
    const porDivisao = {};
    for(const t of T) (porDivisao[t.divisao] = porDivisao[t.divisao] || []).push(t.id);
    for(const nome of Object.keys(porDivisao).sort()){
      const clubes = porDivisao[nome];
      /* até 20 clubes é turno e returno; a D, com 48, vai em quatro
         grupos regionalizados com playoff, como manda o GDD */
      const cfg = clubes.length <= 20
        ? {grupos:1, passam:0, voltas:2, pontosCorridos:true}
        : {grupos:4, passam:4, voltas:2};
      comps.push(criarCompeticao(U.identificador(nome), nome, 'nacional',
        clubes, cfg, INICIO_NACIONAL));
    }

    return {
      ano: E.data.ano,
      competicoes: comps,
      /* histórico de campeões, pra tela de conquistas mais tarde */
      titulos: (E.temporada && E.temporada.titulos) || []
    };
  }

  /* =======================================================
     TABELA
     ======================================================= */
  function linhaVazia(id){
    return {id, j:0, v:0, e:0, d:0, gp:0, gc:0, sg:0, p:0};
  }

  function tabela(comp, grupo){
    const alvo = grupo===undefined ? null : grupo;
    const linhas = {};
    const lista = alvo===null ? comp.clubes : comp.grupos[alvo];
    for(const id of lista) linhas[id] = linhaVazia(id);

    for(const r of comp.rodadas){
      for(const j of r.jogos){
        if(j.gc===undefined || j.gc===null) continue;
        if(alvo!==null && j.g!==alvo) continue;
        const a = linhas[j.c], b = linhas[j.f];
        if(!a || !b) continue;
        a.j++; b.j++;
        a.gp+=j.gc; a.gc+=j.gf; b.gp+=j.gf; b.gc+=j.gc;
        if(j.gc>j.gf){ a.v++; b.d++; a.p+=PONTOS.v; }
        else if(j.gc<j.gf){ b.v++; a.d++; b.p+=PONTOS.v; }
        else { a.e++; b.e++; a.p+=PONTOS.e; b.p+=PONTOS.e; }
      }
    }
    const fora = Object.values(linhas);
    for(const l of fora) l.sg = l.gp - l.gc;
    const nome = id => (M().time(id)||{}).nome || id;
    fora.sort((a,b)=>{
      const d = (b.p-a.p) || (b.v-a.v) || (b.sg-a.sg) || (b.gp-a.gp);
      if(d) return d;
      return nome(a.id) < nome(b.id) ? -1 : 1;   /* último critério: ordem alfabética */
    });
    return fora;
  }

  /* =======================================================
     A SEMANA
     ======================================================= */
  function jogarSemana(E, semana){
    const S = E.temporada;
    if(!S) return [];
    const feitos = [];
    for(const comp of S.competicoes){
      for(const r of comp.rodadas){
        if(r.semana !== semana) continue;
        for(const j of r.jogos){
          if(j.gc !== undefined && j.gc !== null) continue;
          const [a,b] = simular(j.c, j.f);
          j.gc = a; j.gf = b;
          feitos.push({comp:comp.id, ...j});
        }
      }
      for(const m of comp.mata){
        if(m.semana !== semana) continue;
        for(const j of m.jogos){
          if(j.gc !== undefined && j.gc !== null) continue;
          const [a,b] = simular(j.c, j.f);
          j.gc = a; j.gf = b;
          j.venceu = a>b ? j.c : b>a ? j.f : penaltis(j.c, j.f);
          j.penaltis = a===b;
          feitos.push({comp:comp.id, ...j});
        }
      }
      avancarFase(comp, semana);
    }
    return feitos;
  }

  /* fecha grupos e gera a chave; depois vai encurtando até a final */
  function avancarFase(comp, semana){
    if(comp.campeao) return;

    const gruposAcabaram = comp.rodadas.every(r=>
      r.jogos.every(j=>j.gc!==undefined && j.gc!==null));
    if(!gruposAcabaram) return;

    if(comp.pontosCorridos){
      /* pontos corridos não tem final: o líder é o campeão */
      const t = tabela(comp, 0);
      comp.campeao = t[0] && t[0].id;
      comp.vice    = t[1] && t[1].id;
      return;
    }

    /* alguma chave ainda rodando? */
    const ultima = comp.mata[comp.mata.length-1];
    if(ultima && ultima.jogos.some(j=>j.gc===undefined || j.gc===null)) return;

    let vivos;
    if(!ultima){
      vivos = [];
      comp.grupos.forEach((g, ig)=>{
        const t = tabela(comp, ig);
        vivos.push(...t.slice(0, comp.passam).map(l=>l.id));
      });
    }else{
      vivos = ultima.jogos.map(j=>j.venceu);
      if(vivos.length === 1){
        comp.campeao = vivos[0];
        const f = ultima.jogos[0];
        comp.vice = f.venceu===f.c ? f.f : f.c;
        return;
      }
    }
    if(vivos.length < 2) { comp.campeao = vivos[0] || null; return; }

    const NOMES = {2:'Final', 4:'Semifinal', 8:'Quartas', 16:'Oitavas', 32:'Primeira fase'};
    const jogos = [];
    /* melhor contra pior, o clássico chaveamento de copa */
    const ordem = [...vivos].sort((a,b)=>qual(b)-qual(a));
    for(let i=0;i<ordem.length/2;i++)
      jogos.push({c:ordem[i], f:ordem[ordem.length-1-i]});
    comp.mata.push({fase: NOMES[vivos.length] || `${vivos.length} clubes`,
                    semana: semana+1, jogos});
  }

  /* =======================================================
     CONSULTA
     ======================================================= */
  const temJogo = j => j && j.gc!==undefined && j.gc!==null;

  /* todos os compromissos de um clube no ano, em ordem de semana */
  function agendaDoClube(E, clubeId){
    const S = E.temporada;
    if(!S) return [];
    const fora = [];
    for(const comp of S.competicoes){
      const junta = (r, fase, mata)=>{
        for(const j of r.jogos){
          if(j.c!==clubeId && j.f!==clubeId) continue;
          const casa = j.c===clubeId;
          fora.push({semana:r.semana, comp:comp.nome, compId:comp.id,
                     tipo:comp.tipo, fase, mata:!!mata,
                     casa, adversario: casa ? j.f : j.c,
                     gp: temJogo(j) ? (casa?j.gc:j.gf) : null,
                     gc: temJogo(j) ? (casa?j.gf:j.gc) : null,
                     jogado: temJogo(j), penaltis: !!j.penaltis,
                     venceu: j.venceu});
        }
      };
      comp.rodadas.forEach((r, i)=> junta(r,
        comp.pontosCorridos ? `${i+1}ª rodada` : `Grupos · ${i+1}ª rodada`, false));
      for(const m of comp.mata) junta(m, m.fase, true);
    }
    return fora.sort((a,b)=>a.semana-b.semana);
  }

  function jogoDaSemana(E, clubeId, semana){
    return agendaDoClube(E, clubeId).find(j=>j.semana===semana) || null;
  }

  /* competições rolando nesta semana, pra tela de calendário */
  function faseDaSemana(semana){
    return semana < INICIO_NACIONAL ? 'Regionais e estaduais' : 'Brasileirão';
  }

  return {montarTemporada, jogarSemana, tabela, agendaDoClube, jogoDaSemana,
          faseDaSemana, roundRobin, simular,
          SEMANAS_ANO, INICIO_REGIONAL, INICIO_NACIONAL};
})();
