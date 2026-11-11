/**
 * CivicAlert - Verification Suite for User Requirements
 *
 * Checks:
 * 1. Backend MongoDB connection/configuration
 * 2. Citizen signup & login
 * 3. Citizen complaint ownership & My Complaints
 * 4. Stop & restart backend process (Persistence across real server process restart)
 * 5. Verify citizen, complaint, and My Complaints exist after restart
 * 6. Admin complaint access
 * 7. Worker assigned-complaint access
 * 8. RBAC security checks
 */

const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 5088;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function request(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: '127.0.0.1',
      port: PORT,
      path: urlPath,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

function startBackendProcess() {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['server.js'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, PORT: String(PORT) },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let started = false;
    proc.stdout.on('data', (d) => {
      const text = d.toString();
      if (text.includes('CivicAlert Backend Server is LIVE') && !started) {
        started = true;
        resolve(proc);
      }
    });

    proc.on('error', (err) => {
      if (!started) reject(err);
    });

    // Fallback timer
    setTimeout(() => {
      if (!started) {
        started = true;
        resolve(proc);
      }
    }, 2500);
  });
}

function stopBackendProcess(proc) {
  return new Promise((resolve) => {
    if (!proc || proc.killed) return resolve();
    proc.on('exit', () => resolve());
    proc.kill('SIGTERM');
    setTimeout(() => {
      try { proc.kill('SIGKILL'); } catch (_) {}
      resolve();
    }, 1500);
  });
}

async function run() {
  console.log('====================================================');
  console.log('CIVICALERT - EXPLICIT VERIFICATION OF ALL CRITERIA');
  console.log('====================================================\n');

  // STEP A: Start Backend Instance #1
  console.log('[Phase 1] Starting Backend Server Instance #1 on port ' + PORT + '...');
  let backendProc = await startBackendProcess();
  console.log('[Phase 1] Instance #1 is running.');

  // Check 1: Verify MongoDB connection / health endpoint
  const healthRes = await request('/api/health');
  console.log(`[Check 1 - Database Config & Health]: HTTP ${healthRes.status}, database: "${healthRes.data.database}"`);
  if (healthRes.status !== 200 || !healthRes.data.database) {
    throw new Error('Health check failed');
  }

  // Check 2: Citizen Signup
  const uniqueEmail = `test.citizen.${Date.now()}@domain.org`;
  const citizenPassword = 'citizenSecurePass987';
  console.log(`[Check 2 - Citizen Signup]: Registering ${uniqueEmail}...`);

  const signupRes = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Pooja Verma',
      email: uniqueEmail,
      mobile: '9805127600',
      password: citizenPassword,
      confirmPassword: citizenPassword,
    },
  });

  if (signupRes.status !== 201 || !signupRes.data.token || signupRes.data.user.role !== 'citizen') {
    throw new Error(`Signup failed with status ${signupRes.status}: ${JSON.stringify(signupRes.data)}`);
  }
  const citizenToken1 = signupRes.data.token;
  const citizenId = signupRes.data.user.id;
  console.log(`[Check 2 - Citizen Signup]: Success! Citizen ID: ${citizenId}, token created.`);

  // Check 3: Citizen Login
  console.log('[Check 3 - Citizen Login]: Testing authentication endpoint...');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: {
      username: uniqueEmail,
      password: citizenPassword,
    },
  });

  if (loginRes.status !== 200 || !loginRes.data.token || loginRes.data.user.email !== uniqueEmail) {
    throw new Error(`Login failed with status ${loginRes.status}`);
  }
  const citizenToken = loginRes.data.token;
  console.log('[Check 3 - Citizen Login]: Success! Logged in with email & password.');

  // Check 4: Citizen creates complaint (Ownership link)
  console.log('[Check 4 - Citizen Complaint Submission]: Submitting new civic issue...');
  const complaintRes = await request('/api/complaints', {
    method: 'POST',
    headers: { Authorization: `Bearer ${citizenToken}` },
    body: {
      category: 'Streetlights',
      location: 'Near Community Park Block C',
      description: 'Streetlight pole #44 is completely non-functional causing dark spot',
      photos: ['data:image/jpeg;base64,sample_street_light_photo'],
    },
  });

  if (complaintRes.status !== 201 || !complaintRes.data.referenceId) {
    throw new Error(`Complaint submission failed: ${JSON.stringify(complaintRes.data)}`);
  }
  const referenceId = complaintRes.data.referenceId;
  console.log(`[Check 4 - Citizen Complaint Submission]: Success! Reference ID: ${referenceId}`);

  // Check 5: My Complaints before restart
  console.log('[Check 5 - My Complaints (Pre-Restart)]: Fetching citizen complaints...');
  const myComplaintsPre = await request('/api/complaints/my', {
    headers: { Authorization: `Bearer ${citizenToken}` },
  });

  const foundPre = myComplaintsPre.data.complaints.some((c) => c.referenceId === referenceId);
  if (!foundPre) {
    throw new Error('Complaint not found in My Complaints before restart');
  }
  console.log(`[Check 5 - My Complaints (Pre-Restart)]: Confirmed! Found ${referenceId} in citizen complaints list.`);

  // =========================================================================
  // MOST CRITICAL TEST: STOP / RESTART BACKEND PROCESS
  // =========================================================================
  console.log('\n====================================================');
  console.log('[CRITICAL STEP] STOPPING BACKEND PROCESS...');
  await stopBackendProcess(backendProc);
  console.log('[CRITICAL STEP] Server has stopped. Waiting 1 second...');
  await new Promise((r) => setTimeout(r, 1000));

  console.log('[CRITICAL STEP] RESTARTING BACKEND PROCESS (Instance #2)...');
  backendProc = await startBackendProcess();
  console.log('[CRITICAL STEP] Backend Instance #2 restarted successfully!');
  console.log('====================================================\n');

  // Check 6: Verify Citizen still exists after restart (by logging in anew)
  console.log('[Check 6 - Post-Restart Login]: Re-authenticating citizen with credentials...');
  const postRestartLogin = await request('/api/auth/login', {
    method: 'POST',
    body: {
      username: uniqueEmail,
      password: citizenPassword,
    },
  });

  if (postRestartLogin.status !== 200 || postRestartLogin.data.user.email !== uniqueEmail) {
    throw new Error('Citizen account vanished after restart!');
  }
  const postRestartToken = postRestartLogin.data.token;
  console.log('[Check 6 - Post-Restart Login]: SUCCESS! Citizen account persisted across restart.');

  // Check 7: Verify My Complaints still returns the complaint after restart
  console.log('[Check 7 - Post-Restart My Complaints]: Fetching My Complaints after restart...');
  const myComplaintsPost = await request('/api/complaints/my', {
    headers: { Authorization: `Bearer ${postRestartToken}` },
  });

  const foundPost = myComplaintsPost.data.complaints.some((c) => c.referenceId === referenceId);
  if (!foundPost) {
    throw new Error('Complaint vanished from My Complaints after backend restart!');
  }
  console.log(`[Check 7 - Post-Restart My Complaints]: SUCCESS! Complaint ${referenceId} persisted across restart!`);

  // Check 8: Verify Admin complaint access
  console.log('[Check 8 - Admin Complaint Access]: Logging in as admin...');
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'admin123' },
  });
  const adminToken = adminLogin.data.token;

  const adminComplaints = await request('/api/complaints', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminFound = adminComplaints.data.complaints.some((c) => c.referenceId === referenceId);
  if (!adminFound) {
    throw new Error('Admin unable to view the citizen complaint');
  }
  console.log(`[Check 8 - Admin Complaint Access]: SUCCESS! Admin can view all complaints including ${referenceId}.`);

  // Assign complaint to Worker W-102 (Streetlights specialist)
  console.log(`[Assignment]: Admin assigning ${referenceId} to Worker W-102 (Priya Sharma)...`);
  const assignRes = await request(`/api/complaints/${referenceId}/assign`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { workerId: 'W-102', expectedCompletionDate: '2026-11-25' },
  });
  if (assignRes.status !== 200 || assignRes.data.complaint.status !== 'In Progress') {
    throw new Error('Assignment failed');
  }
  console.log('[Assignment]: Assigned successfully. Status -> In Progress.');

  // Check 9: Verify Worker assigned-complaint access & Isolation
  console.log('[Check 9 - Worker Assigned Access]: Logging in as assigned worker W-102...');
  const worker102Login = await request('/api/auth/login', {
    method: 'POST',
    body: { workerId: 'W-102', password: 'worker123' },
  });
  const worker102Token = worker102Login.data.token;

  const worker102Complaints = await request('/api/complaints', {
    headers: { Authorization: `Bearer ${worker102Token}` },
  });
  const worker102HasTask = worker102Complaints.data.complaints.some((c) => c.referenceId === referenceId);
  if (!worker102HasTask) {
    throw new Error('Assigned worker cannot see their assigned complaint');
  }
  console.log(`[Check 9 - Worker Assigned Access]: SUCCESS! Worker W-102 sees assigned complaint ${referenceId}.`);

  // Worker W-101 (other worker) must NOT see or modify this complaint
  console.log('[Check 9 - Worker Isolation]: Testing unassigned Worker W-101 access...');
  const worker101Login = await request('/api/auth/login', {
    method: 'POST',
    body: { workerId: 'W-101', password: 'worker123' },
  });
  const worker101Token = worker101Login.data.token;

  const worker101Update = await request(`/api/complaints/${referenceId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${worker101Token}` },
    body: { status: 'Resolved' },
  });
  if (worker101Update.status !== 403) {
    throw new Error(`Worker isolation failed: Worker W-101 got HTTP ${worker101Update.status} instead of 403`);
  }
  console.log('[Check 9 - Worker Isolation]: SUCCESS! Unassigned worker blocked with 403 Forbidden.');

  // Check 10: RBAC - Citizen blocked from Admin routes
  console.log('[Check 10 - RBAC]: Verifying Citizen blocked from /api/workers...');
  const citizenAdminAttempt = await request('/api/workers', {
    headers: { Authorization: `Bearer ${postRestartToken}` },
  });
  if (citizenAdminAttempt.status !== 403) {
    throw new Error(`RBAC failure: Citizen got HTTP ${citizenAdminAttempt.status} instead of 403`);
  }
  console.log('[Check 10 - RBAC]: SUCCESS! Citizen blocked with 403 Forbidden.');

  // Assigned worker resolves the issue
  console.log('[Resolution]: Worker W-102 resolving the complaint...');
  const resolveRes = await request(`/api/complaints/${referenceId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${worker102Token}` },
    body: {
      status: 'Resolved',
      resolutionNotes: 'Bulb and wiring replaced on pole #44, illumination restored.',
    },
  });
  if (resolveRes.status !== 200 || resolveRes.data.complaint.status !== 'Resolved') {
    throw new Error('Resolution failed');
  }
  console.log('[Resolution]: SUCCESS! Complaint marked Resolved.');

  // Final check: Citizen My Complaints reflects Resolved status
  const finalCitizenCheck = await request('/api/complaints/my', {
    headers: { Authorization: `Bearer ${postRestartToken}` },
  });
  const finalComplaint = finalCitizenCheck.data.complaints.find((c) => c.referenceId === referenceId);
  if (!finalComplaint || finalComplaint.status !== 'Resolved') {
    throw new Error('Citizen view does not reflect resolved status');
  }
  console.log('[End-to-End Loop]: SUCCESS! Citizen sees Resolved status in My Complaints.');

  console.log('\n====================================================');
  console.log('ALL 10 VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
  console.log('====================================================\n');

  await stopBackendProcess(backendProc);
  process.exit(0);
}

run().catch(async (err) => {
  console.error('\n[VERIFICATION ERROR]:', err.message);
  process.exit(1);
});

