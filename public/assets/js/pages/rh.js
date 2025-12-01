
/* ========================================
   RH - Gerenciamento de Membros do RH
   ======================================== */

import { UsersClient } from '../../../client/client.js';

// Instância global do cliente de usuários
const usersClient = new UsersClient();

// Variável para controlar modo de edição
let editingUserId = null;

// Inicialização quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", async () => {
    await initRHPage();
});

/**
 * Inicializa a página de RH
 */
async function initRHPage() {
    // Carrega a lista de membros do RH
    await loadRHMembers();

    // Configura os event listeners
    setupEventListeners();
}

/**
 * Configura todos os event listeners da página
 */
function setupEventListeners() {
    // Formulário de cadastro/edição
    const rhForm = document.getElementById("rhForm");
    if (rhForm) {
        rhForm.addEventListener("submit", handleFormSubmit);
    }

    // Campo de busca
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keyup", handleSearch);
    }

    // Delegação de eventos para botões de ação na tabela
    const tableBody = document.getElementById("rhTableBody");
    if (tableBody) {
        tableBody.addEventListener("click", handleTableActions);
    }
}

/**
 * Carrega todos os membros do RH do backend
 */
async function loadRHMembers() {
    try {
        showLoading(true);
        
        // Usa endpoint otimizado para buscar apenas membros do RH
        let rhMembers;
        try {
            rhMembers = await usersClient.findByAccess("HR");
        } catch {
            // Fallback: busca todos e filtra localmente
            const users = await usersClient.findAll();
            rhMembers = users.filter(user => 
                user.levelAccess === "HR" || 
                user.levelAccess === "2" || 
                user.levelAccess === 2
            );
        }
        
        renderRHMembers(rhMembers);
    } catch (error) {
        console.error("Erro ao carregar membros do RH:", error);
        showNotification("Erro ao carregar membros do RH!", "danger");
    } finally {
        showLoading(false);
    }
}

/**
 * Renderiza a lista de membros do RH na tabela
 * @param {Array} members - Lista de membros do RH
 */
function renderRHMembers(members) {
    const tableBody = document.getElementById("rhTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (members.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i>
                    <p>Nenhum membro do RH cadastrado</p>
                </td>
            </tr>
        `;
        return;
    }

    members.forEach(member => {
        const tr = document.createElement("tr");
        tr.dataset.id = member.id_user || member.id;

        tr.innerHTML = `
            <td>${escapeHtml(member.name || "")}</td>
            <td>${escapeHtml(member.email || "")}</td>
            <td>${escapeHtml(member.area || "")}</td>
            <td>
                <button class="btn btn-info btn-sm btn-edit" data-id="${member.id_user || member.id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm btn-delete" data-id="${member.id_user || member.id}" title="Excluir">
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

    const rhData = {
        name,
        email,
        area,
        levelAccess: "HR" // Nível de acesso para RH (enum Kotlin)
    };

    try {
        if (editingUserId) {
            // Modo edição - atualiza o membro existente
            await usersClient.update(editingUserId, rhData);
            showNotification("Membro do RH atualizado com sucesso!", "success");
            cancelEdit();
        } else {
            // Modo criação - insere novo membro
            await usersClient.insert(rhData);
            showNotification("Membro do RH cadastrado com sucesso!", "success");
        }

        // Limpa o formulário e recarrega a lista
        clearForm();
        await loadRHMembers();
    } catch (error) {
        console.error("Erro ao salvar membro do RH:", error);
        showNotification("Erro ao salvar membro do RH!", "danger");
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
        await editRHMember(id);
    } else if (target.classList.contains("btn-delete")) {
        await deleteRHMember(id);
    }
}

/**
 * Carrega dados do membro do RH para edição
 * @param {string|number} id - ID do membro
 */
async function editRHMember(id) {
    try {
        const member = await usersClient.findById(id);

        document.getElementById("name").value = member.name || "";
        document.getElementById("email").value = member.email || "";
        document.getElementById("area").value = member.area || "";

        editingUserId = id;

        // Muda o botão para modo de edição
        const submitBtn = document.getElementById("addRHBtn");
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-check"></i>';
            submitBtn.classList.remove("btn-primary");
            submitBtn.classList.add("btn-success");
        }

        // Adiciona botão de cancelar se não existir
        addCancelButton();

        showNotification("Dados carregados para edição!", "info");
    } catch (error) {
        console.error("Erro ao carregar membro do RH:", error);
        showNotification("Erro ao carregar dados do membro do RH!", "danger");
    }
}

/**
 * Exclui um membro do RH
 * @param {string|number} id - ID do membro
 */
async function deleteRHMember(id) {
    if (!confirm("Tem certeza que deseja excluir este membro do RH?")) {
        return;
    }

    try {
        await usersClient.delete(id);
        showNotification("Membro do RH excluído com sucesso!", "success");
        await loadRHMembers();
    } catch (error) {
        console.error("Erro ao excluir membro do RH:", error);
        showNotification("Erro ao excluir membro do RH!", "danger");
    }
}

/**
 * Manipula a busca de membros do RH
 * @param {Event} e - Evento de keyup
 */
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll("#rhTableBody tr");

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? "" : "none";
    });
}

/**
 * Limpa o formulário
 */
function clearForm() {
    document.getElementById("rhForm").reset();
    editingUserId = null;
}

/**
 * Cancela o modo de edição
 */
function cancelEdit() {
    clearForm();

    const submitBtn = document.getElementById("addRHBtn");
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

    const submitBtn = document.getElementById("addRHBtn");
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
    const tableBody = document.getElementById("rhTableBody");
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
window.deleteRHMember = deleteRHMember;
window.editRHMember = editRHMember;
window.cancelEdit = cancelEdit;


