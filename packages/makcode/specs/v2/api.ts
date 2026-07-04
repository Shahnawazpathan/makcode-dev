// @ts-nocheck

import { MakCode } from "@makcode-ai/core"
import { ReadTool } from "@makcode-ai/core/tools"

const makcode = MakCode.make({})

makcode.tool.add(ReadTool)

makcode.tool.add({
  name: "bash",
  schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The command to run.",
      },
    },
    required: ["command"],
  },
  execute(input, ctx) {},
})

makcode.auth.add({
  provider: "openai",
  type: "api",
  value: process.env.OPENAI_API_KEY,
})

makcode.agent.add({
  name: "build",
  permissions: [],
  model: {
    id: "gpt-5-5",
    provider: "openai",
    variant: "xhigh",
  },
})

const sessionID = await makcode.session.create({
  agent: "build",
})

makcode.subscribe((event) => {
  console.log(event)
})

await makcode.session.prompt({
  sessionID,
  text: "hey what is up",
})

await makcode.session.prompt({
  sessionID,
  text: "what is up with this",
  files: [
    {
      mime: "image/png",
      uri: "data:image/png;base64,xxxx",
    },
  ],
})

await makcode.session.wait()

console.log(await makcode.session.messages(sessionID))
