import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  // Verificar si estamos en modo edición (el ID existe y no es 'new')
  const isEditing = id !== undefined && id !== 'new';
  const [project, setProject] = useState<Project | null>(null);

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
    // Cargar la lista de clientes desde la API
    const fetchClients = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/clients');
        if (!response.ok) {
          throw new Error(`Error al cargar clientes: ${response.statusText}`);
        }
        const data = await response.json();
        const formattedClients = data.map((client: any) => ({
          id: client.client_id,
          name: `${client.name} (${client.company || 'Independiente'})`,
        }));
        setClients(formattedClients);
      } catch (err) {
        console.error('Error al cargar clientes:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar clientes');
      }
    };

    // Cargar el proyecto existente si estamos en modo edición
    const fetchProject = async () => {
      if (!isEditing || !id) return;
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`http://localhost:3001/api/projects/${id}`);
        if (!response.ok) {
          throw new Error(`Error al cargar proyecto: ${response.statusText}`);
        }
        
        const projectData = await response.json();
        console.log('Datos de proyecto cargados:', projectData);
        
        setProject(projectData);
        
        reset({
          name: projectData.name,
          description: projectData.description,
          status: projectData.status,
          client_id: projectData.client_id,
        });
      } catch (err) {
        console.error('Error al cargar el proyecto:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar el proyecto');
      } finally {
        setIsLoading(false);
      }
    };

    // Ejecutar las funciones de carga de datos
    fetchClients();
    fetchProject();
  }, [id, isEditing, reset]);

  const onSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Enviar los datos a la API usando el endpoint correcto
      const url = isEditing 
        ? `http://localhost:3001/api/projects/${id}` 
        : 'http://localhost:3001/api/projects';
      const method = isEditing ? 'PUT' : 'POST';
      
      console.log('Enviando datos al servidor:', data);
      console.log('URL:', url, 'Método:', method);
      
      // Realizar la llamada a la API
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || 
          `Error al guardar el proyecto: ${response.status} ${response.statusText}`
        );
      }
      
      // Obtener la respuesta y mostrar en console para debug
      const result = await response.json();
      console.log('Respuesta del servidor:', result);
      
      // Invalidar consultas para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      // Redirigir a la lista de proyectos
      navigate('/projects');
    } catch (err) {
      console.error('Error al guardar el proyecto:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al guardar el proyecto');
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
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                  {error}
                </div>
              )}
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
            </>
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
