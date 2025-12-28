import React, { useState } from 'react';
import { GeneratedIcon, StyleDNA } from '../types';
import { RetroCard } from './RetroCard';

interface Props {
  icons: GeneratedIcon[];
  styleDNA: StyleDNA;
  onReset: () => void;
  onToggleLike: (iconName: string) => void;
  onIterate: (prompt?: string) => void;
  onRegenerateUnliked: (prompt?: string) => void;
  onRenameBatch: (prefix: string, suffix: string) => void;
  onTogglePixelMode: (isPixel: boolean) => void;
}

export const IconGrid: React.FC<Props> = ({ 
  icons, 
  styleDNA, 
  onReset, 
  onToggleLike, 
  onIterate, 
  onRegenerateUnliked,
  onRenameBatch,
  onTogglePixelMode
}) => {
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [iterationPrompt, setIterationPrompt] = useState('');

  const downloadIcon = (icon: GeneratedIcon) => {
    // Add shape-rendering for pixel art to ensure crisp edges in the exported SVG
    const shapeRendering = styleDNA.isPixelArt ? 'shape-rendering="crispEdges"' : '';
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${shapeRendering}>${icon.svgContent}</svg>`;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${icon.name}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAll = () => {
     alert("Starting batch download of " + icons.length + " icons...");
     // In a real app, this would zip the files. For now we simulate.
     icons.forEach(icon => downloadIcon(icon));
  };

  const downloadJSON = () => {
    const map = icons.reduce((acc, icon) => ({ ...acc, [icon.name]: icon.svgContent }), {});
    const blob = new Blob([JSON.stringify(map, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${styleDNA.name.replace(/\s+/g, '_').toLowerCase()}_map.json`;
    a.click();
  };

  const applyRename = () => {
    onRenameBatch(prefix, suffix);
    setPrefix('');
    setSuffix('');
  };

  const handleExtendClick = () => {
    onIterate(iterationPrompt);
    setIterationPrompt(''); 
  };

  const handleMutateClick = () => {
    onRegenerateUnliked(iterationPrompt);
    setIterationPrompt('');
  };

  const likedCount = icons.filter(i => i.liked).length;
  const totalCount = icons.length;
  const unlikedCount = totalCount - likedCount;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Stats and Tools Header */}
      <div className="flex flex-col xl:flex-row justify-between items-end gap-4 border-b border-sage-700 border-dashed pb-4">
        <div className="flex-1 w-full xl:w-auto">
            <h2 className="text-3xl font-pixel text-paper mb-1">GENERATION_OUTPUT</h2>
            <div className="flex flex-wrap gap-4 font-mono text-xs text-sage-dim mt-2 items-center">
                <span className="bg-void-deep px-2 py-1 border border-sage-800">TOTAL: <span className="text-paper">{totalCount}</span></span>
                <span className={`bg-void-deep px-2 py-1 border border-sage-800 ${likedCount > 0 ? 'border-rust text-rust' : ''}`}>SELECTED: <span className="text-paper">{likedCount}</span></span>
                
                {/* RENDER MODE TOGGLE */}
                <div className="flex items-center ml-0 xl:ml-4 border border-sage-800 bg-void-deep p-0.5 rounded-sm">
                    <button 
                        onClick={() => onTogglePixelMode(false)}
                        className={`px-3 py-1 text-[10px] uppercase transition-all ${!styleDNA.isPixelArt ? 'bg-sage text-void-deep font-bold' : 'text-sage-dim hover:text-sage-300'}`}
                    >
                        Vector
                    </button>
                    <button 
                         onClick={() => onTogglePixelMode(true)}
                        className={`px-3 py-1 text-[10px] uppercase transition-all ${styleDNA.isPixelArt ? 'bg-rust text-void-deep font-bold' : 'text-sage-dim hover:text-sage-300'}`}
                    >
                        Pixel
                    </button>
                </div>
            </div>
        </div>
        
        <div className="flex flex-col items-end gap-2 w-full xl:w-auto">
             <div className="flex items-center gap-2 bg-void-deep p-1 border border-sage-800 w-full xl:w-auto justify-end">
                <span className="text-[10px] text-sage-dim px-2 whitespace-nowrap">BATCH RENAME</span>
                <input 
                    type="text" 
                    placeholder="Prefix-" 
                    className="bg-void border border-sage-800 text-xs px-2 py-1 w-20 text-sage-300 focus:border-paper outline-none"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                />
                <input 
                    type="text" 
                    placeholder="-Suffix" 
                    className="bg-void border border-sage-800 text-xs px-2 py-1 w-20 text-sage-300 focus:border-paper outline-none"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                />
                <button 
                    onClick={applyRename}
                    className="bg-sage-900 hover:bg-paper hover:text-void text-sage-300 text-xs px-2 py-1 transition-colors"
                >
                    APPLY
                </button>
             </div>

            <div className="flex gap-3 font-mono text-sm">
                <button onClick={downloadJSON} className="hover:text-paper text-sage-300 underline decoration-dashed underline-offset-4">
                    EXPORT_JSON
                </button>
                <button onClick={downloadAll} className="hover:text-paper text-sage-300 underline decoration-dashed underline-offset-4">
                    EXPORT_THEME
                </button>
                <button onClick={onReset} className="text-rust hover:text-orange-400">
                    [ NEW_SESSION ]
                </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {icons.map((icon, idx) => (
          <div 
            key={idx} 
            className={`group relative bg-void border ${icon.liked ? 'border-rust shadow-[0_0_10px_rgba(139,90,43,0.3)]' : 'border-sage-900'} hover:border-paper transition-all aspect-square flex flex-col items-center justify-center`}
          >
            {icon.status === 'completed' ? (
                <>
                    <div className="cursor-pointer p-4 w-full h-full flex items-center justify-center" onClick={() => downloadIcon(icon)}>
                        <svg 
                            viewBox="0 0 24 24" 
                            className={`w-full h-full ${styleDNA.isPixelArt ? '' : 'stroke-current'} text-sage-light group-hover:text-paper transition-colors`}
                            fill={styleDNA.fillType === 'solid' ? 'currentColor' : 'none'}
                            stroke={styleDNA.fillType === 'solid' ? 'none' : 'currentColor'}
                            strokeWidth={styleDNA.strokeWidth === 'thick' ? 2.5 : styleDNA.strokeWidth === 'thin' ? 1 : 2}
                            // Apply crisp edges if pixel mode is on for preview
                            shapeRendering={styleDNA.isPixelArt ? 'crispEdges' : 'auto'}
                            dangerouslySetInnerHTML={{ __html: icon.svgContent }}
                        />
                    </div>
                    <span className="absolute bottom-2 text-[10px] font-mono text-sage-dim group-hover:text-paper opacity-50 group-hover:opacity-100 uppercase select-none w-full text-center px-1 truncate">
                        {icon.name}
                    </span>
                    
                    {/* Like Button Overlay */}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleLike(icon.name);
                        }}
                        className={`absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-sm transition-all ${icon.liked ? 'text-rust opacity-100' : 'text-sage-800 opacity-0 group-hover:opacity-100 hover:text-paper'}`}
                        title="Like this icon style"
                    >
                       {icon.liked ? '♥' : '♡'}
                    </button>
                </>
            ) : (
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-6 h-6 bg-sage-900/50 mb-2"></div>
                    <span className="text-[9px] font-mono text-sage-900">PROCESSING</span>
                </div>
            )}
          </div>
        ))}
        
        {/* Iteration Card */}
        <div 
            className={`col-span-1 sm:col-span-2 aspect-[2/1] sm:aspect-auto border border-dashed border-sage-700 flex flex-col p-3 transition-all ${likedCount > 0 ? 'bg-sage-900/10 border-paper/50' : 'opacity-40'}`}
        >
            {likedCount > 0 ? (
                <div className="flex flex-col h-full animate-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] font-mono uppercase text-sage-300">GENETIC EVOLUTION</span>
                         <span className="text-[10px] text-rust animate-pulse">● ACTIVE</span>
                    </div>
                    <textarea 
                        className="flex-1 w-full bg-void-deep border border-sage-800 text-[10px] p-2 text-paper focus:border-rust outline-none resize-none mb-2 font-mono h-16"
                        placeholder="Add mutation cue... (e.g. 'Make them sharper', 'Remove the dots')"
                        value={iterationPrompt}
                        onChange={(e) => setIterationPrompt(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button 
                            onClick={handleMutateClick}
                            className="flex-1 bg-void border border-sage-700 hover:border-rust text-sage-300 text-[10px] py-2 uppercase font-bold tracking-wider transition-colors disabled:opacity-50"
                            title="Regenerate unliked icons in this batch using the selected ones as parents"
                            disabled={unlikedCount === 0}
                        >
                            MUTATE REJECTS ({unlikedCount})
                        </button>
                        <button 
                            onClick={handleExtendClick}
                            className="flex-1 bg-sage-800 hover:bg-paper hover:text-void text-sage-light text-[10px] py-2 uppercase font-bold tracking-wider transition-colors"
                            title="Generate the next batch of icons using selected ones as parents"
                        >
                            EXTEND PACK ↵
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-2">
                    <span className="text-xl mb-2 text-sage-700">⚠</span>
                    <span className="text-[10px] font-mono uppercase text-sage-500">
                        SELECT PARENT ICONS<br/>TO EVOLVE STYLE
                    </span>
                </div>
            )}
        </div>
      </div>
      
      <RetroCard title="Integration_Notes" accent="sage" className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono text-xs text-sage-300">
            <div>
                <h4 className="text-paper mb-2 border-b border-sage-800 inline-block">Color Palette</h4>
                <div className="flex gap-2 mb-2">
                    {styleDNA.colorPalette.map((c, i) => (
                        <div key={i} className="w-4 h-4 border border-white/10" style={{backgroundColor: c}} title={c}></div>
                    ))}
                </div>
                <code className="block bg-void-deep p-2 border border-sage-800 text-rust">
                    {`.icon { stroke: currentColor; fill: none; ${styleDNA.isPixelArt ? 'shape-rendering: crisp-edges;' : ''} }`}
                </code>
            </div>
            <div>
                 <h4 className="text-paper mb-2 border-b border-sage-800 inline-block">Evolutionary Loop</h4>
                 <p className="mb-2">1. <span className="text-rust">SELECT (♥)</span> the icons that best match your vision.</p>
                 <p className="mb-2">2. Use <span className="text-paper">MUTATE REJECTS</span> to fix the bad ones in the current view.</p>
                 <p>3. Use <span className="text-paper">EXTEND PACK</span> to grow your library with new concepts inheriting the selected traits.</p>
            </div>
        </div>
      </RetroCard>

    </div>
  );
};