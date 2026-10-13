import { LIMITES, PREFIXO_API, TIPOS_IMOVEL } from '../config/constantes.js';

/** Especificação OpenAPI 3.0 servida pelo Swagger UI em /docs. */

const ref = (nome) => ({ $ref: `#/components/schemas/${nome}` });
const corpoJson = (esquema, exemplo) => ({
  required: true,
  content: { 'application/json': { schema: esquema, ...(exemplo ? { example: exemplo } : {}) } }
});
const resposta = (descricao, esquema) => ({
  description: descricao,
  ...(esquema ? { content: { 'application/json': { schema: esquema } } } : {})
});
const erro = (codigo) => ({ $ref: `#/components/responses/Erro${codigo}` });
const erros = (...codigos) => Object.fromEntries(codigos.map((c) => [String(c), erro(c)]));
const autenticado = [{ bearerAuth: [] }];

const parametroId = (descricao = 'Identificador') => ({
  name: 'id',
  in: 'path',
  required: true,
  description: descricao,
  schema: { type: 'integer', minimum: 1 }
});

const parametrosPaginacao = (limitePadrao, limiteMaximo) => [
  { name: 'pagina', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
  { name: 'limite', in: 'query', schema: { type: 'integer', minimum: 1, maximum: limiteMaximo, default: limitePadrao } }
];

const dataUrlImagem = (descricao) => ({
  type: 'string',
  description: `${descricao} Data URL base64 (image/jpeg, image/png ou image/webp), até ${(LIMITES.maxBytesPorFoto / 1048576).toFixed(1)} MB. O conteúdo real do arquivo é conferido.`,
  example: 'data:image/png;base64,iVBORw0KGgo...'
});

// ---- Esquemas ----

const camposPessoa = {
  nome: { type: 'string', minLength: 2, maxLength: 120, example: 'Mariana Alves' },
  telefone: { type: 'string', description: 'DDD + número, com ou sem máscara.', example: '(86) 99988-7766' },
  cpf: { type: 'string', description: 'CPF válido, com ou sem máscara.', example: '529.982.247-25' },
  dataNascimento: { type: 'string', format: 'date', example: '1996-07-22' },
  email: { type: 'string', format: 'email', example: 'mariana@email.com' }
};
const senhaNova = {
  type: 'string',
  minLength: LIMITES.senhaMinima,
  maxLength: 72,
  description: `Mínimo de ${LIMITES.senhaMinima} caracteres e no máximo ${LIMITES.senhaMaximaBytes} bytes.`
};
const campoCreci = { type: 'string', pattern: '^\\d{4,6}-[A-Z]{2}$', example: '123456-PI' };
const campoFotoPerfil = {
  type: 'string',
  nullable: true,
  description:
    'Foto do corretor. Data URL de imagem nova (JPEG/PNG/WebP) = troca; `null` = remove; omitido ou a própria URL devolvida pela API = mantém.',
  example: 'data:image/png;base64,iVBORw0KGgo...'
};

const esquemas = {
  Erro: {
    type: 'object',
    properties: {
      erro: {
        type: 'object',
        properties: {
          codigo: { type: 'string', example: 'REQUISICAO_INVALIDA' },
          mensagem: { type: 'string', example: 'Dados inválidos.' },
          detalhes: {
            type: 'array',
            items: {
              type: 'object',
              properties: { campo: { type: 'string', example: 'corpo.email' }, mensagem: { type: 'string' } }
            }
          },
          idRequisicao: { type: 'string', format: 'uuid' }
        }
      }
    }
  },
  Cliente: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      papel: { type: 'string', enum: ['cliente'] },
      ...camposPessoa,
      criadoEm: { type: 'string', format: 'date-time' }
    }
  },
  Corretor: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      papel: { type: 'string', enum: ['corretor'] },
      ...camposPessoa,
      creci: campoCreci,
      foto: { type: 'string', nullable: true, example: `${PREFIXO_API}/midia/corretores/3?v=1760000000000` },
      criadoEm: { type: 'string', format: 'date-time' }
    }
  },
  Admin: {
    type: 'object',
    properties: {
      id: { type: 'integer', nullable: true },
      papel: { type: 'string', enum: ['adm'] },
      nome: { type: 'string', example: 'Administrador' },
      email: { type: 'string', format: 'email' }
    }
  },
  CorretorPublico: {
    type: 'object',
    description: 'Dados de vitrine exibidos ao cliente (sem CPF, e-mail ou nascimento).',
    properties: {
      id: { type: 'integer' },
      nome: { type: 'string' },
      telefone: { type: 'string' },
      creci: campoCreci,
      foto: { type: 'string', nullable: true }
    }
  },
  Sessao: {
    type: 'object',
    properties: {
      token: { type: 'string', description: 'Envie em `Authorization: Bearer <token>`.' },
      tipo: { type: 'string', example: 'Bearer' },
      expiraEm: { type: 'string', format: 'date-time' },
      usuario: { oneOf: [ref('Cliente'), ref('Corretor'), ref('Admin')] }
    }
  },
  CadastroCliente: {
    type: 'object',
    required: ['nome', 'telefone', 'cpf', 'dataNascimento', 'email', 'senha'],
    additionalProperties: false,
    properties: { ...camposPessoa, senha: senhaNova }
  },
  CadastroCorretor: {
    type: 'object',
    required: ['nome', 'telefone', 'cpf', 'dataNascimento', 'email', 'creci', 'senha'],
    additionalProperties: false,
    properties: { ...camposPessoa, creci: campoCreci, foto: campoFotoPerfil, senha: senhaNova }
  },
  Entrar: {
    type: 'object',
    required: ['papel', 'email', 'senha'],
    additionalProperties: false,
    properties: {
      papel: { type: 'string', enum: ['cliente', 'corretor', 'adm'], description: 'Tela de login usada. Perfil diferente do da conta = credenciais inválidas.' },
      email: { type: 'string' },
      senha: { type: 'string' }
    }
  },
  PerfilCliente: {
    type: 'object',
    required: ['nome', 'telefone', 'cpf', 'dataNascimento', 'email'],
    additionalProperties: false,
    properties: {
      ...camposPessoa,
      senhaAtual: { type: 'string', description: 'Obrigatória para alterar o e-mail ou a senha.' },
      novaSenha: senhaNova
    }
  },
  PerfilCorretor: {
    type: 'object',
    required: ['nome', 'telefone', 'cpf', 'dataNascimento', 'email', 'creci'],
    additionalProperties: false,
    properties: {
      ...camposPessoa,
      creci: campoCreci,
      foto: campoFotoPerfil,
      senhaAtual: { type: 'string', description: 'Obrigatória para alterar o e-mail ou a senha.' },
      novaSenha: senhaNova
    }
  },
  AtualizacaoDePerfil: {
    type: 'object',
    description: 'Quando `novaSenha` é enviada, a resposta traz uma sessão nova (`token`), pois os tokens antigos são invalidados.',
    properties: {
      usuario: { oneOf: [ref('Cliente'), ref('Corretor')] },
      token: { type: 'string' },
      tipo: { type: 'string' },
      expiraEm: { type: 'string', format: 'date-time' }
    }
  },
  Imovel: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      corretorId: { type: 'integer' },
      tipo: { type: 'string', enum: [...TIPOS_IMOVEL] },
      bairro: { type: 'string', example: 'Centro' },
      preco: { type: 'integer', example: 350000 },
      quartos: { type: 'integer' },
      vagas: { type: 'integer' },
      areaM2: { type: 'number', example: 65 },
      status: { type: 'string', enum: ['ativo', 'inativo'] },
      caracteristicas: { type: 'array', items: { type: 'string' }, example: ['Piscina', 'Portaria 24h'] },
      fotos: {
        type: 'array',
        description: 'URLs relativas à raiz do servidor da API; a primeira é a capa.',
        items: { type: 'string', example: `${PREFIXO_API}/midia/imoveis/3f2b8c1e-9d4a-4e6b-8a1f-2c7d5e9b0a11` }
      },
      corretor: { allOf: [ref('CorretorPublico')], nullable: true },
      compatibilidade: {
        type: 'integer',
        nullable: true,
        minimum: 0,
        maximum: 100,
        description: '% de critérios atendidos. `null` se nenhum critério de busca foi informado.'
      },
      criadoEm: { type: 'string', format: 'date-time' },
      atualizadoEm: { type: 'string', format: 'date-time' }
    }
  },
  ImovelEntrada: {
    type: 'object',
    required: ['tipo', 'bairro', 'preco', 'areaM2', 'quartos', 'vagas', 'fotos'],
    additionalProperties: false,
    properties: {
      tipo: { type: 'string', enum: [...TIPOS_IMOVEL] },
      bairro: { type: 'string', minLength: 2, maxLength: 80 },
      preco: { type: 'integer', minimum: 1, maximum: 1_000_000_000, description: 'Em reais inteiros.' },
      areaM2: { type: 'number', exclusiveMinimum: 0 },
      quartos: { type: 'integer', minimum: 0, maximum: 50 },
      vagas: { type: 'integer', minimum: 0, maximum: 50 },
      status: { type: 'string', enum: ['ativo', 'inativo'], description: 'Padrão `ativo` na criação; omitido na edição mantém o atual.' },
      caracteristicas: { type: 'array', maxItems: LIMITES.maxCaracteristicas, items: { type: 'string', maxLength: LIMITES.maxCaracteresCaracteristica } },
      fotos: {
        type: 'array',
        minItems: 1,
        maxItems: LIMITES.maxFotosPorImovel,
        description:
          'Lista ordenada (a primeira é a capa). Cada item é uma data URL de imagem NOVA ou a URL de uma foto que o imóvel já tem (mantida). Fotos que não aparecem na lista são removidas.',
        items: { type: 'string', description: dataUrlImagem('').description }
      }
    }
  },
  ImovelPagina: {
    type: 'object',
    properties: {
      itens: { type: 'array', items: ref('Imovel') },
      total: { type: 'integer' },
      pagina: { type: 'integer' },
      limite: { type: 'integer' },
      totalPaginas: { type: 'integer' }
    }
  },
  StatusEntrada: {
    type: 'object',
    required: ['status'],
    additionalProperties: false,
    properties: { status: { type: 'string', enum: ['ativo', 'inativo'] } }
  },
  MensagemEntrada: {
    type: 'object',
    required: ['texto'],
    additionalProperties: false,
    properties: { texto: { type: 'string', minLength: 1, maxLength: LIMITES.maxCaracteresMensagem } }
  },
  Mensagem: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      texto: { type: 'string' },
      remetente: { type: 'string', enum: ['cliente', 'corretor'] },
      data: { type: 'string', format: 'date-time' },
      lida: { type: 'boolean', description: 'Vale para o destinatário.' }
    }
  },
  Conversa: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      imovel: {
        nullable: true,
        description: '`null` quando o imóvel foi excluído (o histórico permanece).',
        type: 'object',
        properties: {
          id: { type: 'integer' },
          tipo: { type: 'string' },
          bairro: { type: 'string' },
          capa: { type: 'string', nullable: true }
        }
      },
      interlocutor: {
        type: 'object',
        description: 'A outra ponta da conversa (para o cliente, o corretor; para o corretor, o cliente).',
        properties: { id: { type: 'integer' }, nome: { type: 'string' } }
      },
      mensagens: { type: 'array', description: `Últimas ${LIMITES.maxMensagensPorConversa}, em ordem cronológica.`, items: ref('Mensagem') },
      naoLidas: { type: 'integer' },
      atualizadaEm: { type: 'string', format: 'date-time' }
    }
  },
  ConversaPagina: {
    type: 'object',
    properties: {
      itens: { type: 'array', items: ref('Conversa') },
      total: { type: 'integer' },
      pagina: { type: 'integer' },
      limite: { type: 'integer' },
      totalPaginas: { type: 'integer' }
    }
  },
  ClientePagina: {
    type: 'object',
    properties: {
      itens: { type: 'array', items: ref('Cliente') },
      total: { type: 'integer' },
      pagina: { type: 'integer' },
      limite: { type: 'integer' },
      totalPaginas: { type: 'integer' }
    }
  },
  CorretorPagina: {
    type: 'object',
    properties: {
      itens: { type: 'array', items: ref('Corretor') },
      total: { type: 'integer' },
      pagina: { type: 'integer' },
      limite: { type: 'integer' },
      totalPaginas: { type: 'integer' }
    }
  },
  AdminCriarCliente: {
    type: 'object',
    required: ['nome', 'telefone', 'cpf', 'dataNascimento', 'email', 'senha'],
    additionalProperties: false,
    properties: { ...camposPessoa, senha: senhaNova }
  },
  AdminAtualizarCliente: {
    type: 'object',
    required: ['nome', 'telefone', 'cpf', 'dataNascimento', 'email'],
    additionalProperties: false,
    properties: { ...camposPessoa, senha: { ...senhaNova, description: 'Opcional: em branco mantém a senha atual. Se enviada, derruba as sessões do usuário.' } }
  },
  AdminCriarCorretor: {
    type: 'object',
    required: ['nome', 'telefone', 'cpf', 'dataNascimento', 'email', 'creci', 'senha'],
    additionalProperties: false,
    properties: { ...camposPessoa, creci: campoCreci, foto: campoFotoPerfil, senha: senhaNova }
  },
  AdminAtualizarCorretor: {
    type: 'object',
    required: ['nome', 'telefone', 'cpf', 'dataNascimento', 'email', 'creci'],
    additionalProperties: false,
    properties: {
      ...camposPessoa,
      creci: campoCreci,
      foto: campoFotoPerfil,
      senha: { ...senhaNova, description: 'Opcional: em branco mantém a senha atual. Se enviada, derruba as sessões do usuário.' }
    }
  }
};

// ---- Caminhos ----

/** Gera listar/obter/criar/atualizar/excluir do administrador para clientes ou corretores. */
function crudAdmin({ caminho, tag, singular, plural, esquema, esquemaPagina, esquemaCriar, esquemaAtualizar }) {
  return {
    [`/admin/${caminho}`]: {
      get: {
        tags: [tag],
        summary: `Lista ${plural}`,
        security: autenticado,
        parameters: [
          { name: 'busca', in: 'query', description: 'Busca por nome ou e-mail.', schema: { type: 'string', maxLength: 100 } },
          ...parametrosPaginacao(20, 100)
        ],
        responses: { 200: resposta('Página de resultados', ref(esquemaPagina)), ...erros(400, 401, 403) }
      },
      post: {
        tags: [tag],
        summary: `Cadastra ${singular}`,
        security: autenticado,
        requestBody: corpoJson(ref(esquemaCriar)),
        responses: { 201: resposta('Criado', ref(esquema)), ...erros(400, 401, 403, 409, 413, 429) }
      }
    },
    [`/admin/${caminho}/{id}`]: {
      get: {
        tags: [tag],
        summary: `Obtém ${singular}`,
        security: autenticado,
        parameters: [parametroId()],
        responses: { 200: resposta('Encontrado', ref(esquema)), ...erros(400, 401, 403, 404) }
      },
      put: {
        tags: [tag],
        summary: `Atualiza ${singular}`,
        security: autenticado,
        parameters: [parametroId()],
        requestBody: corpoJson(ref(esquemaAtualizar)),
        responses: { 200: resposta('Atualizado', ref(esquema)), ...erros(400, 401, 403, 404, 409, 413, 429) }
      },
      delete: {
        tags: [tag],
        summary: `Exclui ${singular}`,
        description: 'Remove também os imóveis, fotos e conversas ligados à conta.',
        security: autenticado,
        parameters: [parametroId()],
        responses: { 204: resposta('Excluído'), ...erros(400, 401, 403, 404, 429) }
      }
    }
  };
}

const filtrosBusca = [
  { name: 'busca', in: 'query', description: 'Palavras livres (tipo, bairro, características).', schema: { type: 'string', maxLength: 100 } },
  { name: 'tipo', in: 'query', schema: { type: 'string', enum: [...TIPOS_IMOVEL] } },
  { name: 'bairro', in: 'query', schema: { type: 'string', maxLength: 80 } },
  { name: 'precoMin', in: 'query', schema: { type: 'number', minimum: 0 } },
  { name: 'precoMax', in: 'query', schema: { type: 'number', minimum: 0 } },
  { name: 'quartos', in: 'query', description: 'Mínimo de quartos.', schema: { type: 'integer', minimum: 0 } },
  { name: 'vagas', in: 'query', description: 'Mínimo de vagas.', schema: { type: 'integer', minimum: 0 } }
];

const caminhos = {
  '/saude': {
    get: {
      tags: ['Sistema'],
      summary: 'Verifica se a API e o banco estão no ar',
      responses: { 200: resposta('OK', { type: 'object', properties: { status: { type: 'string', example: 'ok' } } }), 503: erro(503) }
    }
  },

  '/autenticacao/cadastro/cliente': {
    post: {
      tags: ['Autenticação'],
      summary: 'Cadastro de cliente',
      description: 'Cria a conta e já devolve a sessão (o front entra direto no dashboard).',
      requestBody: corpoJson(ref('CadastroCliente')),
      responses: { 201: resposta('Conta criada', ref('Sessao')), ...erros(400, 409, 413, 429) }
    }
  },
  '/autenticacao/cadastro/corretor': {
    post: {
      tags: ['Autenticação'],
      summary: 'Cadastro de corretor',
      requestBody: corpoJson(ref('CadastroCorretor')),
      responses: { 201: resposta('Conta criada', ref('Sessao')), ...erros(400, 409, 413, 429) }
    }
  },
  '/autenticacao/entrar': {
    post: {
      tags: ['Autenticação'],
      summary: 'Login (cliente, corretor ou administrador)',
      description:
        'O administrador é definido por `ADMIN_EMAIL`/`ADMIN_PASSWORD` no servidor. Falhas repetidas bloqueiam temporariamente (429).',
      requestBody: corpoJson(ref('Entrar'), { papel: 'cliente', email: 'cliente@email.com', senha: 'sua-senha' }),
      responses: { 200: resposta('Autenticado', ref('Sessao')), ...erros(400, 401, 429) }
    }
  },
  '/autenticacao/sair': {
    post: {
      tags: ['Autenticação'],
      summary: 'Encerra TODAS as sessões do usuário',
      description: 'Invalida todos os tokens já emitidos para a conta (o do administrador expira sozinho em 2 h).',
      security: autenticado,
      responses: { 204: resposta('Sessões encerradas'), ...erros(401) }
    }
  },

  '/perfil': {
    get: {
      tags: ['Perfil'],
      summary: 'Dados do usuário logado',
      security: autenticado,
      responses: { 200: resposta('Perfil', { oneOf: [ref('Cliente'), ref('Corretor'), ref('Admin')] }), ...erros(401) }
    },
    put: {
      tags: ['Perfil'],
      summary: 'Atualiza o próprio perfil (cliente ou corretor)',
      description:
        'Alterar o **e-mail** ou a **senha** exige `senhaAtual`. O administrador não edita o perfil por aqui (as credenciais ficam no .env).',
      security: autenticado,
      requestBody: corpoJson({ oneOf: [ref('PerfilCliente'), ref('PerfilCorretor')] }),
      responses: { 200: resposta('Atualizado', ref('AtualizacaoDePerfil')), ...erros(400, 401, 403, 409, 413, 429) }
    }
  },

  '/imoveis': {
    get: {
      tags: ['Imóveis'],
      summary: 'Busca imóveis ativos com % de compatibilidade (cliente)',
      description:
        'Filtros estruturados são eliminatórios; as palavras da busca livre só eliminam se nenhuma casar. Ordenado do mais para o menos compatível.',
      security: autenticado,
      parameters: [...filtrosBusca, ...parametrosPaginacao(12, 50)],
      responses: { 200: resposta('Página de imóveis', ref('ImovelPagina')), ...erros(400, 401, 403) }
    },
    post: {
      tags: ['Imóveis'],
      summary: 'Cadastra imóvel (corretor)',
      security: autenticado,
      requestBody: corpoJson(ref('ImovelEntrada')),
      responses: { 201: resposta('Criado', ref('Imovel')), ...erros(400, 401, 403, 413, 429) }
    }
  },
  '/imoveis/meus': {
    get: {
      tags: ['Imóveis'],
      summary: 'Imóveis do corretor logado (ativos e inativos)',
      security: autenticado,
      responses: {
        200: resposta('Lista', { type: 'object', properties: { itens: { type: 'array', items: ref('Imovel') }, total: { type: 'integer' } } }),
        ...erros(401, 403)
      }
    }
  },
  '/imoveis/{id}': {
    get: {
      tags: ['Imóveis'],
      summary: 'Detalhe do imóvel',
      description: 'Cliente: só ativos. Corretor: só os próprios. Admin: todos. Fora disso, 404. Aceita os mesmos filtros da busca para calcular `compatibilidade`.',
      security: autenticado,
      parameters: [parametroId('Id do imóvel'), ...filtrosBusca],
      responses: { 200: resposta('Imóvel', ref('Imovel')), ...erros(400, 401, 404) }
    },
    put: {
      tags: ['Imóveis'],
      summary: 'Atualiza imóvel (corretor dono)',
      security: autenticado,
      parameters: [parametroId('Id do imóvel')],
      requestBody: corpoJson(ref('ImovelEntrada')),
      responses: { 200: resposta('Atualizado', ref('Imovel')), ...erros(400, 401, 403, 404, 413, 429) }
    },
    delete: {
      tags: ['Imóveis'],
      summary: 'Exclui imóvel (corretor dono ou administrador)',
      security: autenticado,
      parameters: [parametroId('Id do imóvel')],
      responses: { 204: resposta('Excluído'), ...erros(400, 401, 403, 404, 429) }
    }
  },
  '/imoveis/{id}/status': {
    patch: {
      tags: ['Imóveis'],
      summary: 'Ativa ou desativa o imóvel (corretor dono)',
      security: autenticado,
      parameters: [parametroId('Id do imóvel')],
      requestBody: corpoJson(ref('StatusEntrada')),
      responses: { 200: resposta('Atualizado', ref('Imovel')), ...erros(400, 401, 403, 404, 429) }
    }
  },
  '/imoveis/{id}/mensagens': {
    post: {
      tags: ['Conversas'],
      summary: 'Cliente escreve ao corretor sobre um imóvel',
      description: 'Abre a conversa (se for a primeira mensagem) ou continua a existente. Só imóveis ativos.',
      security: autenticado,
      parameters: [parametroId('Id do imóvel')],
      requestBody: corpoJson(ref('MensagemEntrada')),
      responses: { 201: resposta('Conversa atualizada', ref('Conversa')), ...erros(400, 401, 403, 404, 429) }
    }
  },

  '/conversas': {
    get: {
      tags: ['Conversas'],
      summary: 'Minhas conversas (cliente ou corretor), da mais recente à mais antiga',
      security: autenticado,
      parameters: parametrosPaginacao(20, 50),
      responses: { 200: resposta('Página de conversas', ref('ConversaPagina')), ...erros(400, 401, 403) }
    }
  },
  '/conversas/nao-lidas': {
    get: {
      tags: ['Conversas'],
      summary: 'Quantidade de mensagens não lidas (número do sininho)',
      security: autenticado,
      responses: { 200: resposta('Total', { type: 'object', properties: { total: { type: 'integer' } } }), ...erros(401, 403) }
    }
  },
  '/conversas/lidas': {
    post: {
      tags: ['Conversas'],
      summary: 'Marca todas as mensagens recebidas como lidas',
      security: autenticado,
      responses: { 200: resposta('Quantidade marcada', { type: 'object', properties: { marcadas: { type: 'integer' } } }), ...erros(401, 403) }
    }
  },
  '/conversas/{id}/mensagens': {
    post: {
      tags: ['Conversas'],
      summary: 'Responde em uma conversa existente',
      security: autenticado,
      parameters: [parametroId('Id da conversa')],
      requestBody: corpoJson(ref('MensagemEntrada')),
      responses: { 201: resposta('Conversa atualizada', ref('Conversa')), ...erros(400, 401, 403, 404, 429) }
    }
  },
  '/conversas/{id}/lidas': {
    post: {
      tags: ['Conversas'],
      summary: 'Marca como lidas as mensagens recebidas de uma conversa',
      security: autenticado,
      parameters: [parametroId('Id da conversa')],
      responses: { 200: resposta('Quantidade marcada', { type: 'object', properties: { marcadas: { type: 'integer' } } }), ...erros(400, 401, 403, 404) }
    }
  },

  '/midia/imoveis/{id}': {
    get: {
      tags: ['Mídia'],
      summary: 'Foto de um imóvel (pública)',
      description: 'Pública porque o `<img>` não envia Authorization. O id é um UUID aleatório.',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Imagem', content: { 'image/jpeg': {}, 'image/png': {}, 'image/webp': {} } },
        ...erros(400, 404)
      }
    }
  },
  '/midia/corretores/{id}': {
    get: {
      tags: ['Mídia'],
      summary: 'Foto de perfil de um corretor (pública)',
      parameters: [parametroId('Id do corretor')],
      responses: {
        200: { description: 'Imagem', content: { 'image/jpeg': {}, 'image/png': {}, 'image/webp': {} } },
        ...erros(400, 404)
      }
    }
  },

  '/admin/resumo': {
    get: {
      tags: ['Administração'],
      summary: 'Totais do dashboard',
      security: autenticado,
      responses: {
        200: resposta('Totais', {
          type: 'object',
          properties: { totalClientes: { type: 'integer' }, totalCorretores: { type: 'integer' }, totalImoveis: { type: 'integer' } }
        }),
        ...erros(401, 403)
      }
    }
  },
  ...crudAdmin({
    caminho: 'clientes',
    tag: 'Administração',
    singular: 'cliente',
    plural: 'clientes',
    esquema: 'Cliente',
    esquemaPagina: 'ClientePagina',
    esquemaCriar: 'AdminCriarCliente',
    esquemaAtualizar: 'AdminAtualizarCliente'
  }),
  ...crudAdmin({
    caminho: 'corretores',
    tag: 'Administração',
    singular: 'corretor',
    plural: 'corretores',
    esquema: 'Corretor',
    esquemaPagina: 'CorretorPagina',
    esquemaCriar: 'AdminCriarCorretor',
    esquemaAtualizar: 'AdminAtualizarCorretor'
  })
};

const respostasDeErro = Object.fromEntries(
  Object.entries({
    400: 'Dados inválidos ou JSON malformado',
    401: 'Não autenticado, token inválido/expirado ou credenciais incorretas',
    403: 'Sem permissão para este recurso',
    404: 'Não encontrado',
    409: 'Conflito (e-mail, CPF ou CRECI já cadastrados)',
    413: 'Corpo da requisição grande demais',
    429: 'Muitas requisições (limite de taxa)',
    503: 'Banco de dados indisponível'
  }).map(([codigo, descricao]) => [`Erro${codigo}`, resposta(descricao, ref('Erro'))])
);

export const especificacaoOpenApi = {
  openapi: '3.0.3',
  info: {
    title: 'API · Sistema de Recomendação de Imóveis',
    version: '1.0.0',
    description:
      'Backend do sistema de recomendação de imóveis. Autenticação por **JWT Bearer**: faça login em `/autenticacao/entrar`, copie o `token` e clique em **Authorize**.\n\n' +
      'Perfis: `cliente` (busca e conversa), `corretor` (gerencia imóveis e responde) e `adm` (gerencia contas; credenciais no .env do servidor).'
  },
  servers: [{ url: PREFIXO_API, description: 'API v1' }],
  tags: [
    { name: 'Sistema' },
    { name: 'Autenticação' },
    { name: 'Perfil' },
    { name: 'Imóveis' },
    { name: 'Conversas' },
    { name: 'Mídia' },
    { name: 'Administração' }
  ],
  paths: caminhos,
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: esquemas,
    responses: respostasDeErro
  }
};
