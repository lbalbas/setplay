import { createFileRoute, redirect } from "@tanstack/react-router";
import { MOCK_HEADLINE_STREAM } from "#/mocks/data";

export const Route = createFileRoute("/watch/")({
  beforeLoad: () => {
    throw redirect({
      to: "/watch/$streamName",
      params: { streamName: MOCK_HEADLINE_STREAM.id },
    });
  },
});
