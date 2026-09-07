(function () {
  const e = UI.escapeHtml;

  function todayValue() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function typeLabel(type) {
    return `<span class="type-dot type-${e(type.code.toLowerCase())}"></span>${e(type.name)}`;
  }

  function requestRows(requests, scope) {
    return requests.map((request) => {
      const isMine = request.userId === App.me.id;
      let actions = `<button class="action-link" data-action="request-detail" data-id="${request.id}">Detay</button>`;
      if (isMine && request.status === 'PENDING') {
        actions += `<button class="action-link" data-action="edit-leave" data-id="${request.id}">Düzenle</button><button class="action-link danger" data-action="delete-own-leave" data-id="${request.id}">Sil</button>`;
      }
      if (!isMine && ['MANAGER', 'ADMIN'].includes(App.me.role) && request.status === 'PENDING') {
        actions = `<button class="action-link" data-action="request-detail" data-id="${request.id}">Detay</button><span class="decision-group"><button class="decision-button decision-approve" data-action="approve-leave" data-id="${request.id}">Onayla</button><button class="decision-button decision-reject" data-action="reject-leave" data-id="${request.id}">Reddet</button></span>`;
      }
      if (!isMine && App.me.role === 'ADMIN' && request.status !== 'PENDING') actions += `<button class="action-link danger" data-action="delete-leave" data-id="${request.id}">Sil</button>`;
      return `<tr>
        ${scope === 'mine' ? '' : `<td>${UI.personCell(request)}</td>`}
        <td>${typeLabel(request.leaveType)}</td>
        <td>${UI.formatDate(request.startDate)}</td><td>${UI.formatDate(request.endDate)}</td>
        <td>${request.workingDays} gün</td><td>${UI.statusBadge(request.status)}</td>
        <td class="action-cell"><div class="row-actions${!isMine && ['MANAGER', 'ADMIN'].includes(App.me.role) && request.status === 'PENDING' ? ' row-actions-managed' : ''}">${actions}</div></td>
      </tr>`;
    }).join('');
  }

  async function showRequests(container, scope = 'mine') {
    const mine = scope === 'mine';
    const canFilterDepartment = scope === 'all' && App.me.role === 'ADMIN';
    const title = mine ? 'İzin taleplerim' : scope === 'team' ? 'Departman izin talepleri' : 'Tüm izin talepleri';
    const [types, requests, departments] = await Promise.all([
      Api.get('/api/leave-types'),
      Api.get(`/api/leave-requests?scope=${scope}`),
      canFilterDepartment ? Api.get('/api/departments?activeOnly=true') : Promise.resolve([])
    ]);
    container.innerHTML = `
      <div class="page-head"><div><h2>${title}</h2><p>${mine ? 'Kendi taleplerinizi oluşturun ve durumlarını takip edin.' : 'Yetkiniz dahilindeki personel taleplerini inceleyin.'}</p></div>${mine ? `<div class="page-actions"><button class="button button-primary" data-action="new-leave">${UI.icon('plus')} Yeni İzin Talebi</button></div>` : ''}</div>
      ${mine ? '' : `<div class="request-view-tabs" role="tablist" aria-label="Talep görünümü"><button class="active" type="button" role="tab" aria-selected="true" data-request-tab="requests">Talepler</button><button type="button" role="tab" aria-selected="false" data-request-tab="history">Onay Geçmişi</button></div>`}
      <form class="filters" id="leave-filters">
        <div class="filter-search">${UI.icon('search')}<input name="search" placeholder="${mine ? 'Açıklamada ara' : 'Personel veya açıklama ara'}"></div>
        ${canFilterDepartment ? `<select name="departmentId" aria-label="Departmana göre filtrele"><option value="">Tüm departmanlar</option>${departments.map((department) => `<option value="${department.id}">${e(department.name)}</option>`).join('')}</select>` : ''}
        <select name="leaveTypeId"><option value="">Tüm izin türleri</option>${types.map((t) => `<option value="${t.id}">${e(t.name)}</option>`).join('')}</select>
        <select name="status"><option value="">Tüm durumlar</option><option value="PENDING">Bekliyor</option><option value="APPROVED">Onaylandı</option><option value="REJECTED">Reddedildi</option><option value="CANCELLED">İptal edildi</option></select>
        <button class="button button-secondary button-small" type="submit">Filtrele</button>
      </form>
      <section class="panel" id="request-results">${renderRequestTable(requests, scope)}</section>`;

    const filterForm = container.querySelector('#leave-filters');
    const results = container.querySelector('#request-results');
    let displayedRequests = requests;
    let activeTab = 'requests';
    filterForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const params = new URLSearchParams({ scope });
      new FormData(event.currentTarget).forEach((value, key) => { if (value) params.set(key, value); });
      try {
        displayedRequests = await Api.get(`/api/leave-requests?${params}`);
        results.innerHTML = renderRequestTable(displayedRequests, scope);
      } catch (error) { UI.toast(error.message, 'error'); }
    });

    container.querySelectorAll('[data-request-tab]').forEach((button) => button.addEventListener('click', async () => {
      const selected = button.dataset.requestTab;
      activeTab = selected;
      container.querySelectorAll('[data-request-tab]').forEach((item) => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-selected', String(active));
      });
      if (selected === 'requests') {
        filterForm.hidden = false;
        results.innerHTML = renderRequestTable(displayedRequests, scope);
        return;
      }
      filterForm.hidden = true;
      results.innerHTML = '<div class="page-loading compact"><span class="spinner"></span><p>Onay geçmişi yükleniyor…</p></div>';
      try {
        const history = await Api.get('/api/leave-requests/history');
        if (activeTab === 'history') results.innerHTML = renderHistoryTable(history);
      } catch (error) {
        if (activeTab === 'history') results.innerHTML = UI.emptyState('Onay geçmişi yüklenemedi', error.message);
      }
    }));
  }

  function renderRequestTable(requests, scope) {
    const mine = scope === 'mine';
    if (!requests.length) return UI.emptyState('Talep bulunamadı', mine ? 'Henüz izin talebiniz bulunmuyor.' : 'Seçilen ölçütlere uygun izin talebi bulunmuyor.', mine ? 'Yeni İzin Talebi' : null, 'new-leave');
    return `<div class="table-wrap"><table class="data-table"><thead><tr>${mine ? '' : '<th>PERSONEL</th>'}<th>İZİN TÜRÜ</th><th>BAŞLANGIÇ</th><th>BİTİŞ</th><th>SÜRE</th><th>DURUM</th><th>İŞLEM</th></tr></thead><tbody>${requestRows(requests, scope)}</tbody></table></div>`;
  }

  async function openForm(id) {
    try {
      const [types, request] = await Promise.all([
        Api.get('/api/leave-types'),
        id ? Api.get(`/api/leave-requests/${id}`) : Promise.resolve(null)
      ]);
      const today = todayValue();
      UI.openDrawer({
        title: id ? 'İzin talebini düzenle' : 'Yeni izin talebi',
        eyebrow: 'PERSONEL İŞLEMİ',
        content: `<form class="drawer-form" id="leave-form">
          <div class="field field-wide"><label for="leaveTypeId">İzin türü</label><select id="leaveTypeId" name="leaveTypeId" required><option value="">İzin türü seçin</option>${types.map((type) => `<option value="${type.id}" ${request?.leaveType.id === type.id ? 'selected' : ''}>${e(type.name)}</option>`).join('')}</select></div>
          <div class="field"><label for="startDate">Başlangıç tarihi</label><input id="startDate" name="startDate" type="date" min="${today}" value="${e(request?.startDate || '')}" required></div>
          <div class="field"><label for="endDate">Bitiş tarihi</label><input id="endDate" name="endDate" type="date" min="${e(request?.startDate || today)}" value="${e(request?.endDate || '')}" required></div>
          <div class="working-days field-wide" id="working-days">${request ? `${request.workingDays} iş günü` : 'Tarih seçildiğinde süre hesaplanır'}</div>
          <div class="field field-wide"><label for="employeeComment">Açıklama <span>(isteğe bağlı)</span></label><textarea id="employeeComment" name="employeeComment" maxlength="500" placeholder="İzin talebinizle ilgili kısa açıklama">${e(request?.employeeComment || '')}</textarea></div>
          <p class="form-error field-wide" id="drawer-error" hidden></p>
          <div class="drawer-actions"><button class="button button-secondary" type="button" data-action="close-drawer">Vazgeç</button><button class="button button-primary" type="submit">${id ? 'Değişiklikleri Kaydet' : 'Talep Oluştur'}</button></div>
        </form>`,
        onOpen(body) {
          const form = body.querySelector('#leave-form');
          const calculate = () => {
            const start = form.startDate.value;
            const end = form.endDate.value;
            form.endDate.min = start || today;
            if (end && end < form.endDate.min) form.endDate.value = '';
            if (!start || !form.endDate.value) {
              body.querySelector('#working-days').textContent = 'Tarih seçildiğinde süre hesaplanır';
              return;
            }
            let count = 0;
            const cursor = new Date(`${start}T00:00:00Z`);
            const finish = new Date(`${form.endDate.value}T00:00:00Z`);
            while (cursor <= finish) { if (![0, 6].includes(cursor.getUTCDay())) count += 1; cursor.setUTCDate(cursor.getUTCDate() + 1); }
            body.querySelector('#working-days').textContent = `${count} iş günü`;
          };
          form.startDate.addEventListener('change', calculate);
          form.endDate.addEventListener('change', calculate);
          form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const button = form.querySelector('button[type="submit"]');
            const errorBox = form.querySelector('#drawer-error');
            errorBox.hidden = true;
            UI.setButtonLoading(button, true);
            const payload = Object.fromEntries(new FormData(form).entries());
            try {
              if (id) await Api.put(`/api/leave-requests/${id}`, payload);
              else await Api.post('/api/leave-requests', payload);
              UI.closeDrawer();
              UI.toast(id ? 'İzin talebiniz güncellendi.' : 'İzin talebiniz oluşturuldu.');
              App.navigate('my-requests');
            } catch (error) {
              errorBox.textContent = error.message;
              errorBox.hidden = false;
              UI.setButtonLoading(button, false);
            }
          });
        }
      });
    } catch (error) { UI.toast(error.message, 'error'); }
  }

  async function openDetail(id) {
    try {
      const request = await Api.get(`/api/leave-requests/${id}`);
      const canDecide = ['MANAGER', 'ADMIN'].includes(App.me.role) && request.userId !== App.me.id && request.status === 'PENDING';
      UI.openDrawer({
        title: canDecide ? 'Talebi incele' : 'İzin talebi detayı',
        eyebrow: canDecide ? 'ONAY İŞLEMİ' : 'TALEP DETAYI',
        content: `${request.userId === App.me.id ? '' : `<div class="person-cell detail-person"><span class="mini-avatar">${e(UI.initials(request.employeeName))}</span><span><strong>${e(request.employeeName)}</strong><small>${e(request.position || '')}</small></span></div>`}
          <div class="detail-list">
            <div class="detail-row"><span>İzin türü</span><strong>${e(request.leaveType.name)}</strong></div>
            <div class="detail-row"><span>Tarih aralığı</span><strong>${UI.formatDate(request.startDate)} – ${UI.formatDate(request.endDate)}</strong></div>
            <div class="detail-row"><span>İş günü</span><strong>${request.workingDays} gün</strong></div>
            <div class="detail-row"><span>Durum</span><strong>${UI.statusBadge(request.status)}</strong></div>
            <div class="detail-row"><span>Talep tarihi</span><strong>${UI.formatDateTime(request.createdAt)}</strong></div>
          </div>
          <span class="eyebrow">PERSONEL AÇIKLAMASI</span><div class="comment-box">${e(request.employeeComment || 'Açıklama girilmemiş.')}</div>
          ${request.managerComment ? `<span class="eyebrow">YÖNETİCİ AÇIKLAMASI</span><div class="comment-box">${e(request.managerComment)}</div>` : ''}
          ${canDecide ? `<div class="decision-actions"><button class="button button-danger" type="button" data-action="reject-leave" data-id="${request.id}">Reddet</button><button class="button button-primary" type="button" data-action="approve-leave" data-id="${request.id}">Onayla</button></div>` : ''}`
      });
    } catch (error) { UI.toast(error.message, 'error'); }
  }

  async function openDecision(id, decision) {
    try {
      const request = await Api.get(`/api/leave-requests/${id}`);
      const allowed = ['MANAGER', 'ADMIN'].includes(App.me.role) && request.userId !== App.me.id && request.status === 'PENDING';
      if (!allowed) throw new Error('Bu talep için karar verme yetkiniz bulunmuyor.');
      const isReject = decision === 'REJECTED';
      UI.closeDrawer();
      UI.openDecisionModal({
        title: isReject ? 'İzin talebini reddet' : 'İzin talebini onayla',
        eyebrow: isReject ? 'RED KARARI' : 'ONAY KARARI',
        tone: isReject ? 'reject' : 'approve',
        content: `<div class="decision-person">${UI.personCell(request)}</div>
          <div class="decision-summary"><span>${e(request.leaveType.name)}</span><strong>${UI.formatDate(request.startDate)} – ${UI.formatDate(request.endDate)}</strong><small>${request.workingDays} gün</small></div>
          <form id="decision-modal-form"><div class="field"><label for="decisionManagerComment">${isReject ? 'Red açıklaması' : 'Yönetici açıklaması'}${isReject ? '' : ' <span>(isteğe bağlı)</span>'}</label><textarea id="decisionManagerComment" name="managerComment" maxlength="500" placeholder="Kararınızla ilgili kısa açıklama" ${isReject ? 'required' : ''}></textarea>${isReject ? '<small>Red işlemi için açıklama zorunludur.</small>' : ''}</div><p class="form-error" id="decision-modal-error" hidden></p><div class="decision-modal-actions"><button class="button button-secondary" type="button" data-action="close-decision-modal">Vazgeç</button><button class="button ${isReject ? 'button-danger' : 'button-primary'}" type="submit">${isReject ? 'Reddet' : 'Onayla'}</button></div></form>`,
        onOpen(body) {
          const form = body.querySelector('#decision-modal-form');
          form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const button = form.querySelector('button[type="submit"]');
            const errorBox = body.querySelector('#decision-modal-error');
            const managerComment = form.managerComment.value.trim();
            errorBox.hidden = true;
            if (isReject && !managerComment) {
              errorBox.textContent = 'Red işlemi için açıklama yazınız.';
              errorBox.hidden = false;
              form.managerComment.focus();
              return;
            }
            UI.setButtonLoading(button, true, isReject ? 'Reddediliyor…' : 'Onaylanıyor…');
            try {
              await Api.post(`/api/leave-requests/${id}/${isReject ? 'reject' : 'approve'}`, { managerComment });
              UI.closeDecisionModal();
              UI.toast(isReject ? 'Talep reddedildi.' : 'Talep onaylandı.');
              App.navigate(App.me.role === 'MANAGER' ? 'team-requests' : 'all-requests');
            } catch (error) {
              errorBox.textContent = error.message;
              errorBox.hidden = false;
              UI.setButtonLoading(button, false);
            }
          });
        }
      });
    } catch (error) { UI.toast(error.message, 'error'); }
  }

  async function removeOwn(id) {
    if (!(await UI.confirmAction('Bu bekleyen izin talebiniz kalıcı olarak silinecek. Devam edilsin mi?', 'Talebi Sil'))) return;
    try { await Api.delete(`/api/leave-requests/${id}/mine`); UI.toast('İzin talebiniz silindi.'); App.navigate('my-requests'); }
    catch (error) { UI.toast(error.message, 'error'); }
  }

  async function remove(id) {
    if (!(await UI.confirmAction('Bu izin talebi ve bağlı onay geçmişi veritabanından kalıcı olarak silinecek. Devam edilsin mi?', 'Kalıcı Sil'))) return;
    try { await Api.delete(`/api/leave-requests/${id}`); UI.toast('İzin talebi kalıcı olarak silindi.'); App.navigate(App.currentPage); }
    catch (error) { UI.toast(error.message, 'error'); }
  }

  function renderHistoryTable(history) {
    return history.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>PERSONEL</th><th>İZİN TÜRÜ</th><th>KARAR</th><th>KARAR VEREN</th><th>AÇIKLAMA</th><th>TARİH</th></tr></thead><tbody>${history.map((item) => `<tr><td>${e(item.employeeName)}</td><td>${e(item.leaveTypeName)}</td><td>${UI.statusBadge(item.decision)}</td><td>${e(item.managerName)}</td><td>${e(item.comment || '—')}</td><td>${UI.formatDateTime(item.createdAt)}</td></tr>`).join('')}</tbody></table></div>` : UI.emptyState('Henüz karar bulunmuyor', 'Onaylanan veya reddedilen talepler burada listelenecek.');
  }

  async function showHistory(container) {
    const history = await Api.get('/api/leave-requests/history');
    container.innerHTML = `<div class="page-head"><div><h2>Onay geçmişi</h2><p>Tamamlanan yönetici kararlarının değiştirilemez işlem kaydı.</p></div></div><section class="panel">${renderHistoryTable(history)}</section>`;
  }

  window.LeavePages = { showRequests, showHistory, openForm, openDetail, openDecision, removeOwn, remove };
})();
