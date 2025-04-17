import { useState, useEffect } from 'react';
import axios from 'axios';
import { IconTriangleFilled } from '@tabler/icons-react';

interface EconomicEvent {
  date: string;
  time: string;
  timezone: string;
  currency: string;
  event: string;
  impact: string;
  actual: string;
  actualClass?: string;
  actualTitle?: string;
  forecast: string;
  previous: string;
  previousClass?: string;
  previousTitle?: string;
}

// Define an interface for the API response.
interface CalendarResponse {
  events: EconomicEvent[];
}

const EconomicCalendar = () => {
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
      const response = await axios.get<CalendarResponse>('http://localhost:5000/api/calendar', {
        params: { timeframe, timezone: userTimezone },
      });
      setEvents(response.data.events || []); // Set new events or empty array if no events
    } catch (error) {
      console.error('Error loading data:', error);
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

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        <h2 className="text-2xl font-bold p-6 bg-gray-700 text-white">
          Economic Calendar
        </h2>

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-2 p-4 bg-gray-700">
          {['yesterday', 'today', 'tomorrow', 'thisWeek', 'nextWeek', 'thisMonth', 'nextMonth', 'lastWeek', 'lastMonth'].map((preset) => (
            <button
              key={preset}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                viewMode === preset
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-600 text-gray-200 hover:bg-gray-500 shadow-sm'
              }`}
              onClick={() => setViewMode(preset)}
            >
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            {Object.keys(groupedEvents).length === 0 ? (
              <p className="text-center text-gray-400 py-8">No events found.</p>
            ) : (
              Object.keys(groupedEvents).map((date) => (
                <div key={date} className="mb-8">
                  <h3 className="text-xl font-bold mb-4 text-gray-200 bg-gray-700 p-3 rounded-lg">
                    {date}
                  </h3>
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Currency
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Event
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Impact
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Actual
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Forecast
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Previous
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {groupedEvents[date].map((event, index) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-700 transition-colors duration-200"
                        >
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {convertTo12HourFormat(event.time)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {event.currency}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300 font-medium">
                            {event.event}
                          </td>
                          <td className={`px-4 py-3 text-sm ${getImpactClass(event.impact)}`}>
                            {event.impact}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`${getValueClass(event.actualClass)} font-bold`}
                              title={event.actualTitle || ''}
                            >
                              {event.actual}
                              {event.actualClass?.includes('revised') && (
                                <IconTriangleFilled
                                  size={12}
                                  className="inline-block ml-1 text-red-400 rotate-90"
                                />
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300">
                            {event.forecast}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`${getValueClass(event.previousClass)} font-bold`}
                              title={event.previousTitle || ''}
                            >
                              {event.previous}
                              {event.previousClass?.includes('revised') && (
                                <IconTriangleFilled
                                  size={12}
                                  className="inline-block ml-1 text-red-400 rotate-90"
                                />
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const getImpactClass = (impact: string) => {
  return impact === 'high'
    ? 'text-red-400 font-bold'
    : impact === 'medium'
    ? 'text-yellow-400'
    : 'text-green-400';
};

const getValueClass = (valueClass?: string) => {
  return valueClass?.includes('better')
    ? 'text-green-400'
    : valueClass?.includes('worse')
    ? 'text-red-400'
    : 'text-gray-300';
};

export default EconomicCalendar;
