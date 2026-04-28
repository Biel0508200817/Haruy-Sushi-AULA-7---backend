import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import { createClient } from '@supabase/supabase-js';

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 LOG PRA DEBUG
console.log("ENV:", process.env.SUPABASE_URL ? "OK" : "FALTANDO");

// ================= SUPABASE ================= //
let supabase;

try {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    throw new Error("Variáveis do Supabase não definidas");
  }

  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
} catch (err) {
  console.error("Erro Supabase:", err.message);
}

// ================= ROTAS ================= //

app.get('/api/produtos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*');

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("ERRO /produtos:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('API online 🚀');
});

// ================= EXPORT ================= //
export default serverless(app);
