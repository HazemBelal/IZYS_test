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
import { DateTime } from 'luxon';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

// Extend EconomicEvent to include localTime for grouping
interface LocalEconomicEvent extends EconomicEvent {
  localTime: DateTime;
  noTime?: boolean; // Flag to indicate if this event has no time
  displayTime?: string; // To hold special time strings like "Tentative"
}

// ForexFactory timezone list (parsed from timezonelist.txt)
const FOREX_FACTORY_TIMEZONES = [
  { value: "Etc/GMT+12", label: "(GMT-12:00) International Date Line West" },
  { value: "Pacific/Midway", label: "(GMT-11:00) Midway Island" },
  { value: "Pacific/Pago_Pago", label: "(GMT-11:00) American Samoa" },
  { value: "Pacific/Honolulu", label: "(GMT-10:00) Hawaii" },
  { value: "America/Juneau", label: "(GMT-08:00) Alaska" },
  { value: "America/Los_Angeles", label: "(GMT-07:00) Pacific Time (US & Canada)" },
  { value: "America/Tijuana", label: "(GMT-07:00) Tijuana" },
  { value: "America/Phoenix", label: "(GMT-07:00) Arizona" },
  { value: "America/Mazatlan", label: "(GMT-07:00) Mazatlan" },
  { value: "America/Denver", label: "(GMT-06:00) Mountain Time (US & Canada)" },
  { value: "America/Chihuahua", label: "(GMT-06:00) Chihuahua" },
  { value: "America/Regina", label: "(GMT-06:00) Saskatchewan" },
  { value: "America/Mexico_City", label: "(GMT-06:00) Guadalajara, Mexico City" },
  { value: "America/Monterrey", label: "(GMT-06:00) Monterrey" },
  { value: "America/Guatemala", label: "(GMT-06:00) Central America" },
  { value: "America/Chicago", label: "(GMT-05:00) Central Time (US & Canada)" },
  { value: "America/Bogota", label: "(GMT-05:00) Bogota" },
  { value: "America/Lima", label: "(GMT-05:00) Lima, Quito" },
  { value: "America/New_York", label: "(GMT-04:00) Eastern Time (US & Canada)" },
  { value: "America/Indiana/Indianapolis", label: "(GMT-04:00) Indiana (East)" },
  { value: "America/Caracas", label: "(GMT-04:00) Caracas" },
  { value: "America/La_Paz", label: "(GMT-04:00) La Paz" },
  { value: "America/Santiago", label: "(GMT-04:00) Santiago" },
  { value: "America/Guyana", label: "(GMT-04:00) Georgetown" },
  { value: "America/Puerto_Rico", label: "(GMT-04:00) Puerto Rico" },
  { value: "America/Halifax", label: "(GMT-03:00) Atlantic Time (Canada)" },
  { value: "America/Asuncion", label: "(GMT-03:00) Asuncion" },
  { value: "America/Sao_Paulo", label: "(GMT-03:00) Brasilia" },
  { value: "America/Argentina/Buenos_Aires", label: "(GMT-03:00) Buenos Aires" },
  { value: "America/Montevideo", label: "(GMT-03:00) Montevideo" },
  { value: "America/St_Johns", label: "(GMT-02:30) Newfoundland" },
  { value: "Atlantic/South_Georgia", label: "(GMT-02:00) Mid-Atlantic" },
  { value: "America/Godthab", label: "(GMT-01:00) Greenland" },
  { value: "Atlantic/Cape_Verde", label: "(GMT-01:00) Cape Verde Is." },
  { value: "Atlantic/Azores", label: "(GMT+00:00) Azores" },
  { value: "Africa/Monrovia", label: "(GMT+00:00) Monrovia" },
  { value: "Etc/UTC", label: "(GMT+00:00) UTC" },
  { value: "Europe/Dublin", label: "(GMT+01:00) Dublin" },
  { value: "Europe/London", label: "(GMT+01:00) Edinburgh, London" },
  { value: "Europe/Lisbon", label: "(GMT+01:00) Lisbon" },
  { value: "Africa/Casablanca", label: "(GMT+01:00) Casablanca" },
  { value: "Africa/Algiers", label: "(GMT+01:00) West Central Africa" },
  { value: "Europe/Belgrade", label: "(GMT+02:00) Belgrade" },
  { value: "Europe/Bratislava", label: "(GMT+02:00) Bratislava" },
  { value: "Europe/Budapest", label: "(GMT+02:00) Budapest" },
  { value: "Europe/Ljubljana", label: "(GMT+02:00) Ljubljana" },
  { value: "Europe/Prague", label: "(GMT+02:00) Prague" },
  { value: "Europe/Sarajevo", label: "(GMT+02:00) Sarajevo" },
  { value: "Europe/Skopje", label: "(GMT+02:00) Skopje" },
  { value: "Europe/Warsaw", label: "(GMT+02:00) Warsaw" },
  { value: "Europe/Zagreb", label: "(GMT+02:00) Zagreb" },
  { value: "Europe/Brussels", label: "(GMT+02:00) Brussels" },
  { value: "Europe/Copenhagen", label: "(GMT+02:00) Copenhagen" },
  { value: "Europe/Madrid", label: "(GMT+02:00) Madrid" },
  { value: "Europe/Paris", label: "(GMT+02:00) Paris" },
  { value: "Europe/Amsterdam", label: "(GMT+02:00) Amsterdam" },
  { value: "Europe/Berlin", label: "(GMT+02:00) Berlin" },
  { value: "Europe/Zurich", label: "(GMT+02:00) Bern, Zurich" },
  { value: "Europe/Rome", label: "(GMT+02:00) Rome" },
  { value: "Europe/Stockholm", label: "(GMT+02:00) Stockholm" },
  { value: "Europe/Vienna", label: "(GMT+02:00) Vienna" },
  { value: "Africa/Harare", label: "(GMT+02:00) Harare" },
  { value: "Africa/Johannesburg", label: "(GMT+02:00) Pretoria" },
  { value: "Europe/Kaliningrad", label: "(GMT+02:00) Kaliningrad" },
  { value: "Europe/Bucharest", label: "(GMT+03:00) Bucharest" },
  { value: "Africa/Cairo", label: "(GMT+03:00) Cairo" },
  { value: "Europe/Helsinki", label: "(GMT+03:00) Helsinki" },
  { value: "Europe/Kiev", label: "(GMT+03:00) Kyiv" },
  { value: "Europe/Riga", label: "(GMT+03:00) Riga" },
  { value: "Europe/Sofia", label: "(GMT+03:00) Sofia" },
  { value: "Europe/Tallinn", label: "(GMT+03:00) Tallinn" },
  { value: "Europe/Vilnius", label: "(GMT+03:00) Vilnius" },
  { value: "Europe/Athens", label: "(GMT+03:00) Athens" },
  { value: "Europe/Istanbul", label: "(GMT+03:00) Istanbul" },
  { value: "Europe/Minsk", label: "(GMT+03:00) Minsk" },
  { value: "Asia/Jerusalem", label: "(GMT+03:00) Jerusalem" },
  { value: "Europe/Moscow", label: "(GMT+03:00) Moscow, St. Petersburg" },
  { value: "Europe/Volgograd", label: "(GMT+03:00) Volgograd" },
  { value: "Asia/Kuwait", label: "(GMT+03:00) Kuwait" },
  { value: "Asia/Riyadh", label: "(GMT+03:00) Riyadh" },
  { value: "Africa/Nairobi", label: "(GMT+03:00) Nairobi" },
  { value: "Asia/Baghdad", label: "(GMT+03:00) Baghdad" },
  { value: "Asia/Tehran", label: "(GMT+03:30) Tehran" },
  { value: "Europe/Samara", label: "(GMT+04:00) Samara" },
  { value: "Asia/Muscat", label: "(GMT+04:00) Abu Dhabi, Muscat" },
  { value: "Asia/Baku", label: "(GMT+04:00) Baku" },
  { value: "Asia/Tbilisi", label: "(GMT+04:00) Tbilisi" },
  { value: "Asia/Yerevan", label: "(GMT+04:00) Yerevan" },
  { value: "Asia/Kabul", label: "(GMT+04:30) Kabul" },
  { value: "Asia/Yekaterinburg", label: "(GMT+05:00) Ekaterinburg" },
  { value: "Asia/Karachi", label: "(GMT+05:00) Islamabad, Karachi" },
  { value: "Asia/Tashkent", label: "(GMT+05:00) Tashkent" },
  { value: "Asia/Almaty", label: "(GMT+05:00) Almaty, Astana" },
  { value: "Asia/Kolkata", label: "(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi" },
  { value: "Asia/Colombo", label: "(GMT+05:30) Sri Jayawardenepura" },
  { value: "Asia/Kathmandu", label: "(GMT+05:45) Kathmandu" },
  { value: "Asia/Dhaka", label: "(GMT+06:00) Dhaka" },
  { value: "Asia/Urumqi", label: "(GMT+06:00) Urumqi" },
  { value: "Asia/Rangoon", label: "(GMT+06:30) Rangoon" },
  { value: "Asia/Novosibirsk", label: "(GMT+07:00) Novosibirsk" },
  { value: "Asia/Bangkok", label: "(GMT+07:00) Bangkok, Hanoi" },
  { value: "Asia/Jakarta", label: "(GMT+07:00) Jakarta" },
  { value: "Asia/Krasnoyarsk", label: "(GMT+07:00) Krasnoyarsk" },
  { value: "Asia/Shanghai", label: "(GMT+08:00) Beijing" },
  { value: "Asia/Chongqing", label: "(GMT+08:00) Chongqing" },
  { value: "Asia/Hong_Kong", label: "(GMT+08:00) Hong Kong" },
  { value: "Asia/Kuala_Lumpur", label: "(GMT+08:00) Kuala Lumpur" },
  { value: "Asia/Singapore", label: "(GMT+08:00) Singapore" },
  { value: "Asia/Taipei", label: "(GMT+08:00) Taipei" },
  { value: "Australia/Perth", label: "(GMT+08:00) Perth" },
  { value: "Asia/Irkutsk", label: "(GMT+08:00) Irkutsk" },
  { value: "Asia/Ulaanbaatar", label: "(GMT+08:00) Ulaanbaatar" },
  { value: "Asia/Seoul", label: "(GMT+09:00) Seoul" },
  { value: "Asia/Tokyo", label: "(GMT+09:00) Osaka, Sapporo, Tokyo" },
  { value: "Asia/Yakutsk", label: "(GMT+09:00) Yakutsk" },
  { value: "Australia/Darwin", label: "(GMT+09:30) Darwin" },
  { value: "Australia/Adelaide", label: "(GMT+09:30) Adelaide" },
  { value: "Australia/Canberra", label: "(GMT+10:00) Canberra" },
  { value: "Australia/Melbourne", label: "(GMT+10:00) Melbourne" },
  { value: "Australia/Sydney", label: "(GMT+10:00) Sydney" },
  { value: "Australia/Brisbane", label: "(GMT+10:00) Brisbane" },
  { value: "Australia/Hobart", label: "(GMT+10:00) Hobart" },
  { value: "Asia/Vladivostok", label: "(GMT+10:00) Vladivostok" },
  { value: "Pacific/Guam", label: "(GMT+10:00) Guam" },
  { value: "Pacific/Port_Moresby", label: "(GMT+10:00) Port Moresby" },
  { value: "Asia/Magadan", label: "(GMT+11:00) Magadan" },
  { value: "Asia/Srednekolymsk", label: "(GMT+11:00) Srednekolymsk" },
  { value: "Pacific/Guadalcanal", label: "(GMT+11:00) Solomon Is." },
  { value: "Pacific/Noumea", label: "(GMT+11:00) New Caledonia" },
  { value: "Pacific/Fiji", label: "(GMT+12:00) Fiji" },
  { value: "Asia/Kamchatka", label: "(GMT+12:00) Kamchatka" },
  { value: "Pacific/Majuro", label: "(GMT+12:00) Marshall Is." },
  { value: "Pacific/Auckland", label: "(GMT+12:00) Auckland, Wellington" },
  { value: "Pacific/Chatham", label: "(GMT+12:45) Chatham Is." },
  { value: "Pacific/Tongatapu", label: "(GMT+13:00) Nuku'alofa" },
  { value: "Pacific/Fakaofo", label: "(GMT+13:00) Tokelau Is." },
  { value: "Pacific/Apia", label: "(GMT+13:00) Samoa" }
];

const CalendarTab: React.FC = () => {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('today');
  // Timezone selector state
  const [selectedTimezone, setSelectedTimezone] = useState(
    localStorage.getItem('calendarTimezone') || Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  const localToday = DateTime.now().setZone(selectedTimezone);

  // Persist timezone selection
  useEffect(() => {
    localStorage.setItem('calendarTimezone', selectedTimezone);
  }, [selectedTimezone]);

  // Fetch economic calendar data
  const fetchCalendarData = async (timeframe: string) => {
    setLoading(true);
    setEvents([]); // Clear events before fetching new data
    try {
      // For single-day views, fetch the whole week to avoid timezone boundary issues.
      const fetchTimeframe = ['today', 'tomorrow', 'yesterday'].includes(timeframe)
        ? 'thisWeek'
        : timeframe;
        
      console.log('🔍 Fetching calendar data for timeframe:', fetchTimeframe, `(for user view: ${timeframe})`);
      const response = await getCalendarData(fetchTimeframe);
      console.log('📊 Calendar API response:', response);
      console.log('📅 Events received:', response.events);
      
      if (!response.events || !Array.isArray(response.events)) {
        console.error('❌ Invalid response format:', response);
        setEvents([]);
        return;
      }
      
      setEvents(response.events);
    } catch (error) {
      console.error('❌ Error loading calendar data:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', error.message);
      }
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when the component mounts or viewMode changes
  useEffect(() => {
    fetchCalendarData(viewMode);
  }, [viewMode]);

  // Group events by local day using a more robust processing function
  const groupedEvents = events.reduce((acc: Record<string, LocalEconomicEvent[]>, event) => {
    const timeStr = event.time || '';
    const isSpecificTime = timeStr.includes(':') || /am|pm/i.test(timeStr);
    const isSpecialTime = !isSpecificTime && timeStr && !['N/A', 'TBD', 'undefined', ''].includes(timeStr.trim());

    let utcDt: DateTime | null = null;

    if (event.utcTime) {
      utcDt = DateTime.fromISO(event.utcTime, { zone: 'utc' });
    } else if (event.date && event.date !== 'N/A') {
      const currentYear = new Date().getFullYear();
      if (isSpecificTime) {
        const dateStr = `${event.date} ${currentYear} ${timeStr}`;
        let parsed = DateTime.fromFormat(dateStr, 'EEE MMM d yyyy h:mma', { zone: 'utc' });
        if (!parsed.isValid) {
          parsed = DateTime.fromFormat(dateStr, 'EEE MMM d yyyy HH:mm', { zone: 'utc' });
        }
        if (parsed.isValid) utcDt = parsed;
      } else {
        const dateStr = `${event.date} ${currentYear}`;
        const parsed = DateTime.fromFormat(dateStr, 'EEE MMM d yyyy', { zone: 'utc' });
        if (parsed.isValid) utcDt = parsed;
      }
    }

    if (utcDt && utcDt.isValid) {
      const localTime = utcDt.setZone(selectedTimezone);
      const displayTime = isSpecialTime ? timeStr : undefined;
      const noTime = !isSpecificTime && !isSpecialTime;

      const processedEvent: LocalEconomicEvent = {
        ...event,
        localTime,
        displayTime,
        noTime,
      };
      
      const dayKey = processedEvent.localTime.toFormat('yyyy-MM-dd');
      (acc[dayKey] = acc[dayKey] || []).push(processedEvent);
    }
    
    return acc;
  }, {} as Record<string, LocalEconomicEvent[]>);

  console.log('🌍 Selected timezone:', selectedTimezone);
  console.log('📅 Raw events:', events);
  console.log('📊 Grouped events:', groupedEvents);

  // Filter dates to show based on the selected view mode
  const datesToShow = Object.keys(groupedEvents).filter(dateKey => {
    // For weekly/monthly views, we show everything.
    if (!['today', 'tomorrow', 'yesterday'].includes(viewMode)) {
      return true;
    }
    
    // For daily views, only show dates that match the user's local day.
    // This regex ensures we only try to parse valid YYYY-MM-DD keys.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return false;
    }

    const eventDate = DateTime.fromISO(dateKey, { zone: selectedTimezone });

    if (viewMode === 'today') {
      return eventDate.hasSame(localToday, 'day');
    }
    if (viewMode === 'tomorrow') {
      return eventDate.hasSame(localToday.plus({ days: 1 }), 'day');
    }
    if (viewMode === 'yesterday') {
      return eventDate.hasSame(localToday.minus({ days: 1 }), 'day');
    }
    
    return false;
  }).sort();

  // Helper function to display values safely
  const displayValue = (value: string | undefined) => {
    if (!value || value === 'undefined' || value.trim() === '') {
      return 'N/A';
    }
    return value;
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
      
      {/* Timezone Selector */}
      <Box sx={{ mb: 2, width: 350 }}>
        <Autocomplete
          options={FOREX_FACTORY_TIMEZONES}
          getOptionLabel={option => option.label}
          value={FOREX_FACTORY_TIMEZONES.find(tz => tz.value === selectedTimezone) || null}
          onChange={(_, newValue) => {
            if (newValue) setSelectedTimezone(newValue.value);
          }}
          renderInput={(params) => (
            <TextField {...params} label="Timezone" variant="outlined" size="small" />
          )}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          sx={{ background: 'white', borderRadius: 1 }}
        />
      </Box>

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
              datesToShow.map((date) => (
                <Box key={date} sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                    {date.startsWith('tbd-') 
                      ? `${date.replace('tbd-', '')} - Time TBD`
                      : date.startsWith('fallback-')
                        ? `${date.replace('fallback-', '')} - Approximate Time`
                        : date
                    }
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
                                {event.displayTime
                                  ? event.displayTime
                                  : event.noTime
                                    ? 'TBD'
                                    : event.localTime.toFormat('h:mm a')
                                }
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
                                {displayValue(event.actual)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {displayValue(event.forecast)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                fontWeight="bold"
                                color={getValueColor(event.previousClass)}
                              >
                                {displayValue(event.previous)}
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