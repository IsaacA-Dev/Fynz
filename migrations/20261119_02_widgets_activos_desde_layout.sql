-- ============================================================================
-- Fynz — Widgets activos desde el layout anterior
-- Fecha: 2026-11-19
--
-- Migración de datos, sin cambios de esquema. Copia los widgets que estaban
-- activos como bloques de `configuracion.layout` hacia `configuracion.widgets`
-- con la forma simple { "activos": ["flujo-mensual", ...] }.
--
-- Solo toca filas cuyo `widgets` está vacío. Si el usuario ya tiene una
-- selección guardada, se respeta. `layout` no se borra: queda como legado y
-- permite rollback.
-- ============================================================================

begin;

with fuente as (
  select
    c.usuario_id,
    case
      when jsonb_typeof(c.layout -> 'bloques') = 'array' then (
        select coalesce(jsonb_agg(distinct b ->> 'widget'), '[]'::jsonb)
        from jsonb_array_elements(c.layout -> 'bloques') as b
        where b ->> 'tipo' = 'widget'
          and b ->> 'widget' is not null
      )
      when jsonb_typeof(c.layout -> 'widgets') = 'array' then (
        select coalesce(jsonb_agg(distinct w ->> 'tipo'), '[]'::jsonb)
        from jsonb_array_elements(c.layout -> 'widgets') as w
        where w ->> 'tipo' is not null
      )
      else '[]'::jsonb
    end as activos
  from public.configuracion c
  where (
      c.widgets is null
      or c.widgets = '{}'::jsonb
      or c.widgets = jsonb_build_object('widgets', '[]'::jsonb)
      or c.widgets = jsonb_build_object('activos', '[]'::jsonb)
    )
    and c.layout is not null
)
update public.configuracion c
set widgets = jsonb_build_object('activos', f.activos),
    actualizado = now()
from fuente f
where c.usuario_id = f.usuario_id;

commit;
