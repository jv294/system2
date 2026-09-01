/**
 * /api/ocorrencias/[id]
 * PUT    - Atualiza uma ocorrência pelo ID
 * DELETE - Remove uma ocorrência pelo ID
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

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID da ocorrência não informado' });
  }

  const sql = neon(process.env.DATABASE_URL);

  // PUT /api/ocorrencias/:id
  if (req.method === 'PUT') {
    try {
      const data = req.body;
      if (!data) return res.status(400).json({ error: 'Dados inválidos' });

      await sql`
        UPDATE ocorrencias
        SET
          "alunoNome"           = ${data.alunoNome},
          "alunoMeta"           = ${data.alunoMeta},
          "registradoPor"       = ${data.registradoPor},
          "profissaoRegistrante"= ${data.profissaoRegistrante},
          "tipoOcorrencia"      = ${data.tipoOcorrencia},
          gravidade             = ${data.gravidade},
          titulo                = ${data.titulo},
          descricao             = ${data.descricao},
          "medidasTomadas"      = ${data.medidasTomadas},
          data                  = ${data.data},
          status                = ${data.status},
          updated_at            = NOW()
        WHERE id = ${id}
      `;

      return res.status(200).json({ success: true, message: 'Ocorrência atualizada com sucesso!' });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao atualizar ocorrência', details: err.message });
    }
  }

  // DELETE /api/ocorrencias/:id
  if (req.method === 'DELETE') {
    try {
      await sql`DELETE FROM ocorrencias WHERE id = ${id}`;
      return res.status(200).json({ success: true, message: 'Ocorrência excluída com sucesso!' });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao excluir ocorrência', details: err.message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
