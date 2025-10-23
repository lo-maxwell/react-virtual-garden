"use client";
import LevelSystemComponent from "@/components/level/LevelSystem";
import IconSelector from "@/components/user/icon/IconSelector";
import UsernameDisplay from "@/components/user/UsernameDisplay";
import UserStats from "@/components/user/UserStats";
import { useUser } from "@/app/hooks/contexts/UserContext";
import Icon, { IconEntity } from "@/models/user/icons/Icon";
import { useInventory } from "../hooks/contexts/InventoryContext";
import { useGarden } from "../hooks/contexts/GardenContext";
import { useStore } from "../hooks/contexts/StoreContext";
import { useAccount } from "../hooks/contexts/AccountContext";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { makeApiRequest } from "@/utils/api/api";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/contexts/AuthContext";
import RedirectingMessage from "@/components/errorPages/redirectingMessage";
import "./page.css";

const UserPage = () => {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { user, username, handleChangeUsername, icon, handleChangeIcon, reloadUser } = useUser();
  const { inventory, reloadInventory } = useInventory();
  const { store, reloadStore } = useStore();
  const { garden, reloadGarden } = useGarden();
  const { account, guestMode, environmentTestKey } = useAccount();

  // Redirect effect
  useEffect(() => {
    if (!firebaseUser && !guestMode) {
      setIsRedirecting(true);
      const timer = setTimeout(() => {
        router.push("/login");
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setIsRedirecting(false);
    }
  }, [firebaseUser, guestMode, router]);

  const redirectDivElement = useMemo(() => {
    if (!firebaseUser && !guestMode) {
      return isRedirecting
        ? <RedirectingMessage targetPage="login page" />
        : <div>Fetching user data...</div>;
    }
    return null;
  }, [firebaseUser, guestMode, isRedirecting]);


  // Handlers
  const handleCreateAccountButton = useCallback(async () => {
    try {
      const data = {
        plainUserObject: user.toPlainObject(),
        plainInventoryObject: inventory.toPlainObject(),
        plainStoreObject: store.toPlainObject(),
        plainGardenObject: garden.toPlainObject(),
      };
      const result = await makeApiRequest("POST", `/api/admin`, data, true);
      console.log("Successfully posted:", result);
    } catch (error) {
      console.error(error);
    }
  }, [user, inventory, store, garden]);

  const handleSaveAccountButton = useCallback(async () => {
    try {
      const data = {
        plainUserObject: user.toPlainObject(),
        plainInventoryObject: inventory.toPlainObject(),
        plainStoreObject: store.toPlainObject(),
        plainGardenObject: garden.toPlainObject(),
      };
      const result = await makeApiRequest("PATCH", `/api/admin`, data, true);
      console.log("Successfully updated:", result);
    } catch (error) {
      console.error(error);
    }
  }, [user, inventory, store, garden]);

  const onIconChangeHandler = useCallback(
    async (newIcon: Icon) => {
      handleChangeIcon(newIcon);

      if (guestMode) return;

      try {
        const data = {
          userId: user.getUserId(),
          newIcon: newIcon.getName(),
        };
        const result = await makeApiRequest(
          "PATCH",
          `/api/user/${user.getUserId()}/icon`,
          data,
          true
        );
        if (result.success) {
          console.log("Successfully posted:", result.data);
        } else {
          console.error("Error posting icon:", result.error);
        }
      } catch (error) {
        console.error(error);
      }
    },
    [handleChangeIcon, guestMode, user]
  );

  const onUsernameChangeHandler = useCallback(
    async (newUsername: string) => {
      handleChangeUsername(newUsername);

      if (guestMode) return;

      try {
        const data = {
          userId: user.getUserId(),
          newUsername,
        };
        const result = await makeApiRequest(
          "PATCH",
          `/api/user/${user.getUserId()}/username`,
          data,
          true
        );
        if (result.success) {
          console.log("Successfully posted:", result.data);
        } else {
          console.error("Error posting username:", result.error);
        }
      } catch (error) {
        console.error(error);
      }
    },
    [handleChangeUsername, guestMode, user]
  );

  


  const renderAccountManagementButtons = useMemo(() => {
    if (!environmentTestKey) {
      return <div>Could not fetch environment, currently in local save mode</div>;
    }

    if (
      environmentTestKey === "this is the local environment" ||
      environmentTestKey === "this is the dev environment"
    ) {
      return (
        <>
          <div>
            <button onClick={handleCreateAccountButton}>
              Create user in Database
            </button>
          </div>
          <div>
            <button onClick={handleSaveAccountButton}>
              Save user to Database
            </button>
          </div>
        </>
      );
    } else if (environmentTestKey === "this is the prod environment") {
      return null;
    } else {
      return <div>{environmentTestKey}</div>;
    }
  }, [
    environmentTestKey,
    handleCreateAccountButton,
    handleSaveAccountButton,
  ]);

  // Early return for redirect
  if (!firebaseUser && !guestMode) {
    return (
      <div className="w-full px-4 py-4 bg-reno-sand-200 text-black">
        {redirectDivElement}
      </div>
    );
  }

  if (!user || !account) {
    return <></>;
  }

  return (
    <div className="w-full px-4 py-4 bg-reno-sand-200 text-black">
      <div className="flex inner-flex">
        <div className="w-1/3 left-side">
          <div className="flex items-center justify-between">
            <IconSelector iconIndex={icon} onIconChange={onIconChangeHandler} />
            <div className="flex flex-1 flex-col justify-start gap-2"> {/* Match icon height */}
              <UsernameDisplay
                username={username}
                onUsernameChange={onUsernameChangeHandler}
              />

              <LevelSystemComponent
                level={user.getLevel()}
                currentExp={user.getCurrentExp()}
                expToLevelUp={user.getExpToLevelUp()}
              />
            </div>
          </div>

          <Suspense fallback={<div>Loading...</div>}>
            {renderAccountManagementButtons}
          </Suspense>
        </div>

        <div className="w-2/3 right-side">
          <UserStats />
        </div>
      </div>
    </div>
  );
};

export default UserPage;
