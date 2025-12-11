/* ========================================
   PÁGINA DE DETALHES DA VAGA (TELA 2)
   Painel detalhado com KPIs, candidatos, retenção
   Integrado com API Backend Spring Boot
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

// Instância do gráfico de retenção (para destruir antes de recriar)
let retencaoChartInstance = null;

// Dados da vaga carregada (armazenado globalmente para uso em múltiplas funções)
let currentVagaData = null;
let currentVagaId = null;

// ============================
// FUNÇÕES UTILITÁRIAS
// ============================
function getVagaIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('vagaId');
}

function numberFormat(number) {
    if (number === null || number === undefined) return '0';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function showLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
}

// ============================
// CARREGAR DADOS DA VAGA
// ============================
async function loadVagaDetails() {
    currentVagaId = getVagaIdFromUrl();
    
    if (!currentVagaId) {
        console.warn('⚠️ [Vaga Detalhe] Nenhuma vaga selecionada');
        showErrorState('Nenhuma vaga selecionada. Volte para o Dashboard e selecione uma vaga.');
        return;
    }

    console.log('📊 [Vaga Detalhe] Iniciando carregamento da vaga:', currentVagaId);

    // Carregar KPIs primeiro para preencher os cards
    await loadKPIs(currentVagaId);
    
    // Carregar candidatos (isso também popula informações da vaga)
    await loadCandidatos(currentVagaId, 'all');
    
    // Carregar gráfico de retenção
    await loadRetencao(currentVagaId);
    
    // Carregar ocupação
    await loadOcupacao(currentVagaId);
}

function showErrorState(message) {
    const titulo = document.getElementById('vagaTitulo');
    if (titulo) {
        titulo.textContent = 'Erro ao carregar vaga';
    }
    
    const metricsRow = document.getElementById('metricsRow');
    if (metricsRow) {
        metricsRow.innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle mr-2"></i>${message}
                </div>
            </div>
        `;
    }
}

// ============================
// CARREGAR KPIs DA VAGA
// ============================
async function loadKPIs(vagaId) {
    const metricsRow = document.getElementById('metricsRow');
    if (!metricsRow) return;

    // Mostrar loading
    metricsRow.innerHTML = `
        <div class="col-12 text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="sr-only">Carregando...</span>
            </div>
        </div>
    `;

    let kpisData;
    
    try {
        console.log('📊 [Vaga Detalhe] Carregando KPIs...');
        kpisData = await dashboardClient.getVagaKpis(vagaId);
        console.log('✅ [Vaga Detalhe] KPIs carregados:', kpisData);
    } catch (error) {
        console.error('❌ [Vaga Detalhe] Erro ao carregar KPIs:', error);
        // Fallback com zeros
        kpisData = {
            naoIniciado: 0,
            avaliacaoTecnica: 0,
            fitCultural: 0,
            proposta: 0
        };
    }

    // Configuração dos cards KPI conforme mapeamento do backend
    const kpisConfig = [
        {
            key: 'naoIniciado',
            nome: 'Aguardando Triagem',
            cor: 'primary',
            icon: 'fa-hourglass-start'
        },
        {
            key: 'avaliacaoTecnica',
            nome: 'Teste Técnico',
            cor: 'danger',
            icon: 'fa-code'
        },
        {
            key: 'fitCultural',
            nome: 'Fit Cultural',
            cor: 'warning',
            icon: 'fa-users'
        },
        {
            key: 'proposta',
            nome: 'Proposta',
            cor: 'success',
            icon: 'fa-file-contract'
        }
    ];

    metricsRow.innerHTML = '';

    // Gerar cards KPI
    kpisConfig.forEach((config) => {
        const valor = kpisData[config.key] || 0;

        const metricHtml = `
            <div class="col-6 col-md-3 mb-4">
                <div class="card border-left-${config.cor} shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-${config.cor} text-uppercase mb-1">
                                    ${config.nome}
                                </div>
                                <div class="h4 mb-0 font-weight-bold text-gray-800">
                                    ${numberFormat(valor)}
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
// CARREGAR CANDIDATOS COM FILTRO DE MATCH
// ============================
async function loadCandidatos(vagaId, matchFilter = 'all') {
    const tbody = document.getElementById('candidatosTableBody');
    if (!tbody) return;

    // Mostrar loading na tabela
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">Carregando...</span>
                </div>
            </td>
        </tr>
    `;

    let candidatosData;
    
    try {
        console.log(`📊 [Vaga Detalhe] Carregando candidatos (filtro: ${matchFilter})...`);
        candidatosData = await dashboardClient.getVagaCandidatosByMatch(vagaId, matchFilter);
        console.log('✅ [Vaga Detalhe] Candidatos carregados:', candidatosData);
    } catch (error) {
        console.error('❌ [Vaga Detalhe] Erro ao carregar candidatos:', error);
        candidatosData = [];
    }

    // Se retornou dados, extrair informações da vaga do primeiro candidato
    if (candidatosData && candidatosData.length > 0) {
        const firstCandidate = candidatosData[0];
        
        // Atualizar título da página com nome da vaga
        const titulo = document.getElementById('vagaTitulo');
        if (titulo && firstCandidate.vacancyTitle) {
            titulo.textContent = `Painel de candidatos para {${firstCandidate.vacancyTitle}}`;
        }
        
        // Armazenar dados da vaga para informações
        currentVagaData = {
            nome: firstCandidate.vacancyTitle || firstCandidate.position_job,
            periodo: firstCandidate.period,
            workModel: firstCandidate.workModel,
            location: firstCandidate.location,
            managerName: firstCandidate.managerName,
            totalCandidatos: candidatosData.length
        };
        
        // Atualizar bloco de informações da vaga
        loadInformacoes(currentVagaData);
    } else {
        // Tentar carregar informações da vaga separadamente
        try {
            const vagaInfo = await dashboardClient.getVagaById(vagaId);
            const titulo = document.getElementById('vagaTitulo');
            if (titulo) {
                titulo.textContent = `Painel de candidatos para {${vagaInfo.nome || vagaInfo.position_job || 'Vaga'}}`;
            }
            currentVagaData = vagaInfo;
            loadInformacoes(currentVagaData);
        } catch (e) {
            console.warn('⚠️ Não foi possível carregar informações da vaga');
        }
    }

    // Gerar filtros de match
    generateMatchFilters(vagaId);
    
    // Popular tabela de candidatos
    populateCandidatosTable(candidatosData);
}

// ============================
// GERAR FILTROS DE MATCH
// ============================
function generateMatchFilters(vagaId) {
    const filtrosDiv = document.getElementById('filtrosMatch');
    if (!filtrosDiv) return;

    // Definir filtros conforme API: all, baixo, medio, alto, destaque
    const matchFilters = [
        { label: 'Tudo', value: 'all', class: 'primary' },
        { label: 'Baixo', value: 'baixo', class: 'danger' },
        { label: 'Médio', value: 'medio', class: 'warning' },
        { label: 'Alto', value: 'alto', class: 'info' },
        { label: 'Destaque', value: 'destaque', class: 'success' }
    ];

    filtrosDiv.innerHTML = '';

    matchFilters.forEach((filter, index) => {
        const isActive = index === 0 ? 'active' : '';
        const button = document.createElement('button');
        button.className = `btn btn-sm btn-outline-${filter.class} mr-2 mb-2 match-filter ${isActive}`;
        button.textContent = filter.label;
        button.dataset.match = filter.value;

        button.addEventListener('click', async function() {
            // Remove active de todos os botões
            document.querySelectorAll('.match-filter').forEach(btn => {
                btn.classList.remove('active');
            });
            // Adiciona active ao clicado
            this.classList.add('active');

            // Fazer nova chamada à API com o filtro selecionado
            await loadCandidatosByFilter(vagaId, this.dataset.match);
        });

        filtrosDiv.appendChild(button);
    });
}

// ============================
// CARREGAR CANDIDATOS POR FILTRO (chamada à API)
// ============================
async function loadCandidatosByFilter(vagaId, matchFilter) {
    const tbody = document.getElementById('candidatosTableBody');
    if (!tbody) return;

    // Mostrar loading
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-3">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="sr-only">Carregando...</span>
                </div>
            </td>
        </tr>
    `;

    let candidatosData;
    
    try {
        console.log(`📊 [Vaga Detalhe] Filtrando candidatos (filtro: ${matchFilter})...`);
        candidatosData = await dashboardClient.getVagaCandidatosByMatch(vagaId, matchFilter);
        console.log('✅ [Vaga Detalhe] Candidatos filtrados:', candidatosData);
    } catch (error) {
        console.error('❌ [Vaga Detalhe] Erro ao filtrar candidatos:', error);
        candidatosData = [];
    }

    populateCandidatosTable(candidatosData);
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
        
        // Extrair matching (pode vir como matching, matchScore, ou match)
        const matching = parseFloat(candidato.matching || candidato.matchScore || candidato.match || 0);

        // Definir cor do matching
        let matchingClass = 'text-danger';
        if (matching >= 86) matchingClass = 'text-success';
        else if (matching >= 66) matchingClass = 'text-info';
        else if (matching >= 36) matchingClass = 'text-warning';

        // Mapear campos da API (pode vir em português ou inglês)
        const nome = candidato.nome || candidato.name || candidato.candidateName || 'N/A';
        const contato = candidato.contato || candidato.contact || candidato.contractType || 'N/A';
        const periodo = candidato.periodo || candidato.period || 'N/A';
        const localidade = candidato.localidade || candidato.location || 'N/A';
        const gestor = candidato.gestor || candidato.manager || candidato.managerName || 'N/A';

        tr.innerHTML = `
            <td class="text-sm">${nome}</td>
            <td class="text-sm">${contato}</td>
            <td class="text-sm">${periodo}</td>
            <td class="text-sm">${localidade}</td>
            <td class="text-sm">${gestor}</td>
            <td class="text-center text-sm font-weight-bold ${matchingClass}">${matching.toFixed(0)}%</td>
        `;

        tbody.appendChild(tr);
    });
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
        retencaoData = await dashboardClient.getVagaRetencao(vagaId);
        console.log('✅ [Vaga Detalhe] Retenção carregada:', retencaoData);
    } catch (error) {
        console.error('❌ [Vaga Detalhe] Erro ao carregar retenção:', error);
        // Fallback
        retencaoData = {
            emAndamento: 0,
            rejeitados: 0,
            aprovados: 0
        };
    }

    // Mapear dados para o gráfico
    const labels = ['Em Andamento', 'Aprovados', 'Rejeitados'];
    const valores = [
        retencaoData.emAndamento || 0,
        retencaoData.aprovados || 0,
        retencaoData.rejeitados || 0
    ];

    // Cores para retenção
    const retencaoColors = ['#7367f0', '#1cc88a', '#e74a3b'];
    const retencaoHoverColors = ['#6255d5', '#17a673', '#c0392b'];

    // Atualizar legenda
    const legendaDiv = document.getElementById('retencaoLegenda');
    if (legendaDiv) {
        legendaDiv.innerHTML = labels.map((label, i) => 
            `<span class="mr-3"><i class="fas fa-circle" style="color: ${retencaoColors[i]}"></i> ${label}: ${valores[i]}</span>`
        ).join('');
    }

    // Destruir gráfico anterior se existir
    if (retencaoChartInstance) {
        retencaoChartInstance.destroy();
        retencaoChartInstance = null;
    }

    retencaoChartInstance = new Chart(canvas, {
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
// CARREGAR OCUPAÇÃO
// ============================
async function loadOcupacao(vagaId) {
    try {
        console.log('📊 [Vaga Detalhe] Carregando ocupação...');
        const ocupacaoData = await dashboardClient.getVagaOcupacao(vagaId);
        console.log('✅ [Vaga Detalhe] Ocupação carregada:', ocupacaoData);
        
        // Se houver dados de ocupação, adicionar ao bloco de informações
        if (ocupacaoData && currentVagaData) {
            currentVagaData.ocupacao = ocupacaoData;
            loadInformacoes(currentVagaData);
        }
    } catch (error) {
        console.warn('⚠️ [Vaga Detalhe] Ocupação não disponível:', error);
    }
}

// ============================
// CARREGAR INFORMAÇÕES DA VAGA
// ============================
function loadInformacoes(vagaData) {
    const infoDiv = document.getElementById('vagaInfo');
    if (!infoDiv || !vagaData) return;

    // Formatar data se disponível
    let dataAbertura = 'N/A';
    if (vagaData.dataAbertura) {
        try {
            dataAbertura = new Date(vagaData.dataAbertura).toLocaleDateString('pt-BR');
        } catch (e) {
            dataAbertura = vagaData.dataAbertura;
        }
    }

    // Verificar ocupação
    let ocupacaoHtml = '';
    if (vagaData.ocupacao) {
        ocupacaoHtml = `
            <div class="col-md-6">
                <p class="mb-2">
                    <strong>Vagas Disponíveis:</strong><br>
                    <span class="text-info font-weight-bold">${vagaData.ocupacao.vagasRestantes || 0} de ${vagaData.ocupacao.totalVagas || 0}</span>
                </p>
            </div>
        `;
    }

    const html = `
        <div class="row">
            <div class="col-md-6">
                <p class="mb-2">
                    <strong>Nome da Vaga:</strong><br>
                    ${vagaData.nome || vagaData.position_job || 'N/A'}
                </p>
            </div>
            <div class="col-md-6">
                <p class="mb-2">
                    <strong>Gestor:</strong><br>
                    ${vagaData.managerName || vagaData.gestor || 'N/A'}
                </p>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6">
                <p class="mb-2">
                    <strong>Período:</strong><br>
                    ${vagaData.periodo || vagaData.period || 'N/A'}
                </p>
            </div>
            <div class="col-md-6">
                <p class="mb-2">
                    <strong>Modelo de Trabalho:</strong><br>
                    ${vagaData.workModel || 'N/A'}
                </p>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6">
                <p class="mb-2">
                    <strong>Localização:</strong><br>
                    ${vagaData.location || vagaData.localidade || 'N/A'}
                </p>
            </div>
            ${ocupacaoHtml || `
            <div class="col-md-6">
                <p class="mb-2">
                    <strong>Total de Candidatos:</strong><br>
                    <span class="text-primary font-weight-bold">${numberFormat(vagaData.totalCandidatos || 0)}</span>
                </p>
            </div>
            `}
        </div>
        ${vagaData.descricao ? `
        <div class="row">
            <div class="col-md-12">
                <p class="mb-0">
                    <strong>Descrição:</strong><br>
                    ${vagaData.descricao}
                </p>
            </div>
        </div>
        ` : ''}
    `;

    infoDiv.innerHTML = html;
}

// ============================
// INICIALIZAR
// ============================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 [Vaga Detalhe] Iniciando página...');
    
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
