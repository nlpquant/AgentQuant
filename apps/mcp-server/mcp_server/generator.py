from jinja2 import Template


STRATEGY_TEMPLATE = """
class GeneratedStrategy(bt.Strategy):
    def __init__(self):
        # Initialize signals tracking
        self.signals = []
        self.trades = []

        # Initialize indicators and variables
        {{ init_code | indent(8) }}

    def next(self):
        # Strategy logic for each bar
        {{ next_code | indent(8) }}

        # Capture all crossover signals for analysis (even if we don't trade)
        if hasattr(self, 'crossover'):
            if self.crossover[0] > 0 and self.position:
                # Upward crossover but already have position - still capture signal
                try:
                    signal = {
                        "type": "BUY_SIGNAL",
                        "date": self.data.datetime.date(0).isoformat(),
                        "price": float(self.data.close[0]),
                        "timestamp": int(self.data.datetime.datetime(0).timestamp() * 1000),
                    }
                    self.signals.append(signal)
                except:
                    pass
            elif self.crossover[0] < 0 and not self.position:
                # Downward crossover but no position - still capture signal
                try:
                    signal = {
                        "type": "SELL_SIGNAL",
                        "date": self.data.datetime.date(0).isoformat(),
                        "price": float(self.data.close[0]),
                        "timestamp": int(self.data.datetime.datetime(0).timestamp() * 1000),
                    }
                    self.signals.append(signal)
                except:
                    pass

    def capture_buy_signal(self, size=None, price=None):
        \"\"\"Capture buy signal for tracking\"\"\"
        if len(self.data) > 0:
            try:
                signal = {
                    "type": "BUY",
                    "date": self.data.datetime.date(0).isoformat(),
                    "price": price if price is not None else float(self.data.close[0]),
                    "timestamp": int(self.data.datetime.datetime(0).timestamp() * 1000),
                }
                self.signals.append(signal)
            except:
                pass

    def capture_sell_signal(self, size=None, price=None):
        \"\"\"Capture sell signal for tracking\"\"\"
        if len(self.data) > 0:
            try:
                signal = {
                    "type": "SELL",
                    "date": self.data.datetime.date(0).isoformat(),
                    "price": price if price is not None else float(self.data.close[0]),
                    "timestamp": int(self.data.datetime.datetime(0).timestamp() * 1000),
                }
                self.signals.append(signal)
            except:
                pass

    def notify_trade(self, trade):
        \"\"\"Capture completed trades\"\"\"
        if trade.isclosed:
            self.trades.append({
                "entry_date": trade.dtopen,
                "exit_date": trade.dtclose,
                "pnl": trade.pnl
            })

    def get_signals(self):
        return self.signals

    def get_trades(self):
        return self.trades

    def get_performance_summary(self):
        return {"total_trades": len(self.trades)}
"""

strategy_template = Template(STRATEGY_TEMPLATE.strip())


def generate_strategy_code(init_code: str, next_code: str) -> str:
    return str(
        strategy_template.render(
            init_code=init_code.strip(), next_code=next_code.strip()
        )
    )


EXECUTION_TEMPLATE = """
import backtrader as bt
import pandas as pd
import yfinance as yf
import json

# Generated strategy code
{{strategy_code}}

def safe_convert_ohlcv_data(data):
    try:
        return data.reset_index().to_dict('records')[:30]
    except Exception as e:
        print(f"OHLCV conversion error: {e}, data shape: {data.shape}, columns: {list(data.columns)}")
        # Return empty list if conversion fails
        return []

def run_backtest():
    try:
        # Create a minimal Cerebro instance to avoid complex broker interactions
        cerebro = bt.Cerebro()

        # Add strategy
        cerebro.addstrategy(GeneratedStrategy)
        cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name='sharpe')
        cerebro.addanalyzer(bt.analyzers.DrawDown, _name='drawdown')
        cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name='trades')

        # Extend start date by 30 days to ensure indicators have enough warm-up period
        from datetime import datetime, timedelta
        original_start = datetime.strptime('{{start_date}}', '%Y-%m-%d')
        extended_start = original_start - timedelta(days=30)
        extended_start_str = extended_start.strftime('%Y-%m-%d')

        # Fetch data with extended period
        data = yf.download('{{ticker}}', start=extended_start_str, end='{{end_date}}', progress=False, auto_adjust=False)
        if data.empty:
            raise ValueError(f"No data found for symbol {'{{ticker}}'}")

        # Handle yfinance MultiIndex columns by flattening them
        if isinstance(data.columns, pd.MultiIndex):
            # Flatten MultiIndex columns - take just the price data names
            data.columns = [col[0] for col in data.columns]

        # Ensure standard column names that Backtrader expects
        expected_cols = {'Open', 'High', 'Low', 'Close', 'Volume'}
        if not expected_cols.issubset(set(data.columns)):
            # Map any non-standard column names
            col_mapping = {}
            for col in data.columns:
                if 'open' in col.lower():
                    col_mapping[col] = 'Open'
                elif 'high' in col.lower():
                    col_mapping[col] = 'High'
                elif 'low' in col.lower():
                    col_mapping[col] = 'Low'
                elif 'close' in col.lower():
                    col_mapping[col] = 'Close'
                elif 'volume' in col.lower():
                    col_mapping[col] = 'Volume'
            if col_mapping:
                data = data.rename(columns=col_mapping)

        # Create data feed with standard configuration
        data_feed = bt.feeds.PandasData(dataname=data)
        cerebro.adddata(data_feed)

        # Set initial cash
        cerebro.broker.setcash({{initial_cash}})
        cerebro.addsizer(bt.sizers.PercentSizer, percents=100)
        # Skip commission setting to avoid _name attribute errors in crossover strategies
        # Commission will default to 0 which is fine for backtesting

        # Run backtest
        strategies = cerebro.run()
        if not strategies or len(strategies) == 0:
            raise ValueError("No strategies returned from cerebro.run()")
        strategy = strategies[0]

        # Get results
        final_value = cerebro.broker.getvalue()

        # Check if strategy has required methods
        if not hasattr(strategy, 'get_signals'):
            raise AttributeError("Strategy does not have get_signals method - inheritance issue")
        if not hasattr(strategy, 'get_trades'):
            raise AttributeError("Strategy does not have get_trades method - inheritance issue")
        # if not hasattr(strategy, 'get_performance_summary'):
        #     raise AttributeError("Strategy does not have get_performance_summary method - inheritance issue")

        # Extract analyzer results
        sharpe = strategy.analyzers.sharpe.get_analysis().get('sharperatio', None)
        drawdown = strategy.analyzers.drawdown.get_analysis().max.drawdown
        trades = strategy.analyzers.trades.get_analysis()

        # Example win rate from trades analyzer
        total_trades = trades.total.closed if hasattr(trades.total, 'closed') else 0
        won_trades = trades.won.total if hasattr(trades.won, 'total') else 0
        win_rate = (won_trades / total_trades * 100) if total_trades > 0 else 0

        return {
            'success': True,
            'final_value': final_value,
            'initial_cash': {{initial_cash}},
            'kpis': {
                'sharpe_ratio': sharpe,
                'max_drawdown': drawdown,
                'total_return': ((final_value - {{initial_cash}}) / {{initial_cash}}) * 100,
                'win_rate': win_rate,
                'total_trades': total_trades,
            },
            'signals': strategy.get_signals(),
            'trades': strategy.get_trades(),
            'ohlcv_data': safe_convert_ohlcv_data(data),
            # 'performance_summary': strategy.get_performance_summary()
        }

    except Exception as e:
        import traceback
        return {
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__,
            'traceback': traceback.format_exc()
        }

if __name__ == '__main__':
    result = run_backtest()
    print(json.dumps(result, default=str))
"""

execution_template = Template(EXECUTION_TEMPLATE.strip())


def generate_execution_code(strategy_code, initial_cash, ticker, start_date, end_date):
    return execution_template.render(
        strategy_code=strategy_code,
        initial_cash=initial_cash,
        ticker=ticker,
        start_date=start_date,
        end_date=end_date,
    )


EXECUTION_WITH_DATA_TEMPLATE = """
import os
import backtrader as bt
import pandas as pd
import json

# Generated strategy code
{{strategy_code}}


def raw_to_ohlcv(data_file: str) -> pd.DataFrame:
    with open(data_file, "r") as f:
        raw_data = json.loads(f.read())
        columns = ['timestamp', 'Open', 'High', 'Low', 'Close', 'Volume']
        df = pd.DataFrame(raw_data, columns=columns)
        target_column_order = ["Close", "High", "Low", "Open", "Volume"]
        df_final = (
            df.assign(Date=pd.to_datetime(df['timestamp'], unit='ms').dt.normalize())
            .set_index('Date')
            .drop(columns=['timestamp'])
            .reindex(columns=target_column_order)
        )
        df_final['Volume'] = df_final['Volume'].astype(int)
    return df_final

def run_backtest():
    try:
        # Create a minimal Cerebro instance to avoid complex broker interactions
        cerebro = bt.Cerebro()

        # Add strategy
        cerebro.addstrategy(GeneratedStrategy)
        cerebro.addanalyzer(bt.analyzers.SharpeRatio, _name='sharpe')
        cerebro.addanalyzer(bt.analyzers.DrawDown, _name='drawdown')
        cerebro.addanalyzer(bt.analyzers.TradeAnalyzer, _name='trades')

        data = raw_to_ohlcv(os.getenv("RAW_DATA_FILE"))

        # Create data feed with standard configuration
        data_feed = bt.feeds.PandasData(dataname=data)
        cerebro.adddata(data_feed)

        # Set initial cash
        cerebro.broker.setcash({{initial_cash}})
        cerebro.addsizer(bt.sizers.PercentSizer, percents=100)
        # Skip commission setting to avoid _name attribute errors in crossover strategies
        # Commission will default to 0 which is fine for backtesting

        # Run backtest
        strategies = cerebro.run()
        if not strategies or len(strategies) == 0:
            raise ValueError("No strategies returned from cerebro.run()")
        strategy = strategies[0]

        # Get results
        final_value = cerebro.broker.getvalue()

        # Check if strategy has required methods
        if not hasattr(strategy, 'get_signals'):
            raise AttributeError("Strategy does not have get_signals method - inheritance issue")
        if not hasattr(strategy, 'get_trades'):
            raise AttributeError("Strategy does not have get_trades method - inheritance issue")
        # if not hasattr(strategy, 'get_performance_summary'):
        #     raise AttributeError("Strategy does not have get_performance_summary method - inheritance issue")

        # Extract analyzer results
        sharpe = strategy.analyzers.sharpe.get_analysis().get('sharperatio', None)
        drawdown = strategy.analyzers.drawdown.get_analysis().max.drawdown
        trades = strategy.analyzers.trades.get_analysis()

        # Example win rate from trades analyzer
        total_trades = trades.total.closed if hasattr(trades.total, 'closed') else 0
        won_trades = trades.won.total if hasattr(trades.won, 'total') else 0
        win_rate = (won_trades / total_trades * 100) if total_trades > 0 else 0

        return {
            'success': True,
            'final_value': final_value,
            'initial_cash': {{initial_cash}},
            'kpis': {
                'sharpe_ratio': sharpe,
                'max_drawdown': drawdown,
                'total_return': ((final_value - {{initial_cash}}) / {{initial_cash}}) * 100,
                'win_rate': win_rate,
                'total_trades': total_trades,
            },
            'signals': strategy.get_signals(),
            'trades': strategy.get_trades()
        }

    except Exception as e:
        import traceback
        return {
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__,
            'traceback': traceback.format_exc()
        }

if __name__ == '__main__':
    result = run_backtest()
    print(json.dumps(result, default=str))
"""


execution_with_data_template = Template(EXECUTION_WITH_DATA_TEMPLATE.strip())

def generate_execution_with_data_code(strategy_code, initial_cash):
    return execution_with_data_template.render(
        strategy_code=strategy_code, initial_cash=initial_cash
    )
