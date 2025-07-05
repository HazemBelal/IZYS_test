import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import { getCalendarData } from '../../api/calendar';
import type { EconomicEvent } from '../../api/calendar';

const CalendarTab: React.FC = () => {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('today');
  const [userTimezone, setUserTimezone] = useState('');

  // Detect user's timezone
  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(detectedTimezone);
  }, []);

  // Fetch economic calendar data
  const fetchCalendarData = async (timeframe: string) => {
    if (!userTimezone) return;

    setLoading(true);
    setEvents([]); // Clear events before fetching new data
    try {
      const response = await getCalendarData(timeframe, userTimezone);
      setEvents(response.events || []); // Set new events or empty array if no events
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when the component mounts or userTimezone/viewMode changes
  useEffect(() => {
    fetchCalendarData(viewMode);
  }, [userTimezone, viewMode]);

  // Group events by date
  const groupedEvents = events.reduce((acc: Record<string, EconomicEvent[]>, event) => {
    (acc[event.date] = acc[event.date] || []).push(event);
    return acc;
  }, {});

  // Convert time to 12-hour format with AM/PM
  const convertTo12HourFormat = (time: string) => {
    if (!time || time.toLowerCase() === 'all day') return 'All Day';

    const [hourStr, minute] = time.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; // Convert 0 to 12 for 12-hour format
    return `${hour}:${minute} ${ampm}`;
  };

  // Get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  // Get value color based on class
  const getValueColor = (valueClass?: string) => {
    if (valueClass?.includes('better')) return 'success';
    if (valueClass?.includes('worse')) return 'error';
    return 'default';
  };

  const timeframes = [
    'yesterday', 'today', 'tomorrow', 'thisWeek', 'nextWeek', 
    'thisMonth', 'nextMonth', 'lastWeek', 'lastMonth'
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Economic Calendar
      </Typography>
      
      <Paper sx={{ overflow: 'hidden' }}>
        {/* Filter Buttons */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 1, 
          p: 2, 
          bgcolor: 'grey.100',
          borderBottom: 1,
          borderColor: 'grey.300'
        }}>
          {timeframes.map((preset) => (
            <Button
              key={preset}
              variant={viewMode === preset ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode(preset)}
              sx={{ textTransform: 'capitalize' }}
            >
              {preset.replace(/([A-Z])/g, ' $1').trim()}
            </Button>
          ))}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            {Object.keys(groupedEvents).length === 0 ? (
              <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                No events found for this timeframe.
              </Typography>
            ) : (
              Object.keys(groupedEvents).map((date) => (
                <Box key={date} sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                    {date}
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Time</TableCell>
                          <TableCell>Currency</TableCell>
                          <TableCell>Event</TableCell>
                          <TableCell>Impact</TableCell>
                          <TableCell>Actual</TableCell>
                          <TableCell>Forecast</TableCell>
                          <TableCell>Previous</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {groupedEvents[date].map((event, index) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Typography variant="body2">
                                {convertTo12HourFormat(event.time)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {event.currency}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {event.event}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={event.impact} 
                                color={getImpactColor(event.impact)}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                fontWeight="bold"
                                color={getValueColor(event.actualClass)}
                              >
                                {event.actual}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {event.forecast}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                fontWeight="bold"
                                color={getValueColor(event.previousClass)}
                              >
                                {event.previous}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CalendarTab; 