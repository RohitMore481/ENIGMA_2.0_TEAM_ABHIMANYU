import { TileLayer } from "react-leaflet";
import { useAppContext } from "../../context/AppContext";

const StressOverlay = () => {

  const { stressResults, isOverlayVisible } = useAppContext();

  const tileUrl = stressResults?.heatmap?.tile_url;

  if (!tileUrl || !isOverlayVisible) return null;

  return (
    <TileLayer
      url={tileUrl}
      opacity={0.6}
      zIndex={500}
    />
  );
};

export default StressOverlay;