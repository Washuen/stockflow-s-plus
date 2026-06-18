import { describe, it, expect } from 'vitest';
import money from '../../src/utils/money.js';

const { calculateMargin, toNumber } = money;

describe('money utils', () => {
  it('deve converter valores nulos para zero', () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
  });

  it('deve calcular margem corretamente', () => {
    expect(calculateMargin(250, 1000)).toBe(25);
  });

  it('deve retornar margem zero quando receita for zero', () => {
    expect(calculateMargin(100, 0)).toBe(0);
  });
});
