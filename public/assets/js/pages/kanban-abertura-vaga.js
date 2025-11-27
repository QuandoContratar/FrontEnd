/* ========================================
   KANBAN ABERTURA DE VAGA
   Funcionalidades de drag and drop e interações
   ======================================== */

class KanbanAberturaVaga {
    constructor() {
        this.draggedElement = null;
        this.init();
    }

    /**
     * Inicializa a página do Kanban
     */
    init() {
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

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');
                
                if (this.draggedElement) {
                    const columnContent = column.querySelector('.column-content');
                    columnContent.appendChild(this.draggedElement);
                    
                    // Mostrar feedback visual
                    this.showMessage('Card movido com sucesso!', 'success');
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
        
        card.innerHTML = `
            <div class="card-header">
                <h4>${cardData.title}</h4>
                <span class="tag tag-${cardData.type}">${cardData.type.toUpperCase()}</span>
            </div>
            <div class="card-body">
                <p><strong>Salário:</strong> ${cardData.salary}</p>
                <p><strong>Solicitante:</strong> ${cardData.requester}</p>
                <p><strong>Modelo:</strong> ${cardData.model}</p>
            </div>
        `;

        return card;
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
