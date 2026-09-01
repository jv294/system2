/**
 * PAED System - Backend Server & Banco de Dados SQLite
 * Servidor HTTP nativo Node.js com banco de dados relacional SQLite integrado (paed_database.db)
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 8080;
const DB_FILE = path.join(__dirname, 'paed_database.db');

// Initialize SQLite Database Connection
console.log('📦 Inicializando Banco de Dados SQLite em:', DB_FILE);
const db = new DatabaseSync(DB_FILE);

// Create SQL Tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    agenteNome TEXT NOT NULL,
    agenteCargo TEXT NOT NULL,
    alunoNome TEXT NOT NULL,
    alunoMeta TEXT,
    laudoTitulo TEXT NOT NULL,
    laudoDetalhes TEXT,
    data TEXT NOT NULL,
    status TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ocorrencias (
    id TEXT PRIMARY KEY,
    alunoNome TEXT NOT NULL,
    alunoMeta TEXT,
    registradoPor TEXT NOT NULL,
    profissaoRegistrante TEXT NOT NULL,
    tipoOcorrencia TEXT NOT NULL,
    gravidade TEXT NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    medidasTomadas TEXT,
    data TEXT NOT NULL,
    status TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed Initial Data if database is freshly created
const countStmt = db.prepare('SELECT COUNT(*) as count FROM records');
const rowCount = countStmt.get().count;

const initialRecords = [
  {
    id: 'rec_101',
    agenteNome: 'Dra. Patrícia Lima',
    agenteCargo: 'Psicopedagoga',
    alunoNome: 'Lucas Mendes',
    alunoMeta: '3º Ano Fundamental A (8 anos)',
    laudoTitulo: 'Avaliação Psicopedagógica - Indicadores de Dislexia',
    laudoDetalhes: 'Apresenta oscilação na velocidade de leitura, fadiga na decodificação de fonemas e boa compreensão oral. Recomendado plano de apoio pedagógico individualizado (PAPI) e adaptação de avaliações.',
    data: '2026-08-01',
    status: 'concluido'
  },
  {
    id: 'rec_102',
    agenteNome: 'Dr. Roberto Alves',
    agenteCargo: 'Neuropediatra',
    alunoNome: 'Mariana Souza',
    alunoMeta: '5º Ano Fundamental B (10 anos)',
    laudoTitulo: 'Laudo Neuropsicológico - TDAH Tipo Predominantemente Desatento',
    laudoDetalhes: 'Confirmado diagnóstico de TDAH. Recomendado acompanhamento semanal em psicopedagogia, tempo adicional em provas presenciais e assento estratégico na primeira fileira da sala de aula.',
    data: '2026-08-03',
    status: 'concluido'
  },
  {
    id: 'rec_103',
    agenteNome: 'Dra. Camila Torres',
    agenteCargo: 'Fonoaudióloga',
    alunoNome: 'Enzo Gabriel Santos',
    alunoMeta: 'Ed. Infantil V (5 anos)',
    laudoTitulo: 'Avaliação do Processamento Auditivo Central (PAC)',
    laudoDetalhes: 'Apresenta boa discriminação auditiva em ambiente silencioso, porém retenção de estímulos prejudicada sob ruído competitivo de fundo. Realizando sessões de treino auditivo acusticamente controlado.',
    data: '2026-08-04',
    status: 'em_andamento'
  },
  {
    id: 'rec_104',
    agenteNome: 'Dra. Beatriz Rocha',
    agenteCargo: 'Psicóloga Escolar',
    alunoNome: 'Sophia Oliveira',
    alunoMeta: '7º Ano Fundamental C (12 anos)',
    laudoTitulo: 'Triagem de Regulação Emocional e Ansiedade Escolar',
    laudoDetalhes: 'Pendente recebimento das escalas comportamentais preenchidas pela equipe docente e formulário de observação familiar.',
    data: '2026-08-05',
    status: 'pendente'
  },
  {
    id: 'rec_105',
    agenteNome: 'Dr. Marcelo Nunes',
    agenteCargo: 'Terapeuta Ocupacional',
    alunoNome: 'Matheus Henrique',
    alunoMeta: '2º Ano Fundamental B (7 anos)',
    laudoTitulo: 'Relatório de Coordenação Visomotora e Integração Sensorial',
    laudoDetalhes: 'Em fase de revisão do laudo descritivo para envio à equipe pedagógica. Apresenta hipotonia leve e necessidade de adaptação na preensão do lápis.',
    data: '2026-08-02',
    status: 'revisao'
  }
];

if (rowCount === 0) {
  console.log('🌱 Semeando dados iniciais de Laudos...');
  const insertStmt = db.prepare(`
    INSERT INTO records (id, agenteNome, agenteCargo, alunoNome, alunoMeta, laudoTitulo, laudoDetalhes, data, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const r of initialRecords) {
    insertStmt.run(r.id, r.agenteNome, r.agenteCargo, r.alunoNome, r.alunoMeta, r.laudoTitulo, r.laudoDetalhes, r.data, r.status);
  }
}

// Seed Initial Ocorrências if table is empty
const countOcorrenciasStmt = db.prepare('SELECT COUNT(*) as count FROM ocorrencias');
const ocorrenciasCount = countOcorrenciasStmt.get().count;

const initialOcorrencias = [
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

if (ocorrenciasCount === 0) {
  console.log('🌱 Semeando dados iniciais de Ocorrências...');
  const insertOcoStmt = db.prepare(`
    INSERT INTO ocorrencias (id, alunoNome, alunoMeta, registradoPor, profissaoRegistrante, tipoOcorrencia, gravidade, titulo, descricao, medidasTomadas, data, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const o of initialOcorrencias) {
    insertOcoStmt.run(o.id, o.alunoNome, o.alunoMeta, o.registradoPor, o.profissaoRegistrante, o.tipoOcorrencia, o.gravidade, o.titulo, o.descricao, o.medidasTomadas, o.data, o.status);
  }
}

// MIME Types Helper
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png'
};

// HTTP Request Handler
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // --- REST API ENDPOINTS ---
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // GET /api/health
    if (req.method === 'GET' && pathname === '/api/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'online', database: 'SQLite (paed_database.db)', file: DB_FILE }));
      return;
    }

    // --- RECORDS (LAUDOS) ---
    // GET /api/records - Fetch all records
    if (req.method === 'GET' && pathname === '/api/records') {
      try {
        const stmt = db.prepare('SELECT * FROM records ORDER BY data DESC');
        const rows = stmt.all();
        res.writeHead(200);
        res.end(JSON.stringify(rows));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Erro ao buscar registros do SQLite', details: err.message }));
      }
      return;
    }

    // POST /api/records - Create new record
    if (req.method === 'POST' && pathname === '/api/records') {
      getBody(req, (err, data) => {
        if (err || !data) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Dados inválidos' }));
          return;
        }

        try {
          const id = data.id || ('rec_' + Date.now());
          const stmt = db.prepare(`
            INSERT INTO records (id, agenteNome, agenteCargo, alunoNome, alunoMeta, laudoTitulo, laudoDetalhes, data, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          stmt.run(
            id,
            data.agenteNome || '',
            data.agenteCargo || '',
            data.alunoNome || '',
            data.alunoMeta || '',
            data.laudoTitulo || '',
            data.laudoDetalhes || '',
            data.data || new Date().toISOString().split('T')[0],
            data.status || 'pendente'
          );

          res.writeHead(201);
          res.end(JSON.stringify({ success: true, id, message: 'Registro salvo no banco de dados SQLite!' }));
        } catch (dbErr) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Erro ao inserir no SQLite', details: dbErr.message }));
        }
      });
      return;
    }

    // PUT /api/records/:id - Update existing record
    if (req.method === 'PUT' && pathname.startsWith('/api/records/')) {
      const targetId = pathname.replace('/api/records/', '');
      getBody(req, (err, data) => {
        if (err || !data) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Dados inválidos' }));
          return;
        }

        try {
          const stmt = db.prepare(`
            UPDATE records 
            SET agenteNome = ?, agenteCargo = ?, alunoNome = ?, alunoMeta = ?, laudoTitulo = ?, laudoDetalhes = ?, data = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `);
          stmt.run(
            data.agenteNome,
            data.agenteCargo,
            data.alunoNome,
            data.alunoMeta,
            data.laudoTitulo,
            data.laudoDetalhes,
            data.data,
            data.status,
            targetId
          );

          res.writeHead(200);
          res.end(JSON.stringify({ success: true, message: 'Registro atualizado no SQLite!' }));
        } catch (dbErr) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Erro ao atualizar no SQLite', details: dbErr.message }));
        }
      });
      return;
    }

    // DELETE /api/records/:id - Delete record
    if (req.method === 'DELETE' && pathname.startsWith('/api/records/')) {
      const targetId = pathname.replace('/api/records/', '');
      try {
        const stmt = db.prepare('DELETE FROM records WHERE id = ?');
        stmt.run(targetId);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, message: 'Registro excluído do SQLite!' }));
      } catch (dbErr) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Erro ao remover do SQLite', details: dbErr.message }));
      }
      return;
    }

    // --- OCORRÊNCIAS DOS ALUNOS ---
    // GET /api/ocorrencias - Fetch all occurrences
    if (req.method === 'GET' && pathname === '/api/ocorrencias') {
      try {
        const stmt = db.prepare('SELECT * FROM ocorrencias ORDER BY data DESC');
        const rows = stmt.all();
        res.writeHead(200);
        res.end(JSON.stringify(rows));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Erro ao buscar ocorrências do SQLite', details: err.message }));
      }
      return;
    }

    // POST /api/ocorrencias - Create new occurrence
    if (req.method === 'POST' && pathname === '/api/ocorrencias') {
      getBody(req, (err, data) => {
        if (err || !data) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Dados inválidos' }));
          return;
        }

        try {
          const id = data.id || ('oco_' + Date.now());
          const stmt = db.prepare(`
            INSERT INTO ocorrencias (id, alunoNome, alunoMeta, registradoPor, profissaoRegistrante, tipoOcorrencia, gravidade, titulo, descricao, medidasTomadas, data, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          stmt.run(
            id,
            data.alunoNome || '',
            data.alunoMeta || '',
            data.registradoPor || '',
            data.profissaoRegistrante || '',
            data.tipoOcorrencia || 'Comportamental',
            data.gravidade || 'Media',
            data.titulo || '',
            data.descricao || '',
            data.medidasTomadas || '',
            data.data || new Date().toISOString().split('T')[0],
            data.status || 'registrada'
          );

          res.writeHead(201);
          res.end(JSON.stringify({ success: true, id, message: 'Ocorrência salva com sucesso no banco SQLite!' }));
        } catch (dbErr) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Erro ao inserir ocorrência no SQLite', details: dbErr.message }));
        }
      });
      return;
    }

    // PUT /api/ocorrencias/:id - Update existing occurrence
    if (req.method === 'PUT' && pathname.startsWith('/api/ocorrencias/')) {
      const targetId = pathname.replace('/api/ocorrencias/', '');
      getBody(req, (err, data) => {
        if (err || !data) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Dados inválidos' }));
          return;
        }

        try {
          const stmt = db.prepare(`
            UPDATE ocorrencias 
            SET alunoNome = ?, alunoMeta = ?, registradoPor = ?, profissaoRegistrante = ?, tipoOcorrencia = ?, gravidade = ?, titulo = ?, descricao = ?, medidasTomadas = ?, data = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `);
          stmt.run(
            data.alunoNome,
            data.alunoMeta,
            data.registradoPor,
            data.profissaoRegistrante,
            data.tipoOcorrencia,
            data.gravidade,
            data.titulo,
            data.descricao,
            data.medidasTomadas,
            data.data,
            data.status,
            targetId
          );

          res.writeHead(200);
          res.end(JSON.stringify({ success: true, message: 'Ocorrência atualizada no SQLite!' }));
        } catch (dbErr) {
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Erro ao atualizar ocorrência no SQLite', details: dbErr.message }));
        }
      });
      return;
    }

    // DELETE /api/ocorrencias/:id - Delete occurrence
    if (req.method === 'DELETE' && pathname.startsWith('/api/ocorrencias/')) {
      const targetId = pathname.replace('/api/ocorrencias/', '');
      try {
        const stmt = db.prepare('DELETE FROM ocorrencias WHERE id = ?');
        stmt.run(targetId);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, message: 'Ocorrência excluída do SQLite!' }));
      } catch (dbErr) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Erro ao remover ocorrência do SQLite', details: dbErr.message }));
      }
      return;
    }

    // POST /api/reset-demo - Restore demo data in database
    if (req.method === 'POST' && pathname === '/api/reset-demo') {
      try {
        db.exec('DELETE FROM records');
        db.exec('DELETE FROM ocorrencias');

        const insertStmt = db.prepare(`
          INSERT INTO records (id, agenteNome, agenteCargo, alunoNome, alunoMeta, laudoTitulo, laudoDetalhes, data, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const r of initialRecords) {
          insertStmt.run(r.id, r.agenteNome, r.agenteCargo, r.alunoNome, r.alunoMeta, r.laudoTitulo, r.laudoDetalhes, r.data, r.status);
        }

        const insertOcoStmt = db.prepare(`
          INSERT INTO ocorrencias (id, alunoNome, alunoMeta, registradoPor, profissaoRegistrante, tipoOcorrencia, gravidade, titulo, descricao, medidasTomadas, data, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const o of initialOcorrencias) {
          insertOcoStmt.run(o.id, o.alunoNome, o.alunoMeta, o.registradoPor, o.profissaoRegistrante, o.tipoOcorrencia, o.gravidade, o.titulo, o.descricao, o.medidasTomadas, o.data, o.status);
        }

        res.writeHead(200);
        res.end(JSON.stringify({ success: true, message: 'Banco de dados SQLite restaurado para o padrão com Laudos e Ocorrências!' }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Erro ao restaurar banco', details: err.message }));
      }
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint não encontrado' }));
    return;
  }

  // --- STATIC FILE SERVER ---
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 Página Não Encontrada</h1>');
      } else {
        res.writeHead(500);
        res.end(`Erro no servidor: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// Helper for parsing JSON POST/PUT request bodies
function getBody(req, callback) {
  let body = '';
  req.on('data', chunk => body += chunk.toString());
  req.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      callback(null, parsed);
    } catch (e) {
      callback(e, null);
    }
  });
}

// Start Server
server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 Servidor PAED + SQLite online na porta ${PORT}`);
  console.log(`🔗 Acesse no navegador: http://localhost:${PORT}`);
  console.log(`📂 Arquivo do Banco de Dados: ${DB_FILE}`);
  console.log(`===================================================`);
});
