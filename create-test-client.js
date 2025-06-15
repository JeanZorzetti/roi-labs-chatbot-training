// Script para resolver problema de autenticação na API
// Cria um cliente de teste no banco de dados para permitir acesso ao frontend

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔧 Resolvendo problema de autenticação da API...');
console.log(`📍 Supabase URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestClient() {
    try {
        // Gerar uma API key de teste
        const testApiKey = 'test-api-key-' + Date.now();
        
        const { data, error } = await supabase
            .from('clients')
            .insert([
                {
                    name: 'Frontend Test Client',
                    email: 'test@roilabs.com.br',
                    api_key: testApiKey,
                    status: 'active',
                    usage_limit: 1000,
                    usage_count: 0
                }
            ])
            .select();

        if (error) {
            console.error('❌ Erro ao criar cliente de teste:', error);
        } else {
            console.log('✅ Cliente de teste criado com sucesso!');
            console.log('📋 Dados do cliente:');
            console.log(JSON.stringify(data[0], null, 2));
            console.log(`\n🔑 API Key para usar no frontend: ${testApiKey}`);
        }
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

createTestClient();