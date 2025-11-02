export const generateBillNumber = (): string => {
  const year = new Date().getFullYear();
  const lastBillKey = `tuleeto_last_bill_${year}`;
  const lastNumber = parseInt(localStorage.getItem(lastBillKey) || '0');
  const newNumber = lastNumber + 1;
  localStorage.setItem(lastBillKey, newNumber.toString());
  return `TB${year}${newNumber.toString().padStart(3, '0')}`;
};

export const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
};
