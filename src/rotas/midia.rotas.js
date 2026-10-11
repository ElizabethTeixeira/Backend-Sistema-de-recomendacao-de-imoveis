import { Router } from 'express';
import * as controlador from '../controladores/midia.controlador.js';
import { validar } from '../middlewares/validar.js';
import { parametrosFotoEsquema } from '../validadores/imovel.js';
import { parametrosIdEsquema } from '../validadores/usuario.js';

/**
 * Imagens são públicas de propósito: o <img src> do navegador não consegue enviar o cabeçalho Authorization.
 * A proteção é a URL: fotos de imóveis usam UUID aleatório (não adivinhável). Só trafegam imagens
 * de vitrine; nenhum dado pessoal passa por aqui.
 */
const roteador = Router();

roteador.get('/imoveis/:id', validar({ parametros: parametrosFotoEsquema }), controlador.fotoDoImovel);
roteador.get('/corretores/:id', validar({ parametros: parametrosIdEsquema }), controlador.fotoDoCorretor);

export default roteador;
