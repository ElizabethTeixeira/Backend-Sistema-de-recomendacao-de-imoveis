export const agendarVisita = async (req, res) => {
const { usuarioId, imovelId, data, hora } = req.body;
if (!usuarioId || !imovelId || !data || !hora) {
return res.status(400).json({ mensagem: "Preencha todos os dados para agendar a
visita!" });
}
const novoAgendamento = {
id: Math.floor(Math.random() * 1000),
usuarioId,
imovelId,
data,
hora,
status: "Agendado"
};
return res.status(201).json({
mensagem: "Visita pré-agendada com sucesso!",
agendamento: novoAgendamento
});
};
