import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '../use-mobile'

describe('useIsMobile', () => {
  let originalInnerWidth: number
  let mockMatchMedia: jest.Mock

  beforeEach(() => {
    originalInnerWidth = window.innerWidth
    
    // Mock matchMedia
    mockMatchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }))
    
    window.matchMedia = mockMatchMedia
  })

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
  })

  it('should return true when viewport is mobile size', () => {
    // Set mobile viewport width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })

    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(true)
  })

  it('should return false when viewport is desktop size', () => {
    // Set desktop viewport width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(false)
  })

  it('should return false when viewport is exactly at breakpoint', () => {
    // Set viewport width to exactly the breakpoint
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    })

    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(false)
  })

  it('should update when viewport is resized', () => {
    // Start with desktop size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const mediaQueryList = {
      matches: false,
      media: '(max-width: 767px)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    
    mockMatchMedia.mockReturnValue(mediaQueryList)
    
    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(false)
    
    // Simulate resize to mobile
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })
      
      // Call the change listener
      const changeListener = mediaQueryList.addEventListener.mock.calls[0][1]
      changeListener()
    })
    
    expect(result.current).toBe(true)
  })

  it('should cleanup event listener on unmount', () => {
    const mediaQueryList = {
      matches: false,
      media: '(max-width: 767px)',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    
    mockMatchMedia.mockReturnValue(mediaQueryList)
    
    const { unmount } = renderHook(() => useIsMobile())
    
    expect(mediaQueryList.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    
    unmount()
    
    expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('should handle edge case of very small viewport', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 320,
    })

    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(true)
  })
})