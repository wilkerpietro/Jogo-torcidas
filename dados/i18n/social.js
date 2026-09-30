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
  '{n} comentário':  {es:'{n} comentario',  en:'{n} comment'},
  '{n} comentários': {es:'{n} comentarios', en:'{n} comments'},
  '{n} compartilhamento':  {es:'{n} compartido',  en:'{n} share'},
  '{n} compartilhamentos': {es:'{n} compartidos', en:'{n} shares'},

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
     en:'{nome} publicly regrets: our people took a beating {emCidade} and {nossa}, who call themselves allies, did not show up. We came a long way trusting you. Noted.'},
  /* ---------- os perfis dos jornais e as brigas do mundo ---------- */
  'Zoeira':   {es:'Cargada', en:'Banter'},
  'Resposta': {es:'Respuesta', en:'Reply'},
  'Notícia':  {es:'Noticia', en:'News'},
  'Ler a matéria': {es:'Leer la nota', en:'Read the story'},
  'PORRADA PELO PAÍS':  {es:'PIÑAS POR EL PAÍS',  en:'SCRAPS AROUND THE COUNTRY'},
  'PORRADA PELO MUNDO': {es:'PIÑAS POR EL MUNDO', en:'SCRAPS AROUND THE WORLD'},
  'A {vencedor} levou a melhor sobre a {perdedor} numa treta marcada {emCidade}.':
    {es:'La {vencedor} le ganó a la {perdedor} en una pelea pactada {emCidade}.',
     en:'{vencedor} got the better of {perdedor} in a pre-arranged brawl {emCidade}.'},
  'A {vencedor} levou a melhor no ataque ao bar {emCidade}, contra a {perdedor}.':
    {es:'La {vencedor} ganó en el ataque al bar {emCidade}, contra la {perdedor}.',
     en:'{vencedor} came out on top in the bar attack {emCidade}, against {perdedor}.'},
  'A {vencedor} levou a melhor sobre a {perdedor} num ataque-surpresa {emCidade}.':
    {es:'La {vencedor} le ganó a la {perdedor} en un golpe sorpresa {emCidade}.',
     en:'{vencedor} got the better of {perdedor} in a surprise raid {emCidade}.'},
  'A {vencedor} levou a melhor sobre a {perdedor} numa emboscada na estrada.':
    {es:'La {vencedor} le ganó a la {perdedor} en una emboscada en la ruta.',
     en:'{vencedor} got the better of {perdedor} in an ambush on the road.'},
  'A {vencedor} levou a melhor sobre a {perdedor} {emCidade}.':
    {es:'La {vencedor} le ganó a la {perdedor} {emCidade}.',
     en:'{vencedor} got the better of {perdedor} {emCidade}.'},
  'Foram {nV} contra {nD}, com {feridos} feridos.':
    {es:'Fueron {nV} contra {nD}, con {feridos} heridos.', en:'It was {nV} against {nD}, with {feridos} injured.'},
  'E a bandeira da {perdedor} trocou de dono.': {es:'Y la bandera de la {perdedor} cambió de dueño.', en:'And the {perdedor} flag changed hands.'},
  'E a faixa da {perdedor} trocou de dono.':    {es:'Y el trapo de la {perdedor} cambió de dueño.',   en:'And the {perdedor} banner changed hands.'},
  'Ao todo, {k} brigas pelo país hoje.': {es:'En total, {k} peleas por el país hoy.', en:'In all, {k} fights around the country today.'},

  /* ---------- a zoeira de quem venceu ---------- */
  'Treta marcada é pra quem aguenta. A {perdedor} topou, apareceu {emCidade} e saiu no prejuízo: {n} contra {m}, e deu {nome}.':
    {es:'La pelea pactada es para el que aguanta. La {perdedor} aceptó, apareció {emCidade} y salió perdiendo: {n} contra {m}, y ganó la {nome}.',
     en:'A pre-arranged brawl is for those who can take it. {perdedor} agreed, showed up {emCidade} and came off worse: {n} against {m}, and {nome} won.'},
  'Passamos no bar da {perdedor} {emCidade} e ninguém segurou. A {nome} mandou lembranças!':
    {es:'Pasamos por el bar de la {perdedor} {emCidade} y nadie aguantó. ¡La {nome} les manda saludos!',
     en:'We dropped by the {perdedor} bar {emCidade} and nobody held the line. {nome} sends its regards!'},
  'A {perdedor} veio tomar o nosso bar {emCidade} e voltou correndo. Aqui é a casa da {nome}!':
    {es:'La {perdedor} vino a tomar nuestro bar {emCidade} y volvió corriendo. ¡Acá es la casa de la {nome}!',
     en:'{perdedor} came to take our bar {emCidade} and ran back home. This is {nome} territory!'},
  'Pegamos a {perdedor} de surpresa {emCidade}. Nem deu tempo de correr. Abraço da {nome}!':
    {es:'Agarramos a la {perdedor} de sorpresa {emCidade}. Ni tiempo de correr tuvieron. ¡Un abrazo de la {nome}!',
     en:'We caught {perdedor} by surprise {emCidade}. They did not even have time to run. Love from {nome}!'},
  'A {perdedor} tentou pegar a gente de surpresa {emCidade} e tomou o troco na hora. A {nome} não dorme!':
    {es:'La {perdedor} quiso agarrarnos de sorpresa {emCidade} y recibió el vuelto en el acto. ¡La {nome} no duerme!',
     en:'{perdedor} tried to catch us by surprise {emCidade} and got paid back on the spot. {nome} never sleeps!'},
  'Emboscada na estrada: a caravana da {perdedor} não chegou inteira. Assinado, {nome}.':
    {es:'Emboscada en la ruta: la caravana de la {perdedor} no llegó entera. Firmado, {nome}.',
     en:'Ambush on the road: the {perdedor} away trip did not arrive in one piece. Signed, {nome}.'},
  'Armaram emboscada na estrada pra gente e se deram mal. A {perdedor} que aprenda: a {nome} viaja pronta.':
    {es:'Nos armaron una emboscada en la ruta y les salió mal. Que la {perdedor} aprenda: la {nome} viaja preparada.',
     en:'They set up an ambush for us on the road and it backfired. {perdedor} should learn: {nome} travels ready.'},

  /* ---------- a resposta de quem apanhou ---------- */
  'Ganharam na covardia, {n} contra {m}. A {perdedor} não esquece, {nome}. A volta vem.':
    {es:'Ganaron a lo cobarde, {n} contra {m}. La {perdedor} no olvida, {nome}. La vuelta llega.',
     en:'You won the cowardly way, {n} against {m}. {perdedor} does not forget, {nome}. Payback is coming.'},
  'Fácil ganhar com {n} contra {m}, né, {nome}? Marca um dia de igual pra igual com a {perdedor} e vamos ver.':
    {es:'Fácil ganar con {n} contra {m}, ¿no, {nome}? Pongan un día de igual a igual con la {perdedor} y vamos a ver.',
     en:'Easy winning {n} against {m}, right, {nome}? Set a day, even numbers, against {perdedor} and let us see.'},
  'Uma briga não é a guerra, {nome}. A {perdedor} já está se organizando.':
    {es:'Una pelea no es la guerra, {nome}. La {perdedor} ya se está organizando.',
     en:'One fight is not the war, {nome}. {perdedor} is already getting organised.'},
  'Hoje foi de vocês, {nome}. Aproveitem, porque a {perdedor} volta e a conta vem cara.':
    {es:'Hoy fue de ustedes, {nome}. Disfrútenlo, porque la {perdedor} vuelve y la cuenta llega cara.',
     en:'Today was yours, {nome}. Enjoy it, because {perdedor} will be back and the bill will be steep.'},
  /* ---------- a cidade no feed: Gazeta, protesto, zonas, nosso perfil ---------- */
  'Protesto':   {es:'Protesta',    en:'Protest'},
  'Convocação': {es:'Convocatoria', en:'Call-up'},
  'Resenha':    {es:'Juntada',     en:'Get-together'},
  'Zona {zona}':          {es:'Zona {zona}',          en:'{zona} Zone'},
  'Zona {zona} da {nome}':{es:'Zona {zona} de la {nome}', en:'{nome} {zona} Zone'},
  'Nos pênaltis, deu {v}.': {es:'En los penales, ganó {v}.', en:'{v} won on penalties.'},
  'Com o resultado, {time} fica em {pos}º lugar.':
    {es:'Con el resultado, {time} queda {pos}.º en la tabla.', en:'With the result, {time} sit in position {pos} in the table.'},
  '{d} derrotas nos últimos {j} jogos.': {es:'{d} derrotas en los últimos {j} partidos.', en:'{d} defeats in the last {j} matches.'},
  '{d} derrotas nos últimos {j} jogos e o time na zona de rebaixamento.':
    {es:'{d} derrotas en los últimos {j} partidos y el equipo en zona de descenso.', en:'{d} defeats in the last {j} matches and the team in the relegation zone.'},
  'Chega de vexame! A {nome} cobra publicamente jogadores e comissão técnica do {clube}: {d} derrotas nos últimos {j} jogos não é o time que a gente carrega no peito. Queremos raça em campo!':
    {es:'¡Basta de papelones! La {nome} les exige públicamente a los jugadores y al cuerpo técnico de {clube}: {d} derrotas en los últimos {j} partidos no es el equipo que llevamos en el pecho. ¡Queremos garra en la cancha!',
     en:'Enough embarrassment! {nome} publicly calls out the {clube} players and coaching staff: {d} defeats in the last {j} matches is not the team we carry in our hearts. We want fight on the pitch!'},
  'Recado da {nome} pro elenco do {clube}: a arquibancada não vai aceitar mais uma sequência dessas. {d} derrotas em {j} jogos. Honrem a camisa!':
    {es:'Mensaje de la {nome} al plantel de {clube}: la tribuna no va a aceptar otra racha así. {d} derrotas en {j} partidos. ¡Honren la camiseta!',
     en:'Message from {nome} to the {clube} squad: the stands will not accept another run like this. {d} defeats in {j} matches. Honour the shirt!'},
  'FORA, DIRETORIA! A {nome} exige a saída imediata da diretoria do {clube}. {sit} Não dá mais pra aceitar esse descaso com o clube.':
    {es:'¡FUERA LA DIRECTIVA! La {nome} exige la salida inmediata de la directiva de {clube}. {sit} No se puede aceptar más este abandono del club.',
     en:'BOARD OUT! {nome} demands the immediate resignation of the {clube} board. {sit} We cannot accept this neglect of the club any longer.'},
  'A paciência acabou. A {nome} convoca a torcida do {clube}: é hora de a diretoria entregar os cargos. {sit}':
    {es:'Se acabó la paciencia. La {nome} convoca a la hinchada de {clube}: es hora de que la directiva deje sus cargos. {sit}',
     en:'Patience has run out. {nome} calls on the {clube} fans: it is time for the board to step down. {sit}'},
  'Sábado tem resenha da Zona {zona} na casa de piscina. Só quem é de verdade: traz a camisa e a disposição!':
    {es:'El sábado hay juntada de la Zona {zona} en la casa quinta. Solo los de verdad: traigan la camiseta y las ganas.',
     en:'Saturday the {zona} Zone throws a party at the pool house. Only the real ones: bring the shirt and the attitude!'},
  'Resenha confirmada! A Zona {zona} se reúne no sábado na casa de piscina. Churrasco, bateria e a nossa gente.':
    {es:'¡Juntada confirmada! La Zona {zona} se reúne el sábado en la casa quinta. Asado, bombos y nuestra gente.',
     en:'Party confirmed! The {zona} Zone meets on Saturday at the pool house. Barbecue, drums and our people.'},
  'A {nome} passou na resenha da {perdedor} e ninguém segurou. Resenha encerrada mais cedo!':
    {es:'La {nome} pasó por la juntada de la {perdedor} y nadie aguantó. ¡Juntada terminada antes de hora!',
     en:'The {nome} dropped in on the {perdedor} party and nobody held the line. Party over early!'},
  'A {perdedor} veio invadir a nossa resenha e voltou correndo. Aqui é a {nome}, e aqui ninguém entra!':
    {es:'La {perdedor} vino a invadir nuestra juntada y volvió corriendo. Acá es la {nome}, ¡y acá no entra nadie!',
     en:'The {perdedor} came to storm our party and ran back home. This is the {nome}, and nobody gets in here!'},
  'Pegaram a nossa resenha desprevenida. A {perdedor} não esquece, e a volta vai ser na casa de vocês.':
    {es:'Agarraron nuestra juntada desprevenida. La {perdedor} no olvida, y la vuelta va a ser en la casa de ustedes.',
     en:'You caught our party off guard. The {perdedor} does not forget, and payback will be at your place.'},
  'Hoje a {nome} segurou. Mas a {perdedor} conhece o caminho da casa de vocês.':
    {es:'Hoy la {nome} aguantó. Pero la {perdedor} conoce el camino a la casa de ustedes.',
     en:'The {nome} held today. But the {perdedor} knows the way to your place.'},
  'Caravana confirmada! A {nome} estará {emCidade} {dia} pro jogo do {clube}{comp}. Quem vai, confirma presença com a diretoria!':
    {es:'¡Caravana confirmada! La {nome} va a estar {emCidade} {dia} para el partido de {clube}{comp}. ¡El que va, confirma con la directiva!',
     en:'Away trip confirmed! {nome} will be {emCidade} {dia} for the {clube} match{comp}. If you are going, confirm with the board!'},
  /* ---------- rivalidade: clássico, goleada, título, acesso, queda ---------- */
  'Comemoração': {es:'Festejo', en:'Celebration'},
  'Reclamação':  {es:'Queja',   en:'Complaint'},
  'O CLÁSSICO É NOSSO! {clube} {gv} x {gd} {rival}{comp}. A cidade tem dono, e a {deles} que aguente a zoeira até o próximo.':
    {es:'¡EL CLÁSICO ES NUESTRO! {clube} {gv} x {gd} {rival}{comp}. La ciudad tiene dueño, y que la {deles} se banque la cargada hasta el próximo.',
     en:'THE DERBY IS OURS! {clube} {gv}–{gd} {rival}{comp}. The city has an owner, and {deles} can put up with the banter until the next one.'},
  'Quem manda na cidade? {clube} {gv} x {gd} {rival}{comp}. A {nome} faz a festa e manda um abraço pra {deles}!':
    {es:'¿Quién manda en la ciudad? {clube} {gv} x {gd} {rival}{comp}. ¡La {nome} hace la fiesta y le manda un abrazo a la {deles}!',
     en:'Who runs this city? {clube} {gv}–{gd} {rival}{comp}. {nome} throws the party and sends a hug to {deles}!'},
  'Perder o clássico pro {clube} é inaceitável. {gv} a {gd}{comp}, e a gente engolindo zoeira a semana inteira. Exigimos respeito à camisa do {rival}!':
    {es:'Perder el clásico con {clube} es inaceptable. {gv} a {gd}{comp}, y nosotros tragándonos la cargada toda la semana. ¡Exigimos respeto a la camiseta de {rival}!',
     en:'Losing the derby to {clube} is unacceptable. {gv}–{gd}{comp}, and we have to swallow the banter all week. We demand respect for the {rival} shirt!'},
  'Vergonha. {rival} entrou no clássico com medo e saiu com {gd} a {gv}. A {deles} não aceita time sem sangue em clássico.':
    {es:'Vergüenza. {rival} entró al clásico con miedo y salió con {gd} a {gv}. La {deles} no acepta un equipo sin sangre en un clásico.',
     en:'Shameful. {rival} went into the derby scared and came out {gd}–{gv}. {deles} will not accept a team with no fight in a derby.'},
  'Alguém avisa a {deles} que levar {gv} do {vencedor} dói? Semana difícil pro {clube}. Que fase!':
    {es:'¿Alguien le avisa a la {deles} que comerse {gv} de {vencedor} duele? Semana difícil para {clube}. ¡Qué momento!',
     en:'Can someone tell {deles} that shipping {gv} to {vencedor} hurts? Tough week for {clube}. What a slump!'},
  '{gv} a {gd}! {clube} virou saco de pancada{comp}. A {nome} está rindo até agora.':
    {es:'¡{gv} a {gd}! {clube} se volvió bolsa de boxeo{comp}. La {nome} todavía se está riendo.',
     en:'{gv}–{gd}! {clube} have become a punching bag{comp}. {nome} are still laughing.'},
  'Vexame! {gd} a {gv} pro {vencedor}{comp}. A {deles} exige vergonha na cara do elenco do {clube}.':
    {es:'¡Papelón! {gd} a {gv} con {vencedor}{comp}. La {deles} le exige vergüenza al plantel de {clube}.',
     en:'Disgrace! {gd}–{gv} against {vencedor}{comp}. {deles} demand some shame from the {clube} squad.'},
  'Levar {gv} do {vencedor} não dá. {clube} precisa de explicação, e a {deles} quer ouvir de quem manda no clube.':
    {es:'Comerse {gv} de {vencedor} no puede ser. {clube} debe una explicación, y la {deles} quiere escucharla de los que mandan en el club.',
     en:'Shipping {gv} to {vencedor} is not on. {clube} owe an explanation, and {deles} want to hear it from whoever runs the club.'},
  'É CAMPEÃO! {clube} levanta {comp} de {ano}! A {nome} faz a festa: obrigado, elenco, a taça é nossa!':
    {es:'¡ES CAMPEÓN! ¡{clube} levanta {comp} de {ano}! La {nome} hace la fiesta: gracias, plantel, ¡la copa es nuestra!',
     en:'CHAMPIONS! {clube} lift {comp} of {ano}! {nome} throw the party: thank you, lads, the trophy is ours!'},
  'CAMPEÃO! Deu {clube} {naComp}! A {nome} vai pra rua comemorar. Quem duvidou, que engula o grito!':
    {es:'¡CAMPEÓN! ¡Ganó {clube} {naComp}! La {nome} sale a la calle a festejar. ¡El que dudó, que se trague el grito!',
     en:'CHAMPIONS! {clube} win {naComp}! {nome} take to the streets to celebrate. Doubters, swallow your words!'},
  'ACESSO! {clube} vai jogar {naDivisao}! A {nome} agradece a cada um que empurrou o time o ano inteiro. Ano que vem tem mais!':
    {es:'¡ASCENSO! ¡{clube} va a jugar {naDivisao}! La {nome} le agradece a cada uno que empujó al equipo todo el año. ¡El año que viene hay más!',
     en:'PROMOTED! {clube} will play {naDivisao}! {nome} thank everyone who pushed the team all year. More to come next year!'},
  'SUBIU! {clube} está {naDivisao} e a {nome} não cabe em si. Foi na raça, foi na arquibancada!':
    {es:'¡SUBIÓ! {clube} está {naDivisao} y la {nome} no cabe en sí. ¡Fue con garra, fue en la tribuna!',
     en:'UP WE GO! {clube} are {naDivisao} and {nome} are over the moon. It was guts, it was the stands!'},
  'Rebaixado. {clube} vai jogar {naDivisao} e a {nome} não vai aceitar calada. Diretoria, a conta chegou.':
    {es:'Descendido. {clube} va a jugar {naDivisao} y la {nome} no se va a quedar callada. Directiva, llegó la cuenta.',
     en:'Relegated. {clube} will play {naDivisao} and {nome} will not keep quiet. Board, the bill has arrived.'},
  'Ano de vergonha. {clube} caiu, e a {nome} quer os responsáveis longe do clube. A camisa não merecia isso.':
    {es:'Año de vergüenza. {clube} descendió, y la {nome} quiere a los responsables lejos del club. La camiseta no merecía esto.',
     en:'A year of shame. {clube} went down, and {nome} want those responsible out of the club. The shirt did not deserve this.'},
  'Tchau, {clube}! Boa viagem {pelaDivisao}. A {nome} manda um abraço pra {deles}: a gente se vê daqui a uns anos.':
    {es:'¡Chau, {clube}! Buen viaje {pelaDivisao}. La {nome} le manda un abrazo a la {deles}: nos vemos en unos años.',
     en:'Bye, {clube}! Enjoy life {naDivisao}. {nome} send a hug to {deles}: see you in a few years.'},
  'Caiu! {clube} vai conhecer {naDivisao}, e a {nome} vai lembrar disso por muito tempo.':
    {es:'¡Se fue al descenso! {clube} va a conocer {naDivisao}, y la {nome} se va a acordar de esto por mucho tiempo.',
     en:'Down they go! {clube} will get to know {naDivisao}, and {nome} will remember this for a long time.'},
  /* ---------- a zona se gaba da resenha ---------- */
  'A {nome} foi na resenha da {perdedor} e voltou com a bandeira deles. Já está pendurada na nossa sede. Quem quiser, vem buscar!':
    {es:'La {nome} fue a la juntada de la {perdedor} y volvió con su bandera. Ya está colgada en nuestra sede. ¡El que la quiera, que venga a buscarla!',
     en:'The {nome} went to the {perdedor} party and came back with their flag. It is already hanging in our HQ. Anyone who wants it can come and get it!'},
  'Resenha encerrada e bandeira no bolso! A {perdedor} vai ter que costurar outra. Assinado: {nome}.':
    {es:'¡Juntada terminada y bandera en el bolsillo! La {perdedor} va a tener que coser otra. Firmado: {nome}.',
     en:'Party over and their flag in our pocket! The {perdedor} will have to sew a new one. Signed: the {nome}.'},
  'A {nome} foi na resenha da {perdedor} e voltou com a faixa deles. Já está pendurada na nossa sede. Quem quiser, vem buscar!':
    {es:'La {nome} fue a la juntada de la {perdedor} y volvió con su trapo. Ya está colgado en nuestra sede. ¡El que lo quiera, que venga a buscarlo!',
     en:'The {nome} went to the {perdedor} party and came back with their banner. It is already hanging in our HQ. Anyone who wants it can come and get it!'},
  'Resenha encerrada e faixa no bolso! A {perdedor} vai ter que pintar outra. Assinado: {nome}.':
    {es:'¡Juntada terminada y trapo en el bolsillo! La {perdedor} va a tener que pintar otro. Firmado: {nome}.',
     en:'Party over and their banner in our pocket! The {perdedor} will have to paint a new one. Signed: the {nome}.'},
  'Hoje a {nome} fez a festa na casa de piscina da {perdedor}: chegamos com {n}, ninguém segurou e a resenha acabou no grito!':
    {es:'Hoy la {nome} hizo la fiesta en la casa quinta de la {perdedor}: llegamos con {n}, nadie aguantó ¡y la juntada terminó a los gritos!',
     en:'Today the {nome} partied at the {perdedor} pool house: we turned up with {n}, nobody held the line and the party ended in shouting!'},
  'Resenha da {perdedor}? Só se for a que a {nome} encerrou hoje. Passamos, e ninguém ficou pra contar história.':
    {es:'¿Juntada de la {perdedor}? Solo la que la {nome} terminó hoy. Pasamos, y nadie se quedó para contarla.',
     en:'The {perdedor} party? Only the one the {nome} shut down today. We came through, and nobody stayed to tell the tale.'},
  'A {perdedor} achou que ia levar a nossa faixa e saiu sem nada. Na casa da {nome} a resenha continua!':
    {es:'La {perdedor} creyó que se iba a llevar nuestro trapo y se fue sin nada. ¡En la casa de la {nome} la juntada sigue!',
     en:'The {perdedor} thought they would take our banner and left with nothing. At the {nome} house the party goes on!'},
  'Tentaram, mas a {nome} segurou a resenha inteira. A {perdedor} voltou pra casa sem faixa e sem moral.':
    {es:'Lo intentaron, pero la {nome} aguantó la juntada entera. La {perdedor} volvió a casa sin trapo y sin moral.',
     en:'They tried, but the {nome} held the whole party. The {perdedor} went home with no banner and no pride.'},
  /* ---------- onde foi, em casa ou fora, a rodada, e o grito ---------- */
  'na pista':           {es:'en la calle',       en:'on the road'},
  'na treta marcada':   {es:'en la pelea pactada', en:'in the pre-arranged brawl'},
  'no ataque ao bar':   {es:'en el ataque al bar', en:'in the bar attack'},
  'no ataque-surpresa': {es:'en el golpe sorpresa', en:'in the surprise raid'},
  'em casa':            {es:'de local',          en:'at home'},
  'em campo neutro':    {es:'en cancha neutral', en:'at a neutral ground'},
  'pela {n}ª rodada {daComp}': {es:'por la fecha {n} {daComp}', en:'in round {n} {daComp}'},
  '{pelaFase} {daComp}': {es:'{pelaFase} {daComp}', en:'{pelaFase} {daComp}'},
  'UH {nome}!': {es:'¡DALE {nome}!', en:'COME ON {nome}!'},
  'A {perdedor} veio com {m} {onde} e voltou pra casa contando os feridos. Hoje {emCidade} a rua foi da {nome}.':
    {es:'La {perdedor} vino con {m} {onde} y volvió a casa contando los heridos. Hoy {emCidade} la calle fue de la {nome}.',
     en:'{perdedor} turned up with {m} {onde} and went home counting the injured. Today {emCidade} the street belonged to {nome}.'},
  'Recado pra {perdedor}: da próxima vez tragam mais gente. Foi {n} contra {m} {onde}, {emCidade}, e deu {nome}.':
    {es:'Mensaje para la {perdedor}: la próxima traigan más gente. Fueron {n} contra {m} {onde}, {emCidade}, y ganó la {nome}.',
     en:'Message for {perdedor}: bring more people next time. It was {n} against {m} {onde}, {emCidade}, and {nome} won.'},
  'Dia de {jogo} e a {perdedor} achou que ia fazer a festa {onde} {emCidade}. Saíram correndo antes do apito. Respeita a {nome}!':
    {es:'Día de {jogo} y la {perdedor} pensó que iba a hacer la fiesta {onde} {emCidade}. Salieron corriendo antes del pitazo. ¡Respeten a la {nome}!',
     en:'{jogo} day and {perdedor} thought they would party {onde} {emCidade}. They legged it before the whistle. Respect {nome}!'},
  'No {jogo} quem jogou bonito foi a {nome}: {n} contra {m} {onde}, e a {perdedor} voltou pra casa mais cedo.':
    {es:'En el {jogo} la que jugó lindo fue la {nome}: {n} contra {m} {onde}, y la {perdedor} volvió temprano a casa.',
     en:'At {jogo} the ones who played well were {nome}: {n} against {m} {onde}, and {perdedor} went home early.'},
  'A {vencedor} levou a melhor sobre a {perdedor} {onde} {emCidade}, no dia de {jogo}.':
    {es:'La {vencedor} le ganó a la {perdedor} {onde} {emCidade}, el día de {jogo}.',
     en:'{vencedor} got the better of {perdedor} {onde} {emCidade}, on the day of {jogo}.'},
  'CLÁSSICO DA CIDADE · {A} {ga} x {gb} {B}, {rodada}.':
    {es:'CLÁSICO DE LA CIUDAD · {A} {ga} x {gb} {B}, {rodada}.', en:'CITY DERBY · {A} {ga}–{gb} {B}, {rodada}.'},
  'O FUTEBOL DA CIDADE · {time} vence {adv} por {g1} a {g2}, {onde}, {rodada}.':
    {es:'EL FÚTBOL DE LA CIUDAD · {time} le gana a {adv} por {g1} a {g2}, {onde}, {rodada}.', en:'CITY FOOTBALL · {time} beat {adv} {g1}–{g2} {onde}, {rodada}.'},
  'O FUTEBOL DA CIDADE · {time} perde para {adv} por {g2} a {g1}, {onde}, {rodada}.':
    {es:'EL FÚTBOL DE LA CIUDAD · {time} pierde con {adv} por {g2} a {g1}, {onde}, {rodada}.', en:'CITY FOOTBALL · {time} lose to {adv} {g2}–{g1} {onde}, {rodada}.'},
  'O FUTEBOL DA CIDADE · {time} empata com {adv} em {g1} a {g2}, {onde}, {rodada}.':
    {es:'EL FÚTBOL DE LA CIUDAD · {time} empata con {adv} {g1} a {g2}, {onde}, {rodada}.', en:'CITY FOOTBALL · {time} draw {g1}–{g2} with {adv} {onde}, {rodada}.'},
  'Dia de {clube} x {adv}{comp}! A {nome} vai dominar a pista e a arquibancada mostrando que a cidade é nossa. {grito}':
    {es:'¡Día de {clube} contra {adv}{comp}! La {nome} va a dominar la calle y la tribuna para mostrar que la ciudad es nuestra. {grito}',
     en:'{clube} v {adv} day{comp}! {nome} will own the road and the stands to show this city is ours. {grito}'},
  'A partir de hoje a faixa da {perdedor} é nossa. A cidade é nossa!':
    {es:'Desde hoy el trapo de la {perdedor} es nuestro. ¡La ciudad es nuestra!', en:'As of today the {perdedor} banner is ours. This city is ours!'},
  'A partir de hoje a bandeira da {perdedor} é nossa. A cidade é nossa!':
    {es:'Desde hoy la bandera de la {perdedor} es nuestra. ¡La ciudad es nuestra!', en:'As of today the {perdedor} flag is ours. This city is ours!'}
});
