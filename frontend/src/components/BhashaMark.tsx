interface BhashaMarkProps {
  className?: string;
}

export function BhashaMark({ className }: BhashaMarkProps) {
  return (
    <img
      src="/logo1.jpeg"
      alt="Bhasha — ISL Translator"
      className={className}
    />
  );
}