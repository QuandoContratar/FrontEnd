

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
        { vaga: "Desenvolvedor Full-Stack", totalCandidatos: 25 },
        { vaga: "Analista de RH", totalCandidatos: 18 },
        { vaga: "Gerente de Projetos", totalCandidatos: 12 },
        { vaga: "Designer UX/UI", totalCandidatos: 15 },
        { vaga: "Analista de Dados", totalCandidatos: 20 }
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
async function loadStatusVagas() {
    const canvas = document.getElementById("statusVagasChart");
    if (!canvas) return;

    let result;
    try {
        console.log('📊 [Dashboard] Carregando status das vagas...');
        result = await dashboardClient.getStatusVagas();
        console.log('✅ [Dashboard] Status das vagas:', result);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Usando fallback para status das vagas');
        result = FALLBACK_DATA.statusVagas;
    }

    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: result.map(r => r.status),
            datasets: [{
                data: result.map(r => r.quantidade),
                backgroundColor: [COLORS.primary, COLORS.success, COLORS.info, COLORS.danger],
                hoverBackgroundColor: [COLORS.primaryHover, COLORS.successHover, COLORS.infoHover, '#c0392b'],
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
async function loadCandidatosVaga() {
    const canvas = document.getElementById("candidatosPorVagaChart");
    if (!canvas) return;

    let result;
    try {
        console.log('📊 [Dashboard] Carregando candidatos por vaga...');
        result = await dashboardClient.getCandidatosPorVaga();
        console.log('✅ [Dashboard] Candidatos por vaga:', result);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Usando fallback para candidatos por vaga');
        result = FALLBACK_DATA.candidatosVaga;
    }

    const valores = result.map(r => r.totalCandidatos);
    const maxValue = Math.max(...valores, 10);

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: result.map(r => r.vaga),
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
            }
        }
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

// ============================
// INICIALIZAÇÃO
// ============================
async function initDashboard() {
    console.log('🚀 [Dashboard] Iniciando carregamento...');

    try {
        await Promise.all([
            loadMetrics(),
            loadVagasPorMes(),
            loadStatusVagas(),
            loadCandidatosVaga(),
            loadTipoContrato(),
            loadTempoPreenchimento()
        ]);
        console.log('✅ [Dashboard] Todos os gráficos carregados!');
    } catch (error) {
        console.error('❌ [Dashboard] Erro ao carregar:', error);
    }
}

// Filtro de período (para implementação futura)
function setupPeriodFilter() {
    const filter = document.getElementById('periodFilter');
    if (filter) {
        filter.addEventListener('change', function() {
            console.log('📅 Período selecionado:', this.value);
            // TODO: Recarregar dados com filtro
        });
    }
}

document.addEventListener("DOMContentLoaded", async function() {
    setupPeriodFilter();
    await initDashboard();
});
