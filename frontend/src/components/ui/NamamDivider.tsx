interface Props { center?: boolean; light?: boolean }

export default function NamamDivider({ center = false, light = false }: Props) {
  const c = light ? 'rgba(201,148,58,0.5)' : 'var(--gold-500)';
  const wrapStyle: React.CSSProperties = {
    display:'flex', alignItems:'center', gap:'.7rem', margin:'1.5rem 0',
    justifyContent: center ? 'center' : 'flex-start',
    maxWidth: center ? '340px' : undefined,
    marginLeft: center ? 'auto' : undefined,
    marginRight: center ? 'auto' : undefined,
    marginBottom: center ? '2.5rem' : undefined,
  };
  return (
    <div style={wrapStyle}>
      <div style={{ flex:1, height:'1px', background:`linear-gradient(90deg,transparent,${c})` }} />
      <svg width="36" height="50" viewBox="0 0 36 50" fill="none" style={{ flexShrink:0 }}>
        <path d="M18 2C12 2 5 11 5 24C5 35 11 46 18 48C25 46 31 35 31 24C31 11 24 2 18 2Z"
          fill="none" stroke={c} strokeWidth="1" opacity="0.5"/>
        <path d="M13 6C8 13 6 21 7 31L11 44" fill="white" opacity="0.85"/>
        <path d="M23 6C28 13 30 21 29 31L25 44" fill="white" opacity="0.85"/>
        <path d="M16 9L16 45Q18 48 20 45L20 9Q18 5 16 9Z" fill="#8B1A1A" opacity="0.8"/>
        <rect x="8" y="45" width="20" height="3" rx="0.5" fill={c} opacity="0.65"/>
      </svg>
      <div style={{ flex:1, height:'1px', background:`linear-gradient(90deg,${c},transparent)` }} />
    </div>
  );
}