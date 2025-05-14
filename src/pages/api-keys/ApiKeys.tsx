import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/Table';
import { ApiKey } from '../../types';
import { formatDate } from '../../lib/utils';

/**
 * Página de gestión de claves API
 */
const ApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [filteredApiKeys, setFilteredApiKeys] = useState<ApiKey[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // En una implementación real, llamaríamos a la API
    const mockApiKeys: ApiKey[] = [
      {
        key_id: 'apk_001',
        client_id: 'CLI001',
        name: 'Integración Tienda Online',
        key: 'sk_live_example1pWxOCfd1PssTR',
        is_active: true,
        created_at: '2023-04-10T15:30:45Z',
        expires_at: '2024-04-10T15:30:45Z',
        last_used: '2023-10-25T09:12:33Z'
      },
      {
        key_id: 'apk_002',
        client_id: 'CLI002',
        name: 'API Agenda',
        key: 'sk_live_example2RSgHtYeQpz',
        is_active: true,
        created_at: '2023-06-22T11:15:30Z',
        expires_at: '2024-06-22T11:15:30Z',
        last_used: '2023-10-30T14:20:10Z'
      },
      {
        key_id: 'apk_003',
        client_id: 'CLI003',
        name: 'Integracion CRM',
        key: 'sk_live_example3LmKPqwYrTs',
        is_active: false,
        created_at: '2023-01-05T10:45:22Z',
        expires_at: '2024-01-05T10:45:22Z',
        last_used: '2023-09-15T08:30:45Z'
      },
      {
        key_id: 'apk_004',
        name: 'Acceso General',
        key: 'sk_live_example4ZxCvBnMaS',
        is_active: true,
        created_at: '2023-08-15T16:20:10Z',
        expires_at: '2024-08-15T16:20:10Z'
      },
      {
        key_id: 'apk_005',
        client_id: 'CLI001',
        name: 'Sandbox Testing',
        key: 'sk_test_example5QwErTyUiO',
        is_active: true,
        created_at: '2023-09-30T09:10:15Z',
        expires_at: '2024-09-30T09:10:15Z',
        last_used: '2023-10-01T11:22:33Z'
      }
    ];
    
    setApiKeys(mockApiKeys);
    setFilteredApiKeys(mockApiKeys);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Aplicar filtros por término de búsqueda
    if (searchTerm.trim() === '') {
      setFilteredApiKeys(apiKeys);
    } else {
      const lowercaseSearchTerm = searchTerm.toLowerCase();
      const filtered = apiKeys.filter(key => 
        key.name.toLowerCase().includes(lowercaseSearchTerm) || 
        (key.client_id && key.client_id.toLowerCase().includes(lowercaseSearchTerm))
      );
      setFilteredApiKeys(filtered);
    }
  }, [apiKeys, searchTerm]);

  // Función para mostrar parte de la clave API de forma segura
  const maskApiKey = (key: string) => {
    if (!key) return '';
    const prefix = key.substring(0, 7);
    const suffix = key.substring(key.length - 4);
    return `${prefix}...${suffix}`;
  };

  // Función para copiar la clave al portapapeles
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Clave API copiada al portapapeles');
      })
      .catch(err => {
        console.error('Error al copiar al portapapeles:', err);
      });
  };

  const handleDeactivateKey = (keyId: string) => {
    // En una implementación real, llamaríamos a la API
    // Para el MVP, actualizamos el estado local
    setApiKeys(prevKeys => 
      prevKeys.map(key => 
        key.key_id === keyId ? { ...key, is_active: false } : key
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Claves API</h1>
        <Link to="/api-keys/new">
          <Button>Nueva Clave API</Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Claves API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Input
              placeholder="Buscar por nombre o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          {isLoading ? (
            <div className="py-8 text-center">Cargando claves API...</div>
          ) : filteredApiKeys.length === 0 ? (
            <div className="py-8 text-center">
              No se encontraron claves API que coincidan con la búsqueda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Clave</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creación</TableHead>
                  <TableHead>Expiración</TableHead>
                  <TableHead>Último Uso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApiKeys.map((apiKey) => (
                  <TableRow key={apiKey.key_id}>
                    <TableCell className="font-medium">{apiKey.name}</TableCell>
                    <TableCell>
                      {apiKey.client_id ? (
                        <Link to={`/clients/${apiKey.client_id}`} className="text-primary hover:underline">
                          {apiKey.client_id}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">General</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="bg-muted px-2 py-1 rounded text-xs">
                          {maskApiKey(apiKey.key)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(apiKey.key)}
                          className="text-xs text-primary hover:text-primary/80"
                        >
                          Copiar
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        apiKey.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {apiKey.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(apiKey.created_at)}</TableCell>
                    <TableCell>{apiKey.expires_at ? formatDate(apiKey.expires_at) : 'No expira'}</TableCell>
                    <TableCell>
                      {apiKey.last_used ? formatDate(apiKey.last_used) : 'Nunca usada'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link to={`/api-keys/${apiKey.key_id}`}>
                          <Button variant="ghost" size="sm">
                            Detalles
                          </Button>
                        </Link>
                        {apiKey.is_active && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeactivateKey(apiKey.key_id)}
                          >
                            Desactivar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeys;
