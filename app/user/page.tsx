'use client'
import LevelSystemComponent from "@/components/level/LevelSystem";
import IconSelector from "@/components/user/icon/IconSelector";
import UsernameDisplay from "@/components/user/UsernameDisplay";
import UserStats from "@/components/user/UserStats";
import { useUser } from "@/app/hooks/contexts/UserContext";
import Icon, { IconEntity } from "@/models/user/icons/Icon";
import { useInventory } from "../hooks/contexts/InventoryContext";
import { useGarden } from "../hooks/contexts/GardenContext";
import { useStore } from "../hooks/contexts/StoreContext";

const UserPage = () => {
  
  const  RenderUser = () => {
    const {user, username, handleChangeUsername, icon, handleChangeIcon} = useUser();
    const { inventory } = useInventory();
    const { store } = useStore();
    const { garden } = useGarden();

    if (!user) {
      return <></>;
    }

    const handleCreateUserButton = async () => {
      try {
        // const requestParameters = {
        //   plainUserObject: user.toPlainObject(),
        //   plainInventoryObject: inventory.toPlainObject(),
        //   plainStoreObject: store.toPlainObject(),
        //   plainGardenObject: garden.toPlainObject()
        // }
        // Making the POST request to your API endpoint
        const response = await fetch('/api/account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plainUserObject: user.toPlainObject(),
            plainInventoryObject: inventory.toPlainObject(),
            plainStoreObject: store.toPlainObject(),
            plainGardenObject: garden.toPlainObject()
          }), // Send the new user data in the request body
        });
  
        // Check if the response is successful
        if (!response.ok) {
          throw new Error('Failed to post new user');
        }
  
        // Parsing the response data
        const result = await response.json();
        console.log('Successfully posted:', result);
      } catch (error) {
        console.error(error);
      } finally {
      }
    }

    const onIconChangeHandler = async (icon: Icon) => {
      try {
        const data = {
          userId: user.getUserId(),
          newIcon: icon.getName()
        }
        // Making the PATCH request to your API endpoint
        const response = await fetch(`/api/user/${user.getUserId()}/icon`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data), // Send the new icon data in the request body
        });
  
        // Check if the response is successful
        if (!response.ok) {
          throw new Error('Failed to post new icon for user');
        }
  
        // Parsing the response data
        const result = await response.json();
        console.log('Successfully posted:', result);
        handleChangeIcon(icon);
      } catch (error) {
        console.error(error);
      } finally {
      }
      return;
    }

    const onUsernameChangeHandler = async (username: string) => {
      try {
        const data = {
          userId: user.getUserId(),
          newUsername: username
        }
        // Making the PATCH request to your API endpoint
        const response = await fetch(`/api/user/${user.getUserId()}/username`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data), // Send the new username data in the request body
        });
  
        // Check if the response is successful
        if (!response.ok) {
          throw new Error('Failed to post new username for user');
        }
  
        // Parsing the response data
        const result = await response.json();
        console.log('Successfully posted:', result);
        handleChangeUsername(username);
      } catch (error) {
        console.error(error);
      } finally {
      }
      return;
    }

    return <>
      <div className="w-full px-4 py-4 bg-reno-sand-200 text-black">
        <div className="flex">
          <div className={`w-1/3`}>
            <div className={`my-1 min-h-[8%] flex flex-row items-center justify-center `}>
              <IconSelector iconIndex={icon} onIconChange={onIconChangeHandler}/>
              <UsernameDisplay username={username} onUsernameChange={onUsernameChangeHandler}/>
            </div>
            <div className="mx-4 my-4">
              <LevelSystemComponent level={user.getLevel()} currentExp={user.getCurrentExp()} expToLevelUp={user.getExpToLevelUp()} />
            </div>
            <div>Friends List goes here!</div>
            <div><button onClick={handleCreateUserButton}> Save user to Database </button></div>
          </div>

          <div className={`w-2/3`}>
            <UserStats />
          </div>
        </div>
      </div>
    </>
  }

  return (<>
    <div className="w-full px-4 py-4 bg-reno-sand-200 text-black"> 
      {RenderUser()}
    </div>
    </>
  );
}

export default UserPage;