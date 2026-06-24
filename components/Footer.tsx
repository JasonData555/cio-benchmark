interface FooterProps {
  source: string;
  region: string;
  year: number;
  n: number;
  footnote?: string;
}

export default function Footer({ source, region, year, n, footnote }: FooterProps) {
  return (
    <footer className="footer">
      <span>Source: {source} · n={n} CIO roles · {region} · {year} · Confidential</span>
      {footnote && <span className="footer-footnote">{footnote}</span>}
    </footer>
  );
}
