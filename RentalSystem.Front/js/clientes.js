// Tela de Clientes: GET (com filtros), POST, PUT e DELETE em /api/Clientes

const formFiltros = document.querySelector("#form-filtros");
const formCliente = document.querySelector("#form-cliente");
const modalCliente = bootstrap.Modal.getOrCreateInstance("#modal-cliente");

let editando = null;

// Máscara 000.000.000-00 enquanto o usuário digita
function mascaraCpf(valor) {
  let d = valor.replace(/\D/g, "").substring(0, 11);
  if (d.length > 9) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
  if (d.length > 6) return d.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
  if (d.length > 3) return d.replace(/(\d{3})(\d{1,3})/, "$1.$2");
  return d;
}

// Confere os dígitos verificadores do CPF
function cpfValido(cpf) {
  let d = cpf.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(d[i]) * (t + 1 - i);
    let digito = ((soma * 10) % 11) % 10;
    if (digito !== Number(d[t])) return false;
  }
  return true;
}

async function carregarClientes() {
  let corpo = document.querySelector("#corpo-tabela");
  let resumo = document.querySelector("#resumo-lista");
  corpo.innerHTML = linhaCarregando(6);

  try {
    let filtros = lerFiltros(formFiltros);
    let [clientes, alugueis] = await Promise.all([
      buscarJSON("/Clientes", filtros),
      buscarJSON("/Alugueis")
    ]);

    let filtrado = Object.keys(filtros).length > 0;
    resumo.textContent = clientes.length === 0
      ? "Nenhum cliente encontrado."
      : clientes.length + (clientes.length === 1 ? " cliente" : " clientes") + (filtrado ? (clientes.length === 1 ? " encontrado" : " encontrados") + " com os filtros aplicados." : (clientes.length === 1 ? " cadastrado." : " cadastrados."));

    if (clientes.length === 0) {
      corpo.innerHTML = linhaEstado(6, {
        icone: "bi-search",
        titulo: filtrado ? "Nada encontrado" : "Nenhum cliente cadastrado",
        texto: filtrado ? "Tente alterar ou limpar os filtros." : "Cadastre o primeiro cliente."
      });
      return;
    }

    corpo.innerHTML = clientes.map((c) => {
      let doCliente = alugueis.filter((a) => a.clienteId === c.id);
      let abertos = doCliente.filter((a) => !a.dataDevolucao).length;
      return `
        <tr>
          <td class="id-registro">${c.id}</td>
          <td><strong>${escapeHTML(c.nome)}</strong></td>
          <td>${escapeHTML(c.cpf)}</td>
          <td><a href="mailto:${escapeHTML(c.email)}">${escapeHTML(c.email)}</a></td>
          <td>${doCliente.length}${abertos ? ` <span class="texto-mudo">(${abertos} em aberto)</span>` : ""}</td>
          <td class="tabela-acoes">
            <button type="button" class="btn btn-sm btn-outline-primary" data-editar="${c.id}"><i class="bi bi-pencil" aria-hidden="true"></i> Editar</button>
            <button type="button" class="btn btn-sm btn-outline-danger" data-excluir="${c.id}" data-nome="${escapeHTML(c.nome)}"><i class="bi bi-trash3" aria-hidden="true"></i> Excluir</button>
          </td>
        </tr>`;
    }).join("");
  } catch (erro) {
    console.error("Erro ao listar clientes:", erro);
    resumo.textContent = "Não foi possível carregar os clientes.";
    corpo.innerHTML = linhaEstado(6, { tipo: "erro", icone: "bi-wifi-off", titulo: "Não foi possível carregar", texto: mensagemDeErro(erro) });
  }
}

function abrirCadastro() {
  editando = null;
  formCliente.reset();
  limparValidacao(formCliente);
  document.querySelector("#titulo-modal-cliente").textContent = "Novo cliente";
  modalCliente.show();
}

async function abrirEdicao(id) {
  try {
    editando = await buscarJSON("/Clientes/" + id);
    formCliente.reset();
    limparValidacao(formCliente);
    formCliente.elements.nome.value = editando.nome;
    formCliente.elements.cpf.value = editando.cpf;
    formCliente.elements.email.value = editando.email;
    document.querySelector("#titulo-modal-cliente").textContent = "Editar cliente #" + id;
    modalCliente.show();
  } catch (erro) {
    mostrarToast(mensagemDeErro(erro), "erro");
  }
}

async function salvarCliente(evento) {
  evento.preventDefault();
  limparValidacao(formCliente);

  let campos = formCliente.elements;
  campos.nome.value = campos.nome.value.trim();
  campos.email.value = campos.email.value.trim();
  let ok = validarCampos(formCliente);
  if (ok && !cpfValido(campos.cpf.value)) {
    marcarInvalido(campos.cpf, "CPF inválido: confira os dígitos.");
    ok = false;
  }
  if (!ok) return;

  let dados = { nome: campos.nome.value, cpf: campos.cpf.value, email: campos.email.value };
  let botao = formCliente.querySelector(".botao-salvar");
  alternarCarregando(botao, true);

  try {
    if (editando) {
      await enviarJSON("PUT", "/Clientes/" + editando.id, { ...dados, id: editando.id });
      mostrarToast("Cliente atualizado.");
    } else {
      await enviarJSON("POST", "/Clientes", dados);
      mostrarToast("Cliente cadastrado.");
    }
    modalCliente.hide();
    carregarClientes();
  } catch (erro) {
    if (erro.status === 409) marcarInvalido(campos.cpf, erro.message); // CPF já cadastrado
    mostrarErroNoFormulario(formCliente, erro);
  } finally {
    alternarCarregando(botao, false);
  }
}

for (let campo of [formCliente.elements.cpf, formFiltros.elements.cpf]) {
  campo.addEventListener("input", () => { campo.value = mascaraCpf(campo.value); });
}

document.querySelector("#botao-novo").addEventListener("click", abrirCadastro);
formCliente.addEventListener("submit", salvarCliente);

formFiltros.addEventListener("submit", (e) => { e.preventDefault(); carregarClientes(); });
formFiltros.addEventListener("reset", () => setTimeout(carregarClientes));

document.querySelector("#corpo-tabela").addEventListener("click", (e) => {
  let editar = e.target.closest("[data-editar]");
  let excluir = e.target.closest("[data-excluir]");
  if (editar) abrirEdicao(editar.dataset.editar);
  if (excluir) {
    confirmarExclusao("o cliente " + excluir.dataset.nome, async () => {
      await enviarJSON("DELETE", "/Clientes/" + excluir.dataset.excluir);
      mostrarToast("Cliente excluído.");
      carregarClientes();
    });
  }
});

if (new URLSearchParams(location.search).has("novo")) abrirCadastro();
carregarClientes();
