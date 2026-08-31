/* =========================================================
   FEED — o esqueleto do jogo, e nada além dele
   ---------------------------------------------------------
   Reescrito do zero. Este feed carrega SOMENTE as mensagens
   do fluxo-base definido pelo dono do jogo:

   · o OLHEIRO, que nunca falha, nas três situações — (1)
     mandantes contra rival, (2) outro jogo com rival na
     cidade, (3) visitantes contra clube de torcida rival —
     sempre com estimativa de efetivo e as opções de ataque;
   · a convocação de IR PRA GUERRA no dia do ataque marcado;
   · o ataque-surpresa SOFRIDO (bar/loja em dia comum,
     concentração em casa, pista a caminho do jogo, estrada
     na caravana);
   · o RESULTADO de todo confronto, com feridos de cada lado
     e quem saiu vencedor;
   · o PLACAR do nosso jogo na noite dele;
   · o RESUMO dos jogos do dia, nossa cidade primeiro, com o
     caminho pra Ver Competições;
   · a briga da ESCOLTA: aliado hospedado/escoltado atacado
     na nossa cidade.

   NENHUMA outra notícia entra aqui sem passar pelo crivo do
   dono. Toda notícia colateral futura é aditiva e jamais
   atrasa, substitui ou se sobrepõe a estas.

   O RITMO: cada mensagem dropada segura a próxima por 1,5s
   (quem cronometra é a casca em main.js — aqui mora a fila).
   Decisão sem resposta trava o relógio do jogo.
   ========================================================= */
window.TO = window.TO || {};

TO.feed = (function(){
  const U = TO.util;
  const M  = () => TO.mundo;
  const PL = () => TO.planejamento;

  const INTERVALO_DROP = 1500;      // ms entre uma mensagem e a próxima
  /* o corte da provocação do rival, na régua de 0 a 100 do dono:
     abaixo disso a briga foi pequena demais pra render recado */
  const PROVOCA_REGUA = 3.5;

  /* -------------------------------------------------------
     A CAIXA DE MENSAGENS
     `E.feed` é o histórico (a mais nova primeiro); `E.feedFila`
     é o que já nasceu e ainda não caiu na tela.
     ------------------------------------------------------- */
  function caixas(E){
    if(!Array.isArray(E.feed)) E.feed = [];
    if(!Array.isArray(E.feedFila)) E.feedFila = [];
    E.feedSeq = E.feedSeq || 1;
    return E;
  }

  const horaDe = (E, chave) => {
    const h = TO.mapa.hash(`${E.data.absoluto}|${chave}`);
    return `${String(8 + h % 15).padStart(2,'0')}:${String(h % 60).padStart(2,'0')}`;
  };

  /* põe uma mensagem na fila. `msg`: {kind, peso:'info'|'decisao',
     texto, tipo, voz, botoes, links, efeitos, dados} */
  /* =======================================================
     O BOTÃO DE SIMULAR (pedido do dono, 23/08/2026)

     "Um botão de simular em todas as ações de confronto." Em vez de
     escrever o gêmeo à mão em cada mensagem — e esquecer de um —, ele
     nasce aqui, na porta por onde TODA mensagem entra: achou botão que
     abre cena de briga, entra o par dele. Mensagem nova de confronto
     já ganha o Simular sem ninguém lembrar.

     Ficam de fora as que NÃO SÃO a briga, e sim o plano dela:
     `tela-caravana` é a viagem inteira e `tela-ataque` é a emboscada
     marcada pro dia do jogo. Nas duas o confronto nasce lá na frente, e
     um Simular apertado aqui ficaria de pé esperando — na melhor das
     hipóteses simulando a briga errada. Quem pergunta nessas é a
     própria cena, na hora em que ela vai abrir.
     ======================================================= */
  const ACOES_DE_BRIGA = new Set([
    'cena-guerra', 'cena-defesa', 'cena-escolta', 'cena-treta',
    'atacar-bar-rival'
  ]);

  function comSimular(botoes){
    if(!botoes || !botoes.length) return botoes;
    const fora = [];
    for(const b of botoes){
      fora.push(b);
      if(!ACOES_DE_BRIGA.has(b.acao) || b.simular) continue;
      fora.push(Object.assign({}, b, {
        id: b.id + '-sim', rot: 'Simular', simular: true,
        /* a dica diz o que muda e o que não muda */
        dica: 'Roda o duelo sem abrir a cena. As consequências são as mesmas.'
      }));
    }
    return fora;
  }

  function propor(E, msg){
    caixas(E);
    if(msg && msg.botoes) msg = Object.assign({}, msg,
                                              {botoes: comSimular(msg.botoes)});
    const m = Object.assign({
      id: E.feedSeq++,
      quando: {ano:E.data.ano, semana:E.data.semana, dia:E.data.dia,
               abs:E.data.absoluto||0},
      hora: horaDe(E, msg.kind || 'msg'),
      peso: 'info', tipo:'', botoes:null, links:null,
      respondido:null
    }, msg);
    /* nunca a mesma chave duas vezes */
    if(m.chave && (E.feed.some(x=>x.chave===m.chave) ||
                   E.feedFila.some(x=>x.chave===m.chave))) return null;
    E.feedFila.push(m);
    return m;
  }

  /* a casca chama num timer: move UMA mensagem da fila pro feed */
  function dropar(E){
    caixas(E);
    if(travado(E)) return null;
    const m = E.feedFila.shift();
    if(!m) return null;
    E.feed.unshift(m);
    return m;
  }
  const pendentes = E => (caixas(E), E.feedFila.length);

  /* decisão dropada e sem resposta = tempo parado */
  function travado(E){
    caixas(E);
    return E.feed.some(m => m.peso === 'decisao' && !m.respondido);
  }
  const decisaoAberta = E =>
    (caixas(E), E.feed.find(m => m.peso === 'decisao' && !m.respondido) || null);

  /* -------------------------------------------------------
     A LINHA DE CONSEQUÊNCIA — sai dos efeitos aplicados,
     nunca do texto.
     ------------------------------------------------------- */
  const NOME_IND = {relacao:'Relação', moral:'Moral', prestigio:'Prestígio',
                    dinheiro:'Caixa', efetivo:'Efetivo', bombas:'Bombas'};
  function linhaDeConsequencia(efeitos){
    if(!efeitos || !efeitos.length) return '';
    return efeitos.map(e=>{
      const nome = NOME_IND[e.ind] || e.ind;
      /* PRESTÍGIO FALA A RÉGUA DO DONO (correção de 18/08/2026): o
         indicador vive em 0-20, mas toda tela fala 0-100 — a linha
         mostrava o +0,6 interno onde o jogador esperava +3 */
      const v = e.ind === 'dinheiro'   ? U.dinheiro(Math.abs(e.delta))
              : e.ind === 'prestigio'  ? Math.abs(Math.round(e.delta*5*10)/10)
              : Math.abs(Math.round(e.delta*10)/10);
      const sobe = e.delta > 0;
      const dono = e.dono ? ` ${e.dono}` : '';
      return `${nome}${dono} ${sobe?'+':'−'}${v}`;
    }).join(' · ');
  }

  /* =======================================================
     OS PRODUTORES DO DIA
     `eventosDoDia` roda uma vez por dia, depois de o estado
     simular os jogos do dia. A ordem aqui é a ordem em que as
     mensagens caem.
     ======================================================= */
  function eventosDoDia(E, ctx){
    ctx = ctx || {};
    olheiroDoDia(E);
    guerraDeHoje(E);
    eventoDoTrimestreHoje(E);
    lntDeHoje(E);
    ataqueSofridoHoje(E);
    escoltaDeHoje(E);
    assaltoDeHoje(E);
    barRivalDeHoje(E);
    aniversariosDeHoje(E);
    /* a recepção do aliado vira dinheiro no dia do jogo dele (dono,
       28/08/2026) */
    if(PL().cobrarRecepcoes) PL().cobrarRecepcoes(E);
    filialDeHoje(E);
    filialSugestaoDeHoje(E);
    hospedagemDaFilialSemana(E);
    mundoDeHoje(E, ctx);
    placarDoDia(E, ctx.jogos || []);
    almanaqueDoDia(E);
    dicaDeHoje(E);
  }

  /* =======================================================
     A VIDA DA FILIAL (aprovado pelo dono, 25/08/2026)
     Bem menos frequente que a cidade-sede, e tudo no feed
     normal: a filial apanha e se vira sozinha, o olheiro de
     lá sugere descida de vez em quando, e aliado que joga na
     cidade dela é hospedado pelo núcleo.
     ======================================================= */
  /* a filial atacada se defende SOZINHA — sem bonde de socorro, por
     ordem do dono: o núcleo local resolve por simulação e o resultado
     cai no feed como qualquer briga */
  function filialDeHoje(E){
    if(!TO.patrimonio || !TO.diaJogo || !TO.diaJogo.simular) return;
    for(const f of (((E.patrimonio||{}).filiais)||[])){
      if(U.rng() >= 0.005) continue;                // dose do dono: 0,5% ao dia
      const nucleo = TO.membros.aptosDaFilial(E, f.cidade);
      if(nucleo.length < 4) continue;
      const hostis = M().torcidasEm(f.cidade)
        .filter(o=>o.id !== E.torcida.id && !o.incompleta &&
                   !(M().saoIrmas && M().saoIrmas(E.torcida.id, o.id)) &&
                   TO.relacoes.nivel(E, o.id) <= -15)
        .sort((a,b)=>TO.relacoes.nivel(E,a.id) - TO.relacoes.nivel(E,b.id));
      const rival = hostis[0];
      if(!rival) continue;
      const deles = Math.max(6, Math.round(nucleo.length * U.entre(0.8, 1.4)));
      const res = TO.diaJogo.simular.rodar({config:{
        escalacao: nucleo, efetivoRival: deles,
        bondes:[{nossa:true, lado:'mandante', n:nucleo.length}]}});
      /* todo ocorrido mexe no prestígio (ordem do dono, 27/08/2026) */
      if(!res.prestigio) res.prestigio = res.ganhamos ? 1 : -1;
      TO.membros.aplicarResultadoDaNoite(E, res);
      TO.acoes.fecharCena(E, {acao:'defender', alvo:{
        torcidaId:rival.id, nome:rival.nome, tipo:'subsede', cena:'bar',
        bairro:TO.financeiro.nomeCidade(f.cidade),
        nossos:nucleo.length, efetivo:deles}}, res);
    }
  }

  /* a sugestão esporádica do olheiro da filial — texto e dose do dono
     (26/08/2026): mais ou menos a cada 12 semanas por filial */
  function filialSugestaoDeHoje(E){
    const fs = ((E.patrimonio||{}).filiais)||[];
    if(!fs.length) return;
    const sa = TO.relacoes.semanaAbs(E);
    const H = TO.mapa.hash;
    for(const f of fs){
      if((sa + H('fsug|'+f.cidade)) % 12 !== 0) continue;
      if((H(`fsug|${f.cidade}|${sa}`) % 7) + 1 !== E.data.dia) continue;
      const nucleo = TO.membros.aptosDaFilial(E, f.cidade);
      if(nucleo.length < 6) continue;
      const alvo = M().torcidasEm(f.cidade)
        .filter(o=>o.id !== E.torcida.id && !o.incompleta &&
                   !(M().saoIrmas && M().saoIrmas(E.torcida.id, o.id)) &&
                   TO.relacoes.nivel(E, o.id) <= -15)
        .sort((a,b)=>TO.relacoes.nivel(E,a.id) - TO.relacoes.nivel(E,b.id))[0];
      if(!alvo) continue;
      const cid = TO.financeiro.nomeCidade(f.cidade);
      propor(E, {
        kind:'filial-ataque', peso:'decisao', voz:'olheiro', tipo:'ruim',
        chave:`fsug|${f.cidade}|${sa}`,
        texto:`Chefe, o pessoal da nossa Sub-Sede ${cid} mapeou o bar da `+
              `${alvo.nome}. São ${nucleo.length} dos nossos na cidade. `+
              `Manda descer?`,
        dados:{cidade:f.cidade, rival:alvo.id},
        botoes:[{id:'desce',  rot:'Atacar', acao:'filial-ataque',
                 nota:'o núcleo da sub-sede desce sozinho — a briga vale '+
                      'prestígio como qualquer ataque a bar'},
                {id:'quieto', rot:'Não atacar', acao:'nada'}]});
    }
  }

  /* aliado jogando na cidade da filial é hospedado pelo núcleo:
     +2 de relação, calado — o registro fica na Diplomacia */
  function hospedagemDaFilialSemana(E){
    if(E.data.dia !== 2) return;
    const fs = ((E.patrimonio||{}).filiais)||[];
    if(!fs.length || !E.temporada) return;
    const cidades = new Set(fs.map(f=>f.cidade));
    const piso = PL().RELACAO_ALIADO || 20;
    for(const comp of (E.temporada.competicoes||[])){
      for(const etapa of [...(comp.rodadas||[]), ...(comp.mata||[])]){
        if(etapa.semana !== E.data.semana) continue;
        for(const j of (etapa.jogos||[])){
          if(!j.f) continue;
          const casa = M().time(j.c);
          if(!casa || !cidades.has(casa.mapa)) continue;
          for(const o of M().torcidasDe(j.f)){
            if(o.mapa === casa.mapa) continue;          // mora lá, não é visita
            const v = (E.relacoes||{})[o.id];
            if(v === undefined || v < piso) continue;
            E.relacoes[o.id] = U.limitar(v + 2, -100, 100);
            if(TO.relacoes.marcarAjuda) TO.relacoes.marcarAjuda(E, o.id);
          }
        }
      }
    }
  }

  /* -------------------------------------------------------
     7. AS DICAS DA DIRETORIA (pedido do dono, 19/08/2026)
        Duas por mês — semana ímpar, dia 2 —, cada uma
        explicando uma regra do jogo. São 40, na ordem em que
        um jogador novo precisa delas, e recomeçam do zero
        quando acabam. Números sempre na régua das telas.
     ------------------------------------------------------- */
  const DICAS = [
    'O prestígio vive numa régua de 0 a 100 e é o nome da torcida na rua: entra no ranking com peso dobrado e sobe com briga vencida, título e ação no bairro.',
    'A relação com cada torcida vai de −100 a +100: abaixo de −70 é Maior Rival, abaixo de −15 é Rival, até 20 é Neutro, até 70 é Aliado e de 70 pra cima é Irmandade.',
    'Seus membros treinam sozinhos todo dia: a fila é sorteada com prioridade pra quem ainda não bateu o teto do cargo. As vagas de treino vêm da sede — 2, 4, 8, 12 ou 20 por dia, conforme o nível.',
    'Cada professor de MMA custa R$ 2.000 por mês: um faz o treino render +30% de força e defesa, dois +60% e três +100%. Contrata e dispensa no Financeiro → Patrimônio.',
    'Cada cargo tem teto de ficha: novato vai até 8, componente até 12, linha de frente até 18 e diretoria até 20. Promoção pede XP e força — e cargo maior paga mensalidade maior.',
    'A mensalidade entra toda semana: R$ 20 por novato, R$ 50 por componente e R$ 100 por linha de frente e diretoria. Torcida grande é caixa forte.',
    'O ranking de torcidas soma disponíveis + prestígio×2, multiplica pela média de força e defesa dos membros e ainda pela situação financeira. Feridos e presos saem da conta.',
    'A situação financeira multiplica o ranking: Endividado corta pra 0,6×, e a escada sobe até Rico, que paga 1,6×. Caixa saudável é ranking alto.',
    'A festa na sede custa R$ 700 e rende R$ 4,80 a 6,40 por presente. Com uns 150 disponíveis ela sempre dá lucro; abaixo disso é vaquinha.',
    'Bar e loja rendem toda semana e pagam manutenção. Dá pra ampliar cada um por nível — e a fábrica corta o custo de insumo da loja e multiplica a receita dela.',
    'A subsede é presença no bairro: rende toda semana e aumenta o alcance da torcida. Compra e ampliação moram no Financeiro → Patrimônio.',
    'O ônibus custa R$ 100 mil e muda a estrada: a viagem sai de graça e o rateio dos embarcados vira RECEITA. Em troca, R$ 1.500 de manutenção por mês — e vez ou outra um conserto de R$ 15 mil.',
    'Na caravana de estrada quem embarca paga rateio. Sem ônibus, o rateio abate o custo da viagem; de avião a viagem é sempre paga.',
    'Reforçar o elenco do clube custa por ponto de força: de R$ 20 mil no time fraco a R$ 320 mil no gigante, teto 100. Time forte ganha mais, e vitória enche o recrutamento.',
    'Assalto tem tabela: do mercadinho (10% de chance de cadeia, 45 dias) ao banco (50% e 180 dias). O sorteio é um só pro bonde inteiro — ou todos voltam com a partilha, ou todos caem.',
    'Bombas custam R$ 600 o lote de 5 no Patrimônio. O estoque inteiro vai junto pra TODA briga — só a treta marcada é limpa, sem pedra nem bomba.',
    'Na cena, o rival responde com até metade das suas bombas — mas nunca joga mais do que tem no paiol dele. Bomba jogada sai do estoque dos dois lados.',
    'Treta marcada tem palco pelo tamanho: 5x5 no beco, 7x7 no galpão, 10x10 no campo de terra. Vencer paga +3/+4/+5 de prestígio; perder custa −1; recusar custa −1 de prestígio.',
    'Ataque a bar tem teto: no máximo 60 atacantes contra 40 defensores. E o bonde só sai pra UM ataque manual por semana.',
    'Ferido volta em 5 a 15 dias; preso fica de 15 a 90. Enquanto estão fora, não treinam, não brigam e não contam no ranking.',
    'Quando um aliado hospedado apanha na sua cidade e você entra na briga, o prestígio da noite é DELE — pra você ficam +10 de relação na hora e a gratidão.',
    'A recepção de aliado vai de R$ 25 a R$ 75 por cabeça: hospedar dá +2 de relação, escoltar +5, churrasco com escolta +12. Não receber cobra −5.',
    'Aniversário de aliado: ir custa R$ 2.000 e rende +3 de relação; furar tira −3 de relação e −2 de prestígio. Só aliado e irmã de clube convidam.',
    'No aniversário da torcida e do clube, a festa grande custa mais e rende mais; a simples é segura; não fazer nada derruba a moral. Os números estão na própria decisão.',
    'Pra ir à guerra, marque o ataque na semana: o olheiro diz em quantos bondes o rival sai e por onde. Emboscar na ida pega o bonde deles quebrado em pedaços.',
    'O olheiro erra: a confiança da leitura cai quando o rival está cauteloso e quando ele se divide em muitos bondes. Rival num bonde só é tudo ou nada.',
    'Na estrada, rota curta pode cruzar praça de rival — e a caravana vira alvo de emboscada no posto ou na pista. Rota longa e avião custam mais e arriscam menos.',
    'O prestígio de uma briga vai até ±10 por noite, contado pelos caídos e presos de cada lado. Fazer o rival correr sem briga rende de 1 a 6.',
    'Vencer em menor número vale mais: o prestígio da vitória é multiplicado pela razão dos efetivos, de 0,5× (esmagando) a 2× (de zebra).',
    'Nas brigas do mundo o favorito é efetivo × ficha média — e vence 70% das vezes. A zebra acontece, e quem ganha por baixo leva mais prestígio e moral.',
    'Caixa no vermelho derruba a moral toda semana, pra você e pra qualquer torcida do mundo. Moral baixa esvazia a saída e piora a briga.',
    'O recrutamento do expediente joga o dado do regime do clube: fase normal rende pouco, janela de título ou acesso enche a praça, rebaixamento seca tudo.',
    'A praça tem um bolo fixo de torcedores do seu clube: as organizadas irmãs dividem esse bolo. Cidade pequena não sustenta torcida gigante.',
    'A sede dita tudo: teto de membros, vagas de treino por dia e o que dá pra construir. Ampliar sede é o investimento que destrava os outros.',
    'As outras torcidas jogam o mesmo jogo: têm caixa, expediente, compram bar, loja, ônibus, professor de MMA e bombas — e investem no elenco do clube delas.',
    'Na cena de briga: WASD move o líder, 1 a 4 trocam a formação, Q pedra, E bomba, R recua, ENTER entra pelo portão — e a rodinha do mouse dá zoom.',
    'Formação é ferramenta: BONDE anda junto, MURALHA segura linha, QUADRADO protege o meio, ESPALHAR foge de bomba e cerca. Trocar na hora certa vira briga.',
    'A PM esquenta com briga e arma na rua: o alerta enche, a pressão empurra, e grade rompida chama a tropa de choque. Recuar a tempo é sair inteiro — e decisão no feed segura o relógio até você responder.',
    'Na partida ao vivo, o cartão do clima do estádio vai de tranquilo a esquentando e tenso: rival de relação muito ruim na arquibancada esquenta rápido, e aliado presente segura o jogo inteiro em tranquilo. Se ficar TENSO, a arquibancada se pega e a cena abre.',
    'Na briga de arquibancada cada torcida senta no setor do seu escalão — 1º escalão é a maior torcida do clube, 2º a seguinte, e isso vira quando uma passa a outra. Vencer paga de +1 a +3 de prestígio (mais se você estava em menor número); perder tira de −1 a −3.'
  ];
  function dicaDeHoje(E){
    const sa = TO.relacoes.semanaAbs(E);
    if(sa % 2 !== 1 || E.data.dia !== 2) return;
    const i = (E.dicaSeq || 0) % DICAS.length;
    const m = propor(E, {kind:'dica', peso:'info', voz:'diretor',
      chave:`dica|${E.data.ano}|${E.data.semana}`,
      texto: DICAS[i]});
    if(m) E.dicaSeq = (E.dicaSeq || 0) + 1;
  }

  /* -------------------------------------------------------
     3e. ANIVERSÁRIOS (textos do dono, 18/08/2026)
         A fonte só guarda o ANO de fundação; o dia e o mês
         nascem do hash do id — a mesma torcida faz aniversário
         na mesma data em toda partida.
         · 10 dias antes do aniversário de OUTRA torcida, ela
           convida: ir custa R$ 2.000 e rende +3 de relação;
           não ir custa −3.
         · 10 dias antes do NOSSO e do aniversário do CLUBE, um
           diretor pergunta o tamanho da festa; o custo e a
           moral saem na decisão, a receita sai no dia.
     ------------------------------------------------------- */
  /* A DATA DE VERDADE MANDA (correção do dono, 19/08/2026): a fonte
     das torcidas guarda fundacaoDia/fundacaoMes — a TUF faz 17/02, e o
     hash sorteava outra data por cima. O sorteio fica só de reserva,
     pra quem não tem a data na fonte (3 torcidas e quase todo clube). */
  const fonteDe = (id, o) => o || M().torcida(id) || null;
  const dataDoAniversario = (id, anoCivil, o) => {
    const f = fonteDe(id, o);
    if(f && f.fundacaoDia && f.fundacaoMes)
      return new Date(anoCivil, f.fundacaoMes - 1, f.fundacaoDia);
    return new Date(anoCivil, 0, 1 + TO.mapa.hash(`${id}|aniv`) % 364);
  };
  const fmtDia = d =>
    `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
  const mesmoDia = (a, b) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth();

  /* a tabela do dono: custo, potencial de receita e moral */
  const FESTA_ANIV = {
    torcida: {grande:{custo:20000, min:20000, max:40000, moral:2},
              simples:{custo:5000,  min:4000,  max:8000,  moral:1},
              nada:{moral:-2}},
    clube:   {grande:{custo:10000, min:10000, max:20000, moral:2},
              simples:{custo:3000,  min:2000,  max:5000,  moral:1},
              nada:{moral:-2}}
  };

  function aniversariosDeHoje(E){
    const hoje = TO.estado.dataDaSemana(E.data.ano, E.data.semana, E.data.dia);
    const em10 = new Date(hoje.getTime());
    em10.setDate(em10.getDate() + 10);

    /* o convite das outras — SÓ DE ALIADA (correção do dono,
       18/08/2026): a Garra do CRB chamando a TUF pra festa não faz
       sentido. Convida quem a Diplomacia rotula Aliado ou Irmandade
       (relação viva ≥ 20) e as irmãs de clube. */
    for(const o of M().jogaveis()){
      if(o.id === E.torcida.id || o.incompleta || !o.fundacao) continue;
      const irma = M().saoIrmas && M().saoIrmas(E.torcida.id, o.id);
      if(!irma && TO.relacoes.nivel(E, o.id) < 20) continue;
      const aniv = dataDoAniversario(o.id, em10.getFullYear());
      if(!mesmoDia(aniv, em10)) continue;
      const idade = em10.getFullYear() - o.fundacao;
      if(idade <= 0) continue;
      propor(E, {
        kind:'aniversario', peso:'decisao', voz:'rua',
        chave:`aniv|${em10.getFullYear()}|${o.id}`,
        texto:`Fala irmão, dia ${fmtDia(aniv)} comemoramos ${idade} anos `+
              `de história. A presença de vocês seria uma honra pra gente. `+
              `— ${o.nome}`,
        dados:{torcida:o.id, nome:o.nome},
        botoes:[
          {id:'ir',  rot:'Ir pra festa', acao:'aniv-ir',
           nota:'R$ 2.000 · +3 de relação'},
          {id:'nao', rot:'Não ir', acao:'aniv-nao',
           nota:'−3 de relação · −2 de prestígio'}
        ]
      });
    }

    /* a nossa festa e a do clube */
    const meus = [];
    if(E.torcida.fundacao)
      meus.push({tipo:'torcida', id:E.torcida.id, fundacao:E.torcida.fundacao,
                 fonte:E.torcida});
    const time = M().time(E.torcida.clubeId);
    if(time && time.fundacao)
      meus.push({tipo:'clube', id:'clube|'+E.torcida.clubeId,
                 fundacao:time.fundacao, nome:time.nome, fonte:time});
    for(const q of meus){
      const F = FESTA_ANIV[q.tipo];
      const aniv = dataDoAniversario(q.id, em10.getFullYear(), q.fonte);
      if(mesmoDia(aniv, em10)){
        const idade = em10.getFullYear() - q.fundacao;
        if(idade > 0) propor(E, {
          kind:'aniversario', peso:'decisao', voz:'diretor',
          chave:`aniv-${q.tipo}|${em10.getFullYear()}`,
          texto: q.tipo === 'torcida'
            ? `Dia ${fmtDia(aniv)} a torcida completa ${idade} anos. `+
              `Que festa vamos fazer?`
            : `Dia ${fmtDia(aniv)} o ${q.nome} completa ${idade} anos. `+
              `Que festa vamos fazer?`,
          dados:{tipo:q.tipo, anoCivil:em10.getFullYear()},
          botoes:[
            {id:'grande',  rot:'Festa grande', acao:'aniv-festa',
             nota:`R$ ${U.numero(F.grande.custo)} · potencial de `+
                  `${U.dinheiro(F.grande.min)} a ${U.dinheiro(F.grande.max)}`+
                  ` · +${F.grande.moral} de moral`},
            {id:'simples', rot:'Festa simples', acao:'aniv-festa',
             nota:`R$ ${U.numero(F.simples.custo)} · potencial de `+
                  `${U.dinheiro(F.simples.min)} a ${U.dinheiro(F.simples.max)}`+
                  ` · +${F.simples.moral} de moral`},
            {id:'nada',    rot:'Não fazer nada', acao:'aniv-festa',
             nota:`${F.nada.moral} de moral`}
          ]
        });
      }
      /* o dia da festa: a receita sai do potencial */
      const anivHoje = dataDoAniversario(q.id, hoje.getFullYear(), q.fonte);
      if(mesmoDia(anivHoje, hoje)){
        const chave = `festa-${q.tipo}|${hoje.getFullYear()}`;
        const marcada = (E.festasAniversario||{})[chave];
        if(marcada && F[marcada] && F[marcada].custo){
          delete E.festasAniversario[chave];
          const v = U.inteiro(F[marcada].min, F[marcada].max);
          TO.estado.lancar(E, q.tipo === 'torcida'
            ? 'Festa de aniversário da torcida — receita'
            : 'Festa de aniversário do clube — receita', v);
          propor(E, {
            kind:'aniversario', peso:'info', tipo:'boa', voz:'diretor',
            chave:`festa-fim|${q.tipo}|${hoje.getFullYear()}`,
            texto: q.tipo === 'torcida'
              ? `A festa dos nossos anos rendeu ${U.dinheiro(v)}.`
              : `A festa do aniversário do ${q.nome} rendeu ${U.dinheiro(v)}.`
          });
        }
      }
    }
  }

  /* -------------------------------------------------------
     3d. O ALMANAQUE (pedido do dono, 21/08/2026)
         Duas portas, o mesmo jornal:
         · a VIRADA — sobe e desce, torcida do ano, rei da
           pista, a janela e o balanço de patrimônio — sai da
           colheita que o fecho da temporada deixou guardada;
         · o CAMPEÃO — uma edição por competição que o NOSSO
           clube jogou, na hora em que o campeão é decidido.
     ------------------------------------------------------- */
  function almanaqueDoDia(E){
    if(!TO.almanaque) return;

    /* 1. as páginas da virada, guardadas pelo fecho da temporada */
    const fila = E.almanaquePendente || [];
    if(fila.length){
      for(const pg of fila) proporAlmanaque(E, pg,
        `almanaque|${pg.tipo}|${pg.ano || E.data.ano}`);
      E.almanaquePendente = null;
    }

    /* 2. A VÉSPERA: sete dias antes de a bola rolar, uma vez por
       competição em que o NOSSO clube está. O calendário do jogo é
       semana × dia, então "daqui a sete dias" é a MESMA posição da
       semana que vem. */
    const hoje = (E.data.semana - 1) * 7 + E.data.dia;
    E.aberturasVistas = E.aberturasVistas || {};
    for(const comp of ((E.temporada||{}).competicoes || [])){
      /* a Copa do Brasil não tem rodada nenhuma: a estreia dela é a
         primeira fase do mata-mata */
      const e0 = TO.competicoes.estreiaDe(comp);
      if(!e0) continue;
      const estreia = (e0.semana - 1) * 7 + e0.dia;
      if(estreia - hoje !== 7) continue;
      const chave = `${E.temporada.ano}|${comp.nome}`;
      if(E.aberturasVistas[chave]) continue;
      E.aberturasVistas[chave] = true;
      const pg = TO.almanaque.abertura(E, comp);
      if(pg) proporAlmanaque(E, pg, `almanaque|abertura|${chave}`);
    }

    /* 3. o campeão de cada competição nossa, uma vez só */
    const meu = E.torcida.clubeId;
    E.campeoesVistos = E.campeoesVistos || {};
    for(const comp of ((E.temporada||{}).competicoes || [])){
      if(!comp.campeao) continue;
      const chave = `${E.temporada.ano}|${comp.nome}`;
      if(E.campeoesVistos[chave]) continue;
      const pg = TO.almanaque.campeao(E, comp);
      /* competição que o nosso clube não jogou não vira notícia — mas
         fica marcada, senão a gente reavalia ela todo dia */
      E.campeoesVistos[chave] = true;
      if(pg) proporAlmanaque(E, pg, `almanaque|campeao|${chave}`);
    }
  }

  function proporAlmanaque(E, pg, chave){
    propor(E, {
      kind:'almanaque', peso:'info', voz:'jornal', tipo: pg.tom || '',
      chave,
      /* o texto corrido continua valendo: é ele que aparece na busca,
         no arquivo de Notícias e em qualquer save que não saiba
         desenhar a página */
      texto:`${pg.chapeu}: ${pg.manchete}. ${pg.olho}`,
      dados:{pagina:pg}
    });
  }

  /* AS BRIGAS DA SEMANA SAÍRAM DO FEED (decisão do dono, 21/08/2026).
     O resumo de segunda-feira deixou de existir: quem conta briga
     agora é o Futebol e Porrada, que sai a cada briga NOSSA e leva
     dentro dele as outras do mesmo dia. As brigas do mundo continuam
     sendo registradas em `E.brigasIA` do mesmo jeito e continuam
     inteiras em Notícias → Brigas — o que acabou foi a mensagem. */

  /* -------------------------------------------------------
     3c. A SUGESTÃO DE ASSALTO (decisão do dono, 17/08/2026):
         de tempos em tempos um diretor chega com alvo mapeado.
         Cai uma vez por mês, em dia comum, e só se há diretor
         de pé e gente disponível pro menor dos alvos.
     ------------------------------------------------------- */
  function assaltoDeHoje(E){
    const sa = TO.relacoes.semanaAbs(E);
    const H = TO.mapa.hash;
    if(sa % 4 !== H(`assalto|${E.torcida.id}`) % 4) return;
    let dia = 1 + H(`assalto|${sa}|${E.torcida.id}`) % 7;
    for(let k=0; k<7 && !diaComumFeed(E, dia); k++) dia = (dia % 7) + 1;
    if(dia !== E.data.dia) return;
    const dir = E.membros.find(m=>m.cargo === 'diretoria' &&
                                  TO.membros.disponivel(m));
    if(!dir) return;
    if(E.membros.filter(TO.membros.disponivel).length < 2) return;
    propor(E, {
      kind:'assalto', peso:'decisao', voz:'diretor',
      chave:`assalto|${E.data.ano}|${sa}`,
      texto:`Chefe, o ${dir.apelido} mapeou uns alvos pra um assalto — `+
            `do mercadinho ao banco, cada um com seu risco. Bora ver?`,
      botoes:[
        {id:'ver',  rot:'Ver os alvos',  acao:'tela-assalto'},
        {id:'nada', rot:'Deixar quieto', acao:'nada'}
      ]
    });
  }
  /* -------------------------------------------------------
     3f. O BAR DO RIVAL DÁ SOPA (texto do dono, 18/08/2026):
         em torno de 8 vezes no ano (eram 15 até 24/08/2026,
         quando o dono mandou cortar pela metade a dose de bar
         e de treta marcada), um diretor aponta o bar
         de um rival DA CIDADE e pergunta se o bonde desce.
         Atacar abre a mesma cena do ataque manual — com o
         mesmo limite de um bonde por semana.
     ------------------------------------------------------- */
  function barRivalDeHoje(E){
    const sa = TO.relacoes.semanaAbs(E);
    const H = TO.mapa.hash;
    /* ~15% das semanas têm a sugestão: 0,15 × 52 ≈ 8 por ano */
    if(H(`barrival|${sa}|${E.torcida.id}`) % 100 >= 15) return;
    let dia = 1 + H(`barrival|d|${sa}|${E.torcida.id}`) % 7;
    for(let k=0; k<7 && !diaComumFeed(E, dia); k++) dia = (dia % 7) + 1;
    if(dia !== E.data.dia) return;
    const alvos = (TO.acoes.alvosDeAtaque(E) || []).filter(a =>
      a.tipo === 'bar' && TO.relacoes.nivel(E, a.torcidaId) <= -15);
    if(!alvos.length) return;
    const alvo = alvos[H(`barrival|a|${sa}`) % alvos.length];
    propor(E, {
      kind:'barrival', peso:'decisao', voz:'diretor',
      chave:`barrival|${E.data.ano}|${sa}`,
      /* texto do dono (26/08/2026) */
      texto:`Chefe, chegou a informação que o bar da ${alvo.deQuem} tá `+
            `cheio deles lá, a gente quer dar o bote neles e roubar o `+
            `caixa do bar.`,
      dados:{alvo: alvo.id, nome: alvo.deQuem},
      botoes:[
        {id:'atacar', rot:'Atacar o bar', acao:'atacar-bar-rival',
         nota:'abre a cena — a briga vale até ±10 de prestígio; ganhando, '+
              'saque de R$ 60 por defensor + 22% do caixa deles · '+
              'Relação −26 (perdendo, −18)'},
        {id:'nada', rot:'Deixar quieto', acao:'ignorar-bar-rival',
         nota:'Prestígio −1 · Moral −1'}
      ]
    });
  }

  /* dia sem jogo do clube e sem caravana — mesma régua dos eventos do
     trimestre, reimplementada aqui porque a de lá é privada */
  function diaComumFeed(E, dia){
    const meu = M().time(E.torcida.clubeId);
    if(meu && TO.competicoes.jogosDaSemana(E, meu.id, E.data.semana)
                .some(j=>j.dia === dia)) return false;
    return !TO.financeiro.diasDeCaravana(E).includes(dia);
  }

  /* -------------------------------------------------------
     0. A ABERTURA DA PARTIDA (textos aprovados pelo dono)
        Duas decisões, uma vez só, antes de o tempo correr:
        a ideologia e o Expediente da Sede.
     ------------------------------------------------------- */
  function abertura(E){
    propor(E, {
      kind:'abertura', peso:'decisao', voz:'diretor',
      chave:'abertura|ideologia',
      texto:'Chefe, antes de tudo: define a nossa ideologia — o que a '+
            'gente faz com o adversário em dia de jogo e o que faz com os '+
            'outros jogos da praça. É ela que o botão "Seguir padrão" '+
            'executa quando você não quiser decidir jogo a jogo.',
      botoes:[{id:'ideologia', rot:'Definir ideologia', acao:'tela-ideologia'}]
    });
    propor(E, {
      kind:'abertura', peso:'decisao', voz:'diretor',
      chave:'abertura|expediente',
      texto:'E define o Expediente da Sede: três turnos por dia — manhã, '+
            'tarde e noite —, cada um com uma ação que a rapaziada toca '+
            'sozinha. Dia de jogo e dia de estrada ficam de fora.',
      botoes:[{id:'expediente', rot:'Abrir o Expediente', acao:'painel-expediente'}]
    });
  }

  /* -------------------------------------------------------
     1. O OLHEIRO — dois dias antes de cada jogo relevante
        da semana (no mínimo no dia 1, se o jogo é cedo).
        JAMAIS falha: toda partida das três situações gera
        exatamente um relatório com estimativas e opções.
     ------------------------------------------------------- */
  const ehHostil = (E, id) => {
    if(M().saoIrmas(E.torcida.id, id)) return false;
    const base = M().relacaoBase(E.torcida.id, id);
    if(base === 'Rival' || base === 'Maior Rival') return true;
    return TO.relacoes.nivel(E, id) <= -15;
  };

  const diaDoOlheiro = diaJogo => Math.max(1, diaJogo - 2);
  /* "pela Copa do Nordeste", "pelo Paulistão" */
  const pelaComp = n => n ? (/^Copa/i.test(n) ? `, pela ${n}` : `, pelo ${n}`) : '';
  const NOME_DIA = [null,'segunda','terça','quarta','quinta','sexta',
                    'sábado','domingo'];

  /* UM RELATÓRIO POR DIA (decisão do dono): todos os jogos relevantes
     que reportam hoje entram na MESMA mensagem, cada um com suas
     estimativas. O jogo fora entra no mesmo relatório quando cai no
     mesmo dia — o botão da caravana vem junto. */
  function olheiroDoDia(E){
    const hoje = E.data.dia;
    const meu = E.torcida.clubeId;

    /* situações 1 e 2: os jogos da NOSSA praça que reportam hoje */
    const grupos = [];
    const tabela = [];
    const corDe = id => {
      const o = M().torcida(id);
      return (o && M().coresDaTorcida(o).cor) || '#888';
    };
    for(const j of TO.praca.jogosDaPraca(E)){
      if(diaDoOlheiro(j.dia) !== hoje) continue;
      const nosso = j.casa.id === meu || j.vis.id === meu;
      const ests = estimativasDaRua(E, j.dia, j);
      /* SEM RIVAL, SEM PAUTA — MAS O NOSSO JOGO SEMPRE TEM PAUTA
         (correção do dono, 23/08/2026). A regra vale pro jogo dos
         outros na nossa praça: sem rival na rua não há o que planejar
         ali. No NOSSO jogo há sempre — quantos descem, quantas bombas,
         a intenção do dia —, e o relatório sumia justamente nos jogos
         em que ninguém hostil pisava na rua: Fortaleza × Vitória com a
         TUF, com a irmã do lado e o visitante em casa, ficava sem
         planejamento nenhum. */
      if(!nosso && !ests.filter(x=>x.hostil).length) continue;
      const chaveJogo = nosso ? null : chaveDoJogoDaPraca(E, j);
      grupos.push({dia:j.dia, chaveJogo, casa:j.casa.id, vis:j.vis.id});
      /* o relatório é uma TABELA (decisão do dono, 17/08/2026): coluna 1
         a competição, a data e o jogo com as cores dos clubes; coluna 2
         as torcidas do jogo, cada uma com sua cor e sua estimativa */
      tabela.push({
        comp: j.comp, dia: NOME_DIA[j.dia],
        clubes: [{nome:j.casa.nome, cor:(j.casa.cores||[])[0]||'#888'},
                 {nome:j.vis.nome,  cor:(j.vis.cores||[])[0]||'#888'}],
        torcidas: ests.map(x=>({nome:x.nome, cor:corDe(x.id),
                                faixa:x.faixa, hostil:x.hostil}))
      });
    }

    /* situação 3: nosso jogo fora que reporta hoje */
    const jf = E.proximoJogo;
    const fora = (jf && !jf.casa && jf.mapaAdv && jf.mapaAdv !== E.torcida.mapa &&
                  diaDoOlheiro(jf.dia||6) === hoje) ? jf : null;

    if(!grupos.length && !fora) return;
    if(!grupos.length && fora){ olheiroFora(E, fora); return; }

    const nossos = TO.membros.aptosParaOEstadio(E).length;
    /* sem ninguém hostil na rua não há a quem descer, e o texto não
       pode perguntar "vamos pra cima de alguém?" pra uma rua vazia */
    const temAlvo = tabela.some(t=>(t.torcidas||[]).some(x=>x.hostil));
    /* texto do dono (26/08/2026) */
    let texto = temAlvo
      ? `Chefe, esses são os jogos dos próximos dias na cidade. Nosso `+
        `bonde vai pro jogo com ${nossos} membros. Fale as ações das `+
        `torcidas.`
      : `Chefe, esses são os jogos dos próximos dias na cidade. Nosso `+
        `bonde vai pro jogo com ${nossos} membros, e rival na rua não `+
        `tem. Deve ser um dia tranquilo`;
    const botoes = [];
    if(temAlvo) botoes.push({id:'atacar', rot:'Atacar', acao:'tela-ataque',
                             args:{ctx:{grupos}}});
    botoes.push(
      {id:'paz',    rot: temAlvo ? 'Ir em paz' : 'Avançar',
       acao:'paz-grupo', args:{grupos}},
      {id:'padrao', rot:'Seguir padrão', acao:'padrao-grupo', args:{grupos}});
    if(fora){
      const alvos = PL().alvosDaViagem(E, {advId:fora.advId, crua:true});
      texto += ` E ${NOME_DIA[fora.dia||6]} o ${E.torcida.clube} joga fora, `+
        `em ${fora.cidadeAdv}. Monta a caravana e diz se vamos em paz `+
        `ou pra cima.`;
      tabela.push({
        comp: fora.competicao || 'fora de casa', dia: NOME_DIA[fora.dia||6],
        clubes: [{nome:fora.mandante.nome,
                  cor:(fora.mandante.cores||[])[0]||'#888'},
                 {nome:fora.visitante.nome,
                  cor:(fora.visitante.cores||[])[0]||'#888'}],
        torcidas: alvos.map(a=>({nome:a.nome, cor:corDe(a.id),
                                 faixa:a.faixa, hostil:!a.aliada}))
      });
      botoes.splice(1, 0,
        {id:'caravana', rot:'Montar a caravana', acao:'tela-caravana'});
    }
    /* O BLOCO DA RECEPÇÃO (pedido do dono, 28/08/2026): a lista de
       aliados que vêm pros jogos DA MENSAGEM, com o número exato de
       membros — os quatro botões de recepção são desenhados pelo
       cartão da mensagem, e a conta vira no dia do jogo de cada um.
       SÓ OS JOGOS DE CIMA (correção do dono, 31/08/2026): cada
       mensagem do olheiro cobre os jogos que reportam naquele dia, e
       o bloco tem de bater com eles — aliado de jogo que reporta em
       outro dia aparece na mensagem daquele dia. */
    const aliados = PL().aliadosNaCidade(E, E.data.semana)
      .filter(a=>grupos.some(g=>g.vis === a.clube.id && g.dia === a.dia))
      .map(a=>({id:a.id, nome:a.torcida.nome, n:a.estimativa,
                dia:a.dia, clube:a.clube.nome}));
    propor(E, {
      kind:'olheiro', peso:'decisao', voz:'olheiro',
      chave:`olheiro|${E.data.ano}|${E.data.semana}|${hoje}`,
      texto, dados:{grupos, fora:!!fora, tabela, aliados}, botoes
    });
  }

  /* a lista de estimativas DAQUELE JOGO: as torcidas dos dois clubes
     que pisam na rua naquele dia */
  function estimativasDaRua(E, dia, jogo){
    const doJogo = jogo
      ? new Set([...M().torcidasDe(jogo.casa.id), ...M().torcidasDe(jogo.vis.id)]
                  .map(o=>o.id))
      : null;
    return TO.praca.naRuaEm(E, dia)
      .filter(b => !b.nossa)
      .filter(b => !doJogo || doJogo.has(b.id))
      .map(b => ({id:b.id, nome:b.nome, n:b.n,
                  faixa: PL().faixaDeEfetivo(E, b.n, b.id),
                  hostil: ehHostil(E, b.id)}));
  }

  function chaveDoJogoDaPraca(E, j){
    const o = PL().outrosJogosNaCidade(E, E.data.semana)
      .find(x => x.casa.id === j.casa.id && x.vis.id === j.vis.id);
    return o ? o.chave : `${j.casa.id}|${j.vis.id}|${E.data.semana}`;
  }

  /* situação 3 — nosso jogo fora: caravana sempre; olheiro aponta as
     torcidas de lá (se houver rival, as opções de ataque moram na tela
     da caravana) */
  function olheiroFora(E, j){
    const alvos = PL().alvosDaViagem(E, {advId:j.advId, crua:true});
    const chave = `olheiro|${E.data.ano}|${E.data.semana}|fora|${j.advId}`;
    const corDe = id => {
      const o = M().torcida(id);
      return (o && M().coresDaTorcida(o).cor) || '#888';
    };
    const tabela = [{
      comp: j.competicao || 'fora de casa', dia: NOME_DIA[j.dia||6],
      clubes: [{nome:j.mandante.nome,  cor:(j.mandante.cores||[])[0]||'#888'},
               {nome:j.visitante.nome, cor:(j.visitante.cores||[])[0]||'#888'}],
      torcidas: alvos.map(a=>({nome:a.nome, cor:corDe(a.id),
                               faixa:a.faixa, hostil:!a.aliada}))
    }];
    propor(E, {
      kind:'olheiro', peso:'decisao', chave, voz:'olheiro',
      texto:`Chefe, ${NOME_DIA[j.dia||6]} o ${E.torcida.clube} joga fora, `+
            `em ${j.cidadeAdv}. `+
            `Monta a caravana e diz se vamos em paz ou pra cima.`,
      dados:{situacao:'fora', dia:j.dia||6, tabela},
      botoes:[
        {id:'caravana', rot:'Montar a caravana', acao:'tela-caravana'},
        {id:'padrao',   rot:'Seguir padrão',     acao:'seguir-padrao'}
      ]
    });
  }

  /* -------------------------------------------------------
     1b. A CAMPANA DO OLHEIRO (Inteligência — pedido do dono,
         24/08/2026). Com a diária paga no expediente, o
         olheiro tem 50% de chance de prever cada emboscada e
         ataque que vem (100% na campana dupla). O sorteio é
         por hash: a mesma fita nunca é re-sorteada, e a chave
         segura a mensagem de sair duas vezes. Os textos-base
         são do dono, palavra por palavra, com nome e praça
         entrando no lugar dos exemplos.
     ------------------------------------------------------- */
  function nivelDaCampana(E){
    const c = E.campana;
    if(!c) return 0;
    const abs = (E.data && E.data.absoluto) || 0;
    /* a diária cobre a viagem: o expediente não roda em dia de
       caravana nem de jogo, então o último pagamento vale 7 dias */
    if(abs - (c.pagoAbs || 0) > 7) return 0;
    return c.nivel || 0;
  }
  function avisoDoOlheiro(E, av){
    /* filial na praça é olheiro fixo (dono, 25/08/2026): com `forcar`
       o aviso sai SEMPRE, pago ou não o expediente de Inteligência */
    const nivel = av.forcar ? 2 : nivelDaCampana(E);
    if(!nivel) return;
    const chave = 'campana|' + av.chave;
    if(nivel < 2 && TO.mapa.hash(chave) % 2) return;   // 50% na simples
    const LUGAR = {concentracao:'na concentração',
                   pista:'na pista a caminho do estádio'};
    const texto = av.alvo === 'emboscada'
      ? (av.chegada
         ? `Fala presida, me passaram a fita de que os caras da ${av.nome} `+
           `vai atacar a gente assim que chegarmos em ${av.cidade}. `+
           `Vale ficar de olho.`
         : `Chefe, descobri que a ${av.nome} vai atacar a gente quando `+
           `passarmos por ${av.cidade}. Bora se preparar pra esse ataque deles.`)
      : av.alvo === 'bar'
      ? `Fala presida, me passaram a fita de que os caras da ${av.nome} `+
        `vai atacar o nosso bar hoje. Vale ficar de olho.`
      : `Fala presida, me passaram a fita de que os caras da ${av.nome} `+
        `vai atacar a gente ${LUGAR[av.alvo] || 'na rua'} no dia do jogo. `+
        `Vale ficar de olho.`;
    propor(E, {kind:'campana', peso:'info', tipo:'ruim', voz:'olheiro',
               chave, texto});
  }

  /* -------------------------------------------------------
     2. O DIA DA GUERRA — o ataque que o jogador marcou
     ------------------------------------------------------- */
  function guerraDeHoje(E){
    const p = PL().plano(E);
    const hoje = E.data.dia;
    const f = PL().efetivoDoAtaque(E);
    const bombas = p.bombas || 0;
    const nota = `${f.vao} dos nossos · ${bombas} ${bombas===1?'bomba':'bombas'}`;

    /* a) nosso jogo (em casa ou fora) com ataque marcado */
    const j = E.proximoJogo;
    /* O DIA DO NOSSO JOGO É DO ITINERÁRIO (régua do dono, 20/08/2026).
       A investida que o planejamento marcou não vira mais um cartão
       solto no feed: ela aparece como PARADA da linha do dia, no ponto
       combinado (concentração, pista ou arredores), e abre a mesma
       cena de lá. As investidas nos OUTROS jogos da praça continuam
       aqui embaixo, que essas não são do nosso dia. */
    if(false && j && p.intencao === 'atacar' && p.alvoTorcida &&
       (j.dia||6) === hoje && !p.guerraJogada){
      const o = M().torcida(p.alvoTorcida);
      const onde = PL().ONDE_ATAQUE.find(x=>x.id === PL().ondeDoPlano(p)) || {};
      const chave = `guerra|${E.data.ano}|${E.data.semana}|${p.alvoTorcida}`;
      propor(E, {
        kind:'guerra', peso:'decisao', chave, voz:'diretor', tipo:'ruim',
        texto: j.casa
          ? `Hoje é o dia. A ${o?o.nome:''} vai estar `+
            `${(onde.rot||'nos arredores').toLowerCase()} e a gente vai pra cima.`
          : `Hoje é o dia. A ${o?o.nome:''} vai estar na cidade deles, `+
            `em ${j.cidadeAdv}, e a gente vai pra cima.`,
        dados:{tipo: j.casa ? 'casa' : 'fora', nota},
        botoes:[{id:'guerra', rot:'Ir pra Guerra', acao:'cena-guerra',
                 args:{tipo: j.casa ? 'casa' : 'fora'},
                 nota: nota + ' · a briga vale até ±10 de prestígio'}]
      });
    }

    /* b) ataque marcado num jogo alheio da praça */
    for(const og of PL().outrosJogosNaCidade(E, E.data.semana)){
      if((og.dia||6) !== hoje) continue;
      const inv = PL().investidaDe(E, og.chave);
      if(!inv || !inv.alvo || inv.jogada) continue;
      const o = M().torcida(inv.alvo);
      const chave = `guerra|${E.data.ano}|${E.data.semana}|praca|${og.chave}`;
      propor(E, {
        kind:'guerra', peso:'decisao', chave, voz:'diretor', tipo:'ruim',
        texto:`Hoje é o dia. A ${o?o.nome:''} vai estar na praça pro `+
              `${og.casa.nome} × ${og.vis.nome}, e a gente vai pra cima.`,
        dados:{tipo:'praca', chaveJogo:og.chave, dia:og.dia, nota},
        botoes:[{id:'guerra', rot:'Ir pra Guerra', acao:'cena-guerra',
                 args:{tipo:'praca', chaveJogo:og.chave, dia:og.dia},
                 nota: nota + ' · a briga vale até ±10 de prestígio'}]
      });
    }
  }

  /* -------------------------------------------------------
     3. O ATAQUE SOFRIDO — bar/loja em dia comum, concentração
        em dia de jogo em casa, pista a caminho do estádio,
        estrada na caravana.
     ------------------------------------------------------- */
  const SOFRIDO = {
    bar:          {texto:o=>`Invadiram nosso bar! A ${o} tá na porta quebrando tudo.`,
                   brigar:'Descer pra briga', fugir:'Deixar quebrarem'},
    concentracao: {texto:o=>`A ${o} caiu em cima da nossa concentração antes do jogo!`,
                   brigar:'Pra cima deles', fugir:'Recuar pra sede'},
    pista:        {texto:o=>`A ${o} fechou a gente na pista, a caminho do estádio!`,
                   brigar:'Pra cima deles', fugir:'Furar e seguir pro jogo'},
    emboscada:    {texto:o=>`Pegaram a caravana na estrada. A ${o} fechou a pista.`,
                   brigar:'Descer pra treta', fugir:'Mandar seguir viagem'}
  };

  function ataqueSofridoHoje(E){
    const a = TO.relacoes.ataqueDeHoje(E);
    if(!a || a.avisado) return;
    /* concentração, pista e estrada acontecem DENTRO do itinerário do
       dia de jogo (régua do dono, 20/08/2026) — o feed não pergunta
       duas vezes. O ataque ao BAR continua aqui: é de dia comum. */
    if(a.alvo === 'concentracao' || a.alvo === 'pista' ||
       a.alvo === 'emboscada') return;
    a.avisado = true;
    const cfg = SOFRIDO[a.alvo] || SOFRIDO.bar;
    const chave = `sofrido|${E.data.ano}|${E.data.semana}|${a.torcida}|${a.alvo}`;
    propor(E, {
      kind:'sofrido', peso:'decisao', chave, voz:'diretor', tipo:'ruim',
      texto: cfg.texto(a.nome),
      dados:{torcida:a.torcida, alvo:a.alvo, cena:a.cena},
      botoes:[
        {id:'brigar', rot:cfg.brigar, acao:'cena-defesa',
         nota:'abre a cena — a briga vale até ±10 de prestígio; segurando, '+
              'Moral +1,5 · Prestígio +3,5; perdendo, Moral −3 · Prestígio −3,5'},
        {id:'fugir',  rot:cfg.fugir,  acao:'fugir-defesa',
         nota:'ninguém desce: Moral −3 · Prestígio −3,5 · Relação −6'+
              (a.alvo === 'bar' ? ' · levam R$ 60 por invasor + 10% do caixa' : '')}
      ]
    });
  }

  /* -------------------------------------------------------
     3b. O CALENDÁRIO DO TRIMESTRE — a treta marcada em rua e
         o ataque ao bar, nas doses do dono: a cada 13 semanas,
         2 a 4 tretas e 1 a 2 ataques, sempre em dia comum.
         Texto da treta aprovado pelo dono.
     ------------------------------------------------------- */
  function eventoDoTrimestreHoje(E){
    const ev = TO.relacoes.eventoDeHoje(E);
    if(!ev) return;
    /* a treta sorteia entre TODAS as hostis da praça, nanica incluída
       (decisão do dono, 17/08/2026) — os efetivos são idênticos, então
       tamanho não desequilibra; o bar continua vindo da maior rival */
    const rival = TO.relacoes.rivalDaPraca(E,
      ev.tipo === 'treta' ? ev.chave : null);
    if(!rival) return;

    if(ev.tipo === 'bar'){
      /* o ataque ao bar entra pelo caminho de sempre: marca o ataque e
         a convocação de defesa monta a mensagem */
      if(E.ataqueMarcado && !E.ataqueMarcado.resolvido &&
         E.ataqueMarcado.semana === E.data.semana) return;
      /* ataque de nanica não existe (decisão do dono, 17/08/2026): se
         nem a maior rival da praça tem metade do nosso efetivo, o bar
         fica em paz neste trimestre — melhor sem cena do que uma cena
         que acaba com eles correndo na largada */
      /* de pé, sem ferido nem preso, dos dois lados (dono, 27/08/2026) */
      const vivoR = TO.relacoes.disponiveisIA(E, rival.id);
      if(vivoR < TO.membros.aptosParaOEstadio(E).length * 0.5) return;
      E.ataqueMarcado = {torcida:rival.id, nome:rival.nome, alvo:'bar',
                         cena:'bar', ano:E.data.ano, semana:E.data.semana,
                         dia:E.data.dia};
      avisoDoOlheiro(E, {chave:`bar|${E.data.ano}|${E.data.semana}|${rival.id}`,
                         alvo:'bar', nome:rival.nome});
      return;
    }

    /* a TRETA MARCADA: bairro sorteado, efetivos idênticos */
    const bairros = M().bairrosDe(E.torcida.mapa);
    if(!bairros.length) return;
    const H = TO.mapa.hash;
    const b = bairros[H(ev.chave + '|b') % bairros.length];
    const tam = [5, 7, 10][H(ev.chave + '|n') % 3];
    /* TRETA MARCADA É TRETA APOSTADA (régua do dono, 22/08/2026): de mil
       a seis mil de cada lado, sempre de mil em mil. Quem ganha leva a
       dos dois; quem recusa paga 20% da nossa só pra não descer.
       SEM CAIXA, SEM MENSAGEM: torcida que não cobre a aposta não é
       chamada pra treta — a mensagem nem chega, em vez de chegar como
       uma escolha que não existe. */
    const aposta = (1 + H(ev.chave + '|$') % 6) * 1000;
    if(E.dinheiro < aposta) return;
    const multa = Math.round(aposta * 0.2);
    propor(E, {
      kind:'treta', peso:'decisao', chave:ev.chave, voz:'diretor', tipo:'ruim',
      /* o valor entra na própria frase da diretoria (pedido do dono,
         22/08/2026): a aposta é a notícia, não uma letra miúda de
         botão. O resto do texto é o aprovado, palavra por palavra. */
      texto:`Zona ${b.zona} marcou uma treta no ${b.nome} contra a `+
            `${rival.nome}, ${U.dinheiro(aposta)} de cada lado, `+
            `bora pro problema?`,
      dados:{rival:rival.id, bairro:b.nome, zona:b.zona,
             classe:b.classe, tam, aposta},
      botoes:[
        {id:'bora',  rot:'Bora pro problema', acao:'cena-treta',
         nota:`${tam} de cada lado, só linha de frente, sem pedra nem `+
              `bomba — vencendo leva os ${U.dinheiro(aposta*2)} da roda · `+
              `Prestígio +${tam >= 10 ? 5 : tam >= 7 ? 4 : 3} vencendo, `+
              `−1 perdendo · Relação −2`},
        {id:'ficar', rot:'Ficar de fora', acao:'ignorar-treta',
         nota:`Prestígio −1 · ${U.dinheiro(multa)} de multa (20% da aposta)`}
      ]
    });
  }

  /* -------------------------------------------------------
     3c. A LNT — LIGA NACIONAL DAS TRETAS (pedido do dono,
         22/08/2026)

     A liga nasce nos primeiros dias de 2027 e roda duas edições
     por ano, uma por semestre, POR CIMA do calendário: ela não
     tira a treta marcada nem o dia de jogo, ela ocupa o dia
     vazio. Aqui mora só a porta — quem monta a chave, resolve
     os duelos das outras 137 e guarda a tabela é o TO.lnt.
     ------------------------------------------------------- */
  function lntDeHoje(E){
    const L = TO.lnt;
    if(!L) return;

    /* A FUNDAÇÃO: quarta-feira da primeira semana de 2027 */
    if(!L.existe(E)){
      if(E.data.ano < L.ANO_FUNDACAO) return;
      if(E.data.semana !== 1 || E.data.dia !== 3) return;
      const nasceu = L.fundar(E);
      if(nasceu) anunciarLNT(E, nasceu);
      /* a chave do semestre sai no mesmo dia da fundação: liga fundada
         que só joga daqui a seis meses é papel, não competição */
      const primeira = L.podeAbrir(E) && L.montarEdicao(E);
      if(primeira) abrirEdicaoLNT(E, primeira);
      return;
    }

    /* a edição do semestre é montada na virada dele */
    if(L.podeAbrir(E)){
      const nova = L.montarEdicao(E);
      if(nova) abrirEdicaoLNT(E, nova);
    }

    contarFechamentoLNT(E);
    const passo = L.rodar(E);
    if(passo && passo.meu) chamarParaLNT(E, passo.meu);
    contarFechamentoLNT(E);
  }

  /* a cena da LNT terminou e pode ter fechado a edição: main chama */
  function lntDepoisDaCena(E){ contarFechamentoLNT(E); }

  const DIV_ART = {1:'1ª', 2:'2ª', 3:'3ª', 4:'4ª'};

  /* --- 1 · a fundação --- */
  function anunciarLNT(E, nasceu){
    const minha = (nasceu.divisoes || []).find(d=>
      (E.lnt.composicao[d.n-1]||[]).includes(E.torcida.id));
    propor(E, {
      kind:'lnt-fundacao', peso:'info', voz:'jornal', tipo:'bom',
      chave:`lnt-fundacao|${E.data.ano}`,
      texto:'A LNT foi fundada: 138 torcidas em quatro divisões, '+
            'duas edições por ano, dez contra dez.',
      dados:{ano:nasceu.ano, divisoes:nasceu.divisoes,
             minha: minha ? minha.n : null,
             fora: (E.lnt.fora||[]).length},
      links:[{rot:'Ver a LNT', args:{pagina:'competicoes', nivel:'nacional',
                                pais:'Brasil', comp:'lnt'}}]
    });
  }

  /* --- 2 · a edição abre --- */
  function abrirEdicaoLNT(E, ed){
    const div = ed.divs.find(d=>d.clubes.includes(E.torcida.id));
    if(!div) return;
    const gi = div.grupos.findIndex(g=>g.includes(E.torcida.id));
    const grupo = div.grupos[gi] || [];
    const nomes = grupo.filter(id=>id !== E.torcida.id)
      .map(id=>(M().torcida(id)||{}).nome || id);
    propor(E, {
      kind:'lnt-abertura', peso:'info', voz:'diretor', tipo:'neutro',
      chave:`lnt-abre|${ed.ano}|${ed.semestre}`,
      texto:`Saiu a chave da LNT: estamos na ${div.nome}, no grupo `+
            `${LETRA[gi] || (gi+1)}, contra ${emLista(nomes)}. `+
            `Dez de cada lado, cinco rodadas e depois é mata-mata.`,
      dados:{div:div.n, grupo:gi, ano:ed.ano, semestre:ed.semestre},
      links:[{rot:'Ver a tabela', args:{pagina:'competicoes', nivel:'nacional',
                                pais:'Brasil', comp:'lnt'}}]
    });
  }
  const LETRA = ['A','B','C','D','E','F','G','H','I'];
  /* "a, b, c e d" — a vírgula até a penúltima, "e" antes da última */
  const emLista = l => l.length < 2 ? (l[0] || '')
    : l.slice(0, -1).join(', ') + ' e ' + l[l.length-1];

  /* --- 3 · a nossa vez --- */
  function chamarParaLNT(E, meu){
    const rival = M().torcida(meu.j.a === E.torcida.id ? meu.j.b : meu.j.a)
                  || {nome:'Rival'};
    const grupo = meu.grupo !== undefined && meu.grupo !== null
                ? ` do grupo ${LETRA[meu.grupo] || (meu.grupo+1)}` : '';
    const fase = /rodada/.test(meu.fase)
               ? `${meu.fase}${grupo} da ${meu.div.nome}`
               : `${meu.fase} da ${meu.div.nome}`;
    propor(E, {
      /* KIND PRÓPRIO: treta de LNT não é a treta marcada do
         trimestre — não tem aposta, não sai do calendário da praça e
         quem filtra uma não pode pegar a outra */
      kind:'lnt-treta', peso:'decisao', voz:'diretor', tipo:'neutro',
      chave:`lnt|${E.lnt.edicao.ano}|${E.lnt.edicao.semestre}|`+
            `${E.lnt.edicao.rodadaFeita}`,
      texto:`A LNT marcou a nossa: ${fase} contra a ${rival.nome}, `+
            `dez de cada lado. Quem não bota os dez no campo perde `+
            `por W.O.`,
      dados:{rival:rival.id, bairro:'', tam:10, aposta:0,
             lnt:{div:meu.div.n, nomeDiv:meu.div.nome, fase:meu.fase}},
      botoes:[
        {id:'bora', rot:'Escalar a linha de frente', acao:'cena-treta',
         nota:'10 de cada lado, só linha de frente, sem pedra nem bomba '+
              '— quem ganha segue na LNT · Prestígio +5 vencendo, −1 '+
              'perdendo · Relação −2'},
        {id:'ficar', rot:'Não botar bonde', acao:'lnt-wo',
         nota:'W.O.: a vaga é deles e o prestígio cai 2 · sem briga, '+
              'sem ferido, sem prêmio'}
      ]
    });
  }

  /* --- 4 · a edição fecha --- */
  function contarFechamentoLNT(E){
    const L = TO.lnt, h = (E.lnt && E.lnt.historico) || [];
    if(!L || !h.length) return;
    E.lntContadas = E.lntContadas || 0;
    while(E.lntContadas < h.length){
      const reg = h[E.lntContadas++];
      const meu = reg.nosso;
      const nomeT = id => (M().torcida(id)||{}).nome || id;
      const camp = (reg.campeoes || []).map(c=>({
        div:c.div, campeao:nomeT(c.campeao), vice:nomeT(c.vice),
        sobem: emLista((c.sobem||[]).map(nomeT)),
        caem:  emLista((c.caem||[]).map(nomeT))}));
      propor(E, {
        kind:'lnt-fim', peso:'info', voz:'jornal',
        tipo: meu && /Campeão/.test(meu.fase) ? 'bom'
            : meu && /chaves/.test(meu.fase) ? 'ruim' : 'neutro',
        chave:`lnt-fim|${reg.ano}|${reg.semestre}`,
        texto:`Acabou a LNT: ${camp[0].campeao} é o campeão da 1ª `+
              `Divisão.` + (meu ? ` Nós paramos na ${meu.fase.toLowerCase()}`+
              ` da ${DIV_ART[meu.div]} Divisão.` : ''),
        dados:{ano:reg.ano, semestre:reg.semestre, n:reg.n,
               campeoes:camp, nosso:meu},
        links:[{rot:'Ver a LNT', args:{pagina:'competicoes', nivel:'nacional',
                                pais:'Brasil', comp:'lnt'}}]
      });
    }
  }

  /* -------------------------------------------------------
     3d. O MUNDO DE FORA (pedido do dono, 23/08/2026)

     Três notícias e nada mais: o nosso clube na Libertadores ou na
     Sul-Americana, o campeão de cada uma delas, e o resumo dos nove
     países quando o ano fecha. As ligas de fora não viram mensagem
     rodada a rodada — isso seria uma enxurrada de trinta linhas por
     semana sobre gente que o jogador não conhece. Quem quiser a
     classificação abre Competições → América do Sul.
     ------------------------------------------------------- */
  function mundoDeHoje(E, ctx){
    if(!TO.conmebol || !E.conmebol) return;
    nossoNaConmebol(E, ctx);
    campeoesDaConmebol(E);
    fechamentoDoMundo(E);
  }

  const CM_NOME = {libertadores:'Copa Libertadores',
                   sulamericana:'Copa Sul-Americana'};

  /* --- 1 · o nosso clube jogou lá fora --- */
  function nossoNaConmebol(E, ctx){
    const meu = E.torcida.clubeId;
    if(!meu) return;
    for(const chave of ['libertadores','sulamericana']){
      const c = E.conmebol[chave];
      if(!c || !c.mata || !c.mata.length) continue;
      const ult = c.mata[c.mata.length - 1];
      const j = ult.jogos.find(x=>x.c === meu || x.f === meu);
      if(!j) continue;
      const nossoEmCasa = j.c === meu;
      const rival = M().torcida ? null : null;
      const nomeR = (M().time(nossoEmCasa ? j.f : j.c) || {}).nome || 'o rival';
      const nos = nossoEmCasa ? j.gc : j.gf;
      const deles = nossoEmCasa ? j.gf : j.gc;
      const passou = j.venceu === meu;
      propor(E, {
        kind:'conmebol', peso:'info', voz:'jornal',
        tipo: passou ? 'bom' : 'ruim',
        chave:`cm|${chave}|${E.data.ano}|${ult.fase}`,
        texto:`${E.torcida.clube} ${nos} × ${deles} ${nomeR}, `+
              `${naFaseCM(ult.fase)} da ${CM_NOME[chave]}. `+
              (ult.fase === 'Final'
                ? (passou ? 'É título.' : 'Ficou o vice.')
                : (passou ? 'Passamos de fase.' : 'Fim de linha.')),
        dados:{torneio:CM_NOME[chave], fase:ult.fase, nos, deles, passou},
        links:[{rot:'Ver a chave', args:{pagina:'competicoes',
                nivel:'internacional', comp:chave}}]
      });
    }
  }
  const FASE_CM = {'Fase 3':'na Fase 3', 'Fase Preliminar':'na fase preliminar',
    'Playoff':'no playoff', 'Oitavas':'nas oitavas', 'Quartas':'nas quartas',
    'Semifinal':'na semifinal', 'Final':'na final'};
  const naFaseCM = f => FASE_CM[f] || `na ${String(f||'').toLowerCase()}`;

  /* --- 2 · o campeão da América --- */
  function campeoesDaConmebol(E){
    for(const chave of ['libertadores','sulamericana']){
      const c = E.conmebol[chave];
      if(!c || !c.campeao) continue;
      const nosso = c.campeao === E.torcida.clubeId;
      propor(E, {
        kind:'conmebol-fim', peso:'info', voz:'jornal',
        tipo: nosso ? 'bom' : 'neutro',
        chave:`cm-fim|${chave}|${E.data.ano}`,
        texto: nosso
          ? `${(M().time(c.campeao)||{}).nome} é campeão da `+
            `${CM_NOME[chave]}. O título é nosso também.`
          : `${(M().time(c.campeao)||{}).nome} levantou a `+
            `${CM_NOME[chave]}, com ${(M().time(c.vice)||{}).nome} no vice.`,
        dados:{torneio:CM_NOME[chave], campeao:c.campeao, vice:c.vice},
        links:[{rot:'Ver a chave', args:{pagina:'competicoes',
                nivel:'internacional', comp:chave}}]
      });
    }
  }

  /* --- 3 · o resumo dos nove países, uma vez por ano --- */
  function fechamentoDoMundo(E){
    const h = (E.ligasHistorico || [])[0];
    if(!h) return;
    const nomeT = id => (M().time(id)||{}).nome || '—';
    const linhas = [];
    for(const pais of Object.keys(h.paises)){
      const primeira = h.paises[pais][0];
      if(primeira && primeira.campeao)
        linhas.push(`${pais}: ${nomeT(primeira.campeao)}`);
    }
    if(!linhas.length) return;
    propor(E, {
      kind:'mundo-fim', peso:'info', voz:'jornal', tipo:'neutro',
      chave:`mundo-fim|${h.ano}`,
      texto:`Fecharam as ligas da América do Sul: ${emLista(linhas)}.`,
      dados:{ano:h.ano, linhas},
      links:[{rot:'Ver as ligas', args:{pagina:'competicoes',
              nivel:'nacional', pais:'Argentina'}}]
    });
  }

  /* a emboscada da rota, agendada quando a caravana pega a estrada:
     estado chama isto no primeiro dia de viagem */
  function emboscadaDaViagem(E){
    /* A ESTRADA É DO ITINERÁRIO (régua do dono, 20/08/2026): cada
       praça por onde a caravana passa tem a sua chance, na ida e na
       volta (planejamento.emboscadaNaPraca), e a linha do dia abre a
       cena na parada daquela praça. Uma emboscada só pra viagem
       inteira, marcada aqui na véspera, virou duas contas do mesmo
       fato — esta some, e a função fica porque o calendário chama. */
    if(TO.itinerario) return;
    if(E.ataqueMarcado && !E.ataqueMarcado.resolvido &&
       E.ataqueMarcado.semana === E.data.semana) return;
    const emb = PL().emboscadaDaRota(E);
    if(!emb) return;
    E.ataqueMarcado = {torcida:emb.torcida, nome:emb.nome, alvo:'emboscada',
                       /* a emboscada da estrada abre num dos dois
                          cenários do dono (19/08/2026): o pátio do
                          posto ou a pista fechada com o ônibus */
                       cena: TO.mapa.hash(`embcena|${E.data.absoluto}`) % 2
                             ? 'emb-posto' : 'emb-onibus',
                       cidade:emb.cidade,
                       ano:E.data.ano, semana:E.data.semana, dia:E.data.dia};
  }

  /* -------------------------------------------------------
     4. A BRIGA DA ESCOLTA — aliado que hospedamos/escoltamos
        é atacado na nossa cidade; nossos membros estão juntos
        e o jogador controla os dois efetivos na cena.
     ------------------------------------------------------- */
  function escoltaDeHoje(E){
    for(const a of PL().aliadosNaCidade(E, E.data.semana)){
      if(a.dia !== E.data.dia) continue;
      const nivel = PL().nivelDe(E, a.id);
      if(nivel !== 'escolta' && nivel !== 'churrasco') continue;
      /* quem cai em cima do aliado: a torcida da praça com pior relação
         com ELE — determinístico por dia */
      const rivaisDoAliado = M().torcidasEm(E.torcida.mapa)
        .filter(o=>o.id !== E.torcida.id && !o.incompleta &&
                   !M().saoIrmas(a.id, o.id))
        .map(o=>({o, rel: M().valorInicial(M().relacaoBase(a.id, o.id))}))
        .filter(x=>x.rel <= -15)
        .sort((x,y)=>x.rel - y.rel);
      if(!rivaisDoAliado.length) continue;
      const chave = `escolta|${E.data.ano}|${E.data.semana}|${a.id}`;
      const h = TO.mapa.hash(chave);
      if(h % 100 >= 35) continue;                 // nem toda visita dá briga
      const rival = rivaisDoAliado[h % rivaisDoAliado.length].o;
      const escolta = TO.praca.escoltaDe(E, E.torcida, a.torcida);
      propor(E, {
        kind:'escolta', peso:'decisao', chave, voz:'diretor', tipo:'ruim',
        texto:`A ${rival.nome} caiu em cima da ${a.torcida.nome} aqui na `+
              `nossa cidade — e nossos ${escolta} da escolta estão junto `+
              `com eles. Vamos entrar nessa?`,
        dados:{aliado:a.id, rival:rival.id, escolta,
               aliados: a.estimativa},
        botoes:[
          {id:'entrar', rot:'Entrar na briga', acao:'cena-escolta',
           nota:'abre a cena — Relação +10 com o aliado; o prestígio da '+
                'noite (até ±10) vai pra ele'},
          {id:'fora',   rot:'Ficar de fora',   acao:'abandonar-escolta',
           nota:`−${TO.relacoes.REL.largarAliado} de relação com o aliado`}
        ]
      });
      break;
    }
  }

  /* -------------------------------------------------------
     5 e 6. O PLACAR DO NOSSO JOGO e O RESUMO DO DIA
     ------------------------------------------------------- */
  function placarDoDia(E, jogos){
    if(!jogos || !jogos.length) return;
    const meu = E.torcida.clubeId;
    const nome = id => (M().time(id)||{}).nome || id;
    const mapaDe = id => (M().time(id)||{}).mapa;

    /* A PARTIDA AO VIVO (decisão do dono, 17/08/2026): antes do placar
       sair, o nosso jogo chega como decisão com o botão INICIAR
       PARTIDA. O resultado já existe — foi simulado no fechamento do
       dia —, mas fica escondido: os gols saem conforme a barra de
       minutos avança, com a maior parte caindo dos 30 aos 45 e dos
       75 aos 90. Como decisão, ela segura o relógio: o placar e o
       resumo da rodada só dropam depois do apito final, então nada
       vaza o resultado. */
    /* A DISPUTA VAI DENTRO DA PARTIDA (régua do dono, 21/08/2026):
       se o mata-mata do dia foi pros pênaltis, a série viaja na própria
       mensagem e sai depois do apito. Sem tela separada.
       A SÉRIE É DO JOGO DELA, E DE MAIS NENHUM (correção do dono,
       22/08/2026): a disputa chega aqui numa vaga solta do estado, e
       antes bastava ser um jogo nosso pra ela grudar. Se a vaga
       sobrasse — dois jogos nossos no mesmo dia, um deles de pontos
       corridos — os pênaltis apareciam numa partida de rodada, que não
       decide nada. Agora ela só entra no jogo dos MESMOS DOIS CLUBES
       que a disputaram, e a vaga é esvaziada de qualquer jeito: ou a
       série sai no jogo dela, ou não sai. */
    const meus = jogos.filter(j => j.c === meu || j.f === meu);
    const pendente = E.penaltisPendente;
    const daSerie = pendente && meus.find(j =>
      (pendente.a === j.c && pendente.b === j.f) ||
      (pendente.a === j.f && pendente.b === j.c));
    var penDoDia = daSerie ? pendente : null;
    E.penaltisPendente = null;
    /* o jogo que foi pros pênaltis é o do dia; sem ele, o primeiro */
    const nosso = daSerie || meus[0];
    if(nosso){
      const minutoDeGol = () => {
        const r = U.rng();
        return r < 0.35 ? U.inteiro(30, 45)
             : r < 0.70 ? U.inteiro(75, 90)
             : r < 0.85 ? U.inteiro(1, 29)
             :            U.inteiro(46, 74);
      };
      const gols = [];
      for(let i=0;i<(nosso.gc||0);i++) gols.push({min:minutoDeGol(), lado:'c'});
      for(let i=0;i<(nosso.gf||0);i++) gols.push({min:minutoDeGol(), lado:'f'});
      gols.sort((a,b)=>a.min - b.min);
      /* a posição dos dois na tabela e o palco (pedido do dono,
         17/08/2026) — em fase de mata-mata não há posição, e a frase
         volta ao formato antigo */
      /* A POSIÇÃO É A DE ANTES DA BOLA ROLAR (correção do dono,
         22/08/2026): a mensagem é escrita depois de o dia já ter sido
         simulado, e a tabela lida sem cuidado já trazia o resultado de
         hoje — quem decorava a classificação sabia o placar antes do
         apito. A rodada de hoje não conta pra esta frase. */
      const hoje = {semana:E.data.semana, dia:E.data.dia};
      const p1 = TO.competicoes.posicaoNaTabela(E, nosso.comp, nosso.c, hoje);
      const p2 = TO.competicoes.posicaoNaTabela(E, nosso.comp, nosso.f, hoje);
      const estadio = (M().time(nosso.c)||{}).estadio || '';
      const artEst = /^(Arena|Vila|Fonte|Ilha)/i.test(estadio) ? 'na' : 'no';
      /* A ETAPA NA FRASE (reformulação do dono, 18/08/2026): grupos
         falam "pela 3ª rodada da Copa do Nordeste"; mata-mata fala a
         fase — "pela semifinal (ida)", "pelas quartas", "pela final". */
      const deComp = nosso.compNome
        ? (/^Copa/i.test(nosso.compNome) ? `da ${nosso.compNome}`
                                         : `do ${nosso.compNome}`) : '';
      let etapa = '';
      if(nosso.fase){
        let rot = String(nosso.fase)
          .replace(' · ida', ' (ida)').replace(' · volta', ' (volta)');
        if(/clubes$/i.test(rot)) rot = `fase de ${rot}`;
        const plural = /^(Oitavas|Quartas)/i.test(rot);
        etapa = `, pel${plural ? 'as' : 'a'} `+
                `${rot.charAt(0).toLowerCase()}${rot.slice(1)}`;
      } else if(nosso.rodada){
        etapa = `, pela ${nosso.rodada}ª rodada`;
      }
      const abertura = etapa && deComp ? `${etapa} ${deComp}`
                     : pelaComp(nosso.compNome);
      /* QUEM PÕE GENTE NO ESTÁDIO (pedido do dono, 18/08/2026): uma
         linha com o efetivo de cada torcida dos dois clubes. Jogo na
         nossa praça usa a MESMA conta da rua (naRuaEm — escolta e
         caravana inclusas); jogo fora refaz com as mesmas réguas:
         60% do efetivo pra torcida da casa, caravana pra quem viaja,
         e a nossa saída é a que o planejamento diz. */
      const idsCasa = new Set((M().torcidasDe(nosso.c)||[]).map(o=>o.id));
      const casaMapa = (M().time(nosso.c)||{}).mapa;
      let presentes = [];
      if(casaMapa === E.torcida.mapa && TO.praca && TO.praca.naRuaEm){
        presentes = TO.praca.naRuaEm(E, E.data.dia)
          .filter(b => b.partida && b.partida.casa.id === nosso.c &&
                       b.partida.vis.id === nosso.f)
          .map(b => ({id:b.id, nome:b.nome, n:b.n, casa: idsCasa.has(b.id)}));
      }
      if(!presentes.length){
        for(const lado of ['c','f'])
          for(const o of (M().torcidasDe(nosso[lado])||[])){
            let n;
            if(o.id === E.torcida.id) n = TO.planejamento.efetivoDaSaida(E);
            /* ferido e preso da IA ficam em casa (dono, 27/08/2026) */
            else if(o.mapa === casaMapa)
              n = Math.round(TO.relacoes.disponiveisIA(E, o.id)*0.6);
            else {
              n = TO.planejamento.caravanaDe(o, (E.relacoes||{})[o.id], E);
              if(n < 5) continue;   // caravana pequena demais não viaja
            }
            if(n > 0) presentes.push({id:o.id, nome:o.nome, n, casa: lado==='c'});
          }
      }
      /* A LISTA VIROU TABELA (pedido do dono, 26/08/2026): as torcidas
         presentes saem do texto corrido e vão pra uma linha única de
         colunas, cada uma com a cor primária na borda esquerda —
         quem desenha é o cartão da mensagem, lendo `dados.presenca` */
      propor(E, {
        kind:'partida', peso:'decisao', voz:'jornal',
        chave:`partida|${E.data.ano}|${E.data.semana}|${E.data.dia}|${meu}`,
        texto:`Hoje tem ${nome(nosso.c)} × ${nome(nosso.f)}`+
              `${abertura}. `+
              (p1 && p2 ? `O ${nome(nosso.c)} está em ${p1}º na tabela `+
                          `e o ${nome(nosso.f)} em ${p2}º. ` : '')+
              `A bola vai rolar${estadio ? ` ${artEst} ${estadio}` : ''}.`,
        dados:{casa:nome(nosso.c), fora:nome(nosso.f),
               gc:nosso.gc, gf:nosso.gf, comp:nosso.compNome || '', gols,
               /* o clima do estádio lê quem está lá (dono, 19/08/2026) */
               somosCasa: nosso.c === meu,
               presenca: presentes,
               /* a disputa de pênaltis, na orientação DESTE jogo */
               pen: penDoDia ? (penDoDia.a === nosso.c
                     ? penDoDia.pen
                     : {c:penDoDia.pen.f, f:penDoDia.pen.c,
                        cobrancas:(penDoDia.pen.cobrancas||[]).map(x=>
                          ({...x, lado: x.lado === 'c' ? 'f' : 'c'}))}) : null},
        botoes:[{id:'iniciar', rot:'Iniciar partida', acao:'iniciar-partida'}]
      });
    }
    /* A LINHA "RESULTADO" SAIU (decisão do dono, 22/08/2026): ela dizia
       "Bragantino 1 × 1 Corinthians, pelo Paulistão." logo acima de um
       jornal cuja MANCHETE é esse mesmo placar. Nasceu quando não havia
       jornal nenhum; com a Gazeta na frente, virou eco. O placar do
       nosso jogo continua saindo — na primeira página, que é o lugar
       dele. */

    /* o resumo agrupado, nossa cidade primeiro, com Ver Competições */
    const daCidade = jogos.filter(j => mapaDe(j.c) === E.torcida.mapa && j !== nosso);
    const deFora   = jogos.filter(j => mapaDe(j.c) !== E.torcida.mapa && j !== nosso);
    const linha = j => `${nome(j.c)} ${j.gc} × ${j.gf} ${nome(j.f)}`;
    const ordenados = [...daCidade, ...deFora];
    if(!ordenados.length) return;
    /* O JORNAL SÓ SAI EM DIA DE JOGO NOSSO (decisão do dono,
       21/08/2026): a manchete é o jogo do clube da torcida, então
       rodada em que ele não entrou em campo não vira edição. */
    if(!nosso) return;
    const MOSTRA = 8;
    const resto = ordenados.length - MOSTRA;
    /* A RODADA VIRA PRIMEIRA PÁGINA (régua do dono, 20/08/2026): a
       mensagem passa a carregar os jogos do dia em forma curta, e quem
       arma o jornal é `TO.gazeta`. O `texto` continua aqui — é ele que
       aparece em save antigo, na busca e em qualquer lugar que só saiba
       ler texto corrido. */
    /* O PLACAR DA SÉRIE VIAJA NA MENSAGEM (correção do dono,
       22/08/2026): `pen` era um SIM/NÃO, e o jornal não tinha como
       dizer "5 a 4 na marca da cal" nem quem passou — por isso a
       notícia saía falando só do empate. Vão os dois números; o
       roteiro cobrança a cobrança fica no jogo, que é onde ele serve. */
    const curto = j => ({c:j.c, f:j.f, gc:j.gc, gf:j.gf,
                         comp:j.compNome || '', rod:j.rodada || 0,
                         fase:j.fase || '',
                         pen: j.pen ? {c:j.pen.c, f:j.pen.f} : null,
                         venceu:j.venceu || ''});
    propor(E, {
      kind:'rodada', peso:'info', voz:'jornal',
      chave:`rodada|${E.data.ano}|${E.data.semana}|${E.data.dia}`,
      texto:`Os jogos de ${NOME_DIA[E.data.dia]}: `+
            `${ordenados.slice(0, MOSTRA).map(linha).join(', ')}`+
            `${resto > 0 ? ` e mais ${resto} ${resto===1?'jogo':'jogos'}` : ''}.`,
      dados:{ diaRot: NOME_DIA[E.data.dia],
              nosso: nosso ? curto(nosso) : null,
              jogos: [...(nosso?[nosso]:[]), ...ordenados].map(curto) },
      links:[{rot:'Ver Competições', acao:'painel', args:{pagina:'competicoes'}}]
    });
  }

  /* -------------------------------------------------------
     7. O RESULTADO DE TODO CONFRONTO
        A porta única: todo fecho de cena passa por aqui.
     ------------------------------------------------------- */
  function registrarConfronto(E, d){
    if(!d) return;
    /* toda briga zera o relógio da paz — é ele que deprecia prestígio
       e moral depois de 20 dias parados (decisão do dono) */
    E.ultimaBriga = E.data.absoluto || 0;
    /* o placar de brigas do ano dos dois lados (pedido do dono,
       20/08/2026): é o saldo que aparece no ranking */
    if(TO.relacoes.anotarBriga){
      TO.relacoes.anotarBriga(E, E.torcida.id, !!d.ganhamos);
      const outro = (d.b || {}).torcidaId;
      if(outro && outro !== E.torcida.id)
        TO.relacoes.anotarBriga(E, outro, !d.ganhamos);
    }
    const cena = (d.local && d.local.cena) || '';
    const onde = cena ? nomeDaCena(cena) : 'na rua';
    const bairro = cabeBairro(cena, d.local && d.local.bairro)
                 ? `, no bairro ${d.local.bairro}` : '';
    const a = d.a || {}, b = d.b || {};
    /* as baixas DELES saem de circulação de verdade (conferência do
       dono, 18/08/2026): todo fechamento de briga nossa passa por
       aqui, então é aqui que o ferido e o preso do rival entram nos
       lotes que o ranking e as brigas do mundo já descontam */
    if(b.torcidaId && b.torcidaId !== E.torcida.id && TO.relacoes.baixasIA)
      TO.relacoes.baixasIA(E, b.torcidaId, b.caidos || 0, b.presos || 0);
    /* EMPATE NÃO TEM VENCEDOR (revisão do dono, 22/08/2026): a linha
       lia só `ganhamos`, então briga que saiu igual — as duas fichas
       com o mesmo tanto de ferido — era anunciada como vitória DELES.
       A conta é a mesma que o Futebol e Porrada usa pra decidir a
       manchete, e agora as duas dizem a mesma coisa. */
    const empatou = !d.ganhamos && (a.caidos||0) === (b.caidos||0) &&
                    ((a.caidos||0) || (b.caidos||0) || (a.n||0));
    const vencedor = empatou ? '' : d.ganhamos ? (a.nome || E.torcida.nome)
                                               : (b.nome || '');
    const presosTxt = (a.presos || 0) > 0 ? ` ${a.presos} dos nossos presos.` : '';
    /* ninguém desceu pra segurar: não houve briga, houve prejuízo */
    const semResistencia = !d.ganhamos && !(a.caidos||0) && !(b.caidos||0)
                        && !(a.n||0);
    /* a nossa briga entra na conta da treta do ano pela mesma porta que
       o mundo usa: `brigasIA` não guarda as nossas, então é aqui */
    if(TO.almanaque && TO.almanaque.anotarTreta)
      TO.almanaque.anotarTreta(E, {
        semana:E.data.semana, dia:E.data.dia,
        cidade: onde.replace(/^n[ao]s? /, '').replace(/^num[a]? /, ''),
        ganhouA: !!d.ganhamos,
        a:{id:E.torcida.id, nome:a.nome || E.torcida.nome, n:a.n || 0,
           feridos:a.caidos || 0, presos:a.presos || 0},
        b:{id:d.torcidaId, nome:b.nome || 'Rival', n:b.n || 0,
           feridos:b.caidos || 0, presos:b.presos || 0}
      });
    propor(E, {
      kind:'confronto', peso:'info', tipo: d.ganhamos ? 'boa' : 'ruim',
      voz:'diretor',
      texto: semResistencia
        ? `A ${b.nome} quebrou tudo ${onde}${bairro} e foi embora sem `+
          `encontrar resistência.`
        : `${a.nome || E.torcida.nome} e ${b.nome} se pegaram ${onde}${bairro}: `+
          `${a.caidos||0} ${(a.caidos||0)===1?'ferido nosso':'feridos nossos'}, `+
          `${b.caidos||0} do lado deles.${presosTxt} `+
          `${vencedor ? `A ${vencedor} levou a melhor.` : 'Ninguém levou a melhor.'}`,
      efeitos: d.efeitos || [],
      consequencia: linhaDeConsequencia(d.efeitos || []),
      /* O JORNAL DA BRIGA LÊ DAQUI (pedido do dono, 21/08/2026): a
         mensagem guarda o lugar e o dia junto das baixas, pra Futebol
         e Porrada montar a página sem adivinhar nada. */
      /* O NÚMERO DA EDIÇÃO É CARIMBADO NA HORA: jornal velho não muda
         de número. Se fosse contado no desenho, a briga de janeiro
         apareceria com o número de dezembro. */
      dados:{torcidaId:d.torcidaId, ganhamos:!!d.ganhamos,
             edicao: (E.brigasNossasTotal = (E.brigasNossasTotal || 0) + 1),
             cena, bairro:(d.local && d.local.bairro) || '',
             semResistencia,
             /* duelo de LNT não é treta de esquina: o jornal precisa
                saber a fase e a divisão pra dizer o que estava em jogo */
             lnt: d.lnt || null,
             /* quando descemos pelo aliado escoltado, o jornal precisa
                do nome dele: a manchete é de apoio, não de treta nossa */
             aliado: d.aliado || null,
             a:{nome:a.nome || E.torcida.nome, id:E.torcida.id,
                n:a.n, caidos:a.caidos, presos:a.presos},
             b:{nome:b.nome, id:b.torcidaId,
                n:b.n, caidos:b.caidos, presos:b.presos}}
    });

    /* A PROVOCAÇÃO DO RIVAL (pedido do dono, 18/08/2026): briga
       concluída, o outro lado manda recado — deboche quando ELES
       venceram, promessa de volta quando apanharam. Cai logo depois
       da mensagem do confronto, sem decisão, só veneno.

       SÓ EM BRIGA QUE VALEU PRESTÍGIO (régua do dono, 21/08/2026):
       ninguém manda recado por causa de treta marcada de 5 contra 5.
       A conta é o maior movimento de prestígio da noite — nosso ou
       deles, pra cima ou pra baixo — na régua de 0 a 100 do dono, e
       o corte é 3,5. Isso deixa de fora a treta marcada (1 ponto) e a
       briga de arquibancada miúda (1 a 3), e deixa passar a guerra de
       bar e a cena grande, que chegam a 10. */
    const swingRegua = Math.max(0, ...(d.efeitos || [])
      .filter(x => x.ind === 'prestigio')
      .map(x => Math.abs(x.delta || 0) * 5));
    if(d.torcidaId && b.nome && swingRegua >= PROVOCA_REGUA){
      /* textos aprovados pelo dono (18/08/2026) */
      const DEBOCHE = [
        'Anota a placa aí, teu terror tem nome!',
        'Correram igual galinha, cadê vocês? Ninguém sabe ninguém viu.',
        'Contamos os que correram: faltou dedo pra contar. Fica em '+
          'casa da próxima.'
      ];
      const VOLTA = [
        'Aproveita, porque isso não fica assim. Nosso bonde volta pesado.',
        'Fica tranquilo que a cobrança vem cara!',
        'Riram hoje, choram depois. O revide é pesado.'
      ];
      const lista = d.ganhamos ? VOLTA : DEBOCHE;
      const fala = lista[TO.mapa.hash(
        `provoca|${E.data.absoluto}|${d.torcidaId}`) % lista.length];
      propor(E, {
        kind:'provocacao', peso:'info', voz:'rua',
        tipo: d.ganhamos ? '' : 'ruim',
        texto:`${fala} — ${b.nome}`
      });
    }
  }

  const NOMES_CENA = {
    arredores:'nos arredores do estádio', praca:'na praça',
    rua:'numa rua de periferia', 'rua-media':'numa rua de classe média',
    'rua-nobre':'numa rua de classe alta', bar:'no bar', comercio:'no comércio',
    ct:'no CT', sede:'na sede', loja:'na loja', subsede:'na subsede',
    /* as cenas que faltavam: sem elas toda briga de arquibancada, de
       treta marcada e de emboscada caía no 'na rua' e ainda ganhava um
       ", no bairro arquibancada" atrás (correção do dono, 21/08/2026).
       Os nomes saem da própria cena, que já traz a linha do local */
    'estadio-10':'na arquibancada', 'estadio-20':'na arquibancada',
    'estadio-40':'na arquibancada',
    'treta-beco':'no beco', 'treta-galpao':'no pátio do galpão',
    'treta-campo':'no campo de terra',
    'emb-posto':'no posto', 'emb-onibus':'na estrada'
  };
  const nomeDaCena = c => NOMES_CENA[c] || 'na rua';
  /* ONDE NÃO EXISTE BAIRRO: arquibancada e estrada não são endereço de
     bairro nenhum, então a briga que acontece nelas fecha a frase no
     nome do lugar. Nas outras o bairro entra como complemento */
  const CENA_SEM_BAIRRO = ['estadio-10','estadio-20','estadio-40','emb-onibus'];
  const cabeBairro = (cena, bairro) =>
    !!bairro && CENA_SEM_BAIRRO.indexOf(cena) < 0 &&
    NOMES_CENA[cena] !== `na ${bairro}` && NOMES_CENA[cena] !== `no ${bairro}`;

  /* =======================================================
     AS RESPOSTAS
     `responder` executa o que dá pra executar aqui (estado) e
     devolve uma diretiva de tela pra casca abrir.
     ======================================================= */
  function responder(E, idMsg, idBotao){
    caixas(E);
    const m = E.feed.find(x=>x.id === idMsg);
    if(!m || !m.botoes) return {ok:false};
    const b = m.botoes.find(x=>x.id === idBotao);
    if(!b || m.respondido) return {ok:false};

    const marcar = rot => { m.respondido = {botao:idBotao, rot:rot || b.rot}; };

    switch(b.acao){
      /* --- as que resolvem aqui --- */
      case 'nada':
        marcar();
        return {ok:true};
      case 'tela-assalto':
        /* a lista de alvos também dá pra fechar sem assaltar */
        return {ok:true, abrir:{tela:'tela-assalto', msg:m,
                                cancelavel:true, botao:idBotao}};
      case 'iniciar-partida':
        /* O DIA COMEÇA, A BOLA NÃO (correção do dono, 20/08/2026): este
           botão abre o ITINERÁRIO — concentração, pista, arredores. A
           partida só começa quando a linha chegar na parada do jogo, e
           quem acende `iniciada` é ela. Ligar o cronômetro aqui fazia o
           relógio do jogo correr durante a concentração inteira, e a
           gente chegava no estádio com o jogo no segundo tempo.
           NÃO marca respondido: o relógio do feed segue preso até o
           apito final, que chega por encerrarPartida(). */
        m.dados = m.dados || {};
        m.dados.dia = true;
        return {ok:true};
      case 'paz':
        PL().definirIntencao(E, 'paz');
        marcar();
        return {ok:true};
      case 'paz-praca':
        PL().definirInvestida(E, b.args.chaveJogo, null);
        marcar();
        return {ok:true};
      case 'paz-grupo':
        /* paz em tudo que o relatório do dia cobria */
        PL().definirIntencao(E, 'paz');
        for(const g of (b.args.grupos||[]))
          if(g.chaveJogo) PL().definirInvestida(E, g.chaveJogo, null);
        marcar();
        return {ok:true};
      case 'padrao-grupo': {
        const pol = PL().politicas(E);
        const feito = PL().aplicarPolitica(E);
        const nomes = [];
        if(feito.alvo) nomes.push(feito.alvo);
        for(const g of (b.args.grupos||[])){
          if(!g.chaveJogo) continue;
          const og = PL().outrosJogosNaCidade(E, E.data.semana)
            .find(x=>x.chave === g.chaveJogo);
          if(!og) continue;
          const alvos = PL().alvosDaPolitica(E, og.visitantes, pol.outros);
          if(alvos.length){
            PL().definirInvestida(E, og.chave,
              {alvo:alvos[0].id, como:'arredores', olheiro:null});
            nomes.push(alvos[0].torcida.nome);
          }
        }
        marcar(nomes.length ? `Seguir padrão — atacar ${nomes.join(', ')}`
                            : 'Seguir padrão — ir em paz');
        return {ok:true};
      }
      case 'seguir-padrao': {
        const feito = PL().aplicarPolitica(E);
        marcar(feito.alvo ? `Seguir padrão — atacar ${feito.alvo}`
                          : 'Seguir padrão — ir em paz');
        return {ok:true};
      }
      case 'seguir-padrao-praca': {
        const pol = PL().politicas(E);
        const og = PL().outrosJogosNaCidade(E, E.data.semana)
          .find(x=>x.chave === b.args.chaveJogo);
        if(og){
          const alvos = PL().alvosDaPolitica(E, og.visitantes, pol.outros);
          const alvo = alvos.length ? alvos[0] : null;
          if(alvo) PL().definirInvestida(E, og.chave,
            {alvo:alvo.id, como:'arredores', olheiro:null});
          marcar(alvo ? `Seguir padrão — cair em cima da ${alvo.torcida.nome}`
                      : 'Seguir padrão — deixar passar');
        }else marcar('Seguir padrão — deixar passar');
        return {ok:true};
      }
      case 'fugir-defesa': {
        marcar();
        naoDesceu(E, E.ataqueMarcado);
        return {ok:true};
      }
      case 'abandonar-escolta': {
        /* deixar o aliado apanhando sozinho cobra a relação */
        const d = m.dados || {};
        if(d.aliado){
          E.relacoes[d.aliado] = U.limitar(
            (E.relacoes[d.aliado]||0) - TO.relacoes.REL.largarAliado, -100, 100);
        }
        marcar();
        return {ok:true};
      }

      /* o bar do rival da cidade (texto do dono, 18/08/2026): abre a
         mesma cena do ataque manual, com o mesmo limite semanal */
      case 'atacar-bar-rival': {
        const r = TO.acoes.executar(E, 'atacar', {alvo:(m.dados||{}).alvo});
        if(!(r && r.ok)){
          marcar('Atacar o bar — não rolou');
          m.consequencia = r && r.msg ? `Não rolou: ${r.msg}` : 'Não rolou.';
          return {ok:true};
        }
        marcar();
        return {ok:true, abrir:{tela:'cena-acao', args:{cena:r.cena},
                                simular: !!b.simular}};
      }

      /* a descida do núcleo da SUB-SEDE (dono, 26/08/2026): o olheiro
         de lá sugeriu, o chefe mandou — o núcleo desce sozinho e a
         briga se resolve por simulação, caindo no feed como qualquer
         ataque a bar */
      case 'filial-ataque': {
        const d = m.dados || {};
        const rival = M().torcida(d.rival);
        const nucleo = TO.membros.aptosDaFilial(E, d.cidade);
        if(!rival || nucleo.length < 4){
          marcar('Atacar — não rolou');
          m.consequencia = 'Não rolou: o núcleo de lá não tem gente de pé.';
          return {ok:true};
        }
        const ef = TO.acoes.efetivoDePe(E, rival) || 30;
        const defensores = Math.min(40, Math.max(4, Math.round(ef * 0.35)));
        /* como no ataque manual, o nosso bonde é o mandante da cena —
           fecharAtaque lê `res.venceu`, que é a vitória do mandante */
        const res = TO.diaJogo.simular.rodar({config:{
          escalacao: nucleo, efetivoRival: defensores,
          bondes:[{nossa:true, lado:'mandante', n:nucleo.length}]}});
        /* todo ocorrido mexe no prestígio (ordem do dono, 27/08/2026) */
        if(!res.prestigio) res.prestigio = res.ganhamos ? 1 : -1;
        TO.membros.aplicarResultadoDaNoite(E, res);
        TO.acoes.fecharCena(E, {acao:'atacar', alvo:{
          torcidaId:rival.id, nome:rival.nome, deQuem:rival.nome,
          tipo:'bar', cena:'bar',
          bairro:TO.financeiro.nomeCidade(d.cidade),
          nossos:nucleo.length, efetivo:defensores}}, res);
        marcar();
        return {ok:true};
      }

      /* recusas com preço (dono, 19/08/2026) */
      case 'ignorar-treta': {
        marcar();
        TO.estado.mexerIndicador(E, 'prestigio', -0.2,
          'Ficamos de fora da treta marcada');
        /* RECUSAR TEM PREÇO EM DINHEIRO (régua do dono, 22/08/2026):
           20% da aposta fica na mão de quem marcou. Combinar e não
           descer sai mais barato que perder, mas não sai de graça. */
        const ap = (m.dados && m.dados.aposta) || 0;
        const multa = Math.round(ap * 0.2);
        if(multa > 0) TO.estado.lancar(E, 'Multa por recusar a treta', -multa);
        m.consequencia = 'Ficamos de fora. Prestígio −1' +
          (multa > 0 ? ` · ${U.dinheiro(multa)} de multa.` : '.');
        return {ok:true};
      }
      /* W.O. NA LNT (régua do dono, 22/08/2026): não botar bonde é
         entregar a vaga. Sem briga, sem ferido, sem prêmio — e o
         prestígio cai o dobro do que cai numa treta recusada, que
         faltar em competição pesa mais que furar um combinado. */
      case 'lnt-wo': {
        marcar();
        TO.estado.mexerIndicador(E, 'prestigio', -0.4,
          'W.O. na LNT');
        const reg = TO.lnt && TO.lnt.registrarNosso(E,
          {ganhamos:false, nossos:0, deles:0, wo:true});
        m.consequencia = 'Não botamos bonde: perdemos por W.O. '+
                         'Prestígio −2.';
        contarFechamentoLNT(E);
        return {ok:true};
      }
      case 'ignorar-bar-rival': {
        marcar();
        TO.estado.mexerIndicador(E, 'prestigio', -0.2,
          'Deixamos o bar do rival quieto');
        TO.estado.mexerIndicador(E, 'moral', -1,
          'Deixamos o bar do rival quieto');
        m.consequencia = 'Deixamos quieto. Prestígio −1 · Moral −1.';
        return {ok:true};
      }

      /* --- aniversários (textos do dono, 18/08/2026) --- */
      case 'aniv-ir': {
        marcar();
        const id = (m.dados||{}).torcida;
        TO.estado.lancar(E, `Presença na festa da ${(m.dados||{}).nome}`, -2000);
        E.relacoes = E.relacoes || {};
        E.relacoes[id] = Math.max(-100, Math.min(100,
          TO.relacoes.nivel(E, id) + TO.relacoes.REL.irAniversario));
        /* aparecer na festa é gesto: zera o relógio da indiferença */
        TO.relacoes.marcarAjuda(E, id);
        m.consequencia = `Fomos. +${TO.relacoes.REL.irAniversario} de relação `+
                         `com a ${(m.dados||{}).nome}.`;
        return {ok:true};
      }
      case 'aniv-nao': {
        marcar();
        const id = (m.dados||{}).torcida;
        E.relacoes = E.relacoes || {};
        E.relacoes[id] = Math.max(-100, Math.min(100,
          TO.relacoes.nivel(E, id) - TO.relacoes.REL.furarAniversario));
        /* furar aniversário de aliado queima na rua (régua do dono,
           18/08/2026): −2 de prestígio na régua de 0-100 */
        TO.estado.mexerIndicador(E, 'prestigio', -0.4,
          `Furamos o aniversário da ${(m.dados||{}).nome}`);
        m.consequencia = `Ficamos em casa. −${TO.relacoes.REL.furarAniversario} `+
                         `de relação com a ${(m.dados||{}).nome} · `+
                         `Prestígio nosso −2.`;
        return {ok:true};
      }
      case 'aniv-festa': {
        marcar();
        const d = m.dados || {};
        const F = FESTA_ANIV[d.tipo] || FESTA_ANIV.torcida;
        const f = F[idBotao];
        if(!f) return {ok:true};
        const quem = d.tipo === 'torcida' ? 'da torcida' : 'do clube';
        if(idBotao === 'nada'){
          TO.estado.mexerIndicador(E, 'moral', f.moral,
            `Aniversário ${quem} passou em branco`);
          m.consequencia = 'Ninguém fez nada. −2 de moral.';
        } else {
          TO.estado.lancar(E, `Festa de aniversário ${quem}`, -f.custo);
          TO.estado.mexerIndicador(E, 'moral', f.moral,
            `Festa de aniversário ${quem}`);
          (E.festasAniversario = E.festasAniversario || {})
            [`festa-${d.tipo}|${d.anoCivil}`] = idBotao;
          m.consequencia = `Festa ${idBotao === 'grande' ? 'grande' : 'simples'} `+
            `marcada: ${U.dinheiro(-f.custo)} agora, a receita sai no dia.`;
        }
        return {ok:true};
      }
      /* --- as telas que DÃO PRA CANCELAR (correção do dono,
         21/08/2026): abrir não é responder. Estas não marcam nada
         aqui — quem marca é o Confirmar delas. Fechar volta pro feed
         com a decisão ainda de pé e o relógio parado, que é o que o
         `travado(E)` faz enquanto a mensagem não tem resposta.
         Antes elas marcavam na abertura, e fechar a tela valia como
         ter decidido: o turno era consumido sem nada ter acontecido. */
      case 'tela-ataque':
      case 'tela-caravana':
        return {ok:true, abrir:{tela:b.acao, args:b.args || {}, msg:m,
                                simular: !!b.simular,
                                cancelavel:true, botao:idBotao}};

      /* --- as que JÁ SÃO a ação: a cena aconteceu no clique, e as
         duas de abertura não têm o que cancelar (não existe outro
         botão nelas) --- */
      case 'tela-ideologia':
      case 'painel-expediente':
      case 'cena-guerra':
      case 'cena-defesa':
      case 'cena-escolta':
      case 'cena-treta':
        marcar();
        return {ok:true, abrir:{tela:b.acao, args:b.args || {}, msg:m,
                                simular: !!b.simular}};
      case 'painel':
        /* link informativo não consome nada */
        m.respondido = null;
        return {ok:true, abrir:{tela:'painel', args:b.args || {}}};
    }
    return {ok:false};
  }

  /* A RESPOSTA QUE VEM DA TELA (correção do dono, 21/08/2026): as
     telas canceláveis são abertas sem responder a mensagem, e chamam
     isto no Confirmar delas. Sem isso a decisão ficaria de pé pra
     sempre e o relógio nunca voltaria a andar. */
  function marcarResposta(E, idMsg, idBotao, rot){
    const m = (E.feed || []).find(x => x.id === idMsg);
    if(!m || m.respondido) return false;
    const b = (m.botoes || []).find(x => x.id === idBotao);
    m.respondido = {botao:idBotao, rot: rot || (b && b.rot) || 'feito'};
    return true;
  }

  /* NÃO DESCER É ENTREGAR: a defesa se resolve como derrota sem cena.
     Mora aqui, e não dentro do botão, porque o itinerário do dia de
     jogo oferece a mesma escolha nas paradas dele — e a conta tem de
     ser a mesma, saindo pela mesma porta. */
  function naoDesceu(E, a){
    if(!a || a.resolvido) return null;
    a.resolvido = true;
    const alvo = alvoDaDefesa(E, a);
    alvo.nossos = 0;                  // ninguém desceu: não houve briga
    return TO.acoes.fecharCena(E, {acao:'defender', alvo},
                               {ganhamos:false, membros:[],
                                caidosMandante:0, caidosVisitante:0});
  }

  /* o alvo que `fecharDefesa` espera, montado do ataque marcado */
  function alvoDaDefesa(E, a){
    const o = M().torcida(a.torcida) || {nome:a.nome};
    const est = TO.planejamento.estimativaCaravana(E);
    /* ataque vindo de FILIAL (dono, 25/08/2026): o nome já vem
       decorado ("Jovem Fla Sub-Sede Fortaleza") e o efetivo é o do
       núcleo local, não o da torcida inteira */
    return {torcidaId:a.torcida, nome:a.nome || o.nome,
            tipo: a.alvo === 'emboscada' ? 'emboscada'
                : a.alvo === 'bar' ? 'bar' : a.alvo,
            cena: a.cena,
            bairro: '',
            efetivo: a.efetivo || TO.acoes.efetivoDePe(E, o) || 30,
            nossos: a.alvo === 'emboscada' && est ? est.vao
                   : TO.membros.aptosParaOEstadio(E).length,
            rateio: a.alvo === 'emboscada' && est ? est.rateio : 0};
  }

  /* o apito final da partida ao vivo: fecha a decisão e libera o
     relógio — quem chama é o cartão, quando a barra chega aos 90' */
  function encerrarPartida(E, idMsg){
    caixas(E);
    const m = E.feed.find(x=>x.id === idMsg);
    if(!m || m.kind !== 'partida' || m.respondido) return {ok:false};
    const d = m.dados || {};
    m.respondido = {botao:'fim', rot:'Fim de jogo'};
    /* O FIM DA NOSSA PARTIDA CONTA A VAGA (crivo do dono, 22/08/2026):
       empatou no mata-mata, a linha dizia só o placar do tempo normal e
       o jogador ficava sem saber quem passou. E "pelo Copa do Brasil"
       virou "pela": o artigo agora sai do mesmo `pelaComp` do resto. */
    const pen = d.pen;
    const quemPassa = pen ? (pen.c > pen.f ? d.casa : d.fora) : '';
    m.consequencia = `Final: ${d.casa} ${d.gc} × ${d.gf} ${d.fora}`+
                     (d.comp ? `${pelaComp(d.comp)}.` : '.')+
                     (pen ? ` Nos pênaltis, ${Math.max(pen.c,pen.f)} a `+
                            `${Math.min(pen.c,pen.f)}: quem passa é o `+
                            `${quemPassa}.` : '');
    return {ok:true};
  }

  return {INTERVALO_DROP,
          propor, dropar, pendentes, travado, decisaoAberta,
          abertura, eventosDoDia, emboscadaDaViagem,
          lntDeHoje, lntDepoisDaCena, mundoDeHoje,
          registrarConfronto, responder, marcarResposta,
          avisoDoOlheiro, nivelDaCampana,
          alvoDaDefesa, encerrarPartida,
          linhaDeConsequencia, nomeDaCena, NOME_DIA,
          SOFRIDO, naoDesceu};
})();
