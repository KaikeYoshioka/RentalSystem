// Tela inicial: indicadores gerais e aluguéis em aberto

async function carregarIndicadores() {
  let [veiculos, clientes, alugueis, pagamentos] = await Promise.all([
    buscarJSON("/Veiculos"), buscarJSON("/Clientes"), buscarJSON("/Alugueis"), buscarJSON("/Pagamentos")
  ]);

  let abertos = alugueis.filter((a) => !a.dataDevolucao);
  let atrasados = abertos.filter((a) => paraDataInput(a.dataFimPrevista) < hoje());
  let recebido = pagamentos.reduce((soma, p) => soma + Number(p.valorPago), 0);
  let disponiveis = veiculos.filter((v) => !abertos.some((a) => a.veiculoId === v.id)).length;

  document.querySelector("#ind-veiculos").textContent = veiculos.length;
  document.querySelector("#ind-veiculos-extra").textContent = disponiveis + " disponível(is) agora";
  document.querySelector("#ind-clientes").textContent = clientes.length;
  document.querySelector("#ind-clientes-extra").textContent = new Set(abertos.map((a) => a.clienteId)).size + " com aluguel em aberto";
  document.querySelector("#ind-abertos").textContent = abertos.length;
  document.querySelector("#ind-abertos-extra").textContent = atrasados.length ? atrasados.length + " atrasado(s)" : "nenhum atrasado";
  document.querySelector("#ind-recebido").textContent = formatarPreco(recebido);
  document.querySelector("#ind-recebido-extra").textContent = pagamentos.length + " pagamento(s)";

  document.querySelector("#resumo-painel").textContent =
    alugueis.length + " aluguel(éis) registrados · " + veiculos.length + " veículo(s) na frota";
}

async function carregarPendentes() {
  let corpo = document.querySelector("#corpo-pendentes");
  corpo.innerHTML = linhaCarregando(6);

  // Rota de filtro com JOIN (Aluguel × Cliente × Veículo) criada no Trabalho Prático 1
  let pendentes = await buscarJSON("/Filtros/alugueis-pendentes");
  pendentes.sort((a, b) => String(a.dataFimPrevista).localeCompare(String(b.dataFimPrevista)));

  if (pendentes.length === 0) {
    corpo.innerHTML = linhaEstado(6, { icone: "bi-check2-circle", titulo: "Nenhum aluguel em aberto", texto: "Todos os veículos foram devolvidos." });
    return;
  }

  corpo.innerHTML = pendentes.map((p) => `
    <tr>
      <td class="id-registro">${p.id}</td>
      <td>${escapeHTML(p.cliente)}</td>
      <td>${escapeHTML(p.veiculo)}</td>
      <td>${formatarData(p.dataFimPrevista)}</td>
      <td>${badgeStatus({ dataFimPrevista: p.dataFimPrevista })}</td>
      <td class="tabela-acoes">
        <a class="btn btn-sm btn-primary" href="alugueis.html?devolucao=${p.id}"><i class="bi bi-box-arrow-in-down" aria-hidden="true"></i> Registrar devolução</a>
      </td>
    </tr>`).join("");
}

Promise.all([carregarIndicadores(), carregarPendentes()]).catch((erro) => {
  console.error("Erro ao carregar o painel:", erro);
  document.querySelector("#resumo-painel").textContent = mensagemDeErro(erro);
  document.querySelector("#corpo-pendentes").innerHTML = linhaEstado(6, {
    tipo: "erro", icone: "bi-wifi-off", titulo: "Não foi possível carregar", texto: mensagemDeErro(erro)
  });
});
