import { Module, Global } from '@nestjs/common';
import { EntityCodeService } from './entity-code.service';

@Global()
@Module({
    providers: [EntityCodeService],
    exports: [EntityCodeService],
})
export class EntityCodeModule { }
