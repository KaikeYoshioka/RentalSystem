// Tela de Veículos: GET (com filtros), POST, PUT e DELETE em /api/Veiculos

const formFiltros = document.querySelector("#form-filtros");
const formVeiculo = document.querySelector("#form-veiculo");
const modalVeiculo = bootstrap.Modal.getOrCreateInstance("#modal-veiculo");
const ANO_MAXIMO = new Date().getFullYear() + 1;

let editando = null;
let fabricantes = [];

async function carregarFabricantes() {
  fabricantes = await buscarJSON("/Fabricantes");
  preencherSelect(formFiltros.elements.fabricanteId, fabricantes, (f) => f.nome, "Todos");
  preencherSelect(formVeiculo.elements.fabricanteId, fabricantes, (f) => f.nome, "Selecione");
}

function nomeFabricante(id) {
  let f = fabricantes.find((x) => x.id === id);
  return f ? f.nome : "—";
}

async function carregarVeiculos() {
  let corpo = document.querySelector("#corpo-tabela");
  let resumo = document.querySelector("#resumo-lista");
  corpo.innerHTML = linhaCarregando(7);

  try {
    let filtros = lerFiltros(formFiltros);
    // veículos filtrados + aluguéis em aberto (para mostrar se o carro está disponível)
    let [veiculos, abertos] = await Promise.all([
      buscarJSON("/Veiculos", filtros),
      buscarJSON("/Alugueis", { status: "aberto" })
    ]);

    let filtrado = Object.keys(filtros).length > 0;
    resumo.textContent = veiculos.length === 0
      ? "Nenhum veículo encontrado."
      : veiculos.length + (veiculos.length === 1 ? " veículo" : " veículos") + (filtrado ? " encontrados com os filtros aplicados." : " na frota.");

    if (veiculos.length === 0) {
      corpo.innerHTML = linhaEstado(7, {
        icone: "bi-search",
        titulo: filtrado ? "Nada encontrado" : "Nenhum veículo cadastrado",
        texto: filtrado ? "Tente alterar ou limpar os filtros." : "Cadastre o primeiro veículo."
      });
      return;
    }

    corpo.innerHTML = veiculos.map((v) => {
      let alugado = abertos.some((a) => a.veiculoId === v.id);
      return `
        <tr>
          <td class="id-registro">${v.id}</td>
          <td><strong>${escapeHTML(v.modelo)}</strong></td>
          <td>${escapeHTML(nomeFabricante(v.fabricanteId))}</td>
          <td>${v.anoFabricacao}</td>
          <td class="text-end">${formatarKm(v.quilometragem)}</td>
          <td>${alugado
            ? '<span class="status status-aberto"><i class="bi bi-key" aria-hidden="true"></i>Alugado</span>'
            : '<span class="status status-devolvido"><i class="bi bi-check2" aria-hidden="true"></i>Disponível</span>'}</td>
          <td class="tabela-acoes">
            <button type="button" class="btn btn-sm btn-outline-primary" data-editar="${v.id}"><i class="bi bi-pencil" aria-hidden="true"></i> Editar</button>
            <button type="button" class="btn btn-sm btn-outline-danger" data-excluir="${v.id}" data-nome="${escapeHTML(v.modelo)}"><i class="bi bi-trash3" aria-hidden="true"></i> Excluir</button>
          </td>
        </tr>`;
    }).join("");
  } catch (erro) {
    console.error("Erro ao listar veículos:", erro);
    resumo.textContent = "Não foi possível carregar os veículos.";
    corpo.innerHTML = linhaEstado(7, { tipo: "erro", icone: "bi-wifi-off", titulo: "Não foi possível carregar", texto: mensagemDeErro(erro) });
  }
}

function abrirCadastro() {
  editando = null;
  formVeiculo.reset();
  limparValidacao(formVeiculo);
  document.querySelector("#titulo-modal-veiculo").textContent = "Novo veículo";
  modalVeiculo.show();
}

async function abrirEdicao(id) {
  try {
    editando = await buscarJSON("/Veiculos/" + id);
    formVeiculo.reset();
    limparValidacao(formVeiculo);
    let campos = formVeiculo.elements;
    campos.modelo.value = editando.modelo;
    campos.fabricanteId.value = editando.fabricanteId;
    campos.anoFabricacao.value = editando.anoFabricacao;
    campos.quilometragem.value = editando.quilometragem;
    document.querySelector("#titulo-modal-veiculo").textContent = "Editar veículo #" + id;
    modalVeiculo.show();
  } catch (erro) {
    mostrarToast(mensagemDeErro(erro), "erro");
  }
}

async function salvarVeiculo(evento) {
  evento.preventDefault();
  limparValidacao(formVeiculo);

  let campos = formVeiculo.elements;
  campos.modelo.value = campos.modelo.value.trim();
  campos.anoFabricacao.max = ANO_MAXIMO;
  if (!validarCampos(formVeiculo)) return;

  let dados = {
    modelo: campos.modelo.value,
    fabricanteId: Number(campos.fabricanteId.value),
    anoFabricacao: Number(campos.anoFabricacao.value),
    quilometragem: Number(campos.quilometragem.value)
  };
  let botao = formVeiculo.querySelector(".botao-salvar");
  alternarCarregando(botao, true);

  try {
    if (editando) {
      await enviarJSON("PUT", "/Veiculos/" + editando.id, { ...dados, id: editando.id });
      mostrarToast("Veículo atualizado.");
    } else {
      await enviarJSON("POST", "/Veiculos", dados);
      mostrarToast("Veículo cadastrado.");
    }
    modalVeiculo.hide();
    carregarVeiculos();
  } catch (erro) {
    mostrarErroNoFormulario(formVeiculo, erro);
  } finally {
    alternarCarregando(botao, false);
  }
}

document.querySelector("#botao-novo").addEventListener("click", abrirCadastro);
formVeiculo.addEventListener("submit", salvarVeiculo);

formFiltros.addEventListener("submit", (e) => { e.preventDefault(); carregarVeiculos(); });
formFiltros.addEventListener("reset", () => setTimeout(carregarVeiculos));

document.querySelector("#corpo-tabela").addEventListener("click", (e) => {
  let editar = e.target.closest("[data-editar]");
  let excluir = e.target.closest("[data-excluir]");
  if (editar) abrirEdicao(editar.dataset.editar);
  if (excluir) {
    confirmarExclusao("o veículo " + excluir.dataset.nome, async () => {
      await enviarJSON("DELETE", "/Veiculos/" + excluir.dataset.excluir);
      mostrarToast("Veículo excluído.");
      carregarVeiculos();
    });
  }
});

// Primeiro carrega os fabricantes (para os selects e nomes), depois a lista
carregarFabricantes()
  .catch((erro) => mostrarToast(mensagemDeErro(erro), "erro"))
  .finally(carregarVeiculos);
