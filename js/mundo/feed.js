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
  function propor(E, msg){
    caixas(E);
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
    ataqueSofridoHoje(E);
    escoltaDeHoje(E);
    assaltoDeHoje(E);
    barRivalDeHoje(E);
    aniversariosDeHoje(E);
    placarDoDia(E, ctx.jogos || []);
    brigasDaSemana(E);
    dicaDeHoje(E);
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
    'O professor de MMA custa R$ 2.000 por mês e faz cada treino render o dobro de força e defesa. Contrata e dispensa no Financeiro → Patrimônio.',
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
    'Treta marcada tem palco pelo tamanho: 5x5 no beco, 7x7 no galpão, 10x10 no campo de terra. Vencer paga +3/+4/+5 de prestígio; perder custa −1 (e −1 de moral de quem foi); recusar custa −1 de prestígio.',
    'Ataque a bar tem teto: no máximo 60 atacantes contra 40 defensores. E o bonde só sai pra UM ataque manual por semana.',
    'Ferido volta em 5 a 15 dias; preso fica de 15 a 90. Enquanto estão fora, não treinam, não brigam e não contam no ranking.',
    'A ida à delegacia solta presos em bloco com fiança 25% mais barata — do mais barato pro mais caro, até onde o caixa alcançar.',
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
    'A campanha de recrutamento custa R$ 5.000 e estica o teto da sede em 50% por duas semanas — o empurrão pra crescer quando a sede é o gargalo.',
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
     3d. AS BRIGAS DA SEMANA (decisão do dono, 17/08/2026):
         toda segunda o jornal resume as brigas que o mundo
         teve na semana anterior — quem brigou e quem venceu
         numa coluna, as baixas de cada lado na outra, as
         maiores brigas primeiro.
     ------------------------------------------------------- */
  function brigasDaSemana(E){
    if(E.data.dia !== 1) return;
    const sAnt = E.data.semana - 1;
    if(sAnt < 1) return;
    const brigas = (E.brigasIA||[])
      .filter(b=>b.ano === E.data.ano && b.semana === sAnt);
    if(!brigas.length) return;
    const ord = [...brigas].sort((x,y)=>(y.a.n+y.b.n)-(x.a.n+x.b.n));
    const MOSTRA = 5;   // só as 5 maiores na notícia (decisão do dono)
    propor(E, {
      kind:'brigas', peso:'info', voz:'jornal',
      chave:`brigas|${E.data.ano}|${sAnt}`,
      texto:`As brigas da semana pelo país: ${brigas.length} `+
            `${brigas.length===1 ? 'registrada' : 'registradas'}, `+
            `as maiores primeiro.`,
      dados:{brigas: ord.slice(0, MOSTRA),
             resto: Math.max(0, ord.length - MOSTRA)},
      links:[{rot:'Ver todas', acao:'painel',
              args:{pagina:'noticias', aba:'brigas'}}]
    });
  }

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
         em torno de 15 vezes no ano, um diretor aponta o bar
         de um rival DA CIDADE e pergunta se o bonde desce.
         Atacar abre a mesma cena do ataque manual — com o
         mesmo limite de um bonde por semana.
     ------------------------------------------------------- */
  function barRivalDeHoje(E){
    const sa = TO.relacoes.semanaAbs(E);
    const H = TO.mapa.hash;
    /* ~29% das semanas têm a sugestão: 0,29 × 52 ≈ 15 por ano */
    if(H(`barrival|${sa}|${E.torcida.id}`) % 100 >= 29) return;
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
      texto:`Chefe, o bar da ${alvo.deQuem} no ${alvo.bairro} tá de porta `+
            `aberta e gaveta cheia. Bora quebrar o balcão?`,
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
      if(!ests.filter(x=>x.hostil).length) continue;   // sem rival, sem pauta
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
    let texto = `Chefe, o relatório de hoje. `+
                `Nós saímos com até ${nossos}. Vamos pra cima de alguém?`;
    const botoes = [
      {id:'atacar', rot:'Atacar', acao:'tela-ataque',
       args:{ctx:{grupos}}},
      {id:'paz',    rot:'Ir em paz', acao:'paz-grupo', args:{grupos}},
      {id:'padrao', rot:'Seguir padrão', acao:'padrao-grupo', args:{grupos}}
    ];
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
    propor(E, {
      kind:'olheiro', peso:'decisao', voz:'olheiro',
      chave:`olheiro|${E.data.ano}|${E.data.semana}|${hoje}`,
      texto, dados:{grupos, fora:!!fora, tabela}, botoes
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
      const vivoR = ((E.mundoTorcidas||{})[rival.id]||{}).membros
                  || rival.membros || 0;
      if(vivoR < E.membros.length * 0.5) return;
      E.ataqueMarcado = {torcida:rival.id, nome:rival.nome, alvo:'bar',
                         cena:'bar', ano:E.data.ano, semana:E.data.semana,
                         dia:E.data.dia};
      return;
    }

    /* a TRETA MARCADA: bairro sorteado, efetivos idênticos */
    const bairros = M().bairrosDe(E.torcida.mapa);
    if(!bairros.length) return;
    const H = TO.mapa.hash;
    const b = bairros[H(ev.chave + '|b') % bairros.length];
    const tam = [5, 7, 10][H(ev.chave + '|n') % 3];
    propor(E, {
      kind:'treta', peso:'decisao', chave:ev.chave, voz:'diretor', tipo:'ruim',
      texto:`Zona ${b.zona} marcou uma treta no ${b.nome} contra a `+
            `${rival.nome}, bora pro problema?`,
      dados:{rival:rival.id, bairro:b.nome, zona:b.zona,
             classe:b.classe, tam},
      botoes:[
        {id:'bora',  rot:'Bora pro problema', acao:'cena-treta',
         nota:`${tam} de cada lado, sem pedra nem bomba — Prestígio `+
              `+${tam >= 10 ? 5 : tam >= 7 ? 4 : 3} vencendo, −1 perdendo · `+
              `Relação −2 · moral de quem foi: +2 na vitória, −1 na derrota`},
        {id:'ficar', rot:'Ficar de fora', acao:'ignorar-treta',
         nota:'Prestígio −1'}
      ]
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
           nota:'−15 de relação com o aliado'}
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
    const nosso = jogos.find(j => j.c === meu || j.f === meu);
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
      const p1 = TO.competicoes.posicaoNaTabela(E, nosso.comp, nosso.c);
      const p2 = TO.competicoes.posicaoNaTabela(E, nosso.comp, nosso.f);
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
            else if(o.mapa === casaMapa)
              n = Math.round(TO.acoes.efetivoDe(E, o)*0.6);
            else {
              n = TO.planejamento.caravanaDe(o, (E.relacoes||{})[o.id], E);
              if(n < 5) continue;   // caravana pequena demais não viaja
            }
            if(n > 0) presentes.push({id:o.id, nome:o.nome, n, casa: lado==='c'});
          }
      }
      const listaDe = casa => presentes.filter(p=>p.casa===casa)
        .sort((a,b)=>b.n-a.n).map(p=>`${p.nome} ${p.n}`).join(' · ') || 'ninguém';
      const linhaTorcidas = presentes.length
        ? ` Mandante: ${listaDe(true)}. Visitante: ${listaDe(false)}.` : '';
      propor(E, {
        kind:'partida', peso:'decisao', voz:'jornal',
        chave:`partida|${E.data.ano}|${E.data.semana}|${E.data.dia}|${meu}`,
        texto:`Hoje tem ${nome(nosso.c)} × ${nome(nosso.f)}`+
              `${abertura}. `+
              (p1 && p2 ? `O ${nome(nosso.c)} está em ${p1}º na tabela `+
                          `e o ${nome(nosso.f)} em ${p2}º. ` : '')+
              `A bola vai rolar${estadio ? ` ${artEst} ${estadio}` : ''}.`+
              linhaTorcidas,
        dados:{casa:nome(nosso.c), fora:nome(nosso.f),
               gc:nosso.gc, gf:nosso.gf, comp:nosso.compNome || '', gols,
               /* o clima do estádio lê quem está lá (dono, 19/08/2026) */
               somosCasa: nosso.c === meu,
               presenca: presentes},
        botoes:[{id:'iniciar', rot:'Iniciar partida', acao:'iniciar-partida'}]
      });
    }
    /* a mensagem individual do NOSSO jogo */
    if(nosso){
      const somosCasa = nosso.c === meu;
      const gp = somosCasa ? nosso.gc : nosso.gf;
      const gc = somosCasa ? nosso.gf : nosso.gc;
      const tipo = gp > gc ? 'boa' : gp < gc ? 'ruim' : '';
      propor(E, {
        kind:'placar', peso:'info', tipo, voz:'jornal',
        chave:`placar|${E.data.ano}|${E.data.semana}|${E.data.dia}|${meu}`,
        texto:`${nome(nosso.c)} ${nosso.gc} × ${nosso.gf} ${nome(nosso.f)}`+
              `${pelaComp(nosso.compNome)}.`
      });
    }

    /* o resumo agrupado, nossa cidade primeiro, com Ver Competições */
    const daCidade = jogos.filter(j => mapaDe(j.c) === E.torcida.mapa && j !== nosso);
    const deFora   = jogos.filter(j => mapaDe(j.c) !== E.torcida.mapa && j !== nosso);
    const linha = j => `${nome(j.c)} ${j.gc} × ${j.gf} ${nome(j.f)}`;
    const ordenados = [...daCidade, ...deFora];
    if(!ordenados.length) return;
    const MOSTRA = 8;
    const resto = ordenados.length - MOSTRA;
    propor(E, {
      kind:'rodada', peso:'info', voz:'jornal',
      chave:`rodada|${E.data.ano}|${E.data.semana}|${E.data.dia}`,
      texto:`Os jogos de ${NOME_DIA[E.data.dia]}: `+
            `${ordenados.slice(0, MOSTRA).map(linha).join(', ')}`+
            `${resto > 0 ? ` e mais ${resto} ${resto===1?'jogo':'jogos'}` : ''}.`,
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
    const onde = d.local && d.local.cena ? nomeDaCena(d.local.cena) : 'na rua';
    const bairro = d.local && d.local.bairro ? `, no bairro ${d.local.bairro}` : '';
    const a = d.a || {}, b = d.b || {};
    /* as baixas DELES saem de circulação de verdade (conferência do
       dono, 18/08/2026): todo fechamento de briga nossa passa por
       aqui, então é aqui que o ferido e o preso do rival entram nos
       lotes que o ranking e as brigas do mundo já descontam */
    if(b.torcidaId && b.torcidaId !== E.torcida.id && TO.relacoes.baixasIA)
      TO.relacoes.baixasIA(E, b.torcidaId, b.caidos || 0, b.presos || 0);
    const vencedor = d.ganhamos ? (a.nome || E.torcida.nome) : (b.nome || '');
    const presosTxt = (a.presos || 0) > 0 ? ` ${a.presos} dos nossos presos.` : '';
    /* ninguém desceu pra segurar: não houve briga, houve prejuízo */
    const semResistencia = !d.ganhamos && !(a.caidos||0) && !(b.caidos||0)
                        && !(a.n||0);
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
      dados:{torcidaId:d.torcidaId, ganhamos:!!d.ganhamos,
             a:{nome:a.nome, n:a.n, caidos:a.caidos, presos:a.presos},
             b:{nome:b.nome, n:b.n, caidos:b.caidos, presos:b.presos}}
    });

    /* A PROVOCAÇÃO DO RIVAL (pedido do dono, 18/08/2026): briga
       concluída, o outro lado manda recado — deboche quando ELES
       venceram, promessa de volta quando apanharam. Cai logo depois
       da mensagem do confronto, sem decisão, só veneno. */
    if(d.torcidaId && b.nome){
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
    ct:'no CT', sede:'na sede', loja:'na loja', subsede:'na subsede'
  };
  const nomeDaCena = c => NOMES_CENA[c] || 'na rua';

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
        marcar();
        return {ok:true, abrir:{tela:'tela-assalto'}};
      case 'iniciar-partida':
        /* a bola rola: NÃO marca respondido — o relógio do feed segue
           preso até o apito final, que chega por encerrarPartida() */
        m.dados = m.dados || {};
        m.dados.iniciada = true;
        m.dados.t0 = Date.now();
        m.dados.minAcum = 0;      // minutos já rolados (pause/velocidade)
        m.dados.vel = 4;          // 1×, 2× ou 4× — o padrão é 4×
        m.dados.pausada = false;
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
          E.relacoes[d.aliado] = U.limitar((E.relacoes[d.aliado]||0) - 15, -100, 100);
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
        return {ok:true, abrir:{tela:'cena-acao', args:{cena:r.cena}}};
      }

      /* recusas com preço (dono, 19/08/2026) */
      case 'ignorar-treta': {
        marcar();
        TO.estado.mexerIndicador(E, 'prestigio', -0.2,
          'Ficamos de fora da treta marcada');
        m.consequencia = 'Ficamos de fora. Prestígio −1.';
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
          TO.relacoes.nivel(E, id) + 3));
        /* aparecer na festa é gesto: zera o relógio da indiferença */
        TO.relacoes.marcarAjuda(E, id);
        m.consequencia = `Fomos. +3 de relação com a ${(m.dados||{}).nome}.`;
        return {ok:true};
      }
      case 'aniv-nao': {
        marcar();
        const id = (m.dados||{}).torcida;
        E.relacoes = E.relacoes || {};
        E.relacoes[id] = Math.max(-100, Math.min(100,
          TO.relacoes.nivel(E, id) - 3));
        /* furar aniversário de aliado queima na rua (régua do dono,
           18/08/2026): −2 de prestígio na régua de 0-100 */
        TO.estado.mexerIndicador(E, 'prestigio', -0.4,
          `Furamos o aniversário da ${(m.dados||{}).nome}`);
        m.consequencia = `Ficamos em casa. −3 de relação com a `+
                         `${(m.dados||{}).nome} · Prestígio nosso −2.`;
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
      /* --- as que a casca abre em tela --- */
      case 'tela-ideologia':
      case 'painel-expediente':
      case 'tela-ataque':
      case 'tela-caravana':
      case 'cena-guerra':
      case 'cena-defesa':
      case 'cena-escolta':
      case 'cena-treta':
        marcar();
        return {ok:true, abrir:{tela:b.acao, args:b.args || {}, msg:m}};
      case 'painel':
        /* link informativo não consome nada */
        m.respondido = null;
        return {ok:true, abrir:{tela:'painel', args:b.args || {}}};
    }
    return {ok:false};
  }

  /* o alvo que `fecharDefesa` espera, montado do ataque marcado */
  /* O DIA FICA NO FEED COMO REGISTRO (decisão do dono, 20/08/2026).
     Terminado o itinerário, a linha inteira vira uma mensagem de
     informação: parada por parada, com a hora de cada uma e uma marca
     em quem virou briga. As consequências de cada cena já saíram nas
     mensagens delas — esta é a espinha do dia, não a conta. */
  function registroDoDia(E, it){
    if(!E || !it || !it.paradas) return null;
    const chave = `itinerario|${E.data.ano}|${E.data.semana}|${E.data.dia}`;
    if((E.feed||[]).some(m=>m.chave === chave)) return null;
    const linhas = it.paradas.map(o=>{
      const marca = o.brigou ? ' (briga)' : '';
      return `${o.hora} ${o.nome}${marca}`;
    });
    const brigas = it.paradas.filter(o=>o.brigou).length;
    propor(E, {
      kind:'itinerario', peso:'info', voz:'diretor',
      chave,
      texto:`O dia de jogo, parada por parada: ${linhas.join(' · ')}.`,
      dados:{paradas:linhas, brigas, dias:it.dias},
      consequencia: brigas
        ? `${brigas} ${brigas===1?'parada virou briga':'paradas viraram briga'}.`
        : 'Nenhuma parada virou briga.'
    });
    return chave;
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

  function alvoDaDefesa(E, a){
    const o = M().torcida(a.torcida) || {nome:a.nome};
    const est = TO.planejamento.estimativaCaravana(E);
    return {torcidaId:a.torcida, nome:o.nome || a.nome,
            tipo: a.alvo === 'emboscada' ? 'emboscada'
                : a.alvo === 'bar' ? 'bar' : a.alvo,
            cena: a.cena,
            bairro: '',
            efetivo: TO.acoes.efetivoDe(E, o) || 30,
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
    m.consequencia = `Final: ${d.casa} ${d.gc} × ${d.gf} ${d.fora}`+
                     (d.comp ? `, pelo ${d.comp}.` : '.');
    return {ok:true};
  }

  return {INTERVALO_DROP,
          propor, dropar, pendentes, travado, decisaoAberta,
          abertura, eventosDoDia, emboscadaDaViagem,
          registrarConfronto, responder, alvoDaDefesa, encerrarPartida,
          linhaDeConsequencia, nomeDaCena, NOME_DIA,
          SOFRIDO, naoDesceu, registroDoDia};
})();
