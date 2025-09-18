# Estrutura de Assets - Quando Previdência

Esta pasta contém todos os arquivos CSS e JavaScript organizados de forma modular.

## 📁 Estrutura de Pastas

```
assets/
├── css/
│   ├── main.css                 # CSS principal com variáveis e estilos base
│   └── pages/
│       ├── login.css           # Estilos específicos da página de login
│       ├── candidatos.css      # Estilos específicos da página de candidatos
│       └── detalhes-candidato.css # Estilos específicos da página de detalhes
└── js/
    ├── components/
    │   ├── auth.js             # Gerenciador de autenticação
    │   └── utils.js            # Utilitários gerais
    └── pages/
        ├── login.js            # Lógica da página de login
        ├── register.js         # Lógica da página de cadastro
        └── candidatos.js       # Lógica da página de candidatos
```

## 🎨 CSS

### main.css
- Variáveis CSS globais
- Estilos base e reset
- Componentes reutilizáveis (botões, cards, formulários)
- Animações e transições
- Utilitários gerais

### Páginas Específicas
Cada página tem seu próprio arquivo CSS com estilos específicos:
- **login.css**: Layout de login com sidebar
- **candidatos.css**: Cards de candidatos e funcionalidades de busca/ordenação
- **detalhes-candidato.css**: Layout de detalhes com seções expansíveis

## ⚡ JavaScript

### components/

#### auth.js
Gerenciador de autenticação com métodos para:
- Login/logout
- Cadastro de usuários
- Verificação de sessão
- Redefinição de senha

#### utils.js
Utilitários gerais:
- Validação de formulários
- Mensagens de feedback
- Formatação de dados
- Funções de debounce/throttle
- Utilitários de UI

### pages/
Cada página tem sua própria classe JavaScript:
- **login.js**: Lógica de login com validações
- **register.js**: Lógica de cadastro
- **candidatos.js**: Gerenciamento de candidatos, busca e ordenação

## 🔧 Como Usar

### CSS
```html
<!-- CSS principal (sempre incluir) -->
<link href="./assets/css/main.css" rel="stylesheet">

<!-- CSS específico da página -->
<link href="./assets/css/pages/login.css" rel="stylesheet">
```

### JavaScript
```html
<!-- Componentes (sempre incluir na ordem) -->
<script src="./assets/js/components/utils.js"></script>
<script src="./assets/js/components/auth.js"></script>

<!-- Script específico da página -->
<script src="./assets/js/pages/login.js"></script>
```

## 📋 Benefícios da Organização

1. **Modularidade**: Cada funcionalidade em seu próprio arquivo
2. **Reutilização**: Componentes podem ser usados em múltiplas páginas
3. **Manutenibilidade**: Fácil localizar e editar código específico
4. **Performance**: Carregamento otimizado de recursos
5. **Escalabilidade**: Estrutura preparada para crescimento

## 🚀 Próximos Passos

- [ ] Adicionar mais páginas específicas
- [ ] Criar componentes JavaScript reutilizáveis
- [ ] Implementar sistema de temas
- [ ] Adicionar testes unitários
- [ ] Minificar arquivos para produção

