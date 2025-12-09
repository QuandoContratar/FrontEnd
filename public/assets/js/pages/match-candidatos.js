/* ========================================
   MATCH DE CANDIDATOS
   Integração com backend - Seleção e aprovação de candidatos
   ======================================== */

import { MatchClient, VacanciesClient, CandidateClient } from '../../../client/client.js';

// Clientes da API
const matchClient = new MatchClient();
const vacanciesClient = new VacanciesClient();
const candidateClient = new CandidateClient();

// Estado da aplicação
let matches = [];
let filteredMatches = [];
let vacancies = [];
let selectedVacancyId = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await initMatchPage();
});

/**
 * Inicializa a página de match
 */
async function initMatchPage() {
    setupEventListeners();
    await loadVacancies();
    await loadAllMatches();
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

    // Filtros
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filterType = btn.dataset.filter || btn.textContent.trim().toLowerCase();
            applyFilter(filterType);
        });
    });

    // Delegação de eventos para botões de ação
    const candidatesList = document.querySelector('.candidates-list');
    if (candidatesList) {
        candidatesList.addEventListener('click', handleCandidateActions);
    }
}

/**
 * Carrega vagas disponíveis para criar seletor
 */
async function loadVacancies() {
    try {
        vacancies = await vacanciesClient.findAll();
        renderVacancySelector();
    } catch (error) {
        console.error('Erro ao carregar vagas:', error);
        showMessage('Erro ao carregar vagas', 'error');
    }
}

/**
 * Renderiza seletor de vagas
 */
function renderVacancySelector() {
    // Verificar se existe um seletor de vagas na página
    let vacancySelector = document.querySelector('.vacancy-selector');
    const isNewSelector = !vacancySelector;
    
    if (!vacancySelector) {
        // Criar seletor se não existir
        const searchBar = document.querySelector('.search-bar');
        if (searchBar) {
            vacancySelector = document.createElement('select');
            vacancySelector.className = 'vacancy-selector form-control';
            vacancySelector.style.marginLeft = '10px';
            vacancySelector.style.maxWidth = '250px';
            searchBar.appendChild(vacancySelector);
        }
    }

    if (vacancySelector) {
        // Limpar e preencher opções
        vacancySelector.innerHTML = '<option value="">Todas as vagas</option>';
        vacancies.forEach(vacancy => {
            const option = document.createElement('option');
            option.value = vacancy.id;
            option.textContent = vacancy.positionJob || vacancy.title || vacancy.area || `Vaga #${vacancy.id}`;
            vacancySelector.appendChild(option);
        });

        // Adicionar event listener apenas uma vez (quando o seletor é novo)
        if (isNewSelector) {
            vacancySelector.addEventListener('change', handleVacancyFilterChange);
        }
    }
}

/**
 * Handler para mudança no filtro de vagas
 */
async function handleVacancyFilterChange(e) {
    selectedVacancyId = e.target.value || null;
    console.log('📌 [Filter] Vaga selecionada:', selectedVacancyId || 'Todas');
    
    if (selectedVacancyId) {
        // GET /match/{vacancyId}/list
        await loadMatchesByVacancy(selectedVacancyId);
    } else {
        // GET /match (todos)
        await loadAllMatches();
    }
}

/**
 * Carrega todos os matches
 */
async function loadAllMatches() {
    try {
        showLoading(true);
        matches = await matchClient.findAll();
        filteredMatches = [...matches];
        renderCandidates();
    } catch (error) {
        console.error('Erro ao carregar matches:', error);
        showMessage('Erro ao carregar candidatos', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Carrega matches por vaga específica
 */
async function loadMatchesByVacancy(vacancyId) {
    try {
        showLoading(true);
        matches = await matchClient.findByVacancy(vacancyId);
        filteredMatches = [...matches];
        renderCandidates();
    } catch (error) {
        console.error('Erro ao carregar matches da vaga:', error);
        showMessage('Erro ao carregar candidatos da vaga', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Handler de busca
 */
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (!searchTerm) {
        filteredMatches = [...matches];
    } else {
        filteredMatches = matches.filter(match => {
            // Novo DTO: campos planos (candidateName, vacancyJob, managerName)
            const searchText = `${match.candidateName || ''} ${match.vacancyJob || ''} ${match.managerName || match.vacancyManagerName || ''}`.toLowerCase();
            return searchText.includes(searchTerm);
        });
    }
    
    renderCandidates();
}

/**
 * Handler de ações nos candidatos (delegação de eventos)
 */
async function handleCandidateActions(e) {
    const approveBtn = e.target.closest('.btn-approve');
    const rejectBtn = e.target.closest('.btn-reject');
    const viewMoreLink = e.target.closest('.view-more');

    if (approveBtn) {
        const matchId = approveBtn.dataset.matchId;
        await approveCandidate(matchId);
    } else if (rejectBtn) {
        const matchId = rejectBtn.dataset.matchId;
        await rejectCandidate(matchId);
    } else if (viewMoreLink) {
        e.preventDefault();
        const candidateId = viewMoreLink.dataset.candidateId;
        viewCandidateDetails(candidateId);
    }
}

/**
 * Renderiza a lista de candidatos
 */
function renderCandidates() {
    const candidatesList = document.querySelector('.candidates-list');
    if (!candidatesList) return;

    if (filteredMatches.length === 0) {
        candidatesList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>Nenhum candidato encontrado</p>
            </div>
        `;
        return;
    }

    candidatesList.innerHTML = '';
    filteredMatches.forEach(match => {
        const candidateItem = createCandidateItem(match);
        candidatesList.appendChild(candidateItem);
    });

    updateStatistics();
}

/**
 * Cria elemento de candidato
 */
function createCandidateItem(match) {
    const item = document.createElement('div');
    item.className = 'candidate-item';
    item.dataset.matchId = match.matchId; // Novo DTO: matchId em vez de id

    // Novo DTO: campos planos (não mais objetos aninhados)
    const candidateName = match.candidateName || 'Nome não informado';
    const candidateId = match.candidateId;
    const vacancyJob = match.vacancyJob || 'Não informada';
    // Gestor responsável pela vaga (substituindo "Área")
    const managerName = match.managerName || match.vacancyManagerName || 'Não informado';
    const score = match.score;
    const matchLevel = match.matchLevel || 'BAIXO';
    const status = match.status || 'pendente';
    
    // Obter texto e classe do badge de match
    const matchBadgeText = getMatchBadgeText(matchLevel);
    const matchBadgeClass = getMatchBadgeClass(matchLevel);
    
    // Verificar status do match
    const isProcessed = status === 'aceito' || status === 'rejeitado';

    item.innerHTML = `
        <div class="candidate-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="candidate-info">
            <h3>${candidateName}</h3>
            <p>${match.candidateCity ? match.candidateCity : ''}</p>
            <a href="#" class="view-more" data-candidate-id="${candidateId}">Ver mais</a>
        </div>
        <div class="candidate-details">
            <p><strong>Vaga:</strong> ${vacancyJob}</p>
            <p><strong>Gestor:</strong> ${managerName}</p>
            <p><strong>Score:</strong> ${score != null ? score.toFixed(1) + '%' : 'N/A'}</p>
        </div>
        <div class="candidate-actions">
            <button class="btn-action btn-approve ${status === 'aceito' ? 'approved' : ''}" 
                    data-match-id="${match.matchId}" 
                    title="Aprovar"
                    ${isProcessed ? 'disabled' : ''}>
                <i class="fas fa-check"></i>
            </button>
            <button class="btn-action btn-reject ${status === 'rejeitado' ? 'rejected' : ''}" 
                    data-match-id="${match.matchId}" 
                    title="Rejeitar"
                    ${isProcessed ? 'disabled' : ''}>
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="match-level">
            <span class="match-badge ${matchBadgeClass}">${matchBadgeText}</span>
            ${status !== 'pendente' ? `<span class="status-badge status-${status}">${status}</span>` : ''}
        </div>
    `;

    // Aplicar estilos de status
    if (status === 'aceito') {
        item.classList.add('approved');
    } else if (status === 'rejeitado') {
        item.classList.add('rejected');
    }

    return item;
}

/**
 * Calcula idade a partir da data de nascimento
 */
function calculateAge(birthDate) {
    if (!birthDate) return null;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

/**
 * Obtém texto do badge de match baseado no nível
 */
function getMatchBadgeText(matchLevel) {
    const texts = {
        'DESTAQUE': 'Destaque',
        'ALTO': 'Alto Match',
        'MEDIO': 'Médio Match',
        'BAIXO': 'Baixo Match'
    };
    return texts[matchLevel] || 'Match';
}

/**
 * Obtém classe CSS do badge de match
 */
function getMatchBadgeClass(matchLevel) {
    const classes = {
        'DESTAQUE': 'match-highlight',
        'ALTO': 'match-high',
        'MEDIO': 'match-medium',
        'BAIXO': 'match-low'
    };
    return classes[matchLevel] || 'match-low';
}

/**
 * Aplica filtro por tipo
 */
function applyFilter(filterType) {
    switch (filterType.toLowerCase()) {
        case 'todos':
        case 'all':
            filteredMatches = [...matches];
            break;
        case 'pendentes':
        case 'pending':
            // Considera pendente: status === 'pendente', status null ou undefined
            filteredMatches = matches.filter(m => !m.status || m.status === 'pendente');
            break;
        case 'aprovados':
        case 'approved':
            filteredMatches = matches.filter(m => m.status === 'aceito');
            break;
        case 'rejeitados':
        case 'rejected':
            filteredMatches = matches.filter(m => m.status === 'rejeitado');
            break;
        case 'destaque':
            filteredMatches = matches.filter(m => m.matchLevel === 'DESTAQUE');
            break;
        case 'alto':
            filteredMatches = matches.filter(m => m.matchLevel === 'ALTO');
            break;
        case 'medio':
        case 'médio':
            filteredMatches = matches.filter(m => m.matchLevel === 'MEDIO');
            break;
        case 'baixo':
            filteredMatches = matches.filter(m => m.matchLevel === 'BAIXO');
            break;
        default:
            filteredMatches = [...matches];
    }
    
    renderCandidates();
    showMessage(`Filtro aplicado: ${filterType}`, 'info');
}

/**
 * Aprova candidato
 */
async function approveCandidate(matchId) {
    // Validação do matchId
    if (!matchId || matchId === 'undefined' || matchId === 'null') {
        console.error('❌ [approveCandidate] matchId inválido:', matchId);
        showMessage('Erro: ID do match não encontrado', 'error');
        return;
    }
    
    try {
        console.log('📤 [approveCandidate] Aprovando match ID:', matchId);
        await matchClient.accept(matchId);
        
        // Atualizar estado local - usar matchId para encontrar
        const match = matches.find(m => m.matchId == matchId);
        if (match) {
            match.status = 'aceito';
        }
        
        // Atualizar UI
        updateCandidateUI(matchId, 'aceito');
        showMessage('Candidato aprovado com sucesso!', 'success');
        updateStatistics();
    } catch (error) {
        console.error('Erro ao aprovar candidato:', error);
        showMessage('Erro ao aprovar candidato', 'error');
    }
}

/**
 * Rejeita candidato
 */
async function rejectCandidate(matchId) {
    // Validação do matchId
    if (!matchId || matchId === 'undefined' || matchId === 'null') {
        console.error('❌ [rejectCandidate] matchId inválido:', matchId);
        showMessage('Erro: ID do match não encontrado', 'error');
        return;
    }
    
    try {
        console.log('📤 [rejectCandidate] Rejeitando match ID:', matchId);
        await matchClient.reject(matchId);
        
        // Atualizar estado local - usar matchId para encontrar
        const match = matches.find(m => m.matchId == matchId);
        if (match) {
            match.status = 'rejeitado';
        }
        
        // Atualizar UI
        updateCandidateUI(matchId, 'rejeitado');
        showMessage('Candidato rejeitado.', 'info');
        updateStatistics();
    } catch (error) {
        console.error('Erro ao rejeitar candidato:', error);
        showMessage('Erro ao rejeitar candidato', 'error');
    }
}

/**
 * Atualiza UI do candidato após ação
 */
function updateCandidateUI(matchId, status) {
    const item = document.querySelector(`[data-match-id="${matchId}"]`);
    if (!item) return;

    // Remove classes de status anteriores
    item.classList.remove('approved', 'rejected');
    
    // Adiciona nova classe de status
    if (status === 'aceito') {
        item.classList.add('approved');
    } else if (status === 'rejeitado') {
        item.classList.add('rejected');
    }
    
    // Atualiza botões
    const approveBtn = item.querySelector('.btn-approve');
    const rejectBtn = item.querySelector('.btn-reject');
    
    if (status === 'aceito') {
        approveBtn.classList.add('approved');
        approveBtn.disabled = true;
        rejectBtn.disabled = true;
        rejectBtn.style.opacity = '0.5';
    } else if (status === 'rejeitado') {
        rejectBtn.classList.add('rejected');
        rejectBtn.disabled = true;
        approveBtn.disabled = true;
        approveBtn.style.opacity = '0.5';
    }

    // Adicionar badge de status
    const matchLevelDiv = item.querySelector('.match-level');
    if (matchLevelDiv && !matchLevelDiv.querySelector('.status-badge')) {
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge status-${status}`;
        statusBadge.textContent = status;
        matchLevelDiv.appendChild(statusBadge);
    }
}

/**
 * Visualiza detalhes do candidato
 */
function viewCandidateDetails(candidateId) {
    if (candidateId) {
        window.location.href = `detalhes-candidato.html?id=${candidateId}`;
    } else {
        showMessage('ID do candidato não encontrado', 'warning');
    }
}

/**
 * Atualiza estatísticas na página
 */
function updateStatistics() {
    const total = matches.length;
    const approved = matches.filter(m => m.status === 'aceito').length;
    const rejected = matches.filter(m => m.status === 'rejeitado').length;
    // Considera pendente: status === 'pendente', status null ou undefined
    const pending = matches.filter(m => !m.status || m.status === 'pendente').length;

    // Atualizar elementos de estatísticas se existirem
    const statsTotal = document.querySelector('.stats-total');
    const statsApproved = document.querySelector('.stats-approved');
    const statsRejected = document.querySelector('.stats-rejected');
    const statsPending = document.querySelector('.stats-pending');

    if (statsTotal) statsTotal.textContent = total;
    if (statsApproved) statsApproved.textContent = approved;
    if (statsRejected) statsRejected.textContent = rejected;
    if (statsPending) statsPending.textContent = pending;
}

/**
 * Mostra/esconde loading
 */
function showLoading(show) {
    let loader = document.querySelector('.candidates-loader');
    
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.className = 'candidates-loader';
            loader.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
            const candidatesList = document.querySelector('.candidates-list');
            if (candidatesList) {
                candidatesList.parentNode.insertBefore(loader, candidatesList);
            }
        }
        loader.style.display = 'block';
    } else {
        if (loader) {
            loader.style.display = 'none';
        }
    }
}

/**
 * Mostra mensagem de feedback
 */
function showMessage(message, type = 'info') {
    // Remove mensagem anterior se existir
    const existingMessage = document.querySelector('.candidate-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Cria nova mensagem
    const messageEl = document.createElement('div');
    messageEl.className = `candidate-message candidate-message-${type}`;
    messageEl.textContent = message;
    
    // Estilos da mensagem
    Object.assign(messageEl.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '6px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        animation: 'slideIn 0.3s ease',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    });

    // Cores baseadas no tipo
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8',
        warning: '#ffc107'
    };

    messageEl.style.backgroundColor = colors[type] || colors.info;

    // Adiciona ao DOM
    document.body.appendChild(messageEl);

    // Remove após 3 segundos
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.remove();
        }
    }, 3000);
}
