import { Request, Response } from 'express';
export const listarRelatorioFavoritos = async (req: Request, res: Response) => {
const listaFavoritos = [
{ id: 101, titulo: "Casa Duplex na Zona Leste", preco: "R$ 450.000" },
{ id: 104, titulo: "Apartamento Mobiliado no Centro", preco: "R$ 280.000" }
];
return res.json({
totalFavoritos: listaFavoritos.length,
imoveis: listaFavoritos
});
};
