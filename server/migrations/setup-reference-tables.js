const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar a la base de datos
const dbPath = path.join(__dirname, '..', 'kustoc.db');
const db = new sqlite3.Database(dbPath);

/**
 * Script para crear tablas de referencia (catálogos) y eliminar datos hardcodeados
 */
function setupReferenceTables() {
  console.log('Iniciando creación de tablas de referencia...');
  
  db.serialize(() => {
    // Tabla de sectores
    db.run(`CREATE TABLE IF NOT EXISTS sectors (
      sector_id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      active INTEGER DEFAULT 1
    )`);
    
    // Tabla de estados de cliente
    db.run(`CREATE TABLE IF NOT EXISTS client_statuses (
      status_id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      active INTEGER DEFAULT 1
    )`);
    
    // Tabla de estados de proyecto
    db.run(`CREATE TABLE IF NOT EXISTS project_statuses (
      status_id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      active INTEGER DEFAULT 1
    )`);
    
    // Tabla de estados de jump
    db.run(`CREATE TABLE IF NOT EXISTS jump_statuses (
      status_id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      active INTEGER DEFAULT 1
    )`);
    
    // Tabla para tipos de interacción
    db.run(`CREATE TABLE IF NOT EXISTS interaction_types (
      type_id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      active INTEGER DEFAULT 1
    )`);
    
    // Tabla para usuarios (actualmente hardcodeados en AuthContext)
    db.run(`CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_login TEXT,
      active INTEGER DEFAULT 1
    )`);
    
    console.log('Tablas de referencia creadas correctamente');
  });
}

// Ejecutar la función
setupReferenceTables();

// Cerrar la conexión cuando termine
process.on('exit', () => {
  db.close();
  console.log('Conexión a la base de datos cerrada');
});
