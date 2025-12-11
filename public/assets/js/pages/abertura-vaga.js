/**
 * PÁGINA DE ABERTURA DE VAGA
 * Funcionalidades para criação e validação de vagas
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeVagaForm();
    setupFormValidation();
});

/**
 * Inicializa o formulário de vaga
 */
function initializeVagaForm() {
    const form = document.getElementById('vagaForm');
    if (!form) return;

    // Adiciona máscara para salário
    const salarioInput = document.getElementById('salario');
    if (salarioInput) {
        salarioInput.addEventListener('input', formatCurrency);
    }

    // Adiciona validação em tempo real
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', validateField);
        field.addEventListener('input', clearValidation);
    });

    // Submit do formulário
    form.addEventListener('submit', handleFormSubmit);
}

// Função setupFileUpload removida - justificativa agora é campo de texto

/**
 * Configura validação do formulário
 */
function setupFormValidation() {
    // Validação customizada para email (se necessário)
    const emailFields = document.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        field.addEventListener('blur', validateEmail);
    });
}

/**
 * Formata valor monetário
 */
function formatCurrency(event) {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value) {
        value = (parseInt(value) / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }
    
    event.target.value = value;
}

/**
 * Valida campo individual
 */
function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    // Remove classes de validação anteriores
    field.classList.remove('is-valid', 'is-invalid');
    
    // Remove feedback anterior
    const existingFeedback = field.parentNode.querySelector('.invalid-feedback, .valid-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    // Validação básica
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'Este campo é obrigatório');
        return false;
    }
    
    // Validações específicas
    if (field.type === 'email' && value && !isValidEmail(value)) {
        showFieldError(field, 'Email inválido');
        return false;
    }
    
    if (field.id === 'salario' && value && !isValidSalary(value)) {
        showFieldError(field, 'Formato de salário inválido');
        return false;
    }
    
    // Se chegou até aqui, está válido
    if (value) {
        showFieldSuccess(field);
    }
    
    return true;
}

/**
 * Limpa validação do campo
 */
function clearValidation(event) {
    const field = event.target;
    field.classList.remove('is-invalid');
    
    const feedback = field.parentNode.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.remove();
    }
}

/**
 * Valida email
 */
function validateEmail(event) {
    const field = event.target;
    const value = field.value.trim();
    
    if (value && !isValidEmail(value)) {
        showFieldError(field, 'Email inválido');
        return false;
    }
    
    return true;
}

/**
 * Verifica se email é válido
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Verifica se salário é válido
 */
function isValidSalary(salary) {
    // Remove formatação e verifica se é um número válido
    const numericValue = salary.replace(/[^\d,]/g, '').replace(',', '.');
    const value = parseFloat(numericValue);
    return !isNaN(value) && value > 0;
}

/**
 * Mostra erro no campo
 */
function showFieldError(field, message) {
    field.classList.add('is-invalid');
    
    const feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    feedback.textContent = message;
    
    field.parentNode.appendChild(feedback);
}

/**
 * Mostra sucesso no campo
 */
function showFieldSuccess(field) {
    field.classList.add('is-valid');
}

/**
 * Manipula drag over
 */
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

/**
 * Manipula drag leave
 */
function handleDragLeave(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
}

/**
 * Manipula drop
 */
function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

/**
 * Manipula seleção de arquivo
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

/**
 * Processa arquivo selecionado
 */
function handleFile(file) {
    // Valida tipo de arquivo - apenas PDF
    const allowedTypes = ['application/pdf'];
    
    // Verifica também pela extensão
    const fileName = file.name.toLowerCase();
    const isValidExtension = fileName.endsWith('.pdf');
    
    if (!allowedTypes.includes(file.type) && !isValidExtension) {
        showNotification('Tipo de arquivo não permitido. Apenas arquivos PDF são aceitos.', 'error');
        // Limpa o input
        const fileInput = document.getElementById('justificativa');
        if (fileInput) {
            fileInput.value = '';
        }
        return;
    }
    
    // Valida tamanho (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        showNotification('Arquivo muito grande. Tamanho máximo: 5MB', 'error');
        // Limpa o input
        const fileInput = document.getElementById('justificativa');
        if (fileInput) {
            fileInput.value = '';
        }
        return;
    }
    
    // Atualiza interface
    updateFileDisplay(file);
    showNotification('Arquivo PDF carregado com sucesso!', 'success');
}

/**
 * Atualiza exibição do arquivo
 */
function updateFileDisplay(file) {
    const fileArea = document.querySelector('.file-upload-area');
    const content = fileArea.querySelector('.file-upload-content');
    
    content.innerHTML = `
        <i class="fas fa-file-alt"></i>
        <span>${file.name}</span>
        <small class="text-muted">${formatFileSize(file.size)}</small>
    `;
    
    fileArea.classList.add('file-selected');
}

/**
 * Formata tamanho do arquivo
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Manipula submit do formulário
 */
function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Valida todos os campos obrigatórios
    const isValid = validateAllFields(form);
    
    if (!isValid) {
        showNotification('Por favor, corrija os erros no formulário', 'error');
        return;
    }
    
    // Mostra loading
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    // Salva temporariamente no localStorage
    // O envio para API será feito em minhas-solicitacoes.html
    saveVagaLocal(formData)
        .then(() => {
            showNotification('Solicitação salva temporariamente! Envie em "Minhas Solicitações".', 'success');
            
            // Redireciona para minhas-solicitacoes.html
            setTimeout(() => {
                window.location.href = 'minhas-solicitacoes.html';
            }, 1500);
        })
        .catch(error => {
            console.error('Erro ao salvar solicitação:', error);
            showNotification('Erro ao salvar solicitação. Tente novamente.', 'error');
        })
        .finally(() => {
            // Remove loading
            submitBtn.classList.remove('loading');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
}

/**
 * Valida todos os campos do formulário
 */
function validateAllFields(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        const fieldValid = validateField({ target: field });
        if (!fieldValid) {
            isValid = false;
        }
    });
    
    return isValid;
}

/**
 * Salva solicitação de abertura de vaga temporariamente no localStorage
 * O envio para API será feito em minhas-solicitacoes.html
 */
function saveVagaLocal(formData) {
    return new Promise((resolve, reject) => {
        // Pega usuário logado
        const userLoggedStr = localStorage.getItem('userLogged');
        let currentUser;
        try {
            currentUser = userLoggedStr ? JSON.parse(userLoggedStr) : null;
        } catch (e) {
            console.error('Erro ao fazer parse do userLogged:', e);
            currentUser = null;
        }
        
        // Fallback se não encontrar
        if (!currentUser || !currentUser.id_user) {
            console.warn('userLogged não encontrado ou inválido, usando fallback');
            currentUser = { id_user: 1, name: 'Usuário Padrão' };
        }
        
        // Prepara dados da vaga
        const cargo = formData.get('cargo') || document.getElementById('cargo').value;
        const area = formData.get('area') || document.getElementById('area').value;
        const periodo = formData.get('periodo') || document.getElementById('periodo').value;
        const modelo = formData.get('modelo') || document.getElementById('modelo').value;
        const regimeRaw = formData.get('regime') || document.getElementById('regime').value;
        const salario = formData.get('salario') || document.getElementById('salario').value;
        const localidade = formData.get('localidade') || document.getElementById('localidade').value;
        const requisitos = formData.get('requisitos') || document.getElementById('requisitos').value;
        
        // Mapeia valores do formulário para valores do enum do backend
        const regimeMap = {
            'clt': 'CLT',
            'pj': 'PJ',
            'estagio': 'Estágio',
            'trainee': 'Estágio',
            'temporario': 'Temporário',
            'autonomo': 'Autônomo'
        };
        const regime = regimeMap[regimeRaw.toLowerCase()] || 'CLT';
        
        // Remove formatação do salário e garante que seja um número válido
        let salarioNumerico = 0;
        if (salario) {
            const salarioLimpo = salario.replace(/[^\d,]/g, '').replace(',', '.');
            salarioNumerico = parseFloat(salarioLimpo) || 0;
        }
        
        // Garante que gestor_id seja um número válido
        let gestorId = currentUser.id_user;
        if (gestorId) {
            gestorId = Number(gestorId);
            if (isNaN(gestorId)) {
                reject(new Error('ID do usuário inválido'));
                return;
            }
        } else {
            reject(new Error('Usuário não está logado corretamente'));
            return;
        }
        
        // Pega justificativa como texto
        const justificativa = formData.get('justificativa') || document.getElementById('justificativa')?.value || '';
        
        // Prepara dados da solicitação conforme a estrutura da tabela opening_requests
        const openingRequestData = {
            id: 'temp_' + Date.now(), // ID temporário
            cargo: cargo,
            area: area, // Campo área adicionado
            periodo: periodo,
            modeloTrabalho: modelo,
            regimeContratacao: regime,
            salario: salarioNumerico,
            localidade: localidade,
            requisitos: requisitos || '',
            justificativa: justificativa.trim(), // Justificativa como string
            gestor_id: gestorId,
            gestor: {
                id_user: gestorId
            },
            status: 'ENTRADA',
            createdAt: new Date().toISOString(),
            isPending: true // Flag para indicar que está pendente de envio
        };
        
        // Salva no localStorage
        saveToLocalStorage(openingRequestData);
        resolve(openingRequestData);
    });
}

/**
 * Salva solicitação no localStorage
 */
function saveToLocalStorage(openingRequestData) {
    // Busca solicitações pendentes existentes
    const pendingRequests = JSON.parse(localStorage.getItem('pendingOpeningRequests') || '[]');
    
    // Adiciona a nova solicitação
    pendingRequests.push(openingRequestData);
    
    // Salva no localStorage
    localStorage.setItem('pendingOpeningRequests', JSON.stringify(pendingRequests));
    
    console.log('Solicitação salva no localStorage:', openingRequestData);
}

/**
 * Mostra notificação
 */
function showNotification(message, type = 'info') {
    // Remove notificação anterior se existir
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Cria nova notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Adiciona estilos
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    // Cores baseadas no tipo
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Adiciona ao DOM
    document.body.appendChild(notification);
    
    // Anima entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove após 5 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}
