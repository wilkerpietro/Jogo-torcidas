/* Dicionário da fatia "tutorial" — ver docs/I18N.md.
   O passo a passo de boas-vindas (js/gestao/tutorial.js), o itinerário
   do dia de jogo (js/gestao/itinerario.js) e os textos do estado da
   partida (js/estado.js): extrato, livro de indicadores, save e carga.
   Chave: o texto em português, exatamente como está no código (com os
   {marcadores}). Valor: {es, en}.
   Os dias da semana, 'Diretoria' e 'Torcida' moram em comum.js. */
TO.i18n.registrar({
  /* ================= TUTORIAL — o cartão do passo a passo ================= */
  'passo a passo':        {es:'paso a paso',            en:'walkthrough'},
  'Avançar →':            {es:'Siguiente →',            en:'Next →'},
  'Pular o resto':        {es:'Saltar el resto',        en:'Skip the rest'},
  'Passo {n} de {total}': {es:'Paso {n} de {total}',    en:'Step {n} of {total}'},
  'Fechar com a briga →': {es:'Cerrar con la pelea →',  en:'Finish with the fight →'},

  /* ---------- as telas de cada passo ---------- */
  'Indicadores · Prestígio': {es:'Indicadores · Prestigio', en:'Indicators · Prestige'},
  'Indicadores · Moral':     {es:'Indicadores · Moral',     en:'Indicators · Morale'},
  'Indicadores · Recrutar':  {es:'Indicadores · Reclutar',  en:'Indicators · Recruit'},
  'Indicadores · Relações':  {es:'Indicadores · Relaciones',en:'Indicators · Relationships'},
  'Feed':                    {es:'Feed',                    en:'Feed'},
  'Financeiro · 1 de 2':     {es:'Finanzas · 1 de 2',       en:'Finances · 1 of 2'},
  'Financeiro · 2 de 2':     {es:'Finanzas · 2 de 2',       en:'Finances · 2 of 2'},
  'Calendário':              {es:'Calendario',              en:'Calendar'},
  'Competições':             {es:'Competiciones',           en:'Competitions'},
  'Ranking':                 {es:'Ranking',                 en:'Rankings'},
  'Diplomacia · Aliados':    {es:'Diplomacia · Aliados',    en:'Diplomacy · Allies'},
  'Diplomacia · Rivais':     {es:'Diplomacia · Rivales',    en:'Diplomacy · Rivals'},
  'Notícias':                {es:'Noticias',                en:'News'},
  'Jogo':                    {es:'Juego',                   en:'Game'},

  /* ---------- os textos dos passos (crivo do dono) ---------- */
  'O jogo é regido por uma série de indicadores que vão dizer se sua torcida vai bem ou mal.<br><br><em>Prestígio</em>: Seu respeito dentro do universo das torcidas. Vencer brigas, construir patrimônio, dominar rivais, tudo isso aumenta o prestígio. O contrário diminui.':
    {es:'El juego se rige por una serie de indicadores que te van a decir si tu barra va bien o mal.<br><br><em>Prestigio</em>: tu respeto dentro del mundo de las barras. Ganar peleas, construir patrimonio, dominar a los rivales: todo eso aumenta el prestigio. Lo contrario lo baja.',
     en:'The game runs on a set of indicators that tell you whether your firm is doing well or badly.<br><br><em>Prestige</em>: your respect in the world of firms. Winning fights, building up assets, dominating rivals — all of that raises your prestige. The opposite lowers it.'},
  '<em>Moral</em>: É a satisfação do seu membro com a torcida. Moral alta faz ele estar mais presente nos jogos e nas brigas. Moral baixa faz ele repensar se vale a pena estar na torcida.':
    {es:'<em>Moral</em>: es la satisfacción de tus miembros con la barra. Con la moral alta van más a los partidos y a las peleas. Con la moral baja se preguntan si vale la pena seguir en la barra.',
     en:'<em>Morale</em>: how happy your members are with the firm. High morale means they turn up more for matches and fights. Low morale makes them wonder whether the firm is worth it.'},
  '<em>Recrutar</em>: É a ação de conseguir novos membros. Quem dita se um dia terá novos membros recrutados é a fase do clube: se vai bem novos membros são recrutados mais fácil, se vai mal se torna bem mais difícil.':
    {es:'<em>Reclutar</em>: es la acción de conseguir nuevos miembros. Lo que decide si un día vas a sumar gente nueva es el momento del club: si va bien, los nuevos miembros llegan más fácil; si va mal, se vuelve mucho más difícil.',
     en:"<em>Recruit</em>: bringing in new members. What decides whether new members sign up is how the club is doing: when it's going well, recruiting is easier; when it's going badly, it gets a lot harder."},
  '<em>Relações</em>: Nível de relação com um rival, mas mais na frente eu te explico com mais detalhe no passo a passo.':
    {es:'<em>Relaciones</em>: tu nivel de relación con un rival, pero más adelante te lo explico con más detalle en el paso a paso.',
     en:"<em>Relationships</em>: where you stand with a rival — but I'll explain it in more detail further on in the walkthrough."},
  'O feed é onde o jogo acontece. Tudo é decidido por aqui: recado de olheiro, planejamento de ações, notícia. Decisões importantes têm opções que detalham as consequências de cada uma — o resto é pra ler e seguir.':
    {es:'El feed es donde pasa el juego. Todo se decide aquí: el aviso del informante, la planificación de acciones, las noticias. Las decisiones importantes tienen opciones que detallan las consecuencias de cada una; el resto es para leer y seguir.',
     en:'The feed is where the game happens. Everything gets decided here: tip-offs from scouts, action planning, news. Big decisions come with options that spell out the consequences of each one — the rest is just to read and move on.'},
  'Aqui é detalhado todos os dados da sua torcida, inclusive a lista de membros, que possuem força de ataque e defesa, cargo inicial, podendo evoluir para demais cargos se evoluírem sua força e XP. Eles podem ficar feridos em brigas ou presos se a polícia pegar eles. Nesse caso eles não são usados por você enquanto estiverem nessas condições.':
    {es:'Aquí están todos los datos de tu barra, incluida la lista de miembros. Cada uno tiene fuerza de ataque y defensa y un cargo inicial, y puede subir a otros cargos si mejora su fuerza y su XP. Pueden quedar heridos en peleas o presos si los agarra la policía. En ese caso no puedes usarlos mientras sigan en esa situación.',
     en:"This is where you'll find all your firm's details, including the member list. Each member has attack and defence strength and a starting rank, and can move up to other ranks as their strength and XP grow. They can get injured in fights or jailed if the police catch them. When that happens, you can't use them until they're back."},
  'Essa parte do menu mostra o controle financeiro da torcida. Toda torcida inicia com uma sede social e um bar embutido dentro da sede. Você pode evoluir o patrimônio da torcida comprando novas lojas, bares e subsedes. O nível da sede dita a quantidade de patrimônio que você pode ter, mas cada um tem níveis que quando evoluídos geram mais receita.':
    {es:'Esta parte del menú muestra el control financiero de la barra. Toda barra empieza con una sede social y un bar dentro de la sede. Puedes hacer crecer el patrimonio de la barra comprando nuevas tiendas, bares y subsedes. El nivel de la sede marca cuánto patrimonio puedes tener, y cada uno tiene niveles que, al subirlos, generan más ingresos.',
     en:"This part of the menu shows the firm's finances. Every firm starts with an HQ and a bar built into it. You can grow the firm's assets by buying new shops, bars and branches. The HQ level sets how many assets you can have, and each one has levels that bring in more income as you upgrade them."},
  'Além disso, você pode contratar treinadores de luta pra aumentar a qualidade do seu treino e advogados pra livrar membros da cadeia, sempre com prudência pra não quebrar as finanças da torcida.':
    {es:'Además, puedes contratar entrenadores de pelea para mejorar la calidad del entrenamiento y abogados para sacar miembros de la cárcel, siempre con prudencia para no quebrar las finanzas de la barra.',
     en:"You can also hire fight coaches to improve your training and lawyers to get members out of jail — always carefully, so you don't wreck the firm's finances."},
  'O expediente da sede é a ação passiva da torcida: o que ela vai fazer sem você. Todas as escolhas mexem nos indicadores ou nas finanças. Existe também o calendário seu e dos outros times pra você se programar.':
    {es:'La jornada de la sede es la acción pasiva de la barra: lo que hace sin ti. Todas las elecciones mueven los indicadores o las finanzas. También está tu calendario y el de los otros equipos, para que te organices.',
     en:"The HQ's daily routine is the firm's passive action: what it does without you. Every choice moves the indicators or the finances. There's also your calendar and the other teams', so you can plan ahead."},
  'Aqui você consegue detalhar todos os campeonatos do mundo, com tabela de classificação e jogos por rodada.':
    {es:'Aquí puedes ver en detalle todos los campeonatos del mundo, con tabla de posiciones y partidos por fecha.',
     en:'Here you can dig into every championship in the world, with league tables and matches by round.'},
  'A régua nacional das torcidas: membros, prestígio, força, saldo de briga. <em>Subir aqui é o objetivo do ano</em> — e todo mundo tá olhando.':
    {es:'La tabla nacional de las barras: miembros, prestigio, fuerza, saldo de peleas. <em>Subir aquí es el objetivo del año</em>, y todo el mundo está mirando.',
     en:"The national table of firms: members, prestige, strength, fight record. <em>Climbing it is the goal of the year</em> — and everyone's watching."},
  'A diplomacia mostra as relações da sua torcida com todas as demais. Os aliados vão te ajudar e pedir auxílio; qualquer ajuda entre vocês aumenta a relação, negar diminui.':
    {es:'La diplomacia muestra las relaciones de tu barra con todas las demás. Los aliados te van a ayudar y a pedirte ayuda; cualquier ayuda entre ustedes mejora la relación, negarla la empeora.',
     en:"Diplomacy shows your firm's relationships with every other firm. Allies will help you and ask for help; any help between you improves the relationship, and turning them down makes it worse."},
  'Os rivais vão ser aqueles que procuram hostilidade contra você no jogo, seja na sua cidade, em outra cidade em jogos fora de casa ou em emboscadas na estrada quando você estiver viajando. Cada ação dessa piora as relações entre você e o rival.':
    {es:'Los rivales son los que van a buscar pelea contigo en el juego, ya sea en tu ciudad, en otra ciudad en partidos de visitante o en emboscadas en la ruta cuando estés viajando. Cada una de esas acciones empeora la relación entre tú y el rival.',
     en:"Rivals are the ones who come looking for trouble with you — in your city, in another city at away matches, or in ambushes on the road when you're travelling. Every one of those makes things worse between you and that rival."},
  'Aqui é onde as notícias do mundo inteiro são compiladas, além da lista de brigas entre as demais torcidas do jogo (IA × IA).':
    {es:'Aquí se juntan las noticias del mundo entero, además de la lista de peleas entre las demás barras del juego (IA × IA).',
     en:'This is where news from all over the world is gathered, plus the list of fights between the other firms in the game (AI × AI).'},
  'O cofre de saves. Partida de cinco anos se salva — <em>vaga, arquivo ou texto</em>. Salva antes de decisão grande e ninguém chora depois.':
    {es:'La caja fuerte de partidas. Una partida de cinco años se guarda: <em>ranura, archivo o texto</em>. Guarda antes de una decisión grande y nadie llora después.',
     en:'The save vault. A five-year campaign gets saved — <em>slot, file or text</em>. Save before a big decision and nobody cries later.'},

  /* ---------- a briga simulada: os balões ---------- */
  'A pista · 1 de 4':   {es:'La calle · 1 de 4',   en:'The road · 1 of 4'},
  'O bonde anda com o <b>WASD</b> — ou com o direcional na tela, no toque. Aponta pra onde quer ir que os seus vão atrás de você.':
    {es:'La banda se mueve con <b>WASD</b>, o con el direccional en pantalla si juegas en táctil. Apunta hacia donde quieres ir y los tuyos van detrás de ti.',
     en:'The crew moves with <b>WASD</b> — or with the on-screen pad on touch. Point where you want to go and your lot will follow you.'},
  '✓ isso — agora vai pra cima deles': {es:'✓ eso es — ahora ve a por ellos', en:"✓ that's it — now go at them"},
  'A porrada · 2 de 4': {es:'Los golpes · 2 de 4', en:'The punch-up · 2 of 4'},
  'Não precisa clicar no rival e nem em alguma tecla pra bater nele: <b>basta encostar nele</b>.':
    {es:'No hace falta hacer clic en el rival ni apretar ninguna tecla para pegarle: <b>basta con tocarlo</b>.',
     en:"You don't need to click the rival or press any key to hit them: <b>just bump into them</b>."},
  'Entendi':            {es:'Entendido',           en:'Got it'},
  'O arsenal · 3 de 4': {es:'El arsenal · 3 de 4', en:'The arsenal · 3 of 4'},
  'Clique <kbd>Q</kbd> pra jogar pedra, <kbd>E</kbd> pra jogar bomba.':
    {es:'Aprieta <kbd>Q</kbd> para tirar piedra y <kbd>E</kbd> para tirar bomba.',
     en:'Press <kbd>Q</kbd> to throw a stone, <kbd>E</kbd> to throw a bomb.'},
  '✓ voou coisa na praça': {es:'✓ volaron cosas en la plaza', en:'✓ stuff flying across the square'},
  'A fuga · 4 de 4':    {es:'La huida · 4 de 4',   en:'The retreat · 4 of 4'},
  'Quando o rival perder uma <b>% dos envolvidos</b>, ela vai correr da briga.':
    {es:'Cuando el rival pierda un <b>% de los involucrados</b>, va a salir corriendo de la pelea.',
     en:"When the rivals lose a <b>% of the people involved</b>, they'll run from the fight."},
  'Entendi — terminar o serviço': {es:'Entendido — terminar el trabajo', en:'Got it — finish the job'},

  /* ---------- a briga simulada: o desfecho ---------- */
  'A rival correu!':      {es:'¡La rival salió corriendo!', en:'The rivals ran!'},
  'Ela quebrou e abandonou a praça. É assim que briga termina: no número, não no clique.':
    {es:'Se quebró y abandonó la plaza. Así termina una pelea: por los números, no por el clic.',
     en:"They broke and fled the square. That's how a fight ends: on numbers, not clicks."},
  'Brigar de novo':       {es:'Pelear de nuevo',          en:'Fight again'},
  'Voltar pro jogo':      {es:'Volver al juego',          en:'Back to the game'},
  'Fim da demonstração':  {es:'Fin de la demostración',   en:'End of the demo'},
  'Na briga de verdade seria dia de lamber ferida — aqui não custou nada. Quer tentar de novo?':
    {es:'En una pelea de verdad sería día de lamerse las heridas; aquí no costó nada. ¿Quieres intentarlo de nuevo?',
     en:"In a real fight you'd be licking your wounds — here it cost nothing. Want another go?"},

  /* ================= ITINERÁRIO — as paradas do dia de jogo ================= */
  'Sede · a caravana pega a estrada': {es:'Sede · la caravana sale a la ruta', en:'HQ · the convoy hits the road'},
  'Chegada na praça deles':  {es:'Llegada a su plaza',         en:'Arrival in their town'},
  'Praça de passagem':       {es:'Ciudad de paso',             en:'Town on the way'},
  'Saída da praça deles':    {es:'Salida de su plaza',         en:'Leaving their town'},
  'Sede · fim da caravana':  {es:'Sede · fin de la caravana',  en:'HQ · end of the trip'},
  'Concentração':            {es:'Concentración',              en:'Pre-match gathering'},
  'Praça da concentração':   {es:'Plaza de la concentración',  en:'Gathering square'},
  'Praça deles · ponto do rival': {es:'Su plaza · punto del rival', en:"Their square · the rivals' spot"},
  'Pista':                   {es:'La calle',                   en:'The road'},
  'Avenida de acesso · a caminho': {es:'Avenida de acceso · en camino', en:'Access avenue · on the way'},
  'Avenida de acesso · volta':     {es:'Avenida de acceso · regreso',   en:'Access avenue · way back'},
  'Arredores':               {es:'Alrededores',                en:'Around the stadium'},
  'Esplanada do {estadio}':  {es:'Explanada del {estadio}',    en:'{estadio} forecourt'},
  'Estádio deles · {estadio}': {es:'Su estadio · {estadio}',   en:'Their ground · {estadio}'},
  'estádio':                 {es:'estadio',                    en:'stadium'},
  'Estádio':                 {es:'Estadio',                    en:'Stadium'},
  'O jogo':                  {es:'El partido',                 en:'The match'},
  '{estadio} · em tempo real': {es:'{estadio} · en tiempo real', en:'{estadio} · live'},
  'Saída dos portões':       {es:'Salida por los portones',    en:'Out through the gates'},
  'estrada':                 {es:'ruta',                       en:'road'},
  'lá':                      {es:'allá',                       en:'there'},

  /* ---------- as três fases da linha do dia ---------- */
  'Caravana · ida':          {es:'Caravana · ida',             en:'Away trip · out'},
  'Caravana · volta':        {es:'Caravana · vuelta',          en:'Away trip · back'},
  'Ida ao estádio':          {es:'Ida al estadio',             en:'To the stadium'},
  'Volta do estádio':        {es:'Vuelta del estadio',         en:'Back from the stadium'},
  'concentração, pista e arredores': {es:'concentración, calle y alrededores', en:'gathering, road and around the stadium'},
  'saída dos portões e pista':       {es:'salida por los portones y calle',    en:'out the gates and down the road'},

  /* ---------- a virada de dia (o ' · ' fica: a tela corta nele) ---------- */
  '{quando} · dia do jogo':            {es:'{quando} · día del partido',          en:'{quando} · match day'},
  '{quando} · véspera, dia de caravana': {es:'{quando} · víspera, día de caravana', en:'{quando} · day before, travel day'},
  '{quando} · volta, dia de caravana':   {es:'{quando} · regreso, día de caravana', en:'{quando} · way back, travel day'},

  /* ================= ESTADO — partida nova, extrato e livro de indicadores ================= */
  'seu clube':    {es:'tu club',     en:'your club'},
  'a cidade':     {es:'la ciudad',   en:'the city'},
  'Caixa inicial':{es:'Caja inicial',en:'Starting cash'},
  'Estorno — cobrança errada de festa': {es:'Reembolso — cobro erróneo de fiesta', en:'Refund — wrong party charge'},
  'Expediente de folga: {motivo}.': {es:'Jornada libre: {motivo}.', en:'Day off from the routine: {motivo}.'},
  'dia de jogo do clube':  {es:'día de partido del club', en:"the club's match day"},
  'dia de caravana':       {es:'día de caravana',         en:'travel day'},
  'Título: {comp}':        {es:'Título: {comp}',          en:'Title: {comp}'},
  'Acesso do clube':       {es:'Ascenso del club',        en:'Club promoted'},
  'Rebaixamento do clube': {es:'Descenso del club',       en:'Club relegated'},
  '20 dias sem briga':     {es:'20 días sin pelea',       en:'20 days without a fight'},
  'Vitória do clube em campo': {es:'Victoria del club en la cancha', en:'Club win on the pitch'},
  'Derrota do clube em campo': {es:'Derrota del club en la cancha',  en:'Club loss on the pitch'},

  /* ---------- save e carga: os motivos que o jogador lê ---------- */
  'erro':         {es:'error',       en:'error'},
  'o navegador aceitou gravar mas não devolveu o que gravou — o save some ao fechar':
    {es:'el navegador aceptó guardar pero no devolvió lo que guardó: la partida se pierde al cerrar',
     en:"the browser accepted the save but didn't give back what it stored — the save will vanish when you close it"},
  'o navegador bloqueou o armazenamento ({erro}). Janela anônima e "bloquear dados de sites" fazem isso. Use o save por texto ou por arquivo.':
    {es:'el navegador bloqueó el almacenamiento ({erro}). La ventana de incógnito y "bloquear datos de sitios" hacen eso. Usa el guardado por texto o por archivo.',
     en:'the browser blocked storage ({erro}). Private windows and "block site data" do that. Use the text or file save instead.'},
  'o save ({kb} KB) não coube: apague uma vaga antiga em Jogo → Vagas, ou guarde esta partida em arquivo/texto':
    {es:'la partida ({kb} KB) no cupo: borra una ranura vieja en Juego → Ranuras, o guarda esta partida en archivo/texto',
     en:"the save ({kb} KB) didn't fit: delete an old slot in Game → Slots, or keep this game as a file/text"},
  'o navegador recusou gravar ({erro})': {es:'el navegador se negó a guardar ({erro})', en:'the browser refused to save ({erro})'},
  'sem partida':               {es:'no hay partida',          en:'no game in progress'},
  'aguarde chegar ao estádio': {es:'espera a llegar al estadio', en:'wait until you reach the stadium'},
  'vaga que não existe':       {es:'esa ranura no existe',    en:"that slot doesn't exist"},
  'o save não virou texto: {erro}': {es:'la partida no se pudo pasar a texto: {erro}', en:"the save couldn't be turned into text: {erro}"},
  'não veio texto nenhum':     {es:'no llegó ningún texto',   en:'no text came through'},
  'isso não parece um save do jogo': {es:'eso no parece una partida de este juego', en:"that doesn't look like a save from this game"},
  'save de outra versão do jogo':    {es:'partida de otra versión del juego',       en:'save from another version of the game'},
  'o texto veio quebrado ({erro})':  {es:'el texto llegó roto ({erro})',            en:'the text came through broken ({erro})'},
  'não parece um save':        {es:'no parece una partida guardada', en:"doesn't look like a save"}
});
