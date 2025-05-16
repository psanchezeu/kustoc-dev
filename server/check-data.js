const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'kustoc.db');
const db = new sqlite3.Database(dbPath);

// Función para ejecutar una consulta y mostrar los resultados
function runQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error(`Error en consulta "${query}":`, err.message);
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

// Función principal para verificar los datos
async function checkDatabaseData() {
  try {
    console.log('=== VERIFICACIÓN DE DATOS EN LA BASE DE DATOS ===');
    
    // Verificar tablas existentes
    const tables = await runQuery("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('\nTablas existentes:');
    tables.forEach(table => console.log(`- ${table.name}`));
    
    // Verificar datos en clientes
    console.log('\n=== Clientes ===');
    try {
      const clients = await runQuery('SELECT * FROM clients LIMIT 10');
      console.log(`Número de clientes: ${clients.length}`);
      if (clients.length > 0) {
        console.log('Muestra de clientes:');
        clients.forEach(client => console.log(`- ${client.client_id}: ${client.name} (${client.company || 'Sin empresa'})`));
      } else {
        console.log('⚠️ No hay clientes en la base de datos.');
      }
    } catch (error) {
      console.log('⚠️ No se pudo acceder a la tabla de clientes.');
    }
    
    // Verificar datos en jumps
    console.log('\n=== Jumps ===');
    try {
      const jumps = await runQuery('SELECT * FROM jumps LIMIT 10');
      console.log(`Número de jumps: ${jumps.length}`);
      if (jumps.length > 0) {
        console.log('Muestra de jumps:');
        jumps.forEach(jump => console.log(`- ${jump.jump_id}: ${jump.name}`));
      } else {
        console.log('⚠️ No hay jumps en la base de datos.');
      }
    } catch (error) {
      console.log('⚠️ No se pudo acceder a la tabla de jumps.');
    }
    
    // Verificar datos en copilotos
    console.log('\n=== Copilotos ===');
    try {
      const copilots = await runQuery('SELECT * FROM copilots LIMIT 10');
      console.log(`Número de copilotos: ${copilots.length}`);
      if (copilots.length > 0) {
        console.log('Muestra de copilotos:');
        copilots.forEach(copilot => console.log(`- ${copilot.copilot_id}: ${copilot.name} (${copilot.email})`));
      } else {
        console.log('⚠️ No hay copilotos en la base de datos.');
      }
    } catch (error) {
      console.log('⚠️ No se pudo acceder a la tabla de copilotos.');
    }
    
    // Verificar datos en proyectos
    console.log('\n=== Proyectos ===');
    try {
      const projects = await runQuery('SELECT * FROM projects LIMIT 10');
      console.log(`Número de proyectos: ${projects.length}`);
      if (projects.length > 0) {
        console.log('Muestra de proyectos:');
        projects.forEach(project => console.log(`- ${project.project_id}: ${project.name} (Cliente: ${project.client_id})`));
      } else {
        console.log('⚠️ No hay proyectos en la base de datos.');
      }
    } catch (error) {
      console.log('⚠️ No se pudo acceder a la tabla de proyectos.');
    }

    // Verificar estructura de la tabla de proyectos
    console.log('\n=== Estructura de tabla de proyectos ===');
    try {
      const structure = await runQuery("PRAGMA table_info(projects)");
      console.log('Columnas de la tabla projects:');
      structure.forEach(col => console.log(`- ${col.name} (${col.type})`));
      
      // Verificar si existen las columnas necesarias
      const hasJumpId = structure.some(col => col.name === 'jump_id');
      const hasCopilotId = structure.some(col => col.name === 'copilot_id');
      
      if (!hasJumpId) {
        console.log('⚠️ La tabla projects NO tiene la columna jump_id');
      }
      
      if (!hasCopilotId) {
        console.log('⚠️ La tabla projects NO tiene la columna copilot_id');
      }
      
    } catch (error) {
      console.log('⚠️ Error al verificar la estructura de la tabla projects.');
    }
    
  } catch (error) {
    console.error('Error general:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    db.close();
  }
}

// Ejecutar el script
checkDatabaseData();
