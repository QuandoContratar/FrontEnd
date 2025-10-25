/* ========================================
   MINHAS SOLICITAÇÕES
   Funcionalidades de gerenciamento de vagas
   ======================================== */

class MinhasSolicitacoes {
    constructor() {
        this.vacancies = [];
        this.selectedVacancies = new Set();
        this.init();
    }

    /**
     * Inicializa a página
     */
    init() {
        this.setupSearch();
        this.setupSorting();
        this.setupActions();
        this.loadVacancies();
    }

    /**
     * Configura funcionalidade de busca
     */
    setupSearch() {
        const searchInput = document.querySelector('.search-bar input');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                this.filterVacancies(searchTerm);
            });
        }
    }

    /**
     * Configura funcionalidade de ordenação
     */
    setupSorting() {
        const sortSelect = document.querySelector('.sort-select');
        
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortVacancies(e.target.value);
            });
        }
    }

    /**
     * Configura ações dos botões
     */
    setupActions() {
        // Botão Adicionar Vaga
        const addBtn = document.querySelector('.btn-primary');
        if (addBtn && addBtn.textContent.includes('ADICIONAR VAGA')) {
            addBtn.addEventListener('click', () => {
                window.location.href = 'abertura-vaga.html';
            });
        }

        // Botão Envio Massivo
        const massBtn = document.querySelector('.btn-primary:nth-of-type(2)');
        if (massBtn && massBtn.textContent.includes('ENVIAR MASSIVO')) {
            massBtn.addEventListener('click', () => {
                this.handleMassApproval();
            });
        }

        // Botão Voltar
        const backBtn = document.querySelector('.btn-secondary');
        if (backBtn && backBtn.textContent.includes('VOLTAR')) {
            backBtn.addEventListener('click', () => {
                window.history.back();
            });
        }

        // Ações dos itens
        this.setupItemActions();
    }

    /**
     * Configura ações dos itens da lista
     */
    setupItemActions() {
        const detailBtns = document.querySelectorAll('.btn-detail');
        const editBtns = document.querySelectorAll('.btn-edit');
        const deleteBtns = document.querySelectorAll('.btn-delete');

        detailBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                this.viewDetails(index);
            });
        });

        editBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                this.editVacancy(index);
            });
        });

        deleteBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                this.showDeleteModal(index);
            });
        });
    }

    /**
     * Carrega vagas (simulação)
     */
    loadVacancies() {
        // Dados simulados
        this.vacancies = [
            {
                id: 1,
                manager: 'Lucio Limeira',
                position: 'Desenvolvedor Jr Python',
                area: 'Dados',
                status: 'pending',
                created: new Date('2024-01-15')
            },
            {
                id: 2,
                manager: 'Lucio Limeira',
                position: 'Analista de Dados',
                area: 'Dados',
                status: 'pending',
                created: new Date('2024-01-10')
            },
            {
                id: 3,
                manager: 'Lucio Limeira',
                position: 'Gerente de Projetos',
                area: 'Gestão',
                status: 'pending',
                created: new Date('2024-01-05')
            }
        ];

        this.renderVacancies();
    }

    /**
     * Renderiza a lista de vagas
     */
    renderVacancies() {
        const vacancyList = document.querySelector('.vacancy-list');
        if (!vacancyList) return;

        vacancyList.innerHTML = '';

        this.vacancies.forEach((vacancy, index) => {
            const vacancyItem = this.createVacancyItem(vacancy, index);
            vacancyList.appendChild(vacancyItem);
        });

        // Reconfigurar ações
        this.setupItemActions();
    }

    /**
     * Cria elemento de item de vaga
     */
    createVacancyItem(vacancy, index) {
        const item = document.createElement('div');
        item.className = 'vacancy-item';
        item.dataset.index = index;

        item.innerHTML = `
            <div class="vacancy-icon">
                <i class="fas fa-briefcase"></i>
            </div>
            <div class="vacancy-info">
                <div class="vacancy-details">
                    <p><strong>Gestor:</strong> ${vacancy.manager}</p>
                    <p><strong>Vaga:</strong> ${vacancy.position}</p>
                    <p><strong>Área:</strong> ${vacancy.area}</p>
                </div>
            </div>
            <div class="vacancy-actions">
                <button class="btn-action btn-detail" title="Exibir detalhe/enviar para aprovação">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action btn-edit" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action btn-delete" title="Excluir">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        return item;
    }

    /**
     * Filtra vagas baseado no termo de busca
     */
    filterVacancies(searchTerm) {
        const items = document.querySelectorAll('.vacancy-item');
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    /**
     * Ordena vagas
     */
    sortVacancies(sortBy) {
        if (sortBy === 'recent') {
            this.vacancies.sort((a, b) => b.created - a.created);
        } else if (sortBy === 'oldest') {
            this.vacancies.sort((a, b) => a.created - b.created);
        }

        this.renderVacancies();
    }

    /**
     * Visualiza detalhes da vaga
     */
    viewDetails(index) {
        const vacancy = this.vacancies[index];
        if (!vacancy) return;

        // Simular navegação para detalhes
        this.showMessage(`Visualizando detalhes da vaga: ${vacancy.position}`, 'info');
        
        // Aqui você pode implementar navegação para página de detalhes
        // window.location.href = `detalhes-vaga.html?id=${vacancy.id}`;
    }

    /**
     * Edita vaga
     */
    editVacancy(index) {
        const vacancy = this.vacancies[index];
        if (!vacancy) return;

        this.showMessage(`Editando vaga: ${vacancy.position}`, 'info');
        
        // Navegar para página de edição
        window.location.href = `abertura-vaga.html?edit=${vacancy.id}`;
    }

    /**
     * Mostra modal de exclusão
     */
    showDeleteModal(index) {
        this.currentDeleteIndex = index;
        const modal = document.getElementById('deleteModal');
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
        }
    }

    /**
     * Esconde modal de exclusão
     */
    hideDeleteModal() {
        const modal = document.getElementById('deleteModal');
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    }

    /**
     * Confirma exclusão
     */
    confirmDelete() {
        if (this.currentDeleteIndex !== undefined) {
            const vacancy = this.vacancies[this.currentDeleteIndex];
            this.vacancies.splice(this.currentDeleteIndex, 1);
            this.renderVacancies();
            this.showMessage(`Vaga "${vacancy.position}" excluída com sucesso!`, 'success');
        }
        
        this.hideDeleteModal();
    }

    /**
     * Manipula envio massivo para aprovação
     */
    handleMassApproval() {
        if (this.vacancies.length === 0) {
            this.showMessage('Não há vagas para enviar para aprovação', 'warning');
            return;
        }

        const confirmed = confirm(`Deseja enviar ${this.vacancies.length} vaga(s) para aprovação?`);
        if (confirmed) {
            this.showMessage(`${this.vacancies.length} vaga(s) enviada(s) para aprovação com sucesso!`, 'success');
            
            // Simular envio
            setTimeout(() => {
                this.vacancies = [];
                this.renderVacancies();
            }, 2000);
        }
    }

    /**
     * Mostra mensagem de feedback
     */
    showMessage(message, type = 'info') {
        // Remove mensagem anterior se existir
        const existingMessage = document.querySelector('.vacancy-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Cria nova mensagem
        const messageEl = document.createElement('div');
        messageEl.className = `vacancy-message vacancy-message-${type}`;
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

// Funções globais para o modal
function showDeleteModal() {
    const page = window.minhasSolicitacoes;
    if (page) {
        page.showDeleteModal(0); // Índice padrão, pode ser ajustado
    }
}

function hideDeleteModal() {
    const page = window.minhasSolicitacoes;
    if (page) {
        page.hideDeleteModal();
    }
}

function confirmDelete() {
    const page = window.minhasSolicitacoes;
    if (page) {
        page.confirmDelete();
    }
}

// Inicializar quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.minhasSolicitacoes = new MinhasSolicitacoes();
});
