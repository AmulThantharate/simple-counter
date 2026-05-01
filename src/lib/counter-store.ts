import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  COUNTER_REDIS_KEY,
  defaultPersistedCounterState,
  type PersistedCounterState,
} from "@/lib/counter-state";

const persistedCounterStateSchema = z.object({
  value: z.number(),
  step: z.number().min(1),
  preventNegative: z.boolean(),
  soundEnabled: z.boolean(),
  reducedMotion: z.boolean(),
});

type RedisConfig = {
  host: string;
  port: number;
  password?: string;
  username?: string;
  database?: number;
  tls: boolean;
  key: string;
};

type RedisCommandResult = null | number | string;

type RedisTransport = {
  write(data: Uint8Array): Promise<void>;
  read(): Promise<Uint8Array | null>;
  close(): Promise<void>;
};

function getRedisConfig(): RedisConfig | null {
  const host = process.env.REDIS_HOST;

  if (!host) {
    return null;
  }

  return {
    host,
    port: Number(process.env.REDIS_PORT || "6379") || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    username: process.env.REDIS_USERNAME || undefined,
    database: process.env.REDIS_DATABASE ? Number(process.env.REDIS_DATABASE) : undefined,
    tls: process.env.REDIS_TLS === "true",
    key: process.env.COUNTER_REDIS_KEY || COUNTER_REDIS_KEY,
  };
}

function encodeCommand(parts: Array<string | number>) {
  const encoder = new TextEncoder();
  const chunks = [`*${parts.length}\r\n`];

  for (const part of parts) {
    const value = String(part);
    chunks.push(`$${encoder.encode(value).byteLength}\r\n${value}\r\n`);
  }

  return encoder.encode(chunks.join(""));
}

class RespReader {
  private readonly decoder = new TextDecoder();
  private buffer = "";
  private readonly readChunk: () => Promise<Uint8Array | null>;

  constructor(readChunk: () => Promise<Uint8Array | null>) {
    this.readChunk = readChunk;
  }

  private async fillBuffer() {
    const value = await this.readChunk();

    if (!value) {
      throw new Error("Redis connection closed unexpectedly");
    }

    this.buffer += this.decoder.decode(value, { stream: true });
  }

  private async readLine() {
    while (!this.buffer.includes("\r\n")) {
      await this.fillBuffer();
    }

    const index = this.buffer.indexOf("\r\n");
    const line = this.buffer.slice(0, index);
    this.buffer = this.buffer.slice(index + 2);
    return line;
  }

  async readValue(): Promise<RedisCommandResult> {
    const header = await this.readLine();
    const prefix = header[0];
    const payload = header.slice(1);

    if (prefix === "+") {
      return payload;
    }

    if (prefix === "-") {
      throw new Error(payload);
    }

    if (prefix === ":") {
      return Number(payload);
    }

    if (prefix === "$") {
      const length = Number(payload);

      if (length === -1) {
        return null;
      }

      while (this.buffer.length < length + 2) {
        await this.fillBuffer();
      }

      const value = this.buffer.slice(0, length);
      this.buffer = this.buffer.slice(length + 2);
      return value;
    }

    throw new Error(`Unsupported Redis response type: ${prefix}`);
  }
}

async function createNodeTransport(config: RedisConfig): Promise<RedisTransport> {
  const { Socket } = await import("node:net");
  const tlsModule = config.tls ? await import("node:tls") : null;

  const socket =
    config.tls && tlsModule
      ? tlsModule.connect({
          host: config.host,
          port: config.port,
          servername: config.host,
        })
      : new Socket();

  if (!config.tls) {
    socket.connect(config.port, config.host);
  }

  await new Promise<void>((resolve, reject) => {
    const onConnect = () => {
      cleanup();
      resolve();
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      socket.off("connect", onConnect);
      socket.off("secureConnect", onConnect);
      socket.off("error", onError);
    };

    socket.once(config.tls ? "secureConnect" : "connect", onConnect);
    socket.once("error", onError);
  });

  return {
    write(data) {
      return new Promise<void>((resolve, reject) => {
        socket.write(Buffer.from(data), (error?: Error | null) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
    read() {
      return new Promise<Uint8Array | null>((resolve, reject) => {
        const onData = (chunk: Buffer) => {
          cleanup();
          resolve(new Uint8Array(chunk));
        };

        const onEnd = () => {
          cleanup();
          resolve(null);
        };

        const onError = (error: Error) => {
          cleanup();
          reject(error);
        };

        const cleanup = () => {
          socket.off("data", onData);
          socket.off("end", onEnd);
          socket.off("error", onError);
        };

        socket.once("data", onData);
        socket.once("end", onEnd);
        socket.once("error", onError);
      });
    },
    close() {
      return new Promise<void>((resolve) => {
        socket.end(() => resolve());
      });
    },
  };
}

async function createWorkersTransport(config: RedisConfig): Promise<RedisTransport> {
  const { connect } = await import("cloudflare:sockets");
  const socket = connect(
    {
      hostname: config.host,
      port: config.port,
    },
    {
      secureTransport: config.tls ? "on" : "off",
    },
  );

  await socket.opened;

  const writer = socket.writable.getWriter();
  const reader = socket.readable.getReader();

  return {
    async write(data) {
      await writer.write(data);
    },
    async read() {
      const { done, value } = await reader.read();
      return done ? null : value;
    },
    async close() {
      reader.releaseLock();
      writer.releaseLock();
      await socket.close();
    },
  };
}

async function createRedisTransport(config: RedisConfig) {
  const isNode = typeof process !== "undefined" && process.release?.name === "node";
  return isNode ? createNodeTransport(config) : createWorkersTransport(config);
}

async function withRedis<T>(
  run: (command: (...parts: Array<string | number>) => Promise<RedisCommandResult>) => Promise<T>,
): Promise<T | null> {
  const config = getRedisConfig();

  if (!config) {
    return null;
  }

  const transport = await createRedisTransport(config);
  const reader = new RespReader(() => transport.read());

  const command = async (...parts: Array<string | number>) => {
    await transport.write(encodeCommand(parts));
    return reader.readValue();
  };

  try {
    if (config.password) {
      if (config.username) {
        await command("AUTH", config.username, config.password);
      } else {
        await command("AUTH", config.password);
      }
    }

    if (typeof config.database === "number" && Number.isFinite(config.database)) {
      await command("SELECT", config.database);
    }

    return await run(command);
  } finally {
    await transport.close();
  }
}

export const loadCounterState = createServerFn({ method: "GET" }).handler(async () => {
  const config = getRedisConfig();

  if (!config) {
    return {
      state: null,
      redisConfigured: false,
    };
  }

  const rawState = await withRedis((command) => command("GET", config.key));

  if (!rawState) {
    return {
      state: defaultPersistedCounterState,
      redisConfigured: true,
    };
  }

  if (typeof rawState !== "string") {
    throw new Error("Redis returned an unexpected value for counter state");
  }

  return {
    state: persistedCounterStateSchema.parse(JSON.parse(rawState)) as PersistedCounterState,
    redisConfigured: true,
  };
});

export const saveCounterState = createServerFn({ method: "POST" })
  .inputValidator(persistedCounterStateSchema)
  .handler(async ({ data }) => {
    const config = getRedisConfig();

    if (!config) {
      return {
        ok: false,
        redisConfigured: false,
      };
    }

    await withRedis((command) => command("SET", config.key, JSON.stringify(data)));

    return {
      ok: true,
      redisConfigured: true,
    };
  });
