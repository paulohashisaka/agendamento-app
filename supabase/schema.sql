-- Etapa 2: schema inicial (tabelas + RLS básico + seed de barbeiros)

create table servicos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  duracao_minutos integer not null,
  preco numeric(10,2) not null
);

create table barbeiros (
  id uuid primary key default gen_random_uuid(),
  nome text not null
);

create table horarios (
  id uuid primary key default gen_random_uuid(),
  barbeiro_id uuid not null references barbeiros(id) on delete cascade,
  data date not null,
  hora_inicio time not null,
  hora_fim time not null,
  disponivel boolean not null default true,
  ativo boolean not null default true
);
create index idx_horarios_barbeiro_data on horarios(barbeiro_id, data);

create table agendamentos (
  id uuid primary key default gen_random_uuid(),
  servico_id uuid not null references servicos(id),
  barbeiro_id uuid not null references barbeiros(id),
  horario_id uuid not null references horarios(id),
  cliente_nome text not null,
  cliente_telefone text not null,
  criado_por_admin boolean not null default false,
  status text not null default 'confirmado' check (status in ('confirmado', 'cancelado')),
  criado_em timestamptz not null default now()
);

-- Trava a nível de banco: impossível existir 2 agendamentos confirmados no mesmo horário
create unique index idx_agendamentos_horario_confirmado
  on agendamentos(horario_id)
  where status = 'confirmado';

-- Row Level Security
alter table servicos enable row level security;
alter table barbeiros enable row level security;
alter table horarios enable row level security;
alter table agendamentos enable row level security;

-- Leitura pública (cliente não autenticado): serviços e barbeiros sempre visíveis
create policy "servicos: leitura publica" on servicos
  for select using (true);

create policy "barbeiros: leitura publica" on barbeiros
  for select using (true);

-- Horarios: cliente só vê os disponíveis e futuros; barbeiro logado vê tudo
create policy "horarios: leitura publica de disponiveis" on horarios
  for select using (ativo = true and disponivel = true and data >= current_date);

create policy "horarios: leitura total para autenticado" on horarios
  for select to authenticated using (true);

-- Escrita (cadastro/edição de serviços e horários): só barbeiro logado
create policy "servicos: escrita para autenticado" on servicos
  for all to authenticated using (true) with check (true);

create policy "horarios: escrita para autenticado" on horarios
  for all to authenticated using (true) with check (true);

-- Agendamentos: cliente anônimo pode criar; leitura/edição (cancelar) só para barbeiro logado
create policy "agendamentos: criacao publica" on agendamentos
  for insert with check (status = 'confirmado');

create policy "agendamentos: leitura para autenticado" on agendamentos
  for select to authenticated using (true);

create policy "agendamentos: atualizacao para autenticado" on agendamentos
  for update to authenticated using (true) with check (true);

-- Seed: 2 barbeiros fixos
insert into barbeiros (nome) values ('Barbeiro 1'), ('Barbeiro 2');
