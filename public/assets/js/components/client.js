/* ========================================
   CLIENT API - Dashboard
   Cliente para comunicação com API do Backend
   ======================================== */

// Base URL da API
const BASE_URL = 'http://localhost:8080';

/**
 * Cliente base para API
 */
class ApiClient {
    constructor(route) {
        this.route = route;
        this.baseUrl = BASE_URL;
    }

    get url() {
        return `${this.baseUrl}/${this.route}`;
    }
}

/**
 * Cliente específico para o Dashboard
 * Contém todos os métodos para buscar dados dos gráficos
 */
export class DashboardClient extends ApiClient {
    constructor() {
        super('dashboard');
    }

    async getMetrics() {
        const response = await fetch(`${this.url}/metrics`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    async getVagasMes() {
        const response = await fetch(`${this.url}/vagas-mes`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    async getStatusVagas() {
        const response = await fetch(`${this.url}/status-vagas`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    async getCandidatosPorVaga() {
        const response = await fetch(`${this.url}/candidatos-vaga`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    async getTipoContrato() {
        const response = await fetch(`${this.url}/tipo-contrato`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    async getTempoPreenchimento() {
        const response = await fetch(`${this.url}/tempo-medio`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    // ========================================
    // NOVOS ENDPOINTS - Dashboard Avançado
    // ========================================

    /**
     * Busca candidatos por estado
     * Endpoint: GET /dashboard/candidates-by-state
     */
    async getCandidatesByState() {
        const response = await fetch(`${this.url}/candidates-by-state`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    /**
     * Busca distribuição de match
     * Endpoint: GET /dashboard/match-distribution
     */
    async getMatchDistribution() {
        const response = await fetch(`${this.url}/match-distribution`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    /**
     * Busca top candidatos por vaga
     * Endpoint: GET /dashboard/top-candidates/{vacancyId}
     */
    async getTopCandidates(vacancyId) {
        const response = await fetch(`${this.url}/top-candidates/${vacancyId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    /**
     * Busca pipeline por estágio
     * Endpoint: GET /dashboard/pipeline-by-stage
     */
    async getPipelineByStage() {
        const response = await fetch(`${this.url}/pipeline-by-stage`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    /**
     * Busca pipeline por estágio filtrado por vaga
     * Endpoint: GET /dashboard/pipeline-by-stage/{vacancyId}
     * @param {number} vacancyId - ID da vaga
     */
    async getPipelineByStageByVacancy(vacancyId) {
        const response = await fetch(`${this.url}/pipeline-by-stage/${vacancyId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    /**
     * Busca tempo médio por estágio
     * Endpoint: GET /dashboard/avg-time-by-stage
     */
    async getAvgTimeByStage() {
        const response = await fetch(`${this.url}/avg-time-by-stage`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    /**
     * Busca resumo de status das vagas
     * Endpoint: GET /dashboard/vacancies-status-summary
     */
    async getVacanciesStatusSummary() {
        const response = await fetch(`${this.url}/vacancies-status-summary`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    /**
     * Busca performance dos gestores
     * Endpoint: GET /dashboard/manager-performance
     */
    async getManagerPerformance() {
        const response = await fetch(`${this.url}/manager-performance`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    /**
     * Busca lista de vagas para selects
     * Endpoint: GET /vacancies (simplificado)
     */
    async getVacanciesList() {
        const response = await fetch(`${this.baseUrl}/vacancies`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    // ========================================
    // NOVOS ENDPOINTS - Insights Avançados
    // ========================================

    /**
     * Busca Hard Skills mais comuns
     * Endpoint: GET /dashboard/skills/hard
     */
    async getHardSkills() {
        const response = await fetch(`${this.url}/skills/hard`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    /**
     * Busca Soft Skills mais comuns
     * Endpoint: GET /dashboard/skills/soft
     */
    async getSoftSkills() {
        const response = await fetch(`${this.url}/skills/soft`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    /**
     * Busca recomendação de vagas para um candidato
     * Endpoint: GET /dashboard/recommendation/{candidateId}
     */
    async getVacancyRecommendation(candidateId) {
        const response = await fetch(`${this.url}/recommendation/${candidateId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    /**
     * Busca tempo até primeiro contato do RH
     * Endpoint: GET /dashboard/first-contact
     */
    async getFirstContactTime() {
        const response = await fetch(`${this.url}/first-contact`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    /**
     * Busca lista de candidatos para select
     * Endpoint: GET /candidates
     */
    async getCandidatesList() {
        const response = await fetch(`${this.baseUrl}/candidates`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    /**
     * Busca detalhes de uma vaga específica
     * Endpoint: GET /vacancies/{id}
     */
    async getVagaById(vagaId) {
        const response = await fetch(`${this.baseUrl}/vacancies/${vagaId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    /**
     * Busca estágios/etapas de uma vaga
     * Endpoint: GET /dashboard/vaga/{id}/stages
     */
    async getVagaStages(vagaId) {
        const response = await fetch(`${this.url}/vaga/${vagaId}/stages`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    /**
     * Busca candidatos de uma vaga
     * Endpoint: GET /dashboard/vaga/{id}/candidates
     */
    async getVagaCandidates(vagaId) {
        const response = await fetch(`${this.url}/vaga/${vagaId}/candidates`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }

    /**
     * Busca dados de retenção de uma vaga
     * Endpoint: GET /dashboard/vaga/{id}/retention
     */
    async getVagaRetention(vagaId) {
        const response = await fetch(`${this.url}/vaga/${vagaId}/retention`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    }
}
