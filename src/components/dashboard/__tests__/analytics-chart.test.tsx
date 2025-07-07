import { render, screen, waitFor, act } from '@testing-library/react'
import { AnalyticsChart } from '../analytics-chart'
import { ThemeProvider } from 'next-themes'

// Mock the dashboard data hook
jest.mock('@/lib/hooks/use-dashboard-data')

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}))

describe('AnalyticsChart', () => {
  const mockUseDashboardData = require('@/lib/hooks/use-dashboard-data').useDashboardData as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider attribute="class" defaultTheme="light">
        {component}
      </ThemeProvider>
    )
  }

  it('should show loading state initially', () => {
    mockUseDashboardData.mockReturnValue({
      stats: null,
      loading: true,
      error: null
    })
    
    renderWithTheme(<AnalyticsChart />)
    
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument()
  })

  it('should render chart with data', async () => {
    const mockData = {
      last_7_days: [
        { name: 'Mon', users: 10, events: 20, date: '2024-01-01' },
        { name: 'Tue', users: 15, events: 25, date: '2024-01-02' },
        { name: 'Wed', users: 12, events: 22, date: '2024-01-03' },
        { name: 'Thu', users: 18, events: 30, date: '2024-01-04' },
        { name: 'Fri', users: 20, events: 35, date: '2024-01-05' },
        { name: 'Sat', users: 25, events: 40, date: '2024-01-06' },
        { name: 'Sun', users: 22, events: 38, date: '2024-01-07' },
      ],
    }

    mockUseDashboardData.mockReturnValue({
      stats: mockData,
      loading: false,
      error: null
    })

    await act(async () => {
      renderWithTheme(<AnalyticsChart />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })
  })

  it('should handle errors gracefully', async () => {
    mockUseDashboardData.mockReturnValue({
      stats: null,
      loading: false,
      error: new Error('Database error')
    })

    await act(async () => {
      renderWithTheme(<AnalyticsChart />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    // Should still render the chart with empty data
    expect(screen.queryByText('Loading analytics...')).not.toBeInTheDocument()
  })

  it('should render chart with empty data when no stats', async () => {
    mockUseDashboardData.mockReturnValue({
      stats: null,
      loading: false,
      error: null
    })

    await act(async () => {
      renderWithTheme(<AnalyticsChart />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })
  })

  it('should use cached data from hook', async () => {
    const mockData = {
      last_7_days: [
        { name: 'Mon', users: 5, events: 10, date: '2024-01-01' },
      ],
    }

    mockUseDashboardData.mockReturnValue({
      stats: mockData,
      loading: false,
      error: null
    })

    await act(async () => {
      renderWithTheme(<AnalyticsChart />)
    })

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    // Verify the hook was called
    expect(mockUseDashboardData).toHaveBeenCalled()
  })
})