/* ========================================
   MATCH DE CANDIDATOS
   Funcionalidades de seleção e aprovação de candidatos
   ======================================== */

class MatchCandidatos {
    constructor() {
        this.candidates = [];
        this.selectedCandidates = new Set();
        this.approvedCandidates = new Set();
        this.rejectedCandidates = new Set();
        this.vacancyId = null;
        this.init();
    }

    /**
     * Inicializa a página
     */
    async init() {
        // Obtém ID da vaga da URL ou localStorage
        const urlParams = new URLSearchParams(window.location.search);
        this.vacancyId = urlParams.get('vacancyId') || localStorage.getItem('selectedVacancyId');
        
        if (!this.vacancyId) {
            this.showMessage('Nenhuma vaga selecionada. Redirecionando...', 'warning');
            setTimeout(() => {
                window.location.href = 'vagas.html';
            }, 2000);
            return;
        }
        
        this.setupSearch();
        this.setupFilters();
        this.setupActions();
        await this.loadCandidates();
    }

    /**
     * Configura funcionalidade de busca
     */
    setupSearch() {
        const searchInput = document.querySelector('.search-bar input');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                this.filterCandidates(searchTerm);
            });
        }
    }

    /**
     * Configura funcionalidade dos filtros
     */
    setupFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active de todos os botões
                filterBtns.forEach(b => b.classList.remove('active'));
                
                // Adiciona active ao botão clicado
                btn.classList.add('active');
                
                // Aplica filtro
                const filterType = btn.textContent.trim();
                this.applyFilter(filterType);
            });
        });
    }

    /**
     * Configura ações dos candidatos
     */
    setupActions() {
        const approveBtns = document.querySelectorAll('.btn-approve');
        const rejectBtns = document.querySelectorAll('.btn-reject');
        const viewMoreLinks = document.querySelectorAll('.view-more');

        approveBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                this.approveCandidate(index);
            });
        });

        rejectBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                this.rejectCandidate(index);
            });
        });

        viewMoreLinks.forEach((link, index) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.viewCandidateDetails(index);
            });
        });
    }

    /**
     * Carrega candidatos do backend
     */
    async loadCandidates() {
        try {
            const { CandidateMatchClient } = await import('../../../client/client.js');
            const client = new CandidateMatchClient();
            
            // Calcula matches se necessário ou lista matches existentes
            let matches;
            try {
                matches = await client.listMatches(parseInt(this.vacancyId));
            } catch (error) {
                // Se não houver matches, calcula
                matches = await client.calculateMatch(parseInt(this.vacancyId));
            }
            
            // Converte para formato esperado pela interface
            this.candidates = matches.map(match => ({
                id: match.matchId || match.id,
                candidateId: match.candidate?.id,
                name: match.candidate?.name || 'N/A',
                age: this.calculateAge(match.candidate?.birthDate),
                location: `${match.candidate?.city || ''}, ${match.candidate?.state || ''}`.trim() || 'N/A',
                position: match.vacancy?.cargo || 'N/A',
                area: match.vacancy?.area || 'N/A',
                matchLevel: this.mapMatchLevel(match.matchLevel || match.score),
                score: match.score || 0,
                status: 'pending',
                match: match
            }));

            this.renderCandidates();
        } catch (error) {
            console.error('Erro ao carregar candidatos:', error);
            this.showMessage('Erro ao carregar matches. Tente novamente.', 'error');
            this.candidates = [];
            this.renderCandidates();
        }
    }

    /**
     * Calcula idade a partir da data de nascimento
     */
    calculateAge(birthDate) {
        if (!birthDate) return 'N/A';
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    /**
     * Mapeia nível de match do backend para frontend
     */
    mapMatchLevel(matchLevel) {
        if (typeof matchLevel === 'string') {
            const levelMap = {
                'HIGHLIGHT': 'highlight',
                'HIGH': 'high',
                'MEDIUM': 'medium',
                'LOW': 'low'
            };
            return levelMap[matchLevel.toUpperCase()] || 'medium';
        }
        
        // Se for um score numérico
        if (typeof matchLevel === 'number') {
            if (matchLevel >= 80) return 'highlight';
            if (matchLevel >= 60) return 'high';
            if (matchLevel >= 40) return 'medium';
            return 'low';
        }
        
        return 'medium';
    }

    /**
     * Renderiza a lista de candidatos
     */
    renderCandidates() {
        const candidatesList = document.querySelector('.candidates-list');
        if (!candidatesList) return;

        candidatesList.innerHTML = '';

        this.candidates.forEach((candidate, index) => {
            const candidateItem = this.createCandidateItem(candidate, index);
            candidatesList.appendChild(candidateItem);
        });

        // Reconfigurar ações
        this.setupActions();
    }

    /**
     * Cria elemento de candidato
     */
    createCandidateItem(candidate, index) {
        const item = document.createElement('div');
        item.className = 'candidate-item';
        item.dataset.index = index;

        const matchBadgeText = this.getMatchBadgeText(candidate.matchLevel);
        const matchBadgeClass = `match-${candidate.matchLevel}`;

        item.innerHTML = `
            <div class="candidate-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="candidate-info">
                <h3>${candidate.name}</h3>
                <p>${candidate.age} Anos, ${candidate.location}</p>
                <a href="#" class="view-more">Ver mais</a>
            </div>
            <div class="candidate-details">
                <p><strong>Vaga:</strong> ${candidate.position}</p>
                <p><strong>Área:</strong> ${candidate.area}</p>
            </div>
            <div class="candidate-actions">
                <button class="btn-action btn-approve" title="Aprovar">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn-action btn-reject" title="Rejeitar">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="match-level">
                <span class="match-badge ${matchBadgeClass}">${matchBadgeText}</span>
            </div>
        `;

        return item;
    }

    /**
     * Obtém texto do badge de match
     */
    getMatchBadgeText(matchLevel) {
        const texts = {
            highlight: 'Destaque',
            high: 'Alto Match',
            medium: 'Médio Match',
            low: 'Baixo Match'
        };
        return texts[matchLevel] || 'Match';
    }

    /**
     * Filtra candidatos baseado no termo de busca
     */
    filterCandidates(searchTerm) {
        const items = document.querySelectorAll('.candidate-item');
        
        items.forEach((item, index) => {
            const candidate = this.candidates[index];
            if (!candidate) return;

            const text = `${candidate.name} ${candidate.position} ${candidate.area}`.toLowerCase();
            
            if (text.includes(searchTerm)) {
                item.style.display = 'grid';
            } else {
                item.style.display = 'none';
            }
        });
    }

    /**
     * Aplica filtro por tipo
     */
    async applyFilter(filterType) {
        try {
            const { CandidateMatchClient } = await import('../../../client/client.js');
            const client = new CandidateMatchClient();
            
            // Mapeia filtros do frontend para backend
            const filters = {};
            if (filterType.includes('Alto')) filters.level = 'HIGH';
            if (filterType.includes('Médio')) filters.level = 'MEDIUM';
            if (filterType.includes('Baixo')) filters.level = 'LOW';
            
            const matches = await client.listMatches(parseInt(this.vacancyId), filters);
            
            // Atualiza candidatos com resultados filtrados
            this.candidates = matches.map(match => ({
                id: match.matchId || match.id,
                candidateId: match.candidate?.id,
                name: match.candidate?.name || 'N/A',
                age: this.calculateAge(match.candidate?.birthDate),
                location: `${match.candidate?.city || ''}, ${match.candidate?.state || ''}`.trim() || 'N/A',
                position: match.vacancy?.cargo || 'N/A',
                area: match.vacancy?.area || 'N/A',
                matchLevel: this.mapMatchLevel(match.matchLevel || match.score),
                score: match.score || 0,
                status: 'pending',
                match: match
            }));
            
            this.renderCandidates();
            this.showMessage(`Filtro aplicado: ${filterType}`, 'info');
        } catch (error) {
            console.error('Erro ao aplicar filtro:', error);
            this.showMessage('Erro ao aplicar filtro. Tente novamente.', 'error');
        }
    }

    /**
     * Aprova candidato
     */
    async approveCandidate(index) {
        const candidate = this.candidates[index];
        if (!candidate) return;

        try {
            const { CandidateMatchClient } = await import('../../../client/client.js');
            const client = new CandidateMatchClient();
            
            await client.acceptCandidate(candidate.id);
            
            this.approvedCandidates.add(candidate.id);
            this.rejectedCandidates.delete(candidate.id);
            
            this.updateCandidateStatus(index, 'approved');
            this.showMessage(`Candidato ${candidate.name} aprovado!`, 'success');
        } catch (error) {
            console.error('Erro ao aprovar candidato:', error);
            this.showMessage('Erro ao aprovar candidato. Tente novamente.', 'error');
        }
    }

    /**
     * Rejeita candidato
     */
    async rejectCandidate(index) {
        const candidate = this.candidates[index];
        if (!candidate) return;

        try {
            const { CandidateMatchClient } = await import('../../../client/client.js');
            const client = new CandidateMatchClient();
            
            await client.rejectCandidate(candidate.id);
            
            this.rejectedCandidates.add(candidate.id);
            this.approvedCandidates.delete(candidate.id);
            
            this.updateCandidateStatus(index, 'rejected');
            this.showMessage(`Candidato ${candidate.name} rejeitado.`, 'info');
        } catch (error) {
            console.error('Erro ao rejeitar candidato:', error);
            this.showMessage('Erro ao rejeitar candidato. Tente novamente.', 'error');
        }
    }

    /**
     * Atualiza status visual do candidato
     */
    updateCandidateStatus(index, status) {
        const item = document.querySelector(`[data-index="${index}"]`);
        if (!item) return;

        // Remove classes de status anteriores
        item.classList.remove('approved', 'rejected');
        
        // Adiciona nova classe de status
        item.classList.add(status);
        
        // Atualiza botões
        const approveBtn = item.querySelector('.btn-approve');
        const rejectBtn = item.querySelector('.btn-reject');
        
        if (status === 'approved') {
            approveBtn.style.background = '#28a745';
            approveBtn.style.color = 'white';
            rejectBtn.style.opacity = '0.5';
            rejectBtn.disabled = true;
        } else if (status === 'rejected') {
            rejectBtn.style.background = '#dc3545';
            rejectBtn.style.color = 'white';
            approveBtn.style.opacity = '0.5';
            approveBtn.disabled = true;
        }
    }

    /**
     * Visualiza detalhes do candidato
     */
    viewCandidateDetails(index) {
        const candidate = this.candidates[index];
        if (!candidate) return;

        // Salva ID do candidato e navega para detalhes
        if (candidate.candidateId) {
            localStorage.setItem('selectedCandidateId', candidate.candidateId);
            window.location.href = `detalhes-candidato.html?id=${candidate.candidateId}`;
        } else {
            this.showMessage(`Visualizando detalhes de ${candidate.name}`, 'info');
        }
    }

    /**
     * Obtém estatísticas dos candidatos
     */
    getStatistics() {
        const total = this.candidates.length;
        const approved = this.approvedCandidates.size;
        const rejected = this.rejectedCandidates.size;
        const pending = total - approved - rejected;

        return {
            total,
            approved,
            rejected,
            pending
        };
    }

    /**
     * Mostra estatísticas
     */
    showStatistics() {
        const stats = this.getStatistics();
        const message = `Total: ${stats.total} | Aprovados: ${stats.approved} | Rejeitados: ${stats.rejected} | Pendentes: ${stats.pending}`;
        this.showMessage(message, 'info');
    }

    /**
     * Mostra mensagem de feedback
     */
    showMessage(message, type = 'info') {
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
            animation: 'slideIn 0.3s ease'
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
}

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new MatchCandidatos();
});
