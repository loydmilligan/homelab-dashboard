import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout, WallboardLayout } from './components/Layout';
import { Overview } from './pages/Overview';
import { Hosts } from './pages/Hosts';
import { Services } from './pages/Services';
import { Network } from './pages/Network';
import { IoT } from './pages/IoT';
import { Logs } from './pages/Logs';
import { Settings } from './pages/Settings';
import { Wallboard } from './pages/Wallboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main layout with navigation */}
        <Route element={<Layout />}>
          <Route path="/" element={<Overview />} />
          <Route path="/hosts" element={<Hosts />} />
          <Route path="/services" element={<Services />} />
          <Route path="/network" element={<Network />} />
          <Route path="/iot" element={<IoT />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fullscreen wallboard for casting */}
        <Route element={<WallboardLayout />}>
          <Route path="/wallboard" element={<Wallboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
