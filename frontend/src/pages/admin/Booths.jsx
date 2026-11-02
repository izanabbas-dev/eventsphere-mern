import ExpoPickerPage from "../../components/expo/ExpoPickerPage";
import FloorPlan from "../../components/floorplan/FloorPlan";

export default function AdminBooths() {
  return (
    <ExpoPickerPage
      title="Booths"
      subtitle="Manage the floor plan and booths of each expo."
      emptyMessage="Create an expo first, then add booths on its floor plan."
    >
      {(expo) => <FloorPlan expoId={expo._id} />}
    </ExpoPickerPage>
  );
}
