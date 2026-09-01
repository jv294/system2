/**
 * /api/ocorrencias
 * GET  - Retorna todas as ocorrências de alunos
 * POST - Cria uma nova ocorrência
 *
 * Usa Neon Postgres (DATABASE_URL via variável de ambiente no Vercel)
 */
import { neon } from '@neondatabase/serverless';

const DEMO_OCORRENCIAS = [
  {
    id: 'oco_201',
    alunoNome: 'Lucas Mendes',
    alunoMeta: '3º Ano Fundamental A (8 anos)',
    registradoPor: 'Profª Cláudia Silveira',
    profissaoRegistrante: 'Professora Titular',
    tipoOcorrencia: 'Comportamental',
    gravidade: 'Media',
    titulo: 'Crise de frustração durante atividade de leitura coletiva',
    descricao: 'Durante a leitura compartilhada em sala, o aluno demonstrou grande sobrecarga e recusa em participar, fechando o caderno e chorando.',
    medidasTomadas: 'Aluno acolhido no espaço calmo da sala. Conversa individualizada realizada e adaptação da dinâmica para leitura assistida. Comunicado enviado à psicopedagoga Patrícia Lima.',
    data: '2026-08-10',
    status: 'em_acompanhamento'
  },
  {
    id: 'oco_202',
    alunoNome: 'Mariana Souza',
    alunoMeta: '5º Ano Fundamental B (10 anos)',
    registradoPor: 'Marcos Vinícius',
    profissaoRegistrante: 'Coordenador Pedagógico',
    tipoOcorrencia: 'Disciplinar',
    gravidade: 'Baixa',
    titulo: 'Distração recorrente com itens não pedagógicos durante a aula',
    descricao: 'Aluna dispersa com brinquedos durante explicação de Matemática, chamando atenção dos colegas ao redor.',
    medidasTomadas: 'Conversa orientadora realizada com a aluna. Acordado sistema de pausas programadas conforme orientação do laudo neuropsicológico.',
    data: '2026-08-12',
    status: 'resolvida'
  },
  {
    id: 'oco_203',
    alunoNome: 'Enzo Gabriel Santos',
    alunoMeta: 'Ed. Infantil V (5 anos)',
    registradoPor: 'Renata Vasconcelos',
    profissaoRegistrante: 'Auxiliar de Desenvolvimento Infantil',
    tipoOcorrencia: 'Saude',
    gravidade: 'Media',
    titulo: 'Sensibilidade auditiva acentuada durante recreio',
    descricao: 'Aluno apresentou queixa de dor de cabeça e desconforto extremo devido ao som ambiente alto no pátio.',
    medidasTomadas: 'Conduzido à enfermaria para repouso em ambiente silencioso. Pais notificados via agenda digital e fonoaudióloga informada.',
    data: '2026-08-14',
    status: 'registrada'
  },
  {
    id: 'oco_204',
    alunoNome: 'Sophia Oliveira',
    alunoMeta: '7º Ano Fundamental C (12 anos)',
    registradoPor: 'Juliana Barbosa',
    profissaoRegistrante: 'Orientadora Educacional',
    tipoOcorrencia: 'Pedagogica',
    gravidade: 'Alta',
    titulo: 'Bloqueio e crise de ansiedade antes da avaliação bimestral',
    descricao: 'Apresentou taquicardia e choro intenso momentos antes da prova de Ciências, relatando medo excessivo de insucesso.',
    medidasTomadas: 'Atendimento imediato na sala de orientação. Prova adiada para aplicação em sala reservada. Reunião agendada com os responsáveis e a psicóloga escolar.',
    data: '2026-08-15',
    status: 'em_analise'
  }
];

async function ensureOcorrenciasTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS ocorrencias (
      id TEXT PRIMARY KEY,
      "alunoNome" TEXT NOT NULL,
      "alunoMeta" TEXT,
      "registradoPor" TEXT NOT NULL,
      "profissaoRegistrante" TEXT NOT NULL,
      "tipoOcorrencia" TEXT NOT NULL,
      gravidade TEXT NOT NULL,
      titulo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      "medidasTomadas" TEXT,
      data TEXT NOT NULL,
      status TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM ocorrencias`;
  if (count === 0) {
    for (const o of DEMO_OCORRENCIAS) {
      await sql`
        INSERT INTO ocorrencias (id, "alunoNome", "alunoMeta", "registradoPor", "profissaoRegistrante", "tipoOcorrencia", gravidade, titulo, descricao, "medidasTomadas", data, status)
        VALUES (${o.id}, ${o.alunoNome}, ${o.alunoMeta}, ${o.registradoPor}, ${o.profissaoRegistrante}, ${o.tipoOcorrencia}, ${o.gravidade}, ${o.titulo}, ${o.descricao}, ${o.medidasTomadas}, ${o.data}, ${o.status})
      `;
    }
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const sql = neon(process.env.DATABASE_URL);
  await ensureOcorrenciasTable(sql);

  // GET /api/ocorrencias
  if (req.method === 'GET') {
    try {
      const rows = await sql`SELECT * FROM ocorrencias ORDER BY data DESC`;
      return res.status(200).json(rows);
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao buscar ocorrências', details: err.message });
    }
  }

  // POST /api/ocorrencias
  if (req.method === 'POST') {
    try {
      const data = req.body;
      if (!data) return res.status(400).json({ error: 'Dados inválidos' });

      const id = data.id || 'oco_' + Date.now();
      const ocoDate = data.data || new Date().toISOString().split('T')[0];

      await sql`
        INSERT INTO ocorrencias (id, "alunoNome", "alunoMeta", "registradoPor", "profissaoRegistrante", "tipoOcorrencia", gravidade, titulo, descricao, "medidasTomadas", data, status)
        VALUES (
          ${id},
          ${data.alunoNome || ''},
          ${data.alunoMeta || ''},
          ${data.registradoPor || ''},
          ${data.profissaoRegistrante || ''},
          ${data.tipoOcorrencia || 'Comportamental'},
          ${data.gravidade || 'Media'},
          ${data.titulo || ''},
          ${data.descricao || ''},
          ${data.medidasTomadas || ''},
          ${ocoDate},
          ${data.status || 'registrada'}
        )
      `;

      return res.status(201).json({ success: true, id, message: 'Ocorrência salva com sucesso!' });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao criar ocorrência', details: err.message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
