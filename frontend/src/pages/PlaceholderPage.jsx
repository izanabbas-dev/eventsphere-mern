import { Construction } from "lucide-react";
import PageHeader from "../components/PageHeader";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";

// Temporary page. Each one will be replaced by a real page in the next steps.
export default function PlaceholderPage({ title }) {
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <EmptyState icon={Construction} title="Coming soon" message="This page will be built in the next steps." />
      </Card>
    </>
  );
}
