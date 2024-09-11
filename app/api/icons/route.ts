import { createIcon, getAllIcons } from "@/backend/services/user/icons/iconService";
import { NextResponse } from "@/node_modules/next/server";


export async function GET() {
	try {
	  const result = await getAllIcons();
	  return NextResponse.json(result);
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }
  
  export async function POST(request: Request) {
	try {
	  const { name, icon } = await request.json();
	//   const result = await pool.query('INSERT INTO icons (name, icon) VALUES ($1, $2) RETURNING *', [name, icon]);
	  const result = await createIcon(name, icon);
	  return NextResponse.json(result);
	} catch (error) {
	  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
	}
  }