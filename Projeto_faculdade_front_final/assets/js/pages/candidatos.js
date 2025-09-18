/* ========================================
   PÁGINA DE CANDIDATOS
   ======================================== */

class CandidatosPage {
    constructor() {
        this.candidates = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCandidates();
    }

    setupEventListeners() {
        // Função de busca
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            const debouncedSearch = Utils.debounce((term) => {
                this.searchCandidates(term);
            }, 300);
            
            searchInput.addEventListener('keyup', (e) => {
                debouncedSearch(e.target.value);
            });
        }

        // Função de ordenação
        const sortOptions = document.querySelectorAll('.sort-option');
        sortOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                this.handleSort(e.target.dataset.sort);
            });
        });
    }

    loadCandidates() {
        // Dados de exemplo dos candidatos
        this.candidates = [
            {
                id: 1,
                name: 'John Doe',
                age: 20,
                location: 'São Paulo',
                position: 'Desenvolvedor Jr Python',
                area: 'Dados',
                date: '2024-12-15'
            },
            {
                id: 2,
                name: 'Maria Silva',
                age: 25,
                location: 'Rio de Janeiro',
                position: 'Analista de Dados',
                area: 'Dados',
                date: '2024-12-14'
            },
            {
                id: 3,
                name: 'Carlos Santos',
                age: 30,
                location: 'Belo Horizonte',
                position: 'Desenvolvedor Full Stack',
                area: 'Tecnologia',
                date: '2024-12-13'
            },
            {
                id: 4,
                name: 'Ana Costa',
                age: 28,
                location: 'Porto Alegre',
                position: 'Gerente de Projetos',
                area: 'Gestão',
                date: '2024-12-12'
            },
            {
                id: 5,
                name: 'Pedro Oliveira',
                age: 22,
                location: 'Brasília',
                position: 'Estagiário de Marketing',
                area: 'Marketing',
                date: '2024-12-11'
            },
            {
                id: 6,
                name: 'Fernanda Lima',
                age: 26,
                location: 'Salvador',
                position: 'Designer UX/UI',
                area: 'Design',
                date: '2024-12-10'
            },
            {
                id: 7,
                name: 'Roberto Alves',
                age: 35,
                location: 'Fortaleza',
                position: 'Analista Financeiro',
                area: 'Financeiro',
                date: '2024-12-09'
            },
            {
                id: 8,
                name: 'Juliana Rocha',
                age: 24,
                location: 'Recife',
                position: 'Assistente Administrativo',
                area: 'Administrativo',
                date: '2024-12-08'
            }
        ];

        this.renderCandidates();
    }

    renderCandidates() {
        const container = document.getElementById('candidatesContainer');
        if (!container) return;

        container.innerHTML = '';

        this.candidates.forEach(candidate => {
            const candidateCard = this.createCandidateCard(candidate);
            container.appendChild(candidateCard);
        });
    }

    createCandidateCard(candidate) {
        const card = document.createElement('div');
        card.className = 'candidate-card';
        card.dataset.date = candidate.date;

        card.innerHTML = `
            <div class="row align-items-center">
                <div class="col-auto">
                    <div class="candidate-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                </div>
                <div class="col">
                    <div class="candidate-info">
                        <h6>${candidate.name}, ${candidate.age} Anos, ${candidate.location}</h6>
                        <p><strong>Vaga:</strong> ${candidate.position}</p>
                        <p><strong>Área:</strong> ${candidate.area}</p>
                    </div>
                </div>
                <div class="col-auto">
                    <div class="candidate-actions">
                        <button class="action-btn" onclick="candidatosPage.showDetails('${candidate.name}')">
                            Exibir detalhes
                        </button>
                        <button class="action-btn" onclick="candidatosPage.viewProcess('${candidate.name}')">
                            Visualizar processo seletivo
                        </button>
                    </div>
                </div>
            </div>
        `;

        return card;
    }

    searchCandidates(term) {
        const cards = document.querySelectorAll('.candidate-card');
        const searchTerm = term.toLowerCase();

        cards.forEach(card => {
            const candidateText = card.textContent.toLowerCase();
            if (candidateText.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    handleSort(sortType) {
        // Atualizar botões ativos
        document.querySelectorAll('.sort-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`[data-sort="${sortType}"]`).classList.add('active');

        // Ordenar candidatos
        if (sortType === 'recent') {
            this.candidates.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else if (sortType === 'oldest') {
            this.candidates.sort((a, b) => new Date(a.date) - new Date(b.date));
        }

        this.renderCandidates();
    }

    showDetails(candidateName) {
        // Redirecionar para página de detalhes
        window.location.href = 'detalhes-candidato.html';
    }

    viewProcess(candidateName) {
        Utils.showMessage(`Processo seletivo de: ${candidateName}\n\nEsta funcionalidade será implementada em breve.`, 'info');
    }
}

// Instância global da página
let candidatosPage;

// Inicializar página quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    candidatosPage = new CandidatosPage();
});


