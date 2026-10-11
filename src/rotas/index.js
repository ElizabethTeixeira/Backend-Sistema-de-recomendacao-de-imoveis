import { Router } from 'express';
import { verificarSaude } from '../controladores/saude.controlador.js';
import rotasAdmin from './admin.rotas.js';
import rotasAutenticacao from './autenticacao.rotas.js';
import rotasConversas from './conversas.rotas.js';
import rotasImoveis from './imoveis.rotas.js';
import rotasMidia from './midia.rotas.js';
import rotasPerfil from './perfil.rotas.js';

const roteador = Router();

// Respostas da API não devem ser guardadas em cache (têm dados do usuário). A mídia sobrescreve isto.
roteador.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

roteador.get('/saude', verificarSaude);
roteador.use('/autenticacao', rotasAutenticacao);
roteador.use('/perfil', rotasPerfil);
roteador.use('/imoveis', rotasImoveis);
roteador.use('/conversas', rotasConversas);
roteador.use('/midia', rotasMidia);
roteador.use('/admin', rotasAdmin);

export default roteador;
