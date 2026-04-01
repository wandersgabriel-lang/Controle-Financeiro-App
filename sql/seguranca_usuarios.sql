-- ==============================================================
-- 1. CRIAÇÃO DA TABELA DE USUÁRIOS (COM FOCO EM SEGURANÇA)
-- ==============================================================

CREATE TABLE IF NOT EXISTS users (
    -- Chave primária de auto incremento
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Nome completo do usuário. Não permitimos valores nulos
    nome VARCHAR(150) NOT NULL,
    
    -- E-mail DEVE ser único (UNIQUE constraint) e obrigatório
    email VARCHAR(150) NOT NULL UNIQUE,
    
    -- Senha OBRIGATORIAMENTE armazenada como HASH (ex: gerado pelo bcrypt no backend)
    -- O tamanho VARCHAR(255) garante espaço de sobra para algoritmos como Argon2 e Bcrypt
    senha_hash VARCHAR(255) NOT NULL,
    
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Pode ser NULO até que o usuário faça o primeiro login
    ultimo_login TIMESTAMP NULL DEFAULT NULL
);

-- ==============================================================
-- 2. Criação de ÍNDICES para ganho de performance
-- ==============================================================

-- Como todo processo de Login sempre vai pesquisar pela coluna 'email',
-- colocar um UNIQUE Index aqui deixa a consulta instantânea.
-- OBS: Muitas engines (como MySQL) já criam índice automático pela restrição UNIQUE.
CREATE INDEX idx_users_email ON users(email);


-- ==============================================================
-- 3. EXEMPLOS DE CONSULTAS (CRUD e Autenticação)
-- ==============================================================

-- A) INSERIR NOVO USUÁRIO (Criar Conta / Cadastro)
-- ⚠️ REGRAS DE SEGURANÇA: 
-- 1 - A senha "MinhaSenha123" NÃO vem pro banco.
-- 2 - O backend (Ex: Node.js) roda o 'bcrypt.hash()' ANTES de mandar a query.
-- O banco recebe apenas a "faca cega" (a string aleatória do hash).
INSERT INTO users (nome, email, senha_hash) 
VALUES (
    'Wanders Gabriel', 
    'wandersgabriel@gmail.com', 
    '$2b$10$w1z91/4D7w0e5N4A.aBv0e5J4gK8hG...X' 
);

-- B) BUSCAR USUÁRIO PELO EMAIL (No momento do Login)
-- O usuário preenche o e-mail e a senha no frontend. 
-- O Backend localiza o ele por esta query, e e depois usa bcrypt.compare(senha, senha_hash).
SELECT id, nome, email, senha_hash 
FROM users 
WHERE email = 'wandersgabriel@gmail.com';

-- C) ATUALIZAR DATA DE ÚLTIMO LOGIN (Após Login validado)
-- Para uso analítico de retenção e sessões inativas
UPDATE users 
SET ultimo_login = CURRENT_TIMESTAMP 
WHERE email = 'wandersgabriel@gmail.com';

-- D) EXCLUIR USUÁRIO (Deletar Conta)
-- (Num sistema relacional completo com controle financeiro, usaríamos ON DELETE CASCADE nas transações, ou marcaríamos a conta como inativa)
DELETE FROM users 
WHERE email = 'wandersgabriel@gmail.com';
