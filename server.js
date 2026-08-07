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
`);

// Seed Initial Data if database is freshly created
const countStmt = db.prepare('SELECT COUNT(*) as count FROM records');
const rowCount = countStmt.get().count;

if (rowCount === 0) {
  console.log('🌱 Banco de dados novo detectado. Semeando dados iniciais...');
  const insertStmt = db.prepare(`
    INSERT INTO records (id, agenteNome, agenteCargo, alunoNome, alunoMeta, laudoTitulo, laudoDetalhes, data, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialRecords = [
    {
      id: 'rec_101',
      agenteNome: 'Dra. Patrícia Lima',
      agenteCargo: 'Psicopedagogo(a)',
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
      agenteCargo: 'Fonoaudiólogo(a)',
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
      agenteCargo: 'Psicólogo(a)',
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

  for (const r of initialRecords) {
    insertStmt.run(r.id, r.agenteNome, r.agenteCargo, r.alunoNome, r.alunoMeta, r.laudoTitulo, r.laudoDetalhes, r.data, r.status);
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

    // POST /api/reset-demo - Restore demo data in database
    if (req.method === 'POST' && pathname === '/api/reset-demo') {
      try {
        db.exec('DELETE FROM records');
        const insertStmt = db.prepare(`
          INSERT INTO records (id, agenteNome, agenteCargo, alunoNome, alunoMeta, laudoTitulo, laudoDetalhes, data, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const initialRecords = [
          { id: 'rec_101', agenteNome: 'Dra. Patrícia Lima', agenteCargo: 'Psicopedagogo(a)', alunoNome: 'Lucas Mendes', alunoMeta: '3º Ano Fundamental A (8 anos)', laudoTitulo: 'Avaliação Psicopedagógica - Indicadores de Dislexia', laudoDetalhes: 'Apresenta oscilação na velocidade de leitura, fadiga na decodificação de fonemas e boa compreensão oral. Recomendado plano de apoio pedagógico individualizado (PAPI) e adaptação de avaliações.', data: '2026-08-01', status: 'concluido' },
          { id: 'rec_102', agenteNome: 'Dr. Roberto Alves', agenteCargo: 'Neuropediatra', alunoNome: 'Mariana Souza', alunoMeta: '5º Ano Fundamental B (10 anos)', laudoTitulo: 'Laudo Neuropsicológico - TDAH Tipo Predominantemente Desatento', laudoDetalhes: 'Confirmado diagnóstico de TDAH. Recomendado acompanhamento semanal em psicopedagogia, tempo adicional em provas presenciais e assento estratégico na primeira fileira da sala de aula.', data: '2026-08-03', status: 'concluido' },
          { id: 'rec_103', agenteNome: 'Dra. Camila Torres', agenteCargo: 'Fonoaudiólogo(a)', alunoNome: 'Enzo Gabriel Santos', alunoMeta: 'Ed. Infantil V (5 anos)', laudoTitulo: 'Avaliação do Processamento Auditivo Central (PAC)', laudoDetalhes: 'Apresenta boa discriminação auditiva em ambiente silencioso, porém retenção de estímulos prejudicada sob ruído competitivo de fundo. Realizando sessões de treino auditivo acusticamente controlado.', data: '2026-08-04', status: 'em_andamento' },
          { id: 'rec_104', agenteNome: 'Dra. Beatriz Rocha', agenteCargo: 'Psicólogo(a)', alunoNome: 'Sophia Oliveira', alunoMeta: '7º Ano Fundamental C (12 anos)', laudoTitulo: 'Triagem de Regulação Emocional e Ansiedade Escolar', laudoDetalhes: 'Pendente recebimento das escalas comportamentais preenchidas pela equipe docente e formulário de observação familiar.', data: '2026-08-05', status: 'pendente' },
          { id: 'rec_105', agenteNome: 'Dr. Marcelo Nunes', agenteCargo: 'Terapeuta Ocupacional', alunoNome: 'Matheus Henrique', alunoMeta: '2º Ano Fundamental B (7 anos)', laudoTitulo: 'Relatório de Coordenação Visomotora e Integração Sensorial', laudoDetalhes: 'Em fase de revisão do laudo descritivo para envio à equipe pedagógica. Apresenta hipotonia leve e necessidade de adaptação na preensão do lápis.', data: '2026-08-02', status: 'revisao' }
        ];

        for (const r of initialRecords) {
          insertStmt.run(r.id, r.agenteNome, r.agenteCargo, r.alunoNome, r.alunoMeta, r.laudoTitulo, r.laudoDetalhes, r.data, r.status);
        }

        res.writeHead(200);
        res.end(JSON.stringify({ success: true, message: 'Banco de dados SQLite restaurado para o padrão!' }));
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
