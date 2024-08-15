const ItemComponent = ({icon, name, quantity, price, priceColor}: {icon: string, name: string, quantity: number, price: number, priceColor: string}) => {
	return (
		<>	
			<span className="flex items-center min-w-[35px] text-center" data-testid="item-qt">
				{quantity}
			</span>
			<div className="flex items-center min-w-0 flex-grow">
				<span className="w-6">{icon}</span>
				{/* Might not display properly if screen size is small or name is too long */}
				<span className="flex items-left ml-2 truncate min-w-0 max-w-[80%]">{name}</span>
			</div>
			<span className="flex min-w-[55px] max-w-[55px]" data-testid="item-cost">
				<span className="mr-1">💰</span> {/* Gold icon */}
				<span className={`${priceColor}`}>{price}</span>
			</span>
		</>
	);
}

export default ItemComponent;