import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const ENTITY_COLORS = {
  email:    { fill: '#22d3ee33', stroke: '#22d3ee', text: '#22d3ee' },
  phone:    { fill: '#a78bfa33', stroke: '#a78bfa', text: '#a78bfa' },
  domain:   { fill: '#34d39933', stroke: '#34d399', text: '#34d399' },
  ip:       { fill: '#fbbf2433', stroke: '#fbbf24', text: '#fbbf24' },
  username: { fill: '#f472b633', stroke: '#f472b6', text: '#f472b6' },
  wallet:   { fill: '#facc1533', stroke: '#facc15', text: '#facc15' },
  url:      { fill: '#38bdf833', stroke: '#38bdf8', text: '#38bdf8' },
  hash:     { fill: '#fb718533', stroke: '#fb7185', text: '#fb7185' },
};

const SIM = {
  REPULSION: 5000,
  ATTRACTION: 0.008,
  REST_LENGTH: 130,
  DAMPING: 0.8,
  ITERATIONS: 50,
  W: 800,
  H: 600,
};

function getColor(type) {
  return ENTITY_COLORS[type] || { fill: '#6b728033', stroke: '#6b7280', text: '#6b7280' };
}

export default function EntityRelationshipGraph({ tree, leads, onSelectNode, selectedNode }) {
  const svgRef = useRef(null);
  const rafRef = useRef(null);
  const [layoutNodes, setLayoutNodes] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const graphData = useMemo(() => {
    const allNodes = [];
    const edgeSet = [];
    const seen = new Set();

    tree.forEach(n => {
      if (!seen.has(n.id)) {
        allNodes.push({ id: n.id, type: n.type, value: n.value, confidence: n.confidence, isLead: false, parentId: n.parentId });
        seen.add(n.id);
      }
      if (n.parentId && tree.some(p => p.id === n.parentId)) {
        edgeSet.push({ from: n.parentId, to: n.id });
      }
    });

    leads.forEach((l, i) => {
      const lid = `lead_${l.id ?? i}`;
      allNodes.push({
        id: lid, type: l.type, value: l.value, confidence: l.score ?? 50,
        isLead: true, source: l.source, leadIdx: i,
      });
      if (l.source) {
        const match = tree.find(n => n.value === l.source || n.id === l.source);
        if (match) edgeSet.push({ from: match.id, to: lid, style: 'lead' });
      }
    });

    return { allNodes, edges: edgeSet };
  }, [tree, leads]);

  const initialPositions = useMemo(() => {
    const pos = {};
    const { allNodes, edges } = graphData;
    const treeNodes = allNodes.filter(n => !n.isLead);

    const roots = treeNodes.filter(n => !n.parentId);
    const rc = roots.length || 1;
    roots.forEach((n, i) => {
      pos[n.id] = { x: ((i + 0.5) / rc) * SIM.W, y: 60 };
    });

    const layoutChildren = (parentId) => {
      const children = treeNodes.filter(n => n.parentId === parentId);
      if (!children.length) return;
      const pp = pos[parentId];
      if (!pp) return;
      const span = Math.max(80, children.length * 60);
      const sx = pp.x - span / 2;
      children.forEach((child, i) => {
        pos[child.id] = { x: sx + ((i + 0.5) / children.length) * span, y: pp.y + 90 };
        layoutChildren(child.id);
      });
    };

    roots.forEach(r => layoutChildren(r.id));

    const leads = allNodes.filter(n => n.isLead);
    leads.forEach((l, i) => {
      let sp = null;
      if (l.source) {
        const match = treeNodes.find(n => n.value === l.source || n.id === l.source);
        if (match && pos[match.id]) sp = pos[match.id];
      }
      if (sp) {
        const angle = i * 0.4;
        pos[l.id] = { x: sp.x + 60 + angle * 15, y: sp.y + 40 + i * 18 };
      } else {
        pos[l.id] = { x: 200 + (i % 5) * 100, y: 500 + Math.floor(i / 5) * 40 };
      }
    });

    allNodes.forEach(n => {
      if (!pos[n.id]) pos[n.id] = { x: 400 + Math.random() * 40, y: 300 + Math.random() * 40 };
    });

    return pos;
  }, [graphData]);

  useEffect(() => {
    const { allNodes, edges } = graphData;
    if (!allNodes.length) return;

    const p = {};
    allNodes.forEach(n => { p[n.id] = { x: initialPositions[n.id]?.x ?? 400, y: initialPositions[n.id]?.y ?? 300 }; });
    const v = {};
    allNodes.forEach(n => { v[n.id] = { vx: 0, vy: 0 }; });

    rafRef.current = requestAnimationFrame(() => {
      for (let iter = 0; iter < SIM.ITERATIONS; iter++) {
        const forces = {};
        allNodes.forEach(n => { forces[n.id] = { fx: 0, fy: 0 }; });

        for (let i = 0; i < allNodes.length; i++) {
          for (let j = i + 1; j < allNodes.length; j++) {
            const a = allNodes[i], b = allNodes[j];
            const pa = p[a.id], pb = p[b.id];
            if (!pa || !pb) continue;
            const dx = pa.x - pb.x;
            const dy = pa.y - pb.y;
            const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
            const f = SIM.REPULSION / (dist * dist);
            const fx = (dx / dist) * f;
            const fy = (dy / dist) * f;
            forces[a.id].fx += fx;
            forces[a.id].fy += fy;
            forces[b.id].fx -= fx;
            forces[b.id].fy -= fy;
          }
        }

        edges.forEach(e => {
          const pa = p[e.from], pb = p[e.to];
          if (!pa || !pb) return;
          const dx = pb.x - pa.x;
          const dy = pb.y - pa.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const disp = dist - SIM.REST_LENGTH;
          const f = disp * SIM.ATTRACTION;
          const fx = (dx / dist) * f;
          const fy = (dy / dist) * f;
          forces[e.from].fx += fx;
          forces[e.from].fy += fy;
          forces[e.to].fx -= fx;
          forces[e.to].fy -= fy;
        });

        allNodes.forEach(n => {
          const po = p[n.id];
          const fo = forces[n.id];
          if (!po || !fo) return;
          v[n.id].vx = (v[n.id].vx + fo.fx) * SIM.DAMPING;
          v[n.id].vy = (v[n.id].vy + fo.fy) * SIM.DAMPING;
          po.x += v[n.id].vx;
          po.y += v[n.id].vy;
          po.x = Math.max(30, Math.min(SIM.W - 30, po.x));
          po.y = Math.max(30, Math.min(SIM.H - 30, po.y));
        });
      }

      setLayoutNodes(allNodes.map(n => ({
        ...n,
        x: p[n.id]?.x ?? 400,
        y: p[n.id]?.y ?? 300,
      })));
    });

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [graphData, initialPositions]);

  const handleNodeHover = useCallback((e, node) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      setHoverPos({ x: e.clientX - rect.left + 10, y: e.clientY - rect.top - 10 });
    }
    setHoveredNode(node);
  }, []);

  const handleNodeLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  if (!tree.length && !leads.length) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
        No data to visualize
      </div>
    );
  }

  const currentNodes = layoutNodes.length > 0
    ? layoutNodes
    : graphData.allNodes.map(n => ({ ...n, x: initialPositions[n.id]?.x ?? 400, y: initialPositions[n.id]?.y ?? 300 }));

  const entityNodes = currentNodes.filter(n => !n.isLead);
  const leadNodes = currentNodes.filter(n => n.isLead);

  const edgeData = graphData.edges.map(e => {
    const fn = currentNodes.find(n => n.id === e.from);
    const tn = currentNodes.find(n => n.id === e.to);
    return { ...e, fromNode: fn, toNode: tn };
  }).filter(e => e.fromNode && e.toNode);

  return (
    <div className="relative h-full w-full">
      <svg
        ref={svgRef}
        className="h-full w-full"
        viewBox={`0 0 ${SIM.W} ${SIM.H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="eg-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="eg-glow-lead">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {edgeData.map((e, i) => (
          <motion.line
            key={`eg-e-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: e.style === 'lead' ? 0.4 : 0.6 }}
            transition={{ duration: 0.3, delay: i * 0.01 }}
            x1={e.fromNode.x}
            y1={e.fromNode.y}
            x2={e.toNode.x}
            y2={e.toNode.y}
            stroke={e.style === 'lead' ? '#8b5cf680' : '#374151'}
            strokeWidth={e.style === 'lead' ? 1 : 1.5}
            strokeDasharray={e.style === 'lead' ? '4 4' : 'none'}
          />
        ))}

        {entityNodes.map((n, i) => {
          const sel = selectedNode?.id === n.id;
          const c = getColor(n.type);
          const r = sel ? 18 : 13;
          return (
            <motion.g
              key={n.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: i * 0.015 }}
              onClick={() => onSelectNode?.(n)}
              onMouseEnter={e => handleNodeHover(e, n)}
              onMouseMove={e => handleNodeHover(e, n)}
              onMouseLeave={handleNodeLeave}
              className="cursor-pointer"
            >
              <title>{`${n.type}: ${n.value}\nConfidence: ${n.confidence}%`}</title>
              <circle
                cx={n.x} cy={n.y} r={r}
                fill={sel ? c.stroke : c.fill}
                stroke={c.stroke}
                strokeWidth={sel ? 2.5 : 1.5}
                filter={sel ? 'url(#eg-glow)' : undefined}
              />
              <text
                x={n.x} y={n.y + 1}
                textAnchor="middle" dominantBaseline="middle"
                fill="white" fontSize={sel ? 9 : 7}
                fontFamily="monospace" pointerEvents="none"
              >
                {n.value?.substring(0, sel ? 14 : 8)}
              </text>
              {sel && (
                <text
                  x={n.x} y={n.y + 28}
                  textAnchor="middle" fill={c.text}
                  fontSize={8} fontFamily="monospace"
                >
                  {n.confidence}%
                </text>
              )}
            </motion.g>
          );
        })}

        {leadNodes.map((n, i) => {
          const sel = selectedNode?.id === n.id;
          const c = getColor(n.type);
          const s = sel ? 16 : 11;
          const pts = `${n.x},${n.y - s} ${n.x + s},${n.y} ${n.x},${n.y + s} ${n.x - s},${n.y}`;
          return (
            <motion.g
              key={n.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: (entityNodes.length + i) * 0.015 }}
              onClick={() => onSelectNode?.(n)}
              onMouseEnter={e => handleNodeHover(e, n)}
              onMouseMove={e => handleNodeHover(e, n)}
              onMouseLeave={handleNodeLeave}
              className="cursor-pointer"
            >
              <title>{`Lead - ${n.type}: ${n.value}\nConfidence: ${n.confidence}%`}</title>
              <polygon
                points={pts}
                fill={sel ? c.stroke : 'transparent'}
                stroke={c.stroke}
                strokeWidth={sel ? 2.5 : 1.5}
                strokeDasharray="4 3"
                filter={sel ? 'url(#eg-glow-lead)' : undefined}
              />
              {sel && (
                <text
                  x={n.x} y={n.y + s + 14}
                  textAnchor="middle" fill={c.text}
                  fontSize={8} fontFamily="monospace"
                >
                  {n.confidence}%
                </text>
              )}
            </motion.g>
          );
        })}
      </svg>

      {hoveredNode && (
        <div
          className="pointer-events-none absolute z-10 rounded border border-gray-700 bg-gray-900/95 px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: hoverPos.x, top: hoverPos.y, transform: 'translateY(-100%)' }}
        >
          <div className="font-medium text-gray-300">{hoveredNode.isLead ? 'Lead' : hoveredNode.type}</div>
          <div className="max-w-[200px] truncate font-mono text-gray-100">{hoveredNode.value}</div>
          <div className="text-gray-400">Confidence: {hoveredNode.confidence}%</div>
        </div>
      )}
    </div>
  );
}
