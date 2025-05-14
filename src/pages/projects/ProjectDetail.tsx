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
import { Project } from '../../types';
import { formatDate } from '../../lib/utils';

// Esquema de validación con Zod
const projectSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es obligatorio' }),
  description: z.string().min(1, { message: 'La descripción es obligatoria' }),
  status: z.enum(['planning', 'in_progress', 'on_hold', 'completed']),
  client_id: z.string().min(1, { message: 'El cliente es obligatorio' }),
});

type ProjectFormData = z.infer<typeof projectSchema>;

/**
 * Página de detalle de Proyecto para crear o editar
 */
const ProjectDetail = () => {
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
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'planning',
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

    // Si estamos editando, cargar los datos del proyecto existente
    if (isEditing) {
      setIsLoading(true);
      // En una implementación real, llamaríamos a la API
      // Para el MVP, simulamos la carga de datos
      setTimeout(() => {
        const mockProject: Project = {
          project_id: id!,
          client_id: 'CLI002',
          name: 'Sistema de Reservas Online',
          description: 'Implementación de plataforma para gestionar citas y reservas',
          status: 'planning',
          created_at: '2023-09-22T11:15:00Z',
          updated_at: '2023-09-22T11:15:00Z',
        };

        reset({
          name: mockProject.name,
          description: mockProject.description,
          status: mockProject.status,
          client_id: mockProject.client_id,
        });
        
        setIsLoading(false);
      }, 800);
    }
  }, [id, isEditing, reset]);

  const onSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);
    
    try {
      // En una implementación real, enviaríamos los datos a la API
      // Para el MVP, simulamos una respuesta exitosa después de un breve retraso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Datos del formulario:', data);
      
      // Redirigir a la lista de proyectos después de guardar
      navigate('/projects');
    } catch (error) {
      console.error('Error al guardar el proyecto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/projects')}>
          Volver
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Detalles del Proyecto' : 'Crear Proyecto'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && isEditing ? (
            <div className="py-8 text-center">Cargando datos del proyecto...</div>
          ) : (
            <form id="project-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input 
                    id="name" 
                    {...register('name')}
                    placeholder="Nombre del proyecto"
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
                  placeholder="Descripción detallada del proyecto"
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select 
                  id="status" 
                  {...register('status')}
                >
                  <SelectOption value="planning">Planificación</SelectOption>
                  <SelectOption value="in_progress">En Progreso</SelectOption>
                  <SelectOption value="on_hold">En Pausa</SelectOption>
                  <SelectOption value="completed">Completado</SelectOption>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-500">{errors.status.message}</p>
                )}
              </div>
            </form>
          )}
        </CardContent>
        {!isLoading && (
          <CardFooter className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/projects')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="project-form"
              isLoading={isLoading}
            >
              {isEditing ? 'Actualizar Proyecto' : 'Crear Proyecto'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ProjectDetail;
