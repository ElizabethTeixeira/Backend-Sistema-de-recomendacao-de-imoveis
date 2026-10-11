import { Router } from 'express';
import { LIMITES, PAPEIS } from '../config/constantes.js';
import * as controlador from '../controladores/perfil.controlador.js';
import { autenticar, exigirPapel } from '../middlewares/autenticar.js';
import { corpoJson } from '../middlewares/corpoJson.js';
import { limitadorEscrita, limitadorTrocaDeCredenciais } from '../middlewares/limitadores.js';
import { validar } from '../middlewares/validar.js';
import { esquemaPerfilCliente, esquemaPerfilCorretor } from '../validadores/usuario.js';

const roteador = Router();

roteador.use(autenticar);

roteador.get('/', controlador.obter);

// O esquema depende do perfil de quem está logado (corretor tem CRECI e foto).
const validarPerfil = (req, res, next) =>
  validar({ corpo: req.usuario.papel === PAPEIS.CORRETOR ? esquemaPerfilCorretor : esquemaPerfilCliente })(req, res, next);

roteador.put(
  '/',
  exigirPapel(PAPEIS.CLIENTE, PAPEIS.CORRETOR),
  limitadorEscrita,
  limitadorTrocaDeCredenciais,
  corpoJson(LIMITES.corpoComFotoPerfil),
  validarPerfil,
  controlador.atualizar
);

export default roteador;
