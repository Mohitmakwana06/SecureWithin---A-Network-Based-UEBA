import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import SideMenu from './components/SideMenu';
import ClientsPage from './components/ClientsPage';
import Dashboard from './Dashboard';
import DetailsPage from './components/DetailsPage';
import SignInSide from './components/SignInSide';
import SignUp from './components/SignUp';
import OrgSignIn from './components/OrgSignIn';
import OrgSignUp from './components/OrgSignUp';
import SignInCard from './components/SignInCard';
import About from './components/About';
import Rules from './components/Rules';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', height: '100vh' }}>
        <Routes>
          {/* Public Pages (No Sidebar) */}
          <Route path="/" element={<OrgSignIn />} />
          <Route path="/SignInSide" element={<SignInSide />} />
          <Route path="/SignUp" element={<SignUp />} />
          <Route path="/OrgSignUp" element={<OrgSignUp />} />

          {/* Authenticated Pages with Sidebar */}
          <Route
            path="/*"
            element={
              <div style={{ display: 'flex', width: '100%' }}>
                {/* Sidebar for Authenticated Routes */}
                <SideMenu />

                {/* Main Content Area */}
                <div style={{ flex: 1, padding: '20px' }}>
                  <Routes>
                   <Route path="Rules" element={<Rules />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/clients" element={<ClientsPage />} />
                    <Route path="/details/:client_id" element={<DetailsPage />} />
                    <Route path="/About" element={<About />} />                     
                    {/* Catch-all route for undefined paths */}
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                    
                  </Routes>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;