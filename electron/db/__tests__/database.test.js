const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const Database = require('better-sqlite3');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const TEST_DB_PATH = path.join(__dirname, 'test.db');

let db;
let sqliteDb;

function initTestDB() {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
  
  sqliteDb = new Database(TEST_DB_PATH);
  sqliteDb.pragma('foreign_keys = ON');
  
  sqliteDb.exec(`
    CREATE TABLE projects (
      id TEXT PRIMARY KEY,
      project_number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE rfis (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      rfi_number INTEGER NOT NULL,
      subject TEXT NOT NULL,
      question TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(project_id, rfi_number)
    );

    CREATE TABLE cost_codes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      code TEXT NOT NULL,
      description TEXT NOT NULL,
      budget_amount REAL NOT NULL DEFAULT 0,
      actual_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(project_id, code)
    );
  `);
  
  return sqliteDb;
}

function closeTestDB() {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
}

describe('RFI Numbering Logic', () => {
  beforeEach(() => {
    db = initTestDB();
  });

  afterEach(() => {
    closeTestDB();
  });

  it('should auto-assign RFI number 1 for first RFI in project', () => {
    const projectId = uuidv4();
    db.prepare('INSERT INTO projects (id, project_number, name) VALUES (?, ?, ?)').run(
      projectId,
      'PRJ-001',
      'Test Project'
    );

    const maxRfi = db.prepare(`
      SELECT MAX(rfi_number) as maxNum 
      FROM rfis 
      WHERE project_id = ? AND deleted_at IS NULL
    `).get(projectId);
    
    const nextNumber = (maxRfi?.maxNum || 0) + 1;
    expect(nextNumber).toBe(1);
  });

  it('should increment RFI numbers sequentially per project', () => {
    const projectId = uuidv4();
    db.prepare('INSERT INTO projects (id, project_number, name) VALUES (?, ?, ?)').run(
      projectId,
      'PRJ-001',
      'Test Project'
    );

    db.prepare(`
      INSERT INTO rfis (id, project_id, rfi_number, subject, question) 
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), projectId, 1, 'First RFI', 'Question 1');

    db.prepare(`
      INSERT INTO rfis (id, project_id, rfi_number, subject, question) 
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), projectId, 2, 'Second RFI', 'Question 2');

    const maxRfi = db.prepare(`
      SELECT MAX(rfi_number) as maxNum 
      FROM rfis 
      WHERE project_id = ? AND deleted_at IS NULL
    `).get(projectId);
    
    const nextNumber = (maxRfi?.maxNum || 0) + 1;
    expect(nextNumber).toBe(3);
  });

  it('should maintain separate RFI numbering per project', () => {
    const project1Id = uuidv4();
    const project2Id = uuidv4();
    
    db.prepare('INSERT INTO projects (id, project_number, name) VALUES (?, ?, ?)').run(
      project1Id,
      'PRJ-001',
      'Project 1'
    );
    db.prepare('INSERT INTO projects (id, project_number, name) VALUES (?, ?, ?)').run(
      project2Id,
      'PRJ-002',
      'Project 2'
    );

    db.prepare(`
      INSERT INTO rfis (id, project_id, rfi_number, subject, question) 
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), project1Id, 1, 'Project 1 RFI', 'Question');

    db.prepare(`
      INSERT INTO rfis (id, project_id, rfi_number, subject, question) 
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), project2Id, 1, 'Project 2 RFI', 'Question');

    const project1Rfis = db.prepare(`
      SELECT COUNT(*) as count FROM rfis WHERE project_id = ? AND deleted_at IS NULL
    `).get(project1Id);
    
    const project2Rfis = db.prepare(`
      SELECT COUNT(*) as count FROM rfis WHERE project_id = ? AND deleted_at IS NULL
    `).get(project2Id);

    expect(project1Rfis.count).toBe(1);
    expect(project2Rfis.count).toBe(1);
  });

  it('should skip deleted RFI numbers when calculating next number', () => {
    const projectId = uuidv4();
    db.prepare('INSERT INTO projects (id, project_number, name) VALUES (?, ?, ?)').run(
      projectId,
      'PRJ-001',
      'Test Project'
    );

    const rfi1Id = uuidv4();
    db.prepare(`
      INSERT INTO rfis (id, project_id, rfi_number, subject, question) 
      VALUES (?, ?, ?, ?, ?)
    `).run(rfi1Id, projectId, 1, 'First RFI', 'Question 1');

    db.prepare(`
      INSERT INTO rfis (id, project_id, rfi_number, subject, question) 
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), projectId, 2, 'Second RFI', 'Question 2');

    db.prepare('UPDATE rfis SET deleted_at = ? WHERE id = ?').run(
      new Date().toISOString(),
      rfi1Id
    );

    const maxRfi = db.prepare(`
      SELECT MAX(rfi_number) as maxNum 
      FROM rfis 
      WHERE project_id = ? AND deleted_at IS NULL
    `).get(projectId);
    
    const nextNumber = (maxRfi?.maxNum || 0) + 1;
    expect(nextNumber).toBe(3);
  });
});

describe('Uniqueness Enforcement', () => {
  beforeEach(() => {
    db = initTestDB();
  });

  afterEach(() => {
    closeTestDB();
  });

  it('should enforce unique (project_id, rfi_number) constraint', () => {
    const projectId = uuidv4();
    db.prepare('INSERT INTO projects (id, project_number, name) VALUES (?, ?, ?)').run(
      projectId,
      'PRJ-001',
      'Test Project'
    );

    db.prepare(`
      INSERT INTO rfis (id, project_id, rfi_number, subject, question) 
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), projectId, 1, 'First RFI', 'Question 1');

    expect(() => {
      db.prepare(`
        INSERT INTO rfis (id, project_id, rfi_number, subject, question) 
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), projectId, 1, 'Duplicate RFI', 'Question 2');
    }).toThrow();
  });

  it('should enforce unique (project_id, code) constraint for cost codes', () => {
    const projectId = uuidv4();
    db.prepare('INSERT INTO projects (id, project_number, name) VALUES (?, ?, ?)').run(
      projectId,
      'PRJ-001',
      'Test Project'
    );

    db.prepare(`
      INSERT INTO cost_codes (id, project_id, code, description) 
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), projectId, 'CC-001', 'Labor');

    expect(() => {
      db.prepare(`
        INSERT INTO cost_codes (id, project_id, code, description) 
        VALUES (?, ?, ?, ?)
      `).run(uuidv4(), projectId, 'CC-001', 'Duplicate Code');
    }).toThrow();
  });

  it('should allow same cost code in different projects', () => {
    const project1Id = uuidv4();
    const project2Id = uuidv4();
    
    db.prepare('INSERT INTO projects (id, project_number, name) VALUES (?, ?, ?)').run(
      project1Id,
      'PRJ-001',
      'Project 1'
    );
    db.prepare('INSERT INTO projects (id, project_number, name) VALUES (?, ?, ?)').run(
      project2Id,
      'PRJ-002',
      'Project 2'
    );

    db.prepare(`
      INSERT INTO cost_codes (id, project_id, code, description) 
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), project1Id, 'CC-001', 'Labor Project 1');

    expect(() => {
      db.prepare(`
        INSERT INTO cost_codes (id, project_id, code, description) 
        VALUES (?, ?, ?, ?)
      `).run(uuidv4(), project2Id, 'CC-001', 'Labor Project 2');
    }).not.toThrow();
  });

  it('should enforce unique project_number constraint', () => {
    db.prepare('INSERT INTO projects (id, project_number, name) VALUES (?, ?, ?)').run(
      uuidv4(),
      'PRJ-001',
      'Project 1'
    );

    expect(() => {
      db.prepare('INSERT INTO projects (id, project_number, name) VALUES (?, ?, ?)').run(
        uuidv4(),
        'PRJ-001',
        'Project 2'
      );
    }).toThrow();
  });
});

module.exports = { initTestDB, closeTestDB };
