/**
 * Reusable radar chart for culture fit visualisation.
 * targetScores: number[5] — recruiter's adjusted targets (1–5)
 * candidateScores: number[5] | null — candidate's culture scores (1–5)
 * labels: string[5]
 */
export default function CultureFitRadar({ targetScores, candidateScores, labels, size = 300 }) {
  const center = size / 2;
  const radius = size * 0.333;
  const maxScore = 5;

  const getPoint = (score, index, total) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (score / maxScore) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const getCurvedPath = (scores) => {
    if (!scores || scores.length === 0) return '';
    const points = scores.map((s, i) => getPoint(s, i, scores.length));
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length; i++) {
      const p0 = points[i === 0 ? points.length - 1 : i - 1];
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const p3 = points[(i + 2) % points.length];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d + ' Z';
  };

  const targetPath = getCurvedPath(targetScores);
  const candidatePath = candidateScores ? getCurvedPath(candidateScores) : '';

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="cfr-targetGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(59,130,246,0.5)" />
          <stop offset="100%" stopColor="rgba(59,130,246,0.5)" />
        </radialGradient>
        <radialGradient id="cfr-candidateGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(239,68,68,0.5)" />
          <stop offset="100%" stopColor="rgba(239,68,68,0.5)" />
        </radialGradient>
      </defs>

      {/* Grid rings */}
      {[1, 2, 3, 4, 5].map(level => (
        <circle key={level} cx={center} cy={center} r={(level / maxScore) * radius}
          fill="none" stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {/* Axis spokes */}
      {labels.map((_, i) => {
        const p = getPoint(5, i, labels.length);
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#e2e8f0" />;
      })}
      {/* Labels */}
      {labels.map((label, i) => {
        const p = getPoint(6.2, i, labels.length);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize: size * 0.038, fontWeight: 700, fill: '#64748b', textTransform: 'uppercase' }}>
            {label}
          </text>
        );
      })}

      {/* Target area */}
      <path d={targetPath} fill="url(#cfr-targetGrad)" stroke="#3b82f6" strokeWidth="2"
        strokeDasharray={candidateScores ? '4 4' : '0'} />

      {/* Candidate area */}
      {candidateScores && (
        <path d={candidatePath} fill="url(#cfr-candidateGrad)" stroke="#ef4444" strokeWidth="3" />
      )}

      {/* Target dots */}
      {targetScores.map((score, i) => {
        const p = getPoint(score, i, labels.length);
        return <circle key={`t-${i}`} cx={p.x} cy={p.y} r={3} fill="#3b82f6" stroke="white" strokeWidth="1.5" />;
      })}
      {/* Candidate dots */}
      {candidateScores && candidateScores.map((score, i) => {
        const p = getPoint(score, i, labels.length);
        return <circle key={`c-${i}`} cx={p.x} cy={p.y} r={4} fill="#ef4444" stroke="white" strokeWidth="2" />;
      })}
    </svg>
  );
}
