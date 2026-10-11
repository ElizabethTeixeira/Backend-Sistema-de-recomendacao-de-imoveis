import { Router } from 'express';
import { LIMITES, PAPEIS } from '../config/constantes.js';
import * as controladorAdmin from '../controladores/admin.controlador.js';
import { autenticar, exigirPapel } from '../middlewares/autenticar.js';
import { corpoJson } from '../middlewares/corpoJson.js';
import { limitadorEscrita } from '../middlewares/limitadores.js';
import { validar } from '../middlewares/validar.js';
import {
  consultaListagemAdminEsquema,
  esquemaAdminAtualizarCliente,
  esquemaAdminAtualizarCorretor,
  esquemaAdminCriarCliente,
  esquemaAdminCriarCorretor,
  parametrosIdEsquema
} from '../validadores/usuario.js';

const roteador = Router();

roteador.use(autenticar, exigirPapel(PAPEIS.ADM));

roteador.get('/resumo', controladorAdmin.resumo);

/** Registra listar/obter/criar/atualizar/excluir para um papel. */
function registrarCrud({ caminho, papel, esquemaCriar, esquemaAtualizar, limiteCorpo }) {
  const controlador = controladorAdmin.criarControladorDeUsuarios(papel);

  roteador.get(caminho, validar({ consulta: consultaListagemAdminEsquema }), controlador.listar);
  roteador.get(`${caminho}/:id`, validar({ parametros: parametrosIdEsquema }), controlador.obter);
  roteador.post(caminho, limitadorEscrita, corpoJson(limiteCorpo), validar({ corpo: esquemaCriar }), controlador.criar);
  roteador.put(
    `${caminho}/:id`,
    limitadorEscrita,
    corpoJson(limiteCorpo),
    validar({ parametros: parametrosIdEsquema, corpo: esquemaAtualizar }),
    controlador.atualizar
  );
  roteador.delete(`${caminho}/:id`, limitadorEscrita, validar({ parametros: parametrosIdEsquema }), controlador.excluir);
}

registrarCrud({
  caminho: '/clientes',
  papel: PAPEIS.CLIENTE,
  esquemaCriar: esquemaAdminCriarCliente,
  esquemaAtualizar: esquemaAdminAtualizarCliente,
  limiteCorpo: LIMITES.corpoPadrao
});

registrarCrud({
  caminho: '/corretores',
  papel: PAPEIS.CORRETOR,
  esquemaCriar: esquemaAdminCriarCorretor,
  esquemaAtualizar: esquemaAdminAtualizarCorretor,
  limiteCorpo: LIMITES.corpoComFotoPerfil
});

export default roteador;
