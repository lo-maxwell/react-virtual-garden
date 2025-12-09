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
import colors from "@/components/colors/colors";
import { useGoose } from "../hooks/contexts/GooseContext";
import GoosePanel from "@/components/goose/goosePanel";
import Goose from "@/models/goose/Goose";
import React from "react";
import { PopupWindow } from "@/components/window/popupWindow";
import EditableGoosePanel from "@/components/goose/editableGoosePanel";
import InventoryComponent from "@/components/inventory/inventory";
import { useSelectedItem } from "../hooks/contexts/SelectedItemContext";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { buildGooseUtilities } from "@/components/goose/gooseUtilities";
import UtilityBarComponent from "@/components/garden/utilityBar/utilityBar";
import CustomGooseSVG from "@/components/goose/customGooseSVG";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { Tool } from "@/models/items/tools/Tool";
import { feedGooseAPI } from "@/components/goose/GooseUtilityFunctions";
import { syncAllAccountObjects } from "../garden/gardenFunctions";
import { useDispatch } from "react-redux";
import { setItemQuantity } from "@/store/slices/inventoryItemSlice";
import { saveGoosePen } from "@/utils/localStorage/goose";
import { saveInventory } from "@/utils/localStorage/inventory";

type SortType = "name" | "birthday" | "power" | "charisma" | "mood";
type SortDirection = "asc" | "desc";

const GoosePage = () => {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [openGooseId, setOpenGooseId] = useState<string | null>(null);
  const [sortType, setSortType] = useState<SortType>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [goosePanelMessage, setGoosePanelMessage] = useState<string>("");

  const { user, username, handleChangeUsername, icon, handleChangeIcon, reloadUser } = useUser();
  const { inventory, reloadInventory, inventoryForceRefreshKey } = useInventory();
  const { store, reloadStore } = useStore();
  const { garden, reloadGarden } = useGarden();
  const { goosePen, reloadGoosePen, selectedGoose, setSelectedGoose } = useGoose();
  const { selectedItem, toggleSelectedItem } = useSelectedItem();
  const { account, guestMode, environmentTestKey } = useAccount();
  const dispatch = useDispatch();


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

  useEffect(() => {
    setGoosePanelMessage("");
  }, [openGooseId])

  const redirectDivElement = useMemo(() => {
    if (!firebaseUser && !guestMode) {
      return isRedirecting
        ? <RedirectingMessage targetPage="login page" />
        : <div>Fetching user data...</div>;
    }
    return null;
  }, [firebaseUser, guestMode, isRedirecting]);

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

  const geese = goosePen.getAllGeese();

  // Sort geese based on current sort type
  geese.sort((a, b) => {
    let valueA: any;
    let valueB: any;

    switch (sortType) {
      case "name":
        valueA = a.getName();
        valueB = b.getName();
        return sortDirection === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);

      case "birthday":
        valueA = new Date(a.getBirthday()).getTime();
        valueB = new Date(b.getBirthday()).getTime();
        return sortDirection === "asc" ? valueA - valueB : valueB - valueA;

      case "power":
        valueA = a.getPower();
        valueB = b.getPower();
        return sortDirection === "asc" ? valueA - valueB : valueB - valueA;

      case "charisma":
        valueA = a.getCharisma();
        valueB = b.getCharisma();
        return sortDirection === "asc" ? valueA - valueB : valueB - valueA;

      case "mood":
        valueA = a.getMood();
        valueB = b.getMood();
        return sortDirection === "asc" ? valueA - valueB : valueB - valueA;

      default:
        return 0;
    }
  });

  const toggleSort = (type: SortType) => {
    if (sortType === type) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortType(type);
      setSortDirection("asc"); // default ascending when changing type
    }
  };

  const renderArrow = (type: SortType) => {
    if (type !== sortType) return "";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const handleFeedGoose = async () => {
    // && confirmFeedGoose
		if (selectedItem && selectedItem instanceof InventoryItem && selectedItem.itemData.subtype == ItemSubtypes.HARVESTED.name) {
			// setShowFeedGoosePopup(true);
      feedGoose(); //turn off later
			return;
		} else {
      feedGoose();
    }
  }

  const feedGoose = async () => {
    if (
      selectedItem == null ||
      selectedItem instanceof Tool ||
      selectedItem.itemData.subtype != ItemSubtypes.HARVESTED.name ||
      selectedGoose == null
    )
      return;
    const getItemResponse = inventory.getItem(selectedItem);
    if (!getItemResponse.isSuccessful()) return;
    let itemFromInventory = getItemResponse.payload;
    const apiResult = await feedGooseAPI(goosePen, selectedGoose, inventory, selectedItem, 1);
    if (!apiResult) {
      await syncAllAccountObjects();
      reloadUser();
      reloadGarden();
      reloadInventory();
      reloadGoosePen();
      // setGardenMessage(`There was an error planting 1 or more seeds! Please refresh the page! If the error persists, force an account refresh under profile -> settings -> force sync account.`);
      // setGardenForceRefreshKey((gardenForceRefreshKey) => gardenForceRefreshKey + 1);
      // return;
    } else {
      selectedGoose.feedGoose(inventory, selectedItem.itemData, 1);
      saveGoosePen(goosePen);
      saveInventory(inventory);
      // reloadGoosePen();
    }
		
		dispatch(setItemQuantity({ 
      inventoryItemId: itemFromInventory.getInventoryItemId(), 
      quantity: itemFromInventory.getQuantity()
    }));
	};


  const utilities = 
    buildGooseUtilities({
      onFeedGoose: handleFeedGoose,
      onSellGoose: () => {}
    })

  // Convert all geese into GoosePanel-friendly props
  const goosePanels = geese.map((goose: Goose) => {
    const gooseId = goose.getId();

    // A function to get current props dynamically
    const getProps = () => ({
      id: gooseId,
      name: goose.getName(),
      color: goose.getColor(),
      birthday: new Date(goose.getBirthday()),
      attributes: {
        power: goose.getPower(),
        charisma: goose.getCharisma(),
        personality: goose.getPersonality(),
        mood: goose.getMood(),
      },
    });

    const panelKey = `${gooseId}-${goose.getName()}`;

    return (
      <React.Fragment key={panelKey}>
        {/* Small Goose Panel */}
        <div onClick={() => {
          setOpenGooseId(gooseId);
          setSelectedGoose(goose); // Set the selected goose when opening
          console.log(goose);
        }} className="cursor-pointer">
          <GoosePanel goose={getProps()} />
        </div>

        {/* Popup with large Goose Panel */}
        <PopupWindow
          showWindow={openGooseId === gooseId}
          setShowWindow={() => {
            setOpenGooseId(null);
            setSelectedGoose(null); // Clear selected goose when closing
            console.log('set to null');
          }}
        >
          <div className="bg-reno-sand-200 p-6 inline-block border-black border-2 rounded-3xl">
            <div className="flex flex-row gap-8 items-start">

              {/* LEFT — Scaled goose panel */}
              <div className="flex flex-col gap-4 justify-center md:justify-start">
                <div className="w-[300px] md:w-[400px] scale-100 md:scale-100 origin-top">
                  <EditableGoosePanel goose={getProps()} />
                </div>
                <UtilityBarComponent utilities={utilities} maxHeightPercentage={60}/>
                <div>{goosePanelMessage}</div>
              </div>

              {/* RIGHT — Inventory */}
              <div>
                <InventoryComponent
                  onInventoryItemClickFunction={toggleSelectedItem}
                  costMultiplier={1}
                  forceRefreshKey={inventoryForceRefreshKey}
                  displayFilter={false}
                  maxHeightPercentage={50}
                  initialSubtypeFilter={ItemSubtypes.HARVESTED.name}
                />
              </div>

            </div>
          </div>
        </PopupWindow>

      </React.Fragment>
    );
  });

  const expandCard = (
    <div
      key="expand-card"
      onClick={() => console.log("Expand goose pen clicked")}
      className="
        cursor-pointer 
        bg-apple-200 
        rounded-2xl 
        shadow-md 
        p-4 
        hover:shadow-lg 
        transition 
        border border-gray-300
        flex flex-col items-center gap-3
      "
    >
      {/* Title */}
      <div className="text-lg font-bold text-gray-800">
        Expand Goose Pen
      </div>
  
      <CustomGooseSVG bodyColor={"#FFFFFF"} style={{ width: 100, height: 200}}/>
  
      {/* Optional description or leave empty for true mimic */}
      <div className="text-sm text-gray-500 text-center">
        Increase goose capacity for this pen
      </div>
    </div>
  );
  
  const panelItems = [...goosePanels, expandCard];

  const renderGoosePenSpace = () => {
    const numGeese = goosePen.getAllGeese().length;
    const size = goosePen.getSize();
  
    let label = `${numGeese}/${size} geese`;
    let classes = "px-3 py-1 rounded-md text-sm border";
  
    if (numGeese === 0) {
      label = `empty (${numGeese}/${size})`;
      classes += " bg-gray-100 text-gray-600 border-gray-300";
    } else if (numGeese === size) {
      label = `full (${numGeese}/${size})`;
      classes += " bg-red-100 text-red-700 border-red-300";
    } else {
      classes += " bg-green-100 text-green-700 border-green-300";
    }
  
    return <div className={classes}>{label}</div>;
  };
  

  return (
    <div className="w-full px-4 pb-4 bg-reno-sand-200 text-black">
      <div className="sticky top-16 z-40 w-full flex flex-row justify-between items-center shadow-xl px-3 py-3 bg-reno-sand-200 rounded-b-2xl backdrop-blur-md bg-opacity-50">
        {/* Sort bar */}
        <div className="flex gap-2 items-center">
          <span>Sort by:</span>
          {(["name", "birthday", "power", "charisma", "mood"] as SortType[]).map((type) => (
            <button
              key={type}
              className={`px-2 py-1 rounded flex items-center gap-1 ${sortType === type ? "bg-blue-500 text-white" : "bg-gray-200"
                }`}
              onClick={() => toggleSort(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
              <span>{renderArrow(type)}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center"> {renderGoosePenSpace()} </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {panelItems}
      </div>
    </div>
  );
};

export default GoosePage;
