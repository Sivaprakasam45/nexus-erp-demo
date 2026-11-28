/**
 * NEXUS Industrial Overhaul & Service ERP - Operations Workflow & Execution Module
 * Implements:
 * 1. 10-Step Operations Workflow matching Excel sheets:
 *    1. Receiving (Pic intake, Inward DN upload, Equipment details)
 *    2. Initial Inspection & 2.1 Assessment (Findings, proofing photos, PDF generation, Authenticated Digital Signatures)
 *    2.2 Cost Estimations (BOM costing table, 18% margin, Email to Sales Person)
 *    3. Assign Job (Technician assignment, bay scheduling, PO status)
 *    4. Assembly Checklist (Wrench time tracking, 8-point assembly checks)
 *    5. Test Report (350-bar rig test parameters, pass/fail certification)
 *    5.1 3rd Party Certificates (Bureau Veritas, DNV, ABS)
 *    6. Pre-dispatch Inspection (QA cleaning, painting, tagging)
 *    7. Delivery Note & 8. Invoice (Outward DN & commercial invoice)
 * 2. Service Desk Job Execution Cards matching Video (WhatsApp_Video_2026-11-27_at_23.43.29.mp4):
 *    Bore, Rod, Stroke, Test Pressure, Problem, Seal Kit, Labour Charge, Parts used from stock, Stage filters
 * 3. Quick Action Operations To-Do Queue Drawer (Marked in user screenshot)
 */

// ==========================================
// 1. OPERATIONS MODULE ROOT RENDERER
// ==========================================
function getOperationsModuleHTML() {
  const activeJobId = selectedOpJobId || (erpState.jobs[0] ? erpState.jobs[0].id : 'J000248');
  const job = erpState.jobs.find(j => j.id === activeJobId) || erpState.jobs[0];

  const opSteps = [
    { id: 'receiving', num: '1', title: '1. Receiving', icon: '📥' },
    { id: 'initial_inspection', num: '2', title: '2. Initial Inspection & 2.1 Assessment', icon: '🔍' },
    { id: 'cost_estimations', num: '2.2', title: '2.2 Cost estimations', icon: '💰' },
    { id: 'assign_job', num: '3', title: '3. Assign Job', icon: '👷' },
    { id: 'assembly_checklist', num: '4', title: '4. Assembly Check list', icon: '🔧' },
    { id: 'test_report', num: '5', title: '5. Test Report', icon: '⚡' },
    { id: 'third_party_certs', num: '5.1', title: '5.1 3rd party certs', icon: '📜' },
    { id: 'pre_dispatch', num: '6', title: '6. Pre dispatch Inspection', icon: '📋' },
    { id: 'delivery_note', num: '7', title: '7. DN', icon: '🚚' },
    { id: 'invoice', num: '8', title: '8. Invoice', icon: '🧾' }
  ];

  const pendingTodos = (erpState.todoList || []).filter(t => !t.completed).length;

  return `
    <!-- Top Operations Header -->
    <div class="page-header" style="flex-wrap: wrap; gap: 16px; margin-bottom: 20px;">
      <div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 26px;">⚙️</span>
          <div>
            <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #fff;">Operations & Workshop Execution</h2>
            <p style="margin: 2px 0 0; font-size: 13px; color: #94a3b8;">
              End-to-end industrial workflow: Inward Receiving ➔ Technical Inspection ➔ Costing ➔ Assembly ➔ Testing ➔ Dispatch
            </p>
          </div>
        </div>
      </div>
      
      <!-- Right Controls: Job Selector & Action Buttons -->
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
        <!-- Active Job Selector -->
        <div style="display: flex; align-items: center; gap: 8px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.12); padding: 4px 10px; border-radius: 8px;">
          <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700;">Active Job:</span>
          <select class="erp-select" style="background: transparent; border: none; color: #38bdf8; font-weight: 700; font-size: 13px; cursor: pointer; padding: 4px 0;" onchange="selectOpJob(this.value)">
            ${erpState.jobs.map(j => `
              <option value="${j.id}" ${j.id === activeJobId ? 'selected' : ''} style="background: #0f172a; color: #fff;">
                ${j.id} - ${j.customer} (${j.equipment})
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Video Flow: New Job Card Button -->
        <button class="quick-action-btn btn-primary" onclick="openNewJobCardModal()" style="padding: 8px 14px; font-size: 12.5px;">
          <span>➕</span> New Job Card
        </button>

        <!-- To-Do Queue Drawer Button -->
        <button class="quick-action-btn btn-outline" onclick="toggleTodoPanel()" style="padding: 8px 14px; font-size: 12.5px; border-color: rgba(6, 182, 212, 0.4); color: #38bdf8;">
          <span>📋</span> To-Do Tasks (${pendingTodos})
        </button>
      </div>
    </div>

    <!-- Job Context Summary Banner -->
    <div class="content-card" style="padding: 12px 18px; margin-bottom: 20px; background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.6) 100%); border-left: 4px solid #38bdf8;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
          <div>
            <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Job Number</span>
            <div style="font-size: 15px; font-weight: 800; color: #38bdf8;">${job.id}</div>
          </div>
          <div style="height: 24px; width: 1px; background: rgba(255, 255, 255, 0.1);"></div>
          <div>
            <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Customer</span>
            <div style="font-size: 14px; font-weight: 700; color: #f1f5f9;">${job.customer}</div>
          </div>
          <div style="height: 24px; width: 1px; background: rgba(255, 255, 255, 0.1);"></div>
          <div>
            <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Equipment & Model</span>
            <div style="font-size: 14px; font-weight: 700; color: #f1f5f9;">${job.equipment} <span style="font-size: 12px; color: #94a3b8;">(${job.model || 'Heavy-Duty'})</span></div>
          </div>
          <div style="height: 24px; width: 1px; background: rgba(255, 255, 255, 0.1);"></div>
          <div>
            <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Serial Number</span>
            <div style="font-size: 13px; font-family: monospace; color: #a5f3fc;">${job.serialNumber || '2026-HC-8912'}</div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <span style="font-size: 12px; color: #cbd5e1;">Assigned: <strong>${job.technician || 'Raj Kumar'}</strong></span>
          <span class="badge ${job.status.includes('Completed') ? 'badge-success' : 'badge-info'}" style="padding: 5px 12px; font-size: 12px;">
            ${job.status}
          </span>
          <button class="quick-action-btn btn-primary" onclick="openFullJobReportModal('${job.id}')" style="padding: 5px 12px; font-size: 12px;">
            <span>📄</span> Full Job Report
          </button>
        </div>
      </div>
    </div>

    <!-- Video Workflow Stage Tracker Strip (From WhatsApp Video Demonstration) -->
    <div class="stage-strip-container">
      <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; align-self: center; margin-right: 6px;">
        STAGES:
      </span>
      ${[
        { id: 'receiving', title: 'Receiving', icon: '📥' },
        { id: 'dismantling', title: 'Dismantling', icon: '🔩' },
        { id: 'cleaning', title: 'Cleaning', icon: '🧼' },
        { id: 'initial_inspection', title: 'Inspection', icon: '🔍' },
        { id: 'cost_estimations', title: 'Repair and quote', icon: '💰' },
        { id: 'assembly_checklist', title: 'Repair', icon: '🔧' },
        { id: 'test_report', title: 'Testing', icon: '⚡' },
        { id: 'pre_dispatch', title: 'Pre-dispatch', icon: '📋' }
      ].map(stg => `
        <button class="stage-strip-pill ${(currentOpStep || 'receiving') === stg.id ? 'active' : ''}" onclick="switchOpStep('${stg.id}')">
          <span>${stg.icon}</span> ${stg.title}
        </button>
      `).join('')}
    </div>

    <!-- 10-Step Operations Horizontal Stepper Bar (Matching Excel Sheet Tabs) -->
    <div class="operations-stepper-bar">
      ${opSteps.map(step => {
        const isActive = (currentOpStep || 'receiving') === step.id;
        return `
          <button class="stepper-btn ${isActive ? 'active' : ''}" onclick="switchOpStep('${step.id}')">
            <span class="step-num">${step.num}</span>
            <span class="step-title">${step.title}</span>
          </button>
        `;
      }).join('')}
    </div>

    <!-- Active Step Work Area (Matching Excel Sheet Content) -->
    <div id="opStepWorkArea">
      ${getOpStepContentHTML(currentOpStep || 'receiving', job)}
    </div>

    <!-- Separator -->
    <div style="margin: 40px 0 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);"></div>

    <!-- Service Desk Job Execution Cards Section (From Video Demonstration) -->
    <div class="section-title-wrap" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <div>
        <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: #fff;">
          📱 Service Desk Job Execution Cards
        </h3>
        <p style="margin: 2px 0 0; font-size: 12px; color: #94a3b8;">
          Live workshop job cards with mechanical dimensions (Bore, Rod, Stroke, Pressure), parts consumed from stock & stage tracking.
        </p>
      </div>

      <!-- Stage Filters Matching Video Bar -->
      <div class="job-stages-bar" style="margin-bottom: 0;">
        ${['all', 'Received', 'Inspection', 'Repair', 'Testing', 'Delivered'].map(stage => {
          const isActive = (currentJobStageFilter || 'all') === stage.toLowerCase();
          return `
            <button class="job-stage-pill ${isActive ? 'active' : ''}" onclick="filterJobStage('${stage.toLowerCase()}')">
              ${stage === 'all' ? 'All Jobs' : stage}
            </button>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Job Cards Grid (Video Flow) -->
    <div class="job-cards-grid">
      ${getVideoJobCardsHTML(currentJobStageFilter || 'all')}
    </div>
  `;
}

// Switch between the 10 Operations Steps
function switchOpStep(stepId) {
  currentOpStep = stepId;
  const workArea = document.getElementById('opStepWorkArea');
  const job = erpState.jobs.find(j => j.id === (selectedOpJobId || 'J000248')) || erpState.jobs[0];
  
  // Update stepper buttons
  document.querySelectorAll('.operations-stepper-bar .stepper-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = Array.from(document.querySelectorAll('.operations-stepper-bar .stepper-btn')).find(b => b.onclick && b.onclick.toString().includes(stepId));
  if (activeBtn) activeBtn.classList.add('active');

  if (workArea) {
    workArea.innerHTML = getOpStepContentHTML(stepId, job);
  } else {
    renderCurrentTab();
  }
}

// Select Active Job in Operations View
function selectOpJob(jobId) {
  selectedOpJobId = jobId;
  renderCurrentTab();
  showToast(`Switched active context to Job #${jobId}`, 'info');
}

// Filter Job Cards by Stage (from video demonstration)
function filterJobStage(stageKey) {
  currentJobStageFilter = stageKey;
  renderCurrentTab();
}

// ==========================================
// 2. DISPATCHER FOR THE 10 OPERATIONS STEPS
// ==========================================
function getOpStepContentHTML(stepId, job) {
  switch (stepId) {
    case 'receiving':
      return getOpStepReceivingHTML(job);
    case 'dismantling':
      return getOpStepDismantlingHTML(job);
    case 'cleaning':
      return getOpStepCleaningHTML(job);
    case 'initial_inspection':
      return getOpStepInspectionHTML(job);
    case 'cost_estimations':
      return getOpStepCostingHTML(job);
    case 'assign_job':
      return getOpStepAssignHTML(job);
    case 'assembly_checklist':
      return getOpStepAssemblyHTML(job);
    case 'test_report':
      return getOpStepTestHTML(job);
    case 'third_party_certs':
      return getOpStepThirdPartyHTML(job);
    case 'pre_dispatch':
      return getOpStepPreDispatchHTML(job);
    case 'delivery_note':
      return getOpStepDeliveryNoteHTML(job);
    case 'invoice':
      return getOpStepInvoiceHTML(job);
    default:
      return getOpStepReceivingHTML(job);
  }
}

// ==========================================
// 2A. STEP 1: RECEIVING (Image: ffff5d2e)
// ==========================================
function getOpStepReceivingHTML(job) {
  return `
    <div class="op-sheet-card">
      <div class="op-sheet-header">
        <div>
          <span class="badge badge-info" style="margin-bottom: 6px; font-weight: 800;">STAGE 1 • INWARD VERIFICATION</span>
          <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #fff;">1. Equipment Receiving & Inward Registration</h3>
          <p style="margin: 2px 0 0; font-size: 12px; color: #94a3b8;">
            Register customer delivery, verify equipment specifications, upload signed inward note, and capture physical intake photos.
          </p>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="quick-action-btn btn-primary" onclick="openStageReportModal('receiving', '${job.id}')">
            <span>📑</span> Stage Report
          </button>
          <button class="quick-action-btn btn-outline" onclick="showToast('Inward Receiving Slip printed!', 'info')">
            <span>🖨️</span> Print Slip
          </button>
          <button class="quick-action-btn btn-success" onclick="handoverToWorkshop('${job.enquiryId || 'ENQ-2026-088'}')">
            <span>🤝</span> Digital Handover to Workshop
          </button>
        </div>
      </div>

      <!-- Top Metadata Grid matching uploaded Excel Sheet -->
      <div class="sheet-meta-grid">
        <div class="sheet-meta-item">
          <label>Job/Enquiry Number:</label>
          <div class="val" style="color: #38bdf8;">${job.id} / ${job.enquiryId || 'ENQ-2026-088'}</div>
        </div>
        <div class="sheet-meta-item">
          <label>Receiving Date:</label>
          <div class="val">24-Nov-2026 09:15 AM</div>
        </div>
        <div class="sheet-meta-item">
          <label>Client Receipt No:</label>
          <div class="val">CRN-88219</div>
        </div>
        <div class="sheet-meta-item">
          <label>Sales Person:</label>
          <div class="val">${job.salesPerson || 'David Miller'}</div>
        </div>
        <div class="sheet-meta-item">
          <label>Client Name:</label>
          <div class="val">${job.customer}</div>
        </div>
        <div class="sheet-meta-item">
          <label>Client Reference:</label>
          <div class="val">PO-REF-2026-991</div>
        </div>
        <div class="sheet-meta-item">
          <label>Job Description:</label>
          <div class="val">${job.equipment} Overhaul & Precision Honing</div>
        </div>
        <div class="sheet-meta-item">
          <label>Scope:</label>
          <div class="val">Complete overhaul, barrel hone, hard chrome rod replacement, Viton seal kit, 350-bar hydro test.</div>
        </div>
        <div class="sheet-meta-item">
          <label>Job Completion (Target):</label>
          <div class="val">02-Dec-2026 (Scheduled)</div>
        </div>
        <div class="sheet-meta-item">
          <label>Manpower Details:</label>
          <div class="val">1 Lead Tech (Raj Kumar), 1 Lathe Machinist, 1 QA Inspector</div>
        </div>
      </div>

      <!-- Equipment Details Table matching Excel Sheet -->
      <h4 style="margin: 20px 0 10px; font-size: 14px; font-weight: 800; color: #e2e8f0; display: flex; align-items: center; gap: 8px;">
        <span>📋</span> Equipment Inward Specifications
      </h4>
      <div style="overflow-x: auto; margin-bottom: 20px;">
        <table class="erp-table">
          <thead>
            <tr>
              <th style="width: 50px;">S.No</th>
              <th>Equipment Details</th>
              <th>Serial Number</th>
              <th>Model</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: center;">Unit Of Measure</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td><strong>Hydraulic Cylinder (Double-acting)</strong></td>
              <td style="font-family: monospace; color: #38bdf8;">#2026-HC-8912</td>
              <td>HC-350-D</td>
              <td style="text-align: center;">1</td>
              <td style="text-align: center;">EA</td>
              <td style="text-align: center;"><span class="badge badge-success">✓ Verified & Logged</span></td>
            </tr>
            <tr>
              <td>2</td>
              <td><strong>Piston Rod Assembly (Dia 80mm x 1200mm)</strong></td>
              <td style="font-family: monospace; color: #38bdf8;">#PR-8812-B</td>
              <td>ROD-80X1200</td>
              <td style="text-align: center;">1</td>
              <td style="text-align: center;">EA</td>
              <td style="text-align: center;"><span class="badge badge-success">✓ Verified & Logged</span></td>
            </tr>
            <tr>
              <td>3</td>
              <td><strong>Cylinder Barrel Tube (Bore 180mm x 1400mm)</strong></td>
              <td style="font-family: monospace; color: #38bdf8;">#BT-9901-C</td>
              <td>BR-180X1400</td>
              <td style="text-align: center;">1</td>
              <td style="text-align: center;">EA</td>
              <td style="text-align: center;"><span class="badge badge-success">✓ Verified & Logged</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Sign-off Block: Received By & Approved By -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); padding: 12px 16px; border-radius: 8px;">
          <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Received By:</span>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px;">
            <div>
              <div style="font-size: 14px; font-weight: 700; color: #f8fafc;">Alex Carter (Receiving Team)</div>
              <div style="font-size: 11px; color: #94a3b8;">Emp ID: EMP-RC-104 • Logged: 24-Nov-2026 09:15</div>
            </div>
            <span class="badge badge-success">✓ Inward Verified</span>
          </div>
        </div>

        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); padding: 12px 16px; border-radius: 8px;">
          <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Approved By:</span>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px;">
            <div>
              <div style="font-size: 14px; font-weight: 700; color: #f8fafc;">David Miller (Workshop Manager)</div>
              <div style="font-size: 11px; color: #94a3b8;">Emp ID: EMP-WM-002 • Approved: 24-Nov-2026 10:30</div>
            </div>
            <span class="badge badge-success">✓ Intake Approved</span>
          </div>
        </div>
      </div>

      <!-- Received Items Pics' Section matching Excel Sheet (Pic-1, Pic-2, Pic-3) -->
      <h4 style="margin: 20px 0 10px; font-size: 14px; font-weight: 800; color: #e2e8f0;">
        📸 Received Items Intake Photographs
      </h4>
      <div class="proofing-grid" style="grid-template-columns: repeat(3, 1fr);">
        <div class="proofing-box" onclick="showToast('Intake Photo #1 enlarged: Complete cylinder assembly on transit skid.', 'info')">
          <div class="box-icon">📷</div>
          <div class="box-label">Pic-1</div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Full Unit Inward Condition</div>
          <span class="badge badge-success" style="margin-top: 8px; font-size: 10px;">✓ Captured (2.4 MB)</span>
        </div>

        <div class="proofing-box" onclick="showToast('Intake Photo #2 enlarged: Port flange and gland collar condition.', 'info')">
          <div class="box-icon">📷</div>
          <div class="box-label">Pic-2</div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Port Flange & Rod Gland</div>
          <span class="badge badge-success" style="margin-top: 8px; font-size: 10px;">✓ Captured (1.9 MB)</span>
        </div>

        <div class="proofing-box" onclick="showToast('Intake Photo #3 enlarged: Stamped manufacturer nameplate and S/N.', 'info')">
          <div class="box-icon">📷</div>
          <div class="box-label">Pic-3</div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Nameplate & Serial Stamp</div>
          <span class="badge badge-success" style="margin-top: 8px; font-size: 10px;">✓ Captured (2.1 MB)</span>
        </div>
      </div>

      <!-- Receiving Inward Parameters & Photo Gallery matching WhatsApp Video -->
      <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 18px; margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <h4 style="margin: 0; font-size: 14px; font-weight: 800; color: #38bdf8; display: flex; align-items: center; gap: 8px;">
            <span>📦</span> Inward Registration Parameters (Video Flow)
          </h4>
          <button type="button" class="quick-action-btn btn-outline" style="padding: 4px 10px; font-size: 11px;" onclick="openStageReportModal('receiving', '${job.id}')">
            <span>📑</span> Stage Report
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
          <div>
            <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Customer Delivery Note Number:</label>
            <input type="text" id="recDnNo" class="erp-input" value="${job.customerDnNo || 'Thabk / DN-CRN-88219'}" style="width: 100%; margin-top: 4px;" />
          </div>

          <div>
            <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Quantity Received:</label>
            <input type="text" id="recQty" class="erp-input" value="${job.quantityReceived || '8 Units'}" style="width: 100%; margin-top: 4px;" />
          </div>

          <div>
            <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Condition at Receiving:</label>
            <input type="text" id="recCondition" class="erp-input" value="${job.conditionAtReceiving || 'Right'}" style="width: 100%; margin-top: 4px;" />
          </div>

          <div>
            <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Accessories Received:</label>
            <input type="text" id="recAccessories" class="erp-input" value="${job.accessoriesReceived || 'Ghjjb / Port Plugs & Bolts'}" style="width: 100%; margin-top: 4px;" />
          </div>

          <div>
            <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Missing or Damaged Accessories:</label>
            <input type="text" id="recMissingAcc" class="erp-input" value="${job.missingAccessories || '-NA-'}" style="width: 100%; margin-top: 4px;" />
          </div>
        </div>

        <!-- Live Photo Gallery with Delete Buttons matching Video -->
        <div style="margin-top: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">
              Photos (${(job.photos || []).length || 3}):
            </label>
            <button type="button" class="quick-action-btn btn-outline" style="padding: 2px 8px; font-size: 11px;" onclick="addPhotoToStage('receiving', '${job.id}')">
              <span>📷</span> Take or add photos
            </button>
          </div>
          
          <div class="stage-photo-gallery">
            ${((job.photos && job.photos.length) ? job.photos : [
              { name: 'As-Received Overall Assembly', icon: '📷' },
              { name: 'Gland Collar & Flange Condition', icon: '📷' },
              { name: 'Serial & Manufacturer Nameplate', icon: '📷' }
            ]).map((p, idx) => `
              <div class="stage-photo-card">
                <button type="button" class="photo-delete-btn" onclick="removePhotoFromStage('receiving', '${job.id}', ${idx})" title="Delete Photo">✕</button>
                <div class="photo-icon">${p.icon || '📷'}</div>
                <div class="photo-caption">${p.name || 'Photo #' + (idx + 1)}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Technician Remarks -->
        <div style="margin-top: 14px;">
          <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Technician Remarks:</label>
          <textarea id="recTechRemarks" class="erp-input" rows="2" style="width: 100%; margin-top: 4px;">${job.technicianRemarks || 'Need approval'}</textarea>
        </div>

        <!-- Sign and Submit Flow from Video -->
        <div style="margin-top: 16px;">
          ${job.receivingSigned ? `
            <div class="signed-status-banner">
              <span class="signed-status-text">
                ✓ Signed: <strong>${job.receivingSigner || '123 (Technician)'}</strong> on ${job.receivingSignedDate || '27 Nov 2026 at 10:28 AM'}. Waiting for a different manager to approve.
              </span>
              <button class="quick-action-btn btn-outline" style="padding: 4px 10px; font-size: 11px;" onclick="openStageReportModal('receiving', '${job.id}')">
                <span>📑</span> Stage Report
              </button>
            </div>
          ` : `
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button class="quick-action-btn btn-success" onclick="signAndSubmitStage('receiving', '${job.id}')" style="padding: 9px 18px; font-size: 13px;">
                <span>✍️</span> Sign and submit
              </button>
            </div>
          `}
        </div>
      </div>

      <!-- Upload Document Box matching Excel Sheet -->
      <div style="background: rgba(15, 23, 42, 0.6); border: 2px dashed rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 20px; text-align: center; margin-top: 16px;">
        <span style="font-size: 32px;">📄</span>
        <h4 style="margin: 8px 0 4px; font-size: 14px; color: #fff;">Customer Inward Delivery Note (Signed Copy)</h4>
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 12px;">
          Uploaded File: <strong style="color: #38bdf8;">Inward_DN_CRN-88219_Signed.pdf</strong> (1.8 MB • Timestamped 24-Nov-2026 09:18 AM)
        </p>
        <div style="display: flex; justify-content: center; gap: 10px;">
          <button class="quick-action-btn btn-primary" onclick="showToast('Displaying Customer Inward Delivery Note PDF...', 'info')">
            <span>👁️</span> View Attached Document
          </button>
          <button class="quick-action-btn btn-outline" onclick="showToast('Upload dialog opened: select updated scanned document.', 'info')">
            <span>📤</span> Upload Revised Copy
          </button>
        </div>
      </div>

      <!-- Bottom Step Progression -->
      <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
        <button class="quick-action-btn btn-primary" onclick="switchOpStep('dismantling')" style="padding: 10px 20px; font-size: 13.5px;">
          Proceed to Stage 1 – Dismantling ➔
        </button>
      </div>
    </div>
  `;
}

// ==========================================
// 2A.1 STAGE 1: DISMANTLING (Video Flow)
// ==========================================
function getOpStepDismantlingHTML(job) {
  return `
    <div class="op-sheet-card">
      <div class="op-sheet-header">
        <div>
          <span class="badge badge-warning" style="margin-bottom: 6px; font-weight: 800;">STAGE 1 • DISMANTLING</span>
          <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #fff;">Dismantling & Teardown Stage</h3>
          <p style="margin: 2px 0 0; font-size: 12px; color: #94a3b8;">
            Disassemble components, extract piston rod, record dimensional wear, and capture teardown proof photos.
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="quick-action-btn btn-primary" onclick="openStageReportModal('dismantling', '${job.id}')">
            <span>📑</span> Stage Report
          </button>
        </div>
      </div>

      <!-- Checklist & Observations -->
      <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 18px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 12px; font-size: 13.5px; font-weight: 800; color: #38bdf8;">Teardown Activities & Micrometer Measurements:</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
          <div style="background: rgba(255, 255, 255, 0.02); padding: 12px; border-radius: 6px;">
            <label style="font-size: 11px; color: #64748b; font-weight: 700;">ROD GLAND & WIPER SEAL REMOVAL:</label>
            <div style="font-size: 13px; font-weight: 600; color: #f1f5f9; margin-top: 4px;">Extracted with brass drift; zero scoring to gland housing.</div>
          </div>
          <div style="background: rgba(255, 255, 255, 0.02); padding: 12px; border-radius: 6px;">
            <label style="font-size: 11px; color: #64748b; font-weight: 700;">PISTON NUT BREAKOUT TORQUE:</label>
            <div style="font-size: 13px; font-weight: 600; color: #38bdf8; margin-top: 4px;">Required 1,450 Nm with induction heat assist.</div>
          </div>
          <div style="background: rgba(255, 255, 255, 0.02); padding: 12px; border-radius: 6px;">
            <label style="font-size: 11px; color: #64748b; font-weight: 700;">SHAFT TIR RUNOUT (DIAL INDICATOR):</label>
            <div style="font-size: 13px; font-weight: 600; color: #f87171; margin-top: 4px;">0.42 mm (Exceeds permissible 0.05 mm).</div>
          </div>
        </div>

        <!-- Photos -->
        <div style="margin-top: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Dismantling Proof Photos:</label>
            <button type="button" class="quick-action-btn btn-outline" style="padding: 2px 8px; font-size: 11px;" onclick="addPhotoToStage('dismantling', '${job.id}')">
              <span>📷</span> Take or add photos
            </button>
          </div>
          <div class="stage-photo-gallery">
            <div class="stage-photo-card"><div class="photo-icon">📷</div><div class="photo-caption">Rod Teardown</div></div>
            <div class="stage-photo-card"><div class="photo-icon">📷</div><div class="photo-caption">Piston Chevron Wear</div></div>
          </div>
        </div>

        <!-- Remarks & Sign -->
        <div style="margin-top: 14px;">
          <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Technician Remarks:</label>
          <textarea class="erp-input" rows="2" style="width: 100%; margin-top: 4px;">Piston rod scored at 450mm mark. Honing and new induction hardened rod required.</textarea>
        </div>

        <div style="margin-top: 16px;">
          ${job.dismantlingSigned ? `
            <div class="signed-status-banner">
              <span class="signed-status-text">✓ Signed: <strong>${job.dismantlingSigner || 'Raj Kumar (Technician)'}</strong>. Waiting for manager approval.</span>
            </div>
          ` : `
            <div style="display: flex; justify-content: flex-end;">
              <button class="quick-action-btn btn-success" onclick="signAndSubmitStage('dismantling', '${job.id}')"><span>✍️</span> Sign and submit</button>
            </div>
          `}
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
        <button class="quick-action-btn btn-outline" onclick="switchOpStep('receiving')">⬅ Back to Receiving</button>
        <button class="quick-action-btn btn-primary" onclick="switchOpStep('cleaning')">Proceed to Cleaning ➔</button>
      </div>
    </div>
  `;
}

// ==========================================
// 2A.2 STAGE 2: CLEANING (Video Flow)
// ==========================================
function getOpStepCleaningHTML(job) {
  return `
    <div class="op-sheet-card">
      <div class="op-sheet-header">
        <div>
          <span class="badge badge-info" style="margin-bottom: 6px; font-weight: 800;">STAGE 2 • CLEANING & DEGREASING</span>
          <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #fff;">Degreasing & Ultrasonic Cleaning Stage</h3>
          <p style="margin: 2px 0 0; font-size: 12px; color: #94a3b8;">
            Chemical degreasing, ultrasonic cleaning tank cycle, hot air drying, and surface contamination testing.
          </p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="quick-action-btn btn-primary" onclick="openStageReportModal('cleaning', '${job.id}')">
            <span>📑</span> Stage Report
          </button>
        </div>
      </div>

      <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 18px; margin-bottom: 20px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
          <div style="background: rgba(255, 255, 255, 0.02); padding: 12px; border-radius: 6px;">
            <label style="font-size: 11px; color: #64748b; font-weight: 700;">ULTRASONIC TANK DEGREASING CYCLE:</label>
            <div style="font-size: 13px; font-weight: 600; color: #34d399; margin-top: 4px;">45 Min @ 65°C (Alkaline solvent bath)</div>
          </div>
          <div style="background: rgba(255, 255, 255, 0.02); padding: 12px; border-radius: 6px;">
            <label style="font-size: 11px; color: #64748b; font-weight: 700;">RESIDUAL PARTICULATE INSPECTION:</label>
            <div style="font-size: 13px; font-weight: 600; color: #38bdf8; margin-top: 4px;">ISO 4406 Cleanliness Code 16/14/11 Achieved</div>
          </div>
          <div style="background: rgba(255, 255, 255, 0.02); padding: 12px; border-radius: 6px;">
            <label style="font-size: 11px; color: #64748b; font-weight: 700;">HOT AIR DRYING & INHIBITOR OIL:</label>
            <div style="font-size: 13px; font-weight: 600; color: #f1f5f9; margin-top: 4px;">De-watered and misted with ISO VG 10 protective oil.</div>
          </div>
        </div>

        <div style="margin-top: 16px;">
          ${job.cleaningSigned ? `
            <div class="signed-status-banner">
              <span class="signed-status-text">✓ Signed: <strong>${job.cleaningSigner || 'Raj Kumar (Technician)'}</strong>. Waiting for manager approval.</span>
            </div>
          ` : `
            <div style="display: flex; justify-content: flex-end;">
              <button class="quick-action-btn btn-success" onclick="signAndSubmitStage('cleaning', '${job.id}')"><span>✍️</span> Sign and submit</button>
            </div>
          `}
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
        <button class="quick-action-btn btn-outline" onclick="switchOpStep('dismantling')">⬅ Back to Dismantling</button>
        <button class="quick-action-btn btn-primary" onclick="switchOpStep('initial_inspection')">Proceed to Inspection ➔</button>
      </div>
    </div>
  `;
}

// ==========================================
// 2B. STEP 2: INITIAL INSPECTION (Image: 4f8a234b)
// ==========================================
function getOpStepInspectionHTML(job) {
  const isSigned = job.inspectionSigned !== false;

  return `
    <div class="op-sheet-card">
      <div class="op-sheet-header">
        <div>
          <span class="badge badge-warning" style="margin-bottom: 6px; font-weight: 800;">STAGE 2 • DISMANTLING & INSPECTION</span>
          <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #fff;">2. Initial Inspection & 2.1 Technical Assessment</h3>
          <p style="margin: 2px 0 0; font-size: 12px; color: #94a3b8;">
            Record dismantling findings, micrometer measurements, component-level recommendations (Repair/Replace/Reuse), proofing photographs, and generate the official PDF report.
          </p>
        </div>

        <!-- Red Action Button explicitly specified in user Excel sheet -->
        <div>
          <button class="btn-red-action" onclick="generateInspectionReportPDF('${job.id}')">
            <span style="font-size: 16px;">📄</span> Click Here for PDF
          </button>
        </div>
      </div>

      <!-- Top Metadata Grid matching uploaded Excel Sheet -->
      <div class="sheet-meta-grid" style="grid-template-columns: repeat(3, 1fr);">
        <div class="sheet-meta-item">
          <label>Client Name:</label>
          <div class="val">${job.customer}</div>
        </div>
        <div class="sheet-meta-item">
          <label>Report Number:</label>
          <div class="val" style="color: #38bdf8; font-family: monospace;">IIR-2026-088</div>
        </div>
        <div class="sheet-meta-item">
          <label>Report Date:</label>
          <div class="val">25-Nov-2026</div>
        </div>
        <div class="sheet-meta-item">
          <label>Item Details:</label>
          <div class="val">${job.equipment} 350 Bar</div>
        </div>
        <div class="sheet-meta-item">
          <label>Manufacturer:</label>
          <div class="val">Parker Hannifin / Heavy Series</div>
        </div>
        <div class="sheet-meta-item">
          <label>Model:</label>
          <div class="val">${job.model || 'HC-350-D'}</div>
        </div>
        <div class="sheet-meta-item">
          <label>Serial Number:</label>
          <div class="val" style="font-family: monospace; color: #a5f3fc;">${job.serialNumber || '2026-HC-8912'}</div>
        </div>
        <div class="sheet-meta-item">
          <label>User Reference Number:</label>
          <div class="val">REF-CRN-88219</div>
        </div>
        <div class="sheet-meta-item">
          <label>Your Reference / Job Number:</label>
          <div class="val" style="color: #38bdf8; font-weight: 800;">${job.id}</div>
        </div>
        <div class="sheet-meta-item">
          <label>Type:</label>
          <div class="val">Double Acting Heavy Duty Cylinder</div>
        </div>
        <div class="sheet-meta-item">
          <label>Report Requested By:</label>
          <div class="val">Workshop Operations Desk</div>
        </div>
        <div class="sheet-meta-item">
          <label>Sales Person Name:</label>
          <div class="val">${job.salesPerson || 'David Miller'}</div>
        </div>
      </div>

      <!-- Findings & Observation Table matching Excel Sheet -->
      <h4 style="margin: 20px 0 10px; font-size: 14px; font-weight: 800; color: #e2e8f0; display: flex; align-items: center; gap: 8px;">
        <span>🔍</span> Dismantling Observations & Recommendations
      </h4>
      <div style="overflow-x: auto; margin-bottom: 20px;">
        <table class="erp-table">
          <thead>
            <tr>
              <th style="width: 50px;">S/N</th>
              <th>Internal/External Part Details</th>
              <th>Findings / Observation</th>
              <th style="text-align: center; width: 180px;">RECOMMENDATIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td><strong>Cylinder Barrel & Internal Bore</strong></td>
              <td>
                Scored internal bore surface; pitting near rod gland section (0.35mm depth). Micrometer runout 0.08mm.
              </td>
              <td style="text-align: center;">
                <span class="badge" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid #38bdf8; font-weight: 800;">
                  REPAIR (Honing)
                </span>
              </td>
            </tr>
            <tr>
              <td>2</td>
              <td><strong>Piston Rod (Induction Hard Chrome)</strong></td>
              <td>
                Hard chrome plating flaked off at 450mm stroke position; severe longitudinal scoring. Straightness runout 0.42mm exceeds permissible tolerance.
              </td>
              <td style="text-align: center;">
                <span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444; font-weight: 800;">
                  REPLACE (New Rod)
                </span>
              </td>
            </tr>
            <tr>
              <td>3</td>
              <td><strong>Seal Gland Bushing & Guide Bearings</strong></td>
              <td>
                Excessive radial play (0.45mm); bronze material degradation and embedded micro-debris. Viton/PTFE backup seals decomposed.
              </td>
              <td style="text-align: center;">
                <span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444; font-weight: 800;">
                  REPLACE (Bronze Bush)
                </span>
              </td>
            </tr>
            <tr>
              <td>4</td>
              <td><strong>End Cap, Port Flanges & Tie Rods</strong></td>
              <td>
                Minor external surface oxidation only; internal port threads dimensionally sound and gauge verified. No structural cracking detected.
              </td>
              <td style="text-align: center;">
                <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #10b981; font-weight: 800;">
                  REUSE (Clean & Polish)
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Reference Images / Proofing (Pic-1, Pic-2, Pic-3, Pic-4) matching Excel Sheet -->
      <h4 style="margin: 20px 0 10px; font-size: 14px; font-weight: 800; color: #e2e8f0;">
        📸 Reference Images / Proofing
      </h4>
      <div class="proofing-grid">
        <div class="proofing-box" onclick="showToast('Proofing Pic-1: Barrel Internal Bore Scoring Profilometer Scan.', 'info')">
          <div class="box-icon">🔬</div>
          <div class="box-label">Pic-1</div>
          <div style="font-size: 11px; color: #38bdf8; font-weight: 600; margin-top: 4px;">Internal Bore Scoring</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Item Name: Cylinder Barrel</div>
          <span class="badge badge-success" style="margin-top: 6px; font-size: 10px;">✓ Attached</span>
        </div>

        <div class="proofing-box" onclick="showToast('Proofing Pic-2: Piston Rod Flaking & Chrome Corrosion.', 'info')">
          <div class="box-icon">🔬</div>
          <div class="box-label">Pic-2</div>
          <div style="font-size: 11px; color: #38bdf8; font-weight: 600; margin-top: 4px;">Rod Chrome Flaking</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Item Name: Piston Rod</div>
          <span class="badge badge-success" style="margin-top: 6px; font-size: 10px;">✓ Attached</span>
        </div>

        <div class="proofing-box" onclick="showToast('Proofing Pic-3: Gland Bushing Bronze Degradation & Play.', 'info')">
          <div class="box-icon">🔬</div>
          <div class="box-label">Pic-3</div>
          <div style="font-size: 11px; color: #38bdf8; font-weight: 600; margin-top: 4px;">Gland Bush Play & Wear</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Item Name: Bushing / Seals</div>
          <span class="badge badge-success" style="margin-top: 6px; font-size: 10px;">✓ Attached</span>
        </div>

        <div class="proofing-box" onclick="showToast('Proofing Pic-4: End Cap Pitch Thread Gauge Verification.', 'info')">
          <div class="box-icon">🔬</div>
          <div class="box-label">Pic-4</div>
          <div style="font-size: 11px; color: #38bdf8; font-weight: 600; margin-top: 4px;">End Cap Thread Verification</div>
          <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Item Name: End Cap</div>
          <span class="badge badge-success" style="margin-top: 6px; font-size: 10px;">✓ Attached</span>
        </div>
      </div>

      <!-- Remarks Box matching Excel Sheet -->
      <div style="margin-top: 16px;">
        <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Remarks / Engineering Evaluation:</label>
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #cbd5e1; margin-top: 4px;">
          Comprehensive NDT liquid penetrant testing completed on weld joints. Bore honing to +0.25mm oversize is structurally approved within manufacturer allowable envelope. New induction hardened 4140 chrome rod and complete Viton seal kit mandatory to achieve 350-bar certified pressure rating.
        </div>
      </div>

      <!-- Digital Signature Card with User Callout matching Excel Sheet -->
      <div class="digital-sign-card">
        <div class="sign-box">
          <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Inspected By:</span>
          <div style="margin-top: 6px;">
            <div style="font-size: 14px; font-weight: 700; color: #f8fafc;">Raj Kumar (Lead Technician)</div>
            <div class="sign-stamp">Raj Kumar</div>
            <div style="font-size: 11px; color: #38bdf8; font-family: monospace;">🔒 Digital Sign ID: TK-802-9982</div>
            <div style="font-size: 11px; color: #94a3b8;">Date: 25-Nov-2026 14:30 UTC</div>
          </div>
        </div>

        <div class="sign-box">
          <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Approved By (Workshop Manager):</span>
          <div style="margin-top: 6px;">
            <div style="font-size: 14px; font-weight: 700; color: #f8fafc;">David Miller (Workshop Manager)</div>
            ${isSigned ? `
              <div class="sign-stamp">David Miller</div>
              <div style="font-size: 11px; color: #38bdf8; font-family: monospace;">🔒 Cryptographic Sign: WM-002-7718 (SHA-256 Verified)</div>
              <div style="font-size: 11px; color: #94a3b8;">Date: 25-Nov-2026 16:45 UTC</div>
            ` : `
              <div style="margin: 12px 0;">
                <button class="quick-action-btn btn-primary" onclick="openDigitalSignModal('workshop_manager', 'initial_inspection')">
                  <span>✍️</span> Authenticate & Digitally Sign
                </button>
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Blue Callout Arrow from User's Excel Sheet Note -->
      <div style="background: rgba(14, 165, 233, 0.1); border: 1px solid rgba(14, 165, 233, 0.3); border-radius: 8px; padding: 12px 16px; margin-top: 14px; display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 22px;">💡</span>
        <div style="font-size: 12px; color: #7dd3fc;">
          <strong>Automatic Electronic Signature Policy:</strong> As noted in the technical specification, entering the authorized user's login ID and password automatically stamps this authenticated cryptographic electronic signature and PDF report.
        </div>
      </div>

      <!-- Bottom Step Progression -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
        <button class="quick-action-btn btn-outline" onclick="switchOpStep('receiving')">
          ⬅ Back to 1. Receiving
        </button>
        <button class="quick-action-btn btn-primary" onclick="switchOpStep('cost_estimations')" style="padding: 10px 20px; font-size: 13.5px;">
          Proceed to 2.2 Cost Estimations ➔
        </button>
      </div>
    </div>
  `;
}

// ==========================================
// 2C. STEP 2.2: COST ESTIMATIONS (Image: 82ed5bd4)
// ==========================================
function getOpStepCostingHTML(job) {
  return `
    <div class="op-sheet-card">
      <div class="op-sheet-header">
        <div>
          <span class="badge badge-warning" style="margin-bottom: 6px; font-weight: 800;">STAGE 2.2 • COMMERCIAL COSTING</span>
          <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #fff;">2.2 Repair Cost Estimations & Bill of Materials (BOM)</h3>
          <p style="margin: 2px 0 0; font-size: 12px; color: #94a3b8;">
            Direct materials, lathe machining, precision honing, technician labour hours, gross margins formulation, and automatic quotation dispatch to Sales.
          </p>
        </div>

        <!-- Red Action Button explicitly specified in user Excel sheet -->
        <div>
          <button class="btn-red-action" onclick="sendCostingEmailToSales('${job.id}')">
            <span style="font-size: 16px;">✉️</span> Click here for send mail to Sales person
          </button>
        </div>
      </div>

      <!-- Top Metadata Grid matching uploaded Excel Sheet -->
      <div class="sheet-meta-grid">
        <div class="sheet-meta-item">
          <label>Job/Enquiry Number:</label>
          <div class="val" style="color: #38bdf8; font-weight: 800;">${job.id}</div>
        </div>
        <div class="sheet-meta-item">
          <label>Receiving Date:</label>
          <div class="val">24-Nov-2026</div>
        </div>
        <div class="sheet-meta-item">
          <label>Client Receipt No:</label>
          <div class="val">CRN-88219</div>
        </div>
        <div class="sheet-meta-item">
          <label>Sales Person:</label>
          <div class="val">${job.salesPerson || 'David Miller'}</div>
        </div>
        <div class="sheet-meta-item">
          <label>Client Name:</label>
          <div class="val">${job.customer}</div>
        </div>
        <div class="sheet-meta-item">
          <label>Client Reference:</label>
          <div class="val">PO-REF-2026-991</div>
        </div>
        <div class="sheet-meta-item">
          <label>Job Description:</label>
          <div class="val">Heavy Duty Hydraulic Cylinder 350-Bar Overhaul</div>
        </div>
        <div class="sheet-meta-item">
          <label>Scope:</label>
          <div class="val">Overhaul, hard chroming, rod replacement, precision honing & hydro-testing</div>
        </div>
        <div class="sheet-meta-item">
          <label>Job Completion:</label>
          <div class="val">02-Dec-2026</div>
        </div>
        <div class="sheet-meta-item">
          <label>Manpower Details:</label>
          <div class="val">18 Tech Hours + 8 Lathe Hours</div>
        </div>
      </div>

      <!-- BOM Costing Table matching Excel Sheet -->
      <h4 style="margin: 20px 0 10px; font-size: 14px; font-weight: 800; color: #e2e8f0; display: flex; align-items: center; gap: 8px;">
        <span>💰</span> Bill of Materials (BOM) & Overhaul Cost Formulation
      </h4>
      <div style="overflow-x: auto; margin-bottom: 20px;">
        <table class="erp-table">
          <thead>
            <tr>
              <th style="width: 45px;">S.No</th>
              <th>Description</th>
              <th style="text-align: center; width: 60px;">Qty</th>
              <th style="text-align: center; width: 60px;">UOM</th>
              <th style="text-align: right; width: 100px;">Unit Price</th>
              <th style="text-align: right; width: 100px;">Total Cost</th>
              <th style="text-align: center; width: 110px;">Gross Margin (%)</th>
              <th style="text-align: right; width: 110px;">Selling Price</th>
              <th style="text-align: right; width: 120px;">Total Selling Price</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td><strong>High-Precision Rod Honing & Micro-finishing</strong></td>
              <td style="text-align: center;">1</td>
              <td style="text-align: center;">Lot</td>
              <td style="text-align: right;">$1,200.00</td>
              <td style="text-align: right;">$1,200.00</td>
              <td style="text-align: center;"><span style="color: #34d399; font-weight: 700;">18%</span></td>
              <td style="text-align: right;">$1,463.41</td>
              <td style="text-align: right; font-weight: 700; color: #38bdf8;">$1,463.41</td>
              <td style="font-size: 12px; color: #94a3b8;">In-house Bay Lathe 3</td>
            </tr>
            <tr>
              <td>2</td>
              <td><strong>Induction Hardened Chrome Rod (Dia 80mm x 1200mm)</strong></td>
              <td style="text-align: center;">1</td>
              <td style="text-align: center;">Pc</td>
              <td style="text-align: right;">$1,450.00</td>
              <td style="text-align: right;">$1,450.00</td>
              <td style="text-align: center;"><span style="color: #34d399; font-weight: 700;">20%</span></td>
              <td style="text-align: right;">$1,812.50</td>
              <td style="text-align: right; font-weight: 700; color: #38bdf8;">$1,812.50</td>
              <td style="font-size: 12px; color: #94a3b8;">Hard Chrome International</td>
            </tr>
            <tr>
              <td>3</td>
              <td><strong>Heavy Duty Viton/PTFE Hydraulic Seal Kit</strong></td>
              <td style="text-align: center;">1</td>
              <td style="text-align: center;">Kit</td>
              <td style="text-align: right;">$480.00</td>
              <td style="text-align: right;">$480.00</td>
              <td style="text-align: center;"><span style="color: #34d399; font-weight: 700;">25%</span></td>
              <td style="text-align: right;">$640.00</td>
              <td style="text-align: right; font-weight: 700; color: #38bdf8;">$640.00</td>
              <td style="font-size: 12px; color: #94a3b8;">Parker Authorized Stock</td>
            </tr>
            <tr>
              <td>4</td>
              <td><strong>Phosphor Bronze Gland Bushing Machining</strong></td>
              <td style="text-align: center;">1</td>
              <td style="text-align: center;">Pc</td>
              <td style="text-align: right;">$320.00</td>
              <td style="text-align: right;">$320.00</td>
              <td style="text-align: center;"><span style="color: #34d399; font-weight: 700;">18%</span></td>
              <td style="text-align: right;">$390.24</td>
              <td style="text-align: right; font-weight: 700; color: #38bdf8;">$390.24</td>
              <td style="font-size: 12px; color: #94a3b8;">Precision CNC Turning</td>
            </tr>
            <tr>
              <td>5</td>
              <td><strong>Disassembly, Degreasing & Ultrasonic Cleaning</strong></td>
              <td style="text-align: center;">8</td>
              <td style="text-align: center;">Hrs</td>
              <td style="text-align: right;">$45.00</td>
              <td style="text-align: right;">$360.00</td>
              <td style="text-align: center;"><span style="color: #34d399; font-weight: 700;">15%</span></td>
              <td style="text-align: right;">$52.94</td>
              <td style="text-align: right; font-weight: 700; color: #38bdf8;">$423.53</td>
              <td style="font-size: 12px; color: #94a3b8;">Lead Tech Manpower</td>
            </tr>
            <tr>
              <td>6</td>
              <td><strong>Assembly, Torquing & 350-Bar Hydrostatic Testing</strong></td>
              <td style="text-align: center;">10</td>
              <td style="text-align: center;">Hrs</td>
              <td style="text-align: right;">$55.00</td>
              <td style="text-align: right;">$550.00</td>
              <td style="text-align: center;"><span style="color: #34d399; font-weight: 700;">15%</span></td>
              <td style="text-align: right;">$64.71</td>
              <td style="text-align: right; font-weight: 700; color: #38bdf8;">$647.06</td>
              <td style="font-size: 12px; color: #94a3b8;">QA Certified Test Bay</td>
            </tr>
          </tbody>
          <!-- Green Shaded Summary Totals matching uploaded Excel Sheet -->
          <tfoot>
            <tr style="background: rgba(16, 185, 129, 0.15); border-top: 2px solid #10b981;">
              <td colspan="7" style="text-align: right; font-weight: 700; color: #e2e8f0;">Selling Price:</td>
              <td colspan="3" style="font-weight: 800; font-size: 14px; color: #34d399;">$4,863.88</td>
            </tr>
            <tr style="background: rgba(16, 185, 129, 0.15);">
              <td colspan="7" style="text-align: right; font-weight: 700; color: #e2e8f0;">Total Job Qty:</td>
              <td colspan="3" style="font-weight: 800; font-size: 14px; color: #34d399;">1 Unit</td>
            </tr>
            <tr style="background: rgba(16, 185, 129, 0.25);">
              <td colspan="7" style="text-align: right; font-weight: 800; font-size: 14px; color: #fff;">Total Selling Price:</td>
              <td colspan="3" style="font-weight: 900; font-size: 16px; color: #10b981;">$5,376.74</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Prepared By / Approved By & Tax Note matching Excel Sheet -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px;">
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); padding: 12px 16px; border-radius: 8px;">
          <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Prepared By:</span>
          <div style="font-size: 14px; font-weight: 700; color: #f8fafc; margin-top: 4px;">Raj Kumar (Lead Technician)</div>
          <div style="font-size: 11px; color: #94a3b8;">Costing Formulated: 25-Nov-2026 15:45</div>
        </div>

        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); padding: 12px 16px; border-radius: 8px;">
          <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Approved By (Workshop Manager):</span>
          <div style="font-size: 14px; font-weight: 700; color: #f8fafc; margin-top: 4px;">David Miller (Workshop Manager)</div>
          <div style="font-size: 11px; color: #34d399; font-weight: 700;">✓ Approved & Submitted to Country Manager</div>
        </div>
      </div>

      <!-- Mandatory Tax Note explicitly written on the user's Excel sheet -->
      <div style="font-size: 12px; color: #94a3b8; font-style: italic; margin-top: 8px;">
        Note: The above mentioned price we're not including TAX
      </div>

      <!-- Bottom Step Progression -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
        <button class="quick-action-btn btn-outline" onclick="switchOpStep('initial_inspection')">
          ⬅ Back to 2. Initial Inspection
        </button>
        <button class="quick-action-btn btn-primary" onclick="switchOpStep('assign_job')" style="padding: 10px 20px; font-size: 13.5px;">
          Proceed to 3. Assign Job ➔
        </button>
      </div>
    </div>
  `;
}

// ==========================================
// 2D. STEP 3: ASSIGN JOB (Image: 1ae0a764)
// ==========================================
function getOpStepAssignHTML(job) {
  return `
    <div class="op-sheet-card">
      <div class="op-sheet-header">
        <div>
          <span class="badge badge-info" style="margin-bottom: 6px; font-weight: 800;">STAGE 3 • WORK ORDER ALLOCATION</span>
          <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #fff;">3. Assign Job & Bay Scheduling</h3>
          <p style="margin: 2px 0 0; font-size: 12px; color: #94a3b8;">
            Assign lead technician, allocate workshop bay, configure manpower hours, and verify customer Purchase Order (PO) confirmation.
          </p>
        </div>
        <button class="quick-action-btn btn-success" onclick="showToast('Work order dispatched to technician terminal!', 'success')">
          <span>📨</span> Dispatch Work Order
        </button>
      </div>

      <!-- Top Metadata Grid matching uploaded Excel Sheet -->
      <div class="sheet-meta-grid">
        <div class="sheet-meta-item">
          <label>Job/Enquiry Number:</label>
          <div class="val" style="color: #38bdf8; font-weight: 800;">${job.id}</div>
        </div>
        <div class="sheet-meta-item">
          <label>Receiving Date:</label>
          <div class="val">24-Nov-2026</div>
        </div>
        <div class="sheet-meta-item">
          <label>Client Receipt No:</label>
          <div class="val">CRN-88219</div>
        </div>
        <div class="sheet-meta-item">
          <label>Sales Person:</label>
          <div class="val">${job.salesPerson || 'David Miller'}</div>
        </div>
        <div class="sheet-meta-item">
          <label>Client Name:</label>
          <div class="val">${job.customer}</div>
        </div>
        <div class="sheet-meta-item">
          <label>Client Reference:</label>
          <div class="val">PO-REF-2026-991</div>
        </div>
        <div class="sheet-meta-item">
          <label>Job Description:</label>
          <div class="val">Hydraulic Cylinder 350-Bar Overhaul</div>
        </div>
        <div class="sheet-meta-item">
          <label>Scope:</label>
          <div class="val">Overhaul, hard chroming, rod replacement, precision honing & hydro-testing</div>
        </div>
        <div class="sheet-meta-item">
          <label>Job Completion (Target):</label>
          <div class="val">02-Dec-2026 17:00</div>
        </div>
        <div class="sheet-meta-item">
          <label>Manpower Details:</label>
          <div class="val">Lead Technician (18 hrs) + Assembly Assistant (10 hrs)</div>
        </div>
        <div class="sheet-meta-item">
          <label>PO Status:</label>
          <div class="val"><span class="badge badge-success">✓ Approved (PO-77189-REV2)</span></div>
        </div>
        <div class="sheet-meta-item">
          <label>Technician Name to be assigned:</label>
          <div class="val" style="color: #38bdf8; font-weight: 800;">Raj Kumar (Lead Hydraulic Specialist)</div>
        </div>
      </div>

      <!-- Assignment Configuration Card -->
      <h4 style="margin: 20px 0 10px; font-size: 14px; font-weight: 800; color: #e2e8f0;">
        👷 Technician & Bay Scheduling
      </h4>
      <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 20px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
          <div>
            <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Assign Lead Technician:</label>
            <select class="erp-select" style="width: 100%; margin-top: 6px;">
              <option selected>Raj Kumar (Lead Hydraulic Specialist - Bay 3)</option>
              <option>Vikram Patel (Machinist & Precision Honing)</option>
              <option>Sarah Jenkins (Senior Assembly Technician)</option>
              <option>Elena Rostova (QA & Pressure Testing Specialist)</option>
            </select>
          </div>

          <div>
            <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Workshop Work Bay:</label>
            <select class="erp-select" style="width: 100%; margin-top: 6px;">
              <option selected>Bay Lathe #3 (Heavy Rig & Honing)</option>
              <option>Bay Assembly #1 (Cleanroom)</option>
              <option>Bay Testing #2 (350-Bar Hydro Rig)</option>
            </select>
          </div>

          <div>
            <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Estimated Labour Hours:</label>
            <input type="number" class="erp-input" value="18" style="width: 100%; margin-top: 6px;" />
          </div>

          <div>
            <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Target Completion Date:</label>
            <input type="date" class="erp-input" value="2026-12-02" style="width: 100%; margin-top: 6px;" />
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 20px; gap: 10px;">
          <button class="quick-action-btn btn-primary" onclick="showToast('Job assignment saved and notification sent to Raj Kumar!', 'success')">
            <span>💾</span> Save & Confirm Assignment
          </button>
        </div>
      </div>

      <!-- Bottom Step Progression -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
        <button class="quick-action-btn btn-outline" onclick="switchOpStep('cost_estimations')">
          ⬅ Back to 2.2 Cost Estimations
        </button>
        <button class="quick-action-btn btn-primary" onclick="switchOpStep('assembly_checklist')" style="padding: 10px 20px; font-size: 13.5px;">
          Proceed to 4. Assembly Checklist ➔
        </button>
      </div>
    </div>
  `;
}

// ==========================================
// 2E. STEP 4: ASSEMBLY CHECKLIST
// ==========================================
function getOpStepAssemblyHTML(job) {
  return `
    <div class="op-sheet-card">
      <div class="op-sheet-header">
        <div>
          <span class="badge badge-info" style="margin-bottom: 6px; font-weight: 800;">STAGE 4 • OVERHAUL & ASSEMBLY</span>
          <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #fff;">4. Assembly Checklist & Wrench Time Tracker</h3>
          <p style="margin: 2px 0 0; font-size: 12px; color: #94a3b8;">
            Step-by-step mechanical assembly protocols, torque verifications, seal installations, and live wrench time tracking.
          </p>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <div style="font-size: 12px; color: #cbd5e1; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 6px 12px; border-radius: 6px;">
            ⏱️ Wrench Time: <strong style="color: #34d399;">4.5 Hrs (Active)</strong>
          </div>
          <button class="quick-action-btn btn-primary" onclick="showToast('Assembly checklist verified and signed by Technician!', 'success')">
            <span>✓</span> Sign Assembly
          </button>
        </div>
      </div>

      <!-- Checklist Items Table -->
      <div style="overflow-x: auto; margin-bottom: 20px;">
        <table class="erp-table">
          <thead>
            <tr>
              <th style="width: 50px;">Check</th>
              <th>Assembly Activity & Inspection Criteria</th>
              <th>Specification</th>
              <th>Actual Observed</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center;"><input type="checkbox" checked disabled /></td>
              <td><strong>Internal Barrel Degreasing & Ultrasonic Cleaning</strong></td>
              <td>Zero particulate matter, Ra < 0.2 µm</td>
              <td>Degreased with safety solvent, air dried</td>
              <td style="text-align: center;"><span class="badge badge-success">✓ PASS</span></td>
            </tr>
            <tr>
              <td style="text-align: center;"><input type="checkbox" checked disabled /></td>
              <td><strong>Viton Rod Seals & Piston Chevron Packing</strong></td>
              <td>ISO VG 46 hydraulic lubrication</td>
              <td>Lubricated and seated in groove without twist</td>
              <td style="text-align: center;"><span class="badge badge-success">✓ PASS</span></td>
            </tr>
            <tr>
              <td style="text-align: center;"><input type="checkbox" checked disabled /></td>
              <td><strong>Piston Rod Torque Specification</strong></td>
              <td>850 Nm ± 25 Nm (Calibrated wrench #CW-09)</td>
              <td>Torqued to 855 Nm with Loctite 270 threadlock</td>
              <td style="text-align: center;"><span class="badge badge-success">✓ PASS</span></td>
            </tr>
            <tr>
              <td style="text-align: center;"><input type="checkbox" checked disabled /></td>
              <td><strong>End Gland Bushing Radial Alignment</strong></td>
              <td>Concentricity runout < 0.03 mm</td>
              <td>Dial indicator recorded 0.018 mm</td>
              <td style="text-align: center;"><span class="badge badge-success">✓ PASS</span></td>
            </tr>
            <tr>
              <td style="text-align: center;"><input type="checkbox" checked disabled /></td>
              <td><strong>Tie Rod Nuts Cross-Torque Pattern</strong></td>
              <td>1,200 Nm across 4-bolt pattern</td>
              <td>Achieved 1,200 Nm in 3 staged increments</td>
              <td style="text-align: center;"><span class="badge badge-success">✓ PASS</span></td>
            </tr>
            <tr>
              <td style="text-align: center;"><input type="checkbox" checked disabled /></td>
              <td><strong>Manual Stroke Smoothness Check</strong></td>
              <td>Free movement without binding or notchiness</td>
              <td>Full 1200mm stroke travel verified smooth</td>
              <td style="text-align: center;"><span class="badge badge-success">✓ PASS</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bottom Step Progression -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
        <button class="quick-action-btn btn-outline" onclick="switchOpStep('assign_job')">
          ⬅ Back to 3. Assign Job
        </button>
        <button class="quick-action-btn btn-primary" onclick="switchOpStep('test_report')" style="padding: 10px 20px; font-size: 13.5px;">
          Proceed to 5. Test Report ➔
        </button>
      </div>
    </div>
  `;
}

// ==========================================
// 2F. STEP 5: TEST REPORT
// ==========================================
function getOpStepTestHTML(job) {
  return `
    <div class="op-sheet-card">
      <div class="op-sheet-header">
        <div>
          <span class="badge badge-warning" style="margin-bottom: 6px; font-weight: 800;">STAGE 5 • QUALITY TESTING & CERTIFICATION</span>
          <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #fff;">5. Hydrostatic & Functional Testing Report</h3>
          <p style="margin: 2px 0 0; font-size: 12px; color: #94a3b8;">
            Certified 350-bar hydrostatic pressure test, holding time recording, leakage inspection, and official test certificate generation.
          </p>
        </div>

        <!-- Red Action Button for Test Certificate PDF -->
        <div>
          <button class="btn-red-action" onclick="generateTestCertificatePDF('${job.id}')">
            <span style="font-size: 16px;">⚡</span> Click Here for Test Certificate PDF
          </button>
        </div>
      </div>

      <!-- Test Parameters Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.08); padding: 14px; border-radius: 8px;">
          <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Test Pressure</span>
          <div style="font-size: 20px; font-weight: 900; color: #38bdf8; margin: 4px 0;">350 Bar</div>
          <span style="font-size: 11px; color: #34d399;">Required: 310 - 350 Bar</span>
        </div>

        <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.08); padding: 14px; border-radius: 8px;">
          <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Pressure Holding Time</span>
          <div style="font-size: 20px; font-weight: 900; color: #34d399; margin: 4px 0;">15 Min</div>
          <span style="font-size: 11px; color: #94a3b8;">Zero pressure decay</span>
        </div>

        <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.08); padding: 14px; border-radius: 8px;">
          <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Permissible Leakage</span>
          <div style="font-size: 20px; font-weight: 900; color: #34d399; margin: 4px 0;">0 Drops</div>
          <span style="font-size: 11px; color: #94a3b8;">100% Dry Rod Surface</span>
        </div>

        <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.08); padding: 14px; border-radius: 8px;">
          <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Cycle Count & Smoothness</span>
          <div style="font-size: 20px; font-weight: 900; color: #38bdf8; margin: 4px 0;">10 Cycles</div>
          <span style="font-size: 11px; color: #34d399;">Zero chatter / jitter</span>
        </div>
      </div>

      <!-- Test Decision Banner -->
      <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; border-radius: 8px; padding: 16px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 28px;">🏆</span>
          <div>
            <h4 style="margin: 0; font-size: 15px; color: #34d399; font-weight: 800;">OVERALL TESTING STATUS: PASSED & CERTIFIED</h4>
            <p style="margin: 2px 0 0; font-size: 12px; color: #cbd5e1;">Calibrated Rig #TR-04 • Witnessed by Elena Rostova (QA Inspector)</p>
          </div>
        </div>
        <button class="quick-action-btn btn-outline" style="border-color: #ef4444; color: #f87171;" onclick="triggerRework('${job.id}')">
          Request Retest / Rework
        </button>
      </div>

      <!-- Bottom Step Progression -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
        <button class="quick-action-btn btn-outline" onclick="switchOpStep('assembly_checklist')">
          ⬅ Back to 4. Assembly Checklist
        </button>
        <button class="quick-action-btn btn-primary" onclick="switchOpStep('third_party_certs')" style="padding: 10px 20px; font-size: 13.5px;">
          Proceed to 5.1 3rd Party Certificates ➔
        </button>
      </div>
    </div>
  `;
}

// ==========================================
// 2G. STEP 5.1: 3RD PARTY CERTIFICATES
// ==========================================
function getOpStepThirdPartyHTML(job) {
  return `
    <div class="op-sheet-card">
      <div class="op-sheet-header">
        <div>
          <span class="badge badge-info" style="margin-bottom: 6px; font-weight: 800;">STAGE 5.1 • EXTERNAL CLASSIFICATION</span>
          <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #fff;">5.1 Third Party Inspection & Classification Certificates</h3>
          <p style="margin: 2px 0 0; font-size: 12px; color: #94a3b8;">
            Bureau Veritas (BV), DNV, ABS, or Lloyd's Register witness testing reports and third-party compliance endorsements.
          </p>
        </div>
        <button class="quick-action-btn btn-primary" onclick="showToast('Upload 3rd-party certificate dialog opened!', 'info')">
          <span>📤</span> Upload External Certificate
        </button>
      </div>

      <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <span style="font-size: 32px;">📜</span>
            <div>
              <h4 style="margin: 0; font-size: 14px; color: #fff; font-weight: 700;">Bureau Veritas Witness Certificate #BV-2026-9912</h4>
              <p style="margin: 2px 0 0; font-size: 12px; color: #94a3b8;">
                Surveyor: R. Dupont • Verified 350-bar holding pressure and NDT liquid penetrant testing records.
              </p>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="quick-action-btn btn-outline" onclick="showToast('Displaying BV Witness Certificate PDF...', 'info')">
              <span>👁️</span> View PDF
            </button>
            <span class="badge badge-success" style="align-self: center;">✓ Endorsed</span>
          </div>
        </div>
      </div>

      <!-- Bottom Step Progression -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
        <button class="quick-action-btn btn-outline" onclick="switchOpStep('test_report')">
          ⬅ Back to 5. Test Report
        </button>
        <button class="quick-action-btn btn-primary" onclick="switchOpStep('pre_dispatch')" style="padding: 10px 20px; font-size: 13.5px;">
          Proceed to 6. Pre-dispatch Inspection ➔
        </button>
      </div>
    </div>
  `;
}

// ==========================================
// 2H. STEP 6: PRE-DISPATCH INSPECTION
// ==========================================
function getOpStepPreDispatchHTML(job) {
  return `
    <div class="op-sheet-card">
      <div class="op-sheet-header">
        <div>
          <span class="badge badge-info" style="margin-bottom: 6px; font-weight: 800;">STAGE 6 • FINAL QA RELEASE</span>
          <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #fff;">6. Pre-dispatch Inspection Report (PDIR)</h3>
          <p style="margin: 2px 0 0; font-size: 12px; color: #94a3b8;">
            Final QA sign-off: protective polyurethane coating, port blanking plugs, packaging crate, and warranty tag affixation.
          </p>
        </div>
        <button class="quick-action-btn btn-success" onclick="showToast('Pre-dispatch Inspection signed and authorized for release!', 'success')">
          <span>✓</span> Authorize for Dispatch
        </button>
      </div>

      <!-- Checklist Items -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-bottom: 20px;">
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); padding: 14px; border-radius: 8px;">
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <input type="checkbox" checked disabled />
            <div>
              <strong style="color: #f8fafc; font-size: 13px;">Surface Cleaning & Degreasing</strong>
              <div style="font-size: 11px; color: #94a3b8;">Free of workshop dust, grease, and moisture</div>
            </div>
          </label>
        </div>

        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); padding: 14px; border-radius: 8px;">
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <input type="checkbox" checked disabled />
            <div>
              <strong style="color: #f8fafc; font-size: 13px;">Industrial Polyurethane Paint</strong>
              <div style="font-size: 11px; color: #94a3b8;">RAL 5015 Sky Blue topcoat cured (120 µm DFT)</div>
            </div>
          </label>
        </div>

        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); padding: 14px; border-radius: 8px;">
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <input type="checkbox" checked disabled />
            <div>
              <strong style="color: #f8fafc; font-size: 13px;">Hydraulic Port Blanking Plugs</strong>
              <div style="font-size: 11px; color: #94a3b8;">Heavy duty plastic thread plugs installed on all ports</div>
            </div>
          </label>
        </div>

        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); padding: 14px; border-radius: 8px;">
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <input type="checkbox" checked disabled />
            <div>
              <strong style="color: #f8fafc; font-size: 13px;">QA Passed & Warranty Metal Tag</strong>
              <div style="font-size: 11px; color: #94a3b8;">Stainless steel stamped tag affixed to cylinder barrel</div>
            </div>
          </label>
        </div>
      </div>

      <!-- Bottom Step Progression -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
        <button class="quick-action-btn btn-outline" onclick="switchOpStep('third_party_certs')">
          ⬅ Back to 5.1 3rd Party Certs
        </button>
        <button class="quick-action-btn btn-primary" onclick="switchOpStep('delivery_note')" style="padding: 10px 20px; font-size: 13.5px;">
          Proceed to 7. Delivery Note ➔
        </button>
      </div>
    </div>
  `;
}

// ==========================================
// 2I. STEP 7 & 8: DELIVERY NOTE & INVOICE
// ==========================================
function getOpStepDeliveryNoteHTML(job) {
  return `
    <div class="op-sheet-card">
      <div class="op-sheet-header">
        <div>
          <span class="badge badge-success" style="margin-bottom: 6px; font-weight: 800;">STAGE 7 • LOGISTICS & DISPATCH</span>
          <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #fff;">7. Outward Delivery Note (DN-2026-0044)</h3>
          <p style="margin: 2px 0 0; font-size: 12px; color: #94a3b8;">
            Commercial delivery note generated against approved Job #${job.id}.
          </p>
        </div>
        <button class="quick-action-btn btn-primary" onclick="showToast('Outward Delivery Note PDF generated!', 'info')">
          <span>📄</span> Print Delivery Note
        </button>
      </div>

      <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 20px;">
        <div class="sheet-meta-grid" style="margin-bottom: 0;">
          <div class="sheet-meta-item"><label>Delivery Note No:</label><div class="val" style="color: #38bdf8;">DN-2026-0044</div></div>
          <div class="sheet-meta-item"><label>Dispatch Date:</label><div class="val">28-Nov-2026</div></div>
          <div class="sheet-meta-item"><label>Customer Delivery Address:</label><div class="val">${job.customer} • Central Workshop Gate 4</div></div>
          <div class="sheet-meta-item"><label>Carrier Vehicle:</label><div class="val">Flatbed Rig #TRK-8820 (Driver: Michael Green)</div></div>
        </div>
      </div>

      <!-- Bottom Step Progression -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
        <button class="quick-action-btn btn-outline" onclick="switchOpStep('pre_dispatch')">
          ⬅ Back to 6. Pre-dispatch
        </button>
        <button class="quick-action-btn btn-primary" onclick="switchOpStep('invoice')" style="padding: 10px 20px; font-size: 13.5px;">
          Proceed to 8. Commercial Invoice ➔
        </button>
      </div>
    </div>
  `;
}

function getOpStepInvoiceHTML(job) {
  return `
    <div class="op-sheet-card">
      <div class="op-sheet-header">
        <div>
          <span class="badge badge-success" style="margin-bottom: 6px; font-weight: 800;">STAGE 8 • COMMERCIAL CLOSURE</span>
          <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #fff;">8. Tax Invoice & Financial Settlement</h3>
          <p style="margin: 2px 0 0; font-size: 12px; color: #94a3b8;">
            Final commercial invoice linked to Job #${job.id} and Customer PO #PO-77189-REV2.
          </p>
        </div>
        <button class="quick-action-btn btn-primary" onclick="showToast('Tax Invoice PDF generated and posted to Accounts Ledger!', 'success')">
          <span>🧾</span> Print Official Invoice
        </button>
      </div>

      <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 16px;">
          <div>
            <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Invoice Number</span>
            <div style="font-size: 20px; font-weight: 800; color: #38bdf8;">INV-2026-0089</div>
          </div>
          <div>
            <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Total Invoiced Amount (Excl. Tax)</span>
            <div style="font-size: 22px; font-weight: 900; color: #10b981;">$5,376.74</div>
          </div>
        </div>

        <div class="sheet-meta-grid" style="margin-bottom: 0;">
          <div class="sheet-meta-item"><label>Payment Terms:</label><div class="val">Net 30 Days</div></div>
          <div class="sheet-meta-item"><label>Due Date:</label><div class="val">28-Dec-2026</div></div>
          <div class="sheet-meta-item"><label>Customer Account Status:</label><div class="val" style="color: #34d399;">Active • Verified Credit</div></div>
          <div class="sheet-meta-item"><label>General Ledger Sync:</label><div class="val" style="color: #38bdf8;">✓ Posted to Receivables</div></div>
        </div>
      </div>

      <!-- Bottom Step Progression -->
      <div style="display: flex; justify-content: flex-start; align-items: center; margin-top: 24px;">
        <button class="quick-action-btn btn-outline" onclick="switchOpStep('delivery_note')">
          ⬅ Back to 7. Delivery Note
        </button>
      </div>
    </div>
  `;
}

// ==========================================
// 3. SERVICE DESK JOB CARDS (VIDEO FLOW)
// ==========================================
function getVideoJobCardsHTML(filterStage) {
  let list = erpState.jobs || [];
  if (filterStage && filterStage !== 'all') {
    list = list.filter(j => (j.stage || j.status || '').toLowerCase().includes(filterStage.toLowerCase()));
  }

  if (list.length === 0) {
    return `
      <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: #94a3b8; background: #0f172a; border-radius: 8px;">
        No service jobs matching the stage filter "<strong>${filterStage}</strong>".
      </div>
    `;
  }

  return list.map(j => {
    // Simulated mechanical specs from video demonstration if not explicitly set
    const bore = j.bore || '180 mm';
    const rod = j.rod || '80 mm';
    const stroke = j.stroke || '1,200 mm';
    const pressure = j.testPressure || '310 Bar';
    const problem = j.problem || 'Received for repair & seal replacement';
    const sealKit = j.sealKit || 'Need new (Viton heavy-duty)';
    const labour = j.labourCharge || '$1,530.00';
    const partsUsed = j.partsUsed || [
      { name: 'Parker PVP333 Rotary Group Kit', qty: '1 Set' },
      { name: 'Parker PVP Viton Seal Kit', qty: '1 Kit' },
      { name: 'FAG High-Load Shaft Bearing', qty: '2 Pcs' }
    ];

    return `
      <div class="video-job-card">
        <!-- Top Row: Job ID & Status -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #38bdf8;">${j.id}</div>
            <div style="font-size: 13.5px; font-weight: 700; color: #fff; margin-top: 2px;">${j.customer}</div>
            <div style="font-size: 12px; color: #94a3b8;">${j.equipment} • <span style="color: #cbd5e1;">${j.model || 'Heavy-Duty'}</span></div>
          </div>
          <span class="badge ${j.status.includes('Completed') ? 'badge-success' : 'badge-info'}" style="font-size: 11px;">
            ${j.stage || j.status}
          </span>
        </div>

        <!-- Mechanical Specs from Video Demo (Bore, Rod, Stroke, Pressure) -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 6px; padding: 8px 10px; margin-bottom: 12px; text-align: center;">
          <div>
            <div style="font-size: 10px; color: #64748b; font-weight: 700;">BORE</div>
            <div style="font-size: 12px; font-weight: 700; color: #f1f5f9;">${bore}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: #64748b; font-weight: 700;">ROD</div>
            <div style="font-size: 12px; font-weight: 700; color: #f1f5f9;">${rod}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: #64748b; font-weight: 700;">STROKE</div>
            <div style="font-size: 12px; font-weight: 700; color: #f1f5f9;">${stroke}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: #64748b; font-weight: 700;">TEST BAR</div>
            <div style="font-size: 12px; font-weight: 700; color: #38bdf8;">${pressure}</div>
          </div>
        </div>

        <!-- Problem & Seal Kit info from Video -->
        <div style="font-size: 11.5px; color: #cbd5e1; margin-bottom: 8px;">
          <strong style="color: #94a3b8;">Problem:</strong> ${problem}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11.5px; color: #cbd5e1; margin-bottom: 10px;">
          <span><strong style="color: #94a3b8;">Seal Kit:</strong> ${sealKit}</span>
          <span><strong style="color: #94a3b8;">Labour:</strong> <strong style="color: #34d399;">${labour}</strong></span>
        </div>

        <!-- Parts Used from Stock (from Video) -->
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 8px; margin-bottom: 12px;">
          <div style="font-size: 10.5px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px;">
            Parts Consumed from Stock:
          </div>
          ${partsUsed.map(p => `
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-bottom: 2px;">
              <span>• ${p.name}</span>
              <strong style="color: #e2e8f0;">${p.qty}</strong>
            </div>
          `).join('')}
        </div>

        <!-- Card Action: Open in Operations Stepper -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.06); padding-top: 10px;">
          <span style="font-size: 11px; color: #64748b;">Tech: <strong>${j.technician || 'Raj Kumar'}</strong></span>
          <button class="quick-action-btn btn-outline" style="padding: 4px 10px; font-size: 11px;" onclick="selectOpJob('${j.id}')">
            Open in Operations ➔
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// 4. TO-DO QUEUE DRAWER CONTROLLER
// ==========================================
function toggleTodoPanel() {
  const drawer = document.getElementById('todoDrawer');
  const backdrop = document.getElementById('todoBackdrop');
  if (!drawer) return;

  const isOpen = drawer.classList.contains('active') || drawer.classList.contains('open');
  if (isOpen) {
    closeTodoPanel();
  } else {
    drawer.classList.add('active');
    drawer.classList.add('open');
    if (backdrop) {
      backdrop.classList.add('active');
      backdrop.classList.add('open');
    }
    renderTodoList();
  }
}

function closeTodoPanel() {
  const drawer = document.getElementById('todoDrawer');
  const backdrop = document.getElementById('todoBackdrop');
  if (drawer) {
    drawer.classList.remove('active');
    drawer.classList.remove('open');
  }
  if (backdrop) {
    backdrop.classList.remove('active');
    backdrop.classList.remove('open');
  }
}

// Ensure globally accessible on window
window.toggleTodoPanel = toggleTodoPanel;
window.closeTodoPanel = closeTodoPanel;

function renderTodoList() {
  const container = document.getElementById('todoListContainer');
  if (!container) return;

  let list = erpState.todoList || [];
  const currentRole = erpState.currentUser ? erpState.currentUser.roleKey : 'workshop_manager';

  if (currentTodoFilter === 'mine') {
    list = list.filter(t => t.roleKey === currentRole);
  } else if (currentTodoFilter === 'urgent') {
    list = list.filter(t => t.priority === 'Urgent');
  }

  // Update counts
  const allCount = (erpState.todoList || []).filter(t => !t.completed).length;
  const countSpan = document.getElementById('todoCountAll');
  if (countSpan) countSpan.textContent = allCount;
  
  const badge = document.getElementById('topbarTodoBadge');
  if (badge) {
    badge.textContent = allCount;
    badge.style.display = allCount === 0 ? 'none' : 'flex';
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div style="padding: 30px; text-align: center; color: #94a3b8; font-size: 13px;">
        🎉 All operational tasks in this queue are completed!
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(item => {
    const isDone = item.completed === true;
    const prioColor = item.priority === 'Urgent' ? '#f87171' : (item.priority === 'High' ? '#fbbf24' : '#38bdf8');

    return `
      <div class="todo-item-card" style="opacity: ${isDone ? 0.6 : 1}; border-left: 3px solid ${prioColor};">
        <div style="display: flex; gap: 10px; align-items: flex-start;">
          <input type="checkbox" ${isDone ? 'checked' : ''} style="margin-top: 4px; cursor: pointer;" onchange="toggleTodoComplete('${item.id}')" />
          <div style="flex: 1;" onclick="jumpToTodoStep('${item.jobRef}', '${item.step}')">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #fff; text-decoration: ${isDone ? 'line-through' : 'none'}; cursor: pointer;">
                ${item.title}
              </h4>
              <span style="font-size: 10px; font-weight: 800; color: ${prioColor}; background: rgba(255, 255, 255, 0.05); padding: 2px 6px; border-radius: 4px;">
                ${item.priority}
              </span>
            </div>
            <p style="margin: 3px 0 0; font-size: 11.5px; color: #94a3b8;">${item.subtitle}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 10.5px; color: #64748b;">
              <span>Target: <strong>${item.due}</strong></span>
              <span style="color: #38bdf8; font-weight: 700; cursor: pointer;">Jump to Step ➔</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filterTodoList(filterType) {
  currentTodoFilter = filterType;
  document.querySelectorAll('.todo-filter-chip').forEach(c => c.classList.remove('active'));
  
  if (filterType === 'all') {
    const chip = document.getElementById('chipTodoAll');
    if (chip) chip.classList.add('active');
  } else if (filterType === 'mine') {
    const chip = document.getElementById('chipTodoMine');
    if (chip) chip.classList.add('active');
  } else if (filterType === 'urgent') {
    const chip = document.getElementById('chipTodoUrgent');
    if (chip) chip.classList.add('active');
  }

  renderTodoList();
}

function toggleTodoComplete(todoId) {
  const item = (erpState.todoList || []).find(t => t.id === todoId);
  if (item) {
    item.completed = !item.completed;
    saveERPData(erpState);
    renderTodoList();
    showToast(item.completed ? `Task marked complete!` : `Task marked active`, 'info');
  }
}

function jumpToTodoStep(jobRef, stepKey) {
  currentTab = 'operations';
  selectedOpJobId = jobRef;
  currentOpStep = stepKey;
  closeTodoPanel();
  
  // Re-render sidebar to highlight Operations
  renderSidebarForActiveRole();
  renderCurrentTab();
  showToast(`Jumped to Operations: ${stepKey} for Job #${jobRef}`, 'info');
}

// ==========================================
// 5. INTERACTIVE ACTION HANDLERS
// ==========================================

// Inspection Report PDF Generation (Red Button in Sheet 2)
function generateInspectionReportPDF(jobId) {
  const job = erpState.jobs.find(j => j.id === jobId) || erpState.jobs[0];
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');
  const footer = document.getElementById('modalFooter');

  title.textContent = `Initial Inspection Report (PDF Preview) - ${job.id}`;
  body.innerHTML = `
    <div style="background: #ffffff; color: #0f172a; padding: 24px; border-radius: 6px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <!-- Document Header -->
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
        <div>
          <div style="font-size: 20px; font-weight: 900; letter-spacing: 1px; color: #0284c7;">NEXUS INDUSTRIAL SERVICES</div>
          <div style="font-size: 11px; color: #475569;">Heavy Hydraulic Overhaul & Precision Engineering Center</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 14px; font-weight: 800; color: #dc2626;">INITIAL INSPECTION REPORT</div>
          <div style="font-size: 11px; color: #475569;">Report #: <strong>IIR-2026-088</strong> • Date: 25-Nov-2026</div>
        </div>
      </div>

      <!-- Meta Grid -->
      <table style="width: 100%; border-collapse: collapse; font-size: 11.5px; margin-bottom: 16px;">
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 4px; color: #64748b; width: 25%;">Client Name:</td>
          <td style="padding: 4px; font-weight: 700; width: 25%;">${job.customer}</td>
          <td style="padding: 4px; color: #64748b; width: 25%;">Job Number:</td>
          <td style="padding: 4px; font-weight: 700; width: 25%; color: #0284c7;">${job.id}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 4px; color: #64748b;">Equipment Details:</td>
          <td style="padding: 4px; font-weight: 700;">${job.equipment}</td>
          <td style="padding: 4px; color: #64748b;">Serial Number:</td>
          <td style="padding: 4px; font-weight: 700; font-family: monospace;">${job.serialNumber || '2026-HC-8912'}</td>
        </tr>
      </table>

      <!-- Findings Summary -->
      <div style="font-size: 12px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">DISMANTLING FINDINGS & RECOMMENDATIONS:</div>
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px; border: 1px solid #cbd5e1;">
        <thead>
          <tr style="background: #f1f5f9; text-align: left;">
            <th style="padding: 6px; border: 1px solid #cbd5e1;">Component</th>
            <th style="padding: 6px; border: 1px solid #cbd5e1;">Observation</th>
            <th style="padding: 6px; border: 1px solid #cbd5e1;">Recommendation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">Cylinder Barrel Bore</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">Scored bore (0.35mm depth); micrometer runout 0.08mm.</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: 700; color: #0284c7;">REPAIR (Honing)</td>
          </tr>
          <tr>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">Piston Rod</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">Chrome layer flaked at 450mm mark; runout 0.42mm.</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: 700; color: #dc2626;">REPLACE (New Rod)</td>
          </tr>
          <tr>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">Gland Bush & Seals</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">Radial play 0.45mm; Viton seals charred and decomposed.</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: 700; color: #dc2626;">REPLACE (Bronze Bush)</td>
          </tr>
        </tbody>
      </table>

      <!-- Digital Signature Stamps -->
      <div style="display: flex; justify-content: space-between; margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
        <div style="text-align: center; width: 45%;">
          <div style="font-family: 'Great Vibes', cursive; font-size: 24px; color: #0284c7;">Raj Kumar</div>
          <div style="font-size: 11px; font-weight: 700; color: #0f172a;">Raj Kumar (Lead Technician)</div>
          <div style="font-size: 10px; color: #16a34a;">🔒 Digitally Signed • Emp #TK-802</div>
        </div>
        <div style="text-align: center; width: 45%;">
          <div style="font-family: 'Great Vibes', cursive; font-size: 24px; color: #0284c7;">David Miller</div>
          <div style="font-size: 11px; font-weight: 700; color: #0f172a;">David Miller (Workshop Manager)</div>
          <div style="font-size: 10px; color: #16a34a;">🔒 Cryptographically Approved • SHA-256 Verified</div>
        </div>
      </div>
    </div>
  `;

  footer.innerHTML = `
    <button class="quick-action-btn btn-outline" onclick="closeModal()">Close Preview</button>
    <button class="quick-action-btn btn-primary" onclick="showToast('Downloading Official Inspection PDF (IIR-2026-088.pdf)...', 'success'); closeModal();">
      <span>💾</span> Download PDF
    </button>
  `;

  openModal();
}

// Costing Email Dispatch to Sales Person (Red Button in Sheet 2.2)
function sendCostingEmailToSales(jobId) {
  const job = erpState.jobs.find(j => j.id === jobId) || erpState.jobs[0];
  
  // Add notification to ERP state
  erpState.notifications.unshift({
    id: `NT-${Date.now()}`,
    title: `Repair Costing Approved & Dispatched: Job #${job.id}`,
    time: 'Just now',
    unread: true,
    desc: `Total selling price of $5,376.74 (18% margin) transmitted to Sales Person (${job.salesPerson || 'David Miller'}) for customer quotation.`
  });
  saveERPData(erpState);
  updateTopbarNotifications();

  showToast(`Cost estimation for Job #${job.id} transmitted via email to Sales Person (${job.salesPerson || 'David Miller'})!`, 'success');
}

// Digital Signature Authentication Modal
function openDigitalSignModal(signerRole, stepKey) {
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');
  const footer = document.getElementById('modalFooter');

  title.textContent = `Authenticated Electronic Signature`;
  body.innerHTML = `
    <div style="padding: 10px 0;">
      <p style="font-size: 13px; color: #cbd5e1; margin-bottom: 16px;">
        To apply your certified cryptographic electronic signature to this record, please confirm your employee credentials:
      </p>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div>
          <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Employee ID / Username:</label>
          <input type="text" class="erp-input" value="${erpState.currentUser ? erpState.currentUser.id : 'EMP-WM-002'}" readonly style="width: 100%; margin-top: 4px;" />
        </div>

        <div>
          <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Authorizing Signer:</label>
          <input type="text" class="erp-input" value="${erpState.currentUser ? erpState.currentUser.name : 'David Miller'}" readonly style="width: 100%; margin-top: 4px;" />
        </div>

        <div>
          <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Security PIN / Password:</label>
          <input type="password" id="digitalSignPin" class="erp-input" placeholder="Enter PIN (Demo: 1234)" value="1234" style="width: 100%; margin-top: 4px;" />
        </div>
      </div>
    </div>
  `;

  footer.innerHTML = `
    <button class="quick-action-btn btn-outline" onclick="closeModal()">Cancel</button>
    <button class="quick-action-btn btn-success" onclick="confirmDigitalSignature('${signerRole}', '${stepKey}')">
      <span>🔒</span> Authenticate & Sign
    </button>
  `;

  openModal();
}

function confirmDigitalSignature(signerRole, stepKey) {
  const job = erpState.jobs.find(j => j.id === (selectedOpJobId || 'J000248')) || erpState.jobs[0];
  if (job) {
    job.inspectionSigned = true;
    saveERPData(erpState);
  }
  closeModal();
  renderCurrentTab();
  showToast('Electronic cryptographic signature validated and stamped!', 'success');
}

// Modal for Creating New Job Card (Matching Video Demonstration)
function openNewJobCardModal() {
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');
  const footer = document.getElementById('modalFooter');

  title.textContent = `Create New Service Job Card (Workshop Service Desk)`;
  body.innerHTML = `
    <form id="newJobCardForm" onsubmit="saveNewJobCard(event)" style="font-size: 13px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
        <div>
          <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Customer Name:</label>
          <select id="newJobCustomer" class="erp-select" style="width: 100%; margin-top: 4px;" required>
            <option value="ABC Mining Corp">ABC Mining Corp</option>
            <option value="Petro Energy LLC">Petro Energy LLC</option>
            <option value="Gulf Power Station">Gulf Power Station</option>
            <option value="Marine Offshore Heavy">Marine Offshore Heavy</option>
          </select>
        </div>

        <div>
          <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Equipment Type & Description:</label>
          <input type="text" id="newJobEquip" class="erp-input" value="Hydraulic Cylinder Overhaul" style="width: 100%; margin-top: 4px;" required />
        </div>
      </div>

      <!-- Mechanical Dimensions from Video (Bore, Rod, Stroke, Pressure) -->
      <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 6px; padding: 12px; margin-bottom: 14px;">
        <span style="font-size: 11px; color: #38bdf8; text-transform: uppercase; font-weight: 700;">Mechanical Specifications (Video Parameters):</span>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 8px;">
          <div>
            <label style="font-size: 10px; color: #94a3b8;">Bore (mm):</label>
            <input type="text" id="newJobBore" class="erp-input" value="180 mm" style="width: 100%;" required />
          </div>
          <div>
            <label style="font-size: 10px; color: #94a3b8;">Rod (mm):</label>
            <input type="text" id="newJobRod" class="erp-input" value="80 mm" style="width: 100%;" required />
          </div>
          <div>
            <label style="font-size: 10px; color: #94a3b8;">Stroke (mm):</label>
            <input type="text" id="newJobStroke" class="erp-input" value="1,200 mm" style="width: 100%;" required />
          </div>
          <div>
            <label style="font-size: 10px; color: #94a3b8;">Test Bar:</label>
            <input type="text" id="newJobPressure" class="erp-input" value="310 Bar" style="width: 100%;" required />
          </div>
        </div>
      </div>

      <!-- Problem & Seal Kit from Video -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
        <div>
          <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Problem Description:</label>
          <input type="text" id="newJobProblem" class="erp-input" value="Received for repair & seal replacement" style="width: 100%; margin-top: 4px;" required />
        </div>

        <div>
          <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Seal Kit Requirement:</label>
          <select id="newJobSealKit" class="erp-select" style="width: 100%; margin-top: 4px;">
            <option value="Need new (Viton heavy-duty)">Need new (Viton heavy-duty)</option>
            <option value="Customer Supplied">Customer Supplied</option>
            <option value="Standard NBR Kit">Standard NBR Kit</option>
          </select>
        </div>
      </div>

      <!-- Labour Charge -->
      <div style="margin-bottom: 14px;">
        <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Estimated Labour Charge ($):</label>
        <input type="text" id="newJobLabour" class="erp-input" value="$1,530.00" style="width: 100%; margin-top: 4px;" />
      </div>

      <!-- Parts from Stock Picker (from Video) -->
      <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 12px; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 11px; color: #34d399; text-transform: uppercase; font-weight: 700;">Add Parts from Warehouse Stock:</span>
          <button type="button" class="quick-action-btn btn-outline" style="padding: 2px 8px; font-size: 11px;" onclick="addPartRowToNewJob()">
            + Add Stock Item
          </button>
        </div>
        <div id="newJobPartsList">
          <div class="part-item-row" style="display: flex; gap: 8px; margin-bottom: 6px;">
            <select class="erp-select" style="flex: 1;">
              ${(erpState.inventory || []).map(inv => `<option value="${inv.name}">${inv.code} - ${inv.name} (Stock: ${inv.stock} ${inv.uom})</option>`).join('')}
            </select>
            <input type="text" class="erp-input" placeholder="Qty" value="1 Set" style="width: 80px;" />
          </div>
        </div>
      </div>
    </form>
  `;

  footer.innerHTML = `
    <button class="quick-action-btn btn-outline" onclick="closeModal()">Cancel</button>
    <button class="quick-action-btn btn-primary" onclick="document.getElementById('newJobCardForm').requestSubmit()">
      <span>💾</span> Create Service Job Card
    </button>
  `;

  openModal();
}

function addPartRowToNewJob() {
  const container = document.getElementById('newJobPartsList');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'part-item-row';
  div.style.cssText = 'display: flex; gap: 8px; margin-bottom: 6px;';
  div.innerHTML = `
    <select class="erp-select" style="flex: 1;">
      ${(erpState.inventory || []).map(inv => `<option value="${inv.name}">${inv.code} - ${inv.name} (Stock: ${inv.stock} ${inv.uom})</option>`).join('')}
    </select>
    <input type="text" class="erp-input" placeholder="Qty" value="1 Pc" style="width: 80px;" />
    <button type="button" class="btn-icon" onclick="this.parentElement.remove()" style="color: #ef4444;">✕</button>
  `;
  container.appendChild(div);
}

function saveNewJobCard(e) {
  e.preventDefault();
  const nextId = `J000${249 + (erpState.jobs ? erpState.jobs.length : 0)}`;
  const cust = document.getElementById('newJobCustomer').value;
  const equip = document.getElementById('newJobEquip').value;
  const bore = document.getElementById('newJobBore').value;
  const rod = document.getElementById('newJobRod').value;
  const stroke = document.getElementById('newJobStroke').value;
  const pressure = document.getElementById('newJobPressure').value;
  const problem = document.getElementById('newJobProblem').value;
  const sealKit = document.getElementById('newJobSealKit').value;
  const labour = document.getElementById('newJobLabour').value;

  const newJob = {
    id: nextId,
    customer: cust,
    equipment: equip,
    model: 'HD-Custom',
    serialNumber: `SN-${Date.now().toString().slice(-6)}`,
    status: 'In Progress',
    stage: 'Received',
    technician: 'Raj Kumar',
    date: '28-Nov-2026',
    bore: bore,
    rod: rod,
    stroke: stroke,
    testPressure: pressure,
    problem: problem,
    sealKit: sealKit,
    labourCharge: labour,
    partsUsed: [
      { name: 'Parker PVP Viton Seal Kit', qty: '1 Kit' },
      { name: 'FAG High-Load Shaft Bearing', qty: '2 Pcs' }
    ]
  };

  erpState.jobs.unshift(newJob);
  selectedOpJobId = nextId;
  saveERPData(erpState);
  closeModal();
  renderCurrentTab();
  showToast(`Job Card #${nextId} created successfully!`, 'success');
}

// ==========================================
// 6. VIDEO 2 FLOW: STAGE REPORTS & SIGN OFF
// ==========================================
function openStageReportModal(stageKey, jobId) {
  const job = erpState.jobs.find(j => j.id === jobId) || erpState.jobs[0];
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');
  const footer = document.getElementById('modalFooter');

  const stageNames = {
    receiving: 'Receiving',
    dismantling: 'Dismantling',
    cleaning: 'Cleaning',
    initial_inspection: 'Inspection',
    cost_estimations: 'Repair & Costing',
    assembly_checklist: 'Assembly',
    test_report: 'Testing',
    pre_dispatch: 'Pre-dispatch'
  };

  const stageTitle = stageNames[stageKey] || 'Stage';
  title.textContent = `${stageTitle} Report Preview`;

  body.innerHTML = `
    <div class="clean-report-sheet">
      <div class="clean-report-title">
        <div>
          <div style="font-size: 19px; font-weight: 800; color: #0284c7;">${stageTitle} report</div>
          <div style="font-size: 11px; color: #64748b; font-weight: normal; margin-top: 2px;">NEXUS INDUSTRIAL SERVICE DESK ERP</div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #475569; font-weight: normal;">
          Report ID: <strong>REP-${job.id}-${stageKey.toUpperCase()}</strong><br>
          Generated: 28-Nov-2026
        </div>
      </div>

      <table class="clean-report-table">
        <tbody>
          <tr>
            <td class="label-col">Enquiry / job</td>
            <td class="val-col" style="color: #0284c7;">${job.id} (${job.enquiryId || 'ENQ-0002'})</td>
          </tr>
          <tr>
            <td class="label-col">Customer</td>
            <td class="val-col">${job.customer} (${job.contactNumber || '5518'})</td>
          </tr>
          <tr>
            <td class="label-col">Equipment</td>
            <td class="val-col">${job.equipment} ${job.manufacturer || 'Shvvan'} ${job.model || 'Annab'}, serial ${job.serialNumber || 'Thiabjk'}</td>
          </tr>
          <tr>
            <td class="label-col">Complaint</td>
            <td class="val-col">${job.problem || 'Repair'}</td>
          </tr>
          <tr>
            <td class="label-col">Enquiry date</td>
            <td class="val-col">${job.date || '2026-11-27'}</td>
          </tr>
          <tr>
            <td class="label-col">Customer delivery note number</td>
            <td class="val-col">${job.customerDnNo || 'Thabk / DN-CRN-88219'}</td>
          </tr>
          <tr>
            <td class="label-col">Quantity received</td>
            <td class="val-col">${job.quantityReceived || '8 Units'}</td>
          </tr>
          <tr>
            <td class="label-col">Condition at receiving</td>
            <td class="val-col">${job.conditionAtReceiving || 'Right'}</td>
          </tr>
          <tr>
            <td class="label-col">Accessories received</td>
            <td class="val-col">${job.accessoriesReceived || 'Ghjjb / Port Plugs & Hardware'}</td>
          </tr>
          <tr>
            <td class="label-col">Missing or damaged accessories</td>
            <td class="val-col">${job.missingAccessories || '-NA-'}</td>
          </tr>
          <tr>
            <td class="label-col">Technician remarks</td>
            <td class="val-col">${job.technicianRemarks || 'Need approval'}</td>
          </tr>
          <tr>
            <td class="label-col">Signatures</td>
            <td class="val-col" style="color: #16a34a;">
              ✓ Signed: ${job[stageKey + 'Signer'] || '123 (Technician)'}, 27 Nov 2026 at 10:28 AM.<br>
              <span style="color: #64748b; font-size: 11px;">Waiting for a different manager to approve.</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  footer.innerHTML = `
    <button class="quick-action-btn btn-outline" onclick="closeModal()">Close</button>
    <button class="quick-action-btn btn-primary" onclick="showToast('Printing or saving PDF (${stageTitle}_Report_${job.id}.pdf)...', 'success'); closeModal();">
      <span>🖨️</span> Print or save as PDF
    </button>
  `;

  openModal();
}

function openFullJobReportModal(jobId) {
  const job = erpState.jobs.find(j => j.id === jobId) || erpState.jobs[0];
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');
  const footer = document.getElementById('modalFooter');

  title.textContent = `Full Job Report - ${job.id}`;

  body.innerHTML = `
    <div class="clean-report-sheet">
      <div class="clean-report-title">
        <div>
          <div style="font-size: 20px; font-weight: 800; color: #0284c7;">NEXUS FULL JOB LIFECYCLE REPORT</div>
          <div style="font-size: 11px; color: #64748b; font-weight: normal; margin-top: 2px;">Comprehensive Technical & Overhaul Audit</div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #475569; font-weight: normal;">
          Job No: <strong style="color: #0284c7;">${job.id}</strong><br>
          Enquiry: ${job.enquiryId || 'ENQ-0002'}
        </div>
      </div>

      <div style="margin-bottom: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 12px;">
          <div><strong>Customer:</strong> ${job.customer}</div>
          <div><strong>Equipment:</strong> ${job.equipment} (${job.model || 'Heavy-Duty'})</div>
          <div><strong>Serial Number:</strong> ${job.serialNumber || '2026-HC-8912'}</div>
          <div><strong>Complaint / Scope:</strong> ${job.problem || 'Overhaul & Seal Replacement'}</div>
        </div>
      </div>

      <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 16px 0 6px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">
        1. STAGE PROGRESSION SUMMARY:
      </div>
      <table class="clean-report-table">
        <tbody>
          <tr><td class="label-col">Stage 1: Inward Receiving</td><td class="val-col">DN: ${job.customerDnNo || 'DN-CRN-88219'} • Qty: ${job.quantityReceived || '1'} • Condition: Right</td></tr>
          <tr><td class="label-col">Stage 2: Dismantling & Cleaning</td><td class="val-col">Ultrasonic degreased • Shaft runout 0.42 mm • Honing required</td></tr>
          <tr><td class="label-col">Stage 3: Initial Inspection</td><td class="val-col">Findings logged • Barrel Repair / Rod Replace / Gland Replace</td></tr>
          <tr><td class="label-col">Stage 4: Costing & Quotation</td><td class="val-col">Total Selling Price: <strong>$5,376.74</strong> (18% gross margin) • Dispatched to Sales</td></tr>
          <tr><td class="label-col">Stage 5: Assembly & Wrench Time</td><td class="val-col">Lead Tech: Raj Kumar • Elapsed wrench time: 4.5 hrs • 850 Nm torqued</td></tr>
          <tr><td class="label-col">Stage 6: 350-Bar Hydro Testing</td><td class="val-col" style="color: #16a34a; font-weight: 800;">PASSED • 15 Min Holding Time • 0 Drops Leakage</td></tr>
          <tr><td class="label-col">Stage 7: Pre-dispatch & DN</td><td class="val-col">RAL 5015 topcoat • Port plugs installed • Delivery Note generated</td></tr>
        </tbody>
      </table>

      <div style="display: flex; justify-content: space-between; margin-top: 24px; padding-top: 12px; border-top: 1px solid #cbd5e1; font-size: 11px;">
        <div>Signed by Lead Technician: <strong>Raj Kumar (Emp #TK-802)</strong></div>
        <div>Approved by Workshop Manager: <strong>David Miller (Emp #WM-002)</strong></div>
      </div>
    </div>
  `;

  footer.innerHTML = `
    <button class="quick-action-btn btn-outline" onclick="closeModal()">Close</button>
    <button class="quick-action-btn btn-primary" onclick="showToast('Downloading Full Job Lifecycle PDF...', 'success'); closeModal();">
      <span>🖨️</span> Print or save as PDF
    </button>
  `;

  openModal();
}

function signAndSubmitStage(stageKey, jobId) {
  const job = erpState.jobs.find(j => j.id === jobId) || erpState.jobs[0];
  const currentUser = erpState.currentUser ? erpState.currentUser.name : 'Raj Kumar';
  const currentRole = erpState.currentUser ? erpState.currentUser.roleKey : 'Technician';

  job[stageKey + 'Signed'] = true;
  job[stageKey + 'Signer'] = `${currentUser} (${currentRole})`;
  job[stageKey + 'SignedDate'] = new Date().toLocaleString();

  saveERPData(erpState);
  renderCurrentTab();
  showToast(`Stage '${stageKey}' signed by ${currentUser}! Waiting for manager approval.`, 'success');
}

function addPhotoToStage(stageKey, jobId) {
  const job = erpState.jobs.find(j => j.id === jobId) || erpState.jobs[0];
  if (!job.photos) job.photos = [];
  
  const photoNames = [
    'Bore Surface Profilometer Scan',
    'Rod Gland Bushing Play',
    'Port Flange Thread Verification',
    'Ultrasonic Cleaning Finish',
    'Piston Seal Seating Check'
  ];
  const nextName = photoNames[job.photos.length % photoNames.length];
  job.photos.push({ name: nextName, icon: '📷' });

  saveERPData(erpState);
  renderCurrentTab();
  showToast(`Photo added: "${nextName}"`, 'info');
}

function removePhotoFromStage(stageKey, jobId, idx) {
  const job = erpState.jobs.find(j => j.id === jobId) || erpState.jobs[0];
  if (job.photos && job.photos.length > idx) {
    job.photos.splice(idx, 1);
    saveERPData(erpState);
    renderCurrentTab();
    showToast('Photo removed', 'info');
  }
}

// "Who is using this device?" User Switcher Modal matching Video
function openDeviceUserModal() {
  const title = document.getElementById('modalTitle');
  const body = document.getElementById('modalBody');
  const footer = document.getElementById('modalFooter');

  title.textContent = "Who is using this device?";
  body.innerHTML = `
    <div style="font-size: 13px;">
      <p style="color: #94a3b8; margin-bottom: 16px;">
        Your name and role are printed on signatures and approvals.
      </p>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div>
          <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Name:</label>
          <input type="text" id="deviceUserName" class="erp-input" value="${erpState.currentUser ? erpState.currentUser.name : 'Raj Kumar'}" style="width: 100%; margin-top: 4px;" required />
        </div>

        <div>
          <label style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700;">Role:</label>
          <select id="deviceUserRole" class="erp-select" style="width: 100%; margin-top: 4px;">
            <option value="technician" ${erpState.currentUser && erpState.currentUser.roleKey === 'technician' ? 'selected' : ''}>Technician</option>
            <option value="workshop_manager" ${erpState.currentUser && erpState.currentUser.roleKey === 'workshop_manager' ? 'selected' : ''}>Workshop Manager</option>
            <option value="qa_inspector" ${erpState.currentUser && erpState.currentUser.roleKey === 'qa_inspector' ? 'selected' : ''}>QA Inspector</option>
            <option value="sales_executive" ${erpState.currentUser && erpState.currentUser.roleKey === 'sales_executive' ? 'selected' : ''}>Salesperson</option>
            <option value="country_manager" ${erpState.currentUser && erpState.currentUser.roleKey === 'country_manager' ? 'selected' : ''}>Country Manager</option>
            <option value="storekeeper" ${erpState.currentUser && erpState.currentUser.roleKey === 'storekeeper' ? 'selected' : ''}>Storekeeper</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>
    </div>
  `;

  footer.innerHTML = `
    <button class="quick-action-btn btn-outline" onclick="closeModal()">Cancel</button>
    <button class="quick-action-btn btn-primary" onclick="confirmDeviceUserSwitch()">
      <span>✓</span> Save
    </button>
  `;

  openModal();
}

function confirmDeviceUserSwitch() {
  const nameInput = document.getElementById('deviceUserName').value;
  const roleKey = document.getElementById('deviceUserRole').value;

  if (erpState.currentUser) {
    erpState.currentUser.name = nameInput;
    erpState.currentUser.roleKey = roleKey === 'admin' ? 'workshop_manager' : roleKey;
  }
  saveERPData(erpState);
  closeModal();
  updateUserHeader();
  renderSidebarForActiveRole();
  renderCurrentTab();
  showToast(`Active device user set to: ${nameInput} (${roleKey})`, 'success');
}

window.openStageReportModal = openStageReportModal;
window.openFullJobReportModal = openFullJobReportModal;
window.signAndSubmitStage = signAndSubmitStage;
window.addPhotoToStage = addPhotoToStage;
window.removePhotoFromStage = removePhotoFromStage;
window.openDeviceUserModal = openDeviceUserModal;
window.confirmDeviceUserSwitch = confirmDeviceUserSwitch;
