import { Card } from '../ui/card';
import { TrendingUp, TrendingDown, Shield, Target } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';

// Performance Evaluation Thresholds
// These constants define the business logic for evaluating trading strategy performance
const PERFORMANCE_THRESHOLDS = {
  // Sharpe Ratio: Measures risk-adjusted returns
  // Values above 1.0 are considered excellent, above 0.5 are acceptable
  SHARPE_RATIO: {
    EXCELLENT: 1.0, // Strong risk-adjusted performance
    ACCEPTABLE: 0.5, // Adequate risk-adjusted performance
  },

  // Maximum Drawdown: Peak-to-trough decline (negative values)
  // Lower absolute values indicate better risk management
  MAX_DRAWDOWN: {
    LOW_RISK: -20, // Drawdown less than 20% is considered low risk
    MEDIUM_RISK: -35, // Drawdown between 20-35% is medium risk
    // Above 35% is considered high risk
  },

  // Win Rate: Percentage of profitable trades
  // Higher percentages indicate more consistent strategy performance
  WIN_RATE: {
    EXCELLENT: 60, // Above 60% win rate is excellent
    GOOD: 40, // Above 40% win rate is acceptable
    // Below 40% may indicate strategy needs improvement
  },
} as const;

// Performance Labels
// Human-readable labels for different performance levels
const PERFORMANCE_LABELS = {
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
  LOW_RISK: 'Low Risk',
  MEDIUM_RISK: 'Medium Risk',
  HIGH_RISK: 'High Risk',
  PROFIT: 'Profit',
  LOSS: 'Loss',
} as const;

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: any;
  description?: string;
}

function KPICard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  description,
}: KPICardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-danger';
      default:
        return 'text-muted-foreground';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return <TrendingUp className="h-3 w-3" />;
      case 'negative':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Card className="p-6 bg-card/80 backdrop-blur-sm border-border hover:border-primary/20 transition-all duration-200">
      <div className="space-y-2">
        {Icon && (
          <div className="flex items-center justify-between">
            <Icon className="h-5 w-5 text-primary" />
            {change && (
              <div
                className={`flex items-center space-x-1 text-xs ${getChangeColor()}`}
              >
                {getChangeIcon()}
                <span>{change}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </h4>
          <div className="text-3xl font-light kpi-number text-foreground">
            {value}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground/80">{description}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

interface PerformanceMetrics {
  sharpe_ratio: number;
  max_drawdown: number;
  total_return: number;
  win_rate: number;
  total_trades: number;
}

interface AIAnalysis {
  task_id?: string;
  analysis?: string;
  strategy_score?: number;
  suggestions?: string;
}

interface KPICardsProps {
  isVisible?: boolean;
  performanceMetrics?: PerformanceMetrics;
  aiAnalysis?: AIAnalysis;
}

export function KPICards({
  isVisible = true,
  performanceMetrics,
  aiAnalysis,
}: KPICardsProps) {
  if (!isVisible) return null;

  // Helper functions for formatting
  const formatPercentage = (value: number) => {
    if (value == null || isNaN(value)) return '0.00%';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    if (value == null || isNaN(value)) return '0.00';
    return value.toFixed(decimals);
  };

  // Helper function to determine change type based on numeric value
  // Used consistently across all metrics for uniform evaluation
  const getChangeType = (
    value: number
  ): 'positive' | 'negative' | 'neutral' => {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  };

  // Enhanced metric evaluation system using consistent change type logic
  const evaluateMetric = (
    value: number,
    thresholds: { good: number; fair?: number },
    labels: { good: string; fair?: string; poor: string }
  ) => {
    // Determine performance level based on thresholds
    let changeType: 'positive' | 'negative' | 'neutral';
    let change: string;

    if (value > thresholds.good) {
      changeType = 'positive';
      change = labels.good;
    } else if (thresholds.fair !== undefined && value > thresholds.fair) {
      changeType = 'neutral';
      change = labels.fair!;
    } else {
      changeType = 'negative';
      change = labels.poor;
    }

    return { change, changeType };
  };

  // Helper function for evaluating metrics based on directional performance
  // Some metrics (like drawdown) are "good" when negative, others when positive
  const evaluateDirectionalMetric = (
    value: number,
    isGoodWhenPositive: boolean = true
  ) => {
    return isGoodWhenPositive ? getChangeType(value) : getChangeType(-value);
  };

  // Only show KPIs if we have real performance metrics
  if (!performanceMetrics) {
    return (
      <div className="animate-in slide-in-from-right-4 duration-700 delay-300">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Performance Metrics
          </h3>
          <p className="text-sm text-muted-foreground">
            Waiting for backtest results...
          </p>
        </div>
      </div>
    );
  }

  const sharpeEvaluation = evaluateMetric(
    performanceMetrics.sharpe_ratio || 0,
    {
      good: PERFORMANCE_THRESHOLDS.SHARPE_RATIO.EXCELLENT,
      fair: PERFORMANCE_THRESHOLDS.SHARPE_RATIO.ACCEPTABLE,
    },
    {
      good: PERFORMANCE_LABELS.GOOD,
      fair: PERFORMANCE_LABELS.FAIR,
      poor: PERFORMANCE_LABELS.POOR,
    }
  );

  const drawdownEvaluation = evaluateMetric(
    performanceMetrics.max_drawdown,
    {
      good: PERFORMANCE_THRESHOLDS.MAX_DRAWDOWN.LOW_RISK,
      fair: PERFORMANCE_THRESHOLDS.MAX_DRAWDOWN.MEDIUM_RISK,
    },
    {
      good: PERFORMANCE_LABELS.LOW_RISK,
      fair: PERFORMANCE_LABELS.MEDIUM_RISK,
      poor: PERFORMANCE_LABELS.HIGH_RISK,
    }
  );

  const winRateEvaluation = evaluateMetric(
    performanceMetrics.win_rate,
    {
      good: PERFORMANCE_THRESHOLDS.WIN_RATE.EXCELLENT,
      fair: PERFORMANCE_THRESHOLDS.WIN_RATE.GOOD,
    },
    {
      good: PERFORMANCE_LABELS.EXCELLENT,
      fair: PERFORMANCE_LABELS.GOOD,
      poor: PERFORMANCE_LABELS.POOR,
    }
  );

  const kpis = [
    {
      title: 'Total Return',
      value: formatPercentage(performanceMetrics.total_return),
      change:
        performanceMetrics.total_return > 0
          ? PERFORMANCE_LABELS.PROFIT
          : PERFORMANCE_LABELS.LOSS,
      changeType: getChangeType(performanceMetrics.total_return),
      icon: TrendingUp,
      description: 'Strategy performance',
    },
    {
      title: 'Sharpe Ratio',
      value: formatNumber(performanceMetrics.sharpe_ratio || 0),
      change: sharpeEvaluation.change,
      changeType: sharpeEvaluation.changeType,
      icon: Target,
      description: 'Risk-adjusted returns',
    },
    {
      title: 'Max Drawdown',
      value: `-${formatNumber(Math.abs(performanceMetrics.max_drawdown))}%`,
      change: drawdownEvaluation.change,
      changeType: drawdownEvaluation.changeType,
      icon: Shield,
      description: 'Peak-to-trough decline',
    },
    {
      title: 'Win Rate',
      value: `${formatNumber(performanceMetrics.win_rate)}%`,
      change: `${performanceMetrics.total_trades} trades • ${winRateEvaluation.change}`,
      changeType: winRateEvaluation.changeType,
      icon: Target,
      description: 'Successful trades',
    },
  ];

  return (
    <div className="animate-in slide-in-from-right-4 duration-700 delay-300">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Performance Metrics
        </h3>
        <p className="text-sm text-muted-foreground">Backtest results</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {kpis.map((kpi, index) => (
          <div
            key={kpi.title}
            className="animate-in slide-in-from-bottom-2 duration-500"
            style={{ animationDelay: `${index * 100 + 500}ms` }}
          >
            <KPICard {...kpi} />
          </div>
        ))}
      </div>

      {/* AI Strategy Analysis - Only show when we have real analysis */}
      {aiAnalysis?.analysis ? (
        <Card className="mt-4 p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-foreground">
                  AI Strategy Analysis
                </h4>
                {aiAnalysis?.strategy_score !== undefined && (
                  <div className="text-xs font-medium text-primary">
                    Score: {aiAnalysis.strategy_score}/100
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                {aiAnalysis.analysis}
              </p>

              {aiAnalysis?.suggestions && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Optimization Suggestions:
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {aiAnalysis.suggestions}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        /* Skeleton for AI Analysis */
        <Card className="mt-4 p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div className="flex-1">
              <Skeleton
                count={9}
                baseColor="#1f2937"
                highlightColor="#374151"
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
