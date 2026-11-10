/**
 * CivicAlert - Map & Multi-Photo Verification Test Suite
 * 
 * Verifies:
 * 1. Citizen complaint creation with single photo & GPS coordinates.
 * 2. Citizen complaint creation with multiple photos (3 photos) & GPS coordinates.
 * 3. Both 'photos' array and 'photoPreview' are populated correctly.
 * 4. Stored coordinates (latitude & longitude) are numbers and match submitted data.
 * 5. Public sanitized tracking returns photos, coordinates, and protects citizen private phone.
 * 6. Admin retrieves complete complaint record with all photos, coordinates, and citizen phone.
 * 7. Admin assigns worker W-104 (Anita Desai) for Water & Drainage complaint.
 * 8. Assigned worker W-104 retrieves complete task record with all photos and coordinates.
 * 9. Worker W-101 (Ramesh Kumar) is blocked from accessing W-104's task with 403 Forbidden.
 * 10. Worker W-104 updates status to Resolved with distinct resolution notes and resolution photo.
 * 11. Reported photos are preserved and not overwritten by the resolution photo.
 */

const http = require('http');
const assert = require('assert');
const app = require('../server');

const TEST_PORT = 5097;
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
  server = app.listen(TEST_PORT);
  console.log('Running Map & Multi-Photo Verification Suite on port', TEST_PORT);

  try {
    // 1. Submit complaint with 1 photo & GPS coordinates
    const singlePhotoSample = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiPjxyZWN0IHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0icmVkIi8+PC9zdmc+';
    const singleRes = await request('/api/complaints', {
      method: 'POST',
      body: {
        category: 'Streetlights',
        location: '15th Cross, 2nd Main, Ward 8',
        description: 'Single photo lamp test',
        photoPreview: singlePhotoSample,
        latitude: 12.9810,
        longitude: 77.5890,
      },
    });

    assert.strictEqual(singleRes.status, 201, 'Single photo complaint created');
    assert.strictEqual(singleRes.data.complaint.latitude, 12.9810, 'Lat stored');
    assert.strictEqual(singleRes.data.complaint.longitude, 77.5890, 'Lng stored');
    assert.strictEqual(singleRes.data.complaint.photos.length, 1, 'Photos array has 1 item');
    console.log('✓ PASS 1: Single photo & GPS complaint created successfully');

    // 2. Submit complaint with 3 photos & GPS coordinates
    const photo1 = 'data:image/svg+xml;base64,PHN2Zz48Y2lyY2xlIHI9IjUiLz48L3N2Zz4=';
    const photo2 = 'data:image/svg+xml;base64,PHN2Zz48cmVjdCB3PSI1IiBoPSI1Ii8+PC9zdmc+';
    const photo3 = 'data:image/svg+xml;base64,PHN2Zz48bGluZSB4MT0iMCIgeTI9IjUiLz48L3N2Zz4=';

    const multiRes = await request('/api/complaints', {
      method: 'POST',
      body: {
        category: 'Water & Drainage',
        location: 'Opposite Community Hall, 7th Sector, Ward 4',
        description: 'Main drainage overflow with 3 photographic proofs',
        citizenName: 'Deepak Sharma',
        citizenPhone: '+91 98888 12345',
        photos: [photo1, photo2, photo3],
        latitude: 12.9654,
        longitude: 77.6123,
      },
    });

    assert.strictEqual(multiRes.status, 201, 'Multi photo complaint created');
    const createdRefId = multiRes.data.referenceId;
    const createdId = multiRes.data.complaint.id;
    assert.strictEqual(multiRes.data.complaint.photos.length, 3, 'All 3 photos saved in complaint');
    assert.strictEqual(multiRes.data.complaint.photoPreview, photo1, 'First photo is set as photoPreview for backward compat');
    assert.strictEqual(multiRes.data.complaint.latitude, 12.9654, 'Coordinates latitude matched');
    assert.strictEqual(multiRes.data.complaint.longitude, 77.6123, 'Coordinates longitude matched');
    console.log('✓ PASS 2: Multi-photo (3 photos) & GPS complaint created successfully:', createdRefId);

    // 3. Citizen Public Tracking
    const trackRes = await request(`/api/complaints/${createdRefId}`);
    assert.strictEqual(trackRes.status, 200);
    assert.strictEqual(trackRes.data.complaint.photos.length, 3, 'Citizen tracking shows all 3 photos');
    assert.strictEqual(trackRes.data.complaint.latitude, 12.9654, 'Citizen tracking shows latitude');
    assert.strictEqual(trackRes.data.complaint.longitude, 77.6123, 'Citizen tracking shows longitude');
    assert.strictEqual(trackRes.data.complaint.citizenPhone, undefined, 'Citizen phone is protected in public tracking');
    console.log('✓ PASS 3: Public tracking includes photos & map coords, protects private citizen data');

    // 4. Admin Login & Access
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'admin123' },
    });
    const adminToken = adminLogin.data.token;

    const adminView = await request(`/api/complaints/${createdId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(adminView.status, 200);
    assert.strictEqual(adminView.data.complaint.photos.length, 3, 'Admin sees all 3 photos');
    assert.strictEqual(adminView.data.complaint.latitude, 12.9654, 'Admin sees latitude');
    assert.strictEqual(adminView.data.complaint.citizenPhone, '+91 98888 12345', 'Admin authorized to see citizen phone');
    console.log('✓ PASS 4: Admin authorized to view complete complaint dossier with all photos & map coords');

    // 5. Admin Assigns to Worker W-104 (Anita Desai)
    const assignRes = await request(`/api/complaints/${createdId}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { workerId: 'w-104', expectedCompletionDate: '2026-11-20' },
    });
    assert.strictEqual(assignRes.status, 200);
    assert.strictEqual(assignRes.data.complaint.assignedWorkerName, 'Anita Desai');
    assert.strictEqual(assignRes.data.complaint.status, 'In Progress');
    console.log('✓ PASS 5: Admin successfully dispatched complaint to Worker Anita Desai (W-104)');

    // 6. Worker W-104 Login & Task View
    const worker104Login = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'worker104', password: 'worker123' },
    });
    const worker104Token = worker104Login.data.token;

    const worker104View = await request(`/api/complaints/${createdId}`, {
      headers: { Authorization: `Bearer ${worker104Token}` },
    });
    assert.strictEqual(worker104View.status, 200);
    assert.strictEqual(worker104View.data.complaint.photos.length, 3, 'Worker sees all 3 complaint photos');
    assert.strictEqual(worker104View.data.complaint.latitude, 12.9654, 'Worker sees exact latitude for field navigation');
    assert.strictEqual(worker104View.data.complaint.longitude, 77.6123, 'Worker sees exact longitude');
    console.log('✓ PASS 6: Assigned Worker W-104 views all photos & map coordinates');

    // 7. Cross-Worker Isolation: Worker W-101 (Ramesh Kumar) must be blocked (403 Forbidden)
    const worker101Login = await request('/api/auth/login', {
      method: 'POST',
      body: { username: 'worker101', password: 'worker123' },
    });
    const worker101Token = worker101Login.data.token;

    const worker101Blocked = await request(`/api/complaints/${createdId}`, {
      headers: { Authorization: `Bearer ${worker101Token}` },
    });
    assert.strictEqual(worker101Blocked.status, 403, 'Unassigned worker blocked with 403 Forbidden');
    console.log('✓ PASS 7: RBAC Isolation confirmed — Unassigned Worker W-101 blocked with 403 Forbidden');

    // 8. Worker W-104 updates status with resolution photo
    const repairPhotoProof = 'data:image/svg+xml;base64,PHN2Zz48dGV4dD5SRVBBSVJFRDwvdGV4dD48L3N2Zz4=';
    const updateRes = await request(`/api/complaints/${createdId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${worker104Token}` },
      body: {
        status: 'Resolved',
        resolutionNotes: 'Culvert cleared of gravel and flow restored normal.',
        resolutionPhoto: repairPhotoProof,
      },
    });
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.data.complaint.status, 'Resolved');
    assert.strictEqual(updateRes.data.complaint.resolutionPhoto, repairPhotoProof, 'Resolution photo saved');
    assert.strictEqual(updateRes.data.complaint.photos.length, 3, 'Original 3 complaint photos remain intact and not overwritten');
    console.log('✓ PASS 8: Worker resolved task with distinct resolution photo; original complaint photos preserved intact');

    console.log('\n======================================================');
    console.log('ALL MAP & MULTI-PHOTO VERIFICATION TESTS PASSED (8/8)');
    console.log('======================================================');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  if (server) server.close();
  process.exit(1);
});

