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
}
