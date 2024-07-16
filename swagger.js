const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Social',
    description: 'Description'
  },
  host: 'week4-5eud.onrender.com',
  basePath: "/",
  schemes: ["https"],
  securityDefinitions: {
    apiKeyAuth: {
      type: "apiKey",
      in: "header",
      name: "Authorization",
      description: "請加上 Bearer 'Token' 以取得授權",
    },
  },
};

const outputFile = './swagger-output.json';
const routes = ['./app.js'];

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the 
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

swaggerAutogen(outputFile, routes, doc);