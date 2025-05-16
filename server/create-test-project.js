const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'kustoc.db');
const db = new sqlite3.Database(dbPath);

// Función para generar un ID de proyecto
function generateProjectId(callback) {
  const prefix = 'PRJ';
  
  db.get("SELECT project_counter FROM id_counters", [], (err, row) => {
    let counter = 1;
    
    if (err) {
      console.warn("Error al obtener contador de proyectos:", err.message);
    } else if (row) {
      counter = row.project_counter + 1;
    }
    
    // Actualizar el contador
    db.run("UPDATE id_counters SET project_counter = ?", [counter], (updateErr) => {
      if (updateErr) {
        console.error("Error al actualizar contador de proyectos:", updateErr.message);
      }
      
      // Formatear el ID con el contador (asegurando 3 dígitos mínimo)
      const id = `${prefix}${counter.toString().padStart(3, '0')}`;
      callback(id);
    });
  });
}

// Función para crear un proyecto de prueba
function createTestProject() {
  console.log('Obteniendo datos para crear proyecto de prueba...');
  
  // Obtener un cliente, jump y copiloto para el proyecto
  db.get("SELECT client_id FROM clients LIMIT 1", [], (clientErr, clientRow) => {
    if (clientErr || !clientRow) {
      console.error('Error al obtener cliente:', clientErr?.message || 'No hay clientes en la base de datos');
      db.close();
      return;
    }
    
    const client_id = clientRow.client_id;
    
    db.get("SELECT jump_id FROM jumps LIMIT 1", [], (jumpErr, jumpRow) => {
      const jump_id = jumpRow?.jump_id || null;
      
      db.get("SELECT copilot_id FROM copilots LIMIT 1", [], (copilotErr, copilotRow) => {
        const copilot_id = copilotRow?.copilot_id || null;
        
        // Generar ID para el nuevo proyecto
        generateProjectId((project_id) => {
          const now = new Date().toISOString();
          
          // Datos del proyecto
          const project = {
            project_id: project_id,
            name: 'Proyecto de Prueba',
            client_id: client_id,
            jump_id: jump_id,
            copilot_id: copilot_id,
            status: 'planning',
            description: 'Este es un proyecto de prueba creado para verificar la funcionalidad',
            start_date: now,
            created_at: now,
            updated_at: now
          };
          
          console.log('Creando proyecto de prueba:', project);
          
          // Insertar el proyecto
          db.run(`
            INSERT INTO projects (
              project_id, name, client_id, jump_id, copilot_id, 
              status, description, start_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            project.project_id, project.name, project.client_id, 
            project.jump_id, project.copilot_id, project.status, 
            project.description, project.start_date
          ], function(err) {
            if (err) {
              console.error('Error al crear el proyecto de prueba:', err.message);
            } else {
              console.log(`Proyecto de prueba creado correctamente con ID: ${project_id}`);
              console.log('Relaciones: ');
              console.log(`- Cliente: ${client_id}`);
              console.log(`- Jump: ${jump_id || 'No asignado'}`);
              console.log(`- Copiloto: ${copilot_id || 'No asignado'}`);
            }
            
            // Cerrar la conexión a la base de datos
            db.close();
          });
        });
      });
    });
  });
}

// Ejecutar la función
createTestProject();
