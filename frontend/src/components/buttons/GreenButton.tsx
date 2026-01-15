import React from 'react';

interface GreenButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function GreenButton({ 
  children, 
  onClick, 
  className = '',
  type = 'button'
}: GreenButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
