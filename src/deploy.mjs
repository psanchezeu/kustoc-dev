// Script de construcción personalizado para evitar problemas de importación en producción
import * as fs from 'fs';
import * as path from 'path';

// Crea un alias de importación para componentes problemáticos
const createComponentAlias = () => {
  console.log('📝 Creando alias para componentes con problemas...');
  
  // Definimos los archivos a procesar
  const filesToProcess = [
    'src/pages/projects/ProjectDetail.tsx',
    'src/pages/clients/ClientDetailNew.tsx',
    'src/pages/clients/ClientDetail.tsx'
  ];
  
  // Patrones de importación a reemplazar
  const importReplacements = [
    {
      from: "import { Autocomplete, AutocompleteOption } from '../../components/ui/Autocomplete';",
      to: "import { Autocomplete, AutocompleteOption } from '../../components/ui/replacement-components';"
    },
    {
      from: "import { MultiSelect, MultiSelectOption } from '../../components/ui/MultiSelect';",
      to: "import { MultiSelect, MultiSelectOption } from '../../components/ui/replacement-components';"
    },
    {
      from: "import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';",
      to: "import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/replacement-components';"
    }
  ];
  
  // Procesar cada archivo
  for (const file of filesToProcess) {
    try {
      const filePath = path.resolve(file);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Archivo no encontrado: ${filePath}`);
        continue;
      }
      
      console.log(`🔍 Procesando: ${file}`);
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Aplicar reemplazos
      for (const replacement of importReplacements) {
        content = content.replace(replacement.from, replacement.to);
      }
      
      // Guardar el archivo modificado
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Archivo modificado exitosamente: ${file}`);
    } catch (error) {
      console.error(`❌ Error al procesar ${file}:`, error);
    }
  }
};

// Ejecutar las funciones
console.log('🚀 Iniciando preparación para despliegue...');
createComponentAlias();
console.log('✅ Preparación para despliegue completada.');
