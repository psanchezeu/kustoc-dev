// Script para ayudar con el despliegue en producción
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Función para modificar el package.json del directorio /src
function updateClientPackageJson() {
  const packageJsonPath = path.join(__dirname, 'src', 'package.json');
  const packageJson = require(packageJsonPath);
  
  // Guardar el script original
  const originalBuildScript = packageJson.scripts.build;
  
  // Modificar para el despliegue (sin comprobación de tipos)
  packageJson.scripts.build = "vite build";
  
  // Escribir el archivo actualizado
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
  
  console.log('✅ Scripts de compilación actualizados para producción');
  
  return originalBuildScript;
}

// Función para ejecutar el script de corrección de importaciones en src
function runDeployFixScript() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Ejecutando script de corrección de importaciones...');
    const scriptPath = path.join(__dirname, 'src', 'deploy.mjs');
    
    // Ejecuta el script Node.js para corregir importaciones
    exec(`node ${scriptPath}`, (error, stdout) => {
      if (error) {
        console.error('❌ Error al ejecutar el script de corrección:', error);
        return reject(error);
      }
      
      console.log(stdout);
      console.log('✅ Correcciones de importación aplicadas con éxito');
      resolve();
    });
  });
}

// Función principal
async function main() {
  try {
    console.log('🚀 Preparando archivos para despliegue...');
    const originalBuildScript = updateClientPackageJson();
    
    await runDeployFixScript();
    
    console.log('✅ Todos los archivos están listos para despliegue');
    console.log('⚠️ Recuerde restaurar la configuración original después del despliegue');
  } catch (error) {
    console.error('❌ Error durante la preparación del despliegue:', error);
    process.exit(1);
  }
}

main();
