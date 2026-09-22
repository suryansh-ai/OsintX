import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network, Globe, Mail, Phone, Hash, Server, User, FileText,
  Link as LinkIcon, Plus, Trash2, ZoomIn, ZoomOut, Maximize2,
  Move, Eye, X, AlertTriangle, Shield, Lock, Database
} from 'lucide-react';

const nodeTypes = {
  ip: { icon: Globe, color: 'cyan', label: 'IP Address' },
  domain: { icon: Server, color: 'blue', label: 'Domain' },
  email: { icon: Mail, color: 'purple', label: 'Email' },
  phone: { icon: Phone, color: 'green', label: 'Phone' },
  hash: { icon: Hash, color: 'amber', label: 'Hash' },
  person: { icon: User, color: 'pink', label: 'Person' },
  document: { icon: FileText, color: 'orange', label: 'Document' },
  threat: { icon: AlertTriangle, color: 'red', label: 'Threat' },
  credential: { icon: Lock, color: 'rose', label: 'Credential' },
  database: { icon: Database, color: 'emerald', label: 'Database' },
};

const relationshipTypes = [
  { id: 'connects_to', label: 'Connects To', color: '#06b6d4' },
  { id: 'owns', label: 'Owns', color: '#8b5cf6' },
  { id: 'related_to', label: 'Related To', color: '#f59e0b' },
  { id: 'suspicious', label: 'Suspicious', color: '#ef4444' },
  { id: 'confirmed', label: 'Confirmed', color: '#22c55e' },
];

const InvestigationGraph = ({ caseId, evidence = [], onSaveGraph, initialNodes = [], initialEdges = [] }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [draggingNode, setDraggingNode] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [showAddNode, setShowAddNode] = useState(false);
  const [newNode, setNewNode] = useState({ type: 'ip', value: '', notes: '' });
  const [showNodeDetails, setShowNodeDetails] = useState(null);

  // Auto-generate nodes from evidence
  useEffect(() => {
    if (evidence.length > 0 && nodes.length === 0) {
      const autoNodes = evidence.slice(0, 10).map((e, i) => ({
        id: `node-${e.id || i}`,
        type: e.type === 'link' ? 'domain' : e.type === 'data' ? 'database' : 'document',
        value: e.title,
        x: 200 + (i % 4) * 180,
        y: 150 + Math.floor(i / 4) * 150,
        notes: e.description || '',
        evidenceId: e.id,
      }));
      setNodes(autoNodes);
    }
  }, [evidence]);

  // Draw graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const gridSize = 30 * zoom;
    const offsetX = pan.x % gridSize;
    const offsetY = pan.y % gridSize;

    for (let x = offsetX; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = offsetY; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw edges
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      if (!fromNode || !toNode) return;

      const relType = relationshipTypes.find(r => r.id === edge.type) || relationshipTypes[2];
      
      ctx.beginPath();
      ctx.strokeStyle = selectedEdge?.id === edge.id ? '#fff' : relType.color;
      ctx.lineWidth = selectedEdge?.id === edge.id ? 3 : 2;
      
      const fromX = (fromNode.x + pan.x) * zoom;
      const fromY = (fromNode.y + pan.y) * zoom;
      const toX = (toNode.x + pan.x) * zoom;
      const toY = (toNode.y + pan.y) * zoom;
      
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      // Draw arrow
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const arrowLen = 12;
      ctx.beginPath();
      ctx.moveTo(toX - 25 * Math.cos(angle), toY - 25 * Math.sin(angle));
      ctx.lineTo(
        toX - 25 * Math.cos(angle) - arrowLen * Math.cos(angle - Math.PI / 6),
        toY - 25 * Math.sin(angle) - arrowLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        toX - 25 * Math.cos(angle) - arrowLen * Math.cos(angle + Math.PI / 6),
        toY - 25 * Math.sin(angle) - arrowLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = relType.color;
      ctx.fill();

      // Draw label
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;
      ctx.font = '10px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(relType.label, midX, midY - 8);
    });

    // Draw connecting line
    if (connecting) {
      const fromNode = nodes.find(n => n.id === connecting);
      if (fromNode) {
        ctx.beginPath();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.moveTo((fromNode.x + pan.x) * zoom, (fromNode.y + pan.y) * zoom);
        // This would connect to mouse position - simplified here
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [nodes, edges, selectedNode, selectedEdge, zoom, pan, connecting]);

  const handleAddNode = () => {
    if (!newNode.value.trim()) return;
    
    const node = {
      id: `node-${Date.now()}`,
      type: newNode.type,
      value: newNode.value,
      notes: newNode.notes,
      x: 300 + Math.random() * 200,
      y: 200 + Math.random() * 200,
    };
    
    setNodes([...nodes, node]);
    setNewNode({ type: 'ip', value: '', notes: '' });
    setShowAddNode(false);
  };

  const handleDeleteNode = (nodeId) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setEdges(edges.filter(e => e.from !== nodeId && e.to !== nodeId));
    setSelectedNode(null);
  };

  const handleAddEdge = (fromId, toId, type = 'related_to') => {
    if (fromId === toId) return;
    const exists = edges.some(e => (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId));
    if (exists) return;

    const edge = {
      id: `edge-${Date.now()}`,
      from: fromId,
      to: toId,
      type,
    };
    setEdges([...edges, edge]);
    setConnecting(null);
  };

  const handleSave = () => {
    onSaveGraph?.({ nodes, edges });
  };

  return (
    <div className="rounded-xl bg-gray-900/50 border border-amber-500/20 overflow-hidden">
      {/* Toolbar */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Investigation Graph</h3>
          <span className="text-xs text-gray-500">({nodes.length} nodes, {edges.length} connections)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-700" />
          <button
            onClick={() => setShowAddNode(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30"
          >
            <Plus className="w-3 h-3" />
            Add Node
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/30"
          >
            Save Graph
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="relative h-[400px] overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="absolute inset-0 w-full h-full"
        />
        
        {/* Nodes overlay */}
        {nodes.map(node => {
          const NodeIcon = nodeTypes[node.type]?.icon || FileText;
          const color = nodeTypes[node.type]?.color || 'gray';
          return (
            <motion.div
              key={node.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`absolute cursor-move select-none ${
                selectedNode?.id === node.id ? 'ring-2 ring-white' : ''
              }`}
              style={{
                left: (node.x + pan.x) * zoom - 25,
                top: (node.y + pan.y) * zoom - 25,
                transform: `scale(${zoom})`,
              }}
              onClick={() => setSelectedNode(node)}
              onDoubleClick={() => setShowNodeDetails(node)}
            >
              <div className={`w-[50px] h-[50px] rounded-xl bg-${color}-500/20 border border-${color}-500/50 flex flex-col items-center justify-center`}>
                <NodeIcon className={`w-5 h-5 text-${color}-400`} />
              </div>
              <p className="text-[10px] text-center text-gray-300 mt-1 truncate max-w-[60px]">
                {node.value}
              </p>
            </motion.div>
          );
        })}

        {/* Instructions */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Network className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Click "Add Node" to start building your investigation graph</p>
            </div>
          </div>
        )}
      </div>

      {/* Node Types Legend */}
      <div className="p-3 border-t border-gray-800 flex items-center gap-4 overflow-x-auto">
        {Object.entries(nodeTypes).map(([key, type]) => {
          const Icon = type.icon;
          return (
            <div key={key} className="flex items-center gap-1.5 shrink-0">
              <Icon className={`w-3 h-3 text-${type.color}-400`} />
              <span className="text-xs text-gray-500">{type.label}</span>
            </div>
          );
        })}
      </div>

      {/* Selected Node Actions */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-4 p-3 rounded-lg bg-gray-800 border border-gray-700 flex items-center gap-2"
          >
            <span className="text-xs text-gray-400 mr-2">{selectedNode.value}</span>
            <button
              onClick={() => setConnecting(selectedNode.id)}
              className="p-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
              title="Connect to another node"
            >
              <LinkIcon className="w-3 h-3" />
            </button>
            <button
              onClick={() => setShowNodeDetails(selectedNode)}
              className="p-1.5 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
              title="View details"
            >
              <Eye className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleDeleteNode(selectedNode.id)}
              className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
              title="Delete node"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Node Modal */}
      <AnimatePresence>
        {showAddNode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowAddNode(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900 rounded-xl border border-amber-500/30 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-white">Add Node</h3>
                <button onClick={() => setShowAddNode(false)} className="text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Node Type</label>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(nodeTypes).slice(0, 5).map(([key, type]) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setNewNode({ ...newNode, type: key })}
                          className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                            newNode.type === key
                              ? `bg-${type.color}-500/20 border border-${type.color}-500/50`
                              : 'bg-gray-800 hover:bg-gray-700'
                          }`}
                        >
                          <Icon className={`w-4 h-4 text-${type.color}-400`} />
                          <span className="text-[10px] text-gray-400">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {Object.entries(nodeTypes).slice(5).map(([key, type]) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setNewNode({ ...newNode, type: key })}
                          className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                            newNode.type === key
                              ? `bg-${type.color}-500/20 border border-${type.color}-500/50`
                              : 'bg-gray-800 hover:bg-gray-700'
                          }`}
                        >
                          <Icon className={`w-4 h-4 text-${type.color}-400`} />
                          <span className="text-[10px] text-gray-400">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Value</label>
                  <input
                    type="text"
                    value={newNode.value}
                    onChange={e => setNewNode({ ...newNode, value: e.target.value })}
                    placeholder="e.g., 192.168.1.1, example.com, john@email.com"
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Notes</label>
                  <textarea
                    value={newNode.notes}
                    onChange={e => setNewNode({ ...newNode, notes: e.target.value })}
                    placeholder="Additional notes about this entity..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm outline-none resize-none focus:border-amber-500/50"
                  />
                </div>
              </div>
              <div className="p-4 border-t border-gray-800 flex gap-3">
                <button
                  onClick={() => setShowAddNode(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNode}
                  disabled={!newNode.value.trim()}
                  className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold disabled:opacity-50"
                >
                  Add Node
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Node Details Modal */}
      <AnimatePresence>
        {showNodeDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowNodeDetails(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900 rounded-xl border border-amber-500/30"
            >
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = nodeTypes[showNodeDetails.type]?.icon || FileText;
                    const color = nodeTypes[showNodeDetails.type]?.color || 'gray';
                    return <Icon className={`w-5 h-5 text-${color}-400`} />;
                  })()}
                  <h3 className="font-bold text-white">{nodeTypes[showNodeDetails.type]?.label}</h3>
                </div>
                <button onClick={() => setShowNodeDetails(null)} className="text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Value</p>
                  <p className="text-white font-mono">{showNodeDetails.value}</p>
                </div>
                {showNodeDetails.notes && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-gray-300 text-sm">{showNodeDetails.notes}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Connections</p>
                  <p className="text-gray-300 text-sm">
                    {edges.filter(e => e.from === showNodeDetails.id || e.to === showNodeDetails.id).length} connections
                  </p>
                </div>
              </div>
              <div className="p-4 border-t border-gray-800">
                <button
                  onClick={() => {
                    // Trigger investigation tool based on node type
                    setShowNodeDetails(null);
                  }}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold"
                >
                  Investigate This Entity
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvestigationGraph;
