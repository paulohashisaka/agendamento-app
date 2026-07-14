-- Etapa 4: as funções passam a lançar chaves estáveis (não texto em português),
-- para o front-end traduzir de acordo com o idioma do cliente.

create or replace function criar_agendamento(
  p_horario_id uuid,
  p_servico_id uuid,
  p_cliente_nome text,
  p_cliente_telefone text
) returns agendamentos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_horario horarios%rowtype;
  v_agendamento agendamentos%rowtype;
begin
  select * into v_horario from horarios where id = p_horario_id for update;

  if not found then
    raise exception 'horario_nao_encontrado';
  end if;

  if not v_horario.disponivel then
    raise exception 'horario_indisponivel';
  end if;

  if ((v_horario.data + v_horario.hora_inicio) at time zone 'Asia/Tokyo') < (now() + interval '1 hour') then
    raise exception 'antecedencia_minima';
  end if;

  insert into agendamentos (servico_id, barbeiro_id, horario_id, cliente_nome, cliente_telefone, status)
  values (p_servico_id, v_horario.barbeiro_id, p_horario_id, p_cliente_nome, p_cliente_telefone, 'confirmado')
  returning * into v_agendamento;

  update horarios set disponivel = false where id = p_horario_id;

  return v_agendamento;
end;
$$;

create or replace function cancelar_agendamento(p_agendamento_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_horario_id uuid;
begin
  select horario_id into v_horario_id
  from agendamentos
  where id = p_agendamento_id and status = 'confirmado';

  if not found then
    raise exception 'agendamento_ja_cancelado';
  end if;

  update agendamentos set status = 'cancelado' where id = p_agendamento_id;
  update horarios set disponivel = true where id = v_horario_id;
end;
$$;
