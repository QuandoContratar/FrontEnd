/* ========================================
   MINHAS SOLICITAÇÕES
   Gerenciamento de solicitações de vagas do gestor
   ======================================== */

import { OpeningRequestClient } from '../../../client/client.js';

// Instância do cliente de solicitações
let openingRequestClient;
try {
    openingRequestClient = new OpeningRequestClient();
} catch (error) {
    console.error('Erro ao inicializar OpeningRequestClient:', error);
    // Fallback: criar um objeto vazio para evitar erros
    openingRequestClient = {
        findByGestor: async () => [],
        findAll: async () => [],
        delete: async () => {},
        updateStatus: async () => {}
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
    // Pega usuário logado do localStorage
    currentUser = JSON.parse(localStorage.getItem('userLogged')) || { id_user: 1, name: 'Lucio Limeira' };
    
    // Atualiza nome do usuário na topbar
    updateUserInfo();
    
    // Configura event listeners
    setupEventListeners();
    
    // Carrega vagas do gestor
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
 * Carrega as solicitações do gestor logado
 */
async function loadVacancies() {
    // Evita múltiplas chamadas simultâneas
    if (isLoading) return;
    
    try {
        showLoading(true);
        
        // Busca solicitações pelo gestor usando o endpoint correto do backend
        try {
            const result = await openingRequestClient.findByGestor(currentUser.id_user);
            vacancies = Array.isArray(result) ? result : [];
        } catch (error) {
            console.warn('Erro ao buscar por gestor:', error);
            // Fallback: busca todas e filtra pelo gestor
            try {
                const allRequests = await openingRequestClient.findAll();
                vacancies = Array.isArray(allRequests) 
                    ? allRequests.filter(v => 
                        v.manager?.id_user === currentUser.id_user ||
                        v.managerId === currentUser.id_user ||
                        v.id_manager === currentUser.id_user ||
                        v.gestor?.id_user === currentUser.id_user
                    )
                    : [];
            } catch (fallbackError) {
                console.warn('Erro no fallback:', fallbackError);
                vacancies = [];
            }
        }
        
        // Garante que seja array
        if (!Array.isArray(vacancies)) {
            vacancies = [];
        }
        
        filteredVacancies = [...vacancies];
        
        // Ordena por mais recentes
        sortVacancies('recent');
        
        renderVacancies();
    } catch (error) {
        console.error('Erro ao carregar solicitações:', error);
        vacancies = [];
        filteredVacancies = [];
        renderVacancies();
    } finally {
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

    filteredVacancies.forEach(vacancy => {
        const item = createVacancyItem(vacancy);
        vacancyList.appendChild(item);
    });
}

/**
 * Cria elemento de item de solicitação
 * @param {Object} vacancy - Dados da solicitação (OpeningRequestDTO)
 */
function createVacancyItem(vacancy) {
    const item = document.createElement('div');
    item.className = 'vacancy-item';
    item.dataset.id = vacancy.id || vacancy.idOpeningRequest;

    // OpeningRequestDTO campos: status, gestor (UserDTO), vacancy (VacancyDTO)
    const statusBadge = getStatusBadge(vacancy.status);
    const managerName = vacancy.gestor?.name || vacancy.manager?.name || currentUser?.name || 'N/A';
    const position = vacancy.vacancy?.position_job || vacancy.position_job || vacancy.positionJob || vacancy.position || 'N/A';
    const area = vacancy.vacancy?.area || vacancy.area || 'N/A';
    const createdDate = vacancy.createdAt ? formatDate(vacancy.createdAt) : '';

    item.innerHTML = `
        <div class="vacancy-icon">
            <i class="fas fa-briefcase"></i>
        </div>
        <div class="vacancy-info">
            <div class="vacancy-details">
                <p><strong>Gestor:</strong> ${escapeHtml(managerName)}</p>
                <p><strong>Vaga:</strong> ${escapeHtml(position)}</p>
                <p><strong>Área:</strong> ${escapeHtml(area)}</p>
                ${createdDate ? `<p class="text-muted small"><i class="fas fa-calendar"></i> ${createdDate}</p>` : ''}
            </div>
            ${statusBadge}
        </div>
        <div class="vacancy-actions">
            <button class="btn-action btn-detail" data-action="view" data-id="${vacancy.id || vacancy.idOpeningRequest}" title="Exibir detalhe/enviar para aprovação">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn-action btn-edit" data-action="edit" data-id="${vacancy.id || vacancy.idOpeningRequest}" title="Editar">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-action btn-delete" data-action="delete" data-id="${vacancy.id || vacancy.idOpeningRequest}" title="Excluir">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    return item;
}

/**
 * Retorna badge de status
 * @param {string} status - Status da solicitação (OpeningRequestStatus enum do backend)
 */
function getStatusBadge(status) {
    // OpeningRequestStatus enum: em_analise, aprovada, rejeitada, cancelada
    const statusMap = {
        'em_analise': { class: 'badge-warning', text: 'Em Análise' },
        'aprovada': { class: 'badge-success', text: 'Aprovada' },
        'rejeitada': { class: 'badge-danger', text: 'Rejeitada' },
        'cancelada': { class: 'badge-secondary', text: 'Cancelada' },
        // Fallbacks para compatibilidade
        'rascunho': { class: 'badge-secondary', text: 'Rascunho' },
        'pendente': { class: 'badge-warning', text: 'Pendente' },
        'pendente aprovação': { class: 'badge-info', text: 'Aguardando Aprovação' }
    };

    const statusInfo = statusMap[status] || { class: 'badge-secondary', text: status || 'Em Análise' };
    
    return `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
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
    }
}

/**
 * Visualiza detalhes da vaga
 * @param {string|number} id - ID da vaga
 */
function viewVacancy(id) {
    localStorage.setItem('selectedVacancy', id);
    window.location.href = `detalhes-vaga.html?id=${id}`;
}

/**
 * Edita vaga
 * @param {string|number} id - ID da vaga
 */
function editVacancy(id) {
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
        await openingRequestClient.delete(currentDeleteId);
        
        // Remove da lista local
        vacancies = vacancies.filter(v => (v.id || v.id_vacancy || v.idOpeningRequest) != currentDeleteId);
        filteredVacancies = filteredVacancies.filter(v => (v.id || v.id_vacancy || v.idOpeningRequest) != currentDeleteId);
        
        renderVacancies();
        showNotification('Solicitação excluída com sucesso!', 'success');
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
    // Filtra apenas solicitações em análise
    const pendingVacancies = vacancies.filter(v => 
        v.status === 'em_analise' || !v.status
    );

    if (pendingVacancies.length === 0) {
        showNotification('Não há solicitações pendentes para enviar', 'warning');
        return;
    }

    const confirmed = confirm(`Deseja enviar ${pendingVacancies.length} solicitação(s) para aprovação?`);
    if (!confirmed) return;

    try {
        // Atualiza status de cada uma
        for (const request of pendingVacancies) {
            const id = request.id || request.idOpeningRequest;
            await openingRequestClient.updateStatus(id, 'aprovada');
        }
        
        showNotification(`${pendingVacancies.length} solicitação(s) enviada(s) para aprovação!`, 'success');
        
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

// Funções globais para o modal (compatibilidade com onclick no HTML)
window.showDeleteModal = showDeleteModal;
window.hideDeleteModal = hideDeleteModal;
window.confirmDelete = confirmDelete;
