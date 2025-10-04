declare const process: {
  env: Record<string, string | undefined>;
  exit(code?: number): never;
};

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

declare module 'tdl' {
  export class Client {
    constructor(tdlib: any, options?: any);
    connectAndLogin(): Promise<void>;
    invoke<R = any>(payload: any): Promise<R>;
    close(): Promise<void>;
  }
}

declare module 'tdl-tdlib-addon' {
  export class TDLib {
    constructor(libraryPath?: string);
  }
}
