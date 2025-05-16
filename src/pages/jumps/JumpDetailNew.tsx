import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SERVER_CONFIG } from '../../config';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Label } from '../../components/ui/Label';
import { Input } from '../../components/ui/Input';
import { Select, SelectOption } from '../../components/ui/Select';
import { getClients } from '../../api/clientsApi';

// Esquema de validación para el formulario de jump
const jumpSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es obligatorio' }),
  description: z.string().optional().default(''),
  status: z.enum(['planning', 'in_progress', 'review', 'completed', 'archived']).default('planning'),
  url: z.string().url({ message: 'La URL debe ser válida' }).optional().or(z.literal('')),
  github_repo: z.string().url({ message: 'La URL del repositorio debe ser válida' }).optional().or(z.literal('')),
  client_id: z.string().optional().default(''),
});

type JumpFormData = z.infer<typeof jumpSchema>;

/**
 * Componente para crear o editar un Jump
 */
export default function JumpDetailNew() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Determinar si es un nuevo jump
  const isNewJump = id === 'new';
  
  // Estados
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Consultar la lista de clientes
  const { data: clientsData = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  // Formatear clientes para el selector
  const clients = clientsData.map(client => ({
    id: client.client_id,
    name: `${client.name} (${client.company})`,
  }));
  
  // Configurar React Hook Form con validación Zod
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors, isSubmitting }
  } = useForm<JumpFormData>({
    resolver: zodResolver(jumpSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'planning',
      url: '',
      github_repo: '',
      client_id: '',
    }
  });
  
  // Cargar datos del jump si no es nuevo
  const { data: jumpData, isLoading: isLoadingJump } = useQuery({
    queryKey: ['jump', id],
    queryFn: async () => {
      try {
        const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/jumps/${id}`);
        if (!response.ok) {
          throw new Error('Error al obtener el jump');
        }
        return await response.json();
      } catch (error) {
        console.error(`Error al obtener jump con ID ${id}:`, error);
        return null;
      }
    },
    enabled: !isNewJump && !!id,
  });
  
  // Actualizar valores del formulario cuando se carguen los datos del jump
  useEffect(() => {
    if (jumpData && !isNewJump) {
      reset({
        name: jumpData.name,
        description: jumpData.description || '',
        status: jumpData.status,
        url: jumpData.url || '',
        github_repo: jumpData.github_repo || '',
        client_id: jumpData.client_id || '',
      });
    }
  }, [jumpData, reset, isNewJump]);
  
  // Manejar submit del formulario
  const onSubmit = async (data: JumpFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Enviando datos:', data);
      
      let apiUrl = `${SERVER_CONFIG.BASE_URL}/api/jumps`;
      let method = 'POST';
      
      // Si estamos editando un jump existente, cambiamos el endpoint y el método
      if (!isNewJump && id) {
        apiUrl = `${SERVER_CONFIG.BASE_URL}/api/jumps/${id}`;
        method = 'PUT';
        console.log('Actualizando jump existente, URL:', apiUrl);
      } else {
        console.log('Creando nuevo jump, URL:', apiUrl);
      }
      
      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.text();
      console.log('Respuesta:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData || 'Error al guardar el jump');
      }
      
      // Invalidar consultas para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['jumps'] });
      
      // Navegar a la lista de jumps
      navigate('/jumps');
    } catch (err) {
      console.error('Error al guardar:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isNewJump ? 'Nuevo Jump' : 'Editar Jump'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/jumps')}>
          Volver
        </Button>
      </div>
      
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>
            {isNewJump ? 'Crear Jump' : 'Detalles del Jump'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingJump && !isNewJump ? (
            <div className="py-8 text-center">Cargando datos del jump...</div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input 
                    id="name" 
                    {...register('name')}
                    placeholder="Nombre del jump"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="client_id">Cliente</Label>
                  <Select 
                    id="client_id" 
                    {...register('client_id')}
                  >
                    <option value="">Selecciona un cliente</option>
                    {clients.map(client => (
                      <SelectOption key={client.id} value={client.id}>
                        {client.name}
                      </SelectOption>
                    ))}
                  </Select>
                  {errors.client_id && (
                    <p className="text-sm text-destructive">{errors.client_id.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <textarea 
                  id="description"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('description')}
                  placeholder="Descripción detallada del jump"
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select 
                    id="status" 
                    {...register('status')}
                  >
                    <SelectOption value="planning">Planificación</SelectOption>
                    <SelectOption value="in_progress">En Progreso</SelectOption>
                    <SelectOption value="review">En Revisión</SelectOption>
                    <SelectOption value="completed">Completado</SelectOption>
                    <SelectOption value="archived">Archivado</SelectOption>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-destructive">{errors.status.message}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="url" optional>URL de Demo</Label>
                  <Input 
                    id="url" 
                    {...register('url')}
                    placeholder="https://ejemplo.com"
                  />
                  {errors.url && (
                    <p className="text-sm text-destructive">{errors.url.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="github_repo" optional>Repositorio GitHub</Label>
                  <Input 
                    id="github_repo" 
                    {...register('github_repo')}
                    placeholder="https://github.com/usuario/repo"
                  />
                  {errors.github_repo && (
                    <p className="text-sm text-destructive">{errors.github_repo.message}</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/jumps')}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || isSubmitting}
                >
                  {isLoading ? 'Guardando...' : isNewJump ? 'Crear Jump' : 'Actualizar Jump'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
