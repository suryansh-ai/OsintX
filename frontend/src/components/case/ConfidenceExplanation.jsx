import React, { useMemo, memo } from 'react';

const ConfidenceExplanation = memo(({ entity, onDismiss }) => {
  const explanation = useMemo(() => {
    if (!entity) return null;
    const factors = [];
    const sourceCount = entity.toolsRun?.length || 0;
    const evidenceCount = entity.evidenceRefs?.length || 0;
    const age = entity.lastSeen ? Math.round((Date.now() - entity.lastSeen) / 86400000) : 0;

    if (sourceCount >= 3) factors.push({ label: 'Cross-verified by multiple tools', weight: 'positive', detail: `Found by ${sourceCount} independent tools` });
    else if (sourceCount === 2) factors.push({ label: 'Confirmed by 2 tools', weight: 'positive', detail: `Found by 2 different tools` });
    else if (sourceCount === 1) factors.push({ label: 'Single source', weight: 'neutral', detail: `Found by 1 tool only` });
    else factors.push({ label: 'No tool source', weight: 'negative', detail: 'Not linked to any tool result' });

    if (entity.verificationStatus === 'verified') factors.push({ label: 'Manually verified', weight: 'positive', detail: 'Analyst marked as verified' });
    else if (entity.verificationStatus === 'disputed') factors.push({ label: 'Disputed', weight: 'negative', detail: 'Analyst disputed this entity' });
    else factors.push({ label: 'Unverified', weight: 'neutral', detail: 'Not yet reviewed by analyst' });

    if (age < 7) factors.push({ label: 'Recently active', weight: 'positive', detail: `Last seen ${age} day(s) ago` });
    else if (age < 30) factors.push({ label: 'Moderately recent', weight: 'neutral', detail: `Last seen ${age} day(s) ago` });
    else factors.push({ label: 'Stale data', weight: 'negative', detail: `Last seen ${age} day(s) ago` });

    if (evidenceCount > 3) factors.push({ label: 'Multiple evidence links', weight: 'positive', detail: `Connected to ${evidenceCount} evidence items` });

    const relatedCount = entity.relatedEntities?.length || 0;
    if (relatedCount > 0) factors.push({ label: 'Connected', weight: 'positive', detail: `Linked to ${relatedCount} related entit${relatedCount === 1 ? 'y' : 'ies'}` });

    const score = entity.confidenceScore || 50;
    let level = 'Low';
    if (score >= 80) level = 'High';
    else if (score >= 55) level = 'Medium';

    return { level, score, factors };
  }, [entity]);

  if (!explanation) return null;

  const weightColors = { positive: '#2ecc71', negative: '#e74c3c', neutral: '#f39c12' };

  return (
    <div className="confidence-explanation">
      <div className="explanation-header">
        <span className="explanation-title">Confidence: {explanation.level}</span>
        <span className="explanation-score">{explanation.score}%</span>
        {onDismiss && <button className="dismiss-btn" onClick={onDismiss}>✕</button>}
      </div>
      <div className="explanation-factors">
        {explanation.factors.map((f, i) => (
          <div key={i} className="factor-row">
            <div className="factor-dot" style={{ background: weightColors[f.weight] }} />
            <div className="factor-content">
              <span className="factor-label">{f.label}</span>
              <span className="factor-detail">{f.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default ConfidenceExplanation;
