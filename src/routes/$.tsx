import { createFileRoute } from "@tanstack/react-router";
import { ClientSpa } from "./-spa";

export const Route = createFileRoute("/$")({
  component: ClientSpa,
});
