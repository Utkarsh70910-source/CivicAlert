/**
 * CivicAlert - Final Local Completion Verification Suite
 */
const http = require('http');
const app = require('../server');

const TEST_PORT = 5098;
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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
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

async function runVerification() {
  server = app.listen(TEST_PORT);
  console.log('Testing CivicAlert Complete Local System on port ' + TEST_PORT);

  let passed = true;

  try {
    // 1. Citizen Flow
    const citizenReport = await request('/api/complaints', {
      method: 'POST',
      body: {
        category: 'Streetlights',
        location: 'Sector 5 Main Avenue',
        description: 'Flickering street lamp pole #42',
        citizenName: 'Rahul Verma',
        citizenPhone: '+91 9988776655'
      }
    });

    if (citizenReport.status !== 201 || !citizenReport.data.referenceId) {
      console.error('FAIL: Citizen report submission');
      passed = false;
    } else {
      console.log('PASS: Citizen report submitted, Ref ID: ' + citizenReport.data.referenceId);
    }

    const refId = citizenReport.data.referenceId;
    const complaintId = citizenReport.data.complaint.id;

    // Public tracking check (privacy check)
    const citizenTrack = await request('/api/complaints/' + refId);
    if (citizenTrack.status !== 200 || citizenTrack.data.complaint.citizenPhone !== undefined || citizenTrack.data.complaint.citizenName !== undefined) {
      console.error('FAIL: Citizen tracking privacy leak');
      passed = false;
    } else {
      console.log('PASS: Citizen tracking sanitized & privacy preserved');
    }

    // 2. Admin Flow
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'admin123' }
    });
    const adminToken = adminLogin.data.token;

    // Admin sees complaint
    const adminComplaints = await request('/api/complaints', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const foundByAdmin = adminComplaints.data.complaints.find(c => c.id === complaintId);
    if (!foundByAdmin) {
      console.error('FAIL: Admin cannot see new complaint');
      passed = false;
    } else {
      console.log('PASS: Admin sees submitted complaint in grievances list');
    }

    // Admin assigns worker W-102 (Streetlights -> Electrician Priya Sharma)
    const assignRes = await request(`/api/complaints/${complaintId}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { workerId: 'W-102', expectedCompletionDate: '2026-11-25' }
    });
    if (assignRes.status !== 200 || assignRes.data.complaint.assignedWorkerName !== 'Priya Sharma') {
      console.error('FAIL: Admin assignment');
      passed = false;
    } else {
      console.log('PASS: Admin assigned complaint to Priya Sharma (Electrician)');
    }

    // 3. Worker Flow
    // Worker A (W-102) login
    const workerALogin = await request('/api/auth/login', {
      method: 'POST',
      body: { workerId: 'W-102', password: 'worker123' }
    });
    const workerAToken = workerALogin.data.token;

    // Worker A sees complaint
    const workerAComplaints = await request('/api/complaints', {
      headers: { Authorization: `Bearer ${workerAToken}` }
    });
    const foundByWorkerA = workerAComplaints.data.complaints.find(c => c.id === complaintId);
    if (!foundByWorkerA) {
      console.error('FAIL: Worker A cannot see assigned complaint');
      passed = false;
    } else {
      console.log('PASS: Worker A sees newly assigned complaint');
    }

    // Worker B (W-101) login
    const workerBLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { workerId: 'W-101', password: 'worker123' }
    });
    const workerBToken = workerBLogin.data.token;

    // Worker B must NOT see Worker A's complaint in list
    const workerBComplaints = await request('/api/complaints', {
      headers: { Authorization: `Bearer ${workerBToken}` }
    });
    const foundByWorkerB = workerBComplaints.data.complaints.find(c => c.id === complaintId);
    if (foundByWorkerB) {
      console.error('FAIL: Worker B sees Worker A assigned complaint in list');
      passed = false;
    } else {
      console.log('PASS: Worker B list isolated from Worker A complaints');
    }

    // Worker B direct read attempt -> 403
    const workerBRead = await request(`/api/complaints/${complaintId}`, {
      headers: { Authorization: `Bearer ${workerBToken}` }
    });
    if (workerBRead.status !== 403) {
      console.error('FAIL: Worker B was not rejected with 403 on direct read');
      passed = false;
    } else {
      console.log('PASS: Worker B direct read blocked with 403 Forbidden');
    }

    // Worker B direct update attempt -> 403
    const workerBWrite = await request(`/api/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${workerBToken}` },
      body: { status: 'Resolved' }
    });
    if (workerBWrite.status !== 403) {
      console.error('FAIL: Worker B was not rejected with 403 on direct write');
      passed = false;
    } else {
      console.log('PASS: Worker B direct write blocked with 403 Forbidden');
    }

    // Worker A updates status & resolution notes
    const workerAUpdate = await request(`/api/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${workerAToken}` },
      body: {
        status: 'Resolved',
        resolutionNotes: 'Replaced ballast and halogen bulb on lamp #42.'
      }
    });
    if (workerAUpdate.status !== 200 || workerAUpdate.data.complaint.status !== 'Resolved') {
      console.error('FAIL: Worker A update status');
      passed = false;
    } else {
      console.log('PASS: Worker A resolved complaint and submitted resolution notes');
    }

    // Worker A blocked from Admin APIs
    const workerAdminApiCheck = await request('/api/workers', {
      headers: { Authorization: `Bearer ${workerAToken}` }
    });
    if (workerAdminApiCheck.status !== 403) {
      console.error('FAIL: Worker A was able to access Admin API');
      passed = false;
    } else {
      console.log('PASS: Worker A blocked from Admin API /api/workers with 403 Forbidden');
    }

    // Unauthenticated blocked from staff APIs
    const unauthCheck = await request('/api/complaints');
    if (unauthCheck.status !== 401) {
      console.error('FAIL: Unauthenticated allowed to access /api/complaints');
      passed = false;
    } else {
      console.log('PASS: Unauthenticated blocked from /api/complaints with 401 Unauthorized');
    }

    // 5. Citizen End-to-End Tracking
    const citizenFinalTrack = await request('/api/complaints/' + refId);
    if (
      citizenFinalTrack.status !== 200 ||
      citizenFinalTrack.data.complaint.status !== 'Resolved' ||
      citizenFinalTrack.data.complaint.resolutionNotes !== 'Replaced ballast and halogen bulb on lamp #42.' ||
      citizenFinalTrack.data.complaint.assignedWorkerName !== 'Priya Sharma'
    ) {
      console.error('FAIL: Citizen end-to-end tracking verification');
      passed = false;
    } else {
      console.log('PASS: Citizen tracks resolved complaint with assigned worker and resolution notes');
    }

    console.log('\nFINAL SYSTEM VERIFICATION STATUS: ' + (passed ? 'ALL CHECKS PASSED' : 'FAILURES DETECTED'));
  } catch (err) {
    console.error('Verification error:', err);
    passed = false;
  } finally {
    server.close();
    process.exit(passed ? 0 : 1);
  }
}

runVerification();

