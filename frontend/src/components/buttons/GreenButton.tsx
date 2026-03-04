import React from 'react';

interface GreenButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export default function GreenButton({ 
  children, 
  onClick, 
  className = '',
  type = 'button',
  disabled = false
}: GreenButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-300 disabled:hover:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
