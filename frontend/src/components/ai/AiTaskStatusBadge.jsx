const dotMap = {
  deterministic: 'bg-emerald-400',
  ollama: 'bg-blue-400',
  groq: 'bg-purple-400',
  gemini: 'bg-amber-400',
  fallback: 'bg-gray-500',
};

const labelMap = {
  deterministic: 'Deterministic',
  ollama: 'Ollama',
  groq: 'Groq',
  gemini: 'Gemini',
  fallback: 'Fallback',
};

const AiTaskStatusBadge = ({ status, provider, task }) => {
  const key = provider || status || 'fallback';
  const dot = dotMap[key] || dotMap.fallback;
  const label = labelMap[key] || key;

  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-gray-400 leading-none">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {task && <span className="text-gray-500 truncate max-w-[120px]">{task}</span>}
      <span className="text-gray-600">·</span>
      <span>{label}</span>
    </span>
  );
};

export default AiTaskStatusBadge;
