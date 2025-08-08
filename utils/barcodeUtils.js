// All barcode-related pure functions are grouped here.

// Function to calculate EAN-13 check digit
export const calculateEAN13CheckDigit = (barcode) => {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        const digit = parseInt(barcode[i], 10);
        sum += i % 2 === 0 ? digit : digit * 3;
    }
    return ((10 - (sum % 10)) % 10).toString();
};

// Function to validate barcode format
export const validateBarcode = (code) => {
    if (!code) return true; // Empty is valid
    if (!/^\d{12,13}$/.test(code)) {
        return false;
    }
    if (code.length === 13) {
        const calculatedCheckDigit = calculateEAN13CheckDigit(code.slice(0, 12));
        return calculatedCheckDigit === code[12];
    }
    return true;
};

// Generate a random EAN-13 barcode
export const generateRandomBarcode = () => {
    const countryCode = '890'; // Example country code
    const companyCode = '1234'; // Example company code
    const productCode = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    const partialBarcode = countryCode + companyCode + productCode;
    const checkDigit = calculateEAN13CheckDigit(partialBarcode);
    return partialBarcode + checkDigit;
};

// Generate a barcode from a string (product name)
export const generateBarcodeFromName = (name) => {
    if (!name || !name.trim()) return null;

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        const char = name.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }

    const positiveHash = Math.abs(hash);
    const productCode = (positiveHash % 100000).toString().padStart(5, '0');

    const countryCode = '890';
    const companyCode = '1234';
    const partialBarcode = countryCode + companyCode + productCode;
    const checkDigit = calculateEAN13CheckDigit(partialBarcode);
    return partialBarcode + checkDigit;
};