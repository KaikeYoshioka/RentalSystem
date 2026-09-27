# RentalSystem

Tema: Desenvolver um sistema de aluguel de veículos utilizando C# 6.0 (ou superior), Entity Framework, SQL Express como banco de dados e Swagger para testes.

Requisitos:

O trabalho será dividido em 4 etapas:

1.Modelagem do Banco de Dados;
2.Criação de registros e execução de consultas;
3.Implementação do Backend; e
4.Apresentação do trabalho (pitch).

Etapa 1: Modelagem do Banco de Dados ✅

1.1. Crie um modelo conceitual para o banco de dados da locadora de veículos, considerando entidades como Veículo, Fabricante (marca), Cliente, Aluguel, etc, com colunas (atributos) que julgar necessário, obedecendo às seguintes regras:

Todo veículo pertence a um fabricante e deve ter registrado seu modelo, ano de fabricação e quilometragem;
O cliente deve ter pelo menos nome, CPF e e-mail;
Todo aluguel está atrelado a um cliente, um veículo em um dado período de tempo;
É necessário registrar a devolução do veículo em um aluguel, além da quilometragem inicial e final do aluguel, o valor da diária e valor total da locação;
1.2. Utilize o Entity Framework para traduzir o modelo conceitual em um esquema de banco de dados relacional.

1.3. Defina as chaves primárias, estrangeiras e outras restrições necessárias para manter a integridade dos dados.

1.4. Implemente as classes de entidades em C# que representam as tabelas do banco de dados.

1.5. O banco deve possuir no mínimo 5 entidades, ou seja, uma além das citadas no item 1.1.

 

Etapa 2: Implementação do Backend ⏳

2.1. Desenvolva um backend em C# 6.0 (ou superior) utilizando o ASP.NET Core para criar APIs RESTful que irão interagir com o banco de dados.

2.2. Implemente endpoints para operações CRUD (Criar, Ler, Atualizar, Deletar) para as entidades do sistema (veículos, clientes, etc.).

2.3. Utilize o Entity Framework para conectar e interagir com o banco de dados SQL Express.

2.4. Garanta a validação dos dados de entrada e saída nas APIs, incluindo tratamento de erros e exceções.

2.5. O backend deve possuir rotas para 5 filtros diferentes que utilizem pelo menos dois tipos de joins de tabelas diferentes

 

Etapa 3: Testes e Documentação ⏳

3.1. Integre o Swagger ao projeto para documentar e testar as APIs desenvolvidas.

3.2. Documente cada endpoint, especificando os métodos HTTP permitidos, os parâmetros necessários e os possíveis códigos de resposta em um documento de formato livre. 

3.3. Utilize o Swagger para realizar testes manuais das APIs, verificando se todas as operações estão funcionando conforme o esperado. Os testes devem ser evidenciados em um relatório de testes contendo a chamda de cada método das APIs e também o retorno obtido. Utilize prints de tela para tal.

 

Etapa 4: Vídeo Apresentação em formato Pitch ⏳

Produção de um vídeo demonstrativo que apresente o funcionamento do sistema de locadora de veículos desenvolvido.
O vídeo deve abordar as principais funcionalidades do sistema, como cadastro de veículos, clientes, realização de reservas, entre outros.
Demonstre como utilizar as APIs desenvolvidas para interagir com o sistema.
Certifique-se de que o vídeo seja claro, bem estruturado e de fácil compreensão para o público-alvo.
Após a produção do vídeo demonstrativo, este deverá ser disponibilizado em uma plataforma de compartilhamento de vídeos, como o YouTube.
O link para o vídeo deverá ser inserido no relatório acadêmico, permitindo fácil acesso aos avaliadores e demais interessados.
Certifique-se de que o vídeo esteja devidamente hospedado e acessível durante o período de avaliação do relatório.
O tempo do vídeo deve variar entre 6 e 12 minutos, considerando a demonstação e uma breve explicação do sistema.
