'use client'
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import User from "@/models/user/User";
import { useRouter } from "@/node_modules/next/navigation";
import { makeApiRequest } from "@/utils/api/api";
import Link from "next/link";
import { useEffect } from "react";
import { useGarden } from "./hooks/contexts/GardenContext";
import { useInventory } from "./hooks/contexts/InventoryContext";
import { useStore } from "./hooks/contexts/StoreContext";
import { useUser } from "./hooks/contexts/UserContext";

const HomePage = () => {
  const router = useRouter();
  const {user} = useUser();
  const {store} = useStore();
  const {inventory} = useInventory();
  const { garden } = useGarden();

  useEffect(() => {
    // router.replace('/garden');
  }, [router]);

  async function testAWSLambda () {
    // const data = {
    //   newIcon: "onion"
    // }
    // const apiRoute = `/api/user/${user.getUserId()}/updateIconWithLambda`;
    // const apiRoute = `/api/user/${user.getUserId()}/get`;
    // const result = await makeApiRequest('GET', apiRoute, data, true);
    // console.log('Successfully called lambda function:', result);

    // const data = {
    //   newUsername: "onion farmer"
    // }
    // const apiRoute = `/api/user/${user.getUserId()}/username`;
    // const result = await makeApiRequest('PATCH', apiRoute, data, true);
    // console.log('Successfully called lambda function:', result);

    // const data = {
    //   newIcon: "onion"
    // }
    // const apiRoute = `/api/user/${user.getUserId()}/icon`;
    // const result = await makeApiRequest('PATCH', apiRoute, data, true);
    // console.log('Successfully called lambda function:', result);

    // const data = {
    // }
    // const apiRoute = `/api/user/${user.getUserId()}/store/${store.getStoreId()}/restock`;
    // const result = await makeApiRequest('PATCH', apiRoute, data, true);
    // console.log('Successfully called lambda function:', result);

    // const data = {
    // }
    // const apiRoute = `/api/user/${user.getUserId()}/inventory/${inventory.getInventoryId()}/get`;
    // const result = await makeApiRequest('GET', apiRoute, data, true);
    // console.log('Successfully called lambda function:', result);
    // console.log(Inventory.fromPlainObject(result));

    const data = {
    }
    const apiRoute = `/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/size`;
    const result = await makeApiRequest('GET', apiRoute, data, true);
    console.log('Successfully called lambda function:', result);
  }

  return (
    <>
      <div className="flex flex-1 flex-col bg-reno-sand-200 text-black"> 
      <div className="mx-4 mb-4">The home page isn&apos;t done yet! Check out these other pages in the meantime.</div>
      <div className="mx-4 ">
        <Link
          href={"/garden"}
        >
        <p className="inline-block">Go to Garden Page</p>
        </Link>
      </div>
      <div className="mx-4">
        <Link
          href={"/store"}
        >
        <p className="inline-block">Go to Store Page</p>
        </Link>
      </div>
      <div className="mx-4">
        <Link
          href={"/user"}
        >
        <p className="inline-block">Go to User Page</p>
        </Link>
      </div>
      <div className="mx-4">
        <Link
          href={"/login"}
        >
        <p className="inline-block">Go to Login Page</p>
        </Link>
      </div>
      <div className="mx-4">
        <button onClick={testAWSLambda} >Test AWS Lambda!</button>
      </div>

      </div>
    </>
  );
}

export default HomePage;