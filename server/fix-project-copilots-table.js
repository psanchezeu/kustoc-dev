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

// Verificar la estructura actual de la tabla
db.all("PRAGMA table_info(project_copilots)", (err, columns) => {
  if (err) {
    console.error('Error al obtener estructura de la tabla project_copilots:', err.message);
    db.close();
    process.exit(1);
  }

  console.log('Estructura actual de la tabla project_copilots:');
  console.log(columns);

  // Verificar si la columna assigned_date ya existe
  const hasAssignedDate = columns.some(col => col.name === 'assigned_date');
  
  if (hasAssignedDate) {
    console.log('La columna assigned_date ya existe en la tabla');
    db.close();
    return;
  }

  // Añadir la columna assigned_date a la tabla existente
  console.log('Añadiendo columna assigned_date a la tabla project_copilots...');
  
  db.run("ALTER TABLE project_copilots ADD COLUMN assigned_date TEXT", function(alterErr) {
    if (alterErr) {
      console.error('Error al añadir la columna assigned_date:', alterErr.message);
      db.close();
      process.exit(1);
    }
    
    console.log('Columna assigned_date añadida correctamente');
    
    // Establecer un valor por defecto para la columna recién añadida
    const now = new Date().toISOString();
    db.run(
      "UPDATE project_copilots SET assigned_date = ?", 
      [now], 
      function(updateErr) {
        if (updateErr) {
          console.error('Error al actualizar valores de assigned_date:', updateErr.message);
        } else {
          console.log(`Valores de assigned_date actualizados para ${this.changes} filas`);
        }
        
        // Mostrar la estructura actualizada de la tabla
        db.all("PRAGMA table_info(project_copilots)", (pragmaErr, updatedColumns) => {
          if (pragmaErr) {
            console.error('Error al obtener estructura actualizada:', pragmaErr.message);
          } else {
            console.log('Estructura actualizada de la tabla project_copilots:');
            console.log(updatedColumns);
          }
          
          db.close();
        });
      }
    );
  });
});
