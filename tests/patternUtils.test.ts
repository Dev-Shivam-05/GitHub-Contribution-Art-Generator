
import { describe, it, expect } from 'vitest';
import { getPatternGrid } from '../lib/patternUtils';

describe('patternUtils', () => {
    describe('getPatternGrid', () => {
        it('should return empty grid for empty string', () => {
            const grid = getPatternGrid('');
            expect(grid).toHaveLength(7);
            grid.forEach(row => expect(row).toHaveLength(0));
        });

        it('should handle single character "A"', () => {
            const grid = getPatternGrid('A');
            // 'A' is 5 columns + 1 spacing = 6 columns
            expect(grid).toHaveLength(7);
            expect(grid[0]).toHaveLength(6);
            // Verify 'A' pattern roughly (first col is 0,1,1,1,1,1,1... wait, A is:
            // [0,1,1,1,0]
            // [1,0,0,0,1] ...
            // Let's just check length for now.
        });

        it('should handle "RAM"', () => {
            const grid = getPatternGrid('RAM');
            // R (5+1) + A (5+1) + M (5+1) = 6 + 6 + 6 = 18 columns
            expect(grid[0]).toHaveLength(18);
        });

        it('should convert lowercase to uppercase', () => {
            const gridUpper = getPatternGrid('a');
            const gridLower = getPatternGrid('A');
            expect(gridUpper).toEqual(gridLower);
        });

        it('should handle unknown characters as spaces', () => {
            const gridUnknown = getPatternGrid('?');
            const gridSpace = getPatternGrid(' ');
            expect(gridUnknown).toEqual(gridSpace);
            // Space is 5 columns of 0s + 1 spacing = 6 columns of 0s
            expect(gridUnknown[0]).toEqual([0, 0, 0, 0, 0, 0]);
        });

        it('should handle long text', () => {
            const text = "HELLO WORLD";
            const grid = getPatternGrid(text);
            // 11 chars * 6 cols = 66 cols
            expect(grid[0]).toHaveLength(66);
        });
    });
});
