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
 * Filtra apenas matches pendentes (não processados)
 * Um match é considerado pendente se:
 * - status === 'pendente' ou status é null/undefined
 * - NÃO foi convertido em SelectionProcess/KanbanCard (hasSelectionProcess === false)
 * 
 * REGRAS DO SISTEMA:
 * - Se o match foi aprovado → vira SelectionProcess + KanbanCard → NÃO aparece no Match
 * - Se o match foi rejeitado → vira SelectionProcess → NÃO aparece no Match
 * - Se o candidato já tem SelectionProcess (qualquer estágio) → NÃO aparece no Match
 */
function filterPendingMatches(matchList) {
    if (!Array.isArray(matchList)) {
        console.warn('⚠️ [filterPendingMatches] Lista de matches não é um array:', matchList);
        return [];
    }
    
    const filtered = matchList.filter(match => {
        // Critério 1: Verificar se já tem SelectionProcess
        // Se hasSelectionProcess === true, o candidato já está no Kanban
        if (match.hasSelectionProcess === true) {
            console.log(`🚫 [Filter] Match ${match.matchId} (${match.candidateName}) - Já tem SelectionProcess`);
            return false;
        }
        
        // Critério 2: Verificar o status do match
        const status = (match.status || '').toLowerCase().trim();
        
        // Status que indicam que o match foi processado (não deve aparecer)
        const processedStatuses = ['aceito', 'aprovado', 'accepted', 'approved', 'rejeitado', 'rejected', 'recusado'];
        
        if (processedStatuses.includes(status)) {
            console.log(`🚫 [Filter] Match ${match.matchId} (${match.candidateName}) - Status: ${status}`);
            return false;
        }
        
        // Critério 3: Verificar outros campos que podem indicar processamento
        if (match.processed === true || match.isProcessed === true) {
            console.log(`🚫 [Filter] Match ${match.matchId} (${match.candidateName}) - Marcado como processado`);
            return false;
        }
        
        // Critério 4: Verificar se tem selectionProcessId (indica que já foi para o Kanban)
        if (match.selectionProcessId || match.selection_process_id) {
            console.log(`🚫 [Filter] Match ${match.matchId} (${match.candidateName}) - Tem SelectionProcess ID`);
            return false;
        }
        
        // Se passou por todos os critérios, é pendente
        return true;
    });
    
    console.log(`📊 [filterPendingMatches] Total: ${matchList.length} → Pendentes: ${filtered.length}`);
    
    return filtered;
}

/**
 * Carrega todos os matches (apenas pendentes)
 * IMPORTANTE: Usa findPending() para buscar do backend apenas matches não processados
 * Aplica filtro adicional no frontend como garantia dupla
 */
async function loadAllMatches() {
    try {
        showLoading(true);
        
        // Estratégia: Tenta buscar apenas pendentes do backend primeiro
        let allMatches = [];
        try {
            // Tenta usar endpoint específico para pendentes (mais eficiente)
            allMatches = await matchClient.findPending();
            console.log(`📤 [loadAllMatches] Usando findPending() - ${allMatches.length} matches`);
        } catch (pendingError) {
            console.warn('⚠️ [loadAllMatches] findPending falhou, usando findAll:', pendingError.message);
            allMatches = await matchClient.findAll();
        }
        
        // Filtro duplo no frontend (garantia adicional)
        // Mesmo que o backend filtre, aplicamos novamente para garantir
        matches = filterPendingMatches(allMatches);
        filteredMatches = [...matches];
        
        console.log(`📊 [loadAllMatches] Recebidos: ${allMatches.length}, Após filtro: ${matches.length}`);
        
        // Log detalhado se houver diferença (indica problema no backend)
        if (allMatches.length !== matches.length) {
            const filteredOut = allMatches.filter(m => !matches.some(pm => pm.matchId === m.matchId));
            console.warn('⚠️ [loadAllMatches] Matches filtrados que deveriam ter sido filtrados no backend:', filteredOut);
        }
        
        renderCandidates();
    } catch (error) {
        console.error('❌ [loadAllMatches] Erro ao carregar matches:', error);
        showMessage('Erro ao carregar candidatos', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Carrega matches por vaga específica (apenas pendentes)
 * IMPORTANTE: Aplica filtro rigoroso para não exibir candidatos já processados
 */
async function loadMatchesByVacancy(vacancyId) {
    try {
        showLoading(true);
        
        // Busca todos os matches da vaga
        const allMatches = await matchClient.findByVacancy(vacancyId);
        
        // Filtro rigoroso: Remove qualquer match que já foi processado
        matches = filterPendingMatches(allMatches);
        
        console.log(`📊 [loadMatchesByVacancy] Vaga ${vacancyId}:`);
        console.log(`   - Total recebido: ${allMatches.length}`);
        console.log(`   - Após filtro: ${matches.length}`);
        
        // Log detalhado dos filtrados para debug
        if (allMatches.length !== matches.length) {
            const filteredOut = allMatches.filter(m => !matches.some(pm => pm.matchId === m.matchId));
            console.log('   - Removidos (já processados):', filteredOut.map(m => `${m.candidateName} (${m.status || 'sem status'})`));
        }
        
        filteredMatches = [...matches];
        renderCandidates();
    } catch (error) {
        console.error('❌ [loadMatchesByVacancy] Erro ao carregar matches da vaga:', error);
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
 * IMPORTANTE: Aplica filtro de segurança antes de renderizar
 */
function renderCandidates() {
    const candidatesList = document.querySelector('.candidates-list');
    if (!candidatesList) return;

    // Filtro de segurança final antes de renderizar
    // Garante que nenhum candidato já processado seja exibido
    const matchesToRender = filteredMatches.filter(match => {
        const status = (match.status || '').toLowerCase();
        const processedStatuses = ['aceito', 'aprovado', 'accepted', 'approved', 'rejeitado', 'rejected', 'recusado'];
        
        // Não renderizar se já foi processado
        if (processedStatuses.includes(status)) return false;
        if (match.hasSelectionProcess === true) return false;
        if (match.selectionProcessId || match.selection_process_id) return false;
        if (match.processed === true) return false;
        
        return true;
    });
    
    console.log(`🖼️ [renderCandidates] Renderizando ${matchesToRender.length} candidatos pendentes`);

    if (matchesToRender.length === 0) {
        candidatesList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-check-circle" style="color: #28a745;"></i>
                <p>Todos os candidatos foram processados!</p>
                <small>Não há candidatos pendentes de análise.</small>
            </div>
        `;
        return;
    }

    candidatesList.innerHTML = '';
    matchesToRender.forEach(match => {
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
    const status = (match.status || 'pendente').toLowerCase();
    
    // Obter texto e classe do badge de match
    const matchBadgeText = getMatchBadgeText(matchLevel);
    const matchBadgeClass = getMatchBadgeClass(matchLevel);
    
    // Verificar status do match - verifica múltiplos critérios
    const processedStatuses = ['aceito', 'aprovado', 'accepted', 'approved', 'rejeitado', 'rejected', 'recusado'];
    const isProcessed = processedStatuses.includes(status) || 
                        match.hasSelectionProcess === true || 
                        match.processed === true ||
                        match.selectionProcessId != null;

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
        
        // IMPORTANTE: Remover imediatamente o candidato da lista
        removeMatchFromList(matchId);
        
        showMessage('Candidato aprovado com sucesso! Redirecionando para o Kanban...', 'success');
        
        // Redirecionar para o Kanban de Recrutamento com foco na coluna "Aguardando Triagem"
        setTimeout(() => {
            window.location.href = 'kanban-recrutamento.html?focusStage=aguardando_triagem';
        }, 1500); // Aguarda 1.5s para o usuário ver a mensagem de sucesso
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
        
        // IMPORTANTE: Remover imediatamente o candidato da lista
        removeMatchFromList(matchId);
        
        showMessage('Candidato rejeitado e removido da lista.', 'info');
    } catch (error) {
        console.error('Erro ao rejeitar candidato:', error);
        showMessage('Erro ao rejeitar candidato', 'error');
    }
}

/**
 * Remove um match da lista (após aprovação ou rejeição)
 * @param {string|number} matchId - ID do match a ser removido
 */
function removeMatchFromList(matchId) {
    console.log(`🗑️ [removeMatchFromList] Removendo match ${matchId} da lista`);
    
    // Remove do array principal
    const indexMain = matches.findIndex(m => m.matchId == matchId);
    if (indexMain > -1) {
        matches.splice(indexMain, 1);
        console.log(`✅ Removido do array matches. Restantes: ${matches.length}`);
    }
    
    // Remove do array filtrado
    const indexFiltered = filteredMatches.findIndex(m => m.matchId == matchId);
    if (indexFiltered > -1) {
        filteredMatches.splice(indexFiltered, 1);
        console.log(`✅ Removido do array filteredMatches. Restantes: ${filteredMatches.length}`);
    }
    
    // Remove o elemento do DOM com animação
    const item = document.querySelector(`[data-match-id="${matchId}"]`);
    if (item) {
        // Adiciona animação de fade-out
        item.style.transition = 'all 0.3s ease';
        item.style.opacity = '0';
        item.style.transform = 'translateX(50px)';
        
        // Remove após a animação
        setTimeout(() => {
            item.remove();
            
            // Atualiza estatísticas
            updateStatistics();
            
            // Se não houver mais candidatos, mostra mensagem
            if (filteredMatches.length === 0) {
                const candidatesList = document.querySelector('.candidates-list');
                if (candidatesList) {
                    candidatesList.innerHTML = `
                        <div class="no-results">
                            <i class="fas fa-check-circle" style="color: #28a745;"></i>
                            <p>Todos os candidatos foram processados!</p>
                        </div>
                    `;
                }
            }
        }, 300);
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
