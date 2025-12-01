
/* ========================================
   GERENTE - Gerenciamento de Gerentes
   ======================================== */

import { UsersClient } from '../../../client/client.js';

// Instância global do cliente de usuários
const usersClient = new UsersClient();

// Variável para controlar modo de edição
let editingUserId = null;

// Inicialização quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", async () => {
    await initGerentePage();
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
}

/**
 * Carrega todos os gerentes do backend
 */
async function loadGerentes() {
    try {
        showLoading(true);
        const users = await usersClient.findAll();
        
        // Filtra apenas gerentes (levelAccess = MANAGER do enum Kotlin)
        const gerentes = users.filter(user => 
            user.levelAccess === "MANAGER" || 
            user.levelAccess === "3" || 
            user.levelAccess === 3
        );
        
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

    const gerenteData = {
        name,
        email,
        area,
        levelAccess: "MANAGER" // Nível de acesso para Gerente (enum Kotlin)
    };

    try {
        const managerId = document.getElementById("managerId")?.value;
        
        if (managerId || editingUserId) {
            // Modo edição - atualiza o gerente existente
            const id = managerId || editingUserId;
            await usersClient.update(id, gerenteData);
            showNotification("Gerente atualizado com sucesso!", "success");
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
    try {
        const gerente = await usersClient.findById(id);

        document.getElementById("name").value = gerente.name || "";
        document.getElementById("email").value = gerente.email || "";
        document.getElementById("area").value = gerente.area || "";
        
        // Armazena o ID em campo hidden se existir
        const managerIdField = document.getElementById("managerId");
        if (managerIdField) {
            managerIdField.value = id;
        }
        
        editingUserId = id;

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

// Exporta funções para uso global (se necessário)
window.deleteGerente = deleteGerente;
window.editGerente = editGerente;
window.cancelEdit = cancelEdit;
