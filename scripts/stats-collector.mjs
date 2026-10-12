import http from "http";
import fs from "fs";
import path from "path";

const dir = path.resolve(import.meta.dirname, "../data/pages");
fs.mkdirSync(dir, { recursive: true });

const queue = [];
const waiters = new Map();
let seq = 0;
let lastSeen = 0;

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || "/", "http://127.0.0.1:8787");

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ lastSeen }));
    return;
  }

  if (req.method === "GET" && url.pathname === "/next") {
    lastSeen = Date.now();
    const job = queue.shift() ?? null;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(job));
    return;
  }

  if (req.method === "POST" && url.pathname === "/ask") {
    const data = await readBody(req);
    const id = ++seq;
    queue.push({ id, path: String(data.path || "") });
    const timer = setTimeout(() => {
      if (!waiters.has(id)) return;
      waiters.delete(id);
      res.writeHead(504);
      res.end("timeout");
    }, 12000);
    waiters.set(id, (payload) => {
      clearTimeout(timer);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(payload));
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/result") {
    const data = await readBody(req);
    const waiter = waiters.get(data.id);
    if (waiter) {
      waiters.delete(data.id);
      waiter({ status: data.status, html: data.html });
    }
    res.writeHead(200);
    res.end("ok");
    return;
  }

  if (req.method === "POST") {
    const data = await readBody(req);
    const page = Number(data.page);
    if (!Number.isInteger(page) || page < 0 || page > 20000) {
      res.writeHead(400);
      res.end("bad page");
      return;
    }
    fs.writeFileSync(path.join(dir, String(page).padStart(5, "0") + ".json"), JSON.stringify(data.rows));
    res.writeHead(200);
    res.end("ok");
    return;
  }

  res.writeHead(200);
  res.end("ok");
});

server.listen(8787, "127.0.0.1", () => {
  console.log("stats collector on 8787");
});
