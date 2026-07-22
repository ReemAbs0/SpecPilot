import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Note: React.StrictMode is intentionally not used. The generation progress screen opens a
// single-use SSE session; StrictMode's dev-only double-invoke of effects would tear the
// stream down and reopen it, and the first teardown cancels the session on the backend
// (FR-011b), breaking the flow in development.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
