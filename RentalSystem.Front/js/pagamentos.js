// Tela de Pagamentos: GET (com filtros), POST, PUT e DELETE em /api/Pagamentos

const formFiltros = document.querySelector("#form-filtros");
const formPagamento = document.querySelector("#form-pagamento");
const modalPagamento = bootstrap.Modal.getOrCreateInstance("#modal-pagamento");
const METODOS = ["Pix", "Cartão de crédito", "Cartão de débito", "Dinheiro", "Boleto"];

let alugueis = [];
let clientes = [];
let veiculos = [];
let todosPagamentos = [];
let editando = null;

const nomeCliente = (id) => (clientes.find((c) => c.id === id) || {}).nome || "—";
const nomeVeiculo = (id) => (veiculos.find((v) => v.id === id) || {}).modelo || "—";
const aluguelPorId = (id) => alugueis.find((a) => a.id === Number(id));

function rotuloAluguel(a) {
  return "#" + a.id + " · " + nomeCliente(a.clienteId) + " · " + nomeVeiculo(a.veiculoId);
}

async function carregarListas() {
  [alugueis, clientes, veiculos] = await Promise.all([
    buscarJSON("/Alugueis"), buscarJSON("/Clientes"), buscarJSON("/Veiculos")
  ]);
  preencherSelect(formFiltros.elements.aluguelId, alugueis, rotuloAluguel, "Todos");
  preencherSelect(formPagamento.elements.aluguelId, alugueis, rotuloAluguel, "Selecione");
  formPagamento.elements.metodoPagamento.innerHTML = `<option value="">Selecione</option>` +
    METODOS.map((m) => `<option>${m}</option>`).join("");
}

async function carregarPagamentos() {
  let corpo = document.querySelector("#corpo-tabela");
  let resumo = document.querySelector("#resumo-lista");
  corpo.innerHTML = linhaCarregando(7);

  try {
    let filtros = lerFiltros(formFiltros);
    let de = filtros.dataDe, ate = filtros.dataAte;
    if (de && ate && ate < de) throw new Error("No filtro, a data final não pode ser antes da inicial.");

    let pagamentos = await buscarJSON("/Pagamentos", filtros);
    let total = pagamentos.reduce((soma, p) => soma + Number(p.valorPago), 0);
    let filtrado = Object.keys(filtros).length > 0;
    resumo.textContent = pagamentos.length === 0
      ? "Nenhum pagamento encontrado."
      : pagamentos.length + (pagamentos.length === 1 ? " pagamento" : " pagamentos") + (filtrado ? (pagamentos.length === 1 ? " encontrado" : " encontrados") : (pagamentos.length === 1 ? " registrado" : " registrados")) + ", somando " + formatarPreco(total) + ".";

    if (pagamentos.length === 0) {
      corpo.innerHTML = linhaEstado(7, {
        icone: "bi-search",
        titulo: filtrado ? "Nada encontrado" : "Nenhum pagamento registrado",
        texto: filtrado ? "Tente alterar ou limpar os filtros." : "Registre o primeiro pagamento."
      });
      return;
    }

    corpo.innerHTML = pagamentos.map((p) => {
      let a = aluguelPorId(p.aluguelId);
      return `
        <tr>
          <td class="id-registro">${p.id}</td>
          <td>#${p.aluguelId}${a ? ` <span class="texto-mudo">${escapeHTML(nomeVeiculo(a.veiculoId))}</span>` : ""}</td>
          <td>${a ? escapeHTML(nomeCliente(a.clienteId)) : "—"}</td>
          <td>${escapeHTML(p.metodoPagamento)}</td>
          <td class="text-end"><strong>${formatarPreco(p.valorPago)}</strong></td>
          <td>${formatarData(p.dataPagamento)}</td>
          <td class="tabela-acoes">
            <button type="button" class="btn btn-sm btn-outline-primary" data-editar="${p.id}"><i class="bi bi-pencil" aria-hidden="true"></i> Editar</button>
            <button type="button" class="btn btn-sm btn-outline-danger" data-excluir="${p.id}"><i class="bi bi-trash3" aria-hidden="true"></i> Excluir</button>
          </td>
        </tr>`;
    }).join("");
  } catch (erro) {
    console.error("Erro ao listar pagamentos:", erro);
    resumo.textContent = "Não foi possível carregar os pagamentos.";
    corpo.innerHTML = linhaEstado(7, { tipo: "erro", icone: "bi-wifi-off", titulo: "Não foi possível carregar", texto: mensagemDeErro(erro) });
  }
}

// Valor do aluguel (total, ou estimado se ainda estiver em aberto) menos o que já foi pago
function calcularSaldo(aluguel) {
  let valor = aluguel.valorTotal ?? calcularDiarias(aluguel.dataInicio, aluguel.dataFimPrevista) * aluguel.valorDiaria;
  let pago = todosPagamentos
    .filter((p) => p.aluguelId === aluguel.id && (!editando || p.id !== editando.id))
    .reduce((soma, p) => soma + Number(p.valorPago), 0);
  return { valor, pago, saldo: Math.max(0, valor - pago), estimado: aluguel.valorTotal == null };
}

function mostrarSaldo() {
  let caixa = document.querySelector("#saldo-aluguel");
  let a = aluguelPorId(formPagamento.elements.aluguelId.value);
  if (!a) { caixa.classList.add("d-none"); return null; }
  let s = calcularSaldo(a);
  caixa.innerHTML = `${s.estimado ? "Valor estimado (aluguel em aberto)" : "Valor do aluguel"}: ${formatarPreco(s.valor)} · ` +
    `Já pago: ${formatarPreco(s.pago)} · Saldo: <strong>${formatarPreco(s.saldo)}</strong>`;
  caixa.classList.remove("d-none");
  return s;
}

async function prepararModal() {
  todosPagamentos = await buscarJSON("/Pagamentos");
  formPagamento.reset();
  limparValidacao(formPagamento);
}

async function abrirCadastro() {
  editando = null;
  try {
    await prepararModal();
    formPagamento.elements.dataPagamento.value = hoje();
    document.querySelector("#titulo-modal-pagamento").textContent = "Novo pagamento";
    mostrarSaldo();
    modalPagamento.show();
  } catch (erro) {
    mostrarToast(mensagemDeErro(erro), "erro");
  }
}

async function abrirEdicao(id) {
  try {
    editando = await buscarJSON("/Pagamentos/" + id);
    await prepararModal();
    let c = formPagamento.elements;
    c.aluguelId.value = editando.aluguelId;
    if (!METODOS.includes(editando.metodoPagamento)) {
      c.metodoPagamento.innerHTML += `<option>${escapeHTML(editando.metodoPagamento)}</option>`;
    }
    c.metodoPagamento.value = editando.metodoPagamento;
    c.valorPago.value = editando.valorPago;
    c.dataPagamento.value = paraDataInput(editando.dataPagamento);
    document.querySelector("#titulo-modal-pagamento").textContent = "Editar pagamento #" + id;
    mostrarSaldo();
    modalPagamento.show();
  } catch (erro) {
    mostrarToast(mensagemDeErro(erro), "erro");
  }
}

async function salvarPagamento(evento) {
  evento.preventDefault();
  limparValidacao(formPagamento);
  let c = formPagamento.elements;
  let ok = validarCampos(formPagamento);

  let saldo = mostrarSaldo();
  if (ok && saldo && !saldo.estimado && Number(c.valorPago.value) > saldo.saldo + 0.001) {
    marcarInvalido(c.valorPago, "O valor passa do saldo do aluguel (" + formatarPreco(saldo.saldo) + ").");
    ok = false;
  }
  if (!ok) return;

  let dados = {
    aluguelId: Number(c.aluguelId.value),
    metodoPagamento: c.metodoPagamento.value,
    valorPago: Number(c.valorPago.value),
    dataPagamento: c.dataPagamento.value
  };
  let botao = formPagamento.querySelector(".botao-salvar");
  alternarCarregando(botao, true);

  try {
    if (editando) {
      await enviarJSON("PUT", "/Pagamentos/" + editando.id, { ...dados, id: editando.id });
      mostrarToast("Pagamento atualizado.");
    } else {
      await enviarJSON("POST", "/Pagamentos", dados);
      mostrarToast("Pagamento registrado.");
    }
    modalPagamento.hide();
    carregarPagamentos();
  } catch (erro) {
    mostrarErroNoFormulario(formPagamento, erro);
  } finally {
    alternarCarregando(botao, false);
  }
}

// Ao escolher o aluguel, mostra o saldo e sugere o valor restante
formPagamento.elements.aluguelId.addEventListener("change", () => {
  let s = mostrarSaldo();
  if (s && !editando && s.saldo > 0) formPagamento.elements.valorPago.value = s.saldo.toFixed(2);
});

document.querySelector("#botao-novo").addEventListener("click", abrirCadastro);
formPagamento.addEventListener("submit", salvarPagamento);

formFiltros.addEventListener("submit", (e) => { e.preventDefault(); carregarPagamentos(); });
formFiltros.addEventListener("reset", () => setTimeout(carregarPagamentos));

document.querySelector("#corpo-tabela").addEventListener("click", (e) => {
  let editar = e.target.closest("[data-editar]");
  let excluir = e.target.closest("[data-excluir]");
  if (editar) abrirEdicao(editar.dataset.editar);
  if (excluir) {
    confirmarExclusao("o pagamento #" + excluir.dataset.excluir, async () => {
      await enviarJSON("DELETE", "/Pagamentos/" + excluir.dataset.excluir);
      mostrarToast("Pagamento excluído.");
      carregarPagamentos();
    });
  }
});

carregarListas()
  .catch((erro) => mostrarToast(mensagemDeErro(erro), "erro"))
  .finally(carregarPagamentos);
