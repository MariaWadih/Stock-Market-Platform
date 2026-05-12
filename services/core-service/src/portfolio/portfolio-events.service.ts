import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject, filter, map } from 'rxjs';

export interface PortfolioUpdatedEvent {
  memberId: string;
  totalMarketValue: number;
  occurredAt: string;
}

interface MemberPortfolioEvent extends PortfolioUpdatedEvent {
  event: 'portfolio.updated';
}

@Injectable()
export class PortfolioEventsService {
  private readonly events = new Subject<MemberPortfolioEvent>();

  emitPortfolioUpdated(event: PortfolioUpdatedEvent): void {
    this.events.next({
      event: 'portfolio.updated',
      ...event,
    });
  }

  streamForMember(memberId: string): Observable<MessageEvent> {
    return this.events.asObservable().pipe(
      filter((event) => event.memberId === memberId),
      map((event) => ({
        type: event.event,
        data: {
          totalMarketValue: event.totalMarketValue,
          occurredAt: event.occurredAt,
        },
      })),
    );
  }
}
