using Microsoft.EntityFrameworkCore;

using RentalSystem.Data;



var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ApplicationContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();


app.MapGet("/", () => "RODANDO");

app.Run();