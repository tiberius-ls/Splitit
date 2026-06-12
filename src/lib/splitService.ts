'use client';

export interface SplitParticipant {
  name: string;
  address?: string;
  share?: number;
}

export interface Split {
  id: string;
  title: string;
  totalAmount: number;
  currency: 'NIM' | 'USDT';
  participants: SplitParticipant[];
  initiator: string;
  createdAt: string;
  status: 'pending' | 'settled' | 'partial';
}

/**
 * Calculate individual shares for split expenses
 */
export const calculateShares = (
  totalAmount: number,
  participants: SplitParticipant[]
): Map<string, number> => {
  const shareMap = new Map<string, number>();
  
  if (participants.length === 0) return shareMap;

  const sharePerPerson = totalAmount / participants.length;

  participants.forEach((p) => {
    if (p.name) {
      shareMap.set(p.name, parseFloat(sharePerPerson.toFixed(2)));
    }
  });

  return shareMap;
};

/**
 * Create payment requests for each participant
 */
export const createSplitPaymentRequests = (
  split: Split,
  myAddress: string
): Array<{
  participant: SplitParticipant;
  amount: number;
  message: string;
}> => {
  const shares = calculateShares(split.totalAmount, split.participants);
  const requests: Array<{
    participant: SplitParticipant;
    amount: number;
    message: string;
  }> = [];

  split.participants.forEach((participant) => {
    if (participant.name !== 'You') {
      const amount = shares.get(participant.name) || 0;
      const message = `Split payment for: ${split.title} (${amount} ${split.currency})`;
      
      requests.push({
        participant,
        amount,
        message,
      });
    }
  });

  return requests;
};

/**
 * Calculate who owes whom in a split
 */
export const calculateBalances = (split: Split): Map<string, number> => {
  const balances = new Map<string, number>();
  const shares = calculateShares(split.totalAmount, split.participants);

  split.participants.forEach((p) => {
    balances.set(p.name, shares.get(p.name) || 0);
  });

  return balances;
};

/**
 * Generate unique split ID
 */
export const generateSplitId = (): string => {
  return 'split_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Create a new split
 */
export const createSplit = (
  title: string,
  totalAmount: number,
  currency: 'NIM' | 'USDT',
  participants: SplitParticipant[],
  initiator: string
): Split => {
  return {
    id: generateSplitId(),
    title,
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    currency,
    participants,
    initiator,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
};

/**
 * Format split summary for sharing
 */
export const formatSplitSummary = (split: Split): string => {
  const shares = calculateShares(split.totalAmount, split.participants);
  const summary = Array.from(shares.entries())
    .map(([name, amount]) => `${name}: ${amount} ${split.currency}`)
    .join('\n');

  return `Split: ${split.title}\nTotal: ${split.totalAmount} ${split.currency}\n\n${summary}`;
};
