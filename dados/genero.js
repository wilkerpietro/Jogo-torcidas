/* GÊNERO DOS NOMES PRÓPRIOS — competição, estádio e fase.
   Pedido do dono (21/09/2026): tirar o artigo do chute.

   O jogo escrevia "do Mineiro" e "da Copa do Nordeste" por regex em
   quatro arquivos, cada um com a sua — `/^(Copa|Taça|Série)/i` em
   gazeta.js e feed.js, a mesma mais `Copinha` em almanaque.js, e só
   `/^Copa/i` num quinto lugar do feed. Nome que não começa com essas
   palavras caía no masculino calado, e o país inteiro saía errado:
   "do Argentina Primera", "do Peru Liga 1", "na Playoff".

   A lista de nomes é FECHADA — vem de dados/times.js (regional e
   divisao), de dados/estadios.js e das fases do mata-mata. Então isto
   aqui é consulta exata, não adivinhação. Nome fora da tabela ainda
   cai no palpite de TO.genero (nucleo.js), que avisa no console em
   modo de desenvolvimento; ferramentas/qualidade/genero.py propõe a
   linha nova quando alguém acrescenta um nome.

   TORCIDA NÃO ENTRA AQUI: são todas femininas por regra do jogo (o
   substantivo implícito é "a torcida"), e clube também não — o jogo
   nunca põe artigo antes de nome de clube. */
TO.dados.genero = {

  /* ---------- competições ---------- */
  competicao: {
    f: ['Copa do Brasil', 'Copa do Nordeste', 'Copa Norte',
        'Copa Centro-Oeste', 'Copa Libertadores', 'Copa Sul-Americana',
        'Copa Argentina', 'Copa da División', 'Libertadores',
        'Sul-Americana', 'Copinha',
        /* liga de fora: Primera, Serie e Liga são todas femininas */
        'Argentina Primera', 'Argentina Primera B',
        'Argentina Primera Nacional', 'Bolívia Primera',
        'Chile Primera', 'Chile Primera B', 'Colômbia Primera A',
        'Colômbia Primera B', 'Equador Serie A', 'Paraguai Primera',
        'Peru Liga 1', 'Uruguai Primera', 'Venezuela Primera'],
    m: ['Brasileirão Série A', 'Brasileirão Série B',
        'Brasileirão Série C', 'Brasileirão Série D',
        'Cariocão', 'Catarinense', 'Gauchão', 'Mineiro',
        'Paranaense', 'Paulistão', 'Paulistão A2',
        'Nordestão Série B']
  },

  /* ---------- estádios ----------
     São 343, e não os 76 de dados/estadios.js: o nome que o texto usa
     é o campo `estadio` de dados/times.js, que inclui o continente
     inteiro. O palpite antigo (`/^(Arena|Vila|Ilha)\b/`) mandava tudo
     que não fosse arena pro masculino — "no Joia da Princesa", "no La
     Bombonera", "no La Nueva Olla".
     A régua do feminino: o nome carrega substantivo feminino na
     cabeça (Arena, Vila, Villa, Ilha, La…) ou é um apelido feminino
     (Ressacada, Colina, Serrinha, Moça Bonita). "Estadio X",
     "Monumental X", "Metropolitano X" e "Municipal X" ficam no
     masculino porque a cabeça ali é o próprio estádio. */
  estadio: {
    f: ["Arena Castelão", "Arena Condá", "Arena da Amazônia",
        "Arena da Baixada", "Arena das Dunas", "Arena do Grêmio",
        "Arena do Gremio", "Arena Fonte Nova", "Arena Joinville",
        "Arena MRV", "Arena Pantanal", "Arena Romeirão", "Arena Sicredi",
        "Colina", "Ilha do Retiro", "Joia da Princesa", "La Bombonera",
        "La Carolina", "La Ciudadela", "La Fortaleza", "La Granja",
        "La Huerta", "La Independencia", "La Nueva Olla", "La Pintana",
        "La Portada", "Ligga Arena", "Moça Bonita", "Moca Bonita",
        "Neo Quimica Arena", "Neo Química Arena", "Nueva España",
        "Ressacada", "Serrinha", "Sierra Nevada", "Vila Belmiro",
        "Vila Capanema", "Villa Elisa"],
    m: ["15 de Abril", "23 de Agosto", "9 de Mayo", "Abadião",
        "Abel Sastre", "Abraham Paladino", "Aflitos", "Albertão",
        "Alberto Gallardo", "Alberto Grisales", "Alberto Suppici",
        "Alejandro Serrano Aguilar", "Alejandro Villanueva",
        "Alfonso López", "Alfredo Beranger", "Alfredo de Castilho",
        "Alfredo Jaconi", "Alfredo Ramos", "Alfredo Terrera",
        "Alfredo Víctor Viera", "Allianz Parque", "Almeidão",
        "Álvaro Gómez Hurtado", "Ameliano", "Amigão",
        "Anacleto Campanella", "Antônio Accioly", "Antonio Accyoly",
        "Antonio Candini", "Antônio Ferreira de Medeiros",
        "Armando Maestre", "Arruda", "Arsenio Erico", "Arturo Miranda",
        "Ary de Oliveira e Souza", "Atanasio Girardot", "Baenão",
        "Banco Guayaquil", "Barão de Serra Negra", "Barradão", "Batistão",
        "Bautista Gargantini", "Beira-Rio", "Bellavista", "Belvedere",
        "Bento Freitas", "Bernardo Rubinger de Queiroz", "Bezerrão",
        "Bicentenario La Florida", "Boca do Lobo",
        "Brigadier General Estanislao López", "Brinco de Ouro",
        "Bruno José Daniel", "Calvo y Bascuñán", "Campeón del Siglo",
        "Campeones del 36", "Canindé", "CAP", "Carlos Barraza",
        "Carlos Dittborn", "Castelão", "Centenário",
        "Centenario Ciudad de Quilmes", "Chacarita Juniors",
        "Ciudad de Caseros", "Ciudad de Cumaná", "Ciudad de Ezeiza",
        "Ciudad de Vicente López", "Ciudad de Zárate", "Claudio Tapia",
        "Colosso da Lagoa", "Conselheiro Galvão", "Cornélio de Barros",
        "Couto Pereira", "Curuzu", "Departamental Libertad",
        "Deportivo Cali", "Diego Armando Maradona", "Doctor Luis Güemes",
        "Doctor Osvaldo Baletto", "Doctor Ramón Aguirre",
        "Don León Kolbowski", "Doutor Hercílio Luz", "Dutrinha",
        "Echaleche", "Eduardo Gallardón", "El Campín", "El Cilindro",
        "El Cobre", "El Teniente", "Elías Figueroa Brander", "Engenhão",
        "Estadio Acassuso", "Estadio Anacleto Campanella",
        "Estadio Argentino de Merlo", "Estadio Argentino de Quilmes",
        "Estadio Bruno Daniel", "Estadio Cañuelas", "Estadio Centenario",
        "Estadio Colegiales", "Estádio da Colina", "Estadio da Ressacada",
        "Estadio de los Inmigrantes", "Estadio Deportivo Armenio",
        "Estádio do Café", "Estádio do Souza", "Estádio do Trabalhador",
        "Estadio dos Aflitos", "Estadio Excursionistas",
        "Estadio Ituzaingó", "Estadio JJ Urquiza", "Estadio Laferrere",
        "Estadio Midland", "Estadio Primeiro de Maio", "Estadio Regional",
        "Estadio Sacachispas", "Estadio UAI Urquiza",
        "Estadio Villa Dálmine", "Ester Roa Rebolledo",
        "Etelvino Mendonça", "Etelvino Mendonca", "Eva Perón",
        "Feliciano Cáceres", "Feliciano Gambarte", "Felipe Santiago",
        "Félix Capriles", "Fiscal de Talca", "Florencio Sola",
        "Fragata Presidente Sarmiento", "Francisco Rivera Escobar",
        "Francisco Sánchez Rumoroso", "Frasqueirão", "Frei Epifânio",
        "Fumeirão", "Genacio Sálice", "General Santander",
        "George Capwell", "Germán Becker", "Germano Kruger",
        "Germano Krüger", "Gigante de Arroyito", "Gilberto Parada",
        "Gildo Francisco Ghersinich", "Giulite Coutinho",
        "Gonzalo Pozo Ripalda", "Gran Parque Central", "Guillermo Laza",
        "Guillermo Plazas Alcid", "Heraclio Tapia", "Heriberto Hulse",
        "Heriberto Hülse", "Hernán Ramírez Villegas", "Hernando Siles",
        "Héroes de San Ramón", "Huancayo", "Inca Garcilaso de la Vega",
        "Independencia", "Independência", "Ingeniero Hilario Sánchez",
        "Islas Malvinas", "IV Centenario", "Jaime Morón León", "Jaraguay",
        "Jardines del Hipódromo", "Jayme Cintra", "Jesús Bermúdez",
        "João Hora", "Joaquín Muñoz García", "Jocay", "Jonas Duarte",
        "Jorge Ismael de Biasi", "Jorge Luis Hirschi", "José Amalfitani",
        "José Antonio Anzoátegui", "José Antonio Páez",
        "José Dellagiovanna", "José Manuel Moreno", "José María Minella",
        "Juan Alberto García", "Juan Carmelo Zerillo",
        "Juan Domingo Perón", "Juan Maldonado Gamarra", "Juan Pasquale",
        "Julio César Villagra", "Julio Humberto Grondona", "Junco",
        "Ka'arendy", "Lacerdão", "Libertadores de América", "Limeirão",
        "Lorenzo Arandilla", "Los Chankas", "Los Zipas", "Lucio Fariña",
        "Lucio Fariña Fernández", "Luis Franzini", "Luis Tróccoli",
        "Luis Valenzuela Hermosilla", "Luthero Lopes", "Maião",
        "Malvinas Argentinas", "Mangueirao", "Manuel Calle Lombana",
        "Manuel Ferreira", "Manuel Murillo Toro", "Maracanã",
        "Marcelo Bielsa", "Mario Alberto Kempes", "Marizão",
        "Martín Torres", "Metropolitano Ciudad de Itagüí",
        "Metropolitano de Mérida", "Metropolitano de Techo",
        "Metropolitano Roberto Meléndez", "Miguel Grau",
        "Miguel Grau del Callao", "Miguel Sancho", "Mineirao", "Mineirão",
        "Misael Delgado", "Moisés Lucarelli", "Monumental",
        "Monumental Banco Pichincha", "Monumental David Arellano",
        "Monumental de la UNSA", "Monumental de Maturín",
        "Monumental José Fierro", "Monumental U", "Morenão", "Morumbi",
        "Municipal de Chongoyape", "Municipal de El Alto",
        "Municipal de Entre Ríos", "Municipal de Lo Barnechea",
        "Municipal de Recoleta", "Municipal de San Bernardo",
        "Municipal La Cisterna", "Nabi Abi Chedid",
        "Nacional Julio Martínez", "Nelson Oyarzún", "Nhozinho Santos",
        "Nicolás Chahuán", "Nilton Santos", "Nogueirão",
        "Norberto Tomaghello", "Novelli Júnior", "Nuevo Francisco Urbano",
        "Nuevo Gasómetro", "Nuevo Monumental", "OBA", "Ofelia Rosenzuaig",
        "Olímpico Atahualpa", "Olímpico de la UCV",
        "Omar Higinio Sperdutti", "Orlando Scarpelli", "Osvaldo Roberto",
        "Pablo Comelli", "Pachencho Romero", "Palogrande",
        "Parque Artigas", "Parque Federico Saroldi", "Parque Méndez Piana",
        "Parque Viera", "Pascual Guerrero", "Passo d'Areia", "Patria",
        "Polideportivo Sur", "Presbítero Bartolomé Grella",
        "Presidente Vargas", "Primeiro de Maio", "Pueblo Nuevo",
        "Rafael Calles Pinto", "Rafael Mendoza", "Ramón Tahuichi Aguilera",
        "Raulino de Oliveira", "Rei Pelé", "Reina del Cisne",
        "República de Mataderos", "Ricardo Etcheverri",
        "Ricardo Tulio Maya", "Río Parapití", "Rodrigo Paz Delgado",
        "Rogelio Livieres", "Romelio Martínez", "San Carlos de Apoquindo",
        "Santa Cruz", "Santa Laura", "Sao Januário", "São Januário",
        "Sausalito", "Serejão", "Serra Dourada", "Souza",
        "Tierra de Campeones", "Tomás Adolfo Ducó", "Tres de Febrero",
        "Ubilla", "Ulrico Mursa", "Unión Tarma", "Víctor Agustín Ugarte",
        "Víctor Legrotaglie", "Willie Davids", "Zama Maciel",
        "Zinho de Oliveira", "Zorros del Desierto"]
  },

  /* ---------- cidades e praças ----------
     Aqui há um quarto valor: `s`, de SEM ARTIGO. "em Salvador" não
     leva artigo nenhum, mas "no Rio de Janeiro" e "na Bahia" levam —
     e quase metade desta lista é região ("Interior de SP", "Norte do
     Chile"), que sempre leva. Não há regra de forma que separe as
     três: é nome por nome. */
  cidade: {
    s: ['Alagoas', 'Ambato', 'Assunção', 'Avellaneda', 'Belem',
        'Belo Horizonte', 'Bogotá', 'Brasilia', 'Buenos Aires', 'Cali',
        'Caracas', 'Cochabamba', 'Concepción', 'Curitiba', 'Cusco',
        'Cuyo e Patagônia', 'Córdoba', 'Fortaleza', 'Goiania',
        'Guayaquil', 'La Matanza', 'La Paz', 'La Plata',
        'Lanús e Lomas', 'Lima', 'Manaus', 'Medellín', 'Mendoza',
        'Montevidéu', 'Morón e Merlo', 'Oruro e Potosí',
        'Porto Alegre', 'Quilmes e Berazategui', 'Quito', 'Rosário',
        'San Martín e Tres de Febrero', 'Santa Cruz', 'Santiago',
        'Santiago Sul', 'Santiago del Estero', 'Santos', 'Sao Paulo',
        'Sergipe', 'Tucumã', 'Valparaíso', 'Varela e Ezeiza'],
    f: ['Bahia', 'Costa Colombiana', 'Costa Equatoriana',
        'Grande Assunção', 'Paraiba', 'Região de Campinas',
        'Zona Norte'],
    m: ['ABC Paulista', 'Centro da Venezuela', 'Centro do Chile',
        'Eixo Cafeteiro', 'Interior da Bolívia', 'Interior da Colômbia',
        'Interior de Buenos Aires', 'Interior de Minas',
        'Interior de PE', 'Interior de SC', 'Interior de SP',
        'Interior do CE', 'Interior do PR', 'Interior do Paraguai',
        'Interior do RS', 'Interior do Uruguai', 'Leste de Montevidéu',
        'Litoral Argentino', 'Litoral Catarinense', 'Maranhão',
        'Mato Grosso', 'Norte Chico', 'Norte da Argentina',
        'Norte da Colômbia', 'Norte de CABA', 'Norte do Chile',
        'Norte do Peru', 'Oeste da Venezuela', 'Oeste de CABA',
        'Oeste de Montevidéu', 'Oriente da Venezuela', 'Recife',
        'Rio Grande do Norte', 'Rio de Janeiro', 'Suburbio Carioca',
        'Sul da Colômbia', 'Sul de Bogotá', 'Sul de CABA',
        'Sul do Chile', 'Sul do Equador', 'Sul do Peru']
  },

  /* ---------- fases ----------
     Quase todas femininas, duas no plural. O palpite antigo mandava
     tudo que termina em s pro plural feminino e o resto pro singular
     feminino — e "Playoff" saía "na playoff". */
  fase: {
    f:  ['Final', 'Semifinal', 'Primeira fase', 'Segunda fase',
         'Terceira fase', 'Fase Preliminar', 'Prévia',
         /* a Conmebol numera: "Fecha 1" … "Fecha 13". A consulta tira
            o número do fim, então basta a palavra aqui. */
         'Fecha',
         /* as da LNT, que tem chave propria */
         'Fase de chaves'],
    fp: ['Oitavas', 'Quartas'],
    m:  ['Playoff', 'Playoff do acesso', '16-avos']
  }
};
