import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  Code,
  Play,
  Clock,
  CheckCircle,
  Loader2,
  Zap,
  ChevronLeft,
  ChevronRight,
  Database,
  Search,
} from 'lucide-react';
import styles from './AIAgentMonitor.module.css';
import { cn } from '../ui/utils';

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: 'pending' | 'running' | 'completed';
  progress?: number;
  estimatedTime?: string;
  details?: string[];
  functionName?: string;
}

// Function name to agent mapping based on backend workflow
const FUNCTION_TO_AGENT_MAP = {
  task_register: 'strategy_parser',
  quick_preview: 'strategy_parser',
  yh_query_save: 'data_manager',
  code_generator: 'code_generator',
  code_executor: 'executor',
};

const AGENT_DEFINITIONS: Record<string, Agent> = {
  strategy_parser: {
    id: 'strategy_parser',
    name: 'StrategyParser',
    description: 'Analyzing and parsing your trading strategy request',
    icon: Search,
    status: 'pending',
    estimatedTime: '10s',
    details: [],
    functionName: 'task_register,quick_preview',
  },
  data_manager: {
    id: 'data_manager',
    name: 'DataManager',
    description: 'Fetching and preparing historical market data',
    icon: Database,
    status: 'pending',
    estimatedTime: '15s',
    details: [],
    functionName: 'yh_query_save',
  },
  code_generator: {
    id: 'code_generator',
    name: 'CodeGenerator',
    description: 'Generating optimized backtesting code',
    icon: Code,
    status: 'pending',
    estimatedTime: '20s',
    details: [],
    functionName: 'code_generator',
  },
  executor: {
    id: 'executor',
    name: 'BacktestExecutor',
    description: 'Executing backtest and analyzing results',
    icon: Play,
    status: 'pending',
    estimatedTime: '25s',
    details: [],
    functionName: 'code_executor',
  },
};

// Parse chat messages to extract function completion data
interface ParsedMessage {
  id: string;
  name: string;
  payload?: {
    input?: any;
    output?: any;
  };
}

const parseMessages = (messages: any[]): ParsedMessage[] => {
  const functionMessages: ParsedMessage[] = [];

  for (const message of messages) {
    if (message.role === 'assistant') {
      const parts = message?.parts || [];
      for (const part of parts) {
        if (part.data?.name?.startsWith('Function Complete:')) {
          const functionName = part.data.name.replace(
            'Function Complete: ',
            ''
          );
          functionMessages.push({
            id: part.data.id,
            name: functionName,
            payload: part.data.payload,
          });
        }
      }
    }
  }

  return functionMessages.sort((a, b) => a.id.localeCompare(b.id));
};

interface AIAgentMonitorProps {
  isVisible?: boolean;
  isCompleted?: boolean;
  messages?: any[];
}

export function AIAgentMonitor({
  isVisible = true,
  isCompleted = false,
  messages = [],
}: AIAgentMonitorProps) {
  const [currentAgents, setCurrentAgents] = useState(
    Object.values(AGENT_DEFINITIONS)
  );
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Generate agent details from actual function data
  const generateAgentDetails = (
    agent: Agent,
    functionMessages: ParsedMessage[]
  ): string[] => {
    const details: string[] = [];

    for (const msg of functionMessages) {
      const agentId =
        FUNCTION_TO_AGENT_MAP[msg.name as keyof typeof FUNCTION_TO_AGENT_MAP];
      if (agentId === agent.id && msg.payload?.output) {
        const output = msg.payload.output;

        switch (msg.name) {
          case 'task_register':
            if (output.task_id)
              details.push(
                `✓ Task registered: ${output.task_id.substring(0, 8)}...`
              );
            break;
          case 'quick_preview':
            if (output.ticker) details.push(`✓ Symbol: ${output.ticker}`);
            if (output.start_date)
              details.push(
                `✓ Period: ${output.start_date} to ${output.end_date}`
              );
            if (output.indicators)
              details.push(
                `✓ Indicators: ${output.indicators.map((i: any) => i.name).join(', ')}`
              );
            break;
          case 'yh_query_save':
            if (output.storage_key)
              details.push(`✓ Data stored: ${output.storage_key}`);
            break;
          case 'code_generator':
            if (output.status === 'success') {
              details.push('✓ Strategy code generated');
              if (output.logic_summary?.entry_conditions) {
                details.push(
                  `✓ Entry: ${output.logic_summary.entry_conditions[0]}`
                );
              }
              if (output.logic_summary?.exit_conditions) {
                details.push(
                  `✓ Exit: ${output.logic_summary.exit_conditions[0]}`
                );
              }
            }
            break;
          case 'code_executor':
            if (output.status === 'success' && output.output?.kpis) {
              const kpis = output.output.kpis;
              details.push(
                `✓ Backtest completed - ${kpis.total_trades} trades`
              );
              details.push(`✓ Total return: ${kpis.total_return.toFixed(2)}%`);
              details.push(`✓ Win rate: ${kpis.win_rate.toFixed(1)}%`);
              details.push(`✓ Sharpe ratio: ${kpis.sharpe_ratio.toFixed(2)}`);
            }
            break;
        }
      }
    }

    return details;
  };

  useEffect(() => {
    if (!isVisible) return;

    const functionMessages = parseMessages(messages);
    const completedFunctions = new Set(functionMessages.map(msg => msg.name));

    setCurrentAgents(prev => {
      const updatedAgents = prev.map(agent => {
        const agentFunctions = agent.functionName?.split(',') || [];
        const isCompleted = agentFunctions.some(fn =>
          completedFunctions.has(fn.trim())
        );

        let status: 'pending' | 'running' | 'completed' = 'pending';
        let progress = 0;

        if (isCompleted) {
          status = 'completed';
          progress = 100;
        } else if (functionMessages.length > 0) {
          // Check if this agent should be running based on workflow order
          const agentOrder = [
            'strategy_parser',
            'data_manager',
            'code_generator',
            'executor',
          ];
          const currentAgentIndex = agentOrder.indexOf(agent.id);
          const completedAgentsCount = prev.filter(a => {
            const aFunctions = a.functionName?.split(',') || [];
            return aFunctions.some(fn => completedFunctions.has(fn.trim()));
          }).length;

          if (currentAgentIndex === completedAgentsCount) {
            status = 'running';
            progress = 50; // Show some progress when running
          }
        }

        return {
          ...agent,
          status,
          progress,
          details: generateAgentDetails(agent, functionMessages),
        };
      });

      // Update current step based on the new agents state
      const completedCount = updatedAgents.filter(
        a => a.status === 'completed'
      ).length;
      setCurrentStep(completedCount);

      return updatedAgents;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, messages]);

  if (!isVisible) return null;

  const getStatusIcon = (agent: Agent) => {
    switch (agent.status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (agent: Agent) => {
    switch (agent.status) {
      case 'running':
        return (
          <Badge
            variant="default"
            className="bg-primary/10 text-primary border-primary/20"
          >
            Running
          </Badge>
        );
      case 'completed':
        return (
          <Badge
            variant="default"
            className="bg-success/10 text-success border-success/20"
          >
            Completed
          </Badge>
        );
      case 'pending':
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className={cn(styles.container, { [styles.collapsed]: isCollapsed })}>
      <Card className="bg-card/95 backdrop-blur-sm border-border shadow-2xl">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={styles.toggleButton}
          aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {isCollapsed ? <ChevronLeft /> : <ChevronRight />}
        </button>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">
                AI Agent Monitor
              </h3>
            </div>
            <div className="text-xs text-muted-foreground">
              Step {Math.min(currentStep + 1, currentAgents.length)}/{currentAgents.length}
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="text-foreground">
                {Math.round(
                  (currentAgents.filter(a => a.status === 'completed').length /
                    currentAgents.length) *
                    100
                )}
                %
              </span>
            </div>
            <Progress
              value={
                (currentAgents.filter(a => a.status === 'completed').length /
                  currentAgents.length) *
                100
              }
              className="h-2"
            />
          </div>

          {/* Agent List */}
          <div className="space-y-3">
            {currentAgents.map(agent => (
              <div
                key={agent.id}
                className={`p-3 rounded-lg border transition-all duration-300 ${
                  agent.status === 'running'
                    ? 'bg-primary/5 border-primary/20'
                    : agent.status === 'completed'
                      ? 'bg-success/5 border-success/20'
                      : 'bg-card border-border'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(agent)}
                    <span className="font-medium text-sm text-foreground">
                      {agent.name}
                    </span>
                  </div>
                  {getStatusBadge(agent)}
                </div>

                <p className="text-xs text-muted-foreground mb-2">
                  {agent.description}
                </p>

                {agent.status === 'running' && agent.progress !== undefined && (
                  <div className="mb-2">
                    <Progress value={agent.progress} className="h-1" />
                  </div>
                )}

                {agent.status === 'running' && agent.details && (
                  <div className="space-y-1">
                    {agent.details
                      .slice(0, Math.floor((agent.progress || 0) / 25) + 1)
                      .map((detail, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <CheckCircle className="h-3 w-3 text-success flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {detail}
                          </span>
                        </div>
                      ))}
                  </div>
                )}

                {agent.status === 'completed' && agent.details && (
                  <div className="space-y-1">
                    {agent.details.map((detail, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-success flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {detail}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {agent.estimatedTime && agent.status === 'pending' && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Est. {agent.estimatedTime}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              {isCompleted
                ? 'Analysis completed successfully • Ready for new strategy'
                : 'Processing your strategy with real market data'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
