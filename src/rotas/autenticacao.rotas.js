import { Router } from 'express';
import { LIMITES } from '../config/constantes.js';
import * as controlador from '../controladores/autenticacao.controlador.js';
import { autenticar } from '../middlewares/autenticar.js';
import { corpoJson } from '../middlewares/corpoJson.js';
import { limitadorCadastro, limitadorLoginPorEmail, limitadorLoginPorIp } from '../middlewares/limitadores.js';
import { validar } from '../middlewares/validar.js';
import { esquemaCadastroCliente, esquemaCadastroCorretor, esquemaEntrar } from '../validadores/autenticacao.js';

const roteador = Router();

roteador.post(
  '/cadastro/cliente',
  limitadorCadastro,
  corpoJson(),
  validar({ corpo: esquemaCadastroCliente }),
  controlador.cadastrarCliente
);

roteador.post(
  '/cadastro/corretor',
  limitadorCadastro,
  corpoJson(LIMITES.corpoComFotoPerfil),
  validar({ corpo: esquemaCadastroCorretor }),
  controlador.cadastrarCorretor
);

// Ordem importa: limite por IP → ler corpo → validar → limite por conta → autenticar.
roteador.post(
  '/entrar',
  limitadorLoginPorIp,
  corpoJson(),
  validar({ corpo: esquemaEntrar }),
  limitadorLoginPorEmail,
  controlador.entrar
);

roteador.post('/sair', autenticar, controlador.sair);

export default roteador;
