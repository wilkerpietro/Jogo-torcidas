
/* =========================================================
   BANCADA DE CENAS — a página solta de arredores.html
   ---------------------------------------------------------
   Uma aba por cenário: arredores, praça, rua, bar da rival,
   alvo comercial e CT. Trocar de aba remonta a noite naquele
   cenário, com o efetivo que aquele tipo de briga costuma ter.

   É a mesma ponte que o jogo usa. O que rodar aqui roda lá —
   por isso a bancada serve pra calibrar sem abrir o save.
   ========================================================= */
window.TO = window.TO || {};
TO.diaJogo = TO.diaJogo || {};

TO.diaJogo.bancada = (function(){
  const CENAS = [
    {id:'arredores', rot:'Arredores', titulo:'Arredores do estádio',
     cfg:{intencao:'atacar', bombas:2, efetivoRival:30}},
    /* a mesma cena em noite tranquila, que é o outro comportamento
       inteiro dos arredores: ninguém marcha pro portão, o pessoal fica
       de conversa e entra escalão por escalão perto da hora. Sem uma
       aba própria não havia como ver — a de cima força briga. */
    {id:'arredores', rot:'Arredores · em paz', titulo:'Arredores, noite tranquila',
     cfg:{paz:true, bombas:2, efetivoRival:30}},
    {id:'praca', rot:'Praça', titulo:'Praça do bairro',
     cfg:{intencao:'atacar', bombas:1, efetivoRival:22}},
    {id:'rua', rot:'Rua · periferia', titulo:'Rua de bairro de periferia',
     cfg:{intencao:'atacar', bombas:1, efetivoRival:18}},
    {id:'rua-media', rot:'Rua · classe média', titulo:'Rua de classe média',
     cfg:{intencao:'atacar', bombas:1, efetivoRival:18}},
    {id:'rua-nobre', rot:'Rua · classe alta', titulo:'Rua de bairro nobre',
     cfg:{intencao:'atacar', bombas:1, efetivoRival:18}},
    {id:'bar', rot:'Bar da rival', titulo:'Bar da torcida rival',
     cfg:{intencao:'atacar', bombas:2, efetivoRival:14}},
    {id:'comercio', rot:'Comércio', titulo:'Alvo comercial',
     cfg:{intencao:'atacar', bombas:0, efetivoRival:6}},
    {id:'ct', rot:'CT do clube', titulo:'CT do clube',
     cfg:{intencao:'atacar', bombas:0, efetivoRival:10}},

    /* O LOTE DE 19/08 (fotos do dono) entra na bancada pelo mesmo
       motivo das outras: é aqui que a máscara se acerta no F2. As
       tretas abrem sem arma, como no jogo; os estádios abrem com os
       setores ligados, senão o bonde do jogador tomaria o spawn do
       1º escalão e a planta não seria a que se vai editar. */
    {id:'treta-beco', rot:'Treta · beco', titulo:'Treta 5×5 no beco',
     cfg:{intencao:'atacar', semArmas:true, bombas:0, efetivoRival:5}},
    {id:'treta-galpao', rot:'Treta · galpão', titulo:'Treta 7×7 no pátio do galpão',
     cfg:{intencao:'atacar', semArmas:true, bombas:0, efetivoRival:7}},
    {id:'treta-campo', rot:'Treta · campo', titulo:'Treta 10×10 no campo de terra',
     cfg:{intencao:'atacar', semArmas:true, bombas:0, efetivoRival:10}},
    {id:'emb-posto', rot:'Emboscada · posto', titulo:'Emboscada no pátio do posto',
     cfg:{intencao:'atacar', bombas:2, efetivoRival:24}},
    {id:'emb-onibus', rot:'Emboscada · estrada', titulo:'Emboscada na pista, ônibus parado',
     cfg:{intencao:'atacar', bombas:2, efetivoRival:24}},
    {id:'estadio-10', rot:'Estádio · 10 mil', titulo:'Arquibancada do estádio de 10 mil',
     cfg:{intencao:'atacar', paz:false, setores:true, bombas:0, efetivoRival:60}},
    {id:'estadio-20', rot:'Estádio · 20 mil', titulo:'Arquibancada do estádio de 20 mil',
     cfg:{intencao:'atacar', paz:false, setores:true, bombas:0, efetivoRival:80}},
    {id:'estadio-40', rot:'Estádio · 40 mil', titulo:'Arquibancada do estádio de 40 mil',
     cfg:{intencao:'atacar', paz:false, setores:true, bombas:0, efetivoRival:90}},
    /* A CASA DE PISCINA (dono, 21/09/2026): a zona deles de resenha,
       20 contra 20, faixa no muro do deck — entra aqui antes de tudo,
       pra máscara ser acertada no F2 e a cena ser vista antes de
       valer no jogo. `faixaDefensor:'eles'` estende a peça deles. */
    {id:'casa-piscina', rot:'Casa de piscina', titulo:'Resenha na casa de piscina',
     cfg:{intencao:'atacar', bombas:0, efetivoRival:20, faixaDefensor:'eles'}},
    /* A REUNIÃO DA DIRETORIA NO PÁTIO DA SEDE (dono, 22/09/2026): uma
       aba por nível de sede, com a diretoria sentada em C no pátio e o
       presidente em pé à direita — sem briga. A escalação de mentira é
       só pra cada cadeira ter um nome. É aqui que a máscara de cada
       sede se acerta no F2. */
    ...[1,2,3,4,5].map(n => ({id:'sede-'+n, rot:'Sede '+n,
      titulo:`Reunião da diretoria — sede nível ${n}${n===5?' (e 6)':''}`,
      cfg:{paz:true, reuniao:true, bombas:0, efetivoRival:0,
           escalacao: (()=>{
             const N = (TO.dados && TO.dados.nomes) || {};
             const ap = N.apelidos || ['Zé','Tião','Bento','Dudu','Caju','Neco','Buda','Tico'];
             const fora = [];
             for(let i=0;i<13;i++) fora.push({id:i+1, apelido:String(ap[(i*7+n) % ap.length]),
               forca:12+(i%6), defesa:12+((i*3)%6), xp:300+i*10, moral:12, cargo:'diretoria'});
             return fora;
           })()}}))
  ];

  /* A BANCADA DE PERTO (briga3d.html) usa a mesma bancada com outra
     lista: as três ruas na versão vista de trás do líder. É a mesma
     ponte e o mesmo combate — o que muda é o canvas, que ali é WebGL e
     tem a camada de nomes por cima. */
  const CENAS_3D = [
    {id:'rua-3d', rot:'Rua · periferia', titulo:'Rua de periferia, vista de perto',
     cfg:{intencao:'atacar', bombas:1, efetivoRival:18}},
    {id:'rua-media-3d', rot:'Rua · classe média', titulo:'Rua de classe média, vista de perto',
     cfg:{intencao:'atacar', bombas:1, efetivoRival:18}},
    {id:'rua-nobre-3d', rot:'Rua · classe alta', titulo:'Rua de bairro nobre, vista de perto',
     cfg:{intencao:'atacar', bombas:1, efetivoRival:18}}
  ];

  const botoes = {};
  let atual = null, lista = CENAS, extra = {};

  function abrir(c){
    atual = c;
    /* A BANCADA ESTÁ SEMPRE EM CENA. O pad de toque só aparece com
       `em-cena` no body (cenas.css) — no jogo é quem entra na cena que
       marca; aqui a cena é a página inteira, e sem isto no celular não
       havia botão nenhum. */
    document.body.classList.add('em-cena');
    /* a chave é o rótulo e não o id: as duas abas de arredores são a
       mesma cena em situação diferente, e por id uma apagava a outra */
    for(const k of Object.keys(botoes)) botoes[k].classList.toggle('on', k === c.rot);
    /* no celular as abas rolam de lado: a aba aberta tem de estar à vista */
    const bt = botoes[c.rot], abas = bt && bt.parentElement;
    if(abas && abas.scrollWidth > abas.clientWidth + 2)
      bt.scrollIntoView({inline:'center', block:'nearest'});
    const t = document.getElementById('cenaTitulo');
    if(t) t.textContent = c.titulo;
    document.title = c.titulo + ' — Torcida Organizada';
    TO.diaJogo.ponte.montar(Object.assign({config: Object.assign({local:c.id}, c.cfg)}, extra));
  }

  function montar(cenas, opc){
    lista = cenas || CENAS; extra = opc || {};
    const abas = document.getElementById('cenaAbas');
    if(!abas) return;
    abas.innerHTML = '';
    for(const c of lista){
      const b = document.createElement('button');
      b.textContent = c.rot;
      b.onclick = ()=>abrir(c);
      botoes[c.rot] = b;
      abas.appendChild(b);
    }
    /* na bancada de cima, o botão que troca boneco por disco e volta:
       é a comparação que decide se o boneco fica */
    if(extra.sobreGL){
      const bt = document.createElement('button');
      const rot = ()=>{ bt.textContent = extra.bonecos ? 'Bonecos ✓' : 'Discos ✓';
                        bt.classList.toggle('on', !!extra.bonecos); };
      bt.onclick = ()=>{ extra.bonecos = !extra.bonecos; rot(); if(atual) abrir(atual); };
      bt.style.marginLeft = 'auto';
      rot();
      abas.appendChild(bt);
    }
    const dica = document.createElement('small');
    dica.textContent = 'trocar de aba recomeça a noite · F2 abre o editor';
    abas.appendChild(dica);
    /* #praca, #estadio-20…: abre direto na aba pedida, pra link e pra teste */
    const pedida = (location.hash||'').slice(1);
    abrir(lista.find(c=>c.id===pedida) || lista[0]);
  }

  return {CENAS, CENAS_3D, montar, abrir, get atual(){return atual;}};
})();

