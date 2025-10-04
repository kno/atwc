export type SearchParams = {
  q: string;
  chatId?: string;
  fromUserId?: string;
  dateFrom?: string;
  dateTo?: string;
  has?: 'link' | 'media';
  mediaType?: string;
  limit: number;
  offset: number;
};
