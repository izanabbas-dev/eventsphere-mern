import ExpoPickerPage from "../../components/expo/ExpoPickerPage";
import SessionSchedule from "../../components/sessions/SessionSchedule";

export default function AdminSessions() {
  return (
    <ExpoPickerPage
      title="Sessions"
      subtitle="Plan the schedule of talks, workshops and panels."
      emptyMessage="Create an expo first, then add sessions to its schedule."
    >
      {(expo) => <SessionSchedule expo={expo} />}
    </ExpoPickerPage>
  );
}
