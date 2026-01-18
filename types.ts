export enum DBType {
  POSTGRES = 'PostgreSQL',
  MYSQL = 'MySQL',
  SQLITE = 'SQLite'
}

export enum ColumnType {
  INTEGER = 'INTEGER',
  SERIAL = 'SERIAL',
  VARCHAR = 'VARCHAR',
  TEXT = 'TEXT',
  BOOLEAN = 'BOOLEAN',
  TIMESTAMP = 'TIMESTAMP',
  DATE = 'DATE',
  FLOAT = 'FLOAT',
  DECIMAL = 'DECIMAL',
  JSON = 'JSON',
  UUID = 'UUID'
}

export interface Column {
  id: string;
  name: string;
  type: string;
  isPk: boolean;
  isFk: boolean;
  isUnique: boolean;
  isNullable: boolean;
}

export interface Table {
  id: string;
  name: string;
  columns: Column[];
  position: { x: number; y: number };
}

export interface Relationship {
  id: string;
  fromTableId: string;
  fromColumnId: string; // The FK column
  toTableId: string;
  toColumnId: string; // The PK column
}

export interface Schema {
  tables: Table[];
  relationships: Relationship[];
}

export type ViewMode = 'upload' | 'editor' | 'visualizer';
