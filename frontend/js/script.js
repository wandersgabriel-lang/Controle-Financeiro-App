// ================== GERENCIAMENTO DO LOGIN ================== //
// Bloqueio Inicial: Se não tiver token, volta pra rua (login.html)
const token = localStorage.getItem('financas_token');
if (!token) {
    window.location.href = 'login.html';
}

const API_URL = '/api';

// Configurações Globais de Cabeçalho (Sempre empurrar o Token)
const headersComAutenticacao = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
};

// Referências do DOM
const form = document.getElementById('form');
const descricao = document.getElementById('descricao');
const valor = document.getElementById('valor');
const tipo = document.getElementById('tipo');
const categoria = document.getElementById('categoria');
const data = document.getElementById('data');
const listaTransacoes = document.getElementById('listaTransacoes');
const saldoAtual = document.getElementById('saldoAtual');
const totalReceitas = document.getElementById('totalReceitas');
const totalDespesas = document.getElementById('totalDespesas');
const btnLogout = document.getElementById('btnLogout'); // Objeto novo criado no HTML

// Lógica para deslogar
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem('financas_token');
        localStorage.removeItem('financas_user');
        window.location.href = 'login.html';
    });
}

// Histórico
let transactions = [];
let categoriasData = []; 

// Funções de Formatação
const formatarMoeda = (val) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatarData = (dataIso) => {
    if (!dataIso) return '';
    const [ano, mes, dia] = dataIso.split('-');
    return `${dia}/${mes}/${ano}`;
};

// ================= FETCH DO BANCO DE DADOS =================

// Adicionamos o "headersComAutenticacao" em TODOS os fetch
const carregarCategorias = async () => {
    try {
        const response = await fetch(`${API_URL}/categorias`, { headers: headersComAutenticacao });
        if (response.status === 401) return forcarLogout(); // Token expirou

        categoriasData = await response.json();
        atualizarSelectCategorias();
    } catch (error) {
        console.error('Erro:', error);
    }
};

const atualizarSelectCategorias = () => {
    const tipoSelecionado = tipo.value; 
    const categoriasFiltradas = categoriasData.filter(c => c.tipo === tipoSelecionado);
    categoria.innerHTML = '';
    categoriasFiltradas.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id; 
        option.textContent = cat.nome_categoria;
        categoria.appendChild(option);
    });
};
tipo.addEventListener('change', atualizarSelectCategorias);


const carregarTransacoes = async () => {
    try {
        const response = await fetch(`${API_URL}/transacoes`, { headers: headersComAutenticacao });
        if (response.status === 401) return forcarLogout();
        transactions = await response.json();
        renderizarTela();
    } catch (error) {
        console.error('Erro ao buscar as transações:', error);
    }
};

const salvarTransacaoNoBanco = async (transaction) => {
    try {
        const response = await fetch(`${API_URL}/transacoes`, {
            method: 'POST',
            headers: headersComAutenticacao, // Token aqui!
            body: JSON.stringify(transaction) 
        });
        if (response.status === 401) return forcarLogout();
        await carregarTransacoes(); 
    } catch (error) {
        alert('Erro ao salvar no banco!');
    }
}

const removeTransaction = async (id) => {
    try {
        await fetch(`${API_URL}/transacoes/${id}`, { 
            method: 'DELETE',
            headers: headersComAutenticacao
        });
        await carregarTransacoes(); 
    } catch (error) {
         console.error('Erro ao deletar transação:', error);
    }
};

function forcarLogout() {
    alert("Sessão expirada. Faça login novamente.");
    localStorage.removeItem('financas_token');
    window.location.href = 'login.html';
}

// ================= RENDERIZAÇÃO =================
const addTransactionDOM = (transaction) => {
    const isDespesa = transaction.tipo === 'despesa';
    const li = document.createElement('li');
    li.classList.add(transaction.tipo);
    li.innerHTML = `
        <div class="item-info">
            <span class="item-desc">${transaction.descricao}</span>
            <span class="item-meta">${transaction.categoria} | ${formatarData(transaction.data)}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 5px;">
            <span class="item-valor">
                ${isDespesa ? '-' : ''}${formatarMoeda(transaction.valor)}
            </span>
            <button class="btn-excluir" onclick="removeTransaction(${transaction.id})" title="Excluir">❌</button>
        </div>
    `;
    listaTransacoes.appendChild(li);
};

const updateValues = () => {
    const receitasTotal = transactions.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0);
    const despesasTotal = transactions.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0);
    const total = receitasTotal - despesasTotal;

    saldoAtual.innerText = formatarMoeda(total);
    totalReceitas.innerText = formatarMoeda(receitasTotal);
    totalDespesas.innerText = formatarMoeda(despesasTotal);

    if (total < 0) saldoAtual.style.color = '#ff4c4c';
    else if (total > 0) saldoAtual.style.color = '#00f529';
    else saldoAtual.style.color = 'white';
};

const renderizarTela = () => {
    listaTransacoes.innerHTML = '';
    transactions.forEach(addTransactionDOM);
    updateValues();
};

// ================= EVENTOS =================
form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!descricao.value.trim() || !valor.value || !data.value) {
        alert('Por favor, preencha todos os campos!');
        return;
    }
    const novaTransacao = {
        descricao: descricao.value.trim(),
        valor: parseFloat(valor.value),
        tipo: tipo.value,
        categoria_id: parseInt(categoria.value),
        data: data.value
    };
    salvarTransacaoNoBanco(novaTransacao);
    descricao.value = '';
    valor.value = '';
});

const init = async () => {
    await carregarCategorias(); 
    await carregarTransacoes(); 
};
init();
