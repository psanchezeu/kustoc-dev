const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'kustoc.db');
const db = new sqlite3.Database(dbPath);

// Verificar la estructura de la tabla projects
db.all("PRAGMA table_info(projects)", [], (err, columns) => {
  if (err) {
    console.error('Error al obtener estructura de la tabla projects:', err.message);
    db.close();
    return;
  }
  
  console.log('=== Estructura de la tabla projects ===');
  columns.forEach(col => {
    console.log(`- ${col.name} (${col.type}) - ${col.notnull ? 'NOT NULL' : 'NULL'}`);
  });
  
  // Verificar la estructura de la tabla id_counters
  db.all("PRAGMA table_info(id_counters)", [], (err, countersColumns) => {
    if (err) {
      console.error('Error al obtener estructura de la tabla id_counters:', err.message);
    } else {
      console.log('\n=== Estructura de la tabla id_counters ===');
      countersColumns.forEach(col => {
        console.log(`- ${col.name} (${col.type}) - ${col.notnull ? 'NOT NULL' : 'NULL'}`);
      });
    }
    
    // Cerrar la conexión
    db.close();
  });
});
