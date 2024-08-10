'use client'

import UserProfileComponent from "@/components/garden/userProfile";
import LevelSystemComponent from "@/components/level/LevelSystem";
import IconSelector from "@/components/user/IconSelector";
import UsernameDisplay from "@/components/user/UsernameDisplay";
import UserStats from "@/components/user/UserStats";
import { useUser } from "@/hooks/contexts/UserContext";

const UserPage = () => {
  function RenderUser() {
    const {user, username, handleChangeUsername, icon, handleChangeIcon} = useUser();

    return <>
      <div>
        <UsernameDisplay username={username} onUsernameChange={handleChangeUsername}/>
      </div>
      <div>
        <IconSelector iconIndex={icon} onIconChange={handleChangeIcon}/>
      </div>
      <div>
        <LevelSystemComponent level={user.getLevel()} currentExp={user.getCurrentExp()} expToLevelUp={user.getExpToLevelUp()} />
      </div>
      <div>
        <UserStats />
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