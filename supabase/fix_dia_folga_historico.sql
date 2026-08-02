-- Permite transformar um dia de trabalho em folga sem apagar o histórico.
--
-- Antes desta correção, os horários eram apagados. Um agendamento cancelado
-- continuava apontando para o horário, então a chave estrangeira impedia a
-- exclusão. Agora os horários são apenas desativados.

begin;

alter table public.horarios
  add column if not exists ativo boolean not null default true;

create index if not exists idx_horarios_ativos_barbeiro_data
  on public.horarios(barbeiro_id, data)
  where ativo = true;

-- Clientes só podem enxergar horários ativos, disponíveis e com a
-- antecedência mínima já usada pelo aplicativo.
drop policy if exists "horarios: leitura publica de disponiveis"
  on public.horarios;

create policy "horarios: leitura publica de disponiveis"
  on public.horarios
  for select
  using (
    ativo = true
    and disponivel = true
    and (
      (data + hora_inicio) at time zone 'Asia/Tokyo'
    ) >= (now() + interval '1 hour')
  );

-- A operação é feita no banco para que uma reserva não possa entrar no mesmo
-- instante em que o administrador transforma o dia em folga.
create or replace function public.marcar_dia_folga(
  p_barbeiro_id uuid,
  p_data date
) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.usuario_e_admin() then
    raise exception 'permissao_negada';
  end if;

  -- Bloqueia os horários do dia até o fim da operação.
  perform horario.id
  from public.horarios as horario
  where horario.barbeiro_id = p_barbeiro_id
    and horario.data = p_data
    and horario.ativo = true
  order by horario.id
  for update;

  if exists (
    select 1
    from public.agendamentos as agendamento
    join public.horarios as horario
      on horario.id = agendamento.horario_id
    where horario.barbeiro_id = p_barbeiro_id
      and horario.data = p_data
      and horario.ativo = true
      and agendamento.status = 'confirmado'
  ) then
    raise exception 'dia_com_agendamentos';
  end if;

  update public.horarios
  set
    ativo = false,
    disponivel = false
  where barbeiro_id = p_barbeiro_id
    and data = p_data
    and ativo = true;
end;
$$;

revoke all on function public.marcar_dia_folga(uuid, date) from public;
revoke all on function public.marcar_dia_folga(uuid, date) from anon;
grant execute on function public.marcar_dia_folga(uuid, date) to authenticated;

commit;
