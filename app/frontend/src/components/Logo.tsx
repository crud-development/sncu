import logoUrl from '../assets/bioecolab-logo.png';

/** Marca BioEcoLab — logo oficial, așezat pe un fundal alb pentru lizibilitate. */
export function Logo({ height = 40 }: { height?: number }) {
  return (
    <span className="brand-logo">
      <img src={logoUrl} alt="BioEcoLab" style={{ height, width: 'auto', display: 'block' }} />
    </span>
  );
}
