import { useAccount } from "@/app/hooks/contexts/AccountContext";
import RawIconDisplay from "../user/icon/RawIconDisplay";

const ItemComponent = ({icon, name, quantity, price, priceColor, width}: {icon: string, name: string, quantity: number, price: number, priceColor: string, width: number | null}) => {
	const {account, displayEmojiIcons} = useAccount();
	
	const getWidthString = () => {
		if (width) {
			return `min-w-[${width}px] max-w-[${width}px]`;
		} else {
			return "";
		}
	}
	
	return (
		<div className={'w-full flex flex-row items-center'}>	
			<span className="flex items-center min-w-[35px] text-center" data-testid="item-qt">
				{quantity}
			</span>
			<div className="flex items-center min-w-0 flex-grow">
				<RawIconDisplay icon={icon} width={6} height={6}/>
				{/* Might not display properly if screen size is small or name is too long */}
				<span className="flex items-left ml-2 truncate min-w-0 max-w-[80%]">{name}</span>
			</div>
			<span className={`flex ${getWidthString()}`} data-testid="item-cost">
				<span className="mr-1">💰</span> {/* Gold icon */}
				<span className={`${priceColor}`}>{price}</span>
			</span>
		</div>
	);
}

export default ItemComponent;