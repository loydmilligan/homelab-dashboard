import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout, WallboardLayout } from './components/Layout';
import { Overview } from './pages/Overview';
import { Hosts } from './pages/Hosts';
import { Wapps } from './pages/Wapps';
import { Works } from './pages/Works';
import { Yots } from './pages/Yots';
import { Stows } from './pages/Stows';
import { Shots } from './pages/Shots';
import { Tracs } from './pages/Tracs';
import { Crets } from './pages/Crets';
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
          <Route path="/wapps" element={<Wapps />} />
          <Route path="/works" element={<Works />} />
          <Route path="/yots" element={<Yots />} />
          <Route path="/stows" element={<Stows />} />
          <Route path="/shots" element={<Shots />} />
          <Route path="/tracs" element={<Tracs />} />
          <Route path="/crets" element={<Crets />} />
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
