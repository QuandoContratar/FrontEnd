# 📋 Nivelamento Front-End - Sistema Quando Contratar

## 📚 Visão Geral do Sistema

O sistema **Quando Contratar** é uma plataforma de gestão de recrutamento e seleção que permite gerenciar vagas, candidatos, processos seletivos e matches entre candidatos e vagas.

---

## 🗄️ Estrutura do Banco de Dados

### 1. Tabela `user` - Usuários do Sistema

**Campos:**
- `id_user` (INT, PK, AUTO_INCREMENT) - Identificador único
- `name` (VARCHAR(100), NOT NULL) - Nome do usuário
- `email` (VARCHAR(100), NOT NULL, UNIQUE) - Email (usado para login)
- `password` (VARCHAR(255), NOT NULL) - Senha (hash)
- `area` (VARCHAR(50)) - Área de atuação
- `levelAccess` (ENUM: '1', '2', '3', DEFAULT '3') - Nível de acesso
  - `'1'` - Administrador (acesso total)
  - `'2'` - RH/Recrutador (acesso a processos seletivos)
  - `'3'` - Gestor/Manager (pode criar vagas)

**⚠️ IMPORTANTE:** O campo usa valores numéricos como string ('1', '2', '3'). O front-end deve mapear para nomes legíveis:
  - '1' → 'ADMIN' → 'Administrador'
  - '2' → 'HR' → 'RH'
  - '3' → 'MANAGER' → 'Gestor'

**Relacionamentos:**
- Um usuário pode ser gestor de múltiplas vagas (`vacancies.fk_manager`)
- Um usuário pode ser recrutador de múltiplos processos (`selection_process.fk_recruiter`)
- Um usuário pode criar múltiplas solicitações (`opening_requests.gestor_id`)

**Uso no Front-End:**
- Autenticação de usuários
- Controle de acesso baseado em `levelAccess` (valores: '1', '2', '3')
- Exibição de informações do usuário logado
- Filtros por gestor/recrutador
- **Utilizar `Utils.getLevelAccessName()` e `Utils.normalizeLevelAccess()` para mapeamento**

---

### 2. Tabela `candidate` - Candidatos

**Campos:**
- `id_candidate` (INT, PK, AUTO_INCREMENT) - Identificador único
- `name` (VARCHAR(100), NOT NULL) - Nome completo
- `birth` (DATE) - Data de nascimento
- `phone_number` (CHAR(14)) - Telefone (formato: (11)91234-5678)
- `email` (VARCHAR(100), NOT NULL, UNIQUE) - Email
- `state` (CHAR(2)) - Estado (UF)
- `profile_picture` (BLOB) - Foto de perfil
- `education` (VARCHAR(500)) - Formação acadêmica
- `skills` (VARCHAR(500)) - Habilidades/Competências
- `experience` (TEXT) - Experiência profissional
- `resume` (MEDIUMBLOB) - Currículo em PDF/arquivo
**⚠️ NOTA:** No script SQL base, a tabela `candidate` não possui os campos `current_stage`, `status`, `rejection_reason` e `vacancy_id`. Esses campos podem existir em versões estendidas do banco, mas não estão no script base fornecido.

**Estágios Possíveis (`current_stage`):**
1. `aguardando_triagem`
2. `triagem_inicial`
3. `avaliacao_fit_cultural`
4. `teste_tecnico`
5. `entrevista_tecnica`
6. `entrevista_final`
7. `proposta_fechamento`
8. `contratacao`

**Status Possíveis:**
- `ativo` - Candidato ativo no sistema
- `inativo` - Candidato inativo
- `rejeitado` - Candidato rejeitado
- `contratado` - Candidato contratado

**Relacionamentos:**
- Um candidato pode estar em múltiplos processos seletivos
- Um candidato pode ter múltiplos matches com vagas
- Um candidato pode ter múltiplos cards no kanban

**Uso no Front-End:**
- Listagem de candidatos (`candidatos.html`)
- Detalhes do candidato (`detalhes-candidato.html`)
- Upload de currículos (`upload-curriculos.html`)
- Visualização no kanban de recrutamento
- Sistema de match com vagas

---

### 3. Tabela `vacancies` - Vagas

**Campos:**
- `id_vacancy` (INT, PK, AUTO_INCREMENT) - Identificador único
- `position_job` (VARCHAR(100), NOT NULL) - Nome do cargo
- `period` (VARCHAR(20)) - Período (ex: 'Full-time', 'Part-time')
- `work_model` (ENUM: 'presencial', 'remoto', 'híbrido') - Modelo de trabalho
- `requirements` (TEXT) - Requisitos da vaga
- `contract_type` (ENUM: 'CLT', 'PJ', 'Temporário', 'Estágio', 'Autônomo') - Tipo de contrato
- `salary` (DECIMAL(10, 2)) - Salário
- `location` (VARCHAR(100)) - Localização
- `opening_justification` (LONGBLOB) - Justificativa de abertura (arquivo)
- `area` (VARCHAR(100)) - Área da vaga
- `status_vacancy` (VARCHAR(50), DEFAULT 'pendente aprovação') - Status
- `fk_manager` (INT) - FK para `user.id_user` - Gestor responsável
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP) - Data de criação

**Status Possíveis:**
- `pendente aprovação` - Aguardando aprovação
- `pendente_aprovacao` - Aguardando aprovação (alternativo)
- `aberta` - Vaga aberta para receber candidatos
- `aprovada` - Vaga aprovada
- `rejeitada` - Vaga rejeitada
- `fechada` - Vaga fechada

**Relacionamentos:**
- Muitas vagas para um gestor (`fk_manager`)
- Uma vaga pode ter múltiplos candidatos (via `selection_process`)
- Uma vaga pode ter múltiplos matches (via `candidate_match`)
- Uma vaga pode ter múltiplos cards no kanban

**Uso no Front-End:**
- Listagem de vagas (`vagas.html`)
- Visualização de detalhes da vaga
- Dashboard com métricas de vagas
- Filtros por status, área, gestor

---

### 4. Tabela `opening_requests` - Solicitações de Abertura de Vaga

**Campos:**
- `id` (INT, PK, AUTO_INCREMENT) - Identificador único
- `cargo` (VARCHAR(100), NOT NULL) - Nome do cargo
- `periodo` (VARCHAR(50), NOT NULL) - Período de trabalho
- `modelo_trabalho` (VARCHAR(50), NOT NULL) - Modelo (presencial/remoto/híbrido)
- `regime_contratacao` (VARCHAR(50), NOT NULL) - Tipo de contrato
- `salario` (DECIMAL(10, 2), NOT NULL) - Salário proposto
- `localidade` (VARCHAR(100), NOT NULL) - Localização
- `requisitos` (TEXT) - Requisitos
- `justificativa_path` (VARCHAR(255)) - Caminho do arquivo de justificativa
- `gestor_id` (INT, NOT NULL) - FK para `user.id_user` - Gestor solicitante
- `status` (ENUM: 'ENTRADA', 'ABERTA', 'APROVADA', 'REJEITADA', 'CANCELADA', DEFAULT 'ENTRADA')
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP) - Data de criação

**Status Possíveis:**
- `ENTRADA` - Solicitação criada, aguardando análise
- `ABERTA` - Solicitação aprovada e vaga aberta
- `APROVADA` - Solicitação aprovada (mas vaga ainda não aberta)
- `REJEITADA` - Solicitação rejeitada
- `CANCELADA` - Solicitação cancelada pelo gestor

**Relacionamentos:**
- Muitas solicitações para um gestor (`gestor_id`)
- Uma solicitação pode gerar uma vaga (quando aprovada)

**Uso no Front-End:**
- Formulário de abertura de vaga (`abertura-vaga.html`)
- Listagem "Minhas Solicitações" (`minhas-solicitacoes.html`)
- Aprovação/rejeição de solicitações (para ADMIN/HR)
- Filtros por status

---

### 5. Tabela `kanban_stage` - Estágios do Kanban

**Campos:**
- `id_stage` (INT, PK, AUTO_INCREMENT) - Identificador único
- `name` (VARCHAR(50), NOT NULL, UNIQUE) - Nome do estágio
- `position_order` (INT, NOT NULL) - Ordem de exibição

**Estágios Padrão (já inseridos):**
1. `aguardando_triagem` (ordem: 1)
2. `triagem_inicial` (ordem: 2)
3. `avaliacao_fit_cultural` (ordem: 3)
4. `teste_tecnico` (ordem: 4)
5. `entrevista_tecnica` (ordem: 5)
6. `entrevista_final` (ordem: 6)
7. `proposta_fechamento` (ordem: 7)
8. `contratacao` (ordem: 8)

**Uso no Front-End:**
- Definir colunas do kanban de recrutamento
- Ordenação dos cards no kanban
- Filtros e visualizações

---

### 6. Tabela `kanban_card` - Cards do Kanban

**Campos:**
- `id_card` (INT, PK, AUTO_INCREMENT) - Identificador único
- `fk_candidate` (INT, NOT NULL) - FK para `candidate.id_candidate`
- `fk_vacancy` (INT, NOT NULL) - FK para `vacancies.id_vacancy`
- `fk_stage` (INT, NOT NULL) - FK para `kanban_stage.id_stage` - Estágio atual
- `match_level` (ENUM: 'BAIXO', 'MEDIO', 'ALTO', 'DESTAQUE', DEFAULT 'MEDIO') - Nível de match
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP) - Data de criação
- `updated_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP ON UPDATE) - Última atualização

**Níveis de Match:**
- `DESTAQUE` - Match excelente (score geralmente > 90%)
- `ALTO` - Match alto (score 70-90%)
- `MEDIO` - Match médio (score 50-70%)
- `BAIXO` - Match baixo (score < 50%)

**Relacionamentos:**
- Um card representa um candidato em um processo de uma vaga específica
- Um card está sempre em um estágio do kanban
- Um candidato pode ter múltiplos cards (em vagas diferentes)

**Uso no Front-End:**
- Kanban de recrutamento (`kanban-recrutamento.html`)
- Drag and drop entre estágios
- Visualização de matches
- Filtros por vaga, candidato, estágio

---

### 7. Tabela `selection_process` - Processo Seletivo

**Campos:**
- `id_selection` (INT, PK, AUTO_INCREMENT) - Identificador único
- `progress` (DECIMAL(5, 2), DEFAULT 0.00) - Progresso (0-100%)
- `current_stage` (ENUM) - Estágio atual:
  - `aguardando_triagem`
  - `triagem_inicial`
  - `avaliacao_fit_cultural`
  - `teste_tecnico`
  - `entrevista_tecnica`
  - `entrevista_final`
  - `proposta_fechamento`
  - `contratacao`
- `outcome` (ENUM: 'aprovado', 'reprovado', 'pendente', DEFAULT 'pendente') - Resultado
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP) - Data de criação
- `fk_candidate` (INT, NOT NULL) - FK para `candidate.id_candidate`
- `fk_recruiter` (INT) - FK para `user.id_user` - Recrutador responsável
- `fk_vacancy` (INT, NOT NULL) - FK para `vacancies.id_vacancy`

**Relacionamentos:**
- Um processo seletivo é sempre de um candidato para uma vaga
- Um processo pode ter um recrutador responsável
- Um candidato pode ter múltiplos processos (em vagas diferentes)
- Uma vaga pode ter múltiplos processos (com diferentes candidatos)

**Uso no Front-End:**
- Acompanhamento de processos seletivos
- Detalhes do candidato (histórico de processos)
- Dashboard com métricas de processos
- Relatórios de tempo médio por estágio

---

### 8. Tabela `candidate_match` - Match de Candidatos com Vagas

**Campos:**
- `id_match` (INT, PK, AUTO_INCREMENT) - Identificador único
- `fk_candidate` (INT, NOT NULL) - FK para `candidate.id_candidate`
- `fk_vacancy` (INT, NOT NULL) - FK para `vacancies.id_vacancy`
- `score` (DECIMAL(5, 2), NOT NULL) - Score de compatibilidade (0-100%)
- `match_level` (ENUM: 'BAIXO', 'MEDIO', 'ALTO', 'DESTAQUE', NOT NULL) - Nível de match
- `created_at` (DATETIME, DEFAULT CURRENT_TIMESTAMP) - Data do match

**Constraint:**
- `UNIQUE (fk_candidate, fk_vacancy)` - Um candidato só pode ter um match por vaga

**Relacionamentos:**
- Um match relaciona um candidato a uma vaga
- Um candidato pode ter matches com múltiplas vagas
- Uma vaga pode ter matches com múltiplos candidatos

**Uso no Front-End:**
- Página de match de candidatos (`match-candidatos.html`)
- Ranking de candidatos por vaga
- Gráficos de distribuição de matches
- Filtros por nível de match

---

## 🔄 Fluxos Principais do Sistema

### 1. Fluxo de Abertura de Vaga

```
1. Gestor preenche formulário (abertura-vaga.html)
   ↓
2. Cria registro em opening_requests (status: 'ENTRADA')
   ↓
3. ADMIN/HR revisa a solicitação
   ↓
4. Solicitação aprovada → status: 'APROVADA' ou 'ABERTA'
   ↓
5. (Opcional) Cria vaga em vacancies automaticamente
   ↓
6. Vaga disponível para receber candidatos
```

**Páginas Envolvidas:**
- `abertura-vaga.html` - Formulário de criação
- `minhas-solicitacoes.html` - Gestor vê suas solicitações
- `vagas.html` - Lista de vagas aprovadas

---

### 2. Fluxo de Recrutamento (Kanban)

```
1. Candidato é associado a uma vaga
   ↓
2. Cria card em kanban_card (estágio: 'aguardando_triagem')
   ↓
3. Cria processo em selection_process
   ↓
4. Recrutador move card entre estágios (drag & drop)
   ↓
5. Atualiza kanban_card.fk_stage e selection_process.current_stage
   ↓
6. Atualiza selection_process.progress
   ↓
7. Finalização:
   - outcome: 'aprovado' → candidato contratado
   - outcome: 'reprovado' → candidato rejeitado
```

**Páginas Envolvidas:**
- `kanban-recrutamento.html` - Visualização e movimentação de cards
- `detalhes-candidato.html` - Detalhes e histórico do candidato
- `candidatos.html` - Lista de candidatos

---

### 3. Fluxo de Match de Candidatos

```
1. Sistema calcula score de compatibilidade
   (compara requisitos da vaga com skills do candidato)
   ↓
2. Cria registro em candidate_match
   ↓
3. Classifica match_level baseado no score:
   - DESTAQUE: > 90%
   - ALTO: 70-90%
   - MEDIO: 50-70%
   - BAIXO: < 50%
   ↓
4. Recrutador visualiza matches em match-candidatos.html
   ↓
5. Recrutador seleciona candidatos para iniciar processo
```

**Páginas Envolvidas:**
- `match-candidatos.html` - Visualização de matches
- `candidatos.html` - Lista de candidatos com indicador de match

---

## 🎨 Estrutura de Páginas do Front-End

### Páginas de Autenticação
- `login.html` - Login de usuários
- `register.html` - Registro (se aplicável)
- `forgot-password.html` - Recuperação de senha

### Páginas Principais
- `home.html` - Dashboard principal com cards de acesso rápido
- `charts.html` - Gráficos e métricas (Dashboard avançado)

### Páginas de Cadastro
- `adm.html` - Cadastro de administradores
- `gerente.html` - Cadastro de gerentes
- `rh.html` - Cadastro de recrutadores

### Páginas de Recrutamento
- `abertura-vaga.html` - Formulário de solicitação de abertura de vaga
- `minhas-solicitacoes.html` - Lista de solicitações do gestor logado
- `vagas.html` - Lista de vagas disponíveis
- `candidatos.html` - Lista de candidatos
- `upload-curriculos.html` - Upload de currículos em lote
- `match-candidatos.html` - Sistema de match candidato-vaga
- `kanban-recrutamento.html` - Kanban de processo seletivo
- `detalhes-candidato.html` - Detalhes completos de um candidato

### Páginas de Relatórios
- `tables.html` - Tabelas de dados

---

## 🔐 Controle de Acesso

### ADMIN (level_access: 'ADMIN')
- ✅ Acesso total ao sistema
- ✅ Pode aprovar/rejeitar solicitações de abertura
- ✅ Pode criar/editar/deletar usuários
- ✅ Acesso a todas as páginas

### HR (level_access: 'HR')
- ✅ Pode gerenciar processos seletivos
- ✅ Pode visualizar e mover cards no kanban
- ✅ Pode visualizar candidatos e vagas
- ✅ Pode fazer match de candidatos
- ❌ Não pode criar/editar/deletar usuários ADMIN
- ❌ Não pode aprovar solicitações de abertura (depende da regra de negócio)

### MANAGER (level_access: 'MANAGER')
- ✅ Pode criar solicitações de abertura de vaga
- ✅ Pode visualizar suas próprias solicitações
- ✅ Pode visualizar vagas aprovadas
- ✅ Pode visualizar candidatos (read-only)
- ❌ Não pode gerenciar processos seletivos
- ❌ Não pode criar/editar/deletar usuários

**Implementação no Front-End:**
```javascript
// Exemplo de verificação de acesso
const user = JSON.parse(localStorage.getItem('userLogged'));
const canAccess = ['ADMIN', 'HR'].includes(user.level_access);

if (!canAccess) {
    window.location.href = 'home.html';
    alert('Você não tem permissão para acessar esta página.');
}
```

---

## 📡 APIs e Endpoints Esperados

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dados do usuário logado

### Usuários
- `GET /api/users` - Listar usuários
- `GET /api/users/:id` - Buscar usuário
- `POST /api/users` - Criar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário

### Candidatos
- `GET /api/candidates` - Listar candidatos
- `GET /api/candidates/:id` - Buscar candidato
- `POST /api/candidates` - Criar candidato
- `PUT /api/candidates/:id` - Atualizar candidato
- `DELETE /api/candidates/:id` - Deletar candidato
- `POST /api/candidates/upload` - Upload de currículo

### Vagas
- `GET /api/vacancies` - Listar vagas
- `GET /api/vacancies/:id` - Buscar vaga
- `POST /api/vacancies` - Criar vaga
- `PUT /api/vacancies/:id` - Atualizar vaga
- `DELETE /api/vacancies/:id` - Deletar vaga

### Solicitações de Abertura
- `GET /api/opening-requests` - Listar solicitações
- `GET /api/opening-requests/:id` - Buscar solicitação
- `POST /api/opening-requests` - Criar solicitação
- `PUT /api/opening-requests/:id` - Atualizar solicitação
- `PUT /api/opening-requests/:id/approve` - Aprovar solicitação
- `PUT /api/opening-requests/:id/reject` - Rejeitar solicitação

### Processos Seletivos
- `GET /api/selection-process` - Listar processos
- `GET /api/selection-process/:id` - Buscar processo
- `POST /api/selection-process` - Criar processo
- `PUT /api/selection-process/:id` - Atualizar processo
- `PUT /api/selection-process/:id/stage` - Atualizar estágio

### Kanban
- `GET /api/kanban` - Listar todos os cards
- `GET /api/kanban/:stage` - Listar cards por estágio
- `PUT /api/kanban/card/:id/move` - Mover card para outro estágio
- `GET /api/kanban/search?q=termo` - Buscar cards

### Matches
- `GET /api/matches` - Listar matches
- `GET /api/matches/vacancy/:id` - Matches de uma vaga
- `GET /api/matches/candidate/:id` - Matches de um candidato
- `POST /api/matches` - Criar match
- `DELETE /api/matches/:id` - Remover match

### Dashboard
- `GET /api/dashboard/metrics` - Métricas gerais
- `GET /api/dashboard/vagas-mes` - Vagas por mês
- `GET /api/dashboard/status-vagas` - Status das vagas
- `GET /api/dashboard/candidatos-vaga` - Candidatos por vaga
- `GET /api/dashboard/tipo-contrato` - Distribuição por tipo de contrato
- `GET /api/dashboard/tempo-preenchimento` - Tempo médio de preenchimento

---

## 🎯 Convenções de Nomenclatura

### Campos no Front-End vs Backend

**User:**
- Front: `levelAccess` → Back: `levelAccess` (valores: '1', '2', '3')
- Front: `id_user` → Back: `id_user` ou `id`
- **Importante:** Usar `Utils.normalizeLevelAccess()` para comparar e `Utils.getLevelAccessName()` para exibir

**Candidate:**
- Front: `id_candidate` → Back: `id_candidate` ou `id`
- Front: `current_stage` → Back: `current_stage`
- Front: `vacancy_id` → Back: `vacancy_id`

**Vacancy:**
- Front: `id_vacancy` → Back: `id_vacancy` ou `id`
- Front: `position_job` → Back: `position_job`
- Front: `status_vacancy` → Back: `status_vacancy`

**Opening Request:**
- Front: `cargo` → Back: `cargo`
- Front: `periodo` → Back: `periodo`
- Front: `gestor_id` → Back: `gestor_id`

**Selection Process:**
- Front: `id` → Back: `id` (campo é `id`, não `id_selection`)
- Front: `current_stage` → Back: `current_stage`
- Front: `fk_candidate` → Back: `fk_candidate` ou `candidateId`
- Front: `fk_vacancy` → Back: `fk_vacancy` ou `vacancyId`
- Front: `created` → Back: `created` (não `created_at` no script SQL base)

**Kanban:**
- Front: `id_card` → Back: `id_card` ou `id`
- Front: `fk_stage` → Back: `fk_stage` ou `stageId`
- Front: `match_level` → Back: `match_level`

---

## 🚨 Pontos de Atenção

### 1. Status de Vagas
- O sistema usa variações de status: `'pendente aprovação'`, `'pendente_aprovacao'`, `'pendente aprovacao'`
- O front-end deve normalizar esses valores antes de exibir

### 2. Níveis de Acesso
- O enum `levelAccess` usa valores numéricos como string: `'1'`, `'2'`, `'3'`
  - `'1'` = ADMIN (Administrador)
  - `'2'` = HR (Recrutador)
  - `'3'` = MANAGER (Gestor)
- **SEMPRE usar `Utils.normalizeLevelAccess()` para comparações**
- **SEMPRE usar `Utils.getLevelAccessName()` para exibição**

### 3. Match Level
- Pode aparecer como `'MÉDIO'` ou `'MEDIO'` dependendo do banco
- Normalizar para `'MEDIO'` no front-end

### 4. Datas
- O backend retorna datas no formato ISO 8601 ou DATETIME
- Converter para formato brasileiro (DD/MM/YYYY) no front-end

### 5. Arquivos BLOB
- `opening_justification` é LONGBLOB no banco
- No front-end, enviar como FormData ou base64
- `resume` e `profile_picture` também são BLOBs

### 6. Validações
- Email sempre único
- Telefone no formato `(XX)9XXXX-XXXX`
- Estado em formato UF (2 caracteres)
- Score de match entre 0 e 100

---

## 📝 Checklist de Implementação

### Autenticação
- [ ] Login funcional
- [ ] Logout funcional
- [ ] Armazenamento de sessão (localStorage)
- [ ] Verificação de autenticação em todas as páginas protegidas
- [ ] Redirecionamento para login se não autenticado

### Controle de Acesso
- [ ] Verificação de `level_access` em páginas sensíveis
- [ ] Ocultação de botões/menus baseado em permissões
- [ ] Mensagens de erro de permissão

### Páginas Principais
- [ ] Dashboard (home.html) com métricas
- [ ] Gráficos funcionais (charts.html)
- [ ] Navegação entre páginas

### Gestão de Vagas
- [ ] Formulário de abertura de vaga
- [ ] Listagem de solicitações (minhas-solicitacoes.html)
- [ ] Listagem de vagas (vagas.html)
- [ ] Aprovação/rejeição de solicitações (se aplicável)

### Gestão de Candidatos
- [ ] Listagem de candidatos
- [ ] Detalhes do candidato
- [ ] Upload de currículos
- [ ] Edição de candidato

### Processo Seletivo
- [ ] Kanban de recrutamento funcional
- [ ] Drag and drop entre estágios
- [ ] Atualização de progresso
- [ ] Visualização de histórico

### Match
- [ ] Página de match de candidatos
- [ ] Filtros por vaga, score, nível
- [ ] Iniciar processo a partir do match

### Dashboard e Relatórios
- [ ] Métricas do topo
- [ ] Gráficos de vagas por mês
- [ ] Gráficos de status
- [ ] Gráficos de candidatos
- [ ] Gráficos de tempo médio

---

## 🔧 Tecnologias Utilizadas

- **HTML5** - Estrutura
- **CSS3** - Estilização (incluindo Bootstrap SB Admin 2)
- **JavaScript (ES6+)** - Lógica do front-end
- **Chart.js** - Gráficos
- **Font Awesome** - Ícones
- **Fetch API** - Comunicação com backend

---

## 📞 Suporte

Para dúvidas sobre a estrutura do banco ou integração:
1. Consultar este documento
2. Verificar scripts SQL em `database_script.sql`
3. Verificar exemplos de código nos arquivos existentes

---

**Última atualização:** Janeiro 2025
**Versão:** 1.0

