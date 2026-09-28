/**
 * Loading placeholders shaped like the real content, used by the route
 * loading.tsx files (shown while the server fetches from the API).
 */
const wrap: React.CSSProperties = { padding:'3.5rem 2rem', background:'var(--ivory-100)' };
const inner: React.CSSProperties = { maxWidth:'1280px', margin:'0 auto' };

export function PageHeroSkeleton() {
  return (
    <div className="page-hero" aria-hidden="true">
      <div className="skeleton dark" style={{ width:'140px', height:'12px', margin:'0 auto .8rem' }} />
      <div className="skeleton dark" style={{ width:'min(420px,80%)', height:'30px', margin:'0 auto .6rem' }} />
      <div className="skeleton dark" style={{ width:'200px', height:'14px', margin:'0 auto' }} />
    </div>
  );
}

export function FilterBarSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display:'flex', gap:'.7rem', flexWrap:'wrap', marginBottom:'2.5rem' }} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => <div key={i} className="skeleton" style={{ width:'96px', height:'32px' }} />)}
    </div>
  );
}

export function CardGridSkeleton({ count = 6, columns = 3, mediaHeight = 150 }: { count?: number; columns?: number; mediaHeight?: number }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${columns},1fr)`, gap:'1.4rem' }} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ background:'var(--ivory-50)', border:'1px solid var(--ivory-300)' }}>
          <div className="skeleton" style={{ height:`${mediaHeight}px`, borderRadius:0 }} />
          <div style={{ padding:'1.1rem 1.3rem 1.4rem', display:'flex', flexDirection:'column', gap:'.55rem' }}>
            <div className="skeleton" style={{ width:'35%', height:'10px' }} />
            <div className="skeleton" style={{ width:'75%', height:'16px' }} />
            <div className="skeleton" style={{ width:'50%', height:'12px' }} />
            <div className="skeleton" style={{ width:'95%', height:'12px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'.6rem' }} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ background:'var(--ivory-50)', border:'1px solid var(--ivory-300)', padding:'1rem 1.4rem', display:'grid', gridTemplateColumns:'3rem 1fr 36px', gap:'1.2rem', alignItems:'center' }}>
          <div className="skeleton" style={{ height:'14px' }} />
          <div style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
            <div className="skeleton" style={{ width:'45%', height:'14px' }} />
            <div className="skeleton" style={{ width:'30%', height:'11px' }} />
          </div>
          <div className="skeleton" style={{ width:'36px', height:'36px', borderRadius:'50%' }} />
        </div>
      ))}
    </div>
  );
}

/** Full-page skeleton: hero + optional filter bar + content. */
export function PageSkeleton({ children, filters }: { children: React.ReactNode; filters?: number }) {
  return (
    <>
      <PageHeroSkeleton />
      <div style={wrap}>
        <div style={inner}>
          {filters ? <FilterBarSkeleton count={filters} /> : null}
          {children}
        </div>
      </div>
    </>
  );
}
