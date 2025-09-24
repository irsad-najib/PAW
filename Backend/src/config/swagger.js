const swaggerJsDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PAW API",
      version: "1.0.0",
      description: "Dokumentasi REST API PAW",
    },
    servers: [{ url: "http://localhost:3000", description: "Local" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userID: { type: "string" },
            UserName: { type: "string" },
            Role: { type: "string", enum: ["admin", "user"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        RegisterUserInput: {
          type: "object",
          required: ["userID", "UserName", "password"],
          properties: {
            userID: { type: "string" },
            UserName: { type: "string" },
            password: { type: "string" },
            Role: { type: "string", enum: ["admin", "user"] },
          },
        },
        LoginUserInput: {
          type: "object",
          required: ["password"],
          properties: {
            userID: { type: "string" },
            UserName: { type: "string" },
            password: { type: "string" },
          },
        },
        Menu: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            price: { type: "number" },
            category: { type: "string" },
          },
        },
        Order: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  menuId: { type: "string" },
                  qty: { type: "integer" },
                },
              },
            },
            total: { type: "number" },
            status: { type: "string" },
          },
        },
        Holiday: {
          type: "object",
          properties: {
            _id: { type: "string" },
            date: { type: "string", format: "date" },
            name: { type: "string" },
            isOff: { type: "boolean" },
          },
        },
        ApiError: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsDoc(options);
