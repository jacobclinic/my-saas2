export interface PublishMessage<T> {
  url: string;
  body: T;
  delay?: number;
  retries?: number;
}

export interface PublishResult {
  messageId: string;
  timestamp: number;
}

export type UpstashPublishParams<T> = PublishMessage<T>;
export type UpstashPublishResponse = PublishResult;
