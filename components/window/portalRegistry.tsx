const portalElements = new Set<HTMLElement>();

export const registerPortal = (el: HTMLElement) => portalElements.add(el);
export const unregisterPortal = (el: HTMLElement) => portalElements.delete(el);
export const getPortals = () => Array.from(portalElements);