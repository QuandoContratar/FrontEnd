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