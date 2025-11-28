/* ========================================
   PÁGINA HOME (DASHBOARD)
   ======================================== */

class HomePage {
    constructor() {
        this.stats = {
            totalCandidates: 0,
            totalVacancies: 0,
            totalOpeningRequests: 0,
            totalSelectionProcesses: 0
        };
    }

    async init() {
        await this.loadUserInfo();
        await this.loadDashboardStats();
    }

    async loadUserInfo() {
        try {
            const currentUserStr = localStorage.getItem('currentUser');
            if (currentUserStr) {
                const currentUser = JSON.parse(currentUserStr);
                const welcomeTitle = document.querySelector('.page-title');
                if (welcomeTitle && currentUser.name) {
                    welcomeTitle.textContent = `Bem-vindo, ${currentUser.name}`;
                }
            }
        } catch (error) {
            console.error('Erro ao carregar informações do usuário:', error);
        }
    }

    async loadDashboardStats() {
        try {
            // Carregar estatísticas em paralelo
            await Promise.all([
                this.loadCandidatesCount(),
                this.loadVacanciesCount(),
                this.loadOpeningRequestsCount(),
                this.loadSelectionProcessesCount()
            ]);

            // Atualizar KPIs na página se existirem
            this.updateKPIs();
        } catch (error) {
            console.error('Erro ao carregar estatísticas do dashboard:', error);
        }
    }

    async loadCandidatesCount() {
        try {
            const { CandidateClient } = await import('../../../client/client.js');
            const client = new CandidateClient();
            const candidates = await client.findAll();
            this.stats.totalCandidates = candidates.length;
        } catch (error) {
            console.error('Erro ao carregar contagem de candidatos:', error);
            this.stats.totalCandidates = 0;
        }
    }

    async loadVacanciesCount() {
        try {
            const { VacanciesClient } = await import('../../../client/client.js');
            const client = new VacanciesClient();
            const vacancies = await client.listVacancies();
            this.stats.totalVacancies = vacancies.length;
        } catch (error) {
            console.error('Erro ao carregar contagem de vagas:', error);
            this.stats.totalVacancies = 0;
        }
    }

    async loadOpeningRequestsCount() {
        try {
            const { OpeningRequestClient } = await import('../../../client/client.js');
            const client = new OpeningRequestClient();
            const requests = await client.findAll();
            this.stats.totalOpeningRequests = requests.length;
        } catch (error) {
            console.error('Erro ao carregar contagem de solicitações:', error);
            this.stats.totalOpeningRequests = 0;
        }
    }

    async loadSelectionProcessesCount() {
        try {
            const { SelectionProcessClient } = await import('../../../client/client.js');
            const client = new SelectionProcessClient();
            const processes = await client.findAll();
            this.stats.totalSelectionProcesses = processes.length;
        } catch (error) {
            console.error('Erro ao carregar contagem de processos seletivos:', error);
            this.stats.totalSelectionProcesses = 0;
        }
    }

    updateKPIs() {
        // Atualizar elementos de KPI se existirem na página
        const kpiCandidates = document.getElementById('kpi-total-candidates');
        const kpiVacancies = document.getElementById('kpi-total-vacancies');
        const kpiRequests = document.getElementById('kpi-total-requests');
        const kpiProcesses = document.getElementById('kpi-total-processes');

        if (kpiCandidates) kpiCandidates.textContent = this.stats.totalCandidates;
        if (kpiVacancies) kpiVacancies.textContent = this.stats.totalVacancies;
        if (kpiRequests) kpiRequests.textContent = this.stats.totalOpeningRequests;
        if (kpiProcesses) kpiProcesses.textContent = this.stats.totalSelectionProcesses;
    }
}

// Instância global da página
let homePage;

// Inicializar página quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    homePage = new HomePage();
    await homePage.init();
});

