/* ========================================
   CONTROLE DE ACESSO POR NÍVEL
   ======================================== */

/**
 * Define as permissões de acesso para cada nível de usuário
 */
export const AccessPermissions = {
    ADMIN: {
        level: 'ADMIN',
        name: 'Administrador',
        permissions: {
            // Cadastros
            canManageAdmins: true,
            canManageManagers: true,
            canManageRH: true,
            
            // Recrutamento
            canCreateOpeningRequest: true,
            canViewAllOpeningRequests: true,
            canApproveOpeningRequests: true,
            canViewAllVacancies: true,
            canViewAllCandidates: true,
            canUploadResumes: true,
            canManageMatch: true,
            canManageRecruitmentKanban: true,
            canManageOpeningKanban: true,
            
            // Relatórios
            canViewReports: true,
            canViewCharts: true,
            canViewTables: true
        }
    },
    
    HR: {
        level: 'HR',
        name: 'Recursos Humanos',
        permissions: {
            // Cadastros
            canManageAdmins: false,
            canManageManagers: false,
            canManageRH: false,
            
            // Recrutamento
            canCreateOpeningRequest: false,
            canViewAllOpeningRequests: false,
            canApproveOpeningRequests: false,
            canViewAllVacancies: true, // Apenas vagas aprovadas
            canViewAllCandidates: true,
            canUploadResumes: true,
            canManageMatch: true,
            canManageRecruitmentKanban: true,
            canManageOpeningKanban: false, // Não pode aprovar/rejeitar
            
            // Relatórios
            canViewReports: true,
            canViewCharts: true,
            canViewTables: true
        }
    },
    
    MANAGER: {
        level: 'MANAGER',
        name: 'Gerente',
        permissions: {
            // Cadastros
            canManageAdmins: false,
            canManageManagers: false,
            canManageRH: false,
            
            // Recrutamento
            canCreateOpeningRequest: true,
            canViewAllOpeningRequests: false,
            canApproveOpeningRequests: false,
            canViewAllVacancies: true, // Apenas vagas aprovadas
            canViewAllCandidates: false, // Apenas candidatos das suas vagas
            canUploadResumes: false,
            canManageMatch: false,
            canManageRecruitmentKanban: false,
            canManageOpeningKanban: false,
            
            // Relatórios
            canViewReports: false,
            canViewCharts: false,
            canViewTables: false
        }
    }
};

/**
 * Classe para gerenciar controle de acesso
 */
export class AccessControl {
    constructor() {
        this.currentUser = this.getCurrentUser();
        this.permissions = this.getPermissions();
    }

    /**
     * Obtém o usuário atual do localStorage
     */
    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('currentUser');
            if (!userStr || userStr === 'null' || userStr === 'undefined') {
                return null;
            }
            const user = JSON.parse(userStr);
            // Verificar se o objeto tem dados válidos
            if (!user || typeof user !== 'object') {
                return null;
            }
            return user;
        } catch (error) {
            console.error('Erro ao obter usuário atual:', error);
            // Limpar localStorage se houver erro
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userId');
            return null;
        }
    }

    /**
     * Obtém as permissões do usuário atual
     */
    getPermissions() {
        if (!this.currentUser) {
            return null;
        }

        // Tenta obter o nível de acesso de diferentes formas possíveis
        let level = this.currentUser.levelAccess || 
                   this.currentUser.level_access || 
                   this.currentUser.level;
        
        if (!level) {
            console.warn('Nível de acesso não encontrado no usuário:', this.currentUser);
            return null;
        }

        // Normaliza para uppercase
        level = level.toUpperCase();
        
        // Mapeia valores possíveis
        if (level === 'ADMINISTRATOR' || level === 'ADMIN') {
            level = 'ADMIN';
        } else if (level === 'RECURSOS_HUMANOS' || level === 'RH' || level === 'HR') {
            level = 'HR';
        } else if (level === 'MANAGER' || level === 'GESTOR' || level === 'GERENTE') {
            level = 'MANAGER';
        }

        return AccessPermissions[level] || null;
    }

    /**
     * Verifica se o usuário tem uma permissão específica
     */
    hasPermission(permission) {
        if (!this.permissions) return false;
        return this.permissions.permissions[permission] === true;
    }

    /**
     * Verifica se o usuário tem um dos níveis de acesso especificados
     */
    hasLevel(...levels) {
        if (!this.currentUser || !this.currentUser.levelAccess) return false;
        const userLevel = this.currentUser.levelAccess.toUpperCase();
        return levels.includes(userLevel);
    }

    /**
     * Obtém o nome do nível de acesso do usuário
     */
    getLevelName() {
        return this.permissions?.name || 'Usuário';
    }

    /**
     * Obtém o nível de acesso do usuário
     */
    getLevel() {
        return this.currentUser?.levelAccess?.toUpperCase() || null;
    }

    /**
     * Verifica se o usuário está autenticado
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Redireciona para login se não estiver autenticado
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            // Não redirecionar se já estiver na página de login ou index
            const currentPage = window.location.pathname.split('/').pop();
            const publicPages = ['login.html', 'index.html', 'register.html', 'forgot-password.html'];
            
            if (!publicPages.includes(currentPage)) {
                // Redirecionar imediatamente para login
                window.location.href = 'login.html';
            }
            return false;
        }
        return true;
    }

    /**
     * Verifica permissão e redireciona se não tiver acesso
     */
    requirePermission(permission, redirectUrl = 'home.html') {
        // Primeiro verifica se está autenticado
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        
        // Depois verifica se tem permissão
        if (!this.hasPermission(permission)) {
            alert('Você não tem permissão para acessar esta página.');
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    /**
     * Oculta elementos que o usuário não tem permissão para ver
     */
    hideUnauthorizedElements() {
        // Esconder links do sidebar baseado em permissões
        if (!this.hasPermission('canManageAdmins')) {
            this.hideElements('[href="adm.html"]');
        }
        if (!this.hasPermission('canManageManagers')) {
            this.hideElements('[href="gerente.html"]');
        }
        if (!this.hasPermission('canManageRH')) {
            this.hideElements('[href="rh.html"]');
        }
        if (!this.hasPermission('canCreateOpeningRequest')) {
            this.hideElements('[href="abertura-vaga.html"]');
        }
        if (!this.hasPermission('canManageOpeningKanban')) {
            this.hideElements('[href="kanban-abertura-vaga.html"]');
        }
        if (!this.hasPermission('canManageMatch')) {
            this.hideElements('[href="match-candidatos.html"]');
        }
        if (!this.hasPermission('canManageRecruitmentKanban')) {
            this.hideElements('[href="kanban-recrutamento.html"]');
        }
        if (!this.hasPermission('canViewAllCandidates')) {
            this.hideElements('[href="candidatos.html"]');
        }
        if (!this.hasPermission('canUploadResumes')) {
            this.hideElements('[href="upload-curriculos.html"]');
        }
        if (!this.hasPermission('canViewCharts')) {
            this.hideElements('[href="charts.html"]');
        }
        if (!this.hasPermission('canViewTables')) {
            this.hideElements('[href="tables.html"]');
        }
    }

    /**
     * Esconde elementos do DOM
     */
    hideElements(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            const navItem = el.closest('.nav-item');
            if (navItem) {
                navItem.style.display = 'none';
            } else {
                el.style.display = 'none';
            }
        });
    }

    /**
     * Esconde seções inteiras do sidebar baseado em permissões
     */
    hideUnauthorizedSections() {
        // Esconder seção de Cadastros se não tiver nenhuma permissão
        if (!this.hasPermission('canManageAdmins') && 
            !this.hasPermission('canManageManagers') && 
            !this.hasPermission('canManageRH')) {
            const cadastrosSection = document.querySelector('.sidebar-heading');
            if (cadastrosSection && cadastrosSection.textContent.includes('Cadastros')) {
                cadastrosSection.style.display = 'none';
                cadastrosSection.nextElementSibling?.querySelectorAll('.nav-item').forEach(item => {
                    item.style.display = 'none';
                });
            }
        }

        // Esconder seção de Relatórios se não tiver permissão
        if (!this.hasPermission('canViewCharts') && !this.hasPermission('canViewTables')) {
            const reportsSection = Array.from(document.querySelectorAll('.sidebar-heading'))
                .find(el => el.textContent.includes('Relatórios'));
            if (reportsSection) {
                reportsSection.style.display = 'none';
                let next = reportsSection.nextElementSibling;
                while (next && !next.classList.contains('sidebar-divider')) {
                    if (next.classList.contains('nav-item')) {
                        next.style.display = 'none';
                    }
                    next = next.nextElementSibling;
                }
            }
        }
    }

    /**
     * Aplica controle de acesso na página atual
     */
    applyAccessControl() {
        // Verificar se está em páginas públicas (não requerem autenticação)
        const currentPage = window.location.pathname.split('/').pop();
        const publicPages = ['index.html', 'login.html', 'register.html', 'forgot-password.html'];
        
        if (publicPages.includes(currentPage)) {
            // Se já está logado e tenta acessar login/register, redirecionar para home
            if (this.isAuthenticated() && (currentPage === 'login.html' || currentPage === 'register.html')) {
                window.location.href = 'home.html';
                return;
            }
            // Se não está logado, permitir acesso às páginas públicas
            return;
        }

        // Para páginas protegidas, requer autenticação
        // Se não estiver autenticado, requireAuth() já redireciona para login
        if (!this.requireAuth()) {
            return; // Já redirecionou para login
        }

        // Esconder elementos não autorizados
        this.hideUnauthorizedElements();
        this.hideUnauthorizedSections();

        // Adicionar badge com nível de acesso no header se existir
        this.addAccessLevelBadge();
    }

    /**
     * Adiciona badge com nível de acesso no header
     */
    addAccessLevelBadge() {
        const userDropdown = document.querySelector('.dropdown-toggle');
        if (userDropdown && this.permissions) {
            const badge = document.createElement('span');
            badge.className = 'badge badge-info ml-2';
            badge.textContent = this.getLevelName();
            badge.style.fontSize = '0.75rem';
            userDropdown.appendChild(badge);
        }
    }
}

// Instância global
export const accessControl = new AccessControl();

// Função para aplicar controle de acesso apenas em páginas protegidas
function initAccessControl() {
    const currentPage = window.location.pathname.split('/').pop();
    const publicPages = ['index.html', 'login.html', 'register.html', 'forgot-password.html'];
    
    // Não aplicar controle de acesso em páginas públicas
    if (publicPages.includes(currentPage)) {
        // Se já está logado e tenta acessar login/register, redirecionar para home
        if ((currentPage === 'login.html' || currentPage === 'register.html') && accessControl.isAuthenticated()) {
            window.location.href = 'home.html';
        }
        return; // Não aplicar controle em páginas públicas
    }
    
    // Para páginas protegidas, verificar autenticação imediatamente
    if (!accessControl.isAuthenticated()) {
        // Redirecionar imediatamente para login se não estiver autenticado
        window.location.href = 'login.html';
        return;
    }
    
    // Aplicar controle de acesso em páginas protegidas
    accessControl.applyAccessControl();
}

// Verificação imediata antes do DOM carregar (para páginas protegidas)
(function() {
    const currentPage = window.location.pathname.split('/').pop();
    const publicPages = ['index.html', 'login.html', 'register.html', 'forgot-password.html'];
    
    // Se não for página pública, verificar autenticação imediatamente
    if (!publicPages.includes(currentPage)) {
        const userStr = localStorage.getItem('currentUser');
        if (!userStr || userStr === 'null' || userStr === 'undefined') {
            // Redirecionar imediatamente para login
            window.location.replace('login.html');
            return;
        }
    }
})();

// Aplicar controle de acesso automaticamente quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccessControl);
} else {
    initAccessControl();
}

