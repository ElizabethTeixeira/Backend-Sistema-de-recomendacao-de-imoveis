import { Request, Response } from 'express';
export const buscarImovelPorId = async (req: Request, res: Response) => {
const { id } = req.params;
const imovelEncontrado = {
id: Number(id),
titulo: "Apartamento Completo e Reformado",
preco: "R$ 350.000",
endereco: "Av. Frei Serafim, Centro - Teresina/PI",
quartos: 3,
banheiros: 2,
vagas: 1,
descricao: "Excelente oportunidade de morar bem, perto de tudo, com segurança 24h e };
if (!id) {
return res.status(400).json({ mensagem: "ID do imóvel não foi enviado!" });
}
return res.json(imovelEncontrado);
};
