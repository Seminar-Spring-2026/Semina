import { useState } from 'react';
import Joyride, { type CallBackProps, STATUS } from 'react-joyride';
import AdminHeader from '../../components/admin/AdminHeader';
import Sidebar from '../../components/admin/Sidebar';
import DataCard from '../../components/admin/DataCard';
import AlertList from '../../components/admin/AlertList';
import NetworkHealth from '../../components/admin/NetworkHealth';
import IncidentList from '../../components/admin/IncidentList';
import HistoricalTrends from '../../components/common/HistoricalTrends';
import DiagnosticsForensics from './DiagnosticsForensics';
import AIAnalystChat from './AIAnalystChat';
import AdminSettings from './AdminSettings';
import { useAnomalyData } from '../../hooks/useAnomalyData';
import { useSystemMetrics } from '../../hooks/useSystemMetrics';
import { useAlerts } from '../../hooks/useAlerts';
import { useIncidents } from '../../hooks/useIncidents';
import { useAdminTour } from '../../hooks/useAdminTour';
import { adminTourSteps } from '../../config/adminTourSteps';
import '../../components/common/TourStyles.css';
import './AnomalyOverview.css';

interface AnomalyOverviewProps {
  onLogout: () => void;
}

function AnomalyOverview({ onLogout }: AnomalyOverviewProps) {
  const [activeNav, setActiveNav] = useState('anomaly-overview');
  const [anomalyTimeRange, setAnomalyTimeRange] = useState<7 | 30 | 90>(7);

  const days = anomalyTimeRange;
  const { current: anomalyCurrent, history: anomalyHistory, loading: anomalyLoading } = useAnomalyData(60000, days);
  const { systemStatus, networkHealth } = useSystemMetrics(60000);
  const { alerts, loading: alertsLoading } = useAlerts(60000);
  const { incidents, loading: incidentsLoading } = useIncidents(60000);
  const { run, stopTour, startTour } = useAdminTour();

  const handleTimeRangeChange = (range: '7days' | '30days' | '90days') => {
    const daysMap: Record<'7days' | '30days' | '90days', 7 | 30 | 90> = { '7days': 7, '30days': 30, '90days': 90 };
    setAnomalyTimeRange(daysMap[range]);
  };

  const formatAnomalyTrend = () => {
    if (!anomalyHistory || anomalyHistory.length === 0) {
      return [];
    }
    
    return anomalyHistory
      .map((point) => ({
        date: point.label || point.date,
        value: point.value,
      }));
  };

  const getPageTitle = () => {
    switch (activeNav) {
      case 'diagnostics':
        return 'Diagnostics & Forensics';
      case 'ai-chat':
        return 'AI Analyst & Chat';
      case 'settings':
        return 'Settings';
      default:
        return 'Anomaly Overview';
    }
  };

  const handleTourCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      stopTour();
    }
  };

  return (
    <div className="admin-layout">
      <Joyride
        steps={adminTourSteps}
        run={run}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        disableScrolling={true}
        disableScrollParentFix={true}
        scrollToFirstStep={false}
        callback={handleTourCallback}
        styles={{
          options: {
            primaryColor: '#00d4ff',
            zIndex: 10000,
          },
        }}
        locale={{
          back: 'Back',
          close: 'Close',
          last: 'Finish',
          next: 'Next',
          skip: 'Skip Tour',
        }}
      />
      <Sidebar activeItem={activeNav} onNavigate={setActiveNav} onLogout={onLogout} onStartTour={startTour} />
      
      <div className="admin-main">
        <AdminHeader pageTitle={getPageTitle()} />
        
        <main className="admin-content">
          {activeNav === 'anomaly-overview' && (
            <>
              {/* Data Cards Row */}
              <section className="data-cards-section" data-tour="data-cards">
                {anomalyCurrent && systemStatus ? (
                  <>
                    <DataCard
                      title="System Status"
                      status={{
                        label: systemStatus.systemStatus.label,
                        type: systemStatus.systemStatus.statusType,
                      }}
                      detail={`Anomaly Score: ${anomalyCurrent.anomalyScore.toFixed(2)}`}
                      description="Overall operational health based on AI/ML anomaly detection."
                      icon="⚠️"
                    />
                    <DataCard
                      title="Water Quality Index"
                      value={systemStatus.waterQualityIndex.value.toFixed(1)}
                      trend={systemStatus.waterQualityIndex.trend}
                      description={`Optimal range: ${systemStatus.waterQualityIndex.optimalRange}`}
                    />
                    <DataCard
                      title="Total Pump Flow Rate"
                      value={systemStatus.pumpFlowRate.value}
                      description={systemStatus.pumpFlowRate.description}
                    />
                    <DataCard
                      title="Tank T1 Level"
                      value={systemStatus.tankT1Level.value}
                      trend={systemStatus.tankT1Level.trend}
                      description={`Live vs Predicted: ${systemStatus.tankT1Level.liveVsPredicted}`}
                    />
                  </>
                ) : (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div className="overview-skeleton-card" key={`skeleton-card-${index}`}>
                      <div className="overview-skeleton-line w-60" />
                      <div className="overview-skeleton-line w-35" />
                      <div className="overview-skeleton-line w-80" />
                      <div className="overview-skeleton-line w-55" />
                    </div>
                  ))
                )}
              </section>

              {/* Alerts and Network Health Row */}
              <section className="alerts-network-section">
                <div className="alerts-column" data-tour="alerts">
                  {alertsLoading ? (
                    <div className="overview-skeleton-panel">
                      <div className="overview-skeleton-line w-40" />
                      <div className="overview-skeleton-row">
                        <div className="overview-skeleton-line w-45" />
                        <div className="overview-skeleton-line w-20" />
                        <div className="overview-skeleton-line w-25" />
                      </div>
                      <div className="overview-skeleton-row">
                        <div className="overview-skeleton-line w-50" />
                        <div className="overview-skeleton-line w-18" />
                        <div className="overview-skeleton-line w-22" />
                      </div>
                      <div className="overview-skeleton-row">
                        <div className="overview-skeleton-line w-42" />
                        <div className="overview-skeleton-line w-20" />
                        <div className="overview-skeleton-line w-30" />
                      </div>
                    </div>
                  ) : (
                    <AlertList alerts={alerts} />
                  )}
                </div>
                <div className="network-column" data-tour="network-health">
                  {networkHealth ? (
                    <NetworkHealth
                      status={networkHealth.status}
                      trafficVolume={networkHealth.trafficVolume}
                      failedConnections={networkHealth.failedConnections}
                    />
                  ) : (
                    <div className="overview-skeleton-panel">
                      <div className="overview-skeleton-row">
                        <div className="overview-skeleton-line w-55" />
                        <div className="overview-skeleton-line w-25" />
                      </div>
                      <div className="overview-skeleton-line w-90" />
                      <div className="overview-skeleton-line w-85" />
                      <div className="overview-skeleton-line w-88" />
                      <div className="overview-skeleton-line w-65" />
                    </div>
                  )}
                </div>
              </section>

              {/* Historical Trends Section */}
              <section className="trends-section" data-tour="anomaly-trend">
                {anomalyLoading ? (
                  <div className="overview-skeleton-panel">
                    <div className="overview-skeleton-row">
                      <div className="overview-skeleton-line w-35" />
                      <div className="overview-skeleton-line w-25" />
                    </div>
                    <div className="overview-skeleton-chart">
                      {Array.from({ length: 12 }).map((_, index) => (
                        <span key={`chart-bar-${index}`} className="overview-skeleton-bar" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <HistoricalTrends
                    title="Anomaly Score Trend"
                    data={formatAnomalyTrend()}
                    timeRange={anomalyTimeRange === 7 ? '7days' : anomalyTimeRange === 30 ? '30days' : '90days'}
                    onTimeRangeChange={handleTimeRangeChange}
                    unit="Score"
                    variant="admin"
                  />
                )}
              </section>

              {/* Recent Incidents Section */}
              <section className="incidents-section" data-tour="incidents">
                {incidentsLoading ? (
                  <div className="overview-skeleton-panel">
                    <div className="overview-skeleton-line w-38" />
                    <div className="overview-skeleton-list-item">
                      <div className="overview-skeleton-row">
                        <div className="overview-skeleton-line w-28" />
                        <div className="overview-skeleton-line w-22" />
                      </div>
                      <div className="overview-skeleton-line w-90" />
                      <div className="overview-skeleton-line w-80" />
                    </div>
                    <div className="overview-skeleton-list-item">
                      <div className="overview-skeleton-row">
                        <div className="overview-skeleton-line w-30" />
                        <div className="overview-skeleton-line w-20" />
                      </div>
                      <div className="overview-skeleton-line w-85" />
                      <div className="overview-skeleton-line w-75" />
                    </div>
                  </div>
                ) : (
                  <IncidentList incidents={incidents} />
                )}
              </section>
            </>
          )}

          {activeNav === 'diagnostics' && <DiagnosticsForensics />}

          {activeNav === 'ai-chat' && <AIAnalystChat />}

          {activeNav === 'settings' && <AdminSettings />}
        </main>

        <footer className="admin-footer">
          © 2025 Operator Dashboard. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

export default AnomalyOverview;
