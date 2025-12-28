import React, { useState, useRef, useEffect } from 'react';
import { AppState, StyleDNA, GeneratedIcon, COMMON_ICONS, UserProfile, StylePreset } from './types';
import { analyzeImageStyle, generateIconBatch } from './services/geminiService';
import { StyleAnalyzer } from './components/StyleAnalyzer';
import { IconGrid } from './components/IconGrid';
import { RetroCard } from './components/RetroCard';

const App = () => {
  const [state, setState] = useState<AppState>(AppState.LOGIN);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [styleDNA, setStyleDNA] = useState<StyleDNA | null>(null);
  const [generatedIcons, setGeneratedIcons] = useState<GeneratedIcon[]>([]);
  const [loginInput, setLoginInput] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Background noise effect
  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('iconmancer_user');
    if (storedUser) {
        setUser(JSON.parse(storedUser));
        setState(AppState.IDLE);
    }
  }, []);

  const handleLogin = () => {
     if (!loginInput.trim()) return;
     const codename = loginInput.trim().toUpperCase();
     
     // Try load from local storage
     const storedData = localStorage.getItem(`iconmancer_profile_${codename}`);
     let profile: UserProfile;

     if (storedData) {
         profile = JSON.parse(storedData);
     } else {
         // Create new profile
         profile = {
             codename,
             collections: [
                 { id: 'def_col_1', name: 'Favorites', presets: [] },
                 { id: 'def_col_2', name: 'Work', presets: [] }
             ]
         };
         localStorage.setItem(`iconmancer_profile_${codename}`, JSON.stringify(profile));
     }

     setUser(profile);
     localStorage.setItem('iconmancer_user', JSON.stringify(profile));
     setState(AppState.IDLE);
  };

  const handleLogout = () => {
      localStorage.removeItem('iconmancer_user');
      setUser(null);
      setState(AppState.LOGIN);
      setGeneratedIcons([]);
      setStyleDNA(null);
      setLoginInput('');
  };

  const saveUserToStorage = (updatedUser: UserProfile) => {
      setUser(updatedUser);
      localStorage.setItem(`iconmancer_profile_${updatedUser.codename}`, JSON.stringify(updatedUser));
      localStorage.setItem('iconmancer_user', JSON.stringify(updatedUser));
  };

  const handleCreateCollection = (name: string) => {
      if (!user) return;
      const newCollection = {
          id: `col_${Date.now()}`,
          name,
          presets: []
      };
      const updatedUser = {
          ...user,
          collections: [...user.collections, newCollection]
      };
      saveUserToStorage(updatedUser);
  };

  const handleSavePreset = (presetName: string, collectionId: string, dna: StyleDNA) => {
      if (!user) return;
      
      const newPreset: StylePreset = {
          id: `pre_${Date.now()}`,
          name: presetName,
          dna: { ...dna, name: presetName } // Update internal DNA name too
      };

      const updatedCollections = user.collections.map(col => {
          if (col.id === collectionId) {
              return { ...col, presets: [...col.presets, newPreset] };
          }
          return col;
      });

      const updatedUser = { ...user, collections: updatedCollections };
      saveUserToStorage(updatedUser);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setState(AppState.ANALYZING);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      
      // robustly handle data uri parsing
      const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
          console.error("Failed to parse image data");
          alert("Error: Invalid image format.");
          setState(AppState.IDLE);
          return;
      }
      
      const mimeType = matches[1];
      const base64Data = matches[2];
      
      try {
        const dna = await analyzeImageStyle(base64Data, mimeType);
        setStyleDNA(dna);
        setState(AppState.REVIEW_DNA);
      } catch (e) {
        console.error(e);
        setState(AppState.IDLE);
        alert("System Malfunction: Analysis Failed. Check logs.");
      }
    };
    reader.readAsDataURL(file);
  };

  const startGeneration = async (confirmedDNA?: StyleDNA) => {
    const finalDNA = confirmedDNA || styleDNA;
    if (!finalDNA) return;
    
    setStyleDNA(finalDNA); // Ensure state is updated with edited DNA (colors)
    setState(AppState.GENERATING);

    // Initial set of pending icons
    const initialBatch = COMMON_ICONS.slice(0, 12);
    setGeneratedIcons(initialBatch.map(name => ({ name, svgContent: '', status: 'generating', liked: false })));

    try {
      const results = await generateIconBatch(finalDNA, initialBatch);
      setGeneratedIcons(results);
      setState(AppState.FINISHED);
    } catch (e) {
      console.error(e);
      alert("Fabrication Error: Generation sequence interrupted.");
      setState(AppState.REVIEW_DNA);
    }
  };

  const handleToggleLike = (iconName: string) => {
    setGeneratedIcons(prev => prev.map(icon => 
        icon.name === iconName ? { ...icon, liked: !icon.liked } : icon
    ));
  };

  const handleRenameBatch = (prefix: string, suffix: string) => {
    setGeneratedIcons(prev => prev.map(icon => ({
        ...icon,
        name: `${prefix}${icon.name}${suffix}`
    })));
  };

  const handleTogglePixelMode = async (isPixel: boolean) => {
    if (!styleDNA) return;
    if (styleDNA.isPixelArt === isPixel) return;

    const newDNA = { ...styleDNA, isPixelArt: isPixel };
    setStyleDNA(newDNA);

    // Keep current names in the grid
    const currentNames = generatedIcons.map(i => i.name);
    
    // Set status to generating
    setGeneratedIcons(prev => prev.map(i => ({ ...i, status: 'generating' })));

    try {
        const results = await generateIconBatch(newDNA, currentNames, []);
        
        setGeneratedIcons(prev => {
             return results.map(res => {
                const prevIcon = prev.find(p => p.name === res.name);
                return { ...res, liked: prevIcon?.liked || false };
             });
        });
    } catch (e) {
        console.error("Regeneration failed", e);
    }
  };

  const handleIterate = async (prompt?: string) => {
    if (!styleDNA) return;
    
    // Find liked icons to use as reference
    const likedIcons = generatedIcons.filter(i => i.liked && i.status === 'completed');
    if (likedIcons.length === 0) return;

    // Determine new icons to generate (next batch from common icons or random)
    const existingNames = new Set(generatedIcons.map(i => i.name));
    const nextBatchNames = COMMON_ICONS.filter(name => !existingNames.has(name)).slice(0, 8);
    
    if (nextBatchNames.length === 0) {
        // For demo purposes, if we run out, just pick random ones
        for(let i=0; i<8; i++) nextBatchNames.push(COMMON_ICONS[Math.floor(Math.random() * COMMON_ICONS.length)] + "_v" + Math.floor(Math.random() * 100));
    }

    // Add placeholders
    const newPlaceholders: GeneratedIcon[] = nextBatchNames.map(name => ({
        name,
        svgContent: '',
        status: 'generating',
        liked: false
    }));

    setGeneratedIcons(prev => [...prev, ...newPlaceholders]);

    try {
        const results = await generateIconBatch(styleDNA, nextBatchNames, likedIcons, prompt);
        
        setGeneratedIcons(prev => {
            // Replace placeholders with results
            const updated = [...prev];
            results.forEach(res => {
                const idx = updated.findIndex(p => p.name === res.name && p.status === 'generating');
                if (idx !== -1) updated[idx] = res;
            });
            return updated;
        });

    } catch (e) {
        console.error("Iteration failed", e);
    }
  };

  const handleRegenerateUnliked = async (prompt?: string) => {
    if (!styleDNA) return;

    const likedIcons = generatedIcons.filter(i => i.liked && i.status === 'completed');
    const unlikedIcons = generatedIcons.filter(i => !i.liked && i.status !== 'generating'); 

    if (likedIcons.length === 0) {
        alert("Please select at least one icon to use as a style reference.");
        return;
    }
    if (unlikedIcons.length === 0) {
        alert("No unliked icons to regenerate.");
        return;
    }

    const unlikedNames = unlikedIcons.map(i => i.name);

    // Set status of unliked to generating
    setGeneratedIcons(prev => prev.map(icon => {
        if (!icon.liked) return { ...icon, status: 'generating', svgContent: '' };
        return icon;
    }));

    try {
        const results = await generateIconBatch(styleDNA, unlikedNames, likedIcons, prompt);

        setGeneratedIcons(prev => {
             return prev.map(prevIcon => {
                if (prevIcon.liked) return prevIcon; // Keep liked ones
                const newResult = results.find(r => r.name === prevIcon.name);
                return newResult || prevIcon; // Replace with new result or fallback
             });
        });

    } catch (e) {
        console.error("Regeneration failed", e);
    }
  };

  return (
    <div className="min-h-screen bg-sepia-950 bg-noise text-sage-300 font-mono p-4 md:p-8 relative overflow-hidden flex flex-col">
      <div className="scanline"></div>
      
      {/* Header */}
      <header className="mb-12 border-b-2 border-dotted border-sage-700 pb-6 shrink-0">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-4xl md:text-6xl font-pixel text-paper tracking-wider mb-2">
                  ICON_MANCER <span className="text-sm align-super text-rust">v1.3</span>
                </h1>
                <p className="text-sage-dim max-w-md text-sm leading-tight">
                  // UPLOAD OBJECTS.
                  <br/>
                  // ANALYZE. REFINE. FABRICATE.
                </p>
            </div>
            <div className="hidden md:block text-right text-[10px] text-sage-800 font-mono">
                <p>SYS_STATUS: ONLINE</p>
                <p>MEMORY: 64TB</p>
                <p>LATENCY: 12ms</p>
                {user && (
                    <div className="mt-2 border-t border-sage-800 pt-2">
                        <p className="text-paper">USER: {user.codename}</p>
                        <button onClick={handleLogout} className="text-rust hover:underline">[ DISCONNECT ]</button>
                    </div>
                )}
            </div>
        </div>
      </header>

      <main className="relative z-10 flex-grow flex flex-col items-center justify-center">
        
        {state === AppState.LOGIN && (
             <div className="w-full max-w-md animate-in zoom-in-95 duration-500">
                <RetroCard title="AUTHENTICATION" accent="rust">
                    <div className="flex flex-col gap-4 text-center py-6">
                        <p className="text-sm text-sage-dim mb-2">ENTER CODENAME TO ACCESS MAINFRAME</p>
                        <input 
                            type="text" 
                            value={loginInput}
                            onChange={(e) => setLoginInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            placeholder="CODENAME..."
                            className="bg-void-deep border-b-2 border-sage-700 p-2 text-center text-xl text-paper font-pixel tracking-widest outline-none focus:border-rust"
                            autoFocus
                        />
                        <button 
                            onClick={handleLogin}
                            className="mt-4 bg-sage-800 hover:bg-paper hover:text-void text-sage-300 py-2 font-mono font-bold tracking-widest transition-all"
                        >
                            [ CONNECT ]
                        </button>
                    </div>
                </RetroCard>
             </div>
        )}

        {state === AppState.IDLE && user && (
          <div className="w-full max-w-2xl animate-in zoom-in-95 duration-500">
            {/* Upload Section */}
            <RetroCard title="Input_Module" accent="paper">
                <div 
                    className="border-2 border-dashed border-sage-700 bg-void-deep/80 h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-void hover:border-paper transition-all group"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="w-16 h-16 border border-sage-600 flex items-center justify-center mb-4 group-hover:border-paper group-hover:shadow-[0_0_15px_rgba(212,197,168,0.2)] transition-all">
                        <span className="text-4xl text-sage-600 group-hover:text-paper">+</span>
                    </div>
                    <p className="text-lg text-paper font-bold tracking-widest mb-1 group-hover:scale-105 transition-transform">INITIATE UPLOAD</p>
                    <p className="text-xs text-sage-dim font-mono">Drop image / sketch / object</p>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept="image/*"
                    />
                </div>
            </RetroCard>
            
            <div className="mt-8 grid grid-cols-3 gap-4 opacity-50 pointer-events-none select-none">
                 <div className="h-2 bg-sage-900/30"></div>
                 <div className="h-2 bg-sage-900/30"></div>
                 <div className="h-2 bg-sage-900/30"></div>
            </div>
          </div>
        )}

        {state === AppState.ANALYZING && (
          <div className="text-center space-y-4">
             <div className="w-16 h-16 border-4 border-t-paper border-r-sage-700 border-b-sage-900 border-l-sage-700 rounded-full animate-spin mx-auto"></div>
             <p className="font-pixel text-2xl text-paper animate-pulse">EXTRACTING_STYLE_DNA...</p>
             <div className="font-mono text-xs text-sage-dim h-20 overflow-hidden w-64 mx-auto text-left border border-sage-900 p-2 bg-void-deep">
                <p className="animate-[pulse_0.2s_infinite]">Scanning contrast...</p>
                <p className="animate-[pulse_0.3s_infinite]">Measuring curvature...</p>
                <p className="animate-[pulse_0.5s_infinite]">Detecting line caps...</p>
                <p className="animate-[pulse_0.1s_infinite]">Isolating noise...</p>
             </div>
          </div>
        )}

        {state === AppState.REVIEW_DNA && styleDNA && (
          <StyleAnalyzer 
            dna={styleDNA} 
            onConfirm={startGeneration} 
            onRetake={() => {
                setStyleDNA(null);
                setState(AppState.IDLE);
            }} 
            user={user}
            onSavePreset={handleSavePreset}
            onCreateCollection={handleCreateCollection}
          />
        )}

        {state === AppState.GENERATING && (
             <div className="w-full max-w-4xl">
                 <h2 className="text-xl font-mono text-paper mb-4 blink">>> FABRICATING ASSETS...</h2>
                 <div className="grid grid-cols-4 md:grid-cols-6 gap-4 opacity-50">
                    {generatedIcons.map((_, i) => (
                        <div key={i} className="aspect-square bg-void border border-sage-800 animate-pulse"></div>
                    ))}
                 </div>
             </div>
        )}

        {state === AppState.FINISHED && styleDNA && (
          <IconGrid 
            icons={generatedIcons} 
            styleDNA={styleDNA} 
            onReset={() => {
                setGeneratedIcons([]);
                setStyleDNA(null);
                setState(AppState.IDLE);
            }} 
            onToggleLike={handleToggleLike}
            onIterate={handleIterate}
            onRegenerateUnliked={handleRegenerateUnliked}
            onRenameBatch={handleRenameBatch}
            onTogglePixelMode={handleTogglePixelMode}
          />
        )}

      </main>

      <footer className="mt-12 border-t border-sage-900 pt-6 flex justify-between items-end opacity-60 text-[10px] font-mono shrink-0">
        <div>
            <p>ICON_MANCER SYSTEM © 2024</p>
            <p>POWERED BY GEMINI 2.5 FLASH</p>
        </div>
        <div className="text-right">
            <p>NO SIGNAL INPUT</p>
            <p>AWAITING COMMAND</p>
        </div>
      </footer>
    </div>
  );
};

export default App;