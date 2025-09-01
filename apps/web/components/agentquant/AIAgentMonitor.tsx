import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  Brain,
  Code,
  Play,
  Clock,
  CheckCircle,
  Loader2,
  FileText,
  Zap,
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: 'pending' | 'running' | 'completed';
  progress?: number;
  estimatedTime?: string;
  details?: string[];
}

const agents: Agent[] = [
  {
    id: 'parser',
    name: 'ParserAgent',
    description: 'Analyzing and parsing your trading strategy request',
    icon: Brain,
    status: 'running',
    progress: 65,
    estimatedTime: '15s',
    details: [
      'Extracted strategy: Golden Cross',
      'Identified symbol: TSLA',
      'Detected timeframes: 10-day, 30-day MA',
      'Parsing risk parameters...',
    ],
  },
  {
    id: 'codegen',
    name: 'CodeGenAgent',
    description: 'Generating optimized backtesting code',
    icon: Code,
    status: 'pending',
    estimatedTime: '20s',
    details: [
      'Strategy implementation',
      'Risk management rules',
      'Performance metrics calculation',
      'Signal generation logic',
    ],
  },
  {
    id: 'executor',
    name: 'ExecutorAgent',
    description: 'Executing backtest and analyzing results',
    icon: Play,
    status: 'pending',
    estimatedTime: '25s',
    details: [
      'Historical data processing',
      'Signal generation',
      'Performance analysis',
      'Risk metrics calculation',
    ],
  },
];

const completedAgentDetails = {
  parser: [
    '✓ Strategy: Golden Cross identified',
    '✓ Symbol: TSLA validated',
    '✓ Timeframes: 10-day & 30-day MA',
    '✓ Risk parameters configured',
  ],
  codegen: [
    '✓ Strategy logic implemented',
    '✓ Entry/exit rules defined',
    '✓ Position sizing calculated',
    '✓ Performance metrics coded',
  ],
  executor: [
    '✓ Backtest executed (1,200+ days)',
    '✓ 19 trade signals generated',
    '✓ Performance analyzed',
    '✓ Risk metrics calculated',
  ],
};

const refinedCompletedAgentDetails = {
  parser: [
    '✓ Strategy: Golden Cross + RSI filter',
    '✓ Symbol: AAPL validated',
    '✓ RSI threshold: Below 30 (oversold)',
    '✓ Refined parameters configured',
  ],
  codegen: [
    '✓ RSI filter logic implemented',
    '✓ Enhanced entry conditions',
    '✓ Optimized position sizing',
    '✓ Updated performance metrics',
  ],
  executor: [
    '✓ Refined backtest executed',
    '✓ 11 high-quality signals generated',
    '✓ Improved performance confirmed',
    '✓ Enhanced risk metrics calculated',
  ],
};

interface AIAgentMonitorProps {
  isVisible?: boolean;
  isCompleted?: boolean;
  isRefinedStrategy?: boolean;
}

export function AIAgentMonitor({
  isVisible = true,
  isCompleted = false,
  isRefinedStrategy = false,
}: AIAgentMonitorProps) {
  const [currentAgents, setCurrentAgents] = useState(agents);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    // If completed, set all agents to completed state
    if (isCompleted) {
      setCurrentAgents(prev =>
        prev.map(agent => ({
          ...agent,
          status: 'completed',
          progress: 100,
        }))
      );
      setCurrentStep(3);
      return;
    }

    // Simulate agent progression during analysis
    const timer = setInterval(() => {
      setCurrentAgents(prev => {
        const updated = [...prev];

        // Update current running agent progress
        const runningAgent = updated.find(agent => agent.status === 'running');
        if (runningAgent && runningAgent.progress !== undefined) {
          runningAgent.progress = Math.min(
            runningAgent.progress + Math.random() * 5,
            100
          );

          // Complete agent when progress reaches 100
          if (runningAgent.progress >= 100) {
            runningAgent.status = 'completed';
            runningAgent.progress = 100;

            // Start next agent
            const nextAgentIndex = updated.findIndex(
              a => a.status === 'pending'
            );
            if (nextAgentIndex !== -1) {
              updated[nextAgentIndex].status = 'running';
              updated[nextAgentIndex].progress = 0;
              setCurrentStep(nextAgentIndex);
            }
          }
        }

        return updated;
      });
    }, 800);

    return () => clearInterval(timer);
  }, [isVisible, isCompleted]);

  if (!isVisible) return null;

  const getStatusIcon = (agent: Agent) => {
    const IconComponent = agent.icon;

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
    <div className="fixed bottom-6 right-6 w-80 z-50 animate-in slide-in-from-right-full duration-500">
      <Card className="bg-card/95 backdrop-blur-sm border-border shadow-2xl">
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
              Step {currentStep + 1}/3
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="text-foreground">
                {Math.round(
                  (currentAgents.filter(a => a.status === 'completed').length /
                    3) *
                    100
                )}
                %
              </span>
            </div>
            <Progress
              value={
                (currentAgents.filter(a => a.status === 'completed').length /
                  3) *
                100
              }
              className="h-2"
            />
          </div>

          {/* Agent List */}
          <div className="space-y-3">
            {currentAgents.map((agent, index) => (
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

                {agent.status === 'completed' && (
                  <div className="space-y-1">
                    {(
                      (isRefinedStrategy
                        ? refinedCompletedAgentDetails
                        : completedAgentDetails)[
                        agent.id as keyof typeof completedAgentDetails
                      ] ||
                      agent.details ||
                      []
                    ).map((detail, idx) => (
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
