export const formatCurrency = (value) => {
  if (typeof value !== 'number') {
    return '';
  }
  
  return new Intl.NumberFormat('co-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}