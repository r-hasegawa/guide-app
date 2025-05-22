import React from 'react';
import { cn } from '@/lib/utils'; // 無ければ `cn` の代わりに className を直書きしてもOK

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

export const Button = ({ className, variant = 'primary', ...props }: ButtonProps) => {
  const baseStyle = 'w-full py-2 px-4 rounded-md font-medium text-white';
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600',
    secondary: 'bg-gray-500 hover:bg-gray-600',
  };

  return (
    <button
      {...props}
      className={cn(baseStyle, variants[variant], className)}
    />
  );
};
