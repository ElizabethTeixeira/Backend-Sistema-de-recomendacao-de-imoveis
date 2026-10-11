import { criarApp } from './app.js';
import { banco, desconectarBanco } from './banco/cliente.js';
import { ambiente } from './config/ambiente.js';
import { registrador, resumirErro } from './utilitarios/registrador.js';
import { obterHashAdmin } from './utilitarios/senha.js';

async function iniciar() {
  // Falha cedo e de forma clara se o banco estiver inacessível ou as migrações não foram aplicadas.
  try {
    await banco.usuario.count();
  } catch (erro) {
    registrador.erro('banco_inacessivel_ou_sem_migracoes', {
      dica: 'Confira DATABASE_URL e rode: npm run db:setup',
      ...resumirErro(erro)
    });
    process.exit(1);
  }

  await obterHashAdmin(); // calcula o hash do admin agora, para o primeiro login não ficar lento

  if (ambiente.ehProducao && ambiente.origensCors.length === 0) {
    registrador.aviso('CORS_ORIGINS vazio: nenhum site conseguirá chamar a API pelo navegador');
  }
  if (ambiente.ehProducao && ambiente.confiarProxy === 0) {
    registrador.aviso('TRUST_PROXY=0: se houver proxy reverso (Render, etc.), o limite de taxa verá o IP do proxy');
  }

  const servidor = criarApp().listen(ambiente.porta, () => {
    registrador.info('servidor_iniciado', {
      porta: ambiente.porta,
      ambiente: ambiente.ehProducao ? 'production' : 'development',
      docs: ambiente.docsAtivo ? '/docs' : 'desativada'
    });
  });

  // Defesas contra conexões lentas/penduradas (slowloris). 120 s ainda comporta upload de 10 fotos em rede móvel.
  servidor.headersTimeout = 20_000;
  servidor.requestTimeout = 120_000;
  servidor.keepAliveTimeout = 65_000; // maior que o idle timeout típico de balanceadores (60 s)

  let encerrando = false;
  async function encerrar(sinal) {
    if (encerrando) return;
    encerrando = true;
    registrador.info('encerrando', { sinal });
    const forcar = setTimeout(() => process.exit(1), 10_000).unref();
    servidor.close(async () => {
      await desconectarBanco();
      clearTimeout(forcar);
      process.exit(0);
    });
    servidor.closeIdleConnections();
  }

  process.on('SIGTERM', () => encerrar('SIGTERM'));
  process.on('SIGINT', () => encerrar('SIGINT'));
}

// Estado desconhecido: registrar e sair (o gerenciador de processos reinicia) é mais seguro que continuar.
process.on('unhandledRejection', (erro) => {
  registrador.erro('promessa_rejeitada_sem_tratamento', resumirErro(erro));
  process.exit(1);
});
process.on('uncaughtException', (erro) => {
  registrador.erro('excecao_nao_capturada', resumirErro(erro));
  process.exit(1);
});

iniciar();
