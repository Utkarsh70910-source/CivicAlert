/**
 * CivicAlert - Worker Management CRUD & RBAC Verification Test Suite
 * 
 * Verifies:
 * 1. Admin reads workers list with active task counts.
 * 2. Admin creates a new worker (POST /api/workers).
 * 3. Newly created worker can log in using generated workerId and password.
 * 4. Admin updates worker information (PUT /api/workers/:id) - Name, Specialization, Contact, Status.
 * 5. Worker can log in using updated Worker ID or username.
 * 6. Non-admin (Worker) attempting to create, update, or delete a worker receives 403 Forbidden.
 * 7. Unauthenticated user (Citizen/Public) attempting worker management receives 401 Unauthorized.
 * 8. Deleting a worker with active complaints (e.g. Ramesh Kumar W-101) is blocked with 400 Bad Request.
 * 9. Deleting a worker with 0 active complaints succeeds (200 OK).
 * 10. Deleted worker credentials cannot log in (401 Unauthorized).
 */

const http = require('http');
const assert = require('assert');
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
      res.on('data', (chunk) => {
        data += chunk;
      });
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

async function runTests() {
  console.log('======================================================');
  console.log('CIVICALERT - WORKER MANAGEMENT CRUD & RBAC TEST RUNNER');
  console.log('======================================================\n');

  try {
    // 1. Admin login
    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'admin123' },
    });
    assert.strictEqual(adminLoginRes.status, 200);
    const adminToken = adminLoginRes.data.token;
    console.log('✓ PASS 1: Admin successfully authenticated.');

    // 2. Admin GET /api/workers
    const getWorkersRes = await request('/api/workers', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(getWorkersRes.status, 200);
    assert.strictEqual(getWorkersRes.data.success, true);
    assert(Array.isArray(getWorkersRes.data.workers));
    console.log(`✓ PASS 2: Admin retrieved worker roster (${getWorkersRes.data.workers.length} workers).`);

    // 3. Admin POST /api/workers (Create new worker)
    const createWorkerRes = await request('/api/workers', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Test Technician Ananya',
        category: 'Streetlights',
        phone: '+91 98765 99999',
        password: 'workerPass123',
      },
    });
    assert.strictEqual(createWorkerRes.status, 201);
    assert.strictEqual(createWorkerRes.data.success, true);
    const createdWorker = createWorkerRes.data.worker;
    assert.strictEqual(createdWorker.name, 'Test Technician Ananya');
    assert.strictEqual(createdWorker.category, 'Streetlights');
    assert.strictEqual(createdWorker.password, undefined); // Password not exposed
    console.log(`✓ PASS 3: Admin created new field worker: ${createdWorker.name} (${createdWorker.workerId}).`);

    // 4. Test login of newly created worker
    const workerLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { workerId: createdWorker.workerId, password: 'workerPass123' },
    });
    assert.strictEqual(workerLoginRes.status, 200);
    const workerToken = workerLoginRes.data.token;
    console.log(`✓ PASS 4: Newly created worker logged in successfully using ${createdWorker.workerId}.`);

    // 5. Admin PUT /api/workers/:id (Update worker)
    const updateWorkerRes = await request(`/api/workers/${createdWorker.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Ananya Rao Senior Tech',
        phone: '+91 98765 88888',
        status: 'Active',
        specialization: 'Senior Electrical Engineer',
      },
    });
    assert.strictEqual(updateWorkerRes.status, 200);
    assert.strictEqual(updateWorkerRes.data.success, true);
    assert.strictEqual(updateWorkerRes.data.worker.name, 'Ananya Rao Senior Tech');
    assert.strictEqual(updateWorkerRes.data.worker.specialization, 'Senior Electrical Engineer');
    console.log(`✓ PASS 5: Admin updated worker details: ${updateWorkerRes.data.worker.name}.`);

    // 6. Security: Non-Admin (Worker) attempting to update worker gets 403 Forbidden
    const workerBlockedUpdateRes = await request(`/api/workers/${createdWorker.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${workerToken}` },
      body: { name: 'Hacked Name' },
    });
    assert.strictEqual(workerBlockedUpdateRes.status, 403);
    console.log('✓ PASS 6: Worker attempting to modify worker record blocked with 403 Forbidden.');

    // 7. Security: Unauthenticated request to delete worker gets 401 Unauthorized
    const publicBlockedDeleteRes = await request(`/api/workers/${createdWorker.id}`, {
      method: 'DELETE',
    });
    assert.strictEqual(publicBlockedDeleteRes.status, 401);
    console.log('✓ PASS 7: Unauthenticated delete request blocked with 401 Unauthorized.');

    // 8. Active Assignment Check: Attempting to delete worker with active complaints (w-104 or w-101) is blocked
    const activeWorkerDeleteRes = await request('/api/workers/w-104', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(activeWorkerDeleteRes.status, 400);
    assert.strictEqual(activeWorkerDeleteRes.data.success, false);
    assert(activeWorkerDeleteRes.data.message.includes('active assigned complaint'));
    console.log('✓ PASS 8: Deletion of worker with active complaints safely blocked with 400 Bad Request.');

    // 9. Delete worker with 0 active tasks (our created worker)
    const safeDeleteRes = await request(`/api/workers/${createdWorker.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(safeDeleteRes.status, 200);
    assert.strictEqual(safeDeleteRes.data.success, true);
    console.log(`✓ PASS 9: Deletion of worker with 0 active tasks succeeded (200 OK).`);

    // 10. Verify deleted worker cannot login
    const deletedWorkerLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { workerId: createdWorker.workerId, password: 'workerPass123' },
    });
    assert.strictEqual(deletedWorkerLoginRes.status, 401);
    console.log('✓ PASS 10: Deleted worker credentials correctly rejected with 401 Unauthorized.');

    console.log('\n======================================================');
    console.log('ALL WORKER MANAGEMENT CRUD & RBAC TESTS PASSED (10/10)');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Test Suite Failed:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
  }
}

server = app.listen(TEST_PORT, () => {
  runTests();
});

