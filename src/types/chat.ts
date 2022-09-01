
export class ChatMessage {
  constructor(
    public chatId: string,
    public senderId: number,
    public recipientId: number,
    public senderName: string,
    public recipientName: string,
    public content: string,
    public timestamp: Date,
    public status: MessageStatus
  ) {}
}

export class PushedChatMessage {
  constructor(
    public senderId: number,
    public recipientId: number,
    public senderName: string,
    public recipientName: string,
    public content: string,
    public timestamp: Date,
  ) {}
}

export enum MessageStatus {
  RECEIVED, DELIVERED
}