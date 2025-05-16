const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Conectar a la base de datos
const dbPath = path.join(__dirname, '..', 'kustoc.db');
const db = new sqlite3.Database(dbPath);

/**
 * Script para llenar tablas de referencia con datos iniciales
 * Esto reemplazará los datos hardcodeados en el código con datos en la base de datos
 */
async function seedReferenceData() {
  console.log('Iniciando población de tablas de referencia...');
  
  // Función para generar IDs únicos
  const generateId = (prefix) => {
    return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
  };
  
  // Función para insertar datos si no existen
  const insertIfNotExists = (table, idField, data) => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT COUNT(*) as count FROM ${table}`, [], (err, result) => {
        if (err) {
          console.error(`Error al verificar datos en tabla ${table}:`, err.message);
          reject(err);
          return;
        }
        
        // Si hay datos, no insertamos
        if (result.count > 0) {
          console.log(`La tabla ${table} ya tiene datos (${result.count} registros). No se insertarán datos nuevos.`);
          resolve();
          return;
        }
        
        // Insertar datos
        console.log(`Insertando datos en tabla ${table}...`);
        
        const stmt = db.prepare(`INSERT INTO ${table} VALUES (?, ?, ?, ?)`);
        
        data.forEach(item => {
          stmt.run(item.id, item.name, item.description, item.active);
        });
        
        stmt.finalize((finalizeErr) => {
          if (finalizeErr) {
            console.error(`Error al insertar datos en tabla ${table}:`, finalizeErr.message);
            reject(finalizeErr);
            return;
          }
          
          console.log(`Datos insertados correctamente en tabla ${table}`);
          resolve();
        });
      });
    });
  };
  
  // Datos para los sectores (antes hardcodeados en Clients.tsx)
  const sectors = [
    { id: generateId('SEC'), name: 'Talleres Mecánicos', description: 'Talleres de reparación de vehículos', active: 1 },
    { id: generateId('SEC'), name: 'Clínicas', description: 'Centros médicos y clínicas de salud', active: 1 },
    { id: generateId('SEC'), name: 'Asesorías', description: 'Servicios de asesoría legal, fiscal, etc.', active: 1 },
    { id: generateId('SEC'), name: 'Restaurantes', description: 'Establecimientos de comida y bebida', active: 1 },
    { id: generateId('SEC'), name: 'Otros', description: 'Otros sectores no categorizados', active: 1 }
  ];
  
  // Datos para estados de cliente
  const clientStatuses = [
    { id: generateId('CST'), name: 'Prospecto', description: 'Cliente potencial en fase inicial', active: 1 },
    { id: generateId('CST'), name: 'Cliente Activo', description: 'Cliente con proyectos activos', active: 1 },
    { id: generateId('CST'), name: 'Inactivo', description: 'Cliente sin actividad reciente', active: 1 },
    { id: generateId('CST'), name: 'En Negociación', description: 'Cliente en fase de negociación', active: 1 }
  ];
  
  // Datos para estados de proyecto
  const projectStatuses = [
    { id: generateId('PST'), name: 'planning', description: 'Proyecto en fase de planificación', active: 1 },
    { id: generateId('PST'), name: 'in_progress', description: 'Proyecto en progreso', active: 1 },
    { id: generateId('PST'), name: 'on_hold', description: 'Proyecto en pausa', active: 1 },
    { id: generateId('PST'), name: 'completed', description: 'Proyecto completado', active: 1 }
  ];
  
  // Datos para estados de jump
  const jumpStatuses = [
    { id: generateId('JST'), name: 'planning', description: 'Jump en fase de planificación', active: 1 },
    { id: generateId('JST'), name: 'in_progress', description: 'Jump en desarrollo', active: 1 },
    { id: generateId('JST'), name: 'review', description: 'Jump en revisión', active: 1 },
    { id: generateId('JST'), name: 'completed', description: 'Jump completado', active: 1 },
    { id: generateId('JST'), name: 'archived', description: 'Jump archivado', active: 1 }
  ];
  
  // Datos para tipos de interacción
  const interactionTypes = [
    { id: generateId('INT'), name: 'Llamada', description: 'Llamada telefónica', active: 1 },
    { id: generateId('INT'), name: 'Email', description: 'Comunicación por correo electrónico', active: 1 },
    { id: generateId('INT'), name: 'Reunión', description: 'Reunión presencial o virtual', active: 1 },
    { id: generateId('INT'), name: 'Demo', description: 'Demostración de producto', active: 1 },
    { id: generateId('INT'), name: 'Otro', description: 'Otro tipo de interacción', active: 1 }
  ];
  
  try {
    // Insertar datos en las tablas
    await insertIfNotExists('sectors', 'sector_id', sectors);
    await insertIfNotExists('client_statuses', 'status_id', clientStatuses);
    await insertIfNotExists('project_statuses', 'status_id', projectStatuses);
    await insertIfNotExists('jump_statuses', 'status_id', jumpStatuses);
    await insertIfNotExists('interaction_types', 'type_id', interactionTypes);
    
    // Crear usuario administrador por defecto (si no existe)
    db.get('SELECT COUNT(*) as count FROM users', [], async (err, result) => {
      if (err) {
        console.error('Error al verificar usuarios:', err.message);
        return;
      }
      
      if (result.count === 0) {
        console.log('Creando usuario administrador por defecto...');
        
        // Hash de la contraseña
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash('admin', saltRounds);
        
        db.run(`
          INSERT INTO users (
            user_id, name, email, password, role, created_at, active
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          generateId('USR'),
          'Administrador',
          'admin@kustoc.com',
          passwordHash,
          'admin',
          new Date().toISOString(),
          1
        ], function(insertErr) {
          if (insertErr) {
            console.error('Error al crear usuario administrador:', insertErr.message);
          } else {
            console.log('Usuario administrador creado correctamente');
          }
        });
      } else {
        console.log(`Ya existen ${result.count} usuarios. No se creará el usuario por defecto.`);
      }
    });
    
    console.log('Población de tablas de referencia completada con éxito');
  } catch (error) {
    console.error('Error durante la población de datos:', error);
  }
}

// Ejecutar la función
seedReferenceData();

// Mantener el script activo para completar operaciones asíncronas
setTimeout(() => {
  console.log('Cerrando conexión a la base de datos...');
  db.close();
  console.log('Operación completada');
  process.exit(0);
}, 3000);
