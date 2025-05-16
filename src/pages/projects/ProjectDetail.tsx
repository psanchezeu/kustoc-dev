import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select, SelectOption } from '../../components/ui/Select';
import { Autocomplete, AutocompleteOption } from '../../components/ui/Autocomplete';
import { MultiSelect, MultiSelectOption } from '../../components/ui/MultiSelect';
import { Project, Jump, Copilot } from '../../types';
import { formatDate } from '../../lib/utils';
import { SERVER_CONFIG } from '../../config';
import {
  getProjectById,
  createProject,
  updateProject,
  getAvailableJumps,
  getAvailableCopilots,
  assignJumpToProject,
  assignCopilotToProject,
  assignMultipleCopilotsToProject,
  getProjectCopilots
} from '../../api/projectsApi';

// Esquema de validación con Zod
const projectSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es obligatorio' }),
  description: z.string().optional(),
  status: z.enum(['planning', 'in_progress', 'on_hold', 'completed']),
  client_id: z.string().min(1, { message: 'El cliente es obligatorio' }),
  jump_id: z.string().min(1, { message: 'El jump es obligatorio' }),
  copilot_id: z.string().optional(), // Mantenemos por compatibilidad
  copilots: z.array(z.string()).optional(),
  start_date: z.string().min(1, { message: 'La fecha de inicio es obligatoria' }),
  estimated_end_date: z.string().optional(),
  contracted_hours: z.number().min(0, { message: 'Las horas contratadas deben ser al menos 0' }),
  consumed_hours: z.number().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

/**
 * Función para formatear fechas de manera segura
 */
const safeFormatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return formatDate(dateString);
};

/**
 * Página de detalle de Proyecto para crear o editar
 */
const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para los campos de autocompletado y multi-select
  const [clients, setClients] = useState<AutocompleteOption[]>([]);
  const [jumps, setJumps] = useState<AutocompleteOption[]>([]);
  const [copilots, setCopilots] = useState<MultiSelectOption[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedJump, setSelectedJump] = useState<string>('');
  const [selectedJumpId, setSelectedJumpId] = useState<string>('');
  const [selectedCopilots, setSelectedCopilots] = useState<MultiSelectOption[]>([]);
  
  // Verificar si estamos en modo edición (el ID existe y no es 'new')
  const isEditing = id !== undefined && id !== 'new';
  const [project, setProject] = useState<Project | null>(null);
  const [projectCopilots, setProjectCopilots] = useState<Copilot[]>([]);

  // Configuración de React Hook Form con validación Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,   // Añadimos setValue para actualizar valores programáticamente
    trigger,    // Añadimos trigger para activar validaciones manualmente
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'planning' as const,
      client_id: '',
      jump_id: '',
      copilot_id: '',
      start_date: new Date().toISOString().split('T')[0],
      estimated_end_date: '',
      contracted_hours: 0,
      consumed_hours: 0,
    },
  });

  // Función para cargar los clientes desde la API
  const fetchClients = async () => {
    try {
      const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/clients`);
      if (!response.ok) {
        throw new Error(`Error al cargar clientes: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Clientes cargados:', data);
      const formattedClients = data.map((client: any) => ({
        id: client.client_id,
        name: `${client.name} (${client.company || 'Independiente'})`,
      }));
      setClients(formattedClients);
      return formattedClients;
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar clientes');
      return [];
    }
  };
  
  // Función para cargar los jumps disponibles
  const fetchJumps = async () => {
    try {
      const jumpsData = await getAvailableJumps();
      console.log('Jumps cargados:', jumpsData);
      const formattedJumps = jumpsData.map((jump: Jump) => ({
        id: jump.jump_id,
        name: `${jump.name}`,
      }));
      setJumps(formattedJumps);
      return formattedJumps;
    } catch (err) {
      console.error('Error al cargar jumps:', err);
      return [];
    }
  };
  
  // Función para cargar los copilotos disponibles
  const fetchCopilots = async () => {
    try {
      const copilotsData = await getAvailableCopilots();
      console.log('Copilotos disponibles cargados:', copilotsData);
      const formattedCopilots = copilotsData.map((copilot: Copilot) => {
        // Manejar specialty de forma segura, ya sea un array o una cadena JSON
        let specialtyStr = '';
        try {
          if (typeof copilot.specialty === 'string') {
            const specialtyArray = JSON.parse(copilot.specialty);
            if (Array.isArray(specialtyArray)) {
              specialtyStr = specialtyArray.join(', ');
            } else {
              specialtyStr = String(copilot.specialty);
            }
          } else if (Array.isArray(copilot.specialty)) {
            specialtyStr = copilot.specialty.join(', ');
          }
        } catch (e) {
          specialtyStr = String(copilot.specialty || '');
        }
        
        return {
          id: copilot.copilot_id,
          name: `${copilot.name} ${specialtyStr ? `- ${specialtyStr}` : ''}`,
        };
      });
      setCopilots(formattedCopilots);
      return formattedCopilots;
    } catch (err) {
      console.error('Error al cargar copilotos:', err);
      return [];
    }
  };

  // Función para cargar el cliente seleccionado
  const loadSelectedClient = async (clientId: string) => {
    if (!clientId) return;
    
    console.log('Cargando cliente con ID:', clientId);
    try {
      // Primero buscar en la lista local
      if (clients.length > 0) {
        const clientMatch = clients.find(client => client.id === clientId);
        if (clientMatch) {
          setSelectedClientId(clientMatch.id);
          setSelectedClient(clientMatch.name);
          console.log('Cliente encontrado en lista local:', clientMatch);
          return;
        }
      }
      
      // Si no se encuentra, hacer petición directa a la API
      const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/clients/${clientId}`);
      if (response.ok) {
        const clientData = await response.json();
        setSelectedClientId(clientData.client_id);
        setSelectedClient(`${clientData.name} (${clientData.company || 'Independiente'})`);
        console.log('Cliente cargado desde API:', clientData);
      } else {
        console.warn(`No se pudo cargar el cliente con ID ${clientId}`);
      }
    } catch (error) {
      console.error('Error al cargar cliente:', error);
    }
  };
  
  // Función para cargar el jump seleccionado
  const loadSelectedJump = async (jumpId: string) => {
    if (!jumpId) return;
    
    console.log('Cargando jump con ID:', jumpId);
    try {
      // Primero buscar en la lista local
      if (jumps.length > 0) {
        const jumpMatch = jumps.find(jump => jump.id === jumpId);
        if (jumpMatch) {
          setSelectedJumpId(jumpMatch.id);
          setSelectedJump(jumpMatch.name);
          console.log('Jump encontrado en lista local:', jumpMatch);
          return;
        }
      }
      
      // Si no está en la lista local, intentar cargarlo directamente
      const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/jumps/${jumpId}`);
      if (response.ok) {
        const jumpData = await response.json();
        setSelectedJumpId(jumpData.jump_id);
        setSelectedJump(jumpData.name);
        console.log('Jump cargado desde API:', jumpData);
      } else {
        console.warn(`No se pudo cargar el jump con ID ${jumpId}`);
      }
    } catch (error) {
      console.error('Error al cargar jump:', error);
    }
  };
  
  // Función para cargar los copilotos del proyecto
  const loadProjectCopilots = async (projectId: string) => {
    if (!projectId) return;
    
    console.log('Cargando copilotos para el proyecto:', projectId);
    try {
      // Intentamos cargar directamente desde la API dedicada
      const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/projects/${projectId}/copilots`);
      
      if (!response.ok) {
        console.warn(`Error al cargar copilotos del proyecto ${projectId}: ${response.statusText}`);
        return;
      }
      
      const copilotsData = await response.json();
      console.log('Copilotos del proyecto (respuesta API):', copilotsData);
      
      if (copilotsData && Array.isArray(copilotsData) && copilotsData.length > 0) {
        const formattedCopilots = copilotsData.map(copilot => {
          // Formatear para el componente MultiSelect
          let specialtyStr = '';
          try {
            if (typeof copilot.specialty === 'string') {
              const specialtyArray = JSON.parse(copilot.specialty);
              if (Array.isArray(specialtyArray)) {
                specialtyStr = specialtyArray.join(', ');
              } else {
                specialtyStr = String(copilot.specialty);
              }
            } else if (Array.isArray(copilot.specialty)) {
              specialtyStr = copilot.specialty.join(', ');
            }
          } catch (e) {
            specialtyStr = String(copilot.specialty || '');
          }
          
          return {
            id: copilot.copilot_id,
            name: `${copilot.name} ${specialtyStr ? `- ${specialtyStr}` : ''}`,
          };
        });
        
        setSelectedCopilots(formattedCopilots);
        console.log('Copilotos formateados para el selector:', formattedCopilots);
        
        // Actualizar el campo del formulario para validación
        const copilotIds = formattedCopilots.map(c => c.id);
        setValue('copilots', copilotIds);
        
        // Si hay copilotos, establecer el primero como principal para compatibilidad
        if (formattedCopilots.length > 0) {
          setValue('copilot_id', formattedCopilots[0].id);
        }
      } else {
        // Si no hay copilotos, limpiar la selección
        setSelectedCopilots([]);
        setValue('copilots', []);
        setValue('copilot_id', '');
      }
    } catch (error) {
      console.error('Error al cargar copilotos del proyecto:', error);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // 1. Primero cargamos las listas de clientes, jumps y copilotos
        await Promise.all([
          fetchClients(),
          fetchJumps(),
          fetchCopilots()
        ]);
        
        // 2. Después cargamos los datos del proyecto (si estamos en modo edición)
        if (isEditing && id) {
          const projectData = await getProjectById(id);
          if (!projectData) {
            setError('No se pudo obtener el proyecto con ID: ' + id);
            return;
          }
          console.log('Datos de proyecto cargados:', projectData);
          setProject(projectData);
          
          // 3. Establecer los valores del formulario
          setValue('name', projectData.name || '');
          setValue('description', projectData.description || '');
          setValue('status', projectData.status);
          setValue('client_id', projectData.client_id);
          setValue('jump_id', projectData.jump_id);
          setValue('copilot_id', projectData.copilot_id || '');
          setValue('start_date', projectData.start_date?.split('T')[0] || '');
          setValue('estimated_end_date', projectData.estimated_end_date?.split('T')[0] || '');
          setValue('contracted_hours', projectData.contracted_hours || 0);
          setValue('consumed_hours', projectData.consumed_hours || 0);
          
          // 4. Cargar información del cliente seleccionado
          await loadSelectedClient(projectData.client_id);
          
          // 5. Cargar información del jump seleccionado
          await loadSelectedJump(projectData.jump_id);
          
          // 6. Cargar los copilotos asignados
          await loadProjectCopilots(id);
        }
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAllData();
  }, [id, isEditing, setValue]);



  const onSubmit = async (data: ProjectFormData) => {
    setIsLoading(true);
    setError(null);
    // ...
    try {
      // Preparar los datos del proyecto utilizando los valores de los componentes de autocompletado
      const projectData = {
        name: data.name,
        description: data.description || '',
        status: data.status,
        // Usar el ID seleccionado del autocompletado para cliente y jump
        client_id: selectedClientId || data.client_id,
        jump_id: selectedJumpId || data.jump_id,
        copilot_id: selectedCopilots.length > 0 ? selectedCopilots[0].id : data.copilot_id,
        start_date: data.start_date,
        estimated_end_date: data.estimated_end_date || undefined,
        contracted_hours: data.contracted_hours,
        consumed_hours: data.consumed_hours || 0,
      };
      
      console.log('Datos del proyecto a guardar:', projectData);
      
      // Verificar que los campos obligatorios están presentes
      if (!projectData.client_id) {
        throw new Error('Debe seleccionar un cliente');
      }
      
      if (!projectData.jump_id) {
        throw new Error('Debe seleccionar un Jump');
      }
      
      let savedProject;
      
      // Crear o actualizar el proyecto
      if (isEditing && id) {
        savedProject = await updateProject(id, projectData);
        if (!savedProject) {
          throw new Error(`Error al actualizar el proyecto ${id}`);
        }
      } else {
        savedProject = await createProject(projectData);
        if (!savedProject) {
          throw new Error('Error al crear el proyecto');
        }
      }
      
      const projectId = savedProject.project_id;
      
      // Asignar múltiples copilotos al proyecto
      const copilotIds = selectedCopilots.map(copilot => copilot.id);
      if (copilotIds.length > 0) {
        console.log(`Asignando ${copilotIds.length} copilotos al proyecto ${projectId}:`, copilotIds);
        
        try {
          await assignMultipleCopilotsToProject(projectId, copilotIds);
        } catch (copilotErr) {
          console.warn(`Error al asignar copilotos al proyecto ${projectId}:`, copilotErr);
          // No fallamos todo el proceso solo por esto
        }
      } else {
        console.log('No hay copilotos seleccionados para asignar');
      }
      
      // Invalidar la caché de consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      
      // Redireccionar a la vista de listado de proyectos
      navigate('/projects');
    } catch (err) {
      console.error(`Error al ${isEditing ? 'actualizar' : 'crear'} el proyecto:`, err);
      setError(err instanceof Error ? err.message : 'Ha ocurrido un error');
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
          {isEditing && project && (
            <div className="text-sm text-gray-500">
              ID: {project.project_id} | Iniciado: {safeFormatDate(project.start_date)}
            </div>
          )}
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
                  <Autocomplete
                    id="client_id"
                    options={clients}
                    value={selectedClient}
                    onChange={(value) => {
                      setSelectedClient(value);
                      // Actualizar el valor del campo de react-hook-form
                      const matchingClient = clients.find(c => c.name === value);
                      if (matchingClient) {
                        setSelectedClientId(matchingClient.id);
                        // Actualiza el valor en el formulario
                        setValue('client_id', matchingClient.id);
                      } else {
                        setSelectedClientId("");
                        setValue('client_id', "");
                      }
                    }}
                    onSelect={(option) => {
                      setSelectedClientId(option.id);
                      setSelectedClient(option.name);
                      // Actualiza el valor en el formulario
                      setValue('client_id', option.id);
                      // Trigger de validación
                      trigger('client_id');
                    }}
                    placeholder="Buscar cliente..."
                    error={errors.client_id?.message}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jump_id">Jump Relacionado</Label>
                  <Autocomplete
                    id="jump_id"
                    options={jumps}
                    value={selectedJump}
                    onChange={(value) => {
                      setSelectedJump(value);
                      // Actualizar el valor del campo de react-hook-form
                      const matchingJump = jumps.find(j => j.name === value);
                      if (matchingJump) {
                        setSelectedJumpId(matchingJump.id);
                        // Actualiza el valor en el formulario
                        setValue('jump_id', matchingJump.id);
                      } else {
                        setSelectedJumpId("");
                        setValue('jump_id', "");
                      }
                    }}
                    onSelect={(option) => {
                      setSelectedJumpId(option.id);
                      setSelectedJump(option.name);
                      // Actualiza el valor en el formulario
                      setValue('jump_id', option.id);
                      // Trigger de validación
                      trigger('jump_id');
                    }}
                    placeholder="Buscar jump..."
                    error={errors.jump_id?.message}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="copilots">Copilotos Asignados</Label>
                  <MultiSelect
                    id="copilots"
                    options={copilots}
                    selectedOptions={selectedCopilots}
                    onChange={(options) => {
                      setSelectedCopilots(options);
                      // Actualizar el valor del primer copiloto para compatibilidad
                      if (options.length > 0) {
                        setValue('copilot_id', options[0].id);
                      } else {
                        setValue('copilot_id', '');
                      }
                      
                      // Actualizar el array de ids de copilotos
                      const copilotIds = options.map(option => option.id);
                      setValue('copilots', copilotIds);
                    }}
                    placeholder="Seleccionar copilotos..."
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Puedes asignar múltiples copilotos a este proyecto.
                  </p>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Fecha de inicio</Label>
                  <Input 
                    id="start_date" 
                    type="date"
                    {...register('start_date')}
                  />
                  {errors.start_date && (
                    <p className="text-sm text-red-500">{errors.start_date.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="estimated_end_date">Fecha estimada de finalización</Label>
                  <Input 
                    id="estimated_end_date" 
                    type="date"
                    {...register('estimated_end_date')}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="contracted_hours">Horas contratadas</Label>
                  <Input 
                    id="contracted_hours" 
                    type="number"
                    min="0"
                    step="1"
                    {...register('contracted_hours', { valueAsNumber: true })}
                  />
                  {errors.contracted_hours && (
                    <p className="text-sm text-red-500">{errors.contracted_hours.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="consumed_hours">Horas consumidas</Label>
                  <Input 
                    id="consumed_hours" 
                    type="number"
                    min="0"
                    step="0.5"
                    {...register('consumed_hours', { valueAsNumber: true })}
                  />
                </div>
              </div>
              </form>
              
              {isEditing && project && (
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Información relacionada</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Información del Cliente */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-primary mb-2">Cliente</h4>
                      <div className="text-sm">
                        <p>ID: {project.client_id}</p>
                        <p className="mt-2">
                          <Link to={`/clients/${project.client_id}`} className="text-primary hover:underline">
                            Ver detalles del cliente
                          </Link>
                        </p>
                      </div>
                    </div>
                    
                    {/* Información del Jump */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-primary mb-2">Jump relacionado</h4>
                      <div className="text-sm">
                        {project.jump_id ? (
                          <>
                            <p>ID: {project.jump_id}</p>
                            <p className="mt-2">
                              <Link to={`/jumps/${project.jump_id}`} className="text-primary hover:underline">
                                Ver detalles del jump
                              </Link>
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-500">No hay jump asociado a este proyecto</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Información del Copiloto */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-primary mb-2">Copiloto asignado</h4>
                      <div className="text-sm">
                        {project.copilot_id ? (
                          <>
                            <p>ID: {project.copilot_id}</p>
                            <p className="mt-2">
                              <Link to={`/copilots/${project.copilot_id}`} className="text-primary hover:underline">
                                Ver perfil del copiloto
                              </Link>
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-500">No hay copiloto asignado a este proyecto</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
