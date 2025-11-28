/* ========================================
   KANBAN ABERTURA DE VAGA
   Funcionalidades de drag and drop e interações
   ======================================== */

class KanbanAberturaVaga {
    constructor() {
        this.draggedElement = null;
        this.cards = [];
        this.init();
    }

    /**
     * Inicializa a página do Kanban
     */
    async init() {
        await this.loadCards();
        this.setupDragAndDrop();
        this.setupSearch();
        this.setupSidebar();
    }

    /**
     * Carrega cards do backend
     */
    async loadCards() {
        try {
            const { OpeningRequestClient } = await import('../../../client/client.js');
            const client = new OpeningRequestClient();
            
            // Carrega cards por status
            const statuses = ['ENTRADA', 'ABERTA', 'APROVADA', 'REJEITADA', 'CANCELADA'];
            const allCards = [];
            
            for (const status of statuses) {
                try {
                    const cards = await client.listByStatus(status);
                    allCards.push(...cards);
                } catch (error) {
                    console.warn(`Erro ao carregar status ${status}:`, error);
                }
            }
            
            this.cards = allCards;
            this.renderCards();
        } catch (error) {
            console.error('Erro ao carregar cards:', error);
            this.showMessage('Erro ao carregar dados do kanban', 'error');
        }
    }

    /**
     * Renderiza os cards nas colunas apropriadas
     */
    renderCards() {
        const statusMap = {
            'ENTRADA': 'entrada',
            'ABERTA': 'aberta',
            'APROVADA': 'aprovada',
            'REJEITADA': 'rejeitada',
            'CANCELADA': 'cancelada'
        };
        
        // Limpa colunas existentes
        document.querySelectorAll('.column-content').forEach(col => {
            col.innerHTML = '';
        });
        
        // Adiciona cards às colunas
        this.cards.forEach(card => {
            const status = card.status || 'ENTRADA';
            const columnId = statusMap[status] || 'entrada';
            const column = document.querySelector(`#${columnId} .column-content`);
            
            if (column) {
                const cardElement = this.createCardElement(card);
                column.appendChild(cardElement);
                this.setupCardDragAndDrop(cardElement);
            }
        });
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
                    const cardId = this.draggedElement.dataset.cardId;
                    const newStatus = this.getStatusFromColumn(column);
                    
                    if (cardId && newStatus) {
                        try {
                            // Atualiza status no backend
                            const { OpeningRequestClient } = await import('../../../client/client.js');
                            const client = new OpeningRequestClient();
                            await client.updateStatus(parseInt(cardId), newStatus);
                            
                            // Move o card visualmente
                            columnContent.appendChild(this.draggedElement);
                            
                            // Atualiza dados locais
                            const card = this.cards.find(c => c.id === parseInt(cardId));
                            if (card) {
                                card.status = newStatus;
                            }
                            
                            this.showMessage('Card movido com sucesso!', 'success');
                        } catch (error) {
                            console.error('Erro ao atualizar status:', error);
                            this.showMessage('Erro ao mover card. Tente novamente.', 'error');
                            // Recarrega os cards em caso de erro
                            await this.loadCards();
                        }
                    } else {
                        columnContent.appendChild(this.draggedElement);
                    }
                }
            });
        });
    }

    /**
     * Configura funcionalidade de busca
     */
    setupSearch() {
        const searchInput = document.querySelector('.search-bar input');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                this.filterCards(searchTerm);
            });
        }
    }

    /**
     * Filtra cards baseado no termo de busca
     */
    filterCards(searchTerm) {
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
                // Já estamos nesta página
                break;
            case 'Match Candidatos':
                window.location.href = 'match-candidatos.html';
                break;
            case 'Recrutamento':
                window.location.href = 'kanban-recrutamento.html';
                break;
            default:
                console.log('Navegação para:', itemText);
        }
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

    /**
     * Adiciona novo card ao Kanban
     */
    addCard(columnId, cardData) {
        const column = document.querySelector(`#${columnId} .column-content`);
        if (!column) return;

        const card = this.createCardElement(cardData);
        column.appendChild(card);
        
        // Reconfigurar drag and drop para o novo card
        this.setupCardDragAndDrop(card);
        
        this.showMessage('Card adicionado com sucesso!', 'success');
    }

    /**
     * Cria elemento de card
     */
    createCardElement(cardData) {
        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.draggable = true;
        card.dataset.cardId = cardData.id;
        
        const gestorName = cardData.gestor?.name || 'N/A';
        const salario = cardData.salario ? `R$ ${cardData.salario.toFixed(2).replace('.', ',')}` : 'N/A';
        
        card.innerHTML = `
            <div class="card-header">
                <h4>${cardData.cargo || 'Sem título'}</h4>
                <span class="tag tag-${cardData.status?.toLowerCase() || 'entrada'}">${cardData.status || 'ENTRADA'}</span>
            </div>
            <div class="card-body">
                <p><strong>Salário:</strong> ${salario}</p>
                <p><strong>Solicitante:</strong> ${gestorName}</p>
                <p><strong>Modelo:</strong> ${cardData.modeloTrabalho || 'N/A'}</p>
                <p><strong>Regime:</strong> ${cardData.regimeContratacao || 'N/A'}</p>
            </div>
        `;

        return card;
    }

    /**
     * Obtém status da coluna baseado no ID
     */
    getStatusFromColumn(column) {
        const columnId = column.id;
        const statusMap = {
            'entrada': 'ENTRADA',
            'aberta': 'ABERTA',
            'aprovada': 'APROVADA',
            'rejeitada': 'REJEITADA',
            'cancelada': 'CANCELADA'
        };
        return statusMap[columnId];
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
}

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new KanbanAberturaVaga();
});
