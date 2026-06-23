interface FooterProps {
  source: string;
  region: string;
  year: number;
  n: number;
}

export default function Footer({ source, region, year, n }: FooterProps) {
  return (
    <footer className="footer">
      Source: {source} · n={n} CIO roles · {region} · {year} · Confidential
    </footer>
  );
}
