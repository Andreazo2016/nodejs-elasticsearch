const { randomUUID } = require('crypto')
const elasticsearchCleint = require('./lib/elasticsearch')

class PokemonController {

    constructor() {
        this.POKEMONS_INDEX = 'pokemons'
    }


    async createPokemonIndex(index_name) {
        const exists = await elasticsearchCleint.indices.exists({ index: index_name })
        if (!exists) {
            const settings =  { 
                analysis: {
                    analyzer: {
                    indexing_analyzer: {
                        tokenizer: 'whitespace',
                        filter:  ['lowercase', 'edge_ngram_filter']
                    },
                    search_analyze: {
                            tokenizer: 'whitespace',
                            filter:  'lowercase'
                        }
                    },
                    filter: {
                        'edge_ngram_filter': {
                            type: 'edge_ngram',
                            min_gram: 1,
                            max_gram: 20
                        }
                    }
                }
            }
            await elasticsearchCleint.indices.create({ 
                index: index_name,
                settings: settings,
                mappings: {
                    properties: {
                        pokemon_id: { type: 'keyword' },
                        name: {
                            type: 'text',
                            analyzer: 'indexing_analyzer',
                            search_analyzer: 'search_analyze'
                        },
                        types: { type: 'keyword' },
                        features: { type: 'object' },
                    }
                }
            })
        }
    }


    async insertPokemons(pokemons) {
        await this.createPokemonIndex(this.POKEMONS_INDEX)
        for (const pokemon of pokemons) {
            await elasticsearchCleint.index({
                index: this.POKEMONS_INDEX,
                id: randomUUID(),
                document: {
                    ...pokemon
                }
            })
        }
    }

    async searchAsYouTypePokemonName(query) {
        const result = await elasticsearchCleint.search({
            index: POKEMONS_INDEX,
            body: {
              query: {
                bool: {
                    must: [
                        {
                            multi_match: {
                                query,
                                fields: ['name']
                            }
                        }
                    ]
                }
              },
            },
        })
        return result.hits.hits.map(h => {
            return h._source
        })
    }

    async searchPokemonType(pokemonType) {
        const result = await elasticsearchCleint.search({
            index: POKEMONS_INDEX,
            body: {
              query: {
                match: {
                    types: pokemonType
                }
              },
            },
        })
        return result.hits.hits.map(h => {
            return h._source
        })
    }

    async searchPokemonFeature() {
        const result = await elasticsearchCleint.search({
            index: POKEMONS_INDEX,
            body: {
              query: {
                range: {
                    'features.power': {
                        lte: 50,
                    }
                }
              },
            },
        })
        return result.hits.hits.map(h => {
            return h._source
        })
    }
    
}

module.exports = PokemonController