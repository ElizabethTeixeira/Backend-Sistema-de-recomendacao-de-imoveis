import { Router } from 'express';
import { PAPEIS } from '../config/constantes.js';
import * as controlador from '../controladores/conversa.controlador.js';
import { autenticar, exigirPapel } from '../middlewares/autenticar.js';
import { corpoJson } from '../middlewares/corpoJson.js';
import { limitadorMensagens } from '../middlewares/limitadores.js';
import { validar } from '../middlewares/validar.js';
import { consultaConversasEsquema, esquemaMensagem, parametrosConversaEsquema } from '../validadores/conversa.js';

const roteador = Router();

roteador.use(autenticar, exigirPapel(PAPEIS.CLIENTE, PAPEIS.CORRETOR));

roteador.get('/', validar({ consulta: consultaConversasEsquema }), controlador.listar);
roteador.get('/nao-lidas', controlador.contarNaoLidas); // número do sininho
roteador.post('/lidas', controlador.marcarTodasComoLidas);

roteador.post(
  '/:id/mensagens',
  limitadorMensagens,
  corpoJson(),
  validar({ parametros: parametrosConversaEsquema, corpo: esquemaMensagem }),
  controlador.responder
);

roteador.post('/:id/lidas', validar({ parametros: parametrosConversaEsquema }), controlador.marcarComoLidas);

export default roteador;
