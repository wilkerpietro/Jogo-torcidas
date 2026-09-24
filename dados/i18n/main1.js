/* Dicionário da fatia "main1" — ver docs/I18N.md.
   Chave: o texto em português, exatamente como está no código (com os
   {marcadores}). Valor: {es, en}.
   A fatia: js/main.js do topo até "O RECORTE DE JORNAL DA RODADA" —
   entrada no jogo, sair pro menu, a ideologia, a moldura do feed, o
   ticker, o cartão quebrado, a partida ao vivo, os pênaltis, a briga
   da arquibancada e o itinerário do dia de jogo. (O menu, as
   Configurações e a seleção de torcida estão em menu.js.) */
TO.i18n.registrar({
  /* ---------- entrada no jogo / sair pro menu ---------- */
  'Mensagem de {nome}': {es:'Mensaje de {nome}', en:'Message from {nome}'},
  'Voltar ao menu principal': {es:'Volver al menú principal', en:'Back to main menu'},
  'A partida foi salva agora. Ela continua na vaga dela, e o Continuar do menu abre de onde você parou.':
    {es:'La partida se acaba de guardar. Sigue en su ranura, y el Continuar del menú la abre donde la dejaste.',
     en:'The game was just saved. It stays in its slot, and Continue on the menu picks up where you left off.'},
  'NÃO DEU PRA SALVAR agora. Voltando ao menu, o que não foi salvo antes se perde.':
    {es:'NO SE PUDO GUARDAR ahora. Si vuelves al menú, se pierde lo que no se guardó antes.',
     en:"COULDN'T SAVE right now. If you go back to the menu, anything not saved before is lost."},

  /* ---------- a ideologia ---------- */
  'Ideologia — vale toda semana': {es:'Ideología — vale todas las semanas', en:'Ideology — applies every week'},
  'Nosso jogo':             {es:'Nuestro partido',             en:'Our match'},
  'Aliados na cidade':      {es:'Aliados en la ciudad',        en:'Allies in town'},
  'Outros jogos na cidade': {es:'Otros partidos en la ciudad', en:'Other matches in town'},
  'R$ {valor} por cabeça':  {es:'R$ {valor} por cabeza',       en:'R$ {valor} a head'},
  'de graça':               {es:'gratis',                      en:'free'},
  '{rel} de relação com o aliado — {nota}':
    {es:'{rel} de relación con el aliado — {nota}', en:'{rel} relationship with the ally — {nota}'},
  'O olheiro sempre pergunta antes de cada jogo. O botão "Seguir padrão" da mensagem executa o que está definido aqui.':
    {es:'El informante siempre pregunta antes de cada partido. El botón "Seguir la norma" del mensaje hace lo que está definido acá.',
     en:'The scout always asks before every match. The "Follow default" button on the message does what is set here.'},
  'Ideologia salva.': {es:'Ideología guardada.', en:'Ideology saved.'},

  /* ---------- a barra do feed ---------- */
  'Data do jogo — o dia corre sozinho; um painel aberto ou uma decisão pendente param o tempo':
    {es:'Fecha del juego — el día corre solo; un panel abierto o una decisión pendiente frenan el tiempo',
     en:'Game date — the day runs on its own; an open panel or a pending decision stops the clock'},
  'Empurrar o dia: passa pro dia seguinte sem esperar':
    {es:'Adelantar el día: pasa al día siguiente sin esperar', en:'Push the day: jump to the next day without waiting'},
  'Empurrar o dia': {es:'Adelantar el día', en:'Push the day'},
  'Responda o que está aberto — o tempo está parado.':
    {es:'Responde lo que está abierto: el tiempo está parado.', en:"Answer what's open — the clock is stopped."},
  'O dia não andou: {motivos}.': {es:'El día no avanzó: {motivos}.', en:"The day didn't move: {motivos}."},
  'O dia não andou.':            {es:'El día no avanzó.',            en:"The day didn't move."},
  'Velocidade do tempo (vale pro dia e pra briga) — agora em {v}×; clique pra alternar 1×/2×':
    {es:'Velocidad del tiempo (vale para el día y para la pelea) — ahora en {v}×; toca para alternar 1×/2×',
     en:'Time speed (for the day and the fight) — now {v}×; click to switch 1×/2×'},
  'Mostrar mais antigas ({n})': {es:'Mostrar más antiguas ({n})', en:'Show older ({n})'},

  /* ---------- o ticker ---------- */
  'Últimas':     {es:'Últimas',      en:'Latest'},
  'algum lugar': {es:'algún lugar',  en:'somewhere'},
  'Revanche: {a} e {b} se pegaram em {cidade}':
    {es:'Revancha: {a} y {b} se agarraron en {cidade}', en:'Rematch: {a} and {b} went at it in {cidade}'},
  '{a} e {b} se pegaram em {cidade}':
    {es:'{a} y {b} se agarraron en {cidade}', en:'{a} and {b} went at it in {cidade}'},
  ': a {venc} levou a melhor e ficou com a bandeira da {de}':
    {es:': {venc} se llevó la mejor parte y se quedó con la bandera de {de}', en:": {venc} came out on top and took {de}'s flag"},
  ': a {venc} levou a melhor e ficou com a faixa da {de}':
    {es:': {venc} se llevó la mejor parte y se quedó con el trapo de {de}', en:": {venc} came out on top and took {de}'s banner"},
  ': a {venc} levou a melhor': {es:': {venc} se llevó la mejor parte', en:': {venc} came out on top'},
  ' e ficou com a bandeira da {de}': {es:' y la bandera de {de} cambió de manos', en:": {de}'s flag changed hands"},
  ' e ficou com a faixa da {de}':    {es:' y el trapo de {de} cambió de manos',   en:": {de}'s banner changed hands"},

  /* ---------- o cartão quebrado ---------- */
  'Arquivo': {es:'Archivo', en:'Archive'},
  'Mensagem antiga que não pôde ser desenhada.':
    {es:'Mensaje viejo que no se pudo mostrar.', en:"Old message that couldn't be shown."},
  'Deixar pra lá':  {es:'Dejarlo pasar', en:'Let it go'},
  'deixado pra lá': {es:'lo dejamos pasar', en:'let it go'},

  /* ---------- quem fala no cabeçalho do cartão ---------- */
  'Olheiro': {es:'Informante', en:'Scout'},
  'Jornal':  {es:'Diario',     en:'Paper'},

  /* ---------- a partida ao vivo ---------- */
  'Pausar/seguir (espaço)': {es:'Pausar/seguir (espacio)', en:'Pause/resume (space)'},
  'Velocidade da partida':  {es:'Velocidad del partido',   en:'Match speed'},
  'Clima do estádio: {clima}': {es:'Clima del estadio: {clima}', en:'Stadium mood: {clima}'},
  'TRANQUILO':   {es:'TRANQUILO',    en:'CALM'},
  'ESQUENTANDO': {es:'CALENTÁNDOSE', en:'HEATING UP'},
  'TENSO':       {es:'TENSO',        en:'TENSE'},
  "{min}' · GOL do {time} — {c} × {f}": {es:"{min}' · GOL de {time} — {c} × {f}", en:"{min}' · {time} GOAL — {c} × {f}"},
  'Fim do tempo normal — vai pros pênaltis.':
    {es:'Fin del tiempo reglamentario: se va a los penales.', en:'End of normal time — it goes to penalties.'},
  "{min}' · A arquibancada se pegou — o jogo espera.":
    {es:"{min}' · La tribuna se agarró: el partido espera.", en:"{min}' · The stands kicked off — the match waits."},

  /* ---------- os pênaltis ---------- */
  'disputa de pênaltis': {es:'tanda de penales', en:'penalty shootout'},
  'Vai bater…':          {es:'Va a patear…',     en:'Stepping up…'},
  '{time} — na rede!':   {es:'{time} — ¡adentro!', en:'{time} — in the net!'},
  '{time} — perdeu!':    {es:'{time} — ¡lo erró!', en:'{time} — missed!'},
  '{time} passa nos pênaltis, por {alto} a {baixo}.':
    {es:'{time} pasa por penales, {alto} a {baixo}.', en:'{time} go through on penalties, {alto}–{baixo}.'},

  /* ---------- a briga da arquibancada ---------- */
  'O clima azedou e a arquibancada se pegou.':
    {es:'El clima se pudrió y la tribuna se agarró.', en:'The mood turned sour and the stands kicked off.'},
  '{nomes} ficou na cadeira: é aliada da {de}.':
    {es:'{nomes} se quedó en su lugar: es aliada de {de}.', en:'{nomes} stayed in their seats: allied with {de}.'},
  '{nomes} ficaram na cadeira: são aliadas da {de}.':
    {es:'{nomes} se quedaron en su lugar: son aliadas de {de}.', en:'{nomes} stayed in their seats: allied with {de}.'},
  'e': {es:'y', en:'and'},

  /* ---------- o itinerário do dia de jogo ---------- */
  'Dia de jogo': {es:'Día de partido', en:'Match day'},
  'o dia ainda não começou': {es:'el día todavía no empezó', en:"the day hasn't started yet"},
  '<b>{n}</b> nosso':  {es:'<b>{n}</b> nuestro',  en:'<b>{n}</b> of ours'},
  '<b>{n}</b> nossos': {es:'<b>{n}</b> nuestros', en:'<b>{n}</b> of ours'},
  '+ <b>{n}</b> da {nome}': {es:'+ <b>{n}</b> de {nome}', en:'+ <b>{n}</b> from {nome}'},
  '<b>{n}</b> da {nome}':   {es:'<b>{n}</b> de {nome}',   en:'<b>{n}</b> from {nome}'},
  'a partida rolando · o dia só segue no apito final':
    {es:'el partido en juego · el día sigue con el pitazo final', en:'match under way · the day moves on at the final whistle'},
  'a {nome} manda {n} pra escolta': {es:'{nome} manda {n} de escolta', en:'{nome} send {n} as escort'},
  'a escolta da {nome} fica': {es:'la escolta de {nome} se queda', en:"{nome}'s escort stays behind"},
  'passando · {lugar}': {es:'pasando · {lugar}', en:'passing · {lugar}'},
  'seguindo': {es:'siguiendo', en:'moving on'},
  'recado na parada · esperando você responder':
    {es:'aviso en la parada · esperando tu respuesta', en:'message at the stop · waiting for your answer'},
  'Diretor de rua · investida marcada no planejamento':
    {es:'Directivo de calle · ataque marcado en la planificación', en:'Street boss · raid set in the plan'},
  'Hoje é o dia. A {nome} vai estar em {onde}, e a gente vai pra cima.':
    {es:'Hoy es el día. {nome} va a estar en {onde}, y les vamos a ir encima.',
     en:"Today's the day. {nome} will be at {onde}, and we're going at them."},
  'Ir pra cima': {es:'Ir encima', en:'Go at them'},
  'Emboscada · {nome}': {es:'Emboscada · {nome}', en:'Ambush · {nome}'},
  'Pegaram a caravana na estrada. A {nome} fechou a pista.':
    {es:'Agarraron la caravana en la ruta. {nome} cortó el camino.', en:'They caught the convoy on the road. {nome} blocked the way.'},
  'Foi em {onde}.': {es:'Fue en {onde}.', en:'It was at {onde}.'},
  'Descer pra treta':     {es:'Bajar a pelear', en:'Get stuck in'},
  'Mandar seguir viagem': {es:'Seguir viaje',   en:'Keep driving'},
  'Caiu em cima da gente · {nome}': {es:'Nos cayeron encima · {nome}', en:'Jumped us · {nome}'},
  'A {nome} caiu em cima da gente.': {es:'{nome} nos cayó encima.', en:'{nome} jumped us.'},
  'Pra cima deles': {es:'Encima de ellos', en:'At them'},
  'Deixar quieto':  {es:'Dejarlo quieto',  en:'Leave it'},
  'Ninguém descendo: <b>Moral −3 · Prestígio −3,5 · Relação −6</b>':
    {es:'Si nadie baja: <b>Moral −3 · Prestigio −3,5 · Relación −6</b>',
     en:'If nobody goes down: <b>Morale −3 · Prestige −3.5 · Relationship −6</b>'},
  'Roda o duelo sem abrir a cena. As consequências são as mesmas.':
    {es:'Resuelve el duelo sin abrir la escena. Las consecuencias son las mismas.',
     en:'Runs the fight without opening the scene. Same consequences.'},
  'Ninguém desceu. <span class="ruim">Moral −3 · Prestígio −3,5 · Relação −6</span>':
    {es:'Nadie bajó. <span class="ruim">Moral −3 · Prestigio −3,5 · Relación −6</span>',
     en:'Nobody went down. <span class="ruim">Morale −3 · Prestige −3.5 · Relationship −6</span>'},
  'duelo simulado · a linha espera': {es:'duelo simulado · la línea espera', en:'simulated fight · the line waits'},
  'cena aberta · a linha espera':    {es:'escena abierta · la línea espera', en:'scene open · the line waits'},
  'Saímos por cima.':  {es:'Salimos ganando.',   en:'We came out on top.'},
  'Saímos por baixo.': {es:'Salimos perdiendo.', en:'We came off worse.'},
  '{deles} caídos deles, {nossos} nossos':
    {es:'{deles} caídos de ellos, {nossos} nuestros', en:'{deles} of theirs down, {nossos} of ours'},
  'Segue viagem com <b>{n}</b>': {es:'Sigue viaje con <b>{n}</b>', en:'Moving on with <b>{n}</b>'},
  'eles com <b>{n}</b>':         {es:'ellos con <b>{n}</b>',       en:'them with <b>{n}</b>'}
});
