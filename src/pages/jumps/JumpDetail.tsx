import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select, SelectOption } from '../../components/ui/Select';
import { Jump } from '../../types';
import { getJumpById, createJump, updateJump, getJumpClients, associateClientToJump } from '../../api/jumpsApi';
import { SERVER_CONFIG } from '../../config';
import { getClients } from '../../api/clientsApi';

// Esquema de validación con Zod
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
 * Página de detalle de Jump para crear o editar
 */
const JumpDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNewJump = id === 'new';

  // Consultar los datos del jump si estamos editando
  const { data: jump, isLoading: isLoadingJump } = useQuery({
    queryKey: ['jump', id],
    queryFn: () => getJumpById(id || ''),
    enabled: !!id && !isNewJump,
  });

  // Consultar la lista de clientes
  const { data: clientsData = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  // Obtener clientes asociados al jump
  const { data: jumpClients = [], refetch: refetchJumpClients } = useQuery({
    queryKey: ['jumpClients', id],
    queryFn: () => getJumpClients(id || ''),
    enabled: !!id && !isNewJump,
  });

  // Estado para el cliente seleccionado
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  
  // Mutación para asociar un cliente al jump
  const associateClientMutation = useMutation({
    mutationFn: () => associateClientToJump(id || '', selectedClientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jumpClients', id] });
      setSelectedClientId('');
    },
  });
  
  // Maneja la asociación de un nuevo cliente al jump
  const handleAssociateClient = () => {
    if (id && selectedClientId) {
      associateClientMutation.mutate();
    }
  };

  // Formatear clientes para el selector
  const clients = clientsData.map(client => ({
    id: client.client_id,
    name: `${client.name} (${client.company})`,
  }));

  // Configuración de React Hook Form con validación Zod
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
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

  // Actualizar el formulario cuando se carguen los datos del jump
  useEffect(() => {
    if (jump && !isNewJump) {
      reset({
        name: jump.name,
        description: jump.description || '',
        status: jump.status,
        url: jump.url || '',
        github_repo: jump.github_repo || '',
        client_id: jump.client_id,
      });
    }
  }, [jump, reset, isNewJump]);

  // Mutación para crear un nuevo jump
  const createJumpMutation = useMutation({
    mutationFn: createJump,
    onSuccess: (data) => {
      console.log('Jump creado con éxito:', data);
      queryClient.invalidateQueries({ queryKey: ['jumps'] });
      navigate('/jumps');
    },
    onError: (error) => {
      console.error('Error al crear jump:', error);
    },
  });

  // Mutación para actualizar un jump existente
  const updateJumpMutation = useMutation({
    mutationFn: ({ jumpId, data }: { jumpId: string; data: Partial<Jump> }) => updateJump(jumpId, data),
    onSuccess: (data) => {
      console.log('Jump actualizado con éxito:', data);
      queryClient.invalidateQueries({ queryKey: ['jumps'] });
      queryClient.invalidateQueries({ queryKey: ['jump', id] });
      navigate('/jumps');
    },
    onError: (error) => {
      console.error('Error al actualizar jump:', error);
    },
  });

  const onSubmit = async (data: JumpFormData) => {
    // Añadir logs para depuración
    console.log('Enviando datos del formulario:', data);
    
    // Intentar un enfoque alternativo enviando los datos directamente
    if (isNewJump) {
      console.log('Creando nuevo jump mediante API directa...');
      try {
        const response = await fetch(`${SERVER_CONFIG.BASE_URL}/api/jumps`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.name,
            description: data.description || '',
            status: data.status,
            client_id: data.client_id || '',
            url: data.url || '',
            github_repo: data.github_repo || '',
          }),
        });
        
        console.log('Status de respuesta:', response.status);
        const responseText = await response.text();
        console.log('Respuesta:', responseText);
        
        if (response.ok) {
          console.log('Jump creado exitosamente');
          queryClient.invalidateQueries({ queryKey: ['jumps'] });
          
          // Redirección forzada en lugar de usar navigate
          window.location.href = '/jumps';
        } else {
          console.error('Error al crear jump:', responseText);
        }
      } catch (error) {
        console.error('Error en la solicitud:', error);
      }
    } else if (id) {
      console.log('Actualizando jump existente...', id);
      updateJumpMutation.mutate({ jumpId: id, data });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {!isNewJump ? 'Editar Jump' : 'Nuevo Jump'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/jumps')}>
          Volver
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{!isNewJump ? 'Detalles del Jump' : 'Crear Jump'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingJump && !isNewJump ? (
            <div className="py-8 text-center">Cargando datos del jump...</div>
          ) : (
            <>
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
              
              {/* Sección de clientes asociados - solo visible al editar un jump existente */}
              {!isNewJump && id && (
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Clientes Asociados</h3>
                  
                  {/* Lista de clientes asociados */}
                  <div className="mb-6">
                    {jumpClients.length > 0 ? (
                      <div className="space-y-2">
                        {jumpClients.map((client) => (
                          <div key={client.client_id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                            <div>
                              <p className="font-medium">{client.name}</p>
                              <p className="text-sm text-muted-foreground">{client.company}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No hay clientes asociados a este jump.</p>
                    )}
                  </div>
                  
                  {/* Formulario para asociar nuevos clientes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Select
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                      >
                        <option value="">Seleccionar cliente</option>
                        {clients
                          .filter(client => !jumpClients.some(jc => jc.client_id === client.id))
                          .map(client => (
                            <SelectOption key={client.id} value={client.id}>
                              {client.name}
                            </SelectOption>
                          ))}
                      </Select>
                    </div>
                    <Button 
                      type="button" 
                      disabled={!selectedClientId || associateClientMutation.isPending}
                      isLoading={associateClientMutation.isPending}
                      onClick={handleAssociateClient}
                    >
                      Asociar Cliente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
        {!isLoadingJump && (
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
              disabled={createJumpMutation.isPending || updateJumpMutation.isPending}
              isLoading={createJumpMutation.isPending || updateJumpMutation.isPending}
            >
              {!isNewJump ? 'Actualizar Jump' : 'Crear Jump'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default JumpDetail;
