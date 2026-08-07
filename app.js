/**
 * PAED System - Lógica de Gestão de Tabela Editável (Agente, Aluno, Laudo)
 * Integração com Banco de Dados SQLite (Server API) + Fallback para LocalStorage
 */

document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'paed_records_data_v2';
  const THEME_KEY = 'paed_theme_preference';
  const API_BASE = '/api';

  // State Management
  let records = [];
  let editingRowId = null;
  let sortConfig = { field: 'data', direction: 'desc' };
  let isUsingApi = true;

  // DOM Elements
  const tableBody = document.getElementById('table-body');
  const emptyState = document.getElementById('empty-state');
  const searchInput = document.getElementById('input-search');
  const statusFilter = document.getElementById('select-status');
  const cargoFilter = document.getElementById('select-cargo');
  const dbStatusBadge = document.getElementById('db-status-badge');
  const dbStatusText = document.getElementById('db-status-text');
  
  // Dashboard Stats
  const statAgentes = document.getElementById('stat-agentes');
  const statAlunos = document.getElementById('stat-alunos');
  const statConcluidos = document.getElementById('stat-concluidos');
  const statPendentes = document.getElementById('stat-pendentes');

  // Modals & Form
  const recordModal = document.getElementById('record-modal');
  const recordForm = document.getElementById('record-form');
  const modalTitle = document.getElementById('modal-title');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const btnCancelModal = document.getElementById('btn-cancel-modal');
  const btnNewRecord = document.getElementById('btn-new-record');

  // Form Fields
  const formId = document.getElementById('form-id');
  const formAgenteNome = document.getElementById('form-agente-nome');
  const formAgenteCargo = document.getElementById('form-agente-cargo');
  const formAlunoNome = document.getElementById('form-aluno-nome');
  const formAlunoMeta = document.getElementById('form-aluno-meta');
  const formStatus = document.getElementById('form-status');
  const formData = document.getElementById('form-data');
  const formLaudoTitulo = document.getElementById('form-laudo-titulo');
  const formLaudoDetalhes = document.getElementById('form-laudo-detalhes');

  // View Modal
  const viewModal = document.getElementById('view-modal');
  const viewContent = document.getElementById('view-content');
  const viewCloseBtn = document.getElementById('view-close-btn');
  const viewCloseFooter = document.getElementById('view-close-footer');

  // Actions
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const btnPrint = document.getElementById('btn-print');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnResetDemo = document.getElementById('btn-reset-demo');
  const toastContainer = document.getElementById('toast-container');

  // Initialize
  initTheme();
  initDataStore();
  setupEventListeners();

  // --- DATABASE & API DATA INITIALIZATION ---
  async function initDataStore() {
    try {
      const response = await fetch(`${API_BASE}/records`);
      if (response.ok) {
        records = await response.json();
        isUsingApi = true;
        updateDbBadge(true, 'SQLite Conectado');
      } else {
        throw new Error('API offline');
      }
    } catch (err) {
      console.warn('Banco de dados SQLite server não responsivo. Alternando para LocalStorage local:', err);
      isUsingApi = false;
      records = loadFromLocalStorage();
      updateDbBadge(false, 'LocalStorage (Offline)');
    }

    renderTable();
    updateStats();
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

  function loadFromLocalStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  function saveToLocalStorage(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // --- DATA MUTATIONS (DATABASE FIRST WITH FALLBACK) ---
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
    // Fallback to local
    records = [newRec, ...records];
    saveToLocalStorage(records);
    renderTable();
    updateStats();
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
    // Fallback to local
    records = records.map(r => r.id === id ? { ...r, ...updatedFields } : r);
    saveToLocalStorage(records);
    renderTable();
    updateStats();
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
    // Fallback to local
    records = records.filter(r => r.id !== id);
    saveToLocalStorage(records);
    renderTable();
    updateStats();
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
    localStorage.removeItem(STORAGE_KEY);
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

  // --- STATS COMPUTATION ---
  function updateStats() {
    const uniqueAgentes = new Set(records.map(r => r.agenteNome.trim())).size;
    const uniqueAlunos = new Set(records.map(r => r.alunoNome.trim())).size;
    const concluidos = records.filter(r => r.status === 'concluido').length;
    const pendentes = records.filter(r => r.status === 'pendente' || r.status === 'em_andamento').length;

    statAgentes.textContent = uniqueAgentes;
    statAlunos.textContent = uniqueAlunos;
    statConcluidos.textContent = concluidos;
    statPendentes.textContent = pendentes;
  }

  // --- FILTER & SORT LOGIC ---
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
      const matchCargo = !cargoVal || rec.agenteCargo === cargoVal;

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

  // --- RENDER TABLE ---
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
            <input type="text" id="inline-agente-nome-${rec.id}" class="editable-input" value="${escapeHtml(rec.agenteNome)}" placeholder="Nome Agente">
            <select id="inline-agente-cargo-${rec.id}" class="select-filter" style="padding: 4px 8px; font-size: 0.8rem;">
              <option value="Psicopedagogo(a)" ${rec.agenteCargo === 'Psicopedagogo(a)' ? 'selected' : ''}>Psicopedagogo(a)</option>
              <option value="Fonoaudiólogo(a)" ${rec.agenteCargo === 'Fonoaudiólogo(a)' ? 'selected' : ''}>Fonoaudiólogo(a)</option>
              <option value="Psicólogo(a)" ${rec.agenteCargo === 'Psicólogo(a)' ? 'selected' : ''}>Psicólogo(a)</option>
              <option value="Neuropediatra" ${rec.agenteCargo === 'Neuropediatra' ? 'selected' : ''}>Neuropediatra</option>
              <option value="Terapeuta Ocupacional" ${rec.agenteCargo === 'Terapeuta Ocupacional' ? 'selected' : ''}>Terapeuta Ocupacional</option>
            </select>
          </div>
        </td>
        <td>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <input type="text" id="inline-aluno-nome-${rec.id}" class="editable-input" value="${escapeHtml(rec.alunoNome)}" placeholder="Nome Aluno">
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

  // --- INLINE EDIT HANDLERS ---
  window.startInlineEdit = function(id) {
    editingRowId = id;
    renderTable();
  };

  window.cancelInlineEdit = function() {
    editingRowId = null;
    renderTable();
  };

  window.saveInlineEdit = async function(id) {
    const agenteNome = document.getElementById(`inline-agente-nome-${id}`).value.trim();
    const agenteCargo = document.getElementById(`inline-agente-cargo-${id}`).value;
    const alunoNome = document.getElementById(`inline-aluno-nome-${id}`).value.trim();
    const alunoMeta = document.getElementById(`inline-aluno-meta-${id}`).value.trim();
    const laudoTitulo = document.getElementById(`inline-laudo-titulo-${id}`).value.trim();
    const laudoDetalhes = document.getElementById(`inline-laudo-detalhes-${id}`).value.trim();
    const dataVal = document.getElementById(`inline-data-${id}`).value;
    const statusVal = document.getElementById(`inline-status-${id}`).value;

    if (!agenteNome || !alunoNome || !laudoTitulo) {
      showToast('Preencha os campos obrigatórios (Agente, Aluno e Título do Laudo).', 'danger');
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
    renderTable();
    showToast('Alterações salvas com sucesso no banco de dados!', 'success');
  };

  // --- DELETE RECORD ---
  window.deleteRecord = async function(id) {
    const target = records.find(r => r.id === id);
    if (!target) return;

    if (confirm(`Confirma a exclusão permanente do laudo de "${target.alunoNome}" do banco de dados?`)) {
      await deleteRecordFromDb(id);
      showToast('Registro excluído do banco de dados com sucesso.', 'info');
    }
  };

  // --- MODAL HANDLERS ---
  function openCreateModal() {
    modalTitle.innerHTML = '<i class="fa-solid fa-user-plus"></i> Novo Registro no Banco de Dados';
    recordForm.reset();
    formId.value = '';
    formData.value = new Date().toISOString().split('T')[0];
    recordModal.classList.add('active');
  }

  window.openEditModal = function(id) {
    const rec = records.find(r => r.id === id);
    if (!rec) return;

    modalTitle.innerHTML = '<i class="fa-solid fa-sliders"></i> Editar Registro no Banco de Dados';
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
      agenteCargo: formAgenteCargo.value,
      alunoNome: formAlunoNome.value.trim(),
      alunoMeta: formAlunoMeta.value.trim(),
      laudoTitulo: formLaudoTitulo.value.trim(),
      laudoDetalhes: formLaudoDetalhes.value.trim(),
      data: formData.value,
      status: formStatus.value
    };

    if (id) {
      await updateRecordInDb(id, payload);
      showToast('Registro atualizado no banco de dados!', 'success');
    } else {
      payload.id = 'rec_' + Date.now();
      await addRecordToDb(payload);
      showToast('Novo registro salvo no banco de dados SQLite!', 'success');
    }

    closeModal();
    renderTable();
  });

  // --- VIEW LAUDO MODAL ---
  window.openViewModal = function(id) {
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
          <p style="font-size: 0.85rem; color: var(--text-muted);">Data: <strong>${formatDateBR(rec.data)}</strong> | Status: <strong>${statusLabels[rec.status]}</strong></p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: var(--bg-surface-elevated); padding: 14px; border-radius: var(--radius-sm);">
          <div>
            <span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Agente / Especialista</span>
            <h4 style="font-size: 0.95rem; color: var(--text-main); font-weight: 600; margin-top: 2px;">${escapeHtml(rec.agenteNome)}</h4>
            <span style="font-size: 0.8rem; color: var(--accent);">${escapeHtml(rec.agenteCargo)}</span>
          </div>
          <div>
            <span style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Aluno / Paciente</span>
            <h4 style="font-size: 0.95rem; color: var(--text-main); font-weight: 600; margin-top: 2px;">${escapeHtml(rec.alunoNome)}</h4>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(rec.alunoMeta || 'N/A')}</span>
          </div>
        </div>

        <div>
          <h4 style="font-size: 0.9rem; color: var(--text-main); font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-align-left" style="color: var(--primary);"></i> Conteúdo e Observações Clínicas
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

  // --- EVENT LISTENERS SETUP ---
  function setupEventListeners() {
    searchInput.addEventListener('input', renderTable);
    statusFilter.addEventListener('change', renderTable);
    cargoFilter.addEventListener('change', renderTable);

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

    btnThemeToggle.addEventListener('click', toggleTheme);
    btnPrint.addEventListener('click', () => window.print());
    btnNewRecord.addEventListener('click', openCreateModal);
    modalCloseBtn.addEventListener('click', closeModal);
    btnCancelModal.addEventListener('click', closeModal);
    viewCloseBtn.addEventListener('click', closeViewModal);
    viewCloseFooter.addEventListener('click', closeViewModal);

    window.addEventListener('click', (e) => {
      if (e.target === recordModal) closeModal();
      if (e.target === viewModal) closeViewModal();
    });

    btnResetDemo.addEventListener('click', async () => {
      if (confirm('Restaurar o banco de dados SQLite para os dados de exemplo padrão?')) {
        await resetDemoDataInDb();
        showToast('Banco de dados restaurado com sucesso!', 'info');
      }
    });

    btnExportCsv.addEventListener('click', exportToCSV);
    btnExportJson.addEventListener('click', exportToJSON);
  }

  // --- EXPORTS ---
  function exportToCSV() {
    if (records.length === 0) {
      showToast('Não há dados no banco para exportar.', 'danger');
      return;
    }

    const headers = ['ID', 'Agente', 'Cargo Agente', 'Aluno', 'Info Aluno', 'Laudo Titulo', 'Laudo Detalhes', 'Data', 'Status'];
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
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `banco_sqlite_paed_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Exportação CSV concluída!', 'success');
  }

  function exportToJSON() {
    if (records.length === 0) {
      showToast('Não há dados para exportar.', 'danger');
      return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `banco_sqlite_paed_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Backup JSON do Banco baixado com sucesso!', 'success');
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
      success: '<i class="fa-solid fa-circle-check" style="color: #34d399;"></i>',
      info: '<i class="fa-solid fa-database" style="color: #6366f1;"></i>',
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
});
