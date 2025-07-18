import React from 'react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (plan: 'pro_limited' | 'pro_unlimited') => void;
  type: 'trial_ended' | 'usage_limit' | 'near_limit' | 'payment_failed';
  toolName?: string;
  currentUsage?: number;
  usageLimit?: number;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  type,
  toolName,
  currentUsage,
  usageLimit
}) => {
  if (!isOpen) return null;

  const getModalContent = () => {
    switch (type) {
      case 'trial_ended':
        return {
          title: 'Your free trial has ended.',
          message: 'Upgrade to continue using Rhythm90\'s tools and keep building smarter quarters.',
          primaryButton: 'Upgrade to Pro Limited ($6.99/month)',
          secondaryButton: 'Go Unlimited ($11.99/month)',
          primaryPlan: 'pro_limited' as const,
          secondaryPlan: 'pro_unlimited' as const
        };
      
      case 'usage_limit':
        return {
          title: 'You\'ve hit your monthly limit!',
          message: `You've used ${currentUsage} ${toolName} this month. Upgrade to Pro Unlimited for unlimited access.`,
          primaryButton: 'Upgrade to Pro Unlimited ($11.99/month)',
          secondaryButton: null,
          primaryPlan: 'pro_unlimited' as const,
          secondaryPlan: null
        };
      
      case 'near_limit':
        return {
          title: 'Almost there!',
          message: `You've used ${currentUsage} out of ${usageLimit} ${toolName} this month. Keep an eye on your usage or upgrade for unlimited access.`,
          primaryButton: 'Upgrade to Pro Unlimited',
          secondaryButton: null,
          primaryPlan: 'pro_unlimited' as const,
          secondaryPlan: null
        };
      
      case 'payment_failed':
        return {
          title: 'Payment issue detected.',
          message: 'We couldn\'t process your last payment. Please update your payment method to avoid service interruptions.',
          primaryButton: 'Update Payment Details',
          secondaryButton: null,
          primaryPlan: 'pro_limited' as const, // This will open payment portal
          secondaryPlan: null
        };
      
      default:
        return {
          title: 'Upgrade Required',
          message: 'Please upgrade your plan to continue.',
          primaryButton: 'Upgrade Now',
          secondaryButton: null,
          primaryPlan: 'pro_limited' as const,
          secondaryPlan: null
        };
    }
  };

  const content = getModalContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            {content.title}
          </h3>
          <p className="text-gray-600 mb-6">
            {content.message}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => onUpgrade(content.primaryPlan)}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors font-medium"
            >
              {content.primaryButton}
            </button>
            
            {content.secondaryButton && (
              <button
                onClick={() => onUpgrade(content.secondaryPlan!)}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                {content.secondaryButton}
              </button>
            )}
            
            {type !== 'payment_failed' && (
              <button
                onClick={onClose}
                className="w-full text-gray-500 py-2 px-4 hover:text-gray-700 transition-colors"
              >
                Maybe later
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal; 