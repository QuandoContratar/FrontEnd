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
            method: 'PUT',
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
}