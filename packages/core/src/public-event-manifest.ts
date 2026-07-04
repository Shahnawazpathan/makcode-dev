export * as PublicEventManifest from "./public-event-manifest"

import { Event } from "@makcode-ai/schema/event"
import { EventManifest } from "@makcode-ai/schema/event-manifest"

export const Definitions = EventManifest.ServerDefinitions
export const Latest = Event.latest(Definitions)
