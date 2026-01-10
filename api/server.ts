import Fastify from "fastify";
import type { FastifyInstance } from "fastify";

const fastify: FastifyInstance = Fastify({ logger: true });

fastify.get("/api/health", async () => {
  return { status: "ok" };
});

fastify.get("/api/info", async () => {
  return { name: "My App", version: "1.0.0" };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("API server is running at http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
