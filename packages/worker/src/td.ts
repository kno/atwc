import { Client } from 'tdl';
import { TDLib } from 'tdl-tdlib-addon';

function resolveUserSpace(): string {
  const raw = process.env.USER_SPACE ?? 'default';
  const normalized = raw.replace(/[^a-zA-Z0-9_-]/g, '-');
  return normalized || 'default';
}

export function createTdClient() {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  if (!Number.isFinite(apiId) || apiId <= 0) {
    throw new Error('Configura TELEGRAM_API_ID con un número válido');
  }

  const apiHash = process.env.TELEGRAM_API_HASH;
  if (!apiHash) {
    throw new Error('Configura TELEGRAM_API_HASH en las variables de entorno');
  }

  const tdjsonPath = process.env.TDJSON_PATH || '/usr/local/lib/libtdjson.so';
  const tdlib = new TDLib(tdjsonPath);

  const client = new Client(tdlib, {
    apiId,
    apiHash,
    databaseDirectory: `/data/tdlib/${resolveUserSpace()}`,
    useFileDatabase: true,
    useChatInfoDatabase: true,
    useMessageDatabase: true,
    systemLanguageCode: 'es'
  });

  return client;
}
