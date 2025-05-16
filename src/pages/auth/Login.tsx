import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';

// Esquema de validación para el formulario de login
const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(4, { message: 'La contraseña debe tener al menos 4 caracteres' })
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Página de inicio de sesión
 */
const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [loginError, setLoginError] = useState('');

  // Usar useEffect para la navegación si el usuario está autenticado
  
  useEffect(() => {
    // Si ya está autenticado, redirigir al dashboard
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoginError('');
    try {
      const success = await login(data.email, data.password);
      if (success) {
        navigate('/');
      } else {
        setLoginError('Credenciales incorrectas. Intente nuevamente.');
      }
    } catch (error) {
      setLoginError('Error al iniciar sesión. Intente nuevamente más tarde.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Kacum</CardTitle>
          <CardDescription>Inicia sesión para acceder a la plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                {loginError}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  errors.email ? 'border-destructive' : 'border-input'
                }`}
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  errors.password ? 'border-destructive' : 'border-input'
                }`}
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            
            <div className="pt-2">
              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                Iniciar Sesión
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          <p className="w-full">
            Para el demo, use: admin@kustoc.com / admin
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
