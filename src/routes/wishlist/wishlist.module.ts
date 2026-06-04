import { Module } from '@nestjs/common'
import { WishlistController } from './wishlist.controller'
import { WishlistService } from './wishlist.service'
import { WishlistRepository } from './wishlist.repo'


@Module({
controllers: [WishlistController],
providers: [WishlistService, WishlistRepository],
})
export class WishlistModule {}