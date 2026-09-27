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
                _context.Clientes.Add(cliente);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetCliente), new { id = cliente.Id }, cliente);
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        [HttpGet]
        public async Task<IActionResult> GetClientes()
        {
            try
            {
                var clientes = await _context.Clientes.ToListAsync();
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
                _context.Entry(cliente).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                return Ok("Cliente atualizado!");
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Clientes.Any(e => e.Id == id)) return NotFound("Cliente não encontrado.");
                throw;
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
                _context.Clientes.Remove(cliente);
                await _context.SaveChangesAsync();
                return Ok("Cliente removido!");
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }
    }
}