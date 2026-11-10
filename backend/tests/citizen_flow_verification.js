/**
 * CivicAlert - Citizen Authentication & My Complaints Automated Test Suite
 *
 * Verifies:
 * 1. Citizen Sign Up with validation & duplicate email prevention (409)
 * 2. Citizen Sign In & invalid credentials rejection (401)
 * 3. Passwords never exposed
 * 4. Citizen retrieves own complaints via GET /api/complaints/my (200 OK)
 * 5. Authenticated complaint submission automatically associates complaint with citizenId
 * 6. Complaint appears immediately in My Complaints
 * 7. Citizen view of own complaint gives full owner-level detail (citizen-owner)
 * 8. Security: Citizen A blocked from accessing Citizen B's private complaint (403 Forbidden)
 * 9. Security: Citizen blocked from Admin routes (/api/workers) (403 Forbidden)
 * 10. Security: Citizen blocked from Worker task updates (/api/complaints/:id/status) (403 Forbidden)
 * 11. Public Tracking by Reference ID remains operational (200 OK sanitized)
 * 12. Citizen Logout terminates session token
 */

const http = require('http');
const app = require('../server');

const TEST_PORT = 5096;
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
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  server = app.listen(TEST_PORT);

  try {
    console.log('====================================================');
    console.log('CIVICALERT - CITIZEN AUTH & MY COMPLAINTS TEST SUITE');
    console.log('====================================================');

    // TEST 1: Citizen Sign Up Validation - missing fields & mobile numbers
    const invalidSignup = await request('/api/auth/register', {
      method: 'POST',
      body: { name: '', email: 'notanemail', mobile: '123', password: '123' },
    });
    if (invalidSignup.status !== 400) {
      throw new Error(`Test 1 Failed: Expected 400, got ${invalidSignup.status}`);
    }

    // Specific mobile number test cases requested by user:
    const invalidMobiles = ['1234567890', '980512760', '98051276000'];
    for (const badMobile of invalidMobiles) {
      const res = await request('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Validation Test',
          email: `val_${Date.now()}_${Math.random()}@example.com`,
          mobile: badMobile,
          password: 'password123',
          confirmPassword: 'password123',
        },
      });
      if (res.status !== 400) {
        throw new Error(`Expected mobile ${badMobile} to be rejected with 400, got ${res.status}`);
      }
    }

    // Valid mobile 9805127600 registration must succeed
    const validUserWith9805 = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Valid Mobile User',
        email: `valid_${Date.now()}@example.com`,
        mobile: '9805127600',
        password: 'password123',
        confirmPassword: 'password123',
      },
    });
    if (validUserWith9805.status !== 201) {
      throw new Error(`Expected mobile 9805127600 to be accepted with 201, got ${validUserWith9805.status}`);
    }
    console.log('[PASS] Test 1: Mobile validation tests passed (9805127600 & 9876543210 accepted; 1234567890, 980512760, 98051276000 rejected)');

    // TEST 2: Citizen Sign Up - Success
    const uniqueEmail = `testcitizen_${Date.now()}@example.com`;
    const signupRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Rohan Sharma',
        email: uniqueEmail,
        mobile: '9876543210',
        password: 'password123',
        confirmPassword: 'password123',
      },
    });
    if (signupRes.status !== 201 || !signupRes.data.token || signupRes.data.user.role !== 'citizen') {
      throw new Error(`Test 2 Failed: Expected 201 and citizen token, got ${signupRes.status}`);
    }
    if (signupRes.data.user.password) {
      throw new Error('Test 2 Failed: Password must NEVER be exposed in user object');
    }
    const citizenToken = signupRes.data.token;
    const citizenId = signupRes.data.user.id;
    console.log(`[PASS] Test 2: Citizen registered successfully (201 Created), password not leaked, role=${signupRes.data.user.role}`);

    // TEST 3: Duplicate Email Prevention
    const dupSignup = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Another Person',
        email: uniqueEmail,
        mobile: '9876543211',
        password: 'password123',
        confirmPassword: 'password123',
      },
    });
    if (dupSignup.status !== 409) {
      throw new Error(`Test 3 Failed: Expected 409 Conflict for duplicate email, got ${dupSignup.status}`);
    }
    console.log('[PASS] Test 3: Duplicate email registration blocked with 409 Conflict');

    // TEST 4: Citizen Sign In with wrong password
    const badLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { username: uniqueEmail, password: 'wrongpassword' },
    });
    if (badLogin.status !== 401) {
      throw new Error(`Test 4 Failed: Expected 401 for wrong password, got ${badLogin.status}`);
    }
    console.log('[PASS] Test 4: Citizen login with invalid password rejected with 401 Unauthorized');

    // TEST 5: Citizen Sign In with correct credentials
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { username: uniqueEmail, password: 'password123' },
    });
    if (loginRes.status !== 200 || !loginRes.data.token) {
      throw new Error(`Test 5 Failed: Expected 200 OK on valid login, got ${loginRes.status}`);
    }
    console.log('[PASS] Test 5: Citizen logged in successfully with email + password (200 OK)');

    // TEST 6: Unauthenticated request to /api/complaints/my blocked with 401
    const unauthMy = await request('/api/complaints/my');
    if (unauthMy.status !== 401) {
      throw new Error(`Test 6 Failed: Expected 401 for unauthenticated /my, got ${unauthMy.status}`);
    }
    console.log('[PASS] Test 6: Unauthenticated access to /api/complaints/my blocked with 401 Unauthorized');

    // TEST 7: Citizen checks My Complaints initially (0 complaints for new user)
    const myComplaintsInit = await request('/api/complaints/my', {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    if (myComplaintsInit.status !== 200 || myComplaintsInit.data.count !== 0) {
      throw new Error(`Test 7 Failed: Expected 0 complaints for new citizen, got ${myComplaintsInit.data.count}`);
    }
    console.log('[PASS] Test 7: GET /api/complaints/my returns only authenticated citizen complaints (count=0 for new citizen)');

    // TEST 8: Logged-in Citizen submits a complaint -> automatically tagged with citizenId
    const submitRes = await request('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: {
        category: 'Roads & Potholes',
        location: 'Sector 17 Market Main Road',
        description: 'Large asphalt pothole causing traffic slowdown.',
      },
    });
    if (submitRes.status !== 201 || !submitRes.data.referenceId) {
      throw new Error(`Test 8 Failed: Expected 201 Created with referenceId, got ${submitRes.status}`);
    }
    const newRefId = submitRes.data.referenceId;
    console.log(`[PASS] Test 8: Complaint submitted with Bearer token, auto-tagged to citizen (Ref ID: ${newRefId})`);

    // TEST 9: Newly submitted complaint immediately appears in My Complaints
    const myComplaintsAfter = await request('/api/complaints/my', {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    if (myComplaintsAfter.status !== 200 || myComplaintsAfter.data.count !== 1) {
      throw new Error(`Test 9 Failed: Expected count=1 in My Complaints, got ${myComplaintsAfter.data.count}`);
    }
    const citizenComplaint = myComplaintsAfter.data.complaints[0];
    if (citizenComplaint.referenceId !== newRefId) {
      throw new Error(`Test 9 Failed: Expected ref ID ${newRefId}, got ${citizenComplaint.referenceId}`);
    }
    console.log(`[PASS] Test 9: My Complaints automatically contains newly submitted complaint (${newRefId})`);

    // TEST 10: Citizen reads own complaint detail -> receives citizen-owner access level
    const ownDetail = await request(`/api/complaints/${citizenComplaint.id}`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    if (ownDetail.status !== 200 || ownDetail.data.accessLevel !== 'citizen-owner') {
      throw new Error(`Test 10 Failed: Expected citizen-owner accessLevel, got ${ownDetail.data.accessLevel}`);
    }
    console.log('[PASS] Test 10: Citizen reads own complaint details with citizen-owner access level (200 OK)');

    // TEST 11: Security: Citizen A blocked from accessing Citizen B's complaint by ID (403 Forbidden)
    // cmp-102 belongs to Neha Kapoor (not Rohan Sharma)
    const otherDetail = await request('/api/complaints/cmp-102', {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    if (otherDetail.status !== 403) {
      throw new Error(`Test 11 Failed: Expected 403 Forbidden when accessing another citizen's complaint ID, got ${otherDetail.status}`);
    }
    console.log('[PASS] Test 11: Cross-Citizen Access: Citizen A blocked from Citizen B complaint ID (403 Forbidden)');

    // TEST 12: Security: Citizen blocked from Worker API (/api/complaints/:id/status)
    const statusHack = await request(`/api/complaints/${citizenComplaint.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: { status: 'Resolved' },
    });
    if (statusHack.status !== 403) {
      throw new Error(`Test 12 Failed: Expected 403 Forbidden when citizen tries to update status, got ${statusHack.status}`);
    }
    console.log('[PASS] Test 12: Citizen blocked from Worker/Admin status update endpoint (403 Forbidden)');

    // TEST 13: Security: Citizen blocked from Admin API (/api/workers)
    const adminHack = await request('/api/workers', {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    if (adminHack.status !== 403) {
      throw new Error(`Test 13 Failed: Expected 403 Forbidden when citizen accesses Admin route, got ${adminHack.status}`);
    }
    console.log('[PASS] Test 13: Citizen blocked from Admin API /api/workers (403 Forbidden)');

    // TEST 14: Public Tracking by Reference ID continues to work (even for another user's complaint)
    const publicTrack = await request('/api/complaints/CA-100202', {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    if (publicTrack.status !== 200 || publicTrack.data.accessLevel !== 'public-sanitized') {
      throw new Error(`Test 14 Failed: Expected 200 public-sanitized tracking, got ${publicTrack.status}`);
    }
    if (publicTrack.data.complaint.citizenPhone) {
      throw new Error('Test 14 Failed: Public tracking must not expose private citizen phone');
    }
    console.log('[PASS] Test 14: Public tracking by Reference ID CA-100202 works and protects citizen privacy (200 OK)');

    // TEST 15: Citizen Logout invalidates session
    const logoutRes = await request('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    if (logoutRes.status !== 200) {
      throw new Error(`Test 15 Failed: Expected 200 on logout, got ${logoutRes.status}`);
    }
    const afterLogout = await request('/api/complaints/my', {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    if (afterLogout.status !== 401) {
      throw new Error(`Test 15 Failed: Logged out token should be rejected with 401, got ${afterLogout.status}`);
    }
    console.log('[PASS] Test 15: Citizen logout successfully terminates session; subsequent requests rejected (401)');

    console.log('====================================================');
    console.log('ALL CITIZEN AUTH & MY COMPLAINTS TESTS PASSED (15/15)');
    console.log('====================================================');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  if (server) server.close();
  process.exit(1);
});

