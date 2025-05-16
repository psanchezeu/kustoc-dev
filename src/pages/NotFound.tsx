import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

/**
 * Página mostrada cuando la ruta no existe
 */
const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Página no encontrada</h2>
      <p className="mb-8 text-muted-foreground max-w-md">
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
      </p>
      <Link to="/">
        <Button>Volver al Inicio</Button>
      </Link>
    </div>
  );
};

export default NotFound;
