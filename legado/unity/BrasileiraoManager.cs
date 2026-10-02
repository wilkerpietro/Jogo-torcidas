using UnityEngine;
using System; 
using System.Collections.Generic;
using System.Linq; 

// --- DADOS ---

// Stats exclusivas de cada competição
[System.Serializable]
public class StatsCompeticao
{
    public int pontos, vitorias, empates, derrotas, golsPro, golsContra, saldoGols;
    public int grupoD = 0; // Para Série D e Copa
    
    public void Resetar() 
    { 
        pontos = 0; vitorias = 0; empates = 0; derrotas = 0; 
        golsPro = 0; golsContra = 0; saldoGols = 0; grupoD = 0;
    }
}

[System.Serializable]
public class TimeSerieA
{ 
    public string nome;
    public int forca; 
    public int grupoD = 0; // DEPRECATED: Mantido para compatibilidade
    public Color[] cores;
    
    // DEPRECATED: Mantidos para não quebrar código antigo
    public int pontos, vitorias, empates, derrotas, golsPro, golsContra, saldoGols;
    
    // NOVO: Stats separadas por competição
    public Dictionary<string, StatsCompeticao> statsCompeticoes = new Dictionary<string, StatsCompeticao>();
    
    public TimeSerieA(string n, int f, params Color[] c) 
    { 
        nome = n; forca = f; cores = c;
        if(cores == null || cores.Length == 0) cores = new Color[] { Color.gray };
    }
    
    // Pega ou cria stats de uma competição específica
    public StatsCompeticao GetStats(string nomeCompeticao)
    {
        if(!statsCompeticoes.ContainsKey(nomeCompeticao))
            statsCompeticoes[nomeCompeticao] = new StatsCompeticao();
        return statsCompeticoes[nomeCompeticao];
    }
    
    // Reseta stats de uma competição específica
    public void ResetarStats(string nomeCompeticao)
    {
        if(statsCompeticoes.ContainsKey(nomeCompeticao))
            statsCompeticoes[nomeCompeticao].Resetar();
        else
            statsCompeticoes[nomeCompeticao] = new StatsCompeticao();
    }

    // DEPRECATED: Mantido para compatibilidade
    public void ResetarStats() 
    { 
        pontos = 0; vitorias = 0; empates = 0; derrotas = 0; 
        golsPro = 0; golsContra = 0; saldoGols = 0; 
    }
}

[System.Serializable]
public class PartidaSerieA
{
    public int rodada; 
    public DateTime data;
    public TimeSerieA mandante;
    public TimeSerieA visitante;
    public int golsMandante;
    public int golsVisitante;
    public bool foiJogada = false;
    public string faseCopa = ""; 
    
    // Pênaltis (se houver)
    public bool foiParaPenaltis = false;
    public int penaltisMandante = 0;
    public int penaltisVisitante = 0;

    public PartidaSerieA(int r, DateTime d, TimeSerieA casa, TimeSerieA fora)
    {
        rodada = r; data = d; mandante = casa; visitante = fora;
    }
}

[System.Serializable]
public class HistoricoDados
{
    public string ano; public string campeao; public string vice;
    public HistoricoDados(string a, string c, string v) { ano = a; campeao = c; vice = v; }
}

// --- GERENTE ---
public class BrasileiraoManager : MonoBehaviour
{
    [Header("Configurações Globais")]
    public int anoAtual = 2026; 
    public int rodadaAtual = 1;
    public const int TOTAL_RODADAS = 42; // Série A/B/C vão até 38, Copa até 30, Série D até 41
    public bool temporadaFinalizada = false; 

    public BrasileiraoUI uiManager;

    [Header("Ligas")]
    public List<TimeSerieA> timesA = new List<TimeSerieA>(); public List<PartidaSerieA> partidasA = new List<PartidaSerieA>();
    public List<TimeSerieA> timesB = new List<TimeSerieA>(); public List<PartidaSerieA> partidasB = new List<PartidaSerieA>();
    public List<TimeSerieA> timesC = new List<TimeSerieA>(); public List<PartidaSerieA> partidasC = new List<PartidaSerieA>();
    public List<TimeSerieA> timesD = new List<TimeSerieA>(); public List<PartidaSerieA> partidasD = new List<PartidaSerieA>();
    public bool faseFinalD_Iniciada = false;

    [Header("Copa do Brasil")]
    public List<PartidaSerieA> partidasCopa = new List<PartidaSerieA>();
    public List<TimeSerieA> timesCopaVivos = new List<TimeSerieA>(); 
    private List<TimeSerieA> timesCopaEntramFase2 = new List<TimeSerieA>(); 
    public string faseAtualCopa = "Não Iniciada"; 

    [Header("Históricos")]
    public List<HistoricoDados> galeriaCampeoesA = new List<HistoricoDados>();
    public List<HistoricoDados> galeriaCampeoesB = new List<HistoricoDados>();
    public List<HistoricoDados> galeriaCampeoesC = new List<HistoricoDados>();
    public List<HistoricoDados> galeriaCampeoesD = new List<HistoricoDados>();
    public List<HistoricoDados> galeriaCampeoesCopa = new List<HistoricoDados>(); 

    Color white = Color.white; Color green = Color.green; Color red = Color.red; Color blue = Color.blue; Color yellow = Color.yellow; Color black = new Color(0.1f, 0.1f, 0.1f);

    void Start()
    {
        CriarTimesA(); CriarTimesB(); CriarTimesC(); CriarTimesD();
        CarregarHistoricoInicial(); 
        IniciarTemporada();
    }

    void IniciarTemporada()
    {
        temporadaFinalizada = false; faseFinalD_Iniciada = false; rodadaAtual = 1;
        partidasA.Clear(); partidasB.Clear(); partidasC.Clear(); partidasD.Clear(); partidasCopa.Clear();

        // Resetar stats específicas de cada competição
        foreach(var t in timesA) t.ResetarStats("BrasileiraoA");
        foreach(var t in timesB) t.ResetarStats("BrasileiraoB");
        foreach(var t in timesC) t.ResetarStats("BrasileiraoC");
        foreach(var t in timesD) t.ResetarStats("BrasileiraoD");
        
        // Resetar stats da Copa para todos que podem jogar
        foreach(var t in timesA) t.ResetarStats("Copa");
        foreach(var t in timesB) t.ResetarStats("Copa");
        foreach(var t in timesC) t.ResetarStats("Copa");
        foreach(var t in timesD) t.ResetarStats("Copa");
        
        // Distribuir grupos da Série D
        DistribuirGruposSerieD();

        GerarCalendarioPadrao(timesA, partidasA, 1); 
        GerarCalendarioPadrao(timesB, partidasB, 2); 
        GerarCalendarioPadrao(timesC, partidasC, 3); 
        GerarCalendarioD_FaseGrupos();
        
        ConfigurarCopaDoBrasil(); 

        if (uiManager != null) uiManager.AtualizarInterface(rodadaAtual);
    }

    // --- COPA DO BRASIL ---
    void ConfigurarCopaDoBrasil()
    {
        timesCopaVivos.Clear(); 
        timesCopaEntramFase2.Clear(); 
        partidasCopa.Clear();
        faseAtualCopa = "Primeira Fase";

        // ── PRIMEIRA FASE: 88 times (todos exceto os 20 da Série A) ──
        // Total: 20 B + 20 C + 48 D = 88 times
        timesCopaVivos.AddRange(timesB);  // 20 da B
        timesCopaVivos.AddRange(timesC);  // 20 da C
        timesCopaVivos.AddRange(timesD);  // 48 da D
        // Total: 88 times
        
        // Os 20 da Série A entram direto na 2ª fase
        timesCopaEntramFase2.AddRange(timesA); // 20 times
        
        Debug.Log($"[Copa] Primeira Fase: {timesCopaVivos.Count} times | Entram na 2ª: {timesCopaEntramFase2.Count}");
        
        GerarFaseCopa(timesCopaVivos, 3, "Primeira Fase", false);
    }

    void GerarFaseCopa(List<TimeSerieA> times, int rodadaAgendada, string nomeFase, bool idaEVolta)
    {
        // Sorteia confrontos
        List<TimeSerieA> pote = new List<TimeSerieA>(times);
        for (int i = 0; i < pote.Count; i++) {
            TimeSerieA temp = pote[i];
            int r = UnityEngine.Random.Range(i, pote.Count);
            pote[i] = pote[r];
            pote[r] = temp;
        }

        DateTime db = new DateTime(anoAtual, 1, 1);
        while (db.DayOfWeek != DayOfWeek.Sunday) db = db.AddDays(1);
        DateTime dIda = db.AddDays((rodadaAgendada - 1) * 7).AddDays(3).AddHours(21).AddMinutes(30);
        DateTime dVolta = dIda.AddDays(7);

        int qtdConfrontos = pote.Count / 2;
        for (int i = 0; i < qtdConfrontos; i++)
        {
            TimeSerieA time1 = pote[i];
            TimeSerieA time2 = pote[pote.Count - 1 - i];
            
            // Mando do time de MENOR força (jogo único ou ida)
            TimeSerieA mandante = time1.forca < time2.forca ? time1 : time2;
            TimeSerieA visitante = time1.forca < time2.forca ? time2 : time1;
            
            PartidaSerieA pIda = new PartidaSerieA(rodadaAgendada, dIda, mandante, visitante);
            pIda.faseCopa = nomeFase;
            partidasCopa.Add(pIda);
            
            if (idaEVolta) {
                // Na volta, inverte
                PartidaSerieA pVolta = new PartidaSerieA(rodadaAgendada + 1, dVolta, visitante, mandante);
                pVolta.faseCopa = nomeFase + " (Volta)";
                partidasCopa.Add(pVolta);
            }
        }
        
        partidasCopa.Sort((p1, p2) => p1.data.CompareTo(p2.data));
    }

    void VerificarProgressoCopa()
    {
        int r = rodadaAtual;
        
        // Primeira Fase (rodada 3) → 44 classificados + 20 da Série A = 64 times
        if (r == 3) {
            AvancarFaseCopa("Primeira Fase", false);
            timesCopaVivos.AddRange(timesCopaEntramFase2); // Adiciona os 20 da A
            faseAtualCopa = "Segunda Fase";
            Debug.Log($"[Copa] Segunda Fase: {timesCopaVivos.Count} times (deve ser 64)");
            GerarFaseCopa(timesCopaVivos, 7, faseAtualCopa, false);
        }
        // Segunda Fase (rodada 7) → 32 classificados
        else if (r == 7) {
            AvancarFaseCopa("Segunda Fase", false);
            faseAtualCopa = "Terceira Fase";
            Debug.Log($"[Copa] Terceira Fase: {timesCopaVivos.Count} times (deve ser 32)");
            GerarFaseCopa(timesCopaVivos, 11, faseAtualCopa, false);
        }
        // Terceira Fase (rodada 11) → 16 classificados
        else if (r == 11) {
            AvancarFaseCopa("Terceira Fase", false);
            faseAtualCopa = "Oitavas de Final";
            Debug.Log($"[Copa] Oitavas: {timesCopaVivos.Count} times (deve ser 16)");
            GerarFaseCopa(timesCopaVivos, 15, faseAtualCopa, true);
        }
        // Oitavas (rodada 16 - volta) → 8 classificados
        else if (r == 16) {
            AvancarFaseCopa("Oitavas de Final", true);
            faseAtualCopa = "Quartas de Final";
            Debug.Log($"[Copa] Quartas: {timesCopaVivos.Count} times (deve ser 8)");
            GerarFaseCopa(timesCopaVivos, 20, faseAtualCopa, true);
        }
        // Quartas (rodada 21 - volta) → 4 classificados
        else if (r == 21) {
            AvancarFaseCopa("Quartas de Final", true);
            faseAtualCopa = "Semifinal";
            Debug.Log($"[Copa] Semifinal: {timesCopaVivos.Count} times (deve ser 4)");
            GerarFaseCopa(timesCopaVivos, 25, faseAtualCopa, true);
        }
        // Semifinal (rodada 26 - volta) → 2 classificados
        else if (r == 26) {
            AvancarFaseCopa("Semifinal", true);
            faseAtualCopa = "Final";
            Debug.Log($"[Copa] Final: {timesCopaVivos.Count} times (deve ser 2)");
            GerarFaseCopa(timesCopaVivos, 30, faseAtualCopa, false);
        }
        // Final (rodada 30)
        else if (r == 30) {
            // Busca o jogo da final
            var jogoFinal = partidasCopa.FirstOrDefault(p => p.faseCopa == "Final");
            
            if(jogoFinal != null && jogoFinal.foiJogada)
            {
                string campeao;
                string vice;
                TimeSerieA timeCampeao;
                
                // Determina campeão e vice pelo PLACAR do jogo
                if(jogoFinal.golsMandante > jogoFinal.golsVisitante)
                {
                    // Mandante venceu
                    campeao = jogoFinal.mandante.nome;
                    vice = jogoFinal.visitante.nome;
                    timeCampeao = jogoFinal.mandante;
                }
                else if(jogoFinal.golsVisitante > jogoFinal.golsMandante)
                {
                    // Visitante venceu
                    campeao = jogoFinal.visitante.nome;
                    vice = jogoFinal.mandante.nome;
                    timeCampeao = jogoFinal.visitante;
                }
                else
                {
                    // Empate - disputa pênaltis e salva no jogo
                    DisputarPenaltis(jogoFinal);
                    
                    // Vencedor é quem fez mais pênaltis
                    if(jogoFinal.penaltisMandante > jogoFinal.penaltisVisitante) {
                        campeao = jogoFinal.mandante.nome;
                        vice = jogoFinal.visitante.nome;
                        timeCampeao = jogoFinal.mandante;
                    } else {
                        campeao = jogoFinal.visitante.nome;
                        vice = jogoFinal.mandante.nome;
                        timeCampeao = jogoFinal.visitante;
                    }
                }
                
                Debug.Log($"[Copa Final] {jogoFinal.mandante.nome} {jogoFinal.golsMandante} x {jogoFinal.golsVisitante} {jogoFinal.visitante.nome}");
                if(jogoFinal.foiParaPenaltis) {
                    Debug.Log($"[Copa Final] Pênaltis: {jogoFinal.mandante.nome} {jogoFinal.penaltisMandante} x {jogoFinal.penaltisVisitante} {jogoFinal.visitante.nome}");
                }
                Debug.Log($"[Copa Final] ✅ Campeão: {campeao} | Vice: {vice}");
                
                // Limpa timesCopaVivos e adiciona APENAS o campeão
                timesCopaVivos.Clear();
                timesCopaVivos.Add(timeCampeao);
                
                galeriaCampeoesCopa.Add(new HistoricoDados(anoAtual.ToString(), campeao, vice));
                faseAtualCopa = $"Campeão: {campeao}";
            }
            else
            {
                Debug.LogWarning("[Copa] Jogo da final não encontrado ou não foi jogado ainda.");
            }
        }
    }

    void AvancarFaseCopa(string nomeFaseAnterior, bool idaEVolta)
    {
        List<TimeSerieA> novosVivos = new List<TimeSerieA>();
        var jogosFase = partidasCopa.Where(p => p.faseCopa.Contains(nomeFaseAnterior)).ToList();
        
        if (idaEVolta)
        {
            // Ida e volta: soma dos gols decide
            Dictionary<string, TimeSerieA[]> confrontos = new Dictionary<string, TimeSerieA[]>();
            Dictionary<string, int[]> placar = new Dictionary<string, int[]>(); // [golsTime1, golsTime2]
            
            foreach(var jogo in jogosFase)
            {
                string chave = GerarChaveConfronto(jogo.mandante, jogo.visitante);
                
                if(!confrontos.ContainsKey(chave)) {
                    confrontos[chave] = new TimeSerieA[] { jogo.mandante, jogo.visitante };
                    placar[chave] = new int[] { 0, 0 };
                }
                
                // Soma gols
                bool mandanteEhTime1 = confrontos[chave][0] == jogo.mandante;
                if(mandanteEhTime1) {
                    placar[chave][0] += jogo.golsMandante;
                    placar[chave][1] += jogo.golsVisitante;
                } else {
                    placar[chave][1] += jogo.golsMandante;
                    placar[chave][0] += jogo.golsVisitante;
                }
            }
            
            // Define vencedores
            foreach(var chave in confrontos.Keys)
            {
                TimeSerieA time1 = confrontos[chave][0];
                TimeSerieA time2 = confrontos[chave][1];
                int gols1 = placar[chave][0];
                int gols2 = placar[chave][1];
                
                TimeSerieA vencedor;
                if (gols1 > gols2) vencedor = time1;
                else if (gols2 > gols1) vencedor = time2;
                else vencedor = DisputarPenaltis(time1, time2); // Empate → pênaltis
                
                novosVivos.Add(vencedor);
            }
        }
        else
        {
            // Jogo único
            foreach(var jogo in jogosFase)
            {
                TimeSerieA vencedor;
                if (jogo.golsMandante > jogo.golsVisitante) vencedor = jogo.mandante;
                else if (jogo.golsVisitante > jogo.golsMandante) vencedor = jogo.visitante;
                else vencedor = DisputarPenaltis(jogo.mandante, jogo.visitante); // Empate → pênaltis
                
                Debug.Log($"[AvancarFaseCopa] {nomeFaseAnterior}: {jogo.mandante.nome} {jogo.golsMandante} x {jogo.golsVisitante} {jogo.visitante.nome} → Vencedor: {vencedor.nome}");
                
                novosVivos.Add(vencedor);
            }
        }
        
        timesCopaVivos = novosVivos;
        
        Debug.Log($"[AvancarFaseCopa] Após {nomeFaseAnterior}: {timesCopaVivos.Count} times classificados");
    }
    
    string GerarChaveConfronto(TimeSerieA t1, TimeSerieA t2)
    {
        // Gera chave única para o confronto (ordem alfabética)
        if(string.Compare(t1.nome, t2.nome) < 0)
            return t1.nome + "_vs_" + t2.nome;
        else
            return t2.nome + "_vs_" + t1.nome;
    }
    
    TimeSerieA DisputarPenaltis(TimeSerieA time1, TimeSerieA time2)
    {
        // Probabilidade baseada na força
        int total = time1.forca + time2.forca;
        int sorteio = UnityEngine.Random.Range(0, total);
        
        TimeSerieA vencedor = sorteio < time1.forca ? time1 : time2;
        
        // Gera placar de pênaltis aleatório (8 opções)
        int[][] placares = new int[][] {
            new int[] {3, 2}, new int[] {4, 3}, new int[] {5, 4},
            new int[] {4, 2}, new int[] {5, 3}, new int[] {6, 5},
            new int[] {5, 2}, new int[] {6, 4}
        };
        int[] placar = placares[UnityEngine.Random.Range(0, placares.Length)];
        
        string nomeVencedor = vencedor.nome;
        string nomePerdedor = vencedor == time1 ? time2.nome : time1.nome;
        
        Debug.Log($"[Pênaltis] {nomeVencedor} {placar[0]} x {placar[1]} {nomePerdedor}");
        
        return vencedor;
    }
    
    // Versão que salva os pênaltis no jogo
    void DisputarPenaltis(PartidaSerieA jogo)
    {
        TimeSerieA time1 = jogo.mandante;
        TimeSerieA time2 = jogo.visitante;
        
        // Probabilidade baseada na força
        int total = time1.forca + time2.forca;
        int sorteio = UnityEngine.Random.Range(0, total);
        
        TimeSerieA vencedor = sorteio < time1.forca ? time1 : time2;
        
        // Gera placar de pênaltis aleatório (8 opções)
        int[][] placares = new int[][] {
            new int[] {3, 2}, new int[] {4, 3}, new int[] {5, 4},
            new int[] {4, 2}, new int[] {5, 3}, new int[] {6, 5},
            new int[] {5, 2}, new int[] {6, 4}
        };
        int[] placar = placares[UnityEngine.Random.Range(0, placares.Length)];
        
        // Marca que foi para pênaltis e salva o placar
        jogo.foiParaPenaltis = true;
        
        if(vencedor == time1) {
            jogo.penaltisMandante = placar[0];
            jogo.penaltisVisitante = placar[1];
        } else {
            jogo.penaltisMandante = placar[1];
            jogo.penaltisVisitante = placar[0];
        }
        
        Debug.Log($"[Pênaltis] {jogo.mandante.nome} {jogo.penaltisMandante} x {jogo.penaltisVisitante} {jogo.visitante.nome}");
    }

    // --- SIMULAÇÃO ---
    public void SimularRodadaOuIniciarAno()
    {
        if (temporadaFinalizada) { ProcessarViradaDeAno(); return; }
        if (rodadaAtual > TOTAL_RODADAS) return; 

        SimularLista(partidasA, 2, 1, "BrasileiraoA"); // Série A
        SimularLista(partidasB, 2, 1, "BrasileiraoB"); // Série B
        SimularLista(partidasC, 1, 1, "BrasileiraoC"); // Série C

        List<PartidaSerieA> jogosD = partidasD.Where(p => p.rodada == rodadaAtual).ToList();
        foreach (var jogo in jogosD) SimularPlacarGenerico(jogo, 1, 1, "BrasileiraoD"); // Série D

        List<PartidaSerieA> jogosCopa = partidasCopa.Where(p => p.rodada == rodadaAtual).ToList();
        foreach (var jogo in jogosCopa) SimularPlacarGenerico(jogo, 2, 1, "Copa"); // Copa do Brasil
        VerificarProgressoCopa();
        
        // ── GERA FASE FINAL DA SÉRIE D APÓS SIMULAR RODADA 30 ──
        if (!faseFinalD_Iniciada && rodadaAtual == 30) {
            GerarCalendarioD_FaseFinal();
            Debug.Log("[Série D] Rodada 30 simulada. Fase final gerada! Jogos começam na rodada 31.");
        }

        rodadaAtual++;
        if (rodadaAtual > TOTAL_RODADAS) { temporadaFinalizada = true; Debug.Log($"FIM DA TEMPORADA {anoAtual}!"); }
        if (uiManager != null) uiManager.AtualizarInterface(rodadaAtual - 1); 
    }

    void SimularLista(List<PartidaSerieA> todas, int zebra, int casa, string nomeCompeticao) {
        var jogos = todas.Where(p => p.rodada == rodadaAtual).ToList();
        foreach (var j in jogos) SimularPlacarGenerico(j, zebra, casa, nomeCompeticao);
    }

    void SimularPlacarGenerico(PartidaSerieA jogo, int fatorZebra, int fatorCasa, string nomeCompeticao = "BrasileiraoA") 
    {
        // NOTA: fatorCasa e fatorZebra NÃO são mais usados. 
        // A lógica agora determina bônus baseado na divisão.
        // nomeCompeticao identifica qual competição está sendo jogada (ex: "BrasileiraoA", "Copa")
        
        // ── PASSO 1: DETERMINAR BÔNUS DE MANDO BASEADO NA DIVISÃO ─────
        bool ehSerieA = timesA.Contains(jogo.mandante) && timesA.Contains(jogo.visitante);
        
        int bonusMandante = ehSerieA ? 3 : 1;
        int penalidadeVisitante = ehSerieA ? 2 : 1;
        
        int forcaCasa = jogo.mandante.forca + bonusMandante;
        int forcaFora = jogo.visitante.forca - penalidadeVisitante;
        
        // ── PASSO 2: BÔNUS/PENALIDADE POR DIFERENÇA DE FORÇA ──────────
        int diff = Mathf.Abs(forcaCasa - forcaFora);
        bool casaEhFavorito = forcaCasa >= forcaFora;
        
        int bonus = 0;
        int penalidade = 0;
        
        if      (diff >= 1  && diff <= 5)  { bonus = 1;  penalidade = 0;  }
        else if (diff >= 6  && diff <= 10) { bonus = 3;  penalidade = 0;  }
        else if (diff >= 11 && diff <= 15) { bonus = 4;  penalidade = 4;  }
        else if (diff >= 16 && diff <= 20) { bonus = 6;  penalidade = 6;  }
        else if (diff >= 21)               { bonus = 10; penalidade = 10; }
        
        if (casaEhFavorito) { forcaCasa += bonus; forcaFora -= penalidade; }
        else                { forcaFora += bonus; forcaCasa -= penalidade; }
        
        // ── PASSO 3: LIMITAR ENTRE 1 E 100 ────────────────────────────
        forcaCasa = Mathf.Clamp(forcaCasa, 1, 100);
        forcaFora = Mathf.Clamp(forcaFora, 1, 100);
        
        // ── PASSO 4: CHANCE DE EMPATE ──────────────────────────────────
        int chanceEmpate = Mathf.Max(1, Mathf.RoundToInt(jogo.mandante.forca * 0.3f + jogo.visitante.forca * 0.3f));
        
        // ── PASSO 5: SORTEIO DO RESULTADO ─────────────────────────────
        int total = forcaCasa + forcaFora + chanceEmpate;
        int sorteio = UnityEngine.Random.Range(0, total);
        
        string resultado;
        if      (sorteio < forcaCasa)             resultado = "casa";
        else if (sorteio < forcaCasa + forcaFora) resultado = "fora";
        else                                       resultado = "empate";
        
        // ── PASSO 6: GERAR PLACAR E ATUALIZAR STATS DA COMPETIÇÃO ─────
        // Pega as stats específicas desta competição
        StatsCompeticao statsCasa = jogo.mandante.GetStats(nomeCompeticao);
        StatsCompeticao statsFora = jogo.visitante.GetStats(nomeCompeticao);
        
        if (resultado == "empate")
        {
            int g = GerarPlacarEmpate();
            jogo.golsMandante = g;
            jogo.golsVisitante = g;
            statsCasa.pontos++; statsCasa.empates++;
            statsFora.pontos++; statsFora.empates++;
        }
        else
        {
            int[] placar = GerarPlacarVitoria();
            if (resultado == "casa")
            {
                jogo.golsMandante = placar[0];
                jogo.golsVisitante = placar[1];
                statsCasa.pontos += 3; statsCasa.vitorias++;
                statsFora.derrotas++;
            }
            else
            {
                jogo.golsMandante = placar[1];
                jogo.golsVisitante = placar[0];
                statsFora.pontos += 3; statsFora.vitorias++;
                statsCasa.derrotas++;
            }
        }
        
        // Atualiza gols
        statsCasa.golsPro += jogo.golsMandante;
        statsCasa.golsContra += jogo.golsVisitante;
        statsCasa.saldoGols = statsCasa.golsPro - statsCasa.golsContra;
        
        statsFora.golsPro += jogo.golsVisitante;
        statsFora.golsContra += jogo.golsMandante;
        statsFora.saldoGols = statsFora.golsPro - statsFora.golsContra;
        
        jogo.foiJogada = true;
    }

    int[] GerarPlacarVitoria() {
        float s = UnityEngine.Random.value * 100;
        if (s < 30) return new int[] { 1, 0 }; else if (s < 45) return new int[] { 2, 0 }; else if (s < 60) return new int[] { 2, 1 }; 
        else if (s < 70) return new int[] { 3, 2 }; else if (s < 80) return new int[] { 3, 0 }; else if (s < 90) return new int[] { 3, 1 };  
        else if (s < 95) return new int[] { 4, 0 }; else if (s < 98) return new int[] { 4, 1 }; else return new int[] { 5, 1 };              
    }
    int GerarPlacarEmpate() { float s = UnityEngine.Random.value * 100; if (s < 40) return 0; else if (s < 80) return 1; else if (s < 95) return 2; else return 3; }

    // --- VIRADA DE ANO ---
    void ProcessarViradaDeAno()
    {
        // Ordena usando as stats de cada competição
        timesA = Ordenar(timesA, "BrasileiraoA"); 
        timesB = Ordenar(timesB, "BrasileiraoB"); 
        timesC = Ordenar(timesC, "BrasileiraoC"); 
        
        // SÉRIE D: Ordena APENAS os times da fase final (12 classificados)
        // Os outros 36 foram eliminados na fase de grupos
        List<TimeSerieA> timesD_FaseFinal = new List<TimeSerieA>();
        
        if(faseFinalD_Iniciada)
        {
            // Pega apenas os times que jogaram a fase final (rodadas 31-41)
            var jogosFaseFinal = partidasD.Where(p => p.rodada >= 31).ToList();
            HashSet<TimeSerieA> timesClassificados = new HashSet<TimeSerieA>();
            
            foreach(var jogo in jogosFaseFinal)
            {
                timesClassificados.Add(jogo.mandante);
                timesClassificados.Add(jogo.visitante);
            }
            
            timesD_FaseFinal = timesClassificados.ToList();
            timesD_FaseFinal = Ordenar(timesD_FaseFinal, "BrasileiraoD");
            
            Debug.Log($"[Série D] Fase final: {timesD_FaseFinal.Count} times | Classificados para C: {string.Join(", ", timesD_FaseFinal.Take(4).Select(t => t.nome))}");
        }
        else
        {
            // Se não teve fase final (erro), ordena todos
            timesD = Ordenar(timesD, "BrasileiraoD");
            timesD_FaseFinal = timesD;
        }
        
        if(timesA.Count>0) galeriaCampeoesA.Add(new HistoricoDados(anoAtual.ToString(), timesA[0].nome, timesA[1].nome));
        if(timesB.Count>0) galeriaCampeoesB.Add(new HistoricoDados(anoAtual.ToString(), timesB[0].nome, timesB[1].nome));
        if(timesC.Count>0) galeriaCampeoesC.Add(new HistoricoDados(anoAtual.ToString(), timesC[0].nome, timesC[1].nome));
        if(timesD_FaseFinal.Count>0) galeriaCampeoesD.Add(new HistoricoDados(anoAtual.ToString(), timesD_FaseFinal[0].nome, timesD_FaseFinal[1].nome));
        if(galeriaCampeoesCopa.Count == 0 && timesCopaVivos.Count > 0) galeriaCampeoesCopa.Add(new HistoricoDados(anoAtual.ToString(), timesCopaVivos[0].nome, "Finalista"));

        AplicarEvolucaoSerieA(timesA); AplicarEvolucaoSerieB(timesB); AplicarEvolucaoSerieC(timesC); AplicarEvolucaoSerieD(timesD);

        var caemDaA = timesA.GetRange(timesA.Count - 4, 4); var sobemDaB = timesB.GetRange(0, 4);
        var caemDaB = timesB.GetRange(timesB.Count - 4, 4); var sobemDaC = timesC.GetRange(0, 4);
        var caemDaC = timesC.GetRange(timesC.Count - 4, 4); 
        
        // Pega os 4 melhores da FASE FINAL, não de todos os 48
        var sobemDaD = timesD_FaseFinal.GetRange(0, Math.Min(4, timesD_FaseFinal.Count));

        foreach (var t in caemDaA) timesA.Remove(t); foreach (var t in sobemDaB) timesB.Remove(t);
        foreach (var t in caemDaB) timesB.Remove(t); foreach (var t in sobemDaC) timesC.Remove(t);
        foreach (var t in caemDaC) timesC.Remove(t); foreach (var t in sobemDaD) timesD.Remove(t);

        timesB.AddRange(caemDaA); timesA.AddRange(sobemDaB);
        timesC.AddRange(caemDaB); timesB.AddRange(sobemDaC);
        timesD.AddRange(caemDaC); timesC.AddRange(sobemDaD);

        foreach(var t in timesA) t.GetStats("BrasileiraoA").grupoD = 0;
        foreach(var t in timesB) t.GetStats("BrasileiraoB").grupoD = 0;
        foreach(var t in timesC) t.GetStats("BrasileiraoC").grupoD = 0;
        foreach(var t in timesD) t.GetStats("BrasileiraoD").grupoD = 0;
        
        DistribuirGruposSerieD();

        timesCopaVivos.Clear(); partidasCopa.Clear();
        anoAtual++; IniciarTemporada();
    }

    void DistribuirGruposSerieD()
    {
        List<TimeSerieA> temp = new List<TimeSerieA>(timesD);
        // Embaralha
        for (int i = 0; i < temp.Count; i++) { 
            TimeSerieA t = temp[i]; 
            int r = UnityEngine.Random.Range(i, temp.Count); 
            temp[i] = temp[r]; 
            temp[r] = t; 
        }
        
        // Distribui em 3 chaves de 16 (48 times)
        int g1 = 0, g2 = 0, g3 = 0;
        for(int i = 0; i < temp.Count; i++) 
        { 
            int grupo = i < 16 ? 1 : i < 32 ? 2 : 3;
            temp[i].GetStats("BrasileiraoD").grupoD = grupo;
            
            if(grupo == 1) g1++;
            else if(grupo == 2) g2++;
            else g3++;
        }
        
        Debug.Log($"[Série D] 48 times distribuídos: Chave 1={g1}, Chave 2={g2}, Chave 3={g3}");
    }

    List<TimeSerieA> Ordenar(List<TimeSerieA> l, string nomeCompeticao) 
    { 
        return l.OrderByDescending(t => t.GetStats(nomeCompeticao).pontos)
                .ThenByDescending(t => t.GetStats(nomeCompeticao).vitorias)
                .ThenByDescending(t => t.GetStats(nomeCompeticao).saldoGols)
                .ToList(); 
    }
    void AplicarEvolucaoSerieA(List<TimeSerieA> l) { for(int i=0;i<l.Count;i++) { int p=i+1; l[i].forca += p<=4?5+UnityEngine.Random.Range(-5,6):p<=16?2+UnityEngine.Random.Range(-5,6):UnityEngine.Random.Range(-6,4); l[i].forca=Mathf.Clamp(l[i].forca,15,100); } }
    void AplicarEvolucaoSerieB(List<TimeSerieA> l) { for(int i=0;i<l.Count;i++) { int p=i+1; l[i].forca += p<=4?3+UnityEngine.Random.Range(-2,6):UnityEngine.Random.Range(-4,3); l[i].forca=Mathf.Clamp(l[i].forca,10,90); } }
    void AplicarEvolucaoSerieC(List<TimeSerieA> l) { for(int i=0;i<l.Count;i++) { int p=i+1; l[i].forca += p<=4?2+UnityEngine.Random.Range(-1,5):p<=10?UnityEngine.Random.Range(-1,3):p<=16?UnityEngine.Random.Range(-2,3):UnityEngine.Random.Range(-2,2); l[i].forca=Mathf.Clamp(l[i].forca,8,80); } }
    void AplicarEvolucaoSerieD(List<TimeSerieA> l) { for(int i=0;i<l.Count;i++) { int p=i+1; l[i].forca += p<=4?2+UnityEngine.Random.Range(-1,3):p<=12?UnityEngine.Random.Range(-1,3):UnityEngine.Random.Range(-1,2); l[i].forca=Mathf.Clamp(l[i].forca,5,70); } }

    DateTime DefinirHorario(DateTime d, int i, int t) {
        if(t==1) return i<2?d.AddDays(-1).AddHours(16):i<3?d.AddDays(-1).AddHours(21):i<7?d.AddHours(16):i<9?d.AddHours(18).AddMinutes(30):d.AddDays(1).AddHours(20);
        if(t==2) return i<2?d.AddDays(-2).AddHours(19).AddMinutes(30):i<6?d.AddDays(-1).AddHours(16).AddMinutes(30):i<8?d.AddDays(-1).AddHours(20):d.AddHours(16).AddMinutes(30);
        if(t==3) return i<3?d.AddDays(-1).AddHours(17):i<5?d.AddDays(-1).AddHours(19):i<8?d.AddHours(16):i<9?d.AddHours(19):d.AddDays(1).AddHours(20);
        return i%2==0?d.AddDays(-1).AddHours(15):d.AddHours(15);
    }

    void GerarCalendarioPadrao(List<TimeSerieA> l, List<PartidaSerieA> p, int t) {
        int n = l.Count; // 20 times
        DateTime d = new DateTime(anoAtual, 1, 1); 
        while(d.DayOfWeek != DayOfWeek.Sunday) d = d.AddDays(1); 
        d = d.AddDays(14);
        
        List<TimeSerieA> tmp = new List<TimeSerieA>(l);
        int totalRodadas = n - 1; // 19 rodadas
        
        // ── TURNO (rodadas 1 a 19) ──
        int partidasAntes = p.Count;
        for(int r = 0; r < totalRodadas; r++) {
            DateTime dr = d.AddDays(r * 7);
            for(int j = 0; j < n/2; j++) {
                DateTime dj = DefinirHorario(dr, j, t);
                p.Add(new PartidaSerieA(r + 1, dj, tmp[j], tmp[n - 1 - j]));
            }
            // Rotação round-robin (mantém primeiro time fixo)
            TimeSerieA u = tmp[n - 1];
            tmp.RemoveAt(n - 1);
            tmp.Insert(1, u);
        }
        int partidasTurno = p.Count - partidasAntes;
        
        // ── RETURNO (rodadas 20 a 38) ──
        List<PartidaSerieA> jogosTurno = p.GetRange(partidasAntes, partidasTurno);
        for(int i = 0; i < jogosTurno.Count; i++) {
            PartidaSerieA jTurno = jogosTurno[i];
            DateTime dataRetorno = jTurno.data.AddDays(totalRodadas * 7);
            p.Add(new PartidaSerieA(jTurno.rodada + totalRodadas, dataRetorno, jTurno.visitante, jTurno.mandante));
        }
        
        int totalPartidas = p.Count - partidasAntes;
        Debug.Log($"[Divisão {t}] Times: {n} | Turno: {partidasTurno} partidas | Returno: {totalPartidas - partidasTurno} | Total: {totalPartidas} partidas em {totalRodadas * 2} rodadas");
        
        p.Sort((x, y) => x.data.CompareTo(y.data));
    }
    void GerarCalendarioD_FaseGrupos() {
        DateTime d = new DateTime(anoAtual, 1, 1);
        while(d.DayOfWeek != DayOfWeek.Sunday) d = d.AddDays(1);
        d = d.AddDays(14);
        
        Debug.Log($"[Série D] Gerando calendário: 3 chaves de 16 times (30 rodadas)");
        
        // ── GERA JOGOS PARA CADA CHAVE ──
        for(int chave = 1; chave <= 3; chave++) 
        {
            List<TimeSerieA> timesChave = timesD
                .Where(t => t.GetStats("BrasileiraoD").grupoD == chave)
                .ToList();
            
            if(timesChave.Count != 16) {
                Debug.LogError($"[Série D] Chave {chave} tem {timesChave.Count} times ao invés de 16!");
                continue;
            }
            
            // ── TURNO: 15 rodadas (com 16 times) ──
            List<TimeSerieA> tmp = new List<TimeSerieA>(timesChave);
            int n = tmp.Count; // 16
            int totalRodadasTurno = n - 1; // 15
            
            for(int r = 0; r < totalRodadasTurno; r++)
            {
                DateTime dataRodada = d.AddDays(r * 7);
                
                // Gera 8 jogos por rodada
                for(int j = 0; j < n / 2; j++)
                {
                    TimeSerieA t1 = tmp[j];
                    TimeSerieA t2 = tmp[n - 1 - j];
                    DateTime horario = DefinirHorario(dataRodada, j, 4);
                    partidasD.Add(new PartidaSerieA(r + 1, horario, t1, t2));
                }
                
                // Rotação round-robin (mantém primeiro fixo)
                TimeSerieA ultimo = tmp[n - 1];
                tmp.RemoveAt(n - 1);
                tmp.Insert(1, ultimo);
            }
        }
        
        // ── RETURNO: Inverte TODOS os jogos do turno ──
        int totalJogosTurno = partidasD.Count;
        List<PartidaSerieA> jogosTurno = new List<PartidaSerieA>(partidasD);
        
        foreach(var jogo in jogosTurno)
        {
            DateTime dataRetorno = jogo.data.AddDays(15 * 7); // 15 rodadas depois
            partidasD.Add(new PartidaSerieA(jogo.rodada + 15, dataRetorno, jogo.visitante, jogo.mandante));
        }
        
        Debug.Log($"[Série D] Fase de grupos: {totalJogosTurno} turno + {totalJogosTurno} returno = {partidasD.Count} jogos (30 rodadas)");
        Debug.Log($"[Série D] Cada time joga: {partidasD.Count / 48} jogos = 30 jogos");
        
        partidasD.Sort((x, y) => x.data.CompareTo(y.data));
    }
    
    void GerarCalendarioD_FaseFinal() {
        faseFinalD_Iniciada = true; 
        
        // Seleciona os 4 melhores de cada grupo (12 times)
        List<TimeSerieA> classificados = new List<TimeSerieA>(); 
        for(int g = 1; g <= 3; g++) 
        {
            var melhoresDoGrupo = timesD
                .Where(t => t.GetStats("BrasileiraoD").grupoD == g)
                .OrderByDescending(t => t.GetStats("BrasileiraoD").pontos)
                .ThenByDescending(t => t.GetStats("BrasileiraoD").saldoGols)
                .ThenByDescending(t => t.GetStats("BrasileiraoD").golsPro)
                .Take(4)
                .ToList();
            
            classificados.AddRange(melhoresDoGrupo);
        }
        
        Debug.Log($"[Série D] {classificados.Count} times classificados para a fase final");
        
        // Mostra quem classificou
        string nomes = string.Join(", ", classificados.Select(t => t.nome));
        Debug.Log($"[Série D] Classificados: {nomes}");
        
        // Reseta stats APENAS dos 12 classificados
        foreach(var t in classificados) 
        {
            t.ResetarStats("BrasileiraoD");
        }
        
        // Gera calendário round-robin com os 12 times (11 rodadas)
        DateTime d = new DateTime(anoAtual, 1, 1);
        while(d.DayOfWeek != DayOfWeek.Sunday) d = d.AddDays(1);
        d = d.AddDays(14 + (30 * 7)); // Começa após a rodada 30
        
        List<TimeSerieA> tmp = new List<TimeSerieA>(classificados);
        int n = tmp.Count; // 12
        
        for(int r = 0; r < n - 1; r++) // 11 rodadas (31 a 41)
        { 
            DateTime dr = d.AddDays(r * 7);
            
            for(int j = 0; j < n / 2; j++) 
            {
                DateTime horario = DefinirHorario(dr, j, 4);
                PartidaSerieA p = new PartidaSerieA(31 + r, horario, tmp[j], tmp[n - 1 - j]); // Rodadas 31-41
                partidasD.Add(p);
            }
            
            // Rotação
            TimeSerieA ultimo = tmp[n - 1];
            tmp.RemoveAt(n - 1);
            tmp.Insert(1, ultimo);
        }
        
        Debug.Log($"[Série D] Fase final: 11 rodadas geradas (rodadas 31-41)");
        
        partidasD.Sort((x, y) => x.data.CompareTo(y.data));
    }

    void CriarTimesA() { timesA.Clear(); timesA.Add(new TimeSerieA("Fluminense",36,red,white,green)); timesA.Add(new TimeSerieA("Palmeiras",50,green,white)); timesA.Add(new TimeSerieA("Flamengo",48,red,black)); timesA.Add(new TimeSerieA("São Paulo",38,red,white,black)); timesA.Add(new TimeSerieA("Corinthians",38,white,black)); timesA.Add(new TimeSerieA("Bahia",36,blue,white,red)); timesA.Add(new TimeSerieA("Botafogo",36,black,white)); timesA.Add(new TimeSerieA("Atlético-MG",36,black,white)); timesA.Add(new TimeSerieA("Cruzeiro",36,blue,white)); timesA.Add(new TimeSerieA("Grêmio",34,blue,black,white)); timesA.Add(new TimeSerieA("Santos",34,white,black)); timesA.Add(new TimeSerieA("Mirassol",32,yellow,green)); timesA.Add(new TimeSerieA("Bragantino",30,white,black)); timesA.Add(new TimeSerieA("Athletico",30,red,black)); timesA.Add(new TimeSerieA("Vasco",30,white,black)); timesA.Add(new TimeSerieA("Internacional",30,red,white)); timesA.Add(new TimeSerieA("Chapecoense",28,green,white)); timesA.Add(new TimeSerieA("Coritiba",28,green,white)); timesA.Add(new TimeSerieA("Vitória",28,red,black)); timesA.Add(new TimeSerieA("Remo",24,new Color(0,0,0.5f),white)); }
    void CriarTimesB() { timesB.Clear(); timesB.Add(new TimeSerieA("Fortaleza",24,red,blue,white)); timesB.Add(new TimeSerieA("Ceará",22,black,white)); timesB.Add(new TimeSerieA("Juventude",22,green,white)); timesB.Add(new TimeSerieA("Goiás",22,green,white)); timesB.Add(new TimeSerieA("Sport Recife",22,red,black)); timesB.Add(new TimeSerieA("Atlético/GO",20,red,black)); timesB.Add(new TimeSerieA("América/MG",20,green,black)); timesB.Add(new TimeSerieA("Cuiabá",20,green,yellow)); timesB.Add(new TimeSerieA("Novorizontino",20,black,yellow)); timesB.Add(new TimeSerieA("Criciúma",18,yellow,black,white)); timesB.Add(new TimeSerieA("Londrina",18,blue,white)); timesB.Add(new TimeSerieA("Avaí",16,blue,white)); timesB.Add(new TimeSerieA("CRB",16,red,white)); timesB.Add(new TimeSerieA("Náutico",16,red,white)); timesB.Add(new TimeSerieA("Vila Nova",16,red,white)); timesB.Add(new TimeSerieA("Ponte Preta",14,white,black)); timesB.Add(new TimeSerieA("Athletic",14,black,white)); timesB.Add(new TimeSerieA("Botafogo/SP",14,red,white,black)); timesB.Add(new TimeSerieA("Operário Ferroviário",14,black,white)); timesB.Add(new TimeSerieA("São Bernardo",14,yellow,black)); }
    void CriarTimesC() { timesC.Clear(); timesC.Add(new TimeSerieA("Botafogo/PB",12,black,white,red)); timesC.Add(new TimeSerieA("Guarani",12,green,white)); timesC.Add(new TimeSerieA("Portuguesa",12,red,green)); timesC.Add(new TimeSerieA("Santa Cruz",12,black,white,red)); timesC.Add(new TimeSerieA("Paysandu",12,blue,white)); timesC.Add(new TimeSerieA("ABC",10,black,white)); timesC.Add(new TimeSerieA("América/RN",10,red,white)); timesC.Add(new TimeSerieA("Figueirense",10,black,white)); timesC.Add(new TimeSerieA("Ferroviário",10,black,white,red)); timesC.Add(new TimeSerieA("Amazonas",10,yellow,black)); timesC.Add(new TimeSerieA("Brasil de Pelotas",10,red,black)); timesC.Add(new TimeSerieA("Confiança",8,blue,white)); timesC.Add(new TimeSerieA("Paraná",8,red,blue)); timesC.Add(new TimeSerieA("Treze",8,black,white)); timesC.Add(new TimeSerieA("Campinense",8,red,black)); timesC.Add(new TimeSerieA("Caxias",8,red,blue,white)); timesC.Add(new TimeSerieA("Inter de Limeira",8,black,white)); timesC.Add(new TimeSerieA("Sampaio Corrêa",8,red,yellow,green)); timesC.Add(new TimeSerieA("Gama",8,green,white)); timesC.Add(new TimeSerieA("Floresta",8,green,white)); }
    void CriarTimesD() { timesD.Clear(); AddD("Rio Negro",7,1,black,white); AddD("Sousa",7,1,green,white); AddD("Moto Club",7,1,red,black); AddD("ASA",7,1,black,white); AddD("Volta Redonda",7,1,yellow,black,white); AddD("CSA",7,1,blue,white); AddD("Icasa",6,1,green,white); AddD("Brasiliense",6,1,yellow,white); AddD("Mixto",6,1,black,white); AddD("Joinville",6,1,red,black,white); AddD("Nacional",6,1,blue,white); AddD("Manaus",6,1,green,white); AddD("Guarany de Sobral",6,1,red,black); AddD("Central",6,1,black,white); AddD("Pelotas",6,1,yellow,blue); AddD("Sergipe",6,2,red,white); AddD("São Caetano",6,2,blue,white); AddD("Santo André",6,2,blue,white); AddD("Bangu",6,2,red,white); AddD("Madureira",6,2,yellow,blue); AddD("Ypiranga/PE",4,2,blue,white); AddD("Baraúnas",4,2,red,white); AddD("Potiguar",4,2,red,white); AddD("Paulista de Jundiaí",4,2,red,black,white); AddD("America",4,2,red,white); AddD("Goytacaz",4,2,blue,white); AddD("Americano",4,2,black,white); AddD("XV de Piracicaba",4,2,black,white); AddD("Mamoré",4,2,green,white); AddD("URT",4,2,blue,white); AddD("Noroeste",4,3,red,white); AddD("Imperatriz",6,3,red,white); AddD("Ceilândia",6,3,black,white); AddD("Ypiranga/RS",6,3,yellow,green); AddD("São José",6,3,blue,white); AddD("Fluminense de Feira",4,3,red,green,white); AddD("Tuna Luso",4,3,green,white); AddD("União Rondonópolis",6,3,red,white); AddD("Maringá",7,3,black,white,green); AddD("Barra",7,3,blue,yellow); AddD("Itabaiana",6,3,red,white,blue); AddD("Salgueiro",6,3,red,green,white); AddD("Iguatu",6,3,blue,white); AddD("Águia de Marabá",6,3,blue,red); AddD("Anápolis",6,3,red,black,white); AddD("Ituano",7,1,red,black); AddD("Portuguesa Santista",6,2,red,green,white); AddD("Ríver",4,3,red,white); }
    void AddD(string n, int f, int g, params Color[] c) { var t = new TimeSerieA(n, f, c); t.grupoD = g; timesD.Add(t); }

    void CarregarHistoricoInicial() {
        galeriaCampeoesA.Clear();
        galeriaCampeoesA.Add(new HistoricoDados("1937", "Atlético-MG", "Fluminense"));
        galeriaCampeoesA.Add(new HistoricoDados("1959", "Bahia", "Santos"));
        galeriaCampeoesA.Add(new HistoricoDados("1960", "Palmeiras", "Fortaleza"));
        galeriaCampeoesA.Add(new HistoricoDados("1961", "Santos", "Bahia"));
        galeriaCampeoesA.Add(new HistoricoDados("1962", "Santos", "Botafogo"));
        galeriaCampeoesA.Add(new HistoricoDados("1963", "Santos", "Bahia"));
        galeriaCampeoesA.Add(new HistoricoDados("1964", "Santos", "Flamengo"));
        galeriaCampeoesA.Add(new HistoricoDados("1965", "Santos", "Vasco"));
        galeriaCampeoesA.Add(new HistoricoDados("1966", "Cruzeiro", "Santos"));
        galeriaCampeoesA.Add(new HistoricoDados("1967 (TB)", "Palmeiras", "Náutico"));
        galeriaCampeoesA.Add(new HistoricoDados("1967 (RGP)", "Palmeiras", "Internacional"));
        galeriaCampeoesA.Add(new HistoricoDados("1968 (TB)", "Botafogo", "Fortaleza"));
        galeriaCampeoesA.Add(new HistoricoDados("1968 (RGP)", "Santos", "Internacional"));
        galeriaCampeoesA.Add(new HistoricoDados("1969", "Palmeiras", "Cruzeiro"));
        galeriaCampeoesA.Add(new HistoricoDados("1970", "Fluminense", "Palmeiras"));
        galeriaCampeoesA.Add(new HistoricoDados("1971", "Atlético-MG", "São Paulo"));
        galeriaCampeoesA.Add(new HistoricoDados("1972", "Palmeiras", "Botafogo"));
        galeriaCampeoesA.Add(new HistoricoDados("1973", "Palmeiras", "São Paulo"));
        galeriaCampeoesA.Add(new HistoricoDados("1974", "Vasco", "Cruzeiro"));
        galeriaCampeoesA.Add(new HistoricoDados("1975", "Internacional", "Cruzeiro"));
        galeriaCampeoesA.Add(new HistoricoDados("1976", "Internacional", "Corinthians"));
        galeriaCampeoesA.Add(new HistoricoDados("1977", "São Paulo", "Atlético-MG"));
        galeriaCampeoesA.Add(new HistoricoDados("1978", "Guarani", "Palmeiras"));
        galeriaCampeoesA.Add(new HistoricoDados("1979", "Internacional", "Vasco"));
        galeriaCampeoesA.Add(new HistoricoDados("1980", "Flamengo", "Atlético-MG"));
        galeriaCampeoesA.Add(new HistoricoDados("1981", "Grêmio", "São Paulo"));
        galeriaCampeoesA.Add(new HistoricoDados("1982", "Flamengo", "Grêmio"));
        galeriaCampeoesA.Add(new HistoricoDados("1983", "Flamengo", "Santos"));
        galeriaCampeoesA.Add(new HistoricoDados("1984", "Fluminense", "Vasco"));
        galeriaCampeoesA.Add(new HistoricoDados("1985", "Coritiba", "Bangu"));
        galeriaCampeoesA.Add(new HistoricoDados("1986", "São Paulo", "Guarani"));
        galeriaCampeoesA.Add(new HistoricoDados("1987", "Sport", "Guarani"));
        galeriaCampeoesA.Add(new HistoricoDados("1988", "Bahia", "Internacional"));
        galeriaCampeoesA.Add(new HistoricoDados("1989", "Vasco", "São Paulo"));
        galeriaCampeoesA.Add(new HistoricoDados("1990", "Corinthians", "São Paulo"));
        galeriaCampeoesA.Add(new HistoricoDados("1991", "São Paulo", "Bragantino"));
        galeriaCampeoesA.Add(new HistoricoDados("1992", "Flamengo", "Botafogo"));
        galeriaCampeoesA.Add(new HistoricoDados("1993", "Palmeiras", "Vitória"));
        galeriaCampeoesA.Add(new HistoricoDados("1994", "Palmeiras", "Corinthians"));
        galeriaCampeoesA.Add(new HistoricoDados("1995", "Botafogo", "Santos"));
        galeriaCampeoesA.Add(new HistoricoDados("1996", "Grêmio", "Portuguesa"));
        galeriaCampeoesA.Add(new HistoricoDados("1997", "Vasco", "Palmeiras"));
        galeriaCampeoesA.Add(new HistoricoDados("1998", "Corinthians", "Cruzeiro"));
        galeriaCampeoesA.Add(new HistoricoDados("1999", "Corinthians", "Atlético-MG"));
        galeriaCampeoesA.Add(new HistoricoDados("2000", "Vasco", "São Caetano"));
        galeriaCampeoesA.Add(new HistoricoDados("2001", "Athletico-PR", "São Caetano"));
        galeriaCampeoesA.Add(new HistoricoDados("2002", "Santos", "Corinthians"));
        galeriaCampeoesA.Add(new HistoricoDados("2003", "Cruzeiro", "Santos"));
        galeriaCampeoesA.Add(new HistoricoDados("2004", "Santos", "Athletico-PR"));
        galeriaCampeoesA.Add(new HistoricoDados("2005", "Corinthians", "Internacional"));
        galeriaCampeoesA.Add(new HistoricoDados("2006", "São Paulo", "Internacional"));
        galeriaCampeoesA.Add(new HistoricoDados("2007", "São Paulo", "Santos"));
        galeriaCampeoesA.Add(new HistoricoDados("2008", "São Paulo", "Grêmio"));
        galeriaCampeoesA.Add(new HistoricoDados("2009", "Flamengo", "Internacional"));
        galeriaCampeoesA.Add(new HistoricoDados("2010", "Fluminense", "Cruzeiro"));
        galeriaCampeoesA.Add(new HistoricoDados("2011", "Corinthians", "Vasco"));
        galeriaCampeoesA.Add(new HistoricoDados("2012", "Fluminense", "Atlético-MG"));
        galeriaCampeoesA.Add(new HistoricoDados("2013", "Cruzeiro", "Grêmio"));
        galeriaCampeoesA.Add(new HistoricoDados("2014", "Cruzeiro", "São Paulo"));
        galeriaCampeoesA.Add(new HistoricoDados("2015", "Corinthians", "Atlético-MG"));
        galeriaCampeoesA.Add(new HistoricoDados("2016", "Palmeiras", "Santos"));
        galeriaCampeoesA.Add(new HistoricoDados("2017", "Corinthians", "Palmeiras"));
        galeriaCampeoesA.Add(new HistoricoDados("2018", "Palmeiras", "Flamengo"));
        galeriaCampeoesA.Add(new HistoricoDados("2019", "Flamengo", "Santos"));
        galeriaCampeoesA.Add(new HistoricoDados("2020", "Flamengo", "Internacional"));
        galeriaCampeoesA.Add(new HistoricoDados("2021", "Atlético-MG", "Flamengo"));
        galeriaCampeoesA.Add(new HistoricoDados("2022", "Palmeiras", "Internacional"));
        galeriaCampeoesA.Add(new HistoricoDados("2023", "Palmeiras", "Grêmio"));
        galeriaCampeoesA.Add(new HistoricoDados("2024", "Botafogo", "Palmeiras"));
        galeriaCampeoesA.Add(new HistoricoDados("2025", "Flamengo", "Palmeiras"));

        galeriaCampeoesB.Clear();
        galeriaCampeoesB.Add(new HistoricoDados("1971", "Villa Nova-MG", "Remo"));
        galeriaCampeoesB.Add(new HistoricoDados("1972", "Sampaio Corrêa", "Campinense"));
        galeriaCampeoesB.Add(new HistoricoDados("1980", "Londrina", "CSA"));
        galeriaCampeoesB.Add(new HistoricoDados("1981", "Guarani", "Anapolina"));
        galeriaCampeoesB.Add(new HistoricoDados("1982", "Campo Grande", "CSA"));
        galeriaCampeoesB.Add(new HistoricoDados("1983", "Juventus-SP", "CSA"));
        galeriaCampeoesB.Add(new HistoricoDados("1984", "Uberlândia", "Remo"));
        galeriaCampeoesB.Add(new HistoricoDados("1985", "Tuna Luso", "Goytacaz"));
        galeriaCampeoesB.Add(new HistoricoDados("1988", "Inter de Limeira", "Náutico"));
        galeriaCampeoesB.Add(new HistoricoDados("1989", "Bragantino", "São José-SP"));
        galeriaCampeoesB.Add(new HistoricoDados("1990", "Sport", "Athletico-PR"));
        galeriaCampeoesB.Add(new HistoricoDados("1991", "Paysandu", "Guarani"));
        galeriaCampeoesB.Add(new HistoricoDados("1992", "Paraná", "Vitória"));
        galeriaCampeoesB.Add(new HistoricoDados("1994", "Juventude", "Goiás"));
        galeriaCampeoesB.Add(new HistoricoDados("1995", "Athletico-PR", "Coritiba"));
        galeriaCampeoesB.Add(new HistoricoDados("1996", "União São João", "América-RN"));
        galeriaCampeoesB.Add(new HistoricoDados("1997", "América-MG", "Ponte Preta"));
        galeriaCampeoesB.Add(new HistoricoDados("1998", "Gama", "Botafogo-SP"));
        galeriaCampeoesB.Add(new HistoricoDados("1999", "Goiás", "Santa Cruz"));
        galeriaCampeoesB.Add(new HistoricoDados("2000", "Paraná", "São Caetano"));
        galeriaCampeoesB.Add(new HistoricoDados("2001", "Paysandu", "Figueirense"));
        galeriaCampeoesB.Add(new HistoricoDados("2002", "Criciúma", "Fortaleza"));
        galeriaCampeoesB.Add(new HistoricoDados("2003", "Palmeiras", "Botafogo"));
        galeriaCampeoesB.Add(new HistoricoDados("2004", "Brasiliense", "Fortaleza"));
        galeriaCampeoesB.Add(new HistoricoDados("2005", "Grêmio", "Santa Cruz"));
        galeriaCampeoesB.Add(new HistoricoDados("2006", "Atlético-MG", "Sport"));
        galeriaCampeoesB.Add(new HistoricoDados("2007", "Coritiba", "Ipatinga"));
        galeriaCampeoesB.Add(new HistoricoDados("2008", "Corinthians", "Santo André"));
        galeriaCampeoesB.Add(new HistoricoDados("2009", "Vasco", "Guarani"));
        galeriaCampeoesB.Add(new HistoricoDados("2010", "Coritiba", "Figueirense"));
        galeriaCampeoesB.Add(new HistoricoDados("2011", "Portuguesa", "Náutico"));
        galeriaCampeoesB.Add(new HistoricoDados("2012", "Goiás", "Criciúma"));
        galeriaCampeoesB.Add(new HistoricoDados("2013", "Palmeiras", "Chapecoense"));
        galeriaCampeoesB.Add(new HistoricoDados("2014", "Joinville", "Ponte Preta"));
        galeriaCampeoesB.Add(new HistoricoDados("2015", "Botafogo", "Santa Cruz"));
        galeriaCampeoesB.Add(new HistoricoDados("2016", "Atlético-GO", "Avaí"));
        galeriaCampeoesB.Add(new HistoricoDados("2017", "América-MG", "Internacional"));
        galeriaCampeoesB.Add(new HistoricoDados("2018", "Fortaleza", "CSA"));
        galeriaCampeoesB.Add(new HistoricoDados("2019", "Bragantino", "Sport"));
        galeriaCampeoesB.Add(new HistoricoDados("2020", "Chapecoense", "América-MG"));
        galeriaCampeoesB.Add(new HistoricoDados("2021", "Botafogo", "Goiás"));
        galeriaCampeoesB.Add(new HistoricoDados("2022", "Cruzeiro", "Grêmio"));
        galeriaCampeoesB.Add(new HistoricoDados("2023", "Vitória", "Juventude"));
        galeriaCampeoesB.Add(new HistoricoDados("2024", "Santos", "Mirassol"));
        galeriaCampeoesB.Add(new HistoricoDados("2025", "Coritiba", "Athletico"));

        galeriaCampeoesC.Clear();
        galeriaCampeoesC.Add(new HistoricoDados("1981", "Olaria", "Santo Amaro-PE"));
        galeriaCampeoesC.Add(new HistoricoDados("1988", "União São João", "Esportivo-MG"));
        galeriaCampeoesC.Add(new HistoricoDados("1990", "Atlético-GO", "América-MG"));
        galeriaCampeoesC.Add(new HistoricoDados("1992", "Tuna Luso", "Fluminense de Feira"));
        galeriaCampeoesC.Add(new HistoricoDados("1994", "Novorizontino", "Ferroviária"));
        galeriaCampeoesC.Add(new HistoricoDados("1995", "XV de Piracicaba", "Volta Redonda"));
        galeriaCampeoesC.Add(new HistoricoDados("1996", "Vila Nova", "Botafogo-SP"));
        galeriaCampeoesC.Add(new HistoricoDados("1997", "Sampaio Corrêa", "Juventus-SP"));
        galeriaCampeoesC.Add(new HistoricoDados("1998", "Avaí", "São Caetano"));
        galeriaCampeoesC.Add(new HistoricoDados("1999", "Fluminense", "São Raimundo-AM"));
        galeriaCampeoesC.Add(new HistoricoDados("2000", "Malutrom", "Uberlândia"));
        galeriaCampeoesC.Add(new HistoricoDados("2001", "Paulista", "Mogi Mirim"));
        galeriaCampeoesC.Add(new HistoricoDados("2002", "Brasiliense", "Marília"));
        galeriaCampeoesC.Add(new HistoricoDados("2003", "Ituano", "Santo André"));
        galeriaCampeoesC.Add(new HistoricoDados("2004", "União Barbarense", "Gama"));
        galeriaCampeoesC.Add(new HistoricoDados("2005", "Remo", "América-RN"));
        galeriaCampeoesC.Add(new HistoricoDados("2006", "Criciúma", "Vitória"));
        galeriaCampeoesC.Add(new HistoricoDados("2007", "Bragantino", "Bahia"));
        galeriaCampeoesC.Add(new HistoricoDados("2008", "Atlético-GO", "Guarani"));
        galeriaCampeoesC.Add(new HistoricoDados("2009", "América-MG", "ASA"));
        galeriaCampeoesC.Add(new HistoricoDados("2010", "ABC", "Boa Esporte"));
        galeriaCampeoesC.Add(new HistoricoDados("2011", "Joinville", "CRB"));
        galeriaCampeoesC.Add(new HistoricoDados("2012", "Oeste", "Icasa"));
        galeriaCampeoesC.Add(new HistoricoDados("2013", "Santa Cruz", "Sampaio Corrêa"));
        galeriaCampeoesC.Add(new HistoricoDados("2014", "Macaé", "Paysandu"));
        galeriaCampeoesC.Add(new HistoricoDados("2015", "Vila Nova", "Londrina"));
        galeriaCampeoesC.Add(new HistoricoDados("2016", "Boa Esporte", "Guarani"));
        galeriaCampeoesC.Add(new HistoricoDados("2017", "CSA", "Fortaleza"));
        galeriaCampeoesC.Add(new HistoricoDados("2018", "Operário Ferroviário", "Cuiabá"));
        galeriaCampeoesC.Add(new HistoricoDados("2019", "Náutico", "Sampaio Corrêa"));
        galeriaCampeoesC.Add(new HistoricoDados("2020", "Vila Nova", "Remo"));
        galeriaCampeoesC.Add(new HistoricoDados("2021", "Ituano", "Tombense"));
        galeriaCampeoesC.Add(new HistoricoDados("2022", "Mirassol", "ABC"));
        galeriaCampeoesC.Add(new HistoricoDados("2023", "Amazonas", "Brusque"));
        galeriaCampeoesC.Add(new HistoricoDados("2024", "Volta Redonda", "Athletic-MG"));
        galeriaCampeoesC.Add(new HistoricoDados("2025", "Ponte Preta", "Londrina"));

        galeriaCampeoesD.Clear();
        galeriaCampeoesD.Add(new HistoricoDados("2009", "São Raimundo-PA", "Macaé"));
        galeriaCampeoesD.Add(new HistoricoDados("2010", "Guarany de Sobral", "América-AM"));
        galeriaCampeoesD.Add(new HistoricoDados("2011", "Tupi", "Santa Cruz"));
        galeriaCampeoesD.Add(new HistoricoDados("2012", "Sampaio Corrêa", "CRAC"));
        galeriaCampeoesD.Add(new HistoricoDados("2013", "Botafogo-PB", "Juventude"));
        galeriaCampeoesD.Add(new HistoricoDados("2014", "Tombense", "Brasil de Pelotas"));
        galeriaCampeoesD.Add(new HistoricoDados("2015", "Botafogo-SP", "River-PI"));
        galeriaCampeoesD.Add(new HistoricoDados("2016", "Volta Redonda", "CSA"));
        galeriaCampeoesD.Add(new HistoricoDados("2017", "Operário Ferroviário", "Globo-RN"));
        galeriaCampeoesD.Add(new HistoricoDados("2018", "Ferroviário-CE", "Treze"));
        galeriaCampeoesD.Add(new HistoricoDados("2019", "Brusque", "Manaus"));
        galeriaCampeoesD.Add(new HistoricoDados("2020", "Mirassol", "Floresta"));
        galeriaCampeoesD.Add(new HistoricoDados("2021", "Aparecidense", "Campinense"));
        galeriaCampeoesD.Add(new HistoricoDados("2022", "América-RN", "Pouso Alegre"));
        galeriaCampeoesD.Add(new HistoricoDados("2023", "Ferroviário-CE", "Ferroviária-SP"));
        galeriaCampeoesD.Add(new HistoricoDados("2024", "Retrô-PE", "Anápolis"));
        galeriaCampeoesD.Add(new HistoricoDados("2025", "Barra", "Santa Cruz"));

        // COPA DO BRASIL
        galeriaCampeoesCopa.Clear();
        galeriaCampeoesCopa.Add(new HistoricoDados("1989", "Grêmio", "Sport"));
        galeriaCampeoesCopa.Add(new HistoricoDados("1990", "Flamengo", "Goiás"));
        galeriaCampeoesCopa.Add(new HistoricoDados("1991", "Criciúma", "Grêmio"));
        galeriaCampeoesCopa.Add(new HistoricoDados("1992", "Internacional", "Fluminense"));
        galeriaCampeoesCopa.Add(new HistoricoDados("1993", "Cruzeiro", "Grêmio"));
        galeriaCampeoesCopa.Add(new HistoricoDados("1994", "Grêmio", "Ceará"));
        galeriaCampeoesCopa.Add(new HistoricoDados("1995", "Corinthians", "Grêmio"));
        galeriaCampeoesCopa.Add(new HistoricoDados("1996", "Cruzeiro", "Palmeiras"));
        galeriaCampeoesCopa.Add(new HistoricoDados("1997", "Grêmio", "Flamengo"));
        galeriaCampeoesCopa.Add(new HistoricoDados("1998", "Palmeiras", "Cruzeiro"));
        galeriaCampeoesCopa.Add(new HistoricoDados("1999", "Juventude", "Botafogo"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2000", "Cruzeiro", "São Paulo"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2001", "Grêmio", "Corinthians"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2002", "Corinthians", "Brasiliense"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2003", "Cruzeiro", "Flamengo"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2004", "Santo André", "Flamengo"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2005", "Paulista", "Fluminense"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2006", "Flamengo", "Vasco"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2007", "Fluminense", "Figueirense"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2008", "Sport", "Corinthians"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2009", "Corinthians", "Internacional"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2010", "Santos", "Vitória"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2011", "Vasco", "Coritiba"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2012", "Palmeiras", "Coritiba"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2013", "Flamengo", "Athletico-PR"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2014", "Atlético-MG", "Cruzeiro"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2015", "Palmeiras", "Santos"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2016", "Grêmio", "Atlético-MG"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2017", "Cruzeiro", "Flamengo"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2018", "Cruzeiro", "Corinthians"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2019", "Athletico-PR", "Internacional"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2020", "Palmeiras", "Grêmio"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2021", "Atlético-MG", "Athletico-PR"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2022", "Flamengo", "Corinthians"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2023", "São Paulo", "Flamengo"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2024", "Flamengo", "Atlético-MG"));
        galeriaCampeoesCopa.Add(new HistoricoDados("2025", "Corinthians", "Vasco"));
    }
}