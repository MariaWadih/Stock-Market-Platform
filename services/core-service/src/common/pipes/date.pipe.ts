import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class DatePipe implements PipeTransform<string, Date> {
  transform(value: string): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    return date;
  }
}
