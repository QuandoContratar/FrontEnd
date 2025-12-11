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
    const levelAccess = String(user.levelAccess || user.level_access || user.role || user.title || '').toUpperCase();
    if (levelAccess === 'ADMIN' || levelAccess === '1') return 'ADMIN';
    if (levelAccess === 'HR' || levelAccess === '2' || levelAccess === 'RH') return 'HR';
    // Accept Portuguese role labels too
    if (levelAccess === 'MANAGER' || levelAccess === '3' || levelAccess === 'GESTOR' || levelAccess === 'GERENTE' || levelAccess === 'GESTORES') return 'MANAGER';
    return null;
  };

  Permissions.isAdmin = function(){ return Permissions.getRole() === 'ADMIN'; };
  Permissions.isHR = function(){ return Permissions.getRole() === 'HR'; };
  Permissions.isManager = function(){ return Permissions.getRole() === 'MANAGER'; };

  // Hide dashboard links for managers (run on pages with sidebars)
  Permissions.applySidebarRules = function() {
    try {
      // Former behavior hid `home.html` for managers; per update, Home must be
      // visible to everyone. Keep only dashboard/shortcut removals if needed.
      if (!Permissions.isManager()) return;
      // hide links that explicitly mention 'Dashboard' (but keep Home)
      document.querySelectorAll('.sidebar .nav-link').forEach(a => {
        try {
          const text = a.textContent || '';
          if (/dashboard/i.test(text)) {
            // never hide the actual Home link even if its text contains 'Dashboard'
            const hrefAttr = a.getAttribute && a.getAttribute('href');
            const href = String(hrefAttr || '').trim();
            if (/home(\.html)?$/.test(href)) return;
            a.style.display = 'none';
          }
        } catch(e){}
      });
      // hide any topbar or other dashboard shortcut (if annotated)
      document.querySelectorAll('[data-dashboard-link]').forEach(el => el.style.display = 'none');

      // Additionally, managers are not allowed to see the Gráficos page.
      // Hide explicit links to `charts.html` in the sidebar and anywhere else.
      document.querySelectorAll('.sidebar a.nav-link[href$="charts.html"]').forEach(a => {
        const li = a.closest('.nav-item') || a.parentElement;
        if (li) li.style.display = 'none';
        else a.style.display = 'none';
      });
      document.querySelectorAll('a[href$="charts.html"]').forEach(a => {
        const el = a.closest('li') || a;
        if (el) el.style.display = 'none';
        else a.style.display = 'none';
      });
      // Managers also must not see vagas, upload de currículos or match de candidatos
      const managerHidden = ['vagas.html', 'upload-curriculos.html', 'match-candidatos.html'];
      managerHidden.forEach(href => {
        document.querySelectorAll('.sidebar a.nav-link[href$="' + href + '"]').forEach(a => {
          const li = a.closest('.nav-item') || a.parentElement;
          if (li) li.style.display = 'none';
          else a.style.display = 'none';
        });
        // hide any cards/buttons that use inline onclicks or anchors to these pages
        document.querySelectorAll('a[href$="' + href + '"]').forEach(a => {
          const el = a.closest('li') || a;
          if (el) el.style.display = 'none';
          else a.style.display = 'none';
        });
        // also catch onclicks that reference the page
        document.querySelectorAll('[onclick]').forEach(el => {
          try {
            const onclick = el.getAttribute('onclick') || '';
            if (onclick.includes(href)) el.style.display = 'none';
          } catch(e){}
        });
      });
    } catch (e) {
      console.error('Permissions.applySidebarRules error', e);
    }
  };

  // Hide sidebar headings (like "Cadastros") when all their following nav-items
  // are hidden by permissions. This avoids showing empty section headings.
  Permissions.cleanupSidebarHeadings = function() {
    try {
      document.querySelectorAll('.sidebar .sidebar-heading').forEach(heading => {
        // Walk siblings until next .sidebar-heading or end
        let el = heading.nextElementSibling;
        let anyVisible = false;
        while (el && !el.classList.contains('sidebar-heading')) {
          try {
            // Only consider actual navigation items as making the section non-empty.
            // Skip dividers (<hr>) and other layout elements which are often visible
            // but shouldn't count toward keeping the heading.
            const isNavItem = el.matches && (el.matches('.nav-item') || el.matches('li') || el.matches('.nav-item *'));
            const containsNavLink = el.querySelector && el.querySelector('.nav-link');
            if (isNavItem || containsNavLink) {
              const style = window.getComputedStyle(el);
              if (style.display !== 'none' && style.visibility !== 'hidden') {
                anyVisible = true;
                break;
              }
            }
            // otherwise ignore this element (hr, comment, spacer, etc.)
          } catch(e){ }
          el = el.nextElementSibling;
        }
        heading.style.display = anyVisible ? '' : 'none';
      });
    } catch(e){ console.error('Permissions.cleanupSidebarHeadings error', e); }
  };

  // Hide admin add controls from non-admins
  Permissions.applyAdminRules = function() {
    try {
      if (!Permissions.isAdmin()){
        // Buttons or containers that add users/admins usually have ids like addAdminBtn or adminForm
        // Keep admin-only controls hidden for all non-admins (RH included) — these are
        // controls such as adding administrators or editing admin forms.
        document.querySelectorAll('#addAdminBtn, #adminForm, .admin-only, [data-admin-only]').forEach(el => {
          el.style.display = 'none';
        });

        // Some pages didn't mark the nav-items as data-admin-only. To be defensive,
        // hide any sidebar links that point to admin management pages so the
        // "Cadastros" heading collapses correctly for non-admins. However, RH
        // users should still be able to access the RH page (Aprovação de Vagas),
        // so skip hiding links to `rh.html` for them.
        const adminHrefs = ['adm.html', 'gerente.html'];
        // only hide rh.html link for users that are NOT HR
        if (!Permissions.isHR()) {
          adminHrefs.push('rh.html');
        }

        adminHrefs.forEach(href => {
          // hide links inside sidebar nav
          document.querySelectorAll('.sidebar a.nav-link[href$="' + href + '"]').forEach(a => {
            const li = a.closest('.nav-item') || a.parentElement;
            if (li) li.style.display = 'none';
            else a.style.display = 'none';
          });

          // hide any other anchors linking directly to those pages
          document.querySelectorAll('a[href$="' + href + '"]').forEach(a => {
            const el = a.closest('li') || a;
            if (el) el.style.display = 'none';
            else a.style.display = 'none';
          });
        });

        // Ensure RH users still see the RH sidebar link (defensive restore):
        if (Permissions.isHR()) {
          document.querySelectorAll('.sidebar a.nav-link[href$="rh.html"]').forEach(a => {
            const li = a.closest('.nav-item') || a.parentElement;
            if (li) li.style.display = '';
            else a.style.display = '';
          });
        }
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
      // visually mark draggable areas as read-only but keep links clickable
      document.querySelectorAll('.column-content').forEach(c => {
        // keep pointer events so details links work; only style to indicate read-only
        c.style.opacity = '0.95';
      });
      // additionally, disable interactive controls except details
      document.querySelectorAll('.column-content button, .column-content a').forEach(el => {
        try {
          const action = el.dataset && el.dataset.action;
          if (action && action !== 'details') {
            if (el.tagName.toLowerCase() === 'button') {
              el.disabled = true;
              el.classList.add('disabled');
            } else {
              // anchor: prevent click but keep it focusable for accessibility
              el.addEventListener('click', function(e){ if (this.dataset.action !== 'details') e.preventDefault(); });
              el.classList.add('disabled-link');
              el.setAttribute('aria-disabled', 'true');
            }
          }
        } catch (e) { }
      });
    } catch (e) { console.error('Permissions.applyKanbanRules error', e); }
  };

  // Apply common rules on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    try {
      // Aguardar Utils estar disponível
      const runAll = () => {
        // Global hides (links that should not appear for anyone)
        Permissions.applyGlobalHides && Permissions.applyGlobalHides();
        Permissions.applySidebarRules();
        Permissions.applyAdminRules();
        Permissions.applyKanbanRules();
        // hide empty sidebar headings after rules applied
        Permissions.cleanupSidebarHeadings();
      };

      // If Utils is present (used by getRole normalization), wait a short moment
      // to ensure it has initialized. But always run cleanup after a short delay
      // in case Utils isn't available.
      if (window.Utils && typeof window.Utils.normalizeLevelAccess === 'function') {
        setTimeout(runAll, 20);
      } else {
        // run quickly and also retry once to catch late Utils initialization
        runAll();
        setTimeout(runAll, 150);
      }
    } catch(e){
      console.error('Permissions DOMContentLoaded error', e);
    }
  });

  // Hide links that should be hidden for everyone (global removal)
  Permissions.applyGlobalHides = function() {
    try {
      // Example: remove 'Tabelas' link everywhere
      const globalHrefs = ['tables.html'];
      globalHrefs.forEach(href => {
        document.querySelectorAll('.sidebar a.nav-link[href$="' + href + '"]').forEach(a => {
          const li = a.closest('.nav-item') || a.parentElement;
          if (li) li.style.display = 'none';
          else a.style.display = 'none';
        });
        // also hide any other anchor occurrences
        document.querySelectorAll('a[href$="' + href + '"]').forEach(a => {
          const el = a.closest('li') || a;
          if (el) el.style.display = 'none';
          else a.style.display = 'none';
        });
      });
    } catch(e){ console.error('Permissions.applyGlobalHides error', e); }
  };

  window.Permissions = Permissions;
})(window);
