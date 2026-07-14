-- Etapa 3: disponibilidade, confirmação e cancelamento

-- Evita gerar o mesmo horário duas vezes para o mesmo barbeiro
alter table horarios
  add constraint horarios_barbeiro_data_inicio_key unique (barbeiro_id, data, hora_inicio);

-- Leitura pública de horarios passa a considerar a antecedência mínima de 1h
-- (substitui a policy da etapa 2, que só checava a data)
drop policy "horarios: leitura publica de disponiveis" on horarios;
create policy "horarios: leitura publica de disponiveis" on horarios
  for select using (
    disponivel = true
    and (data + hora_inicio) >= (now() + interval '1 hour')
  );

-- Cliente deixa de inserir direto em agendamentos; passa a usar a função
-- criar_agendamento, que checa conflito e reserva o horário de forma atômica.
drop policy "agendamentos: criacao publica" on agendamentos;

-- Função: cria agendamento de forma atômica (trava o horário, checa disponibilidade
-- e antecedência mínima, insere o agendamento e marca o horário como indisponível)
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

  if (v_horario.data + v_horario.hora_inicio) < (now() + interval '1 hour') then
    raise exception 'Agendamento precisa de pelo menos 1 hora de antecedência';
  end if;

  insert into agendamentos (servico_id, barbeiro_id, horario_id, cliente_nome, cliente_telefone, status)
  values (p_servico_id, v_horario.barbeiro_id, p_horario_id, p_cliente_nome, p_cliente_telefone, 'confirmado')
  returning * into v_agendamento;

  update horarios set disponivel = false where id = p_horario_id;

  return v_agendamento;
end;
$$;

grant execute on function criar_agendamento(uuid, uuid, text, text) to anon, authenticated;

-- Função: cancela agendamento e libera o horário de volta (só para o barbeiro logado)
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
    raise exception 'Agendamento não encontrado ou já cancelado';
  end if;

  update agendamentos set status = 'cancelado' where id = p_agendamento_id;
  update horarios set disponivel = true where id = v_horario_id;
end;
$$;

grant execute on function cancelar_agendamento(uuid) to authenticated;
