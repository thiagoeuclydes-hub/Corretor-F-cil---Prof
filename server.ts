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

    // Prepare the prompt with high-precision visual reasoning and chain-of-thought
    const prompt = `
      Você é um sistema de visão computacional de elite especializado em análise de documentos educacionais (OMR e OCR).
      Sua tarefa é analisar a folha de respostas anexada e extrair as marcações do aluno com 100% de precisão.

      ESTRUTURA DA PROVA (GABARITO OFICIAL):
      ${JSON.stringify(gabarito.questions, null, 2)}

      PROTOCOLO DE ANÁLISE RIGOROSO:
      1. MAPEAMENTO GEOMÉTRICO: Localize os 4 quadrados pretos nos cantos (âncoras). Use-os para alinhar a perspectiva e compensar qualquer inclinação da foto.
      2. IDENTIFICAÇÃO DE QUESTÕES: Localize cada questão com base na sua posição relativa na folha.
      3. ANÁLISE DE MARCAÇÃO (OMR):
         - Para cada questão de múltipla escolha (MC), verifique os círculos A, B, C, D, E.
         - Identifique qual círculo foi preenchido, marcado com um 'X' ou circulado de forma inequívoca.
         - Se houver rasura ou marcação dupla, identifique a intenção mais clara ou a marcação mais forte.
      4. RECONHECIMENTO DE TEXTO (OCR):
         - Para questões abertas (OPEN), leia as letras manuscritas dentro dos boxes de grade na parte inferior.
         - O aluno escreve uma letra por caixa. Junte-as para formar a palavra.
         - Compare com o 'correctText' do gabarito. Aceite variações de caligrafia se a palavra for a mesma.

      SAÍDA OBRIGATÓRIA (APENAS JSON):
      Retorne exclusivamente um objeto JSON seguindo este formato:
      {
        "reasoning": "Descreva brevemente o que você observou na folha para garantir a precisão da leitura",
        "studentAnswers": {
          "ID_DA_QUESTAO": { "value": "RESPOSTA", "x": POSICAO_X_PERCENTUAL, "y": POSICAO_Y_PERCENTUAL }
        },
        "score": TOTAL_DE_ACERTOS,
        "total": TOTAL_DE_QUESTOES,
        "percentage": PERCENTAGEM
      }

      IMPORTANTE: 'x' e 'y' devem ser números de 0 a 100 representando a posição aproximada do centro da marcação do aluno na imagem.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: image.includes(",") ? image.split(",")[1] : image, 
                mimeType: "image/jpeg",
              },
            },
          ],
        },
      ],
    });

    if (!response.text) {
      throw new Error("A IA não conseguiu gerar uma resposta para esta imagem. Tente aproximar mais a câmera.");
    }

    const text = response.text;
    
    // Clean JSON from markdown if present
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Gemini non-JSON response:", text);
      throw new Error("A IA retornou um formato inválido. Tente novamente.");
    }
    
    try {
      const analysisResult = JSON.parse(jsonMatch[0]);
      res.json(analysisResult);
    } catch (parseError) {
      console.error("JSON parse error:", text);
      throw new Error("Erro ao interpretar a correção da IA.");
    }

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
