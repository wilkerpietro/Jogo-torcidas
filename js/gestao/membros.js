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
    {membros:90,  diretoria:4,  treino:4},
    {membros:150, diretoria:6,  treino:8},
    {membros:200, diretoria:10, treino:12},
    {membros:500, diretoria:15, treino:20}
  ];

  /* ferido volta em 5 a 15 dias, sorteado na hora (decisão do dono,
     18/08/2026) — o 30 fixo do GDD §17.2 saiu */
  const FERIDO_MIN = 5, FERIDO_MAX = 15;

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

  /* nomes de cargo como a fonte da era Unity escreve */
  const DA_FONTE = {povao:'novato', componentes:'componente',
                    frente:'frente', diretoria:'diretoria'};

  /* A sede tem de caber a torcida que a fonte descreve — tanto o efetivo
     quanto a Diretoria. Sem isso o jogo abre já estourando o próprio teto. */
  function nivelQueCabe(membros, diretores){
    for(let i=1;i<SEDE.length;i++)
      if(SEDE[i].membros >= (membros||0) && SEDE[i].diretoria >= (diretores||0)) return i;
    return SEDE.length-1;
  }

  /* Quantos de cada cargo. Vem da fonte quando ela diz; a proporção do
     GDD §5.1 (50/30/15/5) só entra quando não há dado nenhum. */
  function planoDeCargos(total, cargos){
    const plano = [];
    if(cargos && Object.keys(cargos).length){
      for(const chave of ['diretoria','frente','componentes','povao']){
        const n = cargos[chave] || cargos[DA_FONTE[chave]] || 0;
        if(n > 0) plano.push([DA_FONTE[chave] || chave, n]);
      }
      const soma = plano.reduce((s,[,n])=>s+n, 0);
      /* a fonte arredonda os percentuais; a sobra engrossa os novatos */
      if(total > soma){
        const novatos = plano.find(p=>p[0]==='novato');
        if(novatos) novatos[1] += total - soma;
        else plano.push(['novato', total - soma]);
      }
      if(plano.length) return plano;
    }
    const p = [
      ['diretoria', Math.max(2, Math.round(total*0.05))],
      ['frente',    Math.round(total*0.15)],
      ['componente',Math.round(total*0.30)]
    ];
    p.push(['novato', Math.max(0, total - p[0][1] - p[1][1] - p[2][1])]);
    return p;
  }

  function povoarInicial(E, total, cargos){
    const plano = planoDeCargos(total || 34, cargos);
    /* torcida forte tem gente mais rodada — o `poder` da fonte é o que
       separa a Gaviões de uma organizada de interior */
    const peso = U.limitar((E.torcida.poder || 60)/250, 0, 1);
    const moralBase = Math.round(E.indicadores.moral);

    for(const [cargo, n] of plano){
      const c = CARGOS[cargo];
      for(let i=0;i<n;i++){
        const base = cargo==='novato' ? 1 : cargo==='componente' ? 5
                   : cargo==='frente' ? 10 : 14;
        const bonus = Math.round(peso*3);
        E.membros.push(criar(E, {
          cargo,
          forca:  Math.min(c.teto, base + U.inteiro(0,3) + bonus),
          defesa: Math.min(c.teto, base + U.inteiro(0,3) + bonus),
          moral:  U.limitar(moralBase + U.inteiro(-3,3), 1, 20),
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
  /* GDD §6.2: a campanha de recrutamento estica o teto da sede em 50%
     enquanto dura — agência pro jogador quando o gargalo é a estrutura */
  const emCampanha = E => !!(E.campanha && E.campanha.ate >= E.data.semana);
  const capacidade = E => Math.round(SEDE[E.torcida.sedeNivel].membros
                                     * (emCampanha(E) ? 1.5 : 1));
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

  /* Quanto falta pro teto do cargo. É o "plano de treinamento" do GDD
     §5.4 visto de perto: cada sessão rende de 0.0 a 0.3, então dá pra
     dizer quantas sessões faltam pra estourar o teto. */
  function planoDeTreino(m){
    const c = CARGOS[m.cargo];
    const teto = c.teto + (m.veterano?2:0);
    const faltaF = Math.max(0, teto - m.forca  - m.fracForca);
    const faltaD = Math.max(0, teto - m.defesa - m.fracDefesa);
    const falta  = Math.max(faltaF, faltaD);
    return {teto, faltaF, faltaD,
            /* 0,15 é o ganho médio por sessão */
            sessoes: falta ? Math.ceil(falta/0.15) : 0,
            noTeto: falta <= 0};
  }

  /* A fila se renova sozinha toda semana: quem manda no treino é a
     diretoria, não o jogador escolhendo nome por nome. Entra primeiro
     quem ainda tem o que ganhar, e o sorteio decide o resto. */
  function sortearFila(E){
    for(const m of E.membros) m.naFila = false;
    const podem = E.membros.filter(m=>disponivel(m) && !planoDeTreino(m).noTeto);
    const resto = E.membros.filter(m=>disponivel(m) && planoDeTreino(m).noTeto);
    const fila = U.embaralhar(podem).concat(U.embaralhar(resto))
                  .slice(0, capTreino(E));
    for(const m of fila) m.naFila = true;
    return fila.length;
  }

  /* -------------------------------------------------------
     BAIXAS — o retorno do dia de jogo
     ------------------------------------------------------- */
  /* O MOTIVO VEM DE QUEM CHAMOU.
     As duas funções escreviam "no dia de jogo" fixo no histórico, e isso
     era verdade enquanto ferido e preso só saíam da cena de sábado. Com
     esbarrão de rua e assalto numa terça qualquer, o texto fixo passou a
     mentir na ficha do sujeito. Sem motivo, o padrão continua sendo o
     dia de jogo, que é de onde vem a maioria. */
  function ferir(E, m, dias, motivo){
    if(m.ferido) return;
    const d = dias || U.inteiro(FERIDO_MIN, FERIDO_MAX);
    m.ferido = { dias:d };
    m.naFila = false;
    m.moral = Math.max(0, m.moral - 3);
    m.historico.push(`${motivo || 'Ferido no dia de jogo'}, ${d} dias fora`);
  }

  /* TODA PRISÃO TEM PRAZO. Na briga o teto segue 90 dias, sorteado na
     hora; pena EXPLÍCITA de quem chamou pode ir a 360 — é a régua dos
     assaltos do dono (banco = 360 dias). A tela mostra quantos dias
     faltam pra sair da cadeia. */
  const PENA_MAX = 90;
  const PENA_TETO = 360;
  function prender(E, m, dias, motivo){
    if(m.preso) return;
    const txt = motivo || 'Preso no dia de jogo';
    const pena = dias ? Math.min(PENA_TETO, dias)
                      : Math.min(PENA_MAX, U.inteiro(15, PENA_MAX));
    m.preso = { dias: pena, motivo: txt,
                desde: (E && E.data && E.data.absoluto) || 0 };
    m.naFila = false;
    m.moral = Math.max(0, m.moral - 4);
    m.historico.push(`${txt} — ${pena} dias`);
  }
  /* quantos dias faltam pra sair. Save antigo pode ter prisão sem
     prazo: ganha um na primeira leitura. */
  const diasPresos = m => {
    if(!m.preso) return null;
    if(typeof m.preso !== 'object') m.preso = {dias:PENA_MAX/2, motivo:'Preso'};
    if(m.preso.dias == null) m.preso.dias = Math.round(PENA_MAX/2);
    return m.preso.dias;
  };

  /* GDD §17.2: preso fica até resgate (dinheiro) ou soltura.
     Com pena de tabela a fiança acompanha o que falta cumprir: tirar
     alguém de uma pena de 60 dias por R$ 800 apagaria o preço do
     assalto, que é justamente o que a pena existe pra cobrar. */
  function fianca(m){
    const d = diasPresos(m) || 0;
    return Math.round((800 + m.xp * 2) * (1 + d/20));
  }

  function resgatar(E, m){
    if(!m.preso) return {ok:false, motivo:'não está preso'};
    const custo = fianca(m);
    if(E.dinheiro < custo) return {ok:false, motivo:`fiança de ${U.dinheiro(custo)}`};
    TO.estado.lancar(E, `Fiança de ${nomeDe(m)}`, -custo);
    m.preso = null;
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
      /* a pena desce um dia por dia; no zero ele sai sozinho */
      else if(m.preso){
        diasPresos(m);
        m.preso.dias--;
        if(m.preso.dias <= 0){
          m.preso = null;
          m.historico.push('Cumpriu a pena, de volta');
        }
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

    /* indicadores da torcida. O prestígio da noite fala na escala de
       0 a 100 (teto ±10, decisão do dono); o indicador vive em 0–20,
       então divide por 5 — e o limitador é o cinto de segurança.
       Os dois movimentos passam pelo livro, com motivo. */
    TO.estado.mexerIndicador(E, 'prestigio',
      U.limitar((res.prestigio||0)/5, -2, 2), 'Resultado da briga');
    TO.estado.mexerIndicador(E, 'moral',
      res.moralTorcida||0, 'Resultado da briga');

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
    CARGOS, ACIMA, SEDE, FERIDO_MIN, FERIDO_MAX, DA_FONTE,
    criar, nomeDe, povoarInicial, planoDeCargos, nivelQueCabe,
    disponivel, capacidade, capTreino, capDiretoria, contar, emCampanha,
    darXP, podePromover, promover, treinar, treinarFila,
    planoDeTreino, sortearFila,
    ferir, prender, diasPresos, fianca, resgatar, passarDia,
    aptosParaOEstadio, aplicarResultadoDaNoite
  };
})();
