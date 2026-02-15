import { Module, Global } from '@nestjs/common';
import { StarknetService } from './starknet.service';
import { ConfigModule } from '@nestjs/config';

import { EventListenerService } from './event-listener.service';


@Global()
@Module({
    imports: [ConfigModule],
    providers: [StarknetService, EventListenerService],
    exports: [StarknetService],
})
export class BlockchainModule { }
