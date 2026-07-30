export const formatIndianPrice = (price: number): string => {
  if (!price && price !== 0) return "₹0";
  
  if (price >= 10000000) {
    const amount = (price / 10000000).toFixed(2).replace(/\.00$/, '');
    return `₹${amount} Crore`;
  }
  if (price >= 100000) {
    const amount = (price / 100000).toFixed(2).replace(/\.00$/, '');
    return `₹${amount} Lakh`;
  }
  if (price >= 1000) {
    const amount = (price / 1000).toFixed(2).replace(/\.00$/, '');
    return `₹${amount} Thousand`;
  }
  
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
};
