import React, { useState, useMemo, memo } from 'react';

const EvidenceGallery = memo(({ evidence }) => {
  const [selected, setSelected] = useState(null);

  const images = useMemo(() => {
    return (evidence || []).filter(e =>
      e.type === 'image' ||
      e.type === 'screenshot' ||
      e.mimeType?.startsWith('image/') ||
      e.url?.match(/\.(png|jpg|jpeg|gif|webp|bmp)$/i) ||
      e.imageUrl ||
      e.dataUrl
    );
  }, [evidence]);

  const typeIcon = { image: '🖼️', screenshot: '📸', profile: '👤', unknown: '📄' };

  return (
    <div className="evidence-gallery">
      <div className="gallery-header">
        <h3>Visual Evidence Gallery</h3>
        <span>{images.length} images</span>
      </div>
      <div className="gallery-grid">
        {images.map((item, i) => (
          <div key={item.id || i} className="gallery-item" onClick={() => setSelected(item)}>
            <div className="gallery-thumb">
              {item.dataUrl ? (
                <img src={item.dataUrl} alt={item.title || ''} />
              ) : item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title || ''} />
              ) : (
                <div className="gallery-placeholder">{typeIcon[item.type] || typeIcon.unknown}</div>
              )}
            </div>
            <div className="gallery-info">
              <span className="gallery-title">{item.title || item.type || 'Image'}</span>
              <span className="gallery-source">{item.tool || item.source || 'unknown'}</span>
            </div>
          </div>
        ))}
        {images.length === 0 && <div className="empty-state-full">No visual evidence collected yet</div>}
      </div>

      {selected && (
        <div className="gallery-lightbox" onClick={() => setSelected(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelected(null)}>✕</button>
            {selected.dataUrl ? (
              <img src={selected.dataUrl} alt={selected.title || ''} className="lightbox-image" />
            ) : selected.imageUrl ? (
              <img src={selected.imageUrl} alt={selected.title || ''} className="lightbox-image" />
            ) : (
              <div className="lightbox-placeholder">No image data available</div>
            )}
            <div className="lightbox-meta">
              <h4>{selected.title || selected.type || 'Image'}</h4>
              <p>{selected.description || ''}</p>
              <span>Source: {selected.tool || selected.source || 'unknown'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default EvidenceGallery;
