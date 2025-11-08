import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Konfigurasi SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true untuk port 465, false untuk 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface EmailNotificationPayload {
  recipientEmail: string;
  fillPercent: number;
  temperature?: number;
  humidity?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailNotificationPayload = await request.json();

    // Validasi input
    if (!body.recipientEmail || body.fillPercent === undefined) {
      return NextResponse.json(
        { error: "recipientEmail dan fillPercent harus diisi" },
        { status: 400 }
      );
    }

    // Buat konten email
    const emailContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="background-color: #fff; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f; margin-bottom: 20px;">⚠️ Notifikasi: Tempat Sampah Penuh!</h2>
          
          <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
            Tempat sampah Anda sudah mencapai kapasitas penuh dan perlu segera dikosongkan.
          </p>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #856404;">📊 Status Saat Ini:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #856404;">
              <li><strong>Kapasitas Terisi:</strong> ${body.fillPercent}%</li>
              ${
                body.temperature !== undefined
                  ? `<li><strong>Temperatur:</strong> ${body.temperature}°C</li>`
                  : ""
              }
              ${
                body.humidity !== undefined
                  ? `<li><strong>Kelembaban:</strong> ${body.humidity}%</li>`
                  : ""
              }
              <li><strong>Waktu:</strong> ${new Date().toLocaleString(
                "id-ID"
              )}</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            Silahkan segera kosongkan tempat sampah untuk menghindari overflow atau masalah lainnya.
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 15px;">
            Pesan ini dikirim otomatis dari Smart Trash Bin System Anda.
          </p>
        </div>
      </div>
    `;

    // Kirim email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: body.recipientEmail,
      subject: "⚠️ Alert: Tempat Sampah Penuh!",
      html: emailContent,
    });

    console.log("Email sent:", info.messageId);

    return NextResponse.json(
      {
        success: true,
        message: "Email notifikasi berhasil dikirim",
        messageId: info.messageId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      {
        error: "Gagal mengirim email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint untuk test
export async function GET() {
  return NextResponse.json(
    {
      message:
        "Email API endpoint aktif. Gunakan POST untuk mengirim notifikasi.",
      requiredFields: ["recipientEmail", "fillPercent"],
      optionalFields: ["temperature", "humidity"],
    },
    { status: 200 }
  );
}
