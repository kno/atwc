import { Client } from 'tdl';
import { TDLib } from 'tdl-tdlib-addon';

export function createTdClient() {
  const tdlib = new TDLib(process.env.TDJSON_PATH || '/usr/local/lib/libtdjson.so');
  const client = new Client(tdlib, {
    apiId: Number(process.env.TELEGRAM_API_ID),
    apiHash: String(process.env.TELEGRAM_API_HASH),
    databaseDirectory: `/data/tdlib/${process.env.USER_SPACE || 'default'}`,
    useFileDatabase: true,
    useChatInfoDatabase: true,
    useMessageDatabase: true,
    systemLanguageCode: 'es'
  });
  return client;
}
