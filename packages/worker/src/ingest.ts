import type { Client } from 'tdl';
import { Pool } from 'pg';

type NormalizedMessage = {
  chat_id: number;
  message_id: number;
  date: string;
  from_user_id: number | null;
  text_plain: string;
  media_type: string;
  media_caption: string;
  reply_to: number | null;
  has_links: boolean;
  media_text: string;
};

export async function runIngestion(td: Client) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const processedUsers = new Set<number>();

  try {
    if (typeof (td as any).connectAndLogin === 'function') {
      await (td as any).connectAndLogin();
    }

    const chatList = await safeInvoke(td, {
      _: 'getChats',
      chat_list: { _: 'chatListMain' },
      offset_order: '9223372036854775807',
      offset_chat_id: 0,
      limit: 200
    });

    const chatIds: number[] = Array.isArray(chatList?.chat_ids)
      ? chatList.chat_ids.map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id))
      : [];

    for (const chatId of chatIds) {
      const chat = await safeInvoke(td, { _: 'getChat', chat_id: chatId });
      await saveChat(pool, chatId, chat);
      await ingestChatHistory(td, pool, processedUsers, chatId);
    }
  } finally {
    if (typeof (td as any).close === 'function') {
      await (td as any).close();
    }
    await pool.end();
  }
}

async function ingestChatHistory(td: Client, pool: Pool, processedUsers: Set<number>, chatId: number) {
  let fromMessageId = 0;
  const pageSize = 100;

  for (let iteration = 0; iteration < 50; iteration += 1) {
    const history = await safeInvoke(td, {
      _: 'getChatHistory',
      chat_id: chatId,
      from_message_id: fromMessageId,
      offset: -pageSize,
      limit: pageSize,
      only_local: false
    });

    const messages: any[] = Array.isArray(history?.messages) ? history.messages : [];
    if (!messages.length) {
      break;
    }

    const normalized = messages
      .map((message) => normalizeMessage(chatId, message))
      .filter((msg): msg is NormalizedMessage => Boolean(msg));

    await saveMessages(pool, normalized);

    for (const message of normalized) {
      if (message.from_user_id != null && !processedUsers.has(message.from_user_id)) {
        await ensureUser(td, pool, processedUsers, message.from_user_id);
      }
    }

    const lastMessage = messages[messages.length - 1];
    const nextId = typeof lastMessage?.id === 'bigint'
      ? Number(lastMessage.id)
      : Number(lastMessage?.id ?? 0);

    if (!Number.isFinite(nextId) || messages.length < pageSize) {
      break;
    }

    fromMessageId = nextId;
  }
}

async function saveChat(pool: Pool, chatId: number, chat: any) {
  const type = deriveChatType(chat);
  const title = typeof chat?.title === 'string' ? chat.title : '';
  const username = typeof chat?.username === 'string' ? chat.username : null;

  await pool.query(
    `INSERT INTO tg_chats (chat_id, type, title, username)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (chat_id) DO UPDATE
       SET type = EXCLUDED.type,
           title = EXCLUDED.title,
           username = EXCLUDED.username`,
    [chatId, type, title, username]
  );
}

async function saveMessages(pool: Pool, messages: NormalizedMessage[]) {
  for (const message of messages) {
    await pool.query(
      `INSERT INTO tg_messages (chat_id, message_id, date, from_user_id, text_plain, media_type, media_caption, reply_to, has_links, media_text)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (chat_id, message_id) DO UPDATE SET
         date = EXCLUDED.date,
         from_user_id = EXCLUDED.from_user_id,
         text_plain = EXCLUDED.text_plain,
         media_type = EXCLUDED.media_type,
         media_caption = EXCLUDED.media_caption,
         reply_to = EXCLUDED.reply_to,
         has_links = EXCLUDED.has_links,
         media_text = EXCLUDED.media_text`,
      [
        message.chat_id,
        message.message_id,
        message.date,
        message.from_user_id,
        message.text_plain,
        message.media_type,
        message.media_caption,
        message.reply_to,
        message.has_links,
        message.media_text
      ]
    );
  }
}

async function ensureUser(td: Client, pool: Pool, processedUsers: Set<number>, userId: number) {
  processedUsers.add(userId);
  const user = await safeInvoke(td, { _: 'getUser', user_id: userId });
  if (!user) return;

  const username = typeof user.username === 'string' ? user.username : null;
  const firstName = typeof user.first_name === 'string' ? user.first_name : '';
  const lastName = typeof user.last_name === 'string' ? user.last_name : '';

  await pool.query(
    `INSERT INTO tg_users (user_id, username, first_name, last_name)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (user_id) DO UPDATE SET
       username = EXCLUDED.username,
       first_name = EXCLUDED.first_name,
       last_name = EXCLUDED.last_name`,
    [userId, username, firstName, lastName]
  );
}

function normalizeMessage(chatId: number, message: any): NormalizedMessage | null {
  if (!message) return null;
  const rawId = typeof message.id === 'bigint' ? Number(message.id) : Number(message?.id ?? 0);
  if (!Number.isFinite(rawId) || rawId <= 0) return null;

  const sender = message.sender_id;
  const fromUserId = typeof sender?.user_id === 'number' ? sender.user_id : null;
  const dateSeconds = typeof message.date === 'number' ? message.date : 0;
  const dateIso = new Date(dateSeconds * 1000).toISOString();
  const replyRaw = message.reply_to?.message_id ?? message.reply_to_message_id;
  const replyTo = typeof replyRaw === 'number' ? replyRaw : null;

  const content = message.content ?? {};
  let text = '';
  let mediaType = 'none';
  let caption = '';
  let mediaText = '';

  const readFormatted = (value: any): string => {
    if (!value) return '';
    if (typeof value.text === 'string') return value.text;
    if (typeof value === 'string') return value;
    return '';
  };

  switch (content._) {
    case 'messageText':
      text = readFormatted(content.text);
      break;
    case 'messagePhoto':
      mediaType = 'photo';
      caption = readFormatted(content.caption);
      mediaText = caption;
      break;
    case 'messageVideo':
      mediaType = 'video';
      caption = readFormatted(content.caption);
      mediaText = caption;
      break;
    case 'messageDocument':
      mediaType = 'document';
      caption = readFormatted(content.caption);
      mediaText = caption;
      break;
    case 'messageAudio':
      mediaType = 'audio';
      caption = readFormatted(content.caption);
      mediaText = caption;
      break;
    case 'messageAnimation':
      mediaType = 'animation';
      caption = readFormatted(content.caption);
      mediaText = caption;
      break;
    case 'messageVoiceNote':
      mediaType = 'voice';
      caption = readFormatted(content.caption);
      mediaText = caption;
      break;
    default:
      if (content.text) {
        text = readFormatted(content.text);
      }
      if (content.caption) {
        caption = readFormatted(content.caption);
        mediaText = caption;
      }
  }

  const hasLinks = /https?:\/\//i.test(`${text} ${caption}`.trim());

  return {
    chat_id: chatId,
    message_id: rawId,
    date: dateIso,
    from_user_id: fromUserId,
    text_plain: text,
    media_type: mediaType,
    media_caption: caption,
    reply_to: replyTo,
    has_links: hasLinks,
    media_text: mediaText
  };
}

function deriveChatType(chat: any): 'private' | 'group' | 'supergroup' | 'channel' {
  const rawType = chat?.type?._;
  switch (rawType) {
    case 'chatTypePrivate':
    case 'chatTypeSecret':
      return 'private';
    case 'chatTypeBasicGroup':
      return 'group';
    case 'chatTypeSupergroup':
      return chat?.type?.is_channel ? 'channel' : 'supergroup';
    case 'chatTypeChannel':
      return 'channel';
    default:
      return 'group';
  }
}

async function safeInvoke(td: Client, payload: any) {
  try {
    return await (td as any).invoke?.(payload);
  } catch (error) {
    return null;
  }
}
