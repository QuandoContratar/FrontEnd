export class ApiClient {
    constructor(route) {
        this.route = route
        this.baseUrl = 'http://localhost:8080'
    }

    get url() {
        return `${this.baseUrl}/${this.route}`
    }

    async findAll() {
        const response = await fetch(this.url)
        if (!response.ok) throw new Error('Failed to fetch all')
        return response.json()
    }

    async findById(id) {
        const response = await fetch(`${this.url}/${id}`)
        if (!response.ok) throw new Error('Failed to fetch by id')
        return response.json()
    }

    async insert(data) {
        const response = await fetch(this.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        if (!response.ok) throw new Error('Failed to insert')
        return response.json()
    }

    async update(id, data) {
        const response = await fetch(`${this.url}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        if (!response.ok) throw new Error('Failed to update')
        return response.json()
    }

    async delete(id) {
        const response = await fetch(`${this.url}/${id}`, {
            method: 'DELETE'
        })
        if (!response.ok) throw new Error('Failed to delete')
        return response.json()
    }
}

export class VacanciesClient extends ApiClient {
    constructor() {
        super('vacancies')
    }

    async listVacancies() {
        const response = await fetch(`${this.url}/activesVacancies`);
        if (!response.ok) throw new Error('Failed to list active vacancies');
        return response.json();
    }
}

export class UsersClient extends ApiClient {
    constructor() {
        super('users')
    }

    async login(credentials) {
        const response = await fetch(`${this.url}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        if (!response.ok) throw new Error('Failed to login');
        return response.json();
    }

    async findByAccess(level) {
        const response = await fetch(`${this.url}/by-access/${level}`);
        if (!response.ok) throw new Error('Failed to fetch users by access level');
        return response.json();
    }
}

export class CandidateClient extends ApiClient {
    constructor() {
        super('candidates');
    }

    async downloadResume(id) {
        const response = await fetch(`${this.url}/${id}/resume`);
        if (!response.ok) throw new Error('Failed to download resume');
        return response.arrayBuffer(); // PDF binário
    }

    async uploadMultipleResumes(files) {
        const formData = new FormData();
        // O Spring espera um array de arquivos com o nome "files"
        files.forEach(file => {
            formData.append('files', file);
        });
        
        const response = await fetch(`${this.url}/upload-multiple-resumes`, {
            method: 'POST',
            body: formData
            // Não definir Content-Type manualmente - o browser define automaticamente com boundary para FormData
        });
        
        if (!response.ok) {
            let errorMessage = 'Failed to upload resumes';
            try {
                const errorText = await response.text();
                if (errorText) {
                    errorMessage += `: ${errorText}`;
                } else {
                    errorMessage += `: HTTP ${response.status} ${response.statusText}`;
                }
            } catch (e) {
                errorMessage += `: HTTP ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        return response.json();
    }

    async listCandidates() {
        const response = await fetch(`${this.url}/candidatesList`);
        if (!response.ok) throw new Error('Failed to list candidates');
        return response.json();
    }

    async getCandidateDetails(id) {
        const response = await fetch(`${this.url}/${id}/details`);
        if (!response.ok) throw new Error('Failed to get candidate details');
        return response.json();
    }

    async getCandidateExperience(id) {
        const response = await fetch(`${this.url}/${id}/experience`);
        if (!response.ok) throw new Error('Failed to get candidate experience');
        return response.text();
    }

    async updateExperience(id, experience) {
        const response = await fetch(`${this.url}/${id}/experience`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ experience })
        });
        if (!response.ok) throw new Error('Failed to update experience');
        return response.json();
    }
}

export class OpeningRequestClient extends ApiClient {
    constructor() {
        super('opening-requests');
    }

    async findByGestor(gestorId) {
        const response = await fetch(`${this.url}/by-gestor/${gestorId}`);
        if (!response.ok) throw new Error('Failed to fetch by gestor');
        return response.json();
    }

    async listByStatus(status) {
        const response = await fetch(`${this.url}/status/${status}`);
        if (!response.ok) throw new Error('Failed to list by status');
        return response.json();
    }

    async updateStatus(id, status) {
        const response = await fetch(`${this.url}/${id}/status/${status}`, {
            method: 'PATCH'
        });
        if (!response.ok) throw new Error('Failed to update status');
        return response.json();
    }

    async uploadJustificativa(id, file) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${this.url}/${id}/upload-justificativa`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Failed to upload justificativa');
        return response.json();
    }
}

export class SelectionProcessClient extends ApiClient {
    constructor() {
        super('selection-process');
    }

    async listByStage(stage) {
        const response = await fetch(`${this.url}/kanban/${stage}`);
        if (!response.ok) throw new Error('Failed to list by stage');
        return response.json();
    }

    async moveToStage(id, stage) {
        const response = await fetch(`${this.url}/${id}/stage/${stage}`, {
            method: 'PATCH'
        });
        if (!response.ok) throw new Error('Failed to move to stage');
        return response.json();
    }

    async search(query) {
        const response = await fetch(`${this.url}/kanban/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to search');
        return response.json();
    }
}

export class CandidateMatchClient extends ApiClient {
    constructor() {
        super('match');
    }

    async calculateMatch(vacancyId) {
        const response = await fetch(`${this.url}/${vacancyId}`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to calculate match');
        return response.json();
    }

    async listMatches(vacancyId, filters = {}) {
        const params = new URLSearchParams();
        if (filters.level) params.append('level', filters.level);
        if (filters.area) params.append('area', filters.area);
        if (filters.state) params.append('state', filters.state);
        
        const queryString = params.toString();
        const url = `${this.url}/match/${vacancyId}${queryString ? '?' + queryString : ''}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to list matches');
        return response.json();
    }

    async acceptCandidate(matchId) {
        const response = await fetch(`${this.url}/match/${matchId}/accept`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to accept candidate');
        return response.json();
    }

    async rejectCandidate(matchId) {
        const response = await fetch(`${this.url}/match/${matchId}/reject`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to reject candidate');
        return response.json();
    }

    async listMatchesByCandidate(candidateId) {
        const response = await fetch(`${this.url}/candidate/${candidateId}`);
        if (!response.ok) throw new Error('Failed to list matches by candidate');
        return response.json();
    }
}