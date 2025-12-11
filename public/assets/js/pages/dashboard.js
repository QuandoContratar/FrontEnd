

/* ========================================
   DASHBOARD DE RECRUTAMENTO
   Gráficos e métricas para RH
   Integrado com API Backend Spring Boot
   ======================================== */

import { DashboardClient } from "../components/client.js";

// ============================
// CONFIGURAÇÕES GLOBAIS
// ============================
const dashboardClient = new DashboardClient();

// Configurações globais do Chart.js
Chart.defaults.global.defaultFontFamily = 'Nunito', '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#858796';

// Labels dos meses em português
const MESES_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

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

// ============================
// DADOS DE FALLBACK (quando API falha)
// ============================
const FALLBACK_DATA = {
    metrics: {
        totalVagas: 24,
        totalCandidatos: 156,
        vagasAbertas: 12,
        taxaConversao: 68.0
    },
    vagasMes: [
        { mes: 1, quantidade: 3 }, { mes: 2, quantidade: 5 }, { mes: 3, quantidade: 4 },
        { mes: 4, quantidade: 7 }, { mes: 5, quantidade: 6 }, { mes: 6, quantidade: 8 },
        { mes: 7, quantidade: 5 }, { mes: 8, quantidade: 9 }, { mes: 9, quantidade: 7 },
        { mes: 10, quantidade: 10 }, { mes: 11, quantidade: 8 }, { mes: 12, quantidade: 12 }
    ],
    statusVagas: [
        { status: "Aprovadas", quantidade: 12 },
        { status: "Abertas", quantidade: 8 },
        { status: "Em Análise", quantidade: 3 },
        { status: "Rejeitadas", quantidade: 1 }
    ],
    candidatosVaga: [
        { id: 1, titulo: "Desenvolvedor Full-Stack", totalCandidatos: 25 },
        { id: 2, titulo: "Analista de RH", totalCandidatos: 18 },
        { id: 3, titulo: "Gerente de Projetos", totalCandidatos: 12 },
        { id: 4, titulo: "Designer UX/UI", totalCandidatos: 15 },
        { id: 5, titulo: "Analista de Dados", totalCandidatos: 20 }
    ],
    tipoContrato: [
        { contrato: "CLT", total: 14 },
        { contrato: "PJ", total: 7 },
        { contrato: "Estágio", total: 3 }
    ],
    tempoPreenchimento: [
        { mes: 1, dias: 25 }, { mes: 2, dias: 22 }, { mes: 3, dias: 28 },
        { mes: 4, dias: 20 }, { mes: 5, dias: 18 }, { mes: 6, dias: 24 },
        { mes: 7, dias: 19 }, { mes: 8, dias: 21 }, { mes: 9, dias: 23 },
        { mes: 10, dias: 17 }, { mes: 11, dias: 20 }, { mes: 12, dias: 16 }
    ]
};

// ============================
// FUNÇÕES UTILITÁRIAS
// ============================
function numberFormat(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function showLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
}

// ============================
// MÉTRICAS DO TOPO
// ============================
async function loadMetrics() {
    showLoading('totalVagas');
    showLoading('totalCandidatos');
    showLoading('vagasAbertas');
    showLoading('taxaConversao');

    let data;
    try {
        console.log('📊 [Dashboard] Carregando métricas...');
        data = await dashboardClient.getMetrics();
        console.log('✅ [Dashboard] Métricas carregadas:', data);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Usando fallback para métricas:', error.message);
        data = FALLBACK_DATA.metrics;
    }

    document.getElementById("totalVagas").innerText = numberFormat(data.totalVagas);
    document.getElementById("totalCandidatos").innerText = numberFormat(data.totalCandidatos);
    document.getElementById("vagasAbertas").innerText = numberFormat(data.vagasAbertas);

    const conversion = data.taxaConversao.toFixed(1);
    document.getElementById("taxaConversao").innerText = `${conversion}%`;

    const progressBar = document.querySelector(".progress-bar.bg-info");
    if (progressBar) {
        progressBar.style.width = `${conversion}%`;
        progressBar.setAttribute('aria-valuenow', conversion);
    }
}

// ============================
// GRÁFICO - VAGAS POR MÊS
// ============================
async function loadVagasPorMes() {
    const canvas = document.getElementById("vagasPorMesChart");
    if (!canvas) return;

    let result;
    try {
        console.log('📊 [Dashboard] Carregando vagas por mês...');
        result = await dashboardClient.getVagasMes();
        console.log('✅ [Dashboard] Vagas por mês:', result);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Usando fallback para vagas por mês');
        result = FALLBACK_DATA.vagasMes;
    }

    const valores = Array(12).fill(0);
    result.forEach(item => {
        if (item.mes >= 1 && item.mes <= 12) {
            valores[item.mes - 1] = item.quantidade;
        }
    });

    const maxValue = Math.max(...valores, 5);

    new Chart(canvas, {
        type: 'line',
        data: {
            labels: MESES_LABELS,
            datasets: [{
                label: "Vagas Criadas",
                lineTension: 0.3,
                backgroundColor: "rgba(78, 115, 223, 0.05)",
                borderColor: COLORS.primary,
                pointRadius: 3,
                pointBackgroundColor: COLORS.primary,
                pointBorderColor: COLORS.primary,
                pointHoverRadius: 5,
                pointHoverBackgroundColor: COLORS.primary,
                pointHitRadius: 10,
                pointBorderWidth: 2,
                data: valores
            }]
        },
        options: {
            maintainAspectRatio: false,
            layout: { padding: { left: 10, right: 25, top: 25, bottom: 0 } },
            scales: {
                xAxes: [{ gridLines: { display: false, drawBorder: false }, ticks: { maxTicksLimit: 12 } }],
                yAxes: [{
                    ticks: { min: 0, max: Math.ceil(maxValue * 1.2), maxTicksLimit: 5, padding: 10 },
                    gridLines: { color: "rgb(234, 236, 244)", zeroLineColor: "rgb(234, 236, 244)", drawBorder: false, borderDash: [2] }
                }]
            },
            legend: { display: false },
            tooltips: {
                backgroundColor: "rgb(255,255,255)", bodyFontColor: "#858796",
                titleFontColor: '#6e707e', borderColor: '#dddfeb', borderWidth: 1,
                xPadding: 15, yPadding: 15, displayColors: false, mode: 'index',
                callbacks: { label: (t, c) => `${c.datasets[t.datasetIndex].label}: ${t.yLabel} vagas` }
            }
        }
    });
}

// ============================
// GRÁFICO - STATUS DAS VAGAS
// ============================

// Mapa de normalização de status das vagas
const STATUS_NORMALIZATION = {
    'pendente_aprovacao': 'Pendente Aprovação',
    'pendente aprovacao': 'Pendente Aprovação',
    'pendente aprovação': 'Pendente Aprovação',
    'PENDENTE_APROVACAO': 'Pendente Aprovação',
    'aberta': 'Aberta/Aprovada',
    'aprovada': 'Aberta/Aprovada',
    'ABERTA': 'Aberta/Aprovada',
    'APROVADA': 'Aberta/Aprovada',
    'rejeitada': 'Rejeitada',
    'REJEITADA': 'Rejeitada'
};

// Status permitidos (excluir concluída, cancelada, etc)
const ALLOWED_STATUS = ['aberta', 'aprovada', 'pendente_aprovacao', 'pendente aprovacao', 'pendente aprovação', 'rejeitada'];

let statusVagasChartInstance = null;

async function loadStatusVagas() {
    const canvas = document.getElementById("statusVagasChart");
    if (!canvas) return;

    let result;
    try {
        console.log('📊 [Dashboard] Carregando status das vagas...');
        result = await dashboardClient.getStatusVagas();
        console.log('✅ [Dashboard] Status das vagas (raw):', result);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Usando fallback para status das vagas');
        result = FALLBACK_DATA.statusVagas;
    }

    // Destruir gráfico anterior se existir
    if (statusVagasChartInstance) {
        statusVagasChartInstance.destroy();
        statusVagasChartInstance = null;
    }

    // Filtrar apenas status permitidos e normalizar
    const filteredResult = result.filter(r => {
        const statusLower = (r.status || '').toLowerCase().trim();
        return ALLOWED_STATUS.some(allowed => statusLower.includes(allowed.replace('_', ' ')) || statusLower.includes(allowed));
    });

    // Agrupar status normalizados (unificar pendente_aprovacao variantes e aberta/aprovada)
    const groupedData = {};
    filteredResult.forEach(r => {
        const statusLower = (r.status || '').toLowerCase().trim();
        const normalizedStatus = STATUS_NORMALIZATION[statusLower] || STATUS_NORMALIZATION[r.status] || r.status;
        
        if (!groupedData[normalizedStatus]) {
            groupedData[normalizedStatus] = 0;
        }
        groupedData[normalizedStatus] += Number(r.quantidade || r.total || r.count || 0);
    });

    const labels = Object.keys(groupedData);
    const valores = Object.values(groupedData);

    console.log('📊 [Dashboard] Status das vagas (normalizado):', { labels, valores });

    // Cores para cada status (ordem: Aberta/Aprovada, Pendente, Rejeitada)
    const statusColors = {
        'Aberta/Aprovada': COLORS.success,
        'Pendente Aprovação': COLORS.warning,
        'Rejeitada': COLORS.danger
    };
    const statusHoverColors = {
        'Aberta/Aprovada': COLORS.successHover,
        'Pendente Aprovação': '#dda20a',
        'Rejeitada': '#c0392b'
    };

    const bgColors = labels.map(l => statusColors[l] || COLORS.info);
    const hoverColors = labels.map(l => statusHoverColors[l] || COLORS.infoHover);

    statusVagasChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: bgColors,
                hoverBackgroundColor: hoverColors,
                hoverBorderColor: "rgba(234, 236, 244, 1)"
            }]
        },
        options: {
            maintainAspectRatio: false,
            tooltips: {
                backgroundColor: "rgb(255,255,255)", bodyFontColor: "#858796",
                borderColor: '#dddfeb', borderWidth: 1, xPadding: 15, yPadding: 15, displayColors: false,
                callbacks: { label: (t, d) => `${d.labels[t.index]}: ${d.datasets[0].data[t.index]} vagas` }
            },
            legend: { display: false },
            cutoutPercentage: 80
        }
    });
}

// ============================
// GRÁFICO - CANDIDATOS POR VAGA
// ============================
let candidatosPorVagaChartInstance = null;

async function loadCandidatosVaga() {
    const canvas = document.getElementById("candidatosPorVagaChart");
    if (!canvas) return;

    let result;
    try {
        console.log('📊 [Dashboard] Carregando vagas por área:', selectedArea);
        // Usar o novo endpoint de recrutamento
        result = await dashboardClient.getVagasByArea(selectedArea);
        console.log('✅ [Dashboard] Vagas da área:', result);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Erro ao carregar vagas por área, tentando fallback...');
        try {
            // Fallback para o endpoint antigo
            result = await dashboardClient.getCandidatosPorVaga(selectedArea);
        } catch (e) {
            result = FALLBACK_DATA.candidatosVaga;
        }
    }

    // Destruir gráfico anterior se existir
    if (candidatosPorVagaChartInstance) {
        candidatosPorVagaChartInstance.destroy();
        candidatosPorVagaChartInstance = null;
    }

    // Debug: mostrar estrutura dos dados recebidos
    console.log('🔍 [Dashboard] Estrutura dos dados recebidos:', JSON.stringify(result[0], null, 2));

    // Mapear dados - usar 'titulo' como campo principal (retornado pelo backend)
    const vagas = result.map(r => {
        // Priorizar 'titulo' que é o campo retornado pelo backend
        const nomeDaVaga = r.titulo
            ?? r.vaga 
            ?? r.nome 
            ?? r.name
            ?? r.position_job 
            ?? r.positionJob
            ?? r.title 
            ?? r.vacancy
            ?? r.vacancyName
            ?? r.vacancy_name
            ?? r.jobTitle
            ?? r.job_title
            ?? r.cargo
            ?? r.descricao
            ?? 'Vaga sem nome';
        
        console.log('📋 Vaga mapeada:', nomeDaVaga, '| Objeto:', r);
        return nomeDaVaga;
    });
    
    const valores = result.map(r => r.totalCandidatos || r.candidatesCount || r.total || r.count || 0);
    const maxValue = Math.max(...valores, 10);

    candidatosPorVagaChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: vagas,
            datasets: [{
                label: "Candidatos",
                backgroundColor: COLORS.primary,
                hoverBackgroundColor: COLORS.primaryHover,
                data: valores
            }]
        },
        options: {
            maintainAspectRatio: false,
            layout: { padding: { left: 10, right: 25, top: 25, bottom: 0 } },
            scales: {
                xAxes: [{ gridLines: { display: false, drawBorder: false }, ticks: { maxTicksLimit: 6, fontSize: 10 }, maxBarThickness: 25 }],
                yAxes: [{
                    ticks: { min: 0, max: Math.ceil(maxValue * 1.2), maxTicksLimit: 5, padding: 10 },
                    gridLines: { color: "rgb(234, 236, 244)", zeroLineColor: "rgb(234, 236, 244)", drawBorder: false, borderDash: [2] }
                }]
            },
            legend: { display: false },
            tooltips: {
                backgroundColor: "rgb(255,255,255)", bodyFontColor: "#858796",
                titleFontColor: '#6e707e', borderColor: '#dddfeb', borderWidth: 1,
                xPadding: 15, yPadding: 15, displayColors: false,
                callbacks: { label: (t, c) => `${c.datasets[t.datasetIndex].label}: ${t.yLabel} candidatos` }
            },
            // Adicionar evento de clique no gráfico
            onClick: function(evt, elements) {
                if (elements && elements.length > 0) {
                    const index = elements[0]._index;
                    const vagaData = result[index];
                    if (vagaData) {
                        const vagaId = vagaData.id || vagaData.vagaId;
                        // Extrair título da vaga para passar na URL
                        const vagaTitulo = vagaData.titulo ?? vagaData.position_job ?? vagaData.nome ?? '';
                        if (vagaId) {
                            const params = new URLSearchParams({ id: vagaId });
                            if (vagaTitulo) params.append('titulo', vagaTitulo);
                            window.location.href = `vaga-detalhe.html?${params.toString()}`;
                        }
                    }
                }
            }
        }
    });

    // Carregar tabela de vagas
    loadVagasTable(result);
}

// ============================
// TABELA - VAGAS (Lista lateral)
// ============================
async function loadVagasTable(vagasData = null) {
    const tbody = document.getElementById("vagasTableBody");
    if (!tbody) return;

    let result = vagasData;
    
    // Se não recebeu dados, buscar da API
    if (!result) {
        try {
            console.log('📊 [Dashboard] Carregando tabela de vagas para área:', selectedArea);
            result = await dashboardClient.getVagasByArea(selectedArea);
            console.log('✅ [Dashboard] Vagas para tabela:', result);
        } catch (error) {
            console.warn('⚠️ [Dashboard] Erro ao carregar vagas, tentando fallback...');
            try {
                result = await dashboardClient.getCandidatosPorVaga(selectedArea);
            } catch (e) {
                result = FALLBACK_DATA.candidatosVaga;
            }
        }
    }

    // Ordenar por total de candidatos (decrescente)
    result.sort((a, b) => {
        const totalA = a.totalCandidatos || a.candidatesCount || a.total || 0;
        const totalB = b.totalCandidatos || b.candidatesCount || b.total || 0;
        return totalB - totalA;
    });

    // Limpar linhas existentes
    tbody.innerHTML = '';

    // Se não houver vagas
    if (!result || result.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="text-center py-3">Nenhuma vaga encontrada para esta área</td></tr>';
        return;
    }

    // Adicionar linhas
    result.forEach(vaga => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.className = 'vaga-row';
        
        // Priorizar 'titulo' que é o campo retornado pelo backend
        const vagaNome = vaga.titulo
            ?? vaga.vaga 
            ?? vaga.nome 
            ?? vaga.name
            ?? vaga.position_job 
            ?? vaga.positionJob
            ?? vaga.title 
            ?? vaga.vacancy
            ?? vaga.vacancyName
            ?? vaga.vacancy_name
            ?? vaga.jobTitle
            ?? vaga.job_title
            ?? vaga.cargo
            ?? vaga.descricao
            ?? 'Vaga sem nome';
        const totalCandidatos = vaga.totalCandidatos || vaga.candidatesCount || vaga.total || vaga.count || 0;
        
        tr.innerHTML = `
            <td class="text-sm">${vagaNome}</td>
            <td class="text-right text-sm font-weight-bold text-primary">${totalCandidatos}</td>
        `;
        
        // Adicionar clique para redirecionar para a Tela 2
        tr.addEventListener('click', function() {
            const vagaId = vaga.id || vaga.vagaId;
            if (vagaId) {
                // Navegar para a tela de detalhes da vaga com ID e título
                const params = new URLSearchParams({ id: vagaId });
                if (vagaNome && vagaNome !== 'Vaga sem nome') {
                    params.append('titulo', vagaNome);
                }
                window.location.href = `vaga-detalhe.html?${params.toString()}`;
            } else {
                // Se não tiver ID, usar o nome como fallback
                const vagaNomeEncoded = encodeURIComponent(vagaNome);
                window.location.href = `vaga-detalhe.html?nome=${vagaNomeEncoded}`;
            }
        });
        
        // Efeito hover
        tr.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f8f9fc';
        });
        tr.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
        
        tbody.appendChild(tr);
    });
}

// ============================
// GRÁFICO - TIPO DE CONTRATO
// ============================
async function loadTipoContrato() {
    const canvas = document.getElementById("tipoContratoChart");
    if (!canvas) return;

    let result;
    try {
        console.log('📊 [Dashboard] Carregando tipo de contrato...');
        result = await dashboardClient.getTipoContrato();
        console.log('✅ [Dashboard] Tipo de contrato:', result);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Usando fallback para tipo de contrato');
        result = FALLBACK_DATA.tipoContrato;
    }

    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: result.map(r => r.contrato),
            datasets: [{
                data: result.map(r => r.total),
                backgroundColor: [COLORS.primary, COLORS.success, COLORS.info],
                hoverBackgroundColor: [COLORS.primaryHover, COLORS.successHover, COLORS.infoHover],
                hoverBorderColor: "rgba(234, 236, 244, 1)"
            }]
        },
        options: {
            maintainAspectRatio: false,
            tooltips: {
                backgroundColor: "rgb(255,255,255)", bodyFontColor: "#858796",
                borderColor: '#dddfeb', borderWidth: 1, xPadding: 15, yPadding: 15, displayColors: false,
                callbacks: { label: (t, d) => `${d.labels[t.index]}: ${d.datasets[0].data[t.index]} vagas` }
            },
            legend: { display: false },
            cutoutPercentage: 80
        }
    });
}

// ============================
// GRÁFICO - TEMPO DE PREENCHIMENTO
// ============================
async function loadTempoPreenchimento() {
    const canvas = document.getElementById("tempoPreenchimentoChart");
    if (!canvas) return;

    let result;
    try {
        console.log('📊 [Dashboard] Carregando tempo de preenchimento...');
        result = await dashboardClient.getTempoPreenchimento();
        console.log('✅ [Dashboard] Tempo de preenchimento:', result);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Usando fallback para tempo de preenchimento');
        result = FALLBACK_DATA.tempoPreenchimento;
    }

    const valores = Array(12).fill(0);
    result.forEach(item => {
        if (item.mes >= 1 && item.mes <= 12) {
            valores[item.mes - 1] = item.dias;
        }
    });

    const maxValue = Math.max(...valores, 20);

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: MESES_LABELS,
            datasets: [{
                label: "Tempo Médio (dias)",
                backgroundColor: COLORS.success,
                hoverBackgroundColor: COLORS.successHover,
                data: valores
            }]
        },
        options: {
            maintainAspectRatio: false,
            layout: { padding: { left: 10, right: 25, top: 25, bottom: 0 } },
            scales: {
                xAxes: [{ gridLines: { display: false, drawBorder: false }, ticks: { maxTicksLimit: 12 }, maxBarThickness: 25 }],
                yAxes: [{
                    ticks: { min: 0, max: Math.ceil(maxValue * 1.2), maxTicksLimit: 7, padding: 10, callback: v => `${v} dias` },
                    gridLines: { color: "rgb(234, 236, 244)", zeroLineColor: "rgb(234, 236, 244)", drawBorder: false, borderDash: [2] }
                }]
            },
            legend: { display: false },
            tooltips: {
                backgroundColor: "rgb(255,255,255)", bodyFontColor: "#858796",
                titleFontColor: '#6e707e', borderColor: '#dddfeb', borderWidth: 1,
                xPadding: 15, yPadding: 15, displayColors: false,
                callbacks: { label: (t, c) => `${c.datasets[t.datasetIndex].label}: ${t.yLabel} dias` }
            }
        }
    });
}

// ========================================
// NOVOS GRÁFICOS - Dashboard Avançado
// ========================================

// ============================
// GRÁFICO - CANDIDATOS POR ESTADO
// ============================
let candidatesByStateChartInstance = null;

async function loadCandidatesByState() {
    const canvas = document.getElementById("candidatesByStateChart");
    if (!canvas) return;

    let result;
    try {
        console.log('📊 [Dashboard] Carregando candidatos por estado...');
        result = await dashboardClient.getCandidatesByState();
        console.log('✅ [Dashboard] Candidatos por estado:', result);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Usando fallback para candidatos por estado');
        result = [
            { state: 'SP', total: 45 },
            { state: 'RJ', total: 28 },
            { state: 'MG', total: 22 },
            { state: 'PR', total: 15 },
            { state: 'RS', total: 12 },
            { state: 'BA', total: 10 },
            { state: 'SC', total: 8 },
            { state: 'PE', total: 6 }
        ];
    }

    // Campos do backend: state, total (aceita também count/quantidade)
    const labels = result.map(r => r.state || r.estado);
    const valores = result.map(r => r.total || r.count || r.quantidade);
    const maxValue = Math.max(...valores, 10);

    // Destruir gráfico anterior se existir
    if (candidatesByStateChartInstance) {
        candidatesByStateChartInstance.destroy();
    }

    // Gradiente de cores
    const bgColors = valores.map((_, i) => {
        const alpha = 1 - (i * 0.08);
        return `rgba(78, 115, 223, ${alpha})`;
    });

    candidatesByStateChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: "Candidatos",
                backgroundColor: bgColors,
                hoverBackgroundColor: COLORS.primaryHover,
                data: valores,
                maxBarThickness: 40
            }]
        },
        options: {
            maintainAspectRatio: false,
            layout: { padding: { left: 10, right: 25, top: 25, bottom: 0 } },
            scales: {
                xAxes: [{ gridLines: { display: false, drawBorder: false }, ticks: { fontSize: 11 } }],
                yAxes: [{
                    ticks: { min: 0, max: Math.ceil(maxValue * 1.2), maxTicksLimit: 5, padding: 10 },
                    gridLines: { color: "rgb(234, 236, 244)", zeroLineColor: "rgb(234, 236, 244)", drawBorder: false, borderDash: [2] }
                }]
            },
            legend: { display: false },
            tooltips: {
                backgroundColor: "rgb(255,255,255)", bodyFontColor: "#858796",
                titleFontColor: '#6e707e', borderColor: '#dddfeb', borderWidth: 1,
                xPadding: 15, yPadding: 15, displayColors: false,
                callbacks: { label: (t, c) => `${t.xLabel}: ${t.yLabel} candidatos` }
            }
        }
    });
}

// ============================
// GRÁFICO - DISTRIBUIÇÃO DE MATCH
// ============================
async function loadMatchDistribution() {
    const canvas = document.getElementById("matchDistributionChart");
    if (!canvas) return;

    let result;
    try {
        console.log('📊 [Dashboard] Carregando distribuição de match...');
        result = await dashboardClient.getMatchDistribution();
        console.log('✅ [Dashboard] Distribuição de match:', result);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Usando fallback para distribuição de match');
        result = [
            { matchLevel: 'DESTAQUE', total: 15 },
            { matchLevel: 'ALTO', total: 35 },
            { matchLevel: 'MEDIO', total: 45 },
            { matchLevel: 'BAIXO', total: 10 }
        ];
    }

    const matchColors = ['#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'];
    const matchHoverColors = ['#17a673', '#2c9faf', '#dda20a', '#c0392b', '#6c757d'];

    // Campos do backend: matchLevel, total
    const labels = result.map(r => r.matchLevel || r.range || r.faixa);
    const valores = result.map(r => r.total || r.count || r.quantidade);

    // Atualizar legenda dinamicamente
    const legendContainer = document.getElementById('matchDistributionLegend');
    if (legendContainer) {
        legendContainer.innerHTML = labels.map((label, i) => 
            `<span class="mr-2"><i class="fas fa-circle" style="color: ${matchColors[i]}"></i> ${label}</span>`
        ).join('');
    }

    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: matchColors,
                hoverBackgroundColor: matchHoverColors,
                hoverBorderColor: "rgba(234, 236, 244, 1)"
            }]
        },
        options: {
            maintainAspectRatio: false,
            tooltips: {
                backgroundColor: "rgb(255,255,255)", bodyFontColor: "#858796",
                borderColor: '#dddfeb', borderWidth: 1, xPadding: 15, yPadding: 15, displayColors: false,
                callbacks: { label: (t, d) => `${d.labels[t.index]}: ${d.datasets[0].data[t.index]} candidatos` }
            },
            legend: { display: false },
            cutoutPercentage: 70
        }
    });
}

// ============================
// GRÁFICO - TOP 10 CANDIDATOS
// ============================
let topCandidatesChartInstance = null;

async function loadTopCandidates(vacancyId) {
    const canvas = document.getElementById("topCandidatesChart");
    const container = document.getElementById("topCandidatesChartContainer");
    const emptyState = document.getElementById("topCandidatesEmpty");
    
    if (!canvas) return;

    // Se não há vacancyId, mostrar estado vazio
    if (!vacancyId) {
        if (container) container.classList.add('d-none');
        if (emptyState) emptyState.classList.remove('d-none');
        return;
    }

    // Mostrar gráfico, esconder estado vazio
    if (container) container.classList.remove('d-none');
    if (emptyState) emptyState.classList.add('d-none');

    let result;
    try {
        console.log('📊 [Dashboard] Carregando top candidatos para vaga:', vacancyId);
        result = await dashboardClient.getTopCandidates(vacancyId);
        console.log('✅ [Dashboard] Top candidatos:', result);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Erro ao carregar top candidatos:', error);
        result = [];
    }

    // Destruir gráfico anterior se existir
    if (topCandidatesChartInstance) {
        topCandidatesChartInstance.destroy();
        topCandidatesChartInstance = null;
    }

    // Se não houver candidatos, mostrar mensagem
    if (!result || result.length === 0) {
        if (container) container.classList.add('d-none');
        if (emptyState) {
            emptyState.classList.remove('d-none');
            emptyState.innerHTML = `
                <i class="fas fa-user-slash fa-3x text-gray-300 mb-3"></i>
                <p class="text-gray-500">Nenhum candidato encontrado para esta vaga.</p>
            `;
        }
        return;
    }

    const labels = result.map(r => r.candidateName || r.nome || r.name);
    const valores = result.map(r => r.matchScore || r.score || 0);

    // Cores baseadas no score
    const bgColors = valores.map(score => {
        if (score >= 90) return '#1cc88a';
        if (score >= 70) return '#36b9cc';
        if (score >= 50) return '#f6c23e';
        return '#e74a3b';
    });

    topCandidatesChartInstance = new Chart(canvas, {
        type: 'horizontalBar',
        data: {
            labels: labels,
            datasets: [{
                label: "Score de Match (%)",
                backgroundColor: bgColors,
                hoverBackgroundColor: bgColors.map(c => c === '#1cc88a' ? '#17a673' : c === '#36b9cc' ? '#2c9faf' : c === '#f6c23e' ? '#dda20a' : '#c0392b'),
                data: valores,
                barThickness: 20
            }]
        },
        options: {
            maintainAspectRatio: false,
            layout: { padding: { left: 10, right: 25, top: 25, bottom: 0 } },
            scales: {
                xAxes: [{
                    ticks: { min: 0, max: 100, maxTicksLimit: 5, callback: v => `${v}%` },
                    gridLines: { color: "rgb(234, 236, 244)", zeroLineColor: "rgb(234, 236, 244)", drawBorder: false, borderDash: [2] }
                }],
                yAxes: [{ gridLines: { display: false, drawBorder: false }, ticks: { fontSize: 11 } }]
            },
            legend: { display: false },
            tooltips: {
                backgroundColor: "rgb(255,255,255)", bodyFontColor: "#858796",
                titleFontColor: '#6e707e', borderColor: '#dddfeb', borderWidth: 1,
                xPadding: 15, yPadding: 15, displayColors: false,
                callbacks: { label: (t, c) => `Match: ${t.xLabel}%` }
            }
        }
    });
}

async function setupTopCandidatesSelect() {
    const select = document.getElementById('selectVagaTopCandidates');
    if (!select) return;

    try {
        const vagas = await dashboardClient.getVacanciesList();
        select.innerHTML = '<option value="">Selecione uma vaga...</option>';
        
        vagas.forEach(vaga => {
            const id = vaga.id || vaga.vacancyId || vaga.id_vacancy;
            // Prioridade: titulo -> position_job -> cargo -> area -> "Vaga #ID"
            const titulo = vaga.titulo ?? vaga.position_job ?? vaga.cargo ?? vaga.area ?? vaga.position ?? `Vaga #${id}`;
            select.innerHTML += `<option value="${id}">${titulo}</option>`;
        });
    } catch (error) {
        console.warn('⚠️ Erro ao carregar lista de vagas:', error);
    }

    select.addEventListener('change', function() {
        loadTopCandidates(this.value);
    });

    // Iniciar com estado vazio
    loadTopCandidates(null);
}

// ============================
// GRÁFICO - PIPELINE POR ESTÁGIO
// ============================
async function setupPipelineSelect() {
    const select = document.getElementById('selectVagaPipeline');
    if (!select) return;

    try {
        const vagas = await dashboardClient.getVacanciesList();
        select.innerHTML = '<option value="">Selecione uma vaga...</option>';
        
        vagas.forEach(vaga => {
            const id = vaga.id || vaga.vacancyId || vaga.id_vacancy;
            // Prioridade: titulo -> position_job -> cargo -> area -> "Vaga #ID"
            const titulo = vaga.titulo ?? vaga.position_job ?? vaga.cargo ?? vaga.area ?? vaga.position ?? `Vaga #${id}`;
            select.innerHTML += `<option value="${id}">${titulo}</option>`;
        });
    } catch (error) {
        console.warn('⚠️ Erro ao carregar lista de vagas para pipeline:', error);
    }

    select.addEventListener('change', function() {
        loadPipelineByStage(this.value || null);
    });

    // Iniciar com estado vazio (sem vaga selecionada)
    loadPipelineByStage(null);
}

async function loadPipelineByStage(vacancyId) {
    const canvas = document.getElementById("pipelineByStageChart");
    const container = document.getElementById("pipelineChartContainer");
    const emptyState = document.getElementById("pipelineEmptyState");
    
    if (!canvas) {
        console.warn('⚠️ [Dashboard] Canvas pipelineByStageChart não encontrado!');
        return;
    }

    // Se nenhuma vaga selecionada, mostrar estado vazio
    if (!vacancyId) {
        if (container) container.classList.add('d-none');
        if (emptyState) emptyState.classList.remove('d-none');
        return;
    }

    let result;
    try {
        console.log('📊 [Dashboard] Carregando pipeline por estágio para vaga:', vacancyId);
        result = await dashboardClient.getPipelineByStageByVacancy(vacancyId);
        console.log('✅ [Dashboard] Pipeline por estágio:', result);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Erro ao carregar pipeline por estágio:', error);
        result = [];
    }

    // Destruir gráfico anterior se existir
    if (window.pipelineChartInstance) {
        window.pipelineChartInstance.destroy();
        window.pipelineChartInstance = null;
    }

    // Se não houver dados, mostrar mensagem
    if (!result || result.length === 0) {
        if (container) container.classList.add('d-none');
        if (emptyState) {
            emptyState.classList.remove('d-none');
            emptyState.innerHTML = `
                <i class="fas fa-inbox fa-3x text-gray-300 mb-3"></i>
                <p class="text-gray-500">Nenhum candidato encontrado no pipeline desta vaga.</p>
            `;
        }
        return;
    }

    // Mostrar gráfico, ocultar estado vazio
    if (container) container.classList.remove('d-none');
    if (emptyState) emptyState.classList.add('d-none');

    // Usar o mapa de nomes amigáveis STAGE_LABELS
    const labels = result.map(r => {
        const stageName = r.stageName || r.stage || r.estagio || 'N/A';
        return STAGE_LABELS[stageName] || stageName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    });
    const valores = result.map(r => Number(r.total || r.count || r.quantidade || 0));

    console.log('📊 Pipeline por estágio - labels:', labels);
    console.log('📊 Pipeline por estágio - valores:', valores);

    // Cores para funil (degradê)
    const funnelColors = ['#4e73df', '#36b9cc', '#1cc88a', '#f6c23e', '#e74a3b', '#5a5c69', '#858796', '#6610f2'];

    window.pipelineChartInstance = new Chart(canvas, {
        type: 'horizontalBar',
        data: {
            labels: labels,
            datasets: [{
                label: "Candidatos",
                backgroundColor: funnelColors.slice(0, labels.length),
                hoverBackgroundColor: funnelColors.slice(0, labels.length).map(c => c + 'dd'),
                data: valores,
                barThickness: 25
            }]
        },
        options: {
            maintainAspectRatio: false,
            layout: { padding: { left: 10, right: 25, top: 25, bottom: 0 } },
            scales: {
                xAxes: [{
                    ticks: { min: 0, maxTicksLimit: 5, padding: 10 },
                    gridLines: { color: "rgb(234, 236, 244)", zeroLineColor: "rgb(234, 236, 244)", drawBorder: false, borderDash: [2] }
                }],
                yAxes: [{ gridLines: { display: false, drawBorder: false }, ticks: { fontSize: 11 } }]
            },
            legend: { display: false },
            tooltips: {
                backgroundColor: "rgb(255,255,255)", bodyFontColor: "#858796",
                titleFontColor: '#6e707e', borderColor: '#dddfeb', borderWidth: 1,
                xPadding: 15, yPadding: 15, displayColors: false,
                callbacks: { label: (t, c) => `${t.yLabel}: ${t.xLabel} candidatos` }
            }
        }
    });
    
    console.log('✅ [Dashboard] Gráfico pipeline por estágio criado com sucesso!');
}

// ============================
// GRÁFICO - TEMPO MÉDIO POR ESTÁGIO
// ============================

// Mapa de nomes amigáveis para os estágios
const STAGE_LABELS = {
    aguardando_triagem: "Aguardando Triagem",
    triagem_inicial: "Triagem Inicial",
    avaliacao_fit_cultural: "Avaliação Fit Cultural",
    teste_tecnico: "Teste Técnico",
    entrevista_tecnica: "Entrevista Técnica",
    entrevista_final: "Entrevista Final",
    proposta_fechamento: "Proposta",
    proposta: "Proposta",
    contratacao: "Contratação",
    contratado: "Contratado"
};

async function loadAvgTimeByStage() {
    const canvas = document.getElementById("avgTimeByStageChart");
    if (!canvas) {
        console.warn('⚠️ [Dashboard] Canvas avgTimeByStageChart não encontrado!');
        return;
    }

    let result;
    try {
        console.log('📊 [Dashboard] Carregando tempo médio por estágio...');
        result = await dashboardClient.getAvgTimeByStage();
        console.log('✅ [Dashboard] Tempo médio por estágio (raw):', result);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Usando fallback para tempo médio por estágio:', error);
        result = [
            { stageName: 'aguardando_triagem', avgDays: 3 },
            { stageName: 'triagem_inicial', avgDays: 5 },
            { stageName: 'avaliacao_fit_cultural', avgDays: 7 },
            { stageName: 'entrevista_tecnica', avgDays: 4 },
            { stageName: 'proposta', avgDays: 3 },
            { stageName: 'contratado', avgDays: 5 }
        ];
    }

    // Destruir gráfico anterior se existir
    if (window.avgTimeChartInstance) {
        window.avgTimeChartInstance.destroy();
        window.avgTimeChartInstance = null;
    }

    // Normalizar campos do backend: stageName/stage/nome, avgDays/media/dias
    const labels = result.map(r => r.stageName || r.stage || r.nome || 'N/A');
    
    // Converter para nomes amigáveis
    const friendlyLabels = labels.map(l => STAGE_LABELS[l] || l.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
    
    // Garantir que todos os valores são números
    const valores = result.map(r => Number(r.avgDays || r.media || r.dias || 0));
    
    // Validar se há dados reais
    if (valores.every(v => v === 0)) {
        console.warn('⚠️ [Dashboard] Nenhum dado real para tempo médio por estágio. Exibindo gráfico vazio.');
    }
    
    const maxValue = Math.max(...valores, 10);

    // Log antes de desenhar para debug
    console.log('📊 Tempo médio por estágio - labels:', friendlyLabels);
    console.log('📊 Tempo médio por estágio - valores:', valores);

    window.avgTimeChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: friendlyLabels,
            datasets: [{
                label: "Dias",
                backgroundColor: COLORS.info,
                hoverBackgroundColor: COLORS.infoHover,
                data: valores,
                barThickness: 25,
                maxBarThickness: 35
            }]
        },
        options: {
            maintainAspectRatio: false,
            layout: { padding: { left: 10, right: 25, top: 25, bottom: 0 } },
            scales: {
                xAxes: [{ 
                    gridLines: { display: false, drawBorder: false }, 
                    ticks: { fontSize: 10 }
                }],
                yAxes: [{
                    ticks: { min: 0, max: Math.ceil(maxValue * 1.3), maxTicksLimit: 5, padding: 10, callback: v => `${v}d` },
                    gridLines: { color: "rgb(234, 236, 244)", zeroLineColor: "rgb(234, 236, 244)", drawBorder: false, borderDash: [2] }
                }]
            },
            legend: { display: false },
            tooltips: {
                backgroundColor: "rgb(255,255,255)", bodyFontColor: "#858796",
                titleFontColor: '#6e707e', borderColor: '#dddfeb', borderWidth: 1,
                xPadding: 15, yPadding: 15, displayColors: false,
                callbacks: { label: (t, c) => `${t.xLabel}: ${t.yLabel} dias em média` }
            }
        }
    });
    
    console.log('✅ [Dashboard] Gráfico tempo médio por estágio criado com sucesso!');
}

// ========================================
// NOVOS GRÁFICOS - INSIGHTS AVANÇADOS
// ========================================

// ============================
// GRÁFICO - HARD SKILLS (Barras Horizontais + Cloud)
// ============================
let hardSkillsChartInstance = null;

async function loadHardSkills() {
    const canvas = document.getElementById("hardSkillsChart");
    const cloudContainer = document.getElementById("hardSkillsCloud");
    if (!canvas) return;

    let result;
    try {
        console.log('📊 [Dashboard] Carregando Hard Skills...');
        result = await dashboardClient.getHardSkills();
        console.log('✅ [Dashboard] Hard Skills:', result);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Usando fallback para Hard Skills');
        result = [
            { skill: "Java", total: 45 },
            { skill: "Python", total: 38 },
            { skill: "SQL", total: 35 },
            { skill: "JavaScript", total: 32 },
            { skill: "React", total: 28 },
            { skill: "Spring Boot", total: 25 },
            { skill: "AWS", total: 22 },
            { skill: "Docker", total: 18 },
            { skill: "Git", total: 15 },
            { skill: "Kubernetes", total: 12 }
        ];
    }

    // Destruir gráfico anterior
    if (hardSkillsChartInstance) {
        hardSkillsChartInstance.destroy();
        hardSkillsChartInstance = null;
    }

    // Ordenar por total (descendente) e pegar top 10
    const sortedData = result.sort((a, b) => (b.total || 0) - (a.total || 0)).slice(0, 10);
    const labels = sortedData.map(r => r.skill || r.name);
    const valores = sortedData.map(r => r.total || r.count || 0);
    const maxValue = Math.max(...valores, 10);

    // Gerar cores em gradiente
    const bgColors = valores.map((_, i) => {
        const opacity = 1 - (i * 0.07);
        return `rgba(78, 115, 223, ${opacity})`;
    });

    hardSkillsChartInstance = new Chart(canvas, {
        type: 'horizontalBar',
        data: {
            labels: labels,
            datasets: [{
                label: "Candidatos",
                backgroundColor: bgColors,
                hoverBackgroundColor: COLORS.primaryHover,
                data: valores
            }]
        },
        options: {
            maintainAspectRatio: false,
            layout: { padding: { left: 10, right: 25, top: 10, bottom: 0 } },
            scales: {
                xAxes: [{
                    ticks: { min: 0, max: Math.ceil(maxValue * 1.1), maxTicksLimit: 5 },
                    gridLines: { color: "rgb(234, 236, 244)", zeroLineColor: "rgb(234, 236, 244)", drawBorder: false }
                }],
                yAxes: [{ gridLines: { display: false }, barPercentage: 0.6 }]
            },
            legend: { display: false },
            tooltips: {
                backgroundColor: "rgb(255,255,255)", bodyFontColor: "#858796",
                titleFontColor: '#6e707e', borderColor: '#dddfeb', borderWidth: 1,
                xPadding: 15, yPadding: 15, displayColors: false,
                callbacks: { label: (t, c) => `${t.xLabel} candidatos com esta skill` }
            }
        }
    });

    // Renderizar Tag Cloud
    if (cloudContainer) {
        renderSkillCloud(cloudContainer, sortedData, 'primary');
    }
}

// ============================
// GRÁFICO - SOFT SKILLS (Barras Horizontais + Cloud)
// ============================
let softSkillsChartInstance = null;

async function loadSoftSkills() {
    const canvas = document.getElementById("softSkillsChart");
    const cloudContainer = document.getElementById("softSkillsCloud");
    if (!canvas) return;

    let result;
    try {
        console.log('📊 [Dashboard] Carregando Soft Skills...');
        result = await dashboardClient.getSoftSkills();
        console.log('✅ [Dashboard] Soft Skills:', result);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Usando fallback para Soft Skills');
        result = [
            { softSkill: "Comunicação", total: 42 },
            { softSkill: "Trabalho em equipe", total: 38 },
            { softSkill: "Proatividade", total: 35 },
            { softSkill: "Liderança", total: 28 },
            { softSkill: "Resolução de problemas", total: 25 },
            { softSkill: "Adaptabilidade", total: 22 },
            { softSkill: "Criatividade", total: 18 },
            { softSkill: "Organização", total: 15 },
            { softSkill: "Empatia", total: 12 },
            { softSkill: "Pensamento crítico", total: 10 }
        ];
    }

    // Destruir gráfico anterior
    if (softSkillsChartInstance) {
        softSkillsChartInstance.destroy();
        softSkillsChartInstance = null;
    }

    // Ordenar por total (descendente) e pegar top 10
    const sortedData = result.sort((a, b) => (b.total || 0) - (a.total || 0)).slice(0, 10);
    const labels = sortedData.map(r => r.softSkill || r.skill || r.name);
    const valores = sortedData.map(r => r.total || r.count || 0);
    const maxValue = Math.max(...valores, 10);

    // Gerar cores em gradiente verde
    const bgColors = valores.map((_, i) => {
        const opacity = 1 - (i * 0.07);
        return `rgba(28, 200, 138, ${opacity})`;
    });

    softSkillsChartInstance = new Chart(canvas, {
        type: 'horizontalBar',
        data: {
            labels: labels,
            datasets: [{
                label: "Candidatos",
                backgroundColor: bgColors,
                hoverBackgroundColor: COLORS.successHover,
                data: valores
            }]
        },
        options: {
            maintainAspectRatio: false,
            layout: { padding: { left: 10, right: 25, top: 10, bottom: 0 } },
            scales: {
                xAxes: [{
                    ticks: { min: 0, max: Math.ceil(maxValue * 1.1), maxTicksLimit: 5 },
                    gridLines: { color: "rgb(234, 236, 244)", zeroLineColor: "rgb(234, 236, 244)", drawBorder: false }
                }],
                yAxes: [{ gridLines: { display: false }, barPercentage: 0.6 }]
            },
            legend: { display: false },
            tooltips: {
                backgroundColor: "rgb(255,255,255)", bodyFontColor: "#858796",
                titleFontColor: '#6e707e', borderColor: '#dddfeb', borderWidth: 1,
                xPadding: 15, yPadding: 15, displayColors: false,
                callbacks: { label: (t, c) => `${t.xLabel} candidatos com esta skill` }
            }
        }
    });

    // Renderizar Tag Cloud
    if (cloudContainer) {
        renderSkillCloud(cloudContainer, sortedData.map(s => ({ skill: s.softSkill || s.skill, total: s.total })), 'success');
    }
}

/**
 * Renderiza uma tag cloud de skills
 * @param {HTMLElement} container - Container para renderizar
 * @param {Array} data - Array de { skill, total }
 * @param {string} colorType - 'primary', 'success', 'info', etc
 */
function renderSkillCloud(container, data, colorType = 'primary') {
    if (!container || !data || data.length === 0) return;

    const maxTotal = Math.max(...data.map(d => d.total || 0));
    const minTotal = Math.min(...data.map(d => d.total || 0));
    
    // Calcular tamanho relativo (12px a 24px)
    const getSize = (total) => {
        if (maxTotal === minTotal) return 16;
        return 12 + ((total - minTotal) / (maxTotal - minTotal)) * 12;
    };

    const colorMap = {
        primary: ['#4e73df', '#2e59d9', '#1e3a8a'],
        success: ['#1cc88a', '#17a673', '#0d6e4f'],
        info: ['#36b9cc', '#2c9faf', '#1a5f6a'],
        warning: ['#f6c23e', '#dda20a', '#b38600'],
        danger: ['#e74a3b', '#c0392b', '#8b2500']
    };

    const colors = colorMap[colorType] || colorMap.primary;

    container.innerHTML = data.map((item, index) => {
        const size = getSize(item.total);
        const colorIndex = Math.min(Math.floor(index / 4), colors.length - 1);
        const skill = item.skill || item.softSkill || item.name;
        
        return `<span class="skill-tag" style="
            display: inline-block;
            padding: 4px 10px;
            margin: 3px;
            font-size: ${size}px;
            font-weight: ${size > 18 ? '600' : '400'};
            color: ${colors[colorIndex]};
            background: ${colors[colorIndex]}15;
            border-radius: 15px;
            cursor: default;
            transition: all 0.2s;
        " title="${item.total} candidatos">${skill}</span>`;
    }).join('');
}

// ============================
// GRÁFICO - CANDIDATOS POR ESTADO (Barras + Fallback para mapa)
// ============================
let candidatesByStateBarChartInstance = null;

async function loadCandidatesByStateAdvanced() {
    const canvas = document.getElementById("candidatesByStateBarChart");
    if (!canvas) return;

    let result;
    try {
        console.log('📊 [Dashboard] Carregando candidatos por estado (avançado)...');
        result = await dashboardClient.getCandidatesByState();
        console.log('✅ [Dashboard] Candidatos por estado:', result);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Usando fallback para candidatos por estado');
        result = [
            { state: "SP", total: 45 },
            { state: "RJ", total: 28 },
            { state: "MG", total: 18 },
            { state: "RS", total: 12 },
            { state: "PR", total: 10 },
            { state: "BA", total: 8 },
            { state: "SC", total: 7 },
            { state: "PE", total: 6 },
            { state: "GO", total: 5 },
            { state: "DF", total: 4 }
        ];
    }

    // Destruir gráfico anterior
    if (candidatesByStateBarChartInstance) {
        candidatesByStateBarChartInstance.destroy();
        candidatesByStateBarChartInstance = null;
    }

    // Ordenar por total (descendente)
    const sortedData = result.sort((a, b) => (b.total || 0) - (a.total || 0));
    const labels = sortedData.map(r => r.state || r.estado);
    const valores = sortedData.map(r => r.total || r.count || 0);
    const maxValue = Math.max(...valores, 10);

    // Cores em gradiente baseado no valor
    const bgColors = valores.map((val, i) => {
        const ratio = val / maxValue;
        if (ratio > 0.7) return COLORS.primary;
        if (ratio > 0.4) return COLORS.info;
        return COLORS.success;
    });

    candidatesByStateBarChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: "Candidatos",
                backgroundColor: bgColors,
                hoverBackgroundColor: COLORS.primaryHover,
                data: valores
            }]
        },
        options: {
            maintainAspectRatio: false,
            layout: { padding: { left: 10, right: 25, top: 25, bottom: 0 } },
            scales: {
                xAxes: [{ gridLines: { display: false, drawBorder: false }, maxBarThickness: 40 }],
                yAxes: [{
                    ticks: { min: 0, max: Math.ceil(maxValue * 1.2), maxTicksLimit: 5, padding: 10 },
                    gridLines: { color: "rgb(234, 236, 244)", zeroLineColor: "rgb(234, 236, 244)", drawBorder: false, borderDash: [2] }
                }]
            },
            legend: { display: false },
            tooltips: {
                backgroundColor: "rgb(255,255,255)", bodyFontColor: "#858796",
                titleFontColor: '#6e707e', borderColor: '#dddfeb', borderWidth: 1,
                xPadding: 15, yPadding: 15, displayColors: false,
                callbacks: { label: (t, c) => `${t.yLabel} candidatos em ${t.xLabel}` }
            }
        }
    });
}

// ============================
// RECOMENDAÇÃO DE VAGAS PARA CANDIDATO
// ============================
async function setupCandidateRecommendationSelect() {
    const select = document.getElementById('candidateRecommendationSelect');
    if (!select) return;

    try {
        console.log('📊 [Dashboard] Carregando lista de candidatos para recomendação...');
        const candidates = await dashboardClient.getCandidatesList();
        console.log('📊 [Dashboard] Candidatos recebidos:', candidates);
        
        // Log da estrutura do primeiro candidato para debug
        if (Array.isArray(candidates) && candidates.length > 0) {
            console.log('📊 [Dashboard] Estrutura do candidato:', Object.keys(candidates[0]), candidates[0]);
        }
        
        select.innerHTML = '<option value="">Selecione um candidato...</option>';
        
        if (Array.isArray(candidates)) {
            let addedCount = 0;
            candidates.forEach(c => {
                // Campo correto é idCandidate (vindo do backend)
                const id = c.idCandidate || c.id_candidate || c.candidateId || c.id;
                const name = c.name || c.nome || c.candidateName || `Candidato ${id}`;
                
                // Só adiciona se tiver ID válido
                if (id !== undefined && id !== null && id !== '') {
                    select.innerHTML += `<option value="${id}">${name}</option>`;
                    addedCount++;
                    if (addedCount >= 50) return; // Limita a 50 candidatos
                } else {
                    console.warn('⚠️ [Dashboard] Candidato sem ID válido:', c);
                }
            });
            console.log(`📊 [Dashboard] ${addedCount} candidatos adicionados ao select`);
        }

        select.addEventListener('change', async function() {
            const candidateId = this.value;
            if (candidateId && candidateId !== 'undefined' && candidateId !== '') {
                await loadVacancyRecommendation(candidateId);
            } else {
                clearRecommendationTable();
            }
        });
    } catch (error) {
        console.warn('⚠️ [Dashboard] Erro ao carregar candidatos:', error);
        select.innerHTML = '<option value="">Erro ao carregar candidatos</option>';
    }
}

async function loadVacancyRecommendation(candidateId) {
    const tbody = document.getElementById('vacancyRecommendationBody');
    if (!tbody) return;

    // Validação do candidateId
    if (!candidateId || candidateId === 'undefined' || candidateId === 'null' || candidateId === '') {
        console.error('❌ [Dashboard] candidateId inválido:', candidateId);
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-warning">Selecione um candidato válido</td></tr>';
        return;
    }

    tbody.innerHTML = '<tr><td colspan="3" class="text-center"><i class="fas fa-spinner fa-spin"></i> Carregando...</td></tr>';

    let result;
    try {
        console.log('📊 [Dashboard] Carregando recomendações para candidato:', candidateId);
        result = await dashboardClient.getVacancyRecommendation(candidateId);
        console.log('✅ [Dashboard] Recomendações:', result);
    } catch (error) {
        console.error('❌ [Dashboard] Erro ao carregar recomendações:', error);
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-danger">Erro ao carregar recomendações</td></tr>';
        return;
    }

    if (!result || result.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Nenhuma recomendação encontrada</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    result.slice(0, 5).forEach(rec => {
        const position = rec.position || rec.vaga || rec.job || 'Vaga não informada';
        const score = rec.score != null ? rec.score.toFixed(1) : 'N/A';
        const matchLevel = rec.matchLevel || rec.match_level || 'BAIXO';
        
        // Badge de match
        let badgeClass, badgeText;
        switch (matchLevel.toUpperCase()) {
            case 'DESTAQUE':
                badgeClass = 'badge-primary';
                badgeText = '⭐ Destaque';
                break;
            case 'ALTO':
                badgeClass = 'badge-success';
                badgeText = 'Alto';
                break;
            case 'MEDIO':
                badgeClass = 'badge-warning';
                badgeText = 'Médio';
                break;
            default:
                badgeClass = 'badge-secondary';
                badgeText = 'Baixo';
        }

        tbody.innerHTML += `
            <tr>
                <td><small>${position}</small></td>
                <td class="text-center"><strong>${score}%</strong></td>
                <td class="text-center"><span class="badge ${badgeClass}">${badgeText}</span></td>
            </tr>
        `;
    });
}

function clearRecommendationTable() {
    const tbody = document.getElementById('vacancyRecommendationBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted"><small>Selecione um candidato para ver as recomendações</small></td></tr>';
    }
}

// ============================
// GRÁFICO - TEMPO ATÉ PRIMEIRO CONTATO
// ============================
let firstContactChartInstance = null;

async function loadFirstContactTime() {
    const canvas = document.getElementById("firstContactChart");
    const avgBadge = document.getElementById("avgFirstContactDays");
    if (!canvas) return;

    let result;
    try {
        console.log('📊 [Dashboard] Carregando tempo até primeiro contato...');
        result = await dashboardClient.getFirstContactTime();
        console.log('✅ [Dashboard] Tempo primeiro contato:', result);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Usando fallback para tempo primeiro contato');
        result = [
            { candidateId: 1, candidateName: "João Silva", daysUntilContact: 2 },
            { candidateId: 2, candidateName: "Maria Santos", daysUntilContact: 3 },
            { candidateId: 3, candidateName: "Pedro Lima", daysUntilContact: 1 },
            { candidateId: 4, candidateName: "Ana Costa", daysUntilContact: 5 },
            { candidateId: 5, candidateName: "Carlos Oliveira", daysUntilContact: 4 },
            { candidateId: 6, candidateName: "Fernanda Souza", daysUntilContact: 2 },
            { candidateId: 7, candidateName: "Roberto Alves", daysUntilContact: 8 },
            { candidateId: 8, candidateName: "Juliana Pereira", daysUntilContact: 3 },
            { candidateId: 9, candidateName: "Marcelo Dias", daysUntilContact: 6 },
            { candidateId: 10, candidateName: "Camila Rocha", daysUntilContact: 1 }
        ];
    }

    // Destruir gráfico anterior
    if (firstContactChartInstance) {
        firstContactChartInstance.destroy();
        firstContactChartInstance = null;
    }

    if (!result || result.length === 0) {
        canvas.parentElement.innerHTML = '<p class="text-center text-muted">Sem dados disponíveis</p>';
        return;
    }

    // Calcular média
    const totalDays = result.reduce((sum, r) => sum + (r.daysUntilContact || 0), 0);
    const avgDays = (totalDays / result.length).toFixed(1);
    
    if (avgBadge) {
        avgBadge.textContent = `${avgDays} dias`;
        // Cor baseada na média
        avgBadge.className = 'badge';
        if (avgDays <= 3) avgBadge.classList.add('badge-success');
        else if (avgDays <= 7) avgBadge.classList.add('badge-warning');
        else avgBadge.classList.add('badge-danger');
    }

    // Preparar dados (últimos 15 candidatos)
    const recentData = result.slice(0, 15);
    const labels = recentData.map(r => r.candidateName || `Cand. ${r.candidateId}`);
    const valores = recentData.map(r => r.daysUntilContact || 0);

    // Cores baseadas no tempo
    const bgColors = valores.map(days => {
        if (days <= 3) return COLORS.success;
        if (days <= 7) return COLORS.warning;
        return COLORS.danger;
    });

    firstContactChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: "Dias até contato",
                backgroundColor: bgColors,
                hoverBackgroundColor: bgColors.map(c => c === COLORS.success ? COLORS.successHover : 
                    c === COLORS.warning ? '#dda20a' : '#c0392b'),
                data: valores,
                barPercentage: 0.7
            }]
        },
        options: {
            maintainAspectRatio: false,
            layout: { padding: { left: 10, right: 25, top: 25, bottom: 0 } },
            scales: {
                xAxes: [{ 
                    gridLines: { display: false, drawBorder: false }, 
                    ticks: { fontSize: 10, maxRotation: 45, minRotation: 45 } 
                }],
                yAxes: [{
                    ticks: { min: 0, maxTicksLimit: 5, padding: 10,
                        callback: (value) => value + ' dias'
                    },
                    gridLines: { color: "rgb(234, 236, 244)", zeroLineColor: "rgb(234, 236, 244)", drawBorder: false, borderDash: [2] }
                }]
            },
            legend: { display: false },
            tooltips: {
                backgroundColor: "rgb(255,255,255)", bodyFontColor: "#858796",
                titleFontColor: '#6e707e', borderColor: '#dddfeb', borderWidth: 1,
                xPadding: 15, yPadding: 15, displayColors: false,
                callbacks: { 
                    label: (t, c) => {
                        const days = t.yLabel;
                        let status = days <= 3 ? '(Ótimo)' : days <= 7 ? '(Aceitável)' : '(Crítico)';
                        return `${days} dias ${status}`;
                    }
                }
            }
        }
    });
}

// ============================
// TABELA - PERFORMANCE DOS GESTORES
// Nota: O backend deve filtrar apenas usuários com level_access = 'MANAGER'
// ============================
async function loadManagerPerformance() {
    const tbody = document.getElementById("managerPerformanceBody");
    if (!tbody) return;

    let result;
    try {
        console.log('📊 [Dashboard] Carregando performance dos gestores (apenas MANAGER)...');
        result = await dashboardClient.getManagerPerformance();
        console.log('✅ [Dashboard] Performance dos gestores (raw):', result);
        
        // FILTRO OBRIGATÓRIO: Apenas gestores com level_access = 'MANAGER'
        // Isso garante que RH e ADMIN não apareçam na tabela
        if (result && Array.isArray(result) && result.length > 0) {
            const originalCount = result.length;
            result = result.filter(m => {
                // Verifica vários campos possíveis onde o level_access pode estar
                const level = (m.levelAccess || m.level_access || m.accessLevel || m.role || '').toUpperCase().trim();
                const isManager = level === 'MANAGER' || level === 'GESTOR';
                
                if (!isManager) {
                    console.log(`🚫 [Dashboard] Excluindo ${m.managerName || m.nome}: level=${level}`);
                }
                
                return isManager;
            });
            console.log(`📊 [Dashboard] Filtro MANAGER: ${originalCount} → ${result.length} gestores`);
        }
    } catch (error) {
        console.warn('⚠️ [Dashboard] Usando fallback para performance dos gestores');
        result = [
            { managerId: 1, managerName: 'João Silva', totalVacancies: 12, approvedVacancies: 10, rejectedVacancies: 2, avgTimeDays: 25, levelAccess: 'MANAGER' },
            { managerId: 2, managerName: 'Maria Santos', totalVacancies: 8, approvedVacancies: 7, rejectedVacancies: 1, avgTimeDays: 22, levelAccess: 'MANAGER' },
            { managerId: 3, managerName: 'Carlos Oliveira', totalVacancies: 15, approvedVacancies: 11, rejectedVacancies: 4, avgTimeDays: 30, levelAccess: 'MANAGER' },
            { managerId: 4, managerName: 'Ana Costa', totalVacancies: 6, approvedVacancies: 6, rejectedVacancies: 0, avgTimeDays: 18, levelAccess: 'MANAGER' },
            { managerId: 5, managerName: 'Roberto Lima', totalVacancies: 10, approvedVacancies: 6, rejectedVacancies: 4, avgTimeDays: 35, levelAccess: 'MANAGER' }
        ];
    }

    tbody.innerHTML = '';

    result.forEach(manager => {
        // Campos do backend: managerId, managerName, totalVacancies, approvedVacancies, rejectedVacancies, avgTimeDays
        const nome = manager.managerName || manager.nome || manager.gestor;
        const criadas = manager.totalVacancies || manager.vacanciesCreated || manager.vagasCriadas || 0;
        const preenchidas = manager.approvedVacancies || manager.vacanciesFilled || manager.vagasPreenchidas || 0;
        const rejeitadas = manager.rejectedVacancies || 0;
        
        // Calcular taxa de sucesso: (approvedVacancies / totalVacancies) * 100
        const taxa = criadas > 0 ? (preenchidas / criadas) * 100 : 0;
        const tempo = manager.avgTimeDays || manager.tempoMedio || 0;
        
        // Determinar tendência baseado na taxa de sucesso
        let trend;
        if (taxa >= 80) trend = 'up';
        else if (taxa >= 50) trend = 'stable';
        else trend = 'down';

        // Badge de taxa de sucesso
        let taxaBadge;
        if (taxa >= 80) {
            taxaBadge = `<span class="badge badge-success">${taxa.toFixed(1)}%</span>`;
        } else if (taxa >= 60) {
            taxaBadge = `<span class="badge badge-warning">${taxa.toFixed(1)}%</span>`;
        } else {
            taxaBadge = `<span class="badge badge-danger">${taxa.toFixed(1)}%</span>`;
        }

        // Ícone de tendência
        let trendIcon;
        if (trend === 'up') {
            trendIcon = '<i class="fas fa-arrow-up text-success"></i>';
        } else if (trend === 'down') {
            trendIcon = '<i class="fas fa-arrow-down text-danger"></i>';
        } else {
            trendIcon = '<i class="fas fa-minus text-secondary"></i>';
        }

        tbody.innerHTML += `
            <tr>
                <td><strong>${nome}</strong></td>
                <td class="text-center">${criadas}</td>
                <td class="text-center">${preenchidas}</td>
                <td class="text-center">${taxaBadge}</td>
                <td class="text-center">${tempo} dias</td>
                <td class="text-center">${trendIcon}</td>
            </tr>
        `;
    });
}

// ============================
// INICIALIZAÇÃO
// ============================
async function initDashboard() {
    console.log('🚀 [Dashboard] Iniciando carregamento...');

    try {
        // Gráficos existentes - Primeira batch
        await Promise.all([
            loadMetrics(),
            loadVagasPorMes(),
            loadStatusVagas(),
            loadCandidatosVaga(),
            loadTipoContrato(),
            loadTempoPreenchimento()
        ]);

        // Gráficos intermediários
        await Promise.all([
            loadCandidatesByState(),
            loadMatchDistribution(),
            setupTopCandidatesSelect(),
            setupPipelineSelect(),
            loadAvgTimeByStage(),
            loadManagerPerformance()
        ]);

        // NOVOS GRÁFICOS - Insights Avançados
        await Promise.all([
            loadHardSkills(),
            loadSoftSkills(),
            loadCandidatesByStateAdvanced(),
            setupCandidateRecommendationSelect(),
            loadFirstContactTime()
        ]);

        console.log('✅ [Dashboard] Todos os gráficos carregados!');
    } catch (error) {
        console.error('❌ [Dashboard] Erro ao carregar:', error);
    }
}


// Variável global para armazenar a área selecionada
let selectedArea = 'TI';

// Filtro de área
function setupAreaFilter() {
    const filter = document.getElementById('areaFilter');
    if (filter) {
        // Setar valor padrão
        filter.value = selectedArea;
        
        filter.addEventListener('change', function() {
            selectedArea = this.value;
            console.log('🏢 Área selecionada:', selectedArea);
            // Recarregar todos os gráficos com a nova área
            reloadDashboardByArea();
        });
    }
}

// Função para recarregar dados filtrando pela área
async function reloadDashboardByArea() {
    console.log('🔄 Recarregando dashboard para a área:', selectedArea);
    
    // Recarregar todos os gráficos
    await loadCandidatosVaga();
    // Pode adicionar mais funções de recarga aqui conforme necessário
}

// Função para verificar permissão e inicializar dashboard
async function checkPermissionAndInit() {
    // Bloquear acesso para Gestores (MANAGER) — eles não podem ver os gráficos
    try {
        const isManager = (window.Permissions && typeof window.Permissions.isManager === 'function')
            ? window.Permissions.isManager()
            : (function(){
                try {
                    const u = localStorage.getItem('userLogged') || localStorage.getItem('currentUser');
                    if (!u) return false;
                    const parsed = JSON.parse(u);
                    if (window.Utils && typeof window.Utils.normalizeLevelAccess === 'function') {
                        return window.Utils.normalizeLevelAccess(parsed.levelAccess || parsed.level_access) === 'MANAGER';
                    }
                    const lvl = String(parsed.levelAccess || parsed.level_access || '').toUpperCase();
                    return lvl === 'MANAGER' || lvl === '3';
                } catch (e) { return false; }
            })();

        if (isManager) {
            // Mostrar mensagem informando que o gestor não tem permissão
            document.addEventListener('DOMContentLoaded', () => {
                const mainContainer = document.querySelector('.container-fluid') || document.querySelector('.container') || document.body;
                if (mainContainer) {
                    mainContainer.innerHTML = `\n                        <div class="container mt-5">\n                            <div class="alert alert-danger" role="alert">\n                                Acesso negado: gestores não têm permissão para visualizar os gráficos.\n                            </div>\n                        </div>\n                    `;
                }
            });
            return; // não inicializa os gráficos
        }
    } catch (e) {
        console.warn('Erro ao verificar permissão no dashboard:', e);
    }

    // Para outros perfis, inicializa normalmente
    setupAreaFilter();
    await initDashboard();
}

document.addEventListener("DOMContentLoaded", async function() {
    // Aguardar Utils estar disponível antes de verificar permissões
    const waitForUtils = () => {
        if (window.Utils && typeof window.Utils.normalizeLevelAccess === 'function') {
            checkPermissionAndInit();
        } else {
            // Tentar novamente após um pequeno delay
            setTimeout(waitForUtils, 50);
        }
    };
    
    // Iniciar verificação
    waitForUtils();
});
