import { Module } from '@nestjs/common'
import { ElasticsearchModule } from '@nestjs/elasticsearch'
import { SearchService } from './search.service'
import { envConfig } from 'src/shared/config'

@Module({
  imports: [
    ElasticsearchModule.register({
      node: envConfig.elasticSearch,
    }),
  ],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
