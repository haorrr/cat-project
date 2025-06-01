import React from 'react';
import { Button } from '@/components/ui/button';

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  actionLabel 
}) => {
  return (
    <div className="text-center py-12">
      {Icon && <Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6">{description}</p>
      {action && actionLabel && (
        <Button onClick={action} className="bg-orange-500 hover:bg-orange-600">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};