import { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import type { ChartData, ChartOptions, ChartDataset } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Box, CircularProgress, Typography, Button, ButtonGroup, Switch, FormControlLabel } from '@mui/material';
import { DateTime } from 'luxon';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin,
  BarController,
  LineController
);

interface RawGraphDataPoint {
  dateline: number;
  date: string;
  actual: number | null;
  forecast: number | null;
  revision: number | null;
}

interface EventGraphProps {
  eventId: string;
  eventName: string;
}

const EventGraph: React.FC<EventGraphProps> = ({ eventId, eventName }) => {
  const [data, setData] = useState<ChartData<'bar' | 'line'>>({ datasets: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [visibility, setVisibility] = useState({
    actual: true,
    forecast: true,
    revision: true,
  });
  const chartRef = useRef<ChartJS<'bar' | 'line'>>(null);

  useEffect(() => {
    const fetchGraphData = async () => {
      if (!eventId) {
        setError('Event ID is not available.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await axios.get<RawGraphDataPoint[]>(`/api/calendar/graph/${eventId}`);
        
        const labels = response.data.map(p => DateTime.fromSeconds(p.dateline).toFormat('MMM yyyy'));
        
        const transformedData = {
          labels,
          datasets: [
            {
              label: 'Actual',
              data: response.data.map(p => p.actual),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
              hidden: !visibility.actual,
            },
            {
              label: 'Forecast',
              data: response.data.map(p => p.forecast),
              backgroundColor: 'rgba(255, 159, 64, 0.6)',
              borderColor: 'rgba(255, 159, 64, 1)',
              borderWidth: 1,
              hidden: !visibility.forecast,
            },
            {
              label: 'Revision',
              data: response.data.map(p => p.revision),
              backgroundColor: 'rgba(153, 102, 255, 0.6)',
              borderColor: 'rgba(153, 102, 255, 1)',
              borderWidth: 1,
              hidden: !visibility.revision,
            },
          ],
        };
        setData(transformedData);
        setError(null);
      } catch (err) {
        setError('Failed to load graph data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, [eventId, visibility]);

  useEffect(() => {
    if (chartRef.current && data.labels) {
        if(chartRef.current.options.plugins?.zoom?.limits) {
            chartRef.current.options.plugins.zoom.limits = {
                x: { min: 0, max: data.labels.length, minRange: 10 },
            };
        }
        chartRef.current.update();
    }
  }, [data]);

  const handleVisibilityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVisibility({
      ...visibility,
      [event.target.name]: event.target.checked,
    });
  };
  
  const resetZoom = () => {
    chartRef.current?.resetZoom();
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}><Typography color="error">{error}</Typography></Box>;
  if (!data.datasets.length) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}><Typography>No data available for this event.</Typography></Box>;

  const options: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Graph for ${eventName}`,
        font: {
            size: 18
        }
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'x',
        },
      },
    },
    scales: {
        x: {
            min: data.labels && data.labels.length > 36 ? data.labels.length - 36 : 0,
            ticks: {
                autoSkip: true,
                maxTicksLimit: 20
            }
        },
        y: {
            beginAtZero: true
        }
    }
  };

  const chartData: ChartData<'bar' | 'line'> = {
    ...data,
    datasets: data.datasets.map((ds): ChartDataset<'bar' | 'line'> => {
        const newDs = { ...ds };
        if(ds.label?.toLowerCase() === 'actual') newDs.hidden = !visibility.actual;
        if(ds.label?.toLowerCase() === 'forecast') newDs.hidden = !visibility.forecast;
        if(ds.label?.toLowerCase() === 'revision') newDs.hidden = !visibility.revision;
        return newDs as ChartDataset<'bar' | 'line'>;
    })
  };
  options.animation = {
      duration: 500, // general animation time
      easing: 'easeOutQuart'
  };
  return (
    <Box sx={{ height: 400, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
                <ButtonGroup variant="contained" size="small">
                    <Button onClick={() => setChartType('bar')} disabled={chartType === 'bar'}>Bar</Button>
                    <Button onClick={() => setChartType('line')} disabled={chartType === 'line'}>Line</Button>
                </ButtonGroup>
                <Button onClick={resetZoom} sx={{ ml: 2 }} variant="outlined" size="small">Reset Zoom</Button>
            </Box>
            <Box>
                <FormControlLabel control={<Switch checked={visibility.actual} onChange={handleVisibilityChange} name="actual" />} label="Actual" />
                <FormControlLabel control={<Switch checked={visibility.forecast} onChange={handleVisibilityChange} name="forecast" />} label="Forecast" />
                <FormControlLabel control={<Switch checked={visibility.revision} onChange={handleVisibilityChange} name="revision" />} label="Revision" />
            </Box>
        </Box>
      <Box sx={{ height: 'calc(100% - 48px)' }}>
          <Chart ref={chartRef} type={chartType} options={options} data={chartData} />
      </Box>
    </Box>
  );
};

export default EventGraph; 