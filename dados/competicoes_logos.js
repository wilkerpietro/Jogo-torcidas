/* AS LOGOS DAS COMPETIÇÕES (pedido do dono, 01/10/2026)
   Nome da competição → arquivo em img/competicoes. As oficiais vieram
   no pacote do dono; as que faltaram são emblemas desenhados pelo jogo
   (ferramentas/emblemas_competicoes.py). Logo oficial que chegar entra
   com o mesmo nome de arquivo, em png, e o nome vai pra `OFICIAIS`.
   O mesmo campeonato aparece com mais de um nome pelo jogo ("Brasileirão
   Série A" na temporada, "Série A" no menu, "Copa Libertadores" e
   "Libertadores"): os apelidos ficam todos na mesma tabela. */
TO.dados.logosCompeticoes = (function(){
  const L = {
    'serie-a':['Brasileirão Série A', 'Série A'],
    'serie-b':['Brasileirão Série B', 'Série B'],
    'serie-c':['Brasileirão Série C', 'Série C'],
    'serie-d':['Brasileirão Série D', 'Série D'],
    'copa-do-brasil':['Copa do Brasil'],
    'lnt':['LNT', 'Liga Nacional de Torcidas'],
    'copa-do-nordeste':['Copa do Nordeste'],
    'nordestao-serie-b':['Nordestão Série B'],
    'cariocao':['Cariocão'],
    'paulistao':['Paulistão'],
    'paulistao-a2':['Paulistão A2'],
    'copa-centro-oeste':['Copa Centro-Oeste'],
    'gauchao':['Gauchão'],
    'copa-norte':['Copa Norte'],
    'mineiro':['Mineiro'],
    'paranaense':['Paranaense'],
    'catarinense':['Catarinense'],
    'libertadores':['Copa Libertadores', 'Libertadores'],
    'sul-americana':['Copa Sul-Americana', 'Sul-Americana'],
    'argentina-primera':['Argentina Primera'],
    'argentina-primera-nacional':['Argentina Primera Nacional'],
    'argentina-primera-b':['Argentina Primera B'],
    'colombia-primera-a':['Colômbia Primera A'],
    'colombia-primera-b':['Colômbia Primera B'],
    'peru-liga-1':['Peru Liga 1'],
    'bolivia-primera':['Bolívia Primera'],
    'chile-primera':['Chile Primera'],
    'chile-primera-b':['Chile Primera B'],
    'equador-serie-a':['Equador Serie A'],
    'uruguai-primera':['Uruguai Primera'],
    'venezuela-primera':['Venezuela Primera'],
    'paraguai-primera':['Paraguai Primera'],
    'copa-argentina':['Copa Argentina'],
    'copa-bolivia':['Copa Bolivia'],
    'copa-chile':['Copa Chile'],
    'copa-colombia':['Copa Colombia'],
    'copa-ecuador':['Copa Ecuador'],
    'copa-paraguay':['Copa Paraguay'],
    'copa-peru':['Copa Perú'],
    'copa-uruguay':['Copa Uruguay'],
    'copa-venezuela':['Copa Venezuela']
  };
  /* as logos oficiais do pacote do dono (campeonatos.rar, 01/10/2026),
     e o segundo com as copas nacionais (campeonatos_restantes.rar), já
     sem fundo — ferramentas/importar_logos_competicoes.py. O Mineiro é a
     svg oficial; só a LNT, que não existe fora do jogo, segue com o
     emblema desenhado. */
  const OFICIAIS = new Set(['argentina-primera', 'argentina-primera-b', 'argentina-primera-nacional', 'bolivia-primera', 'cariocao', 'catarinense', 'chile-primera', 'chile-primera-b', 'colombia-primera-a', 'colombia-primera-b', 'copa-argentina', 'copa-bolivia', 'copa-centro-oeste', 'copa-chile', 'copa-colombia', 'copa-do-brasil', 'copa-do-nordeste', 'copa-ecuador', 'copa-norte', 'copa-paraguay', 'copa-peru', 'copa-uruguay', 'copa-venezuela', 'equador-serie-a', 'gauchao', 'libertadores', 'nordestao-serie-b', 'paraguai-primera', 'paranaense', 'paulistao', 'paulistao-a2', 'peru-liga-1', 'serie-a', 'serie-b', 'serie-c', 'serie-d', 'sul-americana', 'uruguai-primera', 'venezuela-primera']);
  const mapa = {};
  for(const arq in L) for(const nome of L[arq])
    mapa[nome] = 'img/competicoes/' + arq + (OFICIAIS.has(arq) ? '.png' : '.svg');
  return mapa;
})();

/* a logo pelo nome, aceitando o nome com o país na frente ("Primera B"
   do menu de um país vira "Chile Primera B" quando o país vem junto) */
TO.dados.logoDaCompeticao = function(nome, pais){
  const M = TO.dados.logosCompeticoes;
  if(!nome) return null;
  return M[nome] || (pais && M[pais + ' ' + nome]) || null;
};
