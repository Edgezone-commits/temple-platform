'use client';
/** Submit button that asks for confirmation first (used for delete/hide). */
import { useFormStatus } from 'react-dom';

export default function ConfirmSubmit({ message, className, children }: { message: string; className?: string; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}
      onClick={e => { if (!window.confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}
