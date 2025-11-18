'use client'
import { GardenContext } from '@/app/hooks/contexts/GardenContext';
import { Utility } from '@/components/garden/utilityBar/utilityBar';
import { Garden } from '@/models/garden/Garden';
import { loadGarden, saveGarden } from '@/utils/localStorage/garden';
import React, { ReactNode, useEffect, useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Define props for the provider
interface GardenProviderProps {
    children: ReactNode;
}

export const GardenProvider = ({ children }: GardenProviderProps) => {
    const [garden, setGarden] = useState<Garden | null>(null);
	const [gardenMessage, setGardenMessage] = useState('');
	const [instantGrow, setInstantGrow] = useState(false);
	const [gardenForceRefreshKey, setGardenForceRefreshKey] = useState(0);
	const [utilities, setUtilities] = useState<Utility[]>([]);

	const setupGarden = useCallback((): Garden => {
		let garden = loadGarden();
		console.log(garden);
		if (!(garden instanceof Garden)) {
		  console.log('garden not found, setting up');
		  garden = Garden.generateDefaultNewGarden();
		  saveGarden(garden);
		}
		return garden;
	}, []);

	useEffect(() => {
		const garden = setupGarden();
		setGarden(garden);
	}, [setupGarden]);
	
	const resetGarden = useCallback(() => {
		const garden = Garden.generateDefaultNewGarden();
		setGarden(garden);
		saveGarden(garden);
		console.log('finished reset');
	}, []);

	const toggleInstantGrow = useCallback(() => {
		setInstantGrow((prev) => {
			const next = !prev;
			setGardenMessage(`instant grow is now: ${next ? 'on' : 'off'}`);
			return next;
		});
	}, []);

	const updateGardenForceRefreshKey = useCallback(() => {
		setGardenForceRefreshKey((gardenForceRefreshKey) => gardenForceRefreshKey + 1);
	}, []);

	const reloadGarden = useCallback(() => {
		const garden = setupGarden();
		setGarden(garden);
	}, [setupGarden]);

	const contextValue = useMemo(() => ({
		garden: garden!,
		resetGarden,
		gardenMessage,
		setGardenMessage,
		instantGrow,
		toggleInstantGrow,
		gardenForceRefreshKey,
		updateGardenForceRefreshKey,
		reloadGarden
	}), [
		garden,
		resetGarden,
		gardenMessage,
		instantGrow,
		toggleInstantGrow,
		gardenForceRefreshKey,
		updateGardenForceRefreshKey,
		reloadGarden
	]);

    return (
        <GardenContext.Provider value={contextValue}>
            {children}
        </GardenContext.Provider>
    );
};