import PlotComponent from "@/components/garden/plot";
import { Garden } from "@/models/garden/Garden";
import { Plot } from "@/models/garden/Plot";

export default function GardenComponent({garden}: {garden: Garden}) {
	function generatePlots(plots: Plot[][]) {
		return (
			<>
			{plots.map((row, rowIndex) => (
				<div className="flex overflow-hidden" key={rowIndex}>
					{row.map((plot, colIndex) => {
						const index = rowIndex * plots.length + colIndex;
						return (
							<PlotComponent key={index} text={plot.getItem().itemData.icon}></PlotComponent>
						);
					})}
				</div>
			))}
			</>
		);
	}

	return (
		<>
		{generatePlots(garden.getPlots())}
     	</>
	);
}