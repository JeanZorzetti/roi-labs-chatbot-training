// Endpoint de teste simples sem dependências externas
app.get('/api/simple-test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando sem dependências externas',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT
  });
});

// Health check mais robusto
app.get('/api/health-simple', (req, res) => {
  res.status(200).send('OK - Servidor funcionando');
});
