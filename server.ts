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
      1. ORIENTAÇÃO: Localize os 4 quadrados pretos nos cantos da folha. Eles são fundamentais para compensar qualquer distorção de perspectiva ou inclinação da foto.
      2. IDENTIFICAÇÃO: Ignore o conteúdo do QR Code (ele já foi lido pelo app), foque na estrutura da folha.
      3. PROCESSAMENTO OMR (Múltipla Escolha):
         - Cada questão possui círculos de A a E.
         - Identifique a marcação do aluno. Se houver um 'X' sobre a letra ou o círculo estiver preenchido, essa é a resposta.
         - Seja resiliente a sombras ou reflexos na foto.
      4. PROCESSAMENTO OCR (Questões Abertas):
         - Leia as letras manuscritas nos boxes de grade.
         - O aluno escreve uma letra por caixa. Junte-as para formar a palavra.
         - Se uma letra estiver ambígua (ex: 'O' vs '0'), use o contexto da palavra do gabarito para decidir.
      
      COMPARAÇÃO E PONTUAÇÃO:
      - Compare cada resposta com o gabarito.
      - Para questões abertas, aceite a resposta se a palavra escrita pelo aluno for a mesma do gabarito, mesmo com caligrafia irregular.
      
      SAÍDA OBRIGATÓRIA (APENAS JSON):
      Retorne exclusivamente um objeto JSON seguindo este formato rigoroso:
      {
        "studentAnswers": {
          "ID_DA_QUESTAO": { "value": "RESPOSTA_LIDA", "x": POSICAO_X_PERCENTUAL, "y": POSICAO_Y_PERCENTUAL }
        },
        "score": TOTAL_DE_ACERTOS,
        "total": TOTAL_DE_QUESTOES,
        "percentage": PERCENTAGEM_DE_ACERTO
      }
      
      IMPORTANTE: 'x' e 'y' devem ser números de 0 a 100 representando a posição aproximada do centro do círculo marcado na imagem.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
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
