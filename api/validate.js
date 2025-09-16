const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.post('/', (req, res) => {
    const { routingNumber, accountNumber } = req.body;

    // Read banks.csv
    const banksFilePath = path.join(__dirname, '../data/banks.csv');
    const banksData = fs.readFileSync(banksFilePath, 'utf-8');
    const banks = banksData.split('\n').map(line => {
        const [routing, name, address] = line.split(',');
        return { routing, name, address };
    });

    // Check if routing number exists
    const bank = banks.find(b => b.routing === routingNumber);
    const routingValid = !!bank;

    // For simplicity, assume account number is valid if it passes Luhn check (handled frontend)
    if (routingValid) {
        res.json({
            valid: true, // Assume account number is valid (frontend checks Luhn)
            routingValid: true,
            bankName: bank.name,
            address: bank.address
        });
    } else {
        res.json({
            valid: false,
            routingValid: false
        });
    }
});

module.exports = router;
