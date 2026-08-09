/* =========================================================
   ÍCONES — SVG inline, traço só, para casar com os mockups
   Nada de emoji: emoji muda de forma e cor por sistema.
   ========================================================= */
window.TO = window.TO || {};

TO.icones = (function(){
  const env = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

  const I = {
    casa:      env('<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M10 21v-6h4v6"/>'),
    torcida:   env('<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5.2a3 3 0 0 1 0 5.6"/><path d="M18 20c0-2.4-1-4.5-2.6-5.8"/>'),
    dinheiro:  env('<path d="M12 3v18"/><path d="M16.5 7.5c0-1.7-2-2.7-4.5-2.7S7.5 5.9 7.5 7.7 9.6 10 12 10.4s4.5 1 4.5 3-2 3-4.5 3-4.5-1-4.5-2.8"/>'),
    mapa:      env('<path d="m3 6 6-2.5 6 2.5 6-2.5v15L15 21 9 18.5 3 21z"/><path d="M9 3.5v15"/><path d="M15 6v15"/>'),
    trofeu:    env('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7 11"/><path d="M17 6h3v1.5A3.5 3.5 0 0 1 17 11"/><path d="M9.5 20h5"/><path d="M12 14v6"/>'),
    diplomacia:env('<path d="M7 11a3.5 3.5 0 1 1 3.5-3.5"/><path d="M17 20a3.5 3.5 0 1 0-3.5-3.5"/><path d="M9.5 9.5 15 15"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/>'),
    conversa:  env('<path d="M20.5 12c0 4.1-3.8 7.4-8.5 7.4-1.1 0-2.2-.2-3.2-.5L4 20.5l1.7-4A7 7 0 0 1 3.5 12c0-4.1 3.8-7.4 8.5-7.4s8.5 3.3 8.5 7.4z"/>'),
    jornal:    env('<path d="M3 5h13v14H4.5A1.5 1.5 0 0 1 3 17.5z"/><path d="M16 8h5v9.5a1.5 1.5 0 0 1-3 0V8"/><path d="M6 8.5h7"/><path d="M6 11.5h7"/><path d="M6 14.5h5"/>'),
    medalha:   env('<circle cx="12" cy="15" r="5"/><path d="m8.5 10.5-2.5-7"/><path d="m15.5 10.5 2.5-7"/><path d="M9 3.5h6"/>'),

    membros:   env('<circle cx="12" cy="7" r="3.2"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/>'),
    estrela:   env('<path d="m12 3.5 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8z"/>'),
    play:      env('<path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="none"/>'),
    halter:    env('<path d="M4 9v6"/><path d="M20 9v6"/><path d="M7 6.5v11"/><path d="M17 6.5v11"/><path d="M7 12h10"/>'),
    megafone:  env('<path d="M4 10v4a1 1 0 0 0 1 1h3l7 4V5L8 9H5a1 1 0 0 0-1 1z"/><path d="M18 9.5a4 4 0 0 1 0 5"/>'),
    copo:      env('<path d="M6 4h12l-1.2 15a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8z"/><path d="M6.6 10h10.8"/>'),
    tijolo:    env('<path d="M3 8h18v8H3z"/><path d="M3 12h18"/><path d="M9 8v4"/><path d="M15 12v4"/>')
  };

  /* devolve o SVG cru, pra injetar com innerHTML */
  return { get(nome){ return I[nome] || I.estrela; }, todos:I };
})();
