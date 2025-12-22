'use client';

import { Check, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
}

export default function Toast({ message, type }: ToastProps) {
  return (
    <div className={`toast ${type === 'success' ? 'toast-success' : 'toast-error'}`}>
      {type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
      <span>{message}</span>
    </div>
  );
}

