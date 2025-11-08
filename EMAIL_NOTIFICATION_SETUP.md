# 📧 Email Notification Setup

Panduan lengkap untuk setup email notification ketika trash bin penuh.

## 🚀 Fitur

- ✅ Mengirim email notification otomatis ketika sampah mencapai 90% penuh
- ✅ Cooldown 30 menit untuk menghindari spam email
- ✅ Menggunakan SMTP (mudah & simpel, tidak perlu cloud function)
- ✅ Menampilkan detail sensor (fill %, temperature, humidity)
- ✅ Support multiple SMTP providers (Gmail, Outlook, SendGrid, dll)

## 📋 Prerequisites

- SMTP credentials (email + password/app-password)
- Minimal: Gmail account dengan 2FA enabled

## 🔧 Setup Step-by-Step

### Step 1: Copy & Rename File Konfigurasi

```bash
# Copy template
cp .env.local.example .env.local
```

### Step 2: Setup Gmail (Recommended)

#### 2a. Enable 2-Step Verification

1. Buka https://myaccount.google.com/security
2. Enable "2-Step Verification" jika belum
3. Pastikan recovery email & phone sudah terdaftar

#### 2b. Generate App Password

1. Buka https://myaccount.google.com/apppasswords
2. Di bagian "Select the app and device you want to generate the app password for":
   - Pilih: **Mail**
   - Pilih: **Windows Computer** (atau device lainnya)
3. Klik **Generate**
4. Copy password yang ditampilkan (16 karakter)

#### 2c. Update `.env.local`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx    # Password 16 karakter dari Gmail
SMTP_FROM=Smart Trash Bin <your-email@gmail.com>
NEXT_PUBLIC_NOTIFICATION_EMAIL=your-email@gmail.com
```

### Step 3: Setup Outlook (Alternative)

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-outlook-password
SMTP_FROM=Smart Trash Bin <your-email@outlook.com>
NEXT_PUBLIC_NOTIFICATION_EMAIL=your-email@outlook.com
```

### Step 4: Install Dependencies

```bash
npm install nodemailer @types/nodemailer --save
```

### Step 5: Restart Development Server

```bash
npm run dev
```

## 📬 Cara Menggunakan

### Otomatis (Recommended)

Email akan dikirim otomatis ketika:

- Trash fill level mencapai 90% atau lebih
- Email belum pernah dikirim dalam 30 menit terakhir (cooldown)

Implementasi ada di `app/page.tsx`:

```typescript
// Email otomatis terkirim saat monitoring sensor
if (newData?.fillPercent && newData.fillPercent >= 90 && !emailSent) {
  sendTrashFullNotification(
    newData.fillPercent,
    {
      recipientEmail: RECIPIENT_EMAIL,
      fillThreshold: 90,
      cooldownMinutes: 30,
    },
    { temperature: newData.temperature, humidity: newData.humidity }
  );
}
```

### Manual (Testing/Development)

Gunakan utility function di `lib/emailNotification.ts`:

```typescript
import { sendTrashFullNotification } from "@/lib/emailNotification";

// Test mengirim email
await sendTrashFullNotification(
  95,
  {
    recipientEmail: "user@example.com",
    fillThreshold: 90,
    cooldownMinutes: 30,
  },
  {
    temperature: 28.5,
    humidity: 65,
  }
);
```

## 🧪 Testing Email

### Test via API Endpoint

```bash
# Buka terminal/cmd, jalankan:
curl -X POST http://localhost:3000/api/notify/email \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "your-email@gmail.com",
    "fillPercent": 95,
    "temperature": 28.5,
    "humidity": 65
  }'
```

### Respon Success

```json
{
  "success": true,
  "message": "Email notifikasi berhasil dikirim",
  "messageId": "<message-id@localhost>"
}
```

## 🐛 Troubleshooting

### "Cannot find module 'nodemailer'"

```bash
npm install nodemailer --save
npm run dev
```

### Email tidak terkirim

1. **Cek credentials di `.env.local`:**

   - Pastikan `SMTP_USER` dan `SMTP_PASSWORD` benar
   - Untuk Gmail: gunakan app password, bukan password biasa

2. **Cek SMTP setting:**

   - Gmail: `smtp.gmail.com:587` (TLS, tidak SSL)
   - Outlook: `smtp.office365.com:587`

3. **Check error log:**

   - Buka browser DevTools (F12)
   - Console tab → lihat error message
   - Atau check terminal output saat `npm run dev`

4. **Gmail: "Less secure apps":**
   - Jika masih error, buka https://myaccount.google.com/lesssecureapps
   - Enable "Allow less secure apps" (temporary)
   - Tapi lebih baik gunakan app password (Step 2b)

### Email masuk ke Spam

1. Buka email di spam folder
2. Klik "Report as Not Spam" atau "Move to Inbox"
3. Ini normal untuk first-time sender

### Cooldown tidak bekerja?

- Cooldown tracking hanya di browser memory
- Jika refresh page, counter reset
- Untuk production: gunakan database untuk tracking

## 📧 Struktur Email Template

Email yang dikirim berisi:

- **Subject:** ⚠️ Alert: Tempat Sampah Penuh!
- **Body:**
  - Status alert dengan warna
  - Fill percentage
  - Temperature (jika ada)
  - Humidity (jika ada)
  - Timestamp pengiriman

Contoh preview:

```
⚠️ Notifikasi: Tempat Sampah Penuh!

Tempat sampah Anda sudah mencapai kapasitas penuh dan perlu segera dikosongkan.

📊 Status Saat Ini:
  • Kapasitas Terisi: 95%
  • Temperatur: 28.5°C
  • Kelembaban: 65%
  • Waktu: 8/11/2025, 14:30:45

Silahkan segera kosongkan tempat sampah untuk menghindari overflow...
```

## 🔐 Security Notes

- ⚠️ **JANGAN** commit `.env.local` ke git
- ⚠️ **JANGAN** share password/app-password ke siapapun
- `.env.local` sudah di `.gitignore` (sudah aman)
- Untuk production: gunakan environment secrets (Vercel, Railway, dll)

## 📝 Customization

### Mengubah Threshold (kapan email dikirim)

Edit di `app/page.tsx`:

```typescript
// Default: 90%
if (newData?.fillPercent && newData.fillPercent >= 90 && !emailSent) {
  // Ubah 90 ke nilai lain, misal 80, 85, dll
}
```

### Mengubah Cooldown (waktu tunggu antar email)

Edit di `lib/emailNotification.ts` atau di `page.tsx`:

```typescript
sendTrashFullNotification(newData.fillPercent, {
  recipientEmail: RECIPIENT_EMAIL,
  fillThreshold: 90,
  cooldownMinutes: 30,  // Ubah ini (default 30 menit)
}, ...)
```

### Mengganti Email Template

Edit di `app/api/notify/email/route.ts` → bagian `emailContent` HTML.

## 📚 File Reference

| File                            | Tujuan                              |
| ------------------------------- | ----------------------------------- |
| `app/api/notify/email/route.ts` | API endpoint untuk kirim email      |
| `lib/emailNotification.ts`      | Utility function untuk notification |
| `app/page.tsx`                  | Integration otomatis di dashboard   |
| `.env.local.example`            | Template environment variables      |

## 🚀 Next Steps (Future)

- [ ] Support multiple recipients
- [ ] Custom email template builder
- [ ] Email history/log
- [ ] Retry mechanism untuk failed emails
- [ ] Support SMS notification
- [ ] Database-based cooldown tracking
- [ ] User preferences dashboard (enable/disable notifications)

## 💡 Tips

- Gunakan Gmail untuk testing/development (paling mudah)
- Untuk production, pertimbangkan SendGrid/Mailgun (more reliable)
- Test email dulu sebelum deploy
- Monitor spam folder untuk first-time deployment

---

**Questions?** Check browser console atau terminal output untuk error details.
