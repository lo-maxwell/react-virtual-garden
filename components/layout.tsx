import Header from "./header";

export default function Layout ({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex flex-col min-h-screen min-w-screen">
		  <Header />
		  <main className="flex flex-1 w-screen">{children}</main>
		</div>
	  );
}