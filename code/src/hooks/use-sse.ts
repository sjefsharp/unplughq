"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface SSEMessage {
  event: string;
  data: string;
}

interface UseSSEOptions {
  url: string;
  enabled?: boolean;
  onMessage?: (message: SSEMessage) => void;
  onError?: (error: Event) => void;
}

export function useSSE({ url, enabled = true, onMessage, onError }: UseSSEOptions) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const sourceRef = useRef<EventSource | null>(null);
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  onMessageRef.current = onMessage;
  onErrorRef.current = onError;

  const disconnect = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      disconnect();
      return;
    }

    const source = new EventSource(url);
    sourceRef.current = source;

    source.onopen = () => setConnected(true);

    source.onmessage = (event) => {
      const msg: SSEMessage = { event: "message", data: event.data };
      setMessages((prev) => [...prev, msg]);
      onMessageRef.current?.(msg);
    };

    source.onerror = (event) => {
      onErrorRef.current?.(event);
      if (source.readyState === EventSource.CLOSED) {
        setConnected(false);
      }
    };

    return () => {
      source.close();
      sourceRef.current = null;
      setConnected(false);
    };
  }, [url, enabled, disconnect]);

  return { connected, messages, disconnect };
}
