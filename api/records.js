/**
 * /api/records
 * GET  - Retorna todos os registros
 * POST - Cria um novo registro
 *
 * Usa Neon Postgres (DATABASE_URL via variável de ambiente no Vercel)
 */
import { neon } from '@neondatabase/serverless';

// Dados demo para seed inicial
const DEMO_RECORDS = [
  {
    id: 'rec_101',
    agenteNome: 'Dra. Patrícia Lima',
    agenteCargo: 'Psicopedagogo(a)',
    alunoNome: 'Lucas Mendes',
    alunoMeta: '3º Ano Fundamental A (8 anos)',
    laudoTitulo: 'Avaliação Psicopedagógica - Indicadores de Dislexia',
    laudoDetalhes:
      'Apresenta oscilação na velocidade de leitura, fadiga na decodificação de fonemas e boa compreensão oral. Recomendado plano de apoio pedagógico individualizado (PAPI) e adaptação de avaliações.',
    data: '2026-08-01',
    status: 'concluido',
  },
  {
    id: 'rec_102',
    agenteNome: 'Dr. Roberto Alves',
    agenteCargo: 'Neuropediatra',
    alunoNome: 'Mariana Souza',
    alunoMeta: '5º Ano Fundamental B (10 anos)',
    laudoTitulo: 'Laudo Neuropsicológico - TDAH Tipo Predominantemente Desatento',
    laudoDetalhes:
      'Confirmado diagnóstico de TDAH. Recomendado acompanhamento semanal em psicopedagogia, tempo adicional em provas presenciais e assento estratégico na primeira fileira da sala de aula.',
    data: '2026-08-03',
    status: 'concluido',
  },
  {
    id: 'rec_103',
    agenteNome: 'Dra. Camila Torres',
    agenteCargo: 'Fonoaudiólogo(a)',
    alunoNome: 'Enzo Gabriel Santos',
    alunoMeta: 'Ed. Infantil V (5 anos)',
    laudoTitulo: 'Avaliação do Processamento Auditivo Central (PAC)',
    laudoDetalhes:
      'Apresenta boa discriminação auditiva em ambiente silencioso, porém retenção de estímulos prejudicada sob ruído competitivo de fundo. Realizando sessões de treino auditivo acusticamente controlado.',
    data: '2026-08-04',
    status: 'em_andamento',
  },
  {
    id: 'rec_104',
    agenteNome: 'Dra. Beatriz Rocha',
    agenteCargo: 'Psicólogo(a)',
    alunoNome: 'Sophia Oliveira',
    alunoMeta: '7º Ano Fundamental C (12 anos)',
    laudoTitulo: 'Triagem de Regulação Emocional e Ansiedade Escolar',
    laudoDetalhes:
      'Pendente recebimento das escalas comportamentais preenchidas pela equipe docente e formulário de observação familiar.',
    data: '2026-08-05',
    status: 'pendente',
  },
  {
    id: 'rec_105',
    agenteNome: 'Dr. Marcelo Nunes',
    agenteCargo: 'Terapeuta Ocupacional',
    alunoNome: 'Matheus Henrique',
    alunoMeta: '2º Ano Fundamental B (7 anos)',
    laudoTitulo: 'Relatório de Coordenação Visomotora e Integração Sensorial',
    laudoDetalhes:
      'Em fase de revisão do laudo descritivo para envio à equipe pedagógica. Apresenta hipotonia leve e necessidade de adaptação na preensão do lápis.',
    data: '2026-08-02',
    status: 'revisao',
  },
];

async function ensureTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      "agenteNome" TEXT NOT NULL,
      "agenteCargo" TEXT NOT NULL,
      "alunoNome" TEXT NOT NULL,
      "alunoMeta" TEXT,
      "laudoTitulo" TEXT NOT NULL,
      "laudoDetalhes" TEXT,
      data TEXT NOT NULL,
      status TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Seed demo data if table is empty
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM records`;
  if (count === 0) {
    for (const r of DEMO_RECORDS) {
      await sql`
        INSERT INTO records (id, "agenteNome", "agenteCargo", "alunoNome", "alunoMeta", "laudoTitulo", "laudoDetalhes", data, status)
        VALUES (${r.id}, ${r.agenteNome}, ${r.agenteCargo}, ${r.alunoNome}, ${r.alunoMeta}, ${r.laudoTitulo}, ${r.laudoDetalhes}, ${r.data}, ${r.status})
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
  await ensureTable(sql);

  // GET /api/records - Retorna todos os registros
  if (req.method === 'GET') {
    try {
      const rows = await sql`SELECT * FROM records ORDER BY data DESC`;
      return res.status(200).json(rows);
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao buscar registros', details: err.message });
    }
  }

  // POST /api/records - Cria um novo registro
  if (req.method === 'POST') {
    try {
      const data = req.body;
      if (!data) return res.status(400).json({ error: 'Dados inválidos' });

      const id = data.id || 'rec_' + Date.now();
      const recordDate = data.data || new Date().toISOString().split('T')[0];

      await sql`
        INSERT INTO records (id, "agenteNome", "agenteCargo", "alunoNome", "alunoMeta", "laudoTitulo", "laudoDetalhes", data, status)
        VALUES (
          ${id},
          ${data.agenteNome || ''},
          ${data.agenteCargo || ''},
          ${data.alunoNome || ''},
          ${data.alunoMeta || ''},
          ${data.laudoTitulo || ''},
          ${data.laudoDetalhes || ''},
          ${recordDate},
          ${data.status || 'pendente'}
        )
      `;

      return res.status(201).json({ success: true, id, message: 'Registro salvo com sucesso!' });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao criar registro', details: err.message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
