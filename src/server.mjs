import express from 'express';
import { getEconomicCalendar } from '../investing-com-api-master/index.mjs';

const app = express();
const PORT = 3000;

// API Route to get economic calendar data
app.get('/api/calendar', async (req, res) => {
  try {
    const data = await getEconomicCalendar('1', 'P1M', 'P1D', 120); // Adjust the parameters if necessary
    res.json(data); // Send the mapped data to the frontend
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch economic calendar data' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
