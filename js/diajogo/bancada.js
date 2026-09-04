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
     cfg:{intencao:'atacar', bombas:0, efetivoRival:10}}
  ];

  /* A BANCADA 3D (briga3d.html) usa a mesma bancada com outra lista: as
     três ruas na versão de perto. É a mesma ponte e o mesmo combate — o
     que muda é o canvas, que ali é WebGL e tem a camada de nomes por
     cima. */
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
    /* a chave é o rótulo e não o id: as duas abas de arredores são a
       mesma cena em situação diferente, e por id uma apagava a outra */
    for(const k of Object.keys(botoes)) botoes[k].classList.toggle('on', k === c.rot);
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
    const dica = document.createElement('small');
    dica.textContent = extra.tres
      ? 'trocar de aba recomeça a noite · C troca a câmera'
      : 'trocar de aba recomeça a noite · F2 abre o editor';
    abas.appendChild(dica);
    abrir(lista[0]);
  }

  return {CENAS, CENAS_3D, montar, abrir, get atual(){return atual;}};
})();
