/* =========================================================
   BANCO DE NOMES — GDD §5.5
   Diretoria usa apelido + sobrenome ("Cabeça Silva").
   Os outros cargos usam só o apelido.
   ========================================================= */
TO.dados.nomes = {

  apelidos:[
    'Trovão','Cabeça','Pitbull','Dentinho','Gordo','Neguinho','Pará','Cabeludo','Índio',
    'Ratinho','Fumaça','Bala','Coruja','Teco','Magal','Ligeiro','Boca','Tigrão','Calango',
    'Pedrão','Mangueira','Negão','Foguete','Capeta','Leão','Magrão','Pinga','Churras',
    'Bomba','Jacaré','Dente','Pantera','Cipó','Sorriso','Dunga','Topete','Garoto','Formiga',
    'Lampião','Espeto','Morcego','Bode','Chicote','Pardal','Ceará','Nervo','Faísca','Serrote',
    'Tijolo','Vela','Barriga','Careca','Zóio','Perna','Bigode','Cavalo','Touro','Urubu',
    'Corujão','Pipoca','Farofa','Feijão','Café','Açúcar','Melado','Doido','Sereno','Trovoada',
    'Relâmpago','Fogo','Brasa','Cinza','Carvão','Ferro','Aço','Martelo','Prego','Alicate',
    'Chave','Porca','Parafuso','Mola','Corrente','Cadeado','Trinco','Portão','Muro','Grade',
    'Telha','Viga','Cimento','Areia','Brita','Massa','Reboco','Pincel','Rolo','Escada','Balde'
  ],

  simples:[
    'Pedro','Lucas','João','Bruno','Rafael','Thiago','Diego','Felipe','Gabriel','Matheus',
    'Rodrigo','Marcelo','Anderson','Fernando','Ricardo','Eduardo','Leandro','Vinícius',
    'Wesley','Douglas','Alan','Igor','Caio','Murilo','Renan','Everton','Jonas','Elias',
    'Cauã','Kaique','Wallace','Robson','Cleiton','Adriano','Márcio','Sérgio','Paulo','Carlos'
  ],

  compostos:[
    'João Paulo','Luís Felipe','Carlos Eduardo','José Carlos','Pedro Henrique','Marcos Vinícius',
    'Ana Paula','Luiz Gustavo','Antônio Marcos','Paulo Sérgio','João Vitor','Luís Otávio',
    'José Roberto','Carlos Alberto','Marco Antônio','João Pedro','Luiz Henrique','Jean Carlos'
  ],

  sobrenomes:[
    'Silva','Santos','Oliveira','Souza','Rodrigues','Ferreira','Alves','Pereira','Lima',
    'Gomes','Costa','Ribeiro','Martins','Carvalho','Almeida','Lopes','Soares','Fernandes',
    'Vieira','Barbosa','Rocha','Dias','Nascimento','Andrade','Moreira','Nunes','Marques',
    'Machado','Mendes','Freitas','Cardoso','Ramos','Gonçalves','Santana','Teixeira','Araújo',
    'Correia','Cavalcanti','Batista','Monteiro','Moura','Cunha','Pinto','Reis','Campos'
  ],

  /* GDD §5.6 — sem isso, Trovão e Pitbull são o mesmo membro com números diferentes */
  /* =========================================================
     OS NOVE PAÍSES DE FORA (pedido do dono, 23/08/2026)
     200 nomes, 200 sobrenomes e 150 apelidos hispano-americanos.
     Membro de barra sai daqui em vez do banco brasileiro: o
     apelido é o nome de rua — é ele que aparece na lista, na
     briga e no feed — e nome + sobrenome são a identidade da
     ficha.

     Os sobrenomes cobrem o continente, não um país só: Mamani,
     Quispe e Condori do altiplano; Cristaldo, Insfrán e
     Estigarribia do Paraguai; Cedeño, Loor e Mero da costa
     equatoriana; Huamán e Farfán do Peru; Riquelme e Sepúlveda
     do Chile; Ferreyra, Carrizo e Ledesma da Argentina.

     Os apelidos são os da arquibancada de lá, em cinco famílias
     de trinta: o corpo (Gordo, Flaco, Zurdo, Cabezón), o bicho
     (Puma, Cuervo, Yacaré, Ñandú), o fogo e o ferro (Trueno,
     Facón, Martillo), o ofício (Albañil, Cartonero, Zafrero) e
     a origem (Salteño, Camba, Colla, Chapaco).
     ========================================================= */
  hispano:{
    nomes:[
      'Adrián','Agustín','Alberto','Alejandro','Alexis','Alfredo','Álvaro','Amado',
      'Anderson','Andrés','Ángel','Aníbal','Antonio','Ariel','Armando','Arturo',
      'Aurelio','Baltazar','Benjamín','Bernardo','Braian','Bruno','Camilo','César',
      'Claudio','Cristian','Cristóbal','Damián','Daniel','Dante','Darío','David',
      'Diego','Domingo','Edgar','Edinson','Eduardo','Efraín','Elías','Emanuel',
      'Emiliano','Emilio','Enrique','Ernesto','Esteban','Ezequiel','Fabián','Fabio',
      'Facundo','Federico','Felipe','Fernando','Fidel','Flavio','Francisco','Franco',
      'Gabriel','Genaro','Gerardo','Germán','Gilberto','Gonzalo','Gregorio','Guillermo',
      'Gustavo','Héctor','Hernán','Horacio','Hugo','Humberto','Ignacio','Isidro',
      'Ismael','Iván','Jaime','Javier','Jesús','Joaquín','Jonathan','Jorge',
      'José','Josué','Juan','Julián','Julio','Lautaro','Leandro','Leonardo',
      'Lisandro','Lorenzo','Luciano','Luis','Manuel','Marcelo','Marcial','Marco',
      'Marcos','Mariano','Mario','Martín','Matías','Mauricio','Mauro','Maximiliano',
      'Miguel','Milton','Moisés','Nahuel','Nelson','Néstor','Nicolás','Norberto',
      'Octavio','Omar','Orlando','Óscar','Osvaldo','Pablo','Patricio','Paulo',
      'Pedro','Rafael','Ramiro','Ramón','Raúl','Reinaldo','Renato','René',
      'Ricardo','Rigoberto','Roberto','Rodolfo','Rodrigo','Rolando','Román','Rosendo',
      'Rubén','Salvador','Samuel','Santiago','Saúl','Sebastián','Sergio','Silvio',
      'Simón','Teodoro','Thiago','Tobías','Tomás','Ulises','Valentín','Vicente',
      'Víctor','Walter','Wilfredo','Wilson','Yerson','Zacarías','Abel','Adolfo',
      'Alfonso','Amílcar','Anselmo','Aparicio','Baldomero','Bautista','Belisario','Blas',
      'Bonifacio','Calixto','Cándido','Casimiro','Cayetano','Celestino','Ceferino','Cirilo',
      'Clemente','Constantino','Cornelio','Crisanto','Dagoberto','Delfín','Dionisio','Eleuterio',
      'Eliseo','Epifanio','Eusebio','Evaristo','Faustino','Felisberto','Fermín','Fortunato',
      'Fulgencio','Gervasio','Gumersindo','Hipólito','Ildefonso','Inocencio','Jacinto','Laureano'
    ],
    sobrenomes:[
      'González','Rodríguez','Gómez','Fernández','López','Díaz','Martínez','Pérez',
      'García','Sánchez','Romero','Sosa','Torres','Álvarez','Ruiz','Ramírez',
      'Flores','Acosta','Benítez','Medina','Suárez','Herrera','Aguirre','Pereyra',
      'Gutiérrez','Giménez','Molina','Silva','Castro','Rojas','Ortiz','Núñez',
      'Luna','Juárez','Cabrera','Ríos','Morales','Godoy','Moreno','Ferreyra',
      'Vega','Carrizo','Peralta','Villalba','Cardozo','Quiroga','Vera','Maldonado',
      'Ledesma','Bravo','Reyes','Contreras','Espinoza','Valenzuela','Muñoz','Araya',
      'Fuentes','Sepúlveda','Cortés','Tapia','Riquelme','Cáceres','Miranda','Vargas',
      'Salazar','Guzmán','Mendoza','Paredes','Chávez','Ramos','Castillo','Delgado',
      'Navarro','Campos','Escobar','Ojeda','Zambrano','Andrade','Cedeño','Mero',
      'Loor','Solís','Bustamante','Arroyo','Mamani','Quispe','Condori','Choque',
      'Apaza','Huanca','Cuéllar','Justiniano','Roca','Antelo','Vaca','Salvatierra',
      'Ortuño','Terceros','Zeballos','Villarroel','Camacho','Gil','Guerrero','Nieto',
      'Prado','Rivas','Sandoval','Ávila','Barrios','Bermúdez','Blanco','Bonilla',
      'Caballero','Calderón','Cañete','Carrillo','Céspedes','Cisneros','Colmán','Coronel',
      'Correa','Cristaldo','Duarte','Enciso','Espínola','Estigarribia','Franco','Galeano',
      'Gaona','Insfrán','Irala','Lezcano','Ortellado','Ovelar','Paiva','Recalde',
      'Riveros','Rolón','Samudio','Servín','Talavera','Vázquez','Velázquez','Verón',
      'Zárate','Aquino','Arce','Barreto','Britez','Bogado','Chamorro','Fretes',
      'Ibarra','Leguizamón','Meza','Ocampos','Ovando','Portillo','Segovia','Sanabria',
      'Villagra','Alarcón','Arévalo','Barreiro','Bustos','Carranza','Cornejo','Farfán',
      'Gallardo','Guevara','Huamán','Lozano','Manrique','Meléndez','Montoya','Palacios',
      'Pizarro','Requena','Rivera','Salas','Tello','Ubillús','Urrutia','Zapata',
      'Zúñiga','Alcántara','Aliaga','Bazán','Cárdenas','Carbajal','Cueva','Gamarra',
      'Hurtado','Leiva','Mendieta','Olivares','Pacheco','Quintana','Saavedra','Valdez'
    ],
    apelidos:[
      'La Pulga','Chino','Diablo','Tucu','Pibe','Negro',
      'Gordo','Flaco','Zurdo','Loco','Tano','Ruso',
      'Turco','Colo','Cabezón','Pelado','Petiso','Chiqui',
      'Muñeco','Cachete','Orejas','Narigón','Bigote','Rulo',
      'Crespo','Pecoso','Tuerto','Rengo','Manco','Sordo',
      'Pato','Mono','Puma','Tigre','Gato','Perro',
      'Chancho','Conejo','Toro','Burro','Pájaro','Cuervo',
      'Pollo','Loro','Zorro','Lobo','Oso','Chivo',
      'Mula','Grillo','Pulpo','Tiburón','Caimán','Yacaré',
      'Ñandú','Cóndor','Halcón','Buitre','Carancho','Lagarto',
      'Trueno','Rayo','Chispa','Fuego','Brasa','Humo',
      'Ceniza','Pólvora','Bomba','Bala','Fierro','Facón',
      'Machete','Garrote','Palo','Ladrillo','Piedra','Roca',
      'Alambre','Clavo','Tornillo','Martillo','Yunque','Hacha',
      'Serrucho','Taladro','Cadena','Candado','Tuerca','Soga',
      'Albañil','Carpintero','Herrero','Panadero','Carnicero','Verdulero',
      'Lechero','Basurero','Cartonero','Camionero','Colectivero','Tachero',
      'Pescador','Minero','Zafrero','Cañero','Soldador','Remisero',
      'Feriante','Bagayero','Ronco','Dientes','Muela','Cejas',
      'Melena','Motoso','Panza','Barriga','Chueco','Corcho',
      'Salteño','Correntino','Chaqueño','Riojano','Puntano','Cuyano',
      'Norteño','Sureño','Costeño','Serrano','Llanero','Paisa',
      'Rolo','Camba','Colla','Chapaco','Cruceño','Paceño',
      'Potosino','Orureño','Guaraní','Charrúa','Mapuche','Inca',
      'Cholo','Indio','Gallego','Italiano','Polaco','Guacho'
    ]
  },

  arquetipos:[
    {id:'agressivo',   nome:'Agressivo',   desc:'Engaja mais cedo, foge mais tarde, perde moral devagar'},
    {id:'diplomatico', nome:'Diplomático', desc:'Bônus em aliança, ruim em combate'},
    {id:'oportunista', nome:'Oportunista', desc:'Ganha mais XP, pode abandonar se a moral cair'},
    {id:'fanatico',    nome:'Fanático',    desc:'Nunca foge, moral alta constante, gasta muito'},
    {id:'cauteloso',   nome:'Cauteloso',   desc:'Sobrevive mais, recua cedo'}
  ]
};
