import React, { useState, useMemo } from 'react';
import { Schema, Table, Column, ColumnType, DBType } from '../types';
import { generateSql, generateId } from '../utils';
import { Plus, Trash2, Database, Code, LayoutGrid, Key, Link as LinkIcon, Fingerprint, Type as TypeIcon, Hash } from 'lucide-react';

interface EditorViewProps {
  schema: Schema;
  setSchema: React.Dispatch<React.SetStateAction<Schema>>;
}

const EditorView: React.FC<EditorViewProps> = ({ schema, setSchema }) => {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(schema.tables[0]?.id || null);
  const [dbType, setDbType] = useState<DBType>(DBType.POSTGRES);

  const selectedTable = useMemo(() => 
    schema.tables.find(t => t.id === selectedTableId), 
    [schema.tables, selectedTableId]
  );

  const sqlCode = useMemo(() => generateSql(schema, dbType), [schema, dbType]);

  const updateTable = (id: string, updates: Partial<Table>) => {
    setSchema(prev => ({
      ...prev,
      tables: prev.tables.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const addTable = () => {
    const newTable: Table = {
      id: generateId(),
      name: 'new_table',
      columns: [
        { id: generateId(), name: 'id', type: ColumnType.INTEGER, isPk: true, isFk: false, isNullable: false, isUnique: true }
      ],
      position: { x: 100, y: 100 }
    };
    setSchema(prev => ({ ...prev, tables: [...prev.tables, newTable] }));
    setSelectedTableId(newTable.id);
  };

  const deleteTable = (id: string) => {
    setSchema(prev => ({
      tables: prev.tables.filter(t => t.id !== id),
      relationships: prev.relationships.filter(r => r.fromTableId !== id && r.toTableId !== id)
    }));
    if (selectedTableId === id) setSelectedTableId(null);
  };

  const updateColumn = (tableId: string, colId: string, updates: Partial<Column>) => {
    setSchema(prev => ({
      ...prev,
      tables: prev.tables.map(t => {
        if (t.id !== tableId) return t;
        return {
          ...t,
          columns: t.columns.map(c => c.id === colId ? { ...c, ...updates } : c)
        };
      })
    }));
  };

  const addColumn = (tableId: string) => {
    const newCol: Column = {
      id: generateId(),
      name: 'new_column',
      type: ColumnType.VARCHAR,
      isPk: false,
      isFk: false,
      isNullable: true,
      isUnique: false
    };
    setSchema(prev => ({
      ...prev,
      tables: prev.tables.map(t => t.id === tableId ? { ...t, columns: [...t.columns, newCol] } : t)
    }));
  };

  const deleteColumn = (tableId: string, colId: string) => {
    setSchema(prev => ({
      ...prev,
      tables: prev.tables.map(t => t.id === tableId ? { ...t, columns: t.columns.filter(c => c.id !== colId) } : t)
    }));
  };

  return (
    <div className="flex h-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* LEFT SIDEBAR: TABLES */}
      <div className="w-64 border-r border-zinc-800 flex flex-col bg-zinc-900/50">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
          <span className="font-semibold text-zinc-300 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" /> Tables
          </span>
          <button onClick={addTable} className="p-1 hover:bg-zinc-800 rounded text-blue-400 transition-colors">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {schema.tables.map(table => (
            <div 
              key={table.id}
              onClick={() => setSelectedTableId(table.id)}
              className={`
                group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all
                ${selectedTableId === table.id ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}
              `}
            >
              <div className="flex items-center gap-2 truncate">
                <Database className="w-4 h-4 opacity-50" />
                <span className="truncate font-medium">{table.name}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteTable(table.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER: COLUMN EDITOR */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">
        {selectedTable ? (
          <>
            <div className="h-16 border-b border-zinc-800 flex items-center px-6 gap-4 bg-zinc-900/30">
               <Database className="w-5 h-5 text-blue-500" />
               <input 
                 className="bg-transparent text-xl font-bold text-white focus:outline-none border-b border-transparent focus:border-blue-500 px-1 py-0.5"
                 value={selectedTable.name}
                 onChange={(e) => updateTable(selectedTable.id, { name: e.target.value })}
               />
               <span className="text-zinc-500 text-sm ml-auto">{selectedTable.columns.length} columns</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-950/50 text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800">
                      <th className="p-3 pl-4 font-medium w-8"></th>
                      <th className="p-3 font-medium">Column Name</th>
                      <th className="p-3 font-medium">Type</th>
                      <th className="p-3 font-medium text-center w-12" title="Primary Key">PK</th>
                      <th className="p-3 font-medium text-center w-12" title="Foreign Key">FK</th>
                      <th className="p-3 font-medium text-center w-12" title="Unique">UQ</th>
                      <th className="p-3 font-medium text-center w-12" title="Not Null">NN</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {selectedTable.columns.map(col => (
                      <tr key={col.id} className="group hover:bg-zinc-800/30 transition-colors">
                        <td className="p-3 pl-4 text-zinc-600">
                           <Hash className="w-4 h-4" />
                        </td>
                        <td className="p-3">
                          <input 
                            className="w-full bg-transparent text-zinc-200 focus:outline-none font-medium placeholder-zinc-600"
                            value={col.name}
                            onChange={(e) => updateColumn(selectedTable.id, col.id, { name: e.target.value })}
                            placeholder="col_name"
                          />
                        </td>
                        <td className="p-3">
                           <div className="relative">
                              <select 
                                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-300 focus:border-blue-500 focus:outline-none appearance-none cursor-pointer"
                                value={col.type}
                                onChange={(e) => updateColumn(selectedTable.id, col.id, { type: e.target.value })}
                              >
                                {Object.values(ColumnType).map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                              {/* Custom arrow could go here */}
                           </div>
                        </td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => updateColumn(selectedTable.id, col.id, { isPk: !col.isPk })}
                            className={`p-1.5 rounded transition-colors ${col.isPk ? 'bg-yellow-500/20 text-yellow-500' : 'text-zinc-700 hover:text-zinc-400'}`}
                          >
                            <Key className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <button 
                             onClick={() => updateColumn(selectedTable.id, col.id, { isFk: !col.isFk })}
                             className={`p-1.5 rounded transition-colors ${col.isFk ? 'bg-purple-500/20 text-purple-500' : 'text-zinc-700 hover:text-zinc-400'}`}
                          >
                            <LinkIcon className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="p-3 text-center">
                           <button 
                             onClick={() => updateColumn(selectedTable.id, col.id, { isUnique: !col.isUnique })}
                             className={`p-1.5 rounded transition-colors ${col.isUnique ? 'bg-blue-500/20 text-blue-500' : 'text-zinc-700 hover:text-zinc-400'}`}
                          >
                            <Fingerprint className="w-4 h-4" />
                          </button>
                        </td>
                         <td className="p-3 text-center">
                           <button 
                             onClick={() => updateColumn(selectedTable.id, col.id, { isNullable: !col.isNullable })}
                             className={`p-1.5 rounded transition-colors ${!col.isNullable ? 'bg-red-500/20 text-red-500' : 'text-zinc-700 hover:text-zinc-400'}`}
                             title={col.isNullable ? "Currently Nullable" : "Currently Not Null"}
                          >
                             <TypeIcon className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => deleteColumn(selectedTable.id, col.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button 
                  onClick={() => addColumn(selectedTable.id)}
                  className="w-full py-3 text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border-t border-zinc-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Column
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
             <Database className="w-16 h-16 mb-4 opacity-20" />
             <p>Select a table to edit schema</p>
          </div>
        )}
      </div>

      {/* RIGHT: SQL PREVIEW */}
      <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col">
         <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900">
            <div className="flex items-center gap-2 text-zinc-300 font-semibold">
               <Code className="w-4 h-4" /> SQL
            </div>
            <select 
               className="bg-zinc-950 border border-zinc-700 rounded text-xs px-2 py-1 text-zinc-400 focus:outline-none focus:border-blue-500"
               value={dbType}
               onChange={(e) => setDbType(e.target.value as DBType)}
            >
               {Object.values(DBType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
         </div>
         <div className="flex-1 overflow-auto p-4 bg-zinc-950 font-mono text-xs text-blue-100 leading-relaxed custom-scrollbar">
            <pre className="whitespace-pre-wrap">{sqlCode}</pre>
         </div>
         <div className="p-4 border-t border-zinc-800 bg-zinc-900">
            <button 
              onClick={() => navigator.clipboard.writeText(sqlCode)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
            >
               Copy SQL
            </button>
         </div>
      </div>
    </div>
  );
};

export default EditorView;
