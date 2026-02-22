using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;
using System.Linq;

public class BrasileiraoUI : MonoBehaviour
{
    public BrasileiraoManager manager;

    [Header("Menu Principal")]
    public Button btnSimular;
    public TMP_Dropdown dropdownDivisoes; 
    public Button btnVerJogar;       
    public Button btnVerGaleria;     

    [Header("Indicadores")]
    public TextMeshProUGUI txtTituloDivisao;    
    public TextMeshProUGUI txtRodadaAtualJogo;  
    public TextMeshProUGUI txtAnoAtual;         

    [Header("Paineis")]
    public GameObject panelJogar;    
    public GameObject panelGaleria;  

    [Header("Tabela")]
    public Transform containerTabela;       
    public GameObject prefabLinhaTabela;    

    [Header("Resultados")]
    public Transform containerResultados;   
    public GameObject prefabLinhaJogo;      
    public TextMeshProUGUI txtTituloResultados;        
    public Button btnRodadaAnterior;        
    public Button btnRodadaProxima;         

    [Header("Galeria")]
    public Transform containerHistorico;    
    public Transform containerRanking;      
    public GameObject prefabLinhaHistorico; 
    public GameObject prefabLinhaRanking;   
    public TextMeshProUGUI txtTituloGaleria;           

    [Header("Controle de Grupos (Série D)")]
    public GameObject panelBotoesGrupos;
    public Button btnGrupo1;
    public Button btnGrupo2;
    public Button btnGrupo3;
    public TextMeshProUGUI txtNomeGrupo; 

    // --- VARIÁVEIS INTERNAS ---
    private int rodadaVisualizada = 1;
    private int indiceCopaVisualizado = 0; // Índice da fase da Copa sendo visualizada
    
    // Lista de fases da Copa na ordem
    private string[] fasesCopa = new string[] {
        "Primeira Fase",
        "Segunda Fase", 
        "Terceira Fase",
        "Oitavas de Final",
        "Oitavas de Final (Volta)",
        "Quartas de Final",
        "Quartas de Final (Volta)",
        "Semifinal",
        "Semifinal (Volta)",
        "Final"
    };      
    private int divisaoAtualIdx = 0;        // 0=A, 1=B, 2=C, 3=D, 4=COPA
    private int grupoVisualizadoD = 1;      // 1, 2 ou 3

    void Start()
    {
        if (btnSimular) btnSimular.onClick.AddListener(ClicarSimular);
        
        // Listener do Dropdown
        if (dropdownDivisoes) 
        {
            dropdownDivisoes.ClearOptions();
            // ADICIONADA A COPA DO BRASIL NA LISTA
            List<string> opcoes = new List<string> { "SÉRIE A", "SÉRIE B", "SÉRIE C", "SÉRIE D", "COPA DO BRASIL" };
            dropdownDivisoes.AddOptions(opcoes);
            dropdownDivisoes.onValueChanged.AddListener(MudarDivisaoPeloDropdown);
        }

        if (btnVerJogar) btnVerJogar.onClick.AddListener(() => MostrarTela("Jogar"));
        if (btnVerGaleria) btnVerGaleria.onClick.AddListener(() => MostrarTela("Galeria"));
        if (btnRodadaAnterior) btnRodadaAnterior.onClick.AddListener(() => MudarRodadaVisualizada(-1));
        if (btnRodadaProxima) btnRodadaProxima.onClick.AddListener(() => MudarRodadaVisualizada(1));

        if (btnGrupo1) btnGrupo1.onClick.AddListener(() => MudarGrupo(1));
        if (btnGrupo2) btnGrupo2.onClick.AddListener(() => MudarGrupo(2));
        if (btnGrupo3) btnGrupo3.onClick.AddListener(() => MudarGrupo(3));

        MostrarTela("Jogar");          
        AtualizarTextoRodadaAtual();   
        MudarDivisaoPeloDropdown(0); 
    }

    void MudarDivisaoPeloDropdown(int index)
    {
        divisaoAtualIdx = index;
        AtualizarTituloDivisao();
        AtualizarBotoesGrupo();
        
        // Se mudou para Copa, sincroniza o índice com a fase atual
        if(divisaoAtualIdx == 4)
        {
            SincronizarIndiceCopa();
        }
        
        if (panelJogar.activeSelf) 
        {
            MontarTabela();
            MontarResultados(rodadaVisualizada);
        }
        else if (panelGaleria.activeSelf) MontarGaleriaCompleta();
    }
    
    void SincronizarIndiceCopa()
    {
        // Encontra qual fase está sendo jogada atualmente
        string faseAtual = manager.faseAtualCopa;
        
        for(int i = 0; i < fasesCopa.Length; i++)
        {
            if(fasesCopa[i] == faseAtual || faseAtual.Contains(fasesCopa[i]))
            {
                indiceCopaVisualizado = i;
                return;
            }
        }
        
        // Se não encontrou, vai para a primeira
        indiceCopaVisualizado = 0;
    }

    void MudarGrupo(int grupo)
    {
        grupoVisualizadoD = grupo;
        MontarTabela(); 
        if(txtNomeGrupo) txtNomeGrupo.text = $"GRUPO {grupo}";
    }

    void AtualizarBotoesGrupo()
    {
        if(!panelBotoesGrupos) return;
        
        // Só mostra botões na D (e se não for fase final)
        bool mostrar = (divisaoAtualIdx == 3 && !manager.faseFinalD_Iniciada);
        panelBotoesGrupos.SetActive(mostrar);

        if(txtNomeGrupo)
        {
            if(mostrar) txtNomeGrupo.text = $"GRUPO {grupoVisualizadoD}";
            else if (divisaoAtualIdx == 3 && manager.faseFinalD_Iniciada) txtNomeGrupo.text = "FASE FINAL";
            else if (divisaoAtualIdx == 4) txtNomeGrupo.text = manager.faseAtualCopa.ToUpper(); // Mostra fase da copa
            else txtNomeGrupo.text = "";
        }
    }

    void AtualizarTituloDivisao()
    {
        if (!txtTituloDivisao) return;
        switch (divisaoAtualIdx)
        {
            case 0: txtTituloDivisao.text = "SÉRIE A"; txtTituloDivisao.color = Color.green; break;
            case 1: txtTituloDivisao.text = "SÉRIE B"; txtTituloDivisao.color = Color.yellow; break;
            case 2: txtTituloDivisao.text = "SÉRIE C"; txtTituloDivisao.color = Color.cyan; break;
            case 3: txtTituloDivisao.text = "SÉRIE D"; txtTituloDivisao.color = Color.white; break;
            case 4: txtTituloDivisao.text = "COPA DO BRASIL"; txtTituloDivisao.color = new Color(1f, 0.5f, 0f); break; // Laranja
        }
    }

    void ClicarSimular()
    {
        if (manager != null)
        {
            bool eraFimDeTemporada = manager.temporadaFinalizada;
            int rodadaAntes = manager.rodadaAtual; 
            bool eraFaseGruposD = !manager.faseFinalD_Iniciada;

            manager.SimularRodadaOuIniciarAno();
            AtualizarTextoRodadaAtual();
            AtualizarBotoesGrupo(); // Atualiza textos de fase da copa ou grupos
            
            // Se está na Copa, sincroniza o índice com a fase que acabou de ser jogada
            if(divisaoAtualIdx == 4)
            {
                SincronizarIndiceCopa();
            }

            if (!eraFimDeTemporada && !manager.temporadaFinalizada)
            {
                rodadaVisualizada = rodadaAntes;
                AtualizarInterface(rodadaVisualizada);
            }
            else if (eraFimDeTemporada)
            {
                rodadaVisualizada = 1;
                AtualizarInterface(1);
            }
        }
    }

    void AtualizarTextoRodadaAtual()
    {
        if (!manager) return;
        if (txtAnoAtual) txtAnoAtual.text = manager.anoAtual.ToString();

        TextMeshProUGUI textoBotao = btnSimular.GetComponentInChildren<TextMeshProUGUI>();

        if (manager.temporadaFinalizada)
        {
            txtRodadaAtualJogo.text = "Fim de Temporada";
            if (textoBotao) { textoBotao.text = $"INICIAR {manager.anoAtual + 1}"; textoBotao.color = Color.yellow; }
        }
        else
        {
            int totalRodadas = BrasileiraoManager.TOTAL_RODADAS; 
            int rodadaReal = Mathf.Min(manager.rodadaAtual, totalRodadas);
            txtRodadaAtualJogo.text = $"Próxima: Rodada {rodadaReal} / {totalRodadas}";
            if (textoBotao) { textoBotao.text = "SIMULAR RODADA"; textoBotao.color = Color.white; }
        }
    }

    void MudarRodadaVisualizada(int direcao)
    {
        // Se está na Copa, navega por FASES ao invés de rodadas
        if(divisaoAtualIdx == 4)
        {
            indiceCopaVisualizado += direcao;
            
            // Limita aos índices válidos
            if (indiceCopaVisualizado < 0) indiceCopaVisualizado = 0;
            if (indiceCopaVisualizado >= fasesCopa.Length) indiceCopaVisualizado = fasesCopa.Length - 1;
            
            if (panelJogar.activeSelf) MontarResultados(0); // Passa 0, será ignorado na Copa
        }
        else
        {
            // Navegação normal por rodadas
            rodadaVisualizada += direcao;
            if (rodadaVisualizada < 1) rodadaVisualizada = 1;
            if (rodadaVisualizada > BrasileiraoManager.TOTAL_RODADAS) rodadaVisualizada = BrasileiraoManager.TOTAL_RODADAS;
            if (panelJogar.activeSelf) MontarResultados(rodadaVisualizada);
        }
    }

    void MostrarTela(string tela)
    {
        if (panelJogar) panelJogar.SetActive(tela == "Jogar");
        if (panelGaleria) panelGaleria.SetActive(tela == "Galeria");
        AtualizarInterface(rodadaVisualizada);
    }

    public void AtualizarInterface(int rodadaParaMostrar)
    {
        AtualizarTextoRodadaAtual();
        rodadaVisualizada = rodadaParaMostrar;
        if (panelJogar.activeSelf) { MontarTabela(); MontarResultados(rodadaVisualizada); }
        if (panelGaleria.activeSelf) MontarGaleriaCompleta();
    }

    // --- SELETORES DE LISTA ---
    List<TimeSerieA> GetTimesAtuais()
    {
        if (divisaoAtualIdx == 0) return manager.timesA;
        if (divisaoAtualIdx == 1) return manager.timesB;
        if (divisaoAtualIdx == 2) return manager.timesC;
        if (divisaoAtualIdx == 3) return manager.timesD;
        return manager.timesCopaVivos; // Caso 4: Copa
    }

    List<PartidaSerieA> GetPartidasAtuais()
    {
        if (divisaoAtualIdx == 0) return manager.partidasA;
        if (divisaoAtualIdx == 1) return manager.partidasB;
        if (divisaoAtualIdx == 2) return manager.partidasC;
        if (divisaoAtualIdx == 3) return manager.partidasD;
        return manager.partidasCopa; // Caso 4: Copa
    }

    List<HistoricoDados> GetGaleriaAtual()
    {
        if (divisaoAtualIdx == 0) return manager.galeriaCampeoesA;
        if (divisaoAtualIdx == 1) return manager.galeriaCampeoesB;
        if (divisaoAtualIdx == 2) return manager.galeriaCampeoesC;
        if (divisaoAtualIdx == 3) return manager.galeriaCampeoesD;
        return manager.galeriaCampeoesCopa; // Caso 4: Copa
    }

    // --- MONTAGEM DA TABELA ---
    // Retorna o nome da competição atual baseado no índice da divisão
    string GetNomeCompeticaoAtual()
    {
        switch(divisaoAtualIdx)
        {
            case 0: return "BrasileiraoA";
            case 1: return "BrasileiraoB";
            case 2: return "BrasileiraoC";
            case 3: return "BrasileiraoD";
            case 4: return "Copa";
            default: return "BrasileiraoA";
        }
    }

    void MontarTabela()
    {
        if (!containerTabela || !manager) return;
        LimparContainer(containerTabela);

        List<TimeSerieA> listaCompleta = GetTimesAtuais();
        string nomeCompeticao = GetNomeCompeticaoAtual();
        
        // --- MODO COPA DO BRASIL ---
        if(divisaoAtualIdx == 4) 
        {
            // Se a Copa terminou (rodada > 30 e só tem 1 time), mostra mensagem especial
            if(manager.rodadaAtual > 30 && listaCompleta.Count <= 1)
            {
                GameObject linha = Instantiate(prefabLinhaTabela, containerTabela);
                TextMeshProUGUI[] txt = linha.GetComponentsInChildren<TextMeshProUGUI>();
                
                if(txt.Length >= 9 && listaCompleta.Count == 1) {
                    // Bandeira do campeão
                    RawImage img = linha.GetComponentInChildren<RawImage>();
                    if(img) { img.texture = GerarTexturaBandeira(listaCompleta[0].cores); img.color = Color.white; }
                    
                    txt[0].text = "🏆"; // Troféu
                    txt[1].text = "  " + listaCompleta[0].nome;
                    txt[2].text = ""; txt[3].text = ""; txt[4].text = ""; 
                    txt[5].text = ""; txt[6].text = ""; txt[7].text = ""; 
                    txt[8].text = "CAMPEÃO";
                    txt[0].color = Color.yellow;
                    txt[0].fontStyle = FontStyles.Bold;
                    txt[1].fontStyle = FontStyles.Bold;
                    txt[8].color = new Color(1f, 0.84f, 0f); // Dourado
                    txt[8].fontStyle = FontStyles.Bold;
                }
            }
            else
            {
                // Mostra lista de sobreviventes sem pontos
                foreach(var time in listaCompleta) 
                {
                    GameObject linha = Instantiate(prefabLinhaTabela, containerTabela);
                    TextMeshProUGUI[] txt = linha.GetComponentsInChildren<TextMeshProUGUI>();
                    
                    // Bandeira
                    RawImage img = linha.GetComponentInChildren<RawImage>();
                    if(img) { img.texture = GerarTexturaBandeira(time.cores); img.color = Color.white; }

                    if(txt.Length >= 9) {
                        txt[0].text = ""; // Sem posição numérica
                        txt[1].text = "  " + time.nome;
                        txt[2].text = ""; txt[3].text = ""; txt[4].text = ""; 
                        txt[5].text = ""; txt[6].text = ""; txt[7].text = ""; 
                        txt[8].text = "VIVO"; // Status no lugar do Saldo
                        txt[0].color = Color.black;
                    }
                }
            }
            return; // Sai da função, pois Copa não tem tabela de pontos
        }

        // --- MODO LIGAS (A, B, C, D) ---
        List<TimeSerieA> listaFiltrada = new List<TimeSerieA>();

        if (divisaoAtualIdx == 3) // D
        {
            // Pega stats da competição para fazer a filtragem/ordenação
            if (manager.faseFinalD_Iniciada) 
            {
                // Na fase final, mostra APENAS os 12 times que estão jogando
                // Identifica pelos jogos da fase final (rodadas 31 a 41)
                var jogosFaseFinal = manager.partidasD.Where(p => p.rodada >= 31).ToList();
                HashSet<TimeSerieA> timesClassificados = new HashSet<TimeSerieA>();
                
                foreach(var jogo in jogosFaseFinal)
                {
                    timesClassificados.Add(jogo.mandante);
                    timesClassificados.Add(jogo.visitante);
                }
                
                listaFiltrada = timesClassificados.ToList();
                
                Debug.Log($"[UI Série D] Fase Final: {listaFiltrada.Count} times classificados");
            }
            else 
            {
                // Fase de grupos: filtra por chave
                listaFiltrada = listaCompleta.Where(t => t.GetStats(nomeCompeticao).grupoD == grupoVisualizadoD).ToList();
            }
        }
        else listaFiltrada = listaCompleta; // A, B, C
        
        // Ordena usando as stats DA COMPETIÇÃO ATUAL (não contamina com Copa!)
        var tabelaOrdenada = listaFiltrada
            .OrderByDescending(t => t.GetStats(nomeCompeticao).pontos)
            .ThenByDescending(t => t.GetStats(nomeCompeticao).vitorias)
            .ThenByDescending(t => t.GetStats(nomeCompeticao).saldoGols)
            .ThenByDescending(t => t.GetStats(nomeCompeticao).golsPro)
            .ToList();

        int posicao = 1;
        int totalTimes = tabelaOrdenada.Count; 

        foreach (var time in tabelaOrdenada)
        {
            GameObject linha = Instantiate(prefabLinhaTabela, containerTabela);
            TextMeshProUGUI[] textos = linha.GetComponentsInChildren<TextMeshProUGUI>();

            // Bandeira
            RawImage imgBandeira = linha.GetComponentInChildren<RawImage>();
            if (imgBandeira != null) {
                imgBandeira.texture = GerarTexturaBandeira(time.cores);
                imgBandeira.color = Color.white; 
            }

            if (textos.Length >= 9)
            {
                // Pega as stats DA COMPETIÇÃO ATUAL
                StatsCompeticao stats = time.GetStats(nomeCompeticao);
                
                textos[0].text = posicao + "º";
                textos[1].text = "  " + time.nome;
                textos[2].text = stats.pontos.ToString();
                textos[3].text = stats.vitorias.ToString();
                textos[4].text = stats.empates.ToString();
                textos[5].text = stats.derrotas.ToString();
                textos[6].text = stats.golsPro.ToString();
                textos[7].text = stats.golsContra.ToString();
                textos[8].text = stats.saldoGols.ToString();

                textos[0].color = Color.black; 
                if (divisaoAtualIdx <= 2) 
                {
                    if (posicao <= 4) textos[0].color = Color.green; 
                    else if (posicao >= totalTimes - 3) textos[0].color = Color.red; 
                }
                else 
                {
                    if(manager.faseFinalD_Iniciada) { if(posicao == 1) textos[0].color = Color.yellow; }
                    else { if (posicao <= 4) textos[0].color = Color.green; }
                }
            }
            posicao++;
        }
    }

    Texture2D GerarTexturaBandeira(Color[] cores)
    {
        int largura = cores.Length;
        Texture2D textura = new Texture2D(largura, 1);
        textura.filterMode = FilterMode.Point; 
        for (int i = 0; i < largura; i++) textura.SetPixel(i, 0, cores[i]);
        textura.Apply();
        return textura;
    }

    // --- MONTAGEM DE RESULTADOS ---
void MontarResultados(int rodada)
    {
        if (!containerResultados || !manager) return;
        LimparContainer(containerResultados);

        List<PartidaSerieA> listaJogos = GetPartidasAtuais();
        
        // ── MODO COPA: Filtra por FASE ao invés de rodada ──
        if (divisaoAtualIdx == 4) 
        {
            // Usa o índice navegável (controlado pelos botões < >)
            string faseParaMostrar = fasesCopa[indiceCopaVisualizado];
            
            if (txtTituloResultados) txtTituloResultados.text = faseParaMostrar;
            
            var jogosDaFase = listaJogos.Where(p => p.faseCopa == faseParaMostrar).OrderBy(p => p.data).ToList();
            
            Debug.Log($"[MontarResultados Copa] Fase: {faseParaMostrar} (índice {indiceCopaVisualizado}) | Jogos: {jogosDaFase.Count}");
            
            if (jogosDaFase.Count == 0)
            {
                GameObject linha = Instantiate(prefabLinhaJogo, containerResultados);
                TextMeshProUGUI txtAviso = linha.GetComponentInChildren<TextMeshProUGUI>(); 
                if(txtAviso) 
                {
                    txtAviso.text = "Nenhum jogo nesta fase ainda.";
                    txtAviso.alignment = TextAlignmentOptions.Center;
                }
                return;
            }
            
            foreach (var jogo in jogosDaFase)
            {
                CriarLinhaResultado(jogo);
            }
        }
        // ── MODO NORMAL: Filtra por rodada ──
        else 
        {
            if (txtTituloResultados) txtTituloResultados.text = $"Rodada {rodada}";
            
            Debug.Log($"[MontarResultados] Rodada {rodada} | Total de jogos: {listaJogos.Count}");
            
            var jogosDaRodada = listaJogos.Where(p => p.rodada == rodada).OrderBy(p => p.data).ToList();
            
            Debug.Log($"[MontarResultados] Jogos da rodada {rodada}: {jogosDaRodada.Count}");

            if (jogosDaRodada.Count == 0)
            {
                GameObject linha = Instantiate(prefabLinhaJogo, containerResultados);
                TextMeshProUGUI txtAviso = linha.GetComponentInChildren<TextMeshProUGUI>(); 
                if(txtAviso) 
                {
                    txtAviso.text = "Sem jogos nesta rodada.";
                    txtAviso.alignment = TextAlignmentOptions.Center;
                }
                return;
            }

            foreach (var jogo in jogosDaRodada)
            {
                CriarLinhaResultado(jogo);
            }
        }
        
        LayoutRebuilder.ForceRebuildLayoutImmediate(containerResultados.GetComponent<RectTransform>());
    }
    
    void CriarLinhaResultado(PartidaSerieA jogo)
    {
        GameObject linha = Instantiate(prefabLinhaJogo, containerResultados);
        TextMeshProUGUI[] textos = linha.GetComponentsInChildren<TextMeshProUGUI>();

        if (textos.Length >= 4)
        {
            // 1. Mandante
            textos[0].text = jogo.mandante.nome;
            textos[0].color = jogo.foiJogada ? Color.black : Color.gray;
            
            // 2. Placar
            if (jogo.foiJogada)
            {
                string placarTexto = $"{jogo.golsMandante}  x  {jogo.golsVisitante}";
                
                // Se foi para pênaltis, adiciona o resultado
                if(jogo.foiParaPenaltis)
                {
                    placarTexto += $"\n({jogo.penaltisMandante} x {jogo.penaltisVisitante} pen)";
                }
                
                textos[1].text = placarTexto;
                textos[1].fontStyle = FontStyles.Bold;
                textos[1].color = Color.black;
            }
            else
            {
                textos[1].text = "x";
                textos[1].fontStyle = FontStyles.Normal;
                textos[1].color = Color.gray;
            }

            // 3. Visitante
            textos[2].text = jogo.visitante.nome;
            textos[2].color = jogo.foiJogada ? Color.black : Color.gray;

            // 4. Informações (Data)
            textos[3].text = jogo.data.ToString("dd/MM HH:mm");
            textos[3].color = Color.gray;
        }
        // Fallback: Se só tem 1 texto
        else if (textos.Length == 1)
        {
            string placar = jogo.foiJogada ? $"{jogo.golsMandante} x {jogo.golsVisitante}" : " x ";
            if(jogo.foiParaPenaltis) placar += $" ({jogo.penaltisMandante}x{jogo.penaltisVisitante} pen)";
            textos[0].text = $"{jogo.mandante.nome} {placar} {jogo.visitante.nome}";
        }
    }

    void MontarGaleriaCompleta()
    {
        if (!manager) return;
        string nomeDiv = "";
        switch(divisaoAtualIdx) {
            case 0: nomeDiv = "A"; break; case 1: nomeDiv = "B"; break; 
            case 2: nomeDiv = "C"; break; case 3: nomeDiv = "D"; break; 
            case 4: nomeDiv = "COPA DO BRASIL"; break;
        }
        
        if (txtTituloGaleria) txtTituloGaleria.text = divisaoAtualIdx == 4 ? "GALERIA COPA DO BRASIL" : $"GALERIA SÉRIE {nomeDiv}";

        List<HistoricoDados> listaHistorico = GetGaleriaAtual();

        if (containerHistorico)
        {
            LimparContainer(containerHistorico);
            var listaInvertida = Enumerable.Reverse(listaHistorico).ToList();
            foreach (var dado in listaInvertida)
            {
                GameObject linha = Instantiate(prefabLinhaHistorico, containerHistorico);
                TextMeshProUGUI texto = linha.GetComponentInChildren<TextMeshProUGUI>();
                texto.text = $"{dado.ano}: {dado.campeao} (Vice: {dado.vice})";
                texto.color = Color.black;
            }
        }

        if (containerRanking)
        {
            LimparContainer(containerRanking);
            Dictionary<string, int> contagem = new Dictionary<string, int>();
            foreach (var dado in listaHistorico)
            {
                if (!contagem.ContainsKey(dado.campeao)) contagem[dado.campeao] = 0;
                contagem[dado.campeao]++;
            }
            var rankingOrdenado = contagem.OrderByDescending(x => x.Value).ToList();
            int posicao = 1;
            foreach (var item in rankingOrdenado)
            {
                GameObject linha = Instantiate(prefabLinhaRanking, containerRanking);
                TextMeshProUGUI texto = linha.GetComponentInChildren<TextMeshProUGUI>();
                texto.text = $"{posicao}º {item.Key} - {item.Value} títulos";
                texto.color = Color.black;
                posicao++;
            }
        }
    }

    void LimparContainer(Transform container) { foreach (Transform child in container) { Destroy(child.gameObject); } }
}