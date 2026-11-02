import ExpoPickerPage from "../../components/expo/ExpoPickerPage";
import ExhibitorSearch from "../../components/attendee/ExhibitorSearch";

export default function AttendeeExhibitors() {
  return (
    <ExpoPickerPage
      title="Exhibitors"
      subtitle="Search companies by name, product or category."
      emptyMessage="There are no expos to show yet."
      basePath="/attendee"
      hideStatuses={["cancelled"]}
    >
      {(expo) => <ExhibitorSearch expoId={expo._id} />}
    </ExpoPickerPage>
  );
}
