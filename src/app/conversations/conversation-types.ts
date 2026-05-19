// Types for the conversations/messaging feature.

export type Conversation = {
  id: string;
  partner_id: string;
  partner_handle: string;
  partner_country?: string;
  partner_age?: number;
  created_at: string;
  last_message_body?: string;
  last_message_at?: string;
  last_sender_id?: string;
};

export type ConversationsResponse = {
  items: Conversation[];
  has_more: boolean;
};

export type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type MessagesResponse = {
  items: Message[];
  next_cursor?: string;
};

export type SendMessageResponse = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};
