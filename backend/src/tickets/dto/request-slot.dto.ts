import { IsString, IsNotEmpty } from 'class-validator';

export class RequestSlotDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
