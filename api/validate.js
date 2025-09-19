const fs = require('fs');
const path = require('path');

let bankData = [];

// Load CSV once
const csvPath = path.join(__dirname, '..', 'data', 'banks.csv');

if (fs.existsSync(csvPath)) {
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split(/\r?\n/); // Handle different line endings
  lines.shift(); // Skip header

  lines.forEach((line) => {
    if (!line.trim()) return; // Skip empty lines

    // Preprocess: replace space before 8-9 digits with comma
    line = line.replace(/([a-zA-Z&+'])\s(\d{8,9})(,|$)/g, '$1,$2$3');

    // Split on commas
    const parts = line.split(',').map(p => p.trim());

    if (parts.length < 5) return; // Invalid row

    // Bank name: first part
    const bankName = parts[0];

    // Routing: second part, pad to 9 digits with leading zero(s)
    let routing = parts[1];
    if (!/^\d{8,9}$/.test(routing)) return; // Invalid routing
    routing = routing.padStart(9, '0');

    // State: last part (must be 2 uppercase letters)
    const state = parts[parts.length - 1];
    if (!/^[A-Z]{2}$/.test(state)) return; // Invalid state

    // City: second last
    const city = parts[parts.length - 2];

    // Address: everything in between, joined with commas if split
    const address = parts.slice(2, -2).join(',');

    bankData.push({ BankName: bankName, RoutingNumber: routing, Address: address, City: city, State: state });
  });

  console.log(`CSV loaded: ${bankData.length} banks.`);
} else {
  console.error('CSV not found at', csvPath);
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ valid: false, message: 'Method not allowed' });
  }

  let { routingNumber, accountNumber } = req.body;

  if (!routingNumber || !accountNumber) {
    return res.status(400).json({ valid: false, message: 'Missing routing or account number.' });
  }

  // Ensure routing is treated as string and padded if needed, but user inputs 8 digits
  routingNumber = routingNumber.trim();
  if (!/^\d{8}$/.test(routingNumber)) {
    return res.status(400).json({ valid: false, message: 'Routing number must be 8 digits.' });
  }

  if (!/^\d{6,17}$/.test(accountNumber)) {
    return res.status(400).json({ valid: false, message: 'Account number must be 6-17 digits.' });
  }

  const foundBank = bankData.find(row => row.RoutingNumber === routingNumber);

  if (foundBank) {
    res.status(200).json({
      valid: true,
      bankName: foundBank.BankName,
      address: `${foundBank.Address}, ${foundBank.City}, ${foundBank.State}`
    });
  } else {
    res.status(200).json({ valid: false, message: 'Invalid routing number.' });
  }
}
