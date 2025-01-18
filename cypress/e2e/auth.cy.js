describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('displays login form', () => {
    cy.contains('Sign in to your account')
  })

  it('has email and password inputs', () => {
    cy.get('input[type="email"]').should('exist')
    cy.get('input[type="password"]').should('exist')
  })

  it('has a sign in button', () => {
    cy.get('button[type="submit"]').should('exist')
    cy.contains('button', 'Sign in')
  })

  // it('shows error for invalid email format', () => {
  //   cy.get('input[type="email"]').type('invalid-email')
  //   cy.get('input[type="password"]').type('password123')
  //   cy.get('button[type="submit"]').click()
  //   cy.contains("Please include an '@' in the email address. 'invalid-email' is missing an '@'.", {
  //     timeout: 10000,
  //   })
  // })

  it('shows error for empty password', () => {
    cy.get('input[type="email"]').type('test@example.com')
    cy.get('input[type="password"]').should('have.attr', 'required')
  })

  it('shows error for invalid credentials', () => {
    cy.get('input[type="email"]').type('test@example.com')
    cy.get('input[type="password"]').type('wrongpassword{enter}')
    cy.contains('Failed to sign in', { timeout: 10000 })
  })

  it('has password visibility toggle', () => {
    cy.get('input[type="password"]').should('exist')
    cy.get('button[type="button"]').click()
    cy.get('input[type="text"]').should('exist')
  })

  it('has remember me checkbox', () => {
    cy.get('input[type="checkbox"]').should('exist')
    cy.contains('label', 'Remember me')
  })

  it('has forgot password link', () => {
    cy.contains('a', 'Forgot your password?').should('have.attr', 'href', '/reset-password')
  })

  it('has sign up link', () => {
    cy.contains('a', "Don't have an account? Sign up").should('have.attr', 'href', '/register')
  })
})
