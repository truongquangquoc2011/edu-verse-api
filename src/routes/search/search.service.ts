import { Injectable, Logger } from '@nestjs/common'
import { ElasticsearchService } from '@nestjs/elasticsearch'

export interface SearchResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface SearchOptions {
  index: string
  q?: string
  fields?: string[]
  skip?: number
  take?: number
  filter?: any[]
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name)
  constructor(private readonly es: ElasticsearchService) {}

  async indexDoc(index: string, id: string, document: any) {
    return this.es.index({ index, id, document })
  }

  async deleteDoc(index: string, id: string) {
    return this.es.delete({ index, id })
  }

  async search<T>({
    index,
    q,
    fields,
    skip = 0,
    take = 10,
  }: SearchOptions): Promise<SearchResult<T>> {
    const hasKeyword = q && q.trim().length > 0

    const body: any = {
      from: skip,
      size: take,
    }

    if (hasKeyword) {
      body.query = {
        multi_match: {
          query: q,
          fields: fields && fields.length > 0 ? fields : undefined,
          fuzziness: 'AUTO',
          operator: 'and',
        },
      }
    } else {
      body.query = { match_all: {} }
    }

    const res = await this.es.search<T>({
      index,
      ...body,
    })

    const hits = res.hits.hits ?? []
    const totalVal = typeof res.hits.total === 'number'
      ? res.hits.total
      : res.hits.total?.value ?? 0

    const data = hits.map((h: any) => h._source as T)

    return {
      data,
      pagination: {
        page: Math.floor(skip / take) + 1,
        limit: take,
        total: totalVal,
        totalPages: Math.ceil(totalVal / take),
      },
    }
  }
}
