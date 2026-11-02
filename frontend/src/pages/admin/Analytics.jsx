import ExpoPickerPage from "../../components/expo/ExpoPickerPage";
import ExpoReport from "../../components/analytics/ExpoReport";

export default function AdminAnalytics() {
  return (
    <ExpoPickerPage
      title="Analytics"
      subtitle="Attendees, booths, applications and sessions of each expo."
      emptyMessage="Create an expo first to see its analytics."
    >
      {(expo) => <ExpoReport expoId={expo._id} />}
    </ExpoPickerPage>
  );
}
