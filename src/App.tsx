import { Route, Routes } from 'react-router-dom';
import { Sidebar } from './pages/dashboard/components/Sidebar';
import { AnimatePresence, motion } from 'framer-motion';
import Calendar from './pages/dashboard/components/CalendarEconomic'; // Import Calendar
import News from './pages/dashboard/components/News'; // Import News
import BondsWidget from './pages/dashboard/components/BondsWidget';

const App = () => {
  return (
    <div>
      {/* ✅ Top Header */}
      <header className="fixed top-0 left-0 right-0 h-[64px] bg-gray-800 text-white z-50 flex items-center px-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <span className="text-2xl font-bold">IZYS</span> {/* Adjust site name */}
        </div>
      </header>

      {/* ✅ Sidebar and Main Content */}
      <div className="flex pt-[64px]">
        {/* Sidebar */}
        <Sidebar />

        {/* ✅ Main Content */}
        <main className="flex-grow p-4 ml-[70px]">
          <Routes>
            {/* ✅ Calendar Route (Always Visible on /calendar) */}
            <Route
              path="/calendar"
              element={
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="mt-4 bg-white dark:bg-gray-700 p-4 rounded shadow"
                  >
                    <Calendar />
                  </motion.div>
                </AnimatePresence>
              }
            />
            
            {/* ✅ News Route */}
            <Route path="/news" element={<News />} />

            {/* ✅ Bonds Route */}
            <Route path="/bonds" element={<BondsWidget />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;