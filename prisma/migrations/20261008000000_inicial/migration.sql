-- CreateEnum
CREATE TYPE "papel_usuario" AS ENUM ('cliente', 'corretor');

-- CreateEnum
CREATE TYPE "status_imovel" AS ENUM ('ativo', 'inativo');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "papel" "papel_usuario" NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "telefone" VARCHAR(11) NOT NULL,
    "cpf" VARCHAR(11) NOT NULL,
    "data_nascimento" DATE NOT NULL,
    "senha_hash" VARCHAR(100) NOT NULL,
    "creci" VARCHAR(9),
    "foto_tipo_mime" VARCHAR(20),
    "foto_dados" BYTEA,
    "foto_atualizada_em" TIMESTAMPTZ(3),
    "versao_token" INTEGER NOT NULL DEFAULT 0,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imoveis" (
    "id" SERIAL NOT NULL,
    "corretor_id" INTEGER NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "bairro" VARCHAR(80) NOT NULL,
    "preco" INTEGER NOT NULL,
    "quartos" SMALLINT NOT NULL,
    "vagas" SMALLINT NOT NULL,
    "area_m2" DOUBLE PRECISION NOT NULL,
    "status" "status_imovel" NOT NULL DEFAULT 'ativo',
    "caracteristicas" TEXT[],
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imoveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imovel_fotos" (
    "id" UUID NOT NULL,
    "imovel_id" INTEGER NOT NULL,
    "ordem" SMALLINT NOT NULL,
    "tipo_mime" VARCHAR(20) NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "dados" BYTEA NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imovel_fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversas" (
    "id" SERIAL NOT NULL,
    "imovel_id" INTEGER,
    "cliente_id" INTEGER NOT NULL,
    "corretor_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensagens" (
    "id" SERIAL NOT NULL,
    "conversa_id" INTEGER NOT NULL,
    "remetente" "papel_usuario" NOT NULL,
    "texto" VARCHAR(2000) NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_creci_key" ON "usuarios"("creci");

-- CreateIndex
CREATE INDEX "usuarios_papel_criado_em_idx" ON "usuarios"("papel", "criado_em");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_papel_cpf_key" ON "usuarios"("papel", "cpf");

-- CreateIndex
CREATE INDEX "imoveis_status_criado_em_idx" ON "imoveis"("status", "criado_em");

-- CreateIndex
CREATE INDEX "imoveis_corretor_id_idx" ON "imoveis"("corretor_id");

-- CreateIndex
CREATE INDEX "imovel_fotos_imovel_id_ordem_idx" ON "imovel_fotos"("imovel_id", "ordem");

-- CreateIndex
CREATE INDEX "conversas_cliente_id_atualizado_em_idx" ON "conversas"("cliente_id", "atualizado_em");

-- CreateIndex
CREATE INDEX "conversas_corretor_id_atualizado_em_idx" ON "conversas"("corretor_id", "atualizado_em");

-- CreateIndex
CREATE UNIQUE INDEX "conversas_imovel_id_cliente_id_key" ON "conversas"("imovel_id", "cliente_id");

-- CreateIndex
CREATE INDEX "mensagens_conversa_id_criado_em_idx" ON "mensagens"("conversa_id", "criado_em");

-- AddForeignKey
ALTER TABLE "imoveis" ADD CONSTRAINT "imoveis_corretor_id_fkey" FOREIGN KEY ("corretor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imovel_fotos" ADD CONSTRAINT "imovel_fotos_imovel_id_fkey" FOREIGN KEY ("imovel_id") REFERENCES "imoveis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_imovel_id_fkey" FOREIGN KEY ("imovel_id") REFERENCES "imoveis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversas" ADD CONSTRAINT "conversas_corretor_id_fkey" FOREIGN KEY ("corretor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_conversa_id_fkey" FOREIGN KEY ("conversa_id") REFERENCES "conversas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Regras de integridade no banco (segunda barreira, além da validação da API)
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_dados_do_papel_check" CHECK (
  ("papel" = 'corretor' AND "creci" IS NOT NULL)
  OR ("papel" = 'cliente' AND "creci" IS NULL AND "foto_dados" IS NULL AND "foto_tipo_mime" IS NULL)
);

ALTER TABLE "imoveis" ADD CONSTRAINT "imoveis_valores_check" CHECK (
  "preco" > 0 AND "preco" <= 1000000000
  AND "quartos" >= 0 AND "quartos" <= 50
  AND "vagas" >= 0 AND "vagas" <= 50
  AND "area_m2" > 0 AND "area_m2" <= 10000000
);

ALTER TABLE "imovel_fotos" ADD CONSTRAINT "imovel_fotos_dados_check" CHECK (
  "ordem" >= 0 AND "ordem" < 10
  AND "tamanho" > 0
  AND "tipo_mime" IN ('image/jpeg', 'image/png', 'image/webp')
);

ALTER TABLE "mensagens" ADD CONSTRAINT "mensagens_texto_check" CHECK (char_length(btrim("texto")) > 0);
