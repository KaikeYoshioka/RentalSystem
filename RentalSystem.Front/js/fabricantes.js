// Tela de Fabricantes: GET (com filtros), POST, PUT e DELETE em /api/Fabricantes

const formFiltros = document.querySelector("#form-filtros");
const formFabricante = document.querySelector("#form-fabricante");
const modalFabricante = bootstrap.Modal.getOrCreateInstance("#modal-fabricante");

let editando = null; // fabricante em edição (null = cadastro)

async function carregarFabricantes() {
  let corpo = document.querySelector("#corpo-tabela");
  let resumo = document.querySelector("#resumo-lista");
  corpo.innerHTML = linhaCarregando(4);

  try {
    let filtros = lerFiltros(formFiltros);
    // duas rotas: fabricantes filtrados + veículos (para contar quantos cada um tem)
    let [fabricantes, veiculos] = await Promise.all([
      buscarJSON("/Fabricantes", filtros),
      buscarJSON("/Veiculos")
    ]);

    let filtrado = Object.keys(filtros).length > 0;
    resumo.textContent = fabricantes.length === 0
      ? "Nenhum fabricante encontrado."
      : fabricantes.length + (fabricantes.length === 1 ? " fabricante" : " fabricantes") + (filtrado ? " encontrados com os filtros aplicados." : " cadastrados.");

    if (fabricantes.length === 0) {
      corpo.innerHTML = linhaEstado(4, {
        icone: "bi-search",
        titulo: filtrado ? "Nada encontrado" : "Nenhum fabricante cadastrado",
        texto: filtrado ? "Tente alterar ou limpar os filtros." : "Cadastre o primeiro fabricante."
      });
      return;
    }

    corpo.innerHTML = fabricantes.map((f) => {
      let qtd = veiculos.filter((v) => v.fabricanteId === f.id).length;
      return `
        <tr>
          <td class="id-registro">${f.id}</td>
          <td><strong>${escapeHTML(f.nome)}</strong></td>
          <td>${qtd === 0 ? '<span class="texto-mudo">Nenhum</span>' : qtd + (qtd === 1 ? " veículo" : " veículos")}</td>
          <td class="tabela-acoes">
            <button type="button" class="btn btn-sm btn-outline-primary" data-editar="${f.id}"><i class="bi bi-pencil" aria-hidden="true"></i> Editar</button>
            <button type="button" class="btn btn-sm btn-outline-danger" data-excluir="${f.id}" data-nome="${escapeHTML(f.nome)}"><i class="bi bi-trash3" aria-hidden="true"></i> Excluir</button>
          </td>
        </tr>`;
    }).join("");
  } catch (erro) {
    console.error("Erro ao listar fabricantes:", erro);
    resumo.textContent = "Não foi possível carregar os fabricantes.";
    corpo.innerHTML = linhaEstado(4, { tipo: "erro", icone: "bi-wifi-off", titulo: "Não foi possível carregar", texto: mensagemDeErro(erro) });
  }
}

function abrirCadastro() {
  editando = null;
  formFabricante.reset();
  limparValidacao(formFabricante);
  document.querySelector("#titulo-modal-fabricante").textContent = "Novo fabricante";
  modalFabricante.show();
}

async function abrirEdicao(id) {
  try {
    editando = await buscarJSON("/Fabricantes/" + id);
    formFabricante.reset();
    limparValidacao(formFabricante);
    formFabricante.elements.nome.value = editando.nome;
    document.querySelector("#titulo-modal-fabricante").textContent = "Editar fabricante #" + id;
    modalFabricante.show();
  } catch (erro) {
    mostrarToast(mensagemDeErro(erro), "erro");
  }
}

async function salvarFabricante(evento) {
  evento.preventDefault();
  limparValidacao(formFabricante);

  let nome = formFabricante.elements.nome;
  nome.value = nome.value.trim();
  if (!validarCampos(formFabricante)) return;

  let dados = { nome: nome.value };
  let botao = formFabricante.querySelector(".botao-salvar");
  alternarCarregando(botao, true);

  try {
    if (editando) {
      await enviarJSON("PUT", "/Fabricantes/" + editando.id, { ...dados, id: editando.id });
      mostrarToast("Fabricante atualizado.");
    } else {
      await enviarJSON("POST", "/Fabricantes", dados);
      mostrarToast("Fabricante cadastrado.");
    }
    modalFabricante.hide();
    carregarFabricantes();
  } catch (erro) {
    mostrarErroNoFormulario(formFabricante, erro);
  } finally {
    alternarCarregando(botao, false);
  }
}

document.querySelector("#botao-novo").addEventListener("click", abrirCadastro);
formFabricante.addEventListener("submit", salvarFabricante);

formFiltros.addEventListener("submit", (e) => { e.preventDefault(); carregarFabricantes(); });
formFiltros.addEventListener("reset", () => setTimeout(carregarFabricantes));

document.querySelector("#corpo-tabela").addEventListener("click", (e) => {
  let editar = e.target.closest("[data-editar]");
  let excluir = e.target.closest("[data-excluir]");
  if (editar) abrirEdicao(editar.dataset.editar);
  if (excluir) {
    confirmarExclusao("o fabricante " + excluir.dataset.nome, async () => {
      await enviarJSON("DELETE", "/Fabricantes/" + excluir.dataset.excluir);
      mostrarToast("Fabricante excluído.");
      carregarFabricantes();
    });
  }
});

carregarFabricantes();
