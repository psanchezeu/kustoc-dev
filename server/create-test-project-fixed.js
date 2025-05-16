const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar a la base de datos
const dbPath = path.join(__dirname, 'kustoc.db');
const db = new sqlite3.Database(dbPath);

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
      if (jumpErr || !jumpRow) {
        console.error('Error al obtener jump:', jumpErr?.message || 'No hay jumps en la base de datos');
        db.close();
        return;
      }
      
      const jump_id = jumpRow.jump_id;
      
      db.get("SELECT copilot_id FROM copilots LIMIT 1", [], (copilotErr, copilotRow) => {
        const copilot_id = copilotRow?.copilot_id || null;
        
        // Generar ID para el nuevo proyecto (formato PRJ001)
        const project_id = `PRJ${Math.floor(Math.random() * 900) + 100}`;
        const now = new Date().toISOString();
        
        // Datos del proyecto con todos los campos obligatorios
        const project = {
          project_id: project_id,
          name: 'Proyecto de Prueba',
          client_id: client_id,
          jump_id: jump_id,  // Campo obligatorio
          copilot_id: copilot_id,
          status: 'planning',
          description: 'Este es un proyecto de prueba creado para verificar la funcionalidad',
          start_date: now,
          estimated_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 días
          contracted_hours: 40, // Campo obligatorio
          consumed_hours: 0
        };
        
        console.log('Creando proyecto de prueba:', project);
        
        // Insertar el proyecto con todos los campos obligatorios
        db.run(`
          INSERT INTO projects (
            project_id, name, client_id, jump_id, copilot_id, 
            status, description, start_date, estimated_end_date,
            contracted_hours, consumed_hours
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          project.project_id, 
          project.name, 
          project.client_id, 
          project.jump_id, 
          project.copilot_id, 
          project.status, 
          project.description, 
          project.start_date,
          project.estimated_end_date,
          project.contracted_hours,
          project.consumed_hours
        ], function(err) {
          if (err) {
            console.error('Error al crear el proyecto de prueba:', err.message);
          } else {
            console.log(`Proyecto de prueba creado correctamente con ID: ${project_id}`);
            console.log('Relaciones: ');
            console.log(`- Cliente: ${client_id}`);
            console.log(`- Jump: ${jump_id}`);
            console.log(`- Copiloto: ${copilot_id || 'No asignado'}`);
          }
          
          // Cerrar la conexión a la base de datos
          db.close();
        });
      });
    });
  });
}

// Ejecutar la función
createTestProject();
