
/* ========================================
   GERENTE - Gerenciamento de Gerentes
   ======================================== */

import { UsersClient } from '../../../client/client.js';

// Instância global do cliente de usuários
const usersClient = new UsersClient();

// Variável para controlar modo de edição
let editingUserId = null;

// Verificar se o usuário é admin (apenas admin pode criar/editar/excluir usuários)
let isAdmin = false;

// Inicialização quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", async () => {
    // Verificar permissão do usuário - apenas ADMIN pode gerenciar usuários
    const waitForUtils = () => {
        if (window.Utils && typeof window.Utils.normalizeLevelAccess === 'function') {
            try {
                const userLoggedStr = localStorage.getItem('userLogged') || localStorage.getItem('currentUser');
                if (userLoggedStr) {
                    const user = JSON.parse(userLoggedStr);
                    const userLevel = window.Utils.normalizeLevelAccess(user.levelAccess || user.level_access);
                    isAdmin = userLevel === 'ADMIN';
                    
                    if (!isAdmin) {
                        // Bloquear acesso de não-admins
                        const UtilsRef = window.Utils || Utils;
                        if (UtilsRef && typeof UtilsRef.showMessage === 'function') {
                            UtilsRef.showMessage('Apenas administradores podem gerenciar usuários.', 'error');
                        } else {
                            alert('Apenas administradores podem gerenciar usuários.');
                        }
                        setTimeout(() => {
                            window.location.href = 'home.html';
                        }, 2000);
                        return;
                    }
                }
            } catch (error) {
                console.error('Erro ao verificar permissão:', error);
            }
            initGerentePage();
        } else {
            setTimeout(waitForUtils, 50);
        }
    };
    waitForUtils();
});

/**
 * Inicializa a página de gerentes
 */
async function initGerentePage() {
    // Carrega a lista de gerentes
    await loadGerentes();

    // Configura os event listeners
    setupEventListeners();
}

/**
 * Configura todos os event listeners da página
 */
function setupEventListeners() {
    // Formulário de cadastro/edição
    const gerenteForm = document.getElementById("gerenteForm");
    if (gerenteForm) {
        gerenteForm.addEventListener("submit", handleFormSubmit);
    }

    // Campo de busca
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        let searchTimer;
        searchInput.addEventListener("input", (e) => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => handleSearch(e), 150);
        });
    }

    // Delegação de eventos para botões de ação na tabela
    const tableBody = document.getElementById("gerenteTableBody");
    if (tableBody) {
        tableBody.addEventListener("click", handleTableActions);
    }

    // Botão cancelar edição
    const cancelBtn = document.getElementById("cancelEdit");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", cancelEdit);
    }

    // Toggle de visibilidade da senha
    const togglePasswordBtn = document.getElementById("togglePasswordBtn");
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener("click", togglePasswordVisibility);
    }

    // Validação em tempo real do campo de senha
    const passwordInput = document.getElementById("password");
    if (passwordInput) {
        passwordInput.addEventListener("input", validatePasswordField);
        passwordInput.addEventListener("blur", validatePasswordField);
    }

    // Checkbox para alterar senha (modo edição)
    const changePasswordCheckbox = document.getElementById("changePasswordCheckbox");
    if (changePasswordCheckbox) {
        changePasswordCheckbox.addEventListener("change", handleChangePasswordCheckbox);
    }
}

/**
 * Carrega todos os gerentes do backend
 */
async function loadGerentes() {
    try {
        showLoading(true);
        
        // Usa endpoint otimizado para buscar apenas gerentes
        let gerentes;
        try {
            gerentes = await usersClient.findByAccess("MANAGER");
        } catch {
            // Fallback: busca todos e filtra localmente
            const users = await usersClient.findAll();
            gerentes = users.filter(user => 
                user.levelAccess === "MANAGER" || 
                user.levelAccess === "3" || 
                user.levelAccess === 3
            );
        }
        
        renderGerentes(gerentes);
    } catch (error) {
        console.error("Erro ao carregar gerentes:", error);
        showNotification("Erro ao carregar gerentes!", "danger");
    } finally {
        showLoading(false);
    }
}

/**
 * Renderiza a lista de gerentes na tabela
 * @param {Array} gerentes - Lista de gerentes
 */
function renderGerentes(gerentes) {
    const tableBody = document.getElementById("gerenteTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (gerentes.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i>
                    <p>Nenhum gerente cadastrado</p>
                </td>
            </tr>
        `;
        return;
    }

    gerentes.forEach(gerente => {
        const tr = document.createElement("tr");
        const id = gerente.id_user || gerente.id;
        tr.dataset.id = id;

        tr.innerHTML = `
            <td>${escapeHtml(gerente.name || "")}</td>
            <td>${escapeHtml(gerente.email || "")}</td>
            <td>${escapeHtml(gerente.area || "")}</td>
            <td>
                <div class="d-flex">
                    <button class="btn btn-info btn-sm btn-edit" data-id="${id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm ml-2 btn-delete" data-id="${id}" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        tableBody.appendChild(tr);
    });
}

/**
 * Manipula o envio do formulário (criar ou editar)
 * @param {Event} e - Evento de submit
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    // Verificar se é admin antes de permitir criar/editar
    if (!isAdmin) {
        showNotification("Apenas administradores podem criar ou editar usuários!", "error");
        return;
    }

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const area = document.getElementById("area").value.trim();
    const password = document.getElementById("password").value.trim();
    const changePasswordCheckbox = document.getElementById("changePasswordCheckbox");

    // Validação básica
    if (!name || !email || !area) {
        showNotification("Preencha todos os campos obrigatórios!", "warning");
        return;
    }

    if (!isValidEmail(email)) {
        showNotification("E-mail inválido!", "warning");
        return;
    }

    // Validação de senha
    if (!editingUserId && !password) {
        // Modo criação - senha é obrigatória
        showNotification("A senha é obrigatória para novo cadastro!", "warning");
        document.getElementById("password").focus();
        return;
    }

    // Se está editando e marcou para alterar senha, valida
    if (editingUserId && changePasswordCheckbox && changePasswordCheckbox.checked) {
        if (!password) {
            showNotification("Preencha a nova senha para alterar!", "warning");
            document.getElementById("password").focus();
            return;
        }
        if (password.length < 6) {
            showNotification("A senha deve ter no mínimo 6 caracteres!", "warning");
            document.getElementById("password").focus();
            return;
        }
    }

    if (password && password.length < 6) {
        showNotification("A senha deve ter no mínimo 6 caracteres!", "warning");
        document.getElementById("password").focus();
        return;
    }

    // Prepara dados do gerente
    const gerenteData = {};
    
    // Campos básicos sempre enviados
    if (name && name.trim()) gerenteData.name = name.trim();
    if (email && email.trim()) gerenteData.email = email.trim();
    if (area && area.trim()) gerenteData.area = area.trim();
    
    // levelAccess só é enviado na criação
    if (!editingUserId) {
        gerenteData.levelAccess = "MANAGER"; // Enum apenas na criação
    }
    
    // Adiciona senha apenas se:
    // 1. É novo cadastro (sempre obrigatória)
    // 2. Está editando E checkbox marcado (senha será atualizada)
    if (!editingUserId) {
        // Modo criação - senha obrigatória
        if (password && password.trim()) {
            gerenteData.password = password.trim();
        }
    } else if (changePasswordCheckbox && changePasswordCheckbox.checked && password && password.trim().length > 0) {
        // Modo edição - se checkbox está marcado, atualiza a senha
        gerenteData.password = password.trim();
    }

    try {
        const managerId = document.getElementById("managerId")?.value;
        
        if (managerId || editingUserId) {
            // Modo edição - atualiza o gerente existente
            const id = managerId || editingUserId;
            await usersClient.updateUser(id, gerenteData);
            const message = password ? "Gerente e senha atualizados com sucesso!" : "Gerente atualizado com sucesso!";
            showNotification(message, "success");
            cancelEdit();
        } else {
            // Modo criação - insere novo gerente
            await usersClient.insert(gerenteData);
            showNotification("Gerente cadastrado com sucesso!", "success");
        }

        // Limpa o formulário e recarrega a lista
        clearForm();
        await loadGerentes();
    } catch (error) {
        console.error("Erro ao salvar gerente:", error);
        showNotification("Erro ao salvar gerente!", "danger");
    }
}

/**
 * Manipula ações na tabela (editar/excluir)
 * @param {Event} e - Evento de click
 */
async function handleTableActions(e) {
    const target = e.target.closest("button");
    if (!target) return;

    const id = target.dataset.id;

    if (target.classList.contains("btn-edit")) {
        await editGerente(id);
    } else if (target.classList.contains("btn-delete")) {
        await deleteGerente(id);
    }
}

/**
 * Carrega dados do gerente para edição
 * @param {string|number} id - ID do gerente
 */
async function editGerente(id) {
    // Verificar se é admin antes de permitir editar
    if (!isAdmin) {
        showNotification("Apenas administradores podem editar usuários!", "error");
        return;
    }

    try {
        const gerente = await usersClient.findById(id);

        document.getElementById("name").value = gerente.name || "";
        document.getElementById("email").value = gerente.email || "";
        document.getElementById("area").value = gerente.area || "";
        // Limpa o campo de senha ao editar (não mostra a senha atual por segurança)
        document.getElementById("password").value = "";
        document.getElementById("password").removeAttribute("required");
        document.getElementById("password").disabled = true;
        
        // Armazena o ID em campo hidden se existir
        const managerIdField = document.getElementById("managerId");
        if (managerIdField) {
            managerIdField.value = id;
        }
        
        editingUserId = id;

        // Mostra checkbox para alterar senha
        const changePasswordContainer = document.getElementById("changePasswordCheckboxContainer");
        const changePasswordCheckbox = document.getElementById("changePasswordCheckbox");
        if (changePasswordContainer) {
            changePasswordContainer.style.display = "block";
        }
        if (changePasswordCheckbox) {
            changePasswordCheckbox.checked = false;
        }

        // Atualiza hint e help text para modo edição
        const passwordHint = document.getElementById("passwordHint");
        const passwordHelp = document.getElementById("passwordHelp");
        if (passwordHint) {
            passwordHint.textContent = "(opcional - marque para alterar)";
        }
        if (passwordHelp) {
            passwordHelp.textContent = "Marque a opção acima e preencha para alterar a senha";
            passwordHelp.style.display = "block";
        }

        // Muda o título do formulário
        const formTitle = document.getElementById("formTitle");
        if (formTitle) {
            formTitle.textContent = "Editar Gerente";
        }

        // Muda o botão para modo de edição
        const submitBtn = document.getElementById("addGerenteBtn");
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-check"></i>';
            submitBtn.classList.remove("btn-primary");
            submitBtn.classList.add("btn-success");
        }

        // Mostra botão de cancelar
        const cancelBtn = document.getElementById("cancelEdit");
        if (cancelBtn) {
            cancelBtn.classList.remove("d-none");
        }

        // Scroll até o formulário
        const form = document.getElementById("gerenteForm");
        if (form) {
            form.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        showNotification("Dados carregados para edição!", "info");
    } catch (error) {
        console.error("Erro ao carregar gerente:", error);
        showNotification("Erro ao carregar dados do gerente!", "danger");
    }
}

/**
 * Exclui um gerente
 * @param {string|number} id - ID do gerente
 */
async function deleteGerente(id) {
    // Verificar se é admin antes de permitir excluir
    if (!isAdmin) {
        showNotification("Apenas administradores podem excluir usuários!", "error");
        return;
    }

    if (!confirm("Tem certeza que deseja excluir este gerente?")) {
        return;
    }

    try {
        await usersClient.delete(id);
        showNotification("Gerente excluído com sucesso!", "success");
        await loadGerentes();
    } catch (error) {
        console.error("Erro ao excluir gerente:", error);
        showNotification("Erro ao excluir gerente!", "danger");
    }
}

/**
 * Manipula a busca de gerentes
 * @param {Event} e - Evento de input
 */
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll("#gerenteTableBody tr");

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? "" : "none";
    });
}

/**
 * Limpa o formulário
 */
function clearForm() {
    const form = document.getElementById("gerenteForm");
    if (form) form.reset();
    
    const managerIdField = document.getElementById("managerId");
    if (managerIdField) managerIdField.value = "";
    
    editingUserId = null;
    
    // Esconde checkbox de alterar senha
    const changePasswordContainer = document.getElementById("changePasswordCheckboxContainer");
    const changePasswordCheckbox = document.getElementById("changePasswordCheckbox");
    if (changePasswordContainer) {
        changePasswordContainer.style.display = "none";
    }
    if (changePasswordCheckbox) {
        changePasswordCheckbox.checked = false;
    }
    
    // Restaura hint e help text para modo criação
    const passwordHint = document.getElementById("passwordHint");
    const passwordHelp = document.getElementById("passwordHelp");
    if (passwordHint) {
        passwordHint.textContent = "(obrigatória para novo cadastro)";
    }
    if (passwordHelp) {
        passwordHelp.textContent = "Deixe em branco para manter a senha atual (ao editar)";
        passwordHelp.style.display = "none";
    }
    
    // Restaura tipo de input para password e habilita campo
    const passwordInput = document.getElementById("password");
    if (passwordInput) {
        passwordInput.type = "password";
        passwordInput.setAttribute("required", "");
        passwordInput.disabled = false;
    }
    
    // Restaura ícone do toggle
    const toggleIcon = document.getElementById("togglePasswordIcon");
    if (toggleIcon) {
        toggleIcon.classList.remove("fa-eye-slash");
        toggleIcon.classList.add("fa-eye");
    }
}

/**
 * Cancela o modo de edição
 */
function cancelEdit() {
    clearForm();

    // Restaura título
    const formTitle = document.getElementById("formTitle");
    if (formTitle) {
        formTitle.textContent = "Adicionar Novo Gerente";
    }

    // Restaura botão
    const submitBtn = document.getElementById("addGerenteBtn");
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i>';
        submitBtn.classList.remove("btn-success");
        submitBtn.classList.add("btn-primary");
    }

    // Esconde botão de cancelar
    const cancelBtn = document.getElementById("cancelEdit");
    if (cancelBtn) {
        cancelBtn.classList.add("d-none");
    }
}

/**
 * Exibe/oculta indicador de carregamento
 * @param {boolean} show - Se deve mostrar ou ocultar
 */
function showLoading(show) {
    const tableBody = document.getElementById("gerenteTableBody");
    if (!tableBody) return;

    if (show) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="sr-only">Carregando...</span>
                    </div>
                </td>
            </tr>
        `;
    }
}

/**
 * Exibe notificação na tela
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo da notificação (success, danger, warning, info)
 */
function showNotification(message, type = "info") {
    // Remove notificações anteriores
    document.querySelectorAll(".custom-notification").forEach(el => el.remove());

    const notification = document.createElement("div");
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed custom-notification`;
    notification.setAttribute("role", "alert");
    notification.style.cssText = "top: 20px; right: 20px; z-index: 1055; min-width: 300px;";
    notification.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;

    document.body.appendChild(notification);

    // Auto-remover após 3.5 segundos
    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => notification.remove(), 150);
    }, 3500);
}

/**
 * Valida formato de e-mail
 * @param {string} email - E-mail a ser validado
 * @returns {boolean}
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} text - Texto a ser escapado
 * @returns {string}
 */
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Alterna visibilidade da senha
 */
function togglePasswordVisibility() {
    const passwordInput = document.getElementById("password");
    const toggleIcon = document.getElementById("togglePasswordIcon");
    
    if (!passwordInput || !toggleIcon) return;
    
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleIcon.classList.remove("fa-eye");
        toggleIcon.classList.add("fa-eye-slash");
    } else {
        passwordInput.type = "password";
        toggleIcon.classList.remove("fa-eye-slash");
        toggleIcon.classList.add("fa-eye");
    }
}

/**
 * Manipula checkbox de alterar senha
 */
function handleChangePasswordCheckbox() {
    const checkbox = document.getElementById("changePasswordCheckbox");
    const passwordInput = document.getElementById("password");
    
    if (!checkbox || !passwordInput) return;
    
    if (checkbox.checked) {
        // Habilita campo de senha quando checkbox está marcado
        passwordInput.disabled = false;
        passwordInput.focus();
        passwordInput.setAttribute("required", "");
    } else {
        // Desabilita e limpa campo quando checkbox está desmarcado
        passwordInput.disabled = true;
        passwordInput.value = "";
        passwordInput.removeAttribute("required");
        passwordInput.classList.remove("is-valid", "is-invalid");
    }
}

/**
 * Valida campo de senha em tempo real
 */
function validatePasswordField() {
    const passwordInput = document.getElementById("password");
    if (!passwordInput || passwordInput.disabled) return;
    
    const password = passwordInput.value.trim();
    
    // Remove classes de validação anteriores
    passwordInput.classList.remove("is-valid", "is-invalid");
    
    // Se está em modo de edição e campo está vazio, não valida (é opcional)
    if (editingUserId && !password) {
        return;
    }
    
    // Se está em modo de criação ou campo preenchido, valida
    if (!editingUserId && !password) {
        // Em modo criação, senha é obrigatória mas validação será feita no submit
        return;
    }
    
    if (password && password.length < 6) {
        passwordInput.classList.add("is-invalid");
    } else if (password && password.length >= 6) {
        passwordInput.classList.add("is-valid");
    }
}

// Exporta funções para uso global (se necessário)
window.deleteGerente = deleteGerente;
window.editGerente = editGerente;
window.cancelEdit = cancelEdit;
