(function () {
  const e = UI.escapeHtml;

  function typeLabel(type) {
    return `<span class="type-dot type-${e(type.code.toLowerCase())}"></span>${e(type.name)}`;
  }

  function requestRows(requests, role) {
    return requests.map((request) => {
      let actions = `<button class="action-link" data-action="request-detail" data-id="${request.id}">Detay</button>`;
      if (role === 'PERSONNEL' && request.status === 'PENDING') {
        actions += `<button class="action-link" data-action="edit-leave" data-id="${request.id}">Düzenle</button><button class="action-link danger" data-action="cancel-leave" data-id="${request.id}">İptal</button>`;
      }
      if (['MANAGER', 'ADMIN'].includes(role) && request.status === 'PENDING') {
        actions = `<button class="action-link success" data-action="request-detail" data-id="${request.id}">Karar ver</button>`;
      }
      return `<tr>
        ${role === 'PERSONNEL' ? '' : `<td>${UI.personCell(request)}</td>`}
        <td>${typeLabel(request.leaveType)}</td>
        <td>${UI.formatDate(request.startDate)}</td><td>${UI.formatDate(request.endDate)}</td>
        <td>${request.workingDays} gün</td><td>${UI.statusBadge(request.status)}</td>
        <td><div class="row-actions">${actions}</div></td>
      </tr>`;
    }).join('');
  }

  async function showRequests(container) {
    const role = App.me.role;
    const [types, requests] = await Promise.all([Api.get('/api/leave-types'), Api.get('/api/leave-requests')]);
    container.innerHTML = `
      <div class="page-head"><div><h2>${role === 'PERSONNEL' ? 'İzin taleplerim' : 'İzin talepleri'}</h2><p>${role === 'PERSONNEL' ? 'Taleplerinizi oluşturun ve durumlarını takip edin.' : 'Yetkiniz dahilindeki personel taleplerini inceleyin.'}</p></div>${role === 'PERSONNEL' ? `<div class="page-actions"><button class="button button-primary" data-action="new-leave">${UI.icon('plus')} Yeni İzin Talebi</button></div>` : ''}</div>
      <form class="filters" id="leave-filters">
        <div class="filter-search">${UI.icon('search')}<input name="search" placeholder="${role === 'PERSONNEL' ? 'Açıklamada ara' : 'Personel veya açıklama ara'}"></div>
        <select name="leaveTypeId"><option value="">Tüm izin türleri</option>${types.map((t) => `<option value="${t.id}">${e(t.name)}</option>`).join('')}</select>
        <select name="status"><option value="">Tüm durumlar</option><option value="PENDING">Bekliyor</option><option value="APPROVED">Onaylandı</option><option value="REJECTED">Reddedildi</option><option value="CANCELLED">İptal edildi</option></select>
        <button class="button button-secondary button-small" type="submit">Filtrele</button>
      </form>
      <section class="panel" id="request-results">${renderRequestTable(requests, role)}</section>`;

    container.querySelector('#leave-filters').addEventListener('submit', async (event) => {
      event.preventDefault();
      const params = new URLSearchParams();
      new FormData(event.currentTarget).forEach((value, key) => { if (value) params.set(key, value); });
      try {
        const filtered = await Api.get(`/api/leave-requests?${params}`);
        container.querySelector('#request-results').innerHTML = renderRequestTable(filtered, role);
      } catch (error) { UI.toast(error.message, 'error'); }
    });
  }

  function renderRequestTable(requests, role) {
    if (!requests.length) return UI.emptyState('Talep bulunamadı', role === 'PERSONNEL' ? 'Henüz izin talebiniz bulunmuyor.' : 'Seçilen ölçütlere uygun izin talebi bulunmuyor.', role === 'PERSONNEL' ? 'Yeni İzin Talebi' : null, 'new-leave');
    return `<div class="table-wrap"><table class="data-table"><thead><tr>${role === 'PERSONNEL' ? '' : '<th>PERSONEL</th>'}<th>İZİN TÜRÜ</th><th>BAŞLANGIÇ</th><th>BİTİŞ</th><th>SÜRE</th><th>DURUM</th><th>İŞLEM</th></tr></thead><tbody>${requestRows(requests, role)}</tbody></table></div>`;
  }

  async function openForm(id) {
    try {
      const [types, request] = await Promise.all([
        Api.get('/api/leave-types'),
        id ? Api.get(`/api/leave-requests/${id}`) : Promise.resolve(null)
      ]);
      UI.openDrawer({
        title: id ? 'İzin talebini düzenle' : 'Yeni izin talebi',
        eyebrow: 'PERSONEL İŞLEMİ',
        content: `<form class="drawer-form" id="leave-form">
          <div class="field field-wide"><label for="leaveTypeId">İzin türü</label><select id="leaveTypeId" name="leaveTypeId" required><option value="">İzin türü seçin</option>${types.map((type) => `<option value="${type.id}" ${request?.leaveType.id === type.id ? 'selected' : ''}>${e(type.name)}</option>`).join('')}</select></div>
          <div class="field"><label for="startDate">Başlangıç tarihi</label><input id="startDate" name="startDate" type="date" value="${e(request?.startDate || '')}" required></div>
          <div class="field"><label for="endDate">Bitiş tarihi</label><input id="endDate" name="endDate" type="date" value="${e(request?.endDate || '')}" required></div>
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
            if (!start || !end || end < start) return;
            let count = 0;
            const cursor = new Date(`${start}T00:00:00Z`);
            const finish = new Date(`${end}T00:00:00Z`);
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
              App.navigate('requests');
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
      const canDecide = ['MANAGER', 'ADMIN'].includes(App.me.role) && request.status === 'PENDING';
      UI.openDrawer({
        title: canDecide ? 'Talebi incele' : 'İzin talebi detayı',
        eyebrow: canDecide ? 'ONAY İŞLEMİ' : 'TALEP DETAYI',
        content: `${App.me.role === 'PERSONNEL' ? '' : `<div class="person-cell detail-person"><span class="mini-avatar">${e(UI.initials(request.employeeName))}</span><span><strong>${e(request.employeeName)}</strong><small>${e(request.position || '')}</small></span></div>`}
          <div class="detail-list">
            <div class="detail-row"><span>İzin türü</span><strong>${e(request.leaveType.name)}</strong></div>
            <div class="detail-row"><span>Tarih aralığı</span><strong>${UI.formatDate(request.startDate)} – ${UI.formatDate(request.endDate)}</strong></div>
            <div class="detail-row"><span>İş günü</span><strong>${request.workingDays} gün</strong></div>
            <div class="detail-row"><span>Durum</span><strong>${UI.statusBadge(request.status)}</strong></div>
            <div class="detail-row"><span>Talep tarihi</span><strong>${UI.formatDateTime(request.createdAt)}</strong></div>
          </div>
          <span class="eyebrow">PERSONEL AÇIKLAMASI</span><div class="comment-box">${e(request.employeeComment || 'Açıklama girilmemiş.')}</div>
          ${request.managerComment ? `<span class="eyebrow">YÖNETİCİ AÇIKLAMASI</span><div class="comment-box">${e(request.managerComment)}</div>` : ''}
          ${canDecide ? `<form id="decision-form"><div class="field"><label for="managerComment">Yönetici açıklaması</label><textarea id="managerComment" name="managerComment" maxlength="500" placeholder="Kararınızla ilgili kısa açıklama"></textarea></div><p class="form-error" id="drawer-error" hidden></p><div class="decision-actions"><button class="button button-secondary" type="button" data-decision="REJECTED">Reddet</button><button class="button button-primary" type="button" data-decision="APPROVED">Onayla</button></div></form>` : ''}`,
        onOpen(body) {
          if (!canDecide) return;
          body.querySelectorAll('[data-decision]').forEach((button) => button.addEventListener('click', async () => {
            const decision = button.dataset.decision;
            const form = body.querySelector('#decision-form');
            const errorBox = body.querySelector('#drawer-error');
            errorBox.hidden = true;
            UI.setButtonLoading(button, true, decision === 'APPROVED' ? 'Onaylanıyor…' : 'Reddediliyor…');
            try {
              await Api.post(`/api/leave-requests/${id}/${decision === 'APPROVED' ? 'approve' : 'reject'}`, { managerComment: form.managerComment.value });
              UI.closeDrawer(); UI.toast(decision === 'APPROVED' ? 'Talep onaylandı.' : 'Talep reddedildi.'); App.navigate('requests');
            } catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; UI.setButtonLoading(button, false); }
          }));
        }
      });
    } catch (error) { UI.toast(error.message, 'error'); }
  }

  async function cancel(id) {
    if (!(await UI.confirmAction('Bu bekleyen izin talebini iptal etmek istediğinize emin misiniz?', 'Talebi İptal Et'))) return;
    try { await Api.patch(`/api/leave-requests/${id}/cancel`); UI.toast('İzin talebi iptal edildi.'); App.navigate('requests'); }
    catch (error) { UI.toast(error.message, 'error'); }
  }

  async function showHistory(container) {
    const history = await Api.get('/api/leave-requests/history');
    container.innerHTML = `<div class="page-head"><div><h2>Onay geçmişi</h2><p>Tamamlanan yönetici kararlarının değiştirilemez işlem kaydı.</p></div></div><section class="panel">${history.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>PERSONEL</th><th>İZİN TÜRÜ</th><th>KARAR</th><th>KARAR VEREN</th><th>AÇIKLAMA</th><th>TARİH</th></tr></thead><tbody>${history.map((item) => `<tr><td>${e(item.employeeName)}</td><td>${e(item.leaveTypeName)}</td><td>${UI.statusBadge(item.decision)}</td><td>${e(item.managerName)}</td><td>${e(item.comment || '—')}</td><td>${UI.formatDateTime(item.createdAt)}</td></tr>`).join('')}</tbody></table></div>` : UI.emptyState('Henüz karar bulunmuyor', 'Onaylanan veya reddedilen talepler burada listelenecek.')}</section>`;
  }

  window.LeavePages = { showRequests, showHistory, openForm, openDetail, cancel };
})();
