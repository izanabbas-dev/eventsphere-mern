import ExpoPickerPage from "../../components/expo/ExpoPickerPage";
import ApplicationsList from "../../components/applications/ApplicationsList";

export default function AdminApplications() {
  return (
    <ExpoPickerPage
      title="Applications"
      subtitle="Review exhibitor applications and assign booths."
      emptyMessage="Create an expo first. Exhibitors can apply once it is published."
    >
      {(expo) => <ApplicationsList expoId={expo._id} />}
    </ExpoPickerPage>
  );
}
