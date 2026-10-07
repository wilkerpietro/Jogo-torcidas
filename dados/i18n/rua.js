/* Dicionário da fatia "rua" — ver docs/I18N.md.
   Chave: o texto em português, exatamente como está no código (com os
   {marcadores}). Valor: {es, en}.
   Cobre a rua livre do jogo 3D (07/10/2026): o dia livre, o presidente a
   pé com o bonde, pixar, panfletar, partir pra cima, o assalto sozinho e
   a panfletagem e a roda atacadas (ferramentas/planta_html/rua3d.js, mapa3d.js), o
   fecho da briga na rua e da panfletagem (js/gestao/acoes.js,
   js/mundo/dominio.js), a ida jogada no recado da partida (jogo3d.js e
   js/main.js) — e o que faltava da tela do planejamento da semana. */
TO.i18n.registrar({
  /* =========================================================
     O DIA LIVRE E A RUA (rua3d.js)
     ========================================================= */
  'Dia livre, presidente: nada marcado pra hoje, nem jogo nem operação. A rua tá aí — dá pra pixar muro, panfletar num bairro, caçar a rival na calçada ou tentar a sorte numa loja. O bonde tá na porta.':
    {es:'Día libre, presidente: nada agendado para hoy, ni partido ni operación. La calle está ahí: se puede pintar un muro, repartir volantes en un barrio, cazar a la rival en la vereda o probar suerte en un negocio. La barra está en la puerta.',
     en:'Free day, president: nothing scheduled today, no match and no operation. The street is out there — you can tag a wall, hand out flyers in a neighbourhood, hunt the rivals on the sidewalk or try your luck at a shop. The crew is at the door.'},
  'Sair pra rua': {es:'Salir a la calle', en:'Hit the street'},
  'Ficar na sede': {es:'Quedarse en la sede', en:'Stay at the HQ'},
  'Não perguntar mais': {es:'No preguntar más', en:'Don\'t ask again'},
  'Fechado: o recado do dia livre não volta. O botão "Sair pra rua" continua no canto.':
    {es:'Listo: el aviso del día libre no vuelve. El botón "Salir a la calle" sigue en la esquina.',
     en:'Done: the free-day message won\'t come back. The "Hit the street" button stays in the corner.'},
  'Dia livre: o presidente e o bonde saem a pé pela cidade': {es:'Día libre: el presidente y la barra salen a pie por la ciudad', en:'Free day: the president and the crew go out on foot around the city'},
  'O presidente não pode sair agora.': {es:'El presidente no puede salir ahora.', en:'The president can\'t go out right now.'},
  'A noite caiu: o presidente e o bonde voltaram pra sede.': {es:'Cayó la noche: el presidente y la barra volvieron a la sede.', en:'Night fell: the president and the crew went back to the HQ.'},
  'O presidente caiu na briga: o bonde levou ele de volta pra sede.': {es:'El presidente cayó en la pelea: la barra lo llevó de vuelta a la sede.', en:'The president went down in the fight: the crew carried him back to the HQ.'},
  'Joystick ou WASD anda · Shift corre': {es:'Joystick o WASD camina · Shift corre', en:'Joystick or WASD to walk · Shift to run'},
  'da {sigla} · {v}%': {es:'de la {sigla} · {v}%', en:'{sigla}\'s · {v}%'},
  'Bairro da rival: cuidado com as rodas dela.': {es:'Barrio de la rival: cuidado con sus rondas.', en:'Rival turf: watch out for their crews on the corners.'},
  /* o que dá pra fazer onde o presidente está */
  'Encarar a {sigla}': {es:'Enfrentar a la {sigla}', en:'Face up to {sigla}'},
  'Parte pra cima de quem veio atrapalhar': {es:'Va al choque con los que vinieron a molestar', en:'Go at the ones who came to interfere'},
  'Partir pra cima da {sigla}': {es:'Ir al choque con la {sigla}', en:'Go at {sigla}'},
  'Desfazer a panfletagem da {sigla}': {es:'Desarmar el volanteo de la {sigla}', en:'Break up {sigla}\'s flyering'},
  '{n} da {nome} · a briga é aqui mesmo': {es:'{n} de la {nome} · la pelea es acá mismo', en:'{n} from {nome} · the fight is right here'},
  'Pixar o muro ({n})': {es:'Pintar el muro ({n})', en:'Tag the wall ({n})'},
  'Muro livre · sobram {n} pixações no mês': {es:'Muro libre · quedan {n} pintadas este mes', en:'Blank wall · {n} tags left this month'},
  'Por cima da {nome} · sobram {n} pixações no mês': {es:'Encima de la {nome} · quedan {n} pintadas este mes', en:'Over {nome}\'s · {n} tags left this month'},
  'Pixando o muro…': {es:'Pintando el muro…', en:'Tagging the wall…'},
  'Pixado.': {es:'Pintado.', en:'Tagged.'},
  'Não deu pra pixar.': {es:'No se pudo pintar.', en:'Couldn\'t tag it.'},
  'Panfletar aqui': {es:'Volantear acá', en:'Hand out flyers here'},
  'Uma hora panfletando em {bairro}: recrutamento e +1 no domínio': {es:'Una hora repartiendo volantes en {bairro}: reclutamiento y +1 de dominio', en:'An hour flyering in {bairro}: recruits and +1 control'},
  'Panfletando em {bairro}…': {es:'Volanteando en {bairro}…', en:'Flyering in {bairro}…'},
  'pixando': {es:'pintando', en:'tagging'},
  'panfletando': {es:'volanteando', en:'flyering'},
  /* quem vem atrapalhar */
  'A {nome} viu a gente {oque} no bairro dela e tá vindo! Encara ou corre.': {es:'¡La {nome} nos vio {oque} en su barrio y viene para acá! Enfrentá o corré.', en:'{nome} saw us {oque} on their turf and they\'re coming! Stand or run.'},
  'A {sigla} tá vindo: encara ou corre (longe, eles desistem).': {es:'La {sigla} viene: enfrentá o corré (lejos, se rinden).', en:'{sigla} is coming: stand or run (far enough and they give up).'},
  'A {nome} desistiu: o bonde saiu de perto.': {es:'La {nome} desistió: la barra se alejó.', en:'{nome} gave up: the crew got away.'},
  'A roda da {nome} encarou a gente. Sai de perto ou vai ter briga.': {es:'La ronda de la {nome} nos encaró. Alejate o va a haber pelea.', en:'{nome}\'s crew is staring us down. Back off or there\'ll be a fight.'},
  /* o assalto sozinho */
  'Assaltar {loja} sozinho': {es:'Asaltar {loja} solo', en:'Rob {loja} alone'},
  'Só o presidente entra: o potencial é a metade': {es:'Entra solo el presidente: el botín posible es la mitad', en:'Only the president goes in: the potential take is halved'},
  'Furtivo: entra como cliente e pega sem ninguém ver. Rápido: anuncia, rende todo mundo e o alarme toca.':
    {es:'Sigiloso: entra como cliente y agarra sin que nadie vea. Rápido: anuncia, reduce a todos y suena la alarma.',
     en:'Stealthy: walk in as a customer and grab it unseen. Quick: announce it, hold everyone up and the alarm goes off.'},
  'A loja não abriu: {erro}': {es:'El negocio no abrió: {erro}', en:'The shop didn\'t open: {erro}'},
  /* a nossa panfletagem atacada */
  'Presidente, a {nome} tá indo pra cima da nossa panfletagem em {bairro}! São {n} deles contra os nossos três.':
    {es:'¡Presidente, la {nome} va contra nuestro volanteo en {bairro}! Son {n} de ellos contra nuestros tres.',
     en:'President, {nome} is going after our flyering in {bairro}! It\'s {n} of them against our three.'},
  'Ir defender': {es:'Ir a defender', en:'Go defend them'},
  'Deixar': {es:'Dejarlo', en:'Let it go'},
  'A {nome} desfez a nossa panfletagem em {bairro}.': {es:'La {nome} desarmó nuestro volanteo en {bairro}.', en:'{nome} broke up our flyering in {bairro}.'},
  'Os nossos três seguraram a panfletagem em {bairro}.': {es:'Nuestros tres sostuvieron el volanteo en {bairro}.', en:'Our three held the flyering in {bairro}.'},
  /* a nossa roda atacada (07/10/2026) */
  'Presidente, a {nome} tá indo pra cima da nossa roda em {bairro}! São {n} deles contra os {m} nossos na calçada.':
    {es:'¡Presidente, la {nome} va contra nuestra ronda en {bairro}! Son {n} de ellos contra los {m} nuestros en la vereda.',
     en:'President, {nome} is going after our crew on the corner in {bairro}! It\'s {n} of them against our {m} on the sidewalk.'},
  'A nossa roda em {bairro} segurou a {nome} sozinha.': {es:'Nuestra ronda en {bairro} aguantó sola a la {nome}.', en:'Our crew in {bairro} held off {nome} on their own.'},
  'A {nome} correu com a nossa roda em {bairro}.': {es:'La {nome} corrió a nuestra ronda en {bairro}.', en:'{nome} ran our crew off the corner in {bairro}.'},
  /* a roda da IA atacada pela IA, e a rua que cede a vez (07/10/2026) */
  'A {a} foi pra cima da roda da {b} em {bairro}!': {es:'¡La {a} fue contra la ronda de la {b} en {bairro}!', en:'{a} went after {b}\'s crew in {bairro}!'},
  'roda desfeita': {es:'ronda desarmada', en:'crew run off'},
  'Feito: o presidente e o bonde voltaram pra sede.': {es:'Hecho: el presidente y la barra volvieron a la sede.', en:'Done: the president and the crew went back to the HQ.'},
  'A diretoria chamou: o presidente voltou pra sede pra reunião.': {es:'La directiva llamó: el presidente volvió a la sede para la reunión.', en:'The board called: the president went back to the HQ for the meeting.'},
  /* o mapa da cidade (mapa3d.js) */
  'PANFLETAGEM · {sigla}': {es:'VOLANTEO · {sigla}', en:'FLYERING · {sigla}'},
  'O PRESIDENTE': {es:'EL PRESIDENTE', en:'THE PRESIDENT'},

  /* =========================================================
     O FECHO DA BRIGA NA RUA E DA PANFLETAGEM (acoes.js, dominio.js)
     ========================================================= */
  'A RUA FICOU NOSSA': {es:'LA CALLE QUEDÓ NUESTRA', en:'THE STREET IS OURS'},
  'CORRERAM COM A GENTE NA RUA': {es:'NOS CORRIERON EN LA CALLE', en:'WE GOT RUN OFF THE STREET'},
  'A PANFLETAGEM DELES ACABOU': {es:'SU VOLANTEO SE TERMINÓ', en:'THEIR FLYERING IS OVER'},
  'A PANFLETAGEM DELES FICOU': {es:'SU VOLANTEO SIGUIÓ EN PIE', en:'THEIR FLYERING STAYED PUT'},
  'A PANFLETAGEM FICOU DE PÉ': {es:'EL VOLANTEO SIGUIÓ EN PIE', en:'THE FLYERING HELD'},
  'DESFIZERAM A NOSSA PANFLETAGEM': {es:'DESARMARON NUESTRO VOLANTEO', en:'THEY BROKE UP OUR FLYERING'},
  'A RODA DELES CORREU': {es:'SU RONDA SALIÓ CORRIENDO', en:'THEIR CREW RAN'},
  'A RODA DELES SEGUROU A ESQUINA': {es:'SU RONDA AGUANTÓ LA ESQUINA', en:'THEIR CREW HELD THE CORNER'},
  'A NOSSA RODA FICOU DE PÉ': {es:'NUESTRA RONDA SIGUIÓ EN PIE', en:'OUR CREW HELD THE CORNER'},
  'CORRERAM COM A NOSSA RODA': {es:'CORRIERON A NUESTRA RONDA', en:'THEY RAN OUR CREW OFF'},
  '{a} contra {b}, em {bairro}': {es:'{a} contra {b}, en {bairro}', en:'{a} against {b}, in {bairro}'},
  'A gente já panfletou em {bairro} hoje.': {es:'Ya volanteamos en {bairro} hoy.', en:'We already flyered in {bairro} today.'},
  'Panfletagem em {bairro}: {n} novato entrou.': {es:'Volanteo en {bairro}: entró {n} novato.', en:'Flyering in {bairro}: {n} rookie joined.'},
  'Panfletagem em {bairro}: {n} novatos entraram.': {es:'Volanteo en {bairro}: entraron {n} novatos.', en:'Flyering in {bairro}: {n} rookies joined.'},
  'Panfletagem em {bairro}: ninguém quis entrar hoje.': {es:'Volanteo en {bairro}: hoy nadie quiso entrar.', en:'Flyering in {bairro}: nobody wanted to join today.'},
  'Panfletagem em {bairro}: a sede está cheia, ninguém pode entrar.': {es:'Volanteo en {bairro}: la sede está llena, nadie puede entrar.', en:'Flyering in {bairro}: the HQ is full, nobody can join.'},
  'panfletagem desfeita': {es:'volanteo desarmado', en:'flyering broken up'},
  /* o relatório da briga (main.js) */
  'Fim da briga': {es:'Fin de la pelea', en:'End of the fight'},
  'Voltar pra rua': {es:'Volver a la calle', en:'Back to the street'},
  'Seguir pro estádio': {es:'Seguir al estadio', en:'Head on to the stadium'},

  /* =========================================================
     A IDA JOGADA (jogo3d.js, main.js)
     ========================================================= */
  'É dia de jogo em casa: quer assumir a ida até o estádio — você leva o bonde a pé, pelos pontos da PM, e pode partir pra cima de quem achar no caminho — ou ir em paz?':
    {es:'Es día de partido en casa: ¿querés tomar el control de la ida al estadio —llevás a la barra a pie, por los puntos de la policía, y podés ir al choque con quien encuentres en el camino— o ir en paz?',
     en:'It\'s a home match day: do you want to take charge of the walk to the stadium — you lead the crew on foot, through the police checkpoints, and can go at anyone you find on the way — or go in peace?'},
  'Assumir a ida': {es:'Tomar el control de la ida', en:'Take charge of the walk'},
  'Em casa, a ida é decidida <b>no dia do jogo</b>: o recado da partida pergunta se você assume a ida — o presidente a pé na frente do bonde, passando pelos pontos da PM e partindo pra cima de quem achar no caminho — ou se a torcida vai em paz.':
    {es:'En casa, la ida se decide <b>el día del partido</b>: el aviso del partido pregunta si tomás el control de la ida —el presidente a pie al frente de la barra, pasando por los puntos de la policía y yendo al choque con quien encuentre en el camino— o si la hinchada va en paz.',
     en:'At home, the walk is decided <b>on match day</b>: the match message asks whether you take charge of the walk — the president on foot at the front of the crew, through the police checkpoints and going at anyone he finds on the way — or whether the firm goes in peace.'},
  'a ida é no dia': {es:'la ida se decide el día', en:'the walk is decided on the day'},
  'Fora, a ida até o estádio é decidida <b>na chegada à cidade</b>: quando a caravana descer, o recado pergunta se você assume a ida dali — o presidente a pé na frente do bonde, passando pelos pontos da PM e partindo pra cima de quem achar no caminho — ou se a torcida vai em paz. Aqui se decide a viagem.':
    {es:'De visitante, la ida al estadio se decide <b>al llegar a la ciudad</b>: cuando la caravana baja, el aviso pregunta si tomás el control de la ida desde ahí —el presidente a pie al frente de la barra, pasando por los puntos de la policía y yendo al choque con quien encuentre en el camino— o si la hinchada va en paz. Acá se decide el viaje.',
     en:'Away, the walk to the stadium is decided <b>on arrival in the city</b>: when the coach drops the crew off, the message asks whether you take charge of the walk from there — the president on foot at the front of the crew, through the police checkpoints and going at anyone he finds on the way — or whether the firm goes in peace. Here you decide the trip.'},
  'a ida se decide na chegada': {es:'la ida se decide al llegar', en:'the walk is decided on arrival'},

  /* =========================================================
     O PLANEJAMENTO DA SEMANA (main.js) — o que faltava
     ========================================================= */
  'Planejamento': {es:'Planificación', en:'Planning'},
  'Planejamento da semana': {es:'Planificación de la semana', en:'Weekly planning'},
  'Abrir o planejamento': {es:'Abrir la planificación', en:'Open the planning'},
  'Ver o planejamento': {es:'Ver la planificación', en:'See the planning'},
  'Fechar (Esc)': {es:'Cerrar (Esc)', en:'Close (Esc)'},
  'Decidir depois': {es:'Decidir después', en:'Decide later'},
  'Falta decidir': {es:'Falta decidir', en:'Still to decide'},
  'Falta: {o}': {es:'Falta: {o}', en:'Missing: {o}'},
  'A semana custa': {es:'La semana cuesta', en:'The week costs'},
  'Nada pra planejar nesta semana.': {es:'Nada que planificar esta semana.', en:'Nothing to plan this week.'},
  'Nenhum jogo nesta praça na semana.': {es:'Ningún partido en esta plaza esta semana.', en:'No matches in this city this week.'},
  'Esse jogo já passou.': {es:'Ese partido ya pasó.', en:'That match is over.'},
  'Nada a decidir.': {es:'Nada que decidir.', en:'Nothing to decide.'},
  'já foi': {es:'ya pasó', en:'done'},
  'em paz': {es:'en paz', en:'in peace'},
  'atacar: falta o alvo': {es:'atacar: falta el objetivo', en:'attack: no target yet'},
  'em cima da {nome}': {es:'encima de la {nome}', en:'going at {nome}'},
  'investida contra {nome}': {es:'avance contra la {nome}', en:'raid on {nome}'},
  'deixar passar': {es:'dejar pasar', en:'let it pass'},
  'ninguém hostil': {es:'nadie hostil', en:'nobody hostile'},
  '{n} na caravana': {es:'{n} en la caravana', en:'{n} on the trip'},
  'ALI': {es:'ALI', en:'ALLY'},
  'ALIADOS': {es:'ALIADOS', en:'ALLIES'},
  '{n} aliado chegando': {es:'{n} aliado llegando', en:'{n} ally arriving'},
  '{n} aliados chegando': {es:'{n} aliados llegando', en:'{n} allies arriving'},
  '{n} aliado chegando · {k} recebido': {es:'{n} aliado llegando · {k} recibido', en:'{n} ally arriving · {k} hosted'},
  '{n} aliados chegando · {k} recebidos': {es:'{n} aliados llegando · {k} recibidos', en:'{n} allies arriving · {k} hosted'},
  'Quem vai estar na rua': {es:'Quién va a estar en la calle', en:'Who\'ll be on the street'},
  'a estimativa do olheiro, do lado da nossa gente': {es:'la estimación del espía, junto a nuestra gente', en:'the scout\'s estimate, next to our own people'},
  'as torcidas do jogo, na nossa praça': {es:'las hinchadas del partido, en nuestra plaza', en:'the match\'s firms, in our city'},
  'Ninguém mais na rua nesse dia.': {es:'Nadie más en la calle ese día.', en:'Nobody else on the street that day.'},
  'jogo de outros clubes na praça': {es:'partido de otros clubes en la plaza', en:'other clubs\' match in the city'},
  'Vão na caravana': {es:'Van en la caravana', en:'Going on the trip'},
  '{valor} por cabeça · {n} aptos': {es:'{valor} por cabeza · {n} aptos', en:'{valor} per head · {n} fit'},
  'custa {valor} à torcida': {es:'le cuesta {valor} a la hinchada', en:'costs the firm {valor}'},
  '{valor} à torcida': {es:'{valor} a la hinchada', en:'{valor} to the firm'},
  'A estrada': {es:'La ruta', en:'The road'},
  'sem hostil no caminho': {es:'sin hostiles en el camino', en:'no hostiles on the way'},
  'praça hostil': {es:'plaza hostil', en:'hostile city'},
  'Lá, quem recebe': {es:'Allá, quién recibe', en:'Who hosts us there'},
  'Pedir ajuda à {nome}': {es:'Pedir ayuda a la {nome}', en:'Ask {nome} for help'},
  'na cidade deles': {es:'en su ciudad', en:'in their city'},
  'na nossa praça': {es:'en nuestra plaza', en:'in our city'},
  'portão, bandeira e bateria': {es:'portón, bandera y bombos', en:'gate, flag and drums'},
  'ninguém arrisca nada': {es:'nadie arriesga nada', en:'nobody risks anything'},
  '{n} alvo possível': {es:'{n} objetivo posible', en:'{n} possible target'},
  '{n} alvos possíveis': {es:'{n} objetivos posibles', en:'{n} possible targets'},
  'prestígio em jogo, feridos e presos': {es:'prestigio en juego, heridos y presos', en:'prestige at stake, injuries and arrests'},
  'relação {n}': {es:'relación {n}', en:'relations {n}'},
  '{valor} cada a mais': {es:'{valor} cada una de más', en:'{valor} for each extra'},
  'Bombas no estoque': {es:'Bombas en stock', en:'Bombs in stock'},
  'A nossa investida': {es:'Nuestro avance', en:'Our raid'},
  'só aparece na cidade e só para o tempo se for marcada': {es:'solo aparece en la ciudad y solo detiene el tiempo si está marcado', en:'only shows up in the city, and only stops the clock if it\'s set'},
  'o jogo corre sozinho': {es:'el partido corre solo', en:'the match plays out on its own'},
  'o dia segue no ritmo de sempre': {es:'el día sigue al ritmo de siempre', en:'the day goes on at the usual pace'},
  '{n} hostil na rua': {es:'{n} hostil en la calle', en:'{n} hostile on the street'},
  '{n} hostis na rua': {es:'{n} hostiles en la calle', en:'{n} hostiles on the street'},
  'custa 1 ação · o nosso bonde vai até eles': {es:'cuesta 1 acción · nuestra barra va hasta ellos', en:'costs 1 action · our crew goes to them'},
  'Quem chega na nossa praça': {es:'Quién llega a nuestra plaza', en:'Who\'s coming to our city'},
  'receber bem sobe a relação; não receber, o aliado cobra depois': {es:'recibir bien sube la relación; no recibir, el aliado cobra después', en:'hosting well raises relations; not hosting, the ally collects later'},
  '~{n} aliados': {es:'~{n} aliados', en:'~{n} allies'},
  '{n} aptos': {es:'{n} aptos', en:'{n} fit'},
  'mais': {es:'más', en:'more'},
  'menos': {es:'menos', en:'less'},
  /* a linha do dia de jogo e o relógio (main.js) */
  'a caminho do estádio · na cidade': {es:'camino al estadio · en la ciudad', en:'on the way to the stadium · in the city'},
  'na estrada · a caravana segue viagem': {es:'en la ruta · la caravana sigue viaje', en:'on the road · the trip goes on'},
  'pausa do jogo da cidade já montado': {es:'pausa del partido de la ciudad ya armado', en:'pause for the city match already set up'},
  'pausa do jogo da cidade sem o jogo': {es:'pausa del partido de la ciudad sin el partido', en:'pause for the city match with no match'},
  'pausa dos hóspedes sem hóspedes saindo': {es:'pausa de los huéspedes sin huéspedes saliendo', en:'pause for guests with no guests leaving'}
});
