// Controllers central - ROI Labs Chatbot Training
// Arquivo de índice para organizar todos os controllers

const crawlingController = require('./crawlingController');
const searchController = require('./searchController');
const clientController = require('./clientController');

module.exports = {
    // Crawling Controllers
    crawling: {
        startCrawling: crawlingController.startCrawling,
        getCrawlingStatus: crawlingController.getCrawlingStatus,
        getCrawlingHistory: crawlingController.getCrawlingHistory,
        getCrawlingDetails: crawlingController.getCrawlingDetails,
        cancelCrawling: crawlingController.cancelCrawling,
        deleteCrawling: crawlingController.deleteCrawling
    },
    
    // Search Controllers
    search: {
        searchKnowledge: searchController.searchKnowledge,
        getAvailableDomains: searchController.getAvailableDomains,
        getSearchStats: searchController.getSearchStats,
        findSimilarContent: searchController.findSimilarContent,
        searchAutocomplete: searchController.searchAutocomplete
    },
    
    // Client Controllers
    client: {
        createClient: clientController.createClient,
        getClients: clientController.getClients,
        getClient: clientController.getClient,
        updateClient: clientController.updateClient,
        regenerateApiKey: clientController.regenerateApiKey,
        deactivateClient: clientController.deactivateClient,
        activateClient: clientController.activateClient,
        deleteClient: clientController.deleteClient,
        getCurrentClientProfile: clientController.getCurrentClientProfile,
        getDashboardStats: clientController.getDashboardStats
    }
};

// Também exportar individualmente para compatibilidade
module.exports.crawlingController = crawlingController;
module.exports.searchController = searchController;
module.exports.clientController = clientController;