# 📝 Changelog - Ajustes no Front-End

## Data: Janeiro 2025

### ✅ Alterações Realizadas

#### 1. Remoção Completa do Kanban de Abertura de Vagas
- ✅ Removido `kanban-abertura-vaga.html`
- ✅ Removido `kanban-abertura-vaga.js`
- ✅ Removido `kanban-abertura-vaga.css`
- ✅ Removido card do dashboard em `home.html`
- ✅ Verificado que não há mais referências no código

#### 2. Utilitários de Mapeamento de LevelAccess
- ✅ Adicionado `Utils.getLevelAccessName()` - Converte valores numéricos ('1', '2', '3') ou strings ('ADMIN', 'HR', 'MANAGER') para nomes legíveis
- ✅ Adicionado `Utils.normalizeLevelAccess()` - Normaliza para formato padronizado (ADMIN, HR, MANAGER)
- ✅ Adicionado `Utils.hasPermission()` - Verifica permissões do usuário
- ✅ Atualizado `Utils.updateUserName()` para usar os novos mapeamentos

**Exemplos de uso:**
```javascript
// Obter nome legível
Utils.getLevelAccessName('1'); // Retorna: 'Administrador'
Utils.getLevelAccessName('ADMIN'); // Retorna: 'Administrador'

// Normalizar para comparação
Utils.normalizeLevelAccess('1'); // Retorna: 'ADMIN'
Utils.normalizeLevelAccess('3'); // Retorna: 'MANAGER'

// Verificar permissão
Utils.hasPermission(user.levelAccess, 'ADMIN'); // true se user.levelAccess for '1' ou 'ADMIN'
Utils.hasPermission(user.levelAccess, ['ADMIN', 'HR']); // true se for ADMIN ou HR
```

#### 3. Atualização do Documento de Nivelamento
- ✅ Corrigido campo `user.levelAccess` - Agora documenta valores ENUM('1', '2', '3')
- ✅ Adicionado mapeamento: '1'=ADMIN, '2'=HR, '3'=MANAGER
- ✅ Atualizado seção de convenções de nomenclatura
- ✅ Adicionado avisos sobre campos do candidate (alguns podem não existir no script base)
- ✅ Atualizado seção de Selection Process (campo `id` ao invés de `id_selection`, `created` ao invés de `created_at`)

---

## 🔄 Estrutura do Banco de Dados (Script SQL Base)

### Tabelas Principais:

1. **`user`**
   - `levelAccess` ENUM('1', '2', '3') - **IMPORTANTE: Valores numéricos!**

2. **`candidate`**
   - Campos básicos apenas (sem `current_stage`, `status`, etc. no script base)

3. **`vacancies`**
   - Estrutura padrão conforme script SQL

4. **`opening_requests`**
   - Estrutura padrão conforme script SQL

5. **`selection_process`**
   - Campo `id` (não `id_selection`)
   - Campo `created` (não `created_at`)

6. **`candidate_match`**
   - `match_level` pode ser 'MÉDIO' (com acento) ou 'MEDIO'

### ⚠️ Tabelas do Kanban

**Nota:** O script SQL base fornecido (`database_script.sql`) **NÃO** contém as tabelas `kanban_stage` e `kanban_card`. 

Essas tabelas existem no script alternativo (`sql/dados_teste_dashboard.sql`). Se você precisar usar o kanban, adicione estas tabelas ao seu script:

```sql
CREATE TABLE kanban_stage (
    id_stage INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    position_order INT NOT NULL
);

CREATE TABLE kanban_card (
    id_card INT AUTO_INCREMENT PRIMARY KEY,
    fk_candidate INT NOT NULL,
    fk_vacancy INT NOT NULL,
    fk_stage INT NOT NULL,
    match_level ENUM('BAIXO','MEDIO','ALTO','DESTAQUE') DEFAULT 'MEDIO',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (fk_candidate) REFERENCES candidate(id_candidate) ON DELETE CASCADE,
    FOREIGN KEY (fk_vacancy) REFERENCES vacancies(id_vacancy) ON DELETE CASCADE,
    FOREIGN KEY (fk_stage) REFERENCES kanban_stage(id_stage) ON DELETE CASCADE
);
```

---

## 🎯 Próximos Passos Recomendados

### 1. Atualizar Clients da API
- [ ] Verificar se os clients estão usando os campos corretos
- [ ] Ajustar mapeamento de `levelAccess` nos clients
- [ ] Verificar campos de `selection_process` (usar `id` e `created`)

### 2. Atualizar Páginas que Usam LevelAccess
- [ ] `adm.js` - Usar `Utils.normalizeLevelAccess()` e `Utils.hasPermission()`
- [ ] `gerente.js` - Usar `Utils.normalizeLevelAccess()` e `Utils.hasPermission()`
- [ ] `rh.js` - Usar `Utils.normalizeLevelAccess()` e `Utils.hasPermission()`
- [ ] Verificar todas as páginas que verificam permissões

### 3. Testes
- [ ] Testar login com usuários de diferentes níveis
- [ ] Verificar exibição de nomes de cargo
- [ ] Testar controle de acesso nas páginas

---

## 📚 Referências

- **Documento de Nivelamento:** `FrontEnd/NIVELAMENTO_FRONTEND.md`
- **Script SQL Base:** `FrontEnd/database_script.sql`
- **Utilitários:** `FrontEnd/public/assets/js/components/utils.js`

---

## 💡 Dicas de Uso

### Verificar Permissões em Páginas
```javascript
// No início de cada página protegida
const user = JSON.parse(localStorage.getItem('userLogged') || localStorage.getItem('currentUser'));

if (!Utils.hasPermission(user.levelAccess, ['ADMIN', 'HR'])) {
    window.location.href = 'home.html';
    Utils.showMessage('Você não tem permissão para acessar esta página.', 'error');
}
```

### Exibir Nome do Cargo
```javascript
const user = JSON.parse(localStorage.getItem('userLogged'));
const cargo = Utils.getLevelAccessName(user.levelAccess);
console.log(cargo); // 'Administrador', 'RH', ou 'Gestor'
```

### Normalizar para Comparação
```javascript
const userLevel = Utils.normalizeLevelAccess(user.levelAccess);
if (userLevel === 'ADMIN') {
    // Ações apenas para admin
}
```

