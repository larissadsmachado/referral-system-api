import { Controller, Get, Header } from '@nestjs/common';

const OPENAPI_SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'Indica e Conta - Referral System API',
    version: '1.0.0',
    description:
      'API de sistema de indicação de clientes utilizando NestJS, MongoDB, Redis (Cache-Aside) e RabbitMQ (processamento assíncrono de eventos).',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Servidor Local' }],
  tags: [
    { name: 'Customers', description: 'Cadastro e consulta de clientes' },
    { name: 'Reports', description: 'Relatório consolidado de indicações' },
  ],
  paths: {
    '/customers': {
      post: {
        tags: ['Customers'],
        summary: 'Cadastrar um novo customer (com ou sem indicação)',
        description:
          'Cria um customer no MongoDB, armazena no Redis (`customer:{id}`) e, caso `parent_customer_id` seja informado, valida o indicador (Redis -> fallback MongoDB) e publica evento `customer.indication.created` no RabbitMQ.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateCustomerDto' },
              examples: {
                semIndicacao: {
                  summary: 'Customer sem indicação',
                  value: {
                    name: 'João Silva',
                    email: 'joao@email.com',
                  },
                },
                comIndicacao: {
                  summary: 'Customer indicado por outro',
                  value: {
                    name: 'Maria Souza',
                    email: 'maria@email.com',
                    parent_customer_id: '6851ab34d321c45678912345',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Customer criado com sucesso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CustomerResponse' },
              },
            },
          },
          '400': {
            description:
              'Dados inválidos ou `parent_customer_id` não encontrado no Redis nem no MongoDB',
          },
          '409': {
            description: 'E-mail já cadastrado',
          },
        },
      },
      get: {
        tags: ['Customers'],
        summary: 'Listar todos os customers cadastrados',
        responses: {
          '200': {
            description: 'Lista de customers cadastrados',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/CustomerResponse' },
                },
              },
            },
          },
        },
      },
    },
    '/reports': {
      get: {
        tags: ['Reports'],
        summary: 'Retornar todos os relatórios consolidados de indicações',
        description:
          'Retorna a quantidade total de indicações realizadas por cada customer, atualizada de forma assíncrona pelo consumer do RabbitMQ.',
        responses: {
          '200': {
            description: 'Lista de relatórios de indicações',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ReportResponse' },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      CreateCustomerDto: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: {
            type: 'string',
            example: 'João Silva',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'joao@email.com',
          },
          parent_customer_id: {
            type: 'string',
            nullable: true,
            description: 'ObjectId do customer que realizou a indicação',
            example: '6851ab34d321c45678912345',
          },
        },
      },
      CustomerResponse: {
        type: 'object',
        properties: {
          customer_id: {
            type: 'string',
            example: '6851ab34d321c45678912345',
          },
          name: {
            type: 'string',
            example: 'João Silva',
          },
          email: {
            type: 'string',
            example: 'joao@email.com',
          },
          type: {
            type: 'string',
            enum: ['NORMAL'],
            example: 'NORMAL',
          },
          parent_customer_id: {
            type: 'string',
            nullable: true,
            example: null,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      ReportResponse: {
        type: 'object',
        properties: {
          customer_id: {
            type: 'string',
            example: '6851ab34d321c45678912345',
          },
          total_indications: {
            type: 'integer',
            example: 2,
          },
        },
      },
    },
  },
};

@Controller()
export class DocsController {
  @Get('docs-json')
  getOpenApiJson() {
    return OPENAPI_SPEC;
  }

  @Get('docs')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getSwaggerUi(): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Swagger UI - Indica e Conta API</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>body { margin: 0; background: #fafafa; }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/docs-json',
        dom_id: '#swagger-ui',
        deepLinking: true,
      });
    };
  </script>
</body>
</html>`;
  }
}