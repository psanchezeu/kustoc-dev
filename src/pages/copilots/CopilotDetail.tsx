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
import { Copilot } from '../../types';

// Esquema de validación con Zod
const copilotSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es obligatorio' }),
  email: z.string().email({ message: 'El email debe ser válido' }),
  bio: z.string().optional(),
  specialty: z.string().min(1, { message: 'Debes ingresar al menos una especialidad' }),
  status: z.enum(['available', 'busy', 'inactive']),
  hourly_rate: z.string().refine(
    (value) => !isNaN(Number(value)) && Number(value) > 0,
    { message: 'La tarifa debe ser un número positivo' }
  ),
});

type CopilotFormData = z.infer<typeof copilotSchema>;

/**
 * Página de detalle de Copiloto para crear o editar
 */
const CopilotDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = id !== 'new';

  // Configuración de React Hook Form con validación Zod
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CopilotFormData>({
    resolver: zodResolver(copilotSchema),
    defaultValues: {
      name: '',
      email: '',
      bio: '',
      specialty: '',
      status: 'available',
      hourly_rate: '',
    },
  });

  useEffect(() => {
    // Si estamos editando, cargar los datos del copiloto existente
    if (isEditing) {
      setIsLoading(true);
      // En una implementación real, llamaríamos a la API
      // Para el MVP, simulamos la carga de datos
      setTimeout(() => {
        const mockCopilot: Copilot = {
          copilot_id: id!,
          name: 'Ana López',
          email: 'ana.lopez@kustoc.com',
          bio: 'Especialista en desarrollo frontend con React y diseño UX/UI',
          specialty: ['frontend', 'ux/ui', 'react'],
          status: 'available',
          hourly_rate: 60,
          created_at: '2023-01-15T10:30:00Z',
        };

        reset({
          name: mockCopilot.name,
          email: mockCopilot.email,
          bio: mockCopilot.bio || '',
          specialty: mockCopilot.specialty.join(', '),
          status: mockCopilot.status,
          hourly_rate: mockCopilot.hourly_rate.toString(),
        });
        
        setIsLoading(false);
      }, 800);
    }
  }, [id, isEditing, reset]);

  const onSubmit = async (data: CopilotFormData) => {
    setIsLoading(true);
    
    try {
      // Procesar los datos antes de enviarlos
      const processedData = {
        ...data,
        specialty: data.specialty.split(',').map(s => s.trim()).filter(Boolean),
        hourly_rate: Number(data.hourly_rate),
      };
      
      // En una implementación real, enviaríamos los datos a la API
      // Para el MVP, simulamos una respuesta exitosa después de un breve retraso
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Datos del formulario:', processedData);
      
      // Redirigir a la lista de copilotos después de guardar
      navigate('/copilots');
    } catch (error) {
      console.error('Error al guardar el copiloto:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Editar Copiloto' : 'Nuevo Copiloto'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/copilots')}>
          Volver
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Detalles del Copiloto' : 'Crear Copiloto'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && isEditing ? (
            <div className="py-8 text-center">Cargando datos del copiloto...</div>
          ) : (
            <form id="copilot-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input 
                    id="name" 
                    {...register('name')}
                    placeholder="Nombre completo"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    {...register('email')}
                    placeholder="Email de contacto"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio" optional>Biografía</Label>
                <textarea 
                  id="bio"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('bio')}
                  placeholder="Breve biografía profesional"
                />
                {errors.bio && (
                  <p className="text-sm text-red-500">{errors.bio.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidades</Label>
                  <Input 
                    id="specialty" 
                    {...register('specialty')}
                    placeholder="frontend, ux/ui, react (separados por comas)"
                  />
                  {errors.specialty && (
                    <p className="text-sm text-red-500">{errors.specialty.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Tarifa por Hora (€)</Label>
                  <Input 
                    id="hourly_rate" 
                    type="number"
                    min="0"
                    step="5"
                    {...register('hourly_rate')}
                    placeholder="Tarifa en Euros"
                  />
                  {errors.hourly_rate && (
                    <p className="text-sm text-red-500">{errors.hourly_rate.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select 
                  id="status" 
                  {...register('status')}
                >
                  <SelectOption value="available">Disponible</SelectOption>
                  <SelectOption value="busy">Ocupado</SelectOption>
                  <SelectOption value="inactive">Inactivo</SelectOption>
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
              onClick={() => navigate('/copilots')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="copilot-form"
              isLoading={isLoading}
            >
              {isEditing ? 'Actualizar Copiloto' : 'Crear Copiloto'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default CopilotDetail;
