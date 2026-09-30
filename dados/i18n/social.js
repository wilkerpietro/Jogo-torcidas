/* Dicionário da fatia "social": o feed das torcidas (Notícias →
   Mensagens) com cara de rede social — os posts que as outras
   torcidas publicam e a moldura deles (curtidas, há quanto tempo).
   Pedido do dono, 30/09/2026. Ver docs/I18N.md. */
TO.i18n.registrar({
  /* ---------- a moldura do feed ---------- */
  'Feed das torcidas': {es:'Feed de las barras', en:'Firms feed'},
  '{n} post':  {es:'{n} publicación',   en:'{n} post'},
  '{n} posts': {es:'{n} publicaciones', en:'{n} posts'},
  'Nenhuma torcida postou nada ainda.': {es:'Ninguna barra publicó nada todavía.', en:'No firm has posted anything yet.'},
  'hoje':        {es:'hoy',           en:'today'},
  'ontem':       {es:'ayer',          en:'yesterday'},
  'há {n} dias': {es:'hace {n} días', en:'{n} days ago'},
  '{n} curtida':  {es:'{n} me gusta', en:'{n} like'},
  '{n} curtidas': {es:'{n} me gusta', en:'{n} likes'},

  /* ---------- o dia que passou e o dia que vem ---------- */
  'na última segunda': {es:'el lunes pasado',     en:'last Monday'},
  'na última terça':   {es:'el martes pasado',    en:'last Tuesday'},
  'na última quarta':  {es:'el miércoles pasado', en:'last Wednesday'},
  'na última quinta':  {es:'el jueves pasado',    en:'last Thursday'},
  'na última sexta':   {es:'el viernes pasado',   en:'last Friday'},
  'no último sábado':  {es:'el sábado pasado',    en:'last Saturday'},
  'no último domingo': {es:'el domingo pasado',   en:'last Sunday'},
  'na segunda': {es:'el lunes',     en:'on Monday'},
  'na terça':   {es:'el martes',    en:'on Tuesday'},
  'na quarta':  {es:'el miércoles', en:'on Wednesday'},
  'na quinta':  {es:'el jueves',    en:'on Thursday'},
  'na sexta':   {es:'el viernes',   en:'on Friday'},
  'no sábado':  {es:'el sábado',    en:'on Saturday'},
  'no domingo': {es:'el domingo',   en:'on Sunday'},

  /* ---------- aniversário: o convite e o agradecimento ---------- */
  'Passando aqui pra convidar todos os nossos aliados pra nossa festa de comemoração dos nossos {n} anos de história! Vai ser {data} aqui {emCidade}. Contamos com a presença de vocês.':
    {es:'¡Pasamos por acá para invitar a todos nuestros aliados a la fiesta por nuestros {n} años de historia! Va a ser el {data} acá {emCidade}. Contamos con su presencia.',
     en:'Dropping in to invite all our allies to the party celebrating our {n} years of history! It will be on {data}, here {emCidade}. We are counting on you being there.'},
  'A {nome} agradece de coração a presença dos irmãos da {nossa} na festa dos nossos {n} anos! Vocês deixaram a noite completa. Aqui a casa é sempre de vocês.':
    {es:'¡La {nome} agradece de corazón la presencia de los hermanos de la {nossa} en la fiesta de nuestros {n} años! Ustedes hicieron la noche completa. Acá la casa es siempre suya.',
     en:'{nome} sends heartfelt thanks to the lads from {nossa} for coming to our {n}-year anniversary party! You made the night complete. Our door is always open to you.'},
  'A {nome} agradece de coração a presença dos irmãos da {nossa} na nossa festa de aniversário! Vocês deixaram a noite completa. Aqui a casa é sempre de vocês.':
    {es:'¡La {nome} agradece de corazón la presencia de los hermanos de la {nossa} en nuestra fiesta de aniversario! Ustedes hicieron la noche completa. Acá la casa es siempre suya.',
     en:'{nome} sends heartfelt thanks to the lads from {nossa} for coming to our anniversary party! You made the night complete. Our door is always open to you.'},

  /* ---------- trégua e treta marcada ---------- */
  'Muito sangue em {ano}. Foram {n} brigas contra a {nossa}, e tem gente no hospital dos dois lados. A {nome} propõe publicamente uma trégua até o fim da temporada. A resposta é com vocês.':
    {es:'Mucha sangre en {ano}. Fueron {n} peleas contra la {nossa}, y hay gente en el hospital de los dos lados. La {nome} propone públicamente una tregua hasta el final de la temporada. La respuesta es de ustedes.',
     en:'Too much blood in {ano}. {n} fights against {nossa}, and there are people in hospital on both sides. {nome} publicly proposes a truce until the end of the season. Your move.'},
  'Recado pra {nossa}: hoje à noite, em {bairro}, {n} contra {n}, com {valor} na roda. Quem é de verdade aparece.':
    {es:'Mensaje para la {nossa}: esta noche, en {bairro}, {n} contra {n}, con {valor} en juego. El que es de verdad aparece.',
     en:'Message for {nossa}: tonight, in {bairro}, {n} against {n}, {valor} on the line. The real ones show up.'},

  /* ---------- a provocação depois da briga ---------- */
  'Hoje a {nossa} conheceu de perto o bonde da {nome}. Anota a placa aí: teu terror tem nome!':
    {es:'Hoy la {nossa} conoció de cerca a la banda de la {nome}. Anoten la patente: ¡su terror tiene nombre!',
     en:'Today {nossa} met the {nome} crew up close. Take down the plate: your nightmare has a name!'},
  'Correram igual galinha! Cadê a {nossa}? Ninguém sabe, ninguém viu. Hoje a rua foi da {nome}.':
    {es:'¡Corrieron como gallinas! ¿Dónde está la {nossa}? Nadie sabe, nadie vio. Hoy la calle fue de la {nome}.',
     en:'Ran like chickens! Where is {nossa}? Nobody knows, nobody saw. Today the street belonged to {nome}.'},
  'Contamos os da {nossa} que correram hoje: faltou dedo pra contar. Da próxima, fiquem em casa.':
    {es:'Contamos a los de la {nossa} que corrieron hoy: no alcanzaron los dedos. La próxima, quédense en casa.',
     en:'We counted the {nossa} lads who ran today: ran out of fingers. Next time, stay home.'},
  'A {nossa} que aproveite o dia de hoje, porque isso não fica assim. O bonde da {nome} volta pesado.':
    {es:'Que la {nossa} disfrute el día de hoy, porque esto no queda así. La banda de la {nome} vuelve pesada.',
     en:'{nossa} can enjoy today, because this is not over. The {nome} crew is coming back heavy.'},
  'Recado pra {nossa}: podem ficar tranquilos que a cobrança vem, e vem cara!':
    {es:'Mensaje para la {nossa}: quédense tranquilos que la revancha llega, ¡y llega cara!',
     en:'Message for {nossa}: rest easy, payback is coming, and it is coming hard!'},
  'Riram hoje, vão chorar depois. A {nome} não esquece: o revide vai ser pesado.':
    {es:'Hoy se rieron, después van a llorar. La {nome} no olvida: la revancha va a ser pesada.',
     en:'Laughing today, crying later. {nome} does not forget: the payback will be heavy.'},

  /* ---------- a caravana da aliada na nossa cidade ---------- */
  'Caravana confirmada! A {nome} estará {emCidade} {dia} pro jogo do {clube}{comp}, uns {n} de bonde. Contamos com os irmãos da {nossa} pra receber a gente!':
    {es:'¡Caravana confirmada! La {nome} va a estar {emCidade} {dia} para el partido de {clube}{comp}, unos {n} en la banda. ¡Contamos con los hermanos de la {nossa} para recibirnos!',
     en:'Away trip confirmed! {nome} will be {emCidade} {dia} for the {clube} match{comp}, about {n} in the crew. Counting on our brothers from {nossa} to put us up!'},
  'A {nome} vem agradecer publicamente a receptividade da {nossa} {quando}, quando estivemos {emCidade} acompanhando o nosso {clube}{comp}. Nossa parceria segue firme: quando precisarem da gente {emCidadeDela}, serão bem recebidos também!':
    {es:'La {nome} viene a agradecer públicamente la hospitalidad de la {nossa} {quando}, cuando estuvimos {emCidade} acompañando a nuestro {clube}{comp}. Nuestra alianza sigue firme: ¡cuando nos necesiten {emCidadeDela}, también van a ser bien recibidos!',
     en:'{nome} would like to publicly thank {nossa} for the welcome {quando}, when we were {emCidade} following our {clube}{comp}. Our partnership stays strong: whenever you need us {emCidadeDela}, you will be made welcome too!'},
  'A {nome} agradece publicamente à {nossa} pela escolta {quando}: estivemos {emCidade} acompanhando o nosso {clube}{comp}, e o bonde de vocês andou com a gente até o portão. Isso não se esquece. Quando precisarem da gente {emCidadeDela}, é só chamar!':
    {es:'La {nome} agradece públicamente a la {nossa} por la escolta {quando}: estuvimos {emCidade} acompañando a nuestro {clube}{comp}, y la banda de ustedes caminó con nosotros hasta el portón. Eso no se olvida. ¡Cuando nos necesiten {emCidadeDela}, solo tienen que llamar!',
     en:'{nome} publicly thanks {nossa} for the escort {quando}: we were {emCidade} following our {clube}{comp}, and your crew walked with us all the way to the gate. That is not forgotten. Whenever you need us {emCidadeDela}, just call!'},
  'Que recepção! A {nome} agradece à {nossa} pelo churrasco e pela caminhada junto {quando}, quando estivemos {emCidade} acompanhando o nosso {clube}{comp}. Isso é irmandade. Quando estiverem {emCidadeDela}, a casa é de vocês!':
    {es:'¡Qué recibimiento! La {nome} agradece a la {nossa} por el asado y por la caminata juntos {quando}, cuando estuvimos {emCidade} acompañando a nuestro {clube}{comp}. Eso es hermandad. ¡Cuando estén {emCidadeDela}, la casa es de ustedes!',
     en:'What a welcome! {nome} thanks {nossa} for the barbecue and for walking with us {quando}, when we were {emCidade} following our {clube}{comp}. That is brotherhood. Whenever you are {emCidadeDela}, our home is yours!'},
  'A {nome} esteve {emCidade} {quando} acompanhando o nosso {clube}{comp}, e a {nossa}, que se diz aliada, nem apareceu. Fica registrado.':
    {es:'La {nome} estuvo {emCidade} {quando} acompañando a nuestro {clube}{comp}, y la {nossa}, que se dice aliada, ni apareció. Queda registrado.',
     en:'{nome} was {emCidade} {quando} following our {clube}{comp}, and {nossa}, who call themselves allies, did not even show up. Noted.'},

  /* ---------- a nossa caravana na cidade da aliada ---------- */
  'Bem-vindos, irmãos! A caravana da {nossa} estará {emCidade} {dia} pro jogo do {clube}{comp}, e a sede da {nome} vai estar aberta pra eles: colchão, banho e café. Cheguem cedo!':
    {es:'¡Bienvenidos, hermanos! La caravana de la {nossa} va a estar {emCidade} {dia} para el partido de {clube}{comp}, y la sede de la {nome} va a estar abierta para ellos: colchón, ducha y café. ¡Lleguen temprano!',
     en:'Welcome, brothers! The {nossa} away trip will be {emCidade} {dia} for the {clube} match{comp}, and the {nome} HQ will be open for them: mattress, shower and coffee. Get here early!'},
  'Bem-vindos, irmãos! A caravana da {nossa} estará {emCidade} {dia} pro jogo do {clube}{comp}. Vão dormir na sede da {nome}, e o nosso bonde anda com eles até o portão. Aqui ninguém encosta.':
    {es:'¡Bienvenidos, hermanos! La caravana de la {nossa} va a estar {emCidade} {dia} para el partido de {clube}{comp}. Van a dormir en la sede de la {nome}, y nuestra banda los acompaña hasta el portón. Acá nadie los toca.',
     en:'Welcome, brothers! The {nossa} away trip will be {emCidade} {dia} for the {clube} match{comp}. They will sleep at the {nome} HQ, and our crew walks with them to the gate. Nobody touches them here.'},
  'Bem-vindos, irmãos! A caravana da {nossa} estará {emCidade} {dia} pro jogo do {clube}{comp}. Vai ter churrasco na sede da {nome} quando chegarem, e a gente sobe pro estádio de bonde junto. A cidade é de vocês!':
    {es:'¡Bienvenidos, hermanos! La caravana de la {nossa} va a estar {emCidade} {dia} para el partido de {clube}{comp}. Va a haber asado en la sede de la {nome} cuando lleguen, y subimos al estadio todos en banda. ¡La ciudad es de ustedes!',
     en:'Welcome, brothers! The {nossa} away trip will be {emCidade} {dia} for the {clube} match{comp}. There will be a barbecue at the {nome} HQ when they arrive, and we head to the stadium as one crew. The city is yours!'},
  'A {nome} avisa aos irmãos da {nossa} que dessa vez não vai dar pra receber a caravana {emCidade} {dia}. Semana pesada por aqui. Fica pra próxima!':
    {es:'La {nome} avisa a los hermanos de la {nossa} que esta vez no vamos a poder recibir la caravana {emCidade} {dia}. Semana pesada por acá. ¡Queda para la próxima!',
     en:'{nome} lets our brothers from {nossa} know that this time we cannot host the away trip {emCidade} {dia}. Heavy week around here. Next time!'},

  /* ---------- a escolta: o agradecimento e a cobrança ---------- */
  'A {nome} agradece à {nossa}: voltamos inteiros pra casa porque o bonde de vocês estava com a gente no portão. Isso a gente não esquece!':
    {es:'La {nome} le agradece a la {nossa}: volvimos enteros a casa porque la banda de ustedes estaba con nosotros en el portón. ¡Eso no lo olvidamos!',
     en:'{nome} thanks {nossa}: we got home in one piece because your crew was with us at the gate. We will not forget that!'},
  'Apanhamos juntos, mas a {nossa} desceu com a gente. Irmão é quem aparece na hora ruim. Valeu, {nossa}!':
    {es:'Cobramos juntos, pero la {nossa} bajó con nosotros. Hermano es el que aparece en las malas. ¡Gracias, {nossa}!',
     en:'We took a beating together, but {nossa} came down with us. A brother is the one who shows up in the bad times. Cheers, {nossa}!'},
  'A {nome} vem a público lamentar: nosso pessoal apanhou {emCidade} e a {nossa}, que se diz aliada, não desceu. Viemos de longe confiando. Fica registrado.':
    {es:'La {nome} lamenta públicamente: a nuestra gente le pegaron {emCidade} y la {nossa}, que se dice aliada, no bajó. Vinimos de lejos confiando. Queda registrado.',
     en:'{nome} publicly regrets: our people took a beating {emCidade} and {nossa}, who call themselves allies, did not show up. We came a long way trusting you. Noted.'}
});
