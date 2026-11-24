// Funções compartilhadas por todas as telas do RentalSystem.

// Endereço da API do Trabalho Prático 1 (perfil "http" do launchSettings.json).
const urlBase = "http://localhost:5127/api";

const MSG_API_FORA = "Não foi possível conectar à API. Ela está rodando em " + urlBase + "?";

// ---------- Formatação ----------
function escapeHTML(texto) {
  if (texto === null || texto === undefined) return "";
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const formatadorPreco = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatarPreco(valor) {
  if (valor === null || valor === undefined || valor === "") return "—";
  let numero = Number(valor);
  return formatadorPreco.format(Number.isFinite(numero) ? numero : 0);
}

function formatarKm(valor) {
  if (valor === null || valor === undefined || valor === "") return "—";
  return Number(valor).toLocaleString("pt-BR") + " km";
}

// A API devolve datas como "2026-11-20T00:00:00". Usamos só a parte da data
// para não haver deslocamento de fuso horário.
function paraDataInput(iso) {
  return iso ? String(iso).substring(0, 10) : "";
}

function formatarData(iso) {
  if (!iso) return "—";
  let [ano, mes, dia] = paraDataInput(iso).split("-");
  return dia + "/" + mes + "/" + ano;
}

function hoje() {
  let agora = new Date();
  agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
  return agora.toISOString().substring(0, 10);
}

// Quantidade de diárias entre duas datas (mínimo 1)
function calcularDiarias(inicio, fim) {
  let ms = new Date(paraDataInput(fim)) - new Date(paraDataInput(inicio));
  return Math.max(1, Math.ceil(ms / 86400000));
}

// ---------- Chamadas à API ----------
async function erroDaResposta(resposta) {
  let texto = await resposta.text();
  let corpo = texto;
  try { corpo = JSON.parse(texto); } catch (e) { }

  let mensagem = "A API respondeu com erro (HTTP " + resposta.status + ").";
  let campos = {};

  if (typeof corpo === "string" && corpo.trim() !== "") {
    mensagem = corpo;
  } else if (corpo && corpo.errors) {
    // erros de validação do ASP.NET: { errors: { Campo: ["mensagem"] } }
    for (let [campo, lista] of Object.entries(corpo.errors)) {
      let nome = campo.replace(/^\$\./, "");
      campos[nome.charAt(0).toLowerCase() + nome.slice(1)] = lista.join(" ");
    }
    mensagem = Object.values(campos).join(" ") || corpo.title;
  } else if (corpo && corpo.mensagem) {
    mensagem = corpo.mensagem;
  }

  let erro = new Error(mensagem);
  erro.status = resposta.status;
  erro.campos = campos;
  return erro;
}

function mensagemDeErro(erro) {
  if (erro instanceof TypeError) return MSG_API_FORA;
  return erro && erro.message ? erro.message : "Algo deu errado. Tente novamente.";
}

// GET com filtros opcionais: buscarJSON("/Veiculos", { modelo: "Onix" })
async function buscarJSON(caminho, filtros) {
  let params = new URLSearchParams();
  for (let [campo, valor] of Object.entries(filtros || {})) {
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") params.set(campo, String(valor).trim());
  }
  let query = params.toString();
  let resposta = await fetch(urlBase + caminho + (query ? "?" + query : ""));
  if (!resposta.ok) throw await erroDaResposta(resposta);
  return resposta.json();
}

// POST / PUT / DELETE. A API às vezes responde texto ("Cliente atualizado!").
async function enviarJSON(metodo, caminho, corpo) {
  let resposta = await fetch(urlBase + caminho, {
    method: metodo,
    headers: corpo ? { "Content-Type": "application/json" } : {},
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  if (!resposta.ok) throw await erroDaResposta(resposta);
  let texto = await resposta.text();
  try { return JSON.parse(texto); } catch (e) { return texto; }
}

// Lê os campos de um formulário de filtros como objeto { nome: valor }
function lerFiltros(form) {
  let filtros = {};
  for (let [campo, valor] of new FormData(form).entries()) {
    if (String(valor).trim() !== "") filtros[campo] = String(valor).trim();
  }
  return filtros;
}

// ---------- Interface ----------
function htmlEstado(opcoes) {
  let tipo = opcoes.tipo === "erro" ? "estado-erro" : "";
  return `
    <div class="estado ${tipo}">
      <span class="estado-icone" aria-hidden="true"><i class="bi ${opcoes.icone}"></i></span>
      <p class="estado-titulo">${escapeHTML(opcoes.titulo)}</p>
      <p class="estado-texto">${escapeHTML(opcoes.texto)}</p>
    </div>`;
}

function linhaEstado(colunas, opcoes) {
  return `<tr><td colspan="${colunas}">${htmlEstado(opcoes)}</td></tr>`;
}

function linhaCarregando(colunas) {
  return `<tr><td colspan="${colunas}" class="text-center py-4 texto-mudo">
    <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Carregando…</td></tr>`;
}

function mostrarToast(mensagem, tipo = "sucesso") {
  let area = document.querySelector("#area-toasts");
  if (!area) {
    area = document.createElement("div");
    area.id = "area-toasts";
    area.className = "toast-container position-fixed bottom-0 end-0 p-3";
    area.setAttribute("aria-live", "polite");
    document.body.appendChild(area);
  }

  let erro = tipo === "erro";
  let toast = document.createElement("div");
  toast.className = "toast toast-rs " + (erro ? "toast-erro" : "");
  toast.setAttribute("role", erro ? "alert" : "status");
  toast.innerHTML = `
    <div class="d-flex align-items-center">
      <div class="toast-body">
        <i class="bi ${erro ? "bi-x-circle-fill" : "bi-check-circle-fill"} toast-icone" aria-hidden="true"></i>
        <span>${escapeHTML(mensagem)}</span>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar aviso"></button>
    </div>`;

  area.appendChild(toast);
  toast.addEventListener("hidden.bs.toast", () => toast.remove());
  bootstrap.Toast.getOrCreateInstance(toast, { delay: erro ? 7000 : 4500 }).show();
}

function alternarCarregando(botao, carregando, textoCarregando = "Salvando…") {
  if (carregando) {
    botao.dataset.textoOriginal = botao.innerHTML;
    botao.innerHTML = `<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>${textoCarregando}`;
  } else if (botao.dataset.textoOriginal) {
    botao.innerHTML = botao.dataset.textoOriginal;
  }
  botao.disabled = carregando;
}

// ---------- Validação de formulários ----------
function marcarInvalido(campo, mensagem) {
  if (!campo) return;
  campo.classList.add("is-invalid");
  let feedback = campo.parentElement.querySelector(".invalid-feedback");
  if (feedback) feedback.textContent = mensagem;
}

function desmarcarInvalido(campo) {
  if (campo && campo.classList) campo.classList.remove("is-invalid");
}

function limparValidacao(form) {
  form.querySelectorAll(".is-invalid").forEach((c) => c.classList.remove("is-invalid"));
  let alerta = form.querySelector(".erros-api");
  if (alerta) { alerta.classList.add("d-none"); alerta.textContent = ""; }
}

// Ao digitar ou trocar um valor, o aviso de erro daquele campo some
document.addEventListener("input", (e) => desmarcarInvalido(e.target));
document.addEventListener("change", (e) => desmarcarInvalido(e.target));

// Verifica os campos "required", "min", "max" e "type=email" do HTML.
// Retorna true se estiver tudo certo.
function validarCampos(form) {
  let valido = true;
  for (let campo of form.querySelectorAll("input, select, textarea")) {
    if (campo.disabled || campo.type === "hidden") continue;
    if (!campo.checkValidity()) {
      valido = false;
      let msg = campo.validity.valueMissing ? "Campo obrigatório."
        : campo.validity.typeMismatch ? "Formato inválido."
        : campo.validity.rangeUnderflow ? "O valor mínimo é " + campo.min + "."
        : campo.validity.rangeOverflow ? "O valor máximo é " + campo.max + "."
        : campo.validity.patternMismatch ? (campo.title || "Formato inválido.")
        : campo.validationMessage;
      marcarInvalido(campo, msg);
    }
  }
  return valido;
}

// Mostra o erro da API dentro do modal e marca os campos indicados por ela
function mostrarErroNoFormulario(form, erro) {
  let alerta = form.querySelector(".erros-api");
  if (erro.campos) {
    for (let [nome, msg] of Object.entries(erro.campos)) marcarInvalido(form.elements[nome], msg);
  }
  if (alerta) {
    alerta.textContent = mensagemDeErro(erro);
    alerta.classList.remove("d-none");
  } else {
    mostrarToast(mensagemDeErro(erro), "erro");
  }
}

// Preenche um <select> com uma lista de registros da API
function preencherSelect(select, itens, rotulo, textoVazio) {
  let atual = select.value;
  select.innerHTML = `<option value="">${escapeHTML(textoVazio)}</option>` +
    itens.map((item) => `<option value="${item.id}">${escapeHTML(rotulo(item))}</option>`).join("");
  if (atual && itens.some((i) => String(i.id) === atual)) select.value = atual;
}

// ---------- Exclusão com confirmação ----------
// Usa o modal #modal-excluir que existe em todas as páginas de cadastro.
function confirmarExclusao(descricao, aoConfirmar) {
  let modalEl = document.querySelector("#modal-excluir");
  modalEl.querySelector(".descricao-exclusao").textContent = descricao;
  let botao = modalEl.querySelector(".botao-confirmar-exclusao");
  let modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  botao.onclick = async () => {
    alternarCarregando(botao, true, "Excluindo…");
    try {
      await aoConfirmar();
      modal.hide();
    } catch (erro) {
      modal.hide();
      mostrarToast(mensagemDeErro(erro), "erro");
    } finally {
      alternarCarregando(botao, false);
    }
  };
  modal.show();
}

// Status de um aluguel: aberto, atrasado ou devolvido
function statusAluguel(aluguel) {
  if (aluguel.dataDevolucao) return { classe: "status-devolvido", texto: "Devolvido", icone: "bi-check2" };
  if (paraDataInput(aluguel.dataFimPrevista) < hoje()) return { classe: "status-atrasado", texto: "Atrasado", icone: "bi-exclamation-triangle" };
  return { classe: "status-aberto", texto: "Em aberto", icone: "bi-clock" };
}

function badgeStatus(aluguel) {
  let s = statusAluguel(aluguel);
  return `<span class="status ${s.classe}"><i class="bi ${s.icone}" aria-hidden="true"></i>${s.texto}</span>`;
}
