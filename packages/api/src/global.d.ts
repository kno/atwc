declare const process: {
  env: Record<string, string | undefined>;
  exit(code?: number): never;
};

declare module 'fastify' {
  export interface FastifyRequest<TQuery = unknown> {
    query: TQuery;
  }

  export interface FastifyReply {
    status(code: number): FastifyReply;
    send(payload: unknown): void;
  }

  export interface FastifyInstance {
    log: { error(error: unknown): void };
    register(plugin: (instance: FastifyInstance, opts?: any) => Promise<void> | void, opts?: any): Promise<void> | void;
    get(path: string, handler: (request: FastifyRequest, reply: FastifyReply) => unknown | Promise<unknown>): void;
    listen(options: { port: number; host?: string }): Promise<void>;
  }

  export default function Fastify(options?: { logger?: boolean | object }): FastifyInstance;
}

declare module '@fastify/cors' {
  import type { FastifyInstance } from 'fastify';
  const plugin: (app: FastifyInstance, opts?: any) => Promise<void> | void;
  export default plugin;
}

declare module 'pg' {
  export class Pool {
    constructor(config?: any);
    query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }>;
    end(): Promise<void>;
  }

  const pg: { Pool: typeof Pool };
  export { Pool };
  export default pg;
}
