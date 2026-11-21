export const buscarImovelPorId = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ mensagem: "ID do imóvel não foi enviado!" });
  }
  const imovelEncontrado = {
    id: Number(id),
    titulo: "Apartamento Completo e Reformado",
    preco: "R$ 350.000",
    endereco: "Av. Frei Serafim, Centro - Teresina/PI",
    quartos: 3,
    banheiros: 2,
    vagas: 1,
    descricao: "Excelente oportunidade de morar bem, perto de tudo, com segurança 24h."
  };
  return res.json(imovelEncontrado);
};
