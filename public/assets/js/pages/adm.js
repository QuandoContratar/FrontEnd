
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

    // Validação
    if (!name || !email || !area) {
        showNotification("Preencha todos os campos!", "warning");
        return;
    }

    if (!isValidEmail(email)) {
        showNotification("E-mail inválido!", "warning");
        return;
    }

    const adminData = {
        name,
        email,
        area,
        levelAccess: "ADMIN" // Nível de acesso para administrador (enum Kotlin)
    };

    try {
        if (editingUserId) {
            // Modo edição - atualiza o administrador existente
            await usersClient.update(editingUserId, adminData);
            showNotification("Administrador atualizado com sucesso!", "success");
            cancelEdit();
        } else {
            // Modo criação - insere novo administrador
            await usersClient.insert(adminData);
            showNotification("Administrador cadastrado com sucesso!", "success");
        }

        // Limpa o formulário e recarrega a lista
        clearForm();
        await loadAdmins();
    } catch (error) {
        console.error("Erro ao salvar administrador:", error);
        showNotification("Erro ao salvar administrador!", "danger");
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

        editingUserId = id;

        // Muda o botão para modo de edição
        const submitBtn = document.getElementById("addAdminBtn");
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-check"></i>';
            submitBtn.classList.remove("btn-primary");
            submitBtn.classList.add("btn-success");
        }

        // Adiciona botão de cancelar se não existir
        addCancelButton();

        showNotification("Dados carregados para edição!", "info");
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

// Exporta funções para uso global (se necessário)
window.deleteAdmin = deleteAdmin;
window.editAdmin = editAdmin;
window.cancelEdit = cancelEdit;
