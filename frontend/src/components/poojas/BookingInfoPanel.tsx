const card: React.CSSProperties = { background:'var(--ivory-50)', border:'1px solid var(--ivory-300)', borderLeft:'3px solid var(--gold-500)', padding:'1.2rem', marginBottom:'1rem' };
const ttl: React.CSSProperties  = { fontFamily:'var(--ff-heading)', fontSize:'.72rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--maroon-800)', display:'block', marginBottom:'.5rem' };
const bdy: React.CSSProperties  = { fontSize:'.9rem', color:'var(--text-mid)', lineHeight:1.65 };

export default function BookingInfoPanel() {
  return (
    <aside>
      <div style={card}><span style={ttl}>📍 Temple Location</span><p style={bdy}>Shree Laxminarayan Mandir<br />Hetauda, Makwanpur District<br />Bagmati Province, Nepal</p></div>
      <div style={card}><span style={ttl}>⏰ Pooja Timings</span><p style={bdy}>Morning: 5:00 AM – 12:00 PM<br />Evening: 4:00 PM – 8:00 PM<br /><br />Advance booking recommended.</p></div>
      <div style={card}><span style={ttl}>📞 Contact</span><p style={bdy}>Phone: +977-XXXXXXXXX<br />Email: info@laxminarayanmandir.org</p></div>
      <div style={card}><span style={ttl}>🌸 What to Bring</span><p style={bdy}>Flowers (lotus or marigold preferred), fruits for naivedyam, clean traditional attire. Footwear not allowed inside.</p></div>
      <div style={{ ...card, background:'var(--maroon-900)' }}>
        <span style={{ ...ttl, color:'var(--gold-500)' }}>💳 Payment</span>
        <p style={{ ...bdy, color:'rgba(232,201,122,.55)' }}>Payment is made at the temple on the day. No advance payment required.</p>
      </div>
    </aside>
  );
}