/* ========================================
   PÁGINA DE CANDIDATOS
   ======================================== */

class CandidatosPage {
    async fillUserHeader() {
        try {
            const { UsersClient } = await import('../../../client/client.js');
            const client = new UsersClient();
            // Supondo que o usuário logado tem id armazenado em localStorage
            const userId = localStorage.getItem('userId');
            if (!userId) return;
            const user = await client.findById(userId);
            // Preencher nome e área
            const nameSpan = document.querySelector('.text-white.mr-2.user-name');
            const areaSpan = document.querySelector('.text-white.mr-2.user-area');
            if (nameSpan) nameSpan.textContent = user.name;
            if (areaSpan) areaSpan.textContent = user.area;
        } catch (e) {
            // fallback: não altera se erro
        }
    }
    constructor() {
        this.candidates = [];
        this.setupEventListeners();
    }

    async init() {
        await this.fillUserHeader();
        await this.loadCandidates();
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

    async loadCandidates() {
        try {
            const { CandidateClient } = await import('../../../client/client.js');
            const client = new CandidateClient();
            const apiCandidates = await client.findAll();
            // Mapear dados da API para o formato esperado
            this.candidates = apiCandidates.map(c => ({
                id: c.idCandidate,
                name: c.name,
                age: c.birth ? this.calculateAge(c.birth) : '',
                location: c.state || '',
                position: c.education || '',
                area: c.skills || '',
                date: c.createdAt || '' // Ajuste se houver campo de data
            }));
        } catch (e) {
            this.candidates = [];
        }
        this.renderCandidates();
    }

    calculateAge(birth) {
        const birthDate = new Date(birth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
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
        // Encontrar o candidato pelo nome
        const candidate = this.candidates.find(c => c.name === candidateName);
        if (candidate) {
            localStorage.setItem('selectedCandidateId', candidate.id);
        }
        window.location.href = 'detalhes-candidato.html';
    }

    viewProcess(candidateName) {
        Utils.showMessage(`Processo seletivo de: ${candidateName}\n\nEsta funcionalidade será implementada em breve.`, 'info');
    }
}

// Instância global da página
let candidatosPage;

// Inicializar página quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    candidatosPage = new CandidatosPage();
    await candidatosPage.init();
});


