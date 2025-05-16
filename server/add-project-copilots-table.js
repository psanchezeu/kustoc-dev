const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta del archivo de la base de datos
const dbPath = path.join(__dirname, 'database.sqlite');

// Conectar a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
    process.exit(1);
  }
  console.log('Conectado a la base de datos SQLite');
});

// Crear la tabla de relación entre proyectos y copilotos
db.serialize(() => {
  // Primero verificamos si la tabla ya existe
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='project_copilots'", (err, row) => {
    if (err) {
      console.error('Error al verificar si la tabla existe:', err.message);
      db.close();
      process.exit(1);
    }

    if (row) {
      console.log('La tabla project_copilots ya existe. No es necesario crearla.');
      db.close();
      return;
    }

    // Crear la tabla project_copilots
    db.run(`
      CREATE TABLE project_copilots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT NOT NULL,
        copilot_id TEXT NOT NULL,
        assigned_date TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects (project_id) ON DELETE CASCADE,
        FOREIGN KEY (copilot_id) REFERENCES copilots (copilot_id) ON DELETE CASCADE,
        UNIQUE(project_id, copilot_id)
      )
    `, (createErr) => {
      if (createErr) {
        console.error('Error al crear la tabla project_copilots:', createErr.message);
        db.close();
        process.exit(1);
      }
      console.log('Tabla project_copilots creada exitosamente');

      // Migrar datos existentes: Copiar relaciones existentes de la columna copilot_id a la nueva tabla
      db.all('SELECT project_id, copilot_id FROM projects WHERE copilot_id IS NOT NULL', (selectErr, rows) => {
        if (selectErr) {
          console.error('Error al seleccionar proyectos con copilotos:', selectErr.message);
          db.close();
          process.exit(1);
        }

        if (rows.length > 0) {
          console.log(`Encontrados ${rows.length} proyectos con copilotos para migrar`);
          
          // Preparar la sentencia de inserción
          const stmt = db.prepare('INSERT INTO project_copilots (project_id, copilot_id, assigned_date) VALUES (?, ?, ?)');
          
          const now = new Date().toISOString();
          
          // Insertar cada relación en la nueva tabla
          rows.forEach(row => {
            stmt.run(row.project_id, row.copilot_id, now, function(insertErr) {
              if (insertErr) {
                console.error(`Error al migrar relación para proyecto ${row.project_id}:`, insertErr.message);
              } else {
                console.log(`Migrado: Proyecto ${row.project_id} - Copiloto ${row.copilot_id}`);
              }
            });
          });
          
          stmt.finalize();
          console.log('Migración completada');
        } else {
          console.log('No se encontraron proyectos con copilotos para migrar');
        }
        
        db.close();
      });
    });
  });
});
