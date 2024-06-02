const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 9876;

// Configuration
const WINDOW_SIZE = 10;
const NUMBER_TYPES = ['p', 'f', 'e', 'r'];
const THIRD_PARTY_URL = "http://localhost:9076/numbers/{type}";
const TIMEOUT = 500; // 500 milliseconds
const RETRY_ATTEMPTS = 3;

// Storage for numbers
let numbersStore = [];

const fetchNumber = async (numberType, attempts = 0) => {
    try {
        console.log(`Fetching number (${attempts + 1} attempt): ${THIRD_PARTY_URL.replace('{type}', numberType)}`);
        const response = await axios.get(THIRD_PARTY_URL.replace('{type}', numberType), { timeout: TIMEOUT });
        if (response.status === 200) {
            console.log(`Number fetched successfully: ${response.data.number}`);
            return response.data.number;
        }
    } catch (error) {
        console.error(`Error fetching number (${attempts + 1} attempt): ${error.message}`);
        if (attempts < RETRY_ATTEMPTS) {
            return fetchNumber(numberType, attempts + 1);
        }
        console.error(`Failed to fetch number after ${attempts + 1} attempts`);
    }
    return null;
};


app.get('/numbers/:numberid', async (req, res) => {
    const numberId = req.params.numberid;

    if (!NUMBER_TYPES.includes(numberId)) {
        return res.status(400).json({ error: "Invalid number ID" });
    }

    // Get current stored numbers
    const numbersBefore = [...numbersStore];

    // Fetch the new number
    const newNumber = await fetchNumber(numberId);
    if (newNumber !== null && !numbersStore.includes(newNumber)) {
        if (numbersStore.length >= WINDOW_SIZE) {
            numbersStore.shift();
        }
        numbersStore.push(newNumber);
    }

    // Get updated stored numbers
    const numbersAfter = [...numbersStore];

    // Calculate the average of stored numbers
    const average = numbersStore.length > 0
        ? numbersStore.reduce((acc, num) => acc + num, 0) / numbersStore.length
        : 0;

    res.json({
        windowPrevState: numbersBefore,
        windowCurrState: numbersAfter,
        numbers: newNumber !== null ? [newNumber] : [],
        avg: parseFloat(average.toFixed(2))
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
