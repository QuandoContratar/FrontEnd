/* ========================================
   COMPONENTE DE AUTENTICAÇÃO
   ======================================== */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadCurrentUser();
    }

    // Carregar usuário atual do localStorage
    loadCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    // Verificar se usuário está logado
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Fazer login
    login(email, password) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            throw new Error('Email ou senha incorretos!');
        }

        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        return user;
    }

    // Fazer logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    // Cadastrar novo usuário
    register(userData) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Verificar se email já existe
        if (users.find(u => u.email === userData.email)) {
            throw new Error('Este email já está cadastrado!');
        }

        const newUser = {
            id: Date.now(),
            ...userData,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        return newUser;
    }

    // Redefinir senha
    resetPassword(email, newPassword) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.email === email);

        if (userIndex === -1) {
            throw new Error('Usuário não encontrado!');
        }

        users[userIndex].password = newPassword;
        localStorage.setItem('users', JSON.stringify(users));
        
        return true;
    }

    // Obter dados do usuário atual
    getCurrentUser() {
        return this.currentUser;
    }
}

// Instância global do gerenciador de autenticação
window.authManager = new AuthManager();

