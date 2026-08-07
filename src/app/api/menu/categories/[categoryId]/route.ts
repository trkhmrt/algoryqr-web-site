import { NextResponse } from "next/server";

export async function PUT() {
  return NextResponse.json(
    { message: "Menü-local kategori güncelleme kaldırıldı. Taksonomi admin panelinden yönetilir." },
    { status: 410 },
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "Menü-local kategori silme kaldırıldı. Taksonomi admin panelinden yönetilir." },
    { status: 410 },
  );
}
