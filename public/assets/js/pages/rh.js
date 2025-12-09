
/* ========================================
   RH - Gerenciamento de Membros do RH e Aprovação de Vagas
   ======================================== */

import { UsersClient, OpeningRequestClient, VacanciesClient } from '../../../client/client.js';

// Instâncias globais dos clientes
const usersClient = new UsersClient();
const openingRequestClient = new OpeningRequestClient();
const vacanciesClient = new VacanciesClient();

// Variável para controlar modo de edição
let editingUserId = null;

// Estado para aprovações
let pendingRequests = [];
let pendingVacancies = [];
let approvedVacancies = [];
let rejectedVacancies = [];

// Verificar se o usuário é admin ou RH (apenas admin e RH podem gerenciar RH)
let isAdmin = false;
let isHR = false;

// Inicialização quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", async () => {
    // Verificar permissão do usuário - apenas ADMIN e RH podem gerenciar RH
    const waitForUtils = () => {
        if (window.Utils && typeof window.Utils.normalizeLevelAccess === 'function') {
            try {
                const userLoggedStr = localStorage.getItem('userLogged') || localStorage.getItem('currentUser');
                if (userLoggedStr) {
                    const user = JSON.parse(userLoggedStr);
                    const userLevel = window.Utils.normalizeLevelAccess(user.levelAccess || user.level_access);
                    isAdmin = userLevel === 'ADMIN';
                    isHR = userLevel === 'HR';
                    
                    if (!isAdmin && !isHR) {
                        // Bloquear acesso de gestores
                        const UtilsRef = window.Utils || Utils;
                        if (UtilsRef && typeof UtilsRef.showMessage === 'function') {
                            UtilsRef.showMessage('Apenas administradores e RH podem gerenciar membros do RH.', 'error');
                        } else {
                            alert('Apenas administradores e RH podem gerenciar membros do RH.');
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
            initRHPage();
        } else {
            setTimeout(waitForUtils, 50);
        }
    };
    waitForUtils();
});

/**
 * Inicializa a página de RH
 */
async function initRHPage() {
    // Se o usuário for RH (mas não Admin), ele NÃO deve ver a lista de membros do RH.
    // Nesse caso, escondemos a aba de "Membros do RH" e exibimos uma mensagem informativa,
    // além de ativar a aba de Aprovações.
    if (isHR && !isAdmin) {
        const membersTab = document.getElementById('members-tab');
        const membersPane = document.getElementById('members');
        if (membersTab) membersTab.style.display = 'none';
        if (membersPane) {
            membersPane.innerHTML = `
                <div class="alert alert-info" role="alert">
                    Acesso restrito: apenas administradores podem ver a lista de membros do RH.
                </div>
            `;
        }

        // Ativa a aba de Aprovações se existir
        const approvalsTab = document.getElementById('approvals-tab');
        if (approvalsTab) {
            try { $(approvalsTab).tab('show'); } catch (e) { /* fallback silencioso */ }
        }
    } else {
        // Carrega a lista de membros do RH (visível apenas para Admins)
        await loadRHMembers();
    }

    // Configura os event listeners
    setupEventListeners();

    // Configura listeners para as tabs
    setupTabsListeners();
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

    // Campo de busca de membros
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keyup", handleSearch);
    }

    // Campo de busca de aprovações (pendentes)
    const searchApprovalsInput = document.getElementById("searchApprovalsInput");
    if (searchApprovalsInput) {
        searchApprovalsInput.addEventListener("keyup", handleApprovalsSearch);
    }

    // Campo de busca de aprovadas
    const searchApprovedInput = document.getElementById("searchApprovedInput");
    if (searchApprovedInput) {
        searchApprovedInput.addEventListener("keyup", handleApprovedSearch);
    }

    // Campo de busca de rejeitadas
    const searchRejectedInput = document.getElementById("searchRejectedInput");
    if (searchRejectedInput) {
        searchRejectedInput.addEventListener("keyup", handleRejectedSearch);
    }

    // Botão de recarregar aprovações - agora recarrega TODAS as listas
    const refreshApprovalsBtn = document.getElementById("refreshApprovalsBtn");
    if (refreshApprovalsBtn) {
        refreshApprovalsBtn.addEventListener("click", async () => {
            console.log('🔄 [RH] Recarregando todas as listas de vagas...');
            await loadAllVacancyLists();
        });
    }

    // Delegação de eventos para botões de ação na tabela de membros
    const tableBody = document.getElementById("rhTableBody");
    if (tableBody) {
        tableBody.addEventListener("click", handleTableActions);
    }

    // Delegação de eventos para botões de ação na tabela de aprovações
    const approvalsTableBody = document.getElementById("approvalsTableBody");
    if (approvalsTableBody) {
        approvalsTableBody.addEventListener("click", handleApprovalsActions);
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
 * Configura listeners para as tabs
 */
function setupTabsListeners() {
    // Quando a tab de aprovações é ativada, carrega TODAS as listas de vagas
    const approvalsTab = document.getElementById('approvals-tab');
    if (approvalsTab) {
        // Bootstrap 4 usa 'show.bs.tab' ou evento jQuery
        $(approvalsTab).on('shown.bs.tab', async () => {
            console.log('📋 [RH] Tab de aprovações ativada, carregando todas as listas de vagas...');
            await loadAllVacancyLists();
        });
    }
}

/**
 * Carrega todas as listas de vagas (pendentes, aprovadas, rejeitadas)
 */
async function loadAllVacancyLists() {
    console.log('🔄 [RH] ========== CARREGANDO TODAS AS LISTAS DE VAGAS ==========');
    
    // Carrega as 3 listas em paralelo para maior performance
    await Promise.all([
        loadPendingVacancies(),
        loadApprovedVacancies(),
        loadRejectedVacancies()
    ]);
    
    console.log('✅ [RH] ========== TODAS AS LISTAS CARREGADAS ==========');
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
                <td colspan="3" class="text-center text-muted">
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

    // Verificar se é admin ou RH antes de permitir criar/editar
    if (!isAdmin && !isHR) {
        showNotification("Apenas administradores e RH podem criar ou editar membros do RH!", "error");
        return;
    }

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const changePasswordCheckbox = document.getElementById("changePasswordCheckbox");

    // Validação básica
    if (!name || !email) {
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

    // Prepara dados do RH
    const rhData = {};
    
    // Campos básicos sempre enviados
    if (name && name.trim()) rhData.name = name.trim();
    if (email && email.trim()) rhData.email = email.trim();
    
    // levelAccess só é enviado na criação
    // IMPORTANTE: RH só pode criar gestores (MANAGER), não pode criar ADMIN, HR ou MANAGER
    if (!editingUserId) {
        // Verificar se o usuário logado é RH tentando criar outro tipo de usuário
        try {
            const userLoggedStr = localStorage.getItem('userLogged') || localStorage.getItem('currentUser');
            if (userLoggedStr) {
                const currentUser = JSON.parse(userLoggedStr);
                const UtilsRef = window.Utils || Utils;
                
                if (UtilsRef && typeof UtilsRef.normalizeLevelAccess === 'function') {
                    const currentUserLevel = UtilsRef.normalizeLevelAccess(currentUser.levelAccess || currentUser.level_access);
                    
                    // Se o usuário logado é RH, só pode criar MANAGER
                    if (currentUserLevel === 'HR') {
                        // Forçar criação apenas de gestores
                        rhData.levelAccess = "MANAGER";
                        console.log('✅ [RH] Criando apenas gestor (RH não pode criar ADMIN, HR ou MANAGER)');
                    } else {
                        // Se for ADMIN, pode criar qualquer tipo (comportamento padrão)
                        rhData.levelAccess = "HR"; // Enum apenas na criação
                    }
                } else {
                    // Fallback: verificação direta
                    const levelAccess = String(currentUser.levelAccess || currentUser.level_access || '').toUpperCase();
                    if (levelAccess === 'HR' || levelAccess === '2') {
                        rhData.levelAccess = "MANAGER";
                        console.log('✅ [RH] Criando apenas gestor (fallback)');
                    } else {
                        rhData.levelAccess = "HR";
                    }
                }
            } else {
                // Fallback: criar como HR (comportamento padrão)
                rhData.levelAccess = "HR";
            }
        } catch (error) {
            console.error('Erro ao verificar permissão:', error);
            // Fallback seguro: criar como HR
            rhData.levelAccess = "HR";
        }
    }
    
    // Adiciona senha apenas se:
    // 1. É novo cadastro (sempre obrigatória)
    // 2. Está editando E checkbox marcado (senha será atualizada)
    if (!editingUserId) {
        // Modo criação - senha obrigatória
        if (password && password.trim()) {
            rhData.password = password.trim();
        }
    } else if (changePasswordCheckbox && changePasswordCheckbox.checked && password && password.trim().length > 0) {
        // Modo edição - se checkbox está marcado, atualiza a senha
        rhData.password = password.trim();
    }

    try {
        if (editingUserId) {
            // Modo edição - atualiza o membro existente
            await usersClient.updateUser(editingUserId, rhData);
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
    // Verificar se é admin ou RH antes de permitir editar
    if (!isAdmin && !isHR) {
        showNotification("Apenas administradores e RH podem editar membros do RH!", "error");
        return;
    }

    try {
        const member = await usersClient.findById(id);

        document.getElementById("name").value = member.name || "";
        document.getElementById("email").value = member.email || "";
        // `area` field removed from the form; nothing to populate here
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
    // Verificar se é admin ou RH antes de permitir excluir
    if (!isAdmin && !isHR) {
        showNotification("Apenas administradores e RH podem excluir membros do RH!", "error");
        return;
    }

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

/**
 * Carrega solicitações pendentes de aprovação (status ENTRADA)
 */
async function loadPendingRequests() {
    try {
        showApprovalsLoading(true);
        
        console.log('🔍 [RH] Buscando solicitações com status ENTRADA...');
        console.log('🔍 [RH] URL base:', openingRequestClient.url);
        console.log('🔍 [RH] Endpoint completo:', `${openingRequestClient.url}/status/ENTRADA`);
        
        // Tenta buscar por status primeiro
        try {
            const response = await fetch(`${openingRequestClient.url}/status/ENTRADA`);
            console.log('📡 [RH] Resposta do servidor:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ [RH] Erro na resposta:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            console.log('✅ [RH] Dados recebidos:', data);
            console.log('✅ [RH] Tipo dos dados:', typeof data, Array.isArray(data));
            
            pendingRequests = Array.isArray(data) ? data : (data ? [data] : []);
            console.log('✅ [RH] Solicitações encontradas via findByStatus:', pendingRequests.length);
        } catch (statusError) {
            console.warn('⚠️ [RH] Erro ao buscar por status, tentando fallback:', statusError);
            console.warn('⚠️ [RH] Detalhes do erro:', statusError.message, statusError.stack);
            
            // Fallback: busca todas as solicitações e filtra por status
            try {
                console.log('🔄 [RH] Tentando buscar todas as solicitações...');
                const allRequests = await openingRequestClient.findAll();
                console.log('📋 [RH] Todas as solicitações recebidas:', allRequests);
                console.log('📋 [RH] Tipo:', typeof allRequests, Array.isArray(allRequests));
                
                // Garante que seja array
                const requestsArray = Array.isArray(allRequests) ? allRequests : (allRequests ? [allRequests] : []);
                console.log('📋 [RH] Total de solicitações:', requestsArray.length);
                
                // Filtra por status ENTRADA (tenta diferentes formatos)
                pendingRequests = requestsArray.filter(req => {
                    const status = req.status || req.statusRequest || req.status_request || '';
                    const statusUpper = String(status).toUpperCase();
                    const isEntrada = statusUpper === 'ENTRADA' || statusUpper === 'ENTRADA' || statusUpper === 'PENDENTE';
                    
                    console.log(`🔍 [RH] Verificando solicitação ID ${req.id || req.id_opening_request || 'N/A'}: status="${status}" (${statusUpper}), isEntrada=${isEntrada}`);
                    
                    return isEntrada;
                });
                
                console.log('✅ [RH] Solicitações filtradas (ENTRADA):', pendingRequests.length);
                console.log('✅ [RH] IDs encontrados:', pendingRequests.map(r => r.id || r.id_opening_request));
            } catch (fallbackError) {
                console.error('❌ [RH] Erro no fallback:', fallbackError);
                console.error('❌ [RH] Detalhes:', fallbackError.message, fallbackError.stack);
                pendingRequests = [];
            }
        }
        
        // Garante que seja array
        if (!Array.isArray(pendingRequests)) {
            console.warn('⚠️ [RH] pendingRequests não é array, convertendo...', pendingRequests);
            pendingRequests = pendingRequests ? [pendingRequests] : [];
        }
        
        console.log(`✅ [RH] Total de solicitações pendentes: ${pendingRequests.length}`);
        if (pendingRequests.length > 0) {
            console.log('✅ [RH] Primeira solicitação:', pendingRequests[0]);
        }
        
        renderPendingRequests(pendingRequests);
        updatePendingCount();
        
        if (pendingRequests.length === 0) {
            showNotification("Nenhuma solicitação pendente encontrada. Verifique se há solicitações com status 'ENTRADA' no banco de dados.", "info");
        }
    } catch (error) {
        console.error("❌ [RH] Erro geral ao carregar solicitações pendentes:", error);
        console.error("❌ [RH] Stack trace:", error.stack);
        showNotification(`Erro ao carregar solicitações pendentes! ${error.message || 'Verifique o console para mais detalhes.'}`, "danger");
        pendingRequests = [];
        renderPendingRequests([]);
    } finally {
        showApprovalsLoading(false);
    }
}

/**
 * Resolve o ID da vaga a partir de múltiplos campos possíveis
 * @param {Object} vacancy - Objeto da vaga
 * @returns {string|number|null} - ID da vaga ou null
 */
function resolveVacancyId(vacancy) {
    return vacancy.id_vacancy ||
           vacancy.idVacancy ||
           vacancy.id ||
           vacancy.vacancyId ||
           vacancy.id_vaga ||
           vacancy.vagaId ||
           null;
}

/**
 * Carrega vagas pendentes de aprovação (status pendente_aprovacao)
 * GET /vacancies/pendingVacancies ou /vacancies/status/pendente_aprovacao
 */
async function loadPendingVacancies() {
    try {
        showApprovalsLoading(true);
        
        console.log('🔍 [RH] Buscando vagas pendentes de aprovação...');
        
        const data = await vacanciesClient.getPendingVacancies();
        
        pendingVacancies = Array.isArray(data) ? data : (data ? [data] : []);
        console.log(`✅ [RH] Total de vagas pendentes: ${pendingVacancies.length}`);
        
        // Log detalhado dos IDs para debug
        pendingVacancies.forEach((v, i) => {
            const id = resolveVacancyId(v);
            const cargo = v.position || v.position_job || v.positionJob || v.cargo;
            console.log(`📋 [RH] Vaga ${i + 1}: ID=${id}, Cargo=${cargo}`, v);
            if (!id) {
                console.warn(`⚠️ [RH] Vaga ${i + 1} sem ID! Campos disponíveis:`, Object.keys(v));
            }
        });
        
        renderPendingVacancies(pendingVacancies);
        updatePendingCount();
        
        if (pendingVacancies.length === 0) {
            showNotification("Nenhuma vaga pendente de aprovação.", "info");
        }
    } catch (error) {
        console.error("❌ [RH] Erro ao carregar vagas pendentes:", error);
        showNotification(`Erro ao carregar vagas pendentes! ${error.message || ''}`, "danger");
        pendingVacancies = [];
        renderPendingVacancies([]);
    } finally {
        showApprovalsLoading(false);
    }
}

/**
 * Renderiza a lista de vagas pendentes na tabela
 * @param {Array} vacancies - Lista de vagas
 */
function renderPendingVacancies(vacancies) {
    const tableBody = document.getElementById("approvalsTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (vacancies.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i>
                    <p>Nenhuma vaga pendente de aprovação</p>
                </td>
            </tr>
        `;
        return;
    }

    vacancies.forEach((vacancy, index) => {
        console.log(`🎨 [RH] Renderizando vaga ${index + 1}:`, vacancy);
        
        const tr = document.createElement("tr");
        const vacancyId = resolveVacancyId(vacancy);
        
        // Aviso se ID não foi encontrado
        if (!vacancyId) {
            console.warn(`⚠️ [RH] Vaga ${index + 1} sem ID válido! Botão de aprovar não funcionará.`);
        }
        
        tr.dataset.id = vacancyId || '';



        // Extrai dados da vaga (backend retorna 'position' ao invés de 'position_job')
        const gestorName = vacancy.manager?.name || vacancy.gestor?.name || vacancy.managerName || 'N/A';
        const cargo = vacancy.position || vacancy.position_job || vacancy.positionJob || vacancy.cargo || 'N/A';
        // Área fixada para aprovações: sempre 'TI'
        const area = 'TI';
        const periodo = vacancy.period || vacancy.periodo || 'N/A';
        const modelo = vacancy.workModel || vacancy.work_model || vacancy.modelo_trabalho || 'N/A';
        const regime = vacancy.contractType || vacancy.contract_type || vacancy.regime_contratacao || 'N/A';
        
        // Formata salário
        let salarioFormatado = 'N/A';
        const salarioValue = vacancy.salary || vacancy.salario;
        if (salarioValue) {
            try {
                salarioFormatado = new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                }).format(Number(salarioValue));
            } catch (e) {
                salarioFormatado = `R$ ${salarioValue}`;
            }
        }
        
        const localidade = vacancy.location || vacancy.localidade || 'N/A';
        const status = vacancy.statusVacancy || vacancy.status_vacancy || vacancy.status || 'pendente_aprovacao';

        tr.innerHTML = `
            <td>${escapeHtml(gestorName)}</td>
            <td>${escapeHtml(cargo)}</td>
            <td>${escapeHtml(area)}</td>
            <td>${escapeHtml(periodo)}</td>
            <td>${escapeHtml(modelo)}</td>
            <td>${escapeHtml(regime)}</td>
            <td>${salarioFormatado}</td>
            <td>${escapeHtml(localidade)}</td>
            <td>${getVacancyStatusBadge(status)}</td>
            <td>
                <button class="btn btn-success btn-sm approve-btn" data-id="${vacancyId}" title="Aprovar Vaga">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-danger btn-sm reject-btn ml-1" data-id="${vacancyId}" title="Rejeitar Vaga">
                    <i class="fas fa-times"></i>
                </button>
                <button class="btn btn-info btn-sm view-vacancy-btn ml-1" data-id="${vacancyId}" title="Ver Detalhes">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;

        tableBody.appendChild(tr);
    });
}

/**
 * ========================================
 * SEÇÃO: VAGAS APROVADAS (status = 'aberta')
 * ========================================
 */

/**
 * Carrega vagas aprovadas (status = 'aberta')
 * GET /vacancies/status/aberta
 */
async function loadApprovedVacancies() {
    try {
        console.log('🔍 [RH] Buscando vagas APROVADAS (status=aberta)...');
        
        const data = await vacanciesClient.getApprovedVacancies();
        
        approvedVacancies = Array.isArray(data) ? data : (data ? [data] : []);
        console.log(`✅ [RH] Total de vagas aprovadas: ${approvedVacancies.length}`);
        
        // Log detalhado para debug
        approvedVacancies.forEach((v, i) => {
            const id = resolveVacancyId(v);
            const cargo = v.position || v.position_job || v.positionJob || v.cargo;
            console.log(`📗 [RH] Vaga Aprovada ${i + 1}: ID=${id}, Cargo=${cargo}`);
        });
        
        renderApprovedVacancies(approvedVacancies);
        updateApprovedCount();
        
    } catch (error) {
        console.error("❌ [RH] Erro ao carregar vagas aprovadas:", error);
        approvedVacancies = [];
        renderApprovedVacancies([]);
    }
}

/**
 * Renderiza a lista de vagas aprovadas na tabela
 * @param {Array} vacancies - Lista de vagas aprovadas
 */
function renderApprovedVacancies(vacancies) {
    const tableBody = document.getElementById("approvedVacanciesTableBody");
    if (!tableBody) {
        console.warn('⚠️ [RH] Elemento approvedVacanciesTableBody não encontrado');
        return;
    }

    tableBody.innerHTML = "";

    if (vacancies.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">
                    <i class="fas fa-check-circle fa-2x mb-2 text-success"></i>
                    <p>Nenhuma vaga aprovada no momento</p>
                </td>
            </tr>
        `;
        return;
    }

    vacancies.forEach((vacancy, index) => {
        const tr = document.createElement("tr");
        const vacancyId = resolveVacancyId(vacancy);
        tr.dataset.id = vacancyId || '';

        // Extrai dados da vaga
        const gestorName = vacancy.manager?.name || vacancy.gestor?.name || vacancy.managerName || 'N/A';
        const cargo = vacancy.position || vacancy.position_job || vacancy.positionJob || vacancy.cargo || 'N/A';
        // Área fixada para vagas aprovadas: sempre 'TI'
        const area = 'TI';
        const modelo = vacancy.workModel || vacancy.work_model || vacancy.modelo_trabalho || 'N/A';
        const regime = vacancy.contractType || vacancy.contract_type || vacancy.regime_contratacao || 'N/A';
        
        // Formata salário
        let salarioFormatado = 'N/A';
        const salarioValue = vacancy.salary || vacancy.salario;
        if (salarioValue) {
            try {
                salarioFormatado = new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                }).format(Number(salarioValue));
            } catch (e) {
                salarioFormatado = `R$ ${salarioValue}`;
            }
        }
        
        const localidade = vacancy.location || vacancy.localidade || 'N/A';
        const status = vacancy.statusVacancy || vacancy.status_vacancy || vacancy.status || 'aberta';

        tr.innerHTML = `
            <td><strong>${vacancyId || '-'}</strong></td>
            <td>${escapeHtml(cargo)}</td>
            <td>${escapeHtml(area)}</td>
            <td>${escapeHtml(modelo)}</td>
            <td>${escapeHtml(regime)}</td>
            <td>${salarioFormatado}</td>
            <td>${escapeHtml(localidade)}</td>
            <td>${escapeHtml(gestorName)}</td>
            <td>${getVacancyStatusBadge(status)}</td>
        `;

        tableBody.appendChild(tr);
    });
}

/**
 * Atualiza contador de vagas aprovadas
 */
function updateApprovedCount() {
    const countBadge = document.getElementById("approvedVacanciesCount");
    if (countBadge) {
        countBadge.textContent = approvedVacancies.length;
    }
}

/**
 * ========================================
 * SEÇÃO: VAGAS REJEITADAS (status = 'rejeitada')
 * ========================================
 */

/**
 * Carrega vagas rejeitadas (status = 'rejeitada')
 * GET /vacancies/status/rejeitada
 */
async function loadRejectedVacancies() {
    try {
        console.log('🔍 [RH] Buscando vagas REJEITADAS (status=rejeitada)...');
        
        const data = await vacanciesClient.getRejectedVacancies();
        
        rejectedVacancies = Array.isArray(data) ? data : (data ? [data] : []);
        console.log(`✅ [RH] Total de vagas rejeitadas: ${rejectedVacancies.length}`);
        
        // Log detalhado para debug
        rejectedVacancies.forEach((v, i) => {
            const id = resolveVacancyId(v);
            const cargo = v.position || v.position_job || v.positionJob || v.cargo;
            console.log(`📕 [RH] Vaga Rejeitada ${i + 1}: ID=${id}, Cargo=${cargo}`);
        });
        
        renderRejectedVacancies(rejectedVacancies);
        updateRejectedCount();
        
    } catch (error) {
        console.error("❌ [RH] Erro ao carregar vagas rejeitadas:", error);
        rejectedVacancies = [];
        renderRejectedVacancies([]);
    }
}

/**
 * Renderiza a lista de vagas rejeitadas na tabela
 * @param {Array} vacancies - Lista de vagas rejeitadas
 */
function renderRejectedVacancies(vacancies) {
    const tableBody = document.getElementById("rejectedVacanciesTableBody");
    if (!tableBody) {
        console.warn('⚠️ [RH] Elemento rejectedVacanciesTableBody não encontrado');
        return;
    }

    tableBody.innerHTML = "";

    if (vacancies.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted">
                    <i class="fas fa-times-circle fa-2x mb-2 text-danger"></i>
                    <p>Nenhuma vaga rejeitada no momento</p>
                </td>
            </tr>
        `;
        return;
    }

    vacancies.forEach((vacancy, index) => {
        const tr = document.createElement("tr");
        const vacancyId = resolveVacancyId(vacancy);
        tr.dataset.id = vacancyId || '';

        // Extrai dados da vaga
        const gestorName = vacancy.manager?.name || vacancy.gestor?.name || vacancy.managerName || 'N/A';
        const cargo = vacancy.position || vacancy.position_job || vacancy.positionJob || vacancy.cargo || 'N/A';
        // Área fixada para vagas rejeitadas: sempre 'TI'
        const area = 'TI';
        const modelo = vacancy.workModel || vacancy.work_model || vacancy.modelo_trabalho || 'N/A';
        const regime = vacancy.contractType || vacancy.contract_type || vacancy.regime_contratacao || 'N/A';
        
        // Formata salário
        let salarioFormatado = 'N/A';
        const salarioValue = vacancy.salary || vacancy.salario;
        if (salarioValue) {
            try {
                salarioFormatado = new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                }).format(Number(salarioValue));
            } catch (e) {
                salarioFormatado = `R$ ${salarioValue}`;
            }
        }
        
        const localidade = vacancy.location || vacancy.localidade || 'N/A';
        const status = vacancy.statusVacancy || vacancy.status_vacancy || vacancy.status || 'rejeitada';

        tr.innerHTML = `
            <td><strong>${vacancyId || '-'}</strong></td>
            <td>${escapeHtml(cargo)}</td>
            <td>${escapeHtml(area)}</td>
            <td>${escapeHtml(modelo)}</td>
            <td>${escapeHtml(regime)}</td>
            <td>${salarioFormatado}</td>
            <td>${escapeHtml(localidade)}</td>
            <td>${escapeHtml(gestorName)}</td>
            <td>${getVacancyStatusBadge(status)}</td>
        `;

        tableBody.appendChild(tr);
    });
}

/**
 * Atualiza contador de vagas rejeitadas
 */
function updateRejectedCount() {
    const countBadge = document.getElementById("rejectedVacanciesCount");
    if (countBadge) {
        countBadge.textContent = rejectedVacancies.length;
    }
}

/**
 * ========================================
 * SEÇÃO: FUNÇÕES DE BUSCA
 * ========================================
 */

/**
 * Manipula busca na tabela de vagas aprovadas
 * @param {Event} e - Evento de keyup
 */
function handleApprovedSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll("#approvedVacanciesTableBody tr");

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? "" : "none";
    });
}

/**
 * Manipula busca na tabela de vagas rejeitadas
 * @param {Event} e - Evento de keyup
 */
function handleRejectedSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll("#rejectedVacanciesTableBody tr");

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? "" : "none";
    });
}

/**
 * Retorna badge de status para vagas
 * @param {string} status - Status da vaga
 */
function getVacancyStatusBadge(status) {
    const statusMap = {
        'pendente_aprovacao': { class: 'badge-warning', text: 'Pendente' },
        'aberta': { class: 'badge-success', text: 'Aberta' },
        'fechada': { class: 'badge-secondary', text: 'Fechada' },
        'cancelada': { class: 'badge-danger', text: 'Cancelada' },
        'rejeitada': { class: 'badge-danger', text: 'Rejeitada' }
    };

    const statusLower = String(status || '').toLowerCase();
    const statusInfo = statusMap[statusLower] || { class: 'badge-secondary', text: status || 'N/A' };
    return `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

/**
 * Visualiza detalhes de uma vaga
 * @param {string|number} id - ID da vaga
 */
function viewVacancyDetails(id) {
    const vacancy = pendingVacancies.find(v => {
        const vId = resolveVacancyId(v);
        return vId == id;
    });
    
    if (!vacancy) {
        showNotification("Vaga não encontrada!", "warning");
        return;
    }

    // Resolve o ID novamente para garantir
    const vacancyId = resolveVacancyId(vacancy);

    // Formata salário
    let salarioFormatado = 'N/A';
    const salarioValue = vacancy.salary || vacancy.salario;
    if (salarioValue) {
        try {
            salarioFormatado = new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            }).format(Number(salarioValue));
        } catch (e) {
            salarioFormatado = `R$ ${salarioValue}`;
        }
    }

    const detalhes = `
        <strong>ID da Vaga:</strong> ${vacancyId || 'N/A'}<br>
        <strong>Gestor:</strong> ${vacancy.manager?.name || vacancy.gestor?.name || vacancy.managerName || 'N/A'}<br>
        <strong>Cargo:</strong> ${vacancy.position || vacancy.position_job || vacancy.positionJob || 'N/A'}<br>
        ${vacancy.area && String(vacancy.area).toUpperCase() !== 'N/A' ? `<strong>Área:</strong> ${vacancy.area}<br>` : ''}
        <strong>Período:</strong> ${vacancy.period || vacancy.periodo || 'N/A'}<br>
        <strong>Modelo de Trabalho:</strong> ${vacancy.workModel || vacancy.work_model || 'N/A'}<br>
        <strong>Regime de Contratação:</strong> ${vacancy.contractType || vacancy.contract_type || 'N/A'}<br>
        <strong>Salário:</strong> ${salarioFormatado}<br>
        <strong>Localidade:</strong> ${vacancy.location || vacancy.localidade || 'N/A'}<br>
        <strong>Requisitos:</strong> ${vacancy.requirements || vacancy.requisitos || 'N/A'}<br>
        <strong>Justificativa:</strong> ${vacancy.openingJustification || vacancy.opening_justification || 'N/A'}
    `;

    // Remove modal anterior se existir
    const existingModal = document.getElementById('vacancyDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Botão de aprovar só aparece se tiver ID válido
    const approveButton = vacancyId 
        ? `<button type="button" class="btn btn-success" onclick="document.getElementById('vacancyDetailsModal').remove(); approveVacancy('${vacancyId}');">
               <i class="fas fa-check"></i> Aprovar
           </button>`
        : `<button type="button" class="btn btn-secondary" disabled title="ID da vaga não disponível">
               <i class="fas fa-check"></i> Aprovar (ID indisponível)
           </button>`;

    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'vacancyDetailsModal';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Detalhes da Vaga</h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    ${detalhes}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Fechar</button>
                    ${approveButton}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    $(modal).modal('show');
    
    $(modal).on('hidden.bs.modal', function() {
        this.remove();
    });
}

/**
 * Renderiza a lista de solicitações pendentes na tabela
 * @param {Array} requests - Lista de solicitações
 */
function renderPendingRequests(requests) {
    const tableBody = document.getElementById("approvalsTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (requests.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i>
                    <p>Nenhuma solicitação pendente de aprovação</p>
                </td>
            </tr>
        `;
        return;
    }

    requests.forEach((request, index) => {
        console.log(`🎨 [RH] Renderizando solicitação ${index + 1}:`, request);
        
        const tr = document.createElement("tr");
        const requestId = request.id || request.idOpeningRequest || request.id_opening_request;
        tr.dataset.id = requestId;

        // Extrai dados da solicitação - tenta múltiplos formatos possíveis
        const gestorName = request.gestor?.name || 
                          request.manager?.name || 
                          request.gestor_name ||
                          request.manager_name ||
                          (request.gestor_id ? `Gestor ID: ${request.gestor_id}` : 'N/A');
        
        const cargo = request.cargo || 
                     request.vacancy?.position_job || 
                     request.position_job || 
                     request.positionJob ||
                     'N/A';
        
        // Área fixada para solicitações/approvals: sempre 'TI'
        const area = 'TI';
        
        const periodo = request.periodo || 
                       request.vacancy?.period || 
                       request.period || 
                       'N/A';
        
        const modelo = request.modelo_trabalho || 
                      request.modelo_trabalho || 
                      request.vacancy?.work_model || 
                      request.workModel || 
                      request.work_model ||
                      'N/A';
        
        const regime = request.regime_contratacao || 
                      request.regime_contratacao || 
                      request.vacancy?.contract_type || 
                      request.contractType || 
                      request.contract_type ||
                      'N/A';
        
        const salario = request.salario || 
                       request.vacancy?.salary || 
                       request.salary || 
                       0;
        
        const localidade = request.localidade || 
                          request.vacancy?.location || 
                          request.location || 
                          'N/A';
        
        const data = request.created_at || 
                    request.createdAt || 
                    request.created ||
                    request.created_at_datetime ||
                    '';
        
        const status = request.status || 'ENTRADA';

        // Formata salário
        const salarioFormatado = salario ? 
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(salario)) : 
            'N/A';

        // Formata data
        const dataFormatada = data ? formatDate(data) : 'N/A';

        // Badge de status
        const statusBadge = getStatusBadge(status);

        tr.innerHTML = `
            <td>${escapeHtml(gestorName)}</td>
            <td>${escapeHtml(cargo)}</td>
            <td>${escapeHtml(area)}</td>
            <td>${escapeHtml(periodo)}</td>
            <td>${escapeHtml(modelo)}</td>
            <td>${escapeHtml(regime)}</td>
            <td>${salarioFormatado}</td>
            <td>${escapeHtml(localidade)}</td>
            <td>${dataFormatada}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-success btn-sm btn-approve" data-id="${requestId}" title="Aprovar">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-danger btn-sm btn-reject" data-id="${requestId}" title="Rejeitar">
                    <i class="fas fa-times"></i>
                </button>
                <button class="btn btn-info btn-sm btn-view" data-id="${requestId}" title="Ver detalhes">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;

        tableBody.appendChild(tr);
    });
}

/**
 * Retorna badge de status formatado
 * @param {string} status - Status da solicitação
 */
function getStatusBadge(status) {
    const statusMap = {
        'ENTRADA': { class: 'badge-warning', text: 'Pendente' },
        'ABERTA': { class: 'badge-primary', text: 'Aberta' },
        'APROVADA': { class: 'badge-success', text: 'Aprovada' },
        'REJEITADA': { class: 'badge-danger', text: 'Rejeitada' },
        'CANCELADA': { class: 'badge-secondary', text: 'Cancelada' }
    };

    const statusInfo = statusMap[status] || { class: 'badge-secondary', text: status || 'N/A' };
    return `<span class="badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

/**
 * Manipula ações na tabela de aprovações (aprovar/rejeitar/ver)
 * @param {Event} e - Evento de click
 */
async function handleApprovalsActions(e) {
    const target = e.target.closest("button");
    if (!target) return;

    const id = target.dataset.id;
    console.log('🔘 [RH] Botão clicado, ID:', id, 'Classes:', target.className);

    // Novos botões para vagas
    if (target.classList.contains("approve-btn")) {
        if (!id || id === 'undefined' || id === '') {
            showNotification('Erro: Esta vaga não possui ID. Verifique se o backend está retornando o campo id_vacancy.', 'danger');
            return;
        }
        await approveVacancy(id);
    } else if (target.classList.contains("reject-btn")) {
        if (!id || id === 'undefined' || id === '') {
            showNotification('Erro: Esta vaga não possui ID. Verifique se o backend está retornando o campo id_vacancy.', 'danger');
            return;
        }
        await rejectVacancy(id);
    } else if (target.classList.contains("view-vacancy-btn")) {
        viewVacancyDetails(id);
    }
    // Botões antigos para opening-requests (compatibilidade)
    else if (target.classList.contains("btn-approve")) {
        await approveRequest(id);
    } else if (target.classList.contains("btn-reject")) {
        await rejectRequest(id);
    } else if (target.classList.contains("btn-view")) {
        viewRequestDetails(id);
    }
}

/**
 * Aprova uma solicitação (altera status para APROVADA) - LEGADO
 * @param {string|number} id - ID da solicitação
 */
async function approveRequest(id) {
    if (!confirm("Tem certeza que deseja aprovar esta solicitação de abertura de vaga?")) {
        return;
    }

    try {
        console.log('✅ [RH] Aprovando solicitação ID:', id);
        await openingRequestClient.updateStatus(id, 'APROVADA');
        showNotification("Solicitação aprovada com sucesso!", "success");
        setTimeout(async () => {
            await loadPendingRequests();
        }, 500);
    } catch (error) {
        console.error("❌ [RH] Erro ao aprovar solicitação:", error);
        showNotification(`Erro ao aprovar solicitação! ${error.message || ''}`, "danger");
    }
}

/**
 * Aprova uma vaga (altera status para 'aberta')
 * PATCH /vacancies/updateStatus/{id}
 * @param {string|number} id - ID da vaga (id_vacancy)
 */
async function approveVacancy(id) {
    // Validação de ID
    if (!id || id === 'undefined' || id === 'null' || id === '') {
        console.error('❌ [RH] Tentativa de aprovar vaga sem ID válido:', id);
        showNotification('Erro: ID da vaga não encontrado. O backend pode não estar retornando o campo id_vacancy.', 'danger');
        return;
    }
    
    if (!confirm("Tem certeza que deseja aprovar esta vaga?")) {
        return;
    }

    try {
        console.log('✅ [RH] Aprovando vaga ID:', id);
        console.log('✅ [RH] Chamando PATCH /vacancies/updateStatus/' + id);
        
        const result = await vacanciesClient.approve(id);
        console.log('✅ [RH] Resultado da aprovação:', result);
        showNotification(result || "Vaga aprovada com sucesso!", "success");
        
        // Recarrega TODAS as listas de vagas (pendentes, aprovadas, rejeitadas)
        setTimeout(async () => {
            console.log('🔄 [RH] Recarregando todas as listas após aprovação...');
            await loadAllVacancyLists();
        }, 500);
    } catch (error) {
        console.error("❌ [RH] Erro ao aprovar vaga:", error);
        showNotification(`Erro ao aprovar vaga! ${error.message || ''}`, "danger");
    }
}

/**
 * Rejeita uma vaga (altera status para 'rejeitada')
 * PATCH /vacancies/{id}/status com body {"statusVacancy": "rejeitada"}
 * @param {string|number} id - ID da vaga (id_vacancy)
 */
async function rejectVacancy(id) {
    // Validação de ID
    if (!id || id === 'undefined' || id === 'null' || id === '') {
        console.error('❌ [RH] Tentativa de rejeitar vaga sem ID válido:', id);
        showNotification('Erro: ID da vaga não encontrado. O backend pode não estar retornando o campo id_vacancy.', 'danger');
        return;
    }
    
    if (!confirm("Tem certeza que deseja REJEITAR esta vaga? Esta ação não pode ser desfeita.")) {
        return;
    }

    try {
        console.log('🚫 [RH] Rejeitando vaga ID:', id);
        console.log('🚫 [RH] Chamando PATCH /vacancies/' + id + '/status');
        
        const result = await vacanciesClient.reject(id);
        console.log('🚫 [RH] Resultado da rejeição:', result);
        showNotification(result || "Vaga rejeitada com sucesso!", "success");
        
        // Recarrega TODAS as listas de vagas (pendentes, aprovadas, rejeitadas)
        setTimeout(async () => {
            console.log('🔄 [RH] Recarregando todas as listas após rejeição...');
            await loadAllVacancyLists();
        }, 500);
    } catch (error) {
        console.error("❌ [RH] Erro ao rejeitar vaga:", error);
        showNotification(`Erro ao rejeitar vaga! ${error.message || ''}`, "danger");
    }
}

/**
 * Rejeita uma solicitação (altera status para REJEITADA)
 * @param {string|number} id - ID da solicitação
 */
async function rejectRequest(id) {
    if (!confirm("Tem certeza que deseja rejeitar esta solicitação de abertura de vaga?")) {
        return;
    }

    try {
        console.log('❌ [RH] Rejeitando solicitação ID:', id);
        await openingRequestClient.updateStatus(id, 'REJEITADA');
        showNotification("Solicitação rejeitada com sucesso!", "success");
        // Aguarda um pouco antes de recarregar para garantir que o backend processou
        setTimeout(async () => {
            await loadPendingRequests();
        }, 500);
    } catch (error) {
        console.error("❌ [RH] Erro ao rejeitar solicitação:", error);
        console.error("❌ [RH] ID da solicitação:", id);
        showNotification(`Erro ao rejeitar solicitação! ${error.message || ''}`, "danger");
    }
}

/**
 * Visualiza detalhes de uma solicitação
 * @param {string|number} id - ID da solicitação
 */
function viewRequestDetails(id) {
    const request = pendingRequests.find(r => {
        const rId = r.id || r.idOpeningRequest || r.id_opening_request;
        return rId == id;
    });
    
    if (!request) {
        console.error('❌ [RH] Solicitação não encontrada com ID:', id);
        console.error('❌ [RH] Solicitações disponíveis:', pendingRequests.map(r => ({
            id: r.id,
            idOpeningRequest: r.idOpeningRequest,
            id_opening_request: r.id_opening_request
        })));
        showNotification("Solicitação não encontrada!", "warning");
        return;
    }

    // Monta mensagem com detalhes
    const detalhes = `
        <strong>Gestor:</strong> ${request.gestor?.name || request.manager?.name || 'N/A'}<br>
        <strong>Cargo:</strong> ${request.cargo || request.vacancy?.position_job || 'N/A'}<br>
        ${request.vacancy?.area || request.area ? `<strong>Área:</strong> ${request.vacancy?.area || request.area}<br>` : ''}
        <strong>Período:</strong> ${request.periodo || request.vacancy?.period || 'N/A'}<br>
        <strong>Modelo de Trabalho:</strong> ${request.modelo_trabalho || request.vacancy?.work_model || 'N/A'}<br>
        <strong>Regime de Contratação:</strong> ${request.regime_contratacao || request.vacancy?.contract_type || 'N/A'}<br>
        <strong>Salário:</strong> ${request.salario ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(request.salario)) : 'N/A'}<br>
        <strong>Localidade:</strong> ${request.localidade || request.vacancy?.location || 'N/A'}<br>
        <strong>Requisitos:</strong> ${request.requisitos || request.vacancy?.requirements || 'N/A'}<br>
        <strong>Data:</strong> ${request.created_at || request.createdAt || 'N/A'}
    `;

    // Cria modal simples para exibir detalhes
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'requestDetailsModal';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Detalhes da Solicitação</h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    ${detalhes}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Fechar</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    $(modal).modal('show');
    
    // Remove modal do DOM após fechar
    $(modal).on('hidden.bs.modal', function() {
        modal.remove();
    });
}

/**
 * Manipula busca de aprovações
 * @param {Event} e - Evento de keyup
 */
function handleApprovalsSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll("#approvalsTableBody tr");

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? "" : "none";
    });
}

/**
 * Atualiza contador de solicitações pendentes no badge
 */
/**
 * Atualiza contador de solicitações/vagas pendentes no badge (tab principal e seção)
 */
function updatePendingCount() {
    // Badge da tab "Aprovação de Vagas"
    const pendingCountBadge = document.getElementById('pendingCount');
    if (pendingCountBadge) {
        const count = pendingVacancies.length || pendingRequests.length;
        pendingCountBadge.textContent = count;
        pendingCountBadge.style.display = count > 0 ? 'inline-block' : 'none';
    }
    
    // Badge da seção de vagas pendentes
    const pendingVacanciesCountBadge = document.getElementById('pendingVacanciesCount');
    if (pendingVacanciesCountBadge) {
        pendingVacanciesCountBadge.textContent = pendingVacancies.length;
    }
}

/**
 * Exibe/oculta indicador de carregamento na tabela de aprovações
 * @param {boolean} show - Se deve mostrar ou ocultar
 */
function showApprovalsLoading(show) {
    const tableBody = document.getElementById("approvalsTableBody");
    if (!tableBody) return;

    if (show) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="sr-only">Carregando...</span>
                    </div>
                </td>
            </tr>
        `;
    }
}

/**
 * Formata data para exibição
 * @param {string} dateStr - String de data
 * @returns {string}
 */
function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
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
window.deleteRHMember = deleteRHMember;
window.editRHMember = editRHMember;
window.cancelEdit = cancelEdit;
window.loadPendingRequests = loadPendingRequests; // Para teste manual
window.loadPendingVacancies = loadPendingVacancies; // Para teste manual
window.loadApprovedVacancies = loadApprovedVacancies; // Para teste manual
window.loadRejectedVacancies = loadRejectedVacancies; // Para teste manual
window.loadAllVacancyLists = loadAllVacancyLists; // Para teste manual - carrega todas as listas
window.approveVacancy = approveVacancy; // Para uso no modal de detalhes
window.rejectVacancy = rejectVacancy; // Para uso no modal de detalhes
window.testApprovalsAPI = testApprovalsAPI; // Função de teste

/**
 * Função de teste para verificar a API de aprovações
 * Pode ser chamada no console do navegador: testApprovalsAPI()
 */
async function testApprovalsAPI() {
    console.log('🧪 [TESTE] Iniciando teste da API de aprovações...');
    
    try {
        // Teste 1: Buscar todas as solicitações
        console.log('🧪 [TESTE 1] Buscando todas as solicitações...');
        const all = await openingRequestClient.findAll();
        console.log('✅ [TESTE 1] Resultado:', all);
        console.log('✅ [TESTE 1] Total:', Array.isArray(all) ? all.length : 'Não é array');
        
        if (Array.isArray(all) && all.length > 0) {
            console.log('✅ [TESTE 1] Primeira solicitação:', all[0]);
            console.log('✅ [TESTE 1] Status da primeira:', all[0].status);
        }
        
        // Teste 2: Buscar por status ENTRADA
        console.log('🧪 [TESTE 2] Buscando por status ENTRADA...');
        try {
            const byStatus = await openingRequestClient.findByStatus('ENTRADA');
            console.log('✅ [TESTE 2] Resultado:', byStatus);
            console.log('✅ [TESTE 2] Total:', Array.isArray(byStatus) ? byStatus.length : 'Não é array');
        } catch (error) {
            console.error('❌ [TESTE 2] Erro:', error);
        }
        
        // Teste 3: Verificar URL
        console.log('🧪 [TESTE 3] URL base:', openingRequestClient.url);
        console.log('🧪 [TESTE 3] URL completa status:', `${openingRequestClient.url}/status/ENTRADA`);
        
        // Teste 4: Fetch direto
        console.log('🧪 [TESTE 4] Testando fetch direto...');
        const directResponse = await fetch(`${openingRequestClient.url}/status/ENTRADA`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        console.log('✅ [TESTE 4] Status:', directResponse.status, directResponse.statusText);
        if (directResponse.ok) {
            const directData = await directResponse.json();
            console.log('✅ [TESTE 4] Dados:', directData);
        } else {
            const errorText = await directResponse.text();
            console.error('❌ [TESTE 4] Erro:', errorText);
        }
        
        console.log('✅ [TESTE] Teste concluído!');
    } catch (error) {
        console.error('❌ [TESTE] Erro geral:', error);
    }
}


