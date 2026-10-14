import { permanentRedirect } from 'next/navigation';

/**
 * `/projects` es la ruta heredada del portfolio: la canónica es `/proyectos`
 * (metadatos, filtros y paginación viven allí). Se mantiene la URL antigua
 * redirigiendo para no servir la misma lista dos veces (contenido duplicado).
 */
export default function ProjectsRedirectPage() {
  permanentRedirect('/proyectos');
}
