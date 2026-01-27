import React from 'react';

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Title({ children, className = '' }: Props) {
  return (
    <h1 className={`text-2xl font-semibold text-foreground ${className}`}>{children}</h1>
  );
}

export function Heading({ children, className = '' }: Props) {
  return (
    <h2 className={`text-lg font-semibold text-foreground ${className}`}>{children}</h2>
  );
}

export function Subheading({ children, className = '' }: Props) {
  return (
    <h3 className={`text-base font-medium text-foreground ${className}`}>{children}</h3>
  );
}

export function Body({ children, className = '' }: Props) {
  return (
    <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>
  );
}

export default {
  Title,
  Heading,
  Subheading,
  Body,
};
