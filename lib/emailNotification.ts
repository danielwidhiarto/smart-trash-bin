/**
 * Utility untuk mengirim email notification ketika trash penuh
 * Simple version untuk Firebase real-time monitoring
 */

// Tracking waktu notifikasi terakhir untuk menghindari spam
const lastNotificationTime: { [key: string]: number } = {};
const COOLDOWN_MINUTES = 1; // 1 menit untuk testing (ubah ke 30 untuk production)
const FILL_THRESHOLD = 70; // Mulai notifikasi saat 70% penuh

/**
 * Cek dan kirim email jika sampah penuh
 * Gunakan di useEffect saat data dari Firebase updated
 * @param currentFillPercent - Fill level sekarang (%)
 * @param previousFillPercent - Fill level sebelumnya (%)
 * @param recipientEmail - Email penerima notifikasi
 * @param temperature - Temperatur (optional)
 * @param humidity - Kelembaban (optional)
 * @returns true jika email terkirim, false jika tidak
 */
export async function checkAndSendEmailNotification(
  currentFillPercent: number,
  previousFillPercent: number,
  recipientEmail: string,
  temperature?: number,
  humidity?: number
): Promise<boolean> {
  // Hanya trigger jika baru naik dari dibawah threshold ke atas threshold
  const wasBelowThreshold = previousFillPercent < FILL_THRESHOLD;
  const isNowAboveThreshold = currentFillPercent >= FILL_THRESHOLD;

  if (!wasBelowThreshold || !isNowAboveThreshold) {
    return false;
  }

  // Cek cooldown - jangan kirim email terlalu sering
  const now = Date.now();
  const lastTime = lastNotificationTime[recipientEmail] || 0;
  const timeSinceLastNotification = (now - lastTime) / (1000 * 60); // dalam menit

  if (lastTime > 0 && timeSinceLastNotification < COOLDOWN_MINUTES) {
    console.log(
      `⏳ Cooldown aktif (${timeSinceLastNotification.toFixed(
        1
      )} / ${COOLDOWN_MINUTES} menit)`
    );
    return false;
  }

  try {
    console.log(`📧 Sending email notification (Fill: ${currentFillPercent}%)`);

    const response = await fetch("/api/notify/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipientEmail,
        fillPercent: currentFillPercent,
        temperature,
        humidity,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || "Unknown error");
    }

    // Update waktu notifikasi terakhir
    lastNotificationTime[recipientEmail] = now;

    const result = await response.json();
    console.log("✅ Email sent:", result.messageId);

    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return false;
  }
}
