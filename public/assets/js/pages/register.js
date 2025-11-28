/* ========================================
   PÁGINA DE CADASTRO
   ======================================== */

class RegisterPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Toggle visualização das senhas
        this.setupPasswordToggles();

        // Event listener para o botão de cadastro
        const registerBtn = document.querySelector('.btn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.handleRegister());
        }

        // Event listeners para Enter nos campos
        this.setupEnterListeners();
    }

    setupPasswordToggles() {
        // Toggle senha principal
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

        // Toggle confirmação de senha
        const toggleConfirmPassword = document.querySelector("#toggleConfirmPassword");
        const confirmPassword = document.querySelector("#confirm-password");

        if (toggleConfirmPassword && confirmPassword) {
            toggleConfirmPassword.addEventListener("click", () => {
                const type = confirmPassword.getAttribute("type") === "password" ? "text" : "password";
                confirmPassword.setAttribute("type", type);
                toggleConfirmPassword.classList.toggle("fa-eye");
                toggleConfirmPassword.classList.toggle("fa-eye-slash");
            });
        }
    }

    setupEnterListeners() {
        const fields = ['name', 'email', 'password', 'confirm-password'];
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleRegister();
                    }
                });
            }
        });
    }

    async handleRegister() {
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();

        try {
            // Validação do formulário
            this.validateForm(name, email, password, confirmPassword);

            // Criar dados do usuário
            const userData = {
                name: name,
                email: email,
                password: password
            };

            // Cadastrar usuário via API
            await this.registerUser(userData);

            // Mostrar mensagem de sucesso
            Utils.showMessage('Cadastro realizado com sucesso! Redirecionando para login...', 'success');

            // Redirecionar para login após 2 segundos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            Utils.showMessage(error.message, 'error');
        }
    }

    async registerUser(userData) {
        try {
            const { UsersClient } = await import('../../../client/client.js');
            const client = new UsersClient();
            await client.insert(userData);
        } catch (error) {
            console.error('Erro ao cadastrar usuário:', error);
            let errorMessage = 'Erro ao realizar cadastro. Tente novamente.';
            
            if (error.message.includes('Failed to insert')) {
                errorMessage = 'Erro ao cadastrar usuário. Verifique se o email já não está cadastrado.';
            }
            
            throw new Error(errorMessage);
        }
    }

    validateForm(name, email, password, confirmPassword) {
        if (!name || !email || !password || !confirmPassword) {
            throw new Error('Por favor, preencha todos os campos!');
        }

        if (name.length < 2) {
            throw new Error('O nome deve ter pelo menos 2 caracteres!');
        }

        if (!Utils.isValidEmail(email)) {
            throw new Error('Por favor, insira um email válido!');
        }

        if (!Utils.isValidPassword(password)) {
            throw new Error('A senha deve ter pelo menos 6 caracteres!');
        }

        if (password !== confirmPassword) {
            throw new Error('As senhas não coincidem!');
        }
    }
}

// Inicializar página quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    new RegisterPage();
});


