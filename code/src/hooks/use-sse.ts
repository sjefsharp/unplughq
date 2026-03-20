"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface SSEMessage {
  event: string;
  data: string;
}

interface UseSSEOptions {
  url: string;
  enabled?: boolean;
  events?: string[];
  maxRetries?: number;
  onMessage?: (message: SSEMessage) => void;
  onError?: (error: Event) => void;
}

const DEFAULT_EVENTS = [
  "connected",
  "server.status",
  "deployment.progress",
  "metrics.update",
  "alert.created",
  "alert.dismissed",
  "heartbeat",
];

export function useSSE({
  url,
  enabled = true,
  events = DEFAULT_EVENTS,
  maxRetries = 3,
  onMessage,
  onError,
}: UseSSEOptions) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [exhausted, setExhausted] = useState(false);
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  onMessageRef.current = onMessage;
  onErrorRef.current = onError;

  const emitMessage = useCallback((message: SSEMessage) => {
    setMessages((prev) => [...prev.slice(-49), message]);
    setLastEventAt(Date.now());
    onMessageRef.current?.(message);
  }, []);

  const disconnect = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
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

    let cancelled = false;

    const connect = (attempt: number) => {
      const source = new EventSource(url);
      sourceRef.current = source;

      source.onopen = () => {
        if (cancelled) return;
        setConnected(true);
        setRetryCount(0);
        setExhausted(false);
      };

      source.onmessage = (event) => {
        emitMessage({ event: "message", data: event.data });
      };

      for (const eventName of events) {
        source.addEventListener(eventName, (event) => {
          const messageEvent = event as MessageEvent<string>;
          emitMessage({ event: eventName, data: messageEvent.data });
        });
      }

      source.onerror = (event) => {
        if (cancelled) return;

        onErrorRef.current?.(event);
        setConnected(false);
        source.close();

        if (attempt >= maxRetries) {
          setExhausted(true);
          return;
        }

        const nextAttempt = attempt + 1;
        const delay = Math.min(1000 * 2 ** attempt, 8000);
        setRetryCount(nextAttempt);
        retryTimeoutRef.current = setTimeout(() => connect(nextAttempt), delay);
      };
    };

    connect(0);

    return () => {
      cancelled = true;
      disconnect();
    };
  }, [disconnect, emitMessage, enabled, events, maxRetries, url]);

  return { connected, messages, disconnect, retryCount, exhausted, lastEventAt };
}
