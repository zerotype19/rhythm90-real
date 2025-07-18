import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'red' | 'white' | 'blue';
  className?: string;
  showText?: boolean;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'red', 
  className = '',
  showText = false,
  text = 'Processing...'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    red: 'border-red-600',
    white: 'border-white',
    blue: 'border-blue-600'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]} mx-auto`}></div>
      {showText && (
        <p className="text-sm text-gray-600 mt-3 text-center">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner; 