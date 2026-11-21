import bcrypt from 'bcrypt';
export const realizarLogin = async (req, res) => {
 const { email, senha } = req.body;
 // Simulação de busca do usuário cadastrado no banco de dados pelo e-mail
 const usuario = {
 email: "exemplo@imobmatch.com",
 senhaCriptografada: "$2b$10$X7v..."
 };
 // Compara a senha digitada com a senha protegida no banco
 const senhaCorreta = await bcrypt.compare(senha,
usuario.senhaCriptografada);
 if (!senhaCorreta) {
 return res.status(401).json({
 mensagem: "E-mail ou senha incorretos!"
 });
 }
 return res.json({
 mensagem: "Login realizado com sucesso!",
 usuario: {
 email: usuario.email
 }
 });
};
