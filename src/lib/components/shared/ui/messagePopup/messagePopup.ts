import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'info';
  position: string;
}

interface MessagePopupState {
  messages: ToastMessage[];
  show: (message: string, type?: ToastMessage['type'], duration?: number, position?: string, title?: string) => void;
  dismiss: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

export const messagePopup = create<MessagePopupState>((set, get) => {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  return {
    messages: [],

    show: (message, type = 'info', duration = 3000, position = 'top-right', title) => {
      const id = Math.random().toString(36).slice(2);
      set((s) => ({ messages: [...s.messages, { id, title, message, type, position }] }));
      if (duration > 0) {
        timers.set(id, setTimeout(() => {
          timers.delete(id);
          get().dismiss(id);
        }, duration));
      }
    },

    dismiss: (id) => {
      const timer = timers.get(id);
      if (timer) {
        clearTimeout(timer);
        timers.delete(id);
      }
      set((s) => ({ messages: s.messages.filter((m) => m.id !== id) }));
    },

    success: (msg, duration) => get().show(msg, 'success', duration),
    error: (msg, duration) => get().show(msg, 'error', duration),
    info: (msg, duration) => get().show(msg, 'info', duration),
  };
});
