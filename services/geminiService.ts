import { GoogleGenAI, Type } from "@google/genai";

export const analyzeSketch = async (base64Image: string, apiKey: string): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-flash-latest";

  const prompt = `
    Analyze this database sketch. 
    Extract the tables, their columns, probable data types, and relationships.
    If a relationship is drawn, infer the foreign key column in the child table and the primary key in the parent table.
    Return a strictly structured JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Image,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tables: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Name of the table" },
                  columns: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        type: { type: Type.STRING, description: "SQL type like VARCHAR, INTEGER, BOOLEAN, etc." },
                        isPk: { type: Type.BOOLEAN },
                        isFk: { type: Type.BOOLEAN },
                        isUnique: { type: Type.BOOLEAN },
                        isNullable: { type: Type.BOOLEAN },
                      },
                      required: ["name", "type", "isPk", "isFk", "isUnique", "isNullable"],
                    },
                  },
                },
                required: ["name", "columns"],
              },
            },
            relationships: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  fromTable: { type: Type.STRING, description: "Name of the child table (contains FK)" },
                  fromColumn: { type: Type.STRING, description: "Name of the FK column" },
                  toTable: { type: Type.STRING, description: "Name of the parent table (contains PK)" },
                  toColumn: { type: Type.STRING, description: "Name of the PK column" },
                },
                required: ["fromTable", "fromColumn", "toTable", "toColumn"],
              },
            },
          },
          required: ["tables", "relationships"],
        },
      },
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw error;
  }
};