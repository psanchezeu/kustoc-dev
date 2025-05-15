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
    migrateDatabase();
  }
});

// Función para realizar migraciones de la base de datos
function migrateDatabase() {
  console.log('Iniciando migraciones de la base de datos...');
  
  // Comprobar y actualizar la estructura de la tabla copilots si es necesario
  db.get("PRAGMA table_info(copilots)", [], (err, rows) => {
    if (err) {
      console.error('Error al obtener estructura de la tabla copilots:', err.message);
      return;
    }
    
    // Comprobar si existen los campos nuevos
    db.all("PRAGMA table_info(copilots)", [], (err, columns) => {
      if (err) {
        console.error('Error al obtener columnas de la tabla copilots:', err.message);
        return;
      }
      
      const columnNames = columns.map(col => col.name);
      console.log('Columnas actuales en tabla copilots:', columnNames);
      
      // Actualizar la tabla si faltan columnas
      const missingColumns = [];
      
      if (!columnNames.includes('bio')) {
        missingColumns.push('ADD COLUMN bio TEXT');
      }
      
      if (!columnNames.includes('specialty')) {
        missingColumns.push('ADD COLUMN specialty TEXT');
      }
      
      if (!columnNames.includes('status') && !columnNames.includes('availability')) {
        missingColumns.push('ADD COLUMN status TEXT DEFAULT \'available\' NOT NULL');
      }
      
      if (!columnNames.includes('hourly_rate')) {
        missingColumns.push('ADD COLUMN hourly_rate REAL DEFAULT 0 NOT NULL');
      }
      
      if (!columnNames.includes('created_at')) {
        missingColumns.push(`ADD COLUMN created_at TEXT DEFAULT '${new Date().toISOString()}' NOT NULL`);
      }
      
      if (missingColumns.length > 0) {
        console.log('Actualizando estructura de la tabla copilots...');
        
        // Ejecutar las alteraciones una por una
        const runNextAlteration = (index) => {
          if (index >= missingColumns.length) {
            console.log('Tabla copilots actualizada correctamente');
            return;
          }
          
          const alterSql = `ALTER TABLE copilots ${missingColumns[index]}`;
          console.log('Ejecutando:', alterSql);
          
          db.run(alterSql, (alterErr) => {
            if (alterErr) {
              console.error(`Error al ejecutar ${alterSql}:`, alterErr.message);
            } else {
              console.log(`Columna añadida: ${missingColumns[index]}`);
            }
            
            runNextAlteration(index + 1);
          });
        };
        
        runNextAlteration(0);
      } else {
        console.log('La tabla copilots ya tiene la estructura correcta');
      }
    });
  });
}

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
      sector TEXT,
      base_price REAL,
      features TEXT,
      technical_requirements TEXT,
      scalable_modules TEXT,
      images TEXT,
      demo_video TEXT,
      use_cases TEXT,
      status TEXT NOT NULL,
      client_id TEXT,
      url TEXT,
      github_repo TEXT,
      created_at TEXT,
      updated_at TEXT
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
      bio TEXT,
      specialty TEXT,
      status TEXT NOT NULL,
      hourly_rate REAL NOT NULL,
      created_at TEXT NOT NULL
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
  console.log('GET /api/jumps/:id - ID:', req.params.id);
  
  db.get('SELECT * FROM jumps WHERE jump_id = ?', [req.params.id], (err, jump) => {
    if (err) {
      console.error('Error al obtener jump:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    if (!jump) {
      console.log('Jump no encontrado:', req.params.id);
      res.status(404).json({ error: 'Jump no encontrado' });
      return;
    }
    
    console.log('Jump encontrado:', jump);
    
    // Crear objeto de respuesta con manejo seguro de campos
    const result = { ...jump };
    
    // Manejar de forma segura los campos JSON
    try {
      if (jump.features && typeof jump.features === 'string') {
        result.features = JSON.parse(jump.features);
      } else {
        result.features = [];
      }
      
      if (jump.scalable_modules && typeof jump.scalable_modules === 'string') {
        result.scalable_modules = JSON.parse(jump.scalable_modules);
      } else {
        result.scalable_modules = [];
      }
      
      if (jump.images && typeof jump.images === 'string') {
        result.images = JSON.parse(jump.images);
      } else {
        result.images = [];
      }
    } catch (jsonError) {
      console.error('Error al parsear JSON:', jsonError);
      // Continuar con valores por defecto si hay error de parsing
    }
    
    // Intentar obtener clientes asociados solo si la tabla existe
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='jump_clients'", [], (tableErr, tableExists) => {
      if (tableErr || !tableExists) {
        // No hay tabla de relación, devolver solo el jump
        console.log('No se encontró la tabla jump_clients o hubo un error');
        res.json(result);
        return;
      }
      
      // Obtener los clientes asociados al Jump
      db.all(`
        SELECT c.client_id, c.name, c.company
        FROM clients c
        JOIN jump_clients jc ON c.client_id = jc.client_id
        WHERE jc.jump_id = ?
      `, [req.params.id], (clientErr, clients) => {
        if (clientErr) {
          console.error('Error al obtener clientes asociados:', clientErr.message);
          // Si hay error, continuar sin clientes
          res.json(result);
          return;
        }
        
        // Añadir clientes al resultado
        result.clients = clients || [];
        res.json(result);
      });
    });
  });
});

app.post('/api/jumps', (req, res) => {
  console.log('POST /api/jumps - Cuerpo de la solicitud:', req.body);
  
  const { name, description, status, client_id, url, github_repo } = req.body;

  console.log('Campos recibidos simplificados:', {
    name, description, status, client_id, url, github_repo
  });

  if (!name) {
    console.log('Error: Nombre es obligatorio');
    res.status(400).json({ error: 'El nombre es obligatorio' });
    return;
  }
  
  // Generación de ID simplificada para pruebas
  const jump_id = 'JMP' + Date.now();
  
  // Inserción simplificada para solucionar problemas de guardado
  const query = `
    INSERT INTO jumps (jump_id, name, description, status, client_id, url, github_repo) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  console.log('Ejecutando consulta:', query);
  console.log('Con parámetros:', [jump_id, name, description, status || 'planning', client_id || null, url || null, github_repo || null]);
  
  db.run(query, [
    jump_id,
    name,
    description || '',
    status || 'planning',
    client_id || null,
    url || null,
    github_repo || null
  ], function(err) {
    if (err) {
      console.error('Error al insertar jump:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    
    console.log('Jump creado exitosamente con ID:', jump_id);
    
    res.status(201).json({
      jump_id,
      name,
      description: description || '',
      status: status || 'planning',
      client_id: client_id || null,
      url: url || null,
      github_repo: github_repo || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });
});

// Actualizar un jump existente
app.put('/api/jumps/:id', (req, res) => {
  console.log('PUT /api/jumps/:id - ID:', req.params.id);
  console.log('PUT /api/jumps/:id - Cuerpo de la solicitud:', req.body);
  
  const { id } = req.params;
  const { name, description, status, client_id, url, github_repo } = req.body;

  if (!name) {
    console.log('Error: Nombre es obligatorio');
    res.status(400).json({ error: 'El nombre es obligatorio' });
    return;
  }

  const query = `
    UPDATE jumps 
    SET name = ?, description = ?, status = ?, client_id = ?, url = ?, github_repo = ?, updated_at = ?
    WHERE jump_id = ?
  `;
  
  console.log('Ejecutando consulta UPDATE:', query);
  console.log('Con parámetros:', [name, description, status, client_id, url, github_repo, new Date().toISOString(), id]);
  
  db.run(query, [
    name,
    description || '',
    status || 'planning',
    client_id || null,
    url || null,
    github_repo || null,
    new Date().toISOString(),
    id
  ], function(err) {
    if (err) {
      console.error('Error al actualizar jump:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      console.log('Jump no encontrado:', id);
      res.status(404).json({ error: 'Jump no encontrado' });
      return;
    }
    
    console.log('Jump actualizado exitosamente:', id);
    
    res.json({
      jump_id: id,
      name,
      description: description || '',
      status: status || 'planning',
      client_id: client_id || null,
      url: url || null,
      github_repo: github_repo || null,
      updated_at: new Date().toISOString()
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

// Obtener los clientes asociados a un Jump
app.get('/api/jumps/:jumpId/clients', (req, res) => {
  const { jumpId } = req.params;

  db.all(`
    SELECT c.client_id, c.name, c.company
    FROM clients c
    JOIN jump_clients jc ON c.client_id = jc.client_id
    WHERE jc.jump_id = ?
  `, [jumpId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// ----- Rutas para Copilotos -----

// Obtener todos los copilotos
app.get('/api/copilots', (req, res) => {
  db.all('SELECT * FROM copilots ORDER BY name', [], (err, rows) => {
    if (err) {
      console.error('Error al obtener copilotos:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Obtener un copiloto específico
app.get('/api/copilots/:id', (req, res) => {
  db.get('SELECT * FROM copilots WHERE copilot_id = ?', [req.params.id], (err, copilot) => {
    if (err) {
      console.error('Error al obtener copiloto:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    if (!copilot) {
      console.log('Copiloto no encontrado:', req.params.id);
      res.status(404).json({ error: 'Copiloto no encontrado' });
      return;
    }
    res.json(copilot);
  });
});

// Crear un nuevo copiloto
app.post('/api/copilots', (req, res) => {
  const { name, email, bio, specialty, availability, hourly_rate, role } = req.body;

  // Log para depuración
  console.log('Datos recibidos en POST /api/copilots:', req.body);

  if (!name || !email || !availability || !hourly_rate) {
    res.status(400).json({ error: 'Faltan campos obligatorios' });
    return;
  }
  
  // Si no se proporciona role, usar un valor predeterminado
  const roleFinal = role || 'developer';

  // Procesamiento de especialidades (convertir a texto JSON)
  const specialtyJSON = Array.isArray(specialty) ? JSON.stringify(specialty) : JSON.stringify(specialty.split(',').map(s => s.trim()).filter(Boolean));
  
  const created_at = new Date().toISOString();

  // Verificar si la tabla tiene las columnas correctas
  db.all("PRAGMA table_info(copilots)", [], (schemaErr, columns) => {
    if (schemaErr) {
      console.error('Error al verificar la estructura de la tabla copilots:', schemaErr.message);
      return res.status(500).json({ error: schemaErr.message });
    }
    
    const columnNames = columns.map(col => col.name);
    console.log('Columnas existentes en tabla copilots:', columnNames);
    
    // Comprobar si falta la columna status
    const missingStatus = !columnNames.includes('status');
    
    // Si falta la columna status, añadirla
    if (missingStatus) {
      const alterSql = `ALTER TABLE copilots ADD COLUMN status TEXT DEFAULT 'available' NOT NULL`;
      console.log('Ejecutando migración:', alterSql);
      
      db.run(alterSql, (alterErr) => {
        if (alterErr) {
          console.error('Error al añadir columna status:', alterErr.message);
          return res.status(500).json({ error: 'Error en la estructura de la tabla: ' + alterErr.message });
        }
        
        console.log('Columna status añadida correctamente');
        proceedWithInsert();
      });
    } else {
      proceedWithInsert();
    }
  });
  
  // Función para continuar con la inserción
  function proceedWithInsert() {
    // Generar ID para el copiloto
    generateId('CPL', (copilot_id) => {
      if (!copilot_id) {
        res.status(500).json({ error: 'Error al generar ID de copiloto' });
        return;
      }

      console.log('Insertando copiloto con ID:', copilot_id);
      console.log('Datos a insertar:', { copilot_id, name, email, bio: bio || '', specialty: specialtyJSON, availability, hourly_rate, role: roleFinal, created_at });

      db.run(`
        INSERT INTO copilots (
          copilot_id, name, email, bio, specialty, availability, hourly_rate, role, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        copilot_id, name, email, bio || '', specialtyJSON, availability, hourly_rate, roleFinal, created_at
      ], function(err) {
        if (err) {
          console.error('Error al insertar copiloto:', err.message);
          res.status(500).json({ error: err.message });
          return;
        }
        
        console.log('Copiloto insertado correctamente:', copilot_id);
        
        // Devolver objeto completo
        res.status(201).json({
          copilot_id, name, email, bio: bio || '', 
          specialty: JSON.parse(specialtyJSON),
          availability, hourly_rate, role: roleFinal, created_at
        });
      });
    });
  }
});

// Actualizar un copiloto existente
app.put('/api/copilots/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, bio, specialty, availability, hourly_rate, role } = req.body;

  // Log para depuración
  console.log('Datos recibidos en PUT /api/copilots:', req.body);

  if (!name || !email || !availability || !hourly_rate) {
    res.status(400).json({ error: 'Faltan campos obligatorios' });
    return;
  }
  
  // Si no se proporciona role, usar un valor predeterminado
  const roleFinal = role || 'developer';

  // Procesamiento de especialidades (convertir a texto JSON)
  const specialtyJSON = Array.isArray(specialty) ? JSON.stringify(specialty) : JSON.stringify(specialty.split(',').map(s => s.trim()).filter(Boolean));

  // Verificar si la tabla tiene las columnas correctas
  db.all("PRAGMA table_info(copilots)", [], (schemaErr, columns) => {
    if (schemaErr) {
      console.error('Error al verificar la estructura de la tabla copilots:', schemaErr.message);
      return res.status(500).json({ error: schemaErr.message });
    }
    
    const columnNames = columns.map(col => col.name);
    console.log('Columnas existentes en tabla copilots (UPDATE):', columnNames);
    
    // Comprobar si falta la columna status
    const missingStatus = !columnNames.includes('status');
    
    // Si falta la columna status, añadirla
    if (missingStatus) {
      const alterSql = `ALTER TABLE copilots ADD COLUMN status TEXT DEFAULT 'available' NOT NULL`;
      console.log('Ejecutando migración en PUT:', alterSql);
      
      db.run(alterSql, (alterErr) => {
        if (alterErr) {
          console.error('Error al añadir columna status:', alterErr.message);
          return res.status(500).json({ error: 'Error en la estructura de la tabla: ' + alterErr.message });
        }
        
        console.log('Columna status añadida correctamente');
        proceedWithUpdate();
      });
    } else {
      proceedWithUpdate();
    }
  });
  
  // Función para continuar con la actualización
  function proceedWithUpdate() {
    console.log('Actualizando copiloto con ID:', id);
    console.log('Datos a actualizar:', { name, email, bio: bio || '', specialty: specialtyJSON, availability, hourly_rate, role: roleFinal });
    
    db.run(`
      UPDATE copilots SET
        name = ?, email = ?, bio = ?, specialty = ?, availability = ?, hourly_rate = ?, role = ?
      WHERE copilot_id = ?
    `, [
      name, email, bio || '', specialtyJSON, availability, hourly_rate, roleFinal, id
    ], function(err) {
      if (err) {
        console.error('Error al actualizar copiloto:', err.message);
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: 'Copiloto no encontrado' });
        return;
      }
      
      console.log('Copiloto actualizado correctamente:', id);
      
      // Devolver objeto actualizado
      res.json({
        copilot_id: id, name, email, bio: bio || '', 
        specialty: JSON.parse(specialtyJSON),
        availability, hourly_rate, role: roleFinal
      });
    });
  }
});

// --- Más rutas para otros módulos ---

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});

module.exports = app;
