const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');

// Inicializar la aplicación Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Crear la carpeta uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurar almacenamiento para archivos subidos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

// Inicializar la base de datos SQLite
const dbPath = path.join(__dirname, 'kustoc.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos SQLite:', err.message);
  } else {
    console.log('Conexión establecida con la base de datos SQLite');
    setupDatabase();
  }
});

// Configurar la base de datos con todas las tablas necesarias
function setupDatabase() {
  db.serialize(() => {
    // Tabla de Clientes
    db.run(`CREATE TABLE IF NOT EXISTS clients (
      client_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      sector TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      address TEXT,
      website TEXT,
      tax_id TEXT NOT NULL,
      secondary_contact TEXT,
      secondary_email TEXT,
      contact_notes TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_interaction TEXT
    )`);

    // Tabla de Interacciones
    db.run(`CREATE TABLE IF NOT EXISTS interactions (
      interaction_id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      interaction_date TEXT NOT NULL,
      interaction_type TEXT NOT NULL,
      interaction_summary TEXT,
      interaction_files TEXT,
      FOREIGN KEY (client_id) REFERENCES clients (client_id)
    )`);

    // Tabla de Jumps
    db.run(`CREATE TABLE IF NOT EXISTS jumps (
      jump_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      sector TEXT NOT NULL,
      base_price REAL NOT NULL,
      features TEXT,
      technical_requirements TEXT,
      scalable_modules TEXT,
      images TEXT,
      demo_video TEXT,
      use_cases TEXT,
      status TEXT NOT NULL
    )`);

    // Tabla de Relación Jump-Cliente
    db.run(`CREATE TABLE IF NOT EXISTS jump_clients (
      jump_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      PRIMARY KEY (jump_id, client_id),
      FOREIGN KEY (jump_id) REFERENCES jumps (jump_id),
      FOREIGN KEY (client_id) REFERENCES clients (client_id)
    )`);

    // Tabla de Facturas
    db.run(`CREATE TABLE IF NOT EXISTS invoices (
      invoice_id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      tax REAL NOT NULL,
      total REAL NOT NULL,
      billing_name TEXT NOT NULL,
      billing_tax_id TEXT NOT NULL,
      billing_address TEXT,
      billing_email TEXT,
      payment_method TEXT,
      payment_status TEXT NOT NULL,
      payment_reference TEXT,
      status TEXT NOT NULL,
      project_id TEXT,
      FOREIGN KEY (client_id) REFERENCES clients (client_id),
      FOREIGN KEY (project_id) REFERENCES projects (project_id)
    )`);

    // Tabla de Items de Factura
    db.run(`CREATE TABLE IF NOT EXISTS invoice_items (
      item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices (invoice_id)
    )`);

    // Tabla de Claves API
    db.run(`CREATE TABLE IF NOT EXISTS api_keys (
      api_key_id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      jump_id TEXT NOT NULL,
      service TEXT NOT NULL,
      api_key TEXT NOT NULL,
      api_secret TEXT,
      access_token TEXT,
      expiration_date TEXT,
      callback_url TEXT,
      scopes TEXT,
      instructions TEXT,
      connection_status TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients (client_id),
      FOREIGN KEY (jump_id) REFERENCES jumps (jump_id)
    )`);

    // Tabla de Enlaces de Referidos
    db.run(`CREATE TABLE IF NOT EXISTS referrals (
      referral_id TEXT PRIMARY KEY,
      program_name TEXT NOT NULL,
      referral_url TEXT NOT NULL,
      platform TEXT NOT NULL,
      commission TEXT NOT NULL,
      clicks INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      earnings REAL DEFAULT 0,
      created_at TEXT NOT NULL,
      referral_code TEXT,
      distribution_channels TEXT,
      notes TEXT,
      status TEXT NOT NULL,
      client_id TEXT,
      FOREIGN KEY (client_id) REFERENCES clients (client_id)
    )`);

    // Tabla de Copilotos
    db.run(`CREATE TABLE IF NOT EXISTS copilots (
      copilot_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      skills TEXT,
      availability INTEGER NOT NULL,
      total_hours_worked REAL DEFAULT 0
    )`);

    // Tabla de Proyectos
    db.run(`CREATE TABLE IF NOT EXISTS projects (
      project_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client_id TEXT NOT NULL,
      jump_id TEXT NOT NULL,
      start_date TEXT NOT NULL,
      estimated_end_date TEXT,
      status TEXT NOT NULL,
      contracted_hours REAL NOT NULL,
      consumed_hours REAL DEFAULT 0,
      files TEXT,
      notifications TEXT,
      client_portal_url TEXT,
      client_comments TEXT,
      FOREIGN KEY (client_id) REFERENCES clients (client_id),
      FOREIGN KEY (jump_id) REFERENCES jumps (jump_id)
    )`);

    // Tabla de Tareas
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      task_id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      estimated_hours REAL,
      completed_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects (project_id)
    )`);

    // Tabla de Relación Tarea-Copiloto
    db.run(`CREATE TABLE IF NOT EXISTS task_copilots (
      task_id TEXT NOT NULL,
      copilot_id TEXT NOT NULL,
      PRIMARY KEY (task_id, copilot_id),
      FOREIGN KEY (task_id) REFERENCES tasks (task_id),
      FOREIGN KEY (copilot_id) REFERENCES copilots (copilot_id)
    )`);

    // Tabla de Relación Proyecto-Copiloto
    db.run(`CREATE TABLE IF NOT EXISTS project_copilots (
      project_id TEXT NOT NULL,
      copilot_id TEXT NOT NULL,
      role TEXT,
      hours_worked REAL DEFAULT 0,
      PRIMARY KEY (project_id, copilot_id),
      FOREIGN KEY (project_id) REFERENCES projects (project_id),
      FOREIGN KEY (copilot_id) REFERENCES copilots (copilot_id)
    )`);

    // Tabla de Relación Proyecto-Clave API
    db.run(`CREATE TABLE IF NOT EXISTS project_api_keys (
      project_id TEXT NOT NULL,
      api_key_id TEXT NOT NULL,
      PRIMARY KEY (project_id, api_key_id),
      FOREIGN KEY (project_id) REFERENCES projects (project_id),
      FOREIGN KEY (api_key_id) REFERENCES api_keys (api_key_id)
    )`);

    // Tabla de Relación Proyecto-Referido
    db.run(`CREATE TABLE IF NOT EXISTS project_referrals (
      project_id TEXT NOT NULL,
      referral_id TEXT NOT NULL,
      PRIMARY KEY (project_id, referral_id),
      FOREIGN KEY (project_id) REFERENCES projects (project_id),
      FOREIGN KEY (referral_id) REFERENCES referrals (referral_id)
    )`);

    console.log('Base de datos configurada correctamente');
  });
}

// Generar un ID único con un prefijo específico y contador incremental
function generateId(prefix, callback) {
  db.get(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='id_counters'`, (err, row) => {
    if (err) {
      console.error(err);
      callback(null);
      return;
    }
    
    if (row.count === 0) {
      db.run(`CREATE TABLE id_counters (prefix TEXT PRIMARY KEY, counter INTEGER)`, (err) => {
        if (err) {
          console.error(err);
          callback(null);
          return;
        }
        insertCounter();
      });
    } else {
      insertCounter();
    }
  });

  function insertCounter() {
    db.get(`SELECT counter FROM id_counters WHERE prefix = ?`, [prefix], (err, row) => {
      if (err) {
        console.error(err);
        callback(null);
        return;
      }
      
      if (!row) {
        db.run(`INSERT INTO id_counters (prefix, counter) VALUES (?, 1)`, [prefix], function(err) {
          if (err) {
            console.error(err);
            callback(null);
            return;
          }
          callback(`${prefix}001`);
        });
      } else {
        const newCounter = row.counter + 1;
        db.run(`UPDATE id_counters SET counter = ? WHERE prefix = ?`, [newCounter, prefix], function(err) {
          if (err) {
            console.error(err);
            callback(null);
            return;
          }
          const paddedCounter = String(newCounter).padStart(3, '0');
          callback(`${prefix}${paddedCounter}`);
        });
      }
    });
  }
}

// ----- RUTAS DE API -----

// ----- Rutas para Clientes -----
app.get('/api/clients', (req, res) => {
  db.all('SELECT * FROM clients ORDER BY name', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/clients/:id', (req, res) => {
  db.get('SELECT * FROM clients WHERE client_id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }
    res.json(row);
  });
});

app.post('/api/clients', (req, res) => {
  const {
    name, company, sector, email, phone, address, website, tax_id,
    secondary_contact, secondary_email, contact_notes, status
  } = req.body;

  if (!name || !company || !sector || !email || !tax_id || !status) {
    res.status(400).json({ error: 'Faltan campos obligatorios' });
    return;
  }

  const created_at = new Date().toISOString();

  generateId('CLI', (client_id) => {
    if (!client_id) {
      res.status(500).json({ error: 'Error al generar ID de cliente' });
      return;
    }

    const client = {
      client_id, name, company, sector, email, phone, address, website, tax_id,
      secondary_contact, secondary_email, contact_notes, status, created_at, last_interaction: created_at
    };

    db.run(`
      INSERT INTO clients (
        client_id, name, company, sector, email, phone, address, website, tax_id,
        secondary_contact, secondary_email, contact_notes, status, created_at, last_interaction
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      client.client_id, client.name, client.company, client.sector, client.email, 
      client.phone, client.address, client.website, client.tax_id,
      client.secondary_contact, client.secondary_email, client.contact_notes, 
      client.status, client.created_at, client.last_interaction
    ], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json(client);
    });
  });
});

app.put('/api/clients/:id', (req, res) => {
  const { 
    name, company, sector, email, phone, address, website, tax_id,
    secondary_contact, secondary_email, contact_notes, status
  } = req.body;

  if (!name || !company || !sector || !email || !tax_id || !status) {
    res.status(400).json({ error: 'Faltan campos obligatorios' });
    return;
  }

  db.run(`
    UPDATE clients SET
      name = ?, company = ?, sector = ?, email = ?, phone = ?,
      address = ?, website = ?, tax_id = ?, secondary_contact = ?,
      secondary_email = ?, contact_notes = ?, status = ?
    WHERE client_id = ?
  `, [
    name, company, sector, email, phone, address, website, tax_id,
    secondary_contact, secondary_email, contact_notes, status, req.params.id
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Cliente no encontrado' });
      return;
    }
    res.json({ 
      client_id: req.params.id, name, company, sector, email, phone, 
      address, website, tax_id, secondary_contact, secondary_email, 
      contact_notes, status
    });
  });
});

// Ruta para agregar una interacción a un cliente
app.post('/api/clients/:clientId/interactions', upload.single('file'), (req, res) => {
  const { clientId } = req.params;
  const { interaction_type, interaction_summary } = req.body;
  const interaction_date = new Date().toISOString();
  let interaction_files = null;

  if (req.file) {
    interaction_files = req.file.filename;
  }

  generateId('INT', (interaction_id) => {
    if (!interaction_id) {
      res.status(500).json({ error: 'Error al generar ID de interacción' });
      return;
    }

    db.run(`
      INSERT INTO interactions (
        interaction_id, client_id, interaction_date, interaction_type,
        interaction_summary, interaction_files
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      interaction_id, clientId, interaction_date, interaction_type,
      interaction_summary, interaction_files
    ], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Actualizar la fecha de última interacción del cliente
      db.run(`
        UPDATE clients SET last_interaction = ? WHERE client_id = ?
      `, [interaction_date, clientId], function(err) {
        if (err) {
          console.error('Error al actualizar la última interacción del cliente:', err);
        }
      });
      
      res.status(201).json({
        interaction_id,
        client_id: clientId,
        interaction_date,
        interaction_type,
        interaction_summary,
        interaction_files
      });
    });
  });
});

// Ruta para obtener todas las interacciones de un cliente
app.get('/api/clients/:clientId/interactions', (req, res) => {
  const { clientId } = req.params;
  
  db.all('SELECT * FROM interactions WHERE client_id = ? ORDER BY interaction_date DESC', [clientId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// ----- Rutas para Jumps -----
app.get('/api/jumps', (req, res) => {
  db.all('SELECT * FROM jumps ORDER BY name', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/jumps/:id', (req, res) => {
  db.get('SELECT * FROM jumps WHERE jump_id = ?', [req.params.id], (err, jump) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!jump) {
      res.status(404).json({ error: 'Jump no encontrado' });
      return;
    }
    
    // Obtener los clientes asociados al Jump
    db.all(`
      SELECT c.client_id, c.name, c.company
      FROM clients c
      JOIN jump_clients jc ON c.client_id = jc.client_id
      WHERE jc.jump_id = ?
    `, [req.params.id], (err, clients) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Parsear arrays almacenados como JSON strings
      const result = {
        ...jump,
        features: jump.features ? JSON.parse(jump.features) : [],
        scalable_modules: jump.scalable_modules ? JSON.parse(jump.scalable_modules) : [],
        images: jump.images ? JSON.parse(jump.images) : [],
        clients: clients
      };
      
      res.json(result);
    });
  });
});

app.post('/api/jumps', upload.array('images', 5), (req, res) => {
  const {
    name, description, sector, base_price, technical_requirements,
    demo_video, use_cases, status, features, scalable_modules
  } = req.body;

  if (!name || !sector || !base_price || !status) {
    res.status(400).json({ error: 'Faltan campos obligatorios' });
    return;
  }

  // Preparar arrays para guardar como JSON strings
  const featuresArray = features ? JSON.stringify(Array.isArray(features) ? features : [features]) : JSON.stringify([]);
  const scalableModulesArray = scalable_modules ? JSON.stringify(Array.isArray(scalable_modules) ? scalable_modules : [scalable_modules]) : JSON.stringify([]);
  
  // Guardar nombres de archivos de imágenes
  const imageFiles = req.files ? req.files.map(file => file.filename) : [];
  const imagesJson = JSON.stringify(imageFiles);

  generateId('JMP', (jump_id) => {
    if (!jump_id) {
      res.status(500).json({ error: 'Error al generar ID de jump' });
      return;
    }

    db.run(`
      INSERT INTO jumps (
        jump_id, name, description, sector, base_price, features,
        technical_requirements, scalable_modules, images, demo_video,
        use_cases, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      jump_id, name, description, sector, base_price, featuresArray,
      technical_requirements, scalableModulesArray, imagesJson, demo_video,
      use_cases, status
    ], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({
        jump_id, name, description, sector, base_price,
        features: features ? (Array.isArray(features) ? features : [features]) : [],
        technical_requirements, 
        scalable_modules: scalable_modules ? (Array.isArray(scalable_modules) ? scalable_modules : [scalable_modules]) : [],
        images: imageFiles,
        demo_video, use_cases, status
      });
    });
  });
});

// Asociar un cliente a un Jump
app.post('/api/jumps/:jumpId/clients', (req, res) => {
  const { jumpId } = req.params;
  const { clientId } = req.body;

  if (!clientId) {
    res.status(400).json({ error: 'ID de cliente requerido' });
    return;
  }

  db.run(`
    INSERT INTO jump_clients (jump_id, client_id) VALUES (?, ?)
    ON CONFLICT(jump_id, client_id) DO NOTHING
  `, [jumpId, clientId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ jump_id: jumpId, client_id: clientId });
  });
});

// --- Más rutas para otros módulos ---

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});

module.exports = app;
