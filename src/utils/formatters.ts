export function formatDpText(val: any, defaultText: string = 'DP Rp 5.000.000'): string {
  if (val === null || val === undefined) return defaultText;
  let str = String(val).trim();
  if (!str) return defaultText;

  // Remove duplicate/redundant leading "DP" or "dp"
  str = str.replace(/^(DP\s*)+/gi, '').trim();

  // If numeric only e.g. "10000000"
  if (/^\d+$/.test(str)) {
    const num = Number(str);
    if (isNaN(num) || num <= 0) return defaultText;
    return `DP Rp ${num.toLocaleString('id-ID')}`;
  }

  // If string already contains "Rp" or "rp"
  if (str.toUpperCase().includes('RP')) {
    str = str.replace(/RP\s*/gi, 'Rp ').trim();
    return `DP ${str.replace(/^DP\s*/gi, '')}`;
  }

  // If formatted number like "10.000.000" or "10,000,000"
  const cleanDigits = str.replace(/[^\d]/g, '');
  if (cleanDigits.length > 0 && !isNaN(Number(cleanDigits))) {
    const num = Number(cleanDigits);
    return `DP Rp ${num.toLocaleString('id-ID')}`;
  }

  return `DP ${str}`;
}
