// Inicializa o banco de dados
const request = indexedDB.open("FuncionariosDB", 1); // Abertura (open) da versão 1 do banco de dados FuncionariosDB no indexedDB 

request.onupgradeneeded = function (event) { // onupgradeneeded - Evento de atualização, serve para atualizar versões
    let db = event.target.result; // Retorna o objeto IDBDatabase do banco de dados que está sendo criado ou atualizado
    let store = db.createObjectStore("funcionarios", { keyPath: "id", autoIncrement: true }); // Cria um espaço onde os dados são armazenados
    store.createIndex("nome", "nome", { unique: false });
    store.createIndex("cpf", "cpf", { unique: true });
    store.createIndex("email", "email", { unique: true });
    store.createIndex("telefone", "telefone", { unique: true });
    store.createIndex("cargo", "cargo", { unique: false });
};

request.onsuccess = function (event) { // Evento que é executado quando a operação foi concluída com sucesso
    console.log("Banco de dados carregado com sucesso!");
    listarFuncionarios(); // Garante que os dados sejam carregados ao iniciar
};

request.onerror = function (event) { // Evento que é executado quando houve erro na operação 
    console.error("Erro ao abrir o IndexedDB:", event.target.error);
};

// Função auxiliar para verificar se o banco de dados foi carregado corretamente
function verificarDB() {
    if (!request.result) {  // Verifica se o banco está disponível, caso não esteja, retorna null
        console.error("O banco de dados não foi carregado corretamente.");
        return null;
    }
    return request.result;
}

// Captura o evento de envio do formulário
document.querySelector(".add_names").addEventListener("submit", function (event) {
    event.preventDefault();

    // Validação de dados antes de adicionar o funcionário
    let nome = document.getElementById("nome").value.trim();
    let cpf = document.getElementById("cpf").value.trim();
    let email = document.getElementById("email").value.trim();
    let telefone = document.getElementById("telefone").value.trim();
    let dataNascimento = document.getElementById("data_nascimento").value.trim();
    let cargo = document.getElementById("cargo").value.trim();

    if (!nome || !cpf || !email || !telefone || !dataNascimento || !cargo) {
        mostrarFeedback("Todos os campos são obrigatórios!", "error");
        return;
    }

    if (!validarCPF(cpf)) {
        mostrarFeedback("CPF inválido!", "error");
        return;
    }

    if (!validarEmail(email)) {
        mostrarFeedback("E-mail inválido!", "error");
        return;
    }

    let funcionario = {
        nome: nome,
        cpf: cpf,
        email: email,
        telefone: telefone,
        data_nascimento: dataNascimento,
        cargo: cargo
    };

    adicionarFuncionario(funcionario);
});

// Função para validar o CPF (simplificada)
function validarCPF(cpf) {
    // Implementação básica de validação do CPF (pode ser melhorada)
    let exp = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    return exp.test(cpf);
}

// Função para validar o formato de e-mail
function validarEmail(email) {
    let exp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return exp.test(email);
}

// Função para listar funcionários com feedback visual
function listarFuncionarios() {
    let db = verificarDB();
    if (!db) {
        mostrarFeedback("Erro ao carregar banco de dados!", "error");
        return;
    }

    let transaction = db.transaction("funcionarios", "readonly"); // Só faz a leitura dos funcionários
    let store = transaction.objectStore("funcionarios");

    let listaFuncionarios = document.querySelector(".your_dates"); // Exibir lista de funcionários no HTML
    listaFuncionarios.innerHTML = ""; // Limpa antes de exibir
    
    let cursorRequest = store.openCursor(); // Percorre todos os registros dentro da store "funcionarios"
    cursorRequest.onsuccess = function (event) { // Lista executada com sucesso
        let cursor = event.target.result;
        if (cursor) { // Se o registro existir, o cursor busca os valores do funcionário
            let funcionario = cursor.value;
            listaFuncionarios.innerHTML += `
                <p>ID: ${funcionario.id} - Nome: ${funcionario.nome} - CPF: ${funcionario.cpf} 
                - Email: ${funcionario.email} - Telefone: ${funcionario.telefone} 
                - Cargo: ${funcionario.cargo} - Data de nascimento: ${funcionario.data_nascimento}</p>
            `;
            cursor.continue();
        } else {
            mostrarFeedback("Lista de funcionários carregada com sucesso!", "success");
        }
    };

    cursorRequest.onerror = function (event) {
        console.error("Erro ao listar funcionários:", event.target.error);
        mostrarFeedback("Erro ao listar funcionários!", "error");
    };
}

// Função para adicionar um funcionário com feedback visual
function adicionarFuncionario(funcionario) {
    let db = verificarDB();
    if (!db) return;

    let transaction = db.transaction("funcionarios", "readwrite");
    let store = transaction.objectStore("funcionarios");

    let addRequest = store.add(funcionario);
    addRequest.onsuccess = function () {
        console.log("Funcionário adicionado com sucesso!");
        mostrarFeedback("Funcionário cadastrado com sucesso!", "success");
        listarFuncionarios(); // Atualiza a lista de funcionários
        document.querySelector(".add_names").reset(); // Limpa o formulário após adicionar
    }

    addRequest.onerror = function (event) {
        console.error("Erro ao adicionar funcionário:", event.target.error);
        mostrarFeedback("Erro ao cadastrar funcionário!", "error");
    };
}

// Função para atualizar um funcionário com feedback visual
function atualizarFuncionario(id, novosDados) {
    let db = verificarDB();
    if (!db) return;

    let transaction = db.transaction("funcionarios", "readwrite");
    let store = transaction.objectStore("funcionarios");

    let getRequest = store.get(id);
    getRequest.onsuccess = function () {
        let funcionario = getRequest.result;
        if (funcionario) {
            Object.assign(funcionario, novosDados);
            let updateRequest = store.put(funcionario);
            updateRequest.onsuccess = function () {
                console.log("Funcionário atualizado com sucesso!");
                mostrarFeedback("Dados atualizados com sucesso!", "success");
                listarFuncionarios();
            };

            updateRequest.onerror = function (event) {
                console.error("Erro ao atualizar funcionário:", event.target.error);
                mostrarFeedback("Erro ao atualizar funcionário!", "error");
            };
        }
    };

    getRequest.onerror = function (event) {
        console.error("Erro ao obter funcionário para atualização:", event.target.error);
        mostrarFeedback("Erro ao carregar funcionário para atualização!", "error");
    };
}

// Função para deletar um funcionário com feedback visual
function deletarFuncionario(id) {
    let db = verificarDB();
    if (!db) return;

    let transaction = db.transaction("funcionarios", "readwrite");
    let store = transaction.objectStore("funcionarios");

    let deleteRequest = store.delete(id);
    deleteRequest.onsuccess = function () {
        console.log("Funcionário deletado com sucesso!");
        mostrarFeedback("Funcionário removido com sucesso!", "success");
        listarFuncionarios(); // Atualiza a lista após remoção
    };

    deleteRequest.onerror = function (event) {
        console.error("Erro ao deletar funcionário:", event.target.error);
        mostrarFeedback("Erro ao remover funcionário!", "error");
    };
}

// Mostrar feedback
function mostrarFeedback(mensagem, tipo) {
    let feedback = document.getElementById("feedback-msg");
    feedback.textContent = mensagem;
    feedback.className = `feedback ${tipo}`; // Aplica a classe de sucesso ou erro
    feedback.style.display = "block";

    setTimeout(() => {
        feedback.style.display = "none"; // Oculta após 3 segundos
    }, 3000);
}

// Chamada inicial para listar funcionários ao carregar a página
window.onload = listarFuncionarios;
