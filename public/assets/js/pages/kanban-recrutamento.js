/* ========================================
   KANBAN DE RECRUTAMENTO
   Funcionalidades de drag and drop e gestão de candidatos
   ======================================== */

class KanbanRecrutamento {
    constructor() {
        this.draggedElement = null;
        this.candidates = [];
        this.init();
    }

    /**
     * Inicializa a página do Kanban de Recrutamento
     */
    async init() {
        await this.loadCandidates();
        this.setupDragAndDrop();
        this.setupSearch();
        this.setupSidebar();
    }

    /**
     * Configura funcionalidade de drag and drop
     */
    setupDragAndDrop() {
        const cards = document.querySelectorAll('.kanban-card');
        const columns = document.querySelectorAll('.kanban-column');

        cards.forEach(card => {
            card.draggable = true;
            
            card.addEventListener('dragstart', (e) => {
                this.draggedElement = card;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                this.draggedElement = null;
            });
        });

        columns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.classList.add('drag-over');
            });

            column.addEventListener('dragleave', () => {
                column.classList.remove('drag-over');
            });

            column.addEventListener('drop', async (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');
                
                if (this.draggedElement) {
                    const columnContent = column.querySelector('.column-content');
                    const processId = this.draggedElement.dataset.processId;
                    const newStatus = column.dataset.status;
                    
                    if (processId && newStatus) {
                        try {
                            // Atualiza estágio no backend
                            const { SelectionProcessClient } = await import('../../../client/client.js');
                            const client = new SelectionProcessClient();
                            const newStage = this.mapStatusToStage(newStatus);
                            
                            await client.moveToStage(parseInt(processId), newStage);
                            
                            // Move o card visualmente
                            columnContent.appendChild(this.draggedElement);
                            
                            // Atualiza dados locais
                            const candidate = this.candidates.find(c => c.id === parseInt(processId));
                            if (candidate) {
                                candidate.status = newStatus;
                            }
                            
                            this.showMessage('Candidato movido com sucesso!', 'success');
                            this.updateColumnCounts();
                        } catch (error) {
                            console.error('Erro ao atualizar estágio:', error);
                            this.showMessage('Erro ao mover candidato. Tente novamente.', 'error');
                            // Recarrega os candidatos em caso de erro
                            await this.loadCandidates();
                        }
                    } else {
                        columnContent.appendChild(this.draggedElement);
                    }
                }
            });
        });
    }

    /**
     * Atualiza status do candidato baseado na coluna
     */
    updateCandidateStatus(card, column) {
        const columnTitle = column.querySelector('.column-header h3').textContent;
        const candidateName = card.querySelector('.card-header h4').textContent;
        
        let newStatus = '';
        switch(columnTitle) {
            case 'Triagem':
                newStatus = 'screening';
                break;
            case 'Entrevista RH':
                newStatus = 'hr_interview';
                break;
            case 'Entrevista Gestor':
                newStatus = 'manager_interview';
                break;
        }

        // Atualizar dados do candidato
        const candidate = this.candidates.find(c => c.name === candidateName);
        if (candidate) {
            candidate.status = newStatus;
            candidate.lastUpdate = new Date();
        }

        // Adicionar indicador visual de progresso
        this.addProgressIndicator(card, newStatus);
    }

    /**
     * Adiciona indicador de progresso ao card
     */
    addProgressIndicator(card, status) {
        // Remove indicador anterior se existir
        const existingIndicator = card.querySelector('.progress-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Cria novo indicador
        const indicator = document.createElement('div');
        indicator.className = `progress-indicator ${status}`;
        card.style.position = 'relative';
        card.appendChild(indicator);
    }

    /**
     * Configura funcionalidade de busca
     */
    setupSearch() {
        const searchInput = document.querySelector('.search-bar input');
        
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', async (e) => {
                const searchTerm = e.target.value.trim();
                
                // Debounce
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(async () => {
                    if (searchTerm.length >= 2) {
                        try {
                            const { SelectionProcessClient } = await import('../../../client/client.js');
                            const client = new SelectionProcessClient();
                            const results = await client.search(searchTerm);
                            
                            // Atualiza candidatos com resultados da busca
                            this.candidates = results.map(process => ({
                                id: process.id,
                                name: process.candidate?.name || 'N/A',
                                position: process.vacancy?.cargo || 'N/A',
                                manager: process.recruiter?.name || 'N/A',
                                model: process.vacancy?.modeloTrabalho || 'N/A',
                                status: this.mapStageToStatus(process.currentStage),
                                type: process.vacancy?.regimeContratacao || 'N/A',
                                process: process
                            }));
                            
                            this.renderCandidates();
                            this.updateColumnCounts();
                        } catch (error) {
                            console.error('Erro na busca:', error);
                            // Fallback para filtro local
                            this.filterCandidates(searchTerm.toLowerCase());
                        }
                    } else if (searchTerm.length === 0) {
                        // Recarrega todos se busca estiver vazia
                        await this.loadCandidates();
                    } else {
                        // Filtro local para termos curtos
                        this.filterCandidates(searchTerm.toLowerCase());
                    }
                }, 300);
            });
        }
    }

    /**
     * Filtra candidatos baseado no termo de busca
     */
    filterCandidates(searchTerm) {
        const cards = document.querySelectorAll('.kanban-card');
        
        cards.forEach(card => {
            const cardText = card.textContent.toLowerCase();
            const column = card.closest('.kanban-column');
            
            if (cardText.includes(searchTerm)) {
                card.style.display = 'block';
                column.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });

        // Esconder colunas vazias
        this.hideEmptyColumns();
    }

    /**
     * Esconde colunas que não têm cards visíveis
     */
    hideEmptyColumns() {
        const columns = document.querySelectorAll('.kanban-column');
        
        columns.forEach(column => {
            const visibleCards = column.querySelectorAll('.kanban-card[style*="display: block"], .kanban-card:not([style*="display: none"])');
            
            if (visibleCards.length === 0) {
                column.style.display = 'none';
            } else {
                column.style.display = 'block';
            }
        });
    }

    /**
     * Configura funcionalidades da sidebar
     */
    setupSidebar() {
        const sidebarItems = document.querySelectorAll('.sidebar-item');
        
        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove active de todos os itens
                sidebarItems.forEach(i => i.classList.remove('active'));
                
                // Adiciona active ao item clicado
                item.classList.add('active');
                
                // Simular navegação (implementar roteamento real)
                const itemText = item.querySelector('span').textContent;
                this.handleNavigation(itemText);
            });
        });
    }

    /**
     * Manipula navegação da sidebar
     */
    handleNavigation(itemText) {
        switch(itemText) {
            case 'Kanban Abertura Vaga':
                window.location.href = 'kanban-abertura-vaga.html';
                break;
            case 'Match Candidatos':
                window.location.href = 'match-candidatos.html';
                break;
            case 'Recrutamento':
                // Já estamos nesta página
                break;
            default:
                console.log('Navegação para:', itemText);
        }
    }

    /**
     * Carrega candidatos do backend
     */
    async loadCandidates() {
        try {
            const { SelectionProcessClient } = await import('../../../client/client.js');
            const client = new SelectionProcessClient();
            
            // Mapeamento de estágios
            const stages = [
                'triagem_inicial',
                'avaliacao_fit_cultural',
                'teste_tecnico',
                'entrevista_tecnica',
                'entrevista_final',
                'proposta_fechamento',
                'contratacao'
            ];
            
            this.candidates = [];
            
            // Carrega processos por estágio
            for (const stage of stages) {
                try {
                    const processes = await client.listByStage(stage);
                    processes.forEach(process => {
                        this.candidates.push({
                            id: process.id,
                            name: process.candidate?.name || 'N/A',
                            position: process.vacancy?.cargo || 'N/A',
                            manager: process.recruiter?.name || 'N/A',
                            model: process.vacancy?.modeloTrabalho || 'N/A',
                            status: this.mapStageToStatus(stage),
                            type: process.vacancy?.regimeContratacao || 'N/A',
                            process: process
                        });
                    });
                } catch (error) {
                    console.warn(`Erro ao carregar estágio ${stage}:`, error);
                }
            }
            
            this.renderCandidates();
            this.updateColumnCounts();
        } catch (error) {
            console.error('Erro ao carregar candidatos:', error);
            this.showMessage('Erro ao carregar processos de seleção', 'error');
            this.candidates = [];
            this.updateColumnCounts();
        }
    }

    /**
     * Mapeia estágio do backend para status do frontend
     */
    mapStageToStatus(stage) {
        const statusMap = {
            'triagem_inicial': 'screening',
            'avaliacao_fit_cultural': 'hr_interview',
            'teste_tecnico': 'hr_interview',
            'entrevista_tecnica': 'manager_interview',
            'entrevista_final': 'manager_interview',
            'proposta_fechamento': 'manager_interview',
            'contratacao': 'manager_interview'
        };
        return statusMap[stage] || 'screening';
    }

    /**
     * Mapeia status do frontend para estágio do backend
     */
    mapStatusToStage(status) {
        const stageMap = {
            'screening': 'triagem_inicial',
            'hr_interview': 'avaliacao_fit_cultural',
            'manager_interview': 'entrevista_tecnica'
        };
        return stageMap[status] || 'triagem_inicial';
    }

    /**
     * Renderiza candidatos nas colunas apropriadas
     */
    renderCandidates() {
        // Limpa colunas existentes
        document.querySelectorAll('.column-content').forEach(col => {
            col.innerHTML = '';
        });
        
        // Agrupa por status
        const byStatus = {
            'screening': [],
            'hr_interview': [],
            'manager_interview': []
        };
        
        this.candidates.forEach(candidate => {
            const status = candidate.status || 'screening';
            if (byStatus[status]) {
                byStatus[status].push(candidate);
            }
        });
        
        // Renderiza em cada coluna
        Object.keys(byStatus).forEach(status => {
            const column = document.querySelector(`[data-status="${status}"] .column-content`);
            if (column) {
                byStatus[status].forEach(candidate => {
                    const card = this.createCandidateCard(candidate);
                    column.appendChild(card);
                    this.setupCardDragAndDrop(card);
                });
            }
        });
    }

    /**
     * Atualiza contadores das colunas
     */
    updateColumnCounts() {
        const columns = document.querySelectorAll('.kanban-column');
        
        columns.forEach(column => {
            const columnTitle = column.querySelector('.column-header h3').textContent;
            const cards = column.querySelectorAll('.kanban-card');
            
            // Remove contador anterior se existir
            const existingCount = column.querySelector('.column-count');
            if (existingCount) {
                existingCount.remove();
            }
            
            // Adiciona novo contador
            const count = document.createElement('span');
            count.className = 'column-count';
            count.textContent = cards.length;
            
            const header = column.querySelector('.column-header');
            header.appendChild(count);
        });
    }

    /**
     * Adiciona novo candidato ao Kanban
     */
    addCandidate(candidateData) {
        const newCandidate = {
            id: Date.now(),
            ...candidateData,
            status: 'screening',
            createdAt: new Date()
        };

        this.candidates.push(newCandidate);
        
        // Adicionar card à coluna de triagem
        const triagemColumn = document.querySelector('.kanban-column:first-child .column-content');
        if (triagemColumn) {
            const card = this.createCandidateCard(newCandidate);
            triagemColumn.appendChild(card);
            this.setupCardDragAndDrop(card);
            this.updateColumnCounts();
        }

        this.showMessage('Candidato adicionado com sucesso!', 'success');
    }

    /**
     * Cria card de candidato
     */
    createCandidateCard(candidate) {
        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.draggable = true;
        card.dataset.processId = candidate.id;
        
        const tagClass = this.getTagClass(candidate.type);
        
        card.innerHTML = `
            <div class="card-header">
                <h4>${candidate.name}</h4>
                <span class="tag ${tagClass}">${candidate.type}</span>
            </div>
            <div class="card-body">
                <p><strong>Vaga:</strong> ${candidate.position}</p>
                <p><strong>Gestor:</strong> ${candidate.manager}</p>
                <p><strong>Modelo:</strong> ${candidate.model}</p>
            </div>
        `;

        return card;
    }

    /**
     * Obtém classe CSS da tag baseada no tipo
     */
    getTagClass(type) {
        if (type === 'CLT') return 'tag-clt';
        if (type === 'Estágio') return 'tag-estagio';
        if (type.includes('Salário')) return 'tag-salary';
        return 'tag-n';
    }

    /**
     * Configura drag and drop para um card específico
     */
    setupCardDragAndDrop(card) {
        card.addEventListener('dragstart', (e) => {
            this.draggedElement = card;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            this.draggedElement = null;
        });
    }

    /**
     * Obtém estatísticas do processo
     */
    getProcessStatistics() {
        const stats = {
            total: this.candidates.length,
            screening: 0,
            hr_interview: 0,
            manager_interview: 0
        };

        this.candidates.forEach(candidate => {
            stats[candidate.status] = (stats[candidate.status] || 0) + 1;
        });

        return stats;
    }

    /**
     * Mostra estatísticas do processo
     */
    showProcessStatistics() {
        const stats = this.getProcessStatistics();
        const message = `Total: ${stats.total} | Triagem: ${stats.screening} | RH: ${stats.hr_interview} | Gestor: ${stats.manager_interview}`;
        this.showMessage(message, 'info');
    }

    /**
     * Mostra mensagem de feedback
     */
    showMessage(message, type = 'info') {
        // Remove mensagem anterior se existir
        const existingMessage = document.querySelector('.kanban-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Cria nova mensagem
        const messageEl = document.createElement('div');
        messageEl.className = `kanban-message kanban-message-${type}`;
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
    new KanbanRecrutamento();
});
