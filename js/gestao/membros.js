/* =========================================================
   MEMBROS — hierarquia, XP, treino, promoção, baixas
   GDD §5. Este é o módulo que a costura com o dia de jogo usa:
   é daqui que saem os discos, e é aqui que as baixas voltam.
   ========================================================= */
window.TO = window.TO || {};

TO.membros = (function(){
  const U = TO.util;

  /* GDD §5.1 e §5.2 */
  const CARGOS = {
    novato:     {nome:'Novato',          teto:8,  mensalidade:20,  ordem:0,
                 xpPromo:40,  forcaPromo:8,  custoPromo:0},
    componente: {nome:'Componente',      teto:12, mensalidade:50,  ordem:1,
                 xpPromo:100, forcaPromo:12, custoPromo:1000},
    frente:     {nome:'Linha de Frente', teto:18, mensalidade:100, ordem:2,
                 xpPromo:300, forcaPromo:18, custoPromo:5000},
    diretoria:  {nome:'Diretoria',       teto:20, mensalidade:100, ordem:3,
                 xpPromo:null}
  };
  const ACIMA = {novato:'componente', componente:'frente', frente:'diretoria'};

  /* GDD §8.1 — limites por nível de sede */
  const SEDE = [
    null,
    {membros:50,  diretoria:2,  treino:2},
    {membros:100, diretoria:4,  treino:4},
    {membros:150, diretoria:6,  treino:8},
    {membros:200, diretoria:10, treino:12},
    {membros:500, diretoria:15, treino:20}
  ];

  const DIAS_FERIDO = 30;   // GDD §17.2

  /* -------------------------------------------------------
     CRIAÇÃO
     ------------------------------------------------------- */
  function criar(E, opc){
    opc = opc || {};
    const N = TO.dados.nomes;
    const cargo = opc.cargo || 'novato';
    const m = {
      id: E.proximoId++,
      apelido: opc.apelido || U.escolher(N.apelidos),
      sobrenome: U.escolher(N.sobrenomes),
      cargo,
      forca:  opc.forca  !== undefined ? opc.forca  : U.inteiro(1,3),
      defesa: opc.defesa !== undefined ? opc.defesa : U.inteiro(1,3),
      fracForca:0, fracDefesa:0,
      xp: opc.xp || 0,
      moral: opc.moral !== undefined ? opc.moral : 15,
      arquetipo: (opc.arquetipo || U.escolher(N.arquetipos)).id
                 || U.escolher(N.arquetipos).id,
      veterano:false,
      ferido:null,        // {ate:{semana,dia}} enquanto está fora
      preso:false,
      olheiro:false,
      naFila:false,       // fila de treino
      entrou:{semana:E.data.semana, dia:E.data.dia},
      historico:[]
    };
    return m;
  }

  /* Nome de tela. Só a Diretoria usa sobrenome — dá ar de liderança
     sem custo nenhum (GDD §5.1). */
  function nomeDe(m){
    return m.cargo==='diretoria' ? `${m.apelido} ${m.sobrenome}` : m.apelido;
  }

  function povoarInicial(E, total){
    /* proporção do GDD §5.1: 50 / 30 / 15 / 5, mínimo 2 na Diretoria */
    const plano = [
      ['diretoria', Math.max(2, Math.round(total*0.05))],
      ['frente',    Math.round(total*0.15)],
      ['componente',Math.round(total*0.30)],
      ['novato',    0]
    ];
    plano[3][1] = Math.max(0, total - plano[0][1] - plano[1][1] - plano[2][1]);

    for(const [cargo, n] of plano){
      const c = CARGOS[cargo];
      for(let i=0;i<n;i++){
        const base = cargo==='novato' ? 1 : cargo==='componente' ? 5
                   : cargo==='frente' ? 10 : 14;
        E.membros.push(criar(E, {
          cargo,
          forca:  Math.min(c.teto, base + U.inteiro(0,3)),
          defesa: Math.min(c.teto, base + U.inteiro(0,3)),
          xp: cargo==='novato' ? U.inteiro(0,30)
            : cargo==='componente' ? U.inteiro(40,95)
            : cargo==='frente' ? U.inteiro(100,290) : U.inteiro(300,500)
        }));
      }
    }
  }

  /* -------------------------------------------------------
     CONSULTA
     ------------------------------------------------------- */
  const disponivel = m => !m.ferido && !m.preso;
  const capacidade = E => SEDE[E.torcida.sedeNivel].membros;
  const capTreino  = E => SEDE[E.torcida.sedeNivel].treino;
  const capDiretoria = E => SEDE[E.torcida.sedeNivel].diretoria;

  function contar(E){
    const c = {total:E.membros.length, feridos:0, presos:0, aptos:0};
    for(const cg of Object.keys(CARGOS)) c[cg]=0;
    for(const m of E.membros){
      c[m.cargo]++;
      if(m.ferido) c.feridos++;
      else if(m.preso) c.presos++;
      else c.aptos++;
    }
    return c;
  }

  /* -------------------------------------------------------
     PROGRESSÃO
     ------------------------------------------------------- */
  function darXP(m, xp){
    m.xp += xp;
  }

  function podePromover(E, m){
    const acima = ACIMA[m.cargo];
    if(!acima) return {ok:false, motivo:'já é Diretoria'};
    const c = CARGOS[m.cargo];
    if(m.xp < c.xpPromo) return {ok:false, motivo:`precisa de ${c.xpPromo} XP`};
    if(m.forca < c.forcaPromo || m.defesa < c.forcaPromo)
      return {ok:false, motivo:`precisa de ${c.forcaPromo} de Força e Defesa`};
    if(E.dinheiro < c.custoPromo)
      return {ok:false, motivo:`custa ${U.dinheiro(c.custoPromo)}`};
    if(acima==='diretoria'){
      const n = E.membros.filter(x=>x.cargo==='diretoria').length;
      if(n >= capDiretoria(E)) return {ok:false, motivo:'Diretoria lotada', veterano:true};
    }
    return {ok:true, custo:c.custoPromo, para:acima};
  }

  function promover(E, m){
    const r = podePromover(E, m);
    if(!r.ok){
      /* GDD §5.2: 300 XP sem vaga na Diretoria vira Veterano.
         Sem isso, em cinco temporadas a torcida teria 50 diretores. */
      if(r.veterano && !m.veterano){
        m.veterano = true;
        m.forca += 2; m.defesa += 2;
        m.historico.push('Virou Veterano: sem vaga na Diretoria, +2/+2');
        return {ok:true, veterano:true};
      }
      return r;
    }
    if(r.custo) TO.estado.lancar(E, `Promoção de ${nomeDe(m)}`, -r.custo);
    m.cargo = r.para;
    m.historico.push(`Promovido a ${CARGOS[r.para].nome}`);
    return {ok:true, para:r.para};
  }

  /* GDD §5.4: ganho fracionário de 0.0 a 0.3 por sessão.
     O atributo só sobe de inteiro quando a fração acumula. */
  function treinar(E, m){
    if(!disponivel(m)) return false;
    const c = CARGOS[m.cargo];
    const teto = c.teto + (m.veterano?2:0);
    m.fracForca  += U.entre(0, 0.3);
    m.fracDefesa += U.entre(0, 0.3);
    while(m.fracForca >= 1 && m.forca < teto){ m.fracForca -= 1; m.forca++; }
    while(m.fracDefesa >= 1 && m.defesa < teto){ m.fracDefesa -= 1; m.defesa++; }
    if(m.forca >= teto) m.fracForca = 0;
    if(m.defesa >= teto) m.fracDefesa = 0;
    darXP(m, 1);
    return true;
  }

  function treinarFila(E){
    const fila = E.membros.filter(m=>m.naFila && disponivel(m)).slice(0, capTreino(E));
    for(const m of fila) treinar(E, m);
    return fila.length;
  }

  /* -------------------------------------------------------
     BAIXAS — o retorno do dia de jogo
     ------------------------------------------------------- */
  function ferir(E, m, dias){
    if(m.ferido) return;
    const d = dias || DIAS_FERIDO;
    m.ferido = { dias:d };
    m.naFila = false;
    m.moral = Math.max(0, m.moral - 3);
    m.historico.push(`Ferido no dia de jogo, ${d} dias fora`);
  }

  function prender(E, m){
    if(m.preso) return;
    m.preso = true;
    m.naFila = false;
    m.moral = Math.max(0, m.moral - 4);
    m.historico.push('Preso no dia de jogo');
  }

  /* GDD §17.2: preso fica até resgate (dinheiro) ou soltura */
  function fianca(m){ return 800 + m.xp * 2; }

  function resgatar(E, m){
    if(!m.preso) return {ok:false, motivo:'não está preso'};
    const custo = fianca(m);
    if(E.dinheiro < custo) return {ok:false, motivo:`fiança de ${U.dinheiro(custo)}`};
    TO.estado.lancar(E, `Fiança de ${nomeDe(m)}`, -custo);
    m.preso = false;
    m.historico.push('Solto sob fiança');
    return {ok:true, custo};
  }

  function passarDia(E){
    for(const m of E.membros){
      if(m.ferido){
        m.ferido.dias--;
        if(m.ferido.dias <= 0){
          m.ferido = null;
          m.historico.push('Recuperado, de volta');
        }
      }
      /* preso pode ser solto sozinho, devagar — senão o jogador é
         obrigado a pagar fiança sempre e a prisão vira só imposto */
      else if(m.preso && U.rng() < 0.03){
        m.preso = false;
        m.historico.push('Solto pela justiça');
      }
    }
  }

  /* -------------------------------------------------------
     A COSTURA
     Quem está apto a sair, e o que volta depois.
     ------------------------------------------------------- */
  function aptosParaOEstadio(E){
    return E.membros.filter(disponivel);
  }

  /* Recebe o resultado da cena e devolve o resumo do que mudou.
     É aqui que disco vira ficha vermelha de novo (GDD §17.2). */
  function aplicarResultadoDaNoite(E, res){
    const porId = new Map(E.membros.map(m=>[m.id,m]));
    const resumo = {feridos:[], presos:[], entraram:[], xpTotal:0};

    for(const r of res.membros){
      const m = porId.get(r.id);
      if(!m) continue;
      if(r.preso){ prender(E, m); resumo.presos.push(m); }
      else if(r.caido){ ferir(E, m); resumo.feridos.push(m); }
      else if(r.entrou){ resumo.entraram.push(m); }

      darXP(m, r.xp || 0);
      resumo.xpTotal += r.xp || 0;
      m.moral = U.limitar(m.moral + (r.moral||0), 0, 20);
    }

    /* indicadores da torcida */
    const I = E.indicadores;
    I.prestigio = U.limitar(I.prestigio + (res.prestigio||0)/6, 0, 20);
    I.moral     = U.limitar(I.moral + (res.moralTorcida||0), 0, 20);
    if(res.rompido) I.policia = U.limitar(I.policia - 2, 0, 20);
    if(resumo.presos.length) I.policia = U.limitar(I.policia - 1, 0, 20);

    E.historicoNoites.unshift({
      semana:E.data.semana,
      prestigio:res.prestigio,
      feridos:resumo.feridos.length,
      presos:resumo.presos.length,
      entraram:resumo.entraram.length
    });
    return resumo;
  }

  return {
    CARGOS, ACIMA, SEDE, DIAS_FERIDO,
    criar, nomeDe, povoarInicial,
    disponivel, capacidade, capTreino, capDiretoria, contar,
    darXP, podePromover, promover, treinar, treinarFila,
    ferir, prender, fianca, resgatar, passarDia,
    aptosParaOEstadio, aplicarResultadoDaNoite
  };
})();
