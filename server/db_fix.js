/**
 * Script para arreglar la tabla de facturas añadiendo la columna due_date
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ruta a la base de datos
const dbPath = path.join(__dirname, 'database.sqlite');

// Verificar que el archivo exista
if (!fs.existsSync(dbPath)) {
  console.error(`No se encontró la base de datos en: ${dbPath}`);
  process.exit(1);
}

console.log(`Conectando a la base de datos en: ${dbPath}`);
console.log(`Tamaño del archivo: ${fs.statSync(dbPath).size} bytes`);

// Conectar a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
    process.exit(1);
  }
  console.log('Conectado a la base de datos SQLite');
});

// Listar todas las tablas para diagnóstico
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
  if (err) {
    console.error("Error al listar tablas:", err);
    closeAndExit(1);
  }
  
  console.log("Tablas en la base de datos:", tables.map(t => t.name));
  
  // Ver si la tabla invoices existe
  if (!tables.some(t => t.name === 'invoices')) {
    console.log("AVISO: La tabla 'invoices' no existe en la base de datos");
    console.log("Se creará la tabla la próxima vez que se inicie el servidor");
    closeAndExit(0);
  }
  
  // Verificar la estructura de la tabla invoices
  db.all("PRAGMA table_info(invoices)", [], (err, columns) => {
    if (err) {
      console.error("Error al obtener estructura de tabla invoices:", err);
      closeAndExit(1);
    }
    
    const columnNames = columns.map(col => col.name);
    console.log("Columnas actuales en tabla invoices:", columnNames);
    
    // Añadir columna due_date si no existe
    if (!columnNames.includes('due_date')) {
      console.log("Añadiendo columna 'due_date' a la tabla invoices...");
      db.run("ALTER TABLE invoices ADD COLUMN due_date TEXT", [], (alterErr) => {
        if (alterErr) {
          console.error("Error al añadir columna due_date:", alterErr);
          closeAndExit(1);
        } else {
          console.log("✅ Columna due_date añadida correctamente");
          closeAndExit(0);
        }
      });
    } else {
      console.log("La tabla invoices ya tiene la columna due_date");
      closeAndExit(0);
    }
  });
});

// Función para cerrar la conexión y salir
function closeAndExit(code) {
  db.close(() => {
    console.log('Conexión a la base de datos cerrada');
    process.exit(code);
  });
}
