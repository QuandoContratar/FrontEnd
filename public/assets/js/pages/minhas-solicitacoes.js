/* ========================================
   MINHAS SOLICITAÇÕES
   Gerenciamento de solicitações de vagas do gestor
   ======================================== */

import { OpeningRequestClient, VacanciesClient } from '../../../client/client.js';

// Instâncias dos clientes
let openingRequestClient;
let vacanciesClient;
try {
    openingRequestClient = new OpeningRequestClient();
    vacanciesClient = new VacanciesClient();
} catch (error) {
    console.error('Erro ao inicializar clientes:', error);
    // Fallback: criar objetos vazios para evitar erros
    openingRequestClient = {
        findByGestor: async () => [],
        findAll: async () => [],
        delete: async () => {},
        updateStatus: async () => {}
    };
    vacanciesClient = {
        insert: async () => ({}),
        sendToApproval: async () => [],
        findByManager: async () => []
    };
}

// Estado da página
let vacancies = [];
let filteredVacancies = [];
let currentDeleteId = null;
let currentUser = null;
let isLoading = false;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await initPage();
});

/**
 * Inicializa a página
 */
async function initPage() {
    // Pega usuário logado do localStorage - com logs detalhados
    const userLoggedStr = localStorage.getItem('userLogged');
    console.log('🔍 [minhas-solicitacoes] userLogged do localStorage (string):', userLoggedStr);
    
    try {
        currentUser = userLoggedStr ? JSON.parse(userLoggedStr) : null;
    } catch (e) {
        console.error('❌ [minhas-solicitacoes] Erro ao fazer parse do userLogged:', e);
        currentUser = null;
    }
    
    // Fallback se não encontrar
    if (!currentUser || !currentUser.id_user) {
        console.warn('⚠️ [minhas-solicitacoes] userLogged não encontrado ou inválido, usando fallback');
        currentUser = { id_user: 1, name: 'Lucio Limeira' };
    }
    
    console.log('👤 [minhas-solicitacoes] currentUser recuperado:', currentUser);
    console.log('👤 [minhas-solicitacoes] currentUser.id_user:', currentUser.id_user, 'tipo:', typeof currentUser.id_user);
    
    // Atualiza nome do usuário na topbar
    updateUserInfo();
    
    // Configura event listeners
    setupEventListeners();
    
    // Carrega as vagas (incluindo pendentes do localStorage)
    // NÃO envia automaticamente - apenas lista
    console.log('🔍 Iniciando carregamento de solicitações...');
    await loadVacancies();
}

/**
 * Atualiza informações do usuário na topbar
 */
function updateUserInfo() {
    const userSpan = document.querySelector('#userDropdown span');
    if (userSpan && currentUser) {
        userSpan.textContent = `${currentUser.name} | Gestor`;
    }
}

/**
 * Configura todos os event listeners
 */
function setupEventListeners() {
    // Busca
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Ordenação
    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSort);
    }

    // Botão Adicionar Vaga
    const addBtn = document.querySelector('.action-buttons .btn-primary:first-child');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            window.location.href = 'abertura-vaga.html';
        });
    }

    // Botão Envio Massivo
    const massBtn = document.querySelector('.action-buttons .btn-primary:nth-child(2)');
    if (massBtn) {
        massBtn.addEventListener('click', handleMassApproval);
    }

    // Botão Voltar
    const backBtn = document.querySelector('.action-buttons .btn-secondary');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.history.back();
        });
    }

    // Delegação de eventos para ações da lista
    const vacancyList = document.querySelector('.vacancy-list');
    if (vacancyList) {
        vacancyList.addEventListener('click', handleVacancyActions);
    }

    // Botões do modal
    const confirmDeleteBtn = document.querySelector('#deleteModal .btn-danger');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
    }

    const cancelDeleteBtn = document.querySelector('#deleteModal .btn-secondary');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    }

    const closeModalBtn = document.querySelector('#deleteModal .modal-close');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideDeleteModal);
    }
}

/**
 * Verifica se um ID é válido para chamadas à API (não é temporário)
 */
function isValidApiId(id) {
    if (!id) return false;
    const idStr = String(id);
    // IDs temporários começam com "temp_"
    return !idStr.startsWith('temp_') && !isNaN(Number(idStr));
}

/**
 * Envia solicitações pendentes do localStorage para a API
 */
async function sendPendingRequests() {
    try {
        const pendingRequests = JSON.parse(localStorage.getItem('pendingOpeningRequests') || '[]');
        
        if (pendingRequests.length === 0) {
            console.log('Nenhuma solicitação pendente encontrada');
            return; // Não há solicitações pendentes
        }
        
        console.log(`📤 Enviando ${pendingRequests.length} solicitação(ões) pendente(s) para a API...`, pendingRequests);
        
        const successfulIds = [];
        const failedIds = [];
        
        for (const request of pendingRequests) {
            try {
                console.log('📤 Enviando solicitação:', request);
                console.log('📤 request.gestor_id:', request.gestor_id, 'tipo:', typeof request.gestor_id);
                console.log('📤 request.gestor:', request.gestor);
                console.log('📤 currentUser:', currentUser);
                console.log('📤 currentUser?.id_user:', currentUser?.id_user, 'tipo:', typeof currentUser?.id_user);
                
                // Garante que gestor_id esteja presente e seja um número (usa currentUser como fallback)
                let gestorId = request.gestor_id || request.gestor?.id_user || currentUser?.id_user;
                
                console.log('📤 gestorId antes da conversão:', gestorId, 'tipo:', typeof gestorId);
                
                // Converte para número inteiro se necessário
                if (gestorId) {
                    gestorId = parseInt(gestorId, 10); // Usar parseInt para garantir inteiro
                }
                
                console.log('📤 gestorId após conversão:', gestorId, 'tipo:', typeof gestorId, 'isNaN:', isNaN(gestorId));
                
                if (!gestorId || isNaN(gestorId) || gestorId <= 0) {
                    console.error('❌ Erro: gestor_id inválido. Request:', request, 'CurrentUser:', currentUser);
                    throw new Error('gestor_id não encontrado ou inválido. Usuário não está logado?');
                }
                
                // Mapeia valores do formulário para valores do enum do backend
                // Backend espera: CLT, PJ, Estágio, Temporário, Autônomo (não aceita Trainee)
                const regimeMap = {
                    'clt': 'CLT',
                    'pj': 'PJ',
                    'estagio': 'Estágio',
                    'trainee': 'Estágio', // Trainee mapeado para Estágio (backend não tem Trainee)
                    'temporario': 'Temporário',
                    'autonomo': 'Autônomo'
                };
                const contractType = regimeMap[request.regimeContratacao?.toLowerCase()] || 'CLT';
                
                // Mapeia modelo de trabalho para valores do enum do backend
                // Backend espera: presencial, remoto, híbrido
                const workModelMap = {
                    'presencial': 'presencial',
                    'remoto': 'remoto',
                    'hibrido': 'híbrido',
                    'híbrido': 'híbrido'
                };
                const workModel = workModelMap[request.modeloTrabalho?.toLowerCase()] || request.modeloTrabalho || 'presencial';
                
                // Prepara dados para criar a vaga (formato VacancyOpeningDTO)
                // O backend precisa de uma referência persistida ao User
                // Envia fk_manager com o ID do gestor para criar a aprovação da vaga
                const vacancyData = {
                    position_job: request.cargo,
                    period: request.periodo,
                    workModel: workModel,
                    contractType: contractType, // Valores do enum: CLT, PJ, Estágio, Temporário, Autônomo
                    salary: Number(request.salario) || 0,
                    location: request.localidade,
                    requirements: request.requisitos || '',
                    area: request.area || 'Tecnologia',
                    gestor: gestorId, // Mantido para compatibilidade
                    fk_manager: gestorId // Campo fk_manager obrigatório para criar a aprovação da vaga
                };
                
                console.log('✅ contractType mapeado:', contractType, '(original:', request.regimeContratacao, ')');
                console.log('✅ workModel mapeado:', workModel, '(original:', request.modeloTrabalho, ')');
                console.log('✅ gestor (ID numérico):', gestorId, typeof gestorId);
                
                // Validação final antes de enviar
                if (!gestorId || isNaN(gestorId) || gestorId <= 0) {
                    console.error('❌ VALIDAÇÃO FINAL FALHOU: gestor_id inválido:', gestorId);
                    console.error('❌ Request completo:', request);
                    throw new Error('gestor_id inválido após preparação dos dados');
                }
                
                console.log('✅ Dados preparados para criar vaga:', vacancyData);
                console.log('✅ gestor_id garantido (número inteiro):', gestorId, typeof gestorId);
                
                // Adiciona justificativa como string se existir
                if (request.justificativa) {
                    vacancyData.openingJustification = request.justificativa;
                }
                
                // Verifica se há arquivo de justificativa (legado - mantido para compatibilidade)
                const hasFile = request.justificativaFile && request.justificativaFile.base64;
                
                if (hasFile) {
                    // Converte base64 para File
                    const file = await base64ToFile(
                        request.justificativaFile.base64,
                        request.justificativaFile.name,
                        request.justificativaFile.type || 'application/pdf'
                    );
                    
                    console.log('✅ Arquivo encontrado, usando sendMassive:', file.name);
                    
                    // Usa sendMassive para enviar com arquivo
                    await vacanciesClient.sendMassive([vacancyData], [file]);
                    console.log('✅ Vaga enviada com arquivo para aprovação via sendMassive');
                } else {
                    console.log('✅ Usando insert + sendToApproval (justificativa como string)');
                    console.log('✅ Usando vacanciesClient.insert (endpoint: /vacancies)');
                    
                    // Cria a vaga usando o endpoint /vacancies (NÃO /opening-requests)
                    const createdVacancy = await vacanciesClient.insert(vacancyData);
                    console.log('✅ Vaga criada na API:', createdVacancy);
                    console.log('✅ Resposta completa:', JSON.stringify(createdVacancy));
                    
                    // Envia para aprovação usando o endpoint /vacancies/send-to-approval
                    const vacancyId = createdVacancy.id || createdVacancy.id_vacancy;
                    if (vacancyId) {
                        await vacanciesClient.sendToApproval([vacancyId]);
                        console.log('✅ Vaga enviada para aprovação:', vacancyId);
                    } else {
                        console.warn('⚠️ ID da vaga não encontrado na resposta:', createdVacancy);
                    }
                }
                
                successfulIds.push(request.id);
            } catch (error) {
                console.error('❌ Erro ao enviar solicitação pendente:', error);
                console.error('Dados da solicitação que falhou:', request);
                failedIds.push(request.id);
            }
        }
        
        // Remove solicitações enviadas com sucesso do localStorage
        if (successfulIds.length > 0) {
            const remainingRequests = pendingRequests.filter(req => !successfulIds.includes(req.id));
            localStorage.setItem('pendingOpeningRequests', JSON.stringify(remainingRequests));
            
            showNotification(`${successfulIds.length} solicitação(ões) enviada(s) com sucesso!`, 'success');
            console.log(`✅ ${successfulIds.length} solicitação(ões) removida(s) do localStorage`);
        }
        
        // Mantém as que falharam para tentar novamente depois
        if (failedIds.length > 0) {
            console.warn(`⚠️ ${failedIds.length} solicitação(ões) falharam ao enviar e serão mantidas para nova tentativa`);
            showNotification(`${failedIds.length} solicitação(ões) falharam ao enviar. Tente novamente.`, 'warning');
        }
    } catch (error) {
        console.error('❌ Erro geral ao processar solicitações pendentes:', error);
    }
}

/**
 * Carrega as solicitações do gestor logado
 */
async function loadVacancies() {
    // Evita múltiplas chamadas simultâneas
    if (isLoading) return;
    
    try {
        isLoading = true;
        showLoading(true);
        
        // Primeiro, adiciona solicitações pendentes do localStorage à lista
        const pendingRequests = JSON.parse(localStorage.getItem('pendingOpeningRequests') || '[]');
        console.log('📋 Solicitações pendentes no localStorage:', pendingRequests.length, pendingRequests);
        
        // Inicializa array de vagas
        let apiVacancies = [];
        
        // ESTRATÉGIA 1: Busca solicitações de abertura (opening-requests)
        try {
            console.log('📡 [1] Buscando opening-requests do gestor ID:', currentUser.id_user);
            const result = await openingRequestClient.findByGestor(currentUser.id_user);
            if (Array.isArray(result) && result.length > 0) {
                apiVacancies = [...apiVacancies, ...result.map(r => ({ ...r, source: 'opening-request' }))];
                console.log('📋 [1] Opening requests encontradas:', result.length);
            }
        } catch (error) {
            console.warn('⚠️ [1] Erro ao buscar opening-requests por gestor:', error.message);
        }
        
        // ESTRATÉGIA 2: Busca vagas pelo gestor (vacancies)
        try {
            console.log('📡 [2] Buscando vacancies do gestor ID:', currentUser.id_user);
            const vacancyResult = await vacanciesClient.findByManager(currentUser.id_user);
            if (Array.isArray(vacancyResult) && vacancyResult.length > 0) {
                // Mapeia campos da vacancy para o formato esperado
                const mappedVacancies = vacancyResult.map(v => ({
                    id: v.id || v.id_vacancy,
                    idOpeningRequest: v.id || v.id_vacancy,
                    cargo: v.position_job || v.positionJob || v.position,
                    area: v.area || 'N/A',
                    periodo: v.period || v.periodo,
                    status: v.statusVacancy || v.status || 'ENTRADA',
                    createdAt: v.createdAt || v.created_at,
                    gestor: { id_user: currentUser.id_user, name: currentUser.name },
                    vacancy: v,
                    source: 'vacancy',
                    isPending: false
                }));
                apiVacancies = [...apiVacancies, ...mappedVacancies];
                console.log('📋 [2] Vacancies encontradas:', vacancyResult.length);
            }
        } catch (error) {
            console.warn('⚠️ [2] Erro ao buscar vacancies por manager:', error.message);
        }
        
        // ESTRATÉGIA 3: Fallback - busca todas as opening-requests e filtra
        if (apiVacancies.length === 0) {
            try {
                console.log('📡 [3] Fallback: buscando todas as opening-requests');
                const allRequests = await openingRequestClient.findAll();
                if (Array.isArray(allRequests)) {
                    const filtered = allRequests.filter(v => {
                        const matchesGestor = 
                            v.manager?.id_user === currentUser.id_user ||
                            v.managerId === currentUser.id_user ||
                            v.id_manager === currentUser.id_user ||
                            v.gestor?.id_user === currentUser.id_user ||
                            v.gestor_id === currentUser.id_user ||
                            v.fk_manager === currentUser.id_user;
                        return matchesGestor;
                    });
                    apiVacancies = [...apiVacancies, ...filtered.map(r => ({ ...r, source: 'opening-request-fallback' }))];
                    console.log('📋 [3] Opening requests filtradas:', filtered.length);
                }
            } catch (fallbackError) {
                console.warn('⚠️ [3] Erro no fallback findAll:', fallbackError.message);
            }
        }
        
        // Remove duplicatas por ID
        const uniqueIds = new Set();
        apiVacancies = apiVacancies.filter(v => {
            const id = v.id || v.idOpeningRequest || v.id_vacancy;
            if (uniqueIds.has(id)) return false;
            uniqueIds.add(id);
            return true;
        });
        
        console.log('📋 Total de solicitações da API (sem duplicatas):', apiVacancies.length);
        
        // Combina: pendentes do localStorage + solicitações da API
        vacancies = [];
        
        // Adiciona solicitações pendentes à lista (marcadas como pendentes)
        if (pendingRequests.length > 0) {
            console.log('📋 Adicionando', pendingRequests.length, 'solicitações pendentes do localStorage');
            const pendingMapped = pendingRequests.map(req => ({
                ...req,
                isPending: true, // Flag para identificar como pendente de envio
                gestor: req.gestor || { id_user: req.gestor_id, name: currentUser.name }
            }));
            vacancies = [...pendingMapped];
        }
        
        // Adiciona solicitações da API (já enviadas)
        if (apiVacancies.length > 0) {
            console.log('📋 Adicionando', apiVacancies.length, 'solicitações da API');
            // Marca como não pendentes (já foram enviadas)
            const apiMapped = apiVacancies.map(req => ({
                ...req,
                isPending: false
            }));
            vacancies = [...vacancies, ...apiMapped];
        }
        
        console.log('📋 Total de solicitações combinadas:', vacancies.length);
        
        filteredVacancies = [...vacancies];
        
        // Ordena por mais recentes
        sortVacancies('recent');
        
        renderVacancies();
    } catch (error) {
        console.error('❌ Erro ao carregar solicitações:', error);
        vacancies = [];
        filteredVacancies = [];
        renderVacancies();
    } finally {
        isLoading = false;
        showLoading(false);
    }
}

/**
 * Renderiza a lista de vagas
 */
function renderVacancies() {
    const vacancyList = document.querySelector('.vacancy-list');
    if (!vacancyList) return;

    // Garante que filteredVacancies seja um array
    if (!Array.isArray(filteredVacancies)) {
        filteredVacancies = [];
    }

    vacancyList.innerHTML = '';

    if (filteredVacancies.length === 0) {
        vacancyList.innerHTML = `
            <div class="empty-state text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <p class="text-muted">Nenhuma solicitação encontrada</p>
                <button class="btn btn-primary mt-2" onclick="window.location.href='abertura-vaga.html'">
                    <i class="fas fa-plus"></i> Criar Nova Vaga
                </button>
            </div>
        `;
        return;
    }

    console.log('🎨 Renderizando', filteredVacancies.length, 'solicitações...');
    filteredVacancies.forEach((vacancy, index) => {
        console.log(`🎨 Renderizando item ${index + 1}:`, vacancy);
        const item = createVacancyItem(vacancy);
        vacancyList.appendChild(item);
    });
    console.log('✅ Renderização concluída');
}

/**
 * Cria elemento de item de solicitação
 * @param {Object} vacancy - Dados da solicitação (OpeningRequestDTO)
 */
function createVacancyItem(vacancy) {
    const item = document.createElement('div');
    item.className = 'vacancy-item';
    
    // Status da solicitação
    const status = (vacancy.status || '').toUpperCase();
    
    // Adiciona classes baseadas no status
    if (vacancy.isPending) {
        item.classList.add('pending-item');
    }
    
    // Card semi-transparente (50%) para solicitações aguardando aprovação
    // Status: ENTRADA, ABERTA, PENDENTE_APROVACAO
    const pendingApprovalStatuses = ['ENTRADA', 'ABERTA', 'PENDENTE_APROVACAO', 'PENDENTE APROVACAO'];
    if (!vacancy.isPending && pendingApprovalStatuses.includes(status)) {
        item.classList.add('sent-item'); // Classe para efeito semi-transparente 50%
    }
    
    item.dataset.id = vacancy.id || vacancy.idOpeningRequest;

    // OpeningRequestDTO campos: status, gestor (UserDTO), vacancy (VacancyDTO)
    // Para solicitações pendentes, usa os campos diretos
    const statusBadge = vacancy.isPending 
        ? getStatusBadgeWithIcon('PENDENTE_ENVIO')
        : getStatusBadgeWithIcon(vacancy.status);
    
    const managerName = vacancy.gestor?.name || vacancy.manager?.name || currentUser?.name || 'N/A';
    
    // Para pendentes, usa cargo diretamente; para API, usa vacancy.position_job
    const position = vacancy.isPending 
        ? (vacancy.cargo || 'N/A')
        : (vacancy.vacancy?.position_job || vacancy.position_job || vacancy.positionJob || vacancy.position || vacancy.cargo || 'N/A');
    
    const area = vacancy.vacancy?.area || vacancy.area || 'N/A';
    const createdDate = vacancy.createdAt ? formatDate(vacancy.createdAt) : '';

    // Ícone do status no canto do card
    const statusIcon = getStatusIcon(vacancy.isPending ? 'PENDENTE_ENVIO' : vacancy.status);

    item.innerHTML = `
        <div class="vacancy-icon">
            <i class="fas fa-briefcase"></i>
            ${statusIcon}
        </div>
        <div class="vacancy-info">
            <div class="vacancy-details">
                <p><strong>Gestor:</strong> ${escapeHtml(managerName)}</p>
                <p><strong>Vaga:</strong> ${escapeHtml(position)}</p>
                ${area && String(area).toUpperCase() !== 'N/A' ? `<p><strong>Área:</strong> ${escapeHtml(area)}</p>` : ''}
                ${createdDate ? `<p class="text-muted small"><i class="fas fa-calendar"></i> ${createdDate}</p>` : ''}
            </div>
            ${statusBadge}
        </div>
        <div class="vacancy-actions">
            ${vacancy.isPending ? `
                <button class="btn-action btn-primary" data-action="send" data-id="${vacancy.id}" title="Enviar para API">
                    <i class="fas fa-paper-plane"></i>
                </button>
            ` : `
                <button class="btn-action btn-detail" data-action="view" data-id="${vacancy.id || vacancy.idOpeningRequest}" title="Exibir detalhe/enviar para aprovação">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action btn-edit" data-action="edit" data-id="${vacancy.id || vacancy.idOpeningRequest}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
            `}
            <button class="btn-action btn-delete" data-action="delete" data-id="${vacancy.id || vacancy.idOpeningRequest}" title="Excluir">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    return item;
}

/**
 * Retorna ícone de status para exibição no card
 * @param {string} status - Status da solicitação
 */
function getStatusIcon(status) {
    const statusUpper = (status || '').toUpperCase();
    
    const iconMap = {
        'PENDENTE_ENVIO': '<span class="status-icon status-pending" title="Pendente de Envio"><i class="fas fa-clock"></i></span>',
        'ENTRADA': '<span class="status-icon status-waiting" title="Aguardando Aprovação"><i class="fas fa-hourglass-half"></i></span>',
        'ABERTA': '<span class="status-icon status-waiting" title="Pendente Aprovação"><i class="fas fa-hourglass-half"></i></span>',
        'APROVADA': '<span class="status-icon status-approved" title="Aprovada"><i class="fas fa-check-circle"></i></span>',
        'REJEITADA': '<span class="status-icon status-rejected" title="Rejeitada"><i class="fas fa-times-circle"></i></span>',
        'CANCELADA': '<span class="status-icon status-cancelled" title="Cancelada"><i class="fas fa-ban"></i></span>'
    };
    
    return iconMap[statusUpper] || '<span class="status-icon status-unknown" title="Status Desconhecido"><i class="fas fa-question-circle"></i></span>';
}

/**
 * Retorna badge de status com ícone
 * @param {string} status - Status da solicitação (OpeningRequestStatus enum do backend)
 */
function getStatusBadgeWithIcon(status) {
    const statusUpper = (status || '').toUpperCase();
    
    // OpeningRequestStatus enum: ABERTA, CANCELADA, REJEITADA, ENTRADA, APROVADA
    const statusMap = {
        'PENDENTE_ENVIO': { class: 'badge-warning', text: 'Pendente de Envio', icon: 'fa-clock' },
        'ENTRADA': { class: 'badge-info', text: 'Aguardando Aprovação', icon: 'fa-hourglass-half' },
        'ABERTA': { class: 'badge-primary', text: 'Pendente Aprovação', icon: 'fa-hourglass-half' },
        'APROVADA': { class: 'badge-success', text: 'Aprovada', icon: 'fa-check-circle' },
        'REJEITADA': { class: 'badge-danger', text: 'Rejeitada', icon: 'fa-times-circle' },
        'CANCELADA': { class: 'badge-secondary', text: 'Cancelada', icon: 'fa-ban' },
        // Fallbacks para compatibilidade
        'EM_ANALISE': { class: 'badge-warning', text: 'Em Análise', icon: 'fa-hourglass-half' },
        'PENDENTE': { class: 'badge-warning', text: 'Pendente', icon: 'fa-clock' },
        'PENDENTE_APROVACAO': { class: 'badge-info', text: 'Aguardando Aprovação', icon: 'fa-hourglass-half' }
    };

    const statusInfo = statusMap[statusUpper] || { class: 'badge-secondary', text: status || 'Desconhecido', icon: 'fa-question-circle' };
    
    return `<span class="badge ${statusInfo.class}"><i class="fas ${statusInfo.icon} mr-1"></i>${statusInfo.text}</span>`;
}

/**
 * Retorna badge de status (mantido para compatibilidade)
 * @param {string} status - Status da solicitação (OpeningRequestStatus enum do backend)
 */
function getStatusBadge(status) {
    return getStatusBadgeWithIcon(status);
}

/**
 * Manipula ações nos itens da lista
 * @param {Event} e - Evento de click
 */
function handleVacancyActions(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    switch (action) {
        case 'view':
            viewVacancy(id);
            break;
        case 'edit':
            editVacancy(id);
            break;
        case 'delete':
            showDeleteModal(id);
            break;
        case 'send':
            sendSinglePendingRequest(id);
            break;
    }
}

/**
 * Envia uma solicitação pendente individual para a API
 * @param {string|number} requestId - ID da solicitação pendente
 */
async function sendSinglePendingRequest(requestId) {
    const pendingRequests = JSON.parse(localStorage.getItem('pendingOpeningRequests') || '[]');
    const request = pendingRequests.find(req => req.id === requestId);
    
    if (!request) {
        showNotification('Solicitação não encontrada!', 'warning');
        return;
    }
    
    try {
        showNotification('Enviando solicitação...', 'info');
        
        // Garante que gestor_id esteja presente e seja um número inteiro (usa currentUser como fallback)
        let gestorId = request.gestor_id || request.gestor?.id_user || currentUser?.id_user;
        
        // Converte para número inteiro se necessário
        if (gestorId) {
            gestorId = parseInt(gestorId, 10); // Usar parseInt para garantir inteiro
        }
        
        if (!gestorId || isNaN(gestorId) || gestorId <= 0) {
            console.error('❌ Erro: gestor_id inválido. Request:', request, 'CurrentUser:', currentUser);
            showNotification('Erro: gestor_id não encontrado ou inválido. Faça login novamente.', 'danger');
            return;
        }
        
        // Mapeia valores do formulário para valores do enum do backend
        // Backend espera: CLT, PJ, Estágio, Temporário, Autônomo (não aceita Trainee)
        const regimeMap = {
            'clt': 'CLT',
            'pj': 'PJ',
            'estagio': 'Estágio',
            'trainee': 'Estágio', // Trainee mapeado para Estágio (backend não tem Trainee)
            'temporario': 'Temporário',
            'autonomo': 'Autônomo'
        };
        const contractType = regimeMap[request.regimeContratacao?.toLowerCase()] || 'CLT';
        
        // Mapeia modelo de trabalho para valores do enum do backend
        // Backend espera: presencial, remoto, híbrido
        const workModelMap = {
            'presencial': 'presencial',
            'remoto': 'remoto',
            'hibrido': 'híbrido',
            'híbrido': 'híbrido'
        };
        const workModel = workModelMap[request.modeloTrabalho?.toLowerCase()] || request.modeloTrabalho || 'presencial';
        
        // Prepara dados para criar a vaga (formato VacancyOpeningDTO)
        // O backend precisa de uma referência persistida ao User
        // Envia fk_manager com o ID do gestor para criar a aprovação da vaga
        const vacancyData = {
            position_job: request.cargo,
            period: request.periodo,
            workModel: workModel,
            contractType: contractType, // Valores do enum: CLT, PJ, Estágio, Temporário, Autônomo
            salary: Number(request.salario) || 0,
            location: request.localidade,
            requirements: request.requisitos || '',
            area: request.area || 'Tecnologia',
            gestor: gestorId, // Mantido para compatibilidade
            fk_manager: gestorId // Campo fk_manager obrigatório para criar a aprovação da vaga
        };
        
        console.log('✅ contractType mapeado:', contractType, '(original:', request.regimeContratacao, ')');
        console.log('✅ workModel mapeado:', workModel, '(original:', request.modeloTrabalho, ')');
        console.log('✅ gestor (ID numérico):', gestorId, typeof gestorId);
        
        // Validação final antes de enviar
        if (!gestorId || isNaN(gestorId) || gestorId <= 0) {
            console.error('❌ VALIDAÇÃO FINAL FALHOU: gestor_id inválido:', gestorId);
            console.error('❌ Request completo:', request);
            showNotification('Erro: gestor_id inválido após preparação dos dados.', 'danger');
            return;
        }
        
        console.log('✅ Enviando solicitação com gestor_id (número inteiro):', gestorId, typeof gestorId);
        console.log('✅ Dados completos para criar vaga:', vacancyData);
        
                // Adiciona justificativa como string se existir
        if (request.justificativa) {
            vacancyData.openingJustification = request.justificativa;
        }
        
        // Verifica se há arquivo de justificativa (legado - mantido para compatibilidade)
        const hasFile = request.justificativaFile && request.justificativaFile.base64;
        
        if (hasFile) {
            // Converte base64 para File
            const file = await base64ToFile(
                request.justificativaFile.base64,
                request.justificativaFile.name,
                request.justificativaFile.type || 'application/pdf'
            );
            
            console.log('✅ Arquivo encontrado, usando sendMassive:', file.name);
            
            // Usa sendMassive para enviar com arquivo
            await vacanciesClient.sendMassive([vacancyData], [file]);
            console.log('✅ Vaga enviada com arquivo para aprovação via sendMassive');
        } else {
            console.log('✅ Nenhum arquivo encontrado, usando insert + sendToApproval');
            
            // Cria a vaga usando o endpoint /vacancies (NÃO /opening-requests)
            const createdVacancy = await vacanciesClient.insert(vacancyData);
            console.log('✅ Vaga criada:', createdVacancy);
            console.log('✅ Resposta completa:', JSON.stringify(createdVacancy));
            
            // Envia para aprovação usando o endpoint /vacancies/send-to-approval
            const vacancyId = createdVacancy.id || createdVacancy.id_vacancy;
            if (vacancyId) {
                await vacanciesClient.sendToApproval([vacancyId]);
                console.log('✅ Vaga enviada para aprovação:', vacancyId);
            } else {
                console.warn('⚠️ ID da vaga não encontrado na resposta:', createdVacancy);
            }
        }
        
        // Remove do localStorage
        const remainingRequests = pendingRequests.filter(req => req.id !== requestId);
        localStorage.setItem('pendingOpeningRequests', JSON.stringify(remainingRequests));
        
        showNotification('Solicitação enviada com sucesso!', 'success');
        
        // Recarrega a lista
        await loadVacancies();
    } catch (error) {
        console.error('Erro ao enviar solicitação:', error);
        showNotification('Erro ao enviar solicitação. Tente novamente.', 'danger');
    }
}

/**
 * Visualiza detalhes da vaga
 * @param {string|number} id - ID da vaga
 */
function viewVacancy(id) {
    // Não permite visualizar solicitações pendentes (ainda não enviadas)
    if (!isValidApiId(id)) {
        showNotification('Esta solicitação ainda não foi enviada. Envie-a primeiro para visualizar os detalhes.', 'warning');
        return;
    }
    localStorage.setItem('selectedVacancy', id);
    window.location.href = `detalhes-vaga.html?id=${id}`;
}

/**
 * Edita vaga
 * @param {string|number} id - ID da vaga
 */
function editVacancy(id) {
    // Não permite editar solicitações pendentes (ainda não enviadas)
    if (!isValidApiId(id)) {
        showNotification('Esta solicitação ainda não foi enviada. Envie-a primeiro para poder editá-la.', 'warning');
        return;
    }
    localStorage.setItem('editVacancy', id);
    window.location.href = `abertura-vaga.html?edit=${id}`;
}

/**
 * Mostra modal de exclusão
 * @param {string|number} id - ID da vaga
 */
function showDeleteModal(id) {
    currentDeleteId = id;
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
    }
}

/**
 * Esconde modal de exclusão
 */
function hideDeleteModal() {
    currentDeleteId = null;
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
}

/**
 * Confirma exclusão da solicitação
 */
async function confirmDelete() {
    if (!currentDeleteId) return;

    try {
        // Se for ID temporário (pendente), remove apenas do localStorage
        if (!isValidApiId(currentDeleteId)) {
            const pendingRequests = JSON.parse(localStorage.getItem('pendingOpeningRequests') || '[]');
            const remainingRequests = pendingRequests.filter(req => req.id !== currentDeleteId);
            localStorage.setItem('pendingOpeningRequests', JSON.stringify(remainingRequests));
            
            // Remove da lista local
            vacancies = vacancies.filter(v => (v.id || v.id_vacancy || v.idOpeningRequest) != currentDeleteId);
            filteredVacancies = filteredVacancies.filter(v => (v.id || v.id_vacancy || v.idOpeningRequest) != currentDeleteId);
            
            renderVacancies();
            showNotification('Solicitação removida com sucesso!', 'success');
        } else {
            // Se for ID válido da API, deleta da API
            await openingRequestClient.delete(currentDeleteId);
            
            // Remove da lista local
            vacancies = vacancies.filter(v => (v.id || v.id_vacancy || v.idOpeningRequest) != currentDeleteId);
            filteredVacancies = filteredVacancies.filter(v => (v.id || v.id_vacancy || v.idOpeningRequest) != currentDeleteId);
            
            renderVacancies();
            showNotification('Solicitação excluída com sucesso!', 'success');
        }
    } catch (error) {
        console.error('Erro ao excluir:', error);
        showNotification('Erro ao excluir solicitação!', 'danger');
    } finally {
        hideDeleteModal();
    }
}

/**
 * Manipula busca
 * @param {Event} e - Evento de input
 */
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredVacancies = [...vacancies];
    } else {
        filteredVacancies = vacancies.filter(v => {
            const position = (v.position_job || v.positionJob || v.position || '').toLowerCase();
            const area = (v.area || '').toLowerCase();
            const manager = (v.manager?.name || '').toLowerCase();
            
            return position.includes(searchTerm) || 
                   area.includes(searchTerm) || 
                   manager.includes(searchTerm);
        });
    }
    
    renderVacancies();
}

/**
 * Manipula ordenação
 * @param {Event} e - Evento de change
 */
function handleSort(e) {
    sortVacancies(e.target.value);
    renderVacancies();
}

/**
 * Ordena vagas
 * @param {string} sortBy - Critério de ordenação
 */
function sortVacancies(sortBy) {
    filteredVacancies.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created || 0);
        const dateB = new Date(b.createdAt || b.created || 0);
        
        if (sortBy === 'recent') {
            return dateB - dateA;
        } else {
            return dateA - dateB;
        }
    });
}

/**
 * Envia todas as solicitações para aprovação em massa
 */
async function handleMassApproval() {
    // Primeiro, envia solicitações pendentes do localStorage para a API
    const pendingRequests = JSON.parse(localStorage.getItem('pendingOpeningRequests') || '[]');
    let sentCount = 0;
    
    if (pendingRequests.length > 0) {
        console.log(`📤 Enviando ${pendingRequests.length} solicitação(ões) pendente(s) do localStorage para a API...`);
        
        for (const request of pendingRequests) {
            try {
                // Garante que gestor_id esteja presente e seja um número
                let gestorId = request.gestor_id || request.gestor?.id_user || currentUser?.id_user;
                if (gestorId) {
                    gestorId = parseInt(gestorId, 10);
                }
                
                if (!gestorId || isNaN(gestorId) || gestorId <= 0) {
                    console.warn('⚠️ Ignorando solicitação com gestor_id inválido:', request);
                    continue;
                }
                
                // Mapeia valores do formulário para valores do enum do backend
                const regimeMap = {
                    'clt': 'CLT',
                    'pj': 'PJ',
                    'estagio': 'Estágio',
                    'trainee': 'Estágio',
                    'temporario': 'Temporário',
                    'autonomo': 'Autônomo'
                };
                const contractType = regimeMap[request.regimeContratacao?.toLowerCase()] || 'CLT';
                
                const workModelMap = {
                    'presencial': 'presencial',
                    'remoto': 'remoto',
                    'hibrido': 'híbrido',
                    'híbrido': 'híbrido'
                };
                const workModel = workModelMap[request.modeloTrabalho?.toLowerCase()] || request.modeloTrabalho || 'presencial';
                
                // Prepara dados para criar a vaga
                // Envia fk_manager com o ID do gestor para criar a aprovação da vaga
                const vacancyData = {
                    position_job: request.cargo,
                    period: request.periodo,
                    workModel: workModel,
                    contractType: contractType,
                    salary: Number(request.salario) || 0,
                    location: request.localidade,
                    requirements: request.requisitos || '',
                    area: request.area || 'Tecnologia',
                    gestor: gestorId, // Mantido para compatibilidade
                    fk_manager: gestorId // Campo fk_manager obrigatório para criar a aprovação da vaga
                };
                
                // Adiciona justificativa como string se existir
        if (request.justificativa) {
            vacancyData.openingJustification = request.justificativa;
        }
        
        // Verifica se há arquivo de justificativa (legado - mantido para compatibilidade)
        const hasFile = request.justificativaFile && request.justificativaFile.base64;
                
                if (hasFile) {
                    // Converte base64 para File
                    const file = await base64ToFile(
                        request.justificativaFile.base64,
                        request.justificativaFile.name,
                        request.justificativaFile.type || 'application/pdf'
                    );
                    
                    // Usa sendMassive para enviar com arquivo
                    await vacanciesClient.sendMassive([vacancyData], [file]);
                    sentCount++;
                } else {
                    // Cria a vaga usando o endpoint /vacancies
                    const createdVacancy = await vacanciesClient.insert(vacancyData);
                    const vacancyId = createdVacancy.id || createdVacancy.id_vacancy;
                    
                    if (vacancyId) {
                        // Envia para aprovação usando o endpoint /vacancies/send-to-approval
                        await vacanciesClient.sendToApproval([vacancyId]);
                        sentCount++;
                    }
                }
            } catch (error) {
                console.error('❌ Erro ao enviar solicitação pendente:', error);
            }
        }
        
        // Remove solicitações enviadas com sucesso do localStorage
        if (sentCount > 0) {
            const remainingRequests = pendingRequests.slice(sentCount);
            localStorage.setItem('pendingOpeningRequests', JSON.stringify(remainingRequests));
        }
    }
    
    // Depois, envia solicitações que já estão na API para aprovação
    const pendingVacancies = filteredVacancies.filter(v => {
        const id = v.id || v.idOpeningRequest;
        // Só inclui se não for pendente de envio (isPending) e tiver ID válido da API
        if (v.isPending || !isValidApiId(id)) {
            return false;
        }
        return v.status === 'ENTRADA' || 
               v.status === 'em_analise' || 
               v.status === 'pendente' ||
               v.status === 'pendente aprovação' ||
               !v.status;
    });

    const totalToApprove = sentCount + pendingVacancies.length;
    
    if (totalToApprove === 0) {
        showNotification('Não há solicitações pendentes para enviar.', 'warning');
        return;
    }

    const confirmed = confirm(`Deseja enviar ${totalToApprove} solicitação(s) para aprovação?\n\n- ${sentCount} do localStorage\n- ${pendingVacancies.length} já na API`);
    if (!confirmed) return;

    try {
        // Atualiza status das que já estão na API
        for (const request of pendingVacancies) {
            const id = request.id || request.idOpeningRequest;
            if (!isValidApiId(id)) {
                console.warn('Ignorando solicitação com ID inválido:', id);
                continue;
            }
            await openingRequestClient.updateStatus(id, 'aprovada');
        }
        
        showNotification(`${totalToApprove} solicitação(s) enviada(s) para aprovação!`, 'success');
        
        // Recarrega a lista
        await loadVacancies();
    } catch (error) {
        console.error('Erro ao enviar para aprovação:', error);
        showNotification('Erro ao enviar solicitações para aprovação!', 'danger');
    }
}

/**
 * Exibe loading
 * @param {boolean} show - Mostrar ou esconder
 */
function showLoading(show) {
    isLoading = show;
    const vacancyList = document.querySelector('.vacancy-list');
    if (!vacancyList) return;

    if (show) {
        vacancyList.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">Carregando...</span>
                </div>
                <p class="mt-2 text-muted">Carregando solicitações...</p>
            </div>
        `;
    }
}

/**
 * Exibe notificação
 * @param {string} message - Mensagem
 * @param {string} type - Tipo (success, danger, warning, info)
 */
function showNotification(message, type = 'info') {
    // Remove notificações anteriores
    document.querySelectorAll('.vacancy-notification').forEach(el => el.remove());

    const colors = {
        success: '#28a745',
        danger: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };

    const notification = document.createElement('div');
    notification.className = 'vacancy-notification';
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
        animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `
        ${message}
        <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;margin-left:15px;cursor:pointer;">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 4000);
}

/**
 * Formata data
 * @param {string} dateStr - String de data
 */
function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
    } catch {
        return '';
    }
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

/**
 * Converte base64 para File
 * @param {string} base64 - String base64 do arquivo
 * @param {string} fileName - Nome do arquivo
 * @param {string} mimeType - Tipo MIME do arquivo
 * @returns {Promise<File>} - Arquivo convertido
 */
async function base64ToFile(base64, fileName, mimeType = 'application/pdf') {
    // Remove o prefixo data:application/pdf;base64, se existir
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    
    // Converte base64 para bytes
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    
    // Cria o arquivo
    const file = new File([byteArray], fileName, { type: mimeType });
    return file;
}

// Funções globais para o modal (compatibilidade com onclick no HTML)
window.showDeleteModal = showDeleteModal;
window.hideDeleteModal = hideDeleteModal;
window.confirmDelete = confirmDelete;
