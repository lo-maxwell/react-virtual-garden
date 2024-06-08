import Link from "@/node_modules/next/link";

export default function Header () {
	const button_layout = `bg-gray-100 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`

	return (
		<header className="bg-blue-200 ">
			<h3 className="text-4xl px-8 pt-4 text-black">This is the header!</h3>
		  <nav>
			{
				<div className="flex px-8 py-4">
					<div className="flex-1">
						<Link href="/" className={button_layout}>Home</Link>
					</div>
					<div className="flex-1">
						<Link href="/garden" className={button_layout}>Garden</Link>
					</div>
					<div className="flex-1">
						<Link href="/store" className={button_layout}>Store</Link>
					</div>
					<div className="flex-1">
						<Link href="/user" className={button_layout}>User</Link>
					</div>
					<div className="flex-1">
						<Link href="/login" className={button_layout}>Login</Link>
					</div>
				</div>
			}
		  </nav>
		</header>
	  );
}