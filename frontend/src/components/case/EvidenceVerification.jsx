import React, { useState } from 'react';

const VERIFICATION_STATES = {
  unreviewed: { label: 'Unreviewed', icon: '◻️', next: 'verified', color: '#95a5a6' },
  verified: { label: 'Verified', icon: '✅', next: 'disputed', color: '#2ecc71' },
  disputed: { label: 'Disputed', icon: '⚠️', next: 'fp', color: '#f39c12' },
  fp: { label: 'False Positive', icon: '❌', next: 'unreviewed', color: '#e74c3c' },
  requires_review: { label: 'Needs Review', icon: '🔍', next: 'verified', color: '#3498db' },
};

const EvidenceVerificationBadge = ({ status, onVerify, evidenceId, onComment }) => {
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const state = VERIFICATION_STATES[status] || VERIFICATION_STATES.unreviewed;

  const handleVerify = () => {
    const next = state.next;
    if (onVerify) onVerify(evidenceId, next);
  };

  const handleComment = () => {
    if (comment.trim() && onComment) {
      onComment(evidenceId, comment.trim());
      setComment('');
      setShowComment(false);
    }
  };

  return (
    <div className="evidence-verification">
      <span className="verification-status" style={{ color: state.color }}>
        {state.icon} {state.label}
      </span>
      <div className="verification-actions">
        <button className="verify-btn" onClick={handleVerify} title={`Mark as ${state.next}`}>
          {VERIFICATION_STATES[state.next]?.icon || '→'} {state.next.replace('_', ' ')}
        </button>
        <button className="comment-btn" onClick={() => setShowComment(!showComment)} title="Add comment">
          💬
        </button>
      </div>
      {showComment && (
        <div className="verification-comment">
          <input
            type="text"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Add review note..."
            onKeyDown={e => e.key === 'Enter' && handleComment()}
          />
          <button className="small-btn" onClick={handleComment}>Send</button>
        </div>
      )}
    </div>
  );
};

const EvidenceReviewPanel = ({ evidenceItems, onUpdateStatus, onBulkAction }) => {
  const [selected, setSelected] = useState(new Set());

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === evidenceItems.length) setSelected(new Set());
    else setSelected(new Set(evidenceItems.map(e => e.id || e._id)));
  };

  const bulkAction = (action) => {
    if (onBulkAction) onBulkAction(Array.from(selected), action);
    setSelected(new Set());
  };

  const counts = {};
  for (const e of evidenceItems || []) {
    const s = e.verificationStatus || 'unreviewed';
    counts[s] = (counts[s] || 0) + 1;
  }

  return (
    <div className="evidence-review-panel">
      <div className="review-header">
        <h4>Evidence Verification</h4>
        <div className="review-stats">
          {Object.entries(counts).map(([status, count]) => (
            <span key={status} className="stat-chip" style={{ color: VERIFICATION_STATES[status]?.color }}>
              {VERIFICATION_STATES[status]?.icon} {count}
            </span>
          ))}
        </div>
      </div>

      {evidenceItems?.length > 0 && (
        <>
          <div className="bulk-bar">
            <label className="checkbox-label">
              <input type="checkbox" checked={selected.size === evidenceItems.length} onChange={selectAll} />
              Select All ({selected.size} selected)
            </label>
            <div className="bulk-actions">
              <button onClick={() => bulkAction('verified')}>✅ Verify</button>
              <button onClick={() => bulkAction('disputed')}>⚠️ Dispute</button>
              <button onClick={() => bulkAction('fp')}>❌ FP</button>
              <button onClick={() => bulkAction('requires_review')}>🔍 Needs Review</button>
            </div>
          </div>

          <div className="evidence-review-list">
            {evidenceItems.map((item) => (
              <div key={item.id || item._id} className="evidence-review-item">
                <input
                  type="checkbox"
                  checked={selected.has(item.id || item._id)}
                  onChange={() => toggleSelect(item.id || item._id)}
                />
                <div className="review-item-content">
                  <div className="review-item-title">{item.title || item.type || 'Evidence'}</div>
                  <EvidenceVerificationBadge
                    status={item.verificationStatus || 'unreviewed'}
                    evidenceId={item.id || item._id}
                    onVerify={onUpdateStatus}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export { EvidenceVerificationBadge, EvidenceReviewPanel, VERIFICATION_STATES };
