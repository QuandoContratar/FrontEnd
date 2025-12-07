-- ========================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS
-- Sistema: Quando Contratar
-- ========================================

DROP DATABASE IF EXISTS quando_contratar;
CREATE DATABASE quando_contratar;
USE quando_contratar;

-- ========================================
-- TABELA: user (Usuários do sistema)
-- ========================================

CREATE TABLE user (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    area VARCHAR(50),
    level_access ENUM('ADMIN','HR','MANAGER') DEFAULT 'MANAGER' COMMENT 'Níveis de acesso do usuário'
);


-- ========================================
-- TABELA: candidate (Candidatos)
-- ========================================
CREATE TABLE candidate (
    id_candidate INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    birth DATE,
    phone_number CHAR(14),
    email VARCHAR(100) NOT NULL UNIQUE,
    state CHAR(2),
    profile_picture BLOB,
    education VARCHAR(500),
    skills VARCHAR(500),
    experience TEXT,
    resume MEDIUMBLOB,
	current_stage VARCHAR(50) DEFAULT 'aguardando_triagem',
    status VARCHAR(20) DEFAULT 'ativo',
    rejection_reason VARCHAR(500),
    vacancy_id BIGINT
);

-- ========================================
-- TABELA: vacancies (Vagas)
-- ========================================
CREATE TABLE vacancies (
    id_vacancy INT AUTO_INCREMENT PRIMARY KEY,
    position_job VARCHAR(100) NOT NULL,
    period VARCHAR(20),
    work_model ENUM('presencial', 'remoto', 'híbrido') DEFAULT 'presencial',
    requirements TEXT,
    contract_type ENUM('CLT', 'PJ', 'Temporário', 'Estágio', 'Autônomo') DEFAULT 'CLT',
    salary DECIMAL(10, 2),
    location VARCHAR(100),
    opening_justification VARCHAR(255),
    area VARCHAR(100),
    status_vacancy VARCHAR(50) DEFAULT 'pendente aprovação',
    fk_manager INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fk_manager) REFERENCES user(id_user) ON DELETE SET NULL
);

-- ========================================
-- TABELA: opening_requests (Solicitações de Abertura de Vaga)
-- IMPORTANTE: Esta tabela é usada pelo frontend para criar solicitações
-- ========================================
CREATE TABLE opening_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cargo VARCHAR(100) NOT NULL,
    periodo VARCHAR(50) NOT NULL,
    modelo_trabalho VARCHAR(50) NOT NULL,
    regime_contratacao VARCHAR(50) NOT NULL,
    salario DECIMAL(10, 2) NOT NULL,
    localidade VARCHAR(100) NOT NULL,
    requisitos TEXT,
    justificativa_path VARCHAR(255),
    gestor_id INT NOT NULL,
    status ENUM('ENTRADA', 'ABERTA', 'APROVADA', 'REJEITADA', 'CANCELADA') DEFAULT 'ENTRADA',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gestor_id) REFERENCES user(id_user) ON DELETE CASCADE,
    INDEX idx_gestor_id (gestor_id),
    INDEX idx_status (status)
);

CREATE TABLE candidate_profile (
    id_profile INT AUTO_INCREMENT PRIMARY KEY,
    fk_candidate INT NOT NULL,
    raw_json JSON NOT NULL,

    total_experience_years DECIMAL(4,1),
    main_seniority ENUM('JUNIOR','PLENO','SENIOR','LEAD'),
    main_stack VARCHAR(100),
    main_role VARCHAR(100),

    city VARCHAR(100),
    state CHAR(2),
    remote_preference VARCHAR(20),

    hard_skills TEXT,
    soft_skills TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (fk_candidate) REFERENCES candidate(id_candidate) ON DELETE CASCADE
);


-- ========================================
-- KANBAN – ESTÁGIOS
-- ========================================

CREATE TABLE kanban_stage (
    id_stage INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    position_order INT NOT NULL
);

INSERT INTO kanban_stage (name, position_order) VALUES
('aguardando_triagem',1),
('triagem_inicial', 2),
('avaliacao_fit_cultural', 3),
('teste_tecnico', 4),
('entrevista_tecnica', 5),
('entrevista_final', 6),
('proposta_fechamento', 7),
('contratacao', 8);

-- ========================================
-- KANBAN – CARDS
-- ========================================

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

-- ========================================
-- TABELA: selection_process (Processo Seletivo)
-- ========================================
CREATE TABLE selection_process (
    `id_selection` INT AUTO_INCREMENT PRIMARY KEY,
    `progress` DECIMAL(5, 2) DEFAULT 0.00,
    `current_stage` ENUM (
        'aguardando_triagem',
        'triagem_inicial',
        'avaliacao_fit_cultural',
        'teste_tecnico',
        'entrevista_tecnica',
        'entrevista_final',
        'proposta_fechamento',
        'contratacao'
    ) DEFAULT 'aguardando_triagem',
    `outcome` ENUM('aprovado', 'reprovado', 'pendente') DEFAULT 'pendente',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `fk_candidate` INT NOT NULL,
    `fk_recruiter` INT,
    `fk_vacancy` INT NOT NULL,
    FOREIGN KEY (`fk_candidate`) REFERENCES candidate(`id_candidate`) ON DELETE CASCADE,
    FOREIGN KEY (`fk_recruiter`) REFERENCES user(`id_user`) ON DELETE SET NULL,
    FOREIGN KEY (`fk_vacancy`) REFERENCES vacancies(`id_vacancy`) ON DELETE CASCADE,
    INDEX idx_candidate (`fk_candidate`),
    INDEX idx_vacancy (`fk_vacancy`)
);

-- ========================================
-- TABELA: candidate_match (Match de Candidatos com Vagas)
-- ========================================
CREATE TABLE candidate_match (
    id_match INT AUTO_INCREMENT PRIMARY KEY,
    fk_candidate INT NOT NULL,
    fk_vacancy INT NOT NULL,
    score DECIMAL(5, 2) NOT NULL COMMENT 'Compatibilidade em %',
    match_level ENUM('BAIXO', 'MEDIO', 'ALTO', 'DESTAQUE') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fk_candidate) REFERENCES candidate(id_candidate) ON DELETE CASCADE,
    FOREIGN KEY (fk_vacancy) REFERENCES vacancies(id_vacancy) ON DELETE CASCADE,
    UNIQUE KEY unique_match (fk_candidate, fk_vacancy),
    INDEX idx_score (score),
    INDEX idx_match_level (match_level)
);

-- ========================================
-- DADOS INICIAIS
-- ========================================

-- Usuários do sistema
INSERT INTO user (name, email, password, area, level_access) VALUES
('Carlos Manager', 'cmanager@example.com', 'pass123', 'TI', 'ADMIN'),
('Ana Recruiter', 'arecruiter@example.com', 'pass456', 'RH', 'ADMIN'),
('Paulo Admin', 'admin@example.com', 'adminpass', 'TI', 'ADMIN'),
('Lucio Limeira', 'lucio@example.com', 'pass789', 'TI', 'ADMIN');

-- Candidatos
INSERT INTO candidate (name, birth, phone_number, email, state, education, skills) VALUES
('João da Silva', '1998-06-15', '(11)91234-5678', 'joao.silva@example.com', 'SP', 'Bacharel em Ciência da Computação', 'Java, Spring, MySQL'),
('Maria Oliveira', '1995-04-22', '(21)92345-6789', 'maria.oliveira@example.com', 'RJ', 'Engenharia de Software', 'Python, Django, PostgreSQL'),
('Carlos Souza', '2000-10-10', '(31)93456-7890', 'carlos.souza@example.com', 'MG', 'Sistemas de Informação', 'JavaScript, React, Node.js'),
('Ana Lima', '1992-12-05', '(47)94567-8901', 'ana.lima@example.com', 'SC', 'Análise e Desenvolvimento de Sistemas', 'C#, .NET, SQL Server'),
('Lucas Pereira', '1999-08-30', '(41)95678-9012', 'lucas.pereira@example.com', 'PR', 'Ciência da Computação', 'Kotlin, Android, Firebase');

-- Vagas (criadas a partir de opening_requests aprovadas)
INSERT INTO vacancies (position_job, period, work_model, requirements, contract_type, salary, location, opening_justification, area, fk_manager, status_vacancy) VALUES
('Desenvolvedor Java', 'Full-time', 'remoto', 'Experiência com Java e Spring Boot', 'CLT', 8000.00, 'São Paulo', 'Nova vaga para projeto X', 'Tecnologia', 1, 'aberta'),
('Analista de Dados', 'Part-time', 'presencial', 'Conhecimento em Python e SQL', 'PJ', 5000.00, 'Rio de Janeiro', 'Crescimento da área', 'Tecnologia', 1, 'aberta'),
('Desenvolvedor Full Stack', 'Full-time', 'híbrido', 'React, Node.js, MongoDB', 'CLT', 9000.00, 'São Paulo', 'Expansão do time', 'Tecnologia', 4, 'aberta');

-- Solicitações de abertura de vaga (exemplos)
-- IMPORTANTE: gestor_id deve referenciar um id_user válido
INSERT INTO opening_requests
(cargo, periodo, modelo_trabalho, regime_contratacao, salario, localidade, requisitos, justificativa_path, gestor_id, status)
VALUES
('Engenheiro de Software', 'Full-time', 'remoto', 'CLT', 12000.00, 'São Paulo', 'Experiência com Java, Spring Boot e Docker', '/docs/justificativas/justificativa1.pdf', 1, 'ENTRADA'),
('Analista de Suporte', 'Part-time', 'presencial', 'PJ', 4000.00, 'Rio de Janeiro', 'Conhecimento em Linux e Redes', '/docs/justificativas/justificativa2.pdf', 1, 'ENTRADA'),
('Designer UX/UI', 'Full-time', 'híbrido', 'CLT', 7000.00, 'Belo Horizonte', 'Experiência com Figma e Design Systems', NULL, 1, 'APROVADA'),
('Cientista de Dados', 'Full-time', 'remoto', 'CLT', 15000.00, 'São Paulo', 'Python, Machine Learning, SQL', '/docs/justificativas/justificativa3.pdf', 4, 'ENTRADA');

INSERT INTO kanban_card (fk_candidate, fk_vacancy, fk_stage, match_level)
VALUES
(1, 1, 1, 'ALTO'),
(2, 2, 1, 'MEDIO'),
(4, 3, 2, 'ALTO'),
(5, 1, 2, 'MEDIO'),
(3, 1, 1, 'BAIXO');


-- Matches de candidatos
INSERT INTO candidate_match (fk_candidate, fk_vacancy, score, match_level) VALUES
(1, 1, 85.50, 'ALTO'),
(2, 2, 92.30, 'DESTAQUE'),
(3, 1, 78.90, 'ALTO'),
(4, 2, 65.20, 'MEDIO'),
(5, 1, 88.70, 'ALTO');

INSERT INTO candidate_profile
(fk_candidate, raw_json, total_experience_years, main_seniority, main_stack, main_role,
 city, state, remote_preference, hard_skills, soft_skills)
VALUES
(
 1,
 '{
   "name": "João da Silva",
   "email": "joao@gmail.com",
   "phone": "119999999",
   "location": { "city": "São Paulo", "state": "SP", "workFormat": "remoto" },
   "education": [
     { "institution": "USP", "course": "Ciência da Computação", "level": "superior", "startYear": 2018, "endYear": 2022 }
   ],
   "experiences": [
     {
       "company": "XPTO Tech",
       "role": "Desenvolvedor Backend",
       "startDate": "2020-06",
       "endDate": "2022-12",
       "responsibilities": ["Java", "Spring Boot", "APIs"],
       "technologies": ["Java", "Spring", "MySQL"]
     }
   ],
   "skills": ["Java", "Spring Boot", "SQL"],
   "softSkills": ["comunicação", "proatividade"],
   "totalExperienceYears": 3.5,
   "seniority": "pleno"
 }',
 3.5,
 'PLENO',
 'java',
 'Desenvolvedor Backend',
 'São Paulo',
 'SP',
 'REMOTO',
 'Java,Spring Boot,SQL',
 'comunicação,proatividade'
);

INSERT INTO candidate_profile
(fk_candidate, raw_json, total_experience_years, main_seniority, main_stack, main_role,
 city, state, remote_preference, hard_skills, soft_skills)
VALUES
(
 2,
 '{
   "name": "Maria Oliveira",
   "email": "maria@gmail.com",
   "phone": "219999999",
   "location": { "city": "Rio de Janeiro", "state": "RJ", "workFormat": "presencial" },
   "education": [
     { "institution": "UFRJ", "course": "Engenharia de Software", "level": "superior", "startYear": 2017, "endYear": 2021 }
   ],
   "experiences": [
     {
       "company": "DataCorp",
       "role": "Analista de Dados",
       "startDate": "2021-01",
       "endDate": null,
       "responsibilities": ["Power BI", "Python", "ETL"],
       "technologies": ["Python", "SQL", "Power BI"]
     }
   ],
   "skills": ["Python", "SQL", "Power BI"],
   "softSkills": ["organização", "trabalho em equipe"],
   "totalExperienceYears": 2.0,
   "seniority": "junior"
 }',
 2.0,
 'JUNIOR',
 'python',
 'Analista de Dados',
 'Rio de Janeiro',
 'RJ',
 'PRESENCIAL',
 'Python,SQL,Power BI',
 'organização,trabalho em equipe'
);

INSERT INTO candidate_profile
(fk_candidate, raw_json, total_experience_years, main_seniority, main_stack, main_role,
 city, state, remote_preference, hard_skills, soft_skills)
VALUES
(
 3,
 '{
   "name": "Carlos Souza",
   "email": "carlos@gmail.com",
   "phone": "319999999",
   "location": { "city": "Belo Horizonte", "state": "MG", "workFormat": "hibrido" },
   "education": [
     { "institution": "PUC Minas", "course": "Sistemas de Informação", "level": "superior", "startYear": 2016, "endYear": 2020 }
   ],
   "experiences": [
     {
       "company": "CloudOps",
       "role": "DevOps Engineer",
       "startDate": "2020-01",
       "endDate": null,
       "responsibilities": ["CI/CD", "Docker", "AWS"],
       "technologies": ["Linux", "Docker", "AWS"]
     }
   ],
   "skills": ["Linux", "Docker", "AWS"],
   "softSkills": ["proatividade", "liderança"],
   "totalExperienceYears": 4.0,
   "seniority": "pleno"
 }',
 4.0,
 'PLENO',
 'docker',
 'DevOps Engineer',
 'Belo Horizonte',
 'MG',
 'HIBRIDO',
 'Linux,Docker,AWS',
 'proatividade,liderança'
);

INSERT INTO candidate_profile
(fk_candidate, raw_json, total_experience_years, main_seniority, main_stack, main_role,
 city, state, remote_preference, hard_skills, soft_skills)
VALUES
(
 4,
 '{
   "name": "Ana Lima",
   "email": "ana@gmail.com",
   "phone": "479999999",
   "location": { "city": "Florianópolis", "state": "SC", "workFormat": "hibrido" },
   "education": [
     { "institution": "UFSC", "course": "Design", "level": "superior", "startYear": 2015, "endYear": 2019 }
   ],
   "experiences": [
     {
       "company": "DesignPro",
       "role": "UX Designer",
       "startDate": "2019-02",
       "endDate": null,
       "responsibilities": ["Wireframes", "User Research"],
       "technologies": ["Figma", "Miro"]
     }
   ],
   "skills": ["Figma", "Design System"],
   "softSkills": ["comunicação", "empatia"],
   "totalExperienceYears": 3.0,
   "seniority": "junior"
 }',
 3.0,
 'JUNIOR',
 'figma',
 'UX Designer',
 'Florianópolis',
 'SC',
 'HIBRIDO',
 'Figma,Design System',
 'comunicação,empatia'
);

INSERT INTO candidate_profile
(fk_candidate, raw_json, total_experience_years, main_seniority, main_stack, main_role,
 city, state, remote_preference, hard_skills, soft_skills)
VALUES
(
 5,
 '{
   "name": "Lucas Pereira",
   "email": "lucas@gmail.com",
   "phone": "419999999",
   "location": { "city": "Curitiba", "state": "PR", "workFormat": "presencial" },
   "education": [
     { "institution": "UNICURITIBA", "course": "TCI", "level": "tecnico", "startYear": 2018, "endYear": 2020 }
   ],
   "experiences": [
     {
       "company": "NetSupport",
       "role": "Suporte Técnico",
       "startDate": "2020-01",
       "endDate": null,
       "responsibilities": ["Atendimento", "Redes"],
       "technologies": ["Windows", "Redes"]
     }
   ],
   "skills": ["Windows", "Redes"],
   "softSkills": ["organização"],
   "totalExperienceYears": 2.5,
   "seniority": "junior"
 }',
 2.5,
 'JUNIOR',
 'windows',
 'Suporte Técnico',
 'Curitiba',
 'PR',
 'PRESENCIAL',
 'Windows,Redes',
 'organização'
);

INSERT INTO vacancies
(position_job, period, work_model, requirements, contract_type, salary, location, opening_justification, area, fk_manager, status_vacancy)
VALUES
(
 'Desenvolvedor Backend Pleno',
 'Integral',
 'remoto',
 'Requisitos:
  - 3+ anos de experiência com Java e Spring Boot
  - Familiaridade com SQL e APIs REST
  - Diferencial: Docker, AWS
  - Senioridade: Pleno',
 'CLT',
 8500,
 'São Paulo',
 'Expansão da equipe backend',
 'TI',
 1,
 'aberta'
);

INSERT INTO vacancies
(position_job, period, work_model, requirements, contract_type, salary, location, opening_justification, area, fk_manager, status_vacancy)
VALUES
(
 'Analista de Dados Júnior',
 'Integral',
 'presencial',
 'Requisitos:
  - 1+ ano de experiência com Python e SQL
  - Power BI é obrigatório
  - Diferencial: ETL
  - Localização RJ',
 'CLT',
 4500,
 'Rio de Janeiro',
 'Crescimento da área de dados',
 'Tecnologia',
 1,
 'aberta'
);

INSERT INTO vacancies
(position_job, period, work_model, requirements, contract_type, salary, location, opening_justification, area, fk_manager, status_vacancy)
VALUES
(
 'DevOps Engineer Pleno',
 'Integral',
 'híbrido',
 'Requisitos:
  - Experiência com Linux, Docker e AWS
  - CI/CD obrigatório
  - Senioridade Pleno ou Senior
  - Diferencial: Kubernetes',
 'PJ',
 12000,
 'Belo Horizonte',
 'Nova operação de automação',
 'TI',
 4,
 'aberta'
);

INSERT INTO vacancies
(position_job, period, work_model, requirements, contract_type, salary, location, opening_justification, area, fk_manager, status_vacancy)
VALUES
(
 'UX/UI Designer Júnior',
 'Integral',
 'híbrido',
 'Requisitos:
  - Conhecimento em Figma e criação de Design Systems
  - Senioridade Júnior
  - Diferencial: Pesquisa com usuários',
 'CLT',
 4000,
 'Florianópolis',
 'Nova squad de produto',
 'Produto',
 4,
 'aberta'
);

INSERT INTO vacancies
(position_job, period, work_model, requirements, contract_type, salary, location, opening_justification, area, fk_manager, status_vacancy)
VALUES
(
 'Técnico de Infraestrutura',
 'Integral',
 'presencial',
 'Requisitos:
  - Experiência com Redes e Windows
  - Atendimento ao usuário
  - Diferencial: Certificação CCNA',
 'CLT',
 3500,
 'Curitiba',
 'Suporte à operação interna',
 'Infraestrutura',
 1,
 'aberta'
);


-- ========================================
-- CONSULTAS DE VERIFICAÇÃO
-- ========================================

SELECT '=== USUÁRIOS ===' AS info;
SELECT * FROM user;

SELECT '=== CANDIDATOS ===' AS info;
SELECT * FROM candidate;

SELECT '=== VAGAS ===' AS info;
SELECT * FROM vacancies;

SELECT '=== SOLICITAÇÕES DE ABERTURA ===' AS info;
SELECT
    o.id,
    o.cargo,
    o.periodo,
    o.modelo_trabalho,
    o.regime_contratacao,
    o.salario,
    o.localidade,
    o.status,
    u.name AS gestor_nome,
    o.created_at
FROM opening_requests o
LEFT JOIN user u ON o.gestor_id = u.id_user
ORDER BY o.created_at DESC;


SELECT
    kc.id_card,
    c.name AS candidate_name,
    v.position_job,
    u.name AS manager_name,
    ks.name AS stage,
    kc.match_level
FROM kanban_card kc
JOIN candidate c       ON kc.fk_candidate = c.id_candidate
JOIN vacancies v       ON kc.fk_vacancy = v.id_vacancy
JOIN user u            ON v.fk_manager = u.id_user
JOIN kanban_stage ks   ON kc.fk_stage = ks.id_stage;


SELECT '=== MATCHES ===' AS info;
SELECT * FROM candidate_match;

-- ========================================
-- FIM DO SCRIPT
-- ========================================

select * from user;

desc user;

select * from user;

INSERT INTO user (name, email, password, area, level_access) VALUES
('Tilia', 'tilia@example.com', 'pass123', 'TI', 'HR'),
('Amanda', 'amanda@example.com', 'pass456', 'RH', 'HR'),
('Clara', 'clara@example.com', 'adminpass', 'TI', 'MANAGER');

select * from user;
select * from vacancies;
ALTER TABLE vacancies MODIFY COLUMN opening_justification LONGBLOB;

update vacancies set fk_manager = 1 where id_vacancy = 6;

update vacancies set status_vacancy = 'aberta' where id_vacancy = 6;

INSERT INTO opening_requests
(cargo, periodo, modelo_trabalho, regime_contratacao, salario, localidade, requisitos, gestor_id, status)
VALUES
('Dev Backend Junior', 'Full-time', 'remoto', 'CLT', 6500, 'São Paulo', 'Java, Spring Boot', 1, 'ENTRADA'),
('Analista de Infraestrutura', 'Full-time', 'presencial', 'CLT', 8000, 'Rio de Janeiro', 'Linux, Redes, Docker', 1, 'ENTRADA'),
('Assistente de RH', 'Part-time', 'híbrido', 'CLT', 3000, 'Curitiba', 'Atendimento, Organização', 1, 'ENTRADA');


INSERT INTO opening_requests
(cargo, periodo, modelo_trabalho, regime_contratacao, salario, localidade, requisitos, gestor_id, status)
VALUES
('Product Manager', 'Full-time', 'remoto', 'CLT', 12000, 'São Paulo', 'Scrum, Jira, UX', 1, 'ABERTA'),
('QA Analyst Pleno', 'Full-time', 'presencial', 'CLT', 7000, 'Belo Horizonte', 'Testes manuais e automação', 1, 'ABERTA'),
('Estagiário de Suporte', 'Part-time', 'presencial', 'Estágio', 1800, 'São Paulo', 'Redes básicas, Windows', 1, 'ABERTA'),
('Dev Front-end', 'Full-time', 'híbrido', 'PJ', 9000, 'Campinas', 'React, JS, HTML/CSS', 4, 'ABERTA');


INSERT INTO opening_requests
(cargo, periodo, modelo_trabalho, regime_contratacao, salario, localidade, requisitos, gestor_id, status)
VALUES
('Designer UI/UX', 'Full-time', 'remoto', 'CLT', 7500, 'São Paulo', 'Figma, Design System', 1, 'APROVADA'),
('DevOps Engineer', 'Full-time', 'remoto', 'CLT', 14000, 'São Paulo', 'AWS, CI/CD, Kubernetes', 1, 'APROVADA');


INSERT INTO opening_requests
(cargo, periodo, modelo_trabalho, regime_contratacao, salario, localidade, requisitos, gestor_id, status)
VALUES
('Assistente Administrativo', 'Full-time', 'presencial', 'CLT', 2500, 'São Paulo', 'Organização, Excel básico', 1, 'REJEITADA'),
('Scrum Master', 'Full-time', 'remoto', 'PJ', 11000, 'Rio de Janeiro', 'Scrum, Agile Coaching', 1, 'REJEITADA');


INSERT INTO opening_requests
(cargo, periodo, modelo_trabalho, regime_contratacao, salario, localidade, requisitos, gestor_id, status)
VALUES
('Auxiliar de Logística', 'Full-time', 'presencial', 'CLT', 2400, 'Curitiba', 'Expedição, Organização', 1, 'CANCELADA'),
('Cientista de Dados', 'Full-time', 'remoto', 'CLT', 16000, 'São Paulo', 'Python, ML, SQL', 4, 'CANCELADA');

select * from opening_requests;

INSERT INTO vacancies
(position_job, area, period, work_model, contract_type, salary, location, requirements, fk_manager, status_vacancy)
VALUES
('Analista de Sistemas', 'TI', 'Integral', 'Remoto', 'CLT', 5500, 'São Paulo', 'SQL, API, SCRUM', 1, 'pendente_aprovacao'),
('Assistente Financeiro', 'Financeiro', 'Integral', 'Presencial', 'CLT', 3100, 'Santo André', 'Excel, Contas a pagar/receber', 2, 'pendente_aprovacao'),
('UX Designer Jr', 'Produto', 'Meio período', 'Híbrido', 'PJ', 4200, 'São Caetano', 'Figma, Design System', 1, 'pendente_aprovacao'),
('Desenvolvedor Back-End Jr', 'TI', 'Integral', 'Remoto', 'CLT', 6500, 'Campinas', 'Java, Spring, SQL', 4, 'pendente_aprovacao');

DESCRIBE vacancies;

INSERT INTO user (name, email, password, area, level_access) VALUES
('Carlos Manager', 'carlos.manager@qc.com', '123', 'TI', 'MANAGER'),
('Ana Recrutadora', 'ana.recrutadora@qc.com', '123', 'RH', 'HR'),
('João Admin', 'joao.admin@qc.com', '123', 'TI', 'ADMIN'),
('Mariana Gestora', 'mariana.gestora@qc.com', '123', 'Produto', 'MANAGER');

INSERT INTO vacancies
(position_job, period, work_model, requirements, contract_type, salary, location, opening_justification, area, fk_manager, status_vacancy)
VALUES
('Desenvolvedor Back-end Jr', 'Integral', 'remoto', 'Java, Spring, SQL', 'CLT', 6500, 'São Paulo', 'Expansão da equipe', 'TI', 1, 'aberta'),
('Analista de Dados Jr', 'Integral', 'presencial', 'Python, SQL, Power BI', 'CLT', 5000, 'Rio de Janeiro', 'Demanda crescente', 'Dados', 1, 'aberta'),
('DevOps Jr', 'Integral', 'híbrido', 'Linux, Docker, AWS', 'PJ', 8000, 'Belo Horizonte', 'Projeto novo', 'TI', 4, 'aberta'),
('UX Designer Jr', 'Meio Período', 'remoto', 'Figma, UI/UX', 'CLT', 4500, 'Florianópolis', 'Nova squad', 'Produto', 4, 'pendente aprovação'),
('Analista de Suporte', 'Integral', 'presencial', 'Redes, Windows', 'CLT', 3000, 'Curitiba', 'Turnover alto', 'TI', 1, 'rejeitada'),
('Cientista de Dados Jr', 'Integral', 'remoto', 'Python, ML, SQL', 'CLT', 9000, 'São Paulo', 'Projeto Big Data', 'Dados', 3, 'concluída');

INSERT INTO candidate (name, birth, phone_number, email, state, education, skills, vacancy_id)
VALUES
('João Silva', '1996-05-10', '(11)98888-1111', 'joao.silva@ex.com', 'SP', 'ADS', 'Java, SQL', 1),
('Maria Oliveira', '1998-07-21', '(21)97777-2222', 'maria.oliveira@ex.com', 'RJ', 'CC', 'Python, Power BI', 2),
('Carlos Souza', '1999-02-15', '(31)96666-3333', 'carlos.souza@ex.com', 'MG', 'SI', 'Linux, Docker', 3),
('Ana Lima', '1995-11-02', '(47)95555-4444', 'ana.lima@ex.com', 'SC', 'ADS', 'UX, Figma', 4),
('Lucas Pereira', '2000-03-18', '(41)94444-5555', 'lucas.pereira@ex.com', 'PR', 'TCI', 'Redes, Windows', 5),

-- SP (10 candidatos)
('Bruna Mendes', '1997-08-10', '(11)98888-6666', 'bruna.mendes@ex.com', 'SP', 'ADS', 'Java', 1),
('Thiago Costa', '1998-12-20', '(11)97777-7777', 'thiago.costa@ex.com', 'SP', 'CC', 'Spring', 1),
('Larissa Gomes', '1994-10-05', '(11)96666-8888', 'larissa.gomes@ex.com', 'SP', 'Eng Software', 'SQL', 2),
('Matheus Pinto', '1995-04-22', '(11)95555-9999', 'matheus.pinto@ex.com', 'SP', 'SI', 'React', 3),
('Fernanda Dias', '1999-01-11', '(11)94444-0000', 'fernanda.dias@ex.com', 'SP', 'ADS', 'AWS', 3),

-- RJ (5 candidatos)
('Rafael Costa', '1996-06-01', '(21)95555-2222', 'rafael.costa@ex.com', 'RJ', 'CC', 'SQL', 2),
('Beatriz Lima', '1997-09-13', '(21)93333-1111', 'beatriz.lima@ex.com', 'RJ', 'ADS', 'Python', 2),
('Felipe Rocha', '1999-11-25', '(21)92222-4444', 'felipe.rocha@ex.com', 'RJ', 'SI', 'ETL', 6),
('Camila Santos', '1998-03-09', '(21)91111-7777', 'camila.santos@ex.com', 'RJ', 'CC', 'ML', 6),
('Leonardo Paes', '1997-12-30', '(21)90000-8888', 'leonardo.paes@ex.com', 'RJ', 'CC', 'APIs', 1),

-- MG (5 candidatos)
('Sofia Martins', '1996-10-03', '(31)95555-1111', 'sofia.martins@ex.com', 'MG', 'ADS', 'Java', 1),
('Hugo Andrade', '1998-07-17', '(31)94444-2222', 'hugo.andrade@ex.com', 'MG', 'CC', 'SQL', 2),
('Paula Ribeiro', '1994-01-21', '(31)93333-3333', 'paula.ribeiro@ex.com', 'MG', 'SI', 'Docker', 3),
('Ricardo Melo', '1999-03-29', '(31)92222-4444', 'ricardo.melo@ex.com', 'MG', 'ADS', 'Linux', 5),
('Marina Freitas', '1995-11-14', '(31)91111-5555', 'marina.freitas@ex.com', 'MG', 'CC', 'Python', 6);

INSERT INTO candidate_match (fk_candidate, fk_vacancy, score, match_level)
VALUES
(1,1,92,'DESTAQUE'),
(2,2,88,'ALTO'),
(3,3,76,'ALTO'),
(4,4,64,'MEDIO'),
(5,5,58,'MEDIO'),

(6,1,95,'DESTAQUE'),
(7,1,89,'ALTO'),
(8,2,72,'ALTO'),
(9,3,67,'ALTO'),
(10,3,54,'MEDIO'),

(11,1,48,'MEDIO'),
(12,2,33,'BAIXO'),
(13,6,28,'BAIXO'),
(14,6,12,'BAIXO'),
(15,1,81,'ALTO'),

(16,2,91,'DESTAQUE'),
(17,3,86,'ALTO'),
(18,3,74,'ALTO'),
(19,6,69,'ALTO'),
(20,5,55,'MEDIO');

INSERT INTO selection_process (progress, current_stage, outcome, fk_candidate, fk_recruiter, fk_vacancy)
VALUES
(100,'contratacao','aprovado',1,2,1),
(80,'entrevista_final','pendente',2,2,2),
(100,'contratacao','aprovado',3,2,3),
(40,'triagem_inicial','reprovado',4,2,4),
(60,'teste_tecnico','pendente',5,2,5);


INSERT INTO kanban_card (fk_candidate, fk_vacancy, fk_stage, match_level)
VALUES
(2,2,1,'MEDIO'),
(3,3,2,'ALTO'),
(4,4,3,'MEDIO'),
(5,5,4,'ALTO'),
(6,1,2,'ALTO'),
(7,1,3,'ALTO'),
(8,2,2,'MEDIO'),
(9,3,4,'ALTO'),
(10,3,5,'DESTAQUE');




