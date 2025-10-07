import { useState, useEffect, useRef, useCallback } from "react";
import { Message } from "@/types/message";

export function useChatSession() {
  const [currentChatId, setCurrentChatId] = useState<string>(
    () => `chat-${Date.now()}`
  );
  const [chatSessions, setChatSessions] = useState<Map<string, Message[]>>(
    new Map()
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sessionMessages = chatSessions.get(currentChatId) || [];
    setMessages(sessionMessages);
  }, [currentChatId, chatSessions]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const saveCurrentSession = useCallback(() => {
    if (messages.length > 0) {
      setChatSessions((prev) => {
        const updated = new Map(prev);
        updated.set(currentChatId, messages);
        return updated;
      });
    }
  }, [currentChatId, messages]);

  const startNewChat = useCallback((initialMessages: Message[] = []) => {
    const newChatId = `chat-${Date.now()}`;
    setChatSessions((prev) => {
      const updated = new Map(prev);
      if (initialMessages.length > 0) {
        updated.set(newChatId, initialMessages);
      }
      return updated;
    });
    setCurrentChatId(newChatId);
    setMessages(initialMessages);
  }, []);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const updateMessages = useCallback(
    (newMessages: Message[]) => {
      setMessages(newMessages);
      setChatSessions((prev) => {
        const updated = new Map(prev);
        updated.set(currentChatId, newMessages);
        return updated;
      });
    },
    [currentChatId]
  );

  return {
    messages,
    messagesEndRef,
    scrollToBottom,
    saveCurrentSession,
    startNewChat,
    addMessage,
    updateMessages,
  };
}
