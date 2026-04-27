/**
 * POST /api/profile/upload-doc
 * Accepts a multipart file upload (PDF, DOCX, XLSX, PPTX),
 * extracts its text, and appends the result to OrgProfile.docExtracts.
 *
 * DELETE /api/profile/upload-doc?id=<docId>
 * Removes a single document from OrgProfile.docExtracts.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWorkspaceContext } from "@/lib/workspace";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { parseOffice } = require("officeparser");

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface DocExtract {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  text: string;
}

const ALLOWED_EXTENSIONS: Record<string, string> = {
  pdf: "PDF",
  doc: "Word",
  docx: "Word",
  xls: "Excel",
  xlsx: "Excel",
  ppt: "PowerPoint",
  pptx: "PowerPoint",
};

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_TEXT_CHARS = 8000;
const MAX_DOCS = 10;

async function extractText(buffer: Buffer, fileName: string): Promise<string> {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "pdf";
  const tmpPath = join(tmpdir(), `spotcast-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`);
  try {
    await writeFile(tmpPath, buffer);
    // officeparser v6 returns an AST object — call .toText() for plain text
    const ast = await parseOffice(tmpPath, {
      outputErrorToConsole: false,
      newlineDelimiter: " ",
    });
    const text: string = typeof ast === "string" ? ast : ast.toText?.() ?? "";
    return text.trim().substring(0, MAX_TEXT_CHARS);
  } catch (err) {
    console.error("[upload-doc] extraction error:", err);
    return `[Could not extract text from ${fileName}]`;
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}

// ── POST — upload a document ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let workspaceId: string;
  try {
    ({ workspaceId } = await getWorkspaceContext());
  } catch {
    return NextResponse.json({ error: "No workspace found" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const fileType = ALLOWED_EXTENSIONS[ext];
  if (!fileType) {
    return NextResponse.json(
      {
        error:
          "Unsupported file type. Please upload a PDF, Word (.docx), Excel (.xlsx), or PowerPoint (.pptx) file.",
      },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "File is too large. Maximum size is 10 MB." },
      { status: 400 }
    );
  }

  // Load current docExtracts
  const profile = await db.orgProfile.findUnique({
    where: { workspaceId },
    select: { id: true, docExtracts: true },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "Please save your profile at least once before uploading documents." },
      { status: 400 }
    );
  }

  let docs: DocExtract[] = [];
  try {
    docs = JSON.parse(profile.docExtracts);
  } catch {
    docs = [];
  }

  if (docs.length >= MAX_DOCS) {
    return NextResponse.json(
      { error: `Maximum of ${MAX_DOCS} documents allowed. Delete one first.` },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = await extractText(buffer, file.name);

  const newDoc: DocExtract = {
    id: randomUUID(),
    name: file.name,
    size: file.size,
    type: fileType,
    uploadedAt: new Date().toISOString(),
    text,
  };

  docs.push(newDoc);

  await db.orgProfile.update({
    where: { workspaceId },
    data: { docExtracts: JSON.stringify(docs) },
  });

  // Return metadata only (text stays server-side)
  const { text: _t, ...meta } = newDoc;
  return NextResponse.json({ doc: meta, total: docs.length });
}

// ── DELETE — remove a document ───────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let workspaceId: string;
  try {
    ({ workspaceId } = await getWorkspaceContext());
  } catch {
    return NextResponse.json({ error: "No workspace found" }, { status: 400 });
  }

  const docId = req.nextUrl.searchParams.get("id");
  if (!docId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const profile = await db.orgProfile.findUnique({
    where: { workspaceId },
    select: { docExtracts: true },
  });

  let docs: DocExtract[] = [];
  try {
    docs = JSON.parse(profile?.docExtracts ?? "[]");
  } catch {
    docs = [];
  }

  const filtered = docs.filter((d) => d.id !== docId);

  await db.orgProfile.update({
    where: { workspaceId },
    data: { docExtracts: JSON.stringify(filtered) },
  });

  return NextResponse.json({ total: filtered.length });
}
