-- Corrige a comparação de antecedência mínima: data/hora_inicio são horário
-- local da barbearia (Asia/Tokyo), não UTC. Sem essa conversão, o Postgres
-- comparava o horário local como se já fosse UTC.

drop policy "horarios: leitura publica de disponiveis" on horarios;
create policy "horarios: leitura publica de disponiveis" on horarios
  for select using (
    disponivel = true
    and ((data + hora_inicio) at time zone 'Asia/Tokyo') >= (now() + interval '1 hour')
  );

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
    raise exception 'Horário não encontrado';
  end if;

  if not v_horario.disponivel then
    raise exception 'Horário indisponível';
  end if;

  if ((v_horario.data + v_horario.hora_inicio) at time zone 'Asia/Tokyo') < (now() + interval '1 hour') then
    raise exception 'Agendamento precisa de pelo menos 1 hora de antecedência';
  end if;

  insert into agendamentos (servico_id, barbeiro_id, horario_id, cliente_nome, cliente_telefone, status)
  values (p_servico_id, v_horario.barbeiro_id, p_horario_id, p_cliente_nome, p_cliente_telefone, 'confirmado')
  returning * into v_agendamento;

  update horarios set disponivel = false where id = p_horario_id;

  return v_agendamento;
end;
$$;
