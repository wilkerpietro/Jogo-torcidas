/* =========================================================
   FUTEBOL E PORRADA (pedido do dono, 21/08/2026)

   O jornal da briga. Mesma estrutura da Gazeta dos Sports —
   cabeçalho, tarja, chapéu, manchete, olho e placar grande —,
   mas a voz é da rua e o que vai ao lado da manchete não é
   classificação: é o QUADRO DA NOITE, com envolvidos, feridos,
   presos e quem levou a melhor dos dois lados.

   Toda briga da NOSSA torcida vira uma edição. As brigas que o
   resto do país teve no mesmo dia ficam atrás do botão "Ver
   mais notícias", como as outras seções da Gazeta.

   NADA É ESCRITO NA HORA. Toda frase sai de um molde submetido
   ao crivo do dono, preenchido com o que a briga já sabe. Onde
   há mais de um molde pra mesma condição eles andam numa fila:
   dentro da mesma edição nenhum se repete, e a escolha é
   determinada pelo dia — a mesma briga dá sempre a mesma
   página, o que importa porque a mensagem sobrevive ao save.
   ========================================================= */
window.TO = window.TO || {};

TO.porrada = (function(){
  const M = ()=>TO.mundo;

  const MES = ['janeiro','fevereiro','março','abril','maio','junho','julho',
               'agosto','setembro','outubro','novembro','dezembro'];
  const DIA_SEM = ['','Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  /* "Sábado, 12 de outubro", no idioma do jogo */
  const dataDe = (dia, dt) => _t('{dia}, {n} de {mes}',
    {dia:_t(DIA_SEM[dia]), n:dt.getDate(), mes:_t(MES[dt.getMonth()])});
  const ROMANO = n => ['','I','II','III','IV','V','VI','VII','VIII','IX','X',
                       'XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'][n] || n;

  /* =======================================================
     OS MOLDES (submetidos ao crivo do dono, 21/08/2026)
     Cada lista é uma fila: dentro da edição a próxima frase
     da mesma condição é a de baixo, e no fim volta pro começo.
     ======================================================= */
  const MOLDES = {
    /* 1 · chapéu — condição única, não alterna */
    chapeu:{
      atropelo:  [_t('Atropelo')],
      menos:     [_t('Era menos e não correu')],
      cadeia:    [_t('Noite de camburão')],
      semLuta:   [_t('Ninguém desceu')],
      arquibancada:[_t('O setor se pegou')],
      lnt:       [_t('Dia de LNT')],
      apoio:     [_t('Desceu junto')],
      padrao:    [_t('O pau do dia')]
    },

    /* 2 · manchete
       {A} vencedor · {B} perdedor · {nA} efetivo do vencedor
       {nB} efetivo do perdedor · {fA} feridos do vencedor
       {fB} feridos do perdedor · {onde} o lugar */
    manchete:{
      /* venceu atropelando: 3 ou mais feridos de diferença */
      atropelo:[
        _t('{A} passou o trator na {B}'),
        _t('{A} amassou a {B} e não teve conversa'),
        _t('{B} não durou nem cinco minutos contra a {A}'),
        _t('Deu {A} do começo ao fim, e a {B} não teve resposta')
      ],
      /* venceu no sufoco */
      vitoria:[
        _t('{A} levou a melhor contra a {B} no sufoco'),
        _t('Foi apertado, mas quem ficou de pé foi a {A}'),
        _t('{A} segurou o rojão e virou o jogo'),
        _t('{A} saiu por cima por pouco')
      ],
      /* venceu em menor número
         "CORREU COM A" NÃO DIZ QUEM GANHOU (correção do dono,
         24/08/2026): "LEÕES DA TUF ERA MENOS E AINDA CORREU COM A
         CEARAMOR" lia-se tanto como "a TUF botou a Cearamor pra
         correr" quanto como "a TUF correu junto com a Cearamor" — e
         em caixa alta, sem o artigo pra separar, ficava pior. O mesmo
         vale pro "mandou" solto. Agora todo molde daqui traz um verbo
         que só tem uma leitura: venceu, levou a melhor, botou pra
         correr. */
      vitoriaMenos:[
        _t('{A} era {nA} contra {nB} e venceu a {B} do mesmo jeito'),
        _t('Em menor número, {A} não correu e ainda botou a {B} pra correr'),
        _t('{A} era menor mas mesmo assim passou por cima da {B}')
      ],
      /* perdeu no detalhe */
      derrota:[
        _t('Deu {A} no detalhe, e a treta não morre aí'),
        _t('{A} levou por pouco e a {B} não engoliu'),
        _t('A {B} caiu de pé, mas caiu: quem levou foi a {A}')
      ],
      /* apanhou feio */
      apanhou:[
        _t('{B} tomou um baile da {A}'),
        _t('Sobrou pra {B} de todo lado, e quem distribuiu foi a {A}'),
        _t('{A} passou o rodo e a {B} foi contar os feridos')
      ],
      /* perdeu em desvantagem numérica */
      apanhouMenos:[
        _t('A {B} era {nB} contra {nA} e a {A} não perdoou'),
        _t('Eram muitos: a {B} apanhou da {A} no braço contado')
      ],
      /* ninguém levou a melhor */
      empate:[
        _t('{A} e {B}: ninguém levou a melhor e os dois contaram ferido'),
        _t('Deu treta e deu empate entre {A} e {B}: saíram machucados os dois'),
        _t('{A} e {B} bateram de igual pra igual e ficou por isso mesmo')
      ],
      /* ninguém desceu pra segurar */
      semLuta:[
        _t('A {A} quebrou tudo e foi embora sem achar ninguém'),
        _t('A {A} chegou, quebrou e ninguém desceu pra segurar')
      ],
      /* a polícia levou gente demais */
      cadeia:[
        _t('A polícia encheu o camburão, e quem levou a melhor foi a {A}'),
        _t('Acabou com camburão cheio dos dois lados, e a melhor foi da {A}'),
        _t('Terminou na delegacia com {P} nomes na lista, e a {A} ainda levou a melhor')
      ]
    },

    /* 2b · manchete POR CENÁRIO (pedido do dono, 31/08/2026):
       cada cenário de briga tem o seu baralho — 3 manchetes de
       vitória e 3 de derrota — que entra na MESMA fila das
       manchetes por condição. {A} é sempre o vencedor e {B} o
       perdedor, então as frases não podem dizer quem atacou nem
       quem era a caravana: o mesmo molde serve pros dois lados
       da mesma cena. Empate e "ninguém desceu" ficam de fora —
       são condições sem vencedor e já têm molde próprio. */
    mancheteCena:{
      arquibancada:{
        vitoria:[
          _t('{A} tomou o setor e a {B} subiu as escadas correndo'),
          _t('A {A} varreu a arquibancada e a {B} assistiu o resto de longe'),
          _t('O jogo parou no campo e no setor: deu {A} pra cima da {B}')
        ],
        derrota:[
          _t('A {A} invadiu o setor e a {B} não segurou a grade'),
          _t('A {B} perdeu a própria arquibancada pra {A}'),
          _t('Deu {A} no meio do setor, e a {B} desceu antes do fim do jogo')
        ]
      },
      emboscada:{
        vitoria:[
          _t('{A} levou a melhor na estrada e a {B} juntou os cacos no acostamento'),
          _t('Teve emboscada na rota e a {A} seguiu viagem por cima da {B}'),
          _t('A parada virou campo de batalha e a {B} saiu por baixo: deu {A}')
        ],
        derrota:[
          _t('A rota virou armadilha e a {B} pagou o pedágio pra {A}'),
          _t('Deu {A} no asfalto, e a {B} saiu carregando os seus'),
          _t('A emboscada na estrada terminou com a {B} no prejuízo e a {A} por cima')
        ]
      },
      bar:{
        vitoria:[
          _t('O bar fechou mais cedo: deu {A} pra cima da {B} no meio das mesas'),
          _t('{A} venceu a {B} no salão do bar e saiu pisando em caco de garrafa'),
          _t('Mesa, cadeira e garrafa voando: no fim, o bar era da {A} e a {B} tinha ido embora')
        ],
        derrota:[
          _t('A conta do bar sobrou pra {B}: a {A} cobrou na porrada'),
          _t('Deu {A} no bar, e a {B} saiu pelos fundos'),
          _t('A noite no bar acabou mal pra {B}: a {A} não deixou copo em pé')
        ]
      },
      comercio:{
        vitoria:[
          _t('Deu {A} na porta do comércio e a {B} não voltou pra buscar o troco'),
          _t('A {A} venceu a {B} no meio das bancas e ninguém abriu no dia seguinte'),
          _t('{A} passou por cima da {B} e o comércio baixou as portas')
        ],
        derrota:[
          _t('O comércio fechou no susto: a {A} passou por cima da {B}'),
          _t('A {B} perdeu a queda de braço na porta da loja pra {A}'),
          _t('Deu {A} entre as bancas, e a {B} amargou o prejuízo')
        ]
      },
      casa:{
        vitoria:[
          _t('A briga chegou na porta da sede e deu {A} pra cima da {B}'),
          _t('{A} venceu a {B} no portão da sede e pendurou o resultado no muro'),
          _t('A sede virou praça de guerra: a {A} ficou de pé e a {B} não')
        ],
        derrota:[
          _t('Deu {A} na porta da sede, e a {B} recolheu os seus'),
          _t('A {B} perdeu a batalha da sede: a {A} saiu por cima'),
          _t('O dia da sede acabou com a {A} por cima e a {B} contando ferido')
        ]
      },
      praca:{
        vitoria:[
          _t('A praça tem dono hoje: deu {A} pra cima da {B}'),
          _t('{A} venceu a {B} no meio da praça, com a cidade inteira olhando'),
          _t('A {B} veio marcar presença na praça e a {A} marcou em cima')
        ],
        derrota:[
          _t('A {B} perdeu a praça no braço: deu {A}'),
          _t('No coração da cidade, a {A} passou por cima da {B}'),
          _t('A tarde na praça terminou com a {B} correndo e a {A} por cima')
        ]
      },
      rua:{
        vitoria:[
          _t('A rua escolheu lado: deu {A} pra cima da {B}'),
          _t('{A} venceu a {B} no meio da rua e o bairro inteiro ouviu'),
          _t('Esquina fechada, rua parada: a {A} saiu andando e a {B} saiu carregada')
        ],
        derrota:[
          _t('A {B} cruzou com a {A} na rua errada e pagou o preço'),
          _t('Deu {A} no asfalto do bairro, e a {B} saiu mancando'),
          _t('A rua ficou pequena pra {B}: a {A} tomou conta')
        ]
      },
      arredores:{
        vitoria:[
          _t('Nos arredores do estádio, deu {A} pra cima da {B} antes do apito'),
          _t('{A} venceu a {B} a duas quadras do portão e o jogo nem tinha começado'),
          _t('O entorno do estádio ferveu e a {A} saiu por cima da {B}')
        ],
        derrota:[
          _t('A {B} não chegou inteira no portão: a {A} estava no caminho'),
          _t('Deu {A} nos arredores, e a {B} entrou contando os seus'),
          _t('O caminho do estádio custou caro pra {B}: a {A} cobrou na porrada')
        ]
      },
      treta:{
        vitoria:[
          _t('Marcaram, desceram e deu {A}: a {B} saiu carregada do combinado'),
          _t('No pau marcado, a {A} cumpriu o trato e a {B} não aguentou'),
          _t('Hora marcada, lugar marcado e dono marcado: a {A} venceu a {B}')
        ],
        derrota:[
          _t('A {B} topou o combinado e voltou menor: deu {A}'),
          _t('No pau marcado, a {B} até foi, mas quem voltou por cima foi a {A}'),
          _t('A {B} desceu pro combinado e subiu carregada: deu {A}')
        ]
      },
      lnt:{
        vitoria:[
          _t('Pela LNT, {A} venceu a {B} dez contra dez'),
          _t('Na liga, a {A} fez valer o regulamento da porrada em cima da {B}'),
          _t('Dia de LNT: deu {A} pra cima da {B} no campo combinado')
        ],
        derrota:[
          _t('Pela LNT, a {B} não aguentou o ritmo da {A}'),
          _t('A liga cobrou caro da {B}: deu {A} dez contra dez'),
          _t('Na LNT, a {A} levou a melhor e a {B} saiu devendo')
        ]
      },
      /* apoio a aliado (pedido do dono, 31/08/2026): a escolta desceu
         junto — {AL} é o aliado escoltado, e o grupo passa NA FRENTE do
         grupo da cena, porque a notícia é a aliança na porrada */
      apoio:{
        vitoria:[
          _t('A {AL} foi atacada, a {A} desceu junto e a {B} se arrependeu'),
          _t('{A} e {AL} lado a lado: a {B} veio pra emboscar e saiu carregada'),
          _t('Mexeu com a {AL}, mexeu com a {A}: a {B} aprendeu na porrada')
        ],
        derrota:[
          _t('A {A} atropelou a escolta: {B} e {AL} saíram no prejuízo'),
          _t('A {B} desceu pela {AL}, mas quem mandou na rua foi a {A}'),
          _t('Nem junto deu: a {A} venceu a {B} e a {AL} de uma vez')
        ]
      }
    },

    /* 3 · olho da manchete */
    olho:{
      completo:[_t('Foi {onde}, {nA} de um lado e {nB} do outro: {fA} {plA} da {A} e {fB} da {B}.')],
      comPresos:[_t('Foi {onde}, {nA} contra {nB}. Saldo: {F} no chão e {P} no camburão — a melhor foi da {A}.')],
      empate:[_t('Foi {onde}, {nA} de um lado e {nB} do outro, e saiu todo mundo contando o que doeu.')],
      semLuta:[_t('Foi {onde}. Não teve briga: teve prejuízo.')],
      /* DUAS FRASES, E NÃO UMA (revisão do dono, 22/08/2026): "era
         menos" é sempre sobre o NOSSO lado, e {A} é sempre o vencedor.
         Com um olho só, a derrota em menor número saía dizendo que
         quem venceu é que estava em desvantagem. */
      menosGanhou:[_t('Foi {onde}. A {A} era {nA} contra {nB} e mandou embora do mesmo jeito.')],
      menosPerdeu:[_t('Foi {onde}. A {B} era {nB} contra {nA} e não teve como segurar a {A}.')]
    },

    /* 4 · as notas das outras brigas do dia (o card aberto) */
    /* CADA CONDIÇÃO PRECISA DE MOLDE SOBRANDO: a regra é a mesma da
       Gazeta — nenhuma condição entra mais vezes do que tem frase —,
       e com um molde só o dia de seis brigas saía com uma nota. */
    nota:{
      atropelo:[_t('{A} botou a {B} pra correr e não deu trabalho.'),
                _t('A {B} nem esquentou: {A} resolveu rápido.'),
                _t('{A} passou por cima da {B} sem sustos.')],
      vitoria: [_t('{A} levou a melhor contra a {B} no aperto.'),
                _t('Deu {A} sobre a {B}, mas custou caro.'),
                _t('{A} ganhou da {B} no detalhe.')],
      empate:  [_t('{A} e {B} bateram de igual e ninguém levou nada.'),
                _t('Nem {A} nem {B}: saíram os dois no prejuízo.')],
      cadeia:  [_t('{A} sobre a {B}, e a viatura levou {P}.'),
                _t('Deu {A} sobre a {B} e a noite acabou na delegacia.')]
    },

    /* 6 · A LNT (textos submetidos ao crivo do dono, 23/08/2026)
       {D} divisão · {A} campeã · {V} vice · {S} quem sobe
       {C} quem desce · {N} quantas torcidas */
    lnt:{
      fundacao:[
        _t('A LNT está de pé: {N} torcidas, quatro divisões, dez contra dez')],
      fundacaoOlho:[
        _t('Duas edições por ano, uma em cada semestre. Cinco rodadas de chave e depois mata-mata; o último de cada chave desce de divisão e o mata-mata dá o acesso. Na 1ª Divisão o campeão leva {P}.')],
      campeao:[
        _t('{A} é campeã da {D} da LNT'),
        _t('{A} levantou a taça da {D} da LNT'),
        _t('Deu {A} na {D}: a taça da LNT ficou com ela')],
      campeaoNos:[
        _t('A taça da {D} da LNT é NOSSA'),
        _t('Somos campeões da {D} da LNT')],
      olhoFim:[
        _t('{V} ficou com o vice. Sobem: {S}. Descem: {C}.'),
        _t('O vice foi da {V}. Quem sobe: {S}. Quem desce: {C}.')],
      olhoFimSemDesce:[
        _t('{V} ficou com o vice. Sobem: {S}.')],
      nosso:[
        _t('A gente parou {F} da {DN}ª Divisão.'),
        _t('A nossa campanha acabou {F} da {DN}ª Divisão.')]
    },

    /* 7 · A OBRA NA PRAÇA (pedido do dono, 21/09/2026)
       Porta nova na rua é notícia do Futebol e Porrada, no mesmo
       esqueleto da briga: chapéu, manchete, olho e o quadro do lado.

       TUDO EM TERCEIRA PESSOA (correção do dono, 21/09/2026). A obra
       nossa tinha voz própria — "Abrimos um bar", "Porta nova nossa
       na praça" — e o dono cortou: manchete de jornal diz QUEM fez,
       pelo nome, e "Porta nova nossa na praça" não diz nem quem nem o
       quê. O modelo é o do próprio dono: LEÕES DA TUF ABRE LOJA NA
       CIDADE. Nome na frente, verbo no presente, sem artigo antes do
       nome — é como manchete de esporte se escreve —, e o olho
       embaixo segue a mesma voz. Saíram os moldes `…Nos` e o verbo em
       primeira pessoa: a nossa obra lê igual à das outras.

       {A} torcida · {O} o que foi feito, sem artigo ("bar") ou com
       ele na reforma ("o bar") · {N} pontos dela · {M} pontos da
       outra · {NN} o nome da nossa · {C} cidade (só na filial) */
    obra:{
      /* "CIDADE" EM TODO O CARTÃO. A manchete do dono diz "na
         cidade" e o chapéu dizia "na praça" logo acima dela: duas
         palavras pro mesmo lugar, na mesma notícia. */
      chapeu:{
        abriu:  [_t('Porta nova na cidade')],
        ampliou:[_t('Reforma na cidade')],
        sede:   [_t('A casa cresceu')],
        fabrica:[_t('Material próprio')],
        filial: [_t('Bandeira fora da cidade')]
      },
      /* MANCHETE CURTA. A primeira leva tinha frase de linha inteira
         e o recorte saía com seis linhas de caixa alta, o dobro do
         que a página comporta. O número e a comparação descem pro
         olho e pro quadro, que é onde número se lê. */
      abriu:[
        _t('{A} abre {O} na cidade'),
        _t('{A} inaugura {O} na cidade')
      ],
      ampliou:[
        _t('{A} amplia {O} na cidade'),
        _t('{A} reforma {O} e ocupa mais rua')
      ],
      sede:[
        _t('{A} amplia a sede'),
        _t('{A} reforma a casa e ganha espaço')
      ],
      fabrica:[
        _t('{A} monta fábrica própria'),
        _t('{A} passa a fazer o material dela')
      ],
      /* {C} já vem com a preposição — "no Rio de Janeiro", "em
         Salvador", "na Bahia" —, porque cidade tem gênero e metade
         desta lista é região. A tabela é dados/genero.js. */
      filial:[
        _t('{A} abre subsede {C}'),
        _t('{A} finca bandeira {C}')
      ],
      /* o olho: o fato seco e a comparação, na mesma terceira pessoa
         da manchete — era "contra 2 nossos" e "empata com a gente" */
      olho:[
        '{F}{C2}.'],
      /* o fato já disse "na cidade"; repetir na comparação dava
         "abriu um bar novo na cidade… Na cidade são 2 pontos" */
      olhoCompara:[
        _t('{F}{C2}. São {N} pontos dela contra {M} da {NN}.')],
      olhoEmpate:[
        _t('{F}{C2}. Ela empata com a {NN}: {N} pontos de cada lado.')],
      olhoNossa:[
        _t('{F}{C2}. São {N} pontos dela na cidade.')]
    },

    /* 5 · quando o país não se pegou */
    vazio:[_t('O resto do país passou o dia em paz.'),
           _t('Fora essa, nenhuma outra treta hoje.')]
  };

  /* ---- o motor de moldes (o mesmo da Gazeta) ---- */
  function encher(molde, v){
    return String(molde||'').replace(/\{(\w+)\}/g, (t,k)=>
      v[k] === undefined || v[k] === null ? '' : String(v[k]));
  }
  /* a fila: mesma condição duas vezes na edição não repete frase */
  function filaDe(semente){
    const usados = {};
    return (lista, chave)=>{
      if(!lista || !lista.length) return '';
      const i = (usados[chave] === undefined
                 ? (semente % lista.length)
                 : (usados[chave] + 1)) % lista.length;
      usados[chave] = i;
      return lista[i];
    };
  }

  const NOMES_CENA = {
    arredores:'nos arredores do estádio', praca:'na praça',
    rua:'numa rua de periferia', 'rua-media':'numa rua de classe média',
    'rua-nobre':'numa rua de classe alta', bar:'no bar', comercio:'no comércio',
    ct:'no CT', sede:'na sede', loja:'na loja', subsede:'na subsede',
    'estadio-10':'na arquibancada', 'estadio-20':'na arquibancada',
    'estadio-40':'na arquibancada',
    'treta-beco':'no beco', 'treta-galpao':'no pátio do galpão',
    'treta-campo':'no campo de terra',
    'emb-posto':'no posto', 'emb-onibus':'na estrada',
    'casa-piscina':'na casa de piscina'
  };
  const SEM_BAIRRO = ['estadio-10','estadio-20','estadio-40','emb-onibus'];
  /* cada cena cai num grupo do baralho por cenário; cena sem grupo
     (ou save antigo sem cena) fica só com as manchetes por condição */
  const GRUPO_CENA = {
    'estadio-10':'arquibancada', 'estadio-20':'arquibancada',
    'estadio-40':'arquibancada',
    'emb-posto':'emboscada', 'emb-onibus':'emboscada',
    bar:'bar', comercio:'comercio', loja:'comercio',
    sede:'casa', subsede:'casa', ct:'casa', 'casa-piscina':'casa',
    praca:'praca',
    rua:'rua', 'rua-media':'rua', 'rua-nobre':'rua',
    arredores:'arredores',
    'treta-beco':'treta', 'treta-galpao':'treta', 'treta-campo':'treta'
  };
  /* o mesmo lugar sem a preposição, pra tarja ("praça", "bar") — era
     um regex que arrancava o "na"/"no" do texto, e isso só funciona em
     português */
  const LUGAR_CENA = {
    arredores:'arredores do estádio', praca:'praça',
    rua:'rua de periferia', 'rua-media':'rua de classe média',
    'rua-nobre':'rua de classe alta', bar:'bar', comercio:'comércio',
    ct:'CT', sede:'sede', loja:'loja', subsede:'subsede',
    'estadio-10':'arquibancada', 'estadio-20':'arquibancada',
    'estadio-40':'arquibancada',
    'treta-beco':'beco', 'treta-galpao':'pátio do galpão',
    'treta-campo':'campo de terra',
    'emb-posto':'posto', 'emb-onibus':'estrada',
    'casa-piscina':'casa de piscina'
  };
  /* A TABELA FICA EM PORTUGUÊS e a conta do bairro repetido também
     (ela compara com o texto de lá); o que sai pra tela é traduzido.
     `nua` devolve o lugar sem a preposição, pra tarja. */
  const ondeDe = (d, nua) =>{
    const c = d.cena || '';
    const nome = nua ? _t(LUGAR_CENA[c] || 'rua') : _t(NOMES_CENA[c] || 'na rua');
    const cabe = d.bairro && SEM_BAIRRO.indexOf(c) < 0 &&
                 NOMES_CENA[c] !== `na ${d.bairro}` &&
                 NOMES_CENA[c] !== `no ${d.bairro}`;
    return cabe ? _t('{lugar}, no bairro {bairro}', {lugar:nome, bairro:d.bairro}) : nome;
  };

  /* =======================================================
     A PÁGINA
     ======================================================= */
  function montar(E, m){
    const d = m && m.dados;
    if(!d || !d.a || !d.b || !d.b.nome) return null;
    const q = m.quando || {};
    const ano = q.ano || E.data.ano, sem = q.semana || 1, dia = q.dia || 1;
    const dt = TO.estado.dataDaSemana(ano, sem, dia);
    const proxima = filaDe((dt.getDate() + dt.getMonth()*31) || 1);

    const a = d.a, b = d.b;
    const nA = a.n || 0, nB = b.n || 0;
    const fA = a.caidos || 0, fB = b.caidos || 0;
    const pA = a.presos || 0, pB = b.presos || 0;
    const ganhamos = !!d.ganhamos;
    /* empate é ninguém levar a melhor: a briga aconteceu e as duas
       fichas saíram parecidas */
    const houveBriga = !d.semResistencia && (fA || fB || nA);
    const empate = houveBriga && fA === fB && !ganhamos;
    const venc = d.semResistencia ? b : empate ? null : (ganhamos ? a : b);
    const perd = d.semResistencia ? a : empate ? null : (ganhamos ? b : a);

    /* ---- a condição que manda na página ---- */
    /* "era menos" é sempre sobre o NOSSO lado — vencendo vira mérito,
       apanhando vira explicação. A conta é a mesma nos dois casos:
       antes ela vinha invertida na derrota e a briga de 10 contra 30
       saía no molde de quem apanhou de igual pra igual. */
    const emMenor = nA < nB * 0.8;
    const dif = Math.abs(fA - fB);
    const presos = pA + pB;
    const cond = d.semResistencia ? 'semLuta'
               : empate ? 'empate'
               : presos >= 4 ? 'cadeia'
               : ganhamos ? (emMenor ? 'vitoriaMenos'
                          : dif >= 3 ? 'atropelo' : 'vitoria')
               : (emMenor ? 'apanhouMenos'
                  : dif >= 3 ? 'apanhou' : 'derrota');

    /* na LNT o lugar é a fase: o campo de terra é o mesmo toda
       edição, e o que a página precisa dizer é o que estava em jogo */
    const onde = d.lnt
      ? _t('{fase} da {div} da LNT', {fase:naFaseLNT(d.lnt.fase), div:_t(d.lnt.nomeDiv)})
      : ondeDe(d);
    /* o lugar sem preposição, pra tarja */
    const lugar = d.lnt
      ? _t('{fase} da {div} da LNT', {fase:faseLNTNua(d.lnt.fase), div:_t(d.lnt.nomeDiv)})
      : ondeDe(d, true);
    const v = {
      A: venc ? venc.nome : a.nome, B: perd ? perd.nome : b.nome,
      nA: venc === b ? nB : nA, nB: venc === b ? nA : nB,
      fA: venc === b ? fB : fA, fB: venc === b ? fA : fB,
      F: fA + fB, P: presos, onde
    };
    /* "1 feridos" não existe: a palavra acompanha o número */
    v.plA = v.fA === 1 ? _t('ferido') : _t('feridos');
    /* o aliado escoltado entra na manchete de apoio */
    if(d.aliado) v.AL = d.aliado.nome;

    /* ---- chapéu ---- */
    const CH = MOLDES.chapeu;
    const chapeu = d.semResistencia ? CH.semLuta[0]
                 /* o camburão passa na frente do lugar: quem foi preso
                    é a notícia, a arquibancada é só o endereço */
                 : presos >= 4 ? CH.cadeia[0]
                 : d.lnt ? CH.lnt[0]
                 : d.aliado ? CH.apoio[0]
                 : /^estadio-/.test(d.cena||'') ? CH.arquibancada[0]
                 : (cond === 'vitoriaMenos' || cond === 'apanhouMenos') ? CH.menos[0]
                 : cond === 'atropelo' ? CH.atropelo[0]
                 : CH.padrao[0];

    /* O BARALHO POR CENÁRIO ENTRA NA MESMA FILA (pedido do dono,
       31/08/2026): toda briga com vencedor soma às manchetes da
       condição as 3 do cenário — de vitória ou de derrota conforme o
       nosso lado. Empate e "ninguém desceu" não têm vencedor, então
       ficam só com o molde próprio. A fila continua determinada pelo
       dia: a mesma briga dá sempre a mesma página. */
    const grupo = d.lnt ? 'lnt' : d.aliado ? 'apoio' : GRUPO_CENA[d.cena || ''];
    const daCena = (venc && !d.semResistencia && MOLDES.mancheteCena[grupo] &&
                    MOLDES.mancheteCena[grupo][ganhamos ? 'vitoria' : 'derrota'])
                   || [];
    const manchete = encher(
      proxima(MOLDES.manchete[cond].concat(daCena), 'manchete'), v);

    /* ---- olho ---- */
    const O = MOLDES.olho;
    const olho = encher(
      d.semResistencia ? O.semLuta[0]
      : empate ? O.empate[0]
      : cond === 'vitoriaMenos' ? O.menosGanhou[0]
      : cond === 'apanhouMenos' ? O.menosPerdeu[0]
      : presos ? O.comPresos[0]
      : O.completo[0], v);

    return {
      cabeca:{
        ano: ROMANO(Math.max(1, ano - 2025)),
        edicao: d.edicao || E.brigasNossasTotal || 1,
        data: dataDe(dia, dt)
      },
      tarja: [
        _t('<b>{n}</b> na treta', {n:nA + nB}),
        _tn(fA + fB, '<b>{n}</b> ferido', '<b>{n}</b> feridos'),
        _tn(presos, '<b>{n}</b> preso', '<b>{n}</b> presos'),
        lugar
      ],
      chapeu, manchete, olho,
      /* O PLACAR É DE DERRUBADOS, NÃO DE FERIDOS (correção do dono,
         23/08/2026). Ele mostrava o ferido DE cada lado — "TUF 6 × 36
         Cearamor" queria dizer que a TUF perdeu seis e derrubou trinta
         e seis, e se lia como um 6 a 36 pra Cearamor: o número grande
         ficava do lado de quem apanhou. Agora cada lado exibe quantos
         ele DERRUBOU, que é como placar se lê — o maior número é o de
         quem ganhou — e o rótulo mudou junto. O quadro da noite, ao
         lado, continua contando os feridos de cada um. */
      placar:{a:a.nome, ga:fB, gb:fA, b:b.nome, nossaCasa:true,
              rot:_t('derrubados'),
              venceuA: venc ? venc.nome === a.nome : false,
              venceuB: venc ? venc.nome === b.nome : false},
      /* O QUADRO DA NOITE, no lugar da classificação */
      quadro:{
        /* o id vai junto pro nome virar link de perfil (crivo do dono,
           31/08/2026) */
        lados:[{nome:a.nome, id:a.id, nossa:true,  n:nA, feridos:fA, presos:pA},
               {nome:b.nome, id:b.id, nossa:false, n:nB, feridos:fB, presos:pB}],
        vencedor: venc ? venc.nome : null,
        empate
      },
      /* as outras brigas do dia, atrás do botão */
      completo: outrasBrigas(E, q, proxima),
      /* AS OUTRAS TRETAS NOSSAS DA MESMA NOITE (lote do itinerário,
         08/09/2026): uma linha por briga, sempre à vista */
      nossasOutras: (d.outrasNossas || []).map(x=>{
        const xa = x.a || {}, xb = x.b || {};
        const emp = !x.ganhamos && (xa.caidos||0) === (xb.caidos||0);
        return {
          onde: x.lnt ? _t('na LNT') : ondeDe(x),
          a:{nome:xa.nome, id:xa.id, n:xa.n||0, feridos:xa.caidos||0, presos:xa.presos||0},
          b:{nome:xb.nome, id:xb.id, n:xb.n||0, feridos:xb.caidos||0, presos:xb.presos||0},
          ganhamos: !!x.ganhamos, empate: emp, semResistencia: !!x.semResistencia,
          consequencia: TO.feed && TO.feed.linhaDeConsequencia
            ? TO.feed.linhaDeConsequencia(x.efeitos || []) : ''
        };
      }),
      totalNoite: d.totalNoite || null
    };
  }

  /* =======================================================
     AS OUTRAS BRIGAS DO DIA (o card aberto)
     O que o resto do país se pegou no mesmo dia, cada uma
     com a sua nota e o seu quadro curto.
     ======================================================= */
  const MOSTRA = 6;
  function outrasBrigas(E, q, proxima){
    const ano = q.ano || E.data.ano, sem = q.semana || 1, dia = q.dia || 1;
    const todas = (E.brigasIA || []).filter(x =>
      x.ano === ano && x.semana === sem && x.dia === dia);
    /* as maiores primeiro, como o resumo da semana já faz */
    const ord = todas.slice().sort((x,y)=>(y.a.n + y.b.n) - (x.a.n + x.b.n));
    const NT = MOLDES.nota;
    const condDe = x =>{
      const dif = Math.abs(x.a.feridos - x.b.feridos);
      const presos = (x.a.presos||0) + (x.b.presos||0);
      return presos >= 12 ? 'cadeia'
           : x.a.feridos === x.b.feridos ? 'empate'
           : dif >= 3 ? 'atropelo' : 'vitoria';
    };
    /* ESCOLHE PELA VARIEDADE, não só pelo tamanho (a mesma régua que a
       Gazeta usa em "pelo país"): primeiro uma de cada condição, e
       nenhuma condição entra mais vezes do que tem molde — senão seis
       brigas com camburão davam seis vezes a mesma frase. */
    const porCond = {};
    for(const x of ord) (porCond[condDe(x)] = porCond[condDe(x)] || []).push(x);
    const conds = Object.keys(porCond);
    const escolhidos = [];
    for(let volta = 0; escolhidos.length < MOSTRA && volta < 6; volta++)
      for(const c of conds){
        if(escolhidos.length >= MOSTRA) break;
        if(volta >= (NT[c] || []).length) continue;
        if(porCond[c][volta]) escolhidos.push(porCond[c][volta]);
      }
    const itens = escolhidos.map(x=>{
      const venc = x.ganhouA ? x.a : x.b, perd = x.ganhouA ? x.b : x.a;
      const presos = (x.a.presos||0) + (x.b.presos||0);
      const c = condDe(x);
      return {
        frase: encher(proxima(NT[c], 'nota-'+c),
                      {A:venc.nome, B:perd.nome, P:presos}),
        cidade: x.cidade || '',
        motivo: /×/.test(x.jogo||'') ? _t('na sombra de {jogo}', {jogo:x.jogo}) : (x.jogo || ''),
        lados:[{nome:x.a.nome, id:x.a.id, n:x.a.n,
                feridos:x.a.feridos, presos:x.a.presos},
               {nome:x.b.nome, id:x.b.id, n:x.b.n,
                feridos:x.b.feridos, presos:x.b.presos}],
        vencedor: x.vencedor
      };
    });
    return {
      itens,
      total: ord.length,
      resto: Math.max(0, ord.length - itens.length),
      vazio: itens.length ? '' : proxima(MOLDES.vazio, 'vazio')
    };
  }


  /* =======================================================
     A LNT NO JORNAL (pedido do dono, 22/08/2026)
     A fundação e o fim de cada edição saem no mesmo esqueleto
     da Porrada, com o quadro das quatro divisões no lugar do
     quadro da noite.
     ======================================================= */
  /* ======================================================
     A PÁGINA DA OBRA
     `dados` vem pronto do feed (quem tem o quê na praça é
     conta do feed, não do jornal). Aqui só se escolhe a
     conversa e se monta o recorte.
     ====================================================== */
  /* MANCHETE NÃO LEVA ARTIGO NO OBJETO: "abre loja na cidade", como
     o dono escreveu. Na reforma o artigo volta, porque ali o ponto já
     existia — "amplia o bar" e não "amplia bar". */
  const O_QUE = {
    bar:'bar', loja:'loja', subsede:'subsede',
    'ampliar:bar':'o bar', 'ampliar:loja':'a loja',
    'ampliar:subsede':'a subsede'
  };
  /* O QUADRO DA PRAÇA, no lugar do quadro da noite: quem tem o quê
     na rua, lado a lado. Na obra de outra torcida a comparação é com
     ela; na nossa é com quem manda na praça hoje. Fora da praça não
     há quadro — não há com quem comparar. */
  function quadroDaPraca(E, d, eles, nos){
    if(!d.naPraca) return null;
    const outro = d.nossa ? d.rival : {nome:d.nome, id:d.torcida, pontos:eles};
    if(!outro) return null;
    const p = d.nossa ? (outro.pontos || {}) : eles;
    const linha = (rot, ch) => [rot, d.nossa ? [nos[ch]||0, p[ch]||0]
                                             : [p[ch]||0, nos[ch]||0]];
    const meu = nos.total || 0, dele = p.total || 0;
    return {
      titulo:_t('O quadro da cidade'),
      lados: d.nossa
        ? [{nome:d.nomeNossa, id:E.torcida.id, nossa:true},
           {nome:outro.nome, id:outro.id, nossa:false}]
        : [{nome:d.nome, id:d.torcida, nossa:false},
           {nome:d.nomeNossa, id:E.torcida.id, nossa:true}],
      linhas:[linha(_t('Bares'),'bares'), linha(_t('Lojas'),'lojas'),
              linha(_t('Subsedes'),'subsedes'),
              [_t('Pontos'), d.nossa ? [meu, dele] : [dele, meu], true]],
      /* o pé segue a voz da página: nome, não "a gente" */
      pe: meu === dele ? _t('Empatadas na cidade')
        : _t('{nome} tem mais pontos', {nome: meu > dele ? d.nomeNossa : outro.nome})
    };
  }

  function montarObra(E, m){
    const d = m && m.dados;
    if(!d || !d.item) return null;
    const q = m.quando || {};
    const ano = q.ano || E.data.ano, sem = q.semana || 1, dia = q.dia || 1;
    const dt = TO.estado.dataDaSemana(ano, sem, dia);
    const proxima = filaDe((dt.getDate() + dt.getMonth()*31) || 1);
    const B = MOLDES.obra;
    const nossa = !!d.nossa;

    const grupo = d.item === 'sede' ? 'sede'
                : d.item === 'fabrica' ? 'fabrica'
                : d.item === 'filial' ? 'filial'
                : /^ampliar:/.test(d.item) ? 'ampliou' : 'abriu';
    /* a nossa obra usa os MESMOS moldes das outras: quem fez aparece
       pelo nome, na terceira pessoa, e não há mais lista `…Nos` */
    const lista = B[grupo];
    const eles = d.eles || {}, nos = d.nos || {};
    const v = {A:d.nome, O:_t(O_QUE[d.item] || 'ponto'),
               N:eles.total || 0, M:nos.total || 0,
               NN:d.nomeNossa || _t('a gente'),
               C:d.cidadeEm || _t('fora da praça')};

    /* o olho leva o fato seco e, quando é de outra torcida da praça,
       a comparação — é o que faz a notícia ser NOSSA também */
    v.F = d.frase || '';
    v.C2 = d.bairro ? _t(', no bairro {bairro}', {bairro:d.bairro}) : '';
    const molde = nossa ? B.olhoNossa
                : !d.naPraca ? B.olho
                : (eles.total === nos.total) ? B.olhoEmpate
                : B.olhoCompara;
    /* na nossa obra `{N}` é o nosso total: `eles` e `nos` são a mesma
       torcida, e o molde fala dela em terceira pessoa */
    const olho = encher(proxima(molde, 'obra-olho'),
                        nossa ? Object.assign({}, v, {N:nos.total}) : v);

    return {
      cabeca:{
        ano: ROMANO(Math.max(1, ano - 2025)),
        edicao: (q.absoluto || E.data.absoluto || 0) + 200,
        data: dataDe(dia, dt)
      },
      /* o chapéu é do tipo de obra pra todo mundo: "Obra nossa" era
         a última primeira pessoa que sobrava, e quem é a torcida já
         está na manchete e em vermelho no quadro */
      chapeu: (B.chapeu[grupo] || B.chapeu.abriu)[0],
      manchete: encher(proxima(lista, 'obra-man'), v),
      olho,
      /* O QUADRO DA PRAÇA, no lugar do quadro da noite: quem tem o
         quê na rua, lado a lado. Só existe quando há com quem
         comparar — obra nossa compara com quem fez a última. */
      quadro: quadroDaPraca(E, d, eles, nos)
    };
  }

  function montarLNT(E, m){
    const d = m && m.dados;
    if(!d) return null;
    const q = m.quando || {};
    const ano = q.ano || E.data.ano, sem = q.semana || 1, dia = q.dia || 1;
    const dt = TO.estado.dataDaSemana(ano, sem, dia);
    const proxima = filaDe((dt.getDate() + dt.getMonth()*31) || 1);
    const L = MOLDES.lnt;
    const cabeca = {
      ano: ROMANO(Math.max(1, ano - 2025)),
      edicao: d.n || 1,
      data: dataDe(dia, dt)
    };
    const dinheiro = v => TO.util.dinheiro(v);

    if(m.kind === 'lnt-fundacao'){
      const total = (d.divisoes||[]).reduce((s,x)=>s + x.clubes, 0);
      return {
        cabeca, especial:_t('A fundação da liga'),
        tarja:[_tn(total, '<b>{n}</b> torcida', '<b>{n}</b> torcidas'),
               _t('<b>{n}</b> divisões', {n:4}),
               _t('<b>{n}</b> edições por ano', {n:2}), _t('dez contra dez')],
        chapeu:_t('Nasce a liga'),
        manchete: encher(proxima(L.fundacao, 'lnt-man'), {N:total}),
        olho: encher(proxima(L.fundacaoOlho, 'lnt-olho'),
                     {P:dinheiro(300000)}),
        divisoes: (d.divisoes||[]).map(x=>({
          nome:x.nome, clubes:x.clubes, minha: x.n === d.minha})),
        fora: d.fora || 0
      };
    }

    if(m.kind === 'lnt-fim'){
      const c = (d.campeoes || [])[0] || {};
      /* a página é da 1ª Divisão: quem SOBE nela é quem veio da 2ª,
         e quem DESCE é o último de cada chave dela mesma */
      const sobem = ((d.campeoes || [])[1] || {}).sobem || '';
      const nos = d.nosso && /Campeão/.test(d.nosso.fase) && d.nosso.div === 1;
      const nDecididas = (d.campeoes || []).length;
      const v = {D:_t('1ª Divisão'), A:c.campeao || '—', V:c.vice || '—',
                 S: sobem || '—', C: c.caem || '—'};
      const olho = c.caem
        ? encher(proxima(L.olhoFim, 'lnt-olho'), v)
        : encher(proxima(L.olhoFimSemDesce, 'lnt-olho'), v);
      const meu = d.nosso ? encher(proxima(L.nosso, 'lnt-nosso'),
        {F: /Campeão|Vice/.test(d.nosso.fase)
             ? _t('como {fase}', {fase:_t(d.nosso.fase).toLowerCase()})
             : `${naFaseLNT(d.nosso.fase)}`,
         DN: d.nosso.div}) : '';
      return {
        cabeca, especial:_t('{n}º semestre de {ano}', {n:d.semestre, ano:d.ano}),
        tarja:[_t('<b>{n}ª</b> edição', {n:d.n}),
               _tn(nDecididas, '<b>{n}</b> divisão decidida', '<b>{n}</b> divisões decididas'),
               d.nosso ? _t('nós na <b>{n}ª</b>', {n:d.nosso.div}) : _t('nós de fora'),
               d.nosso && d.nosso.premio
                 ? _t('<b>{valor}</b> de prêmio', {valor:dinheiro(d.nosso.premio)}) : _t('sem prêmio')],
        chapeu:_t('Fim de LNT'),
        manchete: encher(proxima(nos ? L.campeaoNos : L.campeao, 'lnt-man'), v),
        olho, meu,
        campeoes: d.campeoes || []
      };
    }
    return null;
  }
  /* "na semifinal", "nas quartas", "no 16-avos" — a preposição
     acompanha a fase, como na Gazeta */
  /* A TABELA DE FASE DA LNT ERA UMA SEGUNDA TABELA, E INCOMPLETA
     (21/09/2026). Ela acertava seis nomes e mandava o resto pro
     `na ` fixo — e a LNT tem mais dois: "Playoff do acesso" saía
     "na playoff do acesso", e a fase de chave grande, que se chama
     "24 clubes", saía "na 24 clubes". Agora o gênero vem do mesmo
     dados/genero.js do resto do jogo, e sobra aqui só o que é
     próprio da LNT: a chave contada, que é montada na hora. */
  /* EM ESPANHOL E EM INGLÊS a fase vai com o nome original, pro
     gênero achar a tradução, e só desce pra minúscula depois — em
     português o texto sai igual. A rodada de chave ("2ª rodada") e a
     chave contada ("24 clubes") são montadas na hora e têm frase
     própria. */
  const naFaseLNT = f => {
    const b = String(f || '').trim();
    if(!b) return _t('na fase');
    const cl = b.match(/^(\d+) clubes$/i);
    if(cl) return _t('na fase de {n} clubes', {n:cl[1]});
    const rd = b.match(/^(\d+)ª rodada$/i);
    if(rd) return _t('na {n}ª rodada', {n:rd[1]});
    return TO.genero.em('fase', b).toLowerCase();
  };
  /* a mesma fase sem a preposição, pra tarja */
  const faseLNTNua = f => {
    const b = String(f || '').trim();
    if(!b) return _t('fase');
    const cl = b.match(/^(\d+) clubes$/i);
    if(cl) return _t('fase de {n} clubes', {n:cl[1]});
    const rd = b.match(/^(\d+)ª rodada$/i);
    if(rd) return _t('{n}ª rodada', {n:rd[1]});
    return _t(b).toLowerCase();
  };

  return {montar, montarLNT, montarObra, MOLDES, encher, ondeDe,
          MOSTRA, naFaseLNT};
})();
