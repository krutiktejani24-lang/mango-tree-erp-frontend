const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n) {
  if (n < 20) return ones[n];
  return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
}
function threeDigits(n) {
  if (n < 100) return twoDigits(n);
  return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoDigits(n % 100) : '');
}
function numberToWordsIndian(num) {
  num = Math.round(num);
  if (num === 0) return 'Zero';
  let result = '';
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const hundred = num;
  if (crore) result += threeDigits(crore) + ' Crore ';
  if (lakh) result += threeDigits(lakh) + ' Lakh ';
  if (thousand) result += threeDigits(thousand) + ' Thousand ';
  if (hundred) result += threeDigits(hundred);
  return result.trim();
}

export function amountInWords(amount) {
  const rupees = Math.floor(amount);
  return `Rupees ${numberToWordsIndian(rupees)} Only`;
}
