import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CreditContext = createContext(null);

export const useCredits = () => {
  const context = useContext(CreditContext);
  if (!context) {
    throw new Error('useCredits must be used within CreditProvider');
  }
  return context;
};

export const CreditProvider = ({ children }) => {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  const [pendingCost, setPendingCost] = useState(0);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [isLowCredits, setIsLowCredits] = useState(false);

  // Initialize credits from user
  useEffect(() => {
    if (user) {
      setCredits(user.credits || 0);
      setTransactionHistory([]);
    }
  }, [user]);

  // Check for low credits warning
  useEffect(() => {
    const threshold = user?.role === 'user' ? 100 : 50;
    setIsLowCredits(credits < threshold);
  }, [credits, user?.role]);

  // Preview cost before executing (shows potential deduction)
  const previewCost = useCallback((cost) => {
    setPendingCost(cost);
  }, []);

  // Clear pending cost preview
  const clearPreview = useCallback(() => {
    setPendingCost(0);
  }, []);

  // Consume credits for a tool/action
  const consumeCredits = useCallback((amount, toolName, toolId) => {
    if (credits < amount) {
      return {
        success: false,
        error: 'Insufficient credits',
        remaining: credits
      };
    }

    const newBalance = credits - amount;
    setCredits(newBalance);
    setPendingCost(0);

    const transaction = {
      id: `tx-${Date.now()}`,
      type: 'debit',
      amount,
      toolName,
      toolId,
      timestamp: new Date().toISOString(),
      balanceAfter: newBalance
    };

    setTransactionHistory(prev => [transaction, ...prev].slice(0, 50));

    return {
      success: true,
      consumed: amount,
      remaining: newBalance
    };
  }, [credits]);

  // Add credits (for rewards, bonuses)
  const addCredits = useCallback((amount, reason) => {
    const newBalance = credits + amount;
    setCredits(newBalance);

    const transaction = {
      id: `tx-${Date.now()}`,
      type: 'credit',
      amount,
      reason,
      timestamp: new Date().toISOString(),
      balanceAfter: newBalance
    };

    setTransactionHistory(prev => [transaction, ...prev].slice(0, 50));

    return {
      success: true,
      added: amount,
      newBalance
    };
  }, [credits]);

  // Check if can afford
  const canAfford = useCallback((amount) => {
    return credits >= amount;
  }, [credits]);

  // Reset credits
  const resetCredits = useCallback(() => {
    if (user) {
      setCredits(user.credits || 0);
      setTransactionHistory([]);
      setPendingCost(0);
    }
  }, [user]);

  // Get credit display info
  const getCreditDisplay = useCallback(() => {
    const maxCredits = user?.role === 'user' ? 1000 : 500;
    const percentage = (credits / maxCredits) * 100;
    
    let status = 'healthy';
    let color = 'emerald';
    
    if (percentage < 20) {
      status = 'critical';
      color = 'red';
    } else if (percentage < 40) {
      status = 'warning';
      color = 'amber';
    }

    return {
      current: credits,
      max: maxCredits,
      percentage: Math.min(percentage, 100),
      status,
      color,
      pending: pendingCost,
      afterPending: credits - pendingCost
    };
  }, [credits, pendingCost, user?.role]);

  const value = {
    credits,
    pendingCost,
    transactionHistory,
    isLowCredits,
    previewCost,
    clearPreview,
    consumeCredits,
    addCredits,
    canAfford,
    resetCredits,
    getCreditDisplay
  };

  return (
    <CreditContext.Provider value={value}>
      {children}
    </CreditContext.Provider>
  );
};

export default CreditContext;
