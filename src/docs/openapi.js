const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "Part Pack API",
      version: "1.0.0",
      description: "Part-Pack backend API documentation",
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

  apis: ["./src/modules/**/routes/*.routes.js", "./src/docs/schemas/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
