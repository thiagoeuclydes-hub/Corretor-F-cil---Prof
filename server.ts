import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with a larger limit for images
app.use(express.json({ limit: '10mb' }));

// Gemini Initialization
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.post("/api/analyze-exam", async (req, res) => {
  try {
    const { image, gabarito } = req.body;

    if (!image || !gabarito) {
      return res.status(400).json({ error: "Image and gabarito are required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    // Prepare the prompt with handwriting intelligence and layout awareness
    const prompt = `
      Você é um assistente de IA especializado em correção de provas educacionais com OCR e OMR de alta precisão.
      Sua tarefa é analisar a imagem da folha de respostas e extrair os dados.
      
      ESTRUTURA DO GABARITO OFICIAL:
      ${JSON.stringify(gabarito.questions, null, 2)}
      
      REFERÊNCIAS VISUAIS (LAYOUT):
      1. ÂNCORAS: Existem 4 quadrados pretos sólidos nos cantos da folha para orientação. Use-os para alinhar a imagem mentalmente.
      2. QR CODE: Localizado no lado esquerdo, contém o identificador da prova.
      3. QUESTÕES DE MÚLTIPLA ESCOLHA (MC): Estão dispostas em colunas. Cada questão tem círculos com as letras A, B, C, D, E. Identifique qual círculo foi preenchido ou marcado com um X.
      4. QUESTÕES ABERTAS (OPEN): Estão em boxes de grade (tipo planilha) na parte inferior. Realize o OCR das letras manuscritas dentro desses boxes.
      
      CONDIÇÕES DE RECONHECIMENTO:
      - O aluno utiliza letras de fôrma (maiúsculas).
      - Para MC: Considere a letra que tiver o maior nível de preenchimento ou uma marca de X clara.
      - Para OPEN: Compare o texto lido com o 'correctText'. Considere correto se o sentido for idêntico.
      
      RETORNE APENAS UM JSON:
      {
        "studentAnswers": {
          "ID_DA_QUESTAO": "RESPOSTA_LIDA"
        },
        "score": NÚMERO_DE_ACERTOS,
        "total": TOTAL_DE_QUESTÕES,
        "percentage": PERCENTAGEM_DE_ACERTO
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: image.split(",")[1], // Remove the data:image/jpeg;base64, part
                mimeType: "image/jpeg",
              },
            },
          ],
        },
      ],
    });

    const text = response.text || "";
    
    // Clean JSON from markdown if present
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse Gemini response as JSON");
    }
    
    const analysisResult = JSON.parse(jsonMatch[0]);
    res.json(analysisResult);

  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze exam" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
