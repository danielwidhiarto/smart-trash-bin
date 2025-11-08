## 🔔 FITUR BARU: Email Notification

Smart Trash Bin sekarang bisa mengirim **email notification otomatis** ketika sampah penuh!

### ✨ Fitur

- 📧 Mengirim email saat fill level mencapai 90%
- ⏱️ Cooldown 30 menit untuk menghindari spam
- 🌡️ Include data sensor (fill %, temperature, humidity)
- 🚀 Setup simpel dengan SMTP (tidak perlu cloud function ribet)
- ✅ Support Gmail, Outlook, SendGrid, dan provider SMTP lainnya

### 🚀 Quick Start

1. **Setup SMTP Credentials**

   ```bash
   cp .env.local.example .env.local
   # Edit .env.local dengan SMTP credentials Anda
   ```

2. **Untuk Gmail (Recommended):**

   - Buka https://myaccount.google.com/apppasswords
   - Generate app password
   - Copy ke `SMTP_PASSWORD` di `.env.local`

3. **Install Dependencies**

   ```bash
   npm install nodemailer
   npm run dev
   ```

4. **Test Email**
   ```bash
   node test-email.js
   ```

### 📂 Files

- `app/api/notify/email/route.ts` - API endpoint untuk kirim email
- `lib/emailNotification.ts` - Utility function notification
- `app/page.tsx` - Integration monitoring
- `EMAIL_NOTIFICATION_SETUP.md` - Dokumentasi lengkap
- `.env.local.example` - Template environment variables
- `test-email.js` - Script untuk test email

### 📖 Dokumentasi

Baca `EMAIL_NOTIFICATION_SETUP.md` untuk panduan detail dan troubleshooting.

### 🔧 Customization

**Mengubah Threshold (kapan email dikirim):**

```typescript
// Di app/page.tsx, ubah nilai ini
if (newData?.fillPercent && newData.fillPercent >= 90) {
  // 90 = 90% (default)
  // Ubah ke 80, 85, atau nilai lainnya
}
```

**Mengubah Cooldown:**

```typescript
// Di app/page.tsx
sendTrashFullNotification(newData.fillPercent, {
  recipientEmail: RECIPIENT_EMAIL,
  fillThreshold: 90,
  cooldownMinutes: 30, // Ubah ini
});
```

### 🎯 Cara Kerja

1. Dashboard monitor real-time data dari Firebase
2. Ketika fill level >= 90%, API email dipanggil
3. Email dikirim via SMTP ke recipient email
4. Cooldown 30 menit untuk mencegah spam
5. Saat fill level < 80%, cooldown direset

### 💡 Tips

- Gunakan app-password untuk Gmail (lebih aman)
- Test email dulu dengan `node test-email.js`
- Email mungkin masuk ke spam folder (mark as not spam)
- Untuk production: gunakan SendGrid/Mailgun (more reliable)

---

**Next Step:** Baca `EMAIL_NOTIFICATION_SETUP.md` untuk setup lengkap!
