import { describe, it, expect } from 'vitest';
import { toNumber, calculateMargin } from '../../src/utils/money';

describe('money utils', () => {
  describe('toNumber', () => {
    it('deve converter número string para number', () => {
      expect(toNumber('10')).toBe(10);
      expect(toNumber('10.5')).toBe(10.5);
    });

    it('deve manter número como number', () => {
      expect(toNumber(25)).toBe(25);
      expect(toNumber(25.75)).toBe(25.75);
    });

    it('deve retornar 0 para null', () => {
      expect(toNumber(null)).toBe(0);
    });

    it('deve retornar 0 para undefined', () => {
      expect(toNumber(undefined)).toBe(0);
    });

    it('deve converter string vazia para 0', () => {
      expect(toNumber('')).toBe(0);
    });
  });

  describe('calculateMargin', () => {
    it('deve calcular margem corretamente', () => {
      expect(calculateMargin(50, 100)).toBe(50);
      expect(calculateMargin(25, 100)).toBe(25);
      expect(calculateMargin(30, 200)).toBe(15);
    });

    it('deve retornar 0 quando revenue for 0', () => {
      expect(calculateMargin(50, 0)).toBe(0);
    });

    it('deve retornar 0 quando revenue for null', () => {
      expect(calculateMargin(50, null)).toBe(0);
    });

    it('deve retornar 0 quando revenue for undefined', () => {
      expect(calculateMargin(50, undefined)).toBe(0);
    });

    it('deve calcular margem negativa quando lucro for negativo', () => {
      expect(calculateMargin(-20, 100)).toBe(-20);
    });
  });
});