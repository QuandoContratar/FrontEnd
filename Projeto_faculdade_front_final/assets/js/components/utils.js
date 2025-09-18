/* ========================================
   UTILITÁRIOS GERAIS
   ======================================== */

class Utils {
    // Mostrar mensagens de feedback
    static showMessage(message, type = 'info', duration = 3000) {
        // Remover mensagem anterior se existir
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Criar nova mensagem
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            max-width: 400px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;

        // Adicionar CSS para animação se não existir
        if (!document.querySelector('#message-styles')) {
            const style = document.createElement('style');
            style.id = 'message-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(messageDiv);

        // Remover mensagem após o tempo especificado
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.remove();
                    }
                }, 300);
            }
        }, duration);
    }

    // Validação de email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validação de senha
    static isValidPassword(password, minLength = 6) {
        return password && password.length >= minLength;
    }

    // Formatação de data
    static formatDate(date, locale = 'pt-BR') {
        return new Date(date).toLocaleDateString(locale);
    }

    // Formatação de moeda
    static formatCurrency(value, currency = 'BRL') {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency
        }).format(value);
    }

    // Debounce para otimizar buscas
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle para otimizar eventos
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Gerar ID único
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Sanitizar string (remover caracteres especiais)
    static sanitizeString(str) {
        return str.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    }

    // Capitalizar primeira letra
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    // Verificar se é dispositivo móvel
    static isMobile() {
        return window.innerWidth <= 768;
    }

    // Scroll suave para elemento
    static smoothScrollTo(element, offset = 0) {
        const targetPosition = element.offsetTop - offset;
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }

    // Copiar texto para clipboard
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showMessage('Texto copiado!', 'success');
        } catch (err) {
            this.showMessage('Erro ao copiar texto', 'error');
        }
    }

    // Download de arquivo
    static downloadFile(data, filename, type = 'text/plain') {
        const blob = new Blob([data], { type });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    // Verificar conexão com internet
    static isOnline() {
        return navigator.onLine;
    }

    // Adicionar listener para mudanças de conexão
    static onConnectionChange(callback) {
        window.addEventListener('online', () => callback(true));
        window.addEventListener('offline', () => callback(false));
    }
}

// Disponibilizar globalmente
window.Utils = Utils;

