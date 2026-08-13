-- Adiciona nomes em português e japonês aos serviços existentes.
-- O valor atual é copiado para os dois idiomas para que nenhum serviço fique
-- sem nome. Depois, edite as traduções pelo painel do barbeiro.

alter table public.servicos
  add column if not exists nome_pt text,
  add column if not exists nome_ja text;

update public.servicos
set
  nome_pt = coalesce(nullif(trim(nome_pt), ''), nome),
  nome_ja = coalesce(nullif(trim(nome_ja), ''), nome)
where nome_pt is null
   or trim(nome_pt) = ''
   or nome_ja is null
   or trim(nome_ja) = '';

alter table public.servicos
  alter column nome_pt set not null,
  alter column nome_ja set not null;
