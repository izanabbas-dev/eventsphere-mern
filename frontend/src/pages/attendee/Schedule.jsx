import ExpoPickerPage from "../../components/expo/ExpoPickerPage";
import AttendeeSchedule from "../../components/attendee/AttendeeSchedule";

export default function AttendeeSchedulePage() {
  return (
    <ExpoPickerPage
      title="Schedule"
      subtitle="Find sessions, book your seat and bookmark the ones you like."
      emptyMessage="There are no expos to show yet."
      basePath="/attendee"
      hideStatuses={["cancelled"]}
    >
      {(expo) => <AttendeeSchedule expo={expo} showFilters />}
    </ExpoPickerPage>
  );
}
