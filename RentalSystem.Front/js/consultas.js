// Tela de Consultas: as 5 rotas de /api/Filtros (JOINs) do Trabalho Prático 1

const CONSULTAS = [
  {
    rota: "veiculos-com-fabricantes",
    titulo: "Veículos com fabricantes",
    descricao: "Cada veículo com o nome do seu fabricante (INNER JOIN via Include).",
    sql: "SELECT v.Id, v.Modelo, v.AnoFabricacao, f.Nome AS Fabricante\nFROM Veiculos v\nINNER JOIN Fabricantes f ON f.Id = v.FabricanteId",
    colunas: [["id", "#"], ["modelo", "Modelo"], ["anoFabricacao", "Ano"], ["fabricante", "Fabricante"]]
  },
  {
    rota: "alugueis-detalhados",
    titulo: "Aluguéis detalhados",
    descricao: "Aluguéis com o nome do cliente e o modelo do veículo (dois INNER JOINs).",
    sql: "SELECT a.Id, a.DataInicio, c.Nome AS ClienteNome, v.Modelo AS VeiculoModelo, a.ValorTotal\nFROM Alugueis a\nINNER JOIN Clientes c ON c.Id = a.ClienteId\nINNER JOIN Veiculos v ON v.Id = a.VeiculoId",
    colunas: [["idAluguel", "Aluguel", (v) => "#" + v], ["dataInicio", "Início", formatarData], ["clienteNome", "Cliente"], ["veiculoModelo", "Veículo"], ["valorTotal", "Valor total", formatarPreco, true]],
    total: "valorTotal"
  },
  {
    rota: "clientes-pagamentos-linq",
    titulo: "Clientes × pagamentos",
    descricao: "Pagamentos de cada cliente, ligando Clientes → Aluguéis → Pagamentos (JOIN em LINQ).",
    sql: "SELECT c.Nome, c.Cpf, a.DataInicio, p.ValorPago, p.MetodoPagamento\nFROM Clientes c\nJOIN Alugueis a ON a.ClienteId = c.Id\nJOIN Pagamentos p ON p.AluguelId = a.Id",
    colunas: [["nomeCliente", "Cliente"], ["cpf", "CPF"], ["dataAluguel", "Data do aluguel", formatarData], ["metodo", "Método"], ["valorPago", "Valor pago", formatarPreco, true]],
    total: "valorPago"
  },
  {
    rota: "alugueis-pendentes",
    titulo: "Aluguéis pendentes",
    descricao: "Aluguéis sem data de devolução, com cliente e veículo (JOIN + WHERE).",
    sql: "SELECT a.Id, c.Nome AS Cliente, v.Modelo AS Veiculo, a.DataFimPrevista\nFROM Alugueis a\nINNER JOIN Clientes c ON c.Id = a.ClienteId\nINNER JOIN Veiculos v ON v.Id = a.VeiculoId\nWHERE a.DataDevolucao IS NULL",
    colunas: [["id", "#"], ["cliente", "Cliente"], ["veiculo", "Veículo"], ["dataFimPrevista", "Devolução prevista", formatarData],
              ["dataFimPrevista", "Situação", (v) => paraDataInput(v) < hoje() ? '<span class="status status-atrasado">Atrasado</span>' : '<span class="status status-aberto">No prazo</span>', false, true]]
  },
  {
    rota: "fabricantes-veiculos-leftjoin",
    titulo: "Fabricantes (LEFT JOIN)",
    descricao: "Todos os fabricantes, inclusive os que ainda não têm veículos (LEFT JOIN).",
    sql: "SELECT f.Nome AS Fabricante, ISNULL(v.Modelo, 'Sem veículos') AS Veiculo\nFROM Fabricantes f\nLEFT JOIN Veiculos v ON v.FabricanteId = f.Id",
    colunas: [["fabricante", "Fabricante"], ["veiculo", "Veículo"]]
  }
];

let consultaAtual = CONSULTAS[0];
let linhas = [];

function montarAbas() {
  document.querySelector("#abas-consulta").innerHTML = CONSULTAS.map((c, i) => `
    <button type="button" role="tab" class="btn ${c === consultaAtual ? "btn-primary" : "btn-outline-primary"}"
            aria-selected="${c === consultaAtual}" data-indice="${i}">${escapeHTML(c.titulo)}</button>`).join("");
}

function valorCelula(linha, coluna) {
  let [campo, , formatar, , html] = coluna;
  let valor = linha[campo];
  if (!formatar) return escapeHTML(valor ?? "—");
  return html ? formatar(valor) : escapeHTML(formatar(valor));
}

function desenharTabela() {
  let c = consultaAtual;
  let busca = document.querySelector("#busca-consulta").value.trim().toLowerCase();
  let visiveis = busca
    ? linhas.filter((l) => Object.values(l).some((v) => String(v ?? "").toLowerCase().includes(busca)))
    : linhas;

  let corpo = document.querySelector("#corpo-consulta");
  if (visiveis.length === 0) {
    corpo.innerHTML = linhaEstado(c.colunas.length, {
      icone: "bi-search",
      titulo: linhas.length ? "Nada encontrado" : "Sem resultados",
      texto: linhas.length ? "Nenhuma linha contém esse texto." : "A consulta não retornou linhas."
    });
  } else {
    corpo.innerHTML = visiveis.map((l) => "<tr>" + c.colunas.map((col) =>
      `<td${col[3] ? ' class="text-end"' : ""}>${valorCelula(l, col)}</td>`).join("") + "</tr>").join("");
  }

  let rodape = visiveis.length + (visiveis.length === 1 ? " linha" : " linhas");
  if (busca) rodape += " de " + linhas.length;
  if (c.total) rodape += " · Total: " + formatarPreco(visiveis.reduce((s, l) => s + Number(l[c.total] || 0), 0));
  document.querySelector("#rodape-consulta").textContent = rodape;
}

async function executarConsulta() {
  let c = consultaAtual;
  montarAbas();
  document.querySelector("#titulo-consulta").textContent = c.titulo;
  document.querySelector("#descricao-consulta").textContent = c.descricao;
  document.querySelector("#rota-consulta").textContent = "GET /api/Filtros/" + c.rota;
  document.querySelector("#sql-consulta").textContent = c.sql;
  document.querySelector("#cabecalho-consulta").innerHTML = c.colunas.map((col) =>
    `<th scope="col"${col[3] ? ' class="text-end"' : ""}>${escapeHTML(col[1])}</th>`).join("");
  document.querySelector("#corpo-consulta").innerHTML = linhaCarregando(c.colunas.length);
  document.querySelector("#rodape-consulta").textContent = "";

  try {
    linhas = await buscarJSON("/Filtros/" + c.rota);
    if (c !== consultaAtual) return; // o usuário trocou de aba enquanto carregava
    desenharTabela();
  } catch (erro) {
    linhas = [];
    document.querySelector("#corpo-consulta").innerHTML = linhaEstado(c.colunas.length, {
      tipo: "erro", icone: "bi-wifi-off", titulo: "Não foi possível executar a consulta", texto: mensagemDeErro(erro)
    });
  }
}

document.querySelector("#abas-consulta").addEventListener("click", (e) => {
  let aba = e.target.closest("[data-indice]");
  if (!aba) return;
  consultaAtual = CONSULTAS[Number(aba.dataset.indice)];
  document.querySelector("#busca-consulta").value = "";
  history.replaceState(null, "", "?consulta=" + consultaAtual.rota);
  executarConsulta();
});
document.querySelector("#busca-consulta").addEventListener("input", desenharTabela);
document.querySelector("#botao-atualizar").addEventListener("click", executarConsulta);

let pedida = new URLSearchParams(location.search).get("consulta");
consultaAtual = CONSULTAS.find((c) => c.rota === pedida) || CONSULTAS[0];
executarConsulta();
