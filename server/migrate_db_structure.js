/**
 * Script de migración para actualizar la estructura de la base de datos
 * - Actualiza las tablas copilots y projects para tener las columnas necesarias
 * - Corrige la incompatibilidad entre kustoc.db y kacum.db
 * - Agrega columnas faltantes: copilot_id, availability, role, description
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('Iniciando migración de estructura de base de datos...');

// Ruta a la base de datos
const dbPath = path.join(__dirname, 'kacum.db');

// Verificar si existe la base de datos
if (!fs.existsSync(dbPath)) {
  console.error('Error: Base de datos no encontrada en', dbPath);
  process.exit(1);
}

// Conectar a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
    process.exit(1);
  }
  console.log('Conectado a la base de datos SQLite');
});

// Realizar las migraciones dentro de una transacción
db.serialize(() => {
  // Iniciar transacción
  db.run('BEGIN TRANSACTION');

  // 1. Verificar y actualizar la tabla de proyectos
  db.get("PRAGMA table_info(projects)", [], (err, row) => {
    if (err) {
      console.error('Error al verificar estructura de projects:', err.message);
      return db.run('ROLLBACK');
    }

    // Verificar si existe la columna copilot_id en projects
    db.get("SELECT 1 FROM pragma_table_info('projects') WHERE name='copilot_id'", [], (err, row) => {
      if (err) {
        console.error('Error al verificar columna copilot_id:', err.message);
        return db.run('ROLLBACK');
      }

      if (!row) {
        console.log('Añadiendo columna copilot_id a la tabla projects...');
        db.run(`ALTER TABLE projects ADD COLUMN copilot_id TEXT REFERENCES copilots(copilot_id)`, (err) => {
          if (err) {
            console.error('Error al añadir columna copilot_id:', err.message);
            return db.run('ROLLBACK');
          }
          console.log('✅ Columna copilot_id añadida correctamente');
        });
      } else {
        console.log('La columna copilot_id ya existe en la tabla projects');
      }
    });
    
    // Verificar si existe la columna description en projects
    db.get("SELECT 1 FROM pragma_table_info('projects') WHERE name='description'", [], (err, row) => {
      if (err) {
        console.error('Error al verificar columna description:', err.message);
        return db.run('ROLLBACK');
      }

      if (!row) {
        console.log('Añadiendo columna description a la tabla projects...');
        db.run(`ALTER TABLE projects ADD COLUMN description TEXT`, (err) => {
          if (err) {
            console.error('Error al añadir columna description:', err.message);
            return db.run('ROLLBACK');
          }
          console.log('✅ Columna description añadida correctamente');
        });
      } else {
        console.log('La columna description ya existe en la tabla projects');
      }
    });
  });

  // 2. Verificar y actualizar la tabla de copilotos
  db.get("PRAGMA table_info(copilots)", [], (err, row) => {
    if (err) {
      console.error('Error al verificar estructura de copilots:', err.message);
      return db.run('ROLLBACK');
    }

    // Verificar si existe la columna availability en copilots
    db.get("SELECT 1 FROM pragma_table_info('copilots') WHERE name='availability'", [], (err, row) => {
      if (err) {
        console.error('Error al verificar columna availability:', err.message);
        return db.run('ROLLBACK');
      }

      if (!row) {
        console.log('Añadiendo columna availability a la tabla copilots...');
        db.run(`ALTER TABLE copilots ADD COLUMN availability TEXT`, (err) => {
          if (err) {
            console.error('Error al añadir columna availability:', err.message);
            return db.run('ROLLBACK');
          }
          
          // Actualizar el valor de availability basado en status existente
          console.log('Actualizando valores de availability basados en status...');
          db.run(`UPDATE copilots SET availability = status`, (err) => {
            if (err) {
              console.error('Error al actualizar valores de availability:', err.message);
              return db.run('ROLLBACK');
            }
            console.log('✅ Columna availability añadida y actualizada correctamente');
          });
        });
      } else {
        console.log('La columna availability ya existe en la tabla copilots');
      }
    });
    
    // Verificar si existe la columna role en copilots
    db.get("SELECT 1 FROM pragma_table_info('copilots') WHERE name='role'", [], (err, row) => {
      if (err) {
        console.error('Error al verificar columna role:', err.message);
        return db.run('ROLLBACK');
      }

      if (!row) {
        console.log('Añadiendo columna role a la tabla copilots...');
        db.run(`ALTER TABLE copilots ADD COLUMN role TEXT DEFAULT 'developer'`, (err) => {
          if (err) {
            console.error('Error al añadir columna role:', err.message);
            return db.run('ROLLBACK');
          }
          console.log('✅ Columna role añadida correctamente con valor por defecto \'developer\'');
        });
      } else {
        console.log('La columna role ya existe en la tabla copilots');
      }
    });
  });

  // Confirmar transacción
  db.run('COMMIT', (err) => {
    if (err) {
      console.error('Error al finalizar la transacción:', err.message);
      return db.run('ROLLBACK');
    }
    console.log('✅ Migración completada correctamente');
  });
});

// Cerrar la conexión a la base de datos cuando termine
process.on('exit', () => {
  db.close((err) => {
    if (err) {
      console.error('Error al cerrar la base de datos:', err.message);
    } else {
      console.log('Conexión a la base de datos cerrada');
    }
  });
});
