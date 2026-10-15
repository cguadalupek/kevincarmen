-- Lab: la ficha rápida fija se convierte en hitos interactivos (timeline)
ALTER TABLE "lab_services"
  ADD COLUMN "milestones" JSONB NOT NULL DEFAULT '[]';

-- Backfill: los experimentos existentes conservan su ficha rápida (objetivo/hipótesis
-- y conclusión) como dos hitos. `kind` = 'detail' por defecto; el administrador puede
-- cambiar el tipo de panel y refinar el contenido desde el CMS.
UPDATE "lab_services" AS l
SET "milestones" = s.milestones
FROM (
  SELECT
    ls.id,
    COALESCE(jsonb_agg(m.obj ORDER BY m.ord), '[]'::jsonb) AS milestones
  FROM lab_services ls
  CROSS JOIN LATERAL (
    SELECT t.ord, jsonb_build_object(
      'id', 'm_' || t.ord::text,
      'title', t.title,
      'summary', t.summary,
      'kind', 'detail',
      'content', t.content
    ) AS obj
    FROM (
      SELECT * FROM (VALUES
        (
          1,
          '01. OBJETIVO / HIPÓTESIS',
          coalesce(nullif(trim(ls."objective"), ''), nullif(trim(ls."hypothesis"), '')),
          trim(concat_ws(E'\n\n',
            CASE WHEN coalesce(trim(ls."objective"), '') <> ''  THEN '## Objetivo'  || E'\n\n' || ls."objective" END,
            CASE WHEN coalesce(trim(ls."hypothesis"), '') <> '' THEN '## Hipótesis' || E'\n\n' || ls."hypothesis" END))
        ),
        (
          2,
          '02. CONCLUSIÓN',
          nullif(trim(ls."conclusion"), ''),
          nullif(trim(ls."conclusion"), '')
        )
      ) AS v(ord, title, summary, content)
    ) t
    WHERE t.summary IS NOT NULL AND t.summary <> ''
  ) m
  GROUP BY ls.id
) s
WHERE l.id = s.id AND l."milestones" = '[]'::jsonb;
