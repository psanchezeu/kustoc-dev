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
import { Jump } from '../../types';

// Esquema de validación con Zod
const jumpSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es obligatorio' }),
  description: z.string().min(1, { message: 'La descripción es obligatoria' }),
  status: z.enum(['planning', 'in_progress', 'review', 'completed', 'archived']),
  url: z.string().url({ message: 'La URL debe ser válida' }).optional().or(z.literal('')),
  github_repo: z.string().url({ message: 'La URL del repositorio debe ser válida' }).optional().or(z.literal('')),
  client_id: z.string().min(1, { message: 'El cliente es obligatorio' }),
});

type JumpFormData = z.infer<typeof jumpSchema>;

/**
 * Página de detalle de Jump para crear o editar
 */
const JumpDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const isEditing = id !== 'new';

  // Configuración de React Hook Form con validación Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<JumpFormData>({
    resolver: zodResolver(jumpSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'planning',
      url: '',
      github_repo: '',
      client_id: '',
    },
  });

  useEffect(() => {
    // Cargar la lista de clientes (simulado para el MVP)
    const mockClients = [
      { id: 'CLI001', name: 'Juan Pérez (Taller Pérez S.L.)' },
      { id: 'CLI002', name: 'Ana Martínez (Clínica DentalCare)' },
      { id: 'CLI003', name: 'Carlos Rodríguez (Asesoría Fiscal CR)' },
      { id: 'CLI004', name: 'Laura Gómez (Restaurante La Buena Mesa)' },
    ];
    setClients(mockClients);

    // Si estamos editando, cargar los datos del jump existente
    if (isEditing) {
      setIsLoading(true);
      // En una implementación real, llamaríamos a la API
      // Para el MVP, simulamos la carga de datos
      setTimeout(() => {
        const mockJump: Jump = {
          jump_id: id!,
          client_id: 'CLI002',
          name: 'CRM Dental',
          description: 'Sistema de gestión para clínicas dentales con agenda y expedientes',
          status: 'in_progress',
          github_repo: 'https://github.com/kustoc/jump-dental-crm',
          created_at: '2023-03-05T09:15:00Z',
          updated_at: '2023-04-20T14:45:00Z',
        };

        reset({
          name: mockJump.name,
          description: mockJump.description,
          status: mockJump.status,
          url: mockJump.url || '',
          github_repo: mockJump.github_repo || '',
          client_id: mockJump.client_id,
        });
        
        setIsLoading(false);
      }, 800);
    }
  }, [id, isEditing, reset]);

  const onSubmit = async (data: JumpFormData) => {
    setIsLoading(true);
    
    try {
      // En una implementación real, enviaríamos los datos a la API
      // Para el MVP, simulamos una respuesta exitosa después de un breve retraso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Datos del formulario:', data);
      
      // Redirigir a la lista de jumps después de guardar
      navigate('/jumps');
    } catch (error) {
      console.error('Error al guardar el jump:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Editar Jump' : 'Nuevo Jump'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/jumps')}>
          Volver
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Detalles del Jump' : 'Crear Jump'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && isEditing ? (
            <div className="py-8 text-center">Cargando datos del jump...</div>
          ) : (
            <form id="jump-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input 
                    id="name" 
                    {...register('name')}
                    placeholder="Nombre del jump"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
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
                    <p className="text-sm text-red-500">{errors.client_id.message}</p>
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
                  <p className="text-sm text-red-500">{errors.description.message}</p>
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
                    <p className="text-sm text-red-500">{errors.status.message}</p>
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
                    <p className="text-sm text-red-500">{errors.url.message}</p>
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
                    <p className="text-sm text-red-500">{errors.github_repo.message}</p>
                  )}
                </div>
              </div>
            </form>
          )}
        </CardContent>
        {!isLoading && (
          <CardFooter className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/jumps')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="jump-form"
              isLoading={isLoading}
            >
              {isEditing ? 'Actualizar Jump' : 'Crear Jump'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default JumpDetail;
