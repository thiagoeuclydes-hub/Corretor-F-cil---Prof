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

    // Prepare the prompt with high-precision visual reasoning
    const prompt = `
      Você é um sistema especialista em análise visual de documentos educacionais (OMR e OCR).
      Sua missão é extrair com 100% de precisão as respostas marcadas pelo aluno nesta folha de respostas.
      
      GABARITO OFICIAL (PARA REFERÊNCIA DE IDs):
      ${JSON.stringify(gabarito.questions, null, 2)}
      
      PASSO A PASSO DA ANÁLISE:
      1. ORIENTAÇÃO: Localize os 4 quadrados pretos nos cantos da folha. Use-os para alinhar sua perspectiva.
      2. IDENTIFICAÇÃO: Localize o QR Code à esquerda para confirmar a estrutura da prova.
      3. PROCESSAMENTO OMR (Múltipla Escolha):
         - Procure pelas questões numeradas dispostas em colunas.
         - Cada questão possui círculos de A a E.
         - Identifique qual círculo foi PREENCHIDO, marcado com um 'X' ou circulado. 
         - Se houver rasura (duas marcações), marque como vazio ou a marcação mais forte.
      4. PROCESSAMENTO OCR (Questões Abertas):
         - Localize as caixas de grade na parte inferior.
         - Realize o reconhecimento de caracteres (OCR) das letras escritas à mão (letras de fôrma maiúsculas).
         - Extraia a palavra ou frase completa.
      
      COMPARAÇÃO E PONTUAÇÃO:
      - Compare cada resposta extraída com o 'correctAnswer' (para MC) ou 'correctText' (para OPEN).
      - Para questões abertas, pequenas variações de caligrafia que mantenham o sentido da palavra do gabarito devem ser consideradas corretas.
      
      SAÍDA OBRIGATÓRIA (APENAS JSON):
      Retorne exclusivamente um objeto JSON seguindo este formato rigoroso:
      {
        "studentAnswers": {
          "ID_DA_QUESTAO": "RESPOSTA_LIDA_DO_ALUNO"
        },
        "score": TOTAL_DE_ACERTOS,
        "total": TOTAL_DE_QUESTOES,
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
