"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Send, Loader2 } from "lucide-react";
import { FormEvent, KeyboardEvent } from "react";

interface ChatInputProps {
  input: string;
  loading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  input,
  loading,
  onInputChange,
  onSubmit,
  disabled = false,
  placeholder = "Ask a question about your database...",
}: Readonly<ChatInputProps>) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && input.trim()) {
        onSubmit(e as unknown as FormEvent);
      }
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <form onSubmit={onSubmit} className="mx-auto max-w-3xl w-full">
        <InputGroup className="rounded-2xl shadow-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50">
          <InputGroupTextarea
            placeholder={placeholder}
            value={input}
            disabled={loading || disabled}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="resize-none min-h-[48px] max-h-[200px] overflow-y-auto border-0 focus-visible:ring-0"
          />
          <InputGroupAddon align="inline-end" className="gap-2">
            <Separator orientation="vertical" className="!h-4" />
            <InputGroupButton
              variant="default"
              size="icon-xs"
              type="submit"
              disabled={loading || !input.trim() || disabled}
              className="rounded-full cursor-pointer hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send</span>
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        <p className="mt-2 text-xs text-center text-muted-foreground">
          Press <kbd className="px-1 py-0.5 border rounded">Enter</kbd> to send
          • <kbd className="px-1 py-0.5 border rounded">Shift + Enter</kbd> for
          newline
        </p>
      </form>
    </div>
  );
}
