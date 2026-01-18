import React, { useState, useCallback } from 'react';
import { Upload, Loader2, ArrowRight, AlertCircle, Key } from 'lucide-react';
import { analyzeSketch } from '../services/geminiService';
import { layoutTables } from '../utils';
import { Schema, Table, Relationship } from '../types';

const DEMO_IMAGE_URL = "https://i.imgur.com/QxyEYX6.png";

// Hardcoded sample schema data
const SAMPLE_SCHEMA: Schema = {
  tables: [
    {
      id: 'users_table',
      name: 'USERS',
      position: { x: 50, y: 50 },
      columns: [
        { id: 'users_id', name: 'id', type: 'INTEGER', isPk: true, isFk: false, isUnique: true, isNullable: false },
        { id: 'users_username', name: 'username', type: 'VARCHAR', isPk: false, isFk: false, isUnique: true, isNullable: false }
      ]
    },
    {
      id: 'notes_table',
      name: 'NOTES',
      position: { x: 400, y: 50 },
      columns: [
        { id: 'notes_id', name: 'id', type: 'INTEGER', isPk: true, isFk: false, isUnique: true, isNullable: false },
        { id: 'notes_user_id', name: 'user_id', type: 'INTEGER', isPk: false, isFk: true, isUnique: false, isNullable: false },
        { id: 'notes_title', name: 'title', type: 'VARCHAR', isPk: false, isFk: false, isUnique: false, isNullable: false },
        { id: 'notes_content', name: 'content', type: 'TEXT', isPk: false, isFk: false, isUnique: false, isNullable: false },
        { id: 'notes_created_at', name: 'created_at', type: 'TIMESTAMP', isPk: false, isFk: false, isUnique: false, isNullable: false }
      ]
    },
    {
      id: 'note_tags_table',
      name: 'NOTE_TAGS',
      position: { x: 750, y: 50 },
      columns: [
        { id: 'note_tags_note_id', name: 'note_id', type: 'INTEGER', isPk: true, isFk: true, isUnique: false, isNullable: false },
        { id: 'note_tags_tag_id', name: 'tag_id', type: 'INTEGER', isPk: true, isFk: true, isUnique: false, isNullable: false }
      ]
    },
    {
      id: 'tags_table',
      name: 'TAGS',
      position: { x: 1100, y: 50 },
      columns: [
        { id: 'tags_id', name: 'id', type: 'INTEGER', isPk: true, isFk: false, isUnique: true, isNullable: false },
        { id: 'tags_name', name: 'name', type: 'VARCHAR', isPk: false, isFk: false, isUnique: true, isNullable: false }
      ]
    }
  ],
  relationships: [
    {
      id: 'rel_notes_users',
      fromTableId: 'notes_table',
      fromColumnId: 'notes_user_id',
      toTableId: 'users_table',
      toColumnId: 'users_id'
    },
    {
      id: 'rel_note_tags_notes',
      fromTableId: 'note_tags_table',
      fromColumnId: 'note_tags_note_id',
      toTableId: 'notes_table',
      toColumnId: 'notes_id'
    },
    {
      id: 'rel_note_tags_tags',
      fromTableId: 'note_tags_table',
      fromColumnId: 'note_tags_tag_id',
      toTableId: 'tags_table',
      toColumnId: 'tags_id'
    }
  ]
};

interface UploadViewProps {
  onSchemaGenerated: (schema: Schema) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

const UploadView: React.FC<UploadViewProps> = ({ onSchemaGenerated, apiKey, onApiKeyChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasApiKey = apiKey.trim().length > 0;

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG).');
      return;
    }

    if (!hasApiKey) {
      setError('Please enter your Gemini API key first.');
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try {
        const base64Data = base64.split(',')[1];
        const rawData = await analyzeSketch(base64Data, apiKey);

        const tables: Table[] = layoutTables(rawData.tables || []);
        const relationships: Relationship[] = (rawData.relationships || []).map((rel: any) => {
          const fromTable = tables.find(t => t.name.toLowerCase() === rel.fromTable.toLowerCase());
          const toTable = tables.find(t => t.name.toLowerCase() === rel.toTable.toLowerCase());

          if (!fromTable || !toTable) return null;

          const fromCol = fromTable.columns.find(c => c.name.toLowerCase() === rel.fromColumn.toLowerCase());
          const toCol = toTable.columns.find(c => c.name.toLowerCase() === rel.toColumn.toLowerCase());

          if (!fromCol || !toCol) return null;

          return {
            id: Math.random().toString(36).substr(2, 9),
            fromTableId: fromTable.id,
            fromColumnId: fromCol.id,
            toTableId: toTable.id,
            toColumnId: toCol.id
          };
        }).filter(Boolean) as Relationship[];

        onSchemaGenerated({ tables, relationships });
      } catch (err) {
        console.error(err);
        setError('Failed to analyze the image. Please check your API key and try again.');
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  }, [onSchemaGenerated, apiKey, hasApiKey]);

  const handleUseSample = async () => {
    setError(null);
    setIsAnalyzing(true);

    // Fake 3-second delay for sample
    await new Promise(resolve => setTimeout(resolve, 3000));

    onSchemaGenerated(SAMPLE_SCHEMA);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!hasApiKey) {
      setError('Please enter your Gemini API key first.');
      return;
    }
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile, hasApiKey]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasApiKey) {
      setError('Please enter your Gemini API key first.');
      return;
    }
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-950 text-zinc-100 animate-in fade-in duration-500">
        <Loader2 className="w-16 h-16 animate-spin text-blue-500 mb-6" />
        <h2 className="text-2xl font-semibold mb-2">Analyzing Sketch...</h2>
        <p className="text-zinc-400">Processing your database schema.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-zinc-950 p-6 overflow-y-auto">
      <div className="max-w-3xl w-full text-center space-y-12">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            Sketch to Schema
          </h1>
          <p className="text-xl text-zinc-400">
            Turn whiteboard sketches into production SQL instantly.
          </p>
        </div>

        {/* API Key Input */}
        <div className="space-y-3 max-w-md mx-auto">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Key className="w-4 h-4" />
            <span>Gemini API Key</span>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              (Get one free)
            </a>
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="Enter your Gemini API key..."
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          />
          {hasApiKey && (
            <p className="text-xs text-green-400">API key set. Your key is stored locally and never sent to our servers.</p>
          )}
        </div>

        {/* Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative group
            border-2 border-dashed rounded-3xl p-16
            transition-all duration-300 ease-in-out
            ${!hasApiKey
              ? 'border-zinc-800 opacity-50 cursor-not-allowed'
              : isDragging
                ? 'border-blue-500 bg-blue-500/10 scale-[1.02] cursor-pointer'
                : 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/50 cursor-pointer'
            }
          `}
        >
          <input
            type="file"
            className={`absolute inset-0 w-full h-full opacity-0 z-10 ${hasApiKey ? 'cursor-pointer' : 'cursor-not-allowed pointer-events-none'}`}
            onChange={handleFileInput}
            accept="image/png, image/jpeg, image/webp"
            disabled={!hasApiKey}
          />
          <div className="flex flex-col items-center gap-6 pointer-events-none">
            <div className={`p-5 rounded-full transition-colors duration-300 ${isDragging ? 'bg-blue-500/20' : 'bg-zinc-900 group-hover:bg-zinc-800'}`}>
              <Upload className={`w-10 h-10 ${isDragging ? 'text-blue-400' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-medium text-zinc-200 group-hover:text-white transition-colors">
                {hasApiKey ? 'Drop your sketch here' : 'Enter API key to upload'}
              </p>
              <p className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">
                Supports JPG, PNG, WEBP
              </p>
            </div>
          </div>
        </div>

        {error && (
            <div className="flex items-center justify-center gap-2 text-red-400 bg-red-950/20 px-4 py-3 rounded-lg border border-red-900/30 animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            </div>
        )}

        {/* Demo Section */}
        <div className="space-y-6">
            <div className="flex items-center justify-center gap-4 text-zinc-600">
            <div className="h-px bg-zinc-800 w-full max-w-[100px]" />
            <span className="text-xs uppercase tracking-wider font-semibold">Or try this</span>
            <div className="h-px bg-zinc-800 w-full max-w-[100px]" />
            </div>

            <button
            onClick={handleUseSample}
            className="group relative flex items-center gap-5 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/30 hover:bg-zinc-900 hover:shadow-lg hover:shadow-blue-900/10 transition-all text-left w-full max-w-md mx-auto overflow-hidden"
            >
            <div className="w-20 h-16 bg-zinc-950 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-800">
                <img src={DEMO_IMAGE_URL} alt="Demo sketch" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-zinc-200 group-hover:text-blue-400 transition-colors truncate">Load Sample Sketch</h3>
                <p className="text-sm text-zinc-500 truncate">Notes app schema (no API key needed)</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-all">
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-blue-400" />
            </div>
            </button>
        </div>
      </div>
    </div>
  );
};

export default UploadView;
