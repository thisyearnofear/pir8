import { useCallback } from 'react';
import { useGameState } from './useGameState';

interface ErrorContext {
  action: string;
  component?: string;
  metadata?: Record<string, any>;
}

export const useErrorHandler = () => {
  const { setError } = useGameState();

  const handleError = useCallback((error: unknown, context?: ErrorContext) => {
    console.error('PIR8 Error:', error, context);

    let userMessage = 'Something went wrong, please try again.';
    let actionHint = '';

    if (error instanceof Error) {
      // Parse common Solana/Anchor errors for user-friendly messages
      if (error.message.includes('User rejected the request')) {
        userMessage = '🏴‍☠️ Transaction cancelled by captain\'s orders';
        actionHint = 'Click "Approve" in your wallet to continue';
      } else if (error.message.includes('insufficient funds') || error.message.includes('Insufficient funds')) {
        userMessage = '💰 Not enough SOL in your treasure chest';
        actionHint = 'Add more SOL to your wallet or try a smaller bet';
      } else if (error.message.includes('Network error') || error.message.includes('fetch')) {
        userMessage = '🌊 Rough seas ahead - connection issues';
        actionHint = 'Check your internet and try again';
      } else if (error.message.includes('Transaction failed')) {
        userMessage = '⚡ Transaction failed on the blockchain';
        actionHint = 'Try again with higher gas or check wallet';
      } else if (error.message.includes('Game is not active')) {
        userMessage = '🎮 This battle has ended or not yet begun';
        actionHint = 'Join a new game or wait for this one to start';
      } else if (error.message.includes('Not your turn')) {
        userMessage = '⏳ Hold your horses, pirate! Wait for your turn';
        actionHint = 'Watch for the turn indicator to change';
      } else if (error.message.includes('Coordinate already chosen')) {
        userMessage = '🎯 That treasure spot has already been claimed';
        actionHint = 'Choose a different coordinate';
      } else if (error.message.includes('Invalid coordinate')) {
        userMessage = '🗺️ That\'s not a valid map coordinate';
        actionHint = 'Use coordinates like A1, B3, or G7';
      } else if (error.message.includes('Wallet not connected')) {
        userMessage = '🔗 Your wallet seems to have sailed away';
        actionHint = 'Please connect your wallet first';
      } else if (error.message.includes('Program not found')) {
        userMessage = '🏴‍☠️ PIR8 program not found on this network';
        actionHint = 'Make sure you\'re on Devnet or contact support';
      } else {
        // Generic error with some pirate flavor
        userMessage = `🏴‍☠️ ${error.message}`;
        actionHint = context?.action ? `While trying to: ${context.action}` : '';
      }
    }

    // Set the error with enhanced context
    const enhancedMessage = actionHint ? `${userMessage}\n💡 ${actionHint}` : userMessage;
    setError(enhancedMessage);

    // Auto-clear after 8 seconds for most errors
    const errorString = String(error);
    if (!errorString.includes('User rejected') && !errorString.includes('insufficient funds')) {
      setTimeout(() => setError(null), 8000);
    }
  }, [setError]);

  const handleTransactionError = useCallback((error: unknown, transactionType: string) => {
    handleError(error, { 
      action: transactionType,
      component: 'Transaction',
      metadata: { type: transactionType }
    });
  }, [handleError]);

  const handleGameError = useCallback((error: unknown, gameAction: string) => {
    handleError(error, { 
      action: gameAction,
      component: 'Game',
      metadata: { gameAction }
    });
  }, [handleError]);

  const handleWalletError = useCallback((error: unknown) => {
    handleError(error, { 
      action: 'wallet operation',
      component: 'Wallet'
    });
  }, [handleError]);

  return {
    handleError,
    handleTransactionError,
    handleGameError,
    handleWalletError,
  };
};