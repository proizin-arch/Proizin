# İzinPro

İzinPro, tek bilgisayarda çalışan web tabanlı bir personel izin talep ve yönetim sistemidir. Personel izin talebi oluşturabilir; yönetici yalnızca kendi departmanındaki personelin taleplerini onaylayabilir veya reddedebilir; sistem yöneticisi kullanıcıları, departmanları ve izin türlerini yönetebilir.

Uygulama küçük ve anlaşılır bir kapsamda tutulmuştur. Takvim, e-posta, grafik, PDF/Excel ve harici servis bağımlılıkları yoktur. Bütün uygulama verileri yerel SQLite dosyasında saklanır.

## Teknolojiler

- Node.js 24 LTS
- Express 5
- SQLite ve better-sqlite3
- express-session ve SQLite tabanlı oturum deposu
- bcrypt
- Vanilla HTML, CSS ve JavaScript
- Inter yazı tipi ve Lucide ikonları (yerel paketlerden sunulur)

## Kurulum

Node.js 24 LTS kullanılması önerilir. Proje `.nvmrc` dosyası içerir.

```bash
nvm use
npm install
npm start
```

Ardından tarayıcıdan aşağıdaki adresi açın:

```text
http://localhost:3000
```

Uygulama ilk çalıştırmada `backend/database/izinpro.db` dosyasını, tabloları ve demo verilerini otomatik oluşturur. Sunucu kapatılıp açıldığında veriler korunur.

`nvm` kullanmıyorsanız Node.js 24 kurduktan sonra doğrudan `npm install` ve `npm start` komutlarını çalıştırabilirsiniz.

## Ortam Ayarları

Uygulama ayar olmadan lokal olarak çalışır. Sabit bir session secret kullanmak veya portu değiştirmek için `.env.example` dosyasını `.env` adıyla kopyalayın:

```env
PORT=3000
SESSION_SECRET=en-az-32-bayt-rastgele-ve-gizli-bir-deger
DB_PATH=backend/database/izinpro.db
NODE_ENV=development
```

## Demo Hesapları

| Rol | E-posta | Şifre |
| --- | --- | --- |
| Sistem Yöneticisi | `admin@izinpro.local` | `Admin123!` |
| Yönetici | `yonetici@izinpro.local` | `Yonetici123!` |
| Personel | `personel@izinpro.local` | `Personel123!` |
| İkinci Personel | `ayse@izinpro.local` | `Personel123!` |

Şifreler yalnızca demo giriş bilgisidir. SQLite içerisinde bcrypt hash olarak tutulur.

## Rol ve Yetki Sistemi

### Personel

- Kendi izin taleplerini görüntüler.
- Yeni izin talebi oluşturur.
- Yalnızca bekleyen talebini düzenler veya iptal eder.
- Kendi iletişim bilgilerini ve şifresini değiştirir.

### Yönetici

- Yalnızca kendi departmanındaki personeli ve izin taleplerini görür.
- Bekleyen talepleri açıklama ekleyerek onaylar veya reddeder.
- Tamamlanan kararları onay geçmişinde görür.
- Başka departmandaki kayıtlara API üzerinden de erişemez.

### Sistem Yöneticisi

- Bütün izin taleplerini görür ve karara bağlayabilir.
- Kullanıcı oluşturur, düzenler, pasifleştirir ve şifresini sıfırlar.
- Kullanıcı rolünü ve departmanını değiştirir.
- Departmanları ve izin türlerini yönetir.

Login ekranında rol seçimi bulunmaz. Rol, başarılı girişten sonra veritabanından belirlenir. Menülerin gizlenmesine ek olarak bütün yetki kontrolleri backend üzerinde tekrar uygulanır.

## Temel İş Akışı

1. Personel giriş yapar ve izin talebi oluşturur.
2. İş günü sayısı backend tarafından hesaplanır.
3. Talep aynı departmanın yöneticisinin ekranına düşer.
4. Yönetici talebi inceler, açıklama yazar ve onaylar veya reddeder.
5. Karar izin talebine ve değiştirilemez onay geçmişine transaction içinde kaydedilir.
6. Personel güncel sonucu kendi taleplerinde görür.

## Proje Yapısı

```text
frontend/
  login.html
  register.html
  Dashboard.html
  css/
  js/
  assets/

backend/
  config/
  controllers/
  database/
  middleware/
  repositories/
  routes/
  services/
  utils/
  app.js
  server.js

tests/
  api.test.js
```

Backend akışı `Route → Controller → Service → Repository → SQLite` şeklindedir. SQL sorguları repository katmanında, iş kuralları service katmanında tutulur.

## Veritabanı

Temel tablolar:

- `roles`
- `users`
- `departments`
- `leave_types`
- `leave_requests`
- `approval_history`
- `sessions`

Foreign key kontrolleri açıktır. Geçmiş kaydı olan kullanıcılar fiziksel olarak silinmez; hesapları pasif yapılır. İzin iptali de kaydı silmek yerine `CANCELLED` durumuna geçirir.

## API Özeti

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/change-password

GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
PATCH  /api/users/:id/status
POST   /api/users/:id/reset-password

GET    /api/departments
POST   /api/departments
PUT    /api/departments/:id
PATCH  /api/departments/:id/status

GET    /api/leave-types
POST   /api/leave-types
PUT    /api/leave-types/:id

GET    /api/leave-requests
GET    /api/leave-requests/:id
POST   /api/leave-requests
PUT    /api/leave-requests/:id
PATCH  /api/leave-requests/:id/cancel
POST   /api/leave-requests/:id/approve
POST   /api/leave-requests/:id/reject
GET    /api/leave-requests/history

GET    /api/dashboard/summary
```

Başarılı API yanıtları `{ "success": true, "data": ... }`, hatalar `{ "success": false, "message": "..." }` biçimindedir.

## Testler

```bash
npm test
```

Test paketi; authentication, rol yükseltme engeli, departman izolasyonu, izin oluşturma ve çakışma kontrolü, iş günü hesabı, onay/red geçmişi, şifre sıfırlama ve SQLite kalıcılığını kapsar.
