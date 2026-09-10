# 🛡️ huw3s Guard — Kurulum Rehberi

Discord sunucunuzu 22 koruma modülü, gerçek zamanlı log sistemi ve web panel ile koruyan gelişmiş bir guard botudur.

---

## Gereksinimler

- [Node.js](https://nodejs.org) v18 veya üzeri
- Bir Discord hesabı ve sunucusu
- [Discord Developer Portal](https://discord.com/developers/applications) erişimi

---

## 1. Discord Bot Oluşturma

1. [Discord Developer Portal](https://discord.com/developers/applications) adresine gidin
2. **New Application** butonuna tıklayın, bir isim verin
3. Sol menüden **Bot** sekmesine geçin
4. **Reset Token** ile token alın — kopyalayın, bir daha göremezsiniz
5. Aşağıdaki **Privileged Gateway Intents** seçeneklerini açın:
   - ✅ **Server Members Intent**
   - ✅ **Message Content Intent**
   - ✅ **Presence Intent**

---

## 2. OAuth2 Ayarları (Web Panel için)

1. Sol menüden **OAuth2** → **General** sekmesine gidin
2. **Client ID** ve **Client Secret** değerlerini kopyalayın
3. **Redirects** bölümüne şunu ekleyin:
   ```
   http://localhost:3000/auth/callback
   ```
   > Sunucuya yükleyecekseniz `localhost` yerine sunucu adresinizi yazın

---

## 3. Botu Sunucuya Ekleme

Aşağıdaki linki tarayıcıda açın, `CLIENT_ID` kısmını bot ID'nizle değiştirin:

```
https://discord.com/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot+applications.commands
```

> `permissions=8` Administrator yetkisi verir. Guard sistemi için gereklidir.

---

## 4. Proje Kurulumu

```bash
# Repoyu klonlayın veya ZIP olarak indirin
git clone https://github.com/kullanici/huwes-guard.git
cd huwes-guard

# Bağımlılıkları yükleyin
npm install
```

---

## 5. .env Dosyası Oluşturma

Proje klasöründe `.env` adında bir dosya oluşturun ve aşağıdaki içeriği doldurun:

```env
# Bot token — Discord Developer Portal > Bot > Token
TOKEN=

# Uygulama ID'si — Discord Developer Portal > General Information > Application ID
CLIENT_ID=

# OAuth2 secret — Discord Developer Portal > OAuth2 > Client Secret
CLIENT_SECRET=

# Botun yönettiği sunucunun ID'si
# Discord'da sunucu adına sağ tıklayın > Sunucu ID'sini Kopyala
GUILD_ID=

# Oturum şifreleme anahtarı — istediğiniz rastgele bir metin yazın
SESSION_SECRET=gizli_bir_sifre_buraya

# Web panel portu (değiştirmenize gerek yok)
WEB_PORT=3000

# Web panel URL'si (production'da kendi domaininizi yazın)
WEB_URL=http://localhost:3000

# Kendi Discord kullanıcı ID'niz — /db-reset komutunu sadece bu ID kullanabilir
# Discord'da kullanıcı adınıza sağ tıklayın > Kullanıcı ID'sini Kopyala
OWNER_ID=
```

### Nasıl ID kopyalarım?

Discord'da ID'leri görmek için önce **Geliştirici Modunu** açmanız gerekir:
> **Ayarlar** → **Gelişmiş** → **Geliştirici Modu** → Açık

Ardından herhangi bir sunucu, kanal veya kullanıcıya sağ tıklayarak ID'yi kopyalayabilirsiniz.

---

## 6. Botu Başlatma

```bash
node .
```

veya geliştirme modunda (otomatik yeniden başlatma):

```bash
npm run dev
```

Başarılı başlatma çıktısı:

```
✅ Veritabanı hazır.
🌐 Web panel: http://localhost:3000
✅ BotAdı#1234 aktif!
✅ 20 slash komutu kaydedildi.
```

---

## 7. İlk Yapılandırma

Bot başladıktan sonra Discord'da şu komutları çalıştırın:

| Komut | Açıklama |
|---|---|
| `/log-kanal #kanal` | Guard loglarının gönderileceği kanalı ayarlar |
| `/jail-rol @rol` | Ceza sistemi için jail rolünü ayarlar |
| `/panel` | 22 guard modülünü tek ekrandan açıp kapatır |

---

## 8. Web Paneli

Tarayıcınızda açın:

```
http://localhost:3000
```

Discord hesabınızla giriş yapın. Panele erişmek için sunucuda **Administrator** yetkisine sahip olmanız gerekir.

---

## Guard Modülleri (22 Modül)

| Kategori | Modüller |
|---|---|
| 🏰 Sunucu | Rol, Kanal, Kanal Rename, Sunucu, İzin, Emoji, Sticker koruması |
| 👤 Kullanıcı | Bot, Webhook, @everyone, Davet, Link, Raid, Hesap Yaşı, Mass Action, Kanal Spam, Rol Spam |
| 💬 Mesaj | Spam, Mention, Caps, Auto Slowmode, Kelime Filtresi |

---

## Komutlar (20 Komut)

**Moderasyon:** `/ban` `/unban` `/kick` `/mute` `/uyari` `/temizle` `/kilit`

**Guard:** `/panel` `/whitelist` `/log-kanal` `/jail-rol` `/hesap-yasi`

**Bilgi:** `/userinfo` `/sunucuinfo` `/istatistik` `/ceza-gecmis`

**Yönetim:** `/backup` `/otorol` `/db-reset` `/yardim`

---

## Sık Karşılaşılan Sorunlar

**Slash komutları görünmüyor**
- Botu sunucuya `applications.commands` scope'u ile ekleyin (3. adımdaki link bunu içeriyor)
- Botu yeniden başlatın, komutlar otomatik kaydedilir

**Web panele giriş yapamıyorum**
- `.env` içindeki `CLIENT_ID`, `CLIENT_SECRET` ve `WEB_URL` değerlerini kontrol edin
- Developer Portal'da redirect URL'nin `http://localhost:3000/auth/callback` olduğundan emin olun

**Guard çalışmıyor**
- Botun sunucuda Administrator yetkisi olduğunu kontrol edin
- `/log-kanal` ile log kanalı ayarlandığından emin olun
- `/panel` ile ilgili modülün açık olduğunu doğrulayın

**`Unknown interaction` hatası**
- Bu normalde eski bir interaction token'ına yanıt verilmeye çalışıldığında olur, genellikle yoksayılabilir

---

## Teknolojiler

- **discord.js** v14 — Bot altyapısı (Components V2)
- **Express.js** — Web panel sunucusu
- **Passport.js** — Discord OAuth2 kimlik doğrulama
- **sql.js** — Taşınabilir SQLite veritabanı
- **EJS** — Web panel şablon motoru

---

## Lisans

MIT — Detaylar için `LICENSE` dosyasına bakın.
