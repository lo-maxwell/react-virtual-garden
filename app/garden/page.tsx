import GardenPageClient from "./gardenPageClient";

const GardenPage = () => {
  const showDeveloperOptions = process.env.DEVELOPER_OPTIONS === "true";
  return <GardenPageClient showDeveloperOptions={showDeveloperOptions} />;
}

export default GardenPage;