import React from 'react';

interface WhiteButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export default function WhiteButton({
  children, 
  onClick, 
  className = '',
  type = 'button',
  disabled = false
}: WhiteButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-2 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-semibold rounded-lg transition-colors disabled:bg-gray-100 disabled:hover:bg-gray-100 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
