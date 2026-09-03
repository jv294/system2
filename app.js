/**
 * PAED System - Lógica de Gestão de Laudos, Alunos e Ocorrências
 * Integração com Banco de Dados SQLite (Server API) + Fallback para LocalStorage
 */

document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY_LAUDOS = 'paed_records_data_v2';
  const STORAGE_KEY_OCORRENCIAS = 'paed_ocorrencias_data_v2';
  const THEME_KEY = 'paed_theme_preference';
  const API_BASE = '/api';

  // State Management
  let records = [];
  let ocorrencias = [];
  let currentTab = 'laudos'; // 'laudos' | 'ocorrencias'
  let editingRowId = null;
  let editingOcoRowId = null;
  let sortConfig = { field: 'data', direction: 'desc' };
  let sortOcoConfig = { field: 'data', direction: 'desc' };
  let isUsingApi = true;

  // --- DOM Elements ---
  // Top Badges & Tabs
  const dbStatusBadge = document.getElementById('db-status-badge');
  const dbStatusText = document.getElementById('db-status-text');
  const tabBtnLaudos = document.getElementById('tab-btn-laudos');
  const tabBtnOcorrencias = document.getElementById('tab-btn-ocorrencias');
  const sectionLaudos = document.getElementById('section-laudos');
  const sectionOcorrencias = document.getElementById('section-ocorrencias');
  const tabCountLaudos = document.getElementById('tab-count-laudos');
  const tabCountOcorrencias = document.getElementById('tab-count-ocorrencias');

  // Laudos Stats & Controls
  const statAgentes = document.getElementById('stat-agentes');
  const statAlunos = document.getElementById('stat-alunos');
  const statConcluidos = document.getElementById('stat-concluidos');
  const statPendentes = document.getElementById('stat-pendentes');
  const tableBody = document.getElementById('table-body');
  const emptyState = document.getElementById('empty-state');
  const searchInput = document.getElementById('input-search');
  const statusFilter = document.getElementById('select-status');
  const cargoFilter = document.getElementById('select-cargo');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnResetDemo = document.getElementById('btn-reset-demo');

  // Ocorrências Stats & Controls
  const statOcoTotal = document.getElementById('stat-oco-total');
  const statOcoUrgentes = document.getElementById('stat-oco-urgentes');
  const statOcoAndamento = document.getElementById('stat-oco-andamento');
  const statOcoResolvidas = document.getElementById('stat-oco-resolvidas');
  const tableOcoBody = document.getElementById('ocorrencias-table-body');
  const emptyStateOco = document.getElementById('empty-state-ocorrencias');
  const searchInputOco = document.getElementById('input-search-oco');
  const ocoTipoFilter = document.getElementById('select-oco-tipo');
  const ocoGravidadeFilter = document.getElementById('select-oco-gravidade');
  const ocoStatusFilter = document.getElementById('select-oco-status');
  const btnExportOcoCsv = document.getElementById('btn-export-oco-csv');
  const btnExportOcoJson = document.getElementById('btn-export-oco-json');

  // Modals: Laudo
  const recordModal = document.getElementById('record-modal');
  const recordForm = document.getElementById('record-form');
  const modalTitle = document.getElementById('modal-title');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const btnCancelModal = document.getElementById('btn-cancel-modal');
  const btnNewRecord = document.getElementById('btn-new-record');
  const formId = document.getElementById('form-id');
  const formAgenteNome = document.getElementById('form-agente-nome');
  const formAgenteCargo = document.getElementById('form-agente-cargo');
  const formAlunoNome = document.getElementById('form-aluno-nome');
  const formAlunoMeta = document.getElementById('form-aluno-meta');
  const formStatus = document.getElementById('form-status');
  const formData = document.getElementById('form-data');
  const formLaudoTitulo = document.getElementById('form-laudo-titulo');
  const formLaudoDetalhes = document.getElementById('form-laudo-detalhes');

  // Modals: Ocorrência
  const ocoModal = document.getElementById('ocorrencia-modal');
  const ocoForm = document.getElementById('ocorrencia-form');
  const ocoModalTitle = document.getElementById('oco-modal-title');
  const ocoModalCloseBtn = document.getElementById('oco-modal-close-btn');
  const btnCancelOcoModal = document.getElementById('btn-cancel-oco-modal');
  const btnNewOcoHeader = document.getElementById('btn-new-ocorrencia-header');
  const btnNewOcoMain = document.getElementById('btn-new-ocorrencia-main');
  const formOcoId = document.getElementById('form-oco-id');
  const formOcoAlunoNome = document.getElementById('form-oco-aluno-nome');
  const formOcoAlunoMeta = document.getElementById('form-oco-aluno-meta');
  const formOcoRegistradoPor = document.getElementById('form-oco-registrado-por');
  const formOcoProfissao = document.getElementById('form-oco-profissao');
  const formOcoTipo = document.getElementById('form-oco-tipo');
  const formOcoGravidade = document.getElementById('form-oco-gravidade');
  const formOcoData = document.getElementById('form-oco-data');
  const formOcoStatus = document.getElementById('form-oco-status');
  const formOcoTitulo = document.getElementById('form-oco-titulo');
  const formOcoDescricao = document.getElementById('form-oco-descricao');
  const formOcoMedidas = document.getElementById('form-oco-medidas');

  // Modals: View
  const viewModal = document.getElementById('view-modal');
  const viewContent = document.getElementById('view-content');
  const viewCloseBtn = document.getElementById('view-close-btn');
  const viewCloseFooter = document.getElementById('view-close-footer');

  const viewOcoModal = document.getElementById('view-oco-modal');
  const viewOcoContent = document.getElementById('view-oco-content');
  const viewOcoCloseBtn = document.getElementById('view-oco-close-btn');
  const viewOcoCloseFooter = document.getElementById('view-oco-close-footer');

  // Datalists
  const alunosDatalist = document.getElementById('alunos-datalist');
  const profissoesDatalist = document.getElementById('profissoes-datalist');

  // Actions & Import
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const btnPrint = document.getElementById('btn-print');
  const toastContainer = document.getElementById('toast-container');
  const btnImportLaudos = document.getElementById('btn-import-laudos');
  const btnImportOco = document.getElementById('btn-import-oco');

  // Import Modal Elements
  const importModal = document.getElementById('import-modal');
  const importModalTitle = document.getElementById('import-modal-title');
  const importModalCloseBtn = document.getElementById('import-modal-close-btn');
  const importUploadStep = document.getElementById('import-upload-step');
  const importReviewForm = document.getElementById('import-review-form');
  const importDropzone = document.getElementById('import-dropzone');
  const mainFileInput = document.getElementById('main-file-input');
  const btnSelectCsv = document.getElementById('btn-select-csv');
  const btnSelectPdf = document.getElementById('btn-select-pdf');
  const btnCancelImportReview = document.getElementById('btn-cancel-import-review');

  const importTargetLaudo = document.getElementById('import-target-laudo');
  const importTargetOco = document.getElementById('import-target-oco');
  const labelTargetLaudo = document.getElementById('label-target-laudo');
  const labelTargetOco = document.getElementById('label-target-oco');
  const importLaudoFields = document.getElementById('import-laudo-fields');
  const importOcoFields = document.getElementById('import-oco-fields');

  const importAlunoNome = document.getElementById('import-aluno-nome');
  const importAlunoMeta = document.getElementById('import-aluno-meta');
  const importAgenteNome = document.getElementById('import-agente-nome');
  const importAgenteCargo = document.getElementById('import-agente-cargo');

  const importLaudoStatus = document.getElementById('import-laudo-status');
  const importLaudoData = document.getElementById('import-laudo-data');
  const importLaudoTitulo = document.getElementById('import-laudo-titulo');
  const importLaudoDetalhes = document.getElementById('import-laudo-detalhes');

  const importOcoTipo = document.getElementById('import-oco-tipo');
  const importOcoGravidade = document.getElementById('import-oco-gravidade');
  const importOcoData = document.getElementById('import-oco-data');
  const importOcoStatus = document.getElementById('import-oco-status');
  const importOcoTitulo = document.getElementById('import-oco-titulo');
  const importOcoDescricao = document.getElementById('import-oco-descricao');
  const importOcoMedidas = document.getElementById('import-oco-medidas');
  const importRawText = document.getElementById('import-raw-text');

  let currentImportTarget = 'laudos';

  // PDF.js worker setup
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // Initialize
  initTheme();
  initDataStore();
  setupEventListeners();

  // --- DATABASE & API DATA INITIALIZATION ---
  async function initDataStore() {
    try {
      const [recordsRes, ocoRes] = await Promise.all([
        fetch(`${API_BASE}/records`),
        fetch(`${API_BASE}/ocorrencias`)
      ]);

      if (recordsRes.ok && ocoRes.ok) {
        records = await recordsRes.json();
        ocorrencias = await ocoRes.json();
        isUsingApi = true;
        updateDbBadge(true, 'SQLite Conectado');
      } else {
        throw new Error('API offline');
      }
    } catch (err) {
      console.warn('Banco de dados SQLite server não responsivo. Alternando para LocalStorage local:', err);
      isUsingApi = false;
      records = loadFromLocalStorage(STORAGE_KEY_LAUDOS, getDefaultRecords());
      ocorrencias = loadFromLocalStorage(STORAGE_KEY_OCORRENCIAS, getDefaultOcorrencias());
      updateDbBadge(false, 'LocalStorage (Offline)');
    }

    refreshAllViews();
  }

  function refreshAllViews() {
    updateDatalists();
    renderTable();
    renderOcorrenciasTable();
    updateStats();
    updateOcorrenciasStats();
    updateTabCounts();
  }

  function updateDbBadge(online, text) {
    if (!dbStatusBadge || !dbStatusText) return;
    dbStatusText.textContent = text;
    if (online) {
      dbStatusBadge.className = 'badge-status concluido';
    } else {
      dbStatusBadge.className = 'badge-status andamento';
    }
  }

  function loadFromLocalStorage(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return fallback || [];
  }

  function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- DATALISTS & FILTERS AUTOCOMPLETE ---
  function updateDatalists() {
    // Unique student names from both tables
    const studentSet = new Set();
    records.forEach(r => { if (r.alunoNome) studentSet.add(r.alunoNome.trim()); });
    ocorrencias.forEach(o => { if (o.alunoNome) studentSet.add(o.alunoNome.trim()); });

    if (alunosDatalist) {
      alunosDatalist.innerHTML = Array.from(studentSet)
        .sort((a, b) => a.localeCompare(b, 'pt-BR'))
        .map(name => `<option value="${escapeHtml(name)}">`)
        .join('');
    }

    // Unique professions
    const profSet = new Set([
      'Psicopedagogo(a)', 'Psicopedagoga', 'Fonoaudiólogo(a)', 'Fonoaudióloga',
      'Psicólogo(a) Escolar', 'Psicóloga', 'Neuropediatra', 'Terapeuta Ocupacional',
      'Pedagogo(a)', 'Professor(a) Titular', 'Professor(a) de Apoio (AEE)',
      'Coordenador(a) Pedagógico(a)', 'Orientador(a) Educacional', 'Diretor(a) Escolar',
      'Assistente Social', 'Monitor(a) / Auxiliar', 'paed'
    ]);
    records.forEach(r => { if (r.agenteCargo) profSet.add(r.agenteCargo.trim()); });
    ocorrencias.forEach(o => { if (o.profissaoRegistrante) profSet.add(o.profissaoRegistrante.trim()); });

    if (profissoesDatalist) {
      profissoesDatalist.innerHTML = Array.from(profSet)
        .sort((a, b) => a.localeCompare(b, 'pt-BR'))
        .map(prof => `<option value="${escapeHtml(prof)}">`)
        .join('');
    }

    // Populate Cargo/Profissão Filter in Laudos Toolbar
    if (cargoFilter) {
      const currentVal = cargoFilter.value;
      const options = ['<option value="">Todas Profissões</option>'];
      Array.from(profSet)
        .sort((a, b) => a.localeCompare(b, 'pt-BR'))
        .forEach(p => {
          options.push(`<option value="${escapeHtml(p)}" ${currentVal === p ? 'selected' : ''}>${escapeHtml(p)}</option>`);
        });
      cargoFilter.innerHTML = options.join('');
    }
  }

  // --- MUTATIONS: LAUDOS ---
  async function addRecordToDb(newRec) {
    if (isUsingApi) {
      try {
        const res = await fetch(`${API_BASE}/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRec)
        });
        if (res.ok) {
          await initDataStore();
          return true;
        }
      } catch (e) {
        console.error('Erro de envio ao banco SQLite:', e);
      }
    }
    records = [newRec, ...records];
    saveToLocalStorage(STORAGE_KEY_LAUDOS, records);
    refreshAllViews();
    return true;
  }

  async function updateRecordInDb(id, updatedFields) {
    if (isUsingApi) {
      try {
        const res = await fetch(`${API_BASE}/records/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields)
        });
        if (res.ok) {
          await initDataStore();
          return true;
        }
      } catch (e) {
        console.error('Erro de atualização no banco SQLite:', e);
      }
    }
    records = records.map(r => r.id === id ? { ...r, ...updatedFields } : r);
    saveToLocalStorage(STORAGE_KEY_LAUDOS, records);
    refreshAllViews();
    return true;
  }

  async function deleteRecordFromDb(id) {
    if (isUsingApi) {
      try {
        const res = await fetch(`${API_BASE}/records/${id}`, { method: 'DELETE' });
        if (res.ok) {
          await initDataStore();
          return true;
        }
      } catch (e) {
        console.error('Erro ao excluir no banco SQLite:', e);
      }
    }
    records = records.filter(r => r.id !== id);
    saveToLocalStorage(STORAGE_KEY_LAUDOS, records);
    refreshAllViews();
    return true;
  }

  // --- MUTATIONS: OCORRÊNCIAS ---
  async function addOcorrenciaToDb(newOco) {
    if (isUsingApi) {
      try {
        const res = await fetch(`${API_BASE}/ocorrencias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOco)
        });
        if (res.ok) {
          await initDataStore();
          return true;
        }
      } catch (e) {
        console.error('Erro de envio de ocorrência ao banco SQLite:', e);
      }
    }
    ocorrencias = [newOco, ...ocorrencias];
    saveToLocalStorage(STORAGE_KEY_OCORRENCIAS, ocorrencias);
    refreshAllViews();
    return true;
  }

  async function updateOcorrenciaInDb(id, updatedFields) {
    if (isUsingApi) {
      try {
        const res = await fetch(`${API_BASE}/ocorrencias/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields)
        });
        if (res.ok) {
          await initDataStore();
          return true;
        }
      } catch (e) {
        console.error('Erro de atualização de ocorrência no banco SQLite:', e);
      }
    }
    ocorrencias = ocorrencias.map(o => o.id === id ? { ...o, ...updatedFields } : o);
    saveToLocalStorage(STORAGE_KEY_OCORRENCIAS, ocorrencias);
    refreshAllViews();
    return true;
  }

  async function deleteOcorrenciaFromDb(id) {
    if (isUsingApi) {
      try {
        const res = await fetch(`${API_BASE}/ocorrencias/${id}`, { method: 'DELETE' });
        if (res.ok) {
          await initDataStore();
          return true;
        }
      } catch (e) {
        console.error('Erro ao remover ocorrência do banco SQLite:', e);
      }
    }
    ocorrencias = ocorrencias.filter(o => o.id !== id);
    saveToLocalStorage(STORAGE_KEY_OCORRENCIAS, ocorrencias);
    refreshAllViews();
    return true;
  }

  async function resetDemoDataInDb() {
    if (isUsingApi) {
      try {
        const res = await fetch(`${API_BASE}/reset-demo`, { method: 'POST' });
        if (res.ok) {
          await initDataStore();
          return true;
        }
      } catch (e) {
        console.error('Erro ao restaurar banco SQLite:', e);
      }
    }
    localStorage.removeItem(STORAGE_KEY_LAUDOS);
    localStorage.removeItem(STORAGE_KEY_OCORRENCIAS);
    await initDataStore();
    return true;
  }

  // --- THEME ---
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    updateThemeIcon(newTheme);
  }

  function updateThemeIcon(theme) {
    if (theme === 'dark') {
      themeIcon.className = 'fa-solid fa-sun';
      btnThemeToggle.title = 'Tema Claro';
    } else {
      themeIcon.className = 'fa-solid fa-moon';
      btnThemeToggle.title = 'Tema Escuro';
    }
  }

  // --- TAB NAVIGATION ---
  function switchTab(tabName) {
    currentTab = tabName;
    if (tabName === 'laudos') {
      tabBtnLaudos.classList.add('active');
      tabBtnOcorrencias.classList.remove('active');
      sectionLaudos.classList.add('active');
      sectionOcorrencias.classList.remove('active');
    } else {
      tabBtnOcorrencias.classList.add('active');
      tabBtnLaudos.classList.remove('active');
      sectionOcorrencias.classList.add('active');
      sectionLaudos.classList.remove('active');
    }
  }

  function updateTabCounts() {
    if (tabCountLaudos) tabCountLaudos.textContent = records.length;
    if (tabCountOcorrencias) tabCountOcorrencias.textContent = ocorrencias.length;
  }

  // --- STATS COMPUTATION ---
  function updateStats() {
    const uniqueAgentes = new Set(records.map(r => r.agenteNome.trim())).size;
    const uniqueAlunos = new Set(records.map(r => r.alunoNome.trim())).size;
    const concluidos = records.filter(r => r.status === 'concluido').length;
    const pendentes = records.filter(r => r.status === 'pendente' || r.status === 'em_andamento' || r.status === 'revisao').length;

    statAgentes.textContent = uniqueAgentes;
    statAlunos.textContent = uniqueAlunos;
    statConcluidos.textContent = concluidos;
    statPendentes.textContent = pendentes;
  }

  function updateOcorrenciasStats() {
    const total = ocorrencias.length;
    const urgentes = ocorrencias.filter(o => o.gravidade === 'Alta' || o.gravidade === 'Urgente').length;
    const andamento = ocorrencias.filter(o => o.status === 'registrada' || o.status === 'em_analise' || o.status === 'em_acompanhamento').length;
    const resolvidas = ocorrencias.filter(o => o.status === 'resolvida').length;

    statOcoTotal.textContent = total;
    statOcoUrgentes.textContent = urgentes;
    statOcoAndamento.textContent = andamento;
    statOcoResolvidas.textContent = resolvidas;
  }

  // --- FILTER & SORT LOGIC (LAUDOS) ---
  function getFilteredAndSortedRecords() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const statusVal = statusFilter.value;
    const cargoVal = cargoFilter.value;

    let filtered = records.filter(rec => {
      const matchSearch =
        rec.agenteNome.toLowerCase().includes(searchTerm) ||
        rec.agenteCargo.toLowerCase().includes(searchTerm) ||
        rec.alunoNome.toLowerCase().includes(searchTerm) ||
        (rec.alunoMeta && rec.alunoMeta.toLowerCase().includes(searchTerm)) ||
        rec.laudoTitulo.toLowerCase().includes(searchTerm) ||
        (rec.laudoDetalhes && rec.laudoDetalhes.toLowerCase().includes(searchTerm));

      const matchStatus = !statusVal || rec.status === statusVal;
      const matchCargo = !cargoVal || rec.agenteCargo.toLowerCase() === cargoVal.toLowerCase();

      return matchSearch && matchStatus && matchCargo;
    });

    filtered.sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (sortConfig.field) {
        case 'agente': valA = a.agenteNome; valB = b.agenteNome; break;
        case 'aluno': valA = a.alunoNome; valB = b.alunoNome; break;
        case 'laudo': valA = a.laudoTitulo; valB = b.laudoTitulo; break;
        case 'data': valA = a.data; valB = b.data; break;
        case 'status': valA = a.status; valB = b.status; break;
        default: valA = a.data; valB = b.data; break;
      }

      const cmp = valA.localeCompare(valB, 'pt-BR');
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }

  // --- FILTER & SORT LOGIC (OCORRÊNCIAS) ---
  function getFilteredAndSortedOcorrencias() {
    const searchTerm = searchInputOco.value.toLowerCase().trim();
    const tipoVal = ocoTipoFilter.value;
    const gravidadeVal = ocoGravidadeFilter.value;
    const statusVal = ocoStatusFilter.value;

    let filtered = ocorrencias.filter(oco => {
      const matchSearch =
        oco.alunoNome.toLowerCase().includes(searchTerm) ||
        (oco.alunoMeta && oco.alunoMeta.toLowerCase().includes(searchTerm)) ||
        oco.registradoPor.toLowerCase().includes(searchTerm) ||
        oco.profissaoRegistrante.toLowerCase().includes(searchTerm) ||
        oco.titulo.toLowerCase().includes(searchTerm) ||
        (oco.descricao && oco.descricao.toLowerCase().includes(searchTerm)) ||
        (oco.medidasTomadas && oco.medidasTomadas.toLowerCase().includes(searchTerm));

      const matchTipo = !tipoVal || oco.tipoOcorrencia === tipoVal;
      const matchGravidade = !gravidadeVal || oco.gravidade === gravidadeVal;
      const matchStatus = !statusVal || oco.status === statusVal;

      return matchSearch && matchTipo && matchGravidade && matchStatus;
    });

    filtered.sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (sortOcoConfig.field) {
        case 'aluno': valA = a.alunoNome; valB = b.alunoNome; break;
        case 'registradoPor': valA = a.registradoPor; valB = b.registradoPor; break;
        case 'tipo': valA = a.tipoOcorrencia; valB = b.tipoOcorrencia; break;
        case 'titulo': valA = a.titulo; valB = b.titulo; break;
        case 'data': valA = a.data; valB = b.data; break;
        case 'status': valA = a.status; valB = b.status; break;
        default: valA = a.data; valB = b.data; break;
      }

      const cmp = valA.localeCompare(valB, 'pt-BR');
      return sortOcoConfig.direction === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }

  // --- RENDER LAUDOS TABLE ---
  function renderTable() {
    const displayRecords = getFilteredAndSortedRecords();

    if (displayRecords.length === 0) {
      tableBody.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    tableBody.innerHTML = displayRecords.map(rec => {
      const isEditing = editingRowId === rec.id;
      return isEditing ? renderEditableRow(rec) : renderStaticRow(rec);
    }).join('');
  }

  function renderStaticRow(rec) {
    const statusBadges = {
      concluido: '<span class="badge-status concluido"><span class="badge-dot"></span>Concluído</span>',
      em_andamento: '<span class="badge-status em_andamento"><span class="badge-dot"></span>Em Andamento</span>',
      pendente: '<span class="badge-status pendente"><span class="badge-dot"></span>Pendente</span>',
      revisao: '<span class="badge-status revisao"><span class="badge-dot"></span>Em Revisão</span>'
    };

    // Check how many occurrences this student has
    const studentOcoCount = ocorrencias.filter(o => o.alunoNome.trim().toLowerCase() === rec.alunoNome.trim().toLowerCase()).length;
    const ocoBadge = studentOcoCount > 0
      ? `<span class="badge-gravidade media" style="cursor: pointer;" onclick="filterOcorrenciasForStudent('${escapeHtml(rec.alunoNome)}')"><i class="fa-solid fa-triangle-exclamation"></i> ${studentOcoCount} ocorrência(s)</span>`
      : '';

    return `
      <tr data-id="${rec.id}">
        <td>
          <div class="cell-agente">
            <span class="agente-nome">${escapeHtml(rec.agenteNome)}</span>
            <span class="agente-cargo">${escapeHtml(rec.agenteCargo)}</span>
          </div>
        </td>
        <td>
          <div class="cell-aluno">
            <span class="aluno-nome">${escapeHtml(rec.alunoNome)}</span>
            <span class="aluno-meta">${escapeHtml(rec.alunoMeta || 'Série não informada')}</span>
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 2px;">
              <button class="btn-student-oco" onclick="openCreateOcorrenciaModalForStudent('${escapeHtml(rec.alunoNome)}', '${escapeHtml(rec.alunoMeta || '')}')" title="Registrar ocorrência para este aluno">
                <i class="fa-solid fa-plus"></i> Ocorrência
              </button>
              ${ocoBadge}
            </div>
          </div>
        </td>
        <td class="cell-laudo">
          <strong style="color: var(--text-main); font-size: 0.88rem; display: block; margin-bottom: 2px;">
            ${escapeHtml(rec.laudoTitulo)}
          </strong>
          <div class="laudo-preview">
            ${escapeHtml(rec.laudoDetalhes || 'Sem detalhes adicionais.')}
          </div>
          <span class="laudo-ver-mais" onclick="openViewModal('${rec.id}')">
            <i class="fa-solid fa-eye"></i> Ler laudo completo
          </span>
        </td>
        <td style="white-space: nowrap; color: var(--text-muted); font-size: 0.85rem;">
          <i class="fa-regular fa-calendar" style="margin-right: 4px; opacity: 0.7;"></i> ${formatDateBR(rec.data)}
        </td>
        <td>
          ${statusBadges[rec.status] || rec.status}
        </td>
        <td style="text-align: right;">
          <div class="row-actions" style="justify-content: flex-end;">
            <button class="action-btn edit" onclick="startInlineEdit('${rec.id}')" title="Edição Rápida na Linha">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="action-btn edit-modal" onclick="openEditModal('${rec.id}')" title="Edição Completa em Form">
              <i class="fa-solid fa-sliders"></i>
            </button>
            <button class="action-btn delete" onclick="deleteRecord('${rec.id}')" title="Excluir do Banco de Dados">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function renderEditableRow(rec) {
    return `
      <tr data-id="${rec.id}" class="editing-row" style="background: rgba(99, 102, 241, 0.08);">
        <td>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <input type="text" id="inline-agente-nome-${rec.id}" class="editable-input" value="${escapeHtml(rec.agenteNome)}" placeholder="Nome do Profissional">
            <input type="text" id="inline-agente-cargo-${rec.id}" class="editable-input" value="${escapeHtml(rec.agenteCargo)}" list="profissoes-datalist" placeholder="Profissão/Cargo" style="font-size: 0.8rem;">
          </div>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <input type="text" id="inline-aluno-nome-${rec.id}" class="editable-input" value="${escapeHtml(rec.alunoNome)}" list="alunos-datalist" placeholder="Nome Aluno">
            <input type="text" id="inline-aluno-meta-${rec.id}" class="editable-input" value="${escapeHtml(rec.alunoMeta || '')}" placeholder="Turma/Idade" style="font-size: 0.78rem;">
          </div>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <input type="text" id="inline-laudo-titulo-${rec.id}" class="editable-input" value="${escapeHtml(rec.laudoTitulo)}" placeholder="Título do Laudo">
            <textarea id="inline-laudo-detalhes-${rec.id}" class="editable-textarea" placeholder="Detalhes do Laudo">${escapeHtml(rec.laudoDetalhes || '')}</textarea>
          </div>
        </td>
        <td>
          <input type="date" id="inline-data-${rec.id}" class="editable-input" value="${rec.data}" style="font-size: 0.8rem;">
        </td>
        <td>
          <select id="inline-status-${rec.id}" class="select-filter" style="padding: 4px 8px; font-size: 0.8rem;">
            <option value="concluido" ${rec.status === 'concluido' ? 'selected' : ''}>Concluído</option>
            <option value="em_andamento" ${rec.status === 'em_andamento' ? 'selected' : ''}>Em Andamento</option>
            <option value="pendente" ${rec.status === 'pendente' ? 'selected' : ''}>Pendente</option>
            <option value="revisao" ${rec.status === 'revisao' ? 'selected' : ''}>Em Revisão</option>
          </select>
        </td>
        <td style="text-align: right;">
          <div class="row-actions" style="justify-content: flex-end;">
            <button class="action-btn save" onclick="saveInlineEdit('${rec.id}')" title="Salvar no Banco de Dados">
              <i class="fa-solid fa-check"></i>
            </button>
            <button class="action-btn delete" onclick="cancelInlineEdit()" title="Cancelar Edição">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  // --- RENDER OCORRÊNCIAS TABLE ---
  function renderOcorrenciasTable() {
    const displayOcorrencias = getFilteredAndSortedOcorrencias();

    if (displayOcorrencias.length === 0) {
      tableOcoBody.innerHTML = '';
      emptyStateOco.style.display = 'block';
      return;
    }

    emptyStateOco.style.display = 'none';

    tableOcoBody.innerHTML = displayOcorrencias.map(oco => {
      const isEditing = editingOcoRowId === oco.id;
      return isEditing ? renderEditableOcoRow(oco) : renderStaticOcoRow(oco);
    }).join('');
  }

  function renderStaticOcoRow(oco) {
    const gravidadeClasses = {
      Baixa: 'badge-gravidade baixa',
      Media: 'badge-gravidade media',
      Alta: 'badge-gravidade alta',
      Urgente: 'badge-gravidade urgente'
    };

    const gravidadeLabels = {
      Baixa: '<i class="fa-solid fa-info-circle"></i> Baixa',
      Media: '<i class="fa-solid fa-triangle-exclamation"></i> Média',
      Alta: '<i class="fa-solid fa-fire"></i> Alta',
      Urgente: '<i class="fa-solid fa-bolt"></i> Urgente'
    };

    const statusOcoBadges = {
      registrada: '<span class="badge-status registrada"><span class="badge-dot"></span>Registrada</span>',
      em_analise: '<span class="badge-status em_analise"><span class="badge-dot"></span>Em Análise</span>',
      em_acompanhamento: '<span class="badge-status em_acompanhamento"><span class="badge-dot"></span>Em Acomp.</span>',
      resolvida: '<span class="badge-status resolvida"><span class="badge-dot"></span>Resolvida</span>'
    };

    return `
      <tr data-id="${oco.id}">
        <td>
          <div class="cell-aluno">
            <span class="aluno-nome">${escapeHtml(oco.alunoNome)}</span>
            <span class="aluno-meta">${escapeHtml(oco.alunoMeta || 'Turma não informada')}</span>
          </div>
        </td>
        <td>
          <div class="cell-agente">
            <span class="agente-nome">${escapeHtml(oco.registradoPor)}</span>
            <span class="agente-cargo">${escapeHtml(oco.profissaoRegistrante || 'Profissão não informada')}</span>
          </div>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
            <span class="badge-tipo">${escapeHtml(oco.tipoOcorrencia)}</span>
            <span class="${gravidadeClasses[oco.gravidade] || 'badge-gravidade media'}">
              ${gravidadeLabels[oco.gravidade] || oco.gravidade}
            </span>
          </div>
        </td>
        <td class="cell-laudo">
          <strong style="color: var(--text-main); font-size: 0.88rem; display: block; margin-bottom: 2px;">
            ${escapeHtml(oco.titulo)}
          </strong>
          <div class="laudo-preview">
            ${escapeHtml(oco.descricao)}
          </div>
          <span class="laudo-ver-mais" onclick="openViewOcoModal('${oco.id}')" style="color: #fbbf24;">
            <i class="fa-solid fa-file-contract"></i> Ver ocorrência completa & medidas
          </span>
        </td>
        <td style="white-space: nowrap; color: var(--text-muted); font-size: 0.85rem;">
          <i class="fa-regular fa-calendar" style="margin-right: 4px; opacity: 0.7;"></i> ${formatDateBR(oco.data)}
        </td>
        <td>
          ${statusOcoBadges[oco.status] || oco.status}
        </td>
        <td style="text-align: right;">
          <div class="row-actions" style="justify-content: flex-end;">
            <button class="action-btn edit" onclick="startInlineOcoEdit('${oco.id}')" title="Edição Rápida">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="action-btn edit-modal" onclick="openEditOcoModal('${oco.id}')" title="Editar Ocorrência em Form">
              <i class="fa-solid fa-sliders"></i>
            </button>
            <button class="action-btn delete" onclick="deleteOcorrencia('${oco.id}')" title="Excluir Ocorrência">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function renderEditableOcoRow(oco) {
    return `
      <tr data-id="${oco.id}" class="editing-row" style="background: rgba(245, 158, 11, 0.08);">
        <td>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <input type="text" id="inline-oco-aluno-${oco.id}" class="editable-input" value="${escapeHtml(oco.alunoNome)}" list="alunos-datalist" placeholder="Nome Aluno">
            <input type="text" id="inline-oco-meta-${oco.id}" class="editable-input" value="${escapeHtml(oco.alunoMeta || '')}" placeholder="Turma/Idade" style="font-size: 0.78rem;">
          </div>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <input type="text" id="inline-oco-registrante-${oco.id}" class="editable-input" value="${escapeHtml(oco.registradoPor)}" placeholder="Quem registrou">
            <input type="text" id="inline-oco-profissao-${oco.id}" class="editable-input" value="${escapeHtml(oco.profissaoRegistrante)}" list="profissoes-datalist" placeholder="Profissão" style="font-size: 0.8rem;">
          </div>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <select id="inline-oco-tipo-${oco.id}" class="select-filter" style="padding: 4px; font-size: 0.78rem;">
              <option value="Comportamental" ${oco.tipoOcorrencia === 'Comportamental' ? 'selected' : ''}>Comportamental</option>
              <option value="Pedagogica" ${oco.tipoOcorrencia === 'Pedagogica' ? 'selected' : ''}>Pedagógica</option>
              <option value="Saude" ${oco.tipoOcorrencia === 'Saude' ? 'selected' : ''}>Saúde / Médica</option>
              <option value="Disciplinar" ${oco.tipoOcorrencia === 'Disciplinar' ? 'selected' : ''}>Disciplinar</option>
              <option value="Frequencia" ${oco.tipoOcorrencia === 'Frequencia' ? 'selected' : ''}>Frequência</option>
              <option value="Outro" ${oco.tipoOcorrencia === 'Outro' ? 'selected' : ''}>Outro</option>
            </select>
            <select id="inline-oco-gravidade-${oco.id}" class="select-filter" style="padding: 4px; font-size: 0.78rem;">
              <option value="Baixa" ${oco.gravidade === 'Baixa' ? 'selected' : ''}>Baixa</option>
              <option value="Media" ${oco.gravidade === 'Media' ? 'selected' : ''}>Média</option>
              <option value="Alta" ${oco.gravidade === 'Alta' ? 'selected' : ''}>Alta</option>
              <option value="Urgente" ${oco.gravidade === 'Urgente' ? 'selected' : ''}>Urgente</option>
            </select>
          </div>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <input type="text" id="inline-oco-titulo-${oco.id}" class="editable-input" value="${escapeHtml(oco.titulo)}" placeholder="Assunto da ocorrência">
            <textarea id="inline-oco-descricao-${oco.id}" class="editable-textarea" placeholder="Descrição dos fatos">${escapeHtml(oco.descricao || '')}</textarea>
          </div>
        </td>
        <td>
          <input type="date" id="inline-oco-data-${oco.id}" class="editable-input" value="${oco.data}" style="font-size: 0.8rem;">
        </td>
        <td>
          <select id="inline-oco-status-${oco.id}" class="select-filter" style="padding: 4px 8px; font-size: 0.8rem;">
            <option value="registrada" ${oco.status === 'registrada' ? 'selected' : ''}>Registrada</option>
            <option value="em_analise" ${oco.status === 'em_analise' ? 'selected' : ''}>Em Análise</option>
            <option value="em_acompanhamento" ${oco.status === 'em_acompanhamento' ? 'selected' : ''}>Em Acomp.</option>
            <option value="resolvida" ${oco.status === 'resolvida' ? 'selected' : ''}>Resolvida</option>
          </select>
        </td>
        <td style="text-align: right;">
          <div class="row-actions" style="justify-content: flex-end;">
            <button class="action-btn save" onclick="saveInlineOcoEdit('${oco.id}')" title="Salvar Ocorrência">
              <i class="fa-solid fa-check"></i>
            </button>
            <button class="action-btn delete" onclick="cancelInlineOcoEdit()" title="Cancelar Edição">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  // --- INLINE EDIT LAUDO HANDLERS ---
  window.startInlineEdit = function (id) {
    editingRowId = id;
    renderTable();
  };

  window.cancelInlineEdit = function () {
    editingRowId = null;
    renderTable();
  };

  window.saveInlineEdit = async function (id) {
    const agenteNome = document.getElementById(`inline-agente-nome-${id}`).value.trim();
    const agenteCargo = document.getElementById(`inline-agente-cargo-${id}`).value.trim();
    const alunoNome = document.getElementById(`inline-aluno-nome-${id}`).value.trim();
    const alunoMeta = document.getElementById(`inline-aluno-meta-${id}`).value.trim();
    const laudoTitulo = document.getElementById(`inline-laudo-titulo-${id}`).value.trim();
    const laudoDetalhes = document.getElementById(`inline-laudo-detalhes-${id}`).value.trim();
    const dataVal = document.getElementById(`inline-data-${id}`).value;
    const statusVal = document.getElementById(`inline-status-${id}`).value;

    if (!agenteNome || !agenteCargo || !alunoNome || !laudoTitulo) {
      showToast('Preencha os campos obrigatórios (Profissional, Profissão, Aluno e Laudo).', 'danger');
      return;
    }

    const updatedData = {
      agenteNome,
      agenteCargo,
      alunoNome,
      alunoMeta,
      laudoTitulo,
      laudoDetalhes,
      data: dataVal,
      status: statusVal
    };

    await updateRecordInDb(id, updatedData);
    editingRowId = null;
    showToast('Laudo atualizado com sucesso no banco de dados!', 'success');
  };

  // --- INLINE EDIT OCORRÊNCIA HANDLERS ---
  window.startInlineOcoEdit = function (id) {
    editingOcoRowId = id;
    renderOcorrenciasTable();
  };

  window.cancelInlineOcoEdit = function () {
    editingOcoRowId = null;
    renderOcorrenciasTable();
  };

  window.saveInlineOcoEdit = async function (id) {
    const alunoNome = document.getElementById(`inline-oco-aluno-${id}`).value.trim();
    const alunoMeta = document.getElementById(`inline-oco-meta-${id}`).value.trim();
    const registradoPor = document.getElementById(`inline-oco-registrante-${id}`).value.trim();
    const profissaoRegistrante = document.getElementById(`inline-oco-profissao-${id}`).value.trim();
    const tipoOcorrencia = document.getElementById(`inline-oco-tipo-${id}`).value;
    const gravidade = document.getElementById(`inline-oco-gravidade-${id}`).value;
    const titulo = document.getElementById(`inline-oco-titulo-${id}`).value.trim();
    const descricao = document.getElementById(`inline-oco-descricao-${id}`).value.trim();
    const dataVal = document.getElementById(`inline-oco-data-${id}`).value;
    const statusVal = document.getElementById(`inline-oco-status-${id}`).value;

    if (!alunoNome || !registradoPor || !profissaoRegistrante || !titulo || !descricao) {
      showToast('Preencha os campos obrigatórios da ocorrência.', 'danger');
      return;
    }

    const original = ocorrencias.find(o => o.id === id);
    const updatedData = {
      alunoNome,
      alunoMeta,
      registradoPor,
      profissaoRegistrante,
      tipoOcorrencia,
      gravidade,
      titulo,
      descricao,
      medidasTomadas: original ? original.medidasTomadas : '',
      data: dataVal,
      status: statusVal
    };

    await updateOcorrenciaInDb(id, updatedData);
    editingOcoRowId = null;
    showToast('Ocorrência atualizada com sucesso!', 'success');
  };

  // --- DELETE HANDLERS ---
  window.deleteRecord = async function (id) {
    const target = records.find(r => r.id === id);
    if (!target) return;

    if (confirm(`Confirma a exclusão do laudo de "${target.alunoNome}"?`)) {
      await deleteRecordFromDb(id);
      showToast('Laudo excluído com sucesso.', 'info');
    }
  };

  window.deleteOcorrencia = async function (id) {
    const target = ocorrencias.find(o => o.id === id);
    if (!target) return;

    if (confirm(`Confirma a exclusão da ocorrência de "${target.alunoNome}"?`)) {
      await deleteOcorrenciaFromDb(id);
      showToast('Ocorrência excluída com sucesso.', 'info');
    }
  };

  // --- MODAL: CREATE / EDIT LAUDO ---
  function openCreateModal() {
    modalTitle.innerHTML = '<i class="fa-solid fa-user-plus"></i> Novo Laudo no Banco de Dados';
    recordForm.reset();
    formId.value = '';
    formData.value = new Date().toISOString().split('T')[0];
    recordModal.classList.add('active');
  }

  window.openEditModal = function (id) {
    const rec = records.find(r => r.id === id);
    if (!rec) return;

    modalTitle.innerHTML = '<i class="fa-solid fa-sliders"></i> Editar Laudo no Banco de Dados';
    formId.value = rec.id;
    formAgenteNome.value = rec.agenteNome;
    formAgenteCargo.value = rec.agenteCargo;
    formAlunoNome.value = rec.alunoNome;
    formAlunoMeta.value = rec.alunoMeta || '';
    formStatus.value = rec.status;
    formData.value = rec.data;
    formLaudoTitulo.value = rec.laudoTitulo;
    formLaudoDetalhes.value = rec.laudoDetalhes || '';

    recordModal.classList.add('active');
  };

  function closeModal() {
    recordModal.classList.remove('active');
  }

  recordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = formId.value;
    const payload = {
      agenteNome: formAgenteNome.value.trim(),
      agenteCargo: formAgenteCargo.value.trim(),
      alunoNome: formAlunoNome.value.trim(),
      alunoMeta: formAlunoMeta.value.trim(),
      laudoTitulo: formLaudoTitulo.value.trim(),
      laudoDetalhes: formLaudoDetalhes.value.trim(),
      data: formData.value,
      status: formStatus.value
    };

    if (id) {
      await updateRecordInDb(id, payload);
      showToast('Laudo atualizado no banco de dados!', 'success');
    } else {
      payload.id = 'rec_' + Date.now();
      await addRecordToDb(payload);
      showToast('Novo laudo cadastrado com sucesso!', 'success');
    }

    closeModal();
  });

  // --- MODAL: CREATE / EDIT OCORRÊNCIA ---
  function openCreateOcorrenciaModal(prefillAluno = '', prefillMeta = '') {
    ocoModalTitle.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Registrar Ocorrência do Aluno';
    ocoForm.reset();
    formOcoId.value = '';
    formOcoData.value = new Date().toISOString().split('T')[0];
    formOcoStatus.value = 'registrada';
    formOcoGravidade.value = 'Media';
    formOcoTipo.value = 'Comportamental';

    if (prefillAluno) {
      formOcoAlunoNome.value = prefillAluno;
      formOcoAlunoMeta.value = prefillMeta;
    }

    ocoModal.classList.add('active');
  }

  window.openCreateOcorrenciaModalForStudent = function (studentName, studentMeta) {
    switchTab('ocorrencias');
    openCreateOcorrenciaModal(studentName, studentMeta);
  };

  window.filterOcorrenciasForStudent = function (studentName) {
    switchTab('ocorrencias');
    searchInputOco.value = studentName;
    renderOcorrenciasTable();
  };

  window.openEditOcoModal = function (id) {
    const oco = ocorrencias.find(o => o.id === id);
    if (!oco) return;

    ocoModalTitle.innerHTML = '<i class="fa-solid fa-sliders"></i> Editar Ocorrência do Aluno';
    formOcoId.value = oco.id;
    formOcoAlunoNome.value = oco.alunoNome;
    formOcoAlunoMeta.value = oco.alunoMeta || '';
    formOcoRegistradoPor.value = oco.registradoPor;
    formOcoProfissao.value = oco.profissaoRegistrante || '';
    formOcoTipo.value = oco.tipoOcorrencia;
    formOcoGravidade.value = oco.gravidade;
    formOcoData.value = oco.data;
    formOcoStatus.value = oco.status;
    formOcoTitulo.value = oco.titulo;
    formOcoDescricao.value = oco.descricao || '';
    formOcoMedidas.value = oco.medidasTomadas || '';

    ocoModal.classList.add('active');
  };

  function closeOcoModal() {
    ocoModal.classList.remove('active');
  }

  ocoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = formOcoId.value;
    const payload = {
      alunoNome: formOcoAlunoNome.value.trim(),
      alunoMeta: formOcoAlunoMeta.value.trim(),
      registradoPor: formOcoRegistradoPor.value.trim(),
      profissaoRegistrante: formOcoProfissao.value.trim(),
      tipoOcorrencia: formOcoTipo.value,
      gravidade: formOcoGravidade.value,
      titulo: formOcoTitulo.value.trim(),
      descricao: formOcoDescricao.value.trim(),
      medidasTomadas: formOcoMedidas.value.trim(),
      data: formOcoData.value,
      status: formOcoStatus.value
    };

    if (id) {
      await updateOcorrenciaInDb(id, payload);
      showToast('Ocorrência atualizada com sucesso!', 'success');
    } else {
      payload.id = 'oco_' + Date.now();
      await addOcorrenciaToDb(payload);
      showToast('Nova ocorrência registrada com sucesso!', 'warning');
    }

    closeOcoModal();
  });

  // --- VIEW MODAL: LAUDO ---
  window.openViewModal = function (id) {
    const rec = records.find(r => r.id === id);
    if (!rec) return;

    const statusLabels = {
      concluido: 'Concluído',
      em_andamento: 'Em Andamento',
      pendente: 'Pendente',
      revisao: 'Em Revisão'
    };

    viewContent.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: var(--bg-main); padding: 14px 18px; border-radius: var(--radius-sm); border-left: 4px solid var(--primary);">
          <h3 style="font-size: 1.1rem; color: var(--text-main); margin-bottom: 4px;">${escapeHtml(rec.laudoTitulo)}</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted);">Data do Laudo: <strong>${formatDateBR(rec.data)}</strong> | Status: <strong>${statusLabels[rec.status] || rec.status}</strong></p>
        </div>

        <div class="view-detail-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: var(--bg-surface-elevated); padding: 14px; border-radius: var(--radius-sm);">
          <div>
            <span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Profissional / Registrante</span>
            <h4 style="font-size: 0.95rem; color: var(--text-main); font-weight: 600; margin-top: 2px;">${escapeHtml(rec.agenteNome)}</h4>
            <span style="font-size: 0.8rem; color: var(--accent); font-weight: 600;">${escapeHtml(rec.agenteCargo)}</span>
          </div>
          <div>
            <span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Aluno / Paciente</span>
            <h4 style="font-size: 0.95rem; color: var(--text-main); font-weight: 600; margin-top: 2px;">${escapeHtml(rec.alunoNome)}</h4>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(rec.alunoMeta || 'N/A')}</span>
          </div>
        </div>

        <div>
          <h4 style="font-size: 0.9rem; color: var(--text-main); font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-align-left" style="color: var(--primary);"></i> Detalhamento do Laudo / Observações Clínicas
          </h4>
          <div style="background: var(--bg-main); padding: 16px; border-radius: var(--radius-sm); font-size: 0.9rem; line-height: 1.6; color: var(--text-muted); white-space: pre-wrap;">
            ${escapeHtml(rec.laudoDetalhes || 'Nenhum detalhamento adicional cadastrado.')}
          </div>
        </div>
      </div>
    `;

    viewModal.classList.add('active');
  };

  function closeViewModal() {
    viewModal.classList.remove('active');
  }

  // --- VIEW MODAL: OCORRÊNCIA ---
  window.openViewOcoModal = function (id) {
    const oco = ocorrencias.find(o => o.id === id);
    if (!oco) return;

    const gravidadeClasses = {
      Baixa: 'badge-gravidade baixa',
      Media: 'badge-gravidade media',
      Alta: 'badge-gravidade alta',
      Urgente: 'badge-gravidade urgente'
    };

    const statusLabels = {
      registrada: 'Registrada',
      em_analise: 'Em Análise',
      em_acompanhamento: 'Em Acompanhamento',
      resolvida: 'Resolvida'
    };

    viewOcoContent.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: var(--bg-main); padding: 14px 18px; border-radius: var(--radius-sm); border-left: 4px solid #f59e0b;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
            <h3 style="font-size: 1.1rem; color: var(--text-main); font-weight: 700;">${escapeHtml(oco.titulo)}</h3>
            <span class="${gravidadeClasses[oco.gravidade] || 'badge-gravidade media'}">Gravidade: ${escapeHtml(oco.gravidade)}</span>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted);">
            Data: <strong>${formatDateBR(oco.data)}</strong> | 
            Tipo: <strong style="color: var(--accent);">${escapeHtml(oco.tipoOcorrencia)}</strong> | 
            Status: <strong>${statusLabels[oco.status] || oco.status}</strong>
          </p>
        </div>

        <div class="view-detail-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: var(--bg-surface-elevated); padding: 14px; border-radius: var(--radius-sm);">
          <div>
            <span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Aluno da Ocorrência</span>
            <h4 style="font-size: 0.95rem; color: var(--text-main); font-weight: 600; margin-top: 2px;">${escapeHtml(oco.alunoNome)}</h4>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(oco.alunoMeta || 'N/A')}</span>
          </div>
          <div>
            <span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Registrado por (Profissão)</span>
            <h4 style="font-size: 0.95rem; color: var(--text-main); font-weight: 600; margin-top: 2px;">${escapeHtml(oco.registradoPor)}</h4>
            <span style="font-size: 0.8rem; color: var(--accent); font-weight: 600;">${escapeHtml(oco.profissaoRegistrante || 'Profissão não informada')}</span>
          </div>
        </div>

        <div>
          <h4 style="font-size: 0.9rem; color: var(--text-main); font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-triangle-exclamation" style="color: #f59e0b;"></i> Relato Detalhado do Ocorrido
          </h4>
          <div style="background: var(--bg-main); padding: 16px; border-radius: var(--radius-sm); font-size: 0.9rem; line-height: 1.6; color: var(--text-muted); white-space: pre-wrap;">
            ${escapeHtml(oco.descricao || 'Sem descrição cadastrada.')}
          </div>
        </div>

        <div>
          <h4 style="font-size: 0.9rem; color: var(--text-main); font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-shield-halved" style="color: #34d399;"></i> Medidas Tomadas e Encaminhamentos
          </h4>
          <div style="background: var(--bg-main); padding: 16px; border-radius: var(--radius-sm); font-size: 0.9rem; line-height: 1.6; color: var(--text-muted); white-space: pre-wrap;">
            ${escapeHtml(oco.medidasTomadas || 'Nenhuma medida registrada até o momento.')}
          </div>
        </div>
      </div>
    `;

    viewOcoModal.classList.add('active');
  };

  function closeViewOcoModal() {
    viewOcoModal.classList.remove('active');
  }

  // --- EVENT LISTENERS SETUP ---
  function setupEventListeners() {
    // Tabs Switcher
    tabBtnLaudos.addEventListener('click', () => switchTab('laudos'));
    tabBtnOcorrencias.addEventListener('click', () => switchTab('ocorrencias'));

    // Laudos Search & Filter
    searchInput.addEventListener('input', renderTable);
    statusFilter.addEventListener('change', renderTable);
    cargoFilter.addEventListener('change', renderTable);

    // Ocorrências Search & Filter
    searchInputOco.addEventListener('input', renderOcorrenciasTable);
    ocoTipoFilter.addEventListener('change', renderOcorrenciasTable);
    ocoGravidadeFilter.addEventListener('change', renderOcorrenciasTable);
    ocoStatusFilter.addEventListener('change', renderOcorrenciasTable);

    // Sort Laudos Table
    document.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.getAttribute('data-sort');
        if (sortConfig.field === field) {
          sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
          sortConfig.field = field;
          sortConfig.direction = 'asc';
        }

        document.querySelectorAll('th[data-sort]').forEach(header => {
          header.classList.remove('active-sort');
          const icon = header.querySelector('.sort-icon');
          if (icon) icon.className = 'fa-solid fa-sort sort-icon';
        });

        th.classList.add('active-sort');
        const activeIcon = th.querySelector('.sort-icon');
        if (activeIcon) {
          activeIcon.className = sortConfig.direction === 'asc' ? 'fa-solid fa-sort-up sort-icon' : 'fa-solid fa-sort-down sort-icon';
        }

        renderTable();
      });
    });

    // Sort Ocorrências Table
    document.querySelectorAll('th[data-sort-oco]').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.getAttribute('data-sort-oco');
        if (sortOcoConfig.field === field) {
          sortOcoConfig.direction = sortOcoConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
          sortOcoConfig.field = field;
          sortOcoConfig.direction = 'asc';
        }

        document.querySelectorAll('th[data-sort-oco]').forEach(header => {
          header.classList.remove('active-sort');
          const icon = header.querySelector('.sort-icon');
          if (icon) icon.className = 'fa-solid fa-sort sort-icon';
        });

        th.classList.add('active-sort');
        const activeIcon = th.querySelector('.sort-icon');
        if (activeIcon) {
          activeIcon.className = sortOcoConfig.direction === 'asc' ? 'fa-solid fa-sort-up sort-icon' : 'fa-solid fa-sort-down sort-icon';
        }

        renderOcorrenciasTable();
      });
    });

    // Buttons & Theme
    btnThemeToggle.addEventListener('click', toggleTheme);
    btnPrint.addEventListener('click', () => window.print());
    btnNewRecord.addEventListener('click', openCreateModal);
    btnNewOcoHeader.addEventListener('click', () => openCreateOcorrenciaModal());
    btnNewOcoMain.addEventListener('click', () => openCreateOcorrenciaModal());

    modalCloseBtn.addEventListener('click', closeModal);
    btnCancelModal.addEventListener('click', closeModal);
    ocoModalCloseBtn.addEventListener('click', closeOcoModal);
    btnCancelOcoModal.addEventListener('click', closeOcoModal);

    viewCloseBtn.addEventListener('click', closeViewModal);
    viewCloseFooter.addEventListener('click', closeViewModal);
    viewOcoCloseBtn.addEventListener('click', closeViewOcoModal);
    viewOcoCloseFooter.addEventListener('click', closeViewOcoModal);

    window.addEventListener('click', (e) => {
      if (e.target === recordModal) closeModal();
      if (e.target === ocoModal) closeOcoModal();
      if (e.target === viewModal) closeViewModal();
      if (e.target === viewOcoModal) closeViewOcoModal();
    });

    btnResetDemo.addEventListener('click', async () => {
      if (confirm('Restaurar o banco de dados para os dados padrão de exemplo (Laudos e Ocorrências)?')) {
        await resetDemoDataInDb();
        showToast('Banco de dados restaurado com sucesso!', 'info');
      }
    });

    // Exports
    btnExportCsv.addEventListener('click', exportToCSV);
    btnExportJson.addEventListener('click', exportToJSON);
    btnExportOcoCsv.addEventListener('click', exportOcoToCSV);
    btnExportOcoJson.addEventListener('click', exportOcoToJSON);

    // Imports
    if (btnImportLaudos) btnImportLaudos.addEventListener('click', () => openImportModal('laudos'));
    if (btnImportOco) btnImportOco.addEventListener('click', () => openImportModal('ocorrencias'));
    if (importModalCloseBtn) importModalCloseBtn.addEventListener('click', closeImportModal);
    if (btnCancelImportReview) {
      btnCancelImportReview.addEventListener('click', () => {
        importUploadStep.style.display = 'block';
        importReviewForm.style.display = 'none';
        if (mainFileInput) mainFileInput.value = '';
      });
    }

    if (btnSelectCsv) {
      btnSelectCsv.addEventListener('click', (e) => {
        e.stopPropagation();
        mainFileInput.accept = '.csv, text/csv';
        mainFileInput.click();
      });
    }

    if (btnSelectPdf) {
      btnSelectPdf.addEventListener('click', (e) => {
        e.stopPropagation();
        mainFileInput.accept = '.pdf, application/pdf';
        mainFileInput.click();
      });
    }

    if (mainFileInput) {
      mainFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          processUploadedFile(e.target.files[0]);
        }
      });
    }

    if (importTargetLaudo && importTargetOco) {
      importTargetLaudo.addEventListener('change', () => setImportTarget('laudos'));
      importTargetOco.addEventListener('change', () => setImportTarget('ocorrencias'));
    }

    if (importDropzone) {
      importDropzone.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        mainFileInput.accept = '.csv, .pdf, text/csv, application/pdf';
        mainFileInput.click();
      });

      importDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        importDropzone.classList.add('dragover');
      });

      importDropzone.addEventListener('dragleave', () => {
        importDropzone.classList.remove('dragover');
      });

      importDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        importDropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          processUploadedFile(e.dataTransfer.files[0]);
        }
      });
    }

    if (importReviewForm) {
      importReviewForm.addEventListener('submit', handleImportReviewSubmit);
    }

    window.addEventListener('click', (e) => {
      if (e.target === importModal) closeImportModal();
    });
  }

  // --- IMPORT SYSTEM LOGIC ---
  function openImportModal(target = 'laudos') {
    setImportTarget(target);
    importUploadStep.style.display = 'block';
    importReviewForm.style.display = 'none';
    if (mainFileInput) mainFileInput.value = '';
    importModal.classList.add('active');
  }

  function closeImportModal() {
    importModal.classList.remove('active');
    if (mainFileInput) mainFileInput.value = '';
  }

  function setImportTarget(target) {
    currentImportTarget = target;
    if (target === 'laudos') {
      importTargetLaudo.checked = true;
      labelTargetLaudo.classList.add('active');
      labelTargetOco.classList.remove('active');
      importLaudoFields.style.display = 'block';
      importOcoFields.style.display = 'none';
    } else {
      importTargetOco.checked = true;
      labelTargetOco.classList.add('active');
      labelTargetLaudo.classList.remove('active');
      importLaudoFields.style.display = 'none';
      importOcoFields.style.display = 'block';
    }
  }

  async function processUploadedFile(file) {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv');

    if (isCsv) {
      try {
        showToast('Processando planilha CSV...', 'info');
        await importCSVFile(file);
      } catch (err) {
        console.error(err);
        showToast('Erro ao ler arquivo CSV: ' + err.message, 'danger');
      }
    } else if (isPdf) {
      try {
        showToast('Extraindo texto do laudo PDF...', 'info');
        const rawText = await extractTextFromPdf(file);
        const parsed = parseClinicalText(rawText, file.name);

        // Fill form fields
        importAlunoNome.value = parsed.alunoNome || '';
        importAlunoMeta.value = parsed.alunoMeta || '';
        importAgenteNome.value = parsed.agenteNome || '';
        importAgenteCargo.value = parsed.agenteCargo || '';

        importLaudoStatus.value = parsed.status || 'concluido';
        importLaudoData.value = parsed.data || new Date().toISOString().split('T')[0];
        importLaudoTitulo.value = parsed.titulo || '';
        importLaudoDetalhes.value = parsed.detalhes || '';

        importOcoTipo.value = parsed.tipoOcorrencia || 'Pedagogica';
        importOcoGravidade.value = parsed.gravidade || 'Media';
        importOcoData.value = parsed.data || new Date().toISOString().split('T')[0];
        importOcoStatus.value = 'registrada';
        importOcoTitulo.value = parsed.titulo || '';
        importOcoDescricao.value = parsed.detalhes || '';
        importOcoMedidas.value = '';

        importRawText.textContent = parsed.rawText || 'Nenhum texto detectado.';

        // Switch to Review Step
        importUploadStep.style.display = 'none';
        importReviewForm.style.display = 'block';
        showToast('Dados extraídos do PDF com sucesso! Revise e confirme.', 'success');
      } catch (err) {
        console.error(err);
        showToast('Erro ao processar arquivo PDF: ' + err.message, 'danger');
      }
    } else {
      showToast('Formato não suportado. Por favor, envie um arquivo .CSV ou .PDF.', 'warning');
    }
  }

  // --- PDF TEXT EXTRACTION & HEURISTICS ---
  async function extractTextFromPdf(file) {
    if (!window.pdfjsLib) {
      throw new Error('Biblioteca PDF.js não carregada');
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  }

  function parseClinicalText(text, filename = '') {
    const clean = text.replace(/\r/g, '').trim();
    const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);

    let alunoNome = '';
    let alunoMeta = '';
    let agenteNome = '';
    let agenteCargo = '';
    let data = '';
    let titulo = '';
    let detalhes = clean;
    let status = 'concluido';
    let gravidade = 'Media';
    let tipoOcorrencia = 'Pedagogica';

    // Student Name match
    const alunoMatch = clean.match(/(?:aluno|paciente|estudante|nome(?:\s+do\s+(?:aluno|paciente))?)\s*[:\-–]\s*([^\n\r,\.;]+)/i);
    if (alunoMatch) alunoNome = alunoMatch[1].trim();

    // Turma / Série / Idade
    const metaMatch = clean.match(/(?:turma|s[eé]rie|ano|idade|grau)\s*[:\-–]\s*([^\n\r,\.;]+)/i);
    if (metaMatch) alunoMeta = metaMatch[1].trim();

    // Professional / Doctor / Diagnostician
    const agenteMatch = clean.match(/(?:profissional|m[eé]dico|avaliador|registrad[ao](?:\s+por)?|psic[oó]log[ao]|psicopedagog[ao]|fonoaudi[oó]log[ao]|dr[a]?\.?)\s*[:\-–]\s*([^\n\r,;]+)/i);
    if (agenteMatch) {
      agenteNome = agenteMatch[1].trim();
    } else {
      const drMatch = clean.match(/(?:Dra?\.\s+[A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)+)/);
      if (drMatch) agenteNome = drMatch[0].trim();
    }

    // Role / Profession
    const cargosList = [
      'Psicopedagoga', 'Psicopedagogo', 'Fonoaudióloga', 'Fonoaudiólogo',
      'Neuropediatra', 'Psicóloga Escolar', 'Psicólogo Escolar', 'Psicóloga', 'Psicólogo',
      'Terapeuta Ocupacional', 'Pedagoga', 'Pedagogo', 'Professor(a) de Apoio (AEE)',
      'Professor(a) Titular', 'Professora', 'Professor', 'Coordenadora Pedagógica', 'Coordenador Pedagógico',
      'Orientador(a) Educacional', 'Assistente Social'
    ];
    for (const c of cargosList) {
      const reg = new RegExp(`\\b${c}\\b`, 'i');
      if (reg.test(clean)) {
        agenteCargo = c;
        break;
      }
    }
    if (!agenteCargo && agenteNome) agenteCargo = 'Especialista';

    // Date
    const dateMatch = clean.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      const year = dateMatch[3];
      data = `${year}-${month}-${day}`;
    } else {
      const monthsPt = {
        'janeiro': '01', 'fevereiro': '02', 'março': '03', 'marco': '03', 'abril': '04',
        'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08', 'setembro': '09',
        'outubro': '10', 'novembro': '11', 'dezembro': '12'
      };
      const textDateMatch = clean.match(/(\d{1,2})\s+de\s+([a-zçã]+)\s+de\s+(\d{4})/i);
      if (textDateMatch && monthsPt[textDateMatch[2].toLowerCase()]) {
        const day = textDateMatch[1].padStart(2, '0');
        const month = monthsPt[textDateMatch[2].toLowerCase()];
        const year = textDateMatch[3];
        data = `${year}-${month}-${day}`;
      }
    }
    if (!data) data = new Date().toISOString().split('T')[0];

    // Diagnostico / Titulo
    const diagMatch = clean.match(/(?:diagn[oó]stico|laudo(?:\s+diagn[oó]stico)?|hip[oó]tese\s+diagn[oó]stica|cid(?:\s*10|\s*11)?|assunto|t[ií]tulo)\s*[:\-–]\s*([^\n\r]+)/i);
    if (diagMatch) {
      titulo = diagMatch[1].trim();
    } else if (filename) {
      titulo = filename.replace(/\.[^/.]+$/, '').replace(/[_\-+]/g, ' ');
    } else if (lines.length > 0) {
      titulo = lines[0].substring(0, 80);
    }

    if (/urgente/i.test(clean)) gravidade = 'Urgente';
    else if (/alta\s+gravidade|grave/i.test(clean)) gravidade = 'Alta';
    else if (/baixa/i.test(clean)) gravidade = 'Baixa';

    if (/comportament/i.test(clean)) tipoOcorrencia = 'Comportamental';
    else if (/pedag[oó]gic|aprendizagem/i.test(clean)) tipoOcorrencia = 'Pedagogica';
    else if (/sa[uú]de|m[eé]dic|sensorial/i.test(clean)) tipoOcorrencia = 'Saude';
    else if (/disciplin|conflito|briga/i.test(clean)) tipoOcorrencia = 'Disciplinar';
    else if (/frequ[eê]ncia|atraso|falta/i.test(clean)) tipoOcorrencia = 'Frequencia';

    return {
      alunoNome,
      alunoMeta,
      agenteNome,
      agenteCargo,
      data,
      titulo,
      detalhes,
      status,
      gravidade,
      tipoOcorrencia,
      rawText: clean
    };
  }

  // --- CSV PARSER & IMPORT ---
  function parseCSV(text) {
    const firstLine = text.split('\n')[0] || '';
    let delimiter = ',';
    if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
      delimiter = ';';
    } else if ((firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length) {
      delimiter = '\t';
    }

    const rows = [];
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f.length > 0)) rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some(f => f.length > 0)) rows.push(currentRow);
    }
    return rows;
  }

  async function importCSVFile(file) {
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length < 2) {
      showToast('O arquivo CSV parece estar vazio ou sem linhas de dados.', 'danger');
      return;
    }

    const headerRow = rows[0].map(h => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());
    const dataRows = rows.slice(1);

    const isOco = headerRow.some(h => h.includes('gravidade') || h.includes('medida') || h.includes('tipo')) || currentImportTarget === 'ocorrencias';

    function normalizeDateStr(val) {
      if (!val) return new Date().toISOString().split('T')[0];
      const brMatch = val.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
      if (brMatch) {
        return `${brMatch[3]}-${brMatch[2].padStart(2, '0')}-${brMatch[1].padStart(2, '0')}`;
      }
      return val;
    }

    if (isOco) {
      const newItems = dataRows.map((cols, idx) => {
        const getCol = (keywords, fallback = '') => {
          const index = headerRow.findIndex(h => keywords.some(k => h.includes(k)));
          return index !== -1 && cols[index] !== undefined && cols[index] !== '' ? cols[index] : fallback;
        };

        return {
          id: 'oco_imp_' + Date.now() + '_' + idx,
          alunoNome: getCol(['aluno', 'estudante', 'paciente', 'nome'], 'Aluno'),
          alunoMeta: getCol(['info', 'turma', 'serie', 'ano', 'idade'], ''),
          registradoPor: getCol(['registrado', 'profissional', 'autor', 'agente'], 'Profissional'),
          profissaoRegistrante: getCol(['profissao', 'cargo', 'funcao'], 'Educador(a)'),
          tipoOcorrencia: getCol(['tipo'], 'Comportamental'),
          gravidade: getCol(['gravidade', 'urgencia'], 'Media'),
          titulo: getCol(['titulo', 'assunto', 'motivo'], 'Ocorrência Importada via CSV'),
          descricao: getCol(['descricao', 'relato', 'detalhe', 'ocorrencia'], 'Sem descrição detalhada.'),
          medidasTomadas: getCol(['medida', 'encaminhamento', 'providencia'], ''),
          data: normalizeDateStr(getCol(['data'])),
          status: getCol(['status'], 'registrada').toLowerCase()
        };
      });

      await addOcorrenciasBulk(newItems);
      switchTab('ocorrencias');
      showToast(`${newItems.length} ocorrência(s) importada(s) com sucesso a partir do CSV!`, 'success');
      closeImportModal();
    } else {
      const newItems = dataRows.map((cols, idx) => {
        const getCol = (keywords, fallback = '') => {
          const index = headerRow.findIndex(h => keywords.some(k => h.includes(k)));
          return index !== -1 && cols[index] !== undefined && cols[index] !== '' ? cols[index] : fallback;
        };

        return {
          id: 'rec_imp_' + Date.now() + '_' + idx,
          agenteNome: getCol(['profissional', 'registrador', 'agente', 'medico', 'autor'], 'Profissional Responsável'),
          agenteCargo: getCol(['cargo', 'profissao', 'funcao', 'especialidade'], 'Psicopedagoga'),
          alunoNome: getCol(['aluno', 'estudante', 'paciente', 'nome'], 'Aluno'),
          alunoMeta: getCol(['info', 'turma', 'serie', 'ano', 'idade'], ''),
          laudoTitulo: getCol(['titulo', 'laudo', 'diagnostico', 'assunto'], 'Laudo Importado via CSV'),
          laudoDetalhes: getCol(['detalhe', 'observac', 'laudodetalhes', 'descricao', 'relatorio'], 'Sem detalhes cadastrados.'),
          data: normalizeDateStr(getCol(['data'])),
          status: getCol(['status'], 'concluido').toLowerCase()
        };
      });

      await addRecordsBulk(newItems);
      switchTab('laudos');
      showToast(`${newItems.length} laudo(s) importado(s) com sucesso a partir do CSV!`, 'success');
      closeImportModal();
    }
  }

  // --- REVIEW FORM SUBMISSION (PDF / SINGLE IMPORT) ---
  async function handleImportReviewSubmit(e) {
    e.preventDefault();
    const isLaudo = importTargetLaudo.checked;

    if (isLaudo) {
      const payload = {
        id: 'rec_pdf_' + Date.now(),
        agenteNome: importAgenteNome.value.trim(),
        agenteCargo: importAgenteCargo.value.trim(),
        alunoNome: importAlunoNome.value.trim(),
        alunoMeta: importAlunoMeta.value.trim(),
        laudoTitulo: importLaudoTitulo.value.trim() || 'Laudo Importado de PDF',
        laudoDetalhes: importLaudoDetalhes.value.trim(),
        data: importLaudoData.value || new Date().toISOString().split('T')[0],
        status: importLaudoStatus.value
      };

      await addRecordToDb(payload);
      switchTab('laudos');
      showToast('Laudo importado e salvo com sucesso no banco de dados!', 'success');
    } else {
      const payload = {
        id: 'oco_pdf_' + Date.now(),
        alunoNome: importAlunoNome.value.trim(),
        alunoMeta: importAlunoMeta.value.trim(),
        registradoPor: importAgenteNome.value.trim(),
        profissaoRegistrante: importAgenteCargo.value.trim(),
        tipoOcorrencia: importOcoTipo.value,
        gravidade: importOcoGravidade.value,
        titulo: importOcoTitulo.value.trim() || 'Ocorrência Importada de PDF',
        descricao: importOcoDescricao.value.trim(),
        medidasTomadas: importOcoMedidas.value.trim(),
        data: importOcoData.value || new Date().toISOString().split('T')[0],
        status: importOcoStatus.value
      };

      await addOcorrenciaToDb(payload);
      switchTab('ocorrencias');
      showToast('Ocorrência importada e salva com sucesso!', 'success');
    }

    closeImportModal();
  }

  // --- BULK DATABASE HELPERS ---
  async function addRecordsBulk(newRecs) {
    if (isUsingApi) {
      try {
        for (const r of newRecs) {
          await fetch(`${API_BASE}/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(r)
          });
        }
        await initDataStore();
        return true;
      } catch (e) {
        console.error('Erro na importação via API:', e);
      }
    }
    records = [...newRecs, ...records];
    saveToLocalStorage(STORAGE_KEY_LAUDOS, records);
    refreshAllViews();
    return true;
  }

  async function addOcorrenciasBulk(newOcos) {
    if (isUsingApi) {
      try {
        for (const o of newOcos) {
          await fetch(`${API_BASE}/ocorrencias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(o)
          });
        }
        await initDataStore();
        return true;
      } catch (e) {
        console.error('Erro na importação de ocorrências via API:', e);
      }
    }
    ocorrencias = [...newOcos, ...ocorrencias];
    saveToLocalStorage(STORAGE_KEY_OCORRENCIAS, ocorrencias);
    refreshAllViews();
    return true;
  }

  // --- EXPORTS: LAUDOS ---
  function exportToCSV() {
    if (records.length === 0) {
      showToast('Não há laudos para exportar.', 'danger');
      return;
    }

    const headers = ['ID', 'Profissional', 'Profissão/Cargo', 'Aluno', 'Info Aluno', 'Laudo Titulo', 'Laudo Detalhes', 'Data', 'Status'];
    const rows = records.map(r => [
      r.id,
      `"${(r.agenteNome || '').replace(/"/g, '""')}"`,
      `"${(r.agenteCargo || '').replace(/"/g, '""')}"`,
      `"${(r.alunoNome || '').replace(/"/g, '""')}"`,
      `"${(r.alunoMeta || '').replace(/"/g, '""')}"`,
      `"${(r.laudoTitulo || '').replace(/"/g, '""')}"`,
      `"${(r.laudoDetalhes || '').replace(/"/g, '""')}"`,
      r.data,
      r.status
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    downloadFile(csvContent, `laudos_paed_export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
    showToast('Exportação de Laudos (CSV) concluída!', 'success');
  }

  function exportToJSON() {
    if (records.length === 0) {
      showToast('Não há laudos para exportar.', 'danger');
      return;
    }
    const dataStr = JSON.stringify(records, null, 2);
    downloadFile(dataStr, `laudos_paed_backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json;charset=utf-8;');
    showToast('Backup JSON de Laudos baixado!', 'success');
  }

  // --- EXPORTS: OCORRÊNCIAS ---
  function exportOcoToCSV() {
    if (ocorrencias.length === 0) {
      showToast('Não há ocorrências para exportar.', 'danger');
      return;
    }

    const headers = ['ID', 'Aluno', 'Info Aluno', 'Registrado Por', 'Profissão Registrante', 'Tipo', 'Gravidade', 'Título', 'Descrição', 'Medidas Tomadas', 'Data', 'Status'];
    const rows = ocorrencias.map(o => [
      o.id,
      `"${(o.alunoNome || '').replace(/"/g, '""')}"`,
      `"${(o.alunoMeta || '').replace(/"/g, '""')}"`,
      `"${(o.registradoPor || '').replace(/"/g, '""')}"`,
      `"${(o.profissaoRegistrante || '').replace(/"/g, '""')}"`,
      `"${(o.tipoOcorrencia || '').replace(/"/g, '""')}"`,
      `"${(o.gravidade || '').replace(/"/g, '""')}"`,
      `"${(o.titulo || '').replace(/"/g, '""')}"`,
      `"${(o.descricao || '').replace(/"/g, '""')}"`,
      `"${(o.medidasTomadas || '').replace(/"/g, '""')}"`,
      o.data,
      o.status
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    downloadFile(csvContent, `ocorrencias_alunos_export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
    showToast('Exportação de Ocorrências (CSV) concluída!', 'success');
  }

  function exportOcoToJSON() {
    if (ocorrencias.length === 0) {
      showToast('Não há ocorrências para exportar.', 'danger');
      return;
    }
    const dataStr = JSON.stringify(ocorrencias, null, 2);
    downloadFile(dataStr, `ocorrencias_alunos_backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json;charset=utf-8;');
    showToast('Backup JSON de Ocorrências baixado!', 'success');
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
      success: '<i class="fa-solid fa-circle-check" style="color: #34d399;"></i>',
      info: '<i class="fa-solid fa-database" style="color: #6366f1;"></i>',
      warning: '<i class="fa-solid fa-triangle-exclamation" style="color: #fbbf24;"></i>',
      danger: '<i class="fa-solid fa-circle-exclamation" style="color: #f87171;"></i>'
    };

    toast.innerHTML = `${icons[type] || ''} <span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function formatDateBR(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Default Fallbacks if offline
  function getDefaultRecords() {
    return [
      { id: 'rec_101', agenteNome: 'Dra. Patrícia Lima', agenteCargo: 'Psicopedagoga', alunoNome: 'Lucas Mendes', alunoMeta: '3º Ano Fundamental A (8 anos)', laudoTitulo: 'Avaliação Psicopedagógica - Indicadores de Dislexia', laudoDetalhes: 'Apresenta oscilação na velocidade de leitura, fadiga na decodificação de fonemas e boa compreensão oral.', data: '2026-08-01', status: 'concluido' },
      { id: 'rec_102', agenteNome: 'Dr. Roberto Alves', agenteCargo: 'Neuropediatra', alunoNome: 'Mariana Souza', alunoMeta: '5º Ano Fundamental B (10 anos)', laudoTitulo: 'Laudo Neuropsicológico - TDAH Tipo Predominantemente Desatento', laudoDetalhes: 'Confirmado diagnóstico de TDAH. Recomendado acompanhamento semanal em psicopedagogia.', data: '2026-08-03', status: 'concluido' }
    ];
  }

  function getDefaultOcorrencias() {
    return [
      { id: 'oco_201', alunoNome: 'Lucas Mendes', alunoMeta: '3º Ano Fundamental A (8 anos)', registradoPor: 'Profª Cláudia Silveira', profissaoRegistrante: 'Professora Titular', tipoOcorrencia: 'Comportamental', gravidade: 'Media', titulo: 'Crise de frustração durante atividade de leitura coletiva', descricao: 'Durante a leitura compartilhada em sala, o aluno demonstrou grande sobrecarga.', medidasTomadas: 'Aluno acolhido no espaço calmo da sala. Conversa individualizada realizada.', data: '2026-08-10', status: 'em_acompanhamento' }
    ];
  }
});
