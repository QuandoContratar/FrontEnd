# Sistema de Níveis de Acesso

## Visão Geral

O sistema possui três níveis de acesso com permissões específicas:

### 1. ADMIN (Administrador)
**Nível máximo de acesso - controle total do sistema**

**Permissões:**
- ✅ Gerenciar Administradores (cadastrar, editar, excluir)
- ✅ Gerenciar Gerentes (cadastrar, editar, excluir)
- ✅ Gerenciar RH (cadastrar, editar, excluir)
- ✅ Criar solicitações de abertura de vagas
- ✅ Ver todas as solicitações de abertura de vagas
- ✅ Aprovar/Rejeitar solicitações de abertura de vagas
- ✅ Ver todas as vagas
- ✅ Ver todos os candidatos
- ✅ Fazer upload de currículos
- ✅ Gerenciar match de candidatos
- ✅ Gerenciar Kanban de Recrutamento
- ✅ Gerenciar Kanban de Abertura de Vagas
- ✅ Ver relatórios e gráficos
- ✅ Ver tabelas de dados

**Páginas Acessíveis:**
- Todas as páginas do sistema

---

### 2. HR (Recursos Humanos)
**Acesso para gerenciar processos de recrutamento**

**Permissões:**
- ❌ Gerenciar Administradores
- ❌ Gerenciar Gerentes
- ❌ Gerenciar RH
- ❌ Criar solicitações de abertura de vagas
- ❌ Ver todas as solicitações de abertura de vagas
- ❌ Aprovar/Rejeitar solicitações de abertura de vagas
- ✅ Ver vagas aprovadas
- ✅ Ver todos os candidatos
- ✅ Fazer upload de currículos
- ✅ Gerenciar match de candidatos
- ✅ Gerenciar Kanban de Recrutamento
- ❌ Gerenciar Kanban de Abertura de Vagas
- ✅ Ver relatórios e gráficos
- ✅ Ver tabelas de dados

**Páginas Acessíveis:**
- Dashboard (home.html)
- Vagas (vagas.html)
- Candidatos (candidatos.html)
- Upload Currículos (upload-curriculos.html)
- Match de Candidatos (match-candidatos.html)
- Kanban Recrutamento (kanban-recrutamento.html)
- Gráficos (charts.html)
- Tabelas (tables.html)

**Páginas Bloqueadas:**
- Administradores (adm.html)
- Gerentes (gerente.html)
- RH (rh.html)
- Abertura de Vaga (abertura-vaga.html)
- Minhas Solicitações (minhas-solicitacoes.html)
- Kanban Abertura de Vaga (kanban-abertura-vaga.html)

---

### 3. MANAGER (Gerente)
**Acesso limitado para gestores de área**

**Permissões:**
- ❌ Gerenciar Administradores
- ❌ Gerenciar Gerentes
- ❌ Gerenciar RH
- ✅ Criar solicitações de abertura de vagas
- ❌ Ver todas as solicitações de abertura de vagas (apenas as próprias)
- ❌ Aprovar/Rejeitar solicitações de abertura de vagas
- ✅ Ver vagas aprovadas
- ❌ Ver todos os candidatos (apenas candidatos das suas vagas)
- ❌ Fazer upload de currículos
- ❌ Gerenciar match de candidatos
- ❌ Gerenciar Kanban de Recrutamento
- ❌ Gerenciar Kanban de Abertura de Vagas
- ❌ Ver relatórios e gráficos
- ❌ Ver tabelas de dados

**Páginas Acessíveis:**
- Dashboard (home.html)
- Abertura de Vaga (abertura-vaga.html)
- Minhas Solicitações (minhas-solicitacoes.html)
- Vagas (vagas.html)

**Páginas Bloqueadas:**
- Administradores (adm.html)
- Gerentes (gerente.html)
- RH (rh.html)
- Candidatos (candidatos.html)
- Upload Currículos (upload-curriculos.html)
- Match de Candidatos (match-candidatos.html)
- Kanban Recrutamento (kanban-recrutamento.html)
- Kanban Abertura de Vaga (kanban-abertura-vaga.html)
- Gráficos (charts.html)
- Tabelas (tables.html)

---

## Implementação Técnica

### Backend
- Enum `LevelAccess` com valores: `ADMIN`, `HR`, `MANAGER`
- Campo `levelAccess` na entidade `User`
- Endpoint `/users/by-access/{level}` para buscar usuários por nível

### Frontend
- Componente `access-control.js` gerencia permissões
- Objeto `AccessPermissions` define todas as permissões
- Classe `AccessControl` valida acesso e oculta elementos não autorizados
- Script aplicado automaticamente em todas as páginas protegidas

### Como Funciona
1. Usuário faz login e o `levelAccess` é salvo no `localStorage`
2. `AccessControl` lê o nível de acesso do usuário
3. Elementos do sidebar são ocultados baseado nas permissões
4. Tentativas de acesso a páginas bloqueadas são redirecionadas

---

## Fluxo de Trabalho por Nível

### ADMIN
1. Pode criar/editar/excluir qualquer usuário
2. Aprova/rejeita solicitações de abertura de vagas
3. Tem visão completa de todos os processos

### HR
1. Recebe solicitações aprovadas pelo ADMIN
2. Faz upload de currículos
3. Faz match de candidatos com vagas
4. Gerencia processo seletivo no Kanban

### MANAGER
1. Cria solicitações de abertura de vagas
2. Acompanha status das suas solicitações
3. Visualiza vagas aprovadas
4. Não tem acesso a processos seletivos

