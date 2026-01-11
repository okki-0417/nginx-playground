import { readdir } from "node:fs/promises";
import { join } from "node:path";

// 型定義
type User = { id: number; name: string; email: string };
type Todo = { id: number; userId: number; title: string; completed: boolean };

// nginx.d ディレクトリのパス
const NGINX_CONF_DIR = join(import.meta.dir, "..", "nginx.d");

// 仮のデータベース
const users: User[] = [
  { id: 1, name: "田中太郎", email: "tanaka@example.com" },
  { id: 2, name: "山田花子", email: "yamada@example.com" },
  { id: 3, name: "佐藤次郎", email: "sato@example.com" },
];

const todos: Todo[] = [
  { id: 1, userId: 1, title: "買い物", completed: false },
  { id: 2, userId: 1, title: "レポート作成", completed: true },
  { id: 3, userId: 2, title: "会議準備", completed: false },
];

const port = parseInt(process.env.PORT || "3000", 10);

const server = Bun.serve({
  port,
  async fetch(req, server) {
    const url = new URL(req.url);
    const method = req.method;

    // リクエストログ
    console.log(`[${port}] ${method} ${url.pathname}`);

    // WebSocket
    if (url.pathname === "/api/ws") {
      if (server.upgrade(req)) return;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // GET /api/health
    if (url.pathname === "/api/health" && method === "GET") {
      return Response.json({ status: "ok", port, timestamp: new Date().toISOString() });
    }

    // GET /api/info
    if (url.pathname === "/api/info" && method === "GET") {
      return Response.json({ name: "My App", version: "1.0.0" });
    }

    // GET /api/time
    if (url.pathname === "/api/time" && method === "GET") {
      return Response.json({
        iso: new Date().toISOString(),
        unix: Date.now(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    }

    // GET /api/users
    if (url.pathname === "/api/users" && method === "GET") {
      return Response.json(users);
    }

    // GET /api/users/:id
    const userMatch = url.pathname.match(/^\/api\/users\/(\d+)$/);
    if (userMatch && method === "GET") {
      const id = parseInt(userMatch[1] ?? "0", 10);
      const user = users.find((u) => u.id === id);
      if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }
      return Response.json(user);
    }

    // POST /api/users
    if (url.pathname === "/api/users" && method === "POST") {
      const body = (await req.json()) as { name: string; email: string };
      const newUser: User = {
        id: users.length + 1,
        name: body.name,
        email: body.email,
      };
      users.push(newUser);
      return Response.json(newUser, { status: 201 });
    }

    // GET /api/todos
    if (url.pathname === "/api/todos" && method === "GET") {
      const userId = url.searchParams.get("userId");
      if (userId) {
        return Response.json(todos.filter((t) => t.userId === parseInt(userId, 10)));
      }
      return Response.json(todos);
    }

    // GET /api/todos/:id
    const todoMatch = url.pathname.match(/^\/api\/todos\/(\d+)$/);
    if (todoMatch && method === "GET") {
      const id = parseInt(todoMatch[1] ?? "0", 10);
      const todo = todos.find((t) => t.id === id);
      if (!todo) {
        return Response.json({ error: "Todo not found" }, { status: 404 });
      }
      return Response.json(todo);
    }

    // PATCH /api/todos/:id
    if (todoMatch && method === "PATCH") {
      const id = parseInt(todoMatch[1] ?? "0", 10);
      const todo = todos.find((t) => t.id === id);
      if (!todo) {
        return Response.json({ error: "Todo not found" }, { status: 404 });
      }
      const body = (await req.json()) as { completed?: boolean; title?: string };
      if (body.completed !== undefined) todo.completed = body.completed;
      if (body.title !== undefined) todo.title = body.title;
      return Response.json(todo);
    }

    // GET /api/echo?message=xxx
    if (url.pathname === "/api/echo" && method === "GET") {
      const message = url.searchParams.get("message") || "Hello!";
      return Response.json({ echo: message });
    }

    // POST /api/echo (ボディをそのまま返す)
    if (url.pathname === "/api/echo" && method === "POST") {
      const body = await req.json();
      return Response.json({ received: body });
    }

    // ========================================
    // Admin API: nginx 設定管理
    // ========================================

    // GET /api/admin/sites - conf ファイル一覧
    if (url.pathname === "/api/admin/sites" && method === "GET") {
      try {
        const rootFiles = await readdir(NGINX_CONF_DIR);
        const confFiles = rootFiles.filter((f) => f.endsWith(".conf"));

        // locations/ 配下も取得
        const locationsDir = join(NGINX_CONF_DIR, "locations");
        try {
          const locationFiles = await readdir(locationsDir);
          const locationConfFiles = locationFiles
            .filter((f) => f.endsWith(".conf"))
            .map((f) => `locations/${f}`);
          confFiles.push(...locationConfFiles);
        } catch {
          // locations ディレクトリがなければスキップ
        }

        return Response.json(confFiles);
      } catch (error) {
        return Response.json({ error: "Failed to read conf directory" }, { status: 500 });
      }
    }

    // GET /api/admin/sites/:path - conf ファイル内容取得 (locations/xxx.conf も対応)
    const siteMatch = url.pathname.match(/^\/api\/admin\/sites\/(.+\.conf)$/);
    if (siteMatch && method === "GET") {
      const filePath = siteMatch[1];
      // セキュリティ: ../ を含むパスは拒否
      if (filePath?.includes("..")) {
        return Response.json({ error: "Invalid file path" }, { status: 400 });
      }
      try {
        const fullPath = join(NGINX_CONF_DIR, filePath!);
        const file = Bun.file(fullPath);
        if (!(await file.exists())) {
          return Response.json({ error: "File not found" }, { status: 404 });
        }
        const content = await file.text();
        return Response.json({ name: filePath, content });
      } catch (error) {
        return Response.json({ error: "Failed to read file" }, { status: 500 });
      }
    }

    // PUT /api/admin/sites/:path - conf ファイル更新
    if (siteMatch && method === "PUT") {
      const filePath = siteMatch[1];
      if (filePath?.includes("..")) {
        return Response.json({ error: "Invalid file path" }, { status: 400 });
      }
      try {
        const body = (await req.json()) as { content: string };
        const fullPath = join(NGINX_CONF_DIR, filePath!);
        await Bun.write(fullPath, body.content);
        return Response.json({ success: true, name: filePath });
      } catch (error) {
        return Response.json({ error: "Failed to write file" }, { status: 500 });
      }
    }

    // POST /api/admin/reload - nginx リロード
    if (url.pathname === "/api/admin/reload" && method === "POST") {
      try {
        const proc = Bun.spawn(["docker", "compose", "exec", "nginx", "nginx", "-s", "reload"], {
          cwd: join(import.meta.dir, ".."),
        });
        const exitCode = await proc.exited;
        if (exitCode === 0) {
          return Response.json({ success: true, message: "nginx reloaded" });
        } else {
          return Response.json({ error: "nginx reload failed", exitCode }, { status: 500 });
        }
      } catch (error) {
        return Response.json({ error: "Failed to execute reload command" }, { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
  websocket: {
    open(ws) {
      console.log("Client connected");
      ws.subscribe("chat");
      ws.send(JSON.stringify({ type: "system", message: "チャットに接続しました" }));
    },
    message(ws, message) {
      console.log("Received:", message);
      ws.publish("chat", message);
      ws.send(message);
    },
    close(ws) {
      console.log("Client disconnected");
      ws.unsubscribe("chat");
    },
  },
});

console.log(`API server is running at http://localhost:${server.port}`);
