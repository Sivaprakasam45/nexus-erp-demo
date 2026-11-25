/**
 * NEXUS Industrial Overhaul & Service ERP - Data Engine & Session Storage Persistence
 * Implements strict Role-Based Access Control (RBAC) across 7 distinct personas.
 */

const STORAGE_KEY = 'NEXUS_ERP_DEMO_DATA_V3_2';

// 9 Standard Unified ERP Modules (From System Design Sketch)
const COMMON_ERP_MODULES = [
  { id: 'dashboard', num: '0', label: 'Dashboard', icon: '📊', badge: '' },
  { id: 'sales', num: '1', label: '1. Sales', icon: '💼', badge: '3', primaryRoles: ['sales'] },
  { id: 'operations', num: '2', label: '2. Operation', icon: '⚙️', badge: '5', primaryRoles: ['workshop_manager'] },
  { id: 'inventory', num: '3', label: '3. Inventory', icon: '📦', badge: 'Stores', primaryRoles: ['purchaser'] },
  { id: 'purchase', num: '4', label: '4. Purchase', icon: '🛒', badge: '2', primaryRoles: ['purchaser', 'country_manager'] },
  { id: 'technician', num: '5', label: '5. Job Holder', icon: '🔧', badge: 'Tech', primaryRoles: ['technician'] },
  { id: 'reports', num: '6', label: '6. Reports', icon: '📑', badge: '', primaryRoles: ['workshop_manager', 'country_manager'] },
  { id: 'assets', num: '7', label: '7. Asset', icon: '🏭', badge: '', primaryRoles: ['receiving'] },
  { id: 'settings', num: '8', label: '8. IMS & Setting', icon: '🛡️', badge: 'IMS', primaryRoles: ['workshop_manager', 'qa_inspector', 'country_manager'] }
];

// Strict RBAC Role Configurations & Authorized Modules Matrix
const RBAC_CONFIG = {
  sales: {
    key: 'sales',
    name: 'Alex Turner',
    title: 'Sales Executive',
    avatar: '👔',
    badge: 'Sales & Commercial',
    department: 'Sales & Commercial',
    allowedTabs: [
      { id: 'sales', label: 'Sales Dashboard', icon: '💼', badge: '3' },
      { id: 'enquiries', label: 'Customer Enquiries', icon: '📩' },
      { id: 'quotations', label: 'Quotations & Discount', icon: '📑' },
      { id: 'invoicing', label: 'Delivery Notes & Invoices', icon: '💵' }
    ],
    defaultTab: 'sales',
    permissions: [
      'create_enquiry',
      'handover_to_workshop',
      'send_quotation',
      'request_discount',
      'convert_job_to_service'
    ],
    description: 'Authorized for customer enquiries, equipment handover, quote preparation, discount revision, and customer invoicing.'
  },

  receiving: {
    key: 'receiving',
    name: 'Alex Carter',
    title: 'Receiving Officer',
    avatar: '📦',
    badge: 'Inward Logistics',
    department: 'Inward Logistics',
    allowedTabs: [
      { id: 'receiving', label: 'Inward Receiving Hub', icon: '📦', badge: 'New' },
      { id: 'inward_dn', label: 'Customer Inward DNs', icon: '📄' },
      { id: 'equipment_register', label: 'Equipment Master Register', icon: '🏭' }
    ],
    defaultTab: 'receiving',
    permissions: [
      'register_equipment',
      'upload_inward_dn',
      'upload_equipment_photos',
      'tag_serial_numbers'
    ],
    description: 'Authorized for equipment intake, customer delivery note (DN) verification, photo capture, and initial specifications.'
  },

  workshop_manager: {
    key: 'workshop_manager',
    name: 'S. Patel',
    title: 'Workshop Manager',
    avatar: '👨‍💼',
    badge: 'Operations Head',
    department: 'Operations',
    allowedTabs: [
      { id: 'dashboard', label: 'Workshop Overview', icon: '📊' },
      { id: 'operations', label: 'Operations Pipeline', icon: '⚙️', badge: '5' },
      { id: 'assignments', label: 'Technician Assignments', icon: '👥' },
      { id: 'inspection_review', label: 'Inspection & Assessment Review', icon: '🔍' },
      { id: 'costing_prep', label: 'Repair Cost Estimation', icon: '💰' },
      { id: 'reports', label: 'Workshop Analytics', icon: '📑' }
    ],
    defaultTab: 'dashboard',
    permissions: [
      'accept_handover',
      'assign_technician',
      'approve_initial_inspection',
      'approve_tech_assessment',
      'prepare_costing',
      'raise_purchase_request',
      'approve_predispatch_final'
    ],
    description: 'Full supervisory authority over the repair floor, technician job allocation, technical review, costing formulation, and final dispatch.'
  },

  technician: {
    key: 'technician',
    name: 'Raj Kumar / A. Chen',
    title: 'Lead Hydraulic Technician',
    avatar: '🔧',
    badge: 'Workshop Workshop',
    department: 'Workshop',
    allowedTabs: [
      { id: 'technician', label: 'My Assigned Jobs', icon: '👨‍🔧', badge: 'Active' },
      { id: 'stage_inspection', label: '3-Stage Inspection Console', icon: '🔍' },
      { id: 'assembly_tracking', label: 'Assembly & Wrench Log', icon: '⚙️' },
      { id: 'rig_testing', label: '350-Bar Test Bench', icon: '🎯' }
    ],
    defaultTab: 'technician',
    permissions: [
      'accept_assigned_job',
      'execute_stage1_dismantling',
      'execute_stage2_cleaning',
      'execute_stage3_inspection',
      'submit_initial_inspection',
      'submit_tech_assessment',
      'request_parts_from_assessment',
      'log_assembly_work',
      'run_bench_test',
      'sign_technician_cert'
    ],
    description: 'Hands-on technical access for dismantling, ultrasonic cleaning, micrometer tolerances, parts requests, assembly timing, and bench testing.'
  },

  purchaser: {
    key: 'purchaser',
    name: 'David Vance',
    title: 'Purchaser & Storekeeper',
    avatar: '📑',
    badge: 'Procurement & Stores',
    department: 'Procurement & Stores',
    allowedTabs: [
      { id: 'inventory', label: 'Warehouse Stock Master', icon: '📦' },
      { id: 'material_requests', label: 'Job Material Requests', icon: '📝' },
      { id: 'purchase', label: 'Purchase Orders (PO)', icon: '🛒' },
      { id: 'lgrn_inward', label: 'Inward LGRN Goods Notes', icon: '📥' },
      { id: 'issuance', label: 'Material Issuance & Returns', icon: '🔄' }
    ],
    defaultTab: 'inventory',
    permissions: [
      'create_po_from_pr',
      'create_lgrn',
      'receive_supplier_goods',
      'issue_material_to_job',
      'process_part_returns',
      'adjust_stock_inventory'
    ],
    description: 'Manages spare parts inventory, converts job PRs to supplier POs, verifies received goods (LGRN), and tracks issued/consumed quantities.'
  },

  country_manager: {
    key: 'country_manager',
    name: 'Marcus Sterling',
    title: 'Country Manager',
    avatar: '⭐',
    badge: 'Executive Management',
    department: 'Executive Management',
    allowedTabs: [
      { id: 'executive_dashboard', label: 'Executive Command Center', icon: '👑', badge: 'Action' },
      { id: 'costing_approvals', label: 'Repair Costing Sign-offs', icon: '💰' },
      { id: 'discount_approvals', label: 'Quotation Discount Approvals', icon: '🏷️' },
      { id: 'po_approvals', label: 'Purchase Order Approvals', icon: '🛒' },
      { id: 'reports', label: 'Monthly Conversion & Margins', icon: '📈' }
    ],
    defaultTab: 'executive_dashboard',
    permissions: [
      'approve_repair_costing',
      'approve_quotation_discount',
      'approve_purchase_orders',
      'view_executive_financials',
      'export_management_reports'
    ],
    description: 'High-level executive authority to approve repair costings, commercial client discounts, supplier POs, and review profit conversions.'
  },

  qa_inspector: {
    key: 'qa_inspector',
    name: 'John Doe',
    title: 'QA / QC Inspector',
    avatar: '🔍',
    badge: 'Quality Assurance',
    department: 'Quality Assurance',
    allowedTabs: [
      { id: 'qa_dashboard', label: 'QA / QC Inspection Console', icon: '🛡️' },
      { id: 'rig_testing', label: 'Bench Test Rig Verification', icon: '🎯' },
      { id: 'predispatch', label: 'Pre-Dispatch QA Checklist', icon: '📋' },
      { id: 'test_certificates', label: 'Test Certificates & Standards', icon: '📜' }
    ],
    defaultTab: 'qa_dashboard',
    permissions: [
      'verify_test_readings',
      'sign_qa_test_cert',
      'approve_predispatch_checklist',
      'reject_for_rework_retest'
    ],
    description: 'Responsible for independent quality audits, pressure test curve verification, dual test certification signatures, and pre-dispatch sign-off.'
  }
};

const DEFAULT_USERS = [
  {
    id: 'USR-001',
    name: 'S. Patel',
    email: 'manager@nexus-erp.com',
    password: 'password123',
    roleKey: 'workshop_manager',
    role: 'Workshop Manager',
    avatar: '👨‍💼',
    badge: 'Operations Head',
    department: 'Operations',
    lastLogin: '2026-11-24 08:30',
    empId: 'NEX-EMP-1044'
  },
  {
    id: 'USR-002',
    name: 'Alex Turner',
    email: 'sales@nexus-erp.com',
    password: 'password123',
    roleKey: 'sales',
    role: 'Sales Executive',
    avatar: '👔',
    badge: 'Sales & Commercial',
    department: 'Sales & Commercial',
    lastLogin: '2026-11-24 09:15',
    empId: 'NEX-EMP-1082'
  },
  {
    id: 'USR-003',
    name: 'Alex Carter',
    email: 'receiving@nexus-erp.com',
    password: 'password123',
    roleKey: 'receiving',
    role: 'Receiving Officer',
    avatar: '📦',
    badge: 'Inward Logistics',
    department: 'Inward Logistics',
    lastLogin: '2026-11-24 08:00',
    empId: 'NEX-EMP-1090'
  },
  {
    id: 'USR-004',
    name: 'Raj Kumar',
    email: 'technician@nexus-erp.com',
    password: 'password123',
    roleKey: 'technician',
    role: 'Lead Hydraulic Technician',
    avatar: '🔧',
    badge: 'Workshop Workshop',
    department: 'Workshop',
    lastLogin: '2026-11-24 07:45',
    empId: 'NEX-EMP-9082'
  },
  {
    id: 'USR-005',
    name: 'David Vance',
    email: 'purchase@nexus-erp.com',
    password: 'password123',
    roleKey: 'purchaser',
    role: 'Purchaser & Storekeeper',
    avatar: '📑',
    badge: 'Procurement & Stores',
    department: 'Procurement & Stores',
    lastLogin: '2026-11-24 09:30',
    empId: 'NEX-EMP-1055'
  },
  {
    id: 'USR-006',
    name: 'Marcus Sterling',
    email: 'director@nexus-erp.com',
    password: 'password123',
    roleKey: 'country_manager',
    role: 'Country Manager',
    avatar: '⭐',
    badge: 'Executive Management',
    department: 'Executive Management',
    lastLogin: '2026-11-24 10:00',
    empId: 'NEX-EMP-0001'
  },
  {
    id: 'USR-007',
    name: 'John Doe',
    email: 'qa@nexus-erp.com',
    password: 'password123',
    roleKey: 'qa_inspector',
    role: 'QA / QC Inspector',
    avatar: '🔍',
    badge: 'Quality Assurance',
    department: 'Quality Assurance',
    lastLogin: '2026-11-24 08:45',
    empId: 'NEX-EMP-1031'
  }
];

const DEFAULT_DATA = {
  auth: {
    isAuthenticated: true,
    currentUserId: 'USR-001',
    rememberMe: true,
    loginAlertCount: 3,
    activeSessions: [
      { device: 'Desktop Station #1 - Operations Control', ip: '192.168.1.45', time: 'Active Now', current: true },
      { device: 'Technician Tablet - Workshop Bay #2', ip: '192.168.1.112', time: '2 hours ago', current: false },
      { device: 'Mobile Android - Logistics Gate #1', ip: '10.0.4.88', time: 'Yesterday', current: false }
    ]
  },
  users: DEFAULT_USERS,
  currentUser: DEFAULT_USERS[0],
  rbac: RBAC_CONFIG,
  roles: Object.values(RBAC_CONFIG),
  commonModules: COMMON_ERP_MODULES,
  
  enquiries: [
    {
      id: 'ENQ-2026-089',
      date: '2026-11-20',
      customer: 'Riverside Plant',
      contactPerson: 'Robert Lang',
      phone: '+1 555-0192',
      email: 'robert@riverside.com',
      equipment: 'Hydraulic Pump',
      model: 'PVP333',
      serialNo: 'HP778321',
      complaint: 'Severe pressure loss under 200 bar, unusual noise during operation',
      status: 'Equipment Arrived',
      receivedDate: '2026-11-21',
      receiptNo: 'ER000248'
    },
    {
      id: 'ENQ-2026-090',
      date: '2026-11-22',
      customer: 'Summit Mining Corp',
      contactPerson: 'David Miller',
      phone: '+1 555-4821',
      email: 'dmiller@summitmining.com',
      equipment: 'Hydraulic Cylinder 12"',
      model: 'CYL-HD400',
      serialNo: 'HCY-9021',
      complaint: 'Piston rod scored, gland seal leaking heavily',
      status: 'Converted to Job',
      jobNo: 'J000247'
    },
    {
      id: 'ENQ-2026-091',
      date: '2026-11-23',
      customer: 'Petro Energy Ltd',
      contactPerson: 'Sarah Jenkins',
      phone: '+1 555-8833',
      email: 'sjenkins@petroenergy.com',
      equipment: 'High Pressure Valve Unit',
      model: 'HPV-800',
      serialNo: 'VLV-1187',
      complaint: 'Internal bypass leakage and actuator sluggishness',
      status: 'Under Quotation Review'
    }
  ],

  equipmentReceipts: [
    {
      receiptNo: 'ER000248',
      enquiryId: 'ENQ-2026-089',
      customer: 'Riverside Plant',
      equipmentType: 'Hydraulic Pump',
      manufacturer: 'Parker Hannifin',
      model: 'PVP333',
      serialNo: 'HP778321',
      receivedDate: '2026-11-21 09:30',
      receivedBy: 'Alex Carter',
      inwardDeliveryNoteNo: 'DN-RIV-8912',
      inwardDeliveryNoteFile: 'Customer_DN_8912_signed.pdf',
      photos: [
        'hydraulic_pump_overview.jpg',
        'shaft_detail.jpg',
        'mounting_flange.jpg'
      ],
      remarks: 'Delivered with input coupling and wooden pallet. Flange shows heavy oil deposit.',
      handoverToWorkshop: true,
      handoverDate: '2026-11-21 11:00',
      jobNo: 'J000248'
    }
  ],

  jobs: [
    {
      id: 'J000248',
      receiptNo: 'ER000248',
      enquiryId: 'ENQ-2026-089',
      customer: 'Riverside Plant',
      equipment: 'Hydraulic Pump',
      manufacturer: 'Parker Hannifin',
      model: 'PVP333',
      serialNo: 'HP778321',
      type: 'Service & Overhaul',
      priority: 'High',
      createdDate: '2026-11-21',
      targetDate: '2026-11-28',
      complaint: 'Low pressure output and overheating',
      salesperson: 'Alex Turner',
      workshopManager: 'S. Patel',
      leadTechnician: 'Raj Kumar',
      technicianTeam: ['A. Chen', 'M. Tariq'],
      estimatedHours: 24,
      actualHours: 18,
      status: 'Technical Assessment',
      workflowStep: 4,
      managerAccepted: true,
      technicianAccepted: true,
      
      inspectionStages: {
        stage1_dismantling: {
          name: 'Stage 1 – Dismantling',
          status: 'Completed',
          completedAt: '2026-11-22 11:30',
          completedBy: 'Raj Kumar',
          findings: 'Casing bolts dismantled safely. End cover removed. Internal piston barrel inspected.'
        },
        stage2_cleaning: {
          name: 'Stage 2 – Cleaning',
          status: 'Completed',
          completedAt: '2026-11-22 15:45',
          completedBy: 'A. Chen',
          findings: 'Ultrasonic solvent cleaning performed on swashplate, valve plate, and cylinder block.'
        },
        stage3_inspection: {
          name: 'Stage 3 – Inspection & Measurements',
          status: 'Completed',
          completedAt: '2026-11-23 10:15',
          completedBy: 'Raj Kumar',
          findings: 'Micrometer measurements taken. Shaft runout 0.08mm (exceeds 0.03mm limit). Piston slippers severely scored.'
        }
      },

      initialInspectionReport: {
        submittedAt: '2026-11-23 11:30',
        technician: 'Raj Kumar',
        technicianSignature: 'Raj Kumar (Auth-eSign #RK-9082)',
        managerApproval: 'S. Patel',
        managerApprovalDate: '2026-11-23 14:00',
        managerSignature: 'S. Patel (Verified Manager #SP-1044)',
        components: [
          { component: 'Pump Body & Housing', findings: 'Wear visible on internal housing wall, minor cavitational pitting', decision: 'Repair', condition: 'Fair', priority: 'Medium' },
          { component: 'Mechanical Seals & O-Rings', findings: 'Perished, hardened, severe oil leakage evident', decision: 'Replace', condition: 'Bad', priority: 'High' },
          { component: 'Shaft & Bearings', findings: 'Shaft scoring on seal seat; bearing raceway flaking', decision: 'Replace', condition: 'Critical', priority: 'High' },
          { component: 'Cylinder Barrel & Pistons', findings: 'Slipper retraction plate worn, pistons loose in bore', decision: 'Replace', condition: 'Poor', priority: 'High' },
          { component: 'Port Plate / End Cap', findings: 'Minor scoring on timing face, suitable for precision lapping', decision: 'Repair', condition: 'Repairable', priority: 'Medium' },
          { component: 'Fasteners & Flange Bolts', findings: 'Threads intact, cleaned and passed torque test', decision: 'Reuse', condition: 'Good', priority: 'Low' }
        ],
        overallObservation: 'Pump suffered from fluid contamination and thermal breakdown. Full rotating group replacement and housing re-machining required.',
        recommendation: 'Replace rotating group, seal kit, bearings. Lap valve plate and test to 280 bar max rating.'
      },

      technicalAssessment: {
        submittedAt: '2026-11-23 16:30',
        technician: 'Raj Kumar',
        managerApproved: true,
        managerApprovalDate: '2026-11-23 17:15',
        materialsRequired: [
          { item: 'Rotary Group Kit (PVP333)', qty: 1, uom: 'Set', estUnitCost: 2450.00, inStock: false },
          { item: 'Shaft Bearing Set (FAG 6208-C3)', qty: 2, uom: 'Pcs', estUnitCost: 180.00, inStock: false },
          { item: 'FKM Viton Seal Kit Parker PVP', qty: 1, uom: 'Kit', estUnitCost: 320.00, inStock: true },
          { item: 'Hydraulic Test Fluid ISO VG 46', qty: 25, uom: 'Ltr', estUnitCost: 12.00, inStock: true }
        ],
        labourActivities: [
          { activity: 'Dismantling and chemical cleaning', hours: 4.0, rate: 85.00 },
          { activity: 'Precision CNC machining / port lapping', hours: 6.0, rate: 120.00 },
          { activity: 'Assembly, shimming and preload adjustment', hours: 8.0, rate: 85.00 },
          { activity: 'Full load bench testing & calibration', hours: 4.0, rate: 110.00 }
        ],
        outsourcingAndTesting: [
          { item: 'Dynamic shaft balancing (Specialist lab)', cost: 450.00 },
          { item: 'High-pressure test bench certification', cost: 350.00 }
        ]
      },

      costing: {
        status: 'Approved by Country Manager',
        preparedBy: 'S. Patel',
        preparedDate: '2026-11-24 09:00',
        approvedBy: 'Marcus Sterling (Country Manager)',
        approvalDate: '2026-11-24 10:45',
        materialCost: 3130.00,
        labourCost: 2000.00,
        machiningCost: 720.00,
        outsourcingCost: 800.00,
        subTotalCost: 6650.00,
        overheadPct: 10,
        overheadAmount: 665.00,
        contingencyPct: 5,
        contingencyAmount: 332.50,
        profitMarginPct: 18,
        profitMarginAmount: 1376.55,
        finalQuotationPrice: 9024.05
      },

      quotations: [
        {
          version: 'Rev 0 (Initial)',
          quoteNo: 'QT-2026-0248-R0',
          date: '2026-11-24',
          subtotal: 9024.05,
          discountPct: 0,
          discountAmount: 0,
          vatPct: 5,
          vatAmount: 451.20,
          total: 9475.25,
          status: 'Customer Requested Discount',
          sentDate: '2026-11-24 11:30'
        },
        {
          version: 'Rev 1 (Approved Discount)',
          quoteNo: 'QT-2026-0248-R1',
          date: '2026-11-24',
          subtotal: 9024.05,
          discountPct: 5,
          discountAmount: 451.20,
          approvedByCM: 'Marcus Sterling',
          vatPct: 5,
          vatAmount: 428.64,
          total: 9001.49,
          status: 'Customer Approved - Job Confirmed',
          customerPO: 'PO-RIV-2026-9901',
          approvedDate: '2026-11-24 15:00'
        }
      ],

      materialRequest: {
        reqNo: 'MR-000248',
        requestedBy: 'Raj Kumar',
        date: '2026-11-24 15:30',
        status: 'PO Approved - Ordered',
        items: [
          { itemCode: 'PAR-PVP333-ROT', desc: 'Rotary Group Kit PVP333', requestedQty: 1, orderedQty: 1, receivedQty: 1, issuedQty: 1, consumedQty: 1, returnQty: 0, status: 'Issued to Tech' },
          { itemCode: 'BRG-6208-C3', desc: 'FAG High-Load Shaft Bearing', requestedQty: 2, orderedQty: 2, receivedQty: 2, issuedQty: 2, consumedQty: 2, returnQty: 0, status: 'Issued to Tech' },
          { itemCode: 'SK-PVP-VITON', desc: 'Parker PVP Viton Seal Kit', requestedQty: 1, orderedQty: 0, receivedQty: 0, issuedQty: 1, consumedQty: 1, returnQty: 0, status: 'Stock Issued' }
        ],
        prNo: 'PR-9042',
        poNo: 'PO-2026-781',
        supplier: 'Parker Hydraulics Direct UK',
        poApprovedBy: 'Marcus Sterling',
        lgrnNo: 'LGRN-4491',
        lgrnDate: '2026-11-24 17:00'
      },

      assembly: {
        startedAt: '2026-11-24 17:30',
        completedAt: null,
        isAssemblyInProgress: true,
        durationMinutes: 180,
        technicianNotes: 'Bearing press-fit complete. End clearances set to 0.045mm. Awaiting torque verification on through-bolts.',
        photos: ['assembly_stage1.jpg', 'bearing_press.jpg']
      },

      testing: {
        testNo: 'TR-000248-1',
        status: 'Ready for Testing',
        parameters: [
          { param: 'Static Shell Pressure (Bar)', required: '350 Bar ± 5', actual: '350 Bar', tolerance: '345 - 355', result: 'Pass' },
          { param: 'Dynamic Operating Flow Rate', required: '120 LPM @ 1800 RPM', actual: '119.4 LPM', tolerance: '115 - 125', result: 'Pass' },
          { param: 'Shaft Vibration (RMS mm/s)', required: '< 2.8 mm/s', actual: '1.4 mm/s', tolerance: '< 2.8', result: 'Pass' },
          { param: 'Case Drain Leakage', required: '< 1.5 LPM @ 250 Bar', actual: '0.6 LPM', tolerance: '< 1.5', result: 'Pass' },
          { param: 'Operating Temperature Stabilized', required: '< 65 °C', actual: '52 °C', tolerance: '< 65', result: 'Pass' }
        ],
        testResult: 'Pending Run',
        technicianSignature: null,
        qaInspectorSignature: null,
        managerApprovalSignature: null,
        certificateNo: null
      },

      preDispatch: {
        status: 'Pending',
        checklist: [
          { item: 'Thorough external steam and solvent degreasing', checked: false },
          { item: 'Industrial polyurethane priming and top coat painting', checked: false },
          { item: 'Plastic thread protector plugs and blanking flanges fitted', checked: false },
          { item: 'Brass identification & test data nameplate riveted', checked: false },
          { item: 'Calibration certificate and test report attached', checked: false },
          { item: 'Heavy-duty wooden crating and rust-inhibitor wrapping', checked: false }
        ],
        inspectedBy: 'QA Team',
        approvedByManager: false
      },

      delivery: {
        deliveryNoteNo: 'DN-2026-0248',
        plannedDate: '2026-11-28',
        status: 'Scheduled',
        invoiceNo: 'INV-2026-0881',
        invoiceAmount: 9001.49,
        paymentTerms: '30 Days Net',
        customerBalanceUpdated: false
      }
    },
    {
      id: 'J000247',
      receiptNo: 'ER000247',
      enquiryId: 'ENQ-2026-090',
      customer: 'Summit Mining',
      equipment: 'Hydraulic Cylinder 12"',
      manufacturer: 'Caterpillar OEM',
      model: 'CYL-HD400',
      serialNo: 'HCY-9021',
      type: 'Repair & Hard Chrome',
      priority: 'High',
      createdDate: '2026-11-19',
      targetDate: '2026-11-26',
      complaint: 'Scored rod & gland bypass',
      salesperson: 'Alex Turner',
      workshopManager: 'S. Patel',
      leadTechnician: 'A. Chen',
      technicianTeam: ['Raj Kumar'],
      estimatedHours: 32,
      actualHours: 20,
      status: 'Awaiting Parts',
      workflowStep: 7,
      managerAccepted: true,
      technicianAccepted: true,
      costing: {
        status: 'Approved by Country Manager',
        preparedBy: 'S. Patel',
        subTotalCost: 4900.00,
        overheadAmount: 490.00,
        profitMarginAmount: 1030.00,
        finalQuotationPrice: 6420.00
      },
      materialRequest: {
        reqNo: 'MR-000247',
        status: 'Parts on Order - Supplier Delay Alert',
        items: [
          { itemCode: 'ROD-CHROME-120', desc: 'Induction Hardened Chromed Rod 120mm x 2.2m', requestedQty: 1, orderedQty: 1, receivedQty: 0, issuedQty: 0, consumedQty: 0, returnQty: 0, status: 'On Order' }
        ]
      },
      testing: { status: 'Not Started' },
      preDispatch: { status: 'Pending' },
      delivery: { status: 'Pending' }
    },
    {
      id: 'J000246',
      receiptNo: 'ER000246',
      enquiryId: 'ENQ-2026-085',
      customer: 'Coastal Equipment',
      equipment: 'Hydraulic Power Unit (HPU)',
      manufacturer: 'Rexroth Bosch',
      model: 'HPU-55KW-Custom',
      serialNo: 'HPU-45821',
      type: 'Manufacturing & Assembly',
      priority: 'Medium',
      createdDate: '2026-11-15',
      targetDate: '2026-11-30',
      complaint: 'Complete custom fabricated skid assembly and commissioning',
      salesperson: 'Alex Turner',
      workshopManager: 'S. Patel',
      leadTechnician: 'M. Tariq',
      technicianTeam: ['A. Chen', 'Raj Kumar'],
      estimatedHours: 65,
      actualHours: 42,
      status: 'In Production',
      workflowStep: 8,
      managerAccepted: true,
      technicianAccepted: true,
      costing: {
        status: 'Approved by Country Manager',
        preparedBy: 'S. Patel',
        subTotalCost: 21800.00,
        overheadAmount: 2180.00,
        profitMarginAmount: 4520.00,
        finalQuotationPrice: 28500.00
      },
      testing: { status: 'Not Started' },
      preDispatch: { status: 'Pending' },
      delivery: { status: 'Pending' }
    },
    {
      id: 'J000245',
      receiptNo: 'ER000245',
      enquiryId: 'ENQ-2026-082',
      customer: 'Metro Construction',
      equipment: 'Directional Control Valve Block',
      manufacturer: 'Danfoss PVG',
      model: 'PVG-32-6Bank',
      serialNo: 'VLV-1187',
      type: 'Service & Spool Honing',
      priority: 'Low',
      createdDate: '2026-11-10',
      targetDate: '2026-11-22',
      complaint: 'Spool sticking and excessive pilot drain',
      salesperson: 'Alex Turner',
      workshopManager: 'S. Patel',
      leadTechnician: 'Raj Kumar',
      technicianTeam: ['A. Chen'],
      estimatedHours: 16,
      actualHours: 15,
      status: 'Testing & QA',
      workflowStep: 9,
      managerAccepted: true,
      technicianAccepted: true,
      costing: {
        status: 'Approved by Country Manager',
        preparedBy: 'S. Patel',
        subTotalCost: 2950.00,
        overheadAmount: 295.00,
        profitMarginAmount: 595.00,
        finalQuotationPrice: 3840.00
      },
      testing: {
        testNo: 'TR-000245-1',
        status: 'Passed',
        parameters: [
          { param: 'Proof Pressure', required: '315 Bar', actual: '315 Bar', tolerance: '± 5', result: 'Pass' },
          { param: 'Spool Actuation Force', required: '< 85 N', actual: '62 N', tolerance: '< 85', result: 'Pass' }
        ],
        testResult: 'Passed',
        certificateNo: 'TC-2026-883'
      },
      preDispatch: { status: 'Approved' },
      delivery: {
        deliveryNoteNo: 'DN-2026-0245',
        invoiceNo: 'INV-2026-0870',
        status: 'Ready for Dispatch'
      }
    },
    {
      id: 'J000244',
      receiptNo: 'ER000244',
      enquiryId: 'ENQ-2026-079',
      customer: 'Highland Resources',
      equipment: 'Radial Piston Hydraulic Motor',
      manufacturer: 'Staffa Kawasaki',
      model: 'HMB-100',
      serialNo: 'MOT-5524',
      type: 'Complete Overhaul',
      priority: 'High',
      createdDate: '2026-11-08',
      targetDate: '2026-11-20',
      complaint: 'Low torque at start-up, heavy casing leakage',
      salesperson: 'Alex Turner',
      workshopManager: 'S. Patel',
      leadTechnician: 'A. Chen',
      technicianTeam: ['Raj Kumar'],
      estimatedHours: 28,
      actualHours: 27,
      status: 'Completed',
      workflowStep: 12,
      managerAccepted: true,
      technicianAccepted: true,
      costing: {
        status: 'Approved by Country Manager',
        preparedBy: 'S. Patel',
        subTotalCost: 5650.00,
        overheadAmount: 565.00,
        profitMarginAmount: 1153.00,
        finalQuotationPrice: 7368.00
      },
      testing: { status: 'Passed', certificateNo: 'TC-2026-840' },
      preDispatch: { status: 'Approved' },
      delivery: {
        deliveryNoteNo: 'DN-2026-0244',
        invoiceNo: 'INV-2026-0865',
        invoiceAmount: 7368.00,
        status: 'Delivered & Invoiced',
        customerBalanceUpdated: true
      }
    }
  ],

  inventory: [
    { code: 'PAR-PVP333-ROT', name: 'Parker PVP333 Rotary Group Kit', category: 'Pump Parts', stockQty: 2, minQty: 1, unitPrice: 2450.00, uom: 'Set', location: 'Rack A-12' },
    { code: 'SK-PVP-VITON', name: 'Parker PVP Viton Seal Kit', category: 'Seals', stockQty: 8, minQty: 3, unitPrice: 320.00, uom: 'Kit', location: 'Bin S-04' },
    { code: 'BRG-6208-C3', name: 'FAG High-Load Shaft Bearing 6208-C3', category: 'Bearings', stockQty: 4, minQty: 4, unitPrice: 180.00, uom: 'Pcs', location: 'Bin B-18' },
    { code: 'OIL-VG46-200L', name: 'Hydraulic Test Fluid ISO VG 46 (200L)', category: 'Consumables', stockQty: 3, minQty: 1, unitPrice: 620.00, uom: 'Drum', location: 'Oil Bay 2' },
    { code: 'ROD-CHROME-120', name: 'Hard Chromed Induction Rod 120mm OD', category: 'Raw Material', stockQty: 0, minQty: 1, unitPrice: 1450.00, uom: 'Meter', location: 'Steel Rack C' },
    { code: 'PVG-SEAL-KIT', name: 'Danfoss PVG32 Sectional Seal Kit', category: 'Seals', stockQty: 12, minQty: 5, unitPrice: 145.00, uom: 'Kit', location: 'Bin S-09' }
  ],

  assets: [
    {
      assetId: 'AST-000124',
      serialNo: 'HPU-45821',
      description: 'Hydraulic Power Unit 55kW Skid',
      customer: 'Coastal Equipment',
      manufacturer: 'Rexroth Bosch',
      model: 'HPU-55KW-Custom',
      capacity: '240 Bar / 160 LPM',
      commissionDate: '2023-04-12',
      status: 'Active',
      lastServiceDate: '2026-11-15',
      qrCodeData: 'NEXUS-ASSET://AST-000124/HPU-45821',
      history: [
        { date: '2026-11-15', jobNo: 'J000246', type: 'Major Overhaul & Cooler Upgrade', technician: 'M. Tariq', result: 'In Production' },
        { date: '2025-05-10', jobNo: 'J000188', type: 'Annual Preventive Maintenance & Filter change', technician: 'Raj Kumar', result: 'Pass' },
        { date: '2024-06-02', jobNo: 'J000112', type: 'Relief valve calibration', technician: 'A. Chen', result: 'Pass' }
      ]
    },
    {
      assetId: 'AST-000125',
      serialNo: 'VLV-1187',
      description: 'Directional Control Valve Block PVG-32',
      customer: 'Metro Construction',
      manufacturer: 'Danfoss PVG',
      model: 'PVG-32-6Bank',
      capacity: '350 Bar / 120 LPM',
      commissionDate: '2022-09-18',
      status: 'Active',
      lastServiceDate: '2026-11-10',
      qrCodeData: 'NEXUS-ASSET://AST-000125/VLV-1187',
      history: [
        { date: '2026-11-10', jobNo: 'J000245', type: 'Spool Honing & Seal Replacement', technician: 'Raj Kumar', result: 'Passed' },
        { date: '2024-11-04', jobNo: 'J000155', type: 'Solenoid coil replacement', technician: 'Raj Kumar', result: 'Pass' }
      ]
    },
    {
      assetId: 'AST-000126',
      serialNo: 'HP778321',
      description: 'Variable Displacement Piston Pump PVP333',
      customer: 'Riverside Plant',
      manufacturer: 'Parker Hannifin',
      model: 'PVP333',
      capacity: '280 Bar / 130 LPM',
      commissionDate: '2021-11-05',
      status: 'In Service',
      lastServiceDate: '2026-11-21',
      qrCodeData: 'NEXUS-ASSET://AST-000126/HP778321',
      history: [
        { date: '2026-11-21', jobNo: 'J000248', type: 'Full Overhaul, Rotary Group, Shaft Bearings', technician: 'Raj Kumar', result: 'Under Assessment' },
        { date: '2024-02-14', jobNo: 'J000120', type: 'Shaft seal replacement and bench test', technician: 'A. Chen', result: 'Pass' }
      ]
    },
    {
      assetId: 'AST-000127',
      serialNo: 'HCY-9021',
      description: 'Heavy Duty Excavator Boom Cylinder',
      customer: 'Summit Mining',
      manufacturer: 'Caterpillar OEM',
      model: 'CYL-HD400',
      capacity: '400 Bar Working Pressure',
      commissionDate: '2020-03-15',
      status: 'Awaiting Parts',
      lastServiceDate: '2026-11-19',
      qrCodeData: 'NEXUS-ASSET://AST-000127/HCY-9021',
      history: [
        { date: '2026-11-19', jobNo: 'J000247', type: 'Barrel Honing, New 120mm Chromed Rod & Seals', technician: 'A. Chen', result: 'Parts on Order' },
        { date: '2023-08-20', jobNo: 'J000095', type: 'Wiper and rod seal replacement', technician: 'Raj Kumar', result: 'Pass' }
      ]
    }
  ],

  notifications: [
    { id: 1, title: 'Safety Inspection Due', desc: 'Site A - Test Bench Rig #2 certification due in 3 days', time: '10m ago', unread: true, type: 'urgent', targetRole: 'qa_inspector' },
    { id: 2, title: 'Material Delay Alert', desc: 'Job #J000247 - Chromed Rod 120mm delayed by supplier', time: '1h ago', unread: true, type: 'warning', targetRole: 'purchaser' },
    { id: 3, title: 'Costing Approved by CM', desc: 'Marcus Sterling approved repair costing for Job #J000248 ($9,024.05)', time: '2h ago', unread: false, type: 'success', targetRole: 'sales' },
    { id: 4, title: 'Equipment Inward Delivery', desc: 'Receipt ER000248 registered by Alex Carter. Handed over to Workshop.', time: '4h ago', unread: false, type: 'info', targetRole: 'workshop_manager' }
  ],

  purchaseOrders: [
    { poNo: 'PO-2026-781', jobNo: 'J000248', prNo: 'PR-9042', supplier: 'Parker Hydraulics Direct UK', amount: 2810.00, status: 'Approved & Placed', approvedBy: 'Marcus Sterling' },
    { poNo: 'PO-2026-782', jobNo: 'J000247', prNo: 'PR-9040', supplier: 'Hard Chrome International Ltd', amount: 1450.00, status: 'Pending Delivery', approvedBy: null }
  ]
};

function getERPData() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveERPData(DEFAULT_DATA);
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    const parsed = JSON.parse(raw);
    parsed.commonModules = COMMON_ERP_MODULES;
    if (!parsed.rbac || !parsed.users) {
      parsed.rbac = RBAC_CONFIG;
      parsed.users = DEFAULT_USERS;
      saveERPData(parsed);
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse storage data:', e);
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function saveERPData(data) {
  try {
    const serialized = JSON.stringify(data);
    sessionStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
}

function resetERPData() {
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
  saveERPData(DEFAULT_DATA);
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}
