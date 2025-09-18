/* ========================================
   PÁGINA DE LOGIN
   ======================================== */

class LoginPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadRememberedEmail();
    }

    setupEventListeners() {
        // Toggle visualização da senha
        const togglePassword = document.querySelector("#togglePassword");
        const password = document.querySelector("#password");

        if (togglePassword && password) {
            togglePassword.addEventListener("click", () => {
                const type = password.getAttribute("type") === "password" ? "text" : "password";
                password.setAttribute("type", type);
                togglePassword.classList.toggle("fa-eye");
                togglePassword.classList.toggle("fa-eye-slash");
            });
        }

        // Event listener para o botão de login
        const loginBtn = document.querySelector('.btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.handleLogin());
        }

        // Event listeners para Enter nos campos
        const emailField = document.getElementById('email');
        const passwordField = document.getElementById('password');

        if (emailField) {
            emailField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleLogin();
                }
            });
        }

        if (passwordField) {
            passwordField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleLogin();
                }
            });
        }
    }

    handleLogin() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const rememberMe = document.querySelector('input[type="checkbox"]').checked;

        try {
            // Validação básica
            this.validateForm(email, password);

            // Tentar fazer login
            const user = window.authManager.login(email, password);

            // Salvar dados se "Lembre de mim" estiver marcado
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            // Mostrar mensagem de sucesso
            Utils.showMessage('Login realizado com sucesso! Redirecionando...', 'success');

            // Redirecionar após delay
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);

        } catch (error) {
            Utils.showMessage(error.message, 'error');
        }
    }

    validateForm(email, password) {
        if (!email || !password) {
            throw new Error('Por favor, preencha todos os campos!');
        }

        if (!Utils.isValidEmail(email)) {
            throw new Error('Por favor, insira um email válido!');
        }

        if (!Utils.isValidPassword(password)) {
            throw new Error('A senha deve ter pelo menos 6 caracteres!');
        }
    }

    loadRememberedEmail() {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            const emailField = document.getElementById('email');
            const rememberCheckbox = document.querySelector('input[type="checkbox"]');
            
            if (emailField) {
                emailField.value = rememberedEmail;
            }
            if (rememberCheckbox) {
                rememberCheckbox.checked = true;
            }
        }
    }
}

// Inicializar página quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new LoginPage();
});


