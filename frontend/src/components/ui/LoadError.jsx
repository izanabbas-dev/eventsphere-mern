import { CloudOff, RefreshCw } from "lucide-react";
import Card from "./Card";
import Button from "./Button";
import EmptyState from "./EmptyState";

// Shown when a page could not load its data, with a "Try again" button
export default function LoadError({ onRetry, message = "Please check your connection and try again." }) {
  return (
    <Card>
      <EmptyState
        icon={CloudOff}
        title="Could not load the data"
        message={message}
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
