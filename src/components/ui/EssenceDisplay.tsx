import React from 'react';
import { SpideyCoinDisplay } from './SpideyCoinDisplay';

interface EssenceDisplayProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export const EssenceDisplay: React.FC<EssenceDisplayProps> = ({
  amount,
  size = 'md',
  showLabel = true,
  className = '',
  interactive = false,
  onClick,
}) => {
  return (
    <SpideyCoinDisplay
      amount={amount}
      size={size}
      showLabel={showLabel}
      className={className}
      interactive={interactive}
      onClick={onClick}
    />
  );
};

