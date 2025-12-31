import { BaseMessage } from '@langchain/core/messages';

export interface AgentState {
    messages: BaseMessage[];
    tickets: any[];
    summary: string;
    source: 'jira' | 'excel';
    query: string;
}
