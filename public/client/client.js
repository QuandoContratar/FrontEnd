export class ApiClient {
    constructor(route) {
        this.route = route
        this.baseUrl = 'http://54.234.149.223:8080' // Produção
        // this.baseUrl = 'http://localhost:8080'
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
        // Remove campos que não devem ser enviados no update
        const updateData = { ...data };
        delete updateData.id;
        delete updateData.id_user;
        
        console.log('📤 [ApiClient.update] Atualizando:', `${this.url}/${id}`);
        console.log('📤 [ApiClient.update] Dados:', updateData);
        
        const response = await fetch(`${this.url}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Inclui cookies da sessão para autenticação
            body: JSON.stringify(updateData)
        })
        
        // Verifica se a resposta foi bem-sucedida
        if (!response.ok) {
            let errorText;
            try {
                errorText = await response.text();
                console.error('❌ [ApiClient.update] Erro:', response.status);
                console.error('❌ [ApiClient.update] Resposta:', errorText);
            } catch (e) {
                errorText = 'Erro desconhecido';
            }
            throw new Error(`Failed to update: ${response.status} - ${errorText}`)
        }
        
        // Verifica se há conteúdo na resposta antes de tentar fazer parse
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        
        // Se não há conteúdo ou é texto vazio, retorna objeto vazio
        if (contentLength === '0' || !contentType || !contentType.includes('application/json')) {
            console.log('✅ [ApiClient.update] Resposta vazia ou não-JSON, retornando sucesso');
            return { success: true, id: id };
        }
        
        // Tenta fazer parse do JSON
        try {
            const text = await response.text();
            if (!text || text.trim() === '') {
                console.log('✅ [ApiClient.update] Resposta vazia, retornando sucesso');
                return { success: true, id: id };
            }
            return JSON.parse(text);
        } catch (e) {
            // Se falhar ao fazer parse, mas status foi 200, retorna sucesso
            console.warn('⚠️ [ApiClient.update] Erro ao fazer parse do JSON, mas status foi 200:', e);
            return { success: true, id: id };
        }
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
     * Busca vagas ativas (status = 'aberta' ou similares)
     * Estratégia múltipla com fallbacks para garantir que vagas aprovadas apareçam:
     * 1. GET /vacancies/activesVacancies
     * 2. GET /vacancies/status/aberta
     * 3. GET /vacancies/status/ABERTA (uppercase)
     * 4. Busca todas e filtra por status
     */
    async findActiveVacancies() {
        console.log('📤 [VacanciesClient] Buscando vagas ativas...');
        console.log('📤 [VacanciesClient] Base URL:', this.url);
        
        // Estratégia 1: Endpoint direto activesVacancies
        try {
            console.log('🔍 [VacanciesClient] Tentando /activesVacancies...');
            const response = await fetch(`${this.url}/activesVacancies`, {
                credentials: 'include'
            });
            console.log('📡 [VacanciesClient] Resposta /activesVacancies:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ [VacanciesClient] Vagas ativas via /activesVacancies: ${Array.isArray(data) ? data.length : 0}`, data);
                if (Array.isArray(data) && data.length > 0) {
                    return data;
                }
            }
        } catch (e) {
            console.warn('⚠️ [VacanciesClient] Erro em /activesVacancies:', e.message);
        }
        
        // Estratégia 2: Busca por status 'aberta' (lowercase)
        try {
            console.log('🔍 [VacanciesClient] Tentando /status/aberta...');
            const response = await fetch(`${this.url}/status/aberta`, {
                credentials: 'include'
            });
            console.log('📡 [VacanciesClient] Resposta /status/aberta:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ [VacanciesClient] Vagas ativas via /status/aberta: ${Array.isArray(data) ? data.length : 0}`, data);
                if (Array.isArray(data) && data.length > 0) {
                    return data;
                }
            }
        } catch (e) {
            console.warn('⚠️ [VacanciesClient] Erro em /status/aberta:', e.message);
        }
        
        // Estratégia 3: Busca por status 'ABERTA' (uppercase - enum do backend)
        try {
            console.log('🔍 [VacanciesClient] Tentando /status/ABERTA...');
            const response = await fetch(`${this.url}/status/ABERTA`, {
                credentials: 'include'
            });
            console.log('📡 [VacanciesClient] Resposta /status/ABERTA:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ [VacanciesClient] Vagas ativas via /status/ABERTA: ${Array.isArray(data) ? data.length : 0}`, data);
                if (Array.isArray(data) && data.length > 0) {
                    return data;
                }
            }
        } catch (e) {
            console.warn('⚠️ [VacanciesClient] Erro em /status/ABERTA:', e.message);
        }
        
        // Estratégia 4: Busca todas e filtra por status (aceita vários formatos)
        try {
            console.log('🔍 [VacanciesClient] Tentando buscar TODAS as vagas e filtrar...');
            const response = await fetch(this.url, {
                credentials: 'include'
            });
            console.log('📡 [VacanciesClient] Resposta /vacancies:', response.status);
            if (response.ok) {
                const allData = await response.json();
                console.log(`📋 [VacanciesClient] Total de vagas no sistema: ${Array.isArray(allData) ? allData.length : 0}`);
                
                // Log de todos os status encontrados para debug
                const statusList = (Array.isArray(allData) ? allData : []).map(v => ({
                    id: v.id || v.id_vacancy || v.idVacancy,
                    position: v.positionJob || v.position_job || v.position,
                    status: v.statusVacancy || v.status_vacancy || v.status
                }));
                console.log('📋 [VacanciesClient] Status de todas as vagas:', statusList);
                
                // Filtra vagas com status que indica "aberta/ativa/aprovada"
                const abertas = (Array.isArray(allData) ? allData : []).filter(v => {
                    const status = (v.statusVacancy || v.status_vacancy || v.status || '').toLowerCase();
                    const isAberta = status === 'aberta' || 
                                     status === 'open' || 
                                     status === 'ativa' || 
                                     status === 'aprovada' ||
                                     status === 'active' ||
                                     status === 'approved';
                    if (isAberta) {
                        console.log(`✅ [VacanciesClient] Vaga aceita: ID=${v.id || v.id_vacancy}, status="${status}"`);
                    }
                    return isAberta;
                });
                console.log(`✅ [VacanciesClient] Vagas ativas filtradas: ${abertas.length} de ${allData.length} total`);
                return abertas;
            }
        } catch (e) {
            console.error('❌ [VacanciesClient] Erro ao buscar todas as vagas:', e.message);
        }
        
        console.warn('⚠️ [VacanciesClient] Nenhuma estratégia retornou vagas ativas');
        return [];
    }

    /**
     * Busca vagas pendentes de aprovação
     * Estratégia: Tenta GET /vacancies/status/pendente_aprovacao primeiro (retorna com ID)
     * Fallback: GET /vacancies/pendingVacancies (pode não ter ID)
     */
    async getPendingVacancies() {
        console.log('📤 [VacanciesClient] Buscando vagas pendentes de aprovação...');
        
        // Estratégia 1: Endpoint que retorna entidade completa com ID
        const statusEndpoints = [
            'pendente_aprovacao',
            'PENDENTE_APROVACAO', 
            'pendente',
            'PENDENTE'
        ];
        
        for (const status of statusEndpoints) {
            try {
                console.log(`🔍 [VacanciesClient] Tentando /status/${status}...`);
                const response = await fetch(`${this.url}/status/${status}`, {
                    method: 'GET',
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        console.log(`✅ [VacanciesClient] Sucesso com /status/${status}:`, data);
                        return data;
                    }
                }
            } catch (e) {
                console.warn(`⚠️ [VacanciesClient] Erro em /status/${status}:`, e.message);
            }
        }
        
        // Estratégia 2: Endpoint /pendingVacancies
        try {
            console.log('🔍 [VacanciesClient] Tentando /pendingVacancies...');
            const response = await fetch(`${this.url}/pendingVacancies`, {
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                console.log('✅ [VacanciesClient] Vagas pendentes via /pendingVacancies:', data);
                return data;
            }
        } catch (e) {
            console.warn('⚠️ [VacanciesClient] Erro em /pendingVacancies:', e.message);
        }
        
        // Estratégia 3: Buscar todas e filtrar
        try {
            console.log('🔍 [VacanciesClient] Tentando buscar todas e filtrar...');
            const response = await fetch(this.url, {
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                const allData = await response.json();
                const pendentes = allData.filter(v => {
                    const status = (v.statusVacancy || v.status_vacancy || v.status || '').toLowerCase();
                    return status.includes('pendente') || status === 'entrada';
                });
                console.log('✅ [VacanciesClient] Vagas filtradas:', pendentes);
                return pendentes;
            }
        } catch (e) {
            console.error('❌ [VacanciesClient] Erro ao buscar todas:', e.message);
        }
        
        console.warn('⚠️ [VacanciesClient] Nenhuma estratégia funcionou, retornando array vazio');
        return [];
    }

    /**
     * Aprova uma vaga (altera status para 'aberta')
     * Tenta múltiplos endpoints para garantir compatibilidade com o backend:
     * 1. PATCH /vacancies/updateStatus/{id} (endpoint atual)
     * 2. PATCH /vacancies/{id}/status com body {"statusVacancy": "aberta"}
     * @param {number|string} id - ID da vaga (id_vacancy)
     */
    async approve(id) {
        // Validação de ID
        if (!id || id === 'undefined' || id === 'null') {
            console.error('❌ [VacanciesClient] ID da vaga é inválido:', id);
            throw new Error('ID da vaga não encontrado. Verifique se o backend está retornando o id_vacancy.');
        }
        
        console.log('📤 [VacanciesClient] Aprovando vaga ID:', id);
        
        // Estratégia 1: PATCH /vacancies/updateStatus/{id}
        try {
            console.log('📤 [VacanciesClient] Tentando PATCH /vacancies/updateStatus/' + id);
            const response = await fetch(`${this.url}/updateStatus/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.text();
                console.log('✅ [VacanciesClient] Vaga aprovada via /updateStatus:', result);
                return result;
            }
            console.warn('⚠️ [VacanciesClient] /updateStatus retornou:', response.status);
        } catch (e) {
            console.warn('⚠️ [VacanciesClient] Erro em /updateStatus:', e.message);
        }
        
        // Estratégia 2: PATCH /vacancies/{id}/status com body
        try {
            console.log('📤 [VacanciesClient] Tentando PATCH /vacancies/' + id + '/status com body');
            const response = await fetch(`${this.url}/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ statusVacancy: 'aberta' })
            });
            
            if (response.ok) {
                const result = await response.text();
                console.log('✅ [VacanciesClient] Vaga aprovada via /{id}/status:', result);
                return result;
            }
            console.warn('⚠️ [VacanciesClient] /{id}/status retornou:', response.status);
        } catch (e) {
            console.warn('⚠️ [VacanciesClient] Erro em /{id}/status:', e.message);
        }
        
        // Estratégia 3: PATCH /vacancies/{id}/status com status ABERTA (uppercase)
        try {
            console.log('📤 [VacanciesClient] Tentando PATCH /vacancies/' + id + '/status com status ABERTA');
            const response = await fetch(`${this.url}/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ statusVacancy: 'ABERTA' })
            });
            
            if (response.ok) {
                const result = await response.text();
                console.log('✅ [VacanciesClient] Vaga aprovada via /{id}/status (ABERTA):', result);
                return result;
            }
            const errorText = await response.text();
            console.error('❌ [VacanciesClient] Todas as estratégias falharam. Último erro:', response.status, errorText);
            throw new Error(`Erro ao aprovar vaga: ${response.status} - ${errorText}`);
        } catch (e) {
            console.error('❌ [VacanciesClient] Erro ao aprovar vaga:', e.message);
            throw e;
        }
    }

    /**
     * Rejeita uma vaga (altera status para 'rejeitada')
     * PATCH /vacancies/{id}/status
     * @param {number|string} id - ID da vaga (id_vacancy)
     */
    async reject(id) {
        // Validação de ID
        if (!id || id === 'undefined' || id === 'null') {
            console.error('❌ [VacanciesClient] ID da vaga é inválido:', id);
            throw new Error('ID da vaga não encontrado.');
        }
        
        console.log('📤 [VacanciesClient] Rejeitando vaga ID:', id);
        console.log('📤 [VacanciesClient] URL:', `${this.url}/${id}/status`);
        
        const response = await fetch(`${this.url}/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ statusVacancy: 'rejeitada' })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [VacanciesClient] Erro ao rejeitar:', response.status, errorText);
            throw new Error(`Erro ao rejeitar vaga: ${response.status} - ${errorText}`);
        }
        
        // Tenta ler como JSON, senão como texto
        try {
            return await response.json();
        } catch {
            return await response.text();
        }
    }

    /**
     * Busca vagas abertas/aprovadas
     * GET /vacancies/status/aberta
     */
    async getOpenVacancies() {
        console.log('📤 [VacanciesClient] Buscando vagas abertas...');
        const response = await fetch(`${this.url}/status/aberta`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Erro ao buscar vagas abertas');
        const data = await response.json();
        console.log('✅ [VacanciesClient] Vagas abertas:', data);
        return data;
    }

    /**
     * Busca vagas aprovadas (status = 'aberta')
     * GET /vacancies/status/aberta
     * @returns {Promise<Array>} Lista de vagas aprovadas
     */
    async getApprovedVacancies() {
        console.log('📤 [VacanciesClient] Buscando vagas APROVADAS (status=aberta)...');
        
        try {
            const response = await fetch(`${this.url}/status/aberta`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (!response.ok) {
                console.warn('⚠️ [VacanciesClient] Erro ao buscar vagas aprovadas:', response.status);
                return [];
            }
            
            const data = await response.json();
            console.log(`✅ [VacanciesClient] Vagas aprovadas encontradas: ${Array.isArray(data) ? data.length : 0}`);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('❌ [VacanciesClient] Erro ao buscar vagas aprovadas:', error);
            return [];
        }
    }

    /**
     * Busca vagas rejeitadas (status = 'rejeitada')
     * GET /vacancies/status/rejeitada
     * @returns {Promise<Array>} Lista de vagas rejeitadas
     */
    async getRejectedVacancies() {
        console.log('📤 [VacanciesClient] Buscando vagas REJEITADAS (status=rejeitada)...');
        
        try {
            const response = await fetch(`${this.url}/status/rejeitada`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (!response.ok) {
                console.warn('⚠️ [VacanciesClient] Erro ao buscar vagas rejeitadas:', response.status);
                return [];
            }
            
            const data = await response.json();
            console.log(`✅ [VacanciesClient] Vagas rejeitadas encontradas: ${Array.isArray(data) ? data.length : 0}`);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('❌ [VacanciesClient] Erro ao buscar vagas rejeitadas:', error);
            return [];
        }
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

    /**
     * Busca vagas ativas
     * GET /vacancies/activesVacancies
     */
    async getActiveVacancies() {
        console.log('📤 [VacanciesClient] Buscando vagas ativas...');
        const response = await fetch(`${this.url}/activesVacancies`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.error('❌ [VacanciesClient] Erro ao buscar vagas ativas:', response.status);
            throw new Error('Failed to fetch active vacancies');
        }
        
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    }

    /**
     * Busca vagas por área
     * GET /dashboard/recruitment/area/{area}/vagas
     * @param {string} area - Nome da área
     */
    async getVacanciesByArea(area) {
        console.log(`📤 [VacanciesClient] Buscando vagas da área: ${area}`);
        const response = await fetch(`${this.baseUrl}/dashboard/recruitment/area/${encodeURIComponent(area)}/vagas`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.error('❌ [VacanciesClient] Erro ao buscar vagas por área:', response.status);
            throw new Error('Failed to fetch vacancies by area');
        }
        
        const data = await response.json();
        return Array.isArray(data) ? data : [];
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
        const url = `${this.url}/status/${status}`;
        console.log('📡 [OpeningRequestClient] Buscando por status:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        console.log('📡 [OpeningRequestClient] Resposta:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [OpeningRequestClient] Erro:', response.status, errorText);
            throw new Error(`Failed to fetch by status: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ [OpeningRequestClient] Dados recebidos:', data);
        return data;
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
        console.log(`📤 [SelectionProcessClient] Buscando todos os processos do kanban...`);
        const response = await fetch(`${this.url}/kanban`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [SelectionProcessClient] Erro ao buscar todos os processos:`, response.status, errorText);
            throw new Error(`Failed to fetch all kanban processes: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`✅ [SelectionProcessClient] Total de processos encontrados: ${Array.isArray(data) ? data.length : 0}`);
        return Array.isArray(data) ? data : [];
    }

    /**
     * Lista cards do kanban por estágio
     * @param {string} stage - aguardando_triagem, triagem_inicial, etc.
     */
    async listByStage(stage) {
        console.log(`📤 [SelectionProcessClient] Buscando processos do estágio: ${stage}`);
        const response = await fetch(`${this.url}/kanban/${stage}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [SelectionProcessClient] Erro ao buscar estágio ${stage}:`, response.status, errorText);
            throw new Error(`Failed to fetch by stage: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`✅ [SelectionProcessClient] Estágio ${stage}: ${Array.isArray(data) ? data.length : 0} processos`);
        return data;
    }

    /**
     * Move card para outro estágio (drag & drop)
     * @param {number} id - ID do processo
     * @param {string} stage - Novo estágio
     */
    async moveToStage(id, stage) {
        console.log(`📤 [SelectionProcessClient] Movendo processo ${id} para estágio: ${stage}`);
        const response = await fetch(`${this.url}/${id}/stage/${stage}`, {
            method: 'PATCH',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [SelectionProcessClient] Erro ao mover processo:`, response.status, errorText);
            throw new Error(`Failed to move to stage: ${response.status} - ${errorText}`);
        }
        
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

    /**
     * Rejeita um candidato no kanban
     * PATCH /selection-process/kanban/{id}/reject
     * @param {number} id - ID do processo/card
     * @param {string} reason - Motivo da rejeição
     */
    async rejectCandidate(id, reason) {
        console.log(`📤 [SelectionProcessClient] Rejeitando candidato ${id}...`);
        const response = await fetch(`${this.url}/kanban/${id}/reject`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ reason })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [SelectionProcessClient] Erro ao rejeitar candidato:`, response.status, errorText);
            throw new Error(`Failed to reject candidate: ${response.status} - ${errorText}`);
        }
        
        return response.json();
    }

    /**
     * Busca cards por vaga específica
     * GET /selection-process/kanban?vagaId={id}
     * @param {number} vagaId - ID da vaga
     */
    async findByVacancy(vagaId) {
        console.log(`📤 [SelectionProcessClient] Buscando cards da vaga ${vagaId}...`);
        const response = await fetch(`${this.url}/kanban?vagaId=${vagaId}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [SelectionProcessClient] Erro ao buscar por vaga:`, response.status, errorText);
            throw new Error(`Failed to fetch by vacancy: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        return Array.isArray(data) ? data : [];
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

    async updateUser(id, dto) {
    const response = await fetch(`${this.url}/update/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto)
    });

    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
}

}

export class CandidateClient extends ApiClient {
    constructor() {
        super('candidates');
    }

    async deleteCandidate(id){
        const response = await fetch(`${this.url}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete candidate');
        return response.json()
    }

    /**
     * Upload de currículo vinculado a uma vaga específica
     * @param {File} file - Arquivo do currículo
     * @param {number} vacancyId - ID da vaga (OBRIGATÓRIO)
     * @returns {Promise<Object>} Resultado do upload com dados do candidato criado
     */
    async uploadResumeForVacancy(file, vacancyId) {
        if (!vacancyId) {
            console.error('❌ [CandidateClient.uploadResumeForVacancy] vacancyId é obrigatório!');
            throw new Error('vacancyId é obrigatório para upload de currículo');
        }
        
        console.log(`📤 [CandidateClient.uploadResumeForVacancy] Enviando currículo para vaga ${vacancyId}`);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('vacancyId', vacancyId);
        
        const response = await fetch(`${this.url}/upload?vacancyId=${vacancyId}`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [CandidateClient.uploadResumeForVacancy] Erro:', errorText);
            throw new Error('Failed to upload resume: ' + errorText);
        }
        
        const result = await response.json();
        console.log('✅ [CandidateClient.uploadResumeForVacancy] Resultado:', result);
        return result;
    }

    /**
     * Upload de múltiplos currículos vinculados a uma vaga específica
     * @param {File[]} files - Array de arquivos
     * @param {number} vacancyId - ID da vaga (OBRIGATÓRIO)
     * @returns {Promise<Object>} Resultado do upload
     */
    async uploadMultipleResumesForVacancy(files, vacancyId) {
        if (!vacancyId) {
            console.error('❌ [CandidateClient.uploadMultipleResumesForVacancy] vacancyId é obrigatório!');
            throw new Error('vacancyId é obrigatório para upload de currículos');
        }
        
        console.log(`📤 [CandidateClient.uploadMultipleResumesForVacancy] Enviando ${files.length} currículos para vaga ${vacancyId}`);
        
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        formData.append('vacancyId', vacancyId);
        
        const response = await fetch(`${this.url}/upload-multiple?vacancyId=${vacancyId}`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [CandidateClient.uploadMultipleResumesForVacancy] Erro:', errorText);
            throw new Error('Failed to upload resumes: ' + errorText);
        }
        
        const result = await response.json();
        console.log('✅ [CandidateClient.uploadMultipleResumesForVacancy] Resultado:', result);
        return result;
    }

    async uploadMultipleResumes(files) {
        console.warn('⚠️ [CandidateClient.uploadMultipleResumes] DEPRECATED: Use uploadMultipleResumesForVacancy com vacancyId');
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

export class DashboardClient extends ApiClient {
    constructor() {
        super('dashboard');
    }

    async getMetrics() {
        return (await fetch(`${this.url}/metrics`)).json();
    }

    async getVagasMes() {
        return (await fetch(`${this.url}/vagas-mes`)).json();
    }

    async getStatusVagas() {
        return (await fetch(`${this.url}/status-vagas`)).json();
    }

    async getCandidatosPorVaga() {
        return (await fetch(`${this.url}/candidatos-vaga`)).json();
    }

    async getTipoContrato() {
        return (await fetch(`${this.url}/tipo-contrato`)).json();
    }

    async getTempoPreenchimento() {
        return (await fetch(`${this.url}/tempo-medio`)).json();
    }
}


// Client para Match de Candidatos
export class MatchClient extends ApiClient {
    constructor() {
        super('match');
    }

    /**
     * Lista todos os matches de uma vaga (incluindo processados)
     * GET /match/{vacancyId}/list
     * @param {number} vacancyId - ID da vaga
     * @returns {Promise<Array>} Lista de matches da vaga
     */
    async findByVacancy(vacancyId) {
        console.log('📤 [MatchClient.findByVacancy] Buscando matches da vaga:', vacancyId);
        
        const response = await fetch(`${this.url}/${vacancyId}/list`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [MatchClient.findByVacancy] Erro:`, response.status, errorText);
            throw new Error(`Failed to fetch matches by vacancy: ${response.status}`);
        }
        
        const data = await response.json();
        const matches = Array.isArray(data) ? data : [];
        
        console.log(`✅ [MatchClient.findByVacancy] ${matches.length} matches encontrados para vaga ${vacancyId}`);
        
        // Log dos matches para debug
        if (matches.length > 0) {
            console.log('📋 [MatchClient.findByVacancy] Detalhes dos matches:');
            matches.forEach(m => {
                console.log(`   - ${m.candidateName}: status=${m.status || 'null'}, hasSelectionProcess=${m.hasSelectionProcess}`);
            });
        }
        
        return matches;
    }
    
    /**
     * Lista apenas matches pendentes de uma vaga (não processados)
     * Primeiro tenta endpoint específico, depois filtra no frontend
     * @param {number} vacancyId - ID da vaga
     * @returns {Promise<Array>} Lista de matches pendentes da vaga
     */
    async findPendingByVacancy(vacancyId) {
        console.log('📤 [MatchClient.findPendingByVacancy] Buscando matches pendentes da vaga:', vacancyId);
        
        try {
            // Tenta endpoint específico para pendentes de uma vaga
            const response = await fetch(`${this.url}/${vacancyId}/pending`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                const matches = Array.isArray(data) ? data : [];
                console.log(`✅ [MatchClient.findPendingByVacancy] ${matches.length} matches pendentes (via endpoint)`);
                return matches;
            }
        } catch (error) {
            console.warn('⚠️ [MatchClient.findPendingByVacancy] Endpoint específico não disponível');
        }
        
        // Fallback: busca todos e filtra
        const allMatches = await this.findByVacancy(vacancyId);
        const pendingMatches = this._filterPendingMatches(allMatches);
        
        console.log(`✅ [MatchClient.findPendingByVacancy] ${pendingMatches.length} matches pendentes (via filtro)`);
        return pendingMatches;
    }
    
    /**
     * Método interno para filtrar matches pendentes
     * @private
     */
    _filterPendingMatches(matches) {
        const processedStatuses = ['aceito', 'aprovado', 'accepted', 'approved', 'rejeitados', 'rejected', 'recusado'];
        
        return matches.filter(m => {
            // Verifica se tem SelectionProcess
            if (m.hasSelectionProcess === true) return false;
            if (m.selectionProcessId || m.selection_process_id) return false;
            
            // Verifica status
            const status = (m.status || '').toLowerCase().trim();
            if (processedStatuses.includes(status)) return false;
            
            // Verifica flags de processado
            if (m.processed === true || m.isProcessed === true) return false;
            
            return true;
        });
    }

    /**
     * Aceita um match (aprovar candidato)
     * POST /match/{matchId}/accept
     * Este endpoint deve criar automaticamente o card no Kanban
     * @param {number} matchId - ID do match
     */
    async accept(matchId) {
        console.log(`📤 [MatchClient.accept] Aprovando match ID: ${matchId}`);
        console.log(`📤 [MatchClient.accept] URL: ${this.url}/${matchId}/accept`);
        
        const response = await fetch(`${this.url}/${matchId}/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [MatchClient.accept] Erro ao aceitar match:`, response.status, errorText);
            throw new Error(`Failed to accept match: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`✅ [MatchClient.accept] Match aceito com sucesso:`, data);
        console.log(`✅ [MatchClient.accept] Verifique se o backend criou o card no Kanban!`);
        return data;
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
     * Retorna todos os matches - o frontend filtra os pendentes
     */
    async findAll() {
        console.log('📤 [MatchClient.findAll] Buscando todos os matches...');
        const response = await fetch(this.url, {
            credentials: 'include'
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ [MatchClient.findAll] Erro:', response.status, errorText);
            throw new Error('Failed to fetch all matches');
        }
        const data = await response.json();
        console.log(`✅ [MatchClient.findAll] ${Array.isArray(data) ? data.length : 0} matches encontrados`);
        return Array.isArray(data) ? data : [];
    }

    /**
     * Lista matches pendentes (apenas não processados)
     * GET /match/status/pendente ou GET /match/pending
     * Use este método para buscar apenas matches que ainda não foram aceitos/rejeitados
     * 
     * ESTRATÉGIA:
     * 1. Tenta GET /match/pending (endpoint específico)
     * 2. Fallback: GET /match/status/pendente
     * 3. Fallback final: GET /match + filtro no frontend
     */
    async findPending() {
        console.log('📤 [MatchClient.findPending] Buscando matches pendentes...');
        
        // Estratégia 1: Tentar endpoint /match/pending
        try {
            const response1 = await fetch(`${this.url}/pending`, {
                credentials: 'include'
            });
            
            if (response1.ok) {
                const data = await response1.json();
                const matches = Array.isArray(data) ? data : [];
                console.log(`✅ [MatchClient.findPending] ${matches.length} via /pending`);
                return matches;
            }
        } catch (e) {
            console.warn('⚠️ [MatchClient.findPending] /pending não disponível');
        }
        
        // Estratégia 2: Tentar endpoint /match/status/pendente
        try {
            const response2 = await fetch(`${this.url}/status/pendente`, {
                credentials: 'include'
            });
            
            if (response2.ok) {
                const data = await response2.json();
                const matches = Array.isArray(data) ? data : [];
                console.log(`✅ [MatchClient.findPending] ${matches.length} via /status/pendente`);
                return matches;
            }
        } catch (e) {
            console.warn('⚠️ [MatchClient.findPending] /status/pendente não disponível');
        }
        
        // Estratégia 3: Fallback - busca todos e filtra no frontend
        console.warn('⚠️ [MatchClient.findPending] Usando fallback: findAll + filtro');
        const allMatches = await this.findAll();
        const pendingMatches = this._filterPendingMatches(allMatches);
        
        console.log(`✅ [MatchClient.findPending] ${pendingMatches.length} via filtro (de ${allMatches.length} total)`);
        
        // Log de matches filtrados para debug
        if (allMatches.length > pendingMatches.length) {
            const filtered = allMatches.filter(m => !pendingMatches.some(p => p.matchId === m.matchId));
            console.log('🚫 [MatchClient.findPending] Matches filtrados (já processados):');
            filtered.forEach(m => {
                console.log(`   - ${m.candidateName}: status=${m.status}, hasSelectionProcess=${m.hasSelectionProcess}`);
            });
        }
        
        return pendingMatches;
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
        console.log(`📤 [MatchClient.findByStatus] Buscando matches com status: ${status}`);
        const response = await fetch(`${this.url}/status/${status}`, {
            credentials: 'include'
        });
        if (!response.ok) {
            console.error(`❌ [MatchClient.findByStatus] Erro ao buscar status ${status}`);
            throw new Error('Failed to fetch matches by status');
        }
        const data = await response.json();
        console.log(`✅ [MatchClient.findByStatus] ${Array.isArray(data) ? data.length : 0} matches com status ${status}`);
        return Array.isArray(data) ? data : [];
    }

    
}