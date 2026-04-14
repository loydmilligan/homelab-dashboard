import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout, WallboardLayout } from './components/Layout';
import { Overview } from './pages/Overview';
import { Hosts } from './pages/Hosts';
import { Wapps } from './pages/Wapps';
import { Stores } from './pages/Stores';
import { Shouts } from './pages/Shouts';
import { Settings } from './pages/Settings';
import { Wallboard } from './pages/Wallboard';
import { ShareModeProvider } from './lib/share-mode';

function App() {
  return (
    <ShareModeProvider>
      <BrowserRouter>
        <Routes>
          {/* Main layout with navigation */}
          <Route element={<Layout />}>
            <Route path="/" element={<Overview />} />
            <Route path="/hosts" element={<Hosts />} />
            <Route path="/wapps" element={<Wapps />} />
            <Route path="/stores" element={<Stores />} />
            <Route path="/shouts" element={<Shouts />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Fullscreen wallboard for casting */}
          <Route element={<WallboardLayout />}>
            <Route path="/wallboard" element={<Wallboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ShareModeProvider>
  );
}

export default App;
