import { NextResponse } from "next/server";
import { z } from "zod";

import {
  notifyAdminAboutContactForm,
  sendContactConfirmationToUser,
} from "@/lib/mail-api";

const contactSchema = z.object({
  firstName: z.string().trim().min(1, "Ad zorunludur."),
  lastName: z.string().trim().min(1, "Soyad zorunludur."),
  email: z.string().trim().email("Geçerli bir e-posta girin."),
  message: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
});

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = contactSchema.safeParse(json);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      return NextResponse.json(
        { message: "Lütfen zorunlu alanları kontrol edin.", fieldErrors },
        { status: 400 },
      );
    }

    const { firstName, lastName, email, message, phone } = parsed.data;

    await notifyAdminAboutContactForm({
      firstName,
      lastName,
      phone: phone || "—",
      message: message || "—",
      email,
      source: "/contact",
    });

    await sendContactConfirmationToUser({
      email,
      firstName,
      lastName,
    });

    return NextResponse.json({
      message: "Mesajınız gönderildi. En kısa sürede size dönüş yapacağız.",
    });
  } catch (error) {
    console.error("[contact] Failed to send contact form mail", error);
    return NextResponse.json(
      { message: "Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin." },
      { status: 502 },
    );
  }
}
