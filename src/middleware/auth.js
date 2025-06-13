const supabase = require('../config/database');

const authenticateClient = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
        
        if (!apiKey) {
            return res.status(401).json({ error: 'API key obrigatória' });
        }

        const { data: client, error } = await supabase
            .from('clients')
            .select('*')
            .eq('api_key', apiKey)
            .eq('status', 'active')
            .single();

        if (error || !client) {
            return res.status(401).json({ error: 'API key inválida' });
        }

        req.client = client;
        next();
    } catch (error) {
        console.error('Erro na autenticação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

module.exports = { authenticateClient };