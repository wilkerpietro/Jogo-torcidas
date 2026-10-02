const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DATE = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" });

const STORAGE_KEY = "torcida-codex-prototype-v2";
const LEGACY_KEYS = ["torcida-codex-prototype-v1"];

const difficulties = {
  facil: { nome: "Fácil", receita: 1.3, custo: 0.8, dano: 0.8, ataques: 0.7 },
  normal: { nome: "Normal", receita: 1, custo: 1, dano: 1, ataques: 1 },
  dificil: { nome: "Difícil", receita: 0.8, custo: 1.2, dano: 1.2, ataques: 1.3 }
};

// Build teams from DATA — ONE ENTRY PER TORCIDA.
// 140 torcidas in Data/Torcidas → 140 selectable entries (vs 108 by time).
const teams = (() => {
  const resolveNames = ids => (ids || [])
    .map(id => DATA.torcidaById[id]?.nome)
    .filter(Boolean);

  return (DATA.torcidas || []).map(torcida => {
    const time = DATA.timeById[torcida.clubeId] || null;
    const cidade = time ? DATA.cidadeById[time.cidadeId] : null;

    // torcidaShare = % of city population that follows this team
    let share = 0.05;
    if (cidade && time) {
      const tc = (cidade.torcidasCidade || []).find(x => x.teamId === time.id);
      if (tc) share = (tc.pct || 10) / 100;
    }

    const aliadosNomes = resolveNames(torcida.aliados);
    const irmandadeNomes = resolveNames(torcida.irmandade);
    const rivaisNomes = resolveNames(torcida.rivais);
    const maioresRivaisNomes = resolveNames(torcida.maioresRivais);

    const rivalNome = maioresRivaisNomes[0] || rivaisNomes[0] || "";
    const aliados = aliadosNomes.slice();

    return {
      id: torcida.id,                                     // ← unique per torcida
      torcidaId: torcida.id,
      timeId: time?.id || "",                             // ← clube grouping
      nome: time?.nome || "(Sem time vinculado)",
      torcida: torcida.nome,
      sigla: time?.sigla || torcida.nome.slice(0, 3).toUpperCase(),
      cor: (torcida.corCamisa && torcida.corCamisa !== "#ffffff")
        ? torcida.corCamisa
        : (time?.corPrimaria || "#a51f1c"),
      corCamisa: torcida.corCamisa || time?.corPrimaria || "#a51f1c",
      corCalcao: torcida.corCalcao || time?.corSecundaria || "#000000",
      corDetalhe: torcida.corDetalhe || "#000000",
      estado: cidade?.estado || "",
      membros: torcida.quantidadeNPCs || 50,
      cidade: cidade?.nome || "",
      torcidaShare: share,
      pop: ((cidade?.populacao) || 100) * 1000,
      rival: rivalNome,
      aliados,
      aliadosIds: torcida.aliados || [],
      irmandadeIds: torcida.irmandade || [],
      rivaisIds: torcida.rivais || [],
      maioresRivaisIds: torcida.maioresRivais || [],
      aliadosNomes,
      irmandadeNomes,
      rivaisNomes,
      maioresRivaisNomes,
      cidadeId: time?.cidadeId || "",
      estadioId: time?.estadioId || "",
      divisao: time?.divisao || 4,
      divisaoInicial: time?.divisao || 4,
      qualidade: time?.qualidade || 25,
      titulos: time?.titulos || 0,
      anoFundacao: time?.anoFundacao || 0,
      dataFundacao: torcida.dataFundacao || ""
    };
  });
})();

const roads = [
  { nome: "Norte", points: ["Manaus", "Belém"] },
  { nome: "Nordeste 1", points: ["Meio Norte", "Interior do CE", "Fortaleza", "Rio Grande do Norte", "Paraíba"] },
  { nome: "Nordeste 2", points: ["Recife", "Alagoas", "Sergipe", "Salvador"] },
  { nome: "Sudeste 1", points: ["Belo Horizonte", "Interior de MG", "Campinas", "Interior de SP"] },
  { nome: "Sudeste 2", points: ["Rio de Janeiro", "Subúrbio Carioca", "São Paulo", "ABC Paulista", "Santos"] },
  { nome: "Sul 1", points: ["Interior do PR", "Curitiba", "Interior de SC"] },
  { nome: "Sul 2", points: ["Florianópolis", "Porto Alegre", "Interior do RS"] },
  { nome: "Centro-Oeste", points: ["Goiânia", "Brasília", "Cuiabá"] }
];

const roadConnections = [
  ["Belém", "Meio Norte"], ["Manaus", "Cuiabá"], ["Paraíba", "Recife"], ["Meio Norte", "Brasília"],
  ["Salvador", "Belo Horizonte"], ["Interior de SP", "São Paulo"], ["Campinas", "ABC Paulista"],
  ["Belo Horizonte", "Goiânia"], ["São Paulo", "Curitiba"], ["Santos", "Interior do PR"], ["Interior de SC", "Florianópolis"]
];

// Banco de Nomes — 500 nomes (400 nomes comuns + 100 apelidos)
// 220 nomes simples (recebem sobrenome real)
const _NOMES_SIMPLES = [
  "Marcelo","Thiago","Lucas","Rafael","Bruno","Felipe","Diego","Matheus","Carlos","Antonio",
  "Roberto","Paulo","Pedro","Ricardo","Fernando","Henrique","Eduardo","Gabriel","Vinicius","Leandro",
  "André","João","Daniel","Caio","Igor","Anderson","Adriano","Alex","Alexandre","Davi",
  "Emerson","Fábio","Gustavo","Hugo","Jonas","Júlio","Leonardo","Marcos","Maurício","Murilo",
  "Nelson","Otávio","Patrick","Renato","Rodrigo","Samuel","Sérgio","Vitor","Wagner","Wallace",
  "Yago","Yuri","Walter","Washington","Wilson","Willian","Vagner","Tiago","Tadeu","Sidney",
  "Silvio","Sandro","Saulo","Sebastião","Romário","Ronaldo","Reinaldo","Raul","Otto","Nilton",
  "Mário","Márcio","Maicon","Lúcio","Luan","Luciano","Luiz","Kléber","Kaique","Jonathan",
  "Joaquim","Jorge","José","Jairo","Jadson","Heitor","Geraldo","Gilberto","Guilherme","Francisco",
  "Flávio","Erick","Diogo","Cristiano","César","Cláudio","Bernardo","Augusto","Arthur","Adílson",
  "Adriel","Afonso","Agnaldo","Aílton","Alberto","Aldo","Alessandro","Alfredo","Aluísio","Amaro",
  "Amauri","Aparecido","Arlindo","Arnaldo","Aroldo","Aurélio","Cássio","Cauê","Celso","Cícero",
  "Cosme","Damião","Dário","Deivid","Domingos","Donato","Edinaldo","Edmilson","Edmundo","Edson",
  "Elias","Élton","Erivaldo","Ernani","Ernesto","Estêvão","Evaldo","Evandro","Ewerton","Fabiano",
  "Fabrício","Fagner","Filipe","Fred","Genival","Geovane","Gerson","Givanildo","Hamilton","Hélio",
  "Helton","Hércules","Hermes","Iago","Ícaro","Inácio","Itamar","Ítalo","Ivan","Jander",
  "Jefferson","Jerônimo","Joel","Josué","Juliano","Jurandir","Kayky","Kelvin","Laércio","Lauro",
  "Lincoln","Lourival","Manoel","Marcílio","Marivaldo","Mateus","Messias","Michael","Milton","Moacir",
  "Naldo","Natanael","Nathan","Nazareno","Nicolau","Noé","Norberto","Olavo","Olívio","Orlando",
  "Oscar","Osmar","Osvaldo","Pablo","Patrício","Plínio","Ramon","Reginaldo","Renan","Robson",
  "Rogério","Rômulo","Ruan","Rui","Salomão","Severino","Tales","Téo","Tobias","Tomás",
  "Ubiratan","Ulisses","Uriel","Valdir","Valdomiro","Vicente","Welington","Wesley","Yan","Zacarias"
];

// 200 sobrenomes brasileiros comuns (sem ponto)
const _SOBRENOMES = [
  "Silva","Santos","Oliveira","Souza","Lima","Pereira","Ferreira","Costa","Rodrigues","Almeida",
  "Nascimento","Carvalho","Araújo","Ribeiro","Alves","Gomes","Martins","Lopes","Soares","Fernandes",
  "Vieira","Barbosa","Rocha","Dias","Monteiro","Cardoso","Mendes","Reis","Moreira","Cunha",
  "Pinto","Ramos","Moura","Cavalcanti","Castro","Andrade","Correia","Teixeira","Nunes","Marques",
  "Freitas","Machado","Campos","Borges","Brito","Sales","Mota","Melo","Magalhães","Bezerra",
  "Tavares","Pires","Pinheiro","Bastos","Sampaio","Coelho","Câmara","Saraiva","Antunes","Macedo",
  "Diniz","Lacerda","Leal","Aguiar","Galvão","Garcia","Guerra","Faria","Maciel","Maia",
  "Cavalcante","Couto","Duarte","Falcão","Fortes","Goulart","Guimarães","Jardim","Leitão","Leite",
  "Lobo","Lourenço","Marinho","Mascarenhas","Medeiros","Menezes","Miranda","Moraes","Mourão","Neves",
  "Nogueira","Pacheco","Padilha","Paiva","Pedrosa","Peixoto","Pessoa","Pimentel","Pontes","Prado",
  "Queiroz","Rabelo","Rego","Resende","Rios","Rolim","Roque","Sabino","Sacramento","Salgado",
  "Santiago","Schmidt","Serra","Silveira","Simões","Trindade","Vargas","Veloso","Viana","Vidal",
  "Wanderley","Xavier","Abreu","Amorim","Aragão","Assis","Azevedo","Baptista","Barreto","Batista",
  "Beltrão","Bittencourt","Bonfim","Brandão","Caetano","Cardim","Carmo","Carneiro","Cerqueira","Chagas",
  "Chaves","Conceição","Cordeiro","Damasceno","Drumond","Esteves","Fagundes","Fonseca","Fragoso","Freire",
  "França","Furtado","Gama","Gaspar","Godoy","Gondim","Gonzaga","Gusmão","Henriques","Honorato",
  "Honório","Jaques","Junqueira","Justino","Lara","Lessa","Lustosa","Macário","Madureira","Mafra",
  "Marçal","Mariano","Mattos","Modesto","Murta","Olímpio","Onofre","Otoni","Pádua","Paranhos",
  "Paulino","Penna","Peçanha","Portela","Quaresma","Querido","Quintana","Sant'Ana","Santarém","Sátiro",
  "Sequeira","Serafim","Setúbal","Soledade","Tibúrcio","Toledo","Vasconcellos","Vasques","Werneck","Zanoni"
];

// 80 nomes compostos brasileiros realistas (sem sobrenome)
const _NOMES_COMPOSTOS = [
  "João Paulo","João Pedro","João Vitor","João Gabriel","João Marcos","João Lucas","João Henrique",
  "João Miguel","João Carlos","João Felipe","João Eduardo","João Vinícius","João Antônio",
  "João Guilherme","João Matheus",
  "Luís Felipe","Luís Henrique","Luís Otávio","Luís Eduardo","Luís Fernando","Luís Carlos",
  "Luís Gustavo","Luís Antônio","Luís Miguel","Luís Paulo",
  "Pedro Henrique","Pedro Lucas","Pedro Paulo","Pedro Miguel","Pedro Augusto","Pedro Vitor",
  "Carlos Eduardo","Carlos Henrique","Carlos Alberto","Carlos Augusto",
  "Marco Aurélio","Marco Antônio","Marcos Paulo","Marcos Vinícius","Marcos Antônio",
  "José Carlos","José Roberto","José Antônio","José Maria","José Paulo","José Eduardo",
  "José Henrique","José Augusto",
  "Antônio Carlos","Antônio Marcos","Antônio Paulo",
  "Paulo Henrique","Paulo Roberto","Paulo Sérgio","Paulo Vitor","Paulo César","Paulo Eduardo",
  "Paulo Ricardo",
  "Francisco Carlos","Francisco Eduardo",
  "Roberto Carlos",
  "Daniel Felipe","Felipe Augusto",
  "Lucas Gabriel","Lucas Henrique","Lucas Daniel","Lucas Vinícius",
  "Gabriel Henrique","Vinícius Júnior","Vinícius Henrique",
  "Henrique Augusto","Mateus Henrique","Eduardo Henrique","Bruno Henrique","Diego Felipe",
  "Anderson Luís","Renato Augusto","Ricardo Augusto","Cláudio Roberto","Sérgio Roberto"
];

// 200 apelidos da cultura de torcida brasileira (sem sobrenome)
const _APELIDOS = [
  "Trovão","Cabeça","Pitbull","Dentinho","Gordo","Neguim","Neguinho","Pará","Cabeludo","Índio",
  "Ratinho","Fumaça","Bala","Coruja","Teco","Magal","Ligeiro","Boca","Tigrão","Calango",
  "Pedrão","Mangueira","Negão","Foguete","Capeta","Leão","Magrão","Pinga","Churras","Bomba",
  "Bicheiro","Véio","Alemão","Paulista","Cria","Pixote","Presunto","Jacaré","Dente","Pantera",
  "Cipó","Lazão","Sorriso","Dunga","Topete","Mãozinha","Garoto","Formiga","Cotoco","Lampião",
  "Espeto","Gringo","Morcego","Bode","Chicote","Pardal","Ceará","Macaco","Tanque","Pirata",
  "Coiote","Preto","Baiano","Farinha","Prego","Parafuso","Latinha","Tatu","Bigode","Carrasco",
  "Ventania","Miúdo","Navalha","Choque","Relâmpago","Pesadelo","Gigante","Surdo","Facão","Marreta",
  "Garrafa","Foguinho","Peçanha","Doidão","Cabrito","Touro","Ferrugem","Pivete","Charuto","Sabiá",
  "Furacão","Cracha","Moicano","Pedrada","Faísca","Quebrada","Vigia","Doido","Sombra","Cutelo",
  "Junim","Pelé","Cebola","Pingo","Maluco","Ratão","Estopim","Caveira","Maracanã","Bambolê",
  "Pijama","Lobinho","Curitiba","Pantanal","Goleiro","Volante","Atacante","Brabo","Fominha","Bocão",
  "Catraca","Buraco","Beleza","Comprido","Anão","Tampinha","Caboré","Bolacha","Azulão","Vermelhão",
  "Minhoca","Pomba","Bafo","Suado","Caxangá","Pimentão","Tubarão","Boi","Vampiro","Demônio",
  "Meteoro","Bombeiro","Soldado","Caminhão","Trator","Locomotiva","Bigorna","Pugilista","Gladiador","Espartano",
  "Rambo","Tarzan","Caxixi","Esquadrão","Falcão","Águia","Gavião","Urubu","Coxão","Talharim",
  "Marmita","Bagulho","Forró","Funkeiro","Sambista","Pagodeiro","Comilão","Faminto","Feijão","Arroz",
  "Salgadinho","Bolinha","Xerife","Capitão","Coronel","Major","Patriarca","Barão","Conde","Doutor",
  "Mestre","Velhote","Sertanejo","Cangaceiro","Bandeira","Mandinga","Capoeira","Berimbau","Atabaque","Guerreiro",
  "Pelotão","Brigada","Rajada","Esporão","Espinho","Pinico","Buchudo","Toco","Caxias","Cobra"
];

const BANCO_NOMES = (() => {
  const out = [];
  // 220 nomes simples + sobrenome (pareamento por offset primo p/ espalhar)
  for (let i = 0; i < _NOMES_SIMPLES.length; i++) {
    const sob = _SOBRENOMES[(i * 7 + 13) % _SOBRENOMES.length];
    out.push(`${_NOMES_SIMPLES[i]} ${sob}`);
  }
  // + 80 nomes compostos (sem sobrenome)
  out.push(..._NOMES_COMPOSTOS);
  // + 200 apelidos (sem sobrenome)
  out.push(..._APELIDOS);
  return out; // 500 total
})();
const names = BANCO_NOMES; // backward compat alias

// Bairro onde fica a sede da torcida (vindo do TorcidaData → bairroSede)
function getBairroSedeTorcida(teamOrId) {
  const team = (typeof teamOrId === "object" && teamOrId)
    ? teamOrId
    : teams.find(x => x.id === (teamOrId || state?.selectedTeam));
  if (!team) return "Centro";
  const torcida = DATA.torcidaById?.[team.torcidaId];
  return torcida?.bairroSede || "Centro";
}

// Zona ("Sul"/"Norte"/"Leste"/"Oeste") onde fica o bairro da sede
function getZonaSedeTorcida(teamOrId) {
  const team = (typeof teamOrId === "object" && teamOrId)
    ? teamOrId
    : teams.find(x => x.id === (teamOrId || state?.selectedTeam));
  if (!team) return null;
  const cidade = DATA.cidadeById?.[team.cidadeId];
  if (!cidade?.bairros?.length) return null;
  const nomeSede = getBairroSedeTorcida(team);
  const b = cidade.bairros.find(x => x.nome === nomeSede);
  return b?.zonaLabel || null;
}

// Escolhe um bairro da cidade do jogador em zona diferente da sede.
// `seed` distribui entre diferentes estabelecimentos (bar 0, loja 1, subsede 2…)
function pickBairroForaDaZonaSede(seed, teamOrId) {
  const team = (typeof teamOrId === "object" && teamOrId)
    ? teamOrId
    : teams.find(x => x.id === (teamOrId || state?.selectedTeam));
  if (!team) return null;
  const cidade = DATA.cidadeById?.[team.cidadeId];
  if (!cidade?.bairros?.length) return null;
  const zonaSede = getZonaSedeTorcida(team);
  const candidatos = cidade.bairros.filter(b => b.zonaLabel !== zonaSede);
  const lista = candidatos.length ? candidatos : cidade.bairros;
  return lista[Math.abs(seed) % lista.length];
}

// Formato display: "Bairro (Zona X)"
function formatBairroLabel(bairroObj) {
  if (!bairroObj) return "—";
  return `${bairroObj.nome} (Zona ${bairroObj.zonaLabel})`;
}

// Multiplicador de faturamento do bairro (Nobre 1.5× / Média 1.0× / Baixa 0.8× / Favela 0.4×)
// Recebe nome do bairro e retorna número. Se não achar, retorna 1.0.
function getMultiplicadorBairro(bairroNome, teamOrId) {
  if (!bairroNome) return 1.0;
  const team = (typeof teamOrId === "object" && teamOrId)
    ? teamOrId
    : teams.find(x => x.id === (teamOrId || state?.selectedTeam));
  if (!team) return 1.0;
  const cidade = DATA.cidadeById?.[team.cidadeId];
  const b = cidade?.bairros?.find(x => x.nome === bairroNome);
  return b?.multiplicador != null ? b.multiplicador : 1.0;
}

// Resolve bairros reais da cidade do jogador (do CityMapData) ou retorna fallback
function getBairrosDaCidade(cityIdOrTeam) {
  // Aceita cityId direto, team object, ou usa selectedTeam por padrão
  let cityId = cityIdOrTeam;
  if (cityIdOrTeam && typeof cityIdOrTeam === "object") cityId = cityIdOrTeam.cidadeId;
  if (!cityId && state?.selectedTeam) {
    const t = teams.find(x => x.id === state.selectedTeam);
    cityId = t?.cidadeId;
  }
  const cidade = cityId ? DATA.cidadeById?.[cityId] : null;
  return cidade?.bairros?.length ? cidade.bairros : null;
}

// Retorna nome formatado "Nome (Zona X)" do i-ésimo bairro da cidade do jogador
// Se a cidade não tiver bairros mapeados, cai pro array genérico.
function getBairroNomeDaCidade(idx, cityIdOrTeam) {
  const lista = getBairrosDaCidade(cityIdOrTeam);
  if (lista) {
    const b = lista[idx % lista.length];
    return `${b.nome} (Zona ${b.zonaLabel})`;
  }
  return BAIRROS_GENERICOS[idx % BAIRROS_GENERICOS.length];
}

const BAIRROS_GENERICOS = [
  "Centro (Centro)",
  "Vila São José (Zona Sul)",
  "Bom Jardim (Zona Oeste)",
  "Mondubim (Zona Sul)",
  "Subúrbio (Zona Norte)",
  "Bairro Alto (Zona Leste)",
  "Conjunto Esperança (Zona Oeste)",
  "Vila União (Zona Norte)",
  "Periferia (Zona Leste)",
  "Comunidade Alegria (Zona Sul)",
  "Pq. Industrial (Zona Norte)",
  "Vila Operária (Zona Leste)"
];

const newsSeeds = [
  "CLASSIFICAÇÃO: rodada nacional movimenta o ranking das torcidas",
  "PRÉ-JOGO: clima de tensão nos arredores do estádio",
  "MERCADO: lojas de materiais esportivos registram alta nas vendas",
  "POLÍCIA: operação preventiva anunciada para o próximo clássico",
  "ESTRADA: caravanas monitoram rotas antes da rodada do fim de semana"
];

const advisorTexts = {
  lowCash: ["Chefe, o caixa virou negativo. O mês precisa fechar melhor.", "A grana encurtou. Melhor segurar gasto grande por enquanto."],
  lowMoral: ["A moral caiu. Uma ação social ou descanso pode segurar a rapaziada.", "O clima na sede está pesado. A diretoria quer uma resposta."],
  visitor: ["Tem torcida visitante na cidade. Dá para receber aliado, atacar rival ou deixar passar.", "Atenção nos arredores do estádio: visitante já chegou."],
  travel: ["Estamos em viagem. A rotina da sede fica bloqueada até a volta.", "Caravana na estrada: cada parada pode virar notícia."],
  general: ["Ainda temos comando disponível hoje. Vale decidir antes de avançar.", "Resumo rápido: sede operando, bar aberto e olheiros aguardando ordem."]
};

const els = {
  panels: document.querySelectorAll(".panel"),
  tabs: document.querySelectorAll(".tab"),
  advanceDay: document.querySelector("#advanceDay"),
  ticker: document.querySelector("#ticker"),
  toast: document.querySelector("#toast"),
  whatsDialog: document.querySelector("#whatsDialog"),
  messages: document.querySelector("#messages"),
  unreadBadge: document.querySelector("#unreadBadge"),
  // Top header
  thFlag: document.querySelector("#thFlag"),
  thTorcida: document.querySelector("#thTorcida"),
  thCity: document.querySelector("#thCity"),
  thSaldo: document.querySelector("#thSaldo"),
  thMembros: document.querySelector("#thMembros"),
  thPrestigio: document.querySelector("#thPrestigio"),
  // Rail date
  railDateDay: document.querySelector("#railDateDay"),
  railDateWeekday: document.querySelector("#railDateWeekday")
};

const defaultTeam = teams.find(t => t.id === "jovem_fla")
  || teams.find(t => t.timeId === "flamengo")
  || teams.find(t => t.timeId === "fortaleza")
  || teams[0];
let state = normalizeState(loadState()) || createNewGame(defaultTeam, "normal");

function createNewGame(team, difficulty = "normal") {
  const sede = sedeByMembers(team.membros);
  const lfCount = Math.max(2, Math.round(team.membros * 0.15));
  const diretoria = Math.max(2, Math.min(maxDiretoria(sede), Math.round(team.membros * 0.05)));
  const linhaDeFrente = Array.from({ length: lfCount }, (_, i) => createMember(team, i));

  const game = {
    version: 2,
    date: "2026-01-01",
    difficulty,
    selectedTeam: team.id,
    player: {
      nome: team.torcida,
      time: team.nome,
      sigla: team.sigla,
      cidade: team.cidade,
      cor: team.cor,
      rival: team.rival,
      aliados: [...team.aliados],
      satisfacao: 12,
      saldo: team.membros * 10,
      moral: 70,
      prestigio: Math.min(100, sede * 16),
      policia: 50,
      novatos: Math.round(team.membros * 0.5),
      componentes: Math.round(team.membros * 0.3),
      linhaDeFrente,
      diretoria,
      acoes: actionsBySede(sede),
      livreUsada: false,
      weapons: { pedra: "livre", rojao: 2, bomba: 0 },
      scouts: [],
      scoutReports: [],
      buildings: {
        sede,
        bares: [{ nome: "Bar da Torcida", nivel: 1, local: pickBairroForaDaZonaSede(0, team)?.nome || "Zona Sul", damaged: 0 }],
        lojas: sede >= 2 ? [{ nome: "Loja da Torcida", nivel: 1, local: pickBairroForaDaZonaSede(1, team)?.nome || "Centro", damaged: 0 }] : [],
        subsedesCidade: [],
        subsedesFora: [],
        fabrica: false
      }
    },
    ai: createAI(team),
    messages: [],
    news: [...newsSeeds],
    history: [],
    hall: [],
    achievements: [],
    visitors: [],
    travel: null,
    lastMonthly: null,
    nextMatch: null,
    eventLog: []
  };

  game.nextMatch = createNextMatch(game, 7);
  game.messages.unshift({
    id: newId(),
    from: "Assessor",
    text: "Bem-vindo à diretoria. Agora o protótipo tem viagens, visitantes, olheiros, moral individual, satisfação e WhatsApp com resposta.",
    urgency: "normal",
    actions: [],
    payload: null,
    day: 1,
    read: false,
    answered: true
  });
  game.news.unshift(`SUA TORCIDA: ${game.player.nome} inicia a temporada em ${game.player.cidade}`);
  return game;
}

function createMember(team, index, cargo = "linhaDeFrente") {
  // GDD 18: caps por cargo
  const caps = { novato: 8, componente: 12, linhaDeFrente: 18, diretoria: 20 };
  const cap = caps[cargo] || 18;
  // Geração inicial GDD: forca/defesa Random.Range(1, 5) → 1 a 4 mas ajustamos por cargo
  const baseRange = cargo === "novato" ? [1, 5]
    : cargo === "componente" ? [6, 12]
    : cargo === "linhaDeFrente" ? [12, 18]
    : [16, 20];
  return {
    nome: BANCO_NOMES[index % BANCO_NOMES.length],
    cargo,
    hp: 150,
    forca: rand(baseRange[0], baseRange[1]),
    defesa: rand(baseRange[0], baseRange[1]),
    forcaMax: cap,
    defesaMax: cap,
    xp: cargo === "novato" ? rand(0, 35) : cargo === "componente" ? rand(40, 95) : cargo === "linhaDeFrente" ? rand(100, 280) : rand(300, 500),
    moral: +(10 + Math.random() * 4).toFixed(1),
    idade: rand(16, 35),
    timeCoracao: team?.nome || team?.time || "",
    bairro: getBairroNomeDaCidade(index, team),
    estado: "saudavel",
    ferido: 0,
    preso: 0,
    doente: 0,
    combates: 0,
    vitorias: 0
  };
}

function createAI(playerTeam) {
  // Build a relation map from the player torcida's lists (full, untruncated).
  // Each relation type maps to a tier matching the GDD diplomacy ranges.
  const relMap = {};
  (playerTeam.aliadosIds || []).forEach(id => relMap[id] = "aliado");
  (playerTeam.irmandadeIds || []).forEach(id => relMap[id] = "irmao"); // takes precedence
  (playerTeam.rivaisIds || []).forEach(id => { if (!relMap[id]) relMap[id] = "rival"; });
  (playerTeam.maioresRivaisIds || []).forEach(id => relMap[id] = "maiorRival"); // takes precedence

  // Filter: different torcida AND different clube (sister torcidas of player's clube
  // share match days — no Jovem Fla vs Raça Fla as opponents).
  const annotated = teams
    .filter(t => t.id !== playerTeam.id && (!playerTeam.timeId || t.timeId !== playerTeam.timeId))
    .map(t => ({ team: t, tier: relMap[t.torcidaId] || null }));

  // Always include teams with explicit relation, then fill with same-division and top quality.
  const named = annotated.filter(x => x.tier);
  const sameDivision = annotated.filter(x => !x.tier && x.team.divisao === playerTeam.divisao);
  const topQuality = annotated.filter(x => !x.tier && x.team.divisao !== playerTeam.divisao)
    .sort((a, b) => (b.team.qualidade || 0) - (a.team.qualidade || 0));

  // Pool: all explicit relations are kept, then fillers up to a soft cap of 80.
  const seen = new Set();
  const final = [];
  for (const x of named) { if (!seen.has(x.team.id)) { seen.add(x.team.id); final.push(x); } }
  for (const x of [...sameDivision, ...topQuality]) {
    if (final.length >= 80) break;
    if (seen.has(x.team.id)) continue;
    seen.add(x.team.id);
    final.push(x);
  }

  return final.map(({ team, tier }) => ({
    id: team.id,
    nome: team.torcida,
    time: team.nome,
    cidade: team.cidade,
    membros: team.membros,
    torcidaId: team.torcidaId,
    prestigio: rand(20, 78),
    relacao:
      tier === "irmao" ? rand(81, 100) :
      tier === "aliado" ? rand(51, 80) :
      tier === "maiorRival" ? rand(-100, -85) :
      tier === "rival" ? rand(-60, -25) :
      rand(-15, 25),
    relacaoTipo: tier || "neutro",
    sede: sedeByMembers(team.membros),
    agressividade: rand(25, 85)
  }));
}

function normalizeState(raw) {
  if (!raw || !raw.player) return null;

  const team = getTeam(raw.selectedTeam) || teams[0];
  const fresh = createNewGame(team, raw.difficulty || "normal");
  const p = { ...fresh.player, ...raw.player };

  p.buildings = raw.player.buildings || {
    sede: raw.player.sede || fresh.player.buildings.sede,
    bares: [{ nome: "Bar da Torcida", nivel: raw.player.barNivel || 1, local: pickBairroForaDaZonaSede(0, team)?.nome || "Zona Sul", damaged: 0 }],
    lojas: raw.player.lojaNivel ? [{ nome: "Loja da Torcida", nivel: raw.player.lojaNivel, local: pickBairroForaDaZonaSede(1, team)?.nome || "Centro", damaged: 0 }] : [],
    subsedesCidade: [],
    subsedesFora: [],
    fabrica: !!raw.player.fabrica
  };

  // Migração: substitui locais legados ("Zona Sul", "Centro", "Bairro", etc.)
  // por bairros reais da cidade do jogador (em zona diferente da sede).
  const cidade = team ? DATA.cidadeById?.[team.cidadeId] : null;
  if (cidade?.bairros?.length) {
    const bairroNomes = new Set(cidade.bairros.map(b => b.nome));
    let seedOff = 0;
    const migrarLocal = (item) => {
      if (!item) return;
      if (!item.local || !bairroNomes.has(item.local)) {
        const novo = pickBairroForaDaZonaSede(seedOff++, team);
        if (novo) item.local = novo.nome;
      }
    };
    (p.buildings.bares || []).forEach(migrarLocal);
    (p.buildings.lojas || []).forEach(migrarLocal);
    (p.buildings.subsedesCidade || []).forEach(migrarLocal);
  }
  p.weapons ||= { pedra: "livre", rojao: 2, bomba: 0 };
  p.scouts ||= [];
  p.scoutReports ||= [];
  p.satisfacao = Number.isFinite(p.satisfacao) ? p.satisfacao : 12;
  p.aliados ||= team.aliados || [];
  p.diretoria = Number.isFinite(p.diretoria) ? p.diretoria : 2;
  p.linhaDeFrente = (p.linhaDeFrente || fresh.player.linhaDeFrente).map((m, i) => ({
    ...createMember(team, i),
    ...m,
    moral: Number.isFinite(m.moral) ? m.moral : 12,
    preso: m.preso || 0,
    combates: m.combates || 0,
    vitorias: m.vitorias || 0
  }));

  const normalized = {
    ...fresh,
    ...raw,
    version: 2,
    player: p,
    ai: raw.ai?.length ? raw.ai.map(ai => ({ ...ai, cidade: ai.cidade || getTeam(ai.id)?.cidade || "São Paulo", sede: ai.sede || sedeByMembers(ai.membros || 50), agressividade: ai.agressividade || rand(25, 85) })) : fresh.ai,
    messages: raw.messages || fresh.messages,
    news: raw.news || fresh.news,
    history: raw.history || [],
    hall: raw.hall || [],
    achievements: raw.achievements || [],
    visitors: raw.visitors || [],
    travel: raw.travel || null,
    eventLog: raw.eventLog || [],
    lastMonthly: raw.lastMonthly || null,
    nextMatch: raw.nextMatch || null
  };

  if (!normalized.nextMatch) normalized.nextMatch = createNextMatch(normalized, Math.max(dayOfYear(new Date(normalized.date + "T12:00:00")) + 6, 7));

  // Sempre parte do estado inicial das divisões (Excel/data.js) e aplica
  // overrides do save por cima, pra que cada save tenha suas próprias rotações.
  resetTeamsDivisao();
  const cs = normalized.compState;
  if (cs) {
    cs.teamDivisaoOverrides ||= {};
    // Backfill: saves antigos sem overrides explícitos — reconstrói a partir das séries atuais
    if (Object.keys(cs.teamDivisaoOverrides).length === 0) {
      [1,2,3,4].forEach(div => {
        const comp = cs[`serie${div}`];
        comp?.clubes?.forEach(c => { cs.teamDivisaoOverrides[c.id] = div; });
      });
    }
    Object.entries(cs.teamDivisaoOverrides).forEach(([timeId, div]) => {
      teams.forEach(t => { if (t.timeId === timeId) t.divisao = div; });
    });
  }
  return normalized;
}

function loadState() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) return JSON.parse(current);

    for (const key of LEGACY_KEYS) {
      const legacy = localStorage.getItem(key);
      if (legacy) return JSON.parse(legacy);
    }
  } catch {
    return null;
  }
  return null;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  toast("Jogo salvo no navegador.");
}

function saveSilent() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetTeamsDivisao() {
  // Restaura todas as divisões para o valor inicial (do data.js, fonte do Excel)
  teams.forEach(t => { t.divisao = t.divisaoInicial != null ? t.divisaoInicial : t.divisao; });
}

function resetState(teamId = state.selectedTeam, difficulty = state.difficulty) {
  localStorage.removeItem(STORAGE_KEY);
  resetTeamsDivisao();
  state = createNewGame(getTeam(teamId) || teams[0], difficulty || "normal");
  render();
  toast("Nova partida iniciada.");
}

function getTeam(id) {
  if (!id) return null;
  // First try torcida id, then fall back to clube id (for legacy saves)
  return teams.find(t => t.id === id)
      || teams.filter(t => t.timeId === id).sort((a, b) => b.membros - a.membros)[0]
      || null;
}

function getDifficulty() {
  return difficulties[state.difficulty] || difficulties.normal;
}

function sedeByMembers(members) {
  if (members >= 301) return 5;
  if (members >= 201) return 4;
  if (members >= 101) return 3;
  if (members >= 51) return 2;
  return 1;
}

function maxDiretoria(level) {
  return [0, 3, 5, 8, 10, 15][level] || 3;
}

function actionsBySede(level) {
  if (level >= 5) return 3;
  if (level >= 3) return 2;
  return 1;
}

function totalMembers(p = state.player) {
  return p.novatos + p.componentes + p.linhaDeFrente.length + p.diretoria;
}

function availableLF() {
  return state.player.linhaDeFrente.filter(m => m.ferido <= 0 && m.preso <= 0 && moraleState(m.moral).canAct).length;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(list) {
  return list[rand(0, list.length - 1)];
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

function currentDay() {
  return dayOfYear(new Date(state.date + "T12:00:00"));
}

function newId() {
  return self.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function messageItem(from, text, urgency = "normal", actions = [], payload = null) {
  return {
    id: newId(),
    from,
    text,
    urgency,
    actions,
    payload,
    day: currentDay(),
    read: false,
    answered: actions.length === 0
  };
}

function addMessage(from, text, urgency = "normal", actions = [], payload = null) {
  state.messages.unshift(messageItem(from, text, urgency, actions, payload));
  state.messages = state.messages.slice(0, 100);
}

function addNews(text) {
  state.news.unshift(text);
  state.news = state.news.slice(0, 50);
}

function addHistory(desc, value = 0, type = "evento") {
  state.history.unshift({ desc, value, type, date: state.date });
  state.history = state.history.slice(0, 80);
}

function addHall(text) {
  if (!state.hall.includes(text)) state.hall.unshift(text);
  state.hall = state.hall.slice(0, 20);
}

function unlockAchievement(id, name) {
  if (state.achievements.includes(id)) return;
  state.achievements.push(id);
  addNews(`CONQUISTA: ${name} desbloqueada por ${state.player.nome}`);
  addMessage("Salão da Fama", `Conquista desbloqueada: ${name}.`);
}

function moraleState(value) {
  if (value <= 4) return { label: "Revoltado", cls: "bad", force: .6, canAct: false };
  if (value <= 9) return { label: "Desanimado", cls: "warn", force: .8, canAct: true };
  if (value <= 14) return { label: "Firme", cls: "good", force: 1, canAct: true };
  return { label: "Empolgado", cls: "blue", force: 1.2, canAct: true };
}

function satisfactionState(value) {
  if (value <= 4) return { label: "Insatisfeito", chance: .02, public: .2, cls: "bad" };
  if (value <= 9) return { label: "Preocupado", chance: .05, public: .4, cls: "warn" };
  if (value <= 14) return { label: "Contente", chance: .15, public: .6, cls: "good" };
  return { label: "Muito Contente", chance: .3, public: .8, cls: "blue" };
}

function advanceDay() {
  const d = new Date(state.date + "T12:00:00");
  d.setDate(d.getDate() + 1);
  state.date = d.toISOString().slice(0, 10);

  decrementTimers();
  state.player.acoes = state.travel ? 0 : actionsBySede(state.player.buildings.sede);
  state.player.livreUsada = !!state.travel;

  processTravelSchedule();
  processVisitorSchedule();

  if (d.getDate() === 1) processMonth();
  if (currentDay() % 7 === 0) processWeek();
  if (state.nextMatch && currentDay() === state.nextMatch.day) processMatchday();
  processRandomEvents();

  // Simula jogos das competições agendados até o dia anterior (réplica BrasileiraoManager.OnDiaAvancado)
  autoSimularCompeticoesAtoHoje();

  // Despesa automática de caravana: dia anterior a partida fora (cidade diferente)
  processarDespesaCaravana();

  // Auto-execução de plano manual ou rotina semanal pra hoje
  executarPlanoOuRotinaDoDia();

  checkAchievements();
  saveSilent();
  render();
}

function decrementTimers() {
  const p = state.player;
  p.linhaDeFrente.forEach(m => {
    if (m.ferido > 0) {
      m.ferido -= 1;
      if (m.ferido === 0) {
        m.hp = 150;
        addMessage("Diretoria", `${m.nome} voltou ao quadro depois da recuperação.`);
      }
    }
    if (m.preso > 0) {
      m.preso -= 1;
      if (m.preso === 0) addMessage("Diretoria", `${m.nome} foi liberado e voltou para a sede.`);
    }
  });

  [...p.buildings.bares, ...p.buildings.lojas, ...p.buildings.subsedesCidade, ...p.buildings.subsedesFora].forEach(b => {
    if (b.damaged > 0) b.damaged -= 1;
    if (b.building > 0) b.building -= 1;
  });
}

function processWeek() {
  // Recrutamento agora é processado por dia da rotina semanal (executarRecrutamento)
  // — não há mais "lote semanal" automático. processWeek mantém apenas o tick da IA.
  state.ai.forEach(ai => {
    ai.membros += rand(0, ai.sede + 2);
    ai.prestigio = clamp(ai.prestigio + rand(-2, 3), 0, 100);
    if (Math.random() < .14) ai.relacao = clamp(ai.relacao + rand(-4, 3), -100, 100);
  });
}

function mapaZeroLayout(cidade) {
  const zonas = { Norte: [], Oeste: [], Leste: [], Sul: [] };
  cidade.bairros.forEach(b => zonas[b.zonaLabel]?.push(b));
  const bairros = ["Norte", "Oeste", "Leste", "Sul"].flatMap(z => zonas[z]);
  const count = bairros.length;
  const cols = 4;
  const rows = Math.max(2, Math.ceil(count / cols));
  const cellW = count >= 12 ? 270 : 250;
  const cellH = count >= 12 ? 210 : 195;
  const gap = 28;
  const pad = 30;

  return {
    cols,
    rows,
    cellW,
    cellH,
    gap,
    pad,
    width: cols * cellW + (cols - 1) * gap + pad * 2,
    height: rows * cellH + (rows - 1) * gap + pad * 2,
    cells: bairros.map((bairro, i) => ({
      bairro,
      row: Math.floor(i / cols) + 1,
      col: (i % cols) + 1,
      zona: bairro.zonaLabel || "Centro"
    }))
  };
}

function renderMapaZeroQuarteirao(bairroNome, qIdx, especial) {
  if (especial?.tipo === "estadio") {
    return `<div class="mz-block mz-stadium" title="${especial.label}">
      <span class="mz-stadium-badge">${especial.icone}</span>
    </div>`;
  }

  const targetLote = especial && especial.loteIdx != null ? especial.loteIdx : -1;
  let lotes = "";
  for (let i = 0; i < MAPA_LOTES_POR_QUARTEIRAO; i++) {
    let cls = "mz-lot";
    let content = "";
    let title = `Lote ${i + 1}`;
    let style = "";
    if (especial && i === targetLote) {
      cls += ` mz-poi mz-poi-${especial.tipo}`;
      if (especial.isPlayer) cls += " mz-player";
      if (especial.isNeutral) cls += " mz-neutral";
      title = especial.label;
      content = `<span class="mz-pin"><b>${especial.icone}</b></span>`;
      if (especial.cor && (especial.tipo === "sede" || especial.tipo === "bar")) {
        style = `style="--pin:${especial.cor}"`;
      }
    } else {
      const seed = fnvHash(`mz|${bairroNome}|${qIdx}|${i}`);
      const r = ROOF_PALETTE[seed % ROOF_PALETTE.length];
      const h = 1 + (seed % 4);
      const roofDir = (seed >> 4) % 4;
      cls += ` mz-building mz-h${h}`;
      style = `style="--roof:${r.bg};--roof-line:${r.line};--dir:${roofDir}"`;
    }
    lotes += `<div class="${cls}" title="${title}" ${style}>${content}</div>`;
  }
  return `<div class="mz-block" title="Quarteirao ${qIdx + 1}">${lotes}</div>`;
}

function renderMapaZeroBairro(cell, allStructures) {
  const { bairro, zona } = cell;
  const especiais = calcularQuarteiroesEspeciais(bairro.nome, allStructures);
  const temSedePlayer = Object.values(especiais).some(e => e.tipo === "sede" && e.isPlayer);
  const blocos = Array.from({ length: MAPA_QUARTEIROES_POR_BAIRRO }, (_, q) =>
    renderMapaZeroQuarteirao(bairro.nome, q, especiais[q])
  ).join("");

  return `<section class="mz-district mz-zone-${zona.toLowerCase()} ${temSedePlayer ? "mz-district-player" : ""}"
      style="grid-row:${cell.row};grid-column:${cell.col}"
      data-zona="${zona}"
      data-classe="${bairro.classeLabel}"
      title="${bairro.nome} - Zona ${zona}">
    <div class="mz-district-label">
      <strong>${bairro.nome}</strong>
      <span>${zona} · ${bairro.classeLabel}</span>
    </div>
    <div class="mz-blocks">${blocos}</div>
  </section>`;
}

function renderMapaZeroBackground(layout) {
  const roads = [];
  for (let c = 1; c < layout.cols; c++) {
    const x = layout.pad + c * layout.cellW + (c - 1) * layout.gap + layout.gap / 2;
    roads.push(`<line class="mz-road-line mz-road-v" x1="${x}" y1="${layout.pad}" x2="${x}" y2="${layout.height - layout.pad}"/>`);
  }
  for (let r = 1; r < layout.rows; r++) {
    const y = layout.pad + r * layout.cellH + (r - 1) * layout.gap + layout.gap / 2;
    roads.push(`<line class="mz-road-line mz-road-h" x1="${layout.pad}" y1="${y}" x2="${layout.width - layout.pad}" y2="${y}"/>`);
  }
  const cx = layout.width / 2;
  const cy = layout.height / 2;
  return `
    <div class="mz-nature mz-nature-nw"></div>
    <div class="mz-nature mz-nature-se"></div>
    <div class="mz-river" aria-hidden="true"></div>
    <svg class="mz-road-svg" viewBox="0 0 ${layout.width} ${layout.height}" preserveAspectRatio="none" aria-hidden="true">
      ${roads.join("")}
      <circle class="mz-roundabout-road" cx="${cx}" cy="${cy}" r="34"/>
      <circle class="mz-roundabout-park" cx="${cx}" cy="${cy}" r="19"/>
    </svg>`;
}

function renderMapa() {
  const team = teams.find(x => x.id === state.selectedTeam);
  const cidade = team ? DATA.cidadeById?.[team.cidadeId] : null;
  const root = document.querySelector("#mapa");
  if (!root) return;

  if (!cidade?.bairros?.length) {
    root.innerHTML = `<div class="hg-grid"><article class="hg-card" style="grid-column: span 12">
      <header class="hg-card-head"><span class="hg-bar"></span><h2>MAPA</h2></header>
      <div class="tor-body-empty"><p class="muted">Cidade sem bairros mapeados.</p></div>
    </article></div>`;
    return;
  }

  const layout = mapaZeroLayout(cidade);
  const filtros = getMapaFiltros();
  const allStructuresRaw = coletarEstruturasDaCidade();
  const allStructures = allStructuresRaw.filter(s => {
    if (s.tipo === "estadio") return filtros.estadios;
    if (s.tipo === "sede") return filtros.sedes;
    if (s.tipo === "bar" || s.tipo === "bar-jogador") return filtros.bares;
    if (s.tipo === "loja-jogador") return filtros.lojas;
    if (s.tipo === "subsede") return filtros.subsedes;
    if (s.isNeutral) return !!filtros[s.tipo];
    return true;
  });

  const tamanhoMapa = cidade.nivelMapa === 1 ? "Grande" : cidade.nivelMapa === 2 ? "Medio" : "Pequeno";
  const torcida = DATA.torcidaById?.[team?.torcidaId];
  const zoom = state.mapaZoom || 1;
  const distritos = layout.cells.map(c => renderMapaZeroBairro(c, allStructures)).join("");

  root.innerHTML = `
    <div class="hg-grid">
      <article class="hg-card mz-card" style="grid-column: span 12">
        <header class="hg-card-head"><span class="hg-bar"></span><h2>MAPA — ${cidade.nome.toUpperCase()}</h2></header>
        <div class="mz-toolbar">
          <div class="mz-stat"><span>CIDADE</span><b>${cidade.nome} / ${cidade.estado}</b></div>
          <div class="mz-stat"><span>TAMANHO</span><b>${tamanhoMapa}</b></div>
          <div class="mz-stat"><span>BAIRROS</span><b>${cidade.bairros.length}</b></div>
          <div class="mz-stat"><span>LOCAIS VISIVEIS</span><b>${allStructures.length}</b></div>
          <div class="mz-stat"><span>SEDE</span><b>${torcida?.bairroSede || "—"}</b></div>
        </div>
        <div class="mz-shell">
          <aside class="mz-side">
            <div class="mz-side-title">Camadas</div>
            ${renderMapaFiltros("")}
            <div class="mz-legend">
              <span><i class="mz-dot mz-dot-torcida"></i>Torcidas</span>
              <span><i class="mz-dot mz-dot-neutral"></i>Servicos</span>
              <span><i class="mz-dot mz-dot-stadium"></i>Estadios</span>
            </div>
          </aside>
          <div class="mz-viewport">
            <div class="mz-city"
              style="width:${layout.width}px;height:${layout.height}px;grid-template-columns:repeat(${layout.cols}, ${layout.cellW}px);grid-template-rows:repeat(${layout.rows}, ${layout.cellH}px);gap:${layout.gap}px;padding:${layout.pad}px;transform:scale(${zoom});transform-origin:top left;">
              ${renderMapaZeroBackground(layout)}
              ${distritos}
            </div>
            <div class="mapa-zoom mz-zoom">
              <button class="mapa-zoom-btn" data-mapa-zoom="out" title="Diminuir">−</button>
              <span class="mapa-zoom-pct">${Math.round(zoom * 100)}%</span>
              <button class="mapa-zoom-btn" data-mapa-zoom="in" title="Aumentar">+</button>
            </div>
          </div>
        </div>
      </article>
    </div>`;
}

// ===========================================================================
// FINANCE MANAGER — réplica de Finance/FinanceManager.cs
// Tipos, tabelas, processamento mensal e registro de transações.
// ===========================================================================
const FIN_MENSALIDADE_NOVATO     = 20;   // R$/mês — Novato
const FIN_MENSALIDADE_COMPONENTE = 50;   // R$/mês — Componente
const FIN_MENSALIDADE_POVAO_COMP = 50;   // (legado — manter alias, usado em fórmulas)
const FIN_MENSALIDADE_LF_DIR     = 200;  // R$/mês — Linha de Frente, Diretoria

const FIN_MANUT_SEDE = [0, 200, 480, 960, 1800, 3000];
const FIN_MANUT_BAR  = [0, 800, 1600, 3000];
const FIN_MANUT_LOJA = [0, 1500, 2500, 4000];
const FIN_INSU_LOJA  = [0, 500, 1200, 2500];
const FIN_REC_BAR    = [[0,0], [100,4000], [500,6000], [1000,8000]]; // min,max por nível
const FIN_REC_LOJA   = [[0,0], [100,5000], [1000,8000], [2000,10000]];

const TIPOS_TRANSACAO = {
  Mensalidade: "Mensalidade",
  ManutencaoSede: "Manutenção Sede",
  ManutencaoBar: "Manutenção Bar",
  ManutencaoLoja: "Manutenção Loja",
  ReceitaBar: "Receita Bar",
  ReceitaLoja: "Receita Loja",
  ReceitaSubsede: "Receita Subsede",
  ManutSubsede: "Manutenção Subsede",
  InsumoLoja: "Insumo Loja",
  Saque: "Saque",
  Construcao: "Construção",
  Festa: "Festa",
  RecepcaoAliado: "Recepção Aliado",
  Fianca: "Fiança",
  Caravana: "Caravana",
  Inteligencia: "Inteligência",
  AcaoSocial: "Ação Social",
  Material: "Material",
  Outro: "Outro"
};

function registrarTransacao(descricao, valor, tipo) {
  state.financeiro = state.financeiro || { transacoes: [], ultimoResumo: null };
  state.player.saldo = (state.player.saldo || 0) + valor;
  const t = {
    descricao,
    valor: Math.round(valor),
    tipo: tipo || "Outro",
    data: state.date,
    diaDoAno: currentDay()
  };
  state.financeiro.transacoes.unshift(t); // mais recente primeiro
  if (state.financeiro.transacoes.length > 200) state.financeiro.transacoes.length = 200;
  return t;
}

function processMonth() {
  const p = state.player;
  const d = new Date(state.date + "T12:00:00");
  const mes = d.getMonth() + 1;
  const ano = d.getFullYear();
  const saldoAnterior = p.saldo;

  // Inicializa financeiro se ainda não existe
  state.financeiro = state.financeiro || { transacoes: [], ultimoResumo: null };

  const resumo = {
    mes, ano, saldoAnterior,
    totalReceitas: 0,
    totalGastos: 0,
    saldoNovo: 0,
    transacoes: [],
    porLocal: [] // breakdown por estabelecimento
  };

  const reg = (desc, valor, tipo) => {
    const t = registrarTransacao(desc, valor, tipo);
    resumo.transacoes.push(t);
    if (valor > 0) resumo.totalReceitas += valor;
    else           resumo.totalGastos   += valor;
    return t;
  };

  // ── 1. MENSALIDADES (réplica FinanceManager.CobrarMensalidade) ──
  const fab = p.buildings.fabrica;
  const fabMult = fab ? 1.2 : 1;
  const mensalNovato = FIN_MENSALIDADE_NOVATO * fabMult;
  const mensalComp   = FIN_MENSALIDADE_COMPONENTE * fabMult;
  const mensalLF     = FIN_MENSALIDADE_LF_DIR;
  const mensalDir    = FIN_MENSALIDADE_LF_DIR;

  if (p.novatos > 0)
    reg(`Mensalidade Novatos (${p.novatos}×${BRL.format(mensalNovato)})`, p.novatos * mensalNovato, "Mensalidade");
  if (p.componentes > 0)
    reg(`Mensalidade Componentes (${p.componentes}×${BRL.format(mensalComp)})`, p.componentes * mensalComp, "Mensalidade");
  if (p.linhaDeFrente.length > 0)
    reg(`Mensalidade Linha de Frente (${p.linhaDeFrente.length}×${BRL.format(mensalLF)})`, p.linhaDeFrente.length * mensalLF, "Mensalidade");
  // Diretoria: jogador (líder) não paga, só os outros
  const dirQuePagam = Math.max(0, p.diretoria - 1);
  if (dirQuePagam > 0)
    reg(`Mensalidade Diretoria (${dirQuePagam}×${BRL.format(mensalDir)})`, dirQuePagam * mensalDir, "Mensalidade");

  // ── 2. ESTABELECIMENTOS (receitas + manutenções + insumos) ──
  // Sede (só manutenção)
  const mSede = FIN_MANUT_SEDE[clamp(p.buildings.sede, 0, 5)];
  if (mSede > 0) {
    reg(`Manutenção Sede Nv.${p.buildings.sede}`, -mSede, "ManutencaoSede");
    resumo.porLocal.push({ tipo: "Sede", nome: `Sede da ${p.nome}`, receita: 0, custo: mSede, lucro: -mSede });
  }

  // Bares
  p.buildings.bares.forEach(bar => {
    const nv = clamp(bar.nivel, 1, 3);
    const local = bar.local || "Centro";
    const mult = getMultiplicadorBairro(local);
    let receita = 0;
    if (!bar.damaged && !bar.building) {
      const [min, max] = FIN_REC_BAR[nv];
      receita = Math.round(rand(min, max) * mult);
      reg(`Receita Bar ${local} (Nv.${nv}) ×${mult.toFixed(2)}`, receita, "ReceitaBar");
    }
    const custo = FIN_MANUT_BAR[nv];
    reg(`Manutenção Bar ${local}`, -custo, "ManutencaoBar");
    resumo.porLocal.push({ tipo: "Bar", nome: bar.nome || `Bar ${local}`, receita, custo, lucro: receita - custo });
  });

  // Lojas (insumo + receita + manutenção)
  p.buildings.lojas.forEach(loja => {
    const nv = clamp(loja.nivel, 1, 3);
    const local = loja.local || "Centro";
    const mult = getMultiplicadorBairro(local);
    const insumoBase = FIN_INSU_LOJA[nv];
    const insumo = fab ? Math.round(insumoBase * 0.4) : insumoBase;
    if (insumo > 0) reg(`Insumos Loja ${local}`, -insumo, "InsumoLoja");

    let receita = 0;
    if (!loja.damaged && !loja.building) {
      const [min, max] = FIN_REC_LOJA[nv];
      const baseRec = rand(min, max);
      receita = Math.round((fab ? baseRec * 3 : baseRec) * mult);
      reg(`Receita Loja ${local} (Nv.${nv}) ×${mult.toFixed(2)}`, receita, "ReceitaLoja");
    }
    const manut = FIN_MANUT_LOJA[nv];
    reg(`Manutenção Loja ${local}`, -manut, "ManutencaoLoja");
    resumo.porLocal.push({ tipo: "Loja", nome: loja.nome || `Loja ${local}`, receita, custo: manut + insumo, lucro: receita - manut - insumo });
  });

  // Subsedes na cidade
  p.buildings.subsedesCidade.forEach(s => {
    const nv = clamp(s.nivel, 1, 2);
    const local = s.local || "Bairro";
    const mult = getMultiplicadorBairro(local);
    let receita = 0;
    if (!s.damaged && !s.building) {
      receita = Math.round(rand(100, nv === 1 ? 2000 : 4000) * mult);
      reg(`Receita Subsede ${local} ×${mult.toFixed(2)}`, receita, "ReceitaSubsede");
    }
    const custo = nv === 1 ? 800 : 1200;
    reg(`Manutenção Subsede ${local}`, -custo, "ManutSubsede");
    resumo.porLocal.push({ tipo: "Subsede Cidade", nome: s.nome || `Subsede ${local}`, receita, custo, lucro: receita - custo });
  });

  // Subsedes em outras cidades
  p.buildings.subsedesFora.forEach(s => {
    const nv = clamp(s.nivel, 1, 2);
    const local = s.local || "Outra cidade";
    let receita = 0;
    if (!s.damaged && !s.building) {
      receita = Math.round(rand(100, nv === 1 ? 2000 : 4000));
      reg(`Receita Subsede Fora ${local}`, receita, "ReceitaSubsede");
    }
    const custo = nv === 1 ? 1200 : 2000;
    reg(`Manutenção Subsede Fora ${local}`, -custo, "ManutSubsede");
    resumo.porLocal.push({ tipo: "Subsede Fora", nome: s.nome || `Subsede ${local}`, receita, custo, lucro: receita - custo });
  });

  // Fábrica
  if (p.buildings.fabrica) {
    reg("Manutenção Fábrica de Materiais", -3000, "Outro");
    resumo.porLocal.push({ tipo: "Fábrica", nome: "Fábrica de Materiais", receita: 0, custo: 3000, lucro: -3000 });
  }

  // ── Finaliza ──
  resumo.saldoNovo = p.saldo;
  state.financeiro.ultimoResumo = resumo;
  state.lastMonthly = {
    mensalidades: resumo.transacoes.filter(t => t.tipo === "Mensalidade").reduce((s, t) => s + t.valor, 0),
    receitaBares: resumo.transacoes.filter(t => t.tipo === "ReceitaBar").reduce((s, t) => s + t.valor, 0),
    receitaLojas: resumo.transacoes.filter(t => t.tipo === "ReceitaLoja" || t.tipo === "ReceitaSubsede").reduce((s, t) => s + t.valor, 0),
    insumos: resumo.transacoes.filter(t => t.tipo === "InsumoLoja").reduce((s, t) => s + Math.abs(t.valor), 0),
    manut: resumo.transacoes.filter(t => t.tipo.startsWith("Manut")).reduce((s, t) => s + Math.abs(t.valor), 0),
    delta: resumo.totalReceitas + resumo.totalGastos
  };
  addMessage("Financeiro", `Fechamento mensal ${mes}/${ano}: ${BRL.format(resumo.totalReceitas + resumo.totalGastos)}. Receitas ${BRL.format(resumo.totalReceitas)}, despesas ${BRL.format(Math.abs(resumo.totalGastos))}.`);
}

function createNextMatch(game, day) {
  const rivals = game.ai.slice().sort((a, b) => a.relacao - b.relacao);
  const opponent = Math.random() < .55 ? rivals[0] : pick(game.ai);
  const home = Math.random() < .55 || opponent.cidade === game.player.cidade;
  const route = opponent.cidade === game.player.cidade ? null : findRoute(game.player.cidade, opponent.cidade);
  return {
    id: `match-${day}-${opponent.id || opponent.nome}`,
    day,
    home,
    opponent: opponent.nome,
    opponentTeam: opponent.time,
    opponentCity: opponent.cidade,
    relation: opponent.relacao,
    route,
    visitors: 0,
    notifiedTravel: false,
    outboundDone: false,
    returnDone: false,
    visitorsSpawned: false
  };
}

function scheduleNextMatch() {
  state.nextMatch = createNextMatch(state, currentDay() + rand(5, 8));
}

function processVisitorSchedule() {
  const match = state.nextMatch;
  if (!match || !match.home || match.visitorsSpawned || currentDay() !== match.day - 1) return;

  const opponent = state.ai.find(ai => ai.nome === match.opponent);
  const travelers = calculateVisitors(opponent?.membros || 80, match.route, true);
  const relation = opponent?.relacao || 0;
  const visitor = {
    id: match.id,
    torcida: match.opponent,
    time: match.opponentTeam,
    relation,
    travelers,
    lf: Math.round(travelers * .4),
    protected: false,
    handled: false,
    dayExpires: match.day + 1
  };

  state.visitors = [visitor];
  match.visitorsSpawned = true;
  addMessage("Assessor", `A ${visitor.torcida} chegou para o jogo de amanhã com cerca de ${visitor.travelers} visitantes. Relação: ${relationLabel(relation)}.`, relation < -50 ? "urgent" : "normal", relation < -50 ? ["Atacar Visitante", "Ignorar", "Reforçar Sede"] : []);
  addNews(`PRÉ-JOGO: ${visitor.torcida} chega em ${state.player.cidade} para partida contra ${state.player.time}`);
}

function processTravelSchedule() {
  const match = state.nextMatch;
  if (!match || match.home) return;

  if (!match.notifiedTravel && currentDay() === match.day - 2) {
    const cost = travelCost(match);
    addMessage("Assessor", `Viagem fora chegando. Rota: ${routeLabel(match.route)}. Custo estimado: ${BRL.format(cost)}. A viagem vai bloquear 3 dias.`, "urgent", ["Confirmar Caravana", "Viajar com Grupo Menor", "Economizar e Não Viajar"], { type: "travelPlan", matchId: match.id });
    match.notifiedTravel = true;
  }

  if (!match.outboundDone && currentDay() === match.day - 1) {
    startTravel("ida");
    match.outboundDone = true;
  }

  if (!match.returnDone && currentDay() === match.day + 1) {
    startTravel("volta");
    match.returnDone = true;
    state.travel = null;
    addMessage("Assessor", "Caravana voltou para a sede. Rotina liberada amanhã.");
    scheduleNextMatch();
  }
}

function startTravel(phase) {
  const match = state.nextMatch;
  const p = state.player;
  const travelers = calculateVisitors(totalMembers(), match.route, false);
  const costFixo = 3000; // GDD: caravana custa R$ 3.000 fixo (ida+volta consolidado)
  // Cobrança UMA vez na ida (cobre ida+volta)
  if (phase === "ida") {
    registrarTransacao(`Caravana para ${match.opponentCity || "fora de casa"}`, -costFixo, "Caravana");
  }
  state.travel = { phase, route: match.route, travelers, cost: costFixo, matchId: match.id };
  p.acoes = 0;
  p.livreUsada = true;
  addHistory(`Viagem ${phase} para ${match.opponentCity}`, 0, "viagem");
  addNews(`ESTRADA: caravana da ${p.nome} segue pela rota ${routeLabel(match.route)}`);

  const ambushRisk = routeRisk(match.route) + (p.scoutReports.length ? -8 : 0);
  if (Math.random() * 100 < ambushRisk) {
    const injuries = applyInjuries(rand(1, 4), "estrada");
    p.moral = clamp(p.moral - 4, 0, 100);
    addMessage("Olheiro", `Emboscada na ${phase}. Tivemos ${injuries} feridos e perdemos parte da organização da caravana.`, "urgent", ["Planejar Revide", "Pedir Escolta Aliada", "Seguir Viagem"], { type: "ambush", injuries });
    addNews(`EMBOSCADA: caravana da ${p.nome} foi interceptada em rota`);
  }
}

function processMatchday() {
  const p = state.player;
  const match = state.nextMatch;
  const opponent = state.ai.find(ai => ai.nome === match.opponent);
  const torcidaFactor = calculateTorcidaFactor(match);
  const base = 50 + torcidaFactor * 30 + (p.satisfacao - 10) * 2 + rand(-22, 22);
  const rivalBase = 50 + (opponent?.prestigio || 45) * .2 + rand(-18, 18);
  const won = base >= rivalBase;
  const draw = Math.abs(base - rivalBase) < 8;
  const textResult = draw ? "empatou" : won ? "venceu" : "perdeu";
  const satDelta = draw ? rand(-1, 1) : won ? rand(1, 3) : -rand(1, 3);

  p.satisfacao = clamp(p.satisfacao + satDelta, 0, 20);
  p.moral = clamp(p.moral + (won ? 3 : draw ? 0 : -3), 0, 100);
  p.prestigio = clamp(p.prestigio + (won ? 2 : draw ? 0 : -1), 0, 100);
  adjustMemberMorale(won ? .5 : draw ? 0 : -.7);
  addNews(`FINAL: ${p.time} ${textResult} contra ${match.opponentTeam}. Fator torcida: ${Math.round(torcidaFactor * 100)}%`);
  addMessage("Assessor", `${match.home ? "Jogo em casa" : "Jogo fora"} encerrado. O time ${textResult}. Satisfação agora: ${satisfactionState(p.satisfacao).label}.`);

  if (match.home) {
    state.visitors = state.visitors.filter(v => v.id !== match.id);
    scheduleNextMatch();
  }
}

function processRandomEvents() {
  const p = state.player;
  const diff = getDifficulty();

  if (state.travel) {
    if (Math.random() < .25) addMessage("Responsável da Caravana", `Passamos por ${pick(routeCities(state.travel.route))}. Até aqui, ${state.travel.travelers} viajantes seguem juntos.`);
    return;
  }

  if (Math.random() < .28) addMessage("Assessor", contextualAdvisor());

  const hostile = state.ai.find(ai => ai.relacao < -60);
  if (hostile && Math.random() < .05 * diff.ataques) {
    const target = pick(["Bar da Torcida", "Loja da Torcida", "Sede"]);
    addMessage(`Responsável - ${target}`, `Chefe, tem movimentação rival perto do ${target}. O que a gente faz?`, "urgent", ["Enviar Reforços", "Ignorar", "Planejar Revide"], { type: "defense", target, rival: hostile.nome });
  }

  if (Math.random() < .08) addNews(pick(newsSeeds));
}

function contextualAdvisor() {
  const p = state.player;
  if (state.travel) return pick(advisorTexts.travel);
  if (state.visitors.length) return pick(advisorTexts.visitor);
  if (p.saldo < 0) return pick(advisorTexts.lowCash);
  if (p.moral < 45) return pick(advisorTexts.lowMoral);
  return pick(advisorTexts.general);
}

function calculateTorcidaFactor(match) {
  const p = state.player;
  const publico = satisfactionState(p.satisfacao).public;
  const faixas = clamp(p.buildings.sede * .14 + p.prestigio / 500, 0, 1);
  const bateria = clamp(availableLF() / 40, 0, 1);
  const moral = p.moral / 100;
  let factor = publico * .4 + faixas * .25 + bateria * .2 + moral * .15;
  if (!match.home) factor *= .75;
  return clamp(factor, 0, 1);
}

function calculateVisitors(members, route, isVisitor) {
  let ratio = .8;
  const roadCount = route ? route.roads.length : 0;
  if (roadCount === 0) ratio = .8;
  else if (roadCount === 1) ratio = isVisitor ? .35 : .3;
  else if (roadCount === 2) ratio = isVisitor ? .22 : .2;
  else ratio = isVisitor ? .12 : .1;
  return clamp(Math.round(members * ratio), 8, Math.max(8, members));
}

function travelCost(match, travelers = calculateVisitors(totalMembers(), match.route, false)) {
  if (!match.route) return 0;
  const roadsUsed = match.route.roads.length;
  const base = roadsUsed <= 1 ? 500 : roadsUsed === 2 ? 1200 : roadsUsed === 3 ? 2000 : 3000;
  return Math.round(base * Math.ceil(travelers / 10));
}

function routeRisk(route) {
  if (!route) return 0;
  const rivalsOnRoute = route.cities.filter(city => state.ai.some(ai => ai.cidade === city && ai.relacao < -50)).length;
  return 8 + route.roads.length * 7 + rivalsOnRoute * 14;
}

function routeCities(route) {
  return route?.cities?.length ? route.cities : [state.player.cidade];
}

function routeLabel(route) {
  if (!route) return "mesma cidade";
  return route.roads.length ? route.roads.join(" → ") : "rota local";
}

function buildRoadGraph() {
  const graph = new Map();
  const add = (a, b, road) => {
    if (!graph.has(a)) graph.set(a, []);
    if (!graph.has(b)) graph.set(b, []);
    graph.get(a).push({ city: b, road });
    graph.get(b).push({ city: a, road });
  };
  roads.forEach(road => {
    for (let i = 0; i < road.points.length - 1; i++) add(road.points[i], road.points[i + 1], road.nome);
  });
  roadConnections.forEach(([a, b]) => add(a, b, "Conexão"));
  return graph;
}

function findRoute(from, to) {
  if (from === to) return null;
  const graph = buildRoadGraph();
  const queue = [{ city: from, path: [from], roads: [] }];
  const visited = new Set([from]);

  while (queue.length) {
    const cur = queue.shift();
    if (cur.city === to) {
      return { cities: cur.path, roads: [...new Set(cur.roads.filter(r => r !== "Conexão"))] };
    }
    (graph.get(cur.city) || []).forEach(next => {
      if (visited.has(next.city)) return;
      visited.add(next.city);
      queue.push({ city: next.city, path: [...cur.path, next.city], roads: [...cur.roads, next.road] });
    });
  }
  return { cities: [from, to], roads: ["Rota indireta"] };
}

function relationLabel(value) {
  if (value <= -61) return "Inimigo Mortal";
  if (value <= -21) return "Rival";
  if (value <= 20) return "Neutro";
  if (value <= 50) return "Respeito";
  if (value <= 80) return "Aliança";
  return "Irmandade";
}

function spendAction() {
  if (state.travel) {
    toast("A torcida está viajando. Ações normais ficam bloqueadas.");
    return false;
  }
  if (state.player.acoes <= 0) {
    toast("Sem ações de gestão restantes hoje.");
    return false;
  }
  state.player.acoes -= 1;
  return true;
}

function spendMapAction() {
  if (state.travel) {
    toast("Você está em viagem. A ação local será liberada no dia do jogo fora.");
    return false;
  }
  if (state.player.livreUsada) {
    toast("Ação livre do mapa já foi usada hoje.");
    return false;
  }
  state.player.livreUsada = true;
  return true;
}

// ===========================================================================
// RECRUTAMENTO — GDD §17 (mecânica de captação de novatos)
// ===========================================================================
// Fórmula:
//   alcance         = (popCidade × torcidaShare) ÷ 200            (potencial diário)
//   atratividade    = 0,5 + (moral/100)·0,4 + (prestigio/100)·0,4 + (satisfacao/24)·0,4
//                     (faixa real ~0,5 a 1,7)
//   abordados       = alcance × atratividade × multSede
//   aceitos         = abordados × satisfacaoChance × random(0,75…1,2)
//   recrutados      = min(aceitos, capacidadeRestante, capDiárioSede)
//   custo           = recrutados × R$ 5 (panfletos/transporte)
function calcularRecrutamentoPotencial() {
  const p = state.player;
  const team = getTeam(state.selectedTeam);
  const sede = p.buildings.sede;
  const capTotal = [0, 50, 100, 150, 200, 500][sede];
  const espaco = Math.max(0, capTotal - totalMembers());
  const capDiario = [0, 2, 4, 8, 14, 22][sede] + (p.buildings.subsedesCidade?.length || 0) * 2;

  const popCidade = team?.pop || 100000;
  const share = team?.torcidaShare || 0.05;
  const alcance = Math.max(20, Math.round((popCidade * share) / 200));

  const atratividade = 0.5
    + (p.moral / 100) * 0.4
    + (p.prestigio / 100) * 0.4
    + (p.satisfacao / 24) * 0.4;

  const multSede = [0, 0.6, 0.8, 1.0, 1.2, 1.5][sede] || 1.0;
  const sat = satisfactionState(p.satisfacao);

  const abordados = Math.round(alcance * atratividade * multSede);
  const aceitosBase = Math.round(abordados * sat.chance * 0.18); // 18% conversão base

  return { espaco, capDiario, alcance, atratividade, abordados, aceitosBase, sat };
}

function executarRecrutamento({ origem = "rotina" } = {}) {
  const p = state.player;
  const calc = calcularRecrutamentoPotencial();
  if (calc.espaco <= 0) {
    addMessage("Assessor", "Sede cheia. Não dá pra recrutar mais ninguém — precisa expandir.");
    toast("Sede cheia.");
    return 0;
  }

  // Variância aleatória ±25%
  const variance = 0.75 + Math.random() * 0.45;
  const aceitos = Math.round(calc.aceitosBase * variance);
  const recrutas = Math.max(0, Math.min(aceitos, calc.espaco, calc.capDiario));

  const custo = recrutas * 5;
  if (recrutas > 0 && p.saldo < custo) {
    addMessage("Assessor", `Sem grana pra panfleto e ônibus (${BRL.format(custo)}). Recrutamento travado.`);
    toast("Saldo insuficiente p/ recrutar.");
    return 0;
  }

  if (recrutas > 0) {
    p.novatos += recrutas;
    p.novatosNomeados = p.novatosNomeados || [];
    // Cada recruta entra com XP 0, moral 15 e Força/Defesa 1-3
    for (let i = 0; i < recrutas; i++) {
      const seed = (state.recrutamentos?.length || 0) * 31 + p.novatosNomeados.length * 7 + i;
      p.novatosNomeados.push({
        nome: BANCO_NOMES[seed % BANCO_NOMES.length],
        forca: 1 + (seed % 3),
        defesa: 1 + ((seed * 5) % 3),
        xp: 0,
        moral: 15,
        idade: 16 + (seed % 12),
        bairro: getBairroNomeDaCidade(seed),
        timeCoracao: getTeam(state.selectedTeam)?.nome || "",
        estado: "saudavel",
        hp: 150,
        recrutadoEm: state.date
      });
    }
    if (custo > 0) registrarTransacao(`Recrutamento (${recrutas} novatos)`, -custo, "Recrutamento");
    adjustGlobalMorale(0.15);
  }

  // Histórico
  state.recrutamentos = state.recrutamentos || [];
  state.recrutamentos.unshift({
    data: state.date,
    origem,
    abordados: calc.abordados,
    aceitos,
    recrutas,
    custo,
    capDiario: calc.capDiario,
    espacoAntes: calc.espaco,
    sat: calc.sat.label,
    moral: p.moral,
    prestigio: p.prestigio
  });
  if (state.recrutamentos.length > 60) state.recrutamentos.length = 60;

  if (recrutas > 0) {
    toast(`${recrutas} novatos entraram${custo > 0 ? ` (${BRL.format(custo)})` : ""}.`);
    addNews(`SUA TORCIDA: ${recrutas} novatos chegaram à sede`);
  } else {
    toast("Nenhum novato hoje.");
  }
  render();
  return recrutas;
}

const actionHandlers = {
  recrutar() {
    // Verifica capacidade antes de consumir ação para não desperdiçar
    const calc = calcularRecrutamentoPotencial();
    if (calc.espaco <= 0) {
      addMessage("Assessor", "Sede cheia. Não dá pra recrutar mais ninguém — precisa expandir.");
      toast("Sede cheia. Ação não consumida.");
      return;
    }
    if (!spendAction()) return;
    executarRecrutamento({ origem: "manual" });
  },
  treinar(arg) {
    // Se chamado em modo "auto" (rotina, plano, advanceWeek), pula modal
    if (arg === "auto") {
      if (!spendAction()) return;
      treinarExecutar([]);
      return;
    }
    // Modo manual — abre modal de seleção
    if (state.travel) { toast("Em viagem. Treino bloqueado."); return; }
    if (state.player.acoes <= 0) { toast("Sem ações de gestão hoje."); return; }
    abrirModalTreino();
  },
  inteligencia() {
    if (!spendAction()) return;
    const p = state.player;
    const cost = 900;
    registrarTransacao("Missão de inteligência (olheiro)", -cost, "Inteligencia");
    const hostile = state.ai.filter(ai => ai.relacao < -40);
    const target = hostile.length ? pick(hostile) : pick(state.ai);
    const report = `Olheiro: ${target.nome} tem cerca de ${Math.round(target.membros * .15)} LF e relação ${relationLabel(target.relacao)}. Melhor evitar rota por ${target.cidade} sem escolta.`;
    p.scoutReports.unshift(report);
    p.scoutReports = p.scoutReports.slice(0, 8);
    addMessage("Olheiro", report);
    toast("Relatório de olheiro recebido no WhatsApp.");
    render();
  },
  social() {
    if (!spendAction()) return;
    registrarTransacao("Ação social na comunidade", -600, "AcaoSocial");
    state.player.policia = clamp(state.player.policia + 6, 0, 100);
    // Probabilidades GDD: 10% +3 prestígio + moral todos +1, 40% +1 prestígio, 50% nada
    const r = Math.random();
    if (r < 0.10) {
      state.player.prestigio = clamp(state.player.prestigio + 3, 0, 100);
      state.player.linhaDeFrente.forEach(m => {
        m.moral = clamp(+(m.moral + 1).toFixed(1), 0, 20);
      });
      state.player.moral = clamp(state.player.moral + 2, 0, 100);
      addNews(`SUA TORCIDA: ação social repercute na cidade, prestígio em alta`);
      toast("Ação social impactou a comunidade! +3 prestígio · moral +1 em todos.");
    } else if (r < 0.50) {
      state.player.prestigio = clamp(state.player.prestigio + 1, 0, 100);
      toast("Ação social bem recebida. +1 prestígio.");
    } else {
      toast("Ação social passou batida. Sem ganho de prestígio.");
    }
    render();
  },
  reuniaoInterna() {
    if (!spendAction()) return;
    const p = state.player;
    const boost = +(0.3 + Math.random() * 0.7).toFixed(2); // 0.3 a 1.0
    p.linhaDeFrente.forEach(m => {
      m.moral = clamp(+(m.moral + boost).toFixed(1), 0, 20);
    });
    p.moral = clamp(p.moral + boost * 2, 0, 100);
    addHistory("Reunião interna na sede", 0);
    toast(`Reunião animou a tropa. Moral +${boost.toFixed(1)} em cada membro.`);
    render();
  },
  materiais() {
    if (!spendAction()) return;
    const cost = 750;
    if (state.player.saldo < cost) {
      state.player.acoes += 1;
      toast("Saldo insuficiente para comprar materiais.");
      return;
    }
    registrarTransacao("Compra de materiais (rojões, bombas)", -cost, "Material");
    state.player.weapons.rojao += 6;
    state.player.weapons.bomba += 2;
    state.player.policia = clamp(state.player.policia - 3, 0, 100);
    toast("Estoque atualizado: +6 rojões, +2 bombas.");
    render();
  },
  ataque() {
    if (!spendAction()) return;
    resolveConfront("ataque planejado");
    render();
  },
  visitante() {
    const visitor = state.visitors[0];
    if (!visitor) {
      toast("Não há visitante relevante na cidade hoje.");
      return;
    }
    if (!spendAction()) return;
    if (visitor.relation >= 50) receiveVisitor(visitor);
    else resolveVisitorAttack(visitor);
    visitor.handled = true;
    render();
  },
  descanso() {
    if (!spendAction()) return;
    state.player.moral = clamp(state.player.moral + 6, 0, 100);
    adjustMemberMorale(.8);
    addHistory("Descanso coletivo", 0);
    toast("A moral subiu depois do descanso.");
    render();
  },
  upgrade() {
    if (!spendAction()) return;
    const p = state.player;
    const next = p.buildings.sede + 1;
    const cost = Math.round(([0, 0, 40000, 100000, 200000, 400000][next] || 0) * getDifficulty().custo);
    if (!cost || p.saldo < cost) {
      p.acoes += 1;
      toast("Saldo insuficiente para subir a sede.");
      return;
    }
    registrarTransacao(`Upgrade da sede para nível ${next}`, -cost, "Construcao");
    p.buildings.sede = next;
    p.acoes = actionsBySede(next);
    p.prestigio = clamp(p.prestigio + 8, 0, 100);
    adjustGlobalMorale(2.5);
    addNews(`SUA TORCIDA: ${p.nome} inaugura sede nível ${next}`);
    render();
  },
  construirLoja() {
    if (!spendAction()) return;
    const p = state.player;
    const max = p.buildings.sede >= 4 ? 2 : p.buildings.sede >= 2 ? 1 : 0;
    if (p.buildings.lojas.length >= max) {
      p.acoes += 1;
      toast("Sua sede ainda não permite outra loja.");
      return;
    }
    const cost = Math.round(50000 * getDifficulty().custo);
    if (p.saldo < cost) {
      p.acoes += 1;
      toast("Saldo insuficiente para construir loja.");
      return;
    }
    const bairroLoja = pickBairroForaDaZonaSede(p.buildings.lojas.length + 7)?.nome || "Centro";
    registrarTransacao(`Construção de Loja em ${bairroLoja}`, -cost, "Construcao");
    p.buildings.lojas.push({ nome: `Loja ${p.buildings.lojas.length + 1}`, nivel: 1, local: bairroLoja, building: 14, damaged: 0 });
    p.prestigio = clamp(p.prestigio + 4, 0, 100);
    adjustGlobalMorale(1.5);
    toast("Loja em construção por 14 dias.");
    render();
  },
  mapaBar() {
    if (!spendMapAction()) return;
    state.player.moral = clamp(state.player.moral + 2, 0, 100);
    adjustMemberMorale(.3);
    addHistory("Frequentou bar da torcida", 0);
    toast("Ação livre: bar frequentado. Moral melhorou.");
    render();
  },
  mapaInvestigar() {
    if (!spendMapAction()) return;
    const found = Math.random() < .45;
    if (found) {
      addMessage("Diretoria", "Encontramos movimentação estranha perto do bar. Pode ser olheiro rival.");
      state.player.policia = clamp(state.player.policia + 1, 0, 100);
    } else {
      addMessage("Diretoria", "Ronda feita. Nada suspeito hoje.");
    }
    addHistory("Investigação no mapa", 0);
    render();
  },
  mapaMercado() {
    if (!spendMapAction()) return;
    const gain = rand(300, 1300);
    registrarTransacao("Ação arriscada no comércio (saque)", gain, "Saque");
    state.player.policia = clamp(state.player.policia - 8, 0, 100);
    addNews(`POLÍCIA: comércio local registra ocorrência em ${state.player.cidade}`);
    toast(`Ação livre rendeu ${BRL.format(gain)}, mas a polícia ficou mais atenta.`);
    render();
  },
  // ── Construir novas estruturas ──
  construirBar() {
    if (!spendAction()) return;
    const p = state.player;
    const max = p.buildings.sede >= 4 ? 2 : 1;
    if (p.buildings.bares.length >= max) { p.acoes += 1; toast("Limite de bares pra sua sede."); return; }
    const cost = 40000;
    if (p.saldo < cost) { p.acoes += 1; toast("Saldo insuficiente."); return; }
    const bairroBar = pickBairroForaDaZonaSede(p.buildings.bares.length + 3)?.nome || "Centro";
    registrarTransacao(`Construção de Bar em ${bairroBar}`, -cost, "Construcao");
    p.buildings.bares.push({ nome: `Bar ${p.buildings.bares.length + 1}`, nivel: 1, local: bairroBar, building: 14, damaged: 0 });
    toast("Bar em construção (14 dias).");
    render();
  },
  construirSubsedeCidade() {
    if (!spendAction()) return;
    const p = state.player;
    const max = p.buildings.sede >= 5 ? 3 : p.buildings.sede >= 4 ? 2 : p.buildings.sede >= 2 ? 1 : 0;
    if (p.buildings.subsedesCidade.length >= max) { p.acoes += 1; toast("Limite atingido."); return; }
    const cost = 100000;
    if (p.saldo < cost) { p.acoes += 1; toast("Saldo insuficiente."); return; }
    const bairroSub = pickBairroForaDaZonaSede(p.buildings.subsedesCidade.length + 11)?.nome || "Periferia";
    registrarTransacao(`Construção de Subsede em ${bairroSub}`, -cost, "Construcao");
    p.buildings.subsedesCidade.push({ nome: `Subsede ${p.buildings.subsedesCidade.length + 1}`, nivel: 1, local: bairroSub, building: 30, damaged: 0 });
    toast("Subsede em construção (30 dias).");
    render();
  },
  construirSubsedeFora() {
    if (!spendAction()) return;
    const p = state.player;
    const max = p.buildings.sede >= 5 ? 5 : p.buildings.sede >= 4 ? 3 : p.buildings.sede >= 3 ? 1 : 0;
    if (p.buildings.subsedesFora.length >= max) { p.acoes += 1; toast("Limite atingido."); return; }
    const cost = 200000;
    if (p.saldo < cost) { p.acoes += 1; toast("Saldo insuficiente."); return; }
    registrarTransacao("Construção de Subsede Fora", -cost, "Construcao");
    p.buildings.subsedesFora.push({ nome: `Subsede Fora ${p.buildings.subsedesFora.length + 1}`, nivel: 1, local: "Outra cidade", building: 30, damaged: 0 });
    toast("Subsede fora em construção (30 dias).");
    render();
  },
  construirFabrica() {
    if (!spendAction()) return;
    const p = state.player;
    if (p.buildings.sede < 5) { p.acoes += 1; toast("Requer Sede Nv.5."); return; }
    if (p.buildings.fabrica) { p.acoes += 1; toast("Fábrica já construída."); return; }
    const cost = 400000;
    if (p.saldo < cost) { p.acoes += 1; toast("Saldo insuficiente."); return; }
    registrarTransacao("Construção de Fábrica de Materiais", -cost, "Construcao");
    p.buildings.fabrica = true;
    toast("Fábrica em construção (60 dias).");
    render();
  },
  // ── Upgrade de estruturas (custos por nível alvo, GDD §20) ──
  upgradeBar(idx) {
    const p = state.player;
    const bar = p.buildings.bares[idx];
    if (!bar) return;
    if (bar.nivel >= 3) { toast("Bar já está no nível máximo (3)."); return; }
    const next = bar.nivel + 1;
    const cost = [0, 40000, 80000, 150000][next] || 0;
    if (p.saldo < cost) { toast("Saldo insuficiente."); return; }
    registrarTransacao(`Upgrade Bar ${bar.local} para Nv.${next}`, -cost, "Construcao");
    bar.nivel = next;
    bar.building = 14; // dias de obra
    toast(`Bar em obra (Nv.${next}).`);
    render();
  },
  upgradeLoja(idx) {
    const p = state.player;
    const loja = p.buildings.lojas[idx];
    if (!loja) return;
    if (loja.nivel >= 3) { toast("Loja já está no nível máximo (3)."); return; }
    const next = loja.nivel + 1;
    const cost = [0, 50000, 100000, 150000][next] || 0;
    if (p.saldo < cost) { toast("Saldo insuficiente."); return; }
    registrarTransacao(`Upgrade Loja ${loja.local} para Nv.${next}`, -cost, "Construcao");
    loja.nivel = next;
    loja.building = 14;
    toast(`Loja em obra (Nv.${next}).`);
    render();
  },
  upgradeSubsedeCidade(idx) {
    const p = state.player;
    const sub = p.buildings.subsedesCidade[idx];
    if (!sub) return;
    if (sub.nivel >= 2) { toast("Subsede já está no nível máximo (2)."); return; }
    const cost = 200000;
    if (p.saldo < cost) { toast("Saldo insuficiente."); return; }
    registrarTransacao(`Upgrade Subsede ${sub.local} para Nv.2`, -cost, "Construcao");
    sub.nivel = 2;
    sub.building = 30;
    toast("Subsede em obra (Nv.2).");
    render();
  },
  upgradeSubsedeFora(idx) {
    const p = state.player;
    const sub = p.buildings.subsedesFora[idx];
    if (!sub) return;
    if (sub.nivel >= 2) { toast("Subsede já está no nível máximo (2)."); return; }
    const cost = 400000;
    if (p.saldo < cost) { toast("Saldo insuficiente."); return; }
    registrarTransacao(`Upgrade Subsede Fora ${sub.local} para Nv.2`, -cost, "Construcao");
    sub.nivel = 2;
    sub.building = 30;
    toast("Subsede fora em obra (Nv.2).");
    render();
  },
  // ── Investir no Time ──
  investirTime() {
    if (!spendAction()) return;
    const p = state.player;
    const playerTeam = teams.find(t => t.id === state.selectedTeam);
    if (!playerTeam) return;
    const forcaAtual = clamp((playerTeam.qualidade || 25) * 2, 1, 100);
    // Custo por faixa de força (GDD §19)
    const cost = forcaAtual <= 20 ? 100000
      : forcaAtual <= 30 ? 200000
      : forcaAtual <= 40 ? 300000
      : forcaAtual <= 50 ? 400000
      : forcaAtual <= 60 ? 500000
      : forcaAtual <= 70 ? 600000
      : forcaAtual <= 80 ? 700000
      : forcaAtual <= 90 ? 800000
      : 1000000;
    if (p.saldo < cost) { p.acoes += 1; toast("Saldo insuficiente."); return; }
    registrarTransacao(`Investimento no time (${playerTeam.nome}) — força ${forcaAtual}→${forcaAtual + 1}`, -cost, "Outro");
    // Aumenta qualidade em 0.5 (1 ponto na escala 1-100 = 0.5 na escala 1-50)
    playerTeam.qualidade = clamp((playerTeam.qualidade || 25) + 0.5, 1, 50);
    // Atualiza força no compState atual também
    const compLiga = state.compState?.[`serie${playerTeam.divisao}`];
    if (compLiga) {
      const clube = compLiga.clubes.find(c => c.id === playerTeam.timeId);
      if (clube) clube.forca = clamp(clube.forca + 1, 1, 100);
    }
    addNews(`SEU TIME: investimento de ${BRL.format(cost)} reforça o elenco`);
    toast(`Time reforçado. Nova força: ${forcaAtual + 1}.`);
    render();
  },
  // ── Festas ──
  festaPreJogo() {
    const p = state.player;
    const next = getPlayerProximoJogo();
    const playerTimeId = teams.find(t => t.id === state.selectedTeam)?.timeId;
    if (!next || next.home !== playerTimeId) {
      toast("Festa pré-jogo só vale se o próximo jogo for em casa.");
      return;
    }
    const cost = 3000;
    if (p.saldo < cost) { toast("Saldo insuficiente."); return; }
    registrarTransacao("Festa pré-jogo", -cost, "Festa");
    const retorno = rand(2000, 6000);
    registrarTransacao("Receita Festa pré-jogo", retorno, "Festa");
    p.moral = clamp(p.moral + 1, 0, 100);
    addNews(`SUA TORCIDA: festa pré-jogo lota a sede da ${p.nome}`);
    toast(`Festa rendeu ${BRL.format(retorno)}. Moral +1.`);
    render();
  },
  festaAniversario() {
    const p = state.player;
    const playerTeam = teams.find(t => t.id === state.selectedTeam);
    if (!playerTeam?.dataFundacao) {
      toast("Data de fundação da torcida desconhecida.");
      return;
    }
    // dataFundacao formato: "DD/MM/YYYY"
    const [diaF, mesF] = playerTeam.dataFundacao.split("/").map(Number);
    const hoje = new Date(state.date + "T12:00:00");
    if (hoje.getDate() !== diaF || hoje.getMonth() + 1 !== mesF) {
      toast(`Aniversário só pode ser comemorado em ${String(diaF).padStart(2,"0")}/${String(mesF).padStart(2,"0")}.`);
      return;
    }
    const cost = 20000;
    if (p.saldo < cost) { toast("Saldo insuficiente."); return; }
    registrarTransacao(`Festa de Aniversário da ${p.nome}`, -cost, "Festa");
    const retorno = rand(15000, 40000);
    registrarTransacao(`Receita Aniversário da ${p.nome}`, retorno, "Festa");
    p.moral = clamp(p.moral + 2, 0, 100);
    p.prestigio = clamp(p.prestigio + 3, 0, 100);
    addNews(`SUA TORCIDA: ${p.nome} comemora aniversário com megafesta`);
    toast(`Festão rendeu ${BRL.format(retorno)}. Moral +2 · Prestígio +3.`);
    render();
  },
  pagode() {
    const p = state.player;
    const hoje = new Date(state.date + "T12:00:00");
    if (hoje.getDay() < 2 || hoje.getDay() > 4) {
      toast("Pagode rola só no meio da semana (terça, quarta ou quinta).");
      return;
    }
    const cost = 5000;
    if (p.saldo < cost) { toast("Saldo insuficiente."); return; }
    registrarTransacao("Pagode na sede", -cost, "Festa");
    const retorno = rand(4000, 8000);
    registrarTransacao("Receita Pagode", retorno, "Festa");
    p.moral = clamp(p.moral + 1, 0, 100);
    addNews(`SUA TORCIDA: pagode na sede da ${p.nome} junta torcedores`);
    toast(`Pagode rendeu ${BRL.format(retorno)}. Moral +1.`);
    render();
  }
};

function receiveVisitor(visitor) {
  const days = 2;
  const cost = visitor.travelers * 20 * days;
  registrarTransacao(`Recepção a ${visitor.torcida} (${visitor.travelers} aliados, ${days} dias)`, -cost, "RecepcaoAliado");
  visitor.protected = true;
  const ally = state.ai.find(ai => ai.nome === visitor.torcida);
  if (ally) ally.relacao = clamp(ally.relacao + 5, -100, 100);
  state.player.prestigio = clamp(state.player.prestigio + 2, 0, 100);
  addMessage(visitor.torcida, "Valeu pela recepção, irmão. Quando forem na nossa área, vai ser do mesmo jeito.");
  toast(`Aliado recebido. Custo: ${BRL.format(cost)}.`);
}

function resolveVisitorAttack(visitor) {
  resolveConfront("ataque a visitante", visitor);
}

function resolveConfront(context = "confronto", forcedRival = null) {
  const p = state.player;
  const rival = forcedRival || state.ai.find(ai => ai.nome === p.rival) || state.ai[0];
  const weaponsBonus = Math.min(25, p.weapons.rojao * 1.2 + p.weapons.bomba * 3);
  const playerPower = p.linhaDeFrente
    .filter(m => m.ferido <= 0 && m.preso <= 0 && moraleState(m.moral).canAct)
    .reduce((sum, m) => sum + (m.forca * moraleState(m.moral).force) + m.defesa * .35, 0) + p.prestigio + weaponsBonus + rand(-25, 25);
  const rivalLF = forcedRival?.lf || Math.round((rival.membros || rival.travelers || 80) * .15);
  const rivalPower = rivalLF * 10 + (rival.prestigio || 40) + rand(-20, 25);
  const won = playerPower >= rivalPower;
  const injuries = applyInjuries(rand(0, won ? 2 : 5), context);

  p.weapons.rojao = Math.max(0, p.weapons.rojao - rand(0, 2));
  p.weapons.bomba = Math.max(0, p.weapons.bomba - rand(0, 1));
  p.policia = clamp(p.policia - (context.includes("visitante") ? 8 : 5), 0, 100);

  p.linhaDeFrente.forEach(m => {
    if (m.ferido <= 0 && m.preso <= 0) m.combates += 1;
    if (won && m.ferido <= 0 && m.preso <= 0) m.vitorias += 1;
  });

  if (won) {
    const saque = rand(500, context.includes("visitante") ? 2500 : 5000);
    registrarTransacao(`Saque em ${context} contra ${rival.nome || rival.torcida}`, saque, "Saque");
    p.prestigio = clamp(p.prestigio + 5, 0, 100);
    p.moral = clamp(p.moral + 3, 0, 100);
    adjustMemberMorale(.8);
    if (rival.relacao !== undefined) rival.relacao = clamp(rival.relacao - 6, -100, 100);
    addHistory(`Vitória em ${context} contra ${rival.nome || rival.torcida}`, saque);
    addMessage(rival.nome || rival.torcida, "A resposta vai vir no nosso tempo.");
    addNews(`CONFRONTO: ${p.nome} leva vantagem em ${context}`);
    addHall(`Maior saque recente: ${BRL.format(saque)} em ${context}`);
    toast(`Vitória no confronto. Saque: ${BRL.format(saque)}. Feridos: ${injuries}.`);
  } else {
    p.prestigio = clamp(p.prestigio - 5, 0, 100);
    p.moral = clamp(p.moral - 6, 0, 100);
    adjustMemberMorale(-.9);
    addHistory(`Derrota em ${context} contra ${rival.nome || rival.torcida}`, 0);
    addMessage(rival.nome || rival.torcida, "Vocês recuaram. A cidade viu.");
    addNews(`CONFRONTO: ${p.nome} recua em ${context}`);
    toast(`Derrota no confronto. Feridos: ${injuries}.`);
  }
}

function applyInjuries(count, reason) {
  const diff = getDifficulty();
  const candidates = state.player.linhaDeFrente.filter(m => m.ferido <= 0 && m.preso <= 0);
  const finalCount = Math.min(candidates.length, Math.max(0, Math.round(count * diff.dano)));
  candidates.slice(0, finalCount).forEach(m => {
    m.ferido = 30;
    m.hp = 0;
    m.moral = clamp(m.moral - .5, 0, 20);
  });
  if (finalCount) addHistory(`${finalCount} feridos em ${reason}`, 0, "baixa");
  return finalCount;
}

function adjustMemberMorale(delta) {
  state.player.linhaDeFrente.forEach(m => {
    if (m.ferido <= 0 && m.preso <= 0) m.moral = clamp(+(m.moral + delta).toFixed(1), 0, 20);
  });
}

function adjustGlobalMorale(delta) {
  state.player.moral = clamp(state.player.moral + delta * 2, 0, 100);
  adjustMemberMorale(delta);
}

function handleUrgentResponse(msg, index) {
  const choice = msg.actions[index];
  msg.answered = true;
  msg.read = true;
  msg.choice = choice;
  const payload = msg.payload || {};

  if (payload.type === "defense") {
    if (choice === "Enviar Reforços") {
      resolveConfront(`defesa do ${payload.target}`, state.ai.find(ai => ai.nome === payload.rival));
    } else if (choice === "Ignorar") {
      const loss = rand(1200, 4500);
      registrarTransacao(`Prejuízo: ataque ignorado no ${payload.target}`, -loss, "Outro");
      state.player.moral = clamp(state.player.moral - 4, 0, 100);
      addNews(`CONFRONTO: ${payload.target} da ${state.player.nome} sofre prejuízo`);
    } else {
      addHistory(`Revide planejado contra ${payload.rival}`, 0);
      addMessage("Diretoria", "Revide marcado na agenda. Use Planejar Confronto quando quiser executar.");
    }
  }

  if (payload.type === "travelPlan") {
    if (choice === "Viajar com Grupo Menor") {
      state.player.moral = clamp(state.player.moral - 2, 0, 100);
      addHistory("Caravana reduzida definida", 0);
    }
    if (choice === "Economizar e Não Viajar") {
      state.player.prestigio = clamp(state.player.prestigio - 6, 0, 100);
      state.player.moral = clamp(state.player.moral - 5, 0, 100);
      addNews(`SUA TORCIDA: ${state.player.nome} não organizou caravana fora de casa`);
    }
  }

  if (payload.type === "ambush") {
    if (choice === "Pedir Escolta Aliada") {
      const ally = state.ai.find(ai => ai.relacao > 50);
      if (ally) {
        ally.relacao = clamp(ally.relacao + 4, -100, 100);
        addMessage(ally.nome, "Fechou. A gente ajuda na passagem.");
      } else {
        addMessage("Assessor", "Sem aliado forte nessa rota para escoltar agora.");
      }
    }
  }

  addHistory(`Resposta WhatsApp: ${choice}`, 0);
  render();
}

function checkAchievements() {
  const p = state.player;
  if (p.buildings.sede >= 5) unlockAchievement("sede5", "Sede Máxima");
  if (p.buildings.fabrica) unlockAchievement("fabrica", "Industrialista");
  if (state.ai.every(ai => totalMembers() > ai.membros)) unlockAchievement("maior", "Maior Torcida");
  if (p.prestigio >= 90) unlockAchievement("prestigio", "Topo Moral");
}

function render() {
  const d = new Date(state.date + "T12:00:00");
  // --accent stays fixed to brand red. Torcida color used only on flag/badge.
  document.documentElement.style.setProperty("--team-color", state.player.cor);

  // Rail date
  const dayShort = `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
  const weekdayMap = ["DOMINGO","SEGUNDA","TERÇA","QUARTA","QUINTA","SEXTA","SÁBADO"];
  if (els.railDateDay) els.railDateDay.textContent = dayShort;
  if (els.railDateWeekday) els.railDateWeekday.textContent = weekdayMap[d.getDay()];

  // Top header
  const playerTeam = teams.find(t => t.id === state.selectedTeam);
  if (els.thTorcida) els.thTorcida.textContent = (state.player.nome || "").toUpperCase();
  if (els.thCity) els.thCity.textContent = `${(state.player.cidade || "").toUpperCase()}${playerTeam?.estado ? " - " + playerTeam.estado : ""}`;
  if (els.thSaldo) {
    els.thSaldo.textContent = BRL.format(state.player.saldo);
    els.thSaldo.style.color = state.player.saldo < 0 ? "var(--bad)" : "#fff";
  }
  if (els.thMembros) els.thMembros.textContent = totalMembers().toLocaleString("pt-BR");
  if (els.thPrestigio) els.thPrestigio.textContent = Math.round(state.player.prestigio);
  if (els.thFlag && playerTeam) {
    const c1 = playerTeam.corCamisa || playerTeam.cor || "#a51f1c";
    const c2 = playerTeam.corCalcao || "#0a0a0a";
    const c3 = playerTeam.corDetalhe || "#0a0a0a";
    els.thFlag.innerHTML = `
      <span class="th-flag-stripe" style="top:0; background:${c1}"></span>
      <span class="th-flag-stripe" style="top:33.3%; background:${c3}"></span>
      <span class="th-flag-stripe" style="top:66.6%; background:${c2}"></span>
      <span class="th-flag-text">${initials(state.player.nome)}</span>
    `;
  }

  els.unreadBadge.textContent = state.messages.filter(m => !m.read).length;
  els.advanceDay.textContent = state.travel ? "AVANÇAR VIAGEM" : "AVANÇAR DIA";
  renderHome();
  renderTorcida();
  renderCalendario();
  renderFinanceiro();
  renderMapa();
  renderCompeticoes();
  renderDiplomacia();
  renderMessages();
  renderTicker();
  renderWhatsAppPanel();
  renderNoticiasPanel();
  renderConquistasPanel();
}

function renderWhatsAppPanel() {
  const panel = document.querySelector("#whatsapp");
  if (!panel) return;
  panel.innerHTML = `
    <div class="grid">
      <article class="card span-12">
        <h2>WhatsApp da Diretoria</h2>
        <div id="whatsPanelMessages" class="messages">${state.messages.map(m => `
          <article class="message ${m.urgency === "urgent" ? "urgent" : ""}">
            <strong>${m.from}</strong><small>Dia ${m.day}</small>
            <p>${m.text}</p>
            ${m.actions?.length && !m.answered ? `<div class="message-actions">${m.actions.map((a, i) => `<button data-message="${m.id}" data-answer="${i}">${a}</button>`).join("")}</div>` : m.choice ? `<small>Resposta: ${m.choice}</small>` : ""}
          </article>`).join("") || "<p class='muted'>Sem mensagens ainda.</p>"}
        </div>
      </article>
    </div>`;
}

function renderNoticiasPanel() {
  const panel = document.querySelector("#noticias");
  if (!panel) return;
  panel.innerHTML = `
    <div class="grid">
      <article class="card span-12">
        <h2>Central de Notícias</h2>
        <div class="news-list">
          ${state.news.map((n, i) => {
            const d = new Date(state.date + "T12:00:00");
            d.setDate(d.getDate() - i);
            const dt = `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
            return `<div class="news-item"><span class="news-date">${dt}</span><span class="news-text">${n}</span></div>`;
          }).join("") || "<p class='muted'>Sem notícias ainda.</p>"}
        </div>
      </article>
    </div>`;
}

function renderConquistasPanel() {
  const panel = document.querySelector("#conquistas");
  if (!panel) return;
  panel.innerHTML = `
    <div class="grid">
      <article class="card span-6">
        <h2>Conquistas</h2>
        <div class="pill-list">
          ${achievementPill("sede5", "Sede Máxima")}
          ${achievementPill("fabrica", "Industrialista")}
          ${achievementPill("maior", "Maior Torcida")}
          ${achievementPill("prestigio", "Topo Moral")}
        </div>
      </article>
      <article class="card span-6">
        <h2>Salão da Fama</h2>
        ${state.hall.length ? state.hall.map(h => `<div class="row"><strong>${h}</strong></div>`).join("") : "<p class='muted'>Grandes feitos ainda serão registrados aqui.</p>"}
      </article>
    </div>`;
}

function renderHome() {
  const p = state.player;
  const playerTeam = teams.find(t => t.id === state.selectedTeam);
  const monthly = estimateMonth();
  const receitas = Math.max(0, monthly + 2200);
  const despesas = Math.max(0, 2200 - Math.min(0, monthly));
  const saldoMes = receitas - despesas;

  // Próximo jogo do calendário real
  const next = getPlayerProximoJogo();
  const playerTimeId = playerTeam?.timeId;
  let homeTeam, awayTeam, isHomeMatch = true, matchDateStr = "—", stadium = "—", competicao = "—", faseLabel = "";
  if (next) {
    const lookup = id => {
      // Pode estar em qualquer série; usa team data global
      const t = teams.find(x => x.timeId === id);
      return {
        nome: t?.nome || id,
        cor: t?.cor || "#a51f1c",
        timeId: id,
        estadioId: t?.estadioId
      };
    };
    homeTeam = lookup(next.home);
    awayTeam = lookup(next.away);
    isHomeMatch = next.home === playerTimeId;
    const md = new Date(next.data);
    const dd = String(md.getDate()).padStart(2, "0");
    const mm = String(md.getMonth() + 1).padStart(2, "0");
    const hh = String(md.getHours()).padStart(2, "0");
    const mi = String(md.getMinutes()).padStart(2, "0");
    matchDateStr = `${dd}/${mm}/${md.getFullYear()} - ${hh}:${mi}`;
    stadium = (DATA.estadioById?.[homeTeam.estadioId]?.nome || homeTeam.nome).toUpperCase();
    competicao = next.competicao;
    faseLabel = next.faseLabel;
  } else {
    // Fallback: sem próximo jogo (entressafra ou time eliminado da Copa sem partidas restantes)
    homeTeam = { nome: p.time, cor: p.cor };
    awayTeam = { nome: "—", cor: "#2a2a2a" };
    competicao = `${["Série A","Série B","Série C","Série D"][(playerTeam?.divisao || 1) - 1]}`;
    faseLabel = "Sem jogo agendado";
  }

  // Helper: colored team badge for the match scoreboard
  const badge = (label, color) => `<div class="hg-badge" style="background:${color}">${initials(label)}</div>`;

  document.querySelector("#home").innerHTML = `
    <div class="hg-grid">
      <article class="hg-card hg-match">
        <header class="hg-card-head"><span class="hg-bar"></span><h2>PRÓXIMO JOGO</h2></header>
        <div class="hg-card-body">
          <small class="hg-comp">${competicao}${faseLabel ? " · " + faseLabel : ""}</small>
          <div class="hg-teams">
            <div class="hg-team">
              ${badge(homeTeam.nome, homeTeam.cor)}
              <strong>${homeTeam.nome.toUpperCase()}</strong>
            </div>
            <div class="hg-x">X</div>
            <div class="hg-team">
              ${badge(awayTeam.nome, awayTeam.cor)}
              <strong>${awayTeam.nome.toUpperCase()}</strong>
            </div>
          </div>
          <div class="hg-info">
            <div>${matchDateStr}</div>
            <small>${stadium}</small>
          </div>
        </div>
      </article>

      <article class="hg-card hg-fin">
        <header class="hg-card-head"><span class="hg-bar"></span><h2>RESUMO FINANCEIRO</h2></header>
        <div class="hg-card-body">
          <div class="hg-fin-row"><span>Receitas</span><b class="good">${BRL.format(receitas)}</b></div>
          <div class="hg-fin-row"><span>Despesas</span><b class="bad">-${BRL.format(despesas)}</b></div>
          <div class="hg-fin-row hg-fin-total"><span>Saldo</span><b class="${saldoMes >= 0 ? 'good' : 'bad'}">${BRL.format(saldoMes)}</b></div>
          <button class="hg-cta" data-tab-jump="financeiro">VER FINANÇAS</button>
        </div>
      </article>

      <article class="hg-card hg-news">
        <header class="hg-card-head"><span class="hg-bar"></span><h2>NOTÍCIAS</h2></header>
        <div class="hg-card-body">
          <div class="hg-news-list">
            ${state.news.slice(0, 4).map((n, i) => {
              const d = new Date(state.date + "T12:00:00");
              d.setDate(d.getDate() - i);
              const dt = `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
              const t = `${String(8 + (i*3) % 14).padStart(2,"0")}:${String((i*17) % 60).padStart(2,"0")}`;
              return `<div class="hg-news-row"><span class="hg-news-date">${dt}</span><span class="hg-news-text">${n}</span><span class="hg-news-time">${t}</span></div>`;
            }).join("") || "<p class='muted'>Sem notícias hoje.</p>"}
          </div>
          <button class="hg-cta" data-tab-jump="noticias">VER TODAS</button>
        </div>
      </article>

      <article class="hg-card hg-actions">
        <header class="hg-card-head"><span class="hg-bar"></span><h2>CALENDÁRIO DA TORCIDA</h2></header>
        <div class="hg-card-body">
          <ul class="hg-cal-list">
            ${getCalendarioResumo(7).map(d => `
              <li class="hg-cal-item hg-cal-${d.tipo} ${d.isToday ? "hg-cal-today" : ""}">
                <span class="hg-cal-date">
                  <b>${d.dia}/${d.mes}</b>
                  <small>${d.wd}${d.isToday ? " · HOJE" : ""}</small>
                </span>
                <span class="hg-cal-action">${d.label}</span>
              </li>
            `).join("")}
          </ul>
          <button class="hg-cta" data-tab-jump="calendario">VER CALENDÁRIO COMPLETO</button>
        </div>
      </article>
    </div>`;
}

function renderWeekPlanner() {
  const today = new Date(state.date + "T12:00:00");
  const plan = state.weekPlan || (state.weekPlan = {});
  const labels = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const wd = d.getDay();
    const isWeekend = wd === 0 || wd === 6;
    const dayCount = currentDay() + i;
    const isMatchDay = state.nextMatch && dayCount === state.nextMatch.day;
    days.push({ wd, label: labels[wd], date: d, isWeekend, isMatchDay });
  }

  const actionsCatalog = [
    { id: "treinar", label: "Treinar membros" },
    { id: "recrutar", label: "Recrutar" },
    { id: "social", label: "Ação social" },
    { id: "inteligencia", label: "Olheiros" },
    { id: "materiais", label: "Comprar materiais" },
    { id: "descanso", label: "Descanso coletivo" },
    { id: "ataque", label: "Planejar confronto" }
  ];

  return `
    <div class="week-planner">
      ${days.map(d => {
        const key = d.date.toISOString().slice(0,10);
        if (d.isWeekend || d.isMatchDay) {
          return `<div class="week-day match-day">
            <div class="week-day-name">
              <strong>${d.label.slice(0,3)}.</strong>
              <small>${String(d.date.getDate()).padStart(2,"0")}/${String(d.date.getMonth()+1).padStart(2,"0")}</small>
            </div>
            <span class="week-locked">${d.isMatchDay ? "DIA DE JOGO" : "Fim de semana"}</span>
          </div>`;
        }
        const planned = plan[key] || "";
        return `<div class="week-day">
          <div class="week-day-name">
            <strong>${d.label.slice(0,3)}.</strong>
            <small>${String(d.date.getDate()).padStart(2,"0")}/${String(d.date.getMonth()+1).padStart(2,"0")}</small>
          </div>
          <select data-week-day="${key}">
            <option value="">— planejar —</option>
            ${actionsCatalog.map(a => `<option value="${a.id}" ${planned === a.id ? "selected" : ""}>${a.label}</option>`).join("")}
          </select>
        </div>`;
      }).join("")}
    </div>
  `;
}

function advanceWeek() {
  if (state.travel) { toast("Em viagem. Use Avançar Dia."); return; }
  let safety = 7;
  while (safety-- > 0) {
    const d = new Date(state.date + "T12:00:00");
    const wd = d.getDay();
    if (wd === 6 || wd === 0) break;
    if (state.nextMatch && currentDay() >= state.nextMatch.day) break;
    const key = state.date;
    const plannedAction = (state.weekPlan || {})[key];
    if (plannedAction && actionHandlers[plannedAction] && state.player.acoes > 0) {
      actionHandlers[plannedAction]();
    }
    advanceDay();
  }
  toast("Avançou até o fim de semana.");
}

function statCard(label, value, hint, span) {
  return `<article class="card ${span}"><small>${label}</small><p class="stat">${value}</p><p class="muted">${hint}</p></article>`;
}

function miniStat(label, value, hint) {
  return `<div class="mini-stat"><small>${label}</small><strong>${value}</strong><span>${hint}</span></div>`;
}

function actionButton(id, title, hint) {
  return `<button class="action" data-action="${id}"><strong>${title}</strong><small>${hint}</small></button>`;
}

function sectionTabs(items, active = 0) {
  return `<div class="section-tabs">${items.map((item, index) => `<span class="${index === active ? "active" : ""}">${item}</span>`).join("")}</div>`;
}

function initials(text) {
  return String(text || "TO")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
}

function meter(label, value, max = 100) {
  const pct = clamp(Math.round((value / max) * 100), 0, 100);
  return `<div class="meter"><span>${label}</span><div class="meter-track"><span style="width:${pct}%"></span></div><b>${Math.round(value)}</b></div>`;
}

function achievementPill(id, label) {
  const ok = state.achievements.includes(id);
  return `<span class="pill ${ok ? "good-pill" : ""}">${ok ? "✓" : "○"} ${label}</span>`;
}

function estimateMonth() {
  const p = state.player;
  const memberRevenue = (p.novatos + p.componentes) * (p.buildings.fabrica ? 60 : 30)
    + (p.linhaDeFrente.length + p.diretoria - 1) * 100;
  const barRevenue = p.buildings.bares.reduce((sum, b) =>
    sum + (b.damaged || b.building ? 0 : Math.round(([0, 2250, 3250, 4500][b.nivel] || 0) * getMultiplicadorBairro(b.local))), 0);
  const shopRevenue = p.buildings.lojas.reduce((sum, l) =>
    sum + (l.damaged || l.building ? 0 : Math.round(([0, 2200, 4500, 6000][l.nivel] || 0) * getMultiplicadorBairro(l.local))), 0);
  const upkeep = [0, 200, 480, 960, 1800, 3000][p.buildings.sede]
    + p.buildings.bares.reduce((sum, b) => sum + [0, 800, 1600, 3000][b.nivel], 0)
    + p.buildings.lojas.reduce((sum, l) =>
        sum + [0, 1500, 2500, 4000][l.nivel] + [0, 500, 1200, 2500][l.nivel], 0);
  return Math.round(memberRevenue + barRevenue + shopRevenue - upkeep);
}

function renderPanelPlaceholder(panelId, title, hint) {
  const panel = document.querySelector("#" + panelId);
  if (!panel) return;
  panel.innerHTML = `
    <div class="hg-grid">
      <article class="hg-card" style="grid-column: span 12">
        <header class="hg-card-head"><span class="hg-bar"></span><h2>${title}</h2></header>
        <div class="hg-card-body hg-placeholder">
          <p class="muted">${hint}</p>
          <small class="muted">Em desenvolvimento — voltará em fase posterior do protótipo.</small>
        </div>
      </article>
    </div>`;
}

const FORMAL_NAMES = [
  "Marcelo G.", "Thiago N.", "Lucas F.", "Rafael S.", "Bruno C.",
  "Felipe T.", "Diego R.", "Matheus P.", "Carlos H.", "Antonio L.",
  "Roberto S.", "Paulo M.", "Pedro A.", "Ricardo V.", "Fernando B.",
  "Henrique C.", "Eduardo M.", "Gabriel R.", "Vinicius A.", "Leandro B."
];

const CARGO_DIRETORIA_TITULOS = [
  "Presidente", "Vice-Presidente", "Puxador", "Puxador",
  "Tesoureiro", "Secretário", "Diretor de Bateria",
  "Diretor Social", "Diretor de Logística", "Diretor de Comunicação",
  "Diretor de Patrimônio", "Diretor de Eventos", "Diretor Jurídico",
  "Diretor de Mídia", "Diretor de Caravanas"
];

// GDD 18 — Estados do membro
function estadoIcon(estado) {
  return ({ saudavel: "🟢", ferido: "🔴", preso: "⚫", doente: "🟡" }[estado] || "🟢");
}
function estadoLabel(estado) {
  return ({ saudavel: "Saudável", ferido: "Ferido", preso: "Preso", doente: "Doente" }[estado] || "Saudável");
}

// GDD 18 — Níveis de Moral
function moralBadge(value) {
  if (value <= 4)  return { icon: "🔴", label: "Revoltado",  cls: "bad",  bonus: -0.4, canAct: false };
  if (value <= 9)  return { icon: "🟡", label: "Desanimado", cls: "warn", bonus: -0.2, canAct: true  };
  if (value <= 14) return { icon: "🟢", label: "Firme",      cls: "good", bonus:  0.0, canAct: true  };
  return            { icon: "🔵", label: "Empolgado",        cls: "blue", bonus: +0.2, canAct: true  };
}

// GDD 18 — Caps de Força/Defesa por cargo e XP necessário pro próximo
const CARGO_CAPS = { novato: 8, componente: 12, linhaDeFrente: 18, diretoria: 20 };
const CARGO_XP_PROX = { novato: 40, componente: 100, linhaDeFrente: 300, diretoria: 0 };
const CARGO_LABEL = {
  novato: "Novato", componente: "Componente",
  linhaDeFrente: "Linha de Frente", diretoria: "Diretoria"
};
const CARGO_PROXIMO = {
  novato: "Componente", componente: "Linha de Frente",
  linhaDeFrente: "Diretoria", diretoria: "—"
};

// Geração determinística de membro a partir de índice (não-LF)
function generateMember(idx, cargo, p, namePool, funcaoOverride) {
  const cap = CARGO_CAPS[cargo];
  // Atributos com curva por cargo (pra mostrar progressão visual)
  const seed = (idx * 17 + 3) % 100;
  const fBase = cargo === "novato" ? 1 + (seed % cap)
    : cargo === "componente" ? 6 + (seed % (cap - 5))
    : cargo === "linhaDeFrente" ? 12 + (seed % 7)
    : 14 + (seed % 7);
  const dBase = cargo === "novato" ? 1 + ((seed * 3) % cap)
    : cargo === "componente" ? 6 + ((seed * 3) % (cap - 5))
    : cargo === "linhaDeFrente" ? 12 + ((seed * 3) % 7)
    : 14 + ((seed * 3) % 7);
  const xpRange = { novato: [0, 39], componente: [40, 99], linhaDeFrente: [100, 299], diretoria: [300, 600] };
  const [xpMin, xpMax] = xpRange[cargo];
  const xp = xpMin + ((idx * 23) % (xpMax - xpMin + 1));
  const moralBase = (p.moral / 100) * 20;
  const moralVar = ((idx * 13) % 7) - 3;
  const moral = +clamp(moralBase + moralVar, 0, 20).toFixed(1);
  let estado = "saudavel";
  if (cargo === "linhaDeFrente" && idx % 23 === 7)  estado = "ferido";
  else if (idx % 47 === 3)                          estado = "preso";
  else if (idx % 31 === 5)                          estado = "doente";
  // Aplica boost de treinos persistente (Diretoria/Componente/Novato — não-LF)
  const boostKey = `${cargo}|${idx}`;
  const boost = state?.player?.treinosBoost?.[boostKey] || { forca: 0, defesa: 0, xp: 0 };
  return {
    nome: namePool[idx % namePool.length],
    cargo,
    funcao: funcaoOverride || CARGO_LABEL[cargo],
    forca: clamp(fBase + boost.forca, 1, cap),
    forcaMax: cap,
    defesa: clamp(dBase + boost.defesa, 1, cap),
    defesaMax: cap,
    xp: xp + boost.xp,
    xpProx: CARGO_XP_PROX[cargo],
    proxCargo: CARGO_PROXIMO[cargo],
    moral,
    idade: 16 + (idx * 7) % 20,
    timeCoracao: state?.player?.time || "",
    bairro: getBairroNomeDaCidade(idx),
    estado,
    hp: estado === "ferido" ? 0 : 150,
    combates: cargo === "linhaDeFrente" ? (idx * 3) % 30 : cargo === "diretoria" ? (idx * 5) % 80 : 0,
    vitorias: cargo === "linhaDeFrente" ? (idx * 2) % 20 : cargo === "diretoria" ? (idx * 3) % 50 : 0,
    cargoIdx: idx,
    boostKey
  };
}

function buildAllMembers(p) {
  const list = [];

  // DIRETORIA — primeiro promovidos (com identidade preservada), depois procedurais
  const dirNomeados = p.diretoriaNomeados || [];
  dirNomeados.forEach((nm, i) => {
    list.push(membroNomeado(nm, "diretoria", i, CARGO_DIRETORIA_TITULOS[i + dirNomeados.length] || "Diretor"));
  });
  const dirProcCount = Math.max(0, (p.diretoria || 0) - dirNomeados.length);
  for (let i = 0; i < dirProcCount; i++) {
    // Usa offset diferente do banco pra Diretoria (espalha para evitar repetir nomes de outros cargos)
    const dirIdx = i * 23 + 41;
    const m = generateMember(dirIdx, "diretoria", p, BANCO_NOMES, CARGO_DIRETORIA_TITULOS[i] || "Diretor");
    m.treinoKey = `diretoria|${i}`;
    list.push(m);
  }

  // LINHA DE FRENTE — real members from state when present, else generated
  (p.linhaDeFrente || []).forEach((m, i) => {
    const cap = CARGO_CAPS.linhaDeFrente;
    const moralRaw = Number.isFinite(m.moral) ? m.moral : 12;
    const estado = m.ferido > 0 ? "ferido" : m.preso > 0 ? "preso" : (m.doente > 0 ? "doente" : "saudavel");
    list.push({
      nome: m.nome,
      cargo: "linhaDeFrente",
      funcao: CARGO_LABEL.linhaDeFrente,
      forca: clamp(m.forca || 12, 1, cap),
      forcaMax: cap,
      defesa: clamp(m.defesa || 12, 1, cap),
      defesaMax: cap,
      xp: m.xp || 110,
      xpProx: CARGO_XP_PROX.linhaDeFrente,
      proxCargo: CARGO_PROXIMO.linhaDeFrente,
      moral: moralRaw,
      idade: m.idade || (16 + (i * 7) % 20),
      timeCoracao: state?.player?.time || "",
      bairro: m.bairro || BAIRROS_GENERICOS[i % BAIRROS_GENERICOS.length],
      estado,
      hp: m.hp ?? 150,
      combates: m.combates || 0,
      vitorias: m.vitorias || 0,
      isReal: true,
      memberRef: m,
      lfIdx: i,
      treinoKey: `lf|${i}`
    });
  });

  // COMPONENTES — primeiro promovidos, depois procedurais
  const compNomeados = p.componentesNomeados || [];
  compNomeados.forEach((nm, i) => {
    list.push(membroNomeado(nm, "componente", i));
  });
  const compProcCount = Math.max(0, (p.componentes || 0) - compNomeados.length);
  for (let i = 0; i < compProcCount; i++) {
    const genIdx = i * 13 + 7;
    const m = generateMember(genIdx, "componente", p, BANCO_NOMES);
    m.treinoKey = `componente|${genIdx}`;
    list.push(m);
  }

  // NOVATOS — primeiro recrutados (com identidade preservada), depois procedurais
  const novNomeados = p.novatosNomeados || [];
  novNomeados.forEach((nm, i) => {
    list.push(membroNomeado(nm, "novato", i));
  });
  const novProcCount = Math.max(0, (p.novatos || 0) - novNomeados.length);
  for (let i = 0; i < novProcCount; i++) {
    const genIdx = i * 17 + 23;
    const m = generateMember(genIdx, "novato", p, BANCO_NOMES);
    m.treinoKey = `novato|${genIdx}`;
    list.push(m);
  }

  return list;
}

// Converte um registro de membro nomeado (promovido) em entrada do roster
function membroNomeado(nm, cargo, idx, funcaoOverride) {
  const cap = CARGO_CAPS[cargo];
  const estado = nm.estado || "saudavel";
  return {
    nome: nm.nome,
    cargo,
    funcao: funcaoOverride || CARGO_LABEL[cargo],
    forca: clamp(+nm.forca || 1, 1, cap),
    forcaMax: cap,
    defesa: clamp(+nm.defesa || 1, 1, cap),
    defesaMax: cap,
    xp: nm.xp || 0,
    xpProx: CARGO_XP_PROX[cargo],
    proxCargo: CARGO_PROXIMO[cargo],
    moral: Number.isFinite(nm.moral) ? nm.moral : 12,
    idade: nm.idade || 18,
    timeCoracao: nm.timeCoracao || state?.player?.time || "",
    bairro: nm.bairro || BAIRROS_GENERICOS[idx % BAIRROS_GENERICOS.length],
    estado,
    hp: nm.hp ?? 150,
    combates: nm.combates || 0,
    vitorias: nm.vitorias || 0,
    isNomeado: true,
    nomeadoRef: nm,
    nomeadoIdx: idx,
    treinoKey: cargo === "diretoria" ? `diretoria_n|${idx}`
             : cargo === "componente" ? `componente_n|${idx}`
             : cargo === "novato" ? `novato_n|${idx}`
             : `${cargo}_n|${idx}`
  };
}

// Barra de força/defesa: cheia = forca/cap
function torBarCapped(value, max) {
  const pct = clamp((value / max) * 100, 0, 100);
  const cls = pct >= 80 ? "good" : pct >= 50 ? "warn" : "bad";
  return `<span class="tor-bar"><span class="${cls}" style="width:${pct}%"></span></span>`;
}

// Lealdade derivada: baseado em XP e combates/vitórias
function computeLealdade(m) {
  const xpPct = m.xpProx ? clamp(m.xp / m.xpProx, 0, 1) : 1;
  const combatBonus = m.combates ? Math.min(20, m.vitorias * 2) : 0;
  const baseByCargo = m.cargo === "diretoria" ? 85 : m.cargo === "linhaDeFrente" ? 70 : m.cargo === "componente" ? 60 : 50;
  return clamp(Math.round(baseByCargo + xpPct * 15 + combatBonus), 0, 100);
}

function renderTorcida() {
  const p = state.player;
  const filter = state.torcidaFilter || "todos";
  const subtab = state.torcidaSubtab || "membros";
  const roster = buildAllMembers(p);

  const counts = {
    todos: roster.length,
    diretoria: roster.filter(m => m.cargo === "diretoria").length,
    linhaDeFrente: roster.filter(m => m.cargo === "linhaDeFrente").length,
    componente: roster.filter(m => m.cargo === "componente").length,
    novato: roster.filter(m => m.cargo === "novato").length
  };

  const search = (state.torcidaSearch || "").toLowerCase().trim();
  let filtered = filter === "todos" ? roster : roster.filter(m => m.cargo === filter);
  if (search) {
    // Busca cobre nome, função/cargo, bairro e zona (Sul/Norte/Leste/Oeste)
    filtered = filtered.filter(m => {
      const haystack = [
        m.nome,
        m.funcao,
        CARGO_LABEL[m.cargo],
        m.bairro
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(search);
    });
  }
  // Ordenação:
  //  - sem sort ativo → padrão (cargo + força desc)
  //  - sort ativo → valor ABSOLUTO da coluna (sem normalização pelo cap),
  //    desempate por nome para estabilidade. Cargo NÃO entra como desempate
  //    para o usuário ver realmente o ranking puro da métrica.
  const cargoOrder = { diretoria: 0, linhaDeFrente: 1, componente: 2, novato: 3 };
  const sortKey = state.torcidaSort || null;
  const sortDir = state.torcidaSortDir === "asc" ? "asc" : "desc";
  const sortFns = {
    forca: m => +m.forca || 0,
    moral: m => +m.moral || 0,
    xp:    m => +m.xp || 0
  };
  filtered = filtered.slice().sort((a, b) => {
    if (sortKey && sortFns[sortKey]) {
      const va = sortFns[sortKey](a), vb = sortFns[sortKey](b);
      if (va !== vb) return sortDir === "asc" ? va - vb : vb - va;
      return a.nome.localeCompare(b.nome);
    }
    const oa = cargoOrder[a.cargo], ob = cargoOrder[b.cargo];
    if (oa !== ob) return oa - ob;
    return (b.forca / b.forcaMax) - (a.forca / a.forcaMax);
  }).slice(0, 80);

  // cache pra abrir ficha — index da linha = index dessa lista
  state._rosterCache = filtered;

  const filterRow = (id, label) => `
    <div class="tor-filter ${filter === id ? "active" : ""}" data-tor-filter="${id}">
      <strong>${label}</strong>
      <span>${counts[id]}</span>
    </div>`;
  const subRow = (id, label) => `
    <button class="tor-tab ${subtab === id ? "active" : ""}" data-tor-subtab="${id}">${label}</button>`;

  const filaTreino = (state.player.treinoFila || []).length;
  const capTreino = [0,2,4,8,12,20][state.player.buildings.sede];

  let body = "";
  if (subtab === "membros") {
    body = `
      <div class="tor-search-bar">
        <div class="tor-search-wrap">
          <input id="torSearchInput" type="search" placeholder="Pesquisar por nome, função, bairro ou zona…" value="${state.torcidaSearch || ""}" autocomplete="off" spellcheck="false">
        </div>
        <div class="tor-search-meta">
          <span><b>${filtered.length}</b> ${filtered.length === 1 ? "membro" : "membros"}${search ? ` · "${search}"` : ""}</span>
          <span class="pill-fila">FILA DE TREINO ${filaTreino}/${capTreino}</span>
        </div>
      </div>
      <div class="tor-body">
        <aside class="tor-side">
          ${filterRow("todos", "TODOS")}
          ${filterRow("diretoria", "DIRETORIA")}
          ${filterRow("linhaDeFrente", "LINHA DE FRENTE")}
          ${filterRow("componente", "COMPONENTES")}
          ${filterRow("novato", "NOVATOS")}
        </aside>
        <div class="tor-table">
          <div class="tor-row tor-head">
            <div>MEMBRO</div>
            <div>FUNÇÃO</div>
            ${["forca", "FORÇA", "moral", "MORAL", "xp", "XP"].reduce((acc, _, idx, arr) => {
              if (idx % 2) return acc;
              const k = arr[idx], label = arr[idx + 1];
              const ativo = sortKey === k;
              const arrow = ativo ? (sortDir === "asc" ? " ▲" : " ▼") : "";
              acc += `<div class="tor-sort ${ativo ? "active" : ""}" data-tor-sort="${k}" title="Clique p/ ordenar (▼ maior→menor, ▲ menor→maior)">${label}${arrow}</div>`;
              return acc;
            }, "")}
          </div>
          <div class="tor-rows-scroll">
            ${filtered.length ? filtered.map((m, i) => {
              const mb = moralBadge(m.moral);
              const estIcon = estadoIcon(m.estado);
              const xpAtual = m.xp || 0;
              const xpProx = m.xpProx || null;
              const xpPct = xpProx ? clamp((xpAtual / xpProx) * 100, 0, 100) : 100;
              const xpLabel = xpProx ? `${xpAtual}/${xpProx}` : `${xpAtual}`;
              return `<div class="tor-row" data-tor-row="${i}">
                <div class="tor-name"><span class="tor-state" title="${estadoLabel(m.estado)}">${estIcon}</span>${m.nome}</div>
                <div class="tor-func">${m.funcao}</div>
                <div class="tor-cell"><b>${(+m.forca).toFixed(1)}/${m.forcaMax}</b>${torBarCapped(m.forca, m.forcaMax)}</div>
                <div class="tor-cell tor-moral"><b class="${mb.cls}">${mb.icon} ${m.moral.toFixed(1)}</b><span class="${mb.cls}">${mb.label}</span></div>
                <div class="tor-cell"><b>${xpLabel}</b><span class="tor-bar"><span class="good" style="width:${xpPct}%"></span></span></div>
              </div>`;
            }).join("") : "<div class='tor-empty'>Nenhum membro nesta categoria.</div>"}
          </div>
        </div>
      </div>
      <div class="tor-actions">
        <button class="hg-cta" id="torVerPerfil">VER PERFIL</button>
        <button class="hg-cta" id="torAcoes">AÇÕES</button>
      </div>`;
  } else if (subtab === "treinamentos") {
    body = renderTorcidaTreinamentos();
  } else if (subtab === "recrutamento") {
    body = renderTorcidaRecrutamento();
  } else if (subtab === "hierarquia") {
    body = `<div class="tor-hier-body">
      ${["diretoria","linhaDeFrente","componente","novato"].map(c => {
        const cnt = counts[c];
        const cap = CARGO_CAPS[c];
        const xpProx = CARGO_XP_PROX[c];
        const mensalidade = c === "novato" ? FIN_MENSALIDADE_NOVATO
                          : c === "componente" ? FIN_MENSALIDADE_COMPONENTE
                          : FIN_MENSALIDADE_LF_DIR;
        return `<div class="tor-hier-card">
          <strong>${CARGO_LABEL[c]}</strong>
          <div class="tor-hier-stat"><span>Membros</span><b>${cnt}</b></div>
          <div class="tor-hier-stat"><span>Mensalidade</span><b>R$ ${mensalidade}/mês</b></div>
          <div class="tor-hier-stat"><span>Cap Força/Defesa</span><b>${cap}</b></div>
          <div class="tor-hier-stat"><span>Próximo cargo</span><b>${CARGO_PROXIMO[c]} (${xpProx} XP)</b></div>
        </div>`;
      }).join("")}
    </div>`;
  } else {
    body = `<div class="tor-body-empty"><p class="muted">Em desenvolvimento — voltará em fase posterior do protótipo.</p></div>`;
  }

  document.querySelector("#torcida").innerHTML = `
    <div class="hg-grid">
      <article class="hg-card" style="grid-column: span 12">
        <header class="hg-card-head">
          <span class="hg-bar"></span>
          <h2>TORCIDA - ${subtab.toUpperCase()}</h2>
        </header>
        <div class="tor-tabs">
          ${subRow("membros", "MEMBROS")}
          ${subRow("hierarquia", "HIERARQUIA")}
          ${subRow("treinamentos", "TREINAMENTOS")}
          ${subRow("recrutamento", "RECRUTAMENTO")}
        </div>
        ${body}
      </article>
    </div>`;
}

// ── Recrutamento subtab ─────────────────────────────────────────────────────
function renderTorcidaRecrutamento() {
  const p = state.player;
  const calc = calcularRecrutamentoPotencial();
  const rotina = state.calendario?.rotinaSemanal || {};
  const diasNomes = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const diasRecrutar = Object.entries(rotina)
    .filter(([_, acao]) => acao === "recrutar")
    .map(([d]) => parseInt(d))
    .sort();
  const semDias = diasRecrutar.length === 0;

  const historico = state.recrutamentos || [];
  const totalRecrutas = historico.reduce((s, r) => s + r.recrutas, 0);
  const totalCusto = historico.reduce((s, r) => s + r.custo, 0);

  const capTotal = [0, 50, 100, 150, 200, 500][p.buildings.sede];
  const ocup = totalMembers();
  const ocupPct = clamp((ocup / capTotal) * 100, 0, 100);
  const livre = Math.max(0, capTotal - ocup);
  // Estimativa efetiva: já considera limites diários e capacidade
  const estimativa = Math.max(0, Math.min(calc.aceitosBase, calc.capDiario, livre));
  const semanaEstim = estimativa * Math.max(1, diasRecrutar.length);

  return `<div class="recrut-body">
    <div class="recrut-summary">
      <div><span class="muted">Capacidade sede</span><b class="${livre <= 0 ? "bad" : ""}">${ocup}/${capTotal}</b><small class="muted">${livre} livre</small></div>
      <div><span class="muted">Cap diária</span><b class="warn">${calc.capDiario}</b><small class="muted">novatos/dia</small></div>
      <div><span class="muted">Atratividade</span><b class="${calc.atratividade >= 1.2 ? "good" : calc.atratividade >= 0.9 ? "" : "bad"}">${calc.atratividade.toFixed(2)}×</b><small class="muted">moral · prest · satisf</small></div>
      <div><span class="muted">Estimativa por dia</span><b class="good">~${estimativa}</b><small class="muted">após limites</small></div>
      <div><span class="muted">Total recrutados</span><b>${totalRecrutas}</b><small class="muted">${historico.length} sessões</small></div>
      <div><span class="muted">Gasto acumulado</span><b class="bad">${BRL.format(totalCusto)}</b><small class="muted">R$ 5/novato</small></div>
    </div>

    <div class="recrut-rotina ${semDias ? "warn" : ""}">
      <header>
        <strong>Dias agendados na rotina semanal</strong>
        <small class="muted">Recrutamento é processado automaticamente nos dias marcados como "Recrutar" na rotina.</small>
      </header>
      <div class="recrut-rotina-dias">
        ${diasNomes.map((nome, i) => `<span class="recrut-dia ${diasRecrutar.includes(i) ? "active" : ""}">${nome}</span>`).join("")}
      </div>
      ${semDias
        ? `<small class="bad">⚠ Nenhum dia marcado. Vá em Calendário → Rotina Semanal e selecione "Recrutar" em pelo menos um dia.</small>`
        : `<small class="muted">${diasRecrutar.length} dia(s) por semana · estimativa ~${semanaEstim} novatos/semana</small>`}
    </div>

    <div style="display:flex;justify-content:flex-end;gap:8px">
      <button class="hg-cta" id="recrutManualBtn" ${calc.espaco <= 0 || p.acoes <= 0 ? "disabled" : ""}>RECRUTAR HOJE (1 AÇÃO)</button>
    </div>

    <div class="recrut-list">
      <header><strong>Histórico</strong></header>
      ${historico.length === 0
        ? `<div class="tor-empty">Nenhum recrutamento ainda. Configure a rotina semanal ou clique em "Recrutar Hoje".</div>`
        : `<div class="recrut-table">
            <div class="recrut-row recrut-head">
              <div>DATA</div>
              <div>ORIGEM</div>
              <div>ABORDADOS</div>
              <div>ACEITOS</div>
              <div>ENTRARAM</div>
              <div>CUSTO</div>
            </div>
            ${historico.slice(0, 30).map(r => `
              <div class="recrut-row">
                <div>${r.data}</div>
                <div class="recrut-origem">${r.origem === "manual" ? "🎯 Manual" : "📅 Rotina"}</div>
                <div>${r.abordados}</div>
                <div>${r.aceitos}</div>
                <div class="${r.recrutas > 0 ? "good" : "muted"}"><b>${r.recrutas}</b>${r.recrutas >= r.capDiario && r.capDiario > 0 ? " (cap)" : ""}</div>
                <div class="${r.custo > 0 ? "bad" : "muted"}">${r.custo > 0 ? "-" + BRL.format(r.custo) : "—"}</div>
              </div>`).join("")}
          </div>`}
    </div>
  </div>`;
}

// ── Pool de elegíveis pra treino (todos os cargos) ─────────────────────────
function getTrainingPool() {
  const p = state.player;
  const eligible = [];

  // Linha de Frente (objetos reais)
  p.linhaDeFrente.forEach((m, i) => {
    if (m.ferido > 0 || m.preso > 0) return;
    eligible.push({
      key: `lf|${i}`,
      type: "lf",
      idx: i,
      cargo: "linhaDeFrente",
      cargoLabel: "Linha de Frente",
      nome: m.nome,
      forca: m.forca,
      defesa: m.defesa,
      forcaMax: 18,
      defesaMax: 18,
      ref: m
    });
  });

  // Diretoria nomeada (promovida) — mutar ref direto
  (p.diretoriaNomeados || []).forEach((nm, i) => {
    if ((nm.estado || "saudavel") !== "saudavel") return;
    eligible.push({
      key: `diretoria_n|${i}`,
      type: "nomeado",
      idx: i,
      cargo: "diretoria",
      cargoLabel: "Diretoria",
      nome: nm.nome,
      forca: +nm.forca || 1,
      defesa: +nm.defesa || 1,
      forcaMax: 20,
      defesaMax: 20,
      ref: nm
    });
  });
  // Diretoria procedural restante
  const dirProcCount = Math.max(0, (p.diretoria || 0) - (p.diretoriaNomeados?.length || 0));
  for (let i = 0; i < dirProcCount; i++) {
    // Usa offset diferente do banco pra Diretoria (espalha para evitar repetir nomes de outros cargos)
    const dirIdx = i * 23 + 41;
    const m = generateMember(dirIdx, "diretoria", p, BANCO_NOMES, CARGO_DIRETORIA_TITULOS[i] || "Diretor");
    if (m.estado !== "saudavel") continue;
    eligible.push({
      key: `diretoria|${i}`,
      type: "boost",
      idx: i,
      genIdx: i,
      cargo: "diretoria",
      cargoLabel: "Diretoria",
      nome: m.nome,
      forca: m.forca,
      defesa: m.defesa,
      forcaMax: 20,
      defesaMax: 20
    });
  }

  // Componentes nomeados (promovidos)
  (p.componentesNomeados || []).forEach((nm, i) => {
    if ((nm.estado || "saudavel") !== "saudavel") return;
    eligible.push({
      key: `componente_n|${i}`,
      type: "nomeado",
      idx: i,
      cargo: "componente",
      cargoLabel: "Componente",
      nome: nm.nome,
      forca: +nm.forca || 1,
      defesa: +nm.defesa || 1,
      forcaMax: 12,
      defesaMax: 12,
      ref: nm
    });
  });
  // Componentes procedurais restantes
  const compProcCount = Math.max(0, (p.componentes || 0) - (p.componentesNomeados?.length || 0));
  for (let i = 0; i < compProcCount; i++) {
    const genIdx = i * 13 + 7;
    const m = generateMember(genIdx, "componente", p, BANCO_NOMES);
    if (m.estado !== "saudavel") continue;
    eligible.push({
      key: `componente|${genIdx}`,
      type: "boost",
      idx: i,
      genIdx,
      cargo: "componente",
      cargoLabel: "Componente",
      nome: m.nome,
      forca: m.forca,
      defesa: m.defesa,
      forcaMax: 12,
      defesaMax: 12
    });
  }

  // Novatos nomeados (recrutados) — mutar ref direto
  (p.novatosNomeados || []).forEach((nm, i) => {
    if ((nm.estado || "saudavel") !== "saudavel") return;
    eligible.push({
      key: `novato_n|${i}`,
      type: "nomeado",
      idx: i,
      cargo: "novato",
      cargoLabel: "Novato",
      nome: nm.nome,
      forca: +nm.forca || 1,
      defesa: +nm.defesa || 1,
      forcaMax: 8,
      defesaMax: 8,
      ref: nm
    });
  });
  // Novatos procedurais restantes (preexistentes ao novo sistema de recrutamento)
  const novProcCount = Math.max(0, (p.novatos || 0) - (p.novatosNomeados?.length || 0));
  for (let i = 0; i < novProcCount; i++) {
    const genIdx = i * 17 + 23;
    const m = generateMember(genIdx, "novato", p, BANCO_NOMES);
    if (m.estado !== "saudavel") continue;
    eligible.push({
      key: `novato|${genIdx}`,
      type: "boost",
      idx: i,
      genIdx,
      cargo: "novato",
      cargoLabel: "Novato",
      nome: m.nome,
      forca: m.forca,
      defesa: m.defesa,
      forcaMax: 8,
      defesaMax: 8
    });
  }

  return eligible;
}

// ── Executor de treino (recebe lista de IDs pré-selecionados) ──────────────
function treinarExecutar(preselectedKeys = []) {
  const p = state.player;
  p.treinosBoost = p.treinosBoost || {};
  p.treinoFila = p.treinoFila || [];
  const cap = [0, 2, 4, 8, 12, 20][p.buildings.sede];
  const eligible = getTrainingPool();
  const eligibleByKey = Object.fromEntries(eligible.map(e => [e.key, e]));

  // 1) Combina fila persistente + pré-selecionados explícitos (até cap)
  const todasKeys = [...new Set([...(p.treinoFila || []), ...preselectedKeys])];
  const selected = [];
  todasKeys.forEach(k => {
    if (selected.length >= cap) return;
    if (eligibleByKey[k] && !selected.includes(eligibleByKey[k])) {
      selected.push(eligibleByKey[k]);
    }
  });

  // 2) Preenche o restante aleatoriamente entre os não-selecionados
  const restantes = eligible.filter(e => !selected.includes(e));
  for (let i = restantes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [restantes[i], restantes[j]] = [restantes[j], restantes[i]];
  }
  while (selected.length < cap && restantes.length) {
    selected.push(restantes.shift());
  }

  // 3) Aplica treino e registra
  const sessao = {
    data: state.date,
    capacidade: cap,
    escalados: selected.length,
    manualmente: preselectedKeys.filter(k => eligibleByKey[k]).length,
    membros: []
  };

  // Ganho aleatório entre 0.0 e 0.3 (1 casa decimal)
  const rollGanho = () => Math.round(Math.random() * 3) / 10;
  selected.forEach(t => {
    let fAntes, dAntes, fDepois, dDepois;
    if (t.type === "lf" || t.type === "nomeado") {
      const m = t.ref;
      fAntes = +m.forca;
      dAntes = +m.defesa;
      const ganhoF = (+m.forca) < t.forcaMax ? rollGanho() : 0;
      const ganhoD = (+m.defesa) < t.defesaMax ? rollGanho() : 0;
      m.forca = +Math.min(t.forcaMax, (+m.forca) + ganhoF).toFixed(1);
      m.defesa = +Math.min(t.defesaMax, (+m.defesa) + ganhoD).toFixed(1);
      m.xp = (m.xp || 0) + 1;
      m.moral = clamp(+((Number.isFinite(m.moral) ? m.moral : 12) + 0.2).toFixed(1), 0, 20);
      fDepois = m.forca;
      dDepois = m.defesa;
    } else {
      fAntes = +t.forca;
      dAntes = +t.defesa;
      const boostKey = `${t.cargo}|${t.genIdx}`;
      p.treinosBoost[boostKey] = p.treinosBoost[boostKey] || { forca: 0, defesa: 0, xp: 0 };
      const ganhoF = t.forca < t.forcaMax ? rollGanho() : 0;
      const ganhoD = t.defesa < t.defesaMax ? rollGanho() : 0;
      p.treinosBoost[boostKey].forca = +(p.treinosBoost[boostKey].forca + ganhoF).toFixed(1);
      p.treinosBoost[boostKey].defesa = +(p.treinosBoost[boostKey].defesa + ganhoD).toFixed(1);
      p.treinosBoost[boostKey].xp += 1;
      fDepois = +Math.min(t.forcaMax, fAntes + ganhoF).toFixed(1);
      dDepois = +Math.min(t.defesaMax, dAntes + ganhoD).toFixed(1);
    }
    sessao.membros.push({
      key: t.key,
      nome: t.nome,
      cargo: t.cargo,
      cargoLabel: t.cargoLabel,
      forcaAntes: fAntes,
      forcaDepois: fDepois,
      defesaAntes: dAntes,
      defesaDepois: dDepois,
      ganhoForca: fDepois - fAntes,
      ganhoDefesa: dDepois - dAntes
    });
  });

  state.treinos = state.treinos || [];
  state.treinos.unshift(sessao);
  if (state.treinos.length > 60) state.treinos.length = 60;

  p.moral = clamp(p.moral + 1, 0, 100);
  const evoluiram = sessao.membros.filter(x => x.ganhoForca || x.ganhoDefesa).length;
  toast(`Treino: ${selected.length}/${cap} (${sessao.manualmente} manuais) · ${evoluiram} evoluíram.`);
  render();
}

// ── Modal de seleção manual ─────────────────────────────────────────────────
function abrirModalTreino() {
  const dlg = document.querySelector("#trainDialog");
  if (!dlg) return;
  // Sempre recria como Set (sobrevive load de save que possa ter desserializado)
  state._trainSelected = new Set();
  // Pré-popula com a fila persistente do jogador (membros marcados via ficha)
  const fila = state.player.treinoFila || [];
  const eligibleKeys = new Set(getTrainingPool().map(e => e.key));
  fila.forEach(k => { if (eligibleKeys.has(k)) state._trainSelected.add(k); });
  preencherModalTreino();
  if (typeof dlg.showModal === "function") dlg.showModal();
  else dlg.setAttribute("open", "");
}

function preencherModalTreino() {
  const dlg = document.querySelector("#trainDialog");
  if (!dlg) return;
  const eligible = getTrainingPool();
  const cap = [0, 2, 4, 8, 12, 20][state.player.buildings.sede];
  const sel = state._trainSelected || new Set();
  const fila = new Set(state.player.treinoFila || []);

  // Agrupa por cargo
  const grupos = {
    linhaDeFrente: { label: "Linha de Frente", short: "LF", items: [] },
    diretoria: { label: "Diretoria", short: "DIR", items: [] },
    componente: { label: "Componentes", short: "COMP", items: [] },
    novato: { label: "Novatos", short: "NOV", items: [] }
  };
  eligible.forEach(e => grupos[e.cargo].items.push(e));

  const restante = Math.max(0, cap - sel.size);
  const fillPct = Math.min(100, (sel.size / cap) * 100);

  const renderItem = (e, gShort) => {
    const isSel = sel.has(e.key);
    const fromFila = fila.has(e.key);
    return `<label class="train-item ${isSel ? "selected" : ""} ${fromFila ? "from-fila" : ""}" data-cargo="${e.cargo}">
      <input type="checkbox" data-train-key="${e.key}" ${isSel ? "checked" : ""}>
      <div class="train-item-info">
        <span class="train-name">${e.nome}</span>
        <span class="train-stats"><b>F</b>${(+e.forca).toFixed(1)}<small>/${e.forcaMax}</small> · <b>D</b>${(+e.defesa).toFixed(1)}<small>/${e.defesaMax}</small></span>
      </div>
      ${fromFila ? `<span class="train-fila-tag" title="Adicionado pela ficha do membro">📌</span>` : ""}
    </label>`;
  };

  dlg.querySelector("#trainBody").innerHTML = `
    <div class="train-head">
      <div class="train-head-info">
        <strong>Selecionar para treinar</strong>
        <small>Capacidade da sede: <b>${cap}</b> · Selecionados: <b id="trainSelCount">${sel.size}</b>/${cap} · Vagas restantes preenchidas aleatoriamente</small>
        <div class="train-progress"><div class="train-progress-fill" style="width:${fillPct}%"></div></div>
      </div>
      <div class="train-head-actions">
        <button class="train-btn-secondary" id="trainClearAll" title="Limpar seleção">✕ LIMPAR</button>
        <button class="hg-cta" id="trainConfirm">INICIAR TREINO · ${sel.size}/${cap}</button>
      </div>
    </div>
    <div class="train-grid">
      ${Object.entries(grupos).filter(([_,g]) => g.items.length).map(([k, g]) => {
        const gSel = g.items.filter(e => sel.has(e.key)).length;
        return `
        <div class="train-group" data-group="${k}">
          <header class="train-group-head">
            <span class="train-group-tag train-group-tag-${k}">${g.short}</span>
            <h4>${g.label}</h4>
            <span class="train-group-count">${gSel > 0 ? `<b>${gSel}</b> · ` : ""}${g.items.length} membros</span>
          </header>
          <div class="train-items">
            ${g.items.map(it => renderItem(it, g.short)).join("")}
          </div>
        </div>
      `;}).join("")}
    </div>
  `;

  // Hook clear button
  const clearBtn = dlg.querySelector("#trainClearAll");
  if (clearBtn) clearBtn.onclick = () => { sel.clear(); preencherModalTreino(); };
}

function renderTorcidaTreinamentos() {
  const treinos = state.treinos || [];
  const cap = [0, 2, 4, 8, 12, 20][state.player.buildings.sede];
  // Estatísticas agregadas
  const totalSessoes = treinos.length;
  // Membros únicos: dedupe por key (fallback p/ saves antigos: cargo+nome)
  // Dedupe por nome (estável entre promoções) e nunca ultrapassa o tamanho do roster
  const membrosUnicos = new Set();
  let totalParticipacoes = 0;
  treinos.forEach(t => t.membros.forEach(m => {
    membrosUnicos.add((m.nome || "").trim().toLowerCase());
    totalParticipacoes++;
  }));
  const totalRosterAtual = (state.player.diretoria || 0) + (state.player.linhaDeFrente?.length || 0) + (state.player.componentes || 0) + (state.player.novatos || 0);
  const totalMembrosTreinados = Math.min(membrosUnicos.size, totalRosterAtual);
  const totalEvoluiu = treinos.reduce((s, t) => s + t.membros.filter(m => m.ganhoForca || m.ganhoDefesa).length, 0);
  const totalGanhoF = treinos.reduce((s, t) => s + t.membros.reduce((ss, m) => ss + m.ganhoForca, 0), 0);
  const totalGanhoD = treinos.reduce((s, t) => s + t.membros.reduce((ss, m) => ss + m.ganhoDefesa, 0), 0);

  return `<div class="treino-body">
    <div class="treino-summary">
      <div><span class="muted">Capacidade atual</span><b class="warn">${cap} membros/dia</b></div>
      <div><span class="muted">Sessões</span><b>${totalSessoes}</b></div>
      <div><span class="muted">Membros treinados</span><b>${totalMembrosTreinados}</b><small class="muted" style="font-size:10px;display:block;margin-top:2px">${totalParticipacoes} participações</small></div>
      <div><span class="muted">Evoluíram</span><b class="good">${totalEvoluiu}</b></div>
      <div><span class="muted">Ganho total Força</span><b class="good">+${(+totalGanhoF).toFixed(1)}</b></div>
      <div><span class="muted">Ganho total Defesa</span><b class="good">+${(+totalGanhoD).toFixed(1)}</b></div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px">
      <button class="hg-cta" id="torTreinarBtn">INICIAR NOVO TREINO (SELECIONAR)</button>
    </div>

    <div class="treino-list">
      ${treinos.length === 0 ? `<div class="tor-empty">
        Nenhum treino registrado ainda.<br>
        <small class="muted">Use a ação "Treinar membros" no calendário ou na rotina semanal.</small>
      </div>` : treinos.map(s => `
        <div class="treino-sessao">
          <header class="treino-sessao-head">
            <strong>${s.data}</strong>
            <small class="muted">${s.escalados}/${s.capacidade} vagas · ${s.membros.filter(m => m.ganhoForca || m.ganhoDefesa).length} evoluíram</small>
          </header>
          <div class="treino-sessao-tabela">
            <div class="treino-row treino-head">
              <div>MEMBRO</div>
              <div>CARGO</div>
              <div>FORÇA</div>
              <div>DEFESA</div>
              <div>GANHO</div>
            </div>
            ${s.membros.map(m => {
              const gF = +(+m.ganhoForca || 0).toFixed(1);
              const gD = +(+m.ganhoDefesa || 0).toFixed(1);
              const evoF = gF > 0;
              const evoD = gD > 0;
              const tagsGanho = [evoF ? `+${gF.toFixed(1)}F` : null, evoD ? `+${gD.toFixed(1)}D` : null].filter(Boolean).join(" · ");
              const fA = (+m.forcaAntes).toFixed(1), fD = (+m.forcaDepois).toFixed(1);
              const dA = (+m.defesaAntes).toFixed(1), dD = (+m.defesaDepois).toFixed(1);
              return `<div class="treino-row">
                <div class="treino-name">${m.nome}</div>
                <div class="treino-cargo">${m.cargoLabel || CARGO_LABEL[m.cargo] || "—"}</div>
                <div class="${evoF ? "good" : "muted"}">${fA} ${evoF ? "→" : "·"} <b>${fD}</b></div>
                <div class="${evoD ? "good" : "muted"}">${dA} ${evoD ? "→" : "·"} <b>${dD}</b></div>
                <div class="${(evoF || evoD) ? "good" : "muted"}">${tagsGanho || "—"}</div>
              </div>`;
            }).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  </div>`;
}

// Ficha do Membro (popup) — formato GDD seção 18
function openFichaMembro(m) {
  if (!m) return;
  const mb = moralBadge(m.moral);
  const xpPct = m.xpProx ? clamp((m.xp / m.xpProx) * 100, 0, 100) : 100;
  const isLF = m.cargo === "linhaDeFrente" || m.cargo === "diretoria";
  const tipoIcone = isLF ? "🥊" : "👤";

  const dlg = document.querySelector("#fichaDialog");
  if (!dlg) return;
  dlg.querySelector("#fichaBody").innerHTML = `
    <div class="ficha-head">
      <div class="ficha-icon">${tipoIcone}</div>
      <div>
        <strong>${m.nome.toUpperCase()}</strong>
        <small>${m.funcao}</small>
      </div>
    </div>
    <div class="ficha-grid">
      <div class="ficha-row"><span>HP</span><b>${m.hp}/150</b></div>
      <div class="ficha-row"><span>Idade</span><b>${m.idade} anos</b></div>
      <div class="ficha-row"><span>Time</span><b>${m.timeCoracao || "—"}</b></div>
      <div class="ficha-row"><span>Bairro</span><b>${m.bairro}</b></div>
      <div class="ficha-row"><span>Estado</span><b>${estadoIcon(m.estado)} ${estadoLabel(m.estado)}</b></div>
      <div class="ficha-row"><span>Moral</span><b class="${mb.cls}">${mb.icon} ${mb.label} (${m.moral.toFixed(1)})</b></div>
    </div>
    ${isLF ? `
      <div class="ficha-meter">
        <div class="ficha-meter-row">
          <span>Força</span>
          <div class="ficha-meter-bar">${torBarCapped(m.forca, m.forcaMax)}</div>
          <b>${(+m.forca).toFixed(1)}/${m.forcaMax}</b>
        </div>
        <div class="ficha-meter-row">
          <span>Defesa</span>
          <div class="ficha-meter-bar">${torBarCapped(m.defesa, m.defesaMax)}</div>
          <b>${(+m.defesa).toFixed(1)}/${m.defesaMax}</b>
        </div>
      </div>
    ` : ""}
    <div class="ficha-meter">
      <div class="ficha-meter-row">
        <span>XP</span>
        <div class="ficha-meter-bar"><span class="tor-bar"><span class="good" style="width:${xpPct}%"></span></span></div>
        <b>${m.xp}${m.xpProx ? "/" + m.xpProx : ""}</b>
      </div>
      ${m.xpProx ? `<small class="muted">Próximo cargo: ${m.proxCargo} (${m.xpProx} XP + Força ${m.forcaMax} + Defesa ${m.defesaMax}${m.cargo === "componente" ? " + R$ 1.000" : m.cargo === "linhaDeFrente" ? " + R$ 5.000" : ""})</small>` : `<small class="muted">Cargo máximo atingido.</small>`}
    </div>
    ${isLF && (m.combates || m.vitorias) ? `<div class="ficha-stats">Combates: ${m.combates} | Vitórias: ${m.vitorias}</div>` : ""}
    ${renderFichaActions(m)}
  `;
  if (typeof dlg.showModal === "function") dlg.showModal();
  else dlg.setAttribute("open", "");
}

function renderFichaActions(m) {
  const p = state.player;
  const fila = p.treinoFila || [];
  const naFila = m.treinoKey && fila.includes(m.treinoKey);
  const cap = [0,2,4,8,12,20][p.buildings.sede];
  const podeEntrarFila = m.estado === "saudavel" && fila.length < cap;

  // Promoção — requisitos por cargo (GDD §18)
  let podePromover = false, motivo = "", custoProm = 0, cargoProx = null;
  if (m.cargo === "novato") {
    cargoProx = "Componente"; custoProm = 0;
    const reqXp = 40, reqFD = 8;
    if (m.xp < reqXp) motivo = `Precisa ${reqXp} XP (tem ${m.xp})`;
    else if (m.forca < reqFD) motivo = `Precisa Força ${reqFD} (tem ${(+m.forca).toFixed(1)})`;
    else if (m.defesa < reqFD) motivo = `Precisa Defesa ${reqFD} (tem ${(+m.defesa).toFixed(1)})`;
    else podePromover = true;
  } else if (m.cargo === "componente") {
    cargoProx = "Linha de Frente"; custoProm = 1000;
    const reqXp = 100, reqFD = 12;
    if (m.xp < reqXp) motivo = `Precisa ${reqXp} XP (tem ${m.xp})`;
    else if (m.forca < reqFD) motivo = `Precisa Força ${reqFD} (tem ${(+m.forca).toFixed(1)})`;
    else if (m.defesa < reqFD) motivo = `Precisa Defesa ${reqFD} (tem ${(+m.defesa).toFixed(1)})`;
    else if (p.saldo < custoProm) motivo = `Precisa ${BRL.format(custoProm)}`;
    else podePromover = true;
  } else if (m.cargo === "linhaDeFrente") {
    cargoProx = "Diretoria"; custoProm = 5000;
    const reqXp = 300, reqFD = 18;
    if (m.xp < reqXp) motivo = `Precisa ${reqXp} XP (tem ${m.xp})`;
    else if (m.forca < reqFD) motivo = `Precisa Força ${reqFD} (tem ${(+m.forca).toFixed(1)})`;
    else if (m.defesa < reqFD) motivo = `Precisa Defesa ${reqFD} (tem ${(+m.defesa).toFixed(1)})`;
    else if (p.saldo < custoProm) motivo = `Precisa ${BRL.format(custoProm)}`;
    else podePromover = true;
  } else {
    motivo = "Cargo máximo (Diretoria)";
  }

  return `
    <div class="ficha-actions">
      <button class="hg-cta ${naFila ? "ficha-btn-active" : ""}" data-ficha-act="treinar" data-ficha-key="${m.treinoKey || ""}" ${podeEntrarFila || naFila ? "" : "disabled"}>
        ${naFila ? "✓ NA FILA DE TREINO" : "TREINAR (FILA)"}
      </button>
      <button class="hg-cta" data-ficha-act="promover" data-ficha-key="${m.treinoKey || ""}" ${podePromover ? "" : "disabled"} title="${cargoProx ? `→ ${cargoProx}` : ""}${motivo ? " · " + motivo : ""}">
        PROMOVER ${cargoProx ? "→ " + cargoProx.toUpperCase() : ""}${custoProm > 0 ? " · " + BRL.format(custoProm) : ""}
      </button>
    </div>
    ${motivo && !podePromover ? `<small class="muted" style="display:block;text-align:center;margin-top:6px">⚠ ${motivo}</small>` : ""}
  `;
}

function adicionarTreinoFila(treinoKey) {
  const p = state.player;
  p.treinoFila = p.treinoFila || [];
  const cap = [0,2,4,8,12,20][p.buildings.sede];
  if (p.treinoFila.includes(treinoKey)) {
    p.treinoFila = p.treinoFila.filter(k => k !== treinoKey);
    toast("Removido da fila de treino.");
  } else {
    if (p.treinoFila.length >= cap) {
      toast(`Fila cheia (${cap}/${cap}).`);
      return;
    }
    p.treinoFila.push(treinoKey);
    toast(`Adicionado à fila do próximo treino (${p.treinoFila.length}/${cap}).`);
  }
  saveSilent();
  // Reabre a ficha pra atualizar o botão
  const roster = state._rosterCache || [];
  const m = roster.find(x => x.treinoKey === treinoKey);
  if (m) openFichaMembro(m);
}

function promoverMembro(treinoKey) {
  const p = state.player;
  const roster = state._rosterCache || buildAllMembers(p);
  const m = roster.find(x => x.treinoKey === treinoKey);
  if (!m) return;

  // Snapshot dos atributos atuais para preservar identidade entre cargos
  const snapshot = {
    nome: m.nome,
    forca: +m.forca,
    defesa: +m.defesa,
    xp: m.xp || 0,
    moral: Number.isFinite(m.moral) ? m.moral : 12,
    idade: m.idade,
    bairro: m.bairro,
    timeCoracao: m.timeCoracao,
    estado: "saudavel",
    hp: 150,
    combates: m.combates || 0,
    vitorias: m.vitorias || 0
  };

  // Limpa fila de treino — chave antiga deixa de existir
  p.treinoFila = (p.treinoFila || []).filter(k => k !== treinoKey);

  if (m.cargo === "novato") {
    p.componentesNomeados = p.componentesNomeados || [];
    p.componentesNomeados.push({ ...snapshot, forca: clamp(snapshot.forca, 6, 12), defesa: clamp(snapshot.defesa, 6, 12) });
    // Remove dos nomeados (se for um recruta) — preserva integridade do array
    if (m.isNomeado && m.nomeadoIdx !== undefined) {
      p.novatosNomeados.splice(m.nomeadoIdx, 1);
    }
    p.novatos = Math.max(0, p.novatos - 1);
    p.componentes += 1;
    addNews(`SUA TORCIDA: ${m.nome} promovido a Componente`);
    toast(`${m.nome} virou Componente!`);
  } else if (m.cargo === "componente") {
    if (p.saldo < 1000) { toast("Saldo insuficiente."); return; }
    registrarTransacao(`Promoção de ${m.nome} a Linha de Frente`, -1000, "Outro");
    // Remove dos nomeados (se for) ou só decrementa contagem se procedural
    if (m.isNomeado && m.nomeadoIdx !== undefined) {
      p.componentesNomeados.splice(m.nomeadoIdx, 1);
    }
    p.componentes = Math.max(0, p.componentes - 1);
    p.linhaDeFrente.push({
      nome: snapshot.nome,
      hp: 150,
      forca: clamp(snapshot.forca, 12, 18),
      defesa: clamp(snapshot.defesa, 12, 18),
      xp: snapshot.xp,
      moral: snapshot.moral,
      idade: snapshot.idade,
      bairro: snapshot.bairro,
      ferido: 0, preso: 0, doente: 0,
      combates: snapshot.combates, vitorias: snapshot.vitorias
    });
    addNews(`SUA TORCIDA: ${m.nome} promovido a Linha de Frente`);
    toast(`${m.nome} virou Linha de Frente!`);
  } else if (m.cargo === "linhaDeFrente") {
    if (p.saldo < 5000) { toast("Saldo insuficiente."); return; }
    registrarTransacao(`Promoção de ${m.nome} a Diretoria`, -5000, "Outro");
    p.diretoriaNomeados = p.diretoriaNomeados || [];
    p.diretoriaNomeados.push({ ...snapshot, forca: clamp(snapshot.forca, 14, 20), defesa: clamp(snapshot.defesa, 14, 20) });
    if (m.lfIdx !== undefined) p.linhaDeFrente.splice(m.lfIdx, 1);
    p.diretoria += 1;
    addNews(`SUA TORCIDA: ${m.nome} promovido a Diretoria`);
    addMessage(m.nome, "Fala mano, agora sou da diretoria, tamo junto nessa fita.");
    toast(`${m.nome} virou Diretoria!`);
  } else {
    toast("Cargo máximo.");
    return;
  }
  document.querySelector("#fichaDialog")?.close?.();
  saveSilent();
  render();
}
function buildFinanceiroData(p) {
  const fab = p.buildings.fabrica;
  // RECEITAS
  const fabMult = fab ? 1.2 : 1;
  const mensalidades =
      p.novatos     * FIN_MENSALIDADE_NOVATO     * fabMult
    + p.componentes * FIN_MENSALIDADE_COMPONENTE * fabMult
    + (p.linhaDeFrente.length + Math.max(0, p.diretoria - 1)) * FIN_MENSALIDADE_LF_DIR;
  const recBares = p.buildings.bares.reduce((s, b) => {
    const base = b.damaged || b.building ? 0 : [0, 2250, 3250, 4500][b.nivel] || 0;
    return s + Math.round(base * getMultiplicadorBairro(b.local));
  }, 0);
  const recLojas = p.buildings.lojas.reduce((s, l) => {
    const base = l.damaged || l.building ? 0 : [0, 2200, 4500, 6000][l.nivel] || 0;
    return s + Math.round(base * getMultiplicadorBairro(l.local));
  }, 0);
  const recSubsedes = [...p.buildings.subsedesCidade, ...p.buildings.subsedesFora]
    .reduce((s, sub) => s + (sub.damaged || sub.building ? 0
      : (sub.nivel === 1 ? 1500 : 3000)), 0);
  const doacoes = Math.round(mensalidades * 0.45);
  const eventos = Math.round(mensalidades * 0.30);
  const totalReceitas = mensalidades + recBares + recLojas + recSubsedes + doacoes + eventos;

  // DESPESAS
  const upSede = [0, 200, 480, 960, 1800, 3000][p.buildings.sede] || 0;
  const upBares = p.buildings.bares.reduce((s, b) => s + ([0, 800, 1600, 3000][b.nivel] || 0), 0);
  const upLojas = p.buildings.lojas.reduce((s, l) =>
    s + ([0, 1500, 2500, 4000][l.nivel] || 0) + ([0, 500, 1200, 2500][l.nivel] || 0), 0);
  const upSubsedes = [...p.buildings.subsedesCidade, ...p.buildings.subsedesFora]
    .reduce((s, sub) => s + (sub.nivel === 1 ? 1000 : 1600), 0);
  const salarios = (p.linhaDeFrente.length + p.diretoria) * 100;
  const deslocamentos = Math.round(totalReceitas * 0.10);
  const materiais = Math.round(totalReceitas * 0.06);
  const subornos = Math.round(totalReceitas * 0.05);
  const totalDespesas = upSede + upBares + upLojas + upSubsedes + salarios + deslocamentos + materiais + subornos;

  return {
    receitas: { mensalidades, lojas: recLojas, bares: recBares, subsedes: recSubsedes, doacoes, eventos, total: totalReceitas },
    despesas: { manutencao: upSede + upBares + upLojas + upSubsedes, salarios, deslocamentos, materiais, subornos, total: totalDespesas },
    saldo: totalReceitas - totalDespesas,
    caixa: p.saldo,
    dividas: 0
  };
}

function buildFinanceiroEstabelecimentos(p) {
  const items = [];
  const team = getTeam(state.selectedTeam);
  const cidade = team ? DATA.cidadeById?.[team.cidadeId] : null;

  // Resolve display de bairro a partir de "local" (nome) procurando em cidade.bairros
  const lookupBairro = (nomeBairro) => {
    if (!nomeBairro) return null;
    return cidade?.bairros?.find(b => b.nome === nomeBairro) || null;
  };
  const fmtLocal = (nomeBairro, fallback) => {
    const b = lookupBairro(nomeBairro);
    if (b) return formatBairroLabel(b);
    return nomeBairro || fallback || "—";
  };

  // SEDE primeiro — usa o bairroSede da torcida (definido na Unity)
  const bairroSedeNome = getBairroSedeTorcida(team);
  const bairroSedeObj = lookupBairro(bairroSedeNome);
  items.push({
    tipo: "Sede",
    nome: `Sede da ${p.nome}`,
    bairro: bairroSedeObj ? formatBairroLabel(bairroSedeObj) : (bairroSedeNome || (p.cidade || "Centro")),
    nivel: p.buildings.sede,
    damaged: false, building: false,
    receita: 0,
    custo: [0, 200, 480, 960, 1800, 3000][p.buildings.sede] || 0,
    isSede: true
  });
  p.buildings.bares.forEach(b => {
    const mult = getMultiplicadorBairro(b.local);
    const baseRec = b.damaged || b.building ? 0 : ([0, 2250, 3250, 4500][b.nivel] || 0);
    items.push({
      tipo: "Bar", nome: b.nome, bairro: fmtLocal(b.local, "Centro"), nivel: b.nivel,
      damaged: b.damaged > 0, building: b.building > 0,
      receita: Math.round(baseRec * mult),
      custo: [0, 800, 1600, 3000][b.nivel] || 0,
      multiplicador: mult
    });
  });
  p.buildings.lojas.forEach(l => {
    const mult = getMultiplicadorBairro(l.local);
    const baseRec = l.damaged || l.building ? 0 : ([0, 2200, 4500, 6000][l.nivel] || 0);
    items.push({
      tipo: "Loja", nome: l.nome, bairro: fmtLocal(l.local, "Centro"), nivel: l.nivel,
      damaged: l.damaged > 0, building: l.building > 0,
      receita: Math.round(baseRec * mult),
      custo: ([0, 1500, 2500, 4000][l.nivel] || 0) + ([0, 500, 1200, 2500][l.nivel] || 0),
      multiplicador: mult
    });
  });
  p.buildings.subsedesCidade.forEach(s => {
    const mult = getMultiplicadorBairro(s.local);
    const baseRec = s.damaged || s.building ? 0 : (s.nivel === 1 ? 1000 : 2500);
    items.push({
      tipo: "Subsede Cidade", nome: s.nome || "Subsede", bairro: fmtLocal(s.local, "Bairro"),
      nivel: s.nivel, damaged: s.damaged > 0, building: s.building > 0,
      receita: Math.round(baseRec * mult),
      custo: s.nivel === 1 ? 800 : 1200,
      multiplicador: mult
    });
  });
  p.buildings.subsedesFora.forEach(s => items.push({
    tipo: "Subsede Fora", nome: s.nome || "Subsede Fora", bairro: s.local || "Outra cidade",
    nivel: s.nivel, damaged: s.damaged > 0, building: s.building > 0,
    receita: s.damaged || s.building ? 0 : (s.nivel === 1 ? 1500 : 3000),
    custo:   s.nivel === 1 ? 1200 : 2000
  }));
  if (p.buildings.fabrica) {
    items.push({
      tipo: "Fábrica", nome: "Fábrica de Materiais", bairro: p.cidade || "Industrial",
      nivel: 1, damaged: false, building: false,
      receita: 0, // efeito é multiplicador nas lojas
      custo: 3000
    });
  }
  return items;
}

function finChartSVG(values) {
  // values: array of 6 numbers
  const W = 360, H = 160, padX = 30, padY = 18;
  const max = Math.max(...values, 50000);
  const min = Math.min(0);
  const range = max - min || 1;
  const stepX = (W - padX * 2) / (values.length - 1);
  const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN"];
  const yLabels = [50, 40, 30, 20, 10];
  const points = values.map((v, i) => {
    const x = padX + stepX * i;
    const y = H - padY - ((v - min) / range) * (H - padY * 2);
    return [x, y];
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  return `
    <svg viewBox="0 0 ${W} ${H}" class="fin-chart">
      ${yLabels.map((v, i) => {
        const y = padY + (i * (H - padY * 2) / (yLabels.length - 1));
        return `<line x1="${padX}" x2="${W - padX}" y1="${y}" y2="${y}" class="fin-chart-grid"/>
                <text x="0" y="${y + 3}" class="fin-chart-text">${v}K</text>`;
      }).join("")}
      <path d="${path}" class="fin-chart-line"/>
      ${points.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" class="fin-chart-dot"/>`).join("")}
      ${months.map((m, i) => `<text x="${padX + stepX * i - 8}" y="${H - 2}" class="fin-chart-text">${m}</text>`).join("")}
    </svg>
  `;
}

function generateChartData(p, fin) {
  // Use last 5 months mock + current month (real) — consistent and deterministic
  const cur = fin.saldo;
  const variations = [0.55, 0.40, 0.72, 0.85, 1.05, 0.78];
  const amplitude = Math.max(20000, Math.abs(cur) * 1.2);
  return variations.map(v => Math.round(amplitude * v));
}

function renderFinanceiroExpandir(p) {
  const sedeNivel = p.buildings.sede;
  const proxSede = sedeNivel + 1;
  const sedeCustos = [0, 0, 40000, 100000, 200000, 400000];
  const sedeTempos = [0, 0, 30, 45, 60, 90];
  const sedePodeUpgrade = proxSede <= 5 && p.saldo >= sedeCustos[proxSede];

  const maxBares = sedeNivel >= 4 ? 2 : 1;
  const maxLojas = sedeNivel >= 4 ? 2 : sedeNivel >= 2 ? 1 : 0;
  const maxSubCidade = sedeNivel >= 5 ? 3 : sedeNivel >= 4 ? 2 : sedeNivel >= 2 ? 1 : 0;
  const maxSubFora = sedeNivel >= 5 ? 5 : sedeNivel >= 4 ? 3 : sedeNivel >= 3 ? 1 : 0;
  const podeFabrica = sedeNivel >= 5 && !p.buildings.fabrica;

  // Tabelas de custo de upgrade (full price do nível alvo)
  const barCustos  = [0, 40000, 80000, 150000];
  const lojaCustos = [0, 50000, 100000, 150000];

  // Lista de upgrades disponíveis para estruturas existentes
  const renderEstUpgrade = (est, idx, action, custos, max) => {
    if (est.nivel >= max) return `<div class="fin-exp-row fin-exp-est-row"><span>${est.local || est.nome} · Nv.${est.nivel}</span><b class="muted">MÁX</b></div>`;
    const next = est.nivel + 1;
    const cost = custos[next];
    const enabled = p.saldo >= cost && !est.building;
    const status = est.building ? "em obra" : est.damaged ? "danificado" : "operando";
    return `<div class="fin-exp-est-row">
      <span>${est.local || est.nome} · Nv.${est.nivel} <small class="muted">${status}</small></span>
      <button class="fin-exp-mini-btn" data-action="${action}" data-action-arg="${idx}" ${enabled ? "" : "disabled"}>SUBIR P/ NV ${next} · ${BRL.format(cost)}</button>
    </div>`;
  };

  // ── Investir no Time: cálculo dinâmico do custo ──
  const playerTeam = teams.find(t => t.id === state.selectedTeam);
  const forcaAtual = clamp(((playerTeam?.qualidade || 25)) * 2, 1, 100);
  const proxForca = Math.min(100, forcaAtual + 1);
  const investCost = forcaAtual <= 20 ? 100000
    : forcaAtual <= 30 ? 200000
    : forcaAtual <= 40 ? 300000
    : forcaAtual <= 50 ? 400000
    : forcaAtual <= 60 ? 500000
    : forcaAtual <= 70 ? 600000
    : forcaAtual <= 80 ? 700000
    : forcaAtual <= 90 ? 800000
    : 1000000;
  const podeInvestir = p.saldo >= investCost && forcaAtual < 100;

  // ── Festas: condições ──
  const next = getPlayerProximoJogo();
  const playerTimeId = playerTeam?.timeId;
  const proxJogoEmCasa = next && next.home === playerTimeId;
  const podeFestaPre = proxJogoEmCasa && p.saldo >= 3000;

  const dataFund = playerTeam?.dataFundacao || "";
  const [diaF, mesF] = dataFund.split("/").map(Number);
  const hoje = new Date(state.date + "T12:00:00");
  const ehAniversario = diaF && mesF && (hoje.getDate() === diaF && hoje.getMonth() + 1 === mesF);
  const podeAniv = ehAniversario && p.saldo >= 20000;
  // Próxima data de aniversário (ano corrente ou próximo)
  let proxAnivStr = "—";
  if (diaF && mesF) {
    let anoAniv = hoje.getFullYear();
    const dataAnivAno = new Date(anoAniv, mesF - 1, diaF, 12, 0, 0);
    if (dataAnivAno < hoje) anoAniv += 1;
    proxAnivStr = `${String(diaF).padStart(2,"0")}/${String(mesF).padStart(2,"0")}/${anoAniv}`;
  }

  const ehMeioSemana = hoje.getDay() >= 2 && hoje.getDay() <= 4;
  const podePagode = ehMeioSemana && p.saldo >= 5000;

  return `
    <div class="fin-exp-wrap">
      <div class="fin-exp-grid">
        <div class="fin-exp-card">
          <h3>SEDE</h3>
          <p class="muted">Nível atual: <b class="warn">${sedeNivel}</b> · Capacidade: ${[0,50,100,150,200,500][sedeNivel]} membros</p>
          ${proxSede <= 5 ? `
            <div class="fin-exp-row"><span>Próximo nível</span><b>${proxSede}</b></div>
            <div class="fin-exp-row"><span>Custo</span><b class="bad">${BRL.format(sedeCustos[proxSede])}</b></div>
            <div class="fin-exp-row"><span>Tempo de obra</span><b>${sedeTempos[proxSede]} dias</b></div>
            <button class="hg-cta" data-action="upgrade" ${sedePodeUpgrade ? "" : "disabled"}>SUBIR PARA NÍVEL ${proxSede}</button>
          ` : `<p class="muted">Sede no nível máximo.</p>`}
        </div>

        <div class="fin-exp-card">
          <h3>BARES (${p.buildings.bares.length}/${maxBares})</h3>
          <p class="muted">Receita ↑ com prestígio.</p>
          ${p.buildings.bares.map((b, i) => renderEstUpgrade(b, i, "upgradeBar", barCustos, 3)).join("") || "<p class='muted'>Nenhum bar construído.</p>"}
          <button class="hg-cta" data-action="construirBar" ${p.buildings.bares.length >= maxBares ? "disabled" : ""}>CONSTRUIR BAR · ${BRL.format(barCustos[1])}</button>
        </div>

        <div class="fin-exp-card">
          <h3>LOJAS (${p.buildings.lojas.length}/${maxLojas})</h3>
          <p class="muted">Precisa de insumos mensais.</p>
          ${p.buildings.lojas.map((l, i) => renderEstUpgrade(l, i, "upgradeLoja", lojaCustos, 3)).join("") || "<p class='muted'>Nenhuma loja construída.</p>"}
          <button class="hg-cta" data-action="construirLoja" ${p.buildings.lojas.length >= maxLojas ? "disabled" : ""}>CONSTRUIR LOJA · ${BRL.format(lojaCustos[1])}</button>
        </div>

        <div class="fin-exp-card">
          <h3>SUBSEDE NA CIDADE (${p.buildings.subsedesCidade.length}/${maxSubCidade})</h3>
          <p class="muted">2x recrutamento na região. Inclui mini-bar/loja.</p>
          ${p.buildings.subsedesCidade.map((s, i) => renderEstUpgrade(s, i, "upgradeSubsedeCidade", [0, 100000, 200000], 2)).join("") || "<p class='muted'>Nenhuma subsede.</p>"}
          <button class="hg-cta" data-action="construirSubsedeCidade" ${p.buildings.subsedesCidade.length >= maxSubCidade ? "disabled" : ""}>CONSTRUIR SUBSEDE · R$ 100.000</button>
        </div>

        <div class="fin-exp-card">
          <h3>SUBSEDE FORA (${p.buildings.subsedesFora.length}/${maxSubFora})</h3>
          <p class="muted">Capacidade Nv 1: 25 torcedores em jogos fora.</p>
          ${p.buildings.subsedesFora.map((s, i) => renderEstUpgrade(s, i, "upgradeSubsedeFora", [0, 200000, 400000], 2)).join("") || "<p class='muted'>Nenhuma subsede fora.</p>"}
          <button class="hg-cta" data-action="construirSubsedeFora" ${p.buildings.subsedesFora.length >= maxSubFora ? "disabled" : ""}>CONSTRUIR FORA · R$ 200.000</button>
        </div>

        <div class="fin-exp-card${podeFabrica ? "" : " fin-exp-locked"}">
          <h3>FÁBRICA DE MATERIAIS ${p.buildings.fabrica ? "✓" : ""}</h3>
          <p class="muted">Lojas faturam 3×, mensalidades dobram, insumo cai 60%. Requer Sede Nv 5.</p>
          <div class="fin-exp-row"><span>Custo</span><b class="bad">R$ 400.000</b></div>
          <div class="fin-exp-row"><span>Manutenção / mês</span><b class="bad">R$ 3.000</b></div>
          <button class="hg-cta" data-action="construirFabrica" ${podeFabrica && p.saldo >= 400000 ? "" : "disabled"}>${p.buildings.fabrica ? "CONSTRUÍDA" : sedeNivel >= 5 ? "CONSTRUIR FÁBRICA" : "REQUER SEDE NV 5"}</button>
        </div>
      </div>

      <div class="fin-exp-grid fin-exp-grid-2">
        <div class="fin-exp-card">
          <h3>INVESTIR NO TIME</h3>
          <p class="muted">Aumenta força do elenco em +1.</p>
          <div class="fin-exp-row"><span>Time</span><b>${playerTeam?.nome || "—"}</b></div>
          <div class="fin-exp-row"><span>Força atual</span><b class="warn">${forcaAtual} / 100</b></div>
          <div class="fin-exp-row"><span>Próxima força</span><b class="good">${proxForca}</b></div>
          <div class="fin-exp-row"><span>Custo</span><b class="bad">${BRL.format(investCost)}</b></div>
          <button class="hg-cta" data-action="investirTime" ${podeInvestir ? "" : "disabled"}>INVESTIR ${BRL.format(investCost)}</button>
          <small class="muted" style="margin-top:6px;font-size:10px;letter-spacing:.06em">Custo escala: 1-20 = R$100k · 21-30 = R$200k · ... · 91-100 = R$1M</small>
        </div>

        <div class="fin-exp-card">
          <h3>FESTAS</h3>
          <div class="fin-festa">
            <div class="fin-festa-info">
              <strong>Festa Pré-Jogo</strong>
              <small>Antes de jogo em casa · custo R$ 3.000 · retorno R$ 2.000-6.000 · moral +1</small>
            </div>
            <button class="hg-cta" data-action="festaPreJogo" ${podeFestaPre ? "" : "disabled"}>${proxJogoEmCasa ? "REALIZAR" : "PRÓX. JOGO FORA"}</button>
          </div>
          <div class="fin-festa">
            <div class="fin-festa-info">
              <strong>Aniversário da Torcida</strong>
              <small>Em ${proxAnivStr} · custo R$ 20.000 · retorno R$ 15.000-40.000 · moral +2 · prestígio +3</small>
            </div>
            <button class="hg-cta" data-action="festaAniversario" ${podeAniv ? "" : "disabled"}>${ehAniversario ? "COMEMORAR" : "FORA DA DATA"}</button>
          </div>
          <div class="fin-festa">
            <div class="fin-festa-info">
              <strong>Pagode</strong>
              <small>Meio de semana (Ter–Qui) · custo R$ 5.000 · retorno R$ 4.000-8.000 · moral +1</small>
            </div>
            <button class="hg-cta" data-action="pagode" ${podePagode ? "" : "disabled"}>${ehMeioSemana ? "ORGANIZAR" : "FORA DO MEIO DE SEMANA"}</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderFinanceiroTransacoes(p) {
  state.financeiro = state.financeiro || { transacoes: [], ultimoResumo: null };
  const trans = state.financeiro.transacoes.slice(0, 200);
  const totalEntradas = trans.filter(t => t.valor > 0).reduce((s, t) => s + t.valor, 0);
  const totalSaidas = trans.filter(t => t.valor < 0).reduce((s, t) => s + Math.abs(t.valor), 0);

  // Filtros por tipo
  const filtroSel = state.transFiltro || "todos";
  const tiposVisiveis = filtroSel === "todos" ? null
    : filtroSel === "receitas" ? trans.filter(t => t.valor > 0).map(t => t.tipo)
    : filtroSel === "despesas" ? trans.filter(t => t.valor < 0).map(t => t.tipo)
    : [filtroSel];
  const visiveis = filtroSel === "todos" ? trans
    : filtroSel === "receitas" ? trans.filter(t => t.valor > 0)
    : filtroSel === "despesas" ? trans.filter(t => t.valor < 0)
    : trans.filter(t => t.tipo === filtroSel);

  // Resumo do mês corrente
  const resumo = state.financeiro.ultimoResumo;
  const filtros = [
    { id: "todos", label: "TODAS" },
    { id: "receitas", label: "RECEITAS" },
    { id: "despesas", label: "DESPESAS" }
  ];

  const filtroBtn = f => `<button class="trans-filter-btn ${filtroSel === f.id ? "active" : ""}" data-trans-filtro="${f.id}">${f.label}</button>`;

  return `
    <div class="fin-list-wrap">
      <div class="fin-pat-summary">
        <div><span class="muted">Lançamentos</span><b>${trans.length}</b></div>
        <div><span class="muted">Entradas</span><b class="good">${BRL.format(totalEntradas)}</b></div>
        <div><span class="muted">Saídas</span><b class="bad">${BRL.format(totalSaidas)}</b></div>
        <div><span class="muted">Saldo atual</span><b class="${p.saldo >= 0 ? "good" : "bad"}">${BRL.format(p.saldo)}</b></div>
      </div>
      ${resumo ? `
        <div class="fin-resumo-box">
          <div class="fin-resumo-head">
            <span>RESUMO ${String(resumo.mes).padStart(2,"0")}/${resumo.ano}</span>
            <small>Saldo anterior ${BRL.format(resumo.saldoAnterior)} → Saldo atual ${BRL.format(resumo.saldoNovo)}</small>
          </div>
          <div class="fin-resumo-cols">
            <div><small class="muted">Receitas</small><b class="good">${BRL.format(resumo.totalReceitas)}</b></div>
            <div><small class="muted">Despesas</small><b class="bad">${BRL.format(Math.abs(resumo.totalGastos))}</b></div>
            <div><small class="muted">Lucro</small><b class="${(resumo.totalReceitas + resumo.totalGastos) >= 0 ? "good" : "bad"}">${BRL.format(resumo.totalReceitas + resumo.totalGastos)}</b></div>
          </div>
          ${resumo.porLocal && resumo.porLocal.length ? `
            <div class="fin-por-local">
              <small class="muted">LUCRO POR LOCAL (mês ${String(resumo.mes).padStart(2,"0")})</small>
              ${resumo.porLocal.map(l => `
                <div class="fin-por-local-row">
                  <span class="fin-tipo">${l.tipo}</span>
                  <span class="fin-name">${l.nome}</span>
                  <span class="good">+${BRL.format(l.receita)}</span>
                  <span class="bad">-${BRL.format(l.custo)}</span>
                  <b class="${l.lucro >= 0 ? "good" : "bad"}">${l.lucro >= 0 ? "+" : ""}${BRL.format(l.lucro)}</b>
                </div>`).join("")}
            </div>
          ` : ""}
        </div>
      ` : ""}
      <div class="trans-filters">${filtros.map(filtroBtn).join("")}</div>
      <div class="fin-list">
        <div class="fin-row fin-trans-head fin-head">
          <div>DATA</div>
          <div>DESCRIÇÃO</div>
          <div>TIPO</div>
          <div>VALOR</div>
        </div>
        <div class="fin-rows-scroll">
          ${visiveis.length ? visiveis.map(t => {
            const sign = t.valor > 0 ? "+" : "";
            const cls = t.valor > 0 ? "good" : t.valor < 0 ? "bad" : "muted";
            return `<div class="fin-row fin-trans-row">
              <div class="fin-bairro">${t.data || "—"}</div>
              <div class="fin-name">${t.descricao}</div>
              <div class="fin-tipo">${t.tipo || "—"}</div>
              <div class="${cls}" style="font-weight:800">${t.valor ? sign + BRL.format(t.valor) : "—"}</div>
            </div>`;
          }).join("") : `<div class='tor-empty'>Nenhuma transação ${filtroSel === "todos" ? "registrada ainda" : "neste filtro"}.</div>`}
        </div>
      </div>
    </div>
  `;
}

function renderFinanceiro() {
  const p = state.player;
  const subtab = state.financSubtab || "resumo";
  const fin = buildFinanceiroData(p);

  const tabs = [
    { id: "resumo", label: "RESUMO" },
    { id: "patrimonio", label: "PATRIMÔNIO" },
    { id: "expandir", label: "EXPANDIR" },
    { id: "transacoes", label: "TRANSAÇÕES" }
  ];
  const tabBtn = t => `<button class="tor-tab ${subtab === t.id ? "active" : ""}" data-fin-subtab="${t.id}">${t.label}</button>`;

  let body = "";
  if (subtab === "resumo") {
    const chartData = generateChartData(p, fin);
    body = `
      <div class="fin-resumo">
        <div class="fin-section">
          <h3>FLUXO FINANCEIRO</h3>
          <div class="fin-flux">
            <div class="fin-flux-row"><span>Receitas</span><b class="good">${BRL.format(fin.receitas.total)}</b></div>
            <div class="fin-flux-row"><span>Despesas</span><b class="bad">${BRL.format(fin.despesas.total)}</b></div>
            <div class="fin-flux-row total"><span>Saldo</span><b class="${fin.saldo >= 0 ? "good" : "bad"}">${BRL.format(fin.saldo)}</b></div>
          </div>
          <button class="hg-cta" id="finDetalhes">DETALHES</button>
        </div>

        <div class="fin-section">
          <h3>GRÁFICO — ÚLTIMOS 6 MESES</h3>
          ${finChartSVG(chartData)}
          <div class="fin-donut-wrap">
            <div class="fin-donut"></div>
            <div class="fin-donut-info">
              <div><span class="muted">CAIXA</span><br><b class="good">${BRL.format(fin.caixa)}</b></div>
              <div><span class="muted">DÍVIDAS</span><br><b class="bad">${BRL.format(fin.dividas)}</b></div>
            </div>
          </div>
        </div>

        <div class="fin-section">
          <h3>PRINCIPAIS RECEITAS</h3>
          <div class="fin-list-mini">
            <div class="fin-mini-row"><span>Mensalidades</span><b class="good">${BRL.format(fin.receitas.mensalidades)}</b></div>
            <div class="fin-mini-row"><span>Lojas</span><b class="good">${BRL.format(fin.receitas.lojas)}</b></div>
            <div class="fin-mini-row"><span>Bares</span><b class="good">${BRL.format(fin.receitas.bares)}</b></div>
            <div class="fin-mini-row"><span>Subsedes</span><b class="good">${BRL.format(fin.receitas.subsedes)}</b></div>
            <div class="fin-mini-row"><span>Doações</span><b class="good">${BRL.format(fin.receitas.doacoes)}</b></div>
            <div class="fin-mini-row"><span>Eventos / Festas</span><b class="good">${BRL.format(fin.receitas.eventos)}</b></div>
          </div>
          <h3 style="margin-top:14px">PRINCIPAIS DESPESAS</h3>
          <div class="fin-list-mini">
            <div class="fin-mini-row"><span>Manutenção</span><b class="bad">${BRL.format(fin.despesas.manutencao)}</b></div>
            <div class="fin-mini-row"><span>Salários</span><b class="bad">${BRL.format(fin.despesas.salarios)}</b></div>
            <div class="fin-mini-row"><span>Deslocamentos</span><b class="bad">${BRL.format(fin.despesas.deslocamentos)}</b></div>
            <div class="fin-mini-row"><span>Materiais</span><b class="bad">${BRL.format(fin.despesas.materiais)}</b></div>
            <div class="fin-mini-row"><span>Subornos / Fianças</span><b class="bad">${BRL.format(fin.despesas.subornos)}</b></div>
          </div>
        </div>
      </div>`;
  } else if (subtab === "patrimonio") {
    const items = buildFinanceiroEstabelecimentos(p);
    const totalReceita = items.reduce((s, it) => s + it.receita, 0);
    const totalCusto = items.reduce((s, it) => s + it.custo, 0);
    body = `
      <div class="fin-list-wrap">
        <div class="fin-pat-summary">
          <div><span class="muted">Locais</span><b>${items.length}</b></div>
          <div><span class="muted">Receita Total / mês</span><b class="good">${BRL.format(totalReceita)}</b></div>
          <div><span class="muted">Custo Total / mês</span><b class="bad">${BRL.format(totalCusto)}</b></div>
          <div><span class="muted">Líquido</span><b class="${totalReceita - totalCusto >= 0 ? "good" : "bad"}">${BRL.format(totalReceita - totalCusto)}</b></div>
        </div>
        <div class="fin-list">
          <div class="fin-row fin-head">
            <div>NOME</div>
            <div>TIPO</div>
            <div>BAIRRO</div>
            <div>NÍVEL</div>
            <div>RECEITA / mês</div>
            <div>CUSTO / mês</div>
          </div>
          <div class="fin-rows-scroll">
            ${items.length ? items.map(it => `
              <div class="fin-row${it.isSede ? " fin-row-sede" : ""}">
                <div class="fin-name">
                  ${it.damaged ? "🔴 " : it.building ? "🟡 " : "🟢 "}${it.nome}
                </div>
                <div class="fin-tipo">${it.tipo}</div>
                <div class="fin-bairro">${it.bairro}${it.multiplicador != null && it.multiplicador !== 1 ? `<small class="muted"> · ${it.multiplicador.toFixed(2)}×</small>` : ""}</div>
                <div class="fin-nivel">Nv ${it.nivel}</div>
                <div class="fin-receita ${it.receita ? "good" : "muted"}">${it.receita ? BRL.format(it.receita) : "—"}</div>
                <div class="fin-custo bad">${BRL.format(it.custo)}</div>
              </div>`).join("") : "<div class='tor-empty'>Nenhuma estrutura construída ainda.</div>"}
          </div>
        </div>
      </div>`;
  } else if (subtab === "expandir") {
    body = renderFinanceiroExpandir(p);
  } else if (subtab === "transacoes") {
    body = renderFinanceiroTransacoes(p);
  } else {
    body = `<div class="tor-body-empty"><p class="muted">Em desenvolvimento — voltará em fase posterior do protótipo.</p></div>`;
  }

  document.querySelector("#financeiro").innerHTML = `
    <div class="hg-grid">
      <article class="hg-card" style="grid-column: span 12">
        <header class="hg-card-head"><span class="hg-bar"></span><h2>FINANCEIRO</h2></header>
        <div class="tor-tabs">
          ${tabs.map(tabBtn).join("")}
        </div>
        ${body}
      </article>
    </div>`;
}
// ===========================================================================
// MAPA DA CIDADE — bairros × quarteirões × lotes
// ===========================================================================
// Regra:
//   12 quarteirões por bairro
//   10 lotes por quarteirão
//   Estádio = 1 quarteirão inteiro
//   Bairros se posicionam nas zonas cardeais (Sul/Norte/Leste/Oeste)
//   Cidades: Pequena(8), Média(12) ou Grande(16) bairros
// ===========================================================================

const MAPA_QUARTEIROES_POR_BAIRRO = 12;
const MAPA_LOTES_POR_QUARTEIRAO = 10;

// Resolve a posição de cada zona no grid principal do mapa.
// Layout estilo cruz: Norte em cima, Sul embaixo, Leste à direita, Oeste à esquerda.
const ZONA_GRID_POS = {
  "Norte": { row: 1, col: 2 },
  "Oeste": { row: 2, col: 1 },
  "Leste": { row: 2, col: 3 },
  "Sul":   { row: 3, col: 2 }
};

// Cores por classe social (background tint dos bairros)
const CLASSE_COR = {
  "Nobre":        { bg: "linear-gradient(180deg, #463512, #2a1f08)", border: "#a07d2c", label: "#ffd98a" },
  "Classe Média": { bg: "linear-gradient(180deg, #2a2c2e, #161819)", border: "#5a5e62", label: "#cfd0d0" },
  "Classe Baixa": { bg: "linear-gradient(180deg, #2a2018, #15100c)", border: "#5e4a36", label: "#c9b59a" },
  "Favela":       { bg: "linear-gradient(180deg, #1f1410, #110a08)", border: "#4a2a20", label: "#a07060" }
};

// Tipos de estabelecimento neutro (lojas/serviços do GDD)
const ESTAB_NEUTROS = [
  { tipo: "mercadinho", icone: "🛒", label: "Mercadinho" },
  { tipo: "posto",      icone: "⛽", label: "Posto de gasolina" },
  { tipo: "joalheria",  icone: "💎", label: "Joalheria" },
  { tipo: "roupas",     icone: "👕", label: "Loja de roupas" },
  { tipo: "banco",      icone: "🏦", label: "Banco" },
  { tipo: "hospital",   icone: "🏥", label: "Hospital" }
];

// Quantidades por tipo de mapa (GDD).
// Mapa Grande (16 bairros) = números cheios.
// Mapa Médio (12 bairros) = 2/3 de cada.
// Mapa Pequeno (8 bairros) = 1/3 de cada.
const NEUTROS_QUANTIDADES = {
  16: { mercadinho: 12, posto: 3, joalheria: 3, roupas: 6, banco: 6, hospital: 3 },
  12: { mercadinho: 8,  posto: 2, joalheria: 2, roupas: 4, banco: 4, hospital: 2 },
  8:  { mercadinho: 4,  posto: 1, joalheria: 1, roupas: 2, banco: 2, hospital: 1 }
};

// Filtros do mapa — quais tipos de estrutura estão visíveis
function getMapaFiltros() {
  if (!state.mapaFiltros) {
    state.mapaFiltros = {
      estadios: true,
      sedes: true, bares: true, lojas: true, subsedes: true,
      mercadinho: true, posto: true, joalheria: true,
      roupas: true, banco: true, hospital: true
    };
  }
  return state.mapaFiltros;
}

const FILTRO_TORCIDAS = ["sedes", "bares", "lojas", "subsedes"];
const FILTRO_NEUTROS  = ["joalheria", "posto", "hospital", "mercadinho", "roupas", "banco"];

// Decorações estáticas do mapa:
//  - Praia ocupando o lado direito (céus vazios à direita)
//  - Rodovia + vegetação no canto inferior esquerdo
//  - Rotatória central decorativa (placeholder para emblema único da cidade)
function renderMapaDecoracoes(perSide, cols, rows) {
  let out = "";
  // Praia: cantos vazios na coluna mais à direita
  // Mapa Grande: 4 células (cols 4, rows 1-2 e 5-6)
  // Mapa Médio: 2 células (col 5, rows 1 e 5)
  if (perSide === 4) {
    out += `<div class="mapa-deco mapa-deco-praia mapa-deco-praia-tl" style="grid-row:1 / span 2; grid-column:${cols}"></div>`;
    out += `<div class="mapa-deco mapa-deco-praia mapa-deco-praia-bl" style="grid-row:${rows-1} / span 2; grid-column:${cols}"></div>`;
  } else if (perSide === 3) {
    out += `<div class="mapa-deco mapa-deco-praia mapa-deco-praia-tl" style="grid-row:1; grid-column:${cols}"></div>`;
    out += `<div class="mapa-deco mapa-deco-praia mapa-deco-praia-bl" style="grid-row:${rows}; grid-column:${cols}"></div>`;
  }

  // Rodovia + vegetação no canto inferior esquerdo
  if (perSide === 4) {
    out += `<div class="mapa-deco mapa-deco-rodovia" style="grid-row:${rows-1} / span 2; grid-column:1"></div>`;
  } else if (perSide === 3) {
    out += `<div class="mapa-deco mapa-deco-rodovia" style="grid-row:${rows}; grid-column:1"></div>`;
  }

  // Rotatória — overlay no centro da cidade (entre os 4 bairros centrais)
  if (perSide >= 3) {
    out += `<div class="mapa-deco mapa-deco-rotatoria" aria-hidden="true"></div>`;
  }

  // SVG com sinalização: faixas amarelas pontilhadas + faixas de pedestre
  // nas esquinas de toda intersecção do grid.
  const ofs = 0.06;     // distância da intersecção até o início da zebra
  const len = 0.18;     // comprimento da zebra (no eixo da rua)
  const half = 0.05;    // meia-largura da zebra (perpendicular à rua)
  const stripes = 5;    // número de listras
  const stripeW = (len) / (stripes * 2 - 1);

  // Faixas centrais pontilhadas (linha amarela tracejada)
  let lines = "";
  for (let c = 1; c < cols; c++) {
    lines += `<line x1="${c}" y1="0" x2="${c}" y2="${rows}" stroke="rgba(255,200,80,.55)" stroke-width="0.02" stroke-dasharray="0.10 0.12" vector-effect="non-scaling-stroke"/>`;
  }
  for (let r = 1; r < rows; r++) {
    lines += `<line x1="0" y1="${r}" x2="${cols}" y2="${r}" stroke="rgba(255,200,80,.55)" stroke-width="0.02" stroke-dasharray="0.10 0.12" vector-effect="non-scaling-stroke"/>`;
  }

  // Faixas de pedestre — em cada intersecção interna, 4 zebras (uma de cada lado)
  let zebras = "";
  for (let c = 1; c < cols; c++) {
    for (let r = 1; r < rows; r++) {
      // Norte (acima da intersecção): listras horizontais (perpendicular à rua vertical)
      for (let s = 0; s < stripes; s++) {
        const y = r - ofs - len + s * (stripeW * 2);
        zebras += `<rect x="${c - half}" y="${y}" width="${half * 2}" height="${stripeW}" fill="rgba(245,235,210,.85)"/>`;
      }
      // Sul (abaixo): listras horizontais
      for (let s = 0; s < stripes; s++) {
        const y = r + ofs + s * (stripeW * 2);
        zebras += `<rect x="${c - half}" y="${y}" width="${half * 2}" height="${stripeW}" fill="rgba(245,235,210,.85)"/>`;
      }
      // Oeste (esquerda): listras verticais (perpendicular à rua horizontal)
      for (let s = 0; s < stripes; s++) {
        const x = c - ofs - len + s * (stripeW * 2);
        zebras += `<rect x="${x}" y="${r - half}" width="${stripeW}" height="${half * 2}" fill="rgba(245,235,210,.85)"/>`;
      }
      // Leste (direita): listras verticais
      for (let s = 0; s < stripes; s++) {
        const x = c + ofs + s * (stripeW * 2);
        zebras += `<rect x="${x}" y="${r - half}" width="${stripeW}" height="${half * 2}" fill="rgba(245,235,210,.85)"/>`;
      }
    }
  }

  out += renderMapaSinalizacaoViaria(cols, rows);
  return out;
}

function renderMapaSinalizacaoViaria(cols, rows) {
  const vb = 1000;
  const pad = 10;
  const avenue = 14;
  const usable = vb - pad * 2;
  const cellW = (usable - avenue * (cols - 1)) / cols;
  const cellH = (usable - avenue * (rows - 1)) / rows;
  const xGapStart = c => pad + c * cellW + (c - 1) * avenue;
  const yGapStart = r => pad + r * cellH + (r - 1) * avenue;
  const fmt = n => Number(n.toFixed(2));

  let lanes = "";
  const laneClearance = 42;

  function addLaneSegment(x1, y1, x2, y2) {
    if (Math.hypot(x2 - x1, y2 - y1) < 24) return;
    lanes += `<line class="mapa-lane mapa-lane-shadow" x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}"/>`;
    lanes += `<line class="mapa-lane mapa-lane-yellow" x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}"/>`;
  }

  for (let c = 1; c < cols; c++) {
    const mid = xGapStart(c) + avenue / 2;
    let y = pad;
    for (let r = 1; r < rows; r++) {
      const intersectionStart = yGapStart(r) - laneClearance;
      const intersectionEnd = yGapStart(r) + avenue + laneClearance;
      addLaneSegment(mid, y, mid, intersectionStart);
      y = intersectionEnd;
    }
    addLaneSegment(mid, y, mid, vb - pad);
  }
  for (let r = 1; r < rows; r++) {
    const mid = yGapStart(r) + avenue / 2;
    let x = pad;
    for (let c = 1; c < cols; c++) {
      const intersectionStart = xGapStart(c) - laneClearance;
      const intersectionEnd = xGapStart(c) + avenue + laneClearance;
      addLaneSegment(x, mid, intersectionStart, mid);
      x = intersectionEnd;
    }
    addLaneSegment(x, mid, vb - pad, mid);
  }

  const rects = [];
  const stripeCount = 5;
  const stripe = 3.6;
  const stripeGap = 3.2;
  const crossLen = stripeCount * stripe + (stripeCount - 1) * stripeGap;
  const overhang = 4;

  function addVerticalZebra(xCenter, y, seed) {
    const startY = y + (avenue + overhang * 2 - crossLen) / 2;
    for (let s = 0; s < stripeCount; s++) {
      const worn = ((seed + s) % 3) * .05;
      rects.push(`<rect class="mapa-crosswalk-stripe" x="${fmt(xCenter - 11)}" y="${fmt(startY + s * (stripe + stripeGap))}" width="${22}" height="${stripe}" opacity="${fmt(.88 - worn)}"/>`);
    }
  }

  function addHorizontalZebra(x, yCenter, seed) {
    const startX = x + (avenue + overhang * 2 - crossLen) / 2;
    for (let s = 0; s < stripeCount; s++) {
      const worn = ((seed + s) % 3) * .05;
      rects.push(`<rect class="mapa-crosswalk-stripe" x="${fmt(startX + s * (stripe + stripeGap))}" y="${fmt(yCenter - 11)}" width="${stripe}" height="${22}" opacity="${fmt(.88 - worn)}"/>`);
    }
  }

  for (let c = 1; c < cols; c++) {
    const verticalCenter = xGapStart(c) + avenue / 2;
    for (let r = 1; r < rows; r++) {
      const horizontalCenter = yGapStart(r) + avenue / 2;
      const seed = c * 11 + r * 7;
      addVerticalZebra(verticalCenter - 22, yGapStart(r) - overhang, seed);
      addVerticalZebra(verticalCenter + 22, yGapStart(r) - overhang, seed + 1);
      addHorizontalZebra(xGapStart(c) - overhang, horizontalCenter - 22, seed + 2);
      addHorizontalZebra(xGapStart(c) - overhang, horizontalCenter + 22, seed + 3);
    }
  }

  return `<svg class="mapa-rua-svg" viewBox="0 0 ${vb} ${vb}" preserveAspectRatio="none" aria-hidden="true">${lanes}<g class="mapa-crosswalks">${rects.join("")}</g></svg>`;
}

function renderMapaFiltros(gridStyle = "") {
  const f = getMapaFiltros();
  const torcAll = FILTRO_TORCIDAS.every(k => f[k]);
  const torcNone = FILTRO_TORCIDAS.every(k => !f[k]);
  const neutAll = FILTRO_NEUTROS.every(k => f[k]);
  const neutNone = FILTRO_NEUTROS.every(k => !f[k]);
  const cb = (key, label, cls = "") => `
    <label class="mapa-filt-row ${cls}">
      <input type="checkbox" data-mapa-filt="${key}" ${f[key] ? "checked" : ""}>
      <span>${label}</span>
    </label>`;
  const cbGroup = (key, label, all, none) => `
    <label class="mapa-filt-row mapa-filt-group">
      <input type="checkbox" data-mapa-filt-group="${key}" ${all ? "checked" : ""} ${!all && !none ? 'data-indeterminate="true"' : ""}>
      <span>${label}</span>
    </label>`;
  return `<div class="mapa-filtros" style="${gridStyle}">
    <div class="mapa-filt-section">
      ${cb("estadios", "Estádios", "mapa-filt-solo")}
    </div>
    <div class="mapa-filt-section">
      ${cbGroup("torcidas", "TORCIDAS", torcAll, torcNone)}
      ${cb("sedes",    "Sedes",    "mapa-filt-child")}
      ${cb("bares",    "Bares",    "mapa-filt-child")}
      ${cb("lojas",    "Lojas",    "mapa-filt-child")}
      ${cb("subsedes", "Subsedes", "mapa-filt-child")}
    </div>
    <div class="mapa-filt-section">
      ${cbGroup("neutros", "DEMAIS LOCAIS", neutAll, neutNone)}
      ${cb("joalheria",  "Joalheria",        "mapa-filt-child")}
      ${cb("posto",      "Posto de Gasolina","mapa-filt-child")}
      ${cb("hospital",   "Hospital",         "mapa-filt-child")}
      ${cb("mercadinho", "Mercadinho",       "mapa-filt-child")}
      ${cb("roupas",     "Loja de Roupas",   "mapa-filt-child")}
      ${cb("banco",      "Banco",            "mapa-filt-child")}
    </div>
  </div>`;
}

// Hash FNV-1a 32 bits — distribuição uniforme para semear posicionamentos
function fnvHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

// Coleta TODAS as estruturas presentes na cidade do jogador:
//   estádios, sedes de TODAS as torcidas + bar associado, edifícios do jogador,
//   estabelecimentos neutros distribuídos por bairro de forma determinística.
function coletarEstruturasDaCidade() {
  const team = teams.find(x => x.id === state.selectedTeam);
  if (!team) return [];
  const cidade = DATA.cidadeById?.[team.cidadeId];
  if (!cidade) return [];
  const playerTorcidaId = team.torcidaId;
  const lista = [];

  // Estádios da cidade
  (DATA.estadios || []).forEach(e => {
    if (e.cidadeId !== cidade.id || !e.bairroEstadio) return;
    lista.push({ bairro: e.bairroEstadio, tipo: "estadio", label: `Estádio · ${e.nome}`, icone: "🏟️" });
  });

  // Sedes + bar de cada torcida cujo CLUBE seja desta cidade.
  // Bar SEMPRE em zona diferente da sede (deterministicamente por hash do id).
  const hashStr = (s) => fnvHash(s);
  (DATA.torcidas || []).forEach(t => {
    if (!t.bairroSede) return;
    const clube = DATA.timeById?.[t.clubeId];
    if (clube?.cidadeId !== cidade.id) return;
    const isPlayer = t.id === playerTorcidaId;
    const cor = t.corCamisa || clube?.corPrimaria || "#a51f1c";
    lista.push({
      bairro: t.bairroSede,
      tipo: "sede",
      isPlayer,
      cor,
      label: `Sede · ${t.nome} (${clube?.nome || ""})`,
      icone: "🏠"
    });
    // Bar em outra zona (player usa o local explícito de p.buildings.bares; outras torcidas vão por hash)
    if (!isPlayer) {
      const sedeBairro = cidade.bairros.find(b => b.nome === t.bairroSede);
      const zonaSede = sedeBairro?.zonaLabel;
      const candidatos = cidade.bairros.filter(b => b.zonaLabel !== zonaSede);
      if (candidatos.length) {
        const bar = candidatos[Math.abs(hashStr(t.id)) % candidatos.length];
        lista.push({
          bairro: bar.nome,
          tipo: "bar",
          isPlayer: false,
          cor,
          label: `Bar · ${t.nome}`,
          icone: "🍻"
        });
      }
    }
  });

  // Construções específicas do jogador (bar/loja/subsede com local definido)
  const p = state.player;
  (p.buildings.bares || []).forEach(b => {
    if (!b.local) return;
    lista.push({ bairro: b.local, tipo: "bar-jogador", isPlayer: true, label: b.nome, icone: "🍻" });
  });
  (p.buildings.lojas || []).forEach(l => {
    if (!l.local) return;
    lista.push({ bairro: l.local, tipo: "loja-jogador", isPlayer: true, label: l.nome, icone: "🛍️" });
  });
  (p.buildings.subsedesCidade || []).forEach(s => {
    if (!s.local) return;
    lista.push({ bairro: s.local, tipo: "subsede", isPlayer: true, label: s.nome || "Subsede", icone: "🏢" });
  });

  // Estabelecimentos neutros — quantidades exatas conforme GDD por tamanho de mapa.
  // Para cada tipo, escolhe deterministicamente N bairros (sem repetir tipo no mesmo bairro).
  const quantidades = NEUTROS_QUANTIDADES[cidade.bairros.length] || {};
  ESTAB_NEUTROS.forEach(estab => {
    const qty = quantidades[estab.tipo] || 0;
    if (qty <= 0) return;
    const escolhidos = cidade.bairros
      .map(b => ({ b, k: fnvHash(`${estab.tipo}|${b.nome}`) }))
      .sort((a, x) => a.k - x.k)
      .slice(0, qty);
    escolhidos.forEach(({ b }) => {
      lista.push({ bairro: b.nome, ...estab, isNeutral: true });
    });
  });

  return lista;
}

// Atribui as estruturas a quarteirões dentro de cada bairro de forma estável.
// Estádio sempre no quarteirão central (6). Outros vão preenchendo aleatoriamente
// em quarteirões e em LOTES diferentes (não fica tudo no mesmo canto).
function calcularQuarteiroesEspeciais(bairroNome, allStructures) {
  const itens = (allStructures || []).filter(s => s.bairro === bairroNome);
  const ordemTipo = {
    estadio: 0, sede: 1, bar: 3, "bar-jogador": 2, "loja-jogador": 2, subsede: 2,
    mercadinho: 5, posto: 5, joalheria: 5, roupas: 5, farmacia: 5,
    padaria: 5, banco: 5, escola: 5, hospital: 5, barbearia: 5,
    academia: 5, restaurante: 5
  };
  itens.sort((a, b) => {
    const oa = ordemTipo[a.tipo] ?? 9, ob = ordemTipo[b.tipo] ?? 9;
    if (oa !== ob) return oa - ob;
    return (a.isPlayer ? 0 : 1) - (b.isPlayer ? 0 : 1);
  });
  const especiais = {};
  itens.forEach((item, i) => {
    if (item.tipo === "estadio") {
      especiais[6] = { ...item, loteIdx: -1 };
      return;
    }
    // Semente única por bairro+tipo+ordem garante distribuição estável e variada
    const seedQ = fnvHash(`${bairroNome}|q|${item.tipo}|${item.label || ""}|${i}`);
    const seedL = fnvHash(`${bairroNome}|l|${item.tipo}|${item.label || ""}|${i}`);
    let q = seedQ % MAPA_QUARTEIROES_POR_BAIRRO;
    let safety = 0;
    while ((especiais[q] || q === 6) && safety++ < MAPA_QUARTEIROES_POR_BAIRRO) {
      q = (q + 1) % MAPA_QUARTEIROES_POR_BAIRRO;
    }
    if (safety >= MAPA_QUARTEIROES_POR_BAIRRO) return;
    const loteIdx = seedL % MAPA_LOTES_POR_QUARTEIRAO;
    especiais[q] = { ...item, loteIdx };
  });
  return especiais;
}

// Paleta de telhados — tons reais vistos de cima
const ROOF_PALETTE = [
  { bg: "#a64a32", line: "#6a2a18" },  // terracota viva
  { bg: "#8a4030", line: "#5a221a" },  // tijolo aparente
  { bg: "#7a4a3a", line: "#4a2a20" },  // telha barro
  { bg: "#6a504a", line: "#3a2a25" },  // amianto
  { bg: "#3f4a55", line: "#1f262e" },  // ardósia azulada
  { bg: "#56524a", line: "#2a2520" },  // metal envelhecido
  { bg: "#5a4030", line: "#2c2018" },  // marrom-café
  { bg: "#7a5040", line: "#3a2418" },  // tijolo claro
  { bg: "#4a4a4a", line: "#222" },     // concreto
  { bg: "#9a5040", line: "#5a2818" }   // cerâmica vermelha
];

function renderMapaQuarteirao(bairroNome, qIdx, especial) {
  const isEstadio = especial?.tipo === "estadio";
  if (isEstadio) {
    return `<div class="mapa-quarteirao mapa-quarteirao-estadio" title="${especial.label}">
      <span class="mapa-quart-icon">${especial.icone}</span>
    </div>`;
  }
  const targetLote = especial && especial.loteIdx != null ? especial.loteIdx : -1;
  let lotes = "";
  for (let i = 0; i < MAPA_LOTES_POR_QUARTEIRAO; i++) {
    let cls = "mapa-lote";
    let icon = "";
    let title = `Lote ${i + 1}`;
    let style = "";
    if (especial && i === targetLote) {
      cls += ` mapa-lote-${especial.tipo}`;
      if (especial.isPlayer) cls += " mapa-lote-player";
      if (especial.isNeutral) cls += " mapa-lote-neutral";
      icon = `<span class="mapa-lote-icon"><b>${especial.icone}</b></span>`;
      title = especial.label;
      if (especial.cor && (especial.tipo === "sede" || especial.tipo === "bar")) {
        style = `style="background:${especial.cor};box-shadow:inset 0 0 0 1px rgba(0,0,0,.5)"`;
      }
    } else {
      // Lote residencial — escolhe telhado deterministicamente
      const seed = fnvHash(`${bairroNome}|${qIdx}|${i}`);
      const r = ROOF_PALETTE[seed % ROOF_PALETTE.length];
      // Direção da cumeeira alterna p/ ficar variado
      const cumeeira = (seed >> 3) % 4;
      cls += " mapa-lote-casa";
      style = `style="--roof:${r.bg};--roof-line:${r.line};--cum:${cumeeira}"`;
    }
    lotes += `<div class="${cls}" title="${title}" ${style}>${icon}</div>`;
  }
  return `<div class="mapa-quarteirao" title="Quarteirão ${qIdx + 1}">
    ${lotes}
  </div>`;
}

function renderMapaBairro(bairro, zona, allStructures, cornerOculto) {
  const especiais = calcularQuarteiroesEspeciais(bairro.nome, allStructures);
  const cor = CLASSE_COR[bairro.classeLabel] || CLASSE_COR["Classe Média"];
  const temSedePlayer = Object.values(especiais).some(e => e.tipo === "sede" && e.isPlayer);
  let quarteiroes = "";
  for (let q = 0; q < MAPA_QUARTEIROES_POR_BAIRRO; q++) {
    if (q === cornerOculto) {
      // Quarteirão ocupado pela rotatória — vazio (asfalto/área da praça)
      quarteiroes += `<div class="mapa-quarteirao mapa-quart-vazio"></div>`;
      continue;
    }
    quarteiroes += renderMapaQuarteirao(bairro.nome, q, especiais[q]);
  }
  return `<div class="mapa-bairro mapa-bairro-${zona.toLowerCase()} ${temSedePlayer ? "mapa-bairro-sede" : ""}"
              data-bairro="${bairro.nome}"
              data-classe="${bairro.classeLabel}">
    <div class="mapa-bairro-quarteiroes">${quarteiroes}</div>
    <div class="mapa-bairro-watermark" style="color:${cor.label}">${bairro.nome}</div>
  </div>`;
}

function renderMapaLegado() {
  const team = teams.find(x => x.id === state.selectedTeam);
  const cidade = team ? DATA.cidadeById?.[team.cidadeId] : null;
  const root = document.querySelector("#mapa");
  if (!root) return;

  if (!cidade?.bairros?.length) {
    root.innerHTML = `<div class="hg-grid"><article class="hg-card" style="grid-column: span 12">
      <header class="hg-card-head"><span class="hg-bar"></span><h2>MAPA</h2></header>
      <div class="tor-body-empty"><p class="muted">Cidade sem bairros mapeados.</p></div>
    </article></div>`;
    return;
  }

  // Agrupa por zona, preserva ordem do asset
  const porZona = { Norte: [], Sul: [], Leste: [], Oeste: [] };
  cidade.bairros.forEach(b => porZona[b.zonaLabel]?.push(b));

  const perSide = porZona.Norte.length; // 4, 3 ou 2
  const totalBairros = cidade.bairros.length;
  const totalQuarteiroes = totalBairros * MAPA_QUARTEIROES_POR_BAIRRO;
  const totalLotes = totalQuarteiroes * MAPA_LOTES_POR_QUARTEIRAO;
  const tamanhoMapa = cidade.nivelMapa === 1 ? "Grande" : cidade.nivelMapa === 2 ? "Médio" : "Pequeno";
  const torcida = DATA.torcidaById?.[team?.torcidaId];

  // Layout em "+" (cruz). Cada zona é um bloco quadrado (2×2 / 1×3 / 1×2)
  // posicionado nas extremidades. Os 4 cantos do grid ficam vazios.
  // perSide → arm: 4 → 2 (2×2), 3 → 3 (1×3 e 3×1), 2 → 2 (1×2 e 2×1)
  let cols, rows, layout;
  if (perSide === 4) {
    // 4 cols × 6 rows; zonas 2×2 nas pontas (row-major: bairros 0-1 na 1ª linha, 2-3 na 2ª)
    cols = 4; rows = 6;
    layout = {
      Norte: i => ({ row: Math.floor(i / 2) + 1, col: (i % 2) + 2 }),       // rows 1-2 cols 2-3
      Sul:   i => ({ row: Math.floor(i / 2) + 5, col: (i % 2) + 2 }),       // rows 5-6 cols 2-3
      Oeste: i => ({ row: Math.floor(i / 2) + 3, col: (i % 2) + 1 }),       // rows 3-4 cols 1-2
      Leste: i => ({ row: Math.floor(i / 2) + 3, col: (i % 2) + 3 })        // rows 3-4 cols 3-4
    };
  } else if (perSide === 3) {
    // 5 cols × 5 rows; zonas em barras (1×3 horizontal / 3×1 vertical)
    cols = 5; rows = 5;
    layout = {
      Norte: i => ({ row: 1,         col: i + 2 }), // row 1, cols 2-4
      Sul:   i => ({ row: 5,         col: i + 2 }),
      Oeste: i => ({ row: i + 2,     col: 1     }),
      Leste: i => ({ row: i + 2,     col: 5     })
    };
  } else {
    // perSide 2 (Mapa Pequeno): 2 cols × 4 rows, compacto sem cantos vazios.
    // Row 1 = Norte (2 bairros), rows 2-3 = Oeste|Leste, row 4 = Sul (2 bairros).
    cols = 2; rows = 4;
    layout = {
      Norte: i => ({ row: 1,     col: i + 1 }),
      Sul:   i => ({ row: 4,     col: i + 1 }),
      Oeste: i => ({ row: i + 2, col: 1 }),
      Leste: i => ({ row: i + 2, col: 2 })
    };
  }

  const cells = [];
  ["Norte", "Sul", "Oeste", "Leste"].forEach(zona => {
    porZona[zona].forEach((b, i) => {
      const pos = layout[zona](i);
      cells.push({ ...pos, bairro: b, zona, zonaIdx: i });
    });
  });

  // Para Mapa Grande, os 4 bairros que cercam a rotatória central cedem
  // o quarteirão do canto interior pra ela respirar:
  //   Oeste i=1 (Freguesia)        — esconde canto inf.dir (idx 11)
  //   Oeste i=3 (Campo Grande)     — esconde canto sup.dir (idx 2)
  //   Leste i=0 (Flamengo)         — esconde canto inf.esq (idx 9)
  //   Leste i=2 (Laranjeiras)      — esconde canto sup.esq (idx 0)
  const cornerHide = perSide === 4 ? {
    "Oeste:1": 11, "Oeste:3": 2,
    "Leste:0": 9,  "Leste:2": 0
  } : {};

  // Coleta todas as estruturas da cidade UMA VEZ (estádios, sedes/bares de todas
  // as torcidas, prédios do jogador, neutros) e distribui por bairro.
  const allStructuresRaw = coletarEstruturasDaCidade();
  const filtros = getMapaFiltros();
  const allStructures = allStructuresRaw.filter(s => {
    if (s.tipo === "estadio") return filtros.estadios;
    if (s.tipo === "sede") return filtros.sedes;
    if (s.tipo === "bar" || s.tipo === "bar-jogador") return filtros.bares;
    if (s.tipo === "loja-jogador") return filtros.lojas;
    if (s.tipo === "subsede") return filtros.subsedes;
    if (s.isNeutral) return !!filtros[s.tipo];
    return true;
  });

  const cellsHTML = cells.map(c => {
    const hideIdx = cornerHide[`${c.zona}:${c.zonaIdx}`];
    const html = renderMapaBairro(c.bairro, c.zona, allStructures, hideIdx);
    return html.replace(
      "<div class=\"mapa-bairro",
      `<div style="grid-row:${c.row};grid-column:${c.col}" class="mapa-bairro`
    );
  }).join("");

  const zoom = state.mapaZoom || 1;

  root.innerHTML = `
    <div class="hg-grid">
      <article class="hg-card" style="grid-column: span 12">
        <header class="hg-card-head"><span class="hg-bar"></span><h2>MAPA — ${cidade.nome.toUpperCase()}</h2></header>
        <div class="mapa-toolbar">
          <div class="mapa-info">
            <div><span class="muted">CIDADE</span><b>${cidade.nome} / ${cidade.estado}</b></div>
            <div><span class="muted">TAMANHO</span><b>${tamanhoMapa}</b></div>
            <div><span class="muted">SEDE</span><b>${torcida?.bairroSede || "—"}</b></div>
          </div>
          <div class="mapa-legenda">
            <span class="mapa-leg-item"><span class="mapa-leg-dot mapa-leg-nobre"></span>Nobre 1.5×</span>
            <span class="mapa-leg-item"><span class="mapa-leg-dot mapa-leg-media"></span>Média 1.0×</span>
            <span class="mapa-leg-item"><span class="mapa-leg-dot mapa-leg-baixa"></span>Baixa 0.8×</span>
            <span class="mapa-leg-item"><span class="mapa-leg-dot mapa-leg-favela"></span>Favela 0.4×</span>
          </div>
        </div>
        <div class="mapa-viewport">
          <div class="mapa-cidade-anel"
               style="grid-template-columns: repeat(${cols}, 1fr); grid-template-rows: repeat(${rows}, 1fr); transform: scale(${zoom}); transform-origin: top left;">
            ${cellsHTML}
            ${renderMapaDecoracoes(perSide, cols, rows)}
            ${perSide === 4
              ? renderMapaFiltros(`grid-row: 1 / span 2; grid-column: 1`)
              : perSide === 3
                ? renderMapaFiltros(`grid-row: 1; grid-column: 1`)
                : renderMapaFiltros(`grid-row: 1; grid-column: 1; position: absolute; transform: translateY(-100%); width: 220px;`)
            }
          </div>
          <div class="mapa-zoom">
            <button class="mapa-zoom-btn" data-mapa-zoom="out" title="Diminuir">−</button>
            <span class="mapa-zoom-pct">${Math.round(zoom * 100)}%</span>
            <button class="mapa-zoom-btn" data-mapa-zoom="in" title="Aumentar">+</button>
          </div>
        </div>
      </article>
    </div>`;
}

// ===========================================================================
// CALENDÁRIO — calendário da torcida (grid mensal) + agenda do time (FM-style)
// ===========================================================================
// Executa plano manual ou rotina semanal definidos pra hoje (chamado no advanceDay)
// Despesa de caravana: registra R$ 3.000 (GDD) na véspera de cada jogo fora
// em cidade diferente. Usa state.caravanasPagas como set anti-duplicidade.
function renderMapa() {
  const root = document.querySelector("#mapa");
  if (!root) return;

  const team = teams.find(x => x.id === state.selectedTeam);
  const cidade = team ? DATA.cidadeById?.[team.cidadeId] : null;
  if (!cidade?.bairros?.length) {
    root.innerHTML = `<div class="hg-grid"><article class="hg-card" style="grid-column: span 12">
      <header class="hg-card-head"><span class="hg-bar"></span><h2>MAPA</h2></header>
      <div class="tor-body-empty"><p class="muted">Cidade sem bairros mapeados.</p></div>
    </article></div>`;
    return;
  }

  const map = criarMapaGrandePadrao(cidade);
  const filtros = getMapaFiltros();
  const estruturas = coletarEstruturasDaCidade().filter(s => {
    if (s.tipo === "estadio") return filtros.estadios;
    if (s.tipo === "sede") return filtros.sedes;
    if (s.tipo === "bar" || s.tipo === "bar-jogador") return filtros.bares;
    if (s.tipo === "loja-jogador") return filtros.lojas;
    if (s.tipo === "subsede") return filtros.subsedes;
    if (s.isNeutral) return !!filtros[s.tipo];
    return true;
  });
  const zoom = state.mapaZoom || 1;
  const bairros = map.cells.map(c => renderMapaGrandeBairro(c, estruturas)).join("");

  root.innerHTML = `
    <div class="hg-grid">
      <article class="hg-card ag-card" style="grid-column: span 12">
        <header class="hg-card-head"><span class="hg-bar"></span><h2>MAPA - ${cidade.nome.toUpperCase()}</h2></header>
        <div class="ag-toolbar">
          <div><span>Cidade</span><b>${cidade.nome} / ${cidade.estado}</b></div>
          <div><span>Bairros</span><b>${cidade.bairros.length}</b></div>
          <div><span>Locais visiveis</span><b>${estruturas.length}</b></div>
          <div><span>Escala</span><b>Mapa grande padrao</b></div>
        </div>
        <div class="ag-layout">
          <aside class="ag-layers">
            <strong>Camadas</strong>
            ${renderMapaFiltros("")}
            <div class="ag-layer-note">Clique em um quarteirao para ver seu ponto de interesse.</div>
          </aside>
          <div class="ag-viewport">
            <div class="ag-map" style="width:${map.width}px;height:${map.height}px;transform:scale(${zoom});transform-origin:top left;">
              ${renderMapaGrandeImagem(map)}
              ${bairros}
            </div>
            <div class="mapa-zoom ag-zoom">
              <button class="mapa-zoom-btn" data-mapa-zoom="out" title="Diminuir">-</button>
              <span class="mapa-zoom-pct">${Math.round(zoom * 100)}%</span>
              <button class="mapa-zoom-btn" data-mapa-zoom="in" title="Aumentar">+</button>
            </div>
          </div>
        </div>
      </article>
    </div>`;
}

function mapaGrandeAttr(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}

function criarMapaGrandePadrao(cidade) {
  const slots = [
    { x: 116, y: 96,  w: 250, h: 170 }, { x: 410, y: 82,  w: 270, h: 178 },
    { x: 725, y: 96,  w: 250, h: 170 }, { x: 1125,y: 94,  w: 250, h: 172 },
    { x: 82,  y: 302, w: 286, h: 190 }, { x: 410, y: 292, w: 286, h: 198 },
    { x: 728, y: 300, w: 248, h: 190 }, { x: 1138,y: 302, w: 290, h: 198 },
    { x: 128, y: 542, w: 258, h: 188 }, { x: 430, y: 530, w: 280, h: 198 },
    { x: 742, y: 536, w: 246, h: 190 }, { x: 1132,y: 534, w: 282, h: 196 },
    { x: 88,  y: 760, w: 292, h: 178 }, { x: 420, y: 758, w: 286, h: 180 },
    { x: 730, y: 760, w: 262, h: 178 }, { x: 1088,y: 758, w: 318, h: 184 }
  ];
  const zonas = { Norte: [], Oeste: [], Leste: [], Sul: [] };
  cidade.bairros.forEach(b => zonas[b.zonaLabel]?.push(b));
  const bairros = ["Norte", "Oeste", "Leste", "Sul"].flatMap(z => zonas[z]);

  return {
    width: 1536,
    height: 1024,
    cells: bairros.map((bairro, i) => ({
      bairro,
      zona: bairro.zonaLabel || "Centro",
      slot: slots[i % slots.length],
      idx: i
    }))
  };
}

function renderMapaGrandeImagem(map) {
  const w = map.width;
  const h = map.height;
  return `
    <svg class="ag-world" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <rect class="ag-ground" width="${w}" height="${h}"/>
      <path class="ag-forest ag-forest-left" d="M0 0 L120 0 C70 120 126 225 48 350 C120 490 40 640 112 790 C72 900 110 965 40 1024 L0 1024 Z"/>
      <path class="ag-forest ag-forest-top" d="M0 0 H1536 V72 C1320 34 1120 88 930 48 C710 7 590 82 390 42 C230 10 110 72 0 42 Z"/>
      <path class="ag-sea" d="M1392 738 C1488 778 1544 835 1536 1024 H1285 C1300 930 1346 820 1392 738 Z"/>
      <path class="ag-river" d="M1010 -20 C965 120 1056 225 1018 356 C985 472 1042 600 1010 718 C980 828 1035 916 1018 1044"/>
      <path class="ag-river-bank" d="M982 -20 C935 124 1022 226 986 350 C948 478 1002 596 972 720 C945 835 998 930 984 1044"/>
      <path class="ag-river-bank" d="M1044 -20 C1000 120 1092 226 1056 366 C1026 480 1085 604 1048 724 C1018 835 1070 920 1055 1044"/>
      <path class="ag-highway" d="M18 130 C160 88 230 116 338 196 C472 294 604 228 748 255 C846 274 920 330 1000 410 C1128 540 1275 492 1512 424"/>
      <path class="ag-highway" d="M30 910 C180 850 236 734 360 700 C522 654 630 746 780 694 C928 642 1075 718 1230 662 C1360 616 1445 548 1526 556"/>
      <path class="ag-highway" d="M40 28 C95 180 48 300 112 430 C178 565 105 690 150 835 C180 922 265 982 355 1010"/>
      <path class="ag-avenue" d="M90 270 C270 250 394 258 540 245 C700 230 810 300 950 285 C1115 270 1255 214 1455 225"/>
      <path class="ag-avenue" d="M66 520 C238 505 330 552 468 520 C615 486 762 508 902 484 C1080 452 1210 486 1450 468"/>
      <path class="ag-avenue" d="M140 742 C285 714 410 760 562 742 C710 724 815 770 968 754 C1160 735 1290 768 1485 746"/>
      <path class="ag-avenue" d="M386 60 C370 210 420 320 388 458 C350 620 398 740 365 960"/>
      <path class="ag-avenue" d="M704 54 C682 188 748 310 718 455 C690 595 742 730 704 948"/>
      <path class="ag-avenue" d="M1190 54 C1160 178 1210 292 1190 432 C1168 582 1222 742 1195 960"/>
      <path class="ag-local-road" d="M252 108 C210 196 210 275 268 342 C332 414 305 505 250 596 C205 670 210 760 262 886"/>
      <path class="ag-local-road" d="M526 112 C580 206 556 328 530 410 C495 520 555 618 530 742 C514 822 545 890 612 955"/>
      <path class="ag-local-road" d="M850 102 C900 186 875 272 824 344 C770 420 822 520 850 600 C886 704 820 790 848 920"/>
      <path class="ag-local-road" d="M1305 112 C1368 210 1330 330 1288 422 C1240 528 1308 650 1352 730 C1402 820 1355 905 1290 970"/>
      <g class="ag-bridges">
        <rect x="965" y="245" width="120" height="18" rx="4"/>
        <rect x="960" y="487" width="126" height="18" rx="4"/>
        <rect x="958" y="738" width="130" height="18" rx="4"/>
      </g>
      <circle class="ag-roundabout" cx="770" cy="610" r="31"/>
      <circle class="ag-roundabout-core" cx="770" cy="610" r="15"/>
      <circle class="ag-park" cx="570" cy="220" r="34"/>
      <circle class="ag-park" cx="855" cy="412" r="28"/>
      <circle class="ag-park" cx="1218" cy="696" r="33"/>
      <path class="ag-port" d="M1320 895 L1518 878 L1536 1024 L1305 1024 Z"/>
    </svg>`;
}

function renderMapaGrandeBairro(cell, estruturas) {
  const { bairro, zona, slot, idx } = cell;
  const especiais = calcularQuarteiroesEspeciais(bairro.nome, estruturas);
  const blocos = Array.from({ length: MAPA_QUARTEIROES_POR_BAIRRO }, (_, q) =>
    renderMapaGrandeQuarteirao(bairro.nome, q, especiais[q])
  ).join("");
  const rot = ((fnvHash(`rot|${bairro.nome}`) % 5) - 2) * 0.25;
  return `<section class="ag-district ag-zone-${zona.toLowerCase()}"
      style="left:${slot.x}px;top:${slot.y}px;width:${slot.w}px;height:${slot.h}px;--rot:${rot}deg;--idx:${idx}"
      data-bairro="${mapaGrandeAttr(bairro.nome)}"
      data-classe="${mapaGrandeAttr(bairro.classeLabel)}">
    <div class="ag-district-title"><b>${bairro.nome}</b><span>${zona}</span></div>
    <div class="ag-block-grid">${blocos}</div>
  </section>`;
}

function renderMapaGrandeQuarteirao(bairroNome, qIdx, especial) {
  if (especial?.tipo === "estadio") {
    const info = mapaGrandeAttr(`${bairroNome} | Estadio | ${especial.label}`);
    return `<button class="ag-block ag-stadium" data-ag-block data-ag-info="${info}" title="${info}">
      <span class="ag-stadium-field"></span>
      <span class="ag-stadium-icon">${especial.icone}</span>
    </button>`;
  }
  const lots = Array.from({ length: 8 }, (_, i) => {
    const seed = fnvHash(`ag|${bairroNome}|${qIdx}|${i}`);
    const r = ROOF_PALETTE[seed % ROOF_PALETTE.length];
    const tall = seed % 5 === 0 ? " ag-house-tall" : "";
    return `<i class="ag-house${tall}" style="--roof:${r.bg};--line:${r.line}"></i>`;
  }).join("");
  const info = mapaGrandeAttr(`${bairroNome} | Quarteirao ${qIdx + 1}${especial ? " | " + especial.label : ""}`);
  const poiCls = especial ? ` ag-has-poi ag-poi-${especial.tipo} ${especial.isPlayer ? "ag-player" : ""} ${especial.isNeutral ? "ag-neutral" : ""}` : "";
  const pinStyle = especial?.cor ? ` style="--pin:${especial.cor}"` : "";
  const pin = especial ? `<span class="ag-pin"${pinStyle}><b>${especial.icone}</b></span>` : "";
  return `<button class="ag-block${poiCls}" data-ag-block data-ag-info="${info}" title="${info}">
    <span class="ag-lots">${lots}</span>${pin}
  </button>`;
}

// ===========================================================================
// MAPA CANVAS - renderer sem DOM para quarteiroes/lotes
// ===========================================================================
// A UI do jogo continua em HTML, mas o mapa agora e uma superficie unica.
// Isso remove a limitacao de centenas de divs, preserva os dados existentes e
// deixa o caminho aberto para trocar o backend de Canvas 2D por PixiJS depois.

const MAPA_CANVAS_SIZE = 1000;
const MAPA_CANVAS_PAD = 10;
const MAPA_CANVAS_AVENUE = 14;

function mapaCanvasEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}

function filtrarEstruturasMapa(estruturasRaw) {
  const filtros = getMapaFiltros();
  return (estruturasRaw || []).filter(s => {
    if (s.tipo === "estadio") return filtros.estadios;
    if (s.tipo === "sede") return filtros.sedes;
    if (s.tipo === "bar" || s.tipo === "bar-jogador") return filtros.bares;
    if (s.tipo === "loja-jogador") return filtros.lojas;
    if (s.tipo === "subsede") return filtros.subsedes;
    if (s.isNeutral) return !!filtros[s.tipo];
    return true;
  });
}

function getMapaCanvasMetrics(cols, rows) {
  const usable = MAPA_CANVAS_SIZE - MAPA_CANVAS_PAD * 2;
  const cellW = (usable - MAPA_CANVAS_AVENUE * (cols - 1)) / cols;
  const cellH = (usable - MAPA_CANVAS_AVENUE * (rows - 1)) / rows;
  const rectFor = (row, col) => ({
    x: MAPA_CANVAS_PAD + (col - 1) * (cellW + MAPA_CANVAS_AVENUE),
    y: MAPA_CANVAS_PAD + (row - 1) * (cellH + MAPA_CANVAS_AVENUE),
    w: cellW,
    h: cellH
  });
  const gapX = c => MAPA_CANVAS_PAD + c * cellW + (c - 1) * MAPA_CANVAS_AVENUE;
  const gapY = r => MAPA_CANVAS_PAD + r * cellH + (r - 1) * MAPA_CANVAS_AVENUE;
  return { cellW, cellH, rectFor, gapX, gapY };
}

function montarModeloMapaCanvas(cidade, estruturas) {
  const porZona = { Norte: [], Sul: [], Leste: [], Oeste: [] };
  cidade.bairros.forEach(b => porZona[b.zonaLabel]?.push(b));

  const perSide = porZona.Norte.length || Math.ceil(cidade.bairros.length / 4);
  let cols, rows, layout;
  if (perSide === 4) {
    cols = 4; rows = 6;
    layout = {
      Norte: i => ({ row: Math.floor(i / 2) + 1, col: (i % 2) + 2 }),
      Sul:   i => ({ row: Math.floor(i / 2) + 5, col: (i % 2) + 2 }),
      Oeste: i => ({ row: Math.floor(i / 2) + 3, col: (i % 2) + 1 }),
      Leste: i => ({ row: Math.floor(i / 2) + 3, col: (i % 2) + 3 })
    };
  } else if (perSide === 3) {
    cols = 5; rows = 5;
    layout = {
      Norte: i => ({ row: 1,     col: i + 2 }),
      Sul:   i => ({ row: 5,     col: i + 2 }),
      Oeste: i => ({ row: i + 2, col: 1 }),
      Leste: i => ({ row: i + 2, col: 5 })
    };
  } else {
    cols = 2; rows = 4;
    layout = {
      Norte: i => ({ row: 1,     col: i + 1 }),
      Sul:   i => ({ row: 4,     col: i + 1 }),
      Oeste: i => ({ row: i + 2, col: 1 }),
      Leste: i => ({ row: i + 2, col: 2 })
    };
  }

  const metrics = getMapaCanvasMetrics(cols, rows);
  const cornerHide = perSide === 4 ? {
    "Oeste:1": 11, "Oeste:3": 2,
    "Leste:0": 9,  "Leste:2": 0
  } : {};

  const cells = [];
  ["Norte", "Sul", "Oeste", "Leste"].forEach(zona => {
    porZona[zona].forEach((bairro, i) => {
      const pos = layout[zona](i);
      const rect = metrics.rectFor(pos.row, pos.col);
      cells.push({
        ...pos,
        ...rect,
        bairro,
        zona,
        zonaIdx: i,
        cornerOculto: cornerHide[`${zona}:${i}`],
        especiais: calcularQuarteiroesEspeciais(bairro.nome, estruturas)
      });
    });
  });

  return {
    size: MAPA_CANVAS_SIZE,
    cols,
    rows,
    perSide,
    metrics,
    cells,
    hits: [],
    hovered: null
  };
}

function getPoiCanvasStyle(item) {
  const byType = {
    estadio: { color: "#b8322c", text: "E" },
    sede: { color: item?.cor || "#c72a25", text: "S" },
    bar: { color: item?.cor || "#3f7d3a", text: "B" },
    "bar-jogador": { color: "#3f8d48", text: "B" },
    "loja-jogador": { color: "#2f6ea8", text: "L" },
    subsede: { color: "#7a55b0", text: "S" },
    mercadinho: { color: "#4f9a50", text: "M" },
    posto: { color: "#d68425", text: "P" },
    joalheria: { color: "#9160c9", text: "J" },
    roupas: { color: "#2d7eb6", text: "R" },
    banco: { color: "#5a78c5", text: "$" },
    hospital: { color: "#d1d6e0", text: "H", darkText: true }
  };
  return byType[item?.tipo] || { color: "#b8322c", text: "?" };
}

function hexToRgba(hex, alpha) {
  const raw = String(hex || "#ffffff").replace("#", "");
  const full = raw.length === 3 ? raw.split("").map(ch => ch + ch).join("") : raw.padEnd(6, "0").slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(255,255,255,${alpha})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function classeCanvasStyle(classe) {
  if (classe === "Nobre") return { tint: "rgba(160,125,44,.16)", label: "#ffd98a" };
  if (classe === "Classe Alta") return { tint: "rgba(160,125,44,.14)", label: "#ffd98a" };
  if (classe === "Classe Baixa") return { tint: "rgba(130,88,54,.14)", label: "#c9b59a" };
  if (classe === "Favela") return { tint: "rgba(145,72,52,.16)", label: "#bd8772" };
  return { tint: "rgba(130,140,150,.10)", label: "#cfd0d0" };
}

function drawRoundRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawMapaCanvas(model, canvas) {
  if (!model || !canvas) return;
  const dpr = canvas._mapaDpr || 1;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, model.size, model.size);
  model.hits = [];

  drawMapaCanvasBase(ctx, model);
  drawMapaCanvasDecoracoes(ctx, model);
  drawMapaCanvasSinalizacao(ctx, model);
  model.cells.forEach(cell => drawMapaCanvasBairro(ctx, model, cell));
  drawMapaCanvasRotatoria(ctx, model);
  drawMapaCanvasHover(ctx, model);

  ctx.strokeStyle = "rgba(0,0,0,.85)";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, model.size - 4, model.size - 4);
}

function drawMapaCanvasBase(ctx, model) {
  const g = ctx.createLinearGradient(0, 0, 0, model.size);
  g.addColorStop(0, "#2c2c2e");
  g.addColorStop(.58, "#242428");
  g.addColorStop(1, "#1f2023");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, model.size, model.size);

  ctx.fillStyle = "rgba(255,255,255,.018)";
  for (let i = 0; i < 34; i++) {
    const seed = fnvHash(`canvas-noise-${i}`);
    const x = seed % model.size;
    const y = (seed >>> 10) % model.size;
    const r = 14 + (seed % 32);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMapaCanvasDecoracoes(ctx, model) {
  const drawPraia = rect => {
    const sandW = rect.w * .38;
    const waterX = rect.x + sandW;
    const sand = ctx.createLinearGradient(rect.x, rect.y, waterX, rect.y);
    sand.addColorStop(0, "#c6a371");
    sand.addColorStop(1, "#d7b985");
    ctx.fillStyle = sand;
    ctx.fillRect(rect.x, rect.y, sandW, rect.h);
    const sea = ctx.createLinearGradient(waterX, rect.y, rect.x + rect.w, rect.y);
    sea.addColorStop(0, "#2e617d");
    sea.addColorStop(.55, "#1f5275");
    sea.addColorStop(1, "#153c5d");
    ctx.fillStyle = sea;
    ctx.fillRect(waterX, rect.y, rect.w - sandW, rect.h);
    ctx.strokeStyle = "rgba(255,255,255,.12)";
    ctx.lineWidth = 1;
    for (let y = rect.y + 20; y < rect.y + rect.h; y += 28) {
      ctx.beginPath();
      ctx.moveTo(waterX + 10, y);
      ctx.lineTo(rect.x + rect.w - 6, y - 5);
      ctx.stroke();
    }
  };

  const drawRodovia = rect => {
    const g = ctx.createRadialGradient(rect.x + rect.w * .22, rect.y + rect.h * .38, 10, rect.x + rect.w * .22, rect.y + rect.h * .38, rect.w);
    g.addColorStop(0, "#315d2b");
    g.addColorStop(.58, "#1e3c1c");
    g.addColorStop(1, "#14271a");
    ctx.fillStyle = g;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    ctx.strokeStyle = "#292a2c";
    ctx.lineWidth = 28;
    ctx.beginPath();
    ctx.moveTo(rect.x - 20, rect.y + rect.h + 12);
    ctx.lineTo(rect.x + rect.w * .55, rect.y + rect.h * .48);
    ctx.lineTo(rect.x + rect.w + 22, rect.y - 10);
    ctx.stroke();
    ctx.strokeStyle = "rgba(230,188,74,.72)";
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 18]);
    ctx.beginPath();
    ctx.moveTo(rect.x - 20, rect.y + rect.h + 12);
    ctx.lineTo(rect.x + rect.w * .55, rect.y + rect.h * .48);
    ctx.lineTo(rect.x + rect.w + 22, rect.y - 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    for (let i = 0; i < 8; i++) {
      const seed = fnvHash(`tree-${i}-${rect.x}-${rect.y}`);
      ctx.fillStyle = seed % 2 ? "#376c30" : "#285723";
      ctx.beginPath();
      ctx.arc(rect.x + (seed % Math.max(1, rect.w)), rect.y + ((seed >>> 8) % Math.max(1, rect.h)), 5 + (seed % 5), 0, Math.PI * 2);
      ctx.fill();
    }
  };

  if (model.perSide === 4) {
    const topPraia = model.metrics.rectFor(1, model.cols);
    const bottomPraia = model.metrics.rectFor(model.rows - 1, model.cols);
    drawPraia({ x: topPraia.x, y: topPraia.y, w: topPraia.w, h: model.metrics.cellH * 2 + MAPA_CANVAS_AVENUE });
    drawPraia({ x: bottomPraia.x, y: bottomPraia.y, w: bottomPraia.w, h: model.metrics.cellH * 2 + MAPA_CANVAS_AVENUE });
    drawRodovia({
      x: model.metrics.rectFor(model.rows - 1, 1).x,
      y: model.metrics.rectFor(model.rows - 1, 1).y,
      w: model.metrics.cellW,
      h: model.metrics.cellH * 2 + MAPA_CANVAS_AVENUE
    });
  } else if (model.perSide === 3) {
    drawPraia(model.metrics.rectFor(1, model.cols));
    drawPraia(model.metrics.rectFor(model.rows, model.cols));
    drawRodovia(model.metrics.rectFor(model.rows, 1));
  }
}

function drawMapaCanvasSinalizacao(ctx, model) {
  const { cols, rows, metrics } = model;
  const laneClearance = 42;

  // Mapa de células com bairro (cidade real). Avenidas e zebras só aparecem
  // se houver bairro de pelo menos um lado do gap — assim não invadem praia,
  // rodovia, vegetação nem o quadrante do filtro.
  const cityCells = new Set(model.cells.map(c => `${c.row}|${c.col}`));
  const isCity = (r, c) => cityCells.has(`${r}|${c}`);

  function lane(x1, y1, x2, y2) {
    if (Math.hypot(x2 - x1, y2 - y1) < 24) return;
    ctx.strokeStyle = "rgba(0,0,0,.38)";
    ctx.lineWidth = 4;
    ctx.setLineDash([17, 19]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = "rgba(230,188,74,.72)";
    ctx.lineWidth = 2;
    ctx.setLineDash([15, 21]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Avenidas verticais — entre col c e c+1, segmento por linha
  for (let c = 1; c < cols; c++) {
    const mid = metrics.gapX(c) + MAPA_CANVAS_AVENUE / 2;
    for (let r = 1; r <= rows; r++) {
      if (!isCity(r, c) && !isCity(r, c + 1)) continue;
      const startY = r === 1
        ? MAPA_CANVAS_PAD
        : metrics.gapY(r - 1) + MAPA_CANVAS_AVENUE + laneClearance;
      const endY = r === rows
        ? model.size - MAPA_CANVAS_PAD
        : metrics.gapY(r) - laneClearance;
      lane(mid, startY, mid, endY);
    }
  }
  // Avenidas horizontais — entre row r e r+1, segmento por coluna
  for (let r = 1; r < rows; r++) {
    const mid = metrics.gapY(r) + MAPA_CANVAS_AVENUE / 2;
    for (let c = 1; c <= cols; c++) {
      if (!isCity(r, c) && !isCity(r + 1, c)) continue;
      const startX = c === 1
        ? MAPA_CANVAS_PAD
        : metrics.gapX(c - 1) + MAPA_CANVAS_AVENUE + laneClearance;
      const endX = c === cols
        ? model.size - MAPA_CANVAS_PAD
        : metrics.gapX(c) - laneClearance;
      lane(startX, mid, endX, mid);
    }
  }

  const stripeCount = 5;
  const stripe = 3.6;
  const stripeGap = 3.2;
  const crossLen = stripeCount * stripe + (stripeCount - 1) * stripeGap;
  const overhang = 4;

  function verticalZebra(xCenter, y, seed) {
    const startY = y + (MAPA_CANVAS_AVENUE + overhang * 2 - crossLen) / 2;
    for (let s = 0; s < stripeCount; s++) {
      ctx.globalAlpha = .88 - ((seed + s) % 3) * .05;
      ctx.fillStyle = "rgba(235,232,216,1)";
      ctx.fillRect(xCenter - 11, startY + s * (stripe + stripeGap), 22, stripe);
    }
    ctx.globalAlpha = 1;
  }
  function horizontalZebra(x, yCenter, seed) {
    const startX = x + (MAPA_CANVAS_AVENUE + overhang * 2 - crossLen) / 2;
    for (let s = 0; s < stripeCount; s++) {
      ctx.globalAlpha = .88 - ((seed + s) % 3) * .05;
      ctx.fillStyle = "rgba(235,232,216,1)";
      ctx.fillRect(startX + s * (stripe + stripeGap), yCenter - 11, stripe, 22);
    }
    ctx.globalAlpha = 1;
  }

  // Faixas de pedestre — só nas esquinas onde existe bairro chegando pela direção
  for (let c = 1; c < cols; c++) {
    const vc = metrics.gapX(c) + MAPA_CANVAS_AVENUE / 2;
    for (let r = 1; r < rows; r++) {
      const hc = metrics.gapY(r) + MAPA_CANVAS_AVENUE / 2;
      const seed = c * 11 + r * 7;
      // Norte (acima da intersecção): chega da row r — precisa ter bairro nas cols c ou c+1
      if (isCity(r, c) || isCity(r, c + 1)) {
        verticalZebra(vc - 22, metrics.gapY(r) - overhang, seed);
        verticalZebra(vc + 22, metrics.gapY(r) - overhang, seed + 1);
      }
      // Oeste (à esquerda): chega da col c — precisa ter bairro nas rows r ou r+1
      if (isCity(r, c) || isCity(r + 1, c)) {
        horizontalZebra(metrics.gapX(c) - overhang, hc - 22, seed + 2);
        horizontalZebra(metrics.gapX(c) - overhang, hc + 22, seed + 3);
      }
    }
  }
}

function drawMapaCanvasBairro(ctx, model, cell) {
  const style = classeCanvasStyle(cell.bairro.classeLabel);
  ctx.fillStyle = "#2c2c2e";
  ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
  ctx.fillStyle = style.tint;
  ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
  ctx.strokeStyle = "rgba(0,0,0,.55)";
  ctx.lineWidth = 1;
  ctx.strokeRect(cell.x + .5, cell.y + .5, cell.w - 1, cell.h - 1);

  const pad = 5;
  const gap = 5;
  const innerX = cell.x + pad;
  const innerY = cell.y + pad;
  const innerW = cell.w - pad * 2;
  const innerH = cell.h - pad * 2;
  const blockW = (innerW - gap * 2) / 3;
  const blockH = (innerH - gap * 3) / 4;

  for (let q = 0; q < MAPA_QUARTEIROES_POR_BAIRRO; q++) {
    if (q === cell.cornerOculto) continue;
    const col = q % 3;
    const row = Math.floor(q / 3);
    const x = innerX + col * (blockW + gap);
    const y = innerY + row * (blockH + gap);
    drawMapaCanvasQuarteirao(ctx, model, cell, q, x, y, blockW, blockH, cell.especiais[q]);
  }

  const label = String(cell.bairro.nome || "").toUpperCase();
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let fontSize = 16;
  ctx.font = `900 ${fontSize}px Arial, sans-serif`;
  while (ctx.measureText(label).width > cell.w - 18 && fontSize > 8) {
    fontSize -= 1;
    ctx.font = `900 ${fontSize}px Arial, sans-serif`;
  }
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(0,0,0,.92)";
  ctx.fillStyle = style.label;
  ctx.strokeText(label, cell.x + cell.w / 2, cell.y + cell.h / 2);
  ctx.fillText(label, cell.x + cell.w / 2, cell.y + cell.h / 2);
  ctx.restore();
}

function drawMapaCanvasQuarteirao(ctx, model, cell, qIdx, x, y, w, h, especial) {
  const info = `${cell.bairro.nome} | Quarteirao ${qIdx + 1}${especial ? " | " + especial.label : ""}`;
  model.hits.push({ x, y, w, h, info, tipo: especial?.tipo || "residencial" });

  ctx.fillStyle = "#252528";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#151517";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);

  if (especial?.tipo === "estadio") {
    drawMapaCanvasEstadio(ctx, x, y, w, h, especial);
    return;
  }

  const lotGap = 1;
  const lotW = (w - 2 - lotGap * 4) / 5;
  const lotH = (h - 2 - lotGap) / 2;
  const target = especial?.loteIdx ?? -1;

  for (let i = 0; i < MAPA_LOTES_POR_QUARTEIRAO; i++) {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const lx = x + 1 + col * (lotW + lotGap);
    const ly = y + 1 + row * (lotH + lotGap);
    if (especial && i === target) {
      drawMapaCanvasPoiLote(ctx, model, lx, ly, lotW, lotH, especial, info);
    } else {
      drawMapaCanvasCasa(ctx, cell.bairro.nome, qIdx, i, lx, ly, lotW, lotH);
    }
  }
}

function drawMapaCanvasCasa(ctx, bairroNome, qIdx, loteIdx, x, y, w, h) {
  const seed = fnvHash(`canvas|${bairroNome}|${qIdx}|${loteIdx}`);
  const roof = ROOF_PALETTE[seed % ROOF_PALETTE.length];
  ctx.fillStyle = roof.bg;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(0,0,0,.45)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
  ctx.strokeStyle = roof.line;
  ctx.globalAlpha = .75;
  if ((seed >>> 3) % 2) {
    ctx.beginPath(); ctx.moveTo(x + w * .5, y + 2); ctx.lineTo(x + w * .5, y + h - 2); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(x + 2, y + h * .5); ctx.lineTo(x + w - 2, y + h * .5); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawMapaCanvasPoiLote(ctx, model, x, y, w, h, item, info) {
  const poi = getPoiCanvasStyle(item);
  const bg = item.cor && (item.tipo === "sede" || item.tipo === "bar") ? item.cor : poi.color;
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.fillRect(x, y + h * .55, w, h * .45);
  ctx.strokeStyle = "rgba(0,0,0,.65)";
  ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
  drawMapaCanvasPin(ctx, x + w - 3, y + 3, Math.max(8, Math.min(12, w * .42)), item);
  model.hits.push({ x, y, w, h, info, tipo: item.tipo });
}

function drawMapaCanvasEstadio(ctx, x, y, w, h, item) {
  const grd = ctx.createLinearGradient(x, y, x, y + h);
  grd.addColorStop(0, "#53231b");
  grd.addColorStop(1, "#26100d");
  ctx.fillStyle = grd;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#b8322c";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  ctx.fillStyle = "#173d1e";
  drawRoundRect(ctx, x + w * .22, y + h * .24, w * .56, h * .52, 3);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.55)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + w * .31, y + h * .34, w * .38, h * .32);
  drawMapaCanvasPin(ctx, x + w / 2, y + h / 2, Math.max(15, Math.min(24, Math.min(w, h) * .28)), item);
}

function drawMapaCanvasPin(ctx, cx, cy, r, item) {
  const poi = getPoiCanvasStyle(item);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = poi.color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,.70)";
  ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,.65)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = poi.darkText ? "#101010" : "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.max(7, r * .95)}px Arial, sans-serif`;
  ctx.fillText(poi.text, cx, cy + .5);
  ctx.restore();
}

function drawMapaCanvasRotatoria(ctx, model) {
  if (model.perSide < 3) return;
  const cx = model.size / 2;
  const cy = model.size / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, 45, 0, Math.PI * 2);
  ctx.fillStyle = "#242426";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#19191b";
  ctx.stroke();
  const g = ctx.createRadialGradient(cx - 8, cy - 9, 4, cx, cy, 35);
  g.addColorStop(0, "#3d7835");
  g.addColorStop(1, "#17351a");
  ctx.beginPath();
  ctx.arc(cx, cy, 32, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.45)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawMapaCanvasHover(ctx, model) {
  const hit = model.hovered;
  if (!hit) return;
  ctx.save();
  ctx.strokeStyle = hit.tipo === "residencial" ? "rgba(245,245,230,.65)" : "rgba(213,58,49,.95)";
  ctx.lineWidth = hit.tipo === "residencial" ? 2 : 3;
  ctx.setLineDash(hit.tipo === "residencial" ? [5, 4] : []);
  ctx.strokeRect(hit.x - 1.5, hit.y - 1.5, hit.w + 3, hit.h + 3);
  ctx.restore();
}

function mapaCanvasHit(model, x, y) {
  for (let i = model.hits.length - 1; i >= 0; i--) {
    const h = model.hits[i];
    if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h;
  }
  return null;
}

function initMapaCanvas(canvas, tooltip, model) {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas._mapaDpr = dpr;
  canvas._mapaModel = model;
  canvas.width = Math.round(model.size * dpr);
  canvas.height = Math.round(model.size * dpr);
  drawMapaCanvas(model, canvas);

  const pointFromEvent = event => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (model.size / rect.width),
      y: (event.clientY - rect.top) * (model.size / rect.height)
    };
  };

  const moveTooltip = event => {
    if (!tooltip || !model.hovered) return;
    const shell = canvas.parentElement.getBoundingClientRect();
    tooltip.textContent = model.hovered.info;
    tooltip.style.left = `${event.clientX - shell.left + 16}px`;
    tooltip.style.top = `${event.clientY - shell.top + 16}px`;
    tooltip.classList.add("show");
  };

  canvas.addEventListener("mousemove", event => {
    const p = pointFromEvent(event);
    const hit = mapaCanvasHit(model, p.x, p.y);
    const changed = (hit?.info || "") !== (model.hovered?.info || "")
      || Math.abs((hit?.x || 0) - (model.hovered?.x || 0)) > .01
      || Math.abs((hit?.y || 0) - (model.hovered?.y || 0)) > .01;
    if (changed) {
      model.hovered = hit;
      canvas.style.cursor = hit ? "pointer" : "default";
      drawMapaCanvas(model, canvas);
    }
    moveTooltip(event);
  });

  canvas.addEventListener("mouseleave", () => {
    model.hovered = null;
    canvas.style.cursor = "default";
    tooltip?.classList.remove("show");
    drawMapaCanvas(model, canvas);
  });

  canvas.addEventListener("click", event => {
    const p = pointFromEvent(event);
    const hit = mapaCanvasHit(model, p.x, p.y);
    if (hit) toast(hit.info);
  });
}

function renderMapaCanvas() {
  const root = document.querySelector("#mapa");
  if (!root) return;

  const team = teams.find(x => x.id === state.selectedTeam);
  const cidade = team ? DATA.cidadeById?.[team.cidadeId] : null;
  if (!cidade?.bairros?.length) {
    root.innerHTML = `<div class="hg-grid"><article class="hg-card" style="grid-column: span 12">
      <header class="hg-card-head"><span class="hg-bar"></span><h2>MAPA</h2></header>
      <div class="tor-body-empty"><p class="muted">Cidade sem bairros mapeados.</p></div>
    </article></div>`;
    return;
  }

  const torcida = DATA.torcidaById?.[team?.torcidaId];
  const tamanhoMapa = cidade.nivelMapa === 1 ? "Grande" : cidade.nivelMapa === 2 ? "Medio" : "Pequeno";
  const estruturasRaw = coletarEstruturasDaCidade();
  const estruturas = filtrarEstruturasMapa(estruturasRaw);
  const model = montarModeloMapaCanvas(cidade, estruturas);
  const zoom = state.mapaZoom || 1;
  const totalQuarteiroes = cidade.bairros.length * MAPA_QUARTEIROES_POR_BAIRRO;
  const totalLotes = totalQuarteiroes * MAPA_LOTES_POR_QUARTEIRAO;

  // Posiciona o painel de filtros sobre o canto superior esquerdo vazio do mapa
  // (a oeste da Zona Norte, a norte da Zona Oeste). Calcula em coordenadas do
  // canvas e converte para CSS multiplicando pelo zoom.
  const filtroRect = (() => {
    const m = model.metrics;
    if (model.perSide === 4) {
      const r = m.rectFor(1, 1);
      return { x: r.x, y: r.y, w: r.w, h: m.cellH * 2 + MAPA_CANVAS_AVENUE };
    } else if (model.perSide === 3) {
      return m.rectFor(1, 1);
    }
    return null; // perSide 2 — sem espaço, filtro em overlay flutuante
  })();
  const filtroStyle = filtroRect
    ? `position:absolute; left:${filtroRect.x * zoom}px; top:${filtroRect.y * zoom}px; width:${filtroRect.w * zoom}px; height:${filtroRect.h * zoom}px;`
    : `position:absolute; left:8px; top:8px; width:220px;`;

  root.innerHTML = `
    <div class="hg-grid">
      <article class="hg-card mapa-canvas-card" style="grid-column: span 12">
        <header class="hg-card-head"><span class="hg-bar"></span><h2>MAPA - ${mapaCanvasEscape(cidade.nome).toUpperCase()}</h2></header>
        <div class="mapa-canvas-toolbar">
          <div><span>Cidade</span><b>${mapaCanvasEscape(cidade.nome)} / ${mapaCanvasEscape(cidade.estado)}</b></div>
          <div><span>Tamanho</span><b>${tamanhoMapa}</b></div>
          <div><span>Bairros</span><b>${cidade.bairros.length}</b></div>
          <div><span>Quarteiroes</span><b>${totalQuarteiroes}</b></div>
          <div><span>Lotes</span><b>${totalLotes}</b></div>
          <div><span>Sede</span><b>${mapaCanvasEscape(torcida?.bairroSede || "-")}</b></div>
        </div>
        <div class="mapa-canvas-viewport">
          <div class="mapa-canvas-shell" style="width:${MAPA_CANVAS_SIZE * zoom}px;height:${MAPA_CANVAS_SIZE * zoom}px">
            <canvas id="mapaCanvas" class="mapa-canvas" style="width:${MAPA_CANVAS_SIZE * zoom}px;height:${MAPA_CANVAS_SIZE * zoom}px" aria-label="Mapa da cidade"></canvas>
            ${renderMapaFiltros(filtroStyle)}
            <div class="mapa-zoom mapa-canvas-zoom" style="position:absolute; top:14px; right:14px;">
              <button class="mapa-zoom-btn" data-mapa-zoom="out" title="Diminuir">-</button>
              <span class="mapa-zoom-pct">${Math.round(zoom * 100)}%</span>
              <button class="mapa-zoom-btn" data-mapa-zoom="in" title="Aumentar">+</button>
            </div>
            <div id="mapaCanvasTooltip" class="mapa-canvas-tooltip" role="status"></div>
          </div>
        </div>
      </article>
    </div>`;

  requestAnimationFrame(() => {
    const canvas = document.querySelector("#mapaCanvas");
    const tooltip = document.querySelector("#mapaCanvasTooltip");
    if (canvas) initMapaCanvas(canvas, tooltip, model);
  });
}

function renderMapa() {
  renderMapaCanvas();
}

function processarDespesaCaravana() {
  const p = state.player;
  if (!p) return;
  state.caravanasPagas = state.caravanasPagas || {};
  const matches = getPlayerCalendarMatches();
  const hojeISO = state.date;
  for (const m of matches) {
    if (m.isHome || m.mesmaCidade) continue;
    const md = new Date(m.data);
    const ida = new Date(md); ida.setDate(ida.getDate() - 1);
    const idaISO = `${ida.getFullYear()}-${String(ida.getMonth()+1).padStart(2,"0")}-${String(ida.getDate()).padStart(2,"0")}`;
    if (idaISO !== hojeISO) continue;
    const matchKey = m.id || `${m.data}|${m.opponentName || ""}`;
    if (state.caravanasPagas[matchKey]) continue;
    const custo = 3000;
    const destino = m.opponentCity || m.opponentName || "fora de casa";
    if (p.saldo < custo) {
      addMessage("Assessor", `Sem grana pra caravana até ${destino} (precisa ${BRL.format(custo)}). Vamos com grupo reduzido.`);
      addNews(`SUA TORCIDA: ${p.nome} não organizou caravana fora de casa`);
      state.caravanasPagas[matchKey] = "skip";
      continue;
    }
    registrarTransacao(`Caravana para ${destino}`, -custo, "Caravana");
    state.caravanasPagas[matchKey] = "paga";
    addNews(`ESTRADA: caravana da ${p.nome} sai rumo a ${destino}`);
    addMessage("Responsável da Caravana", `Saímos amanhã pra ${destino}. Custo da operação: ${BRL.format(custo)}.`);
  }
}

function executarPlanoOuRotinaDoDia() {
  if (state.travel) return;
  const cal = state.calendario;
  if (!cal) return;
  // Não roda se for dia de jogo
  const matchesHoje = getPlayerCalendarMatches().filter(m => m.data.slice(0, 10) === state.date);
  if (matchesHoje.length) return;
  // Não roda em dia de caravana — recalcula caravanaDays
  const matches = getPlayerCalendarMatches();
  for (const m of matches) {
    if (m.isHome || m.mesmaCidade) continue;
    const md = new Date(m.data);
    const ida = new Date(md); ida.setDate(ida.getDate() - 1);
    const volta = new Date(md); volta.setDate(volta.getDate() + 1);
    const idaIso = `${ida.getFullYear()}-${String(ida.getMonth()+1).padStart(2,"0")}-${String(ida.getDate()).padStart(2,"0")}`;
    const voltaIso = `${volta.getFullYear()}-${String(volta.getMonth()+1).padStart(2,"0")}-${String(volta.getDate()).padStart(2,"0")}`;
    if (state.date === idaIso || state.date === voltaIso) return;
  }
  if (state.player.acoes <= 0) return;
  const plano = cal.planos?.[state.date];
  const wd = new Date(state.date + "T12:00:00").getDay();
  const rotina = cal.rotinaSemanal?.[wd];
  const acao = plano || rotina;
  if (!acao || !actionHandlers[acao]) return;
  // Para "treinar" especificamente, roda em modo auto (random)
  if (acao === "treinar") {
    actionHandlers.treinar("auto");
  } else if (acao === "recrutar") {
    const calc = calcularRecrutamentoPotencial();
    if (calc.espaco <= 0) {
      addMessage("Assessor", "Sede cheia — recrutamento da rotina pulado hoje.");
      return;
    }
    if (!spendAction()) return;
    executarRecrutamento({ origem: "rotina" });
  } else {
    actionHandlers[acao]();
  }
}

function getCalendarioResumo(numDays = 7) {
  state.calendario = state.calendario || { planos: {}, rotinaSemanal: {} };
  state.calendario.rotinaSemanal = state.calendario.rotinaSemanal || {};
  const matches = getPlayerCalendarMatches();
  const matchesByDate = {};
  matches.forEach(m => {
    const k = m.data.slice(0, 10);
    matchesByDate[k] = matchesByDate[k] || [];
    matchesByDate[k].push(m);
  });
  // Caravana days
  const caravanaDays = {};
  matches.forEach(m => {
    if (m.isHome || m.mesmaCidade) return;
    const md = new Date(m.data);
    const isoDia = (offset) => {
      const dx = new Date(md);
      dx.setDate(dx.getDate() + offset);
      return `${dx.getFullYear()}-${String(dx.getMonth()+1).padStart(2,"0")}-${String(dx.getDate()).padStart(2,"0")}`;
    };
    caravanaDays[isoDia(-1)] = "IDA · " + (m.opponentCity || "fora");
    caravanaDays[isoDia(1)]  = "VOLTA · " + (m.opponentCity || "fora");
  });

  const today = new Date(state.date + "T12:00:00");
  const days = [];
  for (let i = 0; i < numDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const wd = ["DOM","SEG","TER","QUA","QUI","SEX","SÁB"][d.getDay()];
    const dia = String(d.getDate()).padStart(2,"0");
    const mes = String(d.getMonth()+1).padStart(2,"0");
    const matchList = matchesByDate[iso] || [];
    const caravana = caravanaDays[iso] || null;
    const plano = state.calendario.planos[iso] || null;
    const rotina = state.calendario.rotinaSemanal[d.getDay()] || null;

    let tipo = "vazio";
    let label = "—";
    if (matchList.length) {
      const m = matchList[0];
      tipo = "match";
      label = `${m.isHome ? "vs" : "@"} ${m.opponentName} (${m.competicao})`;
    } else if (caravana) {
      tipo = "caravana";
      label = `🚌 ${caravana}`;
    } else if (plano) {
      tipo = "plano";
      const a = CAL_ACOES_DISPONIVEIS.find(x => x.id === plano);
      label = `▸ ${a ? a.label : plano}`;
    } else if (rotina) {
      tipo = "rotina";
      const a = CAL_ACOES_DISPONIVEIS.find(x => x.id === rotina);
      label = `↻ ${a ? a.label : rotina}`;
    }

    days.push({ iso, wd, dia, mes, tipo, label, isToday: i === 0 });
  }
  return days;
}

function getPlayerCalendarMatches(targetTimeId) {
  const playerTeam = teams.find(t => t.id === state.selectedTeam);
  // Se não passar timeId, usa o time do jogador (compatibilidade)
  const timeId = targetTimeId || playerTeam?.timeId;
  if (!timeId) return [];
  [1, 2, 3, 4].forEach(div => ensureCompetition(div));
  ensureCopa();
  // Acha o time alvo (pra divisão e cidade)
  const targetTeam = teams.find(t => t.timeId === timeId) || playerTeam;
  const divisao = targetTeam?.divisao || 1;
  const targetCidade = targetTeam?.cidade;
  const matches = [];
  const compLiga = state.compState[`serie${divisao}`];
  if (compLiga) {
    compLiga.rounds.forEach(round => {
      round.forEach(m => {
        if (m.home === timeId || m.away === timeId) {
          const opponentId = m.home === timeId ? m.away : m.home;
          const oppTeam = teams.find(t => t.timeId === opponentId);
          matches.push({
            data: m.data, home: m.home, away: m.away,
            g1: m.g1, g2: m.g2, jogada: m.jogada,
            competicao: ["Série A","Série B","Série C","Série D"][divisao - 1],
            faseLabel: `Rodada ${m.rodada}`,
            isHome: m.home === timeId,
            opponentName: oppTeam?.nome || opponentId,
            opponentColor: oppTeam?.cor || "#a51f1c",
            opponentCity: oppTeam?.cidade || "?",
            mesmaCidade: oppTeam?.cidade === targetCidade,
            penaltis: null,
            source: "liga"
          });
        }
      });
    });
  }
  const copa = state.compState.copa;
  if (copa) {
    copa.partidas.forEach(m => {
      if (m.home === timeId || m.away === timeId) {
        const opponentId = m.home === timeId ? m.away : m.home;
        const oppTeam = teams.find(t => t.timeId === opponentId);
        matches.push({
          data: m.data, home: m.home, away: m.away,
          g1: m.g1, g2: m.g2, jogada: m.jogada,
          penaltis: m.penaltis,
          competicao: "Copa do Brasil",
          faseLabel: m.faseLabel,
          isHome: m.home === timeId,
          opponentName: oppTeam?.nome || opponentId,
          opponentColor: oppTeam?.cor || "#a51f1c",
          opponentCity: oppTeam?.cidade || "?",
          mesmaCidade: oppTeam?.cidade === targetCidade,
          source: "copa"
        });
      }
    });
  }
  matches.sort((a, b) => new Date(a.data) - new Date(b.data));
  return matches;
}

const CAL_ACOES_DISPONIVEIS = [
  { id: "treinar",        label: "Treinar membros" },
  { id: "recrutar",       label: "Recrutar" },
  { id: "reuniaoInterna", label: "Reunião interna" },
  { id: "social",         label: "Ação social" },
  { id: "descanso",       label: "Descanso" },
  { id: "festaPreJogo",   label: "Festa pré-jogo" },
  { id: "pagode",         label: "Pagode" },
  { id: "ataque",         label: "Planejar confronto" }
];

function renderCalendario() {
  const sub = state.calSubtab || "torcida";
  const tabBtn = (id, label) => `<button class="tor-tab ${sub === id ? "active" : ""}" data-cal-subtab="${id}">${label}</button>`;
  const body = sub === "agenda" ? renderCalendarioAgenda()
            : sub === "rotina"  ? renderCalendarioRotina()
            : renderCalendarioGrid();
  document.querySelector("#calendario").innerHTML = `
    <div class="hg-grid">
      <article class="hg-card" style="grid-column: span 12">
        <header class="hg-card-head"><span class="hg-bar"></span><h2>CALENDÁRIO</h2></header>
        <div class="tor-tabs">
          ${tabBtn("torcida", "CALENDÁRIO DA TORCIDA")}
          ${tabBtn("rotina", "ROTINA SEMANAL")}
          ${tabBtn("agenda", "AGENDA DO TIME")}
        </div>
        ${body}
      </article>
    </div>`;
}

function renderCalendarioRotina() {
  state.calendario = state.calendario || { planos: {}, rotinaSemanal: {} };
  state.calendario.rotinaSemanal = state.calendario.rotinaSemanal || {};
  const rotina = state.calendario.rotinaSemanal;
  const dias = [
    { id: 0, label: "DOMINGO" },
    { id: 1, label: "SEGUNDA" },
    { id: 2, label: "TERÇA" },
    { id: 3, label: "QUARTA" },
    { id: 4, label: "QUINTA" },
    { id: 5, label: "SEXTA" },
    { id: 6, label: "SÁBADO" }
  ];

  const linha = d => {
    const sel = rotina[d.id] || "";
    return `<div class="rotina-row">
      <div class="rotina-day">${d.label}</div>
      <select class="rotina-select" data-rotina-dia="${d.id}">
        <option value="">— sem ação —</option>
        ${CAL_ACOES_DISPONIVEIS.map(a => `<option value="${a.id}" ${sel === a.id ? "selected" : ""}>${a.label}</option>`).join("")}
      </select>
    </div>`;
  };

  return `
    <div class="rotina-body">
      <p class="rotina-info">
        Defina sua <b>rotina semanal padrão</b>. Cada dia da semana ganha uma ação que será aplicada automaticamente ao calendário.<br>
        <small class="muted">Em dias com jogo ou caravana, a rotina é ignorada. Você pode sobrescrever um dia específico clicando nele no calendário.</small>
      </p>
      <div class="rotina-list">
        ${dias.map(linha).join("")}
      </div>
      <div class="rotina-acoes">
        <button class="hg-cta" id="rotinaLimpar">LIMPAR ROTINA</button>
      </div>
    </div>
  `;
}

function renderCalendarioGrid() {
  const today = new Date(state.date + "T12:00:00");
  const view = state.calView ? new Date(state.calView + "T12:00:00") : new Date(today.getFullYear(), today.getMonth(), 1);
  const ano = view.getFullYear();
  const mes = view.getMonth();
  const meses = ["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
  const firstOfMonth = new Date(ano, mes, 1);
  const startWeekday = firstOfMonth.getDay();

  state.calendario = state.calendario || { planos: {} };
  const matches = getPlayerCalendarMatches();
  const matchesByDate = {};
  matches.forEach(m => {
    const k = m.data.slice(0, 10);
    matchesByDate[k] = matchesByDate[k] || [];
    matchesByDate[k].push(m);
  });

  // Mapa de dias de caravana — só pra jogo fora em outra cidade
  const caravanaDays = {};
  matches.forEach(m => {
    if (m.isHome) return;
    if (m.mesmaCidade) return;
    const md = new Date(m.data);
    const isoDia = (offset) => {
      const dx = new Date(md);
      dx.setDate(dx.getDate() + offset);
      return `${dx.getFullYear()}-${String(dx.getMonth()+1).padStart(2,"0")}-${String(dx.getDate()).padStart(2,"0")}`;
    };
    caravanaDays[isoDia(-1)] = "IDA · " + (m.opponentCity || "fora");
    caravanaDays[isoDia(1)]  = "VOLTA · " + (m.opponentCity || "fora");
  });

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(ano, mes, 1 + i - startWeekday);
    const isCurrentMonth = d.getMonth() === mes;
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const isToday = iso === state.date;
    const isPast = iso < state.date;
    const matchList = matchesByDate[iso] || [];
    const plano = state.calendario.planos[iso] || null;
    const caravana = caravanaDays[iso] || null;
    // Rotina semanal aplica-se quando não há plano manual, jogo nem caravana
    const rotinaSemanal = state.calendario.rotinaSemanal || {};
    const planoRotina = (!plano && !caravana && matchList.length === 0)
      ? (rotinaSemanal[d.getDay()] || null)
      : null;
    cells.push({ d, dia: d.getDate(), isCurrentMonth, iso, isToday, isPast, matches: matchList, plano, caravana, planoRotina });
  }

  const prevMonth = `${ano}-${String(mes).padStart(2,"0")}-01`;
  const nextMonth = `${ano}-${String(mes+2).padStart(2,"0")}-01`;
  const fixDate = (s) => {
    const d = new Date(s);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`;
  };

  return `
    <div class="cal-body">
      <header class="comp-section-head">
        <button class="comp-arrow" data-cal-view="${fixDate(new Date(ano, mes - 1, 1))}">‹</button>
        <h3>${meses[mes]} <small>de ${ano}</small></h3>
        <button class="comp-arrow" data-cal-view="${fixDate(new Date(ano, mes + 1, 1))}">›</button>
      </header>
      <div class="cal-grid">
        <div class="cal-head">DOM</div>
        <div class="cal-head">SEG</div>
        <div class="cal-head">TER</div>
        <div class="cal-head">QUA</div>
        <div class="cal-head">QUI</div>
        <div class="cal-head">SEX</div>
        <div class="cal-head">SÁB</div>
        ${cells.map(c => {
          const cls = [
            "cal-cell",
            c.isCurrentMonth ? "" : "cal-cell-other",
            c.isToday ? "cal-cell-today" : "",
            c.isPast ? "cal-cell-past" : "",
            c.matches.length ? "cal-cell-match" : "",
            c.plano && !c.caravana ? "cal-cell-plan" : "",
            c.caravana ? "cal-cell-caravana" : ""
          ].filter(Boolean).join(" ");
          const matchTag = c.matches[0] ? `
            <div class="cal-match-tag">
              <span class="cal-match-dot" style="background:${c.matches[0].opponentColor}"></span>
              <small>${c.matches[0].isHome ? "vs" : "@"} ${c.matches[0].opponentName.slice(0, 12)}</small>
            </div>` : "";
          const caravanaTag = c.caravana ? `<div class="cal-caravana-tag">🚌 CARAVANA<small>${c.caravana}</small></div>` : "";
          const planoLabel = c.plano ? CAL_ACOES_DISPONIVEIS.find(a => a.id === c.plano)?.label || c.plano : "";
          const planoTag = (c.plano && !c.caravana) ? `<div class="cal-plan-tag">▸ ${planoLabel}</div>` : "";
          // Rotina (visual mais discreto, com ↻ pra indicar recorrente)
          const rotinaLabel = c.planoRotina ? CAL_ACOES_DISPONIVEIS.find(a => a.id === c.planoRotina)?.label || c.planoRotina : "";
          const rotinaTag = c.planoRotina ? `<div class="cal-rotina-tag">↻ ${rotinaLabel}</div>` : "";
          // Caravana e dias de jogo não abrem o modal de planejar
          const dataAttr = (c.caravana || c.matches.length) ? "" : `data-cal-day="${c.iso}"`;
          return `<div class="${cls}" ${dataAttr}>
            <div class="cal-day-num">${c.dia}</div>
            ${matchTag}
            ${caravanaTag}
            ${planoTag}
            ${rotinaTag}
          </div>`;
        }).join("")}
      </div>
      <small class="cal-legend">
        <span class="cal-legend-item"><span class="cal-dot match"></span> jogo agendado</span>
        <span class="cal-legend-item"><span class="cal-dot plan"></span> ação planejada</span>
        <span class="cal-legend-item"><span class="cal-dot today"></span> hoje</span>
        <span class="cal-legend-item">clique num dia para planejar</span>
      </small>
    </div>
  `;
}

function renderCalendarioAgenda() {
  const playerTeam = teams.find(t => t.id === state.selectedTeam);
  const playerTimeId = playerTeam?.timeId;
  // Time selecionado pra ver agenda — default = jogador
  const targetTimeId = state.agendaTimeId || playerTimeId;
  const targetTeam = teams.find(t => t.timeId === targetTimeId) || playerTeam;
  const matches = getPlayerCalendarMatches(targetTimeId);

  const filtroSel = state.agendaFiltro || "todas";
  const competicoes = ["Série A","Série B","Série C","Série D","Copa do Brasil"];
  const filtered = filtroSel === "todas" ? matches : matches.filter(m => m.competicao === filtroSel);

  const filtroBtn = (id, label) => `<button class="hist-filter-btn ${filtroSel === id ? "active" : ""}" data-agenda-filtro="${id}">${label}</button>`;

  // Dropdown de seleção: agrupa por divisão e dedupe por timeId
  const seenTimeIds = new Set();
  const allTimes = teams
    .filter(t => t.timeId && !seenTimeIds.has(t.timeId) && (seenTimeIds.add(t.timeId), true))
    .sort((a, b) => (a.divisao || 1) - (b.divisao || 1) || a.nome.localeCompare(b.nome));
  const divLabel = { 1: "Série A", 2: "Série B", 3: "Série C", 4: "Série D" };
  const grouped = {};
  allTimes.forEach(t => { (grouped[t.divisao || 1] ||= []).push(t); });

  return `
    <div class="agenda-body">
      <div class="agenda-team-select">
        <label>
          <span class="muted">VER AGENDA DE</span>
          <select id="agendaTimeSelect">
            ${Object.keys(grouped).sort().map(div => `
              <optgroup label="${divLabel[div] || ("Divisão " + div)}">
                ${grouped[div].map(t => `<option value="${t.timeId}" ${t.timeId === targetTimeId ? "selected" : ""}>${t.nome}${t.timeId === playerTimeId ? "  (seu time)" : ""}</option>`).join("")}
              </optgroup>
            `).join("")}
          </select>
        </label>
        <div class="agenda-team-info">
          <span class="comp-color" style="background:${targetTeam?.cor || '#a51f1c'}"></span>
          <strong>${targetTeam?.nome || "—"}</strong>
          <small class="muted">${targetTeam?.cidade || ""} · ${divLabel[targetTeam?.divisao] || ""}</small>
        </div>
      </div>
      <div class="hist-filter">
        ${filtroBtn("todas", "TODAS")}
        ${competicoes.filter(c => matches.some(m => m.competicao === c)).map(c => filtroBtn(c, c.toUpperCase())).join("")}
      </div>
      <div class="agenda-list">
        <div class="agenda-row agenda-head">
          <div>DATA</div>
          <div>HORA</div>
          <div>COMPETIÇÃO</div>
          <div>LOCAL</div>
          <div>ADVERSÁRIO</div>
          <div>PLACAR</div>
        </div>
        <div class="agenda-rows-scroll">
          ${filtered.length ? filtered.map(m => {
            const md = new Date(m.data);
            const dia = md.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
            const hora = `${String(md.getHours()).padStart(2,"0")}:${String(md.getMinutes()).padStart(2,"0")}`;
            const wd = ["DOM","SEG","TER","QUA","QUI","SEX","SÁB"][md.getDay()];
            let placar = "—";
            let resultadoCls = "";
            if (m.jogada) {
              const golsP = m.isHome ? m.g1 : m.g2;
              const golsO = m.isHome ? m.g2 : m.g1;
              placar = `${golsP}-${golsO}`;
              if (m.penaltis) placar += ` (${m.penaltis.vencedor === targetTimeId ? "v" : "p"} ${m.penaltis.placarVenc}-${m.penaltis.placarPerd})`;
              resultadoCls = golsP > golsO ? "good" : golsP < golsO ? "bad" : "warn";
            }
            const localTxt = m.isHome ? "CASA" : (m.mesmaCidade ? "FORA · MESMA CIDADE" : "FORA");
            const isHoje = m.data.slice(0,10) === state.date;
            return `<div class="agenda-row ${isHoje ? "agenda-row-today" : ""} ${m.jogada ? "agenda-row-played" : ""}">
              <div class="agenda-data"><b>${dia}</b><small>${wd}</small></div>
              <div class="agenda-hora">${hora}</div>
              <div class="agenda-comp">${m.competicao} <small>${m.faseLabel}</small></div>
              <div class="agenda-local ${m.isHome ? "good" : "warn"}">${localTxt}${(!m.isHome && m.mesmaCidade) ? " <small>(sem caravana)</small>" : ""}</div>
              <div class="agenda-adv">
                <span class="comp-color" style="background:${m.opponentColor}"></span>
                <span>${m.opponentName}</span>
              </div>
              <div class="agenda-placar ${resultadoCls}">${placar}</div>
            </div>`;
          }).join("") : "<div class='tor-empty'>Nenhum jogo encontrado neste filtro.</div>"}
        </div>
      </div>
    </div>
  `;
}

function abrirPlanejamentoDia(iso) {
  const dlg = document.querySelector("#planDialog");
  if (!dlg) return;
  const planoExistente = state.calendario?.planos?.[iso] || null;
  const d = new Date(iso + "T12:00:00");
  const titulo = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  dlg.querySelector("#planBody").innerHTML = `
    <div class="plan-head">
      <strong>Planejar ação</strong>
      <small>${titulo}</small>
    </div>
    <div class="plan-options">
      ${CAL_ACOES_DISPONIVEIS.map(a => `
        <button class="plan-option ${planoExistente === a.id ? "active" : ""}" data-plan-set="${iso}|${a.id}">${a.label}</button>
      `).join("")}
      ${planoExistente ? `<button class="plan-option plan-clear" data-plan-set="${iso}|">Remover plano</button>` : ""}
    </div>
  `;
  if (typeof dlg.showModal === "function") dlg.showModal();
  else dlg.setAttribute("open", "");
}
// ===========================================================================
// HISTÓRICO INICIAL — réplica de BrasileiraoManager.CarregarHistoricoInicial
// ===========================================================================
const HISTORICO_INICIAL = {
  A: [
    {ano:"1937",campeao:"Atlético-MG",vice:"Fluminense"},{ano:"1959",campeao:"Bahia",vice:"Santos"},
    {ano:"1960",campeao:"Palmeiras",vice:"Fortaleza"},{ano:"1961",campeao:"Santos",vice:"Bahia"},
    {ano:"1962",campeao:"Santos",vice:"Botafogo"},{ano:"1963",campeao:"Santos",vice:"Bahia"},
    {ano:"1964",campeao:"Santos",vice:"Flamengo"},{ano:"1965",campeao:"Santos",vice:"Vasco"},
    {ano:"1966",campeao:"Cruzeiro",vice:"Santos"},{ano:"1967 (TB)",campeao:"Palmeiras",vice:"Náutico"},
    {ano:"1967 (RGP)",campeao:"Palmeiras",vice:"Internacional"},{ano:"1968 (TB)",campeao:"Botafogo",vice:"Fortaleza"},
    {ano:"1968 (RGP)",campeao:"Santos",vice:"Internacional"},{ano:"1969",campeao:"Palmeiras",vice:"Cruzeiro"},
    {ano:"1970",campeao:"Fluminense",vice:"Palmeiras"},{ano:"1971",campeao:"Atlético-MG",vice:"São Paulo"},
    {ano:"1972",campeao:"Palmeiras",vice:"Botafogo"},{ano:"1973",campeao:"Palmeiras",vice:"São Paulo"},
    {ano:"1974",campeao:"Vasco",vice:"Cruzeiro"},{ano:"1975",campeao:"Internacional",vice:"Cruzeiro"},
    {ano:"1976",campeao:"Internacional",vice:"Corinthians"},{ano:"1977",campeao:"São Paulo",vice:"Atlético-MG"},
    {ano:"1978",campeao:"Guarani",vice:"Palmeiras"},{ano:"1979",campeao:"Internacional",vice:"Vasco"},
    {ano:"1980",campeao:"Flamengo",vice:"Atlético-MG"},{ano:"1981",campeao:"Grêmio",vice:"São Paulo"},
    {ano:"1982",campeao:"Flamengo",vice:"Grêmio"},{ano:"1983",campeao:"Flamengo",vice:"Santos"},
    {ano:"1984",campeao:"Fluminense",vice:"Vasco"},{ano:"1985",campeao:"Coritiba",vice:"Bangu"},
    {ano:"1986",campeao:"São Paulo",vice:"Guarani"},{ano:"1987",campeao:"Sport",vice:"Guarani"},
    {ano:"1988",campeao:"Bahia",vice:"Internacional"},{ano:"1989",campeao:"Vasco",vice:"São Paulo"},
    {ano:"1990",campeao:"Corinthians",vice:"São Paulo"},{ano:"1991",campeao:"São Paulo",vice:"Bragantino"},
    {ano:"1992",campeao:"Flamengo",vice:"Botafogo"},{ano:"1993",campeao:"Palmeiras",vice:"Vitória"},
    {ano:"1994",campeao:"Palmeiras",vice:"Corinthians"},{ano:"1995",campeao:"Botafogo",vice:"Santos"},
    {ano:"1996",campeao:"Grêmio",vice:"Portuguesa"},{ano:"1997",campeao:"Vasco",vice:"Palmeiras"},
    {ano:"1998",campeao:"Corinthians",vice:"Cruzeiro"},{ano:"1999",campeao:"Corinthians",vice:"Atlético-MG"},
    {ano:"2000",campeao:"Vasco",vice:"São Caetano"},{ano:"2001",campeao:"Athletico-PR",vice:"São Caetano"},
    {ano:"2002",campeao:"Santos",vice:"Corinthians"},{ano:"2003",campeao:"Cruzeiro",vice:"Santos"},
    {ano:"2004",campeao:"Santos",vice:"Athletico-PR"},{ano:"2005",campeao:"Corinthians",vice:"Internacional"},
    {ano:"2006",campeao:"São Paulo",vice:"Internacional"},{ano:"2007",campeao:"São Paulo",vice:"Santos"},
    {ano:"2008",campeao:"São Paulo",vice:"Grêmio"},{ano:"2009",campeao:"Flamengo",vice:"Internacional"},
    {ano:"2010",campeao:"Fluminense",vice:"Cruzeiro"},{ano:"2011",campeao:"Corinthians",vice:"Vasco"},
    {ano:"2012",campeao:"Fluminense",vice:"Atlético-MG"},{ano:"2013",campeao:"Cruzeiro",vice:"Grêmio"},
    {ano:"2014",campeao:"Cruzeiro",vice:"São Paulo"},{ano:"2015",campeao:"Corinthians",vice:"Atlético-MG"},
    {ano:"2016",campeao:"Palmeiras",vice:"Santos"},{ano:"2017",campeao:"Corinthians",vice:"Palmeiras"},
    {ano:"2018",campeao:"Palmeiras",vice:"Flamengo"},{ano:"2019",campeao:"Flamengo",vice:"Santos"},
    {ano:"2020",campeao:"Flamengo",vice:"Internacional"},{ano:"2021",campeao:"Atlético-MG",vice:"Flamengo"},
    {ano:"2022",campeao:"Palmeiras",vice:"Internacional"},{ano:"2023",campeao:"Palmeiras",vice:"Grêmio"},
    {ano:"2024",campeao:"Botafogo",vice:"Palmeiras"},{ano:"2025",campeao:"Flamengo",vice:"Palmeiras"}
  ],
  B: [
    {ano:"1971",campeao:"Villa Nova-MG",vice:"Remo"},{ano:"1972",campeao:"Sampaio Corrêa",vice:"Campinense"},
    {ano:"1980",campeao:"Londrina",vice:"CSA"},{ano:"1981",campeao:"Guarani",vice:"Anapolina"},
    {ano:"1982",campeao:"Campo Grande",vice:"CSA"},{ano:"1983",campeao:"Juventus-SP",vice:"CSA"},
    {ano:"1984",campeao:"Uberlândia",vice:"Remo"},{ano:"1985",campeao:"Tuna Luso",vice:"Goytacaz"},
    {ano:"1988",campeao:"Inter de Limeira",vice:"Náutico"},{ano:"1989",campeao:"Bragantino",vice:"São José-SP"},
    {ano:"1990",campeao:"Sport",vice:"Athletico-PR"},{ano:"1991",campeao:"Paysandu",vice:"Guarani"},
    {ano:"1992",campeao:"Paraná",vice:"Vitória"},{ano:"1994",campeao:"Juventude",vice:"Goiás"},
    {ano:"1995",campeao:"Athletico-PR",vice:"Coritiba"},{ano:"1996",campeao:"União São João",vice:"América-RN"},
    {ano:"1997",campeao:"América-MG",vice:"Ponte Preta"},{ano:"1998",campeao:"Gama",vice:"Botafogo-SP"},
    {ano:"1999",campeao:"Goiás",vice:"Santa Cruz"},{ano:"2000",campeao:"Paraná",vice:"São Caetano"},
    {ano:"2001",campeao:"Paysandu",vice:"Figueirense"},{ano:"2002",campeao:"Criciúma",vice:"Fortaleza"},
    {ano:"2003",campeao:"Palmeiras",vice:"Botafogo"},{ano:"2004",campeao:"Brasiliense",vice:"Fortaleza"},
    {ano:"2005",campeao:"Grêmio",vice:"Santa Cruz"},{ano:"2006",campeao:"Atlético-MG",vice:"Sport"},
    {ano:"2007",campeao:"Coritiba",vice:"Ipatinga"},{ano:"2008",campeao:"Corinthians",vice:"Santo André"},
    {ano:"2009",campeao:"Vasco",vice:"Guarani"},{ano:"2010",campeao:"Coritiba",vice:"Figueirense"},
    {ano:"2011",campeao:"Portuguesa",vice:"Náutico"},{ano:"2012",campeao:"Goiás",vice:"Criciúma"},
    {ano:"2013",campeao:"Palmeiras",vice:"Chapecoense"},{ano:"2014",campeao:"Joinville",vice:"Ponte Preta"},
    {ano:"2015",campeao:"Botafogo",vice:"Santa Cruz"},{ano:"2016",campeao:"Atlético-GO",vice:"Avaí"},
    {ano:"2017",campeao:"América-MG",vice:"Internacional"},{ano:"2018",campeao:"Fortaleza",vice:"CSA"},
    {ano:"2019",campeao:"Bragantino",vice:"Sport"},{ano:"2020",campeao:"Chapecoense",vice:"América-MG"},
    {ano:"2021",campeao:"Botafogo",vice:"Goiás"},{ano:"2022",campeao:"Cruzeiro",vice:"Grêmio"},
    {ano:"2023",campeao:"Vitória",vice:"Juventude"},{ano:"2024",campeao:"Santos",vice:"Mirassol"},
    {ano:"2025",campeao:"Coritiba",vice:"Athletico"}
  ],
  C: [
    {ano:"1981",campeao:"Olaria",vice:"Santo Amaro-PE"},{ano:"1988",campeao:"União São João",vice:"Esportivo-MG"},
    {ano:"1990",campeao:"Atlético-GO",vice:"América-MG"},{ano:"1992",campeao:"Tuna Luso",vice:"Fluminense de Feira"},
    {ano:"1994",campeao:"Novorizontino",vice:"Ferroviária"},{ano:"1995",campeao:"XV de Piracicaba",vice:"Volta Redonda"},
    {ano:"1996",campeao:"Vila Nova",vice:"Botafogo-SP"},{ano:"1997",campeao:"Sampaio Corrêa",vice:"Juventus-SP"},
    {ano:"1998",campeao:"Avaí",vice:"São Caetano"},{ano:"1999",campeao:"Fluminense",vice:"São Raimundo-AM"},
    {ano:"2000",campeao:"Malutrom",vice:"Uberlândia"},{ano:"2001",campeao:"Paulista",vice:"Mogi Mirim"},
    {ano:"2002",campeao:"Brasiliense",vice:"Marília"},{ano:"2003",campeao:"Ituano",vice:"Santo André"},
    {ano:"2004",campeao:"União Barbarense",vice:"Gama"},{ano:"2005",campeao:"Remo",vice:"América-RN"},
    {ano:"2006",campeao:"Criciúma",vice:"Vitória"},{ano:"2007",campeao:"Bragantino",vice:"Bahia"},
    {ano:"2008",campeao:"Atlético-GO",vice:"Guarani"},{ano:"2009",campeao:"América-MG",vice:"ASA"},
    {ano:"2010",campeao:"ABC",vice:"Boa Esporte"},{ano:"2011",campeao:"Joinville",vice:"CRB"},
    {ano:"2012",campeao:"Oeste",vice:"Icasa"},{ano:"2013",campeao:"Santa Cruz",vice:"Sampaio Corrêa"},
    {ano:"2014",campeao:"Macaé",vice:"Paysandu"},{ano:"2015",campeao:"Vila Nova",vice:"Londrina"},
    {ano:"2016",campeao:"Boa Esporte",vice:"Guarani"},{ano:"2017",campeao:"CSA",vice:"Fortaleza"},
    {ano:"2018",campeao:"Operário Ferroviário",vice:"Cuiabá"},{ano:"2019",campeao:"Náutico",vice:"Sampaio Corrêa"},
    {ano:"2020",campeao:"Vila Nova",vice:"Remo"},{ano:"2021",campeao:"Ituano",vice:"Tombense"},
    {ano:"2022",campeao:"Mirassol",vice:"ABC"},{ano:"2023",campeao:"Amazonas",vice:"Brusque"},
    {ano:"2024",campeao:"Volta Redonda",vice:"Athletic-MG"},{ano:"2025",campeao:"Ponte Preta",vice:"Londrina"}
  ],
  D: [
    {ano:"2009",campeao:"São Raimundo-PA",vice:"Macaé"},{ano:"2010",campeao:"Guarany de Sobral",vice:"América-AM"},
    {ano:"2011",campeao:"Tupi",vice:"Santa Cruz"},{ano:"2012",campeao:"Sampaio Corrêa",vice:"CRAC"},
    {ano:"2013",campeao:"Botafogo-PB",vice:"Juventude"},{ano:"2014",campeao:"Tombense",vice:"Brasil de Pelotas"},
    {ano:"2015",campeao:"Botafogo-SP",vice:"River-PI"},{ano:"2016",campeao:"Volta Redonda",vice:"CSA"},
    {ano:"2017",campeao:"Operário Ferroviário",vice:"Globo-RN"},{ano:"2018",campeao:"Ferroviário-CE",vice:"Treze"},
    {ano:"2019",campeao:"Brusque",vice:"Manaus"},{ano:"2020",campeao:"Mirassol",vice:"Floresta"},
    {ano:"2021",campeao:"Aparecidense",vice:"Campinense"},{ano:"2022",campeao:"América-RN",vice:"Pouso Alegre"},
    {ano:"2023",campeao:"Ferroviário-CE",vice:"Ferroviária-SP"},{ano:"2024",campeao:"Retrô-PE",vice:"Anápolis"},
    {ano:"2025",campeao:"Barra",vice:"Santa Cruz"}
  ],
  Copa: [
    {ano:"1989",campeao:"Grêmio",vice:"Sport"},{ano:"1990",campeao:"Flamengo",vice:"Goiás"},
    {ano:"1991",campeao:"Criciúma",vice:"Grêmio"},{ano:"1992",campeao:"Internacional",vice:"Fluminense"},
    {ano:"1993",campeao:"Cruzeiro",vice:"Grêmio"},{ano:"1994",campeao:"Grêmio",vice:"Ceará"},
    {ano:"1995",campeao:"Corinthians",vice:"Grêmio"},{ano:"1996",campeao:"Cruzeiro",vice:"Palmeiras"},
    {ano:"1997",campeao:"Grêmio",vice:"Flamengo"},{ano:"1998",campeao:"Palmeiras",vice:"Cruzeiro"},
    {ano:"1999",campeao:"Juventude",vice:"Botafogo"},{ano:"2000",campeao:"Cruzeiro",vice:"São Paulo"},
    {ano:"2001",campeao:"Grêmio",vice:"Corinthians"},{ano:"2002",campeao:"Corinthians",vice:"Brasiliense"},
    {ano:"2003",campeao:"Cruzeiro",vice:"Flamengo"},{ano:"2004",campeao:"Santo André",vice:"Flamengo"},
    {ano:"2005",campeao:"Paulista",vice:"Fluminense"},{ano:"2006",campeao:"Flamengo",vice:"Vasco"},
    {ano:"2007",campeao:"Fluminense",vice:"Figueirense"},{ano:"2008",campeao:"Sport",vice:"Corinthians"},
    {ano:"2009",campeao:"Corinthians",vice:"Internacional"},{ano:"2010",campeao:"Santos",vice:"Vitória"},
    {ano:"2011",campeao:"Vasco",vice:"Coritiba"},{ano:"2012",campeao:"Palmeiras",vice:"Coritiba"},
    {ano:"2013",campeao:"Flamengo",vice:"Athletico-PR"},{ano:"2014",campeao:"Atlético-MG",vice:"Cruzeiro"},
    {ano:"2015",campeao:"Palmeiras",vice:"Santos"},{ano:"2016",campeao:"Grêmio",vice:"Atlético-MG"},
    {ano:"2017",campeao:"Cruzeiro",vice:"Flamengo"},{ano:"2018",campeao:"Cruzeiro",vice:"Corinthians"},
    {ano:"2019",campeao:"Athletico-PR",vice:"Internacional"},{ano:"2020",campeao:"Palmeiras",vice:"Grêmio"},
    {ano:"2021",campeao:"Atlético-MG",vice:"Athletico-PR"},{ano:"2022",campeao:"Flamengo",vice:"Corinthians"},
    {ano:"2023",campeao:"São Paulo",vice:"Flamengo"},{ano:"2024",campeao:"Flamengo",vice:"Atlético-MG"},
    {ano:"2025",campeao:"Corinthians",vice:"Vasco"}
  ]
};

// ===========================================================================
// COMPETIÇÕES — Motor de simulação idêntico ao BrasileiraoManager.cs
// ===========================================================================

// Gera placar de empate seguindo distribuição do BrasileiraoManager
function gerarPlacarEmpate() {
  const s = Math.random() * 100;
  if (s < 40) return 0;
  if (s < 80) return 1;
  if (s < 95) return 2;
  return 3;
}

// Gera placar de vitória [vencedor, perdedor]
function gerarPlacarVitoria() {
  const s = Math.random() * 100;
  if (s < 30) return [1, 0];
  if (s < 45) return [2, 0];
  if (s < 60) return [2, 1];
  if (s < 70) return [3, 2];
  if (s < 80) return [3, 0];
  if (s < 90) return [3, 1];
  if (s < 95) return [4, 0];
  if (s < 98) return [4, 1];
  return [5, 1];
}

// Calcula fator torcida do jogador (mesma fórmula GDD seção 9.5)
function calcFatorTorcidaJogador() {
  if (!state.player) return 0;
  const publico = satisfactionState(state.player.satisfacao).public;
  const faixas = clamp(state.player.buildings.sede * 0.14 + state.player.prestigio / 500, 0, 1);
  const bateria = clamp(availableLF() / 40, 0, 1);
  const moral = state.player.moral / 100;
  return clamp(publico * 0.4 + faixas * 0.25 + bateria * 0.2 + moral * 0.15, 0, 1);
}

// Simula partida — réplica fiel de BrasileiraoManager.SimularPlacarGenerico
function simulatePartida(home, away, divisao = 1) {
  const ehSerieA = divisao === 1;
  const bonusMandante = ehSerieA ? 3 : 1;
  const penalidadeVisitante = ehSerieA ? 2 : 1;

  let forcaCasa = (home.forca || 50) + bonusMandante;
  let forcaFora = (away.forca || 50) - penalidadeVisitante;

  // Bônus/penalidade por diferença
  const diff = Math.abs(forcaCasa - forcaFora);
  const casaFav = forcaCasa >= forcaFora;
  let bonus = 0, pen = 0;
  if      (diff >= 1  && diff <= 5)  { bonus = 1;  pen = 0;  }
  else if (diff >= 6  && diff <= 10) { bonus = 3;  pen = 0;  }
  else if (diff >= 11 && diff <= 15) { bonus = 4;  pen = 4;  }
  else if (diff >= 16 && diff <= 20) { bonus = 6;  pen = 6;  }
  else if (diff >= 21)               { bonus = 10; pen = 10; }

  if (casaFav) { forcaCasa += bonus; forcaFora -= pen; }
  else         { forcaFora += bonus; forcaCasa -= pen; }

  // Bônus do fator torcida do jogador (GDD seção 9.5)
  const playerTeam = teams.find(t => t.id === state.selectedTeam);
  if (playerTeam?.timeId) {
    const fator = calcFatorTorcidaJogador();
    if (home.id === playerTeam.timeId)      forcaCasa += Math.round(fator * 5);
    else if (away.id === playerTeam.timeId) forcaFora += Math.round(fator * 3);
  }

  forcaCasa = clamp(forcaCasa, 1, 100);
  forcaFora = clamp(forcaFora, 1, 100);

  // Chance de empate
  const chanceEmpate = Math.max(1, Math.round((home.forca || 50) * 0.3 + (away.forca || 50) * 0.3));

  // Sorteio
  const total = forcaCasa + forcaFora + chanceEmpate;
  const sorteio = Math.floor(Math.random() * total);
  let resultado;
  if (sorteio < forcaCasa)                  resultado = "casa";
  else if (sorteio < forcaCasa + forcaFora) resultado = "fora";
  else                                       resultado = "empate";

  let g1, g2;
  if (resultado === "empate") {
    g1 = g2 = gerarPlacarEmpate();
  } else {
    const placar = gerarPlacarVitoria();
    if (resultado === "casa") { g1 = placar[0]; g2 = placar[1]; }
    else                       { g1 = placar[1]; g2 = placar[0]; }
  }
  return { g1, g2, resultado };
}

// Réplica fiel de BrasileiraoManager.DefinirHorario(d, j, t)
// d = base do domingo, j = índice do jogo na rodada, t = divisão (1-4)
function definirHorario(baseSunday, j, t) {
  const d = new Date(baseSunday);
  const set = (deltaDays, hours, minutes = 0) => {
    const x = new Date(baseSunday);
    x.setDate(x.getDate() + deltaDays);
    x.setHours(hours, minutes, 0, 0);
    return x;
  };
  if (t === 1) {
    if (j < 2) return set(-1, 16, 0);
    if (j < 3) return set(-1, 21, 0);
    if (j < 7) return set(0, 16, 0);
    if (j < 9) return set(0, 18, 30);
    return set(1, 20, 0);
  }
  if (t === 2) {
    if (j < 2) return set(-2, 19, 30);
    if (j < 6) return set(-1, 16, 30);
    if (j < 8) return set(-1, 20, 0);
    return set(0, 16, 30);
  }
  if (t === 3) {
    if (j < 3) return set(-1, 17, 0);
    if (j < 5) return set(-1, 19, 0);
    if (j < 8) return set(0, 16, 0);
    if (j < 9) return set(0, 19, 0);
    return set(1, 20, 0);
  }
  // Série D: par sábado 15h, ímpar domingo 15h
  return j % 2 === 0 ? set(-1, 15, 0) : set(0, 15, 0);
}

// Calcula a data-base do calendário (1º domingo do ano + 14 dias, mesma regra do BrasileiraoManager)
function calcBaseDateCalendario() {
  const year = state.compState?.anoAtual || new Date(state.date + "T00:00:00").getFullYear();
  const d = new Date(year, 0, 1);
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  d.setDate(d.getDate() + 14);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Gera turno+returno com datas; retorna array linear ordenado por rodada
function gerarCalendarioPadrao(timeIds, divisao, baseDate) {
  const arr = timeIds.slice();
  if (arr.length % 2 !== 0) arr.push(null);
  const n = arr.length;
  const half = n / 2;
  const numRounds = n - 1;
  const turno = [];
  for (let r = 0; r < numRounds; r++) {
    const dr = new Date(baseDate);
    dr.setDate(dr.getDate() + r * 7);
    for (let j = 0; j < half; j++) {
      const home = arr[j];
      const away = arr[n - 1 - j];
      if (home !== null && away !== null) {
        turno.push({
          rodada: r + 1,
          home, away,
          data: definirHorario(dr, j, divisao).toISOString(),
          g1: null, g2: null, jogada: false
        });
      }
    }
    arr.splice(1, 0, arr.pop());
  }
  // Returno: inverte mando + soma numRounds*7 dias
  const returno = turno.map(m => {
    const dataRet = new Date(m.data);
    dataRet.setDate(dataRet.getDate() + numRounds * 7);
    return {
      rodada: m.rodada + numRounds,
      home: m.away, away: m.home,
      data: dataRet.toISOString(),
      g1: null, g2: null, jogada: false
    };
  });
  return [...turno, ...returno];
}

// Série D: 4 chaves de 12 times, 11+11 = 22 rodadas
function gerarCalendarioD(timeIds, baseDate, clubes) {
  const matches = [];
  // Distribui em 4 grupos balanceados (round-robin para cobrir 48 teams)
  const groups = [[], [], [], []];
  timeIds.forEach((id, i) => {
    const grupo = (i % 4) + 1;
    groups[grupo - 1].push(id);
    const c = clubes.find(x => x.id === id);
    if (c) c.grupo = grupo;
  });

  groups.forEach((grupoIds, gi) => {
    if (grupoIds.length < 2) return;
    const arr = grupoIds.slice();
    if (arr.length % 2 !== 0) arr.push(null);
    const n = arr.length;
    const half = n / 2;
    const numRounds = n - 1; // 11 com 12 times
    const turno = [];
    for (let r = 0; r < numRounds; r++) {
      const dr = new Date(baseDate);
      dr.setDate(dr.getDate() + r * 7);
      for (let j = 0; j < half; j++) {
        const home = arr[j];
        const away = arr[n - 1 - j];
        if (home !== null && away !== null) {
          turno.push({
            rodada: r + 1,
            grupo: gi + 1,
            home, away,
            data: definirHorario(dr, j, 4).toISOString(),
            g1: null, g2: null, jogada: false
          });
        }
      }
      arr.splice(1, 0, arr.pop());
    }
    matches.push(...turno);
    // Returno: +11 semanas, mando invertido
    turno.forEach(m => {
      const dataRet = new Date(m.data);
      dataRet.setDate(dataRet.getDate() + numRounds * 7);
      matches.push({
        rodada: m.rodada + numRounds,
        grupo: m.grupo,
        home: m.away, away: m.home,
        data: dataRet.toISOString(),
        g1: null, g2: null, jogada: false
      });
    });
  });
  return matches;
}

function ensureCompetition(divisao) {
  state.compState = state.compState || {};
  const key = `serie${divisao}`;
  if (state.compState[key]) return state.compState[key];

  // Coleta times únicos da divisão
  const timeIds = [];
  const seen = new Set();
  teams.forEach(t => {
    if (t.divisao === divisao && t.timeId && !seen.has(t.timeId)) {
      seen.add(t.timeId);
      timeIds.push(t.timeId);
    }
  });

  const clubes = timeIds.map(timeId => {
    const t = teams.find(x => x.timeId === timeId);
    return {
      id: timeId,
      nome: t?.nome || timeId,
      forca: clamp((t?.qualidade || 25) * 2, 1, 100),
      cor: t?.cor || "#a51f1c",
      pontos: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0,
      grupo: 0
    };
  });

  const baseDate = calcBaseDateCalendario();

  // Linear matches list (com datas)
  let matches;
  let totalRodadas;
  if (divisao === 4) {
    matches = gerarCalendarioD(timeIds, baseDate, clubes);
    totalRodadas = 22;
  } else {
    matches = gerarCalendarioPadrao(timeIds, divisao, baseDate);
    totalRodadas = (timeIds.length - 1) * 2; // 38 pra 20 times
  }

  // Reagrupa em rounds[] (cada slot = lista de jogos da rodada)
  const rounds = [];
  for (let r = 1; r <= totalRodadas; r++) {
    rounds.push(matches.filter(m => m.rodada === r));
  }

  state.compState[key] = {
    clubes, rounds, divisao, totalRodadas,
    fase: divisao === 4 ? "grupos" : "pontosCorridos",
    playoffs: null
  };
  return state.compState[key];
}

// Simula um jogo individual e atualiza stats
function simulateAndUpdateMatch(match, comp) {
  const home = comp.clubes.find(c => c.id === match.home);
  const away = comp.clubes.find(c => c.id === match.away);
  if (!home || !away) return;
  const result = simulatePartida(home, away, comp.divisao);
  match.g1 = result.g1;
  match.g2 = result.g2;
  match.jogada = true;
  home.gp += result.g1; home.gc += result.g2; home.sg = home.gp - home.gc;
  away.gp += result.g2; away.gc += result.g1; away.sg = away.gp - away.gc;
  if (result.resultado === "empate") {
    home.pontos += 1; home.e += 1;
    away.pontos += 1; away.e += 1;
  } else if (result.resultado === "casa") {
    home.pontos += 3; home.v += 1; away.d += 1;
  } else {
    away.pontos += 3; away.v += 1; home.d += 1;
  }
}

// ===========================================================================
// SÉRIE D — Mata-mata (oitavas → quartas → semi → final, todos ida e volta)
// ===========================================================================

// Cria um confronto ida+volta. "left" recebe o jogo 2 em casa.
function criarTieSerieD(comp, id, fase, leftId, rightId, rodadaIda) {
  const baseDate = calcBaseDateCalendario();
  const dIda = new Date(baseDate);
  dIda.setDate(dIda.getDate() + (rodadaIda - 1) * 7);
  const dVolta = new Date(dIda);
  dVolta.setDate(dVolta.getDate() + 7);

  // Distribui em horários de sábado/domingo conforme posição
  const idx = (id - 1) * 2; // espalha jogos pelas datas
  return {
    id, fase, leftId, rightId,
    leg1: {
      rodada: rodadaIda,
      home: rightId, away: leftId, // ida no campo da DIREITA
      data: definirHorario(dIda, idx % 6, 4).toISOString(),
      g1: null, g2: null, jogada: false,
      tieId: id, tieFase: fase, tieLeg: 1
    },
    leg2: {
      rodada: rodadaIda + 1,
      home: leftId, away: rightId, // volta no campo da ESQUERDA
      data: definirHorario(dVolta, idx % 6, 4).toISOString(),
      g1: null, g2: null, jogada: false,
      tieId: id, tieFase: fase, tieLeg: 2
    },
    winnerId: null,
    loserId: null,
    aggLeft: 0,
    aggRight: 0
  };
}

function resolveTie(tie) {
  if (!tie.leg1.jogada || !tie.leg2.jogada || tie.winnerId) return;
  // leftId era visitante na ida e mandante na volta
  const leftTotal = tie.leg1.g2 + tie.leg2.g1;
  const rightTotal = tie.leg1.g1 + tie.leg2.g2;
  tie.aggLeft = leftTotal;
  tie.aggRight = rightTotal;
  if (leftTotal > rightTotal) {
    tie.winnerId = tie.leftId; tie.loserId = tie.rightId;
  } else if (rightTotal > leftTotal) {
    tie.winnerId = tie.rightId; tie.loserId = tie.leftId;
  } else {
    // Empate no agregado → pênaltis com probabilidade baseada em força
    const pen = disputarPenaltis(tie.leftId, tie.rightId);
    tie.penalties = true;
    tie.penaltyScore = [pen.placarVenc, pen.placarPerd];
    if (pen.vencedor === tie.leftId) {
      tie.winnerId = tie.leftId; tie.loserId = tie.rightId;
    } else {
      tie.winnerId = tie.rightId; tie.loserId = tie.leftId;
    }
  }
}

function gerarOitavasD(comp) {
  const top = {};
  for (let g = 1; g <= 4; g++) {
    top[g] = comp.clubes
      .filter(c => c.grupo === g)
      .sort((a, b) => b.pontos - a.pontos || b.sg - a.sg || b.gp - a.gp || a.nome.localeCompare(b.nome))
      .slice(0, 4)
      .map(c => c.id);
  }
  // Ordem GDD: 1A×4B, 2B×3A, 1B×4A, 2A×3B, 1C×4D, 2D×3C, 1D×4C, 2C×3D
  const matchups = [
    { id: 1, left: top[1][0], right: top[2][3] },
    { id: 2, left: top[2][1], right: top[1][2] },
    { id: 3, left: top[2][0], right: top[1][3] },
    { id: 4, left: top[1][1], right: top[2][2] },
    { id: 5, left: top[3][0], right: top[4][3] },
    { id: 6, left: top[4][1], right: top[3][2] },
    { id: 7, left: top[4][0], right: top[3][3] },
    { id: 8, left: top[3][1], right: top[4][2] }
  ];
  const oitavas = matchups.map(mu => criarTieSerieD(comp, mu.id, "oitavas", mu.left, mu.right, 23));
  comp.playoffs = comp.playoffs || {};
  comp.playoffs.oitavas = oitavas;
  comp.fase = "oitavas";
  comp.rounds[22] = oitavas.map(t => t.leg1);
  comp.rounds[23] = oitavas.map(t => t.leg2);
  comp.totalRodadas = Math.max(comp.totalRodadas, 30);
}

function gerarQuartasD(comp) {
  const w = comp.playoffs.oitavas.map(t => t.winnerId);
  // Jogo 9 = vJ1 × vJ2; Jogo 10 = vJ3 × vJ4; Jogo 11 = vJ5 × vJ6; Jogo 12 = vJ7 × vJ8
  const matchups = [
    { id: 9,  left: w[0], right: w[1] },
    { id: 10, left: w[2], right: w[3] },
    { id: 11, left: w[4], right: w[5] },
    { id: 12, left: w[6], right: w[7] }
  ];
  const quartas = matchups.map(mu => criarTieSerieD(comp, mu.id, "quartas", mu.left, mu.right, 25));
  comp.playoffs.quartas = quartas;
  comp.fase = "quartas";
  comp.rounds[24] = quartas.map(t => t.leg1);
  comp.rounds[25] = quartas.map(t => t.leg2);
}

function gerarSemiD(comp) {
  const w = comp.playoffs.quartas.map(t => t.winnerId);
  // Jogo 13 = vJ9 × vJ10; Jogo 14 = vJ11 × vJ12
  const matchups = [
    { id: 13, left: w[0], right: w[1] },
    { id: 14, left: w[2], right: w[3] }
  ];
  const semi = matchups.map(mu => criarTieSerieD(comp, mu.id, "semi", mu.left, mu.right, 27));
  comp.playoffs.semi = semi;
  comp.fase = "semi";
  comp.rounds[26] = semi.map(t => t.leg1);
  comp.rounds[27] = semi.map(t => t.leg2);
}

function gerarFinalD(comp) {
  const w = comp.playoffs.semi.map(t => t.winnerId);
  const final = [criarTieSerieD(comp, 15, "final", w[0], w[1], 29)];
  comp.playoffs.final = final;
  comp.fase = "final";
  comp.rounds[28] = final.map(t => t.leg1);
  comp.rounds[29] = final.map(t => t.leg2);
}

// Sincroniza estado de comp.rounds[] de volta em comp.playoffs[fase][i].legN.
// Necessário porque save/load via JSON quebra a igualdade de referência:
// rounds[r][i] e playoffs.final[i].legN são objetos distintos depois do parse,
// e a simulação atualiza apenas o objeto em rounds[].
function syncSerieDPlayoffsFromRounds(comp) {
  if (!comp?.playoffs) return false;
  // Indexa todos os matches em rounds por tieFase|tieId|tieLeg
  const idx = new Map();
  comp.rounds.forEach(round => round?.forEach(m => {
    if (m?.tieFase && m.tieId != null && m.tieLeg != null) {
      idx.set(`${m.tieFase}|${m.tieId}|${m.tieLeg}`, m);
    }
  }));
  let mudou = false;
  ["oitavas", "quartas", "semi", "final"].forEach(fase => {
    (comp.playoffs[fase] || []).forEach(tie => {
      ["leg1", "leg2"].forEach(legKey => {
        const leg = tie[legKey];
        if (!leg) return;
        const ref = idx.get(`${fase}|${tie.id}|${leg.tieLeg}`);
        if (!ref) return;
        if (ref.jogada && (!leg.jogada || leg.g1 !== ref.g1 || leg.g2 !== ref.g2)) {
          leg.g1 = ref.g1;
          leg.g2 = ref.g2;
          leg.jogada = ref.jogada;
          if (ref.penaltis) leg.penaltis = ref.penaltis;
          mudou = true;
        }
      });
    });
  });
  return mudou;
}

function checkSerieDProgression(comp) {
  if (!comp || comp.divisao !== 4) return false;
  let mudou = false;

  // Sincroniza primeiro (saves antigos podem ter referências quebradas)
  if (syncSerieDPlayoffsFromRounds(comp)) mudou = true;

  // Resolve confrontos com 2 legs jogados
  if (comp.playoffs) {
    ["oitavas", "quartas", "semi", "final"].forEach(fase => {
      (comp.playoffs[fase] || []).forEach(tie => {
        if (tie.leg1.jogada && tie.leg2.jogada && !tie.winnerId) {
          resolveTie(tie);
          mudou = true;
        }
      });
    });
  }

  // Gera oitavas após 22 rodadas de grupos
  if (!comp.playoffs?.oitavas) {
    const todoGrupoFeito = comp.rounds.slice(0, 22).every(r => r.length === 0 || r.every(m => m.jogada));
    if (todoGrupoFeito) {
      gerarOitavasD(comp);
      mudou = true;
    }
  }
  // Gera quartas
  if (comp.playoffs?.oitavas && !comp.playoffs?.quartas
      && comp.playoffs.oitavas.every(t => t.winnerId)) {
    gerarQuartasD(comp);
    mudou = true;
  }
  // Gera semi
  if (comp.playoffs?.quartas && !comp.playoffs?.semi
      && comp.playoffs.quartas.every(t => t.winnerId)) {
    gerarSemiD(comp);
    mudou = true;
  }
  // Gera final
  if (comp.playoffs?.semi && !comp.playoffs?.final
      && comp.playoffs.semi.every(t => t.winnerId)) {
    gerarFinalD(comp);
    mudou = true;
  }
  if (comp.playoffs?.final && comp.playoffs.final[0]?.winnerId && comp.fase !== "encerrado") {
    comp.fase = "encerrado";
    comp.campeaoId = comp.playoffs.final[0].winnerId;
    mudou = true;
  }
  return mudou;
}

// ===========================================================================
// COPA DO BRASIL — 7 fases (réplica de BrasileiraoManager.ConfigurarCopaDoBrasil)
// ===========================================================================
const COPA_FASES = [
  { nome: "Primeira Fase",    rodada: 3,  proxima: "Segunda Fase",    idaVolta: false, adicionaSerieA: true  },
  { nome: "Segunda Fase",     rodada: 7,  proxima: "Terceira Fase",   idaVolta: false, adicionaSerieA: false },
  { nome: "Terceira Fase",    rodada: 11, proxima: "Oitavas de Final",idaVolta: false, adicionaSerieA: false },
  { nome: "Oitavas de Final", rodada: 15, proxima: "Quartas de Final",idaVolta: true,  adicionaSerieA: false },
  { nome: "Quartas de Final", rodada: 20, proxima: "Semifinal",       idaVolta: true,  adicionaSerieA: false },
  { nome: "Semifinal",        rodada: 25, proxima: "Final",           idaVolta: true,  adicionaSerieA: false },
  { nome: "Final",            rodada: 30, proxima: null,              idaVolta: false, adicionaSerieA: false }
];

function copaForcaLookup(timeId) {
  const t = teams.find(x => x.timeId === timeId);
  return { forca: clamp((t?.qualidade || 25) * 2, 1, 100), nome: t?.nome || timeId, cor: t?.cor || "#a51f1c" };
}

function disputarPenaltis(homeId, awayId) {
  const fH = copaForcaLookup(homeId).forca;
  const fA = copaForcaLookup(awayId).forca;
  const total = fH + fA;
  const sorteio = Math.floor(Math.random() * total);
  const vencedor = sorteio < fH ? homeId : awayId;
  const placares = [[3,2],[4,3],[5,4],[4,2],[5,3],[6,5],[5,2],[6,4]];
  const placar = placares[Math.floor(Math.random() * placares.length)];
  return { vencedor, placarVenc: placar[0], placarPerd: placar[1] };
}

function gerarFaseCopa(copa, times, rodada, nomeFase, idaVolta) {
  // Sorteio (Fisher-Yates)
  const pote = times.slice();
  for (let i = pote.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pote[i], pote[j]] = [pote[j], pote[i]];
  }
  // Datas: base + (rod-1)*7 + 3 dias = quarta, 21:30
  const baseDate = calcBaseDateCalendario();
  const dIda = new Date(baseDate);
  dIda.setDate(dIda.getDate() + (rodada - 1) * 7 + 3);
  dIda.setHours(21, 30, 0, 0);
  const dVolta = new Date(dIda);
  dVolta.setDate(dVolta.getDate() + 7);

  const half = Math.floor(pote.length / 2);
  for (let i = 0; i < half; i++) {
    const t1 = pote[i];
    const t2 = pote[pote.length - 1 - i];
    const f1 = copaForcaLookup(t1).forca;
    const f2 = copaForcaLookup(t2).forca;
    // Mando do menor força (regra Copa do Brasil)
    const homeId = f1 < f2 ? t1 : t2;
    const awayId = f1 < f2 ? t2 : t1;

    copa.partidas.push({
      rodada, fase: nomeFase, faseLabel: nomeFase,
      home: homeId, away: awayId, data: dIda.toISOString(),
      g1: null, g2: null, jogada: false, penaltis: null
    });
    if (idaVolta) {
      copa.partidas.push({
        rodada: rodada + 1, fase: nomeFase, faseLabel: nomeFase + " (Volta)",
        home: awayId, away: homeId, data: dVolta.toISOString(),
        g1: null, g2: null, jogada: false, penaltis: null
      });
    }
  }
  copa.faseCorrente = nomeFase;
  copa.partidas.sort((a, b) => new Date(a.data) - new Date(b.data));
}

function ensureCopa() {
  if (state.compState?.copa) return state.compState.copa;
  state.compState = state.compState || {};

  const vivos = [], entramFase2 = [];
  const seen = new Set();
  teams.forEach(t => {
    if (!t.timeId || seen.has(t.timeId)) return;
    seen.add(t.timeId);
    if (t.divisao === 1) entramFase2.push(t.timeId);
    else if ([2, 3, 4].includes(t.divisao)) vivos.push(t.timeId);
  });

  const copa = {
    fase: "Primeira Fase",
    faseCorrente: null,
    vivos: vivos.slice(),
    entramFase2,
    partidas: [],
    campeao: null,
    vice: null
  };
  state.compState.copa = copa;
  gerarFaseCopa(copa, vivos, 3, "Primeira Fase", false);
  return copa;
}

function simulateCopaMatch(match) {
  if (match.jogada) return;
  const home = copaForcaLookup(match.home);
  const away = copaForcaLookup(match.away);
  const result = simulatePartida(home, away, 1); // usa série A bonus pra Copa
  match.g1 = result.g1;
  match.g2 = result.g2;
  match.jogada = true;
}

function checkCopaProgression() {
  const copa = state.compState?.copa;
  if (!copa || copa.fase === "encerrado") return false;
  const fase = COPA_FASES.find(f => f.nome === copa.faseCorrente);
  if (!fase) return false;

  const matches = copa.partidas.filter(p => p.fase === copa.faseCorrente);
  if (!matches.length || !matches.every(m => m.jogada)) return false;

  if (fase.nome === "Final") {
    const fm = matches[0];
    let campeaoId, viceId;
    if (fm.g1 > fm.g2) { campeaoId = fm.home; viceId = fm.away; }
    else if (fm.g2 > fm.g1) { campeaoId = fm.away; viceId = fm.home; }
    else {
      const pen = disputarPenaltis(fm.home, fm.away);
      fm.penaltis = pen;
      campeaoId = pen.vencedor;
      viceId = campeaoId === fm.home ? fm.away : fm.home;
    }
    copa.campeao = campeaoId;
    copa.vice = viceId;
    copa.fase = "encerrado";
    return true;
  }

  // Determina vencedores
  let vencedores;
  if (fase.idaVolta) {
    // Pareia confrontos
    const conf = {};
    matches.forEach(m => {
      const key = [m.home, m.away].sort().join("__");
      if (!conf[key]) conf[key] = [];
      conf[key].push(m);
    });
    vencedores = Object.values(conf).map(([ida, volta]) => {
      // Time1 = mandante da ida; Time2 = visitante da ida
      const t1 = ida.home, t2 = ida.away;
      const agg1 = ida.g1 + (volta.home === t1 ? volta.g1 : volta.g2);
      const agg2 = ida.g2 + (volta.home === t1 ? volta.g2 : volta.g1);
      if (agg1 > agg2) return t1;
      if (agg2 > agg1) return t2;
      const pen = disputarPenaltis(t1, t2);
      volta.penaltis = pen;
      return pen.vencedor;
    });
  } else {
    vencedores = matches.map(m => {
      if (m.g1 > m.g2) return m.home;
      if (m.g2 > m.g1) return m.away;
      const pen = disputarPenaltis(m.home, m.away);
      m.penaltis = pen;
      return pen.vencedor;
    });
  }

  copa.vivos = vencedores;
  if (fase.adicionaSerieA) copa.vivos = [...copa.vivos, ...copa.entramFase2];
  gerarFaseCopa(copa, copa.vivos, fase.rodada + 4, fase.proxima, COPA_FASES.find(f => f.nome === fase.proxima)?.idaVolta || false);
  return true;
}

// ===========================================================================
// EVOLUÇÃO DE FORÇA ENTRE TEMPORADAS
// ===========================================================================
function aplicarEvolucaoForca(comp, divisao) {
  const tab = comp.clubes.slice().sort((a, b) => b.pontos - a.pontos);
  tab.forEach((c, i) => {
    const pos = i + 1;
    const t = teams.find(x => x.timeId === c.id);
    if (!t) return;
    let delta = 0;
    if (divisao === 1) {
      delta = pos <= 4 ? 5 + rand(-5, 5) : pos <= 16 ? 2 + rand(-5, 5) : rand(-6, 3);
    } else if (divisao === 2) {
      delta = pos <= 4 ? 3 + rand(-2, 5) : rand(-4, 2);
    } else if (divisao === 3) {
      delta = pos <= 4 ? 2 + rand(-1, 4) : pos <= 10 ? rand(-1, 2) : pos <= 16 ? rand(-2, 2) : rand(-2, 1);
    } else if (divisao === 4) {
      delta = pos <= 4 ? 2 + rand(-1, 2) : pos <= 12 ? rand(-1, 2) : rand(-1, 1);
    }
    // qualidade é 1-50; delta atua na escala força (1-100), divide por 2
    t.qualidade = clamp(Math.round((t.qualidade || 25) + delta / 2), 4, 50);
  });
}

// ===========================================================================
// VIRADA DE TEMPORADA — promoção/rebaixamento + reset
// ===========================================================================
function isSeasonComplete() {
  if (!state.compState) return false;
  for (const div of [1, 2, 3, 4]) {
    const comp = state.compState[`serie${div}`];
    if (!comp) return false;
    const allPlayed = comp.rounds.every(r => r.length === 0 || r.every(m => m.jogada));
    if (!allPlayed) return false;
    if (div === 4 && comp.fase !== "encerrado") return false;
  }
  if (state.compState.copa && state.compState.copa.fase !== "encerrado") return false;
  return true;
}

function tabelaOrdenada(comp) {
  return comp.clubes.slice().sort((a, b) =>
    b.pontos - a.pontos || b.sg - a.sg || b.gp - a.gp || a.nome.localeCompare(b.nome));
}

function processarViradaDeTemporada() {
  if (!isSeasonComplete()) return false;
  const ano = state.compState.anoAtual || 2026;
  const galeria = state.compState.galeria || (state.compState.galeria = { A: [], B: [], C: [], D: [], Copa: [] });

  // Salva campeões A/B/C
  ["1","2","3"].forEach(div => {
    const comp = state.compState[`serie${div}`];
    const tab = tabelaOrdenada(comp);
    const key = ["A","B","C"][parseInt(div) - 1];
    galeria[key].push({ ano: String(ano), campeao: tab[0]?.nome || "?", vice: tab[1]?.nome || "?" });
  });
  // Campeão D — vencedor da final
  const compD = state.compState.serie4;
  const finTie = compD.playoffs?.final?.[0];
  if (finTie?.winnerId) {
    const camp = compD.clubes.find(c => c.id === finTie.winnerId);
    const vice = compD.clubes.find(c => c.id === finTie.loserId);
    galeria.D.push({ ano: String(ano), campeao: camp?.nome || "?", vice: vice?.nome || "?" });
  }
  // Campeão Copa do Brasil
  const copa = state.compState.copa;
  if (copa?.campeao) {
    const camp = copaForcaLookup(copa.campeao);
    const vice = copaForcaLookup(copa.vice);
    galeria.Copa.push({ ano: String(ano), campeao: camp.nome, vice: vice.nome });
  }

  // Aplicar evolução de força ANTES da rotação de divisões
  aplicarEvolucaoForca(state.compState.serie1, 1);
  aplicarEvolucaoForca(state.compState.serie2, 2);
  aplicarEvolucaoForca(state.compState.serie3, 3);
  aplicarEvolucaoForca(state.compState.serie4, 4);

  // Promoção/Rebaixamento
  const compA = state.compState.serie1;
  const compB = state.compState.serie2;
  const compC = state.compState.serie3;

  const tabA = tabelaOrdenada(compA);
  const tabB = tabelaOrdenada(compB);
  const tabC = tabelaOrdenada(compC);

  const cair = (tab, qtd) => tab.slice(-qtd).map(c => c.id);
  const subir = (tab, qtd) => tab.slice(0, qtd).map(c => c.id);

  const cairA = cair(tabA, 4);   const subirB = subir(tabB, 4);   // A↔B
  const cairB = cair(tabB, 4);   const subirC = subir(tabC, 4);   // B↔C
  const cairC = cair(tabC, 4);                                     // C→D
  // Semifinalistas D → C (4 vencedores das quartas)
  const semifinalistasD = (compD.playoffs?.semi || []).flatMap(t => [t.leftId, t.rightId]);

  // Mantém um override persistente em state.compState.teamDivisaoOverrides
  // para sobreviver a reload do navegador (teams[] é reconstruído de DATA a cada load).
  const overrides = state.compState.teamDivisaoOverrides || {};
  const setDiv = (ids, novaDiv) => ids.forEach(id => {
    overrides[id] = novaDiv;
    teams.forEach(t => { if (t.timeId === id) t.divisao = novaDiv; });
  });

  setDiv(cairA, 2); setDiv(subirB, 1);
  setDiv(cairB, 3); setDiv(subirC, 2);
  setDiv(cairC, 4); setDiv(semifinalistasD, 3);

  // Reset compState — será regenerado lazily com anoAtual+1
  state.compState = {
    anoAtual: ano + 1,
    galeria,
    teamDivisaoOverrides: overrides
  };

  toast(`Temporada ${ano} encerrada. Bem-vindo a ${ano + 1}!`);
  return true;
}

// Hook do advanceDay: simula jogos do dia anterior em todas as séries + Copa
function autoSimularCompeticoesAtoHoje() {
  if (!state.compState) state.compState = {};
  const ontemISO = (() => {
    const d = new Date(state.date + "T12:00:00");
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  })();
  // Garantir que todas as competições existem
  [1, 2, 3, 4].forEach(div => ensureCompetition(div));
  ensureCopa();

  // Loop até estabilizar
  let safety = 12;
  while (safety-- > 0) {
    let mudou = false;
    [1, 2, 3, 4].forEach(div => {
      const comp = state.compState[`serie${div}`];
      if (!comp) return;
      comp.rounds.forEach(round => {
        round.forEach(match => {
          if (match.jogada) return;
          if (match.data.slice(0, 10) <= ontemISO) {
            simulateAndUpdateMatch(match, comp);
            emitirNoticiaJogo(match, comp.divisao);
            mudou = true;
          }
        });
      });
    });
    // Copa do Brasil — simula partidas vencidas
    const copa = state.compState.copa;
    if (copa) {
      copa.partidas.forEach(m => {
        if (m.jogada) return;
        if (m.data.slice(0, 10) <= ontemISO) {
          simulateCopaMatch(m);
          emitirNoticiaCopa(m);
          mudou = true;
        }
      });
      if (checkCopaProgression()) mudou = true;
    }
    // Progressão da Série D
    const compD = state.compState.serie4;
    if (checkSerieDProgression(compD)) mudou = true;
    if (!mudou) break;
  }
  // Virada de temporada
  if (processarViradaDeTemporada()) {
    [1, 2, 3, 4].forEach(div => ensureCompetition(div));
    ensureCopa();
  }
}

// === Notícias dos jogos — filtra pela competição/divisão do jogador ===
function emitirNoticiaJogo(match, divisao) {
  const playerTeam = teams.find(t => t.id === state.selectedTeam);
  const playerDivisao = playerTeam?.divisao || 1;
  // Só emite notícia se for da MESMA divisão que o jogador escolheu
  if (divisao !== playerDivisao) return;

  const home = state.compState[`serie${divisao}`]?.clubes.find(c => c.id === match.home);
  const away = state.compState[`serie${divisao}`]?.clubes.find(c => c.id === match.away);
  if (!home || !away) return;
  const serieLabel = ["Série A", "Série B", "Série C", "Série D"][divisao - 1];
  const placar = `${home.nome} ${match.g1}×${match.g2} ${away.nome}`;
  const playerTimeId = playerTeam?.timeId;
  const ehDoJogador = match.home === playerTimeId || match.away === playerTimeId;
  const prefixo = ehDoJogador ? "SEU TIME" : "FINAL";
  addNews(`${prefixo} (${serieLabel}): ${placar}`);
}

function emitirNoticiaCopa(match) {
  const playerTeam = teams.find(t => t.id === state.selectedTeam);
  const playerTimeId = playerTeam?.timeId;
  // Para Copa, só emite se o time do jogador está envolvido
  if (match.home !== playerTimeId && match.away !== playerTimeId) return;
  const home = copaForcaLookup(match.home);
  const away = copaForcaLookup(match.away);
  const placar = match.penaltis
    ? `${home.nome} ${match.g1}(${match.penaltis.vencedor === match.home ? match.penaltis.placarVenc : match.penaltis.placarPerd})×${match.g2}(${match.penaltis.vencedor === match.away ? match.penaltis.placarVenc : match.penaltis.placarPerd}) ${away.nome}`
    : `${home.nome} ${match.g1}×${match.g2} ${away.nome}`;
  addNews(`COPA DO BRASIL · ${match.faseLabel}: ${placar}`);
}

// === Próximo jogo do time do jogador (calendário real) ===
function getPlayerProximoJogo() {
  const playerTeam = teams.find(t => t.id === state.selectedTeam);
  if (!playerTeam?.timeId || !state.compState) return null;
  const timeId = playerTeam.timeId;
  const divisao = playerTeam.divisao || 1;
  const todayISO = state.date;
  const candidates = [];

  // Liga (série do jogador)
  const compLiga = state.compState[`serie${divisao}`];
  if (compLiga) {
    compLiga.rounds.forEach((round, ri) => {
      round.forEach(m => {
        if (m.jogada) return;
        if (m.home !== timeId && m.away !== timeId) return;
        if (m.data.slice(0, 10) < todayISO) return;
        candidates.push({
          data: m.data,
          home: m.home, away: m.away,
          competicao: ["Série A", "Série B", "Série C", "Série D"][divisao - 1],
          faseLabel: `Rodada ${m.rodada}`,
          source: "liga"
        });
      });
    });
  }

  // Copa do Brasil
  const copa = state.compState.copa;
  if (copa) {
    copa.partidas.forEach(m => {
      if (m.jogada) return;
      if (m.home !== timeId && m.away !== timeId) return;
      if (m.data.slice(0, 10) < todayISO) return;
      candidates.push({
        data: m.data,
        home: m.home, away: m.away,
        competicao: "Copa do Brasil",
        faseLabel: m.faseLabel,
        source: "copa"
      });
    });
  }

  candidates.sort((a, b) => new Date(a.data) - new Date(b.data));
  return candidates[0] || null;
}

// Calcula rodada "vigente": menor rodada com pelo menos 1 jogo NÃO jogado
function calcRodadaVigente(comp) {
  for (let i = 0; i < comp.rounds.length; i++) {
    if (comp.rounds[i].some(m => !m.jogada)) return i + 1;
  }
  return comp.rounds.length;
}

function formatMatchDateTime(iso) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const wd = ["DOM","SEG","TER","QUA","QUI","SEX","SÁB"][d.getDay()];
  return `${wd} ${dd}/${mm} · ${hh}:${mi}`;
}

function renderCopaPanel() {
  const copa = ensureCopa();
  const playerTimeId = teams.find(t => t.id === state.selectedTeam)?.timeId;
  const fasesNomes = COPA_FASES.map(f => f.nome);
  const faseSel = state.copaFaseSel || copa.faseCorrente || "Primeira Fase";
  const matchesFase = copa.partidas.filter(p => p.fase === faseSel);
  const totalVivos = copa.fase === "encerrado" ? 0 : copa.vivos.length;
  const numParticipantes = COPA_FASES.find(f => f.nome === copa.faseCorrente);

  return `
    <div class="copa-body">
      <div class="copa-meta">
        <div><span class="muted">FASE ATUAL</span><b>${copa.fase === "encerrado" ? "Encerrada" : copa.faseCorrente}</b></div>
        <div><span class="muted">TIMES VIVOS</span><b>${totalVivos}</b></div>
        <div><span class="muted">CAMPEÃO</span><b class="good">${copa.campeao ? copaForcaLookup(copa.campeao).nome : "—"}</b></div>
        <div><span class="muted">VICE</span><b>${copa.vice ? copaForcaLookup(copa.vice).nome : "—"}</b></div>
      </div>

      <div class="copa-fases">
        ${fasesNomes.map(f => {
          const tem = copa.partidas.some(p => p.fase === f);
          return `<button class="copa-fase-btn ${faseSel === f ? "active" : ""} ${tem ? "" : "disabled"}" data-copa-fase="${f}" ${tem ? "" : "disabled"}>${f}</button>`;
        }).join("")}
      </div>

      <div class="copa-matches">
        ${matchesFase.length === 0 ? "<p class='muted' style='padding:30px;text-align:center'>Fase ainda não disputada.</p>" : matchesFase.map(m => {
          const home = copaForcaLookup(m.home);
          const away = copaForcaLookup(m.away);
          const isPlayer = m.home === playerTimeId || m.away === playerTimeId;
          const dt = formatMatchDateTime(m.data);
          const placar = m.jogada
            ? (m.penaltis
              ? `<b>${m.g1}</b><span>×</span><b>${m.g2}</b><small class="copa-pen">pen ${m.penaltis.vencedor === m.home ? m.penaltis.placarVenc + "×" + m.penaltis.placarPerd : m.penaltis.placarPerd + "×" + m.penaltis.placarVenc}</small>`
              : `<b>${m.g1}</b><span>×</span><b>${m.g2}</b>`)
            : `<span class="muted">×</span>`;
          return `<div class="comp-match ${isPlayer ? "comp-match-player" : ""} ${m.jogada ? "played" : ""}">
            <div class="comp-match-meta">
              <small>${dt}</small>
              <span class="comp-tie-label">${m.faseLabel}</span>
              ${m.jogada ? `<span class="muted">FT</span>` : ""}
            </div>
            <div class="comp-match-row">
              <div class="comp-team comp-team-home">
                <span class="comp-team-name">${home.nome}</span>
                <span class="comp-color" style="background:${home.cor}"></span>
              </div>
              <div class="comp-score">${placar}</div>
              <div class="comp-team comp-team-away">
                <span class="comp-color" style="background:${away.cor}"></span>
                <span class="comp-team-name">${away.nome}</span>
              </div>
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>
  `;
}

function renderHistoricoCompeticao() {
  const filtro = state.compHistFiltro || "A";
  const galeria = state.compState?.galeria || {};
  const dados = [...(HISTORICO_INICIAL[filtro] || []), ...(galeria[filtro] || [])];

  // Maiores campeões: contagem por nome
  const counts = {};
  dados.forEach(h => { counts[h.campeao] = (counts[h.campeao] || 0) + 1; });
  const ranking = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  // Por ano: ordem decrescente
  const porAno = dados.slice().reverse();

  const filtroBtn = (id, label) => `<button class="hist-filter-btn ${filtro === id ? "active" : ""}" data-comp-hist-filter="${id}">${label}</button>`;

  return `
    <div class="hist-body">
      <div class="hist-filter">
        ${filtroBtn("A", "SÉRIE A")}
        ${filtroBtn("B", "SÉRIE B")}
        ${filtroBtn("C", "SÉRIE C")}
        ${filtroBtn("D", "SÉRIE D")}
        ${filtroBtn("Copa", "COPA DO BRASIL")}
      </div>
      <div class="hist-cols">
        <div class="hist-col">
          <h3>MAIORES CAMPEÕES</h3>
          <div class="hist-list">
            ${ranking.map(([nome, qtd], i) => `
              <div class="hist-row">
                <span class="hist-pos">${i + 1}º</span>
                <span class="hist-name">${nome}</span>
                <b class="hist-titulos">${qtd} ${qtd === 1 ? "título" : "títulos"}</b>
              </div>`).join("") || "<p class='muted' style='padding:20px;text-align:center'>Sem dados.</p>"}
          </div>
        </div>
        <div class="hist-col">
          <h3>CAMPEÕES POR ANO</h3>
          <div class="hist-list">
            ${porAno.map(h => `
              <div class="hist-row">
                <span class="hist-pos">${h.ano}</span>
                <span class="hist-name"><b>${h.campeao}</b></span>
                <span class="hist-vice muted">vice: ${h.vice}</span>
              </div>`).join("") || "<p class='muted' style='padding:20px;text-align:center'>Sem dados.</p>"}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCompeticoes() {
  const subtab = state.compSubtab || "1";

  // Aba especial HISTÓRICO
  if (subtab === "historico") {
    document.querySelector("#competicoes").innerHTML = `
      <div class="hg-grid">
        <article class="hg-card" style="grid-column: span 12">
          <header class="hg-card-head"><span class="hg-bar"></span><h2>COMPETIÇÕES</h2></header>
          <div class="tor-tabs">
            <button class="tor-tab" data-comp-subtab="1">SÉRIE A</button>
            <button class="tor-tab" data-comp-subtab="2">SÉRIE B</button>
            <button class="tor-tab" data-comp-subtab="3">SÉRIE C</button>
            <button class="tor-tab" data-comp-subtab="4">SÉRIE D</button>
            <button class="tor-tab" data-comp-subtab="copa">COPA DO BRASIL</button>
            <button class="tor-tab active" data-comp-subtab="historico">HISTÓRICO</button>
          </div>
          ${renderHistoricoCompeticao()}
        </article>
      </div>`;
    return;
  }
  // Aba COPA DO BRASIL
  if (subtab === "copa") {
    document.querySelector("#competicoes").innerHTML = `
      <div class="hg-grid">
        <article class="hg-card" style="grid-column: span 12">
          <header class="hg-card-head"><span class="hg-bar"></span><h2>COMPETIÇÕES</h2></header>
          <div class="tor-tabs">
            <button class="tor-tab" data-comp-subtab="1">SÉRIE A</button>
            <button class="tor-tab" data-comp-subtab="2">SÉRIE B</button>
            <button class="tor-tab" data-comp-subtab="3">SÉRIE C</button>
            <button class="tor-tab" data-comp-subtab="4">SÉRIE D</button>
            <button class="tor-tab active" data-comp-subtab="copa">COPA DO BRASIL</button>
            <button class="tor-tab" data-comp-subtab="historico">HISTÓRICO</button>
          </div>
          ${renderCopaPanel()}
        </article>
      </div>`;
    return;
  }

  const divisao = parseInt(subtab, 10);
  const comp = ensureCompetition(divisao);
  const rodadaVigente = calcRodadaVigente(comp);
  const rodadaSel = clamp(state.compRodadaSelected || rodadaVigente, 1, comp.rounds.length);

  const tabBtn = (id, label) => `<button class="tor-tab ${subtab === id ? "active" : ""}" data-comp-subtab="${id}">${label}</button>`;
  const playerTimeId = teams.find(t => t.id === state.selectedTeam)?.timeId;
  const round = comp.rounds[rodadaSel - 1] || [];

  // === CLASSIFICAÇÃO ===
  let classificacaoHTML = "";
  // Série D em mata-mata → mostra bracket em árvore
  if (divisao === 4 && comp.playoffs?.oitavas) {
    const renderTie = tie => {
      if (!tie) return `<div class="bk-tie bk-tie-empty"><div class="bk-tie-team muted">—</div><div class="bk-tie-team muted">—</div></div>`;
      const left = comp.clubes.find(c => c.id === tie.leftId);
      const right = comp.clubes.find(c => c.id === tie.rightId);
      const isPlayer = tie.leftId === playerTimeId || tie.rightId === playerTimeId;
      const winnerCls = id => tie.winnerId === id ? "bk-winner" : tie.winnerId ? "bk-loser" : "";
      const placar = (tie.leg1.jogada && tie.leg2.jogada)
        ? `<span class="bk-agg">${tie.aggLeft}-${tie.aggRight}${tie.penalties ? " p" : ""}</span>`
        : "";
      return `<div class="bk-tie ${isPlayer ? "bk-tie-player" : ""}">
        <div class="bk-tie-team ${winnerCls(tie.leftId)}">
          <span class="comp-color" style="background:${left?.cor}"></span>
          <span class="bk-tie-name">${left?.nome || "?"}</span>
        </div>
        <div class="bk-tie-team ${winnerCls(tie.rightId)}">
          <span class="comp-color" style="background:${right?.cor}"></span>
          <span class="bk-tie-name">${right?.nome || "?"}</span>
        </div>
        ${placar}
      </div>`;
    };

    const oit = comp.playoffs.oitavas || [];
    const qua = comp.playoffs.quartas || [null, null, null, null];
    const sem = comp.playoffs.semi || [null, null];
    const fin = (comp.playoffs.final || [null])[0];

    const renderPair = (a, b) => `
      <div class="bk-pair">
        ${renderTie(a)}
        ${renderTie(b)}
      </div>`;

    classificacaoHTML = `
      <div class="bk-bracket">
        <div class="bk-phase">
          <h4>OITAVAS</h4>
          <div class="bk-pairs">
            ${renderPair(oit[0], oit[1])}
            ${renderPair(oit[2], oit[3])}
            ${renderPair(oit[4], oit[5])}
            ${renderPair(oit[6], oit[7])}
          </div>
        </div>
        <div class="bk-phase">
          <h4>QUARTAS</h4>
          <div class="bk-pairs">
            ${renderPair(qua[0], qua[1])}
            ${renderPair(qua[2], qua[3])}
          </div>
        </div>
        <div class="bk-phase">
          <h4>SEMIFINAL</h4>
          <div class="bk-pairs">
            ${renderPair(sem[0], sem[1])}
          </div>
        </div>
        <div class="bk-phase bk-phase-final">
          <h4>FINAL</h4>
          <div class="bk-pairs">
            <div class="bk-pair bk-pair-final">
              ${renderTie(fin)}
            </div>
          </div>
        </div>
      </div>
      ${comp.campeaoId ? `<div class="comp-bracket-champ">🏆 CAMPEÃO: <b>${comp.clubes.find(c=>c.id===comp.campeaoId)?.nome}</b></div>` : ""}
    `;
  } else if (divisao === 4) {
    // 4 grupos de 12 — exibir 4 mini-tabelas
    const grupoSel = state.compGrupoSel || 1;
    const grupoBtn = g => `<button class="comp-grupo-tab ${grupoSel === g ? "active" : ""}" data-comp-grupo="${g}">GRUPO ${String.fromCharCode(64 + g)}</button>`;
    const cl = comp.clubes
      .filter(c => c.grupo === grupoSel)
      .sort((a, b) => b.pontos - a.pontos || b.sg - a.sg || b.gp - a.gp || a.nome.localeCompare(b.nome));
    classificacaoHTML = `
      <div class="comp-grupo-tabs">${[1,2,3,4].map(grupoBtn).join("")}</div>
      <div class="comp-table">
        <div class="comp-row comp-head">
          <div>#</div><div>TIME</div><div>P</div><div>V</div><div>E</div><div>D</div><div>GP</div><div>GC</div><div>SG</div>
        </div>
        <div class="comp-rows-scroll">
          ${cl.map((c, i) => `
            <div class="comp-row ${c.id === playerTimeId ? "comp-player" : ""} ${i < 4 ? "comp-g4" : i >= cl.length - 2 ? "comp-z4" : ""}">
              <div class="comp-pos">${i + 1}</div>
              <div class="comp-name"><span class="comp-color" style="background:${c.cor}"></span><span class="comp-name-text">${c.nome}</span></div>
              <div class="comp-pts"><b>${c.pontos}</b></div>
              <div>${c.v}</div><div>${c.e}</div><div>${c.d}</div>
              <div>${c.gp}</div><div>${c.gc}</div>
              <div class="${c.sg > 0 ? "good" : c.sg < 0 ? "bad" : ""}">${c.sg > 0 ? "+" + c.sg : c.sg}</div>
            </div>`).join("")}
        </div>
      </div>
      <small class="muted comp-legend">Top 4 de cada grupo classificam ao mata-mata · 2 últimos rebaixam</small>
    `;
  } else {
    const cl = comp.clubes.slice().sort((a, b) =>
      b.pontos - a.pontos || b.sg - a.sg || b.gp - a.gp || a.nome.localeCompare(b.nome));
    const totalTimes = cl.length;
    // Top 4 sobem (verde) e últimos 4 caem (vermelho) em A/B/C
    // Série A: top 4 = Libertadores, últimos 4 rebaixados
    // Série B: top 4 sobem para A, últimos 4 caem para C
    // Série C: top 4 sobem para B, últimos 4 caem para D
    const isG4 = i => [1, 2, 3].includes(divisao) && i < 4;
    const isZ4 = i => [1, 2, 3].includes(divisao) && i >= totalTimes - 4;
    classificacaoHTML = `
      <div class="comp-table">
        <div class="comp-row comp-head">
          <div>#</div><div>TIME</div><div>P</div><div>V</div><div>E</div><div>D</div><div>GP</div><div>GC</div><div>SG</div>
        </div>
        <div class="comp-rows-scroll">
          ${cl.map((c, i) => `
            <div class="comp-row ${c.id === playerTimeId ? "comp-player" : ""} ${isG4(i) ? "comp-g4" : ""} ${isZ4(i) ? "comp-z4" : ""}">
              <div class="comp-pos">${i + 1}</div>
              <div class="comp-name"><span class="comp-color" style="background:${c.cor}"></span><span class="comp-name-text">${c.nome}</span></div>
              <div class="comp-pts"><b>${c.pontos}</b></div>
              <div>${c.v}</div><div>${c.e}</div><div>${c.d}</div>
              <div>${c.gp}</div><div>${c.gc}</div>
              <div class="${c.sg > 0 ? "good" : c.sg < 0 ? "bad" : ""}">${c.sg > 0 ? "+" + c.sg : c.sg}</div>
            </div>`).join("")}
        </div>
      </div>
    `;
  }

  // === JOGOS DA RODADA ===
  // Detecta se é rodada de mata-mata (Série D, rodadas 23+)
  const ehMataMata = divisao === 4 && rodadaSel >= 23;
  const faseMataMata = !ehMataMata ? null
    : rodadaSel <= 24 ? "oitavas"
    : rodadaSel <= 26 ? "quartas"
    : rodadaSel <= 28 ? "semi"
    : "final";
  const legNum = ehMataMata ? ((rodadaSel - 23) % 2 === 0 ? 1 : 2) : null;
  const faseLabel = { oitavas: "OITAVAS DE FINAL", quartas: "QUARTAS DE FINAL", semi: "SEMIFINAL", final: "FINAL" };

  // Para Série D na fase de grupos, filtra pelo grupo selecionado
  const grupoFiltro = (divisao === 4 && !ehMataMata) ? (state.compGrupoSel || 1) : null;
  const matchesShow = grupoFiltro ? round.filter(m => m.grupo === grupoFiltro) : round;

  const matchesHTML = matchesShow.map(m => {
    const home = comp.clubes.find(c => c.id === m.home);
    const away = comp.clubes.find(c => c.id === m.away);
    const isPlayer = m.home === playerTimeId || m.away === playerTimeId;
    const tieLabel = m.tieId ? `JOGO ${m.tieId} · ${legNum === 1 ? "IDA" : "VOLTA"}` : "";
    return `<div class="comp-match ${isPlayer ? "comp-match-player" : ""} ${m.jogada ? "played" : ""}">
      <div class="comp-match-meta">
        <small>${formatMatchDateTime(m.data)}</small>
        ${tieLabel ? `<span class="comp-tie-label">${tieLabel}</span>` : ""}
        ${m.jogada ? `<span class="muted">FT</span>` : ""}
      </div>
      <div class="comp-match-row">
        <div class="comp-team comp-team-home">
          <span class="comp-team-name">${home?.nome || m.home}</span>
          <span class="comp-color" style="background:${home?.cor}"></span>
        </div>
        <div class="comp-score">
          ${m.jogada ? `<b>${m.g1}</b><span>×</span><b>${m.g2}</b>` : `<span class="muted">×</span>`}
        </div>
        <div class="comp-team comp-team-away">
          <span class="comp-color" style="background:${away?.cor}"></span>
          <span class="comp-team-name">${away?.nome || m.away}</span>
        </div>
      </div>
    </div>`;
  }).join("") || "<p class='muted' style='text-align:center;padding:20px'>Sem jogos nesta rodada.</p>";

  document.querySelector("#competicoes").innerHTML = `
    <div class="hg-grid">
      <article class="hg-card" style="grid-column: span 12">
        <header class="hg-card-head"><span class="hg-bar"></span><h2>COMPETIÇÕES</h2></header>
        <div class="tor-tabs">
          ${tabBtn("1", "SÉRIE A")}
          ${tabBtn("2", "SÉRIE B")}
          ${tabBtn("3", "SÉRIE C")}
          ${tabBtn("4", "SÉRIE D")}
          ${tabBtn("copa", "COPA DO BRASIL")}
          ${tabBtn("historico", "HISTÓRICO")}
        </div>

        <div class="comp-body ${divisao === 4 && comp.playoffs?.oitavas ? "comp-body-bracket" : ""}">
          <div class="comp-table-wrap">
            <header class="comp-section-head">
              <h3>${divisao === 4 && comp.playoffs?.oitavas ? "MATA-MATA" : "CLASSIFICAÇÃO" + (divisao === 4 ? " · FASE DE GRUPOS" : "")}</h3>
              <small class="muted">Rodada ${rodadaVigente} de ${comp.totalRodadas}</small>
            </header>
            ${classificacaoHTML}
          </div>

          <div class="comp-rounds-wrap">
            <header class="comp-section-head">
              <button class="comp-arrow" data-comp-rod="${rodadaSel - 1}" ${rodadaSel <= 1 ? "disabled" : ""}>‹</button>
              <h3>${ehMataMata ? `${faseLabel[faseMataMata]} · ${legNum === 1 ? "IDA" : "VOLTA"}` : `RODADA ${rodadaSel}`} <small>de ${comp.totalRodadas}</small></h3>
              <button class="comp-arrow" data-comp-rod="${rodadaSel + 1}" ${rodadaSel >= comp.totalRodadas ? "disabled" : ""}>›</button>
            </header>
            <div class="comp-matches">
              ${matchesHTML}
            </div>
          </div>
        </div>
      </article>
    </div>`;
}
function renderDiplomacia() { renderPanelPlaceholder("diplomacia", "DIPLOMACIA", "Alianças, rivalidades e ranking nacional."); }


function relationBar(value) {
  const pct = clamp(value + 100, 0, 200) / 2;
  return `<div class="meter-track"><span style="width:${pct}%"></span></div>`;
}

function row(label, value) {
  return `<div class="row"><strong>${label}</strong><span>${value}</span></div>`;
}

function renderMessages() {
  els.messages.innerHTML = state.messages.map(m => `
    <article class="message ${m.urgency === "urgent" ? "urgent" : ""}">
      <strong>${m.from}</strong>
      <small>Dia ${m.day}</small>
      <p>${m.text}</p>
      ${m.actions?.length && !m.answered ? `<div class="message-actions">${m.actions.map((a, i) => `<button data-message="${m.id}" data-answer="${i}">${a}</button>`).join("")}</div>` : m.choice ? `<small>Resposta: ${m.choice}</small>` : ""}
    </article>`).join("") || "<p class='muted'>Sem mensagens ainda.</p>";
}

function renderTicker() {
  els.ticker.innerHTML = `<span>${state.news.slice(0, 10).join("  •  ")}</span>`;
}

function toast(text) {
  els.toast.textContent = text;
  els.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => els.toast.classList.remove("show"), 2600);
}

function activateTab(name) {
  const tab = document.querySelector(`.tab[data-tab="${name}"]`);
  if (!tab) return;
  els.tabs.forEach(t => t.classList.toggle("active", t === tab));
  els.panels.forEach(p => p.classList.toggle("active", p.id === name));
  if (name === "whatsapp") {
    state.messages.forEach(m => m.read = true);
    renderMessages();
    els.unreadBadge.textContent = 0;
  }
}

document.body.addEventListener("click", event => {
  const tab = event.target.closest(".tab");
  if (tab) activateTab(tab.dataset.tab);

  const action = event.target.closest("[data-action]");
  if (action) {
    const arg = action.dataset.actionArg;
    actionHandlers[action.dataset.action]?.(arg !== undefined ? Number(arg) : undefined);
  }

  const answer = event.target.closest("[data-message]");
  if (answer) {
    const msg = state.messages.find(m => m.id === answer.dataset.message);
    if (msg) handleUrgentResponse(msg, Number(answer.dataset.answer));
  }

  const jump = event.target.closest("[data-tab-jump]");
  if (jump) activateTab(jump.dataset.tabJump);

  if (event.target.id === "advanceWeekBtn") advanceWeek();

  // List item shortcut (Ações do Dia)
  const liAction = event.target.closest("li[data-action]");
  if (liAction) actionHandlers[liAction.dataset.action]?.();

  // TORCIDA panel — filter sidebar
  const torFilter = event.target.closest("[data-tor-filter]");
  if (torFilter) {
    state.torcidaFilter = torFilter.dataset.torFilter;
    renderTorcida();
  }
  // TORCIDA panel — sub-tabs
  const torSub = event.target.closest("[data-tor-subtab]");
  if (torSub) {
    state.torcidaSubtab = torSub.dataset.torSubtab;
    renderTorcida();
  }
  // TORCIDA panel — header sort (ciclo: desc → asc → off)
  const torSort = event.target.closest("[data-tor-sort]");
  if (torSort) {
    const k = torSort.dataset.torSort;
    if (state.torcidaSort !== k) {
      state.torcidaSort = k;
      state.torcidaSortDir = "desc";
    } else if (state.torcidaSortDir === "desc") {
      state.torcidaSortDir = "asc";
    } else {
      state.torcidaSort = null;
      state.torcidaSortDir = null;
    }
    renderTorcida();
  }
  // MAPA — zoom in/out
  const agBlock = event.target.closest("[data-ag-block]");
  if (agBlock) {
    toast(agBlock.dataset.agInfo || agBlock.title || "Quarteirao");
  }
  const mapaZoom = event.target.closest("[data-mapa-zoom]");
  if (mapaZoom) {
    const z = state.mapaZoom || 1;
    const passos = [0.5, 0.65, 0.8, 1.0, 1.25, 1.5, 1.85, 2.25];
    const idx = passos.findIndex(p => Math.abs(p - z) < 0.01);
    let novo = idx === -1 ? 1 : idx;
    if (mapaZoom.dataset.mapaZoom === "in") novo = Math.min(passos.length - 1, novo + 1);
    else novo = Math.max(0, novo - 1);
    state.mapaZoom = passos[novo];
    renderMapa();
  }
  // FINANCEIRO panel — sub-tabs
  const finSub = event.target.closest("[data-fin-subtab]");
  if (finSub) {
    state.financSubtab = finSub.dataset.finSubtab;
    renderFinanceiro();
  }
  if (event.target.id === "finDetalhes") {
    state.financSubtab = "transacoes";
    renderFinanceiro();
  }
  // Transações — filtro
  const transFiltro = event.target.closest("[data-trans-filtro]");
  if (transFiltro) {
    state.transFiltro = transFiltro.dataset.transFiltro;
    renderFinanceiro();
  }

  // CALENDÁRIO — sub-tabs / navegação / planejamento
  const calSub = event.target.closest("[data-cal-subtab]");
  if (calSub) {
    state.calSubtab = calSub.dataset.calSubtab;
    renderCalendario();
  }
  const calView = event.target.closest("[data-cal-view]");
  if (calView) {
    state.calView = calView.dataset.calView;
    renderCalendario();
  }
  const calDay = event.target.closest("[data-cal-day]");
  if (calDay && !calSub && !calView) {
    abrirPlanejamentoDia(calDay.dataset.calDay);
  }
  const planSet = event.target.closest("[data-plan-set]");
  if (planSet) {
    const [iso, action] = planSet.dataset.planSet.split("|");
    state.calendario = state.calendario || { planos: {} };
    if (action) state.calendario.planos[iso] = action;
    else delete state.calendario.planos[iso];
    document.querySelector("#planDialog")?.close?.();
    renderCalendario();
    saveSilent();
  }
  if (event.target.id === "closePlan") {
    document.querySelector("#planDialog")?.close?.();
  }
  const agendaFiltro = event.target.closest("[data-agenda-filtro]");
  if (agendaFiltro) {
    state.agendaFiltro = agendaFiltro.dataset.agendaFiltro;
    renderCalendario();
  }
  if (event.target.id === "rotinaLimpar") {
    if (state.calendario) state.calendario.rotinaSemanal = {};
    renderCalendario();
    saveSilent();
    toast("Rotina semanal limpa.");
  }
  // Treino — checkbox toggle (precisa contar mesmo no clique do label)
  if (event.target.id === "trainConfirm") {
    const dlg = document.querySelector("#trainDialog");
    const keys = Array.from(state._trainSelected || []);
    if (!spendAction()) { dlg?.close?.(); return; }
    treinarExecutar(keys);
    dlg?.close?.();
    state._trainSelected = new Set();
  }
  if (event.target.id === "closeTrain") {
    document.querySelector("#trainDialog")?.close?.();
  }
  if (event.target.id === "torTreinarBtn") {
    actionHandlers.treinar();
  }
  if (event.target.id === "recrutManualBtn" && !event.target.disabled) {
    actionHandlers.recrutar();
  }
  // Ficha: botões treinar/promover
  const fichaAct = event.target.closest("[data-ficha-act]");
  if (fichaAct && !fichaAct.disabled) {
    const k = fichaAct.dataset.fichaKey;
    if (fichaAct.dataset.fichaAct === "treinar") adicionarTreinoFila(k);
    else if (fichaAct.dataset.fichaAct === "promover") promoverMembro(k);
  }

  // COMPETIÇÕES — sub-tabs
  const compSub = event.target.closest("[data-comp-subtab]");
  if (compSub) {
    state.compSubtab = compSub.dataset.compSubtab;
    state.compRodadaSelected = null;
    state.compGrupoSel = 1;
    renderCompeticoes();
  }
  // COMPETIÇÕES — navegar rodada
  const compRod = event.target.closest("[data-comp-rod]");
  if (compRod && !compRod.disabled) {
    state.compRodadaSelected = parseInt(compRod.dataset.compRod, 10);
    renderCompeticoes();
  }
  // COMPETIÇÕES — Série D: trocar grupo
  const compGrupo = event.target.closest("[data-comp-grupo]");
  if (compGrupo) {
    state.compGrupoSel = parseInt(compGrupo.dataset.compGrupo, 10);
    renderCompeticoes();
  }
  // COMPETIÇÕES — Histórico: trocar filtro
  const compHistFiltro = event.target.closest("[data-comp-hist-filter]");
  if (compHistFiltro) {
    state.compHistFiltro = compHistFiltro.dataset.compHistFilter;
    renderCompeticoes();
  }
  // COMPETIÇÕES — Copa: trocar fase
  const copaFase = event.target.closest("[data-copa-fase]");
  if (copaFase && !copaFase.disabled) {
    state.copaFaseSel = copaFase.dataset.copaFase;
    renderCompeticoes();
  }
  // TORCIDA — clicar na linha abre a ficha do membro direto
  const torRow = event.target.closest("[data-tor-row]");
  if (torRow) {
    document.querySelectorAll("[data-tor-row]").forEach(r => r.classList.toggle("selected", r === torRow));
    const idx = Number(torRow.dataset.torRow);
    state._selectedRosterIdx = idx;
    if (state._rosterCache?.[idx]) openFichaMembro(state._rosterCache[idx]);
  }
  // TORCIDA — VER PERFIL (ou duplo clique abre direto)
  if (event.target.id === "torVerPerfil") {
    const idx = state._selectedRosterIdx;
    if (Number.isFinite(idx) && state._rosterCache?.[idx]) openFichaMembro(state._rosterCache[idx]);
    else toast("Selecione um membro na tabela.");
  }
  if (event.target.id === "torAcoes") {
    toast("Ações por membro chegam em fase posterior.");
  }
  if (event.target.id === "closeFicha") {
    document.querySelector("#fichaDialog")?.close?.();
  }

  if (event.target.id === "hgMoreActions") {
    toast("Mais ações chegam em fases futuras do protótipo.");
  }
});

document.body.addEventListener("input", event => {
  // Pesquisa de membros (digita)
  if (event.target.id === "torSearchInput") {
    state.torcidaSearch = event.target.value;
    // Re-renderiza só a sub-aba (preserva foco do input)
    const torcidaPanel = document.querySelector("#torcida");
    if (torcidaPanel) {
      const focused = document.activeElement === event.target;
      const cursor = event.target.selectionStart;
      renderTorcida();
      if (focused) {
        const newInput = document.querySelector("#torSearchInput");
        if (newInput) {
          newInput.focus();
          try { newInput.setSelectionRange(cursor, cursor); } catch(_) {}
        }
      }
    }
  }
});

document.body.addEventListener("change", event => {
  // Mapa — filtros individuais
  const mf = event.target.closest("[data-mapa-filt]");
  if (mf) {
    const f = getMapaFiltros();
    f[mf.dataset.mapaFilt] = !!event.target.checked;
    renderMapa();
    return;
  }
  // Mapa — checkbox de grupo (TORCIDAS / DEMAIS LOCAIS) liga/desliga todos
  const mfg = event.target.closest("[data-mapa-filt-group]");
  if (mfg) {
    const f = getMapaFiltros();
    const valor = !!event.target.checked;
    const grupo = mfg.dataset.mapaFiltGroup;
    const keys = grupo === "torcidas" ? FILTRO_TORCIDAS
              : grupo === "neutros"  ? FILTRO_NEUTROS
              : [];
    keys.forEach(k => { f[k] = valor; });
    renderMapa();
    return;
  }
  // Treino — toggle checkbox
  const trainCb = event.target.closest("[data-train-key]");
  if (trainCb) {
    const cap = [0, 2, 4, 8, 12, 20][state.player.buildings.sede];
    state._trainSelected = state._trainSelected || new Set();
    const k = trainCb.dataset.trainKey;
    if (event.target.checked) {
      if (state._trainSelected.size >= cap) {
        event.target.checked = false;
        toast(`Limite de ${cap} membros pra treinar.`);
        return;
      }
      state._trainSelected.add(k);
    } else {
      state._trainSelected.delete(k);
    }
    preencherModalTreino();
  }

  const wd = event.target.closest("[data-week-day]");
  if (wd) {
    const key = wd.dataset.weekDay;
    state.weekPlan = state.weekPlan || {};
    if (event.target.value) state.weekPlan[key] = event.target.value;
    else delete state.weekPlan[key];
    saveSilent();
  }
  // Rotina semanal — select por dia da semana
  const rotinaDia = event.target.closest("[data-rotina-dia]");
  if (rotinaDia) {
    const dia = Number(rotinaDia.dataset.rotinaDia);
    state.calendario = state.calendario || { planos: {}, rotinaSemanal: {} };
    state.calendario.rotinaSemanal = state.calendario.rotinaSemanal || {};
    if (event.target.value) state.calendario.rotinaSemanal[dia] = event.target.value;
    else delete state.calendario.rotinaSemanal[dia];
    saveSilent();
  }
  // Agenda — dropdown de time
  if (event.target.id === "agendaTimeSelect") {
    state.agendaTimeId = event.target.value;
    state.agendaFiltro = "todas"; // reset filtro ao trocar time
    renderCalendario();
  }
});

document.querySelector("#closeWhats")?.addEventListener("click", () => els.whatsDialog.close());
document.querySelector("#saveGame")?.addEventListener("click", saveState);
document.querySelector("#resetGame")?.addEventListener("click", () => resetState());
els.advanceDay.addEventListener("click", advanceDay);

render();

// ===== Title Screen / Main Menu =====
(function setupTitleScreen() {
  const screen = document.querySelector("#titleScreen");
  if (!screen) return;
  const options = screen.querySelectorAll(".title-option");
  const dialog = document.querySelector("#newGameDialog");
  const ngList = document.querySelector("#ngList");
  const ngSearch = document.querySelector("#ngSearch");
  const ngDifficulty = document.querySelector("#ngDifficulty");
  const ngDetail = document.querySelector("#ngDetail");
  const ngCount = document.querySelector("#ngCount");
  const ngTabs = document.querySelectorAll(".ng-tab");
  const ngClose = document.querySelector("#closeNewGame");

  let pickedTeamId = null;
  let activeDivision = "all";

  function flagSwatch(t, big = false) {
    const c1 = t.corCamisa || t.cor || "#a51f1c";
    const c2 = t.corCalcao || "#0a0a0a";
    const c3 = t.corDetalhe || "#0a0a0a";
    if (big) {
      return `
        <div class="ng-flag" aria-hidden="true">
          <div class="stripe1" style="background:${c1}"></div>
          <div class="stripe2" style="background:${c3}"></div>
          <div class="stripe3" style="background:${c2}"></div>
          <div class="ng-flag-emblem" style="color:${textOn(c3)}">${initials(t.torcida || t.nome)}</div>
        </div>`;
    }
    return `
      <div class="ng-mini-flag" style="background:linear-gradient(180deg, ${c1} 0 33%, ${c3} 33% 66%, ${c2} 66% 100%)" aria-hidden="true"></div>`;
  }

  function textOn(hex) {
    const h = (hex || "#000").replace("#", "");
    if (h.length < 6) return "#fff";
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    const lum = (0.299*r + 0.587*g + 0.114*b);
    return lum > 160 ? "#1a1a1a" : "#fff";
  }

  function hasSave() {
    try { return !!localStorage.getItem(STORAGE_KEY); } catch { return false; }
  }

  function refreshContinueState() {
    const cont = screen.querySelector('[data-menu="continuar"]');
    if (!cont) return;
    cont.classList.toggle("disabled", !hasSave());
    if (!hasSave()) {
      options.forEach(o => o.classList.remove("active"));
      screen.querySelector('[data-menu="novo"]').classList.add("active");
    }
  }

  function showTitle() {
    screen.classList.remove("hidden");
    screen.style.display = ""; // limpa qualquer inline display herdado
    refreshContinueState();
    screen.focus();
  }
  function hideTitle() { screen.classList.add("hidden"); }

  function filteredTeams() {
    const f = (ngSearch.value || "").trim().toLowerCase();
    return teams.filter(t => {
      if (activeDivision !== "all" && String(t.divisao) !== activeDivision) return false;
      if (!f) return true;
      return t.nome.toLowerCase().includes(f) ||
        (t.torcida || "").toLowerCase().includes(f) ||
        (t.cidade || "").toLowerCase().includes(f);
    }).sort((a, b) => a.torcida.localeCompare(b.torcida));
  }

  function renderTeamList() {
    const list = filteredTeams();
    ngCount.textContent = list.length;
    ngList.innerHTML = list.map(t => `
      <div class="ng-row ${t.id === pickedTeamId ? "selected" : ""}" data-team="${t.id}" role="option">
        ${flagSwatch(t, false)}
        <div class="ng-meta">
          <strong>${t.torcida || t.nome}</strong>
          <small>${(t.cidade || "?")}${t.estado ? " · " + t.estado : ""}</small>
        </div>
      </div>
    `).join("") || "<div class='ng-empty' style='border:none'>Nenhuma torcida encontrada.</div>";
  }

  function renderDetail() {
    const t = teams.find(x => x.id === pickedTeamId);
    if (!t) {
      ngDetail.innerHTML = `<div class="ng-empty">Selecione uma torcida à esquerda.</div>`;
      return;
    }
    const divLabel = { 1: "Série A", 2: "Série B", 3: "Série C", 4: "Série D" };
    const sede = sedeByMembers(t.membros);
    const saldoInicial = t.membros * 10;
    const prestigio = Math.min(100, sede * 16);
    const influencia = Math.min(100, Math.round((t.qualidade || 25) * 1.6 + sede * 4));
    const territorios = 1 + (sede >= 2 ? 1 : 0) + (sede >= 4 ? 1 : 0);
    const aliadosCount = (t.aliadosNomes || []).length;
    const irmandadeCount = (t.irmandadeNomes || []).length;
    const rivaisCount = (t.rivaisNomes || []).length;
    const maioresRivaisCount = (t.maioresRivaisNomes || []).length;
    const rival = t.rival || "—";

    ngDetail.innerHTML = `
      <div class="ng-detail-head">
        ${flagSwatch(t, true)}
        <div class="ng-headline">
          <div class="ng-tname">${t.torcida || t.nome}</div>
          <div class="ng-tcity">${t.cidade || "?"}${t.estado ? " · " + t.estado : ""}</div>
          <div class="ng-ttime">${t.nome} · ${divLabel[t.divisao] || "—"}${t.dataFundacao ? " · Fundada " + t.dataFundacao : ""}</div>
        </div>
      </div>
      <div class="ng-stats">
        <div class="ng-stat">
          <span class="ng-stat-label">Membros</span>
          <span class="ng-stat-value">${t.membros.toLocaleString("pt-BR")}</span>
        </div>
        <div class="ng-stat">
          <span class="ng-stat-label">Finanças</span>
          <span class="ng-stat-value">${BRL.format(saldoInicial)}</span>
        </div>
        <div class="ng-stat">
          <span class="ng-stat-label">Prestígio</span>
          <span class="ng-stat-value">${prestigio}/100</span>
        </div>
        <div class="ng-stat">
          <span class="ng-stat-label">Influência</span>
          <span class="ng-stat-value good">${influencia}/100</span>
        </div>
        <div class="ng-stat">
          <span class="ng-stat-label">Territórios</span>
          <span class="ng-stat-value">${territorios}</span>
        </div>
        <div class="ng-stat">
          <span class="ng-stat-label">Maior rival</span>
          <span class="ng-stat-value bad" style="font-size:15px">${rival}</span>
        </div>
        <div class="ng-stat">
          <span class="ng-stat-label">Sede inicial</span>
          <span class="ng-stat-value warn">Nível ${sede}</span>
        </div>
        <div class="ng-stat">
          <span class="ng-stat-label">Aliados / Irmandade</span>
          <span class="ng-stat-value good" style="font-size:15px">${aliadosCount} / ${irmandadeCount}</span>
        </div>
        <div class="ng-stat">
          <span class="ng-stat-label">Rivais / Maiores</span>
          <span class="ng-stat-value bad" style="font-size:15px">${rivaisCount} / ${maioresRivaisCount}</span>
        </div>
      </div>
      <div class="ng-actions-bar">
        <button class="ng-start-btn" id="ngStart">SELECIONAR TORCIDA</button>
      </div>
    `;
    document.querySelector("#ngStart")?.addEventListener("click", startNewGame);
  }

  function openNewGame() {
    pickedTeamId = state?.selectedTeam || defaultTeam?.id || teams[0]?.id;
    activeDivision = "all";
    ngTabs.forEach(tab => tab.classList.toggle("active", tab.dataset.div === "all"));
    ngDifficulty.value = state?.difficulty || "normal";
    ngSearch.value = "";
    renderTeamList();
    renderDetail();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function startNewGame() {
    if (!pickedTeamId) return;
    // Close dialog first so it doesn't overlap the new home
    try { dialog.close?.(); } catch(_) {}
    dialog.removeAttribute("open");
    hideTitle();
    // Reset state (renders fresh home)
    resetState(pickedTeamId, ngDifficulty.value);
    // Force home tab active
    if (typeof activateTab === "function") activateTab("home");
  }

  options.forEach(opt => {
    opt.addEventListener("mouseenter", () => {
      if (opt.classList.contains("disabled")) return;
      options.forEach(o => o.classList.remove("active"));
      opt.classList.add("active");
    });
    opt.addEventListener("click", () => {
      if (opt.classList.contains("disabled")) return;
      const action = opt.dataset.menu;
      if (action === "continuar") {
        if (!hasSave()) return;
        hideTitle();
      } else if (action === "novo") {
        openNewGame();
      } else if (action === "carregar") {
        toast("Slots de save chegam na Fase 1.6 (Bloco 5).");
      } else if (action === "config") {
        toast("Configurações ainda não implementadas.");
      } else if (action === "conquistas") {
        toast("Conquistas — em desenvolvimento.");
      } else if (action === "creditos") {
        toast("Torcida Organizada — Protótipo Codex (Solo Dev).");
      } else if (action === "sair") {
        if (confirm("Fechar a aba?")) window.close();
      }
    });
  });

  ngSearch?.addEventListener("input", () => renderTeamList());
  ngList?.addEventListener("click", e => {
    const r = e.target.closest(".ng-row");
    if (!r) return;
    pickedTeamId = r.dataset.team;
    ngList.querySelectorAll(".ng-row").forEach(x => x.classList.toggle("selected", x === r));
    renderDetail();
  });
  ngTabs.forEach(tab => tab.addEventListener("click", () => {
    activeDivision = tab.dataset.div;
    ngTabs.forEach(t => t.classList.toggle("active", t === tab));
    renderTeamList();
  }));
  ngClose?.addEventListener("click", () => dialog.close?.());

  screen.addEventListener("keydown", e => {
    const list = Array.from(options).filter(o => !o.classList.contains("disabled"));
    const idx = list.findIndex(o => o.classList.contains("active"));
    if (e.key === "ArrowDown") {
      e.preventDefault();
      list.forEach(o => o.classList.remove("active"));
      list[(idx + 1) % list.length]?.classList.add("active");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      list.forEach(o => o.classList.remove("active"));
      list[(idx - 1 + list.length) % list.length]?.classList.add("active");
    } else if (e.key === "Enter") {
      e.preventDefault();
      list[idx]?.click();
    }
  });
  screen.tabIndex = 0;
  setTimeout(() => screen.focus(), 50);

  // Botão "Menu Principal" agora vive no HTML (#openTitle). Apenas conecta o handler.
  const openTitleBtn = document.querySelector("#openTitle");
  if (openTitleBtn && !openTitleBtn._wired) {
    openTitleBtn._wired = true;
    openTitleBtn.addEventListener("click", showTitle);
  }

  refreshContinueState();
})();
