import LevelSystem from "@/models/level/LevelSystem";

const LevelSystemComponent = ({level, currentExp, expToLevelUp}: {level: number, currentExp: number, expToLevelUp: number}) => {

	return (
		<div className="bg-gray-300 p-4 rounded-lg shadow-md">
			<div className="text-center mb-2">
				<div className="text-xl font-bold text-purple-500" data-testid="current-level">Level: {level}</div>
			</div>
			<div className="bg-white p-2 rounded-md">
				<div className="text-lg font-medium text-gray-800" data-testid="level-xp">
					XP: <span className="text-purple-500">{currentExp}</span>/{expToLevelUp}
				</div>
				<div className="mt-2 bg-gray-200 h-4 rounded-full overflow-hidden">
					<div
						className="bg-purple-500 h-full"
						style={{ width: `${(currentExp / expToLevelUp) * 100}%` }}
					/>
				</div>
			</div>
		</div>
  );
}

export default LevelSystemComponent;