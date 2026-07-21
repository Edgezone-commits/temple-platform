import PageHero    from '@/components/ui/PageHero';
import ContactForm from '@/components/contact/ContactForm';

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Get in Touch" title="Contact Us" titleNe="हामीलाई सम्पर्क गर्नुहोस्" />
      <div style={{ padding:'3.5rem 2rem', background:'var(--ivory-100)' }}>
        <div style={{ maxWidth:'1280px', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3rem' }}>
          <ContactForm />
          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {[
              { icon:'📍', t:'Temple Address', b:'Shree Laxminarayan Mandir\nHetauda, Makwanpur District\nBagmati Province, Nepal' },
              { icon:'📞', t:'Phone', b:'+977-XXXXXXXXX\nDuring temple hours' },
              { icon:'✉',  t:'Email', b:'info@laxminarayanmandir.org' },
              { icon:'⏰', t:'Darshan Hours', b:'Morning: 5:00 AM – 12:00 PM\nEvening: 4:00 PM – 8:00 PM\nOpen 365 days' },
            ].map(({ icon, t, b }) => (
              <div key={t} style={{ background:'var(--ivory-50)', border:'1px solid var(--ivory-300)', borderLeft:'3px solid var(--gold-500)', padding:'1.2rem' }}>
                <span style={{ fontFamily:'var(--ff-heading)', fontSize:'.72rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--maroon-800)', display:'block', marginBottom:'.5rem' }}>{icon} {t}</span>
                <p style={{ fontSize:'.9rem', color:'var(--text-mid)', lineHeight:1.65, whiteSpace:'pre-line' }}>{b}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}