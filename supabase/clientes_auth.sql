-- Contas de clientes: perfis, papeis e isolamento de dados.
--
-- IMPORTANTE:
-- 1. Execute este arquivo uma unica vez no SQL Editor do Supabase.
-- 2. As contas que ja existem em auth.users sao os administradores atuais.
-- 3. Novas contas criadas depois desta migracao recebem o papel "cliente".

begin;

-- Perfil publico vinculado ao usuario privado do Supabase Auth.
create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  telefone text not null,
  papel text not null default 'cliente'
    check (papel in ('cliente', 'admin')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (char_length(btrim(nome)) >= 2),
  check (
    papel = 'admin'
    or char_length(regexp_replace(telefone, '[^0-9]', '', 'g')) >= 8
  )
);

alter table public.perfis enable row level security;

-- Todas as contas existentes pertencem ao painel administrativo atual.
insert into public.perfis (id, nome, telefone, papel)
select
  usuario.id,
  case
    when char_length(btrim(coalesce(usuario.raw_user_meta_data ->> 'nome', ''))) >= 2
      then btrim(usuario.raw_user_meta_data ->> 'nome')
    when char_length(split_part(coalesce(usuario.email, ''), '@', 1)) >= 2
      then split_part(usuario.email, '@', 1)
    else 'Administrador'
  end,
  coalesce(
    nullif(btrim(usuario.raw_user_meta_data ->> 'telefone'), ''),
    'Nao informado'
  ),
  'admin'
from auth.users as usuario
on conflict (id) do nothing;

-- Verificacao de papel usada por todas as regras administrativas.
create or replace function public.usuario_e_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis
    where id = auth.uid()
      and papel = 'admin'
  );
$$;

revoke all on function public.usuario_e_admin() from public;
grant execute on function public.usuario_e_admin() to authenticated;

-- Cria automaticamente o perfil de cada novo cliente. Nome e telefone sao
-- obrigatorios tambem no banco, nao apenas na tela do aplicativo.
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nome text;
  v_telefone text;
begin
  v_nome := nullif(btrim(new.raw_user_meta_data ->> 'nome'), '');
  v_telefone := nullif(btrim(new.raw_user_meta_data ->> 'telefone'), '');

  if
    v_nome is null
    or char_length(v_nome) < 2
    or v_telefone is null
    or char_length(regexp_replace(v_telefone, '[^0-9]', '', 'g')) < 8
  then
    raise exception 'nome_telefone_obrigatorios';
  end if;

  insert into public.perfis (id, nome, telefone, papel)
  values (new.id, v_nome, v_telefone, 'cliente')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

-- O usuario le e edita o proprio perfil. Administradores podem consultar todos.
drop policy if exists "perfis: leitura propria ou admin" on public.perfis;
create policy "perfis: leitura propria ou admin"
  on public.perfis
  for select
  to authenticated
  using (id = auth.uid() or public.usuario_e_admin());

drop policy if exists "perfis: atualizacao propria ou admin" on public.perfis;
create policy "perfis: atualizacao propria ou admin"
  on public.perfis
  for update
  to authenticated
  using (id = auth.uid() or public.usuario_e_admin())
  with check (id = auth.uid() or public.usuario_e_admin());

-- Clientes podem editar somente nome e telefone. O papel nunca pode ser
-- promovido pelo navegador.
revoke all on table public.perfis from anon, authenticated;
grant select on table public.perfis to authenticated;
grant update (nome, telefone, atualizado_em) on table public.perfis to authenticated;

-- Relaciona novos agendamentos a uma conta, mantendo os antigos (NULL).
alter table public.agendamentos
  add column if not exists cliente_id uuid
  references public.perfis(id) on delete set null;

create index if not exists idx_agendamentos_cliente
  on public.agendamentos(cliente_id, criado_em desc);

-- Remove o privilegio administrativo que antes era dado a qualquer usuario
-- autenticado e o substitui por verificacao explicita do papel.
drop policy if exists "servicos: escrita para autenticado" on public.servicos;
drop policy if exists "servicos: escrita para administrador" on public.servicos;
create policy "servicos: escrita para administrador"
  on public.servicos
  for all
  to authenticated
  using (public.usuario_e_admin())
  with check (public.usuario_e_admin());

drop policy if exists "horarios: leitura total para autenticado" on public.horarios;
drop policy if exists "horarios: escrita para autenticado" on public.horarios;
drop policy if exists "horarios: gerenciamento para administrador" on public.horarios;
create policy "horarios: gerenciamento para administrador"
  on public.horarios
  for all
  to authenticated
  using (public.usuario_e_admin())
  with check (public.usuario_e_admin());

drop policy if exists "agendamentos: criacao publica" on public.agendamentos;
drop policy if exists "agendamentos: leitura para autenticado" on public.agendamentos;
drop policy if exists "agendamentos: atualizacao para autenticado" on public.agendamentos;
drop policy if exists "agendamentos: leitura propria ou admin" on public.agendamentos;
create policy "agendamentos: leitura propria ou admin"
  on public.agendamentos
  for select
  to authenticated
  using (
    cliente_id = auth.uid()
    or public.usuario_e_admin()
  );

-- Criacao e cancelamento acontecem somente pelas funcoes atomicas abaixo.
revoke insert, update, delete on table public.agendamentos from anon, authenticated;

-- A nova funcao usa nome e telefone do perfil autenticado. O navegador nao
-- pode enviar dados em nome de outra pessoa.
create or replace function public.criar_agendamento(
  p_horario_id uuid,
  p_servico_id uuid
) returns public.agendamentos
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid;
  v_perfil public.perfis%rowtype;
  v_horario public.horarios%rowtype;
  v_agendamento public.agendamentos%rowtype;
begin
  v_usuario_id := auth.uid();

  if v_usuario_id is null then
    raise exception 'autenticacao_necessaria';
  end if;

  select *
  into v_perfil
  from public.perfis
  where id = v_usuario_id
    and papel = 'cliente';

  if not found then
    raise exception 'conta_cliente_necessaria';
  end if;

  select *
  into v_horario
  from public.horarios
  where id = p_horario_id
  for update;

  if not found then
    raise exception 'horario_nao_encontrado';
  end if;

  if not v_horario.disponivel then
    raise exception 'horario_indisponivel';
  end if;

  if (
    (v_horario.data + v_horario.hora_inicio) at time zone 'Asia/Tokyo'
  ) < (now() + interval '1 hour') then
    raise exception 'antecedencia_minima';
  end if;

  insert into public.agendamentos (
    servico_id,
    barbeiro_id,
    horario_id,
    cliente_id,
    cliente_nome,
    cliente_telefone,
    status
  )
  values (
    p_servico_id,
    v_horario.barbeiro_id,
    p_horario_id,
    v_usuario_id,
    v_perfil.nome,
    v_perfil.telefone,
    'confirmado'
  )
  returning * into v_agendamento;

  update public.horarios
  set disponivel = false
  where id = p_horario_id;

  return v_agendamento;
end;
$$;

revoke all on function public.criar_agendamento(uuid, uuid) from public;
revoke all on function public.criar_agendamento(uuid, uuid) from anon;
grant execute on function public.criar_agendamento(uuid, uuid) to authenticated;

-- A assinatura antiga recebia nome e telefone do navegador e deixa de existir.
revoke all on function public.criar_agendamento(uuid, uuid, text, text) from public;
revoke all on function public.criar_agendamento(uuid, uuid, text, text) from anon;
revoke all on function public.criar_agendamento(uuid, uuid, text, text) from authenticated;
drop function public.criar_agendamento(uuid, uuid, text, text);

-- Cliente cancela apenas o proprio agendamento; administrador pode cancelar
-- qualquer um, inclusive os registros antigos sem cliente_id.
create or replace function public.cancelar_agendamento(p_agendamento_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid;
  v_horario_id uuid;
begin
  v_usuario_id := auth.uid();

  if v_usuario_id is null then
    raise exception 'autenticacao_necessaria';
  end if;

  select horario_id
  into v_horario_id
  from public.agendamentos
  where id = p_agendamento_id
    and status = 'confirmado'
    and (
      cliente_id = v_usuario_id
      or public.usuario_e_admin()
    )
  for update;

  if not found then
    raise exception 'agendamento_nao_permitido';
  end if;

  update public.agendamentos
  set status = 'cancelado'
  where id = p_agendamento_id;

  update public.horarios
  set disponivel = true
  where id = v_horario_id;
end;
$$;

revoke all on function public.cancelar_agendamento(uuid) from public;
revoke all on function public.cancelar_agendamento(uuid) from anon;
grant execute on function public.cancelar_agendamento(uuid) to authenticated;

commit;
