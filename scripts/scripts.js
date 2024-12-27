const { randomUUID } = require('crypto')
const pokemons = require('../pokemons.json')
const elasticsearchCleint = require('../lib/elasticsearch')

const POKEMONS_INDEX = 'pokemons'

async function deleteIndex(indexName) {
    await elasticsearchCleint.indices.delete({ index: indexName, ignore_unavailable:true })
    console.log('Deletado')
}


async function createIndex(index_name) {
    const exists = await elasticsearchCleint.indices.exists({ index: index_name })
    if (!exists) {
        const settings_2 =  { 
            "analysis": {
                "analyzer": {
                "indexing_analyzer": {
                    "tokenizer": "whitespace",
                    "filter":  ["lowercase", "edge_ngram_filter"]
                },
                "search_analyze": {
                        "tokenizer": "whitespace",
                        "filter":  "lowercase"
                    }
                },
                "filter": {
                    "edge_ngram_filter": {
                        "type": "edge_ngram",
                        "min_gram": 1,
                        "max_gram": 20
                    }
                }
            }
        }
        await elasticsearchCleint.indices.create({ 
            index: index_name,
            settings: settings_2,
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
    console.log(exists ? "existe": "Não existe")
}


async function insertPokemons(pokemons) {
    await createIndex(POKEMONS_INDEX)
    for (const pokemon of pokemons) {
        await elasticsearchCleint.index({
            index: POKEMONS_INDEX,
            id: randomUUID(),
            document: {
                ...pokemon
            }
        })
        console.log('inserido' + JSON.stringify(pokemon))
    }
}


const pokemonsToInsert = pokemons.map(pokemon => {
    return {
        pokemon_id: pokemon.id,
        name: pokemon.name.english,
        types: pokemon.type,
        features: {
            power: pokemon.base.HP,
            attack: pokemon.base['Attack'],
            defense: pokemon.base['Defense'],
            speed: pokemon.base['Speed'],
        }
    }
})




async function search(query) {
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
    console.log(result.hits.hits.map(h => {
        return h._source
    }))
}


async function searchPokemonType(pokemonType) {
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
    console.log(result.hits.hits.map(h => {
        return h._source
    }))
}

async function searchPokemonFeature(pokemonType) {
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
    console.log(result.hits.hits.map(h => {
        return h._source
    }))
}

//insertPokemons(pokemonsToInsert)
//deleteIndex(POKEMONS_INDEX)
searchPokemonFeature()