// Tela de Aluguéis: GET (com filtros), POST, PUT, DELETE em /api/Alugueis
// e registro de devolução (PUT no aluguel + PUT na quilometragem do veículo).

const formFiltros = document.querySelector("#form-filtros");
const formAluguel = document.querySelector("#form-aluguel");
const formDevolucao = document.querySelector("#form-devolucao");
const modalAluguel = bootstrap.Modal.getOrCreateInstance("#modal-aluguel");
const modalDevolucao = bootstrap.Modal.getOrCreateInstance("#modal-devolucao");

let clientes = [];
let veiculos = [];
let editando = null;     // aluguel em edição (null = cadastro)
let devolvendo = null;   // aluguel cuja devolução está sendo registrada

const nomeCliente = (id) => (clientes.find((c) => c.id === id) || {}).nome || "—";
const nomeVeiculo = (id) => (veiculos.find((v) => v.id === id) || {}).modelo || "—";

async function carregarListas() {
  [clientes, veiculos] = await Promise.all([buscarJSON("/Clientes"), buscarJSON("/Veiculos")]);
  preencherSelect(formFiltros.elements.clienteId, clientes, (c) => c.nome, "Todos");
  preencherSelect(formFiltros.elements.veiculoId, veiculos, (v) => v.modelo, "Todos");
  preencherSelect(formAluguel.elements.clienteId, clientes, (c) => c.nome + " · " + c.cpf, "Selecione");
  preencherSelect(formAluguel.elements.veiculoId, veiculos, (v) => v.modelo + " (" + v.anoFabricacao + ")", "Selecione");
}

async function carregarAlugueis() {
  let corpo = document.querySelector("#corpo-tabela");
  let resumo = document.querySelector("#resumo-lista");
  corpo.innerHTML = linhaCarregando(9);

  try {
    let filtros = lerFiltros(formFiltros);
    let alugueis = await buscarJSON("/Alugueis", filtros);

    let filtrado = Object.keys(filtros).length > 0;
    let abertos = alugueis.filter((a) => !a.dataDevolucao).length;
    resumo.textContent = alugueis.length === 0
      ? "Nenhum aluguel encontrado."
      : alugueis.length + (alugueis.length === 1 ? " aluguel" : " aluguéis") + (filtrado ? (alugueis.length === 1 ? " encontrado" : " encontrados") : (alugueis.length === 1 ? " registrado" : " registrados")) + ", " + abertos + " em aberto.";

    if (alugueis.length === 0) {
      corpo.innerHTML = linhaEstado(9, {
        icone: "bi-search",
        titulo: filtrado ? "Nada encontrado" : "Nenhum aluguel registrado",
        texto: filtrado ? "Tente alterar ou limpar os filtros." : "Registre o primeiro aluguel."
      });
      return;
    }

    corpo.innerHTML = alugueis.map((a) => `
      <tr>
        <td class="id-registro">${a.id}</td>
        <td>${escapeHTML(nomeCliente(a.clienteId))}</td>
        <td>${escapeHTML(nomeVeiculo(a.veiculoId))}</td>
        <td>${formatarData(a.dataInicio)}</td>
        <td>${formatarData(a.dataFimPrevista)}</td>
        <td class="text-end">${formatarPreco(a.valorDiaria)}</td>
        <td class="text-end">${formatarPreco(a.valorTotal)}</td>
        <td>${badgeStatus(a)}</td>
        <td class="tabela-acoes">
          ${a.dataDevolucao ? "" : `<button type="button" class="btn btn-sm btn-primary" data-devolver="${a.id}"><i class="bi bi-box-arrow-in-down" aria-hidden="true"></i> Devolução</button>`}
          <button type="button" class="btn btn-sm btn-outline-primary" data-editar="${a.id}"><i class="bi bi-pencil" aria-hidden="true"></i> Editar</button>
          <button type="button" class="btn btn-sm btn-outline-danger" data-excluir="${a.id}"><i class="bi bi-trash3" aria-hidden="true"></i> Excluir</button>
        </td>
      </tr>`).join("");
  } catch (erro) {
    console.error("Erro ao listar aluguéis:", erro);
    resumo.textContent = "Não foi possível carregar os aluguéis.";
    corpo.innerHTML = linhaEstado(9, { tipo: "erro", icone: "bi-wifi-off", titulo: "Não foi possível carregar", texto: mensagemDeErro(erro) });
  }
}

// ---------- Cadastro e edição ----------
function mostrarEncerramento(mostrar) {
  document.querySelector("#grupo-encerramento").classList.toggle("d-none", !mostrar);
  formAluguel.querySelectorAll(".campo-encerramento").forEach((el) => el.classList.toggle("d-none", !mostrar));
}

function atualizarEstimativa() {
  let c = formAluguel.elements;
  let caixa = document.querySelector("#estimativa");
  let diaria = Number(c.valorDiaria.value);
  if (!c.dataInicio.value || !c.dataFimPrevista.value || !(diaria > 0) || c.dataFimPrevista.value < c.dataInicio.value) {
    caixa.textContent = "Preencha as datas e a diária para ver o valor estimado.";
    return;
  }
  let dias = calcularDiarias(c.dataInicio.value, c.dataFimPrevista.value);
  caixa.innerHTML = `Valor estimado: ${dias} diária(s) × ${formatarPreco(diaria)} = <strong>${formatarPreco(dias * diaria)}</strong>`;
}

function abrirCadastro() {
  editando = null;
  formAluguel.reset();
  limparValidacao(formAluguel);
  mostrarEncerramento(false);
  formAluguel.elements.dataInicio.value = hoje();
  document.querySelector("#titulo-modal-aluguel").textContent = "Novo aluguel";
  atualizarEstimativa();
  modalAluguel.show();
}

async function abrirEdicao(id) {
  try {
    editando = await buscarJSON("/Alugueis/" + id);
    formAluguel.reset();
    limparValidacao(formAluguel);
    let c = formAluguel.elements;
    c.clienteId.value = editando.clienteId;
    c.veiculoId.value = editando.veiculoId;
    c.dataInicio.value = paraDataInput(editando.dataInicio);
    c.dataFimPrevista.value = paraDataInput(editando.dataFimPrevista);
    c.quilometragemInicial.value = editando.quilometragemInicial;
    c.valorDiaria.value = editando.valorDiaria;
    c.dataDevolucao.value = paraDataInput(editando.dataDevolucao);
    c.quilometragemFinal.value = editando.quilometragemFinal ?? "";
    c.valorTotal.value = editando.valorTotal ?? "";
    mostrarEncerramento(true);
    document.querySelector("#titulo-modal-aluguel").textContent = "Editar aluguel #" + id;
    atualizarEstimativa();
    modalAluguel.show();
  } catch (erro) {
    mostrarToast(mensagemDeErro(erro), "erro");
  }
}

async function salvarAluguel(evento) {
  evento.preventDefault();
  limparValidacao(formAluguel);
  let c = formAluguel.elements;
  let ok = validarCampos(formAluguel);

  if (c.dataInicio.value && c.dataFimPrevista.value && c.dataFimPrevista.value < c.dataInicio.value) {
    marcarInvalido(c.dataFimPrevista, "A devolução prevista não pode ser antes do início.");
    ok = false;
  }
  if (c.dataDevolucao.value && c.dataDevolucao.value < c.dataInicio.value) {
    marcarInvalido(c.dataDevolucao, "A devolução não pode ser antes do início.");
    ok = false;
  }
  if (c.dataDevolucao.value && c.quilometragemFinal.value === "") {
    marcarInvalido(c.quilometragemFinal, "Informe a km final da devolução.");
    ok = false;
  }
  if (c.quilometragemFinal.value !== "" && Number(c.quilometragemFinal.value) < Number(c.quilometragemInicial.value)) {
    marcarInvalido(c.quilometragemFinal, "A km final não pode ser menor que a inicial.");
    ok = false;
  }
  if (!ok) return;

  let botao = formAluguel.querySelector(".botao-salvar");
  alternarCarregando(botao, true);

  try {
    // Um veículo não pode ter dois aluguéis em aberto ao mesmo tempo
    if (!c.dataDevolucao.value) {
      let abertos = await buscarJSON("/Alugueis", { veiculoId: c.veiculoId.value, status: "aberto" });
      if (abertos.some((a) => !editando || a.id !== editando.id)) {
        marcarInvalido(c.veiculoId, "Este veículo já está alugado (aluguel em aberto).");
        return;
      }
    }

    let dados = {
      clienteId: Number(c.clienteId.value),
      veiculoId: Number(c.veiculoId.value),
      dataInicio: c.dataInicio.value,
      dataFimPrevista: c.dataFimPrevista.value,
      quilometragemInicial: Number(c.quilometragemInicial.value),
      valorDiaria: Number(c.valorDiaria.value),
      dataDevolucao: c.dataDevolucao.value || null,
      quilometragemFinal: c.quilometragemFinal.value === "" ? null : Number(c.quilometragemFinal.value),
      valorTotal: c.valorTotal.value === "" ? null : Number(c.valorTotal.value)
    };
    // Devolução informada sem valor total: calcula pelas diárias
    if (dados.dataDevolucao && dados.valorTotal === null) {
      dados.valorTotal = calcularDiarias(dados.dataInicio, dados.dataDevolucao) * dados.valorDiaria;
    }

    if (editando) {
      await enviarJSON("PUT", "/Alugueis/" + editando.id, { ...dados, id: editando.id });
      mostrarToast("Aluguel atualizado.");
    } else {
      await enviarJSON("POST", "/Alugueis", dados);
      mostrarToast("Aluguel registrado.");
    }
    modalAluguel.hide();
    carregarAlugueis();
  } catch (erro) {
    mostrarErroNoFormulario(formAluguel, erro);
  } finally {
    alternarCarregando(botao, false);
  }
}

// Ao escolher o veículo, a km inicial vem da quilometragem atual dele
formAluguel.elements.veiculoId.addEventListener("change", () => {
  let v = veiculos.find((x) => String(x.id) === formAluguel.elements.veiculoId.value);
  if (v && !editando) formAluguel.elements.quilometragemInicial.value = v.quilometragem;
});
for (let nome of ["dataInicio", "dataFimPrevista", "valorDiaria"]) {
  formAluguel.elements[nome].addEventListener("input", atualizarEstimativa);
}

// ---------- Devolução ----------
function atualizarCalculoDevolucao() {
  let c = formDevolucao.elements;
  let caixa = document.querySelector("#calculo-devolucao");
  if (!devolvendo || !c.dataDevolucao.value || c.dataDevolucao.value < paraDataInput(devolvendo.dataInicio)) {
    caixa.textContent = "Informe uma data de devolução igual ou posterior ao início.";
    return;
  }
  let dias = calcularDiarias(devolvendo.dataInicio, c.dataDevolucao.value);
  let km = c.quilometragemFinal.value !== "" ? Number(c.quilometragemFinal.value) - devolvendo.quilometragemInicial : null;
  caixa.innerHTML = `Valor total: ${dias} diária(s) × ${formatarPreco(devolvendo.valorDiaria)} = <strong>${formatarPreco(dias * devolvendo.valorDiaria)}</strong>` +
    (km !== null && km >= 0 ? `<br>Distância percorrida: ${formatarKm(km)}` : "");
}

async function abrirDevolucao(id) {
  try {
    devolvendo = await buscarJSON("/Alugueis/" + id);
    if (devolvendo.dataDevolucao) {
      mostrarToast("Este aluguel já foi devolvido.", "erro");
      return;
    }
    formDevolucao.reset();
    limparValidacao(formDevolucao);
    let c = formDevolucao.elements;
    c.dataDevolucao.value = hoje();
    c.dataDevolucao.min = paraDataInput(devolvendo.dataInicio);
    c.quilometragemFinal.min = devolvendo.quilometragemInicial;
    document.querySelector("#titulo-modal-devolucao").textContent = "Registrar devolução · Aluguel #" + id;
    document.querySelector("#resumo-devolucao").innerHTML =
      `<strong>${escapeHTML(nomeCliente(devolvendo.clienteId))}</strong> · ${escapeHTML(nomeVeiculo(devolvendo.veiculoId))}<br>` +
      `<span class="texto-mudo">Início em ${formatarData(devolvendo.dataInicio)}, previsto até ${formatarData(devolvendo.dataFimPrevista)} · km inicial ${formatarKm(devolvendo.quilometragemInicial)}</span>`;
    atualizarCalculoDevolucao();
    modalDevolucao.show();
  } catch (erro) {
    mostrarToast(mensagemDeErro(erro), "erro");
  }
}

async function confirmarDevolucao(evento) {
  evento.preventDefault();
  limparValidacao(formDevolucao);
  let c = formDevolucao.elements;
  if (!validarCampos(formDevolucao)) return;

  let kmFinal = Number(c.quilometragemFinal.value);
  let dias = calcularDiarias(devolvendo.dataInicio, c.dataDevolucao.value);
  let botao = formDevolucao.querySelector(".botao-salvar");
  alternarCarregando(botao, true);

  try {
    await enviarJSON("PUT", "/Alugueis/" + devolvendo.id, {
      ...devolvendo,
      dataDevolucao: c.dataDevolucao.value,
      quilometragemFinal: kmFinal,
      valorTotal: dias * devolvendo.valorDiaria
    });

    // Atualiza a quilometragem do veículo com a km da devolução
    let veiculo = await buscarJSON("/Veiculos/" + devolvendo.veiculoId);
    if (kmFinal > veiculo.quilometragem) {
      await enviarJSON("PUT", "/Veiculos/" + veiculo.id, { ...veiculo, quilometragem: kmFinal });
    }

    mostrarToast("Devolução registrada: " + formatarPreco(dias * devolvendo.valorDiaria) + ".");
    modalDevolucao.hide();
    await carregarListas();
    carregarAlugueis();
  } catch (erro) {
    mostrarErroNoFormulario(formDevolucao, erro);
  } finally {
    alternarCarregando(botao, false);
  }
}

formDevolucao.elements.dataDevolucao.addEventListener("input", atualizarCalculoDevolucao);
formDevolucao.elements.quilometragemFinal.addEventListener("input", atualizarCalculoDevolucao);

// ---------- Eventos ----------
document.querySelector("#botao-novo").addEventListener("click", abrirCadastro);
formAluguel.addEventListener("submit", salvarAluguel);
formDevolucao.addEventListener("submit", confirmarDevolucao);

formFiltros.addEventListener("submit", (e) => {
  e.preventDefault();
  let de = formFiltros.elements.dataInicioDe.value;
  let ate = formFiltros.elements.dataInicioAte.value;
  if (de && ate && ate < de) {
    mostrarToast("No filtro, a data final não pode ser antes da inicial.", "erro");
    return;
  }
  carregarAlugueis();
});
formFiltros.addEventListener("reset", () => setTimeout(carregarAlugueis));

document.querySelector("#corpo-tabela").addEventListener("click", (e) => {
  let devolver = e.target.closest("[data-devolver]");
  let editar = e.target.closest("[data-editar]");
  let excluir = e.target.closest("[data-excluir]");
  if (devolver) abrirDevolucao(devolver.dataset.devolver);
  if (editar) abrirEdicao(editar.dataset.editar);
  if (excluir) {
    confirmarExclusao("o aluguel #" + excluir.dataset.excluir, async () => {
      await enviarJSON("DELETE", "/Alugueis/" + excluir.dataset.excluir);
      mostrarToast("Aluguel excluído.");
      carregarAlugueis();
    });
  }
});

// Links vindos da tela inicial: alugueis.html?novo ou alugueis.html?devolucao=ID
carregarListas()
  .catch((erro) => mostrarToast(mensagemDeErro(erro), "erro"))
  .finally(() => {
    carregarAlugueis();
    let params = new URLSearchParams(location.search);
    if (params.has("novo")) abrirCadastro();
    if (params.get("devolucao")) abrirDevolucao(params.get("devolucao"));
  });
