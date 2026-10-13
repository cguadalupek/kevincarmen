-- Orden personalizado de categorías y subcategorías del blog.
--
-- Las columnas `position` ya existían (default 0) pero nadie las escribía: al crear una
-- categoría desde el CMS nacía con 0 y saltaba al PRIMER puesto de la fila de filtros
-- del blog (el API ordena por «position ASC, name ASC»).
--
-- Aquí se normalizan los valores existentes a múltiplos de 10 conservando el orden
-- visible actual, de modo que (a) el punto de partida es el mismo que ya se ve y
-- (b) quedan huecos para insertar entre dos posiciones sin renumerar todo.
UPDATE "main_categories" AS mc
SET "position" = ranked.rn * 10
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "position" ASC, name ASC) AS rn
  FROM "main_categories"
) AS ranked
WHERE mc.id = ranked.id;

UPDATE "subcategories" AS sc
SET "position" = ranked.rn * 10
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY main_category_id ORDER BY "position" ASC, name ASC) AS rn
  FROM "subcategories"
) AS ranked
WHERE sc.id = ranked.id;
