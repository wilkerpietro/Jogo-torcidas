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

  const botoes = {};
  let atual = null;

  function abrir(c){
    atual = c;
    /* a chave é o rótulo e não o id: as duas abas de arredores são a
       mesma cena em situação diferente, e por id uma apagava a outra */
    for(const k of Object.keys(botoes)) botoes[k].classList.toggle('on', k === c.rot);
    const t = document.getElementById('cenaTitulo');
    if(t) t.textContent = c.titulo;
    document.title = c.titulo + ' — Torcida Organizada';
    TO.diaJogo.ponte.montar({config: Object.assign({local:c.id}, c.cfg)});
  }

  function montar(){
    const abas = document.getElementById('cenaAbas');
    if(!abas) return;
    abas.innerHTML = '';
    for(const c of CENAS){
      const b = document.createElement('button');
      b.textContent = c.rot;
      b.onclick = ()=>abrir(c);
      botoes[c.rot] = b;
      abas.appendChild(b);
    }
    const dica = document.createElement('small');
    dica.textContent = 'trocar de aba recomeça a noite · F2 abre o editor';
    abas.appendChild(dica);
    abrir(CENAS[0]);
  }

  return {CENAS, montar, abrir, get atual(){return atual;}};
})();
