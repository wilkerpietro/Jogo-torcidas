/* DIPLOMACIA — regras de relacao e parametros
   GERADO por ferramentas/importar_relacoes.py — nao editar a mao. */
TO.dados.diplomacia = {
 "regras": {
  "precedencia": [
   "Maior Rival",
   "Rival",
   "Irmandade",
   "Aliado",
   "Neutro"
  ],
  "relacoes": {
   "Maior Rival": {
    "ordem": 4,
    "corFundo": "#FF9999",
    "corTexto": "#CC0000",
    "podeMelhorar": false,
    "podePiorar": true,
    "podeAtacar": true
   },
   "Rival": {
    "ordem": 3,
    "corFundo": "#FFCCB3",
    "corTexto": "#FF0000",
    "podeMelhorar": true,
    "podePiorar": true,
    "podeAtacar": true
   },
   "Aliado": {
    "ordem": 2,
    "corFundo": "#B3FFB3",
    "corTexto": "#1AB31A",
    "podeMelhorar": true,
    "podePiorar": true,
    "podeAtacar": true
   },
   "Irmandade": {
    "ordem": 1,
    "corFundo": "#99E6FF",
    "corTexto": "#1A80E6",
    "podeMelhorar": true,
    "podePiorar": false,
    "podeAtacar": true
   },
   "Neutro": {
    "ordem": 0,
    "corFundo": "#FFFFFF",
    "corTexto": "#808080",
    "podeMelhorar": true,
    "podePiorar": true,
    "podeAtacar": true
   }
  }
 },
 "parametros": {
  "sede": {
   "nivelPorMembros": [
    [
     300,
     5
    ],
    [
     150,
     4
    ],
    [
     80,
     3
    ],
    [
     40,
     2
    ],
    [
     0,
     1
    ]
   ],
   "capacidadeMaxima": {
    "1": 50,
    "2": 100,
    "3": 150,
    "4": 200,
    "5": 500
   },
   "acoesPorDia": {
    "1": 1,
    "2": 1,
    "3": 2,
    "4": 2,
    "5": 3
   },
   "maxDiretoria": {
    "1": 3,
    "2": 5,
    "3": 8,
    "4": 10,
    "5": 15
   }
  },
  "membros": {
   "distribuicao": {
    "povao": 0.5,
    "componentes": 0.3,
    "linhaDeFrente": 0.15,
    "diretoria": 0.05
   },
   "faixa": [
    10,
    500
   ],
   "pisoMinimo": 10,
   "forcaLF": [
    3,
    8
   ],
   "hpLF": 150,
   "diasFerido": 30
  },
  "inicio": {
   "moral": 60,
   "prestigioPorNivelSede": 15,
   "saldoPorMembro": 10
  },
  "combate": {
   "pesoMoral": 0.15,
   "pesoNumerico": 5,
   "random": [
    0.85,
    1.15
   ],
   "margemEmpate": 2,
   "taxaFerirVencedor": 0.15,
   "taxaFerirPerdedor": 0.35,
   "taxaFerirEmpate": 0.2,
   "dano": [
    30,
    100
   ],
   "saqueBase": 500,
   "saqueRandom": 500,
   "saqueMaxPerc": 0.3,
   "moral": {
    "vitoria": 10,
    "derrota": -15,
    "empate": -3
   },
   "prestigio": {
    "vitoria": 8,
    "derrota": -10,
    "empate": -2
   },
   "chanceDanoEstabelecimento": 0.4,
   "diasReparo": 14
  },
  "fatorTorcida": {
   "publico": 0.4,
   "faixas": 0.25,
   "bateria": 0.2,
   "moral": 0.15
  }
 }
};
