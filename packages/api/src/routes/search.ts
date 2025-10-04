import { FastifyInstance } from 'fastify';
import { query } from '../db.js';
import type { SearchParams } from '../types.js';

type ParsedSearch = Required<Pick<SearchParams, 'q'>> & Omit<SearchParams, 'q'> & { limit: number; offset: number };

const ISO_DATE_RE = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)$/;

function parseSearchParams(raw: unknown): ParsedSearch {
  const source = (raw ?? {}) as Record<string, unknown>;
  const q = typeof source.q === 'string' ? source.q.trim() : '';
  if (!q) {
    throw new Error('El parámetro "q" es obligatorio');
  }

  const parseString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  };

  const chatId = parseString(source.chatId);
  const fromUserId = parseString(source.fromUserId);
  const mediaType = parseString(source.mediaType);

  const parseDate = (value: unknown): string | undefined => {
    const str = parseString(value);
    if (!str) return undefined;
    if (!ISO_DATE_RE.test(str) || Number.isNaN(Date.parse(str))) {
      throw new Error('Fecha inválida');
    }
    return new Date(str).toISOString();
  };

  const dateFrom = parseDate(source.dateFrom);
  const dateTo = parseDate(source.dateTo);

  const hasRaw = parseString(source.has);
  let has: 'link' | 'media' | undefined;
  if (hasRaw) {
    if (hasRaw !== 'link' && hasRaw !== 'media') {
      throw new Error('Valor inválido para "has"');
    }
    has = hasRaw;
  }

  const parseNumber = (value: unknown, { min, max, fallback }: { min: number; max: number; fallback: number }): number => {
    const num = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
    if (!Number.isFinite(num)) {
      return fallback;
    }
    const clamped = Math.max(min, Math.min(max, num));
    return clamped;
  };

  const limit = parseNumber(source.limit, { min: 1, max: 200, fallback: 50 });
  const offset = parseNumber(source.offset, { min: 0, max: Number.MAX_SAFE_INTEGER, fallback: 0 });

  return { q, chatId, fromUserId, mediaType, dateFrom, dateTo, has, limit, offset };
}

export default async function searchRoute(app: FastifyInstance) {
  app.get('/search', async (req, reply) => {
    try {
      const p = parseSearchParams((req as any).query);
      const filters: string[] = [];
      const vals: any[] = [];

      vals.push(p.q);
      if (p.chatId) { vals.push(p.chatId); filters.push(`chat_id = $${vals.length}`); }
      if (p.fromUserId) { vals.push(p.fromUserId); filters.push(`from_user_id = $${vals.length}`); }
      if (p.dateFrom) { vals.push(p.dateFrom); filters.push(`date >= $${vals.length}::timestamptz`); }
      if (p.dateTo) { vals.push(p.dateTo); filters.push(`date <= $${vals.length}::timestamptz`); }
      if (p.has === 'link') filters.push('has_links = TRUE');
      if (p.has === 'media') filters.push(`media_type <> 'none'`);
      if (p.mediaType) { vals.push(p.mediaType); filters.push(`media_type = $${vals.length}`); }

      vals.push(p.limit);
      vals.push(p.offset);
      const where = filters.length ? `AND ${filters.join(' AND ')}` : '';

      const sql = `WITH q AS (SELECT websearch_to_tsquery('spanish', $1) AS tsq)
        SELECT chat_id, message_id, date, from_user_id,
               ts_rank_cd(text_fts, q.tsq) AS score,
               left(text_plain, 500) AS text_plain,
               left(media_caption, 300) AS media_caption,
               media_type, has_links
        FROM tg_messages, q
        WHERE text_fts @@ q.tsq
        ${where}
        ORDER BY score DESC, date DESC
        LIMIT $${vals.length - 1} OFFSET $${vals.length}`;

      const { rows } = await query(sql, vals);
      return { items: rows };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Parámetros inválidos';
      if ((reply as any)?.status) {
        (reply as any).status(400);
      }
      return { error: message };
    }
  });
}
