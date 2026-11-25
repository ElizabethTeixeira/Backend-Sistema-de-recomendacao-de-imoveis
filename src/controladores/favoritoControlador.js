export const alternarFavorito = async (req, res) => {
const { usuarioId, imovelId } = req.body;
if (!usuarioId || !imovelId) {
return res.status(400).json({ mensagem: "Usuário e Imóvel são
obrigatórios!" });
}
return res.status(200).json({
mensagem: "Status de favorito atualizado com sucesso!",
favorito: { usuarioId, imovelId, ativo: true }
});
};
