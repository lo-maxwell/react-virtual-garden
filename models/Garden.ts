import { PlacedItem } from "./items/placedItems/PlacedItem";
import { generateNewPlaceholderPlacedItem} from "./items/PlaceholderItems";
import { Plot } from "./Plot";

export class Garden {
	private userId: string;
	private plots: Plot[][];
	private plotPositions: Map<Plot, [number, number]>;
	
	static getStartingRows() {return 10;}
	static getStartingCols() {return 10;}

	constructor(userId: string = "Dummy User", rows: number = Garden.getStartingRows(), cols: number = Garden.getStartingCols(), plots: Plot[][] | null = null) {
		this.userId = userId;
		this.plotPositions = new Map();
		if (plots) {
			this.plots = plots;
		} else {
			this.plots = Garden.generateEmptyPlots(rows, cols);
		}
		this.updatePlotPositions();
	}

	/**
	 * @returns the userId of the owner of the garden.
	 */
	 getUserId(): string {
		return this.userId;
	}

	/**
	 * @returns the number of rows.
	 */
	 getRows(): number {
		return this.plots.length;
	}

	/**
	 * @returns the number of columns.
	 */
	 getCols(): number {
		return this.plots[0].length;
	}

	/**
	 * @returns a deep copy of the plots in the garden.
	 */
	getPlots(): Plot[][] {
		return this.plots.map(innerArray => innerArray.map(plot => plot.clone()));
	}

	/**
     * Creates a 2D array of Empty Plots.
     * @param rows - number of rows 
	 * @param cols - number of columns
     * @returns Plot[][] with rows rows and cols columns, each containing an instance of Plot
     */
	static generateEmptyPlots(rows: number, cols: number): Plot[][] {
		const generateEmptyRow = (_: any, rowIndex: number) => {return Array(cols).fill(null).map((_, colIndex) => this.generateEmptyPlot(colIndex, rowIndex));}
		const gardenPlots = Array(rows).fill(null).map((_, rowIndex) => generateEmptyRow(_, rowIndex));
		return gardenPlots;
	}

	/**
     * Creates a single empty plot (containing ground)
     * @param rowIndex - column index
	 * @param colIndex - row index
     * @returns new Plot()
     */
	static generateEmptyPlot(rowIndex: number, colIndex: number): Plot {
		const ground = generateNewPlaceholderPlacedItem("ground", "empty");
		const newPlot = new Plot(ground);
		return newPlot;
	}

	/**
 	 * Adds an additional row to the garden.
	 */
	addRow(): void {
		this.setGardenSize(this.getRows() + 1, this.getCols());
	}

	/**
 	 * Adds an additional column to the garden.
	 */
	addColumn(): void {
		this.setGardenSize(this.getRows(), this.getCols() + 1);
	}

	/**
 	 * Sets the garden size. Fills empty slots with Empty Plots, and deletes slots that are out of bounds.
	 * @rows - new number of rows
	 * @cols - new number of columns
	 */
	setGardenSize(rows: number, cols: number): void {
		const newPlots = Array.from({ length: rows }, (_, rowIndex) =>
			Array.from({ length: cols }, (_, colIndex) =>
				this.plots[rowIndex]?.[colIndex] || Garden.generateEmptyPlot(rowIndex, colIndex)
			)
		);
		this.plots = newPlots;
		this.fillNullWithEmptyPlot();
	}

	/**
	 * Replaces all undefined slots in plots with Empty Plots.
	 */
	fillNullWithEmptyPlot(): void {
		for (let rowIndex = 0; rowIndex < this.getRows(); rowIndex++) {
			for (let colIndex = 0; colIndex < this.getCols(); colIndex++) {
				if (this.plots[rowIndex][colIndex] === undefined) {
					this.plots[rowIndex][colIndex] = Garden.generateEmptyPlot(rowIndex, colIndex);
				}
			}
		}
		this.updatePlotPositions();
	}

	/**
	 * Updates the position lookup for each plot.
	 */
	private updatePlotPositions(): void {
		this.plots.forEach((row, rowIndex) => {
			row.forEach((plot, colIndex) => {
				this.plotPositions.set(plot, [rowIndex, colIndex]);
			});
		});
	}

	/**
	 * Swaps the locations of two plots.
	 */
	 swapPlots(data1: Plot | [number, number], data2: Plot | [number, number]): void {
		if (Array.isArray(data1) && data1.length === 2  && Array.isArray(data2) && data2.length === 2) {
			const row1 = data1[0];
			const col1 = data1[1];
			const row2 = data2[0];
			const col2 = data2[1];
			if (this.isValidIndex(row1, col1) && this.isValidIndex(row2, col2)) {
				const plot1 = this.plots[row1][col1];
				const plot2 = this.plots[row2][col2];

				// Swap plots in the 2D array
				[this.plots[row1][col1], this.plots[row2][col2]] = [this.plots[row2][col2], this.plots[row1][col1]];
	
				// Update positions in the map
				const pos1 = this.plotPositions.get(plot1);
				const pos2 = this.plotPositions.get(plot2);
				if (pos1 && pos2) {
					this.plotPositions.set(plot1, [row2, col2]);
					this.plotPositions.set(plot2, [row1, col1]);
				}
				
			}
		} else if (data1 instanceof Plot && data2 instanceof Plot) {

			const pos1 = this.plotPositions.get(data1);
			const pos2 = this.plotPositions.get(data2);
	
			if (pos1 && pos2) {
				const [row1, col1] = pos1;
				const [row2, col2] = pos2;
	
				// Swap in the 2D array
				[this.plots[row1][col1], this.plots[row2][col2]] = [this.plots[row2][col2], this.plots[row1][col1]];
	
				// Update positions in the map
				this.plotPositions.set(data1, [row2, col2]);
				this.plotPositions.set(data2, [row1, col1]);
			}
		} else {
			//TODO: Console log failure or throw exception?
			return;
		}
	}

	/**
	 * Checks if the given row and column indexes are valid.
	 */
	private isValidIndex(row: number, col: number): boolean {
		return row >= 0 && row < this.plots.length && col >= 0 && col < this.plots[row].length;
	}

	/**
	 * Changes the item in a plot in this garden
	 * @param rowIndex - column index
	 * @param colIndex - row index
	 * @param item - the replacement PlacedItem
	 * @returns the plot changed
	 */
	setPlotItem(rowIndex: number, colIndex: number, item: PlacedItem): Plot {
		this.plots[rowIndex][colIndex].item = item;
		//TODO: setItem function in plot
		return this.plots[rowIndex][colIndex];
	}

	/**
	 * Gets the position of a plot.
	 */
	 getPlotPosition(plot: Plot): [number, number] | null {
		const position = this.plotPositions.get(plot);
		if (position) {
			return position;
		}
		return null;
	}

	/**
	 * Looks up a plot by its row and column.
	 */
	getPlotByRowAndColumn(row: number, col: number): Plot | undefined {
		if (row >= 0 && row < this.plots.length && col >= 0 && col < this.plots[row].length) {
			return this.plots[row][col];
		}
		return undefined;
	}

	/**
     * Get the number of plots in the garden.
     * @returns The number of plots in the garden.
     */
	size(): number {
		return this.getRows() * this.getCols();
	}

}