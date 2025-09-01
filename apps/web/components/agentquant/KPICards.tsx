import { Card } from '../ui/card';
import { TrendingUp, TrendingDown, Shield, Target } from 'lucide-react';

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

interface KPICardsProps {
  isVisible?: boolean;
  isRefinedStrategy?: boolean;
}

export function KPICards({
  isVisible = true,
  isRefinedStrategy = false,
}: KPICardsProps) {
  if (!isVisible) return null;

  // Different KPI values for refined strategy with RSI filter
  const kpis = isRefinedStrategy
    ? [
        {
          title: 'Total Return',
          value: '+143.8%',
          change: '+16.4%',
          changeType: 'positive' as const,
          icon: TrendingUp,
          description: 'vs Original: +127.4%',
        },
        {
          title: 'Sharpe Ratio',
          value: '2.12',
          change: '+15.2%',
          changeType: 'positive' as const,
          icon: Target,
          description: 'Improved risk-adjusted returns',
        },
        {
          title: 'Max Drawdown',
          value: '-12.1%',
          change: '-33.5%',
          changeType: 'positive' as const,
          icon: Shield,
          description: 'Lower risk with RSI filter',
        },
        {
          title: 'Win Rate',
          value: '81.2%',
          change: '9/11 trades',
          changeType: 'positive' as const,
          icon: Target,
          description: 'Higher precision',
        },
      ]
    : [
        {
          title: 'Total Return',
          value: '+127.4%',
          change: '+12.3%',
          changeType: 'positive' as const,
          icon: TrendingUp,
          description: 'vs Buy & Hold: +115.1%',
        },
        {
          title: 'Sharpe Ratio',
          value: '1.84',
          change: 'Good',
          changeType: 'positive' as const,
          icon: Target,
          description: 'Risk-adjusted returns',
        },
        {
          title: 'Max Drawdown',
          value: '-18.2%',
          change: 'Low Risk',
          changeType: 'positive' as const,
          icon: Shield,
          description: 'Peak-to-trough decline',
        },
        {
          title: 'Win Rate',
          value: '68.4%',
          change: '13/19 trades',
          changeType: 'positive' as const,
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
        <p className="text-sm text-muted-foreground">
          {isRefinedStrategy
            ? 'Golden Cross + RSI filter strategy • TSLA • 2020-2024'
            : 'Golden Cross strategy backtest results • TSLA • 2020-2024'}
        </p>
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

      {/* Strategy Summary */}
      <Card className="mt-4 p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
          <div>
            <h4 className="font-medium text-foreground mb-1">
              Strategy Insight
            </h4>
            <p className="text-sm text-muted-foreground">
              {isRefinedStrategy
                ? 'Adding RSI oversold filter (RSI < 30) significantly improved performance by reducing false signals. The strategy now enters only during oversold conditions, resulting in better risk-adjusted returns.'
                : 'The Golden Cross strategy significantly outperformed buy-and-hold with lower volatility. Best entry signals occurred during market uptrends with strong volume confirmation.'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
