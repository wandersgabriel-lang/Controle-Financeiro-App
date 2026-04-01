# 💰 Calculador de Salário & Controle Financeiro

Uma aplicação Full-Stack web responsiva para gerenciamento financeiro de receitas e despesas. Construído com Node.js no backend e uma interface rica e baseada no design *Glassmorphism* em Vanilla JavaScript, HTML e CSS.

O projeto inclui um sistema de autenticação segura utilizando **JWT (JSON Web Tokens)** e criptografia **Bcrypt**, além de persistência de dados em um banco de dados **SQLite** blindado para Nuvem.

---

## ✨ Funcionalidades

- **Gerenciamento Financeiro Dinâmico:** Cadastre e exclua ganhos ou gastos e receba o cálculo automático do saldo geral e sub-saldos.
- **Sistema multi-usuários seguro:** Tela de Login e Cadastro blindada em banco de dados isolado onde um usuário não enxerga as contas do outro.
- **Backend Robusto:** API RESTful que gerencia validações, sessões, buscas e inserções via parâmetros.
- **UI Moderna (*Glassmorphism*):** Layout semi-translúcido flexível que se molda elegantemente a qualquer imagem de fundo.
- **Compatibilidade em Nuvem:** Preparado com variáveis de ambiente unificadas (Node.js LTS `v20.x`) para rápida publicação (CI/CD) em provedores como Render.com.

---

## 🛠️ Tecnologias Utilizadas

**Frontend:**
- HTML5 & CSS3 (com flexbox, media queries e efeitos var/backdrop-filter)
- JavaScript Vanilla (Consumo de API Fetch, LocalStorage)

**Backend & Banco de Dados:**
- **Node.js** (Ambiente de execução)
- **Express.js** (Framework de roteamento para a API e rotas estáticas do Front)
- **SQLite3** (Banco de dados relacional e portável)
- **Bcrypt** (Hash criptográfico avançado de senhas)
- **JsonWebToken** (Autenticação baseada em Bearer Tokens para sessões seguras de 12 horas)
- **Cors** (Políticas de recursos da web)

---

## 📁 Estrutura de Pastas

```text
/
├─ package.json             # Controle de dependências e configuração do motor Node
├─ README.md                # Este documento do projeto
├─ backend/
│   ├─ server.js            # Coração do Backend (APIs) e injetor do Frontend
│   └─ database.db          # Seu Banco de Dados Dinâmico criado pelo SQLite
│
├─ frontend/
│   ├─ index.html           # Tela principal protegida
│   ├─ login.html           # Tela de acesso e registro
│   ├─ css/
│   │   └─ style.css        # Design geral (Interface Glass)
│   ├─ js/
│   │   └─ script.js        # Lógica de interface, Fetch APIs e Injeção do JWT
│   └─ img/
│       └─ background.png   # Imagem principal
│
└─ sql/
    ├─ controle_financeiro.sql    # Relatório/Documentação das lógicas financeiras
    └─ seguranca_usuarios.sql     # Relatório/Documentação estruturais da segurança JWT
```

---

## 🚀 Como Executar Localmente na sua Máquina

1. Certifique-se de que possui o **Node.js** (versão 20 ou mais recente) e o **Git** instalados.

2. Acesse a raiz do seu projeto e no terminal (ou no do VS Code), instale as bibliotecas necessárias do servidor:
   ```bash
   npm install
   ```

3. Inicie o Servidor Geral Web:
   ```bash
   npm start
   ```

4. Acesse pelo navegador local, abrindo o link do frontend ou a porta do localhost, caso esteja direcionada: `http://localhost:3000`

---

## 🌐 Deploy em Produção (Nuvem)

O projeto foi refatorado considerando hospedagem simplificada.
No provedor Cloud (Ex: Render.com):

1. O `package.json` já conta com `"engines": { "node": "20.x" }` e porta dinâmica (`process.env.PORT`), que impedem conflitos binários no motor GLIBC comum em SOs Linux em nuvem.
2. Certifique-se de preencher em seu painel os comandos:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. A aplicação hospedada em Nuvem tem uma única dependência: o seu banco de dados `database.db` é re-criado como um arquivo efêmero em servidores Cloud que "hibernam". Caso precise de persistência vitalícia nas contas, basta apontar a conexão SQL do Sequelize / SQLite3 deste projeto para a URL de um PostgreSQL grátis futuramente.

Desenvolvido com 💼 no VS Code.
