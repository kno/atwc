
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { query } from '../db.js';

const schema = z.object({
  q: z.string().min(1),
  chatId: z.string().optional(),
  fromUserId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  has: z.enum(['link','media']).optional(),
  mediaType: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0)
});

export default async function searchRoute(app: FastifyInstance) {
  app.get('/search', async (req, reply) => {
    const p = schema.parse(req.query);
    const filters: string[] = [];
    const vals: any[] = [];

    vals.push(p.q);
    if (p.chatId) { vals.push(p.chatId); filters.push(`chat_id = $${vals.length}`); }
    if (p.fromUserId) { vals.push(p.fromUserId); filters.push(`from_user_id = $${vals.length}`); }
    if (p.dateFrom) { vals.push(p.dateFrom); filters.push(`date >= $${vals.length}::timestamptz`); }
    if (p.dateTo) { vals.push(p.dateTo); filters.push(`date <= $${vals.length}::timestamptz`); }
    if (p.has === 'link') filters.push(`has_links = TRUE`);
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
  });
}
