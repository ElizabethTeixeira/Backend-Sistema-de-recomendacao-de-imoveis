import bcrypt from 'bcrypt';
export const cadastrarUsuario = async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ mensagem: "Nome, e-mail e senha são 
obrigatórios!" });
  }
  // Transforma a senha digitada em um hash seguro embaralhado antes de 
salvar
  const saltRounds = 10;
  const senhaCriptografada = await bcrypt.hash(senha, saltRounds);
  return res.status(201).json({
    mensagem: "Usuário cadastrado com total segurança!",
    usuario: {
      nome,
      email,
      senhaProtegida: senhaCriptografada
    }
  });
};
