export const formatRupiah = (amount: number): string => {
  // Convert to integer to remove decimals
  const intAmount = Math.round(amount);
  
  // Format with thousand separators using dots
  const formatted = intAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `Rp ${formatted}`;
};

export const parseRupiah = (rupiahString: string): number => {
  // Remove "Rp " and dots, then convert to number
  return parseInt(rupiahString.replace(/Rp\s?|\.|\,/g, '')) || 0;
};