import { Router } from 'express';
import { LIMITES, PAPEIS } from '../config/constantes.js';
import * as controladorConversa from '../controladores/conversa.controlador.js';
import * as controlador from '../controladores/imovel.controlador.js';
import { autenticar, exigirPapel } from '../middlewares/autenticar.js';
import { corpoJson } from '../middlewares/corpoJson.js';
import { limitadorEscrita, limitadorMensagens } from '../middlewares/limitadores.js';
import { validar } from '../middlewares/validar.js';
import { esquemaMensagem, parametrosImovelMensagemEsquema } from '../validadores/conversa.js';
import {
  consultaBuscaImoveisEsquema,
  consultaDetalheImovelEsquema,
  esquemaImovel,
  esquemaStatusImovel,
  parametrosImovelEsquema
} from '../validadores/imovel.js';

const roteador = Router();

roteador.use(autenticar);

// Busca com compatibilidade (tela do cliente)
roteador.get(
  '/',
  exigirPapel(PAPEIS.CLIENTE, PAPEIS.ADM),
  validar({ consulta: consultaBuscaImoveisEsquema }),
  controlador.buscar
);

// Imóveis do corretor logado (qualquer status). Declarada antes de "/:id".
roteador.get('/meus', exigirPapel(PAPEIS.CORRETOR), controlador.listarMeus);

// Detalhe: a regra de visibilidade por perfil está no serviço.
roteador.get(
  '/:id',
  validar({ parametros: parametrosImovelEsquema, consulta: consultaDetalheImovelEsquema }),
  controlador.obterDetalhe
);

roteador.post(
  '/',
  exigirPapel(PAPEIS.CORRETOR),
  limitadorEscrita,
  corpoJson(LIMITES.corpoComFotosImovel),
  validar({ corpo: esquemaImovel }),
  controlador.criar
);

roteador.put(
  '/:id',
  exigirPapel(PAPEIS.CORRETOR),
  limitadorEscrita,
  corpoJson(LIMITES.corpoComFotosImovel),
  validar({ parametros: parametrosImovelEsquema, corpo: esquemaImovel }),
  controlador.atualizar
);

roteador.patch(
  '/:id/status',
  exigirPapel(PAPEIS.CORRETOR),
  limitadorEscrita,
  corpoJson(),
  validar({ parametros: parametrosImovelEsquema, corpo: esquemaStatusImovel }),
  controlador.alterarStatus
);

roteador.delete(
  '/:id',
  exigirPapel(PAPEIS.CORRETOR, PAPEIS.ADM),
  limitadorEscrita,
  validar({ parametros: parametrosImovelEsquema }),
  controlador.excluir
);

// Cliente escreve ao corretor do imóvel
roteador.post(
  '/:id/mensagens',
  exigirPapel(PAPEIS.CLIENTE),
  limitadorMensagens,
  corpoJson(),
  validar({ parametros: parametrosImovelMensagemEsquema, corpo: esquemaMensagem }),
  controladorConversa.enviarSobreImovel
);

export default roteador;
