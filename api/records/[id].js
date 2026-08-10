/**
 * /api/records/[id]
 * PUT    - Atualiza um registro pelo ID
 * DELETE - Remove um registro pelo ID
 *
 * Usa Neon Postgres (DATABASE_URL via variável de ambiente no Vercel)
 */
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // O ID vem da URL dinâmica: /api/records/[id]
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID do registro não informado' });
  }

  const sql = neon(process.env.DATABASE_URL);

  // PUT /api/records/:id - Atualiza registro
  if (req.method === 'PUT') {
    try {
      const data = req.body;
      if (!data) return res.status(400).json({ error: 'Dados inválidos' });

      await sql`
        UPDATE records
        SET
          "agenteNome"   = ${data.agenteNome},
          "agenteCargo"  = ${data.agenteCargo},
          "alunoNome"    = ${data.alunoNome},
          "alunoMeta"    = ${data.alunoMeta},
          "laudoTitulo"  = ${data.laudoTitulo},
          "laudoDetalhes"= ${data.laudoDetalhes},
          data           = ${data.data},
          status         = ${data.status},
          updated_at     = NOW()
        WHERE id = ${id}
      `;

      return res.status(200).json({ success: true, message: 'Registro atualizado com sucesso!' });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao atualizar registro', details: err.message });
    }
  }

  // DELETE /api/records/:id - Remove registro
  if (req.method === 'DELETE') {
    try {
      await sql`DELETE FROM records WHERE id = ${id}`;
      return res.status(200).json({ success: true, message: 'Registro excluído com sucesso!' });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao excluir registro', details: err.message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
