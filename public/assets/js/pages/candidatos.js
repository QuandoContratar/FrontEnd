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
            
            console.log('📋 [candidatos.js] Candidatos da API:', apiCandidates);
            if (apiCandidates.length > 0) {
                console.log('📋 [candidatos.js] Exemplo de candidato:', apiCandidates[0]);
                console.log('📋 [candidatos.js] Campos disponíveis:', Object.keys(apiCandidates[0]));
            }
            
            // Mapear dados da API para o formato esperado
            this.candidates = apiCandidates.map(c => {
                // Tenta encontrar o campo de data em diferentes variações
                const dateValue = c.createdAt || c.created_at || c.dateCreated || c.date_created || 
                                  c.registrationDate || c.registration_date || c.insertedAt || c.inserted_at ||
                                  c.updatedAt || c.updated_at || '';
                
                return {
                    id: c.idCandidate || c.id_candidate || c.id,
                    name: c.name,
                    age: c.birth ? this.calculateAge(c.birth) : '',
                    location: c.state || '',
                    position: c.education || '',
                    area: c.skills || '',
                    date: dateValue
                };
            });
            
            console.log('📋 [candidatos.js] Candidatos mapeados:', this.candidates);
            if (this.candidates.length > 0) {
                console.log('📋 [candidatos.js] Primeiro candidato mapeado:', this.candidates[0]);
                console.log('📋 [candidatos.js] Data do primeiro:', this.candidates[0].date);
            }
        } catch (e) {
            console.error('❌ [candidatos.js] Erro ao carregar candidatos:', e);
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
                        ${candidate.area && String(candidate.area).toUpperCase() !== 'N/A' ? `<p><strong>Competências:</strong> ${candidate.area}</p>` : ''}
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
        console.log('📋 [candidatos.js] Ordenando por:', sortType);
        console.log('📋 [candidatos.js] Candidatos antes da ordenação:', this.candidates.map(c => ({ name: c.name, date: c.date })));
        
        // Atualizar botões ativos
        document.querySelectorAll('.sort-option').forEach(option => {
            option.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-sort="${sortType}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // Ordenar candidatos por data de criação (created_at)
        if (sortType === 'recent') {
            // Mais recentes primeiro (DESC)
            this.candidates.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                console.log(`📋 Comparando: ${a.name} (${dateA}) vs ${b.name} (${dateB})`);
                return dateB - dateA;
            });
        } else if (sortType === 'oldest') {
            // Mais antigos primeiro (ASC)
            this.candidates.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                console.log(`📋 Comparando: ${a.name} (${dateA}) vs ${b.name} (${dateB})`);
                return dateA - dateB;
            });
        }

        console.log('📋 [candidatos.js] Candidatos após ordenação:', this.candidates.map(c => ({ name: c.name, date: c.date })));
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
        // Encontrar o candidato pelo nome para pegar o ID
        const candidate = this.candidates.find(c => c.name === candidateName);
        if (candidate && candidate.id) {
            // Salva o ID do candidato no localStorage para o kanban poder filtrar se necessário
            localStorage.setItem('selectedCandidateId', candidate.id);
            localStorage.setItem('selectedCandidateName', candidateName);
        }
        // Redireciona para o kanban de recrutamento
        window.location.href = 'kanban-recrutamento.html';
    }
}

// Instância global da página
let candidatosPage;

// Inicializar página quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    candidatosPage = new CandidatosPage();
    await candidatosPage.init();
});


