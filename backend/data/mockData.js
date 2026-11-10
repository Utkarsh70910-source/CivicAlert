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

// Realistic mock photos for initial demonstration
const SAMPLE_WATER_ISSUE_PHOTO =
  'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20640%20400%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22road%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23334155%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%231e293b%22%2F%3E%3C%2FlinearGradient%3E%3CradialGradient%20id%3D%22water%22%20cx%3D%2250%25%22%20cy%3D%2250%25%22%20r%3D%2250%25%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%2338bdf8%22%20stop-opacity%3D%220.9%22%2F%3E%3Cstop%20offset%3D%2270%25%22%20stop-color%3D%22%230284c7%22%20stop-opacity%3D%220.7%22%2F%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%230369a1%22%20stop-opacity%3D%220%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%22640%22%20height%3D%22400%22%20fill%3D%22url(%23road)%22%2F%3E%3Cpath%20d%3D%22M0%20220%20Q%20180%20190%20320%20210%20T%20640%20200%20L640%20400%20L0%20400%20Z%22%20fill%3D%22%230f172a%22%2F%3E%3Cellipse%20cx%3D%22320%22%20cy%3D%22260%22%20rx%3D%22200%22%20ry%3D%2275%22%20fill%3D%22url(%23water)%22%2F%3E%3Cellipse%20cx%3D%22330%22%20cy%3D%22250%22%20rx%3D%22120%22%20ry%3D%2240%22%20fill%3D%22%237dd3fc%22%20opacity%3D%220.7%22%2F%3E%3Cpath%20d%3D%22M290%20170%20C%20285%20130%2C%20310%20100%2C%20320%2080%20C%20330%20100%2C%20355%20130%2C%20350%20170%20Z%22%20fill%3D%22%2338bdf8%22%20opacity%3D%220.85%22%2F%3E%3Ccircle%20cx%3D%22320%22%20cy%3D%22230%22%20r%3D%2218%22%20fill%3D%22%23bae6fd%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22360%22%20text-anchor%3D%22middle%22%20fill%3D%22%23f8fafc%22%20font-family%3D%22sans-serif%22%20font-size%3D%2218%22%20font-weight%3D%22bold%22%3ECivicAlert%20Evidence%3A%20Drinking%20Water%20Pipeline%20Fissure%3C%2Ftext%3E%3Ctext%20x%3D%22320%22%20y%3D%22385%22%20text-anchor%3D%22middle%22%20fill%3D%22%2394a3b8%22%20font-family%3D%22sans-serif%22%20font-size%3D%2213%22%3ELocation%3A%20Shanti%20Nagar%2C%20Ward%207%20%7C%20Ref%3A%20CA-12345%3C%2Ftext%3E%3C%2Fsvg%3E';

const SAMPLE_POTHOLE_ISSUE_PHOTO =
  'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20640%20400%22%3E%3Crect%20width%3D%22640%22%20height%3D%22400%22%20fill%3D%22%23334155%22%2F%3E%3Cpath%20d%3D%22M0%20190%20L640%20190%22%20stroke%3D%22%23facc15%22%20stroke-width%3D%228%22%20stroke-dasharray%3D%2240%2030%22%2F%3E%3Cellipse%20cx%3D%22330%22%20cy%3D%22220%22%20rx%3D%22160%22%20ry%3D%2270%22%20fill%3D%22%230f172a%22%2F%3E%3Cellipse%20cx%3D%22320%22%20cy%3D%22225%22%20rx%3D%22130%22%20ry%3D%2250%22%20fill%3D%22%23020617%22%2F%3E%3Ccircle%20cx%3D%22270%22%20cy%3D%22215%22%20r%3D%2214%22%20fill%3D%22%23475569%22%2F%3E%3Ccircle%20cx%3D%22370%22%20cy%3D%22230%22%20r%3D%2218%22%20fill%3D%22%23475569%22%2F%3E%3Ccircle%20cx%3D%22320%22%20cy%3D%22240%22%20r%3D%2212%22%20fill%3D%22%2364748b%22%2F%3E%3Ctext%20x%3D%22320%22%20y%3D%22355%22%20text-anchor%3D%22middle%22%20fill%3D%22%23f8fafc%22%20font-family%3D%22sans-serif%22%20font-size%3D%2218%22%20font-weight%3D%22bold%22%3ECivicAlert%20Evidence%3A%20Deep%20Asphalt%20Crater%20Pothole%3C%2Ftext%3E%3Ctext%20x%3D%22320%22%20y%3D%22380%22%20text-anchor%3D%22middle%22%20fill%3D%22%2394a3b8%22%20font-family%3D%22sans-serif%22%20font-size%3D%2213%22%3ELocation%3A%2012th%20Cross%20Road%2C%20Indira%20Nagar%20%7C%20Ref%3A%20CA-100205%3C%2Ftext%3E%3C%2Fsvg%3E';

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
    latitude: 12.9560,
    longitude: 77.5960,
    photos: [SAMPLE_WATER_ISSUE_PHOTO],
    photoPreview: SAMPLE_WATER_ISSUE_PHOTO,
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
    latitude: 12.9780,
    longitude: 77.5720,
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
    latitude: 12.9820,
    longitude: 77.5750,
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
    latitude: 12.9690,
    longitude: 77.5840,
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
    latitude: 12.9540,
    longitude: 77.5990,
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
    latitude: 12.9784,
    longitude: 77.6408,
    photos: [SAMPLE_POTHOLE_ISSUE_PHOTO],
    photoPreview: SAMPLE_POTHOLE_ISSUE_PHOTO,
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
    latitude: 12.9620,
    longitude: 77.6100,
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
    latitude: 12.9750,
    longitude: 77.6010,
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
    latitude: 12.9350,
    longitude: 77.6200,
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
    latitude: 12.9900,
    longitude: 77.5900,
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

  const photos = Array.isArray(complaint.photos) && complaint.photos.length > 0
    ? complaint.photos
    : (complaint.photoPreview ? [complaint.photoPreview] : []);

  return {
    ...complaint,
    photos,
    photoPreview: photos[0] || complaint.photoPreview || null,
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
    latitude: enriched.latitude !== undefined ? enriched.latitude : null,
    longitude: enriched.longitude !== undefined ? enriched.longitude : null,
    photos: enriched.photos || [],
    photoPreview: enriched.photoPreview || null,
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
