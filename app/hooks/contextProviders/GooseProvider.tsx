'use client'
import GoosePen from '@/models/goose/GoosePen';
import { loadGoosePen, saveGoosePen } from '@/utils/localStorage/goose';
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GooseContext } from '../contexts/GooseContext';
import { useUser } from '../contexts/UserContext';

// Define props for the provider
interface GooseProviderProps {
    children: ReactNode;
}

export const GooseProvider = ({ children }: GooseProviderProps) => {
	const {user} = useUser();
    const [goosePen, setGoosePen] = useState<GoosePen | null>(null);

	const setupGoosePen = useCallback((): GoosePen => {
		let pen = loadGoosePen();
		if (!(pen instanceof GoosePen)) {
		  console.log('goose pen not found, setting up');
		  if (!user) {
			console.warn(`Could not find user, created unlinked goose pen`)
			pen = GoosePen.generateDefaultGoosePen(uuidv4());
		  } else {
			pen = GoosePen.generateDefaultGoosePen(user.getUserId());
		  }
		  saveGoosePen(pen);
		}
		return pen;
	  }, []);

	useEffect(() => {
		// Initialize on client side
		const initialGoosePen = setupGoosePen();
		setGoosePen(initialGoosePen);
	  }, []);

	const reloadGooses = useCallback(() => {
		const initialGoosePen = setupGoosePen();
		setGoosePen(initialGoosePen);
	}, [setupGoosePen]);

	const contextValue = useMemo(() => ({
		goosePen: goosePen!,
		reloadGoosePen: reloadGooses
	  }), [
		goosePen
	  ]);

    return (
        <GooseContext.Provider value={contextValue}>
            {children}
        </GooseContext.Provider>
    );
};