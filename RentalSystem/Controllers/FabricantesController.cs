using RentalSystem.Data;
using RentalSystem.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace RentalSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FabricantesController : ControllerBase
    {
        private readonly ApplicationContext _context;

        public FabricantesController(ApplicationContext context) => _context = context;

        [HttpPost]
        public async Task<IActionResult> PostFabricante([FromBody] Fabricante fabricante)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);
                _context.Fabricantes.Add(fabricante);
                await _context.SaveChangesAsync();
                return Ok(fabricante);
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        [HttpGet]
        public async Task<IActionResult> GetFabricantes()
        {
            try
            {
                var fabricantes = await _context.Fabricantes.ToListAsync();
                return Ok(fabricantes);
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetFabricante(int id)
        {
            try
            {
                var fabricante = await _context.Fabricantes.FindAsync(id);
                if (fabricante == null) return NotFound("Fabricante não encontrado.");
                return Ok(fabricante);
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutFabricante(int id, [FromBody] Fabricante fabricante)
        {
            if (id != fabricante.Id) return BadRequest("IDs divergentes.");
            try
            {
                _context.Entry(fabricante).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                return Ok(fabricante);
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFabricante(int id)
        {
            try
            {
                var fabricante = await _context.Fabricantes.FindAsync(id);
                if (fabricante == null) return NotFound("Fabricante não encontrado.");
                _context.Fabricantes.Remove(fabricante);
                await _context.SaveChangesAsync();
                return Ok(new { mensagem = "Fabricante removido com sucesso!" });
            }
            catch (Exception ex) { return StatusCode(500, $"Erro interno: {ex.Message}"); }
        }
    }
}