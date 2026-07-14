-- O Postgres concede EXECUTE para PUBLIC por padrão em toda função nova.
-- Isso permitia que o cliente anônimo chamasse cancelar_agendamento para
-- qualquer agendamento, mesmo com "grant ... to authenticated" já aplicado.
revoke execute on function cancelar_agendamento(uuid) from public;
revoke execute on function cancelar_agendamento(uuid) from anon;
grant execute on function cancelar_agendamento(uuid) to authenticated;

-- Por precaução, garante que criar_agendamento tem só as permissões pretendidas
revoke execute on function criar_agendamento(uuid, uuid, text, text) from public;
grant execute on function criar_agendamento(uuid, uuid, text, text) to anon, authenticated;
