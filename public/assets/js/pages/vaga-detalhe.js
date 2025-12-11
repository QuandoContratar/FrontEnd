/* ========================================
   PÁGINA DE DETALHES DA VAGA
   Mostra informações de candidatos por vaga
   ======================================== */

import { DashboardClient } from "../components/client.js";

// ============================
// CONFIGURAÇÕES
// ============================
const dashboardClient = new DashboardClient();

// Cores padrão para os gráficos
const COLORS = {
    primary: '#4e73df',
    primaryHover: '#2e59d9',
    success: '#1cc88a',
    successHover: '#17a673',
    info: '#36b9cc',
    infoHover: '#2c9faf',
    warning: '#f6c23e',
    danger: '#e74a3b'
};

// Dados de fallback
const FALLBACK_DATA = {
    vaga: {
        id: 1,
        nome: "Java Junior",
        descricao: "Desenvolvedor Java com conhecimentos em Spring Boot",
        ativo: true,
        dataAbertura: new Date().toLocaleDateString('pt-BR'),
        totalCandidatos: 3671
    },
    candidatos: [
        { id: 1, nome: "Nathan", contato: "PJ", periodo: "Diurno", localidade: "São Paulo", gestor: "Alexandre", matching: 80 },
        { id: 2, nome: "Maria", contato: "CLT", periodo: "Noturno", localidade: "São Paulo", gestor: "Alexandre", matching: 75 },
        { id: 3, nome: "João", contato: "PJ", periodo: "Diurno", localidade: "Rio de Janeiro", gestor: "Pedro", matching: 85 }
    ],
    etapas: [
        { nome: "Não iniciado", total: 3671 },
        { nome: "Avaliacao Técnica", total: 156 },
        { nome: "Fit cultural", total: 156 },
        { nome: "Proposta", total: 156 }
    ],
    retencao: [
        { status: "Em Andamento", total: 2200 },
        { status: "Aprovados", total: 1000 },
        { status: "Rejeitados", total: 471 }
    ]
};

// ============================
// FUNÇÕES UTILITÁRIAS
// ============================
function getVagaIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('nome');
}

function numberFormat(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ============================
// CARREGAR DADOS DA VAGA
// ============================
async function loadVagaDetails() {
    const vagaId = getVagaIdFromUrl();
    
    if (!vagaId) {
        console.warn('Nenhuma vaga selecionada');
        return;
    }

    let vagaData;
    
    try {
        console.log('📊 [Vaga Detalhe] Carregando dados da vaga:', vagaId);
        vagaData = await dashboardClient.getVagaById(vagaId);
        console.log('✅ [Vaga Detalhe] Vaga carregada:', vagaData);
    } catch (error) {
        console.warn('⚠️ [Vaga Detalhe] Usando fallback para vaga');
        vagaData = FALLBACK_DATA.vaga;
    }

    // Atualizar título da página
    const titulo = document.getElementById('vagaTitulo');
    if (titulo) {
        titulo.textContent = `Painel de candidatos para {${vagaData.nome}}`;
    }

    // Carregar métricas por etapa
    await loadMetricasPorEtapa(vagaId);
    
    // Carregar tabela de candidatos
    await loadCandidatos(vagaId);
    
    // Carregar gráfico de retenção
    await loadRetencao(vagaId);
    
    // Carregar informações da vaga
    await loadInfomacoes(vagaId, vagaData);
}

// ============================
// CARREGAR MÉTRICAS POR ETAPA
// ============================
async function loadMetricasPorEtapa(vagaId) {
    const metricsRow = document.getElementById('metricsRow');
    if (!metricsRow) return;

    let etapas;
    
    try {
        console.log('📊 [Vaga Detalhe] Carregando etapas...');
        etapas = await dashboardClient.getVagaStages(vagaId);
        console.log('✅ [Vaga Detalhe] Etapas carregadas:', etapas);
    } catch (error) {
        console.warn('⚠️ [Vaga Detalhe] Usando fallback para etapas');
        etapas = FALLBACK_DATA.etapas;
    }

    // Mapa de configuração para cada etapa (cor, ícone, etc)
    const etapasConfig = [
        {
            key: 'aguardando_triagem',
            nome: 'Aguardando Triagem',
            cor: 'primary',
            icon: 'fa-hourglass-start'
        },
        {
            key: 'triagem',
            nome: 'Triagem',
            cor: 'success',
            icon: 'fa-search'
        },
        {
            key: 'entrevista_rh',
            nome: 'Entrevista RH',
            cor: 'info',
            icon: 'fa-comments'
        },
        {
            key: 'fit_cultural',
            nome: 'Fit Cultural',
            cor: 'warning',
            icon: 'fa-users'
        },
        {
            key: 'teste_tecnico',
            nome: 'Teste Técnico',
            cor: 'danger',
            icon: 'fa-code'
        },
        {
            key: 'entrevista_tecnica',
            nome: 'Entrevista Técnica',
            cor: 'secondary',
            icon: 'fa-laptop-code'
        },
        {
            key: 'entrevista_final',
            nome: 'Entrevista Final',
            cor: 'warning',
            icon: 'fa-handshake'
        },
        {
            key: 'proposta',
            nome: 'Proposta',
            cor: 'success',
            icon: 'fa-file-contract'
        },
        {
            key: 'contratacao',
            nome: 'Contratação',
            cor: 'primary',
            icon: 'fa-check-circle'
        }
    ];

    metricsRow.innerHTML = '';

    // Criar um mapa dos dados recebidos para fácil acesso
    const etapasMap = {};
    etapas.forEach(etapa => {
        const nomeNormalizado = etapa.nome
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[áàâã]/g, 'a')
            .replace(/[éè]/g, 'e')
            .replace(/[í]/g, 'i')
            .replace(/[óôõ]/g, 'o')
            .replace(/[ú]/g, 'u');
        etapasMap[nomeNormalizado] = etapa;
    });

    // Gerar cards para cada etapa configurada
    etapasConfig.forEach((config) => {
        const etapaData = etapasMap[config.key] || { total: 0 };
        const total = etapaData.total || 0;

        const metricHtml = `
            <div class="col-6 col-sm-4 col-md-3 mb-4" style="flex: 1 1 20%; max-width: 20%;">
                <div class="card border-left-${config.cor} shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-${config.cor} text-uppercase mb-1">
                                    ${config.nome}
                                </div>
                                <div class="h4 mb-0 font-weight-bold text-gray-800">
                                    ${numberFormat(total)}
                                </div>
                            </div>
                            <div class="col-auto">
                                <i class="fas ${config.icon} fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        metricsRow.innerHTML += metricHtml;
    });
}

// ============================
// CARREGAR CANDIDATOS
// ============================
async function loadCandidatos(vagaId) {
    let candidatos;
    
    try {
        console.log('📊 [Vaga Detalhe] Carregando candidatos...');
        candidatos = await dashboardClient.getVagaCandidates(vagaId);
        console.log('✅ [Vaga Detalhe] Candidatos carregados:', candidatos);
    } catch (error) {
        console.warn('⚠️ [Vaga Detalhe] Usando fallback para candidatos');
        candidatos = FALLBACK_DATA.candidatos;
    }

    // Gerar filtros de match
    generateMatchFilters(candidatos);
    
    // Popular tabela
    populateCandidatosTable(candidatos);
}

// ============================
// GERAR FILTROS DE MATCH
// ============================
function generateMatchFilters(candidatos) {
    const filtrosDiv = document.getElementById('filtrosMatch');
    if (!filtrosDiv) return;

    // Definir ranges de matching
    const matchRanges = [
        { label: 'Tudo', min: 0, max: 100, class: 'primary' },
        { label: 'Baixo', min: 0, max: 35, class: 'danger' },
        { label: 'Médio', min: 36, max: 65, class: 'warning' },
        { label: 'Alto', min: 66, max: 85, class: 'info' },
        { label: 'Destaque', min: 86, max: 100, class: 'success' }
    ];

    filtrosDiv.innerHTML = '';

    matchRanges.forEach((range, index) => {
        const isActive = index === 0 ? 'active' : '';
        const button = document.createElement('button');
        button.className = `btn btn-sm btn-outline-${range.class} mr-2 mb-2 match-filter ${isActive}`;
        button.textContent = range.label;
        button.dataset.min = range.min;
        button.dataset.max = range.max;

        button.addEventListener('click', function() {
            // Remove active de todos os botões
            document.querySelectorAll('.match-filter').forEach(btn => {
                btn.classList.remove('active');
            });
            // Adiciona active ao clicado
            this.classList.add('active');

            // Filtrar tabela
            filterCandidatosTable(Number(this.dataset.min), Number(this.dataset.max));
        });

        filtrosDiv.appendChild(button);
    });
}

// ============================
// POPULAR TABELA DE CANDIDATOS
// ============================
function populateCandidatosTable(candidatos) {
    const tbody = document.getElementById('candidatosTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!candidatos || candidatos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3">Nenhum candidato encontrado</td></tr>';
        return;
    }

    candidatos.forEach(candidato => {
        const tr = document.createElement('tr');
        const matching = parseFloat(candidato.matching || candidato.matchScore || 0);

        // Definir cor do matching
        let matchingClass = 'text-danger';
        if (matching >= 86) matchingClass = 'text-success';
        else if (matching >= 66) matchingClass = 'text-info';
        else if (matching >= 36) matchingClass = 'text-warning';

        tr.innerHTML = `
            <td class="text-sm">${candidato.nome || candidato.name || 'N/A'}</td>
            <td class="text-sm">${candidato.contato || candidato.contact || 'N/A'}</td>
            <td class="text-sm">${candidato.periodo || candidato.period || 'N/A'}</td>
            <td class="text-sm">${candidato.localidade || candidato.location || 'N/A'}</td>
            <td class="text-sm">${candidato.gestor || candidato.manager || 'N/A'}</td>
            <td class="text-center text-sm font-weight-bold ${matchingClass}">${matching}%</td>
        `;

        // Armazenar matching como número no dataset
        tr.dataset.matching = matching;
        tbody.appendChild(tr);
    });

    // Aplicar filtro padrão "Tudo"
    filterCandidatosTable(0, 100);
}

// ============================
// FILTRAR TABELA DE CANDIDATOS
// ============================
function filterCandidatosTable(min, max) {
    const tbody = document.getElementById('candidatosTableBody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    let visibleCount = 0;
    let emptyMessageRow = tbody.querySelector('.no-results-message');

    rows.forEach(row => {
        if (row.classList.contains('no-results-message')) return;
        
        if (!row.dataset.matching) return;
        
        const matching = parseFloat(row.dataset.matching);
        
        if (matching >= min && matching <= max) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    // Remover mensagem de vazio anterior se existir
    if (emptyMessageRow) {
        emptyMessageRow.remove();
    }

    // Se nenhuma linha visível, mostrar mensagem
    if (visibleCount === 0) {
        const emptyRow = tbody.insertRow();
        emptyRow.classList.add('no-results-message');
        const cell = emptyRow.insertCell(0);
        cell.colSpan = 6;
        cell.className = 'text-center py-3';
        cell.textContent = 'Nenhum candidato nesta faixa de matching';
    }
}

// ============================
// CARREGAR RETENÇÃO
// ============================
async function loadRetencao(vagaId) {
    const canvas = document.getElementById('retencaoChart');
    if (!canvas) return;

    let retencaoData;
    
    try {
        console.log('📊 [Vaga Detalhe] Carregando dados de retenção...');
        retencaoData = await dashboardClient.getVagaRetention(vagaId);
        console.log('✅ [Vaga Detalhe] Retenção carregada:', retencaoData);
    } catch (error) {
        console.warn('⚠️ [Vaga Detalhe] Usando fallback para retenção');
        retencaoData = FALLBACK_DATA.retencao;
    }

    const labels = retencaoData.map(r => r.status || r.statusName);
    const valores = retencaoData.map(r => r.total || r.count);

    // Cores para retenção
    const retencaoColors = ['#7367f0', '#a29bfe', '#fd79a8'];
    const retencaoHoverColors = ['#6255d5', '#8a75e6', '#ff6b9d'];

    // Atualizar legenda
    const legendaDiv = document.getElementById('retencaoLegenda');
    if (legendaDiv) {
        legendaDiv.innerHTML = labels.map((label, i) => 
            `<span class="mr-3"><i class="fas fa-circle" style="color: ${retencaoColors[i]}"></i> ${label}</span>`
        ).join('');
    }

    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: retencaoColors,
                hoverBackgroundColor: retencaoHoverColors,
                hoverBorderColor: "rgba(234, 236, 244, 1)"
            }]
        },
        options: {
            maintainAspectRatio: false,
            tooltips: {
                backgroundColor: "rgb(255,255,255)",
                bodyFontColor: "#858796",
                borderColor: '#dddfeb',
                borderWidth: 1,
                xPadding: 15,
                yPadding: 15,
                displayColors: false,
                callbacks: {
                    label: (t, d) => `${d.labels[t.index]}: ${d.datasets[0].data[t.index]} candidatos`
                }
            },
            legend: { display: false },
            cutoutPercentage: 70
        }
    });
}

// ============================
// CARREGAR INFORMAÇÕES DA VAGA
// ============================
async function loadInfomacoes(vagaId, vagaData) {
    const infoDiv = document.getElementById('vagaInfo');
    if (!infoDiv) return;

    const html = `
        <div class="row">
            <div class="col-md-6">
                <p class="mb-2">
                    <strong>Nome da Vaga:</strong><br>
                    ${vagaData.nome || 'N/A'}
                </p>
            </div>
            <div class="col-md-6">
                <p class="mb-2">
                    <strong>Status:</strong><br>
                    <span class="badge badge-${vagaData.ativo ? 'success' : 'danger'}">
                        ${vagaData.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                </p>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6">
                <p class="mb-2">
                    <strong>Data de Abertura:</strong><br>
                    ${vagaData.dataAbertura || 'N/A'}
                </p>
            </div>
            <div class="col-md-6">
                <p class="mb-2">
                    <strong>Total de Candidatos:</strong><br>
                    <span class="text-primary font-weight-bold">${numberFormat(vagaData.totalCandidatos || 0)}</span>
                </p>
            </div>
        </div>
        <div class="row">
            <div class="col-md-12">
                <p class="mb-0">
                    <strong>Descrição:</strong><br>
                    ${vagaData.descricao || 'N/A'}
                </p>
            </div>
        </div>
    `;

    infoDiv.innerHTML = html;
}

// ============================
// INICIALIZAR
// ============================
document.addEventListener('DOMContentLoaded', async function() {
    // Aguardar Utils estar disponível
    const waitForUtils = () => {
        if (window.Utils && typeof window.Utils.normalizeLevelAccess === 'function') {
            loadVagaDetails();
        } else {
            setTimeout(waitForUtils, 50);
        }
    };
    
    waitForUtils();
});
