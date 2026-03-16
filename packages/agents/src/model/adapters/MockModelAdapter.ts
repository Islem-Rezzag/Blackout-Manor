import type {
  AgentModelAdapter,
  AgentModelAdapterResult,
  AgentModelInvocation,
  AgentSelection,
} from "../types";

type MockResolver = (
  invocation: AgentModelInvocation,
) => AgentSelection | Promise<AgentSelection>;

export class MockModelAdapter implements AgentModelAdapter {
  readonly id = "mock";
  readonly #calls: AgentModelInvocation[] = [];

  constructor(private readonly resolver: MockResolver) {}

  get calls() {
    return [...this.#calls];
  }

  async selectAction(
    invocation: AgentModelInvocation,
  ): Promise<AgentModelAdapterResult> {
    this.#calls.push(invocation);

    return {
      selection: await this.resolver(invocation),
      providerResponseId: `mock:${invocation.decisionKey}`,
    };
  }
}
