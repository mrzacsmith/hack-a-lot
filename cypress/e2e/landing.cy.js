describe('Landing Page', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('displays hero section for non-authenticated users', () => {
    cy.contains('Discover & Join')
    cy.contains('Amazing Hackathons')
    cy.contains('Your one-stop platform for discovering exciting hackathons')
  })

  it('has working navigation buttons', () => {
    cy.contains('a', 'Get Started').should('have.attr', 'href', '/register')
    cy.contains('a', 'Sign In').should('have.attr', 'href', '/login')
  })

  it('displays hackathons section', () => {
    cy.contains('h2', 'Upcoming & Active Hackathons')
    cy.contains('Join exciting events and showcase your innovation')
  })

  it('shows loading state initially', () => {
    cy.get('.animate-spin').should('exist')
  })

  it('displays hackathon cards after loading', () => {
    // Wait for loading spinner to disappear
    cy.get('.animate-spin').should('not.exist', { timeout: 10000 })

    // Check if hackathon grid exists
    cy.get('.grid').should('exist')

    // Check for hackathon cards
    cy.get('.grid > div').then(($cards) => {
      if ($cards.length > 0) {
        // Verify the first card has either an image or a placeholder
        cy.wrap($cards).first().find('img, .bg-gray-200').should('exist')
      }
    })
  })

  it('has working navigation in header', () => {
    cy.get('a').contains('HackALot').should('exist')
    cy.get('a').contains('Login').should('exist')
    cy.get('a').contains('Register').should('exist')
  })
})
