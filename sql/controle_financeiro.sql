-- Criação do banco de dados (opcional)
CREATE DATABASE IF NOT EXISTS controle_financeiro;
USE controle_financeiro;

-- ==========================================
-- 1. CRIAÇÃO DAS TABELAS
-- ==========================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_categoria VARCHAR(100) NOT NULL,
    -- Restringe o tipo a apenas 'receita' ou 'despesa'
    tipo ENUM('receita', 'despesa') NOT NULL 
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    -- Valor decimal com restrição para não ser negativo
    valor DECIMAL(10, 2) NOT NULL CHECK (valor >= 0),
    -- Restringe o tipo na transação (também ajuda na consistência)
    tipo ENUM('receita', 'despesa') NOT NULL,
    categoria_id INT NOT NULL,
    data_transacao DATE NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Relacionamentos (Chaves Estrangeiras)
    -- Se o usuário for deletado, suas transações também serão (CASCADE)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    -- Impede a exclusão de uma categoria se houver transações vinculadas (RESTRICT)
    FOREIGN KEY (categoria_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- ==========================================
-- 2. ÍNDICES DE OTIMIZAÇÃO
-- ==========================================
-- Índices para melhorar a performance nas consultas que faremos com frequência
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_categoria_id ON transactions(categoria_id);
CREATE INDEX idx_transactions_data ON transactions(data_transacao);


-- ==========================================
-- 3. INSERÇÃO DE DADOS PADRÃO
-- ==========================================

-- Inserindo as categorias base do sistema
INSERT INTO categories (nome_categoria, tipo) VALUES
('alimentação', 'despesa'),
('transporte', 'despesa'),
('moradia', 'despesa'),
('lazer', 'despesa'),
('salário', 'receita'),
('investimento', 'receita');


-- ==========================================
-- 4. CONSULTAS EXTRAS SOLICITADAS
-- ==========================================

-- A: Consultar saldo total do usuário (Exemplo para o usuário com ID = 1)
-- Calcula a diferença entre a soma de todas as receitas e todas as despesas
SELECT 
    user_id,
    SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) AS total_receitas,
    SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) AS total_despesas,
    SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END) AS saldo_total
FROM transactions
WHERE user_id = 1
GROUP BY user_id;

-- B: Listar despesas por categoria (Exemplo para o usuário com ID = 1)
-- Mostra o nome da categoria e o total gasto nela, ordenado do maior pro menor
SELECT 
    c.nome_categoria,
    SUM(t.valor) AS total_gasto
FROM transactions t
JOIN categories c ON t.categoria_id = c.id
WHERE t.user_id = 1 
  AND t.tipo = 'despesa'
GROUP BY c.id, c.nome_categoria
ORDER BY total_gasto DESC;
