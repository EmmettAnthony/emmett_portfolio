export function chiSquarePValue(
  aSuccess: number,
  aFail: number,
  bSuccess: number,
  bFail: number
): number {
  const total = aSuccess + aFail + bSuccess + bFail;
  const row1 = aSuccess + aFail;
  const row2 = bSuccess + bFail;
  const col1 = aSuccess + bSuccess;
  const col2 = aFail + bFail;

  if (row1 === 0 || row2 === 0 || col1 === 0 || col2 === 0) return 1;

  const expectedAOpen = (row1 * col1) / total;
  const expectedAClick = (row1 * col2) / total;
  const expectedBOpen = (row2 * col1) / total;
  const expectedBClick = (row2 * col2) / total;

  let chi2 = 0;
  chi2 += (aSuccess - expectedAOpen) ** 2 / expectedAOpen;
  chi2 += (aFail - expectedAClick) ** 2 / expectedAClick;
  chi2 += (bSuccess - expectedBOpen) ** 2 / expectedBOpen;
  chi2 += (bFail - expectedBClick) ** 2 / expectedBClick;

  return chiSquareCdf(chi2);
}

function chiSquareCdf(x: number): number {
  if (x <= 0) return 1;
  return 1 - gammainc(0.5, 0.5 * x);
}

function gammainc(a: number, x: number): number {
  if (x < 0 || a <= 0) return 0;
  if (x < a + 1) {
    return seriesGammainc(a, x);
  }
  return 1 - continuedFractionGammainc(a, x);
}

function seriesGammainc(a: number, x: number): number {
  let ap = a;
  let sum = 1 / a;
  let del = sum;
  for (let n = 1; n <= 200; n++) {
    ap += 1;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * 1e-14) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
}

function continuedFractionGammainc(a: number, x: number): number {
  const fpmin = 1e-30;
  const gln = logGamma(a);
  let b = x + 1 - a;
  let c = 1 / fpmin;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= 200; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = b + an / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-14) break;
  }
  return h * Math.exp(-x + a * Math.log(x) - gln);
}

function logGamma(x: number): number {
  const cof = [
    76.18009172947146, -86.50532032941677,
    24.01409824083091, -1.231739572450155,
    0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) {
    y += 1;
    ser += cof[j] / y;
  }
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

export function formatPValue(p: number): string {
  if (p < 0.001) return "<0.001";
  return p.toFixed(3);
}

export function isSignificant(p: number, alpha = 0.05): boolean {
  return p < alpha;
}
