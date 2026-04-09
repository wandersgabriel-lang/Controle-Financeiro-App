const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Faz o Backend atuar como hospedeiro das páginas (Unificação)
app.use(express.static(path.join(__dirname, '../frontend')));

const JWT_SECRET = 'sua_senha_secreta_aqui_para_criptografia';

// ==========================================
// 1. CONEXÃO AO BANCO
// ==========================================
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) console.error('Erro ao abrir o banco de dados:', err.message);
    else {
        console.log('✅ Conectado ao banco de dados SQLite.');
        criarTabelas();
    }
});

function criarTabelas() {
    db.serialize(() => {
        // Tabela de Usuários com Segurança (Hash)
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            senha_hash TEXT NOT NULL,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            ultimo_login DATETIME
        )`);

        // Categorias
        db.run(`CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_categoria TEXT NOT NULL,
            tipo TEXT CHECK(tipo IN ('receita', 'despesa')) NOT NULL
        )`, () => {
             db.get("SELECT COUNT(*) as count FROM categories", (err, row) => {
                 if (row && row.count === 0) {
                     const stmt = db.prepare("INSERT INTO categories (nome_categoria, tipo) VALUES (?, ?)");
                     const defaults = [
                         ['Alimentação', 'despesa'], ['Transporte', 'despesa'],
                         ['Moradia', 'despesa'], ['Lazer', 'despesa'],
                         ['Salário', 'receita'], ['Investimento', 'receita']
                     ];
                     defaults.forEach(cat => stmt.run(cat[0], cat[1]));
                     stmt.finalize();
                 }
             });
        });

        // Transações
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            descricao TEXT NOT NULL,
            valor REAL NOT NULL CHECK (valor >= 0),
            tipo TEXT CHECK(tipo IN ('receita', 'despesa')) NOT NULL,
            categoria_id INTEGER NOT NULL,
            data_transacao DATE NOT NULL,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (categoria_id) REFERENCES categories(id) ON DELETE RESTRICT
        )`);
    });
}

// ==========================================
// 2. MIDDLEWARES DE SEGURANÇA
// ==========================================
function verificarAutenticacao(req, res, next) {
    const tokenHeader = req.headers['authorization'];
    if (!tokenHeader) {
        return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
    }

    const token = tokenHeader.split(' ')[1]; // Tira a palavra Bearer
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ erro: 'Sessão inválida ou expirada.' });
        req.userId = decoded.id; 
        next();
    });
}

// ==========================================
// 3. ENDPOINTS DE AUTENTICAÇÃO
// ==========================================

// Registrar novo usuário
app.post('/api/registro', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;
        if (!nome || !email || !senha) return res.status(400).json({ erro: 'Preencha todos os campos.' });

        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        const sql = `INSERT INTO users (nome, email, senha_hash) VALUES (?, ?, ?)`;
        db.run(sql, [nome, email, senhaHash], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) return res.status(400).json({ erro: 'Email já cadastrado.' });
                return res.status(500).json({ erro: err.message });
            }
            res.status(201).json({ mensagem: 'Usuário salvo com sucesso!' });
        });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Login (Autenticação)
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) return res.status(500).json({ erro: 'Erro no servidor' });
        if (!user) return res.status(401).json({ erro: 'E-mail não encontrado' });

        const senhaCorreta = await bcrypt.compare(senha, user.senha_hash);
        if (!senhaCorreta) return res.status(401).json({ erro: 'Senha incorreta' });

        db.run('UPDATE users SET ultimo_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '12h' });

        res.json({ mensagem: 'Login com sucesso', token, user: { nome: user.nome, email: user.email }});
    });
});

// ==========================================
// 4. ENDPOINTS FINANCEIROS (Protegidos)
// ==========================================

app.get('/api/categorias', verificarAutenticacao, (req, res) => {
    db.all("SELECT * FROM categories", [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

app.get('/api/transacoes', verificarAutenticacao, (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const sql = `
        SELECT t.id, t.descricao, t.valor, t.tipo, t.data_transacao as data, c.nome_categoria as categoria
        FROM transactions t JOIN categories c ON t.categoria_id = c.id
        WHERE t.user_id = ? ORDER BY t.data_transacao DESC, t.id DESC
        LIMIT ? OFFSET ?
    `;
    db.all(sql, [req.userId, limit, offset], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

app.get('/api/estatisticas', verificarAutenticacao, (req, res) => {
    const sql = `SELECT tipo, COALESCE(SUM(valor), 0) as total FROM transactions WHERE user_id = ? GROUP BY tipo`;
    db.all(sql, [req.userId], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });

        let receitas = 0;
        let despesas = 0;
        rows.forEach(row => {
            if (row.tipo === 'receita') receitas = row.total;
            if (row.tipo === 'despesa') despesas = row.total;
        });

        res.json({ receitas, despesas, saldo: receitas - despesas });
    });
});

app.post('/api/transacoes', verificarAutenticacao, (req, res) => {
    const { descricao, valor, tipo, categoria_id, data } = req.body;
    const query = `INSERT INTO transactions (user_id, descricao, valor, tipo, categoria_id, data_transacao) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, [req.userId, descricao, valor, tipo, categoria_id, data], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.status(201).json({ id: this.lastID, sucesso: true });
    });
});

app.delete('/api/transacoes/:id', verificarAutenticacao, (req, res) => {
    db.run("DELETE FROM transactions WHERE id = ? AND user_id = ?", [req.params.id, req.userId], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ sucesso: true });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`\n🚀 Servidor Backend JWT rodando na porta ${PORT}!\n`));
