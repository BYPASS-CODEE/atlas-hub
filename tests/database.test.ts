import { test, describe } from 'node:test';
import assert from 'node:assert';
import { DatabaseSync } from 'node:sqlite';

describe('Relational Database Schema & Foreign Key Constraints', () => {
  test('should enforce foreign key constraints and relations in in-memory test db', () => {
    const testDb = new DatabaseSync(':memory:');
    testDb.exec('PRAGMA foreign_keys = ON;');

    testDb.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL
      );

      CREATE TABLE organizations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT
      );

      CREATE TABLE clients (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        company_name TEXT NOT NULL,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
      );

      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        client_id TEXT,
        name TEXT NOT NULL,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
      );
    `);

    // 1. Insert user and org
    testDb.prepare('INSERT INTO users (id, email, full_name) VALUES (?, ?, ?)').run('u1', 'test@atlashub.io', 'Ali Rezaei');
    testDb.prepare('INSERT INTO organizations (id, name, owner_id) VALUES (?, ?, ?)').run('o1', 'Artam Digital', 'u1');

    // 2. Insert client
    testDb.prepare('INSERT INTO clients (id, organization_id, company_name) VALUES (?, ?, ?)').run('c1', 'o1', 'Client Corp');

    // 3. Insert project
    testDb.prepare('INSERT INTO projects (id, organization_id, client_id, name) VALUES (?, ?, ?, ?)').run('p1', 'o1', 'c1', 'Portal Redesign');

    // Verify insertion
    const proj = testDb.prepare('SELECT * FROM projects WHERE id = ?').get('p1') as any;
    assert.strictEqual(proj.name, 'Portal Redesign');
    assert.strictEqual(proj.client_id, 'c1');

    // 4. Test Foreign Key constraint violation
    assert.throws(() => {
      testDb.prepare('INSERT INTO clients (id, organization_id, company_name) VALUES (?, ?, ?)').run('c2', 'non-existent-org', 'Bad Client');
    }, /FOREIGN KEY constraint failed/);

    // 5. Test ON DELETE SET NULL
    testDb.prepare('DELETE FROM clients WHERE id = ?').run('c1');
    const updatedProj = testDb.prepare('SELECT * FROM projects WHERE id = ?').get('p1') as any;
    assert.strictEqual(updatedProj.client_id, null);
  });
});
