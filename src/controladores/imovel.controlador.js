import { Request, Response } from 'express';

export const favoritarImovel = async (req: Request, res: Response) => {
  const { usuarioId, imovelId } = req.body;

  // Simulação de salvamento no banco de dados da ligação de favoritos
  console.log(`Imóvel ${imovelId} favoritado pelo usuário ${usuarioId}`);

  return res.status(201).json({
    mensagem: "Imóvel favoritado com sucesso!",
    dados: { usuarioId, imovelId }
  });
};
