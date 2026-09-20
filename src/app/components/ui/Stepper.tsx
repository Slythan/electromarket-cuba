interface StepperProps {
  value: number;
  onInc: () => void;
  onDec: () => void;
  size?: 'md' | 'sm';
}

export default function Stepper({ value, onInc, onDec, size = 'md' }: StepperProps) {
  return (
    <div className={`stepper${size === 'sm' ? ' stepper--sm' : ''}`}>
      <button type="button" onClick={onDec} aria-label="Menos">−</button>
      <span>{value}</span>
      <button type="button" onClick={onInc} aria-label="Más">+</button>
    </div>
  );
}