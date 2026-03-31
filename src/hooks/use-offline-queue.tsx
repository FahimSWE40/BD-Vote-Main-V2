import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface QueuedTransaction {
  id: string;
  type: 'vote' | 'verification';
  data: unknown;
  timestamp: number;
  retryCount: number;
}

const QUEUE_KEY = 'univote_offline_queue';
const MAX_RETRIES = 3;

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState<QueuedTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem(QUEUE_KEY);
    if (savedQueue) {
      try {
        setQueue(JSON.parse(savedQueue));
      } catch (e) {
        console.error('Failed to parse offline queue:', e);
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }, [queue]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('ইন্টারনেট সংযোগ পুনরায় স্থাপিত হয়েছে!', {
        description: 'পেন্ডিং ট্রানজ্যাকশন প্রসেস হচ্ছে...',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('ইন্টারনেট সংযোগ বিচ্ছিন্ন হয়েছে', {
        description: 'আপনার ট্রানজ্যাকশন সংরক্ষিত হবে এবং সংযোগ ফিরলে স্বয়ংক্রিয়ভাবে জমা হবে।',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process queue when back online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isProcessing) {
      processQueue();
    }
  }, [isOnline, queue.length]);

  const addToQueue = useCallback((type: QueuedTransaction['type'], data: unknown) => {
    const transaction: QueuedTransaction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    setQueue(prev => [...prev, transaction]);

    if (!isOnline) {
      toast.info('অফলাইন মোড', {
        description: 'আপনার ট্রানজ্যাকশন কিউতে যোগ করা হয়েছে।',
      });
    }

    return transaction.id;
  }, [isOnline]);

  const processQueue = useCallback(async () => {
    if (queue.length === 0 || isProcessing) return;

    setIsProcessing(true);

    const processTransaction = async (transaction: QueuedTransaction): Promise<boolean> => {
      try {
        // Simulate API call - replace with actual blockchain transaction
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            if (Math.random() > 0.1) { // 90% success rate for demo
              resolve(true);
            } else {
              reject(new Error('Transaction failed'));
            }
          }, 1000);
        });
        return true;
      } catch (error) {
        console.error('Transaction failed:', error);
        return false;
      }
    };

    const updatedQueue: QueuedTransaction[] = [];

    for (const transaction of queue) {
      const success = await processTransaction(transaction);

      if (success) {
        toast.success('ট্রানজ্যাকশন সফল!', {
          description: `${transaction.type === 'vote' ? 'ভোট' : 'যাচাইকরণ'} সফলভাবে জমা হয়েছে।`,
        });
      } else {
        if (transaction.retryCount < MAX_RETRIES) {
          updatedQueue.push({
            ...transaction,
            retryCount: transaction.retryCount + 1,
          });
        } else {
          toast.error('ট্রানজ্যাকশন ব্যর্থ', {
            description: 'সর্বোচ্চ চেষ্টার পর ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
          });
        }
      }
    }

    setQueue(updatedQueue);
    setIsProcessing(false);
  }, [queue, isProcessing]);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  return {
    isOnline,
    queue,
    queueLength: queue.length,
    isProcessing,
    addToQueue,
    removeFromQueue,
    clearQueue,
    processQueue,
  };
}
