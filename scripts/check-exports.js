try {
  const adapter = require('@solana/wallet-adapter-react');
  console.log('Exports:', Object.keys(adapter));
} catch (e) {
  console.error('Error:', e.message);
}
