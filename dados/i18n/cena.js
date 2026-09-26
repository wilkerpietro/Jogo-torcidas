/* Dicionário da fatia "cena" — ver docs/I18N.md.
   A cena de briga: HUD, pad do celular, avisos, log, motivos de fim,
   o cartaz de fim da bancada, a camada 3D e os textos das cenas.
   Chave: o texto em português, exatamente como está no código (com os
   {marcadores}). Valor: {es, en}. */
TO.i18n.registrar({
  /* ---------- HUD: botões reescritos em jogo ---------- */
  'Pedra {s}s':         {es:'Piedra {s}s',        en:'Stone {s}s'},
  'Bomba {s}s':         {es:'Bomba {s}s',         en:'Bomb {s}s'},
  'Indo pro portão':    {es:'Yendo al portón',    en:'Heading to the gate'},
  'Voltar pra briga':   {es:'Volver a la pelea',  en:'Back to the fight'},
  'Sem bomba na mochila.': {es:'No quedan bombas en la mochila.', en:'No bombs left in the bag.'},
  'Bomba recarregando.':   {es:'Bomba recargando.',               en:'Bomb reloading.'},
  'solte pra jogar':       {es:'suelta para tirar',               en:'release to throw'},
  'clique · E joga · Esc cancela': {es:'clic · E tira · Esc cancela', en:'click · E throws · Esc cancels'},
  'Quadrado':           {es:'Cuadrado',           en:'Square'},

  /* ---------- HUD: a fita da PM e o placar ---------- */
  'PM EM CIMA':         {es:'POLICÍA ENCIMA',     en:'POLICE ON US'},
  'LINHA RECOMPOSTA':   {es:'LÍNEA REARMADA',     en:'LINE RESTORED'},
  'TROPA CHEGA EM {s}s':   {es:'ANTIDISTURBIOS EN {s}s', en:'RIOT SQUAD IN {s}s'},
  'CARGA EM CURSO · {s}s': {es:'CARGA EN CURSO · {s}s',  en:'CHARGE UNDERWAY · {s}s'},
  'MANDANTE':           {es:'LOCAL',              en:'HOME'},
  'VISITANTE':          {es:'VISITANTE',          en:'AWAY'},
  'caídos':             {es:'caídos',             en:'down'},
  'entraram':           {es:'entraron',           en:'got in'},
  'clima':              {es:'clima',              en:'mood'},
  'tranquilo':          {es:'tranquilo',          en:'calm'},
  'pesado':             {es:'pesado',             en:'tense'},

  /* ---------- o pad do celular ---------- */
  'BOMBA':    {es:'BOMBA',     en:'BOMB'},
  'DEFENDER': {es:'DEFENDER',  en:'BLOCK'},
  'BATER':    {es:'GOLPEAR',   en:'HIT'},
  'RECUAR':   {es:'REPLEGAR',  en:'RETREAT'},
  'AGARRAR':  {es:'AGARRAR',   en:'GRAB'},
  'CHAMAR':   {es:'LLAMAR',    en:'RALLY'},
  'FUGIR':    {es:'HUIR',      en:'FLEE'},
  'SAIR':     {es:'SALIR',     en:'EXIT'},
  'PEDRA':    {es:'PIEDRA',    en:'STONE'},
  'PORTÃO':   {es:'PORTÓN',    en:'GATE'},

  /* ---------- avisos e log da briga ---------- */
  'Bonecos desligados — a cena segue com os discos':
    {es:'Muñecos apagados: la escena sigue con los discos', en:'Figures off — the scene carries on with discs'},
  'Não sobrou ninguém pra entrar.': {es:'No quedó nadie para entrar.', en:'Nobody left to go in.'},
  'Não sobrou ninguém pra correr.': {es:'No quedó nadie para correr.', en:'Nobody left to run.'},
  '{nome} chegou na esplanada.':    {es:'{nome} llegó a la explanada.', en:'{nome} reached the forecourt.'},
  '{bonde}: veio pra cima.':        {es:'{bonde}: fue al frente.',      en:'{bonde}: charged in.'},
  '{bonde}: correu pro portão.':    {es:'{bonde}: corrió al portón.',   en:'{bonde}: ran for the gate.'},
  'O clima virou — tem bonde procurando briga.':
    {es:'El clima cambió: hay una banda buscando pelea.', en:'The mood turned — a crew is looking for a fight.'},
  'Eles voltaram pra dentro.':      {es:'Ellos volvieron adentro.',    en:'They went back inside.'},
  'Ordem de entrar: todo mundo pro portão.':
    {es:'Orden de entrar: todos al portón.', en:'Order to go in: everyone to the gate.'},
  'TODO MUNDO PRO PORTÃO':          {es:'TODOS AL PORTÓN',             en:'EVERYONE TO THE GATE'},
  'a casa acordou':                 {es:'la casa se despertó',         en:'the house woke up'},
  'A CASA ACORDOU':                 {es:'LA CASA SE DESPERTÓ',         en:'THE HOUSE WOKE UP'},
  'Te agarraram — o bonde solta':   {es:'Te agarraron: la banda te libera', en:"You're grabbed — the crew pulls you free"},
  'CHAMOU! {n} atenderam · o rival recua':
    {es:'¡LLAMASTE! Respondieron {n} · el rival retrocede', en:'RALLIED! {n} answered · the rival backs off'},
  'CHAMOU! {n} atenderam':          {es:'¡LLAMASTE! Respondieron {n}', en:'RALLIED! {n} answered'},
  'O rival chamou — recua um pouco':{es:'El rival llamó: retrocede un poco', en:'The rival rallied — back off a bit'},
  'O rival chamou':                 {es:'El rival llamó',              en:'The rival rallied'},
  'Chamou: {n} de {total} atenderam.':
    {es:'Llamaste: respondieron {n} de {total}.', en:'Rally: {n} of {total} answered.'},
  'O rival chamou o bonde dele.':   {es:'El rival llamó a su banda.',  en:'The rival called up his crew.'},
  'CONTRA!':                        {es:'¡CONTRA!',                    en:'COUNTER!'},
  'Um módulo da grade foi ao chão.':{es:'Un tramo de la valla se vino abajo.', en:'A section of the fence went down.'},
  'Um PM foi ao chão.':             {es:'Un policía cayó.',            en:'A cop went down.'},
  'Chegou reforço da PM.':          {es:'Llegaron refuerzos de la policía.', en:'Police backup arrived.'},
  'Seu líder caiu.':                {es:'Tu líder cayó.',              en:'Your leader is down.'},
  'Líder caiu':                     {es:'Líder caído',                 en:'Leader down'},
  '{nome} foi preso.':              {es:'{nome} cayó preso.',          en:'{nome} got arrested.'},
  'Grade rompida':                  {es:'Valla rota',                  en:'Fence broken'},
  'Romperam a grade. Tropa de choque a caminho ({s}s).':
    {es:'Rompieron la valla. Antidisturbios en camino ({s}s).', en:'The fence is down. Riot squad on the way ({s}s).'},
  'Romperam a grade. A PM que estava ali partiu pra cima.':
    {es:'Rompieron la valla. La policía que estaba ahí se vino encima.', en:'The fence is down. The police on site charged in.'},
  'Tropa de choque entrou':         {es:'Entraron los antidisturbios', en:'Riot squad is in'},
  '{n} PM entrou dispersando os dois lados.':
    {es:'{n} policía entró dispersando a los dos lados.', en:'{n} cop moved in, breaking up both sides.'},
  '{n} PMs entraram dispersando os dois lados.':
    {es:'{n} policías entraron dispersando a los dos lados.', en:'{n} cops moved in, breaking up both sides.'},
  'A tropa recompôs a linha.':      {es:'La tropa rearmó la línea.',   en:'The squad re-formed the line.'},
  'romperam a grade':               {es:'rompieron la valla',          en:'the fence went down'},
  'caiu gente':                     {es:'cayó gente',                  en:'people went down'},
  'a PM se mexeu':                  {es:'la policía se movió',         en:'the police moved'},
  'voou pedra':                     {es:'volaron piedras',             en:'stones flew'},
  'os bondes se encostaram':        {es:'las bandas se cruzaron',      en:'the crews made contact'},
  'O clima virou — {motivo}. Ninguém mais entra em paz.':
    {es:'El clima cambió: {motivo}. Ya nadie entra en paz.', en:'The mood turned — {motivo}. Nobody gets in peacefully now.'},
  'O clima virou':                  {es:'El clima cambió',             en:'The mood turned'},
  'PM em cima do seu bonde':        {es:'Policía encima de tu banda',  en:'Police on your crew'},
  'A PM encostou no seu pessoal. R pra recuar.':
    {es:'La policía se le vino encima a tu gente. R para retroceder.', en:'The police are on your lads. R to fall back.'},
  'Os visitantes recuaram.':        {es:'Los visitantes retrocedieron.', en:'The away side fell back.'},
  'Seu pessoal viu o tamanho deles e correu.':
    {es:'Tu gente vio lo grandes que eran y corrió.', en:'Your lads saw how big they were and ran.'},
  'Eles viram o tamanho do bonde e correram.':
    {es:'Ellos vieron el tamaño de la banda y corrieron.', en:'They saw the size of the crew and ran.'},
  'Seu pessoal correu.':            {es:'Tu gente corrió.',            en:'Your lads ran.'},
  'Os visitantes correram.':        {es:'Los visitantes corrieron.',   en:'The away side ran.'},
  'Seu pessoal correu':             {es:'Tu gente corrió',             en:'Your lads ran'},
  'Eles correram':                  {es:'Ellos corrieron',             en:'They ran'},
  'A {nome} recolhe a bandeira antes de sair.':
    {es:'{nome} levanta la bandera antes de irse.', en:'{nome} take down the flag before leaving.'},
  'A {nome} recolhe a faixa antes de sair.':
    {es:'{nome} levanta el trapo antes de irse.', en:'{nome} take down the banner before leaving.'},
  'Ordem de correr: todo mundo pra saída.':
    {es:'Orden de correr: todos a la salida.', en:'Order to run: everyone to the exit.'},
  'TODO MUNDO CORRENDO':            {es:'TODOS CORRIENDO',             en:'EVERYONE RUN'},
  'Não tem em quem jogar daqui.':   {es:'No hay a quién tirarle desde acá.', en:'Nobody to throw at from here.'},
  'Bomba deles.':                   {es:'Bomba de ellos.',             en:'Their bomb.'},
  'Recuando pro ponto de saída.':   {es:'Retrocediendo al punto de salida.', en:'Falling back to the exit point.'},
  'De volta pra cima.':             {es:'De vuelta al frente.',        en:'Back on the attack.'},
  'A {nome} corre pra recolher a faixa.':
    {es:'{nome} corre a levantar el trapo.', en:'{nome} rush to take down the banner.'},
  '{quem} saiu com a bandeira da {nome} na mão.':
    {es:'{quem} se fue con la bandera de {nome} en la mano.', en:"{quem} made off with {nome}'s flag."},
  '{quem} saiu com a faixa da {nome} na mão.':
    {es:'{quem} se fue con el trapo de {nome} en la mano.', en:"{quem} made off with {nome}'s banner."},
  'Tomaram a bandeira da {nome}!':  {es:'¡Le robaron la bandera a {nome}!', en:"{nome}'s flag has been taken!"},
  'Tomaram a faixa da {nome}!':     {es:'¡Le robaron el trapo a {nome}!',   en:"{nome}'s banner has been taken!"},
  'Bandeira tomada!':               {es:'¡Bandera robada!',            en:'Flag taken!'},
  'Faixa tomada!':                  {es:'¡Trapo robado!',              en:'Banner taken!'},

  /* ---------- os motivos de fim (vão pra tela de relatório) ---------- */
  'o presidente entrou pelo portão':
    {es:'el presidente entró por el portón', en:'the president went in through the gate'},
  'sua torcida entrou pelo portão':
    {es:'tu barra entró por el portón', en:'your firm went in through the gate'},
  'eles correram sem ninguém encostar em ninguém':
    {es:'ellos corrieron sin que nadie tocara a nadie', en:'they ran before anyone laid a finger on anyone'},
  'a noite foi tranquila e todo mundo entrou':
    {es:'la noche fue tranquila y todos entraron', en:'the night was quiet and everyone went in'},
  'não sobrou ninguém de pé dos dois lados':
    {es:'no quedó nadie en pie de ningún lado', en:'nobody left standing on either side'},
  'não sobrou ninguém deles na cena':
    {es:'no quedó ninguno de ellos en la escena', en:'none of them left on the scene'},
  'sua torcida foi corrida do lugar':
    {es:'a tu barra la corrieron del lugar', en:'your firm got run off'},
  'briga simulada':                 {es:'pelea simulada',              en:'simulated fight'},
  'Encerrado ({motivo}).':          {es:'Terminado ({motivo}).',       en:'Over ({motivo}).'},
  'Encerrado ({motivo}). Prestígio {n}.':
    {es:'Terminado ({motivo}). Prestigio {n}.', en:'Over ({motivo}). Prestige {n}.'},

  /* ---------- o cartaz de fim na própria cena (bancada) ---------- */
  'ELES CORRERAM':      {es:'ELLOS CORRIERON',    en:'THEY RAN'},
  'SAÍMOS POR CIMA':    {es:'SALIMOS GANANDO',    en:'WE CAME OUT ON TOP'},
  'NOITE TRANQUILA':    {es:'NOCHE TRANQUILA',    en:'QUIET NIGHT'},
  'SAÍMOS POR BAIXO':   {es:'SALIMOS PERDIENDO',  en:'WE CAME OFF WORSE'},
  'Feridos deles':      {es:'Heridos de ellos',   en:'Their injured'},
  'Feridos nossos':     {es:'Heridos nuestros',   en:'Our injured'},
  'Eram deles':         {es:'Eran ellos',         en:'They had'},
  'Éramos nós':         {es:'Éramos nosotros',    en:'We had'},
  'Escaparam':          {es:'Escaparon',          en:'Got away'},
  'Armas empregadas':   {es:'Armas usadas',       en:'Weapons used'},
  '{n} pedra':          {es:'{n} piedra',         en:'{n} stone'},
  '{n} pedras':         {es:'{n} piedras',        en:'{n} stones'},
  '{n} bomba':          {es:'{n} bomba',          en:'{n} bomb'},
  '{n} bombas':         {es:'{n} bombas',         en:'{n} bombs'},
  'Presos':             {es:'Presos',             en:'Jailed'},
  'Chegaram no alvo':   {es:'Llegaron al objetivo', en:'Reached the target'},
  'Nova noite':         {es:'Nueva noche',        en:'New night'},

  /* ---------- a câmera de perto (tres.js) ---------- */
  'câmera ombro':       {es:'cámara al hombro',   en:'shoulder camera'},
  'câmera alta':        {es:'cámara alta',        en:'high camera'},
  'câmera drone':       {es:'cámara dron',        en:'drone camera'},
  '{camera} · C troca · arrastar gira · roda aproxima':
    {es:'{camera} · C cambia · arrastrar gira · rueda acerca', en:'{camera} · C switches · drag to rotate · wheel to zoom'},
  'PRESO':              {es:'PRESO',              en:'JAILED'},
  'o editor é da cena de cima':
    {es:'el editor es de la escena vista desde arriba', en:'the editor is for the top-down scene'},
  'carregando fundo…':  {es:'cargando fondo…',    en:'loading background…'},
  'img/cenas/arredores.png não encontrada — usando a malha':
    {es:'img/cenas/arredores.png no encontrada: usando la malla', en:'img/cenas/arredores.png not found — using the mesh'},
  'solte a imagem pra usar de fundo':
    {es:'suelta la imagen para usarla de fondo', en:'drop the image to use it as background'},

  /* ---------- a HUD da bancada (arredores.html) e os sliders ---------- */
  'editor de cena — jogo pausado': {es:'editor de escena — juego en pausa', en:'scene editor — game paused'},
  'na {lugar}':         {es:'escena: {lugar}',    en:'scene: {lugar}'},
  'nos arredores':      {es:'en los alrededores', en:'around the stadium'},
  'Nos arredores':      {es:'En los alrededores', en:'Around the stadium'},
  '<kbd>F2</kbd> sair do editor': {es:'<kbd>F2</kbd> salir del editor', en:'<kbd>F2</kbd> exit editor'},
  '<kbd>WASD</kbd> líder · <kbd>1</kbd>–<kbd>4</kbd> formação':
    {es:'<kbd>WASD</kbd> líder · <kbd>1</kbd>–<kbd>4</kbd> formación',
     en:'<kbd>WASD</kbd> leader · <kbd>1</kbd>–<kbd>4</kbd> formation'},
  '<kbd>WASD</kbd> líder (pra onde a câmera olha) · <kbd>Q</kbd> bater · <kbd>E</kbd> defender · <kbd>2</kbd> pedra · <kbd>3</kbd> bomba · <kbd>R</kbd> recuar · <kbd>X</kbd> fugir · <kbd>C</kbd> câmera · arrastar gira · roda aproxima':
    {es:'<kbd>WASD</kbd> líder (hacia donde mira la cámara) · <kbd>Q</kbd> golpear · <kbd>E</kbd> defender · <kbd>2</kbd> piedra · <kbd>3</kbd> bomba · <kbd>R</kbd> retroceder · <kbd>X</kbd> huir · <kbd>C</kbd> cámara · arrastrar gira · rueda acerca',
     en:'<kbd>WASD</kbd> leader (where the camera looks) · <kbd>Q</kbd> hit · <kbd>E</kbd> block · <kbd>2</kbd> stone · <kbd>3</kbd> bomb · <kbd>R</kbd> fall back · <kbd>X</kbd> flee · <kbd>C</kbd> camera · drag to rotate · wheel to zoom'},
  '<kbd>WASD</kbd> líder · <kbd>Q</kbd> bater · <kbd>E</kbd> defender (segurar) · <kbd>F</kbd> agarrar · <kbd>C</kbd> chamar · <kbd>2</kbd> pedra · <kbd>3</kbd> mira da bomba (clique joga) · <kbd>R</kbd> recuar · <kbd>X</kbd> fugir · rodinha = zoom · <kbd>F2</kbd> editor de cena':
    {es:'<kbd>WASD</kbd> líder · <kbd>Q</kbd> golpear · <kbd>E</kbd> defender (mantener) · <kbd>F</kbd> agarrar · <kbd>C</kbd> llamar · <kbd>2</kbd> piedra · <kbd>3</kbd> mira de la bomba (clic tira) · <kbd>R</kbd> retroceder · <kbd>X</kbd> huir · ruedita = zoom · <kbd>F2</kbd> editor de escena',
     en:'<kbd>WASD</kbd> leader · <kbd>Q</kbd> hit · <kbd>E</kbd> block (hold) · <kbd>F</kbd> grab · <kbd>C</kbd> rally · <kbd>2</kbd> stone · <kbd>3</kbd> bomb aim (click throws) · <kbd>R</kbd> fall back · <kbd>X</kbd> flee · wheel = zoom · <kbd>F2</kbd> scene editor'},
  'Efetivo mandante':   {es:'Efectivo local',     en:'Home numbers'},
  'Efetivo visitante':  {es:'Efectivo visitante', en:'Away numbers'},
  'Velocidade':         {es:'Velocidad',          en:'Speed'},
  'Intensidade do dano':{es:'Intensidad del daño', en:'Damage intensity'},
  'Resistência da grade': {es:'Resistencia de la valla', en:'Fence strength'},
  'Força do cassetete': {es:'Fuerza de la porra', en:'Baton strength'},
  'Debandada em':       {es:'Desbandada en',      en:'Rout at'},
  'Demora da carga':    {es:'Demora de la carga', en:'Charge delay'},
  'Tropa de choque':    {es:'Antidisturbios',     en:'Riot squad'},
  '{n} PM':             {es:'{n} policías',       en:'{n} police'},
  'Tempo pra barra de pressão encher':
    {es:'Tiempo para llenar la barra de presión', en:'Time to fill the pressure bar'},
  'Chance de noite tranquila': {es:'Probabilidad de noche tranquila', en:'Chance of a quiet night'},
  'Recarga da pedra':   {es:'Recarga de la piedra', en:'Stone cooldown'},
  'Alcance da pedra':   {es:'Alcance de la piedra', en:'Stone range'},
  'Falta pro jogo':     {es:'Falta para el partido', en:'Time to kick-off'},

  /* =========================================================
     OS TEXTOS DAS CENAS (dados/cenas.js, dados/cenas_editadas.js,
     dados/cena_arredores.js e a saída padrão da ponte).
     São DADO: o editor (F2) regrava esses arquivos, e por isso eles
     ficam em português lá e são traduzidos NO PONTO EM QUE APARECEM
     (`_t(s.perto)`, `_t(D.local)`, `_t(g.aviso)`, `_t(b.rot)`…).
     A ferramenta não os vê no código — não são órfãs, não apague.
     ========================================================= */
  /* nome da cena (a HUD da bancada) */
  'Praça':               {es:'Plaza',                 en:'Square'},
  'Rua':                 {es:'Calle',                 en:'Street'},
  'Rua de classe média': {es:'Calle de clase media',  en:'Middle-class street'},
  'Rua de classe alta':  {es:'Calle de clase alta',   en:'Upper-class street'},
  'Rua em 3D':           {es:'Calle en 3D',           en:'Street in 3D'},
  'Rua de classe média em 3D': {es:'Calle de clase media en 3D', en:'Middle-class street in 3D'},
  'Rua de classe alta em 3D':  {es:'Calle de clase alta en 3D',  en:'Upper-class street in 3D'},
  'Bar':                 {es:'Bar',                   en:'Bar'},
  'Comércio':            {es:'Comercios',             en:'Shops'},
  'CT':                  {es:'Predio del club',       en:'Training ground'},
  'Casa de piscina':     {es:'Casa quinta',           en:'Pool house'},
  'Sede nível 1':        {es:'Sede nivel 1',          en:'HQ level 1'},
  'Sede nível 2':        {es:'Sede nivel 2',          en:'HQ level 2'},
  'Sede nível 3':        {es:'Sede nivel 3',          en:'HQ level 3'},
  'Sede nível 4':        {es:'Sede nivel 4',          en:'HQ level 4'},
  'Sede nível 5':        {es:'Sede nivel 5',          en:'HQ level 5'},
  'Beco':                {es:'Callejón',              en:'Alley'},
  'Galpão':              {es:'Galpón',                en:'Warehouse'},
  'Campo de terra':      {es:'Cancha de tierra',      en:'Dirt pitch'},
  'Posto':               {es:'Estación de servicio',  en:'Petrol station'},
  'Estrada':             {es:'Ruta',                  en:'Highway'},
  'Estádio de 10 mil':   {es:'Estadio de 10 mil',     en:'10,000-seat stadium'},
  'Estádio de 20 mil':   {es:'Estadio de 20 mil',     en:'20,000-seat stadium'},
  'Estádio de 40 mil':   {es:'Estadio de 40 mil',     en:'40,000-seat stadium'},

  /* local (a HUD da bancada) */
  'Na praça':            {es:'En la plaza',           en:'In the square'},
  'Na rua':              {es:'En la calle',           en:'In the street'},
  'Na rua, bairro de classe média': {es:'En la calle, barrio de clase media', en:'In the street, middle-class area'},
  'Na rua, bairro nobre':{es:'En la calle, barrio acomodado', en:'In the street, posh area'},
  'No bar deles':        {es:'En el bar de ellos',    en:'In their bar'},
  'No comércio':         {es:'En los comercios',      en:'At the shops'},
  'No CT do clube':      {es:'En el predio del club', en:"At the club's training ground"},
  'Na resenha deles, numa casa de piscina':
    {es:'En la juntada de ellos, en una casa quinta', en:'At their party, in a pool house'},
  'Na sede, reunião da diretoria': {es:'En la sede, reunión de directiva', en:'At HQ, board meeting'},
  'No beco, treta marcada':        {es:'En el callejón, pelea pactada', en:'In the alley, arranged brawl'},
  'No pátio do galpão, treta marcada':
    {es:'En el patio del galpón, pelea pactada', en:'In the warehouse yard, arranged brawl'},
  'No campo de terra, treta marcada':
    {es:'En la cancha de tierra, pelea pactada', en:'On the dirt pitch, arranged brawl'},
  'No posto, na parada da caravana':
    {es:'En la estación de servicio, en la parada de la caravana', en:'At the petrol station, convoy stop'},
  'Na estrada, pista fechada':     {es:'En la ruta, calzada cortada', en:'On the highway, road blocked'},
  'Na arquibancada':               {es:'En la tribuna', en:'In the stands'},

  /* a saída: o botão perto/longe, a dica e o motivo do fim */
  'Portão (leve o líder)': {es:'Portón (lleva al líder)', en:'Gate (bring the leader)'},
  'Leve o líder até o portão da sua torcida.':
    {es:'Lleva al líder hasta el portón de tu barra.', en:"Take the leader to your firm's gate."},
  'Sair pela rua':         {es:'Salir por la calle',       en:'Leave by the street'},
  'Saída (leve o líder)':  {es:'Salida (lleva al líder)',  en:'Exit (bring the leader)'},
  'sua torcida saiu da praça com a rua na mão':
    {es:'tu barra salió de la plaza dueña de la calle', en:'your firm left the square owning the street'},
  'Leve o líder até a boca de rua da sua torcida.':
    {es:'Lleva al líder hasta la boca de calle de tu barra.', en:"Take the leader to your firm's street corner."},
  'Furar pra fora':        {es:'Romper el cerco',          en:'Break out'},
  'Boca da rua (leve o líder)': {es:'Boca de la calle (lleva al líder)', en:'End of the street (bring the leader)'},
  'sua torcida furou o cerco e sumiu na rua':
    {es:'tu barra rompió el cerco y desapareció en la calle', en:'your firm broke the cordon and vanished down the street'},
  'Leve o líder até a ponta da rua que é sua.':
    {es:'Lleva al líder hasta la punta de la calle que es tuya.', en:'Take the leader to your end of the street.'},
  'Tomar o bar':           {es:'Tomar el bar',             en:'Take the bar'},
  'Balcão do bar (leve o líder)': {es:'Mostrador del bar (lleva al líder)', en:'Bar counter (bring the leader)'},
  'sua torcida tomou o bar deles': {es:'tu barra tomó el bar de ellos', en:'your firm took their bar'},
  'Leve o líder pra dentro, até o balcão.':
    {es:'Lleva al líder adentro, hasta el mostrador.', en:'Take the leader inside, up to the counter.'},
  'Arrombar e levar':      {es:'Forzar y llevarse todo',   en:'Break in and loot'},
  'Porta de aço (leve o líder)': {es:'Persiana de acero (lleva al líder)', en:'Steel shutter (bring the leader)'},
  'a porta de aço cedeu e a turma levou o que deu':
    {es:'la persiana de acero cedió y la banda se llevó lo que pudo', en:'the steel shutter gave way and the lads took what they could'},
  'Leve o líder até a porta de aço da joalheria.':
    {es:'Lleva al líder hasta la persiana de acero de la joyería.', en:"Take the leader to the jeweller's steel shutter."},
  'Chegar no elenco':      {es:'Llegar al plantel',        en:'Reach the squad'},
  'Gramado (leve o líder)':{es:'Césped (lleva al líder)',  en:'Pitch (bring the leader)'},
  'a torcida chegou no gramado e o elenco ouviu o que tinha de ouvir':
    {es:'la barra llegó al césped y el plantel escuchó lo que tenía que escuchar', en:'the firm reached the pitch and the squad heard what they had to hear'},
  'Leve o líder até o meio do gramado.':
    {es:'Lleva al líder hasta el medio del césped.', en:'Take the leader to the middle of the pitch.'},
  'Tomar a casa':          {es:'Tomar la casa',            en:'Take the house'},
  'Beira da piscina (leve o líder)': {es:'Borde de la piscina (lleva al líder)', en:'Poolside (bring the leader)'},
  'sua torcida tomou a resenha deles':
    {es:'tu barra se quedó con la juntada de ellos', en:'your firm took over their party'},
  'Leve o líder até a beira da piscina.':
    {es:'Lleva al líder hasta el borde de la piscina.', en:'Take the leader to the poolside.'},
  'Sair da sede':          {es:'Salir de la sede',         en:'Leave HQ'},
  'Portão da rua (leve o líder)': {es:'Portón de la calle (lleva al líder)', en:'Street gate (bring the leader)'},
  'a reunião acabou':      {es:'la reunión terminó',       en:'the meeting is over'},
  'A reunião acaba pelo botão de encerrar.':
    {es:'La reunión termina con el botón de cerrar.', en:'The meeting ends with the close button.'},
  'Boca do beco (leve o líder)': {es:'Boca del callejón (lleva al líder)', en:'Alley mouth (bring the leader)'},
  'sua torcida furou pra fora do beco':
    {es:'tu barra rompió y salió del callejón', en:'your firm broke out of the alley'},
  'Leve o líder até a boca do beco que é sua.':
    {es:'Lleva al líder hasta la boca del callejón que es tuya.', en:'Take the leader to your end of the alley.'},
  'Saída do pátio (leve o líder)': {es:'Salida del patio (lleva al líder)', en:'Yard exit (bring the leader)'},
  'sua torcida saiu do pátio por cima':
    {es:'tu barra salió del patio ganando', en:'your firm left the yard on top'},
  'Leve o líder até a saída do pátio.':
    {es:'Lleva al líder hasta la salida del patio.', en:'Take the leader to the yard exit.'},
  'Canto do campo (leve o líder)': {es:'Esquina de la cancha (lleva al líder)', en:'Corner of the pitch (bring the leader)'},
  'sua torcida saiu do campo por cima':
    {es:'tu barra salió de la cancha ganando', en:'your firm left the pitch on top'},
  'Leve o líder até o canto do campo.':
    {es:'Lleva al líder hasta la esquina de la cancha.', en:'Take the leader to the corner of the pitch.'},
  'Voltar pro ônibus':     {es:'Volver al micro',          en:'Back to the bus'},
  'Ônibus (leve o líder)': {es:'Micro (lleva al líder)',   en:'Bus (bring the leader)'},
  'a torcida voltou pro ônibus e a caravana seguiu':
    {es:'la barra volvió al micro y la caravana siguió', en:'the firm got back on the bus and the convoy moved on'},
  'Leve o líder de volta pro ônibus.':
    {es:'Lleva al líder de vuelta al micro.', en:'Take the leader back to the bus.'},
  'Sair pelo túnel':       {es:'Salir por el túnel',       en:'Leave through the tunnel'},
  'Túnel (leve o líder)':  {es:'Túnel (lleva al líder)',   en:'Tunnel (bring the leader)'},
  'sua torcida saiu pelo túnel com a bancada na mão':
    {es:'tu barra salió por el túnel dueña de la tribuna', en:'your firm left through the tunnel owning the stand'},
  'Leve o líder até o túnel do seu setor.':
    {es:'Lleva al líder hasta el túnel de tu sector.', en:"Take the leader to your section's tunnel."},

  /* o gatilho: a espera (HUD da bancada) e o aviso de quando a casa acorda */
  'eles ainda não se mexeram':        {es:'todavía no se movieron',        en:"they haven't moved yet"},
  'eles viram o bonde e vieram':      {es:'vieron a la banda y vinieron',  en:'they saw the crew and came'},
  'os donos da casa ainda não te viram': {es:'los dueños de casa todavía no te vieron', en:"the home lot haven't seen you yet"},
  'gritaram lá dentro — o bar inteiro veio pra porta':
    {es:'gritaron adentro: todo el bar salió a la puerta', en:'a shout went up inside — the whole bar came to the door'},
  'a resenha ainda não te viu':       {es:'la juntada todavía no te vio',  en:"the party hasn't seen you yet"},
  'gritaram no portão — a casa inteira veio pra cima':
    {es:'gritaron en el portón: toda la casa se vino encima', en:'a shout at the gate — the whole house came at you'},

  /* o rótulo de cada bonde (spawn) — aparece no log quando ele reage */
  '1º ESCALÃO':            {es:'1.er ESCALÓN',             en:'1ST WAVE'},
  '2º ESCALÃO':            {es:'2.º ESCALÓN',              en:'2ND WAVE'},
  '1º ESCALÃO MANDANTE':   {es:'1.er ESCALÓN LOCAL',       en:'HOME 1ST WAVE'},
  '2º ESCALÃO MANDANTE':   {es:'2.º ESCALÓN LOCAL',        en:'HOME 2ND WAVE'},
  '3º ESCALÃO MANDANTE':   {es:'3.er ESCALÓN LOCAL',       en:'HOME 3RD WAVE'},
  '1º ESCALÃO VISITANTE':  {es:'1.er ESCALÓN VISITANTE',   en:'AWAY 1ST WAVE'},
  '2º ESCALÃO VISITANTE':  {es:'2.º ESCALÓN VISITANTE',    en:'AWAY 2ND WAVE'},
  'MANDANTE 1º ESCALÃO':   {es:'LOCAL 1.er ESCALÓN',       en:'HOME 1ST WAVE'},
  'MANDANTE 2º ESCALÃO':   {es:'LOCAL 2.º ESCALÓN',        en:'HOME 2ND WAVE'},
  'MANDANTE 3º ESCALÃO':   {es:'LOCAL 3.er ESCALÓN',       en:'HOME 3RD WAVE'},
  'VISITANTE 1º ESCALÃO':  {es:'VISITANTE 1.er ESCALÓN',   en:'AWAY 1ST WAVE'},
  'VISITANTE 2º ESCALÃO':  {es:'VISITANTE 2.º ESCALÓN',    en:'AWAY 2ND WAVE'},
  'VISITANTE 3º ESCALÃO':  {es:'VISITANTE 3.er ESCALÓN',   en:'AWAY 3RD WAVE'},
  'BONDE RIVAL':           {es:'BANDA RIVAL',              en:'RIVAL CREW'},
  'RETAGUARDA':            {es:'RETAGUARDIA',              en:'REARGUARD'},
  'DONOS DA CASA':         {es:'DUEÑOS DE CASA',           en:'HOME LOT'},
  'NA MESA DE TRÁS':       {es:'EN LA MESA DEL FONDO',     en:'AT THE BACK TABLE'},
  'CAMPANA':               {es:'CAMPANA',                  en:'LOOKOUT'},
  'SEGURANÇA':             {es:'SEGURIDAD',                en:'SECURITY'},
  'REFORÇO':               {es:'REFUERZO',                 en:'BACKUP'},
  'SEGURANÇA DO CT':       {es:'SEGURIDAD DEL PREDIO',     en:'TRAINING GROUND SECURITY'},
  'ROUPEIRO E CIA':        {es:'UTILERO Y CÍA',            en:'KIT MAN & CO'},
  'DECK, LADO DA CASA':    {es:'DECK, LADO DE LA CASA',    en:'DECK, HOUSE SIDE'},
  'CHURRASQUEIRA':         {es:'PARRILLA',                 en:'BARBECUE'},
  'BEIRA DA PISCINA':      {es:'BORDE DE LA PISCINA',      en:'POOLSIDE'},
  'ESPREGUIÇADEIRAS':      {es:'REPOSERAS',                en:'SUN LOUNGERS'},
  'NA SALA':               {es:'EN EL LIVING',             en:'IN THE LOUNGE'},
  'DIRETORIA':             {es:'DIRECTIVA',                en:'BOARD'},
  'NOSSO BONDE':           {es:'NUESTRA BANDA',            en:'OUR CREW'},
  'BONDE DELES':           {es:'LA BANDA DE ELLOS',        en:'THEIR CREW'},
  'ELES, PELA PISTA':      {es:'ELLOS, POR LA RUTA',       en:'THEM, BY THE ROAD'},
  'ELES, NA PISTA':        {es:'ELLOS, EN LA RUTA',        en:'THEM, ON THE ROAD'},
  'NÓS, NAS BOMBAS':       {es:'NOSOTROS, EN LOS SURTIDORES', en:'US, AT THE PUMPS'},
  'NÓS, NO ÔNIBUS':        {es:'NOSOTROS, EN EL MICRO',    en:'US, ON THE BUS'},
  'NÓS, ATRÁS':            {es:'NOSOTROS, ATRÁS',          en:'US, BEHIND'}
});
