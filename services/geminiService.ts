import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StyleDNA, GeneratedIcon } from "../types";

// Archetypes define the functional core of an icon to prevent hallucinations
const ICON_ARCHETYPES: Record<string, string> = {
  "home": "A house facade with a pitched roof. Represents shelter or main menu.",
  "search": "A magnifying glass tilted at 45 degrees. Represents finding details.",
  "settings": "A mechanical gear or cog with teeth. Represents configuration.",
  "user": "A stylized human bust or avatar (head and shoulders).",
  "heart": "A classic cardioid heart shape. Represents like or favorite.",
  "camera": "A simple boxy camera body with a lens circle and shutter button.",
  "mail": "A rectangular envelope with triangular flap lines.",
  "trash": "A trash bin or garbage can, possibly with a lid.",
  "edit": "A pencil or pen angled for writing.",
  "share": "Nodes connected by lines, or an arrow curving out of a box.",
  "wifi": "Concentric curved lines radiating upwards from a point.",
  "battery": "A horizontal rectangle with a small nub on the right end.",
  "folder": "A file folder tab shape.",
  "calendar": "A square page with a top binding bar and grid lines.",
  "clock": "A circle with two hands pointing to a time.",
  "map": "A folded paper map or a location pin marker.",
  "bell": "A bell curve shape with a clapper at the bottom.",
  "lock": "A square body with a U-shaped shackle on top.",
  "unlock": "A lock with the U-shaped shackle lifted or open.",
  "star": "A 5-pointed geometric star.",
  "menu": "Three horizontal stacked lines (hamburger menu).",
  "download": "An arrow pointing down, often into a bracket or line.",
  "upload": "An arrow pointing up, often out of a bracket.",
  "terminal": "A rectangle with a prompt symbol (>_) inside.",
  "code": "Angle brackets (< >) or a slash.",
  "globe": "A sphere with latitude/longitude grid lines.",
  "moon": "A crescent moon shape.",
  "sun": "A circle with radiating rays.",
  "eye": "An almond eye shape with a circular pupil.",
};

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey: apiKey.trim() });
};

export const analyzeImageStyle = async (base64Image: string, mimeType: string = "image/png"): Promise<StyleDNA> => {
  const ai = getAiClient();
  
  const analysisPrompt = `
    ACT AS A SENIOR ART DIRECTOR. Analyze the visual style of this image with extreme attention to detail. 
    Your goal is to extract a "Style DNA" that will be used to generate a premium, bespoke icon pack.

    LOOK FOR IDIOSYNCRASIES:
    - **Stroke Nuances**: Is the line weight uniform or variable? Does it mimic ink, marker, or digital vector? Are there "ink traps" or tapered ends?
    - **Terminals/Caps**: Are ends rounded, sharp, square, or irregular?
    - **Geometry**: Is it strictly geometric, organic/hand-drawn, or a hybrid? 
    - **Construction**: Do lines connect perfectly or are there intentional gaps (stencil)?
    - **Complexity**: Is it hyper-minimalist or detailed with accents (shading, dots, breaks)?
    - **Vibe**: Use evocative adjectives (e.g., "Cyberpunk", "Kawaii", "Brutalist", "Sketchy", "Corporate Memphis", "Glassmorphism").
    
    If the input is a photo (e.g., a keyboard, a sign), analyze the typography or iconography found within it.
    
    OUTPUT JSON STRICTLY.
  `;

  const styleSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "A creative, evocative name for this style" },
      strokeWidth: { type: Type.STRING, enum: ['thin', 'medium', 'thick', 'variable'] },
      cornerRoundness: { type: Type.STRING, enum: ['sharp', 'rounded', 'circular'] },
      lineCap: { type: Type.STRING, enum: ['butt', 'round', 'square'] },
      fillType: { type: Type.STRING, enum: ['outline', 'solid', 'duotone'] },
      vibeKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
      complexity: { type: Type.NUMBER, description: "1 is ultra-minimal, 10 is highly illustrative" },
      colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
      description: { type: Type.STRING, description: "Detailed design brief." },
      isPixelArt: { type: Type.BOOLEAN }
    },
    required: ["name", "strokeWidth", "vibeKeywords", "description", "colorPalette", "isPixelArt"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: analysisPrompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: styleSchema,
        systemInstruction: "You are an expert graphic designer. You seek unique, character-rich aesthetics.",
      }
    });

    if (!response.text) throw new Error("No response from AI");
    
    return JSON.parse(response.text) as StyleDNA;

  } catch (error) {
    console.error("Analysis failed", error);
    return {
      name: "Fallback Style",
      strokeWidth: "medium",
      cornerRoundness: "rounded",
      lineCap: "round",
      fillType: "outline",
      vibeKeywords: ["generic", "simple"],
      complexity: 5,
      colorPalette: ["#000000"],
      description: "Could not analyze style. Using defaults.",
      isPixelArt: false
    };
  }
};

export const generateIconBatch = async (
  style: StyleDNA, 
  iconNames: string[],
  referenceIcons: GeneratedIcon[] = [],
  userPrompt?: string
): Promise<GeneratedIcon[]> => {
  const ai = getAiClient();

  // Prepare the list of icons with functional definitions to guide the AI
  const iconDefinitions = iconNames.map(name => {
    // Robust check for archetypes in case of renamed files (e.g. "prefix-home" matches "home")
    const lowerName = name.toLowerCase();
    const archetypeKey = Object.keys(ICON_ARCHETYPES).find(k => lowerName.includes(k));
    const def = archetypeKey ? ICON_ARCHETYPES[archetypeKey] : "Standard functional representation of this concept.";
    return `- "${name}": ${def}`;
  }).join("\n");

  let referencePrompt = "";
  if (referenceIcons.length > 0) {
    referencePrompt = `
      ### 🧬 EVOLUTIONARY DATA (CRITICAL):
      The user has curated the following icons as the "Golden Standard" for this pack.
      You MUST reverse-engineer their specific visual traits and apply them to the new icons.
      
      **ANALYSIS OF USER SELECTION:**
      1. Look at the corners. Are they sharp or rounded in the SVG code?
      2. Look at the stroke-width. Is it consistent?
      3. Look at the end-caps.
      
      **YOUR GOAL:**
      The new icons MUST look like they were drawn by the EXACT SAME hand as the Reference Icons below.
      If the Reference Icons contradict the "Style DNA", OBEY THE REFERENCE ICONS.
      
      ### REFERENCE CODE SNIPPETS:
      ${referenceIcons.slice(0, 5).map(i => `
      --- ICON: ${i.name} ---
      ${i.svgContent}
      `).join("\n")}
    `;
  }
  
  if (userPrompt) {
      referencePrompt += `
      ### USER MUTATION DIRECTIVE (HIGHEST PRIORITY):
      "${userPrompt}"
      (Adjust the style parameters to satisfy this request immediately.)
      `;
  }

  const detailInstruction = style.complexity > 6 
    ? "HIGH COMPLEXITY: Add depth, hatching, secondary accent strokes, or intricate joints. Avoid over-simplification." 
    : "MINIMALIST OPTIMIZATION: Use the fewest anchor points possible. Focus on perfect optical balance and negative space.";

  // Dynamic Temperature Logic:
  // Higher complexity (> 7) uses lower temperature (0.9) for precision.
  // Lower complexity uses higher temperature (1.2) for creative/novel silhouettes.
  const dynamicTemperature = style.complexity > 7 ? 0.9 : 1.2;

  const prompt = `
    ROLE: You are an elite SVG Iconographer. You are world-renowned for creating icons that have "personality" and "soul".
    
    TASK: Generate raw SVG paths for the following list.
    
    ### FUNCTIONAL REQUIREMENTS (ARCHETYPES):
    ${iconDefinitions}
    (Adhere to the core metaphor, but stylistic execution must be unique.)

    ### STYLE DNA (THE "VIBE"):
    - **Theme**: ${style.name}
    - **Visual Rules**: ${style.description}
    - **Stroke**: ${style.strokeWidth} weight, ${style.lineCap} caps.
    - **Corners**: ${style.cornerRoundness}.
    - **Vibe Keywords**: ${style.vibeKeywords.join(", ")}. (INJECT THESE TRAITS INTO THE SILHOUETTE).
    - **Mode**: ${style.isPixelArt ? "PIXEL ART" : "VECTOR"}.
    - **Detail Level**: ${detailInstruction}

    ### ${style.isPixelArt ? "PIXEL ART RULES" : "VECTOR RULES"}:
    ${style.isPixelArt ? `
      - GRID: 24x24 pixel grid. Snapped strictly to integer coordinates.
      - CONSTRUCTION: Use multiple <rect> elements or a single <path> that traces the pixel edges.
      - DITHERING STRATEGY (Complexity ${style.complexity}/10):
        ${style.complexity >= 6 
          ? "- MANDATORY: Use 50% dithering (checkerboard pattern) for shadows and transitions. Use alternating distinct colored pixels." 
          : "- SIMPLE: Solid flat colors. Clean lines. No noise."}
      - RESTRICTION: No anti-aliasing (blur). Edges must be crisp.
    ` : `
      - GRID: 24x24 viewbox.
      - TECHNIQUE: Use compound paths. **Avoid primitive <rect> or <circle> tags unless highly stylized.** Use <path> to control every curve.
      - SILHOUETTE: Focus on the outer shape. It must be distinct.
      - NEGATIVE SPACE: Use boolean operations conceptually to create interesting voids.
    `}

    ### COLOR INSTRUCTIONS:
    ${style.colorPalette.length > 0 ? 
      `Palette: ${style.colorPalette.join(", ")}. 
       Usage: ${style.fillType === 'duotone' ? 'Primary structure in first color, accents/fills in secondary colors.' : 'Use color creatively to enhance the shape. If solid, use multiple shades if palette allows.'}` 
      : "Use 'currentColor'."}

    ### SOPHISTICATED DESIGN STRATEGIES:
    1. **Avoid Tropes**: Do not just place a symbol inside a circle or square. The icon *is* the shape.
    2. **Vibe Integration**: If the vibe is "Organic", avoid straight lines. If "Cyber", use 45-degree cuts. If "Sketchy", use overshoots.
    3. **Asymmetry**: Perfect symmetry is boring. Add a small "quirk" (a dot, a cut, an offset) to make it look bespoke.
    4. **Line Weight**: If variable width is requested, taper the lines at ends to mimic ink or light.

    ${referencePrompt}

    OUTPUT: JSON Object. Keys = icon names. Values = Inner SVG string (paths only).
  `;

  const batchSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      icons: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            svgContent: { type: Type.STRING, description: "Inner SVG elements (<path>, <g>, etc). NO <svg> wrapper." }
          }
        }
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: batchSchema,
        thinkingConfig: { thinkingBudget: 2048 },
        temperature: dynamicTemperature,
        systemInstruction: "You are an avant-garde iconographer. Your goal is to kill generic design. You prioritize unique, readable silhouettes that convey meaning through distinct, stylized forms rather than literal representations. Every path must be intentional."
      }
    });

    if (!response.text) throw new Error("No SVG generated");
    
    const data = JSON.parse(response.text);
    return data.icons.map((icon: any) => ({
      name: icon.name,
      svgContent: icon.svgContent,
      status: 'completed',
      liked: false
    }));

  } catch (error) {
    console.error("Generation failed", error);
    return iconNames.map(name => ({
      name,
      svgContent: "",
      status: 'failed',
      liked: false
    }));
  }
};