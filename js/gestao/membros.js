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

  /* =======================================================
     O QUE TIRA FICHA (régua do dono, 20/08/2026)

     Até aqui a ficha era catraca de mão única: treino somava e
     nada nunca subtraía. Agora a rua cobra — sequela de briga,
     ferrugem de cadeia, paz demais e idade.

     TUDO PASSA POR `perder`, que desconta primeiro da fração
     acumulada e só depois morde o inteiro. Sem isso um −0,3
     sumia no arredondamento e a régua do dono não valia nada.
     ======================================================= */
  const IDADE_MIN = 16, IDADE_MAX = 45;
  const IDADE_DECLINIO = 35;      // daqui em diante o ano cobra
  const IDADE_SAIDA    = 46;      // aqui ele pendura a bandeira
  const DESGASTE_ANO   = 0.6;     // por virada de ano, dos 35 em diante
  /* O DESCONTO DE FICHA CAIU PRA 30% (régua do dono, 24/08/2026):
     ferido e preso seguem saindo de cena e pagando moral, mas a marca
     na força e na defesa vale 30% do que valia — a sequela foi de
     0,2–0,5 pra 0,06–0,15 e a tabela da cadeia de 0,5/1/1,5/2 pra
     0,15/0,3/0,45/0,6. O espelho das IAs (relacoes.js) foi junto. */
  const SEQUELA = {chance:0.15, min:0.06, max:0.15};
  /* a cadeia enferruja pela pena cumprida (tabela do dono, a 30%) */
  const CADEIA = [{ate:30, perda:0.15}, {ate:60, perda:0.3},
                  {ate:89, perda:0.45}, {ate:Infinity, perda:0.6}];
  const perdaDaCadeia = dias => (CADEIA.find(f => dias <= f.ate) || CADEIA[0]).perda;

  /* =======================================================
     DESGASTE PERMANENTE × FERRUGEM

     Aqui mora a diferença que faz as quatro cobranças valerem
     alguma coisa. Quem está no teto do cargo — e depois de
     alguns anos é quase todo mundo — recuperava no treino
     seguinte tudo o que a rua tinha tirado: perdia 0,6 de
     idade na virada do ano e no dia seguinte o treino devolvia.

     Então há duas naturezas de perda:
     · SEQUELA e IDADE derrubam o TETO da pessoa (`m.desgaste`).
       Não voltam com treino nenhum — é o joelho que não é mais
       o mesmo, é a perna que não corre mais.
     · CADEIA e FERRUGEM DA PAZ derrubam só a ficha de agora.
       Voltam treinando, e é isso que elas querem dizer: o cara
       está destreinado, não está acabado.
     ======================================================= */
  const tetoDe = m => Math.max(1,
    CARGOS[m.cargo].teto + (m.veterano?2:0) - (m.desgaste || 0));

  /* põe o atributo exatamente no teto quando ele passou dele */
  function limitarNoTeto(m, campo, frac, teto){
    if(m[campo] + (m[frac]||0) <= teto) return;
    m[campo] = Math.floor(teto);
    m[frac]  = Math.round((teto - m[campo])*1000)/1000;
  }

  /* tira `quanto` de um atributo, fração primeiro, inteiro depois.
     Nunca desce de 1: ninguém fica com ficha zerada. */
  function perderDe(m, campo, frac, quanto){
    let resta = quanto;
    const tinha = m[frac] || 0;
    const daFracao = Math.min(tinha, resta);
    m[frac] = tinha - daFracao;
    resta -= daFracao;
    while(resta > 0 && m[campo] > 1){
      m[campo]--;
      m[frac] = (m[frac] || 0) + 1;
      const leva = Math.min(m[frac], resta);
      m[frac] -= leva;
      resta -= leva;
    }
    return quanto - resta;
  }
  /* desconta dos dois atributos e devolve o que saiu, arredondado
     pro texto do histórico */
  function perder(m, quanto, permanente){
    /* o teto desce junto, e SÓ ISSO: a subtração da ficha logo abaixo
       já leva quem estava no teto pro teto novo. Baixar o teto e ainda
       cortar a ficha nele cobraria a mesma perda duas vezes. */
    if(permanente) m.desgaste = (m.desgaste || 0) + quanto;
    const f = perderDe(m, 'forca',  'fracForca',  quanto);
    const d = perderDe(m, 'defesa', 'fracDefesa', quanto);
    return {forca:Math.round(f*10)/10, defesa:Math.round(d*10)/10};
  }

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
  /* O BANCO DE NOMES SEGUE O PAÍS DA TORCIDA (pedido do dono,
     23/08/2026). Quem comanda uma barra recruta gente de lá: o membro
     sai do banco hispano-americano — 200 nomes, 200 sobrenomes e 150
     apelidos —, e não do brasileiro. O apelido continua sendo o nome de
     rua que aparece na lista e na briga; nome e sobrenome ficam na
     ficha. Torcida brasileira não muda nada. */
  function bancoDe(E){
    const N = TO.dados.nomes;
    const meu = E && E.torcida && E.torcida.clubeId;
    const t = meu && TO.mundo ? TO.mundo.time(meu) : null;
    const pais = (t && t.pais) || 'Brasil';
    return (pais !== 'Brasil' && N.hispano) ? N.hispano : N;
  }

  function criar(E, opc){
    opc = opc || {};
    const N = TO.dados.nomes;
    const B = bancoDe(E);
    const cargo = opc.cargo || 'novato';
    const m = {
      id: E.proximoId++,
      apelido: opc.apelido || U.escolher(B.apelidos),
      sobrenome: U.escolher(B.sobrenomes),
      /* nome de batismo: o banco de fora tem; o brasileiro não tinha
         lista de primeiro nome de membro, então lá ele fica vazio e a
         ficha não mostra a linha */
      nome: B.nomes ? U.escolher(B.nomes) : '',
      cargo,
      forca:  opc.forca  !== undefined ? opc.forca  : U.inteiro(1,3),
      defesa: opc.defesa !== undefined ? opc.defesa : U.inteiro(1,3),
      fracForca:0, fracDefesa:0,
      /* IDADE (régua do dono, 20/08/2026): 16 a 45 na entrada. Dos 35
         em diante a virada do ano cobra o seu; aos 46 ele pendura a
         bandeira e vai pra Velha Guarda. */
      idade: opc.idade !== undefined ? opc.idade : U.inteiro(IDADE_MIN, IDADE_MAX),
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

  /* o nome de batismo, pra ficha: "Adrián González". Sem primeiro nome
     (é o caso do banco brasileiro) devolve vazio, e a linha não aparece. */
  function nomeCompletoDe(m){
    return m && m.nome ? `${m.nome} ${m.sobrenome}` : '';
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
    /* SEM BÔNUS DE PODER (decisão do dono, 18/08/2026): a ficha inicial
       sai só do cargo, a mesma régua das IAs — o que separa a Gaviões
       de uma organizada de interior é o tamanho e a pirâmide, não um
       +3 de berço em cada membro. */
    const moralBase = Math.round(E.indicadores.moral);

    for(const [cargo, n] of plano){
      const c = CARGOS[cargo];
      for(let i=0;i<n;i++){
        const base = cargo==='novato' ? 1 : cargo==='componente' ? 5
                   : cargo==='frente' ? 10 : 14;
        E.membros.push(criar(E, {
          cargo,
          forca:  Math.min(c.teto, base + U.inteiro(0,3)),
          defesa: Math.min(c.teto, base + U.inteiro(0,3)),
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
    const teto = tetoDe(m);
    /* A COMISSÃO TÉCNICA (dono, 18/08/2026; escada em 20/08/2026):
       um professor faz o treino render +30%, dois +60%, três +100% —
       o dobro só com a sala cheia. */
    const ganho = E && TO.financeiro ? TO.financeiro.ganhoDoTreino(E) : 1;
    m.fracForca  += U.entre(0, 0.3) * ganho;
    m.fracDefesa += U.entre(0, 0.3) * ganho;
    while(m.fracForca >= 1 && m.forca < teto){ m.fracForca -= 1; m.forca++; }
    while(m.fracDefesa >= 1 && m.defesa < teto){ m.fracDefesa -= 1; m.defesa++; }
    /* O TETO PODE SER QUEBRADO: sequela e idade tiram 0,5, 0,6 — o
       teto de quem se machucou não é inteiro. Encostar nele é parar
       nele exatamente, e não pular pro inteiro de cima. */
    limitarNoTeto(m, 'forca',  'fracForca',  teto);
    limitarNoTeto(m, 'defesa', 'fracDefesa', teto);
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
    /* o teto é o DELE: sequela e idade já podem ter derrubado */
    const teto = tetoDe(m);
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
    /* SEQUELA (régua do dono, 20/08/2026): parte das lesões deixa
       marca — pouca coisa por vez, mas não volta nunca. */
    if(U.rng() < SEQUELA.chance){
      const q = U.entre(SEQUELA.min, SEQUELA.max);
      const saiu = perder(m, q, true);        // sequela não volta no treino
      m.sequelas = (m.sequelas || 0) + 1;
      m.historico.push(`Ficou a sequela: −${saiu.forca.toFixed(1).replace('.',',')} `+
                       `de força e defesa`);
      return {sequela: saiu};
    }
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
    m.preso = { dias: pena, total: pena, motivo: txt,
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

  /* quantos dias ele CUMPRIU até agora — é o que a ferrugem cobra,
     não a pena que o juiz deu: sair no terceiro dia com fiança não
     enferruja como cumprir noventa. */
  function cumpridos(m){
    if(!m.preso) return 0;
    const total = m.preso.total != null ? m.preso.total : m.preso.dias;
    return Math.max(0, total - (m.preso.dias || 0));
  }
  /* A CADEIA ENFERRUJA (tabela do dono, 20/08/2026): até 30 dias
     cobra 0,5; até 60, 1; até 89, 1,5; de 90 em diante, 2. */
  function enferrujarNaCadeia(m, dias){
    if(!dias) return null;
    const saiu = perder(m, perdaDaCadeia(dias));
    m.historico.push(`Voltou enferrujado da cadeia (${dias} dias): `+
                     `−${saiu.forca.toFixed(1).replace('.',',')} de força e defesa`);
    return saiu;
  }

  function resgatar(E, m){
    if(!m.preso) return {ok:false, motivo:'não está preso'};
    const custo = fianca(m);
    if(E.dinheiro < custo) return {ok:false, motivo:`fiança de ${U.dinheiro(custo)}`};
    TO.estado.lancar(E, `Fiança de ${nomeDe(m)}`, -custo);
    const cumpriu = cumpridos(m);
    m.preso = null;
    m.historico.push('Solto sob fiança');
    enferrujarNaCadeia(m, cumpriu);
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
          const cumpriu = cumpridos(m);
          m.preso = null;
          m.historico.push('Cumpriu a pena, de volta');
          enferrujarNaCadeia(m, cumpriu);
        }
      }
    }
  }

  /* =======================================================
     A VIRADA DO ANO: TODO MUNDO FAZ ANIVERSÁRIO
     (régua do dono, 20/08/2026)

     Dos 35 em diante o ano cobra 0,6 de força e de defesa. Aos
     46 o sujeito pendura a bandeira: sai da lista de membros e
     vira VELHA GUARDA — não briga mais, não paga mensalidade,
     não conta pro ranking, mas fica registrado com o que fez.

     É este o ralo que faltava. Sem ele a torcida era um
     acumulador de mão única e, em vinte anos, todo mundo
     encostava no teto do cargo.
     ======================================================= */
  function envelhecer(E){
    const ficam = [], penduraram = [];
    for(const m of E.membros){
      m.idade = (m.idade != null ? m.idade : U.inteiro(IDADE_MIN, IDADE_MAX)) + 1;
      if(m.idade >= IDADE_SAIDA){ penduraram.push(m); continue; }
      if(m.idade >= IDADE_DECLINIO){
        const saiu = perder(m, DESGASTE_ANO, true);   // idade não volta
        if(saiu.forca > 0)
          m.historico.push(`${m.idade} anos: −${saiu.forca.toFixed(1).replace('.',',')} `+
                           `de força e defesa`);
      }
      ficam.push(m);
    }
    if(!penduraram.length) return {penduraram:[]};
    E.membros = ficam;
    E.velhaGuarda = E.velhaGuarda || [];
    for(const m of penduraram){
      m.historico.push(`Pendurou a bandeira aos ${m.idade} anos`);
      /* na cadeia ou no hospital não se pendura bandeira: sai limpo */
      m.ferido = null; m.preso = null; m.naFila = false;
      E.velhaGuarda.unshift({
        id:m.id, apelido:m.apelido, sobrenome:m.sobrenome, nome:m.nome||'',
        cargo:m.cargo,
        idade:m.idade, forca:m.forca, defesa:m.defesa, xp:m.xp,
        veterano:!!m.veterano, sequelas:m.sequelas || 0,
        arquetipo:m.arquetipo, historico:m.historico,
        ano:(E.data||{}).ano, entrou:m.entrou});
    }
    if(E.velhaGuarda.length > 400) E.velhaGuarda.length = 400;
    return {penduraram};
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
    criar, nomeDe, nomeCompletoDe, bancoDe, povoarInicial, planoDeCargos, nivelQueCabe,
    disponivel, capacidade, capTreino, capDiretoria, contar, emCampanha,
    darXP, podePromover, promover, treinar, treinarFila,
    perder, tetoDe, envelhecer, enferrujarNaCadeia, perdaDaCadeia,
    IDADE_MIN, IDADE_MAX, IDADE_DECLINIO, IDADE_SAIDA, DESGASTE_ANO, SEQUELA,
    planoDeTreino, sortearFila,
    ferir, prender, diasPresos, fianca, resgatar, passarDia,
    aptosParaOEstadio, aplicarResultadoDaNoite
  };
})();
