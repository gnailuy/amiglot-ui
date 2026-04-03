export type RequestUser = {
  user_id: string;
  handle: string;
  country_code?: string;
  age?: number;
};

export type MatchRequest = {
  id: string;
  requester: RequestUser;
  recipient: RequestUser;
  status: string;
  message_count: number;
  last_message_at?: string;
  created_at: string;
};

export type MatchRequestsResponse = {
  items: MatchRequest[];
  next_cursor: string | null;
};

export type PreAcceptMessage = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type MessagesResponse = {
  items: PreAcceptMessage[];
  next_cursor: string | null;
};

export type AcceptResponse = {
  ok: boolean;
  match_id: string;
};

export type OkResponse = {
  ok: boolean;
};

export type CreateMatchRequestResponse = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: string;
  initial_message?: string;
  created_at: string;
};
