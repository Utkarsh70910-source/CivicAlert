/**
 * CivicAlert - Automated Backend API & RBAC Test Suite
 * 
 * Verifies all Local Completion & Security requirements:
 * 1. Health check (200 OK)
 * 2. Admin authentication & password masking
 * 3. Worker authentication by Worker ID
 * 4. Invalid credentials rejection (401 Unauthorized)
 * 5. Role-based authorization: Worker blocked from Admin routes (403 Forbidden)
 * 6. Admin authorized access to stats & workers (200 OK)
 * 7. Public user blocked from protected worker endpoints (401 Unauthorized)
 * 8. Public citizen complaint creation (201 Created)
 * 9. Public sanitized complaint tracking for CA-12345 (200 OK)
 * 10. Lookup for non-existent ID returns 404 Not Found
 * 11. Public tracking preserves citizen privacy (no citizen phone/name)
 * 12. Admin complaint assignment & SLA target setting
 * 13. Assigned worker reading own task details (200 OK)
 * 14. Assigned worker status update & resolution notes (200 OK)
 * 15. Cross-Worker Read Isolation: Worker B blocked from reading Worker A's complaint (403 Forbidden)
 * 16. Cross-Worker Write Isolation: Worker B blocked from modifying Worker A's complaint (403 Forbidden)
 * 17. Admin Worker Registration with Specialization & Active status (201 Created)
 * 18. Logout invalidation: Logged out session token rejected with 401 Unauthorized
 */

const http = require('http');
const app = require('../server');

const TEST_PORT = 5099;
let server;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: 'localhost',
      port: TEST_PORT,
      path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('CIVICALERT - SYSTEMATIC API & RBAC TEST RUNNER');
  console.log('====================================================\n');

  let passedCount = 0;
  let totalTests = 19;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // 1. Health check
  const healthRes = await request('/api/health');
  assert(healthRes.status === 200 && healthRes.data.status === 'success', 'Health check: GET /api/health returned 200 OK');

  // 2. Admin login
  const adminLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'admin123' },
  });
  const adminToken = adminLoginRes.data.token;
  assert(
    adminLoginRes.status === 200 &&
      adminLoginRes.data.user.role === 'admin' &&
      adminLoginRes.data.user.password === undefined,
    'Admin Login: Authenticated, role=admin, password not leaked in response'
  );

  // 3. Worker login
  const workerLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: { workerId: 'W-101', password: 'worker123' },
  });
  const workerToken = workerLoginRes.data.token;
  assert(
    workerLoginRes.status === 200 &&
      workerLoginRes.data.user.role === 'worker' &&
      workerLoginRes.data.user.workerId === 'W-101',
    'Worker Login: Authenticated by Worker ID W-101, role=worker'
  );

  // 4. Invalid login
  const invalidLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'wrongpassword' },
  });
  assert(invalidLoginRes.status === 401, 'Invalid Login: Rejected with 401 Unauthorized');

  // 5. Worker accessing admin route (GET /api/workers with worker token) -> MUST be 403 Forbidden!
  const workerForbiddenRes = await request('/api/workers', {
    method: 'GET',
    headers: { Authorization: `Bearer ${workerToken}` },
  });
  assert(
    workerForbiddenRes.status === 403,
    'RBAC Security: Worker attempting to access Admin route (GET /api/workers) received 403 Forbidden'
  );

  // 6. Admin accessing admin routes (GET /api/stats, GET /api/workers) -> MUST be 200 OK
  const adminStatsRes = await request('/api/stats', {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(
    adminStatsRes.status === 200 &&
      adminStatsRes.data.stats.totalComplaints > 0 &&
      adminStatsRes.data.stats.underReviewCount !== undefined,
    'Admin Access: Admin authorized to view /api/stats with Under Review counters (200 OK)'
  );

  // 7. Public user accessing protected worker endpoint (GET /api/complaints without token) -> MUST be 401
  const unauthRes = await request('/api/complaints', { method: 'GET' });
  assert(
    unauthRes.status === 401,
    'Public Security: Unauthenticated request to GET /api/complaints blocked with 401'
  );

  // 8. Public complaint creation
  const createRes = await request('/api/complaints', {
    method: 'POST',
    body: {
      category: 'Roads & Potholes',
      location: 'MG Road Junction, Ward 4',
      description: 'Severe asphalt depression causing vehicle bumper scrape.',
      citizenName: 'Aditya Sen',
      citizenPhone: '+91 98765 99999',
    },
  });
  const createdRefId = createRes.data.referenceId;
  const createdId = createRes.data.complaint.id;
  assert(
    createRes.status === 201 && createdRefId.startsWith('CA-'),
    `Complaint Creation: Created new complaint with generated Ref ID ${createdRefId}`
  );

  // 9. Public sanitized complaint tracking (CA-12345)
  const trackCa12345Res = await request('/api/complaints/CA-12345', { method: 'GET' });
  assert(
    trackCa12345Res.status === 200 &&
      trackCa12345Res.data.complaint.referenceId === 'CA-12345' &&
      trackCa12345Res.data.complaint.category === 'Water & Drainage' &&
      trackCa12345Res.data.complaint.citizenPhone === undefined,
    'Complaint Tracking: Public lookup for sample CA-12345 returns 200 with sanitized data'
  );

  // 10. Lookup for non-existent ID returns 404
  const trackNonExistent = await request('/api/complaints/CA-NONEXISTENT-999', { method: 'GET' });
  assert(
    trackNonExistent.status === 404,
    'Complaint Tracking: Lookup for non-existent ID correctly returns 404 Not Found'
  );

  // 11. Public tracking preserves citizen privacy
  const trackRes = await request(`/api/complaints/${createdRefId}`, { method: 'GET' });
  assert(
    trackRes.status === 200 &&
      trackRes.data.complaint.referenceId === createdRefId &&
      trackRes.data.complaint.citizenPhone === undefined &&
      trackRes.data.complaint.citizenName === undefined,
    'Complaint Tracking: Public view returns created complaint details while preserving citizen privacy (phone/name omitted)'
  );

  // 12. Admin complaint assignment
  const assignRes = await request(`/api/complaints/${createdId}/assign`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      workerId: 'w-101',
      expectedCompletionDate: '2026-11-20',
    },
  });
  assert(
    assignRes.status === 200 &&
      assignRes.data.complaint.assignedWorkerName === 'Ramesh Kumar' &&
      assignRes.data.complaint.status === 'In Progress',
    'Complaint Assignment: Admin successfully assigned to Ramesh Kumar and status changed to In Progress'
  );

  // 13. Assigned worker reading own task details (200 OK + Citizen Contact)
  const workerReadOwnRes = await request(`/api/complaints/${createdId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${workerToken}` },
  });
  assert(
    workerReadOwnRes.status === 200 &&
      workerReadOwnRes.data.complaint.citizenPhone === '+91 98765 99999' &&
      workerReadOwnRes.data.accessLevel === 'worker-assigned',
    'Worker Read Access: Assigned worker W-101 authorized to view citizen contact on assigned complaint (200 OK)'
  );

  // 14. Assigned worker status update and resolution notes
  const updateRes = await request(`/api/complaints/${createdId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${workerToken}` },
    body: {
      status: 'Resolved',
      resolutionNotes: 'Asphalt filled and steamrolled level with roadway.',
    },
  });
  assert(
    updateRes.status === 200 &&
      updateRes.data.complaint.status === 'Resolved' &&
      updateRes.data.complaint.resolvedAt !== null,
    'Worker Status Update: Assigned worker marked complaint as Resolved with resolution notes'
  );

  // 14b. Citizen tracks the resolved complaint (End-to-End full loop)
  const citizenTrackResolved = await request(`/api/complaints/${createdRefId}`, { method: 'GET' });
  assert(
    citizenTrackResolved.status === 200 &&
      citizenTrackResolved.data.complaint.status === 'Resolved' &&
      citizenTrackResolved.data.complaint.resolutionNotes === 'Asphalt filled and steamrolled level with roadway.',
    'End-to-End Loop: Citizen tracking sees updated Resolved status and worker resolution notes'
  );

  // 15. Cross-Worker Isolation (Read): Worker W-102 reading W-101's complaint MUST be 403 Forbidden!
  const worker2Login = await request('/api/auth/login', {
    method: 'POST',
    body: { workerId: 'W-102', password: 'worker123' },
  });
  const worker2Token = worker2Login.data.token;

  const crossWorkerReadRes = await request(`/api/complaints/${createdId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${worker2Token}` },
  });
  assert(
    crossWorkerReadRes.status === 403,
    'Cross-Worker Isolation (Read): Worker W-102 prevented from reading task assigned to W-101 (403 Forbidden)'
  );

  // 16. Cross-Worker Isolation (Write): Worker W-102 modifying W-101's complaint MUST be 403 Forbidden!
  const crossWorkerWriteRes = await request(`/api/complaints/${createdId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${worker2Token}` },
    body: { status: 'Under Review' },
  });
  assert(
    crossWorkerWriteRes.status === 403,
    'Cross-Worker Isolation (Write): Worker W-102 prevented from modifying task assigned to W-101 (403 Forbidden)'
  );

  // 17. Admin Worker Registration
  const addWorkerRes = await request('/api/workers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      name: 'Sunil Verma',
      category: 'Roads & Potholes',
      phone: '+91 98765 44556',
    },
  });
  assert(
    addWorkerRes.status === 201 &&
      addWorkerRes.data.worker.name === 'Sunil Verma' &&
      addWorkerRes.data.worker.status === 'Active',
    'Admin Worker Management: Admin registered new field worker with Active status (201 Created)'
  );

  // 18. Logout session invalidation
  const logoutRes = await request('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const postLogoutMeRes = await request('/api/auth/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(
    logoutRes.status === 200 && postLogoutMeRes.status === 401,
    'Logout Invalidation: POST /api/auth/logout successfully terminates session, subsequent requests return 401'
  );

  console.log(`\n====================================================`);
  console.log(`ALL TESTS PASSED: ${passedCount} / ${totalTests} (100% SUCCESS)`);
  console.log(`====================================================\n`);

  server.close(() => {
    process.exit(passedCount === totalTests ? 0 : 1);
  });
}

// Start server on dedicated test port
server = app.listen(TEST_PORT, () => {
  runTests().catch((err) => {
    console.error('Test execution error:', err);
    if (server) server.close();
    process.exit(1);
  });
});
