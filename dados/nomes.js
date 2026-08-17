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
  arquetipos:[
    {id:'agressivo',   nome:'Agressivo',   desc:'Engaja mais cedo, foge mais tarde, perde moral devagar'},
    {id:'diplomatico', nome:'Diplomático', desc:'Bônus em aliança, ruim em combate'},
    {id:'oportunista', nome:'Oportunista', desc:'Ganha mais XP, pode abandonar se a moral cair'},
    {id:'fanatico',    nome:'Fanático',    desc:'Nunca foge, moral alta constante, gasta muito'},
    {id:'cauteloso',   nome:'Cauteloso',   desc:'Sobrevive mais, recua cedo'}
  ]
};
