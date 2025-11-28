/**
 * PÁGINA DE ABERTURA DE VAGA
 * Funcionalidades para criação e validação de vagas
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeVagaForm();
    setupFileUpload();
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

/**
 * Configura o upload de arquivo
 */
function setupFileUpload() {
    const fileArea = document.querySelector('.file-upload-area');
    const fileInput = document.getElementById('justificativa');
    
    if (!fileArea || !fileInput) return;

    // Drag and drop
    fileArea.addEventListener('dragover', handleDragOver);
    fileArea.addEventListener('dragleave', handleDragLeave);
    fileArea.addEventListener('drop', handleDrop);
    
    // Click para abrir seletor
    fileArea.addEventListener('click', () => fileInput.click());
    
    // Mudança no input
    fileInput.addEventListener('change', handleFileSelect);
}

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
    // Valida tipo de arquivo
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type)) {
        showNotification('Tipo de arquivo não permitido. Use PDF, DOC ou DOCX.', 'error');
        return;
    }
    
    // Valida tamanho (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        showNotification('Arquivo muito grande. Tamanho máximo: 5MB', 'error');
        return;
    }
    
    // Atualiza interface
    updateFileDisplay(file);
    showNotification('Arquivo carregado com sucesso!', 'success');
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
async function handleFormSubmit(event) {
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
    
    try {
        // Salva a vaga via API
        await saveVaga(formData);
        
        showNotification('Vaga criada com sucesso!', 'success');
        
        // Redireciona após sucesso
        setTimeout(() => {
            window.location.href = 'minhas-solicitacoes.html';
        }, 1500);
        
    } catch (error) {
        console.error('Erro ao salvar vaga:', error);
        showNotification(error.message || 'Erro ao salvar vaga. Tente novamente.', 'error');
    } finally {
        // Remove loading
        submitBtn.classList.remove('loading');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
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
 * Salva vaga via API
 */
async function saveVaga(formData) {
    // Obtém usuário logado
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
        throw new Error('Usuário não logado. Faça login novamente.');
    }
    
    const currentUser = JSON.parse(currentUserStr);
    
    // Valida e converte o ID do usuário para inteiro
    let gestorId = currentUser.id;
    
    console.log('Current User:', currentUser);
    console.log('Gestor ID original:', gestorId, 'Tipo:', typeof gestorId);
    
    if (!gestorId) {
        throw new Error('ID do usuário não encontrado. Faça login novamente.');
    }
    
    // Converte para inteiro (garante que não seja um timestamp ou string)
    gestorId = parseInt(gestorId, 10);
    
    console.log('Gestor ID convertido:', gestorId);
    
    if (isNaN(gestorId) || gestorId <= 0 || gestorId > 2147483647) {
        console.error('ID inválido detectado:', gestorId);
        throw new Error(`ID do usuário inválido (${gestorId}). Faça login novamente.`);
    }
    
    // Obtém valores do formulário
    const cargo = document.getElementById('cargo').value;
    const periodo = document.getElementById('periodo').value;
    const modeloTrabalho = document.getElementById('modelo').value;
    const regimeContratacao = document.getElementById('regime').value;
    const salarioStr = document.getElementById('salario').value;
    const localidade = document.getElementById('localidade').value;
    const requisitos = document.getElementById('requisitos').value;
    const justificativaFile = document.getElementById('justificativa').files[0];
    
    // Converte salário para número (remove formatação)
    const salario = parseFloat(salarioStr.replace(/[^\d,]/g, '').replace(',', '.'));
    if (isNaN(salario) || salario <= 0) {
        throw new Error('Salário inválido');
    }
    
    // Prepara dados da requisição
    // O Spring aceita apenas o ID para relações ManyToOne
    const openingRequest = {
        cargo: cargo,
        periodo: periodo,
        modeloTrabalho: modeloTrabalho,
        regimeContratacao: regimeContratacao,
        salario: salario,
        localidade: localidade,
        requisitos: requisitos || null,
        gestor: {
            id: gestorId  // Agora garantido como inteiro válido
        }
    };
    
    console.log('Opening Request a ser enviado:', JSON.stringify(openingRequest, null, 2));
    
    // Importa cliente da API
    const { OpeningRequestClient } = await import('../../../client/client.js');
    const client = new OpeningRequestClient();
    
    // Cria a solicitação de abertura
    const createdRequest = await client.insert(openingRequest);
    
    // Se houver arquivo de justificativa, faz upload
    if (justificativaFile && createdRequest.id) {
        await client.uploadJustificativa(createdRequest.id, justificativaFile);
    }
    
    console.log('Vaga salva:', createdRequest);
    return createdRequest;
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
