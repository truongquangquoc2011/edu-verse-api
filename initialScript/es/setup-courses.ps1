Invoke-RestMethod -Method Put `
  -Uri http://localhost:9200/courses `
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
      "id": { "type": "integer" },

      "title": { "type": "text", "analyzer": "vi_analyzer" },
      "description": { "type": "text", "analyzer": "vi_analyzer" },
      "previewDescription": { "type": "text", "analyzer": "vi_analyzer" },

      "categoryId": { "type": "integer" },
      "categoryName": { "type": "text", "analyzer": "vi_analyzer" },

      "teacherId": { "type": "integer" },
      "teacherName": { "type": "text", "analyzer": "vi_analyzer" },
      "teacherSpecialization": { "type": "text", "analyzer": "vi_analyzer" },

      "status": { "type": "keyword" },
      "isFree": { "type": "boolean" },
      "isFeatured": { "type": "boolean" },
      "isPreorder": { "type": "boolean" },

      "price": { "type": "double" },

      "createdAt": { "type": "date" },
      "updatedAt": { "type": "date" }
    }
  }
}
"@