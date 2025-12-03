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
    `id_user` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL, -- Aumentado para hash de senha
    `area` VARCHAR(50),
    `levelAccess` ENUM('1', '2', '3') DEFAULT '3' COMMENT '1=Admin, 2=RH, 3=Gestor'
);

-- ========================================
-- TABELA: candidate (Candidatos)
-- ========================================
CREATE TABLE candidate (
    `id_candidate` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `birth` DATE,
    `phone_number` CHAR(14),
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `state` CHAR(2),
    `profile_picture` BLOB,
    `education` VARCHAR(500),
    `skills` VARCHAR(500),
    `experience` TEXT,
    `resume` MEDIUMBLOB
);

-- ========================================
-- TABELA: vacancies (Vagas)
-- ========================================
CREATE TABLE vacancies (
    `id_vacancy` INT AUTO_INCREMENT PRIMARY KEY,
    `position_job` VARCHAR(100) NOT NULL,
    `period` VARCHAR(20),
    `work_model` ENUM('presencial', 'remoto', 'híbrido') DEFAULT 'presencial',
    `requirements` TEXT,
    `contract_type` ENUM('CLT', 'PJ', 'Temporário', 'Estágio', 'Autônomo') DEFAULT 'CLT',
    `salary` DECIMAL(10, 2),
    `location` VARCHAR(100),
    `opening_justification` VARCHAR(255),
    `area` VARCHAR(100),
    `status_vacancy` VARCHAR(50) DEFAULT 'pendente aprovação',
    `fk_manager` INT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`fk_manager`) REFERENCES user(`id_user`) ON DELETE SET NULL
);

-- ========================================
-- TABELA: opening_requests (Solicitações de Abertura de Vaga)
-- IMPORTANTE: Esta tabela é usada pelo frontend para criar solicitações
-- ========================================
CREATE TABLE opening_requests (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `cargo` VARCHAR(100) NOT NULL,
    `periodo` VARCHAR(50) NOT NULL,
    `modelo_trabalho` VARCHAR(50) NOT NULL,
    `regime_contratacao` VARCHAR(50) NOT NULL,
    `salario` DECIMAL(10, 2) NOT NULL,
    `localidade` VARCHAR(100) NOT NULL,
    `requisitos` TEXT,
    `justificativa_path` VARCHAR(255),
    `gestor_id` INT NOT NULL,
    `status` ENUM('ENTRADA', 'ABERTA', 'APROVADA', 'REJEITADA', 'CANCELADA') DEFAULT 'ENTRADA',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`gestor_id`) REFERENCES user(`id_user`) ON DELETE CASCADE,
    INDEX idx_gestor_id (`gestor_id`),
    INDEX idx_status (`status`)
);

-- ========================================
-- TABELA: selection_process (Processo Seletivo)
-- ========================================
CREATE TABLE selection_process (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
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
    `created` DATETIME DEFAULT CURRENT_TIMESTAMP,
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
    `id_match` INT AUTO_INCREMENT PRIMARY KEY,
    `fk_candidate` INT NOT NULL,
    `fk_vacancy` INT NOT NULL,
    `score` DECIMAL(5, 2) NOT NULL COMMENT 'Compatibilidade em %',
    `match_level` ENUM('BAIXO', 'MÉDIO', 'ALTO', 'DESTAQUE') NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`fk_candidate`) REFERENCES candidate(`id_candidate`) ON DELETE CASCADE,
    FOREIGN KEY (`fk_vacancy`) REFERENCES vacancies(`id_vacancy`) ON DELETE CASCADE,
    UNIQUE KEY unique_match (`fk_candidate`, `fk_vacancy`),
    INDEX idx_score (`score`),
    INDEX idx_match_level (`match_level`)
);

-- ========================================
-- DADOS INICIAIS
-- ========================================

-- Usuários do sistema
INSERT INTO user (name, email, password, area, levelAccess) VALUES
('Carlos Manager', 'cmanager@example.com', 'pass123', 'TI', '3'),
('Ana Recruiter', 'arecruiter@example.com', 'pass456', 'RH', '2'),
('Paulo Admin', 'admin@example.com', 'adminpass', 'TI', '1'),
('Lucio Limeira', 'lucio@example.com', 'pass789', 'TI', '3');

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

-- Processos seletivos
INSERT INTO selection_process (progress, current_stage, outcome, created, fk_candidate, fk_recruiter, fk_vacancy) VALUES
(30.00, 'triagem_inicial', 'aprovado', '2025-10-10 09:30:00', 1, 2, 1),
(70.00, 'entrevista_tecnica', 'aprovado', '2025-10-12 14:00:00', 2, 2, 2),
(90.00, 'proposta_fechamento', 'aprovado', '2025-10-13 10:00:00', 3, 2, 1),
(50.00, 'teste_tecnico', 'reprovado', '2025-10-11 11:00:00', 4, 2, 2),
(100.00, 'contratacao', 'aprovado', '2025-10-14 15:00:00', 5, 2, 1);

-- Matches de candidatos
INSERT INTO candidate_match (fk_candidate, fk_vacancy, score, match_level) VALUES
(1, 1, 85.50, 'ALTO'),
(2, 2, 92.30, 'DESTAQUE'),
(3, 1, 78.90, 'ALTO'),
(4, 2, 65.20, 'MÉDIO'),
(5, 1, 88.70, 'ALTO');

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

SELECT '=== PROCESSOS SELETIVOS ===' AS info;
SELECT * FROM selection_process;

SELECT '=== MATCHES ===' AS info;
SELECT * FROM candidate_match;

-- ========================================
-- FIM DO SCRIPT
-- ========================================

