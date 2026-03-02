const Database = require('better-sqlite3');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const { migrate } = require('drizzle-orm/better-sqlite3/migrator');
const path = require('path');
const fs = require('fs');
const { projects, rfis, equipment, cost_codes, audit_log, drawing_sets, drawing_sheets, notifications } = require('../../packages/db/schema');

let db = null;
let sqliteDb = null;

function initDatabase(userDataPath) {
  const dbPath = path.join(userDataPath, 'steelbuild.db');
  const dbDir = path.dirname(dbPath);
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');
  
  db = drizzle(sqliteDb, {
    schema: { projects, rfis, equipment, cost_codes, audit_log, drawing_sets, drawing_sheets, notifications }
  });
  
  createTablesIfNotExists();
  
  return { success: true, path: dbPath };
}

function createTablesIfNotExists() {
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      project_number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      description TEXT,
      start_date TEXT,
      end_date TEXT,
      client_name TEXT,
      location TEXT,
      original_contract_value REAL NOT NULL DEFAULT 0,
      current_contract_value REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      updated_by TEXT,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS rfis (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      rfi_number INTEGER NOT NULL,
      subject TEXT NOT NULL,
      question TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT DEFAULT 'medium',
      assigned_to TEXT,
      due_date TEXT,
      response TEXT,
      responded_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      updated_by TEXT,
      deleted_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(project_id, rfi_number)
    );
    
    CREATE INDEX IF NOT EXISTS idx_rfis_project ON rfis(project_id);
    CREATE INDEX IF NOT EXISTS idx_rfis_status ON rfis(status);
    CREATE INDEX IF NOT EXISTS idx_rfis_created ON rfis(created_at);

    CREATE TABLE IF NOT EXISTS equipment (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      asset_tag TEXT,
      status TEXT NOT NULL DEFAULT 'available',
      assigned_to TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      updated_by TEXT,
      deleted_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cost_codes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      code TEXT NOT NULL,
      description TEXT NOT NULL,
      budget_amount REAL NOT NULL DEFAULT 0,
      actual_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      category TEXT,
      task_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      updated_by TEXT,
      deleted_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(project_id, code)
    );
    
    CREATE INDEX IF NOT EXISTS idx_cost_codes_project ON cost_codes(project_id);
    CREATE INDEX IF NOT EXISTS idx_cost_codes_code ON cost_codes(project_id, code);

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      baseline_start_date TEXT,
      baseline_end_date TEXT,
      status TEXT NOT NULL DEFAULT 'not-started',
      percent_complete REAL NOT NULL DEFAULT 0,
      cost_code_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      updated_by TEXT,
      deleted_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (cost_code_id) REFERENCES cost_codes(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS pma_insights (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      severity TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      details TEXT NOT NULL,
      entity_refs_json TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT,
      resolved_by TEXT,
      dismissed_at TEXT,
      dismissed_by TEXT,
      dismiss_reason TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      payload_json TEXT,
      user_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS drawing_sets (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'IFA',
      discipline TEXT,
      set_number TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      updated_by TEXT,
      deleted_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_drawing_sets_project ON drawing_sets(project_id);
    CREATE INDEX IF NOT EXISTS idx_drawing_sets_status ON drawing_sets(status);

    CREATE TABLE IF NOT EXISTS drawing_sheets (
      id TEXT PRIMARY KEY,
      set_id TEXT NOT NULL,
      sheet_no TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'IFA',
      revision TEXT DEFAULT 'A',
      file_key TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      updated_by TEXT,
      deleted_at TEXT,
      FOREIGN KEY (set_id) REFERENCES drawing_sets(id) ON DELETE CASCADE,
      UNIQUE(set_id, sheet_no, revision)
    );
    
    CREATE INDEX IF NOT EXISTS idx_drawing_sheets_set ON drawing_sheets(set_id);
    CREATE INDEX IF NOT EXISTS idx_drawing_sheets_status ON drawing_sheets(status);

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      entity_refs_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      read_at TEXT,
      user_id TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS change_orders (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      number TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      requested_by TEXT NOT NULL,
      requested_date TEXT NOT NULL,
      approved_date TEXT,
      line_items_json TEXT NOT NULL DEFAULT '[]',
      total REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      updated_by TEXT,
      deleted_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(project_id, number)
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      contract_number TEXT NOT NULL,
      title TEXT NOT NULL,
      contract_type TEXT NOT NULL DEFAULT 'lump-sum',
      value REAL NOT NULL DEFAULT 0,
      signed_date TEXT NOT NULL,
      start_date TEXT NOT NULL,
      completion_date TEXT,
      retainage REAL NOT NULL DEFAULT 10,
      terms TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      updated_by TEXT,
      deleted_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(project_id, contract_number)
    );

    CREATE INDEX IF NOT EXISTS idx_rfis_project_id ON rfis(project_id);
    CREATE INDEX IF NOT EXISTS idx_equipment_project_id ON equipment(project_id);
    CREATE INDEX IF NOT EXISTS idx_cost_codes_project_id ON cost_codes(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_task_cost_code ON tasks(cost_code_id);
    CREATE INDEX IF NOT EXISTS idx_pma_insights_project_id ON pma_insights(project_id);
    CREATE INDEX IF NOT EXISTS idx_pma_insights_status ON pma_insights(status);
    CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_drawing_sets_project_id ON drawing_sets(project_id);
    CREATE INDEX IF NOT EXISTS idx_drawing_sets_status ON drawing_sets(status);
    CREATE INDEX IF NOT EXISTS idx_drawing_sheets_set_id ON drawing_sheets(set_id);
    CREATE INDEX IF NOT EXISTS idx_drawing_sheets_status ON drawing_sheets(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_project_id ON notifications(project_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
    CREATE INDEX IF NOT EXISTS idx_change_orders_project_id ON change_orders(project_id);
    CREATE INDEX IF NOT EXISTS idx_change_orders_status ON change_orders(status);
    CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON contracts(project_id);
  `);
  
  migrateSchema();
}

function migrateSchema() {
  try {
    const columns = sqliteDb.prepare("PRAGMA table_info(projects)").all();
    const hasOriginalContractValue = columns.some(col => col.name === 'original_contract_value');
    const hasCurrentContractValue = columns.some(col => col.name === 'current_contract_value');
    
    if (!hasOriginalContractValue) {
      sqliteDb.exec('ALTER TABLE projects ADD COLUMN original_contract_value REAL NOT NULL DEFAULT 0');
      console.log('Added original_contract_value column to projects table');
    }
    
    if (!hasCurrentContractValue) {
      sqliteDb.exec('ALTER TABLE projects ADD COLUMN current_contract_value REAL NOT NULL DEFAULT 0');
      console.log('Added current_contract_value column to projects table');
    }
  } catch (error) {
    console.error('Schema migration error:', error);
  }
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return db;
}

function getSQLiteDB() {
  if (!sqliteDb) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return sqliteDb;
}

function closeDatabase() {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
    db = null;
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  getSQLiteDB,
  closeDatabase,
};
