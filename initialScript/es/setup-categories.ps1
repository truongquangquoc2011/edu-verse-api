Invoke-RestMethod -Method Put `
  -Uri http://localhost:9200/categories_v1 `
  -ContentType application/json `
  -Body @"
{
  "settings": {
    "analysis": {
      "analyzer": {
        "vi_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "name": { "type": "text", "analyzer": "vi_analyzer" },
      "description": { "type": "text", "analyzer": "vi_analyzer" },
      "createdAt": { "type": "date" },
      "updatedAt": { "type": "date" }
    }
  }
}
"@