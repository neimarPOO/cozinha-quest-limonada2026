let current = null;
function buildRoletaSvg() {}
function showTab(tab) {
  if (!isAdminAuthenticated()) { openAdminLogin(tab); return; }
  document.querySelectorAll('.view').forEach(el => el.classList.toggle('active', el.id === tab));
  document.querySelectorAll('[data-tab]').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
  renderAll();
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-tab]').forEach(el => el.onclick = () => showTab(el.dataset.tab));
  $('adminLoginForm').onsubmit = e => { e.preventDefault(); handleAdminLogin(); };
  $('btnAdminLogout').onclick = handleAdminLogout;
  sessionStorage.removeItem(ADMIN_AUTH_KEY);
  updateAdminUI();openAdminLogin('dashboard');
});
