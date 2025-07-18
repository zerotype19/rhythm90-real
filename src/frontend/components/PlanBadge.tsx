import React from 'react';

interface PlanBadgeProps {
  plan: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'header' | 'dropdown';
}

const PlanBadge: React.FC<PlanBadgeProps> = ({ plan, size = 'medium', variant = 'header' }) => {
  const getPlanDisplay = () => {
    switch (plan) {
      case 'free':
        return { text: 'FREE', color: 'bg-gray-100 text-gray-600' };
      case 'pro_limited':
        return { text: 'PRO', color: 'bg-blue-100 text-blue-700' };
      case 'pro_unlimited':
        return { text: 'PRO UNLIMITED', color: 'bg-green-100 text-green-700' };
      default:
        return { text: 'FREE', color: 'bg-gray-100 text-gray-600' };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-xs px-2 py-1';
      case 'medium':
        return 'text-sm px-2 py-1';
      case 'large':
        return 'text-base px-3 py-1';
      default:
        return 'text-sm px-2 py-1';
    }
  };

  const planInfo = getPlanDisplay();
  const sizeClasses = getSizeClasses();

  if (variant === 'header') {
    return (
      <span className={`inline-flex items-center rounded-full font-medium ${planInfo.color} ${sizeClasses}`}>
        {planInfo.text}
      </span>
    );
  }

  // Dropdown variant - show full plan name
  const getFullPlanName = () => {
    switch (plan) {
      case 'free':
        return 'Free Plan';
      case 'pro_limited':
        return 'Pro Limited';
      case 'pro_unlimited':
        return 'Pro Unlimited';
      default:
        return 'Free Plan';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className={`inline-flex items-center rounded-full font-medium ${planInfo.color} ${sizeClasses}`}>
        {planInfo.text}
      </span>
      <span className="text-sm text-gray-600">{getFullPlanName()}</span>
    </div>
  );
};

export default PlanBadge; 