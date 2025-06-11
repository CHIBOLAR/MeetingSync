import React from 'react';
import ReactDOM from 'react-dom';
import MeetingPanel from './components/MeetingPanel';

const App = () => {
  return (
    <div style={{ padding: '16px' }}>
      <MeetingPanel />
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
