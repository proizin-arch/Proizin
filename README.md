# İzinPro

İzinPro; personel izin taleplerini oluşturmak, takip etmek ve yönetmek için hazırlanmış bir web uygulamasıdır. Proje iki çalışma biçimini birlikte destekler: bilgisayarda Node.js + SQLite ile yerel kullanım ve Netlify Functions + PostgreSQL ile internet yayını.

Bu teslim paketindeki program kodu güncel sürümdür. ZIP'in içinde güvenli bir demo veritabanı bulunur. Bu nedenle ekranlar ve bütün özellikler güncel sistemle aynıdır; yalnızca örnek kullanıcılar ve örnek izin kayıtları geliştirici bilgisayarındaki çalışma verilerinden farklı olabilir.

## En kolay çalıştırma yöntemi

### Gerekli programlar

- Windows 10 veya Windows 11
- Node.js 24 LTS
- Mor simgeli Microsoft Visual Studio 2022 veya daha yeni bir sürüm
- Visual Studio içinde **Node.js development** bileşeni
- Yalnızca ilk paket kurulumu sırasında internet bağlantısı

Node.js indirme adresi: https://nodejs.org/

Visual Studio indirme adresi: https://visualstudio.microsoft.com/downloads/

### İlk kurulum

1. ZIP dosyasını normal bir klasöre çıkartın. Programı ZIP'in içinden doğrudan çalıştırmayın.
2. Kısa ve Türkçe karakter içermeyen bir klasör kullanmanız önerilir. Örnek: `C:\Projeler\IzinPro`
3. Proje klasöründeki `KURULUM.bat` dosyasına çift tıklayın.
4. Açılan pencere gerekli Node.js paketlerini kuracak ve sistem testlerini çalıştıracaktır.
5. Ekranda kurulumun başarıyla tamamlandığı yazana kadar pencereyi kapatmayın.
6. `IzinPro.sln` dosyasına çift tıklayarak projeyi Microsoft Visual Studio ile açın.
7. Visual Studio üst menüsünde **IzinPro - 3 Hesap** çalışma hedefinin seçili olduğunu kontrol edin.
8. `F5` tuşuna basın.

Sistem açıldığında admin, yönetici ve personel için üç ayrı tarayıcı adresi açılır:

- Admin: http://admin.localhost:3000
- Yönetici: http://manager.localhost:3000
- Personel: http://personel.localhost:3000

Üç adres aynı uygulamaya bağlıdır. Adresler farklı olduğu için üç hesaba aynı anda giriş yapılabilir ve hesapların oturumları birbirini kapatmaz.

Kurulum bir kere tamamlandıktan sonra Visual Studio kullanmadan `BASLAT.bat` dosyasına çift tıklayarak da sistem başlatılabilir.

## Demo giriş hesapları

| Yetki | Kullanıcı adresi | Şifre |
| --- | --- | --- |
| Admin | `admin@izinpro.com` | `Admin123!` |
| Yönetici | `ali.alaya@izinpro.com` | `Yonetici123!` |
| Personel | `muhammet.ala@izinpro.com` | `Personel123!` |

Yönetici ve personel aynı **Yazılım Geliştirme** departmanına bağlıdır. Demo veritabanında bekleyen, onaylanan ve reddedilen örnek izin talepleri bulunur.

Bu kullanıcı adresleri gerçek e-posta hesabı değildir. Yalnızca programa giriş yapmak için kullanılır.

## Programda neler yapılabilir?

### Personel hesabı

- Yeni izin talebi oluşturabilir.
- Kendi izin taleplerini ve durumlarını takip edebilir.
- Bekleyen talebini düzenleyebilir.
- Bekleyen talebini kalıcı olarak silebilir.
- Kişisel bilgilerini ve şifresini değiştirebilir.

### Yönetici hesabı

- Personel hesabındaki bütün kendi izin işlemlerini yapabilir.
- Yalnızca bağlı olduğu departmandaki çalışanları görebilir.
- Kendi departmanındaki bekleyen izin taleplerini görebilir.
- Talepleri onaylayabilir veya açıklama yazarak reddedebilir.
- Verilen kararları onay geçmişinden takip edebilir.
- Kendi izin talebini onaylayamaz.

### Admin hesabı

- Sistemdeki kullanıcıları oluşturabilir, düzenleyebilir, pasifleştirebilir ve uygun durumlarda silebilir.
- Kullanıcıya admin, yönetici veya personel yetkisi verebilir.
- Kullanıcı şifresini sıfırlayabilir ve geçici şifre oluşturabilir.
- Departman oluşturabilir, düzenleyebilir ve departmana yönetici atayabilir.
- Pozisyonları kendisi oluşturabilir ve kullanıcıları bu pozisyonlara atayabilir.
- İzin türlerini oluşturabilir, düzenleyebilir veya pasifleştirebilir.
- Bütün departmanların izin taleplerini filtreleyebilir.
- Başka kullanıcıların bekleyen izin taleplerini onaylayabilir veya reddedebilir.
- Gerekli izin kayıtlarını ve bağlı onay geçmişini kalıcı olarak silebilir.
- Kurum adını ve sistem ayarlarını değiştirebilir.
- Türkçe ve İngilizce arayüz arasında geçiş yapabilir.
- İşlem verilerini temizleyebilir veya mevcut admin hesabını koruyarak sistemi sıfırlayabilir.

Kullanılmış bir departman, pozisyon, izin türü veya kullanıcı yanlışlıkla silinemez. Önce bağlı kayıtların kaldırılması ya da ilgili kaydın pasifleştirilmesi gerekir.

## Departman ve pozisyonlar hazır mı geliyor?

Demo amacıyla örnek bir departman ve pozisyonlar bulunur. Gerçek kullanımda departmanları, pozisyonları, yöneticileri, personelleri ve izin türlerini admin hesabıyla siz oluşturabilirsiniz.

Yeni kullanıcı oluşturulduğunda giriş adresi ad ve soyada göre otomatik hazırlanır. Aynı isim daha önce kullanılmışsa adresin sonuna sıra numarası eklenir. Yeni kullanıcı ilk girişinde geçici şifresini değiştirmek zorundadır.

## Veritabanı ve kayıtların saklanması

SQL Server, MySQL veya başka bir veritabanı programı kurulmasına gerek yoktur. Uygulama SQLite kullanır.

Veritabanı dosyası:

`backend\database\izinpro.db`

Oluşturulan kullanıcılar, şifre değişiklikleri, departmanlar, pozisyonlar ve izin işlemleri bu dosyaya kalıcı olarak kaydedilir. Program veya bilgisayar kapatılıp tekrar açıldığında kayıtlar kaybolmaz.

Önemli: Güncel ZIP daha sonra aynı klasörün üzerine tekrar çıkartılırsa demo veritabanı mevcut veritabanının üzerine yazılabilir. Güncelleme yapmadan önce `backend\database\izinpro.db` dosyasını başka bir yere kopyalayarak yedekleyin.

Netlify yayınında yerel SQLite dosyası kullanılmaz. Kullanıcılar, oturumlar, departmanlar, pozisyonlar ve izin kayıtları kalıcı PostgreSQL veritabanında tutulur. Veritabanı bağlantısı ve güvenlik anahtarları GitHub'a yazılmaz; Netlify ortam değişkenlerinde saklanır.

## İnternet yayını

Canlı sürüm GitHub deposundan Netlify'a otomatik dağıtılır. `main` dalına gönderilen her onaylı güncellemede Netlify projeyi yeniden kurar. Yayın ayarları `netlify.toml`, statik paketleme `scripts/build-netlify.js`, API girişi ise `netlify/functions/api.js` dosyasındadır.

Canlı ortamda zorunlu gizli değerler:

- `NETLIFY_DB_URL`: Kalıcı PostgreSQL bağlantı adresi
- `SESSION_SECRET`: Oturum imzalama anahtarı
- `TEMP_PASSWORD_KEY`: Geçici kullanıcı şifrelerini şifreleme anahtarı

Bu değerler `.env` dosyasına veya GitHub deposuna eklenmemelidir.

## Veri temizleme seçenekleri

Admin hesabındaki **Sistem Ayarları → Veri Yönetimi** bölümünde iki ayrı işlem bulunur:

- **İşlem verilerini temizle:** İzin taleplerini ve onay geçmişini siler. Kullanıcılar, departmanlar ve kurum ayarları korunur.
- **Admin Hariç Sıfırla:** İşlemi yapan admin hesabını ve mevcut şifresini korur. Diğer kullanıcıları, departmanları, talepleri, onay geçmişini ve kurum ayarlarını temizler.

Bu işlemler normal program açılışında kendiliğinden çalışmaz. Yalnızca admin onay verirse uygulanır.

## Visual Studio Code ile çalıştırma

Mor simgeli Microsoft Visual Studio zorunlu değildir. Proje mavi simgeli Visual Studio Code ile de çalıştırılabilir.

1. ZIP'i klasöre çıkartın.
2. Klasörü Visual Studio Code ile açın.
3. VS Code içindeki Terminal menüsünden yeni terminal açın.
4. İlk kullanımda aşağıdaki komutu çalıştırın:

```bash
npm ci
```

5. Ardından uygulamayı ve üç hesap adresini açmak için:

```bash
npm run start:vs
```

Geliştirme sırasında dosya değişikliklerinde backend'in otomatik yenilenmesi istenirse `npm run dev` kullanılabilir. Bu komutta tarayıcı adresleri elle açılır.

## Programı kapatma

Program çalışırken terminal veya komut penceresini kapatmayın. Sistemi durdurmak için bu pencerede `Ctrl + C` tuşlarına basın.

## Sık karşılaşılan sorunlar

### Node.js bulunamadı

Node.js 24 LTS sürümünü kurun. Kurulumdan sonra açık Visual Studio, VS Code ve terminal pencerelerini tamamen kapatıp yeniden açın. Ardından `KURULUM.bat` dosyasını tekrar çalıştırın.

### Visual Studio projeyi yüklemiyor

Visual Studio Installer'ı açın. Kurulu Visual Studio sürümünde **Modify/Değiştir** seçeneğine girip **Node.js development** bileşenini kurun. Daha sonra `IzinPro.sln` dosyasını yeniden açın.

### Port 3000 kullanımda

Daha önce açılmış İzinPro terminalini kapatın. Gerekirse Görev Yöneticisi üzerinden eski `node.exe` işlemini sonlandırıp sistemi tekrar başlatın.

### Tarayıcı otomatik açılmadı

Terminalde `IzinPro running at http://localhost:3000` yazıyorsa sistem çalışıyor demektir. Admin, yönetici ve personel adreslerini yukarıdaki bağlantılardan elle açabilirsiniz.

### Paket kurulumu tamamlanmadı

İnternet bağlantısını kontrol edin ve `KURULUM.bat` dosyasını yeniden çalıştırın. Kurulum sırasında proje klasörünü veya terminal penceresini kapatmayın.

## Proje yapısı

```text
IzinPro.sln             Microsoft Visual Studio çözümü
IzinPro.esproj          Node.js proje tanımı
KURULUM.bat             İlk paket kurulumu ve testler
BASLAT.bat              Hızlı çalıştırma dosyası
backend/                Node.js API, yerel SQLite ve canlı PostgreSQL desteği
frontend/               Programın ekranları ve tasarımı
netlify/                Netlify Functions API girişi
netlify.toml            Netlify derleme, yönlendirme ve güvenlik ayarları
tests/                  Otomatik sistem testleri
package.json            Node.js komutları ve bağımlılıkları
```

Teknik akış `Route → Controller → Service → Repository → SQLite/PostgreSQL` şeklindedir. Backend Node.js/Express ile, kullanıcı arayüzü HTML, CSS ve JavaScript ile hazırlanmıştır.

Daha ayrıntılı Microsoft Visual Studio açıklaması için `VISUAL-STUDIO-KURULUM.md` dosyasına bakabilirsiniz.
