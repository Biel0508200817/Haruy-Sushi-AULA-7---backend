require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// ================= ROTAS ================= //

// 1. Listar todos os produtos
app.get('/produtos', async (req, res) => {
    const { data, error } = await supabase
        .from('produtos')
        .select('*');

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// 2. Listar categorias únicas
app.get('/categorias', async (req, res) => {
    const { data, error } = await supabase
        .from('produtos')
        .select('categoria');

    if (error) return res.status(500).json({ error: error.message });

    const categoriasUnicas = [...new Set(data.map(p => p.categoria))];
    res.json(categoriasUnicas);
});

// 3. Buscar produtos por categoria
app.get('/produtos/categoria/:nomeCategoria', async (req, res) => {
    const { nomeCategoria } = req.params;

    const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .ilike('categoria', nomeCategoria);

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
});

// 4. Criar produto
app.post('/produtos', async (req, res) => {
    const { nome, preco, categoria, descricao } = req.body;

    if (!nome || preco == null || !categoria) {
        return res.status(400).json({
            message: "Nome, preço e categoria são obrigatórios."
        });
    }

    // Inserção sem id — assumindo que a coluna id é auto-increment
    const { data, error } = await supabase
        .from('produtos')
        .insert([{ nome, preco, categoria, descricao }])
        .select();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json(data[0]);
});

// 5. Atualizar produto
app.put('/produtos/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, preco, categoria, descricao } = req.body;

    const { data, error } = await supabase
        .from('produtos')
        .update({ nome, preco, categoria, descricao })
        .eq('id', id)
        .select();

    if (error) return res.status(500).json({ error: error.message });
    if (!data.length) return res.status(404).json({ error: "Produto não encontrado." });

    res.json(data[0]);
});

// 6. Deletar produto
app.delete('/produtos/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10); // garante que seja número
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido." });

    const { data, error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });

    if (!data.length) return res.status(404).json({ error: "Produto não encontrado." });

    res.status(204).send();
});

// ================= ERROS ================= //

// 404
app.use((req, res) => {
    res.status(404).json({ error: "Rota não encontrada." });
});

// 500
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Erro interno do servidor." });
});

// ================= SERVIDOR ================= //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

module.exports = app;