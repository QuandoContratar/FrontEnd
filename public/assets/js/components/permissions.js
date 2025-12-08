/* Simple permission helpers to enforce frontend UI restrictions
   - Hides dashboard links for MANAGER
   - Hides admin add buttons for non-ADMIN (RH cannot add admin/gerente/rh)
   - Exposes currentUser and normalized role helper
*/
(function(window){
  const Permissions = {};

  Permissions.getCurrentUser = function() {
    try {
      const raw = localStorage.getItem('userLogged') || localStorage.getItem('currentUser');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Permissions: failed to parse current user', e);
      return null;
    }
  };

  Permissions.getRole = function() {
    const user = Permissions.getCurrentUser();
    if (!user) return null;
    const UtilsRef = window.Utils || Utils;
    if (UtilsRef && typeof UtilsRef.normalizeLevelAccess === 'function') {
      return UtilsRef.normalizeLevelAccess(user.levelAccess || user.level_access || user.level_access);
    }
    // Fallback: verificação direta
    const levelAccess = String(user.levelAccess || user.level_access || '').toUpperCase();
    if (levelAccess === 'ADMIN' || levelAccess === '1') return 'ADMIN';
    if (levelAccess === 'HR' || levelAccess === '2') return 'HR';
    if (levelAccess === 'MANAGER' || levelAccess === '3') return 'MANAGER';
    return null;
  };

  Permissions.isAdmin = function(){ return Permissions.getRole() === 'ADMIN'; };
  Permissions.isHR = function(){ return Permissions.getRole() === 'HR'; };
  Permissions.isManager = function(){ return Permissions.getRole() === 'MANAGER'; };

  // Hide dashboard links for managers (run on pages with sidebars)
  Permissions.applySidebarRules = function() {
    try {
      const role = Permissions.getRole();
      if (!role) return;
      
      // Para gestores: ocultar links de cadastro de usuários e dashboard
      if (Permissions.isManager()) {
        // Ocultar links de cadastro de usuários
        document.querySelectorAll('.sidebar .nav-link').forEach(a => {
          try {
            const href = a.getAttribute('href') || '';
            const text = a.textContent || '';
            
            // Ocultar links de cadastro de usuários
            if (href.includes('adm.html') || href.includes('gerente.html') || href.includes('rh.html')) {
              const navItem = a.closest('.nav-item');
              if (navItem) navItem.style.display = 'none';
            }
            
            // Ocultar apenas link de gráficos (charts.html) para gestores, mas manter home.html
            if (href.includes('charts.html') || (/gráficos/i.test(text) && !href.includes('home.html'))) {
              const navItem = a.closest('.nav-item');
              if (navItem) navItem.style.display = 'none';
            }
          } catch(e){}
        });
        
        // Ocultar heading "Cadastros" se todos os links foram ocultados
        setTimeout(() => {
          const cadastrosHeading = Array.from(document.querySelectorAll('.sidebar-heading')).find(h => 
            h.textContent.trim().includes('Cadastros')
          );
          if (cadastrosHeading) {
            // Encontrar todos os nav-items após o heading até o próximo divider ou heading
            let nextElement = cadastrosHeading.nextElementSibling;
            let hasVisibleLinks = false;
            while (nextElement && !nextElement.classList.contains('sidebar-divider') && !nextElement.classList.contains('sidebar-heading')) {
              if (nextElement.classList.contains('nav-item') && nextElement.style.display !== 'none') {
                hasVisibleLinks = true;
                break;
              }
              nextElement = nextElement.nextElementSibling;
            }
            
            if (!hasVisibleLinks) {
              cadastrosHeading.style.display = 'none';
              // Ocultar também o divider antes do heading se existir
              const dividerBefore = cadastrosHeading.previousElementSibling;
              if (dividerBefore && dividerBefore.classList.contains('sidebar-divider')) {
                dividerBefore.style.display = 'none';
              }
            }
          }
          
          // Ocultar heading "Relatórios" se o link de gráficos foi ocultado
          const relatoriosHeading = Array.from(document.querySelectorAll('.sidebar-heading')).find(h => 
            h.textContent.trim().includes('Relatórios')
          );
          if (relatoriosHeading) {
            let nextElement = relatoriosHeading.nextElementSibling;
            let hasVisibleLinks = false;
            while (nextElement && !nextElement.classList.contains('sidebar-divider') && !nextElement.classList.contains('sidebar-heading')) {
              if (nextElement.classList.contains('nav-item') && nextElement.style.display !== 'none') {
                hasVisibleLinks = true;
                break;
              }
              nextElement = nextElement.nextElementSibling;
            }
            
            if (!hasVisibleLinks) {
              relatoriosHeading.style.display = 'none';
              const dividerBefore = relatoriosHeading.previousElementSibling;
              if (dividerBefore && dividerBefore.classList.contains('sidebar-divider')) {
                dividerBefore.style.display = 'none';
              }
            }
          }
        }, 100);
      }
      
      // Para RH: ocultar apenas links de administradores e gerentes
      if (Permissions.isHR()) {
        document.querySelectorAll('.sidebar .nav-link').forEach(a => {
          try {
            const href = a.getAttribute('href') || '';
            if (href.includes('adm.html') || href.includes('gerente.html')) {
              const navItem = a.closest('.nav-item');
              if (navItem) navItem.style.display = 'none';
            }
          } catch(e){}
        });
      }
      
      // hide any topbar or other dashboard shortcut
      document.querySelectorAll('[data-dashboard-link]').forEach(el => el.style.display = 'none');
    } catch (e) {
      console.error('Permissions.applySidebarRules error', e);
    }
  };

  // Hide admin add controls from non-admins
  Permissions.applyAdminRules = function() {
    try {
      if (!Permissions.isAdmin()){
        // Buttons or containers that add users/admins usually have ids like addAdminBtn or adminForm
        document.querySelectorAll('#addAdminBtn, #adminForm, .admin-only, [data-admin-only]').forEach(el => {
          el.style.display = 'none';
        });
      }
    } catch(e){ console.error('Permissions.applyAdminRules error', e); }
  };

  // Disable interactive elements for managers in kanban (cards/buttons)
  Permissions.applyKanbanRules = function() {
    try {
      if (!Permissions.isManager()) return;
      // disable buttons that perform actions
      document.querySelectorAll('button[data-action], a[data-action]').forEach(btn => {
        // allow 'details' action (view) but disable advance/approve/reject
        const action = btn.dataset.action;
        if (action && action !== 'details') {
          btn.disabled = true;
          btn.classList.add('disabled');
          btn.setAttribute('title', 'Permissão de visualização (Gestor)');
        }
      });
      // visually mark draggable areas as read-only
      document.querySelectorAll('.column-content').forEach(c => {
        c.style.pointerEvents = 'none';
        c.style.opacity = '0.85';
      });
    } catch (e) { console.error('Permissions.applyKanbanRules error', e); }
  };

  // Apply common rules on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    try {
      // Aguardar Utils estar disponível
      const checkUtils = () => {
        if (window.Utils && typeof window.Utils.normalizeLevelAccess === 'function') {
          Permissions.applySidebarRules();
          Permissions.applyAdminRules();
          Permissions.applyKanbanRules();
          // update topbar username (Utils already does this in some pages)
        } else {
          // Tentar novamente após um pequeno delay
          setTimeout(checkUtils, 100);
        }
      };
      checkUtils();
    } catch(e){
      console.error('Permissions DOMContentLoaded error', e);
    }
  });

  window.Permissions = Permissions;
})(window);
