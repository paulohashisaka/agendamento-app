-- Atualiza dias de trabalho futuros já cadastrados para a nova grade:
-- intervalos de 15 minutos, das 09:00 às 20:00 (último início),
-- preservando o intervalo de almoço das 12:00 às 13:00.
--
-- O comando apenas acrescenta horários que ainda não existem. Reservas e
-- horários antigos são preservados.

insert into public.horarios (
  barbeiro_id,
  data,
  hora_inicio,
  hora_fim,
  disponivel,
  ativo
)
select
  dias.barbeiro_id,
  dias.data,
  grade.inicio::time,
  (grade.inicio + interval '15 minutes')::time,
  true,
  true
from (
  select distinct barbeiro_id, data
  from public.horarios
  where ativo = true
    and data >= (now() at time zone 'Asia/Tokyo')::date
) as dias
cross join lateral generate_series(
  dias.data + time '09:00',
  dias.data + time '20:00',
  interval '15 minutes'
) as grade(inicio)
where grade.inicio::time < time '12:00'
   or grade.inicio::time >= time '13:00'
on conflict (barbeiro_id, data, hora_inicio) do nothing;
