import React, { useState, useEffect } from 'react';
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
    try {
      const response = await axios.get('http://localhost:5000/api/calendar', {
        params: { timeframe, timezone: userTimezone },
      });
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData(viewMode);
  }, [viewMode, userTimezone]);

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
    <div className="flex justify-center">
      <div className="p-4 bg-white shadow rounded max-w-5xl w-full">
        <h2 className="text-lg font-semibold mb-2 text-center">Economic Calendar</h2>


        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center space-x-2 mb-4">
          {['yesterday', 'today', 'tomorrow', 'thisWeek', 'nextWeek', 'thisMonth', 'nextMonth', 'lastWeek', 'lastMonth'].map((preset) => (
            <button
              key={preset}
              className={`px-3 py-1 text-sm transition-colors duration-300 ${
                viewMode === preset ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
              } rounded`}
              onClick={() => setViewMode(preset)}
            >
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            {Object.keys(groupedEvents).length === 0 ? (
              <p className="text-center text-gray-500">No events found.</p>
            ) : (
              Object.keys(groupedEvents).map((date) => (
                <div key={date} className="mb-6">
                  <h3 className="text-md font-bold my-2 text-center">{date}</h3>
                  <table className="min-w-full table-auto mb-4 border-collapse text-center mx-auto">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2">Time</th>
                        <th className="px-4 py-2">Currency</th>
                        <th className="px-4 py-2">Event</th>
                        <th className="px-4 py-2">Impact</th>
                        <th className="px-4 py-2">Actual</th>
                        <th className="px-4 py-2">Forecast</th>
                        <th className="px-4 py-2">Previous</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedEvents[date].map((event, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-2">{convertTo12HourFormat(event.time)}</td>
                          <td className="px-4 py-2">{event.currency}</td>
                          <td className="px-4 py-2">{event.event}</td>
                          <td className={`px-4 py-2 ${getImpactClass(event.impact)}`}>{event.impact}</td>
                          <td className="px-4 py-2">
                            <span className={`${getValueClass(event.actualClass)} font-bold`} title={event.actualTitle || ''}>
                              {event.actual}
                              {event.actualClass?.includes('revised') && (
                                <IconTriangleFilled size={12} className="inline-block ml-1 text-red-500 rotate-90" />
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-2">{event.forecast}</td>
                          <td className="px-4 py-2">
                            <span className={`${getValueClass(event.previousClass)} font-bold`} title={event.previousTitle || ''}>
                              {event.previous}
                              {event.previousClass?.includes('revised') && (
                                <IconTriangleFilled size={12} className="inline-block ml-1 text-red-500 rotate-90" />
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
  return impact === 'high' ? 'text-red-500 font-bold' : impact === 'medium' ? 'text-yellow-500' : 'text-green-500';
};

const getValueClass = (valueClass?: string) => {
  return valueClass?.includes('better') ? 'text-green-500' : valueClass?.includes('worse') ? 'text-red-500' : 'text-gray-700';
};

export default EconomicCalendar;