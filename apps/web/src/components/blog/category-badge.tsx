import { categoryColor, categoryColorClass } from '@/lib/categories';

interface CategoryBadgeProps {
  /** Slug de la categoría principal. */
  categorySlug: string;
  /** Nombre legible. Si no viene se muestra el slug. */
  categoryLabel?: string;
  /** Clave de color de la paleta (guardada en la BD). Si no viene, se deriva del slug. */
  color?: string | null;
  /** Nombre de la subcategoría, opcional, renderizada en formato más tenue. */
  subcategory?: string | null;
  className?: string;
}

/**
 * Badge de categoría principal + subcategoría opcional. El color viene de la
 * clave guardada en la BD (elegida al crear la categoría); si no hay, se usa un
 * color estable derivado del slug.
 */
export function CategoryBadge({
  categorySlug,
  categoryLabel,
  color,
  subcategory,
  className = '',
}: CategoryBadgeProps) {
  const colorClass = color ? categoryColorClass(color) : categoryColor(categorySlug);
  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className}`}>
      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${colorClass}`}>
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
