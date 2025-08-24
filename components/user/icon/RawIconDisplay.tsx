import { useAccount } from "@/app/hooks/contexts/AccountContext";
import { iconEmojiFactory } from "@/models/user/icons/IconEmojiFactory";
import { iconSVGFactory } from "@/models/user/icons/IconSVGFactory";

const RawIconDisplay = ({icon, width, height, additionalSettings = ''}: {icon: string, width: string | number, height: string | number, additionalSettings?: string}) => {
    const {displayEmojiIcons} = useAccount();
    if (!displayEmojiIcons && iconSVGFactory.iconExists(icon)) {
        return <>
            <img src={iconSVGFactory.getIconByName(icon)} alt={icon} className={`w-${width} h-${height} object-contain ${additionalSettings}`} />
        </>;
    }
    return <>
        <span className={`w-${width} ${additionalSettings}`}>{iconEmojiFactory.getIconByName(icon)}</span>
    </>;
}

export default RawIconDisplay;