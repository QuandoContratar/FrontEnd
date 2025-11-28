/* ========================================
   PÁGINA DE VAGAS
   ======================================== */

class VagasPage {
    constructor() {
        this.vacancies = [];
        this.setupEventListeners();
    }

    async init() {
        await this.loadVacancies();
    }

    setupEventListeners() {
        // Funcionalidade de busca
        const searchInput = document.querySelector('.navbar-search input');
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                this.searchVacancies(e.target.value);
            });
        }

        // Delegar eventos dos botões
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-enviar')) {
                e.preventDefault();
                window.location.href = 'upload-curriculos.html';
            } else if (e.target.classList.contains('btn-ver-mais')) {
                e.preventDefault();
                const vagaId = e.target.dataset.vagaId;
                if (vagaId) {
                    this.showVacancyDetails(vagaId);
                }
            }
        });
    }

    async loadVacancies() {
        try {
            const { VacanciesClient } = await import('../../../client/client.js');
            const client = new VacanciesClient();
            
            // Usar o endpoint específico para vagas ativas
            const apiVacancies = await client.listVacancies();
            
            // Mapear dados da API para o formato esperado
            this.vacancies = apiVacancies.map(v => ({
                id: v.id || v.idVacancy,
                position: v.position || v.positionJob || '',
                manager: v.manager || { name: '-' },
                area: v.area || '',
                workModel: v.workModel || '',
                salary: v.salary || 0,
                location: v.location || '',
                period: v.period || '',
                contractType: v.contractType || ''
            }));

            // Atualizar KPI
            const kpiElement = document.getElementById('kpi-vagas-abertas');
            if (kpiElement) {
                kpiElement.textContent = this.vacancies.length;
            }

            this.renderVacancies();
        } catch (error) {
            console.error('Erro ao carregar vagas:', error);
            this.vacancies = [];
            
            const kpiElement = document.getElementById('kpi-vagas-abertas');
            if (kpiElement) {
                kpiElement.textContent = '0';
            }
            
            const container = document.querySelector('.card-body');
            if (container) {
                container.innerHTML = '<p class="text-center text-danger">Erro ao carregar vagas. Tente novamente mais tarde.</p>';
            }
        }
    }

    renderVacancies() {
        const container = document.querySelector('.card-body');
        if (!container) return;

        container.innerHTML = '';

        if (!this.vacancies.length) {
            container.innerHTML = '<p class="text-center">Nenhuma vaga encontrada.</p>';
            return;
        }

        this.vacancies.forEach(vaga => {
            const vagaCard = this.createVacancyCard(vaga);
            container.appendChild(vagaCard);
        });
    }

    createVacancyCard(vaga) {
        const card = document.createElement('div');
        card.className = 'vaga-card';
        card.dataset.vagaId = vaga.id;

        const managerName = vaga.manager?.name || '-';
        const salaryFormatted = vaga.salary ? 
            `R$ ${vaga.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
            'A combinar';

        card.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-1">
                    <div class="vaga-icon">
                        <i class="fas fa-briefcase"></i>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="vaga-title">${vaga.position}</div>
                    <div class="vaga-manager">Gestor(a): ${managerName}</div>
                    <div class="vaga-details">
                        Área: ${vaga.area} | 
                        Modelo: ${vaga.workModel} | 
                        Salário: ${salaryFormatted}
                    </div>
                </div>
                <div class="col-md-5 text-right">
                    <button class="btn btn-enviar">Enviar Currículo</button>
                    <button class="btn btn-ver-mais" data-vaga-id="${vaga.id}">Ver Mais</button>
                </div>
            </div>
        `;

        return card;
    }

    searchVacancies(term) {
        const cards = document.querySelectorAll('.vaga-card');
        const searchTerm = term.toLowerCase();

        cards.forEach(card => {
            const vagaText = card.textContent.toLowerCase();
            if (vagaText.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    showVacancyDetails(vagaId) {
        const vaga = this.vacancies.find(v => v.id == vagaId);
        if (vaga) {
            // Salvar ID da vaga para uso futuro
            localStorage.setItem('selectedVacancyId', vagaId);
            // Por enquanto, apenas mostrar alerta
            // TODO: Criar página de detalhes da vaga
            alert(`Detalhes da vaga: ${vaga.position}\n\nEsta funcionalidade será implementada em breve.`);
        }
    }
}

// Instância global da página
let vagasPage;

// Inicializar página quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    vagasPage = new VagasPage();
    await vagasPage.init();
});

