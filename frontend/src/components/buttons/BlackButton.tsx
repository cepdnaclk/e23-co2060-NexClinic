import React from 'react';

interface BlackButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export default function BlackButton({ 
  children, 
  onClick, 
  className = '',
  type = 'button',
  disabled = false
}: BlackButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-2 bg-black hover:bg-gray-900 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
