import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the board, draw area and score without storage', () => {
    const html = renderToString(<App />)
    expect(html).toContain('Stack Match')
    expect(html.match(/class="slot /g)).toHaveLength(15)
    expect(html.match(/: locked"/g)).toHaveLength(5)
    expect(html).toContain('Draw a card, 7 left')
    expect(html).toContain('60,000')
  })
})
