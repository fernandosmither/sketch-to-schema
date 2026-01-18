import React, { useState, useRef, MouseEvent } from 'react';
import { Schema } from '../types';
import { Key } from 'lucide-react';

interface VisualizerViewProps {
  schema: Schema;
  setSchema: React.Dispatch<React.SetStateAction<Schema>>;
}

const VisualizerView: React.FC<VisualizerViewProps> = ({ schema, setSchema }) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
       e.preventDefault();
       const s = Math.exp(-e.deltaY * 0.001);
       setScale(prev => Math.min(Math.max(0.2, prev * s), 3));
    } else {
       setOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      setStartPan({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - startPan.x;
      const dy = e.clientY - startPan.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setStartPan({ x: e.clientX, y: e.clientY });
    } else if (draggedTableId) {
      setSchema(prev => ({
        ...prev,
        tables: prev.tables.map(t => {
          if (t.id === draggedTableId) {
            return {
               ...t,
               position: { 
                 x: t.position.x + e.movementX / scale, 
                 y: t.position.y + e.movementY / scale 
               }
            };
          }
          return t;
        })
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedTableId(null);
  };

  // Improved Bezier Path Logic
  const getPath = (rel: any) => {
    const fromTable = schema.tables.find(t => t.id === rel.fromTableId);
    const toTable = schema.tables.find(t => t.id === rel.toTableId);

    if (!fromTable || !toTable) return '';

    const cardWidth = 240; 
    const headerHeight = 45; 
    const rowHeight = 29; 

    // Calculate anchor points (Y-axis)
    const fromColIndex = fromTable.columns.findIndex(c => c.id === rel.fromColumnId);
    const toColIndex = toTable.columns.findIndex(c => c.id === rel.toColumnId);
    
    const fromY = fromTable.position.y + headerHeight + (fromColIndex >= 0 ? fromColIndex * rowHeight + rowHeight/2 : 20);
    const toY = toTable.position.y + headerHeight + (toColIndex >= 0 ? toColIndex * rowHeight + rowHeight/2 : 20);

    const fromX = fromTable.position.x;
    const toX = toTable.position.x;

    // Define boundaries
    const fromRight = fromX + cardWidth;
    const toRight = toX + cardWidth;
    
    // Heuristics
    const gapThreshold = 60; // Minimum horizontal gap to use Left-Right direct connection
    
    // 1. Check if To is clearly to the Right
    if (toX > fromRight + gapThreshold) {
        const startX = fromRight;
        const endX = toX;
        const dist = (endX - startX) * 0.5;
        return `M ${startX} ${fromY} C ${startX + dist} ${fromY}, ${endX - dist} ${toY}, ${endX} ${toY}`;
    }
    
    // 2. Check if To is clearly to the Left
    if (fromX > toRight + gapThreshold) {
        const startX = fromX;
        const endX = toRight;
        const dist = (startX - endX) * 0.5;
        return `M ${startX} ${fromY} C ${startX - dist} ${fromY}, ${endX + dist} ${toY}, ${endX} ${toY}`;
    }

    // 3. Vertical Stacking or Horizontal Overlap
    // We need to route around the tables to avoid cutting through them.
    // Decide whether to loop around the Right side or the Left side.
    
    const fromCenter = fromX + cardWidth / 2;
    const toCenter = toX + cardWidth / 2;

    const controlOffset = 80;

    if (toCenter > fromCenter) {
        // To is slightly right or perfectly below -> Loop around Right side
        const startX = fromRight;
        const endX = toRight;
        return `M ${startX} ${fromY} C ${startX + controlOffset} ${fromY}, ${endX + controlOffset} ${toY}, ${endX} ${toY}`;
    } else {
        // To is slightly left -> Loop around Left side
        const startX = fromX;
        const endX = toX;
        return `M ${startX} ${fromY} C ${startX - controlOffset} ${fromY}, ${endX - controlOffset} ${toY}, ${endX} ${toY}`;
    }
  };

  return (
    <div 
      className="w-full h-full bg-zinc-950 overflow-hidden relative cursor-grab active:cursor-grabbing"
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute top-4 right-4 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-lg p-2 flex gap-2 z-50 shadow-xl">
        <button onClick={() => setScale(s => s - 0.1)} className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 text-zinc-300 rounded transition-colors">-</button>
        <span className="text-zinc-400 text-sm flex items-center justify-center min-w-[3rem] font-mono">{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => s + 0.1)} className="w-8 h-8 flex items-center justify-center hover:bg-zinc-800 text-zinc-300 rounded transition-colors">+</button>
      </div>

      <div 
        className="w-full h-full origin-top-left transition-transform duration-75 ease-out"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
      >
        <svg className="absolute top-0 left-0 w-[5000px] h-[5000px] pointer-events-none z-0">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#52525b" />
            </marker>
          </defs>
          {schema.relationships.map(rel => (
             <path 
               key={rel.id} 
               d={getPath(rel)} 
               stroke="#52525b" 
               strokeWidth="2" 
               fill="none" 
               markerEnd="url(#arrowhead)"
               className="opacity-50 transition-all duration-300"
             />
          ))}
        </svg>

        {schema.tables.map(table => (
          <div
            key={table.id}
            className="absolute w-60 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden group select-none ring-1 ring-black/20"
            style={{ 
              left: table.position.x, 
              top: table.position.y 
            }}
          >
            {/* Header / Drag Handle */}
            <div 
              className="bg-zinc-800 p-3 cursor-grab active:cursor-grabbing border-b border-zinc-700 flex justify-between items-center group-hover:bg-zinc-750 transition-colors"
              onMouseDown={(e) => {
                e.stopPropagation(); // Prevent panning
                setDraggedTableId(table.id);
              }}
            >
              <span className="font-bold text-zinc-200 text-sm truncate">{table.name}</span>
            </div>
            {/* Columns */}
            <div className="bg-zinc-900/95 p-0 text-xs">
              {table.columns.map(col => (
                <div key={col.id} className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/50 transition-colors h-[29px]">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {col.isPk && <Key className="w-3 h-3 text-amber-500 shrink-0" />}
                    <span className={`truncate ${col.isPk ? 'font-semibold text-zinc-200' : 'text-zinc-400'}`}>{col.name}</span>
                  </div>
                  <span className="text-zinc-600 font-mono text-[10px]">{col.type}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="absolute bottom-6 left-6 text-zinc-500 text-xs pointer-events-none bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800/50 backdrop-blur-sm">
        Shift + Drag to Pan • Wheel to Zoom
      </div>
    </div>
  );
};

export default VisualizerView;