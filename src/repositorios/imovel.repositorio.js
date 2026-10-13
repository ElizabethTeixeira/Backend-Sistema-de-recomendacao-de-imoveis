import { banco } from '../banco/cliente.js';
import { STATUS_IMOVEL } from '../config/constantes.js';

/** Acesso às tabelas `imoveis` e `imovel_fotos`. */

// Tudo que o DTO precisa: só os ids das fotos (nunca os bytes) e os campos públicos do corretor.
const INCLUIR_DTO = {
  fotos: { select: { id: true }, orderBy: { ordem: 'asc' } },
  corretor: { select: { id: true, nome: true, telefone: true, creci: true, fotoAtualizadaEm: true } }
};

export const buscarPorId = (id) => banco.imovel.findUnique({ where: { id }, include: INCLUIR_DTO });

export const buscarStatusEDono = (id) =>
  banco.imovel.findUnique({ where: { id }, select: { id: true, corretorId: true, status: true } });

export const listarPorCorretor = (corretorId) =>
  banco.imovel.findMany({ where: { corretorId }, orderBy: { criadoEm: 'desc' }, include: INCLUIR_DTO });

export const contarPorCorretor = (corretorId) => banco.imovel.count({ where: { corretorId } });

export const contarTodos = () => banco.imovel.count();

/**
 * Candidatos da busca: ativos que passam nos filtros numéricos (resolvidos no banco).
 * O restante (bairro/palavras sem acento e a pontuação) é aplicado em memória por utilitarios/compatibilidade.js.
 */
export function listarAtivosCandidatos({ tipo, precoMin, precoMax, quartos, vagas }, limite) {
  const preco = {};
  if (precoMin != null) preco.gte = precoMin;
  if (precoMax != null) preco.lte = precoMax;

  return banco.imovel.findMany({
    where: {
      status: STATUS_IMOVEL.ATIVO,
      ...(tipo ? { tipo } : {}),
      ...(Object.keys(preco).length ? { preco } : {}),
      ...(quartos ? { quartos: { gte: quartos } } : {}),
      ...(vagas ? { vagas: { gte: vagas } } : {})
    },
    orderBy: { criadoEm: 'desc' },
    take: limite,
    include: INCLUIR_DTO
  });
}

export const listarIdsDasFotos = (imovelId) =>
  banco.imovelFoto.findMany({ where: { imovelId }, select: { id: true } }).then((fotos) => fotos.map((f) => f.id));

export const obterFoto = (id) =>
  banco.imovelFoto.findUnique({ where: { id }, select: { dados: true, tipoMime: true } });

/**
 * Cria ou atualiza o imóvel e sincroniza as fotos numa única transação (tudo ou nada).
 * `fotos` já vem validada: itens novos { nova: true, tipoMime, dados, tamanho } ou existentes { nova: false, id }.
 * Fotos do imóvel que não aparecem na lista são removidas; a posição na lista define a `ordem` (0 = capa).
 */
export function salvarComFotos({ id, corretorId, dados, fotos }) {
  return banco.$transaction(
    async (tx) => {
      let imovelId = id;

      if (id) {
        await tx.imovel.update({ where: { id }, data: dados });
        const idsMantidos = fotos.filter((foto) => !foto.nova).map((foto) => foto.id);
        await tx.imovelFoto.deleteMany({ where: { imovelId: id, id: { notIn: idsMantidos } } });
      } else {
        const criado = await tx.imovel.create({ data: { ...dados, corretorId }, select: { id: true } });
        imovelId = criado.id;
      }

      for (const [ordem, foto] of fotos.entries()) {
        if (foto.nova) {
          await tx.imovelFoto.create({
            data: { imovelId, ordem, tipoMime: foto.tipoMime, tamanho: foto.tamanho, dados: foto.dados }
          });
        } else {
          await tx.imovelFoto.updateMany({ where: { id: foto.id, imovelId }, data: { ordem } });
        }
      }

      return tx.imovel.findUniqueOrThrow({ where: { id: imovelId }, include: INCLUIR_DTO });
    },
    { timeout: 30_000, maxWait: 10_000 } // inserir até 10 fotos pode passar dos 5 s padrão
  );
}

export const atualizarStatus = (id, status) =>
  banco.imovel.update({ where: { id }, data: { status }, include: INCLUIR_DTO });

export const excluir = (id) => banco.imovel.delete({ where: { id } });
