/**
 * NEXUS Industrial Overhaul & Service ERP - Application Controller (v3.0)
 * Strict Role-Based Access Control (RBAC), Dynamic Sidebar Filtering & Distinct Role Views
 */

let erpState = null;
let currentTab = 'dashboard';
let currentFilter = 'all';
let currentOpStep = 'receiving';
let selectedOpJobId = 'J000248';
let currentJobStageFilter = 'all';
let currentTodoFilter = 'all';

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  erpState = getERPData();
  checkAuthAndInitialize();
  setupGlobalShortcuts();
  setupEventListeners();
});

// ==========================================
// 1. AUTHENTICATION & RBAC INITIALIZATION
// ==========================================
function checkAuthAndInitialize() {
  const authContainer = document.getElementById('authContainer');
  const appContainer = document.getElementById('appContainer');

  if (!erpState.auth || !erpState.auth.isAuthenticated) {
    if (authContainer) authContainer.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
  } else {
    if (authContainer) authContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'flex';
    
    // Ensure currentUser is valid
    if (!erpState.currentUser || !erpState.currentUser.roleKey) {
      erpState.currentUser = erpState.users[0];
    }

    initRoleSwitcher();
    renderSidebarForActiveRole();
    initTopSearchBar();
    updateUserHeader();
    
    // Valid module check for common navigation
    const validTabs = ['dashboard', 'sales', 'operations', 'inventory', 'purchase', 'technician', 'reports', 'assets', 'settings', 'executive_dashboard'];
    if (!validTabs.includes(currentTab)) {
      currentTab = roleConfig.defaultTab || 'dashboard';
    }
    
    renderCurrentTab();
    updateTopbarNotifications();
  }
}

// Unified ERP Sidebar Builder - Common Navigation across all 9 core modules (From Design Sketch)
function renderSidebarForActiveRole() {
  const navContainer = document.getElementById('sidebarNavContainer');
  if (!navContainer) return;

  const roleKey = erpState.currentUser.roleKey;
  const roleConfig = erpState.rbac[roleKey] || erpState.rbac['workshop_manager'];
  const modules = erpState.commonModules || COMMON_ERP_MODULES;

  navContainer.innerHTML = `
    <div class="nav-section-label">Enterprise Navigation</div>
    ${modules.map(mod => {
      const isPrimary = mod.primaryRoles && mod.primaryRoles.includes(roleKey);
      const isActive = mod.id === currentTab;
      return `
        <a class="nav-item ${isActive ? 'active' : ''} ${isPrimary ? 'nav-item-assigned' : ''}" 
           data-tab="${mod.id}" 
           onclick="switchTab('${mod.id}')"
           title="${mod.label}">
          <span class="icon">${mod.icon}</span>
          <span style="flex: 1; font-weight: ${isPrimary ? '700' : '500'};">${mod.label}</span>
          ${isPrimary ? `<span class="nav-badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 10px; border: 1px solid rgba(16, 185, 129, 0.35);">Your Bay</span>` : ''}
          ${mod.badge && !isPrimary ? `<span class="nav-badge">${mod.badge}</span>` : ''}
        </a>
      `;
    }).join('')}
  `;

  // Update mobile bottom nav with quick common modules
  renderMobileNavForRole(roleConfig);
}

function renderMobileNavForRole(roleConfig) {
  const mobileNav = document.getElementById('mobileBottomNav');
  if (!mobileNav) return;

  mobileNav.innerHTML = `
    <a class="mobile-nav-tab ${currentTab === 'dashboard' ? 'active' : ''}" onclick="switchTab('dashboard')">
      <span class="m-icon">📊</span>
      <span class="m-text">Overview</span>
    </a>
    <a class="mobile-nav-tab ${currentTab === 'sales' ? 'active' : ''}" onclick="switchTab('sales')">
      <span class="m-icon">💼</span>
      <span class="m-text">Sales</span>
    </a>
    <a class="mobile-nav-tab ${currentTab === 'operations' ? 'active' : ''}" onclick="switchTab('operations')">
      <span class="m-icon">⚙️</span>
      <span class="m-text">Operation</span>
    </a>
    <a class="mobile-nav-tab ${currentTab === 'technician' ? 'active' : ''}" onclick="switchTab('technician')">
      <span class="m-icon">🔧</span>
      <span class="m-text">Job Holder</span>
    </a>
    <a class="mobile-nav-tab" onclick="toggleMobileSidebar()">
      <span class="m-icon">☰</span>
      <span class="m-text">All (8)</span>
    </a>
  `;
}

// Persona & Role Switcher
function initRoleSwitcher() {
  const roleSelect = document.getElementById('roleSelect');
  if (!roleSelect) return;

  roleSelect.innerHTML = Object.values(erpState.rbac).map(r => 
    `<option value="${r.key}" ${r.key === erpState.currentUser.roleKey ? 'selected' : ''}>${r.title} - ${r.name}</option>`
  ).join('');

  roleSelect.onchange = (e) => {
    switchPersona(e.target.value);
  };
}

function switchPersona(roleKey) {
  const roleConfig = erpState.rbac[roleKey];
  if (!roleConfig) return;

  const matchedUser = erpState.users.find(u => u.roleKey === roleKey) || {
    id: 'USR-' + roleKey,
    name: roleConfig.name,
    email: `${roleKey}@nexus-erp.com`,
    roleKey: roleKey,
    role: roleConfig.title,
    avatar: roleConfig.avatar,
    badge: roleConfig.department,
    department: roleConfig.department
  };

  erpState.currentUser = matchedUser;
  erpState.auth.currentUserId = matchedUser.id;
  currentTab = roleConfig.defaultTab;

  saveERPData(erpState);
  initRoleSwitcher();
  renderSidebarForActiveRole();
  updateUserHeader();
  closeMobileSidebar();
  
  showToast(`Active persona changed to: ${roleConfig.title} (${roleConfig.name}). Navigation updated.`, 'info');
  renderCurrentTab();
}

function updateUserHeader() {
  const u = erpState.currentUser;
  const avatarEl = document.getElementById('headerUserAvatar');
  const nameEl = document.getElementById('headerUserName');
  const roleEl = document.getElementById('headerUserRole');
  const dropName = document.getElementById('dropdownEmpName');
  const dropEmail = document.getElementById('dropdownEmpEmail');

  if (avatarEl) avatarEl.textContent = u.avatar || '👨‍💼';
  if (nameEl) nameEl.textContent = u.name;
  if (roleEl) roleEl.textContent = `${u.role} (${u.badge || u.department})`;
  if (dropName) dropName.textContent = u.name;
  if (dropEmail) dropEmail.textContent = u.email || `${u.roleKey}@nexus-erp.com`;
}

// Permission Gate Checker
function hasPermission(permissionKey) {
  const roleKey = erpState.currentUser.roleKey;
  const roleConfig = erpState.rbac[roleKey];
  return roleConfig && roleConfig.permissions.includes(permissionKey);
}

function enforcePermission(permissionKey, callback) {
  if (hasPermission(permissionKey)) {
    callback();
  } else {
    const requiredRole = getRequiredRoleForPermission(permissionKey);
    showToast(`Access Restricted: Action requires [${requiredRole}] authorization. Switch persona to test.`, 'warning');
  }
}

function getRequiredRoleForPermission(pKey) {
  for (const [rKey, cfg] of Object.entries(erpState.rbac)) {
    if (cfg.permissions.includes(pKey)) return cfg.title;
  }
  return 'Authorized Role';
}

// Navigation & Tab Switching
function switchTab(tabName) {
  currentTab = tabName;
  renderSidebarForActiveRole();
  closeMobileSidebar();
  renderCurrentTab();
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById('appSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar) sidebar.classList.toggle('mobile-open');
  if (backdrop) backdrop.classList.toggle('active');
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('appSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar) sidebar.classList.remove('mobile-open');
  if (backdrop) backdrop.classList.remove('active');
}

// Search
function initTopSearchBar() {
  const searchInput = document.getElementById('globalSearchInput');
  if (!searchInput) return;
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    filterJobsTable(query);
    filterAssetsTable(query);
  });
}

// ==========================================
// 2. DYNAMIC CONTENT ROUTER (ROLE-ADAPTIVE)
// ==========================================
function renderCurrentTab() {
  const container = document.getElementById('mainContentArea');
  if (!container) return;

  const roleKey = erpState.currentUser.roleKey;
  const roleConfig = erpState.rbac[roleKey] || erpState.rbac['workshop_manager'];

  // Top RBAC Command Strip (Explicitly communicates role limits to user)
  const rbacStripHTML = `
    <div class="rbac-command-strip">
      <div class="rbac-role-pill">
        <span style="font-size: 16px;">${roleConfig.avatar}</span>
        <span>Viewing as: <strong>${roleConfig.title}</strong> (${erpState.currentUser.name})</span>
      </div>
      <div class="rbac-scope-tags">
        <span style="font-size: 11px; color: var(--text-dim); margin-right: 4px;">Authorized Scopes:</span>
        ${roleConfig.permissions.slice(0, 3).map(p => `<span class="rbac-tag">✓ ${formatPermissionTag(p)}</span>`).join('')}
        ${roleConfig.permissions.length > 3 ? `<span class="rbac-tag">+${roleConfig.permissions.length - 3} more</span>` : ''}
      </div>
    </div>
  `;

  // Route to the appropriate view
  let viewHTML = '';
  switch (currentTab) {
    // Workshop Manager Views
    case 'dashboard':
      viewHTML = getWorkshopDashboardHTML();
      break;
    case 'operations':
      viewHTML = getOperationsModuleHTML();
      break;
    case 'assignments':
      viewHTML = getAssignmentsViewHTML();
      break;

    // Sales Executive Views
    case 'sales':
      viewHTML = getSalesDashboardHTML();
      break;
    case 'enquiries':
      viewHTML = getEnquiriesViewHTML();
      break;
    case 'quotations':
      viewHTML = getQuotationsViewHTML();
      break;
    case 'invoicing':
      viewHTML = getInvoicingViewHTML();
      break;

    // Receiving Officer Views
    case 'receiving':
    case 'inward_dn':
      viewHTML = getReceivingHubHTML();
      break;
    case 'equipment_register':
      viewHTML = getAssetsViewHTML();
      break;

    // Technician Views
    case 'technician':
    case 'stage_inspection':
    case 'assembly_tracking':
    case 'rig_testing':
      viewHTML = getTechnicianConsoleHTML();
      break;

    // Purchaser & Storekeeper Views
    case 'inventory':
    case 'material_requests':
    case 'purchase':
    case 'lgrn_inward':
    case 'issuance':
      viewHTML = getInventoryPurchasingHTML();
      break;

    // Country Manager Views
    case 'executive_dashboard':
    case 'costing_approvals':
    case 'discount_approvals':
    case 'po_approvals':
      viewHTML = getExecutiveDashboardHTML();
      break;

    // QA Inspector Views
    case 'qa_dashboard':
    case 'predispatch':
    case 'test_certificates':
      viewHTML = getQADashboardHTML();
      break;

    // Shared Analytics & Settings
    case 'reports':
      viewHTML = getReportsModuleHTML();
      break;
    case 'assets':
      viewHTML = getAssetsViewHTML();
      break;
    case 'settings':
      viewHTML = getSettingsModuleHTML();
      break;

    default:
      viewHTML = getWorkshopDashboardHTML();
  }

  container.innerHTML = rbacStripHTML + viewHTML;
}

function formatPermissionTag(p) {
  return p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ==========================================
// 3. ROLE-SPECIFIC VIEWS IMPLEMENTATION
// ==========================================

// 3A. WORKSHOP MANAGER DASHBOARD
function getWorkshopDashboardHTML() {
  const totalJobs = erpState.jobs.length;
  const pendingJobs = erpState.jobs.filter(j => j.status.includes('Pending') || j.status.includes('Assessment') || j.status.includes('Assigned')).length;
  const ongoingJobs = erpState.jobs.filter(j => j.status.includes('Progress') || j.status.includes('Production')).length;
  const completedJobs = erpState.jobs.filter(j => j.status === 'Completed').length;
  const completionPct = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
  const strokeDash = `${(completionPct / 100) * 251.2} 251.2`;

  return `
    <div class="page-header">
      <div>
        <h2>Workshop Operations & Capacity Control</h2>
        <p>Live overhaul pipeline, technician bay throughput, and inspection bottlenecks.</p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="quick-action-btn btn-primary" onclick="openJobAssignModal('J000248')">👥 Assign Technician</button>
        <button class="quick-action-btn btn-outline" onclick="openCostEstimationModal('J000248')">💰 Prepare Costing</button>
      </div>
    </div>

    <!-- 6 KPI Stat Cards matching handwritten layout (2 rows x 3 columns) -->
    <div class="kpi-grid-6">
      <!-- 1. Pending Job -->
      <div class="kpi-card amber">
        <div class="kpi-info">
          <span class="title">Pending Job</span>
          <h3 class="value">${pendingJobs + 28}</h3>
          <span class="delta warning">Inspection & Parts Hold</span>
        </div>
        <div class="kpi-icon-wrap">⏱️</div>
      </div>

      <!-- 2. On-going Job -->
      <div class="kpi-card cyan">
        <div class="kpi-info">
          <span class="title">On-going Job</span>
          <h3 class="value">${ongoingJobs + 43}</h3>
          <span class="delta positive">Active in Bays 1-4</span>
        </div>
        <div class="kpi-icon-wrap">⚙️</div>
      </div>

      <!-- 3. Completed Job -->
      <div class="kpi-card green">
        <div class="kpi-info">
          <span class="title">Completed Job</span>
          <h3 class="value">${completedJobs + 64}</h3>
          <span class="delta positive">QC Certified & Delivered</span>
        </div>
        <div class="kpi-icon-wrap">✅</div>
      </div>

      <!-- 4. Total Enquiry -->
      <div class="kpi-card blue">
        <div class="kpi-info">
          <span class="title">Total Enquiry</span>
          <h3 class="value">${erpState.enquiries.length + 112}</h3>
          <span class="delta positive">↑ 82% Converted to Jobs</span>
        </div>
        <div class="kpi-icon-wrap">📩</div>
      </div>

      <!-- 5. Approval Pending Job -->
      <div class="kpi-card purple">
        <div class="kpi-info">
          <span class="title">Approval Pending Job</span>
          <h3 class="value">4</h3>
          <span class="delta warning">Costing & PO Sign-offs</span>
        </div>
        <div class="kpi-icon-wrap">📋</div>
      </div>

      <!-- 6. Overdue Jobs -->
      <div class="kpi-card red">
        <div class="kpi-info">
          <span class="title">Overdue Jobs</span>
          <h3 class="value">2</h3>
          <span class="delta negative">Supplier Lead-time Alert</span>
        </div>
        <div class="kpi-icon-wrap">🚨</div>
      </div>
    </div>

    <!-- Middle: Job Status Overview (Donut) & Urgent Required Actions (From Handwritten Sketch) -->
    <div class="dashboard-grid">
      <!-- Left: Job Status Overview -->
      <div class="content-card">
        <div class="card-header">
          <h3>📊 Job Status Overview</h3>
          <span class="view-all-link" onclick="switchTab('operations')">Pipeline Details →</span>
        </div>

        <div class="donut-chart-container">
          <div class="donut-visual">
            <svg width="140" height="140" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.08)" stroke-width="12"></circle>
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#06b6d4" stroke-width="12"
                      stroke-dasharray="${strokeDash}" stroke-linecap="round"></circle>
            </svg>
            <div class="donut-center-text">
              <div class="pct">${completionPct}%</div>
              <div class="label">Completed</div>
            </div>
          </div>

          <div class="chart-legend">
            <div class="legend-row">
              <span class="legend-dot-label"><span class="legend-dot" style="background:#06b6d4;"></span> Completed Job</span>
              <span class="legend-val">${completedJobs + 64}</span>
            </div>
            <div class="legend-row">
              <span class="legend-dot-label"><span class="legend-dot" style="background:#10b981;"></span> Ongoing Job</span>
              <span class="legend-val">${ongoingJobs + 43}</span>
            </div>
            <div class="legend-row">
              <span class="legend-dot-label"><span class="legend-dot" style="background:#f59e0b;"></span> Pending Job</span>
              <span class="legend-val">${pendingJobs + 28}</span>
            </div>
            <div class="legend-row" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px; margin-top: 4px;">
              <span class="legend-dot-label" style="font-weight: 700;">Total</span>
              <span class="legend-val" style="font-weight: 800; color: #38bdf8;">${totalJobs + 143}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Urgent Required Actions -->
      <div class="content-card">
        <div class="card-header">
          <h3>⚡ Urgent Required Actions</h3>
          <span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); padding: 2px 8px; border-radius: 8px;">Action Queue</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div class="urgent-action-item">
            <div class="urgent-num">1.</div>
            <div style="flex: 1;">
              <strong>Job #J000247 - Hard Chromed Rod Supplier Delay</strong>
              <p style="font-size: 11.5px; color: #cbd5e1; margin-top: 2px;">Cylinder induction-hardened rod delayed. PO-2026-782 requires authorization.</p>
            </div>
            <button class="quick-action-btn btn-accent" style="padding: 4px 10px; font-size: 11px;" onclick="switchTab('purchase')">Review PO →</button>
          </div>

          <div class="urgent-action-item">
            <div class="urgent-num">2.</div>
            <div style="flex: 1;">
              <strong>Job #J000248 - Technical Assessment Ready</strong>
              <p style="font-size: 11.5px; color: #cbd5e1; margin-top: 2px;">Lead Tech Raj Kumar completed dismantling & micrometer runout inspection. Costing pending.</p>
            </div>
            <button class="quick-action-btn btn-primary" style="padding: 4px 10px; font-size: 11px;" onclick="openCostEstimationModal('J000248')">Prepare Costing →</button>
          </div>

          <div class="urgent-action-item">
            <div class="urgent-num">3.</div>
            <div style="flex: 1;">
              <strong>Enquiry #ENQ-2026-089 - Hydraulic Motor Arrived</strong>
              <p style="font-size: 11.5px; color: #cbd5e1; margin-top: 2px;">Inward DN registered by Alex Carter. Handover to Workshop Manager needed.</p>
            </div>
            <button class="quick-action-btn btn-success" style="padding: 4px 10px; font-size: 11px;" onclick="handoverToWorkshop('ENQ-2026-089')">Accept Handover →</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Jobs Table -->
    <div class="content-card">
      <div class="card-header">
        <h3>⚡ Active Workshop Jobs (Manager Allocation View)</h3>
        <span style="font-size: 12px; color: var(--cyan);">Full Manager Permissions Active</span>
      </div>
      <div class="table-responsive">
        <table class="erp-table">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Customer</th>
              <th>Equipment</th>
              <th>Serial No</th>
              <th>Assigned Tech</th>
              <th>Status</th>
              <th>Target</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${erpState.jobs.map(j => `
              <tr>
                <td style="font-weight: 700; color: #38bdf8;">${j.id}</td>
                <td>${j.customer}</td>
                <td>${j.equipment}</td>
                <td><code>${j.serialNo}</code></td>
                <td style="color: #34d399; font-weight: 600;">${j.leadTechnician}</td>
                <td><span class="status-pill ${getStatusClass(j.status)}">${j.status}</span></td>
                <td>${j.targetDate}</td>
                <td>
                  <button class="quick-action-btn btn-primary" style="padding: 3px 8px; font-size: 11px;" onclick="viewJobWorkflowDetails('${j.id}')">Console ➔</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 3B. COUNTRY MANAGER / EXECUTIVE COMMAND CENTER (Approvals & Financials)
function getExecutiveDashboardHTML() {
  const pendingCosting = erpState.jobs.filter(j => j.costing && j.costing.status.includes('Approved')).length;
  const pendingPOs = erpState.purchaseOrders.filter(p => !p.approvedBy).length;

  return `
    <div class="page-header">
      <div>
        <h2>Executive Approvals & Commercial Governance</h2>
        <p>Authorized sign-offs for repair costing, client commercial discounts, and capital purchase orders.</p>
      </div>
      <div>
        <span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); padding: 6px 12px; border-radius: 8px; font-weight: 800;">
          👑 COUNTRY MANAGER SIGN-OFF AUTHORITY
        </span>
      </div>
    </div>

    <!-- Financial KPI Summary -->
    <div class="kpi-grid">
      <div class="kpi-card blue">
        <div class="kpi-info">
          <span class="title">Active Quotation Pipeline</span>
          <h3 class="value">$55,152</h3>
          <span class="delta positive">↑ 18% avg margin</span>
        </div>
        <div class="kpi-icon-wrap">💼</div>
      </div>

      <div class="kpi-card green">
        <div class="kpi-info">
          <span class="title">Approved Costings (MTD)</span>
          <h3 class="value">$48,500</h3>
          <span class="delta positive">Directly grounded in BOM</span>
        </div>
        <div class="kpi-icon-wrap">💰</div>
      </div>

      <div class="kpi-card amber">
        <div class="kpi-info">
          <span class="title">Pending PO Sign-offs</span>
          <h3 class="value">${pendingPOs}</h3>
          <span class="delta warning">Requires CM signature</span>
        </div>
        <div class="kpi-icon-wrap">🛒</div>
      </div>

      <div class="kpi-card purple">
        <div class="kpi-info">
          <span class="title">Approved Discounts</span>
          <h3 class="value">2 Revs</h3>
          <span class="delta positive">Rev 1 Signed</span>
        </div>
        <div class="kpi-icon-wrap">🏷️</div>
      </div>
    </div>

    <!-- Executive Action 1: Costing Approval Sign-off -->
    <div class="content-card" style="margin-bottom: 22px;">
      <div class="card-header">
        <h3>💰 Repair Costing Approvals (Pending Executive Authorization)</h3>
        <span style="font-size: 12px; color: var(--emerald);">Country Manager Signature Verified</span>
      </div>
      <div class="table-responsive">
        <table class="erp-table">
          <thead>
            <tr>
              <th>Job Ref</th>
              <th>Customer</th>
              <th>Equipment</th>
              <th>Direct Cost</th>
              <th>Overhead (10%)</th>
              <th>Profit Margin (18%)</th>
              <th>Total Quote Price</th>
              <th>Executive Action</th>
            </tr>
          </thead>
          <tbody>
            ${erpState.jobs.filter(j => j.costing).map(j => {
              const subTotal = (j.costing && typeof j.costing.subTotalCost === 'number') ? j.costing.subTotalCost : (j.costing && j.costing.finalQuotationPrice ? j.costing.finalQuotationPrice * 0.72 : 3500);
              const overhead = (j.costing && typeof j.costing.overheadAmount === 'number') ? j.costing.overheadAmount : (subTotal * 0.10);
              const profit = (j.costing && typeof j.costing.profitMarginAmount === 'number') ? j.costing.profitMarginAmount : (subTotal * 0.18);
              const finalPrice = (j.costing && typeof j.costing.finalQuotationPrice === 'number') ? j.costing.finalQuotationPrice : (subTotal + overhead + profit);
              const isApproved = j.costing && j.costing.status && j.costing.status.includes('Approved');

              return `
              <tr>
                <td style="font-weight: 700; color: #38bdf8;">${j.id}</td>
                <td><strong>${j.customer}</strong></td>
                <td>${j.equipment}</td>
                <td>$${Number(subTotal).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td>$${Number(overhead).toFixed(2)}</td>
                <td style="color: #34d399; font-weight: 700;">$${Number(profit).toFixed(2)}</td>
                <td style="font-size: 14px; font-weight: 800; color: #fbbf24;">$${Number(finalPrice).toLocaleString()} USD</td>
                <td>
                  ${isApproved ? `
                    <span style="color: #34d399; font-weight: 700; font-size: 11px;">✓ CM Signed</span>
                  ` : `
                    <button class="quick-action-btn btn-success" style="padding: 4px 10px; font-size: 11px;" onclick="approveCostingByCM('${j.id}')">
                      ✓ CM Sign-off
                    </button>
                  `}
                </td>
              </tr>
            `}).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Executive Action 2: Purchase Order Sign-offs -->
    <div class="content-card">
      <div class="card-header">
        <h3>🛒 Purchase Orders Requiring Executive Approval</h3>
      </div>
      <div class="table-responsive">
        <table class="erp-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Job Reference</th>
              <th>PR Reference</th>
              <th>Supplier Name</th>
              <th>Order Amount ($)</th>
              <th>Approval State</th>
              <th>Executive Action</th>
            </tr>
          </thead>
          <tbody>
            ${erpState.purchaseOrders.map(po => `
              <tr>
                <td style="font-weight: 700; color: #38bdf8;">${po.poNo}</td>
                <td>${po.jobNo}</td>
                <td>${po.prNo}</td>
                <td>${po.supplier}</td>
                <td style="font-weight: 800;">$${po.amount.toLocaleString()}</td>
                <td><span class="status-pill ${getStatusClass(po.status)}">${po.status}</span></td>
                <td>
                  ${po.status.includes('Approved') ? `
                    <span style="color: #34d399; font-weight: 700; font-size: 12px;">✓ Signed by Marcus</span>
                  ` : `
                    <button class="quick-action-btn btn-success" style="padding: 4px 10px; font-size: 11px;" onclick="approvePO('${po.poNo}')">
                      Approve & Place Order ➔
                    </button>
                  `}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 3C. TECHNICIAN WORKSPACE (Wrench-Time, Stages & Rig Testing)
function getTechnicianConsoleHTML() {
  const myJob = erpState.jobs.find(j => j.id === 'J000248') || erpState.jobs[0];

  return `
    <div class="page-header">
      <div>
        <h2>Lead Technician Workshop Console</h2>
        <p>Active bay workbench, 3-stage dismantling & cleaning logs, and 350-Bar test rig calibration.</p>
      </div>
      <div>
        <button class="quick-action-btn btn-accent" onclick="toggleMobileSimulator()">📱 Open Mobile Frame</button>
      </div>
    </div>

    <!-- Technician Job Console Area -->
    <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 20px;">
      <!-- Assigned Jobs Selector -->
      <div class="content-card">
        <div class="card-header">
          <h3>👨‍🔧 Assigned to You</h3>
          <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 8px; border-radius: 8px;">2 Active</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${erpState.jobs.filter(j => j.leadTechnician.includes('Raj') || j.leadTechnician.includes('Chen')).map(j => `
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; cursor: pointer;"
                 onclick="loadTechnicianJobDetail('${j.id}')">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="color: #38bdf8;">${j.id}</strong>
                <span class="status-pill ${getStatusClass(j.status)}">${j.status}</span>
              </div>
              <div style="font-size: 13px; font-weight: 600; margin: 4px 0;">${j.equipment}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${j.customer} | Due: ${j.targetDate}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Execution Console for Job -->
      <div class="content-card" id="techJobConsoleArea">
        <div class="card-header">
          <div>
            <h3>Active Bench: Job #${myJob.id}</h3>
            <p style="font-size: 12px; color: var(--text-muted);">${myJob.equipment} (${myJob.model}) | S/N: ${myJob.serialNo}</p>
          </div>
          <span class="status-pill in-progress">Wrench-Time Active</span>
        </div>

        <div style="background: rgba(6, 182, 212, 0.08); border-left: 3px solid var(--cyan); padding: 12px; border-radius: 6px; margin-bottom: 16px;">
          <strong style="color: #38bdf8;">Required Steps:</strong>
          <p style="font-size: 12px; color: #cbd5e1; margin-top: 2px;">
            1. Stage 1 Dismantling complete. Verify internal cavity wear.<br>
            2. Stage 2 Solvent degreasing done.<br>
            3. Measure shaft runout and cylinder bore with micrometer; log photos.
          </p>
        </div>

        <!-- 3-Stage Cards -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 18px;">
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 10px;">
            <div style="display: flex; justify-content: space-between; font-weight: 700; color: #34d399; font-size: 11.5px;">
              <span>Stage 1: Dismantling</span>
              <span>✓ DONE</span>
            </div>
            <small style="color: #94a3b8; font-size: 10.5px;">Casing unbolted</small>
          </div>

          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 10px;">
            <div style="display: flex; justify-content: space-between; font-weight: 700; color: #34d399; font-size: 11.5px;">
              <span>Stage 2: Cleaning</span>
              <span>✓ DONE</span>
            </div>
            <small style="color: #94a3b8; font-size: 10.5px;">Ultrasonic cleaned</small>
          </div>

          <div style="background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.35); border-radius: 8px; padding: 10px;">
            <div style="display: flex; justify-content: space-between; font-weight: 700; color: #38bdf8; font-size: 11.5px;">
              <span>Stage 3: Inspection</span>
              <span>✓ 0.08mm</span>
            </div>
            <small style="color: #94a3b8; font-size: 10.5px;">Micrometer verified</small>
          </div>
        </div>

        <!-- Technician Actions -->
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="quick-action-btn btn-primary" onclick="openInspectionReportModal('${myJob.id}')">Initial Inspection Form</button>
          <button class="quick-action-btn btn-accent" onclick="openTechAssessmentModal('${myJob.id}')">Technical Assessment</button>
          <button class="quick-action-btn btn-success" onclick="openTestingModal('${myJob.id}')">Run 350-Bar Test Rig</button>
          <button class="quick-action-btn btn-outline" onclick="simulateAddPhoto('${myJob.id}')">📷 Attach Photo</button>
        </div>
      </div>
    </div>
  `;
}

// 3D. SALES EXECUTIVE DASHBOARD
function getSalesDashboardHTML() {
  return `
    <div class="page-header">
      <div>
        <h2>Sales & Commercial Management Hub</h2>
        <p>Customer enquiries, digital equipment handovers, quotations with revision control, and conversion to job.</p>
      </div>
      <div>
        <button class="quick-action-btn btn-primary" onclick="openNewEnquiryModal()">+ Create Customer Enquiry</button>
      </div>
    </div>

    <!-- Enquiries Register -->
    <div class="content-card" style="margin-bottom: 22px;">
      <div class="card-header">
        <h3>📩 Customer Enquiries Register (${erpState.enquiries.length})</h3>
      </div>
      <div class="table-responsive">
        <table class="erp-table">
          <thead>
            <tr>
              <th>Enquiry Ref</th>
              <th>Customer</th>
              <th>Contact Person</th>
              <th>Equipment</th>
              <th>Serial Number</th>
              <th>Status</th>
              <th>Sales Action</th>
            </tr>
          </thead>
          <tbody>
            ${erpState.enquiries.map(enq => `
              <tr>
                <td style="font-weight: 700; color: #38bdf8;">${enq.id}</td>
                <td><strong>${enq.customer}</strong></td>
                <td>${enq.contactPerson}</td>
                <td>${enq.equipment}</td>
                <td><code>${enq.serialNo}</code></td>
                <td><span class="status-pill ${getStatusClass(enq.status)}">${enq.status}</span></td>
                <td>
                  ${enq.status === 'Equipment Arrived' ? `
                    <button class="quick-action-btn btn-accent" style="padding: 3px 8px; font-size: 11px;" onclick="handoverToWorkshop('${enq.id}', '${enq.receiptNo}')">
                      Handover to Workshop ➔
                    </button>
                  ` : `
                    <span style="font-size: 11.5px; color: var(--text-dim);">${enq.status}</span>
                  `}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Quotations -->
    <div class="content-card">
      <div class="card-header">
        <h3>📑 Commercial Quotations with Revision & Discount Control</h3>
      </div>
      <div class="table-responsive">
        <table class="erp-table">
          <thead>
            <tr>
              <th>Quote Ref</th>
              <th>Revision</th>
              <th>Job ID</th>
              <th>Customer</th>
              <th>Amount ($)</th>
              <th>Discount Applied</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${erpState.jobs.filter(j => j.quotations && j.quotations.length > 0).map(j => {
              return j.quotations.map(q => `
                <tr>
                  <td style="font-weight: 700; color: #38bdf8;">${q.quoteNo}</td>
                  <td><strong>${q.version}</strong></td>
                  <td>${j.id}</td>
                  <td>${j.customer}</td>
                  <td style="font-weight: 800; color: #fbbf24;">$${(q.total || 0).toLocaleString()}</td>
                  <td>${q.discountPct}%</td>
                  <td><span class="status-pill ${getStatusClass(q.status)}">${q.status}</span></td>
                  <td>
                    <button class="quick-action-btn btn-outline" style="padding: 3px 8px; font-size: 11px;" onclick="viewQuotationDoc('${j.id}', '${q.quoteNo}')">PDF</button>
                    ${q.status.includes('Discount') ? `
                      <button class="quick-action-btn btn-accent" style="padding: 3px 8px; font-size: 11px;" onclick="openDiscountRevisionModal('${j.id}')">Revise</button>
                    ` : ''}
                    ${q.status.includes('Approved') && j.status === 'Quotation Pending' ? `
                      <button class="quick-action-btn btn-success" style="padding: 3px 8px; font-size: 11px;" onclick="convertQuoteToJob('${j.id}')">Convert to Job ➔</button>
                    ` : ''}
                  </td>
                </tr>
              `).join('');
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 3E. RECEIVING OFFICER HUB
function getReceivingHubHTML() {
  return `
    <div class="page-header">
      <div>
        <h2>Inward Equipment Receiving & Delivery Challans</h2>
        <p>Register arriving equipment, verify customer Delivery Notes (DN), log specifications, and attach inward photos.</p>
      </div>
      <div>
        <button class="quick-action-btn btn-primary" onclick="openReceiveEquipmentModal()">+ Receive Inward Equipment (DN)</button>
      </div>
    </div>

    <div class="content-card">
      <div class="card-header">
        <h3>📦 Registered Inward Receipts (${erpState.equipmentReceipts.length})</h3>
      </div>
      <div class="table-responsive">
        <table class="erp-table">
          <thead>
            <tr>
              <th>Receipt No</th>
              <th>Customer</th>
              <th>Equipment Type</th>
              <th>Model</th>
              <th>Serial Number</th>
              <th>Customer Inward DN</th>
              <th>Received By</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${erpState.equipmentReceipts.map(r => `
              <tr>
                <td style="font-weight: 700; color: #38bdf8;">${r.receiptNo}</td>
                <td><strong>${r.customer}</strong></td>
                <td>${r.equipmentType}</td>
                <td>${r.model}</td>
                <td><code>${r.serialNo}</code></td>
                <td><strong style="color: #fbbf24;">${r.inwardDeliveryNoteNo}</strong></td>
                <td>${r.receivedBy}</td>
                <td>
                  <button class="quick-action-btn btn-outline" style="padding: 3px 8px; font-size: 11px;" onclick="viewInwardDNDoc('${r.receiptNo}')">View Inward DN</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 3F. PURCHASER & STOREKEEPER HUB (Inventory, LGRN & Issuance)
function getInventoryPurchasingHTML() {
  return `
    <div class="page-header">
      <div>
        <h2>Warehouse Stores & Material Procurement</h2>
        <p>Spare parts inventory, Local Goods Received Notes (LGRN), and job material issuance tracking.</p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="quick-action-btn btn-primary" onclick="openLGRNModal()">+ Inward LGRN</button>
        <button class="quick-action-btn btn-success" onclick="openIssueMaterialModal()">Issue to Job</button>
      </div>
    </div>

    <!-- Stock Master -->
    <div class="content-card" style="margin-bottom: 22px;">
      <div class="card-header">
        <h3>📦 Spare Parts & Warehouse Stock Master</h3>
      </div>
      <div class="table-responsive">
        <table class="erp-table">
          <thead>
            <tr>
              <th>Part Code</th>
              <th>Description</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Min Stock</th>
              <th>Unit Cost ($)</th>
              <th>Warehouse Bin</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${erpState.inventory.map(item => `
              <tr>
                <td><code>${item.code}</code></td>
                <td><strong>${item.name}</strong></td>
                <td>${item.category}</td>
                <td style="font-weight: 700; color: ${item.stockQty <= item.minQty ? '#fb7185' : '#34d399'}; font-family: var(--font-mono);">
                  ${item.stockQty} ${item.uom}
                </td>
                <td>${item.minQty} ${item.uom}</td>
                <td>$${item.unitPrice.toFixed(2)}</td>
                <td><span class="rbac-tag">${item.location}</span></td>
                <td>
                  <button class="quick-action-btn btn-outline" style="padding: 3px 8px; font-size: 11px;" onclick="adjustStockModal('${item.code}')">Adjust</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Material Issuance Tracking -->
    <div class="content-card">
      <div class="card-header">
        <h3>🔄 Job Material Tracking (Requested vs Ordered vs Received vs Issued vs Consumed)</h3>
      </div>
      <div class="table-responsive">
        <table class="erp-table">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Part Description</th>
              <th>Req</th>
              <th>Ord</th>
              <th>Recv</th>
              <th>Issued</th>
              <th>Consumed</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${erpState.jobs.filter(j => j.materialRequest && j.materialRequest.items).map(j => {
              return j.materialRequest.items.map(it => `
                <tr>
                  <td style="font-weight: 700; color: #38bdf8;">${j.id}</td>
                  <td><strong>${it.desc}</strong></td>
                  <td>${it.requestedQty}</td>
                  <td>${it.orderedQty}</td>
                  <td>${it.receivedQty}</td>
                  <td style="color: #34d399; font-weight: 700;">${it.issuedQty}</td>
                  <td>${it.consumedQty}</td>
                  <td><span class="status-pill ${getStatusClass(it.status)}">${it.status}</span></td>
                </tr>
              `).join('');
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 3G. QA / QC INSPECTOR DASHBOARD
function getQADashboardHTML() {
  return `
    <div class="page-header">
      <div>
        <h2>Quality Assurance & Test Rig Certification</h2>
        <p>Independent verification of bench test readings, calibration curves, dual signatures, and pre-dispatch checklists.</p>
      </div>
      <div>
        <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 6px 12px; border-radius: 8px; font-weight: 800;">
          🔍 QA / QC AUDIT CLEARANCE ACTIVE
        </span>
      </div>
    </div>

    <div class="content-card" style="margin-bottom: 22px;">
      <div class="card-header">
        <h3>🎯 Bench Test Rig & Calibration Certificates</h3>
      </div>
      <div class="table-responsive">
        <table class="erp-table">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Equipment</th>
              <th>Customer</th>
              <th>Test Criteria</th>
              <th>Result</th>
              <th>Certificate No</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${erpState.jobs.filter(j => j.testing).map(j => `
              <tr>
                <td style="font-weight: 700; color: #38bdf8;">${j.id}</td>
                <td><strong>${j.equipment}</strong></td>
                <td>${j.customer}</td>
                <td>350 Bar / 120 LPM / 10 Min</td>
                <td><span class="status-pill ${getStatusClass(j.testing.status)}">${j.testing.status}</span></td>
                <td><code>${j.testing.certificateNo || 'Pending'}</code></td>
                <td>
                  <button class="quick-action-btn btn-success" style="padding: 3px 8px; font-size: 11px;" onclick="generateTestCertificatePDF('${j.id}')">Test Cert PDF</button>
                  <button class="quick-action-btn btn-danger" style="padding: 3px 8px; font-size: 11px;" onclick="triggerRework('${j.id}')">Rework</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="content-card">
      <div class="card-header">
        <h3>📋 Pre-Dispatch Inspection Audits</h3>
      </div>
      <div style="padding: 10px 0;">
        <button class="quick-action-btn btn-primary" onclick="openPreDispatchModal('J000248')">Verify Pre-Dispatch Checklist (Job #J000248) ➔</button>
      </div>
    </div>
  `;
}

// 3H. COMMON VIEWS (Operations, Enquiries, Assets, Settings)
// Full 10-step Operations workflow is defined in js/operations.js

function getAssignmentsViewHTML() {
  return `
    <div class="page-header">
      <div>
        <h2>Technician Allocation & Bay Scheduling</h2>
        <p>Assign lead technicians, target dates, and estimated labour hours.</p>
      </div>
    </div>
    <div class="content-card">
      <button class="quick-action-btn btn-primary" onclick="openJobAssignModal('J000248')">Open Assignment Dialog for Job #J000248 ➔</button>
    </div>
  `;
}

function getEnquiriesViewHTML() {
  return getSalesDashboardHTML();
}

function getQuotationsViewHTML() {
  return getSalesDashboardHTML();
}

function getInvoicingViewHTML() {
  return `
    <div class="page-header">
      <div>
        <h2>Outward Delivery Notes & Tax Invoicing</h2>
        <p>Equipment dispatch documents synchronized with approved job quotation and accounts ledger.</p>
      </div>
    </div>
    <div class="content-card">
      <button class="quick-action-btn btn-primary" onclick="openDeliveryInvoiceModal('J000248')">View Delivery Note & Invoice (Job #J000248) ➔</button>
    </div>
  `;
}

function getAssetsViewHTML() {
  return `
    <div class="page-header">
      <div>
        <h2>Equipment Master & Previous Service History</h2>
        <p>Serial Number, QR Code, and Barcode lookup for repeat equipment overhauls.</p>
      </div>
      <div>
        <button class="quick-action-btn btn-primary" onclick="simulateScanQR()">📷 Scan QR / Serial</button>
      </div>
    </div>

    <div class="content-card">
      <div class="table-responsive">
        <table class="erp-table" id="assetsTable">
          <thead>
            <tr>
              <th>Asset ID</th>
              <th>Serial Number</th>
              <th>Description</th>
              <th>Customer</th>
              <th>Last Service</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${erpState.assets.map(a => `
              <tr>
                <td style="font-weight: 700; color: #38bdf8;">${a.assetId}</td>
                <td><code>${a.serialNo}</code></td>
                <td><strong>${a.description}</strong></td>
                <td>${a.customer}</td>
                <td>${a.lastServiceDate}</td>
                <td>
                  <button class="quick-action-btn btn-outline" style="padding: 3px 8px; font-size: 11px;" onclick="viewAssetHistoryModal('${a.assetId}')">History</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function getReportsModuleHTML() {
  return `
    <div class="page-header">
      <div>
        <h2>Executive & Workshop Operations Reports</h2>
        <p>Daily workshop status, weekly technician performance, and monthly enquiry-to-job conversion funnels.</p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="quick-action-btn btn-outline" onclick="triggerEmailReportAlert()">📧 Email Management Report</button>
        <button class="quick-action-btn btn-primary" onclick="window.print()">🖨️ Export PDF</button>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px;">
      <div class="content-card">
        <div class="card-header"><h3>📅 Daily Workshop Status</h3></div>
        <p style="font-size: 12.5px; line-height: 1.8;">Active: <strong>${erpState.jobs.length + 143}</strong><br>In Assembly: <strong>6</strong><br>Completed Today: <strong>8</strong><br>Awaiting Parts: <strong>3</strong></p>
        <button class="quick-action-btn btn-outline" style="width: 100%; margin-top: 10px;" onclick="downloadCSVReport('daily')">Download CSV</button>
      </div>

      <div class="content-card">
        <div class="card-header"><h3>👥 Weekly Tech Performance</h3></div>
        <p style="font-size: 12.5px; line-height: 1.8;">Raj Kumar: <strong>12 Jobs (94% On-time)</strong><br>A. Chen: <strong>9 Jobs (100% On-time)</strong><br>M. Tariq: <strong>5 Jobs (88% On-time)</strong></p>
        <button class="quick-action-btn btn-outline" style="width: 100%; margin-top: 10px;" onclick="downloadCSVReport('weekly')">Download CSV</button>
      </div>

      <div class="content-card">
        <div class="card-header"><h3>📈 Monthly Conversion Funnel</h3></div>
        <p style="font-size: 12.5px; line-height: 1.8;">Enquiries: <strong>48</strong><br>Inspections: <strong>42 (87.5%)</strong><br>Quotes Sent: <strong>39 (81.2%)</strong><br>Jobs Won: <strong style="color: #34d399;">30 (62.5%)</strong></p>
        <button class="quick-action-btn btn-outline" style="width: 100%; margin-top: 10px;" onclick="downloadCSVReport('monthly')">Export Conversion</button>
      </div>
    </div>
  `;
}

function getSettingsModuleHTML() {
  return `
    <div class="page-header">
      <div>
        <h2>System Settings & Active RBAC Registry</h2>
        <p>Security sessions, user authorizations, and factory demo data reset.</p>
      </div>
      <div>
        <button class="quick-action-btn btn-danger" onclick="confirmResetData()">🔄 Reset to Factory Demo Data</button>
      </div>
    </div>

    <div class="content-card">
      <div class="card-header">
        <h3>👥 Registered RBAC Roles & Assigned Users</h3>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${Object.values(erpState.rbac).map(r => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px solid var(--border-color);">
            <div>
              <strong>${r.avatar} ${r.title}</strong> (${r.name})
              <div style="font-size: 11px; color: var(--text-muted);">${r.description}</div>
            </div>
            <button class="quick-action-btn btn-outline" style="padding: 3px 8px; font-size: 11px;" onclick="switchPersona('${r.key}')">Switch to Persona</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Helpers
function getStatusClass(status) {
  if (!status) return 'in-progress';
  const s = status.toLowerCase();
  if (s.includes('completed') || s.includes('passed') || s.includes('delivered')) return 'completed';
  if (s.includes('awaiting') || s.includes('delayed') || s.includes('parts')) return 'awaiting-parts';
  if (s.includes('production') || s.includes('assembly')) return 'in-production';
  if (s.includes('testing')) return 'testing';
  if (s.includes('hold') || s.includes('overdue')) return 'hold';
  return 'in-progress';
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'warning' ? '⚠️' : 'ℹ️'}</span> <div>${message}</div>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

function updateTopbarNotifications() {
  const badge = document.getElementById('notificationBadgeCount');
  const unreadCount = erpState.notifications ? erpState.notifications.filter(n => n.unread).length : 0;
  if (badge) {
    badge.textContent = unreadCount || 3;
    badge.style.display = unreadCount === 0 ? 'none' : 'flex';
  }

  // Update prominent Operations To-Do Pill Badge
  const todoBadge = document.getElementById('topbarTodoBadge');
  if (todoBadge) {
    const pendingTodos = erpState.todoList ? erpState.todoList.filter(t => !t.completed).length : 7;
    todoBadge.textContent = pendingTodos;
    todoBadge.style.display = pendingTodos === 0 ? 'none' : 'flex';
  }
}

function setupEventListeners() {
  const modal = document.getElementById('globalModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  const todoBtn = document.getElementById('topbarTodoBtn');
  if (todoBtn) {
    todoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof toggleTodoPanel === 'function') {
        toggleTodoPanel();
      }
    });
  }
}

function setupGlobalShortcuts() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const input = document.getElementById('globalSearchInput');
      if (input) input.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu-wrapper')) {
      closeUserDropdown();
    }
    if (!e.target.closest('.icon-badge-btn') && !e.target.closest('#notificationPanelCard')) {
      const notif = document.getElementById('notificationPanelCard');
      if (notif) notif.classList.remove('active');
    }
  });
}

function openModal() {
  const modal = document.getElementById('globalModal');
  if (modal) modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('globalModal');
  if (modal) modal.classList.remove('active');
}

function toggleUserDropdown() {
  const menu = document.getElementById('userDropdownCard');
  if (menu) menu.classList.toggle('active');
  const notif = document.getElementById('notificationPanelCard');
  if (notif) notif.classList.remove('active');
}

function closeUserDropdown() {
  const menu = document.getElementById('userDropdownCard');
  if (menu) menu.classList.remove('active');
}

function toggleNotificationPanel() {
  const notif = document.getElementById('notificationPanelCard');
  if (!notif) return;
  notif.classList.toggle('active');
  const menu = document.getElementById('userDropdownCard');
  if (menu) menu.classList.remove('active');
  if (notif.classList.contains('active')) {
    renderNotificationList();
  }
}

function renderNotificationList() {
  const container = document.getElementById('notifListContainer');
  if (!container) return;

  container.innerHTML = erpState.notifications.map(n => `
    <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="markSingleNotifRead(${n.id})">
      <div style="font-weight: 700; font-size: 12px; color: #ffffff;">${n.title}</div>
      <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${n.desc}</div>
    </div>
  `).join('');
}

function markAllNotificationsRead() {
  erpState.notifications.forEach(n => n.unread = false);
  saveERPData(erpState);
  renderNotificationList();
  updateTopbarNotifications();
  showToast('Notifications marked read', 'info');
}

function markSingleNotifRead(id) {
  const n = erpState.notifications.find(x => x.id === id);
  if (n) n.unread = false;
  saveERPData(erpState);
  renderNotificationList();
  updateTopbarNotifications();
}

function confirmResetData() {
  if (confirm('Reset demo state to factory defaults?')) {
    erpState = resetERPData();
    checkAuthAndInitialize();
    showToast('Factory demo data restored!', 'success');
  }
}

function handleUserLogout() {
  closeUserDropdown();
  erpState.auth.isAuthenticated = false;
  saveERPData(erpState);
  showToast('Signed out successfully', 'info');
  checkAuthAndInitialize();
}

function switchAuthTab(tab) {
  const loginSec = document.getElementById('loginFormSection');
  const regSec = document.getElementById('registerFormSection');
  const tabSignIn = document.getElementById('tabSignInBtn');
  const tabRegister = document.getElementById('tabRegisterBtn');

  if (tab === 'login') {
    if (loginSec) loginSec.style.display = 'block';
    if (regSec) regSec.style.display = 'none';
    if (tabSignIn) tabSignIn.classList.add('active');
    if (tabRegister) tabRegister.classList.remove('active');
  } else {
    if (loginSec) loginSec.style.display = 'none';
    if (regSec) regSec.style.display = 'block';
    if (tabSignIn) tabSignIn.classList.remove('active');
    if (tabRegister) tabRegister.classList.add('active');
  }
}

function handleAuthLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  let foundUser = erpState.users.find(u => u.email.toLowerCase() === email);

  if (!foundUser) {
    if (email.includes('country') || email.includes('director') || email.includes('marcus')) {
      foundUser = erpState.users.find(u => u.roleKey === 'country_manager');
    } else if (email.includes('sale') || email.includes('alex')) {
      foundUser = erpState.users.find(u => u.roleKey === 'sales');
    } else if (email.includes('receiv') || email.includes('carter')) {
      foundUser = erpState.users.find(u => u.roleKey === 'receiving');
    } else if (email.includes('tech') || email.includes('raj')) {
      foundUser = erpState.users.find(u => u.roleKey === 'technician');
    } else if (email.includes('purchas') || email.includes('store') || email.includes('vance')) {
      foundUser = erpState.users.find(u => u.roleKey === 'purchaser');
    } else if (email.includes('qa') || email.includes('inspect') || email.includes('doe')) {
      foundUser = erpState.users.find(u => u.roleKey === 'qa_inspector');
    } else {
      foundUser = erpState.users[0];
    }
  }

  erpState.auth.isAuthenticated = true;
  switchPersona(foundUser.roleKey);
  showToast(`Authenticated as ${foundUser.name} (${foundUser.role})`, 'success');
  checkAuthAndInitialize();
}

function quickLoginRole(roleKey) {
  erpState.auth.isAuthenticated = true;
  switchPersona(roleKey);
  saveERPData(erpState);
  checkAuthAndInitialize();
}

function handleAuthRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const empId = document.getElementById('regEmpId').value.trim();
  const roleKey = document.getElementById('regRole').value;
  const roleConfig = erpState.rbac[roleKey];

  const newUser = {
    id: 'USR-' + Math.floor(100 + Math.random() * 900),
    name: name,
    email: email,
    empId: empId,
    roleKey: roleKey,
    role: roleConfig.title,
    avatar: roleConfig.avatar,
    badge: roleConfig.department,
    department: roleConfig.department
  };

  erpState.users.unshift(newUser);
  erpState.auth.isAuthenticated = true;
  erpState.currentUser = newUser;
  saveERPData(erpState);
  showToast(`Account registered for ${name}!`, 'success');
  checkAuthAndInitialize();
}

function filterJobsTable(query) {
  const q = query.toLowerCase().trim();
  const rows = document.querySelectorAll('.erp-table tbody tr');
  rows.forEach(r => {
    const text = r.textContent.toLowerCase();
    r.style.display = text.includes(q) ? '' : 'none';
  });
}

function filterAssetsTable(query) {
  filterJobsTable(query);
}

function simulateScanQR() {
  const serials = ['HP778321', 'HPU-45821', 'VLV-1187', 'HCY-9021'];
  const picked = serials[Math.floor(Math.random() * serials.length)];
  const input = document.getElementById('globalSearchInput');
  if (input) {
    input.value = picked;
    filterJobsTable(picked);
  }
  showToast(`QR Code Scanned! Identified Serial Number: ${picked}`, 'success');
}

function simulateAddPhoto(jobId) {
  showToast(`Live Camera Capture: High resolution inspection photo attached to Job #${jobId}!`, 'success');
}

function downloadCSVReport(type) {
  const csvContent = "data:text/csv;charset=utf-8,Job_No,Customer,Equipment,Status,Date\nJ000248,Riverside Plant,Hydraulic Pump,In Progress,2026-11-24\nJ000247,Summit Mining,Hydraulic Cylinder,Awaiting Parts,2026-11-22";
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `NEXUS_ERP_${type}_Report.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Exported ${type} report to CSV successfully!`, 'success');
}

function triggerEmailReportAlert() {
  showToast('Automated Management Report dispatched to Country Manager!', 'success');
}

function toggleMobileSimulator() {
  const frame = document.getElementById('mobileSimulatorFrame');
  if (frame) frame.classList.toggle('open');
}

// Dialog Launchers
function openNewEnquiryModal() {
  enforcePermission('create_enquiry', () => {
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    const footer = document.getElementById('modalFooter');
    title.textContent = "Create Customer Enquiry";
    body.innerHTML = `
      <div class="form-grid">
        <div class="form-group"><label>Customer Name</label><input type="text" id="mCust" value="Petro Energy Ltd"></div>
        <div class="form-group"><label>Equipment</label><input type="text" id="mEquip" value="Directional Control Valve"></div>
        <div class="form-group"><label>Model</label><input type="text" id="mModel" value="PVG-32"></div>
        <div class="form-group"><label>Serial Number</label><input type="text" id="mSerial" value="VLV-9921"></div>
        <div class="form-group col-span-2"><label>Complaint</label><textarea id="mComp" rows="2">Internal spool sticking and actuator sluggishness.</textarea></div>
      </div>
    `;
    footer.innerHTML = `
      <button class="quick-action-btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="quick-action-btn btn-primary" onclick="handleNewEnquirySave()">Save Enquiry</button>
    `;
    openModal();
  });
}

function handleNewEnquirySave() {
  const enqId = 'ENQ-2026-' + Math.floor(100 + Math.random() * 900);
  erpState.enquiries.unshift({
    id: enqId,
    customer: document.getElementById('mCust').value,
    equipment: document.getElementById('mEquip').value,
    model: document.getElementById('mModel').value,
    serialNo: document.getElementById('mSerial').value,
    complaint: document.getElementById('mComp').value,
    status: 'Pending Receiving',
    contactPerson: 'Alex Turner'
  });
  saveERPData(erpState);
  closeModal();
  showToast(`Enquiry ${enqId} registered!`, 'success');
  renderCurrentTab();
}

function openReceiveEquipmentModal() {
  enforcePermission('register_equipment', () => {
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    const footer = document.getElementById('modalFooter');
    title.textContent = "Receive Inward Equipment & Customer DN";
    body.innerHTML = `
      <div class="form-grid">
        <div class="form-group"><label>Receipt No</label><input type="text" value="ER000250" readonly></div>
        <div class="form-group"><label>Customer Inward DN</label><input type="text" id="mDN" value="DN-CUST-8812"></div>
        <div class="form-group"><label>Customer</label><input type="text" id="mRCust" value="Riverside Plant"></div>
        <div class="form-group"><label>Equipment</label><input type="text" id="mREquip" value="Hydraulic Pump"></div>
        <div class="form-group"><label>Serial Number</label><input type="text" id="mRSerial" value="HP778321"></div>
        <div class="form-group col-span-2"><label>Remarks</label><textarea rows="2">Received on pallet with customer DN attached.</textarea></div>
      </div>
    `;
    footer.innerHTML = `
      <button class="quick-action-btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="quick-action-btn btn-primary" onclick="handleInwardReceiveSave()">Register Receipt</button>
    `;
    openModal();
  });
}

function handleInwardReceiveSave() {
  erpState.equipmentReceipts.unshift({
    receiptNo: 'ER000250',
    customer: document.getElementById('mRCust').value,
    equipmentType: document.getElementById('mREquip').value,
    model: 'PVP333',
    serialNo: document.getElementById('mRSerial').value,
    inwardDeliveryNoteNo: document.getElementById('mDN').value,
    receivedBy: erpState.currentUser.name
  });
  saveERPData(erpState);
  closeModal();
  showToast('Inward receipt registered!', 'success');
  renderCurrentTab();
}

function openJobAssignModal(jobId) {
  enforcePermission('assign_technician', () => {
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    const footer = document.getElementById('modalFooter');
    title.textContent = `Assign Technician: ${jobId}`;
    body.innerHTML = `
      <div class="form-grid">
        <div class="form-group"><label>Job ID</label><input type="text" value="${jobId}" readonly></div>
        <div class="form-group"><label>Lead Technician</label>
          <select id="mLeadTech">
            <option value="Raj Kumar">Raj Kumar (Senior Specialist)</option>
            <option value="A. Chen">A. Chen (Tolerance Lead)</option>
          </select>
        </div>
        <div class="form-group col-span-2"><label>Instructions</label><textarea rows="2">Dismantle casing safely & measure runout.</textarea></div>
      </div>
    `;
    footer.innerHTML = `
      <button class="quick-action-btn btn-outline" onclick="closeModal()">Cancel</button>
      <button class="quick-action-btn btn-primary" onclick="handleAssignSave('${jobId}')">Save Assignment</button>
    `;
    openModal();
  });
}

function handleAssignSave(jobId) {
  const job = erpState.jobs.find(j => j.id === jobId);
  if (job) {
    job.leadTechnician = document.getElementById('mLeadTech').value;
    job.status = 'Inspection Assigned';
  }
  saveERPData(erpState);
  closeModal();
  showToast(`Job ${jobId} assigned!`, 'success');
  renderCurrentTab();
}

function openCostEstimationModal(jobId) {
  const job = erpState.jobs.find(j => j.id === jobId) || erpState.jobs[0];
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');
  const footer = document.getElementById('modalFooter');
  title.textContent = `Repair Cost Estimation: ${job.id}`;
  body.innerHTML = `
    <div style="font-size: 13px;">
      <p style="margin-bottom: 12px; color: var(--text-muted);">Direct BOM & labour cost formulation with overheads & margin.</p>
      <table class="erp-table" style="margin-bottom: 16px;">
        <tr><td>Direct Materials & Spare Parts:</td><td><strong>$3,130.00</strong></td></tr>
        <tr><td>Technician Labour (18 hrs @ $85):</td><td><strong>$1,530.00</strong></td></tr>
        <tr><td>Precision CNC Machining:</td><td><strong>$1,190.00</strong></td></tr>
        <tr><td>Testing Rig & External Outsourcing:</td><td><strong>$800.00</strong></td></tr>
        <tr><td>Overhead (10%):</td><td><strong>$665.00</strong></td></tr>
        <tr><td>Profit Margin (18%):</td><td style="color: #34d399; font-weight: 700;">$1,376.55</td></tr>
        <tr style="background: rgba(6, 182, 212, 0.1); font-size: 15px; font-weight: 800;">
          <td>Total Quotation Price:</td><td style="color: #fbbf24;">$9,024.05 USD</td>
        </tr>
      </table>
    </div>
  `;
  footer.innerHTML = `
    <button class="quick-action-btn btn-outline" onclick="closeModal()">Close</button>
    <button class="quick-action-btn btn-success" onclick="approveCostingByCM('${job.id}')">Approve Costing (CM Sign-off)</button>
  `;
  openModal();
}

function approveCostingByCM(jobId) {
  enforcePermission('approve_repair_costing', () => {
    const job = erpState.jobs.find(j => j.id === jobId);
    if (job && job.costing) {
      job.costing.status = 'Approved by Country Manager';
      job.costing.approvedBy = 'Marcus Sterling (Country Manager)';
    }
    saveERPData(erpState);
    closeModal();
    showToast(`Repair costing for ${jobId} approved by Country Manager! Sales notified.`, 'success');
    renderCurrentTab();
  });
}

function approvePO(poNo) {
  enforcePermission('approve_purchase_orders', () => {
    const po = erpState.purchaseOrders.find(p => p.poNo === poNo);
    if (po) {
      po.status = 'Approved & Placed';
      po.approvedBy = 'Marcus Sterling (Country Manager)';
    }
    saveERPData(erpState);
    showToast(`PO ${poNo} approved by Country Manager!`, 'success');
    renderCurrentTab();
  });
}

function generateTestCertificatePDF(jobId) {
  const job = erpState.jobs.find(j => j.id === jobId) || erpState.jobs[0];
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');
  const footer = document.getElementById('modalFooter');
  title.textContent = "Official Equipment Quality & Test Certificate";
  body.innerHTML = `
    <div class="printable-doc">
      <div class="doc-header-strip">
        <div class="doc-logo">
          <h2>NEXUS INDUSTRIAL OVERHAUL & TESTING RIG</h2>
          <small style="color: var(--text-muted);">Accredited 350-Bar Hydrostatic & Dynamic Test Laboratory</small>
        </div>
        <div style="text-align: right;">
          <h1>TEST CERTIFICATE</h1>
          <span style="color: var(--emerald); font-weight: 800;">CERT: TC-2026-883</span>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <p><strong>Job Ref:</strong> ${job.id}</p>
          <p><strong>Equipment:</strong> ${job.equipment} (${job.model})</p>
          <p><strong>Serial No:</strong> <code>${job.serialNo}</code></p>
          <p><strong>Customer:</strong> ${job.customer}</p>
          <p><strong>Test Pressure Applied:</strong> <span style="color: var(--cyan); font-weight: 800;">350 Bar (10 Mins Sustained)</span></p>
        </div>
        <div class="passed-stamp">PASSED</div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border-top: 1px solid var(--border-color); padding-top: 16px;">
        <div class="signature-box">
          <small>LEAD TECHNICIAN AUTHENTICATED SIGN-OFF</small>
          <div class="sig-font">Raj Kumar</div>
          <small style="color: var(--emerald);">✓ Verified ID: NEX-EMP-9082</small>
        </div>
        <div class="signature-box">
          <small>QA / QC INSPECTION SIGN-OFF</small>
          <div class="sig-font">John Doe</div>
          <small style="color: var(--emerald);">✓ Verified QA Clear: NEX-EMP-1031</small>
        </div>
      </div>
    </div>
  `;
  footer.innerHTML = `
    <button class="quick-action-btn btn-outline" onclick="closeModal()">Close</button>
    <button class="quick-action-btn btn-primary" onclick="window.print()">Print Test Certificate PDF</button>
  `;
  openModal();
}

function openInspectionReportModal(jobId) {
  const job = erpState.jobs.find(j => j.id === jobId) || erpState.jobs[0];
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');
  const footer = document.getElementById('modalFooter');
  title.textContent = `Initial Inspection Report: ${job.id}`;
  body.innerHTML = `
    <div class="printable-doc">
      <div class="doc-header-strip">
        <div><h2>NEXUS OVERHAUL SERVICES</h2></div>
        <div><h3>INITIAL INSPECTION REPORT</h3></div>
      </div>
      <p><strong>Equipment:</strong> ${job.equipment} - S/N: ${job.serialNo}</p>
      <p><strong>Findings:</strong> Shaft scoring on seal journal; bearing raceway flaking. Viton lip seals cracked.</p>
      <p><strong>Recommendation:</strong> Replace rotating group and seal kit; precision lap port plate.</p>
    </div>
  `;
  footer.innerHTML = `<button class="quick-action-btn btn-outline" onclick="closeModal()">Close</button>`;
  openModal();
}

function openTechAssessmentModal(jobId) {
  openCostEstimationModal(jobId);
}

function openTestingModal(jobId) {
  generateTestCertificatePDF(jobId);
}

function openPreDispatchModal(jobId) {
  showToast('Pre-dispatch checklist verified and approved by QA Inspector!', 'success');
}

function openDeliveryInvoiceModal(jobId) {
  showToast('Delivery note and tax invoice generated!', 'success');
}

function viewJobWorkflowDetails(jobId) {
  openCostEstimationModal(jobId);
}

function viewInwardDNDoc(recNo) {
  showToast(`Inward Delivery Note for ${recNo} displayed.`, 'info');
}

function viewQuotationDoc(jobId) {
  showToast(`Quotation document for ${jobId} displayed.`, 'info');
}

function viewAssetHistoryModal(astId) {
  showToast(`Asset historical overhaul log for ${astId} loaded.`, 'info');
}

function openLGRNModal() {
  enforcePermission('create_lgrn', () => {
    showToast('LGRN created! Stock quantities updated.', 'success');
  });
}

function openIssueMaterialModal() {
  enforcePermission('issue_material_to_job', () => {
    showToast('Spare parts issued to Lead Technician against Job Number!', 'success');
  });
}

function adjustStockModal(code) {
  enforcePermission('adjust_stock_inventory', () => {
    showToast(`Stock updated for ${code}.`, 'success');
  });
}

function handoverToWorkshop(enqId) {
  enforcePermission('handover_to_workshop', () => {
    showToast(`Enquiry ${enqId} handed over digitally to Workshop Manager!`, 'success');
    const enq = erpState.enquiries.find(e => e.id === enqId);
    if (enq) enq.status = 'Handed over to Workshop';
    saveERPData(erpState);
    renderCurrentTab();
  });
}

function convertQuoteToJob(jobId) {
  enforcePermission('convert_job_to_service', () => {
    showToast(`Job ${jobId} confirmed by customer and converted to Service Job!`, 'success');
    renderCurrentTab();
  });
}

function openDiscountRevisionModal(jobId) {
  enforcePermission('request_discount', () => {
    showToast(`Commercial discount request for ${jobId} submitted to Country Manager!`, 'info');
  });
}

function triggerRework(jobId) {
  enforcePermission('reject_for_rework_retest', () => {
    showToast(`Job ${jobId} flagged for rework and retest by QA Inspector.`, 'warning');
    const job = erpState.jobs.find(j => j.id === jobId);
    if (job) job.status = 'Rework Required';
    saveERPData(erpState);
    renderCurrentTab();
  });
}
