/* Dicionário da fatia "feed3" — ver docs/I18N.md.
   Chave: o texto em português, exatamente como está no código (com os
   {marcadores}). Valor: {es, en}.
   Cobre js/mundo/feed.js da campana do olheiro até o fim do arquivo:
   a campana, o dia da guerra, o ataque sofrido, o calendário do
   trimestre, a LNT, o mundo de fora, a escolta, o placar e o resumo
   do dia, o resultado de todo confronto e as respostas (responder). */
TO.i18n.registrar({
  /* ---------- 1b. a campana do olheiro ---------- */
  'na concentração': {es:'en la concentración', en:'at the pre-match gathering'},
  'na pista a caminho do estádio': {es:'en la calle camino al estadio', en:'on the road to the stadium'},
  'na rua': {es:'en la calle', en:'in the street'},
  'Fala presida, me passaram a fita de que os caras da {nome} vai atacar a gente assim que chegarmos em {cidade}. Vale ficar de olho.':
    {es:'Jefe, me pasaron el dato de que los de {nome} nos van a atacar apenas lleguemos a {cidade}. Hay que estar atentos.',
     en:"Boss, word is the {nome} lads are going to hit us as soon as we get to {cidade}. Worth keeping an eye out."},
  'Chefe, descobri que a {nome} vai atacar a gente quando passarmos por {cidade}. Bora se preparar pra esse ataque deles.':
    {es:'Jefe, me enteré de que {nome} nos va a atacar cuando pasemos por {cidade}. Vamos a prepararnos para ese ataque.',
     en:"Boss, I found out {nome} are going to hit us when we pass through {cidade}. Let's get ready for them."},
  'Fala presida, me passaram a fita de que os caras da {nome} vai atacar o nosso bar hoje. Vale ficar de olho.':
    {es:'Jefe, me pasaron el dato de que los de {nome} van a atacar nuestro bar hoy. Hay que estar atentos.',
     en:"Boss, word is the {nome} lads are going to hit our bar today. Worth keeping an eye out."},
  'Fala presida, me passaram a fita de que os caras da {nome} vai dar o bote na resenha da Zona {zona} hoje, na casa de piscina. Vale ficar de olho.':
    {es:'Jefe, me pasaron el dato de que los de {nome} van a dar el golpe hoy en la juntada de la Zona {zona}, en la casa quinta. Hay que estar atentos.',
     en:"Boss, word is the {nome} lads are going to raid the Zona {zona} party today, at the pool house. Worth keeping an eye out."},
  'Fala presida, me passaram a fita de que os caras da {nome} vai atacar a gente {lugar} no dia do jogo. Vale ficar de olho.':
    {es:'Jefe, me pasaron el dato de que los de {nome} nos van a atacar {lugar} el día del partido. Hay que estar atentos.',
     en:"Boss, word is the {nome} lads are going to hit us {lugar} on match day. Worth keeping an eye out."},
  'É cobrança: eles não engoliram a surra que levaram da gente.':
    {es:'Es revancha: no se tragaron la paliza que les dimos.',
     en:"It's payback: they haven't swallowed the kicking we gave them."},

  /* ---------- 2. o dia da guerra ---------- */
  '{vao} dos nossos · {n} bomba':  {es:'{vao} de los nuestros · {n} bomba',  en:'{vao} of ours · {n} bomb'},
  '{vao} dos nossos · {n} bombas': {es:'{vao} de los nuestros · {n} bombas', en:'{vao} of ours · {n} bombs'},
  'Hoje é o dia. A {nome} vai estar {onde} e a gente vai pra cima.':
    {es:'Hoy es el día. {nome} va a estar {onde} y vamos a ir al frente.',
     en:"Today's the day. {nome} will be {onde} and we're going at them."},
  'Hoje é o dia. A {nome} vai estar na cidade deles, em {cidade}, e a gente vai pra cima.':
    {es:'Hoy es el día. {nome} va a estar en su ciudad, en {cidade}, y vamos a ir al frente.',
     en:"Today's the day. {nome} will be on their own turf, in {cidade}, and we're going at them."},
  'Hoje é o dia. A {nome} vai estar na praça pro {casa} × {vis}, e a gente vai pra cima.':
    {es:'Hoy es el día. {nome} va a estar en la ciudad para el {casa} × {vis}, y vamos a ir al frente.',
     en:"Today's the day. {nome} will be in town for {casa} × {vis}, and we're going at them."},
  'nos arredores':  {es:'en los alrededores', en:'around the stadium'},
  'Na concentração':{es:'En la concentración', en:'At the pre-match gathering'},
  'Na pista':       {es:'En la calle', en:'On the road'},
  'Nos arredores':  {es:'En los alrededores', en:'Around the stadium'},
  'Ir pra Guerra':  {es:'Ir a la guerra', en:'Go to war'},
  'a briga vale até ±10 de prestígio': {es:'la pelea vale hasta ±10 de prestigio', en:'the fight is worth up to ±10 prestige'},

  /* ---------- 3. o ataque sofrido ---------- */
  'Invadiram nosso bar! A {nome} tá na porta quebrando tudo.':
    {es:'¡Nos invadieron el bar! {nome} está en la puerta rompiendo todo.',
     en:"They've stormed our bar! {nome} are at the door smashing the place up."},
  'A {nome} caiu em cima da nossa concentração antes do jogo!':
    {es:'¡{nome} se nos vino encima en la concentración antes del partido!',
     en:'{nome} have steamed into our pre-match gathering!'},
  'A {nome} fechou a gente na pista, a caminho do estádio!':
    {es:'¡{nome} nos cerró el paso en la calle, camino al estadio!',
     en:'{nome} have blocked us on the road to the stadium!'},
  'Pegaram a caravana na estrada. A {nome} fechou a pista.':
    {es:'Agarraron a la caravana en la ruta. {nome} cortó el camino.',
     en:'They caught the convoy on the motorway. {nome} have blocked the road.'},
  'A {nome} tá invadindo a resenha da Zona {zona} na casa de piscina! Querem levar a nossa faixa.':
    {es:'¡{nome} está invadiendo la juntada de la Zona {zona} en la casa quinta! Se quieren llevar nuestro trapo.',
     en:"{nome} are storming the Zona {zona} party at the pool house! They're after our banner."},
  'Descer pra briga':       {es:'Bajar a pelear',          en:'Get stuck in'},
  'Deixar quebrarem':       {es:'Dejar que rompan',        en:'Let them smash it'},
  'Pra cima deles':         {es:'Al frente',               en:'Go at them'},
  'Recuar pra sede':        {es:'Replegarse a la sede',    en:'Fall back to HQ'},
  'Furar e seguir pro jogo':{es:'Pasar y seguir al partido', en:'Break through and head to the match'},
  'Descer pra treta':       {es:'Bajar a pelear',          en:'Get off and fight'},
  'Mandar seguir viagem':   {es:'Seguir viaje',            en:'Keep driving'},
  'Segurar a casa':         {es:'Aguantar la casa',        en:'Hold the house'},
  'Largar a resenha':       {es:'Abandonar la juntada',    en:'Abandon the party'},
  'Segurando, Moral +1,5 · Prestígio +3,5; perdendo, Moral −3 · Prestígio −3,5':
    {es:'Aguantando, Moral +1,5 · Prestigio +3,5; perdiendo, Moral −3 · Prestigio −3,5',
     en:'Holding, Morale +1.5 · Prestige +3.5; losing, Morale −3 · Prestige −3.5'},
  'ninguém desce: Moral −3 · Prestígio −3,5 · Relação −6':
    {es:'nadie baja: Moral −3 · Prestigio −3,5 · Relación −6',
     en:'nobody goes down: Morale −3 · Prestige −3.5 · Relationship −6'},
  'levam R$ 60 por invasor + 10% do caixa':
    {es:'se llevan R$ 60 por invasor + 10% de la caja', en:'they take R$ 60 per raider + 10% of the cash'},

  /* ---------- 3b. o calendário do trimestre ---------- */
  'Zona {zona} marcou uma treta em {bairro} contra a {rival}, {valor} de cada lado, bora pro problema?':
    {es:'La Zona {zona} arregló una pelea en {bairro} contra {rival}, {valor} por lado. ¿Vamos al problema?',
     en:'Zona {zona} have set up a brawl in {bairro} against {rival}, {valor} a side. Up for it?'},
  'Bora pro problema': {es:'Vamos al problema', en:"Let's have it"},
  'Ficar de fora':     {es:'Quedarse afuera',   en:'Sit it out'},
  'Vencendo leva {valor} · Prestígio +{p} vencendo, −1 perdendo · Relação −2':
    {es:'Ganando se lleva {valor} · Prestigio +{p} ganando, −1 perdiendo · Relación −2',
     en:'Win and take {valor} · Prestige +{p} winning, −1 losing · Relationship −2'},
  'Prestígio −1 · {valor} de multa (20% da aposta)':
    {es:'Prestigio −1 · {valor} de multa (20% de la apuesta)', en:'Prestige −1 · {valor} fine (20% of the stake)'},
  'Hoje à noite, em {bairro}, {n} contra {n}. {valor} na roda. Aparece.':
    {es:'Esta noche, en {bairro}, {n} contra {n}. {valor} en juego. Los esperamos.',
     en:'Tonight, in {bairro}, {n} v {n}. {valor} on the table. Show up.'},
  /* ---------- 3c. a LNT ---------- */
  '{n}ª rodada': {es:'{n}.ª fecha', en:'Round {n}'},
  '1ª Divisão': {es:'1.ª División', en:'Division 1'},
  '2ª Divisão': {es:'2.ª División', en:'Division 2'},
  '3ª Divisão': {es:'3.ª División', en:'Division 3'},
  '4ª Divisão': {es:'4.ª División', en:'Division 4'},
  'A LNT foi fundada: 138 torcidas em quatro divisões, duas edições por ano, dez contra dez.':
    {es:'Se fundó la LNT: 138 barras en cuatro divisiones, dos ediciones por año, diez contra diez.',
     en:"The LNT is born: 138 firms in four divisions, two editions a year, ten against ten."},
  'Ver a LNT':    {es:'Ver la LNT',    en:'See the LNT'},
  'Ver a tabela': {es:'Ver la tabla',  en:'See the table'},
  'Saiu a chave da LNT: estamos na {div}, no grupo {grupo}, contra {rivais}. Dez de cada lado, cinco rodadas e depois é mata-mata.':
    {es:'Salió el sorteo de la LNT: estamos en la {div}, en el grupo {grupo}, contra {rivais}. Diez por lado, cinco fechas y después eliminación directa.',
     en:"The LNT draw is out: we're in {div}, group {grupo}, against {rivais}. Ten a side, five rounds, then knockouts."},
  '{lista} e {ultimo}': {es:'{lista} y {ultimo}', en:'{lista} and {ultimo}'},
  '{fase} do grupo {grupo} da {div}': {es:'{fase} del grupo {grupo} de la {div}', en:'{fase}, group {grupo}, {div}'},
  '{fase} da {div}': {es:'{fase} de la {div}', en:'{fase}, {div}'},
  'A LNT marcou a nossa: {fase} contra a {rival}, dez de cada lado. Quem não bota os dez no campo perde por W.O.':
    {es:'La LNT fijó la nuestra: {fase} contra {rival}, diez por lado. El que no pone a los diez en la cancha pierde por W.O.',
     en:"The LNT has set our fixture: {fase} against {rival}, ten a side. Whoever doesn't field all ten loses by walkover."},
  'Escalar a linha de frente': {es:'Mandar a la primera línea', en:'Send the front line'},
  'Quem ganha segue na LNT · Prestígio +5 vencendo, −1 perdendo · Relação −2':
    {es:'El que gana sigue en la LNT · Prestigio +5 ganando, −1 perdiendo · Relación −2',
     en:'Winner stays in the LNT · Prestige +5 winning, −1 losing · Relationship −2'},
  'Não botar bonde': {es:'No mandar a la banda', en:"Don't send the crew"},
  'A vaga é deles · Prestígio −2': {es:'El lugar es de ellos · Prestigio −2', en:'They go through · Prestige −2'},
  'Acabou a LNT: {campeao} é o campeão da 1ª Divisão.':
    {es:'Terminó la LNT: {campeao} es el campeón de la 1.ª División.',
     en:'The LNT is over: {campeao} are Division 1 champions.'},
  'Nós paramos na {fase} da {n}ª Divisão.':
    {es:'Nosotros quedamos en {fase} de la {n}.ª División.',
     en:'We went out at the {fase} stage of Division {n}.'},

  /* ---------- 3d. o mundo de fora ---------- */
  '{time} é campeão da {copa}. O título é nosso também.':
    {es:'{time} es campeón de la {copa}. El título también es nuestro.',
     en:"{time} are {copa} champions. The title's ours too."},
  '{time} levantou a {copa}, com {vice} no vice.':
    {es:'{time} levantó la {copa}, con {vice} de subcampeón.',
     en:'{time} lifted the {copa}, with {vice} runners-up.'},
  'Ver a chave': {es:'Ver el cuadro', en:'See the bracket'},
  'Fecharam as ligas da América do Sul: {lista}.':
    {es:'Terminaron las ligas de Sudamérica: {lista}.', en:'The South American leagues are done: {lista}.'},
  'Ver as ligas': {es:'Ver las ligas', en:'See the leagues'},

  /* ---------- 4. a briga da escolta ---------- */
  'A {rival} caiu em cima da {aliado} aqui na nossa cidade — e nossos {n} da escolta estão junto com eles. Vamos entrar nessa?':
    {es:'{rival} se le vino encima a {aliado} acá en nuestra ciudad, y nuestros {n} de la escolta están con ellos. ¿Nos metemos?',
     en:'{rival} have jumped {aliado} here in our city — and our {n} escort lads are with them. Are we getting involved?'},
  'Entrar na briga': {es:'Meterse en la pelea', en:'Join the fight'},
  'Relação +10 com o aliado · o prestígio da noite (até ±10) vai pra ele':
    {es:'Relación +10 con el aliado · el prestigio de la noche (hasta ±10) es para él',
     en:"Relationship +10 with the ally · the night's prestige (up to ±10) goes to them"},
  '−{n} de relação com o aliado': {es:'−{n} de relación con el aliado', en:'−{n} relationship with the ally'},
  /* ---------- 5 e 6. o placar e o resumo do dia ---------- */
  '(ida)':   {es:'(ida)',   en:'(1st leg)'},
  '(volta)': {es:'(vuelta)', en:'(2nd leg)'},
  'fase de {n} clubes': {es:'fase de {n} clubes', en:'{n}-club round'},
  'pela {n}ª rodada': {es:'por la fecha {n}', en:'in round {n}'},
  'Venda de ingressos aos sócios ({n} · R$ {preco} cada)':
    {es:'Venta de entradas a los socios ({n} · R$ {preco} cada una)', en:'Ticket sales to members ({n} · R$ {preco} each)'},
  'Hoje tem {casa} × {fora}{abertura}.': {es:'Hoy juegan {casa} × {fora}{abertura}.', en:"Today it's {casa} × {fora}{abertura}."},
  'O {casa} está em {p1}º na tabela e o {fora} em {p2}º.':
    {es:'{casa} está {p1}.º en la tabla y {fora}, {p2}.º.', en:'{casa} are No. {p1} in the table and {fora} No. {p2}.'},
  'A bola vai rolar {onde}.': {es:'La pelota va a rodar {onde}.', en:'Kick-off is {onde}.'},
  'A bola vai rolar.': {es:'La pelota va a rodar.', en:"Kick-off's coming."},
  'Iniciar partida': {es:'Empezar partido', en:'Start match'},
  'Os jogos de {dia}: {jogos} e mais {n} jogo.':  {es:'Los partidos del {dia}: {jogos} y {n} partido más.',  en:"{dia}'s matches: {jogos} and {n} more match."},
  'Os jogos de {dia}: {jogos} e mais {n} jogos.': {es:'Los partidos del {dia}: {jogos} y {n} partidos más.', en:"{dia}'s matches: {jogos} and {n} more matches."},
  'Os jogos de {dia}: {jogos}.': {es:'Los partidos del {dia}: {jogos}.', en:"{dia}'s matches: {jogos}."},
  'Ver Competições': {es:'Ver Competiciones', en:'See Competitions'},

  /* ---------- 7. o resultado de todo confronto ---------- */
  'no bairro {bairro}': {es:'en el barrio {bairro}', en:'in {bairro}'},
  'Vingança frustrada': {es:'Venganza frustrada', en:'Failed revenge'},
  'nossa (vingança frustrada)': {es:'nuestra (venganza frustrada)', en:'ours (failed revenge)'},
  'nosso (vingança frustrada)': {es:'nuestro (venganza frustrada)', en:'ours (failed revenge)'},
  '{n} dos nossos presos.': {es:'{n} de los nuestros presos.', en:'{n} of ours jailed.'},
  'A {nome} quebrou tudo {onde} e foi embora sem encontrar resistência.':
    {es:'{nome} rompió todo {onde} y se fue sin encontrar resistencia.',
     en:'{nome} smashed everything up {onde} and left without meeting any resistance.'},
  '{nos} e {eles} se pegaram {onde}: {n} ferido nosso, {deles} do lado deles.':
    {es:'{nos} y {eles} se agarraron {onde}: {n} herido nuestro, {deles} del lado de ellos.',
     en:'{nos} and {eles} went at it {onde}: {n} of ours injured, {deles} on their side.'},
  '{nos} e {eles} se pegaram {onde}: {n} feridos nossos, {deles} do lado deles.':
    {es:'{nos} y {eles} se agarraron {onde}: {n} heridos nuestros, {deles} del lado de ellos.',
     en:'{nos} and {eles} went at it {onde}: {n} of ours injured, {deles} on their side.'},
  'A {nome} levou a melhor.': {es:'{nome} se llevó la mejor parte.', en:'{nome} came out on top.'},
  'Ninguém levou a melhor.': {es:'Nadie se llevó la mejor parte.', en:'Nobody came out on top.'},
  'Anota a placa aí, teu terror tem nome!': {es:'¡Anoten bien: su pesadilla tiene nombre!', en:'Write it down, your nightmare has a name!'},
  'Correram igual galinha, cadê vocês? Ninguém sabe ninguém viu.':
    {es:'Corrieron como gallinas, ¿dónde están? Nadie sabe, nadie vio.', en:'Ran like chickens, where are you lot? Nobody knows, nobody saw.'},
  'Contamos os que correram: faltou dedo pra contar. Fica em casa da próxima.':
    {es:'Contamos a los que corrieron: nos faltaron dedos. La próxima quédense en casa.',
     en:"We counted the ones who ran: ran out of fingers. Stay home next time."},
  'Aproveita, porque isso não fica assim. Nosso bonde volta pesado.':
    {es:'Disfrútenlo, porque esto no queda así. Nuestra banda vuelve pesada.', en:"Enjoy it, because this isn't over. Our crew's coming back heavy."},
  'Fica tranquilo que a cobrança vem cara!': {es:'¡Tranquilos, que la revancha les va a salir cara!', en:"Don't worry, payback's going to cost you!"},
  'Riram hoje, choram depois. O revide é pesado.': {es:'Hoy se ríen, mañana lloran. La revancha va a ser pesada.', en:"Laugh today, cry later. The comeback's going to be heavy."},
  'nos arredores do estádio': {es:'en los alrededores del estadio', en:'around the stadium'},
  'na praça': {es:'en la plaza', en:'in the square'},
  'numa rua de periferia': {es:'en una calle de la periferia', en:'on a street out on the estates'},
  'numa rua de classe média': {es:'en una calle de clase media', en:'on a middle-class street'},
  'numa rua de classe alta': {es:'en una calle de clase alta', en:'on a posh street'},
  'no bar': {es:'en el bar', en:'at the bar'},
  'no comércio': {es:'en la zona comercial', en:'in the shopping street'},
  'no CT': {es:'en el predio de entrenamiento', en:'at the training ground'},
  'na sede': {es:'en la sede', en:'at HQ'},
  'na loja': {es:'en la tienda', en:'at the shop'},
  'na subsede': {es:'en la subsede', en:'at the branch'},
  'na arquibancada': {es:'en la tribuna', en:'in the stands'},
  'no beco': {es:'en el callejón', en:'in the alley'},
  'no pátio do galpão': {es:'en el patio del galpón', en:'in the warehouse yard'},
  'no campo de terra': {es:'en la cancha de tierra', en:'on the dirt pitch'},
  'no posto': {es:'en la estación de servicio', en:'at the petrol station'},
  'na estrada': {es:'en la ruta', en:'on the motorway'},
  'na casa de piscina': {es:'en la casa quinta', en:'at the pool house'},
  /* ---------- as respostas (responder) ---------- */
  'Protesto na porta do CT': {es:'Protesta en la puerta del predio', en:'Protest at the training ground gates'},
  'Fomos pra porta do CT cobrar satisfação. {r} de relação com o clube · +2 de prestígio.':
    {es:'Fuimos a la puerta del predio a pedir explicaciones. {r} de relación con el club · +2 de prestigio.',
     en:'We went to the training ground gates to demand answers. {r} relationship with the club · +2 prestige.'},
  'Segurou a torcida, não foi ao CT': {es:'Frenó a la barra, no fue al predio', en:'Held the firm back, skipped the training ground'},
  'Segurou a torcida a favor da diretoria do clube': {es:'Frenó a la barra a favor de la directiva del club', en:"Held the firm back to suit the club's board"},
  'Seguramos a torcida — não é hora de desgaste com a diretoria. +{r} de relação com o clube · −3 de moral: o pessoal queria ir e ficou com a impressão de que a gente joga pro outro lado.':
    {es:'Frenamos a la barra: no es momento de pelearse con la directiva. +{r} de relación con el club · −3 de moral: los muchachos querían ir y se quedaron con la idea de que jugamos para el otro lado.',
     en:"We held the firm back — not the time to fall out with the board. +{r} relationship with the club · −3 morale: the lads wanted to go and now reckon we're playing for the other side."},
  'Fechado, chefe. Qualquer coisa, o "Como funciona" fica no menu do Jogo.':
    {es:'Listo, jefe. Cualquier cosa, el "Cómo funciona" está en el menú de Partida.',
     en:'Done, boss. If you need it, "How it works" is in the Game menu.'},
  'Seguir padrão — atacar {alvos}': {es:'Seguir el plan — atacar a {alvos}', en:'Follow the default — hit {alvos}'},
  'Seguir padrão — ir em paz': {es:'Seguir el plan — ir en paz', en:'Follow the default — go in peace'},
  'Seguir padrão — cair em cima da {nome}': {es:'Seguir el plan — ir contra {nome}', en:'Follow the default — go at {nome}'},
  'Seguir padrão — deixar passar': {es:'Seguir el plan — dejar pasar', en:'Follow the default — let it go'},
  'Nosso pessoal apanhou na cidade de vocês e ninguém desceu. A gente veio de longe confiando. Anotado.':
    {es:'A los nuestros les pegaron en su ciudad y nadie bajó. Vinimos de lejos confiando. Queda anotado.',
     en:"Our lads got battered in your city and nobody came down. We came a long way trusting you. Noted."},
  'Atacar o bar — não rolou': {es:'Atacar el bar — no se dio', en:"Hit the bar — didn't happen"},
  'Não rolou: {motivo}': {es:'No se dio: {motivo}', en:"Didn't happen: {motivo}"},
  'Não rolou.': {es:'No se dio.', en:"Didn't happen."},
  'Dar o bote — não rolou': {es:'Dar el golpe — no se dio', en:"The raid — didn't happen"},
  'Não rolou: a torcida sumiu do mapa.': {es:'No se dio: la barra desapareció del mapa.', en:"Didn't happen: the firm has vanished off the map."},
  'Não rolou: a zona não tem gente de pé.': {es:'No se dio: la zona no tiene gente en pie.', en:"Didn't happen: the zone has nobody fit to go."},
  'Deixamos a resenha do rival quieta': {es:'Dejamos tranquila la juntada del rival', en:"Left the rival's party alone"},
  'Deixamos quieto. Prestígio −1 · Moral −1.': {es:'Lo dejamos pasar. Prestigio −1 · Moral −1.', en:'We let it go. Prestige −1 · Morale −1.'},
  'Atacar — não rolou': {es:'Atacar — no se dio', en:"Attack — didn't happen"},
  'Não rolou: o núcleo de lá não tem gente de pé.': {es:'No se dio: el grupo de allá no tiene gente en pie.', en:"Didn't happen: the crew out there has nobody fit to go."},
  'Ficamos de fora da treta marcada': {es:'Nos quedamos afuera de la pelea arreglada', en:'Sat out the arranged brawl'},
  'Multa por recusar a treta': {es:'Multa por rechazar la pelea', en:'Fine for turning down the brawl'},
  'Ficamos de fora. Prestígio −1 · {valor} de multa.': {es:'Nos quedamos afuera. Prestigio −1 · {valor} de multa.', en:'We sat it out. Prestige −1 · {valor} fine.'},
  'Ficamos de fora. Prestígio −1.': {es:'Nos quedamos afuera. Prestigio −1.', en:'We sat it out. Prestige −1.'},
  'W.O. na LNT': {es:'W.O. en la LNT', en:'Walkover in the LNT'},
  'Não botamos bonde: perdemos por W.O. Prestígio −2.': {es:'No mandamos a la banda: perdimos por W.O. Prestigio −2.', en:"We didn't send the crew: lost by walkover. Prestige −2."},
  'Deixamos o bar do rival quieto': {es:'Dejamos tranquilo el bar del rival', en:"Left the rival's bar alone"},
  'Valeu pela presença, irmão. A festa ficou completa com o bonde de vocês. Casa aberta sempre.':
    {es:'Gracias por venir, hermano. La fiesta quedó completa con su banda. La casa siempre abierta.',
     en:'Cheers for coming, mate. The party was complete with your crew there. Door is always open.'},
  'Presença na festa da {nome}': {es:'Presencia en la fiesta de {nome}', en:"Going to {nome}'s party"},
  'Fomos. +{n} de relação com a {nome}.': {es:'Fuimos. +{n} de relación con {nome}.', en:'We went. +{n} relationship with {nome}.'},
  'Furamos o aniversário da {nome}': {es:'Faltamos al aniversario de {nome}', en:"Skipped {nome}'s anniversary"},
  'Ficamos em casa. −{n} de relação com a {nome} · Prestígio nosso −2.':
    {es:'Nos quedamos en casa. −{n} de relación con {nome} · Nuestro prestigio −2.', en:'We stayed home. −{n} relationship with {nome} · Our prestige −2.'},
  'A treta com a {nome} esfriou de vez: neutras.': {es:'La bronca con {nome} se enfrió del todo: neutrales.', en:"The feud with {nome} has died down for good: neutral."},
  'A aliança com a {nome} acabou: neutras.': {es:'La alianza con {nome} terminó: neutrales.', en:'The alliance with {nome} is over: neutral.'},
  'A {nome} segue rival (−16). Se nada mudar, eles perguntam de novo em {n} semanas.':
    {es:'{nome} sigue siendo rival (−16). Si nada cambia, vuelven a preguntar en {n} semanas.',
     en:'{nome} stay rivals (−16). If nothing changes, they ask again in {n} weeks.'},
  'A aliança com a {nome} fica (+20). Sem ajuda, ela esfria de novo.':
    {es:'La alianza con {nome} sigue (+20). Sin ayuda, se vuelve a enfriar.', en:'The alliance with {nome} stays (+20). Without help, it cools off again.'},
  'A {nome} sentou os dois: a {alvo} agora é aliada ({v}) · +3 com a {nome}.':
    {es:'{nome} sentó a las dos: {alvo} ahora es aliada ({v}) · +3 con {nome}.',
     en:'{nome} sat both sides down: {alvo} are now allies ({v}) · +3 with {nome}.'},
  'Ficou como está. A {nome} não gostou: −3.': {es:'Quedó como estaba. A {nome} no le gustó: −3.', en:"Left as it was. {nome} weren't happy: −3."},
  'A {nome} sentou os dois: a treta com a {alvo} acabou — neutro daqui pra frente · +3 com a {nome}.':
    {es:'{nome} sentó a las dos: la bronca con {alvo} terminó, neutrales de acá en adelante · +3 con {nome}.',
     en:'{nome} sat both sides down: the feud with {alvo} is over — neutral from now on · +3 with {nome}.'},
  'A treta com a {alvo} fica de pé. A {nome} não gostou: −3.':
    {es:'La bronca con {alvo} sigue en pie. A {nome} no le gustó: −3.', en:"The feud with {alvo} stays on. {nome} weren't happy: −3."},
  'Dentro do {eixo}.': {es:'Adentro del {eixo}.', en:"We're in {eixo}."},
  'Novas aliadas: {lista}.': {es:'Nuevas aliadas: {lista}.', en:'New allies: {lista}.'},
  'Já éramos aliados de todos.': {es:'Ya éramos aliados de todos.', en:'We were already allied with all of them.'},
  'Novos rivais: {lista}.': {es:'Nuevos rivales: {lista}.', en:'New rivals: {lista}.'},
  'A {nome} está dentro do {eixo}.': {es:'{nome} está adentro del {eixo}.', en:'{nome} are in {eixo}.'},
  'Aliada nossa agora.': {es:'Ahora es aliada nuestra.', en:'Our ally now.'},
  'A gente vetou a {nome} no {eixo}.': {es:'Vetamos a {nome} en el {eixo}.', en:'We vetoed {nome} from {eixo}.'},
  'Ficamos de fora do {eixo}. −3 com a {nome}.': {es:'Nos quedamos afuera del {eixo}. −3 con {nome}.', en:'We stayed out of {eixo}. −3 with {nome}.'},
  'fora': {es:'afuera', en:'away'},
  'Caravana: {n} para {cidade}.': {es:'Caravana: {n} a {cidade}.', en:'Away trip: {n} to {cidade}.'},
  'Plano: em cima da {nome}.': {es:'Plan: ir contra {nome}.', en:'Plan: go at {nome}.'},
  'Plano: ir em paz.': {es:'Plan: ir en paz.', en:'Plan: go in peace.'},
  'O outro jogo da semana também está fechado.': {es:'El otro partido de la semana también está cerrado.', en:"The week's other match is sorted too."},
  '{valor} pagos agora.': {es:'{valor} pagados ahora.', en:'{valor} paid now.'},
  'feito': {es:'hecho', en:'done'},
  'Fim de jogo': {es:'Fin del partido', en:'Full time'},
  'Final: {casa} {gc} × {gf} {fora}{comp}.': {es:'Final: {casa} {gc} × {gf} {fora}{comp}.', en:'Full time: {casa} {gc} × {gf} {fora}{comp}.'},
  'Nos pênaltis, {a} a {b}: quem passa é o {time}.': {es:'En los penales, {a} a {b}: pasa {time}.', en:'On penalties, {a}–{b}: {time} go through.'}
});
