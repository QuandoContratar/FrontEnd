/* ========================================
   PÁGINA DE LOGIN
   Funcionalidades de autenticação e validação
   ======================================== */

class LoginPage {
    constructor() {
        this.elements = {};
        this.isLoading = false;
        this.init();
    }

    /**
     * Inicializa a página de login
     */
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.loadRememberedEmail();
        this.setupFormValidation();
    }

    /**
     * Cache dos elementos DOM
     */
    cacheElements() {
        this.elements = {
            email: document.getElementById('email'),
            password: document.getElementById('password'),
            togglePassword: document.querySelector("#togglePassword"),
            loginBtn: document.querySelector('.btn'),
            rememberCheckbox: document.querySelector('input[type="checkbox"]'),
            form: document.querySelector('.login-box')
        };
    }

    /**
     * Configura event listeners
     */
    setupEventListeners() {
        // Toggle visualização da senha
        if (this.elements.togglePassword && this.elements.password) {
            this.elements.togglePassword.addEventListener("click", () => {
                this.togglePasswordVisibility();
            });
        }

        // Event listener para o botão de login
        if (this.elements.loginBtn) {
            this.elements.loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Event listeners para Enter nos campos
        if (this.elements.email) {
            this.elements.email.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleLogin();
                }
            });
        }

        if (this.elements.password) {
            this.elements.password.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleLogin();
                }
            });
        }

        // Validação em tempo real
        if (this.elements.email) {
            this.elements.email.addEventListener('blur', () => {
                this.validateEmailField();
            });
        }

        if (this.elements.password) {
            this.elements.password.addEventListener('blur', () => {
                this.validatePasswordField();
            });
        }
    }

    /**
     * Configura validação do formulário
     */
    setupFormValidation() {
        // Adiciona classes de validação visual
        if (this.elements.email) {
            this.elements.email.addEventListener('input', () => {
                this.clearFieldValidation(this.elements.email);
            });
        }

        if (this.elements.password) {
            this.elements.password.addEventListener('input', () => {
                this.clearFieldValidation(this.elements.password);
            });
        }
    }

    /**
     * Toggle da visualização da senha
     */
    togglePasswordVisibility() {
        const type = this.elements.password.getAttribute("type") === "password" ? "text" : "password";
        this.elements.password.setAttribute("type", type);
        this.elements.togglePassword.classList.toggle("fa-eye");
        this.elements.togglePassword.classList.toggle("fa-eye-slash");
    }

    /**
     * Manipula o processo de login
     */
    async handleLogin() {
            if (this.isLoading) return;

            const email = this.elements.email.value.trim();
            const password = this.elements.password.value.trim();
            const rememberMe = this.elements.rememberCheckbox.checked;

            try {
                // Validação do formulário
                this.validateForm(email, password);

                // Mostrar loading
                this.setLoadingState(true);

                // Chamada à API de login
                const { UsersClient } = await import('../../../client/client.js');
                const client = new UsersClient();
                const user = await client.login({ email, password });

                // Salvar dados se "Lembre de mim" estiver marcado
                this.handleRememberMe(rememberMe, email);

                // Mostrar mensagem de sucesso
                Utils.showMessage('Login realizado com sucesso! Redirecionando...', 'success');

                // Redirecionar após delay
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1500);

            } catch (error) {
                console.error('Erro no login:', error);
                Utils.showMessage(error.message, 'error');
            } finally {
                this.setLoadingState(false);
            }
    }

    /**
     * Valida o formulário completo
     */
    validateForm(email, password) {
        const errors = [];

        if (!email) {
            errors.push('Email é obrigatório');
            this.showFieldError(this.elements.email, 'Email é obrigatório');
        } else if (!Utils.isValidEmail(email)) {
            errors.push('Email inválido');
            this.showFieldError(this.elements.email, 'Email inválido');
        }

        if (!password) {
            errors.push('Senha é obrigatória');
            this.showFieldError(this.elements.password, 'Senha é obrigatória');
        }

        if (errors.length > 0) {
            throw new Error(errors.join('. '));
        }
    }

    /**
     * Valida campo de email
     */
    validateEmailField() {
        const email = this.elements.email.value.trim();
        
        if (email && !Utils.isValidEmail(email)) {
            this.showFieldError(this.elements.email, 'Email inválido');
            return false;
        } else if (email) {
            this.showFieldSuccess(this.elements.email);
            return true;
        }
        
        return true;
    }

    /**
     * Valida campo de senha
     */
    validatePasswordField() {
        const password = this.elements.password.value.trim();
        
        if (password && !Utils.isValidPassword(password)) {
            this.showFieldError(this.elements.password, 'A senha deve ter pelo menos 6 caracteres');
            return false;
        } else if (password) {
            this.showFieldSuccess(this.elements.password);
            return true;
        }
        
        return true;
    }

    /**
     * Mostra erro no campo
     */
    showFieldError(field, message) {
        field.classList.add('error');
        field.classList.remove('success');
        
        // Remove feedback anterior
        const existingFeedback = field.parentNode.querySelector('.field-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        // Adiciona novo feedback
        const feedback = document.createElement('div');
        feedback.className = 'field-feedback error';
        feedback.textContent = message;
        field.parentNode.appendChild(feedback);
    }

    /**
     * Mostra sucesso no campo
     */
    showFieldSuccess(field) {
        field.classList.add('success');
        field.classList.remove('error');
        
        // Remove feedback anterior
        const existingFeedback = field.parentNode.querySelector('.field-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
    }

    /**
     * Limpa validação do campo
     */
    clearFieldValidation(field) {
        field.classList.remove('error', 'success');
        const feedback = field.parentNode.querySelector('.field-feedback');
        if (feedback) {
            feedback.remove();
        }
    }

    /**
     * Manipula funcionalidade "Lembre de mim"
     */
    handleRememberMe(rememberMe, email) {
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
    }

    /**
     * Carrega email lembrado
     */
    loadRememberedEmail() {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail && this.elements.email) {
            this.elements.email.value = rememberedEmail;
            if (this.elements.rememberCheckbox) {
                this.elements.rememberCheckbox.checked = true;
            }
        }
    }

    /**
     * Define estado de loading
     */
    setLoadingState(loading) {
        this.isLoading = loading;
        
        if (this.elements.loginBtn) {
            if (loading) {
                this.elements.loginBtn.disabled = true;
                this.elements.loginBtn.innerHTML = 'Entrando...';
                this.elements.loginBtn.classList.add('loading');
            } else {
                this.elements.loginBtn.disabled = false;
                this.elements.loginBtn.innerHTML = 'Login';
                this.elements.loginBtn.classList.remove('loading');
            }
        }
    }

    /**
     * Simula delay de rede (remover quando integrar com backend)
     */
    simulateNetworkDelay() {
        return new Promise(resolve => {
            setTimeout(resolve, 1000);
        });
    }
}

// Inicializar página quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se já está logado
    if (window.authManager && window.authManager.isLoggedIn()) {
        window.location.href = 'home.html';
        return;
    }
    
    // Inicializar página de login
    new LoginPage();
});


