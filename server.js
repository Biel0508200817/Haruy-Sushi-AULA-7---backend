import express from 'express';
import cors from 'cors';
import serverless from 'serverless-http';
import { createClient } from '@supabase/supabase-js';

const app = express();

// ================= MIDDLEWARE ================= //
app.use(cors());
app.use(express.json());

// ================= DEBUG ================= //
console.log("🚀 Iniciando função...");
console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "OK" : "FALTANDO");
console.log("SUPABASE_KEY:", process.env.SUPABASE_KEY ? "OK" : "FALTANDO");

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
  console.error("❌ Erro ao conectar no Supabase:", err.message);
}

// ================= ROTA TESTE ================= //
app.get('/', (req, res) => {
  res.send('✅ API online na Vercel');
});

// ================= ROTAS ================= //

// LISTAR PRODUTOS
app.get('/api/produtos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select(`
        id,
        nome,
        descricao,
        preco,
        imagem,
        categorias ( id, nome )
      `);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Erro /produtos:", err);
    res.status(500).json({ error: err.message });
  }
});

// LISTAR CATEGORIAS
app.get('/api/categorias', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*');

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Erro /categorias:", err);
    res.status(500).json({ error: err.message });
  }
});

// PRODUTOS POR CATEGORIA
app.get('/api/produtos/categoria/:nomeCategoria', async (req, res) => {
  try {
    const { nomeCategoria } = req.params;

    const { data, error } = await supabase
      .from('produtos')
      .select(`
        id,
        nome,
        descricao,
        preco,
        imagem,
        categorias!inner ( nome )
      `)
      .ilike('categorias.nome', `%${nomeCategoria}%`);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Erro /categoria:", err);
    res.status(500).json({ error: err.message });
  }
});

// CRIAR PRODUTO
app.post('/api/produtos', async (req, res) => {
  try {
    const { nome, preco, categoria_id, descricao, imagem } = req.body;

    if (!nome || preco == null || !categoria_id) {
      return res.status(400).json({
        error: "Nome, preço e categoria_id são obrigatórios."
      });
    }

    const { data, error } = await supabase
      .from('produtos')
      .insert([{ nome, preco, categoria_id, descricao, imagem }])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (err) {
    console.error("Erro POST:", err);
    res.status(500).json({ error: err.message });
  }
});

// ATUALIZAR PRODUTO
app.put('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, preco, categoria_id, descricao, imagem } = req.body;

    const { data, error } = await supabase
      .from('produtos')
      .update({ nome, preco, categoria_id, descricao, imagem })
      .eq('id', id)
      .select();

    if (error) throw error;

    if (!data.length) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    res.json(data[0]);
  } catch (err) {
    console.error("Erro PUT:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETAR PRODUTO
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;

    if (!data.length) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    res.status(204).send();
  } catch (err) {
    console.error("Erro DELETE:", err);
    res.status(500).json({ error: err.message });
  }
});

// ================= EXPORT ================= //
export default serverless(app);
