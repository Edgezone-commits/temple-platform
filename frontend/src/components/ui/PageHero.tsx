interface Props { eyebrow: string; title: string; titleNe?: string }

export default function PageHero({ eyebrow, title, titleNe }: Props) {
  return (
    <div className="page-hero">
      <span className="section-eyebrow">{eyebrow}</span>
      <h1 className="section-title light">{title}</h1>
      {titleNe && <span className="section-title-ne light">{titleNe}</span>}
    </div>
  );
}