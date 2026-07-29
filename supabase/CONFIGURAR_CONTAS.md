# Configuração das contas de clientes

## 1. Atualizar o banco

No painel do Supabase, abra **SQL Editor**, crie uma nova consulta, cole todo o
conteúdo de `clientes_auth.sql` e execute.

A migração preserva os agendamentos existentes. As contas que já existiam antes
da execução são classificadas como administradores; contas criadas depois dela
são clientes.

## 2. Configurar autenticação por e-mail

Em **Authentication > Providers > Email**:

- mantenha o provedor de e-mail habilitado;
- habilite a confirmação de e-mail para novos cadastros;
- mantenha o cadastro público habilitado.

## 3. Configurar URLs

Em **Authentication > URL Configuration**:

- use a URL publicada do aplicativo como **Site URL**;
- adicione a URL publicada com `/**` em **Redirect URLs**;
- durante o desenvolvimento, adicione também
  `http://localhost:5173/**` e `http://127.0.0.1:5173/**`.

A recuperação de senha redireciona o cliente para `/redefinir-senha`.

## 4. Configurar envio de e-mails

O envio padrão do Supabase serve para os primeiros testes, mas tem limites
baixos. Antes da publicação para clientes, configure um SMTP próprio em
**Project Settings > Authentication > SMTP Settings**.

## 5. Teste recomendado

1. Crie uma conta de cliente com nome, telefone, e-mail e senha.
2. Confirme o endereço pelo e-mail recebido.
3. Entre, faça um agendamento e abra **Minha conta**.
4. Confirme que o cliente vê e cancela somente os próprios agendamentos.
5. Entre com a conta antiga do barbeiro e confirme o acesso ao painel completo.
