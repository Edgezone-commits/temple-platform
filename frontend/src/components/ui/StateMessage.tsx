/**
 * Friendly placeholder shown instead of a list when there is nothing to show
 * (kind="empty") or the backend couldn't be reached (kind="error").
 * Pass already-translated text; `dark` is for maroon sections.
 */
interface Props {
  kind: 'empty' | 'error';
  message: string;
  hint?: string;
  dark?: boolean;
}

export default function StateMessage({ kind, message, hint, dark = false }: Props) {
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`state-message${dark ? ' dark' : ''}${kind === 'error' ? ' error' : ''}`}>
      <span className="state-icon" aria-hidden="true">{kind === 'error' ? '🪔' : '🙏'}</span>
      <p>{message}</p>
      {hint && <p className="state-hint">{hint}</p>}
    </div>
  );
}
