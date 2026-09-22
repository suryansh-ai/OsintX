import React, { useMemo, memo } from 'react';

const AnalystReviewDashboard = memo(({ evidence, entities, auditLog, tasks }) => {
  const flagged = useMemo(() => {
    const highRiskEntities = (entities || []).filter(e => e.riskScore >= 70);
    const unverifiedHighConfidence = (entities || []).filter(e => e.confidenceScore >= 80 && e.verificationStatus === 'unreviewed');
    const unreviewedEvidence = (evidence || []).filter(e => !e.verificationStatus || e.verificationStatus === 'unreviewed');
    const disputedEvidence = (evidence || []).filter(e => e.verificationStatus === 'disputed');
    const highPriorityTasks = (tasks || []).filter(t => !t.completed && t.priority === 'high');
    const recentActivity = (auditLog || []).filter(e => e.timestamp > Date.now() - 3600000);
    return {
      highRiskEntities,
      unverifiedHighConfidence,
      unreviewedEvidence,
      disputedEvidence,
      highPriorityTasks,
      recentActivity,
      stats: {
        entitiesTotal: entities?.length || 0,
        evidenceTotal: evidence?.length || 0,
        verifiedEntities: entities?.filter(e => e.verificationStatus === 'verified').length || 0,
        verifiedEvidence: evidence?.filter(e => e.verificationStatus === 'verified').length || 0,
      },
    };
  }, [evidence, entities, auditLog, tasks]);

  const alerts = [
    { type: 'risk', count: flagged.highRiskEntities.length, label: 'High Risk Entities', icon: '🔴', severity: 'critical' },
    { type: 'unreviewed', count: flagged.unreviewedEvidence.length, label: 'Unreviewed Evidence', icon: '📄', severity: 'warning' },
    { type: 'unverified', count: flagged.unverifiedHighConfidence.length, label: 'High-Conf Unverified Entities', icon: '⚠️', severity: 'warning' },
    { type: 'disputed', count: flagged.disputedEvidence.length, label: 'Disputed Items', icon: '⚡', severity: 'info' },
    { type: 'tasks', count: flagged.highPriorityTasks.length, label: 'High Priority Tasks', icon: '📋', severity: 'info' },
  ].filter(a => a.count > 0);

  return (
    <div className="analyst-review-dashboard">
      <div className="dashboard-header">
        <h3>Analyst Review Dashboard</h3>
        <span className="last-active">{flagged.recentActivity.length} events in last hour</span>
      </div>

      <div className="dashboard-summary">
        <div className="summary-card">
          <span className="summary-value">{flagged.stats.entitiesTotal}</span>
          <span className="summary-label">Entities</span>
          <span className="summary-sub">{flagged.stats.verifiedEntities} verified</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{flagged.stats.evidenceTotal}</span>
          <span className="summary-label">Evidence</span>
          <span className="summary-sub">{flagged.stats.verifiedEvidence} verified</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{flagged.stats.entitiesTotal - flagged.stats.verifiedEntities}</span>
          <span className="summary-label">Needs Review</span>
          <span className="summary-sub">entities + evidence</span>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="dashboard-alerts">
          <h4>Alerts</h4>
          {alerts.map(alert => (
            <div key={alert.type} className={`alert-item severity-${alert.severity}`}>
              <span className="alert-icon">{alert.icon}</span>
              <span className="alert-count">{alert.count}</span>
              <span className="alert-label">{alert.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="dashboard-sections">
        {flagged.highRiskEntities.length > 0 && (
          <div className="dashboard-section">
            <h4>🔴 High Risk Entities</h4>
            <div className="section-list">
              {flagged.highRiskEntities.slice(0, 5).map(e => (
                <div key={`${e.type}:${e.value}`} className="section-item">
                  <span className="item-badge">{e.type}</span>
                  <span className="item-value">{e.value}</span>
                  <span className="item-score">{e.riskScore}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {flagged.unverifiedHighConfidence.length > 0 && (
          <div className="dashboard-section">
            <h4>⚠️ Unverified High-Confidence Entities</h4>
            <div className="section-list">
              {flagged.unverifiedHighConfidence.slice(0, 5).map(e => (
                <div key={`${e.type}:${e.value}`} className="section-item">
                  <span className="item-badge">{e.type}</span>
                  <span className="item-value">{e.value}</span>
                  <span className="item-score">{e.confidenceScore}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default AnalystReviewDashboard;
