import { NextRequest, NextResponse } from "next/server";
import { createStorageClient } from "@/lib/db/storage";
import { isPlainPostgres } from "@/lib/db/mode";
import { resolveRestActor } from "@/lib/db/rest-auth";
import { authorizeStorageWrite } from "@/lib/db/rest-acl";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Supabase Storage upload:
 *   POST /storage/v1/object/{bucket}/{path}
 *   body = raw file bytes OR multipart/form-data (browser supabase-js client)
 */
async function readUploadBody(
  req: NextRequest
): Promise<{ buf: Buffer; contentType: string } | { error: string }> {
  const contentTypeHeader = req.headers.get("content-type") || "application/octet-stream";

  // @supabase/supabase-js sends browser uploads as multipart/form-data.
  if (contentTypeHeader.includes("multipart/form-data")) {
    const formData = await req.formData();
    for (const [, value] of formData.entries()) {
      if (
        typeof value === "object" &&
        value !== null &&
        typeof (value as Blob).arrayBuffer === "function" &&
        (value as Blob).size > 0
      ) {
        const blob = value as Blob;
        return {
          buf: Buffer.from(await blob.arrayBuffer()),
          contentType: blob.type || "application/octet-stream",
        };
      }
    }
    return { error: "No file found in multipart upload body" };
  }

  return {
    buf: Buffer.from(await req.arrayBuffer()),
    contentType: contentTypeHeader.split(";")[0].trim() || "application/octet-stream",
  };
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ bucket: string; path: string[] }> }
) {
  if (!isPlainPostgres()) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
  }

  const actor = await resolveRestActor(req);
  const decision = authorizeStorageWrite(actor);
  if (!decision.allow) {
    return NextResponse.json({ error: decision.message }, { status: decision.status });
  }

  const { bucket, path } = await ctx.params;
  const objectPath = path.map(decodeURIComponent).join("/");
  const upsert = (req.headers.get("x-upsert") || "").toLowerCase() === "true";

  const body = await readUploadBody(req);
  if ("error" in body) {
    return NextResponse.json({ error: body.error }, { status: 400 });
  }
  const { buf, contentType } = body;

  const storage = createStorageClient();
  const { data, error } = await storage.from(bucket).upload(objectPath, buf, {
    contentType,
    upsert,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data: pub } = storage.from(bucket).getPublicUrl(objectPath);
  return NextResponse.json({
    Key: `${bucket}/${objectPath}`,
    Id: data?.path,
    ...data,
    publicUrl: pub.publicUrl,
  });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ bucket: string; path: string[] }> }
) {
  if (!isPlainPostgres()) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
  }

  const actor = await resolveRestActor(req);
  const decision = authorizeStorageWrite(actor);
  if (!decision.allow) {
    return NextResponse.json({ error: decision.message }, { status: decision.status });
  }

  const { bucket, path } = await ctx.params;
  const objectPath = path.map(decodeURIComponent).join("/");
  const storage = createStorageClient();
  const { error } = await storage.from(bucket).remove([objectPath]);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({});
}
