/* =========================================================
   MAIN — roteamento de abas da camada de gestão
   Fase 1 do GDD §25 em construção: por enquanto esta tela é só
   a casca navegável, e o que está pronto é a cena de dia de jogo.
   ========================================================= */
(function(){
  const U=TO.util;

  const ABAS=[
    {id:'sede',       rot:'Sede',       sub:'base, treino, upgrade'},
    {id:'torcida',    rot:'Torcida',    sub:'membros, recrutamento'},
    {id:'financeiro', rot:'Financeiro', sub:'receitas, despesas'},
    {id:'calendario', rot:'Calendário', sub:'semana, competições'}
  ];

  function montarAbas(){
    const nav=U.$('#abas');
    if(!nav) return;
    for(const a of ABAS){
      const b=U.criar('button',{class:'aba-bt', 'data-aba':a.id,
        html:`${a.rot}<small>${a.sub}</small>`});
      b.onclick=()=>trocar(a.id);
      nav.appendChild(b);
    }
    const dj=U.criar('button',{class:'aba-bt', html:'Dia de jogo<small>cena pronta</small>'});
    dj.style.borderBottomColor='var(--ouro)';
    dj.onclick=()=>location.href='arredores.html';
    nav.appendChild(dj);
    trocar('sede');
  }

  function trocar(id){
    U.$$('.aba').forEach(s=>s.classList.toggle('on', s.dataset.aba===id));
    U.$$('.aba-bt').forEach(b=>b.classList.toggle('on', b.dataset.aba===id));
  }

  /* enquanto os módulos de gestão não existem, cada painel diz o que
     vai ser dele — melhor que um painel vazio sem explicação */
  const PENDENTE={
    resumoSede:'Níveis de sede, capacidade, manutenção e cap de treino (GDD §8.1).',
    filaTreino:'Fila persistente de treino com ganho fracionário 0.0–0.3 (GDD §5.4).',
    planoSemana:'Distribuição de 2 a 3 ações por semana conforme o nível da sede (GDD §3.1).',
    listaPatrimonio:'Bares, lojas, subsedes e fábrica, com multiplicador de bairro (GDD §7.2, §8.3).',
    tabelaMembros:'Hierarquia, XP, promoção, arquétipos e fichas de Ferido e Preso (GDD §5).',
    painelRecrutamento:'Fórmula de recrutamento, cap por sede e histórico (GDD §6.2).',
    projecao:'Mensalidade, receita de bar e loja, manutenção e insumos (GDD §7).',
    transacoes:'Lançamento a lançamento, por dia.',
    listaDias:'Ritmo de dias calmo, quente e dia de jogo (GDD §22.2).',
    tabelaCampeonato:'Tabela do campeonato — o motor de competições da era Unity está em legado/unity e serve de base (GDD §18).'
  };
  function preencherPendentes(){
    for(const [id,txt] of Object.entries(PENDENTE)){
      const el=document.getElementById(id);
      if(el) el.innerHTML=`<div class="linha-dado"><span class="fraco">${txt}</span></div>`;
    }
    const t=U.$('#nomeTorcida'); if(t) t.textContent='Torcida Organizada';
    const s=U.$('#subIdentidade');
    if(s) s.textContent='vertical slice em construção — a cena de dia de jogo já roda';
  }

  /* telas modais que ainda não têm conteúdo ficam escondidas */
  function esconderModais(){
    for(const id of ['telaInicio','telaEscalacao','telaDiaJogo','telaRelatorio']){
      const el=document.getElementById(id);
      if(el) el.classList.add('oculto');
    }
  }

  function ticker(){
    const fita=U.$('#tickerFita');
    if(!fita) return;
    fita.innerHTML='<span class="destaque">Cena dos arredores refeita sobre foto aérea.</span>'+
      '<span>Malha de caminhabilidade extraída da própria imagem.</span>'+
      '<span>Navegação por campo de fluxo: os discos contornam prédio sozinhos.</span>'+
      '<span>Aperte F2 na cena para o editor.</span>';
    let x=fita.parentElement.clientWidth;
    setInterval(()=>{
      x-=0.6;
      if(x < -fita.scrollWidth) x=fita.parentElement.clientWidth;
      fita.style.transform=`translateX(${x - fita.parentElement.clientWidth}px)`;
    },16);
  }

  montarAbas();
  preencherPendentes();
  esconderModais();
  ticker();
})();
