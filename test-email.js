#!/usr/bin/env node

/**
 * Quick test script untuk email notification
 * Usage: node test-email.js
 *
 * Set SMTP credentials di .env.local dulu!
 */

require("dotenv").config({ path: ".env.local" }); // ← Tambah ini!
const nodemailer = require("nodemailer");

const requiredEnvVars = [
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "NEXT_PUBLIC_NOTIFICATION_EMAIL",
];

// Cek env vars
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`❌ Error: SMTP credentials tidak lengkap di .env.local`);
  console.error(`   Pastikan sudah configure:`);
  missingVars.forEach((v) => console.error(`   - ${v}`));
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function testEmail() {
  try {
    console.log("🔄 Testing SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP Connection Success!");

    console.log("\n📧 Sending test email...");
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.NEXT_PUBLIC_NOTIFICATION_EMAIL,
      subject: "✅ Test Email - Smart Trash Bin",
      html: `
        <div style="font-family: Arial; padding: 20px; background-color: #f5f5f5;">
          <h2 style="color: #4CAF50;">✅ Test Email Berhasil!</h2>
          <p>SMTP configuration kamu sudah bekerja dengan baik.</p>
          <p><strong>Waktu:</strong> ${new Date().toLocaleString("id-ID")}</p>
        </div>
      `,
    });

    console.log("✅ Test email sent successfully!");
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📨 Sent to: ${process.env.NEXT_PUBLIC_NOTIFICATION_EMAIL}`);
    console.log("\n✨ Check your inbox!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testEmail();
