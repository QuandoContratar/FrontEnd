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
        const jsonBody = JSON.stringify(data);
        console.log('📤 [ApiClient.insert] Chamando endpoint:', this.url);
        console.log('📤 [ApiClient.insert] Route:', this.route);
        console.log('📤 [ApiClient.insert] Dados enviados:', data);
        console.log('📤 [ApiClient.insert] JSON:', jsonBody);
        
        const response = await fetch(this.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Inclui cookies da sessão para autenticação
            body: jsonBody
        })
        
        if (!response.ok) {
            let errorText;
            try {
                errorText = await response.text();
                const errorJson = JSON.parse(errorText);
                console.error('❌ [ApiClient.insert] Erro:', response.status);
                console.error('❌ [ApiClient.insert] Endpoint:', this.url);
                console.error('❌ [ApiClient.insert] Erro JSON:', errorJson);
                console.error('❌ [ApiClient.insert] Mensagem:', errorJson.message || errorText);
            } catch (e) {
                errorText = await response.text();
                console.error('❌ [ApiClient.insert] Erro:', response.status, errorText);
                console.error('❌ [ApiClient.insert] Endpoint:', this.url);
            }
            console.error('❌ [ApiClient.insert] Dados enviados:', jsonBody);
            throw new Error(`Failed to insert: ${response.status} - ${errorText}`)
        }
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

    /**
     * Busca vagas por ID do gestor
     * @param {number} managerId - ID do gestor
     */
    async findByManager(managerId) {
        const response = await fetch(`${this.url}/manager/${managerId}`);
        if (!response.ok) throw new Error('Failed to fetch vacancies by manager');
        return response.json();
    }

    /**
     * Atualiza o status de uma vaga
     * @param {number} id - ID da vaga
     * @param {string} status - Novo status
     */
    async updateStatus(id, status) {
        const response = await fetch(`${this.url}/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statusVacancy: status })
        });
        if (!response.ok) throw new Error('Failed to update vacancy status');
        return response.json();
    }

    /**
     * Envia múltiplas vagas para aprovação
     * @param {Array<number>} ids - IDs das vagas
     */
    async sendToApproval(ids) {
        const response = await fetch(`${this.url}/send-to-approval`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Inclui cookies da sessão para autenticação
            body: JSON.stringify({ vacancyIds: ids })
        });
        if (!response.ok) throw new Error('Failed to send vacancies to approval');
        return response.json();
    }

    /**
     * Busca vagas com status específico
     * @param {string} status - Status da vaga
     */
    async findByStatus(status) {
        const response = await fetch(`${this.url}/status/${status}`);
        if (!response.ok) throw new Error('Failed to fetch vacancies by status');
        return response.json();
    }

    /**
     * Envia múltiplas vagas com arquivos para aprovação usando /send-massive
     * @param {Array<Object>} vacancies - Array de objetos VacancyOpeningDTO
     * @param {Array<File>} files - Array de arquivos (PDFs)
     */
    async sendMassive(vacancies, files = []) {
        const formData = new FormData();
        
        // Adiciona o JSON das vagas
        formData.append('vacancies', JSON.stringify(vacancies));
        
        // Adiciona os arquivos
        files.forEach(file => {
            formData.append('files', file);
        });
        
        console.log('📤 [VacanciesClient.sendMassive] Enviando para:', `${this.url}/send-massive`);
        console.log('📤 [VacanciesClient.sendMassive] Vagas:', vacancies);
        console.log('📤 [VacanciesClient.sendMassive] Arquivos:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
        
        const response = await fetch(`${this.url}/send-massive`, {
            method: 'POST',
            credentials: 'include', // Importante: inclui cookies da sessão para autenticação
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [VacanciesClient.sendMassive] Erro:', response.status);
            console.error('❌ [VacanciesClient.sendMassive] Resposta:', errorText);
            throw new Error(`Failed to send massive: ${response.status} - ${errorText}`);
        }
        
        return response.text();
    }
}

// Client para Opening Requests (solicitações de abertura de vaga)
export class OpeningRequestClient extends ApiClient {
    constructor() {
        super('opening-requests');
    }

    /**
     * Busca solicitações por gestor
     * @param {number} gestorId - ID do gestor
     */
    async findByGestor(gestorId) {
        const response = await fetch(`${this.url}/by-gestor/${gestorId}`);
        if (!response.ok) throw new Error('Failed to fetch by gestor');
        return response.json();
    }

    /**
     * Lista por status
     * @param {string} status - ENTRADA, ABERTA, APROVADA, REJEITADA, CANCELADA
     */
    async findByStatus(status) {
        const response = await fetch(`${this.url}/status/${status}`);
        if (!response.ok) throw new Error('Failed to fetch by status');
        return response.json();
    }

    /**
     * Atualiza status da solicitação
     * @param {number} id - ID da solicitação
     * @param {string} status - Novo status
     */
    async updateStatus(id, status) {
        const response = await fetch(`${this.url}/${id}/status/${status}`, {
            method: 'PATCH'
        });
        if (!response.ok) throw new Error('Failed to update status');
        return response.json();
    }

    /**
     * Upload de justificativa
     * @param {number} id - ID da solicitação
     * @param {File} file - Arquivo
     */
    async uploadJustificativa(id, file) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${this.url}/${id}/upload-justificativa`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Failed to upload');
        return response.json();
    }
}

// Client para Selection Process (processo seletivo / kanban de recrutamento)
export class SelectionProcessClient extends ApiClient {
    constructor() {
        super('selection-process');
    }

    /**
     * Lista todos os processos do kanban
     * GET /selection-process/kanban
     */
    async findAllKanban() {
        const response = await fetch(`${this.url}/kanban`);
        if (!response.ok) throw new Error('Failed to fetch all kanban processes');
        return response.json();
    }

    /**
     * Lista cards do kanban por estágio
     * @param {string} stage - aguardando_triagem, triagem_inicial, etc.
     */
    async listByStage(stage) {
        const response = await fetch(`${this.url}/kanban/${stage}`);
        if (!response.ok) throw new Error('Failed to fetch by stage');
        return response.json();
    }

    /**
     * Move card para outro estágio (drag & drop)
     * @param {number} id - ID do processo
     * @param {string} stage - Novo estágio
     */
    async moveToStage(id, stage) {
        const response = await fetch(`${this.url}/${id}/stage/${stage}`, {
            method: 'PATCH'
        });
        if (!response.ok) throw new Error('Failed to move to stage');
        return response.json();
    }

    /**
     * Alias para moveToStage - Atualiza estágio do processo
     * @param {number} id - ID do processo
     * @param {string} stage - Novo estágio
     */
    async updateStage(id, stage) {
        return this.moveToStage(id, stage);
    }

    /**
     * Busca cards no kanban
     * @param {string} query - Termo de busca
     */
    async searchCards(query) {
        const response = await fetch(`${this.url}/kanban/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to search');
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

    /**
     * Lista usuários por nível de acesso
     * @param {string} level - ADMIN, HR, MANAGER
     */
    async findByAccess(level) {
        const response = await fetch(`${this.url}/by-access/${level}`);
        if (!response.ok) throw new Error('Failed to fetch by access');
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
        files.forEach(file => formData.append('files', file));
        const response = await fetch(`${this.url}/upload-multiple-resumes`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Failed to upload resumes');
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

    /**
     * Busca candidatos por etapa do processo seletivo
     * @param {string} stage - Etapa (triagem, entrevista_rh, entrevista_gestor)
     */
    async findByStage(stage) {
        const response = await fetch(`${this.url}/stage/${stage}`);
        if (!response.ok) throw new Error('Failed to fetch candidates by stage');
        return response.json();
    }

    /**
     * Busca candidatos em processos seletivos ativos
     */
    async findActiveProcesses() {
        const response = await fetch(`${this.url}/active-processes`);
        if (!response.ok) throw new Error('Failed to fetch active processes');
        return response.json();
    }

    /**
     * Atualiza a etapa/status do candidato no processo seletivo
     * @param {number} id - ID do candidato
     * @param {string} stage - Nova etapa
     */
    async updateStage(id, stage) {
        const response = await fetch(`${this.url}/${id}/stage`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage })
        });
        if (!response.ok) throw new Error('Failed to update candidate stage');
        return response.json();
    }

    /**
     * Avança candidato para próxima etapa
     * @param {number} id - ID do candidato
     */
    async advanceStage(id) {
        const response = await fetch(`${this.url}/${id}/advance`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to advance candidate');
        return response.json();
    }

    /**
     * Aprova candidato (contratação)
     * @param {number} id - ID do candidato
     */
    async approve(id) {
        const response = await fetch(`${this.url}/${id}/approve`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to approve candidate');
        return response.json();
    }

    /**
     * Reprova candidato
     * @param {number} id - ID do candidato
     * @param {string} reason - Motivo da reprovação
     */
    async reject(id, reason = '') {
        const response = await fetch(`${this.url}/${id}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });
        if (!response.ok) throw new Error('Failed to reject candidate');
        return response.json();
    }

    /**
     * Busca candidatos por vaga
     * @param {number} vacancyId - ID da vaga
     */
    async findByVacancy(vacancyId) {
        const response = await fetch(`${this.url}/vacancy/${vacancyId}`);
        if (!response.ok) throw new Error('Failed to fetch candidates by vacancy');
        return response.json();
    }

    /**
     * Busca candidatos com match para uma vaga
     * @param {number} vacancyId - ID da vaga
     */
    async getMatchCandidates(vacancyId) {
        const response = await fetch(`${this.url}/match/${vacancyId}`);
        if (!response.ok) throw new Error('Failed to fetch match candidates');
        return response.json();
    }
}

// Client para Match de Candidatos
export class MatchClient extends ApiClient {
    constructor() {
        super('match');
    }

    /**
     * Lista todos os matches de uma vaga
     * GET /match/{vacancyId}
     * @param {number} vacancyId - ID da vaga
     */
    async findByVacancy(vacancyId) {
        const response = await fetch(`${this.url}/${vacancyId}`);
        if (!response.ok) throw new Error('Failed to fetch matches by vacancy');
        return response.json();
    }

    /**
     * Aceita um match (aprovar candidato)
     * POST /match/{matchId}/accept
     * @param {number} matchId - ID do match
     */
    async accept(matchId) {
        const response = await fetch(`${this.url}/${matchId}/accept`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to accept match');
        return response.json();
    }

    /**
     * Rejeita um match (reprovar candidato)
     * POST /match/{matchId}/reject
     * @param {number} matchId - ID do match
     */
    async reject(matchId) {
        const response = await fetch(`${this.url}/${matchId}/reject`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to reject match');
        return response.json();
    }

    /**
     * Lista todos os matches
     * GET /match
     */
    async findAll() {
        const response = await fetch(this.url);
        if (!response.ok) throw new Error('Failed to fetch all matches');
        return response.json();
    }

    /**
     * Lista matches por nível
     * GET /match/level/{level}
     * @param {string} level - BAIXO, MEDIO, ALTO, DESTAQUE
     */
    async findByLevel(level) {
        const response = await fetch(`${this.url}/level/${level}`);
        if (!response.ok) throw new Error('Failed to fetch matches by level');
        return response.json();
    }

    /**
     * Lista matches por status
     * GET /match/status/{status}
     * @param {string} status - pendente, aceito, rejeitado
     */
    async findByStatus(status) {
        const response = await fetch(`${this.url}/status/${status}`);
        if (!response.ok) throw new Error('Failed to fetch matches by status');
        return response.json();
    }
}