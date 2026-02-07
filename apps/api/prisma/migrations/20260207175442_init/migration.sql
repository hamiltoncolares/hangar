-- CreateTable
CREATE TABLE "tiers" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "logo_url" TEXT,
    "tier_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projetos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "cliente_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projetos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impostos" (
    "id" TEXT NOT NULL,
    "projeto_id" TEXT NOT NULL,
    "percentual" DECIMAL(65,30) NOT NULL,
    "vigencia_inicio" TIMESTAMP(3) NOT NULL,
    "vigencia_fim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "impostos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_mensais" (
    "id" TEXT NOT NULL,
    "projeto_id" TEXT NOT NULL,
    "mes_ref" TIMESTAMP(3) NOT NULL,
    "receita_bruta" DECIMAL(65,30) NOT NULL,
    "imposto_id" TEXT NOT NULL,
    "receita_liquida" DECIMAL(65,30) NOT NULL,
    "custo_projetado" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL,
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_mensais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_tier_id_nome_key" ON "clientes"("tier_id", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "projetos_cliente_id_nome_key" ON "projetos"("cliente_id", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "registros_mensais_projeto_id_mes_ref_status_key" ON "registros_mensais"("projeto_id", "mes_ref", "status");

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projetos" ADD CONSTRAINT "projetos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impostos" ADD CONSTRAINT "impostos_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projetos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_mensais" ADD CONSTRAINT "registros_mensais_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projetos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_mensais" ADD CONSTRAINT "registros_mensais_imposto_id_fkey" FOREIGN KEY ("imposto_id") REFERENCES "impostos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
