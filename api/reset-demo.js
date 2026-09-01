/**
 * POST /api/reset-demo
 * Limpa a tabela e reinseride os dados demo iniciais no Neon Postgres
 */
import { neon } from '@neondatabase/serverless';

const DEMO_RECORDS = [
  {
    id: 'rec_101',
    agenteNome: 'Dra. Patrícia Lima',
    agenteCargo: 'Psicopedagoga',
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
    agenteCargo: 'Fonoaudióloga',
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
    agenteCargo: 'Psicóloga Escolar',
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

    // Limpa tabelas
    await sql`DELETE FROM records`;
    await sql`DELETE FROM ocorrencias`;

    // Reinseride os dados demo de laudos
    for (const r of DEMO_RECORDS) {
      await sql`
        INSERT INTO records (id, "agenteNome", "agenteCargo", "alunoNome", "alunoMeta", "laudoTitulo", "laudoDetalhes", data, status)
        VALUES (${r.id}, ${r.agenteNome}, ${r.agenteCargo}, ${r.alunoNome}, ${r.alunoMeta}, ${r.laudoTitulo}, ${r.laudoDetalhes}, ${r.data}, ${r.status})
      `;
    }

    // Reinseride os dados demo de ocorrencias
    for (const o of DEMO_OCORRENCIAS) {
      await sql`
        INSERT INTO ocorrencias (id, "alunoNome", "alunoMeta", "registradoPor", "profissaoRegistrante", "tipoOcorrencia", gravidade, titulo, descricao, "medidasTomadas", data, status)
        VALUES (${o.id}, ${o.alunoNome}, ${o.alunoMeta}, ${o.registradoPor}, ${o.profissaoRegistrante}, ${o.tipoOcorrencia}, ${o.gravidade}, ${o.titulo}, ${o.descricao}, ${o.medidasTomadas}, ${o.data}, ${o.status})
      `;
    }

    return res.status(200).json({
      success: true,
      message: 'Banco de dados restaurado para o padrão demo com Laudos e Ocorrências!',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao restaurar banco', details: err.message });
  }
}

