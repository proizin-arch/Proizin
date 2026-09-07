# İzinPro – Microsoft Visual Studio Kurulumu

Bu proje, mor simgeli **Microsoft Visual Studio** üzerinde açılıp çalıştırılabilen bir Node.js/Express web projesidir. Mavi simgeli Visual Studio Code zorunlu değildir.

## Gerekenler

1. Windows 10 veya 11
2. [Microsoft Visual Studio 2022 veya daha yenisi](https://visualstudio.microsoft.com/downloads/)
3. Visual Studio içinde **Node.js development** iş yükü
4. [Node.js 24 LTS](https://nodejs.org/en/download/)
5. İlk bağımlılık kurulumu için internet bağlantısı

Visual Studio, proje kökündeki `.vsconfig` dosyasını algıladığında eksik Node.js geliştirme bileşenlerini kurmayı teklif eder. Bu bileşen Visual Studio desteğini sağlar; Node.js 24 LTS çalışma zamanı ayrıca bilgisayara kurulmalıdır.

## İlk çalıştırma

1. ZIP dosyasını kısa ve Türkçe karakter içermeyen bir klasöre çıkarın. Örnek: `C:\Projeler\IzinPro`
2. `KURULUM.bat` dosyasına çift tıklayın.
3. Kurulum ve otomatik testler başarıyla tamamlanana kadar pencereyi kapatmayın.
4. `IzinPro.sln` dosyasına çift tıklayın.
5. Visual Studio eksik bileşen uyarısı gösterirse kurulumu onaylayıp Visual Studio'yu yeniden açın.
6. Çözüm Gezgini'nde `IzinPro` projesinin yüklendiğini kontrol edin.
7. Üstteki çalışma hedefi olarak **IzinPro - 3 Hesap** seçiliyken `F5` tuşuna basın.

İlk npm kurulumu bilgisayar ve internet hızına bağlı olarak birkaç dakika sürebilir. Sonraki açılışlar daha hızlıdır.

## Açılan adresler

Uygulama başladıktan sonra üç bağımsız oturum adresi varsayılan tarayıcıda açılır:

- Admin: http://admin.localhost:3000
- Yönetici: http://manager.localhost:3000
- Personel: http://personel.localhost:3000

Bu adreslerin üçü de aynı uygulamaya gider; farklı ana bilgisayar adları sayesinde giriş çerezleri birbirine karışmaz. İlk çalıştırmada sistem henüz yapılandırılmamışsa önce kurum ve admin hesabı oluşturulur.

## Hazır demo hesapları

Visual Studio teslim ZIP'i hazır demo veritabanıyla gelir:

| Rol | Kullanıcı adresi | Şifre |
| --- | --- | --- |
| Admin | `admin@izinpro.com` | `Admin123!` |
| Yönetici | `ali.alaya@izinpro.com` | `Yonetici123!` |
| Personel | `muhammet.ala@izinpro.com` | `Personel123!` |

Yönetici ile personel aynı **Yazılım Geliştirme** departmanındadır. Veritabanında onaylanmış, reddedilmiş ve yöneticinin kararını bekleyen örnek izin talepleri bulunur.

Sistem Ayarları'ndaki **Admin Hariç Sıfırla** işlemi, işlemi yapan admin hesabını ve şifresini korur. Diğer kullanıcılar, departmanlar, izin talepleri, onay geçmişi ve kurum ayarları temizlenir. Admin oturumu açık kalır.

## Visual Studio olmadan hızlı başlatma

Kurulum tamamlandıktan sonra `BASLAT.bat` dosyasına çift tıklamak da uygulamayı ve üç oturum adresini açar.

## Sık karşılaşılan sorunlar

### “Node.js 24 LTS gereklidir” hatası

Node.js 24 LTS sürümünü https://nodejs.org adresinden kurun. Kurulumdan sonra açık Visual Studio ve terminal pencerelerini tamamen kapatıp yeniden açın.

### Proje yüklenemedi veya JavaScript SDK bulunamadı

Visual Studio Installer'ı açın, kurulu Visual Studio sürümünde **Modify/Değiştir** seçeneğine girin ve **Node.js development** iş yükünü kurun. Ardından çözümü yeniden açın.

### Port 3000 kullanımda

Portu kullanan eski İzinPro terminalini kapatın. Gerekirse Görev Yöneticisi'nden eski `node.exe` işlemini sonlandırıp yeniden başlatın.

### Tarayıcı otomatik açılmadı

Uygulama terminalinde `IzinPro running at http://localhost:3000` yazıyorsa yukarıdaki üç adresi elle açabilirsiniz.

## Proje yapısı

```text
IzinPro.sln             Visual Studio çözümü
IzinPro.esproj          JavaScript/Node proje tanımı
.vsconfig               Visual Studio iş yükü tanımı
.vscode/launch.json     F5 hata ayıklama ayarı
backend/                Express API, servisler ve SQLite erişimi
frontend/               HTML, CSS ve tarayıcı JavaScript dosyaları
tests/                  Node.js otomatik API testleri
package.json            npm komutları ve bağımlılıklar
```

Veritabanı için SQL Server kurulmaz. Uygulama, `better-sqlite3` aracılığıyla yerel SQLite veritabanını ilk çalıştırmada otomatik oluşturur.

## Teslim paketindeki veritabanı ve eklenmeyen dosyalar

Bu teslim ZIP'inde yalnızca yukarıdaki örnek hesapları ve örnek izin taleplerini içeren, güvenli biçimde hazırlanmış `backend/database/izinpro.db` demo veritabanı bulunur. Müşterinin bilgisayarında yapılan kullanıcı, şifre, departman ve izin işlemleri bu dosyaya kalıcı olarak kaydedilir.

Gerçek kullanım sırasında oluşan başka veritabanı kopyaları ve bilgisayara özel dosyalar pakete eklenmez:

- `node_modules/`
- `.env`
- `.vs/`
- `backend/database/*.db-wal`
- `backend/database/*.db-shm`
- `backend/database/*.key`

Bağımlılıklar hedef bilgisayarda `npm ci` ile yeniden kurulur. Demo veritabanı daha sonra müşteride oluşan gerçek verilerle birlikte yalnızca o bilgisayarda kalır.
