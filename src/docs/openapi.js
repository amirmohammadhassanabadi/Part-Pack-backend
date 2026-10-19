const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "Part Pax API",
      version: "1.0.0",
      description: "Part Pax backend API documentation",
    },

    servers: [
      {
        url: "/api/v1",
        description: "API v1",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },

      schemas: {},
    },
  },

  apis: ["./src/docs/schemas/*.js", "./src/docs/paths/*.js",],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
