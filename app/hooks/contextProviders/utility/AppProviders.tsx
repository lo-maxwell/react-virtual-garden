import { store } from "@/store";
import { Provider } from "react-redux";
import { AccountProvider } from "../AccountProvider";
import { AuthProvider } from "../AuthProvider";
import { GardenProvider } from "../GardenProvider";
import { GooseProvider } from "../GooseProvider";
import { InventoryProvider } from "../InventoryProvider";
import { SelectedItemProvider } from "../SelectedItemProvider";
import { StoreProvider } from "../StoreProvider";
import { UserProvider } from "../UserProvider";

function composeProviders(
    ...providers: Array<React.ComponentType<{ children: React.ReactNode }>>
) {
    return function ComposedProvider({ children }: { children: React.ReactNode }) {
        return providers.reduceRight((acc, Provider) => {
            return <Provider>{acc}</Provider>;
        }, children) as JSX.Element; // FORCE JSX ELEMENT
    };
}

const ReduxProviderWrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
);


const CombinedProviders = composeProviders(
    ReduxProviderWrapper,         // Redux
    AuthProvider,
    AccountProvider,
    UserProvider,
    GardenProvider,
    GooseProvider,
    StoreProvider,
    InventoryProvider,
    SelectedItemProvider
);

export function AppProviders({ children }: { children: React.ReactNode }) {
    return <CombinedProviders>{children}</CombinedProviders>;
}