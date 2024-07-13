'use client'
import { Garden } from "@/models/garden/Garden";
import { useState } from "react";
import GardenComponent from "./garden";


export default function Home() {
  const [garden, setGarden] = useState(new Garden("DummyUser", 10, 10));

  return (<>
      <div> 
        This is the Garden Page!
      </div>
      <GardenComponent garden={garden}></GardenComponent>
    </>
  );
}
