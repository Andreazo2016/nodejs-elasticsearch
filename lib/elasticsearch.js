const { Client } = require('@elastic/elasticsearch')

const ELASTICSEARCH_URL = 'http://localhost:9200'


const client = new Client({ node: ELASTICSEARCH_URL, auth: {
    apiKey: 'NnExZ181TUJwR0pQX1hqTWRVSVI6amVianVqNUVUaVdLdEYyS3Zmbjdldw=='
} })

client.cluster.health().then((health) => {
    console.log('Elasticsearch cluster health')
})
.catch(ex => {
    console.error('Erro ao conectar ao Elasticsearch:', ex)
})


module.exports = client