
const fontMap: { [key: string]: number[][] } = {
    'A': [[0, 1, 1, 1, 0], [1, 0, 0, 0, 1], [1, 0, 0, 0, 1], [1, 1, 1, 1, 1], [1, 0, 0, 0, 1], [1, 0, 0, 0, 1], [1, 0, 0, 0, 1]],
    ' ': [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]],
};

function getPatternGrid(text: string) {
    const upperText = text.toUpperCase();
    const grid: number[][] = Array(7).fill(0).map(() => []);
    
    for (const char of upperText) {
        const map = fontMap[char] || fontMap[' '];
        for (let row = 0; row < 7; row++) {
            grid[row].push(...(map[row] || [0, 0, 0, 0, 0]));
            grid[row].push(0); // Spacing
        }
    }
    return grid;
}

const grid = getPatternGrid("");
console.log("Grid for empty string length:", grid[0].length);
console.log("Grid for empty string:", JSON.stringify(grid));

const gridA = getPatternGrid("A");
console.log("Grid for 'A' length:", gridA[0].length);
