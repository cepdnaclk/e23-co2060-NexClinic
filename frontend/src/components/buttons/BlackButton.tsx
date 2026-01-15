import React from 'react';

interface BlackButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function BlackButton({ 
  children, 
  onClick, 
  className = '',
  type = 'button'
}: BlackButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-6 py-2 bg-black hover:bg-gray-900 text-white font-semibold rounded-lg transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
