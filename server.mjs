import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { resolve, sep, extname } from "node:path";
import { spawn } from "node:child_process";

const root = resolve(".");
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  } catch {
    response.writeHead(400).end("Solicitud no válida");
    return;
  }

  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const file = resolve(root, relative);
  if (file !== root && !file.startsWith(root + sep)) {
    response.writeHead(403).end("Acceso denegado");
    return;
  }

  try {
    if (!statSync(file).isFile()) throw new Error("No es archivo");
    response.writeHead(200, {
      "Content-Type": types[extname(file).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404).end("No encontrado");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Laboratorio Creativo disponible en http://localhost:${port}`);
  console.log("Deja esta ventana abierta mientras usas el proyecto. Presiona Ctrl+C para detenerlo.");
  const browser = spawn("cmd", ["/c", "start", "", `http://localhost:${port}`], { stdio: "ignore", detached: true });
  browser.unref();
});
