-- Permite que o barbeiro registre reservas recebidas por telefone ou pessoalmente.

begin;

alter table public.agendamentos
  add column if not exists criado_por_admin boolean not null default false;

create or replace function public.criar_agendamento_admin(
  p_horario_id uuid,
  p_servico_id uuid,
  p_cliente_nome text,
  p_cliente_telefone text
) returns public.agendamentos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_horario public.horarios%rowtype;
  v_agendamento public.agendamentos%rowtype;
begin
  if auth.uid() is null or not public.usuario_e_admin() then
    raise exception 'permissao_negada';
  end if;

  if
    char_length(btrim(coalesce(p_cliente_nome, ''))) < 2
    or char_length(regexp_replace(coalesce(p_cliente_telefone, ''), '[^0-9]', '', 'g')) < 8
  then
    raise exception 'dados_cliente_invalidos';
  end if;

  select *
  into v_horario
  from public.horarios
  where id = p_horario_id
  for update;

  if not found then
    raise exception 'horario_nao_encontrado';
  end if;

  if not v_horario.ativo or not v_horario.disponivel then
    raise exception 'horario_indisponivel';
  end if;

  if (
    (v_horario.data + v_horario.hora_inicio) at time zone 'Asia/Tokyo'
  ) <= now() then
    raise exception 'horario_passado';
  end if;

  insert into public.agendamentos (
    servico_id,
    barbeiro_id,
    horario_id,
    cliente_id,
    cliente_nome,
    cliente_telefone,
    criado_por_admin,
    status
  )
  values (
    p_servico_id,
    v_horario.barbeiro_id,
    p_horario_id,
    null,
    btrim(p_cliente_nome),
    btrim(p_cliente_telefone),
    true,
    'confirmado'
  )
  returning * into v_agendamento;

  update public.horarios
  set disponivel = false
  where id = p_horario_id;

  return v_agendamento;
end;
$$;

revoke all on function public.criar_agendamento_admin(uuid, uuid, text, text) from public;
revoke all on function public.criar_agendamento_admin(uuid, uuid, text, text) from anon;
grant execute on function public.criar_agendamento_admin(uuid, uuid, text, text) to authenticated;

commit;
