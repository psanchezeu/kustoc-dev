const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'kustoc.db');
const db = new sqlite3.Database(dbPath);

// Función para añadir la columna copilot_id a la tabla projects
function addCopilotIdColumn() {
  console.log('Añadiendo la columna copilot_id a la tabla projects...');
  
  db.run(`ALTER TABLE projects ADD COLUMN copilot_id TEXT`, (err) => {
    if (err) {
      console.error('Error al añadir la columna copilot_id:', err.message);
    } else {
      console.log('Columna copilot_id añadida correctamente a la tabla projects.');
    }
    
    // Cerrar la conexión a la base de datos
    db.close();
  });
}

// Ejecutar la función
addCopilotIdColumn();
