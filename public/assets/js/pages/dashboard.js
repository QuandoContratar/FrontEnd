// 4️⃣ Gráfico Empilhado de Etapas por Vaga
let graficoEmpilhadoChartInstance = null;

async function loadGraficoEmpilhado(area) {
    const canvas = document.getElementById('graficoEmpilhadoChart');
    if (!canvas) return;

    let apiData;
    try {
        const { ReportsClient } = await import('../../../client/client.js');
        const client = new ReportsClient();
        apiData = await client.graficoDeBarrasEmpilhado(area);
        console.log('✅ [Dashboard] Gráfico empilhado (API):', apiData);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Usando fallback para gráfico empilhado');
        apiData = [
            ["Desenvolvedor Java JR", 0, 0, 2, 1, 3],
            ["Analista de Dados JR", 2, 1, 1, 1, 5],
            ["QA Tester", 0, 0, 0, 0, 0],
            ["Data Scientist", 0, 0, 0, 0, 0],
            ["Product Owner", 0, 0, 0, 0, 0]
        ];
    }

    // Processar dados: [titulo, n1, n2, n3, n4, total]
    const labels = apiData.map(row => row[0] || '');
    const n1 = apiData.map(row => Number(row[1]) || 0);
    const n2 = apiData.map(row => Number(row[2]) || 0);
    const n3 = apiData.map(row => Number(row[3]) || 0);
    const n4 = apiData.map(row => Number(row[4]) || 0);

    // Destruir gráfico anterior
    if (graficoEmpilhadoChartInstance) {
        graficoEmpilhadoChartInstance.destroy();
        graficoEmpilhadoChartInstance = null;
    }

    const maxValue = Math.max(...apiData.map(row => (Number(row[1]) + Number(row[2]) + Number(row[3]) + Number(row[4]))), 5);

    graficoEmpilhadoChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Baixo',
                    data: n1,
                    backgroundColor: '#e74a3b', // vermelho
                    hoverBackgroundColor: '#c0392b',
                    stack: 'Stack 0'
                },
                {
                    label: 'Médio',
                    data: n2,
                    backgroundColor: '#f6c23e', // laranja
                    hoverBackgroundColor: '#dda20a',
                    stack: 'Stack 0'
                },
                {
                    label: 'Alto',
                    data: n3,
                    backgroundColor: '#f9e79f', // amarelo
                    hoverBackgroundColor: '#f7ca18',
                    stack: 'Stack 0'
                },
                {
                    label: 'Destaque',
                    data: n4,
                    backgroundColor: '#1cc88a', // verde
                    hoverBackgroundColor: '#17a673',
                    stack: 'Stack 0'
                }
            ]
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    stacked: true,
                    gridLines: { display: false },
                    ticks: { fontSize: 12 }
                }],
                yAxes: [{
                    stacked: true,
                    ticks: { min: 0, max: Math.ceil(maxValue * 1.2), maxTicksLimit: 5, padding: 10 },
                    gridLines: { color: "rgb(234, 236, 244)", zeroLineColor: "rgb(234, 236, 244)", drawBorder: false }
                }]
            },
            legend: { display: true, position: 'top' },
            tooltips: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function(tooltipItem, data) {
                        const ds = data.datasets[tooltipItem.datasetIndex];
                        return `${ds.label}: ${tooltipItem.yLabel}`;
                    }
                }
            }
        }
    });
}


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
    ],
    taxaContratacaoPorArea: [
        { area: 'TI', contratadas: 8, vagasCriadas: 12 },
        { area: 'Comercial', contratadas: 3, vagasCriadas: 5 },
        { area: 'RH', contratadas: 2, vagasCriadas: 4 },
        { area: 'Marketing', contratadas: 1, vagasCriadas: 3 }
    ]
    ,
    aprovadosReprovadosVagas: [
        { titulo: 'Desenvolvedor Full-Stack', aprovados: 18, reprovados: 7 },
        { titulo: 'Analista de RH', aprovados: 12, reprovados: 6 },
        { titulo: 'Gerente de Projetos', aprovados: 8, reprovados: 4 },
        { titulo: 'Designer UX/UI', aprovados: 10, reprovados: 5 },
        { titulo: 'Analista de Dados', aprovados: 14, reprovados: 6 }
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
// ERROR OVERLAY (ajuda a capturar erros de runtime durante desenvolvimento)
// ============================
(function setupErrorOverlay() {
    try {
        const overlay = document.createElement('div');
        overlay.id = 'js-error-overlay';
        overlay.style.position = 'fixed';
        overlay.style.left = '10px';
        overlay.style.right = '10px';
        overlay.style.top = '10px';
        overlay.style.zIndex = 99999;
        overlay.style.maxHeight = '40vh';
        overlay.style.overflow = 'auto';
        overlay.style.background = 'rgba(255,255,255,0.95)';
        overlay.style.border = '1px solid rgba(200,0,0,0.6)';
        overlay.style.padding = '10px';
        overlay.style.display = 'none';
        overlay.style.fontFamily = 'Poppins, Arial, sans-serif';
        overlay.style.fontSize = '13px';
        overlay.style.color = '#222';
        document.addEventListener('DOMContentLoaded', () => document.body.appendChild(overlay));

        function showError(msg) {
            overlay.style.display = 'block';
            const p = document.createElement('pre');
            p.style.whiteSpace = 'pre-wrap';
            p.style.margin = '6px 0';
            p.textContent = msg;
            overlay.appendChild(p);
            console.error(msg);
        }

        window.addEventListener('error', function (ev) {
            try { showError(`Error: ${ev.message} at ${ev.filename}:${ev.lineno}:${ev.colno}`); } catch (e) { console.error(e); }
        });

        window.addEventListener('unhandledrejection', function (ev) {
            try { showError(`UnhandledRejection: ${ev.reason && ev.reason.message ? ev.reason.message : ev.reason}`); } catch (e) { console.error(e); }
        });
    } catch (e) { console.error('Erro ao configurar overlay de erro', e); }
})();

// ============================
// TOP MINI CARDS (Qtd vagas, Qtd currículos, Triagem, Teste técnico, Entrevista, Fit Cultural)
// ============================
async function loadTopMiniCards() {
    // Tentamos obter dados do mesmo endpoint de métricas (ou outro futuro). Usamos fallback quando necessário.
    let data;
    try {
        data = await dashboardClient.getMetrics();
    } catch (e) {
        data = null;
    }

    // Valores fallback simples
    const fallback = {
        qtdVagas: 24,
        qtdCurriculos: 156,
        triagem: 98,
        testeTecnico: 42,
        entrevista: 30,
        fitCultural: 12
    };

    const values = {
        qtdVagas: data && (data.qtdVagas || data.totalVagas) ? (data.qtdVagas || data.totalVagas) : fallback.qtdVagas,
        qtdCurriculos: data && (data.qtdCurriculos || data.totalCurriculos) ? (data.qtdCurriculos || data.totalCurriculos) : fallback.qtdCurriculos,
        triagem: data && data.triagem ? data.triagem : fallback.triagem,
        testeTecnico: data && data.testeTecnico ? data.testeTecnico : fallback.testeTecnico,
        entrevista: data && data.entrevista ? data.entrevista : fallback.entrevista,
        fitCultural: data && data.fitCultural ? data.fitCultural : fallback.fitCultural
    };

    const setText = (id, v) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerText = typeof v === 'number' ? numberFormat(v) : v;
    };

    setText('qtdVagasCard', values.qtdVagas);
    setText('qtdCurriculosCard', values.qtdCurriculos);
    setText('triagemCard', values.triagem);
    setText('testeTecnicoCard', values.testeTecnico);
    setText('entrevistaCard', values.entrevista);
    setText('fitCulturalCard', values.fitCultural);
}


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

    // Garantir ordem consistente: Aberta/Aprovada, Pendente Aprovação, Rejeitada
    const ORDER = ['Aberta/Aprovada', 'Pendente Aprovação', 'Rejeitada'];
    const otherLabels = Object.keys(groupedData).filter(l => !ORDER.includes(l));
    const labels = ORDER.filter(l => groupedData[l] !== undefined).concat(otherLabels);
    const valores = labels.map(l => groupedData[l]);

    console.log('📊 [Dashboard] Status das vagas (normalizado):', { labels, valores });

    // Cores para cada status (consistentes com o rascunho)
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

    // Converter para gráfico de barras (vertical)
    const maxValue = Math.max(...valores, 5);

    // Usar barras verticais (em pé)
    statusVagasChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vagas',
                data: valores,
                backgroundColor: bgColors,
                hoverBackgroundColor: hoverColors,
                borderColor: 'rgba(0,0,0,0.05)',
                borderWidth: 1
            }]
        },
        options: {
            maintainAspectRatio: false,
            layout: { padding: { left: 10, right: 25, top: 10, bottom: 0 } },
            scales: {
                xAxes: [{ gridLines: { display: false, drawBorder: false }, ticks: { fontSize: 13 } }],
                yAxes: [{
                    ticks: { min: 0, max: Math.ceil(maxValue * 1.2), maxTicksLimit: 5, padding: 10 },
                    gridLines: { color: "rgb(234, 236, 244)", zeroLineColor: "rgb(234, 236, 244)", drawBorder: false, borderDash: [2] }
                }]
            },
            legend: { display: false },
            tooltips: {
                backgroundColor: "rgb(255,255,255)", bodyFontColor: "#858796",
                borderColor: '#dddfeb', borderWidth: 1, xPadding: 15, yPadding: 15, displayColors: false,
                callbacks: { label: (t, d) => `${d.datasets[t.datasetIndex].label}: ${t.yLabel} vagas` }
            }
            ,
            // Desenhar valores e porcentagens nas barras ao final da animação
            animation: {
                onComplete: function() {
                    const chartInstance = this.chart;
                    const ctx = chartInstance.ctx;
                    ctx.font = '600 12px Poppins, Arial';
                    ctx.textBaseline = 'middle';

                    const dataset = chartInstance.data.datasets[0];
                    const meta = chartInstance.controller.getDatasetMeta(0);
                    const total = dataset.data.reduce((s, v) => s + v, 0) || 1;
                    meta.data.forEach(function(bar, index) {
                        const value = dataset.data[index];
                        const percentage = Math.round((value / total) * 100);
                        const model = bar._model;

                        const text = `${value} (${percentage}%)`;
                        const textWidth = ctx.measureText(text).width;

                        // Para barras verticais: model.y = topo, model.base = base
                        const barHeight = model.base - model.y;
                        const x = model.x;

                        if (barHeight > 24) {
                            // desenhar dentro da barra, centralizado verticalmente
                            ctx.fillStyle = '#ffffff';
                            ctx.fillText(text, x - textWidth / 2, model.y + barHeight / 2);
                        } else {
                            // desenhar acima da barra
                            ctx.fillStyle = '#333333';
                            ctx.fillText(text, x - textWidth / 2, model.y - 8);
                        }
                    });
                }
            }
        }
    });
}

// ============================
// GRÁFICO - TAXA DE CONTRATAÇÃO POR ÁREA
// ============================
let taxaContratacaoAreaChartInstance = null;

async function loadTaxaContratacaoPorArea() {
    const canvas = document.getElementById('taxaContratacaoAreaChart');
    if (!canvas) return;

    let apiData;
    try {
        const { ReportsClient } = await import('../../../client/client.js');
        const client = new ReportsClient();
        apiData = await client.graficoDeBarrasDeTaxaDeContratacaoPorArea();
        console.log('✅ [Dashboard] Taxa por área (API):', apiData);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Usando fallback para taxa de contratação por área');
        // Fallback para formato antigo
        apiData = [
            ['TI', 12, 8, 66.67],
            ['Comercial', 5, 3, 60.00],
            ['RH', 4, 2, 50.00],
            ['Marketing', 3, 1, 33.33]
        ];
    }

    // Processar dados no formato [[area, curriculos, vagas, taxa], ...]
    const labels = apiData.map(row => row[0] || 'Área');
    const curriculos = apiData.map(row => Number(row[1]) || 0);
    const vagas = apiData.map(row => Number(row[2]) || 0);
    const taxas = apiData.map(row => Number(row[3]) || 0);

    // Destruir gráfico anterior
    if (taxaContratacaoAreaChartInstance) {
        taxaContratacaoAreaChartInstance.destroy();
        taxaContratacaoAreaChartInstance = null;
    }

    const maxPercent = Math.max(...taxas, 10);

    taxaContratacaoAreaChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Taxa %',
                data: taxas,
                backgroundColor: labels.map(() => COLORS.primary),
                hoverBackgroundColor: labels.map(() => COLORS.primaryHover),
                borderWidth: 0
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                xAxes: [{ gridLines: { display: false }, ticks: { fontSize: 13 } }],
                yAxes: [{
                    ticks: { min: 0, max: Math.ceil(maxPercent * 1.2), callback: v => `${v}%` },
                    gridLines: { color: "rgb(234, 236, 244)", zeroLineColor: "rgb(234, 236, 244)" }
                }]
            },
            legend: { display: false },
            tooltips: {
                backgroundColor: "rgb(255,255,255)", bodyFontColor: "#858796",
                borderColor: '#dddfeb', borderWidth: 1, xPadding: 12, yPadding: 12, displayColors: false,
                callbacks: {
                    label: function(tooltipItem, data) {
                        const idx = tooltipItem.index;
                        const area = labels[idx];
                        const curr = curriculos[idx];
                        const vac = vagas[idx];
                        return `A cada ${curr} currículos, é preenchido ${vac} vagas`;
                    }
                }
            },
            animation: {
                onComplete: function() {
                    const chart = this.chart;
                    const ctx = chart.ctx;
                    ctx.font = '600 12px Poppins, Arial';
                    ctx.textBaseline = 'middle';

                    const ds = chart.data.datasets[0];
                    const meta = chart.controller.getDatasetMeta(0);

                    meta.data.forEach(function(bar, index) {
                        const model = bar._model;
                        const value = ds.data[index];
                        const text = `${value}% (${curriculos[index]}/${vagas[index]})`;
                        const textWidth = ctx.measureText(text).width;

                        const barHeight = model.base - model.y;
                        const x = model.x;

                        if (barHeight > 24) {
                            ctx.fillStyle = '#ffffff';
                            ctx.fillText(text, x - textWidth / 2, model.y + barHeight / 2);
                        } else {
                            ctx.fillStyle = '#333333';
                            ctx.fillText(text, x - textWidth / 2, model.y - 8);
                        }
                    });
                }
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
        // Dashboard Completo - Primeira batch (KPIs e gráficos principais)
        const defaultArea = 'TI';
        await Promise.all([
            loadMainKPIs(defaultArea),
            loadAprovadosReprovadosMes(),
            loadTaxaContratacaoPorArea(),  // essa não precisa
            loadMatchScore(defaultArea),
            loadTopFaculdades(defaultArea),
            // loadTempoContratacao(defaultArea)
        ]);

        // Gráficos existentes (manter compatibilidade)
        await Promise.all([
            loadTopMiniCards(),
            loadStatusVagas(),
            loadGraficoEmpilhado(defaultArea),
        ]);

        console.log('✅ [Dashboard] Todos os gráficos carregados!');
    } catch (error) {
        console.error('❌ [Dashboard] Erro ao carregar:', error);
    }
}


// Variável global para armazenar a área selecionada
let selectedArea = '';

// ============================
// NOVAS FUNÇÕES - Dashboard Completo
// ============================

// 2️⃣ Carregar KPIs principais
async function loadMainKPIs(area) {
    // --- INÍCIO INTEGRAÇÃO REPORTSCLIENT (padrão exemplo) ---
    let vagasAbertas = 24;
    let curriculos = 156;
    try {
        const { ReportsClient } = await import('../../../client/client.js');
        const client = new ReportsClient();
        const vagasResp = await client.kpiQuantidadeDeVagas(area);
        if (vagasResp && typeof vagasResp === 'number') vagasAbertas = vagasResp;
        const curriculosResp = await client.kpiQuantidadeDeCandidatos(area);
        if (curriculosResp && typeof curriculosResp === 'number') curriculos = curriculosResp;
    } catch (e) {
        // fallback: mantém valores default
    }

    // KPIs de taxa de aprovação
    let triagem = 98;
    let testeTecnico = 42;
    let entrevista = 30;
    let fitCultural = 12;
    try {
        const { ReportsClient } = await import('../../../client/client.js');
        const client = new ReportsClient();
        const taxaResp = await client.kpisDeTaxaDeAprovacao(area);
        // Esperado: [[area, triagem, testeTecnico, entrevista, fitCultural]]
        if (Array.isArray(taxaResp) && Array.isArray(taxaResp[0]) && taxaResp[0].length >= 5) {
            triagem = taxaResp[0][1];
            testeTecnico = taxaResp[0][2];
            entrevista = taxaResp[0][3];
            fitCultural = taxaResp[0][4];
        }
    } catch (e) {
        // fallback: mantém valores default
    }

    document.getElementById('kpiVagasAbertas').textContent = numberFormat(vagasAbertas);
    document.getElementById('kpiCurriculosRecebidos').textContent = numberFormat(curriculos);
    document.getElementById('kpiTriagem').textContent = numberFormat(triagem + "%");
    document.getElementById('kpiTesteTecnico').textContent = numberFormat(testeTecnico + "%");
    document.getElementById('kpiEntrevista').textContent = numberFormat(entrevista + "%");
    document.getElementById('kpiFitCultural').textContent = numberFormat(fitCultural + "%");
    // --- FIM INTEGRAÇÃO REPORTSCLIENT ---
}

// 3️⃣ Gráfico Aprovados × Reprovados por mês (colunas empilhadas)
let aprovadosReprovadosMesChartInstance = null;

async function loadAprovadosReprovadosMes() {
    const canvas = document.getElementById('aprovadosReprovadosMesChart');
    if (!canvas) return;

    let result;
    try {
        console.log('📊 [Dashboard] Carregando aprovados/reprovados por mês...');
        result = await dashboardClient.getApprovedRejectedByMonth();
        console.log('✅ [Dashboard] Aprovados/Reprovados por mês:', result);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Usando fallback para aprovados/reprovados por mês');
        result = [
            { mes: 1, aprovados: 12, reprovados: 8 },
            { mes: 2, aprovados: 15, reprovados: 10 },
            { mes: 3, aprovados: 18, reprovados: 12 },
            { mes: 4, aprovados: 14, reprovados: 9 },
            { mes: 5, aprovados: 20, reprovados: 15 },
            { mes: 6, aprovados: 16, reprovados: 11 },
            { mes: 7, aprovados: 19, reprovados: 13 },
            { mes: 8, aprovados: 22, reprovados: 16 },
            { mes: 9, aprovados: 17, reprovados: 12 },
            { mes: 10, aprovados: 21, reprovados: 14 },
            { mes: 11, aprovados: 18, reprovados: 13 },
            { mes: 12, aprovados: 24, reprovados: 17 }
        ];
    }

    const valoresAprovados = Array(12).fill(0);
    const valoresReprovados = Array(12).fill(0);
    
    result.forEach(item => {
        if (item.mes >= 1 && item.mes <= 12) {
            valoresAprovados[item.mes - 1] = item.aprovados || item.approved || 0;
            valoresReprovados[item.mes - 1] = item.reprovados || item.rejected || 0;
        }
    });

    const maxValue = Math.max(...valoresAprovados.map((v, i) => v + valoresReprovados[i]), 5);

    if (aprovadosReprovadosMesChartInstance) {
        aprovadosReprovadosMesChartInstance.destroy();
        aprovadosReprovadosMesChartInstance = null;
    }

    aprovadosReprovadosMesChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: MESES_LABELS,
            datasets: [
                {
                    label: 'Aprovados',
                    data: valoresAprovados,
                    backgroundColor: COLORS.success,
                    hoverBackgroundColor: COLORS.successHover
                },
                {
                    label: 'Reprovados',
                    data: valoresReprovados,
                    backgroundColor: COLORS.danger,
                    hoverBackgroundColor: '#c0392b'
                }
            ]
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                xAxes: [{ stacked: true, gridLines: { display: false }, ticks: { maxTicksLimit: 12 } }],
                yAxes: [{ 
                    stacked: true, 
                    ticks: { min: 0, max: Math.ceil(maxValue * 1.2), maxTicksLimit: 5, padding: 10 },
                    gridLines: { color: "rgb(234, 236, 244)", zeroLineColor: "rgb(234, 236, 244)", drawBorder: false }
                }]
            },
            legend: { display: true, position: 'top' },
            tooltips: {
                mode: 'index',
                intersect: false,
                callbacks: { label: (t, d) => `${d.datasets[t.datasetIndex].label}: ${t.yLabel}` }
            }
        }
    });
}

// 5️⃣ Match dos Candidatos por Score
async function loadMatchScore(area) {
    // Integração com ReportsClient para KPIs de match
    let matchData = [0, 0, 0, 0]; // [baixo, medio, alto, destaque]
    try {
        const { ReportsClient } = await import('../../../client/client.js');
        const client = new ReportsClient();
        const resp = await client.kpisQuantidadeDePessoasPorMatch(area);
        // Esperado: [[baixo, medio, alto, destaque]]
        if (Array.isArray(resp) && Array.isArray(resp[0]) && resp[0].length === 4) {
            matchData = resp[0];
        }
    } catch (e) {
        // fallback
        matchData = [200, 50, 30, 5];
    }

    document.getElementById('matchBaixo').textContent = numberFormat(matchData[0]);
    document.getElementById('matchMedio').textContent = numberFormat(matchData[1]);
    document.getElementById('matchAlto').textContent = numberFormat(matchData[2]);
    document.getElementById('matchDestaque').textContent = numberFormat(matchData[3]);
}

// 6️⃣ Top 5 melhores faculdades
async function loadTopFaculdades(area) {
    const tbody = document.getElementById('topFaculdadesBody');
    if (!tbody) return;

    let result;
    try {
        const { ReportsClient } = await import('../../../client/client.js');
        const client = new ReportsClient();
        console.log('📊 [Dashboard] Carregando ranking das melhores faculdades...');
        result = await client.rankingMelhoresFaculdades(area);
        console.log('✅ [Dashboard] Ranking das melhores faculdades:', result);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Usando fallback para ranking das melhores faculdades');
        // Fallback para formato antigo
        result = [
            ['USP', 45, 1],
            ['FATEC', 38, 2],
            ['UFRJ', 32, 3],
            ['PUC', 28, 4],
            ['UNICAMP', 25, 5]
        ];
    }

    tbody.innerHTML = '';
    (result || []).slice(0, 5).forEach((row, index) => {
        // row: [nome, qtdCandidatos, ranking] -- ignorar ranking
        const faculdade = Array.isArray(row) ? row[0] : (row.faculdade || row.name || row.university || 'N/A');
        const total = Array.isArray(row) ? row[1] : (row.total || row.count || 0);
        tbody.innerHTML += `
            <tr>
                <td class="text-center"><strong>${index + 1}º</strong></td>
                <td>${faculdade}</td>
                <td class="text-center">${numberFormat(total)}</td>
            </tr>
        `;
    });
}

// 7️⃣ Tempo até contratação (por mês)
let tempoContratacaoChartInstance = null;

// async function loadTempoContratacao() {
//     const canvas = document.getElementById('tempoContratacaoChart');
//     if (!canvas) return;

//     let result;
//     try {
//         console.log('📊 [Dashboard] Carregando tempo até contratação...');
//         result = await dashboardClient.getTempoPreenchimento();
//         console.log('✅ [Dashboard] Tempo até contratação:', result);
//     } catch (error) {
//         console.warn('⚠️ [Dashboard] Usando fallback para tempo até contratação');
//         result = FALLBACK_DATA.tempoPreenchimento;
//     }

//     const valores = Array(12).fill(0);
//     result.forEach(item => {
//         if (item.mes >= 1 && item.mes <= 12) {
//             valores[item.mes - 1] = item.dias || item.days || 0;
//         }
//     });

//     const maxValue = Math.max(...valores, 20);

//     if (tempoContratacaoChartInstance) {
//         tempoContratacaoChartInstance.destroy();
//         tempoContratacaoChartInstance = null;
//     }

//     tempoContratacaoChartInstance = new Chart(canvas, {
//         type: 'bar',
//         data: {
//             labels: MESES_LABELS,
//             datasets: [{
//                 label: 'Média de dias',
//                 backgroundColor: COLORS.info,
//                 hoverBackgroundColor: COLORS.infoHover,
//                 data: valores
//             }]
//         },
//         options: {
//             maintainAspectRatio: false,
//             scales: {
//                 xAxes: [{ gridLines: { display: false }, ticks: { maxTicksLimit: 12 } }],
//                 yAxes: [{
//                     ticks: { min: 0, max: Math.ceil(maxValue * 1.2), maxTicksLimit: 5, padding: 10, callback: v => `${v} dias` },
//                     gridLines: { color: "rgb(234, 236, 244)", zeroLineColor: "rgb(234, 236, 244)", drawBorder: false }
//                 }]
//             },
//             legend: { display: false },
//             tooltips: {
//                 backgroundColor: "rgb(255,255,255)", bodyFontColor: "#858796",
//                 borderColor: '#dddfeb', borderWidth: 1, xPadding: 15, yPadding: 15, displayColors: false,
//                 callbacks: { label: (t, c) => `Média: ${t.yLabel} dias` }
//             }
//         }
//     });
// }

// 8️⃣ Funil completo da vaga DEV
async function setupFunilSelect() {
    const select = document.getElementById('selectVagaFunil');
    if (!select) return;

    try {
        const vagas = await dashboardClient.getVacanciesList();
        select.innerHTML = '<option value="">Selecione uma vaga...</option>';
        
        vagas.forEach(vaga => {
            const id = vaga.id || vaga.vacancyId || vaga.id_vacancy;
            const titulo = vaga.titulo ?? vaga.position_job ?? vaga.cargo ?? vaga.area ?? `Vaga #${id}`;
            select.innerHTML += `<option value="${id}">${titulo}</option>`;
        });
    } catch (error) {
        console.warn('⚠️ Erro ao carregar lista de vagas para funil:', error);
    }

    select.addEventListener('change', function() {
        loadFunilCompleto(this.value || null);
    });
}

async function loadFunilCompleto(vacancyId) {
    const container = document.getElementById('funilContainer');
    if (!container) return;

    if (!vacancyId) {
        container.innerHTML = '<div class="text-center text-muted">Selecione uma vaga para visualizar o funil</div>';
        return;
    }

    let result;
    try {
        console.log('📊 [Dashboard] Carregando funil completo para vaga:', vacancyId);
        result = await dashboardClient.getPipelineByStageByVacancy(vacancyId);
        console.log('✅ [Dashboard] Funil completo:', result);
    } catch (error) {
        console.warn('⚠️ [Dashboard] Erro ao carregar funil completo:', error);
        result = [
            { stageName: 'curriculos_recebidos', total: 156, percentage: 100 },
            { stageName: 'triagem', total: 98, percentage: 63 },
            { stageName: 'teste_tecnico', total: 42, percentage: 43 },
            { stageName: 'entrevista', total: 30, percentage: 71 },
            { stageName: 'contratados', total: 12, percentage: 40 }
        ];
    }

    if (!result || result.length === 0) {
        container.innerHTML = '<div class="text-center text-muted">Nenhum dado disponível para esta vaga</div>';
        return;
    }

    const stageLabels = {
        'curriculos_recebidos': 'Currículos Recebidos',
        'triagem': 'Triagem',
        'teste_tecnico': 'Teste Técnico',
        'entrevista': 'Entrevista',
        'contratados': 'Contratados'
    };

    container.innerHTML = '';
    result.forEach((item, index) => {
        const stage = item.stageName || item.stage || 'N/A';
        const label = stageLabels[stage] || stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const total = item.total || item.count || 0;
        const percentage = item.percentage || (index > 0 && result[index - 1].total > 0 
            ? Math.round((total / result[index - 1].total) * 100) : 100);

        container.innerHTML += `
            <div class="funnel-stage" style="width: ${100 - (index * 10)}%;">
                <div class="funnel-number">${numberFormat(total)}</div>
                <div class="funnel-label">${label}</div>
                ${index > 0 ? `<div class="funnel-percentage">${percentage}% passaram</div>` : ''}
            </div>
        `;
    });
}

// Filtro de área
function setupAreaFilter() {
    const areaFilter = document.getElementById('areaFilter');
    
    if (areaFilter) {
        areaFilter.addEventListener('change', function() {
            selectedArea = this.value;
            console.log('🏢 Área selecionada:', selectedArea);
            reloadDashboardByArea();
        });
    }
}

// Função para recarregar dados filtrando pela área
async function reloadDashboardByArea() {
    console.log('🔄 Recarregando dashboard para a área:', selectedArea);
    
    // Recarregar todos os gráficos principais
    await Promise.all([
        loadMainKPIs(selectedArea),
        loadTaxaContratacaoPorArea(), // essa não precisa
        loadMatchScore(selectedArea),
        loadTopFaculdades(selectedArea),
        loadGraficoEmpilhado(selectedArea)
        // loadTempoContratacao(selectedArea),
    ]);
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
