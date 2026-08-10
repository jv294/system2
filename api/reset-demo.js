/**
 * POST /api/reset-demo
 * Limpa a tabela e reinseride os dados demo iniciais no Neon Postgres
 */
import { neon } from '@neondatabase/serverless';

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Limpa todos os registros
    await sql`DELETE FROM records`;

    // Reinseride os dados demo
    for (const r of DEMO_RECORDS) {
      await sql`
        INSERT INTO records (id, "agenteNome", "agenteCargo", "alunoNome", "alunoMeta", "laudoTitulo", "laudoDetalhes", data, status)
        VALUES (${r.id}, ${r.agenteNome}, ${r.agenteCargo}, ${r.alunoNome}, ${r.alunoMeta}, ${r.laudoTitulo}, ${r.laudoDetalhes}, ${r.data}, ${r.status})
      `;
    }

    return res.status(200).json({
      success: true,
      message: 'Banco de dados restaurado para o padrão demo!',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao restaurar banco', details: err.message });
  }
}
