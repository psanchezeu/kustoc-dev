import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select, SelectOption } from '../../components/ui/Select';
import { ApiKey } from '../../types';
import { formatDate } from '../../lib/utils';

// Esquema de validación
const apiKeySchema = z.object({
  name: z.string().min(1, { message: 'El nombre es obligatorio' }),
  client_id: z.string().optional(),
  is_active: z.boolean().default(true),
  expires_at: z.string().optional(),
});

type ApiKeyFormData = z.infer<typeof apiKeySchema>;

/**
 * Componente para crear o editar claves API
 */
const ApiKeyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = id !== 'new';
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [showKey, setShowKey] = useState(false);

  // Configuración del formulario con React Hook Form y Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ApiKeyFormData>({
    resolver: zodResolver(apiKeySchema) as any, // Usamos any para evitar el error de tipo
    defaultValues: {
      name: '',
      client_id: '',
      is_active: true,
      expires_at: '',
    },
  });

  useEffect(() => {
    // Cargar lista de clientes (para el MVP usamos datos de ejemplo)
    const mockClients = [
      { id: 'CLI001', name: 'Juan Pérez (Taller Pérez S.L.)' },
      { id: 'CLI002', name: 'Ana Martínez (Clínica DentalCare)' },
      { id: 'CLI003', name: 'Carlos Rodríguez (Asesoría Fiscal CR)' },
      { id: 'CLI004', name: 'Laura Gómez (Restaurante La Buena Mesa)' },
    ];
    setClients(mockClients);

    // Si estamos en modo edición, cargar los datos de la clave API
    if (isEditing && id) {
      setIsLoading(true);
      
      // Simular llamada a la API para el MVP
      setTimeout(() => {
        const mockApiKey: ApiKey = {
          key_id: id,
          name: 'API Agenda',
          client_id: 'CLI002',
          key: 'sk_live_example2RSgHtYeQpz',
          is_active: true,
          created_at: '2023-06-22T11:15:30Z',
          expires_at: '2024-06-22T11:15:30Z',
          last_used: '2023-10-30T14:20:10Z'
        };
        
        setApiKey(mockApiKey);
        
        // Formatear fecha para el campo de fecha del formulario
        const expiresAt = mockApiKey.expires_at 
          ? new Date(mockApiKey.expires_at).toISOString().split('T')[0]
          : '';
        
        reset({
          name: mockApiKey.name,
          client_id: mockApiKey.client_id || '',
          is_active: mockApiKey.is_active,
          expires_at: expiresAt,
        });
        
        setIsLoading(false);
      }, 800);
    }
  }, [id, isEditing, reset]);

  const onSubmit = async (data: ApiKeyFormData) => {
    setIsLoading(true);
    
    try {
      // En una implementación real, llamaríamos a la API
      // Para el MVP, simulamos el proceso

      // Formatear datos para enviar al servidor
      const apiKeyData = {
        ...data,
        expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : undefined,
      };
      
      console.log('Datos a enviar:', apiKeyData);
      
      // Simular respuesta exitosa
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redireccionar a la lista de claves API
      navigate('/api-keys');
    } catch (error) {
      console.error('Error al guardar la clave API:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!id) return;
    
    if (window.confirm('¿Estás seguro de regenerar esta clave API? La clave anterior dejará de funcionar.')) {
      setIsLoading(true);
      
      try {
        // En una implementación real, llamaríamos a la API
        // Para el MVP, simulamos el proceso
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulamos una nueva clave generada
        const newKey = 'sk_live_' + Math.random().toString(36).substring(2, 15);
        
        setApiKey(prevKey => {
          if (prevKey) {
            return {
              ...prevKey,
              key: newKey,
            };
          }
          return null;
        });
        
        setShowKey(true); // Mostrar la nueva clave
      } catch (error) {
        console.error('Error al regenerar la clave API:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleShowKey = () => {
    setShowKey(!showKey);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Clave API copiada al portapapeles');
      })
      .catch(err => {
        console.error('Error al copiar al portapapeles:', err);
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Editar Clave API' : 'Nueva Clave API'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/api-keys')}>
          Volver
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? `Detalles de la Clave API: ${apiKey?.name}` : 'Crear Clave API'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && isEditing ? (
            <div className="py-8 text-center">Cargando datos de la clave API...</div>
          ) : (
            <div className="space-y-6">
              {isEditing && apiKey && (
                <div className="p-4 border rounded-md bg-muted">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-1">Clave API</h3>
                      <div className="flex items-center space-x-2">
                        <code className="bg-background px-3 py-2 rounded text-sm font-mono w-full">
                          {showKey ? apiKey.key : '•'.repeat(apiKey.key.length)}
                        </code>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={toggleShowKey}
                        >
                          {showKey ? 'Ocultar' : 'Mostrar'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(apiKey.key)}
                        >
                          Copiar
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="block text-muted-foreground">ID de Clave:</span>
                        <span>{apiKey.key_id}</span>
                      </div>
                      <div>
                        <span className="block text-muted-foreground">Fecha de Creación:</span>
                        <span>{formatDate(apiKey.created_at)}</span>
                      </div>
                      {apiKey.last_used && (
                        <div>
                          <span className="block text-muted-foreground">Último Uso:</span>
                          <span>{formatDate(apiKey.last_used)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        variant="secondary" 
                        onClick={handleRegenerateKey}
                        disabled={isLoading}
                      >
                        Regenerar Clave
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <form id="api-key-form" onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input 
                      id="name" 
                      {...register('name')}
                      placeholder="Nombre descriptivo de la clave API"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="client_id" optional>Cliente</Label>
                    <Select 
                      id="client_id" 
                      {...register('client_id')}
                    >
                      <option value="">Sin asociar a cliente</option>
                      {clients.map(client => (
                        <SelectOption key={client.id} value={client.id}>
                          {client.name}
                        </SelectOption>
                      ))}
                    </Select>
                    {errors.client_id && (
                      <p className="text-sm text-red-500">{errors.client_id.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="expires_at" optional>Fecha de Expiración</Label>
                    <Input 
                      id="expires_at" 
                      type="date" 
                      {...register('expires_at')}
                    />
                    <p className="text-xs text-muted-foreground">
                      Dejar en blanco si la clave no expira
                    </p>
                    {errors.expires_at && (
                      <p className="text-sm text-red-500">{errors.expires_at.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2 flex items-center">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        {...register('is_active')}
                      />
                      <Label htmlFor="is_active">Clave Activa</Label>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
        </CardContent>
        {!isLoading && (
          <CardFooter className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/api-keys')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="api-key-form"
              isLoading={isLoading}
            >
              {isEditing ? 'Actualizar' : 'Crear Clave API'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ApiKeyDetail;
