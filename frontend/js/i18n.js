(function () {
  const STORAGE_KEY = 'izinpro.language';
  const supported = ['tr', 'en'];
  const saved = localStorage.getItem(STORAGE_KEY);
  let language = supported.includes(saved) ? saved : 'tr';
  const originalText = new WeakMap();
  const originalAttributes = new WeakMap();
  const originalValues = new WeakMap();
  const originalTitle = document.title;

  const en = {
    'Giriş Yap | İzinPro': 'Sign In | İzinPro',
    'İlk Kurulum | İzinPro': 'Initial Setup | İzinPro',
    'Şifrenizi Değiştirin | İzinPro': 'Change Your Password | İzinPro',
    'İzinPro personel izin yönetim sistemi': 'İzinPro employee leave management system',
    'İzinPro ilk kurulum': 'İzinPro initial setup',
    'İzinPro geçici şifre değişimi': 'İzinPro temporary password change',
    'İzinPro yönetim paneli': 'İzinPro management dashboard',
    'İzinPro tanıtımı': 'About İzinPro',
    'İzinPro ana sayfa': 'İzinPro home page',
    'Dil seçimi': 'Language selection',
    'Türkçe': 'Turkish',
    'Ana menü': 'Main menu',
    'Menüyü aç': 'Open menu',
    'Kapat': 'Close',
    'Şifreyi göster': 'Show password',
    'Şifreyi gizle': 'Hide password',
    'PERSONEL İZİN YÖNETİMİ': 'EMPLOYEE LEAVE MANAGEMENT',
    'İzin süreçleri': 'Leave management,',
    'tek yerde, kolayca.': 'all in one place.',
    'Talebinizi oluşturun, durumunu takip edin ve ekibinizin izin süreçlerini düzenli yönetin.': 'Create requests, track their status, and keep your team’s leave process organized.',
    'Eylül 2026': 'September 2026',
    'Planlı': 'Scheduled',
    'Pzt': 'Mon', 'Sal': 'Tue', 'Çar': 'Wed', 'Per': 'Thu', 'Cum': 'Fri',
    'Talep onaylandı': 'Request approved',
    'Şifreler güvenli biçimde saklanır; erişim yetkilere göre sınırlandırılır.': 'Passwords are stored securely, and access is limited by role.',
    'HOŞ GELDİNİZ': 'WELCOME',
    'Hesabınıza giriş yapın': 'Sign in to your account',
    'Devam etmek için kurum kullanıcı adresinizi ve şifrenizi girin.': 'Enter your organization username and password to continue.',
    'Kullanıcı adresi': 'Username',
    'Şifre': 'Password',
    'Şifrenizi girin': 'Enter your password',
    'Beni hatırla': 'Remember me',
    'Giriş Yap': 'Sign In',
    'Giriş yapılıyor…': 'Signing in…',
    'Yeni hesaplar yalnızca admin tarafından oluşturulur.': 'New accounts can only be created by an administrator.',
    'İLK KURULUM': 'INITIAL SETUP',
    'Kurumunuzu ve ana yöneticiyi oluşturun': 'Create your organization and primary administrator',
    'Bu adım yalnızca bir kez gösterilir. Daha sonra departmanları ve kullanıcıları yönetim panelinden ekleyebilirsiniz.': 'This step is shown only once. You can add departments and users later from the management dashboard.',
    'Kurum adı': 'Organization name',
    'Örn. İzinPro Teknoloji': 'e.g. İzinPro Technology',
    'Admin adı': 'Administrator first name',
    'Admin soyadı': 'Administrator last name',
    'Oluşturulacak kullanıcı adresi': 'Username to be created',
    'Oluşturulacak admin adresi': 'Administrator username',
    "Bu adres yalnızca İzinPro'ya giriş yapmak için kullanılır; e-posta göndermez.": 'This address is used only to sign in to İzinPro; it does not send email.',
    'Pozisyon': 'Position',
    'Sistem Yöneticisi': 'System Administrator',
    'İşe giriş tarihi': 'Start date',
    'Admin şifresi': 'Administrator password',
    'En az 8 karakter; büyük/küçük harf, rakam ve özel karakter.': 'At least 8 characters, including uppercase, lowercase, a number, and a special character.',
    'Şifre tekrar': 'Confirm password',
    'Kurulumu Tamamla': 'Complete Setup',
    'Kurulum tamamlanıyor…': 'Completing setup…',
    'HESAP GÜVENLİĞİ': 'ACCOUNT SECURITY',
    'Yeni şifrenizi belirleyin': 'Set your new password',
    'Hesabınız için yalnızca sizin bildiğiniz güçlü bir şifre oluşturun.': 'Create a strong password for your account that only you know.',
    'Geçici şifre': 'Temporary password',
    'Yeni şifre': 'New password',
    'Yeni şifre tekrar': 'Confirm new password',
    'Şifreyi Kaydet ve Devam Et': 'Save Password and Continue',
    'Başka hesapla giriş yap': 'Sign in with another account',
    'GENEL': 'GENERAL', 'HESABIM': 'MY ACCOUNT', 'YÖNETİM': 'MANAGEMENT', 'SİSTEM': 'SYSTEM',
    'Ana Sayfa': 'Overview',
    'İzin Taleplerim': 'My Leave Requests',
    'Kişisel Bilgiler': 'Personal Information',
    'Departman Talepleri': 'Department Requests',
    'Çalışanlar': 'Employees',
    'Onay Geçmişi': 'Approval History',
    'Tüm İzin Talepleri': 'All Leave Requests',
    'Kullanıcılar': 'Users',
    'Departmanlar': 'Departments',
    'Pozisyonlar': 'Positions',
    'İzin Türleri': 'Leave Types',
    'Sistem Ayarları': 'System Settings',
    'Çıkış Yap': 'Sign Out',
    'Bilgiler yükleniyor…': 'Loading information…',
    'İşlemi onaylayın': 'Confirm action',
    'Vazgeç': 'Cancel',
    'Onayla': 'Approve',
    'PERSONEL': 'EMPLOYEE',
    'YÖNETİCİ': 'MANAGER',
    'ADMIN': 'ADMIN',
    'İYİ ÇALIŞMALAR': 'HAVE A GREAT DAY',
    'YÖNETİM ÖZETİ': 'MANAGEMENT SUMMARY',
    'Toplam talep': 'Total requests',
    'Bekleyen': 'Pending',
    'Onaylanan': 'Approved',
    'Reddedilen': 'Rejected',
    'Departman çalışanı': 'Department employees',
    'Bekleyen talep': 'Pending requests',
    'Aktif kullanıcı': 'Active users',
    'Aktif departman': 'Active departments',
    'Son izin talepleri': 'Recent leave requests',
    'En son oluşturulan talepler ve güncel durumları': 'Latest requests and their current status',
    'Tümünü gör': 'View all',
    'Hızlı işlemler': 'Quick actions',
    'Sık kullanılan ekranlara geçin': 'Go to frequently used pages',
    'Yeni izin talebi': 'New leave request',
    'Taleplerimi görüntüle': 'View my requests',
    'Bilgilerimi güncelle': 'Update my information',
    'Kendi izin talebim': 'My leave request',
    'Bekleyen talepler': 'Pending requests',
    'Departman çalışanları': 'Department employees',
    'Yeni kullanıcı': 'New user',
    'Yeni Kullanıcı': 'New User',
    'Sistem ayarları': 'System settings',
    'Henüz talep bulunmuyor': 'No requests yet',
    'İlk izin talebinizi oluşturarak başlayabilirsiniz.': 'Get started by creating your first leave request.',
    'Görüntülenecek izin talebi bulunmuyor.': 'There are no leave requests to display.',
    'Yeni İzin Talebi': 'New Leave Request',
    'Sayfa yüklenemedi': 'Page could not be loaded',
    'İzin taleplerim': 'My leave requests',
    'Departman izin talepleri': 'Department leave requests',
    'Tüm izin talepleri': 'All leave requests',
    'Talep görünümü': 'Request view',
    'Talepler': 'Requests',
    'Onay geçmişi yükleniyor…': 'Loading approval history…',
    'Onay geçmişi yüklenemedi': 'Approval history could not be loaded',
    'Kendi taleplerinizi oluşturun ve durumlarını takip edin.': 'Create your requests and track their status.',
    'Yetkiniz dahilindeki personel taleplerini inceleyin.': 'Review employee requests within your authority.',
    'Açıklamada ara': 'Search descriptions',
    'Personel veya açıklama ara': 'Search employee or description',
    'Departmana göre filtrele': 'Filter by department',
    'Tüm departmanlar': 'All departments',
    'Tüm izin türleri': 'All leave types',
    'Tüm durumlar': 'All statuses',
    'Bekliyor': 'Pending', 'Onaylandı': 'Approved', 'Reddedildi': 'Rejected', 'İptal edildi': 'Cancelled',
    'Filtrele': 'Filter',
    'Talep bulunamadı': 'Request not found',
    'Henüz izin talebiniz bulunmuyor.': 'You do not have any leave requests yet.',
    'Seçilen ölçütlere uygun izin talebi bulunmuyor.': 'No leave requests match the selected filters.',
    'PERSONEL': 'EMPLOYEE', 'İZİN TÜRÜ': 'LEAVE TYPE', 'BAŞLANGIÇ': 'START', 'BİTİŞ': 'END', 'SÜRE': 'DURATION', 'DURUM': 'STATUS', 'İŞLEM': 'ACTION',
    'Detay': 'Details', 'Düzenle': 'Edit', 'İptal': 'Cancel', 'İptal Et': 'Cancel', 'Sil': 'Delete', 'Karar ver': 'Review',
    'İzin talebini düzenle': 'Edit leave request',
    'İzin talebini onayla': 'Approve leave request',
    'İzin talebini reddet': 'Reject leave request',
    'Yeni izin talebi': 'New leave request',
    'PERSONEL İŞLEMİ': 'EMPLOYEE ACTION',
    'İzin türü': 'Leave type',
    'İzin türü seçin': 'Select a leave type',
    'Başlangıç tarihi': 'Start date',
    'Bitiş tarihi': 'End date',
    'Tarih seçildiğinde süre hesaplanır': 'Duration is calculated when dates are selected',
    'Açıklama': 'Description', '(isteğe bağlı)': '(optional)',
    'İzin talebinizle ilgili kısa açıklama': 'Brief description of your leave request',
    'Değişiklikleri Kaydet': 'Save Changes',
    'Talep Oluştur': 'Create Request',
    'İzin talebiniz güncellendi.': 'Your leave request has been updated.',
    'İzin talebiniz oluşturuldu.': 'Your leave request has been created.',
    'Talebi incele': 'Review request',
    'İzin talebi detayı': 'Leave request details',
    'ONAY İŞLEMİ': 'APPROVAL ACTION',
    'ONAY KARARI': 'APPROVAL DECISION',
    'RED KARARI': 'REJECTION DECISION',
    'TALEP DETAYI': 'REQUEST DETAILS',
    'Tarih aralığı': 'Date range',
    'İş günü': 'Working days',
    'Durum': 'Status',
    'Talep tarihi': 'Request date',
    'PERSONEL AÇIKLAMASI': 'EMPLOYEE COMMENT',
    'YÖNETİCİ AÇIKLAMASI': 'MANAGER COMMENT',
    'Açıklama girilmemiş.': 'No description provided.',
    'Yönetici açıklaması': 'Manager comment',
    'Red açıklaması': 'Rejection comment',
    'Red işlemi için açıklama zorunludur.': 'A comment is required when rejecting a request.',
    'Red işlemi için açıklama yazınız.': 'Enter a comment before rejecting the request.',
    'Kararınızla ilgili kısa açıklama': 'Brief explanation of your decision',
    'Reddet': 'Reject',
    'Onaylanıyor…': 'Approving…',
    'Reddediliyor…': 'Rejecting…',
    'Talep onaylandı.': 'Request approved.',
    'Talep reddedildi.': 'Request rejected.',
    'Bu bekleyen izin talebini iptal etmek istediğinize emin misiniz?': 'Are you sure you want to cancel this pending leave request?',
    'Bu izin talebi kayıtlarda kalacak ve İptal edildi durumuna getirilecek. Devam edilsin mi?': 'This leave request will remain in the records and be marked as Cancelled. Continue?',
    'Bu bekleyen izin talebiniz kalıcı olarak silinecek. Devam edilsin mi?': 'Your pending leave request will be permanently deleted. Continue?',
    'Talebi İptal Et': 'Cancel Request',
    'Talebi Sil': 'Delete Request',
    'İzin talebi iptal edildi.': 'Leave request cancelled.',
    'İzin talebiniz silindi.': 'Your leave request was deleted.',
    'Bu izin talebi ve bağlı onay geçmişi veritabanından kalıcı olarak silinecek. Devam edilsin mi?': 'This leave request and its approval history will be permanently deleted from the database. Continue?',
    'Kalıcı Sil': 'Delete Permanently',
    'İzin talebi kalıcı olarak silindi.': 'Leave request permanently deleted.',
    'Onay geçmişi': 'Approval history',
    'Tamamlanan yönetici kararlarının değiştirilemez işlem kaydı.': 'An immutable record of completed manager decisions.',
    'KARAR': 'DECISION', 'KARAR VEREN': 'DECIDED BY', 'AÇIKLAMA': 'DESCRIPTION', 'TARİH': 'DATE',
    'Henüz karar bulunmuyor': 'No decisions yet',
    'Onaylanan veya reddedilen talepler burada listelenecek.': 'Approved or rejected requests will appear here.',
    'Departman çalışanları': 'Department employees',
    'ÇALIŞAN': 'EMPLOYEE', 'KULLANICI ADRESİ': 'USERNAME', 'POZİSYON': 'POSITION', 'YETKİ': 'ACCESS',
    'Aktif': 'Active', 'Pasif': 'Inactive',
    'Çalışan bulunamadı': 'Employee not found',
    'Departmanınızda listelenecek aktif kullanıcı bulunmuyor.': 'There are no active users to list in your department.',
    'Kullanıcı yönetimi': 'User management',
    'Tek hesap üzerinden personel, yönetici ve admin yetkilerini yönetin.': 'Manage employee, manager, and administrator access from a single account.',
    'Ad, kullanıcı adresi veya pozisyon ara': 'Search name, username, or position',
    'Tüm yetkiler': 'All access levels',
    'Personel': 'Employee', 'Yönetici': 'Manager',
    'Kullanıcı bulunamadı': 'User not found',
    'Seçilen ölçütlere uygun kullanıcı kaydı bulunmuyor.': 'No user records match the selected filters.',
    'KULLANICI': 'USER', 'DEPARTMAN': 'DEPARTMENT',
    'İlk giriş bekleniyor': 'First sign-in pending',
    'Giriş Bilgileri': 'Sign-in Details',
    'Yeni Şifre': 'New Password',
    'Şifre': 'Password', 'Pasifleştir': 'Deactivate', 'Aktifleştir': 'Activate',
    'Kullanıcıyı düzenle': 'Edit user',
    'KULLANICI YÖNETİMİ': 'USER MANAGEMENT',
    'Ad': 'First name', 'Soyad': 'Last name',
    'Kullanıcı adresi hesap güvenliği için değiştirilemez.': 'The username cannot be changed for account security.',
    'Adres ad ve soyaddan otomatik oluşturulur. Aynı adres varsa sonuna sayı eklenir.': 'The username is generated from the first and last name. A number is added if it already exists.',
    'Kullanıcı ilk girişinde bu şifreyi değiştirmek zorundadır.': 'The user must change this password at first sign-in.',
    'Güçlü şifre otomatik üretildi. Kullanıcı ilk girişinde bunu değiştirmek zorundadır.': 'A strong password was generated automatically. The user must change it at first sign-in.',
    'Yenile': 'Regenerate',
    'Kopyala': 'Copy',
    'Panoya kopyalandı.': 'Copied to clipboard.',
    'KULLANICI HAZIR': 'USER READY',
    'Giriş bilgilerini kullanıcıya iletin': 'Share the sign-in details with the user',
    'Giriş bilgileri': 'Sign-in details',
    'Bu bilgiler kullanıcı yeni şifresini belirleyene kadar admin tarafından tekrar görüntülenebilir.': 'The administrator can view these details again until the user sets a new password.',
    'Geçici erişim bilgisi': 'Temporary access details',
    'Kullanıcı yeni şifresini kaydettiğinde geçici şifre kalıcı olarak silinir.': 'The temporary password is permanently deleted when the user saves a new password.',
    'Geçici şifre yalnızca bu ekranda gösterilir. Veritabanında güvenli biçimde saklanır ve kullanıcı ilk girişinde yeni şifre belirlemek zorundadır.': 'The temporary password is shown only on this screen. It is stored securely in the database, and the user must set a new password at first sign-in.',
    'Kullanıcı adresini kopyala': 'Copy username',
    'Geçici şifreyi kopyala': 'Copy temporary password',
    'Bu şifreyi şimdi kopyalayın.': 'Copy this password now.',
    'Bu ekran kapatıldıktan sonra aynı şifre tekrar görüntülenemez.': 'This password cannot be shown again after this screen is closed.',
    'Tamam': 'Done',
    'Yetki': 'Access level',
    'Departman': 'Department',
    'Departman seçin': 'Select a department',
    'Önce departman oluşturun': 'Create a department first',
    'Personel ve yöneticiler için zorunludur.': 'Required for employees and managers.',
    'Admin hesabında departman isteğe bağlıdır.': 'Department is optional for an administrator account.',
    'Doğum tarihi': 'Date of birth', 'Telefon': 'Phone', 'Adres': 'Address',
    'Kaydet': 'Save',
    'Kullanıcı güncellendi.': 'User updated.',
    'Bu kullanıcı kalıcı olarak silinecek. İşlem geçmişi varsa sistem silmeye izin vermeyecektir.': 'This user will be permanently deleted. The system will block deletion if activity history exists.',
    'Kullanıcıyı Sil': 'Delete User',
    'Kullanıcı kalıcı olarak silindi.': 'User permanently deleted.',
    'Şifreyi sıfırla': 'Reset password',
    'KULLANICI GÜVENLİĞİ': 'USER SECURITY',
    'Yeni geçici şifre': 'New temporary password',
    'Kullanıcı sonraki girişinde geçici şifreyi değiştirmek zorundadır.': 'The user must change the temporary password at next sign-in.',
    'Şifreyi Sıfırla': 'Reset Password',
    'Şifreler birbiriyle eşleşmiyor.': 'Passwords do not match.',
    'Yeni şifreler birbiriyle eşleşmiyor.': 'New passwords do not match.',
    'Geçici şifre tanımlandı.': 'Temporary password set.',
    'Kurum departmanlarını ve bağlı yöneticileri düzenleyin.': 'Manage organization departments and their assigned managers.',
    'Yeni Departman': 'New Department',
    'Yönetici atanmamış': 'No manager assigned',
    'Çalışan': 'Employees', 'İşlemler': 'Actions',
    'Departman bulunmuyor': 'No departments',
    'Kullanıcı eklemeden önce ilk departmanınızı oluşturun.': 'Create your first department before adding users.',
    'Departmanı düzenle': 'Edit department',
    'Yeni departman': 'New department',
    'DEPARTMAN YÖNETİMİ': 'DEPARTMENT MANAGEMENT',
    'Departman adı': 'Department name',
    'Departman yöneticisi': 'Department manager',
    'Bu departmandaki yönetici veya admin yetkili kullanıcılar listelenir.': 'Users with manager or administrator access in this department are listed.',
    'Departman güncellendi.': 'Department updated.',
    'Departman oluşturuldu.': 'Department created.',
    'Departman kullanılmıyorsa veritabanından kalıcı olarak silinecek.': 'The department will be permanently deleted from the database if it is unused.',
    'Departmanı Sil': 'Delete Department',
    'Departman kalıcı olarak silindi.': 'Department permanently deleted.',
    'Kullanıcı hesaplarında seçilebilecek görev ve unvanları yönetin.': 'Manage the roles and job titles available for user accounts.',
    'Yeni Pozisyon': 'New Position',
    'POZİSYON': 'POSITION',
    'KULLANICI SAYISI': 'USER COUNT',
    'Pozisyon bulunmuyor': 'No positions',
    'Kullanıcı eklemeden önce ilk pozisyonunuzu oluşturun.': 'Create your first position before adding users.',
    'Pozisyonu düzenle': 'Edit position',
    'Yeni pozisyon': 'New position',
    'POZİSYON YÖNETİMİ': 'POSITION MANAGEMENT',
    'Pozisyon adı': 'Position name',
    'Pozisyon güncellendi.': 'Position updated.',
    'Pozisyon oluşturuldu.': 'Position created.',
    'Pozisyon kullanılmıyorsa veritabanından kalıcı olarak silinecek.': 'The position will be permanently deleted from the database if it is unused.',
    'Pozisyonu Sil': 'Delete Position',
    'Pozisyon kalıcı olarak silindi.': 'Position permanently deleted.',
    'Pozisyon seçin': 'Select a position',
    'Önce pozisyon oluşturun': 'Create a position first',
    'İzin türleri': 'Leave types',
    'Personelin talep oluştururken kullanabileceği izin seçenekleri.': 'Leave options employees can use when creating a request.',
    'Yeni İzin Türü': 'New Leave Type',
    'KOD': 'CODE',
    'İzin türünü düzenle': 'Edit leave type',
    'Yeni izin türü': 'New leave type',
    'İZİN TÜRÜ YÖNETİMİ': 'LEAVE TYPE MANAGEMENT',
    'İzin türü adı': 'Leave type name',
    'Örn. Yıllık izin': 'e.g. Annual leave',
    'Kod': 'Code', 'Renk': 'Color',
    'Aktif izin türü': 'Active leave type',
    'İzin türü güncellendi.': 'Leave type updated.',
    'İzin türü oluşturuldu.': 'Leave type created.',
    'İzin türü kullanılmıyorsa veritabanından kalıcı olarak silinecek.': 'The leave type will be permanently deleted from the database if it is unused.',
    'İzin Türünü Sil': 'Delete Leave Type',
    'İzin türü kalıcı olarak silindi.': 'Leave type permanently deleted.',
    'Sistem ayarları': 'System settings',
    'Kurum bilgisini ve yerel veritabanındaki kayıtları yönetin.': 'Manage organization information and records in the local database.',
    'Kurum bilgisi': 'Organization information',
    'Kurum adı panelde dinamik gösterilir; İzinPro ürün adı sabit kalır.': 'The organization name is displayed dynamically in the dashboard; the İzinPro product name stays fixed.',
    'Giriş adresi alan adı': 'Username domain',
    'Mevcut kullanıcı adresleri değişmesin diye sabit tutulur.': 'Kept fixed so existing usernames do not change.',
    'Kurum yapısı ve seçenekler': 'Organization structure and options',
    'Kullanıcı oluştururken kullanılacak kayıtları buradan yönetin.': 'Manage the records used when creating users.',
    'Ayarları Kaydet': 'Save Settings',
    'Kurum ayarları güncellendi.': 'Organization settings updated.',
    'Veri yönetimi': 'Data management',
    'Deneme kayıtlarını temizleyin veya admin hesabını koruyarak sistemi sıfırlayın.': 'Clear test records or reset the system while preserving the administrator account.',
    'İşlem verilerini temizle': 'Clear activity data',
    'İzin talepleri ve onay geçmişi silinir; kullanıcılar, departmanlar ve ayarlar kalır.': 'Leave requests and approval history are deleted; users, departments, and settings remain.',
    'İşlemleri Temizle': 'Clear Activity',
    'Sistemi sıfırla': 'Reset system',
    'Mevcut admin hesabı korunur; diğer kullanıcılar, departmanlar ve tüm işlem verileri silinir.': 'The current administrator account is preserved; other users, departments, and all activity data are deleted.',
    'Admin Hariç Sıfırla': 'Reset Except Admin',
    'VERİ YÖNETİMİ': 'DATA MANAGEMENT',
    'Admin dışındaki veriler kalıcı olarak silinecek.': 'All data except the administrator account will be permanently deleted.',
    'Tüm izin ve onay kayıtları silinecek.': 'All leave and approval records will be deleted.',
    'Mevcut admin hesabınız ve şifreniz korunur; diğer kullanıcılar, departmanlar ve işlem verileri silinir.': 'Your current administrator account and password are preserved; other users, departments, and activity data are deleted.',
    'Kullanıcılar, departmanlar ve kurum ayarları korunur.': 'Users, departments, and organization settings are preserved.',
    'Onaylamak için SIFIRLA yazın': 'Type SIFIRLA to confirm',
    'Siliniyor…': 'Deleting…',
    'İşlem verileri temizlendi.': 'Activity data cleared.',
    'Sistem sıfırlandı; admin hesabınız korundu.': 'System reset; your administrator account was preserved.',
    'Kişisel bilgiler': 'Personal information',
    'İletişim bilgilerinizi ve hesap şifrenizi güvenle güncelleyin.': 'Securely update your contact information and account password.',
    'E-posta': 'Email',
    'İletişim bilgileri': 'Contact information',
    'Profil bilgileri': 'Profile information',
    'Ad, soyad ve iletişim bilgilerinizi değiştirebilirsiniz.': 'You can update your first name, last name, and contact information.',
    'Bilgileri Kaydet': 'Save Information',
    'Şifre ve güvenlik': 'Password and security',
    'Hesabınız için güçlü ve benzersiz bir şifre kullanın.': 'Use a strong, unique password for your account.',
    'Mevcut şifre': 'Current password',
    'Şifreyi Değiştir': 'Change Password',
    'İletişim bilgileriniz güncellendi.': 'Your contact information has been updated.',
    'Profil bilgileriniz güncellendi.': 'Your profile information has been updated.',
    'Şifreniz güncellendi.': 'Your password has been updated.',
    'Yıllık İzin': 'Annual Leave', 'Mazeret İzni': 'Personal Leave', 'Hastalık İzni': 'Sick Leave', 'Babalık İzni': 'Paternity Leave', 'Evlilik İzni': 'Marriage Leave', 'Evlenme İzni': 'Marriage Leave',
    'İşlem tamamlanamadı.': 'The action could not be completed.',
    'Admin şifresi hatalı.': 'The administrator password is incorrect.',
    'Bitiş tarihi başlangıç tarihinden önce olamaz.': 'The end date cannot be before the start date.',
    'Geçmiş tarih için izin talebi oluşturulamaz.': 'A leave request cannot be created for a past date.',
    'Bu departman zaten bulunuyor.': 'This department already exists.',
    'Bu pozisyon zaten bulunuyor.': 'This position already exists.',
    'Bu pozisyon kullanıcılara atanmış. Önce kullanıcıların pozisyonunu değiştirin veya pozisyonu pasifleştirin.': 'This position is assigned to users. Change their position first or deactivate it.',
    'Bu izin talebini görüntüleme yetkiniz bulunmuyor.': 'You do not have permission to view this leave request.',
    'Bu işlem için yetkiniz bulunmuyor.': 'You do not have permission to perform this action.',
    'Bu kullanıcıyı görüntüleme yetkiniz bulunmuyor.': 'You do not have permission to view this user.',
    'Bu talep kapsamı için yetkiniz bulunmuyor.': 'You do not have permission for this request scope.',
    'Bu tarih aralığıyla çakışan başka bir izin talebiniz bulunuyor.': 'You already have another leave request overlapping this date range.',
    'Departman bulunamadı.': 'Department not found.',
    'Pozisyon bulunamadı.': 'Position not found.',
    'Devam etmek için geçici şifrenizi değiştirmeniz gerekiyor.': 'You must change your temporary password to continue.',
    'Geçerli bir departman seçiniz.': 'Select a valid department.',
    'Geçerli bir pozisyon seçiniz.': 'Select a valid position.',
    'Geçerli bir e-posta adresi giriniz.': 'Enter a valid email address.',
    'Geçerli bir renk kodu giriniz.': 'Enter a valid color code.',
    'Geçersiz izin durumu.': 'Invalid leave status.',
    'Geçersiz kullanıcı rolü.': 'Invalid user role.',
    'Geçersiz talep kapsamı.': 'Invalid request scope.',
    'Hesabınız pasif durumda. Yöneticiyle iletişime geçiniz.': 'Your account is inactive. Contact an administrator.',
    'Kendi admin rolünüzü kaldıramazsınız.': 'You cannot remove your own administrator role.',
    'Kendi hesabınızı pasif yapamazsınız.': 'You cannot deactivate your own account.',
    'Kendi hesabınızı silemezsiniz.': 'You cannot delete your own account.',
    'Kendi izin talebiniz için karar veremezsiniz.': 'You cannot decide your own leave request.',
    'Kendi izin talebinizi iptal etmek yerine silebilirsiniz.': 'You can delete your own leave request instead of cancelling it.',
    'Kullanıcı adresi veya şifre hatalı.': 'The username or password is incorrect.',
    'Mevcut şifreniz hatalı.': 'Your current password is incorrect.',
    'Onay alanına SIFIRLA yazınız.': 'Type SIFIRLA in the confirmation field.',
    'Oturum açmanız gerekiyor.': 'You need to sign in.',
    'Oturumunuz geçersiz. Lütfen tekrar giriş yapın.': 'Your session is invalid. Please sign in again.',
    'Red işlemi için açıklama yazınız.': 'Enter a comment when rejecting a request.',
    'Seçilen izin türü aktif değil.': 'The selected leave type is not active.',
    'Seçilen kullanıcı aktif bir yönetici veya admin olmalıdır.': 'The selected user must be an active manager or administrator.',
    'Seçilen tarih aralığında iş günü bulunmuyor.': 'There are no working days in the selected date range.',
    'Sistemdeki son aktif admin pasifleştirilemez.': 'The last active administrator cannot be deactivated.',
    'Sistemdeki son aktif admin silinemez.': 'The last active administrator cannot be deleted.',
    'Yalnızca bekleyen talepler değiştirilebilir.': 'Only pending requests can be edited.',
    'Yalnızca bekleyen talepler iptal edilebilir.': 'Only pending requests can be cancelled.',
    'Yalnızca bekleyen talepler silinebilir.': 'Only pending requests can be deleted.',
    'Yalnızca bekleyen talepler için karar verilebilir.': 'Only pending requests can be decided.',
    'Yalnızca kendi departmanınızdaki talepleri iptal edebilirsiniz.': 'You can only cancel requests in your own department.',
    'Yalnızca kendi departmanınızdaki talepleri yönetebilirsiniz.': 'You can only manage requests in your own department.',
    'Yalnızca kendi izin talebinizi değiştirebilirsiniz.': 'You can only edit your own leave request.',
    'Yalnızca kendi izin talebinizi iptal edebilirsiniz.': 'You can only cancel your own leave request.',
    'Yalnızca kendi izin talebinizi silebilirsiniz.': 'You can only delete your own leave request.',
    'Yeni şifre mevcut şifreden farklı olmalıdır.': 'The new password must differ from the current password.',
    'Yönetici seçilen departmanda görev yapmalıdır.': 'The manager must work in the selected department.',
    'İzin talebi bulunamadı.': 'Leave request not found.',
    'İzin türü bulunamadı.': 'Leave type not found.',
    'İzin türü kodu yalnızca harf ve alt çizgi içerebilir.': 'The leave type code may contain only letters and underscores.'
  };

  const fieldNames = {
    'Ad': 'First name', 'Soyad': 'Last name', 'Şifre': 'Password', 'Yeni şifre': 'New password',
    'Departman': 'Department', 'Kullanıcı': 'User', 'İzin talebi': 'Leave request',
    'İzin türü': 'Leave type', 'Başlangıç tarihi': 'Start date', 'Bitiş tarihi': 'End date',
    'Doğum tarihi': 'Date of birth', 'İşe giriş tarihi': 'Start date', 'Pozisyon': 'Position',
    'Pozisyon adı': 'Position name', 'Pozisyon durumu': 'Position status',
    'Telefon': 'Phone', 'Adres': 'Address', 'Açıklama': 'Description', 'Arama': 'Search',
    'Yönetici açıklaması': 'Manager comment', 'Kurum adı': 'Organization name'
  };
  const fieldName = (value) => fieldNames[value] || value;

  const patterns = [
    [/^Hoş geldiniz, (.+)$/u, 'Welcome, $1'],
    [/^(.+) departmanındaki aktif kullanıcılar\.$/u, 'Active users in the $1 department.'],
    [/^(\d+) iş günü$/u, '$1 working days'],
    [/^(\d+) gün$/u, '$1 days'],
    [/^(\d+) kayıt$/u, '$1 records'],
    [/^(.+@izinpro\.com) adresiyle kullanıcı oluşturuldu\.$/u, 'User created with the username $1.'],
    [/^Kullanıcı (aktifleştirildi|pasifleştirildi)\.$/u, (_, state) => state === 'aktifleştirildi' ? 'User activated.' : 'User deactivated.'],
    [/^Departman (aktifleştirildi|pasifleştirildi)\.$/u, (_, state) => state === 'aktifleştirildi' ? 'Department activated.' : 'Department deactivated.'],
    [/^Pozisyon (aktifleştirildi|pasifleştirildi)\.$/u, (_, state) => state === 'aktifleştirildi' ? 'Position activated.' : 'Position deactivated.'],
    [/^Kullanıcı hesabını (aktif|pasif) duruma getirmek istediğinize emin misiniz\?$/u, (_, state) => `Are you sure you want to ${state === 'aktif' ? 'activate' : 'deactivate'} this user account?`],
    [/^Departmanı (aktif|pasif) duruma getirmek istediğinize emin misiniz\?$/u, (_, state) => `Are you sure you want to ${state === 'aktif' ? 'activate' : 'deactivate'} this department?`],
    [/^Pozisyonu (aktif|pasif) duruma getirmek istediğinize emin misiniz\?$/u, (_, state) => `Are you sure you want to ${state === 'aktif' ? 'activate' : 'deactivate'} this position?`],
    [/^(.+) (\d+)-(\d+) karakter arasında olmalıdır\.$/u, (_, field, min, max) => `${fieldName(field)} must be between ${min} and ${max} characters.`],
    [/^(.+) en az 8 karakter, büyük harf, küçük harf, rakam ve özel karakter içermelidir\.$/u, (_, field) => `${fieldName(field)} must be at least 8 characters and include uppercase, lowercase, a number, and a special character.`],
    [/^(.+) geçerli bir tarih olmalıdır\.$/u, (_, field) => `${fieldName(field)} must be a valid date.`],
    [/^(.+) geçerli olmalıdır\.$/u, (_, field) => `${fieldName(field)} must be valid.`]
  ];

  function translate(value, targetLanguage = language) {
    if (targetLanguage !== 'en' || typeof value !== 'string') return value;
    const leading = value.match(/^\s*/u)?.[0] || '';
    const trailing = value.match(/\s*$/u)?.[0] || '';
    const trimmed = value.trim();
    if (!trimmed) return value;
    let translated = en[trimmed];
    if (!translated) {
      for (const [pattern, replacement] of patterns) {
        if (pattern.test(trimmed)) { translated = trimmed.replace(pattern, replacement); break; }
      }
    }
    return translated ? `${leading}${translated}${trailing}` : value;
  }

  function translateElement(root, targetLanguage = language) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      if (!originalText.has(root)) originalText.set(root, root.nodeValue);
      const source = originalText.get(root);
      const result = targetLanguage === 'en' ? translate(source, 'en') : source;
      if (result !== root.nodeValue) root.nodeValue = result;
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE && root.matches('script, style, [data-no-translate]')) return;
    if (root.nodeType === Node.ELEMENT_NODE) {
      if (!originalAttributes.has(root)) originalAttributes.set(root, {});
      const originals = originalAttributes.get(root);
      ['placeholder', 'aria-label', 'title', 'content'].forEach((attribute) => {
        if (root.hasAttribute(attribute)) {
          if (!(attribute in originals)) originals[attribute] = root.getAttribute(attribute);
          const source = originals[attribute];
          const result = targetLanguage === 'en' ? translate(source, 'en') : source;
          const current = root.getAttribute(attribute);
          if (result !== current) root.setAttribute(attribute, result);
        }
      });
      if (root.hasAttribute('data-i18n-value') && 'value' in root) {
        if (!originalValues.has(root)) originalValues.set(root, root.value);
        root.value = targetLanguage === 'en' ? root.getAttribute('data-i18n-value') : originalValues.get(root);
      }
    }
    Array.from(root.childNodes).forEach((node) => translateElement(node, targetLanguage));
  }

  function setLanguage(next) {
    if (!supported.includes(next) || next === language) return;
    language = next;
    localStorage.setItem(STORAGE_KEY, next);
    applyLanguage();
  }

  function applyLanguage() {
    document.documentElement.lang = language;
    document.querySelectorAll('[data-language]').forEach((button) => {
      const active = button.dataset.language === language;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.title = language === 'en' ? translate(originalTitle, 'en') : originalTitle;
    translateElement(document.body, language);
  }

  function initialize() {
    document.querySelectorAll('[data-language]').forEach((button) => {
      button.addEventListener('click', () => setLanguage(button.dataset.language));
    });
    applyLanguage();
  }

  document.documentElement.lang = language;
  const observer = new MutationObserver((mutations) => {
    if (language !== 'en') return;
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') mutation.addedNodes.forEach((node) => translateElement(node, 'en'));
      else translateElement(mutation.target, 'en');
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['placeholder', 'aria-label', 'title', 'content'] });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();

  window.I18n = { language: () => language, locale: () => language === 'en' ? 'en-GB' : 'tr-TR', t: translate, setLanguage };
})();
