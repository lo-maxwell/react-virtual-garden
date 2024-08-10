Cypress.Commands.add("visitGarden", () => {
  cy.visit("https://react-virtual-garden.vercel.app/garden");

  //wait for garden page to load
  cy.intercept("POST", "/_vercel/insights/view").as("pageLoaded");
  cy.wait("@pageLoaded");
});
