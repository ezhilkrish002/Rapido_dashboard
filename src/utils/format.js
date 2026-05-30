export const fmt = (v) => `₹${Math.round(v || 0).toLocaleString('en-IN')}`;

export const fmtD = (v) => parseFloat(v || 0).toFixed(2);
