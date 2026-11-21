-- ============================================================================
-- Fynz — Frecuencia del próximo ingreso
-- Fecha: 2026-11-20
--
-- Guarda si la fecha de próximo ingreso se repite semanal o quincenalmente.
-- La fecha solo delimita el horizonte Auto del Disponible Real: no crea
-- ingresos, movimientos ni montos proyectados.
-- ============================================================================

begin;

alter table public.configuracion
  add column if not exists frecuencia_proximo_ingreso text not null default 'unica';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'configuracion_frecuencia_proximo_ingreso_check'
      and conrelid = 'public.configuracion'::regclass
  ) then
    alter table public.configuracion
      add constraint configuracion_frecuencia_proximo_ingreso_check
      check (
        frecuencia_proximo_ingreso in ('unica', 'semanal', 'quincenal')
      );
  end if;
end $$;

drop function if exists public.fynz_guardar_proximo_ingreso(uuid, date);

create or replace function public.fynz_guardar_proximo_ingreso(
  p_usuario uuid,
  p_proximo_ingreso date,
  p_frecuencia text default 'unica'
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_frecuencia text := coalesce(
    nullif(btrim(p_frecuencia), ''),
    'unica'
  );
begin
  if p_usuario is distinct from auth.uid() then
    raise exception 'no_autorizado';
  end if;

  if v_frecuencia not in ('unica', 'semanal', 'quincenal') then
    raise exception 'frecuencia_invalida';
  end if;

  if p_proximo_ingreso is null then
    v_frecuencia := 'unica';
  end if;

  insert into public.configuracion (
    usuario_id,
    proximo_ingreso,
    frecuencia_proximo_ingreso,
    actualizado
  )
  values (
    p_usuario,
    p_proximo_ingreso,
    v_frecuencia,
    now()
  )
  on conflict (usuario_id) do update
  set proximo_ingreso = excluded.proximo_ingreso,
      frecuencia_proximo_ingreso = excluded.frecuencia_proximo_ingreso,
      actualizado = now();
end $$;

revoke execute on function public.fynz_guardar_proximo_ingreso(
  uuid, date, text
) from public;

grant execute on function public.fynz_guardar_proximo_ingreso(
  uuid, date, text
) to authenticated;

notify pgrst, 'reload schema';

commit;
