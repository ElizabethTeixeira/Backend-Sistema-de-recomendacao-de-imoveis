import { Router } from 'express';
import { cadastrarUsuario } from '../controladores/usuarioControlador.js';
import { realizarLogin } from '../controladores/loginControlador.js';
import { alternarFavorito } from '../controladores/favoritoControlador.js';
import { agendarVisita } from '../controladores/visitaControlador.js';
import { buscarImovelPorId } from '../controladores/imovelDetalhadoControlador.js';
import { listarRelatorioFavoritos } from '../controladores/
relatorioFavoritosControlador.js';
const router = Router();
router.post('/usuarios/cadastro', cadastrarUsuario);
router.post('/usuarios/login', realizarLogin);
router.post('/favoritos/alternar', alternarFavorito);
router.get('/favoritos/relatorio', listarRelatorioFavoritos);
router.post('/visitas/agendar', agendarVisita);
router.get('/imoveis/:id', buscarImovelPorId);
export default router;
