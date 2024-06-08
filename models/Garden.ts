import { generateNewPlaceholderPlacedItem, PlaceHolderItems } from "./items/PlaceholderItems";
import { Plot } from "./Plot";

export class Garden {
	userId: string;
	rows: number;
	cols: number;
	plots: Plot[][];
	
	static getStartingRows() {return 10;}
	static getStartingCols() {return 10;}
	static generateEmptyPlots(rows: number, cols: number) {
		const generateEmptyRow = (_: any, rowIndex: number) => {return Array(cols).fill(null).map((_, colIndex) => this.generateEmptyPlot(colIndex, rowIndex));}
		const gardenPlots = Array(rows).fill(null).map((_, rowIndex) => generateEmptyRow(_, rowIndex));
		return gardenPlots;
	}

	constructor(userId: string = "Dummy User", rows: number = Garden.getStartingRows(), cols: number = Garden.getStartingRows(), plots: Plot[][] = Garden.generateEmptyPlots(Garden.getStartingRows(), Garden.getStartingCols())) {
		this.userId = userId;
		this.rows = rows;
		this.cols = cols;
		this.plots = plots;
	}

	static generateEmptyPlot(xPosition: number, yPosition: number) {
		const ground = generateNewPlaceholderPlacedItem("ground", "empty");
		const newPlot = new Plot(ground, xPosition, yPosition);
		return newPlot;
	}

}