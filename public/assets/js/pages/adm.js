
/* ========================================
   ADM - Gerenciamento de Administradores
   ======================================== */

import { UsersClient } from '../../../client/client.js';

// Instância global do cliente de usuários
const usersClient = new UsersClient();

// Variável para controlar modo de edição
let editingUserId = null;

// Inicialização quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", async () => {
    await initAdminPage();
});

/**
 * Inicializa a página de administradores
 */
async function initAdminPage() {
    // Carrega a lista de administradores
    await loadAdmins();

    // Configura os event listeners
    setupEventListeners();
}

/**
 * Configura todos os event listeners da página
 */
function setupEventListeners() {
    // Formulário de cadastro/edição
    const adminForm = document.getElementById("adminForm");
    if (adminForm) {
        adminForm.addEventListener("submit", handleFormSubmit);
    }

    // Campo de busca
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keyup", handleSearch);
    }

    // Delegação de eventos para botões de ação na tabela
    const tableBody = document.getElementById("adminTableBody");
    if (tableBody) {
        tableBody.addEventListener("click", handleTableActions);
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
 * Carrega todos os administradores do backend
 */
async function loadAdmins() {
    try {
        showLoading(true);
        
        // Usa endpoint otimizado para buscar apenas administradores
        let adminUsers;
        try {
            adminUsers = await usersClient.findByAccess("ADMIN");
        } catch {
            // Fallback: busca todos e filtra localmente
            const admins = await usersClient.findAll();
            adminUsers = admins.filter(user => 
                user.levelAccess === "ADMIN" || 
                user.levelAccess === "1" || 
                user.levelAccess === 1
            );
        }
        
        renderAdmins(adminUsers);
    } catch (error) {
        console.error("Erro ao carregar administradores:", error);
        showNotification("Erro ao carregar administradores!", "danger");
    } finally {
        showLoading(false);
    }
}

/**
 * Renderiza a lista de administradores na tabela
 * @param {Array} admins - Lista de administradores
 */
function renderAdmins(admins) {
    const tableBody = document.getElementById("adminTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (admins.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i>
                    <p>Nenhum administrador cadastrado</p>
                </td>
            </tr>
        `;
        return;
    }

    admins.forEach(admin => {
        const tr = document.createElement("tr");
        tr.dataset.id = admin.id_user || admin.id;

        tr.innerHTML = `
            <td>${escapeHtml(admin.name || "")}</td>
            <td>${escapeHtml(admin.email || "")}</td>
            <td>${escapeHtml(admin.area || "")}</td>
            <td>
                <button class="btn btn-info btn-sm btn-edit" data-id="${admin.id_user || admin.id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm btn-delete" data-id="${admin.id_user || admin.id}" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
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

    // Se está editando e preencheu senha sem marcar checkbox, valida também
    if (editingUserId && password && (!changePasswordCheckbox || !changePasswordCheckbox.checked)) {
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

    // Prepara dados do administrador
    // IMPORTANTE: O backend usa reflexão e só atualiza campos não-null
    // O problema pode ser com campos que causam erro na reflexão
    const adminData = {};
    
    // Campos básicos sempre enviados (garantir que não são null ou undefined)
    if (name && name.trim()) adminData.name = name.trim();
    if (email && email.trim()) adminData.email = email.trim();
    if (area && area.trim()) adminData.area = area.trim();
    
    // levelAccess só é enviado na criação
    // Em edição, NÃO enviamos para evitar problemas de reflexão com enum
    if (!editingUserId) {
        adminData.levelAccess = "ADMIN"; // Enum apenas na criação
    }
    
    // Adiciona senha apenas se:
    // 1. É novo cadastro (sempre obrigatória)
    // 2. Está editando E checkbox marcado (senha será atualizada)
    if (!editingUserId) {
        // Modo criação - senha obrigatória
        if (password && password.trim()) {
            adminData.password = password.trim();
        }
    } else if (changePasswordCheckbox && changePasswordCheckbox.checked && password && password.trim().length > 0) {
        // Modo edição - se checkbox está marcado, atualiza a senha
        adminData.password = password.trim();
    }
    // Se está editando e checkbox não está marcado, não envia o campo password

    try {
        // Log detalhado dos dados antes de enviar
        console.log("📤 ===== DADOS DO ADMINISTRADOR =====");
        console.log("📤 Modo:", editingUserId ? "EDIÇÃO" : "CRIAÇÃO");
        console.log("📤 ID (se edição):", editingUserId);
        console.log("📤 Dados completos:", JSON.stringify(adminData, null, 2));
        console.log("📤 Campos enviados:", Object.keys(adminData));
        console.log("📤 Valores:", adminData);
        
        if (editingUserId) {
            // Modo edição - atualiza o administrador existente
            const result = await usersClient.update(editingUserId, adminData);
            console.log("✅ [adm.js] Resposta do update:", result);
            
            // Se chegou aqui, a atualização foi bem-sucedida
            const message = password ? "Administrador e senha atualizados com sucesso!" : "Administrador atualizado com sucesso!";
            showNotification(message, "success");
            cancelEdit();
            
            // Limpa o formulário e recarrega a lista
            clearForm();
            await loadAdmins();
        } else {
            // Modo criação - insere novo administrador
            const result = await usersClient.insert(adminData);
            console.log("✅ [adm.js] Resposta do insert:", result);
            showNotification("Administrador cadastrado com sucesso!", "success");
            
            // Limpa o formulário e recarrega a lista
            clearForm();
            await loadAdmins();
        }
    } catch (error) {
        console.error("❌ ===== ERRO AO SALVAR ADMINISTRADOR =====");
        console.error("❌ Erro completo:", error);
        console.error("❌ Mensagem:", error.message);
        console.error("❌ Stack:", error.stack);
        
        // Mensagem de erro mais específica
        let errorMessage = "Erro ao salvar administrador!";
        const errorMsg = error.message || "";
        
        if (errorMsg.includes("422") || errorMsg.includes("Unprocessable")) {
            errorMessage = "Erro de validação (422). Verifique se todos os campos estão corretos e tente novamente.";
            console.error("❌ Dados que causaram erro:", adminData);
        } else if (errorMsg.includes("401")) {
            errorMessage = "Não autorizado. Faça login novamente.";
        } else if (errorMsg.includes("404")) {
            errorMessage = "Administrador não encontrado.";
        } else if (errorMsg.includes("409")) {
            errorMessage = "E-mail já cadastrado. Use outro e-mail.";
        } else {
            errorMessage = `Erro: ${errorMsg}`;
        }
        
        showNotification(errorMessage, "danger");
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
        await editAdmin(id);
    } else if (target.classList.contains("btn-delete")) {
        await deleteAdmin(id);
    }
}

/**
 * Carrega dados do administrador para edição
 * @param {string|number} id - ID do administrador
 */
async function editAdmin(id) {
    try {
        const admin = await usersClient.findById(id);

        document.getElementById("name").value = admin.name || "";
        document.getElementById("email").value = admin.email || "";
        document.getElementById("area").value = admin.area || "";
        // Limpa o campo de senha ao editar (não mostra a senha atual por segurança)
        document.getElementById("password").value = "";
        document.getElementById("password").removeAttribute("required");
        document.getElementById("password").disabled = true;

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

        // Muda o botão para modo de edição
        const submitBtn = document.getElementById("addAdminBtn");
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-check"></i>';
            submitBtn.classList.remove("btn-primary");
            submitBtn.classList.add("btn-success");
        }

        // Adiciona botão de cancelar se não existir
        addCancelButton();

        showNotification("Dados carregados para edição! Marque 'Alterar senha' para modificar a senha.", "info");
    } catch (error) {
        console.error("Erro ao carregar administrador:", error);
        showNotification("Erro ao carregar dados do administrador!", "danger");
    }
}

/**
 * Exclui um administrador
 * @param {string|number} id - ID do administrador
 */
async function deleteAdmin(id) {
    if (!confirm("Tem certeza que deseja excluir este administrador?")) {
        return;
    }

    try {
        await usersClient.delete(id);
        showNotification("Administrador excluído com sucesso!", "success");
        await loadAdmins();
    } catch (error) {
        console.error("Erro ao excluir administrador:", error);
        showNotification("Erro ao excluir administrador!", "danger");
    }
}

/**
 * Manipula a busca de administradores
 * @param {Event} e - Evento de keyup
 */
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll("#adminTableBody tr");

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? "" : "none";
    });
}

/**
 * Limpa o formulário
 */
function clearForm() {
    document.getElementById("adminForm").reset();
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

    const submitBtn = document.getElementById("addAdminBtn");
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i>';
        submitBtn.classList.remove("btn-success");
        submitBtn.classList.add("btn-primary");
    }

    // Remove botão de cancelar
    const cancelBtn = document.getElementById("cancelEditBtn");
    if (cancelBtn) {
        cancelBtn.remove();
    }
}

/**
 * Adiciona botão de cancelar edição
 */
function addCancelButton() {
    if (document.getElementById("cancelEditBtn")) return;

    const submitBtn = document.getElementById("addAdminBtn");
    if (!submitBtn) return;

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.id = "cancelEditBtn";
    cancelBtn.className = "btn btn-secondary w-100 mt-2";
    cancelBtn.innerHTML = '<i class="fas fa-times"></i>';
    cancelBtn.onclick = cancelEdit;

    submitBtn.parentElement.appendChild(cancelBtn);
}

/**
 * Exibe/oculta indicador de carregamento
 * @param {boolean} show - Se deve mostrar ou ocultar
 */
function showLoading(show) {
    const tableBody = document.getElementById("adminTableBody");
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
    notification.style.cssText = "top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
    notification.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert">
            <span>&times;</span>
        </button>
    `;

    document.body.appendChild(notification);

    // Auto-remover após 3 segundos
    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => notification.remove(), 150);
    }, 3000);
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
window.deleteAdmin = deleteAdmin;
window.editAdmin = editAdmin;
window.cancelEdit = cancelEdit;
