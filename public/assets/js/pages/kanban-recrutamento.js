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
    triagem: { key: 'triagem', title: 'Triagem', order: 1 },
    triagem_inicial: { key: 'triagem_inicial', title: 'Triagem Inicial', order: 1 },
    entrevista_rh: { key: 'entrevista_rh', title: 'Entrevista RH', order: 2 },
    avaliacao_fit_cultural: { key: 'avaliacao_fit_cultural', title: 'Fit Cultural', order: 3 },
    teste_tecnico: { key: 'teste_tecnico', title: 'Teste Técnico', order: 4 },
    entrevista_tecnica: { key: 'entrevista_tecnica', title: 'Entrevista Técnica', order: 5 },
    entrevista_final: { key: 'entrevista_final', title: 'Entrevista Final', order: 6 },
    proposta_fechamento: { key: 'proposta_fechamento', title: 'Proposta', order: 7 },
    contratacao: { key: 'contratacao', title: 'Contratação', order: 8 }
};

// Mapeamento de nomes de stage do backend para os nomes esperados pelo frontend
// Inclui variações comuns que o backend pode retornar
const STAGE_MAPPING = {
    // Aguardando Triagem
    'aguardando_triagem': 'aguardando_triagem',
    'aguardando triagem': 'aguardando_triagem',
    'aguardandotriagem': 'aguardando_triagem',
    'waiting_screening': 'aguardando_triagem',
    'pendente': 'aguardando_triagem',
    // Triagem
    'triagem': 'triagem',
    'screening': 'triagem',
    // Triagem Inicial
    'triagem_inicial': 'triagem_inicial',
    'triagem inicial': 'triagem_inicial',
    'triageminicial': 'triagem_inicial',
    'initial_screening': 'triagem_inicial',
    // Fit Cultural
    'avaliacao_fit_cultural': 'avaliacao_fit_cultural',
    'avaliacao fit cultural': 'avaliacao_fit_cultural',
    'avaliacaofitcultural': 'avaliacao_fit_cultural',
    'fit_cultural': 'avaliacao_fit_cultural',
    'cultural_fit': 'avaliacao_fit_cultural',
    // Teste Técnico
    'teste_tecnico': 'teste_tecnico',
    'teste tecnico': 'teste_tecnico',
    'testetecnico': 'teste_tecnico',
    'technical_test': 'teste_tecnico',
    // Entrevista Técnica
    'entrevista_tecnica': 'entrevista_tecnica',
    'entrevista tecnica': 'entrevista_tecnica',
    'entrevistatecnica': 'entrevista_tecnica',
    'technical_interview': 'entrevista_tecnica',
    // Entrevista RH
    'entrevista_rh': 'entrevista_rh',
    'entrevista rh': 'entrevista_rh',
    'entrevistarh': 'entrevista_rh',
    'hr_interview': 'entrevista_rh',
    // Entrevista Final
    'entrevista_final': 'entrevista_final',
    'entrevista final': 'entrevista_final',
    'entrevistafinal': 'entrevista_final',
    'final_interview': 'entrevista_final',
    // Proposta
    'proposta_fechamento': 'proposta_fechamento',
    'proposta fechamento': 'proposta_fechamento',
    'propostafechamento': 'proposta_fechamento',
    'proposta': 'proposta_fechamento',
    'offer': 'proposta_fechamento',
    // Contratação
    'contratacao': 'contratacao',
    'contratação': 'contratacao',
    'hired': 'contratacao',
    'hiring': 'contratacao'
};

// Flag para forçar dados de teste (útil para desenvolvimento)
const FORCE_MOCK_DATA = false; // Mude para true para sempre carregar dados de teste

// Verificar se o usuário é gestor (apenas visualização, sem edição)
let isManager = false;

// Função para verificar permissão do usuário
function checkUserPermission() {
    try {
        const userLoggedStr = localStorage.getItem('userLogged') || localStorage.getItem('currentUser');
        if (userLoggedStr) {
            const user = JSON.parse(userLoggedStr);
            // Usar window.Utils para garantir acesso ao utilitário
            const UtilsRef = window.Utils || Utils;
            if (UtilsRef && typeof UtilsRef.normalizeLevelAccess === 'function') {
                const userLevel = UtilsRef.normalizeLevelAccess(user.levelAccess || user.level_access);
                isManager = userLevel === 'MANAGER';
                
                if (isManager) {
                    console.log('👁️ [Kanban] Modo visualização ativado para gestor');
                }
                return true; // Utils disponível e verificação concluída
            } else {
                console.warn('⚠️ [Kanban] Utils não disponível, verificando levelAccess diretamente');
                // Fallback: verificação direta
                const levelAccess = String(user.levelAccess || user.level_access || '').toUpperCase();
                isManager = levelAccess === 'MANAGER' || levelAccess === '3';
                return false; // Utils não disponível, mas verificação feita com fallback
            }
        }
    } catch (error) {
        console.error('Erro ao verificar permissão:', error);
    }
    return false;
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    // Aguardar Utils estar disponível antes de verificar permissões
    const waitForUtils = () => {
        if (window.Utils && typeof window.Utils.normalizeLevelAccess === 'function') {
            checkUserPermission();
            initKanban();
        } else {
            // Tentar novamente após um pequeno delay
            setTimeout(waitForUtils, 50);
        }
    };
    
    // Iniciar verificação
    waitForUtils();
});

/**
 * Inicializa o Kanban
 */
async function initKanban() {
    console.log('🚀 [Kanban] Inicializando...');
    
    // Verificar se veio da tela de Match (indica que um novo card foi criado)
    const urlParams = new URLSearchParams(window.location.search);
    const fromMatch = urlParams.get('focusStage') !== null;
    
    if (fromMatch) {
        console.log('🎯 [Kanban] Vindo da tela de Match - forçando carregamento da API');
    }
    
    setupColumnDataAttributes();
    setupEventListeners();
    setupDragAndDrop();
    
    // Carrega processos da API
    await loadProcesses();
    
    // Verificar se veio da tela de Match com foco em uma coluna específica
    handleFocusStageFromURL();
}

/**
 * Verifica parâmetros de URL para foco em coluna específica
 * Usado quando usuário vem da tela de Match após aprovar um candidato
 */
function handleFocusStageFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const focusStage = urlParams.get('focusStage');
    
    if (focusStage) {
        console.log('🎯 [Kanban] Foco solicitado na coluna:', focusStage);
        
        // Pequeno delay para garantir que a página está renderizada
        setTimeout(() => {
            focusOnColumn(focusStage);
            
            // Limpar o parâmetro da URL sem recarregar a página
            const newURL = window.location.pathname;
            window.history.replaceState({}, document.title, newURL);
        }, 500);
    }
}

/**
 * Foca em uma coluna específica do Kanban
 * @param {string} stage - O stage da coluna (ex: 'aguardando_triagem')
 */
function focusOnColumn(stage) {
    // Tentar encontrar pelo ID primeiro
    let column = document.getElementById(`col-${stage}`);
    
    // Se não encontrar pelo ID, buscar pelo data-stage
    if (!column) {
        column = document.querySelector(`.kanban-column[data-stage="${stage}"]`);
    }
    
    if (column) {
        // Scroll suave até a coluna
        column.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        
        // Adicionar highlight temporário na coluna
        column.classList.add('column-highlight');
        
        // Mostrar notificação
        showNotification('Candidato aprovado! Card adicionado na coluna "Aguardando Triagem"', 'success');
        
        // Remover highlight após 3 segundos
        setTimeout(() => {
            column.classList.remove('column-highlight');
        }, 3000);
    } else {
        console.warn('⚠️ [Kanban] Coluna não encontrada:', stage);
    }
}

/**
 * Mostra notificação na página do Kanban
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo da notificação (success, info, warning, error)
 */
function showNotification(message, type = 'info') {
    // Remove notificação anterior se existir
    const existingNotification = document.querySelector('.kanban-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `kanban-notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Inserir no início do container principal
    const container = document.querySelector('.container-fluid');
    if (container) {
        container.insertBefore(notification, container.firstChild);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            notification.classList.add('notification-fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
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
        
        // Se for gestor, não permite drag and drop
        if (isManager) {
            content.style.cursor = 'not-allowed';
            content.style.opacity = '0.7';
            // do not register drag/drop listeners
            return;
        }
        
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
                if (newStage) {
                    await moveProcessToStage(draggedProcessId, newStage);
                }
            }
        });
    });
}

/**
 * Carrega processos seletivos do backend
 */
async function loadProcesses() {
    console.log('📥 [loadProcesses] Iniciando carregamento de processos...');
    
    // Verifica se veio da tela de Match (não deve usar mock)
    const urlParams = new URLSearchParams(window.location.search);
    const fromMatch = urlParams.get('focusStage') !== null;
    
    // Se a flag estiver ativa E não veio do Match, força o carregamento dos dados mock
    if (FORCE_MOCK_DATA && !fromMatch) {
        console.log('🔧 Modo de teste ativado - carregando dados mock');
        loadMockData();
        return;
    }
    
    try {
        showLoading(true);
        
        // Tenta buscar todos os processos de uma vez (mais eficiente)
        let allProcesses = [];
        let apiError = false;
        
        try {
            console.log('📤 [loadProcesses] Chamando API: selectionClient.findAllKanban()');
            allProcesses = await selectionClient.findAllKanban();
            console.log('✅ [loadProcesses] Processos carregados da API:', allProcesses?.length || 0);
            console.log('📋 [loadProcesses] Dados brutos da API:', JSON.stringify(allProcesses, null, 2));
        } catch (error) {
            console.warn('⚠️ Erro ao buscar todos os processos, tentando por etapa:', error);
            apiError = true;
            
            // Fallback: carrega processo por processo de cada etapa
            const stageKeys = Object.keys(STAGES);
            for (const stage of stageKeys) {
                try {
                    console.log(`📤 [loadProcesses] Tentando buscar estágio: ${stage}`);
                    const stageProcesses = await selectionClient.listByStage(stage);
                    if (Array.isArray(stageProcesses)) {
                        console.log(`✅ [loadProcesses] Estágio ${stage}: ${stageProcesses.length} processos`);
                        allProcesses.push(...stageProcesses);
                    }
                } catch (e) {
                    console.log(`ℹ️ [loadProcesses] Nenhum processo em ${stage}`);
                }
            }
        }
        
        // Garante que temos um array válido
        if (!Array.isArray(allProcesses)) {
            console.warn('⚠️ [loadProcesses] allProcesses não é um array, convertendo para array vazio');
            allProcesses = [];
        }
        
        console.log(`📊 [loadProcesses] Total de processos encontrados: ${allProcesses.length}`);
        
        // Se não há processos e NÃO veio do Match, carrega dados mock para demonstração
        if (allProcesses.length === 0 && !fromMatch) {
            console.log('📦 Nenhum processo encontrado. Carregando dados de teste...');
            loadMockData();
            return;
        }
        
        // Se veio do Match e não encontrou processos, mostra kanban vazio (o card deve estar lá!)
        if (allProcesses.length === 0 && fromMatch) {
            console.warn('⚠️ [loadProcesses] Veio do Match mas nenhum processo encontrado na API!');
            console.warn('⚠️ Verifique se o backend criou o card corretamente no endpoint POST /match/{matchId}/accept');
            processes = [];
            filteredProcesses = [];
            renderKanban([]);
            return;
        }
        
        // Mapeia dados do KanbanCardDTO para o formato esperado pelo frontend
        console.log('🔄 [loadProcesses] Mapeando processos...');
        processes = allProcesses.map(card => mapKanbanCardToProcess(card));
        filteredProcesses = [...processes];
        
        console.log('📊 [loadProcesses] Processos mapeados:', processes.length);
        console.log('📊 [loadProcesses] Stages encontrados:', [...new Set(processes.map(p => p.currentStage))]);
        
        // Log específico para aguardando_triagem
        const aguardandoTriagem = processes.filter(p => p.currentStage === 'aguardando_triagem');
        console.log(`🎯 [loadProcesses] Processos em "aguardando_triagem": ${aguardandoTriagem.length}`);
        if (aguardandoTriagem.length > 0) {
            console.log('🎯 [loadProcesses] Cards em aguardando_triagem:', aguardandoTriagem.map(p => p.candidateName));
        }
        
        renderKanban(filteredProcesses);
        
    } catch (error) {
        console.error('❌ [loadProcesses] Erro ao carregar processos:', error);
        console.log('📦 Carregando dados de teste devido ao erro...');
        
        // Carrega dados mock para demonstração
        loadMockData();
    } finally {
        showLoading(false);
    }
}

/**
 * Mapeia KanbanCardDTO do backend para formato do frontend
 * @param {Object} card - KanbanCardDTO do backend
 */
function mapKanbanCardToProcess(card) {
    console.log('🔄 [mapKanbanCardToProcess] Card recebido do backend:', JSON.stringify(card, null, 2));
    
    // O backend pode retornar currentStage diretamente ou stage.name
    let rawStage = card.currentStage || 
                   card.stage?.name || 
                   card.stageName || 
                   card.stage || 
                   card.current_stage ||
                   'aguardando_triagem';
    
    // Normaliza o nome do stage: lowercase, trim, remove espaços extras
    let stage = String(rawStage)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')  // Substitui espaços por underscore
        .replace(/-/g, '_');   // Substitui hífen por underscore
    
    // Mapeia para o nome esperado pelo frontend se necessário
    const mappedStage = STAGE_MAPPING[stage] || stage;
    
    console.log(`🔄 Mapeando card: stage original="${rawStage}", normalizado="${stage}", mapeado="${mappedStage}"`);
    
    // Verifica se o stage mapeado existe no STAGES
    if (!STAGES[mappedStage]) {
        console.warn(`⚠️ Stage "${mappedStage}" não encontrado em STAGES! Usando "aguardando_triagem" como fallback.`);
    }
    
    const mapped = {
        id: card.processId || card.id || card.cardId || card.selectionProcessId,
        processId: card.processId || card.id || card.cardId || card.selectionProcessId,
        candidateId: card.candidateId || card.candidate_id || card.fk_candidate,
        candidateName: card.candidateName || card.candidate_name || card.candidate?.name || 'Candidato',
        vacancyTitle: card.vacancyTitle || card.vacancy_title || card.vacancyJob || card.vacancy?.position_job || 'Vaga não especificada',
        vacancyId: card.vacancyId || card.vacancy_id || card.fk_vacancy,
        workModel: card.workModel || card.work_model || 'N/A',
        contractType: card.contractType || card.contract_type || 'N/A',
        managerName: card.managerName || card.manager_name || 'N/A',
        currentStage: STAGES[mappedStage] ? mappedStage : 'aguardando_triagem',
        progress: card.progress || calculateProgress(mappedStage)
    };
    
    console.log(`✅ Card mapeado:`, mapped);
    return mapped;
}

/**
 * Carrega dados mock para demonstração
 */
function loadMockData() {
    console.log('📦 Iniciando carregamento de dados mock...');
    
    // Mock data baseado no SelectionKanbanCardDTO do backend
    // Dados de teste distribuídos em todas as etapas do processo
    processes = [
        // Aguardando Triagem
        {
            processId: 1,
            candidateId: 1,
            candidateName: 'João da Silva',
            vacancyId: 1,
            vacancyTitle: 'Desenvolvedor Java Sênior',
            workModel: 'remoto',
            contractType: 'CLT',
            managerName: 'Carlos Manager',
            currentStage: 'aguardando_triagem',
            progress: 0.0,
            createdAt: '2025-01-15T09:30:00'
        },
        {
            processId: 2,
            candidateId: 2,
            candidateName: 'Pedro Almeida',
            vacancyId: 2,
            vacancyTitle: 'Analista de Dados',
            workModel: 'presencial',
            contractType: 'PJ',
            managerName: 'Ana Gestora',
            currentStage: 'aguardando_triagem',
            progress: 0.0,
            createdAt: '2025-01-16T10:15:00'
        },
        {
            processId: 3,
            candidateId: 3,
            candidateName: 'Fernanda Costa',
            vacancyId: 3,
            vacancyTitle: 'Designer UX/UI',
            workModel: 'híbrido',
            contractType: 'CLT',
            managerName: 'Maria Gestora',
            currentStage: 'aguardando_triagem',
            progress: 0.0,
            createdAt: '2025-01-17T11:00:00'
        },
        
        // Triagem Inicial
        {
            processId: 4,
            candidateId: 4,
            candidateName: 'Maria Oliveira',
            vacancyId: 1,
            vacancyTitle: 'Desenvolvedor Java Sênior',
            workModel: 'remoto',
            contractType: 'CLT',
            managerName: 'Carlos Manager',
            currentStage: 'triagem_inicial',
            progress: 12.5,
            createdAt: '2025-01-10T14:00:00'
        },
        {
            processId: 5,
            candidateId: 5,
            candidateName: 'Ricardo Santos',
            vacancyId: 4,
            vacancyTitle: 'Product Manager',
            workModel: 'remoto',
            contractType: 'CLT',
            managerName: 'João Gestor',
            currentStage: 'triagem_inicial',
            progress: 12.5,
            createdAt: '2025-01-12T15:30:00'
        },
        
        // Fit Cultural
        {
            processId: 6,
            candidateId: 6,
            candidateName: 'Juliana Pereira',
            vacancyId: 5,
            vacancyTitle: 'Scrum Master',
            workModel: 'híbrido',
            contractType: 'CLT',
            managerName: 'Ana Gestora',
            currentStage: 'avaliacao_fit_cultural',
            progress: 25.0,
            createdAt: '2025-01-08T09:00:00'
        },
        {
            processId: 7,
            candidateId: 7,
            candidateName: 'Lucas Ferreira',
            vacancyId: 6,
            vacancyTitle: 'Arquiteto de Software',
            workModel: 'remoto',
            contractType: 'PJ',
            managerName: 'Carlos Manager',
            currentStage: 'avaliacao_fit_cultural',
            progress: 25.0,
            createdAt: '2025-01-09T10:20:00'
        },
        
        // Teste Técnico
        {
            processId: 8,
            candidateId: 8,
            candidateName: 'Amanda Rocha',
            vacancyId: 7,
            vacancyTitle: 'Desenvolvedor Full-Stack',
            workModel: 'presencial',
            contractType: 'CLT',
            managerName: 'Maria Gestora',
            currentStage: 'teste_tecnico',
            progress: 37.5,
            createdAt: '2025-01-05T08:45:00'
        },
        {
            processId: 9,
            candidateId: 9,
            candidateName: 'Bruno Lima',
            vacancyId: 8,
            vacancyTitle: 'DevOps Engineer',
            workModel: 'remoto',
            contractType: 'CLT',
            managerName: 'João Gestor',
            currentStage: 'teste_tecnico',
            progress: 37.5,
            createdAt: '2025-01-06T13:15:00'
        },
        {
            processId: 10,
            candidateId: 10,
            candidateName: 'Carla Mendes',
            vacancyId: 9,
            vacancyTitle: 'QA Engineer',
            workModel: 'híbrido',
            contractType: 'CLT',
            managerName: 'Ana Gestora',
            currentStage: 'teste_tecnico',
            progress: 37.5,
            createdAt: '2025-01-07T14:30:00'
        },
        
        // Entrevista Técnica
        {
            processId: 11,
            candidateId: 11,
            candidateName: 'Carlos Souza',
            vacancyId: 1,
            vacancyTitle: 'Desenvolvedor Java Sênior',
            workModel: 'remoto',
            contractType: 'CLT',
            managerName: 'Carlos Manager',
            currentStage: 'entrevista_tecnica',
            progress: 50.0,
            createdAt: '2025-01-03T10:00:00'
        },
        {
            processId: 12,
            candidateId: 12,
            candidateName: 'Daniela Alves',
            vacancyId: 10,
            vacancyTitle: 'Tech Lead',
            workModel: 'remoto',
            contractType: 'CLT',
            managerName: 'João Gestor',
            currentStage: 'entrevista_tecnica',
            progress: 50.0,
            createdAt: '2025-01-04T11:20:00'
        },
        
        // Entrevista Final
        {
            processId: 13,
            candidateId: 13,
            candidateName: 'Eduardo Martins',
            vacancyId: 11,
            vacancyTitle: 'Backend Developer',
            workModel: 'presencial',
            contractType: 'PJ',
            managerName: 'Maria Gestora',
            currentStage: 'entrevista_final',
            progress: 62.5,
            createdAt: '2025-01-01T09:00:00'
        },
        {
            processId: 14,
            candidateId: 14,
            candidateName: 'Gabriela Silva',
            vacancyId: 12,
            vacancyTitle: 'Frontend Developer',
            workModel: 'híbrido',
            contractType: 'CLT',
            managerName: 'Ana Gestora',
            currentStage: 'entrevista_final',
            progress: 62.5,
            createdAt: '2025-01-02T15:00:00'
        },
        
        // Proposta
        {
            processId: 15,
            candidateId: 15,
            candidateName: 'Ana Paula',
            vacancyId: 3,
            vacancyTitle: 'Designer UX/UI',
            workModel: 'híbrido',
            contractType: 'CLT',
            managerName: 'Maria Gestora',
            currentStage: 'proposta_fechamento',
            progress: 75.0,
            createdAt: '2024-12-28T10:00:00'
        },
        {
            processId: 16,
            candidateId: 16,
            candidateName: 'Henrique Oliveira',
            vacancyId: 13,
            vacancyTitle: 'Data Scientist',
            workModel: 'remoto',
            contractType: 'CLT',
            managerName: 'João Gestor',
            currentStage: 'proposta_fechamento',
            progress: 75.0,
            createdAt: '2024-12-29T11:30:00'
        },
        {
            processId: 17,
            candidateId: 17,
            candidateName: 'Isabela Costa',
            vacancyId: 14,
            vacancyTitle: 'Business Analyst',
            workModel: 'presencial',
            contractType: 'CLT',
            managerName: 'Carlos Manager',
            currentStage: 'proposta_fechamento',
            progress: 75.0,
            createdAt: '2024-12-30T14:00:00'
        },
        
        // Contratação
        {
            processId: 18,
            candidateId: 18,
            candidateName: 'Roberto Nunes',
            vacancyId: 15,
            vacancyTitle: 'Cloud Architect',
            workModel: 'remoto',
            contractType: 'PJ',
            managerName: 'Ana Gestora',
            currentStage: 'contratacao',
            progress: 100.0,
            createdAt: '2024-12-25T09:00:00'
        },
        {
            processId: 19,
            candidateId: 19,
            candidateName: 'Sandra Vieira',
            vacancyId: 16,
            vacancyTitle: 'Security Engineer',
            workModel: 'híbrido',
            contractType: 'CLT',
            managerName: 'Maria Gestora',
            currentStage: 'contratacao',
            progress: 100.0,
            createdAt: '2024-12-26T10:15:00'
        }
    ];
    
    console.log(`✅ ${processes.length} processos mock criados`);
    filteredProcesses = [...processes];
    console.log('🔄 Renderizando kanban com dados mock...');
    renderKanban(filteredProcesses);
    console.log('✅ Kanban renderizado!');
    showNotification(`✅ ${processes.length} processos de teste carregados!`, 'success');
}

/**
 * Renderiza o Kanban completo
 */
function renderKanban(processesToRender = []) {
    console.log('🎨 renderKanban chamado com', processesToRender?.length || 0, 'processos');
    
    const columns = document.querySelectorAll('.kanban-column');
    const stageKeys = Object.keys(STAGES);
    
    if (!processesToRender || processesToRender.length === 0) {
        processesToRender = filteredProcesses || [];
        console.log('⚠️ Nenhum processo fornecido, usando filteredProcesses:', processesToRender.length);
    }

    if (!columns || columns.length === 0) {
        console.error('❌ Nenhuma coluna encontrada no DOM!');
        return;
    }

    console.log(`📊 Renderizando ${columns.length} colunas...`);

    columns.forEach((column, index) => {
        const stageKey = column.dataset.stage || stageKeys[index];
        if (!column.dataset.stage) column.dataset.stage = stageKey;
        
        const content = column.querySelector('.column-content');
        if (!content) {
            console.warn(`⚠️ Coluna ${stageKey} não tem .column-content`);
            return;
        }
        
        content.innerHTML = '';
        
        // Filtra processos desta etapa
        const stageProcesses = processesToRender.filter(p => {
            if (!p) return false;
            
            // Usa currentStage que já foi mapeado na função mapKanbanCardToProcess
            const processStage = p.currentStage || 
                                p.stage?.name || 
                                p.stageName || 
                                p.stage;
            
            // Compara normalizando (lowercase e trim)
            const processStageNormalized = String(processStage || '').toLowerCase().trim();
            const stageKeyNormalized = String(stageKey || '').toLowerCase().trim();
            
            const matches = processStageNormalized === stageKeyNormalized;
            if (matches) {
                console.log(`✅ Processo ${p.id || p.processId} (${p.candidateName || 'sem nome'}) na etapa ${stageKey} (stage: ${processStage})`);
            }
            return matches;
        });

        console.log(`📋 Etapa ${stageKey}: ${stageProcesses.length} processos`);

        // Ordena por progresso (maior primeiro)
        stageProcesses.sort((a, b) => {
            return (b.progress || 0) - (a.progress || 0);
        });
        
        // Renderiza cards
        stageProcesses.forEach(process => {
            const card = createProcessCard(process, stageKey);
            content.appendChild(card);
        });
        
        // Atualiza contador
        updateColumnCount(column, stageProcesses.length);
    });
    
    console.log('✅ Renderização concluída!');
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
    // Usa o ID correto do card (pode ser id, cardId, ou processId)
    const cardId = process.id || process.cardId || process.processId;
    card.dataset.id = cardId;
    card.dataset.stage = stage;
    
    const isLastStage = stage === 'contratacao';
    const isProposta = stage === 'proposta_fechamento';
    
    // Extrai dados do processo (suporta diferentes estruturas de dados)
    const candidateName = process.candidateName || 
                         (process.candidate && typeof process.candidate === 'string' ? process.candidate : process.candidate?.name) || 
                         'Candidato';
    const vacancyTitle = process.vacancyTitle || 
                        (process.vacancy && typeof process.vacancy === 'string' ? process.vacancy : process.vacancy?.position_job) || 
                        'Vaga não especificada';
    const workModel = process.workModel || 
                     (process.vacancy && process.vacancy.workModel) || 
                     'N/A';
    const contractType = process.contractType || 
                        (process.vacancy && process.vacancy.contractType) || 
                        'N/A';
    const managerName = process.managerName || 
                       (process.managerId && typeof process.managerId === 'string' ? process.managerId : process.managerId?.name) || 
                       'N/A';
    const progress = process.progress || 0;
    const candidateId = process.candidateId || 
                       (process.candidate && process.candidate.id) || 
                       process.fk_candidate || 
                       null;
    const processId = process.id || process.cardId || process.processId;
    
    // Log para debug
    if (!candidateId) {
        console.warn('⚠️ Processo sem candidateId:', process);
    }
    
    // Se for gestor, não mostra botões de ação (apenas visualização)
    const actionButtons = isManager ? '' : (
        isLastStage ? `
            <span class="badge badge-success">Contratado!</span>
        ` : isProposta ? `
            <button class="btn-action btn-success" data-action="advance" data-id="${processId}">
                Finalizar Contratação
            </button>
        ` : `
            <button class="btn-action btn-primary" data-action="advance" data-id="${processId}">
                Avançar
            </button>
        `
    );
    
    card.innerHTML = `
        <div class="card-header">
            <h4>${escapeHtml(candidateName)}</h4>
            <span class="progress-badge">${progress.toFixed(0)}%</span>
        </div>
        <div class="card-content">
            <p><strong>Vaga:</strong> ${escapeHtml(vacancyTitle)}</p>
            <p><strong>Modelo:</strong> ${escapeHtml(workModel)}</p>
            <p><strong>Contrato:</strong> ${escapeHtml(contractType)}</p>
            <p><strong>Gestor:</strong> ${escapeHtml(managerName)}</p>
        </div>
        <div class="card-actions">
            ${actionButtons}
            ${candidateId ? `
                <button class="btn-action btn-secondary" data-action="details" data-id="${candidateId}">
                    Ver Candidato
                </button>
            ` : ''}
            ${isManager ? `
                <span class="badge badge-info">Somente Visualização</span>
            ` : ''}
        </div>
    `;
    
    // Configura drag and drop apenas se não for gestor
    if (!isManager) {
        card.addEventListener('dragstart', (e) => {
            draggedElement = card;
            draggedProcessId = processId;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
    } else {
        // Para gestores, desabilita drag
        card.draggable = false;
        card.style.cursor = 'default';
    }
    
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
    
    // Managers only allowed to view details
    if (isManager && action && action !== 'details') {
        if (window.Utils && typeof window.Utils.showMessage === 'function') {
            window.Utils.showMessage('Você não tem permissão para essa ação.', 'error');
        } else {
            alert('Você não tem permissão para essa ação.');
        }
        return;
    }
    
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
                console.log('🔍 Clicou em Ver Candidato, ID:', id);
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
        const process = processes.find(p => (p.processId || p.id) == id);
        if (!process) return;
        
        const stageOrder = Object.keys(STAGES);
        const currentIndex = stageOrder.indexOf(process.currentStage);
        
        if (currentIndex < stageOrder.length - 1) {
            const nextStage = stageOrder[currentIndex + 1];
            
            // Tenta atualizar no backend usando o endpoint correto
            let updatedCard;
            try {
                updatedCard = await selectionClient.updateStage(id, nextStage);
                console.log('✅ Card avançado no backend:', updatedCard);
                
                // Se o backend retornou o card atualizado, usa ele
                if (updatedCard) {
                    const mapped = mapKanbanCardToProcess(updatedCard);
                    const index = processes.findIndex(p => (p.processId || p.id) == id);
                    if (index >= 0) {
                        processes[index] = mapped;
                    }
                }
            } catch (e) {
                console.error('Erro ao atualizar no backend:', e);
                // Atualiza localmente como fallback
                process.currentStage = nextStage;
                process.progress = calculateProgress(nextStage);
            }
            
            // Atualiza filteredProcesses também
            const filteredIndex = filteredProcesses.findIndex(p => (p.processId || p.id) == id);
            if (filteredIndex >= 0) {
                filteredProcesses[filteredIndex] = process;
            }
            
            renderKanban(filteredProcesses);
            const candidateName = process.candidateName || 
                                 (process.candidate && typeof process.candidate === 'string' ? process.candidate : process.candidate?.name) || 
                                 'Candidato';
            showNotification(`${candidateName} avançou para ${STAGES[nextStage].title}!`, 'success');
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
        const process = processes.find(p => (p.processId || p.id) == id);
        if (!process || !newStage) return;
        
        const oldStage = process.currentStage;
        if (oldStage === newStage) return;
        
        // Tenta atualizar no backend
        let updatedCard;
        try {
            updatedCard = await selectionClient.updateStage(id, newStage);
            console.log('✅ Card atualizado no backend:', updatedCard);
            
            // Se o backend retornou o card atualizado, usa ele
            if (updatedCard) {
                const mapped = mapKanbanCardToProcess(updatedCard);
                const index = processes.findIndex(p => (p.processId || p.id) == id);
                if (index >= 0) {
                    processes[index] = mapped;
                }
                // Atualiza filteredProcesses também
                const filteredIndex = filteredProcesses.findIndex(p => (p.processId || p.id) == id);
                if (filteredIndex >= 0) {
                    filteredProcesses[filteredIndex] = mapped;
                }
            } else {
                // Fallback: atualiza localmente
                process.currentStage = newStage;
                process.progress = calculateProgress(newStage);
                const filteredIndex = filteredProcesses.findIndex(p => (p.processId || p.id) == id);
                if (filteredIndex >= 0) {
                    filteredProcesses[filteredIndex] = process;
                }
            }
        } catch (e) {
            console.error('Erro ao atualizar no backend:', e);
            // Atualiza localmente como fallback
            process.currentStage = newStage;
            process.progress = calculateProgress(newStage);
            const filteredIndex = filteredProcesses.findIndex(p => (p.processId || p.id) == id);
            if (filteredIndex >= 0) {
                filteredProcesses[filteredIndex] = process;
            }
        }
        
        renderKanban(filteredProcesses);
        const candidateName = process.candidateName || 
                             (process.candidate && typeof process.candidate === 'string' ? process.candidate : process.candidate?.name) || 
                             'Candidato';
        showNotification(`${candidateName} movido para ${STAGES[newStage]?.title || newStage}!`, 'success');
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
        const process = processes.find(p => (p.processId || p.id) == id);
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
        
        // Atualiza filteredProcesses também
        const filteredIndex = filteredProcesses.findIndex(p => (p.processId || p.id) == id);
        if (filteredIndex >= 0) {
            filteredProcesses[filteredIndex] = process;
        }
        
        renderKanban(filteredProcesses);
        const candidateName = process.candidateName || 
                             (process.candidate && typeof process.candidate === 'string' ? process.candidate : process.candidate?.name) || 
                             'Candidato';
        showNotification(`🎉 ${candidateName} foi APROVADO! Parabéns!`, 'success');
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
        const process = processes.find(p => (p.processId || p.id) == id);
        if (!process) return;
        
        // Remove da lista local (no backend seria um update de status)
        const processId = process.processId || process.id;
        processes = processes.filter(p => (p.processId || p.id) != id);
        filteredProcesses = filteredProcesses.filter(p => (p.processId || p.id) != id);
        
        renderKanban(filteredProcesses);
        const candidateName = process.candidateName || 
                             (process.candidate && typeof process.candidate === 'string' ? process.candidate : process.candidate?.name) || 
                             'Candidato';
        showNotification(`${candidateName} foi reprovado.`, 'warning');
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
    if (!id) {
        console.error('❌ ID do candidato não fornecido');
        showNotification('Erro: ID do candidato não encontrado', 'danger');
        return;
    }
    
    console.log('🔍 Visualizando detalhes do candidato ID:', id);
    
    // Salva no localStorage com a chave correta que a página de detalhes espera
    localStorage.setItem('selectedCandidateId', String(id));
    
    // Redireciona para a página de detalhes
    window.location.href = `detalhes-candidato.html?id=${id}`;
}

/**
 * Manipula busca de processos
 * @param {Event} e - Evento de input
 */
async function handleSearch(e) {
    const searchTerm = e.target.value.trim();
    
    if (!searchTerm) {
        filteredProcesses = [...processes];
        renderKanban(filteredProcesses);
        return;
    }
    
    try {
        // Usa o endpoint de busca do backend
        const searchResults = await selectionClient.searchCards(searchTerm);
        // Mapeia os resultados para o formato esperado
        filteredProcesses = searchResults.map(card => mapKanbanCardToProcess(card));
        renderKanban(filteredProcesses);
    } catch (error) {
        console.error('Erro ao buscar no backend, usando busca local:', error);
        // Fallback para busca local
        const searchTermLower = searchTerm.toLowerCase();
        filteredProcesses = processes.filter(p => {
            // Extrai nomes de diferentes estruturas de dados
            const candidateName = (
                p.candidateName || 
                (p.candidate && typeof p.candidate === 'string' ? p.candidate : p.candidate?.name) || 
                ''
            ).toLowerCase();
            
            const vacancyTitle = (
                p.vacancyTitle || 
                (p.vacancy && typeof p.vacancy === 'string' ? p.vacancy : p.vacancy?.position_job) || 
                ''
            ).toLowerCase();
            
            const managerName = (
                p.managerName || 
                (p.managerId && typeof p.managerId === 'string' ? p.managerId : p.managerId?.name) || 
                ''
            ).toLowerCase();
            
            return candidateName.includes(searchTermLower) || 
                   vacancyTitle.includes(searchTermLower) || 
                   managerName.includes(searchTermLower);
        });
        renderKanban(filteredProcesses);
    }
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
