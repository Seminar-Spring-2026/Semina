import { useState } from 'react';
import './Sidebar.css';

interface SidebarProps {
  activeItem: string;
  onNavigate: (item: string) => void;
  onLogout: () => void;
  onStartTour?: () => void;
}

function Sidebar({ activeItem, onNavigate, onLogout, onStartTour }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'anomaly-overview', label: 'Anomaly Overview', icon: 'overview' },
    { id: 'diagnostics', label: 'Diagnostics & Forensics', icon: 'diagnostics' },
    { id: 'ai-chat', label: 'AI Analyst & Chat', icon: 'chat' },
  ];

  const renderIcon = (icon: string) => {
    switch (icon) {
      case 'overview':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 13h6V4H4v9Zm10 7h6v-9h-6v9ZM4 20h6v-3H4v3Zm10-13h6V4h-6v3Z" fill="currentColor" />
          </svg>
        );
      case 'diagnostics':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 18h3v-5H3v5Zm5 0h3V6H8v12Zm5 0h3v-9h-3v9Zm5 0h3V3h-3v15Z" fill="currentColor" />
          </svg>
        );
      case 'chat':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 5h16v10H7l-3 3V5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'tour':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3 3 7l9 4 9-4-9-4Zm0 8-9-4v10l9 4 9-4V7l-9 4Z" fill="currentColor" />
          </svg>
        );
      case 'settings':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19.4 13a7.7 7.7 0 0 0 .05-2l1.95-1.52-1.86-3.22-2.37.96a7.3 7.3 0 0 0-1.72-1L15.1 3h-3.2l-.35 2.22a7.3 7.3 0 0 0-1.72 1l-2.37-.96L5.6 8.48 7.55 10a7.7 7.7 0 0 0 0 2l-1.95 1.52 1.86 3.22 2.37-.96a7.3 7.3 0 0 0 1.72 1L11.9 21h3.2l.35-2.22a7.3 7.3 0 0 0 1.72-1l2.37.96 1.86-3.22L19.45 13ZM12 15.2A3.2 3.2 0 1 1 12 8.8a3.2 3.2 0 0 1 0 6.4Z" fill="currentColor" />
          </svg>
        );
      case 'logout':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M14 7V4H4v16h10v-3M10 12h10m0 0-3-3m3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`} data-tour="sidebar">
      <button 
        className="sidebar-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label="Toggle sidebar"
      >
        {isCollapsed ? '→' : '←'}
      </button>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${activeItem === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            title={item.label}
            data-tooltip={item.label}
            aria-label={item.label}
          >
            <span className="nav-item-icon">{renderIcon(item.icon)}</span>
            <span className="nav-item-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer-actions">
        {onStartTour && (
          <button
            className="sidebar-footer-item"
            onClick={onStartTour}
            title="Take Dashboard Tour"
            data-tooltip="Take Dashboard Tour"
            aria-label="Take Dashboard Tour"
          >
            <span className="sidebar-footer-icon">{renderIcon('tour')}</span>
            <span className="sidebar-footer-label">Take Dashboard Tour</span>
          </button>
        )}
        <button
          className={`sidebar-footer-item ${activeItem === 'settings' ? 'active' : ''}`}
          type="button"
          title="Settings"
          data-tooltip="Settings"
          aria-label="Settings"
          onClick={() => onNavigate('settings')}
        >
          <span className="sidebar-footer-icon">{renderIcon('settings')}</span>
          <span className="sidebar-footer-label">Settings</span>
        </button>
        <button
          className="sidebar-footer-item logout"
          onClick={onLogout}
          title="Logout"
          data-tooltip="Logout"
          aria-label="Logout"
        >
          <span className="sidebar-footer-icon">{renderIcon('logout')}</span>
          <span className="sidebar-footer-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
