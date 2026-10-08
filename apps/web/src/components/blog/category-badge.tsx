import { categoryColor } from '@/lib/categories';

interface CategoryBadgeProps {
  /** Slug de la categoría principal (define el color, estable por slug). */
  categorySlug: string;
  /** Nombre legible. Si no viene se muestra el slug. */
  categoryLabel?: string;
  /** Nombre de la subcategoría, opcional, renderizada en formato más tenue. */
  subcategory?: string | null;
  className?: string;
}

/**
 * Badge de categoría principal + subcategoría opcional. Lo usan el listado del
 * blog, el encabezado del artículo y la home. El color viene del slug y no del
 * nombre, así las categorías creadas por el usuario tienen un color estable.
 */
export function CategoryBadge({
  categorySlug,
  categoryLabel,
  subcategory,
  className = '',
}: CategoryBadgeProps) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      <span
        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${categoryColor(categorySlug)}`}
      >
        {categoryLabel ?? categorySlug}
      </span>
      {subcategory && (
        <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
          {subcategory}
        </span>
      )}
    </span>
  );
}
