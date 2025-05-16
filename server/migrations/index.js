const path = require('path');
const { execSync } = require('child_process');

/**
 * Script principal para ejecutar todas las migraciones y seeds
 */
function runMigrations() {
  console.log('Iniciando proceso de migración y seed...');
  
  try {
    // Ejecutar migración para crear tablas de referencia
    console.log('\n--- Creando tablas de referencia ---');
    execSync('node ' + path.join(__dirname, 'setup-reference-tables.js'), { stdio: 'inherit' });
    
    // Ejecutar seed de datos de referencia
    console.log('\n--- Poblando tablas de referencia ---');
    execSync('node ' + path.join(__dirname, 'seed-reference-data.js'), { stdio: 'inherit' });
    
    console.log('\nProceso de migración completado con éxito');
  } catch (error) {
    console.error('Error durante el proceso de migración:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
