import { createReadStream, existsSync, statSync } from "fs";
import { Readable } from "stream";
import path from "path";
import { guessPublicObjectContentType, resolvePublicObjectPath } from "@/lib/db/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ bucket: string; path: string[] }> }
): Promise<Response> {
  const { bucket, path: parts } = await ctx.params;
  const objectPath = parts.map(decodeURIComponent).join("/");

  let full: string;
  try {
    full = resolvePublicObjectPath(bucket, objectPath);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid path" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!existsSync(full) || !statSync(full).isFile()) {
    return new Response(JSON.stringify({ error: "Object not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stat = statSync(full);
  const contentType = guessPublicObjectContentType(full, objectPath);
  const nodeStream = createReadStream(full);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(stat.size),
      "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
