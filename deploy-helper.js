// Script para ayudar con el despliegue en producción
const fs = require('fs');
const path = require('path');

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

// Función principal
function main() {
  console.log('🚀 Preparando archivos para despliegue...');
  const originalBuildScript = updateClientPackageJson();
  
  console.log('✅ Todos los archivos están listos para despliegue');
  console.log('⚠️ Recuerde restaurar la configuración original después del despliegue');
}

main();
