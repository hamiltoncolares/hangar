import { FastifyInstance } from 'fastify';
import ExcelJS from 'exceljs';
import { getPrisma } from '../db.js';

function formatMonth(d: Date) {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export async function exportRoutes(app: FastifyInstance) {
  const prisma = getPrisma();

  app.addHook('preHandler', app.authenticate);

  app.get('/export/excel', async (req, reply) => {
    const { tier_id } = req.query as { tier_id?: string };
    if (req.user?.role !== 'admin') {
      const allowed = req.userTierIds ?? [];
      if (tier_id && !allowed.includes(tier_id)) {
        reply.status(403).send({ error: 'forbidden' });
        return;
      }
    }

    const exportProjetoWhere: any = {};
    if (tier_id) exportProjetoWhere.cliente = { ...(exportProjetoWhere.cliente ?? {}), tierId: tier_id };
    if (req.user?.role !== 'admin') {
      exportProjetoWhere.cliente = {
        ...(exportProjetoWhere.cliente ?? {}),
        tierId: { in: req.userTierIds ?? [] }
      };
    }

    const registros = await prisma.registroMensal.findMany({
      where: Object.keys(exportProjetoWhere).length ? { projeto: exportProjetoWhere } : undefined,
      include: {
        imposto: true,
        projeto: {
          include: {
            cliente: {
              include: { tier: true }
            }
          }
        }
      },
      orderBy: { mesRef: 'asc' }
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Hangar';

    const columns = [
      { header: 'Tier', key: 'tier', width: 22 },
      { header: 'Cliente', key: 'cliente', width: 28 },
      { header: 'Projeto', key: 'projeto', width: 28 },
      { header: 'Mês', key: 'mes', width: 10 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Receita Bruta', key: 'receita_bruta', width: 16 },
      { header: 'Imposto %', key: 'imposto_pct', width: 10 },
      { header: 'Receita Líquida', key: 'receita_liquida', width: 16 },
      { header: 'Custo', key: 'custo', width: 14 },
      { header: 'Observações', key: 'observacoes', width: 30 }
    ];

    const geral = wb.addWorksheet('Consolidado Geral');
    geral.columns = columns;

    const byTier = new Map<string, ExcelJS.Worksheet>();
    const byCliente = new Map<string, ExcelJS.Worksheet>();

    for (const r of registros) {
      const tierName = r.projeto.cliente.tier.nome;
      const clienteName = r.projeto.cliente.nome;

      const row = {
        tier: tierName,
        cliente: clienteName,
        projeto: r.projeto.nome,
        mes: formatMonth(r.mesRef),
        status: r.status,
        receita_bruta: Number(r.receitaBruta),
        imposto_pct: Number(r.imposto.percentual),
        receita_liquida: Number(r.receitaLiquida),
        custo: Number(r.custoProjetado),
        observacoes: r.observacoes ?? ''
      };

      geral.addRow(row);

      if (!byTier.has(tierName)) {
        const sheet = wb.addWorksheet(`Tier - ${tierName}`.slice(0, 31));
        sheet.columns = columns;
        byTier.set(tierName, sheet);
      }
      byTier.get(tierName)!.addRow(row);

      if (!byCliente.has(clienteName)) {
        const sheet = wb.addWorksheet(`Cliente - ${clienteName}`.slice(0, 31));
        sheet.columns = columns;
        byCliente.set(clienteName, sheet);
      }
      byCliente.get(clienteName)!.addRow(row);
    }

    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    reply.header('Content-Disposition', 'attachment; filename="hangar-export.xlsx"');

    const buffer = await wb.xlsx.writeBuffer();
    return reply.send(Buffer.from(buffer));
  });
}
