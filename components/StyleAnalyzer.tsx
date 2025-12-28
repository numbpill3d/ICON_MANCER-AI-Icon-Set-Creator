import React, { useState, useEffect } from 'react';
import { StyleDNA, STYLE_PRESETS, UserProfile, PresetCollection, StylePreset } from '../types';
import { RetroCard } from './RetroCard';
import { RetroModal } from './RetroModal';

interface Props {
  dna: StyleDNA;
  onConfirm: (dna: StyleDNA) => void;
  onRetake: () => void;
  user: UserProfile | null;
  onSavePreset: (presetName: string, collectionId: string, dna: StyleDNA) => void;
  onCreateCollection: (name: string) => void;
}

export const StyleAnalyzer: React.FC<Props> = ({ 
  dna: initialDna, 
  onConfirm, 
  onRetake,
  user,
  onSavePreset,
  onCreateCollection
}) => {
  const [dna, setDna] = useState<StyleDNA>(initialDna);
  const [newColor, setNewColor] = useState('#000000');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  useEffect(() => {
    setDna(initialDna);
  }, [initialDna]);

  useEffect(() => {
    if (user && user.collections.length > 0 && !selectedCollectionId) {
      setSelectedCollectionId(user.collections[0].id);
    }
  }, [user, selectedCollectionId]);

  const handleColorChange = (index: number, color: string) => {
    const newPalette = [...dna.colorPalette];
    newPalette[index] = color;
    setDna({ ...dna, colorPalette: newPalette });
  };

  const removeColor = (index: number) => {
    const newPalette = dna.colorPalette.filter((_, i) => i !== index);
    setDna({ ...dna, colorPalette: newPalette });
  };

  const addColor = () => {
    if (dna.colorPalette.length < 6) {
      setDna({ ...dna, colorPalette: [...dna.colorPalette, newColor] });
    }
  };

  const handleSaveSubmit = () => {
    if (!presetName.trim() || !selectedCollectionId) return;
    onSavePreset(presetName, selectedCollectionId, dna);
    setIsSaveModalOpen(false);
    setPresetName('');
  };

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;
    onCreateCollection(newCollectionName);
    setNewCollectionName('');
    setIsCreatingCollection(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-700">
      <div className="text-center font-mono mb-8">
        <h2 className="text-2xl text-paper mb-2">{`>> SYSTEM ANALYSIS COMPLETE <<`}</h2>
        <p className="text-sage-dim text-sm">STYLE_DNA_EXTRACTED_SUCCESSFULLY</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Metrics & Presets */}
        <div className="space-y-6">
            <RetroCard title="Metrics" accent="sage">
              <div className="space-y-4 font-mono text-sm">
                <div className="flex justify-between items-center border-b border-sage-900 border-dashed pb-2">
                  <span className="text-sage-dim">STYLE_NAME</span>
                  <span className="text-paper uppercase">{dna.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-sage-900 border-dashed pb-2">
                  <span className="text-sage-dim">STROKE_WEIGHT</span>
                  <span className="text-sage-300 uppercase">{dna.strokeWidth}</span>
                </div>
                 <div className="flex justify-between items-center border-b border-sage-900 border-dashed pb-2">
                  <span className="text-sage-dim">ROUNDNESS</span>
                  <span className="text-sage-300 uppercase">{dna.cornerRoundness}</span>
                </div>
                 <div className="flex justify-between items-center border-b border-sage-900 border-dashed pb-2">
                  <span className="text-sage-dim">RENDER_MODE</span>
                  <span className="text-rust uppercase">{dna.isPixelArt ? 'PIXEL_GRID' : 'VECTOR_PATH'}</span>
                </div>
                
                <div className="mt-4">
                   <span className="text-sage-dim block mb-2">COMPLEXITY_INDEX</span>
                   <div className="w-full h-4 bg-void border border-sage-700 p-0.5">
                      <div 
                        className="h-full bg-sage-300 repeating-lines" 
                        style={{ width: `${dna.complexity * 10}%` }}
                      />
                   </div>
                </div>
              </div>
            </RetroCard>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-sage-dim uppercase tracking-widest">Style Override</span>
                {user && (
                   <button 
                    onClick={() => setIsSaveModalOpen(true)}
                    className="text-[10px] bg-sage-900 hover:bg-paper hover:text-void text-sage-300 px-2 py-1 border border-sage-700 transition-colors"
                   >
                     [💾] SAVE CONFIG
                   </button>
                )}
              </div>
              
              <RetroCard title="System_Presets" accent="rust">
                  <div className="grid grid-cols-2 gap-2">
                      {STYLE_PRESETS.map(preset => (
                        <button 
                          key={preset.id}
                          onClick={() => setDna(preset.dna)}
                          className={`px-2 py-2 border text-xs font-mono transition-all text-left ${dna.name === preset.dna.name ? 'bg-rust text-void border-rust font-bold' : 'border-sage-800 text-sage-300 hover:border-paper hover:bg-sage-900'}`}
                        >
                          {preset.name}
                        </button>
                      ))}
                  </div>
              </RetroCard>

              {user && user.collections.length > 0 && (
                <RetroCard title="User_Databanks" accent="paper">
                   <div className="space-y-4">
                      {user.collections.map(collection => (
                         <div key={collection.id}>
                            <h4 className="text-[10px] text-sage-dim mb-2 uppercase border-b border-sage-800 pb-1">{collection.name}</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {collection.presets.length === 0 && <span className="text-[9px] text-sage-800 italic">Empty</span>}
                              {collection.presets.map(preset => (
                                 <button 
                                  key={preset.id}
                                  onClick={() => setDna(preset.dna)}
                                  className={`px-2 py-2 border text-xs font-mono transition-all text-left truncate ${dna.name === preset.name ? 'bg-paper text-void border-paper font-bold' : 'border-sage-800 text-sage-300 hover:border-paper hover:bg-sage-900'}`}
                                  title={preset.name}
                                >
                                  {preset.name}
                                </button>
                              ))}
                            </div>
                         </div>
                      ))}
                   </div>
                </RetroCard>
              )}
            </div>
        </div>

        {/* Right Column: Palette & Vibe */}
        <div className="space-y-6">
            <RetroCard title="Color_Matrix [EDITABLE]" accent="paper">
                <div className="flex flex-wrap gap-4 mt-2">
                    {dna.colorPalette.map((color, i) => (
                        <div key={i} className="group relative flex flex-col items-center gap-2">
                            <div className="relative">
                                <input 
                                    type="color" 
                                    value={color}
                                    onChange={(e) => handleColorChange(i, e.target.value)}
                                    className="w-12 h-12 opacity-0 absolute cursor-pointer z-10"
                                />
                                <div 
                                    className="w-12 h-12 border border-sage-500 shadow-md group-hover:border-paper transition-colors"
                                    style={{ backgroundColor: color }}
                                />
                                <button 
                                    onClick={() => removeColor(i)}
                                    className="absolute -top-2 -right-2 bg-rust text-void w-4 h-4 text-[10px] flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:scale-110"
                                >
                                    ×
                                </button>
                            </div>
                            <span className="text-[10px] font-mono text-sage-dim uppercase">{color}</span>
                        </div>
                    ))}
                    {dna.colorPalette.length < 6 && (
                        <div className="flex flex-col items-center gap-2">
                            <button 
                                onClick={addColor}
                                className="w-12 h-12 border border-sage-800 border-dashed text-sage-600 hover:text-paper hover:border-paper flex items-center justify-center transition-all"
                            >
                                +
                            </button>
                             <span className="text-[10px] font-mono text-sage-800">ADD</span>
                        </div>
                    )}
                </div>
                <p className="text-[10px] text-sage-800 mt-4 text-center">
                    // CLICK SWATCH TO EDIT // MAX 6 COLORS
                </p>
            </RetroCard>

            <RetroCard title="Vibe_Keywords" accent="rust">
                <div className="flex flex-wrap gap-2">
                    {dna.vibeKeywords.map((word, i) => (
                        <span key={i} className="bg-rust/20 text-orange-200 border border-rust/50 px-2 py-1 text-xs font-mono uppercase">
                            {word}
                        </span>
                    ))}
                </div>
            </RetroCard>
        </div>
      </div>

      <RetroCard title="Analysis_Log">
        <p className="font-mono text-xs text-sage-300 leading-relaxed opacity-80">
            {dna.description}
        </p>
      </RetroCard>

      <div className="flex justify-center gap-6 mt-8">
        <button 
            onClick={onRetake}
            className="px-6 py-2 font-mono text-sm text-sage-dim hover:text-rust border-b border-transparent hover:border-rust transition-colors"
        >
            [ DISCARD_DATA ]
        </button>
        <button 
            onClick={() => onConfirm(dna)}
            className="px-8 py-3 bg-sage text-void-deep font-bold font-mono text-lg hover:bg-paper hover:text-void-deep transition-colors shadow-[4px_4px_0px_0px_rgba(138,154,133,0.5)] active:translate-y-1 active:shadow-none"
        >
            INITIALIZE_GENERATOR_SEQUENCE
        </button>
      </div>

      {/* Save Preset Modal */}
      <RetroModal isOpen={isSaveModalOpen} title="SAVE_CONFIGURATION" onClose={() => setIsSaveModalOpen(false)}>
         <div className="space-y-4 font-mono text-xs text-sage-300">
             <div>
                <label className="block text-sage-dim mb-1 uppercase">Preset Name</label>
                <input 
                    type="text" 
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="e.g. Cyber Neon v2"
                    className="w-full bg-void-deep border border-sage-700 p-2 text-paper focus:border-rust outline-none"
                    maxLength={20}
                />
             </div>
             
             <div>
                <div className="flex justify-between items-center mb-1">
                   <label className="text-sage-dim uppercase">Collection</label>
                   <button 
                     onClick={() => setIsCreatingCollection(!isCreatingCollection)}
                     className="text-rust hover:underline"
                   >
                     {isCreatingCollection ? 'Cancel' : '+ New List'}
                   </button>
                </div>
                
                {isCreatingCollection ? (
                   <div className="flex gap-2">
                       <input 
                            type="text" 
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            placeholder="New List Name"
                            className="flex-1 bg-void-deep border border-sage-700 p-2 text-paper focus:border-rust outline-none"
                       />
                       <button 
                          onClick={handleCreateCollection}
                          className="bg-sage text-void px-3 font-bold"
                       >
                         OK
                       </button>
                   </div>
                ) : (
                   <select 
                      value={selectedCollectionId}
                      onChange={(e) => setSelectedCollectionId(e.target.value)}
                      className="w-full bg-void-deep border border-sage-700 p-2 text-sage-300 focus:border-rust outline-none appearance-none"
                   >
                      {user?.collections.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                   </select>
                )}
             </div>

             <div className="pt-4 flex justify-end">
                <button 
                   onClick={handleSaveSubmit}
                   disabled={!presetName || !selectedCollectionId}
                   className={`px-4 py-2 bg-rust text-void font-bold uppercase transition-all ${(!presetName || !selectedCollectionId) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-paper'}`}
                >
                   CONFIRM SAVE
                </button>
             </div>
         </div>
      </RetroModal>
    </div>
  );
};