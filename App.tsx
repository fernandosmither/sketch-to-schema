import React, { useState, useEffect } from 'react';
import { Schema, ViewMode } from './types';
import UploadView from './components/UploadView';
import EditorView from './components/EditorView';
import VisualizerView from './components/VisualizerView';
import { Layers, Image, PenTool } from 'lucide-react';

const API_KEY_STORAGE_KEY = 'sketch-to-schema-api-key';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('upload');
  const [schema, setSchema] = useState<Schema>({ tables: [], relationships: [] });
  const [apiKey, setApiKey] = useState<string>(() => {
    // Load API key from localStorage on initial render
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
  });

  // Persist API key to localStorage
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  }, [apiKey]);

  const handleSchemaGenerated = (newSchema: Schema) => {
    setSchema(newSchema);
    setView('editor');
  };

  const isSchemaEmpty = schema.tables.length === 0;

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
           <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
             <Layers className="w-5 h-5 text-white" />
           </div>
           <span className="font-bold text-xl tracking-tight text-zinc-100">Sketch to Schema</span>
        </div>
        
        <nav className="flex items-center gap-1 bg-zinc-900/50 border border-zinc-800/50 p-1.5 rounded-xl backdrop-blur-sm">
          <button
            onClick={() => setView('upload')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${view === 'upload' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }
            `}
          >
            <Image className="w-4 h-4" />
            Upload
          </button>

          <button
            onClick={() => setView('editor')}
            disabled={isSchemaEmpty}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${view === 'editor' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }
              ${isSchemaEmpty ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <PenTool className="w-4 h-4" />
            Editor
          </button>

          <div className="w-px h-6 bg-zinc-800 mx-1" />

          <button
            onClick={() => setView('visualizer')}
            disabled={isSchemaEmpty}
            className={`
              flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${view === 'visualizer' 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/10' 
                : 'text-blue-400 hover:bg-blue-900/20 hover:text-blue-300'
              }
              ${isSchemaEmpty ? 'opacity-50 cursor-not-allowed grayscale' : ''}
            `}
          >
            <Layers className="w-4 h-4" />
            Visualizer
          </button>
        </nav>

        <div className="w-32 flex justify-end">
           {/* Placeholder for future actions like 'Export' or User Profile */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative bg-zinc-950">
        {view === 'upload' && <UploadView onSchemaGenerated={handleSchemaGenerated} apiKey={apiKey} onApiKeyChange={setApiKey} />}
        {view === 'editor' && <EditorView schema={schema} setSchema={setSchema} />}
        {view === 'visualizer' && <VisualizerView schema={schema} setSchema={setSchema} />}
      </main>
    </div>
  );
};

export default App;