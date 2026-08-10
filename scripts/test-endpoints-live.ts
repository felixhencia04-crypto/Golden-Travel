import dotenv from 'dotenv';
dotenv.config();

import request from 'supertest';
import express from 'express';
import { db } from '../src/db/index.js';
import * as schema from '../src/db/schema.js';
import { eq, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'golden-travel-super-secret-key-2026';

console.log("=== LIVE SUPERTEST ENDPOINT & INTEGRATION VERIFICATION ===");

async function runLiveEndpointTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Setup mock workspace & users in database
    const workspaceAId = '206247ec-7f3b-4e74-8dc6-b109372dbbef';
    const workspaceBId = 'a1111111-2222-3333-4444-555555555555';

    // Ensure Workspace B
    let wsB = await db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, workspaceBId) });
    if (!wsB) {
      await db.insert(schema.workspaces).values({
        id: workspaceBId,
        name: 'Workspace Test B',
        slug: 'workspace-test-b'
      });
    }

    // Admin user in Workspace A
    let adminUserA = await db.query.users.findFirst({ where: eq(schema.users.email, 'admin.test.a@example.com') });
    if (!adminUserA) {
      const [u] = await db.insert(schema.users).values({
        email: 'admin.test.a@example.com',
        name: 'Admin A',
        role: 'admin',
        workspaceId: workspaceAId
      }).returning();
      adminUserA = u;
    }

    // Admin user in Workspace B
    let adminUserB = await db.query.users.findFirst({ where: eq(schema.users.email, 'admin.test.b@example.com') });
    if (!adminUserB) {
      const [u] = await db.insert(schema.users).values({
        email: 'admin.test.b@example.com',
        name: 'Admin B',
        role: 'admin',
        workspaceId: workspaceBId
      }).returning();
      adminUserB = u;
    }

    // Package A
    let pkgA = await db.query.packages.findFirst({ where: eq(schema.packages.workspaceId, workspaceAId) });
    if (!pkgA) {
      const [p] = await db.insert(schema.packages).values({
        workspaceId: workspaceAId,
        name: 'Package Test A',
        description: 'Desc A',
        duration: '9 hari',
        price: '10000000'
      }).returning();
      pkgA = p;
    }

    // Package B
    let pkgB = await db.query.packages.findFirst({ where: eq(schema.packages.workspaceId, workspaceBId) });
    if (!pkgB) {
      const [p] = await db.insert(schema.packages).values({
        workspaceId: workspaceBId,
        name: 'Package Test B',
        description: 'Desc B',
        duration: '9 hari',
        price: '10000000'
      }).returning();
      pkgB = p;
    }

    // Registration A (Workspace A)
    let regA = await db.query.registrations.findFirst({ where: eq(schema.registrations.ordererNotes, 'SUPERTEST-REG-A') });
    if (!regA) {
      const [r] = await db.insert(schema.registrations).values({
        workspaceId: workspaceAId,
        userId: adminUserA.id,
        packageId: pkgA.id,
        ordererName: 'Jamaah Live A',
        ordererNotes: 'SUPERTEST-REG-A',
        ordererEmail: 'jamaah.live.a@example.com',
        paxData: [{ id: 'PAX-LIVE-A', fullName: 'Jamaah Live A' }]
      }).returning();
      regA = r;
    }

    // Registration B (Workspace B)
    let regB = await db.query.registrations.findFirst({ where: eq(schema.registrations.ordererNotes, 'SUPERTEST-REG-B') });
    if (!regB) {
      const [r] = await db.insert(schema.registrations).values({
        workspaceId: workspaceBId,
        userId: adminUserB.id,
        packageId: pkgB.id,
        ordererName: 'Jamaah Live B',
        ordererNotes: 'SUPERTEST-REG-B',
        ordererEmail: 'jamaah.live.b@example.com',
        paxData: [{ id: 'PAX-LIVE-B', fullName: 'Jamaah Live B' }]
      }).returning();
      regB = r;
    }

    // Create JWT tokens
    const adminTokenA = jwt.sign({ id: adminUserA.id, role: adminUserA.role, workspaceId: workspaceAId }, JWT_SECRET, { expiresIn: '1h' });
    const adminTokenB = jwt.sign({ id: adminUserB.id, role: adminUserB.role, workspaceId: workspaceBId }, JWT_SECRET, { expiresIn: '1h' });

    console.log("--> Test Data & JWT Tokens Initialized Successfully.");

    // Sample Base64 PDF
    const samplePdfBase64 = 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjEgMCBvYmoKPDwvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFI+PgplbmRvYmoKMgowIG9iagogPDwvVHlwZSAvUGFnZXMgL0NvdW50IDEgL0tpZHMgWyAzIDAgUiBdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9NZWRpYUJveCBbMCAwIDYxMiA3OTJdPj4KZW5kb2JqCnhyZWYKMCA0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDA0MDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDY4IDAwMDAwIG4gCjAwMDAwMDAxMjUgMDA0MDAgbiAKdHJhaWxlcgA8PC9TaXplIDQvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgoxNzQKJSVFT0Y=';

    // 2. Perform HTTP endpoint tests using Supertest against local server
    const serverUrl = 'http://localhost:3000';

    // Test 1: POST /api/admin/certificates with valid registration ID in same workspace
    const res1 = await request(serverUrl)
      .post('/api/admin/certificates')
      .set('Authorization', `Bearer ${adminTokenA}`)
      .send({
        registrationId: regA.id,
        recipientName: 'Jamaah Live A',
        certificateUrl: samplePdfBase64
      });

    assert(res1.status === 201 && res1.body?.id && res1.body?.registrationId === regA.id,
      "Endpoint Test 1: POST /api/admin/certificates returns 201 Created with valid cert object",
      `Status: ${res1.status}, Body: ${JSON.stringify(res1.body)}`);

    const createdCertId = res1.body?.id;

    // Test 2: POST /api/admin/certificates with cross-workspace registration (Admin A requesting Reg B)
    const res2 = await request(serverUrl)
      .post('/api/admin/certificates')
      .set('Authorization', `Bearer ${adminTokenA}`)
      .send({
        registrationId: regB.id,
        recipientName: 'Jamaah Live B',
        certificateUrl: samplePdfBase64
      });

    assert(res2.status === 404 || res2.status === 403,
      "Endpoint Test 2: Cross-workspace registration POST is rejected (403/404)",
      `Status: ${res2.status}, Body: ${JSON.stringify(res2.body)}`);

    // Test 3: POST /api/admin/certificates with missing registrationId
    const res3 = await request(serverUrl)
      .post('/api/admin/certificates')
      .set('Authorization', `Bearer ${adminTokenA}`)
      .send({
        recipientName: 'No Reg ID',
        certificateUrl: samplePdfBase64
      });

    assert(res3.status === 400,
      "Endpoint Test 3: Missing registrationId returns 400 Bad Request",
      `Status: ${res3.status}, Body: ${JSON.stringify(res3.body)}`);

    // Test 4: POST /api/admin/certificates with empty/whitespace registrationId
    const res4 = await request(serverUrl)
      .post('/api/admin/certificates')
      .set('Authorization', `Bearer ${adminTokenA}`)
      .send({
        registrationId: '   ',
        recipientName: 'Space Reg ID',
        certificateUrl: samplePdfBase64
      });

    assert(res4.status === 400,
      "Endpoint Test 4: Whitespace registrationId returns 400 Bad Request",
      `Status: ${res4.status}, Body: ${JSON.stringify(res4.body)}`);

    // Test 5: GET /api/certificates/:id/file with invalid UUID format
    const res5 = await request(serverUrl)
      .get('/api/certificates/invalid-uuid-syntax/file');

    assert(res5.status === 400,
      "Endpoint Test 5: GET certificate file with invalid UUID format returns 400 Bad Request",
      `Status: ${res5.status}`);

    // Test 6: GET /api/certificates/:id/file with valid created cert ID
    if (createdCertId) {
      const res6 = await request(serverUrl)
        .get(`/api/certificates/${createdCertId}/file`);

      assert(res6.status === 200,
        "Endpoint Test 6: GET certificate file for valid cert returns 200 OK",
        `Status: ${res6.status}`);
    }

    // Test 7: DELETE /api/admin/certificates/:id
    if (createdCertId) {
      const res7 = await request(serverUrl)
        .delete(`/api/admin/certificates/${createdCertId}`)
        .set('Authorization', `Bearer ${adminTokenA}`);

      assert(res7.status === 200 && res7.body?.success === true,
        "Endpoint Test 7: DELETE certificate returns 200 OK",
        `Status: ${res7.status}`);
    }

  } catch (err: any) {
    console.error("FATAL SUPERTEST ERROR:", err);
    failed++;
  }

  console.log(`\n=== SUPERTEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runLiveEndpointTests();
