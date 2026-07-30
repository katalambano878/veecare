import { createReadStream, existsSync, readFileSync, statSync } from "fs";
import { Readable } from "stream";
import { guessPublicObjectContentType, resolvePublicObjectPath } from "@/lib/db/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Small product photos: buffer once (avoids slow stream plumbing through Next/Traefik). */
const BUFFER_MAX_BYTES = 512 * 1024;

export async function GET(
  req: Request,
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
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Content-Length": String(stat.size),
    "Cache-Control": "public, max-age=31536000, immutable",
    "Access-Control-Allow-Origin": "*",
    "X-Content-Type-Options": "nosniff",
  };

  if (stat.size <= BUFFER_MAX_BYTES) {
    const body = readFileSync(full);
    return new Response(body, { status: 200, headers });
  }

  const nodeStream = createReadStream(full);
  const onAbort = () => {
    nodeStream.destroy();
  };
  req.signal.addEventListener("abort", onAbort);
  nodeStream.on("error", () => {
    /* client disconnect / destroy */
  });

  return new Response(Readable.toWeb(nodeStream) as ReadableStream, {
    status: 200,
    headers,
  });
}
