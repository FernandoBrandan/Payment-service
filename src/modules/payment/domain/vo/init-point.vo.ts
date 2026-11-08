// src/domain/vo/init-point.vo.ts
import { InvalidInitPointError } from '../errors/vo.errors';

export class InitPoint {
  private constructor(public readonly url: string) {
    InitPoint.validate(url);
  }

  static from(url: string): InitPoint {
    const normalizedUrl = url.trim();
    InitPoint.validate(normalizedUrl);
    return new InitPoint(normalizedUrl);
  }

  static validate(url: string): void {
    if (!url || url.trim().length === 0) throw new InvalidInitPointError('la url es requerida');

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new InvalidInitPointError(`url inválida "${url}"`);
    }
    if (parsed.protocol !== 'https:') throw new InvalidInitPointError('la url debe usar https');
  }

  equals(other: InitPoint): boolean {
    return this.url === other.url;
  }

  toString(): string {
    return this.url;
  }
}
