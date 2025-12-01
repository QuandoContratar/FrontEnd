/* ========================================
   KANBAN DE RECRUTAMENTO
   Gestão de candidatos no processo seletivo
   ======================================== */

import { SelectionProcessClient } from '../../../client/client.js';

// Cliente da API
const selectionClient = new SelectionProcessClient();

// Estado da aplicação
let processes = [];
let filteredProcesses = [];
let draggedElement = null;
let draggedProcessId = null;

// Mapeamento de etapas (corresponde ao enum CurrentStage do backend)
const STAGES = {
    aguardando_triagem: { key: 'aguardando_triagem', title: 'Aguardando Triagem', order: 0 },
    triagem_inicial: { key: 'triagem_inicial', title: 'Triagem Inicial', order: 1 },
    avaliacao_fit_cultural: { key: 'avaliacao_fit_cultural', title: 'Fit Cultural', order: 2 },
    teste_tecnico: { key: 'teste_tecnico', title: 'Teste Técnico', order: 3 },
    entrevista_tecnica: { key: 'entrevista_tecnica', title: 'Entrevista Técnica', order: 4 },
    entrevista_final: { key: 'entrevista_final', title: 'Entrevista Final', order: 5 },
    proposta_fechamento: { key: 'proposta_fechamento', title: 'Proposta', order: 6 },
    contratacao: { key: 'contratacao', title: 'Contratação', order: 7 }
};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await initKanban();
});

/**
 * Inicializa o Kanban
 */
async function initKanban() {
    setupColumnDataAttributes();
    setupEventListeners();
    setupDragAndDrop();
    await loadProcesses();
}

/**
 * Configura atributos data-stage nas colunas
 */
function setupColumnDataAttributes() {
    const columns = document.querySelectorAll('.kanban-column');
    const stageKeys = Object.keys(STAGES);
    
    columns.forEach((column, index) => {
        if (!column.dataset.stage && stageKeys[index]) {
            column.dataset.stage = stageKeys[index];
        }
    });
}

/**
 * Configura event listeners
 */
function setupEventListeners() {
    // Busca
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Delegação de eventos para botões dos cards
    const kanbanBoard = document.querySelector('.kanban-board');
    if (kanbanBoard) {
        kanbanBoard.addEventListener('click', handleCardActions);
    }
}

/**
 * Configura drag and drop
 */
function setupDragAndDrop() {
    const columns = document.querySelectorAll('.kanban-column');
    
    columns.forEach(column => {
        const content = column.querySelector('.column-content');
        if (!content) return;
        
        content.addEventListener('dragover', (e) => {
            e.preventDefault();
            column.classList.add('drag-over');
        });

        content.addEventListener('dragleave', (e) => {
            if (!column.contains(e.relatedTarget)) {
                column.classList.remove('drag-over');
            }
        });

        content.addEventListener('drop', async (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');
            
            if (draggedElement && draggedProcessId) {
                const newStage = column.dataset.stage;
                await moveProcessToStage(draggedProcessId, newStage);
            }
        });
    });
}

/**
 * Carrega processos seletivos do backend
 */
async function loadProcesses() {
    try {
        showLoading(true);
        
        // Carrega todos os processos de todas as etapas
        const stageKeys = Object.keys(STAGES);
        const allProcesses = [];
        
        for (const stage of stageKeys) {
            try {
                const stageProcesses = await selectionClient.listByStage(stage);
                allProcesses.push(...stageProcesses);
            } catch (e) {
                console.log(`Nenhum processo em ${stage}`);
            }
        }
        
        processes = allProcesses;
        filteredProcesses = [...processes];
        renderKanban();
    } catch (error) {
        console.error('Erro ao carregar processos:', error);
        showNotification('Erro ao carregar processos. Carregando dados de demonstração.', 'warning');
        
        // Carrega dados mock para demonstração
        loadMockData();
    } finally {
        showLoading(false);
    }
}

/**
 * Carrega dados mock para demonstração
 */
function loadMockData() {
    // Mock data baseado no SelectionKanbanCardDTO do backend
    processes = [
        {
            processId: 1,
            candidateId: 1,
            candidateName: 'João da Silva',
            vacancyId: 1,
            vacancyTitle: 'Desenvolvedor Java',
            workModel: 'remoto',
            contractType: 'CLT',
            managerName: 'Carlos Manager',
            currentStage: 'triagem_inicial',
            progress: 10.0,
            createdAt: '2025-10-10T09:30:00'
        },
        {
            processId: 2,
            candidateId: 2,
            candidateName: 'Maria Oliveira',
            vacancyId: 2,
            vacancyTitle: 'Analista de Dados',
            workModel: 'presencial',
            contractType: 'PJ',
            managerName: 'Carlos Manager',
            currentStage: 'entrevista_tecnica',
            progress: 65.0,
            createdAt: '2025-10-12T14:00:00'
        },
        {
            processId: 3,
            candidateId: 3,
            candidateName: 'Carlos Souza',
            vacancyId: 1,
            vacancyTitle: 'Desenvolvedor Java',
            workModel: 'remoto',
            contractType: 'CLT',
            managerName: 'Carlos Manager',
            currentStage: 'proposta_fechamento',
            progress: 95.0,
            createdAt: '2025-10-13T10:00:00'
        }
    ];
    
    filteredProcesses = [...processes];
    renderKanban();
}

/**
 * Renderiza o Kanban completo
 */
function renderKanban() {
    const columns = document.querySelectorAll('.kanban-column');
    const stageKeys = Object.keys(STAGES);
    
    columns.forEach((column, index) => {
        const stageKey = column.dataset.stage || stageKeys[index];
        if (!column.dataset.stage) column.dataset.stage = stageKey;
        
        const content = column.querySelector('.column-content');
        if (!content) return;
        
        content.innerHTML = '';
        
        // Filtra processos desta etapa
        const stageProcesses = filteredProcesses.filter(p => {
            return p.currentStage === stageKey;
        });
        
        // Ordena por progresso (maior primeiro)
        stageProcesses.sort((a, b) => b.progress - a.progress);
        
        // Renderiza cards
        stageProcesses.forEach(process => {
            const card = createProcessCard(process, stageKey);
            content.appendChild(card);
        });
        
        // Atualiza contador
        updateColumnCount(column, stageProcesses.length);
    });
}

/**
 * Cria card do processo seletivo
 * @param {Object} process - Dados do SelectionKanbanCardDTO
 * @param {string} stage - Etapa atual
 */
function createProcessCard(process, stage) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.id = process.processId;
    card.dataset.stage = stage;
    
    const isLastStage = stage === 'contratacao';
    const isProposta = stage === 'proposta_fechamento';
    
    card.innerHTML = `
        <div class="card-header">
            <h4>${escapeHtml(process.candidateName)}</h4>
            <span class="progress-badge">${process.progress.toFixed(0)}%</span>
        </div>
        <div class="card-content">
            <p><strong>Vaga:</strong> ${escapeHtml(process.vacancyTitle)}</p>
            <p><strong>Modelo:</strong> ${escapeHtml(process.workModel || 'N/A')}</p>
            <p><strong>Contrato:</strong> ${escapeHtml(process.contractType || 'N/A')}</p>
            <p><strong>Gestor:</strong> ${escapeHtml(process.managerName || 'N/A')}</p>
        </div>
        <div class="card-actions">
            ${isLastStage ? `
                <span class="badge badge-success">Contratado!</span>
            ` : isProposta ? `
                <button class="btn-action btn-success" data-action="advance" data-id="${process.processId}">
                    Finalizar Contratação
                </button>
            ` : `
                <button class="btn-action btn-primary" data-action="advance" data-id="${process.processId}">
                    Avançar
                </button>
            `}
            <button class="btn-action btn-secondary" data-action="details" data-id="${process.candidateId}">
                Ver Candidato
            </button>
        </div>
    `;
    
    // Configura drag and drop
    card.addEventListener('dragstart', (e) => {
        draggedElement = card;
        draggedProcessId = process.processId;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });
    
    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        draggedElement = null;
        draggedProcessId = null;
        
        // Remove classe drag-over de todas as colunas
        document.querySelectorAll('.kanban-column').forEach(col => {
            col.classList.remove('drag-over');
        });
    });
    
    return card;
}

/**
 * Atualiza contador da coluna
 * @param {HTMLElement} column - Elemento da coluna
 * @param {number} count - Número de candidatos
 */
function updateColumnCount(column, count) {
    let countElement = column.querySelector('.column-header .count');
    if (!countElement) {
        countElement = document.createElement('span');
        countElement.className = 'count';
        const header = column.querySelector('.column-header');
        if (header) header.appendChild(countElement);
    }
    countElement.textContent = count;
}

/**
 * Manipula ações nos cards
 * @param {Event} e - Evento de click
 */
async function handleCardActions(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    
    // Desabilita botão temporariamente
    btn.disabled = true;
    
    try {
        switch (action) {
            case 'advance':
                await advanceProcess(id);
                break;
            case 'approve':
                await approveProcess(id);
                break;
            case 'reject':
                await rejectProcess(id);
                break;
            case 'details':
                viewCandidateDetails(id);
                break;
        }
    } finally {
        btn.disabled = false;
    }
}

/**
 * Avança processo para próxima etapa
 * @param {string|number} id - ID do processo
 */
async function advanceProcess(id) {
    try {
        const process = processes.find(p => p.processId == id);
        if (!process) return;
        
        const stageOrder = Object.keys(STAGES);
        const currentIndex = stageOrder.indexOf(process.currentStage);
        
        if (currentIndex < stageOrder.length - 1) {
            const nextStage = stageOrder[currentIndex + 1];
            
            // Tenta atualizar no backend usando o endpoint correto
            try {
                await selectionClient.updateStage(id, nextStage);
            } catch (e) {
                console.log('Erro ao atualizar no backend, atualizando localmente');
            }
            
            // Atualiza localmente
            process.currentStage = nextStage;
            process.progress = calculateProgress(nextStage);
            
            renderKanban();
            showNotification(`${process.candidateName} avançou para ${STAGES[nextStage].title}!`, 'success');
        }
    } catch (error) {
        console.error('Erro ao avançar processo:', error);
        showNotification('Erro ao avançar processo!', 'danger');
    }
}

/**
 * Calcula progresso baseado na etapa
 * @param {string} stage - Etapa atual
 */
function calculateProgress(stage) {
    const stageOrder = Object.keys(STAGES);
    const index = stageOrder.indexOf(stage);
    return ((index + 1) / stageOrder.length) * 100;
}

/**
 * Move processo para uma etapa específica (drag & drop)
 * @param {string|number} id - ID do processo
 * @param {string} newStage - Nova etapa
 */
async function moveProcessToStage(id, newStage) {
    try {
        const process = processes.find(p => p.processId == id);
        if (!process || !newStage) return;
        
        const oldStage = process.currentStage;
        if (oldStage === newStage) return;
        
        // Tenta atualizar no backend
        try {
            await selectionClient.updateStage(id, newStage);
        } catch (e) {
            console.log('Erro ao atualizar no backend, atualizando localmente');
        }
        
        // Atualiza localmente
        process.currentStage = newStage;
        process.progress = calculateProgress(newStage);
        
        renderKanban();
        showNotification(`${process.candidateName} movido para ${STAGES[newStage]?.title || newStage}!`, 'success');
    } catch (error) {
        console.error('Erro ao mover processo:', error);
        showNotification('Erro ao mover processo!', 'danger');
    }
}

/**
 * Aprova processo (contratação)
 * @param {string|number} id - ID do processo
 */
async function approveProcess(id) {
    if (!confirm('Confirma a APROVAÇÃO/CONTRATAÇÃO deste candidato?')) return;
    
    try {
        const process = processes.find(p => p.processId == id);
        if (!process) return;
        
        // Move para etapa de contratação
        try {
            await selectionClient.updateStage(id, 'contratacao');
        } catch (e) {
            console.log('Erro ao atualizar no backend');
        }
        
        // Atualiza localmente
        process.currentStage = 'contratacao';
        process.progress = 100;
        
        renderKanban();
        showNotification(`🎉 ${process.candidateName} foi APROVADO! Parabéns!`, 'success');
    } catch (error) {
        console.error('Erro ao aprovar processo:', error);
        showNotification('Erro ao aprovar candidato!', 'danger');
    }
}

/**
 * Reprova processo
 * @param {string|number} id - ID do processo
 */
async function rejectProcess(id) {
    const reason = prompt('Motivo da reprovação (opcional):');
    if (reason === null) return; // Cancelou
    
    try {
        const process = processes.find(p => p.processId == id);
        if (!process) return;
        
        // Remove da lista local (no backend seria um update de status)
        processes = processes.filter(p => p.processId != id);
        filteredProcesses = filteredProcesses.filter(p => p.processId != id);
        
        renderKanban();
        showNotification(`${process.candidateName} foi reprovado.`, 'warning');
    } catch (error) {
        console.error('Erro ao reprovar processo:', error);
        showNotification('Erro ao reprovar candidato!', 'danger');
    }
}

/**
 * Visualiza detalhes do candidato
 * @param {string|number} id - ID do candidato
 */
function viewCandidateDetails(id) {
    // Salva no localStorage para a página de detalhes
    localStorage.setItem('selectedCandidate', id);
    window.location.href = `detalhes-candidato.html?id=${id}`;
}

/**
 * Manipula busca de processos
 * @param {Event} e - Evento de input
 */
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredProcesses = [...processes];
    } else {
        filteredProcesses = processes.filter(p => {
            const candidateName = (p.candidateName || '').toLowerCase();
            const vacancyTitle = (p.vacancyTitle || '').toLowerCase();
            const managerName = (p.managerName || '').toLowerCase();
            
            return candidateName.includes(searchTerm) || 
                   vacancyTitle.includes(searchTerm) || 
                   managerName.includes(searchTerm);
        });
    }
    
    renderKanban();
}

/**
 * Retorna status baseado na etapa
 * @param {string} stage - Etapa
 */
function getStatusByStage(stage) {
    const statusMap = {
        triagem: 'Em triagem',
        entrevista_rh: 'Entrevista RH agendada',
        entrevista_gestor: 'Entrevista com Gestor'
    };
    return statusMap[stage] || 'Em processo';
}

/**
 * Exibe loading
 * @param {boolean} show - Mostrar ou esconder
 */
function showLoading(show) {
    const columns = document.querySelectorAll('.column-content');
    columns.forEach(column => {
        if (show) {
            column.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="sr-only">Carregando...</span>
                    </div>
                </div>
            `;
        }
    });
}

/**
 * Exibe notificação
 * @param {string} message - Mensagem
 * @param {string} type - Tipo (success, danger, warning, info)
 */
function showNotification(message, type = 'info') {
    document.querySelectorAll('.kanban-notification').forEach(el => el.remove());
    
    const colors = {
        success: '#28a745',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    const notification = document.createElement('div');
    notification.className = 'kanban-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        background-color: ${colors[type] || colors.info};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
    `;
    notification.innerHTML = `
        ${message}
        <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;margin-left:15px;cursor:pointer;font-size:18px;">
            &times;
        </button>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification.parentNode) notification.remove();
    }, 4000);
}

/**
 * Escapa HTML para prevenir XSS
 * @param {string} text - Texto
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Exporta funções globais
window.advanceProcess = advanceProcess;
window.approveProcess = approveProcess;
window.rejectProcess = rejectProcess;
window.viewCandidateDetails = viewCandidateDetails;
