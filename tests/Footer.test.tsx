import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Footer from '@/components/Footer'

describe('Footer Component', () => {
  it('renders correctly and matches snapshot', () => {
    const { container } = render(<Footer />)
    expect(container).toMatchSnapshot()
  })

  it('contains correct copyright text', () => {
    const { getByText } = render(<Footer />)
    expect(getByText('All rights reserved with Dev-Shivam-05')).toBeDefined()
  })
})
