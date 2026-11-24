using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalSystem.Data;
using RentalSystem.Models;

namespace RentalSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientesController : ControllerBase
    {
        private readonly ApplicationContext _context;

        public ClientesController(ApplicationContext context) => _context = context;

        [HttpPost]
        public async Task<IActionResult> PostCliente([FromBody] Cliente cliente)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);
                if (await _context.Clientes.AnyAsync(c => c.Cpf == cliente.Cpf)) return Conflict("CPF já cadastrado.");
                _context.Clientes.Add(cliente);
                await _context.SaveChangesAsync();
                return Ok(cliente);
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        // Filtros: nome, cpf e email (todos "contém")
        [HttpGet]
        public async Task<IActionResult> GetClientes([FromQuery] string? nome, [FromQuery] string? cpf, [FromQuery] string? email)
        {
            try
            {
                var query = _context.Clientes.AsQueryable();
                if (!string.IsNullOrWhiteSpace(nome)) query = query.Where(c => c.Nome.Contains(nome));
                if (!string.IsNullOrWhiteSpace(cpf)) query = query.Where(c => c.Cpf.Contains(cpf));
                if (!string.IsNullOrWhiteSpace(email)) query = query.Where(c => c.Email.Contains(email));

                var clientes = await query.OrderBy(c => c.Nome).ToListAsync();
                return Ok(clientes);
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCliente(int id)
        {
            try
            {
                var cliente = await _context.Clientes.FindAsync(id);
                if (cliente == null) return NotFound("Cliente não encontrado.");
                return Ok(cliente);
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutCliente(int id, [FromBody] Cliente cliente)
        {
            if (id != cliente.Id) return BadRequest("IDs divergentes.");
            try
            {
                if (!await _context.Clientes.AnyAsync(c => c.Id == id)) return NotFound("Cliente não encontrado.");
                if (await _context.Clientes.AnyAsync(c => c.Cpf == cliente.Cpf && c.Id != id)) return Conflict("CPF já cadastrado.");
                _context.Entry(cliente).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                return Ok("Cliente atualizado!");
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCliente(int id)
        {
            try
            {
                var cliente = await _context.Clientes.FindAsync(id);
                if (cliente == null) return NotFound("Cliente não encontrado.");
                if (await _context.Alugueis.AnyAsync(a => a.ClienteId == id))
                    return Conflict("Não é possível excluir: o cliente possui aluguéis registrados.");
                _context.Clientes.Remove(cliente);
                await _context.SaveChangesAsync();
                return Ok("Cliente removido!");
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }
    }
}
