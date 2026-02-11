import Logo from '../common/Logo';
import './AdminHeader.css';

interface AdminHeaderProps {
  pageTitle: string;
}

function AdminHeader({ pageTitle }: AdminHeaderProps) {
  return (
    <header className="admin-header">
      <div className="admin-header-content">
        <div className="admin-header-left">
          <Logo size="medium" showText={false} />
        </div>
        <h1 className="admin-page-title">{pageTitle}</h1>
        <div className="admin-header-right-spacer" />
      </div>
    </header>
  );
}

export default AdminHeader;
