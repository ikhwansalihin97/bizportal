import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePage } from '@inertiajs/react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { FlashData, SharedData } from '@/types';

export function FlashMessage() {
  const { props } = usePage<SharedData>();
  const [messages, setMessages] = useState<FlashData>({});

  useEffect(() => {
    // Extract flash messages from the flash object in props
    const flash = props.flash || {};
    
    // Filter out undefined/null values
    const filteredFlash = Object.entries(flash).reduce((acc, [key, value]) => {
      if (value) acc[key as keyof FlashData] = value;
      return acc;
    }, {} as FlashData);

    setMessages(filteredFlash);
  }, [props.flash]);

  const dismissMessage = (type: keyof FlashData) => {
    setMessages(prev => {
      const newMessages = { ...prev };
      delete newMessages[type];
      return newMessages;
    });
  };

  const getIcon = (type: keyof FlashData) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertClass = (type: keyof FlashData) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/50 dark:text-green-100';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/50 dark:text-red-100';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-100';
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-900/50 dark:text-blue-100';
    }
  };

  if (Object.keys(messages).length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {Object.entries(messages).map(([type, message]) => (
        <Alert
          key={type}
          className={cn(
            'relative',
            getAlertClass(type as keyof FlashData)
          )}
        >
          {getIcon(type as keyof FlashData)}
          <AlertDescription className="flex-1 pr-8">
            {message}
          </AlertDescription>
          <button
            onClick={() => dismissMessage(type as keyof FlashData)}
            className="absolute right-2 top-2 rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Dismiss</span>
          </button>
        </Alert>
      ))}
    </div>
  );
}
