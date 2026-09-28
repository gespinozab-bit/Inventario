import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const numeric = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

export class CreateProductDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  sku!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Transform(numeric)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(99999999.99)
  price!: number;

  @Transform(numeric)
  @IsInt()
  @Min(0)
  @Max(1000)
  stock!: number;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  categoryName!: string;
}
