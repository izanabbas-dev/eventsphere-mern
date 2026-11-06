import { CloudOff, RefreshCw } from "lucide-react";
import Card from "./Card";
import Button from "./Button";
import EmptyState from "./EmptyState";

export default function LoadError({ onRetry }) {
  return (
    <Card>
      <EmptyState
        icon={CloudOff}
        title="Could not load the data"
        message="Please check your connection and try again."
        action={
          onRetry && (
            <Button variant="secondary" onClick={onRetry}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
            </Button>
          )
        }
      />
    </Card>
  );
}
