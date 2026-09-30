/* Dicionário da fatia "assalto" — ver docs/I18N.md.
   Chave: o texto em português, exatamente como está no código (com os
   {marcadores}). Valor: {es, en}.
   Cobre o assalto planejado (pedido do dono, 30/09/2026): a ficha dos
   alvos e a conta em js/gestao/acoes.js, a reunião num dia sorteado e
   o cartão do dia da operação em js/mundo/feed.js, e a tela do
   planejamento, o calendário e a volta da cena 3D em js/main.js. */
TO.i18n.registrar({
  /* =========================================================
     A FICHA DOS ALVOS (acoes.js)
     ========================================================= */
  'ao banco': {es:'al banco', en:'at the bank'},
  'à joalheria': {es:'a la joyería', en:'at the jewellery store'},
  'ao supermercado': {es:'al supermercado', en:'at the supermarket'},
  'ao posto de gasolina': {es:'a la gasolinera', en:'at the gas station'},
  'ao mercadinho': {es:'al almacén', en:'at the corner shop'},
  'à loja de roupas': {es:'a la tienda de ropa', en:'at the clothing store'},
  'Exposição': {es:'Exposición', en:'Exposure'},
  'quanta gente vê de fora: vitrine, rua, câmera': {es:'cuánta gente ve desde afuera: vidriera, calle, cámara', en:'how many people can see in: shop window, street, camera'},
  'vigia, alarme, câmera e porta travada': {es:'guardia, alarma, cámara y puerta trabada', en:'guard, alarm, camera and locked door'},
  'Movimentação': {es:'Movimiento', en:'Foot traffic'},
  'Fluxo': {es:'Flujo', en:'Traffic'},
  'clientes e quem passa: olhos e reféns': {es:'clientes y transeúntes: ojos y rehenes', en:'customers and passers-by: eyes and hostages'},
  'Atenção': {es:'Atención', en:'Alertness'},
  'o quanto quem trabalha lá desconfia': {es:'cuánto desconfía quien trabaja ahí', en:'how suspicious the staff are'},
  'Dificuldade': {es:'Dificultad', en:'Difficulty'},
  'cofre, vitrine e o tempo pra pegar': {es:'caja fuerte, vitrina y el tiempo para agarrar', en:'safe, display cases and the time it takes to grab'},
  'Recompensa potencial': {es:'Recompensa potencial', en:'Potential reward'},
  'Recompensa': {es:'Recompensa', en:'Reward'},
  'o máximo que o alvo rende': {es:'lo máximo que rinde el objetivo', en:'the most the target can yield'},
  'Abertura': {es:'Apertura', en:'Opening'},
  'na abertura': {es:'a la apertura', en:'at opening time'},
  'pouca gente, e gente com sono — mas o caixa ainda está vazio': {es:'poca gente, y gente con sueño — pero la caja todavía está vacía', en:'few people, and sleepy ones — but the till is still empty'},
  'à tarde': {es:'a la tarde', en:'in the afternoon'},
  'loja cheia: mais olhos em cima e mais gente pra render': {es:'tienda llena: más ojos encima y más gente para reducir', en:'packed store: more eyes on you and more people to hold down'},
  'Fechamento': {es:'Cierre', en:'Closing'},
  'no fechamento': {es:'al cierre', en:'at closing time'},
  'o caixa do dia inteiro e a rua escura — mas no fechamento todo mundo olha a porta': {es:'la caja de todo el día y la calle oscura — pero al cierre todos miran la puerta', en:"the whole day's takings and a dark street — but at closing everyone watches the door"},
  'Furtivo': {es:'Sigiloso', en:'Stealthy'},
  'entra como cliente e pega sem ninguém ver: pouca exposição e butim menor — se alguém perceber, vira correria': {es:'entra como cliente y agarra sin que nadie vea: poca exposición y botín menor — si alguien se da cuenta, se arma la corrida', en:'walk in as customers and take it without anyone seeing: little exposure and a smaller haul — if someone notices, it turns into a scramble'},
  'Rápido': {es:'Rápido', en:'Fast'},
  'anuncia o assalto, rende todo mundo e leva o máximo: o alarme toca e a polícia vem': {es:'anuncia el asalto, reduce a todos y se lleva lo máximo: suena la alarma y viene la policía', en:'announce the robbery, hold everyone down and take the most: the alarm goes off and the police come'},
  'na cola': {es:'encima', en:'on your tail'},
  'de olho': {es:'atenta', en:'watching'},
  'desconfiada': {es:'desconfiada', en:'suspicious'},
  'tranquila': {es:'tranquila', en:'calm'},
  'escolhe a abordagem': {es:'elegí el enfoque', en:'pick the approach'},
  'escolhe o dia': {es:'elegí el día', en:'pick the day'},

  /* =========================================================
     O FIM DA OPERAÇÃO (acoes.js)
     ========================================================= */
  'A operação {local} foi abortada, e {n} ficou pra trás: pena de {pena} dias.': {es:'La operación {local} fue abortada, y {n} quedó atrás: condena de {pena} días.', en:'The operation {local} was aborted, and {n} got left behind: {pena}-day sentence.'},
  'A operação {local} foi abortada, e {n} ficaram pra trás: pena de {pena} dias.': {es:'La operación {local} fue abortada, y {n} quedaron atrás: condena de {pena} días.', en:'The operation {local} was aborted, and {n} got left behind: {pena}-day sentences.'},
  'A operação {local} foi abortada. Ninguém caiu, ninguém levou nada.': {es:'La operación {local} fue abortada. Nadie cayó, nadie se llevó nada.', en:'The operation {local} was aborted. Nobody got caught, nobody took anything.'},
  'Deu ruim {local}: {n} preso por {pena} dias, e o dinheiro ficou lá.': {es:'Salió mal {local}: {n} preso por {pena} días, y la plata se quedó ahí.', en:'It went wrong {local}: {n} jailed for {pena} days, and the money stayed there.'},
  'Deu ruim {local}: {n} presos por {pena} dias, e o dinheiro ficou lá.': {es:'Salió mal {local}: {n} presos por {pena} días, y la plata se quedó ahí.', en:'It went wrong {local}: {n} jailed for {pena} days, and the money stayed there.'},
  'Voltaram {local} com {valor} — mas {n} caiu: pena de {pena} dias.': {es:'Volvieron {local} con {valor} — pero {n} cayó: condena de {pena} días.', en:'They came back {local} with {valor} — but {n} got caught: {pena}-day sentence.'},
  'Voltaram {local} com {valor} — mas {n} caíram: pena de {pena} dias.': {es:'Volvieron {local} con {valor} — pero {n} cayeron: condena de {pena} días.', en:'They came back {local} with {valor} — but {n} got caught: {pena}-day sentences.'},
  'Voltaram {local} com {valor}. O alarme tocou, mas ninguém caiu.': {es:'Volvieron {local} con {valor}. Sonó la alarma, pero nadie cayó.', en:'They came back {local} with {valor}. The alarm went off, but nobody got caught.'},
  'Voltaram {local} com {valor}. Ninguém chamou a polícia — mas a câmera gravou a equipe.': {es:'Volvieron {local} con {valor}. Nadie llamó a la policía — pero la cámara grabó al equipo.', en:'They came back {local} with {valor}. Nobody called the police — but the camera caught the crew.'},
  'Voltaram {local} com {valor}. Ninguém viu, ninguém sabe.': {es:'Volvieron {local} con {valor}. Nadie vio, nadie sabe.', en:'They came back {local} with {valor}. Nobody saw, nobody knows.'},
  'Um preso no assalto {ao} em {cidade}': {es:'Un preso en el asalto {ao} en {cidade}', en:'One arrested in robbery {ao} in {cidade}'},
  '{n} presos no assalto {ao} em {cidade}': {es:'{n} presos en el asalto {ao} en {cidade}', en:'{n} arrested in robbery {ao} in {cidade}'},
  'Bando assalta {loja} em {cidade} e escapa da polícia por pouco': {es:'Banda asalta {loja} en {cidade} y se escapa de la policía por poco', en:'Gang robs {loja} in {cidade} and narrowly escapes the police'},
  'Assalto {ao} em {cidade}: o alarme tocou e o bando sumiu': {es:'Asalto {ao} en {cidade}: sonó la alarma y la banda desapareció', en:'Robbery {ao} in {cidade}: the alarm went off and the gang vanished'},
  'A polícia fala em integrantes de torcida organizada.': {es:'La policía habla de integrantes de una barra.', en:'Police say members of an organised supporters group were involved.'},
  'As câmeras gravaram a ação; a polícia analisa as imagens.': {es:'Las cámaras grabaron la acción; la policía analiza las imágenes.', en:'Cameras recorded the robbery; police are going through the footage.'},
  'Ninguém foi identificado.': {es:'Nadie fue identificado.', en:'Nobody has been identified.'},
  'O prejuízo passa de {valor}.': {es:'El perjuicio supera {valor}.', en:'The losses exceed {valor}.'},
  'O bando saiu sem nada.': {es:'La banda se fue sin nada.', en:'The gang left empty-handed.'},
  'Polícia': {es:'Policía', en:'Police'},

  /* =========================================================
     A REUNIÃO E O DIA DA OPERAÇÃO (feed.js)
     ========================================================= */
  'Chefe, mapeei uns alvos na praça — do mercadinho ao banco, cada um com o seu risco. Escolhe o alvo, a equipe, o jeito e o dia, que a gente põe no calendário.': {es:'Jefe, marqué unos objetivos en la plaza — del almacén al banco, cada uno con su riesgo. Elegí el objetivo, el equipo, el modo y el día, que lo ponemos en el calendario.', en:"Boss, I've scoped out some targets in town — from the corner shop to the bank, each with its own risk. Pick the target, the crew, the approach and the day, and we'll put it on the calendar."},
  'Planejar o assalto': {es:'Planear el asalto', en:'Plan the robbery'},
  'Assalto marcado': {es:'Asalto marcado', en:'Robbery scheduled'},
  'Marcado pra {dia}, {data}: {alvo} · {n} membros · {jeito} · {hora}. Está no calendário.': {es:'Marcado para el {dia}, {data}: {alvo} · {n} miembros · {jeito} · {hora}. Está en el calendario.', en:'Scheduled for {dia}, {data}: {alvo} · {n} members · {jeito} · {hora}. It is on the calendar.'},
  'A operação {local} caiu: faltou gente — só {n} disponíveis pra uma equipe de {m}.': {es:'La operación {local} se cayó: faltó gente — solo {n} disponibles para un equipo de {m}.', en:'The operation {local} fell through: not enough people — only {n} available for a crew of {m}.'},
  'Comandar a equipe': {es:'Comandar al equipo', en:'Lead the crew'},
  'você leva a equipe pra dentro da loja': {es:'vos llevás al equipo adentro del local', en:'you take the crew into the store'},
  'Deixar a equipe fazer': {es:'Dejar que el equipo lo haga', en:'Let the crew handle it'},
  'risco {r} · a equipe se vira sem você': {es:'riesgo {r} · el equipo se arregla sin vos', en:'{r} risk · the crew manages without you'},
  'Cancelar a operação': {es:'Cancelar la operación', en:'Call off the operation'},
  'OPERAÇÃO EM ANDAMENTO — {alvo}. A equipe de {n} está no carro, na esquina: {jeito}, {quando}. Recompensa potencial de {valor}.': {es:'OPERACIÓN EN CURSO — {alvo}. El equipo de {n} está en el auto, en la esquina: {jeito}, {quando}. Recompensa potencial de {valor}.', en:'OPERATION UNDER WAY — {alvo}. The crew of {n} is in the car, around the corner: {jeito}, {quando}. Potential reward of {valor}.'},
  'Faltou gente: a operação caiu.': {es:'Faltó gente: la operación se cayó.', en:'Not enough people: the operation fell through.'},
  'Equipe': {es:'Equipo', en:'Crew'},
  'Suspeita': {es:'Sospecha', en:'Suspicion'},
  'Na esquina, esperando a ordem': {es:'En la esquina, esperando la orden', en:'Around the corner, waiting for the order'},
  'Cancelada': {es:'Cancelada', en:'Called off'},
  'Abortada': {es:'Abortada', en:'Aborted'},
  'Feita': {es:'Hecha', en:'Done'},
  'Operação cancelada. A equipe voltou pra sede.': {es:'Operación cancelada. El equipo volvió a la sede.', en:'Operation called off. The crew went back to headquarters.'},

  /* =========================================================
     A TELA DO PLANEJAMENTO, O CALENDÁRIO E A VOLTA DO 3D (main.js)
     ========================================================= */
  'a diretoria mapeou os alvos da praça': {es:'la directiva marcó los objetivos de la plaza', en:'the board has scoped out targets in town'},
  'O alvo': {es:'El objetivo', en:'The target'},
  'precisa de {n} disponíveis': {es:'necesita {n} disponibles', en:'needs {n} available'},
  'A equipe': {es:'El equipo', en:'The crew'},
  '{dentro} entram com o líder, {fora} na rua e no carro · potencial de {valor}': {es:'{dentro} entran con el líder, {fora} en la calle y en el auto · potencial de {valor}', en:'{dentro} go in with the leader, {fora} on the street and in the car · potential {valor}'},
  'Equipe maior leva mais e chama mais atenção. Quem vai é sorteado entre os disponíveis no dia.': {es:'Un equipo más grande se lleva más y llama más la atención. Quién va se sortea entre los disponibles del día.', en:"A bigger crew takes more and draws more attention. Who goes is drawn from the members available on the day."},
  'A abordagem': {es:'El enfoque', en:'The approach'},
  'O horário': {es:'El horario', en:'The time'},
  'O dia': {es:'El día', en:'The day'},
  'Nenhum dia livre nas próximas duas semanas: jogo, viagem ou outra operação em todos.': {es:'Ningún día libre en las próximas dos semanas: partido, viaje u otra operación en todos.', en:'No free day in the next two weeks: a match, a trip or another operation on every one.'},
  'Risco estimado': {es:'Riesgo estimado', en:'Estimated risk'},
  'Chance de alguém perceber': {es:'Probabilidad de que alguien se dé cuenta', en:'Chance someone notices'},
  'Polícia chegar a tempo, deixando a equipe fazer': {es:'Que llegue la policía a tiempo, si el equipo lo hace solo', en:'Police arriving in time, if the crew handles it'},
  'Atenção da polícia sobre a torcida': {es:'Atención de la policía sobre la barra', en:'Police attention on the firm'},
  'A polícia está {nivel} com a torcida. Cada assalto que faz barulho — alarme, câmera, polícia no local, gente presa — aumenta isso, e ela chega mais rápido no próximo. Esfria sozinha, dia a dia.': {es:'La policía está {nivel} con la barra. Cada asalto que hace ruido — alarma, cámara, policía en el lugar, gente presa — lo aumenta, y llega más rápido la próxima vez. Se enfría sola, día a día.', en:"The police are {nivel} about the firm. Every robbery that makes noise — alarm, camera, police on the scene, people arrested — raises it, and they get there faster next time. It cools off on its own, day by day."},
  'No dia, você comanda a equipe dentro da loja — ou deixa ela fazer sozinha.': {es:'El día, vos comandás al equipo adentro del local — o lo dejás hacerlo solo.', en:'On the day, you lead the crew inside the store — or let them handle it alone.'},
  'No dia, a equipe faz sozinha: o resultado sai do plano, da ficha de quem foi e da atenção da polícia.': {es:'El día, el equipo lo hace solo: el resultado sale del plan, de la ficha de quienes fueron y de la atención de la policía.', en:'On the day, the crew handles it alone: the result comes from the plan, the stats of who went and the police attention.'},
  'Marcar a operação': {es:'Marcar la operación', en:'Schedule the operation'},
  'Sem dia livre pra operação.': {es:'Sin día libre para la operación.', en:'No free day for the operation.'},
  'Operação encerrada': {es:'Operación terminada', en:'Operation over'},
  'Faltou gente': {es:'Faltó gente', en:'Not enough people'},
  'A loja não abriu em 3D: a equipe fez sozinha.': {es:'El local no abrió en 3D: el equipo lo hizo solo.', en:'The store did not open in 3D: the crew handled it alone.'},
  'Operação abortada': {es:'Operación abortada', en:'Operation aborted'},
  'Operação feita': {es:'Operación hecha', en:'Operation done'},
  'Reunião': {es:'Reunión', en:'Meeting'},
  '{mes} de {ano} · dia {dia}': {es:'{mes} de {ano} · día {dia}', en:'{mes} {ano} · day {dia}'},
  'pausa de assalto sem assalto': {es:'pausa de asalto sin asalto', en:'robbery pause with no robbery'}
});
