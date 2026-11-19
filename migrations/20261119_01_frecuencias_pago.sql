-- ============================================================================
-- Fynz — Frecuencias de pago: semanal y quincenal
-- Fecha: 2026-11-19
--
-- Ejecutar completo en el SQL Editor de Supabase, dentro de una transacción.
-- Es una migración aditiva: no elimina pagos ni movimientos. Agrega la
-- frecuencia, rellena los pagos existentes (mensual/único) y actualiza las
-- funciones que calculan el siguiente periodo.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Columna de frecuencia y compatibilidad con datos existentes
-- ----------------------------------------------------------------------------
alter table public.proximo_pago
  add column if not exists frecuencia text;

-- Sanea pagos de tarjeta legados que perdieron su cuenta o que apuntan a una
-- cuenta que no es de crédito. Sin esto, el UPDATE de frecuencia revalida
-- proximo_pago_tarjeta_check y falla en registros huérfanos de pruebas viejas.
update public.proximo_pago pp
set es_tarjeta = false,
    ciclo_id = null,
    domiciliado = false,
    recurrente = false,
    dia_cobro = null,
    archivada = true,
    frecuencia = 'unico',
    actualizado = now()
where pp.es_tarjeta = true
  and (
    pp.cuenta_id is null
    or not exists (
      select 1
      from public.cuenta c
      where c.cuenta_id = pp.cuenta_id
        and c.usuario_id = pp.usuario_id
        and c.metodo = 'credito'
    )
  );

-- Cualquier pago marcado como domiciliado sin cuenta ya no puede serlo.
update public.proximo_pago
set domiciliado = false
where domiciliado = true and cuenta_id is null;

update public.proximo_pago
set frecuencia = case
  when recurrente then 'mensual'
  else 'unico'
end
where frecuencia is null;

alter table public.proximo_pago
  alter column frecuencia set default 'unico',
  alter column frecuencia set not null;

alter table public.proximo_pago
  drop constraint if exists proximo_pago_dia_cobro_check;
alter table public.proximo_pago
  drop constraint if exists proximo_pago_frecuencia_valor_check;
alter table public.proximo_pago
  drop constraint if exists proximo_pago_frecuencia_check;

alter table public.proximo_pago
  add constraint proximo_pago_frecuencia_valor_check
  check (frecuencia in ('unico', 'semanal', 'quincenal', 'mensual'));

alter table public.proximo_pago
  add constraint proximo_pago_frecuencia_check
  check (
    (frecuencia = 'unico' and not recurrente and dia_cobro is null)
    or (frecuencia = 'mensual' and recurrente and dia_cobro between 1 and 31)
    or (frecuencia in ('semanal', 'quincenal') and recurrente and dia_cobro is null)
  );

-- ----------------------------------------------------------------------------
-- 2. Crear pago con frecuencia explícita
-- ----------------------------------------------------------------------------
drop function if exists public.fynz_insertar_pago(
  uuid, text, bigint, date, boolean, bigint, boolean, integer, boolean, uuid
);

create or replace function public.fynz_insertar_pago(
  p_usuario uuid,
  p_descripcion text,
  p_monto bigint,
  p_fecha_vencimiento date,
  p_domiciliado boolean,
  p_cuenta_id bigint,
  p_recurrente boolean,
  p_dia_cobro integer,
  p_es_tarjeta boolean,
  p_idempotencia uuid,
  p_frecuencia text
) returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  v_id bigint;
  v_frecuencia text;
  v_recurrente boolean;
begin
  if p_usuario is distinct from auth.uid() then raise exception 'no_autorizado'; end if;
  if p_descripcion is null or trim(p_descripcion) = '' then raise exception 'descripcion_invalida'; end if;
  if p_monto is null or p_monto <= 0 then raise exception 'monto_invalido'; end if;
  if p_fecha_vencimiento is null then raise exception 'fecha_invalida'; end if;

  v_frecuencia := coalesce(
    nullif(btrim(p_frecuencia), ''),
    case when coalesce(p_recurrente, false) then 'mensual' else 'unico' end
  );
  if v_frecuencia not in ('unico', 'semanal', 'quincenal', 'mensual') then
    raise exception 'frecuencia_invalida';
  end if;

  v_recurrente := v_frecuencia <> 'unico';
  if coalesce(p_recurrente, false) <> v_recurrente then
    raise exception 'frecuencia_invalida';
  end if;

  if v_frecuencia = 'mensual' then
    if p_dia_cobro is null or p_dia_cobro < 1 or p_dia_cobro > 31 then
      raise exception 'dia_cobro_invalido';
    end if;
  elsif p_dia_cobro is not null then
    raise exception 'dia_cobro_invalido';
  end if;

  if coalesce(p_domiciliado, false) or coalesce(p_es_tarjeta, false) then
    if not exists (
      select 1
      from public.cuenta
      where cuenta_id = p_cuenta_id
        and usuario_id = p_usuario
        and archivada = false
    ) then
      raise exception 'cuenta_no_encontrada';
    end if;
  end if;

  insert into public.proximo_pago (
    usuario_id, descripcion, monto, fecha_vencimiento,
    domiciliado, cuenta_id, recurrente, dia_cobro, es_tarjeta,
    idempotencia, frecuencia
  )
  values (
    p_usuario,
    trim(p_descripcion),
    p_monto,
    p_fecha_vencimiento,
    coalesce(p_domiciliado, false),
    case
      when coalesce(p_domiciliado, false) or coalesce(p_es_tarjeta, false) then p_cuenta_id
      else null
    end,
    v_recurrente,
    case when v_frecuencia = 'mensual' then p_dia_cobro else null end,
    coalesce(p_es_tarjeta, false),
    p_idempotencia,
    v_frecuencia
  )
  on conflict do nothing
  returning proximo_pago_id into v_id;

  if v_id is null then
    select pp.proximo_pago_id into v_id
    from public.proximo_pago pp
    where pp.usuario_id = p_usuario
      and pp.idempotencia = p_idempotencia;
  end if;

  return v_id;
end $$;

-- ----------------------------------------------------------------------------
-- 3. Actualizar pago con frecuencia explícita
-- ----------------------------------------------------------------------------
drop function if exists public.fynz_actualizar_pago(
  uuid, bigint, text, bigint, date, boolean, bigint, boolean, integer
);

create or replace function public.fynz_actualizar_pago(
  p_usuario uuid,
  p_pago_id bigint,
  p_descripcion text,
  p_monto bigint,
  p_fecha_vencimiento date,
  p_domiciliado boolean,
  p_cuenta_id bigint,
  p_recurrente boolean,
  p_dia_cobro integer,
  p_frecuencia text
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_es_tarjeta boolean;
  v_cuenta_actual bigint;
  v_frecuencia text;
  v_recurrente boolean;
  v_dia_cobro integer;
begin
  if p_usuario is distinct from auth.uid() then raise exception 'no_autorizado'; end if;
  if p_descripcion is null or trim(p_descripcion) = '' then raise exception 'descripcion_invalida'; end if;
  if p_monto is null or p_monto <= 0 then raise exception 'monto_invalido'; end if;
  if p_fecha_vencimiento is null then raise exception 'fecha_invalida'; end if;

  select pp.es_tarjeta, pp.cuenta_id
    into v_es_tarjeta, v_cuenta_actual
  from public.proximo_pago pp
  where pp.proximo_pago_id = p_pago_id
    and pp.usuario_id = p_usuario
    and pp.pagado = false
    and pp.archivada = false
  for update;
  if not found then raise exception 'pago_no_encontrado'; end if;

  if v_es_tarjeta then
    -- Los pagos de tarjeta son siempre mensuales y su cuenta es la tarjeta.
    v_frecuencia := 'mensual';
    v_recurrente := true;
    v_dia_cobro := coalesce(
      p_dia_cobro,
      extract(day from p_fecha_vencimiento)::integer
    );
  else
    v_frecuencia := coalesce(
      nullif(btrim(p_frecuencia), ''),
      case when coalesce(p_recurrente, false) then 'mensual' else 'unico' end
    );
    if v_frecuencia not in ('unico', 'semanal', 'quincenal', 'mensual') then
      raise exception 'frecuencia_invalida';
    end if;

    v_recurrente := v_frecuencia <> 'unico';
    if coalesce(p_recurrente, false) <> v_recurrente then
      raise exception 'frecuencia_invalida';
    end if;

    if v_frecuencia = 'mensual' then
      if p_dia_cobro is null or p_dia_cobro < 1 or p_dia_cobro > 31 then
        raise exception 'dia_cobro_invalido';
      end if;
      v_dia_cobro := p_dia_cobro;
    else
      if p_dia_cobro is not null then
        raise exception 'dia_cobro_invalido';
      end if;
      v_dia_cobro := null;
    end if;
  end if;

  if v_es_tarjeta then
    if not exists (
      select 1
      from public.cuenta c
      where c.cuenta_id = v_cuenta_actual
        and c.usuario_id = p_usuario
        and c.archivada = false
    ) then
      raise exception 'cuenta_no_encontrada';
    end if;
  elsif coalesce(p_domiciliado, false) then
    if not exists (
      select 1
      from public.cuenta c
      where c.cuenta_id = p_cuenta_id
        and c.usuario_id = p_usuario
        and c.archivada = false
    ) then
      raise exception 'cuenta_no_encontrada';
    end if;
  else
    if exists (
      select 1
      from public.cuenta c
      where c.cuenta_id = p_cuenta_id
        and c.metodo = 'credito'
    ) then
      raise exception 'cuenta_no_liquida';
    end if;
  end if;

  update public.proximo_pago
  set descripcion = trim(p_descripcion),
      monto = p_monto,
      fecha_vencimiento = p_fecha_vencimiento,
      domiciliado = case when v_es_tarjeta then false else coalesce(p_domiciliado, false) end,
      cuenta_id = case
        when v_es_tarjeta then v_cuenta_actual
        when coalesce(p_domiciliado, false) then p_cuenta_id
        else null
      end,
      recurrente = v_recurrente,
      dia_cobro = v_dia_cobro,
      frecuencia = v_frecuencia,
      actualizado = now()
  where proximo_pago_id = p_pago_id
    and usuario_id = p_usuario
    and pagado = false
    and archivada = false;
end $$;

-- ----------------------------------------------------------------------------
-- 4. Liquidar: el siguiente periodo conserva el monto planificado y usa +7/+14
-- ----------------------------------------------------------------------------
create or replace function public.fynz_liquidar_pago(
  p_usuario uuid,
  p_pago_id bigint,
  p_cuenta_id bigint,
  p_monto bigint,
  p_fecha date,
  p_idem_egreso uuid,
  p_idem_tarjeta uuid
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_pago record;
  v_cuenta record;
  v_fecha_siguiente date;
begin
  if p_usuario is distinct from auth.uid() then raise exception 'no_autorizado'; end if;
  if p_monto is null or p_monto <= 0 then raise exception 'monto_invalido'; end if;

  select * into v_pago
  from public.proximo_pago
  where proximo_pago_id = p_pago_id and usuario_id = p_usuario and archivada = false
  for update;
  if v_pago is null then raise exception 'pago_no_encontrado'; end if;
  if v_pago.pagado then raise exception 'pago_ya_liquidado'; end if;

  select * into v_cuenta
  from public.cuenta
  where cuenta_id = p_cuenta_id and usuario_id = p_usuario and archivada = false;
  if v_cuenta is null then raise exception 'cuenta_no_encontrada'; end if;
  if v_cuenta.metodo = 'credito' then raise exception 'cuenta_no_liquida'; end if;

  update public.proximo_pago
  set pagado = true, fecha_pagado = p_fecha, actualizado = now()
  where proximo_pago_id = p_pago_id;

  perform public.fynz_insertar_movimiento(
    p_usuario, p_cuenta_id, 'egreso', p_monto,
    'Pago: ' || v_pago.descripcion, p_fecha, 'pago', p_idem_egreso
  );
  update public.transaccion
     set pago_id = p_pago_id
   where idempotencia = p_idem_egreso;

  if v_pago.es_tarjeta then
    perform public.fynz_insertar_movimiento(
      p_usuario, v_pago.cuenta_id::bigint, 'ingreso', p_monto,
      'Pago a la tarjeta: ' || v_pago.descripcion, p_fecha, 'pago_tarjeta', p_idem_tarjeta
    );
    update public.transaccion
       set pago_id = p_pago_id
     where idempotencia = p_idem_tarjeta;
    -- Los compromisos por ciclo se recalculan por la capa de servidor.
    return;
  end if;

  if v_pago.recurrente and v_pago.frecuencia is not null and v_pago.frecuencia <> 'unico' then
    v_fecha_siguiente := case v_pago.frecuencia
      when 'mensual' then public.fynz_siguiente_dia_cobro(v_pago.dia_cobro, v_pago.fecha_vencimiento + 1)
      when 'semanal' then v_pago.fecha_vencimiento + 7
      when 'quincenal' then v_pago.fecha_vencimiento + 14
      else null
    end;

    if v_fecha_siguiente is null then
      raise exception 'frecuencia_invalida';
    end if;

    insert into public.proximo_pago (
      usuario_id, descripcion, monto, fecha_vencimiento,
      domiciliado, cuenta_id, recurrente, dia_cobro, es_tarjeta, frecuencia
    )
    values (
      p_usuario,
      v_pago.descripcion,
      v_pago.monto,
      v_fecha_siguiente,
      v_pago.domiciliado,
      case when v_pago.domiciliado then p_cuenta_id else null end,
      true,
      v_pago.dia_cobro,
      false,
      v_pago.frecuencia
    );
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 5. Adelantar el siguiente periodo para cualquier frecuencia recurrente
-- ----------------------------------------------------------------------------
create or replace function public.fynz_adelantar_periodo(
  p_usuario uuid,
  p_pago_id bigint,
  p_hoy date
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_pago record;
  v_fecha_siguiente date;
begin
  if p_usuario is distinct from auth.uid() then raise exception 'no_autorizado'; end if;

  select * into v_pago
  from public.proximo_pago
  where proximo_pago_id = p_pago_id and usuario_id = p_usuario and archivada = false
  for update;

  if v_pago is null then raise exception 'pago_no_encontrado'; end if;
  if v_pago.es_tarjeta then raise exception 'pago_no_adelantable'; end if;
  if v_pago.pagado then raise exception 'pago_ya_liquidado'; end if;
  if not v_pago.recurrente
     or v_pago.frecuencia is null
     or v_pago.frecuencia = 'unico' then
    raise exception 'pago_no_adelantable';
  end if;

  v_fecha_siguiente := case v_pago.frecuencia
    when 'mensual' then public.fynz_siguiente_dia_cobro(v_pago.dia_cobro, v_pago.fecha_vencimiento + 1)
    when 'semanal' then v_pago.fecha_vencimiento + 7
    when 'quincenal' then v_pago.fecha_vencimiento + 14
    else null
  end;

  if v_fecha_siguiente is null then
    raise exception 'frecuencia_invalida';
  end if;

  if exists (
    select 1 from public.proximo_pago
    where usuario_id = p_usuario
      and descripcion = v_pago.descripcion
      and recurrente = true
      and es_tarjeta = false
      and pagado = false
      and archivada = false
      and fecha_vencimiento = v_fecha_siguiente
  ) then
    raise exception 'ya_existe_siguiente_periodo';
  end if;

  insert into public.proximo_pago (
    usuario_id, descripcion, monto, fecha_vencimiento,
    domiciliado, cuenta_id, recurrente, dia_cobro, es_tarjeta, frecuencia
  )
  values (
    p_usuario,
    v_pago.descripcion,
    v_pago.monto,
    v_fecha_siguiente,
    v_pago.domiciliado,
    case when v_pago.domiciliado then v_pago.cuenta_id else null end,
    true,
    v_pago.dia_cobro,
    false,
    v_pago.frecuencia
  );
end $$;

-- ----------------------------------------------------------------------------
-- 6. Los pagos de tarjeta siguen siendo mensuales
-- ----------------------------------------------------------------------------
create or replace function public.fynz_sincronizar_pago_tarjeta(
  p_usuario uuid,
  p_cuenta_id bigint,
  p_hoy date
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_cuenta record;
  v_deuda bigint;
  v_fecha date;
  v_id bigint;
begin
  if p_usuario is distinct from auth.uid() then raise exception 'no_autorizado'; end if;

  select * into v_cuenta
  from public.cuenta
  where cuenta_id = p_cuenta_id and usuario_id = p_usuario and archivada = false;
  if v_cuenta is null or v_cuenta.metodo <> 'credito' then return; end if;

  if v_cuenta.dia_corte is null or v_cuenta.dia_pago is null then
    update public.proximo_pago
    set archivada = true
    where usuario_id = p_usuario and cuenta_id = p_cuenta_id
      and es_tarjeta = true and pagado = false and archivada = false;
    return;
  end if;

  v_deuda := v_cuenta.balance_inicial + coalesce((
    select sum(case when t.tipo = 'ingreso' then t.monto else -t.monto end)
    from public.transaccion t
    where t.cuenta_id = p_cuenta_id and t.usuario_id = p_usuario
  ), 0) * -1;

  v_fecha := public.fynz_fecha_pago_tarjeta(v_cuenta.dia_corte, v_cuenta.dia_pago, p_hoy);

  if v_deuda > 0 then
    select pp.proximo_pago_id into v_id
    from public.proximo_pago pp
    where pp.usuario_id = p_usuario and pp.cuenta_id = p_cuenta_id
      and pp.es_tarjeta = true and pp.pagado = false and pp.archivada = false
    order by pp.proximo_pago_id
    limit 1;

    if v_id is not null then
      update public.proximo_pago
      set monto = v_deuda,
          fecha_vencimiento = v_fecha,
          descripcion = 'Pago de la tarjeta ' || v_cuenta.nombre,
          recurrente = true,
          dia_cobro = v_cuenta.dia_pago,
          frecuencia = 'mensual',
          actualizado = now()
      where proximo_pago_id = v_id;
    else
      insert into public.proximo_pago (
        usuario_id, descripcion, monto, fecha_vencimiento,
        domiciliado, cuenta_id, recurrente, dia_cobro, es_tarjeta, frecuencia
      )
      values (
        p_usuario,
        'Pago de la tarjeta ' || v_cuenta.nombre,
        v_deuda,
        v_fecha,
        false,
        p_cuenta_id,
        true,
        v_cuenta.dia_pago,
        true,
        'mensual'
      );
    end if;
  else
    update public.proximo_pago
    set archivada = true
    where usuario_id = p_usuario and cuenta_id = p_cuenta_id
      and es_tarjeta = true and pagado = false and archivada = false;
  end if;
end $$;

create or replace function public.fynz_sincronizar_compromisos_tarjeta(
  p_usuario uuid,
  p_cuenta_id bigint,
  p_ciclos jsonb,
  p_hoy date,
  p_compromisos jsonb
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_item jsonb;
begin
  if p_usuario is distinct from auth.uid() then raise exception 'no_autorizado'; end if;

  if not exists (
    select 1 from public.cuenta
    where cuenta_id = p_cuenta_id
      and usuario_id = p_usuario
      and metodo = 'credito'
      and archivada = false
  ) then
    return;
  end if;

  -- Historial de ciclos (trazabilidad, determinista desde las transacciones)
  for v_item in select * from jsonb_array_elements(coalesce(p_ciclos, '[]'::jsonb)) loop
    insert into public.ciclo_tarjeta (
      usuario_id, cuenta_id, fecha_corte, fecha_pago, saldo, pagos, objetivo,
      objetivo_manual, minimo, estado
    )
    values (
      p_usuario, p_cuenta_id,
      (v_item->>'fechaCorte')::date,
      (v_item->>'fechaPago')::date,
      (v_item->>'compras')::bigint,
      (v_item->>'pagos')::bigint,
      (v_item->>'objetivo')::bigint,
      (v_item->>'objetivoManual')::bigint,
      (v_item->>'minimo')::bigint,
      (v_item->>'estado')::text
    )
    on conflict (cuenta_id, fecha_corte) do update
    set fecha_pago = excluded.fecha_pago,
        saldo = excluded.saldo,
        pagos = excluded.pagos,
        objetivo = excluded.objetivo,
        objetivo_manual = excluded.objetivo_manual,
        minimo = excluded.minimo,
        estado = excluded.estado;
  end loop;

  -- Reemplaza los compromisos pendientes de esta tarjeta
  update public.proximo_pago
     set archivada = true, actualizado = now()
   where usuario_id = p_usuario
     and cuenta_id = p_cuenta_id
     and es_tarjeta = true
     and pagado = false
     and archivada = false;

  for v_item in select * from jsonb_array_elements(coalesce(p_compromisos, '[]'::jsonb)) loop
    if (v_item->>'monto')::bigint > 0 then
      insert into public.proximo_pago (
        usuario_id, descripcion, monto, fecha_vencimiento,
        domiciliado, cuenta_id, recurrente, dia_cobro, es_tarjeta,
        ciclo_id, minimo, frecuencia
      )
      values (
        p_usuario,
        v_item->>'descripcion',
        (v_item->>'monto')::bigint,
        (v_item->>'fechaVencimiento')::date,
        false,
        p_cuenta_id,
        true,
        (v_item->>'diaCobro')::integer,
        true,
        (select ciclo_id from public.ciclo_tarjeta
         where cuenta_id = p_cuenta_id and fecha_corte = (v_item->>'fechaCorte')::date
         limit 1),
        coalesce((v_item->>'minimo')::bigint, 0),
        'mensual'
      );
    end if;
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 7. Permisos de las funciones recreadas
-- ----------------------------------------------------------------------------
revoke execute on function public.fynz_insertar_pago(
  uuid, text, bigint, date, boolean, bigint, boolean, integer, boolean, uuid, text
) from public;
revoke execute on function public.fynz_actualizar_pago(
  uuid, bigint, text, bigint, date, boolean, bigint, boolean, integer, text
) from public;

grant execute on function public.fynz_insertar_pago(
  uuid, text, bigint, date, boolean, bigint, boolean, integer, boolean, uuid, text
) to authenticated;
grant execute on function public.fynz_actualizar_pago(
  uuid, bigint, text, bigint, date, boolean, bigint, boolean, integer, text
) to authenticated;

-- PostgREST debe recargar el esquema para ver la columna y las firmas nuevas.
notify pgrst, 'reload schema';

commit;
