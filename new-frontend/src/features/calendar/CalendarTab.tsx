import React, { useState, useEffect, useMemo } from 'react';
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
import Collapse from '@mui/material/Collapse';
import { getCalendarData } from '../../api/calendar';
import type { EconomicEvent } from '../../api/calendar';
import { DateTime } from 'luxon';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Drawer from '@mui/material/Drawer';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import TimelineIcon from '@mui/icons-material/Timeline';
import EventGraph from './EventGraph';


// Extend EconomicEvent to include localTime for grouping
interface LocalEconomicEvent extends EconomicEvent {
  localTime: DateTime;
  noTime?: boolean; // Flag to indicate if this event has no time
  displayTime?: string; // To hold special time strings like "Tentative"
}

interface EventRowProps {
  event: LocalEconomicEvent;
  getImpactStyling: (impact: string) => { bgcolor: string; color: string };
  getValueColor: (valueClass?: string) => 'success' | 'error' | 'default';
  displayValue: (value?: string) => string;
}

// EventRow component to handle rendering of a single event and its expandable graph
const EventRow = ({ event, getImpactStyling, getValueColor, displayValue }: EventRowProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <React.Fragment>
      <TableRow hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell>
          {event.hasGraph && (
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setExpanded(!expanded)}
            >
              <TimelineIcon />
            </IconButton>
          )}
        </TableCell>
        <TableCell component="th" scope="row">
          <Typography variant="body2" fontWeight="medium">
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
          <Typography variant="body2">
            {event.event}
          </Typography>
        </TableCell>
        <TableCell>
          <Chip 
            label={event.impact} 
            size="small"
            sx={{
              ...getImpactStyling(event.impact),
              fontWeight: 'medium',
              textTransform: 'capitalize',
              borderRadius: '6px',
              px: '4px'
            }}
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
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom component="div">
                Graph for {event.event}
              </Typography>
              {expanded && <EventGraph eventId={event.eventId} eventName={event.event} />}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};


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
  const [customDate, setCustomDate] = useState<DateTime | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // --- Filter States ---
  // Main state for active filters
  const allImpacts = useMemo(() => ['high', 'medium', 'low', 'non-economic'], []);
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>(allImpacts);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  
  // Temporary state while the drawer is open
  const [tempSelectedImpacts, setTempSelectedImpacts] = useState<string[]>(allImpacts);
  const [tempSelectedCurrencies, setTempSelectedCurrencies] = useState<string[]>([]);

  const allCurrencies = useMemo(() => {
    const currencies = new Set(events.map(e => e.currency).filter(c => c));
    return Array.from(currencies).sort();
  }, [events]);
  
  const [isCurrenciesInitialized, setIsCurrenciesInitialized] = useState(false);
  
  useEffect(() => {
    // This effect initializes the currency filters once when events are loaded.
    if (allCurrencies.length > 0 && !isCurrenciesInitialized) {
      setSelectedCurrencies(allCurrencies);
      setTempSelectedCurrencies(allCurrencies);
      setIsCurrenciesInitialized(true);
    }
  }, [allCurrencies, isCurrenciesInitialized]);

  // Timezone selector state
  const [selectedTimezone, setSelectedTimezone] = useState<string>(() => {
    // Try to get from localStorage first
    const saved = localStorage.getItem('calendar_timezone');
    if (saved) return saved;
    // Otherwise, use browser's timezone if available in your list
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('Detected browser timezone:', browserTz);
    // Try to find a direct match
    let found = FOREX_FACTORY_TIMEZONES.find(tz => tz.value === browserTz);
    if (found) {
      console.log('Matched timezone from list:', browserTz);
      return browserTz;
    }
    // Try to find a match by city name (for some browser timezones)
    const browserCity = browserTz.split('/').pop();
    found = FOREX_FACTORY_TIMEZONES.find(tz => tz.value.split('/').pop() === browserCity);
    if (found) {
      console.log('Matched timezone by city from list:', found.value);
      return found.value;
    }
    // fallback to UTC
    console.log('No match found, falling back to UTC');
    return 'Etc/UTC';
  });

  useEffect(() => {
    localStorage.setItem('calendar_timezone', selectedTimezone);
  }, [selectedTimezone]);

  const localToday = DateTime.now().setZone(selectedTimezone);

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

  // Fetch data when the component mounts or viewMode/customDate changes
  useEffect(() => {
    let timeframeToFetch = viewMode;

    if (viewMode === 'custom' && customDate) {
      // Fetch the whole week for the selected date to handle timezone boundaries.
      const startOfWeek = customDate.startOf('week'); 
      timeframeToFetch = `week-${startOfWeek.toISODate()}`;
    } else if (['today', 'tomorrow', 'yesterday'].includes(viewMode)) {
      // Also fetch the current week for the preset day-views.
      timeframeToFetch = 'thisWeek';
    }
    
    // Don't fetch if a custom date is selected but not yet valid.
    if (viewMode === 'custom' && !customDate) return;

    // We no longer need to check this on the frontend, the backend handles it.
    // timeframeToFetch = customDate.toISODate() || '';
    
    fetchCalendarData(timeframeToFetch);
  }, [viewMode, customDate]);


  // Apply filters before grouping
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const impactMatch = selectedImpacts.length === 0 || selectedImpacts.includes(event.impact);
      const currencyMatch = selectedCurrencies.length === 0 || selectedCurrencies.includes(event.currency);
      return impactMatch && currencyMatch;
    });
  }, [events, selectedImpacts, selectedCurrencies]);


  // Group events by local day using a more robust processing function
  const groupedEvents = filteredEvents.reduce((acc: Record<string, LocalEconomicEvent[]>, event) => {
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
    // For weekly/monthly views, show everything fetched.
    if (['thisWeek', 'nextWeek', 'lastWeek', 'thisMonth', 'nextMonth', 'lastMonth'].includes(viewMode)) {
      return true;
    }
    
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
    if (viewMode === 'custom' && customDate) {
      return eventDate.hasSame(customDate, 'day');
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

  // Get styling for the impact chip
  const getImpactStyling = (impact: string) => {
    switch (impact?.toLowerCase()) {
      case 'high':
        return { bgcolor: '#ffcdd2', color: '#c62828' }; // Light Red BG, Dark Red Text
      case 'medium':
        return { bgcolor: '#ffecb3', color: '#ff8f00' }; // Light Amber BG, Dark Amber Text
      case 'low':
        return { bgcolor: '#c8e6c9', color: '#2e7d32' }; // Light Green BG, Dark Green Text
      default:
        return { bgcolor: '#e0e0e0', color: '#424242' }; // Grey
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

  const applyFilters = () => {
    setSelectedImpacts(tempSelectedImpacts);
    setSelectedCurrencies(tempSelectedCurrencies);
    setIsFilterDrawerOpen(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <Box sx={{ p: 3, bgcolor: 'grey.100', minHeight: 'calc(100vh - 64px)' }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary', mb: 3 }}>
          Economic Calendar
        </Typography>
        
        {/* --- Controls --- */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Timezone Selector */}
          <Box sx={{ width: 350 }}>
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
          {/* Date Picker */}
          <DatePicker
            label="Specific date"
            value={customDate}
            onChange={(newValue) => {
              setViewMode('custom');
              setCustomDate(newValue);
            }}
            slotProps={{
              textField: {
                size: 'small',
                sx: { bgcolor: 'white', borderRadius: 1 }
              },
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => {
              // On open, sync temp state with main state
              setTempSelectedImpacts(selectedImpacts);
              setTempSelectedCurrencies(selectedCurrencies);
              setIsFilterDrawerOpen(true);
            }}
            sx={{ bgcolor: 'white', ml: 'auto' }}
          >
            Filter
          </Button>
        </Box>

        <Drawer
          anchor="right"
          open={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
        >
          <Box sx={{ width: 300, p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Filter Events</Typography>
              <IconButton onClick={() => setIsFilterDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider />

            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, mt: 2 }}>
              {/* Impact Filters */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">Impact</Typography>
                  <Box>
                    <Button size="small" onClick={() => setTempSelectedImpacts(allImpacts)}>All</Button>
                    <Button size="small" onClick={() => setTempSelectedImpacts([])}>None</Button>
                  </Box>
                </Box>
                <FormGroup>
                  {allImpacts.map(impact => (
                    <FormControlLabel
                      key={impact}
                      control={
                        <Checkbox
                          checked={tempSelectedImpacts.includes(impact)}
                          onChange={() => setTempSelectedImpacts(prev => prev.includes(impact) ? prev.filter(i => i !== impact) : [...prev, impact])}
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">{impact.charAt(0).toUpperCase() + impact.slice(1)}</Typography>}
                    />
                  ))}
                </FormGroup>
              </Box>

              <Divider />

              {/* Currency Filters */}
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">Currencies</Typography>
                  <Box>
                    <Button size="small" onClick={() => setTempSelectedCurrencies(allCurrencies)}>All</Button>
                    <Button size="small" onClick={() => setTempSelectedCurrencies([])}>None</Button>
                  </Box>
                </Box>
                <FormGroup>
                  {allCurrencies.map(currency => (
                    <FormControlLabel
                      key={currency}
                      control={
                        <Checkbox
                          checked={tempSelectedCurrencies.includes(currency)}
                          onChange={() => setTempSelectedCurrencies(prev => prev.includes(currency) ? prev.filter(c => c !== currency) : [...prev, currency])}
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">{currency}</Typography>}
                    />
                  ))}
                </FormGroup>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setIsFilterDrawerOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={applyFilters}
              >
                Apply
              </Button>
            </Box>
          </Box>
        </Drawer>


        <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          {/* Filter Buttons */}
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1, 
            p: 2, 
            bgcolor: 'grey.50',
            borderBottom: 1,
            borderColor: 'divider'
          }}>
            {timeframes.map((preset) => (
              <Button
                key={preset}
                variant={viewMode === preset ? 'contained' : 'outlined'}
                size="small"
                onClick={() => {
                  setViewMode(preset);
                  setCustomDate(null);
                }}
                sx={{ textTransform: 'capitalize', borderRadius: 1.5, px: 1.5, py: 0.5 }}
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
            <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
              {datesToShow.length === 0 ? (
                <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                  No events found for this timeframe. Please select another date.
                </Typography>
              ) : (
                datesToShow.map((date) => (
                  <Box key={date} sx={{ mb: 4 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        mb: 2, 
                        p: 1.5, 
                        bgcolor: 'primary.main', 
                        color: 'white', 
                        borderRadius: 2, 
                        fontWeight: 500 
                      }}
                    >
                      {date.startsWith('tbd-')
                        ? `Events for ${date.replace('tbd-', '')} (Time TBD)`
                        : date.startsWith('fallback-')
                          ? `Events for ${date.replace('fallback-', '')} (Approximate Time)`
                          : DateTime.fromISO(date).toFormat('EEEE, d MMMM yyyy')
                      }
                    </Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <Table sx={{ tableLayout: 'fixed' }}>
                        <TableHead sx={{ bgcolor: 'grey.50' }}>
                          <TableRow>
                            <TableCell sx={{ width: '80px', fontWeight: 'bold', color: 'text.secondary' }}>Graph</TableCell>
                            <TableCell sx={{ width: '120px', fontWeight: 'bold', color: 'text.secondary' }}>Time</TableCell>
                            <TableCell sx={{ width: '100px', fontWeight: 'bold', color: 'text.secondary' }}>Currency</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Event</TableCell>
                            <TableCell sx={{ width: '150px', fontWeight: 'bold', color: 'text.secondary' }}>Impact</TableCell>
                            <TableCell sx={{ width: '100px', fontWeight: 'bold', color: 'text.secondary' }}>Actual</TableCell>
                            <TableCell sx={{ width: '100px', fontWeight: 'bold', color: 'text.secondary' }}>Forecast</TableCell>
                            <TableCell sx={{ width: '100px', fontWeight: 'bold', color: 'text.secondary' }}>Previous</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {groupedEvents[date].map((event, index) => (
                            <EventRow
                              key={index}
                              event={event}
                              getImpactStyling={getImpactStyling}
                              getValueColor={getValueColor}
                              displayValue={displayValue}
                            />
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
    </LocalizationProvider>
  );
};

export default CalendarTab; 