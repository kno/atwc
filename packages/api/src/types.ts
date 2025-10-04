export type SearchParams = {
  q: string;
  chatId?: string;
  fromUserId?: string;
  dateFrom?: string;
  dateTo?: string;
  has?: 'link' | 'media' | undefined;
  mediaType?: string;
  limit?: number;
  offset?: number;
};