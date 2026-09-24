/* Dicionário da fatia "main5" — ver docs/I18N.md.
   Chave: o texto em português, exatamente como está no código (com os
   {marcadores}). Valor: {es, en}.
   A fatia: diplomacia, eixos, a reunião da diretoria (tela, cena,
   balões, festas, assalto), o relógio, as aberturas de cena, o cartaz
   do fim da cena, o relatório da noite e a retrospectiva do ano. */
TO.i18n.registrar({
  /* ---------- eixos: a lista de candidatas ---------- */
  '{n} eixo':  {es:'{n} eje',  en:'{n} axis'},
  '{n} eixos': {es:'{n} ejes', en:'{n} axes'},
  'não dá': {es:'no se puede', en:'no go'},
  'topa':   {es:'acepta',      en:'says yes'},

  /* ---------- a reunião: um assunto trazido de fora ---------- */
  'Assunto': {es:'Tema', en:'Agenda item'},
  'traz o assunto: <b>{nome}</b> · {cargo}': {es:'trae el tema: <b>{nome}</b> · {cargo}', en:'brings it up: <b>{nome}</b> · {cargo}'},
  'Quando: <b>{dia}, {data}</b>': {es:'Cuándo: <b>{dia}, {data}</b>', en:'When: <b>{dia}, {data}</b>'},
  'Contra: <b>o bar da {nome}</b>': {es:'Contra: <b>el bar de {nome}</b>', en:'Target: <b>the {nome} bar</b>'},
  'Contra: <b>a Zona {zona} da {nome}</b>': {es:'Contra: <b>la Zona {zona} de {nome}</b>', en:'Target: <b>{nome} Zone {zona}</b>'},
  'Onde: <b>{bairro}</b>': {es:'Dónde: <b>{bairro}</b>', en:'Where: <b>{bairro}</b>'},
  'dia sem jogo e sem caravana': {es:'día sin partido y sin caravana', en:'no match and no away trip that day'},
  '· dia {data} · {idade} anos': {es:'· día {data} · {idade} años', en:'· {data} · turns {idade}'},
  'vamos':     {es:'vamos',    en:"we're going"},
  'não vamos': {es:'no vamos', en:'not going'},
  'Ir pra festa': {es:'Ir a la fiesta', en:'Go to the party'},
  'Não ir':       {es:'No ir',          en:"Don't go"},
  'R$ 2.000 · +{n} rel.':   {es:'R$ 2.000 · +{n} rel.',  en:'R$ 2,000 · +{n} rel.'},
  '−{n} rel. · −2 prestígio': {es:'−{n} rel. · −2 prestigio', en:'−{n} rel. · −2 prestige'},
  'Decidido': {es:'Decidido', en:'Decided'},

  /* ---------- a reunião: o pedido a um aliado ---------- */
  'Pedido a um aliado': {es:'Pedido a un aliado', en:'Ask an ally'},
  'Um pedido por reunião: a chance de o aliado topar é o quanto ele anda com a gente. Topando, a relação entre os dois mexe de 15 a 25 e ele ganha +2 com a gente; recusando, −3. No aproximar, a gente apresenta um aliado nosso que ainda não anda com ele — seja neutro, rival ou maior rival dele; irmã não se larga.':
    {es:'Un pedido por reunión: la chance de que el aliado acepte es cuánto anda con nosotros. Si acepta, la relación entre los dos se mueve de 15 a 25 y él gana +2 con nosotros; si rechaza, −3. Al acercar, presentamos a un aliado nuestro que todavía no anda con él — sea neutral, rival o archirrival suyo; a una hermana no se la suelta.',
     en:"One request per meeting: the chance the ally says yes is how close he is to us. If he agrees, the relationship between the two moves 15 to 25 and he gains +2 with us; if he refuses, −3. To bring closer, we introduce one of our allies who isn't close to him yet — neutral, rival or even his arch-rival; a sister firm is never dropped."},
  'A gente não tem aliado pra pedir nada — aliado é relação de +20 pra cima.':
    {es:'No tenemos aliado a quien pedirle nada — aliado es relación de +20 para arriba.', en:'We have no ally to ask anything of — an ally is a relationship of +20 or more.'},
  'Aproximar de…': {es:'Acercar a…',  en:'Bring closer to…'},
  'Afastar de…':   {es:'Alejar de…',  en:'Push away from…'},
  '{nome} · {pct} de topar': {es:'{nome} · {pct} de aceptar', en:'{nome} · {pct} to agree'},
  'Fazer o pedido': {es:'Hacer el pedido', en:'Make the request'},
  '{nome} · {rel} com {aliado}': {es:'{nome} · {rel} con {aliado}', en:'{nome} · {rel} with {aliado}'},
  'todo aliado nosso já anda com ele': {es:'todos nuestros aliados ya andan con él', en:'all our allies are already close to him'},
  'esse aliado não tem aliado pra largar': {es:'ese aliado no tiene aliado que soltar', en:'that ally has no ally to drop'},
  'Nada pra pedir nessa combinação.': {es:'Nada que pedir con esa combinación.', en:'Nothing to ask with that combination.'},
  '{pct} de a {aliado} topar sentar com a {alvo}.': {es:'{pct} de que {aliado} acepte sentarse con {alvo}.', en:'{pct} chance {aliado} agrees to sit down with {alvo}.'},
  '{pct} de a {aliado} topar se afastar da {alvo}.': {es:'{pct} de que {aliado} acepte alejarse de {alvo}.', en:'{pct} chance {aliado} agrees to back away from {alvo}.'},

  'O que pedir':   {es:'Qué pedir',       en:'What to ask'},
  'A qual aliado': {es:'A qué aliado',    en:'Which ally'},
  'De quem':       {es:'De quién',        en:'About whom'},
  'Topou.':        {es:'Aceptó.',         en:'He agreed.'},
  'Não topou.':    {es:'No aceptó.',      en:'He refused.'},

  /* ---------- a reunião: a nossa jogada nos eixos ---------- */
  'A nossa jogada': {es:'Nuestra jugada', en:'Our move'},
  'A gente está em {n} de {max} eixos — cabe em mais um. Dá pra fundar um eixo nosso, com nome e fundadores escolhidos por nós, ou bater na porta de um eixo que não tenha rival nosso dentro.':
    {es:'Estamos en {n} de {max} ejes — entramos en uno más. Podemos fundar un eje propio, con nombre y fundadores elegidos por nosotros, o tocar la puerta de un eje que no tenga rival nuestro adentro.',
     en:"We're in {n} of {max} axes — there's room for one more. We can found our own axis, with a name and founders we pick, or knock on the door of an axis with none of our rivals inside."},
  ' e ': {es:' y ', en:' and '},
  'A gente está nos dois eixos que cabem: {eixos}. Pra entrar em outro, teria que sair de um.':
    {es:'Estamos en los dos ejes que se permiten: {eixos}. Para entrar en otro, habría que salir de uno.',
     en:"We're already in the two axes allowed: {eixos}. To join another, we'd have to leave one."},
  'Fundar um eixo': {es:'Fundar un eje', en:'Found an axis'},
  'nome e fundadores por nossa conta': {es:'nombre y fundadores por nuestra cuenta', en:'name and founders our call'},
  'Pedir entrada num eixo': {es:'Pedir entrar a un eje', en:'Apply to an axis'},
  'eixo sem rival nosso dentro': {es:'eje sin rival nuestro adentro', en:'an axis with none of our rivals'},
  'A mesa dos eixos só senta de novo em {n} semana.':  {es:'La mesa de los ejes vuelve a sentarse en {n} semana.',  en:'The axis table sits again in {n} week.'},
  'A mesa dos eixos só senta de novo em {n} semanas.': {es:'La mesa de los ejes vuelve a sentarse en {n} semanas.', en:'The axis table sits again in {n} weeks.'},
  '{n} torcida':  {es:'{n} barra',  en:'{n} firm'},
  '{n} torcidas': {es:'{n} barras', en:'{n} firms'},
  'Chamar um nome': {es:'Invitar a una barra', en:'Invite a firm'},
  'o próximo nome sai em {n} dia':  {es:'la próxima invitación sale en {n} día',  en:'next invite in {n} day'},
  'o próximo nome sai em {n} dias': {es:'la próxima invitación sale en {n} días', en:'next invite in {n} days'},
  'Ata da reunião': {es:'Acta de la reunión', en:'Meeting minutes'},

  /* ---------- a tela da reunião (reserva) ---------- */
  '{n} decidido nesta mesa':  {es:'{n} decidido en esta mesa',  en:'{n} decided at this table'},
  '{n} decididos nesta mesa': {es:'{n} decididos en esta mesa', en:'{n} decided at this table'},
  'Reunião da diretoria': {es:'Reunión de directiva', en:'Board meeting'},
  '{mes} de {ano} · dia 5': {es:'{mes} de {ano} · día 5', en:'{mes} {ano} · day 5'},
  'Encerrar a reunião': {es:'Terminar la reunión', en:'End the meeting'},
  '{n} decidido':  {es:'{n} decidido',  en:'{n} decided'},
  '{n} decididos': {es:'{n} decididos', en:'{n} decided'},
  'nada a decidir': {es:'nada que decidir', en:'nothing to decide'},

  /* ---------- a reunião como cena ---------- */
  'a reunião acabou': {es:'la reunión terminó', en:'the meeting is over'},
  'Fechar o balão': {es:'Cerrar el globo', en:'Close the bubble'},
  'O presidente': {es:'El presidente', en:'The president'},
  '{mes} de {ano}': {es:'{mes} de {ano}', en:'{mes} {ano}'},
  '{n} assunto por decidir':  {es:'{n} tema por decidir',  en:'{n} item to decide'},
  '{n} assuntos por decidir': {es:'{n} temas por decidir', en:'{n} items to decide'},
  'nada mais por decidir': {es:'nada más por decidir', en:'nothing left to decide'},

  /* ---------- fundar o nosso eixo ---------- */
  'Um eixo nasce com {n} torcidas. A gente escolhe o nome e chama as aliadas; cada uma responde na hora. Vale uma mesa por trimestre, dando certo ou não.':
    {es:'Un eje nace con {n} barras. Nosotros elegimos el nombre e invitamos a las aliadas; cada una responde en el acto. Vale una mesa por trimestre, salga bien o no.',
     en:'An axis is born with {n} firms. We pick the name and invite our allies; each one answers on the spot. One table per quarter, whether it works out or not.'},
  'Nome do eixo': {es:'Nombre del eje', en:'Axis name'},
  'sigla': {es:'sigla', en:'initials'},
  'Nomes que a rua ainda não usou': {es:'Nombres que la calle todavía no usó', en:"Names the streets haven't used yet"},
  'Falta {n} pra fechar a mesa':  {es:'Falta {n} para cerrar la mesa',   en:'{n} more needed to close the table'},
  'Faltam {n} pra fechar a mesa': {es:'Faltan {n} para cerrar la mesa',  en:'{n} more needed to close the table'},
  '{n} na mesa — chance de fechar: {pct}': {es:'{n} en la mesa — chance de cerrar: {pct}', en:'{n} at the table — chance to close: {pct}'},
  'Nenhuma aliada cabe numa mesa dessas agora: é preciso relação de aliada e lugar em mais um eixo.':
    {es:'Ninguna aliada entra en una mesa así ahora: hace falta relación de aliada y lugar en un eje más.',
     en:'No ally fits a table like this right now: it takes an ally relationship and room for one more axis.'},
  'Fundar o eixo': {es:'Fundar el eje', en:'Found the axis'},
  'a gente cabe em mais {n}': {es:'nos entran {n} más', en:'room for {n} more'},
  'A mesa não fechou: {motivo}. Fora: {nomes}.': {es:'La mesa no cerró: {motivo}. Afuera: {nomes}.', en:"The table didn't close: {motivo}. Out: {nomes}."},
  'A mesa não fechou: {motivo}.': {es:'La mesa no cerró: {motivo}.', en:"The table didn't close: {motivo}."},
  'Nasceu o {eixo}, com a gente e {nomes}.': {es:'Nació el {eixo}, con nosotros y {nomes}.', en:'{eixo} is born, with us and {nomes}.'},

  /* ---------- pedir entrada num eixo ---------- */
  'Dá pra bater na porta de qualquer eixo que não tenha rival nosso dentro. Quem abre é eles: a chance é o quanto a turma de lá anda com a gente. Vale uma mesa por trimestre, e porta fechada só volta a ouvir em meio ano.':
    {es:'Podemos tocar la puerta de cualquier eje que no tenga rival nuestro adentro. Abren ellos: la chance es cuánto anda esa gente con nosotros. Vale una mesa por trimestre, y puerta cerrada no vuelve a escuchar hasta dentro de medio año.',
     en:"We can knock on the door of any axis with none of our rivals inside. They decide: the chance is how close their lot is to us. One table per quarter, and a closed door won't listen again for six months."},
  'abrem': {es:'abren', en:'let in'},
  'O {eixo} ouviu e disse não. Só voltam a ouvir em meio ano.': {es:'El {eixo} escuchó y dijo que no. No vuelven a escuchar hasta dentro de medio año.', en:"{eixo} heard us out and said no. They won't listen again for six months."},
  'A gente entrou pro {eixo}.': {es:'Entramos al {eixo}.', en:"We're in {eixo}."},
  'Novas aliadas: {nomes}.': {es:'Nuevas aliadas: {nomes}.', en:'New allies: {nomes}.'},
  'Novos rivais: {nomes}.': {es:'Nuevos rivales: {nomes}.', en:'New rivals: {nomes}.'},
  'Nenhum eixo pra bater na porta agora.': {es:'Ningún eje al que tocarle la puerta ahora.', en:'No axis to knock on right now.'},
  'uma mesa por trimestre': {es:'una mesa por trimestre', en:'one table per quarter'},

  /* ---------- chamar um nome pro nosso eixo ---------- */
  'O {eixo} chama um nome a cada {n} dias. Quem entra vira aliada de todo o eixo — e rival dos maiores rivais dele.':
    {es:'El {eixo} invita a una barra cada {n} días. La que entra se vuelve aliada de todo el eje — y rival de sus archirrivales.',
     en:"{eixo} invites one firm every {n} days. Whoever joins becomes an ally of the whole axis — and a rival of its arch-rivals."},
  'A {nome} agradeceu e ficou de fora. Volta a ouvir em meio ano.': {es:'{nome} agradeció y se quedó afuera. Vuelve a escuchar dentro de medio año.', en:'{nome} said thanks but stayed out. They will listen again in six months.'},
  'A {nome} está dentro do {eixo}.': {es:'{nome} está adentro del {eixo}.', en:'{nome} is in {eixo}.'},
  'Virou rival de {nomes}.': {es:'Se volvió rival de {nomes}.', en:'Now a rival of {nomes}.'},
  'Chamar um nome · {eixo}': {es:'Invitar a una barra · {eixo}', en:'Invite a firm · {eixo}'},

  /* ---------- a tela dos eixos ---------- */
  'Sem eixos': {es:'Sin ejes', en:'No axes'},
  'Comece um jogo novo.': {es:'Empieza un juego nuevo.', en:'Start a new game.'},
  'A nossa mesa': {es:'Nuestra mesa', en:'Our table'},
  'sem eixo nenhum': {es:'sin ningún eje', en:'no axis at all'},
  'A gente está nos dois eixos que cabem. Pra entrar em outro, teria que sair de um.':
    {es:'Estamos en los dos ejes que se permiten. Para entrar en otro, habría que salir de uno.', en:"We're already in the two axes allowed. To join another, we'd have to leave one."},
  'a mesa só senta de novo em {n} semana':  {es:'la mesa vuelve a sentarse en {n} semana',  en:'the table sits again in {n} week'},
  'a mesa só senta de novo em {n} semanas': {es:'la mesa vuelve a sentarse en {n} semanas', en:'the table sits again in {n} weeks'},
  'Novidades das alianças': {es:'Novedades de las alianzas', en:'Alliance news'},
  '{n} nova':  {es:'{n} nueva',  en:'{n} new'},
  '{n} novas': {es:'{n} nuevas', en:'{n} new'},
  'nada novo desde a última visita': {es:'nada nuevo desde la última visita', en:'nothing new since your last visit'},
  'Nada se mexeu ainda.': {es:'Nada se movió todavía.', en:'Nothing has moved yet.'},
  '{ano} · s{semana}': {es:'{ano} · s{semana}', en:'{ano} · w{semana}'},
  'Nasceu o <b>{eixo}</b>, com {nomes}': {es:'Nació el <b>{eixo}</b>, con {nomes}', en:'<b>{eixo}</b> is born, with {nomes}'},
  '{porta} aproximou {a} e {b}': {es:'{porta} acercó a {a} y {b}', en:'{porta} brought {a} and {b} closer'},
  '{porta} esfriou a treta entre {a} e {b}': {es:'{porta} enfrió la bronca entre {a} y {b}', en:'{porta} cooled the feud between {a} and {b}'},
  '{porta} puxou {a} pra longe de {b}': {es:'{porta} alejó a {a} de {b}', en:'{porta} pulled {a} away from {b}'},
  '{a} saiu do <b>{eixo}</b> — virou rival de {b}': {es:'{a} salió del <b>{eixo}</b> — se volvió rival de {b}', en:'{a} left <b>{eixo}</b> — now a rival of {b}'},
  '{a} entrou pro nosso <b>{eixo}</b>': {es:'{a} entró a nuestro <b>{eixo}</b>', en:'{a} joined our <b>{eixo}</b>'},
  '{a} entrou pro <b>{eixo}</b>': {es:'{a} entró al <b>{eixo}</b>', en:'{a} joined <b>{eixo}</b>'},

  'novo': {es:'nuevo', en:'new'},
  'a gente': {es:'nosotros', en:'us'},
  '{n} membros': {es:'{n} miembros', en:'{n} members'},
  'de nascença': {es:'de nacimiento', en:'original'},
  'fundado em {ano}': {es:'fundado en {ano}', en:'founded in {ano}'},
  '{n} praça':  {es:'{n} plaza',  en:'{n} city'},
  '{n} praças': {es:'{n} plazas', en:'{n} cities'},
  'Maiores rivais do eixo': {es:'Archirrivales del eje', en:"The axis's arch-rivals"},
  'e mais {n}': {es:'y {n} más', en:'and {n} more'},
  'o eixo já chamou alguém: o próximo nome sai em {n} dia':  {es:'el eje ya invitó a alguien: la próxima invitación sale en {n} día',  en:'the axis already invited someone: next invite in {n} day'},
  'o eixo já chamou alguém: o próximo nome sai em {n} dias': {es:'el eje ya invitó a alguien: la próxima invitación sale en {n} días', en:'the axis already invited someone: next invite in {n} days'},

  /* ---------- a página de diplomacia ---------- */
  'Relações':    {es:'Relaciones',  en:'Relationships'},
  'Eixos':       {es:'Ejes',        en:'Axes'},
  'Alianças':    {es:'Alianzas',    en:'Alliances'},
  'Rivalidades': {es:'Rivalidades', en:'Rivalries'},
  'Ideologia':   {es:'Ideología',   en:'Ideology'},
  '{a} aliadas · {r} rivais · {n} neutras': {es:'{a} aliadas · {r} rivales · {n} neutrales', en:'{a} allies · {r} rivals · {n} neutral'},
  'torcida, clube ou cidade…': {es:'barra, club o ciudad…', en:'firm, club or city…'},
  'Nada nesta aba.': {es:'Nada en esta pestaña.', en:'Nothing on this tab.'},
  'Status': {es:'Estado',   en:'Status'},
  'Ações':  {es:'Acciones', en:'Actions'},
  'Aproximar': {es:'Acercarse', en:'Get closer'},
  'Provocar':  {es:'Provocar',  en:'Provoke'},
  'Aproximação com {nome}.': {es:'Acercamiento con {nome}.', en:'Reached out to {nome}.'},
  'Provocação contra {nome}.': {es:'Provocación contra {nome}.', en:'Provoked {nome}.'},
  'Atacar {alvo}': {es:'Atacar {alvo}', en:'Attack {alvo}'},
  'Sem alvo na praça': {es:'Sin objetivo en la plaza', en:'No target in the city'},
  'Não deu.': {es:'No se pudo.', en:"Didn't work."},

  /* ---------- o relógio: por que parou, e o vigia ---------- */
  'decisão sem resposta': {es:'decisión sin respuesta', en:'unanswered decision'},
  'cena aberta': {es:'escena abierta', en:'scene open'},
  'pausa: {p}': {es:'pausa: {p}', en:'pause: {p}'},
  'linha do dia': {es:'línea del día', en:"day's timeline"},
  'cena sem palco': {es:'escena sin escenario', en:'scene without a stage'},
  'pausa de cena sem cena': {es:'pausa de escena sin escena', en:'scene pause with no scene'},
  'pausa de modal sem modal': {es:'pausa de ventana sin ventana', en:'window pause with no window'},
  'pausa de painel sem painel': {es:'pausa de panel sin panel', en:'panel pause with no panel'},
  'pausa de retrospectiva fechada': {es:'pausa del resumen del año ya cerrado', en:'pause from a closed year review'},
  'pausa de itinerário sem linha': {es:'pausa de itinerario sin línea', en:'itinerary pause with no timeline'},
  'pausa de foco com a página em foco': {es:'pausa de foco con la página en foco', en:'focus pause with the page in focus'},
  'pausa de {p} esquecida': {es:'pausa de {p} olvidada', en:'forgotten {p} pause'},
  'O relógio estava preso ({motivos}) e foi solto.': {es:'El reloj estaba trabado ({motivos}) y se destrabó.', en:'The clock was stuck ({motivos}) and has been freed.'},
  'relógio religado': {es:'reloj reencendido', en:'clock restarted'},

  /* ---------- as aberturas de cena ---------- */
  'O bonde deles não apareceu. A noite passou em branco.': {es:'La banda de ellos no apareció. La noche pasó en blanco.', en:"Their crew never showed. The night came to nothing."},

  'na rua': {es:'en la calle', en:'on the street'},
  'numa rua de classe média': {es:'en una calle de clase media', en:'on a middle-class street'},
  'numa rua de bairro nobre': {es:'en una calle de barrio rico', en:'on a posh street'},
  'na praça': {es:'en la plaza', en:'in the square'},
  'nos arredores do estádio': {es:'en los alrededores del estadio', en:'around the stadium'},

  /* ---------- jogar ou simular ---------- */
  'Descer abre a cena e você comanda o bonde. Simular roda o duelo na hora — as consequências são as mesmas.':
    {es:'Bajar abre la escena y tú comandas a la banda. Simular resuelve el duelo al instante — las consecuencias son las mismas.',
     en:'Going down opens the scene and you lead the crew. Simulate settles the fight instantly — the consequences are the same.'},
  'Descer pra briga': {es:'Bajar a la pelea', en:'Join the fight'},
  'Como vai ser': {es:'Cómo va a ser', en:'How will it go'},
  'a briga é a mesma; o comando é que muda': {es:'la pelea es la misma; cambia quién manda', en:"same fight; only who's in charge changes"},

  /* ---------- o fim da cena ---------- */
  'Voltamos inteiros por causa do bonde de vocês no portão. Isso a gente não esquece.':
    {es:'Volvimos enteros gracias a la banda de ustedes en el portón. Eso no lo olvidamos.', en:'We got home in one piece because of your crew at the gate. We won\'t forget that.'},
  'Apanhamos juntos, mas vocês desceram. Irmão é quem aparece na hora ruim. Valeu.':
    {es:'Cobramos juntos, pero ustedes bajaron. Hermano es el que aparece en las malas. Gracias.', en:'We took a beating together, but you showed up. A brother is the one who turns up when it\'s bad. Cheers.'},
  'A rival': {es:'La rival', en:'The rivals'},

  'Segurança': {es:'Seguridad', en:'Security'},
  /* ---------- escolher o alvo ---------- */
  'Quanto maior o prêmio, mais segurança na porta.': {es:'Cuanto más grande el botín, más seguridad en la puerta.', en:'The bigger the prize, the more security on the door.'},
  'O clima com cada um pesa: quem já está quente reage pior.': {es:'El clima con cada una pesa: la que ya está caliente reacciona peor.', en:'Bad blood counts: whoever is already fired up hits back harder.'},
  '{bairro} · {de} a {ate} · {n} na segurança': {es:'{bairro} · {de} a {ate} · {n} de seguridad', en:'{bairro} · {de} to {ate} · {n} on security'},
  '{bairro} · tensão {t} · {n} membros': {es:'{bairro} · tensión {t} · {n} miembros', en:'{bairro} · tension {t} · {n} members'},
  'Escolha o alvo': {es:'Elige el objetivo', en:'Pick the target'},

  /* ---------- o cartaz do fim da cena ---------- */
  'ELES CORRERAM':   {es:'ELLOS CORRIERON',  en:'THEY RAN'},
  'NOITE TRANQUILA': {es:'NOCHE TRANQUILA',  en:'QUIET NIGHT'},
  'SAÍMOS POR CIMA': {es:'SALIMOS GANANDO',  en:'WE CAME OUT ON TOP'},
  'SAÍMOS POR BAIXO':{es:'SALIMOS PERDIENDO',en:'WE CAME OFF WORSE'},

  'Feridos deles':  {es:'Heridos de ellos',   en:'Their injured'},
  'Feridos nossos': {es:'Heridos nuestros',   en:'Our injured'},
  'Eram deles':     {es:'Eran de ellos',      en:'They had'},
  'Éramos nós':     {es:'Éramos nosotros',    en:'We had'},
  'Escaparam':      {es:'Se escaparon',       en:'Got away'},
  'Armas empregadas': {es:'Armas usadas',     en:'Weapons used'},
  '{n} pedra':  {es:'{n} piedra',  en:'{n} stone'},
  '{n} pedras': {es:'{n} piedras', en:'{n} stones'},
  '{n} bomba':  {es:'{n} bomba',   en:'{n} bomb'},
  '{n} bombas': {es:'{n} bombas',  en:'{n} bombs'},
  'Dinheiro da operação': {es:'Plata de la operación', en:'Cash from the job'},

  /* ---------- o resumo da noite: onde foi ---------- */
  'NA ARQUIBANCADA': {es:'EN LA TRIBUNA',        en:'IN THE STANDS'},
  'NA EMBOSCADA':    {es:'EN LA EMBOSCADA',      en:'IN THE AMBUSH'},
  'NA TRETA':        {es:'EN LA PELEA',          en:'IN THE BRAWL'},
  'NA PRAÇA':        {es:'EN LA PLAZA',          en:'IN THE SQUARE'},
  'NA PISTA':        {es:'EN LA CALLE',          en:'ON THE ROAD'},
  'NOS ARREDORES':   {es:'EN LOS ALREDEDORES',   en:'AROUND THE STADIUM'},
  'NO CT':           {es:'EN EL PREDIO',         en:'AT THE TRAINING GROUND'},
  'NO COMÉRCIO':     {es:'EN EL COMERCIO',       en:'AT THE SHOP'},
  'NA SEDE':         {es:'EN LA SEDE',           en:'AT THE HQ'},
  'NA LOJA':         {es:'EN LA TIENDA',         en:'AT THE SHOP'},
  'NA SUBSEDE':      {es:'EN LA SUBSEDE',        en:'AT THE BRANCH'},
  'NO BAR RIVAL':    {es:'EN EL BAR RIVAL',      en:'AT THE RIVAL BAR'},
  'NO NOSSO BAR':    {es:'EN NUESTRO BAR',       en:'AT OUR BAR'},
  'NA RUA':          {es:'EN LA CALLE',          en:'ON THE STREET'},
  'ELES CORRERAM {lugar}': {es:'ELLOS CORRIERON {lugar}', en:'THEY RAN {lugar}'},
  'VITÓRIA {lugar}': {es:'VICTORIA {lugar}', en:'WIN {lugar}'},
  'DERROTA {lugar}': {es:'DERROTA {lugar}',  en:'DEFEAT {lugar}'},

  /* ---------- a retrospectiva do ano ---------- */
  'Sobe e desce':    {es:'Suben y bajan',    en:'Up and down'},
  'Torcida do ano':  {es:'Barra del año',    en:'Firm of the year'},
  'Rei da pista':    {es:'Rey de la calle',  en:'King of the road'},
  'A janela':        {es:'El mercado de pases', en:'The transfer window'},
  'O balanço':       {es:'El balance',       en:'The balance sheet'},
  'A treta do ano':  {es:'La pelea del año', en:'Brawl of the year'},
  'Retrospectiva {ano}': {es:'Resumen {ano}', en:'{ano} in review'},
  '{i} de {n} · {rot}': {es:'{i} de {n} · {rot}', en:'{i} of {n} · {rot}'},
  'Próxima': {es:'Siguiente', en:'Next'},
  'Ninguém fechou o ano com saldo na rua.': {es:'Nadie cerró el año con saldo a favor en la calle.', en:'Nobody ended the year ahead on the streets.'},
  'Sem ranking fechado.': {es:'Sin ranking cerrado.', en:'No final ranking.'},
  '{n}º': {es:'{n}.º', en:'#{n}'},
  'Nenhum clube trocou de divisão.': {es:'Ningún club cambió de división.', en:'No club changed division.'},
  'ninguém': {es:'nadie', en:'nobody'},
  'Subiram': {es:'Subieron', en:'Promoted'},
  'Caíram':  {es:'Bajaron',  en:'Relegated'},
  'Janela magra: nenhum elenco mudou de patamar.': {es:'Mercado flaco: ningún plantel cambió de nivel.', en:'A thin window: no squad moved up or down a level.'},
  'Ninguém levantou parede este ano.': {es:'Nadie levantó una pared este año.', en:'Nobody built a single wall this year.'},
  'O ano passou sem uma treta que valesse a página.': {es:'El año pasó sin una pelea que valiera la página.', en:'The year went by without a brawl worth the page.'},
  'Premiação': {es:'Premios', en:'Prize money'},
  'Saldo':  {es:'Saldo',  en:'Balance'},
  'Pontos': {es:'Puntos', en:'Points'},
  'Prêmio': {es:'Premio', en:'Prize'},
  '{n} pt': {es:'{n} pts', en:'{n} pts'},
  'A nossa levou <b>{valor}</b> — já está no caixa.': {es:'La nuestra se llevó <b>{valor}</b> — ya está en la caja.', en:'We took home <b>{valor}</b> — already in the cash.'},

  /* ---------- o troféu da noite ---------- */
  'Troféu da noite': {es:'Trofeo de la noche', en:"Tonight's trophy"},
  'revelando a foto…': {es:'revelando la foto…', en:'developing the photo…'},
  'Tomamos a bandeira da {nome}': {es:'Le quitamos la bandera a {nome}', en:"We took {nome}'s flag"},
  'Tomamos a faixa da {nome}': {es:'Le quitamos el trapo a {nome}', en:"We took {nome}'s banner"},
  '+{ganho} de prestígio pra nós · −{perda} pra eles': {es:'+{ganho} de prestigio para nosotros · −{perda} para ellos', en:'+{ganho} prestige for us · −{perda} for them'},
  'Os nossos com a bandeira da {nome}': {es:'Los nuestros con la bandera de {nome}', en:"Our lads with {nome}'s flag"},
  'Os nossos com a faixa da {nome}': {es:'Los nuestros con el trapo de {nome}', en:"Our lads with {nome}'s banner"},

  /* ---------- o relatório da noite ---------- */
  'Membros envolvidos': {es:'Miembros involucrados', en:'Members involved'},
  'Membros feridos':    {es:'Miembros heridos',      en:'Members injured'},
  'Membros presos':     {es:'Miembros presos',       en:'Members jailed'},
  'Bombas + pedras':    {es:'Bombas + piedras',      en:'Bombs + stones'},
  'Relação com a {nome}': {es:'Relación con {nome}', en:'Relationship with {nome}'},
  'Dinheiro': {es:'Plata', en:'Money'},
  'Sem consequência além dos feridos.': {es:'Sin consecuencias aparte de los heridos.', en:'No consequences beyond the injured.'},
  'Consequências': {es:'Consecuencias', en:'Consequences'},

  /* ---------- salvar ---------- */
  'NÃO SALVOU · {motivo}': {es:'NO SE GUARDÓ · {motivo}', en:'NOT SAVED · {motivo}'},
  'Salvo.': {es:'Guardado.', en:'Saved.'},
  'Não salvou: {motivo}': {es:'No se guardó: {motivo}', en:'Not saved: {motivo}'},
});
