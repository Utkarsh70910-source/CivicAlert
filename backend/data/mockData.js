/**
 * CivicAlert - In-Memory Mock Database
 * 
 * NOTE FOR COLLEGE VIVA / REVIEW:
 * This file serves as a clean, in-memory data store for local development and demonstration.
 * In the next milestone, this in-memory layer will be swapped with MongoDB models (Mongoose),
 * maintaining the same REST API contracts.
 */

// Category to Specialization Mapping as required for municipal dispatch
const CATEGORY_SPECIALIZATION_MAP = {
  'Roads & Potholes': 'Road Maintenance',
  'Streetlights': 'Electrician',
  'Garbage & Sanitation': 'Sanitation',
  'Water & Drainage': 'Plumbing/Water',
  'Other': 'Admin Review',
};

// Initial Mock Users (Admin, Field Workers, Citizen)
const mockUsers = [
  {
    id: 'admin-1',
    username: 'admin',
    password: 'admin123', // In production, hashed with bcrypt
    name: 'Municipal Admin Officer',
    email: 'admin@civicalert.gov.in',
    role: 'admin',
  },
  {
    id: 'w-101',
    username: 'worker101',
    password: 'worker123',
    name: 'Ramesh Kumar',
    role: 'worker',
    workerId: 'W-101',
    category: 'Roads & Potholes',
    specialization: 'Road Maintenance',
    status: 'Active',
    phone: '+91 98765 43210',
    email: 'ramesh.k@civicalert.gov.in',
  },
  {
    id: 'w-102',
    username: 'worker102',
    password: 'worker123',
    name: 'Priya Sharma',
    role: 'worker',
    workerId: 'W-102',
    category: 'Streetlights',
    specialization: 'Electrician',
    status: 'Active',
    phone: '+91 98765 43211',
    email: 'priya.s@civicalert.gov.in',
  },
  {
    id: 'w-103',
    username: 'worker103',
    password: 'worker123',
    name: 'Suresh Patel',
    role: 'worker',
    workerId: 'W-103',
    category: 'Garbage & Sanitation',
    specialization: 'Sanitation',
    status: 'Active',
    phone: '+91 98765 43212',
    email: 'suresh.p@civicalert.gov.in',
  },
  {
    id: 'w-104',
    username: 'worker104',
    password: 'worker123',
    name: 'Anita Desai',
    role: 'worker',
    workerId: 'W-104',
    category: 'Water & Drainage',
    specialization: 'Plumbing/Water',
    status: 'Active',
    phone: '+91 98765 43213',
    email: 'anita.d@civicalert.gov.in',
  },
  {
    id: 'w-105',
    username: 'worker105',
    password: 'worker123',
    name: 'Vikram Malhotra',
    role: 'worker',
    workerId: 'W-105',
    category: 'Other',
    specialization: 'Admin Review',
    status: 'Active',
    phone: '+91 98765 43214',
    email: 'vikram.m@civicalert.gov.in',
  },
  {
    id: 'cit-1',
    username: 'citizen',
    password: 'citizen123',
    name: 'Aarav Verma',
    role: 'citizen',
    phone: '+91 98765 11111',
    email: 'aarav.verma@example.com',
  },
];

// Helper to get formatted dates relative to today
const getDateOffset = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// Initial Mock Complaints
const mockComplaints = [
  {
    id: 'cmp-100',
    referenceId: 'CA-12345',
    category: 'Water & Drainage',
    priority: 'High',
    title: 'Drinking water pipeline fissure and street flooding',
    description: 'Clean drinking water main pipe fractured near the community park entrance. Water leaking on road for 2 days.',
    location: 'Community Park Gate 2, Shanti Nagar, Ward 7',
    photoPreview: null,
    status: 'In Progress',
    citizenName: 'Aarav Verma',
    citizenPhone: '+91 98765 11111',
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    assignedWorkerId: 'w-104',
    assignedWorkerName: 'Anita Desai',
    assignedWorkerPhone: '+91 98765 43213',
    expectedCompletionDate: getDateOffset(2),
    resolutionNotes: 'Field inspection completed. Replacement pressure valve requisitioned from municipal store.',
    resolutionPhoto: null,
    resolvedAt: null,
  },
  {
    id: 'cmp-101',
    referenceId: 'CA-100201',
    category: 'Roads & Potholes',
    priority: 'High',
    title: 'Deep crater pothole near Bus Stand',
    description: 'A deep pothole has opened up right near the central bus stop. Multiple two-wheelers have skidded during evening hours.',
    location: 'Central Bus Stand Road, Ward 12',
    photoPreview: null,
    status: 'Submitted',
    citizenName: 'Aarav Verma',
    citizenPhone: '+91 98765 11111',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    assignedWorkerId: null,
    assignedWorkerName: null,
    assignedWorkerPhone: null,
    expectedCompletionDate: null,
    resolutionNotes: null,
    resolutionPhoto: null,
    resolvedAt: null,
  },
  {
    id: 'cmp-102',
    referenceId: 'CA-100202',
    category: 'Streetlights',
    priority: 'Medium',
    title: '3 dead streetlights on 4th Main Road',
    description: 'Three consecutive street lighting poles are dark between cross 2 and 4. Complete blackout after 7 PM.',
    location: '4th Main Road, Subhash Nagar, Ward 8',
    photoPreview: null,
    status: 'In Progress',
    citizenName: 'Neha Kapoor',
    citizenPhone: '+91 98765 22222',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    assignedWorkerId: 'w-102',
    assignedWorkerName: 'Priya Sharma',
    assignedWorkerPhone: '+91 98765 43211',
    expectedCompletionDate: getDateOffset(2), // 2 days in future
    resolutionNotes: null,
    resolutionPhoto: null,
    resolvedAt: null,
  },
  {
    id: 'cmp-103',
    referenceId: 'CA-100203',
    category: 'Garbage & Sanitation',
    priority: 'High',
    title: 'Overflowing dumpster opposite Market Complex',
    description: 'Commercial market garbage hasn\'t been cleared for 3 days. Animals are scattering trash onto the main road.',
    location: 'Opposite Municipal Market, Gandhi Road, Ward 5',
    photoPreview: null,
    status: 'In Progress',
    citizenName: 'Vikram Singh',
    citizenPhone: '+91 98765 33333',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    assignedWorkerId: 'w-103',
    assignedWorkerName: 'Suresh Patel',
    assignedWorkerPhone: '+91 98765 43212',
    expectedCompletionDate: getDateOffset(1), // 1 day in future
    resolutionNotes: null,
    resolutionPhoto: null,
    resolvedAt: null,
  },
  {
    id: 'cmp-104',
    referenceId: 'CA-100204',
    category: 'Water & Drainage',
    priority: 'Low',
    title: 'Water pipeline leakage causing street flooding',
    description: 'Fresh water main has a visible fissure near gate 3. Clean drinking water is flowing wastefully into the gutter.',
    location: 'Shanti Colony, Gate 3, Ward 15',
    photoPreview: null,
    status: 'Submitted',
    citizenName: 'Meera Nambiar',
    citizenPhone: '+91 98765 44444',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    assignedWorkerId: null,
    assignedWorkerName: null,
    assignedWorkerPhone: null,
    expectedCompletionDate: null,
    resolutionNotes: null,
    resolutionPhoto: null,
    resolvedAt: null,
  },
  {
    id: 'cmp-105',
    referenceId: 'CA-100205',
    category: 'Roads & Potholes',
    priority: 'High',
    title: 'Broken speed breaker causing undercarriage hits',
    description: 'Concrete speed hump is fractured into sharp rubble chunks. Needs asphalt leveling urgently.',
    location: '12th Cross Road, Indira Nagar, Ward 9',
    photoPreview: null,
    status: 'In Progress',
    citizenName: 'Karthik Rao',
    citizenPhone: '+91 98765 55555',
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    assignedWorkerId: 'w-101',
    assignedWorkerName: 'Ramesh Kumar',
    assignedWorkerPhone: '+91 98765 43210',
    expectedCompletionDate: getDateOffset(-2), // 2 days in the past -> OVERDUE!
    resolutionNotes: 'Inspection conducted, awaiting bitumen dispatch.',
    resolutionPhoto: null,
    resolvedAt: null,
  },
  {
    id: 'cmp-106',
    referenceId: 'CA-100206',
    category: 'Garbage & Sanitation',
    priority: 'Medium',
    title: 'Illegal dumping on vacant ground next to school',
    description: 'Debris and plastic dumping accumulated along school boundary wall.',
    location: 'Plot 44, Beside St. Mary School, Ward 11',
    photoPreview: null,
    status: 'Resolved',
    citizenName: 'Sanjay Gupta',
    citizenPhone: '+91 98765 66666',
    createdAt: new Date(Date.now() - 3600000 * 168).toISOString(),
    assignedWorkerId: 'w-103',
    assignedWorkerName: 'Suresh Patel',
    assignedWorkerPhone: '+91 98765 43212',
    expectedCompletionDate: getDateOffset(-4),
    resolutionNotes: 'Sanitation squad deployed with JCB. 2 truckloads of waste cleared and warning signage erected.',
    resolutionPhoto: null,
    resolvedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'cmp-107',
    referenceId: 'CA-100207',
    category: 'Streetlights',
    priority: 'Low',
    title: 'Flickering high-mast light at Gandhi Circle',
    description: 'High mast lamp blinking continuously causing glare and visibility hazards at roundabout.',
    location: 'Mahatma Gandhi Circle, Ward 1',
    photoPreview: null,
    status: 'Resolved',
    citizenName: 'Tanvi Joshi',
    citizenPhone: '+91 98765 77777',
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    assignedWorkerId: 'w-102',
    assignedWorkerName: 'Priya Sharma',
    assignedWorkerPhone: '+91 98765 43211',
    expectedCompletionDate: getDateOffset(-1),
    resolutionNotes: 'High-mast LED driver power supply was replaced. Luminance verified normal.',
    resolutionPhoto: null,
    resolvedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'cmp-108',
    referenceId: 'CA-100208',
    category: 'Water & Drainage',
    priority: 'High',
    title: 'Storm drain clogged with construction debris',
    description: 'Culvert entrance blocked by mortar and gravel bags. Backflow risk in case of thunderstorm.',
    location: 'Ring Road Service Lane, Ward 18',
    photoPreview: null,
    status: 'Under Review',
    citizenName: 'Devendra Bhat',
    citizenPhone: '+91 98765 88888',
    createdAt: new Date(Date.now() - 3600000 * 50).toISOString(),
    assignedWorkerId: 'w-104',
    assignedWorkerName: 'Anita Desai',
    assignedWorkerPhone: '+91 98765 43213',
    expectedCompletionDate: getDateOffset(3),
    resolutionNotes: 'Preliminary survey completed. Silt-clearing equipment scheduled for tomorrow morning.',
    resolutionPhoto: null,
    resolvedAt: null,
  },
  {
    id: 'cmp-109',
    referenceId: 'CA-100209',
    category: 'Other',
    priority: 'Medium',
    title: 'Damaged community park fence and fallen branch hazard',
    description: 'Heavy wind snapped tree limb onto perimeter fence creating unsafe gap.',
    location: 'Ward 3 Community Garden, South Gate',
    photoPreview: null,
    status: 'Under Review',
    citizenName: 'Kavita Menon',
    citizenPhone: '+91 98765 99112',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    assignedWorkerId: 'w-105',
    assignedWorkerName: 'Vikram Malhotra',
    assignedWorkerPhone: '+91 98765 43214',
    expectedCompletionDate: getDateOffset(4),
    resolutionNotes: 'Horticulture inspection logged, chain-saw crew scheduled.',
    resolutionPhoto: null,
    resolvedAt: null,
  },
];

// Active mock login tokens mapped to user records
const mockActiveSessions = new Map();

/**
 * Computes overdue status and days remaining for a complaint
 */
function enrichComplaint(complaint) {
  if (!complaint) return null;

  let daysRemaining = null;
  let isOverdue = false;

  if (complaint.expectedCompletionDate && complaint.status !== 'Resolved') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(complaint.expectedCompletionDate);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));
    isOverdue = daysRemaining < 0;
  }

  return {
    ...complaint,
    daysRemaining,
    isOverdue,
  };
}

/**
 * Returns a sanitized copy of a complaint for public tracking.
 * Strictly avoids exposing citizen name, personal phone, or internal notes.
 */
function sanitizeForPublic(complaint) {
  const enriched = enrichComplaint(complaint);
  return {
    id: enriched.id,
    referenceId: enriched.referenceId,
    category: enriched.category,
    priority: enriched.priority || 'Medium',
    title: enriched.title || enriched.category,
    description: enriched.description,
    location: enriched.location,
    photoPreview: enriched.photoPreview,
    status: enriched.status,
    reportDate: enriched.createdAt,
    assignedWorkerName: enriched.assignedWorkerName || 'Not Assigned Yet',
    assignedWorkerContact: enriched.assignedWorkerPhone ? enriched.assignedWorkerPhone : null,
    expectedCompletionDate: enriched.expectedCompletionDate,
    daysRemaining: enriched.daysRemaining,
    isOverdue: enriched.isOverdue,
    resolutionNotes: enriched.status === 'Resolved' ? enriched.resolutionNotes : null,
  };
}

module.exports = {
  CATEGORY_SPECIALIZATION_MAP,
  mockUsers,
  mockComplaints,
  mockActiveSessions,
  enrichComplaint,
  sanitizeForPublic,
};
