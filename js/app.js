/* ========================================
   SICOP - Sistema de Contabilidade Pública
   Lógica Principal e Roteamento
   ======================================== */

// ==========================================
// Estado Global da Aplicação
// ==========================================
const App = {
    exercicio: 2026,
    entidade: { nome: '', cnpj: '' },
    contas: [],
    lancamentos: [],
    receitas: [],
    despesas: [],
};

// ==========================================
// Inicialização
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    inicializarNavegacao();
    inicializarSidebar();
    inicializarModal();
    inicializarConfiguracoes();
    atualizarDataAtual();
    atualizarDashboard();
});

// ==========================================
// Persistência (localStorage)
// ==========================================
function salvarDados() {
    localStorage.setItem('sicop_data', JSON.stringify(App));
}

function carregarDados() {
    const dados = localStorage.getItem('sicop_data');
    if (dados) {
        const parsed = JSON.parse(dados);
        App.exercicio = parsed.exercicio || 2026;
        App.entidade = parsed.entidade || { nome: '', cnpj: '' };
        App.contas = parsed.contas || [];
        App.lancamentos = parsed.lancamentos || [];
        App.receitas = parsed.receitas || [];
        App.despesas = parsed.despesas || [];
    }

    // Atualizar campo exercício na sidebar
    const elExercicio = document.getElementById('exercicio-atual');
    if (elExercicio) elExercicio.textContent = App.exercicio;

    // Atualizar campos de configuração
    const elNome = document.getElementById('config-entidade-nome');
    const elCnpj = document.getElementById('config-entidade-cnpj');
    const elExConfig = document.getElementById('config-exercicio');
    if (elNome) elNome.value = App.entidade.nome;
    if (elCnpj) elCnpj.value = App.entidade.cnpj;
    if (elExConfig) elExConfig.value = App.exercicio;
}

// ==========================================
// Navegação / Roteamento
// ==========================================
function inicializarNavegacao() {
    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            navegarPara(section);
        });
    });

    // Verificar hash na URL
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        navegarPara(hash);
    }
}

function navegarPara(sectionId) {
    // Desativar todas as seções
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

    // Desativar todos os itens do menu
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));

    // Ativar seção e menu correspondentes
    const section = document.getElementById(`section-${sectionId}`);
    const menuItem = document.querySelector(`[data-section="${sectionId}"]`);

    if (section) section.classList.add('active');
    if (menuItem) menuItem.classList.add('active');

    // Atualizar título da página
    const pageTitle = document.getElementById('page-title');
    const titles = {
        'dashboard': 'Dashboard',
        'plano-contas': 'Plano de Contas - PCASP',
        'lancamentos': 'Lançamentos Contábeis',
        'receitas': 'Receitas Orçamentárias',
        'despesas': 'Despesas Orçamentárias',
        'relatorios': 'Relatórios e Demonstrações',
        'configuracoes': 'Configurações',
    };
    if (pageTitle) pageTitle.textContent = titles[sectionId] || 'SICOP';

    // Atualizar hash da URL
    window.location.hash = sectionId;

    // Fechar sidebar no mobile
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }

    // Atualizar conteúdo da seção
    if (sectionId === 'dashboard') atualizarDashboard();
    if (sectionId === 'plano-contas') renderizarPlanoContas();
    if (sectionId === 'lancamentos') renderizarLancamentos();
    if (sectionId === 'receitas') renderizarReceitas();
    if (sectionId === 'despesas') renderizarDespesas();
}

// ==========================================
// Sidebar (toggle mobile)
// ==========================================
function inicializarSidebar() {
    const btnToggle = document.getElementById('btn-toggle-sidebar');
    const sidebar = document.getElementById('sidebar');

    if (btnToggle && sidebar) {
        btnToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
}

// ==========================================
// Data Atual
// ==========================================
function atualizarDataAtual() {
    const el = document.getElementById('data-atual');
    if (el) {
        const hoje = new Date();
        el.textContent = hoje.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }
}

// ==========================================
// Modal
// ==========================================
let modalCallback = null;

function inicializarModal() {
    const overlay = document.getElementById('modal-overlay');
    const btnFechar = document.getElementById('btn-fechar-modal');

    if (btnFechar) {
        btnFechar.addEventListener('click', fecharModal);
    }

    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) fecharModal();
        });
    }
}

function abrirModal(titulo, bodyHTML, footerHTML) {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const footerEl = document.getElementById('modal-footer');

    if (titleEl) titleEl.textContent = titulo;
    if (bodyEl) bodyEl.innerHTML = bodyHTML;
    if (footerEl) footerEl.innerHTML = footerHTML || '';
    if (overlay) overlay.hidden = false;
}

function fecharModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.hidden = true;
    modalCallback = null;
}

// ==========================================
// Configurações
// ==========================================
function inicializarConfiguracoes() {
    // Salvar configurações
    const btnSalvar = document.getElementById('btn-salvar-config');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', () => {
            App.entidade.nome = document.getElementById('config-entidade-nome').value;
            App.entidade.cnpj = document.getElementById('config-entidade-cnpj').value;
            App.exercicio = parseInt(document.getElementById('config-exercicio').value) || 2026;

            const elExercicio = document.getElementById('exercicio-atual');
            if (elExercicio) elExercicio.textContent = App.exercicio;

            salvarDados();
            alert('Configurações salvas com sucesso!');
        });
    }

    // Exportar dados
    const btnExportar = document.getElementById('btn-exportar-dados');
    if (btnExportar) {
        btnExportar.addEventListener('click', () => {
            const blob = new Blob([JSON.stringify(App, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sicop_backup_${App.exercicio}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // Importar dados
    const btnImportar = document.getElementById('btn-importar-dados');
    const inputImportar = document.getElementById('input-importar');

    if (btnImportar && inputImportar) {
        btnImportar.addEventListener('click', () => inputImportar.click());
        inputImportar.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const dados = JSON.parse(ev.target.result);
                    Object.assign(App, dados);
                    salvarDados();
                    carregarDados();
                    alert('Dados importados com sucesso!');
                    navegarPara('dashboard');
                } catch {
                    alert('Erro ao importar: arquivo inválido.');
                }
            };
            reader.readAsText(file);
            inputImportar.value = '';
        });
    }

    // Limpar dados
    const btnLimpar = document.getElementById('btn-limpar-dados');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita.')) {
                localStorage.removeItem('sicop_data');
                App.contas = [];
                App.lancamentos = [];
                App.receitas = [];
                App.despesas = [];
                carregarDados();
                navegarPara('dashboard');
                alert('Dados limpos com sucesso.');
            }
        });
    }
}

// ==========================================
// Dashboard
// ==========================================
let chartReceitaDespesa = null;
let chartComposicaoDespesa = null;

function atualizarDashboard() {
    // Totais
    const totalReceita = App.receitas
        .filter(r => r.estagio === 'Arrecadação')
        .reduce((sum, r) => sum + (parseFloat(r.valor) || 0), 0);

    const totalDespesa = App.despesas
        .filter(d => d.estagio === 'Empenho')
        .reduce((sum, d) => sum + (parseFloat(d.valor) || 0), 0);

    const resultado = totalReceita - totalDespesa;

    document.getElementById('total-receita').textContent = formatarMoeda(totalReceita);
    document.getElementById('total-despesa').textContent = formatarMoeda(totalDespesa);
    document.getElementById('resultado-orcamentario').textContent = formatarMoeda(resultado);
    document.getElementById('total-lancamentos').textContent = App.lancamentos.length;

    // Cor do resultado
    const elResultado = document.getElementById('resultado-orcamentario');
    if (resultado >= 0) {
        elResultado.style.color = 'var(--success)';
    } else {
        elResultado.style.color = 'var(--danger)';
    }

    // Últimos lançamentos
    renderizarUltimosLancamentos();

    // Gráficos
    renderizarGraficos();
}

function renderizarUltimosLancamentos() {
    const tbody = document.getElementById('ultimos-lancamentos');
    if (!tbody) return;

    const ultimos = App.lancamentos.slice(-5).reverse();

    if (ultimos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum lançamento registrado</td></tr>';
        return;
    }

    tbody.innerHTML = ultimos.map(l => `
        <tr>
            <td>${formatarData(l.data)}</td>
            <td>${buscarNomeConta(l.contaDebito)}</td>
            <td>${buscarNomeConta(l.contaCredito)}</td>
            <td>${l.historico}</td>
            <td>${formatarMoeda(l.valor)}</td>
        </tr>
    `).join('');
}

function renderizarGraficos() {
    // Gráfico Receitas x Despesas Mensal
    const ctxRD = document.getElementById('chart-receita-despesa');
    if (!ctxRD) return;

    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const receitasMensal = new Array(12).fill(0);
    const despesasMensal = new Array(12).fill(0);

    App.receitas.forEach(r => {
        if (r.estagio === 'Arrecadação' && r.data) {
            const mes = new Date(r.data).getMonth();
            receitasMensal[mes] += parseFloat(r.valor) || 0;
        }
    });

    App.despesas.forEach(d => {
        if (d.estagio === 'Empenho' && d.data) {
            const mes = new Date(d.data).getMonth();
            despesasMensal[mes] += parseFloat(d.valor) || 0;
        }
    });

    if (chartReceitaDespesa) chartReceitaDespesa.destroy();

    chartReceitaDespesa = new Chart(ctxRD, {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [
                {
                    label: 'Receitas',
                    data: receitasMensal,
                    backgroundColor: 'rgba(39, 174, 96, 0.7)',
                    borderRadius: 4,
                },
                {
                    label: 'Despesas',
                    data: despesasMensal,
                    backgroundColor: 'rgba(192, 57, 43, 0.7)',
                    borderRadius: 4,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (v) => 'R$ ' + v.toLocaleString('pt-BR'),
                    },
                },
            },
        },
    });

    // Gráfico Composição da Despesa
    const ctxCD = document.getElementById('chart-composicao-despesa');
    if (!ctxCD) return;

    const despesaPorNatureza = {};
    App.despesas.forEach(d => {
        const nat = d.natureza || 'Não classificada';
        despesaPorNatureza[nat] = (despesaPorNatureza[nat] || 0) + (parseFloat(d.valor) || 0);
    });

    const naturezas = Object.keys(despesaPorNatureza);
    const valoresNat = Object.values(despesaPorNatureza);
    const cores = ['#e74c3c', '#3498db', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#2ecc71', '#34495e'];

    if (chartComposicaoDespesa) chartComposicaoDespesa.destroy();

    chartComposicaoDespesa = new Chart(ctxCD, {
        type: 'doughnut',
        data: {
            labels: naturezas.length > 0 ? naturezas : ['Sem dados'],
            datasets: [{
                data: valoresNat.length > 0 ? valoresNat : [1],
                backgroundColor: valoresNat.length > 0 ? cores.slice(0, naturezas.length) : ['#ecf0f1'],
            }],
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
        },
    });
}

// ==========================================
// Plano de Contas (renderização básica)
// ==========================================
function renderizarPlanoContas() {
    const container = document.getElementById('plano-contas-tree');
    if (!container) return;

    if (App.contas.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhuma conta cadastrada. Clique em "+ Nova Conta" para começar.</p>';
        return;
    }

    // Organizar por hierarquia (contas raiz = nível 1)
    const raizes = App.contas.filter(c => !c.contaPai);
    container.innerHTML = raizes.map(c => renderizarNodeConta(c)).join('');
}

function renderizarNodeConta(conta) {
    const filhas = App.contas.filter(c => c.contaPai === conta.codigo);
    const temFilhas = filhas.length > 0;
    const natureClass = conta.natureza === 'D' ? 'nature-devedora' : 'nature-credora';
    const natureLabel = conta.natureza === 'D' ? 'Devedora' : 'Credora';

    return `
        <div class="tree-node">
            <div class="tree-node-header" onclick="toggleTreeNode(this)">
                <span class="tree-node-toggle">${temFilhas ? '&#9654;' : '&nbsp;'}</span>
                <span class="tree-node-code">${conta.codigo}</span>
                <span class="tree-node-name">${conta.nome}</span>
                <span class="tree-node-nature ${natureClass}">${natureLabel}</span>
            </div>
            ${temFilhas ? `<div class="tree-children">${filhas.map(f => renderizarNodeConta(f)).join('')}</div>` : ''}
        </div>
    `;
}

function toggleTreeNode(header) {
    const children = header.nextElementSibling;
    if (!children || !children.classList.contains('tree-children')) return;

    children.classList.toggle('expanded');
    const toggle = header.querySelector('.tree-node-toggle');
    if (toggle) {
        toggle.innerHTML = children.classList.contains('expanded') ? '&#9660;' : '&#9654;';
    }
}

// ==========================================
// Lançamentos (renderização)
// ==========================================
function renderizarLancamentos() {
    const tbody = document.getElementById('lista-lancamentos');
    if (!tbody) return;

    if (App.lancamentos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Nenhum lançamento registrado</td></tr>';
        return;
    }

    tbody.innerHTML = App.lancamentos.map((l, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${formatarData(l.data)}</td>
            <td>${buscarNomeConta(l.contaDebito)}</td>
            <td>${buscarNomeConta(l.contaCredito)}</td>
            <td>${l.historico}</td>
            <td>${formatarMoeda(l.valor)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="excluirLancamento(${i})">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function excluirLancamento(index) {
    if (confirm('Deseja excluir este lançamento?')) {
        App.lancamentos.splice(index, 1);
        salvarDados();
        renderizarLancamentos();
    }
}

// ==========================================
// Receitas (renderização)
// ==========================================
function renderizarReceitas() {
    const tbody = document.getElementById('lista-receitas');
    if (!tbody) return;

    if (App.receitas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhuma receita registrada</td></tr>';
        return;
    }

    tbody.innerHTML = App.receitas.map((r, i) => `
        <tr>
            <td>${formatarData(r.data)}</td>
            <td>${r.natureza}</td>
            <td>${r.descricao}</td>
            <td><span class="badge">${r.estagio}</span></td>
            <td>${formatarMoeda(r.valor)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="excluirReceita(${i})">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function excluirReceita(index) {
    if (confirm('Deseja excluir esta receita?')) {
        App.receitas.splice(index, 1);
        salvarDados();
        renderizarReceitas();
    }
}

// ==========================================
// Despesas (renderização)
// ==========================================
function renderizarDespesas() {
    const tbody = document.getElementById('lista-despesas');
    if (!tbody) return;

    if (App.despesas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhuma despesa registrada</td></tr>';
        return;
    }

    tbody.innerHTML = App.despesas.map((d, i) => `
        <tr>
            <td>${formatarData(d.data)}</td>
            <td>${d.natureza}</td>
            <td>${d.descricao}</td>
            <td><span class="badge">${d.estagio}</span></td>
            <td>${formatarMoeda(d.valor)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="excluirDespesa(${i})">Excluir</button>
            </td>
        </tr>
    `).join('');
}

function excluirDespesa(index) {
    if (confirm('Deseja excluir esta despesa?')) {
        App.despesas.splice(index, 1);
        salvarDados();
        renderizarDespesas();
    }
}

// ==========================================
// Utilitários
// ==========================================
function formatarMoeda(valor) {
    return parseFloat(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

function formatarData(dataStr) {
    if (!dataStr) return '-';
    const d = new Date(dataStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
}

function buscarNomeConta(codigo) {
    const conta = App.contas.find(c => c.codigo === codigo);
    return conta ? `${conta.codigo} - ${conta.nome}` : codigo || '-';
}

function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
