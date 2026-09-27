using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Data;

namespace RentalSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FiltrosController : ControllerBase
    {
        private readonly ApplicationContext _context;

        public FiltrosController(ApplicationContext context) => _context = context;

      
        [HttpGet("veiculos-com-fabricantes")]
        public async Task<IActionResult> GetVeiculosEFabricantes()
        {
            try
            {
                var veiculos = await _context.Veiculos
                    .Include(v => v.Fabricante)
                    .Select(v => new
                    {
                        v.Id,
                        v.Modelo,
                        v.AnoFabricacao,
                        Fabricante = v.Fabricante.Nome
                    }).ToListAsync();
                return Ok(veiculos);
            }
            catch (Exception ex) { return StatusCode(500, ex.Message); }
        }

   
        [HttpGet("alugueis-detalhados")]
        public async Task<IActionResult> GetAlugueisDetalhados()
        {
            try
            {
                var alugueis = await _context.Alugueis
                    .Include(a => a.Cliente)
                    .Include(a => a.Veiculo)
                    .Select(a => new
                    {
                        IdAluguel = a.Id,
                        DataInicio = a.DataInicio,
                        ClienteNome = a.Cliente.Nome,
                        VeiculoModelo = a.Veiculo.Modelo,
                        ValorTotal = a.ValorTotal
                    }).ToListAsync();
                return Ok(alugueis);
            }
            catch (Exception ex) { return StatusCode(500, ex.Message); }
        }

       
        [HttpGet("clientes-pagamentos-linq")]
        public async Task<IActionResult> GetClientesPagamentosLinq()
        {
            try
            {
                var query = await (from cliente in _context.Clientes
                                   join aluguel in _context.Alugueis on cliente.Id equals aluguel.ClienteId
                                   join pagamento in _context.Pagamentos on aluguel.Id equals pagamento.AluguelId
                                   select new
                                   {
                                       NomeCliente = cliente.Nome,
                                       CPF = cliente.Cpf,
                                       DataAluguel = aluguel.DataInicio,
                                       ValorPago = pagamento.ValorPago,
                                       Metodo = pagamento.MetodoPagamento
                                   }).ToListAsync();
                return Ok(query);
            }
            catch (Exception ex) { return StatusCode(500, ex.Message); }
        }

        
        [HttpGet("alugueis-pendentes")]
        public async Task<IActionResult> GetAlugueisPendentes()
        {
            try
            {
                var pendentes = await _context.Alugueis
                    .Include(a => a.Cliente)
                    .Include(a => a.Veiculo)
                    .Where(a => a.DataDevolucao == null)
                    .Select(a => new
                    {
                        a.Id,
                        Cliente = a.Cliente.Nome,
                        Veiculo = a.Veiculo.Modelo,
                        a.DataFimPrevista
                    }).ToListAsync();
                return Ok(pendentes);
            }
            catch (Exception ex) { return StatusCode(500, ex.Message); }
        }

        
        [HttpGet("fabricantes-veiculos-leftjoin")]
        public async Task<IActionResult> GetFabricantesLeftJoin()
        {
            try
            {
                var query = await (from f in _context.Fabricantes
                                   join v in _context.Veiculos on f.Id equals v.FabricanteId into g
                                   from veiculo in g.DefaultIfEmpty()
                                   select new
                                   {
                                       Fabricante = f.Nome,
                                       Veiculo = veiculo == null ? "Sem veículos" : veiculo.Modelo
                                   }).ToListAsync();
                return Ok(query);
            }
            catch (Exception ex) { return StatusCode(500, ex.Message); }
        }
    }
}